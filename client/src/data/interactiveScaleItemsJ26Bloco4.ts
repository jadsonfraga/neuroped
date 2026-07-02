import type { InteractiveScaleDef } from "./interactiveScaleItems";

export const j26Bloco4Items: Record<string, InteractiveScaleDef> = {

  // ── j26-196 — Ansiedade Pais UTIN ──
  // ── j26-197 — Icterícia Neonatal Seguimento ──
  // ── j26-198 — Estimulante Efeitos Acompanhamento ──
  // ── j26-199 — Antiepiléptico Monitorização Ampla ──
  // ── j26-200 — Antipsicótico Metabólico ──
  // ── j26-201 — Prematuridade Seguimento Global ──
  "j26-201": {
    instruction: "Avalie o desenvolvimento global do prematuro nesta consulta. Marque o que esta presente ou parcialmente presente para a idade corrigida.",
    infoBox: "Seguimento neurologico global de prematuros. Maior pontuacao = mais habilidades presentes. Nao e diagnostico.",
    labels: ["Nao observado", "Emergente", "Parcial", "Adequado"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_better",
    totalLabel: "Desenvolvimento global do prematuro (maior = melhor)",
    bands: [
      { minPct: 85, classification: "Desempenho adequado", color: "emerald", description: "Maioria dos marcos presentes para a idade corrigida. Mantenha vigilancia de rotina." },
      { minPct: 60, classification: "Em desenvolvimento - vigiar", color: "amber", description: "Ha habilidades presentes mas algumas areas merecem atencao. Reavalie em 1-2 meses." },
      { minPct: 40, classification: "Atraso possivel - reavaliar", color: "orange", description: "Desempenho abaixo do esperado para a idade corrigida. Considere avaliacao dirigida." },
      { minPct: 0, classification: "Atraso provavel - encaminhar", color: "red", description: "Poucas habilidades presentes. Investigar e encaminhar para estimulacao precoce." },
    ],
    domains: [
      {
        name: "Motor e tonus (idade corrigida)",
        color: "text-teal-600 dark:text-teal-400",
        items: [
          "Tonus muscular adequado para a idade corrigida",
          "Marco motor compativel com a faixa etaria corrigida",
          "Ausencia de assimetria motora relevante",
          "Sem sinais de paralisia cerebral ou espasticidade",
          "Transferencia de peso e sustentacao conforme esperado",
          "Motor fino emergindo conforme a idade corrigida",
        ],
      },
      {
        name: "Cognitivo, linguagem e social",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          "Desenvolvimento cognitivo adequado para a idade corrigida",
          "Linguagem receptiva e expressiva conforme a faixa etaria",
          "Sorriso social e interacao conforme esperado",
          "Atencao e exploracao do ambiente presentes",
          "Sem sinais de risco de TEA na faixa etaria atual",
          "Audicao confirmada normal (TANU ou audiometria)",
          "Peso, estatura e PC em curva adequada para a idade corrigida",
          "Seguimento com equipe multiprofissional esta ocorrendo",
        ],
      },
    ],
  },


  // ── j26-202 — Polifarmácia Risco Pediátrico ──
  // ── j26-203 — Interação Medicamentosa Monitorização ──
  "j26-203": {
    instruction: "Revise as medicacoes em uso e marque os riscos ou problemas identificados nesta consulta. Utilize dados do prontuario e da anamnese.",
    infoBox: "Monitoramento de interacoes medicamentosas em criancas com multimorbidade. Pontuacao alta = maior risco de interacao. Nao e diagnostico.",
    labels: ["Ausente", "Leve", "Moderado", "Intenso"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "Risco de interacao medicamentosa (0-48)",
    bands: [
      { minPct: 0, classification: "Sem efeitos relevantes", color: "emerald", description: "Sem interacoes clinicamente relevantes identificadas." },
      { minPct: 20, classification: "Risco leve", color: "amber", description: "Interacoes potenciais presentes. Registre e acompanhe." },
      { minPct: 40, classification: "Risco moderado - ponderar", color: "orange", description: "Interacoes com potencial clinico. Avalie beneficio vs risco." },
      { minPct: 65, classification: "Risco importante - revisar", color: "red", description: "Interacoes com alto potencial de dano. Revisao urgente do esquema." },
    ],
    domains: [
      {
        name: "Interacoes farmacocineticas",
        color: "text-violet-600 dark:text-violet-400",
        items: [
          "Ha combinacao que altera o metabolismo hepatico (CYP450)",
          "Ha remedio que reduz absorcao de outro (antiepileticos x micronutrientes)",
          "Ha combinacao que altera a excrecao renal de outro farmaco",
          "Ha remedio que desloca ligacao proteica aumentando nível livre",
          "Ha potencializacao do efeito de sedacao ou de depressao do SNC",
          "Ha reducao da eficacia antiepiletica por interacao",
        ],
      },
      {
        name: "Interacoes farmacodinamicas e seguranca",
        color: "text-red-600 dark:text-red-400",
        items: [
          "Ha risco de prolongamento do intervalo QTc",
          "Ha risco de sindrome serotoninergica",
          "Ha risco aditivo de hepatotoxicidade",
          "Ha risco aditivo de mielossupressao",
          "Ha risco de crise hipertensiva (IMAO x estimulantes)",
          "A revisao medicamentosa esta atualizada e documentada",
          "A familia foi orientada sobre os riscos identificados",
          "O esquema atual foi otimizado para minimizar interacoes",
        ],
      },
    ],
  },


  // ── j26-204 — Tiques Monitorização ──
  // ── j26-205 — Tiques e Comorbidades TEA TDAH ──
  "j26-205": {
    instruction: "Avalie a relacao dos tiques com as comorbidades presentes. Marque o que esta presente nas ultimas 4 semanas.",
    infoBox: "Avaliacao de tiques no contexto de TEA e TDAH. Pontuacao alta = maior impacto combinado. Nao e diagnostico.",
    labels: ["Nunca", "As vezes", "Frequentemente"],
    optionPoints: [0, 1, 2],
    scoreDirection: "higher_worse",
    totalLabel: "Impacto dos tiques com comorbidades (0-28)",
    bands: [
      { minPct: 0, classification: "Sem alteracao relevante", color: "emerald", description: "Baixa pontuacao. Manter vigilancia clinica de rotina." },
      { minPct: 25, classification: "Sinais leves", color: "amber", description: "Ha sinais leves ou ocasionais. Oriente observacao e reavalie." },
      { minPct: 45, classification: "Sinais moderados", color: "orange", description: "Sinais relevantes presentes. Correlacione com comorbidades." },
      { minPct: 67, classification: "Alteracao importante", color: "red", description: "Escore elevado. Avalie impacto funcional e necessidade de intervencao." },
    ],
    domains: [
      {
        name: "Tiques e TEA",
        color: "text-violet-600 dark:text-violet-400",
        items: [
          "Os tiques sao dificieis de diferenciar das estereotipias do TEA",
          "Os tiques pioram em situacoes de transicao ou mudanca de rotina",
          "Os tiques interferem na comunicacao ou nas interacoes sociais",
          "Ha ansiedade social que piora os tiques em publico",
          "Os tiques sao motivo de bullying ou exclusao escolar",
          "Os tiques pioram quando a crianca esta em sobrecarga sensorial",
        ],
      },
      {
        name: "Tiques e TDAH",
        color: "text-orange-600 dark:text-orange-400",
        items: [
          "Os tiques pioram com o uso do estimulante para TDAH",
          "Os tiques interferem com a concentracao e a atencao",
          "Os tiques sao mais frequentes em situacoes de tedio ou baixa estimulacao",
          "A crianca tenta suprimir os tiques durante tarefas escolares",
          "A medicacao para TDAH e a melhor opcao apesar dos tiques",
          "O tique e o TDAH estao sendo tratados de forma integrada",
          "Os tiques melhoraram com o ajuste medicamentoso atual",
          "Os tiques estao interferindo mais que o TDAH na funcionalidade",
        ],
      },
    ],
  },


  // ── j26-206 — Irmão Criança com NEE ──
  // ── j26-207 — Privação Social e Negligência ──
  // ── j26-208 — TEA Comunicação Social Evolutiva ──
  "j26-208": {
    instruction: "Marque o que voce observa na comunicacao e interacao social da crianca com TEA nas ultimas semanas. Compare com o inicio do acompanhamento.",
    infoBox: "Monitoramento da comunicacao social no TEA. Maior pontuacao = melhor desenvolvimento social. Nao e diagnostico.",
    labels: ["Nao observado", "Emergente", "Parcial", "Adequado"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_better",
    totalLabel: "Comunicacao social no TEA (maior = melhor)",
    bands: [
      { minPct: 85, classification: "Desempenho adequado", color: "emerald", description: "Boa comunicacao social para o nivel de TEA. Mantenha vigilancia." },
      { minPct: 60, classification: "Em desenvolvimento - vigiar", color: "amber", description: "Ha progressos mas algumas areas merecem atencao. Reavalie." },
      { minPct: 40, classification: "Atraso possivel - reavaliar", color: "orange", description: "Comunicacao social abaixo do esperado. Considere intensificacao." },
      { minPct: 0, classification: "Atraso provavel - encaminhar", color: "red", description: "Comunicacao social muito limitada. Investigue e intensifique suporte." },
    ],
    domains: [
      {
        name: "Contato e interacao",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          "Busca contato visual em interacoes significativas",
          "Responde ao proprio nome quando chamado",
          "Inicia interacoes espontaneas com familiares",
          "Demonstra afeto e vinculo com os cuidadores",
          "Compartilha alegria ou descobertas (atencao compartilhada)",
          "Imita acoes ou expressoes de adultos",
        ],
      },
      {
        name: "Comunicacao e progresso",
        color: "text-teal-600 dark:text-teal-400",
        items: [
          "Usa gestos funcionais (apontar, acenar, mostrar)",
          "Usa palavras ou sistema de CAA para comunicar necessidades",
          "Compreende instrucoes simples do cotidiano",
          "Engaja em brincadeira reciproca com adultos",
          "A comunicacao social melhorou desde o inicio da intervencao",
          "A terapia fonoaudiologica ou de ABA esta sendo efetiva",
          "A escola tem sido parceira no apoio a comunicacao",
          "Ha barreiras ambientais que limitam o progresso social",
        ],
      },
    ],
  },

  // ── j26-209 — TEA Linguagem Funcional Acompanhamento ──
  "j26-209": {
    instruction: "Marque o que a crianca com TEA consegue fazer em termos de linguagem nas situacoes do cotidiano. Responda sobre as ultimas semanas.",
    infoBox: "Monitoramento de linguagem funcional no TEA. Maior pontuacao = melhor linguagem funcional. Nao e diagnostico.",
    labels: ["Nao observado", "Emergente", "Parcial", "Adequado"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_better",
    totalLabel: "Linguagem funcional no TEA (maior = melhor)",
    bands: [
      { minPct: 85, classification: "Desempenho adequado", color: "emerald", description: "Linguagem funcional adequada para o nivel de TEA. Mantenha vigilancia." },
      { minPct: 60, classification: "Em desenvolvimento - vigiar", color: "amber", description: "Ha progresso mas algumas funcoes merecem atencao. Reavalie." },
      { minPct: 40, classification: "Atraso possivel - reavaliar", color: "orange", description: "Linguagem funcional abaixo do esperado. Considere intensificacao." },
      { minPct: 0, classification: "Atraso provavel - encaminhar", color: "red", description: "Linguagem funcional muito limitada. Investigue suporte alternativo." },
    ],
    domains: [
      {
        name: "Comunicacao expressiva",
        color: "text-violet-600 dark:text-violet-400",
        items: [
          "Usa palavras ou frases para pedir o que quer",
          "Usa fala, gestos ou CAA para protestar ou recusar",
          "Usa comunicacao para comentar ou chamar atencao",
          "A linguagem expressiva progrediu desde o ultimo retorno",
          "Usa frases de 2 ou mais palavras (ou equivalente em CAA)",
          "Iniciou uso de CAA ou PECS com progresso funcional",
        ],
      },
      {
        name: "Comunicacao receptiva e pragmatica",
        color: "text-teal-600 dark:text-teal-400",
        items: [
          "Compreende instrucoes de 2 ou mais passos",
          "Entende perguntas simples (onde? quem? o que?)",
          "Segue rotinas verbais ou visuais sem apoio constante",
          "Compreende nao-verbal (expressoes faciais, tom de voz)",
          "A linguagem receptiva e melhor que a expressiva",
          "A escola ou terapia esta usando suporte visual de forma eficaz",
          "Ha regressao de linguagem que precisa ser investigada",
          "A fonoterapia esta sendo efetiva no desenvolvimento da linguagem",
        ],
      },
    ],
  },

  // ── j26-210 — TEA Autonomia e AVD Follow-up ──
  "j26-210": {
    instruction: "Marque o nivel de autonomia nas atividades da vida diaria (AVD) da crianca com TEA. Avalie o que ela faz sem ajuda, com ajuda parcial ou ainda nao faz.",
    infoBox: "Monitoramento de autonomia nas AVD no TEA. Maior pontuacao = maior autonomia. Nao e diagnostico.",
    labels: ["Nao faz", "Com muita ajuda", "Com ajuda parcial", "Autonomo"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_better",
    totalLabel: "Autonomia nas AVD (maior = mais autonomo)",
    bands: [
      { minPct: 85, classification: "Alta autonomia", color: "emerald", description: "Realizando a maioria das AVD com autonomia. Excelente progresso." },
      { minPct: 60, classification: "Autonomia parcial - vigiar", color: "amber", description: "Ha autonomia em algumas areas. Continue ampliando gradualmente." },
      { minPct: 40, classification: "Dependencia relevante", color: "orange", description: "Dependencia significativa em AVD. Plano terapeutico de autonomia recomendado." },
      { minPct: 0, classification: "Alta dependencia - intervir", color: "red", description: "Dependencia intensa em AVD. Avalie necessidades de suporte intensivo." },
    ],
    domains: [
      {
        name: "Autocuidado basico",
        color: "text-teal-600 dark:text-teal-400",
        items: [
          "Controle esfincteriano (urinario e fecal)",
          "Higiene apos o banheiro",
          "Escovar os dentes",
          "Lavar as maos antes das refeicoes",
          "Tomar banho com supervisao minima",
          "Vestir-se e descalcar-se",
        ],
      },
      {
        name: "Rotinas e funcionalidade",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          "Alimentar-se com utensilios adequados",
          "Dormir com rotina noturna previsivel",
          "Guardar brinquedos e pertences",
          "Seguir rotina escolar com apoio minimo",
          "Deslocar-se com seguranca em ambientes conhecidos",
          "A autonomia nas AVD aumentou desde o inicio do acompanhamento",
          "Ha barreiras ambientais ou sensoriais que limitam a autonomia",
          "A TO ou a escola tem sido efetiva no treinamento de AVD",
        ],
      },
    ],
  },

  // ── j26-211 — TEA Inclusão Escolar Acompanhamento ──
  "j26-211": {
    instruction: "Avalie a inclusao escolar da crianca com TEA. Marque o que esta ocorrendo na escola nas ultimas semanas.",
    infoBox: "Monitoramento de inclusao escolar no TEA. Pontuacao alta = maior dificuldade de inclusao. Nao e diagnostico.",
    labels: ["Nunca", "As vezes", "Frequentemente"],
    optionPoints: [0, 1, 2],
    scoreDirection: "higher_worse",
    totalLabel: "Dificuldades de inclusao escolar no TEA (0-28)",
    bands: [
      { minPct: 0, classification: "Sem alteracao relevante", color: "emerald", description: "Boa inclusao escolar. Manter vigilancia." },
      { minPct: 25, classification: "Dificuldades leves", color: "amber", description: "Ha dificuldades leves. Oriente escola e familia e reavalie." },
      { minPct: 45, classification: "Dificuldades moderadas", color: "orange", description: "Dificuldades relevantes de inclusao. Considere suporte educacional adicional." },
      { minPct: 67, classification: "Dificuldades importantes", color: "red", description: "Inclusao comprometida. Avalie necessidade de escola especial ou apoio intensivo." },
    ],
    domains: [
      {
        name: "Participacao e interacao escolar",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          "Tem dificuldade de permanecer em sala por periodos adequados",
          "Nao participa de atividades coletivas com os colegas",
          "Tem conflitos frequentes com colegas ou professores",
          "A escola nao tem profissional de apoio (AEE, monitor) quando necessario",
          "Ha bullying ou exclusao por parte dos colegas",
          "Os professores nao foram orientados sobre o TEA",
          "Ha recusa escolar ou grande estresse antes de ir a escola",
        ],
      },
      {
        name: "Adaptacoes e suporte",
        color: "text-teal-600 dark:text-teal-400",
        items: [
          "A escola nao fez adaptacoes curriculares necessarias",
          "O PEI (plano educacional individualizado) esta desatualizado",
          "Ha barreiras sensoriais na escola (barulho, luz) sem solucao",
          "A escola nao usa apoios visuais ou CAA recomendados",
          "A comunicacao entre escola e clinico esta sendo efetiva",
          "A inclusao melhorou desde o inicio do acompanhamento",
          "Os pais se sentem apoiados pela escola",
          "O desempenho academico esta sendo satisfatorio dentro das possibilidades",
        ],
      },
    ],
  },


  // ── j26-212 — Comportamentos Restritivos TEA Baseline vs Atual ──
  // ── j26-213 — TEA Habilidades Adaptativas Follow-up ──
  "j26-213": {
    instruction: "Avalie as habilidades adaptativas da crianca com TEA comparando com o inicio do acompanhamento. Marque o nivel atual de cada area.",
    infoBox: "Monitoramento de habilidades adaptativas no TEA (estrutura Vineland). Maior pontuacao = melhores habilidades. Nao e diagnostico.",
    labels: ["Nao observado", "Emergente", "Parcial", "Adequado"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_better",
    totalLabel: "Habilidades adaptativas no TEA (maior = melhor)",
    bands: [
      { minPct: 85, classification: "Habilidades adequadas", color: "emerald", description: "Bom nivel adaptativo para a condicao. Mantenha vigilancia." },
      { minPct: 60, classification: "Em desenvolvimento - vigiar", color: "amber", description: "Ha progressos mas algumas areas merecem atencao. Reavalie." },
      { minPct: 40, classification: "Deficit relevante - reavaliar", color: "orange", description: "Habilidades adaptativas abaixo do esperado. Considere intensificacao." },
      { minPct: 0, classification: "Deficit importante - intervir", color: "red", description: "Deficit adaptativo intenso. Avalie suporte intensivo e recursos." },
    ],
    domains: [
      {
        name: "Socializacao e comunicacao",
        color: "text-violet-600 dark:text-violet-400",
        items: [
          "Interage com membros da familia de forma funcional",
          "Tem habilidades de brincar e compartilhar com pares",
          "Usa comunicacao (fala ou CAA) em contextos funcionais",
          "Demonstra compreensao de regras sociais basicas",
          "Adapta o comportamento a diferentes ambientes",
          "As habilidades de socializacao melhoraram desde o inicio",
        ],
      },
      {
        name: "Motor e vida pratica",
        color: "text-teal-600 dark:text-teal-400",
        items: [
          "Realiza atividades de autocuidado adequadas para a idade",
          "Motor grosso e fino em nivel funcional para a idade",
          "Participa de atividades domesticas simples",
          "Tolera mudancas de atividade sem crise significativa",
          "As habilidades adaptativas globais melhoraram desde o inicio",
          "O nivel adaptativo atual e compativel com a expectativa para o nivel de TEA",
          "Ha areas que precisam de intervencao especifica urgente",
          "Os apoios ambientais sao adequados as necessidades adaptativas",
        ],
      },
    ],
  },


  // ── j26-214 — Integração Sensorial TEA Pós-TO ──
  // ── j26-215 — Crises de Desregulação TEA Antes vs Depois ──
  // ── j26-216 — TEA Funcionalidade Semestral ──
  "j26-216": {
    instruction: "Faca uma avaliacao global da funcionalidade da crianca com TEA neste semestre. Marque o nivel de cada area comparando com 6 meses atras.",
    infoBox: "Avaliacao semestral de funcionalidade no TEA. Maior pontuacao = melhor funcionalidade. Nao e diagnostico.",
    labels: ["Piorou", "Estavel sem progresso", "Progresso parcial", "Progresso adequado"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_better",
    totalLabel: "Progresso funcional semestral no TEA (maior = melhor)",
    bands: [
      { minPct: 85, classification: "Bom progresso", color: "emerald", description: "Progresso adequado em multiplas areas. Excelente evolucao semestral." },
      { minPct: 60, classification: "Progresso parcial", color: "amber", description: "Progresso em algumas areas. Identifique barreiras nas areas estaveis." },
      { minPct: 40, classification: "Progresso limitado", color: "orange", description: "Pouco progresso no semestre. Revise o plano terapeutico." },
      { minPct: 0, classification: "Regressao ou estagnacao", color: "red", description: "Poucas ou nenhuma area com progresso. Investigacao necessaria." },
    ],
    domains: [
      {
        name: "Areas clinicas e terapeuticas",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          "Comunicacao e linguagem",
          "Integracao sensorial e regulacao",
          "Comportamentos restritivos e repetitivos",
          "Autonomia nas AVD",
          "Controle emocional e manejo de crises",
          "Motor grosso e fino",
        ],
      },
      {
        name: "Areas de vida e contexto",
        color: "text-teal-600 dark:text-teal-400",
        items: [
          "Inclusao escolar e desempenho academico",
          "Relacoes sociais com pares",
          "Vinculo familiar e participacao em casa",
          "Qualidade de vida geral da crianca",
          "Qualidade de vida e bem-estar da familia",
          "O plano terapeutico atual esta sendo efetivo",
          "Ha necessidade de revisao do diagnostico ou de novas avaliacoes",
          "Os objetivos terapeuticos do semestre foram atingidos",
        ],
      },
    ],
  },

  // ── j26-217 — TEA TDAH Comorbidade Monitoramento ──
  "j26-217": {
    instruction: "Avalie a interacao entre os sintomas de TEA e TDAH na crianca. Marque o que esta mais impactante nas ultimas 2 semanas.",
    infoBox: "Monitoramento de TEA com comorbidade de TDAH. Pontuacao alta = maior impacto combinado. Nao e diagnostico.",
    labels: ["Nunca", "As vezes", "Frequentemente"],
    optionPoints: [0, 1, 2],
    scoreDirection: "higher_worse",
    totalLabel: "Impacto TEA + TDAH combinado (0-28)",
    bands: [
      { minPct: 0, classification: "Sem alteracao relevante", color: "emerald", description: "Baixo impacto combinado. Manter vigilancia clinica." },
      { minPct: 25, classification: "Impacto leve", color: "amber", description: "Ha impacto leve. Oriente observacao e reavalie." },
      { minPct: 45, classification: "Impacto moderado", color: "orange", description: "Impacto relevante na funcionalidade. Revise o plano." },
      { minPct: 67, classification: "Impacto importante", color: "red", description: "Impacto alto. Avalie ajuste medicamentoso e intervencoes." },
    ],
    domains: [
      {
        name: "Atencao e controle no TEA",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          "Desatencao impede participacao em atividades terapeuticas",
          "A hiperatividade piora as estereotipias e a desregulacao",
          "Impulsividade gera conflitos alem do esperado para o TEA",
          "A medicacao para TDAH melhorou a participacao nas terapias",
          "A atencao melhorou mas os CRR do TEA persistem intensos",
          "Ha piora do TDAH nos periodos sem estimulante (fim de semana)",
          "O TDAH esta sendo o principal limitante funcional no momento",
        ],
      },
      {
        name: "Interacao social e escola",
        color: "text-teal-600 dark:text-teal-400",
        items: [
          "TDAH piora as habilidades sociais do TEA",
          "Crianca e excluida socialmente tanto por TEA quanto por TDAH",
          "A escola tem dificuldade de manejar as duas condicoes",
          "Ha conflito de estrategia entre abordagens para TEA e TDAH",
          "O tratamento combinado esta sendo efetivo",
          "A comorbidade esta mais controlada que no semestre anterior",
          "Ha necessidade de ajuste no suporte escolar para as duas condicoes",
          "A familia esta conseguindo manejar as duas condicoes em casa",
        ],
      },
    ],
  },

  // ── j26-218 — Transição Pré-Escolar para Escolar TEA ──
  "j26-218": {
    instruction: "Avalie a transicao da crianca com TEA do pre-escolar para o ensino fundamental. Marque o que esta acontecendo neste periodo de mudanca.",
    infoBox: "Monitoramento da transicao escolar no TEA. Pontuacao alta = maior dificuldade na transicao. Nao e diagnostico.",
    labels: ["Nunca", "As vezes", "Frequentemente"],
    optionPoints: [0, 1, 2],
    scoreDirection: "higher_worse",
    totalLabel: "Dificuldades na transicao escolar TEA (0-28)",
    bands: [
      { minPct: 0, classification: "Transicao tranquila", color: "emerald", description: "A crianca esta se adaptando bem a nova escola. Manter vigilancia." },
      { minPct: 25, classification: "Dificuldades leves", color: "amber", description: "Ha dificuldades pontuais. Oriente a escola e a familia." },
      { minPct: 45, classification: "Dificuldades moderadas", color: "orange", description: "Transicao com impacto relevante. Intensifique o suporte." },
      { minPct: 67, classification: "Transicao dificil", color: "red", description: "Transicao muito difícil. Avalie antecipacao e suporte especializado." },
    ],
    domains: [
      {
        name: "Adaptacao e comportamento",
        color: "text-orange-600 dark:text-orange-400",
        items: [
          "A crianca esta recusando ir para a nova escola",
          "Ha aumento de crises de desregulacao apos a mudanca de escola",
          "A crianca esta mais agitada ou ansiosa nas semanas de escola",
          "Ha aumento de estereotipias e CRR com a mudanca",
          "A crianca perdeu habilidades adquiridas no pre-escolar",
          "Ha regressao de linguagem ou AVD desde a mudanca",
          "A transicao foi mais dificil que o esperado para o nivel de TEA",
        ],
      },
      {
        name: "Suporte e planejamento",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          "A nova escola ainda nao conhece as necessidades da crianca",
          "O PEI da nova escola ainda nao foi elaborado ou compartilhado",
          "Ha falta de monitor ou apoio especializado na nova escola",
          "A familia nao foi orientada sobre como apoiar a transicao",
          "A nova escola foi visitada com antecedencia para adaptacao",
          "O profissional de referencia passou informacoes para a nova escola",
          "A crianca esta se adaptando progressivamente a nova rotina",
          "O suporte planejado esta sendo suficiente para a transicao",
        ],
      },
    ],
  },


  // ── j26-219 — SNAP-IV Monitorização TDAH ──
  // ── j26-220 — TDAH Desempenho Escolar Follow-up ──
  "j26-220": {
    instruction: "Avalie o desempenho escolar da crianca com TDAH. Marque o que esta presente nas ultimas semanas de escola.",
    infoBox: "Monitoramento de desempenho escolar no TDAH. Pontuacao alta = maior impacto no desempenho. Nao e diagnostico.",
    labels: ["Nunca", "As vezes", "Frequentemente"],
    optionPoints: [0, 1, 2],
    scoreDirection: "higher_worse",
    totalLabel: "Impacto do TDAH no desempenho escolar (0-28)",
    bands: [
      { minPct: 0, classification: "Sem alteracao relevante", color: "emerald", description: "Desempenho escolar preservado. Manter vigilancia." },
      { minPct: 25, classification: "Impacto leve", color: "amber", description: "Ha impacto leve no desempenho. Oriente escola e familia." },
      { minPct: 45, classification: "Impacto moderado", color: "orange", description: "Impacto relevante. Avalie adaptacoes e suporte escolar." },
      { minPct: 67, classification: "Impacto importante", color: "red", description: "Impacto alto no desempenho. Intervencao urgente recomendada." },
    ],
    domains: [
      {
        name: "Aprendizagem e producao",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          "Nao termina as atividades em sala no tempo disponivel",
          "Os cadernos e materiais estao desorganizados e incompletos",
          "Perde ou esquece materiais e tarefas com frequencia",
          "O desempenho em provas e muito abaixo da capacidade real",
          "O professor reporta que nao consegue se concentrar",
          "Ha queda nas notas desde o ultimo retorno",
          "Tem dificuldade de copiar do quadro com eficiencia",
        ],
      },
      {
        name: "Comportamento escolar",
        color: "text-orange-600 dark:text-orange-400",
        items: [
          "Interrupcoes frequentes da aula por parte da crianca",
          "Conflitos com colegas por impulsividade",
          "O professor tem reclamacoes frequentes do comportamento",
          "Ha adaptacoes escolares que estao sendo efetivas",
          "O rendimento escolar melhorou com o tratamento medicamentoso",
          "O suporte educacional especializado esta disponivel",
          "A familia e a escola estao alinhadas no plano de manejo",
          "O desempenho escolar esta melhor que no semestre anterior",
        ],
      },
    ],
  },

  // ── j26-221 — TDAH Relações Sociais e Comportamento ──
  "j26-221": {
    instruction: "Avalie as relacoes sociais e o comportamento interpessoal da crianca com TDAH. Marque o que esta presente nas ultimas semanas.",
    infoBox: "Monitoramento de relacoes sociais no TDAH. Pontuacao alta = maior dificuldade social. Nao e diagnostico.",
    labels: ["Nunca", "As vezes", "Frequentemente"],
    optionPoints: [0, 1, 2],
    scoreDirection: "higher_worse",
    totalLabel: "Dificuldades sociais no TDAH (0-28)",
    bands: [
      { minPct: 0, classification: "Sem alteracao relevante", color: "emerald", description: "Relacoes sociais preservadas. Manter vigilancia." },
      { minPct: 25, classification: "Dificuldades leves", color: "amber", description: "Ha dificuldades pontuais. Oriente familia e escola." },
      { minPct: 45, classification: "Dificuldades moderadas", color: "orange", description: "Impacto relevante nas relacoes. Avalie intervencao social." },
      { minPct: 67, classification: "Dificuldades importantes", color: "red", description: "Isolamento ou conflito social intenso. Intervencao necessaria." },
    ],
    domains: [
      {
        name: "Relacoes com pares",
        color: "text-violet-600 dark:text-violet-400",
        items: [
          "Tem dificuldade de manter amizades por causa da impulsividade",
          "Interrupe ou domina as brincadeiras dos colegas",
          "E excluido ou evitado pelos colegas na escola",
          "Tem conflitos frequentes em jogos ou brincadeiras em grupo",
          "Chora muito ou reage de forma intensa quando perde jogos",
          "Nao consegue respeitar regras sociais nas brincadeiras",
          "Tem poucas ou nenhuma amizade estavel",
        ],
      },
      {
        name: "Familia e contexto",
        color: "text-orange-600 dark:text-orange-400",
        items: [
          "Os conflitos com irmaos sao frequentes e intensos",
          "Os pais relatam dificuldade de manejar o comportamento em publico",
          "A crianca e excluida de atividades extracurriculares por comportamento",
          "As relacoes sociais melhoraram com o tratamento do TDAH",
          "A habilidade social esta sendo trabalhada em terapia",
          "A familia foi orientada sobre o impacto social do TDAH",
          "Ha bullying relacionado ao comportamento do TDAH",
          "As relacoes sociais estao melhores que no semestre anterior",
        ],
      },
    ],
  },


  // ── j26-222 — Efeitos do Metilfenidato/Lisdexanfetamina ──
  // ── j26-223 — Efeito Rebote Estimulante Monitor ──
  "j26-223": {
    instruction: "Avalie a intensidade do efeito rebote da medicacao estimulante no fim do dia. Marque o que a familia e a escola observam.",
    infoBox: "Monitoramento especifico do efeito rebote (rebound) ao final da acao do estimulante. Pontuacao alta = rebote mais intenso. Nao e diagnostico.",
    labels: ["Ausente", "Leve", "Moderado", "Intenso"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "Intensidade do efeito rebote (0-36)",
    bands: [
      { minPct: 0, classification: "Sem rebote relevante", color: "emerald", description: "Transicao ao fim do efeito adequada. Manter vigilancia de rotina." },
      { minPct: 20, classification: "Rebote leve", color: "amber", description: "Rebote leve ou ocasional. Oriente estrategias de transicao e reavalie." },
      { minPct: 40, classification: "Rebote moderado - ponderar", color: "orange", description: "Rebote relevante. Considere ajuste de horario ou formulacao." },
      { minPct: 65, classification: "Rebote importante - revisar", color: "red", description: "Rebote intenso. Revisao da formulacao ou dose do estimulante." },
    ],
    domains: [
      {
        name: "Comportamento no rebote",
        color: "text-orange-600 dark:text-orange-400",
        items: [
          "Choro facil ou irritabilidade intensa no fim do efeito",
          "Explosoes de raiva desproporcional a noite",
          "Hiperatividade maior que antes do inicio do estimulante",
          "Impulsividade exacerbada nas horas seguintes ao fim do efeito",
          "Conflitos familiares aumentam no periodo do rebote",
          "O rebote interfere nas tarefas de casa e na rotina noturna",
        ],
      },
      {
        name: "Sono e transicao",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          "Ha dificuldade de adormecer associada ao rebote",
          "A crianca fica agitada ate tarde por causa do rebote",
          "Uma dose menor no fim da tarde reduziria o rebote",
          "A formulacao de liberacao prolongada nao esta sendo eficaz no controle do rebote",
          "O horario da ultima dose precisa ser ajustado",
          "O rebote esta pior do que no inicio do tratamento",
          "O rebote esta prejudicando a qualidade de vida familiar",
          "O rebote melhorou com o ajuste de formulacao ou horario",
        ],
      },
    ],
  },


  // ── j26-224 — Sono e Apetite TDAH Tratamento ──
  // ── j26-225 — Sono na Epilepsia Monitorização ──
  "j26-225": {
    instruction: "Avalie o impacto da epilepsia e do antiepiletico no sono da crianca. Marque o que esta presente nas ultimas semanas.",
    infoBox: "Monitoramento de disturbios do sono na epilepsia. Pontuacao alta = maior impacto no sono. Nao e diagnostico.",
    labels: ["Nunca", "As vezes", "Frequentemente"],
    optionPoints: [0, 1, 2],
    scoreDirection: "higher_worse",
    totalLabel: "Impacto no sono relacionado a epilepsia (0-28)",
    bands: [
      { minPct: 0, classification: "Sem alteracao relevante", color: "emerald", description: "Sono preservado. Manter vigilancia de rotina." },
      { minPct: 25, classification: "Impacto leve", color: "amber", description: "Ha impacto leve no sono. Oriente higiene do sono e reavalie." },
      { minPct: 45, classification: "Impacto moderado", color: "orange", description: "Impacto relevante no sono. Considere PSG ou ajuste do antiepiletico." },
      { minPct: 67, classification: "Impacto importante", color: "red", description: "Sono muito comprometido. Avaliacao urgente do sono necessaria." },
    ],
    domains: [
      {
        name: "Crises e sono",
        color: "text-red-600 dark:text-red-400",
        items: [
          "Tem crises que ocorrem exclusivamente no sono",
          "Acorda abruptamente durante a noite (suspeita de crise)",
          "Faz movimentos repetitivos ou automatismos noturnos",
          "Ha medo de dormir por causa da epilepsia",
          "Os pais vigiam o sono da crianca por medo de crises noturnas",
          "Ha evidencia de crises noturnas subdiagnosticadas",
          "O EEG do sono foi realizado ou esta indicado",
        ],
      },
      {
        name: "Impacto do antiepiletico no sono",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          "O antiepiletico causa sonolencia excessiva durante o dia",
          "Ha insonia ou latencia aumentada por causa do antiepiletico",
          "O ajuste de horario do antiepiletico poderia melhorar o sono",
          "O sono melhorou com o controle das crises",
          "Ha apneia do sono associada que precisa de avaliacao",
          "A qualidade do sono esta piorando progressivamente",
          "A familia esta exausta pela vigilancia noturna constante",
          "O sono esta melhor que no retorno anterior",
        ],
      },
    ],
  },

  // ── j26-226 — Dieta Cetogênica Epilepsia Monitor ──
  "j26-226": {
    instruction: "Avalie a adesao e os efeitos da dieta cetogenica no controle da epilepsia. Marque o que esta presente nas ultimas semanas.",
    infoBox: "Monitoramento de adesao e efeitos da dieta cetogenica na epilepsia refrataria. Pontuacao alta = maior carga de dificuldades. Nao e diagnostico.",
    labels: ["Ausente", "Leve", "Moderado", "Intenso"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "Dificuldades com a dieta cetogenica (0-48)",
    bands: [
      { minPct: 0, classification: "Sem dificuldades relevantes", color: "emerald", description: "Adesao adequada e sem efeitos relevantes. Manter vigilancia." },
      { minPct: 20, classification: "Dificuldades leves", color: "amber", description: "Ha dificuldades leves. Oriente a familia e reavalie." },
      { minPct: 40, classification: "Dificuldades moderadas - ponderar", color: "orange", description: "Dificuldades relevantes. Considere ajuste do protocolo." },
      { minPct: 65, classification: "Dificuldades importantes - revisar", color: "red", description: "Dieta com alto impacto. Reveja indicacao e alternativas." },
    ],
    domains: [
      {
        name: "Adesao e aceitabilidade",
        color: "text-orange-600 dark:text-orange-400",
        items: [
          "A crianca recusa os alimentos permitidos na dieta",
          "A familia tem dificuldade de preparar as refeicoes adequadas",
          "Houve quebra da dieta nas ultimas semanas",
          "Ha dificuldade de adesao em ambientes externos (escola, festas)",
          "O custo dos alimentos especificos e um obstaculo",
          "A familia sente-se sobrecarregada pela complexidade da dieta",
        ],
      },
      {
        name: "Efeitos clinicos e laboratoriais",
        color: "text-red-600 dark:text-red-400",
        items: [
          "Ha nauseas, vomitos ou dor abdominal relacionados a dieta",
          "Ha desaceleracao do crescimento ou perda de peso",
          "Ha sinais de hipoglicemia ou cetose excessiva",
          "Os exames de colesterol ou lipidios estao alterados",
          "Ha constipacao intensa associada a dieta",
          "A dieta esta reduzindo as crises conforme esperado",
          "Os exames laboratoriais de monitoramento estao em dia",
          "A dieta esta sendo efetiva e o beneficio supera os efeitos adversos",
        ],
      },
    ],
  },


  // ── j26-227 — Diário de Frequência de Crises Epilepsia ──
  // ── j26-228 — Efeitos de Antiepilépticos Monitorização ──
  // ── j26-229 — Evolução Cognitiva Epilepsia ──
  // ── j26-230 — Qualidade de Vida Epilepsia Semestral ──
  // ── j26-231 — Adesão Medicamentosa Epilepsia ──
  // ── j26-232 — EEG Evolutivo Achados Sequenciais ──
  // ── j26-233 — Linguagem Expressiva Pós-Fonoterapia ──
  "j26-233": {
    instruction: "Avalie o progresso da linguagem expressiva da crianca apos a fonoterapia. Marque o que esta presente comparando com o inicio do tratamento.",
    infoBox: "Monitoramento de linguagem expressiva pos-fonoterapia. Maior pontuacao = melhor progresso. Nao e diagnostico.",
    labels: ["Nao observado", "Emergente", "Parcial", "Adequado"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_better",
    totalLabel: "Progresso da linguagem expressiva (maior = melhor)",
    bands: [
      { minPct: 85, classification: "Bom progresso", color: "emerald", description: "Excelente progresso na linguagem expressiva. Mantenha a intervencao." },
      { minPct: 60, classification: "Progresso parcial - vigiar", color: "amber", description: "Ha progressos mas algumas areas precisam de atencao. Continue." },
      { minPct: 40, classification: "Progresso limitado", color: "orange", description: "Progresso abaixo do esperado. Revise o plano de fonoterapia." },
      { minPct: 0, classification: "Sem progresso - redirecionar", color: "red", description: "Sem progresso expressivo. Considere avaliacao e mudanca de abordagem." },
    ],
    domains: [
      {
        name: "Vocabulario e morfossintaxe",
        color: "text-violet-600 dark:text-violet-400",
        items: [
          "Vocabulario expressivo ampliou desde o inicio da fonoterapia",
          "Usa frases mais longas e complexas que antes",
          "Usa verbos e preposicoes com mais frequencia e precisao",
          "A produtividade lexical aumentou (mais palavras por minuto)",
          "Comete menos erros morfossintaxicos que antes",
          "A narrativa oral ficou mais organizada e coerente",
        ],
      },
      {
        name: "Pragmatica e comunicacao",
        color: "text-teal-600 dark:text-teal-400",
        items: [
          "Inicia conversas espontaneas com maior frequencia",
          "Mantém o topico da conversa por mais tempo",
          "Usa linguagem para diferentes funcoes comunicativas",
          "A comunicacao espontanea em situacoes novas melhorou",
          "O progresso na fonoterapia esta compativel com o tempo de tratamento",
          "Ha fatores que limitam o progresso (bilinguismo, cognicao, audição)",
          "A familia esta replicando as atividades em casa com eficacia",
          "A linguagem expressiva esta proxima da faixa etaria esperada",
        ],
      },
    ],
  },

  // ── j26-234 — Leitura e Escrita Pós-Intervenção ──
  "j26-234": {
    instruction: "Avalie o progresso nas habilidades de leitura e escrita da crianca apos a intervencao fonoaudiologica ou pedagogica. Marque o nivel atual.",
    infoBox: "Monitoramento de leitura e escrita pos-intervencao. Maior pontuacao = melhor progresso. Nao e diagnostico.",
    labels: ["Nao observado", "Emergente", "Parcial", "Adequado"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_better",
    totalLabel: "Progresso em leitura e escrita (maior = melhor)",
    bands: [
      { minPct: 85, classification: "Bom progresso", color: "emerald", description: "Excelente progresso nas habilidades de alfabetizacao. Mantenha." },
      { minPct: 60, classification: "Progresso parcial - vigiar", color: "amber", description: "Ha progressos mas algumas habilidades merecem atencao." },
      { minPct: 40, classification: "Progresso limitado", color: "orange", description: "Progresso abaixo do esperado. Revise o plano de intervencao." },
      { minPct: 0, classification: "Sem progresso - redirecionar", color: "red", description: "Sem progresso nas habilidades. Avalie novas abordagens." },
    ],
    domains: [
      {
        name: "Leitura",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          "Reconhece letras do alfabeto de forma confiavel",
          "Decodifica silabas e palavras com fluencia crescente",
          "Le palavras com regularidade ortografica sem erros constantes",
          "Avancou no nivel de textos que consegue ler com compreensao",
          "A velocidade de leitura oral aumentou",
          "A compreensao leitora melhorou desde o inicio da intervencao",
        ],
      },
      {
        name: "Escrita e ortografia",
        color: "text-teal-600 dark:text-teal-400",
        items: [
          "Escreve palavras com menos trocas e omissoes que antes",
          "A letra (caligrafia) ficou mais legivel e organizada",
          "Escreve frases e textos curtos com coerencia",
          "Usa pontuacao basica com mais frequencia",
          "Os erros ortograficos sao tipicos para a faixa etaria",
          "O desempenho em ditado melhorou conforme esperado",
          "A escrita espontanea ficou mais longa e organizada",
          "O progresso em leitura e escrita e compativel com o tempo de intervencao",
        ],
      },
    ],
  },

  // ── j26-235 — Processamento Auditivo Pós-Intervenção ──
  "j26-235": {
    instruction: "Avalie o progresso no processamento auditivo da crianca apos a intervencao fonoaudiologica. Compare com a avaliacao inicial.",
    infoBox: "Monitoramento de processamento auditivo central pos-intervencao. Maior pontuacao = melhor processamento. Nao e diagnostico.",
    labels: ["Nao observado", "Emergente", "Parcial", "Adequado"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_better",
    totalLabel: "Processamento auditivo central (maior = melhor)",
    bands: [
      { minPct: 85, classification: "Bom progresso", color: "emerald", description: "Excelente progresso no processamento auditivo. Mantenha." },
      { minPct: 60, classification: "Progresso parcial - vigiar", color: "amber", description: "Ha progressos mas algumas habilidades precisam de atencao." },
      { minPct: 40, classification: "Progresso limitado", color: "orange", description: "Progresso abaixo do esperado. Revise o plano." },
      { minPct: 0, classification: "Sem progresso - redirecionar", color: "red", description: "Sem progresso. Considere reavaliacao e mudanca de abordagem." },
    ],
    domains: [
      {
        name: "Discriminacao e localizacao",
        color: "text-violet-600 dark:text-violet-400",
        items: [
          "Distingue sons semelhantes com mais facilidade",
          "Localiza a fonte sonora com mais precisao",
          "Discrimina fala em ambientes com ruido de fundo",
          "Segue instrucoes verbais em sala barulhenta com menos dificuldade",
          "Repete palavras e pseudopalavras com mais precisao",
          "A discriminacao fonologica melhorou conforme esperado",
        ],
      },
      {
        name: "Memoria e processamento temporal",
        color: "text-teal-600 dark:text-teal-400",
        items: [
          "Repete sequencias verbais mais longas que antes",
          "O processamento temporal auditivo melhorou",
          "A memoria auditiva de curto prazo ficou mais eficiente",
          "A escola relata melhora na compreensao de instrucoes orais",
          "A crianca pede menos repeticoes que antes",
          "O uso de FM escolar ou suporte acustico esta sendo efetivo",
          "Ha melhora na leitura e escrita relacionada ao melhor PAC",
          "O progresso no PAC esta compativel com o tempo de intervencao",
        ],
      },
    ],
  },


  // ── j26-236 — Fluência Verbal Pós-Fonoterapia ──
  // ── j26-237 — PC Motor Fino Acompanhamento ──
  "j26-237": {
    instruction: "Avalie as habilidades de motor fino da crianca com paralisia cerebral. Compare com a avaliacao anterior.",
    infoBox: "Monitoramento de motor fino na paralisia cerebral. Maior pontuacao = melhor funcao de motor fino. Nao e diagnostico.",
    labels: ["Nao observado", "Emergente", "Parcial", "Adequado"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_better",
    totalLabel: "Funcao de motor fino na PC (maior = melhor)",
    bands: [
      { minPct: 85, classification: "Bom desempenho", color: "emerald", description: "Motor fino funcional adequado. Mantenha a reabilitacao." },
      { minPct: 60, classification: "Desempenho parcial - vigiar", color: "amber", description: "Ha progressos mas algumas habilidades merecem atencao. Continue." },
      { minPct: 40, classification: "Desempenho limitado", color: "orange", description: "Motor fino abaixo do esperado para o nivel de PC. Intensifique TO." },
      { minPct: 0, classification: "Alta dependencia - intervir", color: "red", description: "Motor fino muito comprometido. Avalie dispositivos assistivos." },
    ],
    domains: [
      {
        name: "Preensao e manipulacao",
        color: "text-teal-600 dark:text-teal-400",
        items: [
          "Pinca polegar-indicador funcional presente",
          "Preensao de objetos de diferentes tamanhos e formas",
          "Transferencia de objetos entre as maos",
          "Manipulacao bimanual funcional (segurar + agir)",
          "Usa o membro mais afetado de forma funcional",
          "A preensao melhorou em relacao a avaliacao anterior",
        ],
      },
      {
        name: "Escrita e atividades de vida diaria",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          "Segura o lapis ou caneta com eficiencia",
          "Traca linhas e formas com controle crescente",
          "Realiza atividades de autocuidado que exigem motor fino (botoes, ziper)",
          "Usa dispositivos assistivos de forma eficaz (quando indicados)",
          "A ortese para mao ou punho esta sendo efetiva",
          "O progresso em motor fino e compativel com o nivel de PC (MACS)",
          "Ha necessidade de intervencao de toxina para membro superior",
          "A TO esta sendo efetiva no progresso do motor fino",
        ],
      },
    ],
  },

  // ── j26-238 — PC Marcha e Postura Follow-up ──
  "j26-238": {
    instruction: "Avalie a marcha e a postura da crianca com paralisia cerebral. Compare com a avaliacao anterior.",
    infoBox: "Monitoramento de marcha e postura na paralisia cerebral. Maior pontuacao = melhor funcao locomotora. Nao e diagnostico.",
    labels: ["Nao observado", "Emergente", "Parcial", "Adequado"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_better",
    totalLabel: "Funcao de marcha e postura na PC (maior = melhor)",
    bands: [
      { minPct: 85, classification: "Bom desempenho", color: "emerald", description: "Marcha e postura funcionais adequadas. Mantenha a reabilitacao." },
      { minPct: 60, classification: "Desempenho parcial - vigiar", color: "amber", description: "Ha progressos mas algumas funcoes merecem atencao." },
      { minPct: 40, classification: "Desempenho limitado", color: "orange", description: "Funcao locomotora abaixo do esperado. Intensifique fisioterapia." },
      { minPct: 0, classification: "Alta dependencia - intervir", color: "red", description: "Marcha muito comprometida. Avalie dispositivos e cirurgia." },
    ],
    domains: [
      {
        name: "Marcha e transferencias",
        color: "text-teal-600 dark:text-teal-400",
        items: [
          "Deambula sem dispositivo de auxilio em distancias funcionais",
          "A qualidade da marcha melhorou em relacao a avaliacao anterior",
          "Sobe e desce escadas com apoio ou supervisao",
          "Realiza transferencias (sentar-levantar) com autonomia",
          "Corre ou salta com nivel funcional adequado para a PC",
          "O GMFCS esta estavel ou melhorou",
        ],
      },
      {
        name: "Postura e equipamentos",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          "A postura sentada e adequada para as atividades escolares",
          "Usa andador, cadeira de rodas ou bengala de forma eficaz",
          "As orteses para membros inferiores estao ajustadas e efetivas",
          "O cadeirante de rodas esta adequado ao crescimento atual",
          "Ha contractura ou deformidade em progressao que precisa de atencao",
          "A fisioterapia esta prevenindo deformidades musculoesqueleticas",
          "Ha indicacao de avaliacao ortopedica ou cirurgica",
          "A marcha e postura estao melhores que na avaliacao anterior",
        ],
      },
    ],
  },

  // ── j26-239 — PC Dor e Conforto Posicional ──
  "j26-239": {
    instruction: "Avalie a presenca de dor e o conforto posicional da crianca com paralisia cerebral. Marque o que esta presente ou relatado.",
    infoBox: "Monitoramento de dor e conforto na PC. Pontuacao alta = maior carga de dor e desconforto. Nao e diagnostico.",
    labels: ["Ausente", "Leve", "Moderado", "Intenso"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "Carga de dor e desconforto na PC (0-48)",
    bands: [
      { minPct: 0, classification: "Sem dor relevante", color: "emerald", description: "Sem dor ou desconforto relevante. Manter vigilancia." },
      { minPct: 20, classification: "Dor leve", color: "amber", description: "Ha dor ou desconforto leve. Oriente posicionamento e reavalie." },
      { minPct: 40, classification: "Dor moderada - ponderar", color: "orange", description: "Dor moderada. Considere analgesia, ajuste postural ou toxina." },
      { minPct: 65, classification: "Dor importante - intervir", color: "red", description: "Dor intensa. Intervencao urgente de conforto necessaria." },
    ],
    domains: [
      {
        name: "Dor musculoesqueletica",
        color: "text-red-600 dark:text-red-400",
        items: [
          "Dor no quadril ou na coxa por displasia",
          "Dor nas panturrilhas por espasticidade ou encurtamento",
          "Dor na coluna por postura inadequada",
          "Dor nos pes por deformidade ou calçado inadequado",
          "Dor durante as transferencias ou fisioterapia",
          "Sinal de dor comportamental (choro, auto-agressao, recusa de toque)",
        ],
      },
      {
        name: "Conforto e manejo",
        color: "text-orange-600 dark:text-orange-400",
        items: [
          "A postura sentada causa desconforto evidente",
          "Ha escara ou lesao de pele por pressao",
          "O posicionamento noturno esta causando desconforto",
          "As orteses estao causando dor ou lesao de pele",
          "Ha dor visceral (gastroesofagica, intestinal) associada a PC",
          "A dor esta sendo adequadamente tratada",
          "O conforto posicional melhorou com os ajustes feitos",
          "Ha indicacao de avaliacao de dor sistematica com escala validada",
        ],
      },
    ],
  },

  // ── j26-240 — PC Comunicação Alternativa AAC ──
  "j26-240": {
    instruction: "Avalie o uso e o progresso na comunicacao alternativa e aumentativa (CAA) da crianca com PC. Marque o que esta presente.",
    infoBox: "Monitoramento de CAA na paralisia cerebral. Maior pontuacao = melhor uso e progresso na CAA. Nao e diagnostico.",
    labels: ["Nao observado", "Emergente", "Parcial", "Adequado"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_better",
    totalLabel: "Progresso no uso de CAA na PC (maior = melhor)",
    bands: [
      { minPct: 85, classification: "Uso funcional da CAA", color: "emerald", description: "CAA em uso funcional adequado. Mantenha e amplie." },
      { minPct: 60, classification: "Uso parcial - vigiar", color: "amber", description: "Ha uso funcional mas algumas funcoes podem ser ampliadas." },
      { minPct: 40, classification: "Uso limitado", color: "orange", description: "CAA subutilizada. Revise o sistema e a capacitacao de parceiros." },
      { minPct: 0, classification: "Sem uso funcional - intervir", color: "red", description: "CAA nao implementada ou nao funcional. Avaliacao e plano urgentes." },
    ],
    domains: [
      {
        name: "Dispositivo e acesso",
        color: "text-violet-600 dark:text-violet-400",
        items: [
          "A crianca tem acesso fisico adequado ao dispositivo de CAA",
          "O metodo de acesso (direto, varredura, olhar) e funcional",
          "O vocabulario do sistema e adequado as necessidades da crianca",
          "O dispositivo esta programado e atualizado regularmente",
          "Ha backup disponivel (pranchas impressas) quando necessario",
          "O dispositivo funciona na escola, em casa e em terapias",
        ],
      },
      {
        name: "Uso comunicativo e parceiros",
        color: "text-teal-600 dark:text-teal-400",
        items: [
          "A crianca usa a CAA para iniciar comunicacao espontanea",
          "A CAA e usada para diferentes funcoes (pedir, comentar, recusar)",
          "Os parceiros de comunicacao (pais, professores) foram capacitados",
          "A escola esta integrando a CAA nas atividades educacionais",
          "O vocabulario foi ampliado em relacao ao inicio do acompanhamento",
          "A CAA esta substituindo ou complementando a fala de forma eficaz",
          "Ha barreiras de adesao que limitam o uso da CAA",
          "O progresso na CAA esta compativel com o tempo de intervencao",
        ],
      },
    ],
  },


  // ── j26-241 — Espasticidade Ashworth Sequencial ──
  // ── j26-242 — PC GMFCS Evolução e Funcionalidade ──
  "j26-242": {
    instruction: "Avalie a funcionalidade motora global da crianca com paralisia cerebral comparando com o ultimo ano. Marque o que esta presente ou mudou.",
    infoBox: "Monitoramento evolutivo da funcionalidade motora na PC (referencia GMFCS). Maior pontuacao = melhor funcionalidade. Nao e diagnostico.",
    labels: ["Nao observado", "Emergente", "Parcial", "Adequado"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_better",
    totalLabel: "Funcionalidade motora global na PC (maior = melhor)",
    bands: [
      { minPct: 85, classification: "Alta funcionalidade", color: "emerald", description: "Excelente funcionalidade para o nivel de PC. Mantenha." },
      { minPct: 60, classification: "Funcionalidade parcial - vigiar", color: "amber", description: "Ha funcionalidade em varias areas. Identifique e apoie as limitantes." },
      { minPct: 40, classification: "Funcionalidade limitada", color: "orange", description: "Funcionalidade aquem do possivel. Revise o plano de reabilitacao." },
      { minPct: 0, classification: "Alta dependencia - intervir", color: "red", description: "Dependencia intensa. Avalie suporte, dispositivos e cirurgia." },
    ],
    domains: [
      {
        name: "Mobilidade e transferencias",
        color: "text-teal-600 dark:text-teal-400",
        items: [
          "Deambula em ambientes internos com ou sem dispositivo",
          "Deambula em ambientes externos com adaptacoes",
          "Realiza transferencias com supervisao minima",
          "Usa cadeira de rodas manual com eficiencia",
          "Usa cadeira de rodas motorizada ou com dispositivo adaptado",
          "A mobilidade funcional e compativel com o GMFCS atual",
        ],
      },
      {
        name: "Participacao e progresso",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          "Participa de atividades escolares com as adaptacoes necessarias",
          "Participa de atividades de lazer e esporte adaptado",
          "Ha progresso funcional em relacao ao ano anterior",
          "Ha regressao funcional que precisa de investigacao",
          "O nivel GMFCS se manteve ou melhorou",
          "As metas de reabilitacao do ano foram atingidas",
          "Ha indicacao de avaliacao pre-cirurgica ortopedica",
          "A qualidade de vida da crianca e da familia e satisfatoria",
        ],
      },
    ],
  },

  // ── j26-243 — PC Qualidade de Vida Familiar ──
  "j26-243": {
    instruction: "Avalie o impacto da paralisia cerebral na qualidade de vida da familia. Marque o que esta presente nas ultimas semanas.",
    infoBox: "Avaliacao do impacto da PC na qualidade de vida familiar. Pontuacao alta = maior impacto. Nao e diagnostico.",
    labels: ["Nunca", "As vezes", "Frequentemente"],
    optionPoints: [0, 1, 2],
    scoreDirection: "higher_worse",
    totalLabel: "Impacto da PC na qualidade de vida familiar (0-32)",
    bands: [
      { minPct: 0, classification: "Sem impacto relevante", color: "emerald", description: "Boa qualidade de vida familiar. Manter vigilancia." },
      { minPct: 25, classification: "Impacto leve", color: "amber", description: "Ha impacto leve. Oriente suporte e recursos e reavalie." },
      { minPct: 45, classification: "Impacto moderado", color: "orange", description: "Impacto relevante na familia. Considere suporte psicossocial." },
      { minPct: 67, classification: "Impacto importante", color: "red", description: "Impacto intenso na familia. Intervencao de suporte urgente." },
    ],
    domains: [
      {
        name: "Cuidadores e suporte",
        color: "text-violet-600 dark:text-violet-400",
        items: [
          "O cuidador principal esta sobrecarregado fisicamente",
          "O cuidador relata esgotamento emocional frequente",
          "Nao ha rede de apoio suficiente para descanso do cuidador",
          "Ha impacto financeiro significativo pelo custo do cuidado",
          "Os outros membros da familia se sentem negligenciados",
          "Ha conflito conjugal ou familiar agravado pela PC",
          "A saude mental do cuidador principal esta comprometida",
          "Ha falta de informacao sobre recursos e direitos legais",
        ],
      },
      {
        name: "Participacao social e recursos",
        color: "text-orange-600 dark:text-orange-400",
        items: [
          "A familia evita sair ou participar de eventos por causa da PC",
          "Ha dificuldade de acesso a servicos de saude e reabilitacao",
          "Os direitos da crianca (BPC, transporte, escola) nao estao garantidos",
          "Ha satisfacao geral com o cuidado recebido pela equipe",
          "A qualidade de vida familiar melhorou com o suporte atual",
          "Ha necessidade de servico social ou assistencia especializada",
          "A familia tem projetos e esperancas para o futuro da crianca",
          "A qualidade de vida familiar esta melhor que no ano anterior",
        ],
      },
    ],
  },

  // ── j26-244 — PC Inclusão Escolar e Social ──
  "j26-244": {
    instruction: "Avalie a inclusao escolar e social da crianca com paralisia cerebral. Marque o que esta acontecendo nas ultimas semanas.",
    infoBox: "Monitoramento de inclusao na PC. Pontuacao alta = maior dificuldade de inclusao. Nao e diagnostico.",
    labels: ["Nunca", "As vezes", "Frequentemente"],
    optionPoints: [0, 1, 2],
    scoreDirection: "higher_worse",
    totalLabel: "Dificuldades de inclusao na PC (0-28)",
    bands: [
      { minPct: 0, classification: "Boa inclusao", color: "emerald", description: "Boa inclusao escolar e social. Manter vigilancia." },
      { minPct: 25, classification: "Dificuldades leves", color: "amber", description: "Ha dificuldades pontuais. Oriente escola e familia." },
      { minPct: 45, classification: "Dificuldades moderadas", color: "orange", description: "Inclusao com impacto relevante. Intensifique o suporte." },
      { minPct: 67, classification: "Dificuldades importantes", color: "red", description: "Inclusao comprometida. Avalie suporte especializado." },
    ],
    domains: [
      {
        name: "Escola",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          "Ha barreiras fisicas de acessibilidade na escola",
          "O professor nao esta preparado para a inclusao da crianca",
          "As adaptacoes curriculares nao estao sendo feitas",
          "Ha exclusao ou limitacao de participacao nas atividades escolares",
          "O material escolar nao esta adaptado as necessidades da crianca",
          "Nao ha auxiliar de inclusao quando necessario",
          "A crianca esta se sentindo excluida pelos colegas na escola",
        ],
      },
      {
        name: "Social e lazer",
        color: "text-teal-600 dark:text-teal-400",
        items: [
          "Ha barreiras de acessibilidade nos espacos de lazer",
          "A crianca nao tem acesso a esporte ou cultura adaptada",
          "A crianca tem poucos ou nenhum amigo fora da escola especial",
          "A familia evita frequentar locais por causa das barreiras",
          "A inclusao escolar melhorou desde o inicio do acompanhamento",
          "A escola tem sido parceira na inclusao e nas adaptacoes",
          "Os pais se sentem acolhidos e apoiados pela escola",
          "A crianca demonstra bem-estar e pertencimento no ambiente escolar",
        ],
      },
    ],
  },

  // ── j26-245 — PC Sono e Conforto Noturno ──
  "j26-245": {
    instruction: "Avalie a qualidade do sono e o conforto noturno da crianca com paralisia cerebral. Marque o que esta presente nas ultimas semanas.",
    infoBox: "Monitoramento de sono na PC. Pontuacao alta = maior impacto no sono. Nao e diagnostico.",
    labels: ["Nunca", "As vezes", "Frequentemente"],
    optionPoints: [0, 1, 2],
    scoreDirection: "higher_worse",
    totalLabel: "Impacto no sono e conforto noturno na PC (0-28)",
    bands: [
      { minPct: 0, classification: "Sono adequado", color: "emerald", description: "Sono preservado. Manter vigilancia de rotina." },
      { minPct: 25, classification: "Impacto leve", color: "amber", description: "Ha impacto leve no sono. Oriente higiene do sono e reavalie." },
      { minPct: 45, classification: "Impacto moderado", color: "orange", description: "Impacto relevante no sono. Considere avaliacao de sono e ajustes." },
      { minPct: 67, classification: "Impacto importante", color: "red", description: "Sono muito comprometido. Avaliacao especializada necessaria." },
    ],
    domains: [
      {
        name: "Qualidade do sono",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          "Ha dificuldade de adormecer por desconforto posicional",
          "Acorda frequentemente durante a noite",
          "Ha bruxismo ou movimentos involuntarios noturnos",
          "Ha apneia do sono ou ronco intenso",
          "Ha espasmos ou posturas dolorosas que interrompem o sono",
          "Ha refluxo gastroesofagico noturno que piora o sono",
          "O sono e curto para a faixa etaria mesmo sem acordar",
        ],
      },
      {
        name: "Conforto e manejo noturno",
        color: "text-teal-600 dark:text-teal-400",
        items: [
          "O posicionamento noturno com ortese ou almofada esta adequado",
          "Ha lesao de pele ou escaras por posicionamento inadequado",
          "O cuidador precisa levantar varias vezes por noite para reposicionar",
          "A cama ou superficie de sono e adequada as necessidades da crianca",
          "O sono da crianca impacta significativamente o sono do cuidador",
          "O sono melhorou com os ajustes de posicionamento ou medicacao",
          "Ha necessidade de polissonografia ou avaliacao especializada",
          "O conforto noturno esta adequado com o suporte atual",
        ],
      },
    ],
  },

  // ── j26-246 — PC Alimentação e Deglutição ──
  "j26-246": {
    instruction: "Avalie a alimentacao e a degluticao da crianca com paralisia cerebral. Marque o que esta presente ou dificultando a nutricao.",
    infoBox: "Monitoramento de alimentacao e degluticao na PC. Pontuacao alta = maior dificuldade de alimentacao. Nao e diagnostico.",
    labels: ["Ausente", "Leve", "Moderado", "Intenso"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "Dificuldades de alimentacao na PC (0-48)",
    bands: [
      { minPct: 0, classification: "Alimentacao adequada", color: "emerald", description: "Alimentacao sem dificuldades relevantes. Manter vigilancia." },
      { minPct: 20, classification: "Dificuldades leves", color: "amber", description: "Ha dificuldades leves. Oriente posicionamento e fonoterapia." },
      { minPct: 40, classification: "Dificuldades moderadas - ponderar", color: "orange", description: "Dificuldades relevantes. Avalie suplementacao e plano nutricional." },
      { minPct: 65, classification: "Dificuldades importantes - intervir", color: "red", description: "Alimentacao comprometida. Avalie gastrostomia ou suporte intensivo." },
    ],
    domains: [
      {
        name: "Degluticao e seguranca",
        color: "text-orange-600 dark:text-orange-400",
        items: [
          "Ha engasgos frequentes durante as refeicoes",
          "Ha tosse ou engasgo ao deglutir liquidos",
          "Ha suspeita de aspiracao silenciosa",
          "O tempo das refeicoes e superior a 30 minutos",
          "Ha recusa alimentar por dificuldade de degluticao",
          "Ha pneumonias de repeticao (suspeita de aspiracao)",
        ],
      },
      {
        name: "Nutricao e suporte",
        color: "text-red-600 dark:text-red-400",
        items: [
          "Ha desnutricao ou desaceleracao do crescimento",
          "Ha constipacao cronica que piora o conforto",
          "Ha refluxo gastroesofagico intenso ou vomitos frequentes",
          "A crianca usa gastrostomia ou sonda nasoenteral",
          "Ha necessidade de modificacao de textura dos alimentos",
          "A avaliacao por fonoaudiologia de degluticao esta em dia",
          "A nutricao esta sendo monitorada por nutricionista",
          "A alimentacao esta adequada para as necessidades da crianca",
        ],
      },
    ],
  },

  // ── j26-247 — PC Órteses e Adaptações Equipamentos ──
  "j26-247": {
    instruction: "Avalie o uso e a adequacao das orteses e adaptacoes de equipamentos para a crianca com PC. Marque o que esta presente.",
    infoBox: "Monitoramento de orteses e adaptacoes na PC. Pontuacao alta = maior necessidade de revisao. Nao e diagnostico.",
    labels: ["Ausente", "Leve", "Moderado", "Intenso"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "Necessidades de ajuste em orteses e adaptacoes (0-36)",
    bands: [
      { minPct: 0, classification: "Sem necessidades relevantes", color: "emerald", description: "Orteses e adaptacoes adequadas. Manter vigilancia de rotina." },
      { minPct: 20, classification: "Necessidades leves", color: "amber", description: "Ha ajustes leves necessarios. Solicite avaliacao especializada." },
      { minPct: 40, classification: "Necessidades moderadas", color: "orange", description: "Ajustes importantes necessarios. Encaminhe para ortesista/TO urgente." },
      { minPct: 65, classification: "Necessidades importantes", color: "red", description: "Equipamentos inadequados comprometendo funcionalidade e conforto." },
    ],
    domains: [
      {
        name: "Orteses de membros inferiores",
        color: "text-teal-600 dark:text-teal-400",
        items: [
          "A ortese de tornozelo (AFO) nao esta mais adequada ao crescimento",
          "A ortese esta causando lesao de pele, pressao ou dor",
          "A crianca recusa usar a ortese por desconforto",
          "Ha necessidade de nova avaliacao para ortese de membro inferior",
          "A ortese esta sendo efetiva na melhora da marcha e postura",
          "Ha necessidade de nova ortese por crescimento ou piora clinica",
        ],
      },
      {
        name: "Equipamentos e adaptacoes",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          "A cadeira de rodas ou andador nao esta adequado ao crescimento",
          "O assento postural ou adaptacoes de cadeira precisam de ajuste",
          "O material escolar adaptado nao esta sendo fornecido",
          "Ha necessidade de novo dispositivo ou adaptacao de tecnologia assistiva",
          "Os equipamentos atuais estao sendo efetivos e bem utilizados",
          "A solicitacao de equipamentos via SUS ou plano esta em andamento",
          "Ha necessidade de avaliacao urgente para novo equipamento",
          "Todos os equipamentos necessarios estao sendo fornecidos",
        ],
      },
    ],
  },

  // ── j26-248 — PC Sobrecarga do Cuidador ──
  "j26-248": {
    instruction: "Avalie a sobrecarga do cuidador principal da crianca com paralisia cerebral. Marque o que esta presente nas ultimas semanas.",
    infoBox: "Avaliacao de sobrecarga do cuidador na PC (estrutura Zarit adaptado). Pontuacao alta = maior sobrecarga. Nao e diagnostico.",
    labels: ["Nunca", "As vezes", "Frequentemente"],
    optionPoints: [0, 1, 2],
    scoreDirection: "higher_worse",
    totalLabel: "Sobrecarga do cuidador na PC (0-32)",
    bands: [
      { minPct: 0, classification: "Sem sobrecarga relevante", color: "emerald", description: "Cuidador sem sobrecarga relevante. Manter vigilancia e suporte." },
      { minPct: 25, classification: "Sobrecarga leve", color: "amber", description: "Ha sinais de sobrecarga leve. Oriente recursos e pausas de cuidado." },
      { minPct: 45, classification: "Sobrecarga moderada", color: "orange", description: "Sobrecarga relevante. Avalie suporte psicossocial e servicos de respiro." },
      { minPct: 67, classification: "Sobrecarga importante", color: "red", description: "Sobrecarga intensa. Intervencao urgente de suporte ao cuidador." },
    ],
    domains: [
      {
        name: "Fisica e emocional",
        color: "text-violet-600 dark:text-violet-400",
        items: [
          "Sente cansaco fisico intenso pelo cuidado diario",
          "Sente esgotamento emocional ou desesperanca",
          "Chora com frequencia ou sente-se deprimido",
          "Nao tem tempo para si mesmo ou para atividades de lazer",
          "A saude propria foi negligenciada pelo cuidado da crianca",
          "Sente-se sozinho no cuidado sem apoio suficiente",
        ],
      },
      {
        name: "Social e perspectiva",
        color: "text-orange-600 dark:text-orange-400",
        items: [
          "Abriu mao de atividades importantes por causa do cuidado",
          "Sente que a crianca consome todos os seus recursos",
          "Ha conflito constante com o parceiro por causa do cuidado",
          "Se sente sem perspectiva para o futuro da crianca",
          "Tem medo do que vai acontecer quando nao puder mais cuidar",
          "A sobrecarga melhorou com o suporte e os servicos disponiveis",
          "Ha necessidade de encaminhamento para saude mental do cuidador",
          "O cuidador tem apoio suficiente para manter a qualidade do cuidado",
        ],
      },
    ],
  },


  // ── j26-249 — Ansiedade Pós-Terapia Comparativo ──
  // ── j26-250 — Depressão CDI-2/PHQ-A Sequencial ──
  // ── j26-251 — Autolesão e Ideação Suicida Evolutivo ──
  // ── j26-252 — TOC Resposta ao Tratamento ──
  // ── j26-253 — TEPT Evolução Pós-Terapia ──
  // ── j26-254 — Regulação Emocional Global Acompanhamento ──
  // ── j26-255 — Metabólico Antipsicóticos Monitorização ──
  // ── j26-256 — Crescimento Estimulantes Acompanhamento ──
  // ── j26-257 — Ajuste de Dose Eficácia vs Efeitos ──
  // ── j26-258 — Hepático Hematológico Antiepilépticos ──
  // ── j26-259 — CGI-S e CGI-I Gravidade e Melhora ──
  // ── j26-260 — Encerramento e Alta do Tratamento ──
  "j26-260": {
    instruction: "Avalie a prontidao para encerramento, alta ou espacamento do acompanhamento. Marque o que esta presente ou atingido.",
    infoBox: "Avaliacao de prontidao para alta ou encerramento do tratamento. Maior pontuacao = maior prontidao para alta. Nao e diagnostico.",
    labels: ["Nao atingido", "Parcialmente atingido", "Atingido com ressalvas", "Plenamente atingido"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_better",
    totalLabel: "Prontidao para encerramento ou alta (maior = mais pronto)",
    bands: [
      { minPct: 85, classification: "Pronto para alta ou espacamento", color: "emerald", description: "Criterios de alta amplamente atingidos. Alta ou espacamento indicados." },
      { minPct: 60, classification: "Quase pronto - revisar", color: "amber", description: "A maioria dos criterios foi atingida. Revise os itens pendentes antes de encerrar." },
      { minPct: 40, classification: "Criterios parciais - aguardar", color: "orange", description: "Criterios parcialmente atingidos. Continue o acompanhamento antes de considerar alta." },
      { minPct: 0, classification: "Nao pronto para alta", color: "red", description: "Criterios de alta nao atingidos. Mantenha o plano terapeutico atual." },
    ],
    domains: [
      {
        name: "Criterios clinicos e funcionais",
        color: "text-teal-600 dark:text-teal-400",
        items: [
          "A queixa principal que motivou o encaminhamento esta resolvida ou estabilizada",
          "Os objetivos terapeuticos do plano atual foram atingidos",
          "A funcionalidade escolar esta adequada ou em nivel aceitavel",
          "A funcionalidade familiar e social esta preservada",
          "A medicacao, se houver, esta em regime estavel e seguro",
          "O diagnostico esta claro e a familia compreende a condicao",
        ],
      },
      {
        name: "Competencias e continuidade",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          "A familia tem competencia para manejar situacoes do cotidiano",
          "A escola tem suporte adequado para a continuidade sem o clinico",
          "Ha plano de crise documentado para situacoes de emergencia",
          "A crianca tem acompanhamento de outras especialidades necessarias",
          "A familia sabe os sinais de alerta para retorno precoce",
          "Ha servico de referencia para acompanhamento longitudinal",
          "O paciente e a familia concordam com o encerramento ou espacamento",
          "Ha retorno agendado ou criterio claro para retornar se necessario",
        ],
      },
    ],
  },


};
