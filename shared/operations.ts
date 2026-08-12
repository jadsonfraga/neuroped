export const appointmentStatuses = [
  "requested",
  "confirmed",
  "checked_in",
  "in_care",
  "completed",
  "cancelled",
  "no_show",
] as const;
export type AppointmentStatus = (typeof appointmentStatuses)[number];

export const paymentStatuses = ["pending", "paid", "waived", "refunded"] as const;
export type PaymentStatus = (typeof paymentStatuses)[number];

export const bookingModalities = ["in_person", "remote"] as const;
export type BookingModality = (typeof bookingModalities)[number];

export const waitlistStatuses = ["waiting", "offered", "booked", "closed"] as const;
export type WaitlistStatus = (typeof waitlistStatuses)[number];

export const notificationStatuses = [
  "pending_provider",
  "manual_sent",
  "delivered",
  "failed",
] as const;
export type NotificationStatus = (typeof notificationStatuses)[number];

export interface ProviderProfile {
  userId: string;
  slug: string;
  displayName: string;
  specialty: string;
  locationLabel: string | null;
  timezone: string;
  bookingEnabled: boolean;
  updatedAt: string;
}

export interface BookingService {
  id: string;
  providerUserId: string;
  name: string;
  durationMinutes: number;
  priceCents: number | null;
  modality: BookingModality;
  active: boolean;
  publicVisible: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AvailabilityRule {
  id: string;
  providerUserId: string;
  weekday: number;
  startMinute: number;
  endMinute: number;
  slotMinutes: number;
  active: boolean;
  createdAt: string;
}

export interface AvailabilityBlock {
  id: string;
  providerUserId: string;
  startsAtLocal: string;
  endsAtLocal: string;
  reason: string | null;
  createdAt: string;
}

export interface Appointment {
  id: string;
  providerUserId: string;
  serviceId: string;
  patientId: string | null;
  startsAtLocal: string;
  endsAtLocal: string;
  timezone: string;
  status: AppointmentStatus;
  source: "public" | "professional" | "waitlist";
  guardianName: string | null;
  guardianEmail: string | null;
  guardianPhone: string | null;
  patientName: string | null;
  amountCents: number | null;
  paymentStatus: PaymentStatus;
  paymentMethod: string | null;
  checkedInAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  createdAt: string;
  updatedAt: string;
  serviceName?: string;
  serviceModality?: BookingModality;
}

export interface WaitlistEntry {
  id: string;
  providerUserId: string;
  serviceId: string;
  preferredDate: string | null;
  status: WaitlistStatus;
  guardianName: string | null;
  guardianEmail: string | null;
  guardianPhone: string | null;
  patientName: string | null;
  createdAt: string;
  updatedAt: string;
  serviceName?: string;
}

export interface AppointmentReview {
  id: string;
  appointmentId: string;
  providerUserId: string;
  rating: number;
  comment: string | null;
  approved: boolean;
  createdAt: string;
}

export interface NotificationOutboxItem {
  id: string;
  appointmentId: string | null;
  providerUserId: string;
  channel: "manual" | "email" | "whatsapp" | "sms";
  template: string;
  recipient: string | null;
  message: string;
  status: NotificationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface OperationsMetrics {
  today: number;
  upcoming: number;
  requested: number;
  waitlist: number;
  pendingReviews: number;
  pendingNotifications: number;
  expectedCents: number;
  paidCents: number;
  noShow30d: number;
}

export interface OperationsAccessContext {
  actorUserId: string;
  actorRole: string;
  providerUserId: string;
  providerName: string;
  delegated: boolean;
  canConfigure: boolean;
}

export interface OperationsStaffLink {
  staffUserId: string;
  staffName: string;
  staffEmail: string;
  active: boolean;
  createdAt: string;
}

export interface OperationsAuditEntry {
  id: string;
  actorUserId: string;
  actorName: string;
  action: string;
  targetType: string;
  targetId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface OperationsDashboard {
  profile: ProviderProfile;
  services: BookingService[];
  rules: AvailabilityRule[];
  blocks: AvailabilityBlock[];
  appointments: Appointment[];
  waitlist: WaitlistEntry[];
  reviews: AppointmentReview[];
  notifications: NotificationOutboxItem[];
  metrics: OperationsMetrics;
  access: OperationsAccessContext;
  staff: OperationsStaffLink[];
  audit: OperationsAuditEntry[];
}

export interface PublicProviderProfile {
  slug: string;
  displayName: string;
  specialty: string;
  locationLabel: string | null;
  timezone: string;
  bookingEnabled: boolean;
  services: BookingService[];
  reviews: Array<Pick<AppointmentReview, "rating" | "comment" | "createdAt">>;
}

export interface PublicSlot {
  startsAtLocal: string;
  endsAtLocal: string;
}

export function isValidLocalDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month - 1, day);
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function isValidLocalDateTime(value: string): boolean {
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match || !isValidLocalDate(match[1])) return false;
  const hour = Number(match[2]);
  const minute = Number(match[3]);
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
}

export function isValidTimeZone(value: string): boolean {
  if (!value.trim() || value.length > 80) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format(new Date(0));
    return true;
  } catch {
    return false;
  }
}

