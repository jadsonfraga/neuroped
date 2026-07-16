import { isPlainObject } from "./_request";

export const CLINICAL_INPUT_LIMITS = {
  id: 128,
  scaleName: 300,
  responseItems: 2_000,
  responseQuestion: 8_000,
  responseAnswer: 32_000,
  responseTextTotal: 2_000_000,
  documentTitle: 240,
  documentContent: 1_000_000,
  consultationSection: 100_000,
  consultationTotal: 300_000,
} as const;

export interface ClinicalResponseItem {
  question: string;
  answer: string;
}

export type ClinicalResponsesResult =
  | { ok: true; responses: ClinicalResponseItem[] }
  | { ok: false; message: string; code: "RESPONSES_REQUIRED" | "VALIDATION_ERROR" };

/**
 * Mantém o contrato clínico pergunta + resposta integral, mas impede payloads
 * sem teto. Os limites acomodam instrumentos extensos (inclusive > 100 itens)
 * e respostas narrativas sem permitir gravações de vários megabytes por item.
 */
export function normalizeClinicalResponses(value: unknown): ClinicalResponsesResult {
  if (!Array.isArray(value) || value.length === 0) {
    return {
      ok: false,
      message: "Envie todas as perguntas e respostas por extenso.",
      code: "RESPONSES_REQUIRED",
    };
  }
  if (value.length > CLINICAL_INPUT_LIMITS.responseItems) {
    return {
      ok: false,
      message: `São permitidas no máximo ${CLINICAL_INPUT_LIMITS.responseItems} perguntas e respostas por registro.`,
      code: "VALIDATION_ERROR",
    };
  }

  const responses: ClinicalResponseItem[] = [];
  let totalCharacters = 0;

  for (const item of value) {
    if (!isPlainObject(item) || typeof item.question !== "string") {
      return {
        ok: false,
        message: "Cada resposta deve conter a pergunta em texto.",
        code: "VALIDATION_ERROR",
      };
    }
    if (item.answer != null && typeof item.answer !== "string") {
      return {
        ok: false,
        message: "Cada resposta deve ser texto ou nula.",
        code: "VALIDATION_ERROR",
      };
    }

    const question = item.question.trim();
    const rawAnswer = typeof item.answer === "string" ? item.answer.trim() : "";
    if (!question) {
      return {
        ok: false,
        message: "Toda resposta deve preservar a pergunta por extenso.",
        code: "VALIDATION_ERROR",
      };
    }
    if (question.length > CLINICAL_INPUT_LIMITS.responseQuestion) {
      return {
        ok: false,
        message: `Cada pergunta deve ter no máximo ${CLINICAL_INPUT_LIMITS.responseQuestion} caracteres.`,
        code: "VALIDATION_ERROR",
      };
    }
    if (rawAnswer.length > CLINICAL_INPUT_LIMITS.responseAnswer) {
      return {
        ok: false,
        message: `Cada resposta deve ter no máximo ${CLINICAL_INPUT_LIMITS.responseAnswer} caracteres.`,
        code: "VALIDATION_ERROR",
      };
    }

    const answer = rawAnswer || "Não respondida";
    totalCharacters += question.length + answer.length;
    if (totalCharacters > CLINICAL_INPUT_LIMITS.responseTextTotal) {
      return {
        ok: false,
        message: `O conjunto de perguntas e respostas deve ter no máximo ${CLINICAL_INPUT_LIMITS.responseTextTotal} caracteres.`,
        code: "VALIDATION_ERROR",
      };
    }
    responses.push({ question, answer });
  }

  return { ok: true, responses };
}

export function hasBoundedIdentifier(value: string, maximum = CLINICAL_INPUT_LIMITS.id): boolean {
  if (value.length === 0 || value.length > maximum) return false;
  for (let index = 0; index < value.length; index += 1) {
    const codePoint = value.charCodeAt(index);
    if (codePoint <= 31 || codePoint === 127) return false;
  }
  return true;
}

function isRealIsoDateOnly(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/** ISO 8601 com timezone explícito; rejeita datas impossíveis normalizadas pelo JS. */
export function isValidIsoDateTime(value: string): boolean {
  if (value.length > 40) return false;
  const datePart = value.slice(0, 10);
  if (!isRealIsoDateOnly(datePart)) return false;
  if (
    !/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d{1,9})?)?(?:Z|[+-](?:0\d|1[0-4]):[0-5]\d)$/.test(
      value,
    )
  ) {
    return false;
  }
  return Number.isFinite(Date.parse(value));
}

/** Consultas aceitam tanto YYYY-MM-DD quanto um instante ISO 8601 completo. */
export function isValidIsoDate(value: string): boolean {
  return isRealIsoDateOnly(value) || isValidIsoDateTime(value);
}

export function createClinicalRecordId(prefix: "scale" | "doc" | "cons"): string {
  return `${prefix}-${crypto.randomUUID()}`;
}
