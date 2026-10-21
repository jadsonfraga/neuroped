/**
 * Smoke cliente-zero no ambiente publicado — executável, fail-closed.
 *
 * Percorre pela API pública a jornada de docs/SMOKE_CLIENTE_ZERO.md e
 * classifica cada marco como VERIFIED, BLOCKED_EXTERNAL, FAILED ou NOT_RUN.
 * O estado de onboarding e de cobrança vem só de GET /api/tenants/:id/onboarding
 * (fatos persistidos no servidor); redirect de checkout nunca é lido.
 *
 *   node --import tsx scripts/ops/cliente-zero-published-smoke.ts
 *   SMOKE_OWNER_EMAIL=... SMOKE_OWNER_PASSWORD=... \
 *     node --import tsx scripts/ops/cliente-zero-published-smoke.ts --write-synthetic --close-clinic
 *
 * Sem credencial de titular, só roda as sondas públicas (saúde, portão do
 * cadastro, portão do webhook) e não cria nada. O titular precisa ser uma conta
 * sintética já verificada pelo link do e-mail; a identidade técnica E2E é
 * recusada antes do login (o middleware revoga a sessão dela se ganhar clínica).
 *
 * Não cria checkout, não cria conta, não convida ninguém e não chama Asaas nem
 * Resend. `--write-synthetic` grava paciente, consulta e documento em rascunho,
 * todos sintéticos, numa clínica de nome reservado. O relatório não contém
 * senha, token, e-mail do titular nem conteúdo clínico; o corpo do export é
 * descartado depois de conferir o digest.
 *
 * Saída: 0 tudo VERIFIED; 2 algum BLOCKED_EXTERNAL ou NOT_RUN; 1 algum FAILED.
 */
import { writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export type SmokeStatus = "VERIFIED" | "BLOCKED_EXTERNAL" | "FAILED" | "NOT_RUN";

export type SmokeStepId =
  | "api_health"
  | "signup_gate"
  | "billing_webhook_gate"
  | "owner_login"
  | "clinic"
  | "email_verified"
  | "plan"
  | "billing"
  | "membership"
  | "first_member"
  | "patient"
  | "consultation"
  | "document"
  | "audit"
  | "export"
  | "onboarding_server"
  | "closure";

export interface SmokeStep {
  id: SmokeStepId;
  status: SmokeStatus;
  code: string;
  httpStatus?: number;
  detail: string;
}

export interface SmokeOptions {
  baseUrl: string;
  fetchImpl?: typeof fetch;
  owner?: { email: string; password: string } | null;
  /** Identidades técnicas que o smoke nunca usa como titular. */
  reservedEmails?: readonly string[];
  writeSynthetic?: boolean;
  closeClinic?: boolean;
  now?: () => Date;
}

export interface SmokeReport {
  kind: "cliente-zero-published-smoke";
  schemaVersion: 1;
  target: string;
  startedAt: string;
  finishedAt: string;
  verdict: "VERIFIED" | "BLOCKED_EXTERNAL" | "FAILED";
  exitCode: 0 | 1 | 2;
  steps: SmokeStep[];
  clinic: { slug: string; reused: boolean } | null;
  onboarding: { completed: number; total: number; milestones: Record<string, string> } | null;
  billingEvidence: { status: string; environment: string | null } | null;
  clinicToFirstDocumentMs: number | null;
  proves: SmokeStepId[];
  doesNotProve: string[];
  runbook: "docs/SMOKE_CLIENTE_ZERO.md";
}

export const SMOKE_CLINIC_PREFIX = "Clínica Sintética Smoke Cliente-Zero";
export const SYNTHETIC_PATIENT_NAME = "Paciente Sintético Smoke";
export const SYNTHETIC_GUARDIAN_NAME = "Responsável Sintético Smoke";

const STEP_ORDER: readonly SmokeStepId[] = [
  "api_health",
  "signup_gate",
  "billing_webhook_gate",
  "owner_login",
  "clinic",
  "email_verified",
  "plan",
  "billing",
  "membership",
  "first_member",
  "patient",
  "consultation",
  "document",
  "audit",
  "export",
  "onboarding_server",
  "closure",
];

interface HttpResult {
  status: number;
  body: Record<string, unknown> | null;
  headers: Headers | null;
}

interface OnboardingSnapshot {
  progress?: { completed?: number; total?: number };
  billingEvidence?: { status?: string; environment?: string | null };
  milestones?: Array<{ key?: string; status?: string }>;
}

function codeOf(result: HttpResult): string {
  const code = result.body?.code;
  return typeof code === "string" ? code : `HTTP_${result.status}`;
}

function milestoneStatus(snapshot: OnboardingSnapshot | null, key: string): string | null {
  return snapshot?.milestones?.find((milestone) => milestone.key === key)?.status ?? null;
}

/** Só a origem: path, query e credencial embutida nunca vão para o relatório. */
export function smokeTarget(baseUrl: string): string {
  const url = new URL(baseUrl);
  const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  if (url.protocol !== "https:" && !(local && url.protocol === "http:")) {
    throw new Error("SMOKE_BASE_URL_MUST_BE_HTTPS");
  }
  return url.origin;
}

export function classifyBillingEvidence(status: string | undefined): Pick<SmokeStep, "status" | "code" | "detail"> {
  if (status === "SERVER_CONFIRMED") {
    return {
      status: "VERIFIED",
      code: "SERVER_CONFIRMED",
      detail: "Há charge_paid persistido pelo webhook autenticado.",
    };
  }
  if (status === "AWAITING_PROVIDER_EVENT") {
    return {
      status: "BLOCKED_EXTERNAL",
      code: "AWAITING_PROVIDER_EVENT",
      detail: "Asaas configurado, mas nenhum charge_paid persistido. Falta um pagamento no provedor; redirect de checkout não conta.",
    };
  }
  if (status === "BLOCKED_EXTERNAL") {
    return {
      status: "BLOCKED_EXTERNAL",
      code: "BLOCKED_EXTERNAL_ASAAS",
      detail: "Credenciais do Asaas ausentes no ambiente publicado; nenhuma cobrança foi presumida.",
    };
  }
  return { status: "FAILED", code: "BILLING_EVIDENCE_UNKNOWN", detail: "O servidor não informou o estado de cobrança." };
}

function verdictOf(steps: readonly SmokeStep[]): SmokeReport["verdict"] {
  if (steps.some((step) => step.status === "FAILED")) return "FAILED";
  if (steps.every((step) => step.status === "VERIFIED")) return "VERIFIED";
  return "BLOCKED_EXTERNAL";
}

export async function runClienteZeroPublishedSmoke(options: SmokeOptions): Promise<SmokeReport> {
  const now = options.now ?? (() => new Date());
  const doFetch = options.fetchImpl ?? fetch;
  const target = smokeTarget(options.baseUrl);
  const startedAt = now().toISOString();
  const steps = new Map<SmokeStepId, SmokeStep>();
  const record = (step: SmokeStep) => {
    if (!steps.has(step.id)) steps.set(step.id, step);
  };
  const skipRemaining = (code: string, detail: string) => {
    for (const id of STEP_ORDER) record({ id, status: "NOT_RUN", code, detail });
  };

  async function call(
    method: string,
    path: string,
    init: { token?: string; tenantId?: string; body?: unknown } = {},
  ): Promise<HttpResult> {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (init.body !== undefined) headers["Content-Type"] = "application/json";
    if (init.token) headers.Authorization = `Bearer ${init.token}`;
    if (init.tenantId) headers["X-Tenant-Id"] = init.tenantId;
    try {
      const response = await doFetch(`${target}${path}`, {
        method,
        headers,
        body: init.body === undefined ? undefined : JSON.stringify(init.body),
        signal: AbortSignal.timeout(20_000),
      });
      let body: Record<string, unknown> | null = null;
      try {
        const parsed = await response.json();
        body = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : null;
      } catch {
        body = null;
      }
      return { status: response.status, body, headers: response.headers };
    } catch {
      return { status: 0, body: { code: "NETWORK_ERROR" }, headers: null };
    }
  }

  // ── Sondas públicas: não criam nada ────────────────────────────────────────
  const health = await call("GET", "/api/health");
  const readiness = health.body?.readiness as { blockers?: unknown } | undefined;
  const blockers = Array.isArray(readiness?.blockers)
    ? readiness.blockers.filter((value): value is string => typeof value === "string")
    : [];
  record(
    health.status === 200 && health.body?.status === "ok"
      ? {
          id: "api_health",
          status: "VERIFIED",
          code: "HEALTH_OK",
          httpStatus: 200,
          detail: blockers.length ? `Bloqueios declarados pelo servidor: ${blockers.join(", ")}.` : "Sem bloqueios declarados.",
        }
      : { id: "api_health", status: "FAILED", code: codeOf(health), httpStatus: health.status, detail: "API publicada indisponível ou degradada." },
  );

  // Corpo vazio: os portões vêm antes da validação, então nenhuma conta nasce.
  const signup = await call("POST", "/api/auth/signup", { body: {} });
  const signupCode = codeOf(signup);
  if (signup.status === 503 && signupCode === "SIGNUP_DISABLED") {
    record({
      id: "signup_gate",
      status: "BLOCKED_EXTERNAL",
      code: "SIGNUP_DISABLED",
      httpStatus: 503,
      detail: "Cadastro self-service fechado. Abrir exige e-mail configurado e a revisão jurídica B7 (docs/LGPD_PRE_GO_LIVE.md).",
    });
  } else if (signup.status === 503 && signupCode === "EMAIL_VERIFICATION_NOT_CONFIGURED") {
    record({
      id: "signup_gate",
      status: "BLOCKED_EXTERNAL",
      code: "BLOCKED_EXTERNAL_RESEND",
      httpStatus: 503,
      detail: "Cadastro aberto, mas sem entrega de e-mail; o servidor recusa criar conta.",
    });
  } else if (signup.status === 400) {
    record({
      id: "signup_gate",
      status: "VERIFIED",
      code: "SIGNUP_OPEN",
      httpStatus: 400,
      detail: "Cadastro aberto com e-mail configurado; o corpo vazio foi recusado sem criar conta.",
    });
  } else {
    record({ id: "signup_gate", status: "FAILED", code: signupCode, httpStatus: signup.status, detail: "Resposta inesperada do cadastro." });
  }

  const webhook = await call("POST", "/api/billing/webhook", { body: {} });
  const webhookCode = codeOf(webhook);
  if (webhook.status === 401 && webhookCode === "WEBHOOK_UNAUTHENTICATED") {
    record({
      id: "billing_webhook_gate",
      status: "VERIFIED",
      code: "WEBHOOK_REJECTS_UNAUTHENTICATED",
      httpStatus: 401,
      detail: "Token do webhook configurado; chamada sem token recusada antes de qualquer efeito.",
    });
  } else if (webhook.status === 503 && webhookCode === "WEBHOOK_NOT_CONFIGURED") {
    record({
      id: "billing_webhook_gate",
      status: "BLOCKED_EXTERNAL",
      code: "BLOCKED_EXTERNAL_ASAAS",
      httpStatus: 503,
      detail: "ASAAS_WEBHOOK_TOKEN ausente: nenhum pagamento pode ser confirmado neste ambiente.",
    });
  } else {
    record({ id: "billing_webhook_gate", status: "FAILED", code: webhookCode, httpStatus: webhook.status, detail: "Resposta inesperada do webhook." });
  }

  // ── Jornada do titular sintético ───────────────────────────────────────────
  let clinicInfo: SmokeReport["clinic"] = null;
  let onboarding: OnboardingSnapshot | null = null;
  let clinicToFirstDocumentMs: number | null = null;
  const owner = options.owner;
  const reserved = new Set((options.reservedEmails ?? []).map((email) => email.trim().toLowerCase()).filter(Boolean));

  await (async () => {
    if (!owner?.email || !owner.password) {
      record({
        id: "owner_login",
        status: "NOT_RUN",
        code: "OWNER_CREDENTIALS_ABSENT",
        detail: "Sem SMOKE_OWNER_EMAIL/SMOKE_OWNER_PASSWORD: a jornada autenticada não roda.",
      });
      skipRemaining("DEPENDS_ON_OWNER_LOGIN", "Exige o login do titular sintético.");
      return;
    }
    if (reserved.has(owner.email.trim().toLowerCase())) {
      record({
        id: "owner_login",
        status: "FAILED",
        code: "OWNER_IS_RESERVED_E2E_IDENTITY",
        detail: "A identidade técnica E2E não pode ser titular de clínica; nenhum login foi tentado.",
      });
      skipRemaining("DEPENDS_ON_OWNER_LOGIN", "Exige o login do titular sintético.");
      return;
    }

    const login = await call("POST", "/api/auth/login", { body: { email: owner.email, password: owner.password } });
    const token = typeof login.body?.accessToken === "string" ? login.body.accessToken : "";
    const loginUser = login.body?.user as { mustChangePassword?: boolean } | undefined;
    if (login.status !== 200 || !token) {
      record({ id: "owner_login", status: "FAILED", code: codeOf(login), httpStatus: login.status, detail: "O titular sintético não autenticou." });
      skipRemaining("DEPENDS_ON_OWNER_LOGIN", "Exige o login do titular sintético.");
      return;
    }
    if (loginUser?.mustChangePassword) {
      record({ id: "owner_login", status: "FAILED", code: "OWNER_MUST_CHANGE_PASSWORD", httpStatus: 200, detail: "Troque a senha do titular antes do smoke." });
      skipRemaining("DEPENDS_ON_OWNER_LOGIN", "Exige o login do titular sintético.");
      return;
    }
    record({ id: "owner_login", status: "VERIFIED", code: "OWNER_SESSION", httpStatus: 200, detail: "Sessão do titular emitida pelo backend publicado." });

    // Clínica reservada: reaproveita a ativa, senão cria uma nova.
    const clinicStartedAt = Date.now();
    const tenants = await call("GET", "/api/tenants", { token });
    const list = Array.isArray(tenants.body?.data) ? tenants.body.data as Array<Record<string, unknown>> : [];
    const existing = list.find((row) =>
      typeof row.name === "string" && row.name.startsWith(SMOKE_CLINIC_PREFIX) && row.role === "owner" && row.status === "active");
    let clinicId = "";
    let slug = "";
    if (tenants.status !== 200) {
      record({ id: "clinic", status: "FAILED", code: codeOf(tenants), httpStatus: tenants.status, detail: "Não foi possível listar as clínicas do titular." });
    } else if (existing && typeof existing.id === "string" && typeof existing.slug === "string") {
      clinicId = existing.id;
      slug = existing.slug;
      clinicInfo = { slug, reused: true };
      record({ id: "clinic", status: "VERIFIED", code: "SMOKE_CLINIC_REUSED", httpStatus: 200, detail: "Clínica sintética ativa reaproveitada." });
    } else {
      const created = await call("POST", "/api/tenants", {
        token,
        // Slug único: a clínica encerrada no mesmo dia continua com o slug dela.
        body: {
          name: `${SMOKE_CLINIC_PREFIX} ${now().toISOString().slice(0, 10)}`,
          slug: `smoke-cliente-zero-${now().toISOString().slice(0, 10)}-${crypto.randomUUID().slice(0, 8)}`,
        },
      });
      if (created.status === 201 && typeof created.body?.id === "string" && typeof created.body.slug === "string") {
        clinicId = created.body.id;
        slug = created.body.slug;
        clinicInfo = { slug, reused: false };
        record({ id: "clinic", status: "VERIFIED", code: "SMOKE_CLINIC_CREATED", httpStatus: 201, detail: "Clínica sintética criada pelo titular." });
      } else if (created.status === 403 && codeOf(created) === "EMAIL_VERIFICATION_REQUIRED") {
        record({
          id: "clinic",
          status: "BLOCKED_EXTERNAL",
          code: "EMAIL_VERIFICATION_REQUIRED",
          httpStatus: 403,
          detail: "O servidor recusa clínica sem e-mail verificado.",
        });
        record({
          id: "email_verified",
          status: "BLOCKED_EXTERNAL",
          code: "BLOCKED_EXTERNAL_RESEND",
          detail: "Verifique o titular pelo link recebido no e-mail; o smoke não tem bypass.",
        });
      } else {
        record({ id: "clinic", status: "FAILED", code: codeOf(created), httpStatus: created.status, detail: "Criação da clínica sintética falhou." });
      }
    }
    if (!clinicId) {
      skipRemaining("DEPENDS_ON_CLINIC", "Exige a clínica sintética.");
      return;
    }

    const readOnboarding = async () => {
      const result = await call("GET", `/api/tenants/${encodeURIComponent(clinicId)}/onboarding`, { token });
      const snapshot = result.status === 200 ? result.body as OnboardingSnapshot : null;
      return snapshot && Array.isArray(snapshot.milestones) ? { result, snapshot } : { result, snapshot: null };
    };
    const initial = await readOnboarding();
    onboarding = initial.snapshot;
    if (!onboarding) {
      record({ id: "email_verified", status: "FAILED", code: codeOf(initial.result), httpStatus: initial.result.status, detail: "Onboarding do servidor indisponível." });
      skipRemaining("DEPENDS_ON_ONBOARDING", "Exige o onboarding calculado no servidor.");
      return;
    }

    record(milestoneStatus(onboarding, "email_verified") === "completed"
      ? { id: "email_verified", status: "VERIFIED", code: "SERVER_EMAIL_VERIFIED_AT", detail: "users.email_verified_at persistido. Não comprova entrega observada por este smoke." }
      : { id: "email_verified", status: "FAILED", code: "CLINIC_WITHOUT_VERIFIED_OWNER", detail: "Clínica existe sem e-mail verificado do titular." });
    record(milestoneStatus(onboarding, "plan_selected") === "completed"
      ? { id: "plan", status: "VERIFIED", code: "PLAN_PERSISTED", detail: "Assinatura do plano canônico persistida na criação da clínica." }
      : { id: "plan", status: "FAILED", code: "PLAN_NOT_PERSISTED", detail: "Clínica sem assinatura persistida." });
    record({ id: "billing", ...classifyBillingEvidence(onboarding.billingEvidence?.status) });
    record({ id: "membership", status: "VERIFIED", code: "OWNER_MEMBERSHIP", detail: "O titular é owner ativo da clínica sintética." });
    record(milestoneStatus(onboarding, "first_member") === "completed"
      ? { id: "first_member", status: "VERIFIED", code: "SERVER_FIRST_MEMBER", detail: "Há membro além do titular, persistido no servidor." }
      : { id: "first_member", status: "NOT_RUN", code: "INVITE_REQUIRES_RECIPIENT_INBOX", detail: "O aceite do convite exige o link no e-mail do convidado; o smoke não convida." });

    // ── Operação clínica sintética (opt-in) ──────────────────────────────────
    const created: { patient?: string; document?: string } = {};
    if (!options.writeSynthetic) {
      for (const id of ["patient", "consultation", "document"] as const) {
        record({ id, status: "NOT_RUN", code: "SYNTHETIC_WRITES_NOT_REQUESTED", detail: "Rode com --write-synthetic para provar escrita clínica sintética." });
      }
    } else {
      const clinical = (id: SmokeStepId, result: HttpResult, label: string): boolean => {
        if (result.status === 201) return true;
        const code = codeOf(result);
        if (result.status === 503 && (code === "CLINICAL_LIVE_DISABLED" || code === "CLINICAL_CRYPTO_NOT_CONFIGURED")) {
          record({ id, status: "BLOCKED_EXTERNAL", code, httpStatus: 503, detail: `${label}: camada clínica não liberada neste ambiente.` });
        } else if (result.status === 402) {
          record({ id, status: "BLOCKED_EXTERNAL", code, httpStatus: 402, detail: `${label}: entitlement exige pagamento confirmado.` });
        } else {
          record({ id, status: "FAILED", code, httpStatus: result.status, detail: `${label}: escrita recusada.` });
        }
        return false;
      };
      const issuedAt = now().toISOString();
      const patient = await call("POST", "/api/live/patients", {
        token,
        tenantId: clinicId,
        body: {
          clinicId,
          name: SYNTHETIC_PATIENT_NAME,
          birthDate: "2020-01-15",
          guardianName: SYNTHETIC_GUARDIAN_NAME,
          notes: "Registro sintético criado pelo smoke automatizado. Não é pessoa real.",
        },
      });
      if (clinical("patient", patient, "Paciente") && typeof patient.body?.id === "string") {
        created.patient = patient.body.id;
        record({ id: "patient", status: "VERIFIED", code: "SYNTHETIC_PATIENT_CREATED", httpStatus: 201, detail: "Paciente sintético criado pelo handler LIVE." });
        const encounter = await call("POST", "/api/live/events", {
          token,
          tenantId: clinicId,
          body: {
            clinicId,
            patientId: created.patient,
            eventType: "encounter",
            occurredAt: issuedAt,
            encounterId: `smoke-cliente-zero-${issuedAt.slice(0, 10)}`,
            provenanceKind: "observed",
            provenanceSource: "clinician",
            payload: {
              encounterType: "initial",
              setting: "clinic",
              reason: "Consulta sintética do smoke automatizado.",
              subjective: "Relato inteiramente sintético.",
              objective: "Observação inteiramente sintética.",
            },
          },
        });
        if (clinical("consultation", encounter, "Consulta")) {
          record({ id: "consultation", status: "VERIFIED", code: "SYNTHETIC_ENCOUNTER_CREATED", httpStatus: 201, detail: "Evento encounter sintético com proveniência." });
        }
        const document = await call("POST", "/api/live/documents", {
          token,
          tenantId: clinicId,
          body: {
            clinicId,
            patientId: created.patient,
            documentType: "clinical_note",
            origin: "clinician",
            status: "draft",
            familyVisibility: false,
            issuedAt,
            content: {
              title: "Rascunho sintético do smoke cliente-zero",
              body: "Documento sintético; exige revisão profissional e não é finalizado automaticamente.",
            },
          },
        });
        if (clinical("document", document, "Documento")) {
          if (document.body?.status === "draft" && typeof document.body.id === "string") {
            created.document = document.body.id;
            clinicToFirstDocumentMs = Date.now() - clinicStartedAt;
            record({ id: "document", status: "VERIFIED", code: "SYNTHETIC_DRAFT_CREATED", httpStatus: 201, detail: "Documento clínico sintético criado como rascunho." });
          } else {
            record({ id: "document", status: "FAILED", code: "DOCUMENT_NOT_DRAFT", httpStatus: 201, detail: "O documento não voltou como rascunho." });
          }
        }
      } else {
        for (const id of ["consultation", "document"] as const) {
          record({ id, status: "NOT_RUN", code: "DEPENDS_ON_PATIENT", detail: "Exige o paciente sintético." });
        }
      }
    }

    // ── Auditoria e exportação ────────────────────────────────────────────────
    const audit = await call("GET", `/api/tenants/${encodeURIComponent(clinicId)}/audit?limit=100`, { token });
    const auditText = JSON.stringify(audit.body ?? {});
    const auditEntries = Array.isArray(audit.body?.data) ? audit.body.data as Array<{ targetId?: string | null }> : [];
    if (audit.status !== 200) {
      record({ id: "audit", status: "FAILED", code: codeOf(audit), httpStatus: audit.status, detail: "Auditoria self-service indisponível." });
    } else if (auditText.includes(SYNTHETIC_PATIENT_NAME) || auditText.includes(SYNTHETIC_GUARDIAN_NAME)) {
      record({ id: "audit", status: "FAILED", code: "AUDIT_CONTAINS_CLINICAL_CONTENT", httpStatus: 200, detail: "A auditoria expôs conteúdo clínico." });
    } else if (
      (created.patient && !auditEntries.some((entry) => entry.targetId === created.patient)) ||
      (created.document && !auditEntries.some((entry) => entry.targetId === created.document))
    ) {
      record({ id: "audit", status: "FAILED", code: "AUDIT_MISSING_WRITES", httpStatus: 200, detail: "Escrita sintética sem linha de auditoria." });
    } else {
      record({ id: "audit", status: "VERIFIED", code: "AUDIT_METADATA_ONLY", httpStatus: 200, detail: "Auditoria do tenant legível e sem conteúdo clínico." });
    }

    const exported = await call("GET", `/api/tenants/${encodeURIComponent(clinicId)}/export`, { token });
    const manifest = exported.body?.manifest as { digestSha256?: string; complete?: boolean } | undefined;
    const digestHeader = exported.headers?.get("X-NeuroPed-Export-Digest") ?? null;
    if (exported.status !== 200) {
      record({ id: "export", status: "FAILED", code: codeOf(exported), httpStatus: exported.status, detail: "Exportação do tenant falhou." });
    } else if (!digestHeader || manifest?.digestSha256 !== digestHeader) {
      record({ id: "export", status: "FAILED", code: "EXPORT_DIGEST_MISMATCH", httpStatus: 200, detail: "Digest do cabeçalho difere do manifesto." });
    } else if (manifest.complete !== true) {
      record({ id: "export", status: "FAILED", code: "EXPORT_INCOMPLETE", httpStatus: 200, detail: "O manifesto declara exportação incompleta." });
    } else {
      record({ id: "export", status: "VERIFIED", code: "EXPORT_COMPLETE_WITH_DIGEST", httpStatus: 200, detail: "Exportação completa com digest SHA-256; o corpo foi descartado." });
    }
    exported.body = null;

    // ── O checklist final é o do servidor ────────────────────────────────────
    const final = await readOnboarding();
    if (final.snapshot) onboarding = final.snapshot;
    const expected: Array<[SmokeStepId, string]> = [
      ["patient", "first_patient"],
      ["consultation", "first_consultation"],
      ["document", "first_document"],
    ];
    const missing = expected
      .filter(([stepId, key]) => steps.get(stepId)?.status === "VERIFIED" && milestoneStatus(final.snapshot, key) !== "completed")
      .map(([, key]) => key);
    if (!final.snapshot) {
      record({ id: "onboarding_server", status: "FAILED", code: codeOf(final.result), httpStatus: final.result.status, detail: "Onboarding final indisponível." });
    } else if (missing.length) {
      record({ id: "onboarding_server", status: "FAILED", code: "ONBOARDING_NOT_SERVER_DERIVED", detail: `Escrita confirmada sem marco no servidor: ${missing.join(", ")}.` });
    } else {
      const progress = final.snapshot.progress;
      record({
        id: "onboarding_server",
        status: "VERIFIED",
        code: "ONBOARDING_SERVER_COMPUTED",
        httpStatus: 200,
        detail: `Checklist calculado no servidor: ${progress?.completed ?? "?"}/${progress?.total ?? "?"}.`,
      });
    }

    if (!options.closeClinic) {
      record({ id: "closure", status: "NOT_RUN", code: "CLOSURE_NOT_REQUESTED", detail: "Rode com --close-clinic para pedir o encerramento da clínica sintética." });
    } else {
      const closure = await call("POST", `/api/tenants/${encodeURIComponent(clinicId)}/lifecycle`, {
        token,
        body: { action: "request_closure", reasonCode: "customer_request", confirmSlug: slug },
      });
      record(closure.status === 200
        ? { id: "closure", status: "VERIFIED", code: "CLOSURE_REQUESTED", httpStatus: 200, detail: "Encerramento pedido; a retenção pós-cancelamento passa a valer." }
        : { id: "closure", status: "FAILED", code: codeOf(closure), httpStatus: closure.status, detail: "Encerramento da clínica sintética falhou." });
    }
  })();

  const ordered = STEP_ORDER.map((id) => steps.get(id)!);
  const verdict = verdictOf(ordered);
  const snapshot = onboarding as OnboardingSnapshot | null;
  const billingStatus = snapshot?.billingEvidence?.status ?? null;
  const billingEnvironment = snapshot?.billingEvidence?.environment ?? null;
  const doesNotProve = [
    "ENTREGA_EMAIL_OBSERVADA",
    "CADASTRO_SELF_SERVICE_PONTA_A_PONTA",
    "RECEITA",
    "MRR",
    "CLIENTE_PAGANTE",
  ];
  if (!(billingStatus === "SERVER_CONFIRMED" && billingEnvironment === "production")) doesNotProve.splice(2, 0, "PAGAMENTO_REAL");

  return {
    kind: "cliente-zero-published-smoke",
    schemaVersion: 1,
    target,
    startedAt,
    finishedAt: now().toISOString(),
    verdict,
    exitCode: verdict === "VERIFIED" ? 0 : verdict === "FAILED" ? 1 : 2,
    steps: ordered,
    clinic: clinicInfo,
    onboarding: snapshot
      ? {
          completed: snapshot.progress?.completed ?? 0,
          total: snapshot.progress?.total ?? 0,
          milestones: Object.fromEntries((snapshot.milestones ?? []).map((milestone) => [String(milestone.key), String(milestone.status)])),
        }
      : null,
    billingEvidence: billingStatus ? { status: billingStatus, environment: billingEnvironment } : null,
    clinicToFirstDocumentMs,
    proves: ordered.filter((step) => step.status === "VERIFIED").map((step) => step.id),
    doesNotProve,
    runbook: "docs/SMOKE_CLIENTE_ZERO.md",
  };
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const outIndex = argv.indexOf("--out");
  const outPath = outIndex >= 0 ? argv[outIndex + 1] : undefined;
  const email = process.env.SMOKE_OWNER_EMAIL?.trim() ?? "";
  const password = process.env.SMOKE_OWNER_PASSWORD ?? "";
  const reservedEmails = [
    ...(process.env.SMOKE_RESERVED_EMAILS ?? "").split(","),
    process.env.NEUROPED_E2E_EMAIL ?? "",
  ];
  const report = await runClienteZeroPublishedSmoke({
    baseUrl: process.env.SMOKE_BASE_URL?.trim() || "https://neuroped.pages.dev",
    owner: email && password ? { email, password } : null,
    reservedEmails,
    writeSynthetic: argv.includes("--write-synthetic"),
    closeClinic: argv.includes("--close-clinic"),
  });
  const text = `${JSON.stringify(report, null, 2)}\n`;
  if (outPath) writeFileSync(outPath, text);
  process.stdout.write(text);
  process.exitCode = report.exitCode;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
