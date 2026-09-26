/** Aggregate-only D1 census. Never reads clinical content or returns identities. */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const LEGACY_TABLES = [
  "patients_demo", "consultations_demo", "scale_results_demo",
  "clinical_memory_notes_demo", "conecta_events_demo", "clinical_events_demo",
  "documents_demo", "external_import_batches",
];
const CLASSES = ["no_owner", "missing_owner", "inactive_owner", "no_active_clinic", "one_active_clinic", "multiple_active_clinics"];

function count(value) {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) throw new Error("CENSUS_INVALID_COUNT");
  return value;
}

export async function collectLegacyTenantCensus(query, { bootstrapEmail = "" } = {}) {
  const scalar = async (sql, params = []) => count((await query(sql, params))[0]?.total);
  const tables = {};
  for (const table of LEGACY_TABLES) {
    const available = (await scalar("SELECT COUNT(*) AS total FROM sqlite_master WHERE type = 'table' AND name = ?", [table])) === 1;
    tables[table] = { available, rows: available ? await scalar(`SELECT COUNT(*) AS total FROM ${table}`) : null };
  }
  if (!tables.patients_demo.available) throw new Error("CENSUS_REQUIRED_SCHEMA_MISSING");
  for (const table of ["users", "clinics", "clinic_memberships"]) {
    if (await scalar("SELECT COUNT(*) AS total FROM sqlite_master WHERE type = 'table' AND name = ?", [table]) !== 1) throw new Error("CENSUS_REQUIRED_SCHEMA_MISSING");
  }

  const ownershipRows = await query(`SELECT ownership_class, COUNT(*) AS total FROM (
    SELECT CASE
      WHEN p.owner_user_id IS NULL THEN 'no_owner'
      WHEN u.id IS NULL THEN 'missing_owner'
      WHEN u.is_active <> 1 THEN 'inactive_owner'
      WHEN COALESCE(m.total, 0) = 0 THEN 'no_active_clinic'
      WHEN m.total = 1 THEN 'one_active_clinic'
      ELSE 'multiple_active_clinics' END AS ownership_class
    FROM patients_demo p LEFT JOIN users u ON u.id = p.owner_user_id
    LEFT JOIN (
      SELECT cm.user_id, COUNT(DISTINCT cm.clinic_id) AS total
      FROM clinic_memberships cm JOIN clinics c ON c.id = cm.clinic_id
      WHERE cm.active = 1 AND c.status = 'active' GROUP BY cm.user_id
    ) m ON m.user_id = p.owner_user_id
  ) GROUP BY ownership_class`);
  const patientOwnership = Object.fromEntries(CLASSES.map((key) => [key, 0]));
  for (const row of ownershipRows) {
    if (!CLASSES.includes(row.ownership_class)) throw new Error("CENSUS_INVALID_CLASS");
    patientOwnership[row.ownership_class] = count(row.total);
  }
  if (Object.values(patientOwnership).reduce((a, b) => a + b, 0) !== tables.patients_demo.rows) throw new Error("CENSUS_CHANGED_DURING_READ");

  const legacySeedIdsPresent = await scalar("SELECT COUNT(*) AS total FROM patients_demo WHERE id IN ('demo-001', 'demo-002', 'demo-003')");
  const bootstrapAdmin = { configured: Boolean(bootstrapEmail.trim()) };
  if (bootstrapAdmin.configured) {
    const email = bootstrapEmail.trim().toLowerCase();
    bootstrapAdmin.accounts = await scalar("SELECT COUNT(*) AS total FROM users WHERE lower(email) = ? AND role = 'admin' AND is_active = 1", [email]);
    bootstrapAdmin.activeOwnerMemberships = await scalar(`SELECT COUNT(*) AS total FROM clinic_memberships cm
      JOIN users u ON u.id = cm.user_id JOIN clinics c ON c.id = cm.clinic_id
      WHERE lower(u.email) = ? AND u.role = 'admin' AND u.is_active = 1
        AND cm.role = 'owner' AND cm.active = 1 AND c.status = 'active'`, [email]);
    bootstrapAdmin.ownedLegacyPatients = await scalar(`SELECT COUNT(*) AS total FROM patients_demo p JOIN users u ON u.id = p.owner_user_id
      WHERE lower(u.email) = ? AND u.role = 'admin' AND u.is_active = 1`, [email]);
  }
  return {
    version: 1, scope: "aggregate-only", mutations: false, clinicalContentRead: false,
    tables, patientOwnership, legacySeedIdsPresent, bootstrapAdmin,
    unambiguousOwnerMapping: patientOwnership.one_active_clinic === tables.patients_demo.rows,
    migrationAuthorized: false,
  };
}

async function main() {
  const output = resolve("artifacts/legacy-tenant-census.json");
  mkdirSync(dirname(output), { recursive: true });
  const save = (report) => writeFileSync(output, JSON.stringify({ checkedAt: new Date().toISOString(), commit: process.env.GITHUB_SHA ?? null, ...report }, null, 2));
  try {
    if (process.env.GITHUB_REF !== "refs/heads/main" || process.env.GITHUB_REPOSITORY !== "jadsonfraga/neuroped") throw new Error("CENSUS_TRUSTED_MAIN_REQUIRED");
    const account = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
    const token = process.env.CLOUDFLARE_API_TOKEN?.trim();
    if (!account || !token) throw new Error("CENSUS_CREDENTIALS_UNAVAILABLE");
    const databaseId = /database_id\s*=\s*"([a-f0-9-]+)"/.exec(readFileSync("wrangler.toml", "utf8"))?.[1];
    if (!databaseId) throw new Error("CENSUS_DB_ID_MISSING");
    async function cloudflare(path, body) {
      const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(account)}${path}`, {
        method: body ? "POST" : "GET",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(30_000),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || data?.success !== true) throw new Error("CENSUS_PROVIDER_QUERY_FAILED");
      return data.result;
    }
    const project = await cloudflare("/pages/projects/neuroped");
    if (project?.name !== "neuroped" || project?.deployment_configs?.production?.d1_databases?.DB?.id !== databaseId) throw new Error("CENSUS_CANONICAL_BINDING_MISMATCH");
    const query = async (sql, params = []) => {
      if (!/^SELECT\s/i.test(sql) || /;/.test(sql)) throw new Error("CENSUS_READ_ONLY_REQUIRED");
      const results = await cloudflare(`/d1/database/${databaseId}/query`, { sql, params });
      if (!Array.isArray(results) || results.length !== 1 || results[0]?.success !== true || !Array.isArray(results[0].results)) throw new Error("CENSUS_PROVIDER_QUERY_FAILED");
      return results[0].results;
    };
    const report = await collectLegacyTenantCensus(query, { bootstrapEmail: process.env.CENSUS_BOOTSTRAP_EMAIL ?? "" });
    save({ status: "observed", ...report });
    console.log("Legacy tenant census recorded: aggregate counts only, zero mutations.");
  } catch (error) {
    // Do not echo SQL, provider bodies, environment or arbitrary exception text.
    const code = /^CENSUS_[A-Z_]+$/.test(error?.message ?? "") ? error.message : "CENSUS_FAILED";
    save({ status: "blocked", code, mutations: false, migrationAuthorized: false });
    console.error(`Legacy census blocked: ${code}`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await main();
