/**
 * Item 7 — LGPD + registro de uso de IA (CFM 2.454/2026), com os handlers REAIS, middleware global e
 * todas as migrations em SQLite (node:sqlite; Node >= 22, como no CI). Dados 100% fictícios.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { fixture, ALFA, BETA } from "./_multiclinic-fixture";
import { onRequestGet as aiGet, onRequestPost as aiPost, onRequestPatch as aiPatch } from "../../functions/api/live/ai-use/index";
import { onRequestGet as retGet, onRequestPut as retPut } from "../../functions/api/live/governance/retention";
import { onRequestGet as auditGet } from "../../functions/api/live/governance/audit";
import { collectTenantExportPayload } from "../../functions/api/tenant/_exportPayload";

const NOW_ISO = () => new Date().toISOString();
const valid = (over: Record<string, unknown> = {}) => ({ clinicId: ALFA, patientId: "paciente-alfa", tool: "Assistente fictício", purpose: "redacao_documento", dataSharing: "pseudonimizado", riskLevel: null, humanReviewed: true, usedAt: NOW_ISO(), ...over });

test("registro de IA: quem pode, isolamento entre clínicas, imutabilidade e ciência da família", async () => {
  const f = await fixture();
  try {
    // profissional registra; secretaria e financeiro não
    const created = await f.call("prof-a", aiPost as never, "/api/live/ai-use", "POST", valid(), ALFA);
    assert.equal(created.status, 201);
    const rec = (await created.json()) as { id: string; actorUserId: string; suggestedChartLine: string; familyStatus: string };
    assert.equal(rec.actorUserId, "prof-a", "o autor vem da sessão, não do corpo");
    assert.equal(rec.familyStatus, "nao_informada");
    assert.match(rec.suggestedChartLine, /Assistente fictício/);
    assert.doesNotMatch(rec.suggestedChartLine, /nível|corte|classifica|escore|pontua/i);
    for (const user of ["sec-a", "fin-a"]) {
      assert.equal((await f.call(user, aiPost as never, "/api/live/ai-use", "POST", valid(), ALFA)).status, 403, user);
      assert.equal((await f.call(user, aiGet as never, `/api/live/ai-use?clinicId=${ALFA}`, "GET", undefined, ALFA)).status, 403, user);
    }

    // BETA: registra o seu e jamais enxerga o da ALFA; paciente de outra clínica é recusado
    const betaRec = await f.call("prof-b", aiPost as never, "/api/live/ai-use", "POST", valid({ clinicId: BETA, patientId: "paciente-beta" }), BETA);
    assert.equal(betaRec.status, 201);
    const betaList = (await (await f.call("prof-b", aiGet as never, `/api/live/ai-use?clinicId=${BETA}`, "GET", undefined, BETA)).json()) as { data: Array<{ id: string }> };
    assert.equal(betaList.data.length, 1);
    assert.notEqual(betaList.data[0].id, rec.id);
    assert.equal((await f.call("prof-b", aiGet as never, `/api/live/ai-use?clinicId=${ALFA}`, "GET", undefined, ALFA)).status, 403);
    assert.equal((await f.call("prof-b", aiGet as never, `/api/live/ai-use?clinicId=${ALFA}`, "GET", undefined, BETA)).status, 403, "X-Tenant-Id forjado não abre a ALFA");
    assert.equal((await f.call("prof-a", aiPost as never, "/api/live/ai-use", "POST", valid({ patientId: "paciente-beta" }), ALFA)).status, 404);
    assert.equal((await f.call("prof-b", aiPatch as never, "/api/live/ai-use", "PATCH", { clinicId: BETA, id: rec.id, status: "informada" }, BETA)).status, 404, "registro da ALFA não é alterável pela BETA");

    // validação: ferramenta com texto clínico/inválido, dados identificáveis sem paciente, data futura
    assert.equal((await f.call("prof-a", aiPost as never, "/api/live/ai-use", "POST", valid({ tool: "x" }), ALFA)).status, 400);
    assert.equal((await f.call("prof-a", aiPost as never, "/api/live/ai-use", "POST", valid({ patientId: null, dataSharing: "identificado" }), ALFA)).status, 400);
    assert.equal((await f.call("prof-a", aiPost as never, "/api/live/ai-use", "POST", valid({ usedAt: "2999-01-01T00:00:00Z" }), ALFA)).status, 400);
    assert.equal((await f.call("prof-a", aiPost as never, "/api/live/ai-use", "POST", valid({ purpose: "diagnostico_automatico" }), ALFA)).status, 400);

    // ciência da família: uma única vez, só quem escreve no clínico
    assert.equal((await f.call("sec-a", aiPatch as never, "/api/live/ai-use", "PATCH", { clinicId: ALFA, id: rec.id, status: "informada" }, ALFA)).status, 403);
    const ack = await f.call("prof-a", aiPatch as never, "/api/live/ai-use", "PATCH", { clinicId: ALFA, id: rec.id, status: "informada" }, ALFA);
    assert.equal(ack.status, 200);
    assert.match(((await ack.json()) as { suggestedChartLine: string }).suggestedChartLine, /Família informada sobre o uso de IA/);
    assert.equal((await f.call("prof-a", aiPatch as never, "/api/live/ai-use", "PATCH", { clinicId: ALFA, id: rec.id, status: "recusou" }, ALFA)).status, 409);

    // imutabilidade no banco: nem UPDATE do núcleo, nem DELETE
    assert.throws(() => f.raw.prepare("UPDATE ai_use_records SET tool = 'adulterado' WHERE id = ?").run(rec.id), /AI_USE_RECORD_IMMUTABLE/);
    assert.throws(() => f.raw.prepare("DELETE FROM ai_use_records WHERE id = ?").run(rec.id), /AI_USE_RECORD_NO_DELETE/);
    assert.throws(() => f.raw.prepare("UPDATE ai_use_records SET family_status = 'recusou' WHERE id = ?").run(rec.id), /AI_USE_FAMILY_STATUS_ALREADY_SET/);
    // trigger de tenant no banco: paciente de outra clínica
    assert.throws(() => f.raw.prepare("INSERT INTO ai_use_records (id, clinic_id, patient_id, actor_user_id, tool, purpose, data_sharing, human_reviewed, used_at) VALUES ('x', ?, 'paciente-beta', 'prof-a', 'ferramenta', 'transcricao', 'nenhum', 1, '2026-01-01T00:00:00Z')").run(ALFA), /AI_USE_PATIENT_TENANT_MISMATCH/);

    // a trilha não carrega o nome da ferramenta nem o paciente
    const audits = f.raw.prepare("SELECT metadata_json FROM saas_audit_log WHERE action IN ('ai_use_recorded','ai_use_family_status')").all() as Array<{ metadata_json: string }>;
    assert.ok(audits.length >= 3);
    for (const a of audits) assert.doesNotMatch(a.metadata_json, /Assistente|paciente-/);
  } finally { f.raw.close(); }
});

test("retenção: piso legal de 20 anos no handler e no banco; só gestor; isolamento", async () => {
  const f = await fixture();
  try {
    const put = (user: string, body: unknown, tenant = ALFA) => f.call(user, retPut as never, "/api/live/governance/retention", "PUT", body, tenant);
    // abaixo do piso: 422, nada gravado
    const low = await put("owner-a", { clinicId: ALFA, category: "clinical_record", retentionDays: 3650 });
    assert.equal(low.status, 422);
    assert.equal(f.raw.prepare("SELECT COUNT(*) AS n FROM clinic_retention_rules").get()?.n, 0);
    // o CHECK do banco também recusa (defesa em profundidade)
    assert.throws(() => f.raw.prepare("INSERT INTO clinic_retention_rules (clinic_id, category, retention_days, configured_by_user_id) VALUES (?, 'clinical_record', 100, 'owner-a')").run(ALFA), /CHECK/);
    // acima do piso: ok; categoria sem piso assumido aceita prazo menor
    assert.equal((await put("owner-a", { clinicId: ALFA, category: "clinical_record", retentionDays: 9125 })).status, 200);
    assert.equal((await put("admin-a", { clinicId: ALFA, category: "family_portal_links", retentionDays: 30 })).status, 200);
    // dias inválidos / categoria inválida
    assert.equal((await put("owner-a", { clinicId: ALFA, category: "clinical_record", retentionDays: -1 })).status, 400);
    assert.equal((await put("owner-a", { clinicId: ALFA, category: "inexistente", retentionDays: 9125 })).status, 400);
    // sem gestão: 403 (profissional, secretaria, financeiro)
    for (const user of ["prof-a", "sec-a", "fin-a"]) assert.equal((await put(user, { clinicId: ALFA, category: "clinical_record", retentionDays: 20000 })).status, 403, user);
    // BETA não toca a ALFA, nem com cabeçalho forjado
    assert.equal((await put("owner-b", { clinicId: ALFA, category: "clinical_record", retentionDays: 20000 }, BETA)).status, 403);
    assert.equal((await put("owner-b", { clinicId: ALFA, category: "clinical_record", retentionDays: 20000 }, ALFA)).status, 403);
    assert.equal((f.raw.prepare("SELECT retention_days FROM clinic_retention_rules WHERE clinic_id = ? AND category = 'clinical_record'").get(ALFA) as { retention_days: number }).retention_days, 9125);
    assert.equal(f.raw.prepare("SELECT COUNT(*) AS n FROM clinic_retention_rules WHERE clinic_id = ?").get(BETA)?.n, 0);
    // leitura: gestor vê pisos e pendências; profissional não
    const got = (await (await f.call("owner-a", retGet as never, `/api/live/governance/retention?clinicId=${ALFA}`, "GET", undefined, ALFA)).json()) as { rules: Array<{ category: string; retentionDays: number; legalFloorDays: number }>; pendingLegalDecisions: unknown[] };
    assert.equal(got.rules.find((r) => r.category === "clinical_record")?.retentionDays, 9125);
    assert.equal(got.rules.find((r) => r.category === "clinical_record")?.legalFloorDays, 7300);
    assert.ok(got.pendingLegalDecisions.length >= 2);
    assert.equal((await f.call("prof-a", retGet as never, `/api/live/governance/retention?clinicId=${ALFA}`, "GET", undefined, ALFA)).status, 403);
    // auditoria da alteração
    assert.ok((f.raw.prepare("SELECT COUNT(*) AS n FROM saas_audit_log WHERE action = 'retention_rule_upsert' AND clinic_id = ?").get(ALFA) as { n: number }).n >= 2);
  } finally { f.raw.close(); }
});

test("trilha de auditoria consultável: só gestor, só da própria clínica, com filtros e sem conteúdo", async () => {
  const f = await fixture();
  try {
    await f.call("prof-a", aiPost as never, "/api/live/ai-use", "POST", valid(), ALFA);
    await f.call("prof-b", aiPost as never, "/api/live/ai-use", "POST", valid({ clinicId: BETA, patientId: "paciente-beta" }), BETA);
    f.raw.prepare("INSERT INTO family_portal_audit_log (id, clinic_id, share_id, action, consent_version) VALUES ('fa1', ?, 'share-alfa', 'consent_accepted', 'v1')").run(ALFA);
    f.raw.prepare("INSERT INTO family_portal_audit_log (id, clinic_id, share_id, action, consent_version) VALUES ('fb1', ?, 'share-beta', 'content_viewed', 'v1')").run(BETA);

    const q = (user: string, query: string, tenant = ALFA) => f.call(user, auditGet as never, `/api/live/governance/audit?${query}`, "GET", undefined, tenant);
    const all = (await (await q("owner-a", `clinicId=${ALFA}`)).json()) as { data: Array<{ source: string; action: string; targetId: string | null; metadata: Record<string, unknown> }> };
    assert.ok(all.data.some((e) => e.action === "ai_use_recorded"));
    assert.ok(all.data.some((e) => e.source === "family_portal" && e.targetId === "share-alfa"));
    assert.ok(!all.data.some((e) => e.targetId === "share-beta"), "evento da BETA não aparece");
    assert.doesNotMatch(JSON.stringify(all.data), /Assistente fictício|paciente-alfa/);
    // filtros
    const onlyPortal = (await (await q("admin-a", `clinicId=${ALFA}&source=family_portal`)).json()) as { data: Array<{ source: string }> };
    assert.ok(onlyPortal.data.length >= 1 && onlyPortal.data.every((e) => e.source === "family_portal"));
    const byAction = (await (await q("owner-a", `clinicId=${ALFA}&action=ai_use`)).json()) as { data: Array<{ action: string }> };
    assert.ok(byAction.data.length >= 1 && byAction.data.every((e) => e.action.includes("ai_use")));
    const future = (await (await q("owner-a", `clinicId=${ALFA}&from=2999-01-01`)).json()) as { data: unknown[] };
    assert.equal(future.data.length, 0);
    assert.equal((await q("owner-a", `clinicId=${ALFA}&from=2026-13-01`)).status, 400);
    assert.equal((await q("owner-a", `clinicId=${ALFA}&source=xyz`)).status, 400);
    // acesso
    for (const user of ["prof-a", "sec-a", "fin-a"]) assert.equal((await q(user, `clinicId=${ALFA}`)).status, 403, user);
    assert.equal((await q("owner-b", `clinicId=${ALFA}`, BETA)).status, 403);
    assert.equal((await q("owner-b", `clinicId=${ALFA}`, ALFA)).status, 403);
  } finally { f.raw.close(); }
});

test("export LGPD da clínica inclui registro de IA e regras de retenção — só da própria clínica", async () => {
  const f = await fixture();
  try {
    await f.call("prof-a", aiPost as never, "/api/live/ai-use", "POST", valid(), ALFA);
    await f.call("prof-b", aiPost as never, "/api/live/ai-use", "POST", valid({ clinicId: BETA, patientId: "paciente-beta", tool: "Ferramenta da Beta" }), BETA);
    await f.call("owner-a", retPut as never, "/api/live/governance/retention", "PUT", { clinicId: ALFA, category: "clinical_record", retentionDays: 9125 }, ALFA);
    f.raw.prepare("INSERT OR IGNORE INTO tenant_lifecycle (clinic_id, status) VALUES (?, 'active')").run(ALFA);
    f.raw.prepare("DELETE FROM live_patients").run(); // perfis do fixture não são ciphertext válido
    const out = await collectTenantExportPayload(f.env.DB as never, f.env as never, ALFA, { enforceSyncLimits: false });
    assert.equal(out.ok, true, out.ok ? "" : JSON.stringify(out));
    if (out.ok) {
      const data = out.data as { aiUseRecords: Array<{ tool: string; patient_id: string }>; retentionRules: Array<{ category: string }> };
      assert.equal(data.aiUseRecords.length, 1);
      assert.equal(data.aiUseRecords[0].tool, "Assistente fictício");
      assert.ok(!JSON.stringify(data).includes("Ferramenta da Beta"), "nenhum dado da BETA no export da ALFA");
      assert.equal(data.retentionRules[0].category, "clinical_record");
    }
  } finally { f.raw.close(); }
});

test("eliminação do titular respeita o piso legal do prontuário (patient scope)", async () => {
  const { executeTenantScopedPurge } = await import("../../functions/api/live/governance/_purge");
  const f = await fixture();
  try {
    f.raw.prepare("INSERT INTO live_clinical_events (id, clinic_id, patient_id, author_user_id, event_type, occurred_at, provenance_kind, provenance_source, payload_encrypted) VALUES ('ev1', ?, 'paciente-alfa', 'prof-a', 'observation', ?, 'documented', 'system', 'cifrado-ficticio')").run(ALFA, "2024-03-01T12:00:00.000Z");
    f.raw.prepare("INSERT OR IGNORE INTO tenant_lifecycle (clinic_id, status) VALUES (?, 'active')").run(ALFA);
    const run = async (now: string) => {
      const falhas: string[] = [];
      const out = await executeTenantScopedPurge({
        db: f.env.DB as never,
        claim: { jobId: "j", requestType: "delete", requestId: "r", clinicId: ALFA, attempt: 1, claimedAt: now, leaseUntil: now } as never,
        targets: { clinicId: ALFA, scope: "patient", patientId: "paciente-alfa" },
        now,
        complete: async () => true,
        fail: async (code: string) => { falhas.push(code); return true as never; },
      } as never);
      return { out, falhas };
    };
    // 2 anos depois do último registro: bloqueado (RETENTION_PENDING), nada apagado
    const early = await run("2026-10-16T12:00:00.000Z");
    assert.equal(early.out, null);
    assert.deepEqual(early.falhas, ["RETENTION_PENDING"]);
    assert.equal(f.raw.prepare("SELECT COUNT(*) AS n FROM live_patients WHERE id = 'paciente-alfa'").get()?.n, 1);
    // 21 anos depois do último registro (e do cadastro): liberado
    f.raw.prepare("UPDATE live_patients SET created_at = '2000-01-01T00:00:00.000Z'").run();
    f.raw.prepare("DELETE FROM live_clinical_events").run();
    f.raw.prepare("INSERT INTO live_clinical_events (id, clinic_id, patient_id, author_user_id, event_type, occurred_at, provenance_kind, provenance_source, payload_encrypted) VALUES ('ev0', ?, 'paciente-alfa', 'prof-a', 'observation', '2000-03-01T12:00:00.000Z', 'documented', 'system', 'cifrado-ficticio')").run(ALFA);
    const late = await run("2026-10-16T12:00:00.000Z");
    assert.deepEqual(late.falhas, []);
    assert.ok(late.out);
    assert.equal(f.raw.prepare("SELECT COUNT(*) AS n FROM live_patients WHERE id = 'paciente-alfa'").get()?.n, 0);
    assert.equal(f.raw.prepare("SELECT COUNT(*) AS n FROM live_patients WHERE id = 'paciente-beta'").get()?.n, 1, "BETA intacta");
  } finally { f.raw.close(); }
});
