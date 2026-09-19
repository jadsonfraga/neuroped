import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import {
  COMMERCIAL_MATERIALS,
  commercialFeatureCodes,
  commercialMaterialForRoute,
  commercialMaterialRoutes,
  getCommercialMaterial,
  listCommercialMaterialsForOffer,
} from "../../shared/commercial";
import {
  evaluateCommercialAccess,
  type CommercialLicenseSnapshot,
} from "../../functions/api/commercial/_core";

let assertions = 0;
const check = (value: unknown, message: string) => {
  assert.ok(value, message);
  assertions++;
};

// ── Contrato dos materiais ───────────────────────────────────────────────────
// Um entitlement que não aponta para nenhuma tela real não entrega nada.

check(Object.keys(COMMERCIAL_MATERIALS).length === commercialFeatureCodes.length, "um material por feature licenciada");
for (const code of commercialFeatureCodes) {
  const material = getCommercialMaterial(code);
  check(material?.code === code, `${code}: material registrado`);
  check((material?.routes.length ?? 0) > 0, `${code}: material aponta para ao menos uma tela`);
  check(
    material?.routes.every((route) => route.startsWith("/") && !route.includes(" ")),
    `${code}: rotas são caminhos do aplicativo`,
  );
  check(
    !/diagn|escore|percentil|laudo|prontu/i.test(`${material?.title} ${material?.summary}`),
    `${code}: material descrito em termos operacionais, sem promessa clínica`,
  );
}
check(getCommercialMaterial("form.unknown") === null, "código desconhecido não vira material");

const routes = commercialMaterialRoutes();
check(routes.length === new Set(routes).size, "rotas de material não se repetem");
for (const route of routes) {
  check(commercialMaterialForRoute(route) !== null, `rota ${route} resolve para um material`);
}
check(commercialMaterialForRoute("/pant") === null, "rota fora do SKU não resolve para material");

// O SKU inicial não pode alcançar prontuário, PANT, NeuroBoard nem dados de paciente.
for (const forbidden of ["prontuario", "pant", "neuroboard", "pacientes", "clinical-core", "paciente-detalhe"]) {
  check(!routes.some((route) => route.includes(forbidden)), `nenhum material abre ${forbidden}`);
}
check(listCommercialMaterialsForOffer("institutional-pilot-1-0").length === 5, "piloto licencia cinco materiais");
check(listCommercialMaterialsForOffer("inexistente").length === 0, "offer desconhecido não licencia material");

// ── As rotas existem e estão sob o gate ──────────────────────────────────────

const app = readFileSync("client/src/App.tsx", "utf8");
for (const code of commercialFeatureCodes) {
  const material = COMMERCIAL_MATERIALS[code];
  for (const route of material.routes) {
    check(app.includes(`<Route path="${route}">`), `App declara a rota ${route}`);
    const block = app.slice(app.indexOf(`<Route path="${route}">`));
    const end = block.indexOf("</Route>");
    check(
      end > 0 && block.slice(0, end).includes(`<CommercialGate feature="${code}">`),
      `${route} está sob o gate comercial de ${code}`,
    );
  }
}
check(app.includes('<Route path="/licenca">'), "a tela da licença está roteada");
{
  const block = app.slice(app.indexOf('<Route path="/licenca">'));
  check(
    block.slice(0, block.indexOf("</Route>")).includes("<RouteGuard"),
    "a tela da licença fica atrás do guard de papel",
  );
}

// ── Guard server-side: cada condição recusa sozinha ──────────────────────────

const now = new Date("2026-06-01T12:00:00Z");
const usable: CommercialLicenseSnapshot = {
  licenseId: "lic-1",
  clinicId: "clinic-1",
  offerCode: "institutional-pilot-1-0",
  offerName: "NeuroPed Institucional — Piloto 1.0",
  priceCents: 149_000,
  currency: "BRL",
  contractVersion: "institutional-pilot-terms-v1",
  status: "active",
  unitLabel: "Unidade",
  activatedAt: "2026-01-01T00:00:00Z",
  expiresAt: "2027-01-01T00:00:00Z",
  maxAuthorizedUsers: 10,
  authorizedUsers: 1,
  onboardingMinutes: 60,
  supportMinutes: 120,
  supportMinutesUsed: 0,
  features: [...commercialFeatureCodes],
};

