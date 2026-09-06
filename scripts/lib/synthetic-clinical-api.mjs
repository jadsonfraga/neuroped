// @ts-check
/**
 * API clínica sintética para as auditorias de navegador autenticadas.
 *
 * Motivação (P1 da auditoria 2026-09): a prova visual pública só certificava o
 * *gate* de autenticação. Rotas protegidas — prontuário, escalas, documentos —
 * terminavam na tela de login e a suíte seguia verde. Um cockpit autenticado
 * podia regredir sem que nenhum gate percebesse.
 *
 * Este módulo fecha essa lacuna servindo o **contrato de resposta** das
 * Cloudflare Pages Functions (`functions/api/**`) em memória, com dados 100%
 * fictícios, para que o Chromium da auditoria percorra o app já autenticado.
 *
 * Limites deliberados e permanentes:
 * - É fixture de UI, nunca substituto de teste de backend. Autorização,
 *   fronteira de tenant, criptografia e RBAC continuam cobertos pelos testes de
 *   contrato reais (`tests/unit/cloudflare-*-contract.test.ts` etc.).
 * - Nenhum dado real de paciente entra aqui: os nomes são sentinelas
 *   explicitamente sintéticas e o módulo recusa qualquer credencial que não seja
 *   a do cenário.
 * - Nunca é importado pelo bundle do cliente nem pelo servidor de produção.
 */

const SYNTHETIC_EMAIL = "e2e.visual@neuroped.invalid";
const SYNTHETIC_PASSWORD = "Auditoria-Visual-2026!";

const CLINIC_PRIMARY = {
  id: "clinic-sintetica-alfa",
  slug: "clinica-sintetica-alfa",
  name: "Clínica Sintética Alfa",
  legalName: "Clínica Sintética Alfa LTDA",
  timezone: "America/Recife",
  status: "active",
  role: "owner",
  membershipCreatedAt: "2026-01-05T12:00:00.000Z",
};

const CLINIC_SECONDARY = {
  id: "clinic-sintetica-beta",
  slug: "clinica-sintetica-beta",
  name: "Clínica Sintética Beta",
  legalName: "Clínica Sintética Beta LTDA",
  timezone: "America/Recife",
  status: "active",
  role: "professional",
  membershipCreatedAt: "2026-03-11T12:00:00.000Z",
};

/** Sentinelas sintéticas: nomes impossíveis de confundir com paciente real. */
function seedPatients() {
  return [
    {
      id: "paciente-sintetico-alfa",
      clinicId: CLINIC_PRIMARY.id,
      profile: {
        name: "Paciente Sintético Alfa",
        birthDate: "2017-04-12",
        guardianName: "Responsável Sintético Alfa",
        notes: "Registro fictício de auditoria visual. Não representa pessoa real.",
      },
      createdAt: "2026-02-02T13:00:00.000Z",
      updatedAt: "2026-08-19T13:00:00.000Z",
    },
    {
      id: "paciente-sintetico-bravo",
      clinicId: CLINIC_PRIMARY.id,
      profile: {
        name: "Paciente Sintético Bravo",
        birthDate: "2013-09-30",
        guardianName: "Responsável Sintético Bravo",
        notes: "Registro fictício de auditoria visual. Não representa pessoa real.",
      },
      createdAt: "2026-02-09T13:00:00.000Z",
      updatedAt: "2026-08-22T13:00:00.000Z",
    },
    {
      id: "paciente-sintetico-charlie",
      clinicId: CLINIC_PRIMARY.id,
      profile: {
        name: "Paciente Sintético Charlie",
        birthDate: "2021-01-18",
        guardianName: "Responsável Sintético Charlie",
        notes: "Registro fictício de auditoria visual. Não representa pessoa real.",
      },
      createdAt: "2026-04-01T13:00:00.000Z",
      updatedAt: "2026-08-28T13:00:00.000Z",
    },
  ];
}

