import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  loadAllPatientResults,
  normalizePatientResultsPayload,
  PATIENT_RESULTS_PAGE_SIZE,
} from "../../client/src/lib/patientResultsPagination";

const results = Array.from({ length: 205 }, (_, index) => ({
  id: `result-${String(index + 1).padStart(3, "0")}`,
  scaleId: "mchat",
}));
const requestedUrls: string[] = [];

const complete = await loadAllPatientResults("patient/with spaces", {
  request: async (url) => {
    requestedUrls.push(url);
    const parsed = new URL(url, "https://neuroped.test");
    const page = Number(parsed.searchParams.get("page"));
    const limit = Number(parsed.searchParams.get("limit"));
    const offset = Number(parsed.searchParams.get("offset"));
    const data = results.slice(offset, offset + limit);
    return Response.json({
      data,
      total: results.length,
      page,
      limit,
      hasMore: offset + data.length < results.length,
    });
  },
});

assert.equal(complete.length, 205);
assert.equal(new Set(complete.map((result) => result.id)).size, 205);
assert.equal(requestedUrls.length, 2, "205 avaliações exigem duas páginas");
assert.match(requestedUrls[0], /patient%2Fwith%20spaces\/results/);
assert.match(requestedUrls[0], /page=1&limit=200&offset=0$/);
assert.match(requestedUrls[1], /page=2&limit=200&offset=200$/);

let rateLimitedRequests = 0;
const waits: number[] = [];
const afterRateLimit = await loadAllPatientResults("patient-1", {
  request: async () => {
    rateLimitedRequests += 1;
    if (rateLimitedRequests === 1) {
      return new Response("muitas requisições", {
        status: 429,
        headers: { "Retry-After": "2" },
      });
    }
    return Response.json({
      data: [],
      total: 0,
      page: 1,
      limit: PATIENT_RESULTS_PAGE_SIZE,
      hasMore: false,
    });
  },
  wait: async (milliseconds) => {
    waits.push(milliseconds);
  },
});
assert.deepEqual(afterRateLimit, []);
assert.equal(rateLimitedRequests, 2, "429 deve ser repetido explicitamente");
assert.deepEqual(waits, [2_000], "Retry-After deve ser respeitado");

const duplicatePage = Array.from({ length: 200 }, (_, index) => ({
  id: `duplicate-test-${index}`,
}));
await assert.rejects(
  loadAllPatientResults("patient-1", {
    request: async (url) => {
      const parsed = new URL(url, "https://neuroped.test");
      const page = Number(parsed.searchParams.get("page"));
      return Response.json({
        data: page === 1 ? duplicatePage : [duplicatePage[0]],
        total: 201,
        page,
        limit: PATIENT_RESULTS_PAGE_SIZE,
        hasMore: page === 1,
      });
    },
  }),
  /IDs duplicados/,
  "páginas sobrepostas não podem produzir backup aparentemente completo",
);

await assert.rejects(
  loadAllPatientResults("patient-1", {
    request: async () => Response.json(results.slice(0, 200)),
  }),
  /API antiga atingiu o limite/,
  "array legado exatamente no teto histórico deve falhar fechado",
);

const legacySmall = await loadAllPatientResults("patient-1", {
  request: async () => Response.json(results.slice(0, 2)),
});
assert.equal(
  legacySmall.length,
  2,
  "arrays legados abaixo do teto seguem compatíveis",
);

assert.equal(
  normalizePatientResultsPayload({
    data: [],
    total: "inválido",
    page: 1,
    limit: 200,
    hasMore: false,
  }).total,
  null,
  "metadado inválido deve ser marcado para rejeição pelo carregador",
);
await assert.rejects(
  loadAllPatientResults("patient-1", {
    request: async () =>
      Response.json({
        data: [],
        total: "inválido",
        page: 1,
        limit: 200,
        hasMore: false,
      }),
  }),
  /metadados completos/,
);

await assert.rejects(
  loadAllPatientResults("patient-1", {
    request: async () =>
      Response.json({
        data: Array.from({ length: 201 }, (_, index) => ({
          id: `overflow-${index}`,
        })),
        total: 201,
        page: 1,
        limit: 200,
        hasMore: false,
      }),
  }),
  /mais avaliações que o limite/,
);

await assert.rejects(
  loadAllPatientResults("patient-1", {
    request: async () =>
      Response.json({
        data: [{ id: 123 }],
        total: 1,
        page: 1,
        limit: 200,
        hasMore: false,
      }),
  }),
  /sem identificador/,
  "IDs não textuais não podem ser normalizados silenciosamente",
);

const expressRoutes = readFileSync(
  new URL("../../server/routes.ts", import.meta.url),
  "utf8",
);
const expressStorage = readFileSync(
  new URL("../../server/storage.ts", import.meta.url),
  "utf8",
);
assert.match(expressRoutes, /countResultsByPatient\(patientId\)/);
assert.match(expressRoutes, /getResultsByPatient\(patientId, limit, offset\)/);
assert.match(expressRoutes, /hasMore: offset \+ data\.length < total/);
assert.match(expressStorage, /\.limit\(limit\)[\s\S]*?\.offset\(offset\)/);
assert.match(
  expressStorage,
  /orderBy\(desc\(scaleResults\.createdAt\), desc\(scaleResults\.id\)\)/,
);

// Exercita o storage usado pela rota Express com volume acima do teto de uma
// página. A rota acima é guardada estaticamente para garantir que usa estes
// métodos e publica o envelope canônico.
const expressTempDirectory = mkdtempSync(
  join(tmpdir(), "neuroped-patient-results-"),
);
const previousDatabasePath = process.env.DATABASE_PATH;
process.env.DATABASE_PATH = join(expressTempDirectory, "results.sqlite");
const { sqlite, storage } = await import("../../server/storage");
try {
  const timestamp = "2026-08-14T12:00:00.000Z";
  sqlite
    .prepare(
      `INSERT INTO patients (id, name, created_at, updated_at)
       VALUES (?, ?, ?, ?)`,
    )
    .run("patient-205", "Paciente de teste", timestamp, timestamp);

  const insertResult = sqlite.prepare(
    `INSERT INTO scale_results
      (id, patient_id, scale_name, answers, total_score, classification, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  );
  sqlite.transaction(() => {
    for (let index = 0; index < 205; index += 1) {
      insertResult.run(
        `express-result-${String(index).padStart(3, "0")}`,
        "patient-205",
        "M-CHAT-R/F",
        "[]",
        0,
        "Respostas registradas",
        timestamp,
      );
    }
  })();

  assert.equal(storage.countResultsByPatient("patient-205"), 205);
  const expressFirstPage = storage.getResultsByPatient("patient-205", 200, 0);
  const expressSecondPage = storage.getResultsByPatient(
    "patient-205",
    200,
    200,
  );
  assert.equal(expressFirstPage.length, 200);
  assert.equal(expressSecondPage.length, 5);
  assert.equal(
    new Set(
      [...expressFirstPage, ...expressSecondPage].map((result) => result.id),
    ).size,
    205,
    "paginação Express não pode repetir ou omitir IDs com timestamps iguais",
  );
} finally {
  sqlite.close();
  rmSync(expressTempDirectory, { recursive: true, force: true });
  if (previousDatabasePath === undefined) delete process.env.DATABASE_PATH;
  else process.env.DATABASE_PATH = previousDatabasePath;
}

console.log(
  "✓ resultados do paciente: Cloudflare/Express >200, integridade e backoff 429 validados",
);
