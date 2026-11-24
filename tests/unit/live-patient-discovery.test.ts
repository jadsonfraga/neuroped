import assert from "node:assert/strict";
import test from "node:test";
import { fixture, ALFA, BETA } from "./_multiclinic-fixture";
import { onRequestPost as privateSearch } from "../../functions/api/live/patients/search";
import { onRequestGet } from "../../functions/api/live/patients/index";
import { encryptClinicalJson } from "../../functions/api/tenant/_crypto";

async function catalog() {
  const f = await fixture();
  f.raw.exec("DELETE FROM live_patients");
  const insert = f.raw.prepare("INSERT INTO live_patients(id,clinic_id,created_by_user_id,profile_encrypted,created_at) VALUES(?,?,?,?,?)");
  async function add(id: string, name: string, clinic = ALFA, owner = "owner-a") {
    const profile = await encryptClinicalJson(f.env, clinic, "patient-profile:" + id, { name });
    insert.run(id, clinic, owner, profile, id === "fake-000" ? "2024-01-01 00:00:00" : id > "fake-045" ? "2025-01-02 00:00:00" : "2025-01-01 00:00:00");
  }
  for (let n = 0; n < 156; n++) {
    await add("fake-" + String(n).padStart(3, "0"), n === 40 ? "Registro sintético distante" : n === 0 ? "Registro sintético mais antigo" : "Cadastro fictício");
  }
  await add("fake-beta", "Registro sintético distante", BETA, "owner-b");
  const get = (q = "", cursor?: string, clinic = ALFA, user = "owner-a") => {
    const params = new URLSearchParams({ clinicId: clinic, q });
    if (cursor !== undefined) params.set("cursor", cursor);
    return f.call(user, onRequestGet as never, "/api/live/patients?" + params, "GET", undefined, clinic);
  };
  return { ...f, get };
}

type Page = { data: Array<{ id: string }>; nextCursor: string | null };
async function page(res: Response): Promise<Page> {
  assert.equal(res.status, 200);
  assert.match(res.headers.get("Cache-Control") ?? "", /no-store/);
  return await res.json() as Page;
}

test("busca acha cadastro fora dos 100 mais recentes sem retornar outras fichas", async () => {
  const f = await catalog();
  try {
    const result = await page(await f.get("  SINTÉTICO DISTANTE "));
    assert.deepEqual(result.data.map(row => row.id), ["fake-040"]);
  } finally { f.raw.close(); }
});

test("busca sem resultados parciais permite continuar até o cadastro mais antigo", async () => {
  const f = await catalog();
  try {
    const first = await page(await f.get("mais antigo"));
    assert.deepEqual(first.data, []);
    assert.ok(first.nextCursor, "zero parcial não encerra a busca");
    const final = await page(await f.get("mais antigo", first.nextCursor));
    assert.deepEqual(final.data.map(row => row.id), ["fake-000"]);
    assert.equal(final.nextCursor, null);
  } finally { f.raw.close(); }
});

test("listar por cursor em datas empatadas não omite, repete ou mistura pacientes", async () => {
  const f = await catalog();
  try {
    let cursor: string | null = null;
    const ids: string[] = [];
    do {
      const result: Page = await page(await f.get("", cursor ?? undefined));
      assert.ok(result.data.length <= 50);
      ids.push(...result.data.map(row => row.id));
      cursor = result.nextCursor;
      assert.ok(ids.length <= 156);
    } while (cursor);
    const expected = Array.from({ length: 156 }, (_, i) => "fake-" + String(155 - i).padStart(3, "0"));
    assert.deepEqual(ids, expected);
    assert.equal((await f.get("", "malformado")).status, 400);
    assert.equal((await f.get("", undefined, ALFA, "owner-b")).status, 403);
  } finally { f.raw.close(); }
});

test("busca privada usa o corpo e preserva as barreiras de clínica e papel", async () => {
  const f = await catalog();
  try {
    const search = (user: string, clinicId: string, q: string, cursor?: string) =>
      f.call(user, privateSearch as never, "/api/live/patients/search", "POST", { clinicId, q, cursor }, clinicId);
    const first = await page(await search("prof-a", ALFA, "mais antigo"));
    assert.deepEqual(first.data, []);
    assert.ok(first.nextCursor);
    const final = await page(await search("prof-a", ALFA, "mais antigo", first.nextCursor));
    assert.deepEqual(final.data.map(row => row.id), ["fake-000"]);
    assert.equal((await search("owner-b", ALFA, "mais antigo", first.nextCursor)).status, 403);
    assert.equal((await search("sec-a", ALFA, "mais antigo")).status, 403);
    f.raw.prepare("UPDATE users SET must_change_password = 1 WHERE id = ?").run("prof-a");
    const rotationRequired = await search("prof-a", ALFA, "mais antigo");
    assert.equal(rotationRequired.status, 403);
    assert.equal((await rotationRequired.json() as { code: string }).code, "PASSWORD_CHANGE_REQUIRED");
  } finally { f.raw.close(); }
});

test("buscar um nome comum não perde ocorrências ao atingir 50 resultados", async () => {
  const f = await catalog();
  try {
    let cursor: string | undefined;
    const ids: string[] = [];
    do {
      const result: Page = await page(await f.get("fictício", cursor));
      ids.push(...result.data.map(row => row.id));
      cursor = result.nextCursor ?? undefined;
      assert.ok(ids.length <= 154);
    } while (cursor);
    assert.equal(ids.length, 154);
    assert.equal(new Set(ids).size, 154);
    assert.ok(ids.includes("fake-001"));
  } finally { f.raw.close(); }
});
