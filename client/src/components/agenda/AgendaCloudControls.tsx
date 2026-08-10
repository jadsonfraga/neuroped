import { useEffect, useState } from "react";
import { Cloud, History, RefreshCw, ShieldAlert, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import {
  canImportLocalWorkspace,
  cloudWorkspaceIsEmpty,
  loadAgendaAudit,
  loadAgendaCloud,
  mergeLocalWorkspaceIntoCloud,
  saveAgendaCloud,
  type AgendaCloudLoadResult,
} from "@/lib/agendaCloud";
import { loadLocalAgendaWorkspace, type AgendaWorkspace } from "@/lib/agendaCore";
import type { AgendaCloudAuditEntry } from "@shared/agenda-cloud";

function hasLocalData(workspace: AgendaWorkspace): boolean {
  return workspace.appointments.length > 0 || workspace.blocks.length > 0 || workspace.waitlist.length > 0;
}

function formatAuditDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
        timeZone: "America/Recife",
      }).format(date);
}

export function AgendaCloudControls() {
  const { accessMode, user } = useAuth();
  const [remote, setRemote] = useState<AgendaCloudLoadResult | null>(null);
  const [local, setLocal] = useState<AgendaWorkspace | null>(null);
  const [audit, setAudit] = useState<AgendaCloudAuditEntry[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const canSeeAudit = user?.role === "admin" || user?.role === "professional";

  async function refresh() {
    if (accessMode !== "remote" || !user) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const [remoteResult, localResult, auditResult] = await Promise.all([
        loadAgendaCloud(),
        loadLocalAgendaWorkspace(),
        canSeeAudit ? loadAgendaAudit(20) : Promise.resolve([]),
      ]);
      setRemote(remoteResult);
      setLocal(localResult);
      setAudit(auditResult);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível consultar a Agenda Cloud.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void refresh();
    // O usuário/role e o modo de acesso definem a superfície; refresh manual
    // cobre alterações posteriores sem criar polling silencioso.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessMode, user?.id, user?.role]);

  async function importLocal() {
    if (!remote || !local) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (remote.offline) throw new Error("Importação bloqueada enquanto a agenda remota estiver offline.");
      const eligibility = canImportLocalWorkspace(local, remote.snapshot);
      if (!eligibility.allowed) throw new Error(eligibility.reason || "Agenda local não pode ser importada.");
      const merged = mergeLocalWorkspaceIntoCloud(local, remote.snapshot);
      const saved = await saveAgendaCloud(merged, remote.snapshot.revision);
      setRemote({ snapshot: saved, offline: false, source: "remote" });
      setMessage("Agenda local incorporada à nuvem sem sobrescrever registros remotos existentes.");
      window.dispatchEvent(new CustomEvent("agenda:reload"));
      if (canSeeAudit) setAudit(await loadAgendaAudit(20));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível importar a agenda local.");
    } finally {
      setBusy(false);
    }
  }

  if (accessMode !== "remote" || !user) return null;

  const localPresent = Boolean(local && hasLocalData(local));
  const importPolicy = remote && local ? canImportLocalWorkspace(local, remote.snapshot) : null;
  const demoMode = remote?.snapshot.mode === "demo-cloud";

  return (
    <Card className="border-primary/15" data-testid="agenda-cloud-controls">
      <CardContent className="space-y-4 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Cloud className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-black text-foreground">Agenda Cloud v2</p>
                {remote && (
                  <Badge variant="outline">
                    {remote.snapshot.mode === "remote-live" ? "LIVE privado" : "DEMO público"} · r{remote.snapshot.revision}
                  </Badge>
                )}
                {remote?.offline && <Badge variant="destructive">offline · cache</Badge>}
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Uma única revisão compartilhada evita sobrescrita silenciosa entre médico e recepção. A agenda é operacional e permanece separada do Clinical Core.
              </p>
            </div>
          </div>
          <Button type="button" variant="outline" size="sm" className="gap-2" disabled={busy} onClick={() => void refresh()}>
            <RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} />Atualizar
          </Button>
        </div>

        {demoMode && (
          <div className="flex gap-2 rounded-xl border border-amber-500/25 bg-amber-500/[0.08] p-3 text-xs text-muted-foreground">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <p>
              <strong className="text-foreground">Proteção DEMO ativa:</strong> este backend público aceita somente agenda fictícia marcada como DEMO. Dados reais da clínica não são enviados para ele.
            </p>
          </div>
        )}

        {error && <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">{error}</p>}
        {message && <p role="status" className="rounded-xl border border-primary/20 bg-primary/[0.07] p-3 text-xs text-foreground">{message}</p>}

        {localPresent && remote && (
          <div className="rounded-xl border border-border bg-muted/20 p-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-black text-foreground">Agenda local anterior detectada</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {local?.appointments.length ?? 0} atendimento(s) · {local?.blocks.length ?? 0} bloqueio(s) · {local?.waitlist.length ?? 0} item(ns) em espera.
                  {cloudWorkspaceIsEmpty(remote.snapshot) ? " A nuvem está vazia." : " Registros remotos existentes serão preservados."}
                </p>
                {importPolicy && !importPolicy.allowed && <p className="mt-1 text-xs font-semibold text-amber-700 dark:text-amber-300">{importPolicy.reason}</p>}
              </div>
              <Button
                type="button"
                size="sm"
                className="gap-2"
                disabled={busy || remote.offline || !importPolicy?.allowed}
                onClick={() => void importLocal()}
              >
                <Upload className="h-4 w-4" />Importar explicitamente
              </Button>
            </div>
          </div>
        )}

        {canSeeAudit && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-black text-foreground">
              <History className="h-4 w-4 text-primary" />Últimas alterações auditadas
            </div>
            {audit.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border p-3 text-xs text-muted-foreground">Nenhuma alteração auditada disponível nesta instalação.</p>
            ) : (
              <div className="space-y-1.5">
                {audit.slice(0, 6).map((entry) => (
                  <div key={entry.id} className="flex flex-col gap-1 rounded-xl border border-border px-3 py-2 text-xs sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-foreground">{entry.summary}</span>
                    <span className="shrink-0 text-muted-foreground">{formatAuditDate(entry.createdAt)}{entry.userId ? ` · ${entry.userId.slice(0, 8)}…` : ""}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
