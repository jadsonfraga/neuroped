import { createHash } from "node:crypto";
import { readFileSync, lstatSync } from "node:fs";
import { join } from "node:path";

const manifestPath = "client/public/recognition-v2/manifest.json";

/**
 * A digest is not an authentication credential. Exempt only checksum fields
 * proven against an existing local illustration; scan every other byte normally.
 * An invalid manifest throws and the caller must fail closed.
 */
export function verifiedVisualDigestSource(relativePath, source, root) {
  if (relativePath !== manifestPath) return source;
  const manifest = JSON.parse(source);
  if (!Array.isArray(manifest.items) || manifest.items.length === 0) {
    throw new Error("Manifesto visual sem inventário verificável.");
  }
  const ids = new Set();
  const verified = new Set();
  for (const item of manifest.items) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.id) || ids.has(item.id) ||
        !/^[a-f0-9]{64}$/.test(item.sha256)) {
      throw new Error("ID ou checksum inválido no manifesto visual.");
    }
    ids.add(item.id);
    const file = join(root, "client/public/recognition-v2", `${item.id}.svg`);
    if (!lstatSync(file).isFile() || lstatSync(file).isSymbolicLink()) {
      throw new Error("Ativo visual deve ser arquivo regular local.");
    }
    const bytes = readFileSync(file);
    if (!bytes.toString("utf8").includes("<svg") ||
        createHash("sha256").update(bytes).digest("hex") !== item.sha256) {
      throw new Error(`Checksum não corresponde ao ativo visual: ${item.id}`);
    }
    verified.add(item.sha256);
  }
  let masked = 0;
  const safeSource = source.replace(/("sha256"\s*:\s*")([a-f0-9]{64})(")/g,
    (match, before, digest, after) => {
      if (!verified.has(digest)) throw new Error("Checksum não verificado no manifesto.");
      masked++;
      return `${before}VERIFIED_LOCAL_VISUAL_ASSET_DIGEST${after}`;
    });
  if (masked !== manifest.items.length) {
    throw new Error("Campos duplicados ou estrutura inesperada no manifesto visual.");
  }
  return safeSource;
}
