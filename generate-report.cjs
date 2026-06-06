const fs = require("fs");
const docx = require("docx");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat,
  ExternalHyperlink, TableOfContents, HeadingLevel,
  BorderStyle, WidthType, ShadingType, PageNumber,
  PageBreak,
} = docx;

// ── Colors ──
const PURPLE = "7C3AED";
const PURPLE_LIGHT = "EDE9FE";
const PURPLE_MED = "C4B5FD";
const GRAY_TEXT = "4B5563";
const BLACK = "1F2937";
const WHITE = "FFFFFF";
const BORDER_GRAY = "D1D5DB";

// ── Helpers ──
function heading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text, bold: true, font: "Arial", size: 36, color: PURPLE })],
    spacing: { before: 400, after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: PURPLE } },
  });
}

function heading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [new TextRun({ text, bold: true, font: "Arial", size: 28, color: PURPLE })],
    spacing: { before: 300, after: 150 },
  });
}

function heading3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    children: [new TextRun({ text, bold: true, font: "Arial", size: 24, color: BLACK })],
    spacing: { before: 240, after: 120 },
  });
}

function para(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 160, line: 340 },
    alignment: opts.align || AlignmentType.JUSTIFIED,
    children: [new TextRun({ text, font: "Arial", size: 22, color: opts.color || GRAY_TEXT, ...(opts.bold ? { bold: true } : {}), ...(opts.italics ? { italics: true } : {}) })],
  });
}

function multiRunPara(runs) {
  return new Paragraph({
    spacing: { after: 160, line: 340 },
    alignment: AlignmentType.JUSTIFIED,
    children: runs.map(r => new TextRun({ font: "Arial", size: 22, color: GRAY_TEXT, ...r })),
  });
}

function bulletItem(text, ref = "bullets") {
  return new Paragraph({
    numbering: { reference: ref, level: 0 },
    spacing: { after: 80, line: 320 },
    children: [new TextRun({ text, font: "Arial", size: 22, color: GRAY_TEXT })],
  });
}

function emptyLine() {
  return new Paragraph({ spacing: { after: 100 }, children: [] });
}

const thinBorder = { style: BorderStyle.SINGLE, size: 1, color: BORDER_GRAY };
const allBorders = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };
const noBorders = {
  top: { style: BorderStyle.NONE, size: 0 },
  bottom: { style: BorderStyle.NONE, size: 0 },
  left: { style: BorderStyle.NONE, size: 0 },
  right: { style: BorderStyle.NONE, size: 0 },
};

function tableHeaderCell(text, width) {
  return new TableCell({
    borders: allBorders,
    width: { size: width, type: WidthType.DXA },
    shading: { fill: PURPLE, type: ShadingType.CLEAR },
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    verticalAlign: "center",
    children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text, bold: true, font: "Arial", size: 20, color: WHITE })] })],
  });
}

function tableCell(text, width, opts = {}) {
  return new TableCell({
    borders: allBorders,
    width: { size: width, type: WidthType.DXA },
    shading: opts.shading ? { fill: opts.shading, type: ShadingType.CLEAR } : undefined,
    margins: { top: 50, bottom: 50, left: 100, right: 100 },
    children: [new Paragraph({
      alignment: opts.align || AlignmentType.LEFT,
      children: [new TextRun({ text, font: "Arial", size: 20, color: BLACK, ...(opts.bold ? { bold: true } : {}) })],
    })],
  });
}

// ── Cover page ──
function coverPage() {
  return [
    emptyLine(), emptyLine(), emptyLine(), emptyLine(), emptyLine(), emptyLine(),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [new TextRun({ text: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", font: "Arial", size: 20, color: PURPLE })],
    }),
    emptyLine(),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [new TextRun({ text: "NeuroPed", font: "Arial", size: 72, bold: true, color: PURPLE })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [new TextRun({ text: "Escalas de Neuropediatria", font: "Arial", size: 36, color: PURPLE })],
    }),
    emptyLine(),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [new TextRun({ text: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", font: "Arial", size: 20, color: PURPLE })],
    }),
    emptyLine(), emptyLine(),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({ text: "Guia Completo de Escalas, Questionários e\nFarmacologia Neuropediátrica", font: "Arial", size: 26, color: GRAY_TEXT, italics: true })],
    }),
    emptyLine(),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [new TextRun({ text: "Dr. Jadson Fraga Araújo Júnior", font: "Arial", size: 28, bold: true, color: BLACK })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [new TextRun({ text: "Neuropediatra", font: "Arial", size: 24, color: PURPLE })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [new TextRun({ text: "CRM-PE 25227 | CRM-BA 23384", font: "Arial", size: 20, color: GRAY_TEXT })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [new TextRun({ text: "RQE 17756 / 14499 / 13119", font: "Arial", size: 20, color: GRAY_TEXT })],
    }),
    emptyLine(), emptyLine(), emptyLine(),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [new TextRun({ text: "Clínica Jadson Fraga", font: "Arial", size: 22, bold: true, color: PURPLE })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({ text: "Março 2026", font: "Arial", size: 22, color: GRAY_TEXT })],
    }),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

