#!/usr/bin/env node
/**
 * G4 — ensaio de backup/restore com ciphertext REAL.
 *
 * Usa as mesmas funções de produção (`encryptClinicalJson` /
 * `decryptClinicalJson`, AES-GCM com chave derivada por clínica e AAD
 * clínica+finalidade) sobre conteúdo 100% sintético. A chave é EFÊMERA,
 * gerada pelo job a cada ensaio e passada em `DR_REHEARSAL_DATA_KEY`; o script
 * nunca lê o keyring de produção (`CLINICAL_DATA_KEY*`) e recusa rodar se ele
 * estiver presente no ambiente, para não haver dúvida sobre qual chave cifrou.
 *
 * Comandos:
 *   fixture <manifest.json>  → imprime o SQL de inserção; grava o manifesto
 *                              (SHA-256 de cada texto claro, sem conteúdo).
 *   verify  <manifest.json>  → lê do stdin o JSON do `wrangler d1 execute --json`
 *                              com as linhas cifradas, decifra cada uma e
 *                              compara com o manifesto; prova também que a
 *                              cifra recusa outra clínica, outra finalidade e
 *                              outra chave. Imprime só contagens.
 */
import { createHash, randomBytes } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { decryptClinicalJson, encryptClinicalJson } from "../../functions/api/tenant/_crypto.ts";

export const REAL_PREFIX = "dr-rehearsal-real-";
export const REHEARSAL_KEY_ID = "drk1";
const CREATED = "2026-01-01T00:00:00Z";

type Kind = "patient" | "event" | "diary";
export interface ManifestEntry { table: string; id: string; clinicId: string; purpose: string; kind: Kind; plainSha256: string }

function rehearsalEnv(secret: string) {
  return { CLINICAL_DATA_KEY: secret, CLINICAL_DATA_KEY_ID: REHEARSAL_KEY_ID } as never;
}

export function readRehearsalKey(env: NodeJS.ProcessEnv = process.env): string {
  for (const name of ["CLINICAL_DATA_KEY", "CLINICAL_DATA_KEY_PREVIOUS", "CLINICAL_INDEX_KEY"]) {
    if (env[name]) throw new Error(`Recusado: ${name} presente no ambiente. O ensaio usa só chave efêmera.`);
  }
  const key = env.DR_REHEARSAL_DATA_KEY?.trim() ?? "";
  if (key.length < 32) throw new Error("DR_REHEARSAL_DATA_KEY ausente ou curta (mínimo 32).");
  return key;
}

const sha = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const q = (value: string) => `'${value.replace(/'/g, "''")}'`;

/** Conteúdo sintético, sem pessoa real; o hash vai para o manifesto, não o texto. */
function plainFor(kind: Kind, clinic: string, n: number) {
  if (kind === "patient") return { name: `Paciente Sintético DR ${clinic.toUpperCase()}`, birthDate: "2018-01-01", note: "ensaio G4" };
  if (kind === "event") return { observation: `observação sintética ${clinic}-${n}`, value: n };
  return n === 1
    ? { crises: 1, tipo: "sintético", duracaoMin: 2, gatilhos: ["sono"] }
    : { intensidade: 4, duracaoHoras: 1.5, aura: false, medicacao: "nenhuma (sintético)" };
}

export async function buildFixture(secret: string): Promise<{ sql: string; manifest: ManifestEntry[] }> {
  const env = rehearsalEnv(secret);
  const version = `clinical-v1:${REHEARSAL_KEY_ID}`;
  const manifest: ManifestEntry[] = [];
  const lines: string[] = ["-- G4: linhas sintéticas com ciphertext real (chave efêmera do ensaio)."];
  for (const clinic of ["alpha", "beta"]) {
    const clinicId = `dr-rehearsal-clinic-${clinic}`;
    const user = `dr-rehearsal-user-${clinic}`;
    const patientId = `${REAL_PREFIX}patient-${clinic}`;
    const profile = plainFor("patient", clinic, 0);
    const purpose = `patient-profile:${patientId}`;
    const profileCipher = await encryptClinicalJson(env, clinicId, purpose, profile);
    manifest.push({ table: "live_patients", id: patientId, clinicId, purpose, kind: "patient", plainSha256: sha(profile) });
    lines.push(`INSERT INTO live_patients (id, clinic_id, primary_professional_user_id, created_by_user_id, external_reference_hash, patient_identity_hash, profile_encrypted, encryption_version, status, created_at, updated_at) VALUES (${[patientId, clinicId, user, user, `${patientId}-ref`, `${patientId}-identity`, profileCipher, version, "active", CREATED, CREATED].map(q).join(", ")});`);
    for (const n of [1, 2]) {
      const eventId = `${REAL_PREFIX}event-${clinic}-${n}`;
      const payload = plainFor("event", clinic, n);
      const eventPurpose = `clinical-event:${eventId}`;
      const cipher = await encryptClinicalJson(env, clinicId, eventPurpose, payload);
      manifest.push({ table: "live_clinical_events", id: eventId, clinicId, purpose: eventPurpose, kind: "event", plainSha256: sha(payload) });
      lines.push(`INSERT INTO live_clinical_events (id, clinic_id, patient_id, author_user_id, event_type, occurred_at, provenance_kind, provenance_source, payload_encrypted, encryption_version, status, created_at) VALUES (${[eventId, clinicId, patientId, user, "observation", CREATED, "measured", "system", cipher, version, "active", CREATED].map(q).join(", ")});`);

      const diaryId = `${REAL_PREFIX}diary-${clinic}-${n}`;
      const entry = plainFor("diary", clinic, n);
      const diaryPurpose = `live-diary-entry:${diaryId}`;
      const diaryCipher = await encryptClinicalJson(env, clinicId, diaryPurpose, entry);
      manifest.push({ table: "live_diary_entries", id: diaryId, clinicId, purpose: diaryPurpose, kind: "diary", plainSha256: sha(entry) });
      lines.push(`INSERT INTO live_diary_entries (id, clinic_id, patient_id, author_user_id, diary_id, entry_date, reported_by, payload_encrypted, encryption_version, created_at) VALUES (${[diaryId, clinicId, patientId, user, n === 1 ? "diario-epilepsia" : "calendario-cefaleia", "2026-01-0" + n, "family", diaryCipher, version, CREATED].map(q).join(", ")});`);
    }
  }
  return { sql: `${lines.join("\n")}\n`, manifest };
}

