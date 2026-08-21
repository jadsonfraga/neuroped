import { mkdir, writeFile } from "node:fs/promises";

const checks = [
  { platform: "cloudflare", kind: "deploy-sentinel", url: "https://neuroped.pages.dev/deploy-check.json" },
  { platform: "cloudflare", kind: "api-health", url: "https://neuroped.pages.dev/api/health" },
  { platform: "vercel", kind: "deploy-sentinel", url: "https://superneuroped.vercel.app/deploy-check.json" },
  { platform: "vercel", kind: "public-shell", url: "https://superneuroped.vercel.app/" },
  { platform: "github-pages", kind: "canonical-redirector", url: "https://jadsonfraga.github.io/neuroped/" },
];
const expectedCommit = process.env.EXPECTED_COMMIT?.trim();
const report = { startedAt: new Date().toISOString(), expectedCommit: expectedCommit || null, checks: [] };

for (const check of checks) {
  const started = Date.now();
  const item = { ...check, ok: false, status: null, durationMs: 0, body: null, error: null };
  try {
    const response = await fetch(check.url, { redirect: "follow", headers: { Accept: "application/json,text/html" } });
    const body = await response.text();
    item.status = response.status;
    item.durationMs = Date.now() - started;
    item.body = body.replace(/\s+/g, " ").slice(0, 600);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    if (check.kind === "api-health") {
      const json = JSON.parse(body);
      item.ok = json.status === "ok" && json.authentication?.required === true && json.authentication?.configured === true && json.database === "ok";
      if (!item.ok) throw new Error("health sem status/auth/database esperados");
    } else if (check.kind === "deploy-sentinel") {
      const json = JSON.parse(body);
      item.ok = json.status === "deployed" || (json.provider && json.commit);
      if (expectedCommit && !String(json.commit).startsWith(expectedCommit.slice(0, 12))) throw new Error(`commit divergente: ${json.commit}`);
      if (!item.ok) throw new Error("sentinela sem estado publicado");
    } else {
      item.ok = /neuroped|NeuroPed|canonical/i.test(body);
      if (!item.ok) throw new Error("shell/redirecionador sem marca esperada");
    }
  } catch (error) {
    item.error = String(error?.message ?? error);
  }
  report.checks.push(item);
  console.log(`${item.ok ? "✓" : "✗"} ${check.platform}/${check.kind} ${item.status ?? "ERR"} ${item.durationMs}ms${item.error ? ` — ${item.error}` : ""}`);
}

report.finishedAt = new Date().toISOString();
await mkdir("artifacts/e2e", { recursive: true });
await writeFile("artifacts/e2e/published-health.json", JSON.stringify(report, null, 2));
process.exitCode = report.checks.every((item) => item.ok) ? 0 : 1;
