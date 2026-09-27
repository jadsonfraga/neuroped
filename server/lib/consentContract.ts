/**
 * Contrato canônico do lote de consentimentos LGPD usado pelo backend Express.
 *
 * O cliente não escolhe usuário, paciente, texto legal ou finalidade: todos os
 * campos substantivos precisam coincidir com a versão publicada pela aplicação.
 */

import {
  CANONICAL_CONSENTS,
  CURRENT_CONSENT_VERSION,
  REQUIRED_CONSENT_TYPES,
  type RequiredConsentType,
} from "../../shared/consentContract";

// Fonte única do contrato: shared/consentContract.ts (S23/LEG-06). O Express é
// espelho e não pode divergir da API canônica (tests/unit/express-consents-contract).
export { CANONICAL_CONSENTS, CURRENT_CONSENT_VERSION, REQUIRED_CONSENT_TYPES };
export type { RequiredConsentType };

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
