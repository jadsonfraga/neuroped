import type { InteractiveScaleDef } from "./interactiveScaleItems";

export const j26Bloco2Items: Record<string, InteractiveScaleDef> = {
  "j26-066": {
    instruction: "Para cada afirmacao, selecione com que frequencia a crianca apresenta esse comportamento ou sentimento nas ultimas 2 semanas.",
    labels: ["Nunca", "As vezes", "Frequentemente"],
    scoreDirection: "higher_worse",
    totalLabel: "Ansiedade Generalizada",
    bands: [
      { minPct: 65, classification: "Alteracao importante", color: "red", description: "Pontuacao elevada. Requer correlacao clinica e avaliacao especializada." },
      { minPct: 45, classification: "Sinais moderados", color: "orange", description: "Sinais relevantes de ansiedade presentes. Monitorar de perto." },
      { minPct: 25, classification: "Sinais leves", color: "amber", description: "Alguns sinais de preocupacao excessiva presentes." },
      { minPct: 0, classification: "Sem alteracao relevante", color: "emerald", description: "Baixa carga de sintomas ansiosos." },
    ],
    domains: [
      {
        name: "Preocupacao cognitiva",
        color: "text-amber-600 dark:text-amber-400",
        items: [
          "Se preocupa com escola mesmo quando vai bem nas provas",
          "Fica ruminando sobre coisas ruins que podem acontecer",
          "Pergunta repetidamente se vai acontecer algo ruim",
          "Tem dificuldade de parar de pensar em problemas",
          "Preocupa-se com a seguranca dos familiares sem motivo claro",
        ],
      },
      {
        name: "Efeitos fisicos da ansiedade",
        color: "text-orange-600 dark:text-orange-400",
        items: [
          "Queixa-se de dor de barriga antes de eventos importantes",
          "Apresenta dor de cabeca em situacoes de estresse",
          "Tem dificuldade para dormir por causa das preocupacoes",
          "Sente tensao muscular ou fica enrijecido quando ansioso",
          "Apresenta suor excessivo ou tremia em situacoes de ansiedade",
        ],
      },
      {
        name: "Impacto comportamental",
        color: "text-red-600 dark:text-red-400",
        items: [
          "Evita situacoes novas por medo de nao conseguir lidar",
          "Precisa de muita reassurance dos adultos para se tranquilizar",
          "Tem dificuldade de se concentrar quando esta preocupado",
          "Fica irritado ou agitado quando a rotina muda inesperadamente",
        ],
      },
    ],
  },

  "j26-067": {
    instruction: "Avalie com que frequencia a crianca apresenta as seguintes queixas fisicas sem que exame medico tenha encontrado causa organica.",
    labels: ["Nunca", "As vezes", "Frequentemente"],
    scoreDirection: "higher_worse",
    totalLabel: "Ansiedade Somatica Funcional",
    bands: [
      { minPct: 65, classification: "Alteracao importante", color: "red", description: "Alta frequencia de queixas somaticas funcionais. Avaliar encaminhamento." },
      { minPct: 45, classification: "Sinais moderados", color: "orange", description: "Queixas somaticas recorrentes sem causa biologica confirmada." },
      { minPct: 25, classification: "Sinais leves", color: "amber", description: "Queixas somaticas ocasionais possivelmente associadas a estresse." },
      { minPct: 0, classification: "Sem alteracao relevante", color: "emerald", description: "Poucas ou nenhuma queixa somatica funcional." },
    ],
    domains: [
      {
        name: "Queixas gastrointestinais",
        color: "text-amber-600 dark:text-amber-400",
        items: [
          "Dor de barriga antes de ir para a escola",
          "Nausea em situacoes de estresse social",
          "Diarreia ou alteracao intestinal associada a eventos ansiogenos",
          "Recusa alimentar por queixa de estomago cheio ou doendo",
        ],
      },
      {
        name: "Queixas cefalicas e musculoesqueleticas",
        color: "text-orange-600 dark:text-orange-400",
        items: [
          "Dor de cabeca frequente sem causa neurologica",
          "Dores nas pernas ou nos bracos sem lesao identificada",
          "Rigidez no pescoco ou ombros ao acordar",
          "Tontura em momentos de ansiedade",
        ],
      },
      {
        name: "Queixas cardiorrespiratorias",
        color: "text-red-600 dark:text-red-400",
        items: [
          "Falta de ar em repouso ou em situacoes sociais",
          "Palpitacoes relatadas sem causa cardiaca",
          "Sensacao de aperto no peito sem doenca respiratoria",
          "Chiado ou tosse persistente piora com estresse",
        ],
      },
      {
        name: "Queixas sensoriais e autonômicas",
        color: "text-purple-600 dark:text-purple-400",
        items: [
          "Formigamento ou dormencia nas maos/pes sem causa neurologica",
          "Suor excessivo sem relacao com temperatura ou exercicio",
          "Boca seca frequente sem causa medicamentosa",
          "Ruborização facial recorrente em situacoes sociais",
        ],
      },
    ],
  },

  "j26-068": {
    instruction: "Leia cada afirmacao e marque com que frequencia voce se sentiu assim nas ultimas 2 semanas. Responda com honestidade.",
    labels: ["Nunca", "As vezes", "Frequentemente"],
    scoreDirection: "higher_worse",
    totalLabel: "TAG - Adolescente",
    bands: [
      { minPct: 65, classification: "Alteracao importante", color: "red", description: "Nivel elevado de ansiedade generalizada. Avaliacao profissional indicada." },
      { minPct: 45, classification: "Sinais moderados", color: "orange", description: "Preocupacao excessiva frequente com impacto no funcionamento." },
      { minPct: 25, classification: "Sinais leves", color: "amber", description: "Preocupacoes presentes, mas ainda com controle razoavel." },
      { minPct: 0, classification: "Sem alteracao relevante", color: "emerald", description: "Ansiedade dentro do esperado para a faixa etaria." },
    ],
    domains: [
      {
        name: "Preocupacao e ruminacao",
        color: "text-amber-600 dark:text-amber-400",
        items: [
          "Fico preocupado com muitas coisas ao mesmo tempo",
          "Tenho pensamentos repetitivos sobre problemas que podem acontecer",
          "Me preocupo com o futuro mesmo sem ter motivo concreto",
          "Tenho dificuldade de desligar os pensamentos preocupantes",
          "Me preocupo com o que os outros pensam de mim",
        ],
      },
      {
        name: "Sintomas fisicos",
        color: "text-orange-600 dark:text-orange-400",
        items: [
          "Sinto tensao muscular ou dores no corpo sem motivo fisico claro",
          "Tenho dificuldade para dormir por causa das preocupacoes",
          "Fico cansado facilmente sem ter feito esforco fisico",
          "Sinto o coracao acelerar em situacoes de estresse",
          "Tenho dor de cabeca frequente relacionada ao estresse",
        ],
      },
      {
        name: "Impacto no funcionamento",
        color: "text-red-600 dark:text-red-400",
        items: [
          "As preocupacoes atrapalham meu desempenho na escola",
          "Evito situacoes novas por medo de nao conseguir lidar",
          "Tenho dificuldade de me concentrar porque minha mente esta acelerada",
          "Fico irritado ou impaciente por causa da ansiedade",
          "Preciso que alguem me tranquilize com frequencia",
          "As preocupacoes me impedem de aproveitar momentos de lazer",
        ],
      },
    ],
  },

  "j26-069": {
    instruction: "Para cada afirmacao, indique com que frequencia o adolescente apresenta esses sintomas ou comportamentos.",
    labels: ["Nunca", "As vezes", "Frequentemente"],
    scoreDirection: "higher_worse",
    totalLabel: "Panico - Adolescente",
    bands: [
      { minPct: 65, classification: "Alteracao importante", color: "red", description: "Perfil sugestivo de transtorno do panico. Avaliacao especializada urgente." },
      { minPct: 45, classification: "Sinais moderados", color: "orange", description: "Episodios de panico com impacto significativo." },
      { minPct: 25, classification: "Sinais leves", color: "amber", description: "Episodios ocasionais com sintomas autonomicos." },
      { minPct: 0, classification: "Sem alteracao relevante", color: "emerald", description: "Sem indicativos de panico." },
    ],
    domains: [
      {
        name: "Sintomas autonomicos agudos",
        color: "text-red-600 dark:text-red-400",
        items: [
          "Episodios subitos de coracao acelerado ou palpitacoes intensas",
          "Sensacao de falta de ar sem esforco fisico",
          "Suor frio repentino e sem relacao com temperatura",
          "Tremores ou sensacao de fraqueza nas pernas de repente",
          "Tontura ou sensacao de desmaio durante episodios de ansiedade",
        ],
      },
      {
        name: "Sintomas cognitivos do panico",
        color: "text-orange-600 dark:text-orange-400",
        items: [
          "Sensacao de que vai morrer ou de que algo muito grave esta acontecendo",
          "Medo de perder o controle durante os episodios",
          "Sensacao de irrealidade ou de estar fora do proprio corpo",
          "Pensamentos catastroficos sobre os proprios sintomas fisicos",
        ],
      },
      {
        name: "Medo do medo e esquiva",
        color: "text-amber-600 dark:text-amber-400",
        items: [
          "Evita lugares lotados ou fechados com medo de ter um episodio",
          "Recusa sair de casa sem acompanhante por medo de passar mal",
          "Fica monitorando o proprio corpo em busca de sintomas",
          "Evita exercicio fisico por medo de sentir o coracao acelerar",
          "Verifica constantemente se esta bem (pulso, respiracao)",
        ],
      },
    ],
  },

  "j26-070": {
    instruction: "Avalie com que frequencia a crianca apresenta os seguintes comportamentos relacionados a perda de prazer e desinteresse.",
    labels: ["Nunca", "As vezes", "Frequentemente"],
    scoreDirection: "higher_worse",
    totalLabel: "Anedonia Infantil",
    bands: [
      { minPct: 65, classification: "Alteracao importante", color: "red", description: "Perda significativa de prazer. Avaliacao de depressao infantil indicada." },
      { minPct: 45, classification: "Sinais moderados", color: "orange", description: "Reducao notavel do interesse em atividades anteriormente prazerosas." },
      { minPct: 25, classification: "Sinais leves", color: "amber", description: "Alguma reducao de interesse, especialmente em contextos especificos." },
      { minPct: 0, classification: "Sem alteracao relevante", color: "emerald", description: "Engajamento adequado em atividades de lazer e interacao social." },
    ],
    domains: [
      {
        name: "Perda de interesse em atividades",
        color: "text-amber-600 dark:text-amber-400",
        items: [
          "Recusa participar de brincadeiras que antes gostava",
          "Abandona jogos ou passatempos sem terminar",
          "Demonstra indiferenca quando oferecida atividade favorita",
          "Nao se anima com passeios ou surpresas prazerosas",
          "Fica entediado mesmo em situacoes que antes eram divertidas",
        ],
      },
      {
        name: "Reducao do prazer social",
        color: "text-orange-600 dark:text-orange-400",
        items: [
          "Isola-se dos colegas mesmo quando convidado a participar",
          "Nao demonstra alegria ao reencontrar amigos ou familiares queridos",
          "Recusa convites sociais que antes aceitava com entusiasmo",
          "Fica quieto e retraido durante festas ou comemorações",
        ],
      },
      {
        name: "Expressao emocional reduzida",
        color: "text-red-600 dark:text-red-400",
        items: [
          "Raro sorriso espontaneo durante o dia",
          "Nao demonstra entusiasmo ou animacao em voz e postura",
          "Responde com monotonia a situacoes que antes geravam empolgacao",
          "Aparencia de apatia ou vazio emocional observada por familiares",
          "Chora com facilidade mas sem conseguir descrever o motivo",
        ],
      },
    ],
  },

  "j26-071": {
    instruction: "INSTRUCAO PARA O CLINICO: Aplique com sensibilidade. Cada item deve ser explorado em entrevista direta com a crianca (6-12 anos). Marque a frequencia com base na resposta da crianca e na observacao clinica.",
    labels: ["Nunca", "As vezes", "Frequentemente"],
    scoreDirection: "higher_worse",
    totalLabel: "Ideacao Suicida - Crianca 6-12 anos",
    bands: [
      { minPct: 50, classification: "Risco elevado", color: "red", description: "Ideacao suicida presente. Protocolo de seguranca imediato. Nao deixar a crianca sem supervisao." },
      { minPct: 30, classification: "Risco moderado", color: "orange", description: "Pensamentos sobre morte presentes. Avaliacao aprofundada e plano de seguranca necessarios." },
      { minPct: 10, classification: "Risco leve", color: "amber", description: "Presenca de pensamentos passivos sobre morte. Monitoramento proximo indicado." },
      { minPct: 0, classification: "Sem indicativo de risco", color: "emerald", description: "Sem pensamentos sobre morte ou suicidio relatados." },
    ],
    domains: [
      {
        name: "Pensamentos sobre morte",
        color: "text-amber-600 dark:text-amber-400",
        items: [
          "Faz perguntas frequentes sobre o que acontece depois da morte",
          "Diz que preferia nao ter nascido ou que nao quer mais existir",
          "Demonstra fascinio ou preocupacao excessiva com o tema morte",
          "Faz desenhos ou historias recorrentes envolvendo morte",
        ],
      },
      {
        name: "Ideacao passiva",
        color: "text-orange-600 dark:text-orange-400",
        items: [
          "Diz que seria melhor se estivesse morto",
          "Fala que os outros seriam mais felizes sem ela/ele",
          "Expressa desejo de 'dormir e nao acordar'",
          "Diz que vai embora para sempre sem especificar como",
        ],
      },
      {
        name: "Ideacao ativa e planejamento",
        color: "text-red-600 dark:text-red-400",
        items: [
          "Menciona formas especificas de se machucar ou morrer",
          "Ja tentou se machucar intencionalmente alguma vez",
          "Distribui ou esconde objetos de valor como se fosse se despedir",
          "Demonstra calma suspeita apos periodo de agitacao intensa",
        ],
      },
    ],
  },

  "j26-072": {
    instruction: "Registro de hoje: selecione como voce se sentiu em cada area. Use este diario todos os dias para acompanhar seu humor e bem-estar.",
    labels: ["Ruim", "Regular", "Bom"],
    scoreDirection: "higher_better",
    totalLabel: "Bem-estar Diario",
    bands: [
      { minPct: 75, classification: "Dia positivo", color: "emerald", description: "A maioria das areas do dia foi percebida de forma positiva." },
      { minPct: 50, classification: "Dia regular", color: "amber", description: "Dia com altos e baixos. Alguns aspectos precisam de atencao." },
      { minPct: 25, classification: "Dia dificil", color: "orange", description: "Varios aspectos do dia foram negativos. Monitorar continuidade." },
      { minPct: 0, classification: "Dia muito dificil", color: "red", description: "Dia avaliado como muito ruim em multiplas areas. Suporte necessario." },
    ],
    domains: [
      {
        name: "Humor e emocoes",
        color: "text-amber-600 dark:text-amber-400",
        items: [
          "Como foi meu humor geral hoje",
          "Me senti ansioso ou preocupado hoje",
          "Senti alguma alegria ou momento positivo hoje",
        ],
      },
      {
        name: "Sono e energia",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          "Como foi meu sono ontem a noite",
          "Me senti descansado ao acordar",
          "Minha energia ao longo do dia foi boa",
        ],
      },
      {
        name: "Alimentacao e corpo",
        color: "text-green-600 dark:text-green-400",
        items: [
          "Me alimentei bem hoje",
          "Senti dores ou desconfortos fisicos hoje",
        ],
      },
      {
        name: "Social e atividades",
        color: "text-purple-600 dark:text-purple-400",
        items: [
          "Me relacionei bem com outras pessoas hoje",
          "Consegui fazer algo que gosto hoje",
        ],
      },
    ],
  },

  "j26-073": {
    instruction: "Para cada afirmacao, marque com que frequencia o adolescente apresentou esse comportamento ou estado em periodos de 'alta' (euforia/agitacao). Compare com o estado habitual.",
    labels: ["Nunca", "As vezes", "Frequentemente", "Quase sempre"],
    scoreDirection: "higher_worse",
    totalLabel: "Triagem Bipolar",
    bands: [
      { minPct: 60, classification: "Alteracao importante", color: "red", description: "Perfil com multiplos indicadores de oscilacao de humor. Avaliacao psiquiatrica necessaria." },
      { minPct: 40, classification: "Sinais moderados", color: "orange", description: "Oscilacoes de humor significativas presentes. Investigacao aprofundada indicada." },
      { minPct: 20, classification: "Sinais leves", color: "amber", description: "Alguns periodos de alteracao de humor acima do esperado." },
      { minPct: 0, classification: "Sem alteracao relevante", color: "emerald", description: "Sem padroes sugestivos de oscilacao bipolar." },
    ],
    domains: [
      {
        name: "Grandiosidade e autoestima inflada",
        color: "text-amber-600 dark:text-amber-400",
        items: [
          "Acredita ter poderes ou habilidades especiais que nao tem",
          "Faz planos irrealistas e grandiosos sem senso de limite",
          "Age como se fosse superior aos outros sem justificativa",
          "Gasta dinheiro de forma excessiva sem preocupacao com consequencias",
        ],
      },
      {
        name: "Reducao da necessidade de sono",
        color: "text-orange-600 dark:text-orange-400",
        items: [
          "Dorme muito pouco (menos de 4 horas) e acorda cheio de energia",
          "Permanece acordado a noite toda sem se sentir cansado",
          "Recusa dormir mesmo quando claramente exausto",
        ],
      },
      {
        name: "Agitacao e impulsividade",
        color: "text-red-600 dark:text-red-400",
        items: [
          "Fala muito rapido e sem parar por periodos prolongados",
          "Muda de assunto muito rapido, com pensamentos acelerados",
          "Engaja em comportamentos de risco sem avaliar consequencias",
          "Fica extremamente irritavel quando contrariado nesses periodos",
          "Inicia multiplas atividades ao mesmo tempo sem terminar nenhuma",
        ],
      },
      {
        name: "Oscilacao e ciclagem",
        color: "text-purple-600 dark:text-purple-400",
        items: [
          "Alterna entre periodos de muita euforia e tristeza profunda",
          "Tem episodios de choro intenso apos periodos de euforia",
          "A oscilacao de humor e percebida por diferentes pessoas do convivio",
          "Os episodios de alta duraram mais de 4 dias consecutivos",
          "Os episodios ocorrem repetidamente ao longo do ano",
          "Os episodios nao estao associados ao uso de substancias",
        ],
      },
    ],
  },

  "j26-074": {
    instruction: "Para cada afirmacao, indique se isso ocorre tipicamente em certas epocas do ano (outono/inverno) e com que frequencia.",
    labels: ["Nunca", "As vezes", "Frequentemente"],
    scoreDirection: "higher_worse",
    totalLabel: "Depressao Sazonal",
    bands: [
      { minPct: 65, classification: "Alteracao importante", color: "red", description: "Padrao sazonal marcado com impacto significativo. Avaliacao indicada." },
      { minPct: 45, classification: "Sinais moderados", color: "orange", description: "Variacao sazonal do humor com algum impacto no funcionamento." },
      { minPct: 25, classification: "Sinais leves", color: "amber", description: "Leve variacao de humor com estacoes, monitorar evolucao." },
      { minPct: 0, classification: "Sem alteracao relevante", color: "emerald", description: "Sem padrao sazonal de depressao identificado." },
    ],
    domains: [
      {
        name: "Humor e energia sazonal",
        color: "text-amber-600 dark:text-amber-400",
        items: [
          "Fica mais triste ou apagado no outono/inverno",
          "Perde o interesse em atividades sociais no inverno",
          "Sente-se mais cansado e sem energia em epocas de menos sol",
          "Melhora claramente de humor quando o clima esquenta",
          "Outros familiares tambem relatam mudancas de humor sazonais",
        ],
      },
      {
        name: "Sono e apetite sazonais",
        color: "text-orange-600 dark:text-orange-400",
        items: [
          "Dorme muito mais no inverno do que no verao",
          "Come mais (especialmente carboidratos) no outono/inverno",
          "Ganha peso nos meses frios e emagrece nos meses quentes",
          "Acorda com dificuldade nos meses com menos luz solar",
          "Tem dificuldade de se levantar cedo quando esta frio e escuro",
        ],
      },
      {
        name: "Funcionamento sazonal",
        color: "text-red-600 dark:text-red-400",
        items: [
          "Rendimento escolar cai visivelmente no inverno",
          "Isola-se socialmente nos meses mais frios",
          "Tem dificuldade de concentracao nos meses de outono/inverno",
          "Precisou de ajuda profissional em epocas especificas do ano",
        ],
      },
    ],
  },

  "j26-075": {
    instruction: "Avalie a resposta da crianca ao luto/perda nas ultimas semanas. Cada item reflete comportamentos observados em casa ou na escola apos a perda.",
    labels: ["Nunca", "As vezes", "Frequentemente"],
    scoreDirection: "higher_worse",
    totalLabel: "Luto Complicado - Crianca",
    bands: [
      { minPct: 60, classification: "Luto complicado", color: "red", description: "Perfil sugestivo de luto complicado. Suporte psicoterapico especializado urgente." },
      { minPct: 40, classification: "Luto com dificuldades", color: "orange", description: "Processo de luto com dificuldades significativas. Suporte indicado." },
      { minPct: 20, classification: "Luto normal com apoio", color: "amber", description: "Reacao de luto esperada. Acompanhar com suporte familiar." },
      { minPct: 0, classification: "Elaboracao adequada", color: "emerald", description: "Processo de elaboracao do luto dentro do esperado." },
    ],
    domains: [
      {
        name: "Negacao e evitacao",
        color: "text-amber-600 dark:text-amber-400",
        items: [
          "Age como se a pessoa/animal perdido ainda estivesse presente",
          "Recusa falar sobre a perda mesmo quando apropriado",
          "Evita lugares ou objetos que lembram a pessoa perdida",
          "Nega a permanencia da perda quando questionado",
        ],
      },
      {
        name: "Tristeza e saudade intensa",
        color: "text-orange-600 dark:text-orange-400",
        items: [
          "Chora intensamente por longos periodos sem conseguir se acalmar",
          "Busca objetos ou cheiros que lembrem a pessoa perdida de forma compulsiva",
          "Relata sentir falta de forma avassaladora que impede o funcionamento",
          "Expressa nao querer viver sem a pessoa perdida",
          "Fala que quer estar com a pessoa que morreu",
        ],
      },
      {
        name: "Culpa e raiva",
        color: "text-red-600 dark:text-red-400",
        items: [
          "Expressa culpa por nao ter feito algo diferente antes da perda",
          "Apresenta raiva intensa e deslocada (de medicos, de Deus, de familiares)",
          "Culpa a si mesmo pela morte ou perda",
          "Tem comportamentos agressivos ou autolesivos relacionados ao luto",
        ],
      },
      {
        name: "Impacto funcional do luto",
        color: "text-purple-600 dark:text-purple-400",
        items: [
          "Rendimento escolar caiu significativamente apos a perda",
          "Isola-se de amigos e familia por longos periodos",
          "Perdeu o interesse em atividades que antes gostava",
          "Tem pesadelos ou dificuldades de sono persistentes sobre a perda",
          "Apresenta regresso em comportamentos (enurese, chupar dedo)",
        ],
      },
    ],
  },

  "j26-076": {
    instruction: "Para cada afirmacao, indique se isso descreve como a crianca se sente em relacao a si mesma.",
    labels: ["Nao, nunca", "As vezes", "Sim, sempre"],
    scoreDirection: "higher_better",
    totalLabel: "Autoestima Infantil",
    bands: [
      { minPct: 75, classification: "Autoestima positiva", color: "emerald", description: "Autoestima global positiva em multiplas areas." },
      { minPct: 50, classification: "Autoestima moderada", color: "amber", description: "Autoestima razoavel com algumas areas de vulnerabilidade." },
      { minPct: 30, classification: "Baixa autoestima", color: "orange", description: "Autoestima baixa em diversas areas. Intervencao indicada." },
      { minPct: 0, classification: "Autoestima muito baixa", color: "red", description: "Autoestima muito baixa com impacto global. Avaliacao e suporte necessarios." },
    ],
    domains: [
      {
        name: "Autoestima global",
        color: "text-emerald-600 dark:text-emerald-400",
        items: [
          "Gosta de ser quem e",
          "Sente que e uma boa pessoa",
          "Esta satisfeito(a) consigo mesmo(a) na maior parte do tempo",
          "Acredita que tem qualidades importantes",
        ],
      },
      {
        name: "Autoestima escolar",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          "Acha que consegue aprender as coisas na escola",
          "Sente que e bom/boa em pelo menos uma materia",
          "Nao desiste facilmente quando uma tarefa e dificil",
          "Acredita que os professores gostam de telo/la na sala",
        ],
      },
      {
        name: "Autoestima social",
        color: "text-purple-600 dark:text-purple-400",
        items: [
          "Acha que tem amigos de verdade",
          "Sente que os colegas gostam de sua companhia",
          "Se sente confortavel em grupos de criancas",
          "Consegue fazer novos amigos sem muita dificuldade",
        ],
      },
      {
        name: "Autoestima fisica",
        color: "text-amber-600 dark:text-amber-400",
        items: [
          "Gosta do proprio corpo",
          "Sente que e bom/boa em atividades fisicas ou esportes",
          "Nao se envergonha da propria aparencia",
          "Sente que pode fazer coisas fisicas que quer fazer",
        ],
      },
    ],
  },

  "j26-077": {
    instruction: "Para cada afirmacao, marque com que frequencia a crianca demonstra esse pensamento ou comportamento pesimista.",
    labels: ["Nunca", "As vezes", "Frequentemente", "Quase sempre"],
    scoreDirection: "higher_worse",
    totalLabel: "Desesperanca Infantil",
    bands: [
      { minPct: 60, classification: "Desesperanca importante", color: "red", description: "Nivel elevado de desesperanca. Risco de depressao e ideacao suicida. Avaliacao urgente." },
      { minPct: 40, classification: "Desesperanca moderada", color: "orange", description: "Visao de futuro negativa com impacto no funcionamento. Intervencao indicada." },
      { minPct: 20, classification: "Desesperanca leve", color: "amber", description: "Tendencia ao pessimismo presente. Monitorar." },
      { minPct: 0, classification: "Sem desesperanca relevante", color: "emerald", description: "Visao de futuro adequada e esperancosa." },
    ],
    domains: [
      {
        name: "Visao negativa do futuro",
        color: "text-amber-600 dark:text-amber-400",
        items: [
          "Acredita que as coisas nunca vao melhorar para ela/ele",
          "Diz que nao adianta tentar porque vai dar errado mesmo",
          "Nao consegue imaginar nada de bom no futuro",
          "Acredita que outras criancas tem mais sorte e que ela/ele nunca tera",
          "Diz que quando crescer nao vai ter nada de bom",
        ],
      },
      {
        name: "Desesperanca interpessoal",
        color: "text-orange-600 dark:text-orange-400",
        items: [
          "Acredita que ninguem gosta realmente dela/dele",
          "Pensa que vai ficar sozinho/a para sempre",
          "Nao acredita que pode fazer amigos de verdade",
          "Diz que os adultos nao conseguem ajuda-la/lo",
        ],
      },
      {
        name: "Abandono de esforco",
        color: "text-red-600 dark:text-red-400",
        items: [
          "Desiste de atividades antes mesmo de tentar",
          "Nao vê sentido em se esforcarpois acredita que falha de qualquer jeito",
          "Recusa metas ou projetos dizendo que nao vai funcionar",
          "Apresenta passividade extrema diante de problemas resoluveis",
          "Nao reage a elogios ou conquistas positivas",
        ],
      },
    ],
  },

  "j26-078": {
    instruction: "Avalie os seguintes sintomas em criancas ou adolescentes que apresentaram depressao ou piora do humor apos o periodo de pandemia de COVID-19.",
    labels: ["Nunca", "As vezes", "Frequentemente"],
    scoreDirection: "higher_worse",
    totalLabel: "Depressao Pos-COVID",
    bands: [
      { minPct: 65, classification: "Alteracao importante", color: "red", description: "Sintomas depressivos significativos pos-pandemia. Avaliacao clinica indicada." },
      { minPct: 45, classification: "Sinais moderados", color: "orange", description: "Sintomas relevantes com impacto no funcionamento pos-pandemia." },
      { minPct: 25, classification: "Sinais leves", color: "amber", description: "Alguns sintomas depressivos associados ao contexto pandemia." },
      { minPct: 0, classification: "Sem alteracao relevante", color: "emerald", description: "Sem indicativos de depressao pos-pandemia." },
    ],
    domains: [
      {
        name: "Humor e anedonia",
        color: "text-amber-600 dark:text-amber-400",
        items: [
          "Tristeza ou vazio persistente desde o retorno ao convivio social",
          "Perdeu o interesse em atividades que antes eram prazerosas",
          "Dificuldade de sentir alegria mesmo em situacoes positivas",
          "Chora com facilidade e sem motivo aparente",
        ],
      },
      {
        name: "Dificuldades de reinsercao social",
        color: "text-orange-600 dark:text-orange-400",
        items: [
          "Ansiedade intensa ao retornar ao ambiente escolar",
          "Dificuldade de reconectar com amigos de antes da pandemia",
          "Sensacao de estranhamento em situacoes sociais que antes eram confortaveis",
          "Prefere ficar em casa a sair com colegas ou familiares",
          "Sente que 'nao sabe mais como se comportar' com outras pessoas",
        ],
      },
      {
        name: "Luto e perdas pandemia",
        color: "text-red-600 dark:text-red-400",
        items: [
          "Sofreu perda de familiar ou pessoa proxima por COVID",
          "Expressa tristeza relacionada a experiencias que perdeu durante a pandemia",
          "Sente raiva ou injustica em relacao ao periodo da pandemia",
          "Dificuldade de aceitar que o periodo de isolamento ja passou",
        ],
      },
      {
        name: "Sintomas fisicos e cognitivos",
        color: "text-purple-600 dark:text-purple-400",
        items: [
          "Fadiga ou cansaco persistente sem causa medica",
          "Dificuldade de concentracao e memoria comparado ao periodo pre-pandemia",
          "Dores de cabeca ou corpo frequentes sem explicacao organica",
        ],
      },
    ],
  },

  "j26-079": {
    instruction: "Para cada item, indique com que frequencia a crianca ou adolescente apresenta esse sintoma fisico associado ao estado de humor deprimido.",
    labels: ["Nunca", "As vezes", "Frequentemente"],
    scoreDirection: "higher_worse",
    totalLabel: "Sintomas Fisicos da Depressao",
    bands: [
      { minPct: 65, classification: "Alteracao importante", color: "red", description: "Alta carga de sintomas somaticos depressivos. Avaliacao medica e psicologica indicada." },
      { minPct: 45, classification: "Sinais moderados", color: "orange", description: "Sintomas fisicos da depressao presentes com impacto relevante." },
      { minPct: 25, classification: "Sinais leves", color: "amber", description: "Alguns sintomas fisicos possivelmente relacionados a depressao." },
      { minPct: 0, classification: "Sem alteracao relevante", color: "emerald", description: "Poucos ou nenhum sintoma somatico depressivo." },
    ],
    domains: [
      {
        name: "Energia e psicomotricidade",
        color: "text-amber-600 dark:text-amber-400",
        items: [
          "Cansaco extremo mesmo apos noite de sono",
          "Movimentos mais lentos ou fala mais lenta que o habitual",
          "Dificuldade de iniciar qualquer atividade por falta de energia",
          "Fica deitado ou sentado por horas sem fazer nada",
          "Nao tem disposicao para atividades fisicas que antes gostava",
        ],
      },
      {
        name: "Sono e apetite",
        color: "text-orange-600 dark:text-orange-400",
        items: [
          "Alteracao significativa do sono (insonia ou hipersonia)",
          "Perda de apetite com reducao do consumo alimentar",
          "Come em excesso especialmente alimentos doces ou gordurosos",
          "Acorda muito cedo sem conseguir voltar a dormir",
        ],
      },
      {
        name: "Dores e queixas somaticas",
        color: "text-red-600 dark:text-red-400",
        items: [
          "Dor de cabeca frequente sem causa neurologica",
          "Dores difusas no corpo que pioram no periodo de mais tristeza",
          "Dor abdominal recorrente sem causa gastrointestinal",
          "Sensacao de peso no peito ou garganta apertada",
          "Tontura ou sensacao de fraqueza sem causa clinica",
        ],
      },
    ],
  },

  "j26-080": {
    instruction: "Avalie com que frequencia o adolescente apresenta os seguintes comportamentos, que podem mascarar um quadro depressivo subjacente.",
    labels: ["Nunca", "As vezes", "Frequentemente"],
    scoreDirection: "higher_worse",
    totalLabel: "Depressao Mascarada - Adolescente",
    bands: [
      { minPct: 65, classification: "Alteracao importante", color: "red", description: "Perfil sugestivo de depressao mascarada. Avaliacao clinica aprofundada necessaria." },
      { minPct: 45, classification: "Sinais moderados", color: "orange", description: "Sinais relevantes de depressao expressa como irritabilidade ou comportamento." },
      { minPct: 25, classification: "Sinais leves", color: "amber", description: "Alguns indicadores de depressao mascarada. Monitorar." },
      { minPct: 0, classification: "Sem alteracao relevante", color: "emerald", description: "Sem indicativos de depressao mascarada." },
    ],
    domains: [
      {
        name: "Irritabilidade e raiva",
        color: "text-red-600 dark:text-red-400",
        items: [
          "Explosoes de raiva desproporcional a situacao",
          "Irritabilidade persistente na maior parte dos dias",
          "Reage com agressividade verbal a contrariades minimas",
          "Oscila entre raiva intensa e apatia em curto espaco de tempo",
          "A irritabilidade piorou em comparacao com o periodo anterior",
        ],
      },
      {
        name: "Comportamentos externalizantes",
        color: "text-orange-600 dark:text-orange-400",
        items: [
          "Uso de alcool ou substancias que pode estar mascarando sofrimento",
          "Comportamentos de risco (dirigir perigosamente, brigas) sem motivo claro",
          "Uso excessivo de telas como fuga emocional",
          "Fugas de casa ou ausencias escolares sem justificativa clara",
        ],
      },
      {
        name: "Sinais depressivos dissimulados",
        color: "text-amber-600 dark:text-amber-400",
        items: [
          "Ri e brinca em grupo mas parece vazio quando esta sozinho",
          "Faz humor sobre morte ou suicidio de forma recorrente",
          "Nega tristeza mas apresenta sinais fisicos de depressao",
          "Nao pede ajuda e minimiza o proprio sofrimento quando questionado",
          "Aparenta estar bem para os pais mas colegas relatam que esta triste",
          "Autocritica severa e frequente disfarada de brincadeira",
          "Uso de autopunição (privar-se de coisas, nao comer) como padrao recorrente",
        ],
      },
    ],
  },

  "j26-081": {
    instruction: "Para cada area de funcionamento, avalie o impacto da depressao na vida da crianca ou adolescente nas ultimas 2 semanas.",
    labels: ["Nunca", "As vezes", "Frequentemente"],
    scoreDirection: "higher_worse",
    totalLabel: "Impacto Funcional da Depressao",
    bands: [
      { minPct: 65, classification: "Impacto grave", color: "red", description: "Impacto funcional grave em multiplas areas. Intervencao prioritaria." },
      { minPct: 45, classification: "Impacto moderado", color: "orange", description: "Impacto significativo em escola, familia ou amizades." },
      { minPct: 25, classification: "Impacto leve", color: "amber", description: "Algum impacto funcional presente. Acompanhar." },
      { minPct: 0, classification: "Sem impacto relevante", color: "emerald", description: "Funcionamento preservado apesar dos sintomas depressivos." },
    ],
    domains: [
      {
        name: "Impacto escolar",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          "Rendimento escolar caiu visivelmente",
          "Falta de concentracao prejudica o aprendizado",
          "Nao entrega tarefas ou trabalhos escolares",
          "Falta as aulas com frequencia sem justificativa medica",
          "Perdeu o interesse em materias que antes gostava",
        ],
      },
      {
        name: "Impacto nas amizades",
        color: "text-purple-600 dark:text-purple-400",
        items: [
          "Afastou-se dos amigos sem explicacao",
          "Nao responde mensagens ou convites sociais",
          "Os amigos relatam que ela/ele mudou muito",
          "Conflitos frequentes com colegas sem motivo claro",
        ],
      },
      {
        name: "Impacto familiar",
        color: "text-orange-600 dark:text-orange-400",
        items: [
          "Conflitos frequentes com pais ou irmaos",
          "Isola-se no quarto por horas sem interagir com a familia",
          "Abandono de responsabilidades domesticas ou rotinas familiares",
          "Pais relatam dificuldade de comunicacao com o filho/a",
          "Recusa participar de atividades familiares antes apreciadas",
        ],
      },
    ],
  },

  "j26-082": {
    instruction: "OBSERVACAO CLINICA: Para cada habilidade de linguagem pragmatica, observe o desempenho da crianca em situacao escolar real ou semi-estruturada. Registre o nivel de competencia observado.",
    labels: ["Nao apresenta", "Emergente/parcial", "Presente/funcional"],
    scoreDirection: "higher_better",
    totalLabel: "Linguagem Pragmatica Escolar",
    bands: [
      { minPct: 80, classification: "Desempenho adequado", color: "emerald", description: "Habilidades pragmaticas escolares dentro do esperado para a faixa etaria." },
      { minPct: 60, classification: "Desempenho parcial", color: "amber", description: "Habilidades parcialmente presentes. Suporte pontual indicado." },
      { minPct: 40, classification: "Atraso possivel", color: "orange", description: "Dificuldades pragmaticas em multiplas areas. Avaliacao fonoaudiologica recomendada." },
      { minPct: 0, classification: "Atraso importante", color: "red", description: "Dificuldades pragmaticas graves com impacto no funcionamento escolar." },
    ],
    domains: [
      {
        name: "Iniciacao e manutencao conversacional",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          "Inicia conversas com colegas de forma espontanea e adequada",
          "Mantem topico conversacional por pelo menos 3 turnos",
          "Sabe quando e como mudar de assunto de forma natural",
          "Faz perguntas relevantes para manter o dialogo",
          "Repara mal-entendidos conversacionais quando identificados",
        ],
      },
      {
        name: "Adequacao ao contexto",
        color: "text-purple-600 dark:text-purple-400",
        items: [
          "Ajusta o tom e vocabulario ao falar com professores vs colegas",
          "Respeita regras conversacionais (aguardar a vez, nao interromper)",
          "Interpreta ironias e expressoes figuradas em contexto escolar",
          "Adapta a linguagem ao nivel de conhecimento do interlocutor",
          "Usa linguagem adequada em apresentacoes ou exposicoes orais",
        ],
      },
      {
        name: "Linguagem nao verbal e prosodia",
        color: "text-amber-600 dark:text-amber-400",
        items: [
          "Usa contato visual adequado durante interacoes comunicativas",
          "Gestos e expressao facial sao coerentes com o conteudo verbal",
          "Volume e velocidade da fala sao adequados ao contexto",
          "Interpreta expressoes faciais e gestos dos interlocutores",
        ],
      },
      {
        name: "Narrativa e discurso escolar",
        color: "text-green-600 dark:text-green-400",
        items: [
          "Organiza relatos e historias com inicio, meio e fim",
          "Fornece informacoes de contexto suficientes para o interlocutor",
          "Consegue resumir informacoes aprendidas de forma coerente",
          "Responde a perguntas abertas com elaboracao adequada",
          "Pede esclarecimentos quando nao entende algo",
          "Usa linguagem para resolver conflitos verbalmente",
        ],
      },
    ],
  },

  "j26-083": {
    instruction: "OBSERVACAO CLINICA: Avalie cada aspecto da narrativa oral da crianca durante amostra de linguagem eliciada (historia com figuras, recontagem, narrativa pessoal). Registre o nivel de desempenho observado.",
    labels: ["Nao apresenta", "Emergente/parcial", "Presente/funcional"],
    scoreDirection: "higher_better",
    totalLabel: "Narrativa Oral Infantil",
    bands: [
      { minPct: 80, classification: "Desempenho adequado", color: "emerald", description: "Estrutura narrativa oral adequada para a faixa etaria." },
      { minPct: 60, classification: "Desempenho parcial", color: "amber", description: "Narrativa parcialmente organizada. Suporte em producao textual oral indicado." },
      { minPct: 40, classification: "Atraso possivel", color: "orange", description: "Dificuldades na organizacao narrativa. Avaliacao fonoaudiologica recomendada." },
      { minPct: 0, classification: "Atraso importante", color: "red", description: "Organizacao narrativa gravemente comprometida." },
    ],
    domains: [
      {
        name: "Estrutura macronarrativa",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          "Inicia a historia com apresentacao de contexto (onde, quando, quem)",
          "Apresenta evento deflagrador ou problema central da historia",
          "Descreve tentativa de resolucao do problema",
          "Conclui a historia com resolucao ou desfecho",
          "A historia tem progressao logica e temporal clara",
        ],
      },
      {
        name: "Conteudo e coerencia",
        color: "text-purple-600 dark:text-purple-400",
        items: [
          "Inclui referencias a estados mentais e emocoes dos personagens",
          "Estabelece relacoes causais entre os eventos narrados",
          "Mantem coerencia tematica ao longo da narrativa",
          "Usa vocabulario adequado para descrever acoes e estados",
          "Fornece informacoes suficientes para o interlocutor compreender",
        ],
      },
      {
        name: "Coesao e recursos linguisticos",
        color: "text-amber-600 dark:text-amber-400",
        items: [
          "Usa pronomes e referencias anafóricas de forma adequada",
          "Usa conectivos temporais (depois, entao, antes)",
          "Usa conectivos causais (porque, por isso, entao)",
          "Usa marcadores de discurso para organizar a narrativa",
          "Evita ambiguidades de referencia (claro sobre quem/o que)",
          "Usa linguagem avaliativa para marcar pontos importantes",
        ],
      },
    ],
  },

  "j26-084": {
    instruction: "AVALIACAO CLINICA: Aplique cada tarefa de consciencia fonologica diretamente com a crianca. Registre o nivel de desempenho observado em cada habilidade.",
    labels: ["Nao apresenta", "Emergente/parcial", "Presente/funcional"],
    scoreDirection: "higher_better",
    totalLabel: "Consciencia Fonologica Expandida",
    bands: [
      { minPct: 80, classification: "Desempenho adequado", color: "emerald", description: "Habilidades de consciencia fonologica adequadas para a faixa etaria." },
      { minPct: 60, classification: "Desempenho parcial", color: "amber", description: "Habilidades parcialmente adquiridas. Intervencao focada indicada." },
      { minPct: 40, classification: "Atraso possivel", color: "orange", description: "Dificuldades significativas em consciencia fonologica. Avaliacao e intervencao indicadas." },
      { minPct: 0, classification: "Atraso importante", color: "red", description: "Habilidades fonologicas gravemente comprometidas. Intervencao urgente." },
    ],
    domains: [
      {
        name: "Nivel silabico",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          "Segmentacao silabica: bate palmas para cada silaba da palavra",
          "Contagem de silabas: identifica quantas silabas tem a palavra",
          "Identificacao de silaba inicial: qual palavra comeca com 'ca'",
          "Identificacao de silaba final: qual palavra termina com 'ta'",
          "Inversao silabica: fala a palavra ao contrario silaba por silaba",
          "Exclusao silabica: fala a palavra sem a primeira/ultima silaba",
        ],
      },
      {
        name: "Nivel de rima e aliteracao",
        color: "text-purple-600 dark:text-purple-400",
        items: [
          "Identificacao de rima: qual palavra rima com 'pato'",
          "Producao de rima: fala uma palavra que rime com 'bola'",
          "Identificacao de aliteracao: quais palavras comecam com o mesmo som",
          "Categorização por som inicial: agrupa palavras por som inicial igual",
          "Deteccao de palavra intrusa: qual nao rima com as demais",
          "Julgamento de rima: 'cama e fama rimam?' (sim/nao)",
        ],
      },
      {
        name: "Nivel fonemico",
        color: "text-amber-600 dark:text-amber-400",
        items: [
          "Contagem de fonemas: quantos sons tem a palavra 'sol'",
          "Identificacao de fonema inicial: qual o primeiro som de 'faca'",
          "Identificacao de fonema final: qual o ultimo som de 'mar'",
          "Segmentacao fonemica: fala cada som separadamente ('b-o-l-a')",
          "Exclusao fonemica: fala 'pato' sem o /p/",
          "Substituicao fonemica: troca o /b/ de 'bola' por /m/'",
        ],
      },
      {
        name: "Nivel de segmentacao avancada",
        color: "text-green-600 dark:text-green-400",
        items: [
          "Sintese fonemica: junta os sons /m/ /e/ /s/ e fala a palavra",
          "Transposicao fonemica: inverte os fonemas de palavras curtas",
          "Deteccao de fonema medial: qual o som do meio de 'mel'",
          "Manipulacao de onset e rima: separa o onset da rima",
          "Segmentacao de encontros consonantais: 'bra' tem quantos sons",
          "Analogia fonemica: se 'bata' fica 'pata', o que fica de 'bola'",
        ],
      },
    ],
  },

  "j26-085": {
    instruction: "AVALIACAO CLINICA: Avalie o conhecimento vocabular em profundidade da crianca por meio de tarefas diretas de sinonimos, antonimos e organizacao semantica. Registre o nivel de desempenho em cada habilidade.",
    labels: ["Nao apresenta", "Emergente/parcial", "Presente/funcional"],
    scoreDirection: "higher_better",
    totalLabel: "Vocabulario em Profundidade",
    bands: [
      { minPct: 80, classification: "Desempenho adequado", color: "emerald", description: "Vocabulario em profundidade adequado para a faixa etaria." },
      { minPct: 60, classification: "Desempenho parcial", color: "amber", description: "Conhecimento vocabular parcial. Estimulacao semantica indicada." },
      { minPct: 40, classification: "Atraso possivel", color: "orange", description: "Dificuldades no processamento semantico aprofundado. Avaliacao indicada." },
      { minPct: 0, classification: "Atraso importante", color: "red", description: "Vocabulario em profundidade gravemente limitado. Intervencao necessaria." },
    ],
    domains: [
      {
        name: "Sinonimos",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          "Fornece sinonimo adequado para palavras de uso comum (feliz/contente)",
          "Fornece sinonimo para palavras de uso menos frequente (rapido/veloz)",
          "Diferencia sinonimos parciais pelo contexto de uso",
          "Seleciona o sinonimo mais apropriado entre opcoes em contexto de frase",
          "Explica a diferenca de nuance entre dois sinonimos",
        ],
      },
      {
        name: "Antonimos",
        color: "text-purple-600 dark:text-purple-400",
        items: [
          "Fornece antonimo de adjetivos comuns (grande/pequeno, quente/frio)",
          "Fornece antonimo de verbos (entrar/sair, ligar/desligar)",
          "Fornece antonimo de adjetivos abstratos (corajoso/covarde)",
          "Reconhece pares de antonimos em frases com contexto",
          "Identifica que nem toda palavra tem antonimo direto",
        ],
      },
      {
        name: "Campos semanticos e categorizacao",
        color: "text-amber-600 dark:text-amber-400",
        items: [
          "Agrupa palavras por campo semantico (animais, frutas, veiculos)",
          "Identifica a palavra que nao pertence ao grupo semantico",
          "Nomeia membros de uma categoria semantica de forma fluente",
          "Identifica a categoria superordinada de um conjunto de palavras",
          "Distingue categorias basicas de subordinadas (animal > cachorro > labrador)",
        ],
      },
      {
        name: "Relacoes semanticas complexas",
        color: "text-green-600 dark:text-green-400",
        items: [
          "Explica o significado de uma palavra desconhecida por contexto",
          "Identifica relacao parte-todo (roda e carro, asa e passaro)",
          "Usa palavras polissemicas adequadamente em diferentes contextos",
          "Interpreta metaforas simples e expressoes idiomaticas",
          "Define palavras abstratas usando parafrase ou exemplos",
        ],
      },
    ],
  },
};
