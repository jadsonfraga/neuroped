// @ts-check
/**
 * Backend clínico sintético para a prova visual AUTENTICADA.
 *
 * Por que existe: o gate visual anterior servia `/api/health` declarando
 * `authentication.required: false`. Nesse modo o cliente entra em `accessMode
 * "local"` e NUNCA exercita o cockpit autenticado — login, tenant, prontuário
 * LIVE, sessão expirada e logout ficavam sem cobertura de navegador.
 *
 * Este servidor implementa o mesmo CONTRATO das Functions do Cloudflare
 * (functions/api/**) com dados exclusivamente FICTÍCIOS gerados em memória.
 * Nenhum dado real de paciente entra aqui, nada é persistido em disco e o
 * processo morre junto com a auditoria.
 *
 * Cenários por requisição: o header `x-neuroped-mock-scenario` seleciona o
 * comportamento do backend (`default`, `empty`, `error`, `slow`, `expired`),
 * o que permite capturar estados vazios, de carregamento, de erro recuperável
 * e de sessão expirada sem alterar uma linha do app.
 */
import { existsSync, readFileSync } from "node:fs";
import { createServer } from "node:http";
import { extname, resolve, sep } from "node:path";
import { gzipSync } from "node:zlib";
import { randomUUID } from "node:crypto";

const MIME = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
};

/** Conta sintética exclusiva da auditoria. Não existe em nenhum ambiente real. */
export const E2E_ACCOUNT = {
  id: "e2e-professional",
  email: "e2e.visual@neuroped.invalid",
  password: "Auditoria-Visual-2026!",
  name: "Dra. Auditoria Sintética",
  role: "admin",
};

export const E2E_CLINIC = {
  id: "e2e-clinic",
  slug: "clinica-sintetica",
  name: "Clínica Sintética (E2E)",
  legalName: "Clínica Sintética de Auditoria LTDA",
  timezone: "America/Recife",
  status: "active",
  role: "owner",
  membershipCreatedAt: "2025-01-05T12:00:00.000Z",
};

export const E2E_SECOND_CLINIC = {
  id: "e2e-clinic-2",
  slug: "ambulatorio-sintetico",
  name: "Ambulatório Sintético (E2E)",
  legalName: "Ambulatório Sintético de Auditoria LTDA",
  timezone: "America/Recife",
  status: "active",
  role: "clinic_admin",
  membershipCreatedAt: "2025-04-18T12:00:00.000Z",
};

/**
 * Pacientes fictícios. Nomes marcados como sintéticos justamente para que
 * nenhuma captura possa ser confundida com PHI real.
 */
function seedPatients() {
  return [
    {
      id: "e2e-pat-001",
      clinicId: E2E_CLINIC.id,
      status: "active",
      createdAt: "2025-02-03T13:20:00.000Z",
      updatedAt: "2026-08-11T18:05:00.000Z",
      profile: {
        name: "Ana Sintética (fictícia)",
        birthDate: "2018-04-12",
        guardianName: "Responsável Sintético A",
        guardianPhone: "(81) 90000-0001",
        diagnosisCode: "F90.0",
        notes: "Paciente fictícia de auditoria. Não representa pessoa real.",
      },
    },
    {
      id: "e2e-pat-002",
      clinicId: E2E_CLINIC.id,
      status: "active",
      createdAt: "2025-06-19T11:00:00.000Z",
      updatedAt: "2026-07-30T09:40:00.000Z",
      profile: {
        name: "Bruno Sintético (fictício)",
        birthDate: "2016-09-27",
        guardianName: "Responsável Sintético B",
        guardianPhone: "(81) 90000-0002",
        diagnosisCode: "F84.0",
        notes: "Paciente fictício de auditoria. Não representa pessoa real.",
      },
    },
    {
      id: "e2e-pat-003",
      clinicId: E2E_CLINIC.id,
      status: "active",
      createdAt: "2026-01-08T15:45:00.000Z",
      updatedAt: "2026-09-01T08:10:00.000Z",
      profile: {
        name: "Clara Sintética (fictícia)",
        birthDate: "2021-01-30",
        guardianName: "Responsável Sintético C",
        guardianPhone: "(81) 90000-0003",
        diagnosisCode: "G40.3",
        notes: "Paciente fictícia de auditoria. Não representa pessoa real.",
      },
    },
  ];
}

