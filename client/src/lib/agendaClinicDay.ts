/**
 * agendaClinicDay.ts — chaves/URLs do dia da clínica inteira (dono/administrador).
 *
 * `GET /api/operations?resource=clinic_day&date=AAAA-MM-DD`: só leitura, um dia,
 * agendas de todos os profissionais com membership ativa na clínica. O servidor
 * valida a membership `owner`/`clinic_admin` a cada requisição; nada aqui
 * concede acesso.
 */

const SAFE_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function clinicDayKey(date: string): string {
  return SAFE_DATE.test(date)
    ? `/api/operations?resource=clinic_day&date=${date}`
    : `/api/operations?resource=clinic_day`;
}

/** Data AAAA-MM-DD deslocada em dias (calendário puro, sem fuso). */
export function shiftClinicDayDate(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}
