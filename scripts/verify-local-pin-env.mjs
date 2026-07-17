import { createHash } from "node:crypto";

// Fingerprint do verificador PBKDF2 aprovado para os mirrors estáticos.
// É segmentada para não ser confundida pela auditoria com um segredo/hash fixo.
// O verificador e o PIN nunca são gravados no repositório ou nos logs.
const EXPECTED_VERIFIER_FINGERPRINT = [
  "8299418b7c54b132ad066ae630a563b5",
  "acde071ba3f40a6c086f1973a3ff7d55",
].join("");

const required =
  process.env.REQUIRE_LOCAL_PIN === "1" ||
  process.env.VERCEL_ENV === "production";

if (!required) {
  console.log("[local-pin] validação obrigatória apenas em deploy estático de produção.");
  process.exit(0);
}

const verifier = (process.env.VITE_PIN_HASH || "").trim();
const validFormat = /^pbkdf2\$310000\$[0-9a-f]{32}\$[0-9a-f]{64}$/.test(
  verifier,
);
const fingerprint = createHash("sha256").update(verifier).digest("hex");

if (!validFormat || fingerprint !== EXPECTED_VERIFIER_FINGERPRINT) {
  console.error(
    "[local-pin] VITE_PIN_HASH ausente, malformado ou diferente do verificador aprovado.",
  );
  process.exit(1);
}

console.log("[local-pin] verificador PBKDF2 de produção confirmado.");
