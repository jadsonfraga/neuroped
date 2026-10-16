// Instrumentos autorais NeuroPed — humor, regulação emocional, psicose (rastreio parental), seguimentos e substâncias (itens originais).
import { authorial, INTENS4 } from "./authorialKit";
import type { OpenScaleSpec } from "./openScaleKit";

const SIM_NAO = ["Não", "Talvez / uma vez", "Sim, às vezes", "Sim, com frequência"];

export const humorSpecs: OpenScaleSpec[] = [
  authorial({
    wave: 2, id: "na-labilidade-humor-pais", name: "Labilidade e oscilação do humor (pais)", fullName: "Oscilações de humor e explosões de irritabilidade — relato dos pais",
    construct: "desregulação emocional e oscilação de humor na infância e adolescência", ageMin: 48, ageMax: 216, queixas: ["comportamento", "depressao"], respondente: ["pais"],
    applicationMode: "questionario_pais", assessmentUse: "triagem", tempo: "4–6 min", primaryDomain: "comportamento", overlapGroup: "na-labilidade",
    signalTags: ["oscilação de humor", "explosões de raiva", "irritabilidade", "humor muda rápido", "desregulação emocional", "euforia e depois choro"],
    description: "Frequência de mudanças bruscas de humor, explosões e períodos de energia ou irritabilidade acima do habitual. Não diferencia transtorno do humor de outras causas.",
    instruction: "Pense nos últimos 3 meses. Marque com que frequência cada situação acontece, comparando com o que costuma ser esperado para a idade.",
    blocks: [
      { name: "Explosões e irritabilidade", items: ["Fica muito irritado(a) por motivos pequenos.", "Tem explosões de raiva com gritos, xingamentos ou agressão que demoram a passar.", "Depois da explosão, demora mais de meia hora para se acalmar.", "Reage com intensidade desproporcional quando é contrariado(a)."] },
      { name: "Oscilação e energia", items: ["O humor muda de alegre para triste ou bravo em poucas horas, sem motivo claro.", "Tem fases de muita energia, falando e se movendo sem parar, dormindo bem pouco e sem se sentir cansado(a).", "Tem fases de animação exagerada ou riso difícil de parar fora do contexto.", "Tem fases em que fica muito desanimado(a), sem vontade de nada."] },
      { name: "Impacto", items: ["O humor atrapalha a convivência em casa.", "O humor atrapalha a escola ou os amigos."] },
    ],
    extraInfo: "Não substitui avaliação de mania/hipomania nem de depressão. Sintomas de risco (falar em se machucar, ideias de grandeza com perda de realidade) devem ser levados ao profissional imediatamente.",
  }),
  authorial({
    wave: 2, id: "na-regulacao-emocional-pais", name: "Regulação emocional (pais)", fullName: "Como a criança reconhece, expressa e se acalma diante de emoções — relato dos pais",
    construct: "regulação emocional e estratégias de autorregulação", ageMin: 36, ageMax: 144, queixas: ["comportamento", "ansiedade"], respondente: ["pais"],
    applicationMode: "questionario_pais", assessmentUse: "seguimento", prioridade: "monitorizacao", tempo: "3–5 min", primaryDomain: "comportamento", overlapGroup: "na-regulacao-emocional", higherBetter: true,
    labels: ["Nunca", "Às vezes", "Frequentemente", "Quase sempre"],
    signalTags: ["birras", "dificuldade de se acalmar", "regulação emocional", "nomear emoções", "pedir ajuda quando está bravo", "frustração"],
    description: "Competências de regulação: nomear emoções, pedir ajuda, se acalmar e voltar à atividade. Maior pontuação = mais competências presentes; serve para acompanhar mudanças.",
    instruction: "Pense nas últimas 4 semanas e marque com que frequência cada frase descreve a criança.",
    blocks: [
      { name: "Reconhecer e comunicar", items: ["Diz com palavras ou gestos como está se sentindo (bravo, triste, com medo).", "Pede ajuda de um adulto quando está muito chateado(a).", "Percebe quando outra pessoa está triste ou brava."] },
      { name: "Acalmar-se", items: ["Consegue se acalmar com apoio de um adulto em poucos minutos.", "Usa uma estratégia combinada (respirar, abraço, cantinho calmo) quando está alterado(a).", "Depois de se acalmar, consegue conversar sobre o que aconteceu.", "Aceita um 'não' sem crise intensa.", "Volta à atividade depois de uma frustração."] },
    ],
  }),
  authorial({
    wave: 3, id: "na-experiencias-perceptivas-adolescente", name: "Experiências perceptivas incomuns (adolescente)", fullName: "Experiências incomuns de percepção e pensamento — autorrelato do adolescente",
    construct: "experiências psicóticas atenuadas (rastreio de risco) em adolescentes", ageMin: 144, ageMax: 216, queixas: ["psicose"], respondente: ["autoaplicavel"],
    applicationMode: "autoquestionario_crianca_adolescente", assessmentUse: "triagem", tempo: "4–6 min", primaryDomain: "psicose", overlapGroup: "na-experiencias-perceptivas", literacyRequirement: "alfabetizado", psychosisRisk: true, labels: SIM_NAO,
    signalTags: ["ouvir vozes", "ver coisas que ninguém vê", "desconfiança intensa", "sensação de ser observado", "pensamentos estranhos", "isolamento recente"],
    description: "O adolescente descreve experiências incomuns (vozes, vultos, desconfiança, sensação de que algo está estranho). Experiências isoladas são comuns e nem sempre indicam doença; o instrumento só orienta a conversa clínica.",
    instruction: "Responda sobre o último mês. Não existe resposta certa ou errada e ninguém vai achar que você é 'maluco(a)'. Se você não tiver certeza, marque 'Talvez'.",
    blocks: [
      { name: "Percepção", items: ["Ouvi vozes ou sons que outras pessoas não ouviam.", "Vi vultos, sombras ou pessoas que ninguém mais via.", "Senti cheiros ou toques estranhos sem explicação.", "Senti que o mundo ou meu corpo estava diferente ou irreal."] },
      { name: "Pensamento", items: ["Senti que alguém queria me prejudicar ou me vigiava, sem eu ter provas.", "Tive a impressão de que mensagens de TV, internet ou pessoas eram dirigidas a mim.", "Tive pensamentos que me assustam por serem muito estranhos.", "Percebi que perdi o fio do que pensava ou falava com mais frequência."] },
      { name: "Impacto", items: ["Essas experiências me deixam com medo ou preocupado(a).", "Tenho evitado escola, amigos ou sair de casa por causa delas."] },
    ],
    extraInfo: "Não é diagnóstico nem avaliação de risco suicida. Resposta positiva pede conversa clínica, escuta cuidadosa e, se houver sofrimento intenso ou perda de função, avaliação especializada.",
  }),
  authorial({
    wave: 3, id: "na-sinais-iniciais-psicose-pais", name: "Sinais iniciais de psicose (pais)", fullName: "Mudanças recentes no comportamento e no pensamento — observação dos pais",
    construct: "pródromo e sinais iniciais de psicose observáveis pela família", ageMin: 144, ageMax: 216, queixas: ["psicose", "comportamento"], respondente: ["pais"],
    applicationMode: "questionario_pais", assessmentUse: "triagem", tempo: "3–5 min", primaryDomain: "psicose", overlapGroup: "na-sinais-psicose-pais", psychosisRisk: true,
    signalTags: ["mudança de comportamento recente", "fala desorganizada", "isolamento social", "queda do desempenho escolar", "desconfiança", "conversa sozinho"],
    description: "O que a família percebeu mudar nos últimos meses (isolamento, desconfiança, fala estranha, queda do rendimento, higiene, sono). Orienta o encaminhamento; não diagnostica.",
    instruction: "Pense nos últimos 3 meses comparando com o jeito habitual do(a) adolescente. Marque com que frequência cada mudança aconteceu.",
    blocks: [
      { name: "Comportamento", items: ["Isolou-se de amigos e da família.", "Deixou de cuidar da higiene ou da aparência de modo claro.", "O rendimento escolar caiu de forma importante.", "Dorme muito mais ou muito menos que antes, com a rotina invertida."] },
      { name: "Pensamento e fala", items: ["Fala sozinho(a) ou parece responder a algo que não vemos.", "Mostra desconfiança nova de familiares, vizinhos ou colegas.", "Fala de modo confuso, difícil de acompanhar.", "Expressa ideias estranhas ou fora da realidade com convicção."] },
    ],
    extraInfo: "Quando houver agitação intensa, medo extremo ou risco para si ou outros, procurar atendimento de urgência (UPA, CAPS, SAMU 192) sem esperar a consulta.",
  }),
  authorial({
    wave: 2, id: "na-humor-depressivo-adolescente", name: "Humor depressivo (adolescente)", fullName: "Como o adolescente se sentiu nas últimas semanas — autorrelato de humor",
    construct: "sintomas depressivos na infância e adolescência (humor, anedonia, energia, concentração, sono, apetite)", ageMin: 96, ageMax: 216, queixas: ["depressao"], respondente: ["autoaplicavel"],
    applicationMode: "autoquestionario_crianca_adolescente", assessmentUse: "seguimento", prioridade: "monitorizacao", tempo: "4–6 min", primaryDomain: "depressao", overlapGroup: "na-humor-depressivo", literacyRequirement: "alfabetizado",
    signalTags: ["tristeza", "sem vontade de nada", "choro", "desânimo", "perda de interesse", "irritabilidade no adolescente", "sono e apetite alterados"],
    description: "Autorrelato de humor, interesse, energia, concentração, sono e apetite. Não inclui pergunta sobre risco de suicídio: esta avaliação deve ser feita por outro instrumento ou conversa direta com o profissional.",
    instruction: "Pense nas últimas duas semanas e marque com que frequência cada frase foi verdadeira para você.",
    blocks: [
      { name: "Humor e interesse", items: ["Senti-me triste ou vazio(a).", "Perdi o interesse em coisas de que eu gostava.", "Fiquei irritado(a) com facilidade.", "Chorei sem saber bem por quê."] },
      { name: "Corpo e rotina", items: ["Senti-me sem energia ou muito cansado(a).", "Tive dificuldade para me concentrar nos estudos.", "Dormi muito mais ou muito menos que de costume.", "Meu apetite mudou bastante (comi muito mais ou muito menos)."] },
      { name: "Relações", items: ["Evitei amigos ou conversas.", "Senti-me sozinho(a) mesmo estando com outras pessoas."] },
    ],
    extraInfo: "Se o adolescente falar em se machucar, a conversa deve ser imediata e direta; este questionário não faz esse rastreio.",
  }),
  authorial({
    wave: 2, id: "na-ansiedade-seguimento-pais", name: "Seguimento de ansiedade (pais)", fullName: "Acompanhamento de sintomas de ansiedade na criança — relato dos pais",
    construct: "monitorização de ansiedade infantil (medos, preocupações, evitação, sintomas corporais)", ageMin: 48, ageMax: 168, queixas: ["ansiedade"], respondente: ["pais"],
    applicationMode: "questionario_pais", assessmentUse: "seguimento", prioridade: "monitorizacao", tempo: "3–5 min", primaryDomain: "ansiedade", overlapGroup: "na-ansiedade-seguimento",
    signalTags: ["ansiedade", "medo excessivo", "preocupação", "dor de barriga por nervoso", "evitar a escola", "separação", "retorno de ansiedade"],
    description: "Medidas simples para repetir a cada retorno e comparar: preocupações, medos, evitação e sintomas físicos, mais o impacto na escola e em casa.",
    instruction: "Pense na última semana e marque com que frequência cada situação aconteceu.",
    blocks: [
      { name: "Preocupação e medo", items: ["Preocupou-se muito com coisas que podem dar errado.", "Teve medo intenso de situações específicas (escuro, animais, médico, multidão).", "Ficou muito aflito(a) ao se separar de quem cuida."] },
      { name: "Evitação e corpo", items: ["Evitou escola, festas ou atividades por medo ou nervoso.", "Reclamou de dor de barriga, cabeça ou enjoo antes de situações que o(a) deixam nervoso(a).", "Precisou de muita reasseguração (perguntar várias vezes se vai ficar tudo bem)."] },
      { name: "Impacto", items: ["A ansiedade atrapalhou a rotina da escola.", "A ansiedade atrapalhou o sono ou as refeições.", "A família ajustou a rotina inteira para evitar situações que dão ansiedade."] },
    ],
  }),
  authorial({
    wave: 2, id: "na-tiques-seguimento-pais", name: "Seguimento de tiques (pais)", fullName: "Acompanhamento de tiques motores e vocais — relato dos pais",
    construct: "monitorização de tiques: frequência, intensidade, impacto e vivência", ageMin: 48, ageMax: 216, queixas: ["tiques"], respondente: ["pais"],
    applicationMode: "questionario_pais", assessmentUse: "seguimento", prioridade: "monitorizacao", tempo: "3–5 min", primaryDomain: "tiques", overlapGroup: "na-tiques-seguimento", labels: INTENS4,
    signalTags: ["tiques", "piscar de olhos", "pigarro", "movimentos repetidos", "tiques vocais", "piora dos tiques", "bullying por tiques"],
    description: "Quanto os tiques apareceram, incomodaram e atrapalharam nas últimas semanas. Para repetir a cada retorno; não mede gravidade validada.",
    instruction: "Pense nas últimas duas semanas e marque o quanto cada frase se aplicou.",
    blocks: [
      { name: "Tiques", items: ["Tiques motores (piscar, caretas, movimentos de cabeça, ombros ou membros) apareceram.", "Tiques vocais (pigarro, fungadas, sons, palavras) apareceram.", "Os tiques ficaram mais fortes ou mais frequentes em dias de cansaço, ansiedade ou excitação."] },
      { name: "Impacto", items: ["Os tiques causaram dor ou desconforto físico.", "A criança ficou incomodada, envergonhada ou irritada por causa dos tiques.", "Os tiques atrapalharam a escola, a escrita ou os estudos.", "Colegas ou outras pessoas fizeram comentários ou zombaram dos tiques."] },
    ],
    extraInfo: "Complementa, não substitui, a observação clínica dos tiques e a pergunta sobre sensação premonitória.",
  }),
  authorial({
    wave: 2, id: "na-toc-seguimento-pais", name: "Seguimento de TOC (pais)", fullName: "Acompanhamento de obsessões e compulsões — relato dos pais",
    construct: "monitorização de sintomas obsessivo-compulsivos e acomodação familiar", ageMin: 60, ageMax: 216, queixas: ["toc"], respondente: ["pais"],
    applicationMode: "questionario_pais", assessmentUse: "seguimento", prioridade: "monitorizacao", tempo: "3–5 min", primaryDomain: "toc", overlapGroup: "na-toc-seguimento", labels: INTENS4,
    signalTags: ["TOC", "rituais", "lavar as mãos", "checar repetidamente", "pensamentos que não saem", "acomodação familiar", "demora nas tarefas"],
    description: "Quanto tempo e sofrimento os rituais e pensamentos repetitivos causaram, e o quanto a família entra nos rituais. Para repetir a cada retorno.",
    instruction: "Pense na última semana e marque o quanto cada frase se aplicou.",
    blocks: [
      { name: "Sintomas", items: ["A criança teve pensamentos repetidos que a deixam aflita e que ela não consegue afastar.", "Fez rituais (lavar, checar, ordenar, contar, repetir) para diminuir a aflição.", "Os rituais tomaram muito tempo do dia."] },
      { name: "Sofrimento e família", items: ["A criança ficou muito aflita ou irritada quando foi impedida de fazer os rituais.", "A família participou de rituais ou mudou a rotina para evitar aflição (responder muitas vezes, refazer coisas).", "Os sintomas atrapalharam escola, refeições, banho ou sono."] },
    ],
  }),
  authorial({
    wave: 3, id: "na-uso-substancias-adolescente", name: "Uso de substâncias (adolescente)", fullName: "Conversa sobre tabaco, álcool e outras substâncias — autorrelato do adolescente",
    construct: "rastreio breve de uso de substâncias em adolescentes na atenção primária", ageMin: 144, ageMax: 216, queixas: ["substancias"], respondente: ["autoaplicavel"],
    applicationMode: "autoquestionario_crianca_adolescente", assessmentUse: "triagem", tempo: "2–3 min", primaryDomain: "substancias", overlapGroup: "na-uso-substancias", literacyRequirement: "alfabetizado",
    labels: ["Nunca", "Uma ou duas vezes", "Algumas vezes por mês", "Toda semana ou mais"],
    signalTags: ["álcool", "cigarro", "vape", "maconha", "uso de drogas", "festas e bebida", "amigos que usam"],
    description: "Frequência de uso nos últimos 12 meses de tabaco/vape, álcool, maconha e outras substâncias, para abrir a conversa em ambiente confidencial. Sem classificação de risco por ponto de corte.",
    instruction: "Responda com sinceridade: é uma conversa de cuidado, não de punição. Pense nos últimos 12 meses.",
    blocks: [
      { name: "Frequência de uso", items: ["Fumei cigarro ou usei vape.", "Bebi álcool (cerveja, vinho, destilado ou outro).", "Usei maconha ou derivados.", "Usei outro tipo de droga ou remédio sem prescrição para ficar alterado(a)."] },
      { name: "Contexto", items: ["Estive em situações em que amigos ou familiares usavam essas substâncias perto de mim.", "Usei algo para dormir, para me acalmar ou para esquecer problemas."] },
    ],
    extraInfo: "Aplicar de forma confidencial. Qualquer uso frequente, uso por alívio de sofrimento ou combinação com direção/risco exige avaliação clínica e, quando indicado, encaminhamento (CAPS-AD, UBS).",
  }),
  authorial({
    wave: 3, id: "na-tracos-insensiveis-pais", name: "Traços de insensibilidade emocional (pais)", fullName: "Empatia, culpa e afeto — relato dos pais sobre traços de insensibilidade emocional",
    construct: "traços de insensibilidade e falta de emoções pró-sociais associados a problemas graves de conduta", ageMin: 72, ageMax: 216, queixas: ["comportamento"], respondente: ["pais"],
    applicationMode: "questionario_pais", assessmentUse: "triagem", tempo: "3–5 min", primaryDomain: "comportamento", overlapGroup: "na-tracos-insensiveis",
    signalTags: ["falta de empatia", "não demonstra culpa", "crueldade", "frieza emocional", "agressividade proativa", "transtorno de conduta"],
    description: "Observa se a criança mostra empatia, culpa e afeto de forma consistente, em vários contextos, ao longo do tempo. Não rotula a criança nem diagnostica.",
    instruction: "Pense em como a criança costuma ser há pelo menos 12 meses, em diferentes situações e com diferentes pessoas.",
    blocks: [
      { name: "Empatia e culpa", items: ["Parece não se importar quando magoa alguém.", "Não demonstra arrependimento depois de fazer algo errado.", "Mostra pouca preocupação com sentimentos de outras pessoas."] },
      { name: "Afeto e motivação", items: ["Demonstra pouca emoção, mesmo em situações em que seria esperado.", "Usa a doçura ou a simpatia de forma calculada para conseguir o que quer.", "Demonstra pouca preocupação com o próprio desempenho ou com consequências."] },
    ],
    extraInfo: "Alto relato não é diagnóstico nem prognóstico; investigar trauma, ansiedade, TEA e contexto familiar antes de qualquer conclusão.",
  }),
];
