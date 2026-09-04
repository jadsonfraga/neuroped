import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// Anti-regressão multi-tenant: os emissores de documentos clínicos usam a
// fonte única client/src/lib/issuer.ts. Nenhum arquivo emissor pode voltar a
// carregar identidade profissional hardcoded (nome, CRM, emails pessoais).

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

const issuerFiles = [
  "client/src/pages/receita-c1.tsx",
  "client/src/pages/receita-c1-express.tsx",
  "client/src/pages/laudo-super.tsx",
  "client/src/pages/laudo-neuroped.tsx",
  "client/src/pages/prontuario.tsx",
  "client/src/pages/fichas-registro.tsx",
  "client/src/pages/plano-terapeutico.tsx",
  "client/src/pages/paciente-detalhe.tsx",
  "client/src/components/ClinicalReport.tsx",
  "client/src/lib/documentPdf.ts",
  "client/src/lib/filterExport.ts",
  "client/src/lib/laudo/modeloSuper.ts",
  "client/src/lib/laudo/laudoPrompt.ts",
];

const forbiddenIdentity = [
  "CRM-PE 25227",
  "drjadsonfraga@proton.me",
  "jadsonfraga@hotmail.com",
  "Dr. Jadson Fraga",
];

for (const path of issuerFiles) {
  const text = read(path);
  for (const needle of forbiddenIdentity) {
    assert.ok(
      !text.includes(needle),
      `Identidade pessoal hardcoded regrediu em ${path}: "${needle}" — use client/src/lib/issuer.ts`
    );
  }
}

// Os emissores principais precisam continuar plugados na fonte única.
for (const path of [
  "client/src/pages/receita-c1.tsx",
  "client/src/pages/laudo-super.tsx",
  "client/src/pages/laudo-neuroped.tsx",
  "client/src/pages/prontuario.tsx",
]) {
  assert.match(
    read(path),
    /@\/lib\/issuer/,
    `${path} deve importar a identidade do emissor de "@/lib/issuer"`
  );
}

// Sem credencial configurada, o documento declara a ausência — nunca inventa.
const issuer = read("client/src/lib/issuer.ts");
assert.match(
  issuer,
  /UNCONFIGURED_CREDENTIALS_NOTICE/,
  "issuer.ts deve expor UNCONFIGURED_CREDENTIALS_NOTICE para credenciais não configuradas"
);

console.log("[tenant-issuer] ✓ Emissores de documentos usam a fonte única de identidade (issuer.ts); nenhuma identidade pessoal hardcoded restante.");
