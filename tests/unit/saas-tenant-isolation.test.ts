/**
 * Regressão de isolamento da superfície /api/saas.
 *
 * Antes destas travas:
 *  - nenhuma tabela SaaS existia no runtime Express: todo endpoint dava 500;
 *  - `validateClinicOwnership` aceitava qualquer `clinicId` vindo do cliente,
 *    porque a checagem real estava comentada e `req.user` nem carrega clínica;
 *  - a submissão de feedback era pública e a leitura por appointmentId não
 *    tinha escopo de clínica;
 *  - lifecycle e instituições respondiam a qualquer id conhecido;
 *  - o rate limit era código morto, com normalização de rota quebrada e janela
 *    recalculada a cada pedido.
 */

import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AddressInfo } from "node:net";
import express from "express";

const tempDirectory = mkdtempSync(join(tmpdir(), "neuroped-saas-isolation-"));
process.env.DATABASE_PATH = join(tempDirectory, "test.sqlite");
const deterministicTestSecret = ["saas", "isolation", "fixture"]
  .join("-")
  .padEnd(64, "x");
process.env.NEUROPED_JWT_SECRET = deterministicTestSecret;

const [
  { sqlite },
  { signAccessToken },
  onboarding,
  feedback,
  lifecycle,
  templates,
  institutions,
  rateLimit,
] = await Promise.all([
  import("../../server/storage"),
  import("../../server/lib/jwt"),
  import("../../server/routes/saas-onboarding"),
  import("../../server/routes/saas-feedback"),
  import("../../server/routes/saas-lifecycle"),
  import("../../server/routes/saas-availability-templates"),
  import("../../server/routes/saas-institutions"),
  import("../../server/middleware/saas-rate-limit"),
]);

/* ---------------------------------------------------------------------------
 * As tabelas SaaS precisam existir no runtime Express.
 * ------------------------------------------------------------------------- */

const tables = new Set(
  (
    sqlite
      .prepare("SELECT name FROM sqlite_master WHERE type='table'")
      .all() as Array<{ name: string }>
  ).map((row) => row.name),
);

for (const table of [
  "clinic_memberships",
  "onboarding_checklist",
  "appointment_feedback",
  "availability_templates",
  "communication_templates",
  "institutions",
  "institution_users",
  "tenant_lifecycle_events",
  "rate_limit_state",
  "authorization_logs",
]) {
  assert.ok(
    tables.has(table),
    `tabela ${table} deve ser criada no boot: sem ela a rota responde 500`,
  );
}

/* ---------------------------------------------------------------------------
 * Normalização de rota e janela do rate limit.
 * ------------------------------------------------------------------------- */

assert.equal(
  rateLimit.normalizeEndpoint(
    "GET",
    "/api/saas/templates/availability/tpl_550e8400-e29b-41d4-a716-446655440000",
  ),
  "GET /api/saas/templates/availability/:id",
  "id prefixado deve virar :id inteiro, não um fragmento do UUID",
);
assert.equal(
  rateLimit.normalizeEndpoint("GET", "/api/saas/feedback/metrics"),
  "GET /api/saas/feedback/metrics",
  "rota sem id permanece intacta",
);
assert.ok(rateLimit.isIdSegment("550e8400-e29b-41d4-a716-446655440000"));
assert.ok(rateLimit.isIdSegment("inst_550e8400-e29b-41d4-a716-446655440000"));
assert.ok(!rateLimit.isIdSegment("metrics"));

const t0 = new Date("2026-08-29T14:37:12.500Z");
const t1 = new Date("2026-08-29T14:58:44.900Z");
assert.equal(
  rateLimit.windowStartFor(t0).toISOString(),
  rateLimit.windowStartFor(t1).toISOString(),
  "pedidos na mesma hora compartilham a janela: senão o contador nunca acumula",
);

