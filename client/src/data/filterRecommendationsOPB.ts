/**
 * RECOMENDAÇÕES ESTRUTURADAS: OURO / PRATA / BRONZE
 *
 * Para cada queixa clínica + faixa etária, exatamente 3 escalas:
 * - OURO: A mais importante e recomendada (vai responder a pergunta principal)
 * - PRATA: Complementa e detalha informações específicas
 * - BRONZE: Oferece perspectiva adicional quando ouro+prata não bastar
 *
 * Inclui exemplos para pais entenderem o que cada escala pergunta.
 */

export interface RecommendationOPB {
  seal: "ouro" | "prata" | "bronze";
  scaleId: string;
  scaleName: string;
  mainQuestion: string; // O que esta escala quer saber (pergunta principal)
  parentExample: string; // Exemplo do que os pais responderão
  whyUseful: string; // Por que ajuda neste caso
  time: string;
}

export interface QueixaAgeRecommendations {
  queixa: string;
  ageRange: string; // Ex: "2-4 anos", "6-12 anos"
  ageMin: number; // em meses
  ageMax: number; // em meses
  ouro: RecommendationOPB;
  prata: RecommendationOPB;
  bronze: RecommendationOPB;
}

/**
 * BASE DE RECOMENDAÇÕES POR QUEIXA E FAIXA ETÁRIA
 * Estruturada como: queixa_faixaEtaria
 */
