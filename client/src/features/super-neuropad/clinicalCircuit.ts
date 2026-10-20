/**
 * Circuito clínico complementar do Super NeuroPad Game.
 * Somente apoio à observação do médico: sem escore, corte, interpretação automática,
 * armazenamento local, acesso à câmera ou alteração da bateria principal.
 * Estações `presencial` nunca podem ser inferidas por resposta de tela.
 */
export const CIRCUIT_VERSION = "2026-10-20.1";
export type CircuitArea = "neurologico" | "mental";
export type CircuitMethod = "ludico" | "observacao" | "presencial" | "entrevista";
export type CircuitStatus = "observado" | "achado" | "nao_realizado" | "nao_colaborou";
export interface CircuitTask {
  id: string;
  area: CircuitArea;
  domain: string;
  title: string;
  emoji: string;
  min: number;
  max: number;
  method: CircuitMethod;
  guide: string;
  observe: string;
  video?: "utah" | "stanford";
  safety?: string;
}
export interface CircuitEntry { status: CircuitStatus; note: string }
export type CircuitRecords = Record<string, CircuitEntry>;
export const CIRCUIT_STATUSES: Record<CircuitStatus,string> = {
  observado: "Realizado — registrar descrição",
  achado: "Realizado — requer esclarecimento",
  nao_realizado: "Não realizado",
  nao_colaborou: "Sem colaboração suficiente",
};
export const CIRCUIT_METHODS: Record<CircuitMethod,string> = {
  ludico: "Missão lúdica supervisionada",
  observacao: "Observação clínica",
  presencial: "Exame físico presencial — profissional habilitado",
  entrevista: "Entrevista clínica — somente profissional",
};
export const CIRCUIT_VIDEO_LINKS = {
  utah: {
    url: "https://neurologicexam.med.utah.edu/pediatric/html/30month.html",
    label: "Videoteca pediátrica da Universidade de Utah (2½ anos; escolher demonstração pertinente)",
  },
  stanford: {
    url: "https://med.stanford.edu/stanfordmedicine25/videos.html",
    label: "Videoteca Stanford Medicine 25 (coordenação, marcha e reflexos)",
  },
} as const;

