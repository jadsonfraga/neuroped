// Agenda multiprofissional (issue #1064, etapa C): a recepção que atende mais de um
// médico escolhe de qual agenda opera, no navegador, sobre a UI de produção
// (dist/public) e uma API sintética em localhost que reproduz o CONTRATO do backend
// da etapa B: 409 com a lista, 403 indisponível, `provider` ignorado para o
// profissional. Não certifica conta real nem toca produção; o backend real é
// provado em tests/unit/operations-multi-provider.test.ts.
//
// Cenários: escolha obrigatória; troca sem misturar dados; ação e remarcação no
// profissional certo (query, nunca corpo); escolha lembrada por conta; escolha
// recusada pelo servidor; vínculo único (não manda provider); profissional (não vê a
// barra); armazenamento que lança; acessibilidade (axe).
//
// Etapa D (visão unificada do dia): reúne as agendas no dia escolhido, ordenadas por
// horário; só leitura (nenhum POST); cada profissional é buscado com o próprio
// `provider`; falha de um não esconde os outros e a nova tentativa recupera; teto de
// profissionais; "Abrir agenda de X" vai para a agenda do profissional; só aparece
// para a recepção com mais de um profissional.
//
// Pré-requisito: VITE_AUTH_MODE=remote VITE_API_URL="" npm run build:client
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { extname, join } from "node:path";
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { auditBrowserLaunchOptions } from "../../scripts/lib/browser-audit-runtime.mjs";

const DIST = "dist/public";
const clinic = { id: "clinic-synth", slug: "clinic-synth", name: "Clínica sintética", legalName: null, timezone: "America/Recife", status: "active", role: "owner" };
const SEC = { id: "sec-synth", email: "sec@example.test", name: "Secretária Sintética", role: "operator" };
const PROF1 = { id: "prof-1", email: "prof-1@example.test", name: "Profissional Um", role: "professional" };
const P1 = { id: "prof-1", name: "Profissional Um" };
const P2 = { id: "prof-2", name: "Profissional Dois" };
const P3 = { id: "prof-3", name: "Profissional Três" };
const STORAGE_KEY = `neuroped:agenda:provider:v1:${SEC.id}`;
const TOMORROW = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

