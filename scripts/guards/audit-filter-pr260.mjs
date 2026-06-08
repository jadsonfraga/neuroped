import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

const targets = {
  "filtro.tsx": join(root, "client/src/pages/filtro.tsx"),
  "index.css": join(root, "client/src/index.css"),
  "GOLDEN_RULE_FILTRO_PR260.md": join(root, "docs/GOLDEN_RULE_FILTRO_PR260.md"),
};

const requiredTokens = {
  "filtro.tsx": [
    "container-filtro",
    "filter-260-shell",
    "filter-260-grid",
    "filter-260-card",
    "filter-260-card-content",
    "filter-260-medalrow",
    "filter-260-medal",
    "filter-260-head",
    "filter-260-symbol",
    "filter-260-title",
    "filter-260-subtitle",
    "filter-260-evidence",
    "filter-260-why",
    "filter-260-source",
    "Ouro",
    "Prata",
    "Bronze",
    "Teste Direto",
    "Questionário Escolar",
    "selectedQueixas",
    "selectedAge",
    "hasSearch",
    "rankedPool",
  ],
  "index.css": [
    "REGRA DE OURO",
    ".container-filtro",
    ".filter-260-shell",
    ".filter-260-grid",
    ".filter-260-card",
    ".filter-260-card::before",
    ".filter-260-card.tier-ouro::before",
    ".filter-260-card.tier-prata::before",
    ".filter-260-card.tier-bronze::before",
    ".filter-260-medalrow",
    ".filter-260-medal",
    ".filter-260-head",
    ".filter-260-symbol",
    "object-fit: contain",
    "aspect-ratio: 1 / 1",
    "pointer-events: none",
  ],
  "GOLDEN_RULE_FILTRO_PR260.md": [
    "Regra de Ouro",
    "PR #260",
    "cards em coluna",
    "medalha em linha própria",
    "faixa de cor no topo",
    "sem cortes",
    "zoom inesperado",
    "overlay",
    "client/src/pages/filtro.tsx",
    "client/src/index.css",
    ".container-filtro",
    ".filter-260-shell",
    ".filter-260-grid",
    ".filter-260-card",
    ".filter-260-medalrow",
    ".filter-260-medal",
    ".filter-260-head",
    ".filter-260-symbol",
    ".filter-260-title",
    ".filter-260-subtitle",
    ".filter-260-evidence",
    ".filter-260-why",
    ".filter-260-source",
  ],
};

function readTarget(label) {
  try {
    return readFileSync(targets[label], "utf8");
  } catch (error) {
    console.error(`❌ Filtro PR260 não conseguiu ler arquivo obrigatório ${label}: ${error.message}`);
    process.exit(1);
  }
}

for (const [label, tokens] of Object.entries(requiredTokens)) {
  const source = readTarget(label);
  for (const token of tokens) {
    if (!source.includes(token)) {
      console.error(`❌ Filtro PR260 perdeu token obrigatório em ${label}: ${token}`);
      process.exit(1);
    }
  }
}

console.log("✅ Filtro PR260 aprovado: estética, hierarquia e forma de filtrar preservadas.");
