// Instrumentos autorais NeuroPed — epilepsia, cefaleia e paralisia cerebral (itens originais; ver authorialKit.ts).
import { authorial, INTENS4, IMPACT4 } from "./authorialKit";
import type { OpenScaleSpec } from "./openScaleKit";

const MOB = ["Não faz", "Só com ajuda de adulto", "Com dispositivo (andador, muletas, cadeira)", "Sozinho(a), sem apoio"];

export const neuroFuncaoSpecs: OpenScaleSpec[] = [
  authorial({
    wave: 2, id: "na-efeitos-antiepilepticos-pais", name: "Efeitos dos antiepilépticos (pais)", fullName: "Efeitos percebidos do tratamento antiepiléptico — relato dos pais",
    construct: "monitorização de efeitos adversos cognitivos, comportamentais e físicos de antiepilépticos", ageMin: 24, ageMax: 216, queixas: ["epilepsia", "efeitos"], respondente: ["pais"],
    applicationMode: "questionario_pais", assessmentUse: "seguimento", prioridade: "monitorizacao", tempo: "3–5 min", primaryDomain: "epilepsia", overlapGroup: "na-aep-pais",
    signalTags: ["efeitos do antiepiléptico", "sonolência com anticonvulsivante", "irritabilidade com anticonvulsivante", "lentidão", "tontura", "queda de rendimento escolar"],
    description: "Pergunta aos pais, em linguagem simples, o quanto o remédio para crises parece causar sono, lentidão, irritação, desatenção ou mal-estar.",
    instruction: "Pense nas últimas 4 semanas. Marque o quanto cada situação aconteceu ou incomodou a criança/adolescente.",
    labels: INTENS4,
    blocks: [
      { name: "Atenção e pensamento", items: ["Parece mais lento(a) para entender ou responder.", "Esquece com facilidade o que acabou de ser dito.", "Tem mais dificuldade de se concentrar nas tarefas.", "O rendimento escolar caiu em relação ao que a família esperava."] },
      { name: "Humor e comportamento", items: ["Ficou mais irritado(a) ou agressivo(a).", "Chora ou se entristece com mais facilidade.", "Parece agitado(a) ou com sono desregulado."] },
      { name: "Corpo", items: ["Sente sono durante o dia.", "Reclama de tontura, visão dupla ou desequilíbrio.", "Tem enjoo, dor de barriga ou mudança de apetite.", "Apresentou manchas na pele, queda de cabelo ou ganho de peso que preocupou a família."] },
    ],
    extraInfo: "Não decide dose nem suspensão. Nunca suspender antiepiléptico por conta própria; erupção na pele com febre ou mal-estar intenso exige avaliação imediata.",
  }),
  authorial({
    wave: 2, id: "na-qualidade-vida-epilepsia", name: "Qualidade de vida na epilepsia", fullName: "Impacto da epilepsia na vida diária — relato dos pais",
    construct: "qualidade de vida relacionada à saúde em crianças com epilepsia", ageMin: 24, ageMax: 216, queixas: ["epilepsia", "funcionalidade"], respondente: ["pais"],
    applicationMode: "questionario_pais", assessmentUse: "seguimento", prioridade: "monitorizacao", tempo: "4–6 min", primaryDomain: "epilepsia", overlapGroup: "na-qol-epi", higherBetter: false, labels: IMPACT4,
    signalTags: ["qualidade de vida na epilepsia", "medo de nova crise", "restrição de atividades", "preconceito com epilepsia", "crises e escola", "superproteção"],
    description: "O quanto a epilepsia e o seu tratamento atrapalham escola, brincadeiras, sono, humor e a vida da família. Maior pontuação = maior impacto.",
    instruction: "Pense nas últimas 4 semanas e marque o quanto cada situação atrapalhou a vida da criança/adolescente.",
    blocks: [
      { name: "Atividades e escola", items: ["O medo de crises limitou brincadeiras, passeios ou esportes.", "Faltas ou saídas antecipadas da escola por causa da epilepsia.", "A criança foi tratada de forma diferente por colegas ou professores por causa das crises."] },
      { name: "Emoções", items: ["A criança demonstrou vergonha ou medo de ter crise em público.", "Houve tristeza ou preocupação ligada às crises ou aos remédios.", "A criança tem dificuldade de dormir sozinha por medo de crise."] },
      { name: "Família", items: ["A família vive em alerta constante por causa das crises.", "A epilepsia gerou conflitos ou privações na rotina de casa.", "Senti dificuldade de explicar a epilepsia para outras pessoas."] },
    ],
  }),
  authorial({
    wave: 3, id: "na-mobilidade-funcional-pc", name: "Mobilidade funcional na PC", fullName: "Como a criança se desloca em casa, na escola e na comunidade",
    construct: "mobilidade funcional em diferentes ambientes na paralisia cerebral", ageMin: 36, ageMax: 216, queixas: ["pc", "motor", "funcionalidade"], respondente: ["pais"],
    applicationMode: "questionario_pais", assessmentUse: "seguimento", prioridade: "monitorizacao", tempo: "2–3 min", primaryDomain: "pc", overlapGroup: "na-mobilidade-pc", higherBetter: true, labels: MOB,
    signalTags: ["anda com andador", "cadeira de rodas", "mobilidade na escola", "mobilidade na rua", "marcha", "paralisia cerebral função"],
    description: "Para cada ambiente, como a criança se desloca hoje. Descreve a função; não substitui classificação funcional formal nem avaliação da fisioterapia.",
    instruction: "Marque a opção que melhor descreve como a criança se desloca em cada situação, no dia a dia (não no melhor dia).",
    blocks: [
      { name: "Distâncias e ambientes", items: ["Dentro de casa, de um cômodo a outro.", "No pátio, na quadra ou nos corredores da escola.", "Na rua, em calçada plana, por cerca de 50 a 100 metros.", "Em piso irregular, rampa, grama ou terra.", "Para subir e descer degraus ou escadas.", "Em lugares cheios (feira, ônibus, shopping, ponto de ônibus)."] },
    ],
    extraInfo: "Registrar se usa órtese, andador ou cadeira em cada cenário; a opção 'com dispositivo' vale para qualquer equipamento prescrito.",
  }),
  authorial({
    wave: 3, id: "na-funcao-pc-pais", name: "Função diária na PC (pais)", fullName: "Autocuidado e participação em casa de criança com paralisia cerebral — relato dos pais",
    construct: "desempenho em atividades diárias (autocuidado, comunicação, brincar) na paralisia cerebral", ageMin: 24, ageMax: 216, queixas: ["pc", "funcionalidade", "autonomia"], respondente: ["pais"],
    applicationMode: "questionario_pais", assessmentUse: "seguimento", prioridade: "monitorizacao", tempo: "4–6 min", primaryDomain: "pc", overlapGroup: "na-funcao-pc", higherBetter: true, labels: ["Ainda não faz", "Faz com muita ajuda", "Faz com pouca ajuda", "Faz sozinho(a)"],
    signalTags: ["autocuidado na paralisia cerebral", "alimentar-se sozinho", "vestir-se", "higiene", "comunicação funcional", "brincar"],
    description: "O que a criança com paralisia cerebral já faz sozinha ou com ajuda em casa. Mostra mudanças ao longo do tempo para ajustar metas de terapia.",
    instruction: "Marque o quanto a criança faz cada atividade hoje, considerando o apoio que a família realmente dá no dia a dia.",
    blocks: [
      { name: "Alimentação e higiene", items: ["Comer e beber.", "Escovar os dentes.", "Usar o banheiro ou comunicar a necessidade.", "Tomar banho."] },
      { name: "Vestir, mover-se e comunicar", items: ["Vestir e tirar a roupa.", "Mudar de posição e se transferir (cama, cadeira, sofá).", "Comunicar o que quer e o que sente.", "Brincar com outras crianças ou com a família."] },
    ],
  }),
  authorial({
    wave: 3, id: "na-funcao-pc-escola-professor", name: "Participação escolar na PC (professor)", fullName: "Participação escolar de aluno com paralisia cerebral — relato do professor",
    construct: "participação e acessibilidade escolar de estudantes com deficiência motora", ageMin: 36, ageMax: 216, queixas: ["pc", "funcionalidade", "aprendizagem"], respondente: ["professor"],
    applicationMode: "questionario_professor", assessmentUse: "seguimento", prioridade: "monitorizacao", tempo: "3–5 min", primaryDomain: "pc", overlapGroup: "na-funcao-pc-escola", higherBetter: true, labels: ["Nunca", "Às vezes", "Frequentemente", "Sempre"],
    signalTags: ["participação escolar", "acessibilidade na escola", "aluno com paralisia cerebral", "atendimento educacional especializado", "adaptação de atividades"],
    description: "O professor informa se o aluno participa das atividades da turma, se há acessibilidade e se há apoio pedagógico. Maior pontuação = mais participação.",
    instruction: "Pense nas últimas 4 semanas de aula e marque com que frequência cada frase é verdadeira para este aluno.",
    blocks: [
      { name: "Participação", items: ["Participa das atividades da turma junto com os colegas.", "Consegue registrar o que aprende (escrita, fala, recurso de apoio) de forma que eu entenda.", "Participa do recreio e das atividades de educação física, com as adaptações necessárias.", "É incluído(a) pelos colegas nas brincadeiras e trabalhos em grupo."] },
      { name: "Acessibilidade e apoio", items: ["O espaço da escola (rampa, banheiro, sala) permite que se mova com segurança.", "Recebe apoio de profissional de apoio ou atendimento educacional especializado quando precisa.", "As atividades e provas são adaptadas às suas possibilidades.", "Tenho contato com a família e a equipe de saúde sobre as orientações para a escola."] },
    ],
  }),
  authorial({
    wave: 3, id: "na-cefaleia-gatilhos-rotina", name: "Cefaleia: gatilhos e rotina", fullName: "Gatilhos, hábitos e impacto das dores de cabeça — relato da família",
    construct: "fatores desencadeantes e de manejo da cefaleia pediátrica", ageMin: 48, ageMax: 216, queixas: ["dor"], respondente: ["pais"],
    applicationMode: "questionario_pais", assessmentUse: "seguimento", prioridade: "monitorizacao", tempo: "3–5 min", primaryDomain: "dor", overlapGroup: "na-cefaleia-rotina",
    signalTags: ["dor de cabeça", "enxaqueca", "gatilhos da cefaleia", "sono e dor de cabeça", "pular refeição", "tela e dor de cabeça", "falta à escola por dor"],
    description: "Rotina e gatilhos que costumam acompanhar as dores de cabeça (sono, comida, água, telas, estresse, escola). Ajuda a conversar sobre hábitos; não classifica o tipo de cefaleia.",
    instruction: "Pense nas últimas 4 semanas e marque com que frequência cada situação aconteceu antes ou junto com as dores de cabeça.",
    blocks: [
      { name: "Hábitos", items: ["Dormiu pouco ou em horários muito irregulares.", "Pulou refeições ou passou muitas horas sem comer.", "Bebeu pouca água durante o dia.", "Passou muitas horas em telas."] },
      { name: "Situações", items: ["Dor depois de provas, brigas ou preocupações.", "Dor em ambientes de luz forte ou barulho.", "Dor depois de calor, esforço físico longo ou viagem."] },
      { name: "Manejo e impacto", items: ["Usou analgésico em mais de 2 dias na semana.", "Precisou deitar ou parar a atividade por causa da dor.", "Faltou à escola ou saiu mais cedo por dor de cabeça."] },
    ],
    extraInfo: "Dor súbita muito forte, vômitos em jato, alteração de consciência, febre com rigidez de pescoço ou sinais neurológicos novos exigem avaliação urgente.",
  }),
];
