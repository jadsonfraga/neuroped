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

/**
 * Permissões efetivas que `GET /api/tenants/:id` devolve para cada papel
 * (fonte: shared/permissions.ts). A tela de Configurações decide as abas por
 * esta lista, então a fixture precisa espelhar o contrato real; a matriz é
 * travada contra o catálogo em tests/unit/tenant-permissions.test.ts.
 */
const SYNTHETIC_PERMISSIONS_BY_ROLE = {
  owner: [
    "organization.manage",
    "organization.lifecycle.read",
    "organization.lifecycle.manage",
    "organization.export",
    "organization.metrics.read",
    "audit.read",
    "team.manage",
    "team.manage_owners",
    "billing.manage",
    "finance.read",
    "clinical.read",
    "clinical.write",
    "outcomes.read",
  ],
  professional: ["clinical.read", "clinical.write", "outcomes.read"],
  // Secretaria/recepção: nenhuma permissão de tenant (agenda e cadastro vivem no módulo de operações).
  assistant: [],
};

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

/**
 * Marcos do checklist de onboarding (fonte: shared/onboarding.ts). Espelhados
 * aqui pelo mesmo motivo de SYNTHETIC_PERMISSIONS_BY_ROLE: este módulo não
 * importa código de produção, só o contrato de resposta.
 */
const SYNTHETIC_ONBOARDING_MILESTONES = [
  { key: "account_created", label: "Conta criada", source: "users.created_at", completed: true },
  { key: "email_verified", label: "E-mail verificado", source: "users.email_verified_at", completed: true },
  { key: "clinic_created", label: "Clínica criada", source: "clinics.created_at", completed: true },
  {
    key: "plan_selected",
    label: "Plano selecionado",
    source: "billing_subscriptions.created_at",
    completed: true,
  },
  {
    key: "billing_configured",
    label: "Billing confirmado",
    source: "billing_invoice_events.charge_paid",
    completed: false,
  },
  {
    key: "first_member",
    label: "Primeiro membro da equipe",
    source: "clinic_memberships.created_at",
    completed: true,
  },
  {
    key: "first_patient",
    label: "Primeiro paciente",
    source: "saas_audit_log.live_patient_create",
    completed: true,
  },
  {
    key: "first_consultation",
    label: "Primeira consulta",
    source: "saas_audit_log.live_clinical_event_create.encounter",
    completed: false,
  },
  {
    key: "first_document",
    label: "Primeiro documento",
    source: "saas_audit_log.live_document_create",
    completed: false,
  },
  {
    key: "first_assessment",
    label: "Primeira avaliação",
    source: "saas_audit_log.live_assessment_create",
    completed: false,
  },
];

