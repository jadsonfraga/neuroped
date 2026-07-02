// ============================================================
// Fluxograma Clínico Inteligente — matriz idade × queixa × respondente ×
// finalidade sobre o catálogo. Cada célula aponta a escala de 1ª linha (Ouro)
// e uma alternativa (Prata). Conteúdo autoral (Dr. Jadson Fraga / NeuroPed).
// `id` referencia uma escala do app (link só é criado quando ela é
// preenchível); rótulos sem `id` aparecem como referência, sem link morto.
// ============================================================

export interface FluxoPick {
  label: string;
  id?: string;   // id da escala no app (para link), quando existe versão preenchível
  sub?: string;  // detalhe curto (respondente, uso, condição)
}

export interface FluxoCell {
  emoji: string;
  queixa: string;
  ouro: FluxoPick;
  prata?: FluxoPick[];
}

export interface FluxoBand {
  id: string;
  ageLabel: string;
  stage: string;
  emoji: string;
  cells: FluxoCell[];
}

export interface FluxoNode {
  emoji: string;
  title: string;
  intro: string;
  tone: "safety" | "motor";
  picks: FluxoPick[];
}

export const fluxoMasterRule =
  "Percorra sempre 4 nós → 1) a idade define a coluna · 2) a queixa define a linha · 3) o respondente desempata (pais / criança / professor / clínico) · 4) a finalidade: para monitorização, troque a escala inicial pela versão Follow-up da mesma família (Vanderbilt Initial→Follow-up; SCARED / RCADS / YGTSS seriados).";