check(evaluateCommercialAccess(usable, "form.preconsultation", true, now).ok, "licença íntegra e usuário autorizado abrem o material");

const denials: Array<[string, ReturnType<typeof evaluateCommercialAccess>]> = [
  ["sem licença", evaluateCommercialAccess(null, "form.preconsultation", true, now)],
  ["usuário não autorizado", evaluateCommercialAccess(usable, "form.preconsultation", false, now)],
  ["licença pendente", evaluateCommercialAccess({ ...usable, status: "pending" }, "form.preconsultation", true, now)],
  ["licença suspensa", evaluateCommercialAccess({ ...usable, status: "suspended" }, "form.preconsultation", true, now)],
  ["fora da vigência", evaluateCommercialAccess({ ...usable, expiresAt: "2026-02-01T00:00:00Z" }, "form.preconsultation", true, now)],
  ["antes da ativação", evaluateCommercialAccess({ ...usable, activatedAt: "2026-09-01T00:00:00Z" }, "form.preconsultation", true, now)],
  ["drift de contrato", evaluateCommercialAccess({ ...usable, contractVersion: "outra-v9" }, "form.preconsultation", true, now)],
  ["feature fora do snapshot", evaluateCommercialAccess({ ...usable, features: [] }, "form.preconsultation", true, now)],
  ["material inexistente", evaluateCommercialAccess(usable, "form.unknown", true, now)],
];
for (const [label, result] of denials) {
  check(result.ok === false, `recusa isolada: ${label}`);
}

// Membership no tenant nunca substitui o assento comercial.
check(
  evaluateCommercialAccess(usable, "form.preconsultation", false, now).ok === false,
  "ser membro da clínica não libera o material sem assento na licença",
);

// ── Guard: fail-closed também por leitura do código ──────────────────────────

const guard = readFileSync("functions/api/commercial/_guard.ts", "utf8");
for (const required of [
  "getClinicMembership",
  "evaluateCommercialUserAccess",
  "getCommercialMaterial",
  "TENANT_CLOSED",
  "TENANT_EXPORT_ONLY",
  "COMMERCIAL_CLINIC_REQUIRED",
]) {
  check(guard.includes(required), `guard verifica ${required}`);
}
check(
  guard.indexOf("return { ok: true") > guard.indexOf("evaluateCommercialUserAccess"),
  "o guard só concede depois de avaliar o acesso",
);
check(!/clinicId\s*=\s*body/.test(guard), "o guard não aceita clinicId de corpo arbitrário como autoridade");

const materialRoute = readFileSync("functions/api/commercial/materials/[code].ts", "utf8");
check(
  (materialRoute.match(/if \(!guard\.ok\) return guard\.response;/g) ?? []).length === 2,
  "os dois handlers recusam antes de qualquer efeito",
);
check(
  materialRoute.indexOf("if (!guard.ok)") < materialRoute.indexOf("recordCommercialUsage(db"),
  "a abertura é autorizada antes de ser registrada",
);
check(
  materialRoute.includes("COMMERCIAL_USAGE_NOT_RECORDED"),
  "falha de ledger não devolve sucesso de abertura",
);
check(
  !/patient|paciente|prontu/i.test(materialRoute),
  "a rota de material não toca dados de paciente",
);

const seatsRoute = readFileSync("functions/api/commercial/users.ts", "utf8");
check(seatsRoute.includes("membershipCanManage"), "assentos são administrados pela gestão da unidade");
check(seatsRoute.includes("COMMERCIAL_LAST_AUTHORIZED_USER"), "a licença ativa não fica sem nenhum autorizado");
check(
  (seatsRoute.match(/WHERE changes\(\) = 1/g) ?? []).length >= 2,
  "ledger de assento só grava quando a concessão ou revogação mudou uma linha",
);

// ── Cliente: o gate falha fechado ────────────────────────────────────────────