function seedAssessments() {
  return [
    {
      id: "avaliacao-sintetica-1",
      clinicId: CLINIC_PRIMARY.id,
      patientId: "paciente-sintetico-alfa",
      instrumentId: "mchat",
      instrumentVersion: "1.0.0",
      status: "final",
      appliedAt: "2026-08-19T12:30:00.000Z",
      payload: { title: "M-CHAT-R/F (rastreio)" },
      responses: [
        { question: "Item 1 (sintético)", answer: "Sim" },
        { question: "Item 2 (sintético)", answer: "Não" },
      ],
    },
    {
      id: "avaliacao-sintetica-2",
      clinicId: CLINIC_PRIMARY.id,
      patientId: "paciente-sintetico-bravo",
      instrumentId: "snap-iv",
      instrumentVersion: "1.0.0",
      status: "final",
      appliedAt: "2026-08-22T12:30:00.000Z",
      payload: { title: "SNAP-IV (rastreio)" },
      responses: [{ question: "Item 1 (sintético)", answer: "Às vezes" }],
    },
  ];
}

/** Eventos do runtime `live` (payload opaco, usado pelo prontuário remoto). */
function seedLiveEvents() {
  return [
    {
      id: "evento-sintetico-1",
      clinicId: CLINIC_PRIMARY.id,
      patientId: "paciente-sintetico-alfa",
      eventType: "encounter",
      status: "active",
      occurredAt: "2026-08-19T12:00:00.000Z",
      encounterId: "",
      payload: { subjective: "" },
    },
  ];
}

/**
 * Eventos do núcleo clínico. O contrato real (`shared/clinical-core.ts` +
 * `functions/api/clinical-core/_schema.ts`) exige `provenance` não-nula em toda
 * linha, então a fixture também exige — servir evento sem proveniência aqui
 * mascararia como "dado de teste" um payload que a produção nunca emite.
 */
function seedCoreEvents() {
  const provenance = (kind) => ({
    kind,
    source: "clinician",
    sourceLabel: "Registro sintético de auditoria",
  });
  return [
    {
      id: "core-sintetico-1",
      patientId: "paciente-sintetico-alfa",
      eventType: "encounter",
      status: "active",
      occurredAt: "2026-08-19T12:00:00.000Z",
      provenance: provenance("documented"),
      data: { encounterType: "followup", reason: "Retorno sintético de auditoria" },
    },
    {
      id: "core-sintetico-2",
      patientId: "paciente-sintetico-alfa",
      eventType: "problem",
      status: "active",
      occurredAt: "2026-08-19T12:05:00.000Z",
      provenance: provenance("decision"),
      data: {
        action: "confirm",
        label: "Hipótese sintética de auditoria",
        certainty: "confirmed",
        status: "active",
      },
    },
    {
      id: "core-sintetico-3",
      patientId: "paciente-sintetico-alfa",
      eventType: "observation",
      status: "active",
      occurredAt: "2026-08-19T12:10:00.000Z",
      provenance: provenance("observed"),
      data: { label: "Observação sintética", valueText: "Sem intercorrências", redFlag: false },
    },
  ];
}

function isoNow() {
  // Data fixa: a auditoria visual precisa de bytes estáveis entre execuções.
  return "2026-09-01T12:00:00.000Z";
}

function operationsDashboard() {
  const providerUserId = "usuario-sintetico-e2e";
  const serviceId = "servico-sintetico-1";
  return {
    profile: {
      userId: providerUserId,
      slug: "clinica-sintetica-alfa",
      displayName: "Profissional Sintético E2E",
      specialty: "Neurologia pediátrica",
      locationLabel: "Consultório sintético",
      timezone: "America/Recife",
      bookingEnabled: true,
      updatedAt: isoNow(),
    },
    services: [
      {
        id: serviceId,
        providerUserId,
        name: "Consulta sintética",
        durationMinutes: 40,
        priceCents: 0,
        modality: "in_person",
        active: true,
        publicVisible: true,
        createdAt: isoNow(),
        updatedAt: isoNow(),
      },
    ],
    rules: [
      {
        id: "regra-sintetica-1",
        providerUserId,
        weekday: 2,
        startMinute: 480,
        endMinute: 720,
        slotMinutes: 40,
        active: true,
        createdAt: isoNow(),
      },
    ],
    blocks: [],
    appointments: [
      {
        id: "agendamento-sintetico-1",
        providerUserId,
        serviceId,
        patientId: "paciente-sintetico-alfa",
        startsAtLocal: "2026-09-01T09:00",
        endsAtLocal: "2026-09-01T09:40",
        timezone: "America/Recife",
        status: "confirmed",
        source: "professional",
        guardianName: "Responsável Sintético Alfa",
        guardianEmail: null,
        guardianPhone: null,
        patientName: "Paciente Sintético Alfa",
        amountCents: null,
        paymentStatus: "pending",
        paymentMethod: null,
        checkedInAt: null,
        completedAt: null,
        cancelledAt: null,
        cancelReason: null,
        createdAt: isoNow(),
        updatedAt: isoNow(),
        serviceName: "Consulta sintética",
        serviceModality: "in_person",
      },
    ],
    waitlist: [],
    reviews: [],
    notifications: [],
    metrics: {
      today: 1,
      upcoming: 1,
      requested: 0,
      waitlist: 0,
      pendingReviews: 0,
      pendingNotifications: 0,
      expectedCents: 0,
      paidCents: 0,
      noShow30d: 0,
    },
    access: {
      actorUserId: providerUserId,
      actorRole: "admin",
      providerUserId,
      providerName: "Profissional Sintético E2E",
      delegated: false,
      canConfigure: true,
    },
    staff: [],
    audit: [],
  };
}

