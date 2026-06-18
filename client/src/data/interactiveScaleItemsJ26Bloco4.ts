import type { InteractiveScaleDef } from "./interactiveScaleItems";

export const j26Bloco4Items: Record<string, InteractiveScaleDef> = {

  // ── j26-196 — Ansiedade Pais UTIN ──
  "j26-196": {
    instruction: "Marque a frequencia com que voce se sentiu assim nas ultimas semanas. Responda com sinceridade — essas informacoes ajudam a equipe a apoiar voce.",
    infoBox: "Triagem de saude mental dos pais durante internacao na UTIN. Pontuacao alta indica necessidade de suporte psicologico. Nao e diagnostico.",
    labels: ["Nunca", "As vezes", "Frequentemente"],
    optionPoints: [0, 1, 2],
    scoreDirection: "higher_worse",
    totalLabel: "Carga emocional parental (0-24)",
    bands: [
      { minPct: 0, classification: "Sem alteracao relevante", color: "emerald", description: "Baixa pontuacao. Manter vigilancia clinica de rotina." },
      { minPct: 25, classification: "Sinais leves", color: "amber", description: "Ha sinais leves ou ocasionais. Oriente observacao e reavalie." },
      { minPct: 45, classification: "Sinais moderados", color: "orange", description: "Sinais relevantes presentes. Correlacione com historia e exame clinico." },
      { minPct: 67, classification: "Alteracao importante", color: "red", description: "Escore elevado. Avalie risco funcional e necessidade de intervencao." },
    ],
    domains: [
      {
        name: "Ansiedade e medo",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          "Sinto medo de que meu bebe piore ou nao sobreviva",
          "Fico muito ansioso(a) a cada exame ou procedimento",
          "Tenho dificuldade de dormir por preocupacao com o bebe",
          "Meu coracao acelera ou fico tremendo ao ver o bebe na UTIN",
        ],
      },
      {
        name: "Tristeza e culpa",
        color: "text-violet-600 dark:text-violet-400",
        items: [
          "Me sinto culpado(a) pela internacao do meu filho",
          "Fico muito triste ou choro com frequencia",
          "Me sinto impotente por nao poder fazer mais",
          "Me sinto distante do meu bebe por nao poder cuidar como queria",
        ],
      },
      {
        name: "Funcionalidade e suporte",
        color: "text-teal-600 dark:text-teal-400",
        items: [
          "Tenho dificuldade de comer ou me cuidar",
          "Me sinto sem energia para enfrentar o dia",
          "Sinto que nao tenho apoio suficiente",
          "Tenho dificuldade de entender as informacoes da equipe",
        ],
      },
    ],
  },

  // ── j26-197 — Icterícia Neonatal Seguimento ──
  "j26-197": {
    instruction: "Marque o que voce observa no bebe hoje. Responda com base no que realmente acontece — nao no que imagina que aconteceria.",
    infoBox: "Seguimento neurossensorial de neonatos com ictericia grave. Maior pontuacao = mais sinais presentes. Nao e diagnostico.",
    labels: ["Nao observado", "Emergente", "Parcial", "Adequado"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_better",
    totalLabel: "Seguimento pos-kernicterus (maior = melhor)",
    bands: [
      { minPct: 85, classification: "Desempenho adequado", color: "emerald", description: "Maioria dos marcos/habilidades presentes. Mantenha vigilancia de rotina." },
      { minPct: 60, classification: "Em desenvolvimento - vigiar", color: "amber", description: "Ha habilidades presentes mas algumas areas merecem atencao. Reavalie em 1-2 meses." },
      { minPct: 40, classification: "Atraso possivel - reavaliar", color: "orange", description: "Desempenho abaixo do esperado. Considere avaliacao dirigida." },
      { minPct: 0, classification: "Atraso provavel - encaminhar", color: "red", description: "Poucas habilidades presentes. Investigar e encaminhar." },
    ],
    domains: [
      {
        name: "Motor e tonus",
        color: "text-teal-600 dark:text-teal-400",
        items: [
          "Tem tonus muscular adequado para a idade",
          "Controla a cabeca conforme esperado",
          "Senta ou sustenta o tronco conforme a faixa etaria",
          "Tem movimentos simetricos dos membros",
          "Nao apresenta movimentos involuntarios ou coreoatetose",
          "Motor grosso compativel com a idade corrigida",
        ],
      },
      {
        name: "Audicao e linguagem",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          "Passou a triagem auditiva neonatal",
          "Reage a sons do ambiente",
          "Balbucia ou vocaliza conforme a idade",
          "Linguagem em desenvolvimento adequado",
          "Sem sinais de perda auditiva identificados",
          "Nao apresenta disturbios de processamento auditivo",
        ],
      },
      {
        name: "Visual e cognitivo",
        color: "text-violet-600 dark:text-violet-400",
        items: [
          "Acompanha objetos com o olhar",
          "Tem acuidade visual adequada para a idade",
          "Sem nistagmo ou disturbio oculomotor evidente",
          "Desenvolvimento cognitivo compativel com a idade",
          "Interacao social e sorriso social presentes",
          "Sem sinais de encefalopatia cronica progressiva",
        ],
      },
    ],
  },

  // ── j26-198 — Estimulante Efeitos Acompanhamento ──
  "j26-198": {
    instruction: "Marque a intensidade de cada efeito observado na crianca nas ultimas 2 semanas de uso do estimulante. Responda com base no que voce realmente nota.",
    infoBox: "Monitoramento semanal/quinzenal de efeitos do metilfenidato ou anfetaminas. Pontuacao alta = maior carga de efeitos. Nao e diagnostico.",
    labels: ["Ausente", "Leve", "Moderado", "Intenso"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "Carga de efeitos do estimulante (0-60)",
    bands: [
      { minPct: 0, classification: "Sem efeitos relevantes", color: "emerald", description: "Sem efeitos clinicamente relevantes. Manter vigilancia de rotina." },
      { minPct: 20, classification: "Efeitos leves", color: "amber", description: "Efeitos leves ou ocasionais. Registre e acompanhe tendencia." },
      { minPct: 40, classification: "Efeitos moderados - ponderar", color: "orange", description: "Efeitos relevantes. Considere dose, tempo de uso e comorbidades." },
      { minPct: 65, classification: "Efeitos importantes - revisar", color: "red", description: "Carga alta de efeitos. Revisao medicamentosa e plano de seguranca." },
    ],
    domains: [
      {
        name: "Apetite e crescimento",
        color: "text-orange-600 dark:text-orange-400",
        items: [
          "Reducao do apetite no almoco e no jantar",
          "Perda de peso ou desaceleracao do crescimento",
          "Recusa alimentar nos horarios de pico do remedio",
          "Queixa de dor de estomago ou nausea",
          "Bebe menos liquidos durante o dia",
        ],
      },
      {
        name: "Sono",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          "Dificuldade de adormecer no horario habitual",
          "Sono mais superficial ou agitado",
          "Acorda mais vezes durante a noite",
          "Irritabilidade ao acordar pela manha",
        ],
      },
      {
        name: "Humor e comportamento",
        color: "text-violet-600 dark:text-violet-400",
        items: [
          "Choro facil ou irritabilidade no fim do efeito (rebound)",
          "Ansiedade ou agitacao apos a dose",
          "Aparecimento ou piora de tiques",
          "Comportamento robotico ou rigido demais",
          "Aparecimento de tiquismo ou caretas",
        ],
      },
      {
        name: "Cardiovascular",
        color: "text-red-600 dark:text-red-400",
        items: [
          "Queixa de palpitacao ou coracao acelerado",
          "Dor ou desconforto no peito",
        ],
      },
    ],
  },

  // ── j26-199 — Antiepiléptico Monitorização Ampla ──
  "j26-199": {
    instruction: "Marque a intensidade de cada efeito observado desde o inicio ou ajuste do antiepiletico. Responda sobre o que realmente esta acontecendo.",
    infoBox: "Monitoramento amplo de efeitos dos novos antiepileticos. Pontuacao alta = maior carga de efeitos. Nao e diagnostico.",
    labels: ["Ausente", "Leve", "Moderado", "Intenso"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "Carga de efeitos do antiepiletico (0-54)",
    bands: [
      { minPct: 0, classification: "Sem efeitos relevantes", color: "emerald", description: "Sem efeitos clinicamente relevantes. Manter vigilancia de rotina." },
      { minPct: 20, classification: "Efeitos leves", color: "amber", description: "Efeitos leves ou ocasionais. Registre e acompanhe tendencia." },
      { minPct: 40, classification: "Efeitos moderados - ponderar", color: "orange", description: "Efeitos relevantes. Considere dose, tempo de uso e comorbidades." },
      { minPct: 65, classification: "Efeitos importantes - revisar", color: "red", description: "Carga alta de efeitos. Revisao medicamentosa e plano de seguranca." },
    ],
    domains: [
      {
        name: "Neurologico",
        color: "text-violet-600 dark:text-violet-400",
        items: [
          "Sonolencia excessiva durante o dia",
          "Tontura ou sensacao de desequilibrio",
          "Visao dupla ou borrada",
          "Dor de cabeca frequente",
          "Formigamento nas maos ou nos pes",
        ],
      },
      {
        name: "Comportamental e cognitivo",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          "Lentidao de raciocinio ou piora da memoria",
          "Irritabilidade ou agressividade",
          "Tristeza ou humor deprimido",
          "Agitacao ou ansiedade aumentada",
          "Dificuldade de atencao na escola",
        ],
      },
      {
        name: "Gastrointestinal e metabolico",
        color: "text-orange-600 dark:text-orange-400",
        items: [
          "Nausea ou vomito",
          "Perda de apetite",
          "Dor abdominal",
          "Ganho excessivo de peso",
          "Queda de cabelo",
          "Erupcao cutanea ou alergia",
          "Reducao na sudorese ou aumento de temperatura",
        ],
      },
    ],
  },

  // ── j26-200 — Antipsicótico Metabólico ──
  "j26-200": {
    instruction: "Marque o que esta sendo observado ou monitorado na crianca em uso de antipsicotico. Use dados do exame clinico e dos exames laboratoriais quando disponiveis.",
    infoBox: "Monitoramento metabolico trimestral em uso de antipsicoticos. Pontuacao alta = maior risco metabolico. Nao e diagnostico.",
    labels: ["Ausente", "Leve", "Moderado", "Intenso"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "Risco metabolico (0-48)",
    bands: [
      { minPct: 0, classification: "Sem efeitos relevantes", color: "emerald", description: "Sem efeitos clinicamente relevantes. Manter vigilancia de rotina." },
      { minPct: 20, classification: "Efeitos leves", color: "amber", description: "Efeitos leves ou ocasionais. Registre e acompanhe tendencia." },
      { minPct: 40, classification: "Efeitos moderados - ponderar", color: "orange", description: "Efeitos relevantes. Considere dose, tempo de uso e comorbidades." },
      { minPct: 65, classification: "Efeitos importantes - revisar", color: "red", description: "Carga alta de efeitos. Revisao medicamentosa e plano de seguranca." },
    ],
    domains: [
      {
        name: "Peso e composicao corporal",
        color: "text-orange-600 dark:text-orange-400",
        items: [
          "Ganho de peso acima do esperado para a faixa etaria",
          "IMC em sobrepeso ou obesidade",
          "Aumento visivel de circunferencia abdominal",
          "Apetite muito aumentado (hiperfagia)",
        ],
      },
      {
        name: "Metabolismo e laboratorio",
        color: "text-red-600 dark:text-red-400",
        items: [
          "Glicemia de jejum acima do normal",
          "Triglicerides ou colesterol alterados",
          "Pressao arterial elevada para a idade",
          "Sinais de resistencia a insulina (acanthosis)",
          "Hormonio prolatico elevado nos exames",
        ],
      },
      {
        name: "Movimento e neurologico",
        color: "text-violet-600 dark:text-violet-400",
        items: [
          "Rigidez ou lentidao de movimentos (parkinsonismo)",
          "Inquietacao ou necessidade de ficar se movendo (acatisia)",
          "Movimentos involuntarios da face ou lingua",
          "Sonolencia intensa durante o dia",
          "Espasmo agudo de musculo (distonia aguda)",
        ],
      },
    ],
  },

  // ── j26-202 — Polifarmácia Risco Pediátrico ──
  "j26-202": {
    instruction: "Avalie o risco de polifarmacia nesta crianca. Marque o que esta presente ou identificado na revisao medicamentosa.",
    infoBox: "Avaliacao de risco de polifarmacia em criancas com multimorbidade. Pontuacao alta = maior risco. Nao e diagnostico.",
    labels: ["Ausente", "Leve", "Moderado", "Intenso"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "Risco de polifarmacia (0-60)",
    bands: [
      { minPct: 0, classification: "Sem efeitos relevantes", color: "emerald", description: "Sem efeitos clinicamente relevantes. Manter vigilancia de rotina." },
      { minPct: 20, classification: "Efeitos leves", color: "amber", description: "Efeitos leves ou ocasionais. Registre e acompanhe tendencia." },
      { minPct: 40, classification: "Efeitos moderados - ponderar", color: "orange", description: "Efeitos relevantes. Considere dose, tempo de uso e comorbidades." },
      { minPct: 65, classification: "Efeitos importantes - revisar", color: "red", description: "Carga alta de efeitos. Revisao medicamentosa e plano de seguranca." },
    ],
    domains: [
      {
        name: "Perfil da prescricao",
        color: "text-violet-600 dark:text-violet-400",
        items: [
          "Usa 3 ou mais medicacoes de forma continua",
          "Ha remedios com indicacao questionavel ou desatualizada",
          "Dois ou mais remedios tem mecanismo de acao sobreposto",
          "Ha remedio sendo usado para tratar efeito colateral de outro",
          "Algum remedio nao tem dose ajustada para o peso atual",
          "Ha remedios de prescricao recente sem avaliacao das interacoes",
        ],
      },
      {
        name: "Risco de interacao",
        color: "text-red-600 dark:text-red-400",
        items: [
          "Ha combinacao com risco de prolongamento do QT",
          "Ha combinacao que aumenta o risco de sangramento ou hematoligico",
          "Ha combinacao com potencial de hepatotoxicidade aditiva",
          "Ha interacao que reduz a eficacia de um dos remedios",
          "Ha interacao que aumenta o nivel serico de um dos remedios",
          "Ha combinacao com risco de sedacao excessiva ou depressao respiratoria",
        ],
      },
      {
        name: "Adesao e seguranca familiar",
        color: "text-orange-600 dark:text-orange-400",
        items: [
          "A familia tem dificuldade de controlar tantos horarios",
          "Houve erro de dose ou troca de remedio nos ultimos meses",
          "A familia nao sabe a indicacao de algum dos remedios",
          "Algum remedio precisa de monitorizacao laboratorial que nao esta sendo feita",
          "Ha risco de automedicacao ou uso de remedios de terceiros",
          "A familia nao sabe o que fazer em caso de reacao adversa",
          "Ha custo alto dificultando a adesao completa",
          "O beneficio do regime atual supera claramente os riscos",
        ],
      },
    ],
  },

  // ── j26-204 — Tiques Monitorização ──
  "j26-204": {
    instruction: "Marque a frequencia de cada aspecto dos tiques nas ultimas 4 semanas. Responda sobre o que voce observa no dia a dia.",
    infoBox: "Monitoramento da frequencia e impacto dos tiques. Pontuacao alta = maior carga de tiques. Nao e diagnostico.",
    labels: ["Nunca", "As vezes", "Frequentemente"],
    optionPoints: [0, 1, 2],
    scoreDirection: "higher_worse",
    totalLabel: "Carga de tiques (0-32)",
    bands: [
      { minPct: 0, classification: "Sem alteracao relevante", color: "emerald", description: "Baixa pontuacao. Manter vigilancia clinica de rotina." },
      { minPct: 25, classification: "Sinais leves", color: "amber", description: "Ha sinais leves ou ocasionais. Oriente observacao e reavalie." },
      { minPct: 45, classification: "Sinais moderados", color: "orange", description: "Sinais relevantes presentes. Correlacione com historia e exame clinico." },
      { minPct: 67, classification: "Alteracao importante", color: "red", description: "Escore elevado. Avalie risco funcional e necessidade de intervencao." },
    ],
    domains: [
      {
        name: "Frequencia e tipos",
        color: "text-violet-600 dark:text-violet-400",
        items: [
          "Tem tiques motores simples (piscar, encolher ombro, careta)",
          "Tem tiques motores complexos (sequencias de movimentos)",
          "Tem tiques vocais simples (tosse, fungada, ruido)",
          "Tem tiques vocais complexos (palavras, frases)",
          "Os tiques aparecem varios vezes por dia",
          "Os tiques pioram com estresse, cansaco ou excitacao",
          "Os tiques pioram com o retorno da escola ou provas",
          "Apareceram novos tipos de tiques desde a ultima consulta",
        ],
      },
      {
        name: "Impacto funcional",
        color: "text-orange-600 dark:text-orange-400",
        items: [
          "Os tiques causam constrangimento social",
          "Os tiques atrapalham a concentracao na escola",
          "Outras criancas perguntam ou zombam dos tiques",
          "A crianca tenta suprimir os tiques com esforco",
          "Os tiques causam dor ou desconforto fisico",
          "Os tiques provocam conflito em casa ou na escola",
          "Ha impacto na autoestima por causa dos tiques",
          "Os tiques estao piores do que no retorno anterior",
        ],
      },
    ],
  },

  // ── j26-206 — Irmão Criança com NEE ──
  "j26-206": {
    instruction: "Marque o que voce observa no irmao/irma da crianca com necessidades especiais. Responda sobre as ultimas semanas.",
    infoBox: "Avaliacao do impacto nos irmaos de criancas com NEE. Pontuacao alta = maior impacto emocional. Nao e diagnostico.",
    labels: ["Nunca", "As vezes", "Frequentemente"],
    optionPoints: [0, 1, 2],
    scoreDirection: "higher_worse",
    totalLabel: "Impacto no irmao (0-28)",
    bands: [
      { minPct: 0, classification: "Sem alteracao relevante", color: "emerald", description: "Baixa pontuacao. Manter vigilancia clinica de rotina." },
      { minPct: 25, classification: "Sinais leves", color: "amber", description: "Ha sinais leves ou ocasionais. Oriente observacao e reavalie." },
      { minPct: 45, classification: "Sinais moderados", color: "orange", description: "Sinais relevantes presentes. Correlacione com historia e exame clinico." },
      { minPct: 67, classification: "Alteracao importante", color: "red", description: "Escore elevado. Avalie risco funcional e necessidade de intervencao." },
    ],
    domains: [
      {
        name: "Emocional e social",
        color: "text-pink-600 dark:text-pink-400",
        items: [
          "Demonstra ciume ou ressentimento pelo irmao com NEE",
          "Fica triste ou chora por se sentir negligenciado",
          "Tem dificuldade de trazer amigos em casa por vergonha",
          "Demonstra ansiedade ou preocupacao excessiva com o irmao",
          "Tem dificuldade de falar sobre a condicao do irmao",
          "Sente que precisa ser bom demais para nao dar trabalho",
        ],
      },
      {
        name: "Comportamento e escola",
        color: "text-orange-600 dark:text-orange-400",
        items: [
          "Apresenta quedas no desempenho escolar",
          "Tem comportamento mais agitado ou agressivo em casa",
          "Se isola ou fica retraido",
          "Mostra comportamentos regressivos (choro excessivo, xixi na cama)",
          "Tem dificuldade de dormir ou de manter rotinas",
          "Quer mais atencao dos pais de forma exagerada",
          "Questiona por que o irmao e diferente",
          "No geral, parece impactado pela situacao do irmao",
        ],
      },
    ],
  },

  // ── j26-207 — Privação Social e Negligência ──
  "j26-207": {
    instruction: "Avalie o contexto ambiental desta crianca. Marque o que esta presente ou ausente no ambiente de desenvolvimento dela.",
    infoBox: "Triagem de privacao ambiental e negligencia como causa de atraso. Pontuacao alta = maior risco ambiental. Nao e diagnostico.",
    labels: ["Nunca", "As vezes", "Frequentemente"],
    optionPoints: [0, 1, 2],
    scoreDirection: "higher_worse",
    totalLabel: "Risco ambiental (0-28)",
    bands: [
      { minPct: 0, classification: "Sem alteracao relevante", color: "emerald", description: "Baixa pontuacao. Manter vigilancia clinica de rotina." },
      { minPct: 25, classification: "Sinais leves", color: "amber", description: "Ha sinais leves ou ocasionais. Oriente observacao e reavalie." },
      { minPct: 45, classification: "Sinais moderados", color: "orange", description: "Sinais relevantes presentes. Correlacione com historia e exame clinico." },
      { minPct: 67, classification: "Alteracao importante", color: "red", description: "Escore elevado. Avalie risco funcional e necessidade de intervencao." },
    ],
    domains: [
      {
        name: "Estimulacao e vinculo",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          "O cuidador principal raramente conversa ou brinca com a crianca",
          "Nao ha brinquedos ou livros em casa",
          "A crianca fica sozinha ou na frente da TV por longos periodos",
          "Nao ha rotinas de horario de dormir, comer ou brincar",
          "O cuidador demonstra pouca responsividade aos sinais da crianca",
          "Ha sinais de depressao ou disturbio mental grave no cuidador",
          "A crianca tem pouco contato com outras criancas ou adultos externos",
        ],
      },
      {
        name: "Seguranca e necessidades basicas",
        color: "text-red-600 dark:text-red-400",
        items: [
          "A crianca aparece com fome, suja ou mal vestida nas consultas",
          "Ha relato ou suspeita de uso de alcool/drogas pelo cuidador",
          "Ha violencia domestica no ambiente da crianca",
          "A crianca apresenta lesoes inexplicadas ou frequentes",
          "Os consultas e vacinacoes estao muito atrasadas sem justificativa",
          "Ha mudancas frequentes de casa ou cuidador",
          "O cuidador demonstra desinteresse ou hostilidade pela crianca",
        ],
      },
    ],
  },

  // ── j26-212 — Comportamentos Restritivos TEA Baseline vs Atual ──
  "j26-212": {
    instruction: "Marque a frequencia atual de cada comportamento comparando com quando o tratamento comecou. Responda sobre as ultimas 2 semanas.",
    infoBox: "Comparacao temporal de comportamentos restritivos e repetitivos no TEA. Pontuacao alta = maior carga de CRR. Nao e diagnostico.",
    labels: ["Nunca", "As vezes", "Frequentemente"],
    optionPoints: [0, 1, 2],
    scoreDirection: "higher_worse",
    totalLabel: "Comportamentos restritivos/repetitivos (0-32)",
    bands: [
      { minPct: 0, classification: "Sem alteracao relevante", color: "emerald", description: "Baixa pontuacao. Manter vigilancia clinica de rotina." },
      { minPct: 25, classification: "Sinais leves", color: "amber", description: "Ha sinais leves ou ocasionais. Oriente observacao e reavalie." },
      { minPct: 45, classification: "Sinais moderados", color: "orange", description: "Sinais relevantes presentes. Correlacione com historia e exame clinico." },
      { minPct: 67, classification: "Alteracao importante", color: "red", description: "Escore elevado. Avalie risco funcional e necessidade de intervencao." },
    ],
    domains: [
      {
        name: "Estereotipias e automovimentos",
        color: "text-violet-600 dark:text-violet-400",
        items: [
          "Faz movimentos repetitivos das maos (flapping, rodar)",
          "Balanca o corpo de forma repetitiva",
          "Faz sons ou vocalizacoes repetitivas sem finalidade comunicativa",
          "Enfileira ou organiza objetos de forma rigida",
          "Gira ou manipula objetos de forma estereotipada",
          "Olha para luz ou objetos que giram de forma intensa",
        ],
      },
      {
        name: "Insistencia e interesses restritos",
        color: "text-orange-600 dark:text-orange-400",
        items: [
          "Fica muito perturbado quando a rotina muda",
          "Insiste em percursos, sequencias ou rituais fixos",
          "Tem interesse muito restrito e absorcao intensa em 1 tema",
          "Recusa fortemente novos alimentos, roupas ou ambientes",
          "Fica agitado ou em crise quando nao pode fazer do jeito dele",
          "As estereotipias ou CRR estao piores que no retorno anterior",
          "Os CRR interferem nas atividades e na inclusao social",
          "Houve melhora geral nos CRR desde o inicio do tratamento",
        ],
      },
    ],
  },

  // ── j26-214 — Integração Sensorial TEA Pós-TO ──
  "j26-214": {
    instruction: "Marque a frequencia de cada reacao sensorial observada na crianca. Responda sobre as ultimas 2 semanas, comparando com o inicio da terapia ocupacional.",
    infoBox: "Avaliacao da integracao sensorial no TEA apos intervencao de TO. Pontuacao alta = maior disfuncao sensorial. Nao e diagnostico.",
    labels: ["Nunca", "As vezes", "Frequentemente"],
    optionPoints: [0, 1, 2],
    scoreDirection: "higher_worse",
    totalLabel: "Disfuncao de integracao sensorial (0-32)",
    bands: [
      { minPct: 0, classification: "Sem alteracao relevante", color: "emerald", description: "Baixa pontuacao. Manter vigilancia clinica de rotina." },
      { minPct: 25, classification: "Sinais leves", color: "amber", description: "Ha sinais leves ou ocasionais. Oriente observacao e reavalie." },
      { minPct: 45, classification: "Sinais moderados", color: "orange", description: "Sinais relevantes presentes. Correlacione com historia e exame clinico." },
      { minPct: 67, classification: "Alteracao importante", color: "red", description: "Escore elevado. Avalie risco funcional e necessidade de intervencao." },
    ],
    domains: [
      {
        name: "Hipersensibilidade",
        color: "text-red-600 dark:text-red-400",
        items: [
          "Reage de forma intensa a toques leves (etiquetas, textura de roupa)",
          "Tapa os ouvidos ou foge de sons do cotidiano",
          "Evita luz forte ou fica perturbado com brilho",
          "Reage exageradamente a cheiros comuns",
          "Recusa texturas de alimentos de forma intensa",
          "Reage com choro ou fuga a ambientes movimentados",
        ],
      },
      {
        name: "Hipossensibilidade e busca sensorial",
        color: "text-orange-600 dark:text-orange-400",
        items: [
          "Busca estimulacao intensa: gira, pula, se joga",
          "Nao percebe dor ou temperatura de forma adequada",
          "Coloca objetos na boca ou lambe superficies",
          "Precisa de estimulacao vestibular intensa para se regular",
          "Tem baixo limiar de perceber onde esta o proprio corpo",
          "A integracao sensorial esta melhor que no inicio da TO",
          "As reacoes sensoriais ainda interferem na rotina e na escola",
          "A TO esta sendo efetiva na reducao das disfuncoes sensoriais",
        ],
      },
    ],
  },

  // ── j26-215 — Crises de Desregulação TEA Antes vs Depois ──
  "j26-215": {
    instruction: "Marque a frequencia de cada aspecto das crises de desregulacao emocional no ultimo mes. Compare com o mes anterior.",
    infoBox: "Registro comparativo de crises de desregulacao no TEA. Pontuacao alta = maior frequencia e intensidade de crises. Nao e diagnostico.",
    labels: ["Nunca", "As vezes", "Frequentemente"],
    optionPoints: [0, 1, 2],
    scoreDirection: "higher_worse",
    totalLabel: "Frequencia e impacto das crises (0-24)",
    bands: [
      { minPct: 0, classification: "Sem alteracao relevante", color: "emerald", description: "Baixa pontuacao. Manter vigilancia clinica de rotina." },
      { minPct: 25, classification: "Sinais leves", color: "amber", description: "Ha sinais leves ou ocasionais. Oriente observacao e reavalie." },
      { minPct: 45, classification: "Sinais moderados", color: "orange", description: "Sinais relevantes presentes. Correlacione com historia e exame clinico." },
      { minPct: 67, classification: "Alteracao importante", color: "red", description: "Escore elevado. Avalie risco funcional e necessidade de intervencao." },
    ],
    domains: [
      {
        name: "Frequencia e gatilhos",
        color: "text-orange-600 dark:text-orange-400",
        items: [
          "Tem crise 3 ou mais vezes por semana",
          "As crises sao desencadeadas por mudancas de rotina",
          "As crises sao desencadeadas por negativa ou frustacao",
          "As crises sao desencadeadas por estimulos sensoriais",
          "As crises acontecem principalmente na escola ou em ambientes novos",
          "As crises estao mais frequentes do que no mes anterior",
        ],
      },
      {
        name: "Intensidade e recuperacao",
        color: "text-red-600 dark:text-red-400",
        items: [
          "As crises duram mais de 30 minutos",
          "Ha agressividade a si proprio ou a outros durante a crise",
          "A crianca tem dificuldade de se recuperar sozinha",
          "A crise afeta a rotina inteira do dia em que acontece",
          "A familia nao consegue manejar as crises em casa",
          "As crises estao mais intensas do que antes do tratamento",
          "A crianca reconhece e comunica quando esta prestes a entrar em crise",
          "As crises diminuiram em frequencia e intensidade desde o inicio do tratamento",
        ],
      },
    ],
  },

  // ── j26-219 — SNAP-IV Monitorização TDAH ──
  "j26-219": {
    instruction: "Marque a frequencia de cada comportamento observado na crianca nas ultimas 2 semanas. Responda com base no que realmente acontece em casa ou na escola.",
    infoBox: "Monitoramento comparativo pre e pos-medicacao no TDAH (estrutura tipo SNAP-IV). Pontuacao alta = maior carga de sintomas. Nao e diagnostico.",
    labels: ["Nunca", "As vezes", "Frequentemente"],
    optionPoints: [0, 1, 2],
    scoreDirection: "higher_worse",
    totalLabel: "Carga de sintomas TDAH (0-36)",
    bands: [
      { minPct: 0, classification: "Sem alteracao relevante", color: "emerald", description: "Baixa pontuacao. Manter vigilancia clinica de rotina." },
      { minPct: 25, classification: "Sinais leves", color: "amber", description: "Ha sinais leves ou ocasionais. Oriente observacao e reavalie." },
      { minPct: 45, classification: "Sinais moderados", color: "orange", description: "Sinais relevantes presentes. Correlacione com historia e exame clinico." },
      { minPct: 67, classification: "Alteracao importante", color: "red", description: "Escore elevado. Avalie risco funcional e necessidade de intervencao." },
    ],
    domains: [
      {
        name: "Desatencao",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          "Nao presta atencao em detalhes ou comete erros por descuido",
          "Tem dificuldade de manter atencao em tarefas longas",
          "Parece nao ouvir quando falam diretamente com ela",
          "Nao termina tarefas que comecou",
          "Tem dificuldade de organizar tarefas e materiais",
          "Evita tarefas que exigem esforco mental continuo",
        ],
      },
      {
        name: "Hiperatividade",
        color: "text-orange-600 dark:text-orange-400",
        items: [
          "Mexe as maos ou os pes ou se remexe na cadeira",
          "Levanta da cadeira quando deveria ficar sentado",
          "Corre ou sobe em coisas em momentos inapropriados",
          "Tem dificuldade de brincar ou fazer atividades em silencio",
          "Fala demais",
          "Age como se estivesse com um motor ligado",
        ],
      },
      {
        name: "Impulsividade",
        color: "text-red-600 dark:text-red-400",
        items: [
          "Responde antes de terminar a pergunta",
          "Tem dificuldade de esperar a vez",
          "Interrompe ou se intromete nas conversas ou brincadeiras",
          "Age sem pensar nas consequencias",
          "Tem explosoes de raiva ou impaciencia",
          "Os sintomas estao piores do que no retorno anterior",
        ],
      },
    ],
  },

  // ── j26-222 — Efeitos do Metilfenidato/Lisdexanfetamina ──
  "j26-222": {
    instruction: "Marque a intensidade dos efeitos observados na crianca. Avalie tanto a eficacia (itens de melhora) quanto os efeitos colaterais.",
    infoBox: "Monitoramento de eficacia e efeitos dos estimulantes no TDAH. Para efeitos: pontuacao alta = maior carga. Para eficacia: veja dominios separados. Nao e diagnostico.",
    labels: ["Ausente", "Leve", "Moderado", "Intenso"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "Carga de efeitos colaterais do estimulante (0-48)",
    bands: [
      { minPct: 0, classification: "Sem efeitos relevantes", color: "emerald", description: "Sem efeitos clinicamente relevantes. Manter vigilancia de rotina." },
      { minPct: 20, classification: "Efeitos leves", color: "amber", description: "Efeitos leves ou ocasionais. Registre e acompanhe tendencia." },
      { minPct: 40, classification: "Efeitos moderados - ponderar", color: "orange", description: "Efeitos relevantes. Considere dose, tempo de uso e comorbidades." },
      { minPct: 65, classification: "Efeitos importantes - revisar", color: "red", description: "Carga alta de efeitos. Revisao medicamentosa e plano de seguranca." },
    ],
    domains: [
      {
        name: "Apetite e crescimento",
        color: "text-orange-600 dark:text-orange-400",
        items: [
          "Reducao do apetite durante o dia",
          "Perda ou nao ganho de peso adequado",
          "Crescimento abaixo do esperado para a faixa etaria",
          "Queixa de dor abdominal ou nausea",
        ],
      },
      {
        name: "Sono",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          "Dificuldade de adormecer no horario habitual",
          "Sono mais superficial ou com mais despertes",
          "Irritabilidade matinal ao acordar",
          "Sonolencia diurna excessiva (paradoxal)",
        ],
      },
      {
        name: "Humor e comportamento",
        color: "text-violet-600 dark:text-violet-400",
        items: [
          "Irritabilidade ou choro no fim do efeito (rebound)",
          "Ansiedade ou agitacao durante o efeito",
          "Piora ou aparecimento de tiques",
          "Comportamento robotico ou muito retraido",
          "Queixa de coracao acelerado ou desconforto toracico",
          "Pressao arterial elevada para a faixa etaria",
          "Os efeitos colaterais estao piores que no retorno anterior",
          "A eficacia justifica os efeitos colaterais atuais",
        ],
      },
    ],
  },

  // ── j26-224 — Sono e Apetite TDAH Tratamento ──
  "j26-224": {
    instruction: "Marque a intensidade de cada aspecto relacionado ao sono e ao apetite da crianca nas ultimas 2 semanas. Responda sobre o que esta acontecendo com o uso do estimulante.",
    infoBox: "Monitoramento de sono e apetite em uso de estimulantes no TDAH. Pontuacao alta = maior impacto. Nao e diagnostico.",
    labels: ["Ausente", "Leve", "Moderado", "Intenso"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "Impacto em sono e apetite (0-36)",
    bands: [
      { minPct: 0, classification: "Sem efeitos relevantes", color: "emerald", description: "Sem efeitos clinicamente relevantes. Manter vigilancia de rotina." },
      { minPct: 20, classification: "Efeitos leves", color: "amber", description: "Efeitos leves ou ocasionais. Registre e acompanhe tendencia." },
      { minPct: 40, classification: "Efeitos moderados - ponderar", color: "orange", description: "Efeitos relevantes. Considere dose, tempo de uso e comorbidades." },
      { minPct: 65, classification: "Efeitos importantes - revisar", color: "red", description: "Carga alta de efeitos. Revisao medicamentosa e plano de seguranca." },
    ],
    domains: [
      {
        name: "Sono",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          "Demora mais de 30 minutos para adormecer",
          "Acorda durante a noite",
          "Sono mais curto do que antes do remedio",
          "Irritabilidade pela manha por sono ruim",
          "Pesadelos ou sono agitado mais frequentes",
          "O sono esta pior do que antes de iniciar o estimulante",
        ],
      },
      {
        name: "Apetite e peso",
        color: "text-orange-600 dark:text-orange-400",
        items: [
          "Come muito pouco no almoco e jantar",
          "Sente fome apenas a noite (rebound do apetite)",
          "Perdeu peso desde o ultimo retorno",
          "Pais preocupados com o crescimento ou o peso",
          "Recusa refeicoes por falta de fome",
          "O apetite esta pior do que antes de iniciar o estimulante",
        ],
      },
    ],
  },

  // ── j26-227 — Diário de Frequência de Crises Epilepsia ──
  "j26-227": {
    instruction: "Registre as crises do ultimo mes. Marque a frequencia de cada aspecto que voce observou ou que aconteceu.",
    infoBox: "Diario comparativo de crises epilepticas. Pontuacao alta = maior frequencia e impacto. Nao e diagnostico.",
    labels: ["Nunca", "As vezes", "Frequentemente"],
    optionPoints: [0, 1, 2],
    scoreDirection: "higher_worse",
    totalLabel: "Frequencia e impacto das crises (0-30)",
    bands: [
      { minPct: 0, classification: "Sem alteracao relevante", color: "emerald", description: "Baixa pontuacao. Manter vigilancia clinica de rotina." },
      { minPct: 25, classification: "Sinais leves", color: "amber", description: "Ha sinais leves ou ocasionais. Oriente observacao e reavalie." },
      { minPct: 45, classification: "Sinais moderados", color: "orange", description: "Sinais relevantes presentes. Correlacione com historia e exame clinico." },
      { minPct: 67, classification: "Alteracao importante", color: "red", description: "Escore elevado. Avalie risco funcional e necessidade de intervencao." },
    ],
    domains: [
      {
        name: "Frequencia e tipo de crise",
        color: "text-red-600 dark:text-red-400",
        items: [
          "Teve crise este mes",
          "Teve mais de 4 crises no mes",
          "As crises estao mais frequentes que no mes anterior",
          "Apareceu um tipo novo de crise",
          "Teve crise tonico-clonica generalizada",
          "Teve crise de mais de 5 minutos (risco de estado)",
          "Precisou usar medicacao de resgate (diazepam, midazolam)",
        ],
      },
      {
        name: "Gatilhos e pos-crise",
        color: "text-orange-600 dark:text-orange-400",
        items: [
          "As crises ocorreram no sono ou ao despertar",
          "Houve gatilho identificado (febre, privacao de sono, estresse)",
          "Recuperacao pos-crise foi lenta (mais de 30 min)",
          "Ficou muito sonolento ou confuso depois da crise",
          "A crise causou queda ou machucado",
          "A crise aconteceu em local de risco (agua, via publica)",
          "Os pais ficaram muito assustados e inseguros no manejo",
          "As crises estao controladas comparado ao mes anterior",
        ],
      },
    ],
  },

  // ── j26-228 — Efeitos de Antiepilépticos Monitorização ──
  "j26-228": {
    instruction: "Marque a intensidade de cada efeito observado desde o ultimo retorno. Avalie tanto a eficacia quanto os efeitos colaterais.",
    infoBox: "Monitoramento de eficacia e efeitos dos antiepileticos. Pontuacao alta = maior carga de efeitos. Nao e diagnostico.",
    labels: ["Ausente", "Leve", "Moderado", "Intenso"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "Carga de efeitos dos antiepileticos (0-60)",
    bands: [
      { minPct: 0, classification: "Sem efeitos relevantes", color: "emerald", description: "Sem efeitos clinicamente relevantes. Manter vigilancia de rotina." },
      { minPct: 20, classification: "Efeitos leves", color: "amber", description: "Efeitos leves ou ocasionais. Registre e acompanhe tendencia." },
      { minPct: 40, classification: "Efeitos moderados - ponderar", color: "orange", description: "Efeitos relevantes. Considere dose, tempo de uso e comorbidades." },
      { minPct: 65, classification: "Efeitos importantes - revisar", color: "red", description: "Carga alta de efeitos. Revisao medicamentosa e plano de seguranca." },
    ],
    domains: [
      {
        name: "Neurologico e cognitivo",
        color: "text-violet-600 dark:text-violet-400",
        items: [
          "Sonolencia excessiva durante o dia",
          "Tontura ou instabilidade de marcha",
          "Lentidao de raciocinio ou confusao",
          "Piora da memoria ou da atencao",
          "Dor de cabeca frequente",
          "Visao dupla ou borrada",
        ],
      },
      {
        name: "Comportamental e psiquiatrico",
        color: "text-orange-600 dark:text-orange-400",
        items: [
          "Irritabilidade ou agressividade",
          "Humor deprimido ou choro facil",
          "Ansiedade aumentada",
          "Pensamentos ou comportamentos incomuns",
          "Agitacao ou insonia",
        ],
      },
      {
        name: "Sistemico e laboratorial",
        color: "text-red-600 dark:text-red-400",
        items: [
          "Ganho excessivo de peso (valproato)",
          "Perda de peso ou reducao de apetite",
          "Erupcao cutanea ou reacao alergica",
          "Queda de cabelo",
          "Alteracao nos exames de sangue (fado, leucocitos, plaquetas)",
          "Sintomas gastrointestinais (nausea, dor abdominal)",
          "Os efeitos colaterais valem o controle de crises obtido",
          "Os efeitos colaterais estao piores que no retorno anterior",
        ],
      },
    ],
  },

  // ── j26-229 — Evolução Cognitiva Epilepsia ──
  "j26-229": {
    instruction: "Marque o que voce observa em relacao a cognicao e ao aprendizado da crianca nas ultimas semanas. Compare com o semestre anterior.",
    infoBox: "Monitoramento do impacto da epilepsia na cognicao. Pontuacao alta = maior impacto cognitivo. Nao e diagnostico.",
    labels: ["Nunca", "As vezes", "Frequentemente"],
    optionPoints: [0, 1, 2],
    scoreDirection: "higher_worse",
    totalLabel: "Impacto cognitivo da epilepsia (0-30)",
    bands: [
      { minPct: 0, classification: "Sem alteracao relevante", color: "emerald", description: "Baixa pontuacao. Manter vigilancia clinica de rotina." },
      { minPct: 25, classification: "Sinais leves", color: "amber", description: "Ha sinais leves ou ocasionais. Oriente observacao e reavalie." },
      { minPct: 45, classification: "Sinais moderados", color: "orange", description: "Sinais relevantes presentes. Correlacione com historia e exame clinico." },
      { minPct: 67, classification: "Alteracao importante", color: "red", description: "Escore elevado. Avalie risco funcional e necessidade de intervencao." },
    ],
    domains: [
      {
        name: "Memoria e atencao",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          "Esquece coisas que aprendeu recentemente",
          "Tem dificuldade de manter atencao em atividades longas",
          "Perde o fio da conversa ou esquece o que ia falar",
          "Tem dificuldade de aprender conteudos novos na escola",
          "Demora mais que antes para processar informacoes",
        ],
      },
      {
        name: "Linguagem e desempenho escolar",
        color: "text-teal-600 dark:text-teal-400",
        items: [
          "Tem mais dificuldade de encontrar palavras (anomia)",
          "As notas na escola caíram desde o inicio do tratamento",
          "O professor reportou piora de desempenho",
          "Tem dificuldade de leitura ou escrita que nao tinha antes",
          "A cognicao esta pior do que antes de comecar o antiepiletico",
          "A cognicao esta pior do que no semestre anterior",
          "Ha suspeita de encefalopatia epileptica sub-clinica",
          "A cognicao esta estavel ou melhorou com o controle de crises",
        ],
      },
    ],
  },

  // ── j26-230 — Qualidade de Vida Epilepsia Semestral ──
  "j26-230": {
    instruction: "Marque a frequencia de cada aspecto relacionado a qualidade de vida da crianca com epilepsia. Responda sobre as ultimas semanas.",
    infoBox: "Avaliacao semestral de qualidade de vida na epilepsia. Pontuacao alta = maior impacto na QV. Nao e diagnostico.",
    labels: ["Nunca", "As vezes", "Frequentemente"],
    optionPoints: [0, 1, 2],
    scoreDirection: "higher_worse",
    totalLabel: "Impacto na qualidade de vida (0-36)",
    bands: [
      { minPct: 0, classification: "Sem alteracao relevante", color: "emerald", description: "Baixa pontuacao. Manter vigilancia clinica de rotina." },
      { minPct: 25, classification: "Sinais leves", color: "amber", description: "Ha sinais leves ou ocasionais. Oriente observacao e reavalie." },
      { minPct: 45, classification: "Sinais moderados", color: "orange", description: "Sinais relevantes presentes. Correlacione com historia e exame clinico." },
      { minPct: 67, classification: "Alteracao importante", color: "red", description: "Escore elevado. Avalie risco funcional e necessidade de intervencao." },
    ],
    domains: [
      {
        name: "Social e escolar",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          "Evita atividades por medo de ter uma crise",
          "Se sente diferente ou estigmatizado pelos colegas",
          "Tem dificuldade de participar de esportes ou passeios",
          "O desempenho escolar foi afetado pela epilepsia",
          "Evita contar para outras pessoas que tem epilepsia",
          "Fica ansioso sobre quando a proxima crise vai acontecer",
        ],
      },
      {
        name: "Emocional e familiar",
        color: "text-violet-600 dark:text-violet-400",
        items: [
          "Sente medo ou angustia relacionada as crises",
          "Ha impacto emocional relevante na vida da familia",
          "Os pais restringem excessivamente as atividades por medo",
          "A crianca demonstra tristeza ou humor deprimido",
          "Ha restricao de autonomia por causa da epilepsia",
          "A qualidade de vida esta pior que 6 meses atras",
          "O estigma ou a restricao social piorou neste semestre",
          "A qualidade de vida esta boa apesar da epilepsia",
        ],
      },
    ],
  },

  // ── j26-231 — Adesão Medicamentosa Epilepsia ──
  "j26-231": {
    instruction: "Marque a frequencia de cada situacao relacionada a tomada do remedio contra epilepsia. Responda com sinceridade — isso ajuda a entender o controle das crises.",
    infoBox: "Avaliacao de adesao medicamentosa na epilepsia. Pontuacao alta = pior adesao. Nao e diagnostico.",
    labels: ["Nunca", "As vezes", "Frequentemente"],
    optionPoints: [0, 1, 2],
    scoreDirection: "higher_worse",
    totalLabel: "Barreiras de adesao (0-24)",
    bands: [
      { minPct: 0, classification: "Sem alteracao relevante", color: "emerald", description: "Baixa pontuacao. Manter vigilancia clinica de rotina." },
      { minPct: 25, classification: "Sinais leves", color: "amber", description: "Ha sinais leves ou ocasionais. Oriente observacao e reavalie." },
      { minPct: 45, classification: "Sinais moderados", color: "orange", description: "Sinais relevantes presentes. Correlacione com historia e exame clinico." },
      { minPct: 67, classification: "Alteracao importante", color: "red", description: "Escore elevado. Avalie risco funcional e necessidade de intervencao." },
    ],
    domains: [
      {
        name: "Barreiras praticas",
        color: "text-orange-600 dark:text-orange-400",
        items: [
          "Esquece de dar o remedio no horario certo",
          "Tem dificuldade de dar o remedio (crianca cospe, recusa)",
          "O remedio acaba antes da hora de buscar",
          "Nao tem condicoes de comprar ou buscar o remedio",
          "Interrompe o remedio porque achou que a crianca estava bem",
          "Da doses erradas ou confunde os horarios",
        ],
      },
      {
        name: "Crencas e conhecimento",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          "Tem medo de que o remedio va prejudicar a crianca a longo prazo",
          "Para o remedio quando a crianca esta com febre ou doente",
          "Desconfia que o remedio nao esta fazendo efeito",
          "Julgou que nao precisava mais do remedio sem consultar o medico",
          "Ha crenca religiosa ou cultural que dificulta o uso continuo",
          "No geral, a adesao ao tratamento esta comprometida",
        ],
      },
    ],
  },

  // ── j26-232 — EEG Evolutivo Achados Sequenciais ──
  "j26-232": {
    instruction: "Registre os achados do EEG atual e compare com os anteriores. Marque o que esta presente neste exame.",
    infoBox: "Registro estruturado de EEG evolutivo na epilepsia. Pontuacao alta = maior carga de achados ictais/interictais. Nao e diagnostico.",
    labels: ["Ausente", "Leve", "Moderado", "Intenso"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "Carga de achados no EEG (0-48)",
    bands: [
      { minPct: 0, classification: "Sem alteracao relevante", color: "emerald", description: "Baixa pontuacao. Manter vigilancia clinica de rotina." },
      { minPct: 20, classification: "Efeitos leves", color: "amber", description: "Efeitos leves ou ocasionais. Registre e acompanhe tendencia." },
      { minPct: 40, classification: "Efeitos moderados - ponderar", color: "orange", description: "Efeitos relevantes. Considere dose, tempo de uso e comorbidades." },
      { minPct: 65, classification: "Efeitos importantes - revisar", color: "red", description: "Carga alta de efeitos. Revisao medicamentosa e plano de seguranca." },
    ],
    domains: [
      {
        name: "Atividade interictal",
        color: "text-violet-600 dark:text-violet-400",
        items: [
          "Presenca de pontas ou complexos ponta-onda interictais",
          "Atividade interictal mais frequente que no EEG anterior",
          "Descargas generalizadas",
          "Focos multifocais",
          "Atividade interictal em regioes epileptogenicas criticas",
          "Atividade interictal durante o sono",
        ],
      },
      {
        name: "Traçado de fundo e evolucao",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          "Lentificacao do ritmo de fundo",
          "Assimetria do traçado de fundo",
          "Ausencia de fuseau de sono adequados para a idade",
          "Traçado de fundo pior que no EEG anterior",
          "Ha evidencia de encefalopatia epileptica (ex: CSWS, ESES)",
          "Normalizacao do traçado em relacao ao exame anterior",
          "O EEG atual piora o prognostico em relacao ao anterior",
          "O EEG atual melhora ou mantem o padrao anterior",
        ],
      },
    ],
  },

  // ── j26-236 — Fluência Verbal Pós-Fonoterapia ──
  "j26-236": {
    instruction: "Marque a frequencia de cada aspecto da fala da crianca nas ultimas semanas. Responda sobre o que voce observa em conversas reais.",
    infoBox: "Monitoramento de fluencia verbal pos-fonoterapia em criancas com gagueira. Pontuacao alta = maior impacto da gagueira. Nao e diagnostico.",
    labels: ["Nunca", "As vezes", "Frequentemente"],
    optionPoints: [0, 1, 2],
    scoreDirection: "higher_worse",
    totalLabel: "Impacto da gagueira (0-24)",
    bands: [
      { minPct: 0, classification: "Sem alteracao relevante", color: "emerald", description: "Baixa pontuacao. Manter vigilancia clinica de rotina." },
      { minPct: 25, classification: "Sinais leves", color: "amber", description: "Ha sinais leves ou ocasionais. Oriente observacao e reavalie." },
      { minPct: 45, classification: "Sinais moderados", color: "orange", description: "Sinais relevantes presentes. Correlacione com historia e exame clinico." },
      { minPct: 67, classification: "Alteracao importante", color: "red", description: "Escore elevado. Avalie risco funcional e necessidade de intervencao." },
    ],
    domains: [
      {
        name: "Disfluencias e caracteristicas",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          "Repete sons, silabas ou palavras ao comecar a falar",
          "Prolonga sons nas palavras",
          "Tem bloqueios (trava e nao consegue emitir o som)",
          "Usa comportamentos secundarios (piscar, apertar labios)",
          "As disfluencias ocorrem mais em situacoes de pressao",
          "A gagueira esta mais frequente que no mes anterior",
        ],
      },
      {
        name: "Impacto emocional e comunicativo",
        color: "text-orange-600 dark:text-orange-400",
        items: [
          "Evita falar em certas situacoes (responder na aula, telefone)",
          "Demonstra vergonha ou ansiedade ao falar",
          "Troca palavras para evitar aquelas em que gagueja",
          "A gagueira afeta a interacao social e as amizades",
          "A gagueira esta pior do que antes de iniciar a fonoterapia",
          "A fonoterapia esta sendo efetiva na reducao das disfluencias",
        ],
      },
    ],
  },

  // ── j26-241 — Espasticidade Ashworth Sequencial ──
  "j26-241": {
    instruction: "Registre o nivel de espasticidade nos principais grupos musculares avaliados hoje. Compare com a avaliacao anterior.",
    infoBox: "Registro evolutivo de espasticidade (referencia Ashworth Modificada) na paralisia cerebral. Pontuacao alta = maior carga de espasticidade. Nao e diagnostico.",
    labels: ["Ausente", "Leve", "Moderado", "Intenso"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "Carga de espasticidade (0-60)",
    bands: [
      { minPct: 0, classification: "Sem efeitos relevantes", color: "emerald", description: "Sem efeitos clinicamente relevantes. Manter vigilancia de rotina." },
      { minPct: 20, classification: "Efeitos leves", color: "amber", description: "Efeitos leves ou ocasionais. Registre e acompanhe tendencia." },
      { minPct: 40, classification: "Efeitos moderados - ponderar", color: "orange", description: "Efeitos relevantes. Considere dose, tempo de uso e comorbidades." },
      { minPct: 65, classification: "Efeitos importantes - revisar", color: "red", description: "Carga alta de efeitos. Revisao medicamentosa e plano de seguranca." },
    ],
    domains: [
      {
        name: "Membros inferiores",
        color: "text-teal-600 dark:text-teal-400",
        items: [
          "Espasticidade dos adutores do quadril",
          "Espasticidade dos isquiotibiais (joelho)",
          "Espasticidade dos flexores plantares (tornozelo)",
          "Espasticidade dos extensores do quadril",
          "Espasticidade piora a marcha ou os posicionamentos",
          "Espasticidade causa dor ou desconforto evidente",
        ],
      },
      {
        name: "Membros superiores e evolucao",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          "Espasticidade dos flexores do cotovelo",
          "Espasticidade dos flexores do punho e dedos",
          "Espasticidade do ombro",
          "Espasticidade interfere no uso funcional das maos",
          "Espasticidade piora a higiene e o cuidado",
          "Espasticidade esta pior que na avaliacao anterior",
          "Ja foi feita aplicacao de toxina botulinica anteriormente",
          "A espasticidade responde ao tratamento fisioterapeutico atual",
        ],
      },
    ],
  },

  // ── j26-249 — Ansiedade Pós-Terapia Comparativo ──
  "j26-249": {
    instruction: "Marque a frequencia de cada sintoma de ansiedade nas ultimas 2 semanas. Compare com o inicio do tratamento.",
    infoBox: "Monitoramento de ansiedade pos-terapia (estrutura tipo SCARED/GAD-7). Pontuacao alta = maior carga de ansiedade. Nao e diagnostico.",
    labels: ["Nunca", "As vezes", "Frequentemente"],
    optionPoints: [0, 1, 2],
    scoreDirection: "higher_worse",
    totalLabel: "Carga de ansiedade (0-32)",
    bands: [
      { minPct: 0, classification: "Sem alteracao relevante", color: "emerald", description: "Baixa pontuacao. Manter vigilancia clinica de rotina." },
      { minPct: 25, classification: "Sinais leves", color: "amber", description: "Ha sinais leves ou ocasionais. Oriente observacao e reavalie." },
      { minPct: 45, classification: "Sinais moderados", color: "orange", description: "Sinais relevantes presentes. Correlacione com historia e exame clinico." },
      { minPct: 67, classification: "Alteracao importante", color: "red", description: "Escore elevado. Avalie risco funcional e necessidade de intervencao." },
    ],
    domains: [
      {
        name: "Sintomas fisicos e somaticos",
        color: "text-orange-600 dark:text-orange-400",
        items: [
          "Queixas fisicas sem causa medica (dor de barriga, dor de cabeca antes da escola)",
          "Coracao acelerado ou falta de ar em situacoes de pressao",
          "Tensao muscular ou agitacao fisica",
          "Dificuldade de dormir por preocupacao",
        ],
      },
      {
        name: "Sintomas cognitivos e comportamentais",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          "Preocupacao excessiva com situacoes do cotidiano",
          "Medo intenso de situacoes especificas (escola, social, saude)",
          "Evita situacoes que causam ansiedade",
          "Precisa de muita reassurance dos pais para se acalmar",
          "Os sintomas de ansiedade estao melhores que no inicio do tratamento",
          "A ansiedade ainda interfere na escola ou nas relacoes sociais",
          "Houve recaida ou piora recente dos sintomas de ansiedade",
          "A resposta ao tratamento esta sendo satisfatoria",
        ],
      },
    ],
  },

  // ── j26-250 — Depressão CDI-2/PHQ-A Sequencial ──
  "j26-250": {
    instruction: "Marque a frequencia de cada sintoma nas ultimas 2 semanas. Responda com base no que voce realmente sente ou observa.",
    infoBox: "Monitoramento sequencial de sintomas depressivos (estrutura CDI-2/PHQ-A). Pontuacao alta = maior carga de depressao. Nao e diagnostico.",
    labels: ["Nunca", "As vezes", "Frequentemente"],
    optionPoints: [0, 1, 2],
    scoreDirection: "higher_worse",
    totalLabel: "Carga de sintomas depressivos (0-36)",
    bands: [
      { minPct: 0, classification: "Sem alteracao relevante", color: "emerald", description: "Baixa pontuacao. Manter vigilancia clinica de rotina." },
      { minPct: 25, classification: "Sinais leves", color: "amber", description: "Ha sinais leves ou ocasionais. Oriente observacao e reavalie." },
      { minPct: 45, classification: "Sinais moderados", color: "orange", description: "Sinais relevantes presentes. Correlacione com historia e exame clinico." },
      { minPct: 67, classification: "Alteracao importante", color: "red", description: "Escore elevado. Avalie risco funcional e necessidade de intervencao." },
    ],
    domains: [
      {
        name: "Humor e anedonia",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          "Sentiu tristeza, vazio ou sem esperanca",
          "Perdeu interesse em atividades que antes gostava",
          "Sentiu que nao vale nada ou que e um fardo",
          "Sentiu culpa excessiva ou se autoculpou",
          "Sentiu que a vida nao tem sentido",
          "Pensou em se machucar ou desaparecer",
        ],
      },
      {
        name: "Fisico e funcional",
        color: "text-violet-600 dark:text-violet-400",
        items: [
          "Ficou muito cansado ou sem energia",
          "Teve alteracao do sono (demais ou de menos)",
          "Teve alteracao do apetite ou do peso",
          "Teve dificuldade de concentracao",
          "Ficou mais lento ou mais agitado que o normal",
          "Os sintomas depressivos estao melhores que no inicio do tratamento",
          "Houve recaida ou piora recente dos sintomas",
          "A resposta ao tratamento esta sendo satisfatoria",
        ],
      },
    ],
  },

  // ── j26-251 — Autolesão e Ideação Suicida Evolutivo ──
  "j26-251": {
    instruction: "Pergunte com acolhimento e sem julgamento. Marque com base no relato do paciente e no que foi observado nas ultimas 4 semanas.",
    infoBox: "Monitoramento longitudinal de autolesao e ideacao suicida. Qualquer item positivo deve ser avaliado clinicamente em detalhes. Nao e diagnostico.",
    labels: ["Ausente", "Leve", "Moderado", "Intenso"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "Carga de risco de autolesao/suicidio (0-48)",
    bands: [
      { minPct: 0, classification: "Sem alteracao relevante", color: "emerald", description: "Baixa pontuacao. Manter vigilancia clinica de rotina." },
      { minPct: 20, classification: "Sinais leves", color: "amber", description: "Ha sinais leves ou ocasionais. Oriente observacao e reavalie." },
      { minPct: 40, classification: "Sinais moderados", color: "orange", description: "Sinais relevantes presentes. Correlacione com historia e exame clinico." },
      { minPct: 65, classification: "Alteracao importante", color: "red", description: "Escore elevado. Avalie risco funcional e necessidade de intervencao." },
    ],
    domains: [
      {
        name: "Autolesao nao suicida",
        color: "text-orange-600 dark:text-orange-400",
        items: [
          "Se machucou de forma intencional (cortar, queimar, bater)",
          "A frequencia das autolesoes aumentou",
          "A gravidade das lesoes aumentou",
          "Autolesao esta sendo usada para lidar com emocoes dificieis",
          "Nao consegue parar de se machucar mesmo querendo",
          "Esconde as marcas ou nega as autolesoes",
        ],
      },
      {
        name: "Ideacao e risco suicida",
        color: "text-red-600 dark:text-red-400",
        items: [
          "Pensa que seria melhor nao estar aqui",
          "Teve pensamentos de se matar",
          "Fez plano de como se matar",
          "Teve acesso a meios (remedio, arma, altura)",
          "Ja tentou se matar no passado",
          "Ideacao esta mais intensa que no retorno anterior",
          "Ha fatores de protecao (vinculo familiar, razao para viver)",
          "Plano de seguranca esta estabelecido e a familia foi orientada",
        ],
      },
    ],
  },

  // ── j26-252 — TOC Resposta ao Tratamento ──
  "j26-252": {
    instruction: "Marque a frequencia e a intensidade de cada aspecto do TOC nas ultimas 2 semanas. Compare com o inicio do tratamento.",
    infoBox: "Monitoramento de TOC (estrutura CY-BOCS/Y-BOCS). Pontuacao alta = maior carga de sintomas de TOC. Nao e diagnostico.",
    labels: ["Ausente", "Leve", "Moderado", "Intenso"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "Carga de sintomas de TOC (0-48)",
    bands: [
      { minPct: 0, classification: "Sem alteracao relevante", color: "emerald", description: "Baixa pontuacao. Manter vigilancia clinica de rotina." },
      { minPct: 20, classification: "Sinais leves", color: "amber", description: "Ha sinais leves ou ocasionais. Oriente observacao e reavalie." },
      { minPct: 40, classification: "Sinais moderados", color: "orange", description: "Sinais relevantes presentes. Correlacione com historia e exame clinico." },
      { minPct: 65, classification: "Alteracao importante", color: "red", description: "Escore elevado. Avalie risco funcional e necessidade de intervencao." },
    ],
    domains: [
      {
        name: "Obsessoes",
        color: "text-violet-600 dark:text-violet-400",
        items: [
          "Pensamentos intrusivos de contaminacao ou doenca",
          "Pensamentos de danificar a si proprio ou a outros",
          "Necessidade de simetria, ordem ou exatidao",
          "Duvidas excessivas e pensamentos de verificacao",
          "Pensamentos religiosos ou morais perturbadores",
          "As obsessoes causam angustia e tomam mais de 1 hora por dia",
        ],
      },
      {
        name: "Compulsoes e impacto",
        color: "text-orange-600 dark:text-orange-400",
        items: [
          "Rituais de limpeza ou lavagem das maos",
          "Verificacoes repetidas (porta, fogao, tarefa)",
          "Rituais de contagem, repeticao ou simetria",
          "Pede reassurance excessiva a familiares",
          "Evita situacoes que provocam as obsessoes",
          "Os sintomas estao piores que no retorno anterior",
          "O TOC afeta a escola, a familia ou o social de forma relevante",
          "A resposta ao ISRS e/ou TCC esta sendo satisfatoria",
        ],
      },
    ],
  },

  // ── j26-253 — TEPT Evolução Pós-Terapia ──
  "j26-253": {
    instruction: "Marque a frequencia de cada sintoma de TEPT nas ultimas 2 semanas. Compare com o inicio do tratamento. Responda com acolhimento.",
    infoBox: "Monitoramento de TEPT pos-terapia (estrutura UCLA PTSD-RI). Pontuacao alta = maior carga de sintomas. Nao e diagnostico.",
    labels: ["Nunca", "As vezes", "Frequentemente"],
    optionPoints: [0, 1, 2],
    scoreDirection: "higher_worse",
    totalLabel: "Carga de sintomas de TEPT (0-30)",
    bands: [
      { minPct: 0, classification: "Sem alteracao relevante", color: "emerald", description: "Baixa pontuacao. Manter vigilancia clinica de rotina." },
      { minPct: 25, classification: "Sinais leves", color: "amber", description: "Ha sinais leves ou ocasionais. Oriente observacao e reavalie." },
      { minPct: 45, classification: "Sinais moderados", color: "orange", description: "Sinais relevantes presentes. Correlacione com historia e exame clinico." },
      { minPct: 67, classification: "Alteracao importante", color: "red", description: "Escore elevado. Avalie risco funcional e necessidade de intervencao." },
    ],
    domains: [
      {
        name: "Intrusao e evitacao",
        color: "text-red-600 dark:text-red-400",
        items: [
          "Tem flashbacks ou revive o evento traumatico",
          "Tem pesadelos relacionados ao trauma",
          "Fica muito perturbado ao ser lembrado do evento",
          "Evita lugares, pessoas ou conversas que lembram o trauma",
          "Perdeu interesse em atividades que antes gostava",
        ],
      },
      {
        name: "Hipervigilancia e cognicao",
        color: "text-orange-600 dark:text-orange-400",
        items: [
          "Fica em estado de alerta exagerado, como se perigo viesse",
          "Assusta-se facilmente com barulhos ou movimentos",
          "Tem dificuldade de dormir por causa do trauma",
          "Sente-se separado das pessoas ou sem emocoes",
          "Tem crencas negativas sobre si mesmo por causa do trauma",
          "Os sintomas estao melhores que no inicio do tratamento",
          "Houve recaida ou piora recente dos sintomas",
          "A resposta a TCC focada no trauma ou EMDR esta sendo satisfatoria",
        ],
      },
    ],
  },

  // ── j26-254 — Regulação Emocional Global Acompanhamento ──
  "j26-254": {
    instruction: "Marque a frequencia de cada aspecto de regulacao emocional nas ultimas 2 semanas. Compare com o inicio do tratamento. Pode ser respondido por pais, clinico ou pelo proprio paciente.",
    infoBox: "Monitoramento transdiagnostico de regulacao emocional global. Pontuacao alta = maior dificuldade de regulacao. Nao e diagnostico.",
    labels: ["Nunca", "As vezes", "Frequentemente"],
    optionPoints: [0, 1, 2],
    scoreDirection: "higher_worse",
    totalLabel: "Dificuldade de regulacao emocional (0-32)",
    bands: [
      { minPct: 0, classification: "Sem alteracao relevante", color: "emerald", description: "Baixa pontuacao. Manter vigilancia clinica de rotina." },
      { minPct: 25, classification: "Sinais leves", color: "amber", description: "Ha sinais leves ou ocasionais. Oriente observacao e reavalie." },
      { minPct: 45, classification: "Sinais moderados", color: "orange", description: "Sinais relevantes presentes. Correlacione com historia e exame clinico." },
      { minPct: 67, classification: "Alteracao importante", color: "red", description: "Escore elevado. Avalie risco funcional e necessidade de intervencao." },
    ],
    domains: [
      {
        name: "Identificacao e expressao",
        color: "text-violet-600 dark:text-violet-400",
        items: [
          "Tem dificuldade de nomear o que esta sentindo",
          "Expressa emocoes de forma explosiva ou desproporcional",
          "Nega ou bloqueia emocoes ate estourar",
          "Tem reacoes emocionais intensas a situacoes pequenas",
        ],
      },
      {
        name: "Estrategias e funcionalidade",
        color: "text-orange-600 dark:text-orange-400",
        items: [
          "Tem dificuldade de se acalmar sozinho apos se perturbar",
          "Usa estrategias desadaptativas para lidar (isolamento, agressao)",
          "Nao recorre a ajuda quando precisa",
          "A desregulacao afeta escola, familia ou relacoes",
          "As estrategias de regulacao aprendidas na terapia estao sendo usadas",
          "A regulacao emocional melhorou desde o inicio do tratamento",
          "Houve piora recente da regulacao emocional",
          "A resposta ao tratamento na area emocional esta sendo satisfatoria",
        ],
      },
    ],
  },

  // ── j26-255 — Metabólico Antipsicóticos Monitorização ──
  "j26-255": {
    instruction: "Registre os parametros metabolicos da crianca nesta consulta e compare com os anteriores. Marque o que esta alterado ou em monitoramento.",
    infoBox: "Monitoramento metabolico trimestral em uso de antipsicoticos. Pontuacao alta = maior risco metabolico acumulado. Nao e diagnostico.",
    labels: ["Ausente", "Leve", "Moderado", "Intenso"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "Risco metabolico por antipsicotico (0-48)",
    bands: [
      { minPct: 0, classification: "Sem efeitos relevantes", color: "emerald", description: "Sem efeitos clinicamente relevantes. Manter vigilancia de rotina." },
      { minPct: 20, classification: "Efeitos leves", color: "amber", description: "Efeitos leves ou ocasionais. Registre e acompanhe tendencia." },
      { minPct: 40, classification: "Efeitos moderados - ponderar", color: "orange", description: "Efeitos relevantes. Considere dose, tempo de uso e comorbidades." },
      { minPct: 65, classification: "Efeitos importantes - revisar", color: "red", description: "Carga alta de efeitos. Revisao medicamentosa e plano de seguranca." },
    ],
    domains: [
      {
        name: "Peso e composicao",
        color: "text-orange-600 dark:text-orange-400",
        items: [
          "Ganho de peso acima do esperado para a faixa etaria",
          "IMC em sobrepeso ou obesidade",
          "Circunferencia abdominal aumentada",
          "Hiperfagia ou apetite muito aumentado",
          "Acanthosis nigricans presente",
          "Aumento de peso maior que 5% em relacao ao ultimo retorno",
        ],
      },
      {
        name: "Laboratorio e pressao",
        color: "text-red-600 dark:text-red-400",
        items: [
          "Glicemia de jejum acima de 100 mg/dL",
          "Triglicerides acima de 130 mg/dL",
          "LDL ou colesterol total acima do limite para a idade",
          "Pressao arterial sistolica ou diastolica acima do percentil 90",
          "Insulina basal elevada (HOMA acima de 2.5 na crianca)",
          "Perfil lipidico piorou em relacao ao ultimo exame",
          "O antipsicotico precisa ser revisado pelo risco metabolico",
          "O risco metabolico esta controlado com as intervencoes atuais",
        ],
      },
    ],
  },

  // ── j26-256 — Crescimento Estimulantes Acompanhamento ──
  "j26-256": {
    instruction: "Registre e avalie a curva de crescimento da crianca em uso de estimulantes. Marque o que esta sendo observado.",
    infoBox: "Monitoramento de crescimento em uso de estimulantes para TDAH. Pontuacao alta = maior impacto no crescimento. Nao e diagnostico.",
    labels: ["Ausente", "Leve", "Moderado", "Intenso"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "Impacto no crescimento pelo estimulante (0-36)",
    bands: [
      { minPct: 0, classification: "Sem efeitos relevantes", color: "emerald", description: "Sem efeitos clinicamente relevantes. Manter vigilancia de rotina." },
      { minPct: 20, classification: "Efeitos leves", color: "amber", description: "Efeitos leves ou ocasionais. Registre e acompanhe tendencia." },
      { minPct: 40, classification: "Efeitos moderados - ponderar", color: "orange", description: "Efeitos relevantes. Considere dose, tempo de uso e comorbidades." },
      { minPct: 65, classification: "Efeitos importantes - revisar", color: "red", description: "Carga alta de efeitos. Revisao medicamentosa e plano de seguranca." },
    ],
    domains: [
      {
        name: "Peso e apetite",
        color: "text-orange-600 dark:text-orange-400",
        items: [
          "Nao ganhou peso esperado no ultimo trimestre",
          "Perdeu peso desde o ultimo retorno",
          "Percentil de peso caiu em relacao ao grafico",
          "Apetite muito reduzido durante o dia",
          "So come bem a noite (rebound do apetite)",
          "Pais preocupados com a alimentacao e o peso",
        ],
      },
      {
        name: "Estatura e planejamento",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          "Velocidade de crescimento abaixo do esperado para a faixa etaria",
          "Percentil de estatura caiu em relacao ao grafico",
          "Diferenca entre estatura esperada (genetica) e atual esta aumentando",
          "Drug holiday (ferias do remedio) esta sendo considerado ou ja foi feito",
          "Suplementacao nutricional foi orientada",
          "Avaliacao com endocrinologista foi solicitada",
          "O impacto no crescimento supera o beneficio atual do estimulante",
          "O crescimento esta adequado apesar do uso do estimulante",
        ],
      },
    ],
  },

  // ── j26-257 — Ajuste de Dose Eficácia vs Efeitos ──
  "j26-257": {
    instruction: "Avalie a relacao custo-beneficio do ajuste de dose do psicofarmaco atual. Marque o que esta presente comparado ao retorno anterior.",
    infoBox: "Registro de ajuste de dose e relacao eficacia vs efeitos de qualquer psicofarmaco. Pontuacao alta = maior carga de efeitos. Nao e diagnostico.",
    labels: ["Ausente", "Leve", "Moderado", "Intenso"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "Carga de efeitos apos ajuste de dose (0-48)",
    bands: [
      { minPct: 0, classification: "Sem efeitos relevantes", color: "emerald", description: "Sem efeitos clinicamente relevantes. Manter vigilancia de rotina." },
      { minPct: 20, classification: "Efeitos leves", color: "amber", description: "Efeitos leves ou ocasionais. Registre e acompanhe tendencia." },
      { minPct: 40, classification: "Efeitos moderados - ponderar", color: "orange", description: "Efeitos relevantes. Considere dose, tempo de uso e comorbidades." },
      { minPct: 65, classification: "Efeitos importantes - revisar", color: "red", description: "Carga alta de efeitos. Revisao medicamentosa e plano de seguranca." },
    ],
    domains: [
      {
        name: "Efeitos colaterais emergentes",
        color: "text-red-600 dark:text-red-400",
        items: [
          "Novos efeitos colaterais surgiram apos o ajuste",
          "Efeitos colaterais pre-existentes pioraram com a dose atual",
          "Sonolencia ou sedacao excessiva",
          "Sintomas gastrointestinais relevantes",
          "Efeitos cardiovasculares (palpitacao, pressao)",
          "Sintomas psiquiatricos novos (ansiedade, agitacao, psicose)",
        ],
      },
      {
        name: "Eficacia e decisao clinica",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          "O sintoma alvo melhorou com o ajuste de dose",
          "A melhora e suficiente para justificar os efeitos colaterais",
          "A familia esta satisfeita com o resultado do ajuste",
          "Novo ajuste de dose e necessario",
          "A medicacao precisa ser trocada pelo perfil de efeitos",
          "O beneficio do ajuste supera claramente os efeitos colaterais",
          "A adesao ao tratamento esta boa com a dose atual",
          "O custo-beneficio atual e favoravel a manutencao da dose",
        ],
      },
    ],
  },

  // ── j26-258 — Hepático Hematológico Antiepilépticos ──
  "j26-258": {
    instruction: "Registre e compare os exames hepaticos e hematologicos desta consulta com os anteriores. Marque o que esta alterado.",
    infoBox: "Monitoramento hepatico e hematologico de antiepileticos. Pontuacao alta = maior carga de alteracoes. Nao e diagnostico.",
    labels: ["Ausente", "Leve", "Moderado", "Intenso"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "Alteracoes hepaticas e hematologicas (0-48)",
    bands: [
      { minPct: 0, classification: "Sem efeitos relevantes", color: "emerald", description: "Sem efeitos clinicamente relevantes. Manter vigilancia de rotina." },
      { minPct: 20, classification: "Efeitos leves", color: "amber", description: "Efeitos leves ou ocasionais. Registre e acompanhe tendencia." },
      { minPct: 40, classification: "Efeitos moderados - ponderar", color: "orange", description: "Efeitos relevantes. Considere dose, tempo de uso e comorbidades." },
      { minPct: 65, classification: "Efeitos importantes - revisar", color: "red", description: "Carga alta de efeitos. Revisao medicamentosa e plano de seguranca." },
    ],
    domains: [
      {
        name: "Funcao hepatica",
        color: "text-orange-600 dark:text-orange-400",
        items: [
          "TGO ou TGP acima de 3x o limite superior (hepatotoxicidade relevante)",
          "TGO ou TGP entre 1-3x o limite (elevacao leve)",
          "GGT elevada de forma isolada",
          "Bilirrubinas elevadas",
          "Sinais clinicos de hepatite (ictericia, dor em hipocondrio)",
          "Funcao hepatica piorou em relacao ao ultimo exame",
        ],
      },
      {
        name: "Hematologico",
        color: "text-red-600 dark:text-red-400",
        items: [
          "Leucopenia (abaixo de 3500 leucocitos)",
          "Trombocitopenia relevante (plaquetas abaixo de 100 mil)",
          "Anemia nao justificada por outras causas",
          "Neutropenia significativa",
          "Alteracao hematologica piorou em relacao ao ultimo exame",
          "Erupcao cutanea ou sindrome de hipersensibilidade (DRESS/SJS)",
          "Os exames laboratoriais indicam necessidade de reduzir ou suspender",
          "Os exames laboratoriais estao dentro do limite aceitavel de monitoramento",
        ],
      },
    ],
  },

  // ── j26-259 — CGI-S e CGI-I Gravidade e Melhora ──
  "j26-259": {
    instruction: "Avalie a gravidade atual do paciente (CGI-S) e a melhora desde o inicio do tratamento (CGI-I). Marque um nivel em cada dominio.",
    infoBox: "Impressao Clinica Global de Gravidade e Melhora (estrutura CGI-S e CGI-I). Menor pontuacao no CGI-S = menos grave; maior no CGI-I = mais melhora. Nao e diagnostico.",
    labels: ["Nao observado", "Emergente", "Parcial", "Adequado"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_better",
    totalLabel: "Melhora global clinica (maior = mais melhora)",
    bands: [
      { minPct: 85, classification: "Desempenho adequado", color: "emerald", description: "Maioria dos marcos/habilidades presentes. Mantenha vigilancia de rotina." },
      { minPct: 60, classification: "Em desenvolvimento - vigiar", color: "amber", description: "Ha habilidades presentes mas algumas areas merecem atencao. Reavalie em 1-2 meses." },
      { minPct: 40, classification: "Atraso possivel - reavaliar", color: "orange", description: "Desempenho abaixo do esperado. Considere avaliacao dirigida." },
      { minPct: 0, classification: "Atraso provavel - encaminhar", color: "red", description: "Poucas habilidades presentes. Investigar e encaminhar." },
    ],
    domains: [
      {
        name: "Gravidade atual (CGI-S)",
        color: "text-violet-600 dark:text-violet-400",
        items: [
          "Funcionalidade global da crianca esta adequada para a condicao",
          "Sintomas principais estao controlados",
          "Impacto familiar e social esta em nivel aceitavel",
          "Gravidade atual e menor do que no inicio do tratamento",
        ],
      },
      {
        name: "Melhora desde o inicio (CGI-I)",
        color: "text-teal-600 dark:text-teal-400",
        items: [
          "Houve melhora na queixa principal",
          "Houve melhora na funcionalidade escolar",
          "Houve melhora no comportamento em casa",
          "Houve melhora na qualidade de vida da familia",
          "A melhora e percebida pelo proprio paciente (quando aplicavel)",
          "A melhora e percebida pelos pais",
          "A melhora justifica a continuidade do tratamento atual",
          "No geral, o CGI-I indica resposta satisfatoria ao tratamento",
        ],
      },
    ],
  },

};