export const fluxoBands: FluxoBand[] = [
  {
    id: "lactente", ageLabel: "0–12 meses", stage: "Lactente", emoji: "👶",
    cells: [
      { emoji: "👶", queixa: "Desenvolvimento", ouro: { label: "SWYC Milestones", id: "world-swyc-milestones", sub: "pais" } },
      { emoji: "😴", queixa: "Sono", ouro: { label: "BISQ", id: "bisq", sub: "pais · 0–3a" } },
      { emoji: "🤕", queixa: "Dor", ouro: { label: "FLACC / COMFORT-B", id: "flacc", sub: "clínico" } },
    ],
  },
  {
    id: "toddler", ageLabel: "1–2 anos", stage: "Toddler", emoji: "🧸",
    cells: [
      { emoji: "🧩", queixa: "TEA", ouro: { label: "M-CHAT-R", id: "mchat", sub: "rastreio · pais" }, prata: [{ label: "M-CHAT-R/F", id: "mchat", sub: "se + → entrevista" }] },
      { emoji: "👶", queixa: "Desenvolvimento", ouro: { label: "SWYC-POSI", sub: "social · pais" } },
      { emoji: "🔥", queixa: "Comportamento", ouro: { label: "SDQ (pais)", id: "sdq", sub: "pais" } },
      { emoji: "😴", queixa: "Sono", ouro: { label: "PSQ-SRBD", id: "world-psq-srbd", sub: "pais" } },
    ],
  },
  {
    id: "pre-escolar", ageLabel: "2–4 anos", stage: "Pré-escolar", emoji: "🧒",
    cells: [
      { emoji: "🧩", queixa: "TEA", ouro: { label: "M-CHAT-R/F", id: "mchat", sub: "pais + entrevista" } },
      { emoji: "🔥", queixa: "Comportamento", ouro: { label: "PSC-35", id: "psc17", sub: "pais" }, prata: [{ label: "SDQ (professor)", id: "sdq", sub: "creche" }] },
      { emoji: "😰", queixa: "Ansiedade", ouro: { label: "PAS", sub: "pré-escolar · pais" } },
      { emoji: "🛡️", queixa: "Trauma", ouro: { label: "CATS (cuidador)", id: "cats", sub: "cuidador" } },
    ],
  },
  {
    id: "pre-escolar-plus", ageLabel: "4–6 anos", stage: "Pré-escolar +", emoji: "🎨",
    cells: [
      { emoji: "⚡", queixa: "TDAH", ouro: { label: "Vanderbilt (pais)", id: "vanderbilt", sub: "pais" }, prata: [{ label: "Vanderbilt (professor)", id: "vanderbilt", sub: "escola" }, { label: "SNAP-IV", id: "snap", sub: "dimensional" }] },
      { emoji: "🧩", queixa: "TEA", ouro: { label: "ASSQ", id: "assq", sub: "pais / professor" } },
      { emoji: "🔥", queixa: "Comportamento", ouro: { label: "PSC-35 / SDQ", id: "sdq", sub: "pais + professor" } },
      { emoji: "🧠", queixa: "Função global", ouro: { label: "CGAS", sub: "clínico" } },
    ],
  },
  {
    id: "escolar", ageLabel: "6–12 anos", stage: "Escolar", emoji: "🎒",
    cells: [
      { emoji: "⚡", queixa: "TDAH", ouro: { label: "Vanderbilt (pais/escola)", id: "vanderbilt", sub: "pais · escola" }, prata: [{ label: "SNAP-IV", id: "snap", sub: "dimensional" }, { label: "WFIRS-P", id: "world-wfirs-p", sub: "impacto funcional" }] },
      { emoji: "😰", queixa: "Ansiedade", ouro: { label: "SCARED / SCAS", id: "scared", sub: "criança" }, prata: [{ label: "RCADS", id: "rcads", sub: "ansiedade + humor" }] },
      { emoji: "🛡️", queixa: "Trauma", ouro: { label: "CATS (jovem/cuidador)", id: "cats", sub: "conforme respondente" } },
      { emoji: "✨", queixa: "Tiques", ouro: { label: "YGTSS", id: "ygtss", sub: "clínico" } },
    ],
  },
  {
    id: "adolescente", ageLabel: "12–18 anos", stage: "Adolescente", emoji: "🧑",
    cells: [
      { emoji: "☁️", queixa: "Depressão", ouro: { label: "PHQ-A", id: "phqa", sub: "autorrelato" } },
      { emoji: "😰", queixa: "Ansiedade", ouro: { label: "SCARED / RCADS", id: "scared", sub: "autorrelato" } },
      { emoji: "⚡", queixa: "TDAH", ouro: { label: "SNAP-IV", id: "snap", sub: "autorrelato + impacto" }, prata: [{ label: "WFIRS-S", id: "world-wfirs-p", sub: "impacto funcional" }] },
      { emoji: "🍷", queixa: "Substâncias", ouro: { label: "CRAFFT 2.1", id: "crafft", sub: "autorrelato" } },
      { emoji: "🍴", queixa: "Alimentação", ouro: { label: "SCOFF", id: "scoff", sub: "autorrelato" }, prata: [{ label: "EAT-26", id: "world-eat26", sub: "autorrelato" }] },
    ],
  },
];

export const fluxoSafetyNode: FluxoNode = {
  emoji: "🆘", tone: "safety",
  title: "Nó de Segurança — roda em PARALELO a qualquer queixa",
  intro: "Qualquer menção a ideação suicida ou autolesão interrompe o fluxo normal e salta direto para o rastreio de risco.",
  picks: [
    { label: "C-SSRS Screener", id: "cssrs", sub: "6–99a · paciente/clínico" },
    { label: "ASQ", id: "asq-suicide", sub: "8–24a · paciente" },
    { label: "SAFE-T + C-SSRS", id: "cssrs", sub: "≥10a · manejo" },
  ],
};

export const fluxoMotorNode: FluxoNode = {
  emoji: "🚶", tone: "motor",
  title: "Nó Motor / PC — roda em PARALELO em qualquer idade",
  intro: "Suspeita motora / paralisia cerebral usa classificação funcional independente da idade, complementada por escala de dor quando há procedimento.",
  picks: [
    { label: "GMFCS", id: "gmfcs", sub: "0–18a · classificação" },
    { label: "FLACC", id: "flacc", sub: "0–7a · dor observacional" },
    { label: "COMFORT-B", id: "comfort-b", sub: "0–18a · dor / sedação" },
  ],
};
