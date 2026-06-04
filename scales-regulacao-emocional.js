/* NeuroPed EDJ — Regulação Emocional NeuroPed (REN) · AUTORAL.
 * --------------------------------------------------------------------------
 * Triagem da regulação emocional e comportamental por faixa etária (0–2, 3–5,
 * 6–8, 9–11, 12–17), varrendo 7 eixos: explosões/crises (birras/meltdowns),
 * tolerância à frustração e flexibilidade, oposição e desafio, agressividade/
 * impulsividade/segurança, autorregulação e recuperação, humor/irritabilidade
 * de base, e impacto/contexto. Foco em COMO a criança regula e se recupera das
 * emoções — complementa (não repete) as triagens de humor/ansiedade NPE-BR.
 * Itens autorais do Dr. Jadson Fraga; direção única (maior frequência = mais
 * atenção). Renderiza em escala.html (via `domains`) e no autoral.
 */
(function () {
  'use strict';
  if (window.NEUROPED_REG_EMOCIONAL_LOADED) return;
  window.NEUROPED_REG_EMOCIONAL_LOADED = true;

  var DISC = 'Triagem autoral NeuroPed EDJ da regulação emocional (itens próprios, por faixa etária). NÃO é normatizada nem diagnóstica. Birras e dificuldade de regular emoções fazem parte do desenvolvimento (sobretudo entre 1 e 4 anos) — interprete pela intensidade, frequência, duração e impacto, conforme a idade. Os valores são pontos de atenção operacional, não pontos de corte. Agressão que machuca, crises que colocam em risco ou ideias de se machucar exigem avaliação e cuidado imediatos (SAMU 192 · CVV 188).';

  var O = ['Nunca ou quase nunca', 'Às vezes', 'Frequentemente', 'Quase sempre / quase todos os dias'];
  function opts(arr) { return arr.map(function (l, i) { return { label: l, value: i }; }); }

  // 7 eixos (ordem fixa; 3 itens cada → 21). idx de subs/traps seguem esta ordem.
  var SYS = [
    'Explosões e crises',
    'Tolerância à frustração e flexibilidade',
    'Oposição e desafio',
    'Agressividade, impulsividade e segurança',
    'Autorregulação e recuperação',
    'Humor e irritabilidade de base',
    'Impacto e contexto'
  ];

  var BANDS = [
    {
      id: 'ren-emoc-0-2', code: 'REN-B1', sigla: '0–2 anos', band: '0–2 anos', min: 0, max: 35,
      items: [
        // Explosões e crises
        'Tem crises de choro ou birra intensas e frequentes para a idade?',
        'As crises duram muito tempo (difíceis de encerrar)?',
        'As crises parecem desproporcionais ao motivo?',
        // Tolerância à frustração
        'Fica muito frustrado(a) e descontrolado(a) quando contrariado(a) ou ao ouvir "não"?',
        'Tem muita dificuldade com mudanças de atividade ou transições?',
        'É muito rígido(a) quanto a rotinas (qualquer mudança gera crise)?',
        // Oposição
        'Reage com muita resistência a limites simples?',
        'Enfrenta e "testa" de forma intensa e constante para a idade?',
        'É muito difícil de redirecionar quando quer algo?',
        // Agressividade e segurança
        'Bate, morde, puxa cabelo ou arremessa objetos quando se desregula?',
        'Machuca a si mesmo(a) nas crises (bate a cabeça, se belisca)?',
        'Coloca-se em risco durante as crises (se joga, foge)?',
        // Autorregulação e recuperação
        'Tem muita dificuldade para se acalmar sozinho(a)?',
        'Demora muito para se recuperar depois de uma crise?',
        'Depende totalmente do adulto para se regular (sem estratégias próprias)?',
        // Humor e irritabilidade
        'Está irritadiço(a) ou "de pavio curto" na maior parte do tempo?',
        'Tem mudanças bruscas de humor frequentes?',
        'É difícil de agradar ou consolar mesmo fora das crises?',
        // Impacto
        'A desregulação gera muito estresse e exaustão na família?',
        'Atrapalha rotinas (sair, comer, dormir, creche)?',
        'Você sente que é muito além do esperado para a idade?'
      ]
    },
    {
      id: 'ren-emoc-3-5', code: 'REN-B2', sigla: '3–5 anos', band: '3–5 anos', min: 36, max: 71,
      items: [
        'Tem birras ou explosões intensas e frequentes para a idade?',
        'As crises duram muito (mais de 15–20 min) ou são difíceis de encerrar?',
        'As crises são desproporcionais ao gatilho?',
        'Tem baixa tolerância à frustração (descontrola ao perder, errar ou ouvir não)?',
        'Tem muita dificuldade com transições e mudanças de planos?',
        'É rígido(a) com rotinas e regras próprias (mudar gera crise)?',
        'Desafia, discute e recusa cumprir combinados com frequência?',
        'Faz coisas "de propósito" para provocar ou irritar?',
        'É muito difícil de redirecionar quando está contrariado(a)?',
        'Bate, chuta, morde, cospe ou arremessa coisas nas crises?',
        'Machuca a si mesmo(a) ou diz que quer se machucar quando desregulado(a)?',
        'Quebra coisas ou se coloca em risco durante as crises?',
        'Tem muita dificuldade para se acalmar sozinho(a)?',
        'Demora muito para voltar ao normal após uma crise?',
        'Não consegue usar estratégias para se acalmar (respirar, pedir ajuda, pausa)?',
        'Fica irritado(a) ou emburrado(a) na maior parte dos dias?',
        'Tem mudanças de humor bruscas e frequentes?',
        'Irrita-se com facilidade por pequenas coisas?',
        'A desregulação prejudica a convivência em casa?',
        'Gera problemas na escola ou com outras crianças?',
        'Limita passeios, atividades e a vida da família?'
      ]
    },
    {
      id: 'ren-emoc-6-8', code: 'REN-B3', sigla: '6–8 anos', band: '6–8 anos', min: 72, max: 107,
      items: [
        'Tem explosões de raiva intensas e frequentes para a idade?',
        'As crises duram muito ou são difíceis de interromper?',
        'As reações são desproporcionais às situações?',
        'Tem baixa tolerância à frustração (desiste ou explode ao errar ou perder)?',
        'Tem dificuldade com mudanças, imprevistos e transições?',
        'É rígido(a) ou inflexível quando as coisas não saem como espera?',
        'Discute, desafia a autoridade e recusa regras com frequência?',
        'Culpa os outros e faz coisas para provocar ou irritar de propósito?',
        'Guarda rancor ou fica "implicante" com frequência?',
        'Agride (bate, empurra, chuta) ou ameaça quando se desregula?',
        'Machuca a si mesmo(a) ou fala em se machucar nas crises?',
        'Quebra objetos ou se coloca em risco durante as crises?',
        'Tem muita dificuldade de se acalmar quando se altera?',
        'Demora muito para se recuperar emocionalmente?',
        'Não usa estratégias de autorregulação (respirar, pausa, pedir ajuda)?',
        'Está irritável ou de mau humor na maioria dos dias?',
        'Tem oscilações de humor frequentes?',
        'Aborrece-se com muita facilidade?',
        'A desregulação prejudica a vida em casa?',
        'Atrapalha a escola e a relação com colegas?',
        'Limita atividades e a rotina da família?'
      ]
    },
    {
      id: 'ren-emoc-9-11', code: 'REN-B4', sigla: '9–11 anos', band: '9–11 anos', min: 108, max: 143,
      items: [
        'Tem explosões de raiva intensas e frequentes, desproporcionais à idade?',
        'As crises são longas ou difíceis de encerrar?',
        'Vai "do zero ao cem" rapidamente (pavio curto)?',
        'Tem baixa tolerância à frustração (desiste ou explode diante de obstáculos)?',
        'Tem dificuldade de lidar com mudanças e imprevistos?',
        'É rígido(a) ou inflexível, insistindo que tem de ser do seu jeito?',
        'Desafia regras e autoridade com frequência?',
        'Discute muito, culpa os outros e provoca de propósito?',
        'Guarda rancor, fica ressentido(a) ou vingativo(a)?',
        'Agride física ou verbalmente quando se desregula?',
        'Machuca a si mesmo(a) ou fala em se machucar ou sumir nas crises?',
        'Quebra coisas ou coloca a si ou a outros em risco?',
        'Tem dificuldade de se acalmar quando se altera?',
        'Demora muito para se recuperar após uma crise?',
        'Tem poucas estratégias próprias de autorregulação?',
        'Está irritável na maior parte do tempo?',
        'Tem oscilações de humor frequentes ou intensas?',
        'Irrita-se facilmente e tem dificuldade de "deixar pra lá"?',
        'A desregulação prejudica a convivência familiar?',
        'Atrapalha escola, amizades e atividades?',
        'Gera sofrimento para a criança e/ou para a família?'
      ]
    },
    {
      id: 'ren-emoc-12-17', code: 'REN-B5', sigla: '12–17 anos', band: '12–17 anos', min: 144, max: 215,
      items: [
        'Tem explosões de raiva intensas e frequentes para a idade?',
        'As crises são longas, difíceis de encerrar ou com perda de controle?',
        'Reage de forma desproporcional aos gatilhos?',
        'Tem baixa tolerância à frustração (explode ou desiste diante de obstáculos)?',
        'Tem dificuldade de lidar com mudanças, regras e imprevistos?',
        'É rígido(a) ou inflexível, com dificuldade de ceder ou negociar?',
        'Desafia regras e autoridade de forma frequente ou intensa?',
        'Discute, confronta e culpa os outros constantemente?',
        'Tem postura hostil, ressentida ou desafiadora habitual?',
        'Tem agressividade física ou verbal quando se desregula?',
        'Machuca a si mesmo(a), fala em se machucar/sumir ou se coloca em risco?',
        'Quebra coisas, foge ou coloca outros em risco nas crises?',
        'Tem dificuldade de se acalmar e regular as emoções?',
        'Demora muito para se recuperar após se alterar?',
        'Tem poucas estratégias eficazes de autorregulação?',
        'Está irritável ou explosivo(a) na maior parte do tempo?',
        'Tem oscilações de humor intensas e frequentes?',
        'Irrita-se com facilidade, com pouca margem para contrariedade?',
        'A desregulação prejudica a vida familiar?',
        'Atrapalha escola/trabalho e as relações sociais?',
        'Gera sofrimento significativo para o(a) adolescente e a família?'
      ]
    }
  ];

  function subsFor() { return SYS.map(function (name, k) { return { name: name, idx: [k * 3, k * 3 + 1, k * 3 + 2] }; }); }

  var CUTOFFS = [
    { max: 10, label: 'Regulação emocional dentro do esperado para a idade nesta triagem', cls: 'ok' },
    { max: 24, label: 'Dificuldades leves de regulação — orientar e observar', cls: 'warn' },
    { max: 42, label: 'Dificuldade de regulação relevante — avaliação e manejo indicados', cls: 'risk' },
    { max: 63, label: 'Dificuldade importante — avaliação multiprofissional prioritária', cls: 'risk' }
  ];

  var TRAPS = [
    { idx: [9, 10, 11], min: 2, level: 'prioritario', msg: 'Agressão que machuca a si ou a outros, ou crises que colocam em risco: garantir segurança, acolher e buscar avaliação. Em ideias de se machucar ou sumir, procurar ajuda imediatamente — SAMU 192 · CVV 188 (apoio emocional 24h).' },
    { idx: [0, 1, 2], min: 3, msg: 'Crises muito frequentes, intensas ou longas para a idade: avaliar gatilhos (sensorial, comunicação, sono, fome, frustração) e montar estratégias de prevenção; considerar avaliação.' },
    { idx: [12, 13, 14], min: 2, msg: 'Dificuldade de se acalmar e se recuperar sozinho(a): ensinar e treinar estratégias de autorregulação (corregulação do adulto, antecipação, ambiente, pausa).' },
    { idx: [18, 19, 20], min: 2, msg: 'Desregulação com impacto amplo (casa, escola, social): alinhar o manejo entre os ambientes e considerar avaliação multiprofissional.' }
  ];

  var SUGGEST = [
    { sub: 'Oposição e desafio', min: 6, msg: 'Predomínio de oposição/desafio: programas de manejo comportamental e consistência de limites; considerar avaliação (diferenciar TOD de desregulação por outra causa).' },
    { sub: 'Tolerância à frustração e flexibilidade', min: 6, msg: 'Predomínio de baixa tolerância/rigidez: trabalhar antecipação, transições previsíveis e flexibilidade; avaliar traços de TEA/TDAH.' },
    { sub: 'Humor e irritabilidade de base', min: 6, msg: 'Predomínio de humor irritável de base: diferenciar irritabilidade crônica de episódios; considerar avaliação de humor/ansiedade (ver instrumentos NPE-BR).' }
  ];

  var KW = ['birra', 'birras', 'explosao', 'explode', 'crise', 'meltdown', 'raiva', 'agressivo', 'bate',
    'desregulacao', 'autorregulacao', 'nao se acalma', 'frustracao', 'baixa tolerancia', 'opositor',
    'desafiador', 'tod', 'teimoso', 'irritado', 'pavio curto', 'descontrole emocional', 'transtorno explosivo', 'rigidez'];

  function mk(b) {
    var score_max = (O.length - 1) * b.items.length;
    return {
      id: b.id, anchor: b.id,
      title: '🌪️ Regulação Emocional NeuroPed · ' + b.band + ' (' + b.code + ')',
      short_title: b.code + ' · Regulação Emocional ' + b.sigla,
      emoji: '🌪️', code: b.code, sigla: 'REN ' + b.sigla,
      audience: 'familia', audience_label: 'Pais/cuidador',
      age_band: b.band, age_min_months: b.min, age_max_months: b.max,
      periodo: 'Últimas 4 semanas',
      domain: 'Regulação emocional e birras',
      finalidade: 'Triagem da regulação emocional nos 7 eixos (explosões/crises, tolerância à frustração, oposição, agressividade/segurança, autorregulação/recuperação, humor de base e impacto), com itens próprios por faixa etária, focando como a criança regula e se recupera das emoções.',
      symptoms: ['birras/explosões intensas e frequentes', 'baixa tolerância à frustração', 'dificuldade de se acalmar/recuperar', 'agressividade na desregulação'],
      complaints: KW, keywords: KW.concat([b.code, 'REN', 'autoral', 'neuroped']),
      nature: 'autoral', kind: 'autoral regulação emocional', applicable: true, npe: true, restrito: false, aviso: false,
      page: 'instrumento-autoral.html', priority: 184,
      options: opts(O), items: b.items, labels: O,
      domains: SYS.map(function (name, k) { return { name: name, items: b.items.slice(k * 3, k * 3 + 3) }; }),
      subs: subsFor(), cutoffs: CUTOFFS, traps: TRAPS, suggest: SUGGEST,
      score_max: score_max,
      plain_questions: b.items,
      clinical_use: 'Triagem da regulação emocional por faixa etária para mapear crises, frustração, oposição, agressividade, recuperação e impacto, orientando manejo comportamental e indicação de avaliação.',
      differentiator: 'Bateria focada na REGULAÇÃO e recuperação emocional (não só sintomas de humor), por faixa etária (0–2, 3–5, 6–8, 9–11, 12–17), com eixo de segurança nas crises e alertas — complementa as triagens de humor/ansiedade NPE-BR.',
      not_normative_disclaimer: DISC
    };
  }

  var INST = BANDS.map(mk);
  var base = Array.isArray(window.NEUROPED_EDITORIAL_SCALES) ? window.NEUROPED_EDITORIAL_SCALES : [];
  var ids = {}; base.forEach(function (x) { if (x && x.id) ids[x.id] = 1; });
  var add = INST.filter(function (x) { return !ids[x.id]; });
  window.NEUROPED_EDITORIAL_SCALES = add.concat(base);
  window.NEUROPED_REG_EMOCIONAL = add;
  window.NEUROPED_REG_EMOCIONAL_COUNT = add.length;
})();
