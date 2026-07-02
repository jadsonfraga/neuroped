import type { InteractiveScaleDef } from "./interactiveScaleItems";

export const j26Bloco3Items: Record<string, InteractiveScaleDef> = {
  // =====================================================================
  // CATEGORIA 11 — SONO EXPANDIDO (J26-131 a J26-139)
  // =====================================================================

  "j26-136": {
    instruction: "Marque o que melhor descreve a resposta da criança desde o início do uso da melatonina.",
    labels: ["Não observado / Não se aplica", "Parcialmente observado", "Sim, claramente observado"],
    optionPoints: [0, 1, 2],
    scoreDirection: "higher_better",
    totalLabel: "Escore de resposta à melatonina",
    domains: [
      {
        name: "Eficácia no Início do Sono",
        items: [
          "Adormece mais rápido após o uso da melatonina",
          "O tempo para adormecer reduziu para menos de 30 minutos",
          "Fica sonolenta no horário esperado após a melatonina",
          "A resistência para dormir diminuiu com o uso",
          "Há consistência no horário de adormecer nos dias com melatonina",
        ],
      },
      {
        name: "Qualidade do Sono e Tolerância",
        items: [
          "O sono da noite toda melhorou (menos despertares)",
          "Acorda no horário esperado sem sonolência excessiva",
          "Não apresentou efeitos adversos (dor de cabeça, irritabilidade matinal)",
          "Pais relatam melhora geral na qualidade do sono",
          "Criança não demonstra dependência para dormir sem a melatonina",
        ],
      },
    ],
    bands: [
      { minPct: 80, classification: "Boa resposta à melatonina", color: "emerald", description: "Criança respondeu bem. Mantenha dose e avalie redução gradual após 3–6 meses." },
      { minPct: 50, classification: "Resposta parcial — reavaliar dose", color: "amber", description: "Alguma melhora, mas não completa. Revise horário de administração, dose e higiene do sono." },
      { minPct: 0, classification: "Resposta insuficiente — rever conduta", color: "orange", description: "Pouca ou nenhuma resposta. Revise diagnóstico, avalie outros fatores e considere alternativas." },
    ],
  },

  "j26-137": {
    instruction: "Avalie a consistência da rotina pré-sono da criança nos últimos 30 dias.",
    labels: ["Nunca / Quase nunca", "Às vezes (menos da metade dos dias)", "Frequentemente (mais da metade)", "Sempre / Quase sempre"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_better",
    totalLabel: "Escore de consistência da rotina noturna",
    domains: [
      {
        name: "Rotina Pré-Sono",
        items: [
          "Tem horário fixo para dormir (varia menos de 30 minutos entre dias)",
          "Segue uma sequência previsível antes de dormir (banho, escovação, história)",
          "Evita atividades estimulantes na última hora antes de dormir",
          "Ambiente do quarto está escuro, silencioso e com temperatura adequada",
          "Não usa telas nas 60 minutos que antecedem o sono",
          "Faz refeição leve e não pesada na hora de jantar",
        ],
      },
      {
        name: "Autonomia e Associações do Sono",
        items: [
          "Adormece no próprio quarto / local habitual",
          "Consegue adormecer sem presença constante do cuidador",
          "Ao despertar à noite, retorna ao sono sem precisar chamar os pais",
          "Mantém a rotina nos fins de semana com variação máxima de 1 hora",
          "Tem horário fixo de acordar (inclusive fins de semana)",
          "Os pais têm consistência em cumprir a rotina estabelecida",
        ],
      },
    ],
    bands: [
      { minPct: 85, classification: "Rotina noturna adequada", color: "emerald", description: "Rotina consistente e hábitos de sono saudáveis. Mantenha." },
      { minPct: 65, classification: "Rotina parcial — reforçar", color: "amber", description: "Rotina existe mas com inconsistências. Reforce os pontos ausentes." },
      { minPct: 45, classification: "Rotina frágil — reestruturar", color: "orange", description: "Rotina inconsistente com impacto no sono. Implemente plano estruturado." },
      { minPct: 0, classification: "Sem rotina noturna — estabelecer urgentemente", color: "red", description: "Ausência de rotina. Psicoeducação intensiva e plano de higiene do sono." },
    ],
  },

  // =====================================================================
  // CATEGORIA 12 — ALIMENTAÇÃO E NUTRIÇÃO (J26-140 a J26-149)
  // =====================================================================

  "j26-146": {
    instruction: "Para cada habilidade alimentar, marque o que melhor descreve o desempenho da criança.",
    labels: ["Não faz / Não se aplica", "Faz com muita ajuda", "Faz com alguma ajuda", "Faz sozinha"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_better",
    totalLabel: "Escore de autonomia alimentar",
    domains: [
      {
        name: "Habilidades Práticas",
        items: [
          "Usa colher sem derramar excessivamente (esperado a partir de 18 meses)",
          "Usa garfo sem ajuda (esperado a partir de 2 anos)",
          "Bebe em copo aberto sem derramar (esperado a partir de 2 anos)",
          "Usa faca para alimentos macios (esperado a partir de 5 anos)",
          "Serve o próprio prato com supervisão (esperado a partir de 5 anos)",
          "Prepara lanches simples sozinha (esperado a partir de 7 anos)",
        ],
      },
      {
        name: "Comportamento Autônomo",
        items: [
          "Reconhece e comunica sensação de fome e saciedade",
          "Para de comer quando está satisfeita sem pressão dos pais",
          "Escolhe entre opções alimentares apresentadas",
          "Adapta-se a refeições em diferentes contextos (escola, visita, restaurante)",
          "Lava as mãos antes das refeições com lembrança leve",
        ],
      },
    ],
    bands: [
      { minPct: 85, classification: "Autonomia alimentar adequada para a idade", color: "emerald", description: "Criança desenvolve independência alimentar conforme o esperado. Incentive a continuidade." },
      { minPct: 65, classification: "Autonomia em desenvolvimento — incentivar", color: "amber", description: "Algumas habilidades presentes. Ofereça mais oportunidades de prática supervisionada." },
      { minPct: 45, classification: "Autonomia limitada — intervir", color: "orange", description: "Dependência excessiva para a faixa etária. Avalie fatores motores, cognitivos e familiares." },
      { minPct: 0, classification: "Dependência alimentar — investigar", color: "red", description: "Muito dependente para a idade. Investigue causa e encaminhe para terapia ocupacional." },
    ],
  },

  // =====================================================================
  // CATEGORIA 13 — DOR E CEFALEIA (J26-150 a J26-157)
  // =====================================================================

  "j26-176": {
    instruction: "Para cada característica de resiliência, marque o que melhor descreve a criança.",
    labels: ["Nao demonstra", "Demonstra raramente", "Demonstra as vezes", "Demonstra consistentemente"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_better",
    totalLabel: "Escore de resiliência infantil",
    domains: [
      {
        name: "Enfrentamento e Adaptacao",
        items: [
          "Enfrenta dificuldades sem desistir facilmente",
          "Busca solucoes quando encontra obstaculos",
          "Aceita ajuda dos outros em momentos dificeis",
          "Se recupera apos frustracoes ou perdas em tempo adequado para a idade",
          "Demonstra otimismo — acredita que as coisas podem melhorar",
          "Mantém o funcionamento mesmo em situacoes adversas",
        ],
      },
      {
        name: "Fatores Protetores",
        items: [
          "Tem pelo menos um adulto de referencia com quem pode contar",
          "Tem amigos que a apoiam e com quem compartilha dificuldades",
          "Tem atividades de lazer e recreacao que gosta",
          "Tem senso de identidade positiva (sabe o que e bom nela)",
          "Tem senso de proposito ou atividades que lhe dao significado",
        ],
      },
    ],
    bands: [
      { minPct: 85, classification: "Alta resiliência — fator protetor", color: "emerald", description: "Criança com boa capacidade de resiliência. Fortaleça os fatores protetores identificados." },
      { minPct: 65, classification: "Resiliência moderada — fortalecer", color: "amber", description: "Resiliência presente mas com lacunas. Identifique e amplie os fatores protetores." },
      { minPct: 45, classification: "Resiliência baixa — intervir", color: "orange", description: "Poucos recursos de resiliência. Intervenção para desenvolvimento de habilidades de enfrentamento." },
      { minPct: 0, classification: "Resiliência muito baixa — suporte urgente", color: "red", description: "Criança altamente vulnerável. Suporte psicossocial intensivo e rede de proteção." },
    ],
  },

  // =====================================================================
  // CATEGORIA 16 — QUALIDADE DE VIDA E FUNCIONALIDADE (J26-180 a J26-189)
  // =====================================================================

  "j26-180": {
    instruction: "Para cada atividade de vida diária, marque o nível de independência da criança.",
    labels: ["Dependente / Nao realiza", "Realiza com muita ajuda", "Realiza com alguma ajuda", "Realiza de forma independente"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_better",
    totalLabel: "Escore de independência nas AVDs",
    domains: [
      {
        name: "Autocuidado",
        items: [
          "Higiene oral — escova os dentes com supervisao minima",
          "Banho — toma banho com supervisao minima para a faixa etaria",
          "Vestir-se — escolhe e coloca roupas adequadas para a ocasiao",
          "Calcar sapatos — coloca e fecha os calcados",
          "Alimentacao — come usando talheres adequados para a idade",
          "Controle esfincteriano — usa o banheiro de forma independente",
        ],
      },
      {
        name: "Mobilidade e Participação",
        items: [
          "Locomocao — anda ou se locomove de forma adequada para a condicao",
          "Subir e descer escadas — sem auxilio ou com suporte minimo",
          "Transporte — usa transporte escolar ou coletivo com supervisao adequada",
          "Comunicacao — expressa necessidades e desejos de forma funcional",
          "Participacao escolar — vai a escola e realiza atividades pedagogicas",
          "Tarefas domesticas simples — contribui com tarefas adequadas para a idade",
        ],
      },
    ],
    bands: [
      { minPct: 85, classification: "Boa independência nas AVDs para a faixa etária", color: "emerald", description: "Criança independente nas atividades diárias. Incentive a ampliação progressiva." },
      { minPct: 65, classification: "Independência parcial — incentivar", color: "amber", description: "Boa independência em algumas áreas. Identifique e trabalhe as áreas com maior dependência." },
      { minPct: 45, classification: "Dependência moderada — intervenção terapêutica", color: "orange", description: "Dependência em muitas áreas. Terapia ocupacional e plano de independência progressiva." },
      { minPct: 0, classification: "Alta dependência — suporte intensivo", color: "red", description: "Grande dependência em AVDs. Avaliação funcional completa e plano de habilitação individualizado." },
    ],
  },

  "j26-181": {
    instruction: "Para cada tipo de participação social, marque a frequência com que a criança participa.",
    labels: ["Nunca / Nao participa", "Raramente", "As vezes", "Frequentemente / Sempre"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_better",
    totalLabel: "Escore de participação social",
    domains: [
      {
        name: "Participação Comunitária",
        items: [
          "Participa de festas de aniversario de colegas",
          "Vai ao parque, praca ou espacos publicos com familia ou amigos",
          "Participa de atividades de lazer fora de casa (cinema, shopping, praia)",
          "Usa espacos comunitarios (biblioteca, clube, quadra) com adequacao",
          "Participa de atividades religiosas ou culturais da familia",
        ],
      },
      {
        name: "Participação com Pares",
        items: [
          "Tem amigos com quem brinca fora da escola",
          "Participa de esportes ou atividades extracurriculares em grupo",
          "E convidada e participa de eventos sociais de colegas",
          "Inicia ou aceita brincadeiras cooperativas com outras criancas",
          "Mantem amizades ao longo do tempo",
          "Adapta-se a diferentes grupos e contextos sociais",
        ],
      },
    ],
    bands: [
      { minPct: 85, classification: "Participação social adequada", color: "emerald", description: "Criança com boa participação em diferentes contextos. Mantenha e diversifique oportunidades." },
      { minPct: 65, classification: "Participação parcial — ampliar", color: "amber", description: "Participação em alguns contextos. Identifique barreiras e crie oportunidades de inclusão." },
      { minPct: 45, classification: "Participação restrita — intervir", color: "orange", description: "Participação limitada com impacto no desenvolvimento social. Intervenção e adaptação de contextos." },
      { minPct: 0, classification: "Participação muito restrita — suporte urgente", color: "red", description: "Grande isolamento social. Investigação e intervenção urgente de inclusão social." },
    ],
  },

  "j26-184": {
    instruction: "Para cada aspecto do atendimento recebido, marque o quanto a família está satisfeita.",
    labels: ["Muito insatisfeito", "Insatisfeito", "Satisfeito", "Muito satisfeito"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_better",
    totalLabel: "Escore de satisfação com o tratamento",
    domains: [
      {
        name: "Atendimento Médico",
        items: [
          "O medico explica o diagnostico de forma clara e compreensivel",
          "O medico escuta as preocupacoes da familia com atencao",
          "O medico responde as duvidas de forma satisfatoria",
          "O tempo de consulta e suficiente para abordar as questoes importantes",
          "O plano de tratamento e explicado e negociado com a familia",
          "Ha facilidade de contato com o medico entre as consultas",
        ],
      },
      {
        name: "Resultado do Tratamento",
        items: [
          "A familia percebe melhora no filho desde o inicio do tratamento",
          "As terapias indicadas estao sendo eficazes",
          "A escola esta colaborando com o plano de tratamento",
          "A familia se sente empoderada para lidar com os desafios",
          "O tratamento e compativel com a rotina e realidade da familia",
        ],
      },
    ],
    bands: [
      { minPct: 85, classification: "Alta satisfação com o tratamento", color: "emerald", description: "Família muito satisfeita. Mantenha a qualidade do atendimento e monitore regularmente." },
      { minPct: 65, classification: "Satisfação moderada — identificar áreas de melhoria", color: "amber", description: "Satisfação adequada com pontos de melhoria. Identifique o que pode ser aprimorado." },
      { minPct: 45, classification: "Insatisfação parcial — rever abordagem", color: "orange", description: "Insatisfação em aspectos importantes. Avalie a relação terapêutica e ajuste o plano." },
      { minPct: 0, classification: "Insatisfação significativa — revisão urgente", color: "red", description: "Família insatisfeita. Reunião de avaliação para identificar e corrigir problemas no tratamento." },
    ],
  },

  "j26-185": {
    instruction: "Para cada aspecto do engajamento nas terapias, marque o que melhor descreve a situação.",
    labels: ["Nao consegue / Nunca", "Consegue raramente", "Consegue as vezes", "Consegue sempre / Sem dificuldade"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_better",
    totalLabel: "Escore de engajamento terapêutico",
    domains: [
      {
        name: "Frequência e Acesso",
        items: [
          "Consegue manter frequencia regular nas terapias (menos de 2 faltas por mes)",
          "Tem transporte acessivel para chegar as terapias",
          "O custo das terapias nao e uma barreira significativa",
          "As terapias estao em horario compativel com a rotina familiar",
          "A crianca nao tem resistencia em ir as terapias",
        ],
      },
      {
        name: "Participação e Evolução",
        items: [
          "A crianca participa ativamente das atividades terapeuticas",
          "A familia aplica em casa o que aprende nas terapias",
          "Ha comunicacao efetiva entre os terapeutas e a familia",
          "A familia percebe evolucao na crianca com as terapias",
          "Os terapeutas comunicam o progresso e os objetivos de forma clara",
          "A familia esta motivada a continuar com as terapias",
        ],
      },
    ],
    bands: [
      { minPct: 85, classification: "Engajamento terapêutico adequado", color: "emerald", description: "Família bem engajada. Mantenha frequência e generalize o aprendizado." },
      { minPct: 65, classification: "Engajamento parcial — identificar barreiras", color: "amber", description: "Engajamento com algumas dificuldades. Identifique barreiras e estratégias de apoio." },
      { minPct: 45, classification: "Engajamento insuficiente — intervir", color: "orange", description: "Barreiras frequentes ao engajamento. Avalie e reorganize o plano terapêutico." },
      { minPct: 0, classification: "Engajamento muito baixo — avaliação urgente", color: "red", description: "Família com grave dificuldade de engajamento. Avaliação abrangente de barreiras e revisão do plano." },
    ],
  },

  "j26-186": {
    instruction: "Para cada aspecto da inclusão escolar, marque o que melhor descreve a situação da criança com NEE.",
    labels: ["Nao ocorre / Ausente", "Ocorre raramente", "Ocorre as vezes", "Ocorre sempre / Plenamente"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_better",
    totalLabel: "Escore de inclusão escolar efetiva",
    domains: [
      {
        name: "Participação na Sala de Aula",
        items: [
          "A crianca participa das atividades de sala de aula com adaptacoes adequadas",
          "O professor faz adaptacoes curriculares especificas para a crianca",
          "A crianca tem acesso ao AEE (Atendimento Educacional Especializado)",
          "A crianca e incluida nas atividades com os colegas",
          "Nao e discriminada ou bullied pelos colegas por causa da NEE",
          "O professor tem formacao ou suporte para lidar com a NEE da crianca",
        ],
      },
      {
        name: "Participação Social e Institucional",
        items: [
          "A crianca tem amigos na escola",
          "Participa de atividades extracurriculares com os colegas",
          "A escola tem estrutura fisica acessivel para a crianca",
          "Ha comunicacao efetiva entre escola e familia sobre o progresso",
          "A escola tem plano de desenvolvimento individualizado (PDI)",
          "A familia se sente acolhida e parceira na escola",
        ],
      },
    ],
    bands: [
      { minPct: 85, classification: "Inclusão escolar efetiva e plena", color: "emerald", description: "Criança bem incluída. Mantenha as práticas e celebre as conquistas." },
      { minPct: 65, classification: "Inclusão parcial — fortalecer", color: "amber", description: "Inclusão presente mas com lacunas. Identifique e trabalhe os aspectos ausentes." },
      { minPct: 45, classification: "Inclusão comprometida — intervenção", color: "orange", description: "Importantes barreiras à inclusão. Reunião escola-família-equipe para plano de ação." },
      { minPct: 0, classification: "Exclusão escolar — urgente", color: "red", description: "Criança excluída ou marginalizada. Intervenção urgente com escola e rede de proteção." },
    ],
  },

  "j26-187": {
    instruction: "Para cada aspecto do desenvolvimento da autonomia, marque o que melhor descreve o adolescente com NEE.",
    labels: ["Muito dependente / Ausente", "Dependente com alguma habilidade", "Parcialmente autonomo", "Plenamente autonomo para a situacao"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_better",
    totalLabel: "Escore de autonomia do adolescente com NEE",
    domains: [
      {
        name: "Autonomia Pessoal",
        items: [
          "Realiza higiene e autocuidado de forma independente",
          "Prepara alimentos simples sozinho",
          "Administra dinheiro para compras simples",
          "Usa transporte publico ou se locomove com independencia adequada",
          "Toma decisoes sobre atividades e preferencias pessoais",
          "Expressa preferencias e valores proprios",
        ],
      },
      {
        name: "Projeto de Vida",
        items: [
          "Tem perspectivas de vida profissional ou vocacional",
          "Participa de atividades de formacao profissional ou preparatoria",
          "Tem relacionamentos sociais fora do contexto familiar",
          "Demonstra senso de identidade positiva independente da NEE",
          "A familia apoia a autonomia sem superproteger",
          "Ha plano de transicao para a vida adulta",
        ],
      },
    ],
    bands: [
      { minPct: 85, classification: "Boa autonomia e perspectiva de vida", color: "emerald", description: "Adolescente com bom nível de autonomia e projeto de vida. Fortaleça e amplie oportunidades." },
      { minPct: 65, classification: "Autonomia em desenvolvimento — incentivar", color: "amber", description: "Autonomia presente em algumas áreas. Crie oportunidades e reduza a superproteção." },
      { minPct: 45, classification: "Autonomia limitada — plano de transição", color: "orange", description: "Dependência em muitas áreas. Elabore plano de transição para a vida adulta." },
      { minPct: 0, classification: "Grande dependência — suporte intensivo", color: "red", description: "Dependência muito alta para o potencial identificado. Avaliação e intervenção intensiva de vida independente." },
    ],
  },

  "j26-189": {
    instruction: "Para cada função, marque o nível de funcionalidade da criança com paralisia cerebral.",
    labels: ["Sem funcao / Dependencia total", "Funcao muito limitada", "Funcao moderada com adaptacoes", "Funcao adequada para o nivel"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_better",
    totalLabel: "Escore funcional global na paralisia cerebral",
    domains: [
      {
        name: "Motor e Mobilidade",
        items: [
          "Motor grosso — mobilidade e deambulacao (nivel GMFCS)",
          "Motor fino — uso das maos e manipulacao (nivel MACS)",
          "Controle postural — sentado, em pe e transferencias",
          "Alimentacao — mastigacao e degluticao (nivel EDACS)",
          "Comunicacao — expressao e compreensao (nivel CFCS)",
        ],
      },
      {
        name: "Cognitivo e Participação",
        items: [
          "Cognicao e aprendizagem — nivel de desempenho escolar ou funcional",
          "Comunicacao alternativa — usa CAA ou recursos de apoio se necessario",
          "AVDs — nivel de independencia nas atividades de vida diaria",
          "Participacao — frequencia e qualidade da participacao em atividades",
          "Qualidade de vida — nivel de satisfacao e bem-estar percebido",
          "Saude — controle de comorbidades (epilepsia, dor, nutricao, sono)",
        ],
      },
    ],
    bands: [
      { minPct: 85, classification: "Boa funcionalidade para o nível de PC", color: "emerald", description: "Criança funcionando bem para o nível de comprometimento. Mantenha intervenções e monitore." },
      { minPct: 65, classification: "Funcionalidade moderada — manter e otimizar", color: "amber", description: "Boa funcionalidade em algumas áreas. Identifique domínios prioritários de intervenção." },
      { minPct: 45, classification: "Funcionalidade comprometida — intensificar terapias", color: "orange", description: "Funcionalidade abaixo do potencial. Reavalie plano terapêutico e estabeleça metas prioritárias." },
      { minPct: 0, classification: "Funcionalidade muito comprometida — revisão completa", color: "red", description: "Grande comprometimento funcional. Revisão completa do plano de habilitação e equipe multidisciplinar." },
    ],
  },

  // =====================================================================
  // CATEGORIA 17 — NEONATAL E PREMATURIDADE (J26-190 a J26-195)
  // =====================================================================

  "j26-191": {
    instruction: "Para cada indicador, marque o que melhor descreve a prontidão alimentar do prematuro.",
    labels: ["Ausente / Nao avaliado", "Presente mas inconsistente", "Presente na maioria das tentativas", "Presente e consistente"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_better",
    totalLabel: "Escore de prontidão alimentar oral do prematuro",
    domains: [
      {
        name: "Estado e Reflexos",
        items: [
          "Estado de alerta ativo no momento da tentativa alimentar",
          "Reflexo de busca presente e ativo",
          "Reflexo de succao presente com boa amplitude",
          "Reflexo de degluticao funcional",
          "Resposta ao estimulo perioral adequada",
        ],
      },
      {
        name: "Coordinação e Tolerância",
        items: [
          "Coordenacao succao-degluticao-respiracao mantida por pelo menos 10 sugadas",
          "Nao apresenta dessaturacao durante a tentativa oral",
          "Nao apresenta bradicardia durante a alimentacao",
          "Nao apresenta apneia durante a alimentacao",
          "Tolerou pelo menos 5 ml de leite por via oral sem intercorrencias",
          "Familia participou de ao menos 1 sessao de treinamento de alimentacao",
        ],
      },
    ],
    bands: [
      { minPct: 85, classification: "Pronto para via oral exclusiva", color: "emerald", description: "Prematuro com prontidão alimentar. Inicie transição para via oral exclusiva com supervisão." },
      { minPct: 65, classification: "Prontidão parcial — transição gradual", color: "amber", description: "Prontidão em desenvolvimento. Continue com alimentação mista (oral + sonda) e reavalie." },
      { minPct: 45, classification: "Prontidão limitada — manter sonda predominante", color: "orange", description: "Prontidão insuficiente. Mantenha sonda como via principal e continue estímulo oral." },
      { minPct: 0, classification: "Sem prontidão — aguardar maturação", color: "red", description: "Prematuro sem prontidão alimentar oral. Mantenha nutrição enteral e adie tentativas orais." },
    ],
  },

  "j26-192": {
    instruction: "Para cada aspecto do Método Canguru, marque o que melhor descreve a situação no follow-up.",
    labels: ["Nao realizado / Ausente", "Realizado raramente", "Realizado as vezes", "Realizado frequentemente / Pleno"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_better",
    totalLabel: "Escore de follow-up do Método Canguru",
    domains: [
      {
        name: "Vinculo e Amamentacao",
        items: [
          "Os pais realizam contato pele a pele regularmente apos a alta",
          "A mae esta amamentando ou tentando amamentar",
          "O bebe demonstra comportamentos de vinculo (olha, sorri, busca o contato)",
          "Os pais demonstram confianca no cuidado do bebe",
          "A mae recebe apoio para amamentacao (consultora, grupo de apoio)",
        ],
      },
      {
        name: "Desenvolvimento e Seguimento",
        items: [
          "O bebe esta ganhando peso adequadamente (mais de 20 g/dia)",
          "Os pais reconhecem sinais de alerta de desenvolvimento",
          "Ha consultas de follow-up sendo realizadas conforme programado",
          "Os pais relatam boa qualidade do sono e alimentacao do bebe",
          "Nao ha sinais de depressao pos-parto na mae",
          "A familia tem rede de apoio adequada para o cuidado do prematuro",
        ],
      },
    ],
    bands: [
      { minPct: 85, classification: "Follow-up do Canguru adequado", color: "emerald", description: "Família engajada e bebê progredindo. Mantenha o suporte e próxima consulta programada." },
      { minPct: 65, classification: "Follow-up parcial — reforçar", color: "amber", description: "Algumas lacunas no seguimento. Identifique barreiras e reforce orientações." },
      { minPct: 45, classification: "Follow-up insuficiente — intervir", color: "orange", description: "Seguimento inadequado. Avalie necessidades da família e ofereça suporte adicional." },
      { minPct: 0, classification: "Follow-up muito inadequado — risco para o bebê", color: "red", description: "Família com grandes dificuldades. Avaliação urgente de risco e suporte intensivo." },
    ],
  },

  "j26-194": {
    instruction: "Para cada critério de alta da UTIN, marque se está plenamente atingido.",
    labels: ["Nao atingido", "Atingido parcialmente", "Atingido com reservas", "Atingido plenamente"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_better",
    totalLabel: "Escore de prontidão para alta da UTIN",
    domains: [
      {
        name: "Estabilidade Clínica do Bebe",
        items: [
          "Peso adequado para alta (> 1800 g ou conforme protocolo institucional)",
          "Temperatura estavel em berco comum ha mais de 24 horas",
          "Via oral exclusiva ha mais de 48 horas com ganho de peso",
          "Ausencia de apneia ou bradicardia significativa ha mais de 5 dias",
          "Ausencia de necessidade de oxigenio suplementar",
          "Exames laboratoriais de alta dentro dos limites aceitaveis",
        ],
      },
      {
        name: "Preparo da Familia",
        items: [
          "Mae e/ou pai treinados para amamentacao ou preparacao do leite",
          "Familia treinada para identificar sinais de alerta do bebe",
          "Familia sabe quando e como procurar atendimento de urgencia",
          "Familia tem rede de apoio adequada em casa",
          "Consulta de follow-up agendada para ate 7 dias apos a alta",
          "Familia demonstrou confianca no cuidado do bebe em simulacao",
        ],
      },
    ],
    bands: [
      { minPct: 85, classification: "Pronto para alta da UTIN", color: "emerald", description: "Critérios de alta atingidos. Oriente sobre seguimento e sinais de alerta." },
      { minPct: 65, classification: "Alta iminente — concluir preparo", color: "amber", description: "Quase pronto. Conclua os critérios pendentes e o preparo familiar." },
      { minPct: 45, classification: "Alta ainda não indicada — continuar internação", color: "orange", description: "Critérios importantes ainda não atingidos. Continue cuidados e reavalie em 24–48 h." },
      { minPct: 0, classification: "Alta não indicada — situação crítica", color: "red", description: "Instabilidade ou preparo familiar inadequado. Mantenha internação e suporte intensivo." },
    ],
  },

  "j26-195": {
    instruction: "Para cada domínio do desenvolvimento, marque o desempenho do prematuro aos 2 anos de idade corrigida.",
    labels: ["Muito abaixo do esperado", "Abaixo do esperado", "Dentro do esperado", "Acima do esperado"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_better",
    totalLabel: "Escore de desenvolvimento do prematuro aos 2 anos",
    domains: [
      {
        name: "Motor e Comunicação",
        items: [
          "Motor grosso — caminha de forma estavel e sobe e desce escadas com apoio",
          "Motor fino — empilha cubos, faz rabiscos, segura colher",
          "Linguagem expressiva — fala pelo menos 50 palavras e frases de 2 palavras",
          "Linguagem receptiva — compreende instrucoes simples de 2 etapas",
          "Comunicacao social — aponta para objetos e usa gesto para comunicar",
        ],
      },
      {
        name: "Cognitivo e Social",
        items: [
          "Cognicao — resolve problemas simples, brincadeira de faz de conta basica",
          "Atencao — foca em atividade por pelo menos 2-3 minutos",
          "Social — brinca ao lado de outras criancas com interesse",
          "Regulacao emocional — birras dentro do esperado para 2 anos de idade corrigida",
          "Alimentacao — aceita variada textura e e relativamente independente na colher",
          "Sono — dorme de 10 a 14 horas por dia sem disrupcoes graves",
        ],
      },
    ],
    bands: [
      { minPct: 85, classification: "Desenvolvimento adequado aos 2 anos corrigidos", color: "emerald", description: "Prematuro com desenvolvimento dentro ou acima do esperado para 2 anos corrigidos. Continue o follow-up." },
      { minPct: 65, classification: "Desenvolvimento com leve atraso — monitorar", color: "amber", description: "Leve atraso em alguns domínios. Reavalie em 3 meses e intensifique estimulação." },
      { minPct: 45, classification: "Atraso moderado — estimulação e terapias", color: "orange", description: "Atraso em múltiplos domínios. Estimulação precoce e avaliação por equipe multidisciplinar." },
      { minPct: 0, classification: "Atraso grave — investigação e intervenção intensiva", color: "red", description: "Atraso grave em vários domínios. Investigação neurológica e intervenção terapêutica intensiva." },
    ],
  }
};