const gate = readFileSync("client/src/components/CommercialGate.tsx", "utf8");
check(gate.includes('if (state === "outside-scope") return <>{children}</>;'), "fora de unidade institucional o material segue como sempre");
check(
  gate.indexOf('state === "licensed" && confirmation === "confirmed"') < gate.indexOf("blockedReason"),
  "children só renderizam no caminho confirmado pelo servidor",
);
check(
  (gate.match(/\{children\}/g) ?? []).length === 2,
  "children aparecem apenas no caminho fora de escopo e no confirmado",
);

const hook = readFileSync("client/src/hooks/useCommercialLicense.ts", "utf8");
check(
  hook.includes('snapshot?.capabilities?.[feature] === true ? "licensed" : "blocked"'),
  "capability ausente ou indefinida bloqueia",
);
check(hook.includes("setSnapshot(null)"), "erro de carga limpa o snapshot em vez de manter permissão antiga");

const client = readFileSync("client/src/lib/commercialClient.ts", "utf8");
check(
  !/acceptsNoPatientData:\s*true/.test(client),
  "o cliente não marca as fronteiras contratuais por conta própria",
);

// ── O banco impõe as mesmas regras que a API ─────────────────────────────────

{
  const db = new DatabaseSync(":memory:");
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec(`
    CREATE TABLE users (id TEXT PRIMARY KEY);
    CREATE TABLE clinics (id TEXT PRIMARY KEY);
    CREATE TABLE clinic_memberships (
      clinic_id TEXT NOT NULL REFERENCES clinics(id),
      user_id TEXT NOT NULL REFERENCES users(id),
      role TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      PRIMARY KEY (clinic_id, user_id)
    );
  `);
  db.exec(readFileSync("db/migrations/0026_saas_commercial_catalog.sql", "utf8"));
  db.exec(`
    INSERT INTO users(id) VALUES ('u-owner'), ('u-pro'), ('u-inactive');
    INSERT INTO clinics(id) VALUES ('clinic-a');
    INSERT INTO clinic_memberships(clinic_id, user_id, role, active) VALUES
      ('clinic-a', 'u-owner', 'owner', 1),
      ('clinic-a', 'u-pro', 'professional', 1),
      ('clinic-a', 'u-inactive', 'professional', 0);
    INSERT INTO commercial_licenses(
      id, clinic_id, offer_id, status, unit_label, contract_version,
      billing_reference, created_by_user_id
    ) SELECT 'lic-a', 'clinic-a', id, 'pending', 'Unidade A', 'institutional-pilot-terms-v1',
             'bill-1', 'u-owner'
       FROM commercial_offers WHERE code = 'institutional-pilot-1-0';
    INSERT INTO commercial_license_acceptances(license_id, accepted_by_user_id, terms_version,
      no_patient_data_accepted, no_medical_service_accepted, no_redistribution_accepted)
      VALUES ('lic-a', 'u-owner', 'institutional-pilot-terms-v1', 1, 1, 1);
    INSERT INTO commercial_license_users(license_id, user_id, status, authorized_by_user_id)
      VALUES ('lic-a', 'u-owner', 'active', 'u-owner');
    UPDATE commercial_licenses
       SET status = 'active', activated_at = datetime('now'),
           expires_at = datetime('now', '+365 days')
     WHERE id = 'lic-a';
  `);

  // Assento exige membership ativa da mesma unidade.
  assert.throws(
    () =>
      db.exec(`INSERT INTO commercial_license_users(license_id, user_id, status, authorized_by_user_id)
               VALUES ('lic-a', 'u-inactive', 'active', 'u-owner')`),
    /active clinic member/i,
  );
  assertions++;

  // Uso de material exige ator autorizado e ativo.
  assert.throws(
    () =>
      db.exec(`INSERT INTO commercial_usage_events(id, clinic_id, license_id, actor_user_id, kind, feature_code)
               VALUES ('ev-x', 'clinic-a', 'lic-a', 'u-pro', 'material_open', 'form.preconsultation')`),
    /authorized/i,
  );
  assertions++;

  // Concessão de assento, exatamente como a rota a executa.
  db.prepare(
    `INSERT INTO commercial_license_users (license_id, user_id, status, authorized_by_user_id)
     VALUES (?, ?, 'active', ?)`,
  ).run("lic-a", "u-pro", "u-owner");
  db.prepare(
    `INSERT INTO commercial_usage_events (id, clinic_id, license_id, actor_user_id, kind)
     SELECT ?, ?, ?, ?, 'authorized_user_added' WHERE changes() = 1`,
  ).run("ev-add", "clinic-a", "lic-a", "u-owner");
  check(
    (db.prepare(`SELECT COUNT(*) AS n FROM commercial_usage_events WHERE kind = 'authorized_user_added'`).get() as { n: number }).n === 1,
    "concessão efetiva grava o evento correspondente",
  );

  // Agora o profissional autorizado consegue registrar abertura.
  db.exec(`INSERT INTO commercial_usage_events(id, clinic_id, license_id, actor_user_id, kind, feature_code)
           VALUES ('ev-open', 'clinic-a', 'lic-a', 'u-pro', 'material_open', 'form.preconsultation')`);
  check(
    (db.prepare(`SELECT COUNT(*) AS n FROM commercial_usage_events WHERE kind = 'material_open'`).get() as { n: number }).n === 1,
    "usuário autorizado registra a abertura do material",
  );

  // Revogação que não encontra assento ativo não pode gravar ledger.
  const revoke = db.prepare(
    `UPDATE commercial_license_users SET status = 'revoked', revoked_at = datetime('now')
      WHERE license_id = ? AND user_id = ? AND status = 'active'`,
  );
  revoke.run("lic-a", "u-inactive");
  db.prepare(
    `INSERT INTO commercial_usage_events (id, clinic_id, license_id, actor_user_id, kind)
     SELECT ?, ?, ?, ?, 'authorized_user_revoked' WHERE changes() = 1`,
  ).run("ev-noop", "clinic-a", "lic-a", "u-owner");
  check(
    (db.prepare(`SELECT COUNT(*) AS n FROM commercial_usage_events WHERE kind = 'authorized_user_revoked'`).get() as { n: number }).n === 0,
    "revogação sem efeito não gera evento de revogação",
  );

  // Revogação real grava.
  revoke.run("lic-a", "u-pro");
  db.prepare(
    `INSERT INTO commercial_usage_events (id, clinic_id, license_id, actor_user_id, kind)
     SELECT ?, ?, ?, ?, 'authorized_user_revoked' WHERE changes() = 1`,
  ).run("ev-rev", "clinic-a", "lic-a", "u-owner");
  check(
    (db.prepare(`SELECT COUNT(*) AS n FROM commercial_usage_events WHERE kind = 'authorized_user_revoked'`).get() as { n: number }).n === 1,
    "revogação efetiva grava o evento correspondente",
  );

  // Revogado perde o material imediatamente.
  assert.throws(
    () =>
      db.exec(`INSERT INTO commercial_usage_events(id, clinic_id, license_id, actor_user_id, kind, feature_code)
               VALUES ('ev-after', 'clinic-a', 'lic-a', 'u-pro', 'material_open', 'form.preconsultation')`),
    /authorized/i,
  );
  assertions++;

  // Teto de dez assentos.
  for (let index = 0; index < 9; index += 1) {
    db.exec(`INSERT INTO users(id) VALUES ('u-${index}');
             INSERT INTO clinic_memberships(clinic_id, user_id, role, active) VALUES ('clinic-a', 'u-${index}', 'professional', 1);
             INSERT INTO commercial_license_users(license_id, user_id, status, authorized_by_user_id)
               VALUES ('lic-a', 'u-${index}', 'active', 'u-owner');`);
  }
  db.exec(`INSERT INTO users(id) VALUES ('u-extra');
           INSERT INTO clinic_memberships(clinic_id, user_id, role, active) VALUES ('clinic-a', 'u-extra', 'professional', 1);`);
  assert.throws(
    () =>
      db.exec(`INSERT INTO commercial_license_users(license_id, user_id, status, authorized_by_user_id)
               VALUES ('lic-a', 'u-extra', 'active', 'u-owner')`),
    /limit|cap|max/i,
  );
  assertions++;

  db.close();
}

console.log(`SaaS comercial — materiais e assentos: ${assertions} asserções passaram.`);
