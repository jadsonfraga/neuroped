/**
 * Circuito clínico complementar do Super NeuroPad Game.
 * Somente apoio à observação do médico: sem escore, corte, interpretação automática,
 * armazenamento local, acesso à câmera ou alteração da bateria principal.
 * Estações `presencial` nunca podem ser inferidas por resposta de tela.
 */
export const CIRCUIT_VERSION = "2026-10-20.2";
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
export type CircuitSource = "examinador" | "cuidador" | "escola" | "outra";
export interface CircuitEntry { status: CircuitStatus; note: string; source?: CircuitSource }
export const CIRCUIT_SOURCES: Record<CircuitSource,string> = {
  examinador: "Observação direta pelo examinador",
  cuidador: "Relato do cuidador",
  escola: "Relato escolar",
  outra: "Outra fonte (identificar a proveniência na nota)",
};
export const CIRCUIT_URGENCY_NOTE = "Rebaixamento da consciência, convulsão em curso ou recente, rigidez de nuca com febre, déficit focal de início agudo, papiledema, cefaleia súbita e intensa ou risco imediato: interromper o circuito e seguir o protocolo de urgência.";
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
  {id:"consciencia",area:"neurologico",domain:"Nível de consciência e alerta",title:"Modo alerta",emoji:"🔔",min:2,max:17,method:"observacao",guide:"Durante o acolhimento e as tarefas, observe o nível de alerta, a responsividade a comandos verbais, o contato com o ambiente e a sonolência. Não use estímulos dolorosos para esta observação.",observe:"Alerta, sonolência, irritabilidade, responsividade e flutuação ao longo do circuito; rebaixamento agudo é achado de urgência."},
  {id:"language2",area:"neurologico",domain:"Linguagem",title:"Descubra e conte",emoji:"🗣️",min:2,max:5,method:"ludico",guide:"Peça para apontar, nomear, compreender comandos simples e relatar algo por fala ou comunicação alternativa; escolha demandas conforme habilidades.",observe:"Compreensão, expressão, articulação, inteligibilidade, gestos e comunicação alternativa; não pontuar por número fixo de palavras.",video:"utah"},
  {id:"language6",area:"neurologico",domain:"Linguagem",title:"Narrador da aventura",emoji:"📖",min:6,max:17,method:"ludico",guide:"Peça descrição de sequência cotidiana e execução de instrução de múltiplas etapas adequada à escolarização; leitura apenas quando alfabetizado.",observe:"Fluência, compreensão, nomeação, repetição, prosódia, disartria ou sinais afásicos quando pertinentes."},
  {id:"vision",area:"neurologico",domain:"Pares cranianos II/III/IV/VI",title:"Olhos do cometa",emoji:"👀",min:2,max:17,method:"presencial",guide:"Examinador verifica fixação, seguimento, alinhamento e movimentos oculares em diferentes direções; avalia pupilas/reflexos luminosos com técnica apropriada e compara lados.",observe:"Fixação, nistagmo, estrabismo, limitação ocular, anisocoria, fotorreação. Tarefa digital NÃO mede acuidade, campos ou fundo de olho."},
  {id:"fundus",area:"neurologico",domain:"Par II e fundo de olho",title:"Janela do fundo",emoji:"🔭",min:2,max:17,method:"presencial",guide:"Com oftalmoscópio e técnica apropriada à idade, o examinador observa disco óptico, bordas e vasos quando a criança tolera o exame. Se não for possível, registre o motivo como não realizado.",observe:"Bordas e elevação do disco óptico, vasos e mácula quando visíveis; papiledema ou assimetria devem ser esclarecidos antes de qualquer conclusão.",safety:"Papiledema, cefaleia matinal com vômitos, rebaixamento de consciência ou déficit focal agudo: não prossiga o circuito e siga o protocolo de urgência."},
  {id:"face",area:"neurologico",domain:"Pares cranianos V/VII",title:"Careta do dragão",emoji:"🐲",min:2,max:17,method:"presencial",guide:"Observe mímica espontânea e, se houver colaboração, sorriso, fechar os olhos e inflar bochechas; avaliação sensitiva facial e mastigatória somente por examinador.",observe:"Simetria facial espontânea e voluntária; função trigeminal quando realmente examinada."},
  {id:"hearing",area:"neurologico",domain:"Pares cranianos VIII/IX/X/XII",title:"Eco das palavras",emoji:"👂",min:2,max:17,method:"presencial",guide:"Explore resposta auditiva funcional, qualidade vocal e movimentos de língua/palato se indicados e tolerados; suspeita de perda auditiva demanda audiologia.",observe:"Resposta auditiva, voz, deglutição relatada, língua e palato quando observados; teste de tela não substitui audiometria."},
  {id:"shoulders",area:"neurologico",domain:"Par craniano XI",title:"Superombros",emoji:"🦸",min:5,max:17,method:"presencial",guide:"Solicite elevação dos ombros e rotação da cabeça contra resistência graduada, somente se seguro; compare os lados.",observe:"Amplitude, simetria e força observadas, esforço/limitações."},
  {id:"meningeal",area:"neurologico",domain:"Sinais meníngeos",title:"Nuca em alerta",emoji:"🚨",min:2,max:17,method:"presencial",guide:"Quando indicado e sem sinais de urgência, o examinador avalia rigidez de nuca com flexão passiva suave, sem forçar, e manobras de irritação meníngea conforme idade e colaboração. Não execute com dor intensa ou suspeita de trauma cervical.",observe:"Resistência à flexão cervical, dor referida, colaboração e relação com febre ou alteração de consciência.",safety:"Rigidez de nuca com febre, confusão, convulsão ou prostração é emergência: interrompa o circuito e acione atendimento de urgência imediatamente."},
  {id:"posture",area:"neurologico",domain:"Tônus e postura",title:"Estátua e boneco de pano",emoji:"🗿",min:2,max:17,method:"presencial",guide:"Observe postura em repouso e movimento; profissional avalia mobilização passiva, resistência, movimentos anormais e assimetrias sem forçar articulações.",observe:"Tônus axial/apendicular, distonia, espasticidade, hipotonia, tremor ou assimetria — apenas se efetivamente examinados.",video:"utah"},
  {id:"strength2",area:"neurologico",domain:"Força e função motora",title:"Missão levantar e alcançar",emoji:"💪",min:2,max:5,method:"ludico",guide:"Convide a levantar-se do chão, alcançar brinquedo bilateralmente, agachar e voltar a ficar em pé, com supervisão contra quedas.",observe:"Uso dos dois lados, transferências, apoio de mãos, fadiga e compensações; não converter em grau de força."},
  {id:"strength2p",area:"neurologico",domain:"Força e função motora",title:"Empurra e levanta",emoji:"🤸",min:2,max:5,method:"presencial",guide:"Com supervisão, peça para empurrar e puxar o examinador ou um brinquedo, levantar-se do chão e subir em um degrau. Faça resistência gentil e graduada, comparando os dois lados.",observe:"Grupos musculares solicitados, simetria, esforço, fadiga, quedas e uso de apoio; força graduada só quando efetivamente testada pelo examinador."},
  {id:"strength6",area:"neurologico",domain:"Força e função motora",title:"Guardiões da força",emoji:"💪",min:6,max:17,method:"presencial",guide:"Examinador pesquisa força segmentar bilateral quando indicado, manobras antigravitárias, braços estendidos e eventuais assimetrias; usar técnica apropriada.",observe:"Grupos musculares realmente testados, força graduada se mensurada, queda/pronação, dor e colaboração."},
  {id:"reflex",area:"neurologico",domain:"Reflexos",title:"Escudo dos reflexos",emoji:"🛡️",min:2,max:17,method:"presencial",guide:"Com consentimento, martelo e técnica clínica, examine reflexos osteotendíneos comparativamente; reflexo plantar quando indicado. NÃO solicitar que a criança faça sozinha.",observe:"Quais reflexos foram testados, simetria, amplitude e resposta plantar; omitir achado se não examinado.",video:"utah"},
  {id:"sensation",area:"neurologico",domain:"Sensibilidade",title:"Mapa do toque",emoji:"🖐️",min:4,max:17,method:"presencial",guide:"Profissional investiga sensibilidade ao toque leve com estímulo seguro e comparações bilaterais; crianças menores podem responder por gesto. Evitar estímulos dolorosos desnecessários.",observe:"Modalidade e territórios realmente testados, respostas, confiabilidade e assimetrias."},
  {id:"stereognosis",area:"neurologico",domain:"Sensibilidade",title:"Caixa surpresa",emoji:"🎁",min:5,max:17,method:"presencial",guide:"Com os olhos fechados, a criança identifica objetos familiares e seguros, colocados em uma das mãos e depois na outra. Use objetos neutros, sem peças pequenas que representem risco de engasgo.",observe:"Reconhecimento do objeto, comparação entre as mãos, erros e tempo de resposta descrito; falha isolada não define lesão cortical e exige correlação com a sensibilidade primária."},
  {id:"reach2",area:"neurologico",domain:"Coordenação",title:"Pega a estrela",emoji:"⭐",min:2,max:5,method:"ludico",guide:"Ofereça alvo/brinquedo a diferentes posições e peça para tocá-lo com cada mão; observe pegar, soltar e pinça.",observe:"Dismetria, tremor de intenção, simetria, preensão e controle visuomotor sem inferir ataxia isoladamente.",video:"utah"},
  {id:"dismetria2",area:"neurologico",domain:"Coordenação",title:"Ponto-alvo",emoji:"🎯",min:2,max:5,method:"presencial",guide:"Use um brinquedo como alvo. O examinador pede para tocar o alvo com cada mão, em posições diferentes, e observa aproximação, correção e tremor durante o movimento. Avise antes de mudar o alvo de lugar.",observe:"Dismetria, tremor de intenção, precisão, comparação entre os lados e correção durante o movimento; não infira ataxia apenas por tarefa lúdica."},
  {id:"finger6",area:"neurologico",domain:"Coordenação",title:"Nariz do astronauta",emoji:"🚀",min:6,max:17,method:"presencial",guide:"Faça dedo–nariz alternando alvo e mão, movimentos alternados rápidos e, quando pertinente, calcanhar–joelho bilateralmente; ajuste ao desenvolvimento.",observe:"Dismetria, disdiadococinesia, tremor, decomposição e comparação bilateral.",video:"stanford"},
  {id:"gait2",area:"neurologico",domain:"Marcha e equilíbrio",title:"Trilha dos animais",emoji:"🐾",min:2,max:5,method:"ludico",guide:"Em espaço seguro, observe marcha espontânea, corrida breve e mudanças de direção. Se seguro, convide a contornar marcas e ficar em pé sem apoio.",observe:"Base de sustentação, simetria, quedas, postura e mudanças de direção. Não exigir tandem nesta faixa.",video:"utah"},
  {id:"romberg",area:"neurologico",domain:"Marcha e equilíbrio",title:"Estátua de olhos fechados",emoji:"🧍",min:4,max:17,method:"presencial",guide:"Com supervisão próxima e sem risco de queda, peça para ficar em pé com os pés juntos e os braços ao lado, primeiro de olhos abertos e depois de olhos fechados, por alguns segundos. Interrompa ao primeiro sinal de insegurança.",observe:"Oscilação, passos de correção, necessidade de apoio e diferença entre olhos abertos e fechados; oscilação isolada não deve ser interpretada como lesão."},
  {id:"gait6",area:"neurologico",domain:"Marcha e equilíbrio",title:"Ponte de equilíbrio",emoji:"🌉",min:6,max:17,method:"presencial",guide:"Examine marcha habitual, em pontas, calcanhares e tandem conforme segurança; saltar em um pé conforme capacidade, com supervisão.",observe:"Base, marcha, assimetria, equilíbrio estático/dinâmico, apoio, quedas; não interpretar dificuldade isolada como lesão.",video:"stanford"},
  {id:"involuntary",area:"neurologico",domain:"Movimentos involuntários",title:"Movimento sem comando",emoji:"🌀",min:2,max:17,method:"observacao",guide:"Observe em repouso, durante a brincadeira, ao manter os braços estendidos e ao executar tarefas. Diferencie tiques (intermitentes, muitas vezes suprimíveis) de tremor, coreia, distonia e mioclonias.",observe:"Tipo, localização, frequência, gatilhos, piora com a intenção ou com a atenção, supressão voluntária e início; relato do cuidador deve ser registrado como fonte separada."},
  {id:"praxis3",area:"neurologico",domain:"Praxias e imitação",title:"Espelho dos gestos",emoji:"🪞",min:3,max:5,method:"ludico",guide:"Mostre gestos simples, como acenar, bater palmas, tocar o nariz ou mostrar o polegar, e peça para imitar como num jogo de espelho. Repita a demonstração uma vez se necessário.",observe:"Imitação com as duas mãos, precisão, sequência e necessidade de modelo; separe dificuldade de imitação de falta de compreensão da instrução."},
  {id:"praxis6",area:"neurologico",domain:"Praxias e imitação",title:"Sequência secreta",emoji:"🕵️",min:6,max:17,method:"ludico",guide:"Mostre uma sequência de três gestos, com gestos simbólicos (como dar tchau ou pentear o cabelo) e gestos com as duas mãos, e peça para repetir de memória e por imitação espelhada.",observe:"Imitação espelhada versus direta, planejamento e sequência, uso dos dois lados e autocorreção; diferencie apraxia de atenção reduzida ou dificuldade de compreensão."},
  {id:"copy6",area:"neurologico",domain:"Praxia construtiva",title:"Desenho do modelo",emoji:"✏️",min:5,max:17,method:"ludico",guide:"Peça para copiar figuras simples (círculo, cruz, quadrado, losango e um cubo simples) no papel, com lápis, sem apagar. Use apenas figuras autorais, nunca instrumentos licenciados de avaliação.",observe:"Forma, proporção, rotação, posição relativa e ordem dos traços, lado usado e necessidade de modelo; discuta com a escrita e com o exame motor direto antes de concluir."},
  {id:"hand",area:"neurologico",domain:"Lateralidade manual",title:"Mão de capitão",emoji:"✋",min:2,max:17,method:"observacao",guide:"Durante as tarefas, observe com qual mão a criança pega, aponta, desenha e manipula objetos. Proponha uma tarefa bimanual, como segurar um objeto com uma mão e manipular com a outra, quando possível.",observe:"Preferência observada em mais de uma tarefa, troca de mão, uso da mão menos preferida e coordenação bimanual; em crianças pequenas, não rotule lateralidade ainda em definição."},
  {id:"milestones",area:"neurologico",domain:"Desenvolvimento neuropsicomotor",title:"Linha do tempo da aventura",emoji:"📅",min:2,max:17,method:"entrevista",guide:"Pergunte ao cuidador, com a fonte identificada, sobre as idades de sentar, andar, falar as primeiras palavras e formar frases, além de habilidades motoras e escolares. Investigue perdas de habilidades e mudanças recentes.",observe:"Idades aproximadas relatadas, fonte da informação, ritmo ao longo do tempo, perda de habilidades (sinal a esclarecer) e lacunas; relato não equivale a exame direto."},
  {id:"growth",area:"neurologico",domain:"Observação geral",title:"Radar de sinais físicos",emoji:"📡",min:2,max:17,method:"presencial",guide:"Revisar perímetro cefálico quando pertinente e disponível, postura, assimetrias, alterações cutâneas neurocutâneas e sinais dismórficos. Fundo de olho só com exame apropriado.",observe:"Mensurações realmente realizadas e achados positivos/negativos pertinentes; não pressupor normalidade."},
  {id:"attention2",area:"mental",domain:"Atenção e regulação",title:"Foco do tesouro",emoji:"💎",min:2,max:5,method:"observacao",guide:"Durante brincadeira espontânea, observe sustentação e mudança de atenção, resposta a orientações e regulação após interrupção gentil.",observe:"Contexto, novidade, fadiga, atividade motora, intervenção necessária; sem cronometrias normativas."},
  {id:"attention6",area:"mental",domain:"Atenção e funções executivas",title:"Muda a regra!",emoji:"🔄",min:6,max:17,method:"ludico",guide:"Apresente uma regra simples de classificação e depois troque a regra com instrução clara e ensaio não pontuado; suspenda caso gere frustração.",observe:"Início da tarefa, compreensão da regra, flexibilidade, inibição, persistência, autocorreção e necessidade de ajuda."},
  {id:"memory6",area:"mental",domain:"Memória e orientação",title:"Mapa secreto",emoji:"🗺️",min:6,max:17,method:"entrevista",guide:"Pergunte contexto de lugar e momento em termos proporcionais à idade; retome conteúdo combinado minutos antes em conversa espontânea.",observe:"Orientação situacional, atenção ao registro, evocação, pistas e escolaridade; ausência de resposta não comprova desorientação."},
  {id:"emotion2",area:"mental",domain:"Humor e afeto",title:"Termômetro das emoções",emoji:"🌈",min:2,max:5,method:"observacao",guide:"Observe expressões, variação e congruência afetiva no brincar. Pergunte ao cuidador sobre humor, irritabilidade, medo e sono; relato separado da observação.",observe:"Humor referido pelo cuidador versus afeto observado, reatividade, intensidade, contexto e duração."},
  {id:"emotion6",area:"mental",domain:"Humor e afeto",title:"Clima emocional",emoji:"☀️",min:6,max:17,method:"entrevista",guide:"Pergunte como tem se sentido, o que mudou e como reage a situações difíceis; explore sintomas e prejuízo funcional com linguagem adaptada.",observe:"Humor subjetivo, afeto observado, congruência, ansiedade, irritabilidade, flutuação e fonte da informação."},
  {id:"sleep",area:"mental",domain:"Funções neurovegetativas",title:"Rotina de sono e energia",emoji:"😴",min:2,max:17,method:"entrevista",guide:"Pergunte sobre horário e qualidade do sono, despertares, pesadelos, roncos ou pausas na respiração durante o sono, apetite, energia durante o dia e rotina escolar. Pergunte também à criança, quando adequado.",observe:"Relato por fonte identificada: continuidade do sono, roncos ou pausas respiratórias, sonolência diurna, apetite e mudanças recentes; não atribua causa sem avaliação."},
  {id:"thought6",area:"mental",domain:"Pensamento e percepção",title:"História sem atalhos",emoji:"🧠",min:6,max:17,method:"entrevista",guide:"Em diálogo reservado e apropriado, observe forma/curso do pensamento; investigue conteúdos incomuns ou experiências perceptivas apenas clinicamente e sem sugestionar.",observe:"Coerência, velocidade, associações, conteúdo referido, juízo de realidade; diferenciar fantasia infantil e crenças culturais."},
  {id:"insight9",area:"mental",domain:"Juízo crítico e insight",title:"Escolhas da vida real",emoji:"🧭",min:9,max:17,method:"entrevista",guide:"Converse sobre uma decisão cotidiana, consequências, apoio disponível e compreensão das próprias dificuldades.",observe:"Capacidade de reflexão e julgamento situada na idade e no contexto; não aplicar rótulos globais."},
  {id:"risk",area:"mental",domain:"Segurança clínica",title:"Conversa reservada de segurança",emoji:"🫶",min:8,max:17,method:"entrevista",guide:"Somente profissional: a partir dos 12 anos realizar rastreio com instrumento validado fora deste circuito; entre 8 e 11 anos, rastrear apenas com indicação clínica. Se houver indicadores de risco, investigar sofrimento intenso, autoagressão, ideação suicida, violência ou abuso em ambiente protegido e respeitando os limites legais da confidencialidade.",observe:"Registrar apenas informação clinicamente necessária no prontuário protegido; evitar detalhes identificáveis em exportação compartilhável.",safety:"Esta etapa NÃO é um jogo, não deve ser exibida como missão infantil, não substitui entrevista de risco nem protocolo de proteção. Risco atual demanda avaliação/intervenção clínica imediata."},
];
export function circuitForAge(years: number, area?: CircuitArea): CircuitTask[] {
  if (!Number.isInteger(years) || years < 2 || years > 17) return [];
  return CIRCUIT_TASKS.filter((task) => years >= task.min && years <= task.max && (!area || task.area === area));
}
/**
 * Cobertura: registra o que foi examinado. Não pontua, não compara com norma e não transforma
 * ausência de registro em normalidade. Domínio `presencial` só conta com estação de exame direto.
 */