function seedAssessments() {
  return [
    {
      id: "e2e-assess-001",
      clinicId: E2E_CLINIC.id,
      patientId: "e2e-pat-001",
      instrumentId: "snap-iv",
      instrumentVersion: "1.0",
      appliedByUserId: E2E_ACCOUNT.id,
      appliedAt: "2026-08-11T17:55:00.000Z",
      provenanceSource: "professional",
      payload: { title: "SNAP-IV (registro sintético)", summary: "Registro fictício de auditoria." },
      responses: { q1: 2, q2: 1, q3: 3 },
      status: "active",
      createdAt: "2026-08-11T17:55:00.000Z",
      updatedAt: "2026-08-11T17:55:00.000Z",
    },
    {
      id: "e2e-assess-002",
      clinicId: E2E_CLINIC.id,
      patientId: "e2e-pat-001",
      instrumentId: "mchat-r",
      instrumentVersion: "1.0",
      appliedByUserId: E2E_ACCOUNT.id,
      appliedAt: "2026-03-02T14:10:00.000Z",
      provenanceSource: "professional",
      payload: { title: "M-CHAT-R (registro sintético)", summary: "Registro fictício de auditoria." },
      responses: { q1: 0, q2: 1 },
      status: "active",
      createdAt: "2026-03-02T14:10:00.000Z",
      updatedAt: "2026-03-02T14:10:00.000Z",
    },
  ];
}

function seedEvents() {
  return [
    {
      id: "e2e-event-001",
      clinicId: E2E_CLINIC.id,
      patientId: "e2e-pat-001",
      authorUserId: E2E_ACCOUNT.id,
      eventType: "encounter",
      occurredAt: "2026-08-11T17:30:00.000Z",
      encounterId: "encounter",
      provenanceKind: "recorded",
      provenanceSource: "professional",
      payload: { subjective: "Consulta sintética de auditoria." },
      encryptionVersion: "v1",
      supersedesEventId: null,
      status: "active",
      createdAt: "2026-08-11T17:30:00.000Z",
    },
  ];
}

/**
 * Eventos no contrato do Clinical Core (`/api/clinical-core/events`), que é
 * diferente do contrato LIVE: aqui a proveniência é um objeto `provenance`
 * e `data` é discriminado por `eventType` (shared/clinical-core.ts).
 */
function seedClinicalCoreEvents() {
  return [
    {
      id: "e2e-core-001",
      patientId: "e2e-pat-001",
      eventType: "encounter",
      occurredAt: "2026-08-11T17:30:00.000Z",
      provenance: { kind: "documented", source: "professional" },
      data: { encounterType: "followup", reason: "Retorno sintético de auditoria" },
      note: "",
      authorUserId: E2E_ACCOUNT.id,
      status: "active",
      createdAt: "2026-08-11T17:30:00.000Z",
    },
    {
      id: "e2e-core-002",
      patientId: "e2e-pat-001",
      eventType: "medication",
      occurredAt: "2026-08-11T17:40:00.000Z",
      provenance: { kind: "reported", source: "caregiver" },
      data: { genericName: "Medicação fictícia", action: "continue" },
      note: "",
      authorUserId: E2E_ACCOUNT.id,
      status: "active",
      createdAt: "2026-08-11T17:40:00.000Z",
    },
    {
      id: "e2e-core-003",
      patientId: "e2e-pat-001",
      eventType: "observation",
      occurredAt: "2026-05-20T12:00:00.000Z",
      provenance: { kind: "observed", source: "professional" },
      data: { domain: "linguagem", findingStatus: "em acompanhamento" },
      note: "",
      authorUserId: E2E_ACCOUNT.id,
      status: "active",
      createdAt: "2026-05-20T12:00:00.000Z",
    },
  ];
}

function seedDocuments() {
  return [
    {
      id: "e2e-doc-001",
      clinicId: E2E_CLINIC.id,
      patientId: "e2e-pat-001",
      kind: "laudo",
      title: "Laudo sintético de auditoria",
      status: "issued",
      familyVisible: true,
      issuedAt: "2026-08-12T10:00:00.000Z",
      createdAt: "2026-08-12T10:00:00.000Z",
    },
  ];
}

