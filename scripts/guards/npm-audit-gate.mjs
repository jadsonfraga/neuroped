#!/usr/bin/env node
// Gate de auditoria de dependências com exceções rastreáveis.
//
// Roda `npm audit --json --audit-level=high` e falha por qualquer vulnerabilidade
// high/critical, EXCETO as listadas em ALLOWLIST — cada entrada precisa de:
//   - ghsa: id exato do advisory (o que aparece na URL do advisory)
//   - packageName: pacote afetado (a exceção nunca vale para outro pacote)
//   - reason: por que a exceção existe (exposição analisada)
//   - expiresOn: data de validade (AAAA-MM-DD); vencida, o gate volta a falhar
//
// GHSA-86w9-cpqp-85rv (node-forge <= 1.4.0, publicada em 2026-10-02) não tem
// versão corrigida upstream. Chega ao projeto apenas via @signpdf/signer-p12,
// que usa node-forge para decodificar PKCS#12 — não para verificar assinaturas
// RSA PKCS#1 v1.5, que é o vetor do advisory. Re-check: remover a exceção
// assim que existir release corrigida do node-forge.

import { execFileSync } from "node:child_process";

const ALLOWLIST = [
  {
    ghsa: "GHSA-86w9-cpqp-85rv",
    packageName: "node-forge",
    reason: "sem versao corrigida upstream; uso limitado a decodificar PKCS#12 em @signpdf/signer-p12, fora do vetor do advisory",
    expiresOn: "2026-11-02",
  },
  // GHSA-vfj7-8cjw-p6xm (braces <= 3.0.3, exaustao de pilha por padroes
  // aninhados). A correcao exige braces 4.x, indisponivel na cadeia do
  // tailwindcss 3.4 (micromatch@4.0.8 fixa braces ~3.0.2); `npm audit fix`
  // rebaixaria @tailwindcss/typography de major. Chega ao projeto apenas no
  // build do frontend (chokidar/fast-glob/micromatch do tailwindcss),
  // processando arquivos locais do repositorio — nunca entrada nao
  // confiavel em runtime. Re-check: remover quando tailwindcss 4.x ou
  // micromatch atualizado entrarem na cadeia, ou na expiracao.
  {
    ghsa: "GHSA-vfj7-8cjw-p6xm",
    packageName: "braces",
    reason: "build-time apenas via cadeia tailwindcss (chokidar/fast-glob/micromatch), sem entrada nao confiavel; sem versao 3.x corrigida disponivel",
    expiresOn: "2026-11-03",
  },
];

const today = new Date().toISOString().slice(0, 10);
const exceptions = ALLOWLIST.filter((entry) => entry.expiresOn >= today);

let raw = "";
try {
  raw = execFileSync("npm", ["audit", "--json", "--audit-level=high"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
} catch (error) {
  // npm audit sai com 1 quando encontra vulnerabilidades: o JSON vem no stdout.
  const stdout = String(error.stdout ?? "");
  if (stdout.trim()) {
    raw = stdout;
  } else {
    console.error("npm audit falhou antes de concluir a analise.");
    console.error(String(error.stderr ?? error.message));
    process.exit(1);
  }
}

let report;
try {
  report = JSON.parse(raw);
} catch {
  console.error("Saida do npm audit nao e um JSON valido.");
  process.exit(1);
}

const ghsaOf = (via) => {
  const advisory = typeof via === "object" ? via : null;
  if (!advisory) return null;
  const url = String(advisory.url ?? "");
  return url.split("/").pop() ?? null;
};

const isAllowed = (packageName, ghsa) =>
  exceptions.some((entry) => entry.ghsa === ghsa && entry.packageName === packageName);

const directNameOf = (via) => {
  const advisory = typeof via === "object" ? via : null;
  return advisory ? null : String(via);
};

// Um pacote é liberado apenas se TODAS as vias estiverem cobertas: advisory
// na allowlist ativa, ou herança transitiva de um pacote allowlistado
// (ex.: @signpdf/signer-p12 listado apenas porque depende de node-forge).
const isCovered = (name, vulnerability) =>
  vulnerability.via.every((via) => {
    const ghsa = ghsaOf(via);
    if (ghsa && isAllowed(name, ghsa)) return true;
    const dependency = directNameOf(via);
    if (!dependency) return false;
    const parent = report.vulnerabilities?.[dependency];
    return parent ? isCovered(dependency, parent) : false;
  });

const offenders = Object.entries(report.vulnerabilities ?? {}).filter(
  ([name, vulnerability]) => !isCovered(name, vulnerability),
);

for (const [name, vulnerability] of offenders) {
  console.error(`BLOQUEADO: ${name} — severidade ${vulnerability.severity}`);
  for (const via of vulnerability.via) {
    console.error(`  via: ${typeof via === "object" ? via.title ?? via.url : via}`);
  }
}

if (offenders.length > 0) {
  console.error(`${offenders.length} vulnerabilidade(s) high/critical fora da allowlist.`);
  process.exit(1);
}

console.log("npm audit: nenhuma vulnerabilidade high/critical fora da allowlist ativa.");
for (const entry of exceptions) {
  console.log(`  excecao ativa: ${entry.packageName} (${entry.ghsa}) — valida ate ${entry.expiresOn}. ${entry.reason}`);
}
process.exit(0);
