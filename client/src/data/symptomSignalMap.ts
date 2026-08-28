/**
 * Mapa de sintomas/sinais → escalas candidatas.
 * Módulo puro (sem dependência de UI) para uso pelo motor de ranking e testes.
 *
 * Cada Symptom aponta para os IDs de escalas do catálogo (scaleFilter.ts)
 * que mais se aplicam quando o sinal está presente, com um peso clínico (0–1).
 */

export interface SymptomGroup {
  id: string;
  label: string;
  symptoms: Symptom[];
}

export interface Symptom {
  id: string;
  label: string;
  aliases?: string[];
  scaleIds: string[];
  weight: number;
}

// ─── TEA / Comunicação Social ────────────────────────────────────────────────
const teaGroup: SymptomGroup = {
  id: "tea",
  label: "TEA / Comunicação Social",
  symptoms: [
    {
      id: "pouco-contato-visual",
      label: "Pouco contato visual",
      aliases: ["nao olha", "não olha", "evita olhar", "esquiva olhar"],
      scaleIds: ["mchat", "cars", "tea-comportamentos", "srs2", "scq", "atec"],
      weight: 0.9,
    },
    {
      id: "nao-responde-nome",
      label: "Não responde ao nome",
      aliases: ["nao responde", "não responde", "ignora chamado", "nao escuta"],
      scaleIds: ["mchat", "cars", "tea-comportamentos", "atec"],
      weight: 0.9,
    },
    {
      id: "ecolalia",
      label: "Ecolalia (repete palavras/frases)",
      aliases: ["repete", "ecolalia", "ecoa"],
      scaleIds: ["cars", "tea-comportamentos", "atec", "abc"],
      weight: 0.8,
    },
    {
      id: "rigidez-rotinas",
      label: "Rigidez / resistência a mudanças",
      aliases: ["rigidez", "nao aceita mudanca", "inflexivel", "insiste rotina"],
      scaleIds: ["cars", "tea-comportamentos", "srs2", "abc", "atec"],
      weight: 0.8,
    },
    {
      id: "hiperfoco",
      label: "Hiperfoco / interesses restritos",
      aliases: ["hiperfoco", "interesse fixo", "obsessao tema"],
      scaleIds: ["srs2", "scq", "tea-comportamentos", "gars3", "atec"],
      weight: 0.7,
    },
    {
      id: "alinhamento-objetos",
      label: "Alinha ou enfileira objetos",
      aliases: ["alinha objetos", "enfileira", "organiza repetitivo"],
      scaleIds: ["mchat", "tea-comportamentos", "atec", "abc"],
      weight: 0.75,
    },
    {
      id: "seletividade-alimentar",
      label: "Seletividade alimentar intensa",
      aliases: ["come pouco", "recusa comida", "seletivo alimentar", "nao come"],
      scaleIds: ["tea-comportamentos", "atec", "abc"],
      weight: 0.6,
    },
    {
      id: "sensibilidade-auditiva",
      label: "Sensibilidade auditiva / tapa ouvidos",
      aliases: ["sensivel a som", "tampa ouvidos", "incomoda barulho"],
      scaleIds: ["tea-comportamentos", "cars", "atec", "abc"],
      weight: 0.65,
    },
    {
      id: "ausencia-apontar",
      label: "Ausência de apontar / mostrar",
      aliases: ["nao aponta", "nao mostra", "sem gesto de apontar"],
      scaleIds: ["mchat", "tea-comportamentos"],
      weight: 0.85,
    },
    {
      id: "baixa-reciprocidade-social",
      label: "Baixa reciprocidade social",
      aliases: ["nao interage", "nao divide", "nao compartilha interesse", "sem atenção compartilhada"],
      scaleIds: ["mchat", "srs2", "scq", "cars", "tea-comportamentos"],
      weight: 0.85,
    },
  ],
};

