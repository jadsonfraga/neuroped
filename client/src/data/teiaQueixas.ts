/**
 * teiaQueixas.ts — TEIA de sinais e sintomas → queixas → escalas.
 *
 * Cada sinal/sintoma detalhado (com emoji) conecta-se a uma ou mais queixas-mãe
 * do catálogo (parents) e, opcionalmente, a escalas diretamente indicadas
 * (scaleIds — reforçadas no ranking). A seleção de um sinal alimenta o motor
 * clínico com as queixas-mãe, criando a teia: um sintoma puxa várias linhas
 * de investigação ao mesmo tempo (ex.: "anda na ponta dos pés" → TEA + motor + PC).
 *
 * REGRA: parents devem existir em `queixas` (scaleFilter.ts) e scaleIds em
 * `allScales` — validados pelo guard de dados.
 */

export interface TeiaSinal {
  id: string;
  label: string;
  emoji: string;
  /** Queixas-mãe ativadas no motor clínico ao selecionar este sinal. */
  parents: string[];
  /** Escalas diretamente indicadas (boost no ranking). */
  scaleIds?: string[];
  /** Grupo visual da teia. */
  grupo: string;
}

export const teiaSinais: TeiaSinal[] = [
  // ── Desenvolvimento / marcos ──
  { id: "regressao-habilidades", label: "Perdeu habilidades que já tinha", emoji: "📉", parents: ["atraso", "tea", "epilepsia"], scaleIds: ["mchat", "cars"], grupo: "Desenvolvimento" },
  { id: "marcos-atrasados", label: "Marcos atrasados em geral", emoji: "🐢", parents: ["atraso"], scaleIds: ["denver", "asq3"], grupo: "Desenvolvimento" },
  { id: "nao-senta-9m", label: "Não senta aos 9 meses", emoji: "🪑", parents: ["atraso", "pc", "neonatal"], scaleIds: ["denver"], grupo: "Desenvolvimento" },
  { id: "nao-anda-18m", label: "Não anda aos 18 meses", emoji: "🚼", parents: ["atraso", "pc", "motor"], scaleIds: ["denver", "asq3"], grupo: "Desenvolvimento" },
  { id: "hipotonia", label: "Molinho / hipotonia", emoji: "🧸", parents: ["pc", "atraso", "neonatal"], grupo: "Desenvolvimento" },

  // ── Linguagem / comunicação ──
  { id: "nao-fala-2a", label: "Não fala palavras aos 2 anos", emoji: "🤐", parents: ["linguagem", "atraso", "tea"], grupo: "Linguagem" },
  { id: "regressao-linguagem", label: "Perdeu fala que já tinha", emoji: "🔇", parents: ["tea", "linguagem", "epilepsia"], grupo: "Linguagem" },
  { id: "ecolalia", label: "Repete falas (ecolalia)", emoji: "🔁", parents: ["tea", "linguagem"], grupo: "Linguagem" },
  { id: "fala-ininteligivel", label: "Fala difícil de entender", emoji: "🔤", parents: ["linguagem"], scaleIds: ["viking-speech"], grupo: "Linguagem" },
  { id: "gagueira", label: "Gagueira / disfluência", emoji: "🗣️", parents: ["linguagem"], grupo: "Linguagem" },

  // ── TEA / social ──
  { id: "pouco-contato-visual", label: "Pouco contato visual", emoji: "👀", parents: ["tea", "social"], scaleIds: ["mchat", "q-chat-10", "cars"], grupo: "TEA e Social" },
  { id: "nao-atende-nome", label: "Não atende pelo nome", emoji: "📣", parents: ["tea"], scaleIds: ["mchat", "q-chat-10"], grupo: "TEA e Social" },
  { id: "nao-aponta", label: "Não aponta para mostrar", emoji: "👉", parents: ["tea"], scaleIds: ["mchat", "q-chat-10"], grupo: "TEA e Social" },
  { id: "estereotipias", label: "Movimentos repetitivos (flapping)", emoji: "🌀", parents: ["tea", "sensorial"], scaleIds: ["cars", "rbs-r"], grupo: "TEA e Social" },
  { id: "interesses-restritos", label: "Interesses restritos / intensos", emoji: "🚂", parents: ["tea"], scaleIds: ["rbs-r", "rbq-2"], grupo: "TEA e Social" },
  { id: "rigidez-rotinas", label: "Sofre com mudança de rotina", emoji: "📅", parents: ["tea", "toc"], grupo: "TEA e Social" },
  { id: "isolamento-social", label: "Não faz amigos / isola-se", emoji: "🧍", parents: ["social", "tea", "depressao"], scaleIds: ["srs2", "sdq"], grupo: "TEA e Social" },
  { id: "camuflagem-social", label: "Mascara dificuldades sociais", emoji: "🎭", parents: ["tea"], scaleIds: ["catq"], grupo: "TEA e Social" },
  { id: "andar-na-ponta", label: "Anda na ponta dos pés", emoji: "🦶", parents: ["tea", "motor", "pc"], grupo: "TEA e Social" },

  // ── Sensorial / alimentação ──
  { id: "hipersensibilidade-som", label: "Tapa os ouvidos com sons", emoji: "🔊", parents: ["sensorial", "tea"], scaleIds: ["seq"], grupo: "Sensorial e Alimentação" },
  { id: "seletividade-alimentar", label: "Só come poucos alimentos", emoji: "🥦", parents: ["alimentacao", "sensorial", "tea"], scaleIds: ["bpfas", "fns-child"], grupo: "Sensorial e Alimentação" },
  { id: "engasgos-degluticao", label: "Engasga / dificuldade de engolir", emoji: "🍽️", parents: ["alimentacao"], scaleIds: ["peat"], grupo: "Sensorial e Alimentação" },
  { id: "recusa-alimentar", label: "Recusa alimentar nas refeições", emoji: "🚫", parents: ["alimentacao", "comportamento"], scaleIds: ["bpfas", "step"], grupo: "Sensorial e Alimentação" },

  // ── Atenção / hiperatividade ──
  { id: "nao-para-quieto", label: "Não para quieto", emoji: "🤸", parents: ["tdah"], scaleIds: ["snap", "vanderbilt"], grupo: "Atenção e Hiperatividade" },
  { id: "desatencao-escolar", label: "Desatento na escola", emoji: "✏️", parents: ["tdah", "aprendizagem"], scaleIds: ["snap", "vanderbilt", "conners"], grupo: "Atenção e Hiperatividade" },
  { id: "impulsividade", label: "Age sem pensar", emoji: "🎯", parents: ["tdah", "comportamento"], scaleIds: ["snap", "conners"], grupo: "Atenção e Hiperatividade" },
  { id: "desorganizacao", label: "Perde material / desorganizado", emoji: "🎒", parents: ["tdah"], scaleIds: ["snap", "vanderbilt"], grupo: "Atenção e Hiperatividade" },
  { id: "episodios-desligamento", label: "Episódios de desligamento", emoji: "🫥", parents: ["epilepsia", "tdah"], grupo: "Atenção e Hiperatividade" },

  // ── Comportamento / humor ──
  { id: "birras-intensas", label: "Birras intensas / frequentes", emoji: "🌋", parents: ["comportamento"], scaleIds: ["ari", "sdq", "cbcl"], grupo: "Comportamento e Humor" },
  { id: "agressividade", label: "Agressividade", emoji: "👊", parents: ["comportamento"], scaleIds: ["cbcl", "sdq", "ari"], grupo: "Comportamento e Humor" },
  { id: "desafio-oposicao", label: "Desafia regras e adultos", emoji: "🙅", parents: ["comportamento"], scaleIds: ["sdq", "cbcl"], grupo: "Comportamento e Humor" },
  { id: "irritabilidade-cronica", label: "Irritado a maior parte do tempo", emoji: "😤", parents: ["comportamento", "depressao"], scaleIds: ["ari"], grupo: "Comportamento e Humor" },
  { id: "tristeza-persistente", label: "Tristeza na maioria dos dias", emoji: "😢", parents: ["depressao"], scaleIds: ["cdi2", "phqa"], grupo: "Comportamento e Humor" },
  { id: "perda-interesse", label: "Perdeu interesse no que gostava", emoji: "🥀", parents: ["depressao"], scaleIds: ["cdi2", "phqa"], grupo: "Comportamento e Humor" },
  { id: "autolesao", label: "Machuca a si mesmo", emoji: "🩹", parents: ["suicidio", "comportamento", "tea"], grupo: "Comportamento e Humor" },
  { id: "fala-em-morte", label: "Fala em morte / suicídio", emoji: "🆘", parents: ["suicidio", "depressao"], grupo: "Comportamento e Humor" },

  // ── Ansiedade / TOC / tiques ──
  { id: "ansiedade-separacao", label: "Não se separa dos pais", emoji: "🫂", parents: ["ansiedade"], scaleIds: ["scared", "scas"], grupo: "Ansiedade, TOC e Tiques" },
  { id: "medos-excessivos", label: "Medos excessivos", emoji: "😨", parents: ["ansiedade"], scaleIds: ["scared", "scas"], grupo: "Ansiedade, TOC e Tiques" },
  { id: "preocupacao-excessiva", label: "Preocupa-se demais", emoji: "💭", parents: ["ansiedade"], scaleIds: ["scared"], grupo: "Ansiedade, TOC e Tiques" },
  { id: "recusa-escolar", label: "Recusa ir à escola", emoji: "🏫", parents: ["ansiedade", "social"], scaleIds: ["scared"], grupo: "Ansiedade, TOC e Tiques" },
  { id: "crises-panico", label: "Crises de pânico", emoji: "💓", parents: ["ansiedade"], scaleIds: ["scared"], grupo: "Ansiedade, TOC e Tiques" },
  { id: "rituais-repetitivos", label: "Rituais / verificações repetidas", emoji: "🔂", parents: ["toc"], scaleIds: ["pi-cv", "foci-c"], grupo: "Ansiedade, TOC e Tiques" },
  { id: "tiques-motores", label: "Tiques motores", emoji: "😉", parents: ["tiques"], scaleIds: ["tsi"], grupo: "Ansiedade, TOC e Tiques" },
  { id: "tiques-vocais", label: "Tiques vocais (sons, pigarro)", emoji: "🗯️", parents: ["tiques"], scaleIds: ["tsi", "tsstd"], grupo: "Ansiedade, TOC e Tiques" },

  // ── Sono ──
  { id: "insonia", label: "Demora a dormir / acorda à noite", emoji: "🌙", parents: ["sono"], scaleIds: ["cshq", "bisq-r"], grupo: "Sono" },
  { id: "terror-noturno", label: "Terror noturno / pesadelos", emoji: "😱", parents: ["sono"], scaleIds: ["cshq"], grupo: "Sono" },
  { id: "ronco-apneia", label: "Ronco / pausas na respiração", emoji: "😮‍💨", parents: ["sono"], scaleIds: ["cshq"], grupo: "Sono" },
  { id: "sonolencia-diurna", label: "Sonolência durante o dia", emoji: "🥱", parents: ["sono"], scaleIds: ["cshq"], grupo: "Sono" },

  // ── Neurológico / dor ──
  { id: "crises-convulsivas", label: "Crises convulsivas", emoji: "⚡", parents: ["epilepsia"], scaleIds: ["ssq"], grupo: "Neurológico e Dor" },
  { id: "cefaleia-recorrente", label: "Dor de cabeça recorrente", emoji: "🤯", parents: ["dor"], scaleIds: ["fps-r", "nrs-pain"], grupo: "Neurológico e Dor" },
  { id: "dor-cronica", label: "Dor persistente", emoji: "🤕", parents: ["dor"], scaleIds: ["fps-r", "nrs-pain", "vas-pain"], grupo: "Neurológico e Dor" },
  { id: "quedas-desajeitado", label: "Quedas frequentes / desajeitado", emoji: "🦵", parents: ["motor", "pc"], grupo: "Neurológico e Dor" },

  // ── Escola / eliminação / adolescente ──
  { id: "dificuldade-leitura", label: "Dificuldade de leitura / escrita", emoji: "📖", parents: ["aprendizagem"], grupo: "Escola e Outros" },
  { id: "notas-caindo", label: "Queda no rendimento escolar", emoji: "📊", parents: ["aprendizagem", "tdah", "depressao"], scaleIds: ["sdq"], grupo: "Escola e Outros" },
  { id: "letra-ilegivel", label: "Letra ilegível / motor fino", emoji: "✍️", parents: ["motor", "aprendizagem"], grupo: "Escola e Outros" },
  { id: "xixi-na-cama", label: "Faz xixi na cama", emoji: "🛏️", parents: ["enurese"], scaleIds: ["iccs-symptom"], grupo: "Escola e Outros" },
  { id: "constipacao-escape", label: "Prisão de ventre / escape fecal", emoji: "💩", parents: ["enurese", "alimentacao"], scaleIds: ["bristol-stool-pediatric", "bbd-checklist"], grupo: "Escola e Outros" },
  { id: "uso-substancias", label: "Suspeita de álcool / drogas", emoji: "🍺", parents: ["substancias"], scaleIds: ["crafft"], grupo: "Escola e Outros" },
];

/** Grupos na ordem de exibição. */
export const teiaGrupos: string[] = Array.from(new Set(teiaSinais.map((s) => s.grupo)));

/** Queixas-mãe ativadas pelos sinais selecionados. */
export function parentsOf(selecionados: string[]): string[] {
  const out = new Set<string>();
  for (const s of teiaSinais) if (selecionados.includes(s.id)) s.parents.forEach((p) => out.add(p));
  return Array.from(out);
}

/** Escalas diretamente reforçadas pelos sinais selecionados. */
export function boostedScaleIds(selecionados: string[]): Set<string> {
  const out = new Set<string>();
  for (const s of teiaSinais) if (selecionados.includes(s.id)) (s.scaleIds ?? []).forEach((i) => out.add(i));
  return out;
}