export function selectFutureSlots(
  slots: PublicSlot[],
  currentLocal: string,
  limit = 96,
): PublicSlot[] {
  if (!isValidLocalDateTime(currentLocal)) return [];
  const safeLimit = Number.isInteger(limit) ? Math.max(1, Math.min(288, limit)) : 96;
  const seen = new Set<string>();
  const selected: PublicSlot[] = [];
  for (const slot of slots) {
    if (
      !isValidLocalDateTime(slot.startsAtLocal) ||
      !isValidLocalDateTime(slot.endsAtLocal) ||
      slot.endsAtLocal <= slot.startsAtLocal ||
      slot.startsAtLocal <= currentLocal
    ) {
      continue;
    }
    const key = `${slot.startsAtLocal}|${slot.endsAtLocal}`;
    if (seen.has(key)) continue;
    seen.add(key);
    selected.push(slot);
    if (selected.length >= safeLimit) break;
  }
  return selected;
}

export function minutesToClock(total: number): string {
  const normalized = Math.max(0, Math.min(1439, Math.trunc(total)));
  const hh = String(Math.floor(normalized / 60)).padStart(2, "0");
  const mm = String(normalized % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

export function addMinutesLocal(localDateTime: string, minutes: number): string {
  if (!isValidLocalDateTime(localDateTime)) throw new Error("Data/hora local inválida");
  const [datePart, timePart] = localDateTime.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day, hour, minute + minutes));
  return `${utc.getUTCFullYear()}-${String(utc.getUTCMonth() + 1).padStart(2, "0")}-${String(utc.getUTCDate()).padStart(2, "0")}T${String(utc.getUTCHours()).padStart(2, "0")}:${String(utc.getUTCMinutes()).padStart(2, "0")}`;
}

function localMinuteEpoch(value: string): number {
  const [datePart, timePart] = value.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);
  return Math.floor(Date.UTC(year, month - 1, day, hour, minute) / 60000);
}

function epochMinuteToLocal(value: number): string {
  const date = new Date(value * 60000);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}T${String(date.getUTCHours()).padStart(2, "0")}:${String(date.getUTCMinutes()).padStart(2, "0")}`;
}

export function appointmentSlotKeys(
  startsAtLocal: string,
  endsAtLocal: string,
  stepMinutes = 5,
): string[] {
  if (!isValidLocalDateTime(startsAtLocal) || !isValidLocalDateTime(endsAtLocal)) {
    throw new Error("INVALID_APPOINTMENT_INTERVAL");
  }
  if (!Number.isInteger(stepMinutes) || stepMinutes < 1 || stepMinutes > 60) {
    throw new Error("INVALID_SLOT_LOCK_STEP");
  }
  const start = localMinuteEpoch(startsAtLocal);
  const end = localMinuteEpoch(endsAtLocal);
  if (end <= start || end - start > 1440) throw new Error("INVALID_APPOINTMENT_INTERVAL");
  const firstBucket = Math.floor(start / stepMinutes) * stepMinutes;
  const keys: string[] = [];
  for (let bucket = firstBucket, guard = 0; bucket < end && guard < 1441; bucket += stepMinutes, guard += 1) {
    if (bucket + stepMinutes <= start) continue;
    keys.push(epochMinuteToLocal(bucket));
  }
  if (!keys.length) throw new Error("INVALID_APPOINTMENT_INTERVAL");
  return keys;
}

export function overlapsLocal(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export function occupiesSchedule(status: AppointmentStatus): boolean {
  return ["requested", "confirmed", "checked_in", "in_care"].includes(status);
}

export function formatMoneyBRL(cents: number | null | undefined): string {
  if (typeof cents !== "number" || !Number.isFinite(cents)) return "Valor confirmado pela clínica";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}
