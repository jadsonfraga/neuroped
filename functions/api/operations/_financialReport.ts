/**
 * _financialReport.ts — relatório financeiro da agenda por período, com CSV.
 *
 * Base: data da CONSULTA (`starts_at_local`, no fuso do profissional). Não existe
 * data de recebimento gravada (`appointment_payment` só guarda valor, situação e
 * forma), então "recebido" aqui é "consultas do período marcadas como pagas", e
 * não fluxo de caixa. A tela e o CSV dizem isso.
 *
 * Escopo: exatamente o par (profissional, clínica) já resolvido pelo contexto da
 * agenda. O relatório é restrito a quem configura a agenda (profissional/admin),
 * como o resto do financeiro; a recepção não o recebe.
 */
import { decryptText, type OperationsEnv } from "./_core";
import {
  FINANCIAL_REPORT_MAX_DAYS,
  FINANCIAL_REPORT_MAX_ROWS,
  addDaysToLocalDate,
  appointmentStatusLabel,
  inclusiveDaySpan,
  isValidLocalDate,
  paymentMethodText,
  paymentStatusLabel,
  type AppointmentStatus,
  type FinancialReport,
  type FinancialReportGroup,
  type FinancialReportRow,
  type PaymentStatus,
} from "../../../shared/operations";

export type FinancialPeriodResult =
  | { ok: true; from: string; to: string }
  | { ok: false; error: string; code: "VALIDATION_ERROR" | "PERIOD_TOO_LONG" };

/** `from`/`to` em AAAA-MM-DD, `from <= to`, no máximo FINANCIAL_REPORT_MAX_DAYS dias. */
export function parseFinancialPeriod(url: URL): FinancialPeriodResult {
  const from = (url.searchParams.get("from") ?? "").trim();
  const to = (url.searchParams.get("to") ?? "").trim();
  if (!isValidLocalDate(from) || !isValidLocalDate(to)) {
    return { ok: false, error: "Período inválido: informe as datas inicial e final.", code: "VALIDATION_ERROR" };
  }
  if (from > to) {
    return { ok: false, error: "A data inicial precisa ser anterior ou igual à final.", code: "VALIDATION_ERROR" };
  }
  if (inclusiveDaySpan(from, to) > FINANCIAL_REPORT_MAX_DAYS) {
    return {
      ok: false,
      error: `O período pode ter no máximo ${FINANCIAL_REPORT_MAX_DAYS} dias.`,
      code: "PERIOD_TOO_LONG",
    };
  }
  return { ok: true, from, to };
}

interface ReportRowDb {
  id: string;
  starts_at_local: string;
  status: AppointmentStatus;
  amount_cents: number | null;
  payment_status: PaymentStatus;
  payment_method: string | null;
  patient_name_encrypted: string | null;
  guardian_name_encrypted: string | null;
  service_id: string;
  service_name: string | null;
}

const NOT_ATTENDED: AppointmentStatus[] = ["cancelled", "no_show"];

function cents(value: number | null): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function sortGroups(groups: Map<string, FinancialReportGroup>): FinancialReportGroup[] {
  return [...groups.values()].sort((a, b) => b.cents - a.cents || b.count - a.count || a.label.localeCompare(b.label, "pt-BR"));
}

