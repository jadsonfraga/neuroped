/**
 * Catálogo V1 do Cognitive Lab — 8 tarefas cognitivas cronometradas, todas
 * dirigidas por configuração (o runner é único; cada tarefa é dados + gerador
 * de ensaios determinístico por seed).
 *
 * Conteúdo autoral NeuroPed: paradigmas clássicos de literatura aberta
 * (Go/No-Go, CPT, Stroop, Flanker, Simon, N-back, TR simples/escolha) com
 * estímulos, textos e parâmetros próprios. Relatório sempre DESCRITIVO.
 */
import { shuffleWith } from "./stats";
import type { CognitiveTaskConfig, StimulusSpec, TrialSpec } from "./types";

const VALIDITY_DEFAULT = { minResponseRate: 0.6, maxAnticipationRate: 0.2, minPracticeAccuracy: 0.6 };

/** Gera lista com proporção fixa de um tipo, embaralhada. */
function mixed(count: number, proportion: number, make: (special: boolean) => TrialSpec, rng: () => number): TrialSpec[] {
  const nSpecial = Math.round(count * proportion);
  const list: TrialSpec[] = [];
  for (let i = 0; i < count; i++) list.push(make(i < nSpecial));
  return shuffleWith(list, rng);
}

// ---------------------------------------------------------------- Go/No-Go
const GO_STIM: StimulusSpec = { display: "🐶", ariaLabel: "cachorro" };
const NOGO_STIM: StimulusSpec = { display: "🐱", ariaLabel: "gato" };

const goNoGo: CognitiveTaskConfig = {
  id: "go-no-go",
  name: "Go/No-Go",
  fullName: "Go/No-Go NeuroPed — controle inibitório",
  emoji: "🐶",
  domain: "Controle inibitório e impulsividade",
  ageLabel: "5–17 anos",
  durationLabel: "≈4 min",
  description:
    "Aperte rápido quando aparecer o cachorro; segure a mão quando aparecer o gato. Mede velocidade, omissões e erros de inibição (comissões).",
  instructions:
    "Quando aparecer o CACHORRO 🐶, aperte o botão o mais rápido que conseguir. Quando aparecer o GATO 🐱, NÃO aperte nada — segure a mão!",
  tutorial: [
    { text: "Apareceu o cachorro? Aperte rápido!", stimulus: GO_STIM, demoResponse: "go" },
    { text: "Apareceu o gato? Não aperte — segure a mão.", stimulus: NOGO_STIM, demoResponse: null },
  ],
  responses: [{ id: "go", key: " ", label: "Apertar", emoji: "👆" }],
  fixationMs: 500,
  stimulusMs: 800,
  isiMs: [700, 1300],
  deadlineMs: 1200,
  practiceTrials: 8,
  blocks: 2,
  trialsPerBlock: 30,
  validity: VALIDITY_DEFAULT,
  makeTrials: (count, rng) =>
    mixed(count, 0.7, (isGo) =>
      isGo
        ? { stimulus: GO_STIM, correctResponse: "go", tags: ["alvo"] }
        : { stimulus: NOGO_STIM, correctResponse: null, tags: ["nogo"] },
    rng),
};