/** Estado por processo — reiniciado a cada execução da auditoria. */
function createState() {
  return {
    patients: seedPatients(),
    assessments: seedAssessments(),
    events: seedEvents(),
    coreEvents: seedClinicalCoreEvents(),
    documents: seedDocuments(),
    sessions: new Map(),
    unknownEndpoints: new Set(),
  };
}

function toPatientApiRecord(patient) {
  return {
    id: patient.id,
    name: patient.profile.name,
    birthDate: patient.profile.birthDate,
    guardianName: patient.profile.guardianName,
    guardianPhone: patient.profile.guardianPhone,
    diagnosisCode: patient.profile.diagnosisCode,
    notes: patient.profile.notes,
    isDemo: true,
    createdAt: patient.createdAt,
    updatedAt: patient.updatedAt,
  };
}

function issueSession(state) {
  const accessToken = `e2e-access-${randomUUID()}`;
  const refreshToken = `e2e-refresh-${randomUUID()}`;
  state.sessions.set(accessToken, { refreshToken, issuedAt: Date.now() });
  return {
    accessToken,
    refreshToken,
    expiresIn: 900,
    user: {
      id: E2E_ACCOUNT.id,
      email: E2E_ACCOUNT.email,
      name: E2E_ACCOUNT.name,
      role: E2E_ACCOUNT.role,
    },
  };
}

function cacheControlFor(pathname) {
  if (pathname === "/sw.js" || pathname === "/sw-build.js") return "no-cache, no-store, must-revalidate";
  if (pathname.startsWith("/assets/")) return "public, max-age=31536000, immutable";
  return "no-cache";
}

const SENSITIVE_JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

function sendJson(response, status, body, headers = SENSITIVE_JSON_HEADERS) {
  response.writeHead(status, headers);
  response.end(JSON.stringify(body));
}

function readBody(request) {
  return new Promise((resolveBody) => {
    let raw = "";
    request.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) request.destroy();
    });
    request.on("end", () => {
      try {
        resolveBody(raw ? JSON.parse(raw) : {});
      } catch {
        resolveBody({});
      }
    });
  });
}

function delay(ms) {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, ms));
}

/**
 * Servidor estático + API clínica sintética.
 *
 * @param {string} root diretório do build do cliente
 * @param {{ port?: number }} [options]
 */