function syntheticOnboardingSnapshot(clinicId) {
  const milestones = SYNTHETIC_ONBOARDING_MILESTONES.map((definition) => ({
    key: definition.key,
    label: definition.label,
    source: definition.source,
    status: definition.completed
      ? "completed"
      : definition.key === "billing_configured"
        ? "pending"
        : "pending",
    completedAt: definition.completed ? isoNow() : null,
  }));
  const completed = milestones.filter((m) => m.status === "completed").length;
  const total = milestones.length;
  return {
    clinicId,
    generatedAt: isoNow(),
    progress: {
      completed,
      total,
      percent: Math.round((completed / total) * 100),
    },
    billingEvidence: {
      status: "AWAITING_PROVIDER_EVENT",
      provider: "asaas",
      environment: "sandbox",
      confirmedAt: null,
      source: null,
      limitation:
        "Configuração detectada, mas nenhum evento de pagamento confirmado foi persistido pelo servidor.",
    },
    milestones,
  };
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
 * @property {"owner"|"clinic_admin"|"professional"|"assistant"|"financial"} [primaryRole] Papel de membership na clínica primária.
 * @property {"admin"|"professional"|"reader"|"operator"|"visitor"} [userRole] Papel global sintético, independente da membership.
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
  const primaryClinic = scenario.primaryRole ? { ...CLINIC_PRIMARY, role: scenario.primaryRole } : CLINIC_PRIMARY;
  const clinics = scenario.multiTenant
    ? [primaryClinic, CLINIC_SECONDARY]
    : [primaryClinic];

  const clinicDetails = new Map(clinics.map((clinic) => [clinic.id, {
    ...clinic,
    canManage: clinic.role === "owner" || clinic.role === "clinic_admin",
    permissions: SYNTHETIC_PERMISSIONS_BY_ROLE[clinic.role] ?? [],
    settings: {
      displayName: clinic.name, addressLine1: "", addressLine2: "", phone: "",
      publicEmail: "", companyLine: "", motto: "",
    },
    branding: { primaryColor: null, accentColor: null, headerText: "", footerText: "", logoDataUri: null, configured: false, updatedAt: null },
  }]));

  const user = {
    id: "usuario-sintetico-e2e",
    email: SYNTHETIC_EMAIL,
    name: "Profissional Sintético E2E",
    role: scenario.userRole ?? "admin",
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

    // Visitante (somente escalas): espelha o middleware real, que nega por
    // padrão tudo fora de GET /api/auth/me (functions/api/auth/_visitor.ts).
    if (user.role === "visitor") {
      send(response, 403, { error: "Acesso de visitante restrito às escalas.", code: "VISITOR_RESTRICTED" });
      return true;
    }

    if (pathname === "/api/tenants") {
      send(response, 200, { data: clinics });
      return true;
    }

    // OnboardingProgressCard (client/src/components/OnboardingProgressCard.tsx)
    // busca isso na home autenticada. Sem este handler específico, a rota cai
    // no prefixo genérico /api/tenants/ abaixo — que trata "onboarding" como
    // parte do id da clínica e devolve 404, quebrando a home inteira.
    const onboardingMatch = pathname.match(/^\/api\/tenants\/([^/]+)\/onboarding$/);
    if (onboardingMatch) {
      const id = decodeURIComponent(onboardingMatch[1]);
      const clinic = clinics.find((candidate) => candidate.id === id);
      if (!clinic) {
        send(response, 404, { error: "Clínica não encontrada." });
        return true;
      }
      send(response, 200, syntheticOnboardingSnapshot(id));
      return true;
    }

    if (pathname.startsWith("/api/tenants/")) {
      const id = pathname.slice("/api/tenants/".length);
      const clinic = clinics.find((candidate) => candidate.id === id);
      if (!clinic) {
        send(response, 404, { error: "Clínica não encontrada." });
        return true;
      }
      const detail = clinicDetails.get(id);
      if (!detail) throw new Error("Missing synthetic clinic detail");
      if (request.method === "PATCH") {
        if (!detail.canManage) {
          send(response, 403, { error: "Gestão não permitida." });
          return true;
        }
        const body = await readBody(request);
        detail.name = body.name ?? detail.name;
        detail.legalName = body.legalName ?? detail.legalName;
        detail.timezone = body.timezone ?? detail.timezone;
        detail.settings = { ...detail.settings, ...body.settings };
        if (body.branding) {
          state.brandingPatches = [...(state.brandingPatches ?? []), body.branding];
          detail.branding = { ...detail.branding, ...body.branding, configured: true, updatedAt: new Date().toISOString() };
        }
      }
      send(response, 200, detail);
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

    if (pathname === "/api/live/family-portal") {
      if (request.method === "POST") {
        const body = await readBody(request);
        state.familyPortalCreates = [...(state.familyPortalCreates ?? []), body];
        send(response, 201, { id: "portal-sintetico-1", token: `portal-sintetico-1.${"a".repeat(43)}`, expiresAt: new Date(Date.now() + 72 * 3600000).toISOString(), maxViews: body?.maxViews ?? 3 });
        return true;
      }
      send(response, 200, { data: [] });
      return true;
    }

    // Painel de resultados (item 8): só agregados fictícios; o papel decide o acesso como no servidor.
    if (pathname === "/api/live/outcomes" || pathname === "/api/live/outcomes/assumptions") {
      const role = scenario.primaryRole ?? "owner";
      state.outcomeAssumptions = state.outcomeAssumptions ?? {};
      if (pathname.endsWith("/assumptions")) {
        const body = await readBody(request);
        if (role !== "owner" && role !== "clinic_admin") { send(response, 403, { error: "Só o gestor da clínica edita a premissa.", code: "TENANT_FORBIDDEN" }); return true; }
        if (!Number.isInteger(body?.minutes) || body.minutes < 0 || body.minutes > 240) { send(response, 400, { error: "Informe minutos inteiros entre 0 e 240.", code: "VALIDATION_ERROR" }); return true; }
        state.outcomeAssumptions[body.docType] = body.minutes;
        state.outcomePuts = [...(state.outcomePuts ?? []), body];
        send(response, 200, { data: { available: true, values: state.outcomeAssumptions } });
        return true;
      }
      if (role === "assistant" || role === "financial") { send(response, 403, { error: "Painel de resultados indisponível para o seu papel nesta clínica.", code: "TENANT_FORBIDDEN" }); return true; }
      const a = state.outcomeAssumptions;
      const docs = { report: 4, clinical_note: 6, prescription: 3 };
      const per = ["report", "clinical_note"].map((t) => ({ docType: t, documents: docs[t], assumedMinutes: a[t] ?? null, minutes: a[t] === undefined ? null : docs[t] * a[t] }));
      const any = per.some((x) => x.minutes !== null);
      send(response, 200, { data: {
        windowDays: Number(searchParams.get("days") ?? 30), containsPatientIdentifiers: false,
        patients: { encounters: 14, attended: 11, returning: 6, firstTime: 5, newPatients: 4, previous: { attended: 9, returning: 5 } },
        documents: { total: 13, byType: docs, assessmentsApplied: 7, previousTotal: 10 },
        timeSaved: { isEstimate: true, totalMinutes: any ? per.reduce((n, x) => n + (x.minutes ?? 0), 0) : null, perType: per, premise: "Estimativa: documentos emitidos no período × minutos que a clínica considera economizados por documento. Não é medição de tempo.", assumptionsAvailable: true, assumptions: a },
        portal: { linksCreated: 5, consented: 4, opened: 4, revoked: 1, deniedAccesses: 2, adherencePct: 80, consentPct: 80 },
        invitations: { intake: { created: 3, submitted: 2, responsePct: 66.7 }, scale: { created: 4, submitted: 3, responsePct: 75 } },
        ai: { total: 3, byPurpose: {}, familyInformedPct: 66.7, humanReviewedPct: 100 },
        features: [{ action: "live_patient_create", label: "Pacientes cadastrados", count: 4 }, { action: "family_portal_share_create", label: "Links do portal da família criados", count: 5 }],
        notMeasured: ["Laudo em um clique, resumo pré-consulta, evolução de escalas e checagem de dose rodam no navegador e não deixam registro no servidor.", "Testes próprios do NeuroPad (Super NeuroPad Game, Dyslexia Risk): o painel nunca mostra resultado, corte, nível ou classificação.", "Consultas da agenda não entram: a agenda legada não é separada por clínica."],
      } });
      return true;
    }

    // LGPD + registro de IA (item 7). Espelha as regras do servidor só o bastante para o e2e.
    if (pathname === "/api/live/ai-use") {
      state.aiRecords = state.aiRecords ?? [];
      const line = (r) => `Em ${r.usedAt}, Profissional Sintético E2E utilizou o sistema de IA "${r.tool}" como apoio. A IA não substitui a decisão médica. ${r.familyStatus === "informada" ? "Família informada sobre o uso de IA." : r.familyStatus === "recusou" ? "Família recusou o uso de IA." : "Ciência da família ainda não registrada."}`;
      const present = (r) => ({ ...r, suggestedChartLine: line(r) });
      if (request.method === "POST") {
        const body = await readBody(request);
        state.aiPosts = [...(state.aiPosts ?? []), body];
        if (!body?.tool || String(body.tool).trim().length < 2) {
          send(response, 400, { error: "Informe o nome da ferramenta (2 a 80 caracteres, sem texto clínico).", code: "INVALID_TOOL" });
          return true;
        }
        const record = { id: `ia-sintetico-${state.aiRecords.length + 1}`, patientId: body.patientId ?? null, actorName: "Profissional Sintético E2E", tool: body.tool, purpose: body.purpose, dataSharing: body.dataSharing, riskLevel: body.riskLevel ?? null, humanReviewed: body.humanReviewed === true, usedAt: body.usedAt, familyStatus: "nao_informada" };
        state.aiRecords.unshift(record);
        state.auditEntries = [{ source: "clinic", id: `a-${state.aiRecords.length}`, at: new Date().toISOString(), action: "ai_use_recorded", targetType: "ai_use_record", metadata: { purpose: body.purpose } }, ...(state.auditEntries ?? [])];
        send(response, 201, present(record));
        return true;
      }
      if (request.method === "PATCH") {
        const body = await readBody(request);
        const record = state.aiRecords.find((r) => r.id === body?.id);
        if (!record) { send(response, 404, { error: "Registro não encontrado nesta clínica." }); return true; }
        if (record.familyStatus !== "nao_informada") { send(response, 409, { error: "A ciência da família já foi registrada e não pode ser alterada." }); return true; }
        record.familyStatus = body.status;
        state.aiPatches = [...(state.aiPatches ?? []), body];
        state.auditEntries = [{ source: "clinic", id: `p-${state.aiPatches.length}`, at: new Date().toISOString(), action: "ai_use_family_status", targetType: "ai_use_record", metadata: { status: body.status } }, ...(state.auditEntries ?? [])];
        send(response, 200, present(record));
        return true;
      }
      send(response, 200, { data: state.aiRecords.map(present) });
      return true;
    }

    if (pathname === "/api/live/governance/retention") {
      state.retention = state.retention ?? { clinical_record: 7300, ai_use_registry: 7300, audit_trail: 1825, family_portal_links: 90 };
      const meta = { clinical_record: ["Prontuário e documentos clínicos", 7300, "Lei 13.787/2018, art. 6º (mínimo de 20 anos do último registro)"], ai_use_registry: ["Registro de uso de IA", 0, "Pendente de decisão jurídica"], audit_trail: ["Trilha de auditoria", 0, "Pendente de decisão jurídica"], family_portal_links: ["Links do portal da família", 0, "Dado fora do prontuário"] };
      const rules = () => Object.entries(meta).map(([category, [label, floor, basis]]) => ({ category, label, basis, legalFloorDays: floor, defaultDays: floor, retentionDays: state.retention[category], configured: false }));
      if (request.method === "PUT") {
        const body = await readBody(request);
        state.retentionPuts = [...(state.retentionPuts ?? []), body];
        const floor = meta[body?.category]?.[1] ?? 0;
        if (body?.retentionDays < floor) { send(response, 422, { error: "prazo mínimo legal", code: "BELOW_LEGAL_FLOOR" }); return true; }
        state.retention[body.category] = body.retentionDays;
        send(response, 200, { rules: rules() });
        return true;
      }
      send(response, 200, { rules: rules(), migrationApplied: true });
      return true;
    }

    if (pathname === "/api/live/governance/audit") {
      const entries = (state.auditEntries ?? []).filter((e) => {
        const src = searchParams.get("source") ?? "all";
        const act = searchParams.get("action") ?? "";
        return (src === "all" || e.source === src) && (!act || e.action.includes(act));
      });
      send(response, 200, { data: entries, count: entries.length, limit: 50 });
      return true;
    }

    if (pathname === "/api/consents") {
      send(response, 200, { data: [] });
      return true;
    }

    // Escuta Clínica: só a capacidade do serviço, nunca áudio nem transcrição.
    // `configured: false` reproduz a produção aferida — o piloto aparece com o
    // processamento desabilitado — e é o estado que a prova visual precisa
    // certificar: a página tem de avisar isso antes de qualquer captura.
    if (pathname === "/api/live/escuta") {
      if (request.method === "POST") {
        send(response, 503, { error: "Processamento de áudio não habilitado nesta auditoria sintética." });
        return true;
      }
      send(response, 200, { configured: false, enabled: true });
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