/**
 * @typedef {object} SyntheticApiScenario
 * @property {"populated"|"empty"} [patients] Catálogo de pacientes devolvido.
 * @property {boolean} [multiTenant] Expõe duas clínicas para provar a troca de contexto.
 * @property {Set<string>|string[]} [failing] Prefixos de rota que devolvem 500 (erro recuperável).
 * @property {Set<string>|string[]} [hanging] Prefixos de rota que nunca respondem (estado de carregamento).
 * @property {boolean} [expiredSession] Faz `/api/auth/me` e as rotas clínicas responderem 401.
 */

/**
 * Cria um handler HTTP com o contrato clínico sintético.
 *
 * @param {SyntheticApiScenario} [scenario]
 */
export function createSyntheticClinicalApi(scenario = {}) {
  const state = {
    patients: scenario.patients === "empty" ? [] : seedPatients(),
    assessments: seedAssessments(),
    liveEvents: seedLiveEvents(),
    coreEvents: seedCoreEvents(),
    documents: [],
    sessions: new Set(),
  };

  const failing = new Set(scenario.failing ?? []);
  const hanging = new Set(scenario.hanging ?? []);
  const clinics = scenario.multiTenant
    ? [CLINIC_PRIMARY, CLINIC_SECONDARY]
    : [CLINIC_PRIMARY];

  const user = {
    id: "usuario-sintetico-e2e",
    email: SYNTHETIC_EMAIL,
    name: "Profissional Sintético E2E",
    role: "admin",
    mustChangePassword: false,
  };

  function issueSession() {
    const accessToken = `acesso-sintetico-${state.sessions.size + 1}`;
    const refreshToken = `renovacao-sintetica-${state.sessions.size + 1}`;
    state.sessions.add(accessToken);
    return { accessToken, refreshToken, expiresIn: 900, user };
  }

  function authorized(request) {
    if (scenario.expiredSession) return false;
    const header = String(request.headers.authorization ?? "");
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    return state.sessions.has(token);
  }

  function readBody(request) {
    return new Promise((resolve) => {
      let raw = "";
      request.on("data", (chunk) => { raw += chunk; });
      request.on("end", () => {
        try {
          resolve(raw ? JSON.parse(raw) : {});
        } catch {
          resolve({});
        }
      });
    });
  }

  function send(response, status, body, cacheControl = "no-store") {
    response.writeHead(status, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": cacheControl,
    });
    response.end(JSON.stringify(body));
  }

  /**
   * @returns {Promise<boolean>} `true` quando a rota foi tratada por esta API.
   */
  return async function handleSyntheticApi(request, response, pathname, searchParams) {
    if (!pathname.startsWith("/api/")) return false;

    if ([...hanging].some((prefix) => pathname.startsWith(prefix))) {
      // Nunca responde: prova o estado de carregamento sem timers artificiais na UI.
      return true;
    }
    if ([...failing].some((prefix) => pathname.startsWith(prefix))) {
      send(response, 500, { error: "Falha sintética de servidor para prova de estado de erro." });
      return true;
    }

    if (pathname === "/api/health") {
      send(response, 200, {
        status: "ok",
        authentication: { required: true, configured: true },
      }, "no-cache");
      return true;
    }

    if (pathname === "/api/auth/login" && request.method === "POST") {
      const body = await readBody(request);
      if (body?.email !== SYNTHETIC_EMAIL || body?.password !== SYNTHETIC_PASSWORD) {
        send(response, 401, { error: "Credenciais inválidas." });
        return true;
      }
      send(response, 200, issueSession());
      return true;
    }

    if (pathname === "/api/auth/refresh" && request.method === "POST") {
      const body = await readBody(request);
      if (scenario.expiredSession || !String(body?.refreshToken ?? "").startsWith("renovacao-sintetica-")) {
        send(response, 401, { error: "Sessão expirada." });
        return true;
      }
      send(response, 200, issueSession());
      return true;
    }

    if (pathname === "/api/auth/logout" && request.method === "POST") {
      state.sessions.clear();
      send(response, 200, { ok: true });
      return true;
    }

    if (pathname === "/api/auth/me") {
      if (!authorized(request)) {
        send(response, 401, { error: "Sessão inválida." });
        return true;
      }
      send(response, 200, user);
      return true;
    }

    // A partir daqui tudo é clínico: sem sessão válida, 401 — igual à produção.
    if (!authorized(request)) {
      send(response, 401, { error: "Sessão inválida." });
      return true;
    }

    if (pathname === "/api/tenants") {
      send(response, 200, { data: clinics });
      return true;
    }

    if (pathname.startsWith("/api/tenants/")) {
      const id = pathname.slice("/api/tenants/".length);
      const clinic = clinics.find((candidate) => candidate.id === id);
      if (!clinic) {
        send(response, 404, { error: "Clínica não encontrada." });
        return true;
      }
      send(response, 200, {
        id: clinic.id,
        name: clinic.name,
        settings: { displayName: clinic.name },
      });
      return true;
    }

    if (pathname === "/api/me/profile") {
      if (request.method === "PUT") {
        send(response, 200, { ok: true });
        return true;
      }
      send(response, 200, {
        displayName: "Profissional Sintético E2E",
        fallbackDisplayName: "Profissional Sintético E2E",
        credentialsLine: "Registro profissional sintético",
        specialty: "Neurologia pediátrica",
        documentEmail: SYNTHETIC_EMAIL,
        accountEmail: SYNTHETIC_EMAIL,
        configured: true,
      });
      return true;
    }

    if (pathname === "/api/billing/me") {
      send(response, 200, {
        entitlement: {
          trialActive: false,
          trialDaysRemaining: 0,
          isActive: true,
          isPastDue: false,
        },
        planId: "sintetico",
        subscriptionSeats: 1,
        clinicStatus: "active",
      });
      return true;
    }

    if (pathname === "/api/operations") {
      if (request.method === "POST") {
        await readBody(request);
        send(response, 200, { ok: true });
        return true;
      }
      send(response, 200, operationsDashboard());
      return true;
    }

    if (pathname === "/api/live/patients" || pathname === "/api/patients") {
      if (request.method === "POST") {
        const body = await readBody(request);
        const created = {
          id: `paciente-sintetico-${state.patients.length + 1}`,
          clinicId: CLINIC_PRIMARY.id,
          profile: {
            name: String(body?.name ?? "Paciente Sintético Novo"),
            birthDate: body?.birthDate ?? null,
            guardianName: null,
            notes: "Registro fictício de auditoria visual.",
          },
          createdAt: isoNow(),
          updatedAt: isoNow(),
        };
        state.patients = [...state.patients, created];
        send(response, 201, created);
        return true;
      }
      const rows = pathname === "/api/patients"
        ? state.patients.map((patient) => ({
            id: patient.id,
            name: patient.profile.name,
            birthDate: patient.profile.birthDate,
            notes: patient.profile.notes,
            createdAt: patient.createdAt,
          }))
        : state.patients;
      send(response, 200, {
        data: rows,
        total: rows.length,
        pagination: { total: rows.length, page: 1, limit: Math.max(rows.length, 1), hasMore: false },
      });
      return true;
    }

    const livePatientMatch = /^\/api\/(?:live\/)?patients\/([^/]+)(\/results)?$/.exec(pathname);
    if (livePatientMatch) {
      const id = decodeURIComponent(livePatientMatch[1]);
      const patient = state.patients.find((candidate) => candidate.id === id);
      if (!patient) {
        send(response, 404, { error: "Paciente não encontrado." });
        return true;
      }
      if (livePatientMatch[2]) {
        const rows = state.assessments.filter((row) => row.patientId === id);
        send(response, 200, { data: rows, total: rows.length, hasMore: false });
        return true;
      }
      if (request.method === "DELETE") {
        state.patients = state.patients.filter((candidate) => candidate.id !== id);
        send(response, 200, { ok: true });
        return true;
      }
      if (request.method === "PUT" || request.method === "PATCH") {
        await readBody(request);
        send(response, 200, patient);
        return true;
      }
      send(response, 200, pathname.startsWith("/api/live/")
        ? patient
        : { id: patient.id, ...patient.profile, createdAt: patient.createdAt });
      return true;
    }

    if (pathname === "/api/live/assessments" || pathname === "/api/results") {
      if (request.method === "POST") {
        await readBody(request);
        send(response, 201, { id: `avaliacao-sintetica-${state.assessments.length + 1}` });
        return true;
      }
      const patientId = searchParams.get("patientId") ?? searchParams.get("patient_id");
      const rows = patientId
        ? state.assessments.filter((row) => row.patientId === patientId)
        : state.assessments;
      send(response, 200, { data: rows, total: rows.length, hasMore: false });
      return true;
    }

    if (pathname.startsWith("/api/results/")) {
      send(response, 200, { ok: true });
      return true;
    }

    if (pathname === "/api/live/events" || pathname === "/api/clinical-core/events") {
      const core = pathname === "/api/clinical-core/events";
      if (request.method === "POST" || request.method === "PUT" || request.method === "PATCH") {
        await readBody(request);
        send(response, 200, { id: `evento-sintetico-${Date.now()}` });
        return true;
      }
      const patientId = searchParams.get("patientId") ?? searchParams.get("patient_id");
      const source = core ? state.coreEvents : state.liveEvents;
      const rows = patientId ? source.filter((row) => row.patientId === patientId) : source;
      send(response, 200, { data: rows });
      return true;
    }

    if (pathname === "/api/consultations") {
      if (request.method === "POST") {
        await readBody(request);
        send(response, 201, { id: `consulta-sintetica-${Date.now()}` });
        return true;
      }
      send(response, 200, { data: [] });
      return true;
    }

    if (pathname.startsWith("/api/conecta")) {
      if (request.method === "POST") {
        await readBody(request);
        send(response, 201, { id: `conecta-sintetico-${Date.now()}` });
        return true;
      }
      send(response, 200, { data: [] });
      return true;
    }

    if (pathname === "/api/memory" || pathname.startsWith("/api/memory/")) {
      send(response, 200, { data: [] });
      return true;
    }

    if (pathname === "/api/live/documents" || pathname === "/api/documents") {
      if (request.method === "POST") {
        await readBody(request);
        send(response, 201, { id: `documento-sintetico-${state.documents.length + 1}` });
        return true;
      }
      send(response, 200, { data: state.documents });
      return true;
    }

    if (pathname === "/api/live/intake" || pathname === "/api/live/scale-invitations") {
      if (request.method === "POST") {
        await readBody(request);
        send(response, 201, { id: `convite-sintetico-${Date.now()}` });
        return true;
      }
      send(response, 200, { data: [] });
      return true;
    }

    if (pathname === "/api/consents") {
      send(response, 200, { data: [] });
      return true;
    }

    // Contrato honesto: rota clínica não modelada responde 404, nunca 200 vazio.
    send(response, 404, { error: `Rota sintética não modelada: ${pathname}` });
    return true;
  };
}

export const SYNTHETIC_CREDENTIALS = Object.freeze({
  email: SYNTHETIC_EMAIL,
  password: SYNTHETIC_PASSWORD,
  wrongPassword: "senha-sintetica-incorreta",
});

export const SYNTHETIC_PATIENTS = Object.freeze({
  first: { id: "paciente-sintetico-alfa", name: "Paciente Sintético Alfa" },
  second: { id: "paciente-sintetico-bravo", name: "Paciente Sintético Bravo" },
  third: { id: "paciente-sintetico-charlie", name: "Paciente Sintético Charlie" },
});

export const SYNTHETIC_CLINICS = Object.freeze({
  primary: CLINIC_PRIMARY,
  secondary: CLINIC_SECONDARY,
});
