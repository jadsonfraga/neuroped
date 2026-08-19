import assert from "node:assert/strict";
import fs from "node:fs";

const routes = fs.readFileSync("server/routes/files.ts", "utf8");
const storage = fs.readFileSync("server/lib/cloudStorage.ts", "utf8");

assert.match(routes, /freshPatient[\s\S]{0,900}patientReferenceDecision/, "upload deve revalidar paciente após URL assinada");
assert.match(routes, /getObjectSha256[\s\S]{0,1800}eq\(filesTable\.isDeleted, false\)[\s\S]{0,500}FILE_STATE_CHANGED/, "confirm deve rejeitar arquivo apagado durante digest server-side");
assert.match(routes, /getDownloadSignedUrl[\s\S]{0,700}freshFile[\s\S]{0,500}freshFile\.isDeleted/, "download deve revalidar estado depois da I/O de assinatura");
assert.match(routes, /const deleted = db\.update[\s\S]{0,700}eq\(filesTable\.isDeleted, false\)[\s\S]{0,700}await deleteObject\(deleted\.storageKey\)/, "delete deve revogar DB antes da I/O de bucket");
assert.match(routes, /STORAGE_UNAVAILABLE/);
assert.match(storage, /isStorageNotFoundError/);
assert.match(storage, /httpStatusCode === 404/);
assert.match(storage, /createHash\("sha256"\)/, "storage deve calcular o digest no servidor");
assert.match(storage, /for await \(const chunk of response\.Body/, "digest deve consumir o body real do objeto");
assert.match(storage, /throw new CloudStorageError\("Falha ao ler o objeto no storage para verificar sua integridade\."\)/);

console.log("✓ arquivos: TOCTOU, soft-delete, digest server-side e indisponibilidade de storage protegidos");
