// ============================================================
// EXTRAÇÃO COMPLETA DE ESCALAS — NeuroPed (uso interno)
// Consolida TODAS as escalas do app em um único JSON estruturado.
// Inclui: catálogo mestre, itens interativos, escalas PANT,
//         questionários clássicos e baterias Dr. Jadson.
//
// Uso:
//   npx tsx scripts/extract-escalas-completas.mts
//
// Saída:
//   docs/escalas/escalas-completas.json
//   docs/escalas/ESCALAS_COMPLETAS_INTERNO.md
// ============================================================

import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

// ── Catálogo mestre (metadados de todas as escalas) ──────────────────────────
import { allScales } from "../client/src/data/scaleFilter.ts";

// ── Escalas PANT — régua 0-4, 5 macrodomínios ────────────────────────────────
import { pantScales, pantDomains, pantLevelLabels } from "../client/src/data/pantScales.ts";

// ── Itens interativos completos (questionários item a item) ───────────────────
import { interactiveScaleItems } from "../client/src/data/interactiveScaleItems.ts";
import { interactiveScales } from "../client/src/data/interactiveScales.ts";

// ── Questionários clássicos internacionais ────────────────────────────────────
import {
  mchatQuestions,
  mchatCriticalItems,
  mchatReversedItems,
  carsCategories,
  snapQuestions,
  snapLabels,
  denverMilestones,
} from "../client/src/data/scales.ts";

import {
  cdi2Questions,
  cdi2Labels,
  phqaQuestions,
  phqaLabels,
  cssrsQuestions,
  crafftPartA,
  crafftPartB,
  cbclDomains,
  cbclLabels,
  vanderbiltDomains,
} from "../client/src/data/expandedScales.ts";

import {
  sdqQuestions,
  sdqLabels,
  sdqSubscales,
  scaredQuestions,
  scaredLabels,
  scaredSubscales,
  connersQuestions,
  connersLabels,
  connersSubscales,
} from "../client/src/data/newScales.ts";

// ── Bateria Dr. Jadson ────────────────────────────────────────────────────────
import {
  emdiLabels,
  emdiDomains,
  eafLabels,
  eafDomains,
  pdaeLabels,
} from "../client/src/data/bateriaJadson.ts";

import {
  ecarsiLabels,
  ecarsiProtectiveLabels,
  ecarsiDomains,
  ediLabels,
  ediDomains,
} from "../client/src/data/bateriaJadsonPsiq.ts";

// ── Escalas de autismo estruturadas ──────────────────────────────────────────
import { autismScales } from "../client/src/data/autismScales.ts";

// ── Diretório de saída ────────────────────────────────────────────────────────
const OUT = resolve(process.cwd(), "docs/escalas");
mkdirSync(OUT, { recursive: true });

// ── Helper: remove campos de React (icon é um componente) ────────────────────
function serializeInteractive(record: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [key, def] of Object.entries(record)) {
    const { icon: _icon, gradient: _g, ...rest } = def as any;
    out[key] = rest;
  }
  return out;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. JSON COMPLETO
// ═══════════════════════════════════════════════════════════════════════════════

