import type { InteractiveScaleDef } from "./interactiveScaleItems";

export const j26Bloco3Items: Record<string, InteractiveScaleDef> = {
  // =====================================================================
  // CATEGORIA 11 — SONO EXPANDIDO (J26-131 a J26-139)
  // =====================================================================

  "j26-131": {
    instruction: "Para cada situação abaixo, indique com que frequência ocorre na criança.",
    labels: ["Nunca", "Raramente (1–2×/mês)", "Frequente (1–2×/semana)", "Quase todo dia"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "Escore de pesadelos e terrores",
    domains: [
      {
        name: "Pesadelos",
        items: [
          "A criança acorda assustada no meio da noite relatando sonho ruim",
          "Após o pesadelo, fica agitada e difícil de acalmar",
          "Recusa dormir novamente após o pesadelo",
          "Relata ter medo de dormir por causa dos sonhos ruins",
          "Os pesadelos interferem no humor do dia seguinte",
          "Tem pesadelos recorrentes com o mesmo tema ou conteúdo",
        ],
      },
      {
        name: "Terrores Noturnos",
        items: [
          "Acorda gritando ou em pânico sem conseguir ser consolada",
          "Durante o episódio, não reconhece os pais ou cuidadores",
          "Apresenta sudorese, taquicardia ou agitação intensa no episódio",
          "O episódio dura mais de 5 minutos sem resposta ao conforto",
          "Não tem memória do episódio na manhã seguinte",
          "Os episódios ocorrem no primeiro terço da noite (1–3 h após dormir)",
        ],
      },
    ],
    bands: [
      { minPct: 75, classification: "Pesadelos/terrores graves — avaliar", color: "red", description: "Frequência e intensidade elevadas. Avalie causas (ansiedade, trauma, privação de sono) e considere encaminhamento." },
      { minPct: 50, classification: "Intensidade moderada — investigar", color: "orange", description: "Episódios moderados com impacto na rotina. Oriente higiene do sono e reavalie em 4 semanas." },
      { minPct: 25, classification: "Intensidade leve — monitorar", color: "amber", description: "Episódios leves e esporádicos. Reforce a rotina de sono e oriente os pais sobre conduta." },
      { minPct: 0, classification: "Sem indicação clínica relevante", color: "emerald", description: "Frequência abaixo do limiar de triagem. Mantenha acompanhamento de rotina." },
    ],
  },

  "j26-132": {
    instruction: "Responda com base nos últimos 30 dias. Para cada item, marque o que mais se aplica.",
    labels: ["Não / Nunca", "Às vezes", "Frequentemente", "Sempre"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "Escore de dificuldade para iniciar o sono",
    domains: [
      {
        name: "Dificuldade para Dormir",
        items: [
          "A criança leva mais de 30 minutos para adormecer após deitar",
          "Precisa de presença do cuidador até pegar no sono",
          "Levanta da cama repetidamente antes de adormecer",
          "Pede água, comida ou pretextos para adiar o sono",
          "Fica com os olhos abertos mesmo estando cansada",
          "Apresenta agitação motora ou inquietação ao tentar dormir",
        ],
      },
      {
        name: "Fatores Associados",
        items: [
          "Uso de telas (TV, tablet, celular) na hora de dormir",
          "Quarto com claridade ou ruído excessivo",
          "Horário de dormir irregular (varia mais de 1 hora entre dias)",
          "Pensamentos acelerados ou preocupações ao deitar",
          "Conflito familiar ou estresse antes de dormir",
          "Café, refrigerante ou chocolate após as 17 h",
        ],
      },
    ],
    bands: [
      { minPct: 75, classification: "Insônia de início grave — intervir", color: "red", description: "Múltiplos fatores e frequência elevada. Avalie ansiedade, higiene do sono e considere psicoeducação estruturada." },
      { minPct: 50, classification: "Insônia moderada — plano de higiene do sono", color: "orange", description: "Dificuldade frequente com fatores identificáveis. Implemente rotina consistente e reavalie em 4 semanas." },
      { minPct: 25, classification: "Dificuldade leve — orientar", color: "amber", description: "Episódios leves sem grande impacto. Oriente higiene do sono e monitore." },
      { minPct: 0, classification: "Sem indicação clínica relevante", color: "emerald", description: "Início do sono dentro do esperado para a faixa etária." },
    ],
  },

  "j26-133": {
    instruction: "Marque se cada comportamento abaixo ocorre durante o sono da criança.",
    labels: ["Nunca", "Raramente", "Às vezes", "Frequentemente"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "Escore de parassônias",
    domains: [
      {
        name: "Parassônias NREM",
        items: [
          "Sonambulismo — anda pela casa dormindo",
          "Terror noturno — acorda gritando sem memória",
          "Fala durante o sono (somniloquismo)",
          "Mastiga ou faz movimentos de engolir dormindo (síndrome de alimentação noturna)",
          "Enurese noturna — xixi na cama",
          "Confusão ao despertar — não sabe onde está ao acordar",
        ],
      },
      {
        name: "Parassônias REM / Outras",
        items: [
          "Comportamento de agir o sonho — bate, grita no sono",
          "Paralisia do sono — fica imóvel ao acordar",
          "Alucinações hipnagógicas — vê ou ouve coisas ao adormecer",
          "Bruxismo — ranger de dentes durante o sono",
          "Mioclonias — soluços ou espasmos ao adormecer",
          "Movimentos rítmicos de balançar a cabeça ou o corpo no sono",
        ],
      },
    ],
    bands: [
      { minPct: 67, classification: "Parassônias graves — investigar", color: "red", description: "Múltiplas parassônias frequentes. Investigue epilepsia noturna, apneia e fatores ambientais. Avalie polissonografia se necessário." },
      { minPct: 42, classification: "Parassônias moderadas — monitorar", color: "orange", description: "Parassônias ocasionais com impacto na rotina. Oriente segurança noturna e reavalie." },
      { minPct: 17, classification: "Parassônias leves — observar", color: "amber", description: "Episódios raros e esporádicos. Explique aos pais sobre a benigmidade e monitore." },
      { minPct: 0, classification: "Sem parassônias significativas", color: "emerald", description: "Poucos ou nenhum comportamento de parassônia." },
    ],
  },

  "j26-134": {
    instruction: "Para cada item, marque o que melhor descreve o uso de telas no período pré-sono da criança.",
    labels: ["Não / Nunca", "Às vezes", "Frequentemente", "Sempre"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "Escore de impacto de telas no sono",
    domains: [
      {
        name: "Exposição às Telas",
        items: [
          "Usa telas (TV, tablet, celular) na última hora antes de dormir",
          "Dorme com a TV ligada no quarto",
          "Usa o celular ou tablet na cama antes de adormecer",
          "Joga videogame após as 20 h nos dias de semana",
          "Assiste vídeos excitantes ou de terror próximo ao horário de dormir",
          "O tempo de tela ultrapassa 2 horas por dia nos dias de semana",
        ],
      },
      {
        name: "Impacto no Sono",
        items: [
          "Fica agitada ou irritada quando se retira a tela para dormir",
          "Demora para dormir nos dias com mais tempo de tela",
          "Apresenta sono fragmentado nos dias de uso excessivo",
          "Acorda de madrugada pedindo tela",
          "Está com sonolência diurna por causa do sono ruim",
          "Fica irritada, impulsiva ou com déficit de atenção após noite ruim",
        ],
      },
    ],
    bands: [
      { minPct: 75, classification: "Impacto grave de telas no sono — intervir", color: "red", description: "Uso excessivo com impacto direto na qualidade do sono. Estabeleça limites firmes e rotina sem telas." },
      { minPct: 50, classification: "Impacto moderado — estabelecer limites", color: "orange", description: "Uso frequente com sinais de impacto. Reduza exposição nas 2 horas antes de dormir." },
      { minPct: 25, classification: "Impacto leve — orientar", color: "amber", description: "Uso eventual com impacto leve. Reforce as diretrizes de higiene de mídia." },
      { minPct: 0, classification: "Uso de telas sem impacto no sono", color: "emerald", description: "Hábitos de telas compatíveis com bom sono. Mantenha a rotina." },
    ],
  },

  "j26-135": {
    instruction: "Para cada situação, marque com que frequência ocorre na criança ao se preparar para dormir.",
    labels: ["Nunca", "Às vezes", "Frequentemente", "Sempre"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "Escore de ansiedade noturna",
    domains: [
      {
        name: "Medos e Preocupações Noturnas",
        items: [
          "Tem medo de ficar no quarto sozinha à noite",
          "Chora ou faz birra quando chega a hora de dormir",
          "Pede repetidamente para dormir na cama dos pais",
          "Tem medo do escuro, de monstros ou de ladrões",
          "Faz perguntas repetitivas sobre morte, doença ou separação ao deitar",
          "Apresenta queixas físicas (dor de barriga, cabeça) na hora de dormir",
        ],
      },
      {
        name: "Comportamentos de Segurança",
        items: [
          "Precisa da luz acesa para conseguir dormir",
          "Segura objetos específicos (urso, cobertor) para dormir",
          "Acorda de madrugada e vai para a cama dos pais",
          "Precisa checar que a casa está segura antes de dormir",
          "Não consegue dormir em locais diferentes de casa",
          "Fica em estado de alerta mesmo quando está cansada",
        ],
      },
    ],
    bands: [
      { minPct: 75, classification: "Ansiedade noturna intensa — avaliar", color: "red", description: "Ansiedade intensa impactando o sono. Avalie transtorno de ansiedade de separação ou generalizada e inicie intervenção." },
      { minPct: 50, classification: "Ansiedade moderada — intervir", color: "orange", description: "Ansiedade frequente com impacto na rotina familiar. Técnicas de relaxamento e rotina estruturada." },
      { minPct: 25, classification: "Ansiedade leve — orientar", color: "amber", description: "Ansiedade ocasional, comum no desenvolvimento. Psicoeducação e rotina consistente." },
      { minPct: 0, classification: "Sem ansiedade noturna significativa", color: "emerald", description: "Criança dorme com tranquilidade. Mantenha a rotina." },
    ],
  },

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

  "j26-138": {
    instruction: "Para cada item, marque o que melhor descreve o sono e desenvolvimento da criança.",
    labels: ["Não / Nunca", "Às vezes", "Frequentemente", "Sempre"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "Escore de impacto do sono no neurodesenvolvimento",
    domains: [
      {
        name: "Qualidade do Sono",
        items: [
          "Dorme menos horas que o recomendado para a idade",
          "O sono é fragmentado com múltiplos despertares noturnos",
          "Apresenta sonolência diurna excessiva",
          "Ronca ou apresenta pausas respiratórias durante o sono",
          "Tem dificuldade para acordar no horário escolar",
        ],
      },
      {
        name: "Impacto Diurno",
        items: [
          "Apresenta irritabilidade ou labilidade emocional por causa do sono ruim",
          "Tem déficit de atenção ou hiperatividade relacionados ao sono insuficiente",
          "A aprendizagem escolar está comprometida pela privação de sono",
          "Tem dificuldade de regulação emocional nos dias de sono ruim",
          "O comportamento piora significativamente após noites mal dormidas",
          "Apresenta queda de memória ou dificuldade de consolidação de aprendizado",
        ],
      },
    ],
    bands: [
      { minPct: 75, classification: "Sono com impacto grave no desenvolvimento", color: "red", description: "Privação de sono com impacto claro no comportamento e aprendizado. Intervenção prioritária no sono." },
      { minPct: 50, classification: "Impacto moderado — investigar e tratar", color: "orange", description: "Impacto frequente. Investigue causas (SAOS, ansiedade, higiene do sono) e intervenha." },
      { minPct: 25, classification: "Impacto leve — monitorar", color: "amber", description: "Impacto leve e intermitente. Otimize a higiene do sono e monitore." },
      { minPct: 0, classification: "Sono sem impacto significativo no desenvolvimento", color: "emerald", description: "Sono e desenvolvimento dentro do esperado." },
    ],
  },

  "j26-139": {
    instruction: "Para cada item, marque o que melhor descreve os sintomas de possível apneia obstrutiva do sono.",
    labels: ["Não / Nunca", "Às vezes", "Frequentemente", "Sempre"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "Escore de triagem de SAOS infantil",
    domains: [
      {
        name: "Sintomas Noturnos",
        items: [
          "Ronca durante o sono (audível do corredor)",
          "Apresenta pausas respiratórias observadas pelos pais",
          "Respira pela boca durante o sono",
          "Dorme em posição estranha (hiperextensão do pescoço)",
          "Apresenta agitação noturna e sudorese intensa",
          "Acorda com engasgo, tosse ou sensação de sufocamento",
        ],
      },
      {
        name: "Sintomas Diurnos",
        items: [
          "Tem sonolência diurna excessiva mesmo dormindo o suficiente",
          "Respira pela boca durante o dia",
          "Apresenta hiperatividade ou déficit de atenção",
          "Tem enurese noturna (xixi na cama após 5 anos)",
          "Acorda com cefaleia matinal",
          "Apresenta voz anasalada ou obstrução nasal crônica",
        ],
      },
    ],
    bands: [
      { minPct: 67, classification: "Alta suspeita de SAOS — encaminhar", color: "red", description: "Múltiplos sintomas sugestivos. Encaminhe para otorrinolaringologia e/ou polissonografia." },
      { minPct: 42, classification: "Suspeita moderada de SAOS — investigar", color: "orange", description: "Sintomas frequentes. Avalie hipertrofia adenotonsilar e fatores de risco. Investigue." },
      { minPct: 17, classification: "Suspeita leve — monitorar", color: "amber", description: "Sintomas leves e esporádicos. Monitore e reavalie. Avalie rinite/alergia." },
      { minPct: 0, classification: "Sem suspeita de SAOS", color: "emerald", description: "Poucos ou nenhum sintoma de apneia obstrutiva do sono." },
    ],
  },

  // =====================================================================
  // CATEGORIA 12 — ALIMENTAÇÃO E NUTRIÇÃO (J26-140 a J26-149)
  // =====================================================================

  "j26-140": {
    instruction: "Para cada situação alimentar, marque com que frequência ocorre.",
    labels: ["Nunca", "Às vezes", "Frequentemente", "Sempre"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "Escore de seletividade alimentar",
    domains: [
      {
        name: "Recusa e Restrição",
        items: [
          "Recusa alimentos por causa da textura (mole, crocante, fibroso)",
          "Recusa alimentos por causa da cor (alimentos verdes, coloridos)",
          "Come menos de 20 alimentos diferentes regularmente",
          "Apresenta reação intensa (choro, vômito) ao ver alimentos rejeitados",
          "Recusa experimentar qualquer alimento novo",
          "Come apenas marcas específicas do mesmo alimento",
        ],
      },
      {
        name: "Impacto Nutricional e Social",
        items: [
          "A dieta restrita causa preocupação nutricional (vitaminas, proteínas)",
          "Não consegue comer em festas, restaurantes ou escola por causa da seletividade",
          "A seletividade gera conflito ou estresse nas refeições familiares",
          "Perdeu peso ou não ganhou peso adequadamente por causa da restrição",
          "Prefere alimentos de textura uniforme (industrializados, purês)",
          "A seletividade piorou nos últimos 6 meses",
        ],
      },
    ],
    bands: [
      { minPct: 75, classification: "Seletividade alimentar grave — intervir", color: "red", description: "Seletividade intensa com risco nutricional. Encaminhe para fonoaudiologia/terapia ocupacional e nutrição." },
      { minPct: 50, classification: "Seletividade moderada — avaliar", color: "orange", description: "Seletividade com impacto funcional. Avalie processamento sensorial e inicie intervenção alimentar." },
      { minPct: 25, classification: "Seletividade leve — monitorar", color: "amber", description: "Seletividade presente mas sem impacto nutricional grave. Oriente diversificação gradual." },
      { minPct: 0, classification: "Alimentação sem seletividade significativa", color: "emerald", description: "Variedade alimentar adequada para a faixa etária." },
    ],
  },

  "j26-141": {
    instruction: "Para cada comportamento durante as refeições, marque com que frequência ocorre.",
    labels: ["Nunca", "Às vezes", "Frequentemente", "Sempre"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "Escore de comportamento alimentar disfuncional",
    domains: [
      {
        name: "Comportamento na Mesa",
        items: [
          "Fica em pé, corre ou sai da mesa durante as refeições",
          "Usa telas (tablet, TV) para conseguir comer",
          "A refeição dura mais de 45 minutos",
          "Cospe alimentos ou os retira da boca",
          "Faz birra ou chora no horário das refeições",
          "Precisa de distração para aceitar a comida",
        ],
      },
      {
        name: "Dinâmica Familiar",
        items: [
          "Os pais/cuidadores ficam ansiosos ou estressados durante as refeições",
          "A família tem rotinas diferentes para a criança e os demais",
          "Os pais usam pressão ou força para que a criança coma",
          "Existem conflitos frequentes durante o momento das refeições",
          "A rotina de horários das refeições é muito irregular",
          "A criança controla o que os pais oferecem por choro ou recusa",
        ],
      },
    ],
    bands: [
      { minPct: 75, classification: "Comportamento alimentar gravemente disfuncional", color: "red", description: "Refeições com grande conflito e impacto familiar. Avalie ARFID, TEA e encaminhe para equipe multidisciplinar." },
      { minPct: 50, classification: "Comportamento moderadamente disfuncional — intervir", color: "orange", description: "Comportamento frequente com estresse familiar. Inicie orientação comportamental estruturada." },
      { minPct: 25, classification: "Comportamento leve — orientar", color: "amber", description: "Comportamentos leves comuns na infância. Psicoeducação e rotina firme." },
      { minPct: 0, classification: "Comportamento alimentar adequado", color: "emerald", description: "Refeições tranquilas e sem conflito significativo." },
    ],
  },

  "j26-142": {
    instruction: "Marque o que melhor descreve a função motora oral e a deglutição da criança.",
    labels: ["Não consegue / Ausente", "Com grande dificuldade", "Com alguma dificuldade", "Sem dificuldade"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_better",
    totalLabel: "Escore de função motora oral",
    domains: [
      {
        name: "Sucção e Mastigação",
        items: [
          "Mama no peito ou na mamadeira sem engasgo ou fadiga",
          "Mastiga alimentos sólidos sem cuspir em excesso",
          "Mastiga com a boca fechada sem vazamento de alimentos",
          "Consegue mastigar alimentos de consistência firme (carne, cenoura crua)",
          "Transita adequadamente de purê para sólidos conforme a idade",
        ],
      },
      {
        name: "Deglutição e Coordenação",
        items: [
          "Deglute sem tosse ou engasgo frequente",
          "Não apresenta voz úmida/borbulhante após engolir",
          "Come sem excesso de salivação ou bavação após 18 meses",
          "Coordena adequadamente sucção-deglutição-respiração",
          "Não apresenta refluxo ou regurgitação frequente associada à alimentação",
          "Aceita diferentes consistências (líquido, pastoso, sólido) sem dificuldade",
        ],
      },
    ],
    bands: [
      { minPct: 85, classification: "Função motora oral adequada", color: "emerald", description: "Funções de sucção, mastigação e deglutição dentro do esperado para a idade." },
      { minPct: 65, classification: "Disfunção leve — monitorar", color: "amber", description: "Dificuldades leves presentes. Oriente estimulação oral e reavalie." },
      { minPct: 45, classification: "Disfunção moderada — encaminhar para fonoaudiologia", color: "orange", description: "Dificuldades moderadas com impacto alimentar. Encaminhe para fonoaudiólogo especializado." },
      { minPct: 0, classification: "Disfagia / disfunção grave — investigar urgente", color: "red", description: "Disfunção grave com risco de aspiração. Avaliação fonoaudiológica e videodeglutograma urgentes." },
    ],
  },

  "j26-143": {
    instruction: "Para cada característica, marque o que melhor descreve a alimentação da criança.",
    labels: ["Nunca / Não", "Leve", "Moderado", "Grave / Sempre"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "Escore expandido de ARFID",
    domains: [
      {
        name: "Evitação Alimentar",
        items: [
          "Evita alimentos por características sensoriais (textura, cor, cheiro, aparência)",
          "Evita alimentos por medo de engasgar, vomitar ou ficar doente",
          "Falta de interesse em comer — não sente fome ou não liga para comida",
          "Restringe a menos de 20 alimentos na dieta habitual",
          "Recusa sistematicamente grupos alimentares inteiros (vegetais, carnes, frutas)",
          "A recusa não está relacionada a restrição cultural ou religiosa",
        ],
      },
      {
        name: "Impacto Clínico",
        items: [
          "Perda de peso significativa ou falha no ganho esperado",
          "Deficiência nutricional documentada (ferro, zinco, vitaminas)",
          "Dependência de suplementos ou fórmulas por recusa alimentar",
          "Impacto psicossocial grave — evita eventos, festas, escola por causa da alimentação",
          "Sofrimento significativo relacionado às refeições",
          "O comportamento alimentar interfere no funcionamento diário da criança e família",
        ],
      },
    ],
    bands: [
      { minPct: 75, classification: "ARFID provável — encaminhar equipe especializada", color: "red", description: "Critérios compatíveis com ARFID grave. Encaminhe para nutricionista, fonoaudiólogo e psicólogo especializados." },
      { minPct: 50, classification: "ARFID moderado — avaliar e intervir", color: "orange", description: "Restrição alimentar com impacto nutricional ou psicossocial. Avaliação multidisciplinar indicada." },
      { minPct: 25, classification: "Dificuldade alimentar leve — monitorar", color: "amber", description: "Restrição leve sem impacto clínico grave. Intervenção preventiva e monitoramento nutricional." },
      { minPct: 0, classification: "Sem critérios de ARFID", color: "emerald", description: "Alimentação variada sem restrição clínica significativa." },
    ],
  },

  "j26-144": {
    instruction: "Para cada textura alimentar, marque como a criança responde ao ser exposta a ela.",
    labels: ["Aceita sem dificuldade", "Aceita com custo", "Recusa após contato", "Recusa antes de provar / pânico"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "Escore de aversão a texturas alimentares",
    domains: [
      {
        name: "Texturas Problemáticas",
        items: [
          "Alimentos viscosos ou grudosos (iogurte, gelatina, quiabo)",
          "Alimentos com múltiplas texturas misturadas (sopa com pedaços)",
          "Alimentos crocantes que fazem barulho ao mastigar (biscoito, cenoura crua)",
          "Alimentos fibrosos ou com fios (carne, manga, brócolis)",
          "Alimentos pastosos ou amolecidos (banana madura, inhame)",
          "Alimentos com casca ou sementes (uva com caroço, pimentão)",
        ],
      },
      {
        name: "Reações ao Contato",
        items: [
          "Reage ao toque de alimentos nas mãos durante a refeição",
          "Apresenta reações de náusea ou engasgo ao contato com texturas aversivas",
          "Evita tocar a comida mesmo sem precisar colocar na boca",
          "A reação de aversão se estende a outros contextos (barro, tinta, areia)",
          "A criança não gosta de sujar as mãos de modo geral",
        ],
      },
    ],
    bands: [
      { minPct: 75, classification: "Aversão sensorial grave a texturas", color: "red", description: "Aversão intensa com impacto alimentar grave. Encaminhe para terapia de integração sensorial." },
      { minPct: 50, classification: "Aversão moderada — avaliar processamento sensorial", color: "orange", description: "Aversão frequente a múltiplas texturas. Avalie perfil sensorial e inicie intervenção." },
      { minPct: 25, classification: "Aversão leve — orientar dessensibilização gradual", color: "amber", description: "Aversão a algumas texturas. Orientações sobre exposição gradual." },
      { minPct: 0, classification: "Sem aversão significativa a texturas", color: "emerald", description: "Aceita a maioria das texturas alimentares adequadamente." },
    ],
  },

  "j26-145": {
    instruction: "Para cada situação, marque o que melhor descreve a criança diante de alimentos novos.",
    labels: ["Nunca", "Às vezes", "Frequentemente", "Sempre"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "Escore de neofobia alimentar",
    domains: [
      {
        name: "Recusa de Novos Alimentos",
        items: [
          "Recusa provar qualquer alimento que não conhece",
          "Reage com choro ou pânico quando apresentam um alimento novo",
          "Examina o alimento novo longamente antes de sequer tocá-lo",
          "Tenta convencer os pais a não oferecer novos alimentos",
          "Associa alimentos novos a experiências negativas sem ter provado",
          "A neofobia impede variedade mínima na dieta",
        ],
      },
      {
        name: "Contexto e Evolução",
        items: [
          "A neofobia está piorando em vez de melhorar com a idade",
          "Afeta também outros contextos (recusa novos brinquedos, locais, situações)",
          "A criança nunca aceita alimentos novos mesmo após múltiplas exposições",
          "Os pais desistiram de oferecer novos alimentos por causa das reações",
          "A neofobia causa isolamento social nas refeições fora de casa",
        ],
      },
    ],
    bands: [
      { minPct: 75, classification: "Neofobia grave — intervenção especializada", color: "red", description: "Neofobia intensa com impacto nutricional e social. Encaminhe para equipe de alimentação pediátrica." },
      { minPct: 50, classification: "Neofobia moderada — intervir", color: "orange", description: "Neofobia frequente. Estratégias de exposição gradual e abordagem positiva com alimentação." },
      { minPct: 25, classification: "Neofobia leve — orientar", color: "amber", description: "Neofobia comum na faixa etária. Exponha gradualmente com técnica de divisão da responsabilidade." },
      { minPct: 0, classification: "Exploração alimentar adequada", color: "emerald", description: "Criança explora alimentos novos com curiosidade adequada para a idade." },
    ],
  },

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

  "j26-147": {
    instruction: "Para cada aspecto nutricional, marque o que melhor descreve a criança.",
    labels: ["Não / Nunca", "Às vezes", "Frequentemente", "Sempre / Sim"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "Escore de preocupações nutricionais",
    domains: [
      {
        name: "Ingestão Alimentar",
        items: [
          "Come menos de 3 porções de frutas e vegetais por dia",
          "Consome mais de 3 porções de ultraprocessados por dia",
          "Bebe mais de 200 ml de suco artificial ou refrigerante por dia",
          "Não toma café da manhã regularmente",
          "A ingestão de proteína parece insuficiente para a faixa etária",
          "Ingere pouco líquido ao longo do dia (menos de 4 copos d'água)",
        ],
      },
      {
        name: "Sinais Clínicos",
        items: [
          "Apresenta cansaço fácil ou palidez (possível anemia)",
          "Tem cabelo quebradiço, unhas fracas ou queda de cabelo",
          "Apresenta crescimento abaixo do esperado para a faixa etária",
          "Tem frequência aumentada de infecções (possível deficiência de vitaminas)",
          "Apresenta irritabilidade intensa que pode estar relacionada à alimentação",
        ],
      },
    ],
    bands: [
      { minPct: 75, classification: "Preocupação nutricional grave — avaliar e encaminhar", color: "red", description: "Múltiplos sinais de risco nutricional. Encaminhe para nutricionista pediátrico e investigue deficiências." },
      { minPct: 50, classification: "Preocupação moderada — orientar e monitorar", color: "orange", description: "Padrão alimentar inadequado com alguns sinais clínicos. Intervenção nutricional indicada." },
      { minPct: 25, classification: "Preocupação leve — orientar", color: "amber", description: "Alguns hábitos inadequados sem sinais clínicos graves. Educação nutricional." },
      { minPct: 0, classification: "Nutrição adequada", color: "emerald", description: "Padrão alimentar e crescimento dentro do esperado." },
    ],
  },

  "j26-148": {
    instruction: "Avalie o processo de alimentação do bebê (amamentação ou introdução alimentar).",
    labels: ["Não / Com grande dificuldade", "Com alguma dificuldade", "Parcialmente adequado", "Adequado / Sem dificuldade"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_better",
    totalLabel: "Escore de adequação da alimentação do bebê",
    domains: [
      {
        name: "Amamentação",
        items: [
          "A pega do bebê está correta (boca aberta, língua abaixo do mamilo)",
          "A amamentação ocorre sem dor intensa na mãe",
          "O bebê ganha peso adequadamente para a faixa etária",
          "A amamentação ocorre em livre demanda sem horários rígidos",
          "A mãe não apresenta mastite ou fissuras repetidas",
        ],
      },
      {
        name: "Introdução Alimentar",
        items: [
          "A introdução alimentar foi iniciada no momento correto (6 meses)",
          "Os alimentos são oferecidos em forma e consistência adequadas para a idade",
          "A criança aceita alimentos novos com curiosidade",
          "Não há recusa alimentar intensa durante a introdução",
          "A família segue orientações de introdução alimentar responsiva",
          "O bebê não apresenta reações alérgicas ao introduzir novos alimentos",
        ],
      },
    ],
    bands: [
      { minPct: 85, classification: "Alimentação do bebê adequada", color: "emerald", description: "Amamentação e/ou introdução alimentar dentro do esperado. Mantenha suporte e orientações." },
      { minPct: 65, classification: "Dificuldades leves — apoiar", color: "amber", description: "Algumas dificuldades leves. Suporte da consultora de amamentação ou nutricionista pediátrico." },
      { minPct: 45, classification: "Dificuldades moderadas — intervir", color: "orange", description: "Dificuldades com impacto no ganho de peso ou vínculo. Avaliação especializada indicada." },
      { minPct: 0, classification: "Dificuldades graves — encaminhar urgente", color: "red", description: "Risco nutricional ou de vínculo. Encaminhe para equipe especializada urgentemente." },
    ],
  },

  "j26-149": {
    instruction: "Para cada comportamento, marque com que frequência ocorre durante a alimentação do bebê.",
    labels: ["Nunca", "Às vezes", "Frequentemente", "Sempre"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "Escore de recusa alimentar no bebê",
    domains: [
      {
        name: "Comportamentos de Recusa",
        items: [
          "Vira a cabeça ou fecha a boca quando a colher se aproxima",
          "Chora, arqueja ou se agita durante a oferta de alimento",
          "Cospe ou expele sistematicamente o alimento oferecido",
          "Mastiga mas não engole (rumina o alimento)",
          "A refeição é interrompida frequentemente pelo comportamento de recusa",
          "O tempo de refeição se estende por mais de 30 minutos por causa da recusa",
        ],
      },
      {
        name: "Fatores Associados",
        items: [
          "A recusa surgiu ou piorou após evento específico (refluxo, engasgo, doença)",
          "O bebê aceita um cuidador mas não outro",
          "Aceita apenas uma forma de oferta (mamadeira mas não colher)",
          "Apresenta sinais de dor ou desconforto durante a alimentação",
          "A recusa causa sofrimento intenso nos cuidadores",
        ],
      },
    ],
    bands: [
      { minPct: 75, classification: "Recusa alimentar grave — investigar e encaminhar", color: "red", description: "Recusa intensa com risco nutricional. Investigue disfagia, refluxo ou ARFID. Encaminhe para equipe especializada." },
      { minPct: 50, classification: "Recusa moderada — avaliar causa", color: "orange", description: "Recusa frequente com impacto no crescimento. Avalie causas orgânicas e comportamentais." },
      { minPct: 25, classification: "Recusa leve — orientar pais", color: "amber", description: "Recusa ocasional comum na infância. Oriente alimentação responsiva e evite conflito nas refeições." },
      { minPct: 0, classification: "Aceitação alimentar adequada", color: "emerald", description: "Bebê aceita alimentos adequadamente para a faixa etária." },
    ],
  },

  // =====================================================================
  // CATEGORIA 13 — DOR E CEFALEIA (J26-150 a J26-157)
  // =====================================================================

  "j26-150": {
    instruction: "Para cada característica da dor de cabeça, marque o que melhor descreve os episódios da criança.",
    labels: ["Nunca / Não", "Às vezes", "Frequentemente", "Sempre / Muito"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "Escore de impacto da cefaleia",
    domains: [
      {
        name: "Características da Dor",
        items: [
          "A dor de cabeça ocorre mais de 4 vezes por mês",
          "A dor é de intensidade forte (impede atividades)",
          "A dor dura mais de 2 horas sem medicação",
          "A dor é pulsátil ou latejante (como batida)",
          "A dor piora com esforço físico ou movimento",
          "Há náusea ou vômito associados à cefaleia",
        ],
      },
      {
        name: "Fatores e Impacto",
        items: [
          "Há sensibilidade à luz (fotofobia) durante a crise",
          "Há sensibilidade ao som (fonofobia) durante a crise",
          "A criança precisa deitar no escuro durante as crises",
          "A cefaleia faz a criança faltar à escola",
          "A cefaleia interfere nas atividades de lazer e esportes",
          "A família organiza a rotina em torno das crises de cefaleia",
        ],
      },
    ],
    bands: [
      { minPct: 75, classification: "Cefaleia de alto impacto — tratar e monitorar", color: "red", description: "Cefaleia frequente e incapacitante. Elabore plano de tratamento profilático e de crise." },
      { minPct: 50, classification: "Cefaleia de impacto moderado — investigar", color: "orange", description: "Cefaleia frequente com impacto funcional. Investigue gatilhos e considere profilaxia." },
      { minPct: 25, classification: "Cefaleia leve — orientar e monitorar", color: "amber", description: "Cefaleia esporádica com impacto leve. Identifique gatilhos e oriente higiene geral." },
      { minPct: 0, classification: "Cefaleia sem impacto significativo", color: "emerald", description: "Raras cefaleias sem comprometimento funcional." },
    ],
  },

  "j26-151": {
    instruction: "Para cada impacto, marque com que frequência a dor crônica da criança causa este efeito.",
    labels: ["Nunca", "Às vezes", "Frequentemente", "Sempre"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "Escore de impacto da dor crônica",
    domains: [
      {
        name: "Impacto Funcional",
        items: [
          "A dor faz a criança faltar à escola",
          "A dor impede a participação em atividades físicas e esportes",
          "A criança evita atividades de lazer por causa da dor",
          "A dor interfere no sono da criança",
          "A criança tem dificuldade de concentração na escola por causa da dor",
          "A dor impede atividades diárias básicas (vestir, higiene, comer)",
        ],
      },
      {
        name: "Impacto Emocional e Social",
        items: [
          "A criança está irritada, triste ou ansiosa por causa da dor",
          "Há isolamento social relacionado à dor crônica",
          "A criança expressa desesperança quanto à melhora",
          "Os pais estão sobrecarregados ou ansiosos por causa da dor do filho",
          "A família mudou significativamente sua rotina por causa da dor",
        ],
      },
    ],
    bands: [
      { minPct: 75, classification: "Impacto grave da dor crônica — intervenção multidisciplinar", color: "red", description: "Dor crônica com impacto severo na vida da criança. Equipe multidisciplinar com psicólogo, fisiatra e neuropediatra." },
      { minPct: 50, classification: "Impacto moderado — ampliar tratamento", color: "orange", description: "Impacto frequente na função e emoção. Avalie estratégias de manejo da dor e suporte psicológico." },
      { minPct: 25, classification: "Impacto leve — monitorar", color: "amber", description: "Impacto ocasional. Estratégias de enfrentamento e monitoramento da progressão." },
      { minPct: 0, classification: "Dor sem impacto funcional significativo", color: "emerald", description: "Criança funciona bem apesar da queixa de dor." },
    ],
  },

  "j26-152": {
    instruction: "Para cada pensamento ou comportamento, marque com que frequência ocorre quando a criança sente dor.",
    labels: ["Nunca", "Às vezes", "Frequentemente", "Sempre"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "Escore de catastrofização da dor",
    domains: [
      {
        name: "Pensamentos Catastróficos",
        items: [
          "Pensa que a dor nunca vai parar",
          "Acredita que algo muito sério e grave está acontecendo com ela",
          "Fica preocupada com o que pode ter causado a dor",
          "Sente que não vai conseguir suportar a dor",
          "Fica com medo que a dor piore cada vez mais",
        ],
      },
      {
        name: "Comportamentos de Evitação",
        items: [
          "Evita atividades por medo de provocar ou piorar a dor",
          "Fica rígida ou imóvel com medo de movimentar e sentir mais dor",
          "Chora ou grita de forma intensa mesmo para dores leves",
          "Pede para ir ao médico ou pronto-socorro frequentemente por causa da dor",
          "Falta à escola preventivamente com medo de sentir dor lá",
          "Os pais reforçam a catastrofização ao superproteger a criança",
        ],
      },
    ],
    bands: [
      { minPct: 75, classification: "Catastrofização grave — psicoterapia indicada", color: "red", description: "Catastrofização intensa amplificando o sofrimento. Terapia cognitivo-comportamental para dor pediátrica urgente." },
      { minPct: 50, classification: "Catastrofização moderada — intervir", color: "orange", description: "Pensamentos catastróficos frequentes. Psicoeducação para criança e família sobre dor." },
      { minPct: 25, classification: "Catastrofização leve — orientar", color: "amber", description: "Alguns pensamentos negativos sobre a dor. Oriente estratégias de enfrentamento." },
      { minPct: 0, classification: "Sem catastrofização significativa", color: "emerald", description: "Criança lida com a dor de forma adaptativa." },
    ],
  },
"j26-153": {
    instruction: "Para cada característica, marque se ocorre ANTES ou NO INÍCIO da crise de enxaqueca da criança.",
    labels: ["Nunca ocorre", "Ocorre raramente", "Ocorre na maioria das crises", "Ocorre em todas as crises"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "Escore de sintomas de aura",
    domains: [
      {
        name: "Aura Visual",
        items: [
          "Ve pontos de luz, flashes ou faíscas antes da crise",
          "Tem pontos cegos ou áreas de visão perdida (escotoma)",
          "Ve linhas em ziguezague ou figuras geométricas que se expandem",
          "A visão fica borrada ou distorcida antes da dor",
          "Tem visão dupla ou perda transitória de visão",
        ],
      },
      {
        name: "Aura Sensorial e Motora",
        items: [
          "Sente formigamento ou dormência em rosto, braço ou perna",
          "Tem dificuldade para falar ou encontrar palavras antes da crise",
          "Sente fraqueza em um lado do corpo antes da crise",
          "Fica confusa, desorientada ou parece estar em outro lugar",
          "Apresenta tonteira ou sensação de rotação antes da dor",
          "Os sintomas da aura duram entre 5 e 60 minutos",
        ],
      },
    ],
    bands: [
      { minPct: 67, classification: "Aura presente e frequente — caracterizar e tratar", color: "red", description: "Aura frequente compatível com enxaqueca com aura. Revise tratamento e avalie risco cardiovascular em adolescentes." },
      { minPct: 33, classification: "Aura ocasional — documentar e monitorar", color: "amber", description: "Aura presente em algumas crises. Documente as características e monitore progressão." },
      { minPct: 0, classification: "Sem aura significativa", color: "emerald", description: "Enxaqueca sem aura evidente ou aura muito rara." },
    ],
  },

  "j26-154": {
    instruction: "Para cada característica, marque o que melhor descreve a dor abdominal da criança.",
    labels: ["Nunca / Nao", "As vezes", "Frequentemente", "Sempre / Sim"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "Escore de dor abdominal funcional",
    domains: [
      {
        name: "Características da Dor",
        items: [
          "A dor abdominal ocorre mais de uma vez por semana",
          "A dor esta localizada ao redor do umbigo (periumbilical)",
          "A dor nao tem causa organica identificada apos investigacao",
          "A dor ocorre mais em momentos de estresse ou ansiedade",
          "A criança para completamente as atividades durante a dor",
          "A dor dura mais de 1 hora por episodio",
        ],
      },
      {
        name: "Impacto e Fatores Associados",
        items: [
          "A dor faz a criança faltar a escola com frequencia",
          "Ha historia familiar de intestino irritavel ou enxaqueca",
          "A criança tem constipacao ou diarreia associadas a dor",
          "A dor piora antes de eventos estressantes (prova, apresentacao)",
          "A criança esta ansiosa ou tem medo de ficar longe de casa",
          "A dor melhora nos fins de semana ou nas ferias",
        ],
      },
    ],
    bands: [
      { minPct: 75, classification: "Dor abdominal funcional grave — intervir", color: "red", description: "Dor funcional incapacitante. Avalie ansiedade, abordagem cognitivo-comportamental e acompanhamento gastropediátrico." },
      { minPct: 50, classification: "Dor funcional moderada — investigar e tratar", color: "orange", description: "Dor frequente com impacto escolar. Investigue causas orgânicas e aborde fator emocional." },
      { minPct: 25, classification: "Dor funcional leve — monitorar", color: "amber", description: "Dor esporádica com componente funcional. Oriente criança e família sobre a relação corpo-emoção." },
      { minPct: 0, classification: "Sem dor abdominal funcional significativa", color: "emerald", description: "Queixa abdominal rara ou ausente sem impacto funcional." },
    ],
  },

  "j26-155": {
    instruction: "Para cada habilidade, marque o que melhor descreve a capacidade da criança de comunicar e lidar com a dor.",
    labels: ["Nao consegue / Ausente", "Com grande dificuldade", "Com alguma dificuldade", "Sem dificuldade"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_better",
    totalLabel: "Escore de comunicação e enfrentamento da dor",
    domains: [
      {
        name: "Comunicacao da Dor",
        items: [
          "Consegue dizer onde sente a dor",
          "Consegue descrever o tipo de dor (queimacao, pressao, pontada)",
          "Consegue dizer quando a dor comeca e termina",
          "Consegue comparar a intensidade da dor (mais forte, menos forte)",
          "Consegue usar escala de dor (faces ou numérica) com orientacao",
        ],
      },
      {
        name: "Estrategias de Enfrentamento",
        items: [
          "Usa respiracao ou relaxamento para lidar com a dor",
          "Pede ajuda de forma adequada quando sente dor",
          "Consegue manter algumas atividades mesmo com dor leve",
          "Nao entra em panico diante de dor moderada",
          "A criança confia que a dor vai melhorar",
          "A familia apoia sem superproteger a criança com dor",
        ],
      },
    ],
    bands: [
      { minPct: 85, classification: "Boa capacidade de comunicação e enfrentamento da dor", color: "emerald", description: "Criança comunica e enfrenta a dor de forma adaptativa. Reforce essas habilidades." },
      { minPct: 65, classification: "Capacidade em desenvolvimento — reforçar", color: "amber", description: "Algumas habilidades presentes. Ensine ferramentas adicionais de comunicação e regulação da dor." },
      { minPct: 45, classification: "Capacidade limitada — intervir", color: "orange", description: "Dificuldade em comunicar e lidar com a dor. Psicoeducação e técnicas de manejo da dor pediátrica." },
      { minPct: 0, classification: "Capacidade muito limitada — suporte especializado", color: "red", description: "Grande dificuldade em comunicar e enfrentar a dor. Avalie intervenção psicológica e comunicação alternativa." },
    ],
  },

  "j26-156": {
    instruction: "Para cada característica, marque se ocorre na dor da criança.",
    labels: ["Nao / Nunca", "As vezes", "Frequentemente", "Sempre"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "Escore de características de dor neuropática",
    domains: [
      {
        name: "Qualidade da Dor",
        items: [
          "A dor e descrita como queimacao ou ardencia",
          "A dor e descrita como choque eletrico ou facada",
          "A dor e descrita como formigamento ou dormencia",
          "A dor ocorre de forma espontanea, sem causa aparente",
          "A dor e continua ou muito frequente (nao episodica)",
          "A dor e intensa e desproporcional ao estimulo",
        ],
      },
      {
        name: "Fenomenos Sensoriais",
        items: [
          "Toque leve causa dor intensa (alodinia)",
          "Temperatura (frio ou calor) piora a dor",
          "A area dolorosa tem sensibilidade alterada (dormencia ou hipersensibilidade)",
          "A dor esta associada a fraqueza ou alteracao motora",
          "Ha historia de lesao neural ou condicao neurologica previa",
        ],
      },
    ],
    bands: [
      { minPct: 75, classification: "Alta suspeita de dor neuropática — investigar", color: "red", description: "Múltiplas características neuropáticas. Investigue causa (lesão neural, neuropatia) e inicie tratamento específico." },
      { minPct: 50, classification: "Características neuropáticas moderadas — avaliar", color: "orange", description: "Algumas características sugestivas. Avalie origem neurológica e considere tratamento adjuvante." },
      { minPct: 25, classification: "Características leves — monitorar", color: "amber", description: "Características neuropáticas leves ou inconclusivas. Monitore e reavalie." },
      { minPct: 0, classification: "Sem características neuropáticas significativas", color: "emerald", description: "Perfil de dor sem características neuropáticas dominantes." },
    ],
  },

  "j26-157": {
    instruction: "Para cada sinal de alerta, marque se está presente na cefaleia da criança.",
    labels: ["Ausente", "Presente mas raro", "Presente frequentemente", "Presente sempre"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "Escore de risco de cefaleia secundária",
    domains: [
      {
        name: "Sinais de Alerta Primários",
        items: [
          "Inicio subito e intenso (a pior dor de cabeca da vida)",
          "Piora progressiva ao longo de dias ou semanas",
          "Desacorda a criança do sono pela dor",
          "Associada a febre, rigidez de nuca ou fotofobia intensa",
          "Associada a vomito em jato sem nausea previa",
        ],
      },
      {
        name: "Sinais de Alerta Secundários",
        items: [
          "Mudanca recente no padrao ou carater habitual da cefaleia",
          "Associada a alteracoes neurologicas (fraqueza, visao dupla, ataxia)",
          "Piora com manobra de Valsalva (espirro, evacuacao, agachar)",
          "Cefaleia em criança menor de 3 anos",
          "Cefaleia em criança com historia de neoplasia, HIV ou imunossupressao",
          "Associada a papiledema ao exame de fundo de olho",
        ],
      },
    ],
    bands: [
      { minPct: 50, classification: "Sinal de alerta — investigação urgente", color: "red", description: "Um ou mais sinais de alerta presentes. Neuroimagem e investigação urgente para descartar causa secundária." },
      { minPct: 17, classification: "Sinal de alerta ocasional — avaliar com atenção", color: "orange", description: "Sinal de alerta esporádico. Avalie clinicamente e considere neuroimagem conforme contexto." },
      { minPct: 0, classification: "Sem sinais de alerta para cefaleia secundária", color: "emerald", description: "Perfil compatível com cefaleia primária. Mantenha investigação clínica habitual." },
    ],
  },

  "j26-158": {
    instruction: "Para cada aspecto das crises epilépticas, marque o que melhor descreve a situação atual.",
    labels: ["Nao / Nunca", "As vezes", "Frequentemente", "Sempre"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "Escore de gravidade das crises (percepção dos pais)",
    domains: [
      {
        name: "Frequência e Duração das Crises",
        items: [
          "As crises ocorrem mais de uma vez por semana",
          "As crises têm duração superior a 5 minutos",
          "Houve crises em série (2 ou mais crises sem recuperação entre elas)",
          "Precisou usar medicação de resgate (diazepam, midazolam) no último mês",
          "Houve internação por causa das crises nos últimos 6 meses",
        ],
      },
      {
        name: "Impacto das Crises",
        items: [
          "As crises causam quedas com risco de lesão",
          "A criança fica muito sonolenta ou confusa por longo tempo após a crise",
          "As crises ocorrem em momentos de risco (banho, piscina, altura)",
          "Os pais ficam em pânico ou com ansiedade intensa durante as crises",
          "A vida familiar foi drasticamente reorganizada por causa das crises",
          "A criança esta com medo de ter crises em público",
        ],
      },
    ],
    bands: [
      { minPct: 75, classification: "Crises de impacto grave — revisar tratamento", color: "red", description: "Crises frequentes ou graves com impacto severo. Revise medicação, ajuste dose e avalie cirurgia." },
      { minPct: 50, classification: "Crises de impacto moderado — otimizar", color: "orange", description: "Crises com impacto funcional. Otimize tratamento e avalie diagnóstico sindrômico." },
      { minPct: 25, classification: "Crises de impacto leve — monitorar", color: "amber", description: "Crises esporádicas com impacto leve. Monitore e reforce orientações de segurança." },
      { minPct: 0, classification: "Crises controladas ou sem impacto significativo", color: "emerald", description: "Boa resposta ao tratamento e crises sem impacto relevante na rotina." },
    ],
  },

  "j26-159": {
    instruction: "Para cada aspecto da adesão, marque o que melhor descreve a situação da família.",
    labels: ["Nunca / Nao faz", "As vezes", "Frequentemente", "Sempre / Sim"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_better",
    totalLabel: "Escore de adesão ao tratamento da epilepsia",
    domains: [
      {
        name: "Uso da Medicação",
        items: [
          "A criança toma a medicação todos os dias nos horários corretos",
          "Nunca ha esquecimento de dose no ultimo mes",
          "A familia mantem estoque suficiente da medicacao",
          "A criança consegue engolir o medicamento adequadamente",
          "A medicação e administrada pela mesma via sempre (oral, etc.)",
        ],
      },
      {
        name: "Seguimento e Comprometimento",
        items: [
          "A familia comparece a todas as consultas programadas",
          "Os pais compreendem o porquê do tratamento continuo",
          "A familia sabe o que fazer em caso de crise (plano de emergencia)",
          "Nao ha automedicacao ou suspensao sem orientacao medica",
          "A familia monitora a frequencia das crises em diario",
          "Os pais comunicam ao medico qualquer mudanca no padrao das crises",
        ],
      },
    ],
    bands: [
      { minPct: 85, classification: "Boa adesão ao tratamento", color: "emerald", description: "Adesão adequada. Mantenha seguimento e reforce a importância da continuidade." },
      { minPct: 65, classification: "Adesão parcial — identificar barreiras", color: "amber", description: "Algumas falhas de adesão. Identifique as barreiras e ofereça suporte." },
      { minPct: 45, classification: "Adesão insuficiente — intervir", color: "orange", description: "Adesão inadequada com risco de crises. Intervenção direta para resolver barreiras." },
      { minPct: 0, classification: "Adesão muito baixa — avaliar urgente", color: "red", description: "Adesão gravemente comprometida. Avalie causas, simplifique o regime e envolva a equipe social." },
    ],
  },

  "j26-160": {
    instruction: "Para cada aspecto, marque o que melhor descreve a qualidade de vida da criança com epilepsia.",
    labels: ["Muito ruim / Nunca", "Ruim / As vezes", "Bom / Frequentemente", "Muito bom / Sempre"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_better",
    totalLabel: "Escore de qualidade de vida na epilepsia",
    domains: [
      {
        name: "Funcionalidade Diária",
        items: [
          "A criança participa de atividades escolares normalmente",
          "A criança pratica atividades físicas e esportes",
          "A criança tem amigos e participa de atividades sociais",
          "A criança dorme bem e acorda descansada",
          "A criança se alimenta e tem peso adequado",
        ],
      },
      {
        name: "Bem-Estar Emocional",
        items: [
          "A criança esta feliz e satisfeita com a vida",
          "A criança nao tem medo excessivo de ter crises",
          "A familia nao superprotege a criança por causa da epilepsia",
          "A criança nao se sente diferente dos colegas por causa da doenca",
          "Os pais tem boa qualidade de vida e nao estao sobrecarregados",
          "A escola conhece e sabe como lidar com a epilepsia da criança",
        ],
      },
    ],
    bands: [
      { minPct: 85, classification: "Boa qualidade de vida com epilepsia", color: "emerald", description: "Criança e família com boa qualidade de vida apesar do diagnóstico. Mantenha suporte." },
      { minPct: 65, classification: "Qualidade de vida parcialmente comprometida", color: "amber", description: "Alguns aspectos afetados. Identifique os domínios comprometidos e intervenha." },
      { minPct: 45, classification: "Qualidade de vida significativamente comprometida", color: "orange", description: "Impacto importante na vida da criança e família. Abordagem multidisciplinar indicada." },
      { minPct: 0, classification: "Qualidade de vida muito comprometida — urgente", color: "red", description: "Criança e família com qualidade de vida muito ruim. Revisão completa do tratamento e suporte psicossocial." },
    ],
  },

  "j26-161": {
    instruction: "Para cada aspecto cognitivo, marque o que melhor descreve o desempenho da criança com epilepsia.",
    labels: ["Muito abaixo do esperado", "Abaixo do esperado", "Dentro do esperado", "Acima do esperado"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_better",
    totalLabel: "Escore cognitivo na epilepsia",
    domains: [
      {
        name: "Atençao e Memória",
        items: [
          "Mantem atencao em tarefas escolares por tempo adequado para a idade",
          "Memoriza conteudo escolar sem dificuldade desproporcional",
          "Nao perde o fio da conversa com frequencia",
          "Consegue seguir instrucoes em etapas multiplas",
          "A memoria de curto prazo e funcional para a faixa etaria",
        ],
      },
      {
        name: "Aprendizagem e Linguagem",
        items: [
          "O desempenho escolar esta adequado para a faixa etaria",
          "Le e escreve conforme o esperado para a serie",
          "Realiza calculos matematicos adequados para a serie",
          "A linguagem expressiva e receptiva esta dentro do esperado",
          "Nao houve regressao de habilidades cognitivas apos inicio da epilepsia",
          "A medicacao antiepileptica nao parece impactar o desempenho escolar",
        ],
      },
    ],
    bands: [
      { minPct: 85, classification: "Função cognitiva preservada na epilepsia", color: "emerald", description: "Cognição adequada. Mantenha acompanhamento e monitoring acadêmico." },
      { minPct: 65, classification: "Comprometimento cognitivo leve — acompanhar", color: "amber", description: "Dificuldades leves. Avalie o impacto da medicação e necessidade de suporte escolar." },
      { minPct: 45, classification: "Comprometimento moderado — investigar e apoiar", color: "orange", description: "Déficit cognitivo moderado. Investigação neuropsicológica e apoio pedagógico." },
      { minPct: 0, classification: "Comprometimento cognitivo grave — avaliação neuropsicológica", color: "red", description: "Déficit cognitivo grave. Avaliação neuropsicológica completa e revisão da síndrome epiléptica." },
    ],
  },

  "j26-162": {
    instruction: "Para cada potencial gatilho, marque se já foi identificado como fator precipitante de crises nesta criança.",
    labels: ["Nunca identificado", "Suspeito (pode ser)", "Provavel (ocorreu 2-3 vezes)", "Confirmado (ocorre sempre)"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "Escore de gatilhos identificados",
    domains: [
      {
        name: "Gatilhos Fisiológicos",
        items: [
          "Privacao de sono ou sono insuficiente",
          "Febre ou infeccao",
          "Hipoglicemia (ficar muito tempo sem comer)",
          "Estresse fisico intenso (esforco excessivo)",
          "Alteracoes hormonais (em adolescentes)",
          "Desidratacao",
        ],
      },
      {
        name: "Gatilhos Ambientais e Comportamentais",
        items: [
          "Luzes piscando ou estroboscopicas (fotossensibilidade)",
          "Estresse emocional intenso",
          "Esquecimento ou interrupcao da medicacao",
          "Uso de alcool ou substancias (em adolescentes)",
          "Estimulacao sensorial intensa (som alto, temperatura extrema)",
          "Padroes visuais especificos (televisao, video games)",
        ],
      },
    ],
    bands: [
      { minPct: 67, classification: "Múltiplos gatilhos identificados — intervenção preventiva", color: "red", description: "Muitos gatilhos confirmados. Plano de evitação e controle de gatilhos é prioritário." },
      { minPct: 33, classification: "Alguns gatilhos identificados — orientar", color: "amber", description: "Gatilhos presentes. Oriente família sobre controle dos fatores identificados." },
      { minPct: 0, classification: "Poucos gatilhos identificados", color: "emerald", description: "Poucos gatilhos claros. Continue monitorando e registrando no diário de crises." },
    ],
  },

  "j26-163": {
    instruction: "Para cada item do protocolo de emergência, marque se a família está preparada.",
    labels: ["Nao sabe / Nao tem", "Parcialmente preparada", "Preparada com duvidas", "Totalmente preparada"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_better",
    totalLabel: "Escore de preparo para emergência epiléptica",
    domains: [
      {
        name: "Conhecimento e Plano",
        items: [
          "Sabe reconhecer os diferentes tipos de crise desta criança",
          "Tem plano escrito de acao para crise em casa",
          "A escola tem o plano de emergencia e sabe como agir",
          "Sabe quando ligar para o SAMU/190 (crise > 5 min)",
          "Conhece a contraindicacao de colocar objeto na boca durante a crise",
        ],
      },
      {
        name: "Recursos e Prática",
        items: [
          "Tem medicacao de resgate em casa e na escola (diazepam, midazolam)",
          "Sabe administrar a medicacao de resgate corretamente",
          "Ja administrou a medicacao de resgate com sucesso ao menos uma vez",
          "Mantem registro das crises (data, horario, duracao, tipo)",
          "Tem contato direto com o medico para duvidas urgentes",
          "Revisa o plano de emergencia com o medico a cada consulta",
        ],
      },
    ],
    bands: [
      { minPct: 85, classification: "Família bem preparada para emergências", color: "emerald", description: "Família tem conhecimento e recursos para manejo de crises. Mantenha treinamento periódico." },
      { minPct: 65, classification: "Preparo parcial — reforçar treinamento", color: "amber", description: "Preparo incompleto em alguns aspectos. Reforce o treinamento e entregue o plano escrito." },
      { minPct: 45, classification: "Preparo insuficiente — treinar urgente", color: "orange", description: "Família com lacunas importantes no preparo. Treinamento estruturado urgente." },
      { minPct: 0, classification: "Família sem preparo — risco elevado", color: "red", description: "Família sem conhecimento nem recursos para emergência. Intervenção imediata de educação familiar." },
    ],
  },

  "j26-164": {
    instruction: "Para cada aspecto da dieta cetogênica, marque como está sendo realizado.",
    labels: ["Nao realizado / Ausente", "Realizado parcialmente", "Realizado com alguma dificuldade", "Realizado adequadamente"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_better",
    totalLabel: "Escore de monitorização da dieta cetogênica",
    domains: [
      {
        name: "Adesao e Implementação",
        items: [
          "A relacao gordura:proteinas+carboidratos esta sendo mantida (ex: 4:1)",
          "A familia pesa e mede os alimentos com precisao",
          "A criança esta em cetose verificada (cetonas urinárias ou sanguineas)",
          "Nao ha ingesta acidental de carboidratos em excesso",
          "A suplementacao de vitaminas e minerais esta sendo feita",
          "A ingestao hidrica esta adequada",
        ],
      },
      {
        name: "Efeitos e Monitorização",
        items: [
          "Houve reducao significativa das crises desde o inicio da dieta",
          "A criança esta crescendo e ganhando peso adequadamente",
          "Nao apresenta calculos renais (dor lombar, sangue na urina)",
          "Nao apresenta dislipidemia significativa (colesterol, triglicerides)",
          "A criança aceita a dieta sem recusa intensa",
          "A familia tem suporte de nutricionista experiente em dieta cetogenica",
        ],
      },
    ],
    bands: [
      { minPct: 85, classification: "Dieta cetogênica implementada adequadamente", color: "emerald", description: "Boa adesão e monitorização. Mantenha suporte nutricional e revisão periódica." },
      { minPct: 65, classification: "Implementação parcial — identificar barreiras", color: "amber", description: "Algumas dificuldades. Identifique os obstáculos e reforce o suporte da nutricionista." },
      { minPct: 45, classification: "Implementação inadequada — rever conduta", color: "orange", description: "Dificuldades frequentes. Reavalie a viabilidade da dieta e opções alternativas." },
      { minPct: 0, classification: "Dieta cetogênica não implementada ou abandonada", color: "red", description: "Dieta não sendo seguida. Avalie causas e discuta alternativas terapêuticas." },
    ],
  },

  "j26-165": {
    instruction: "Para cada efeito adverso potencial, marque se está presente e a intensidade desde o início do antiepiléptico atual.",
    labels: ["Ausente", "Leve (nao interfere)", "Moderado (interfere parcialmente)", "Grave (interfere muito)"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "Escore de efeitos adversos de antiepilépticos",
    domains: [
      {
        name: "Efeitos Cognitivos e Comportamentais",
        items: [
          "Lentidao de raciocinio ou dificuldade de concentracao",
          "Sonolencia excessiva durante o dia",
          "Irritabilidade, agressividade ou mudanca de humor",
          "Dificuldade de linguagem ou de encontrar palavras",
          "Piora do desempenho escolar desde o inicio da medicacao",
          "Agitacao, hiperatividade ou insonia (efeito paradoxal)",
        ],
      },
      {
        name: "Efeitos Físicos",
        items: [
          "Tontura ou ataxia (dificuldade de equilibrio)",
          "Ganho ou perda de peso significativo",
          "Tremor nas maos",
          "Nausea, vomito ou dor abdominal",
          "Visao dupla ou alteracao visual",
          "Reacao cutanea (rash, urticaria)",
        ],
      },
    ],
    bands: [
      { minPct: 75, classification: "Efeitos adversos graves — revisar medicação", color: "red", description: "Efeitos adversos graves comprometendo função. Revise dose, medicação ou troque o antiepiléptico." },
      { minPct: 50, classification: "Efeitos adversos moderados — monitorar e ajustar", color: "orange", description: "Efeitos moderados com impacto na qualidade de vida. Avalie ajuste de dose ou troca." },
      { minPct: 25, classification: "Efeitos adversos leves — monitorar", color: "amber", description: "Efeitos leves sem grande impacto. Monitore e reavalie em 4–8 semanas." },
      { minPct: 0, classification: "Sem efeitos adversos significativos", color: "emerald", description: "Boa tolerabilidade ao antiepiléptico atual. Mantenha e monitore." },
    ],
  },

  "j26-166": {
    instruction: "Para cada item, marque com que frequência ocorre na criança/adolescente com epilepsia.",
    labels: ["Nunca", "As vezes", "Frequentemente", "Sempre"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "Escore de depressão e epilepsia",
    domains: [
      {
        name: "Sintomas Depressivos",
        items: [
          "Esta triste, apatico ou sem energia com frequencia",
          "Perdeu interesse em atividades que antes gostava",
          "Isola-se socialmente e evita amigos",
          "Apresenta baixa autoestima relacionada a epilepsia",
          "Sente vergonha ou humilhacao por causa da epilepsia",
          "Tem pensamentos negativos sobre o futuro por causa da doenca",
        ],
      },
      {
        name: "Impacto e Fatores de Risco",
        items: [
          "A epilepsia impede a participacao em atividades que valoriza",
          "Foi vitima de bullying ou discriminacao por causa das crises",
          "Nao se identifica com colegas por causa das limitacoes da epilepsia",
          "Os antiepileticos podem estar contribuindo para o humor deprimido",
          "Ha historia familiar de depressao",
        ],
      },
    ],
    bands: [
      { minPct: 75, classification: "Depressão grave na epilepsia — encaminhar", color: "red", description: "Sintomas depressivos intensos. Avaliação psiquiátrica urgente e psicoterapia. Rastreie ideação suicida." },
      { minPct: 50, classification: "Depressão moderada — intervir", color: "orange", description: "Sintomas depressivos frequentes com impacto. Psicoterapia e avaliação de ajuste de medicação." },
      { minPct: 25, classification: "Sintomas leves — monitorar", color: "amber", description: "Humor levemente comprometido. Apoio psicoeducacional e monitoramento." },
      { minPct: 0, classification: "Sem sintomas depressivos significativos", color: "emerald", description: "Humor e motivação preservados apesar da epilepsia." },
    ],
  },

  "j26-167": {
    instruction: "Para cada aspecto da vida escolar, marque o que melhor descreve a situação da criança com epilepsia.",
    labels: ["Muito ruim / Nunca", "Ruim / As vezes", "Bom / Frequentemente", "Muito bom / Sempre"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_better",
    totalLabel: "Escore de inclusão escolar na epilepsia",
    domains: [
      {
        name: "Participação Escolar",
        items: [
          "Frequenta a escola regularmente (poucas faltas por causa da epilepsia)",
          "Participa de aulas de educacao fisica com seguranca",
          "Participa de atividades extracurriculares com os colegas",
          "A criança sente-se segura e acolhida na escola",
          "Nao sofre bullying ou discriminacao na escola",
        ],
      },
      {
        name: "Preparo da Escola",
        items: [
          "A escola tem o plano de acao para crises da criança",
          "Os professores sabem reconhecer uma crise e como agir",
          "A escola tem a medicacao de resgate e sabe como usa-la",
          "A escola faz adaptacoes quando necessario (tempo extra, nao dormir em campo)",
          "Os colegas foram educados sobre a epilepsia de forma adequada",
          "Ha comunicacao efetiva entre familia e escola sobre a epilepsia",
        ],
      },
    ],
    bands: [
      { minPct: 85, classification: "Inclusão escolar adequada na epilepsia", color: "emerald", description: "Criança bem incluída na escola. Mantenha comunicação família-escola e treinamento periódico." },
      { minPct: 65, classification: "Inclusão parcial — fortalecer", color: "amber", description: "Inclusão com algumas lacunas. Reforce o preparo da escola e o plano de ação." },
      { minPct: 45, classification: "Inclusão comprometida — intervir", color: "orange", description: "Importantes dificuldades de inclusão. Reunião com escola, orientação e plano escrito." },
      { minPct: 0, classification: "Exclusão escolar — urgente", color: "red", description: "Criança excluída ou com grave dificuldade de inclusão. Intervenção imediata com escola e rede de proteção." },
    ],
  },

  "j26-168": {
    instruction: "Para cada comportamento ou pensamento, marque com que frequência ocorre na criança.",
    labels: ["Nunca", "As vezes", "Frequentemente", "Todos os dias / Sempre"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "Escore de triagem de TOC infantil",
    domains: [
      {
        name: "Obsessoes",
        items: [
          "Tem pensamentos ruins, feios ou assustadores que entram na cabeca sem querer",
          "Tem medo excessivo de contaminar ou ser contaminada por germes",
          "Fica com duvida excessiva se fez algo certo (fechou a porta, apagou a luz)",
          "Tem medo excessivo de fazer algo de errado ou pecado",
          "Pensa demais em coisas simetricas, organizadas ou na ordem exata",
        ],
      },
      {
        name: "Compulsoes e Impacto",
        items: [
          "Precisa lavar as maos repetidamente (mais de 10 vezes ao dia)",
          "Verifica repetidamente tomadas, portas, objetos",
          "Organiza ou arranja objetos de forma muito rigida e repete se nao ficou certo",
          "Repete acoes, palavras ou oracoes de forma ritual",
          "Os rituais tomam mais de 1 hora por dia",
          "Fica muito angustiada se interrompida nos rituais",
        ],
      },
    ],
    bands: [
      { minPct: 75, classification: "Alta suspeita de TOC — encaminhar", color: "red", description: "Sintomas intensos e frequentes compatíveis com TOC. Encaminhe para avaliação psiquiátrica e TCC." },
      { minPct: 50, classification: "Sintomas moderados — investigar", color: "orange", description: "Obsessões e compulsões moderadas. Avaliação psicológica estruturada indicada." },
      { minPct: 25, classification: "Sintomas leves — monitorar", color: "amber", description: "Alguns rituais ou pensamentos intrusivos. Monitore e avalie se há progressão." },
      { minPct: 0, classification: "Sem indicação de TOC", color: "emerald", description: "Comportamentos rituais abaixo do limiar clínico." },
    ],
  },

  "j26-169": {
    instruction: "Para cada sintoma, marque com que frequência ocorre na criança nos últimos 30 dias.",
    labels: ["Nunca", "As vezes", "Frequentemente", "Sempre"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "Escore de sintomas de PTSD infantil",
    domains: [
      {
        name: "Revivência e Evitação",
        items: [
          "Tem pesadelos ou sonhos assustadores sobre o evento traumatico",
          "Age ou sente como se o evento fosse acontecer de novo (flashback)",
          "Fica muito angustiada ao ver ou ouvir coisas que lembram o evento",
          "Evita falar, pensar ou ir a lugares que lembram o que aconteceu",
          "Nao consegue lembrar de partes importantes do evento traumatico",
        ],
      },
      {
        name: "Alterações de Humor e Reatividade",
        items: [
          "Perdeu interesse em brincar ou em atividades que antes gostava",
          "Parece distante, entorpecida emocionalmente ou desconectada",
          "Tem dificuldade de sentir emocoes positivas (alegria, amor)",
          "Fica com medo ou em estado de alerta constante sem motivo claro",
          "Apresenta reacoes exageradas a ruidos ou surpresas (hipervigilancia)",
          "Tem dificuldade de dormir ou de se concentrar",
        ],
      },
    ],
    bands: [
      { minPct: 75, classification: "Alta suspeita de PTSD — encaminhar urgente", color: "red", description: "Sintomas intensos compatíveis com PTSD. Encaminhamento urgente para psicoterapia traumafocada." },
      { minPct: 50, classification: "Sintomas moderados — avaliação psicológica", color: "orange", description: "Sintomas frequentes após evento traumático. Avaliação psicológica estruturada indicada." },
      { minPct: 25, classification: "Sintomas leves — monitorar e apoiar", color: "amber", description: "Reação ao trauma presente mas leve. Suporte, psicoeducação e monitoramento." },
      { minPct: 0, classification: "Sem indicação de PTSD", color: "emerald", description: "Poucos sintomas. Criança recuperando-se adequadamente do evento." },
    ],
  },

  "j26-170": {
    instruction: "Para cada comportamento, marque se ocorre durante episódios de agitação intensa da criança.",
    labels: ["Nunca", "As vezes", "Frequentemente", "Sempre"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "Escore de sintomas maníacos infantis",
    domains: [
      {
        name: "Humor e Energia",
        items: [
          "Apresenta humor euforico ou irritavel intenso e persistente (dias seguidos)",
          "Fica com energia excessiva, nao cansa mesmo dormindo pouco",
          "Diminuiu significativamente a necessidade de sono sem ficar cansada",
          "Fala muito mais que o habitual, sem conseguir parar",
          "Os pensamentos parecem acelerados e ela pula de assunto em assunto",
          "Tem grandiosidade — diz que e especial, poderosa ou que pode fazer tudo",
        ],
      },
      {
        name: "Comportamento e Impulsividade",
        items: [
          "Tem impulsividade extrema e age sem pensar nas consequencias",
          "Engaja em comportamentos de risco (escalar coisas, gastos excessivos)",
          "Fica muito irritada, explosiva e dificil de controlar",
          "O comportamento muda drasticamente em relacao ao habitual",
          "O episodio dura mais de 3 dias de forma persistente",
        ],
      },
    ],
    bands: [
      { minPct: 75, classification: "Alta suspeita de mania infantil — avaliação psiquiátrica urgente", color: "red", description: "Sintomas intensos sugestivos de episódio maníaco. Avaliação psiquiátrica urgente e considere hospitalização." },
      { minPct: 50, classification: "Sintomas moderados — investigar", color: "orange", description: "Alterações de humor e comportamento frequentes. Avaliação psiquiátrica estruturada indicada." },
      { minPct: 25, classification: "Sintomas leves — monitorar", color: "amber", description: "Alterações leves que podem ter outras causas. Monitore a evolução e contexto." },
      { minPct: 0, classification: "Sem indicação de mania", color: "emerald", description: "Humor e comportamento sem características maníacas." },
    ],
  },

  "j26-171": {
    instruction: "Para cada sinal, marque se está presente no adolescente nos últimos 12 meses.",
    labels: ["Ausente / Nunca", "Leve / As vezes", "Moderado / Frequentemente", "Grave / Sempre"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "Escore de risco de psicose no adolescente",
    domains: [
      {
        name: "Sintomas Psicóticos Atenuados",
        items: [
          "Tem percepcoes incomuns — ve, ouve ou sente coisas que outros nao percebem",
          "Tem pensamentos estranhos ou magicos que ele sabe que sao improvayeis",
          "Parece desconfiado ou acredita que as pessoas estao falando mal ou conspirando",
          "A comunicacao ficou confusa, dificil de entender ou com saltos ilogicos",
          "Experimenta momentos em que a realidade parece estranha ou irreal",
        ],
      },
      {
        name: "Declínio Funcional",
        items: [
          "Houve queda significativa no desempenho escolar",
          "Isolou-se socialmente de amigos e familia",
          "A higiene pessoal e o autocuidado pioraram significativamente",
          "Houve mudanca dramatica na personalidade ou no funcionamento",
          "Ha uso de cannabis ou outras substancias psicoativas",
          "Ha historia familiar de esquizofrenia ou transtorno bipolar",
        ],
      },
    ],
    bands: [
      { minPct: 67, classification: "Risco alto de psicose — avaliação psiquiátrica urgente", color: "red", description: "Múltiplos sinais de estado mental de alto risco. Avaliação psiquiátrica urgente obrigatória." },
      { minPct: 33, classification: "Risco moderado — investigar", color: "orange", description: "Sintomas atenuados presentes. Avaliação psiquiátrica estruturada em breve." },
      { minPct: 0, classification: "Risco baixo — monitorar", color: "emerald", description: "Poucos sinais. Monitore e mantenha seguimento." },
    ],
  },

  "j26-172": {
    instruction: "Para cada item, marque o que melhor descreve o uso de substâncias pelo adolescente nos últimos 12 meses.",
    labels: ["Nunca", "1-2 vezes (experimental)", "Algumas vezes por mes", "Uso frequente (semanal ou mais)"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "Escore de uso de substâncias no adolescente",
    domains: [
      {
        name: "Tipo de Substância",
        items: [
          "Alcool (cerveja, vinho, destilados)",
          "Tabaco ou cigarro eletronico",
          "Cannabis (maconha, skunk)",
          "Inalantes (cola, thinner, lanca-perfume)",
          "Estimulantes (cocaina, crack, anfetaminas)",
          "Medicamentos sem prescricao usados para alterar o estado mental",
        ],
      },
      {
        name: "Impacto e Risco",
        items: [
          "O uso de substancias interfere no desempenho escolar",
          "O uso ocorre para lidar com emocoes dificeis (ansiedade, tristeza, raiva)",
          "Ja teve problemas com a lei ou familia por causa do uso",
          "Tenta parar ou reduzir mas nao consegue",
          "O uso esta associado a comportamentos de risco (sexo sem protecao, direcao)",
          "Ha dependencia fisica — mal-estar ao parar de usar",
        ],
      },
    ],
    bands: [
      { minPct: 75, classification: "Uso problemático de substâncias — intervenção urgente", color: "red", description: "Uso frequente com impacto grave. Avaliação por equipe de saúde mental e intervenção motivacional." },
      { minPct: 50, classification: "Uso de risco — intervir", color: "orange", description: "Uso regular com impacto. Intervenção breve motivacional e acompanhamento próximo." },
      { minPct: 25, classification: "Uso experimental — orientar e monitorar", color: "amber", description: "Uso experimental sem impacto grave. Psicoeducação sobre riscos e monitoramento." },
      { minPct: 0, classification: "Sem uso de substâncias", color: "emerald", description: "Adolescente sem uso de substâncias psicoativas." },
    ],
  },

  "j26-173": {
    instruction: "Para cada sintoma, marque com que frequência ocorre na criança.",
    labels: ["Nunca", "Raramente", "As vezes", "Frequentemente"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "Escore de sintomas dissociativos infantis",
    domains: [
      {
        name: "Experiências Dissociativas",
        items: [
          "Parece estar em outro mundo, devaneando por longos periodos",
          "Nao recorda de acoes ou eventos recentes (amnesia dissociativa)",
          "Parece ter identidades ou estados diferentes (muda de nome, comportamento, voz)",
          "Fala sobre si mesma na terceira pessoa ou com nomes diferentes",
          "Descreve experiencias de estar fora do corpo ou vendo a si mesma de fora",
          "Refere que objetos, pessoas ou o proprio corpo parecem irreais",
        ],
      },
      {
        name: "Impacto e Contexto",
        items: [
          "Os episodios ocorrem em situacao de estresse ou ansiedade",
          "Ha historia de trauma fisico ou emocional",
          "Os episodios interferem no funcionamento escolar",
          "A criança nao tem memoria do que fez durante os episodios",
          "Ha relatos de alucinacoes auditivas (vozes) sem base organica",
        ],
      },
    ],
    bands: [
      { minPct: 67, classification: "Sintomas dissociativos graves — avaliação psiquiátrica", color: "red", description: "Dissociação intensa sugerindo trauma grave. Avaliação psiquiátrica e psicoterapia traumafocada urgente." },
      { minPct: 42, classification: "Sintomas moderados — investigar", color: "orange", description: "Dissociação moderada com impacto funcional. Avaliação psicológica e rastreio de trauma." },
      { minPct: 17, classification: "Sintomas leves — monitorar", color: "amber", description: "Sintomas leves. Avalie contexto de vida e monitore. Pode ser variante do desenvolvimento." },
      { minPct: 0, classification: "Sem sintomas dissociativos significativos", color: "emerald", description: "Consciência e memória integradas dentro do esperado." },
    ],
  },

  "j26-174": {
    instruction: "Para cada característica emocional, marque o que melhor descreve o adolescente.",
    labels: ["Raramente / Nao se aplica", "As vezes", "Frequentemente", "Sempre / Muito intenso"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "Escore de intensidade de traços emocionais do adolescente",
    domains: [
      {
        name: "Instabilidade Emocional",
        items: [
          "Humor muda rapidamente e de forma intensa (euforia para tristeza em minutos)",
          "Pequenas frustracoes geram reacoes emocionais desproporcionais",
          "Tem dificuldade de tolerar a solidao ou estar sem alguem proximo",
          "Oscila entre idealizar e desvalorizar as pessoas proximas",
          "O senso de identidade parece instavel ou confuso",
          "Toma decisoes impulsivas que depois lamenta",
        ],
      },
      {
        name: "Relacionamentos e Comportamento",
        items: [
          "Tem relacionamentos intensos e instaveis",
          "Apresenta comportamento autodestrutivo (arranha, corta ou bate em si mesmo)",
          "Tem sentimentos cronicos de vazio ou inutilidade",
          "Faz coisas extremas para evitar o abandono real ou imaginado",
          "Tem raiva intensa e dificuldade de controla-la",
        ],
      },
    ],
    bands: [
      { minPct: 75, classification: "Traços emocionais intensos — avaliação psiquiátrica", color: "red", description: "Instabilidade emocional grave. Avaliação psiquiátrica para descartar TLP e outros transtornos de personalidade." },
      { minPct: 50, classification: "Traços moderados — intervenção psicológica", color: "orange", description: "Instabilidade frequente. Psicoterapia dialético-comportamental (DBT) ou similar indicada." },
      { minPct: 25, classification: "Traços leves — monitorar", color: "amber", description: "Intensidade emocional típica da adolescência. Psicoeducação e suporte." },
      { minPct: 0, classification: "Regulação emocional dentro do esperado", color: "emerald", description: "Traços emocionais sem intensidade patológica." },
    ],
  },
"j26-175": {
    instruction: "Para cada habilidade emocional, marque o que melhor descreve a criança.",
    labels: ["Nao demonstra / Ausente", "Demonstra raramente", "Demonstra as vezes", "Demonstra consistentemente"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_better",
    totalLabel: "Escore de inteligência emocional infantil",
    domains: [
      {
        name: "Autoconhecimento e Regulacao",
        items: [
          "Reconhece e nomeia as proprias emocoes (alegria, tristeza, raiva, medo)",
          "Sabe quando esta com raiva antes de explodir",
          "Usa estrategias para se acalmar (respirar, contar, se afastar)",
          "Pede ajuda quando se sente sobrecarregada emocionalmente",
          "Demonstra empatia — se coloca no lugar do outro",
          "Reconhece emocoes nas expressoes faciais de outras pessoas",
        ],
      },
      {
        name: "Habilidades Socioemocionais",
        items: [
          "Resolve conflitos com colegas sem agressao fisica ou verbal",
          "Aceita regras e limites sem reacao desproporcional",
          "Consegue esperar sua vez em situacoes de grupo",
          "Demonstra gratidao e reconhece quando alguem a ajuda",
          "Adapta o comportamento conforme o contexto (escola, casa, festa)",
        ],
      },
    ],
    bands: [
      { minPct: 85, classification: "Boa inteligência emocional para a faixa etária", color: "emerald", description: "Habilidades emocionais bem desenvolvidas. Incentive a continuidade e amplificação." },
      { minPct: 65, classification: "Desenvolvimento emocional adequado — reforçar", color: "amber", description: "Habilidades em desenvolvimento. Estimule com histórias, jogos e conversas sobre emoções." },
      { minPct: 45, classification: "Dificuldades emocionais — intervir", color: "orange", description: "Lacunas importantes. Programa de habilidades socioemocionais ou psicoterapia." },
      { minPct: 0, classification: "Dificuldades emocionais graves — suporte especializado", color: "red", description: "Déficit emocional significativo. Avaliação e intervenção psicológica especializada." },
    ],
  },

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

  "j26-177": {
    instruction: "Para cada sintoma, marque com que frequência ocorre no adolescente nos últimos 30 dias.",
    labels: ["Nunca", "As vezes", "Frequentemente", "Sempre"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "Escore de sintomas de PTSD no adolescente",
    domains: [
      {
        name: "Revivência e Evitação",
        items: [
          "Tem pesadelos ou flashbacks intrusivos sobre o evento traumatico",
          "Evita ativamente pensamentos, lugares ou pessoas ligados ao trauma",
          "Reage com angustia intensa a lembrancas do trauma",
          "Apresenta amnesia parcial ou total de aspectos importantes do trauma",
          "Sente culpa ou vergonha excessiva sobre o que aconteceu",
          "Tem visao negativa persistente de si mesmo e do mundo desde o trauma",
        ],
      },
      {
        name: "Hiperativacao e Impacto Funcional",
        items: [
          "Fica em estado de alerta constante, como se o perigo nao tivesse passado",
          "Tem reacoes de susto exageradas",
          "Tem dificuldade de concentracao na escola apos o trauma",
          "Tem comportamento irritavel ou explosivo que nao tinha antes",
          "Usa substancias para lidar com as memorias do trauma",
          "O funcionamento escolar ou social piorou significativamente apos o trauma",
        ],
      },
    ],
    bands: [
      { minPct: 75, classification: "Alta suspeita de PTSD — psicoterapia urgente", color: "red", description: "PTSD grave com impacto funcional severo. Psicoterapia traumafocada (TCC-TF ou EMDR) urgente." },
      { minPct: 50, classification: "Sintomas moderados — avaliacao psicologica", color: "orange", description: "Sintomas frequentes após trauma. Avaliação psicológica e início de intervenção." },
      { minPct: 25, classification: "Sintomas leves — monitorar e apoiar", color: "amber", description: "Reação ao trauma leve. Psicoeducação e monitoramento." },
      { minPct: 0, classification: "Sem PTSD significativo", color: "emerald", description: "Adolescente superando o evento de forma adaptativa." },
    ],
  },

  "j26-178": {
    instruction: "ATENÇÃO: Esta avaliação é para uso clínico exclusivo. Para cada item, marque o que melhor descreve o adolescente nos últimos 30 dias.",
    infoBox: "AVISO CLÍNICO: Esta escala identifica risco de suicídio. Qualquer item de alta gravidade requer avaliação clínica imediata. Não substitui avaliação psiquiátrica presencial.",
    labels: ["Ausente / Nunca", "Presente raramente", "Presente frequentemente", "Presente sempre / Grave"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "Escore de risco de suicídio",
    domains: [
      {
        name: "Pensamentos e Ideação",
        items: [
          "Pensa que seria melhor estar morto ou que outros estariam melhor sem ele/ela",
          "Tem pensamentos de se machucar ou de tirar a propria vida",
          "Tem plano especifico sobre como se machucar",
          "Tem acesso a meios para se machucar (remedios, objetos cortantes)",
          "Ja tentou se machucar ou tentou suicidio anteriormente",
        ],
      },
      {
        name: "Fatores de Risco",
        items: [
          "Perdeu alguem por suicidio (luto por suicidio)",
          "Sente-se completamente desesperancoso — acredita que nada vai melhorar",
          "Sente-se um fardo para a familia e amigos",
          "Esta sozinho e isolado sem suporte social",
          "Usa alcool ou drogas para lidar com a dor emocional",
          "Comunica direta ou indiretamente o desejo de morrer",
        ],
      },
    ],
    bands: [
      { minPct: 42, classification: "RISCO ALTO — avaliação psiquiátrica imediata", color: "red", description: "URGÊNCIA: Presença de ideação, plano ou tentativa prévia. Avaliação psiquiátrica imediata. Não deixe o adolescente sozinho." },
      { minPct: 17, classification: "Risco moderado — avaliação psiquiátrica em 24–48 h", color: "orange", description: "Fatores de risco importantes presentes. Avaliação psiquiátrica em 24–48 horas. Remova meios de acesso." },
      { minPct: 0, classification: "Risco baixo — monitorar com atenção", color: "amber", description: "Alguns fatores de risco sem ideação ativa. Monitore, fortaleça rede de apoio e reavalie." },
    ],
  },

  "j26-179": {
    instruction: "Para cada item, marque com que frequência ocorre na criança.",
    labels: ["Nunca", "As vezes (menos de 2x/semana)", "Frequentemente (mais de 2x/semana)", "Sempre (diariamente)"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "Escore de enurese e encoprese",
    domains: [
      {
        name: "Enurese",
        items: [
          "Faz xixi na cama durante o sono (enurese noturna)",
          "Faz xixi nas roupas durante o dia (enurese diurna)",
          "Nao consegue segurar a urina com urgencia repentina",
          "A enurese noturna ocorre apos periodo de pelo menos 6 meses sem molhar a cama",
          "Ja tem mais de 5 anos e ainda molha a cama regularmente",
          "A enurese causa sofrimento ou constrangimento a criança",
        ],
      },
      {
        name: "Encoprese e Impacto",
        items: [
          "Faz coco nas roupas sem perceber ou sem chegar ao banheiro a tempo",
          "Retém fezes por medo de ir ao banheiro ou de sentir dor",
          "Tem constipacao cronica associada a encoprese",
          "Evita ir a escola ou festas por medo de ter acidente",
          "Ha conflito familiar significativo em torno da enurese ou encoprese",
          "A criança ja foi avaliada e causas organicas foram descartadas",
        ],
      },
    ],
    bands: [
      { minPct: 67, classification: "Enurese/encoprese grave — tratamento estruturado", color: "red", description: "Frequência alta com impacto social. Tratamento comportamental estruturado e avaliação de causas orgânicas." },
      { minPct: 33, classification: "Enurese/encoprese moderada — intervir", color: "orange", description: "Frequência moderada com impacto. Intervenção comportamental, higiene intestinal e urinária." },
      { minPct: 0, classification: "Enurese/encoprese leve ou ausente", color: "emerald", description: "Controle esfincteriano adequado para a faixa etária ou episódios raros sem impacto." },
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

  "j26-182": {
    instruction: "Para cada item, marque com que frequência ocorre com o cuidador principal.",
    labels: ["Nunca", "As vezes", "Frequentemente", "Sempre"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "Escore de sobrecarga do cuidador",
    domains: [
      {
        name: "Sobrecarga Fisica e Emocional",
        items: [
          "Sente-se exausto fisicamente por causa dos cuidados com a crianca",
          "Sente-se esgotado emocionalmente por causa da situacao",
          "Nao tem tempo para o proprio lazer ou descanso",
          "Negligencia a propria saude por causa dos cuidados com a crianca",
          "Sente que nao tem mais energia para continuar",
          "Tem sintomas de ansiedade ou depressao relacionados a situacao",
        ],
      },
      {
        name: "Impacto Social e Familiar",
        items: [
          "Abdicou do trabalho ou reducao de carga para cuidar da crianca",
          "Sente-se isolado socialmente por causa da situacao",
          "A relacao conjugal esta comprometida pelos cuidados",
          "Os outros filhos estao sendo afetados pela atencao dispensada a crianca especial",
          "Sente culpa excessiva mesmo fazendo tudo que pode",
          "Nao recebe apoio suficiente da familia ampliada",
        ],
      },
    ],
    bands: [
      { minPct: 75, classification: "Sobrecarga grave — suporte urgente ao cuidador", color: "red", description: "Cuidador em colapso. Intervenção urgente: suporte psicológico, serviço social e rede de apoio." },
      { minPct: 50, classification: "Sobrecarga moderada — intervir", color: "orange", description: "Sobrecarga frequente com impacto na saúde do cuidador. Psicoeducação e estratégias de apoio." },
      { minPct: 25, classification: "Sobrecarga leve — monitorar e apoiar", color: "amber", description: "Sobrecarga presente mas manejável. Orientações sobre autocuidado e rede de suporte." },
      { minPct: 0, classification: "Cuidador com boa capacidade de manejo", color: "emerald", description: "Cuidador com boa resiliência e suporte. Mantenha acompanhamento." },
    ],
  },

  "j26-183": {
    instruction: "Para cada aspecto da qualidade de vida familiar, marque o que melhor descreve a situação.",
    labels: ["Muito ruim / Sempre comprometido", "Ruim / Frequentemente comprometido", "Bom / As vezes comprometido", "Muito bom / Raramente comprometido"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_better",
    totalLabel: "Escore de qualidade de vida familiar no TEA/TDAH",
    domains: [
      {
        name: "Dinamica e Funcionamento Familiar",
        items: [
          "A rotina familiar funciona apesar das demandas do filho com TEA/TDAH",
          "A relacao conjugal esta preservada apos o diagnostico",
          "Os irmaos nao estao sendo prejudicados pela atencao ao filho com TEA/TDAH",
          "A familia consegue sair e participar de atividades de lazer juntos",
          "Ha momentos de alegria e qualidade de vida positiva na familia",
        ],
      },
      {
        name: "Suporte e Adaptação",
        items: [
          "A familia recebeu informacoes suficientes sobre o diagnostico",
          "A familia tem acesso aos servicos de saude e terapias necessarios",
          "A escola coopera com a familia no manejo do filho",
          "A familia tem rede de apoio (avos, amigos, grupos de pais)",
          "Os pais sentem que estao progredindo no manejo do filho",
          "A familia nao sente vergonha ou esconde o diagnostico",
        ],
      },
    ],
    bands: [
      { minPct: 85, classification: "Boa qualidade de vida familiar", color: "emerald", description: "Família bem adaptada ao diagnóstico. Mantenha suporte e fortaleça a rede." },
      { minPct: 65, classification: "Qualidade de vida parcialmente comprometida", color: "amber", description: "Alguns aspectos afetados. Identifique as áreas de maior necessidade e ofereça suporte." },
      { minPct: 45, classification: "Qualidade de vida significativamente comprometida", color: "orange", description: "Impacto importante em múltiplas áreas. Grupo de pais, apoio social e psicoeducação intensiva." },
      { minPct: 0, classification: "Qualidade de vida muito comprometida — urgente", color: "red", description: "Família em crise. Avaliação urgente de necessidades e articulação de rede de suporte." },
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

  "j26-188": {
    instruction: "Para cada meta terapêutica estabelecida na consulta, marque o nível de alcance no período avaliado.",
    labels: ["Nao iniciado / Sem progresso", "Progresso inicial", "Progresso significativo", "Meta alcancada"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_better",
    totalLabel: "Escore de alcance de metas terapêuticas",
    domains: [
      {
        name: "Metas Funcionais",
        items: [
          "Meta 1: habilidade de comunicacao definida na ultima consulta",
          "Meta 2: habilidade motora ou de AVD definida na ultima consulta",
          "Meta 3: habilidade escolar ou cognitiva definida na ultima consulta",
          "Meta 4: comportamento ou regulacao emocional definida na ultima consulta",
          "Meta 5: participacao social ou comunitaria definida na ultima consulta",
        ],
      },
      {
        name: "Engajamento e Processo",
        items: [
          "A familia compreendeu e aceitou as metas estabelecidas",
          "As metas foram trabalhadas nas terapias e na rotina em casa",
          "Houve colaboracao entre os diferentes terapeutas nas metas",
          "A escola foi envolvida nas metas escolares definidas",
          "Ha registro do progresso ao longo do periodo (diario, fotos, videos)",
          "As metas serao revisadas e atualizadas nesta consulta",
        ],
      },
    ],
    bands: [
      { minPct: 85, classification: "Excelente alcance de metas terapêuticas", color: "emerald", description: "Metas atingidas. Estabeleça novas metas desafiadoras e celebre o progresso." },
      { minPct: 65, classification: "Bom progresso — manter e ajustar", color: "amber", description: "Progresso positivo. Identifique barreiras nas metas não alcançadas e ajuste estratégias." },
      { minPct: 45, classification: "Progresso parcial — revisar metas", color: "orange", description: "Progresso limitado. Revise a viabilidade das metas e os recursos disponíveis." },
      { minPct: 0, classification: "Sem progresso — revisão urgente", color: "red", description: "Pouco ou nenhum progresso. Revisão completa do plano, metas e engajamento familiar." },
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

  "j26-190": {
    instruction: "Para cada fator de risco neonatal, marque se está presente na história do recém-nascido.",
    labels: ["Ausente", "Presente (leve)", "Presente (moderado)", "Presente (grave)"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "Escore de risco neonatal para neurodesenvolvimento",
    domains: [
      {
        name: "Fatores Perinatais",
        items: [
          "Prematuridade (idade gestacional < 34 semanas)",
          "Peso ao nascer < 1500 g (muito baixo peso)",
          "Asfixia perinatal (Apgar < 7 no 5o minuto ou necessidade de reanimacao)",
          "Convulsoes neonatais",
          "Hemorragia intraventricular graus III ou IV (EEG ou USG)",
          "Leucomalacia periventricular na neuroimagem",
        ],
      },
      {
        name: "Fatores Clinicos e Ambientais",
        items: [
          "Infeccao congenita (TORSCH — toxoplasmose, rubeola, CMV, sifilis, herpes)",
          "Hiperbilirrubinemia grave com necessidade de exsanguinotransfusao",
          "Malformacao cerebral identificada",
          "Internacao em UTI neonatal por mais de 7 dias",
          "Exposicao a drogas ou alcool na gestacao",
          "Vulnerabilidade social extrema — sem suporte familiar adequado",
        ],
      },
    ],
    bands: [
      { minPct: 67, classification: "Risco alto — follow-up intensivo obrigatório", color: "red", description: "Múltiplos fatores de risco grave. Follow-up neuropediátrico mensal e equipe multidisciplinar desde a alta." },
      { minPct: 33, classification: "Risco moderado — follow-up regular", color: "orange", description: "Fatores de risco moderados. Follow-up trimestral com neuropediatra e monitoramento do desenvolvimento." },
      { minPct: 0, classification: "Risco baixo — seguimento de rotina", color: "emerald", description: "Poucos fatores de risco. Seguimento pediátrico de rotina com vigilância do desenvolvimento." },
    ],
  },

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

  "j26-193": {
    instruction: "Para cada indicador, marque o que foi observado no neonato durante o procedimento doloroso.",
    labels: ["Ausente", "Leve", "Moderado", "Intenso"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "Escore de dor neonatal",
    domains: [
      {
        name: "Indicadores Comportamentais",
        items: [
          "Expressao facial de dor (sobrancelhas franzidas, olhos cerrados, sulco nasolabial)",
          "Choro intenso ou grilos agudos de dor",
          "Rigidez ou tremores corporais",
          "Retracao ou flexao dos membros em resposta ao estimulo doloroso",
          "Agitacao ou inquietacao intensa durante o procedimento",
        ],
      },
      {
        name: "Indicadores Fisiológicos",
        items: [
          "Frequencia cardiaca > 180 bpm durante o procedimento",
          "Frequencia respiratoria > 60 irpm durante o procedimento",
          "Dessaturacao (SpO2 < 90%) durante o procedimento",
          "Palidez ou rubor intenso durante o procedimento",
          "Suor nas palmas das maos",
          "Recuperacao lenta apos o termino do estimulo doloroso (> 2 minutos)",
        ],
      },
    ],
    bands: [
      { minPct: 67, classification: "Dor neonatal intensa — intervenção imediata", color: "red", description: "Dor intensa. Medidas de conforto (sucrose, sucção não nutritiva, posicionamento) e analgesia indicadas." },
      { minPct: 33, classification: "Dor moderada — medidas de conforto", color: "orange", description: "Dor moderada presente. Implemente medidas não farmacológicas e avalie analgesia." },
      { minPct: 0, classification: "Dor leve ou ausente", color: "emerald", description: "Poucos indicadores de dor. Mantenha medidas preventivas de conforto." },
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
