/**
 * AgendaClinicDay — agenda da clínica inteira num dia, para o dono/admin
 * da clínica.
 *
 * Só leitura: cada linha mostra a consulta com o nome do profissional dono
 * (rótulo vem do `provider_user_id` real da consulta, nunca do cliente).
 * Nenhuma ação é feita daqui: para agir numa consulta, abre-se a aba Agenda
 * do profissional. O servidor é a autoridade — o recurso
 * (`resource=clinic_day`) só existe para membership `owner`/`clinic_admin`
 * ativa da clínica resolvida; o papel lido aqui é só conveniência para
 * esconder a aba de quem não tem direito.
 */
import { useQuery } from "@tanstack/react-query";
import { Building2, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { shiftLocalDate } from "@/lib/agendaReception";
import { buildClinicDayBoard, clinicDayKey, clockLabel } from "@/lib/agendaClinicDay";
import { appointmentStatusLabel, type ClinicDay } from "@shared/operations";

function dateLabel(value: string): string {
  const [year, month, day] = value.split("-");
  return year && month && day ? `${day}/${month}/${year}` : value;
}

const REFRESH_MS = 60_000;

interface AgendaClinicDayProps {
  today: string;
  date: string;
  onDateChange: (date: string) => void;
}

export function AgendaClinicDay({ today, date, onDateChange }: AgendaClinicDayProps) {
  const day = useQuery<ClinicDay>({
    queryKey: [clinicDayKey(date)],
    // A visão gerencial acompanha o dia como ele está agora.
    staleTime: 0,
    refetchOnMount: "always",
    refetchInterval: REFRESH_MS,
  });
  const data = day.data;
  const board = data ? buildClinicDayBoard(data) : null;
  return (
    <Card data-testid="clinic-day">
      <CardHeader>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4 text-primary" aria-hidden="true" />
              Agenda da clínica
            </CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Todas as consultas de todos os profissionais da clínica neste dia. Só leitura: para agir numa consulta, use a aba Agenda do profissional. Atualiza sozinha a cada minuto.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" size="icon" variant="outline" aria-label="Dia anterior" onClick={() => onDateChange(shiftLocalDate(date, -1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Label htmlFor="clinic-day-date" className="sr-only">Dia da clínica</Label>
            <Input
              id="clinic-day-date"
              type="date"
              value={date}
              onChange={(event) => event.target.value && onDateChange(event.target.value)}
              className="w-auto"
              data-testid="clinic-day-date"
            />
            <Button type="button" size="icon" variant="outline" aria-label="Próximo dia" onClick={() => onDateChange(shiftLocalDate(date, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            {date !== today && (
              <Button type="button" size="sm" variant="secondary" onClick={() => onDateChange(today)}>
                Hoje
              </Button>
            )}
            <Button type="button" size="sm" variant="ghost" className="gap-1.5" disabled={day.isFetching} onClick={() => day.refetch()}>
              <RefreshCw className={`h-3.5 w-3.5 ${day.isFetching ? "animate-spin" : ""}`} aria-hidden="true" />
              Atualizar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {day.isLoading && (
          <p className="text-sm text-muted-foreground" role="status">
            Carregando a agenda da clínica em {dateLabel(date)}…
          </p>
        )}
        {day.isError && (
          <div className="flex flex-col gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm sm:flex-row sm:items-center sm:justify-between" role="alert">
            <p>Não foi possível carregar a agenda da clínica em {dateLabel(date)}.</p>
            <Button type="button" size="sm" variant="outline" onClick={() => day.refetch()}>
              Tentar novamente
            </Button>
          </div>
        )}
        {board && data && (
          <>
            <ul className="flex flex-wrap gap-2 text-xs" aria-label={`Resumo de ${dateLabel(date)}`} data-testid="clinic-day-counts">
              <li><Badge variant="outline" className="py-1">{board.counts.total} consulta(s)</Badge></li>
              <li><Badge variant="outline" className="py-1">{board.counts.arriving} a chegar</Badge></li>
              <li><Badge variant="outline" className="py-1">{board.counts.waiting} na recepção</Badge></li>
              <li><Badge variant="outline" className="py-1">{board.counts.inCare} em atendimento</Badge></li>
              <li><Badge variant="outline" className="py-1">{board.counts.completed} concluída(s)</Badge></li>
              {board.counts.late > 0 && (
                <li><Badge className="bg-amber-500/15 py-1 text-amber-800 hover:bg-amber-500/15 dark:text-amber-200">{board.counts.late} atrasada(s)</Badge></li>
              )}
            </ul>
            {data.truncated && (
              <p className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-muted-foreground">
                Este dia tem mais consultas do que a visão mostra de uma vez.
              </p>
            )}
            {board.rows.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground" data-testid="clinic-day-empty">
                Nenhuma consulta na clínica em {dateLabel(date)}.
              </div>
            ) : (
              <ul className="space-y-2">
                {board.rows.map((row) => (
                  <li
                    key={row.key}
                    className="flex flex-col gap-2 rounded-2xl border p-4 sm:flex-row sm:items-center"
                    data-testid="clinic-day-row"
                    data-status={row.appointment.status}
                  >
                    <span className="font-mono text-sm font-semibold">{clockLabel(row.appointment.startsAtLocal)}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold leading-tight">{row.appointment.patientName || "Paciente não informado"}</p>
                      <p className="text-xs text-muted-foreground">
                        {row.appointment.serviceName || "Serviço"}
                        {row.appointment.serviceModality === "remote" ? " · remota" : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{row.providerName}</Badge>
                      <Badge variant="outline">{appointmentStatusLabel[row.appointment.status]}</Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {data.providers.length > 0 && (
              <p className="text-xs text-muted-foreground" data-testid="clinic-day-providers">
                {data.providers.map((provider) => `${provider.providerName} (${provider.count})`).join(" · ")}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
