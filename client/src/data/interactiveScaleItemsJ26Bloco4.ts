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
          { text: "Tônus muscular adequado para a idade corrigida", emoji: "💪", example: "Ex.: Ao mexer nos bracinhos e pernas, não estão nem molinhos demais nem duros." },
          { text: "Marco motor compatível com a faixa etária corrigida", emoji: "📈", example: "Ex.: Senta, engatinha ou anda por volta da época esperada para a idade corrigida." },
          { text: "Ausência de assimetria motora relevante", emoji: "⚖️", example: "Ex.: Usa os dois lados do corpo por igual, não prefere sempre a mesma mãozinha." },
          { text: "Sem sinais de paralisia cerebral ou espasticidade", emoji: "🩺", example: "Ex.: Sem rigidez, pernas cruzadas em tesoura ou movimentos travados ao mexer." },
          { text: "Transferência de peso e sustentação conforme esperado", emoji: "🤸", example: "Ex.: Firma o corpo em pé no colo ou passa o peso de um lado para o outro." },
          { text: "Motor fino emergindo conforme a idade corrigida", emoji: "✋", example: "Ex.: Começa a pegar objetos pequenos com os dedinhos, como uma migalha de pão." },
        ],
      },
      {
        name: "Cognitivo, linguagem e social",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          { text: "Desenvolvimento cognitivo adequado para a idade corrigida", emoji: "🧠", example: "Ex.: Procura o brinquedo que caiu, entendendo que ele existe mesmo sem ver." },
          { text: "Linguagem receptiva e expressiva conforme a faixa etária", emoji: "🗣️", example: "Ex.: Balbucia, fala palavrinhas e entende pedidos simples para a idade." },
          { text: "Sorriso social e interação conforme esperado", emoji: "😊", example: "Ex.: Sorri de volta quando você sorri e busca brincar com o seu rosto." },
          { text: "Atenção e exploração do ambiente presentes", emoji: "👀", example: "Ex.: Olha, pega e explora objetos e pessoas ao redor com curiosidade." },
          { text: "Sem sinais de risco de TEA na faixa etária atual", emoji: "🤝", example: "Ex.: Faz contato de olho, aponta e responde ao nome quando chamado." },
          { text: "Audição confirmada normal (TANU ou audiometria)", emoji: "👂", example: "Ex.: Passou no teste da orelhinha ou na audiometria mais recente." },
          { text: "Peso, estatura e PC em curva adequada para a idade corrigida", emoji: "📏", example: "Ex.: Peso, altura e tamanho da cabeça crescendo dentro da curva esperada." },
          { text: "Seguimento com equipe multiprofissional está ocorrendo", emoji: "👩‍⚕️", example: "Ex.: A criança está fazendo as consultas de fisio, fono ou TO combinadas." },
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
          { text: "Há combinação que altera o metabolismo hepático (CYP450)", emoji: "🧪", example: "Ex.: Observe se dois remédios usam o mesmo caminho do fígado e um muda o efeito do outro." },
          { text: "Há remedio que reduz absorção de outro (antiepiléticos x micronutrientes)", emoji: "💊", example: "Ex.: Um remédio pode reduzir a vitamina ou o ferro que o corpo aproveita do outro." },
          { text: "Há combinação que altera a excreção renal de outro farmaco", emoji: "💧", example: "Ex.: Verifique se um remédio faz o rim eliminar outro mais rápido ou mais devagar." },
          { text: "Há remedio que desloca ligação proteica aumentando nível livre", emoji: "🔬", example: "Ex.: Dois remédios competem no sangue e um deixa mais do outro solto e ativo." },
          { text: "Há potencialização do efeito de sedação ou de depressão do SNC", emoji: "😴", example: "Ex.: A criança fica muito mais sonolenta ao juntar dois remédios que dão sono." },
          { text: "Há redução da eficacia antiepilética por interação", emoji: "⚡", example: "Ex.: As crises voltam porque outro remédio enfraqueceu o antiepiléptico." },
        ],
      },
      {
        name: "Interações farmacodinâmicas e segurança",
        color: "text-red-600 dark:text-red-400",
        items: [
          { text: "Há risco de prolongamento do intervalo QTc", emoji: "❤️", example: "Ex.: Dois remédios juntos podem alterar o ritmo do coração no eletrocardiograma." },
          { text: "Há risco de síndrome serotoninérgica", emoji: "🌡️", example: "Ex.: Juntar antidepressivos pode causar agitação, tremor e febre alta." },
          { text: "Há risco aditivo de hepatotoxicidade", emoji: "🫀", example: "Ex.: Dois remédios que sobrecarregam o fígado podem alterar os exames juntos." },
          { text: "Há risco aditivo de mielossupressão", emoji: "🩸", example: "Ex.: Remédios que baixam as células do sangue podem somar e reduzir a defesa." },
          { text: "Há risco de crise hipertensiva (IMAO x estimulantes)", emoji: "🚨", example: "Ex.: Certas combinações podem disparar a pressão de forma perigosa." },
          { text: "A revisão medicamentosa está atualizada e documentada", emoji: "📋", example: "Ex.: A lista completa de remédios foi conferida e registrada no prontuário." },
          { text: "A família foi orientada sobre os riscos identificados", emoji: "🗣️", example: "Ex.: Os pais foram avisados sobre sinais de alerta ao usar os remédios juntos." },
          { text: "O esquema atual foi otimizado para minimizar interações", emoji: "✅", example: "Ex.: As doses e horários foram ajustados para reduzir a chance de interação." },
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
          { text: "Os tiques são dificieis de diferenciar das estereotipias do TEA", emoji: "🔀", example: "Ex.: É difícil saber se o movimento é um tique ou um balanço repetitivo do autismo." },
          { text: "Os tiques pioram em situações de transição ou mudança de rotina", emoji: "🔄", example: "Ex.: Os tiques aumentam quando muda de escola, de horário ou de atividade." },
          { text: "Os tiques interferem na comunicação ou nas interações sociais", emoji: "💬", example: "Ex.: Os tiques atrapalham a criança de conversar ou brincar com os colegas." },
          { text: "Há ansiedade social que piora os tiques em público", emoji: "😰", example: "Ex.: Em festas ou na frente de gente, o nervoso faz os tiques piorarem." },
          { text: "Os tiques são motivo de bullying ou exclusão escolar", emoji: "🏫", example: "Ex.: Colegas imitam ou zombam dos tiques e a criança fica de fora do grupo." },
          { text: "Os tiques pioram quando a criança está em sobrecarga sensorial", emoji: "🔊", example: "Ex.: Em lugares com muito barulho ou luz forte os tiques ficam mais intensos." },
        ],
      },
      {
        name: "Tiques e TDAH",
        color: "text-orange-600 dark:text-orange-400",
        items: [
          { text: "Os tiques pioram com o uso do estimulante para TDAH", emoji: "💊", example: "Ex.: Depois de começar o remédio do TDAH, os tiques ficaram mais frequentes." },
          { text: "Os tiques interferem com a concentração e a atenção", emoji: "🎯", example: "Ex.: A criança perde o foco na lição porque precisa fazer o tique." },
          { text: "Os tiques são mais frequentes em situações de tedio ou baixa estimulação", emoji: "🥱", example: "Ex.: Quando está sem nada para fazer ou entediada, os tiques aumentam." },
          { text: "A criança tenta suprimir os tiques durante tarefas escolares", emoji: "🤫", example: "Ex.: Ela segura os tiques na aula e depois eles explodem em casa." },
          { text: "A medicação para TDAH e a melhor opção apesar dos tiques", emoji: "⚖️", example: "Ex.: O remédio ajuda tanto na atenção que compensa mesmo com os tiques." },
          { text: "O tique e o TDAH estão sendo tratados de forma integrada", emoji: "🤝", example: "Ex.: O plano de tratamento cuida do tique e do TDAH ao mesmo tempo." },
          { text: "Os tiques melhoraram com o ajuste medicamentoso atual", emoji: "📉", example: "Ex.: Depois de mudar a dose, os tiques diminuíram bastante." },
          { text: "Os tiques estão interferindo mais que o TDAH na funcionalidade", emoji: "⚠️", example: "Ex.: Hoje os tiques atrapalham o dia a dia mais do que a desatenção." },
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
          { text: "Busca contato visual em interações significativas", emoji: "👁️", example: "Ex.: Olha nos seus olhos quando você fala ou brinca com ela." },
          { text: "Responde ao próprio nome quando chamado", emoji: "🔔", example: "Ex.: Vira o rosto ou olha quando você chama o nome dela." },
          { text: "Inicia interações espontâneas com familiares", emoji: "🙋", example: "Ex.: Vem até você para brincar ou mostrar algo por conta própria." },
          { text: "Demonstra afeto e vinculo com os cuidadores", emoji: "🤗", example: "Ex.: Procura colo, abraça ou se acalma perto dos pais." },
          { text: "Compartilha alegria ou descobertas (atenção compartilhada)", emoji: "😄", example: "Ex.: Mostra um brinquedo e olha para você querendo dividir a alegria." },
          { text: "Imita ações ou expressões de adultos", emoji: "🪞", example: "Ex.: Repete gestos como dar tchau, bater palmas ou fazer caretas." },
        ],
      },
      {
        name: "Comunicação e progresso",
        color: "text-teal-600 dark:text-teal-400",
        items: [
          { text: "Usa gestos funcionais (apontar, acenar, mostrar)", emoji: "👉", example: "Ex.: Aponta para o que quer, acena tchau ou mostra um objeto para você." },
          { text: "Usa palavras ou sistema de CAA para comunicar necessidades", emoji: "🗨️", example: "Ex.: Fala ou usa figuras/prancha para pedir água ou comida." },
          { text: "Compreende instruções simples do cotidiano", emoji: "✅", example: "Ex.: Entende pedidos como pega a bola ou vem cá." },
          { text: "Engaja em brincadeira reciproca com adultos", emoji: "🎲", example: "Ex.: Brinca de dar e receber, como rolar a bola de um para o outro." },
          { text: "A comunicação social melhorou desde o início da intervenção", emoji: "📈", example: "Ex.: Hoje interage e se comunica mais do que quando começou a terapia." },
          { text: "A terapia fonoaudiológica ou de ABA está sendo efetiva", emoji: "👩‍⚕️", example: "Ex.: Você percebe avanços claros vindos das sessões de fono ou ABA." },
          { text: "A escola tem sido parceira no apoio a comunicação", emoji: "🏫", example: "Ex.: Os professores usam as mesmas estratégias de comunicação de casa." },
          { text: "Há barreiras ambientais que limitam o progresso social", emoji: "🚧", example: "Ex.: Falta de apoio, muito barulho ou pouca interação frenam o avanço." },
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
          { text: "Usa palavras ou frases para pedir o que quer", emoji: "🙋", example: "Ex.: Fala quero água ou me dá para pedir o que precisa." },
          { text: "Usa fala, gestos ou CAA para protestar ou recusar", emoji: "🙅", example: "Ex.: Diz não, balança a cabeça ou empurra quando não quer algo." },
          { text: "Usa comunicação para comentar ou chamar atenção", emoji: "💬", example: "Ex.: Chama você para mostrar algo ou comenta olha o cachorro." },
          { text: "A linguagem expressiva progrediu desde o último retorno", emoji: "📈", example: "Ex.: Fala mais palavras ou frases do que na última consulta." },
          { text: "Usa frases de 2 ou mais palavras (ou equivalente em CAA)", emoji: "🔗", example: "Ex.: Junta palavras como quer bola ou mamãe vem." },
          { text: "Iniciou uso de CAA ou PECS com progresso funcional", emoji: "🖼️", example: "Ex.: Começou a usar figuras ou prancha e já se comunica melhor com elas." },
        ],
      },
      {
        name: "Comunicação receptiva e pragmática",
        color: "text-teal-600 dark:text-teal-400",
        items: [
          { text: "Compreende instruções de 2 ou mais passos", emoji: "🪜", example: "Ex.: Entende pega o sapato e traz aqui sem precisar repetir cada parte." },
          { text: "Entende perguntas simples (onde? quem? o que?)", emoji: "❓", example: "Ex.: Responde a onde está a mamãe? ou o que é isso?" },
          { text: "Segue rotinas verbais ou visuais sem apoio constante", emoji: "📅", example: "Ex.: Segue a sequência de escovar dentes e dormir sem alguém guiar sempre." },
          { text: "Compreende não-verbal (expressões faciais, tom de voz)", emoji: "😉", example: "Ex.: Percebe quando você está bravo ou feliz pelo rosto e pela voz." },
          { text: "A linguagem receptiva e melhor que a expressiva", emoji: "👂", example: "Ex.: Entende muito mais do que consegue falar." },
          { text: "A escola ou terapia está usando suporte visual de forma eficaz", emoji: "🖼️", example: "Ex.: Figuras e quadros de rotina ajudam a criança a entender na escola." },
          { text: "Há regressão de linguagem que precisa ser investigada", emoji: "⚠️", example: "Ex.: Ela parou de falar palavras que já dizia antes." },
          { text: "A fonoterapia está sendo efetiva no desenvolvimento da linguagem", emoji: "👩‍⚕️", example: "Ex.: Você percebe avanços na fala vindos das sessões de fono." },
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
          { text: "Controle esfincteriano (urinário e fecal)", emoji: "🚽", example: "Ex.: Avisa quando precisa e usa o banheiro sem fazer nas roupas." },
          { text: "Higiene após o banheiro", emoji: "🧻", example: "Ex.: Se limpa sozinha depois de usar o banheiro." },
          { text: "Escovar os dentes", emoji: "🪥", example: "Ex.: Escova os dentes sozinha, com pouca ou nenhuma ajuda." },
          { text: "Lavar as mãos antes das refeições", emoji: "🧼", example: "Ex.: Lava as mãos sozinha antes de sentar para comer." },
          { text: "Tomar banho com supervisão mínima", emoji: "🚿", example: "Ex.: Se ensaboa e se enxágua com você só de olho por perto." },
          { text: "Vestir-se e descalcar-se", emoji: "👕", example: "Ex.: Veste a roupa e tira os sapatos sozinha." },
        ],
      },
      {
        name: "Rotinas e funcionalidade",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          { text: "Alimentar-se com utensilios adequados", emoji: "🍴", example: "Ex.: Come sozinha usando colher e garfo sem sujar muito." },
          { text: "Dormir com rotina noturna previsível", emoji: "🌙", example: "Ex.: Segue a mesma sequência para dormir e adormece na hora combinada." },
          { text: "Guardar brinquedos e pertences", emoji: "🧸", example: "Ex.: Guarda os brinquedos na caixa depois de brincar quando pedido." },
          { text: "Seguir rotina escolar com apoio mínimo", emoji: "🏫", example: "Ex.: Segue as atividades da escola sem precisar de ajuda o tempo todo." },
          { text: "Deslocar-se com segurança em ambientes conhecidos", emoji: "🚶", example: "Ex.: Anda pela casa ou pela escola sem se perder ou se machucar." },
          { text: "A autonomia nas AVD aumentou desde o início do acompanhamento", emoji: "📈", example: "Ex.: Hoje faz mais coisas sozinha do que quando começou o acompanhamento." },
          { text: "Há barreiras ambientais ou sensoriais que limitam a autonomia", emoji: "🚧", example: "Ex.: Barulho, texturas ou falta de adaptação atrapalham ela fazer sozinha." },
          { text: "A TO ou a escola tem sido efetiva no treinamento de AVD", emoji: "👩‍⚕️", example: "Ex.: As sessões de TO ou a escola ajudaram a criança a ganhar autonomia." },
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
          { text: "Tem dificuldade de permanecer em sala por períodos adequados", emoji: "🪑", example: "Ex.: Levanta toda hora ou sai da sala e não fica no tempo esperado." },
          { text: "Não participa de atividades coletivas com os colegas", emoji: "🙅", example: "Ex.: Fica de fora das brincadeiras e trabalhos em grupo." },
          { text: "Tem conflitos frequentes com colegas ou professores", emoji: "⚡", example: "Ex.: Vive brigando ou batendo boca com colegas ou professora." },
          { text: "A escola não tem profissional de apoio (AEE, monitor) quando necessário", emoji: "👤", example: "Ex.: Falta um monitor ou apoio especializado que a criança precisa." },
          { text: "Há bullying ou exclusão por parte dos colegas", emoji: "😢", example: "Ex.: Colegas zombam, deixam de lado ou não chamam para brincar." },
          { text: "Os professores não foram orientados sobre o TEA", emoji: "📚", example: "Ex.: A escola não recebeu orientação de como lidar com o autismo dela." },
          { text: "Há recusa escolar ou grande estresse antes de ir a escola", emoji: "😰", example: "Ex.: Chora, tem crise ou passa mal na hora de ir para a escola." },
        ],
      },
      {
        name: "Adaptações e suporte",
        color: "text-teal-600 dark:text-teal-400",
        items: [
          { text: "A escola não fez adaptações curriculares necessárias", emoji: "📝", example: "Ex.: As atividades não foram adaptadas ao ritmo e jeito de aprender da criança." },
          { text: "O PEI (plano educacional individualizado) está desatualizado", emoji: "📋", example: "Ex.: O plano de ensino individual não é revisto há muito tempo." },
          { text: "Há barreiras sensoriais na escola (barulho, luz) sem solução", emoji: "🔊", example: "Ex.: O barulho da sala ou a luz forte incomodam e ninguém resolve." },
          { text: "A escola não usa apoios visuais ou CAA recomendados", emoji: "🖼️", example: "Ex.: A escola não usa figuras ou quadros de rotina que foram indicados." },
          { text: "A comunicação entre escola e clínico está sendo efetiva", emoji: "📞", example: "Ex.: Escola e médico trocam informações e alinham as condutas." },
          { text: "A inclusão melhorou desde o início do acompanhamento", emoji: "📈", example: "Ex.: Hoje a criança está mais incluída do que no começo do acompanhamento." },
          { text: "Os pais se sentem apoiados pela escola", emoji: "🤝", example: "Ex.: A família sente que a escola escuta e caminha junto." },
          { text: "O desempenho acadêmico está sendo satisfatório dentro das possibilidades", emoji: "✅", example: "Ex.: A criança aprende bem dentro do que é possível para ela." },
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
          { text: "Interage com membros da família de forma funcional", emoji: "👨‍👩‍👧", example: "Ex.: Conversa, brinca e participa das rotinas com pais e irmãos." },
          { text: "Tem habilidades de brincar e compartilhar com pares", emoji: "🧩", example: "Ex.: Brinca junto com outras crianças e divide os brinquedos." },
          { text: "Usa comunicação (fala ou CAA) em contextos funcionais", emoji: "🗨️", example: "Ex.: Usa fala ou figuras para pedir e se expressar no dia a dia." },
          { text: "Demonstra compreensão de regras sociais básicas", emoji: "🚦", example: "Ex.: Espera a vez, cumprimenta e segue combinados simples." },
          { text: "Adapta o comportamento a diferentes ambientes", emoji: "🔄", example: "Ex.: Se comporta de forma diferente na escola, em casa e na festa." },
          { text: "As habilidades de socialização melhoraram desde o início", emoji: "📈", example: "Ex.: Hoje interage mais com as pessoas do que quando começou." },
        ],
      },
      {
        name: "Motor e vida prática",
        color: "text-teal-600 dark:text-teal-400",
        items: [
          { text: "Realiza atividades de autocuidado adequadas para a idade", emoji: "🧼", example: "Ex.: Come, se veste e se higieniza conforme o esperado para a idade." },
          { text: "Motor grosso e fino em nível funcional para a idade", emoji: "🤸", example: "Ex.: Corre, pula e também segura lápis ou pega peças pequenas bem." },
          { text: "Participa de atividades domésticas simples", emoji: "🧹", example: "Ex.: Ajuda a guardar a louça ou a arrumar o quarto." },
          { text: "Tolera mudancas de atividade sem crise significativa", emoji: "🔄", example: "Ex.: Aceita parar de brincar para almoçar sem grande crise." },
          { text: "As habilidades adaptativas globais melhoraram desde o início", emoji: "📈", example: "Ex.: No geral, faz mais coisas sozinha do que no começo." },
          { text: "O nível adaptativo atual e compatível com a expectativa para o nível de TEA", emoji: "⚖️", example: "Ex.: O que a criança consegue fazer bate com o esperado para o nível dela." },
          { text: "Há áreas que precisam de intervenção específica urgente", emoji: "🚨", example: "Ex.: Alguma área, como autocuidado ou comunicação, precisa de foco urgente." },
          { text: "Os apoios ambientais são adequados as necessidades adaptativas", emoji: "🧰", example: "Ex.: A criança tem em casa e na escola os apoios que ela precisa." },
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
          { text: "Comunicação e linguagem", emoji: "🗣️", example: "Ex.: Como está a fala, o entender e o se fazer entender em relação a 6 meses atrás." },
          { text: "Integração sensorial e regulação", emoji: "🌈", example: "Ex.: Como lida com barulho, texturas e luz, e como se autorregula." },
          { text: "Comportamentos restritivos e repetitivos", emoji: "🔁", example: "Ex.: Movimentos repetitivos, apego a rotinas ou interesses fixos." },
          { text: "Autonomia nas AVD", emoji: "🧼", example: "Ex.: Como está o comer, vestir e higiene sozinha comparado com antes." },
          { text: "Controle emocional e manejo de crises", emoji: "🌡️", example: "Ex.: Frequência e intensidade das crises de desregulação neste semestre." },
          { text: "Motor grosso e fino", emoji: "🤸", example: "Ex.: Como estão o correr e pular e também os movimentos das mãozinhas." },
        ],
      },
      {
        name: "Áreas de vida e contexto",
        color: "text-teal-600 dark:text-teal-400",
        items: [
          { text: "Inclusão escolar e desempenho acadêmico", emoji: "🏫", example: "Ex.: Como está a participação e o aprender na escola neste semestre." },
          { text: "Relações sociais com pares", emoji: "🧒", example: "Ex.: Como estão as amizades e o brincar com outras crianças." },
          { text: "Vinculo familiar e participação em casa", emoji: "🏠", example: "Ex.: Como está a interação e a participação nas rotinas da família." },
          { text: "Qualidade de vida geral da criança", emoji: "🌟", example: "Ex.: No geral, a criança está mais feliz e bem do que há 6 meses?" },
          { text: "Qualidade de vida e bem-estar da família", emoji: "👨‍👩‍👧", example: "Ex.: Como está o bem-estar e o cansaço da família neste período." },
          { text: "O plano terapêutico atual está sendo efetivo", emoji: "✅", example: "Ex.: As terapias em andamento estão trazendo resultados visíveis." },
          { text: "Há necessidade de revisão do diagnóstico ou de novas avaliações", emoji: "🔍", example: "Ex.: Surgiu algo que pede reavaliar o diagnóstico ou pedir novos exames." },
          { text: "Os objetivos terapêuticos do semestre foram atingidos", emoji: "🎯", example: "Ex.: As metas combinadas para estes 6 meses foram alcançadas." },
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
          { text: "Desatenção impede participação em atividades terapêuticas", emoji: "🎯", example: "Ex.: Não consegue focar na sessão de fono ou TO por causa da desatenção." },
          { text: "A hiperatividade piora as estereotipias e a desregulação", emoji: "🌀", example: "Ex.: Quando está muito agitada, aumentam os balanços e as crises." },
          { text: "Impulsividade gera conflitos além do esperado para o TEA", emoji: "⚡", example: "Ex.: Age sem pensar e cria brigas além do que o autismo já explica." },
          { text: "A medicação para TDAH melhorou a participação nas terapias", emoji: "💊", example: "Ex.: Depois do remédio, ela rende mais nas sessões de terapia." },
          { text: "A atenção melhorou mas os CRR do TEA persistem intensos", emoji: "🔁", example: "Ex.: Foca melhor, mas os movimentos repetitivos continuam fortes." },
          { text: "Há piora do TDAH nos períodos sem estimulante (fim de semana)", emoji: "📅", example: "Ex.: Sem o remédio no sábado e domingo, fica muito mais agitada." },
          { text: "O TDAH está sendo o principal limitante funcional no momento", emoji: "⚠️", example: "Ex.: Hoje a agitação e a desatenção atrapalham mais que o autismo." },
        ],
      },
      {
        name: "Interação social e escola",
        color: "text-teal-600 dark:text-teal-400",
        items: [
          { text: "TDAH piora as habilidades sociais do TEA", emoji: "🧒", example: "Ex.: A impulsividade e a agitação afastam ainda mais dos colegas." },
          { text: "Criança e excluida socialmente tanto por TEA quanto por TDAH", emoji: "😔", example: "Ex.: Fica de fora dos grupos tanto pelo autismo quanto pela agitação." },
          { text: "A escola tem dificuldade de manejar as duas condições", emoji: "🏫", example: "Ex.: Os professores não sabem lidar com o autismo e o TDAH juntos." },
          { text: "Há conflito de estrategia entre abordagens para TEA e TDAH", emoji: "🔀", example: "Ex.: O que ajuda no autismo às vezes atrapalha o TDAH, e vice-versa." },
          { text: "O tratamento combinado está sendo efetivo", emoji: "✅", example: "Ex.: Cuidar das duas condições juntas está dando bons resultados." },
          { text: "A comorbidade está mais controlada que no semestre anterior", emoji: "📉", example: "Ex.: O conjunto autismo e TDAH está mais estável que há 6 meses." },
          { text: "Há necessidade de ajuste no suporte escolar para as duas condições", emoji: "🛠️", example: "Ex.: A escola precisa mudar o apoio para dar conta das duas condições." },
          { text: "A família está conseguindo manejar as duas condições em casa", emoji: "🏠", example: "Ex.: Os pais conseguem lidar com o autismo e o TDAH na rotina de casa." },
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
          { text: "A criança está recusando ir para a nova escola", emoji: "🚫", example: "Ex.: Chora, se recusa ou faz birra na hora de ir para a escola nova." },
          { text: "Há aumento de crises de desregulação após a mudança de escola", emoji: "🌀", example: "Ex.: Depois de trocar de escola, as crises ficaram mais frequentes." },
          { text: "A criança está mais agitada ou ansiosa nas semanas de escola", emoji: "😰", example: "Ex.: Fica mais nervosa e agitada nos dias de aula." },
          { text: "Há aumento de estereotipias e CRR com a mudança", emoji: "🔁", example: "Ex.: Os movimentos repetitivos aumentaram depois da mudança." },
          { text: "A criança perdeu habilidades adquiridas no pre-escolar", emoji: "📉", example: "Ex.: Deixou de fazer coisas que já fazia na escolinha anterior." },
          { text: "Há regressão de linguagem ou AVD desde a mudança", emoji: "⚠️", example: "Ex.: Voltou a falar menos ou parou de fazer tarefas que já dominava." },
          { text: "A transição foi mais difícil que o esperado para o nível de TEA", emoji: "⛰️", example: "Ex.: A mudança de escola pesou mais do que se esperava para ela." },
        ],
      },
      {
        name: "Suporte e planejamento",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          { text: "A nova escola ainda não conhece as necessidades da criança", emoji: "❓", example: "Ex.: A escola nova ainda não sabe do que a criança precisa." },
          { text: "O PEI da nova escola ainda não foi elaborado ou compartilhado", emoji: "📋", example: "Ex.: O plano de ensino individual ainda não foi feito na escola nova." },
          { text: "Há falta de monitor ou apoio especializado na nova escola", emoji: "👤", example: "Ex.: Falta o monitor ou apoio que a criança precisa na escola nova." },
          { text: "A família não foi orientada sobre como apoiar a transição", emoji: "🗣️", example: "Ex.: Os pais não receberam dicas de como ajudar na mudança de escola." },
          { text: "A nova escola foi visitada com antecedência para adaptação", emoji: "🚪", example: "Ex.: A criança conheceu a escola nova antes de começar, para se habituar." },
          { text: "O profissional de referência passou informações para a nova escola", emoji: "📨", example: "Ex.: A terapeuta ou médico enviou orientações para a escola nova." },
          { text: "A criança está se adaptando progressivamente a nova rotina", emoji: "📈", example: "Ex.: Aos poucos ela vai se acostumando com a rotina da escola nova." },
          { text: "O suporte planejado está sendo suficiente para a transição", emoji: "✅", example: "Ex.: O apoio combinado está dando conta de ajudar na mudança." },
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
          { text: "Não termina as atividades em sala no tempo disponível", emoji: "⏳", example: "Ex.: A aula acaba e ela não terminou a tarefa que os colegas já fizeram." },
          { text: "Os cadernos e materiais estão desorganizados e incompletos", emoji: "📓", example: "Ex.: O caderno vive bagunçado, com matéria pela metade." },
          { text: "Perde ou esquece materiais e tarefas com frequência", emoji: "🎒", example: "Ex.: Vive esquecendo o lápis, o livro ou a lição de casa." },
          { text: "O desempenho em provas e muito abaixo da capacidade real", emoji: "📝", example: "Ex.: Sabe a matéria em casa, mas vai muito mal na prova." },
          { text: "O professor reporta que não consegue se concentrar", emoji: "🎯", example: "Ex.: A professora diz que ela vive no mundo da lua na aula." },
          { text: "Há queda nas notas desde o último retorno", emoji: "📉", example: "Ex.: As notas caíram desde a última consulta." },
          { text: "Tem dificuldade de copiar do quadro com eficiência", emoji: "🖊️", example: "Ex.: Demora muito ou não consegue copiar tudo do quadro a tempo." },
        ],
      },
      {
        name: "Comportamento escolar",
        color: "text-orange-600 dark:text-orange-400",
        items: [
          { text: "Interrupções frequentes da aula por parte da criança", emoji: "🙋", example: "Ex.: Fala fora de hora e interrompe a professora o tempo todo." },
          { text: "Conflitos com colegas por impulsividade", emoji: "⚡", example: "Ex.: Empurra ou reage sem pensar e acaba brigando com colegas." },
          { text: "O professor tem reclamações frequentes do comportamento", emoji: "📢", example: "Ex.: A professora chama os pais toda semana para reclamar." },
          { text: "Há adaptações escolares que estão sendo efetivas", emoji: "🛠️", example: "Ex.: Sentar na frente ou dar mais tempo na prova está ajudando." },
          { text: "O rendimento escolar melhorou com o tratamento medicamentoso", emoji: "💊", example: "Ex.: Depois do remédio, o desempenho na escola melhorou." },
          { text: "O suporte educacional especializado está disponível", emoji: "🧑‍🏫", example: "Ex.: A escola tem reforço ou apoio especializado quando precisa." },
          { text: "A família e a escola estão alinhadas no plano de manejo", emoji: "🤝", example: "Ex.: Casa e escola usam as mesmas combinações com a criança." },
          { text: "O desempenho escolar está melhor que no semestre anterior", emoji: "📈", example: "Ex.: As notas e a participação melhoraram desde o semestre passado." },
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
          { text: "Tem dificuldade de manter amizades por causa da impulsividade", emoji: "💔", example: "Ex.: Faz amigos mas logo os perde por agir sem pensar." },
          { text: "Interrupe ou domina as brincadeiras dos colegas", emoji: "🎮", example: "Ex.: Quer mandar em tudo na brincadeira e não deixa os outros jogarem." },
          { text: "E excluido ou evitado pelos colegas na escola", emoji: "😔", example: "Ex.: Os colegas não chamam para brincar ou saem de perto." },
          { text: "Tem conflitos frequentes em jogos ou brincadeiras em grupo", emoji: "⚡", example: "Ex.: Vive brigando durante os jogos em grupo." },
          { text: "Chora muito ou reage de forma intensa quando perde jogos", emoji: "😢", example: "Ex.: Faz um escândalo ou chora muito toda vez que perde uma partida." },
          { text: "Não consegue respeitar regras sociais nas brincadeiras", emoji: "🚦", example: "Ex.: Não espera a vez nem segue as regras combinadas do jogo." },
          { text: "Tem poucas ou nenhuma amizade estável", emoji: "🧍", example: "Ex.: Não tem um amigo fixo com quem brinca sempre." },
        ],
      },
      {
        name: "Família e contexto",
        color: "text-orange-600 dark:text-orange-400",
        items: [
          { text: "Os conflitos com irmaos são frequentes e intensos", emoji: "👧👦", example: "Ex.: Vive brigando forte com os irmãos em casa." },
          { text: "Os pais relatam dificuldade de manejar o comportamento em público", emoji: "🛒", example: "Ex.: No mercado ou na festa fica difícil controlar o comportamento." },
          { text: "A criança e excluida de atividades extracurriculares por comportamento", emoji: "⚽", example: "Ex.: Foi tirada do futebol ou do balé por causa do comportamento." },
          { text: "As relações sociais melhoraram com o tratamento do TDAH", emoji: "💊", example: "Ex.: Depois do tratamento, se dá melhor com os colegas." },
          { text: "A habilidade social está sendo trabalhada em terapia", emoji: "🧑‍⚕️", example: "Ex.: Faz terapia focada em aprender a se relacionar e esperar a vez." },
          { text: "A família foi orientada sobre o impacto social do TDAH", emoji: "🗣️", example: "Ex.: Os pais entenderam como o TDAH afeta as amizades da criança." },
          { text: "Há bullying relacionado ao comportamento do TDAH", emoji: "😢", example: "Ex.: Sofre zombaria por causa da agitação ou das reações intensas." },
          { text: "As relações sociais estão melhores que no semestre anterior", emoji: "📈", example: "Ex.: Está se dando melhor com colegas do que há 6 meses." },
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
          { text: "Choro fácil ou irritabilidade intensa no fim do efeito", emoji: "😭", example: "Ex.: Quando o remédio passa, no fim da tarde, chora por qualquer coisa." },
          { text: "Explosões de raiva desproporcional a noite", emoji: "😡", example: "Ex.: À noite tem ataques de raiva bem maiores que o motivo." },
          { text: "Hiperatividade maior que antes do início do estimulante", emoji: "🌀", example: "Ex.: No fim do dia fica mais agitada do que era antes do remédio." },
          { text: "Impulsividade exacerbada nas horas seguintes ao fim do efeito", emoji: "⚡", example: "Ex.: Ao passar o efeito, age sem pensar mais que o normal." },
          { text: "Conflitos familiares aumentam no período do rebote", emoji: "🏠", example: "Ex.: As brigas em casa aumentam justo quando o remédio está acabando." },
          { text: "O rebote interfere nas tarefas de casa e na rotina noturna", emoji: "📚", example: "Ex.: No fim do dia não consegue fazer a lição nem seguir a rotina de dormir." },
        ],
      },
      {
        name: "Sono e transição",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          { text: "Há dificuldade de adormecer associada ao rebote", emoji: "🌙", example: "Ex.: Fica tão agitada no fim do efeito que custa a pegar no sono." },
          { text: "A criança fica agitada até tarde por causa do rebote", emoji: "🌃", example: "Ex.: Continua ligada até tarde da noite quando o remédio já passou." },
          { text: "Uma dose menor no fim da tarde reduziria o rebote", emoji: "💊", example: "Ex.: Avalie se uma dosezinha no fim da tarde suavizaria a virada." },
          { text: "A formulação de liberação prolongada não está sendo eficaz no controle do rebote", emoji: "⏱️", example: "Ex.: O remédio de longa duração não segura bem a virada do fim do dia." },
          { text: "O horário da última dose precisa ser ajustado", emoji: "🕐", example: "Ex.: Talvez adiantar ou atrasar a última dose ajude no fim do dia." },
          { text: "O rebote está pior do que no início do tratamento", emoji: "📈", example: "Ex.: A virada do fim do dia está mais forte que quando começou." },
          { text: "O rebote está prejudicando a qualidade de vida familiar", emoji: "😔", example: "Ex.: O fim do dia difícil está pesando para toda a família." },
          { text: "O rebote melhorou com o ajuste de formulação ou horário", emoji: "✅", example: "Ex.: Depois de mudar o horário ou o tipo de remédio, o fim do dia melhorou." },
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
          { text: "Tem crises que ocorrem exclusivamente no sono", emoji: "🌙", example: "Ex.: As crises só acontecem quando a criança está dormindo." },
          { text: "Acorda abruptamente durante a noite (suspeita de crise)", emoji: "😳", example: "Ex.: Desperta de repente, assustada, e você suspeita de crise." },
          { text: "Faz movimentos repetitivos ou automatismos noturnos", emoji: "🔁", example: "Ex.: Faz movimentos estranhos e repetidos com braços ou boca dormindo." },
          { text: "Há medo de dormir por causa da epilepsia", emoji: "😰", example: "Ex.: A criança evita ou tem medo de dormir com receio de ter crise." },
          { text: "Os pais vigiam o sono da criança por medo de crises noturnas", emoji: "👀", example: "Ex.: Você fica acordado observando com medo de uma crise à noite." },
          { text: "Há evidência de crises noturnas subdiagnosticadas", emoji: "🔍", example: "Ex.: Sinais como xixi na cama ou cansaço sugerem crises não percebidas." },
          { text: "O EEG do sono foi realizado ou está indicado", emoji: "🧠", example: "Ex.: Verifique se o exame do cérebro durante o sono foi feito ou pedido." },
        ],
      },
      {
        name: "Impacto do antiepilético no sono",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          { text: "O antiepilético causa sonolência excessiva durante o dia", emoji: "😴", example: "Ex.: O remédio deixa a criança com muito sono e moleza de dia." },
          { text: "Há insonia ou latência aumentada por causa do antiepilético", emoji: "🌃", example: "Ex.: Desde o remédio, custa muito a pegar no sono ou não dorme direito." },
          { text: "O ajuste de horário do antiepilético poderia melhorar o sono", emoji: "🕐", example: "Ex.: Mudar a hora de tomar o remédio talvez ajude a dormir melhor." },
          { text: "O sono melhorou com o controle das crises", emoji: "✅", example: "Ex.: Depois que as crises reduziram, a criança passou a dormir melhor." },
          { text: "Há apneia do sono associada que precisa de avaliação", emoji: "💤", example: "Ex.: Ronca muito e para de respirar por instantes dormindo." },
          { text: "A qualidade do sono está piorando progressivamente", emoji: "📉", example: "Ex.: A cada semana o sono anda pior do que antes." },
          { text: "A família está exausta pela vigilância noturna constante", emoji: "😫", example: "Ex.: Os pais não descansam de tanto vigiar o sono da criança." },
          { text: "O sono está melhor que no retorno anterior", emoji: "📈", example: "Ex.: A criança está dormindo melhor do que na última consulta." },
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
          { text: "A criança recusa os alimentos permitidos na dieta", emoji: "🙅", example: "Ex.: Ela não quer comer o que a dieta permite e fecha a boca." },
          { text: "A família tem dificuldade de preparar as refeições adequadas", emoji: "🍳", example: "Ex.: É difícil pesar e preparar cada refeição do jeito certo." },
          { text: "Houve quebra da dieta nas últimas semanas", emoji: "🍬", example: "Ex.: A criança comeu algo fora da dieta nas últimas semanas." },
          { text: "Há dificuldade de adesão em ambientes externos (escola, festas)", emoji: "🎉", example: "Ex.: Na escola ou em festas fica difícil manter a dieta." },
          { text: "O custo dos alimentos específicos e um obstaculo", emoji: "💰", example: "Ex.: Os alimentos da dieta são caros e pesam no orçamento." },
          { text: "A família sente-se sobrecarregada pela complexidade da dieta", emoji: "😫", example: "Ex.: A rotina toda gira em torno da dieta e cansa a família." },
        ],
      },
      {
        name: "Efeitos clínicos e laboratoriais",
        color: "text-red-600 dark:text-red-400",
        items: [
          { text: "Há nauseas, vomitos ou dor abdominal relacionados a dieta", emoji: "🤢", example: "Ex.: Depois da dieta, sente enjoo, vomita ou reclama de dor de barriga." },
          { text: "Há desaceleração do crescimento ou perda de peso", emoji: "📉", example: "Ex.: A criança está emagrecendo ou parou de crescer como antes." },
          { text: "Há sinais de hipoglicemia ou cetose excessiva", emoji: "🩸", example: "Ex.: Fica trêmula, molenga ou com hálito forte de cetose." },
          { text: "Os exames de colesterol ou lipidios estão alterados", emoji: "🧪", example: "Ex.: Os exames de gordura no sangue vieram alterados." },
          { text: "Há constipação intensa associada a dieta", emoji: "🚽", example: "Ex.: Fica muitos dias sem evacuar por causa da dieta." },
          { text: "A dieta está reduzindo as crises conforme esperado", emoji: "✅", example: "Ex.: Desde a dieta, as crises diminuíram como se esperava." },
          { text: "Os exames laboratoriais de monitoramento estão em dia", emoji: "📋", example: "Ex.: Os exames de acompanhamento da dieta estão todos atualizados." },
          { text: "A dieta está sendo efetiva e o beneficio supera os efeitos adversos", emoji: "⚖️", example: "Ex.: A melhora das crises vale mais que os incômodos da dieta." },
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
          { text: "Vocabulário expressivo ampliou desde o início da fonoterapia", emoji: "📚", example: "Ex.: A criança fala muito mais palavras diferentes do que quando começou." },
          { text: "Usa frases mais longas e complexas que antes", emoji: "🔗", example: "Ex.: Em vez de só quero água, já diz eu quero água gelada." },
          { text: "Usa verbos e preposições com mais frequência e precisão", emoji: "✍️", example: "Ex.: Usa palavras como correr, embaixo e com no lugar certo." },
          { text: "A produtividade lexical aumentou (mais palavras por minuto)", emoji: "⏱️", example: "Ex.: Fala mais fluentemente, com mais palavras em pouco tempo." },
          { text: "Comete menos erros morfossintáxicos que antes", emoji: "✅", example: "Ex.: Troca menos as terminações e monta melhor as frases." },
          { text: "A narrativa oral ficou mais organizada e coerente", emoji: "📖", example: "Ex.: Conta uma história do dia com começo, meio e fim mais claros." },
        ],
      },
      {
        name: "Pragmatica e comunicação",
        color: "text-teal-600 dark:text-teal-400",
        items: [
          { text: "Inicia conversas espontâneas com maior frequência", emoji: "💬", example: "Ex.: Começa a puxar assunto sozinha, sem esperar você perguntar." },
          { text: "Mantém o topico da conversa por mais tempo", emoji: "🧵", example: "Ex.: Consegue conversar sobre o mesmo assunto sem se perder logo." },
          { text: "Usa linguagem para diferentes funções comunicativas", emoji: "🗨️", example: "Ex.: Usa a fala para pedir, contar, perguntar e brincar." },
          { text: "A comunicação espontânea em situações novas melhorou", emoji: "🌟", example: "Ex.: Fala mais à vontade em lugares e com pessoas novas." },
          { text: "O progresso na fonoterapia está compatível com o tempo de tratamento", emoji: "📈", example: "Ex.: O avanço da fala está dentro do esperado para o tempo de terapia." },
          { text: "Há fatores que limitam o progresso (bilinguismo, cognição, audição)", emoji: "⚠️", example: "Ex.: Duas línguas em casa, cognição ou audição podem frear o avanço." },
          { text: "A família está replicando as atividades em casa com eficacia", emoji: "🏠", example: "Ex.: Os pais fazem os exercícios da fono em casa e isso ajuda." },
          { text: "A linguagem expressiva está próxima da faixa etária esperada", emoji: "🎯", example: "Ex.: A fala já está perto do esperado para a idade da criança." },
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
          { text: "Reconhece letras do alfabeto de forma confiável", emoji: "🔤", example: "Ex.: Aponta e nomeia as letras sem confundir na maioria das vezes." },
          { text: "Decodifica sílabas e palavras com fluência crescente", emoji: "🧩", example: "Ex.: Junta as sílabas e lê palavras cada vez mais rápido." },
          { text: "Le palavras com regularidade ortográfica sem erros constantes", emoji: "📖", example: "Ex.: Lê palavras comuns como casa e bola sem tropeçar." },
          { text: "Avancou no nível de textos que consegue ler com compreensão", emoji: "📈", example: "Ex.: Já lê e entende textos maiores do que lia antes." },
          { text: "A velocidade de leitura oral aumentou", emoji: "⏱️", example: "Ex.: Lê em voz alta mais rápido do que no começo da intervenção." },
          { text: "A compreensão leitora melhorou desde o início da intervenção", emoji: "💡", example: "Ex.: Entende melhor o que leu e sabe recontar a história." },
        ],
      },
      {
        name: "Escrita e ortografia",
        color: "text-teal-600 dark:text-teal-400",
        items: [
          { text: "Escreve palavras com menos trocas e omissões que antes", emoji: "✏️", example: "Ex.: Troca ou come menos letras ao escrever do que antes." },
          { text: "A letra (caligrafia) ficou mais legível e organizada", emoji: "🖋️", example: "Ex.: A letra ficou mais bonita e fácil de ler no caderno." },
          { text: "Escreve frases e textos curtos com coerência", emoji: "📝", example: "Ex.: Escreve frases que fazem sentido e se ligam umas às outras." },
          { text: "Usa pontuação básica com mais frequência", emoji: "❕", example: "Ex.: Usa ponto final e vírgula em mais lugares certos." },
          { text: "Os erros ortográficos são típicos para a faixa etária", emoji: "✅", example: "Ex.: Os errinhos de escrita são os comuns para a idade dela." },
          { text: "O desempenho em ditado melhorou conforme esperado", emoji: "🗒️", example: "Ex.: Acerta mais palavras no ditado do que antes." },
          { text: "A escrita espontânea ficou mais longa e organizada", emoji: "📄", example: "Ex.: Quando escreve por conta própria, escreve mais e melhor organizado." },
          { text: "O progresso em leitura e escrita e compatível com o tempo de intervenção", emoji: "📈", example: "Ex.: O avanço na leitura e escrita está dentro do esperado para o tempo de terapia." },
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
          { text: "Distingue sons semelhantes com mais facilidade", emoji: "🔉", example: "Ex.: Diferencia melhor sons parecidos, como faca e vaca." },
          { text: "Localiza a fonte sonora com mais precisão", emoji: "🧭", example: "Ex.: Percebe de onde vem o som quando você a chama." },
          { text: "Discrimina fala em ambientes com ruido de fundo", emoji: "🎧", example: "Ex.: Entende quem fala mesmo com barulho ao redor." },
          { text: "Segue instruções verbais em sala barulhenta com menos dificuldade", emoji: "🏫", example: "Ex.: Consegue seguir o que a professora pede na sala cheia e barulhenta." },
          { text: "Repete palavras e pseudopalavras com mais precisão", emoji: "🔁", example: "Ex.: Repete direitinho palavras e sons inventados que você fala." },
          { text: "A discriminação fonológica melhorou conforme esperado", emoji: "📈", example: "Ex.: Separa melhor os sons das palavras do que na avaliação inicial." },
        ],
      },
      {
        name: "Memória e processamento temporal",
        color: "text-teal-600 dark:text-teal-400",
        items: [
          { text: "Repete sequencias verbais mais longas que antes", emoji: "🔢", example: "Ex.: Repete sequências maiores de números ou palavras que você fala." },
          { text: "O processamento temporal auditivo melhorou", emoji: "⏱️", example: "Ex.: Acompanha melhor o ritmo e a ordem dos sons na fala." },
          { text: "A memória auditiva de curto prazo ficou mais eficiente", emoji: "🧠", example: "Ex.: Lembra melhor de um recado logo depois de ouvir." },
          { text: "A escola relata melhora na compreensão de instruções orais", emoji: "🏫", example: "Ex.: A professora nota que ela entende melhor os comandos falados." },
          { text: "A criança pede menos repetições que antes", emoji: "🔁", example: "Ex.: Precisa menos que você repita o que disse." },
          { text: "O uso de FM escolar ou suporte acústico está sendo efetivo", emoji: "🎙️", example: "Ex.: O aparelho de FM na escola está ajudando a ouvir a professora." },
          { text: "Há melhora na leitura e escrita relacionada ao melhor PAC", emoji: "📖", example: "Ex.: Junto com a audição, a leitura e a escrita também avançaram." },
          { text: "O progresso no PAC está compatível com o tempo de intervenção", emoji: "📈", example: "Ex.: O avanço na escuta está dentro do esperado para o tempo de terapia." },
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
          { text: "Pinca polegar-indicador funcional presente", emoji: "🤏", example: "Ex.: Pega objetos pequenos com o polegar e o indicador, como uma migalha." },
          { text: "Preensão de objetos de diferentes tamanhos e formas", emoji: "✋", example: "Ex.: Segura tanto uma bola grande quanto uma peça pequena." },
          { text: "Transferência de objetos entre as mãos", emoji: "🔄", example: "Ex.: Passa o brinquedo de uma mão para a outra." },
          { text: "Manipulação bimanual funcional (segurar + agir)", emoji: "🙌", example: "Ex.: Segura o pote com uma mão e abre a tampa com a outra." },
          { text: "Usa o membro mais afetado de forma funcional", emoji: "💪", example: "Ex.: Usa a mão ou o braço mais fraco para ajudar em tarefas." },
          { text: "A preensão melhorou em relação a avaliação anterior", emoji: "📈", example: "Ex.: Segura e pega objetos melhor do que na última avaliação." },
        ],
      },
      {
        name: "Escrita e atividades de vida diária",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          { text: "Segura o lapis ou caneta com eficiência", emoji: "✏️", example: "Ex.: Pega o lápis de um jeito firme para escrever ou desenhar." },
          { text: "Traca linhas e formas com controle crescente", emoji: "📐", example: "Ex.: Consegue fazer riscos, círculos e formas cada vez melhor." },
          { text: "Realiza atividades de autocuidado que exigem motor fino (botões, ziper)", emoji: "🧥", example: "Ex.: Abotoa a camisa ou fecha o zíper da mochila sozinha." },
          { text: "Usa dispositivos assistivos de forma eficaz (quando indicados)", emoji: "🦾", example: "Ex.: Usa bem o engrossador de lápis ou outro apoio indicado." },
          { text: "A ortese para mão ou punho está sendo efetiva", emoji: "🩹", example: "Ex.: A tala da mão ou punho está ajudando nos movimentos." },
          { text: "O progresso em motor fino e compatível com o nível de PC (MACS)", emoji: "📊", example: "Ex.: O que faz com as mãos está dentro do esperado para o nível dela." },
          { text: "Há necessidade de intervenção de toxina para membro superior", emoji: "💉", example: "Ex.: O braço está muito tenso e pode precisar de aplicação de toxina." },
          { text: "A TO está sendo efetiva no progresso do motor fino", emoji: "👩‍⚕️", example: "Ex.: As sessões de TO estão ajudando a mão a funcionar melhor." },
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
          { text: "Deambula sem dispositivo de auxilio em distancias funcionais", emoji: "🚶", example: "Ex.: Anda sozinha, sem andador ou muleta, por distâncias úteis do dia." },
          { text: "A qualidade da marcha melhorou em relação a avaliação anterior", emoji: "📈", example: "Ex.: Anda com mais equilíbrio e firmeza do que na última avaliação." },
          { text: "Sobe e desce escadas com apoio ou supervisão", emoji: "🪜", example: "Ex.: Sobe e desce escada segurando no corrimão ou com você por perto." },
          { text: "Realiza transferencias (sentar-levantar) com autonomia", emoji: "🪑", example: "Ex.: Senta e levanta da cadeira ou da cama sozinha." },
          { text: "Corre ou salta com nível funcional adequado para a PC", emoji: "🏃", example: "Ex.: Corre ou pula dentro do que é possível para o nível dela." },
          { text: "O GMFCS está estável ou melhorou", emoji: "📊", example: "Ex.: O nível de mobilidade se manteve ou melhorou em relação a antes." },
        ],
      },
      {
        name: "Postura e equipamentos",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          { text: "A postura sentada e adequada para as atividades escolares", emoji: "🪑", example: "Ex.: Consegue ficar sentada de forma estável para fazer as tarefas." },
          { text: "Usa andador, cadeira de rodas ou bengala de forma eficaz", emoji: "🦯", example: "Ex.: Usa bem o andador ou a cadeira para se locomover." },
          { text: "As orteses para membros inferiores estão ajustadas e efetivas", emoji: "🦵", example: "Ex.: As talas das pernas estão do tamanho certo e ajudam a andar." },
          { text: "O cadeirante de rodas está adequado ao crescimento atual", emoji: "♿", example: "Ex.: A cadeira de rodas ainda está do tamanho certo para a criança." },
          { text: "Há contractura ou deformidade em progressão que precisa de atenção", emoji: "⚠️", example: "Ex.: Uma articulação está enrijecendo ou entortando cada vez mais." },
          { text: "A fisioterapia está prevenindo deformidades musculoesqueléticas", emoji: "🤸", example: "Ex.: A fisio está evitando que músculos e ossos entortem." },
          { text: "Há indicação de avaliação ortopédica ou cirúrgica", emoji: "🩺", example: "Ex.: Pode ser hora de avaliar com o ortopedista uma possível cirurgia." },
          { text: "A marcha e postura estão melhores que na avaliação anterior", emoji: "📈", example: "Ex.: Anda e se posiciona melhor do que na avaliação passada." },
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
          { text: "Dor no quadril ou na coxa por displasia", emoji: "🦵", example: "Ex.: Reclama ou chora ao mexer o quadril, que pode estar fora do lugar." },
          { text: "Dor nas panturrilhas por espasticidade ou encurtamento", emoji: "🦶", example: "Ex.: As batatas da perna ficam duras e doem por causa do encurtamento." },
          { text: "Dor na coluna por postura inadequada", emoji: "🧍", example: "Ex.: Sente dor nas costas por ficar torta na cadeira ou na cama." },
          { text: "Dor nos pés por deformidade ou calçado inadequado", emoji: "👟", example: "Ex.: Os pés doem por causa de deformidade ou sapato apertado." },
          { text: "Dor durante as transferencias ou fisioterapia", emoji: "🤲", example: "Ex.: Chora ou resiste na hora de ser trocada de posição ou na fisio." },
          { text: "Sinal de dor comportamental (choro, auto-agressão, recusa de toque)", emoji: "😣", example: "Ex.: Sem falar, mostra dor chorando, se batendo ou recusando toque." },
        ],
      },
      {
        name: "Conforto e manejo",
        color: "text-orange-600 dark:text-orange-400",
        items: [
          { text: "A postura sentada causa desconforto evidente", emoji: "🪑", example: "Ex.: Fica desconfortável e inquieta quando sentada por um tempo." },
          { text: "Há escara ou lesão de pele por pressão", emoji: "🩹", example: "Ex.: Apareceu ferida na pele nos pontos de mais pressão." },
          { text: "O posicionamento noturno está causando desconforto", emoji: "🌙", example: "Ex.: A posição na cama à noite parece incomodar e atrapalhar o sono." },
          { text: "As orteses estão causando dor ou lesão de pele", emoji: "⚠️", example: "Ex.: As talas estão marcando ou machucando a pele." },
          { text: "Há dor visceral (gastroesofágica, intestinal) associada a PC", emoji: "🫃", example: "Ex.: Sente dor de barriga por refluxo ou intestino preso." },
          { text: "A dor está sendo adequadamente tratada", emoji: "💊", example: "Ex.: O que é feito hoje está controlando bem a dor da criança." },
          { text: "O conforto posicional melhorou com os ajustes feitos", emoji: "📈", example: "Ex.: Depois de ajustar almofadas e posição, ela ficou mais confortável." },
          { text: "Há indicação de avaliação de dor sistemática com escala validada", emoji: "📋", example: "Ex.: Vale medir a dor de forma padronizada com uma escala própria." },
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
          { text: "A criança tem acesso físico adequado ao dispositivo de CAA", emoji: "📱", example: "Ex.: Ela consegue alcançar e tocar o aparelho ou a prancha de comunicação." },
          { text: "O método de acesso (direto, varredura, olhar) e funcional", emoji: "👆", example: "Ex.: O jeito que ela escolhe (com o dedo ou o olhar) funciona bem." },
          { text: "O vocabulário do sistema e adequado as necessidades da criança", emoji: "🗂️", example: "Ex.: A prancha tem as palavras e figuras que ela realmente usa." },
          { text: "O dispositivo está programado e atualizado regularmente", emoji: "🔧", example: "Ex.: O aparelho é atualizado com palavras novas conforme ela avança." },
          { text: "Há backup disponível (pranchas impressas) quando necessário", emoji: "🖨️", example: "Ex.: Existe uma prancha de papel para usar se o aparelho falhar." },
          { text: "O dispositivo funciona na escola, em casa e em terapias", emoji: "🔁", example: "Ex.: A CAA acompanha a criança em todos os ambientes, não só em casa." },
        ],
      },
      {
        name: "Uso comunicativo e parceiros",
        color: "text-teal-600 dark:text-teal-400",
        items: [
          { text: "A criança usa a CAA para iniciar comunicação espontânea", emoji: "🙋", example: "Ex.: Usa a prancha por conta própria para começar a se comunicar." },
          { text: "A CAA e usada para diferentes funções (pedir, comentar, recusar)", emoji: "🗨️", example: "Ex.: Usa a CAA para pedir, comentar e também dizer não." },
          { text: "Os parceiros de comunicação (pais, professores) foram capacitados", emoji: "🧑‍🏫", example: "Ex.: Pais e professores aprenderam a usar a CAA junto com a criança." },
          { text: "A escola está integrando a CAA nas atividades educacionais", emoji: "🏫", example: "Ex.: A escola usa a prancha nas aulas e brincadeiras." },
          { text: "O vocabulário foi ampliado em relação ao início do acompanhamento", emoji: "📈", example: "Ex.: A criança usa muito mais palavras na CAA do que no começo." },
          { text: "A CAA está substituindo ou complementando a fala de forma eficaz", emoji: "✅", example: "Ex.: A prancha ajuda a criança a se comunicar de verdade no dia a dia." },
          { text: "Há barreiras de adesão que limitam o uso da CAA", emoji: "🚧", example: "Ex.: Falta de treino ou o aparelho longe fazem a CAA ser pouco usada." },
          { text: "O progresso na CAA está compatível com o tempo de intervenção", emoji: "📊", example: "Ex.: O avanço no uso da CAA está dentro do esperado para o tempo de terapia." },
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
          { text: "Deambula em ambientes internos com ou sem dispositivo", emoji: "🚶", example: "Ex.: Anda dentro de casa, com ou sem andador." },
          { text: "Deambula em ambientes externos com adaptações", emoji: "🌳", example: "Ex.: Anda na rua ou no pátio com as adaptações necessárias." },
          { text: "Realiza transferencias com supervisão mínima", emoji: "🪑", example: "Ex.: Passa da cadeira para a cama com você só de olho." },
          { text: "Usa cadeira de rodas manual com eficiência", emoji: "♿", example: "Ex.: Impulsiona sozinha a cadeira de rodas manual." },
          { text: "Usa cadeira de rodas motorizada ou com dispositivo adaptado", emoji: "🔋", example: "Ex.: Dirige bem a cadeira motorizada ou usa o dispositivo adaptado." },
          { text: "A mobilidade funcional e compatível com o GMFCS atual", emoji: "📊", example: "Ex.: O quanto ela se locomove bate com o nível de mobilidade esperado." },
        ],
      },
      {
        name: "Participação e progresso",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          { text: "Participa de atividades escolares com as adaptações necessárias", emoji: "🏫", example: "Ex.: Faz as atividades da escola com as adaptações de que precisa." },
          { text: "Participa de atividades de lazer e esporte adaptado", emoji: "⚽", example: "Ex.: Pratica um esporte ou lazer adaptado à condição dela." },
          { text: "Há progresso funcional em relação ao ano anterior", emoji: "📈", example: "Ex.: Faz mais coisas sozinha do que fazia no ano passado." },
          { text: "Há regressão funcional que precisa de investigação", emoji: "⚠️", example: "Ex.: Perdeu habilidades que já tinha e isso precisa ser investigado." },
          { text: "O nível GMFCS se manteve ou melhorou", emoji: "📊", example: "Ex.: O nível de mobilidade não piorou em relação a antes." },
          { text: "As metas de reabilitação do ano foram atingidas", emoji: "🎯", example: "Ex.: Os objetivos da fisio e da TO deste ano foram alcançados." },
          { text: "Há indicação de avaliação pre-cirúrgica ortopédica", emoji: "🩺", example: "Ex.: Pode ser hora de avaliar com o ortopedista uma possível cirurgia." },
          { text: "A qualidade de vida da criança e da família e satisfatória", emoji: "🌟", example: "Ex.: No geral, a criança e a família estão bem e satisfeitas." },
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
          { text: "O cuidador principal está sobrecarregado fisicamente", emoji: "💪", example: "Ex.: Quem cuida sente o corpo esgotado de tanto carregar e trocar de posição." },
          { text: "O cuidador relata esgotamento emocional frequente", emoji: "😔", example: "Ex.: Quem cuida se sente muitas vezes no limite emocional." },
          { text: "Não há rede de apoio suficiente para descanso do cuidador", emoji: "🤲", example: "Ex.: Falta gente para revezar e dar uma folga a quem cuida." },
          { text: "Há impacto financeiro significativo pelo custo do cuidado", emoji: "💰", example: "Ex.: Remédios, terapias e fraldas pesam muito no orçamento." },
          { text: "Os outros membros da família se sentem negligenciados", emoji: "👨‍👩‍👧", example: "Ex.: Os irmãos sentem que recebem menos atenção por causa do cuidado." },
          { text: "Há conflito conjugal ou familiar agravado pela PC", emoji: "💔", example: "Ex.: A sobrecarga do cuidado gera brigas entre o casal ou a família." },
          { text: "A saude mental do cuidador principal está comprometida", emoji: "🧠", example: "Ex.: Quem cuida está com sinais de depressão ou ansiedade." },
          { text: "Há falta de informação sobre recursos e direitos legais", emoji: "📄", example: "Ex.: A família não sabe dos direitos como BPC, transporte ou terapias." },
        ],
      },
      {
        name: "Participação social e recursos",
        color: "text-orange-600 dark:text-orange-400",
        items: [
          { text: "A família evita sair ou participar de eventos por causa da PC", emoji: "🚪", example: "Ex.: A família deixa de ir a festas e passeios por causa das dificuldades." },
          { text: "Há dificuldade de acesso a serviços de saude e reabilitação", emoji: "🏥", example: "Ex.: É difícil conseguir consultas, fisio ou terapias que a criança precisa." },
          { text: "Os direitos da criança (BPC, transporte, escola) não estão garantidos", emoji: "⚖️", example: "Ex.: BPC, transporte ou vaga na escola ainda não foram garantidos." },
          { text: "Há satisfação geral com o cuidado recebido pela equipe", emoji: "😊", example: "Ex.: A família está satisfeita com o atendimento da equipe de saúde." },
          { text: "A qualidade de vida familiar melhorou com o suporte atual", emoji: "📈", example: "Ex.: Com os apoios atuais, a vida da família ficou mais leve." },
          { text: "Há necessidade de serviço social ou assistência especializada", emoji: "🤝", example: "Ex.: A família precisaria de apoio do serviço social." },
          { text: "A família tem projetos e esperancas para o futuro da criança", emoji: "🌈", example: "Ex.: A família faz planos e mantém esperança para o futuro da criança." },
          { text: "A qualidade de vida familiar está melhor que no ano anterior", emoji: "🌟", example: "Ex.: No geral, a família está melhor do que no ano passado." },
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
          { text: "Há barreiras fisicas de acessibilidade na escola", emoji: "🚧", example: "Ex.: Escadas sem rampa ou banheiro sem adaptação dificultam o acesso." },
          { text: "O professor não está preparado para a inclusão da criança", emoji: "🧑‍🏫", example: "Ex.: A professora não sabe como incluir e adaptar para a criança." },
          { text: "As adaptações curriculares não estão sendo feitas", emoji: "📝", example: "Ex.: As atividades não são adaptadas ao ritmo e às possibilidades dela." },
          { text: "Há exclusão ou limitação de participação nas atividades escolares", emoji: "🙅", example: "Ex.: Fica de fora do recreio, da educação física ou dos passeios." },
          { text: "O material escolar não está adaptado as necessidades da criança", emoji: "✂️", example: "Ex.: Falta material adaptado, como lápis engrossado ou livro ampliado." },
          { text: "Não há auxiliar de inclusão quando necessário", emoji: "👤", example: "Ex.: Falta o profissional de apoio que a criança precisaria na escola." },
          { text: "A criança está se sentindo excluida pelos colegas na escola", emoji: "😢", example: "Ex.: Ela sente que os colegas não a incluem nas brincadeiras." },
        ],
      },
      {
        name: "Social e lazer",
        color: "text-teal-600 dark:text-teal-400",
        items: [
          { text: "Há barreiras de acessibilidade nos espacos de lazer", emoji: "🎡", example: "Ex.: Parques e praças sem acesso impedem a criança de brincar." },
          { text: "A criança não tem acesso a esporte ou cultura adaptada", emoji: "⚽", example: "Ex.: Falta esporte, dança ou atividade cultural adaptada para ela." },
          { text: "A criança tem poucos ou nenhum amigo fora da escola especial", emoji: "🧍", example: "Ex.: Não tem amigos fora do ambiente da escola especial." },
          { text: "A família evita frequentar locais por causa das barreiras", emoji: "🚪", example: "Ex.: A família deixa de sair por falta de acessibilidade nos lugares." },
          { text: "A inclusão escolar melhorou desde o início do acompanhamento", emoji: "📈", example: "Ex.: A criança está mais incluída na escola do que no começo." },
          { text: "A escola tem sido parceira na inclusão e nas adaptações", emoji: "🤝", example: "Ex.: A escola colabora fazendo as adaptações e incluindo a criança." },
          { text: "Os pais se sentem acolhidos e apoiados pela escola", emoji: "🫶", example: "Ex.: A família sente que a escola escuta e caminha junto." },
          { text: "A criança demonstra bem-estar e pertencimento no ambiente escolar", emoji: "😊", example: "Ex.: A criança gosta de ir à escola e se sente parte do grupo." },
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
          { text: "Há dificuldade de adormecer por desconforto posicional", emoji: "🛏️", example: "Ex.: Custa a dormir por não achar uma posição confortável." },
          { text: "Acorda frequentemente durante a noite", emoji: "🌙", example: "Ex.: Desperta várias vezes durante a noite." },
          { text: "Há bruxismo ou movimentos involuntários noturnos", emoji: "😬", example: "Ex.: Range os dentes ou faz movimentos involuntários dormindo." },
          { text: "Há apneia do sono ou ronco intenso", emoji: "💤", example: "Ex.: Ronca alto ou parece parar de respirar por instantes." },
          { text: "Há espasmos ou posturas dolorosas que interrompem o sono", emoji: "⚡", example: "Ex.: Espasmos ou posições que doem acordam a criança à noite." },
          { text: "Há refluxo gastroesofágico noturno que piora o sono", emoji: "🤢", example: "Ex.: O refluxo à noite incomoda e atrapalha o sono." },
          { text: "O sono e curto para a faixa etária mesmo sem acordar", emoji: "⏰", example: "Ex.: Dorme poucas horas para a idade, mesmo sem acordar no meio." },
        ],
      },
      {
        name: "Conforto e manejo noturno",
        color: "text-teal-600 dark:text-teal-400",
        items: [
          { text: "O posicionamento noturno com ortese ou almofada está adequado", emoji: "🛌", example: "Ex.: As almofadas e talas mantêm a criança bem posicionada para dormir." },
          { text: "Há lesão de pele ou escaras por posicionamento inadequado", emoji: "🩹", example: "Ex.: Apareceu ferida na pele por ficar muito tempo na mesma posição." },
          { text: "O cuidador precisa levantar varias vezes por noite para reposicionar", emoji: "🌃", example: "Ex.: Você levanta várias vezes por noite para virar a criança." },
          { text: "A cama ou superficie de sono e adequada as necessidades da criança", emoji: "🛏️", example: "Ex.: A cama ou colchão atende bem às necessidades da criança." },
          { text: "O sono da criança impacta significativamente o sono do cuidador", emoji: "😴", example: "Ex.: Você quase não dorme por causa do sono agitado da criança." },
          { text: "O sono melhorou com os ajustes de posicionamento ou medicação", emoji: "📈", example: "Ex.: Depois de ajustar a posição ou o remédio, ela passou a dormir melhor." },
          { text: "Há necessidade de polissonografia ou avaliação especializada", emoji: "🔬", example: "Ex.: Pode ser preciso um exame do sono para investigar melhor." },
          { text: "O conforto noturno está adequado com o suporte atual", emoji: "✅", example: "Ex.: Com o que é feito hoje, a criança dorme confortável." },
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
          { text: "Há engasgos frequentes durante as refeições", emoji: "😰", example: "Ex.: A criança engasga várias vezes enquanto come." },
          { text: "Há tosse ou engasgo ao deglutir líquidos", emoji: "💧", example: "Ex.: Tosse ou engasga ao beber água ou suco." },
          { text: "Há suspeita de aspiração silenciosa", emoji: "🫁", example: "Ex.: A comida pode estar indo para o pulmão sem ela tossir ou reclamar." },
          { text: "O tempo das refeições e superior a 30 minutos", emoji: "⏱️", example: "Ex.: Cada refeição demora mais de meia hora para terminar." },
          { text: "Há recusa alimentar por dificuldade de deglutição", emoji: "🙅", example: "Ex.: Recusa comer porque tem dificuldade de engolir." },
          { text: "Há pneumonias de repetição (suspeita de aspiração)", emoji: "🏥", example: "Ex.: Tem pneumonias seguidas, sinal de que a comida vai para o pulmão." },
        ],
      },
      {
        name: "Nutrição e suporte",
        color: "text-red-600 dark:text-red-400",
        items: [
          { text: "Há desnutrição ou desaceleração do crescimento", emoji: "📉", example: "Ex.: A criança está magra demais ou parou de ganhar peso e altura." },
          { text: "Há constipação crônica que piora o conforto", emoji: "🚽", example: "Ex.: Fica muitos dias sem evacuar e isso a deixa desconfortável." },
          { text: "Há refluxo gastroesofágico intenso ou vomitos frequentes", emoji: "🤮", example: "Ex.: Vomita ou golfa com frequência por causa do refluxo." },
          { text: "A criança usa gastrostomia ou sonda nasoenteral", emoji: "🔌", example: "Ex.: A criança se alimenta por sonda no nariz ou por gastrostomia." },
          { text: "Há necessidade de modificação de textura dos alimentos", emoji: "🥣", example: "Ex.: Precisa que a comida seja amassada ou o líquido engrossado." },
          { text: "A avaliação por fonoaudiologia de deglutição está em dia", emoji: "👩‍⚕️", example: "Ex.: A avaliação da fono sobre o engolir está atualizada." },
          { text: "A nutrição está sendo monitorada por nutricionista", emoji: "🥗", example: "Ex.: Um nutricionista acompanha a alimentação da criança." },
          { text: "A alimentação está adequada para as necessidades da criança", emoji: "✅", example: "Ex.: A criança está se alimentando bem e crescendo como deveria." },
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
          { text: "A ortese de tornozelo (AFO) não está mais adequada ao crescimento", emoji: "🦶", example: "Ex.: A tala do pé ficou pequena porque a criança cresceu." },
          { text: "A ortese está causando lesão de pele, pressão ou dor", emoji: "🩹", example: "Ex.: A tala está marcando a pele ou machucando a criança." },
          { text: "A criança recusa usar a ortese por desconforto", emoji: "🙅", example: "Ex.: Ela não quer usar a tala porque incomoda." },
          { text: "Há necessidade de nova avaliação para ortese de membro inferior", emoji: "🩺", example: "Ex.: Está na hora de reavaliar a tala das pernas com o especialista." },
          { text: "A ortese está sendo efetiva na melhora da marcha e postura", emoji: "✅", example: "Ex.: A tala está ajudando a criança a andar e se posicionar melhor." },
          { text: "Há necessidade de nova ortese por crescimento ou piora clínica", emoji: "🔄", example: "Ex.: Precisa de uma tala nova porque cresceu ou o quadro mudou." },
        ],
      },
      {
        name: "Equipamentos e adaptações",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          { text: "A cadeira de rodas ou andador não está adequado ao crescimento", emoji: "♿", example: "Ex.: A cadeira ou o andador ficou pequeno porque a criança cresceu." },
          { text: "O assento postural ou adaptações de cadeira precisam de ajuste", emoji: "🪑", example: "Ex.: O encosto e apoios da cadeira precisam ser reajustados." },
          { text: "O material escolar adaptado não está sendo fornecido", emoji: "✂️", example: "Ex.: A escola não está fornecendo o material adaptado necessário." },
          { text: "Há necessidade de novo dispositivo ou adaptação de tecnologia assistiva", emoji: "🦾", example: "Ex.: Falta um novo equipamento ou tecnologia que ajudaria a criança." },
          { text: "Os equipamentos atuais estão sendo efetivos e bem utilizados", emoji: "✅", example: "Ex.: A cadeira, o andador e as adaptações estão funcionando bem." },
          { text: "A solicitação de equipamentos via SUS ou plano está em andamento", emoji: "📄", example: "Ex.: O pedido de equipamentos pelo SUS ou plano já foi feito e aguarda." },
          { text: "Há necessidade de avaliação urgente para novo equipamento", emoji: "🚨", example: "Ex.: A criança precisa com urgência de avaliar um novo equipamento." },
          { text: "Todos os equipamentos necessários estão sendo fornecidos", emoji: "🧰", example: "Ex.: A criança tem todos os equipamentos que precisa disponíveis." },
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
          { text: "Sente cansaco físico intenso pelo cuidado diário", emoji: "😮‍💨", example: "Ex.: Quem cuida termina o dia com o corpo exausto." },
          { text: "Sente esgotamento emocional ou desesperanca", emoji: "😔", example: "Ex.: Sente-se emocionalmente no limite ou sem esperança." },
          { text: "Chora com frequência ou sente-se deprimido", emoji: "😢", example: "Ex.: Chora com frequência ou se sente para baixo a maior parte do tempo." },
          { text: "Não tem tempo para si mesmo ou para atividades de lazer", emoji: "⏳", example: "Ex.: Não sobra tempo para descansar ou fazer algo que goste." },
          { text: "A saude própria foi negligenciada pelo cuidado da criança", emoji: "🩺", example: "Ex.: Deixou de cuidar da própria saúde para cuidar da criança." },
          { text: "Sente-se sozinho no cuidado sem apoio suficiente", emoji: "🧍", example: "Ex.: Sente que carrega o cuidado sozinho, sem ajuda de ninguém." },
        ],
      },
      {
        name: "Social e perspectiva",
        color: "text-orange-600 dark:text-orange-400",
        items: [
          { text: "Abriu mão de atividades importantes por causa do cuidado", emoji: "🚪", example: "Ex.: Largou o trabalho ou os estudos para cuidar da criança." },
          { text: "Sente que a criança consome todos os seus recursos", emoji: "🕳️", example: "Ex.: Sente que todo o tempo, dinheiro e energia vão para o cuidado." },
          { text: "Há conflito constante com o parceiro por causa do cuidado", emoji: "💔", example: "Ex.: Vive brigando com o parceiro por causa da sobrecarga do cuidado." },
          { text: "Se sente sem perspectiva para o futuro da criança", emoji: "🌧️", example: "Ex.: Não consegue enxergar um futuro melhor para a criança." },
          { text: "Tem medo do que vai acontecer quando não puder mais cuidar", emoji: "😟", example: "Ex.: Tem medo de quem vai cuidar quando ele não puder mais." },
          { text: "A sobrecarga melhorou com o suporte e os serviços disponíveis", emoji: "📈", example: "Ex.: Com os apoios atuais, o peso do cuidado ficou mais leve." },
          { text: "Há necessidade de encaminhamento para saude mental do cuidador", emoji: "🧠", example: "Ex.: Quem cuida precisaria de apoio psicológico ou psiquiátrico." },
          { text: "O cuidador tem apoio suficiente para manter a qualidade do cuidado", emoji: "🤝", example: "Ex.: Quem cuida tem ajuda o bastante para cuidar bem da criança." },
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
          { text: "A queixa principal que motivou o encaminhamento está resolvida ou estabilizada", emoji: "✅", example: "Ex.: O motivo que trouxe a criança à consulta já está resolvido ou controlado." },
          { text: "Os objetivos terapêuticos do plano atual foram atingidos", emoji: "🎯", example: "Ex.: As metas combinadas no tratamento foram alcançadas." },
          { text: "A funcionalidade escolar está adequada ou em nível aceitável", emoji: "🏫", example: "Ex.: A criança está indo bem na escola dentro do possível." },
          { text: "A funcionalidade familiar e social está preservada", emoji: "👨‍👩‍👧", example: "Ex.: A criança convive bem com a família e faz amizades." },
          { text: "A medicação, se houver, está em regime estável e seguro", emoji: "💊", example: "Ex.: O remédio, se usa algum, está numa dose fixa e segura." },
          { text: "O diagnóstico está claro e a família compreende a condição", emoji: "📖", example: "Ex.: O diagnóstico está definido e a família entende a condição." },
        ],
      },
      {
        name: "Competencias e continuidade",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          { text: "A família tem competência para manejar situações do cotidiano", emoji: "🧰", example: "Ex.: A família sabe lidar sozinha com as situações do dia a dia." },
          { text: "A escola tem suporte adequado para a continuidade sem o clínico", emoji: "🏫", example: "Ex.: A escola consegue seguir apoiando a criança sem depender do médico." },
          { text: "Há plano de crise documentado para situações de emergência", emoji: "🆘", example: "Ex.: Existe por escrito o que fazer em caso de crise ou emergência." },
          { text: "A criança tem acompanhamento de outras especialidades necessárias", emoji: "👩‍⚕️", example: "Ex.: A criança segue com os outros especialistas de que precisa." },
          { text: "A família sabe os sinais de alerta para retorno precoce", emoji: "🚩", example: "Ex.: A família sabe quais sinais indicam voltar ao médico antes." },
          { text: "Há serviço de referência para acompanhamento longitudinal", emoji: "📍", example: "Ex.: Existe um serviço fixo que vai acompanhar a criança ao longo do tempo." },
          { text: "O paciente e a família concordam com o encerramento ou espacamento", emoji: "🤝", example: "Ex.: A criança e a família concordam em dar alta ou espaçar as consultas." },
          { text: "Há retorno agendado ou critério claro para retornar se necessário", emoji: "📅", example: "Ex.: Já há data de retorno ou fica claro quando procurar de novo." },
        ],
      },
    ],
  },


};