const limited = "GET /api/saas/feedback/metrics";
for (let i = 0; i < 100; i += 1) {
  const allowed = rateLimit.checkRateLimit("clinic-rl", limited, { perHour: 100 });
  assert.equal(allowed.allowed, true, `pedido ${i + 1} dentro do limite`);
}
assert.equal(
  rateLimit.checkRateLimit("clinic-rl", limited, { perHour: 100 }).allowed,
  false,
  "o pedido 101 deve ser barrado — o contador precisa acumular na janela",
);

/* ---------------------------------------------------------------------------
 * Servidor de teste com dois usuários em clínicas distintas.
 * ------------------------------------------------------------------------- */

function insertUser(id: string, email: string): void {
  const now = new Date().toISOString();
  sqlite
    .prepare(
      `INSERT INTO users
        (id, email, name, password_hash, role, is_active,
         failed_login_attempts, must_change_password, created_at, updated_at)
       VALUES (?, ?, 'Usuário de teste', ?, 'professional', 1, 0, 0, ?, ?)`,
    )
    .run(id, email, "hash".repeat(20), now, now);
}

const alice = crypto.randomUUID();
const mallory = crypto.randomUUID();
insertUser(alice, "alice@example.test");
insertUser(mallory, "mallory@example.test");

const app = express();
app.set("trust proxy", 1);
app.use(express.json({ limit: "1mb" }));
onboarding.registerOnboardingRoutes(app);
feedback.registerFeedbackRoutes(app);
lifecycle.registerLifecycleRoutes(app);
templates.registerAvailabilityTemplateRoutes(app);
institutions.registerInstitutionRoutes(app);

const server = await new Promise<ReturnType<typeof app.listen>>((resolve) => {
  const listening = app.listen(0, "127.0.0.1", () => resolve(listening));
});
const address = server.address() as AddressInfo;
const baseUrl = `http://127.0.0.1:${address.port}`;

