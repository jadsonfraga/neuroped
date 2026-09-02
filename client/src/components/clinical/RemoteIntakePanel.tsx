import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Check, Clipboard, Link2, Send, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useClinic } from "@/contexts/ClinicContext";
import { authFetch } from "@/lib/authClient";
import { queryClient } from "@/lib/queryClient";
import {
  getRemoteIntakeTemplate,
  remoteIntakeFormKinds,
  type RemoteIntakeFormKind,
  type RemoteIntakeRespondentKind,
} from "@shared/remote-intake";

interface IntakeSubmission {
  id: string;
  payload: {
    respondent?: { name?: string; relationship?: string };
    responses?: Record<string, string | boolean>;
  } | null;
  reviewStatus: "pending" | "accepted" | "rejected" | null;
  submittedAt: string | null;
  clinicalEventId: string | null;
}

interface IntakeItem {
  invitationId: string;
  respondentKind: RemoteIntakeRespondentKind;
  formKind: RemoteIntakeFormKind;
  formId: string;
  formTitle: string;
  invitationStatus: "pending" | "submitted" | "revoked" | "expired";
  expiresAt: string;
  createdAt: string;
  submission: IntakeSubmission | null;
}

interface IntakeListResponse {
  data: IntakeItem[];
}

const respondentLabels: Record<RemoteIntakeRespondentKind, string> = {
  family: "Família",
  school: "Escola",
  therapist: "Terapeuta",
  patient: "Paciente",
};

const invitationStatusLabels: Record<IntakeItem["invitationStatus"], string> = {
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

function responseEntries(item: IntakeItem): Array<{ label: string; value: string }> {
  const responses = item.submission?.payload?.responses ?? {};
  const template = getRemoteIntakeTemplate(item.formKind);
  return template.questions.flatMap((question) => {
    const value = responses[question.id];
    if (value === undefined || value === null || value === "") return [];
    return [{ label: question.label, value: typeof value === "boolean" ? (value ? "Sim" : "Não") : String(value) }];
  });
}

async function readApiJson<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null) as ({ error?: string } & T) | null;
  if (!response.ok) {
    throw new Error(payload?.error || `Falha na API (${response.status}).`);
  }
  return payload as T;
}

function publicIntakeOrigin(): string {
  const configured = (import.meta.env?.VITE_API_URL ?? "").replace(/\/$/, "");
  if (!configured) return window.location.origin;
  try {
    return new URL(configured, window.location.origin).origin;
  } catch {
    return window.location.origin;
  }
}