// ─── TDAH / Funções Executivas ────────────────────────────────────────────────
const tdahGroup: SymptomGroup = {
  id: "tdah",
  label: "TDAH / Funções Executivas",
  symptoms: [
    {
      id: "desatencao",
      label: "Desatenção / não presta atenção",
      aliases: ["desatento", "nao presta atencao", "distrai facil", "esquecido"],
      scaleIds: ["snap", "vanderbilt", "conners", "sdq", "brief2"],
      weight: 0.9,
    },
    {
      id: "impulsividade",
      label: "Impulsividade / age sem pensar",
      aliases: ["impulsivo", "age sem pensar", "nao espera a vez", "interrompe"],
      scaleIds: ["snap", "vanderbilt", "conners", "sdq"],
      weight: 0.85,
    },
    {
      id: "hiperatividade",
      label: "Hiperatividade / agitado",
      aliases: ["hiperativo", "agitado", "nao para quieto", "inquieto"],
      scaleIds: ["snap", "vanderbilt", "conners", "sdq"],
      weight: 0.85,
    },
    {
      id: "esquecimento",
      label: "Esquecimento frequente",
      aliases: ["esquece", "perde material", "nao lembra"],
      scaleIds: ["snap", "vanderbilt", "brief2"],
      weight: 0.7,
    },
    {
      id: "desorganizacao",
      label: "Desorganização / dificuldade de planejar",
      aliases: ["desorganizado", "nao organiza", "nao planeja", "bagunca"],
      scaleIds: ["brief2", "snap", "conners"],
      weight: 0.75,
    },
    {
      id: "baixa-persistencia",
      label: "Baixa persistência / não termina tarefas",
      aliases: ["nao termina", "abandona tarefa", "sem persistencia"],
      scaleIds: ["snap", "vanderbilt", "brief2", "conners"],
      weight: 0.7,
    },
    {
      id: "interrompe-outros",
      label: "Interrompe conversas / não espera a vez",
      aliases: ["interrompe", "nao espera", "fala fora de hora"],
      scaleIds: ["snap", "vanderbilt", "conners"],
      weight: 0.7,
    },
    {
      id: "queda-rendimento-escolar",
      label: "Queda no rendimento escolar",
      aliases: ["nota baixa", "mal na escola", "rendimento escolar"],
      scaleIds: ["vanderbilt", "snap", "conners", "sdq"],
      weight: 0.65,
    },
    {
      id: "procrastinacao",
      label: "Procrastinação / adia tarefas",
      aliases: ["procrastina", "deixa pra depois", "adia tudo"],
      scaleIds: ["brief2", "snap"],
      weight: 0.6,
    },
    {
      id: "inquietude-motora",
      label: "Inquietude motora / não fica sentado",
      aliases: ["nao fica sentado", "mexe muito", "se levanta", "agitacao motora"],
      scaleIds: ["snap", "vanderbilt", "conners", "sdq"],
      weight: 0.8,
    },
  ],
};

// ─── Ansiedade / Humor ────────────────────────────────────────────────────────
const ansiedadeGroup: SymptomGroup = {
  id: "ansiedade",
  label: "Ansiedade / Humor",
  symptoms: [
    {
      id: "medo-excessivo",
      label: "Medo excessivo / fobias",
      aliases: ["medo intenso", "fobia", "medo excessivo", "panico"],
      scaleIds: ["scared", "rcads", "sdq", "cbcl"],
      weight: 0.9,
    },
    {
      id: "preocupacao-persistente",
      label: "Preocupação persistente / excessiva",
      aliases: ["preocupado sempre", "ansioso", "nao para de se preocupar"],
      scaleIds: ["scared", "rcads", "cbcl"],
      weight: 0.85,
    },
    {
      id: "evitacao",
      label: "Evitação de situações / recusa escolar",
      aliases: ["evita situacoes", "recusa escola", "foge", "nao vai", "evitacao"],
      scaleIds: ["scared", "rcads", "cbcl"],
      weight: 0.8,
    },
    {
      id: "sintomas-somaticos",
      label: "Sintomas somáticos (dor de barriga, cefaleia)",
      aliases: ["dor de barriga", "nausea ansiedade", "cefaleia frequente", "somatico"],
      scaleIds: ["scared", "rcads", "cbcl", "sdq"],
      weight: 0.7,
    },
    {
      id: "irritabilidade",
      label: "Irritabilidade / explosividade emocional",
      aliases: ["irritado", "explosivo", "briga facil", "raiva"],
      scaleIds: ["rcads", "cbcl", "sdq", "abc"],
      weight: 0.7,
    },
    {
      id: "tristeza",
      label: "Tristeza persistente / choro fácil",
      aliases: ["triste", "chora muito", "desmotivado", "desamimo"],
      scaleIds: ["phqa", "cdi2", "rcads", "cbcl", "sdq"],
      weight: 0.85,
    },
    {
      id: "anedonia",
      label: "Anedonia / perda de interesse",
      aliases: ["perdeu interesse", "nao quer nada", "sem motivacao", "anedonia"],
      scaleIds: ["phqa", "cdi2", "rcads"],
      weight: 0.8,
    },
    {
      id: "isolamento",
      label: "Isolamento social",
      aliases: ["isolado", "nao quer amigos", "se isola", "evita pessoas"],
      scaleIds: ["phqa", "cdi2", "sdq", "cbcl"],
      weight: 0.75,
    },
    {
      id: "baixa-autoestima",
      label: "Baixa autoestima / sentimento de inutilidade",
      aliases: ["nao se valoriza", "baixa autoestima", "se acha burro", "sem valor"],
      scaleIds: ["cdi2", "phqa", "rcads"],
      weight: 0.7,
    },
    {
      id: "ideacao-morte",
      label: "Ideação de morte / pensamentos suicidas",
      aliases: ["quer morrer", "fala em morrer", "pensamento de morte", "suicidio"],
      scaleIds: ["cssrs", "phqa", "cdi2"],
      weight: 1.0,
    },
    {
      id: "automutilacao",
      label: "Automutilação / se machuca",
      aliases: ["se machuca", "se corta", "autolesao", "automutilacao"],
      scaleIds: ["cssrs", "phqa"],
      weight: 1.0,
    },
  ],
};

