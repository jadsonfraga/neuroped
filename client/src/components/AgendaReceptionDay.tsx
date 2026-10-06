/**
 * AgendaReceptionDay — Recepção do dia: a fila de chegada da agenda em operação.
 *
 * Mostra as consultas de um dia em quatro colunas (a chegar, na recepção, em
 * atendimento, encerradas), com a próxima ação de balcão em cada uma:
 * confirmar, registrar chegada, chamar para atendimento, concluir ou marcar
 * falta. Cada ação é o MESMO `appointment_status` da aba Agenda (validado no
 * servidor, com notificação e trilha); nada novo é concedido aqui. A recepção
 * com vários profissionais vê a agenda escolhida e cada ação diz de quem é.
 */
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ChevronLeft, ChevronRight, Clock3, Phone, RefreshCw, UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  RECEPTION_ACTIONS,
  RECEPTION_COLUMN_LABELS,
  buildReceptionBoard,
  receptionDayKey,
  shiftLocalDate,
  telHref,
  waitingLabel,
  type ReceptionColumn,
  type ReceptionItem,
} from "@/lib/agendaReception";
import { appointmentStatusLabel, type ReceptionDay } from "@shared/operations";

function dateLabel(value: string): string {
  const [year, month, day] = value.split("-");
  return year && month && day ? `${day}/${month}/${year}` : value;
}

const COLUMNS: ReceptionColumn[] = ["arriving", "waiting", "in_care", "done"];
const REFRESH_MS = 60_000;

interface AgendaReceptionDayProps {
  providerId: string | null;
  today: string;
  date: string;
  onDateChange: (date: string) => void;
  busy: boolean;
  /** Sufixo " na agenda de X" para a recepção; vazio para o profissional. */
  agendaOf: string;
  mutate: (payload: Record<string, unknown>, success: string) => Promise<boolean>;
}

