import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Clipboard, HeartHandshake, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useClinic } from "@/contexts/ClinicContext";
import { authFetch } from "@/lib/authClient";
import { queryClient } from "@/lib/queryClient";
import {
  FAMILY_PORTAL_LIMITS,
  OWN_TEST_LABELS,
  ORIENTATION_TEMPLATES,
  REMINDER_KINDS,
  buildFamilyMessageDraft,
  type OwnTestId,
  type PortalOwnTest,
  type PortalQuestionnaire,
  type PortalReminder,
  type ReminderKind,
} from "@shared/family-portal";

interface ShareItem {
  id: string;
  status: "active" | "revoked" | "expired" | "exhausted";
  expiresAt: string;
  maxViews: number;
  viewCount: number;
  consentedAt: string | null;
  createdAt: string;
}
interface DocItem {
  id: string;
  documentType: string;
  origin: string;
  status: string;
  familyVisibility: boolean;
  version?: { content?: unknown };
}

const statusLabel: Record<ShareItem["status"], string> = { active: "Ativo", revoked: "Cancelado", expired: "Expirado", exhausted: "Aberturas esgotadas" };
const reminderLabel: Record<ReminderKind, string> = { consulta: "Consulta", questionario: "Questionário", documentos: "Documentos", exame: "Exame", outro: "Outro" };

function fmt(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }).format(d);
}
function docTitle(doc: DocItem): string {
  const c = doc.version?.content;
  if (c && typeof c === "object" && typeof (c as { title?: unknown }).title === "string") return (c as { title: string }).title;
  return `Documento (${doc.documentType})`;
}
async function readJson<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as ({ error?: string } & T) | null;
  if (!response.ok) throw new Error(payload?.error || `Falha na API (${response.status}).`);
  return payload as T;
}
function origin(): string {
  const configured = (import.meta.env?.VITE_API_URL ?? "").replace(/\/$/, "");
  if (!configured) return window.location.origin;
  try { return new URL(configured, window.location.origin).origin; } catch { return window.location.origin; }
}