export const recommendationsOPB: QueixaAgeRecommendations[] = [
  // ============= TDAH (Déficit de Atenção) =============
  {
    queixa: "tdah",
    ageRange: "3-4 anos",
    ageMin: 36,
    ageMax: 48,
    ouro: {
      seal: "ouro",
      scaleId: "snap",
      scaleName: "SNAP-IV",
      mainQuestion: "A criança mostra desatenção e hiperatividade típicas de TDAH?",
      parentExample: 'Você responderá perguntas como: "A criança tem dificuldade de manter atenção em atividades por tempo prolongado?" e "A criança não consegue esperar sua vez?"',
      whyUseful: "É a escala clássica que detecta sintomas específicos de TDAH (desatenção, hiperatividade, impulsividade). Essencial para confirmação parental.",
      time: "5–8 min",
    },
    prata: {
      seal: "prata",
      scaleId: "asq3",
      scaleName: "ASQ-3",
      mainQuestion: "Há atrasos no desenvolvimento que possam mascarar TDAH?",
      parentExample: 'Perguntas simples: "Sua criança consegue pular com os dois pés?" e "Faz frases com 4-5 palavras?"',
      whyUseful: "Diferencia se o que parece TDAH é na verdade atraso de desenvolvimento. Pais com suspeita de TDAH precisam descartar atraso global primeiro.",
      time: "10–15 min",
    },
    bronze: {
      seal: "bronze",
      scaleId: "sdq",
      scaleName: "SDQ (Questionário de Dificuldades e Capacidades)",
      mainQuestion: "Há problemas emocionais ou relacionais associados?",
      parentExample: 'Itens como: "Seu filho é facilmente distraído?" e "Com frequência, parece preocupado?"',
      whyUseful: "Fornece visão ampla de bem-estar emocional. TDAH frequentemente coexiste com ansiedade ou problemas emocionais.",
      time: "5–8 min",
    },
  },

  {
    queixa: "tdah",
    ageRange: "6-12 anos",
    ageMin: 72,
    ageMax: 144,
    ouro: {
      seal: "ouro",
      scaleId: "snap",
      scaleName: "SNAP-IV",
      mainQuestion: "Quais são os sintomas específicos de TDAH (desatenção vs. hiperatividade)?",
      parentExample: 'Exemplos: "Não presta atenção a detalhes", "Perde coisas necessárias", "Salta de uma atividade para outra"',
      whyUseful: "Avalia os 3 domínios de TDAH (desatenção, hiperatividade, impulsividade) com clareza. Diferencia perfis.",
      time: "5–8 min",
    },
    prata: {
      seal: "prata",
      scaleId: "brief2",
      scaleName: "BRIEF-2",
      mainQuestion: "Como as funções executivas (organização, planejamento) estão afetadas?",
      parentExample: 'Questões sobre: "Dificuldade para começar tarefas", "Esquece instruções", "Desorganizado"',
      whyUseful: "TDAH real afeta funções executivas (planejamento, memória de trabalho). BRIEF-2 diferencia TDAH de problemas comportamentais puros.",
      time: "10–15 min",
    },
    bronze: {
      seal: "bronze",
      scaleId: "conners",
      scaleName: "Conners 3",
      mainQuestion: "Como é o comportamento geral e há sinais de agressividade?",
      parentExample: 'Itens sobre: "Impulsivo", "Agressivo com outras crianças", "Desobediente"',
      whyUseful: "Visão complementar sobre padrões comportamentais gerais. Útil quando há suspeita de comorbidade com agressividade.",
      time: "10–15 min",
    },
  },

  // ============= AUTISMO / TEA =============
  {
    queixa: "tea",
    ageRange: "18 meses - 3 anos",
    ageMin: 18,
    ageMax: 36,
    ouro: {
      seal: "ouro",
      scaleId: "mchat",
      scaleName: "M-CHAT-R/F",
      mainQuestion: "Sinais de risco para autismo nesta idade crítica?",
      parentExample: 'Perguntas como: "Seu filho segue uma pessoa com o olhar quando ela aponta?", "Brinca de faz-de-conta?"',
      whyUseful: "Padrão-ouro de triagem para autismo em primeira infância. Detecta desvios precoces em comunicação e interação social.",
      time: "5–8 min",
    },
    prata: {
      seal: "prata",
      scaleId: "cars",
      scaleName: "CARS-2 (Parent Interview)",
      mainQuestion: "Como são as características autísticas em contexto de casa?",
      parentExample: 'Conversa estruturada sobre: "Como é a qualidade da interação com você?", "Tem padrões repetitivos?"',
      whyUseful: "Aprofunda comportamentos autísticos observados em casa. Diferencia autismo de atraso de linguagem simples.",
      time: "15–20 min",
    },
    bronze: {
      seal: "bronze",
      scaleId: "asq3",
      scaleName: "ASQ-3",
      mainQuestion: "Há desenvolvimento motor/cognitivo preservado apesar das dificuldades sociais?",
      parentExample: 'Marcos como: "Faz torres com blocos?", "Aponta objetos de interesse?"',
      whyUseful: "Vê se há atraso global ou se habilidades não-sociais estão preservadas (típico de autismo de alto funcionamento).",
      time: "10–15 min",
    },
  },

  {
    queixa: "tea",
    ageRange: "3-6 anos",
    ageMin: 36,
    ageMax: 72,
    ouro: {
      seal: "ouro",
      scaleId: "ados2",
      scaleName: "ADOS-2",
      mainQuestion: "Confirmação de diagnóstico de autismo via observação direta?",
      parentExample: "O clínico observará a criança brincando, respondendo a instruções e interagindo. Não é uma pergunta aos pais, mas observação estruturada.",
      whyUseful: "Padrão-ouro diagnóstico para TEA. Observação direta captura comportamentos que pais podem não perceber claramente.",
      time: "40–60 min",
    },
    prata: {
      seal: "prata",
      scaleId: "cars",
      scaleName: "CARS-2 (Entrevista)",
      mainQuestion: "Informações detalhadas sobre histórico de desenvolvimento e comportamentos autísticos?",
      parentExample: 'Perguntas sobre: "Quando você notou diferenças?", "Como ele brinca com outras crianças?", "Tem rotinas rígidas?"',
      whyUseful: "Complementa ADOS com história longitudinal. Pais frequentemente percebem padrões que clínico não vê em meia hora.",
      time: "15–20 min",
    },
    bronze: {
      seal: "bronze",
      scaleId: "vineland",
      scaleName: "Vineland-3",
      mainQuestion: "Qual o nível de funcionamento adaptativo apesar dos sintomas autísticos?",
      parentExample: 'Questões sobre autonomia: "Vai ao banheiro sozinho?", "Come com colher?", "Consegue se comunicar o que quer?"',
      whyUseful: "Importante para planejar intervenção. Autismo com funcionamento baixo vs. alto funcionamento precisa de abordagens muito diferentes.",
      time: "20–30 min",
    },
  },

  // ============= ATRASO DO DESENVOLVIMENTO =============
  {
    queixa: "atraso",
    ageRange: "0-6 meses",
    ageMin: 0,
    ageMax: 6,
    ouro: {
      seal: "ouro",
      scaleId: "bayley",
      scaleName: "Bayley-III",
      mainQuestion: "Qual o nível real de desenvolvimento cognitivo, motor e de linguagem?",
      parentExample: "Testes diretos: clínico observará se o bebê segue objetos com olhar, move-se no leito, responde a sons.",
      whyUseful: "Padrão-ouro para bebês. Detecta atrasos precoces em todos os domínios com precisão.",
      time: "30–90 min",
    },
    prata: {
      seal: "prata",
      scaleId: "gma",
      scaleName: "GMA (General Movements Assessment)",
      mainQuestion: "Há sinais precoces de paralisia cerebral nos movimentos generalizados?",
      parentExample: "Observação dos padrões de movimento natural do bebê. Movimentos fidgety (agitados) presentes = desenvolvimento normal.",
      whyUseful: "Detecta risco de PC muito precocemente (antes de 5 meses). Muda completamente o prognóstico se identificado cedo.",
      time: "5–10 min",
    },
    bronze: {
      seal: "bronze",
      scaleId: "timp",
      scaleName: "TIMP (Test of Infant Motor Performance)",
      mainQuestion: "Controle postural e motor estão apropriados para a idade?",
      parentExample: "Como o bebê mantém a cabeça, braços e pernas durante movimentos passivos (clínico suporta).",
      whyUseful: "Detalha performance motora. Útil se Bayley ou GMA apontam possível atraso motor.",
      time: "25–35 min",
    },
  },

  {
    queixa: "atraso",
    ageRange: "1-2 anos",
    ageMin: 12,
    ageMax: 24,
    ouro: {
      seal: "ouro",
      scaleId: "denver",
      scaleName: "Denver II",
      mainQuestion: "Em quais marcos esperados para idade a criança está atrasada?",
      parentExample: 'Exemplos: "Anda sozinho?", "Fala 10 palavras?", "Aponta objetos?", "Faz torre com blocos?"',
      whyUseful: "Rastreio rápido dos 4 domínios principais (motor grosso, motor fino, linguagem, pessoal-social). Mostra especificamente o que está atrasado.",
      time: "15–20 min",
    },
    prata: {
      seal: "prata",
      scaleId: "asq3",
      scaleName: "ASQ-3",
      mainQuestion: "Há atraso global vs. específico em uma área?",
      parentExample: 'Respostas dos pais sobre: "Sobe escadas com ajuda?", "Nomeie figuras em livros?", "Brinca com brinquedos?"',
      whyUseful: "Aprofunda avaliação parental. Se Denver mostra atraso, ASQ-3 ajuda saber se é global ou apenas linguagem/motor.",
      time: "10–15 min",
    },
    bronze: {
      seal: "bronze",
      scaleId: "catclams",
      scaleName: "CAT/CLAMS",
      mainQuestion: "Cognição e linguagem estão em sincronia?",
      parentExample: "Testes como: 'Busca objetos escondidos?', 'Compreende comandos simples?'",
      whyUseful: "Diferencia discrepâncias entre cognição e linguagem. Algumas crianças têm cognição boa mas linguagem muito atrasada.",
      time: "15–20 min",
    },
  },

  {
    queixa: "atraso",
    ageRange: "2-4 anos",
    ageMin: 24,
    ageMax: 48,
    ouro: {
      seal: "ouro",
      scaleId: "denver",
      scaleName: "Denver II",
      mainQuestion: "Quais marcos esperados estão atrasados nesta faixa etária crítica?",
      parentExample: 'Marcos como: "Chuta bola?", "Sobe 2-3 degraus?", "Faz frases com 2 palavras?", "Joga junto com crianças?"',
      whyUseful: "Identifica especificamente o que está atrasado. Crucial pois entre 2-4 anos há grande variabilidade e boa plasticidade para intervenção.",
      time: "15–20 min",
    },
    prata: {
      seal: "prata",
      scaleId: "asq3",
      scaleName: "ASQ-3",
      mainQuestion: "Visão parental detalhada de habilidades em contexto de casa?",
      parentExample: 'Itens como: "Corre bem?", "Copia rabiscos?", "Nomeia cores?", "Veste-se com ajuda?"',
      whyUseful: "ASQ-3 mostra o que pais observam diariamente. Clínico vê 30 min, pais veem 24h. Complementam-se.",
      time: "10–15 min",
    },
    bronze: {
      seal: "bronze",
      scaleId: "vineland",
      scaleName: "Vineland-3 (Versão pais)",
      mainQuestion: "Além do desenvolvimento, qual o nível de comportamento adaptativo/autonomia?",
      parentExample: 'Perguntas como: "Avisa quando precisa ir ao banheiro?", "Bebe em copo sozinho?", "Segue instruções com 2 passos?"',
      whyUseful: "Importante para planejar intervenção. Conhecer autonomia ajuda a definir prioridades terapêuticas.",
      time: "20–30 min",
    },
  },

  // ============= LINGUAGEM / COMUNICAÇÃO =============
  {
    queixa: "linguagem",
    ageRange: "1-2 anos",
    ageMin: 12,
    ageMax: 24,
    ouro: {
      seal: "ouro",
      scaleId: "asq3",
      scaleName: "ASQ-3",
      mainQuestion: "Há atraso específico de linguagem ou é mais global?",
      parentExample: 'Questões diretas: "Diz 10+ palavras diferentes?", "Aponta figuras em um livro?", "Compreende instruções simples?"',
      whyUseful: "Diferencia atraso de linguagem isolado (bom prognóstico) de atraso global (indica possível deficiência intelectual).",
      time: "10–15 min",
    },
    prata: {
      seal: "prata",
      scaleId: "catclams",
      scaleName: "CAT/CLAMS",
      mainQuestion: "Qual o nível de compreensão vs. expressão?",
      parentExample: 'Testes como: "Compreende 50+ palavras?", "Usa gestos para comunicar?", "Traz objetos pedidos?"',
      whyUseful: "IMPORTANTE: compreensão muito melhor que expressão é normal. Expressão pior = preocupação real.",
      time: "15–20 min",
    },
    bronze: {
      seal: "bronze",
      scaleId: "denver",
      scaleName: "Denver II",
      mainQuestion: "Como está o desenvolvimento geral além de linguagem?",
      parentExample: 'Marcos motores e sociais: "Anda bem?", "Brinca de faz-de-conta?", "Interage com outras crianças?"',
      whyUseful: "Se linguagem está muito atrás mas tudo mais está ok = provável atraso específico. Se tudo está atrás = global.",
      time: "15–20 min",
    },
  },

  {
    queixa: "linguagem",
    ageRange: "2-4 anos",
    ageMin: 24,
    ageMax: 48,
    ouro: {
      seal: "ouro",
      scaleId: "asq3",
      scaleName: "ASQ-3",
      mainQuestion: "Está atingindo marcos de linguagem esperados para 2-4 anos?",
      parentExample: 'Exemplos: "Fala 200+ palavras?", "Faz frases com 2 palavras?", "Segue instruções de 2 passos?"',
      whyUseful: "Triagem essencial. Se negativo = encaminhar para fonoaudiologia formal.",
      time: "10–15 min",
    },
    prata: {
      seal: "prata",
      scaleId: "mchat",
      scaleName: "M-CHAT-R/F ou CARS-2",
      mainQuestion: "Há sinais de autismo mascarando atraso de linguagem?",
      parentExample: 'Questões como: "Mantém contato visual?", "Responde ao nome?", "Brinca de forma típica?"',
      whyUseful: "Autismo + atraso de linguagem é comorbidade frequente. Importante identificar ambos.",
      time: "5–8 min (M-CHAT) ou 15–20 (CARS-2)",
    },
    bronze: {
      seal: "bronze",
      scaleId: "pedsql",
      scaleName: "PedsQL (Qualidade de Vida)",
      mainQuestion: "Como o atraso de linguagem está impactando bem-estar e participação social?",
      parentExample: 'Itens como: "A criança consegue brincar com outras crianças?", "Frequenta atividades escolares?"',
      whyUseful: "Mostra o impacto real na vida. Uma criança com atraso leve de linguagem mas com depressão/isolamento precisa de atenção diferente.",
      time: "10 min",
    },
  },

  // ============= ANSIEDADE =============
  {
    queixa: "ansiedade",
    ageRange: "4-6 anos",
    ageMin: 48,
    ageMax: 72,
    ouro: {
      seal: "ouro",
      scaleId: "scared",
      scaleName: "SCARED",
      mainQuestion: "Quais tipos de ansiedade estão presentes (pânico, TAG, separação, social, evitação escolar)?",
      parentExample: 'Exemplos: "Seu filho fica muito nervoso quando você sai?", "Tem medo de situações novas?", "Preocupa-se com coisas?"',
      whyUseful: "Identifica o TIPO de ansiedade. Diferentes tipos precisam de tratamentos diferentes.",
      time: "5–8 min",
    },
    prata: {
      seal: "prata",
      scaleId: "sdq",
      scaleName: "SDQ",
      mainQuestion: "Como a ansiedade está afetando comportamento geral e relações?",
      parentExample: 'Itens como: "Parece nervoso ou assustado?", "Tem problemas com outras crianças?", "É muito dependente?"',
      whyUseful: "Visão ampla de bem-estar. Ansiedade frequentemente vem com problemas emocionais e sociais.",
      time: "5–8 min",
    },
    bronze: {
      seal: "bronze",
      scaleId: "pedsql",
      scaleName: "PedsQL",
      mainQuestion: "Qual o impacto na qualidade de vida e atividades diárias?",
      parentExample: 'Questões como: "A criança consegue ir à escola sem medo?", "Dorme bem?", "Brinca normalmente?"',
      whyUseful: "Mostra a SEVERIDADE funcional. Ansiedade leve diferente de grave.",
      time: "10 min",
    },
  },

  {
    queixa: "ansiedade",
    ageRange: "6-12 anos",
    ageMin: 72,
    ageMax: 144,
    ouro: {
      seal: "ouro",
      scaleId: "scared",
      scaleName: "SCARED",
      mainQuestion: "Quais domínios de ansiedade? (pânico, TAG, separação, social, escolar)",
      parentExample: 'Perguntas: "Tem fobia escolar / medo de ir à aula?", "Tem ataques de pânico?", "Muito tímido socialmente?"',
      whyUseful: "Padrão-ouro de triagem de ansiedade. Altamente validado.",
      time: "5–8 min",
    },
    prata: {
      seal: "prata",
      scaleId: "sdq",
      scaleName: "SDQ",
      mainQuestion: "Há problemas emocionais ou comportamentais associados?",
      parentExample: 'Itens como: "Tem muitas preocupações?", "Frequentemente parece infeliz?", "Somatiza (dor de cabeça, barriga)?"',
      whyUseful: "Ansiedade em crianças frequentemente apresenta-se com somatização. SDQ ajuda a identificar isso.",
      time: "5–8 min",
    },
    bronze: {
      seal: "bronze",
      scaleId: "pedsql",
      scaleName: "PedsQL",
      mainQuestion: "Impacto em escola, sono, funcionamento social?",
      parentExample: 'Perguntas: "Dificuldade para participar em atividades normais?", "Dorme bem?", "Consegue estar entre outras crianças?"',
      whyUseful: "Identifica se ansiedade é leve/moderada/severa em termos de impacto de vida real.",
      time: "10 min",
    },
  },

  // ============= APRENDIZAGEM / DIFICULDADES ESCOLARES =============
  {
    queixa: "aprendizagem",
    ageRange: "4-6 anos",
    ageMin: 48,
    ageMax: 72,
    ouro: {
      seal: "ouro",
      scaleId: "tde2-adaptado",
      scaleName: "TDE-2 (Teste de Desempenho Escolar)",
      mainQuestion: "Está atingindo marcos acadêmicos esperados para pré-escolar?",
      parentExample: 'Testes simples: "Consegue reconhecer letras?", "Copia triângulo/quadrado?", "Lê palavras simples?"',
      whyUseful: "Rastreio rápido e estruturado de dificuldades acadêmicas precoces. Melhor prognóstico se identificado cedo.",
      time: "15–25 min",
    },
    prata: {
      seal: "prata",
      scaleId: "snap",
      scaleName: "SNAP-IV",
      mainQuestion: "Há TDAH subjacente que está prejudicando aprendizagem?",
      parentExample: 'Perguntas: "Tem dificuldade de atenção?", "Muito inquieto?", "Não segue instruções?"',
      whyUseful: "TDAH é a causa mais comum de dificuldade de aprendizagem em pré-escolar. Importante diferenciar.",
      time: "5–8 min",
    },
    bronze: {
      seal: "bronze",
      scaleId: "mchat",
      scaleName: "M-CHAT-R/F",
      mainQuestion: "Há sinais de autismo que podem estar afetando aprendizagem acadêmica?",
      parentExample: 'Questões: "Brinca de forma típica?", "Tem contato visual?", "Tem padrões repetitivos?"',
      whyUseful: "Autismo pode apresentar-se como dificuldade de aprendizagem em pré-escolar.",
      time: "5–8 min",
    },
  },

  {
    queixa: "aprendizagem",
    ageRange: "6-12 anos",
    ageMin: 72,
    ageMax: 144,
    ouro: {
      seal: "ouro",
      scaleId: "tde2-adaptado",
      scaleName: "TDE-2",
      mainQuestion: "Qual é o padrão específico: dislexia, disgrafia ou discalculia?",
      parentExample: 'Avalia: leitura (reconhecimento de palavras), escrita (ditado), aritmética (cálculo)',
      whyUseful: "Diferencia os tipos de dificuldade acadêmica. Cada um precisa de abordagem terapêutica diferente.",
      time: "15–25 min",
    },
    prata: {
      seal: "prata",
      scaleId: "snap",
      scaleName: "SNAP-IV",
      mainQuestion: "TDAH está sabotando o desempenho acadêmico?",
      parentExample: 'Questões: "Não presta atenção em aula?", "Muito inquieto na sala?", "Não consegue manter foco na lição?"',
      whyUseful: "Uma criança pode ter capacidade acadêmica normal mas TDAH severo prejudicando o desempenho. Precisa de medicação + pedagogia.",
      time: "5–8 min",
    },
    bronze: {
      seal: "bronze",
      scaleId: "brief2",
      scaleName: "BRIEF-2",
      mainQuestion: "Problemas de funções executivas estão contribuindo?",
      parentExample: 'Itens como: "Dificuldade para organizar material escolar?", "Não consegue começar tarefas?", "Memória de trabalho fraca?"',
      whyUseful: "Mesmo sem TDAH formal, déficits em funções executivas prejudicam aprendizagem. Requer intervenção específica.",
      time: "10–15 min",
    },
  },

  // ============= COMPORTAMENTO / AGRESSIVIDADE =============
  {
    queixa: "comportamento",
    ageRange: "2-4 anos",
    ageMin: 24,
    ageMax: 48,
    ouro: {
      seal: "ouro",
      scaleId: "cbcl",
      scaleName: "CBCL (Child Behavior Checklist)",
      mainQuestion: "Qual é o padrão de comportamento? (agressão, isolamento, nervosismo?)",
      parentExample: 'Exemplos: "Bate em outras crianças?", "Quebra coisas propositalmente?", "Muito birrenteiro?"',
      whyUseful: "Padrão-ouro para avaliar problemas comportamentais. Diferencia agressão, internalizando (isolamento/ansiedade) e impulsividade.",
      time: "10–15 min",
    },
    prata: {
      seal: "prata",
      scaleId: "sdq",
      scaleName: "SDQ",
      mainQuestion: "Como são os pontos fortes da criança? (foco apenas em problemas é incompleto)",
      parentExample: 'Itens positivos: "Ajuda outras crianças?", "Compartilha brinquedos?", "É obediente?"',
      whyUseful: "SDQ inclui escala de capacidades (pro-social). Importante para planejar intervenção focando em forças.",
      time: "5–8 min",
    },
    bronze: {
      seal: "bronze",
      scaleId: "scared",
      scaleName: "SCARED",
      mainQuestion: "Há ansiedade ou medo subjacentes causando agressão reativa?",
      parentExample: 'Questões: "Tem muito medo de coisas?", "Muito nervoso?", "Irritável facilmente?"',
      whyUseful: "Algumas crianças agressivas estão na verdade muito ansiosas/medrosas. Tratar ansiedade pode resolver agressão.",
      time: "5–8 min",
    },
  },

  {
    queixa: "comportamento",
    ageRange: "6-12 anos",
    ageMin: 72,
    ageMax: 144,
    ouro: {
      seal: "ouro",
      scaleId: "cbcl",
      scaleName: "CBCL",
      mainQuestion: "Qual é o perfil comportamental específico?",
      parentExample: 'Exemplos de itens: "Tem explosões de raiva?", "Discute com adultos?", "Muito impulsivo?", "Isolado?"',
      whyUseful: "Identifica se é agressão aberta, desafio de autoridade, ansiedade internalizada ou isolamento.",
      time: "10–15 min",
    },
    prata: {
      seal: "prata",
      scaleId: "snap",
      scaleName: "SNAP-IV",
      mainQuestion: "TDAH + impulsividade estão contribuindo?",
      parentExample: 'Perguntas: "Muito impulsivo?", "Não consegue esperar sua vez?", "Agressivo sem pensar?"',
      whyUseful: "TDAH frequentemente apresenta-se como comportamento 'ruim' ou 'desafiador' em crianças. Identificar TDAH muda todo o tratamento.",
      time: "5–8 min",
    },
    bronze: {
      seal: "bronze",
      scaleId: "pedsql",
      scaleName: "PedsQL",
      mainQuestion: "Qual o impacto do comportamento na qualidade de vida?",
      parentExample: 'Perguntas: "Consegue ter amigos?", "Participa em atividades normais?", "Família consegue se relacionar bem?"',
      whyUseful: "Mostra se problema é leve/moderado/severo em termos reais. Comportamento ruim com amigos normais ≠ comportamento ruim isolado.",
      time: "10 min",
    },
  },

  // ============= DEPRESSÃO / HUMOR =============
  {
    queixa: "depressao",
    ageRange: "6-12 anos",
    ageMin: 72,
    ageMax: 144,
    ouro: {
      seal: "ouro",
      scaleId: "phqa",
      scaleName: "PHQ-A (Patient Health Questionnaire for Adolescents)",
      mainQuestion: "Há sinais de depressão clínica (tristeza, anedonia, culpa)?",
      parentExample: 'Exemplos: "Parece triste ou sem esperança?", "Perdeu interesse em atividades que gostava?", "Sente-se inútil?"',
      whyUseful: "Padrão-ouro para triagem de depressão em crianças. Diferencia tristeza normal de depressão clínica.",
      time: "5–8 min",
    },
    prata: {
      seal: "prata",
      scaleId: "sdq",
      scaleName: "SDQ",
      mainQuestion: "Como está o funcionamento emocional e social geral?",
      parentExample: 'Itens: "Parece infeliz ou choroso?", "Tem baixa autoestima?", "Tem problemas com relacionamentos?"',
      whyUseful: "Visão ampla. Depressão frequentemente vem com problemas sociais e comportamentais.",
      time: "5–8 min",
    },
    bronze: {
      seal: "bronze",
      scaleId: "pedsql",
      scaleName: "PedsQL",
      mainQuestion: "Qual o impacto na vida diária (escola, sono, alimentação, socialização)?",
      parentExample: 'Perguntas: "Consegue ir à escola?", "Dorme bem?", "Come normalmente?", "Brinca com outras crianças?"',
      whyUseful: "Mostra severidade funcional. Depressão leve vs. grave têm abordagens muito diferentes.",
      time: "10 min",
    },
  },

  // ============= MOTOR / COORDENAÇÃO =============
  {
    queixa: "motor",
    ageRange: "1-2 anos",
    ageMin: 12,
    ageMax: 24,
    ouro: {
      seal: "ouro",
      scaleId: "denver",
      scaleName: "Denver II",
      mainQuestion: "Marcos motores estão dentro do esperado ou há atraso?",
      parentExample: 'Marcos: "Anda bem sem ajuda?", "Sobe degraus com ajuda?", "Pega objetos pequenos com três dedos?"',
      whyUseful: "Identifica atraso motor específico vs. normal. Permite início de intervenção precoce se necessário.",
      time: "15–20 min",
    },
    prata: {
      seal: "prata",
      scaleId: "aims",
      scaleName: "AIMS (Alberta Infant Motor Scale)",
      mainQuestion: "Qual é o nível de controle motor grosso (posição prono, supino, sentado, em pé)?",
      parentExample: "Observação de como o bebê se move e mantém posições. Não há pergunta direta, é observação.",
      whyUseful: "Detalha qual postura está fraca. AIMS é mais sensível que Denver para diferenças motoras sutis.",
      time: "20 min",
    },
    bronze: {
      seal: "bronze",
      scaleId: "asq3",
      scaleName: "ASQ-3",
      mainQuestion: "Há atraso em outras áreas além de motor?",
      parentExample: 'Questões sobre: linguagem, cognição, motor fino. Mostra se o atraso é isolado ou global.',
      whyUseful: "Se atraso motor global, indica deficiência intelectual. Se motor isolado, melhor prognóstico.",
      time: "10–15 min",
    },
  },

  {
    queixa: "motor",
    ageRange: "6-12 anos",
    ageMin: 72,
    ageMax: 144,
    ouro: {
      seal: "ouro",
      scaleId: "mabc2",
      scaleName: "MABC-2 (Movement Assessment Battery for Children)",
      mainQuestion: "Há Transtorno do Desenvolvimento da Coordenação (TDC)?",
      parentExample: 'Testes de: destreza manual, lançamento/recepção, equilíbrio (como pular em um pé, caminhar em linha reta)',
      whyUseful: "Padrão-ouro para TDC. Diferencia desajeitamento normal de verdadeiro transtorno motor.",
      time: "20–30 min",
    },
    prata: {
      seal: "prata",
      scaleId: "gmfcs",
      scaleName: "GMFCS (Gross Motor Function Classification)",
      mainQuestion: "Se há paralisia cerebral ou condição motora, qual é o nível funcional?",
      parentExample: "Avaliação de: como a criança anda, corre, sobe escadas. Classificação de I (normal) a V (muito limitado)",
      whyUseful: "MABC detecta problema. GMFCS quantifica a severidade funcional e ajuda planejar reabilitação.",
      time: "10–15 min",
    },
    bronze: {
      seal: "bronze",
      scaleId: "tde2-adaptado",
      scaleName: "TDE-2",
      mainQuestion: "O problema motor está afetando escrita e acadêmicos?",
      parentExample: 'Subtestes de escrita: "Consegue escrever letras?", "Consegue copiar frases?", "Consegue fazer cálculos?"',
      whyUseful: "TDC frequentemente prejudica escrita (disgrafia). TDE-2 mostra o impacto acadêmico.",
      time: "15–25 min",
    },
  },
];

/**
 * Função para obter as 3 recomendações (ouro/prata/bronze)
 * para uma queixa + faixa etária específica
 */
export function getOPBRecommendations(
  queixa: string,
  ageMonths: number
): QueixaAgeRecommendations | undefined {
  return recommendationsOPB.find(
    (rec) =>
      rec.queixa === queixa &&
      ageMonths >= rec.ageMin &&
      ageMonths <= rec.ageMax
  );
}

/**
 * Função para listar todas as queixas e faixas etárias disponíveis
 */
export function getAvailableOPBCombinations(): Array<{ queixa: string; ageRange: string }> {
  return recommendationsOPB.map((rec) => ({
    queixa: rec.queixa,
    ageRange: rec.ageRange,
  }));
}
