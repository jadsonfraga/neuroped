/**
 * Check-in diário "Hoje": três perguntas por dia.
 *
 * Fica no aparelho, em uma chave cifrada por dia. Salvar um dia não toca nos
 * outros, então uma leitura falha não apaga o histórico. A tela mostra e
 * mantém só a janela dos últimos 7 dias. Não pontua, não interpreta e não
 * infere tendência.
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

export const HOJE_JANELA_DIAS = 7;
/** Ao abrir a tela, dias mais antigos que este limite são apagados do aparelho. */
export const HOJE_LIMPEZA_DIAS = 30;
export const HOJE_MAX_OCORRENCIA = 280;

const HOJE_CHAVE_PREFIXO = "diario:hoje:v1:";
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function chaveDoDia(iso: string): string {
  return `${HOJE_CHAVE_PREFIXO}${iso}`;
}

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

/** Normaliza um registro lido do cofre. Devolve null quando não é um registro válido. */
export function sanitizeCheckin(value: unknown): CheckinHoje | null {
  if (!value || typeof value !== "object") return null;
  const source = value as Record<string, unknown>;
  if (!isIsoDate(source.data)) return null;

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
  return entry;
}

/** Tocar na opção já escolhida desfaz a escolha; tocar em outra troca. */
export function alternarOpcao<T extends string>(current: T | undefined, pressed: T): T | undefined {
  return current === pressed ? undefined : pressed;
}

/** Datas da janela, do dia mais antigo ao atual. */
export function datasDaJanela(hojeIso: string, quantidade = HOJE_JANELA_DIAS): string[] {
  return Array.from({ length: quantidade }, (_, index) => shiftIsoDate(hojeIso, index - (quantidade - 1)));
}

/** Datas que podem ter registro no aparelho: hoje e os dias anteriores até o limite de limpeza. */
export function datasParaLimpar(hojeIso: string): string[] {
  return Array.from({ length: HOJE_LIMPEZA_DIAS + 1 }, (_, index) => shiftIsoDate(hojeIso, -index));
}

/**
 * Janela dos últimos 7 dias até `hojeIso`, em ordem crescente.
 * Dias sem registro vêm sem `registro`; nunca são preenchidos com valor padrão.
 */
export function ultimosDias(entries: readonly CheckinHoje[], hojeIso: string): DiaDaJanela[] {
  const byDate = new Map(entries.map((entry) => [entry.data, entry]));
  return datasDaJanela(hojeIso).map((data) => {
    const registro = byDate.get(data);
    return registro ? { data, registro } : { data };
  });
}
