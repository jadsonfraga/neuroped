/**
 * Check-in diário "Hoje": três perguntas por dia, um registro por data.
 *
 * Fica no aparelho (cofre local cifrado). Não pontua, não interpreta e não
 * infere tendência: apenas guarda o que a família observou.
 */

export const HOJE_SONO = ["bem", "regular", "mal"] as const;
export const HOJE_HUMOR = ["tranquilo", "agitado", "irritado", "retraído", "ansioso", "alegre"] as const;
export const HOJE_MEDICACAO = ["no horário", "fora do horário", "não tomou", "não usa"] as const;

export type HojeSono = (typeof HOJE_SONO)[number];
export type HojeHumor = (typeof HOJE_HUMOR)[number];
export type HojeMedicacao = (typeof HOJE_MEDICACAO)[number];

export interface CheckinHoje {
  data: string;
  sono?: HojeSono;
  humor?: HojeHumor;
  medicacao?: HojeMedicacao;
  ocorrencia: string;
}

export interface DiaDaJanela {
  data: string;
  registro?: CheckinHoje;
}

export const HOJE_MAX_ENTRIES = 400;
export const HOJE_MAX_OCORRENCIA = 280;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !ISO_DATE.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function shiftIsoDate(iso: string, days: number): string {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

function pickOption<T extends string>(options: readonly T[], value: unknown): T | undefined {
  return typeof value === "string" && (options as readonly string[]).includes(value) ? (value as T) : undefined;
}

function truncateByCodePoint(text: string, limit: number): string {
  return Array.from(text).slice(0, limit).join("");
}

/**
 * Normaliza o conteúdo lido do cofre: descarta o que não é um registro válido,
 * mantém um registro por data (o último) e limita o tamanho.
 */
export function sanitizeCheckins(value: unknown): CheckinHoje[] {
  if (!Array.isArray(value)) return [];
  const byDate = new Map<string, CheckinHoje>();
  for (const candidate of value) {
    if (!candidate || typeof candidate !== "object") continue;
    const source = candidate as Record<string, unknown>;
    if (!isIsoDate(source.data)) continue;

    const entry: CheckinHoje = {
      data: source.data,
      ocorrencia: typeof source.ocorrencia === "string"
        ? truncateByCodePoint(source.ocorrencia.trim(), HOJE_MAX_OCORRENCIA)
        : "",
    };
    const sono = pickOption(HOJE_SONO, source.sono);
    const humor = pickOption(HOJE_HUMOR, source.humor);
    const medicacao = pickOption(HOJE_MEDICACAO, source.medicacao);
    if (sono) entry.sono = sono;
    if (humor) entry.humor = humor;
    if (medicacao) entry.medicacao = medicacao;
    byDate.set(entry.data, entry);
  }
  return [...byDate.values()]
    .sort((a, b) => a.data.localeCompare(b.data))
    .slice(-HOJE_MAX_ENTRIES);
}

export function upsertCheckin(entries: readonly CheckinHoje[], checkin: CheckinHoje): CheckinHoje[] {
  return sanitizeCheckins([...entries.filter((entry) => entry.data !== checkin.data), checkin]);
}

/** Tocar na opção já escolhida desfaz a escolha; tocar em outra troca. */
export function alternarOpcao<T extends string>(current: T | undefined, pressed: T): T | undefined {
  return current === pressed ? undefined : pressed;
}

/**
 * Janela dos últimos `quantidade` dias até `hojeIso` (inclusive), em ordem crescente.
 * Dias sem registro vêm sem `registro`; nunca são preenchidos com valor padrão.
 */
export function ultimosDias(
  entries: readonly CheckinHoje[],
  hojeIso: string,
  quantidade = 7,
): DiaDaJanela[] {
  const byDate = new Map(entries.map((entry) => [entry.data, entry]));
  return Array.from({ length: quantidade }, (_, index) => {
    const data = shiftIsoDate(hojeIso, index - (quantidade - 1));
    const registro = byDate.get(data);
    return registro ? { data, registro } : { data };
  });
}