// ── TOC ──
function tocPage() {
  return [
    heading1("Sumário"),
    new TableOfContents("Sumário", { hyperlink: true, headingStyleRange: "1-3" }),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

// ── Section 1: Apresentação ──
function secApresentacao() {
  return [
    heading1("1. Apresentação"),
    para("O NeuroPed é uma ferramenta educacional e clínica de referência desenvolvida pelo Dr. Jadson Fraga Araújo Júnior, neuropediatra com ampla experiência no atendimento de crianças e adolescentes com condições neurológicas e do neurodesenvolvimento. Projetado para estudantes de Medicina, médicos generalistas, pediatras, neurologistas e profissionais terapeutas (psicólogos, fonoaudiólogos, terapeutas ocupacionais e fisioterapeutas), o aplicativo reúne em uma única plataforma as principais escalas, questionários e ferramentas de avaliação utilizadas na prática neuropediátrica."),
    para("Com mais de 107 escalas validadas e instrumentos de triagem, o NeuroPed cobre todo o espectro de avaliação neuropediátrica: desde a triagem do neurodesenvolvimento em lactentes até a avaliação de transtornos psiquiátricos na adolescência. O aplicativo inclui escalas consagradas internacionalmente, como o M-CHAT-R/F para rastreamento de autismo, o Denver II para marcos do desenvolvimento, o SNAP-IV para TDAH e diversas outras ferramentas essenciais para a prática clínica diária."),
    para("Além das escalas, o NeuroPed oferece um módulo completo de farmacologia neuropediátrica com 142 medicações distribuídas em 27 categorias terapêuticas. Cada medicação é apresentada com dose inicial, dose de manutenção, indicações clínicas e observações relevantes, permitindo ao profissional uma consulta rápida e segura no momento da prescrição. As categorias abrangem desde o manejo do TEA e TDAH até epilepsia, cefaleia, distúrbios do movimento e condições neuroimunológicas."),
    para("O sistema de Filtro Inteligente do NeuroPed permite buscas avançadas por queixa clínica, faixa etária, código CID, texto livre e sinônimos. São 13 categorias de queixas com mais de 70 tags específicas, que realizam buscas cruzadas simultâneas em escalas e medicações. Essa funcionalidade agiliza significativamente o fluxo de trabalho clínico, permitindo que o profissional encontre rapidamente as ferramentas e opções terapêuticas mais adequadas para cada caso."),
    para("O aplicativo conta ainda com uma bateria autoral exclusiva desenvolvida pelo Dr. Jadson Fraga em 2026, composta por cinco protocolos inéditos que cobrem desde a triagem do desenvolvimento até a integração psicossocial. Complementam o repertório sete escalas de regulação emocional, diários clínicos para epilepsia e cefaleia, e um guia completo de psiquiatria infantil com mais de 30 condições. O NeuroPed representa, assim, a ferramenta mais completa disponível para a prática neuropediátrica no Brasil."),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

// ── Section 2: Escalas de Neurodesenvolvimento ──
function secNeurodesenvolvimento() {
  const content = [
    heading1("2. Escalas de Neurodesenvolvimento"),
    para("As escalas de neurodesenvolvimento constituem ferramentas fundamentais na prática neuropediátrica, permitindo a identificação precoce de atrasos e desvios no desenvolvimento infantil. A detecção oportuna de alterações no neurodesenvolvimento é um dos pilares da neuropediatria moderna, pois possibilita a intervenção precoce e, consequentemente, melhores desfechos a longo prazo. Neste capítulo, apresentamos as cinco escalas mais utilizadas e relevantes para a avaliação do neurodesenvolvimento na infância."),
    emptyLine(),

    // M-CHAT-R/F
    heading2("2.1 M-CHAT-R/F — Modified Checklist for Autism in Toddlers, Revised with Follow-Up"),
    para("O M-CHAT-R/F (Modified Checklist for Autism in Toddlers, Revised with Follow-Up) é o instrumento de rastreamento para Transtorno do Espectro Autista (TEA) mais amplamente utilizado em todo o mundo. Desenvolvido para crianças entre 16 e 30 meses de idade, o questionário é respondido pelos pais ou cuidadores e pode ser aplicado tanto em consultas de rotina na atenção primária quanto em avaliações neuropediátricas especializadas. Sua versão revisada com follow-up (R/F) foi criada para reduzir a taxa de falsos positivos da versão original."),
    para("O instrumento é composto por 20 itens de resposta dicotômica (sim/não) que avaliam comportamentos considerados precursores ou marcadores precoces do TEA, incluindo atenção compartilhada, apontamento protodeclarativo, interesse por outras crianças, imitação, resposta ao nome e engajamento social. A pontuação total varia de 0 a 20, sendo que cada item falho recebe um ponto. O ponto de corte para risco é de 3 ou mais itens falhos na fase inicial de triagem."),
    para("A interpretação segue um sistema de três faixas de risco: baixo risco (0-2 pontos), risco moderado (3-7 pontos) e alto risco (8-20 pontos). Crianças com risco moderado devem ser submetidas ao Follow-Up estruturado, uma entrevista complementar com os pais que detalha cada item falho. Após o Follow-Up, se dois ou mais itens permanecerem positivos, a criança é encaminhada para avaliação diagnóstica especializada. Crianças com alto risco podem ser encaminhadas diretamente, sem necessidade de Follow-Up."),
    para("O M-CHAT-R/F apresenta sensibilidade de aproximadamente 85-92% e especificidade de 95-99% quando o Follow-Up é completado, demonstrando excelente desempenho como instrumento de triagem populacional. A aplicação é rápida, levando cerca de 5 minutos para o questionário inicial e 5-10 minutos para o Follow-Up. É recomendado pela Academia Americana de Pediatria (AAP) como parte da vigilância universal do desenvolvimento nas consultas de 18 e 24 meses."),
    para("Na prática clínica do NeuroPed, o M-CHAT-R/F é indicado sempre que houver queixa de atraso na fala, comportamentos repetitivos, isolamento social ou preocupação dos pais com o desenvolvimento sociocomunicativo. Sua aplicação deve ser complementada por observação clínica e, quando indicado, por instrumentos diagnósticos mais específicos como o CARS ou avaliação multidisciplinar completa."),
    emptyLine(),

    // CARS
    heading2("2.2 CARS — Childhood Autism Rating Scale"),
    para("A Childhood Autism Rating Scale (CARS) é uma escala de avaliação observacional utilizada para determinar a presença e a gravidade do Transtorno do Espectro Autista em crianças a partir dos 2 anos de idade. Diferentemente do M-CHAT-R/F, que é um instrumento de triagem parental, a CARS é preenchida por um profissional treinado com base na observação direta da criança e em informações coletadas junto aos cuidadores. É uma das escalas mais utilizadas tanto em contextos clínicos quanto em pesquisa."),
    para("O instrumento avalia 15 domínios comportamentais: relacionamento interpessoal, imitação, resposta emocional, uso do corpo, uso de objetos, adaptação a mudanças, resposta visual, resposta auditiva, resposta a paladar/olfato/tato, medo e nervosismo, comunicação verbal, comunicação não verbal, nível de atividade, nível e consistência da resposta intelectual, e impressão geral do examinador. Cada domínio recebe uma pontuação de 1 a 4, com intervalos de 0,5 pontos, totalizando um escore entre 15 e 60."),
    para("A classificação segue três faixas: ausência de autismo (15-29,5 pontos), autismo leve a moderado (30-36,5 pontos) e autismo grave (37-60 pontos). A CARS-2, versão atualizada, inclui duas formas: a CARS2-ST (Standard Form) para crianças com menos de 6 anos ou com QI estimado abaixo de 79, e a CARS2-HF (High Functioning) para indivíduos com 6 anos ou mais e QI de 80 ou superior, ampliando a sensibilidade para quadros de autismo leve."),
    para("A aplicação da CARS requer observação clínica de pelo menos 30-45 minutos, idealmente em contexto semiestruturado. O profissional deve observar interações espontâneas, respostas a estímulos sensoriais, padrões de comunicação e comportamentos estereotipados. A escala apresenta boa confiabilidade inter-avaliadores (0,71) e consistência interna elevada (alfa de Cronbach 0,94), sendo amplamente validada em diversos contextos culturais."),
    para("No contexto do NeuroPed, a CARS é indicada como instrumento complementar ao M-CHAT-R/F, especialmente quando se deseja quantificar a gravidade dos sintomas autísticos ou acompanhar a evolução clínica ao longo do tempo. É particularmente útil para documentar resposta ao tratamento e para auxiliar na definição de necessidades de suporte conforme os critérios do DSM-5."),
    emptyLine(),

    // Denver II
    heading2("2.3 Denver II — Teste de Triagem do Desenvolvimento"),
    para("O Teste de Triagem do Desenvolvimento de Denver II é um dos instrumentos mais consagrados e amplamente utilizados na avaliação global do desenvolvimento infantil, sendo aplicável desde o nascimento até os 6 anos de idade. Desenvolvido originalmente em 1967 por William K. Frankenburg e Josiah B. Dodds na Universidade do Colorado, o Denver II (revisão de 1992) avalia 125 itens distribuídos em quatro grandes domínios do desenvolvimento: pessoal-social, motor fino-adaptativo, linguagem e motor grosso."),
    para("A aplicação é realizada por profissional de saúde treinado através de observação direta da criança e entrevista com os pais. Cada item é classificado como \"passou\", \"falhou\", \"recusou\" ou \"sem oportunidade\". Os resultados são plotados em um formulário gráfico padronizado que permite visualizar rapidamente se o desempenho da criança se encontra dentro dos marcos esperados para sua idade. O tempo de aplicação varia de 10 a 20 minutos, dependendo da colaboração da criança e de sua faixa etária."),
    para("A interpretação do Denver II classifica o resultado global como \"normal\", \"suspeito\" ou \"não testável\". O resultado é considerado suspeito quando há dois ou mais itens de cautela (falha em itens que 75-90% das crianças da mesma idade já realizam) ou uma ou mais falhas (falha em itens que mais de 90% das crianças já realizam). Crianças com resultado suspeito devem ser reavaliadas em 1-2 semanas e, caso o resultado persista, encaminhadas para avaliação diagnóstica especializada."),
    para("É importante ressaltar que o Denver II é um instrumento de triagem, não de diagnóstico. Ele identifica crianças em risco de atraso no desenvolvimento, mas não determina a causa ou o diagnóstico específico. Sua sensibilidade varia de 56-83% e sua especificidade de 43-80%, dependendo do ponto de corte utilizado. Por essa razão, deve ser utilizado como parte de um programa de vigilância do desenvolvimento que inclua acompanhamento longitudinal e avaliação clínica contextualizada."),
    para("No NeuroPed, o Denver II é utilizado como instrumento de triagem universal do desenvolvimento em lactentes e pré-escolares. É especialmente indicado nas consultas de puericultura, na avaliação de prematuros (utilizando-se a idade corrigida até 2 anos), e como ponto de partida para a investigação de queixas de atraso global do desenvolvimento psicomotor (ADNPM)."),
    emptyLine(),

    // ASQ-3
    heading2("2.4 ASQ-3 — Ages and Stages Questionnaire, 3ª Edição"),
    para("O Ages and Stages Questionnaire, terceira edição (ASQ-3), é um instrumento de triagem do desenvolvimento baseado no relato dos pais, projetado para identificar crianças entre 1 e 60 meses de idade que possam necessitar de avaliação mais aprofundada. Desenvolvido por Jane Squires e Diane Bricker na Universidade de Oregon, o ASQ-3 é organizado em 21 questionários específicos para diferentes faixas etárias, cada um contendo 30 itens distribuídos em cinco domínios: comunicação, coordenação motora grossa, coordenação motora fina, resolução de problemas e pessoal-social."),
    para("Os pais ou cuidadores respondem a cada item indicando se a criança realiza a habilidade de forma consistente (\"sim\" = 10 pontos), às vezes (\"às vezes\" = 5 pontos) ou ainda não (\"ainda não\" = 0 pontos). A pontuação de cada domínio varia de 0 a 60 pontos, sendo comparada com pontos de corte específicos para cada faixa etária. Escores abaixo do ponto de corte indicam necessidade de encaminhamento, escores na zona de monitoramento sugerem acompanhamento mais próximo, e escores acima indicam desenvolvimento adequado."),
    para("Uma das grandes vantagens do ASQ-3 é sua facilidade de aplicação e custo-efetividade. O questionário pode ser enviado aos pais por correio, e-mail ou preenchido na sala de espera antes da consulta, levando cerca de 10-15 minutos para ser completado. A pontuação e interpretação levam aproximadamente 2-3 minutos. Estudos de validação demonstram sensibilidade de 86% e especificidade de 85%, com boa aceitação pelos pais."),
    para("O ASQ-3 conta com versões culturalmente adaptadas e validadas em diversos países, incluindo o Brasil, o que confere maior confiabilidade à sua utilização em nosso contexto. Além do questionário de desenvolvimento, existe o ASQ:SE-2 (Social-Emotional), um complemento que avalia especificamente as competências socioemocionais e comportamentais da criança."),
    para("No NeuroPed, o ASQ-3 é indicado como ferramenta de monitoramento longitudinal do desenvolvimento, sendo especialmente útil para acompanhamento em teleconsultas, triagem em programas de follow-up de prematuros e como instrumento complementar ao Denver II na vigilância do desenvolvimento em consultas de puericultura."),
    emptyLine(),

    // GMFCS
    heading2("2.5 GMFCS — Gross Motor Function Classification System"),
    para("O Gross Motor Function Classification System (GMFCS) é o sistema de classificação da função motora grossa mais utilizado mundialmente para crianças e adolescentes com Paralisia Cerebral (PC), sendo aplicável desde o nascimento até os 18 anos de idade. Desenvolvido por Robert Palisano e colaboradores no CanChild Centre for Childhood Disability Research da McMaster University, o GMFCS classifica a capacidade funcional de mobilidade em cinco níveis distintos, baseados no movimento autoiniciado com ênfase particular no sentar, no andar e na mobilidade com cadeira de rodas."),
    para("Os cinco níveis do GMFCS são organizados do mais funcional ao mais limitado: Nível I — anda sem limitações; Nível II — anda com limitações (dificuldade em terrenos irregulares, longas distâncias ou equilíbrio); Nível III — anda utilizando dispositivo auxiliar de locomoção (andador, muletas); Nível IV — mobilidade própria limitada, pode usar cadeira de rodas motorizada; Nível V — transportado em cadeira de rodas, controle postural gravemente limitado. Cada nível possui descrições específicas para quatro faixas etárias: antes dos 2 anos, 2-4 anos, 4-6 anos, 6-12 anos e 12-18 anos."),
    para("Uma característica fundamental do GMFCS é seu foco na função habitual da criança no dia a dia, e não no melhor desempenho possível em situação de avaliação. A classificação deve refletir o que a criança tipicamente faz, considerando o ambiente doméstico, escolar e comunitário. As distinções entre os níveis são clinicamente significativas: a diferença entre os níveis I e II reflete limitações na deambulação comunitária; entre II e III, a necessidade de dispositivos auxiliares; entre III e IV, a capacidade de deambulação funcional; e entre IV e V, a capacidade de automobilidade."),
    para("O GMFCS demonstra excelente confiabilidade inter e intra-avaliadores (kappa de 0,75-0,90) e boa estabilidade ao longo do tempo. Estudos longitudinais mostram que, embora a classificação possa mudar em crianças muito jovens, a maioria dos pacientes mantém o mesmo nível após os 4-6 anos. O sistema é complementado pelo GMFCS — Expanded and Revised (GMFCS-E&R), que inclui faixas etárias até 18 anos e melhor descrição da função na adolescência."),
    para("No NeuroPed, o GMFCS é utilizado como parte essencial da avaliação de crianças com Paralisia Cerebral, sendo fundamental para a comunicação entre profissionais, para o planejamento terapêutico, para a definição de metas realistas de reabilitação e para a documentação da gravidade funcional em relatórios e laudos médicos. A classificação orienta decisões sobre necessidade de órteses, indicação cirúrgica e prescrição de equipamentos de tecnologia assistiva."),
    new Paragraph({ children: [new PageBreak()] }),
  ];
  return content;
}

// ── Section 3: Escalas de Comportamento e TDAH ──
function secComportamento() {
  const scales = [
    {
      title: "3.1 SNAP-IV — Swanson, Nolan e Pelham, Versão IV",
      paragraphs: [
        "O SNAP-IV (Swanson, Nolan, and Pelham Rating Scale, Version IV) é o instrumento de avaliação de sintomas de TDAH mais utilizado na prática clínica brasileira, destinado a crianças e adolescentes de 6 a 18 anos. Baseado diretamente nos critérios diagnósticos do DSM, o questionário é respondido por pais e professores, oferecendo uma avaliação multi-informante que é essencial para o diagnóstico adequado do Transtorno de Déficit de Atenção e Hiperatividade.",
        "O instrumento contém 26 itens divididos em três subescalas: desatenção (9 itens), hiperatividade/impulsividade (9 itens) e sintomas de Transtorno Desafiador Opositivo (8 itens). Cada item é pontuado em uma escala Likert de 4 pontos: 0 (nem um pouco), 1 (só um pouco), 2 (bastante) e 3 (demais). A pontuação média é calculada dividindo-se a soma dos itens de cada subescala pelo número de itens. Pontuações médias acima de 1,78 para desatenção e 1,44 para hiperatividade/impulsividade são consideradas clinicamente significativas.",
        "A versão brasileira do SNAP-IV foi validada por Mattos e colaboradores, demonstrando propriedades psicométricas adequadas para uso na população brasileira. O instrumento é de domínio público e está disponível gratuitamente, o que contribui para sua ampla adoção na prática clínica e em pesquisa. A aplicação é rápida (5-10 minutos) e a interpretação é direta, facilitando sua incorporação na rotina ambulatorial.",
        "No NeuroPed, o SNAP-IV é indicado como instrumento de primeira linha para a avaliação de sintomas de TDAH, devendo ser sempre aplicado tanto para pais quanto para professores. A comparação entre os relatos permite avaliar a pervasividade dos sintomas, critério essencial para o diagnóstico de TDAH segundo o DSM-5. É também útil para monitorar a resposta ao tratamento farmacológico e comportamental.",
      ],
    },
    {
      title: "3.2 SDQ — Strengths and Difficulties Questionnaire",
      paragraphs: [
        "O Strengths and Difficulties Questionnaire (SDQ), ou Questionário de Capacidades e Dificuldades, é um instrumento de rastreamento breve e abrangente desenvolvido por Robert Goodman para identificar problemas emocionais e comportamentais em crianças e adolescentes de 4 a 17 anos. É considerado um dos melhores instrumentos de triagem em saúde mental infantil pela sua brevidade, validade psicométrica e disponibilidade em mais de 80 idiomas.",
        "O questionário contém 25 itens divididos em cinco subescalas de cinco itens cada: sintomas emocionais, problemas de conduta, hiperatividade/desatenção, problemas de relacionamento com colegas e comportamento prossocial. Cada item é pontuado como \"falso\" (0), \"mais ou menos verdadeiro\" (1) ou \"verdadeiro\" (2). O escore total de dificuldades (0-40) é calculado somando-se as quatro primeiras subescalas; a escala prossocial é pontuada separadamente. Existem versões para pais, professores e autoaplicação (11-17 anos).",
        "A interpretação utiliza três faixas: normal, limítrofe e anormal, com pontos de corte específicos para cada informante e cada subescala. O SDQ inclui ainda um suplemento de impacto que avalia se as dificuldades identificadas causam sofrimento e interferência funcional na vida da criança. Esse suplemento é particularmente útil para diferenciar variações comportamentais normais de problemas que necessitam intervenção.",
        "No NeuroPed, o SDQ é utilizado como instrumento de triagem ampla em saúde mental, sendo especialmente valioso por sua capacidade de identificar simultaneamente problemas internalizantes e externalizantes. É indicado como avaliação inicial em consultas de neuropediatria e como instrumento de monitoramento ao longo do acompanhamento clínico.",
      ],
    },
    {
      title: "3.3 Conners Abreviada — Escala Abreviada de Conners",
      paragraphs: [
        "A Escala Abreviada de Conners é uma versão reduzida do Conners Rating Scale, projetada para avaliação rápida de sintomas de TDAH e problemas comportamentais associados em crianças e adolescentes de 6 a 18 anos. Desenvolvida por C. Keith Conners, a versão abreviada mantém os itens com maior poder discriminativo da escala completa, permitindo uma avaliação eficiente em contextos clínicos com tempo limitado.",
        "A versão abreviada contém 10 itens pontuados em escala Likert de 4 pontos (0 = nada, 1 = pouco, 2 = bastante, 3 = muito). A soma total varia de 0 a 30, sendo que escores acima de 15 para meninos e 13 para meninas são considerados sugestivos de TDAH. O instrumento é respondido por pais ou professores e leva menos de 5 minutos para ser completado.",
        "Embora a versão abreviada sacrifique alguma abrangência em relação à escala completa (Conners-3, com 108 itens), ela mantém boa sensibilidade para identificação de casos de TDAH e é particularmente útil em contextos de triagem e monitoramento terapêutico. A escala Conners é reconhecida por sua longa tradição de uso em pesquisa e clínica, sendo uma das escalas mais citadas na literatura sobre TDAH.",
        "No NeuroPed, a Conners Abreviada é indicada como instrumento complementar ao SNAP-IV, especialmente útil para reavaliações rápidas e monitoramento da resposta ao tratamento. Sua brevidade a torna ideal para aplicação em retornos ambulatoriais e para acompanhamento da evolução dos sintomas ao longo do tempo.",
      ],
    },
    {
      title: "3.4 CBCL — Child Behavior Checklist",
      paragraphs: [
        "O Child Behavior Checklist (CBCL) é considerado o padrão-ouro entre os instrumentos de avaliação comportamental na infância e adolescência, sendo parte do Sistema de Avaliação Empiricamente Baseada de Achenbach (ASEBA). Aplicável a crianças e adolescentes de 1,5 a 18 anos, o CBCL é respondido pelos pais ou cuidadores e oferece o perfil comportamental mais completo disponível entre os instrumentos padronizados.",
        "O instrumento possui duas versões: CBCL/1.5-5 (para pré-escolares, com 99 itens) e CBCL/6-18 (para crianças em idade escolar e adolescentes, com 113 itens). Cada item descreve um comportamento específico pontuado como 0 (não verdadeiro), 1 (um pouco ou às vezes verdadeiro) ou 2 (muito verdadeiro ou frequentemente verdadeiro). Os itens são agrupados em oito síndromes empíricas: ansiedade/depressão, retraimento/depressão, queixas somáticas, problemas sociais, problemas de pensamento, problemas de atenção, comportamento de quebrar regras e comportamento agressivo.",
        "As oito síndromes são organizadas em dois fatores de ordem superior: problemas internalizantes (ansiedade/depressão, retraimento, queixas somáticas) e problemas externalizantes (quebrar regras, agressividade). O CBCL fornece também seis escalas orientadas pelo DSM (problemas afetivos, problemas de ansiedade, problemas somáticos, TDAH, TOD e problemas de conduta). Os escores brutos são convertidos em escores T (média 50, DP 10), sendo que T ≥ 70 é considerado clínico e T 65-69 é limítrofe.",
        "No NeuroPed, o CBCL é utilizado como instrumento abrangente de avaliação comportamental, sendo especialmente indicado em avaliações iniciais complexas, na investigação de comorbidades e para documentação detalhada do perfil comportamental da criança. Por sua complexidade, é complementar a instrumentos mais breves como o SDQ e SNAP-IV.",
      ],
    },
    {
      title: "3.5 Vanderbilt — Escala de Avaliação de TDAH de Vanderbilt",
      paragraphs: [
        "A Escala de Avaliação de TDAH de Vanderbilt (VADRS/VADTRS) é um instrumento diagnóstico desenvolvido pela Universidade Vanderbilt especificamente para auxiliar no diagnóstico e monitoramento do TDAH em crianças de 6 a 12 anos. Existem versões separadas para pais (VADPRS — 55 itens) e professores (VADTRS — 43 itens), ambas incorporando os critérios diagnósticos do DSM e avaliação de comorbidades.",
        "O diferencial da Vanderbilt é que, além dos sintomas nucleares de TDAH (desatenção e hiperatividade/impulsividade), ela avalia simultaneamente sintomas de Transtorno Desafiador Opositivo, Transtorno de Conduta, ansiedade e depressão. A versão para pais inclui também itens sobre desempenho acadêmico e relações interpessoais. Cada item de sintoma é pontuado de 0 (nunca) a 3 (muito frequentemente), e os itens de desempenho são classificados de 1 (excelente) a 5 (problemático).",
        "A interpretação é baseada na contagem de sintomas que atingem o limiar clínico (pontuação 2 ou 3): para o diagnóstico de TDAH predominantemente desatento, são necessários 6 ou mais sintomas de desatenção; para TDAH predominantemente hiperativo-impulsivo, 6 ou mais sintomas de hiperatividade/impulsividade; para TDAH combinado, 6 ou mais em ambas as subescalas. Adicionalmente, pelo menos um item de desempenho deve estar classificado como 4 ou 5.",
        "No NeuroPed, a Vanderbilt é especialmente valiosa por sua capacidade de avaliar simultaneamente TDAH e comorbidades comuns, facilitando a formulação diagnóstica integrada. É indicada como instrumento complementar na avaliação diagnóstica de TDAH, particularmente quando se suspeita de comorbidades comportamentais e emocionais.",
      ],
    },
    {
      title: "3.6 BRIEF-2 — Behavior Rating Inventory of Executive Function, 2ª Edição",
      paragraphs: [
        "O BRIEF-2 (Behavior Rating Inventory of Executive Function, Segunda Edição) é o instrumento mais utilizado para avaliação ecológica das funções executivas em crianças e adolescentes de 5 a 18 anos. Desenvolvido por Gerard A. Gioia e colaboradores, o BRIEF-2 avalia as manifestações comportamentais das funções executivas no ambiente cotidiano da criança, diferenciando-se dos testes neuropsicológicos tradicionais que medem habilidades em contexto estruturado de consultório.",
        "O instrumento contém 63 itens respondidos por pais ou professores em escala de três pontos: N (nunca), A (às vezes) e F (frequentemente). Os itens são agrupados em nove escalas clínicas: inibição, automonitoramento, flexibilidade, controle emocional, iniciativa, memória de trabalho, planejamento/organização, organização de materiais e monitoramento de tarefas. Essas escalas se organizam em três índices compostos: Índice de Regulação Comportamental, Índice de Regulação Emocional e Índice de Regulação Cognitiva, além do Composto Executivo Global.",
        "Os escores brutos são convertidos em escores T padronizados por idade e sexo. Escores T ≥ 65 são considerados clinicamente significativos, indicando dificuldade naquela função executiva específica. O BRIEF-2 inclui também três escalas de validade: inconsistência, frequência e negatividade, que avaliam a qualidade das respostas fornecidas.",
        "No NeuroPed, o BRIEF-2 é essencial para a avaliação funcional de crianças com TDAH, TEA e outras condições que afetam as funções executivas. Fornece um perfil detalhado das dificuldades executivas que orienta o planejamento de intervenções específicas e a comunicação com a escola sobre adaptações pedagógicas necessárias.",
      ],
    },
    {
      title: "3.7 ABC — Aberrant Behavior Checklist",
      paragraphs: [
        "O Aberrant Behavior Checklist (ABC) é um instrumento de avaliação de problemas comportamentais desenvolvido especificamente para populações com deficiência intelectual e transtornos do neurodesenvolvimento, aplicável a indivíduos de 3 a 18 anos. Criado por Michael Aman e Nirbhay Singh, o ABC é amplamente utilizado em ensaios clínicos farmacológicos como medida de desfecho comportamental em pacientes com TEA e deficiência intelectual.",
        "O instrumento contém 58 itens pontuados em escala de 4 pontos (0 = não é um problema, 3 = problema grave), agrupados em cinco subescalas: irritabilidade/agitação/choro (15 itens), letargia/retraimento social (16 itens), comportamento estereotipado (7 itens), hiperatividade/não aderência (16 itens) e fala inapropriada (4 itens). A subescala de irritabilidade é particularmente importante na prática clínica, sendo a medida primária de desfecho nos estudos que levaram à aprovação do aripiprazol e da risperidona para irritabilidade no TEA.",
        "A interpretação é baseada nos escores brutos de cada subescala, sendo que não há pontos de corte universalmente estabelecidos. A utilidade principal do ABC está na comparação longitudinal: reduções significativas nos escores indicam melhora comportamental com o tratamento. Uma redução de 25% ou mais na subescala de irritabilidade é geralmente considerada clinicamente significativa.",
        "No NeuroPed, o ABC é utilizado para avaliação e monitoramento de problemas comportamentais em crianças com TEA e deficiência intelectual, sendo especialmente valioso para documentar a eficácia de intervenções farmacológicas e comportamentais ao longo do tempo.",
      ],
    },
    {
      title: "3.8 Vineland-3 — Vineland Adaptive Behavior Scales, 3ª Edição",
      paragraphs: [
        "As Vineland Adaptive Behavior Scales, terceira edição (Vineland-3), são o instrumento mais reconhecido para avaliação do comportamento adaptativo em indivíduos desde o nascimento até os 90 anos de idade. Desenvolvidas originalmente por Sara Sparrow e revisadas por Celine Saulnier e colaboradores, as Vineland-3 avaliam o que o indivíduo efetivamente faz no cotidiano, complementando medidas de capacidade cognitiva com informações sobre funcionalidade real.",
        "O instrumento avalia quatro domínios principais: comunicação (receptiva, expressiva e escrita), habilidades de vida diária (pessoal, doméstica e comunitária), socialização (relações interpessoais, brincadeira/lazer e habilidades de enfrentamento) e habilidades motoras (motora grossa e motora fina). Os escores são expressos como escores padrão de domínio (média 100, DP 15) e um Composto de Comportamento Adaptativo. A Vineland-3 está disponível em formato de entrevista semiestruturada e formulário parental.",
        "A avaliação do comportamento adaptativo é fundamental para o diagnóstico de deficiência intelectual (junto à avaliação cognitiva), para a determinação do nível de suporte necessário no TEA (DSM-5) e para o planejamento de intervenções baseadas em habilidades funcionais. A Vineland-3 é também amplamente utilizada em processos de elegibilidade para serviços especiais, laudos periciais e definição de necessidades educacionais.",
        "No NeuroPed, a Vineland-3 é indicada como instrumento essencial na avaliação de crianças com TEA, deficiência intelectual e atraso global do desenvolvimento. Seu perfil detalhado de pontos fortes e fracos no comportamento adaptativo é fundamental para a elaboração de planos de intervenção individualizados e para a comunicação com equipes multidisciplinares.",
      ],
    },
  ];

  const content = [
    heading1("3. Escalas de Comportamento e TDAH"),
    para("A avaliação comportamental e a investigação de TDAH representam demandas frequentes no consultório neuropediátrico. A utilização de instrumentos padronizados é fundamental para garantir objetividade na avaliação, facilitar a comunicação entre profissionais e documentar a evolução clínica. Neste capítulo, apresentamos os oito instrumentos mais relevantes para a avaliação comportamental e do TDAH na infância e adolescência."),
    emptyLine(),
  ];

  scales.forEach(s => {
    content.push(heading2(s.title));
    s.paragraphs.forEach(p => content.push(para(p)));
    content.push(emptyLine());
  });

  content.push(new Paragraph({ children: [new PageBreak()] }));
  return content;
}

// ── Section 4: Saúde Mental ──
function secSaudeMental() {
  const scales = [
    {
      title: "4.1 SCARED — Screen for Child Anxiety Related Disorders",
      paragraphs: [
        "O SCARED (Screen for Child Anxiety Related Disorders) é um instrumento de rastreamento de transtornos de ansiedade em crianças e adolescentes de 8 a 18 anos, desenvolvido por Boris Birmaher e colaboradores na Universidade de Pittsburgh. O questionário foi projetado para identificar os cinco principais transtornos de ansiedade da infância conforme o DSM: transtorno de ansiedade generalizada, transtorno de ansiedade de separação, transtorno de pânico, fobia social e fobia escolar.",
        "O instrumento contém 41 itens respondidos em escala de três pontos: 0 (não é verdade ou quase nunca), 1 (às vezes é verdade) e 2 (é verdade ou quase sempre). Existem versões paralelas para a criança (autorrelato) e para os pais, sendo recomendada a aplicação de ambas para obter uma avaliação mais completa. O escore total varia de 0 a 82, com ponto de corte de 25 ou mais indicando presença provável de transtorno de ansiedade. Cada subescala possui pontos de corte específicos que orientam a identificação do subtipo de ansiedade predominante.",
        "Estudos de validação demonstram sensibilidade de 71% e especificidade de 67% para o ponto de corte de 25. A versão brasileira, adaptada por DeSousa e colaboradores, apresenta propriedades psicométricas adequadas para a população brasileira. O SCARED é de domínio público, gratuito e de fácil aplicação (10-15 minutos), sendo um dos instrumentos de triagem de ansiedade mais acessíveis e utilizados na prática clínica.",
        "No NeuroPed, o SCARED é indicado como instrumento de triagem para ansiedade em crianças e adolescentes, sendo especialmente útil na avaliação de queixas somáticas recorrentes (cefaleia, dor abdominal), recusa escolar, dificuldades de separação e sintomas inespecíficos que podem mascarar um transtorno de ansiedade subjacente.",
      ],
    },
    {
      title: "4.2 CDI-2 — Children's Depression Inventory, 2ª Edição",
      paragraphs: [
        "O Children's Depression Inventory, segunda edição (CDI-2), é o instrumento de autorrelato mais utilizado para avaliação de sintomas depressivos em crianças e adolescentes de 7 a 17 anos. Desenvolvido originalmente por Maria Kovacs e revisado em 2011, o CDI-2 avalia a presença e gravidade de sintomas depressivos com base no relato da própria criança, oferecendo uma perspectiva subjetiva essencial que complementa as informações fornecidas por pais e professores.",
        "A versão completa contém 28 itens, cada um com três opções de resposta que variam em gravidade (0, 1 ou 2 pontos). Os itens avaliam humor negativo, problemas interpessoais, autoestima negativa, ineficácia e anedonia. O escore total varia de 0 a 56, com escores T ≥ 65 considerados clinicamente significativos. A versão breve (CDI-2:SR[S]) contém 12 itens e é indicada para triagem rápida.",
        "O CDI-2 inclui também versões para pais (CDI-2:P) e professores (CDI-2:T), permitindo uma avaliação multi-informante. As subescalas do CDI-2 são organizadas em dois fatores de segunda ordem: problemas emocionais (humor negativo e autoestima negativa) e problemas funcionais (ineficácia e problemas interpessoais). Essa estrutura permite a identificação de áreas específicas de dificuldade.",
        "No NeuroPed, o CDI-2 é indicado para avaliação de sintomas depressivos em crianças e adolescentes, sendo especialmente relevante na investigação de comorbidades com TDAH, TEA e dificuldades de aprendizagem. É fundamental que profissionais estejam atentos a itens relacionados à ideação suicida, que exigem avaliação imediata e encaminhamento quando presentes.",
      ],
    },
    {
      title: "4.3 PHQ-A — Patient Health Questionnaire for Adolescents",
      paragraphs: [
        "O Patient Health Questionnaire for Adolescents (PHQ-A) é uma adaptação do PHQ-9 para a população adolescente de 12 a 17 anos, desenvolvida como instrumento de rastreamento para Transtorno Depressivo Maior. O PHQ-A mantém os nove itens do PHQ-9 original, cada um correspondendo a um critério diagnóstico do DSM-5 para depressão maior, com linguagem adaptada para a compreensão de adolescentes.",
        "Cada item é respondido em escala de frequência de 0 (nenhuma vez) a 3 (quase todos os dias), referente às últimas duas semanas. O escore total varia de 0 a 27, classificado em cinco faixas: nenhuma ou mínima (0-4), leve (5-9), moderada (10-14), moderadamente grave (15-19) e grave (20-27). O ponto de corte recomendado para rastreamento é de 11 ou mais, com sensibilidade de 73% e especificidade de 94%.",
        "O PHQ-A inclui perguntas adicionais sobre funcionamento (escola, trabalho, relacionamentos, atividades de lazer) e um item sobre ideação suicida que requer atenção imediata quando positivo. O instrumento é de domínio público, rápido (menos de 5 minutos) e amplamente validado em diversas culturas.",
        "No NeuroPed, o PHQ-A é indicado como ferramenta de triagem rápida para depressão em adolescentes, sendo particularmente útil nas consultas de rotina e no monitoramento de pacientes com condições neurológicas crônicas que apresentam risco elevado de depressão secundária.",
      ],
    },
    {
      title: "4.4 C-SSRS — Columbia Suicide Severity Rating Scale",
      paragraphs: [
        "A Columbia Suicide Severity Rating Scale (C-SSRS) é o instrumento de avaliação de risco suicida mais amplamente adotado mundialmente, aplicável a partir dos 6 anos de idade. Desenvolvida por Kelly Posner e colaboradores na Universidade de Columbia, a C-SSRS foi criada para padronizar a avaliação de ideação e comportamento suicida, utilizando uma nomenclatura precisa que diferencia claramente pensamentos suicidas de comportamentos autolesivos.",
        "O instrumento avalia duas dimensões: ideação suicida (cinco níveis de gravidade, desde desejo de estar morto até ideação com plano e intenção) e comportamento suicida (quatro categorias: preparação, tentativa abortada, tentativa interrompida e tentativa real). Cada dimensão é avaliada para o período recente (último mês) e ao longo da vida. A versão de triagem (Screener) contém seis itens e pode ser aplicada em menos de 3 minutos.",
        "A C-SSRS tem sido adotada como padrão pelo FDA (Food and Drug Administration) para ensaios clínicos em psiquiatria, pela Organização Mundial da Saúde e por diversos sistemas de saúde como protocolo universal de avaliação de risco suicida. Sua estrutura clara e algoritmo de decisão facilitam a triagem e o encaminhamento adequado.",
        "No NeuroPed, a C-SSRS é uma ferramenta essencial para avaliação de risco suicida em crianças e adolescentes, sendo indicada sempre que houver relato de ideação suicida, autolesão, mudanças comportamentais abruptas ou presença de fatores de risco significativos. Sua aplicação é mandatória como protocolo de segurança em todos os pacientes com depressão moderada a grave.",
      ],
    },
    {
      title: "4.5 CRAFFT — Triagem para Uso de Substâncias em Adolescentes",
      paragraphs: [
        "O CRAFFT (Car, Relax, Alone, Forget, Friends, Trouble) é o instrumento de triagem para uso de substâncias psicoativas mais recomendado para adolescentes de 12 a 21 anos. Desenvolvido por John R. Knight e colaboradores no Boston Children's Hospital, o nome é um acrônimo formado pelas situações-chave avaliadas: uso em carro (Car), para relaxar (Relax), sozinho (Alone), esquecimento (Forget), uso com amigos (Friends) e problemas (Trouble).",
        "O instrumento contém duas partes: a Parte A com três perguntas de triagem sobre uso de álcool, maconha e outras substâncias nos últimos 12 meses; e a Parte B com seis perguntas do acrônimo CRAFFT. Se o adolescente nega qualquer uso na Parte A, aplica-se apenas a primeira pergunta da Parte B (sobre andar em veículo com condutor alcoolizado). Se reporta qualquer uso, todas as seis perguntas são aplicadas. Dois ou mais itens positivos na Parte B indicam risco elevado.",
        "A versão 2.1 (CRAFFT 2.1) incorpora vaping (cigarro eletrônico) nas perguntas de triagem, refletindo mudanças nos padrões de uso de substâncias entre adolescentes. O instrumento possui sensibilidade de 76% e especificidade de 94% para identificação de transtorno por uso de substâncias. É de domínio público e leva menos de 5 minutos para aplicação.",
        "No NeuroPed, o CRAFFT é indicado como triagem universal para uso de substâncias em adolescentes, sendo particularmente importante na avaliação de pacientes com TDAH (risco elevado de uso de substâncias), transtornos de conduta, depressão e mudanças comportamentais inexplicadas. A identificação precoce permite intervenção breve e encaminhamento adequado.",
      ],
    },
  ];

  const content = [
    heading1("4. Saúde Mental"),
    para("A avaliação da saúde mental na infância e adolescência é uma dimensão essencial da prática neuropediátrica. Transtornos de ansiedade, depressão e risco suicida são comorbidades frequentes em pacientes com condições neurológicas e do neurodesenvolvimento. Este capítulo apresenta os instrumentos padronizados mais relevantes para a triagem e avaliação de condições de saúde mental na faixa pediátrica."),
    emptyLine(),
  ];

  scales.forEach(s => {
    content.push(heading2(s.title));
    s.paragraphs.forEach(p => content.push(para(p)));
    content.push(emptyLine());
  });

  content.push(new Paragraph({ children: [new PageBreak()] }));
  return content;
}

// ── Section 5: Sono e Qualidade de Vida ──
function secSonoQV() {
  const content = [
    heading1("5. Sono e Qualidade de Vida"),
    para("Distúrbios do sono, tiques e redução da qualidade de vida são condições frequentemente encontradas em crianças acompanhadas em neuropediatria. A avaliação sistemática dessas dimensões é fundamental para o manejo clínico integral e para a documentação de desfechos terapêuticos."),
    emptyLine(),

    heading2("5.1 CSHQ — Children's Sleep Habits Questionnaire"),
    para("O Children's Sleep Habits Questionnaire (CSHQ) é o instrumento de avaliação de hábitos de sono mais utilizado na faixa etária de 4 a 10 anos. Desenvolvido por Judith Owens e colaboradores, o CSHQ avalia os padrões de sono da criança com base no relato dos pais, identificando problemas que frequentemente passam despercebidos na consulta clínica de rotina. O questionário foi construído com base nas categorias diagnósticas da Classificação Internacional de Distúrbios do Sono."),
    para("O instrumento contém 45 itens agrupados em oito subescalas: resistência para dormir, latência do sono, duração do sono, ansiedade do sono, despertares noturnos, parassonias, distúrbio respiratório do sono e sonolência diurna. Cada item é pontuado em escala de 3 pontos (habitualmente = 5-7 vezes/semana, às vezes = 2-4 vezes/semana, raramente = 0-1 vez/semana). O escore total varia de 33 a 99, com ponto de corte de 41 ou mais sugerindo distúrbio do sono clinicamente significativo."),
    para("A prevalência de distúrbios do sono em crianças com condições neurológicas é significativamente elevada: 50-80% das crianças com TEA, 25-50% das crianças com TDAH e 20-40% das crianças com epilepsia apresentam problemas de sono. O CSHQ permite a identificação específica do tipo de distúrbio, orientando a abordagem terapêutica (higiene do sono, melatonina, tratamento comportamental ou investigação complementar)."),
    para("No NeuroPed, o CSHQ é indicado como instrumento de rotina na avaliação de crianças com queixas de dificuldades de sono, sendo também recomendado como triagem em populações de risco elevado (TEA, TDAH, epilepsia). Os resultados orientam tanto intervenções não farmacológicas quanto a necessidade de polissonografia ou outras investigações complementares."),
    emptyLine(),

    heading2("5.2 YGTSS — Yale Global Tic Severity Scale"),
    para("A Yale Global Tic Severity Scale (YGTSS) é o instrumento padrão-ouro para avaliação da gravidade de tiques em crianças e adolescentes de 5 a 18 anos. Desenvolvida por James Leckman e colaboradores na Universidade Yale, a YGTSS é uma escala semiestruturada aplicada por profissional treinado que avalia detalhadamente tiques motores e vocais separadamente."),
    para("Para cada tipo de tique (motor e vocal), são avaliadas cinco dimensões: número (variedade de tiques diferentes), frequência (com que frequência ocorrem), intensidade (força ou volume), complexidade (simples vs. complexos) e interferência (impacto nas atividades). Cada dimensão é pontuada de 0 a 5, gerando um escore parcial de 0-25 para tiques motores e 0-25 para tiques vocais. O escore total de gravidade (0-50) é a soma dos escores motor e vocal. Um escore adicional de prejuízo global (0-50) avalia o impacto funcional dos tiques."),
    para("A classificação de gravidade segue as faixas: mínimo (0-9), leve (10-19), moderado (20-29), moderado-grave (30-39) e grave (40-50). A YGTSS é fundamental para documentar a gravidade basal dos tiques, monitorar a resposta ao tratamento farmacológico (incluindo antipsicóticos atípicos e agonistas alfa-2 adrenérgicos) e para a tomada de decisão sobre início ou modificação do tratamento."),
    para("No NeuroPed, a YGTSS é o instrumento de referência para avaliação de pacientes com Transtorno de Tiques, incluindo Síndrome de Tourette. Sua aplicação sistemática permite o acompanhamento longitudinal padronizado e a comunicação objetiva da gravidade dos tiques entre profissionais."),
    emptyLine(),

    heading2("5.3 PedsQL — Pediatric Quality of Life Inventory"),
    para("O Pediatric Quality of Life Inventory (PedsQL) é o instrumento de avaliação de qualidade de vida relacionada à saúde mais utilizado na pediatria, aplicável a crianças e adolescentes de 2 a 18 anos. Desenvolvido por James W. Varni, o PedsQL avalia a percepção da criança e de seus pais sobre o impacto de condições de saúde na qualidade de vida, fornecendo uma medida centrada no paciente que complementa parâmetros clínicos objetivos."),
    para("O módulo genérico (PedsQL 4.0) contém 23 itens distribuídos em quatro domínios: funcionamento físico (8 itens), funcionamento emocional (5 itens), funcionamento social (5 itens) e funcionamento escolar (5 itens). Os itens são respondidos em escala de 5 pontos referente ao último mês (0 = nunca é um problema, 4 = quase sempre é um problema). Os escores são transformados para uma escala de 0-100 (100 = melhor qualidade de vida). Existem versões de autorrelato adaptadas por faixa etária (5-7, 8-12, 13-18 anos) e versão parental para todas as faixas."),
    para("Além do módulo genérico, existem módulos específicos para diversas condições, incluindo epilepsia, paralisia cerebral, doenças neuromusculares e TDAH. Esses módulos específicos avaliam dimensões de qualidade de vida particularmente relevantes para cada condição, permitindo uma avaliação mais sensível aos impactos específicos da doença."),
    para("No NeuroPed, o PedsQL é indicado como medida de desfecho centrada no paciente, sendo especialmente útil para documentar o impacto funcional de condições neurológicas crônicas, avaliar a eficácia global do tratamento e identificar áreas de maior comprometimento na qualidade de vida que possam requerer intervenção específica."),
    new Paragraph({ children: [new PageBreak()] }),
  ];
  return content;
}

// ── Section 6: Bateria Autoral ──
function secBateriaAutoral() {
  const protocols = [
    {
      title: "6.1 EMDI — Escala de Monitoramento do Desenvolvimento Infantil (Triagem do Desenvolvimento)",
      paragraphs: [
        "A Escala de Monitoramento do Desenvolvimento Infantil (EMDI) é o primeiro instrumento da Bateria Autoral Dr. Jadson 2026, projetada para triagem rápida e abrangente do desenvolvimento neuropsicomotor em crianças desde o nascimento até os primeiros anos de vida. A EMDI foi desenvolvida a partir da experiência clínica acumulada pelo Dr. Jadson Fraga no atendimento de centenas de crianças com suspeita de atraso do desenvolvimento.",
        "O instrumento avalia marcos do desenvolvimento em múltiplos domínios — motor grosso, motor fino, linguagem receptiva, linguagem expressiva, cognição e comportamento socioadaptativo — utilizando itens calibrados por faixa etária e culturalmente adaptados para a população brasileira. Cada domínio é avaliado através de itens observacionais e relatos parentais, gerando um perfil gráfico que permite a visualização rápida de áreas de força e vulnerabilidade.",
        "A EMDI foi concebida para preencher uma lacuna identificada na prática clínica: a necessidade de um instrumento de triagem do desenvolvimento que seja simultaneamente abrangente, rápido de aplicar, adaptado à realidade brasileira e sensível às nuances culturais regionais. Seu formato permite aplicação por profissionais de diferentes formações, incluindo pediatras, enfermeiros e agentes comunitários de saúde.",
        "Na prática do NeuroPed, a EMDI é utilizada como instrumento de triagem inicial, identificando crianças que necessitam de avaliação mais aprofundada com instrumentos complementares como o Denver II, ASQ-3 ou avaliação neuropsicológica formal.",
      ],
    },
    {
      title: "6.2 EAF — Escala de Avaliação Funcional",
      paragraphs: [
        "A Escala de Avaliação Funcional (EAF) é um instrumento desenvolvido para mensurar o nível de funcionalidade global de crianças e adolescentes com condições neurológicas e do neurodesenvolvimento. Inspirada na filosofia da CIF (Classificação Internacional de Funcionalidade, Incapacidade e Saúde), a EAF avalia a capacidade funcional real da criança nos contextos doméstico, escolar e social.",
        "O instrumento abrange domínios como autocuidado, mobilidade, comunicação funcional, participação social, desempenho escolar e independência nas atividades de vida diária. Cada domínio é avaliado em uma escala graduada que considera tanto a capacidade (o que a criança consegue fazer) quanto o desempenho (o que efetivamente faz no dia a dia), refletindo a influência de fatores ambientais e contextuais.",
        "A EAF foi desenvolvida para suprir a necessidade de um instrumento funcional prático e culturalmente sensível que possa ser utilizado tanto na avaliação inicial quanto no monitoramento longitudinal de pacientes neuropediátricos. Seus resultados orientam a elaboração de planos de intervenção individualizados e a definição de metas terapêuticas realistas.",
        "No NeuroPed, a EAF é aplicada em conjunto com outros instrumentos da bateria para compor um perfil funcional completo do paciente, sendo especialmente útil para a comunicação com equipes multidisciplinares e para a documentação de progresso terapêutico em relatórios e laudos.",
      ],
    },
    {
      title: "6.3 PDAE — Perfil de Dificuldades de Aprendizagem Escolar",
      paragraphs: [
        "O Perfil de Dificuldades de Aprendizagem Escolar (PDAE) é um instrumento direcionado à identificação e caracterização de dificuldades de aprendizagem em crianças em idade escolar. Desenvolvido pelo Dr. Jadson Fraga, o PDAE avalia múltiplas dimensões da aprendizagem, incluindo leitura, escrita, matemática, atenção, memória de trabalho, velocidade de processamento e funções executivas aplicadas ao contexto escolar.",
        "O instrumento é respondido conjuntamente por pais e professores, permitindo uma visão integrada do desempenho acadêmico e das estratégias de aprendizagem da criança nos diferentes contextos. Cada dimensão é avaliada quanto à presença, frequência e impacto das dificuldades, gerando um perfil detalhado que orienta a investigação diagnóstica e o planejamento de intervenções pedagógicas e terapêuticas.",
        "O PDAE foi projetado para diferenciar dificuldades de aprendizagem primárias (Transtornos Específicos de Aprendizagem — dislexia, disgrafia, discalculia) de dificuldades secundárias a outras condições (TDAH, deficiência intelectual, problemas emocionais, fatores socioambientais). Essa diferenciação é fundamental para a definição da abordagem terapêutica adequada.",
        "No NeuroPed, o PDAE é indicado para todas as crianças com queixa de dificuldade escolar, sendo o ponto de partida para a investigação das causas subjacentes e para o encaminhamento para avaliação neuropsicológica, psicopedagógica ou fonoaudiológica quando necessário.",
      ],
    },
    {
      title: "6.4 ECSM — Escala de Comportamento e Saúde Mental",
      paragraphs: [
        "A Escala de Comportamento e Saúde Mental (ECSM) é um instrumento abrangente de avaliação do comportamento e da saúde mental de crianças e adolescentes, desenvolvido pelo Dr. Jadson Fraga para integrar dimensões comportamentais e emocionais em um único protocolo. A ECSM avalia sintomas internalizantes (ansiedade, depressão, somatização) e externalizantes (oposição, agressividade, hiperatividade) de forma equilibrada.",
        "O diferencial da ECSM é sua abordagem dimensional integrada, que avalia simultaneamente regulação emocional, competências sociais, autoconceito, resiliência e fatores de proteção, além dos sintomas psicopatológicos tradicionais. Essa abordagem permite não apenas identificar problemas, mas também mapear recursos e pontos fortes da criança que podem ser potencializados na intervenção.",
        "O instrumento inclui itens que avaliam o contexto familiar, escolar e social, reconhecendo que o comportamento infantil é fortemente influenciado por fatores ambientais. A ECSM gera um perfil biopsicossocial que orienta a formulação de caso e a definição de estratégias de intervenção multimodal.",
        "No NeuroPed, a ECSM é utilizada como instrumento de avaliação ampla da saúde mental, complementando escalas mais específicas como o SDQ, SNAP-IV ou SCARED. É especialmente indicada para casos complexos com múltiplas comorbidades comportamentais e emocionais.",
      ],
    },
    {
      title: "6.5 IPS — Índice de Integração Psicossocial",
      paragraphs: [
        "O Índice de Integração Psicossocial (IPS) é o instrumento que completa a Bateria Autoral Dr. Jadson 2026, avaliando o grau de integração e participação social da criança ou adolescente nos seus diferentes contextos de vida. O IPS avalia inclusão escolar, participação em atividades extracurriculares, qualidade das relações com pares, dinâmica familiar e acesso a recursos comunitários.",
        "O instrumento foi desenvolvido com base no modelo biopsicossocial da CIF, reconhecendo que a saúde e o bem-estar da criança não podem ser avaliados apenas em termos de sintomas e déficits, mas devem considerar o nível de participação e engajamento social. O IPS avalia tanto barreiras à participação quanto facilitadores ambientais, orientando intervenções nos múltiplos contextos de vida da criança.",
        "O IPS é particularmente relevante para crianças com condições crônicas e deficiências, para as quais a integração social é frequentemente comprometida. O instrumento permite identificar áreas específicas de exclusão ou dificuldade de participação, orientando ações de advocacy, adaptações ambientais e programas de inclusão.",
        "No NeuroPed, o IPS complementa as demais escalas da bateria, fornecendo uma visão holística do funcionamento da criança que vai além dos aspectos clínicos e comportamentais. É utilizado para a elaboração de planos de intervenção integrais e para a avaliação de desfechos centrados na participação social.",
      ],
    },
  ];

  const content = [
    heading1("6. Bateria Autoral Dr. Jadson — 2026"),
    para("A Bateria Autoral Dr. Jadson — 2026 representa uma contribuição original à prática neuropediátrica brasileira. Desenvolvida pelo Dr. Jadson Fraga Araújo Júnior ao longo de sua experiência clínica, a bateria é composta por cinco protocolos inéditos que, em conjunto, oferecem uma avaliação abrangente e integrada do neurodesenvolvimento, funcionalidade, aprendizagem, saúde mental e integração psicossocial. Os instrumentos foram concebidos para serem culturalmente sensíveis e adaptados à realidade clínica brasileira."),
    emptyLine(),
  ];

  protocols.forEach(p => {
    content.push(heading2(p.title));
    p.paragraphs.forEach(t => content.push(para(t)));
    content.push(emptyLine());
  });

  content.push(new Paragraph({ children: [new PageBreak()] }));
  return content;
}

// ── Section 7: Escalas de Regulação Emocional ──
function secRegulacaoEmocional() {
  const scales = [
    {
      title: "7.1 ECAR-SI J26 — Escala de Avaliação de Autoagressão e Suicidalidade",
      paragraphs: [
        "A ECAR-SI J26 é uma escala desenvolvida pelo Dr. Jadson Fraga para avaliação sistematizada de comportamentos autoagressivos e risco de suicidalidade na população pediátrica. O instrumento foi projetado para captar um espectro de comportamentos que vão desde a autoagressão não suicida (skin picking, head banging, mordeduras) até a ideação suicida estruturada, permitindo uma avaliação graduada de risco.",
        "O instrumento avalia frequência, intensidade, métodos, gatilhos e fatores de proteção associados aos comportamentos autoagressivos. Diferencia comportamentos de autorregulação sensorial (comuns no TEA) de comportamentos autoagressivos com intenção de morte, utilizando um algoritmo de classificação de risco que orienta a urgência de intervenção.",
        "A ECAR-SI J26 é complementar à C-SSRS, oferecendo uma avaliação mais detalhada das especificidades da autoagressão na população neuropediátrica. É indicada para pacientes com TEA, deficiência intelectual e condições neuropsiquiátricas que frequentemente apresentam comportamentos autoagressivos que requerem diferenciação clínica cuidadosa.",
      ],
    },
    {
      title: "7.2 EDI-J26 — Escala de Depressão Infantil",
      paragraphs: [
        "A EDI-J26 é uma escala autoral de avaliação de sintomas depressivos na infância, desenvolvida pelo Dr. Jadson Fraga com foco nas manifestações clínicas da depressão que são específicas da faixa etária pediátrica. O instrumento reconhece que a depressão na infância frequentemente se manifesta de forma atípica, com irritabilidade proeminente, queixas somáticas, regressão comportamental e declínio no desempenho escolar.",
        "O instrumento avalia humor deprimido e irritável, anedonia, alterações no sono e apetite, fadiga, dificuldade de concentração, autoestima negativa, culpa excessiva e ideação suicida, utilizando linguagem adaptada à compreensão infantil. A EDI-J26 inclui itens específicos para manifestações da depressão em crianças com condições neurológicas, como exacerbação de crises epilépticas, piora de tiques e regressão de habilidades.",
        "No NeuroPed, a EDI-J26 é utilizada como instrumento complementar ao CDI-2, oferecendo uma perspectiva clínica mais contextualizada para a população neuropediátrica e facilitando a identificação de depressão em crianças com dificuldades de comunicação ou compreensão verbal.",
      ],
    },
    {
      title: "7.3 EAI-J26 — Escala de Ansiedade Infantil",
      paragraphs: [
        "A EAI-J26 é uma escala de avaliação de sintomas ansiosos na infância, projetada para captar as diferentes manifestações de ansiedade em crianças em desenvolvimento. O instrumento avalia ansiedade generalizada, ansiedade de separação, medos específicos, fobia social e manifestações somáticas da ansiedade, utilizando itens calibrados para diferentes faixas etárias.",
        "O diferencial da EAI-J26 é sua abordagem que integra manifestações cognitivas, comportamentais e somáticas da ansiedade, reconhecendo que crianças pequenas frequentemente expressam ansiedade através de sintomas físicos (dor abdominal, cefaleia, náusea) e comportamentos (recusa escolar, aderência excessiva, dificuldade de separação) mais do que através de relato verbal de preocupação.",
        "No NeuroPed, a EAI-J26 complementa o SCARED, oferecendo uma avaliação mais sensível às especificidades da ansiedade em crianças mais jovens e em pacientes com condições neurológicas que podem apresentar ansiedade como comorbidade ou como resposta emocional à condição de base.",
      ],
    },
    {
      title: "7.4 EASI-J26 — Escala de Ansiedade Social Infantil",
      paragraphs: [
        "A EASI-J26 é um instrumento específico para avaliação de ansiedade social em crianças e adolescentes. O instrumento avalia medo de avaliação negativa, evitação de situações sociais, dificuldade de interação com pares, ansiedade de desempenho e suas manifestações fisiológicas associadas (rubor, sudorese, tremor, sensação de bolo na garganta).",
        "A escala diferencia timidez temperamental de transtorno de ansiedade social patológico, avaliando o grau de interferência funcional nas atividades acadêmicas, sociais e recreativas. Inclui itens que avaliam o impacto da ansiedade social no contexto escolar, fundamental para orientar adaptações pedagógicas e intervenções terapêuticas.",
        "No NeuroPed, a EASI-J26 é indicada para avaliação de crianças e adolescentes com queixas de isolamento social, recusa escolar, dificuldade de fazer amigos ou participar de atividades em grupo, sendo especialmente relevante na avaliação de pacientes com TEA de alto funcionamento que frequentemente apresentam ansiedade social como comorbidade.",
      ],
    },
    {
      title: "7.5 EMS-J26 — Escala de Mutismo Seletivo",
      paragraphs: [
        "A EMS-J26 é uma escala projetada para avaliação do Mutismo Seletivo em crianças, condição frequentemente subdiagnosticada na qual a criança não fala consistentemente em situações sociais específicas apesar de ser capaz de fazê-lo em outros contextos. O instrumento avalia o padrão de comunicação da criança em diferentes ambientes (casa, escola, consultório, locais públicos) e com diferentes interlocutores (familiares, professores, colegas, estranhos).",
        "A escala mapeia o espectro de comunicação da criança, desde comunicação verbal fluente até ausência completa de vocalização, incluindo formas intermediárias como sussurro, comunicação por gestos e uso de intermediários. Avalia também fatores associados como ansiedade social, temperamento inibido, história de atraso de linguagem e fatores familiares.",
        "No NeuroPed, a EMS-J26 é o instrumento de referência para avaliação de crianças com suspeita de Mutismo Seletivo, orientando o diagnóstico diferencial com TEA, transtorno de linguagem e fobia social, e auxiliando no planejamento de intervenções graduais baseadas em exposição.",
      ],
    },
    {
      title: "7.6 ETARE-J26 — Escala de Transtorno Alimentar Restritivo/Evitativo",
      paragraphs: [
        "A ETARE-J26 é uma escala de avaliação do Transtorno Alimentar Restritivo/Evitativo (ARFID) em crianças, condição caracterizada por restrição alimentar significativa que não é motivada por preocupações com peso ou imagem corporal. O instrumento avalia seletividade alimentar, aversões sensoriais a alimentos, medo de consequências aversivas (engasgo, vômito, dor), desinteresse por alimentação e impacto nutricional e de crescimento.",
        "O instrumento diferencia seletividade alimentar dentro dos limites do normal (comum em pré-escolares) de restrição alimentar clinicamente significativa que compromete o estado nutricional, o crescimento, o funcionamento psicossocial ou que requer suplementação. Inclui também avaliação de comportamentos alimentares comuns em crianças com TEA, que apresentam prevalência elevada de seletividade alimentar com base sensorial.",
        "No NeuroPed, a ETARE-J26 é indicada para avaliação de crianças com queixas alimentares, especialmente em pacientes com TEA, e orienta o encaminhamento para acompanhamento nutricional e terapia alimentar especializada quando necessário.",
      ],
    },
    {
      title: "7.7 EAAH-J26 — Escala de Autoagressividade e Heteroagressividade",
      paragraphs: [
        "A EAAH-J26 é uma escala de avaliação de comportamentos agressivos direcionados a si mesmo e a terceiros em crianças e adolescentes com condições neurológicas e do neurodesenvolvimento. O instrumento diferencia agressividade reativa (impulsiva, em resposta a frustrações) de agressividade proativa (instrumental, planejada), e avalia separadamente comportamentos de autoagressão e heteroagressão.",
        "O instrumento avalia frequência, intensidade, alvos, gatilhos, contextos de ocorrência e estratégias de regulação utilizadas pela criança e pelos cuidadores. Inclui avaliação de fatores contribuintes como dor, desconforto sensorial, dificuldade de comunicação, efeitos de medicações e alterações ambientais, que são particularmente relevantes em crianças com TEA e deficiência intelectual.",
        "No NeuroPed, a EAAH-J26 é fundamental para a avaliação e manejo de comportamentos agressivos, sendo utilizada para diferenciar as causas subjacentes da agressividade e orientar intervenções comportamentais, ambientais e farmacológicas. O monitoramento longitudinal com a EAAH-J26 permite documentar a eficácia das intervenções implementadas.",
      ],
    },
  ];

  const content = [
    heading1("7. Escalas de Regulação Emocional"),
    para("As Escalas de Regulação Emocional são um conjunto de sete instrumentos autorais desenvolvidos pelo Dr. Jadson Fraga Araújo Júnior, designados pelo sufixo J26 (Jadson 2026). Essas escalas abordam dimensões emocionais e comportamentais específicas frequentemente encontradas na prática neuropediátrica, oferecendo ferramentas padronizadas para avaliação e monitoramento."),
    emptyLine(),
  ];

  scales.forEach(s => {
    content.push(heading2(s.title));
    s.paragraphs.forEach(p => content.push(para(p)));
    content.push(emptyLine());
  });

  content.push(new Paragraph({ children: [new PageBreak()] }));
  return content;
}

// ── Section 8: Farmacologia ──
function secFarmacologia() {
  const categories = [
    { name: "TEA (Transtorno do Espectro Autista)", drugs: [
      ["Risperidona", "0,25-0,5 mg/dia → até 1-3 mg/dia", "Irritabilidade, agressividade no TEA. FDA aprovado ≥5a."],
      ["Aripiprazol", "2 mg/dia → até 5-15 mg/dia", "Irritabilidade no TEA. FDA aprovado 6-17a."],
      ["Melatonina", "0,5-1 mg → até 3-10 mg/noite", "Insônia no TEA. 30-60 min antes de dormir."],
      ["N-Acetilcisteína", "600-900 mg/dia → até 2700 mg/dia", "Adjuvante para irritabilidade e estereotipias."],
      ["Ocitocina intranasal", "12-24 UI/dia", "Experimental para cognição social no TEA."],
    ]},
    { name: "TDAH (Transtorno de Déficit de Atenção e Hiperatividade)", drugs: [
      ["Metilfenidato IR", "5 mg 2x/dia → até 60 mg/dia", "Primeira linha. Início de ação 20-30 min."],
      ["Metilfenidato LA", "10 mg/dia → até 60 mg/dia", "Liberação prolongada 8h. Dose única matinal."],
      ["Lisdexanfetamina", "30 mg/dia → até 70 mg/dia", "Pró-fármaco. Duração 13-14h. ≥6 anos."],
      ["Atomoxetina", "0,5 mg/kg/dia → até 1,4 mg/kg/dia", "Não estimulante. Efeito pleno em 4-6 sem."],
      ["Guanfacina XR", "1 mg/dia → até 4 mg/dia", "Agonista alfa-2. Útil para hiperatividade e tiques."],
      ["Clonidina", "0,05 mg/noite → até 0,3 mg/dia", "Adjuvante para insônia e hiperatividade."],
    ]},
    { name: "TOD (Transtorno Desafiador Opositivo)", drugs: [
      ["Risperidona", "0,25-0,5 mg/dia → até 1-2 mg/dia", "Agressividade refratária a intervenções comportamentais."],
      ["Aripiprazol", "2 mg/dia → até 10 mg/dia", "Alternativa à risperidona para irritabilidade."],
      ["Valproato", "10-15 mg/kg/dia → até 30-60 mg/kg/dia", "Instabilidade de humor e agressividade impulsiva."],
    ]},
    { name: "Deficiência Intelectual", drugs: [
      ["Risperidona", "0,25 mg/dia → titulação lenta", "Agressividade e autoagressão. Doses menores."],
      ["Melatonina", "1-3 mg/noite", "Distúrbios do sono associados."],
      ["Antiepilépticos", "Conforme tipo de crise", "30% dos pacientes com DI têm epilepsia."],
    ]},
    { name: "Ansiedade de Separação", drugs: [
      ["Fluoxetina", "5 mg/dia → até 20 mg/dia", "ISRS primeira linha. Aprovado ≥7a."],
      ["Sertralina", "12,5-25 mg/dia → até 200 mg/dia", "Alternativa à fluoxetina. Aprovado ≥6a."],
      ["Fluvoxamina", "25 mg/dia → até 200 mg/dia", "ISRS com boa evidência para ansiedade infantil."],
    ]},
    { name: "Ansiedade Social", drugs: [
      ["Sertralina", "25 mg/dia → até 200 mg/dia", "ISRS primeira linha para fobia social."],
      ["Fluoxetina", "5-10 mg/dia → até 40 mg/dia", "Alternativa. Meia-vida longa."],
      ["Venlafaxina XR", "37,5 mg/dia → até 225 mg/dia", "IRSN segunda linha. ≥12 anos."],
    ]},
    { name: "TAG (Transtorno de Ansiedade Generalizada)", drugs: [
      ["Sertralina", "25 mg/dia → até 200 mg/dia", "ISRS primeira linha."],
      ["Fluoxetina", "5-10 mg/dia → até 40 mg/dia", "ISRS alternativo. Boa evidência em crianças."],
      ["Duloxetina", "30 mg/dia → até 120 mg/dia", "IRSN aprovado para TAG ≥7a."],
      ["Buspirona", "5 mg 2x/dia → até 30 mg/dia", "Ansiolítico não benzodiazepínico."],
    ]},
    { name: "Tiques e Síndrome de Tourette", drugs: [
      ["Guanfacina XR", "1 mg/dia → até 4 mg/dia", "Primeira linha para tiques leves-moderados."],
      ["Clonidina", "0,05 mg/noite → até 0,3 mg/dia", "Alternativa à guanfacina. Mais sedação."],
      ["Aripiprazol", "2 mg/dia → até 20 mg/dia", "Tiques moderados-graves. Menos efeitos metabólicos."],
      ["Haloperidol", "0,25 mg/dia → até 3-5 mg/dia", "Eficaz mas mais efeitos extrapiramidais."],
      ["Topiramato", "25 mg/dia → até 200 mg/dia", "Adjuvante. Menos evidência."],
    ]},
    { name: "Depressão", drugs: [
      ["Fluoxetina", "10 mg/dia → até 40 mg/dia", "Único ISRS aprovado FDA para depressão ≥8a."],
      ["Escitalopram", "5 mg/dia → até 20 mg/dia", "Aprovado FDA para depressão ≥12a."],
      ["Sertralina", "25 mg/dia → até 200 mg/dia", "Alternativa. Boa tolerabilidade."],
      ["Desvenlafaxina", "25-50 mg/dia → até 100 mg/dia", "IRSN para adolescentes."],
    ]},
    { name: "Distúrbios do Sono", drugs: [
      ["Melatonina", "0,5-1 mg → até 10 mg/noite", "Primeira linha para insônia. 30-60 min antes."],
      ["Clonidina", "0,05-0,1 mg/noite", "Insônia refratária. Útil no TDAH."],
      ["Hidroxizina", "0,5-1 mg/kg/dose", "Anti-histamínico. Curto prazo."],
      ["Trazodona", "25-50 mg/noite → até 100 mg", "Antidepressivo sedativo. Off-label."],
    ]},
    { name: "Epilepsia", drugs: [
      ["Valproato", "10-15 mg/kg/dia → até 60 mg/kg/dia", "Amplo espectro. Crises generalizadas."],
      ["Levetiracetam", "10-20 mg/kg/dia → até 60 mg/kg/dia", "Amplo espectro. Boa tolerabilidade."],
      ["Carbamazepina", "5-10 mg/kg/dia → até 20-35 mg/kg/dia", "Crises focais. Contraindicado em ausências."],
      ["Oxcarbazepina", "8-10 mg/kg/dia → até 30-46 mg/kg/dia", "Similar à CBZ com menos interações."],
      ["Lamotrigina", "0,3-0,6 mg/kg/dia → até 5-15 mg/kg/dia", "Amplo espectro. Titulação lenta obrigatória."],
      ["Topiramato", "1-3 mg/kg/dia → até 5-9 mg/kg/dia", "Crises focais e generalizadas. Perda ponderal."],
      ["Clobazam", "0,25 mg/kg/dia → até 1 mg/kg/dia", "Adjuvante. Lennox-Gastaut. Dravet."],
      ["Vigabatrina", "50 mg/kg/dia → até 150 mg/kg/dia", "Espasmos infantis. Monitorar campo visual."],
      ["Fenitoína", "4-8 mg/kg/dia", "Status epilepticus. Monitorar níveis séricos."],
    ]},
    { name: "Crise Febril", drugs: [
      ["Diazepam retal", "0,5 mg/kg (máx 10 mg)", "Resgate domiciliar. Crise >5 min."],
      ["Midazolam bucal", "0,2-0,5 mg/kg (máx 10 mg)", "Alternativa ao diazepam retal."],
      ["Diazepam oral", "0,33 mg/kg 8/8h", "Profilaxia intermitente durante febre."],
    ]},
    { name: "Paralisia Cerebral", drugs: [
      ["Baclofeno oral", "5 mg 3x/dia → até 60-80 mg/dia", "Espasticidade. Titulação gradual."],
      ["Toxina botulínica A", "Conforme músculo-alvo", "Espasticidade focal. A cada 3-6 meses."],
      ["Diazepam", "0,12-0,8 mg/kg/dia", "Espasticidade generalizada. Sedação."],
      ["Tizanidina", "2 mg/noite → até 12-24 mg/dia", "Agonista alfa-2 para espasticidade."],
      ["Baclofeno intratecal", "Bomba de infusão", "Espasticidade grave refratária."],
    ]},
    { name: "Comportamento", drugs: [
      ["Risperidona", "0,25-0,5 mg/dia → até 3 mg/dia", "Agressividade refratária."],
      ["Aripiprazol", "2 mg/dia → até 15 mg/dia", "Alternativa com menos ganho de peso."],
      ["Valproato", "15-30 mg/kg/dia", "Instabilidade do humor e impulsividade."],
      ["Propranolol", "0,5-1 mg/kg/dia → até 4 mg/kg/dia", "Agressividade com componente autonômico."],
    ]},
    { name: "Psicofármacos Gerais", drugs: [
      ["Quetiapina", "25 mg/noite → até 400-600 mg/dia", "Antipsicótico atípico. Sedação."],
      ["Olanzapina", "2,5 mg/dia → até 20 mg/dia", "Eficaz mas alto risco metabólico."],
      ["Lítio", "300 mg 2-3x/dia → nível 0,6-1,2 mEq/L", "Estabilizador de humor. Monitorar litemia."],
    ]},
    { name: "Cefaleia", drugs: [
      ["Ibuprofeno", "10 mg/kg/dose (máx 400 mg)", "Tratamento agudo. Primeira linha."],
      ["Sumatriptano nasal", "5-20 mg", "Enxaqueca ≥12a. Máx 2 doses/24h."],
      ["Amitriptilina", "0,25-1 mg/kg/noite", "Profilaxia de enxaqueca. Primeira linha."],
      ["Propranolol", "0,5-1 mg/kg/dia → até 4 mg/kg/dia", "Profilaxia. Contraindicado na asma."],
      ["Topiramato", "15-25 mg/dia → até 2-3 mg/kg/dia", "Profilaxia. Aprovado ≥12a."],
      ["Flunarizina", "5 mg/noite", "Profilaxia. Primeira linha em crianças."],
    ]},
    { name: "Distúrbios do Movimento", drugs: [
      ["Levodopa/Carbidopa", "1 mg/kg/dia → titulação", "Distonia responsiva à dopa."],
      ["Triexifenidil", "1 mg/dia → até 6-15 mg/dia", "Distonia. Anticolinérgico."],
      ["Tetrabenazina", "12,5 mg/dia → até 75 mg/dia", "Coreia, discinesias. Depleta dopamina."],
      ["Toxina botulínica A", "Conforme músculo-alvo", "Distonia focal."],
      ["Baclofeno", "5 mg 3x/dia → titulação", "Distonia com espasticidade."],
    ]},
    { name: "Dor Neuropática", drugs: [
      ["Gabapentina", "5-10 mg/kg/dia → até 40-50 mg/kg/dia", "Primeira linha. Titulação gradual."],
      ["Pregabalina", "2-4 mg/kg/dia → até 10-14 mg/kg/dia", "Alternativa à gabapentina."],
      ["Amitriptilina", "0,1-0,5 mg/kg/noite → até 1 mg/kg/noite", "Antidepressivo tricíclico para dor."],
      ["Duloxetina", "30 mg/dia → até 60-120 mg/dia", "IRSN para dor neuropática ≥13a."],
    ]},
    { name: "Neuroimunologia", drugs: [
      ["Metilprednisolona IV", "20-30 mg/kg/dia por 3-5 dias", "Pulsoterapia. ADEM, encefalite, NMO."],
      ["Imunoglobulina IV", "2 g/kg total, em 2-5 dias", "Guillain-Barré, encefalite autoimune."],
      ["Plasmaférese", "5-7 sessões", "Encefalite refratária a IVIG."],
      ["Rituximabe", "375 mg/m² semanal x 4", "NMO, encefalite anti-NMDAR refratária."],
      ["Azatioprina", "2-3 mg/kg/dia", "Manutenção em NMO e doenças autoimunes do SNC."],
    ]},
    { name: "TOC (Transtorno Obsessivo-Compulsivo)", drugs: [
      ["Fluoxetina", "10 mg/dia → até 60-80 mg/dia", "ISRS primeira linha. Doses mais altas que depressão."],
      ["Sertralina", "25 mg/dia → até 200 mg/dia", "Alternativa. Aprovado ≥6a."],
      ["Fluvoxamina", "25 mg/dia → até 200-300 mg/dia", "ISRS com boa evidência para TOC infantil."],
      ["Clomipramina", "25 mg/dia → até 3 mg/kg/dia ou 200 mg/dia", "Segunda linha. ECG obrigatório."],
    ]},
    { name: "TEPT (Transtorno de Estresse Pós-Traumático)", drugs: [
      ["Sertralina", "25 mg/dia → até 200 mg/dia", "ISRS primeira linha."],
      ["Prazosina", "1 mg/noite → até 5-10 mg/noite", "Pesadelos traumáticos. Bloqueador alfa-1."],
      ["Clonidina", "0,05-0,1 mg/noite", "Hiperexcitação autonômica e insônia."],
      ["Propranolol", "0,5-1 mg/kg/dia", "Hiperativação autonômica."],
    ]},
    { name: "Enurese", drugs: [
      ["Desmopressina (DDAVP)", "0,2-0,4 mg/noite", "Primeira linha farmacológica. Via oral."],
      ["Imipramina", "25-50 mg/noite", "Segunda linha. Tricíclico. ECG prévio."],
      ["Oxibutinina", "5 mg 2x/dia", "Enurese com hiperatividade vesical."],
      ["Alarme noturno", "Dispositivo", "Primeira linha não farmacológica."],
    ]},
    { name: "Neonatal", drugs: [
      ["Fenobarbital", "20 mg/kg ataque → 3-5 mg/kg/dia", "Primeira linha para crises neonatais."],
      ["Levetiracetam", "20-40 mg/kg ataque → 40-60 mg/kg/dia", "Segunda linha. Boa tolerabilidade."],
      ["Midazolam", "0,05-0,15 mg/kg bolus → infusão", "Status neonatal refratário."],
      ["Cafeína citrato", "20 mg/kg ataque → 5-10 mg/kg/dia", "Apneia da prematuridade."],
      ["Piridoxina", "100 mg IV", "Teste terapêutico para crises piridoxina-dependentes."],
    ]},
    { name: "Doenças Metabólicas", drugs: [
      ["Biotina", "5-20 mg/dia", "Deficiência de biotinidase."],
      ["Ácido folínico", "0,5-1 mg/kg/dia", "Deficiência de folato cerebral."],
      ["L-Carnitina", "50-100 mg/kg/dia", "Defeitos de oxidação de ácidos graxos."],
      ["Dieta cetogênica", "Protocolo nutricional", "Epilepsia GLUT-1. Deficit PDH."],
      ["Miglustate", "100-200 mg 3x/dia", "Niemann-Pick tipo C."],
    ]},
    { name: "Transtorno Alimentar", drugs: [
      ["Fluoxetina", "10-20 mg/dia → até 60 mg/dia", "Bulimia. FDA aprovado ≥18a."],
      ["Olanzapina", "2,5 mg/dia → até 10 mg/dia", "Anorexia nervosa. Ganho ponderal."],
      ["Ciproheptadina", "2-4 mg 2-3x/dia", "Estimulante de apetite em crianças."],
      ["Suplementação nutricional", "Conforme déficits", "Realimentação supervisionada."],
    ]},
    { name: "Psicose", drugs: [
      ["Risperidona", "0,5 mg/dia → até 3-6 mg/dia", "Primeira linha em psicose infantil."],
      ["Aripiprazol", "2 mg/dia → até 30 mg/dia", "Aprovado ≥13a para esquizofrenia."],
      ["Quetiapina", "25 mg/dia → até 600 mg/dia", "Alternativa. Mais sedação."],
      ["Olanzapina", "2,5-5 mg/dia → até 20 mg/dia", "Eficaz mas alto risco metabólico."],
      ["Clozapina", "12,5 mg/dia → titulação", "Psicose refratária. Monitorar hemograma."],
    ]},
    { name: "Mutismo Seletivo", drugs: [
      ["Fluoxetina", "5 mg/dia → até 20-40 mg/dia", "ISRS primeira linha. Início baixo."],
      ["Sertralina", "12,5-25 mg/dia → até 200 mg/dia", "Alternativa à fluoxetina."],
      ["Fluvoxamina", "25 mg/dia → até 200 mg/dia", "Boa evidência para ansiedade infantil."],
    ]},
  ];

  const content = [
    heading1("8. Farmacologia Neuropediátrica"),
    para("O módulo de Farmacologia Neuropediátrica do NeuroPed reúne 142 medicações organizadas em 27 categorias terapêuticas, oferecendo ao profissional uma referência rápida e confiável para a prescrição em neuropediatria. Cada medicação é apresentada com dose inicial, dose de manutenção, indicações clínicas e observações relevantes. É fundamental ressaltar que as informações apresentadas são orientativas e que a prescrição deve ser sempre individualizada, considerando o quadro clínico do paciente, comorbidades, interações medicamentosas e monitoramento adequado."),
    para("A farmacoterapia em neuropediatria apresenta particularidades importantes: muitas medicações são utilizadas off-label (fora das indicações aprovadas em bula), as doses são frequentemente baseadas no peso corporal, a titulação deve ser gradual e o monitoramento de efeitos adversos é essencial. A decisão de iniciar tratamento farmacológico deve considerar a relação risco-benefício individual, a evidência disponível e, quando possível, ser precedida ou acompanhada de intervenções não farmacológicas."),
    emptyLine(),
  ];

  categories.forEach((cat, idx) => {
    content.push(heading2(`8.${idx + 1} ${cat.name}`));

    const colWidths = [2200, 3800, 3360];
    const tableRows = [
      new TableRow({
        children: [
          tableHeaderCell("Medicação", colWidths[0]),
          tableHeaderCell("Dose", colWidths[1]),
          tableHeaderCell("Indicação / Notas", colWidths[2]),
        ],
      }),
    ];

    cat.drugs.forEach((d, i) => {
      const shade = i % 2 === 0 ? WHITE : PURPLE_LIGHT;
      tableRows.push(
        new TableRow({
          children: [
            tableCell(d[0], colWidths[0], { bold: true, shading: shade }),
            tableCell(d[1], colWidths[1], { shading: shade }),
            tableCell(d[2], colWidths[2], { shading: shade }),
          ],
        })
      );
    });

    content.push(
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: colWidths,
        rows: tableRows,
      })
    );
    content.push(emptyLine());
  });

  content.push(new Paragraph({ children: [new PageBreak()] }));
  return content;
}

// ── Section 9: Filtro Inteligente ──
function secFiltro() {
  return [
    heading1("9. Filtro Inteligente"),
    para("O Filtro Inteligente é um dos recursos mais inovadores e diferenciadores do NeuroPed, permitindo ao profissional realizar buscas avançadas e cruzadas em todo o acervo de escalas e medicações do aplicativo. O sistema foi projetado para simular o raciocínio clínico do neuropediatra, conectando queixas clínicas a instrumentos de avaliação e opções terapêuticas de forma simultânea e integrada."),
    
    heading2("9.1 Categorias de Queixa"),
    para("O sistema organiza as queixas clínicas em 13 categorias principais que cobrem todo o espectro de demandas neuropediátricas: Neurodesenvolvimento, Comportamento, Aprendizagem, Linguagem/Comunicação, Motor, Epilepsia/Crises, Cefaleia, Sono, Saúde Mental, Sensorial, Alimentação, Social e Outros. Cada categoria possui subcategorias específicas, totalizando mais de 70 tags de queixa que podem ser selecionadas individualmente ou combinadas."),
    para("Por exemplo, ao selecionar a categoria 'Neurodesenvolvimento' e a tag 'Atraso de fala', o filtro retorna automaticamente todas as escalas relevantes (Denver II, ASQ-3, EMDI, Vineland-3) e todas as medicações potencialmente indicadas, organizadas por relevância clínica. O profissional pode refinar a busca adicionando filtros de faixa etária, obtendo resultados ainda mais específicos."),
    
    heading2("9.2 Filtro por Faixa Etária"),
    para("O sistema permite filtrar escalas e medicações por faixa etária específica do paciente, garantindo que apenas instrumentos e opções terapêuticas adequados à idade sejam exibidos. As faixas etárias são organizadas em: neonatal (0-28 dias), lactente (1-24 meses), pré-escolar (2-5 anos), escolar (6-11 anos) e adolescente (12-18 anos). Essa funcionalidade evita a apresentação de instrumentos inadequados à idade e agiliza a seleção clínica."),
    
    heading2("9.3 Busca por Texto Livre e CID"),
    para("O Filtro Inteligente suporta busca por texto livre com tecnologia fuzzy matching, que reconhece variações ortográficas, abreviações e termos aproximados. Além disso, permite busca direta por códigos CID-10 e CID-11, retornando automaticamente escalas e medicações associadas ao diagnóstico correspondente. O sistema também incorpora um dicionário de sinônimos médicos, reconhecendo que termos como 'TDAH', 'DDA', 'hiperatividade', 'déficit de atenção' e 'attention deficit' se referem à mesma condição."),
    
    heading2("9.4 Busca Cruzada"),
    para("A funcionalidade de busca cruzada é o que torna o Filtro verdadeiramente inteligente: ao realizar uma pesquisa, o sistema simultaneamente busca em todas as bases de dados do aplicativo — escalas de avaliação, medicações, categorias diagnósticas e protocolos — retornando resultados integrados que apresentam tanto as opções de avaliação quanto as opções terapêuticas relevantes. Essa integração reflete a abordagem clínica real, em que avaliação e tratamento são considerados conjuntamente."),
    para("O Filtro Inteligente representa uma evolução significativa em relação à busca manual em livros-texto ou aplicativos convencionais, que geralmente separam informações sobre avaliação e tratamento. No NeuroPed, o profissional encontra em uma única busca todas as informações necessárias para o manejo clínico do paciente, desde a seleção dos instrumentos de avaliação até as opções farmacológicas disponíveis."),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

// ── Section 10: Diários Clínicos ──
function secDiarios() {
  return [
    heading1("10. Diários Clínicos"),
    para("Os diários clínicos são ferramentas essenciais para o acompanhamento longitudinal de condições neurológicas crônicas. O NeuroPed oferece dois diários estruturados que permitem ao paciente e seus cuidadores registrar sistematicamente informações clínicas relevantes entre as consultas, fornecendo dados objetivos que auxiliam na tomada de decisão terapêutica."),
    emptyLine(),

    heading2("10.1 Diário de Crises Epilépticas"),
    para("O Diário de Crises Epilépticas do NeuroPed é uma ferramenta estruturada para registro detalhado de crises epilépticas, projetada para ser utilizada por pais, cuidadores e pelo próprio paciente (quando adolescente). O diário permite o registro de data e hora da crise, duração, tipo de crise (conforme classificação ILAE), nível de consciência, manifestações motoras, sintomas autonômicos, fatores desencadeantes e uso de medicação de resgate."),
    para("Além do registro individual de cada crise, o diário permite a visualização de padrões ao longo do tempo: frequência mensal de crises, distribuição por período do dia (matutina, vespertina, noturna, ao despertar), relação com ciclo menstrual, associação com fatores como privação de sono, febre, estresse ou má aderência medicamentosa. Esses padrões são fundamentais para o ajuste terapêutico e para a classificação da resposta ao tratamento."),
    para("O diário também inclui campos para registro de medicações em uso, alterações de dose, efeitos colaterais percebidos e intercorrências clínicas. Essas informações permitem ao neuropediatra ter uma visão completa e objetiva da evolução do quadro epiléptico entre as consultas, facilitando a tomada de decisões sobre manutenção, ajuste ou troca de antiepilépticos."),
    emptyLine(),

    heading2("10.2 Calendário de Cefaleia"),
    para("O Calendário de Cefaleia do NeuroPed é uma ferramenta para registro sistemático de episódios de cefaleia em crianças e adolescentes. O instrumento permite documentar a frequência, intensidade, duração, localização, características (pulsátil, em pressão, em pontada), sintomas associados (náusea, vômito, fotofobia, fonofobia, aura visual) e fatores desencadeantes de cada episódio."),
    para("O calendário inclui campos para registro de medicações utilizadas para tratamento agudo (analgésicos, anti-inflamatórios, triptanos) e sua eficácia, permitindo a identificação de cefaleia por uso excessivo de analgésicos — uma causa frequente de cefaleia crônica diária em adolescentes. Registra também a presença e o tipo de aura, informação relevante para a classificação e o manejo terapêutico da enxaqueca."),
    para("A utilização do calendário por pelo menos 30-60 dias antes da consulta permite ao neuropediatra caracterizar adequadamente o padrão de cefaleia, definir o diagnóstico (enxaqueca episódica, enxaqueca crônica, cefaleia tensional, cefaleia por uso excessivo de analgésicos) e avaliar a necessidade e a eficácia do tratamento profilático. É uma ferramenta indispensável para o manejo baseado em evidências da cefaleia pediátrica."),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

// ── Section 11: Guia de Psiquiatria Infantil ──
function secPsiquiatria() {
  return [
    heading1("11. Guia de Psiquiatria Infantil"),
    para("O NeuroPed inclui um guia abrangente de Psiquiatria Infantil que cobre mais de 30 condições psiquiátricas da infância e adolescência. O guia foi elaborado com base nos critérios do DSM-5-TR e na CID-11, oferecendo ao profissional uma referência rápida e atualizada sobre os principais transtornos psiquiátricos que afetam a faixa etária pediátrica."),
    para("Para cada condição, o guia apresenta: definição e epidemiologia, critérios diagnósticos resumidos, diagnóstico diferencial, comorbidades frequentes, abordagem terapêutica (farmacológica e não farmacológica) e prognóstico. As condições são organizadas por categorias diagnósticas: transtornos do neurodesenvolvimento (TEA, TDAH, deficiência intelectual, transtornos de aprendizagem, transtornos da comunicação, transtornos motores), transtornos de ansiedade, transtornos do humor, transtornos de comportamento disruptivo, transtornos alimentares, transtornos do sono, transtornos relacionados a trauma e estresse, transtornos obsessivo-compulsivos e relacionados, transtornos de tiques e transtornos psicóticos."),
    para("O guia enfatiza as particularidades da apresentação clínica dos transtornos psiquiátricos na infância, que frequentemente difere da apresentação em adultos. Depressão em crianças, por exemplo, manifesta-se mais frequentemente com irritabilidade do que com humor deprimido; ansiedade de separação é normal em lactentes mas patológica quando persiste além da faixa etária esperada; e o TDAH requer avaliação multi-informante que considere os diferentes contextos de vida da criança."),
    para("O guia aborda também temas transversais essenciais: avaliação de risco suicida em crianças e adolescentes, manejo de emergências psiquiátricas, psicofarmacologia pediátrica (princípios gerais, particularidades farmacocinéticas, monitoramento laboratorial), abordagem de famílias e questões éticas e legais específicas da psiquiatria da infância e adolescência. Essas informações complementam o módulo de farmacologia e as escalas de saúde mental do NeuroPed, criando um sistema integrado de consulta."),
    para("O Guia de Psiquiatria Infantil do NeuroPed é projetado para ser uma ferramenta de consulta rápida no dia a dia clínico, e não um substituto para formação especializada em psiquiatria infantil. Sua principal utilidade é auxiliar neuropediatras, pediatras e outros profissionais de saúde na identificação, avaliação inicial e manejo de condições psiquiátricas comuns, além de orientar o encaminhamento adequado quando necessário."),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

// ── Section 12: Sobre o Autor ──
function secAutor() {
  return [
    heading1("12. Sobre o Autor"),
    emptyLine(),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [new TextRun({ text: "Dr. Jadson Fraga Araújo Júnior", font: "Arial", size: 32, bold: true, color: PURPLE })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({ text: '"O SuperNeuroPed"', font: "Arial", size: 24, italics: true, color: GRAY_TEXT })],
    }),
    para("O Dr. Jadson Fraga Araújo Júnior é neuropediatra com atuação nas cidades de Petrolina/PE e Juazeiro/BA, sendo referência no atendimento de crianças e adolescentes com condições neurológicas e do neurodesenvolvimento na região do Vale do São Francisco. Com dupla inscrição nos Conselhos Regionais de Medicina de Pernambuco (CRM-PE 25227) e da Bahia (CRM-BA 23384), possui três Registros de Qualificação de Especialista (RQE 17756, 14499 e 13119), refletindo sua formação sólida e reconhecida."),
    para("Conhecido como 'O SuperNeuroPed', o Dr. Jadson Fraga destaca-se pela dedicação à educação médica continuada e pela criação de ferramentas inovadoras para a prática neuropediátrica. O NeuroPed, sua principal criação, é o resultado de anos de experiência clínica e de uma visão de que a tecnologia pode transformar a qualidade do atendimento neuropediátrico, tornando ferramentas de avaliação e informações farmacológicas acessíveis de forma rápida e organizada no ponto de cuidado."),
    para("Além de sua prática clínica, o Dr. Jadson é autor de uma bateria autoral de instrumentos de avaliação (Bateria Dr. Jadson 2026) e de sete escalas de regulação emocional (série J26), contribuindo de forma original para o arsenal de ferramentas disponíveis ao neuropediatra brasileiro. Sua abordagem clínica integra avaliação padronizada, farmacologia baseada em evidências e visão centrada no paciente e na família."),
    emptyLine(),

    heading2("Contato e Localização"),
    emptyLine(),

    heading3("Clínica Jadson Fraga — Petrolina/PE"),
    para("Av. Cardoso de Sá, 1000 — Novo Centro — Petrolina/PE"),
    emptyLine(),

    heading3("Clínica Jadson Fraga — Juazeiro/BA"),
    para("Rua do Paraíso, 409 — Juazeiro/BA"),
    emptyLine(),

    heading3("Telefone e WhatsApp"),
    bulletItem("Telefone: (87) 3201-3648"),
    bulletItem("WhatsApp: (87) 9 9105-5790"),
    bulletItem("WhatsApp: (87) 9 9109-7371"),
    emptyLine(),

    heading3("Presença Digital"),
    multiRunPara([
      { text: "Site: " },
      { text: "drjadsonfraga.com", bold: true, color: PURPLE },
    ]),
    multiRunPara([
      { text: "Instagram: " },
      { text: "@drjadsonfraganeuroped", bold: true, color: PURPLE },
    ]),
    emptyLine(), emptyLine(),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [new TextRun({ text: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", font: "Arial", size: 20, color: PURPLE })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [new TextRun({ text: "NeuroPed — Escalas de Neuropediatria", font: "Arial", size: 22, bold: true, color: PURPLE })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [new TextRun({ text: "Guia Completo · Março 2026", font: "Arial", size: 20, color: GRAY_TEXT })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [new TextRun({ text: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", font: "Arial", size: 20, color: PURPLE })],
    }),
  ];
}

// ── ASSEMBLE DOCUMENT ──
async function main() {
  const children = [
    ...coverPage(),
    ...tocPage(),
    ...secApresentacao(),
    ...secNeurodesenvolvimento(),
    ...secComportamento(),
    ...secSaudeMental(),
    ...secSonoQV(),
    ...secBateriaAutoral(),
    ...secRegulacaoEmocional(),
    ...secFarmacologia(),
    ...secFiltro(),
    ...secDiarios(),
    ...secPsiquiatria(),
    ...secAutor(),
  ];

  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: "Arial", size: 22, color: GRAY_TEXT } },
      },
      paragraphStyles: [
        {
          id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 36, bold: true, font: "Arial", color: PURPLE },
          paragraph: { spacing: { before: 400, after: 200 }, outlineLevel: 0 },
        },
        {
          id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 28, bold: true, font: "Arial", color: PURPLE },
          paragraph: { spacing: { before: 300, after: 150 }, outlineLevel: 1 },
        },
        {
          id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 24, bold: true, font: "Arial", color: BLACK },
          paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 2 },
        },
      ],
    },
    numbering: {
      config: [
        {
          reference: "bullets",
          levels: [{
            level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          }],
        },
      ],
    },
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({ text: "NeuroPed — Escalas de Neuropediatria", italics: true, color: PURPLE, size: 16, font: "Arial" }),
              ],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: "Dr. Jadson Fraga Araújo Júnior · CRM-PE 25227 · Página ", size: 16, color: GRAY_TEXT, font: "Arial" }),
                new TextRun({ children: [PageNumber.CURRENT], size: 16, color: GRAY_TEXT, font: "Arial" }),
                new TextRun({ text: " de ", size: 16, color: GRAY_TEXT, font: "Arial" }),
                new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: GRAY_TEXT, font: "Arial" }),
              ],
            }),
          ],
        }),
      },
      children,
    }],
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync("/home/user/workspace/neuropediatria/relatorio-neuroped.docx", buffer);
  console.log("Document generated successfully!");
}

main().catch(e => { console.error(e); process.exit(1); });
