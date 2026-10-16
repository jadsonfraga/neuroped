/**
 * Item 8 — painel de resultados com os handlers REAIS, middleware global e todas as migrations em SQLite
 * (node:sqlite; Node >= 22, como no CI). Dados 100% fictícios.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { fixture, ALFA, BETA } from "./_multiclinic-fixture";
import { onRequestGet as outGet } from "../../functions/api/live/outcomes/index";
import { onRequestPut as assumpPut } from "../../functions/api/live/outcomes/assumptions";

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();
let seq = 0;

function seed(f: Awaited<ReturnType<typeof fixture>>) {
  const r = f.raw;
  const patient = (id: string, clinic: string, who: string, created = daysAgo(2)) =>
    r.prepare("INSERT INTO live_patients (id, clinic_id, created_by_user_id, profile_encrypted, created_at) VALUES (?, ?, ?, 'cifrado-ficticio', ?)").run(id, clinic, who, created);
  const encounter = (clinic: string, pid: string, who: string, at: string) =>
    r.prepare("INSERT INTO live_clinical_events (id, clinic_id, patient_id, author_user_id, event_type, occurred_at, provenance_kind, provenance_source, payload_encrypted) VALUES (?, ?, ?, ?, 'encounter', ?, 'documented', 'clinician', 'cifrado-ficticio')").run(`ev-${++seq}`, clinic, pid, who, at);
  const doc = (clinic: string, pid: string, who: string, type: string, status: string, at: string) =>
    r.prepare("INSERT INTO live_documents (id, clinic_id, patient_id, author_user_id, document_type, origin, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'clinician', ?, ?, ?)").run(`doc-${++seq}`, clinic, pid, who, type, status, at, at);
  // ALFA: p1 retorno (consulta antiga + atual), p2 primeira consulta, p3 só consulta antiga (fora da janela)
  for (const id of ["a-p1", "a-p2", "a-p3"]) patient(id, ALFA, "prof-a", daysAgo(200));
  encounter(ALFA, "a-p1", "prof-a", daysAgo(100)); encounter(ALFA, "a-p1", "prof-a", daysAgo(5)); encounter(ALFA, "a-p1", "prof-a", daysAgo(3));
  encounter(ALFA, "a-p2", "prof-a", daysAgo(4));
  encounter(ALFA, "a-p3", "prof-a", daysAgo(100));
  doc(ALFA, "a-p1", "prof-a", "report", "published", daysAgo(5));
  doc(ALFA, "a-p1", "prof-a", "report", "published", daysAgo(4));
  doc(ALFA, "a-p2", "prof-a", "clinical_note", "published", daysAgo(4));
  doc(ALFA, "a-p2", "prof-a", "report", "draft", daysAgo(4));
  doc(ALFA, "a-p2", "prof-a", "report", "voided", daysAgo(4));
  // BETA: volume bem diferente para provar isolamento
  for (const id of ["b-p1", "b-p2", "b-p3", "b-p4"]) { patient(id, BETA, "prof-b"); encounter(BETA, id, "prof-b", daysAgo(2)); doc(BETA, id, "prof-b", "report", "published", daysAgo(2)); }
  // portal ALFA: 2 links, 1 consentido e aberto, 1 nunca aberto
  const share = (id: string, clinic: string, pid: string, who: string, consented: string | null, views: number) =>
    r.prepare("INSERT INTO family_portal_shares (id, clinic_id, patient_id, created_by_user_id, token_hash, expires_at, max_views, view_count, content_encrypted, encryption_version, first_consented_at, created_at) VALUES (?, ?, ?, ?, ?, ?, 3, ?, 'cifrado-ficticio', 'clinical-v1', ?, ?)").run(id, clinic, pid, who, `h-${id}`, daysAgo(-3), views, consented, daysAgo(3));
  share("s1", ALFA, "a-p1", "prof-a", daysAgo(2), 1); share("s2", ALFA, "a-p2", "prof-a", null, 0);
  share("s3", BETA, "b-p1", "prof-b", daysAgo(2), 2);
  r.prepare("INSERT INTO family_portal_audit_log (id, clinic_id, share_id, action, created_at) VALUES ('l1', ?, 's2', 'denied_expired', ?)").run(ALFA, daysAgo(1));
  r.prepare("INSERT INTO saas_audit_log (id, clinic_id, actor_user_id, action, target_type, created_at) VALUES ('au1', ?, 'prof-a', 'live_patient_create', 'live_patient', ?)").run(ALFA, daysAgo(2));
}

const get = (f: Awaited<ReturnType<typeof fixture>>, user: string, clinic: string, qs = "", header = clinic) =>
  f.call(user, outGet as never, `/api/live/outcomes?clinicId=${clinic}${qs}`, "GET", undefined, header);

test("agregados corretos, só da própria clínica, sem identificadores", async () => {
  const f = await fixture();
  try {
    seed(f);
    const res = await get(f, "prof-a", ALFA, "&days=30");
    assert.equal(res.status, 200);
    const text = await res.text();
    const { data } = JSON.parse(text);
    assert.equal(data.patients.attended, 2);
    assert.equal(data.patients.returning, 1);
    assert.equal(data.patients.firstTime, 1);
    assert.equal(data.patients.encounters, 3);
    assert.equal(data.documents.total, 3, "rascunho e anulado não contam");
    assert.deepEqual(data.documents.byType, { report: 2, clinical_note: 1 });
    assert.equal(data.portal.linksCreated, 2);
    assert.equal(data.portal.opened, 1);
    assert.equal(data.portal.adherencePct, 50);
    assert.equal(data.portal.deniedAccesses, 1);
    assert.equal(data.timeSaved.totalMinutes, null, "sem premissa, sem estimativa");
    assert.equal(data.timeSaved.isEstimate, true);
    assert.equal(data.features.find((x: { action: string }) => x.action === "live_patient_create").count, 1);
    assert.equal(data.containsPatientIdentifiers, false);
    // nada identificável na resposta
    for (const forbidden of ["a-p1", "a-p2", "b-p1", "prof-a", "Fictício", "example.test", "cifrado-ficticio", "h-s1"]) assert.ok(!text.includes(forbidden), `vazou ${forbidden}`);
    assert.doesNotMatch(text, /"(score|level|nivel|classification|cutoff|corte)"/i);

    const wide = (await (await get(f, "prof-a", ALFA, "&days=90")).json()) as { data: { patients: { attended: number } } };
    assert.equal(wide.data.patients.attended, 2);
    const b = (await (await get(f, "prof-b", BETA)).json()) as { data: { patients: { attended: number }; documents: { total: number }; portal: { linksCreated: number } } };
    assert.equal(b.data.patients.attended, 4);
    assert.equal(b.data.documents.total, 4);
    assert.equal(b.data.portal.linksCreated, 1);
  } finally { f.raw.close(); }
});

test("acesso: secretaria e financeiro 403; outro tenant 403; janela inválida 400", async () => {
  const f = await fixture();
  try {
    seed(f);
    for (const user of ["sec-a", "fin-a"]) assert.equal((await get(f, user, ALFA)).status, 403, user);
    assert.equal((await get(f, "prof-b", ALFA)).status, 403);
    assert.equal((await get(f, "prof-b", ALFA, "", BETA)).status, 403, "X-Tenant-Id forjado");
    assert.equal((await get(f, "prof-a", BETA)).status, 403);
    for (const user of ["owner-a", "admin-a", "prof-a"]) assert.equal((await get(f, user, ALFA)).status, 200, user);
    assert.equal((await get(f, "prof-a", ALFA, "&days=45")).status, 400);
    assert.equal((await f.call("prof-a", outGet as never, "/api/live/outcomes", "GET", undefined, ALFA)).status, 400);
  } finally { f.raw.close(); }
});

test("premissa: só gestor edita, valida, isola por clínica e alimenta a estimativa", async () => {
  const f = await fixture();
  try {
    seed(f);
    const put = (user: string, clinic: string, body: Record<string, unknown>, header = clinic) => f.call(user, assumpPut as never, "/api/live/outcomes/assumptions", "PUT", { clinicId: clinic, ...body }, header);
    for (const user of ["prof-a", "sec-a", "fin-a"]) assert.equal((await put(user, ALFA, { docType: "report", minutes: 20 })).status, 403, user);
    assert.equal((await put("admin-a", ALFA, { docType: "report", minutes: 999 })).status, 400);
    assert.equal((await put("admin-a", ALFA, { docType: "report", minutes: 2.5 })).status, 400);
    assert.equal((await put("admin-a", ALFA, { docType: "prescription", minutes: 5 })).status, 400);
    assert.equal((await put("owner-b", ALFA, { docType: "report", minutes: 20 }, BETA)).status, 403);
    assert.equal((await put("owner-a", ALFA, { docType: "report", minutes: 20 })).status, 200);
    assert.equal((await put("owner-a", ALFA, { docType: "clinical_note", minutes: 5 })).status, 200);

    const a = (await (await get(f, "prof-a", ALFA)).json()) as { data: { timeSaved: { totalMinutes: number; isEstimate: boolean; premise: string } } };
    assert.equal(a.data.timeSaved.totalMinutes, 2 * 20 + 1 * 5);
    assert.equal(a.data.timeSaved.isEstimate, true);
    const b = (await (await get(f, "prof-b", BETA)).json()) as { data: { timeSaved: { totalMinutes: number | null } } };
    assert.equal(b.data.timeSaved.totalMinutes, null, "premissa da ALFA não vaza para a BETA");
    const audit = f.raw.prepare("SELECT clinic_id FROM saas_audit_log WHERE action = 'metrics_assumption_upsert'").all() as Array<{ clinic_id: string }>;
    assert.equal(audit.length, 2);
    assert.ok(audit.every((x) => x.clinic_id === ALFA));
    assert.throws(() => f.raw.prepare("INSERT INTO clinic_metrics_assumptions (clinic_id, doc_type, minutes_saved, updated_by_user_id) VALUES (?, 'report', 500, 'owner-a')").run(BETA), /CHECK/);
  } finally { f.raw.close(); }
});

test("tabelas ausentes (migration não aplicada) degradam por bloco, sem erro", async () => {
  const f = await fixture();
  try {
    seed(f);
    f.raw.exec("DROP TABLE clinic_metrics_assumptions; DROP TABLE family_portal_audit_log; DROP TABLE family_portal_shares;");
    const res = await get(f, "prof-a", ALFA);
    assert.equal(res.status, 200);
    const { data } = (await res.json()) as { data: { portal: unknown; patients: { attended: number }; timeSaved: { assumptionsAvailable: boolean; totalMinutes: number | null } } };
    assert.equal(data.portal, null);
    assert.equal(data.patients.attended, 2);
    assert.equal(data.timeSaved.assumptionsAvailable, false);
    assert.equal(data.timeSaved.totalMinutes, null);
    const put = await f.call("owner-a", assumpPut as never, "/api/live/outcomes/assumptions", "PUT", { clinicId: ALFA, docType: "report", minutes: 10 }, ALFA);
    assert.equal(put.status, 503);
    assert.equal(((await put.json()) as { code: string }).code, "METRICS_MIGRATION_PENDING");
  } finally { f.raw.close(); }
});
