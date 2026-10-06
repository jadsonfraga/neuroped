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
  {
    ghsa: "GHSA-vfj7-8cjw-p6xm",
    packageName: "braces",
    reason: "DoS por padroes aninhados (CWE-674, CVSS 7.5, impacto apenas em disponibilidade); sem versao corrigida upstream (<=3.0.3 e a ultima publicada). Chega ao projeto apenas via cadeia de build do tailwindcss/chokidar/fast-glob/micromatch, sem exposicao em runtime no browser. Re-check: remover a excecao assim que sair release corrigida do braces",
    expiresOn: "2026-11-04",
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
const isBlockingSeverity = (severity) => severity === "high" || severity === "critical";

const isCovered = (name, vulnerability) =>
  vulnerability.via.every((via) => {
    const ghsa = ghsaOf(via);
    if (ghsa && isAllowed(name, ghsa)) return true;
    const dependency = directNameOf(via);
    if (!dependency) return false;
    const parent = report.vulnerabilities?.[dependency];
    if (!parent) return false;
    if (!isBlockingSeverity(parent.severity)) return true;
    return isCovered(dependency, parent);
  });

const offenders = Object.entries(report.vulnerabilities ?? {}).filter(
  ([name, vulnerability]) =>
    (vulnerability.severity === "high" || vulnerability.severity === "critical") &&
    !isCovered(name, vulnerability),
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

const moderates = Object.entries(report.vulnerabilities ?? {}).filter(
  ([, vulnerability]) => vulnerability.severity === "moderate" || vulnerability.severity === "low",
);
for (const [name] of moderates) {
  console.log(`  aviso: ${name} tem severidade abaixo de high; nao bloqueia (contrato high/critical).`);
}

console.log("npm audit: nenhuma vulnerabilidade high/critical fora da allowlist ativa.");
for (const entry of exceptions) {
  console.log(`  excecao ativa: ${entry.packageName} (${entry.ghsa}) — valida ate ${entry.expiresOn}. ${entry.reason}`);
}
process.exit(0);