// ─── Comportamento Disruptivo ─────────────────────────────────────────────────
const comportamentoGroup: SymptomGroup = {
  id: "comportamento",
  label: "Comportamento Disruptivo",
  symptoms: [
    {
      id: "birras-intensas",
      label: "Birras intensas / crises de choro",
      aliases: ["birra", "crise de choro", "tantrum", "choro intenso"],
      scaleIds: ["vanderbilt", "cbcl", "sdq", "abc", "ecbi"],
      weight: 0.8,
    },
    {
      id: "agressividade",
      label: "Agressividade (bate, morde, chuta)",
      aliases: ["bate", "morde", "chuta", "agressivo", "violento"],
      scaleIds: ["abc", "cbcl", "sdq", "conners", "vanderbilt"],
      weight: 0.9,
    },
    {
      id: "oposicao",
      label: "Oposição / desafia regras",
      aliases: ["desafia", "nao obedece", "opositor", "defia regras"],
      scaleIds: ["vanderbilt", "snap", "cbcl", "sdq", "conners"],
      weight: 0.85,
    },
    {
      id: "explosoes",
      label: "Explosões / crises intensas",
      aliases: ["explosao", "crise intensa", "explosivo", "agitado"],
      scaleIds: ["abc", "cbcl", "sdq", "ecbi"],
      weight: 0.85,
    },
    {
      id: "baixa-tolerancia-frustracao",
      label: "Baixa tolerância à frustração",
      aliases: ["nao tolera frustração", "nao suporta esperar", "nao aceita nao"],
      scaleIds: ["cbcl", "sdq", "snap", "vanderbilt"],
      weight: 0.75,
    },
    {
      id: "quebra-objetos",
      label: "Quebra objetos / destroçamentos",
      aliases: ["quebra objetos", "destroca", "danifica coisas"],
      scaleIds: ["abc", "cbcl", "ecbi"],
      weight: 0.8,
    },
    {
      id: "desafia-regras",
      label: "Desafia regras / mentiras frequentes",
      aliases: ["desafia", "mente", "faz o contrario", "nao cumpre regras"],
      scaleIds: ["vanderbilt", "cbcl", "sdq", "conners"],
      weight: 0.8,
    },
  ],
};

