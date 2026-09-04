import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Check, Clipboard, Link2, Send, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useClinic } from "@/contexts/ClinicContext";
import { authFetch } from "@/lib/authClient";
import { queryClient } from "@/lib/queryClient";
import {
  REMOTE_SCALE_SUMMARIES,
  remoteScaleRespondentKinds,
  type RemoteScaleId,
  type RemoteScaleRespondentKind,
} from "@shared/remoteScaleCatalog";

interface ScaleResponseAnswer {
  label: string;
  value: string;
}

interface ScaleResponse {
  id: string;
  answers: ScaleResponseAnswer[];
  reviewStatus: "pending" | "reviewed" | null;
  reviewedAt: string | null;
  submittedAt: string | null;
}

interface ScaleInvitationItem {
  invitationId: string;
  respondentKind: RemoteScaleRespondentKind;
  scaleId: RemoteScaleId;
  scaleName: string;
  invitationStatus: "pending" | "submitted" | "revoked" | "expired";
  expiresAt: string;
  createdAt: string;
  response: ScaleResponse | null;
}

interface ScaleListResponse {
  data: ScaleInvitationItem[];
}

const respondentLabels: Record<RemoteScaleRespondentKind, string> = {
  family: "Pais/cuidador",
  patient: "Paciente (autorrelato)",
};

const invitationStatusLabels: Record<ScaleInvitationItem["invitationStatus"], string> = {
  pending: "Aguardando",
  submitted: "Respondido",
  revoked: "Revogado",
  expired: "Expirado",
};

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

async function readApiJson<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as ({ error?: string } & T) | null;
  if (!response.ok) {
    throw new Error(payload?.error || `Falha na API (${response.status}).`);
  }
  return payload as T;
}

function publicScaleOrigin(): string {
  const configured = (import.meta.env?.VITE_API_URL ?? "").replace(/\/$/, "");
  if (!configured) return window.location.origin;
  try {
    return new URL(configured, window.location.origin).origin;
  } catch {
    return window.location.origin;
  }
}

