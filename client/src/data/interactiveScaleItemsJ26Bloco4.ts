import type { InteractiveScaleDef } from "./interactiveScaleItems";

export const j26Bloco4Items: Record<string, InteractiveScaleDef> = {

  // ── j26-196 — Ansiedade Pais UTIN ──
  // ── j26-197 — Icterícia Neonatal Seguimento ──
  // ── j26-198 — Estimulante Efeitos Acompanhamento ──
  // ── j26-199 — Antiepiléptico Monitorização Ampla ──
  // ── j26-200 — Antipsicótico Metabólico ──
  // ── j26-201 — Prematuridade Seguimento Global ──
  "j26-201": {
    instruction: "Avalie o desenvolvimento global do prematuro nesta consulta. Marque o que está presente ou parcialmente presente para a idade corrigida.",
    infoBox: "Seguimento neurológico global de prematuros. Maior pontuação = mais habilidades presentes. Não é diagnóstico.",
    labels: ["Não observado", "Emergente", "Parcial", "Adequado"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_better",
    totalLabel: "Desenvolvimento global do prematuro (maior = melhor)",
    bands: [
      { minPct: 85, classification: "Desempenho adequado", color: "emerald", description: "Maioria dos marcos presentes para a idade corrigida. Mantenha vigilância de rotina." },
      { minPct: 60, classification: "Em desenvolvimento - vigiar", color: "amber", description: "Há habilidades presentes mas algumas áreas merecem atenção. Reavalie em 1-2 meses." },
      { minPct: 40, classification: "Atraso possível - reavaliar", color: "orange", description: "Desempenho abaixo do esperado para a idade corrigida. Considere avaliação dirigida." },
      { minPct: 0, classification: "Atraso provável - encaminhar", color: "red", description: "Poucas habilidades presentes. Investigar e encaminhar para estimulação precoce." },
    ],
    domains: [
      {
        name: "Motor e tônus (idade corrigida)",
        color: "text-teal-600 dark:text-teal-400",
        items: [
          "Tônus muscular adequado para a idade corrigida",
          "Marco motor compatível com a faixa etária corrigida",
          "Ausência de assimetria motora relevante",
          "Sem sinais de paralisia cerebral ou espasticidade",
          "Transferência de peso e sustentação conforme esperado",
          "Motor fino emergindo conforme a idade corrigida",
        ],
      },
      {
        name: "Cognitivo, linguagem e social",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          "Desenvolvimento cognitivo adequado para a idade corrigida",
          "Linguagem receptiva e expressiva conforme a faixa etária",
          "Sorriso social e interação conforme esperado",
          "Atenção e exploração do ambiente presentes",
          "Sem sinais de risco de TEA na faixa etária atual",
          "Audição confirmada normal (TANU ou audiometria)",
          "Peso, estatura e PC em curva adequada para a idade corrigida",
          "Seguimento com equipe multiprofissional está ocorrendo",
        ],
      },
    ],
  },


  // ── j26-202 — Polifarmácia Risco Pediátrico ──
  // ── j26-203 — Interação Medicamentosa Monitorização ──
  "j26-203": {
    instruction: "Revise as medicações em uso e marque os riscos ou problemas identificados nesta consulta. Utilize dados do prontuário e da anamnese.",
    infoBox: "Monitoramento de interações medicamentosas em crianças com multimorbidade. Pontuação alta = maior risco de interação. Não é diagnóstico.",
    labels: ["Ausente", "Leve", "Moderado", "Intenso"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "Risco de interação medicamentosa (0-48)",
    bands: [
      { minPct: 0, classification: "Sem efeitos relevantes", color: "emerald", description: "Sem interações clinicamente relevantes identificadas." },
      { minPct: 20, classification: "Risco leve", color: "amber", description: "Interações potenciais presentes. Registre e acompanhe." },
      { minPct: 40, classification: "Risco moderado - ponderar", color: "orange", description: "Interações com potencial clínico. Avalie beneficio vs risco." },
      { minPct: 65, classification: "Risco importante - revisar", color: "red", description: "Interações com alto potencial de dano. Revisão urgente do esquema." },
    ],
    domains: [
      {
        name: "Interações farmacocinéticas",
        color: "text-violet-600 dark:text-violet-400",
        items: [
          "Há combinação que altera o metabolismo hepático (CYP450)",
          "Há remedio que reduz absorção de outro (antiepiléticos x micronutrientes)",
          "Há combinação que altera a excreção renal de outro farmaco",
          "Há remedio que desloca ligação proteica aumentando nível livre",
          "Há potencialização do efeito de sedação ou de depressão do SNC",
          "Há redução da eficacia antiepilética por interação",
        ],
      },
      {
        name: "Interações farmacodinâmicas e segurança",
        color: "text-red-600 dark:text-red-400",
        items: [
          "Há risco de prolongamento do intervalo QTc",
          "Há risco de síndrome serotoninérgica",
          "Há risco aditivo de hepatotoxicidade",
          "Há risco aditivo de mielossupressão",
          "Há risco de crise hipertensiva (IMAO x estimulantes)",
          "A revisão medicamentosa está atualizada e documentada",
          "A família foi orientada sobre os riscos identificados",
          "O esquema atual foi otimizado para minimizar interações",
        ],
      },
    ],
  },


  // ── j26-204 — Tiques Monitorização ──
  // ── j26-205 — Tiques e Comorbidades TEA TDAH ──
  "j26-205": {
    instruction: "Avalie a relação dos tiques com as comorbidades presentes. Marque o que está presente nas últimas 4 semanas.",
    infoBox: "Avaliação de tiques no contexto de TEA e TDAH. Pontuação alta = maior impacto combinado. Não é diagnóstico.",
    labels: ["Nunca", "Às vezes", "Frequentemente"],
    optionPoints: [0, 1, 2],
    scoreDirection: "higher_worse",
    totalLabel: "Impacto dos tiques com comorbidades (0-28)",
    bands: [
      { minPct: 0, classification: "Sem alteração relevante", color: "emerald", description: "Baixa pontuação. Manter vigilância clínica de rotina." },
      { minPct: 25, classification: "Sinais leves", color: "amber", description: "Há sinais leves ou ocasionais. Oriente observação e reavalie." },
      { minPct: 45, classification: "Sinais moderados", color: "orange", description: "Sinais relevantes presentes. Correlacione com comorbidades." },
      { minPct: 67, classification: "Alteração importante", color: "red", description: "Escore elevado. Avalie impacto funcional e necessidade de intervenção." },
    ],
    domains: [
      {
        name: "Tiques e TEA",
        color: "text-violet-600 dark:text-violet-400",
        items: [
          "Os tiques são dificieis de diferenciar das estereotipias do TEA",
          "Os tiques pioram em situações de transição ou mudança de rotina",
          "Os tiques interferem na comunicação ou nas interações sociais",
          "Há ansiedade social que piora os tiques em público",
          "Os tiques são motivo de bullying ou exclusão escolar",
          "Os tiques pioram quando a criança está em sobrecarga sensorial",
        ],
      },
      {
        name: "Tiques e TDAH",
        color: "text-orange-600 dark:text-orange-400",
        items: [
          "Os tiques pioram com o uso do estimulante para TDAH",
          "Os tiques interferem com a concentração e a atenção",
          "Os tiques são mais frequentes em situações de tedio ou baixa estimulação",
          "A criança tenta suprimir os tiques durante tarefas escolares",
          "A medicação para TDAH e a melhor opção apesar dos tiques",
          "O tique e o TDAH estão sendo tratados de forma integrada",
          "Os tiques melhoraram com o ajuste medicamentoso atual",
          "Os tiques estão interferindo mais que o TDAH na funcionalidade",
        ],
      },
    ],
  },


  // ── j26-206 — Irmão Criança com NEE ──
  // ── j26-207 — Privação Social e Negligência ──
  // ── j26-208 — TEA Comunicação Social Evolutiva ──
  "j26-208": {
    instruction: "Marque o que você observa na comunicação e interação social da criança com TEA nas últimas semanas. Compare com o início do acompanhamento.",
    infoBox: "Monitoramento da comunicação social no TEA. Maior pontuação = melhor desenvolvimento social. Não é diagnóstico.",
    labels: ["Não observado", "Emergente", "Parcial", "Adequado"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_better",
    totalLabel: "Comunicação social no TEA (maior = melhor)",
    bands: [
      { minPct: 85, classification: "Desempenho adequado", color: "emerald", description: "Boa comunicação social para o nível de TEA. Mantenha vigilância." },
      { minPct: 60, classification: "Em desenvolvimento - vigiar", color: "amber", description: "Há progressos mas algumas áreas merecem atenção. Reavalie." },
      { minPct: 40, classification: "Atraso possível - reavaliar", color: "orange", description: "Comunicação social abaixo do esperado. Considere intensificação." },
      { minPct: 0, classification: "Atraso provável - encaminhar", color: "red", description: "Comunicação social muito limitada. Investigue e intensifique suporte." },
    ],
    domains: [
      {
        name: "Contato e interação",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          "Busca contato visual em interações significativas",
          "Responde ao próprio nome quando chamado",
          "Inicia interações espontâneas com familiares",
          "Demonstra afeto e vinculo com os cuidadores",
          "Compartilha alegria ou descobertas (atenção compartilhada)",
          "Imita ações ou expressões de adultos",
        ],
      },
      {
        name: "Comunicação e progresso",
        color: "text-teal-600 dark:text-teal-400",
        items: [
          "Usa gestos funcionais (apontar, acenar, mostrar)",
          "Usa palavras ou sistema de CAA para comunicar necessidades",
          "Compreende instruções simples do cotidiano",
          "Engaja em brincadeira reciproca com adultos",
          "A comunicação social melhorou desde o início da intervenção",
          "A terapia fonoaudiológica ou de ABA está sendo efetiva",
          "A escola tem sido parceira no apoio a comunicação",
          "Há barreiras ambientais que limitam o progresso social",
        ],
      },
    ],
  },

  // ── j26-209 — TEA Linguagem Funcional Acompanhamento ──
  "j26-209": {
    instruction: "Marque o que a criança com TEA consegue fazer em termos de linguagem nas situações do cotidiano. Responda sobre as últimas semanas.",
    infoBox: "Monitoramento de linguagem funcional no TEA. Maior pontuação = melhor linguagem funcional. Não é diagnóstico.",
    labels: ["Não observado", "Emergente", "Parcial", "Adequado"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_better",
    totalLabel: "Linguagem funcional no TEA (maior = melhor)",
    bands: [
      { minPct: 85, classification: "Desempenho adequado", color: "emerald", description: "Linguagem funcional adequada para o nível de TEA. Mantenha vigilância." },
      { minPct: 60, classification: "Em desenvolvimento - vigiar", color: "amber", description: "Há progresso mas algumas funções merecem atenção. Reavalie." },
      { minPct: 40, classification: "Atraso possível - reavaliar", color: "orange", description: "Linguagem funcional abaixo do esperado. Considere intensificação." },
      { minPct: 0, classification: "Atraso provável - encaminhar", color: "red", description: "Linguagem funcional muito limitada. Investigue suporte alternativo." },
    ],
    domains: [
      {
        name: "Comunicação expressiva",
        color: "text-violet-600 dark:text-violet-400",
        items: [
          "Usa palavras ou frases para pedir o que quer",
          "Usa fala, gestos ou CAA para protestar ou recusar",
          "Usa comunicação para comentar ou chamar atenção",
          "A linguagem expressiva progrediu desde o último retorno",
          "Usa frases de 2 ou mais palavras (ou equivalente em CAA)",
          "Iniciou uso de CAA ou PECS com progresso funcional",
        ],
      },
      {
        name: "Comunicação receptiva e pragmática",
        color: "text-teal-600 dark:text-teal-400",
        items: [
          "Compreende instruções de 2 ou mais passos",
          "Entende perguntas simples (onde? quem? o que?)",
          "Segue rotinas verbais ou visuais sem apoio constante",
          "Compreende não-verbal (expressões faciais, tom de voz)",
          "A linguagem receptiva e melhor que a expressiva",
          "A escola ou terapia está usando suporte visual de forma eficaz",
          "Há regressão de linguagem que precisa ser investigada",
          "A fonoterapia está sendo efetiva no desenvolvimento da linguagem",
        ],
      },
    ],
  },

  // ── j26-210 — TEA Autonomia e AVD Follow-up ──
  "j26-210": {
    instruction: "Marque o nível de autonomia nas atividades da vida diária (AVD) da criança com TEA. Avalie o que ela faz sem ajuda, com ajuda parcial ou ainda não faz.",
    infoBox: "Monitoramento de autonomia nas AVD no TEA. Maior pontuação = maior autonomia. Não é diagnóstico.",
    labels: ["Não faz", "Com muita ajuda", "Com ajuda parcial", "Autonomo"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_better",
    totalLabel: "Autonomia nas AVD (maior = mais autonomo)",
    bands: [
      { minPct: 85, classification: "Alta autonomia", color: "emerald", description: "Realizando a maioria das AVD com autonomia. Excelente progresso." },
      { minPct: 60, classification: "Autonomia parcial - vigiar", color: "amber", description: "Há autonomia em algumas áreas. Continue ampliando gradualmente." },
      { minPct: 40, classification: "Dependência relevante", color: "orange", description: "Dependência significativa em AVD. Plano terapêutico de autonomia recomendado." },
      { minPct: 0, classification: "Alta dependência - intervir", color: "red", description: "Dependência intensa em AVD. Avalie necessidades de suporte intensivo." },
    ],
    domains: [
      {
        name: "Autocuidado básico",
        color: "text-teal-600 dark:text-teal-400",
        items: [
          "Controle esfincteriano (urinário e fecal)",
          "Higiene após o banheiro",
          "Escovar os dentes",
          "Lavar as mãos antes das refeições",
          "Tomar banho com supervisão mínima",
          "Vestir-se e descalcar-se",
        ],
      },
      {
        name: "Rotinas e funcionalidade",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          "Alimentar-se com utensilios adequados",
          "Dormir com rotina noturna previsível",
          "Guardar brinquedos e pertences",
          "Seguir rotina escolar com apoio mínimo",
          "Deslocar-se com segurança em ambientes conhecidos",
          "A autonomia nas AVD aumentou desde o início do acompanhamento",
          "Há barreiras ambientais ou sensoriais que limitam a autonomia",
          "A TO ou a escola tem sido efetiva no treinamento de AVD",
        ],
      },
    ],
  },

  // ── j26-211 — TEA Inclusão Escolar Acompanhamento ──
  "j26-211": {
    instruction: "Avalie a inclusão escolar da criança com TEA. Marque o que está ocorrendo na escola nas últimas semanas.",
    infoBox: "Monitoramento de inclusão escolar no TEA. Pontuação alta = maior dificuldade de inclusão. Não é diagnóstico.",
    labels: ["Nunca", "Às vezes", "Frequentemente"],
    optionPoints: [0, 1, 2],
    scoreDirection: "higher_worse",
    totalLabel: "Dificuldades de inclusão escolar no TEA (0-28)",
    bands: [
      { minPct: 0, classification: "Sem alteração relevante", color: "emerald", description: "Boa inclusão escolar. Manter vigilância." },
      { minPct: 25, classification: "Dificuldades leves", color: "amber", description: "Há dificuldades leves. Oriente escola e família e reavalie." },
      { minPct: 45, classification: "Dificuldades moderadas", color: "orange", description: "Dificuldades relevantes de inclusão. Considere suporte educacional adicional." },
      { minPct: 67, classification: "Dificuldades importantes", color: "red", description: "Inclusão comprometida. Avalie necessidade de escola especial ou apoio intensivo." },
    ],
    domains: [
      {
        name: "Participação e interação escolar",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          "Tem dificuldade de permanecer em sala por períodos adequados",
          "Não participa de atividades coletivas com os colegas",
          "Tem conflitos frequentes com colegas ou professores",
          "A escola não tem profissional de apoio (AEE, monitor) quando necessário",
          "Há bullying ou exclusão por parte dos colegas",
          "Os professores não foram orientados sobre o TEA",
          "Há recusa escolar ou grande estresse antes de ir a escola",
        ],
      },
      {
        name: "Adaptações e suporte",
        color: "text-teal-600 dark:text-teal-400",
        items: [
          "A escola não fez adaptações curriculares necessárias",
          "O PEI (plano educacional individualizado) está desatualizado",
          "Há barreiras sensoriais na escola (barulho, luz) sem solução",
          "A escola não usa apoios visuais ou CAA recomendados",
          "A comunicação entre escola e clínico está sendo efetiva",
          "A inclusão melhorou desde o início do acompanhamento",
          "Os pais se sentem apoiados pela escola",
          "O desempenho acadêmico está sendo satisfatório dentro das possibilidades",
        ],
      },
    ],
  },


  // ── j26-212 — Comportamentos Restritivos TEA Baseline vs Atual ──
  // ── j26-213 — TEA Habilidades Adaptativas Follow-up ──
  "j26-213": {
    instruction: "Avalie as habilidades adaptativas da criança com TEA comparando com o início do acompanhamento. Marque o nível atual de cada área.",
    infoBox: "Monitoramento de habilidades adaptativas no TEA (estrutura Vineland). Maior pontuação = melhores habilidades. Não é diagnóstico.",
    labels: ["Não observado", "Emergente", "Parcial", "Adequado"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_better",
    totalLabel: "Habilidades adaptativas no TEA (maior = melhor)",
    bands: [
      { minPct: 85, classification: "Habilidades adequadas", color: "emerald", description: "Bom nível adaptativo para a condição. Mantenha vigilância." },
      { minPct: 60, classification: "Em desenvolvimento - vigiar", color: "amber", description: "Há progressos mas algumas áreas merecem atenção. Reavalie." },
      { minPct: 40, classification: "Deficit relevante - reavaliar", color: "orange", description: "Habilidades adaptativas abaixo do esperado. Considere intensificação." },
      { minPct: 0, classification: "Deficit importante - intervir", color: "red", description: "Deficit adaptativo intenso. Avalie suporte intensivo e recursos." },
    ],
    domains: [
      {
        name: "Socialização e comunicação",
        color: "text-violet-600 dark:text-violet-400",
        items: [
          "Interage com membros da família de forma funcional",
          "Tem habilidades de brincar e compartilhar com pares",
          "Usa comunicação (fala ou CAA) em contextos funcionais",
          "Demonstra compreensão de regras sociais básicas",
          "Adapta o comportamento a diferentes ambientes",
          "As habilidades de socialização melhoraram desde o início",
        ],
      },
      {
        name: "Motor e vida prática",
        color: "text-teal-600 dark:text-teal-400",
        items: [
          "Realiza atividades de autocuidado adequadas para a idade",
          "Motor grosso e fino em nível funcional para a idade",
          "Participa de atividades domésticas simples",
          "Tolera mudancas de atividade sem crise significativa",
          "As habilidades adaptativas globais melhoraram desde o início",
          "O nível adaptativo atual e compatível com a expectativa para o nível de TEA",
          "Há áreas que precisam de intervenção específica urgente",
          "Os apoios ambientais são adequados as necessidades adaptativas",
        ],
      },
    ],
  },


  // ── j26-214 — Integração Sensorial TEA Pós-TO ──
  // ── j26-215 — Crises de Desregulação TEA Antes vs Depois ──
  // ── j26-216 — TEA Funcionalidade Semestral ──
  "j26-216": {
    instruction: "Faca uma avaliação global da funcionalidade da criança com TEA neste semestre. Marque o nível de cada área comparando com 6 meses atrás.",
    infoBox: "Avaliação semestral de funcionalidade no TEA. Maior pontuação = melhor funcionalidade. Não é diagnóstico.",
    labels: ["Piorou", "Estável sem progresso", "Progresso parcial", "Progresso adequado"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_better",
    totalLabel: "Progresso funcional semestral no TEA (maior = melhor)",
    bands: [
      { minPct: 85, classification: "Bom progresso", color: "emerald", description: "Progresso adequado em multiplas áreas. Excelente evolução semestral." },
      { minPct: 60, classification: "Progresso parcial", color: "amber", description: "Progresso em algumas áreas. Identifique barreiras nas áreas estáveis." },
      { minPct: 40, classification: "Progresso limitado", color: "orange", description: "Pouco progresso no semestre. Revise o plano terapêutico." },
      { minPct: 0, classification: "Regressão ou estagnação", color: "red", description: "Poucas ou nenhuma área com progresso. Investigação necessária." },
    ],
    domains: [
      {
        name: "Áreas clínicas e terapêuticas",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          "Comunicação e linguagem",
          "Integração sensorial e regulação",
          "Comportamentos restritivos e repetitivos",
          "Autonomia nas AVD",
          "Controle emocional e manejo de crises",
          "Motor grosso e fino",
        ],
      },
      {
        name: "Áreas de vida e contexto",
        color: "text-teal-600 dark:text-teal-400",
        items: [
          "Inclusão escolar e desempenho acadêmico",
          "Relações sociais com pares",
          "Vinculo familiar e participação em casa",
          "Qualidade de vida geral da criança",
          "Qualidade de vida e bem-estar da família",
          "O plano terapêutico atual está sendo efetivo",
          "Há necessidade de revisão do diagnóstico ou de novas avaliações",
          "Os objetivos terapêuticos do semestre foram atingidos",
        ],
      },
    ],
  },

  // ── j26-217 — TEA TDAH Comorbidade Monitoramento ──
  "j26-217": {
    instruction: "Avalie a interação entre os sintomas de TEA e TDAH na criança. Marque o que está mais impactante nas últimas 2 semanas.",
    infoBox: "Monitoramento de TEA com comorbidade de TDAH. Pontuação alta = maior impacto combinado. Não é diagnóstico.",
    labels: ["Nunca", "Às vezes", "Frequentemente"],
    optionPoints: [0, 1, 2],
    scoreDirection: "higher_worse",
    totalLabel: "Impacto TEA + TDAH combinado (0-28)",
    bands: [
      { minPct: 0, classification: "Sem alteração relevante", color: "emerald", description: "Baixo impacto combinado. Manter vigilância clínica." },
      { minPct: 25, classification: "Impacto leve", color: "amber", description: "Há impacto leve. Oriente observação e reavalie." },
      { minPct: 45, classification: "Impacto moderado", color: "orange", description: "Impacto relevante na funcionalidade. Revise o plano." },
      { minPct: 67, classification: "Impacto importante", color: "red", description: "Impacto alto. Avalie ajuste medicamentoso e intervenções." },
    ],
    domains: [
      {
        name: "Atenção e controle no TEA",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          "Desatenção impede participação em atividades terapêuticas",
          "A hiperatividade piora as estereotipias e a desregulação",
          "Impulsividade gera conflitos além do esperado para o TEA",
          "A medicação para TDAH melhorou a participação nas terapias",
          "A atenção melhorou mas os CRR do TEA persistem intensos",
          "Há piora do TDAH nos períodos sem estimulante (fim de semana)",
          "O TDAH está sendo o principal limitante funcional no momento",
        ],
      },
      {
        name: "Interação social e escola",
        color: "text-teal-600 dark:text-teal-400",
        items: [
          "TDAH piora as habilidades sociais do TEA",
          "Criança e excluida socialmente tanto por TEA quanto por TDAH",
          "A escola tem dificuldade de manejar as duas condições",
          "Há conflito de estrategia entre abordagens para TEA e TDAH",
          "O tratamento combinado está sendo efetivo",
          "A comorbidade está mais controlada que no semestre anterior",
          "Há necessidade de ajuste no suporte escolar para as duas condições",
          "A família está conseguindo manejar as duas condições em casa",
        ],
      },
    ],
  },

  // ── j26-218 — Transição Pré-Escolar para Escolar TEA ──
  "j26-218": {
    instruction: "Avalie a transição da criança com TEA do pre-escolar para o ensino fundamental. Marque o que está acontecendo neste período de mudança.",
    infoBox: "Monitoramento da transição escolar no TEA. Pontuação alta = maior dificuldade na transição. Não é diagnóstico.",
    labels: ["Nunca", "Às vezes", "Frequentemente"],
    optionPoints: [0, 1, 2],
    scoreDirection: "higher_worse",
    totalLabel: "Dificuldades na transição escolar TEA (0-28)",
    bands: [
      { minPct: 0, classification: "Transição tranquila", color: "emerald", description: "A criança está se adaptando bem a nova escola. Manter vigilância." },
      { minPct: 25, classification: "Dificuldades leves", color: "amber", description: "Há dificuldades pontuais. Oriente a escola e a família." },
      { minPct: 45, classification: "Dificuldades moderadas", color: "orange", description: "Transição com impacto relevante. Intensifique o suporte." },
      { minPct: 67, classification: "Transição difícil", color: "red", description: "Transição muito difícil. Avalie antecipação e suporte especializado." },
    ],
    domains: [
      {
        name: "Adaptação e comportamento",
        color: "text-orange-600 dark:text-orange-400",
        items: [
          "A criança está recusando ir para a nova escola",
          "Há aumento de crises de desregulação após a mudança de escola",
          "A criança está mais agitada ou ansiosa nas semanas de escola",
          "Há aumento de estereotipias e CRR com a mudança",
          "A criança perdeu habilidades adquiridas no pre-escolar",
          "Há regressão de linguagem ou AVD desde a mudança",
          "A transição foi mais difícil que o esperado para o nível de TEA",
        ],
      },
      {
        name: "Suporte e planejamento",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          "A nova escola ainda não conhece as necessidades da criança",
          "O PEI da nova escola ainda não foi elaborado ou compartilhado",
          "Há falta de monitor ou apoio especializado na nova escola",
          "A família não foi orientada sobre como apoiar a transição",
          "A nova escola foi visitada com antecedência para adaptação",
          "O profissional de referência passou informações para a nova escola",
          "A criança está se adaptando progressivamente a nova rotina",
          "O suporte planejado está sendo suficiente para a transição",
        ],
      },
    ],
  },


  // ── j26-219 — SNAP-IV Monitorização TDAH ──
  // ── j26-220 — TDAH Desempenho Escolar Follow-up ──
  "j26-220": {
    instruction: "Avalie o desempenho escolar da criança com TDAH. Marque o que está presente nas últimas semanas de escola.",
    infoBox: "Monitoramento de desempenho escolar no TDAH. Pontuação alta = maior impacto no desempenho. Não é diagnóstico.",
    labels: ["Nunca", "Às vezes", "Frequentemente"],
    optionPoints: [0, 1, 2],
    scoreDirection: "higher_worse",
    totalLabel: "Impacto do TDAH no desempenho escolar (0-28)",
    bands: [
      { minPct: 0, classification: "Sem alteração relevante", color: "emerald", description: "Desempenho escolar preservado. Manter vigilância." },
      { minPct: 25, classification: "Impacto leve", color: "amber", description: "Há impacto leve no desempenho. Oriente escola e família." },
      { minPct: 45, classification: "Impacto moderado", color: "orange", description: "Impacto relevante. Avalie adaptações e suporte escolar." },
      { minPct: 67, classification: "Impacto importante", color: "red", description: "Impacto alto no desempenho. Intervenção urgente recomendada." },
    ],
    domains: [
      {
        name: "Aprendizagem e produção",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          "Não termina as atividades em sala no tempo disponível",
          "Os cadernos e materiais estão desorganizados e incompletos",
          "Perde ou esquece materiais e tarefas com frequência",
          "O desempenho em provas e muito abaixo da capacidade real",
          "O professor reporta que não consegue se concentrar",
          "Há queda nas notas desde o último retorno",
          "Tem dificuldade de copiar do quadro com eficiência",
        ],
      },
      {
        name: "Comportamento escolar",
        color: "text-orange-600 dark:text-orange-400",
        items: [
          "Interrupções frequentes da aula por parte da criança",
          "Conflitos com colegas por impulsividade",
          "O professor tem reclamações frequentes do comportamento",
          "Há adaptações escolares que estão sendo efetivas",
          "O rendimento escolar melhorou com o tratamento medicamentoso",
          "O suporte educacional especializado está disponível",
          "A família e a escola estão alinhadas no plano de manejo",
          "O desempenho escolar está melhor que no semestre anterior",
        ],
      },
    ],
  },

  // ── j26-221 — TDAH Relações Sociais e Comportamento ──
  "j26-221": {
    instruction: "Avalie as relações sociais e o comportamento interpessoal da criança com TDAH. Marque o que está presente nas últimas semanas.",
    infoBox: "Monitoramento de relações sociais no TDAH. Pontuação alta = maior dificuldade social. Não é diagnóstico.",
    labels: ["Nunca", "Às vezes", "Frequentemente"],
    optionPoints: [0, 1, 2],
    scoreDirection: "higher_worse",
    totalLabel: "Dificuldades sociais no TDAH (0-28)",
    bands: [
      { minPct: 0, classification: "Sem alteração relevante", color: "emerald", description: "Relações sociais preservadas. Manter vigilância." },
      { minPct: 25, classification: "Dificuldades leves", color: "amber", description: "Há dificuldades pontuais. Oriente família e escola." },
      { minPct: 45, classification: "Dificuldades moderadas", color: "orange", description: "Impacto relevante nas relações. Avalie intervenção social." },
      { minPct: 67, classification: "Dificuldades importantes", color: "red", description: "Isolamento ou conflito social intenso. Intervenção necessária." },
    ],
    domains: [
      {
        name: "Relações com pares",
        color: "text-violet-600 dark:text-violet-400",
        items: [
          "Tem dificuldade de manter amizades por causa da impulsividade",
          "Interrupe ou domina as brincadeiras dos colegas",
          "E excluido ou evitado pelos colegas na escola",
          "Tem conflitos frequentes em jogos ou brincadeiras em grupo",
          "Chora muito ou reage de forma intensa quando perde jogos",
          "Não consegue respeitar regras sociais nas brincadeiras",
          "Tem poucas ou nenhuma amizade estável",
        ],
      },
      {
        name: "Família e contexto",
        color: "text-orange-600 dark:text-orange-400",
        items: [
          "Os conflitos com irmaos são frequentes e intensos",
          "Os pais relatam dificuldade de manejar o comportamento em público",
          "A criança e excluida de atividades extracurriculares por comportamento",
          "As relações sociais melhoraram com o tratamento do TDAH",
          "A habilidade social está sendo trabalhada em terapia",
          "A família foi orientada sobre o impacto social do TDAH",
          "Há bullying relacionado ao comportamento do TDAH",
          "As relações sociais estão melhores que no semestre anterior",
        ],
      },
    ],
  },


  // ── j26-222 — Efeitos do Metilfenidato/Lisdexanfetamina ──
  // ── j26-223 — Efeito Rebote Estimulante Monitor ──
  "j26-223": {
    instruction: "Avalie a intensidade do efeito rebote da medicação estimulante no fim do dia. Marque o que a família e a escola observam.",
    infoBox: "Monitoramento específico do efeito rebote (rebound) ao final da ação do estimulante. Pontuação alta = rebote mais intenso. Não é diagnóstico.",
    labels: ["Ausente", "Leve", "Moderado", "Intenso"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "Intensidade do efeito rebote (0-36)",
    bands: [
      { minPct: 0, classification: "Sem rebote relevante", color: "emerald", description: "Transição ao fim do efeito adequada. Manter vigilância de rotina." },
      { minPct: 20, classification: "Rebote leve", color: "amber", description: "Rebote leve ou ocasional. Oriente estrategias de transição e reavalie." },
      { minPct: 40, classification: "Rebote moderado - ponderar", color: "orange", description: "Rebote relevante. Considere ajuste de horário ou formulação." },
      { minPct: 65, classification: "Rebote importante - revisar", color: "red", description: "Rebote intenso. Revisão da formulação ou dose do estimulante." },
    ],
    domains: [
      {
        name: "Comportamento no rebote",
        color: "text-orange-600 dark:text-orange-400",
        items: [
          "Choro fácil ou irritabilidade intensa no fim do efeito",
          "Explosões de raiva desproporcional a noite",
          "Hiperatividade maior que antes do início do estimulante",
          "Impulsividade exacerbada nas horas seguintes ao fim do efeito",
          "Conflitos familiares aumentam no período do rebote",
          "O rebote interfere nas tarefas de casa e na rotina noturna",
        ],
      },
      {
        name: "Sono e transição",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          "Há dificuldade de adormecer associada ao rebote",
          "A criança fica agitada até tarde por causa do rebote",
          "Uma dose menor no fim da tarde reduziria o rebote",
          "A formulação de liberação prolongada não está sendo eficaz no controle do rebote",
          "O horário da última dose precisa ser ajustado",
          "O rebote está pior do que no início do tratamento",
          "O rebote está prejudicando a qualidade de vida familiar",
          "O rebote melhorou com o ajuste de formulação ou horário",
        ],
      },
    ],
  },


  // ── j26-224 — Sono e Apetite TDAH Tratamento ──
  // ── j26-225 — Sono na Epilepsia Monitorização ──
  "j26-225": {
    instruction: "Avalie o impacto da epilepsia e do antiepilético no sono da criança. Marque o que está presente nas últimas semanas.",
    infoBox: "Monitoramento de distúrbios do sono na epilepsia. Pontuação alta = maior impacto no sono. Não é diagnóstico.",
    labels: ["Nunca", "Às vezes", "Frequentemente"],
    optionPoints: [0, 1, 2],
    scoreDirection: "higher_worse",
    totalLabel: "Impacto no sono relacionado a epilepsia (0-28)",
    bands: [
      { minPct: 0, classification: "Sem alteração relevante", color: "emerald", description: "Sono preservado. Manter vigilância de rotina." },
      { minPct: 25, classification: "Impacto leve", color: "amber", description: "Há impacto leve no sono. Oriente higiene do sono e reavalie." },
      { minPct: 45, classification: "Impacto moderado", color: "orange", description: "Impacto relevante no sono. Considere PSG ou ajuste do antiepilético." },
      { minPct: 67, classification: "Impacto importante", color: "red", description: "Sono muito comprometido. Avaliação urgente do sono necessária." },
    ],
    domains: [
      {
        name: "Crises e sono",
        color: "text-red-600 dark:text-red-400",
        items: [
          "Tem crises que ocorrem exclusivamente no sono",
          "Acorda abruptamente durante a noite (suspeita de crise)",
          "Faz movimentos repetitivos ou automatismos noturnos",
          "Há medo de dormir por causa da epilepsia",
          "Os pais vigiam o sono da criança por medo de crises noturnas",
          "Há evidência de crises noturnas subdiagnosticadas",
          "O EEG do sono foi realizado ou está indicado",
        ],
      },
      {
        name: "Impacto do antiepilético no sono",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          "O antiepilético causa sonolência excessiva durante o dia",
          "Há insonia ou latência aumentada por causa do antiepilético",
          "O ajuste de horário do antiepilético poderia melhorar o sono",
          "O sono melhorou com o controle das crises",
          "Há apneia do sono associada que precisa de avaliação",
          "A qualidade do sono está piorando progressivamente",
          "A família está exausta pela vigilância noturna constante",
          "O sono está melhor que no retorno anterior",
        ],
      },
    ],
  },

  // ── j26-226 — Dieta Cetogênica Epilepsia Monitor ──
  "j26-226": {
    instruction: "Avalie a adesão e os efeitos da dieta cetogênica no controle da epilepsia. Marque o que está presente nas últimas semanas.",
    infoBox: "Monitoramento de adesão e efeitos da dieta cetogênica na epilepsia refratária. Pontuação alta = maior carga de dificuldades. Não é diagnóstico.",
    labels: ["Ausente", "Leve", "Moderado", "Intenso"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "Dificuldades com a dieta cetogênica (0-48)",
    bands: [
      { minPct: 0, classification: "Sem dificuldades relevantes", color: "emerald", description: "Adesão adequada e sem efeitos relevantes. Manter vigilância." },
      { minPct: 20, classification: "Dificuldades leves", color: "amber", description: "Há dificuldades leves. Oriente a família e reavalie." },
      { minPct: 40, classification: "Dificuldades moderadas - ponderar", color: "orange", description: "Dificuldades relevantes. Considere ajuste do protocolo." },
      { minPct: 65, classification: "Dificuldades importantes - revisar", color: "red", description: "Dieta com alto impacto. Reveja indicação e alternativas." },
    ],
    domains: [
      {
        name: "Adesão e aceitabilidade",
        color: "text-orange-600 dark:text-orange-400",
        items: [
          "A criança recusa os alimentos permitidos na dieta",
          "A família tem dificuldade de preparar as refeições adequadas",
          "Houve quebra da dieta nas últimas semanas",
          "Há dificuldade de adesão em ambientes externos (escola, festas)",
          "O custo dos alimentos específicos e um obstaculo",
          "A família sente-se sobrecarregada pela complexidade da dieta",
        ],
      },
      {
        name: "Efeitos clínicos e laboratoriais",
        color: "text-red-600 dark:text-red-400",
        items: [
          "Há nauseas, vomitos ou dor abdominal relacionados a dieta",
          "Há desaceleração do crescimento ou perda de peso",
          "Há sinais de hipoglicemia ou cetose excessiva",
          "Os exames de colesterol ou lipidios estão alterados",
          "Há constipação intensa associada a dieta",
          "A dieta está reduzindo as crises conforme esperado",
          "Os exames laboratoriais de monitoramento estão em dia",
          "A dieta está sendo efetiva e o beneficio supera os efeitos adversos",
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
    instruction: "Avalie o progresso da linguagem expressiva da criança após a fonoterapia. Marque o que está presente comparando com o início do tratamento.",
    infoBox: "Monitoramento de linguagem expressiva pos-fonoterapia. Maior pontuação = melhor progresso. Não é diagnóstico.",
    labels: ["Não observado", "Emergente", "Parcial", "Adequado"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_better",
    totalLabel: "Progresso da linguagem expressiva (maior = melhor)",
    bands: [
      { minPct: 85, classification: "Bom progresso", color: "emerald", description: "Excelente progresso na linguagem expressiva. Mantenha a intervenção." },
      { minPct: 60, classification: "Progresso parcial - vigiar", color: "amber", description: "Há progressos mas algumas áreas precisam de atenção. Continue." },
      { minPct: 40, classification: "Progresso limitado", color: "orange", description: "Progresso abaixo do esperado. Revise o plano de fonoterapia." },
      { minPct: 0, classification: "Sem progresso - redirecionar", color: "red", description: "Sem progresso expressivo. Considere avaliação e mudança de abordagem." },
    ],
    domains: [
      {
        name: "Vocabulário e morfossintaxe",
        color: "text-violet-600 dark:text-violet-400",
        items: [
          "Vocabulário expressivo ampliou desde o início da fonoterapia",
          "Usa frases mais longas e complexas que antes",
          "Usa verbos e preposições com mais frequência e precisão",
          "A produtividade lexical aumentou (mais palavras por minuto)",
          "Comete menos erros morfossintáxicos que antes",
          "A narrativa oral ficou mais organizada e coerente",
        ],
      },
      {
        name: "Pragmatica e comunicação",
        color: "text-teal-600 dark:text-teal-400",
        items: [
          "Inicia conversas espontâneas com maior frequência",
          "Mantém o topico da conversa por mais tempo",
          "Usa linguagem para diferentes funções comunicativas",
          "A comunicação espontânea em situações novas melhorou",
          "O progresso na fonoterapia está compatível com o tempo de tratamento",
          "Há fatores que limitam o progresso (bilinguismo, cognição, audição)",
          "A família está replicando as atividades em casa com eficacia",
          "A linguagem expressiva está próxima da faixa etária esperada",
        ],
      },
    ],
  },

  // ── j26-234 — Leitura e Escrita Pós-Intervenção ──
  "j26-234": {
    instruction: "Avalie o progresso nas habilidades de leitura e escrita da criança após a intervenção fonoaudiológica ou pedagógica. Marque o nível atual.",
    infoBox: "Monitoramento de leitura e escrita pos-intervenção. Maior pontuação = melhor progresso. Não é diagnóstico.",
    labels: ["Não observado", "Emergente", "Parcial", "Adequado"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_better",
    totalLabel: "Progresso em leitura e escrita (maior = melhor)",
    bands: [
      { minPct: 85, classification: "Bom progresso", color: "emerald", description: "Excelente progresso nas habilidades de alfabetização. Mantenha." },
      { minPct: 60, classification: "Progresso parcial - vigiar", color: "amber", description: "Há progressos mas algumas habilidades merecem atenção." },
      { minPct: 40, classification: "Progresso limitado", color: "orange", description: "Progresso abaixo do esperado. Revise o plano de intervenção." },
      { minPct: 0, classification: "Sem progresso - redirecionar", color: "red", description: "Sem progresso nas habilidades. Avalie novas abordagens." },
    ],
    domains: [
      {
        name: "Leitura",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          "Reconhece letras do alfabeto de forma confiável",
          "Decodifica sílabas e palavras com fluência crescente",
          "Le palavras com regularidade ortográfica sem erros constantes",
          "Avancou no nível de textos que consegue ler com compreensão",
          "A velocidade de leitura oral aumentou",
          "A compreensão leitora melhorou desde o início da intervenção",
        ],
      },
      {
        name: "Escrita e ortografia",
        color: "text-teal-600 dark:text-teal-400",
        items: [
          "Escreve palavras com menos trocas e omissões que antes",
          "A letra (caligrafia) ficou mais legível e organizada",
          "Escreve frases e textos curtos com coerência",
          "Usa pontuação básica com mais frequência",
          "Os erros ortográficos são típicos para a faixa etária",
          "O desempenho em ditado melhorou conforme esperado",
          "A escrita espontânea ficou mais longa e organizada",
          "O progresso em leitura e escrita e compatível com o tempo de intervenção",
        ],
      },
    ],
  },

  // ── j26-235 — Processamento Auditivo Pós-Intervenção ──
  "j26-235": {
    instruction: "Avalie o progresso no processamento auditivo da criança após a intervenção fonoaudiológica. Compare com a avaliação inicial.",
    infoBox: "Monitoramento de processamento auditivo central pos-intervenção. Maior pontuação = melhor processamento. Não é diagnóstico.",
    labels: ["Não observado", "Emergente", "Parcial", "Adequado"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_better",
    totalLabel: "Processamento auditivo central (maior = melhor)",
    bands: [
      { minPct: 85, classification: "Bom progresso", color: "emerald", description: "Excelente progresso no processamento auditivo. Mantenha." },
      { minPct: 60, classification: "Progresso parcial - vigiar", color: "amber", description: "Há progressos mas algumas habilidades precisam de atenção." },
      { minPct: 40, classification: "Progresso limitado", color: "orange", description: "Progresso abaixo do esperado. Revise o plano." },
      { minPct: 0, classification: "Sem progresso - redirecionar", color: "red", description: "Sem progresso. Considere reavaliação e mudança de abordagem." },
    ],
    domains: [
      {
        name: "Discriminação e localização",
        color: "text-violet-600 dark:text-violet-400",
        items: [
          "Distingue sons semelhantes com mais facilidade",
          "Localiza a fonte sonora com mais precisão",
          "Discrimina fala em ambientes com ruido de fundo",
          "Segue instruções verbais em sala barulhenta com menos dificuldade",
          "Repete palavras e pseudopalavras com mais precisão",
          "A discriminação fonológica melhorou conforme esperado",
        ],
      },
      {
        name: "Memória e processamento temporal",
        color: "text-teal-600 dark:text-teal-400",
        items: [
          "Repete sequencias verbais mais longas que antes",
          "O processamento temporal auditivo melhorou",
          "A memória auditiva de curto prazo ficou mais eficiente",
          "A escola relata melhora na compreensão de instruções orais",
          "A criança pede menos repetições que antes",
          "O uso de FM escolar ou suporte acústico está sendo efetivo",
          "Há melhora na leitura e escrita relacionada ao melhor PAC",
          "O progresso no PAC está compatível com o tempo de intervenção",
        ],
      },
    ],
  },


  // ── j26-236 — Fluência Verbal Pós-Fonoterapia ──
  // ── j26-237 — PC Motor Fino Acompanhamento ──
  "j26-237": {
    instruction: "Avalie as habilidades de motor fino da criança com paralisia cerebral. Compare com a avaliação anterior.",
    infoBox: "Monitoramento de motor fino na paralisia cerebral. Maior pontuação = melhor função de motor fino. Não é diagnóstico.",
    labels: ["Não observado", "Emergente", "Parcial", "Adequado"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_better",
    totalLabel: "Função de motor fino na PC (maior = melhor)",
    bands: [
      { minPct: 85, classification: "Bom desempenho", color: "emerald", description: "Motor fino funcional adequado. Mantenha a reabilitação." },
      { minPct: 60, classification: "Desempenho parcial - vigiar", color: "amber", description: "Há progressos mas algumas habilidades merecem atenção. Continue." },
      { minPct: 40, classification: "Desempenho limitado", color: "orange", description: "Motor fino abaixo do esperado para o nível de PC. Intensifique TO." },
      { minPct: 0, classification: "Alta dependência - intervir", color: "red", description: "Motor fino muito comprometido. Avalie dispositivos assistivos." },
    ],
    domains: [
      {
        name: "Preensão e manipulação",
        color: "text-teal-600 dark:text-teal-400",
        items: [
          "Pinca polegar-indicador funcional presente",
          "Preensão de objetos de diferentes tamanhos e formas",
          "Transferência de objetos entre as mãos",
          "Manipulação bimanual funcional (segurar + agir)",
          "Usa o membro mais afetado de forma funcional",
          "A preensão melhorou em relação a avaliação anterior",
        ],
      },
      {
        name: "Escrita e atividades de vida diária",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          "Segura o lapis ou caneta com eficiência",
          "Traca linhas e formas com controle crescente",
          "Realiza atividades de autocuidado que exigem motor fino (botões, ziper)",
          "Usa dispositivos assistivos de forma eficaz (quando indicados)",
          "A ortese para mão ou punho está sendo efetiva",
          "O progresso em motor fino e compatível com o nível de PC (MACS)",
          "Há necessidade de intervenção de toxina para membro superior",
          "A TO está sendo efetiva no progresso do motor fino",
        ],
      },
    ],
  },

  // ── j26-238 — PC Marcha e Postura Follow-up ──
  "j26-238": {
    instruction: "Avalie a marcha e a postura da criança com paralisia cerebral. Compare com a avaliação anterior.",
    infoBox: "Monitoramento de marcha e postura na paralisia cerebral. Maior pontuação = melhor função locomotora. Não é diagnóstico.",
    labels: ["Não observado", "Emergente", "Parcial", "Adequado"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_better",
    totalLabel: "Função de marcha e postura na PC (maior = melhor)",
    bands: [
      { minPct: 85, classification: "Bom desempenho", color: "emerald", description: "Marcha e postura funcionais adequadas. Mantenha a reabilitação." },
      { minPct: 60, classification: "Desempenho parcial - vigiar", color: "amber", description: "Há progressos mas algumas funções merecem atenção." },
      { minPct: 40, classification: "Desempenho limitado", color: "orange", description: "Função locomotora abaixo do esperado. Intensifique fisioterapia." },
      { minPct: 0, classification: "Alta dependência - intervir", color: "red", description: "Marcha muito comprometida. Avalie dispositivos e cirurgia." },
    ],
    domains: [
      {
        name: "Marcha e transferencias",
        color: "text-teal-600 dark:text-teal-400",
        items: [
          "Deambula sem dispositivo de auxilio em distancias funcionais",
          "A qualidade da marcha melhorou em relação a avaliação anterior",
          "Sobe e desce escadas com apoio ou supervisão",
          "Realiza transferencias (sentar-levantar) com autonomia",
          "Corre ou salta com nível funcional adequado para a PC",
          "O GMFCS está estável ou melhorou",
        ],
      },
      {
        name: "Postura e equipamentos",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          "A postura sentada e adequada para as atividades escolares",
          "Usa andador, cadeira de rodas ou bengala de forma eficaz",
          "As orteses para membros inferiores estão ajustadas e efetivas",
          "O cadeirante de rodas está adequado ao crescimento atual",
          "Há contractura ou deformidade em progressão que precisa de atenção",
          "A fisioterapia está prevenindo deformidades musculoesqueléticas",
          "Há indicação de avaliação ortopédica ou cirúrgica",
          "A marcha e postura estão melhores que na avaliação anterior",
        ],
      },
    ],
  },

  // ── j26-239 — PC Dor e Conforto Posicional ──
  "j26-239": {
    instruction: "Avalie a presença de dor e o conforto posicional da criança com paralisia cerebral. Marque o que está presente ou relatado.",
    infoBox: "Monitoramento de dor e conforto na PC. Pontuação alta = maior carga de dor e desconforto. Não é diagnóstico.",
    labels: ["Ausente", "Leve", "Moderado", "Intenso"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "Carga de dor e desconforto na PC (0-48)",
    bands: [
      { minPct: 0, classification: "Sem dor relevante", color: "emerald", description: "Sem dor ou desconforto relevante. Manter vigilância." },
      { minPct: 20, classification: "Dor leve", color: "amber", description: "Há dor ou desconforto leve. Oriente posicionamento e reavalie." },
      { minPct: 40, classification: "Dor moderada - ponderar", color: "orange", description: "Dor moderada. Considere analgesia, ajuste postural ou toxina." },
      { minPct: 65, classification: "Dor importante - intervir", color: "red", description: "Dor intensa. Intervenção urgente de conforto necessária." },
    ],
    domains: [
      {
        name: "Dor musculoesquelética",
        color: "text-red-600 dark:text-red-400",
        items: [
          "Dor no quadril ou na coxa por displasia",
          "Dor nas panturrilhas por espasticidade ou encurtamento",
          "Dor na coluna por postura inadequada",
          "Dor nos pés por deformidade ou calçado inadequado",
          "Dor durante as transferencias ou fisioterapia",
          "Sinal de dor comportamental (choro, auto-agressão, recusa de toque)",
        ],
      },
      {
        name: "Conforto e manejo",
        color: "text-orange-600 dark:text-orange-400",
        items: [
          "A postura sentada causa desconforto evidente",
          "Há escara ou lesão de pele por pressão",
          "O posicionamento noturno está causando desconforto",
          "As orteses estão causando dor ou lesão de pele",
          "Há dor visceral (gastroesofágica, intestinal) associada a PC",
          "A dor está sendo adequadamente tratada",
          "O conforto posicional melhorou com os ajustes feitos",
          "Há indicação de avaliação de dor sistemática com escala validada",
        ],
      },
    ],
  },

  // ── j26-240 — PC Comunicação Alternativa AAC ──
  "j26-240": {
    instruction: "Avalie o uso e o progresso na comunicação alternativa e aumentativa (CAA) da criança com PC. Marque o que está presente.",
    infoBox: "Monitoramento de CAA na paralisia cerebral. Maior pontuação = melhor uso e progresso na CAA. Não é diagnóstico.",
    labels: ["Não observado", "Emergente", "Parcial", "Adequado"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_better",
    totalLabel: "Progresso no uso de CAA na PC (maior = melhor)",
    bands: [
      { minPct: 85, classification: "Uso funcional da CAA", color: "emerald", description: "CAA em uso funcional adequado. Mantenha e amplie." },
      { minPct: 60, classification: "Uso parcial - vigiar", color: "amber", description: "Há uso funcional mas algumas funções podem ser ampliadas." },
      { minPct: 40, classification: "Uso limitado", color: "orange", description: "CAA subutilizada. Revise o sistema e a capacitação de parceiros." },
      { minPct: 0, classification: "Sem uso funcional - intervir", color: "red", description: "CAA não implementada ou não funcional. Avaliação e plano urgentes." },
    ],
    domains: [
      {
        name: "Dispositivo e acesso",
        color: "text-violet-600 dark:text-violet-400",
        items: [
          "A criança tem acesso físico adequado ao dispositivo de CAA",
          "O método de acesso (direto, varredura, olhar) e funcional",
          "O vocabulário do sistema e adequado as necessidades da criança",
          "O dispositivo está programado e atualizado regularmente",
          "Há backup disponível (pranchas impressas) quando necessário",
          "O dispositivo funciona na escola, em casa e em terapias",
        ],
      },
      {
        name: "Uso comunicativo e parceiros",
        color: "text-teal-600 dark:text-teal-400",
        items: [
          "A criança usa a CAA para iniciar comunicação espontânea",
          "A CAA e usada para diferentes funções (pedir, comentar, recusar)",
          "Os parceiros de comunicação (pais, professores) foram capacitados",
          "A escola está integrando a CAA nas atividades educacionais",
          "O vocabulário foi ampliado em relação ao início do acompanhamento",
          "A CAA está substituindo ou complementando a fala de forma eficaz",
          "Há barreiras de adesão que limitam o uso da CAA",
          "O progresso na CAA está compatível com o tempo de intervenção",
        ],
      },
    ],
  },


  // ── j26-241 — Espasticidade Ashworth Sequencial ──
  // ── j26-242 — PC GMFCS Evolução e Funcionalidade ──
  "j26-242": {
    instruction: "Avalie a funcionalidade motora global da criança com paralisia cerebral comparando com o último ano. Marque o que está presente ou mudou.",
    infoBox: "Monitoramento evolutivo da funcionalidade motora na PC (referência GMFCS). Maior pontuação = melhor funcionalidade. Não é diagnóstico.",
    labels: ["Não observado", "Emergente", "Parcial", "Adequado"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_better",
    totalLabel: "Funcionalidade motora global na PC (maior = melhor)",
    bands: [
      { minPct: 85, classification: "Alta funcionalidade", color: "emerald", description: "Excelente funcionalidade para o nível de PC. Mantenha." },
      { minPct: 60, classification: "Funcionalidade parcial - vigiar", color: "amber", description: "Há funcionalidade em varias áreas. Identifique e apoie as limitantes." },
      { minPct: 40, classification: "Funcionalidade limitada", color: "orange", description: "Funcionalidade aquem do possível. Revise o plano de reabilitação." },
      { minPct: 0, classification: "Alta dependência - intervir", color: "red", description: "Dependência intensa. Avalie suporte, dispositivos e cirurgia." },
    ],
    domains: [
      {
        name: "Mobilidade e transferencias",
        color: "text-teal-600 dark:text-teal-400",
        items: [
          "Deambula em ambientes internos com ou sem dispositivo",
          "Deambula em ambientes externos com adaptações",
          "Realiza transferencias com supervisão mínima",
          "Usa cadeira de rodas manual com eficiência",
          "Usa cadeira de rodas motorizada ou com dispositivo adaptado",
          "A mobilidade funcional e compatível com o GMFCS atual",
        ],
      },
      {
        name: "Participação e progresso",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          "Participa de atividades escolares com as adaptações necessárias",
          "Participa de atividades de lazer e esporte adaptado",
          "Há progresso funcional em relação ao ano anterior",
          "Há regressão funcional que precisa de investigação",
          "O nível GMFCS se manteve ou melhorou",
          "As metas de reabilitação do ano foram atingidas",
          "Há indicação de avaliação pre-cirúrgica ortopédica",
          "A qualidade de vida da criança e da família e satisfatória",
        ],
      },
    ],
  },

  // ── j26-243 — PC Qualidade de Vida Familiar ──
  "j26-243": {
    instruction: "Avalie o impacto da paralisia cerebral na qualidade de vida da família. Marque o que está presente nas últimas semanas.",
    infoBox: "Avaliação do impacto da PC na qualidade de vida familiar. Pontuação alta = maior impacto. Não é diagnóstico.",
    labels: ["Nunca", "Às vezes", "Frequentemente"],
    optionPoints: [0, 1, 2],
    scoreDirection: "higher_worse",
    totalLabel: "Impacto da PC na qualidade de vida familiar (0-32)",
    bands: [
      { minPct: 0, classification: "Sem impacto relevante", color: "emerald", description: "Boa qualidade de vida familiar. Manter vigilância." },
      { minPct: 25, classification: "Impacto leve", color: "amber", description: "Há impacto leve. Oriente suporte e recursos e reavalie." },
      { minPct: 45, classification: "Impacto moderado", color: "orange", description: "Impacto relevante na família. Considere suporte psicossocial." },
      { minPct: 67, classification: "Impacto importante", color: "red", description: "Impacto intenso na família. Intervenção de suporte urgente." },
    ],
    domains: [
      {
        name: "Cuidadores e suporte",
        color: "text-violet-600 dark:text-violet-400",
        items: [
          "O cuidador principal está sobrecarregado fisicamente",
          "O cuidador relata esgotamento emocional frequente",
          "Não há rede de apoio suficiente para descanso do cuidador",
          "Há impacto financeiro significativo pelo custo do cuidado",
          "Os outros membros da família se sentem negligenciados",
          "Há conflito conjugal ou familiar agravado pela PC",
          "A saude mental do cuidador principal está comprometida",
          "Há falta de informação sobre recursos e direitos legais",
        ],
      },
      {
        name: "Participação social e recursos",
        color: "text-orange-600 dark:text-orange-400",
        items: [
          "A família evita sair ou participar de eventos por causa da PC",
          "Há dificuldade de acesso a serviços de saude e reabilitação",
          "Os direitos da criança (BPC, transporte, escola) não estão garantidos",
          "Há satisfação geral com o cuidado recebido pela equipe",
          "A qualidade de vida familiar melhorou com o suporte atual",
          "Há necessidade de serviço social ou assistência especializada",
          "A família tem projetos e esperancas para o futuro da criança",
          "A qualidade de vida familiar está melhor que no ano anterior",
        ],
      },
    ],
  },

  // ── j26-244 — PC Inclusão Escolar e Social ──
  "j26-244": {
    instruction: "Avalie a inclusão escolar e social da criança com paralisia cerebral. Marque o que está acontecendo nas últimas semanas.",
    infoBox: "Monitoramento de inclusão na PC. Pontuação alta = maior dificuldade de inclusão. Não é diagnóstico.",
    labels: ["Nunca", "Às vezes", "Frequentemente"],
    optionPoints: [0, 1, 2],
    scoreDirection: "higher_worse",
    totalLabel: "Dificuldades de inclusão na PC (0-28)",
    bands: [
      { minPct: 0, classification: "Boa inclusão", color: "emerald", description: "Boa inclusão escolar e social. Manter vigilância." },
      { minPct: 25, classification: "Dificuldades leves", color: "amber", description: "Há dificuldades pontuais. Oriente escola e família." },
      { minPct: 45, classification: "Dificuldades moderadas", color: "orange", description: "Inclusão com impacto relevante. Intensifique o suporte." },
      { minPct: 67, classification: "Dificuldades importantes", color: "red", description: "Inclusão comprometida. Avalie suporte especializado." },
    ],
    domains: [
      {
        name: "Escola",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          "Há barreiras fisicas de acessibilidade na escola",
          "O professor não está preparado para a inclusão da criança",
          "As adaptações curriculares não estão sendo feitas",
          "Há exclusão ou limitação de participação nas atividades escolares",
          "O material escolar não está adaptado as necessidades da criança",
          "Não há auxiliar de inclusão quando necessário",
          "A criança está se sentindo excluida pelos colegas na escola",
        ],
      },
      {
        name: "Social e lazer",
        color: "text-teal-600 dark:text-teal-400",
        items: [
          "Há barreiras de acessibilidade nos espacos de lazer",
          "A criança não tem acesso a esporte ou cultura adaptada",
          "A criança tem poucos ou nenhum amigo fora da escola especial",
          "A família evita frequentar locais por causa das barreiras",
          "A inclusão escolar melhorou desde o início do acompanhamento",
          "A escola tem sido parceira na inclusão e nas adaptações",
          "Os pais se sentem acolhidos e apoiados pela escola",
          "A criança demonstra bem-estar e pertencimento no ambiente escolar",
        ],
      },
    ],
  },

  // ── j26-245 — PC Sono e Conforto Noturno ──
  "j26-245": {
    instruction: "Avalie a qualidade do sono e o conforto noturno da criança com paralisia cerebral. Marque o que está presente nas últimas semanas.",
    infoBox: "Monitoramento de sono na PC. Pontuação alta = maior impacto no sono. Não é diagnóstico.",
    labels: ["Nunca", "Às vezes", "Frequentemente"],
    optionPoints: [0, 1, 2],
    scoreDirection: "higher_worse",
    totalLabel: "Impacto no sono e conforto noturno na PC (0-28)",
    bands: [
      { minPct: 0, classification: "Sono adequado", color: "emerald", description: "Sono preservado. Manter vigilância de rotina." },
      { minPct: 25, classification: "Impacto leve", color: "amber", description: "Há impacto leve no sono. Oriente higiene do sono e reavalie." },
      { minPct: 45, classification: "Impacto moderado", color: "orange", description: "Impacto relevante no sono. Considere avaliação de sono e ajustes." },
      { minPct: 67, classification: "Impacto importante", color: "red", description: "Sono muito comprometido. Avaliação especializada necessária." },
    ],
    domains: [
      {
        name: "Qualidade do sono",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          "Há dificuldade de adormecer por desconforto posicional",
          "Acorda frequentemente durante a noite",
          "Há bruxismo ou movimentos involuntários noturnos",
          "Há apneia do sono ou ronco intenso",
          "Há espasmos ou posturas dolorosas que interrompem o sono",
          "Há refluxo gastroesofágico noturno que piora o sono",
          "O sono e curto para a faixa etária mesmo sem acordar",
        ],
      },
      {
        name: "Conforto e manejo noturno",
        color: "text-teal-600 dark:text-teal-400",
        items: [
          "O posicionamento noturno com ortese ou almofada está adequado",
          "Há lesão de pele ou escaras por posicionamento inadequado",
          "O cuidador precisa levantar varias vezes por noite para reposicionar",
          "A cama ou superficie de sono e adequada as necessidades da criança",
          "O sono da criança impacta significativamente o sono do cuidador",
          "O sono melhorou com os ajustes de posicionamento ou medicação",
          "Há necessidade de polissonografia ou avaliação especializada",
          "O conforto noturno está adequado com o suporte atual",
        ],
      },
    ],
  },

  // ── j26-246 — PC Alimentação e Deglutição ──
  "j26-246": {
    instruction: "Avalie a alimentação e a deglutição da criança com paralisia cerebral. Marque o que está presente ou dificultando a nutrição.",
    infoBox: "Monitoramento de alimentação e deglutição na PC. Pontuação alta = maior dificuldade de alimentação. Não é diagnóstico.",
    labels: ["Ausente", "Leve", "Moderado", "Intenso"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "Dificuldades de alimentação na PC (0-48)",
    bands: [
      { minPct: 0, classification: "Alimentação adequada", color: "emerald", description: "Alimentação sem dificuldades relevantes. Manter vigilância." },
      { minPct: 20, classification: "Dificuldades leves", color: "amber", description: "Há dificuldades leves. Oriente posicionamento e fonoterapia." },
      { minPct: 40, classification: "Dificuldades moderadas - ponderar", color: "orange", description: "Dificuldades relevantes. Avalie suplementação e plano nutricional." },
      { minPct: 65, classification: "Dificuldades importantes - intervir", color: "red", description: "Alimentação comprometida. Avalie gastrostomia ou suporte intensivo." },
    ],
    domains: [
      {
        name: "Deglutição e segurança",
        color: "text-orange-600 dark:text-orange-400",
        items: [
          "Há engasgos frequentes durante as refeições",
          "Há tosse ou engasgo ao deglutir líquidos",
          "Há suspeita de aspiração silenciosa",
          "O tempo das refeições e superior a 30 minutos",
          "Há recusa alimentar por dificuldade de deglutição",
          "Há pneumonias de repetição (suspeita de aspiração)",
        ],
      },
      {
        name: "Nutrição e suporte",
        color: "text-red-600 dark:text-red-400",
        items: [
          "Há desnutrição ou desaceleração do crescimento",
          "Há constipação crônica que piora o conforto",
          "Há refluxo gastroesofágico intenso ou vomitos frequentes",
          "A criança usa gastrostomia ou sonda nasoenteral",
          "Há necessidade de modificação de textura dos alimentos",
          "A avaliação por fonoaudiologia de deglutição está em dia",
          "A nutrição está sendo monitorada por nutricionista",
          "A alimentação está adequada para as necessidades da criança",
        ],
      },
    ],
  },

  // ── j26-247 — PC Órteses e Adaptações Equipamentos ──
  "j26-247": {
    instruction: "Avalie o uso e a adequação das orteses e adaptações de equipamentos para a criança com PC. Marque o que está presente.",
    infoBox: "Monitoramento de orteses e adaptações na PC. Pontuação alta = maior necessidade de revisão. Não é diagnóstico.",
    labels: ["Ausente", "Leve", "Moderado", "Intenso"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "Necessidades de ajuste em orteses e adaptações (0-36)",
    bands: [
      { minPct: 0, classification: "Sem necessidades relevantes", color: "emerald", description: "Orteses e adaptações adequadas. Manter vigilância de rotina." },
      { minPct: 20, classification: "Necessidades leves", color: "amber", description: "Há ajustes leves necessários. Solicite avaliação especializada." },
      { minPct: 40, classification: "Necessidades moderadas", color: "orange", description: "Ajustes importantes necessários. Encaminhe para ortesista/TO urgente." },
      { minPct: 65, classification: "Necessidades importantes", color: "red", description: "Equipamentos inadequados comprometendo funcionalidade e conforto." },
    ],
    domains: [
      {
        name: "Orteses de membros inferiores",
        color: "text-teal-600 dark:text-teal-400",
        items: [
          "A ortese de tornozelo (AFO) não está mais adequada ao crescimento",
          "A ortese está causando lesão de pele, pressão ou dor",
          "A criança recusa usar a ortese por desconforto",
          "Há necessidade de nova avaliação para ortese de membro inferior",
          "A ortese está sendo efetiva na melhora da marcha e postura",
          "Há necessidade de nova ortese por crescimento ou piora clínica",
        ],
      },
      {
        name: "Equipamentos e adaptações",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          "A cadeira de rodas ou andador não está adequado ao crescimento",
          "O assento postural ou adaptações de cadeira precisam de ajuste",
          "O material escolar adaptado não está sendo fornecido",
          "Há necessidade de novo dispositivo ou adaptação de tecnologia assistiva",
          "Os equipamentos atuais estão sendo efetivos e bem utilizados",
          "A solicitação de equipamentos via SUS ou plano está em andamento",
          "Há necessidade de avaliação urgente para novo equipamento",
          "Todos os equipamentos necessários estão sendo fornecidos",
        ],
      },
    ],
  },

  // ── j26-248 — PC Sobrecarga do Cuidador ──
  "j26-248": {
    instruction: "Avalie a sobrecarga do cuidador principal da criança com paralisia cerebral. Marque o que está presente nas últimas semanas.",
    infoBox: "Avaliação de sobrecarga do cuidador na PC (estrutura Zarit adaptado). Pontuação alta = maior sobrecarga. Não é diagnóstico.",
    labels: ["Nunca", "Às vezes", "Frequentemente"],
    optionPoints: [0, 1, 2],
    scoreDirection: "higher_worse",
    totalLabel: "Sobrecarga do cuidador na PC (0-32)",
    bands: [
      { minPct: 0, classification: "Sem sobrecarga relevante", color: "emerald", description: "Cuidador sem sobrecarga relevante. Manter vigilância e suporte." },
      { minPct: 25, classification: "Sobrecarga leve", color: "amber", description: "Há sinais de sobrecarga leve. Oriente recursos e pausas de cuidado." },
      { minPct: 45, classification: "Sobrecarga moderada", color: "orange", description: "Sobrecarga relevante. Avalie suporte psicossocial e serviços de respiro." },
      { minPct: 67, classification: "Sobrecarga importante", color: "red", description: "Sobrecarga intensa. Intervenção urgente de suporte ao cuidador." },
    ],
    domains: [
      {
        name: "Física e emocional",
        color: "text-violet-600 dark:text-violet-400",
        items: [
          "Sente cansaco físico intenso pelo cuidado diário",
          "Sente esgotamento emocional ou desesperanca",
          "Chora com frequência ou sente-se deprimido",
          "Não tem tempo para si mesmo ou para atividades de lazer",
          "A saude própria foi negligenciada pelo cuidado da criança",
          "Sente-se sozinho no cuidado sem apoio suficiente",
        ],
      },
      {
        name: "Social e perspectiva",
        color: "text-orange-600 dark:text-orange-400",
        items: [
          "Abriu mão de atividades importantes por causa do cuidado",
          "Sente que a criança consome todos os seus recursos",
          "Há conflito constante com o parceiro por causa do cuidado",
          "Se sente sem perspectiva para o futuro da criança",
          "Tem medo do que vai acontecer quando não puder mais cuidar",
          "A sobrecarga melhorou com o suporte e os serviços disponíveis",
          "Há necessidade de encaminhamento para saude mental do cuidador",
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
    instruction: "Avalie a prontidao para encerramento, alta ou espacamento do acompanhamento. Marque o que está presente ou atingido.",
    infoBox: "Avaliação de prontidao para alta ou encerramento do tratamento. Maior pontuação = maior prontidao para alta. Não é diagnóstico.",
    labels: ["Não atingido", "Parcialmente atingido", "Atingido com ressalvas", "Plenamente atingido"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_better",
    totalLabel: "Prontidao para encerramento ou alta (maior = mais pronto)",
    bands: [
      { minPct: 85, classification: "Pronto para alta ou espacamento", color: "emerald", description: "Critérios de alta amplamente atingidos. Alta ou espacamento indicados." },
      { minPct: 60, classification: "Quase pronto - revisar", color: "amber", description: "A maioria dos critérios foi atingida. Revise os itens pendentes antes de encerrar." },
      { minPct: 40, classification: "Critérios parciais - aguardar", color: "orange", description: "Critérios parcialmente atingidos. Continue o acompanhamento antes de considerar alta." },
      { minPct: 0, classification: "Não pronto para alta", color: "red", description: "Critérios de alta não atingidos. Mantenha o plano terapêutico atual." },
    ],
    domains: [
      {
        name: "Critérios clínicos e funcionais",
        color: "text-teal-600 dark:text-teal-400",
        items: [
          "A queixa principal que motivou o encaminhamento está resolvida ou estabilizada",
          "Os objetivos terapêuticos do plano atual foram atingidos",
          "A funcionalidade escolar está adequada ou em nível aceitável",
          "A funcionalidade familiar e social está preservada",
          "A medicação, se houver, está em regime estável e seguro",
          "O diagnóstico está claro e a família compreende a condição",
        ],
      },
      {
        name: "Competencias e continuidade",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          "A família tem competência para manejar situações do cotidiano",
          "A escola tem suporte adequado para a continuidade sem o clínico",
          "Há plano de crise documentado para situações de emergência",
          "A criança tem acompanhamento de outras especialidades necessárias",
          "A família sabe os sinais de alerta para retorno precoce",
          "Há serviço de referência para acompanhamento longitudinal",
          "O paciente e a família concordam com o encerramento ou espacamento",
          "Há retorno agendado ou critério claro para retornar se necessário",
        ],
      },
    ],
  },


};
