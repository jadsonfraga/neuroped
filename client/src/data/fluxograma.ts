// ============================================================
// Fluxograma Clínico Inteligente — matriz idade × queixa × respondente ×
// finalidade sobre o catálogo. Cada célula aponta a escala de 1ª linha (Ouro)
// e uma alternativa (Prata). Conteúdo autoral (Dr. Jadson Fraga / NeuroPed).
// `id` referencia uma escala do app (link só é criado quando ela é
// preenchível); `queixaId` + `ageBandId` pré-preenchem o Filtro Clínico.
// ============================================================

export interface FluxoPick {
  label: string;
  id?: string;   // id da escala no app (para link), quando existe versão preenchível
  sub?: string;  // detalhe curto (respondente, uso, condição)
}

export interface FluxoCell {
  emoji: string;
  queixa: string;
  queixaId?: string; // id da queixa no Filtro (para pré-preencher); ausente = sem mapeamento direto
  ouro: FluxoPick;
  prata?: FluxoPick[];
}

export interface FluxoBand {
  id: string;
  ageLabel: string;
  stage: string;
  emoji: string;
  ageBandId: string; // id da faixa etária no Filtro (faixasEtarias)
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
  "Percorra sempre 4 nós → 1) a idade define a coluna · 2) a queixa define a linha · 3) o respondente desempata (pais / criança / professor / clínico) · 4) a finalidade: para monitorização, troque a escala inicial pela versão Follow-up da mesma família (o mesmo instrumento reaplicado no mesmo intervalo; RCADS / YGTSS seriados).";

export const fluxoBands: FluxoBand[] = [
  {
    id: "lactente", ageLabel: "0–12 meses", stage: "Lactente", emoji: "👶", ageBandId: "6-12m",
    cells: [
      { emoji: "👶", queixa: "Desenvolvimento", queixaId: "atraso", ouro: { label: "SWYC Milestones", id: "world-swyc-milestones", sub: "pais" } },
      { emoji: "😴", queixa: "Sono", queixaId: "sono", ouro: { label: "BISQ", id: "bisq", sub: "pais · 0–3a" } },
      { emoji: "🤕", queixa: "Dor", queixaId: "dor", ouro: { label: "FLACC / COMFORT-B", id: "flacc", sub: "clínico" } },
    ],
  },
  {
    id: "toddler", ageLabel: "1–2 anos", stage: "Toddler", emoji: "🧸", ageBandId: "1-2a",
    cells: [
      { emoji: "🧩", queixa: "TEA", queixaId: "tea", ouro: { label: "Sinais precoces (autoral)", id: "na-sinais-precoces-tea-pais", sub: "rastreio · pais" }, prata: [{ label: "Atenção conjunta precoce", id: "j26-009", sub: "clínico" }] },
      { emoji: "👶", queixa: "Desenvolvimento", queixaId: "atraso", ouro: { label: "SWYC-POSI", sub: "social · pais" } },
      { emoji: "🔥", queixa: "Comportamento", queixaId: "comportamento", ouro: { label: "SWYC PPSC", id: "swyc-ppsc", sub: "pais" } },
      { emoji: "😴", queixa: "Sono", queixaId: "sono", ouro: { label: "PSQ-SRBD", id: "world-psq-srbd", sub: "pais" } },
    ],
  },
  {
    id: "pre-escolar", ageLabel: "2–4 anos", stage: "Pré-escolar", emoji: "🧒", ageBandId: "2-4a",
    cells: [
      { emoji: "🧩", queixa: "TEA", queixaId: "tea", ouro: { label: "Sinais precoces (autoral)", id: "na-sinais-precoces-tea-pais", sub: "pais · até 3 anos" }, prata: [{ label: "Observação clínica (autoral)", id: "na-observacao-clinica-tea", sub: "clínico" }] },
      { emoji: "🔥", queixa: "Comportamento", queixaId: "comportamento", ouro: { label: "PSC-35", id: "psc17", sub: "pais" }, prata: [{ label: "SWYC PPSC", id: "swyc-ppsc", sub: "pais" }] },
      { emoji: "😰", queixa: "Ansiedade", queixaId: "ansiedade", ouro: { label: "PAS", sub: "pré-escolar · pais" } },
      { emoji: "🛡️", queixa: "Trauma", queixaId: "trauma", ouro: { label: "CATS (cuidador)", id: "cats", sub: "cuidador" } },
    ],
  },
  {
    id: "pre-escolar-plus", ageLabel: "4–6 anos", stage: "Pré-escolar +", emoji: "🎨", ageBandId: "4-6a",
    cells: [
      { emoji: "⚡", queixa: "TDAH", queixaId: "tdah", ouro: { label: "SWYC PPSC", id: "swyc-ppsc", sub: "pais · até 5 anos" }, prata: [{ label: "Funções executivas (autoral)", id: "na-funcoes-executivas-ampliado-pais", sub: "pais · a partir de 5 anos" }, { label: "SNAP-IV", id: "snap", sub: "dimensional" }] },
      { emoji: "🧩", queixa: "TEA", queixaId: "tea", ouro: { label: "ASSQ", id: "assq", sub: "pais / professor" } },
      { emoji: "🔥", queixa: "Comportamento", queixaId: "comportamento", ouro: { label: "Saúde emocional do pré-escolar (autoral)", id: "na-saude-mental-pre-escolar-pais", sub: "pais" } },
      { emoji: "🧠", queixa: "Função global", queixaId: "funcionalidade", ouro: { label: "CGAS", id: "cgas", sub: "clínico" } },
    ],
  },
  {
    id: "escolar", ageLabel: "6–12 anos", stage: "Escolar", emoji: "🎒", ageBandId: "6-12a",
    cells: [
      { emoji: "⚡", queixa: "TDAH", queixaId: "tdah", ouro: { label: "SNAP-IV", id: "snap", sub: "pais · escola" }, prata: [{ label: "Atenção, atividade e autocontrole (autoral)", id: "na-atencao-atividade-professor", sub: "escola" }, { label: "WFIRS-P", id: "world-wfirs-p", sub: "impacto funcional" }] },
      { emoji: "😰", queixa: "Ansiedade", queixaId: "ansiedade", ouro: { label: "Ansiedade — autorrelato (autoral)", id: "na-ansiedade-autorrelato", sub: "criança" }, prata: [{ label: "RCADS", id: "rcads", sub: "ansiedade + humor" }] },
      { emoji: "🛡️", queixa: "Trauma", queixaId: "trauma", ouro: { label: "CATS (jovem/cuidador)", id: "cats", sub: "conforme respondente" } },
      { emoji: "✨", queixa: "Tiques", queixaId: "tiques", ouro: { label: "YGTSS", id: "ygtss", sub: "clínico" } },
    ],
  },
  {
    id: "adolescente", ageLabel: "12–18 anos", stage: "Adolescente", emoji: "🧑", ageBandId: "12-18a",
    cells: [
      { emoji: "☁️", queixa: "Depressão", queixaId: "depressao", ouro: { label: "PHQ-A", id: "phqa", sub: "autorrelato" } },
      { emoji: "😰", queixa: "Ansiedade", queixaId: "ansiedade", ouro: { label: "Ansiedade — autorrelato (autoral)", id: "na-ansiedade-autorrelato", sub: "autorrelato" } },
      { emoji: "⚡", queixa: "TDAH", queixaId: "tdah", ouro: { label: "SNAP-IV", id: "snap", sub: "autorrelato + impacto" }, prata: [{ label: "WFIRS-S", id: "world-wfirs-p", sub: "impacto funcional" }] },
      { emoji: "🍷", queixa: "Substâncias", queixaId: "substancias", ouro: { label: "Uso de substâncias (autoral)", id: "na-uso-substancias-adolescente", sub: "autorrelato" } },
      { emoji: "🍴", queixa: "Alimentação", queixaId: "alimentacao", ouro: { label: "SCOFF", id: "scoff", sub: "autorrelato" }, prata: [{ label: "EAT-26", id: "world-eat26", sub: "autorrelato" }] },
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