const jsonPayload = {
  _meta: {
    titulo: "NeuroPed — Extração Completa de Escalas (Uso Interno)",
    geradoEm: new Date().toISOString(),
    totalEscalasCatalogo: allScales.length,
    totalEscalasPANT: pantScales.length,
    totalInterativasCompletas: Object.keys(interactiveScaleItems).length + Object.keys(interactiveScales).length,
    aviso: "Material de uso interno para estudo clínico. Não distribuir comercialmente.",
  },

  // ── A. Catálogo mestre ───────────────────────────────────────────────────
  catalogoMestre: allScales,

  // ── B. PANT — 100 Escalas Passivas ──────────────────────────────────────
  pant: {
    dominios: pantDomains,
    niveisLabel: pantLevelLabels,
    escalas: pantScales,
  },

  // ── C. Itens interativos (questionários completos) ───────────────────────
  itensInterativos: {
    lote1: serializeInteractive(interactiveScaleItems as any),
    lote2: serializeInteractive(interactiveScales as any),
  },

  // ── D. Questionários clássicos internacionais ───────────────────────────
  questionariosClassicos: {
    mchatRF: {
      nome: "M-CHAT-R/F — Modified Checklist for Autism in Toddlers (16-30 meses)",
      questoes: mchatQuestions,
      itensCriticos: mchatCriticalItems,
      itensInvertidos: mchatReversedItems,
    },
    cars: {
      nome: "CARS — Childhood Autism Rating Scale",
      categorias: carsCategories,
    },
    snapIV: {
      nome: "SNAP-IV — Rating Scale for ADHD",
      questoes: snapQuestions,
      labels: snapLabels,
    },
    denver: {
      nome: "Escala de Denver II — Marcos do Desenvolvimento",
      marcos: denverMilestones,
    },
    cdi2: {
      nome: "CDI-2 — Children's Depression Inventory",
      questoes: cdi2Questions,
      labels: cdi2Labels,
    },
    phqA: {
      nome: "PHQ-A — Patient Health Questionnaire for Adolescents",
      questoes: phqaQuestions,
      labels: phqaLabels,
    },
    cssrs: {
      nome: "C-SSRS — Columbia Suicide Severity Rating Scale",
      questoes: cssrsQuestions,
    },
    crafft: {
      nome: "CRAFFT — Car/Relax/Alone/Forget/Friends/Trouble (triagem de substâncias)",
      parteA: crafftPartA,
      parteB: crafftPartB,
    },
    cbcl: {
      nome: "CBCL — Child Behavior Checklist",
      dominios: cbclDomains,
      labels: cbclLabels,
    },
    vanderbilt: {
      nome: "Vanderbilt Assessment Scale — TDAH",
      dominios: vanderbiltDomains,
    },
    sdq: {
      nome: "SDQ — Strengths and Difficulties Questionnaire",
      questoes: sdqQuestions,
      labels: sdqLabels,
      subscalas: sdqSubscales,
    },
    scared: {
      nome: "SCARED — Screen for Child Anxiety Related Disorders",
      questoes: scaredQuestions,
      labels: scaredLabels,
      subscalas: scaredSubscales,
    },
    conners: {
      nome: "Conners — Rating Scales for ADHD",
      questoes: connersQuestions,
      labels: connersLabels,
      subscalas: connersSubscales,
    },
  },

  // ── E. Bateria Dr. Jadson ────────────────────────────────────────────────
  bateriaJadson: {
    emdi: {
      nome: "EMDI — Escala de Marcos do Desenvolvimento Infantil",
      labels: emdiLabels,
      dominios: emdiDomains,
    },
    eaf: {
      nome: "EAF — Escala de Alerta e Funcionamento",
      labels: eafLabels,
      dominios: eafDomains,
    },
    pdae: {
      nome: "PDAE — Protocolo de Desenvolvimento e Aprendizagem Escolar",
      labels: pdaeLabels,
    },
    ecarsi: {
      nome: "ECARSI — Escala de Comportamento e Autorregulação",
      labels: ecarsiLabels,
      labelsProtetores: ecarsiProtectiveLabels,
      dominios: ecarsiDomains,
    },
    edi: {
      nome: "EDI — Escala de Desenvolvimento Infantil",
      labels: ediLabels,
      dominios: ediDomains,
    },
  },

  // ── F. Escalas de autismo estruturadas ──────────────────────────────────
  escalasTEA: autismScales,
};

const jsonStr = JSON.stringify(jsonPayload, null, 2);
writeFileSync(resolve(OUT, "escalas-completas.json"), jsonStr, "utf8");

// ═══════════════════════════════════════════════════════════════════════════════
// 2. MARKDOWN COMPLETO — legível para estudo
// ═══════════════════════════════════════════════════════════════════════════════

const md: string[] = [];

md.push("# NeuroPed — Escalas Completas (Uso Interno)");
md.push("");
md.push(`> **Gerado em:** ${new Date().toLocaleDateString("pt-BR", { dateStyle: "long" })}  `);
md.push(`> **Total de escalas no catálogo:** ${allScales.length}  `);
md.push(`> **Material de uso interno para estudo clínico. Não distribuir comercialmente.**`);
md.push("");
md.push("---");
md.push("");
md.push("## Índice");
md.push("");
md.push("1. [Catálogo Mestre (todas as escalas)](#1-catálogo-mestre)");
md.push("2. [PANT — 100 Escalas Passivas de Neurodesenvolvimento](#2-pant)");
md.push("3. [Questionários Clássicos Internacionais (itens completos)](#3-questionários-clássicos)");
md.push("4. [Bateria Dr. Jadson (itens completos)](#4-bateria-dr-jadson)");
md.push("5. [Escalas de TEA Estruturadas](#5-escalas-tea)");
md.push("6. [Escalas Interativas Completas (itens por domínio)](#6-escalas-interativas)");
md.push("");
md.push("---");
md.push("");

