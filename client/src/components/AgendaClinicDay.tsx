/**
 * AgendaClinicDay — a agenda da clínica inteira, um dia, para o dono e o
 * administrador da clínica.
 *
 * Só leitura. Reúne, por profissional, as consultas do dia de TODOS os
 * profissionais com membership ativa na clínica (`GET ?resource=clinic_day`).
 * O servidor valida a membership `owner`/`clinic_admin` a cada requisição e
 * nenhuma ação é feita daqui: para agir numa consulta, usa-se a aba Agenda da
 * própria conta, pois cada ação do `appointment_status` segue validada contra o
 * par (profissional, clínica).
 */
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarRange, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { clinicDayKey, shiftClinicDayDate } from "@/lib/agendaClinicDay";
import { appointmentStatusLabel as statusLabel, type ClinicDay } from "@shared/operations";

const REFRESH_MS = 60_000;

function dateLabel(value: string): string {
  const [year, month, day] = value.split("-");
  return year && month && day ? `${day}/${month}/${year}` : value;
}

function timeLabel(value: string): string {
  return value.split("T")[1] ?? value;
}

interface AgendaClinicDayProps {
  today: string;
  date: string;
  onDateChange: (date: string) => void;
}

export function AgendaClinicDay({ today, date, onDateChange }: AgendaClinicDayProps) {
  const day = useQuery<ClinicDay>({
    queryKey: [clinicDayKey(date)],
    staleTime: 0,
    refetchOnMount: "always",
    refetchInterval: REFRESH_MS,
  });
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  void nowMs;

  const data = day.data;

  return (
    <Card data-testid="clinic-day">
      <CardHeader>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarRange className="h-4 w-4 text-primary" aria-hidden="true" />
              Clínica inteira
            </CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              As consultas do dia de todos os profissionais da clínica, por agenda. Só leitura: para agir numa consulta, use a aba Agenda.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" size="icon" variant="outline" aria-label="Dia anterior" onClick={() => onDateChange(shiftClinicDayDate(date, -1))}><ChevronLeft className="h-4 w-4" /></Button>
            <Label htmlFor="clinic-day-date" className="sr-only">Dia da clínica</Label>
            <Input id="clinic-day-date" type="date" value={date} onChange={(event) => event.target.value && onDateChange(event.target.value)} className="w-auto" data-testid="clinic-day-date" />
            <Button type="button" size="icon" variant="outline" aria-label="Próximo dia" onClick={() => onDateChange(shiftClinicDayDate(date, 1))}><ChevronRight className="h-4 w-4" /></Button>
            {date !== today && <Button type="button" size="sm" variant="secondary" onClick={() => onDateChange(today)}>Hoje</Button>}
            <Button type="button" size="sm" variant="ghost" className="gap-1.5" disabled={day.isFetching} onClick={() => day.refetch()}><RefreshCw className={`h-3.5 w-3.5 ${day.isFetching ? "animate-spin" : ""}`} aria-hidden="true" />Atualizar</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {day.isLoading && <p className="text-sm text-muted-foreground" role="status">Carregando a clínica de {dateLabel(date)}…</p>}
        {day.isError && (
          <div className="flex flex-col gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm sm:flex-row sm:items-center sm:justify-between" role="alert">
            <p>Não foi possível carregar a clínica de {dateLabel(date)}.</p>
            <Button type="button" size="sm" variant="outline" onClick={() => day.refetch()}>Tentar novamente</Button>
          </div>
        )}
        {data && (
          <>
            <ul className="flex flex-wrap gap-2 text-xs" aria-label={`Resumo de ${dateLabel(date)}`} data-testid="clinic-day-counts">
              <li><Badge variant="outline" className="py-1">{data.totalAppointments} consulta(s)</Badge></li>
              <li><Badge variant="outline" className="py-1">{data.providers.length} profissional(is)</Badge></li>
            </ul>
            {data.truncated && (
              <p className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-muted-foreground">Alguma agenda deste dia tem mais consultas do que a visão mostra de uma vez.</p>
            )}
            {data.providers.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground" data-testid="clinic-day-empty">Nenhum profissional ativo na clínica.</div>
            ) : (
              <div className="space-y-3">
                {data.providers.map((provider) => (
                  <section key={provider.providerUserId} className="rounded-2xl border bg-muted/20 p-3" data-testid="clinic-day-provider">
                    <h3 className="flex items-center justify-between text-sm font-semibold">
                      {provider.providerName}
                      <span className="text-xs font-normal text-muted-foreground">{provider.appointments.length}</span>
                    </h3>
                    {provider.appointments.length === 0 ? (
                      <p className="mt-2 text-xs text-muted-foreground">Nenhuma consulta em {dateLabel(date)}.</p>
                    ) : (
                      <ul className="mt-2 space-y-1.5">
                        {provider.appointments.map((appointment) => (
                          <li key={appointment.id} className="flex flex-col gap-1 rounded-xl border bg-background p-2 text-xs sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                              <p className="font-medium">{timeLabel(appointment.startsAtLocal)} · {appointment.patientName || "Paciente"}</p>
                              <p className="text-muted-foreground">{appointment.serviceName ?? ""}{appointment.guardianPhone ? ` · ${appointment.guardianPhone}` : ""}</p>
                            </div>
                            <Badge variant="outline">{statusLabel[appointment.status]}</Badge>
                          </li>
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
