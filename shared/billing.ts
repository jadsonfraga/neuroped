export const COMMERCIAL_PLAN = {
  code: "neuroped_pro_99",
  name: "NeuroPed Profissional",
  currency: "BRL",
  unitAmountCents: 9_900,
  interval: "month",
  trialDays: 14,
  minSeats: 1,
  maxSeats: 250,
} as const;

export const billingStatuses = [
  "trialing",
  "active",
  "past_due",
  "canceled",
  "suspended",
  "incomplete",
] as const;

export type BillingStatus = (typeof billingStatuses)[number];

export interface CommercialAccountSnapshot {
  status: BillingStatus;
  seatQuantity: number;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
}

export type CommercialWriteBlockReason =
  | "ACCOUNT_MISSING"
  | "TRIAL_EXPIRED"
  | "SUBSCRIPTION_INACTIVE"
  | "SEAT_LIMIT_EXCEEDED";

export interface CommercialEntitlement {
  canRead: boolean;
  canWrite: boolean;
  reason: CommercialWriteBlockReason | null;
}

export function normalizeSeatQuantity(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isSafeInteger(parsed)) return null;
  if (parsed < COMMERCIAL_PLAN.minSeats || parsed > COMMERCIAL_PLAN.maxSeats) return null;
  return parsed;
}

function isFuture(value: string | null, nowMs: number): boolean {
  if (!value) return false;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && parsed > nowMs;
}

/**
 * Cancelamento ou inadimplência nunca sequestram a leitura/exportação de dados.
 * Escritas, por outro lado, exigem trial válido ou assinatura ativa e assentos
 * suficientes. A decisão é pura para ser compartilhada e testada sem frontend.
 */
export function resolveCommercialEntitlement(
  account: CommercialAccountSnapshot | null,
  activeMembers: number,
  nowMs = Date.now(),
): CommercialEntitlement {
  if (!account) return { canRead: false, canWrite: false, reason: "ACCOUNT_MISSING" };

  const canRead = true;
  if (activeMembers > account.seatQuantity) {
    return { canRead, canWrite: false, reason: "SEAT_LIMIT_EXCEEDED" };
  }
  if (account.status === "trialing") {
    return isFuture(account.trialEndsAt, nowMs)
      ? { canRead, canWrite: true, reason: null }
      : { canRead, canWrite: false, reason: "TRIAL_EXPIRED" };
  }
  if (account.status === "active") {
    // Webhooks podem não informar current_period_end em transições antigas. O
    // status assinado do provedor permanece autoritativo nesse caso.
    const periodValid = !account.currentPeriodEnd || isFuture(account.currentPeriodEnd, nowMs);
    return periodValid
      ? { canRead, canWrite: true, reason: null }
      : { canRead, canWrite: false, reason: "SUBSCRIPTION_INACTIVE" };
  }
  return { canRead, canWrite: false, reason: "SUBSCRIPTION_INACTIVE" };
}

export function trialEndsAt(start = new Date()): string {
  return new Date(start.getTime() + COMMERCIAL_PLAN.trialDays * 24 * 60 * 60 * 1_000).toISOString();
}
