import assert from "node:assert/strict";
import { readFileSync, writeFileSync, readdirSync, mkdirSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { randomBytes, randomUUID, createHash } from "node:crypto";
import { chromium } from "playwright";
import { hashPassword } from "../functions/api/auth/_crypto.ts";
import { encodeWav, validateWav, validateNote } from "../shared/escuta/core.ts";

// This is a deliberately separate staging deployment, never the production project.
// All users/patients are invented. No production DB reads or writes. No bypass endpoint.
const run = process.env.GITHUB_RUN_ID;
assert(process.env.GITHUB_ACTIONS === "true" && /^\d+$/.test(run || ""));
assert.equal(process.env.GITHUB_REPOSITORY, "jadsonfraga/neuroped");
assert.equal(process.env.GITHUB_REF_NAME, "feat/escuta-clinica-integrada-20260905");
const project = `np-escuta-qa-${run}`;
assert(/^np-escuta-qa-\d+$/.test(project));
const origin = `https://${project}.pages.dev`;
const token = process.env.CLOUDFLARE_API_TOKEN?.trim();
const account = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
const out = "artifacts/escuta-cloud"; mkdirSync(out, { recursive: true });
const report = { scope: "isolated cloud deployment of original application; synthetic data only", commit: process.env.GITHUB_SHA, project, origin, assertions: [], status: "running", productionMutated: false };
let databaseId = null, projectCreated = false, browser = null;
const configFile = "wrangler.escuta-qa.json";
const temporaryPasswords = new Map();
function pass(name) { report.assertions.push(name); console.log(`PASS ${name}`); }
function mask(value) { console.log(`::add-mask::${value}`); return value; }
function command(program, args, env = {}) { execFileSync(program, args, { stdio: "inherit", env: { ...process.env, ...env }, timeout: 300000 }); }
async function cloud(path, method = "GET", body) {
  if (!token || !account) throw new Error("BLOCKED_EXTERNAL_CLOUDFLARE_DEPLOY_CREDENTIALS");
  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(account)}${path}`, {
    method, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(90000),
  });
  const parsed = await response.json().catch(() => ({}));
  if (!response.ok || parsed.success !== true) {
    // Metadata only: never log request bodies, returned variables or raw error messages.
    const codes = (parsed.errors || []).map(e => e.code).join(",");
    throw new Error(`CLOUDFLARE_${method}_${path.split("/")[1]}_HTTP_${response.status}_CODES_${codes}`);
  }
  return parsed.result;
}
async function sql(statement, params = []) {
  assert(databaseId && databaseId !== "9b0919e5-93af-4b4f-851b-fc77dc1e5bae");
  const result = await cloud(`/d1/database/${databaseId}/query`, "POST", { sql: statement, params });
  assert(Array.isArray(result) && result.every(r => r.success === true), "ISOLATED_D1_STATEMENT_FAILED");
  return result;
}
async function request(path, method = "GET", body, accessToken, clinicId) {
  const response = await fetch(origin + path, { method, headers: {
    "Content-Type": "application/json", ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...(clinicId ? { "X-Tenant-Id": clinicId } : {}),
  }, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(115000) });
  const data = await response.json().catch(() => ({}));
  return { response, data };
}
function requireStatus(result, status, label) {
  assert.equal(result.response.status, status, `${label}: HTTP ${result.response.status} ${result.data.code || ""}`);
  return result.data;
}
try {
  const canonical = await cloud("/pages/projects/neuroped");
  assert.equal(canonical.name, "neuroped");
  report.canonicalProjectVerified = true;
  const database = await cloud("/d1/database", "POST", { name: project });
  databaseId = database.uuid; assert(databaseId && databaseId !== "9b0919e5-93af-4b4f-851b-fc77dc1e5bae");
  report.databaseId = databaseId;
  // Seed only a brand-new database after proving it has no application tables.
  const empty = await sql("SELECT COUNT(*) AS total FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%';");
  assert.equal(empty[0].results[0].total, 0, "REFUSE_NONEMPTY_DATABASE");
  await sql(readFileSync("db/schema.d1.sql", "utf8"));
  for (const marker of ["alpha", "beta"]) {
    const password = mask(`Qa-${randomBytes(24).toString("hex")}!`);
    temporaryPasswords.set(marker, password);
    // Seed fixture accounts BEFORE historical verification migration: its provenance remains truthful.
    await sql("INSERT INTO users(id,name,email,password_hash,role,is_active,must_change_password) VALUES(?,?,?,?, 'professional',1,0)", [randomUUID(), `Profissional fictício ${marker}`, `${marker}@escuta.invalid`, await hashPassword(password)]);
  }
  const applied = [];
  for (const name of readdirSync("db/migrations").filter(n => /^\d{4}.*\.sql$/.test(n)).sort()) {
    if (/^000[12]_/.test(name)) continue; // already included in canonical fresh schema
    await sql(readFileSync(`db/migrations/${name}`, "utf8")); applied.push(name);
  }
  report.migrations = applied;
  const dataKey = mask(randomBytes(32).toString("hex"));
  const indexKey = mask(randomBytes(32).toString("hex"));
  const jwtKey = mask(randomBytes(32).toString("hex"));
  const envVars = {
    ENVIRONMENT: { type: "plain_text", value: "production" },
    APP_BASE_URL: { type: "plain_text", value: origin },
    ESCUTA_ENABLED: { type: "plain_text", value: "true" },
    CLINICAL_LIVE_ENABLED: { type: "plain_text", value: "true" },
    CLINICAL_DATA_KEY_ID: { type: "plain_text", value: "qa1" },
    SAAS_SIGNUP_ENABLED: { type: "plain_text", value: "false" },
    NEUROPED_JWT_SECRET: { type: "secret_text", value: jwtKey },
    CLINICAL_DATA_KEY: { type: "secret_text", value: dataKey },
    CLINICAL_INDEX_KEY: { type: "secret_text", value: indexKey },
  };
  await cloud("/pages/projects", "POST", { name: project, production_branch: "qa", deployment_configs: {
    production: { compatibility_date: "2024-11-01", compatibility_flags: ["nodejs_compat"], env_vars: envVars, d1_databases: { DB: { id: databaseId } } },
  } });
  projectCreated = true;
  // Native binding is configured through the provider's documented deployment interface.
  // A denial from that interface aborts; no token escalation or unauthorized fallback exists.
  writeFileSync(configFile, JSON.stringify({ name: project, compatibility_date: "2024-11-01", compatibility_flags: ["nodejs_compat"], pages_build_output_dir: "dist/public", ai: { binding: "AI" }, d1_databases: [{ binding: "DB", database_name: project, database_id: databaseId }], vars: Object.fromEntries(Object.entries(envVars).filter(([_k,v]) => v.type === "plain_text").map(([k,v]) => [k,v.value])) }, null, 2));
  command("npm", ["run", "build:client"], { NODE_ENV: "production", VITE_AUTH_MODE: "remote", VITE_API_URL: "", VITE_ZONE: "full", VITE_ALLOWED_HOSTS: `${project}.pages.dev`, VITE_PIN_HASH: "" });
  writeFileSync("dist/public/deploy-check.json", JSON.stringify({ app: "NeuroPed", provider: "cloudflare-pages", scope: "isolated-qa", commit: process.env.GITHUB_SHA, branch: process.env.GITHUB_REF_NAME, production: false }));
  command("npx", ["--yes", "wrangler@4.129.0", "pages", "deploy", "dist/public", "--config", configFile, "--project-name", project, "--branch", "qa", "--commit-hash", process.env.GITHUB_SHA, "--commit-dirty=true"]);
  report.deployed = true;
  let sentinel;
  for (let attempt = 0; attempt < 24; attempt++) {
    try { sentinel = await request("/deploy-check.json"); if (sentinel.response.ok && sentinel.data.commit === process.env.GITHUB_SHA) break; } catch { /* DNS/deployment propagation only */ }
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  assert(sentinel?.response.ok && sentinel.data.commit === process.env.GITHUB_SHA, "DEPLOYED_SHA_NOT_CONFIRMED");
  pass("actual cloud deployment confirms exact source SHA");
  const health = requireStatus(await request("/api/health"), 200, "health");
  assert.equal(health.database, "ok"); assert.equal(health.authentication.configured, true);
  requireStatus(await request("/api/live/escuta?clinicId=unknown"), 401, "anonymous denied");
  pass("real D1 health and anonymous API denial");
  const sessions = {};
  for (const marker of ["alpha", "beta"]) {
    const login = requireStatus(await request("/api/auth/login", "POST", { email: `${marker}@escuta.invalid`, password: temporaryPasswords.get(marker) }), 200, "normal login");
    mask(login.accessToken); mask(login.refreshToken);
    const clinic = requireStatus(await request("/api/tenants", "POST", { name: `Clínica fictícia ${marker}`, slug: `qa-${marker}` }, login.accessToken), 201, "normal clinic creation");
    sessions[marker] = { ...login, clinicId: clinic.id };
  }
  const a = sessions.alpha, b = sessions.beta;
  const capabilities = requireStatus(await request(`/api/live/escuta?clinicId=${a.clinicId}`, "GET", undefined, a.accessToken, a.clinicId), 200, "escuta capability");
  assert(capabilities.enabled && capabilities.configured, "NATIVE_AI_BINDING_NOT_CONFIGURED");
  pass("real session, persisted clinic membership, trial entitlement and native AI binding");
  const foreign = await request("/api/live/escuta", "POST", { action: "generate", clinicId: b.clinicId, transcript: "Conversa fictícia sem diagnóstico confirmado.", recordingAcknowledged: true }, a.accessToken, a.clinicId);
  requireStatus(foreign, 403, "cross tenant denied");
  const patient = requireStatus(await request("/api/live/patients", "POST", { clinicId: a.clinicId, profile: { name: "Paciente fictício Escuta QA", birthDate: "2019-01-01" }, name: "Paciente fictício Escuta QA", birthDate: "2019-01-01" }, a.accessToken, a.clinicId), 201, "create synthetic patient");
  report.patientCreated = Boolean(patient.id);
  const pcmBytes = readFileSync("/tmp/escuta-fixture.pcm");
  const pcm = new Int16Array(pcmBytes.length / 2); for (let i = 0; i < pcm.length; i++) pcm[i] = pcmBytes.readInt16LE(i * 2);
  const wav = encodeWav(pcm); report.audio = validateWav(wav);
  report.audio.sha256 = createHash("sha256").update(wav).digest("hex");
  const stt = requireStatus(await request("/api/live/escuta", "POST", { clinicId: a.clinicId, action: "transcribe", audio: Buffer.from(wav).toString("base64"), recordingAcknowledged: true }, a.accessToken, a.clinicId), 200, "actual native transcription");
  assert(stt.transcript.length > 40, "EMPTY_NATIVE_TRANSCRIPT");
  report.syntheticTranscript = stt.transcript; pass("real Portuguese synthetic audio transcribed through authenticated deployed handler");
  const generated = requireStatus(await request("/api/live/escuta", "POST", { clinicId: a.clinicId, action: "generate", transcript: stt.transcript, recordingAcknowledged: true }, a.accessToken, a.clinicId), 200, "actual native note");
  const note = validateNote(generated.note, stt.transcript); report.syntheticNote = note;
  pass("real structured note with literal source validation");
  const saved = requireStatus(await request("/api/live/documents", "POST", { clinicId: a.clinicId, patientId: patient.id, documentType: "clinical_note", origin: "clinician", status: "draft", familyVisibility: false, content: { title: "Escuta QA", escutaVersion: "escuta-v1", note, transcript: stt.transcript } }, a.accessToken, a.clinicId), 201, "save actual document");
  const history = requireStatus(await request(`/api/live/documents?clinicId=${a.clinicId}&patientId=${patient.id}`, "GET", undefined, a.accessToken, a.clinicId), 200, "read actual history");
  const restored = history.data.find(item => item.id === saved.id);
  assert(restored && restored.familyVisibility === false && restored.status === "draft");
  assert.deepEqual(restored.version.content.note, note);
  const encrypted = await sql("SELECT content_encrypted FROM live_document_versions WHERE document_id=? AND clinic_id=?", [saved.id, a.clinicId]);
  assert(!encrypted[0].results[0].content_encrypted.includes(stt.transcript.slice(0, 30)));
  pass("actual D1 encrypted persistence and authorized decryption restore exact note");
  const denial = await request(`/api/live/documents?clinicId=${a.clinicId}&patientId=${patient.id}`, "GET", undefined, b.accessToken, b.clinicId);
  requireStatus(denial, 403, "foreign history denied"); pass("other clinic cannot read document");
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1365, height: 1000 } });
  const page = await context.newPage(); page.setDefaultTimeout(30000);
  await page.goto(`${origin}/#/login`);
  await page.locator('input[type="email"]').fill("alpha@escuta.invalid");
  await page.locator('input[type="password"]').fill(temporaryPasswords.get("alpha"));
  await page.getByRole("button", { name: /entrar/i }).click();
  await page.waitForFunction(() => !window.location.hash.includes("/login"));
  await page.goto(`${origin}/#/escuta-clinica`);
  await page.getByRole("heading", { name: "Escuta Clínica", exact: true }).waitFor();
  await page.getByText("Processamento habilitado", { exact: true }).waitFor();
  await page.getByRole("combobox").selectOption(patient.id);
  await page.getByRole("button", { name: "Consultar histórico", exact: true }).click();
  await page.getByRole("button", { name: "Abrir versão", exact: true }).waitFor();
  page.on("dialog", dialog => dialog.accept());
  await page.getByRole("button", { name: "Abrir versão", exact: true }).click();
  await page.getByRole("heading", { name: "3. Anamnese para revisão", exact: true }).waitFor();
  await page.screenshot({ path: `${out}/deployed-desktop.png`, fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.screenshot({ path: `${out}/deployed-mobile.png`, fullPage: true });
  pass("deployed unmocked UI logs in, loads actual patient and reopens persisted note");
  await context.close(); report.status = "passed";
} catch (error) {
  report.status = "blocked_or_failed"; report.reason = error instanceof Error ? error.message : "UNKNOWN_ERROR";
  console.error(report.reason); process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  rmSync(configFile, { force: true });
  // Close the staging account after QA: no long-lived usable credentials in a public artifact.
  if (databaseId) {
    try { await sql("DELETE FROM auth_refresh_sessions; UPDATE users SET is_active=0 WHERE email IN ('alpha@escuta.invalid','beta@escuta.invalid');"); report.testAccountsDisabled = true; }
    catch { report.cleanupFailure = true; process.exitCode = 1; }
  }
  if (report.status !== "passed") {
    // Only resources CREATED in this run can be removed. Never resolve deletion targets by broad search.
    if (projectCreated) { try { await cloud(`/pages/projects/${project}`, "DELETE"); report.failedProjectRemoved = true; } catch { report.projectCleanupFailed = true; } }
    if (databaseId) { try { await cloud(`/d1/database/${databaseId}`, "DELETE"); report.failedDatabaseRemoved = true; } catch { report.databaseCleanupFailed = true; } }
  }
  writeFileSync(`${out}/acceptance.json`, JSON.stringify(report, null, 2));
}
