// Sistema de Recomendações Refinadas - Conecta Sinais → Escalas Ouro/Prata/Bronze → Testes Diretos
// Cada recomendação é específica para um cluster de sintomas, faixa etária e tipo de respondente

export interface RefinedRecommendation {
  signalClusterId: string; // ID do cluster de sintomas
  signalClusterLabel: string;
  ageRange: string;
  ageMin: number;
  ageMax: number;

  // Escalas recomendadas por seal
  ouro: {
    scaleId: string;
    scaleName: string;
    fullName: string;
    respondente: "pais" | "clinico" | "crianca" | "autoaplicavel";
    tempo: string;
    mainQuestion: string; // Pergunta clínica
    parentExample: string; // O que os pais vão responder
    whyUseful: string;
    appRoute?: string;
    cutoff?: string;
  };

  prata: {
    scaleId: string;
    scaleName: string;
    fullName: string;
    respondente: "pais" | "clinico" | "crianca" | "autoaplicavel";
    tempo: string;
    mainQuestion: string;
    parentExample: string;
    whyUseful: string;
    appRoute?: string;
  };

  bronze: {
    scaleId: string;
    scaleName: string;
    fullName: string;
    respondente: "pais" | "clinico" | "crianca" | "autoaplicavel";
    tempo: string;
    mainQuestion: string;
    parentExample: string;
    whyUseful: string;
    appRoute?: string;
  };

  // Teste direto complementar (aplicação em consulta)
  directTest?: {
    testId: string;
    testName: string;
    instructions: string;
    time: string;
    what: string; // O que observar
    howChildResponds: string; // Como a criança será avaliada
    whyHere: string; // Por que este teste com estes sintomas
  };

  // Contexto clínico
  clinicalContext: string; // Quando suspeitar e usar esta rota
  nextSteps: string; // O que fazer depois dos resultados
}

