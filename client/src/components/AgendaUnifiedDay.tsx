/**
 * AgendaUnifiedDay — visão unificada do dia da recepção (issue 1064, etapa D).
 *
 * Só leitura. Reúne, num único dia, as agendas dos profissionais que a recepção
 * atende. Cada profissional é buscado pelo MESMO pedido da etapa C (uma chave de
 * consulta por profissional, `?provider=<id>`), então cada pedido é exatamente um
 * par (profissional, clínica) com vínculo, membership e billing validados no
 * servidor. Nenhuma ação é feita daqui: para agir numa consulta, abre-se a agenda
 * do profissional (que diz de qual agenda a ação é).
 */
import { useQueries } from "@tanstack/react-query";
import { CalendarClock, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { dashboardKeyFor, type ProviderChoice } from "@/lib/agendaProvider";
import { buildUnifiedDay, selectUnifiedProviders } from "@/lib/agendaUnifiedDay";
import { appointmentStatusLabel as statusLabel, type OperationsDashboard } from "@shared/operations";

function dateLabel(value: string): string {
  const [year, month, day] = value.split("-");
  return year && month && day ? `${day}/${month}/${year}` : value;
}

interface AgendaUnifiedDayProps {
  providers: ProviderChoice[];
  date: string;
  onDateChange: (date: string) => void;
  onOpenAgenda: (providerId: string) => void;
}

export function AgendaUnifiedDay({ providers, date, onDateChange, onOpenAgenda }: AgendaUnifiedDayProps) {
  const { shown, hidden } = selectUnifiedProviders(providers);
  const results = useQueries({
    queries: shown.map((choice) => ({
      queryKey: [dashboardKeyFor(choice.id)],
      // O padrão do app nunca rebusca; aqui a recepção quer o dia como está agora.
      staleTime: 0,
      refetchOnMount: "always" as const,
    })),
  });

  const day = buildUnifiedDay(
    date,
    shown.map((choice, index) => ({
      choice,
      data: results[index]?.data as OperationsDashboard | undefined,
      isLoading: Boolean(results[index]?.isLoading),
      isError: Boolean(results[index]?.isError),
    })),
  );
  const loading = day.providers.some((provider) => provider.status === "loading");
  const failed = day.providers.filter((provider) => provider.status === "error");
  const mixedTimezones = day.timezones.length > 1;

  function retryFailed() {
    results.forEach((result, index) => {
      if (day.providers[index]?.status === "error") void result.refetch();
    });
  }

  return (
    <Card data-testid="agenda-unified-day">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">Dia de todos os profissionais</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Só leitura: reúne as agendas que você atende. Para agir numa consulta, abra a agenda do profissional.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="agenda-unified-date" className="text-xs text-muted-foreground">Dia</Label>
            <Input
              id="agenda-unified-date"
              type="date"
              value={date}
              onChange={(event) => onDateChange(event.target.value)}
              className="w-auto"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <ul className="flex flex-wrap gap-2" aria-label="Agendas reunidas" data-testid="agenda-unified-providers">
          {day.providers.map((provider) => (
            <li key={provider.providerId}>
              <Badge variant="outline" data-state={provider.status} className="gap-1.5 py-1">
                <strong className="font-semibold">{provider.providerName}</strong>
                <span className="text-muted-foreground">
                  {provider.status === "loading"
                    ? "carregando…"
                    : provider.status === "error"
                      ? "não foi possível carregar"
                      : `${provider.count} consulta${provider.count === 1 ? "" : "s"}`}
                </span>
              </Badge>
            </li>
          ))}
        </ul>

        {hidden > 0 && (
          <p className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-muted-foreground" data-testid="agenda-unified-hidden">
            A visão do dia reúne até {shown.length} profissionais. Há mais {hidden}; use “Trocar profissional” para vê-los.
          </p>
        )}
        {mixedTimezones && (
          <p className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-muted-foreground" data-testid="agenda-unified-timezones">
            Os horários estão no fuso de cada profissional ({day.timezones.join(", ")}); não são comparáveis entre agendas.
          </p>
        )}
        {failed.length > 0 && (
          <div className="flex flex-col gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs sm:flex-row sm:items-center sm:justify-between" role="alert" data-testid="agenda-unified-error">
            <p>
              Não foi possível carregar a agenda de {failed.map((provider) => provider.providerName).join(", ")}. O que aparece abaixo é só das outras agendas.
            </p>
            <Button type="button" size="sm" variant="outline" className="min-h-11 sm:min-h-9" onClick={retryFailed}>
              Tentar novamente
            </Button>
          </div>
        )}

        <div role="status" aria-live="polite" className={loading ? "text-xs text-muted-foreground" : "sr-only"}>
          {loading ? "Carregando as agendas…" : `${day.rows.length} consulta(s) em ${dateLabel(date)}.`}
        </div>

        {/* Região com rolagem própria: precisa de foco de teclado (axe:
            scrollable-region-focusable) e de um rótulo que diga o que ela é. */}
        <div
          className="max-h-[34rem] space-y-2 overflow-y-auto pr-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          tabIndex={0}
          role="group"
          aria-label={`Consultas de ${dateLabel(date)} de todos os profissionais`}
        >
          {!loading && day.rows.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground" data-testid="agenda-unified-empty">
              Nenhuma consulta em {dateLabel(date)} nas agendas carregadas.
            </div>
          ) : (
            <ul className="space-y-2">
              {day.rows.map((row) => (
                <li
                  key={row.key}
                  data-testid="agenda-unified-row"
                  data-provider-id={row.providerId}
                  className="flex flex-col gap-3 rounded-2xl border p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 text-sm">
                      <CalendarClock className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                      <span className="font-mono text-xs font-semibold">
                        {row.appointment.startsAtLocal.slice(11, 16)}–{row.appointment.endsAtLocal.slice(11, 16)}
                      </span>
                      {mixedTimezones && <span className="text-[11px] text-muted-foreground">({row.appointment.timezone})</span>}
                      <strong className="truncate">{row.appointment.patientName || "Paciente não informado"}</strong>
                      <Badge variant="outline">{statusLabel[row.appointment.status]}</Badge>
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">{row.providerName}</span>
                      {` · ${row.appointment.serviceName || "Serviço"}`}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="min-h-11 gap-1.5 sm:min-h-9"
                    onClick={() => onOpenAgenda(row.providerId)}
                  >
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    Abrir agenda de {row.providerName}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
