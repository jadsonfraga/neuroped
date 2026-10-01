// Página pública de agendamento (/agendar), no navegador, sobre a UI de produção
// (dist/public) e uma API sintética em localhost que reproduz o CONTRATO do
// backend (functions/api/public-booking.ts). Não toca produção nem conta real.
//
// Prova o que a família vê:
//   - o horário que ela acabou de reservar sai da lista (nada de segundo clique
//     que termina em conflito);
//   - estado da reserva em português ("solicitada"), nunca `requested`;
//   - consulta da reserva: "não encontrada" SÓ com 404; falha do servidor ou de
//     rede diz que não foi possível consultar agora (a reserva não "sumiu");
//   - erro do servidor aparece como a mensagem em português, nunca como
//     `Error: 409: {"error":...}`;
//   - o botão de remarcar diz a data, não só a hora;
//   - acessibilidade (axe) do formulário e do resultado da consulta.
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
const SLUG = "dra-sintetica";
const DAY = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
const OTHER_DAY = new Date(Date.now() + 4 * 86400000).toISOString().slice(0, 10);
const TOKEN = "token-sintetico-de-reserva";

const profile = {
  slug: SLUG, displayName: "Dra. Sintética", specialty: "Neuropediatria", locationLabel: "Consultório sintético",
  timezone: "America/Recife", bookingEnabled: true, reviews: [],
  services: [{ id: "svc-1", providerUserId: "prov-1", name: "Consulta", durationMinutes: 60, priceCents: 40000, modality: "in_person", active: true, publicVisible: true, createdAt: "2026-09-01T00:00:00Z", updatedAt: "2026-09-01T00:00:00Z" }],
};
const slotsOf = (date) => ["09:00", "10:00", "11:00"].map((hour) => ({ startsAtLocal: `${date}T${hour}`, endsAtLocal: `${date}T${String(Number(hour.slice(0, 2)) + 1).padStart(2, "0")}:00` }));
const appointment = (status = "requested") => ({
  id: "apt-1", serviceId: "svc-1", startsAtLocal: `${DAY}T09:00`, endsAtLocal: `${DAY}T10:00`, timezone: "America/Recife", status, source: "public",
  guardianName: "Resp Sintético", guardianEmail: null, guardianPhone: "11999998888", patientName: "Criança Sintética", paymentStatus: "pending",
  checkedInAt: null, completedAt: null, cancelledAt: null, cancelReason: null, createdAt: "2026-09-01T00:00:00Z", updatedAt: "2026-09-01T00:00:00Z",
  serviceName: "Consulta", serviceModality: "in_person",
});

let world = { manage: "ok", reschedule: "conflict" };
let calls = [];
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".webp": "image/webp" };
const send = (res, status, body) => { res.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store" }); res.end(JSON.stringify(body)); };

const server = createServer((req, res) => {
  const url = new URL(req.url, "http://127.0.0.1");
  if (url.pathname === "/api/public-booking" && req.method === "GET") {
    const action = url.searchParams.get("action");
    calls.push({ method: "GET", action });
    if (action === "profile") return send(res, 200, profile);
    if (action === "slots") return send(res, 200, { slots: slotsOf(url.searchParams.get("date")) });
    if (action === "providers") return send(res, 200, { providers: [{ slug: SLUG, displayName: profile.displayName, specialty: profile.specialty, locationLabel: profile.locationLabel }] });
    return send(res, 404, { error: "Ação desconhecida.", code: "UNKNOWN_ACTION" });
  }
  if (url.pathname === "/api/public-booking" && req.method === "POST") {
    let raw = "";
    req.on("data", (chunk) => { raw += chunk; });
    req.on("end", () => {
      const body = raw ? JSON.parse(raw) : {};
      calls.push({ method: "POST", action: body.action });
      if (body.action === "book") return send(res, 201, { appointmentId: "apt-1", bookingToken: TOKEN, status: "requested", startsAtLocal: body.startsAtLocal, endsAtLocal: body.startsAtLocal, timezone: "America/Recife", message: "Solicitação registrada. Guarde o código para consultar ou cancelar a reserva." });
      if (body.action === "manage") {
        if (world.manage === "ok") return send(res, 200, { appointment: appointment() });
        if (world.manage === "not_found") return send(res, 404, { error: "Reserva não encontrada.", code: "NOT_FOUND" });
        if (world.manage === "server") return send(res, 500, { error: "Não foi possível concluir a solicitação.", code: "BOOKING_WRITE_FAILED" });
        if (world.manage === "network") { req.socket.destroy(); return; }
      }
      if (body.action === "reschedule") {
        if (world.reschedule === "conflict") return send(res, 409, { error: "Novo horário indisponível.", code: "SLOT_UNAVAILABLE" });
        return send(res, 200, { ok: true, status: "requested", startsAtLocal: body.startsAtLocal, endsAtLocal: body.startsAtLocal });
      }
      return send(res, 400, { error: "Ação inválida.", code: "VALIDATION_ERROR" });
    });
    return;
  }
  if (req.method !== "GET") return send(res, 405, { error: "NO_WRITES_ALLOWED" });
  if (url.pathname === "/__seed__") { res.writeHead(200, { "Content-Type": "text/html" }); res.end("<!doctype html><title>synthetic seed</title>"); return; }
  if (url.pathname === "/api/health") return send(res, 200, { database: "ok", authentication: { required: true, configured: true } });
  if (url.pathname === "/api/auth/me") return send(res, 401, { error: "Sessão ausente.", code: "UNAUTHENTICATED" });
  if (url.pathname.startsWith("/api/")) return send(res, 404, { error: "SYNTHETIC_ENDPOINT_NOT_STUBBED" });
  let file = join(DIST, url.pathname);
  if (!existsSync(file) || statSync(file).isDirectory()) file = join(DIST, "index.html");
  res.writeHead(200, { "Content-Type": types[extname(file)] || "application/octet-stream" });
  res.end(readFileSync(file));
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch(auditBrowserLaunchOptions());

async function open() {
  world = { manage: "ok", reschedule: "conflict" };
  calls = [];
  const context = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${base}/__seed__`);
  await page.evaluate(() => {
    for (const [key, value] of Object.entries({ "neuroped:aviso-educativo-aceito-v1": "synthetic", "neuroped:onboarding-seen": "1", np_tour_intro_v2: "done", np_tour_v2_done: "1" })) localStorage.setItem(key, value);
  });
  await page.goto(`${base}/#/agendar?provider=${SLUG}`, { waitUntil: "domcontentloaded" });
  await page.locator("#public-date").waitFor();
  await page.locator("#public-date").fill(DAY);
  return { context, page, errors };
}
async function axeClean(page, selector, label) {
  const result = await new AxeBuilder({ page }).include(selector).analyze();
  assert.deepEqual(result.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })), [], `${label}: acessibilidade (axe)`);
}
const toastText = (page) => page.locator('[role="status"], [data-radix-toast-viewport] li, ol li').allInnerTexts().then((items) => items.join(" | "));
async function loadSlots(page) {
  await page.getByRole("button", { name: "Consultar horários", exact: true }).click();
  await page.getByRole("button", { name: "09:00", exact: true }).waitFor();
}
async function fillAndBook(page) {
  const fields = page.locator("input[maxlength='120']");
  await fields.nth(0).fill("Criança Sintética");
  await fields.nth(1).fill("Resp Sintético");
  await page.locator("input[type='checkbox']").check();
  await page.getByRole("button", { name: "Solicitar este horário", exact: true }).click();
}