function tokenFor(userId: string, email: string): string {
  const sessionId = crypto.randomUUID();
  const now = new Date().toISOString();
  sqlite
    .prepare(
      `INSERT INTO refresh_tokens (id, user_id, token_hash, issued_at, expires_at, session_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(
      crypto.randomUUID(),
      userId,
      `fixture-session-${sessionId}`,
      now,
      new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      sessionId,
    );
  return signAccessToken({
    userId,
    email,
    role: "professional",
    name: "Profissional",
    sessionId,
  });
}

const aliceToken = tokenFor(alice, "alice@example.test");
const malloryToken = tokenFor(mallory, "mallory@example.test");
const aliceClinic = `user_${alice}`;

const asAlice = { Authorization: `Bearer ${aliceToken}` };
const asMallory = { Authorization: `Bearer ${malloryToken}` };
const json = { "Content-Type": "application/json" };

/* ---------------------------------------------------------------------------
 * Feedback: escrita exige sessão e leitura é escopada por clínica.
 * ------------------------------------------------------------------------- */

const anonymousSubmit = await fetch(
  `${baseUrl}/api/saas/feedback/appointments/appt-1/submit`,
  { method: "POST", headers: json, body: JSON.stringify({ appointmentId: "appt-1", npsScore: 10 }) },
);
assert.equal(
  anonymousSubmit.status,
  401,
  "submissão de feedback não pode ser anônima",
);

const aliceSubmit = await fetch(
  `${baseUrl}/api/saas/feedback/appointments/appt-1/submit`,
  {
    method: "POST",
    headers: { ...asAlice, ...json },
    body: JSON.stringify({ appointmentId: "appt-1", npsScore: 10 }),
  },
);
assert.equal(aliceSubmit.status, 200, "dona da clínica registra o feedback");

const malloryReads = await fetch(
  `${baseUrl}/api/saas/feedback/appointments/appt-1`,
  { headers: asMallory },
);
assert.equal(
  malloryReads.status,
  404,
  "conhecer o appointmentId não pode revelar feedback de outra clínica",
);

const malloryOverwrites = await fetch(
  `${baseUrl}/api/saas/feedback/appointments/appt-1/submit`,
  {
    method: "POST",
    headers: { ...asMallory, ...json },
    body: JSON.stringify({ appointmentId: "appt-1", npsScore: 0 }),
  },
);
assert.equal(
  malloryOverwrites.status,
  403,
  "feedback de outra clínica não pode ser sobrescrito",
);

const preserved = sqlite
  .prepare("SELECT nps_score AS nps FROM appointment_feedback WHERE appointment_id = ?")
  .get("appt-1") as { nps: number };
assert.equal(preserved.nps, 10, "a resposta original permanece intacta");

/* ---------------------------------------------------------------------------
 * clinicId vindo do cliente não concede acesso sem membership.
 * ------------------------------------------------------------------------- */

const forgedClinic = await fetch(
  `${baseUrl}/api/saas/onboarding/progress?clinicId=${encodeURIComponent(aliceClinic)}`,
  { headers: asMallory },
);
assert.equal(
  forgedClinic.status,
  403,
  "pedir a clínica de outro usuário sem membership deve ser negado",
);

const forgedTemplates = await fetch(
  `${baseUrl}/api/saas/templates/availability?clinicId=${encodeURIComponent(aliceClinic)}`,
  { headers: asMallory },
);
assert.equal(forgedTemplates.status, 403, "templates seguem a mesma trava");

const ownClinic = await fetch(`${baseUrl}/api/saas/onboarding/progress`, {
  headers: asAlice,
});
assert.equal(ownClinic.status, 200, "a própria clínica continua acessível");

const denied = sqlite
  .prepare(
    "SELECT COUNT(*) AS count FROM authorization_logs WHERE result = 'denied' AND reason = 'clinic_membership_missing'",
  )
  .get() as { count: number };
assert.ok(denied.count >= 2, "negações precisam ficar na trilha de auditoria");

/* ---------------------------------------------------------------------------
 * Membership explícita concede acesso — e só o que ela declara.
 * ------------------------------------------------------------------------- */

sqlite
  .prepare(
    `INSERT INTO clinic_memberships (clinic_id, user_id, role, active, created_at)
     VALUES (?, ?, 'assistant', 1, ?)`,
  )
  .run(aliceClinic, mallory, new Date().toISOString());

const withMembership = await fetch(
  `${baseUrl}/api/saas/onboarding/progress?clinicId=${encodeURIComponent(aliceClinic)}`,
  { headers: asMallory },
);
assert.equal(
  withMembership.status,
  200,
  "membership ativa concede acesso à clínica",
);

const lifecycleAsAssistant = await fetch(
  `${baseUrl}/api/saas/lifecycle/status?tenantId=${encodeURIComponent(aliceClinic)}`,
  { headers: asMallory },
);
assert.equal(
  lifecycleAsAssistant.status,
  403,
  "assistant não gerencia ciclo de vida: papel precisa ser verificado, não só a membership",
);

const templateAsAssistant = await fetch(
  `${baseUrl}/api/saas/templates/availability?clinicId=${encodeURIComponent(aliceClinic)}`,
  {
    method: "POST",
    headers: { ...asMallory, ...json },
    body: JSON.stringify({
      name: "Turno da tarde",
      rules: { monday: [{ start: "14:00", end: "18:00" }] },
    }),
  },
);
assert.equal(
  templateAsAssistant.status,
  403,
  "assistant não configura templates da clínica: requireClinicManager precisa valer",
);

const templateAsOwner = await fetch(
  `${baseUrl}/api/saas/templates/availability`,
  {
    method: "POST",
    headers: { ...asAlice, ...json },
    body: JSON.stringify({
      name: "Turno da tarde",
      rules: { monday: [{ start: "14:00", end: "18:00" }] },
    }),
  },
);
assert.equal(templateAsOwner.status, 201, "a dona da clínica configura templates");

const persistedTemplate = sqlite
  .prepare("SELECT COUNT(*) AS count FROM availability_templates WHERE clinic_id = ?")
  .get(aliceClinic) as { count: number };
assert.equal(
  persistedTemplate.count,
  1,
  "o 201 precisa corresponder a uma linha real: insert sem .run() devolvia sucesso sem gravar",
);

sqlite
  .prepare("UPDATE clinic_memberships SET active = 0 WHERE clinic_id = ? AND user_id = ?")
  .run(aliceClinic, mallory);

const revoked = await fetch(
  `${baseUrl}/api/saas/onboarding/progress?clinicId=${encodeURIComponent(aliceClinic)}`,
  { headers: asMallory },
);
assert.equal(revoked.status, 403, "membership inativa perde o acesso");

/* ---------------------------------------------------------------------------
 * Instituições: leitura e escrita exigem vínculo.
 * ------------------------------------------------------------------------- */

const createdInstitution = await fetch(`${baseUrl}/api/saas/institutions`, {
  method: "POST",
  headers: { ...asAlice, ...json },
  body: JSON.stringify({ name: "Instituto Alice", country: "BR" }),
});
assert.equal(createdInstitution.status, 201);
const institutionId = ((await createdInstitution.json()) as {
  institution: { id: string };
}).institution.id;

const malloryReadsInstitution = await fetch(
  `${baseUrl}/api/saas/institutions/${institutionId}`,
  { headers: asMallory },
);
assert.equal(
  malloryReadsInstitution.status,
  404,
  "instituição de terceiro não deve ser legível nem distinguível de inexistente",
);

const malloryUpdates = await fetch(
  `${baseUrl}/api/saas/institutions/${institutionId}`,
  {
    method: "PATCH",
    headers: { ...asMallory, ...json },
    body: JSON.stringify({ name: "Sequestrada" }),
  },
);
assert.equal(malloryUpdates.status, 404, "nem editável");

const malloryGrantsSelf = await fetch(
  `${baseUrl}/api/saas/institutions/${institutionId}/users`,
  {
    method: "POST",
    headers: { ...asMallory, ...json },
    body: JSON.stringify({ userId: mallory, role: "admin" }),
  },
);
assert.equal(
  malloryGrantsSelf.status,
  404,
  "ninguém se auto-concede papel em instituição alheia",
);

const listedForMallory = (await (
  await fetch(`${baseUrl}/api/saas/institutions`, { headers: asMallory })
).json()) as { institutions: Array<{ id: string }> };
assert.ok(
  !listedForMallory.institutions.some((i) => i.id === institutionId),
  "a listagem não pode vazar instituições de terceiros",
);

const listedForAlice = (await (
  await fetch(`${baseUrl}/api/saas/institutions`, { headers: asAlice })
).json()) as { institutions: Array<{ id: string }> };
assert.ok(
  listedForAlice.institutions.some((i) => i.id === institutionId),
  "a criadora continua vendo a própria instituição",
);

/* --- promoção legítima: admin concede papel de manager --- */

sqlite
  .prepare(
    `INSERT INTO institution_users (id, institution_id, user_id, role, granted_at, granted_by, created_at)
     VALUES (?, ?, ?, 'manager', ?, ?, ?)`,
  )
  .run(
    `iu_${crypto.randomUUID()}`,
    institutionId,
    mallory,
    new Date().toISOString(),
    alice,
    new Date().toISOString(),
  );

const asManager = await fetch(`${baseUrl}/api/saas/institutions/${institutionId}`, {
  headers: asMallory,
});
assert.equal(asManager.status, 200, "membro com papel enxerga a instituição");

const managerGrantsAdmin = await fetch(
  `${baseUrl}/api/saas/institutions/${institutionId}/users`,
  {
    method: "POST",
    headers: { ...asMallory, ...json },
    body: JSON.stringify({ userId: crypto.randomUUID(), role: "admin" }),
  },
);
assert.equal(
  managerGrantsAdmin.status,
  403,
  "manager não pode conceder papéis: escalonamento precisa de admin",
);

server.close();
console.log(
  "✓ superfície SaaS: tabelas presentes, clínica resolvida por membership, feedback autenticado e rate limit acumulando",
);