export const CIRCUIT_TASKS: readonly CircuitTask[] = [
  {id:"rapport",area:"mental",domain:"Aparência e comportamento",title:"Portal do encontro",emoji:"🤝",min:2,max:17,method:"observacao",guide:"Durante o acolhimento, observe apresentação, consciência aparente, contato, reciprocidade, atitude, atividade psicomotora e adaptação ao ambiente; respeite neurodiversidade e diferenças culturais.",observe:"Descreva fatos observáveis; não equipare contato ocular reduzido a diagnóstico.",video:"utah"},
  {id:"social2",area:"mental",domain:"Comunicação social",title:"Brinquedo compartilhado",emoji:"🧸",min:2,max:5,method:"ludico",guide:"Convide a criança a alternar turnos de brincadeira, mostrar algo de interesse e compartilhar atenção, sem exigir olhar nos olhos.",observe:"Registre iniciativa, atenção conjunta, reciprocidade, gestos e imitação; ajuda prestada.",video:"utah"},
  {id:"conversation6",area:"mental",domain:"Pragmática",title:"Conversa de exploradores",emoji:"💬",min:6,max:17,method:"entrevista",guide:"Converse sobre interesse pessoal e situação social cotidiana; observe turnos, coerência temática, prosódia e entendimento de contexto.",observe:"Exemplos literais de comunicação e necessidade de facilitação."},
  {id:"language2",area:"neurologico",domain:"Linguagem",title:"Descubra e conte",emoji:"🗣️",min:2,max:5,method:"ludico",guide:"Peça para apontar, nomear, compreender comandos simples e relatar algo por fala ou comunicação alternativa; escolha demandas conforme habilidades.",observe:"Compreensão, expressão, articulação, inteligibilidade, gestos e comunicação alternativa; não pontuar por número fixo de palavras.",video:"utah"},
  {id:"language6",area:"neurologico",domain:"Linguagem",title:"Narrador da aventura",emoji:"📖",min:6,max:17,method:"ludico",guide:"Peça descrição de sequência cotidiana e execução de instrução de múltiplas etapas adequada à escolarização; leitura apenas quando alfabetizado.",observe:"Fluência, compreensão, nomeação, repetição, prosódia, disartria ou sinais afásicos quando pertinentes."},
  {id:"vision",area:"neurologico",domain:"Pares cranianos II/III/IV/VI",title:"Olhos do cometa",emoji:"👀",min:2,max:17,method:"presencial",guide:"Examinador verifica fixação, seguimento, alinhamento e movimentos oculares em diferentes direções; avalia pupilas/reflexos luminosos com técnica apropriada e compara lados.",observe:"Fixação, nistagmo, estrabismo, limitação ocular, anisocoria, fotorreação. Tarefa digital NÃO mede acuidade, campos ou fundo de olho."},
  {id:"face",area:"neurologico",domain:"Pares cranianos V/VII",title:"Careta do dragão",emoji:"🐲",min:2,max:17,method:"presencial",guide:"Observe mímica espontânea e, se houver colaboração, sorriso, fechar os olhos e inflar bochechas; avaliação sensitiva facial e mastigatória somente por examinador.",observe:"Simetria facial espontânea e voluntária; função trigeminal quando realmente examinada."},
  {id:"hearing",area:"neurologico",domain:"Pares cranianos VIII/IX/X/XII",title:"Eco das palavras",emoji:"👂",min:2,max:17,method:"presencial",guide:"Explore resposta auditiva funcional, qualidade vocal e movimentos de língua/palato se indicados e tolerados; suspeita de perda auditiva demanda audiologia.",observe:"Resposta auditiva, voz, deglutição relatada, língua e palato quando observados; teste de tela não substitui audiometria."},
  {id:"shoulders",area:"neurologico",domain:"Par craniano XI",title:"Superombros",emoji:"🦸",min:5,max:17,method:"presencial",guide:"Solicite elevação dos ombros e rotação da cabeça contra resistência graduada, somente se seguro; compare os lados.",observe:"Amplitude, simetria e força observadas, esforço/limitações."},
  {id:"posture",area:"neurologico",domain:"Tônus e postura",title:"Estátua e boneco de pano",emoji:"🗿",min:2,max:17,method:"presencial",guide:"Observe postura em repouso e movimento; profissional avalia mobilização passiva, resistência, movimentos anormais e assimetrias sem forçar articulações.",observe:"Tônus axial/apendicular, distonia, espasticidade, hipotonia, tremor ou assimetria — apenas se efetivamente examinados.",video:"utah"},
  {id:"strength2",area:"neurologico",domain:"Força e função motora",title:"Missão levantar e alcançar",emoji:"💪",min:2,max:5,method:"ludico",guide:"Convide a levantar-se do chão, alcançar brinquedo bilateralmente, agachar e voltar a ficar em pé, com supervisão contra quedas.",observe:"Uso dos dois lados, transferências, apoio de mãos, fadiga e compensações; não converter em grau de força."},
  {id:"strength6",area:"neurologico",domain:"Força e função motora",title:"Guardiões da força",emoji:"💪",min:6,max:17,method:"presencial",guide:"Examinador pesquisa força segmentar bilateral quando indicado, manobras antigravitárias, braços estendidos e eventuais assimetrias; usar técnica apropriada.",observe:"Grupos musculares realmente testados, força graduada se mensurada, queda/pronação, dor e colaboração."},
  {id:"reflex",area:"neurologico",domain:"Reflexos",title:"Escudo dos reflexos",emoji:"🛡️",min:2,max:17,method:"presencial",guide:"Com consentimento, martelo e técnica clínica, examine reflexos osteotendíneos comparativamente; reflexo plantar quando indicado. NÃO solicitar que a criança faça sozinha.",observe:"Quais reflexos foram testados, simetria, amplitude e resposta plantar; omitir achado se não examinado.",video:"utah"},
  {id:"sensation",area:"neurologico",domain:"Sensibilidade",title:"Mapa do toque",emoji:"🖐️",min:4,max:17,method:"presencial",guide:"Profissional investiga sensibilidade ao toque leve com estímulo seguro e comparações bilaterais; crianças menores podem responder por gesto. Evitar estímulos dolorosos desnecessários.",observe:"Modalidade e territórios realmente testados, respostas, confiabilidade e assimetrias."},
  {id:"reach2",area:"neurologico",domain:"Coordenação",title:"Pega a estrela",emoji:"⭐",min:2,max:5,method:"ludico",guide:"Ofereça alvo/brinquedo a diferentes posições e peça para tocá-lo com cada mão; observe pegar, soltar e pinça.",observe:"Dismetria, tremor de intenção, simetria, preensão e controle visuomotor sem inferir ataxia isoladamente.",video:"utah"},
  {id:"finger6",area:"neurologico",domain:"Coordenação",title:"Nariz do astronauta",emoji:"🚀",min:6,max:17,method:"presencial",guide:"Faça dedo–nariz alternando alvo e mão, movimentos alternados rápidos e, quando pertinente, calcanhar–joelho bilateralmente; ajuste ao desenvolvimento.",observe:"Dismetria, disdiadococinesia, tremor, decomposição e comparação bilateral.",video:"stanford"},
  {id:"gait2",area:"neurologico",domain:"Marcha e equilíbrio",title:"Trilha dos animais",emoji:"🐾",min:2,max:5,method:"ludico",guide:"Em espaço seguro, observe marcha espontânea, corrida breve e mudanças de direção. Se seguro, convide a contornar marcas e ficar em pé sem apoio.",observe:"Base de sustentação, simetria, quedas, postura e mudanças de direção. Não exigir tandem nesta faixa.",video:"utah"},
  {id:"gait6",area:"neurologico",domain:"Marcha e equilíbrio",title:"Ponte de equilíbrio",emoji:"🌉",min:6,max:17,method:"presencial",guide:"Examine marcha habitual, em pontas, calcanhares e tandem conforme segurança; saltar em um pé conforme capacidade, com supervisão.",observe:"Base, marcha, assimetria, equilíbrio estático/dinâmico, apoio, quedas; não interpretar dificuldade isolada como lesão.",video:"stanford"},
  {id:"growth",area:"neurologico",domain:"Observação geral",title:"Radar de sinais físicos",emoji:"📡",min:2,max:17,method:"presencial",guide:"Revisar perímetro cefálico quando pertinente e disponível, postura, assimetrias, alterações cutâneas neurocutâneas e sinais dismórficos. Fundo de olho só com exame apropriado.",observe:"Mensurações realmente realizadas e achados positivos/negativos pertinentes; não pressupor normalidade."},
  {id:"attention2",area:"mental",domain:"Atenção e regulação",title:"Foco do tesouro",emoji:"💎",min:2,max:5,method:"observacao",guide:"Durante brincadeira espontânea, observe sustentação e mudança de atenção, resposta a orientações e regulação após interrupção gentil.",observe:"Contexto, novidade, fadiga, atividade motora, intervenção necessária; sem cronometrias normativas."},
  {id:"attention6",area:"mental",domain:"Atenção e funções executivas",title:"Muda a regra!",emoji:"🔄",min:6,max:17,method:"ludico",guide:"Apresente uma regra simples de classificação e depois troque a regra com instrução clara e ensaio não pontuado; suspenda caso gere frustração.",observe:"Início da tarefa, compreensão da regra, flexibilidade, inibição, persistência, autocorreção e necessidade de ajuda."},
  {id:"memory6",area:"mental",domain:"Memória e orientação",title:"Mapa secreto",emoji:"🗺️",min:6,max:17,method:"entrevista",guide:"Pergunte contexto de lugar e momento em termos proporcionais à idade; retome conteúdo combinado minutos antes em conversa espontânea.",observe:"Orientação situacional, atenção ao registro, evocação, pistas e escolaridade; ausência de resposta não comprova desorientação."},
  {id:"emotion2",area:"mental",domain:"Humor e afeto",title:"Termômetro das emoções",emoji:"🌈",min:2,max:5,method:"observacao",guide:"Observe expressões, variação e congruência afetiva no brincar. Pergunte ao cuidador sobre humor, irritabilidade, medo e sono; relato separado da observação.",observe:"Humor referido pelo cuidador versus afeto observado, reatividade, intensidade, contexto e duração."},
  {id:"emotion6",area:"mental",domain:"Humor e afeto",title:"Clima emocional",emoji:"☀️",min:6,max:17,method:"entrevista",guide:"Pergunte como tem se sentido, o que mudou e como reage a situações difíceis; explore sintomas e prejuízo funcional com linguagem adaptada.",observe:"Humor subjetivo, afeto observado, congruência, ansiedade, irritabilidade, flutuação e fonte da informação."},
  {id:"thought6",area:"mental",domain:"Pensamento e percepção",title:"História sem atalhos",emoji:"🧠",min:6,max:17,method:"entrevista",guide:"Em diálogo reservado e apropriado, observe forma/curso do pensamento; investigue conteúdos incomuns ou experiências perceptivas apenas clinicamente e sem sugestionar.",observe:"Coerência, velocidade, associações, conteúdo referido, juízo de realidade; diferenciar fantasia infantil e crenças culturais."},
  {id:"insight9",area:"mental",domain:"Juízo crítico e insight",title:"Escolhas da vida real",emoji:"🧭",min:9,max:17,method:"entrevista",guide:"Converse sobre uma decisão cotidiana, consequências, apoio disponível e compreensão das próprias dificuldades.",observe:"Capacidade de reflexão e julgamento situada na idade e no contexto; não aplicar rótulos globais."},
  {id:"risk",area:"mental",domain:"Segurança clínica",title:"Conversa reservada de segurança",emoji:"🫶",min:8,max:17,method:"entrevista",guide:"Somente profissional: a partir dos 12 anos realizar rastreio com instrumento validado fora deste circuito; entre 8 e 11 anos, rastrear apenas com indicação clínica. Se houver sinais de alerta, investigar sofrimento intenso, autoagressão, ideação suicida, violência ou abuso em ambiente protegido e respeitando os limites legais da confidencialidade.",observe:"Registrar apenas informação clinicamente necessária no prontuário protegido; evitar detalhes identificáveis em exportação compartilhável.",safety:"Esta etapa NÃO é um jogo, não deve ser exibida como missão infantil, não substitui entrevista de risco nem protocolo de proteção. Risco atual demanda avaliação/intervenção clínica imediata."},
];
export function circuitForAge(years: number, area?: CircuitArea): CircuitTask[] {
  if (!Number.isInteger(years) || years < 2 || years > 17) return [];
  return CIRCUIT_TASKS.filter((task) => years >= task.min && years <= task.max && (!area || task.area === area));
}
export function buildCircuitReport(years: number, records: CircuitRecords, generalNote = "", at = new Date()): string {
  const tasks = circuitForAge(years);
  if (!tasks.length) return "Circuito não disponível para esta idade.";
  const entries = tasks.filter((task) => records[task.id]?.status);
  const text = [
    `SUPER NEUROPAD GAME — CIRCUITO CLÍNICO COMPLEMENTAR v${CIRCUIT_VERSION}`,
    "Registro observacional NÃO padronizado, sem escore, norma ou conclusão diagnóstica.",
    `Idade informada: ${years} anos | Emissão local: ${at.toLocaleString("pt-BR")}`,
    `Estações registradas: ${entries.length}/${tasks.length}. As demais NÃO foram examinadas.`,
    "A execução de tarefas digitais não equivale ao exame neurológico físico presencial.",
    "",
  ];
  for (const area of ["neurologico","mental"] as const) {
    text.push(area === "neurologico" ? "EXAME NEUROLÓGICO BÁSICO — TAREFAS/OBSERVAÇÕES" : "EXAME DO ESTADO MENTAL INFANTOJUVENIL — TAREFAS/OBSERVAÇÕES");
    for (const task of entries.filter((entry) => entry.area === area)) {
      const record = records[task.id];
      text.push(`• ${task.domain} — ${task.title} [${CIRCUIT_METHODS[task.method]}]: ${CIRCUIT_STATUSES[record.status]}.`);
      if (record.note.trim()) text.push(`  Descrição do examinador: ${record.note.trim()}`);
      else if (record.status === "observado" || record.status === "achado") text.push("  Descrição específica não fornecida; não inferir normalidade ou alteração.");
    }
    if (!entries.some((entry) => entry.area === area)) text.push("Não registrado.");
    text.push("");
  }
  if (generalNote.trim()) text.push("Observações adicionais do examinador: " + generalNote.trim());
  text.push("Sem gravação de vídeo, transmissão ou salvamento automático. Revisão clínica obrigatória antes de incorporar ao prontuário.");
  return text.join("\n");
}
