import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Scale, ScrollText, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { authFetch } from "@/lib/authClient";
import { queryClient } from "@/lib/queryClient";
import {
  LEGAL_REFERENCES,
  PENDING_LEGAL_DECISIONS,
  SUBJECT_REQUEST_LABELS,
  evaluateSubjectRequest,
  validateRetentionDays,
  type RetentionCategory,
  type SubjectRequestType,
} from "@shared/lgpd-compliance";

interface RetentionRule {
  category: RetentionCategory;
  label: string;
  basis: string;
  legalFloorDays: number;
  retentionDays: number;
  configured: boolean;
}
interface AuditEntry {
  source: "clinic" | "family_portal";
  id: string;
  at: string;
  action: string;
  targetType: string | null;
  metadata: Record<string, string | number | boolean | null>;
}

async function readJson<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as ({ error?: string } & T) | null;
  if (!response.ok) throw new Error(payload?.error || `Falha na API (${response.status}).`);
  return payload as T;
}
function fmt(value: string): string {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }).format(d);
}
const years = (days: number) => (days / 365).toFixed(days % 365 === 0 ? 0 : 1);

export function PrivacySection({ clinicId }: { clinicId: string }) {
  const headers = (json: boolean) => ({ ...(json ? { "Content-Type": "application/json" } : {}), "X-Tenant-Id": clinicId });
  const retentionUrl = `/api/live/governance/retention?clinicId=${encodeURIComponent(clinicId)}`;
  const retention = useQuery<{ rules: RetentionRule[]; migrationApplied: boolean }>({
    queryKey: [retentionUrl],
    queryFn: async () => readJson(await authFetch(retentionUrl, { headers: headers(false) })),
  });
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [ruleError, setRuleError] = useState<Record<string, string>>({});
  const save = useMutation({
    mutationFn: async ({ category, days }: { category: RetentionCategory; days: number }) =>
      readJson(await authFetch("/api/live/governance/retention", { method: "PUT", headers: headers(true), body: JSON.stringify({ clinicId, category, retentionDays: days }) })),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [retentionUrl] }),
    onError: (e: Error, v) => setRuleError((s) => ({ ...s, [v.category]: e.message })),
  });
  function submit(rule: RetentionRule) {
    const raw = drafts[rule.category] ?? String(rule.retentionDays);
    const days = Number(raw);
    const check = validateRetentionDays(rule.category, days);
    if (!check.ok) {
      setRuleError((s) => ({ ...s, [rule.category]: check.message }));
      return;
    }
    setRuleError((s) => ({ ...s, [rule.category]: "" }));
    save.mutate({ category: rule.category, days });
  }

  const [source, setSource] = useState("all");
  const [action, setAction] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [auditUrl, setAuditUrl] = useState<string | null>(null);
  const audit = useQuery<{ data: AuditEntry[] }>({
    queryKey: [auditUrl],
    queryFn: async () => readJson(await authFetch(auditUrl as string, { headers: headers(false) })),
    enabled: Boolean(auditUrl),
  });
  function consult() {
    const q = new URLSearchParams({ clinicId, source });
    if (action.trim()) q.set("action", action.trim());
    if (from) q.set("from", from);
    if (to) q.set("to", to);
    setAuditUrl(`/api/live/governance/audit?${q.toString()}`);
  }

  const [subjectType, setSubjectType] = useState<SubjectRequestType>("deletion");
  const [within, setWithin] = useState(true);
  const outcome = evaluateSubjectRequest(subjectType, { withinRecordRetention: within });

  return (
    <div className="space-y-5" data-testid="privacy-section">
      <section className="space-y-3 rounded-2xl border bg-card p-5" data-testid="retention-card">
        <h2 className="flex items-center gap-2 text-sm font-bold"><ShieldCheck className="h-4 w-4" /> Retenção de dados</h2>
        <p className="text-xs text-muted-foreground">O prontuário não pode ser eliminado antes de 20 anos do último registro (Lei 13.787/2018, art. 6º). Você pode ampliar o prazo, nunca reduzi-lo.</p>
        {retention.data && !retention.data.migrationApplied ? <p className="text-xs font-semibold text-amber-700" data-testid="retention-migration-pending">Regras personalizadas dependem da migration 0036 (ainda não aplicada); valem os padrões abaixo.</p> : null}
        <ul className="space-y-3">
          {(retention.data?.rules ?? []).map((rule) => (
            <li key={rule.category} className="rounded-xl border p-3 text-xs" data-testid={`retention-${rule.category}`}>
              <p className="font-semibold">{rule.label}</p>
              <p className="text-muted-foreground">{rule.basis}{rule.legalFloorDays ? ` · piso legal ${years(rule.legalFloorDays)} anos` : " · sem piso legal assumido"}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <input aria-label={`Dias de retenção: ${rule.label}`} data-testid={`retention-input-${rule.category}`} className="w-28 rounded-md border bg-background px-2 py-1" inputMode="numeric" value={drafts[rule.category] ?? String(rule.retentionDays)} onChange={(e) => setDrafts((s) => ({ ...s, [rule.category]: e.target.value }))} />
                <span>dias ({years(Number(drafts[rule.category] ?? rule.retentionDays) || 0)} anos)</span>
                <Button type="button" size="sm" onClick={() => submit(rule)} data-testid={`retention-save-${rule.category}`}>Salvar</Button>
              </div>
              {ruleError[rule.category] ? <p role="alert" className="mt-1 font-semibold text-destructive" data-testid={`retention-error-${rule.category}`}>{ruleError[rule.category]}</p> : null}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3 rounded-2xl border bg-card p-5" data-testid="subject-card">
        <h2 className="flex items-center gap-2 text-sm font-bold"><Scale className="h-4 w-4" /> Pedidos do titular (LGPD art. 18)</h2>
        <p className="text-xs text-muted-foreground">Orientação para o médico; a decisão é sua e do jurídico. Resposta em até 15 dias (art. 19, II).</p>
        <div className="flex flex-wrap gap-2 text-xs">
          <select aria-label="Tipo de pedido" data-testid="subject-type" className="rounded-md border bg-background px-2 py-1" value={subjectType} onChange={(e) => setSubjectType(e.target.value as SubjectRequestType)}>
            {Object.entries(SUBJECT_REQUEST_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <label className="flex items-center gap-1"><input type="checkbox" data-testid="subject-within" checked={within} onChange={(e) => setWithin(e.target.checked)} /> Há prontuário dentro do prazo de 20 anos</label>
        </div>
        <p className="rounded-md bg-muted/50 p-3 text-xs" data-testid="subject-outcome" data-decision={outcome.decision}>{outcome.reason}</p>
      </section>

      <section className="space-y-3 rounded-2xl border bg-card p-5" data-testid="audit-card">
        <h2 className="flex items-center gap-2 text-sm font-bold"><ScrollText className="h-4 w-4" /> Trilha de auditoria</h2>
        <div className="flex flex-wrap items-end gap-2 text-xs">
          <label>Origem
            <select data-testid="audit-source" className="ml-1 rounded-md border bg-background px-2 py-1" value={source} onChange={(e) => setSource(e.target.value)}>
              <option value="all">Todas</option><option value="clinic">Clínica</option><option value="family_portal">Portal da família</option>
            </select>
          </label>
          <label>Ação <input data-testid="audit-action" className="ml-1 w-40 rounded-md border bg-background px-2 py-1" value={action} onChange={(e) => setAction(e.target.value)} placeholder="ex.: ai_use" /></label>
          <label>De <input data-testid="audit-from" type="date" className="ml-1 rounded-md border bg-background px-2 py-1" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
          <label>Até <input data-testid="audit-to" type="date" className="ml-1 rounded-md border bg-background px-2 py-1" value={to} onChange={(e) => setTo(e.target.value)} /></label>
          <Button type="button" size="sm" onClick={consult} data-testid="audit-consult">Consultar</Button>
        </div>
        {audit.error ? <p role="alert" className="text-xs font-semibold text-destructive">{(audit.error as Error).message}</p> : null}
        <ul className="space-y-1 text-xs" data-testid="audit-list">
          {(audit.data?.data ?? []).map((e) => (
            <li key={`${e.source}-${e.id}`} className="flex flex-wrap gap-2 rounded-md border p-2" data-testid="audit-row">
              <Badge variant="outline">{e.source === "family_portal" ? "Portal" : "Clínica"}</Badge>
              <span className="font-semibold">{e.action}</span>
              <span className="text-muted-foreground">{fmt(e.at)}</span>
            </li>
          ))}
          {auditUrl && !audit.isFetching && (audit.data?.data ?? []).length === 0 ? <li className="text-muted-foreground" data-testid="audit-empty">Nenhum evento no filtro.</li> : null}
        </ul>
      </section>

      <section className="space-y-2 rounded-2xl border bg-card p-5" data-testid="legal-card">
        <h2 className="text-sm font-bold">Base legal e pendências</h2>
        <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
          {LEGAL_REFERENCES.slice(0, 6).map((r) => <li key={r.id}><span className="font-semibold text-foreground">{r.source}, {r.article}:</span> {r.summary}</li>)}
        </ul>
        <p className="pt-2 text-xs font-semibold">Pendentes de decisão do médico/jurídico</p>
        <ul className="list-disc space-y-1 pl-5 text-xs" data-testid="pending-decisions">
          {PENDING_LEGAL_DECISIONS.map((d) => <li key={d.id}>{d.question}</li>)}
        </ul>
      </section>
    </div>
  );
}