export async function startMockClinicalServer(root, options = {}) {
  const rootPrefix = `${resolve(root)}${sep}`;
  const state = createState();

  const server = createServer(async (request, response) => {
    const url = new URL(request.url ?? "/", "http://audit.local");
    const pathname = decodeURIComponent(url.pathname);
    const scenario = String(request.headers["x-neuroped-mock-scenario"] ?? "default");
    const authorized = String(request.headers.authorization ?? "").startsWith("Bearer e2e-access-");

    try {
      if (pathname.startsWith("/api/")) {
        if (scenario === "slow") await delay(1_800);

        // ─── capacidade: autenticação remota OBRIGATÓRIA e configurada ───
        if (pathname === "/api/health") {
          sendJson(response, 200, {
            status: "ok",
            authentication: { required: true, configured: true },
          }, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-cache" });
          return;
        }

        if (pathname === "/api/auth/login" && request.method === "POST") {
          const body = await readBody(request);
          const email = String(body.email ?? "").trim().toLowerCase();
          const password = String(body.password ?? "");
          if (email !== E2E_ACCOUNT.email || password !== E2E_ACCOUNT.password) {
            sendJson(response, 401, { error: "Credenciais inválidas.", code: "INVALID_CREDENTIALS" });
            return;
          }
          sendJson(response, 200, issueSession(state));
          return;
        }

        if (pathname === "/api/auth/refresh" && request.method === "POST") {
          if (scenario === "expired") {
            sendJson(response, 401, { error: "Sessão expirada.", code: "SESSION_EXPIRED" });
            return;
          }
          const body = await readBody(request);
          const refreshToken = String(body.refreshToken ?? "");
          const known = [...state.sessions.values()].some((session) => session.refreshToken === refreshToken);
          if (!known) {
            sendJson(response, 401, { error: "Refresh inválido.", code: "INVALID_REFRESH" });
            return;
          }
          sendJson(response, 200, issueSession(state));
          return;
        }

        if (pathname === "/api/auth/logout" && request.method === "POST") {
          state.sessions.clear();
          sendJson(response, 200, { ok: true });
          return;
        }

        // Todo o restante da API exige credencial válida — falha fechada.
        if (!authorized || scenario === "expired") {
          sendJson(response, 401, { error: "Não autenticado.", code: "UNAUTHENTICATED" });
          return;
        }

        if (pathname === "/api/auth/me") {
          sendJson(response, 200, {
            id: E2E_ACCOUNT.id,
            email: E2E_ACCOUNT.email,
            name: E2E_ACCOUNT.name,
            role: E2E_ACCOUNT.role,
          });
          return;
        }

        if (pathname === "/api/tenants") {
          sendJson(response, 200, { data: [E2E_CLINIC, E2E_SECOND_CLINIC] });
          return;
        }

        if (pathname === "/api/me/profile") {
          sendJson(response, 200, {
            data: {
              doctorName: E2E_ACCOUNT.name,
              specialty: "Neurologia Pediátrica (sintética)",
              council: "CRM-XX 000000",
            },
          });
          return;
        }

        if (pathname.startsWith("/api/billing/")) {
          sendJson(response, 200, {
            data: { status: "active", plan: "clinical", entitlements: ["clinical"] },
          });
          return;
        }

        if (scenario === "error" && /\/(patients|assessments|events|documents|results)/.test(pathname)) {
          sendJson(response, 500, { error: "Falha temporária ao consultar o serviço clínico.", code: "DB_ERROR" });
          return;
        }

        const clinicId = url.searchParams.get("clinicId");
        const visiblePatients = scenario === "empty"
          ? []
          : state.patients.filter((patient) => !clinicId || patient.clinicId === clinicId);

        // ─── LIVE (tenant-aware, é o caminho usado por sessão autenticada) ───
        if (pathname === "/api/live/patients") {
          if (request.method === "POST") {
            const body = await readBody(request);
            const created = {
              id: `e2e-pat-${randomUUID().slice(0, 8)}`,
              clinicId: String(body.clinicId ?? E2E_CLINIC.id),
              status: "active",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              profile: {
                name: String(body.name ?? "Paciente sintético"),
                birthDate: body.birthDate ?? null,
                guardianName: body.guardianName ?? null,
                guardianPhone: body.guardianPhone ?? null,
                diagnosisCode: body.diagnosisCode ?? null,
                notes: body.notes ?? null,
              },
            };
            state.patients.unshift(created);
            sendJson(response, 201, { id: created.id });
            return;
          }
          sendJson(response, 200, { data: visiblePatients });
          return;
        }

        const livePatientMatch = /^\/api\/live\/patients\/([^/]+)$/.exec(pathname);
        if (livePatientMatch) {
          const patient = state.patients.find((item) => item.id === livePatientMatch[1]);
          if (!patient || scenario === "empty") {
            sendJson(response, 404, { error: "Paciente não encontrado nesta clínica.", code: "PATIENT_NOT_FOUND" });
            return;
          }
          if (request.method === "DELETE") {
            patient.status = "archived";
            sendJson(response, 200, { ok: true });
            return;
          }
          if (request.method === "PATCH" || request.method === "PUT") {
            const body = await readBody(request);
            patient.profile = { ...patient.profile, ...body };
            patient.updatedAt = new Date().toISOString();
            sendJson(response, 200, { ok: true });
            return;
          }
          sendJson(response, 200, patient);
          return;
        }

        if (pathname === "/api/live/assessments") {
          if (request.method === "POST") {
            sendJson(response, 201, { id: `e2e-assess-${randomUUID().slice(0, 8)}` });
            return;
          }
          const patientId = url.searchParams.get("patientId");
          sendJson(response, 200, {
            data: scenario === "empty"
              ? []
              : state.assessments.filter((item) => !patientId || item.patientId === patientId),
          });
          return;
        }

        if (pathname === "/api/live/events") {
          if (request.method === "POST") {
            sendJson(response, 201, { id: `e2e-event-${randomUUID().slice(0, 8)}` });
            return;
          }
          const patientId = url.searchParams.get("patientId");
          sendJson(response, 200, {
            data: scenario === "empty"
              ? []
              : state.events.filter((item) => !patientId || item.patientId === patientId),
          });
          return;
        }

        if (pathname === "/api/live/documents" || pathname === "/api/documents") {
          const patientId = url.searchParams.get("patientId") ?? url.searchParams.get("patient_id");
          sendJson(response, 200, {
            data: scenario === "empty"
              ? []
              : state.documents.filter((item) => !patientId || item.patientId === patientId),
          });
          return;
        }

        // ─── Contrato legado (não-LIVE), mantido para paridade ───
        if (pathname === "/api/patients") {
          const query = (url.searchParams.get("q") ?? "").toLocaleLowerCase("pt-BR");
          const filtered = visiblePatients.filter((patient) =>
            !query || patient.profile.name.toLocaleLowerCase("pt-BR").includes(query));
          sendJson(response, 200, {
            data: filtered.map(toPatientApiRecord),
            total: filtered.length,
            page: 1,
            limit: 50,
            mode: "e2e-mock",
          });
          return;
        }

        const patientResultsMatch = /^\/api\/patients\/([^/]+)\/results$/.exec(pathname);
        if (patientResultsMatch) {
          const patientId = patientResultsMatch[1];
          const rows = scenario === "empty"
            ? []
            : state.assessments.filter((item) => item.patientId === patientId);
          sendJson(response, 200, { data: rows, total: rows.length, page: 1, limit: 200, hasMore: false });
          return;
        }

        const patientMatch = /^\/api\/patients\/([^/]+)$/.exec(pathname);
        if (patientMatch) {
          const patient = state.patients.find((item) => item.id === patientMatch[1]);
          if (!patient) {
            sendJson(response, 404, { error: "Paciente não encontrado.", code: "NOT_FOUND" });
            return;
          }
          sendJson(response, 200, toPatientApiRecord(patient));
          return;
        }

        if (pathname === "/api/clinical-core/events") {
          const patientId = url.searchParams.get("patient_id");
          const rows = scenario === "empty"
            ? []
            : state.coreEvents.filter((item) => !patientId || item.patientId === patientId);
          sendJson(response, 200, { data: rows, total: rows.length, mode: "e2e-mock" });
          return;
        }

        if (pathname === "/api/consultations" || pathname === "/api/conecta/events") {
          sendJson(response, 200, { data: [], total: 0, mode: "e2e-mock" });
          return;
        }

        // Endpoint ainda não modelado: responde vazio (não 404) para não gerar
        // erro de console que mascararia uma regressão real, e é reportado.
        state.unknownEndpoints.add(`${request.method} ${pathname}`);
        sendJson(response, 200, { data: [], mode: "e2e-mock-unmodeled" });
        return;
      }

      // ─── estáticos ───
      const relative = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
      const target = resolve(root, relative);
      if (!target.startsWith(rootPrefix) || !existsSync(target)) {
        response.writeHead(404).end("Not found");
        return;
      }
      const body = readFileSync(target);
      const acceptsGzip = /\bgzip\b/.test(String(request.headers["accept-encoding"] ?? ""));
      const compressible = /\.(?:css|html|js|json|svg)$/.test(target) && body.length >= 1024;
      const payload = acceptsGzip && compressible ? gzipSync(body, { level: 6 }) : body;
      response.writeHead(200, {
        "Content-Type": MIME[extname(target)] ?? "application/octet-stream",
        "Cache-Control": cacheControlFor(pathname),
        Vary: "Accept-Encoding",
        ...(payload !== body ? { "Content-Encoding": "gzip" } : {}),
      });
      response.end(payload);
    } catch (error) {
      response.writeHead(500).end(error instanceof Error ? error.message : String(error));
    }
  });

  await new Promise((resolveListen, reject) => {
    server.once("error", reject);
    server.listen(options.port ?? 4181, "127.0.0.1", resolveListen);
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Servidor sintético sem porta TCP.");

  return {
    origin: `http://127.0.0.1:${address.port}`,
    state,
    close: () => new Promise((resolveClose, reject) => {
      server.close((error) => (error ? reject(error) : resolveClose(undefined)));
    }),
  };
}