// ─── Sono ─────────────────────────────────────────────────────────────────────
const sonoGroup: SymptomGroup = {
  id: "sono",
  label: "Sono",
  symptoms: [
    {
      id: "insonia-inicial",
      label: "Insônia inicial / dificuldade para dormir",
      aliases: ["nao dorme", "nao pega no sono", "insonia", "demora dormir"],
      scaleIds: ["cshq", "sono"],
      weight: 0.9,
    },
    {
      id: "despertares-noturnos",
      label: "Despertares noturnos frequentes",
      aliases: ["acorda a noite", "sono interrompido", "acorda chorando"],
      scaleIds: ["cshq", "sono"],
      weight: 0.85,
    },
    {
      id: "roncos",
      label: "Roncos / apneia do sono",
      aliases: ["ronca", "para de respirar dormindo", "apneia"],
      scaleIds: ["cshq", "sono"],
      weight: 0.8,
    },
    {
      id: "sonolencia-diurna",
      label: "Sonolência diurna excessiva",
      aliases: ["sonolento", "dorme na escola", "boceja sempre", "cansado"],
      scaleIds: ["cshq", "sono"],
      weight: 0.8,
    },
    {
      id: "pesadelos",
      label: "Pesadelos / terror noturno",
      aliases: ["pesadelo", "terror noturno", "acorda gritando", "medo de dormir"],
      scaleIds: ["cshq", "sono"],
      weight: 0.75,
    },
    {
      id: "agitacao-noturna",
      label: "Agitação noturna / sonambulismo",
      aliases: ["se mexe muito dormindo", "sonambulo", "agitado dormindo"],
      scaleIds: ["cshq", "sono"],
      weight: 0.75,
    },
    {
      id: "rotina-irregular",
      label: "Rotina de sono irregular",
      aliases: ["horario irregular de dormir", "sem rotina de sono", "dorme em horario diferente"],
      scaleIds: ["cshq", "sono"],
      weight: 0.65,
    },
  ],
};

// ─── Epilepsia / Eventos Paroxísticos ─────────────────────────────────────────
const epilepsiaGroup: SymptomGroup = {
  id: "epilepsia",
  label: "Epilepsia / Eventos Paroxísticos",
  symptoms: [
    {
      id: "crises-convulsivas",
      label: "Crises convulsivas / espasmos",
      aliases: ["convulsao", "crise", "espasmo", "tremor involuntario"],
      scaleIds: ["epilepsia", "epilepsia-diario", "pedsql-epilepsia"],
      weight: 1.0,
    },
    {
      id: "ausencia",
      label: "Crises de ausência / desligamento",
      aliases: ["ausencia", "desliga", "fica parado olhando", "crise ausencia"],
      scaleIds: ["epilepsia", "epilepsia-diario"],
      weight: 0.9,
    },
    {
      id: "abalos",
      label: "Abalos mioclônicos",
      aliases: ["abalo", "mioclonia", "espasmo muscular"],
      scaleIds: ["epilepsia", "epilepsia-diario"],
      weight: 0.85,
    },
    {
      id: "automatismos",
      label: "Automatismos (mastigação, piscar)",
      aliases: ["automatismo", "piscar involuntario", "mastigacao involuntaria"],
      scaleIds: ["epilepsia", "epilepsia-diario"],
      weight: 0.85,
    },
    {
      id: "perda-consciencia",
      label: "Perda de consciência",
      aliases: ["desmaio", "perde consciencia", "fica inconsciente"],
      scaleIds: ["epilepsia", "epilepsia-diario"],
      weight: 0.95,
    },
    {
      id: "regressao-pos-evento",
      label: "Regressão após crise / confusão pós-ictal",
      aliases: ["confuso apos crise", "regressao apos convulsao", "confusao pos-ictal"],
      scaleIds: ["epilepsia-diario", "epilepsia"],
      weight: 0.8,
    },
    {
      id: "cefaleia-pos-crise",
      label: "Cefaleia pós-crise",
      aliases: ["dor de cabeca apos convulsao", "cefaleia pos ictal"],
      scaleIds: ["epilepsia-diario"],
      weight: 0.7,
    },
  ],
};

