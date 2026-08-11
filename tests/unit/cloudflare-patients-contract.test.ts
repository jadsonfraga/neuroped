import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  normalizePatientWrite,
  toPatientApi,
} from "../../functions/api/patients/_contract";
import {
  onRequestGet as listPatients,
  onRequestPost as createPatient,
} from "../../functions/api/patients/index";
import {
  onRequestDelete as deletePatient,
  onRequestPatch as updatePatient,
} from "../../functions/api/patients/[id]";
import { onRequestGet as listPatientResults } from "../../functions/api/patients/[id]/results";
import { CLINICAL_LEGACY_SENTINEL } from "../../shared/clinical-crypto";

interface FakeStatementResult {
  results?: Array<Record<string, unknown>>;
  meta?: { changes?: number };
}

class FakeStatement {
  bindings: unknown[] = [];

  constructor(
    readonly database: FakeDatabase,
    readonly sql: string,
  ) {}

  bind(...values: unknown[]): this {
    this.bindings = values;
    return this;
  }

  async first<T>(): Promise<T | null> {
    return (await this.database.first(this)) as T | null;
  }

  async all<T>(): Promise<{ results: T[] }> {
    const result = await this.database.all(this);
    return { results: (result.results ?? []) as T[] };
  }

  async run(): Promise<{ meta: { changes: number } }> {
    const result = await this.database.run(this);
    return { meta: { changes: result.meta?.changes ?? 0 } };
  }
}

class FakeDatabase {
  readonly statements: FakeStatement[] = [];
  batchStatements: FakeStatement[] = [];

  constructor(
    readonly handlers: {
      first?: (statement: FakeStatement) => unknown | Promise<unknown>;
      all?: (
        statement: FakeStatement,
      ) => FakeStatementResult | Promise<FakeStatementResult>;
      run?: (
        statement: FakeStatement,
      ) => FakeStatementResult | Promise<FakeStatementResult>;
      batch?: (
        statements: FakeStatement[],
      ) => FakeStatementResult[] | Promise<FakeStatementResult[]>;
    } = {},
  ) {}

  prepare(sql: string): FakeStatement {
    const statement = new FakeStatement(this, sql);
    this.statements.push(statement);
    return statement;
  }

  async first(statement: FakeStatement): Promise<unknown> {
    return this.handlers.first ? this.handlers.first(statement) : null;
  }

  async all(statement: FakeStatement): Promise<FakeStatementResult> {
    return this.handlers.all ? this.handlers.all(statement) : { results: [] };
  }

  async run(statement: FakeStatement): Promise<FakeStatementResult> {
    return this.handlers.run
      ? this.handlers.run(statement)
      : { meta: { changes: 1 } };
  }

  async batch(statements: FakeStatement[]): Promise<FakeStatementResult[]> {
    this.batchStatements = statements;
    if (this.handlers.batch) return this.handlers.batch(statements);
    return statements.map(() => ({ meta: { changes: 1 } }));
  }
}

const professional = {
  id: "user-a",
  email: "medica@example.com",
  name: "Médica",
  role: "professional",
  mustChangePassword: false,
};
const TEST_CLINICAL_KEY = "patients-contract-key-0123456789-abcdefghijklmnopqrstuvwxyz";

function context(
  database: FakeDatabase | undefined,
  request: Request,
  params: Record<string, string> = {},
  user: typeof professional | null = professional,
) {
  return {
    env: database
      ? {
          DB: database,
          CLINICAL_DATA_KEY: TEST_CLINICAL_KEY,
          CLINICAL_ENCRYPTION_STRICT: "false",
        }
      : {},
    request,
    params,
    data: user ? { authUser: user } : {},
  } as never;
}

const normalizedCamel = normalizePatientWrite(
  {
    name: "  Criança Teste  ",
    birthDate: "2018-03-15",
    guardianName: " Responsável ",
  },
  { requireName: true },
);
assert.equal(normalizedCamel.ok, true);
if (normalizedCamel.ok) {
  assert.deepEqual(normalizedCamel.values, {
    name: "Criança Teste",
    birth_date: "2018-03-15",
    guardian_name: "Responsável",
  });
}
assert.equal(
  normalizePatientWrite(
    { name: "Teste", birth_date: "2023-02-29" },
    { requireName: true },
  ).ok,
  false,
  "datas de calendário impossíveis devem ser recusadas",
);

