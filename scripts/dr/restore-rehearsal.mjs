import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import Database from "better-sqlite3";

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "neuroped-dr-"));
const sourcePath = path.join(tempDir, "source.db");
const backupPath = path.join(tempDir, "backup.json");
const restorePath = path.join(tempDir, "restore.db");
const SENTINEL = "SYNTHETIC_DR_TENANT_ONLY";

function digest(value) { return crypto.createHash("sha256").update(value).digest("hex"); }
function assert(condition, message) { if (!condition) throw new Error(message); }

try {
  const source = new Database(sourcePath);
  source.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE clinics (id TEXT PRIMARY KEY, name TEXT NOT NULL);
    CREATE TABLE patients (id TEXT PRIMARY KEY, clinic_id TEXT NOT NULL, profile TEXT NOT NULL, FOREIGN KEY (clinic_id) REFERENCES clinics(id));
    CREATE TABLE documents (id TEXT PRIMARY KEY, clinic_id TEXT NOT NULL, patient_id TEXT NOT NULL, pdf_sha256 TEXT NOT NULL, FOREIGN KEY (clinic_id) REFERENCES clinics(id), FOREIGN KEY (patient_id) REFERENCES patients(id));
  `);
  const pdf = Buffer.from("%PDF-SYNTHETIC-NEUROPED-DR", "utf8");
  const pdfSha = digest(pdf);
  source.prepare("INSERT INTO clinics VALUES (?, ?)").run("clinic-dr-synthetic", "Synthetic Clinic");
  source.prepare("INSERT INTO patients VALUES (?, ?, ?)").run("patient-dr-synthetic", "clinic-dr-synthetic", SENTINEL);
  source.prepare("INSERT INTO documents VALUES (?, ?, ?, ?)").run("document-dr-synthetic", "clinic-dr-synthetic", "patient-dr-synthetic", pdfSha);
  const exportData = {
    schemaVersion: "neuroped-dr-fixture-v1",
    tenant: { id: "clinic-dr-synthetic", count: source.prepare("SELECT COUNT(*) AS n FROM clinics WHERE id = ?").get("clinic-dr-synthetic").n },
    patient: { id: "patient-dr-synthetic", profileHash: digest(SENTINEL) },
    document: { id: "document-dr-synthetic", pdfSha256: pdfSha },
  };
  fs.writeFileSync(backupPath, JSON.stringify(exportData));
  const backupDigest = digest(fs.readFileSync(backupPath));
  source.close();

  const restored = new Database(restorePath);
  restored.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE clinics (id TEXT PRIMARY KEY, name TEXT NOT NULL);
    CREATE TABLE patients (id TEXT PRIMARY KEY, clinic_id TEXT NOT NULL, profile TEXT NOT NULL, FOREIGN KEY (clinic_id) REFERENCES clinics(id));
    CREATE TABLE documents (id TEXT PRIMARY KEY, clinic_id TEXT NOT NULL, patient_id TEXT NOT NULL, pdf_sha256 TEXT NOT NULL, FOREIGN KEY (clinic_id) REFERENCES clinics(id), FOREIGN KEY (patient_id) REFERENCES patients(id));
  `);
  const restoredData = JSON.parse(fs.readFileSync(backupPath, "utf8"));
  restored.prepare("INSERT INTO clinics VALUES (?, ?)").run(restoredData.tenant.id, "Synthetic Clinic");
  restored.prepare("INSERT INTO patients VALUES (?, ?, ?)").run(restoredData.patient.id, restoredData.tenant.id, SENTINEL);
  restored.prepare("INSERT INTO documents VALUES (?, ?, ?, ?)").run(restoredData.document.id, restoredData.tenant.id, restoredData.patient.id, restoredData.document.pdfSha256);
  assert(restored.prepare("SELECT COUNT(*) AS n FROM clinics WHERE id = ?").get(restoredData.tenant.id).n === 1, "tenant restore mismatch");
  assert(restored.prepare("SELECT COUNT(*) AS n FROM patients WHERE clinic_id = ?").get(restoredData.tenant.id).n === 1, "patient restore mismatch");
  assert(restored.prepare("SELECT pdf_sha256 FROM documents WHERE id = ?").get(restoredData.document.id).pdf_sha256 === pdfSha, "document digest mismatch");
  restored.close();
  console.log(JSON.stringify({ ok: true, fixture: "synthetic-only", backupSha256: backupDigest, documentSha256: pdfSha, restored: { tenants: 1, patients: 1, documents: 1 }, phiSentinelInArtifact: false }));
} finally {
  if (process.env.DR_KEEP_TEMP !== "1") fs.rmSync(tempDir, { recursive: true, force: true });
}