export async function buildFinancialReport(
  db: D1Database,
  env: OperationsEnv,
  providerUserId: string,
  clinicId: string,
  from: string,
  to: string,
): Promise<FinancialReport> {
  // Intervalo semiaberto em horário local: [from 00:00, dia seguinte a `to` 00:00).
  const startInclusive = `${from}T00:00`;
  const endExclusive = `${addDaysToLocalDate(to, 1)}T00:00`;
  const { results } = await db
    .prepare(
      `SELECT a.id, a.starts_at_local, a.status, a.amount_cents, a.payment_status, a.payment_method,
              a.patient_name_encrypted, a.guardian_name_encrypted, a.service_id, s.name AS service_name
         FROM appointments a
         LEFT JOIN booking_services s ON s.id = a.service_id
        WHERE a.provider_user_id = ? AND a.clinic_id = ?
          AND a.starts_at_local >= ? AND a.starts_at_local < ?
        ORDER BY a.starts_at_local ASC, a.id ASC
        LIMIT ?`,
    )
    .bind(providerUserId, clinicId, startInclusive, endExclusive, FINANCIAL_REPORT_MAX_ROWS + 1)
    .all<ReportRowDb>();

  const all = results ?? [];
  const truncated = all.length > FINANCIAL_REPORT_MAX_ROWS;
  const rowsDb = truncated ? all.slice(0, FINANCIAL_REPORT_MAX_ROWS) : all;

  const summary: FinancialReport["summary"] = {
    appointments: rowsDb.length,
    attended: 0,
    completed: 0,
    cancelled: 0,
    noShow: 0,
    expectedCents: 0,
    paidCents: 0,
    pendingCents: 0,
    refundedCents: 0,
    waivedCount: 0,
    noAmountCount: 0,
  };
  const byMethod = new Map<string, FinancialReportGroup>();
  const byService = new Map<string, FinancialReportGroup>();
  const rows: FinancialReportRow[] = [];

  for (const row of rowsDb) {
    const attended = !NOT_ATTENDED.includes(row.status);
    const amount = cents(row.amount_cents);
    if (row.status === "completed") summary.completed += 1;
    if (row.status === "cancelled") summary.cancelled += 1;
    if (row.status === "no_show") summary.noShow += 1;
    if (attended) {
      summary.attended += 1;
      // Mesma regra do indicador "Previsto" do painel: tudo que não foi cancelado
      // nem falta, pelo valor registrado.
      summary.expectedCents += amount;
      if (row.amount_cents === null) summary.noAmountCount += 1;
      if (row.payment_status === "pending") summary.pendingCents += amount;
    }
    if (row.payment_status === "paid") {
      summary.paidCents += amount;
      const key = row.payment_method || "none";
      const group = byMethod.get(key) ?? { key, label: paymentMethodText(row.payment_method), count: 0, cents: 0 };
      group.count += 1;
      group.cents += amount;
      byMethod.set(key, group);
    }
    if (row.payment_status === "refunded") summary.refundedCents += amount;
    if (row.payment_status === "waived") summary.waivedCount += 1;

    if (attended) {
      const serviceKey = row.service_id;
      const group = byService.get(serviceKey) ?? {
        key: serviceKey,
        label: row.service_name || "Serviço removido",
        count: 0,
        cents: 0,
      };
      group.count += 1;
      if (row.payment_status === "paid") group.cents += amount;
      byService.set(serviceKey, group);
    }

    rows.push({
      id: row.id,
      startsAtLocal: row.starts_at_local,
      status: row.status,
      serviceName: row.service_name,
      patientName: await decryptText(env, row.patient_name_encrypted, "patient_name"),
      guardianName: await decryptText(env, row.guardian_name_encrypted, "guardian_name"),
      amountCents: row.amount_cents,
      paymentStatus: row.payment_status,
      paymentMethod: row.payment_method,
    });
  }

  return {
    period: { from, to, basis: "appointment_date" },
    summary,
    byPaymentMethod: sortGroups(byMethod),
    byService: sortGroups(byService),
    rows,
    truncated,
  };
}

/**
 * Célula CSV segura: aspas sempre, aspas internas dobradas, e prefixo `'` em
 * conteúdo que uma planilha interpretaria como fórmula (=, +, -, @, tab, CR).
 * Nomes vêm de formulário público: sem isso um "=HYPERLINK(...)" viraria fórmula.
 */
export function csvCell(value: string | number | null | undefined): string {
  let text = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

/** Valor em reais com vírgula decimal (planilha em pt-BR), sem símbolo. */
export function csvMoney(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "";
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(Math.round(value));
  return `${sign}${Math.floor(abs / 100)},${String(abs % 100).padStart(2, "0")}`;
}

function dateBr(localDate: string): string {
  const [year, month, day] = localDate.split("-");
  return `${day}/${month}/${year}`;
}

/**
 * CSV separado por ponto e vírgula, com BOM UTF-8 (o Excel em pt-BR abre com
 * acentos e colunas certas). Uma linha por consulta do período.
 */
export function financialReportCsv(report: FinancialReport): string {
  const header = [
    "Data",
    "Hora",
    "Paciente",
    "Responsável",
    "Serviço",
    "Situação da consulta",
    "Valor (R$)",
    "Pagamento",
    "Forma de pagamento",
  ];
  const lines = [header.map(csvCell).join(";")];
  for (const row of report.rows) {
    const [date, time] = row.startsAtLocal.split("T");
    lines.push(
      [
        csvCell(dateBr(date)),
        csvCell(time),
        csvCell(row.patientName),
        csvCell(row.guardianName),
        csvCell(row.serviceName),
        csvCell(appointmentStatusLabel[row.status] ?? row.status),
        csvCell(csvMoney(row.amountCents)),
        csvCell(paymentStatusLabel[row.paymentStatus] ?? row.paymentStatus),
        csvCell(row.paymentStatus === "paid" ? paymentMethodText(row.paymentMethod) : ""),
      ].join(";"),
    );
  }
  return `\uFEFF${lines.join("\r\n")}\r\n`;
}

export function financialReportFilename(from: string, to: string): string {
  return `financeiro-${from}_a_${to}.csv`;
}