export function FamilyPortalPanel({ patientId }: { patientId: string }) {
  const { toast } = useToast();
  const { accessMode, isAuthenticated } = useAuth();
  const { activeClinicId, activeClinic } = useClinic() as { activeClinicId: string | null; activeClinic?: { name?: string } | null };
  const enabled = accessMode === "remote" && isAuthenticated && Boolean(activeClinicId) && Boolean(patientId);

  const [templates, setTemplates] = useState<string[]>([]);
  const [customTitle, setCustomTitle] = useState("");
  const [customText, setCustomText] = useState("");
  const [reminders, setReminders] = useState<PortalReminder[]>([]);
  const [remKind, setRemKind] = useState<ReminderKind>("consulta");
  const [remTitle, setRemTitle] = useState("");
  const [remWhen, setRemWhen] = useState("");
  const [remText, setRemText] = useState("");
  const [questionnaires, setQuestionnaires] = useState<PortalQuestionnaire[]>([]);
  const [qTitle, setQTitle] = useState("Pré-consulta");
  const [qToken, setQToken] = useState("");
  const [ownTests, setOwnTests] = useState<PortalOwnTest[]>([]);
  const [ownId, setOwnId] = useState<OwnTestId>("super-neuropad-game");
  const [ownDate, setOwnDate] = useState("");
  const [ownText, setOwnText] = useState("");
  const [documentIds, setDocumentIds] = useState<string[]>([]);
  const [hours, setHours] = useState<number>(FAMILY_PORTAL_LIMITS.defaultExpiresHours);
  const [maxViews, setMaxViews] = useState<number>(FAMILY_PORTAL_LIMITS.defaultMaxViews);
  const [reviewed, setReviewed] = useState(false);
  const [draft, setDraft] = useState<{ link: string; message: string } | null>(null);
  const [formError, setFormError] = useState("");

  const base = `clinicId=${encodeURIComponent(activeClinicId ?? "")}&patientId=${encodeURIComponent(patientId)}`;
  const listUrl = `/api/live/family-portal?${base}`;
  const docsUrl = `/api/live/documents?${base}`;
  const headers = (json: boolean) => ({ ...(json ? { "Content-Type": "application/json" } : {}), ...(activeClinicId ? { "X-Tenant-Id": activeClinicId } : {}) });

  const sharesQuery = useQuery<{ data: ShareItem[] }>({
    queryKey: [listUrl],
    queryFn: async () => readJson(await authFetch(listUrl, { headers: headers(false) })),
    enabled,
  });
  const docsQuery = useQuery<{ data: DocItem[] }>({
    queryKey: [docsUrl],
    queryFn: async () => readJson(await authFetch(docsUrl, { headers: headers(false) })),
    enabled,
  });
  const releasedDocs = useMemo(
    () => (docsQuery.data?.data ?? []).filter((d) => d.status === "published" && d.familyVisibility && d.origin !== "instrument" && d.documentType !== "scale"),
    [docsQuery.data],
  );

  const createMutation = useMutation({
    mutationFn: async () => {
      const orientacoes = [
        ...ORIENTATION_TEMPLATES.filter((t) => templates.includes(t.id)).map((t) => ({ titulo: t.titulo, texto: t.texto })),
        ...(customTitle.trim() && customText.trim() ? [{ titulo: customTitle.trim(), texto: customText.trim() }] : []),
      ];
      return readJson<{ id: string; token: string; expiresAt: string; maxViews: number }>(
        await authFetch("/api/live/family-portal", {
          method: "POST",
          headers: headers(true),
          body: JSON.stringify({
            clinicId: activeClinicId,
            patientId,
            expiresInHours: hours,
            maxViews,
            doctorReviewed: reviewed,
            content: { orientacoes, lembretes: reminders, questionarios: questionnaires, avaliacoesProprias: ownTests, documentIds },
          }),
        }),
      );
    },
    onSuccess: (data) => {
      const link = `${origin()}/portal.html#token=${encodeURIComponent(data.token)}`;
      setDraft({
        link,
        message: buildFamilyMessageDraft({ link, clinicName: activeClinic?.name, expiresAt: data.expiresAt, maxViews: data.maxViews, hasQuestionnaire: questionnaires.length > 0 }),
      });
      setFormError("");
      toast({ title: "Link seguro criado", description: "Nada foi enviado. Copie a mensagem e envie você mesmo." });
    },
    onError: (error: unknown) => setFormError(error instanceof Error ? error.message : "Falha inesperada."),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: [listUrl] }),
  });

  const revokeMutation = useMutation({
    mutationFn: async (shareId: string) =>
      readJson(await authFetch("/api/live/family-portal", { method: "PATCH", headers: headers(true), body: JSON.stringify({ clinicId: activeClinicId, patientId, shareId, action: "revoke" }) })),
    onSuccess: () => toast({ title: "Link cancelado" }),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: [listUrl] }),
  });

  if (!enabled) return null;
  const toggle = (list: string[], set: (v: string[]) => void, id: string) => set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  const input = "h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground";

  return (
    <Card className="border-card-border" data-testid="family-portal-panel">
      <CardContent className="space-y-4 p-4">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2"><HeartHandshake className="h-4 w-4 text-muted-foreground" /><p className="text-sm font-bold">Portal da família · link seguro</p></div>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">
              Monte o que a família verá: orientações, lembretes, questionário e documentos já liberados. O link expira, tem aberturas limitadas e exige consentimento LGPD. O app não envia nada: gera link e mensagem para você enviar.
            </p>
          </div>
          <Badge variant="secondary">Sem diagnóstico · sem nível/classificação</Badge>
        </div>

        <fieldset className="space-y-2" data-testid="portal-orientacoes">
          <legend className="text-xs font-bold">Orientações em linguagem simples (modelos aguardando sua revisão)</legend>
          {ORIENTATION_TEMPLATES.map((t) => (
            <label key={t.id} className="flex items-start gap-2 text-xs">
              <input type="checkbox" checked={templates.includes(t.id)} onChange={() => toggle(templates, setTemplates, t.id)} data-testid={`portal-modelo-${t.id}`} />
              <span><strong>{t.titulo}</strong> — {t.texto}</span>
            </label>
          ))}
          <div className="grid gap-2 md:grid-cols-[1fr_2fr]">
            <input className={input} placeholder="Título (opcional)" value={customTitle} onChange={(e) => setCustomTitle(e.target.value)} data-testid="portal-orient-titulo" />
            <input className={input} placeholder="Orientação própria, em linguagem simples" value={customText} onChange={(e) => setCustomText(e.target.value)} data-testid="portal-orient-texto" />
          </div>
        </fieldset>

        <fieldset className="space-y-2" data-testid="portal-lembretes">
          <legend className="text-xs font-bold">Lembretes ({reminders.length})</legend>
          <div className="grid gap-2 md:grid-cols-[auto_1.2fr_auto_1.5fr_auto]">
            <select className={input} value={remKind} onChange={(e) => setRemKind(e.target.value as ReminderKind)} aria-label="Tipo de lembrete" data-testid="portal-lem-tipo">
              {REMINDER_KINDS.map((k) => <option key={k} value={k}>{reminderLabel[k]}</option>)}
            </select>
            <input className={input} placeholder="Título" value={remTitle} onChange={(e) => setRemTitle(e.target.value)} data-testid="portal-lem-titulo" />
            <input className={input} type="datetime-local" value={remWhen} onChange={(e) => setRemWhen(e.target.value)} aria-label="Data e hora do lembrete" data-testid="portal-lem-quando" />
            <input className={input} placeholder="Texto (opcional)" value={remText} onChange={(e) => setRemText(e.target.value)} data-testid="portal-lem-texto" />
            <Button type="button" variant="outline" data-testid="portal-lem-add" onClick={() => {
              if (!remTitle.trim()) return;
              setReminders([...reminders, { tipo: remKind, titulo: remTitle.trim(), quando: remWhen ? new Date(remWhen).toISOString() : null, texto: remText.trim() }]);
              setRemTitle(""); setRemWhen(""); setRemText("");
            }}>Adicionar</Button>
          </div>
          {reminders.map((r, i) => <p key={i} className="text-xs">• {reminderLabel[r.tipo]}: {r.titulo} {r.quando ? `(${fmt(r.quando)})` : ""}</p>)}
        </fieldset>

        <fieldset className="space-y-2" data-testid="portal-questionarios">
          <legend className="text-xs font-bold">Questionário de pré-consulta ({questionnaires.length})</legend>
          <p className="text-[11px] text-muted-foreground">Gere o convite no painel “Intake remoto” acima e cole aqui o token (parte depois de <code>#token=</code>).</p>
          <div className="grid gap-2 md:grid-cols-[1fr_2fr_auto]">
            <input className={input} value={qTitle} onChange={(e) => setQTitle(e.target.value)} placeholder="Título" data-testid="portal-q-titulo" />
            <input className={input} value={qToken} onChange={(e) => setQToken(e.target.value)} placeholder="Token do convite" data-testid="portal-q-token" />
            <Button type="button" variant="outline" data-testid="portal-q-add" onClick={() => { if (qToken.trim()) { setQuestionnaires([...questionnaires, { titulo: qTitle.trim() || "Pré-consulta", token: qToken.trim() }]); setQToken(""); } }}>Adicionar</Button>
          </div>
        </fieldset>

        <fieldset className="space-y-2" data-testid="portal-avaliacoes">
          <legend className="text-xs font-bold">Avaliações próprias do NeuroPad ({ownTests.length}) — só descrição, sem nível, nota ou classificação</legend>
          <div className="grid gap-2 md:grid-cols-[auto_auto_2fr_auto]">
            <select className={input} value={ownId} onChange={(e) => setOwnId(e.target.value as OwnTestId)} aria-label="Instrumento de avaliação" data-testid="portal-av-instrumento">
              {Object.entries(OWN_TEST_LABELS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </select>
            <input className={input} type="date" value={ownDate} onChange={(e) => setOwnDate(e.target.value)} aria-label="Data da avaliação" data-testid="portal-av-data" />
            <input className={input} value={ownText} onChange={(e) => setOwnText(e.target.value)} placeholder="Como a criança respondeu (descrição sua, opcional)" data-testid="portal-av-texto" />
            <Button type="button" variant="outline" data-testid="portal-av-add" onClick={() => { if (ownDate) { setOwnTests([...ownTests, { instrumento: ownId, data: ownDate, comoRespondeu: ownText.trim() }]); setOwnText(""); } }}>Adicionar</Button>
          </div>
        </fieldset>

        <fieldset className="space-y-1" data-testid="portal-documentos">
          <legend className="text-xs font-bold">Documentos já liberados à família no prontuário ({releasedDocs.length})</legend>
          {releasedDocs.length === 0 && <p className="text-[11px] text-muted-foreground">Nenhum documento publicado e liberado à família. Resultados de escalas e testes não são enviados por aqui.</p>}
          {releasedDocs.map((d) => (
            <label key={d.id} className="flex items-center gap-2 text-xs">
              <input type="checkbox" checked={documentIds.includes(d.id)} onChange={() => toggle(documentIds, setDocumentIds, d.id)} data-testid={`portal-doc-${d.id}`} />
              {docTitle(d)}
            </label>
          ))}
        </fieldset>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-1 text-xs font-semibold text-muted-foreground">Validade (horas)
            <input className={input} type="number" min={1} max={720} value={hours} onChange={(e) => setHours(Number(e.target.value))} data-testid="portal-horas" /></label>
          <label className="grid gap-1 text-xs font-semibold text-muted-foreground">Aberturas permitidas (1 = uso único)
            <input className={input} type="number" min={1} max={10} value={maxViews} onChange={(e) => setMaxViews(Number(e.target.value))} data-testid="portal-aberturas" /></label>
        </div>

        <label className="flex items-start gap-2 text-xs">
          <input type="checkbox" checked={reviewed} onChange={(e) => setReviewed(e.target.checked)} data-testid="portal-revisado" />
          <span>Revisei todo o conteúdo acima. Confirmo que não há diagnóstico, nível ou classificação de testes próprios do NeuroPad e que a família receberá apenas o que está listado.</span>
        </label>
        {formError && <p role="alert" className="text-xs text-red-700" data-testid="portal-erro">{formError}</p>}
        <Button type="button" className="gap-2" disabled={createMutation.isPending || !reviewed} onClick={() => createMutation.mutate()} data-testid="portal-gerar">
          <ShieldCheck className="h-4 w-4" />{createMutation.isPending ? "Gerando…" : "Gerar link e mensagem (rascunho)"}
        </Button>

        {draft && (
          <div className="rounded-xl border border-border bg-muted/35 p-3" data-testid="portal-rascunho">
            <p className="text-xs font-bold">Rascunho da mensagem — exibido uma única vez; nada foi enviado</p>
            <textarea readOnly className="mt-2 h-40 w-full rounded-md border border-input bg-background p-2 text-xs" value={draft.message} aria-label="Mensagem para a família" onFocus={(e) => e.currentTarget.select()} data-testid="portal-mensagem" />
            <div className="mt-2 flex gap-2">
              <Button type="button" variant="outline" className="gap-2" onClick={() => void navigator.clipboard.writeText(draft.message).then(() => toast({ title: "Mensagem copiada" }), () => toast({ title: "Copie manualmente", variant: "destructive" }))}><Clipboard className="h-4 w-4" />Copiar mensagem</Button>
              <Button type="button" variant="ghost" onClick={() => setDraft(null)}>Ocultar</Button>
            </div>
          </div>
        )}

        <div data-testid="portal-historico" className="space-y-1">
          <p className="text-xs font-bold">Links gerados</p>
          {(sharesQuery.data?.data ?? []).length === 0 && <p className="text-[11px] text-muted-foreground">Nenhum link gerado.</p>}
          {(sharesQuery.data?.data ?? []).map((s) => (
            <div key={s.id} className="flex flex-wrap items-center gap-2 text-xs">
              <Badge variant="outline">{statusLabel[s.status]}</Badge>
              <span>criado {fmt(s.createdAt)} · vale até {fmt(s.expiresAt)} · {s.viewCount}/{s.maxViews} aberturas · consentimento {s.consentedAt ? fmt(s.consentedAt) : "pendente"}</span>
              {s.status === "active" && <Button type="button" size="sm" variant="ghost" onClick={() => revokeMutation.mutate(s.id)}>Cancelar</Button>}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