// ---------------------------------------------------------------- CPT-NP
const CPT_LETTERS = ["A", "B", "E", "H", "K", "M", "R", "T", "U"];
const cpt: CognitiveTaskConfig = {
  id: "cpt-np",
  name: "CPT-NP",
  fullName: "Teste de Desempenho Contínuo NeuroPed — atenção sustentada",
  emoji: "🎯",
  domain: "Atenção sustentada e seletiva",
  ageLabel: "6–17 anos",
  durationLabel: "≈6 min",
  description:
    "Letras aparecem uma a uma; aperte só quando vir a letra X. Blocos longos medem a queda de atenção ao longo do tempo (curva de fadiga).",
  instructions:
    "Vão aparecer letras, uma de cada vez. Aperte o botão SOMENTE quando aparecer a letra X. Para todas as outras letras, não aperte.",
  tutorial: [
    { text: "Apareceu X? Aperte rápido!", stimulus: { display: "X" }, demoResponse: "go" },
    { text: "Apareceu outra letra? Não aperte.", stimulus: { display: "M" }, demoResponse: null },
  ],
  responses: [{ id: "go", key: " ", label: "Apertar no X", emoji: "👆" }],
  fixationMs: 250,
  stimulusMs: 600,
  isiMs: [900, 1100],
  deadlineMs: 1100,
  practiceTrials: 10,
  blocks: 3,
  trialsPerBlock: 36,
  validity: { ...VALIDITY_DEFAULT, minResponseRate: 0.5 },
  makeTrials: (count, rng) =>
    mixed(count, 0.25, (isTarget) =>
      isTarget
        ? { stimulus: { display: "X" }, correctResponse: "go", tags: ["alvo"] }
        : {
            stimulus: { display: CPT_LETTERS[Math.floor(rng() * CPT_LETTERS.length)] },
            correctResponse: null,
            tags: ["nao-alvo"],
          },
    rng),
};

// ---------------------------------------------------------------- Stroop
const STROOP_COLORS = [
  { id: "vermelho", label: "VERMELHO", colorClass: "text-red-500" },
  { id: "azul", label: "AZUL", colorClass: "text-blue-500" },
  { id: "verde", label: "VERDE", colorClass: "text-emerald-500" },
  { id: "amarelo", label: "AMARELO", colorClass: "text-amber-500" },
];
const stroop: CognitiveTaskConfig = {
  id: "stroop-np",
  name: "Stroop-NP",
  fullName: "Tarefa de Interferência Cor–Palavra NeuroPed",
  emoji: "🌈",
  domain: "Controle inibitório e interferência",
  ageLabel: "7–17 anos (alfabetizados)",
  durationLabel: "≈5 min",
  description:
    "Responda a COR DA TINTA da palavra, ignorando o que está escrito. Compara ensaios congruentes × incongruentes (efeito de interferência).",
  instructions:
    "Aparece uma palavra colorida. Aperte o botão da COR DA TINTA — ignore o que está escrito! Ex.: a palavra AZUL pintada de vermelho → aperte VERMELHO.",
  tutorial: [
    { text: "AZUL escrito em azul → aperte AZUL (fácil!).", stimulus: { display: "AZUL", colorClass: "text-blue-500" }, demoResponse: "azul" },
    { text: "AZUL escrito em vermelho → a tinta é VERMELHA → aperte VERMELHO.", stimulus: { display: "AZUL", colorClass: "text-red-500" }, demoResponse: "vermelho" },
  ],
  responses: STROOP_COLORS.map((c) => ({ id: c.id, key: c.id[0], label: c.label, emoji: c.id === "vermelho" ? "🔴" : c.id === "azul" ? "🔵" : c.id === "verde" ? "🟢" : "🟡" })),
  fixationMs: 400,
  stimulusMs: 0,
  isiMs: [500, 900],
  deadlineMs: 3000,
  practiceTrials: 8,
  blocks: 2,
  trialsPerBlock: 24,
  validity: VALIDITY_DEFAULT,
  makeTrials: (count, rng) =>
    mixed(count, 0.5, (congruent) => {
      const word = STROOP_COLORS[Math.floor(rng() * STROOP_COLORS.length)];
      const ink = congruent
        ? word
        : shuffleWith(STROOP_COLORS.filter((c) => c.id !== word.id), rng)[0];
      return {
        stimulus: { display: word.label, colorClass: ink.colorClass, ariaLabel: `palavra ${word.label} na cor ${ink.id}` },
        correctResponse: ink.id,
        tags: [congruent ? "congruente" : "incongruente"],
      };
    }, rng),
};