export const refinedRecommendations: RefinedRecommendation[] = [
  // TDAH - Desatenção Precoce (4-6 anos)
  {
    signalClusterId: "tdah-atencao-precoce",
    signalClusterLabel: "Desatenção Precoce (4-6 anos)",
    ageRange: "4-6a",
    ageMin: 48,
    ageMax: 71,
    ouro: {
      scaleId: "cpt3",
      scaleName: "CPT-3",
      fullName: "Continuous Performance Test 3",
      respondente: "crianca",
      tempo: "14-18 min",
      mainQuestion: "Qual é o nível de desatenção e impulsividade em tarefa de atenção sustentada?",
      parentExample: "A criança verá uma tela com letras aparecendo. Quando vê a letra alvo, pressiona botão. Mede: quantas deixou passar (desatenção) e quantas pressionou errado (impulsividade).",
      whyUseful: "Mede atenção sustentada objetivamente; detecta desatenção mesmo em criança que consegue focar brevemente",
      appRoute: "/cpt3"
    },
    prata: {
      scaleId: "brief2",
      scaleName: "BRIEF-2",
      fullName: "Behavior Rating Inventory of Executive Function 2",
      respondente: "pais",
      tempo: "10-15 min",
      mainQuestion: "Quais funções executivas estão afetadas (memória trabalho, planejamento, flexibilidade)?",
      parentExample: "Você responde perguntas como: 'Seu filho consegue lembrar instruções de 3 passos?' 'Consegue fazer planos simples?' 'É flexível quando planos mudam?' Pais comparam com crianças da mesma idade.",
      whyUseful: "Diferencia desatenção pura (TDAH) de dificuldade executiva; essencial para intervenção específica"
    },
    bronze: {
      scaleId: "cshq",
      scaleName: "CSHQ",
      fullName: "Children's Sleep Habits Questionnaire",
      respondente: "pais",
      tempo: "10-15 min",
      mainQuestion: "Hay problemas de sono que podem agravar desatenção?",
      parentExample: "Perguntas como: 'Seu filho demora quanto tempo para dormir?' 'Acorda durante a noite?' 'Ronca?' Sono ruim piora atenção dramatically.",
      whyUseful: "Sono insuficiente simula TDAH; descartar antes de diagnóstico; tratar sono pode resolver queixa"
    },
    directTest: {
      testId: "attention-tower-test",
      testName: "Tower Test (Teste da Torre)",
      instructions: "Clinician mostra torre de blocos e pede para criança copiar com tempo limite. Mede: planejamento, atenção, impulsividade.",
      time: "5-7 min",
      what: "Quantos blocos conseguiu copiar; se foi impulsiva (começou antes de entender); quantas vezes refez",
      howChildResponds: "Algumas crianças planejam bem (boa atenção), outras começam sem pensar (impulsividade)",
      whyHere: "Complementa questionário com observação direta; vê comportamento em tempo real"
    },
    clinicalContext: "Criança de 4-6 anos cujos pais relatam: dificuldade de focar em brincadeiras curtas, não segue instruções, muito distraída. Professora pode não relatar ainda (aula estruturada pode compensar).",
    nextSteps: "Se TDAH confirmado: considerar intervenção comportamental (pais + escola) primeiro. Medicação pré-escolar raro mas considere se grave. Reavaliar aos 6 anos quando exigências aumentam."
  },

  // TDAH - Hiperatividade Precoce (4-6 anos)
  {
    signalClusterId: "tdah-hiperatividade-precoce",
    signalClusterLabel: "Hiperatividade Precoce (4-6 anos)",
    ageRange: "4-6a",
    ageMin: 48,
    ageMax: 71,
    ouro: {
      scaleId: "ecbi",
      scaleName: "ECBI",
      fullName: "Eyberg Child Behavior Inventory",
      respondente: "pais",
      tempo: "10 min",
      mainQuestion: "Quão frequentes e problemáticos são os comportamentos de desobediência e hiperatividade em casa?",
      parentExample: "Você marca 36 itens tipo: 'Meu filho é desafiador/brigão' (frequência 1-7) e se é 'problema' sim/não. Exemplos: 'não fica sentado', 'não obedece', 'brinca violentamente'.",
      whyUseful: "Diferencia desobediência opositiva de hiperatividade genuína; mede intensidade E impacto na família",
      appRoute: "/ecbi"
    },
    prata: {
      scaleId: "cbcl",
      scaleName: "CBCL",
      fullName: "Child Behavior Checklist 1.5-5",
      respondente: "pais",
      tempo: "15-20 min",
      mainQuestion: "Que problemas comportamentais mais preocupam? Hiperatividade, agressão, desobediência?",
      parentExample: "100 itens cobrindo todos problemas comportamentais. Ex: 'Não consegue ficar sentado', 'Agressivo', 'Grita muito', 'Teimoso'. Agrupa em internalizante/externalizante.",
      whyUseful: "Visão ampla de comportamento; não apenas TDAH mas também ansiedade/depressão coexistentes"
    },
    bronze: {
      scaleId: "psq-sono",
      scaleName: "PSQ",
      fullName: "Pediatric Sleep Questionnaire",
      respondente: "pais",
      tempo: "10 min",
      mainQuestion: "O sono está ruim? Falta de sono causa/piora hiperatividade.",
      parentExample: "Perguntas sobre ronco, apneia, sonolência diurna. Hiperatividade em pré-escolar frequentemente é sono ruim, não TDAH.",
      whyUseful: "Regra de ouro: sempre descartar sono antes de TDAH pré-escolar"
    },
    directTest: {
      testId: "walk-line-test",
      testName: "Walk-a-Line Test",
      instructions: "Clinician pede para criança caminhar em linha reta (pode desenhar no chão com giz). Mede: controle motor, impulso de sair da linha, desempenho com instruções.",
      time: "2-3 min",
      what: "Consegue manter linha; quantas vezes saiu; se esperou instrução ou começou impulsivamente",
      howChildResponds: "Criança TDAH: muito dificuldade em manter controle; frequentemente sai da linha; impulsiva ao começar",
      whyHere: "Observação direta de impulsividade e controle motor; complementa questionário"
    },
    clinicalContext: "Pré-escolar muito inquieto, não para na cadeira, brinca agressivamente, pais dizem 'parece motor sempre ligado'. Precisa diferenças: TDAH genuin vs consequência sono ruim vs desobediência por outra razão.",
    nextSteps: "Primeiro: tratar sono. Se persiste: intervenção comportamental estruturada. Reavaliação aos 6-7 anos quando critério TDAH mais claro. Medicação pré-escolar tem risco mas útil em casos graves."
  },

  // TEA - Sinais Sociais em Toddlers (1-2 anos)
  {
    signalClusterId: "tea-social-comunicacao-6m",
    signalClusterLabel: "Déficit Social e Comunicativo (6-12 meses)",
    ageRange: "6-12m",
    ageMin: 6,
    ageMax: 11,
    ouro: {
      scaleId: "mchat",
      scaleName: "M-CHAT-R/F",
      fullName: "Modified Checklist for Autism in Toddlers - Revised with Follow-Up",
      respondente: "pais",
      tempo: "5-10 min",
      mainQuestion: "Há sinais de risco para TEA entre 16-30 meses? Déficit social, comunicação, comportamento.",
      parentExample: "23 itens sim/não: 'Seu filho olha nos olhos quando você fala?' 'Aponta para coisas interessantes?' 'Brinca de forma criativa com brinquedos?' Se ≥3 sim = follow-up necessário.",
      whyUseful: "Gold standard de triagem para TEA nesta idade; sensibilidade 95%; detecta casos precoce",
      appRoute: "/mchat",
      cutoff: "≥3 itens: risco inicial; ≥8: alto risco; follow-up reduz falso positivo"
    },
    prata: {
      scaleId: "asq3",
      scaleName: "ASQ-3",
      fullName: "Ages & Stages Questionnaire 3",
      respondente: "pais",
      tempo: "10-15 min",
      mainQuestion: "Como está o desenvolvimento global (comunicação, motor, pessoal-social, cognitivo)?",
      parentExample: "30 perguntas sobre marcos: 'Seu filho diz 2-3 palavras?' 'Senta sem apoio?' 'Entende instruções simples?' Cada domínio avaliado.",
      whyUseful: "Diferencia atraso global de TEA puro; se desenvolvimento geral atrasado, sugere outra causa"
    },
    bronze: {
      scaleId: "bayley",
      scaleName: "Bayley-III",
      fullName: "Bayley Scales of Infant Development III",
      respondente: "clinico",
      tempo: "30-90 min",
      mainQuestion: "Qual nível preciso de desenvolvimento cognitivo, motor e de linguagem?",
      parentExample: "Clinician observa criança brincando, fazendo tarefas. Oferece brinquedos, mede resposta. Não é questionário, é observação direta.",
      whyUseful: "Padrão-ouro para avaliação desenvolvimento 1-42m; só deve fazer se M-CHAT positivo"
    },
    directTest: {
      testId: "ados-module-toddler",
      testName: "ADOS-2 Módulo T (Toddler)",
      instructions: "Clinician joga com criança, oferece brinquedos, observa interação social/comunicação. Toma ~40 min.",
      time: "40-45 min",
      what: "Nível de atenção conjunta, imitação, resposta a nome, qualidade de brincadeira",
      howChildResponds: "Criança com TEA: brinca sozinha, ignora clinician, não compartilha interesse, movimento repetitivo",
      whyHere: "ADOS é gold standard diagnóstico TEA; só aplicar se M-CHAT positivo (confirmação é necessário)"
    },
    clinicalContext: "Bebê de 6-12m com pais preocupados: 'não olha, não aponta, muita fixação em objetos'. M-CHAT é triagem inicial; se positivo, referir para avaliação completa com ADOS.",
    nextSteps: "Se M-CHAT positivo: encaminhar para avaliação especializada (psicologo + fono). Não fazer diagnóstico em pré-triagem. Se confirmado TEA: iniciar terapia precoce (ABA, fono, TO) ASAP."
  },

  // COMPORTAMENTO OPOSITIVO (2-4 anos)
  {
    signalClusterId: "comportamento-oposicao",
    signalClusterLabel: "Comportamento Opositivo (2-4 anos)",
    ageRange: "2-4a",
    ageMin: 24,
    ageMax: 47,
    ouro: {
      scaleId: "ecbi",
      scaleName: "ECBI",
      fullName: "Eyberg Child Behavior Inventory",
      respondente: "pais",
      tempo: "10 min",
      mainQuestion: "Quanta frequência têm comportamentos de desobediência, agressão e desafio? Quanto afetam a família?",
      parentExample: "36 comportamentos listados: frequência (nunca a sempre) + se é problema. Ex: 'Se nega a fazer o que pede', 'Bate em adultos', 'Muito teimoso', 'Argumenta com tudo'.",
      whyUseful: "Diferencia TOD de defiantismo normal de 2-3 anos; mede impacto familiar (crucial para decisão terapêutica)",
      appRoute: "/ecbi"
    },
    prata: {
      scaleId: "cbcl",
      scaleName: "CBCL 1.5-5",
      fullName: "Child Behavior Checklist 1.5-5",
      respondente: "pais",
      tempo: "15-20 min",
      mainQuestion: "Quais são TODOS os comportamentos problemáticos (não apenas oposição)?",
      parentExample: "100 itens tipo: 'Bate em outras crianças', 'Muito agressivo', 'Grita muito', 'Temperamental', mas também 'Ansioso', 'Clingue', 'Inseguro'. Vê comorbidade.",
      whyUseful: "Detecta ansiedade/depressão comórbida que pode estar causando opositiidade (criança agressiva porque ansiosa)"
    },
    bronze: {
      scaleId: "psi",
      scaleName: "PSI (Parenting Stress Index)",
      fullName: "Parenting Stress Index",
      respondente: "pais",
      tempo: "12-15 min",
      mainQuestion: "Quanto estresse parental há? (Fundamental para intervenção eficaz)",
      parentExample: "Questões sobre: 'Motherhood é mais difícil do que esperava', 'Meu filho é muito exigente', 'Sinto-me preso'. Estresse parental CAUSA muito comportamento infantil.",
      whyUseful: "Parent stress é melhor preditor de sucesso terapêutico que comportamento infantil sozinho"
    },
    directTest: {
      testId: "parent-child-interaction",
      testName: "Observação de Interação Pai-Filho",
      instructions: "Clinician observa interação naturística: pede para pai brincar 10 min com filho SEM instruções. Depois, pede que pai diga para filho limpar brinquedos (teste de obediência).",
      time: "15-20 min",
      what: "Como pai interage (warmth, crítica); como filho responde (obediente, desafiador); dinâmica completa",
      howChildResponds: "Normal: criança participa, eventual recusa mas depois obedece. TOD: recusa aberta, padrão de desafio em tudo, pouco contato positivo",
      whyHere: "Vê padrão real pai-filho; não é apenas relato; muda tratamento se vê negligência parental, punição excessiva, etc"
    },
    clinicalContext: "Criança 2-4a muito opositiva, agressiva. Pais esgotados dizem 'não conseguimos fazer nada com ele'. Crucial determinar: TOD genuino vs resposta a ambiente caótico/abusivo vs TDAH com opositidade secundária.",
    nextSteps: "Se TOD: Parent-Child Interaction Therapy (PCIT) é gold standard 2-6 anos. Se ambiente adverso: envolver assistência social. Se TDAH subjacente: estimulantes podem paradoxalmente MELHORAR comportamento opositivo."
  },

  // ANSIEDADE DE SEPARAÇÃO (4-6 anos)
  {
    signalClusterId: "ansiedade-separacao",
    signalClusterLabel: "Ansiedade de Separação (4-6 anos)",
    ageRange: "4-6a",
    ageMin: 48,
    ageMax: 71,
    ouro: {
      scaleId: "scared",
      scaleName: "SCARED",
      fullName: "Screen for Child Anxiety Related Disorders",
      respondente: "pais",
      tempo: "10 min",
      mainQuestion: "Há evidência de transtorno de ansiedade? Que tipo? Separação vs social vs outra?",
      parentExample: "38 itens tipo: 'Seu filho fica preocupado quando separado de você?' 'Tem medo de ficar sozinho?' 'Pensa em coisas ruins?' Cada subescala (separação, social, pânico, etc) interpretada.",
      whyUseful: "Especifica TIPO de ansiedade; crucial porque tratamento difere (separação vs social vs pânico)",
      cutoff: "≥25: probable anxiety disorder; subescalas ≥5-6: concern naquele tipo"
    },
    prata: {
      scaleId: "rcads",
      scaleName: "RCADS",
      fullName: "Revised Children's Anxiety and Depression Scale",
      respondente: "pais",
      tempo: "10 min",
      mainQuestion: "Há ansiedade, depressão, ou ambas? Qual é a predominante?",
      parentExample: "47 itens baseados em DSM. Pais relatam: 'Seu filho se preocupa muito?', 'Tem medo de separar?', 'Sente-se triste?'. Subescalas para 6 transtornos.",
      whyUseful: "Incorpora depressão que pode ser comórbida; útil quando unclear se ansiedade pura vs depressão com ansiedade"
    },
    bronze: {
      scaleId: "scas",
      scaleName: "SCAS",
      fullName: "Spence Children's Anxiety Scale",
      respondente: "pais",
      tempo: "10 min",
      mainQuestion: "Panorama completo de todo ansiedade em 6 domínios?",
      parentExample: "45 itens cobrindo: separação, social, obsessões, pânico, generalizada, medo de lesão. Mais itens que SCARED, detalhe mais fino.",
      whyUseful: "Mais sensível para diferenciar subtipos; útil se SCARED deixou unclear"
    },
    directTest: {
      testId: "separation-challenge",
      testName: "Teste de Separação Estruturado",
      instructions: "Clinician pede para criança ficar 2-3 min na sala SEM pai/mãe. Observa reação: quanto fica tranquilo, quanto chora, se procura pai, tempo até acalmar.",
      time: "5 min",
      what: "Latência de distress, intensidade de choro/reclamação, capacidade de autossocar, reação ao retorno do pai",
      howChildResponds: "Normal (4-6a): algo de ansiedade mas consegue aguardar, acalma rapidinho. Ansiedade pura: chora muito, procura constantemente, demora muito acalmar.",
      whyHere: "Vê ansiedade em vivo; diferencia relatado de observado; alguns pais super-estimam, outros sub-estimam"
    },
    clinicalContext: "Criança 4-6a que literalmente NÃO consegue separar da mãe: chora na escola, tem comportamento de clingue extremo, pais cansados. Pais perguntam: 'É normal?' ou patológico?",
    nextSteps: "Normal para 2-3a, patológico se 4+a e afeta funcionamento. Terapia: exposição graduada (mãe sai 5 min, depois 10, etc) + coping skills (respiração, autoconversação). Medicação raramente primeira linha."
  },

  // ATRASO MOTOR (6-12 meses)
  {
    signalClusterId: "atraso-motor-6m",
    signalClusterLabel: "Atraso Motor (6-12 meses)",
    ageRange: "6-12m",
    ageMin: 6,
    ageMax: 11,
    ouro: {
      scaleId: "aims",
      scaleName: "AIMS",
      fullName: "Alberta Infant Motor Scale",
      respondente: "clinico",
      tempo: "20 min",
      mainQuestion: "Qual é o nível preciso de desenvolvimento motor grosso? Há atraso ou risco para PC?",
      parentExample: "Clinician observa criança em diferentes posições (barriga, costas, sentada, pé). Marca marcos alcançados. Converte para percentil por idade.",
      whyUseful: "Padrão-ouro para triagem motor 0-18m; detecta atraso e sinais de risco neurológico",
      appRoute: "/aims"
    },
    prata: {
      scaleId: "bayley",
      scaleName: "Bayley-III (Escala Motor)",
      fullName: "Bayley Scales of Infant Development III - Motor Subtests",
      respondente: "clinico",
      tempo: "30-40 min",
      mainQuestion: "Desenvolvimento motor é atraso isolado ou atraso global (cognitivo + motor)?",
      parentExample: "Clinician testa motor + cognitivo. Se apenas motor atrasado = diagnóstico diferente (PC) vs se global atrasado = atraso global.",
      whyUseful: "Diferencia atraso motor puro de atraso global (muda recomendação terapêutica)"
    },
    bronze: {
      scaleId: "asq3",
      scaleName: "ASQ-3",
      fullName: "Ages & Stages Questionnaire 3",
      respondente: "pais",
      tempo: "10-15 min",
      mainQuestion: "Confirmação parental de atraso motor; pais concordam que há déficit?",
      parentExample: "Pais respondem: 'Seu bebê engatinha?' 'Senta sem apoio?' 'Fica de pé com apoio?' Pais geralmente reconhecem atraso motor mas não cognitivo às vezes.",
      whyUseful: "Valida percepção parental; útil para engagement na terapia (pais precisam ser partner)"
    },
    directTest: {
      testId: "gma",
      testName: "General Movements Assessment (Prechtl)",
      instructions: "Se idade <3 meses OU sinais de risco: observe movimentos generalizados (idade 6-20 semanas). Nota qualidade: normal vs 'cramped-synchronized' vs 'poor repertoire' vs 'chaotic'.",
      time: "10 min",
      what: "Qualidade dos movimentos (natural vs mecânico); amplitude; variabilidade; presença de 'fidgety movements' (indicador positivo 8-20 semanas)",
      howChildResponds: "Normal: movimentos fluidos, variados, descoordenados mas natural. Anormal: movimentos muito rígidos, sincronizados, repetitivos (sugere lesão neurológica)",
      whyHere: "GMA é gold standard PRECOCE para detectar risco PC; mais sensível que marcos motores em <6m"
    },
    clinicalContext: "Bebê 6-12m que pais dizem 'não engatinha', 'não senta bem'. Clinician precisa determinar: atraso constitucional (seguirá padrão normal mas lentamente) vs atraso patológico (progressão anormal, sinais neurológicos).",
    nextSteps: "Se atraso confirmado: fisioterapia é gold standard. Tipo de fisio difere se motor puro vs PC vs atraso global. Monitoramento mensal até pega o atraso ou diagnostica condição subjacente."
  }
];

export function getRecommendationsForSignalCluster(clusterId: string, ageMonths: number): RefinedRecommendation | undefined {
  return refinedRecommendations.find(
    rec => rec.signalClusterId === clusterId &&
    ageMonths >= rec.ageMin &&
    ageMonths <= rec.ageMax
  );
}

export function getRecommendationsForQueixaAndAge(queixaId: string, ageMonths: number): RefinedRecommendation[] {
  const prefix = `${queixaId}-`; // Clusters começam com queixaId-*
  return refinedRecommendations.filter(
    rec => rec.signalClusterId.startsWith(prefix) &&
    ageMonths >= rec.ageMin &&
    ageMonths <= rec.ageMax
  );
}
