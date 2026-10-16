import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Bot, Clipboard, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useClinic } from "@/contexts/ClinicContext";
import { authFetch } from "@/lib/authClient";
import { queryClient } from "@/lib/queryClient";
import {
  AI_DATA_SHARING,
  AI_FAMILY_STATUS,
  AI_PURPOSES,
  AI_RISK_LEVELS,
  type AiDataSharing,
  type AiFamilyStatus,
  type AiPurpose,
  type AiRiskLevel,
} from "@shared/lgpd-compliance";

interface AiRecord {
  id: string;
  actorName: string;
  tool: string;
  purpose: AiPurpose;
  dataSharing: AiDataSharing;
  riskLevel: AiRiskLevel | null;
  humanReviewed: boolean;
  usedAt: string;
  familyStatus: AiFamilyStatus;
  suggestedChartLine: string;
}

function fmt(value: string): string {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }).format(d);
}
async function readJson<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as ({ error?: string } & T) | null;
  if (!response.ok) throw new Error(payload?.error || `Falha na API (${response.status}).`);
  return payload as T;
}

/**
 * Registro de uso de IA (CFM 2.454/2026, art. 4º, V): quem, quando, qual ferramenta, finalidade,
 * dados enviados, revisão humana, linha sugerida para o prontuário e ciência da família.
 * Não guarda conteúdo clínico nem resultado de teste.
 */
