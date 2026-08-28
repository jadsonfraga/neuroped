import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const manifestPath = path.join(root, "docs/saas-migration-manifest.sha256");
const migrationFiles = fs.readdirSync(path.join(root, "db/migrations"))
  .filter((file) => /^00(?:1[6-9]|2[0-4])_saas_.*\.sql$/.test(file))
  .sort()
  .map((file) => `db/migrations/${file}`);

function digest(relativeFile) {
  return crypto.createHash("sha256").update(fs.readFileSync(path.join(root, relativeFile))).digest("hex");
}

function serializeManifest(manifest) {
  return [
    "# NeuroPed SaaS migration manifest",
    `schemaVersion=${manifest.schemaVersion}`,
    ...manifest.migrations.map(({ file, sha256 }) => `${sha256}  ${file}`),
    "",
  ].join("\n");
}

function parseManifest(text) {
  const lines = text.split(/\r?\n/).filter((line) => line && !line.startsWith("#"));
  const schemaLine = lines.shift() || "";
  const schemaVersion = Number(schemaLine.split("=", 2)[1]);
  const migrations = lines.map((line) => {
    const match = line.match(/^([a-f0-9]{64})\s{2}(.+)$/i);
    if (!match) throw new Error(`SAAS_MIGRATION_MANIFEST_LINE_INVALID: ${line}`);
    return { sha256: match[1], file: match[2] };
  });
  return { schemaVersion, migrations };
}

const current = {
  schemaVersion: 1,
  migrations: migrationFiles.map((file) => ({ file, sha256: digest(file) })),
};

const check = process.argv.includes("--check");
if (!fs.existsSync(manifestPath)) {
  if (check) {
    console.error(`Manifest ausente: ${path.relative(root, manifestPath)}`);
    process.exit(1);
  }
  fs.writeFileSync(manifestPath, serializeManifest(current));
  console.log(`Manifesto criado com ${current.migrations.length} migrations SaaS.`);
  process.exit(0);
}

const expected = parseManifest(fs.readFileSync(manifestPath, "utf8"));
const expectedSerialized = serializeManifest(expected);
const currentSerialized = serializeManifest(current);
if (expectedSerialized !== currentSerialized) {
  const expectedFiles = new Set((expected.migrations ?? []).map((item) => item.file));
  const currentFiles = new Set(current.migrations.map((item) => item.file));
  const missing = [...expectedFiles].filter((file) => !currentFiles.has(file));
  const added = [...currentFiles].filter((file) => !expectedFiles.has(file));
  const changed = current.migrations
    .filter((item) => expected.migrations?.find((expectedItem) => expectedItem.file === item.file)?.sha256 !== item.sha256)
    .map((item) => item.file);
  console.error(JSON.stringify({ error: "SAAS_MIGRATION_MANIFEST_MISMATCH", missing, added, changed }, null, 2));
  process.exit(1);
}
console.log(`[saas-migration-manifest] ✓ ${current.migrations.length} migrations 0016–0024 sem drift`);