let world = { actor: SEC, links: [P1, P2], blocked: new Set(), failing: new Set() };
const HOUR_OF = { "prof-1": "10", "prof-2": "09", "prof-3": "11" };
let requests = [];
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".webp": "image/webp" };
const send = (res, status, body) => { res.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store" }); res.end(JSON.stringify(body)); };

function dashboardFor(provider, actor) {
  const delegated = actor.role === "operator";
  return {
    profile: { slug: `slug-${provider.id}`, displayName: provider.name, specialty: "Neuropediatria", timezone: "America/Recife", bookingEnabled: false },
    access: {
      clinicId: clinic.id, actorUserId: actor.id, actorRole: actor.role, providerUserId: provider.id, providerName: provider.name,
      delegated, canConfigure: !delegated,
      ...(delegated ? { availableProviders: world.links.filter((l) => !world.blocked.has(l.id)) } : {}),
    },
    services: [{ id: `svc-${provider.id}`, providerUserId: provider.id, name: `Consulta ${provider.name}`, durationMinutes: 60, priceCents: delegated ? null : 40000, modality: "in_person", active: true, publicVisible: true, createdAt: "2026-09-01T00:00:00Z", updatedAt: "2026-09-01T00:00:00Z" }],
    rules: [], blocks: [], waitlist: [], reviews: [], notifications: [], staff: [], audit: [],
    appointments: [{
      id: `apt-${provider.id}`, providerUserId: provider.id, serviceId: `svc-${provider.id}`, patientId: null,
      startsAtLocal: `${TOMORROW}T${HOUR_OF[provider.id] ?? "10"}:00`, endsAtLocal: `${TOMORROW}T${String(Number(HOUR_OF[provider.id] ?? "10") + 1).padStart(2, "0")}:00`, timezone: "America/Recife", status: "confirmed", source: "professional",
      guardianName: "Responsável Sintético", guardianEmail: null, guardianPhone: null, patientName: `Criança de ${provider.name}`,
      amountCents: null, paymentStatus: "pending", paymentMethod: null, checkedInAt: null, completedAt: null, cancelledAt: null, cancelReason: null,
      createdAt: "2026-09-01T00:00:00Z", updatedAt: "2026-09-01T00:00:00Z", serviceName: `Consulta ${provider.name}`, serviceModality: "in_person",
    }],
    metrics: { today: 0, upcoming: 1, requested: 0, waitlist: 0, pendingReviews: 0, pendingNotifications: 0, expectedCents: 0, paidCents: 0, noShow30d: 0 },
  };
}

/** Reproduz o contrato de functions/api/operations/_context.ts. */
function operations(url, actor) {
  const requested = url.searchParams.get("provider");
  if (actor.role !== "operator") return { status: 200, body: dashboardFor(P1, actor) }; // profissional: o pedido é ignorado
  const links = world.links.filter((l) => !world.blocked.has(l.id));
  if (requested && world.failing.has(requested)) {
    return { status: 500, body: { error: "Não foi possível carregar a gestão operacional.", code: "OPERATIONS_LOAD_FAILED" } };
  }
  if (requested) {
    const hit = links.find((l) => l.id === requested);
    return hit
      ? { status: 200, body: dashboardFor(hit, actor) }
      : { status: 403, body: { error: "Profissional indisponível para esta recepção.", code: "PROVIDER_NOT_AVAILABLE" } };
  }
  if (links.length > 1) {
    return { status: 409, body: { error: "Escolha de qual profissional você vai operar a agenda.", code: "PROVIDER_SELECTION_REQUIRED", providers: links } };
  }
  return links.length === 1 ? { status: 200, body: dashboardFor(links[0], actor) } : { status: 403, body: { error: "Recepção ainda não vinculada a um profissional.", code: "STAFF_LINK_REQUIRED" } };
}

const server = createServer((req, res) => {
  const url = new URL(req.url, "http://127.0.0.1");
  const path = url.pathname;
  if (path === "/api/operations") {
    let raw = "";
    req.on("data", (chunk) => { raw += chunk; });
    req.on("end", () => {
      let body = null;
      try { body = raw ? JSON.parse(raw) : null; } catch { /* corpo inválido nesta API sintética */ }
      requests.push({ method: req.method, provider: url.searchParams.get("provider"), action: body?.action ?? null, id: body?.id ?? null, bodyKeys: body ? Object.keys(body) : [] });
      const result = operations(url, world.actor);
      send(res, result.status, result.body);
    });
    return;
  }
  if (req.method !== "GET") return send(res, 405, { error: "NO_WRITES_ALLOWED" });
  if (path === "/__seed__") { res.writeHead(200, { "Content-Type": "text/html" }); res.end("<!doctype html><title>synthetic seed</title>"); return; }
  if (path === "/api/health") return send(res, 200, { database: "ok", authentication: { required: true, configured: true } });
  if (path === "/api/auth/me") return send(res, 200, world.actor);
  if (path === "/api/tenants") return send(res, 200, { data: [clinic] });
  if (path === "/api/live/patients" || path === "/api/patients") return send(res, 200, { data: [], total: 0 });
  if (path.startsWith("/api/")) return send(res, 404, { error: "SYNTHETIC_ENDPOINT_NOT_STUBBED" });
  let file = join(DIST, path);
  if (!existsSync(file) || statSync(file).isDirectory()) file = join(DIST, "index.html");
  res.writeHead(200, { "Content-Type": types[extname(file)] || "application/octet-stream" });
  res.end(readFileSync(file));
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch(auditBrowserLaunchOptions());

async function open(scenario, { storage = {}, breakStorage = false } = {}) {
  world = { actor: SEC, links: [P1, P2], blocked: new Set(), failing: new Set(), ...scenario };
  requests = [];
  const context = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${base}/__seed__`);
  await page.evaluate(([account, seeded]) => {
    for (const [key, value] of Object.entries({ "neuroped:aviso-educativo-aceito-v1": "synthetic", "neuroped:onboarding-seen": "1", np_tour_intro_v2: "done", np_tour_v2_done: "1", ...seeded })) localStorage.setItem(key, value);
    sessionStorage.setItem("neuroped:access", "synthetic-access");
    sessionStorage.setItem("neuroped:user", JSON.stringify(account));
  }, [world.actor, storage]);
  if (breakStorage) {
    // O armazenamento lança para a chave da escolha (bloqueio de dados do site). Só
    // essa chave: Storage.prototype é compartilhado com o sessionStorage, e derrubar
    // a sessão do app não provaria nada sobre a escolha. A falha total do
    // armazenamento é coberta em tests/unit/agenda-provider.test.ts.
    await context.addInitScript(() => {
      const original = { getItem: Storage.prototype.getItem, setItem: Storage.prototype.setItem, removeItem: Storage.prototype.removeItem };
      const guard = (name) => function (key, ...rest) {
        if (String(key).startsWith("neuroped:agenda:provider:v1")) throw new Error("storage blocked");
        return original[name].call(this, key, ...rest);
      };
      Storage.prototype.getItem = guard("getItem");
      Storage.prototype.setItem = guard("setItem");
      Storage.prototype.removeItem = guard("removeItem");
    });
  }
  await page.goto(`${base}/#/agenda`, { waitUntil: "domcontentloaded" });
  return { context, page, errors };
}
const stored = (page) => page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
const gets = () => requests.filter((r) => r.method === "GET");
const posts = () => requests.filter((r) => r.method === "POST");
async function axeClean(page, selector, label) {
  const result = await new AxeBuilder({ page }).include(selector).analyze();
  assert.deepEqual(result.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })), [], `${label}: acessibilidade (axe)`);
}

