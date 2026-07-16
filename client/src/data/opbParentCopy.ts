/**
 * TEXTO PARENT-FRIENDLY DOS CARDS OURO/PRATA/BRONZE (Filtro Clínico).
 *
 * Curado à mão, por escala (scaleId), para as queixas NUCLEARES:
 * TEA, TDAH, atraso, linguagem, ansiedade, depressão, comportamento, sono, motor.
 *
 * O selo (ouro/prata/bronze) e em que idade×queixa cada escala aparece vêm de
 * `clinicalRanking.ts`. Aqui mora só o texto explicativo. Escala sem entrada
 * usa o fallback genérico derivado da própria descrição (ver buildOPB).
 *
 *  - mainQuestion : o que a escala quer descobrir (pergunta clínica em PT claro).
 *  - parentExample: o que será observado/respondido, com exemplos concretos.
 *  - whyUseful    : por que ajuda (usado nos cards PRATA/BRONZE; no OURO o
 *                   racional vem da regra da tabela curada).
 */

export interface OPBCopy {
  mainQuestion: string;
  parentExample: string;
  whyUseful?: string;
}

export const opbParentCopy: Record<string, OPBCopy> = {
  // ============================== TEA / AUTISMO ==============================
  mchat: {
    mainQuestion: "Há sinais de risco para autismo nesta idade crítica?",
    parentExample: 'Você responde ~20 perguntas como: "Ele aponta para mostrar algo que achou interessante?", "Olha quando você chama o nome?", "Brinca de faz-de-conta?".',
    whyUseful: "Rastreio de 1ª linha para TEA aos 16–30 meses; alta sensibilidade para encaminhar cedo.",
  },
  "tea-checklists": {
    mainQuestion: "Quais sinais do espectro estão presentes no dia a dia?",
    parentExample: "Revisão estruturada de comportamentos: contato visual, resposta ao nome, interesses restritos, movimentos repetitivos e reação a sons/texturas.",
    whyUseful: "Organiza os sinais observados em casa e na consulta para compor a suspeita.",
  },
  "j26-009": {
    mainQuestion: "Os pré-requisitos de comunicação social já apareceram?",
    parentExample: "Observa-se se o bebê olha para onde você aponta, troca olhares e responde ao nome entre 9 e 18 meses.",
    whyUseful: "Detecta desvios sociais antes mesmo de a fala começar.",
  },
  "j26-007": {
    mainQuestion: "O desenvolvimento socioemocional está no esperado para a idade?",
    parentExample: "Perguntas sobre sorriso social, busca de colo, estranhamento, interesse por outras crianças e expressão de emoções.",
    whyUseful: "Mapeia marcos sociais e emocionais que sustentam a interação.",
  },
  cars: {
    mainQuestion: "Qual a gravidade dos sintomas do espectro autista?",
    parentExample: "A partir da observação e da sua entrevista, avaliam-se 15 áreas: relação social, imitação, resposta emocional, uso do corpo e da fala.",
    whyUseful: "Quantifica a intensidade do espectro e apoia a definição do nível de suporte.",
  },
  ecsm: {
    mainQuestion: "Como estão a cognição social e a comunicação?",
    parentExample: "Tarefas e observação sobre intenção comunicativa, compreensão social e flexibilidade.",
    whyUseful: "Aprofunda o perfil cognitivo-social além da triagem.",
  },
  "j26-205": {
    mainQuestion: "A criança entende intenções e emoções do outro?",
    parentExample: "Situações que avaliam reconhecer emoções, prever o que o outro pensa/quer e interpretar pistas sociais.",
    whyUseful: "Detalha a cognição social, alvo central de intervenção no TEA.",
  },

  // ================================== TDAH ==================================
  snap: {
    mainQuestion: "Há desatenção, hiperatividade e impulsividade típicas de TDAH?",
    parentExample: 'Você avalia itens como: "Não presta atenção a detalhes", "Não termina tarefas", "Não para quieto", "Interrompe os outros".',
    whyUseful: "Rastreio alinhado ao DSM, com versões para pais e professor.",
  },
  vanderbilt: {
    mainQuestion: "Os sintomas aparecem também na escola e há comorbidades?",
    parentExample: "Professor e pais respondem sobre atenção, agitação, desafio, ansiedade e desempenho escolar.",
    whyUseful: "Cobre os múltiplos ambientes e rastreia comorbidades comuns ao TDAH.",
  },
  brief2: {
    mainQuestion: "As funções executivas (organização, controle) estão prejudicadas?",
    parentExample: 'Itens como: "Esquece o que ia fazer", "Tem dificuldade de começar tarefas", "Perde materiais", "Explode com facilidade".',
    whyUseful: "Mede no cotidiano a inibição, a memória de trabalho e a flexibilidade afetadas no TDAH.",
  },
  conners: {
    mainQuestion: "Qual o perfil de atenção e de comportamento?",
    parentExample: "Avaliação ampla de desatenção, hiperatividade, oposição, agressividade e relações.",
    whyUseful: "Detalha o comportamento e as comorbidades disruptivas associadas.",
  },
  sdq: {
    mainQuestion: "Quais as dificuldades emocionais/comportamentais e quais as forças da criança?",
    parentExample: 'Itens como: "Distrai-se com facilidade", "Preocupa-se muito", "Ajuda os outros", "Tem boas amizades".',
    whyUseful: "Triagem breve e ampla (pais/professor/criança) que também valoriza os pontos fortes.",
  },
  cbcl: {
    mainQuestion: "Qual o perfil geral de comportamento e emoções?",
    parentExample: "Você responde uma lista ampla: agitação, agressividade, tristeza, medos, queixas físicas e isolamento.",
    whyUseful: "Padrão de perfil internalizante/externalizante para situar onde está o problema.",
  },

  // ================================= ATRASO =================================
  denver: {
    mainQuestion: "Em quais marcos do desenvolvimento a criança está atrasada?",
    parentExample: "Observa-se diretamente: senta/anda, pega objetos, fala palavras, sorri e interage — comparando ao esperado para a idade.",
    whyUseful: "Rastreio clássico dos 4 domínios (motor grosso/fino, linguagem, pessoal-social).",
  },
  asq3: {
    mainQuestion: "Há atraso global ou apenas em uma área?",
    parentExample: 'Você responde se a criança "sobe escada com ajuda", "faz frases", "rabisca" e "brinca com outras crianças".',
    whyUseful: "Traz o olhar dos pais sobre o cotidiano nos cinco domínios.",
  },
  "j26-001": {
    mainQuestion: "Os marcos motores do primeiro semestre estão presentes?",
    parentExample: "Verifica-se sustento de cabeça, simetria dos movimentos, fixação/seguimento visual e reações posturais.",
    whyUseful: "Detecta precocemente desvios motores que mudam o prognóstico.",
  },
  "j26-003": {
    mainQuestion: "A linguagem está surgindo no tempo certo?",
    parentExample: "Você responde se o bebê reage ao nome, balbucia, aponta e fala as primeiras palavras.",
    whyUseful: "Acompanha os marcos comunicativos dos dois primeiros anos.",
  },
  "j26-004": {
    mainQuestion: "As habilidades cognitivas iniciais estão aparecendo?",
    parentExample: "Observa-se permanência do objeto, exploração, imitação e resolução de problemas simples.",
    whyUseful: "Avalia a base cognitiva no lactente.",
  },
  "j26-002": {
    mainQuestion: "Os marcos motores do segundo semestre estão presentes?",
    parentExample: "Verifica-se rolar, sentar sem apoio, pinça, engatinhar e início da marcha com apoio.",
    whyUseful: "Confirma a progressão motora ao longo do primeiro ano.",
  },
  emdi: {
    mainQuestion: "Qual o perfil de desenvolvimento infantil em detalhe?",
    parentExample: "Avaliação estruturada de marcos motores, de linguagem e cognitivos.",
    whyUseful: "Detalha o desenvolvimento quando a triagem aponta atraso.",
  },
  pant: {
    mainQuestion: "Qual o perfil neuropsicológico/desenvolvimental?",
    parentExample: "Avaliação clínica estruturada de vários domínios do neurodesenvolvimento.",
    whyUseful: "Compõe um perfil amplo para orientar a conduta.",
  },
  ips: {
    mainQuestion: "Há indicadores precoces de desvio no desenvolvimento social?",
    parentExample: "Você responde sobre a interação, a comunicação e o brincar da criança.",
    whyUseful: "Sinaliza precocemente risco de TEA/atraso pelo relato dos pais.",
  },

  // =============================== LINGUAGEM ================================
  ems: {
    mainQuestion: "A linguagem (compreensão e expressão) está adequada?",
    parentExample: "Avaliam-se vocabulário, frases, compreensão de ordens e uso comunicativo.",
    whyUseful: "Caracteriza atraso expressivo x receptivo para guiar a fonoaudiologia.",
  },
  "linguagem-fonologia": {
    mainQuestion: "A criança produz os sons da fala corretamente?",
    parentExample: "A criança nomeia figuras e repete palavras; observam-se trocas, omissões e inteligibilidade.",
    whyUseful: "Identifica transtorno fonológico e seu impacto na inteligibilidade.",
  },
  "j26-091": {
    mainQuestion: "O vocabulário e as frases estão surgindo aos 18–36 meses?",
    parentExample: "Você responde quantas palavras a criança diz, se junta duas palavras e se entende pedidos simples.",
    whyUseful: "Detecta atraso de linguagem na janela de maior plasticidade.",
  },
  "j26-085": {
    mainQuestion: "O vocabulário é rico e bem organizado?",
    parentExample: "A criança define palavras, agrupa por categorias e explica semelhanças.",
    whyUseful: "Avalia a profundidade lexical, ligada à compreensão de leitura.",
  },
  "j26-090": {
    mainQuestion: "A criança entende frases e instruções complexas?",
    parentExample: "Pede-se que siga ordens de vários passos e responda perguntas sobre uma história contada.",
    whyUseful: "Mede a compreensão para além de palavras isoladas.",
  },
  "j26-086": {
    mainQuestion: "A criança evoca palavras com facilidade?",
    parentExample: "Em 1 minuto, diz o máximo de palavras de uma categoria (ex.: animais) ou começadas por uma letra.",
    whyUseful: "Avalia o acesso lexical e a função executiva verbal.",
  },

  // =============================== ANSIEDADE ================================
  scared: {
    mainQuestion: "Quais tipos de ansiedade estão presentes?",
    parentExample: 'Itens como: "Fica muito nervoso longe de você", "Tem medo de ir à escola", "Tem ataques de pânico", "É muito tímido".',
    whyUseful: "Rastreio de 1ª linha (≥8 anos) que separa pânico, generalizada, separação, social e fobia escolar.",
  },
  eai: {
    mainQuestion: "Há sinais de ansiedade observáveis na criança?",
    parentExample: "O clínico avalia medo, evitação, tensão e preocupação a partir do seu relato e da observação.",
    whyUseful: "Heteroavaliação útil quando a criança ainda não faz autorrelato confiável.",
  },
  easi: {
    mainQuestion: "A ansiedade social/de separação está presente?",
    parentExample: "Avaliam-se situações de separação, contato com estranhos e exposição social.",
    whyUseful: "Foca nos subtipos de ansiedade mais comuns no pré-escolar.",
  },
  gad7ped: {
    mainQuestion: "Qual a intensidade da ansiedade generalizada?",
    parentExample: "O adolescente responde com que frequência se sente nervoso, preocupado, irritado ou incapaz de relaxar.",
    whyUseful: "Quantifica e monitoriza a gravidade da ansiedade no adolescente.",
  },

  // =============================== DEPRESSÃO ===============================
  phqa: {
    mainQuestion: "Há sintomas de depressão no adolescente?",
    parentExample: "O adolescente responde sobre tristeza, perda de interesse, sono, apetite, cansaço e ideias de morte.",
    whyUseful: "Rastreio de 1ª linha de depressão na adolescência, com item de risco.",
  },
  cdi2: {
    mainQuestion: "A criança apresenta sintomas depressivos?",
    parentExample: "A própria criança escolhe as frases que melhor descrevem humor, autoestima, escola e relações.",
    whyUseful: "Autorrelato validado de depressão na idade escolar.",
  },
  cssrs: {
    mainQuestion: "Há ideação ou comportamento suicida e qual a gravidade?",
    parentExample: "Perguntas diretas sobre desejo de morrer, pensamentos, planos e tentativas.",
    whyUseful: "Padrão de avaliação de risco — obrigatório sempre que há sinais de humor depressivo.",
  },
  edi: {
    mainQuestion: "Há sinais de alteração do humor na criança pequena?",
    parentExample: "O clínico avalia humor, irritabilidade, choro, perda de interesse e queixas físicas a partir do seu relato.",
    whyUseful: "Heteroavaliação de humor quando ainda falta autorrelato confiável.",
  },
  "orientacao-parental": {
    mainQuestion: "Como a família pode apoiar o manejo em casa?",
    parentExample: "Orientações práticas e psicoeducação sobre a condição e o dia a dia da criança.",
    whyUseful: "Sustenta o tratamento com estratégias concretas para os cuidadores.",
  },

  // ============================= COMPORTAMENTO =============================
  abc: {
    mainQuestion: "Há comportamentos aberrantes (irritabilidade, estereotipias)?",
    parentExample: "Você avalia irritabilidade, hiperatividade, fala repetitiva, isolamento e comportamentos estereotipados.",
    whyUseful: "Quantifica e monitora comportamentos-alvo, inclusive no TEA.",
  },
  "tea-comportamentos": {
    mainQuestion: "Quais comportamentos atípicos estão presentes?",
    parentExample: "Revisão de estereotipias, interesses restritos, reações sensoriais e rituais.",
    whyUseful: "Mapeia os comportamentos repetitivos/atípicos para orientar a conduta.",
  },

  // ================================== SONO =================================
  cshq: {
    mainQuestion: "Como estão os hábitos e os problemas de sono?",
    parentExample: "Você responde sobre hora de dormir, resistência, despertares, pesadelos, ronco e sonolência diurna.",
    whyUseful: "Questionário validado que cobre as principais áreas do sono infantil.",
  },
  "j26-137": {
    mainQuestion: "Existe uma rotina noturna previsível?",
    parentExample: "Você descreve a sequência da noite (banho, história, luz) e a consistência dos horários.",
    whyUseful: "Estrutura a noite — base do manejo comportamental do sono.",
  },
  "j26-136": {
    mainQuestion: "A melatonina está ajudando o sono?",
    parentExample: "Você registra o tempo para adormecer, os despertares e a sonolência antes e depois do uso.",
    whyUseful: "Monitoriza objetivamente a resposta ao tratamento.",
  },
  "inventarios-auto": {
    mainQuestion: "Como o próprio adolescente percebe seus sintomas?",
    parentExample: "O adolescente responde inventários sobre humor, ansiedade, sono e atenção.",
    whyUseful: "Traz a perspectiva do próprio paciente.",
  },

  // ================================== MOTOR ================================
  "motricidade-teste": {
    mainQuestion: "A coordenação motora está adequada para a idade?",
    parentExample: "A criança realiza tarefas de equilíbrio, manuseio de objetos e coordenação, observadas diretamente.",
    whyUseful: "Rastreia dificuldade de coordenação (Transtorno do Desenvolvimento da Coordenação).",
  },
  "j26-108": {
    mainQuestion: "A criança copia formas e coordena olho-mão?",
    parentExample: "Pede-se copiar figuras (círculo, cruz, quadrado) e observa-se a precisão.",
    whyUseful: "Avalia a visomotricidade, diretamente ligada à escrita.",
  },
  "escrita-desenho": {
    mainQuestion: "A escrita e o desenho estão adequados?",
    parentExample: "A criança desenha e escreve; observam-se preensão, traçado, pressão e organização na folha.",
    whyUseful: "Detecta disgrafia e dificuldade motora fina.",
  },
  "j26-107": {
    mainQuestion: "Os marcos motores grossos de 1–5 anos estão presentes?",
    parentExample: "Você responde se a criança corre, pula, sobe escada, chuta bola e fica em um pé só.",
    whyUseful: "Acompanha a motricidade grossa no pré-escolar.",
  },
  "j26-008": {
    mainQuestion: "A coordenação fina está se desenvolvendo?",
    parentExample: "Observam-se empilhar blocos, encaixar peças, rabiscar e usar a pinça.",
    whyUseful: "Avalia o motor fino no toddler.",
  },
  "j26-112": {
    mainQuestion: "O equilíbrio e a marcha estão adequados?",
    parentExample: "Observam-se a forma de andar, o equilíbrio em um pé e as mudanças de direção.",
    whyUseful: "Detecta alterações de marcha e de equilíbrio.",
  },
  "j26-240": {
    mainQuestion: "Como a criança usa as mãos para manusear objetos?",
    parentExample: "Classifica-se o quanto ela manuseia objetos do cotidiano com ou sem ajuda.",
    whyUseful: "Padrão de função manual (MACS) na PC, acompanhado ao longo do tempo.",
  },
};
