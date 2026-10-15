// Instrumentos autorais NeuroPed — cuidador, adesão e efeitos de medicação (itens originais; ver authorialKit.ts).
import { authorial, IMPACT4, FREQ4, INTENS4 } from "./authorialKit";
import type { OpenScaleSpec } from "./openScaleKit";

export const cuidadoSpecs: OpenScaleSpec[] = [
  authorial({
    wave: 2, id: "na-sobrecarga-cuidador", name: "Sobrecarga do cuidador", fullName: "Sobrecarga e rotina do cuidador de criança/adolescente com condição crônica do neurodesenvolvimento",
    construct: "sobrecarga de cuidado em famílias de crianças com condições crônicas", ageMin: 0, ageMax: 216, queixas: ["saude-cuidador"], respondente: ["pais"],
    applicationMode: "questionario_pais", assessmentUse: "triagem", tempo: "3–5 min", primaryDomain: "saude-cuidador", overlapGroup: "na-sobrecarga-cuidador",
    signalTags: ["sobrecarga do cuidador", "cansaço dos pais", "mãe sobrecarregada", "falta de rede de apoio", "dificuldade de conciliar trabalho e cuidado", "estresse parental"],
    description: "Quanto o cuidado diário pesa sobre quem cuida (tempo, descanso, trabalho, dinheiro, apoio da família e da rede de saúde). Quem responde é o cuidador principal.",
    instruction: "Pense nas últimas 4 semanas e marque com que frequência cada situação aconteceu com você por causa dos cuidados com a criança/adolescente.",
    blocks: [
      { name: "Tempo e descanso", items: ["Fiquei sem tempo para descansar ou cuidar de mim.", "Dormi menos do que preciso por causa dos cuidados.", "Deixei de fazer algo importante para mim (consulta, estudo, lazer) para cuidar.", "Senti que o dia nunca é suficiente para tudo o que a criança precisa."] },
      { name: "Trabalho, dinheiro e rede", items: ["Faltei ou cheguei atrasado(a) ao trabalho por causa de consultas e terapias.", "O custo de transporte, remédios ou terapias pesou no orçamento da casa.", "Senti que carrego quase tudo sozinho(a).", "Tive dificuldade de conseguir atendimento ou vaga na rede (UBS, CAPS, escola, terapias)."] },
      { name: "Emoções e família", items: ["Fiquei esgotado(a) emocionalmente.", "Senti culpa ou preocupação constante com o futuro da criança.", "O cuidado com a criança gerou tensão com o(a) companheiro(a) ou com outros filhos.", "Senti que as pessoas à minha volta não entendem a nossa rotina."] },
    ],
    extraInfo: "Não mede depressão nem ansiedade do cuidador (para isso há instrumentos próprios); serve para abrir a conversa sobre apoio e encaminhamento do cuidador.",
  }),
  authorial({
    wave: 2, id: "na-apoio-rede-cuidador", name: "Apoio e rede do cuidador", fullName: "Rede de apoio, acesso a serviços e recursos protetores da família",
    construct: "apoio social percebido e acesso a serviços em famílias de crianças em acompanhamento", ageMin: 0, ageMax: 216, queixas: ["saude-cuidador", "social"], respondente: ["pais"],
    applicationMode: "questionario_pais", assessmentUse: "triagem", tempo: "2–4 min", primaryDomain: "saude-cuidador", overlapGroup: "na-apoio-rede-cuidador", higherBetter: true,
    labels: ["Nunca", "Às vezes", "Frequentemente", "Sempre"],
    signalTags: ["rede de apoio", "apoio da família", "acesso ao SUS", "benefícios sociais", "isolamento social da família", "apoio da escola"],
    description: "Com quem a família pode contar (parentes, vizinhos, escola, UBS/CRAS, igreja ou grupos de pais) e se consegue acessar os serviços. Maior pontuação = mais apoio percebido.",
    instruction: "Marque com que frequência cada frase é verdadeira para a sua família hoje.",
    blocks: [
      { name: "Pessoas", items: ["Tenho alguém que fica com a criança quando preciso resolver algo.", "Tenho com quem desabafar sem ser julgado(a).", "Os familiares próximos entendem as necessidades da criança.", "A escola me procura e me escuta quando há dificuldades."] },
      { name: "Serviços", items: ["Consigo chegar às consultas e terapias (transporte, horário, acompanhante).", "Sei a quem recorrer quando a criança piora ou há crise.", "Recebo orientação clara da equipe de saúde sobre os próximos passos.", "Estou informado(a) sobre direitos e benefícios a que a criança pode ter acesso (BPC, passe livre, atendimento educacional especializado)."] },
    ],
  }),
  authorial({
    wave: 2, id: "na-efeitos-estimulantes-pais", name: "Efeitos do tratamento (pais)", fullName: "Efeitos observados após início ou ajuste de medicação para atenção/comportamento — relato dos pais",
    construct: "monitorização de efeitos adversos comuns de psicoestimulantes e outros psicofármacos em crianças", ageMin: 48, ageMax: 216, queixas: ["efeitos", "tdah"], respondente: ["pais"],
    applicationMode: "questionario_pais", assessmentUse: "seguimento", prioridade: "monitorizacao", tempo: "2–4 min", primaryDomain: "efeitos", overlapGroup: "na-efeitos-pais",
    signalTags: ["efeitos colaterais da medicação", "perda de apetite com remédio", "insônia com remédio", "irritabilidade com remédio", "dor de barriga com remédio", "ajuste de dose"],
    description: "Lista de efeitos que costumam ser perguntados em consultas de retorno após medicação, com o quanto cada um incomodou a criança na última semana.",
    instruction: "Pense na última semana, depois de a criança tomar o remédio. Marque o quanto cada situação aconteceu ou incomodou.",
    labels: INTENS4,
    blocks: [
      { name: "Corpo", items: ["Comeu menos do que de costume (principalmente no almoço).", "Reclamou de dor de cabeça.", "Reclamou de dor de barriga ou enjoo.", "Pareceu mais acelerado(a) ou com o coração batendo forte.", "Perdeu peso ou parou de ganhar peso na percepção da família."] },
      { name: "Sono e humor", items: ["Demorou mais para pegar no sono.", "Acordou várias vezes à noite ou muito cedo.", "Ficou mais irritado(a) ou choroso(a), principalmente quando o efeito do remédio passa.", "Ficou mais quieto(a), apático(a) ou 'desligado(a)'.", "Apareceram tiques novos ou mais frequentes."] },
      { name: "Impacto geral", items: ["Os efeitos atrapalharam a escola ou a convivência em casa.", "A família pensou em suspender o remédio por conta própria por causa dos efeitos."] },
    ],
    extraInfo: "Não decide dose nem suspensão: leve ao médico assistente. Sintomas fortes (desmaio, dor no peito, ideias de se machucar, alucinações) exigem avaliação imediata, sem esperar a consulta.",
  }),
  authorial({
    wave: 2, id: "na-efeitos-psicofarmacos-adolescente", name: "Efeitos do tratamento (adolescente)", fullName: "Efeitos percebidos do tratamento medicamentoso — autorrelato do adolescente",
    construct: "monitorização de efeitos adversos de psicofármacos em adolescentes (sedação, peso, sono, sexualidade, movimento)", ageMin: 120, ageMax: 216, queixas: ["efeitos"], respondente: ["autoaplicavel"],
    applicationMode: "autoquestionario_crianca_adolescente", assessmentUse: "seguimento", prioridade: "monitorizacao", tempo: "3–5 min", primaryDomain: "efeitos", overlapGroup: "na-efeitos-adol", literacyRequirement: "alfabetizado",
    signalTags: ["efeitos colaterais da medicação", "sonolência com remédio", "ganho de peso com remédio", "tremor", "inquietação das pernas", "vergonha de tomar remédio"],
    description: "O próprio adolescente conta como se sente com o remédio: sono, energia, apetite, movimento do corpo e como vive o tratamento.",
    instruction: "Pense nas últimas duas semanas. Não existe resposta certa: o objetivo é ajustar o tratamento com o que você sente.",
    labels: FREQ4,
    blocks: [
      { name: "Energia e sono", items: ["Sinto sono ou moleza durante o dia.", "Tenho dificuldade para acordar de manhã.", "Sinto-me 'lento(a)' para pensar ou estudar."] },
      { name: "Corpo", items: ["Notei mudança no meu apetite ou no meu peso.", "Sinto tremor nas mãos ou rigidez no corpo.", "Sinto inquietação, como se não conseguisse ficar parado(a) sentado(a) ou com as pernas quietas.", "Tenho boca seca, tontura ou constipação."] },
      { name: "Vivência do tratamento", items: ["Sinto vergonha de tomar o remédio perto dos outros.", "Já deixei de tomar o remédio porque não gostei dos efeitos.", "Sinto que os efeitos pesam mais que os benefícios."] },
    ],
    extraInfo: "Qualquer pensamento de se machucar deve ser comunicado ao profissional na mesma hora; este questionário não rastreia risco de suicídio.",
  }),
  authorial({
    wave: 3, id: "na-adesao-tratamento-pais", name: "Adesão ao tratamento", fullName: "Barreiras e facilitadores da adesão ao tratamento — relato dos pais",
    construct: "adesão a tratamento medicamentoso e terapêutico na infância e barreiras práticas", ageMin: 0, ageMax: 216, queixas: ["efeitos", "evolucao"], respondente: ["pais"],
    applicationMode: "questionario_pais", assessmentUse: "seguimento", prioridade: "monitorizacao", tempo: "2–4 min", primaryDomain: "efeitos", overlapGroup: "na-adesao",
    signalTags: ["esquecer o remédio", "adesão ao tratamento", "falta nas terapias", "custo do remédio", "medo do remédio", "falta de remédio na farmácia"],
    description: "Identifica o que dificulta seguir o plano combinado (esquecimento, medo, custo, falta do remédio no SUS, rotina da escola) sem culpar a família.",
    instruction: "Pense no último mês. Marque com que frequência cada situação aconteceu.",
    blocks: [
      { name: "Rotina", items: ["Esquecemos de dar o remédio ou de fazer a atividade combinada.", "A rotina da casa ou da escola torna difícil seguir os horários.", "A criança recusa o remédio ou a terapia."] },
      { name: "Crenças e medos", items: ["Tenho receio dos efeitos do remédio a longo prazo.", "Alguém da família ou da comunidade desaconselha o tratamento.", "Pensei em parar porque a criança parecia bem."] },
      { name: "Acesso", items: ["O remédio faltou na farmácia ou foi difícil de comprar.", "Perdemos consultas ou terapias por transporte, horário ou custo."] },
    ],
  }),
  authorial({
    wave: 3, id: "na-transicao-saude-adolescente", name: "Transição para autonomia em saúde", fullName: "Preparo do adolescente para assumir o próprio cuidado em saúde",
    construct: "prontidão para transição do cuidado pediátrico ao cuidado de adulto e autonomia em saúde", ageMin: 144, ageMax: 216, queixas: ["autonomia", "efeitos"], respondente: ["autoaplicavel"],
    applicationMode: "autoquestionario_crianca_adolescente", assessmentUse: "seguimento", prioridade: "monitorizacao", tempo: "3–5 min", primaryDomain: "autonomia", overlapGroup: "na-transicao-saude", higherBetter: true, literacyRequirement: "alfabetizado",
    labels: ["Ainda não", "Com ajuda", "Às vezes sozinho(a)", "Sozinho(a)"],
    signalTags: ["transição para o adulto", "autonomia do adolescente", "tomar o remédio sozinho", "conhecer o próprio diagnóstico", "marcar consulta sozinho"],
    description: "O que o adolescente já faz sozinho no próprio cuidado: conhecer o diagnóstico, tomar remédio, falar na consulta, marcar atendimento. Maior pontuação = mais autonomia.",
    instruction: "Marque o quanto você já consegue fazer cada coisa. Não é uma prova; serve para combinar os próximos passos com a equipe.",
    blocks: [
      { name: "Conhecer a própria condição", items: ["Sei explicar com minhas palavras o que tenho e por que acompanho.", "Sei o nome e para que serve cada remédio que uso.", "Sei quais sinais me avisam que preciso procurar ajuda."] },
      { name: "Fazer", items: ["Tomo meus remédios sem ninguém lembrar.", "Falo com o médico sobre minhas dúvidas na consulta.", "Sei marcar consulta, pegar receita e retirar remédio na farmácia ou UBS.", "Levo meus documentos e cartão do SUS quando preciso.", "Sei dizer à equipe quando não entendi uma orientação ou quando discordo dela."] },
    ],
  }),
];