// ── Seção 1: Catálogo Mestre ──────────────────────────────────────────────────
md.push("## 1. Catálogo Mestre");
md.push("");
md.push(`**${allScales.length} escalas** organizadas por ID, com nome completo, faixa etária, queixas, respondente, prioridade e descrição.`);
md.push("");

// Agrupar por prefixo de id (j26, pant-v7, snk, promis, nih, etc.)
const byPrefix: Record<string, typeof allScales> = {};
for (const s of allScales) {
  const prefix = s.id.replace(/-\d+$/, "").replace(/-v\d+$/, "");
  if (!byPrefix[prefix]) byPrefix[prefix] = [];
  byPrefix[prefix].push(s);
}

// Tabela geral
md.push("| ID | Nome | Idade (meses) | Queixas | Respondente | Prioridade | Tempo |");
md.push("| --- | --- | :---: | --- | --- | --- | --- |");
for (const s of allScales) {
  const queixas = (s.queixas ?? []).join(", ");
  const resp = (s.respondente ?? []).join(", ");
  md.push(`| \`${s.id}\` | ${s.name} | ${s.ageMin ?? "?"}–${s.ageMax ?? "?"} | ${queixas} | ${resp} | ${s.prioridade ?? "—"} | ${s.tempo ?? "—"} |`);
}
md.push("");

// Fichas detalhadas por escala
md.push("### Fichas Detalhadas");
md.push("");
for (const s of allScales) {
  md.push(`#### ${s.id} — ${s.name}`);
  if (s.fullName && s.fullName !== s.name) md.push(`**Nome completo:** ${s.fullName}  `);
  md.push(`**Faixa etária:** ${s.ageMin ?? "?"}–${s.ageMax ?? "?"} meses  `);
  md.push(`**Queixas:** ${(s.queixas ?? []).join(", ") || "—"}  `);
  md.push(`**Respondente:** ${(s.respondente ?? []).join(", ") || "—"}  `);
  md.push(`**Prioridade:** ${s.prioridade ?? "—"}  |  **Tempo:** ${s.tempo ?? "—"}  `);
  if ((s as any).fonte) md.push(`**Fonte:** ${(s as any).fonte}  `);
  if ((s as any).licenca) md.push(`**Licença:** ${(s as any).licenca}  `);
  if ((s as any).tipo) md.push(`**Tipo:** ${(s as any).tipo}  `);
  if (s.description) {
    md.push(`**Descrição:** ${s.description}`);
  }
  md.push("");
}

md.push("---");
md.push("");

// ── Seção 2: PANT ─────────────────────────────────────────────────────────────
md.push("## 2. PANT — 100 Escalas Passivas de Neurodesenvolvimento");
md.push("");
md.push("**Régua 0–4:** Ausente → Espontâneo e Generalizado  ");
md.push("**5 Macrodomínios, 20 escalas cada.**");
md.push("");
md.push("### Níveis");
md.push("");
for (let i = 0; i < pantLevelLabels.length; i++) {
  md.push(`- **${i}** — ${pantLevelLabels[i]}`);
}
md.push("");

for (const dom of pantDomains) {
  const escalasDoMin = pantScales.filter(ps => ps.domain === dom.id);
  md.push(`### Macrodomínio ${dom.id}: ${dom.name} (${dom.short})`);
  md.push("");
  for (const ps of escalasDoMin) {
    md.push(`#### Escala PANT ${ps.number}: ${ps.name}`);
    if (ps.parentExample) {
      md.push(`**Exemplo para pais:** ${ps.parentExample}`);
      md.push("");
    }
    md.push("**Níveis:**");
    md.push("");
    for (const lv of ps.levels) {
      md.push(`- **${lv.level} — ${lv.label}:** ${lv.anchor}`);
      if (lv.phrase) md.push(`  > *"${lv.phrase}"*`);
    }
    md.push("");
  }
}

