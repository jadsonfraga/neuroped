/**
 * Contrato canônico do lote de consentimentos LGPD usado pelo backend Express.
 *
 * O cliente não escolhe usuário, paciente, texto legal ou finalidade: todos os
 * campos substantivos precisam coincidir com a versão publicada pela aplicação.
 */

export const REQUIRED_CONSENT_TYPES = [
  "termo_uso",
  "politica_privacidade",
  "tratamento_dados_saude",
] as const;

export type RequiredConsentType = (typeof REQUIRED_CONSENT_TYPES)[number];

export const CURRENT_CONSENT_VERSION = "2026-05-08-v1";

export const CANONICAL_CONSENTS: Record<
  RequiredConsentType,
  { consentText: string; legalBasis: string; purpose: string }
> = {
  termo_uso: {
    consentText:
      "O NeuroPed EDJ é ferramenta clínica do Dr. Jadson Fraga (CRM-PE 25227, RQE 17756), destinada ao apoio de profissionais de saúde habilitados e pacientes em acompanhamento.",
    legalBasis: "Art. 7º, V — execução de contrato",
    purpose: "Disponibilização da plataforma para uso profissional",
  },
  politica_privacidade: {
    consentText:
      "Dados clínicos e respostas de escalas devem ser tratados com sigilo, controle de acesso e finalidade definida. Quando houver backend disponível, os registros seguem o fluxo seguro da plataforma.",
    legalBasis: "Art. 7º, II — obrigação legal / Art. 7º, V",
    purpose: "Operação do serviço e direitos do titular",
  },
  tratamento_dados_saude: {
    consentText:
      "O tratamento de dados de saúde deve ocorrer apenas para avaliação, acompanhamento, prescrição, documentação clínica e suporte assistencial, sob responsabilidade profissional.",
    legalBasis:
      "Art. 11, II, f — proteção da saúde por profissional habilitado",
    purpose: "Cuidado clínico individualizado",
  },
};

export interface ConsentBatchItem {
  consentType: RequiredConsentType;
  consentVersion: string;
  consentText: string;
  granted: true;
  legalBasis: string;
  purpose: string;
}

export interface ConsentBatchInput {
  version: string;
  acceptedAt: string;
  consents: ConsentBatchItem[];
}

export type ConsentBatchParseResult =
  | { ok: true; value: ConsentBatchInput }
  | { ok: false; message: string };

export const MAX_CONSENT_REQUEST_BYTES = 32 * 1024;

const VERSION_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
const CANONICAL_ISO_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const REQUIRED_TYPE_SET = new Set<string>(REQUIRED_CONSENT_TYPES);
const TOP_LEVEL_KEYS = new Set(["version", "acceptedAt", "consents"]);
const CONSENT_KEYS = new Set([
  "consentType",
  "consentVersion",
  "consentText",
  "granted",
  "legalBasis",
  "purpose",
]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function hasOnlyKeys(
  value: Record<string, unknown>,
  allowed: ReadonlySet<string>,
): boolean {
  return Object.keys(value).every((key) => allowed.has(key));
}

function boundedText(
  value: unknown,
  minLength: number,
  maxLength: number,
): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized.length >= minLength && normalized.length <= maxLength
    ? normalized
    : null;
}

/** Valida o lote sem confiar em campos desconhecidos ou conteúdo legal livre. */
export function parseConsentBatchPayload(
  input: unknown,
  nowMs = Date.now(),
): ConsentBatchParseResult {
  if (!isPlainObject(input) || !hasOnlyKeys(input, TOP_LEVEL_KEYS)) {
    return { ok: false, message: "Corpo deve ser um objeto JSON estrito." };
  }

  const version = boundedText(input.version, 1, 64);
  if (
    !version ||
    !VERSION_PATTERN.test(version) ||
    version !== CURRENT_CONSENT_VERSION
  ) {
    return { ok: false, message: "Versão de consentimento inválida." };
  }

  const acceptedAt = boundedText(input.acceptedAt, 24, 24);
  const acceptedMs = acceptedAt ? Date.parse(acceptedAt) : Number.NaN;
  if (
    !acceptedAt ||
    !CANONICAL_ISO_PATTERN.test(acceptedAt) ||
    !Number.isFinite(acceptedMs) ||
    new Date(acceptedMs).toISOString() !== acceptedAt ||
    acceptedMs > nowMs + 5 * 60_000
  ) {
    return { ok: false, message: "Data de aceite inválida." };
  }

  if (
    !Array.isArray(input.consents) ||
    input.consents.length !== REQUIRED_CONSENT_TYPES.length
  ) {
    return {
      ok: false,
      message: "Envie os três consentimentos obrigatórios em um único lote.",
    };
  }

  const seen = new Set<string>();
  const parsedConsents: ConsentBatchItem[] = [];
  for (const candidate of input.consents) {
    if (!isPlainObject(candidate) || !hasOnlyKeys(candidate, CONSENT_KEYS)) {
      return { ok: false, message: "Item de consentimento inválido." };
    }

    const consentType = candidate.consentType;
    const consentVersion = boundedText(candidate.consentVersion, 1, 64);
    const consentText = boundedText(candidate.consentText, 10, 4_000);
    const legalBasis = boundedText(candidate.legalBasis, 3, 500);
    const purpose = boundedText(candidate.purpose, 3, 500);
    const canonical =
      typeof consentType === "string" && REQUIRED_TYPE_SET.has(consentType)
        ? CANONICAL_CONSENTS[consentType as RequiredConsentType]
        : null;

    if (
      typeof consentType !== "string" ||
      !REQUIRED_TYPE_SET.has(consentType) ||
      seen.has(consentType) ||
      consentVersion !== version ||
      !consentText ||
      candidate.granted !== true ||
      !legalBasis ||
      !purpose ||
      !canonical ||
      consentText !== canonical.consentText ||
      legalBasis !== canonical.legalBasis ||
      purpose !== canonical.purpose
    ) {
      return { ok: false, message: "Conteúdo do consentimento inválido." };
    }

    seen.add(consentType);
    parsedConsents.push({
      consentType: consentType as RequiredConsentType,
      consentVersion,
      consentText,
      granted: true,
      legalBasis,
      purpose,
    });
  }

  if (REQUIRED_CONSENT_TYPES.some((type) => !seen.has(type))) {
    return { ok: false, message: "Há consentimento obrigatório ausente." };
  }

  return {
    ok: true,
    value: { version, acceptedAt, consents: parsedConsents },
  };
}