export function AgendaReceptionDay({ providerId, today, date, onDateChange, busy, agendaOf, mutate }: AgendaReceptionDayProps) {
  const day = useQuery<ReceptionDay>({
    queryKey: [receptionDayKey(date, providerId)],
    // O padrão do app nunca rebusca; o balcão precisa do dia como está agora.
    staleTime: 0,
    refetchOnMount: "always",
    refetchInterval: REFRESH_MS,
  });
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const data = day.data;
  const board = data ? buildReceptionBoard(data.appointments, date, data.nowLocal, nowMs) : null;

  return (
    <Card data-testid="reception-day">
      <CardHeader>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base"><UserCheck className="h-4 w-4 text-primary" aria-hidden="true" />Recepção do dia</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Fila de chegada{agendaOf}: confirme, registre a chegada, chame para o atendimento e conclua. Atualiza sozinha a cada minuto. Para remarcar ou cancelar, use a aba Agenda.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" size="icon" variant="outline" aria-label="Dia anterior" onClick={() => onDateChange(shiftLocalDate(date, -1))}><ChevronLeft className="h-4 w-4" /></Button>
            <Label htmlFor="reception-date" className="sr-only">Dia da recepção</Label>
            <Input id="reception-date" type="date" value={date} onChange={(event) => event.target.value && onDateChange(event.target.value)} className="w-auto" data-testid="reception-date" />
            <Button type="button" size="icon" variant="outline" aria-label="Próximo dia" onClick={() => onDateChange(shiftLocalDate(date, 1))}><ChevronRight className="h-4 w-4" /></Button>
            {date !== today && <Button type="button" size="sm" variant="secondary" onClick={() => onDateChange(today)}>Hoje</Button>}
            <Button type="button" size="sm" variant="ghost" className="gap-1.5" disabled={day.isFetching} onClick={() => day.refetch()}><RefreshCw className={`h-3.5 w-3.5 ${day.isFetching ? "animate-spin" : ""}`} aria-hidden="true" />Atualizar</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {day.isLoading && <p className="text-sm text-muted-foreground" role="status">Carregando a recepção de {dateLabel(date)}…</p>}
        {day.isError && (
          <div className="flex flex-col gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm sm:flex-row sm:items-center sm:justify-between" role="alert">
            <p>Não foi possível carregar as consultas de {dateLabel(date)}.</p>
            <Button type="button" size="sm" variant="outline" onClick={() => day.refetch()}>Tentar novamente</Button>
          </div>
        )}
        {board && data && (
          <>
            <ul className="flex flex-wrap gap-2 text-xs" aria-label={`Resumo de ${dateLabel(date)}`} data-testid="reception-counts">
              <li><Badge variant="outline" className="py-1">{board.counts.total} consulta(s)</Badge></li>
              <li><Badge variant="outline" className="py-1">{board.counts.arriving} a chegar</Badge></li>
              <li><Badge variant="outline" className="py-1">{board.counts.waiting} na recepção</Badge></li>
              <li><Badge variant="outline" className="py-1">{board.counts.inCare} em atendimento</Badge></li>
              <li><Badge variant="outline" className="py-1">{board.counts.completed} concluída(s)</Badge></li>
              {board.counts.noShow > 0 && <li><Badge variant="outline" className="py-1">{board.counts.noShow} falta(s)</Badge></li>}
              {board.counts.late > 0 && <li><Badge className="bg-amber-500/15 py-1 text-amber-800 hover:bg-amber-500/15 dark:text-amber-200">{board.counts.late} atrasada(s)</Badge></li>}
            </ul>
            {data.truncated && (
              <p className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-muted-foreground">Este dia tem mais consultas do que a recepção mostra de uma vez; use a aba Agenda para ver todas.</p>
            )}
            {board.counts.total === 0 ? (
              <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground" data-testid="reception-empty">Nenhuma consulta em {dateLabel(date)}{agendaOf}.</div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {COLUMNS.map((column) => (
                  <section key={column} aria-labelledby={`reception-col-${column}`} className="space-y-2 rounded-2xl border bg-muted/20 p-3" data-testid={`reception-column-${column}`}>
                    <h3 id={`reception-col-${column}`} className="flex items-center justify-between text-sm font-semibold">
                      {RECEPTION_COLUMN_LABELS[column]}
                      <span className="text-xs font-normal text-muted-foreground">{board.columns[column].length}</span>
                    </h3>
                    {board.columns[column].length === 0 ? (
                      <p className="text-xs text-muted-foreground">Ninguém aqui.</p>
                    ) : (
                      <ul className="space-y-2">
                        {board.columns[column].map((item) => (
                          <ReceptionCard key={item.appointment.id} item={item} busy={busy} agendaOf={agendaOf} mutate={mutate} />
                        ))}
                      </ul>
                    )}
                  </section>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function ReceptionCard({ item, busy, agendaOf, mutate }: { item: ReceptionItem; busy: boolean; agendaOf: string; mutate: AgendaReceptionDayProps["mutate"] }) {
  const { appointment, late, waitingMinutes } = item;
  const patient = appointment.patientName || "Paciente não informado";
  const tel = telHref(appointment.guardianPhone);
  const actions = RECEPTION_ACTIONS[appointment.status] ?? [];
  return (
    <li className="space-y-2 rounded-xl border bg-background p-3" data-testid="reception-card" data-status={appointment.status}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-xs font-semibold">{appointment.startsAtLocal.slice(11, 16)}</span>
        <Badge variant="outline">{appointmentStatusLabel[appointment.status]}</Badge>
        {late && <Badge className="gap-1 bg-amber-500/15 text-amber-800 hover:bg-amber-500/15 dark:text-amber-200" data-testid="reception-late"><AlertTriangle className="h-3 w-3" aria-hidden="true" />atrasada</Badge>}
        {waitingMinutes !== null && <Badge variant="secondary" className="gap-1" data-testid="reception-waiting"><Clock3 className="h-3 w-3" aria-hidden="true" />chegou {waitingLabel(waitingMinutes)}</Badge>}
      </div>
      <p className="font-semibold leading-tight">{patient}</p>
      <p className="text-xs text-muted-foreground">{appointment.serviceName || "Serviço"}{appointment.serviceModality === "remote" ? " · remota" : ""}</p>
      {(appointment.guardianName || appointment.guardianPhone) && (
        <p className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
          {appointment.guardianName || "Responsável"}
          {appointment.guardianPhone && (tel
            ? <a href={tel} className="inline-flex items-center gap-1 font-medium text-primary underline-offset-2 hover:underline"><Phone className="h-3 w-3" aria-hidden="true" />{appointment.guardianPhone}</a>
            : <span>· {appointment.guardianPhone}</span>)}
        </p>
      )}
      {actions.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {actions.map((action) => (
            <Button
              key={action.status}
              type="button"
              size="sm"
              variant={action.status === "no_show" ? "outline" : "default"}
              disabled={busy}
              title={`${action.label} — ${patient}${agendaOf}`}
              onClick={() => mutate({ action: "appointment_status", id: appointment.id, status: action.status }, `${patient}: ${appointmentStatusLabel[action.status]}${agendaOf}.`)}
            >
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </li>
  );
}