// ─── Desenvolvimento / Atraso Global ──────────────────────────────────────────
const desenvolvimentoGroup: SymptomGroup = {
  id: "desenvolvimento",
  label: "Desenvolvimento / Atraso Global",
  symptoms: [
    {
      id: "atraso-fala",
      label: "Atraso de fala / linguagem",
      aliases: ["nao fala", "fala pouco", "atraso de fala", "atraso linguagem"],
      scaleIds: ["denver", "asq3", "vineland", "catclams"],
      weight: 0.9,
    },
    {
      id: "atraso-motor",
      label: "Atraso motor (sentar, andar, segurar)",
      aliases: ["nao anda", "nao senta", "atraso motor", "nao segura"],
      scaleIds: ["denver", "asq3", "aims", "gmfcs"],
      weight: 0.9,
    },
    {
      id: "atraso-cognitivo",
      label: "Atraso cognitivo / dificuldade de aprendizagem global",
      aliases: ["atraso cognitivo", "aprende devagar", "dificuldade cognitiva"],
      scaleIds: ["bayley", "denver", "vineland", "asq3"],
      weight: 0.85,
    },
    {
      id: "baixa-autonomia",
      label: "Baixa autonomia / depende demais do adulto",
      aliases: ["nao se veste", "nao come sozinho", "depende muito", "autonomia baixa"],
      scaleIds: ["vineland", "denver", "portage"],
      weight: 0.8,
    },
    {
      id: "dificuldade-adaptativa",
      label: "Dificuldade de adaptação / habilidades adaptativas",
      aliases: ["nao se adapta", "dificuldade adaptativa", "habilidade adaptativa"],
      scaleIds: ["vineland", "asq3", "portage"],
      weight: 0.8,
    },
    {
      id: "atraso-escolar-global",
      label: "Atraso escolar global",
      aliases: ["atrasado na escola", "nao acompanha a turma", "atraso escolar"],
      scaleIds: ["denver", "vineland", "asq3"],
      weight: 0.75,
    },
    {
      id: "regressao-desenvolvimento",
      label: "Regressão de habilidades adquiridas",
      aliases: ["perdeu habilidade", "regrediu", "voltou atras", "esqueceu o que sabia"],
      scaleIds: ["vineland", "denver", "tea-comportamentos"],
      weight: 0.85,
    },
  ],
};

export const SYMPTOM_GROUPS: SymptomGroup[] = [
  teaGroup,
  tdahGroup,
  ansiedadeGroup,
  comportamentoGroup,
  sonoGroup,
  epilepsiaGroup,
  desenvolvimentoGroup,
];

/**
 * Todos os sintomas em um mapa plano id → Symptom para lookup rápido.
 */
export const SYMPTOM_BY_ID: Map<string, Symptom> = new Map(
  SYMPTOM_GROUPS.flatMap((g) => g.symptoms).map((s) => [s.id, s]),
);

/**
 * Calcula o symptomSignalScore para uma escala, dado os sintomas selecionados.
 * Retorna um valor normalizado de 0–1.
 *
 * Algoritmo:
 *  - Para cada sintoma selecionado que menciona a escala: acumula seu weight.
 *  - Normaliza pelo máximo possível (soma de todos os weights dos sintomas selecionados).
 */
export function symptomSignalScore(
  scaleId: string,
  selectedSymptomIds: string[],
): number {
  if (selectedSymptomIds.length === 0) return 0;

  let matched = 0;
  let total = 0;

  for (const sid of selectedSymptomIds) {
    const symptom = SYMPTOM_BY_ID.get(sid);
    if (!symptom) continue;
    total += symptom.weight;
    if (symptom.scaleIds.includes(scaleId)) {
      matched += symptom.weight;
    }
  }

  return total === 0 ? 0 : matched / total;
}

/**
 * Gera a string de justificativa para exibição no card da escala.
 * Ex.: "Indicada por: pouco contato visual, não responde ao nome"
 */
export function buildJustification(
  scaleId: string,
  selectedSymptomIds: string[],
): string {
  if (selectedSymptomIds.length === 0) return "";
  const matched = selectedSymptomIds
    .map((id) => SYMPTOM_BY_ID.get(id))
    .filter((s): s is Symptom => !!s && s.scaleIds.includes(scaleId));
  if (matched.length === 0) return "";
  return `Indicada por: ${matched.map((s) => s.label.toLowerCase()).join(", ")}`;
}

/**
 * Resolve um texto livre para IDs de sintomas usando aliases.
 * Útil para o campo de busca livre na UI.
 */
export function resolveAliasToSymptomIds(query: string): string[] {
  const normalized = query
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
  const matched: string[] = [];
  for (const [id, symptom] of SYMPTOM_BY_ID) {
    const labelNorm = symptom.label
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "");
    if (labelNorm.includes(normalized)) {
      matched.push(id);
      continue;
    }
    for (const alias of symptom.aliases ?? []) {
      const aliasNorm = alias
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "");
      if (aliasNorm.includes(normalized) || normalized.includes(aliasNorm)) {
        matched.push(id);
        break;
      }
    }
  }
  return matched;
}
