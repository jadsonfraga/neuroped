/* NeuroPed EDJ — Coordenação Motora e Praxia no Cotidiano NeuroPed (CMN) · AUTORAL.
 * --------------------------------------------------------------------------
 * Triagem de coordenação motora e planejamento motor (praxia) por faixa etária
 * (0–2, 3–5, 6–8, 9–11, 12–17), varrendo 7 áreas: motor grosso, equilíbrio/
 * postura, motor fino, escrita/grafismo, praxia/planejamento, autocuidado motor
 * e impacto/participação. Sinaliza sinais de TDC (Transtorno do Desenvolvimento
 * da Coordenação) e disgrafia/dispraxia. Itens autorais do Dr. Jadson Fraga;
 * direção única (maior dificuldade = mais atenção). Distinto da escala de função
 * motora (paralisia cerebral). Renderiza em escala.html (via `domains`) e no
 * autoral (instrumento-autoral.html).
 */
(function () {
  'use strict';
  if (window.NEUROPED_COORD_MOTORA_LOADED) return;
  window.NEUROPED_COORD_MOTORA_LOADED = true;

  var DISC = 'Triagem autoral NeuroPed EDJ de coordenação motora (itens próprios, por faixa etária). NÃO é normatizada e NÃO substitui avaliação de fisioterapia/terapia ocupacional nem o exame neurológico. Os valores são pontos de atenção operacional, não pontos de corte, e não diagnosticam TDC, dispraxia ou disgrafia. Dificuldade ampla, quedas frequentes ou perda de habilidades exigem avaliação médica para descartar causa neurológica/muscular.';

  var O = ['Não / sem dificuldade', 'Dificuldade leve (às vezes)', 'Dificuldade frequente', 'Muita dificuldade / não consegue'];
  function opts(arr) { return arr.map(function (l, i) { return { label: l, value: i }; }); }

  // 7 áreas (ordem fixa; 3 itens cada → 21). idx de subs/traps seguem esta ordem.
  var SYS = [
    'Motor grosso (corpo todo)',
    'Equilíbrio e postura',
    'Motor fino (mãos)',
    'Escrita e grafismo',
    'Praxia e planejamento motor',
    'Autocuidado motor',
    'Impacto e participação'
  ];

  var BANDS = [
    {
      id: 'cmn-motor-0-2', code: 'CMN-B1', sigla: '0–2 anos', band: '0–2 anos', min: 0, max: 35,
      items: [
        // Motor grosso
        'Tem dificuldade ou atraso para alcançar marcos motores (sentar, engatinhar, andar)?',
        'É mais "molinho(a)" ou mais rígido(a) que o esperado ao mexer o corpo?',
        'Cai muito, tropeça ou parece inseguro(a) ao se movimentar para a idade?',
        // Equilíbrio e postura
        'Tem dificuldade para se equilibrar ao sentar, ficar em pé ou nos primeiros passos?',
        'Cansa rápido ou evita posições que exigem firmeza do corpo?',
        'Bate com frequência em móveis e objetos ao se deslocar?',
        // Motor fino
        'Tem dificuldade para pegar objetos pequenos com os dedos (pinça)?',
        'Tem dificuldade para passar objetos de uma mão para a outra ou encaixar?',
        'Usa pouco as duas mãos juntas (bater palmas, segurar e manipular)?',
        // Escrita / grafismo inicial
        'Tem dificuldade ou pouco interesse em rabiscar, segurar giz ou marcar o papel?',
        'Tem dificuldade para empilhar, encaixar peças grandes ou virar páginas grossas?',
        'Tem pouca preensão ou força para manipular brinquedos de encaixe simples?',
        // Praxia
        'Tem dificuldade para imitar gestos simples (dar tchau, bater palmas)?',
        'Tem dificuldade para aprender movimentos novos com o corpo?',
        'Parece não saber "como" mexer o corpo para fazer o que quer?',
        // Autocuidado motor
        'Tem dificuldade para colaborar ao se vestir (estender braço/perna) para a idade?',
        'Tem dificuldade para levar a colher ou o copo à boca conforme a idade?',
        'Tem dificuldade para se alimentar com diferentes texturas pela coordenação oral?',
        // Impacto
        'Evita ou se frustra com brincadeiras de movimento ou manipulação?',
        'Depende muito mais do adulto que outras crianças da idade nas tarefas motoras?',
        'Você percebe que o desenvolvimento motor está abaixo do esperado para a idade?'
      ]
    },
    {
      id: 'cmn-motor-3-5', code: 'CMN-B2', sigla: '3–5 anos', band: '3–5 anos', min: 36, max: 71,
      items: [
        'Tem dificuldade para correr, pular, subir/descer escadas ou chutar bola para a idade?',
        'É desajeitado(a), cai e tropeça mais que outras crianças da mesma idade?',
        'Tem dificuldade para pedalar (triciclo) ou pular com os dois pés juntos?',
        'Tem dificuldade para se equilibrar em um pé, na ponta dos pés ou em superfícies?',
        'Cansa rápido em atividades físicas ou evita brincadeiras que exigem o corpo?',
        'Esbarra, derruba coisas e tromba em pessoas com frequência?',
        'Tem dificuldade para usar tesoura, encaixar peças pequenas ou montar quebra-cabeça?',
        'Tem dificuldade para abotoar, usar zíper ou manipular objetos pequenos?',
        'Usa mal as duas mãos de forma coordenada (segurar e fazer ao mesmo tempo)?',
        'Tem dificuldade para segurar o lápis ou o giz de forma adequada para a idade?',
        'Tem dificuldade para desenhar formas simples, fazer linhas ou colorir no espaço?',
        'Cansa, faz força demais ou evita atividades de desenho e pintura?',
        'Tem dificuldade para aprender movimentos novos (dança, gestos, brincadeiras)?',
        'Tem dificuldade para fazer sequências de ações (vestir na ordem, montar)?',
        'Parece "não saber por onde começar" em tarefas motoras novas?',
        'Tem dificuldade para se vestir e despir sozinho(a) conforme a idade?',
        'Tem dificuldade para calçar sapatos, usar talheres ou beber sem derramar?',
        'Demora muito mais que os colegas nas tarefas de autocuidado pela coordenação?',
        'Evita brincadeiras motoras, parquinho ou esportes por dificuldade?',
        'Fica frustrado(a), envergonhado(a) ou é excluído(a) por causa da coordenação?',
        'A dificuldade motora chama atenção em casa e na escola?'
      ]
    },
    {
      id: 'cmn-motor-6-8', code: 'CMN-B3', sigla: '6–8 anos', band: '6–8 anos', min: 72, max: 107,
      items: [
        'Tem dificuldade para correr, pular, andar de bicicleta (sem rodinhas) ou em esportes?',
        'É notadamente desajeitado(a), cai e tropeça mais que os colegas?',
        'Tem dificuldade para pegar, arremessar ou chutar bola com coordenação?',
        'Tem dificuldade de equilíbrio (um pé, andar em linha, ficar parado sem cair)?',
        'Cansa rápido fisicamente ou evita educação física e brincadeiras ativas?',
        'Esbarra, derruba e tromba em coisas e pessoas com frequência?',
        'Tem dificuldade com tesoura, régua, montar peças pequenas ou amarrar o cadarço?',
        'Tem dificuldade para manipular objetos pequenos com precisão?',
        'Usa mal as duas mãos coordenadas (segurar o papel e recortar, por exemplo)?',
        'Tem letra muito feia ou irregular, difícil de ler, para a série?',
        'Faz muita força, cansa, dói a mão ou é muito lento(a) ao escrever?',
        'Tem dificuldade para copiar do quadro, manter na linha e organizar no papel?',
        'Tem dificuldade para aprender sequências motoras novas (dança, esporte, instrumento)?',
        'Tem dificuldade para organizar e sequenciar os passos de uma tarefa motora?',
        'Demora muito mais que os colegas para "pegar o jeito" de movimentos novos?',
        'Tem dificuldade para se vestir, amarrar cadarço ou usar talheres com agilidade?',
        'É muito lento(a) ou desajeitado(a) em tarefas do dia a dia pela coordenação?',
        'Precisa de mais ajuda que os colegas em atividades motoras de autocuidado?',
        'Evita esportes, educação física ou escrever por causa da dificuldade?',
        'Fica frustrado(a), com baixa autoestima ou é excluído(a) pela coordenação?',
        'A dificuldade motora prejudica o desempenho ou a participação escolar?'
      ]
    },
    {
      id: 'cmn-motor-9-11', code: 'CMN-B4', sigla: '9–11 anos', band: '9–11 anos', min: 108, max: 143,
      items: [
        'Tem dificuldade em esportes, correr, pular ou na coordenação ampla para a idade?',
        'Continua desajeitado(a), cai, tropeça ou esbarra mais que os colegas?',
        'Tem dificuldade em atividades que exigem ritmo e coordenação (pular corda, bola)?',
        'Tem dificuldade de equilíbrio e estabilidade do corpo (andar de bike, equilibrar)?',
        'Cansa rápido fisicamente ou evita atividades físicas por dificuldade?',
        'Tem postura ruim, escora-se muito ou parece "frouxo(a)" no corpo?',
        'Tem dificuldade em tarefas manuais finas (régua, compasso, artesanato, ferramentas)?',
        'Tem dificuldade de precisão e destreza com as mãos?',
        'Usa mal as duas mãos de forma coordenada em tarefas que exigem isso?',
        'Tem letra ruim, ilegível ou desorganizada para a série?',
        'Escreve com muito esforço, dor ou lentidão, atrapalhando acompanhar a aula?',
        'Tem dificuldade para organizar o texto no papel, margens e cópia do quadro?',
        'Tem dificuldade para aprender e automatizar sequências motoras (esporte, instrumento)?',
        'Tem dificuldade para planejar e organizar passos de tarefas motoras e do dia a dia?',
        'Demora muito mais que os colegas para dominar habilidades motoras novas?',
        'Tem dificuldade ou lentidão em tarefas de autocuidado pela coordenação (arrumar-se, talheres)?',
        'É desajeitado(a) ou lento(a) em tarefas práticas do dia a dia (arrumar mochila, material)?',
        'Precisa de mais apoio que os colegas em atividades práticas e manuais?',
        'Evita esportes, escrita ou tarefas manuais por causa da dificuldade?',
        'Tem frustração, ansiedade, baixa autoestima ou exclusão ligadas à coordenação?',
        'A dificuldade motora prejudica a escola e a participação social?'
      ]
    },
    {
      id: 'cmn-motor-12-17', code: 'CMN-B5', sigla: '12–17 anos', band: '12–17 anos', min: 144, max: 215,
      items: [
        'Tem dificuldade em esportes, coordenação ampla ou atividades físicas para a idade?',
        'É notadamente desajeitado(a), esbarra, derruba ou tropeça com frequência?',
        'Evita ou tem baixo desempenho em atividades que exigem coordenação corporal?',
        'Tem dificuldade de equilíbrio, estabilidade ou postura corporal?',
        'Cansa rápido fisicamente ou tem pouca resistência em atividades motoras?',
        'Tem má postura, parece "frouxo(a)" ou descoordenado(a) nos movimentos?',
        'Tem dificuldade em tarefas manuais finas e de precisão (ferramentas, desenho técnico, instrumentos)?',
        'Tem pouca destreza ou precisão manual para a idade?',
        'Usa mal as mãos de forma coordenada em tarefas que exigem precisão?',
        'Tem letra ruim, lenta ou cansativa que atrapalha registrar conteúdo e provas?',
        'Escreve com esforço ou dor, ou evita escrever à mão por dificuldade?',
        'Tem dificuldade de organização gráfica (texto, cálculos, esquemas) no papel?',
        'Tem dificuldade para aprender e automatizar habilidades motoras novas (dirigir, esporte, instrumento)?',
        'Tem dificuldade para planejar e sequenciar tarefas motoras e práticas?',
        'Demora muito mais que os pares para dominar novas habilidades motoras?',
        'Tem dificuldade, lentidão ou desajeito em tarefas práticas do dia a dia pela coordenação?',
        'Tem dificuldade em atividades de vida prática (cozinhar, organizar, manusear objetos)?',
        'Precisa de mais apoio que os pares em tarefas práticas e manuais?',
        'Evita esportes, escrita ou atividades práticas por causa da dificuldade motora?',
        'Tem frustração, ansiedade, baixa autoestima ou retraimento social ligados à coordenação?',
        'A dificuldade motora prejudica estudos, autonomia ou vida social?'
      ]
    }
  ];

  function subsFor() { return SYS.map(function (name, k) { return { name: name, idx: [k * 3, k * 3 + 1, k * 3 + 2] }; }); }

  var CUTOFFS = [
    { max: 10, label: 'Coordenação motora dentro do esperado nesta triagem', cls: 'ok' },
    { max: 24, label: 'Dificuldades motoras leves — estimular e observar', cls: 'warn' },
    { max: 42, label: 'Dificuldades motoras relevantes — avaliação de terapia ocupacional/fisioterapia indicada', cls: 'risk' },
    { max: 63, label: 'Dificuldades motoras importantes — avaliação especializada (descartar TDC/dispraxia; diferenciar causa neurológica)', cls: 'risk' }
  ];

  var TRAPS = [
    { idx: [9, 10, 11], min: 2, msg: 'Dificuldade de escrita/grafismo persistente: avaliar disgrafia, indicar terapia ocupacional e adaptar a demanda escolar (mais tempo, menos cópia, uso de teclado).' },
    { idx: [12, 13, 14], min: 2, msg: 'Dificuldade de planejamento motor (aprender e sequenciar movimentos): considerar dispraxia; avaliação de terapia ocupacional/fisioterapia.' },
    { idx: [0, 1, 2, 3, 4, 5], min: 3, level: 'prioritario', msg: 'Descoordenação motora ampla com quedas frequentes: avaliação médica para descartar causa neurológica/muscular antes de atribuir a TDC. Atenção a perda de habilidades já adquiridas (regressão).' },
    { idx: [18, 19, 20], min: 2, msg: 'Evitação de atividades motoras com impacto emocional/social: risco de sedentarismo e baixa autoestima — promover participação adaptada e valorizar o esforço.' }
  ];

  var SUGGEST = [
    { sub: 'Escrita e grafismo', min: 6, msg: 'Predomínio na escrita: avaliar disgrafia e oferecer adaptações (lápis adaptado, menos cópia, tecnologia assistiva).' },
    { sub: 'Motor fino (mãos)', min: 6, msg: 'Predomínio motor fino: terapia ocupacional para destreza manual e atividades graduadas.' },
    { sub: 'Motor grosso (corpo todo)', min: 6, msg: 'Predomínio motor grosso: fisioterapia ou educação física adaptada e atividades de coordenação ampla.' }
  ];

  var KW = ['coordenacao', 'coordenacao motora', 'desajeitado', 'desastrado', 'cai muito', 'tropeca',
    'letra feia', 'disgrafia', 'escrita', 'nao anda de bicicleta', 'dificuldade motora', 'tdc',
    'transtorno do desenvolvimento da coordenacao', 'dispraxia', 'praxia', 'motricidade', 'motor fino',
    'motor grosso', 'equilibrio', 'amarrar cadarco', 'abotoar', 'tesoura', 'planejamento motor', 'desengoncado'];

  function mk(b) {
    var score_max = (O.length - 1) * b.items.length;
    return {
      id: b.id, anchor: b.id,
      title: '🤸 Coordenação Motora e Praxia NeuroPed · ' + b.band + ' (' + b.code + ')',
      short_title: b.code + ' · Coordenação Motora ' + b.sigla,
      emoji: '🤸', code: b.code, sigla: 'CMN ' + b.sigla,
      audience: 'familia', audience_label: 'Pais/cuidador',
      age_band: b.band, age_min_months: b.min, age_max_months: b.max,
      periodo: 'Últimas 4 semanas',
      domain: 'Coordenação motora (TDC / praxia)',
      finalidade: 'Triagem de coordenação motora e praxia nas 7 áreas (motor grosso, equilíbrio/postura, motor fino, escrita/grafismo, planejamento motor, autocuidado e impacto), com itens próprios por faixa etária, sinalizando TDC, disgrafia e dispraxia.',
      symptoms: ['criança desajeitada/cai muito', 'letra feia e escrita lenta', 'dificuldade com cadarço/botões/tesoura', 'evita esportes por dificuldade motora'],
      complaints: KW, keywords: KW.concat([b.code, 'CMN', 'autoral', 'neuroped']),
      nature: 'autoral', kind: 'autoral coordenação motora', applicable: true, npe: true, restrito: false, aviso: false,
      page: 'instrumento-autoral.html', priority: 184,
      options: opts(O), items: b.items, labels: O,
      domains: SYS.map(function (name, k) { return { name: name, items: b.items.slice(k * 3, k * 3 + 3) }; }),
      subs: subsFor(), cutoffs: CUTOFFS, traps: TRAPS, suggest: SUGGEST,
      score_max: score_max,
      plain_questions: b.items,
      clinical_use: 'Triagem da coordenação motora por faixa etária para mapear motor grosso, fino, equilíbrio, escrita, praxia e autocuidado, orientando indicação de terapia ocupacional/fisioterapia e adaptações escolares.',
      differentiator: 'Único instrumento do app focado em TDC/disgrafia/dispraxia no cotidiano, varrendo 7 áreas por faixa etária (0–2, 3–5, 6–8, 9–11, 12–17); distinto da escala de função motora da paralisia cerebral.',
      not_normative_disclaimer: DISC
    };
  }

  var INST = BANDS.map(mk);
  var base = Array.isArray(window.NEUROPED_EDITORIAL_SCALES) ? window.NEUROPED_EDITORIAL_SCALES : [];
  var ids = {}; base.forEach(function (x) { if (x && x.id) ids[x.id] = 1; });
  var add = INST.filter(function (x) { return !ids[x.id]; });
  window.NEUROPED_EDITORIAL_SCALES = add.concat(base);
  window.NEUROPED_COORD_MOTORA = add;
  window.NEUROPED_COORD_MOTORA_COUNT = add.length;
})();
