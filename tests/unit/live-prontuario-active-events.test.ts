import assert from "node:assert/strict";
import test from "node:test";
import { onRequestGet } from "../../functions/api/live/events/index";
import { encryptClinicalJson } from "../../functions/api/tenant/_crypto";
import { fixture, ALFA, BETA } from "./_multiclinic-fixture";

type Page = { data: Array<{ id: string; status: string }>; nextCursor?: string | null };

async function setup() {
  const f = await fixture();
  const stmt = f.raw.prepare(`INSERT INTO live_clinical_events
    (id, clinic_id, patient_id, author_user_id, event_type, occurred_at, encounter_id,
      provenance_kind, provenance_source, payload_encrypted, status, created_at)
    VALUES (?, ?, ?, ?, 'observation', ?, 'anamnese:queixaPrincipal', 'documented', 'clinician', ?, ?, '2026-01-01 00:00:00')`);
  const add = async (id: string, status: string, occurredAt: string, clinic = ALFA) => {
    const payload = await encryptClinicalJson(f.env, clinic, "clinical-event:" + id, { valueText: "Registro fictício" });
    stmt.run(id, clinic, clinic === ALFA ? "paciente-alfa" : "paciente-beta", clinic === ALFA ? "prof-a" : "owner-b", occurredAt, payload, status);
  };
  const get = (extra: Record<string, string> = {}, clinic = ALFA, user = "owner-a", patient = "paciente-alfa") => {
    const params = new URLSearchParams({ clinicId: clinic, patientId: patient, ...extra });
    return f.call(user, onRequestGet as never, "/api/live/events?" + params, "GET", undefined, clinic);
  };
  return { ...f, add, get };
}

async function page(response: Response): Promise<Page> {
  assert.equal(response.status, 200, await response.clone().text());
  assert.match(response.headers.get("Cache-Control") ?? "", /no-store/);
  return await response.json() as Page;
}

test("leitura ativa recupera a anamnese que a janela do histórico não contém", async () => {
  const f = await setup();
  try {
    await f.add("evento-ativo", "active", "2024-01-01T00:00:00.000Z");
    for (let i = 0; i < 500; i++) await f.add("evento-corrigido-" + i, "corrected", "2025-01-01T00:00:00.000Z");
    const history = await page(await f.get());
    assert.equal(history.data.length, 500);
    assert.equal(history.data.some((row) => row.id === "evento-ativo"), false);
    assert.equal("nextCursor" in history, false);
    const current = await page(await f.get({ status: "active" }));
    assert.deepEqual(current.data.map(({ id }) => id), ["evento-ativo"]);
    assert.equal(current.nextCursor, null);
  } finally { f.raw.close(); }
});

test("páginas ativas não repetem nem omitem IDs empatados e mantêm isolamento", async () => {
  const f = await setup();
  try {
    const expected = [];
    for (let i = 0; i < 205; i++) {
      const id = "evento-empate-" + String(i).padStart(3, "0");
      expected.unshift(id);
      await f.add(id, "active", "2025-01-01T00:00:00.000Z");
    }
    await f.add("evento-outra-clinica", "active", "2025-01-01T00:00:00.000Z", BETA);
    let current = await page(await f.get({ status: "active" }));
    assert.equal(current.data.length, 100);
    assert.ok(current.nextCursor);
    const cursor = current.nextCursor;
    assert.equal((await f.get({ status: "active", cursor }, BETA, "owner-a", "paciente-beta")).status, 403);
    assert.equal((await f.get({ status: "active", cursor }, ALFA, "owner-a", "paciente-beta")).status, 404);
    assert.equal((await f.get({ status: "active", cursor: "incompleto" })).status, 400);
    const ids = current.data.map(({ id }) => id);
    for (let i = 0; current.nextCursor && i < 3; i++) {
      current = await page(await f.get({ status: "active", cursor: current.nextCursor }));
      ids.push(...current.data.map(({ id }) => id));
    }
    assert.equal(current.nextCursor, null);
    assert.deepEqual(ids, expected);
  } finally { f.raw.close(); }
});

test("leitura clínica não apresenta dados parciais quando a segunda página falha", async () => {
  const { loadProntuarioActiveEvents } = await import("../../client/src/lib/prontuarioActiveEvents");
  const row = { id: "evento-parcial", clinicId: ALFA, patientId: "paciente-alfa", status: "active", eventType: "observation", occurredAt: "2025-01-01T00:00:00Z" };
  let requests = 0;
  await assert.rejects(loadProntuarioActiveEvents(ALFA, row.patientId, async (url) => {
    requests++;
    const params = new URL(url, "http://localhost").searchParams;
    assert.equal(params.get("status"), "active");
    assert.equal(params.get("clinicId"), ALFA);
    assert.equal(params.get("patientId"), row.patientId);
    if (params.get("cursor") === "pagina-sintetica") throw new Error("falha na segunda página");
    return { data: [row], nextCursor: "pagina-sintetica" };
  }, () => false), /falha na segunda página/);
  assert.equal(requests, 2);
  await assert.rejects(loadProntuarioActiveEvents(ALFA, row.patientId, async () =>
    ({ data: [row], nextCursor: "pagina-sintetica" }), () => false), /repetidos/);
  await assert.rejects(loadProntuarioActiveEvents(ALFA, row.patientId, async () =>
    ({ data: [{ ...row, clinicId: BETA }], nextCursor: null }), () => false), /inválidos/);
  await assert.rejects(loadProntuarioActiveEvents(ALFA, row.patientId, async () =>
    ({ data: [row] }), () => false), /incompleta/);
});