md.push("---");
md.push("");

// ── Seção 3: Questionários Clássicos ─────────────────────────────────────────
md.push("## 3. Questionários Clássicos Internacionais");
md.push("");

// M-CHAT-R/F
md.push("### M-CHAT-R/F — Modified Checklist for Autism in Toddlers");
md.push("**Faixa etária:** 16–30 meses | **Respondente:** pais");
md.push("");
md.push("**Itens críticos (índice 0-based):** " + mchatCriticalItems.join(", "));
md.push("**Itens invertidos (índice 0-based):** " + mchatReversedItems.join(", "));
md.push("");
mchatQuestions.forEach((q, i) => {
  const crit = mchatCriticalItems.includes(i) ? " ⭐ *crítico*" : "";
  const inv = mchatReversedItems.includes(i) ? " ↩ *invertido*" : "";
  md.push(`${i + 1}. ${q}${crit}${inv}`);
});
md.push("");

// CARS
md.push("### CARS — Childhood Autism Rating Scale");
md.push("");
for (const cat of carsCategories) {
  md.push(`#### Categoria: ${(cat as any).name ?? (cat as any).category ?? JSON.stringify(cat).slice(0, 60)}`);
  if ((cat as any).description) md.push((cat as any).description);
  if ((cat as any).options && Array.isArray((cat as any).options)) {
    md.push("**Opções de pontuação:**");
    for (const opt of (cat as any).options) {
      md.push(`- **${opt.score ?? opt.value ?? "?"}** — ${opt.description ?? opt.label ?? JSON.stringify(opt)}`);
    }
  }
  md.push("");
}

// SNAP-IV
md.push("### SNAP-IV — Rating Scale for ADHD");
md.push(`**Labels:** ${snapLabels.join(" | ")}`);
md.push("");
snapQuestions.forEach((q, i) => {
  md.push(`${i + 1}. ${q}`);
});
md.push("");

// Denver
md.push("### Denver II — Marcos do Desenvolvimento");
md.push("");
const denverAreas: Record<string, typeof denverMilestones> = {};
for (const m of denverMilestones) {
  if (!denverAreas[m.area]) denverAreas[m.area] = [];
  denverAreas[m.area].push(m);
}
for (const [area, items] of Object.entries(denverAreas)) {
  md.push(`#### Área: ${area}`);
  md.push("| Marco | Início (m) | 25% (m) | 50% (m) | 75% (m) | 90% (m) |");
  md.push("| --- | :---: | :---: | :---: | :---: | :---: |");
  for (const m of items) {
    md.push(`| ${m.task} | ${m.ageStart ?? "—"} | ${m.age25 ?? "—"} | ${m.age50 ?? "—"} | ${m.age75 ?? "—"} | ${m.age90 ?? "—"} |`);
  }
  md.push("");
}

// CDI-2
md.push("### CDI-2 — Children's Depression Inventory");
md.push(`**Labels:** ${cdi2Labels.join(" | ")}`);
md.push("");
cdi2Questions.forEach((q: any, i: number) => {
  if (typeof q === "string") {
    md.push(`${i + 1}. ${q}`);
  } else {
    md.push(`${i + 1}. ${JSON.stringify(q)}`);
  }
});
md.push("");

// PHQ-A
md.push("### PHQ-A — Patient Health Questionnaire for Adolescents");
md.push(`**Labels:** ${phqaLabels.join(" | ")}`);
md.push("");
phqaQuestions.forEach((q: any, i: number) => {
  md.push(`${i + 1}. ${typeof q === "string" ? q : JSON.stringify(q)}`);
});
md.push("");

// C-SSRS
md.push("### C-SSRS — Columbia Suicide Severity Rating Scale");
md.push("");
cssrsQuestions.forEach((q: any, i: number) => {
  md.push(`${i + 1}. ${typeof q === "string" ? q : JSON.stringify(q)}`);
});
md.push("");