// ---------------------------------------------------------------- Flanker
const flanker: CognitiveTaskConfig = {
  id: "flanker-np",
  name: "Flanker-NP",
  fullName: "Tarefa de Flanqueadores NeuroPed — atenção seletiva",
  emoji: "🐟",
  domain: "Atenção seletiva e resolução de conflito",
  ageLabel: "5–17 anos",
  durationLabel: "≈4 min",
  description:
    "Diga para onde aponta o PEIXE DO MEIO, ignorando os vizinhos. Congruente × incongruente mede o custo do conflito visual.",
  instructions:
    "Olhe só para o PEIXE DO MEIO do cardume. Se ele aponta para a esquerda, aperte ◀; para a direita, aperte ▶. Ignore os outros peixes!",
  tutorial: [
    { text: "Todos para a direita — o do meio também: aperte ▶.", stimulus: { display: "🐟🐟🐟🐟🐟" }, demoResponse: "direita" },
    { text: "Os vizinhos enganam! O do meio aponta para a ESQUERDA: aperte ◀.", stimulus: { display: "🐟🐟🐠🐟🐟", ariaLabel: "peixe do meio para a esquerda" }, demoResponse: "esquerda" },
  ],
  responses: [
    { id: "esquerda", key: "ArrowLeft", label: "Esquerda", emoji: "◀" },
    { id: "direita", key: "ArrowRight", label: "Direita", emoji: "▶" },
  ],
  fixationMs: 450,
  stimulusMs: 0,
  isiMs: [600, 1000],
  deadlineMs: 2500,
  practiceTrials: 8,
  blocks: 2,
  trialsPerBlock: 24,
  validity: VALIDITY_DEFAULT,
  makeTrials: (count, rng) =>
    mixed(count, 0.5, (congruent) => {
      const dir = rng() < 0.5 ? "esquerda" : "direita";
      const center = dir === "esquerda" ? "◀" : "▶";
      const flank = congruent ? center : dir === "esquerda" ? "▶" : "◀";
      return {
        stimulus: {
          display: `${flank}${flank}${center}${flank}${flank}`,
          ariaLabel: `seta central para ${dir}`,
        },
        correctResponse: dir,
        tags: [congruent ? "congruente" : "incongruente"],
      };
    }, rng),
};

// ---------------------------------------------------------------- Simon
const simon: CognitiveTaskConfig = {
  id: "simon-np",
  name: "Simon-NP",
  fullName: "Tarefa de Simon NeuroPed — conflito estímulo-resposta",
  emoji: "🎈",
  domain: "Controle de interferência espacial",
  ageLabel: "5–17 anos",
  durationLabel: "≈4 min",
  description:
    "Responda à COR do balão (vermelho = esquerda, azul = direita) ignorando o LADO em que ele aparece. Mede o efeito Simon (conflito espacial).",
  instructions:
    "Balão VERMELHO 🔴 → aperte o botão da ESQUERDA. Balão AZUL 🔵 → aperte o da DIREITA. Não importa o LADO da tela em que o balão aparecer!",
  tutorial: [
    { text: "Balão vermelho (mesmo aparecendo à direita!) → aperte ESQUERDA.", stimulus: { display: "🔴", position: "right" }, demoResponse: "esquerda" },
    { text: "Balão azul à esquerda → a cor manda: aperte DIREITA.", stimulus: { display: "🔵", position: "left" }, demoResponse: "direita" },
  ],
  responses: [
    { id: "esquerda", key: "ArrowLeft", label: "Vermelho", emoji: "🔴" },
    { id: "direita", key: "ArrowRight", label: "Azul", emoji: "🔵" },
  ],
  fixationMs: 450,
  stimulusMs: 0,
  isiMs: [600, 1000],
  deadlineMs: 2500,
  practiceTrials: 8,
  blocks: 2,
  trialsPerBlock: 24,
  validity: VALIDITY_DEFAULT,
  makeTrials: (count, rng) =>
    mixed(count, 0.5, (congruent) => {
      const isRed = rng() < 0.5;
      const correct = isRed ? "esquerda" : "direita";
      const congruentSide = correct === "esquerda" ? "left" : "right";
      const side = congruent ? congruentSide : congruentSide === "left" ? "right" : "left";
      return {
        stimulus: { display: isRed ? "🔴" : "🔵", position: side as "left" | "right", ariaLabel: `balão ${isRed ? "vermelho" : "azul"} à ${side === "left" ? "esquerda" : "direita"}` },
        correctResponse: correct,
        tags: [congruent ? "congruente" : "incongruente"],
      };
    }, rng),
};