try {
  // ── 1. Reservar: o horário usado sai da lista; estado em português ───────
  {
    const { context, page, errors } = await open();
    await loadSlots(page);
    assert.equal(await page.getByRole("button", { name: /^\d\d:00$/ }).count(), 3, "três horários oferecidos");
    await axeClean(page, "main, #root", "formulário de agendamento público");
    await page.getByRole("button", { name: "09:00", exact: true }).click();
    await fillAndBook(page);
    await page.getByText("Código da reserva", { exact: true }).waitFor();
    await page.getByText("Consulta", { exact: true }).first().waitFor();
    assert.equal(await page.getByRole("button", { name: "09:00", exact: true }).count(), 0, "o horário reservado não continua oferecido");
    assert.equal(await page.getByRole("button", { name: "10:00", exact: true }).count(), 1, "os demais seguem");
    // Resultado da consulta: estado em português, nunca o identificador interno.
    const result = page.locator("div.rounded-2xl.border.p-4").filter({ hasText: "responsável: Resp Sintético" });
    await result.waitFor();
    const resultText = await result.innerText();
    assert.match(resultText, /solicitada/, "estado em português");
    assert.ok(!/\brequested\b/.test(resultText), "identificador interno não vai à tela");
    await axeClean(page, "main, #root", "resultado da consulta da reserva");

    // Remarcar: o botão diz a data, e o conflito aparece como mensagem limpa.
    await page.getByRole("button", { name: "10:00", exact: true }).click();
    const rescheduleButton = page.getByRole("button", { name: /^Remarcar para / });
    const label = await rescheduleButton.innerText();
    assert.match(label, new RegExp(`Remarcar para \\d{2}/\\d{2}/\\d{4} às 10:00`), `o botão traz a data: ${label}`);
    await rescheduleButton.click();
    await page.getByText("Novo horário indisponível.", { exact: true }).waitFor();
    const shown = await toastText(page);
    assert.ok(!/Error:|409:|"error"|\{/.test(shown), `nenhum erro cru na tela: ${shown}`);
    assert.deepEqual(errors, [], "nenhum erro de página");
    await context.close();
  }

  // ── 2. Consultar: 404 ≠ falha do servidor ≠ falha de rede ────────────────
  {
    const { context, page, errors } = await open();
    const consult = async (code) => {
      await page.getByLabel("Código da reserva", { exact: true }).fill(code);
      await page.getByRole("button", { name: "Consultar", exact: true }).click();
    };

    world.manage = "not_found";
    await consult("codigo-que-nao-existe");
    await page.getByText("Reserva não encontrada.", { exact: true }).waitFor();
    assert.ok(await page.getByText("Confira o código da reserva e tente de novo.").count() > 0, "orienta a conferir o código");

    world.manage = "server";
    await consult(TOKEN);
    await page.getByText("Não foi possível consultar a reserva agora.", { exact: true }).waitFor();
    await page.getByText("Não foi possível concluir a solicitação.", { exact: true }).waitFor();
    assert.equal(await page.getByText("Reserva não encontrada.", { exact: true }).count(), 0, "falha do servidor não diz que a reserva não existe");

    world.manage = "network";
    await consult(TOKEN);
    await page.getByText(/Sem conexão com o servidor/).first().waitFor();
    const shown = await toastText(page);
    assert.ok(!/Error:|TypeError|Failed to fetch|\{/.test(shown), `falha de rede também não aparece crua: ${shown}`);
    assert.deepEqual(errors, [], "nenhum erro de página");
    await context.close();
  }

  console.log("[public-booking-page-e2e] ✓ horário usado sai da lista, estado em português, remarcar com data, 404 ≠ servidor ≠ rede, nenhum erro cru na tela e axe");
} finally {
  await browser.close();
  server.close();
}
