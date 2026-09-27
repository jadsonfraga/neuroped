import { randomUUID } from "node:crypto";
import { appendFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const ORIGIN = "https://neuroped.pages.dev";
const MAX_BYTES = 262144;
const fail = (code) => { throw new Error(code); };
const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

export function validateDeployment(value) {
  if (!object(value) || value.app !== "NeuroPed" || value.provider !== "cloudflare-pages" ||
      value.branch !== "main" || !/^[a-f0-9]{40}$/.test(value.commit ?? "") ||
      !/^\d+$/.test(String(value.run_id ?? ""))) fail("INVALID_DEPLOYMENT_SENTINEL");
  return { commit: value.commit, runId: String(value.run_id) };
}

export function validateProviders(value) {
  if (!object(value) || Object.keys(value).some((key) => key !== "providers") ||
      !Array.isArray(value.providers)) fail("INVALID_PROVIDERS_ENVELOPE");
  const seen = new Set();
  const allowed = new Set(["slug", "displayName", "specialty", "locationLabel"]);
  for (const provider of value.providers) {
    if (!object(provider) || Object.keys(provider).some((key) => !allowed.has(key)) ||
        typeof provider.slug !== "string" || !provider.slug.trim() ||
        typeof provider.displayName !== "string" || !provider.displayName.trim() ||
        [provider.specialty, provider.locationLabel].some((v) => v != null && typeof v !== "string")) {
      fail("INVALID_PUBLIC_PROVIDER_SHAPE");
    }
    if (seen.has(provider.slug)) fail("DUPLICATE_PROVIDER");
    seen.add(provider.slug);
  }
  return seen;
}

export async function getJson(path, fetchImpl = globalThis.fetch) {
  const url = new URL(path, ORIGIN);
  if (url.origin !== ORIGIN) fail("NON_CANONICAL_ORIGIN");
  url.searchParams.set("_smoke", randomUUID());
  let response;
  try {
    response = await fetchImpl(url, {
      method: "GET", redirect: "error", cache: "no-store",
      headers: { Accept: "application/json", "Cache-Control": "no-cache" },
      signal: AbortSignal.timeout(20000),
    });
  } catch { fail("NETWORK_OR_REDIRECT_FAILURE"); }
  if (response.status !== 200) fail(`UNEXPECTED_HTTP_${response.status}`);
  if (!/^application\/json(?:\s*;|\s*$)/i.test(response.headers.get("content-type") ?? "")) {
    fail("NON_JSON_CONTENT_TYPE");
  }
  if (!response.body) fail("EMPTY_RESPONSE_BODY");
  const chunks = [];
  let bytes = 0;
  try {
    for await (const chunk of response.body) {
      bytes += chunk.byteLength;
      if (bytes > MAX_BYTES) fail("RESPONSE_TOO_LARGE");
      chunks.push(Buffer.from(chunk));
    }
  } catch (error) {
    fail(error.message === "RESPONSE_TOO_LARGE" ? error.message : "RESPONSE_READ_FAILED");
  }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); }
  catch { fail("INVALID_JSON"); }
}

// Injection is for offline contract tests only. CLI always uses the real fetch.
export async function runSmoke({ fetchImpl = globalThis.fetch, expectedSha = "" } = {}) {
  if (expectedSha && !/^[a-f0-9]{40}$/.test(expectedSha)) fail("INVALID_EXPECTED_SHA");
  const before = validateDeployment(await getJson("/deploy-check.json", fetchImpl));
  if (expectedSha && before.commit !== expectedSha) fail("DEPLOYMENT_SHA_MISMATCH");
  const known = validateProviders(await getJson(
    "/api/public-booking?action=providers&clinic=4126d150", fetchImpl,
  ));
  const unknown = validateProviders(await getJson(
    `/api/public-booking?action=providers&clinic=s13-smoke-absent-${randomUUID()}`, fetchImpl,
  ));
  if (unknown.size !== 0) fail("UNKNOWN_CLINIC_RETURNED_PROVIDERS");
  const after = validateDeployment(await getJson("/deploy-check.json", fetchImpl));
  if (after.commit !== before.commit || after.runId !== before.runId) fail("DEPLOYMENT_CHANGED_DURING_SMOKE");
  return {
    status: "PASSED", origin: ORIGIN, deployedSha: before.commit,
    deploymentRunId: before.runId, knownClinicHttp: 200, knownClinicProviders: known.size,
    unknownClinicHttp: 200, unknownClinicProviders: unknown.size,
    abProof: "NOT_RUN_NO_AUTHORIZED_FIXTURE",
    limitation: "Read-only public directory smoke; not proof of A/B membership or booking writes.",
  };
}

async function main() {
  let evidence;
  try {
    evidence = await runSmoke({ expectedSha: process.env.EXPECTED_DEPLOY_SHA ?? "" });
  } catch (error) {
    // Never persist response bodies, identities, tokens or arbitrary exception text.
    const code = /^[A-Z][A-Z0-9_]+$/.test(error.message ?? "") ? error.message : "UNEXPECTED_SMOKE_FAILURE";
    evidence = { status: "FAILED", origin: ORIGIN, error: code, abProof: "NOT_RUN_NO_AUTHORIZED_FIXTURE" };
    process.exitCode = 1;
  }
  evidence.testedAtUtc = new Date().toISOString();
  evidence.evidenceKind = "remote-http";
  const json = JSON.stringify(evidence, null, 2);
  const output = resolve("artifacts/s13-directory-smoke.json");
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, `${json}\n`);
  console.log(json);
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## S13 public directory — ${evidence.status}\n\n\`\`\`json\n${json}\n\`\`\`\n`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await main();
