export interface SavedScaleResponse {
  question: string;
  answer: string;
}

const ANALYSIS_FIELD =
  /^(?:score|totalScore|classification|interpretation|domainScores|maxScore|total)$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function parseJson(value: unknown): unknown {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
}

function cleanQuestion(value: unknown, fallback: string): string {
  const text = String(value ?? "").trim();
  return text || fallback;
}

export function savedScaleAnswerText(value: unknown): string {
  if (value === true) return "Sim";
  if (value === false) return "Não";
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function arrayPosition(item: unknown, fallback: number): number {
  if (!isRecord(item)) return fallback;
  const position = Number(item.itemPosition);
  return Number.isInteger(position) && position >= 0 ? position : fallback;
}

function responseFromArrayItem(
  item: unknown,
  index: number,
): SavedScaleResponse {
  const fallback = `Item ${index + 1}`;
  const parsed = parseJson(item);
  if (!isRecord(parsed)) {
    return { question: fallback, answer: savedScaleAnswerText(parsed) };
  }

  // Contrato local/legado: { question, answer }.
  if (Object.prototype.hasOwnProperty.call(parsed, "question")) {
    return {
      question: cleanQuestion(parsed.question, `Pergunta ${index + 1}`),
      answer: savedScaleAnswerText(parsed.answer),
    };
  }

  // Contrato LIVE canônico: { itemId, itemPosition, value: { question, answer } }.
  // O backend cifra `value` e o devolve decriptado exatamente nessa estrutura.
  const nested = parseJson(parsed.value);
  if (isRecord(nested) && Object.prototype.hasOwnProperty.call(nested, "question")) {
    return {
      question: cleanQuestion(nested.question, `Pergunta ${index + 1}`),
      answer: savedScaleAnswerText(nested.answer),
    };
  }

  return {
    question: fallback,
    answer: savedScaleAnswerText(nested ?? parsed.value ?? parsed),
  };
}

/**
 * Normaliza a mesma aplicação salva independentemente de ela vir do contrato
 * local antigo ou do Clinical Core LIVE. Esta função é a fonte única para a
 * tela do paciente, cópia e PDF reemitido — evitando três interpretações
 * diferentes do mesmo registro.
 */
export function savedScaleResponses(result: unknown): SavedScaleResponse[] {
  if (!isRecord(result)) return [];
  const details = parseJson(result.details);
  const detailResponses = isRecord(details) ? details.responses : undefined;
  const source = parseJson(result.responses ?? result.answers ?? detailResponses ?? []);

  if (Array.isArray(source)) {
    return source
      .map((item, originalIndex) => ({
        item,
        originalIndex,
        position: arrayPosition(item, originalIndex),
      }))
      .sort((a, b) => a.position - b.position || a.originalIndex - b.originalIndex)
      .map(({ item }, index) => responseFromArrayItem(item, index))
      .filter((entry) => entry.question.trim().length > 0);
  }

  if (isRecord(source)) {
    return Object.entries(source)
      .filter(([key]) => !ANALYSIS_FIELD.test(key))
      .map(([key, value], index) => ({
        question: /^\d+$/.test(key)
          ? `Item ${Number(key) + 1}`
          : cleanQuestion(key, `Item ${index + 1}`),
        answer: savedScaleAnswerText(value),
      }));
  }

  return [];
}

export function savedScaleName(result: unknown): string {
  if (!isRecord(result)) return "Escala";
  const payload = parseJson(result.payload);
  const payloadTitle = isRecord(payload) ? payload.title : undefined;
  const candidates = [
    payloadTitle,
    result.scaleName,
    result.scale_name,
    result.instrumentName,
    result.instrumentId,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
  }
  return "Escala";
}

export function savedScaleAppliedAt(result: unknown): string | Date | null {
  if (!isRecord(result)) return null;
  const candidates = [
    result.appliedAt,
    result.applicationDate,
    result.createdAt,
    result.applied_at,
  ];
  for (const candidate of candidates) {
    if (candidate instanceof Date) return candidate;
    if (typeof candidate === "string" && candidate.trim()) return candidate;
  }
  return null;
}