// ---------------------------------------------------------------- N-back
const NBACK_STIMULI = ["🍎", "🌟", "🐸", "🚗", "🌙", "🎁"];
function makeNBack(level: 1 | 2 | 3): CognitiveTaskConfig {
  return {
    id: `nback-${level}`,
    name: `${level}-back`,
    fullName: `Tarefa N-back NeuroPed (nível ${level}) — memória de trabalho`,
    emoji: "🧠",
    domain: "Memória de trabalho e atualização",
    ageLabel: level === 1 ? "6–17 anos" : level === 2 ? "8–17 anos" : "10–17 anos",
    durationLabel: "≈4 min",
    description: `Figuras aparecem em sequência; aperte quando a figura for IGUAL à de ${level} posição(ões) atrás. Nível ${level} de carga de memória de trabalho.`,
    instructions:
      level === 1
        ? "Aperte quando a figura for IGUAL à que apareceu logo antes (repetida em seguida)."
        : `Aperte quando a figura for IGUAL à que apareceu ${level} figuras atrás. Guarde a sequência na cabeça!`,
    tutorial: [
      { text: "Veja a sequência: 🍎 … depois 🍎 de novo — repetiu, aperte!", stimulus: { display: "🍎" }, demoResponse: "match" },
      { text: "Se a figura NÃO repete a de trás, não aperte.", stimulus: { display: "🌟" }, demoResponse: null },
    ],
    responses: [{ id: "match", key: " ", label: "Repetiu!", emoji: "✅" }],
    fixationMs: 300,
    stimulusMs: 1500,
    isiMs: [800, 1000],
    deadlineMs: 2200,
    practiceTrials: 10,
    blocks: 2,
    trialsPerBlock: 25,
    validity: { ...VALIDITY_DEFAULT, minResponseRate: 0.4 },
    makeTrials: (count, rng) => {
      // Constrói a sequência garantindo ~30% de correspondências n-back.
      const seq: string[] = [];
      const targetsWanted = Math.round(count * 0.3);
      let placed = 0;
      for (let i = 0; i < count; i++) {
        const canMatch = i >= level;
        const wantMatch = canMatch && placed < targetsWanted && rng() < 0.4;
        if (wantMatch) {
          seq.push(seq[i - level]);
          placed++;
        } else {
          let pick = NBACK_STIMULI[Math.floor(rng() * NBACK_STIMULI.length)];
          // evita correspondência acidental
          if (canMatch && pick === seq[i - level]) {
            pick = NBACK_STIMULI[(NBACK_STIMULI.indexOf(pick) + 1) % NBACK_STIMULI.length];
          }
          seq.push(pick);
        }
      }
      return seq.map((display, i) => {
        const isMatch = i >= level && display === seq[i - level];
        return {
          stimulus: { display },
          correctResponse: isMatch ? "match" : null,
          tags: [isMatch ? "alvo" : "nao-alvo"],
        };
      });
    },
  };
}