const mapped = toPatientApi({
  id: "patient-1",
  name: "Paciente",
  birth_date: "2018-03-15",
  guardian_name: "Responsável",
  guardian_phone: "81999990000",
  diagnosis_code: "F84.0",
  notes: "Nota",
  is_demo: 1,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-02T00:00:00.000Z",
});
assert.equal(mapped.birthDate, "2018-03-15");
assert.equal(mapped.guardianName, "Responsável");
assert.equal("birth_date" in mapped, false, "a resposta pública deve ser camelCase");

const createDb = new FakeDatabase();
const createResponse = await createPatient(
  context(
    createDb,
    new Request("https://neuroped.test/api/patients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Paciente Novo",
        birthDate: "2020-05-20",
        guardianPhone: "81999990000",
      }),
    }),
  ),
);
assert.equal(createResponse.status, 201);
const created = (await createResponse.json()) as Record<string, unknown>;
assert.equal(created.birthDate, "2020-05-20");
assert.equal(created.isDemo, true);
const insert = createDb.statements.find((statement) =>
  statement.sql.includes("INSERT INTO patients_demo"),
);
assert.ok(insert, "a criação deve persistir no D1");
assert.match(insert.sql, /secure_payload_encrypted/);
assert.match(insert.sql, /birth_date[^\n]*NULL/);
assert.equal(insert.bindings[1], CLINICAL_LEGACY_SENTINEL);
assert.match(String(insert.bindings[2]), /^c1\./, "PII clínica deve chegar cifrada ao D1");
assert.equal(insert.bindings[3], professional.id, "novo paciente deve receber owner");
assert.equal(insert.bindings.includes("2020-05-20"), false, "birthDate não pode persistir em claro");
assert.equal(insert.bindings.includes("Paciente Novo"), false, "nome não pode persistir em claro");
assert.match(insert.sql, /owner_user_id/);
assert.ok(
  createDb.batchStatements.some((statement) => statement.sql.includes("clinical_search_tokens")),
  "criação deve manter blind index para busca sem plaintext",
);

const listDb = new FakeDatabase({
  first: (statement) =>
    statement.sql.includes("COUNT(*)") ? { total: 1 } : null,
  all: () => ({
    results: [
      {
        id: "patient-1",
        owner_user_id: professional.id,
        name: "Paciente",
        birth_date: "2018-03-15",
        guardian_name: "Responsável",
        guardian_phone: "81999990000",
        diagnosis_code: "F84.0",
        notes: "Notas completas",
        secure_payload_encrypted: null,
        is_demo: 1,
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-02T00:00:00.000Z",
      },
    ],
  }),
});
const listResponse = await listPatients(
  context(
    listDb,
    new Request("https://neuroped.test/api/patients?q=Paciente&page=x&limit=999"),
  ),
);
assert.equal(listResponse.status, 200);
const listed = (await listResponse.json()) as {
  data: Array<Record<string, unknown>>;
  page: number;
  limit: number;
};
assert.equal(listed.page, 1, "paginação inválida deve usar fallback seguro");
assert.equal(listed.limit, 50, "limite deve ser limitado a 50");
assert.equal(listed.data[0].birthDate, "2018-03-15");
assert.equal(listed.data[0].notes, "Notas completas");
assert.ok(
  listDb.statements.some((statement) => statement.sql.includes("clinical_search_tokens")),
  "busca deve usar blind index",
);
for (const statement of listDb.statements.filter((statement) =>
  statement.sql.includes("FROM patients_demo p"),
)) {
  assert.match(statement.sql, /owner_user_id = \?/);
  assert.equal(statement.bindings[0], professional.id);
  assert.doesNotMatch(statement.sql, /\bLIKE\b/i);
}

