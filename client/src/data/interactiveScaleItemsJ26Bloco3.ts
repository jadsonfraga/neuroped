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
          { text: "Adormece mais rápido após o uso da melatonina", emoji: "😴", example: "Ex.: antes rolava na cama por 1 hora e agora pega no sono logo depois do remédio." },
          { text: "O tempo para adormecer reduziu para menos de 30 minutos", emoji: "⏱️", example: "Ex.: da hora que deita até dormir, hoje passa menos de meia hora." },
          { text: "Fica sonolenta no horário esperado após a melatonina", emoji: "🥱", example: "Ex.: por volta das 20h começa a bocejar e esfregar os olhos." },
          { text: "A resistência para dormir diminuiu com o uso", emoji: "🛏️", example: "Ex.: não briga nem pede para ficar acordada na hora de deitar." },
          { text: "Há consistência no horário de adormecer nos dias com melatonina", emoji: "📅", example: "Ex.: quase todos os dias adormece no mesmo horário." },
        ],
      },
      {
        name: "Qualidade do Sono e Tolerância",
        items: [
          { text: "O sono da noite toda melhorou (menos despertares)", emoji: "🌙", example: "Ex.: antes acordava 3 vezes por noite e agora dorme direto." },
          { text: "Acorda no horário esperado sem sonolência excessiva", emoji: "☀️", example: "Ex.: levanta de manhã disposta, sem ficar grogue ou muito sonolenta." },
          { text: "Não apresentou efeitos adversos (dor de cabeça, irritabilidade matinal)", emoji: "✅", example: "Ex.: acorda de bom humor, sem reclamar de dor de cabeça." },
          { text: "Pais relatam melhora geral na qualidade do sono", emoji: "👨‍👩‍👧", example: "Ex.: a família percebe que o sono ficou mais tranquilo e reparador." },
          { text: "Criança não demonstra dependência para dormir sem a melatonina", emoji: "🔄", example: "Ex.: nos dias sem o remédio, ainda consegue adormecer bem." },
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
          { text: "Tem horário fixo para dormir (varia menos de 30 minutos entre dias)", emoji: "🕗", example: "Ex.: todo dia vai para a cama por volta das 20h30, com pouca variação." },
          { text: "Segue uma sequência previsível antes de dormir (banho, escovação, história)", emoji: "🛁", example: "Ex.: toda noite é banho, escovar os dentes e uma historinha, nessa ordem." },
          { text: "Evita atividades estimulantes na última hora antes de dormir", emoji: "🧘", example: "Ex.: na última hora nada de correria ou brincadeira agitada." },
          { text: "Ambiente do quarto está escuro, silencioso e com temperatura adequada", emoji: "🌑", example: "Ex.: quarto com luz apagada, sem barulho e temperatura agradável." },
          { text: "Não usa telas nas 60 minutos que antecedem o sono", emoji: "📵", example: "Ex.: desliga TV, tablet e celular uma hora antes de dormir." },
          { text: "Faz refeição leve e não pesada na hora de jantar", emoji: "🍲", example: "Ex.: janta algo leve, sem comida muito pesada perto de dormir." },
        ],
      },
      {
        name: "Autonomia e Associações do Sono",
        items: [
          { text: "Adormece no próprio quarto / local habitual", emoji: "🚪", example: "Ex.: dorme na própria cama e no seu quarto, não no colo ou na cama dos pais." },
          { text: "Consegue adormecer sem presença constante do cuidador", emoji: "🧸", example: "Ex.: pega no sono sozinha, sem precisar que alguém fique ao lado." },
          { text: "Ao despertar à noite, retorna ao sono sem precisar chamar os pais", emoji: "🌜", example: "Ex.: se acorda de madrugada, volta a dormir sozinha sem chamar." },
          { text: "Mantém a rotina nos fins de semana com variação máxima de 1 hora", emoji: "📆", example: "Ex.: no sábado e domingo dorme quase no mesmo horário da semana." },
          { text: "Tem horário fixo de acordar (inclusive fins de semana)", emoji: "⏰", example: "Ex.: acorda por volta do mesmo horário todos os dias, mesmo no fim de semana." },
          { text: "Os pais têm consistência em cumprir a rotina estabelecida", emoji: "🤝", example: "Ex.: a família mantém a mesma rotina todas as noites, sem exceções frequentes." },
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
          { text: "Usa colher sem derramar excessivamente (esperado a partir de 18 meses)", emoji: "🥄", example: "Ex.: come sopa ou papinha com a colher levando quase tudo à boca." },
          { text: "Usa garfo sem ajuda (esperado a partir de 2 anos)", emoji: "🍴", example: "Ex.: espeta pedaços de comida com o garfo sozinha." },
          { text: "Bebe em copo aberto sem derramar (esperado a partir de 2 anos)", emoji: "🥤", example: "Ex.: bebe água no copo comum sem entornar no colo." },
          { text: "Usa faca para alimentos macios (esperado a partir de 5 anos)", emoji: "🔪", example: "Ex.: corta um pedaço de banana ou batata cozida com a faca." },
          { text: "Serve o próprio prato com supervisão (esperado a partir de 5 anos)", emoji: "🍽️", example: "Ex.: coloca a comida no próprio prato com um adulto por perto." },
          { text: "Prepara lanches simples sozinha (esperado a partir de 7 anos)", emoji: "🥪", example: "Ex.: faz um sanduíche ou pega uma fruta sem ajuda." },
        ],
      },
      {
        name: "Comportamento Autônomo",
        items: [
          { text: "Reconhece e comunica sensação de fome e saciedade", emoji: "🗣️", example: "Ex.: avisa quando está com fome ou quando já está satisfeita." },
          { text: "Para de comer quando está satisfeita sem pressão dos pais", emoji: "🛑", example: "Ex.: larga o prato quando enche, sem precisar insistir para parar." },
          { text: "Escolhe entre opções alimentares apresentadas", emoji: "🤔", example: "Ex.: escolhe entre maçã ou banana quando você oferece as duas." },
          { text: "Adapta-se a refeições em diferentes contextos (escola, visita, restaurante)", emoji: "🍔", example: "Ex.: come bem na escola, na casa da avó ou no restaurante." },
          { text: "Lava as mãos antes das refeições com lembrança leve", emoji: "🧼", example: "Ex.: vai lavar as mãos antes de comer só com um lembrete simples." },
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
    labels: ["Não demonstra", "Demonstra raramente", "Demonstra às vezes", "Demonstra consistentemente"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_better",
    totalLabel: "Escore de resiliência infantil",
    domains: [
      {
        name: "Enfrentamento e Adaptação",
        items: [
          { text: "Enfrenta dificuldades sem desistir facilmente", emoji: "💪", example: "Ex.: continua tentando montar o quebra-cabeça mesmo quando erra." },
          { text: "Busca soluções quando encontra obstáculos", emoji: "💡", example: "Ex.: tenta outro jeito de resolver quando algo não dá certo." },
          { text: "Aceita ajuda dos outros em momentos difíceis", emoji: "🤲", example: "Ex.: aceita colo ou conselho quando está triste ou com problema." },
          { text: "Se recupera após frustrações ou perdas em tempo adequado para a idade", emoji: "🌈", example: "Ex.: fica chateada ao perder um jogo, mas logo volta a brincar." },
          { text: "Demonstra otimismo — acredita que as coisas podem melhorar", emoji: "🌟", example: "Ex.: diz que amanhã vai ser melhor quando algo dá errado." },
          { text: "Mantém o funcionamento mesmo em situações adversas", emoji: "⚓", example: "Ex.: continua indo à escola e brincando mesmo num período difícil da família." },
        ],
      },
      {
        name: "Fatores Protetores",
        items: [
          { text: "Tem pelo menos um adulto de referência com quem pode contar", emoji: "🫂", example: "Ex.: tem a mãe, o pai, um avô ou professor com quem se sente segura." },
          { text: "Tem amigos que a apoiam e com quem compartilha dificuldades", emoji: "👭", example: "Ex.: tem colegas com quem conversa e desabafa quando algo a incomoda." },
          { text: "Tem atividades de lazer e recreação que gosta", emoji: "⚽", example: "Ex.: gosta de jogar bola, desenhar ou dançar no tempo livre." },
          { text: "Tem senso de identidade positiva (sabe o que é bom nela)", emoji: "😊", example: "Ex.: sabe dizer coisas boas sobre si, como 'sou boa em correr'." },
          { text: "Tem senso de propósito ou atividades que lhe dão significado", emoji: "🎯", example: "Ex.: se anima com um projeto, um hobby ou ajudar em casa." },
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
    labels: ["Dependente / Não realiza", "Realiza com muita ajuda", "Realiza com alguma ajuda", "Realiza de forma independente"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_better",
    totalLabel: "Escore de independência nas AVDs",
    domains: [
      {
        name: "Autocuidado",
        items: [
          { text: "Higiene oral — escova os dentes com supervisão mínima", emoji: "🪥", example: "Ex.: escova os dentes sozinha, você só confere no final." },
          { text: "Banho — toma banho com supervisão mínima para a faixa etária", emoji: "🚿", example: "Ex.: se ensaboa e se enxágua com pouca ajuda." },
          { text: "Vestir-se — escolhe e coloca roupas adequadas para a ocasião", emoji: "👕", example: "Ex.: escolhe e veste a roupa certa para frio, calor ou passeio." },
          { text: "Calçar sapatos — coloca e fecha os calçados", emoji: "👟", example: "Ex.: calça o tênis e fecha o velcro ou o cadarço sozinha." },
          { text: "Alimentação — come usando talheres adequados para a idade", emoji: "🍴", example: "Ex.: come sozinha usando garfo e colher direitinho." },
          { text: "Controle esfincteriano — usa o banheiro de forma independente", emoji: "🚽", example: "Ex.: vai ao banheiro sozinha quando tem vontade, sem escapes." },
        ],
      },
      {
        name: "Mobilidade e Participação",
        items: [
          { text: "Locomoção — anda ou se locomove de forma adequada para a condição", emoji: "🚶", example: "Ex.: caminha pela casa e pela rua sem depender de ser carregada." },
          { text: "Subir e descer escadas — sem auxílio ou com suporte mínimo", emoji: "🪜", example: "Ex.: sobe e desce a escada segurando no corrimão." },
          { text: "Transporte — usa transporte escolar ou coletivo com supervisão adequada", emoji: "🚌", example: "Ex.: anda de ônibus ou van escolar com a supervisão esperada para a idade." },
          { text: "Comunicação — expressa necessidades e desejos de forma funcional", emoji: "💬", example: "Ex.: consegue pedir água, avisar que quer ir ao banheiro ou dizer o que quer." },
          { text: "Participação escolar — vai à escola e realiza atividades pedagógicas", emoji: "🏫", example: "Ex.: frequenta a escola e faz as tarefas da turma." },
          { text: "Tarefas domésticas simples — contribui com tarefas adequadas para a idade", emoji: "🧹", example: "Ex.: guarda os brinquedos ou ajuda a pôr a mesa." },
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
    labels: ["Nunca / Não participa", "Raramente", "Às vezes", "Frequentemente / Sempre"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_better",
    totalLabel: "Escore de participação social",
    domains: [
      {
        name: "Participação Comunitária",
        items: [
          { text: "Participa de festas de aniversário de colegas", emoji: "🎂", example: "Ex.: vai e curte as festinhas de aniversário para as quais é convidada." },
          { text: "Vai ao parque, praça ou espaços públicos com família ou amigos", emoji: "🌳", example: "Ex.: brinca no parquinho ou na praça no fim de semana." },
          { text: "Participa de atividades de lazer fora de casa (cinema, shopping, praia)", emoji: "🎬", example: "Ex.: passeia bem ao cinema, ao shopping ou à praia." },
          { text: "Usa espaços comunitários (biblioteca, clube, quadra) com adequação", emoji: "📚", example: "Ex.: frequenta a biblioteca ou a quadra e se comporta adequadamente." },
          { text: "Participa de atividades religiosas ou culturais da família", emoji: "⛪", example: "Ex.: acompanha a família na igreja ou em festas culturais." },
        ],
      },
      {
        name: "Participação com Pares",
        items: [
          { text: "Tem amigos com quem brinca fora da escola", emoji: "🧒", example: "Ex.: tem colegas que vêm brincar em casa ou que ela visita." },
          { text: "Participa de esportes ou atividades extracurriculares em grupo", emoji: "🏀", example: "Ex.: faz futebol, dança ou natação junto com outras crianças." },
          { text: "É convidada e participa de eventos sociais de colegas", emoji: "🎉", example: "Ex.: é chamada para festas e encontros dos amigos." },
          { text: "Inicia ou aceita brincadeiras cooperativas com outras crianças", emoji: "🤸", example: "Ex.: convida os colegas para brincar ou entra na brincadeira deles." },
          { text: "Mantém amizades ao longo do tempo", emoji: "🫱", example: "Ex.: tem amigos que continua vendo há vários meses ou anos." },
          { text: "Adapta-se a diferentes grupos e contextos sociais", emoji: "🔀", example: "Ex.: se enturma bem tanto na escola quanto num grupo novo." },
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
          { text: "O médico explica o diagnóstico de forma clara e compreensível", emoji: "🩺", example: "Ex.: você entende o que a criança tem depois que o médico explica." },
          { text: "O médico escuta as preocupações da família com atenção", emoji: "👂", example: "Ex.: o médico ouve suas dúvidas sem pressa e olhando para você." },
          { text: "O médico responde às dúvidas de forma satisfatória", emoji: "❓", example: "Ex.: você sai da consulta com as perguntas respondidas." },
          { text: "O tempo de consulta é suficiente para abordar as questões importantes", emoji: "⏳", example: "Ex.: dá tempo de falar de tudo que preocupa, sem se sentir apressada." },
          { text: "O plano de tratamento é explicado e negociado com a família", emoji: "📋", example: "Ex.: o médico combina o tratamento com você, considerando sua realidade." },
          { text: "Há facilidade de contato com o médico entre as consultas", emoji: "📞", example: "Ex.: consegue tirar uma dúvida com o médico mesmo fora da consulta." },
        ],
      },
      {
        name: "Resultado do Tratamento",
        items: [
          { text: "A família percebe melhora no filho desde o início do tratamento", emoji: "📈", example: "Ex.: você nota progressos na criança depois que o tratamento começou." },
          { text: "As terapias indicadas estão sendo eficazes", emoji: "✅", example: "Ex.: a fono ou a TO estão trazendo resultados visíveis." },
          { text: "A escola está colaborando com o plano de tratamento", emoji: "🏫", example: "Ex.: a escola segue as orientações e conversa com a equipe." },
          { text: "A família se sente empoderada para lidar com os desafios", emoji: "💪", example: "Ex.: você se sente mais segura para lidar com as dificuldades do dia a dia." },
          { text: "O tratamento é compatível com a rotina e realidade da família", emoji: "🏠", example: "Ex.: dá para encaixar as terapias e cuidados na rotina da casa." },
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
    labels: ["Não consegue / Nunca", "Consegue raramente", "Consegue às vezes", "Consegue sempre / Sem dificuldade"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_better",
    totalLabel: "Escore de engajamento terapêutico",
    domains: [
      {
        name: "Frequência e Acesso",
        items: [
          { text: "Consegue manter frequência regular nas terapias (menos de 2 faltas por mês)", emoji: "🗓️", example: "Ex.: quase não falta às sessões de fono, TO ou fisio." },
          { text: "Tem transporte acessível para chegar às terapias", emoji: "🚗", example: "Ex.: tem como chegar ao local das terapias sem grande dificuldade." },
          { text: "O custo das terapias não é uma barreira significativa", emoji: "💰", example: "Ex.: consegue pagar as terapias sem apertar demais o orçamento." },
          { text: "As terapias estão em horário compatível com a rotina familiar", emoji: "🕐", example: "Ex.: os horários das sessões encaixam no trabalho e na escola." },
          { text: "A criança não tem resistência em ir às terapias", emoji: "🙂", example: "Ex.: vai às sessões sem chorar ou fazer birra." },
        ],
      },
      {
        name: "Participação e Evolução",
        items: [
          { text: "A criança participa ativamente das atividades terapêuticas", emoji: "🙌", example: "Ex.: se envolve e colabora nas atividades propostas pelo terapeuta." },
          { text: "A família aplica em casa o que aprende nas terapias", emoji: "🏡", example: "Ex.: você repete em casa os exercícios que o terapeuta orienta." },
          { text: "Há comunicação efetiva entre os terapeutas e a família", emoji: "🤝", example: "Ex.: os terapeutas conversam com você sobre como está indo." },
          { text: "A família percebe evolução na criança com as terapias", emoji: "📈", example: "Ex.: você vê a criança evoluindo desde que começou as terapias." },
          { text: "Os terapeutas comunicam o progresso e os objetivos de forma clara", emoji: "🎯", example: "Ex.: os terapeutas explicam as metas e o que já foi conquistado." },
          { text: "A família está motivada a continuar com as terapias", emoji: "🔥", example: "Ex.: você se sente animada para manter o tratamento." },
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
    labels: ["Não ocorre / Ausente", "Ocorre raramente", "Ocorre às vezes", "Ocorre sempre / Plenamente"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_better",
    totalLabel: "Escore de inclusão escolar efetiva",
    domains: [
      {
        name: "Participação na Sala de Aula",
        items: [
          { text: "A criança participa das atividades de sala de aula com adaptações adequadas", emoji: "📝", example: "Ex.: participa das aulas com os ajustes de que precisa para acompanhar." },
          { text: "O professor faz adaptações curriculares específicas para a criança", emoji: "✏️", example: "Ex.: o professor simplifica ou adapta as tarefas para ela." },
          { text: "A criança tem acesso ao AEE (Atendimento Educacional Especializado)", emoji: "🧑‍🏫", example: "Ex.: recebe apoio na sala de recursos ou com professor especializado." },
          { text: "A criança é incluída nas atividades com os colegas", emoji: "👥", example: "Ex.: participa dos trabalhos em grupo junto com a turma." },
          { text: "Não é discriminada ou bullied pelos colegas por causa da NEE", emoji: "🛡️", example: "Ex.: não sofre apelidos ou exclusão por causa da condição." },
          { text: "O professor tem formação ou suporte para lidar com a NEE da criança", emoji: "🎓", example: "Ex.: o professor sabe ou recebe orientação para lidar com a necessidade dela." },
        ],
      },
      {
        name: "Participação Social e Institucional",
        items: [
          { text: "A criança tem amigos na escola", emoji: "🧑‍🤝‍🧑", example: "Ex.: tem colegas com quem brinca e conversa na escola." },
          { text: "Participa de atividades extracurriculares com os colegas", emoji: "🎨", example: "Ex.: entra no coral, no esporte ou no passeio da escola." },
          { text: "A escola tem estrutura física acessível para a criança", emoji: "♿", example: "Ex.: a escola tem rampa, banheiro adaptado ou o que ela precisa para circular." },
          { text: "Há comunicação efetiva entre escola e família sobre o progresso", emoji: "📨", example: "Ex.: a escola avisa como a criança está indo e ouve a família." },
          { text: "A escola tem plano de desenvolvimento individualizado (PDI)", emoji: "🗂️", example: "Ex.: existe um plano por escrito com as metas específicas dela." },
          { text: "A família se sente acolhida e parceira na escola", emoji: "🤗", example: "Ex.: você se sente bem-vinda e ouvida quando vai à escola." },
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
    labels: ["Muito dependente / Ausente", "Dependente com alguma habilidade", "Parcialmente autônomo", "Plenamente autônomo para a situação"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_better",
    totalLabel: "Escore de autonomia do adolescente com NEE",
    domains: [
      {
        name: "Autonomia Pessoal",
        items: [
          { text: "Realiza higiene e autocuidado de forma independente", emoji: "🧴", example: "Ex.: toma banho, se veste e cuida da higiene sem precisar de ajuda." },
          { text: "Prepara alimentos simples sozinho", emoji: "🍳", example: "Ex.: faz um sanduíche, esquenta comida ou prepara um lanche sozinho." },
          { text: "Administra dinheiro para compras simples", emoji: "🪙", example: "Ex.: vai à padaria, compra e confere o troco sem ajuda." },
          { text: "Usa transporte público ou se locomove com independência adequada", emoji: "🚏", example: "Ex.: pega ônibus ou vai a pé a lugares conhecidos com segurança." },
          { text: "Toma decisões sobre atividades e preferências pessoais", emoji: "🧭", example: "Ex.: decide o que quer fazer no tempo livre ou qual curso seguir." },
          { text: "Expressa preferências e valores próprios", emoji: "🗨️", example: "Ex.: fala o que gosta, o que acha certo e o que não concorda." },
        ],
      },
      {
        name: "Projeto de Vida",
        items: [
          { text: "Tem perspectivas de vida profissional ou vocacional", emoji: "💼", example: "Ex.: fala sobre o que quer ser ou em que gostaria de trabalhar." },
          { text: "Participa de atividades de formação profissional ou preparatória", emoji: "🛠️", example: "Ex.: faz um curso profissionalizante ou estágio de preparação." },
          { text: "Tem relacionamentos sociais fora do contexto familiar", emoji: "👋", example: "Ex.: tem amigos e convívio além da família, como colegas e grupos." },
          { text: "Demonstra senso de identidade positiva independente da NEE", emoji: "🌟", example: "Ex.: se vê como pessoa capaz, não apenas pela condição que tem." },
          { text: "A família apoia a autonomia sem superproteger", emoji: "🕊️", example: "Ex.: a família deixa ele tentar sozinho em vez de fazer tudo por ele." },
          { text: "Há plano de transição para a vida adulta", emoji: "🗺️", example: "Ex.: existe um combinado sobre estudos, trabalho e independência futura." },
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
    labels: ["Sem função / Dependência total", "Função muito limitada", "Função moderada com adaptações", "Função adequada para o nível"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_better",
    totalLabel: "Escore funcional global na paralisia cerebral",
    domains: [
      {
        name: "Motor e Mobilidade",
        items: [
          { text: "Motor grosso — mobilidade e deambulação (nível GMFCS)", emoji: "🚶", example: "Ex.: observe se anda sozinha, com apoio, ou usa cadeira de rodas." },
          { text: "Motor fino — uso das mãos e manipulação (nível MACS)", emoji: "✋", example: "Ex.: observe como manuseia objetos: pega, solta e manipula com as mãos." },
          { text: "Controle postural — sentado, em pé e transferências", emoji: "🪑", example: "Ex.: observe se mantém o tronco firme sentada e ao mudar de posição." },
          { text: "Alimentação — mastigação e deglutição (nível EDACS)", emoji: "🍽️", example: "Ex.: observe se mastiga e engole com segurança, sem engasgos." },
          { text: "Comunicação — expressão e compreensão (nível CFCS)", emoji: "💬", example: "Ex.: observe como se expressa e se entende o que dizem a ela." },
        ],
      },
      {
        name: "Cognitivo e Participação",
        items: [
          { text: "Cognição e aprendizagem — nível de desempenho escolar ou funcional", emoji: "🧠", example: "Ex.: observe como aprende e acompanha as tarefas para a idade." },
          { text: "Comunicação alternativa — usa CAA ou recursos de apoio se necessário", emoji: "🔤", example: "Ex.: observe se usa pranchas, figuras ou dispositivos para se comunicar." },
          { text: "AVDs — nível de independência nas atividades de vida diária", emoji: "🧼", example: "Ex.: observe quanto faz sozinha ao comer, vestir e se higienizar." },
          { text: "Participação — frequência e qualidade da participação em atividades", emoji: "🙋", example: "Ex.: observe o quanto se envolve em brincadeiras e atividades do grupo." },
          { text: "Qualidade de vida — nível de satisfação e bem-estar percebido", emoji: "😊", example: "Ex.: observe sinais de bem-estar e satisfação no dia a dia." },
          { text: "Saúde — controle de comorbidades (epilepsia, dor, nutrição, sono)", emoji: "🩺", example: "Ex.: observe se crises, dor, alimentação e sono estão controlados." },
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
    labels: ["Ausente / Não avaliado", "Presente mas inconsistente", "Presente na maioria das tentativas", "Presente e consistente"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_better",
    totalLabel: "Escore de prontidão alimentar oral do prematuro",
    domains: [
      {
        name: "Estado e Reflexos",
        items: [
          { text: "Estado de alerta ativo no momento da tentativa alimentar", emoji: "👀", example: "Ex.: observe se o bebê está acordado e desperto na hora de mamar." },
          { text: "Reflexo de busca presente e ativo", emoji: "🔍", example: "Ex.: ao tocar a bochecha, o bebê vira a cabeça procurando o bico." },
          { text: "Reflexo de sucção presente com boa amplitude", emoji: "🍼", example: "Ex.: observe se o bebê suga com força ao encostar algo nos lábios." },
          { text: "Reflexo de deglutição funcional", emoji: "💧", example: "Ex.: observe se engole o leite de forma coordenada, sem acúmulo." },
          { text: "Resposta ao estímulo perioral adequada", emoji: "👄", example: "Ex.: observe se reage bem ao toque ao redor da boca." },
        ],
      },
      {
        name: "Coordinação e Tolerância",
        items: [
          { text: "Coordenação sucção-deglutição-respiração mantida por pelo menos 10 sugadas", emoji: "🔗", example: "Ex.: observe se suga, engole e respira em ritmo por cerca de 10 sugadas seguidas." },
          { text: "Não apresenta dessaturação durante a tentativa oral", emoji: "🩸", example: "Ex.: observe se a saturação de oxigênio se mantém estável ao mamar." },
          { text: "Não apresenta bradicardia durante a alimentação", emoji: "💓", example: "Ex.: observe se os batimentos não caem durante a mamada." },
          { text: "Não apresenta apneia durante a alimentação", emoji: "🫁", example: "Ex.: observe se o bebê não faz pausas respiratórias ao mamar." },
          { text: "Tolerou pelo menos 5 ml de leite por via oral sem intercorrências", emoji: "🥛", example: "Ex.: verifique se aceitou ao menos 5 ml pela boca sem engasgo ou vômito." },
          { text: "Família participou de ao menos 1 sessão de treinamento de alimentação", emoji: "👨‍👩‍👧", example: "Ex.: verifique se os pais já acompanharam uma orientação de como alimentar." },
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
    labels: ["Não realizado / Ausente", "Realizado raramente", "Realizado às vezes", "Realizado frequentemente / Pleno"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_better",
    totalLabel: "Escore de follow-up do Método Canguru",
    domains: [
      {
        name: "Vínculo e Amamentação",
        items: [
          { text: "Os pais realizam contato pele a pele regularmente após a alta", emoji: "🤱", example: "Ex.: colocam o bebê no colo pele a pele (canguru) todos os dias em casa." },
          { text: "A mãe está amamentando ou tentando amamentar", emoji: "🍼", example: "Ex.: a mãe oferece o peito ao bebê, mesmo que ainda com dificuldade." },
          { text: "O bebê demonstra comportamentos de vínculo (olha, sorri, busca o contato)", emoji: "👶", example: "Ex.: o bebê fita o rosto dos pais, sorri e procura o colo." },
          { text: "Os pais demonstram confiança no cuidado do bebê", emoji: "💗", example: "Ex.: os pais pegam, trocam e acalmam o bebê com segurança." },
          { text: "A mãe recebe apoio para amamentação (consultora, grupo de apoio)", emoji: "🤝", example: "Ex.: a mãe conta com uma consultora de amamentação ou grupo de mães." },
        ],
      },
      {
        name: "Desenvolvimento e Seguimento",
        items: [
          { text: "O bebê está ganhando peso adequadamente (mais de 20 g/dia)", emoji: "⚖️", example: "Ex.: nas pesagens, o bebê ganha peso de forma constante." },
          { text: "Os pais reconhecem sinais de alerta de desenvolvimento", emoji: "🚨", example: "Ex.: os pais sabem quando procurar ajuda diante de um sinal preocupante." },
          { text: "Há consultas de follow-up sendo realizadas conforme programado", emoji: "📅", example: "Ex.: a família comparece às consultas de acompanhamento marcadas." },
          { text: "Os pais relatam boa qualidade do sono e alimentação do bebê", emoji: "😴", example: "Ex.: os pais dizem que o bebê dorme e mama bem." },
          { text: "Não há sinais de depressão pós-parto na mãe", emoji: "💛", example: "Ex.: a mãe não está muito triste, apática ou sem vontade de cuidar do bebê." },
          { text: "A família tem rede de apoio adequada para o cuidado do prematuro", emoji: "🫂", example: "Ex.: parentes ou amigos ajudam nos cuidados do bebê." },
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
    labels: ["Não atingido", "Atingido parcialmente", "Atingido com reservas", "Atingido plenamente"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_better",
    totalLabel: "Escore de prontidão para alta da UTIN",
    domains: [
      {
        name: "Estabilidade Clínica do Bebê",
        items: [
          { text: "Peso adequado para alta (> 1800 g ou conforme protocolo institucional)", emoji: "⚖️", example: "Ex.: verifique se o bebê atingiu o peso mínimo previsto no protocolo." },
          { text: "Temperatura estável em berço comum há mais de 24 horas", emoji: "🌡️", example: "Ex.: verifique se mantém a temperatura fora da incubadora por mais de um dia." },
          { text: "Via oral exclusiva há mais de 48 horas com ganho de peso", emoji: "🍼", example: "Ex.: verifique se mama tudo pela boca há mais de 2 dias, ganhando peso." },
          { text: "Ausência de apneia ou bradicardia significativa há mais de 5 dias", emoji: "💓", example: "Ex.: verifique se não teve pausa respiratória ou queda de batimentos há 5 dias." },
          { text: "Ausência de necessidade de oxigênio suplementar", emoji: "🫁", example: "Ex.: verifique se respira bem sozinho, sem precisar de oxigênio." },
          { text: "Exames laboratoriais de alta dentro dos limites aceitáveis", emoji: "🧪", example: "Ex.: confira se os exames de sangue de alta estão dentro do esperado." },
        ],
      },
      {
        name: "Preparo da Família",
        items: [
          { text: "Mãe e/ou pai treinados para amamentação ou preparação do leite", emoji: "🍼", example: "Ex.: os pais sabem amamentar ou preparar a mamadeira corretamente." },
          { text: "Família treinada para identificar sinais de alerta do bebê", emoji: "🚨", example: "Ex.: os pais reconhecem sinais como cor arroxeada ou dificuldade para respirar." },
          { text: "Família sabe quando e como procurar atendimento de urgência", emoji: "🏥", example: "Ex.: os pais sabem para onde levar o bebê e quando ir com urgência." },
          { text: "Família tem rede de apoio adequada em casa", emoji: "🫂", example: "Ex.: há parentes ou amigos para ajudar nos cuidados em casa." },
          { text: "Consulta de follow-up agendada para até 7 dias após a alta", emoji: "📅", example: "Ex.: já existe uma consulta marcada na primeira semana após a alta." },
          { text: "Família demonstrou confiança no cuidado do bebê em simulação", emoji: "🤲", example: "Ex.: os pais treinaram os cuidados e se saíram bem antes da alta." },
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
          { text: "Motor grosso — caminha de forma estável e sobe e desce escadas com apoio", emoji: "🚶", example: "Ex.: anda firme sem cair e sobe a escada segurando no corrimão." },
          { text: "Motor fino — empilha cubos, faz rabiscos, segura colher", emoji: "🧱", example: "Ex.: empilha blocos, rabisca no papel e segura a colher para comer." },
          { text: "Linguagem expressiva — fala pelo menos 50 palavras e frases de 2 palavras", emoji: "🗣️", example: "Ex.: fala várias palavras e junta duas, como 'quer água'." },
          { text: "Linguagem receptiva — compreende instruções simples de 2 etapas", emoji: "👂", example: "Ex.: entende pedidos como 'pega o sapato e traz aqui'." },
          { text: "Comunicação social — aponta para objetos e usa gesto para comunicar", emoji: "👉", example: "Ex.: aponta o que quer e acena para se comunicar." },
        ],
      },
      {
        name: "Cognitivo e Social",
        items: [
          { text: "Cognição — resolve problemas simples, brincadeira de faz de conta básica", emoji: "🧠", example: "Ex.: finge dar comida ao bonequinho ou encaixa formas simples." },
          { text: "Atenção — foca em atividade por pelo menos 2-3 minutos", emoji: "🎯", example: "Ex.: fica concentrada num brinquedo por alguns minutos." },
          { text: "Social — brinca ao lado de outras crianças com interesse", emoji: "🧒", example: "Ex.: brinca perto de outras crianças e observa o que elas fazem." },
          { text: "Regulação emocional — birras dentro do esperado para 2 anos de idade corrigida", emoji: "😤", example: "Ex.: tem birras próprias da idade, mas se acalma com o tempo." },
          { text: "Alimentação — aceita variada textura e é relativamente independente na colher", emoji: "🥄", example: "Ex.: come alimentos de texturas diferentes e leva a colher à boca." },
          { text: "Sono — dorme de 10 a 14 horas por dia sem disrupções graves", emoji: "😴", example: "Ex.: dorme bem à noite mais a soneca, somando cerca de 10 a 14 horas." },
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