export type CoverageStatus = "sem_estacao" | "pendente" | "parcial" | "registrado" | "esclarecer" | "nao_obtido";
export interface CoverageDomain { id: string; label: string; stations: readonly string[]; presencial: boolean }
export const COVERAGE_LABELS: Record<CoverageStatus,string> = {
  sem_estacao: "Sem estação nesta faixa — exame direto se indicado",
  pendente: "Pendente — não registrado",
  parcial: "Parcial — apenas tarefa lúdica ou relato, sem exame direto",
  registrado: "Registrado — descrição obrigatória; não equivale a normal",
  esclarecer: "Achado a esclarecer",
  nao_obtido: "Não realizado ou sem colaboração",
};
export const NEURO_BASIC_DOMAINS: readonly CoverageDomain[] = [
  {id:"alerta",label:"Nível de consciência e alerta",stations:["consciencia"],presencial:false},
  {id:"par2",label:"Par II — fundo de olho",stations:["fundus"],presencial:true},
  {id:"oculomotores",label:"Pares III, IV e VI — movimentos oculares e pupilas",stations:["vision"],presencial:true},
  {id:"par5_7",label:"Pares V e VII — sensibilidade e mímica facial",stations:["face"],presencial:true},
  {id:"pares8_12",label:"Pares VIII, IX, X e XII — audição, voz, deglutição e língua",stations:["hearing"],presencial:true},
  {id:"par11",label:"Par XI — esternocleidomastóideo e trapézio",stations:["shoulders"],presencial:true},
  {id:"meninges",label:"Sinais meníngeos",stations:["meningeal"],presencial:true},
  {id:"linguagem",label:"Fala e linguagem",stations:["language2","language6"],presencial:false},
  {id:"tonus",label:"Tônus e postura",stations:["posture"],presencial:true},
  {id:"forca",label:"Força muscular",stations:["strength2","strength2p","strength6"],presencial:true},
  {id:"reflexos",label:"Reflexos",stations:["reflex"],presencial:true},
  {id:"sensibilidade",label:"Sensibilidade e estereognosia",stations:["sensation","stereognosis"],presencial:true},
  {id:"coordenacao",label:"Coordenação e dismetria",stations:["reach2","dismetria2","finger6"],presencial:true},
  {id:"marcha",label:"Marcha e equilíbrio",stations:["gait2","romberg","gait6"],presencial:false},
  {id:"involuntarios",label:"Movimentos involuntários",stations:["involuntary"],presencial:false},
  {id:"praxias",label:"Praxias e praxia construtiva",stations:["praxis3","praxis6","copy6"],presencial:false},
  {id:"lateralidade",label:"Lateralidade e bimanualidade",stations:["hand"],presencial:false},
  {id:"crescimento",label:"Perímetro cefálico e sinais físicos",stations:["growth"],presencial:true},
  {id:"desenvolvimento",label:"Marcos do desenvolvimento (relato)",stations:["milestones"],presencial:false},
];
export const MSE_SECTIONS: readonly CoverageDomain[] = [
  {id:"aparencia",label:"Aparência, comportamento e atitude",stations:["rapport","social2"],presencial:false},
  {id:"psicomotor",label:"Atividade psicomotora e atenção",stations:["rapport","attention2"],presencial:false},
  {id:"fala",label:"Fala e linguagem",stations:["conversation6","language2","language6"],presencial:false},
  {id:"humor",label:"Humor e afeto",stations:["emotion2","emotion6"],presencial:false},
  {id:"pensamento",label:"Pensamento e percepção",stations:["thought6"],presencial:false},
  {id:"cognicao",label:"Cognição: atenção, memória, orientação e funções executivas",stations:["attention2","attention6","memory6"],presencial:false},
  {id:"juizo",label:"Juízo crítico e insight",stations:["insight9"],presencial:false},
  {id:"neurovegetativo",label:"Funções neurovegetativas e rotina (relato)",stations:["sleep"],presencial:false},
  {id:"seguranca",label:"Segurança — entrevista reservada, somente profissional",stations:["risk"],presencial:false},
];
/** Demonstrações animadas curtas, usadas apenas quando o texto da estação não basta. Sem gravação de pessoas. */
export type CircuitDemo = "seguimento" | "romberg" | "tandem" | "dedo-nariz";
export const STATION_DEMO: Partial<Record<string, CircuitDemo>> = {
  vision: "seguimento",
  romberg: "romberg",
  gait6: "tandem",
  finger6: "dedo-nariz",
  dismetria2: "dedo-nariz",
};
export function coverageStatus(domain: CoverageDomain, years: number, records: CircuitRecords): CoverageStatus {
  const stations = circuitForAge(years).filter((task) => domain.stations.includes(task.id));
  if (!stations.length) return "sem_estacao";
  const statusOf = (id: string) => records[id]?.status;
  const filled = stations.filter((task) => statusOf(task.id) === "observado" || statusOf(task.id) === "achado");
  if (filled.some((task) => statusOf(task.id) === "achado")) return "esclarecer";
  if (filled.some((task) => !domain.presencial || task.method === "presencial")) return "registrado";
  if (filled.length) return "parcial";
  if (stations.some((task) => statusOf(task.id) === "nao_realizado" || statusOf(task.id) === "nao_colaborou")) return "nao_obtido";
  return "pendente";
}
function coverageSection(title: string, domains: readonly CoverageDomain[], years: number, records: CircuitRecords): string[] {
  const rows = domains.map((domain) => {
    const titles = circuitForAge(years).filter((task) => domain.stations.includes(task.id)).map((task) => task.title);
    return `• ${domain.label}: ${COVERAGE_LABELS[coverageStatus(domain, years, records)]}${titles.length ? ` (${titles.join("; ")})` : ""}.`;
  });
  return [title, ...rows, ""];
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
      text.push(`  Fonte: ${record.source ? CIRCUIT_SOURCES[record.source] : "não informada — registrar antes de incorporar ao prontuário"}.`);
      if (record.note.trim()) text.push(`  Descrição do examinador: ${record.note.trim()}`);
      else if (record.status === "observado" || record.status === "achado") text.push("  Descrição específica não fornecida; não inferir normalidade ou alteração.");
    }
    if (!entries.some((entry) => entry.area === area)) text.push("Não registrado.");
    text.push("");
  }
  text.push(...coverageSection("COBERTURA DO EXAME NEUROLÓGICO BÁSICO POR DOMÍNIO — lacunas não significam normalidade", NEURO_BASIC_DOMAINS, years, records));
  text.push(...coverageSection("COBERTURA DAS SEÇÕES DO EXAME DO ESTADO MENTAL", MSE_SECTIONS, years, records));
  text.push("Múltiplas fontes: registre a origem de cada achado. Concordância ou divergência entre fontes é informação clínica, não consenso automático.");
  text.push(`Sinais de urgência: ${CIRCUIT_URGENCY_NOTE}`, "");
  if (generalNote.trim()) text.push("Observações adicionais do examinador: " + generalNote.trim());
  text.push("Sem gravação de vídeo, transmissão ou salvamento automático. Revisão clínica obrigatória antes de incorporar ao prontuário.");
  return text.join("\n");
}