export function RemoteScalePanel({ patientId }: { patientId: string }) {
  const { toast } = useToast();
  const { accessMode, isAuthenticated } = useAuth();
  const { activeClinicId } = useClinic();
  const enabled = accessMode === "remote" && isAuthenticated && Boolean(activeClinicId) && Boolean(patientId);
  const [respondentKind, setRespondentKind] = useState<RemoteScaleRespondentKind>("family");
  const [scaleId, setScaleId] = useState<RemoteScaleId>(REMOTE_SCALE_SUMMARIES[0].id);
  const [shareLink, setShareLink] = useState("");

  const queryUrl = `/api/live/scale-invitations?clinicId=${encodeURIComponent(activeClinicId ?? "")}&patientId=${encodeURIComponent(patientId)}`;

  async function scaleRequest<T>(method: "GET" | "POST" | "PATCH", url: string, body?: unknown): Promise<T> {
    const response = await authFetch(url, {
      method,
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(activeClinicId ? { "X-Tenant-Id": activeClinicId } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return readApiJson<T>(response);
  }

  const listQuery = useQuery<ScaleListResponse>({
    queryKey: [queryUrl],
    queryFn: () => scaleRequest<ScaleListResponse>("GET", queryUrl),
    enabled,
  });
  const items = useMemo(() => listQuery.data?.data ?? [], [listQuery.data]);

  const createMutation = useMutation({
    mutationFn: () =>
      scaleRequest<{ token: string; scaleName: string }>("POST", "/api/live/scale-invitations", {
        clinicId: activeClinicId,
        patientId,
        respondentKind,
        scaleId,
        expiresInHours: 168,
      }),
    onSuccess: (data) => {
      const link = `${publicScaleOrigin()}/escala.html#token=${encodeURIComponent(data.token)}`;
      setShareLink(link);
      toast({
        title: "Link seguro criado",
        description: "Copie e envie agora: o token não poderá ser recuperado depois.",
      });
    },
    onError: (error: unknown) => {
      toast({
        title: "Não foi possível criar o link",
        description: error instanceof Error ? error.message : "Falha inesperada.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: [queryUrl] });
    },
  });

  const actionMutation = useMutation({
    mutationFn: (input: { action: "revoke" | "review"; invitationId?: string; responseId?: string }) =>
      scaleRequest<{ id: string }>("PATCH", "/api/live/scale-invitations", {
        clinicId: activeClinicId,
        patientId,
        ...input,
      }),
    onSuccess: (_data, variables) => {
      const labels = { revoke: "Convite revogado", review: "Resposta marcada como revisada" } as const;
      toast({ title: labels[variables.action] });
    },
    onError: (error: unknown) => {
      toast({
        title: "Não foi possível concluir a ação",
        description: error instanceof Error ? error.message : "Falha inesperada.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: [queryUrl] });
    },
  });

  async function copyShareLink() {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink);
      toast({ title: "Link copiado" });
    } catch {
      toast({
        title: "Copie o link manualmente",
        description: "O navegador não autorizou acesso à área de transferência.",
        variant: "destructive",
      });
    }
  }

  if (!enabled) return null;

  return (
    <Card className="border-card-border" data-testid="remote-scale-panel">
      <CardContent className="space-y-4 p-4">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-bold">Escala para responder em casa</p>
            </div>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">
              Link temporário, sem PIN nem login: a família abre em qualquer dispositivo e responde de casa. A pontuação/interpretação fica só com você, ao revisar aqui.
            </p>
          </div>
          <Badge variant="secondary">LIVE · revisão humana</Badge>
        </div>

        <div className="grid gap-3 md:grid-cols-[0.8fr_1.2fr_auto] md:items-end">
          <label className="grid gap-1 text-xs font-semibold text-muted-foreground">
            Respondente
            <select
              value={respondentKind}
              onChange={(event) => setRespondentKind(event.target.value as RemoteScaleRespondentKind)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
            >
              {remoteScaleRespondentKinds.map((kind) => (
                <option key={kind} value={kind}>{respondentLabels[kind]}</option>
              ))}
            </select>
          </label>

          <label className="grid gap-1 text-xs font-semibold text-muted-foreground">
            Escala
            <select
              value={scaleId}
              onChange={(event) => setScaleId(event.target.value as RemoteScaleId)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
            >
              {REMOTE_SCALE_SUMMARIES.map((summary) => (
                <option key={summary.id} value={summary.id}>{summary.name} — {summary.fullName}</option>
              ))}
            </select>
          </label>

          <Button
            type="button"
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending}
            className="gap-2"
          >
            <Send className="h-4 w-4" />
            {createMutation.isPending ? "Criando…" : "Gerar link · 7 dias"}
          </Button>
        </div>

        {shareLink && (
          <div className="rounded-xl border border-border bg-muted/35 p-3">
            <div className="flex items-center gap-2 text-xs font-bold">
              <Link2 className="h-4 w-4" /> Link exibido uma única vez
            </div>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <input
                readOnly
                value={shareLink}
                aria-label="Link temporário da escala"
                className="min-w-0 flex-1 rounded-md border border-input bg-background px-3 py-2 text-xs"
                onFocus={(event) => event.currentTarget.select()}
              />
              <Button type="button" variant="outline" onClick={copyShareLink} className="gap-2">
                <Clipboard className="h-4 w-4" /> Copiar
              </Button>
              <Button type="button" variant="ghost" onClick={() => setShareLink("")}>Ocultar</Button>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              O segredo não é persistido em texto claro. Se o link for perdido, revogue o convite e gere outro.
            </p>
          </div>
        )}

        <div className="space-y-3 border-t border-border pt-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Convites recentes</p>
            <span className="text-xs text-muted-foreground">{items.length} registro{items.length === 1 ? "" : "s"}</span>
          </div>

          {listQuery.isLoading ? (
            <p className="text-xs text-muted-foreground">Carregando…</p>
          ) : listQuery.isError ? (
            <p className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
              Convites indisponíveis neste momento. Nenhum dado foi simulado.
            </p>
          ) : items.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
              Nenhuma escala remota criada para este paciente.
            </p>
          ) : (
            items.map((item) => {
              const reviewPending = item.response?.reviewStatus === "pending";
              return (
                <div key={item.invitationId} className="rounded-xl border border-border p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold">{item.scaleName}</p>
                        <Badge variant="outline">{respondentLabels[item.respondentKind]}</Badge>
                        <Badge variant={item.invitationStatus === "submitted" ? "secondary" : "outline"}>
                          {invitationStatusLabels[item.invitationStatus]}
                        </Badge>
                      </div>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        Criado em {formatDateTime(item.createdAt)} · expira em {formatDateTime(item.expiresAt)}
                      </p>
                    </div>
                    {item.invitationStatus === "pending" && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={actionMutation.isPending}
                        onClick={() => actionMutation.mutate({ action: "revoke", invitationId: item.invitationId })}
                      >
                        Revogar
                      </Button>
                    )}
                  </div>

                  {item.response && (
                    <div className="mt-3 border-t border-border pt-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs font-semibold">Resposta recebida · {formatDateTime(item.response.submittedAt)}</p>
                        <Badge variant={item.response.reviewStatus === "reviewed" ? "secondary" : "outline"}>
                          {item.response.reviewStatus === "reviewed" ? "Revisada" : "Pendente de revisão"}
                        </Badge>
                      </div>

                      {item.response.answers.length > 0 && (
                        <dl className="mt-3 space-y-2">
                          {item.response.answers.map((answer, index) => (
                            <div key={`${item.invitationId}-${index}`} className="rounded-lg bg-muted/35 p-2.5">
                              <dt className="text-[11px] font-semibold text-muted-foreground">{answer.label}</dt>
                              <dd className="mt-1 text-xs leading-relaxed text-foreground">{answer.value}</dd>
                            </div>
                          ))}
                        </dl>
                      )}

                      {reviewPending && (
                        <div className="mt-3">
                          <Button
                            type="button"
                            size="sm"
                            className="gap-2"
                            disabled={actionMutation.isPending}
                            onClick={() => actionMutation.mutate({ action: "review", responseId: item.response?.id })}
                          >
                            <Check className="h-4 w-4" /> Marcar como revisada
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