export function AiUseRegistryPanel({ patientId, defaultTool = "" }: { patientId: string; defaultTool?: string }) {
  const { toast } = useToast();
  const { accessMode, isAuthenticated } = useAuth();
  const { activeClinicId } = useClinic() as { activeClinicId: string | null };
  const enabled = accessMode === "remote" && isAuthenticated && Boolean(activeClinicId) && Boolean(patientId);

  const [tool, setTool] = useState(defaultTool);
  const [purpose, setPurpose] = useState<AiPurpose>("redacao_documento");
  const [dataSharing, setDataSharing] = useState<AiDataSharing>("pseudonimizado");
  const [riskLevel, setRiskLevel] = useState<AiRiskLevel | "">("");
  const [reviewed, setReviewed] = useState(false);
  const [error, setError] = useState("");

  const url = `/api/live/ai-use?clinicId=${encodeURIComponent(activeClinicId ?? "")}&patientId=${encodeURIComponent(patientId)}`;
  const headers = (json: boolean) => ({ ...(json ? { "Content-Type": "application/json" } : {}), ...(activeClinicId ? { "X-Tenant-Id": activeClinicId } : {}) });
  const list = useQuery<{ data: AiRecord[] }>({ queryKey: [url], queryFn: async () => readJson(await authFetch(url, { headers: headers(false) })), enabled });

  const create = useMutation({
    mutationFn: async () =>
      readJson<AiRecord>(
        await authFetch("/api/live/ai-use", {
          method: "POST",
          headers: headers(true),
          body: JSON.stringify({ clinicId: activeClinicId, patientId, tool, purpose, dataSharing, riskLevel: riskLevel || null, humanReviewed: reviewed, usedAt: new Date().toISOString() }),
        }),
      ),
    onSuccess: () => {
      setError("");
      setReviewed(false);
      void queryClient.invalidateQueries({ queryKey: [url] });
      toast({ title: "Uso de IA registrado" });
    },
    onError: (e: Error) => setError(e.message),
  });
  const ack = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "informada" | "recusou" }) =>
      readJson<AiRecord>(await authFetch("/api/live/ai-use", { method: "PATCH", headers: headers(true), body: JSON.stringify({ clinicId: activeClinicId, id, status, informedAt: new Date().toISOString() }) })),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [url] }),
    onError: (e: Error) => setError(e.message),
  });

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Linha copiada para o prontuário" });
    } catch {
      toast({ title: "Não foi possível copiar", variant: "destructive" });
    }
  }

  if (!enabled) return null;
  const records = list.data?.data ?? [];

  return (
    <Card className="border-card-border" data-testid="ai-use-panel">
      <CardContent className="space-y-4 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-sm font-bold"><Bot className="h-4 w-4" /> Registro de uso de IA</p>
            <p className="text-xs text-muted-foreground">Resolução CFM 2.454/2026: registre quando a IA foi usada como apoio. A decisão é sempre do médico. Não registre conteúdo clínico aqui.</p>
          </div>
          <Badge variant="secondary">metadados apenas</Badge>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1 text-xs font-semibold">Ferramenta de IA
            <input data-testid="ai-tool" className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm font-normal" value={tool} onChange={(e) => setTool(e.target.value)} maxLength={80} placeholder="Nome da ferramenta" />
          </label>
          <label className="space-y-1 text-xs font-semibold">Finalidade
            <select data-testid="ai-purpose" className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm font-normal" value={purpose} onChange={(e) => setPurpose(e.target.value as AiPurpose)}>
              {Object.entries(AI_PURPOSES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <label className="space-y-1 text-xs font-semibold">Dados enviados à IA
            <select data-testid="ai-sharing" className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm font-normal" value={dataSharing} onChange={(e) => setDataSharing(e.target.value as AiDataSharing)}>
              {Object.entries(AI_DATA_SHARING).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <label className="space-y-1 text-xs font-semibold">Grau de risco (definido pela clínica/jurídico — opcional)
            <select data-testid="ai-risk" className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm font-normal" value={riskLevel} onChange={(e) => setRiskLevel(e.target.value as AiRiskLevel | "")}>
              <option value="">Não definido</option>
              {Object.entries(AI_RISK_LEVELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
        </div>
        <label className="flex items-start gap-2 text-xs" data-testid="ai-reviewed-label">
          <input data-testid="ai-reviewed" type="checkbox" checked={reviewed} onChange={(e) => setReviewed(e.target.checked)} className="mt-0.5" />
          <span>Revisei criticamente o resultado e mantive a decisão final (art. 4º, I e II).</span>
        </label>
        {error ? <p role="alert" data-testid="ai-error" className="text-xs font-semibold text-destructive">{error}</p> : null}
        <Button data-testid="ai-register" type="button" onClick={() => create.mutate()} disabled={create.isPending || tool.trim().length < 2}>
          <ShieldCheck className="mr-2 h-4 w-4" /> Registrar uso de IA
        </Button>

        <ul className="space-y-3" data-testid="ai-list">
          {records.map((r) => (
            <li key={r.id} className="rounded-xl border p-3 text-xs" data-testid="ai-record" data-ai-id={r.id}>
              <p className="font-semibold">{r.tool} · {AI_PURPOSES[r.purpose]} · {fmt(r.usedAt)}</p>
              <p className="text-muted-foreground">Por {r.actorName} · {AI_DATA_SHARING[r.dataSharing]}{r.riskLevel ? ` · risco ${AI_RISK_LEVELS[r.riskLevel]}` : ""}</p>
              <p className="mt-2 rounded-md bg-muted/50 p-2" data-testid="ai-chart-line">{r.suggestedChartLine}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => void copy(r.suggestedChartLine)} data-testid="ai-copy-line"><Clipboard className="mr-1 h-3 w-3" /> Copiar linha</Button>
                <Badge variant="outline" data-testid="ai-family-status">{AI_FAMILY_STATUS[r.familyStatus]}</Badge>
                {r.familyStatus === "nao_informada" ? (
                  <>
                    <Button type="button" size="sm" variant="secondary" onClick={() => ack.mutate({ id: r.id, status: "informada" })} data-testid="ai-family-informed">Marcar: família informada</Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => ack.mutate({ id: r.id, status: "recusou" })} data-testid="ai-family-refused">Família recusou</Button>
                  </>
                ) : null}
              </div>
            </li>
          ))}
          {records.length === 0 ? <li className="text-xs text-muted-foreground" data-testid="ai-empty">Nenhum uso de IA registrado para este paciente.</li> : null}
        </ul>
      </CardContent>
    </Card>
  );
}
