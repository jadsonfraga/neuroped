import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { BarChart3, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authFetch } from "@/lib/authClient";
import { queryClient } from "@/lib/queryClient";
import {
  ASSUMPTION_LABELS,
  MAX_MINUTES_PER_DOC,
  OUTCOME_WINDOWS,
  formatMinutes,
  validateMinutes,
  type AssumptionDocType,
  type OutcomeWindow,
} from "@shared/outcomes";

interface Patients { encounters: number; attended: number; returning: number; firstTime: number; newPatients: number; previous: { attended: number; returning: number } | null }
interface Outcomes {
  windowDays: number;
  patients: Patients | null;
  documents: { total: number; byType: Record<string, number>; assessmentsApplied: number; previousTotal: number | null } | null;
  timeSaved: { totalMinutes: number | null; premise: string; assumptionsAvailable: boolean; perType: Array<{ docType: AssumptionDocType; documents: number; assumedMinutes: number | null; minutes: number | null }> } | null;
  portal: { linksCreated: number; consented: number; opened: number; revoked: number; deniedAccesses: number; adherencePct: number | null; consentPct: number | null } | null;
  invitations: { intake: { created: number; submitted: number; responsePct: number | null } | null; scale: { created: number; submitted: number; responsePct: number | null } | null };
  ai: { total: number; familyInformedPct: number | null; humanReviewedPct: number | null } | null;
  features: Array<{ action: string; label: string; count: number }> | null;
  notMeasured: string[];
}

async function readJson<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as ({ error?: string } & T) | null;
  if (!response.ok) throw new Error(payload?.error || `Falha na API (${response.status}).`);
  return payload as T;
}
const pct = (v: number | null) => (v === null ? "—" : `${v.toLocaleString("pt-BR")}%`);
const DOC_LABELS: Record<string, string> = { report: "Laudos/relatórios", clinical_note: "Notas/resumos clínicos", prescription: "Receitas", scale: "Escalas", school: "Documentos escolares", other: "Outros" };