/** SQL que lê de volta exatamente as linhas cifradas do ensaio. */
export const READBACK_SQL = [
  `SELECT 'live_patients' AS t, id, clinic_id, profile_encrypted AS c FROM live_patients WHERE id LIKE '${REAL_PREFIX}%'`,
  `SELECT 'live_clinical_events', id, clinic_id, payload_encrypted FROM live_clinical_events WHERE id LIKE '${REAL_PREFIX}%'`,
  `SELECT 'live_diary_entries', id, clinic_id, payload_encrypted FROM live_diary_entries WHERE id LIKE '${REAL_PREFIX}%'`,
].join(" UNION ALL ") + " ORDER BY 1, 2;";

export function rowsFromWranglerJson(raw: string): Array<{ t: string; id: string; clinic_id: string; c: string }> {
  const text = raw.replace(/\u001b\[[0-9;]*m/g, "");
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start < 0 || end <= start) throw new Error("Saída do Wrangler sem JSON.");
  const parsed = JSON.parse(text.slice(start, end + 1));
  const results = Array.isArray(parsed) ? parsed.flatMap((block: { results?: unknown[] }) => block?.results ?? []) : [];
  return results as Array<{ t: string; id: string; clinic_id: string; c: string }>;
}

async function rejects(fn: () => Promise<unknown>): Promise<boolean> {
  try { await fn(); return false; } catch { return true; }
}

export async function verifyRows(
  secret: string,
  manifest: ManifestEntry[],
  rows: Array<{ t: string; id: string; clinic_id: string; c: string }>,
): Promise<{ decrypted: number; negativeChecks: number }> {
  const env = rehearsalEnv(secret);
  if (rows.length !== manifest.length) throw new Error(`Linhas cifradas: esperado ${manifest.length}, obtido ${rows.length}.`);
  const byKey = new Map(rows.map((row) => [`${row.t}:${row.id}`, row]));
  let decrypted = 0;
  let negativeChecks = 0;
  const other = randomBytes(32).toString("base64");
  for (const entry of manifest) {
    const row = byKey.get(`${entry.table}:${entry.id}`);
    if (!row) throw new Error(`Linha ausente após restauração: ${entry.table}/${entry.id}`);
    if (row.clinic_id !== entry.clinicId) throw new Error(`Clínica divergente: ${entry.id}`);
    const plain = await decryptClinicalJson(env, entry.clinicId, entry.purpose, row.c);
    if (sha(plain) !== entry.plainSha256) throw new Error(`Texto claro divergente: ${entry.id}`);
    decrypted += 1;
    const otherClinic = entry.clinicId.endsWith("alpha") ? "dr-rehearsal-clinic-beta" : "dr-rehearsal-clinic-alpha";
    const checks = [
      () => decryptClinicalJson(env, otherClinic, entry.purpose, row.c),
      () => decryptClinicalJson(env, entry.clinicId, `${entry.purpose}-x`, row.c),
      () => decryptClinicalJson(rehearsalEnv(other), entry.clinicId, entry.purpose, row.c),
    ];
    for (const check of checks) {
      if (!(await rejects(check))) throw new Error(`Cifra aceitou contexto errado: ${entry.id}`);
      negativeChecks += 1;
    }
  }
  return { decrypted, negativeChecks };
}

async function main() {
  const [command, manifestPath] = process.argv.slice(2);
  if (command === "readback-sql") { process.stdout.write(READBACK_SQL); return; }
  if (!manifestPath || (command !== "fixture" && command !== "verify")) {
    throw new Error("Uso: real-ciphertext.mts fixture|verify <manifest.json> | readback-sql");
  }
  const secret = readRehearsalKey();
  if (command === "fixture") {
    const { sql, manifest } = await buildFixture(secret);
    writeFileSync(manifestPath, JSON.stringify(manifest), { mode: 0o600 });
    process.stdout.write(sql);
    return;
  }
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as ManifestEntry[];
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
  const result = await verifyRows(secret, manifest, rowsFromWranglerJson(Buffer.concat(chunks).toString("utf8")));
  console.log(`decifrados=${result.decrypted} recusas_de_contexto_errado=${result.negativeChecks}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Falha no ensaio de cifra real.");
    process.exit(1);
  });
}
