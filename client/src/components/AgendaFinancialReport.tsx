/**
 * AgendaFinancialReport — aba Financeiro da Agenda: relatório por período, com
 * totais por forma de pagamento e por serviço, registro do pagamento de cada
 * consulta e exportação CSV.
 *
 * Só para quem configura a agenda (profissional/admin). O servidor recusa a
 * recepção (403) e é a autoridade sobre período e escopo.
 */
import { useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Download, Receipt, RotateCcw, WalletCards } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  FINANCIAL_PRESET_LABELS,
  financialReportUrl,
  parseMoneyInput,
  periodError,
  presetPeriod,
  type FinancialPeriod,
  type FinancialPreset,
} from "@/lib/financialPeriod";
import {
  appointmentStatusLabel,
  formatMoneyBRL,
  paymentMethodLabel,
  paymentMethodText,
  paymentMethods,
  paymentStatusLabel,
  type FinancialReport,
  type FinancialReportGroup,
  type FinancialReportRow,
} from "@shared/operations";

const PAGE_SIZE = 100;

function dateTimeLabel(value: string): string {
  const [date, time] = value.split("T");
  if (!date || !time) return value;
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year} · ${time}`;
}

function dateLabel(value: string): string {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function money(cents: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

interface AgendaFinancialReportProps {
  today: string;
  busy: boolean;
  mutate: (payload: Record<string, unknown>, success: string) => Promise<boolean>;
}

export function AgendaFinancialReport({ today, busy, mutate }: AgendaFinancialReportProps) {
  const { toast } = useToast();
  const [preset, setPreset] = useState<FinancialPreset>("this_month");
  const [period, setPeriod] = useState<FinancialPeriod>(() => presetPeriod("this_month", today));
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [downloading, setDownloading] = useState(false);
  const invalid = periodError(period);
  const reportKey = financialReportUrl(period);
  const report = useQuery<FinancialReport>({ queryKey: [reportKey], enabled: !invalid, staleTime: 0 });
  const data = report.data;

  function choosePreset(next: FinancialPreset) {
    setPreset(next);
    setVisible(PAGE_SIZE);
    if (next !== "custom") setPeriod(presetPeriod(next, today));
  }

  async function downloadCsv() {
    if (invalid) return;
    setDownloading(true);
    try {
      const response = await apiRequest("GET", financialReportUrl(period, "csv"));
      const blob = await response.blob();
      const href = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = href;
      anchor.download = `financeiro-${period.from}_a_${period.to}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(href), 1000);
      toast({ title: "CSV gerado.", description: "A exportação fica registrada na Atividade da agenda." });
    } catch (error) {
      toast({ title: "Não foi possível gerar o CSV.", description: String(error), variant: "destructive" });
    } finally {
      setDownloading(false);
    }
  }

  const rows = useMemo(() => data?.rows ?? [], [data?.rows]);

  return (
    <div className="space-y-4" data-testid="financial-report">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Relatório financeiro por período</CardTitle>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Considera a <strong className="text-foreground">data da consulta</strong>. “Recebido” soma as consultas do período marcadas como pagas; a data do recebimento não é registrada, então isto não é um extrato de caixa.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Período do relatório">
            {(Object.keys(FINANCIAL_PRESET_LABELS) as FinancialPreset[]).map((item) => (
              <Button
                key={item}
                type="button"
                size="sm"
                variant={preset === item ? "default" : "outline"}
                aria-pressed={preset === item}
                data-testid={`financial-preset-${item}`}
                onClick={() => choosePreset(item)}
              >
                {FINANCIAL_PRESET_LABELS[item]}
              </Button>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <Field label="De">
              <Input
                type="date"
                value={period.from}
                data-testid="financial-from"
                onChange={(event) => { setPreset("custom"); setVisible(PAGE_SIZE); setPeriod((current) => ({ ...current, from: event.target.value })); }}
              />
            </Field>
            <Field label="Até">
              <Input
                type="date"
                value={period.to}
                data-testid="financial-to"
                onChange={(event) => { setPreset("custom"); setVisible(PAGE_SIZE); setPeriod((current) => ({ ...current, to: event.target.value })); }}
              />
            </Field>
            <Button
              type="button"
              variant="secondary"
              className="gap-2"
              data-testid="financial-csv"
              disabled={Boolean(invalid) || downloading || !data || data.rows.length === 0}
              onClick={downloadCsv}
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              {downloading ? "Gerando…" : "Baixar CSV"}
            </Button>
          </div>
          {invalid && <p className="text-xs text-destructive" role="alert">{invalid}</p>}
        </CardContent>
      </Card>

      {!invalid && report.isLoading && <p className="text-sm text-muted-foreground" role="status">Calculando o período…</p>}
      {!invalid && report.isError && (
        <div className="flex flex-col gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm sm:flex-row sm:items-center sm:justify-between" role="alert">
          <p>Não foi possível carregar o relatório deste período.</p>
          <Button type="button" size="sm" variant="outline" onClick={() => report.refetch()}>Tentar novamente</Button>
        </div>
      )}

      {data && !invalid && (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label={`Totais de ${dateLabel(data.period.from)} a ${dateLabel(data.period.to)}`} data-testid="financial-summary">
            <Metric icon={WalletCards} label="Previsto" value={money(data.summary.expectedCents)} detail={`${data.summary.attended} consulta(s) não canceladas`} />
            <Metric icon={CheckCircle2} label="Recebido" value={money(data.summary.paidCents)} detail="consultas do período marcadas como pagas" />
            <Metric icon={Receipt} label="A receber" value={money(data.summary.pendingCents)} detail="pagamento pendente" />
            <Metric icon={RotateCcw} label="Estornado" value={money(data.summary.refundedCents)} detail={`${data.summary.waivedCount} cortesia(s)`} />
          </section>

          <p className="text-xs text-muted-foreground" data-testid="financial-counts">
            {data.summary.appointments} consulta(s) no período · {data.summary.completed} concluída(s) · {data.summary.noShow} falta(s) · {data.summary.cancelled} cancelada(s)
            {data.summary.noAmountCount > 0 ? ` · ${data.summary.noAmountCount} sem valor registrado` : ""}
          </p>
          {data.truncated && (
            <p className="flex gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-muted-foreground" role="status">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
              O período tem mais consultas do que o limite de um relatório ({rows.length}). Os totais e o CSV cobrem só as primeiras; reduza o período.
            </p>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            <GroupCard title="Recebido por forma de pagamento" empty="Nenhum pagamento registrado no período." groups={data.byPaymentMethod} testId="financial-by-method" />
            <GroupCard title="Por serviço (consultas não canceladas · recebido)" empty="Nenhuma consulta no período." groups={data.byService} testId="financial-by-service" />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Consultas e recebimentos do período</CardTitle>
              <p className="text-xs text-muted-foreground">Registre valor, situação e forma de pagamento de cada consulta. O relatório se atualiza ao salvar.</p>
            </CardHeader>
            <CardContent className="space-y-2">
              {rows.length === 0 ? (
                <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">Nenhuma consulta neste período.</div>
              ) : (
                <>
                  {rows.slice(0, visible).map((row) => <PaymentRow key={`${row.id}:${row.paymentStatus}:${row.paymentMethod ?? ""}:${row.amountCents ?? ""}`} row={row} busy={busy} mutate={mutate} />)}
                  {rows.length > visible && (
                    <Button type="button" variant="outline" className="w-full" onClick={() => setVisible((current) => current + PAGE_SIZE)}>
                      Mostrar mais ({rows.length - visible} restantes)
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <Label asChild><span>{label}</span></Label>
      {children}
    </label>
  );
}

function Metric({ icon: Icon, label, value, detail }: { icon: typeof WalletCards; label: string; value: string; detail?: string }) {
  return (
    <Card>
      <CardContent className="flex items-start gap-3 p-4">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary"><Icon className="h-4 w-4" aria-hidden="true" /></span>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="mt-1 text-xl font-black">{value}</p>
          {detail && <p className="mt-1 text-[11px] text-muted-foreground">{detail}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function GroupCard({ title, empty, groups, testId }: { title: string; empty: string; groups: FinancialReportGroup[]; testId: string }) {
  return (
    <Card data-testid={testId}>
      <CardHeader><CardTitle className="text-sm">{title}</CardTitle></CardHeader>
      <CardContent>
        {groups.length === 0 ? (
          <p className="text-xs text-muted-foreground">{empty}</p>
        ) : (
          <ul className="divide-y text-sm">
            {groups.map((group) => (
              <li key={group.key} className="flex items-center justify-between gap-3 py-2">
                <span className="min-w-0 truncate">{group.label} <span className="text-xs text-muted-foreground">· {group.count}</span></span>
                <strong className="shrink-0">{money(group.cents)}</strong>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function PaymentRow({ row, busy, mutate }: { row: FinancialReportRow; busy: boolean; mutate: AgendaFinancialReportProps["mutate"] }) {
  const [amount, setAmount] = useState(row.amountCents !== null ? String(row.amountCents / 100).replace(".", ",") : "");
  const [status, setStatus] = useState(row.paymentStatus);
  const [method, setMethod] = useState(row.paymentMethod ?? "");
  const label = row.patientName || "Paciente";
  const amountCents = parseMoneyInput(amount);
  return (
    <div className="grid gap-3 rounded-2xl border p-4 md:grid-cols-[minmax(0,1fr)_120px_140px_170px_auto] md:items-end" data-testid="financial-row">
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-2 font-semibold">{label}<Badge variant="outline">{appointmentStatusLabel[row.status]}</Badge></p>
        <p className="text-xs text-muted-foreground">{dateTimeLabel(row.startsAtLocal)} · {row.serviceName || "Serviço"}</p>
        <p className="text-[11px] text-muted-foreground">Atual: {formatMoneyBRL(row.amountCents)} · {paymentStatusLabel[row.paymentStatus]}{row.paymentStatus === "paid" ? ` · ${paymentMethodText(row.paymentMethod)}` : ""}</p>
      </div>
      <Field label="Valor R$"><Input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" aria-label={`Valor da consulta de ${label}`} /></Field>
      <Field label="Situação">
        <select className="min-h-11 w-full rounded-xl border bg-background px-3 text-sm" value={status} onChange={(event) => setStatus(event.target.value as typeof status)}>
          <option value="pending">Pendente</option>
          <option value="paid">Pago</option>
          <option value="waived">Cortesia</option>
          <option value="refunded">Estornado</option>
        </select>
      </Field>
      <Field label="Forma">
        <select className="min-h-11 w-full rounded-xl border bg-background px-3 text-sm" value={method} onChange={(event) => setMethod(event.target.value)}>
          <option value="">Não informada</option>
          {paymentMethods.map((item) => <option key={item} value={item}>{paymentMethodLabel[item]}</option>)}
          {method === "manual" && <option value="manual">{paymentMethodLabel.manual}</option>}
        </select>
      </Field>
      <Button
        disabled={busy || amountCents === undefined}
        onClick={() => mutate(
          {
            action: "appointment_payment",
            id: row.id,
            amountCents,
            paymentStatus: status,
            paymentMethod: method || null,
          },
          "Financeiro atualizado.",
        )}
      >
        Salvar
      </Button>
      {amountCents === undefined && <p className="text-[11px] text-destructive md:col-span-5" role="alert">Valor inválido: use, por exemplo, 150 ou 150,50.</p>}
    </div>
  );
}