// ---------------------------------------------------------------- TR simples
const srt: CognitiveTaskConfig = {
  id: "tr-simples",
  name: "TR Simples",
  fullName: "Tempo de Reação Simples NeuroPed",
  emoji: "⚡",
  domain: "Velocidade de processamento",
  ageLabel: "4–17 anos",
  durationLabel: "≈3 min",
  description:
    "Aperte o botão assim que a estrela aparecer — o mais rápido possível. Linha de base de velocidade motora e alerta.",
  instructions: "Fique de olho! Assim que a ESTRELA ⭐ aparecer, aperte o botão o mais rápido que conseguir.",
  tutorial: [{ text: "Apareceu a estrela? Aperte já!", stimulus: { display: "⭐" }, demoResponse: "go" }],
  responses: [{ id: "go", key: " ", label: "Apertar", emoji: "👆" }],
  fixationMs: 400,
  stimulusMs: 0,
  isiMs: [1000, 2500],
  deadlineMs: 2000,
  practiceTrials: 5,
  blocks: 2,
  trialsPerBlock: 15,
  validity: { ...VALIDITY_DEFAULT, minResponseRate: 0.7 },
  makeTrials: (count) =>
    Array.from({ length: count }, () => ({
      stimulus: { display: "⭐" },
      correctResponse: "go",
      tags: ["alvo"],
    })),
};

// ---------------------------------------------------------------- TR de escolha
const crt: CognitiveTaskConfig = {
  id: "tr-escolha",
  name: "TR de Escolha",
  fullName: "Tempo de Reação de Escolha NeuroPed (2 alternativas)",
  emoji: "🔀",
  domain: "Velocidade de decisão",
  ageLabel: "5–17 anos",
  durationLabel: "≈3 min",
  description:
    "Sol → botão da esquerda; Lua → botão da direita. A diferença para o TR simples estima o custo de decisão.",
  instructions: "SOL ☀️ → aperte o botão da ESQUERDA. LUA 🌙 → aperte o botão da DIREITA. O mais rápido que conseguir!",
  tutorial: [
    { text: "Sol → esquerda!", stimulus: { display: "☀️" }, demoResponse: "sol" },
    { text: "Lua → direita!", stimulus: { display: "🌙" }, demoResponse: "lua" },
  ],
  responses: [
    { id: "sol", key: "ArrowLeft", label: "Sol", emoji: "☀️" },
    { id: "lua", key: "ArrowRight", label: "Lua", emoji: "🌙" },
  ],
  fixationMs: 400,
  stimulusMs: 0,
  isiMs: [800, 1600],
  deadlineMs: 2200,
  practiceTrials: 6,
  blocks: 2,
  trialsPerBlock: 18,
  validity: VALIDITY_DEFAULT,
  makeTrials: (count, rng) =>
    mixed(count, 0.5, (isSun) => ({
      stimulus: { display: isSun ? "☀️" : "🌙" },
      correctResponse: isSun ? "sol" : "lua",
      tags: [isSun ? "sol" : "lua"],
    }), rng),
};