function Stat({ id, label, value, hint }: { id: string; label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4" data-testid={`outcome-${id}`}>
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}
function Unavailable({ what }: { what: string }) {
  return <p className="text-sm text-muted-foreground">{what}: indisponível até a migration correspondente ser aplicada.</p>;
}

export function OutcomesSection({ clinicId, canEditAssumptions }: { clinicId: string; canEditAssumptions: boolean }) {
  const [days, setDays] = useState<OutcomeWindow>(30);
  const headers = (json: boolean) => ({ ...(json ? { "Content-Type": "application/json" } : {}), "X-Tenant-Id": clinicId });
  const url = `/api/live/outcomes?clinicId=${encodeURIComponent(clinicId)}&days=${days}`;
  const query = useQuery<{ data: Outcomes }>({ queryKey: [url], queryFn: async () => readJson(await authFetch(url, { headers: headers(false) })) });
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const save = useMutation({
    mutationFn: async ({ docType, minutes }: { docType: AssumptionDocType; minutes: number }) =>
      readJson(await authFetch("/api/live/outcomes/assumptions", { method: "PUT", headers: headers(true), body: JSON.stringify({ clinicId, docType, minutes }) })),
    onSuccess: () => { setError(null); void queryClient.invalidateQueries({ queryKey: [url] }); },
    onError: (e: Error) => setError(e.message),
  });
  const d = query.data?.data;

  return (
    <section className="space-y-6" data-testid="outcomes-section" aria-labelledby="outcomes-title">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="outcomes-title" className="flex items-center gap-2 text-xl font-bold"><BarChart3 className="h-5 w-5" /> Resultados da clínica</h2>
          <p className="text-sm text-muted-foreground">Só números agregados da sua clínica. Nenhum nome ou identificador de paciente aparece aqui.</p>
        </div>
        <div className="flex gap-2" role="group" aria-label="Período">
          {OUTCOME_WINDOWS.map((w) => (
            <Button key={w} size="sm" variant={w === days ? "default" : "outline"} aria-pressed={w === days} onClick={() => setDays(w)}>{w} dias</Button>
          ))}
        </div>
      </header>

      {query.isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
      {query.isError && <p role="alert" className="text-sm text-destructive">{(query.error as Error).message}</p>}

      {d && (
        <>
          <div className="space-y-2">
            <h3 className="font-semibold">Atendimento</h3>
            {d.patients ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Stat id="atendidos" label="Pacientes atendidos" value={d.patients.attended} hint={d.patients.previous ? `Período anterior: ${d.patients.previous.attended}` : undefined} />
                <Stat id="retornos" label="Retornos" value={d.patients.returning} hint="Já tinham consulta registrada antes do período" />
                <Stat id="primeira" label="Primeira consulta no período" value={d.patients.firstTime} />
                <Stat id="consultas" label="Consultas registradas" value={d.patients.encounters} />
              </div>
            ) : <Unavailable what="Atendimento" />}
            <p className="flex gap-2 text-xs text-muted-foreground"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />“Atendido” = paciente com consulta registrada no prontuário LIVE no período. A agenda legada não entra porque não é separada por clínica.</p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Documentos emitidos</h3>
            {d.documents ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Stat id="documentos" label="Total emitidos" value={d.documents.total} hint={d.documents.previousTotal !== null ? `Período anterior: ${d.documents.previousTotal}` : undefined} />
                {Object.entries(d.documents.byType).map(([t, n]) => <Stat key={t} id={`doc-${t}`} label={DOC_LABELS[t] ?? t} value={n} />)}
                <Stat id="avaliacoes" label="Avaliações aplicadas" value={d.documents.assessmentsApplied} hint="Contagem de aplicações; sem resultado" />
              </div>
            ) : <Unavailable what="Documentos" />}
          </div>

          <div className="space-y-3 rounded-2xl border border-amber-500/40 bg-amber-500/5 p-4" data-testid="outcome-tempo">
            <h3 className="font-semibold">Tempo estimado economizado <span className="rounded bg-amber-500/20 px-2 py-0.5 text-xs font-bold uppercase">estimativa</span></h3>
            {d.timeSaved ? (
              <>
                <div className="text-2xl font-bold" data-testid="outcome-tempo-total">{d.timeSaved.totalMinutes === null ? "Defina a premissa abaixo" : `≈ ${formatMinutes(d.timeSaved.totalMinutes)}`}</div>
                <p className="text-sm text-muted-foreground" data-testid="outcome-tempo-premissa">{d.timeSaved.premise}</p>
                <ul className="space-y-2">
                  {d.timeSaved.perType.map((row) => (
                    <li key={row.docType} className="flex flex-wrap items-center gap-3 text-sm">
                      <span className="min-w-48 font-medium">{ASSUMPTION_LABELS[row.docType]}</span>
                      <span>{row.documents} emitidos</span>
                      <span>× {row.assumedMinutes === null ? "sem premissa" : `${row.assumedMinutes} min`}</span>
                      {canEditAssumptions && (
                        <form className="flex items-center gap-2" onSubmit={(e) => {
                          e.preventDefault();
                          const parsed = validateMinutes(Number(drafts[row.docType]));
                          if (!parsed.ok || drafts[row.docType] === undefined || drafts[row.docType] === "") { setError(`Informe minutos inteiros entre 0 e ${MAX_MINUTES_PER_DOC}.`); return; }
                          save.mutate({ docType: row.docType, minutes: parsed.minutes });
                        }}>
                          <label className="sr-only" htmlFor={`premissa-${row.docType}`}>Minutos economizados por {ASSUMPTION_LABELS[row.docType]}</label>
                          <input id={`premissa-${row.docType}`} data-testid={`premissa-${row.docType}`} inputMode="numeric" className="h-8 w-20 rounded-md border bg-background px-2" placeholder="min" value={drafts[row.docType] ?? ""} onChange={(e) => setDrafts((s) => ({ ...s, [row.docType]: e.target.value }))} />
                          <Button type="submit" size="sm" variant="outline">Salvar premissa</Button>
                        </form>
                      )}
                    </li>
                  ))}
                </ul>
                {!canEditAssumptions && <p className="text-xs text-muted-foreground">Somente o gestor da clínica altera a premissa.</p>}
                {!d.timeSaved.assumptionsAvailable && <p className="text-xs text-muted-foreground">Premissa indisponível até a migration 0037 ser aplicada.</p>}
                {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
              </>
            ) : <Unavailable what="Estimativa" />}
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Adesão ao portal da família e questionários remotos</h3>
            {d.portal ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Stat id="portal-criados" label="Links criados" value={d.portal.linksCreated} />
                <Stat id="portal-abertos" label="Abertos pela família" value={d.portal.opened} hint={`Adesão: ${pct(d.portal.adherencePct)}`} />
                <Stat id="portal-consentimento" label="Com consentimento LGPD" value={d.portal.consented} hint={pct(d.portal.consentPct)} />
                <Stat id="portal-negados" label="Acessos negados" value={d.portal.deniedAccesses} hint="Expirado, esgotado, revogado ou inválido" />
              </div>
            ) : <Unavailable what="Portal da família" />}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {d.invitations.intake && <Stat id="anamnese" label="Anamnese remota respondida" value={`${d.invitations.intake.submitted}/${d.invitations.intake.created}`} hint={pct(d.invitations.intake.responsePct)} />}
              {d.invitations.scale && <Stat id="escala" label="Escalas remotas respondidas" value={`${d.invitations.scale.submitted}/${d.invitations.scale.created}`} hint={pct(d.invitations.scale.responsePct)} />}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Uso das funcionalidades</h3>
            {d.features ? (
              <ul className="grid gap-2 sm:grid-cols-2" data-testid="outcome-features">
                {d.features.map((f) => <li key={f.action} className="flex justify-between rounded-xl border border-border/60 px-3 py-2 text-sm"><span>{f.label}</span><strong>{f.count}</strong></li>)}
              </ul>
            ) : <Unavailable what="Uso" />}
            {d.ai && <p className="text-sm text-muted-foreground" data-testid="outcome-ia">Uso de IA registrado: {d.ai.total} · com revisão humana: {pct(d.ai.humanReviewedPct)} · família informada: {pct(d.ai.familyInformedPct)}</p>}
          </div>

          <div className="rounded-2xl border border-border/60 p-4 text-sm text-muted-foreground" data-testid="outcome-nao-medido">
            <strong className="text-foreground">O que este painel não mede</strong>
            <ul className="mt-1 list-disc pl-5">{d.notMeasured.map((n) => <li key={n}>{n}</li>)}</ul>
          </div>
        </>
      )}
    </section>
  );
}