export function RemoteIntakePanel({ patientId }: { patientId: string }) {
  const { toast } = useToast();
  const { accessMode, isAuthenticated } = useAuth();
  const { activeClinicId } = useClinic();
  const enabled = accessMode === "remote" && isAuthenticated && Boolean(activeClinicId) && Boolean(patientId);
  const [respondentKind, setRespondentKind] = useState<RemoteIntakeRespondentKind>("family");
  const [formKind, setFormKind] = useState<RemoteIntakeFormKind>("pre_consulta");
  const [shareLink, setShareLink] = useState("");

  const queryUrl = `/api/live/intake?clinicId=${encodeURIComponent(activeClinicId ?? "")}&patientId=${encodeURIComponent(patientId)}`;

  async function intakeRequest<T>(method: "GET" | "POST" | "PATCH", url: string, body?: unknown): Promise<T> {
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

  const intakeQuery = useQuery<IntakeListResponse>({
    queryKey: [queryUrl],
    queryFn: () => intakeRequest<IntakeListResponse>("GET", queryUrl),
    enabled,
  });
  const items = useMemo(() => intakeQuery.data?.data ?? [], [intakeQuery.data]);

  const createMutation = useMutation({
    mutationFn: () => intakeRequest<{ token: string; formTitle: string }>("POST", "/api/live/intake", {
      clinicId: activeClinicId,
      patientId,
      respondentKind,
      formKind,
      expiresInHours: 168,
    }),
    onSuccess: (data) => {
      const link = `${publicIntakeOrigin()}/intake.html#token=${encodeURIComponent(data.token)}`;
      setShareLink(link);
      toast({
        title: "Convite seguro criado",
        description: "Copie o link agora: o token não poderá ser recuperado depois.",
      });
    },
    onError: (error: unknown) => {
      toast({
        title: "Não foi possível criar o convite",
        description: error instanceof Error ? error.message : "Falha inesperada.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: [queryUrl] });
    },
  });

  const actionMutation = useMutation({
    mutationFn: (input: { action: "revoke" | "accept" | "reject"; invitationId?: string; submissionId?: string }) =>
      intakeRequest<{ id: string }>("PATCH", "/api/live/intake", {
        clinicId: activeClinicId,
        patientId,
        ...input,
      }),
    onSuccess: (_data, variables) => {
      const labels = {
        revoke: "Convite revogado",
        accept: "Submissão incorporada ao Clinical Core",
        reject: "Submissão rejeitada",
      } as const;
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
    <Card className="border-card-border" data-testid="remote-intake-panel">
      <CardContent className="space-y-4 p-4">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-bold">Intake remoto · família e escola</p>
            </div>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">
              Convite temporário sem acesso ao prontuário. A resposta chega cifrada e permanece pendente até revisão profissional explícita.
            </p>
          </div>
          <Badge variant="secondary">LIVE · revisão humana</Badge>
        </div>

        <div className="grid gap-3 md:grid-cols-[0.8fr_1.2fr_auto] md:items-end">
          <label className="grid gap-1 text-xs font-semibold text-muted-foreground">
            Respondente
            <select
              value={respondentKind}
              onChange={(event) => setRespondentKind(event.target.value as RemoteIntakeRespondentKind)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
            >
              {Object.entries(respondentLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>

          <label className="grid gap-1 text-xs font-semibold text-muted-foreground">
            Formulário
            <select
              value={formKind}
              onChange={(event) => setFormKind(event.target.value as RemoteIntakeFormKind)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
            >
              {remoteIntakeFormKinds.map((kind) => (
                <option key={kind} value={kind}>{getRemoteIntakeTemplate(kind).title}</option>
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
                aria-label="Link temporário do intake"
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

          {intakeQuery.isLoading ? (
            <p className="text-xs text-muted-foreground">Carregando intakes…</p>
          ) : intakeQuery.isError ? (
            <p className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
              Intakes indisponíveis neste momento. Nenhum dado foi simulado.
            </p>
          ) : items.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
              Nenhum convite remoto criado para este paciente.
            </p>
          ) : (
            items.map((item) => {
              const answers = responseEntries(item);
              const reviewPending = item.submission?.reviewStatus === "pending";
              return (
                <div key={item.invitationId} className="rounded-xl border border-border p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold">{item.formTitle}</p>
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

                  {item.submission && (
                    <div className="mt-3 border-t border-border pt-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs font-semibold">Resposta recebida · {formatDateTime(item.submission.submittedAt)}</p>
                        <Badge variant={item.submission.reviewStatus === "accepted" ? "secondary" : "outline"}>
                          {item.submission.reviewStatus === "accepted"
                            ? "Incorporada"
                            : item.submission.reviewStatus === "rejected"
                              ? "Rejeitada"
                              : "Pendente de revisão"}
                        </Badge>
                      </div>

                      {answers.length > 0 && (
                        <dl className="mt-3 space-y-2">
                          {answers.map((answer) => (
                            <div key={answer.label} className="rounded-lg bg-muted/35 p-2.5">
                              <dt className="text-[11px] font-semibold text-muted-foreground">{answer.label}</dt>
                              <dd className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-foreground">{answer.value}</dd>
                            </div>
                          ))}
                        </dl>
                      )}

                      {reviewPending && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button
                            type="button"
                            size="sm"
                            className="gap-2"
                            disabled={actionMutation.isPending}
                            onClick={() => actionMutation.mutate({ action: "accept", submissionId: item.submission?.id })}
                          >
                            <Check className="h-4 w-4" /> Aceitar no Clinical Core
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="gap-2"
                            disabled={actionMutation.isPending}
                            onClick={() => actionMutation.mutate({ action: "reject", submissionId: item.submission?.id })}
                          >
                            <X className="h-4 w-4" /> Rejeitar
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
