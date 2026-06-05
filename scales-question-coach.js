/* NeuroPed SDG — Question Coach (copiloto clínico das perguntas)
 * --------------------------------------------------------------
 * Humaniza cada item de escala/teste: emoji contextual, exemplos
 * do dia a dia e uma microexplicação de "o que observar".
 *
 * É um motor de ENRIQUECIMENTO de apresentação — não altera itens,
 * pontuação, faixas nem o conteúdo clínico autoral. Roteia cada
 * pergunta para um "tema" clínico a partir do texto do item e, como
 * apoio, do domínio/keywords da escala. Cobre TODO o catálogo
 * (autorais NPE-BR + qualquer instrumento), sem depender de
 * metadados por item — os exemplos são DINÂMICOS.
 *
 * API global:
 *   window.NeuroPedCoach.forItem({ id, index, itemText, domain, keywords, audience })
 *     -> { emoji, examples:[...], tip:'', theme:'' }
 *   window.NeuroPedCoach.themeOf(itemText, domain, keywords) -> 'atencao' | ...
 *
 * Sem dependências. Seguro para carregar em qualquer página.
 */
(function () {
  'use strict';
  if (window.NeuroPedCoach) return;

  function norm(s) {
    return String(s == null ? '' : s)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /* Cada tema: emoji + exemplos cotidianos (frases curtas, neutras de
     respondente, para servir a pais, escola e ao próprio adolescente)
     + dica de observação. "kw" são gatilhos no TEXTO DO ITEM. */
  var THEMES = {
    risco: {
      emoji: '🛟',
      kw: ['autoles', 'auto les', 'se machucar', 'machucar', 'suicid', 'desaparec', 'morrer', 'morte', 'nao quer viver', 'tirar a vida', 'ferir a si', 'permanecer seguro', 'sumir'],
      examples: [
        'Falar, escrever ou desenhar sobre se machucar ou sumir',
        'Tristeza muito intensa com sensação de desesperança',
        'Comportamentos que colocam a própria segurança em risco',
        'Necessidade de supervisão de um adulto por segurança'
      ],
      tip: 'Diante de QUALQUER sinal de risco, priorize avaliação profissional imediata. Apoio emocional: CVV 188 · Emergência: SAMU 192.'
    },
    substancias: {
      emoji: '🚭',
      kw: ['alcool', 'alcoolic', 'bebida alcool', 'vape', 'nicotina', 'tabaco', 'narguil', 'cigarro', 'maconha', 'fumou', 'fumar', 'substancia psicoativa', 'cigarro eletronic'],
      examples: [
        'Uso de álcool, mesmo em festas ou ocasiões sociais',
        'Uso de cigarro, vape, pod ou narguilé',
        'Situações de risco (ex.: carona com quem bebeu)',
        'Pessoas próximas que incentivam ou facilitam o uso'
      ],
      tip: 'Aborde com acolhimento e sigilo, sem julgamento. Em risco imediato, acione apoio: CVV 188 · SAMU 192.'
    },
    epilepsia: {
      emoji: '⚡',
      kw: ['epilep', 'convuls', 'ausencia tipica', 'olhar parado', 'abalo', 'desmaio', 'paroxis', 'crise convuls', 'crise epilep'],
      examples: [
        'Episódios de "desligar" ou olhar parado por instantes',
        'Abalos, quedas ou perda de consciência',
        'Confusão, sono ou dor de cabeça logo após o evento',
        'Eventos que acontecem durante o sono'
      ],
      tip: 'Anote horário, duração, gatilho e como foi a recuperação. Quando possível e seguro, grave um vídeo do evento.'
    },
    dor: {
      emoji: '🤕',
      kw: ['dor de cabeca', 'cefaleia', 'enxaqueca', 'dor ', ' dor', 'nausea', 'vomito', 'doi'],
      examples: [
        'Dor que faz parar de brincar, estudar ou se divertir',
        'Faltar ou sair mais cedo da escola por causa da dor',
        'Dor junto com náusea, vômito ou incômodo com luz/barulho',
        'Dor que atrapalha o sono ou aparece ao acordar'
      ],
      tip: 'Registre frequência, intensidade, gatilhos e se houve mudança recente no padrão da dor.'
    },
    sono: {
      emoji: '🌙',
      kw: ['sono', 'dorme', 'dormir', 'insonia', 'acorda', 'pesadelo', 'ronco', 'despertar', 'adormec', 'cama'],
      examples: [
        'Demorar muito para pegar no sono',
        'Acordar várias vezes durante a noite',
        'Resistir a dormir na própria cama',
        'Acordar cansado ou de mau humor'
      ],
      tip: 'Repare na hora de adormecer, nos despertares e em como fica o humor e a atenção no dia seguinte.'
    },
    alimentacao: {
      emoji: '🍽️',
      kw: ['aliment', 'comida', 'comer', 'seletiv', 'mastig', 'engasg', 'recusa alimentar', 'refeic', 'textura da comida'],
      examples: [
        'Aceitar alimentos novos ou de texturas diferentes',
        'Comer o que a família come, sem cardápio à parte',
        'Mastigar e engolir sem engasgar',
        'Permanecer à mesa durante a refeição'
      ],
      tip: 'Observe a variedade aceita, as recusas por textura/cheiro e o quanto isso limita as refeições.'
    },
    sensorial: {
      emoji: '✨',
      kw: ['sensor', 'barulho', 'ruido', 'textura', 'toque', 'cheiro', 'luz', 'etiqueta', 'som ', 'estimulo'],
      examples: [
        'Tolerar barulhos comuns (liquidificador, secador, festa)',
        'Usar roupas com etiqueta ou certos tecidos',
        'Sujar as mãos em tinta, areia, cola ou massinha',
        'Ficar em ambientes com luz ou som fortes'
      ],
      tip: 'Note se reage demais (tampa os ouvidos, se irrita, foge) ou se busca estímulo de forma intensa.'
    },
    social: {
      emoji: '👫',
      kw: ['social', 'interac', 'contato visual', 'contato ocular', 'olho no olho', 'amizade', 'amigos', 'brincar com', 'comparti', 'reciproc', 'responde ao nome', 'aponta', 'apontar', 'imita', 'faz de conta', 'simbolic', 'pares', 'colega', 'conviver'],
      examples: [
        'Chamar outra criança para brincar',
        'Mostrar ou apontar algo que achou interessante',
        'Olhar nos olhos durante uma conversa',
        'Responder quando é chamado pelo nome'
      ],
      tip: 'Veja se prefere brincar sozinho, se compartilha interesses e se responde à aproximação dos outros.'
    },
    rigidez: {
      emoji: '🔄',
      kw: ['rigidez', 'rotina', 'mudanca', 'flexib', 'interesse restrito', 'interesses restritos', 'repeti', 'ritual', 'insiste', 'transicao', 'previsivel'],
      examples: [
        'Aceitar uma mudança de planos sem grande crise',
        'Trocar de atividade quando é pedido',
        'Brincar de formas variadas, não só do mesmo jeito',
        'Lidar com um imprevisto na rotina'
      ],
      tip: 'Repare se pequenas mudanças geram sofrimento intenso ou se há insistência sempre no mesmo padrão.'
    },
    linguagem: {
      emoji: '🗣️',
      kw: ['fala', 'falar', 'linguagem', 'palavra', 'comunic', 'vocabul', 'frase', 'pronunc', 'gago', 'ecolalia', 'gesto', 'compreende ordens', 'nomea', 'nomear'],
      examples: [
        'Pedir o que quer usando palavras ou gestos',
        'Juntar palavras para formar frases',
        'Ser entendido por pessoas de fora da família',
        'Contar algo que aconteceu no dia'
      ],
      tip: 'Compare com crianças da mesma idade: vocabulário, clareza e se usa a fala para se comunicar de verdade.'
    },
    atencao: {
      emoji: '🎯',
      kw: ['atencao', 'concentr', 'foco', 'distra', 'desaten', 'perde o fio', 'manter atencao', 'presta atencao', 'desligar', 'desliga'],
      examples: [
        'Escutar uma história ou explicação até o fim',
        'Terminar uma brincadeira ou tarefa começada',
        'Assistir a um desenho sem trocar a toda hora',
        'Fazer a lição sem levantar várias vezes'
      ],
      tip: 'Repare se "desliga", muda de atividade muito rápido ou abandona tarefas no meio.'
    },
    hiperatividade: {
      emoji: '⚡',
      kw: ['impuls', 'hiperativ', 'agitad', 'nao para', 'nao consegue esperar', 'esperar', 'interromp', 'sem pensar', 'inquiet', 'mexe', 'corre demais'],
      examples: [
        'Esperar a vez numa fila ou num jogo',
        'Ficar sentado durante a refeição',
        'Levantar a mão antes de falar',
        'Pensar um pouco antes de agir em algo arriscado'
      ],
      tip: 'Observe se age rápido demais, interrompe os outros ou tem dificuldade de aguardar.'
    },
    executiva: {
      emoji: '🧩',
      kw: ['organiza', 'memoria', 'planeja', 'esquece', 'perde material', 'etapa', 'sequencia', 'inicia', 'comeca', 'termina tarefa', 'lentid', 'fadiga cogn'],
      examples: [
        'Lembrar o que foi combinado ou pedido',
        'Organizar o material e a mochila',
        'Seguir uma sequência de passos',
        'Começar e terminar uma tarefa no tempo'
      ],
      tip: 'Observe esquecimentos, perda de objetos e dificuldade de iniciar ou concluir tarefas.'
    },
    escola: {
      emoji: '📚',
      kw: ['escola', 'aprend', 'leitura', 'ler', ' le ', 'escrev', 'alfabet', 'matemat', 'calcul', 'rendimento', 'dever', 'nota', 'serie', 'caderno', 'copia'],
      examples: [
        'Ler ou reconhecer palavras compatíveis com a série',
        'Escrever frases que dá para entender',
        'Acompanhar contas e problemas da idade',
        'Concluir as atividades da escola'
      ],
      tip: 'Repare se a dificuldade persiste mesmo com explicação individual e apoio extra.'
    },
    motorfino: {
      emoji: '✍️',
      kw: ['motricidade fina', 'motor fino', 'escrita', 'lapis', 'recorte', 'recortar', 'desenho', 'legivel', 'botao', 'abotoar', 'ziper', 'cadarco', 'usar as maos', 'manuseio', 'segurar'],
      examples: [
        'Segurar o lápis e escrever sem cansar rápido',
        'Recortar, colar e desenhar',
        'Abotoar, fechar zíper ou amarrar cadarço',
        'Encaixar peças pequenas'
      ],
      tip: 'Veja se a escrita é lenta ou ilegível por esforço e se evita tarefas manuais.'
    },
    motor: {
      emoji: '🤸',
      kw: ['motor', 'marcha', 'andar', 'equilibr', 'correr', 'pular', 'coordena', 'queda', 'tropeca', 'esbarr', 'bola', 'pedalar', 'nadar'],
      examples: [
        'Correr, pular e subir sem cair demais',
        'Acompanhar os colegas em jogos e brincadeiras',
        'Equilibrar-se (num pé só, numa linha)',
        'Chutar, receber ou lançar uma bola'
      ],
      tip: 'Compare com os colegas: tropeça muito, evita atividade física ou cansa rápido?'
    },
    regulacao: {
      emoji: '😤',
      kw: ['raiva', 'irrita', 'frustr', 'explos', 'birra', 'opos', 'agress', 'descontrol', 'grita', 'bate', 'morde', 'acalm', 'limite', 'teimoso', 'desafi', 'paciencia', 'contrariedade'],
      examples: [
        'Lidar com um "não" sem explodir',
        'Aceitar quando algo não sai como queria',
        'Conseguir se acalmar sozinho depois de ficar bravo',
        'Respeitar um limite combinado'
      ],
      tip: 'Observe a intensidade, quanto tempo leva para se acalmar e se precisa de ajuda para se regular.'
    },
    ansiedade: {
      emoji: '😟',
      kw: ['ansiedade', 'medo', 'preocup', 'panico', 'separac', 'fobia', 'timid', 'inibi', 'nervos', 'evita', 'aflito', 'inseguran', 'confirmacao'],
      examples: [
        'Separar-se dos pais sem sofrimento exagerado',
        'Entrar num lugar novo ou numa festa',
        'Experimentar algo diferente sem travar',
        'Encarar situações comuns sem medo intenso'
      ],
      tip: 'Veja se o medo é maior do que a situação pede e se leva a criança a evitar coisas do dia a dia.'
    },
    humor: {
      emoji: '😔',
      kw: ['triste', 'humor', 'choro', 'chora', 'desanim', 'isola', 'prazer', 'energia', 'vontade', 'apatia', 'desesper', 'desinteress'],
      examples: [
        'Demonstrar alegria nas coisas de que gosta',
        'Ter energia para brincar e participar',
        'Procurar companhia e conviver',
        'Manter o humor estável ao longo do dia'
      ],
      tip: 'Repare em tristeza persistente, perda de interesse, isolamento ou queda de energia.'
    },
    fadiga: {
      emoji: '🔋',
      kw: ['fadiga', 'cansaco', 'cansado', 'energia', 'sonolen', 'esgota', 'exaust', 'disposicao'],
      examples: [
        'Cansar mesmo depois de dormir ou descansar',
        'Parar atividades por falta de energia',
        'Ficar sonolento ou lento durante o dia',
        'Deixar de sair por estar sem disposição'
      ],
      tip: 'Relacione o cansaço ao sono, ao humor, às crises, à dor ou à medicação.'
    },
    autonomia: {
      emoji: '🧦',
      kw: ['autonomia', 'avd', 'higiene', 'banho', 'vestir', 'desfralde', 'fralda', 'sozinho', 'autocuidado', 'adaptativo', 'depende', 'independen'],
      examples: [
        'Vestir-se e calçar-se com pouca ajuda',
        'Comer sozinho de forma organizada',
        'Cuidar da higiene (escovar os dentes, tomar banho)',
        'Guardar os próprios brinquedos e materiais'
      ],
      tip: 'Compare a independência esperada para a idade e quanta ajuda ainda é preciso oferecer.'
    },
    bullying: {
      emoji: '🤝',
      kw: ['bullying', 'exclus', 'apelido', 'provoc', 'humilha', 'rejeic', 'pertenc', 'inclusao', 'deixado de fora', 'zoa'],
      examples: [
        'Ser incluído nas brincadeiras e nos grupos',
        'Ter amigos com quem realmente conta',
        'Não sofrer apelidos, exclusão ou provocações',
        'Participar do recreio sem medo'
      ],
      tip: 'Fique atento a isolamento, exclusão repetida e queda de autoestima.'
    },
    estigma: {
      emoji: '🫂',
      kw: ['estigma', 'vergonha', 'preconceito', 'diferente', 'inferior', 'deficiencia', 'condicao'],
      examples: [
        'Sentir-se diferente ou inferior pela condição',
        'Esconder a condição por vergonha',
        'Ser tratado de forma negativa por causa dela',
        'Evitar atividades por medo do que vão pensar'
      ],
      tip: 'Repare em vergonha, evitação social e impacto na autoconfiança.'
    },
    familia: {
      emoji: '🏡',
      kw: ['familia', 'vinculo', 'suporte', 'sobrecarga', 'cuidador', 'irmaos', 'adesao', 'rede de apoio', 'tensao'],
      examples: [
        'Conversar e se sentir acolhido em casa',
        'Manter momentos bons em família',
        'Cuidadores com apoio para a rotina de cuidados',
        'Conseguir seguir as orientações de tratamento'
      ],
      tip: 'Avalie a tensão familiar, a sobrecarga dos cuidadores e a rede de apoio disponível.'
    },
    qualidade: {
      emoji: '🌤️',
      kw: ['qualidade de vida', 'bem-estar', 'bem estar', 'participac', 'aproveitar', 'capaz'],
      examples: [
        'Aproveitar as atividades de que gosta',
        'Participar de passeios, esportes e grupos',
        'Sentir-se tão capaz quanto os colegas',
        'Ter uma rotina que não seja só de cuidados'
      ],
      tip: 'Observe o impacto global no bem-estar e na participação, além dos sintomas isolados.'
    },
    toc: {
      emoji: '🔁',
      kw: ['obsess', 'compuls', 'ritual', 'verifica', 'conferir', 'lavar as mao', 'lava as mao', 'simetria', 'contamina', 'intrusiv', 'pensamento repeti', 'mania de repetir'],
      examples: [
        'Pensamentos que voltam e incomodam, mesmo sem querer',
        'Repetir ações (lavar, conferir, organizar) para aliviar a aflição',
        'Precisar que as coisas fiquem "certas" ou simétricas',
        'Ficar muito aflito quando é impedido de fazer o ritual'
      ],
      tip: 'Veja quanto tempo isso toma e o quanto atrapalha a rotina — tempo gasto e aflição importam.'
    },
    tiques: {
      emoji: '😬',
      kw: ['tique', 'tics', 'tourette', 'pigarro', 'movimento involuntario', 'piscar repeti', 'estalo', 'careta', 'vocaliza'],
      examples: [
        'Movimentos rápidos e repetidos (piscar, caretas, balançar a cabeça)',
        'Sons repetidos (pigarro, estalos, fungadas)',
        'Pioram com cansaço ou ansiedade e diminuem ao se distrair',
        'Mudam de forma ao longo do tempo'
      ],
      tip: 'Repare se variam com o estado emocional e se atrapalham a escola, o sono ou a convivência.'
    }
  };

  /* Ordem de prioridade na ROTEAGEM (segurança e especificidade primeiro). */
  var ORDER = [
    'risco', 'substancias', 'epilepsia', 'dor', 'sono', 'alimentacao', 'sensorial',
    'toc', 'tiques',
    'social', 'rigidez', 'linguagem', 'atencao', 'hiperatividade',
    'executiva', 'escola', 'motorfino', 'motor', 'regulacao',
    'ansiedade', 'humor', 'fadiga', 'autonomia', 'bullying',
    'estigma', 'familia', 'qualidade'
  ];

  var GENERIC = {
    emoji: '📋',
    examples: [
      'Acontece em casa, na escola e em outros lugares',
      'Atrapalha a rotina, as brincadeiras ou os estudos',
      'Ficou mais forte nas últimas semanas',
      'Melhora com apoio, pausa ou rotina previsível'
    ],
    tip: 'Compare com o esperado para a idade e observe se há impacto real no dia a dia.'
  };

  function hasAny(text, list) {
    for (var k = 0; k < list.length; k++) {
      if (text.indexOf(list[k]) >= 0) return true;
    }
    return false;
  }

  function matchTheme(text) {
    if (!text) return '';
    for (var i = 0; i < ORDER.length; i++) {
      var key = ORDER[i], t = THEMES[key];
      if (hasAny(text, t.kw)) return key;
    }
    return '';
  }

  /* Itens de IMPACTO/funcionalidade global ("interfere na vida", "prejuízo
     importante", "qualidade de vida") falam do efeito no dia a dia, não de um
     sintoma específico — palavras de contexto (escola, casa) não devem
     sequestrar a roteagem. */
  var IMPACT = ['interfer', 'prejuizo', 'prejudic', 'impacto', 'qualidade de vida', 'perceptivelmente', 'desgaste importante', 'reorganiz'];

  /* Roteia: 0) segurança sempre primeiro; 1) impacto global; 2) texto do item
     (específico); 3) domínio + keywords da escala (contexto); 4) genérico. */
  function themeOf(itemText, domain, keywords) {
    var it = norm(itemText);
    if (hasAny(it, THEMES.risco.kw)) return 'risco';
    if (hasAny(it, IMPACT)) return 'qualidade';
    var byItem = matchTheme(it);
    if (byItem) return byItem;
    var ctx = norm([domain || '', (keywords || []).join(' ')].join(' '));
    var byCtx = matchTheme(ctx);
    if (byCtx) return byCtx;
    return '';
  }

  function forItem(ctx) {
    ctx = ctx || {};
    var key = themeOf(ctx.itemText, ctx.domain, ctx.keywords);
    var t = key ? THEMES[key] : GENERIC;
    return {
      theme: key || 'geral',
      emoji: t.emoji,
      examples: t.examples.slice(),
      tip: t.tip
    };
  }

  window.NeuroPedCoach = {
    version: '1.1.0',
    forItem: forItem,
    themeOf: themeOf,
    THEMES: THEMES
  };
})();
