export const BOACONSULTA_MAPPING_VERSION = "boaconsulta-generic-v1";

export type BoaConsultaRecordType = "patient" | "encounter" | "document" | "unknown";

export interface BoaConsultaNormalizedRecord {
  patientName?: string;
  birthDate?: string;
  cpfDigits?: string;
  guardianName?: string;
  guardianPhone?: string;
  diagnosisCode?: string;
  occurredAt?: string;
  clinicalText?: string;
  professional?: string;
  sourceExternalId?: string;
}

export interface BoaConsultaParsedRecord {
  ordinal: number;
  recordType: BoaConsultaRecordType;
  raw: Record<string, unknown>;
  normalized: BoaConsultaNormalizedRecord;
  warnings: string[];
}

export interface BoaConsultaParseResult {
  format: "csv" | "json" | "text" | "pdf";
  mappingVersion: string;
  records: BoaConsultaParsedRecord[];
  warnings: string[];
}

const aliases = {
  patientName: [
    "paciente",
    "nome paciente",
    "nome do paciente",
    "nome completo",
    "nome",
  ],
  birthDate: [
    "data nascimento",
    "data de nascimento",
    "nascimento",
    "data nasc",
  ],
  cpfDigits: ["cpf", "cpf paciente", "documento cpf"],
  guardianName: [
    "responsavel",
    "responsavel legal",
    "nome responsavel",
    "nome do responsavel",
  ],
  guardianPhone: [
    "telefone",
    "celular",
    "telefone responsavel",
    "celular responsavel",
    "whatsapp",
  ],
  diagnosisCode: ["cid", "cid 10", "cid10", "diagnostico cid", "codigo cid"],
  occurredAt: [
    "data atendimento",
    "data do atendimento",
    "data consulta",
    "data da consulta",
    "data evolucao",
    "data da evolucao",
    "data",
  ],
  clinicalText: [
    "prontuario",
    "evolucao",
    "evolucao clinica",
    "anotacao",
    "anotacoes",
    "observacao",
    "observacoes",
    "descricao",
    "conteudo",
    "texto",
  ],
  professional: [
    "profissional",
    "medico",
    "medico responsavel",
    "prestador",
  ],
  sourceExternalId: [
    "id",
    "id atendimento",
    "codigo atendimento",
    "codigo prontuario",
    "id prontuario",
  ],
} as const;

type AliasKey = keyof typeof aliases;

function normalizeHeader(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[_./\\-]+/g, " ")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scalarText(value: unknown): string | undefined {
  if (value == null) return undefined;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || undefined;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return undefined;
}

function findValue(raw: Record<string, unknown>, key: AliasKey): string | undefined {
  const wanted = new Set<string>(aliases[key]);
  for (const [rawKey, rawValue] of Object.entries(raw)) {
    if (!wanted.has(normalizeHeader(rawKey))) continue;
    const text = scalarText(rawValue);
    if (text) return text;
  }
  return undefined;
}

function normalizeDate(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();

  const br = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (br) {
    const day = Number(br[1]);
    const month = Number(br[2]);
    const year = Number(br[3]);
    if (month < 1 || month > 12 || day < 1 || day > 31) return trimmed;
    const base = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    if (!br[4]) return base;
    return `${base}T${String(Number(br[4])).padStart(2, "0")}:${br[5]}:${br[6] ?? "00"}`;
  }

  const isoDate = trimmed.match(/^\d{4}-\d{2}-\d{2}$/);
  if (isoDate) return trimmed;

  const isoInstant = trimmed.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})?$/);
  if (isoInstant) return trimmed;

  return trimmed;
}

function normalizeCpf(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const digits = value.replace(/\D/g, "");
  return digits.length === 11 ? digits : undefined;
}

function normalizePhone(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const compact = value.replace(/\s+/g, " ").trim();
  return compact || undefined;
}

function normalizeRecord(raw: Record<string, unknown>, ordinal: number): BoaConsultaParsedRecord {
  const normalized: BoaConsultaNormalizedRecord = {
    patientName: findValue(raw, "patientName"),
    birthDate: normalizeDate(findValue(raw, "birthDate")),
    cpfDigits: normalizeCpf(findValue(raw, "cpfDigits")),
    guardianName: findValue(raw, "guardianName"),
    guardianPhone: normalizePhone(findValue(raw, "guardianPhone")),
    diagnosisCode: findValue(raw, "diagnosisCode"),
    occurredAt: normalizeDate(findValue(raw, "occurredAt")),
    clinicalText: findValue(raw, "clinicalText"),
    professional: findValue(raw, "professional"),
    sourceExternalId: findValue(raw, "sourceExternalId"),
  };

  for (const key of Object.keys(normalized) as Array<keyof BoaConsultaNormalizedRecord>) {
    if (normalized[key] == null) delete normalized[key];
  }

  const warnings: string[] = [];
  if (!normalized.patientName && !normalized.cpfDigits && !normalized.sourceExternalId) {
    warnings.push("Registro sem identificador de paciente reconhecido.");
  }
  if (!normalized.birthDate && !normalized.cpfDigits && normalized.patientName) {
    warnings.push("Paciente reconhecido apenas pelo nome; exige reconciliação antes de vincular.");
  }

  let recordType: BoaConsultaRecordType = "unknown";
  if (normalized.clinicalText && (normalized.occurredAt || normalized.patientName)) {
    recordType = "encounter";
  } else if (normalized.patientName || normalized.cpfDigits || normalized.guardianName) {
    recordType = "patient";
  } else if (Object.keys(raw).some((key) => /document|arquivo|anexo/i.test(normalizeHeader(key)))) {
    recordType = "document";
  }

  return { ordinal, recordType, raw, normalized, warnings };
}