const updateDb = new FakeDatabase({
  first: (statement) => {
    if (statement.sql.includes("SELECT owner_user_id")) {
      return { owner_user_id: professional.id };
    }
    if (statement.sql.includes("secure_payload_encrypted") && statement.sql.includes("FROM patients_demo")) {
      return {
        id: "patient-1",
        owner_user_id: professional.id,
        name: "Paciente",
        birth_date: "2017-04-10",
        guardian_name: null,
        guardian_phone: null,
        diagnosis_code: null,
        notes: null,
        secure_payload_encrypted: null,
        is_demo: 1,
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-02T00:00:00.000Z",
      };
    }
    return null;
  },
});
const updateResponse = await updatePatient(
  context(
    updateDb,
    new Request("https://neuroped.test/api/patients/patient-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ birthDate: "2017-04-10", notes: null }),
    }),
    { id: "patient-1" },
  ),
);
assert.equal(updateResponse.status, 200);
const updated = (await updateResponse.json()) as Record<string, unknown>;
assert.equal(updated.birthDate, "2017-04-10");
const update = updateDb.statements.find((statement) =>
  statement.sql.includes("UPDATE patients_demo"),
);
assert.ok(update);
assert.match(update.sql, /birth_date = NULL/);
assert.match(update.sql, /secure_payload_encrypted = \?/);
assert.match(update.sql, /owner_user_id = \?/);
assert.equal(update.bindings[0], CLINICAL_LEGACY_SENTINEL);
assert.match(String(update.bindings[1]), /^c1\./);
assert.equal(update.bindings.includes("2017-04-10"), false, "PATCH não pode persistir birthDate em claro");
assert.equal(update.bindings.at(-1), professional.id);

const forbiddenDeleteDb = new FakeDatabase({
  first: () => ({ owner_user_id: "user-b" }),
});
const forbiddenDelete = await deletePatient(
  context(
    forbiddenDeleteDb,
    new Request("https://neuroped.test/api/patients/patient-1", { method: "DELETE" }),
    { id: "patient-1" },
  ),
);
assert.equal(forbiddenDelete.status, 403);
assert.equal(forbiddenDeleteDb.batchStatements.length, 0);

const deleteDb = new FakeDatabase({
  first: () => ({ owner_user_id: professional.id }),
  batch: (statements) =>
    statements.map((_, index) => ({ meta: { changes: index === 5 ? 1 : 0 } })),
});
const deleteResponse = await deletePatient(
  context(
    deleteDb,
    new Request("https://neuroped.test/api/patients/patient-1", { method: "DELETE" }),
    { id: "patient-1" },
  ),
);
assert.equal(deleteResponse.status, 200);
assert.deepEqual(await deleteResponse.json(), { id: "patient-1", deleted: true });
const deleteSql = deleteDb.batchStatements.map((statement) => statement.sql).join("\n");
for (const table of [
  "clinical_search_tokens",
  "consultations_demo",
  "scale_results_demo",
  "documents_demo",
  "memory_notes",
  "patients_demo",
]) {
  assert.match(deleteSql, new RegExp(`DELETE FROM ${table}`));
}
const auditInsert = deleteDb.statements.find((statement) => statement.sql.includes("INSERT INTO audit_logs"));
assert.ok(auditInsert, "remoção deve continuar auditada");
const patientDelete = deleteDb.batchStatements.find((statement) =>
  statement.sql.includes("DELETE FROM patients_demo"),
);
assert.ok(patientDelete);
assert.match(patientDelete.sql, /owner_user_id = \?/);
assert.deepEqual(patientDelete.bindings, ["patient-1", professional.id]);

const failingResultsDb = new FakeDatabase({
  first: () => ({ owner_user_id: professional.id }),
  all: () => { throw new Error("D1 unavailable"); },
});
const originalConsoleError = console.error;
console.error = () => undefined;
let failingResults: Response;
try {
  failingResults = await listPatientResults(
    context(
      failingResultsDb,
      new Request("https://neuroped.test/api/patients/patient-1/results"),
      { id: "patient-1" },
    ),
  );
} finally {
  console.error = originalConsoleError;
}
assert.equal(failingResults.status, 500, "falha do banco não pode se disfarçar de histórico vazio");

const appSource = await readFile(new URL("../../client/src/App.tsx", import.meta.url), "utf8");
assert.match(appSource, /path="\/pacientes" component=\{PacientesPage\}/);
assert.match(appSource, /path="\/paciente\/:id" component=\{PacienteDetalhePage\}/);

console.log("✓ pacientes D1: ownership, envelope c1, blind index e ausência de PII plaintext validados");