// CRAFFT
md.push("### CRAFFT — Triagem de Uso de Substâncias");
md.push("**Parte A:**");
(crafftPartA as any[]).forEach((q: any, i: number) => {
  md.push(`${i + 1}. ${typeof q === "string" ? q : JSON.stringify(q)}`);
});
md.push("**Parte B:**");
(crafftPartB as any[]).forEach((q: any, i: number) => {
  md.push(`${i + 1}. ${typeof q === "string" ? q : JSON.stringify(q)}`);
});
md.push("");

// CBCL
md.push("### CBCL — Child Behavior Checklist");
md.push(`**Labels:** ${cbclLabels.join(" | ")}`);
md.push("");
for (const dom of cbclDomains as any[]) {
  md.push(`#### Domínio: ${dom.name ?? "—"}`);
  if (dom.items && Array.isArray(dom.items)) {
    dom.items.forEach((it: any, i: number) => {
      md.push(`${i + 1}. ${typeof it === "string" ? it : JSON.stringify(it)}`);
    });
  }
  md.push("");
}

// Vanderbilt
md.push("### Vanderbilt Assessment Scale — TDAH");
md.push("");
for (const dom of vanderbiltDomains as any[]) {
  md.push(`#### Domínio: ${dom.name ?? "—"}`);
  if (dom.items && Array.isArray(dom.items)) {
    dom.items.forEach((it: any, i: number) => {
      md.push(`${i + 1}. ${typeof it === "string" ? it : JSON.stringify(it)}`);
    });
  }
  md.push("");
}

// SDQ
md.push("### SDQ — Strengths and Difficulties Questionnaire");
md.push(`**Labels:** ${sdqLabels.join(" | ")}`);
md.push("");
sdqQuestions.forEach((q: any, i: number) => {
  md.push(`${i + 1}. ${typeof q === "string" ? q : JSON.stringify(q)}`);
});
md.push("");

// SCARED
md.push("### SCARED — Screen for Child Anxiety Related Disorders");
md.push(`**Labels:** ${scaredLabels.join(" | ")}`);
md.push("");
scaredQuestions.forEach((q: any, i: number) => {
  md.push(`${i + 1}. ${typeof q === "string" ? q : JSON.stringify(q)}`);
});
md.push("");

// Conners
md.push("### Conners Rating Scales — TDAH");
md.push(`**Labels:** ${connersLabels.join(" | ")}`);
md.push("");
connersQuestions.forEach((q: any, i: number) => {
  md.push(`${i + 1}. ${typeof q === "string" ? q : JSON.stringify(q)}`);
});
md.push("");

md.push("---");
md.push("");

// ── Seção 4: Bateria Dr. Jadson ───────────────────────────────────────────────
md.push("## 4. Bateria Dr. Jadson");
md.push("");

const renderDominios = (nome: string, labels: any[], dominios: any[]) => {
  md.push(`### ${nome}`);
  md.push(`**Labels:** ${(labels as string[]).join(" | ")}`);
  md.push("");
  for (const dom of dominios) {
    md.push(`#### Domínio: ${dom.name ?? "—"}`);
    if (dom.items && Array.isArray(dom.items)) {
      dom.items.forEach((it: any, i: number) => {
        md.push(`${i + 1}. ${typeof it === "string" ? it : it.text ?? JSON.stringify(it)}`);
      });
    }
    md.push("");
  }
};

renderDominios("EMDI — Escala de Marcos do Desenvolvimento Infantil", emdiLabels, emdiDomains);
renderDominios("EAF — Escala de Alerta e Funcionamento", eafLabels, eafDomains);

md.push("### PDAE — Protocolo de Desenvolvimento e Aprendizagem Escolar");
md.push(`**Labels:** ${(pdaeLabels as string[]).join(" | ")}`);
md.push("");

renderDominios("ECARSI — Escala de Comportamento e Autorregulação", ecarsiLabels, ecarsiDomains);
md.push(`**Labels protetores:** ${(ecarsiProtectiveLabels as string[]).join(" | ")}`);
md.push("");
renderDominios("EDI — Escala de Desenvolvimento Infantil", ediLabels, ediDomains);

md.push("---");
md.push("");

