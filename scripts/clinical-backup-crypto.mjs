import fs from "node:fs";
import crypto from "node:crypto";

const [mode, inputPath, outputPath] = process.argv.slice(2);
const material = process.env.MIGRATION_BACKUP_KEY_MATERIAL?.trim() ?? "";
if (!mode || !inputPath || !outputPath) throw new Error("Uso: node clinical-backup-crypto.mjs <encrypt|decrypt> <input> <output>");
if (material.length < 32) throw new Error("MIGRATION_BACKUP_KEY_MATERIAL deve ter ao menos 32 caracteres.");

const key = crypto.createHash("sha256").update(`neuroped:clinical:migration-backup:v1:${material}`).digest();

if (mode === "encrypt") {
  const plaintext = fs.readFileSync(inputPath);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  const payload = {
    version: "backup-c1",
    sha256: crypto.createHash("sha256").update(plaintext).digest("hex"),
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    ciphertext: encrypted.toString("base64"),
  };
  fs.writeFileSync(outputPath, JSON.stringify(payload));
  console.log(payload.sha256);
} else if (mode === "decrypt") {
  const payload = JSON.parse(fs.readFileSync(inputPath, "utf8"));
  if (payload.version !== "backup-c1") throw new Error("BACKUP_VERSION_INVALID");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(payload.iv, "base64"));
  decipher.setAuthTag(Buffer.from(payload.tag, "base64"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(payload.ciphertext, "base64")),
    decipher.final(),
  ]);
  const sha256 = crypto.createHash("sha256").update(plaintext).digest("hex");
  if (sha256 !== payload.sha256) throw new Error("BACKUP_SHA256_MISMATCH");
  fs.writeFileSync(outputPath, plaintext);
  console.log(sha256);
} else {
  throw new Error(`Modo inválido: ${mode}`);
}