try {
  // ── 1. Dois profissionais, nada escolhido: a tela pede a escolha ─────────
  {
    const { context, page, errors } = await open({});
    await page.getByTestId("agenda-provider-chooser").waitFor();
    await page.getByRole("heading", { name: "Qual agenda você vai operar?", exact: true }).waitFor();
    assert.equal(await page.getByRole("button", { name: "Agenda de Profissional Dois", exact: true }).count(), 1);
    assert.equal(await page.getByRole("button", { name: "Agenda de Profissional Um", exact: true }).count(), 1);
    assert.equal(await page.getByTestId("agenda-shell").count(), 0, "sem escolha nenhuma agenda é mostrada");
    assert.ok(gets().length >= 1 && gets().every((r) => r.provider === null), "o primeiro pedido não leva profissional");
    assert.deepEqual(posts(), [], "nenhuma ação sem escolha");
    await axeClean(page, '[data-testid="agenda-provider-chooser"]', "escolhedor");

    // Escolhe o prof-2.
    await page.getByRole("button", { name: "Agenda de Profissional Dois", exact: true }).click();
    await page.getByTestId("agenda-shell").waitFor();
    assert.match(await page.getByTestId("agenda-provider-label").innerText(), /Agenda de Profissional Dois/);
    assert.equal(await page.getByTestId("agenda-provider-select").inputValue(), "prof-2");
    assert.deepEqual(await page.getByTestId("agenda-provider-select").locator("option").allInnerTexts(), ["Profissional Um", "Profissional Dois"]);
    await page.getByText("Criança de Profissional Dois").first().waitFor();
    assert.equal(await page.getByText("Criança de Profissional Um").count(), 0);
    assert.equal(gets().at(-1).provider, "prof-2", "o pedido seguinte leva o profissional escolhido");
    assert.equal(await stored(page), "prof-2", "a escolha é lembrada para esta conta");
    await axeClean(page, '[data-testid="agenda-provider-bar"]', "barra da agenda em operação");

    // Troca para o prof-1: nada da outra agenda sobra na tela.
    await page.getByTestId("agenda-provider-select").selectOption("prof-1");
    await page.getByText("Criança de Profissional Um").first().waitFor();
    assert.match(await page.getByTestId("agenda-provider-label").innerText(), /Agenda de Profissional Um/);
    assert.equal(await page.getByText("Criança de Profissional Dois").count(), 0, "dados do prof-2 não aparecem na agenda do prof-1");
    assert.equal(gets().at(-1).provider, "prof-1");
    assert.equal(await stored(page), "prof-1");

    // Ação: vai para o prof-1 pela QUERY, sem profissional no corpo, e nomeia a agenda.
    await page.getByRole("button", { name: "check-in", exact: true }).first().click();
    await page.getByText("Consulta: check-in — agenda de Profissional Um.").first().waitFor();
    const action = posts().at(-1);
    assert.equal(action.provider, "prof-1", "a ação vai ao profissional da agenda aberta");
    assert.equal(action.action, "appointment_status");
    assert.equal(action.id, "apt-prof-1");
    assert.ok(!action.bodyKeys.some((key) => /provider/i.test(key)), "o corpo da ação não carrega profissional");

    // Remarcar nomeia a agenda; trocar de profissional fecha o formulário.
    await page.getByRole("button", { name: "Remarcar", exact: true }).first().click();
    assert.match(await page.getByTestId("reschedule-agenda-of").innerText(), /Remarcando na agenda de Profissional Um\./);
    await page.getByTestId("agenda-provider-select").selectOption("prof-2");
    await page.getByText("Criança de Profissional Dois").first().waitFor();
    assert.equal(await page.getByTestId("reschedule-form").count(), 0, "trocar de profissional descarta a remarcação em andamento");

    // Recarregar: a escolha lembrada vale desde o primeiro pedido, sem escolhedor.
    requests = [];
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.getByTestId("agenda-shell").waitFor();
    assert.equal(gets()[0].provider, "prof-2", "escolha lembrada vai no primeiro pedido");
    assert.equal(await page.getByTestId("agenda-provider-chooser").count(), 0);
    assert.match(await page.getByTestId("agenda-provider-label").innerText(), /Agenda de Profissional Dois/);
    assert.deepEqual(errors, [], "nenhum erro de página");
    await context.close();
  }

  // ── 2. Escolha lembrada que o servidor recusa volta a pedir a escolha ────
  {
    const { context, page, errors } = await open({ links: [P1, P2, P3], blocked: new Set(["prof-2"]) }, { storage: { [STORAGE_KEY]: "prof-2" } });
    await page.getByTestId("agenda-provider-chooser").waitFor();
    assert.equal(requests[0].provider, "prof-2", "primeiro tenta a escolha lembrada");
    assert.ok(requests.some((r) => r.provider === null), "depois pede sem profissional");
    assert.equal(await stored(page), null, "a escolha recusada é esquecida");
    assert.equal(await page.getByRole("button", { name: "Agenda de Profissional Dois", exact: true }).count(), 0, "o profissional recusado não é oferecido");
    assert.equal(await page.getByRole("button", { name: "Agenda de Profissional Três", exact: true }).count(), 1);
    assert.deepEqual(errors, []);
    await context.close();
  }

  // ── 3. Um único profissional: sem escolhedor, sem provider ───────────────
  {
    const { context, page, errors } = await open({ links: [P1] }, { storage: { [STORAGE_KEY]: "prof-1" } });
    await page.getByTestId("agenda-shell").waitFor();
    assert.match(await page.getByTestId("agenda-provider-label").innerText(), /Agenda de Profissional Um/, "o rótulo aparece mesmo com um só profissional");
    assert.equal(await page.getByTestId("agenda-provider-select").count(), 0, "sem seletor com um só profissional");
    await page.waitForFunction((key) => localStorage.getItem(key) === null, STORAGE_KEY);
    assert.equal(gets().at(-1).provider, null, "com um só profissional o pedido volta a não levar provider");
    assert.deepEqual(errors, []);
    await context.close();
  }

  // ── 4. Profissional: nada de barra, e a escolha lembrada é esquecida ─────
  {
    const { context, page, errors } = await open({ actor: PROF1 }, { storage: { [`neuroped:agenda:provider:v1:${PROF1.id}`]: "prof-2" } });
    await page.getByTestId("agenda-shell").waitFor();
    assert.equal(await page.getByTestId("agenda-provider-bar").count(), 0, "o profissional não vê a barra da recepção");
    assert.equal(await page.getByTestId("agenda-provider-select").count(), 0);
    await page.waitForFunction((key) => localStorage.getItem(key) === null, `neuroped:agenda:provider:v1:${PROF1.id}`);
    assert.equal(gets().at(-1).provider, null, "o profissional não manda provider");
    assert.deepEqual(errors, []);
    await context.close();
  }

  // ── 5. Armazenamento que lança nunca derruba a tela ──────────────────────
  {
    const { context, page, errors } = await open({}, { breakStorage: true });
    await page.getByTestId("agenda-provider-chooser").waitFor();
    await page.getByRole("button", { name: "Agenda de Profissional Um", exact: true }).click();
    await page.getByTestId("agenda-shell").waitFor();
    assert.match(await page.getByTestId("agenda-provider-label").innerText(), /Agenda de Profissional Um/);
    assert.equal(gets().at(-1).provider, "prof-1", "sem armazenamento a escolha só não é lembrada");
    assert.deepEqual(errors, [], "nenhum erro de página com o armazenamento bloqueado");
    await context.close();
  }


  // ── 6. Etapa D: visão unificada do dia ───────────────────────────────────
  {
    const { context, page, errors } = await open({}, { storage: { [STORAGE_KEY]: "prof-1" } });
    await page.getByTestId("agenda-shell").waitFor();
    await page.getByRole("tab", { name: "Dia de todos", exact: true }).click();
    await page.getByTestId("agenda-unified-day").waitFor();

    // O dia padrão é hoje: as consultas sintéticas são de amanhã.
    await page.getByTestId("agenda-unified-empty").waitFor();
    await page.locator("#agenda-unified-date").fill(TOMORROW);
    await page.getByTestId("agenda-unified-row").first().waitFor();
    const rows = page.getByTestId("agenda-unified-row");
    assert.equal(await rows.count(), 2, "uma consulta de cada profissional no dia");
    assert.deepEqual(
      await rows.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-provider-id"))),
      ["prof-2", "prof-1"],
      "ordenadas por horário: 09:00 do prof-2 antes das 10:00 do prof-1",
    );
    assert.match(await rows.nth(0).innerText(), /Criança de Profissional Dois/);
    assert.match(await rows.nth(0).innerText(), /09:00–10:00/);
    assert.match(await rows.nth(1).innerText(), /Criança de Profissional Um/);
    assert.equal(await page.getByTestId("agenda-unified-error").count(), 0);

    // Cada profissional é buscado com o PRÓPRIO provider; nenhum pedido sem ele; só leitura.
    const asked = new Set(gets().map((r) => r.provider));
    assert.deepEqual([...asked].sort(), ["prof-1", "prof-2"], "um pedido por profissional, sempre com provider");
    assert.deepEqual(posts(), [], "a visão do dia é só leitura: nenhum POST");
    await axeClean(page, '[data-testid="agenda-unified-day"]', "visão unificada do dia");

    // Abrir a agenda de um profissional: troca de agenda e volta para a aba da agenda.
    await page.getByRole("button", { name: "Abrir agenda de Profissional Dois", exact: true }).click();
    await page.getByText("Novo agendamento manual").waitFor();
    assert.match(await page.getByTestId("agenda-provider-label").innerText(), /Agenda de Profissional Dois/);
    assert.equal(await page.getByTestId("agenda-provider-select").inputValue(), "prof-2");
    assert.equal(await stored(page), "prof-2", "a escolha segue o fluxo normal e é lembrada");
    assert.deepEqual(posts(), [], "abrir a agenda também não escreve nada");
    assert.deepEqual(errors, [], "nenhum erro de página");
    await context.close();
  }

  // ── 7. Falha de um profissional não esconde os outros; nova tentativa recupera ─
  {
    const { context, page, errors } = await open({ links: [P1, P2, P3], failing: new Set(["prof-3"]) }, { storage: { [STORAGE_KEY]: "prof-1" } });
    await page.getByTestId("agenda-shell").waitFor();
    await page.getByRole("tab", { name: "Dia de todos", exact: true }).click();
    await page.locator("#agenda-unified-date").fill(TOMORROW);
    await page.getByTestId("agenda-unified-error").waitFor();
    assert.match(await page.getByTestId("agenda-unified-error").innerText(), /Profissional Três/);
    assert.deepEqual(
      await page.getByTestId("agenda-unified-row").evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-provider-id"))),
      ["prof-2", "prof-1"],
      "as agendas que carregaram continuam na tela",
    );
    await axeClean(page, '[data-testid="agenda-unified-day"]', "visão unificada do dia com erro");

    // Ainda falhando: continua o aviso, sem quebrar.
    await page.getByRole("button", { name: "Tentar novamente", exact: true }).click();
    await page.getByTestId("agenda-unified-error").waitFor();
    // O servidor volta: a nova tentativa traz a terceira agenda.
    world.failing = new Set();
    await page.getByRole("button", { name: "Tentar novamente", exact: true }).click();
    await page.waitForFunction(() => document.querySelectorAll('[data-testid="agenda-unified-row"]').length === 3);
    assert.equal(await page.getByTestId("agenda-unified-error").count(), 0, "o aviso some quando todas carregam");
    assert.deepEqual(
      await page.getByTestId("agenda-unified-row").evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-provider-id"))),
      ["prof-2", "prof-1", "prof-3"],
    );
    assert.deepEqual(posts(), []);
    assert.deepEqual(errors, [], "nenhum erro de página");
    await context.close();
  }

  // ── 8. Teto de profissionais combinados ──────────────────────────────────
  {
    const many = Array.from({ length: 10 }, (_, index) => ({ id: `prof-${index + 1}`, name: `Profissional ${String(index + 1).padStart(2, "0")}` }));
    const { context, page, errors } = await open({ links: many }, { storage: { [STORAGE_KEY]: "prof-1" } });
    await page.getByTestId("agenda-shell").waitFor();
    await page.getByRole("tab", { name: "Dia de todos", exact: true }).click();
    await page.getByTestId("agenda-unified-hidden").waitFor();
    assert.match(await page.getByTestId("agenda-unified-hidden").innerText(), /até 8 profissionais\. Há mais 2/);
    assert.equal(await page.getByTestId("agenda-unified-providers").locator("li").count(), 8);
    await page.locator("#agenda-unified-date").fill(TOMORROW);
    await page.waitForFunction(() => document.querySelectorAll('[data-testid="agenda-unified-row"]').length === 8);
    assert.deepEqual(
      [...new Set(gets().map((r) => r.provider))].sort(),
      many.slice(0, 8).map((p) => p.id).sort(),
      "só os 8 primeiros são buscados; os demais não geram pedido",
    );
    assert.deepEqual(errors, []);
    await context.close();
  }

  // ── 9. Só a recepção com mais de um profissional vê a visão do dia ───────
  {
    const single = await open({ links: [P1] }, { storage: { [STORAGE_KEY]: "prof-1" } });
    await single.page.getByTestId("agenda-shell").waitFor();
    assert.equal(await single.page.getByRole("tab", { name: "Dia de todos", exact: true }).count(), 0, "um só profissional: sem a aba");
    await single.context.close();

    const professional = await open({ actor: PROF1 });
    await professional.page.getByTestId("agenda-shell").waitFor();
    assert.equal(await professional.page.getByRole("tab", { name: "Dia de todos", exact: true }).count(), 0, "o profissional não vê a visão da recepção");
    await professional.context.close();
  }

  console.log("[agenda-multi-provider-e2e] ✓ escolhedor, troca sem misturar dados, ação e remarcação no profissional certo (query, nunca corpo), escolha lembrada por conta, escolha recusada, vínculo único, profissional, armazenamento bloqueado, visão unificada do dia (ordem, só leitura, falha parcial com recuperação, teto, restrita à recepção com vários profissionais) e axe");
} finally {
  await browser.close();
  server.close();
}