// ------------------------------------------------------- Task Switching
// Mapeamento bivalente clássico: botão esquerdo = vermelho OU círculo;
// botão direito = azul OU quadrado. A pista (COR?/FORMA?) muda entre ensaios;
// tags repeticao/troca dão o custo de troca (flexibilidade cognitiva).
const SWITCH_STIMULI = [
  { display: "🔴", cor: "esq", forma: "esq" },  // círculo vermelho (congruente)
  { display: "🟦", cor: "dir", forma: "dir" },  // quadrado azul (congruente)
  { display: "🔵", cor: "dir", forma: "esq" },  // círculo azul (incongruente)
  { display: "🟥", cor: "esq", forma: "dir" },  // quadrado vermelho (incongruente)
];
const taskSwitching: CognitiveTaskConfig = {
  id: "task-switching",
  name: "Troca de Regras",
  fullName: "Tarefa de Alternância de Regras NeuroPed — flexibilidade cognitiva",
  emoji: "🔁",
  domain: "Flexibilidade cognitiva (custo de troca)",
  ageLabel: "7–17 anos",
  durationLabel: "≈5 min",
  description:
    "A regra muda a cada momento: ora responda pela COR, ora pela FORMA da figura. O custo de troca (RT em trocas − repetições) descreve a flexibilidade.",
  instructions:
    "Olhe a palavra em cima da figura. Se for COR: vermelho → botão da esquerda, azul → direita. Se for FORMA: círculo → esquerda, quadrado → direita.",
  tutorial: [
    { text: "Regra COR com círculo vermelho → é VERMELHO → esquerda.", stimulus: { display: "COR? 🔴" }, demoResponse: "esq" },
    { text: "Regra FORMA com quadrado vermelho → é QUADRADO → direita (a cor não importa agora!).", stimulus: { display: "FORMA? 🟥" }, demoResponse: "dir" },
  ],
  responses: [
    { id: "esq", key: "ArrowLeft", label: "Vermelho / Círculo", emoji: "🔴" },
    { id: "dir", key: "ArrowRight", label: "Azul / Quadrado", emoji: "🟦" },
  ],
  fixationMs: 400,
  stimulusMs: 0,
  isiMs: [600, 1000],
  deadlineMs: 3500,
  practiceTrials: 10,
  blocks: 2,
  trialsPerBlock: 24,
  validity: VALIDITY_DEFAULT,
  makeTrials: (count, rng) => {
    const list: TrialSpec[] = [];
    let rule: "cor" | "forma" = rng() < 0.5 ? "cor" : "forma";
    for (let i = 0; i < count; i++) {
      const prev = rule;
      if (i > 0 && rng() < 0.5) rule = rule === "cor" ? "forma" : "cor";
      const stim = SWITCH_STIMULI[Math.floor(rng() * SWITCH_STIMULI.length)];
      list.push({
        stimulus: {
          display: `${rule === "cor" ? "COR?" : "FORMA?"} ${stim.display}`,
          ariaLabel: `regra ${rule} com figura ${stim.display}`,
        },
        correctResponse: rule === "cor" ? stim.cor : stim.forma,
        tags: [i === 0 || rule === prev ? "repeticao" : "troca"],
      });
    }
    return list;
  },
};