// ── Seção 5: Escalas TEA ──────────────────────────────────────────────────────
md.push("## 5. Escalas de TEA Estruturadas");
md.push("");
for (const s of autismScales as any[]) {
  md.push(`### ${s.name ?? s.id}`);
  if (s.fullName && s.fullName !== s.name) md.push(`**Nome completo:** ${s.fullName}`);
  if (s.description) md.push(s.description);
  if (s.domains && Array.isArray(s.domains)) {
    md.push("**Domínios:**");
    for (const d of s.domains) {
      md.push(`- ${typeof d === "string" ? d : d.name ?? JSON.stringify(d)}`);
    }
  }
  if (s.ageRange) md.push(`**Faixa etária:** ${s.ageRange}`);
  if (s.administration) md.push(`**Aplicação:** ${s.administration}`);
  if (s.time) md.push(`**Tempo:** ${s.time}`);
  if (s.scoring) md.push(`**Pontuação:** ${typeof s.scoring === "string" ? s.scoring : JSON.stringify(s.scoring)}`);
  md.push("");
}

md.push("---");
md.push("");

// ── Seção 6: Escalas Interativas ──────────────────────────────────────────────
md.push("## 6. Escalas Interativas Completas");
md.push("");
md.push("Questionários com itens, domínios, opções de resposta e faixas de corte — prontos para aplicação clínica.");
md.push("");

const allInteractive: Record<string, any> = {
  ...(interactiveScaleItems as any),
  ...(interactiveScales as any),
};

for (const [id, raw] of Object.entries(allInteractive)) {
  const def = raw as any;
  md.push(`### ${id}`);
  if (def.instruction) md.push(`**Instrução:** ${def.instruction}`);
  if (def.infoBox) md.push(`> ${def.infoBox}`);
  if (def.labels && Array.isArray(def.labels)) {
    md.push(`**Opções de resposta:** ${def.labels.map((l: string, i: number) => `${i}=${l}`).join("  |  ")}`);
  }
  if (def.optionPoints) {
    md.push(`**Pontuação por opção:** ${def.optionPoints.join(", ")}`);
  }
  if (def.scoreDirection) md.push(`**Direção do escore:** ${def.scoreDirection}`);
  if (def.totalLabel) md.push(`**Total:** ${def.totalLabel}`);
  md.push("");

  if (def.domains && Array.isArray(def.domains)) {
    for (const dom of def.domains) {
      if (def.domains.length > 1) md.push(`#### Domínio: ${dom.name}`);
      if (dom.items && Array.isArray(dom.items)) {
        dom.items.forEach((it: string, i: number) => {
          md.push(`${i + 1}. ${it}`);
        });
      }
      md.push("");
    }
  }

  if (def.bands && Array.isArray(def.bands)) {
    md.push(`**Faixas de interpretação** (${def.totalLabel ?? "escore total"}):`);
    md.push("");
    md.push("| ≥ % do máx. | Classificação | Cor | Descrição |");
    md.push("| ---: | --- | --- | --- |");
    for (const b of def.bands) {
      md.push(`| ${b.minPct}% | ${b.classification} | ${b.color} | ${b.description} |`);
    }
    md.push("");
  }
  md.push("---");
  md.push("");
}

// ── Gravar markdown ───────────────────────────────────────────────────────────
const mdStr = md.join("\n");
writeFileSync(resolve(OUT, "ESCALAS_COMPLETAS_INTERNO.md"), mdStr, "utf8");

// ── Resumo ────────────────────────────────────────────────────────────────────
const jsonKB = Math.round(jsonStr.length / 1024);
const mdKB = Math.round(mdStr.length / 1024);
console.log("✅ Extração concluída!");
console.log(`   📁 Saída: ${OUT}`);
console.log(`   📄 escalas-completas.json        — ${jsonKB} KB`);
console.log(`   📄 ESCALAS_COMPLETAS_INTERNO.md  — ${mdKB} KB`);
console.log(`   📊 Catálogo: ${allScales.length} escalas`);
console.log(`   📊 PANT: ${pantScales.length} escalas passivas`);
console.log(`   📊 Interativas: ${Object.keys(allInteractive).length} escalas com itens completos`);
console.log(`   📊 Clássicos: M-CHAT-R/F, CARS, SNAP-IV, Denver, CDI-2, PHQ-A, C-SSRS, CRAFFT, CBCL, Vanderbilt, SDQ, SCARED, Conners`);
console.log(`   📊 Bateria Jadson: EMDI, EAF, PDAE, ECARSI, EDI`);