function delimiterScore(line: string, delimiter: string): number {
  let score = 0;
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') quoted = !quoted;
    else if (!quoted && char === delimiter) score += 1;
  }
  return score;
}

function detectDelimiter(content: string): string {
  const firstLine = content.split(/\r?\n/, 1)[0] ?? "";
  const candidates = [";", ",", "\t"];
  return candidates.sort((a, b) => delimiterScore(firstLine, b) - delimiterScore(firstLine, a))[0];
}

function parseDelimitedRows(content: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];
    if (char === '"') {
      if (quoted && content[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }
    if (!quoted && char === delimiter) {
      row.push(cell);
      cell = "";
      continue;
    }
    if (!quoted && (char === "\n" || char === "\r")) {
      if (char === "\r" && content[index + 1] === "\n") index += 1;
      row.push(cell);
      if (row.some((value) => value.trim() !== "")) rows.push(row);
      row = [];
      cell = "";
      continue;
    }
    cell += char;
  }

  row.push(cell);
  if (row.some((value) => value.trim() !== "")) rows.push(row);
  return rows;
}

function csvRecords(content: string): Record<string, unknown>[] {
  const rows = parseDelimitedRows(content.replace(/^\uFEFF/, ""), detectDelimiter(content));
  if (rows.length < 2) return [];
  const headers = rows[0].map((value, index) => value.trim() || `coluna_${index + 1}`);
  return rows.slice(1).map((cells) => {
    const record: Record<string, unknown> = {};
    headers.forEach((header, index) => {
      record[header] = cells[index]?.trim() ?? "";
    });
    return record;
  });
}

function jsonRecords(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) {
    return value.filter(
      (item): item is Record<string, unknown> => !!item && typeof item === "object" && !Array.isArray(item),
    );
  }
  if (!value || typeof value !== "object") return [];

  const object = value as Record<string, unknown>;
  for (const key of ["records", "data", "pacientes", "prontuarios", "atendimentos", "items"]) {
    if (Array.isArray(object[key])) return jsonRecords(object[key]);
  }
  return [object];
}

function inferTextFormat(content: string, mimeType: string, filename?: string): "csv" | "json" | "text" {
  const lowerName = (filename ?? "").toLocaleLowerCase("pt-BR");
  if (mimeType.includes("json") || lowerName.endsWith(".json")) return "json";
  if (mimeType.includes("csv") || lowerName.endsWith(".csv")) return "csv";
  const trimmed = content.trimStart();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) return "json";
  const delimiter = detectDelimiter(content);
  if (delimiterScore(content.split(/\r?\n/, 1)[0] ?? "", delimiter) > 0) return "csv";
  return "text";
}

export function parseBoaConsultaExport(
  content: string,
  mimeType: string,
  filename?: string,
): BoaConsultaParseResult {
  const format = inferTextFormat(content, mimeType, filename);
  const warnings: string[] = [];
  let sourceRecords: Record<string, unknown>[] = [];

  if (format === "json") {
    try {
      sourceRecords = jsonRecords(JSON.parse(content));
    } catch {
      warnings.push("JSON inválido; o arquivo não foi interpretado.");
    }
  } else if (format === "csv") {
    sourceRecords = csvRecords(content);
    if (sourceRecords.length === 0) warnings.push("CSV sem linhas de dados reconhecíveis.");
  } else {
    const text = content.trim();
    if (text) {
      sourceRecords = [{ prontuario: text }];
      warnings.push("Texto livre preservado, mas sem estrutura suficiente para vinculação automática.");
    }
  }

  const records = sourceRecords.map((raw, index) => normalizeRecord(raw, index));
  const recordWarnings = records.reduce((total, record) => total + record.warnings.length, 0);
  if (recordWarnings > 0) {
    warnings.push(`${recordWarnings} alerta(s) de reconciliação detectado(s) nos registros.`);
  }

  return {
    format,
    mappingVersion: BOACONSULTA_MAPPING_VERSION,
    records,
    warnings,
  };
}

export function boaConsultaPatientFingerprint(record: BoaConsultaNormalizedRecord): string {
  return [
    record.cpfDigits ?? "",
    normalizeHeader(record.patientName ?? ""),
    record.birthDate ?? "",
  ].join("|");
}

export function maskCpf(cpfDigits: string | undefined): string | undefined {
  if (!cpfDigits) return undefined;
  return cpfDigits.length === 11 ? `***.***.***-${cpfDigits.slice(-2)}` : "***";
}