// -------------------------- Memória visual/verbal (reconhecimento contínuo)
// Paradigma de reconhecimento contínuo: itens aparecem em sequência e alguns
// REPETEM depois de 2–5 posições; a criança marca "Já vi". Acertos em
// repetidos = memória; comissões em novos = falso reconhecimento.
function makeContinuousRecognition(
  id: string,
  name: string,
  emoji: string,
  pool: string[],
  opts: { verbal: boolean }
): CognitiveTaskConfig {
  return {
    id,
    name,
    fullName: `${name} NeuroPed — reconhecimento contínuo`,
    emoji,
    domain: opts.verbal ? "Memória verbal (reconhecimento)" : "Memória visual (reconhecimento)",
    ageLabel: opts.verbal ? "7–17 anos (alfabetizados)" : "5–17 anos",
    durationLabel: "≈4 min",
    description: opts.verbal
      ? "Palavras aparecem uma a uma; aperte quando uma palavra REPETIR. Mede reconhecimento verbal e falsos alarmes."
      : "Figuras aparecem uma a uma; aperte quando uma figura REPETIR. Mede reconhecimento visual e falsos alarmes.",
    instructions: opts.verbal
      ? "Leia cada palavra. Se a palavra JÁ APARECEU antes nesta rodada, aperte “Já vi!”. Se é a primeira vez, não aperte."
      : "Olhe cada figura. Se a figura JÁ APARECEU antes nesta rodada, aperte “Já vi!”. Se é a primeira vez, não aperte.",
    tutorial: [
      { text: opts.verbal ? "BOLA apareceu pela 1ª vez → não aperte." : "🐢 apareceu pela 1ª vez → não aperte.", stimulus: { display: opts.verbal ? "BOLA" : "🐢" }, demoResponse: null },
      { text: opts.verbal ? "BOLA de novo → repetiu → aperte “Já vi!”." : "🐢 de novo → repetiu → aperte “Já vi!”.", stimulus: { display: opts.verbal ? "BOLA" : "🐢" }, demoResponse: "javi" },
    ],
    responses: [{ id: "javi", key: " ", label: "Já vi!", emoji: "👀" }],
    fixationMs: 300,
    stimulusMs: opts.verbal ? 1800 : 1500,
    isiMs: [700, 900],
    deadlineMs: 2400,
    practiceTrials: 8,
    // Bloco ÚNICO: com 2 blocos, o pool re-embaralhado fazia itens do bloco 1
    // reaparecerem no bloco 2 rotulados como "novos" — quem lembrava deles era
    // penalizado como falso alarme. Uma aplicação contínua evita a contaminação.
    blocks: 1,
    trialsPerBlock: 40,
    validity: { ...VALIDITY_DEFAULT, minResponseRate: 0.4 },
    makeTrials: (count, rng) => {
      const seq: Array<{ item: string; repeat: boolean }> = [];
      const usable = shuffleWith(pool, rng);
      let cursor = 0;
      const repeatsWanted = Math.round(count * 0.3);
      let placed = 0;
      for (let i = 0; i < count; i++) {
        const canRepeat = seq.length >= 2 && placed < repeatsWanted && rng() < 0.45;
        if (canRepeat) {
          const lag = 2 + Math.floor(rng() * 4); // repete o item de 2–5 posições atrás
          const src = seq[Math.max(0, i - lag)];
          if (src && !src.repeat) {
            seq.push({ item: src.item, repeat: true });
            placed++;
            continue;
          }
        }
        if (cursor < usable.length) {
          seq.push({ item: usable[cursor], repeat: false });
          cursor++;
        } else {
          // Pool esgotado: melhor uma repetição LEGÍTIMA (rotulada como tal)
          // do que reciclar um item como "novo" e punir quem lembra dele.
          const past = seq[Math.floor(rng() * seq.length)];
          seq.push({ item: past.item, repeat: true });
        }
      }
      return seq.map(({ item, repeat }) => ({
        stimulus: { display: item },
        correctResponse: repeat ? "javi" : null,
        tags: [repeat ? "repetido" : "novo"],
      }));
    },
  };
}

const VISUAL_POOL = ["🦁", "🍇", "🚲", "🌻", "🐙", "🎪", "🧩", "🪁", "🦒", "🍓", "🚀", "🌈", "🐧", "🎺", "🏰", "🦖", "🍉", "⛵", "🌵", "🐞", "🎈", "🐋", "🍄", "🔔", "🦉", "🛴", "🧸", "🍩", "🐫", "⚓", "🪗", "🦜"];
const VERBAL_POOL = ["BOLA", "CASA", "PATO", "MESA", "FOGO", "LIVRO", "CHUVA", "DENTE", "PEIXE", "SAPATO", "JANELA", "MILHO", "PONTE", "VELA", "TREM", "FOLHA", "PIPOCA", "SINO", "NUVEM", "REMO", "TAMPA", "GIZ", "LUVA", "BARCO", "PENTE", "SOFÁ", "LIMÃO", "RODA", "CHAVE", "PIPA", "DADO", "CANECA"];

const memoriaVisual = makeContinuousRecognition("memoria-visual-np", "Memória Visual", "🖼️", VISUAL_POOL, { verbal: false });
const memoriaVerbal = makeContinuousRecognition("memoria-verbal-np", "Memória Verbal", "📖", VERBAL_POOL, { verbal: true });

export const cognitiveTasks: CognitiveTaskConfig[] = [
  srt,
  crt,
  goNoGo,
  cpt,
  stroop,
  flanker,
  simon,
  makeNBack(1),
  makeNBack(2),
  makeNBack(3),
  taskSwitching,
  memoriaVisual,
  memoriaVerbal,
];

export function getCognitiveTask(id: string | undefined): CognitiveTaskConfig | undefined {
  return cognitiveTasks.find((t) => t.id === id);
}
