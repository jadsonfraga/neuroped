/* NeuroPed EDJ — Testes diretos como INSTRUMENTOS FILTRÁVEIS do catálogo
 * ----------------------------------------------------------------------
 * Promove a biblioteca de tarefas diretas (scales-direct-tasks.js →
 * NeuroPedDirectTasks.TASKS) a instrumentos de primeira classe dentro de
 * window.NEUROPED_EDITORIAL_SCALES, para que o FILTRO os selecione no top-3
 * da pré-consulta junto com os inventários de família.
 *
 * Cada balde funcional (linguagem, social, atenção/executiva, pedagógico,
 * sensorial, emocional, motor) vira UM instrumento "teste direto" (aplicado
 * ATIVAMENTE na criança), marcado com direct_test:true → a taxonomia o
 * classifica como "Teste direto" e o card mostra o tipo.
 *
 * Fonte única de verdade: as tarefas vêm de NeuroPedDirectTasks.TASKS — se
 * editar lá, estes instrumentos se regeneram no próximo build do bundle.
 *
 * Apoio à observação clínica; NÃO é teste normatizado nem ponto de corte.
 */
(function () {
  'use strict';
  if (window.NEUROPED_DIRECT_TESTS_CATALOG_LOADED) return;
  window.NEUROPED_DIRECT_TESTS_CATALOG_LOADED = true;

  var DT = window.NeuroPedDirectTasks;
  var TASKS = (DT && DT.TASKS) || {};

  // Balde funcional → metadados clínicos do instrumento filtrável.
  // age:[minMeses,maxMeses] é a faixa de aplicação típica do conjunto.
  var BUCKETS = {
    linguagem: {
      id: 'td-linguagem', emoji: '🗣️',
      title: 'Sondagem direta de linguagem — nomeação · compreensão · repetição',
      short: 'Linguagem (teste direto)', domain: 'Linguagem', age: [24, 215],
      complaints: ['linguagem', 'fala', 'não fala', 'nao fala', 'atraso de fala', 'troca sons', 'vocabulário', 'comunicação', 'nomeação', 'gagueira'],
      symptoms: ['não fala para a idade', 'troca sons', 'fala pouco', 'não repete frases', 'usa gesto no lugar da palavra']
    },
    social: {
      id: 'td-social', emoji: '🧩',
      title: 'Sondagem social direta (TEA) — nome · apontar · brincar · turno',
      short: 'Social/TEA (teste direto)', domain: 'TEA e comunicação social', age: [12, 84],
      complaints: ['tea', 'autismo', 'social', 'olhar', 'nome', 'apontar', 'brincar', 'reciprocidade', 'rigidez', 'contato visual'],
      symptoms: ['não responde ao nome', 'não aponta para mostrar', 'brinca sozinho', 'pouco contato visual', 'não faz de conta']
    },
    atencao: {
      id: 'td-atencao', emoji: '🎯',
      title: 'Sondagem direta de atenção e função executiva — alvo · memória · inibição',
      short: 'Atenção/Executiva (teste direto)', domain: 'TDAH e função executiva', age: [48, 215],
      complaints: ['tdah', 'atenção', 'atencao', 'hiperatividade', 'impulsividade', 'desatenção', 'memória', 'executiva', 'concentração', 'organização'],
      symptoms: ['desatento', 'agitado', 'impulsivo', 'esquece instruções', 'não termina tarefas']
    },
    escola: {
      id: 'td-escola', emoji: '📚',
      title: 'Sondagem pedagógica direta — letras (visual) · fonológica · leitura · escrita · cálculo',
      short: 'Pedagógico (teste direto)', domain: 'Aprendizagem escolar', age: [48, 215],
      complaints: ['escola', 'aprendizagem', 'leitura', 'escrita', 'letras', 'alfabetização', 'dislexia', 'discalculia', 'matemática', 'reconhecimento visual', 'não lê', 'não escreve', 'pedagógico'],
      symptoms: ['confunde letras (b/d, p/q)', 'não lê para a série', 'troca letras na escrita', 'dificuldade em matemática']
    },
    cognicao: {
      id: 'td-cognicao', emoji: '🧠',
      title: 'Sondagem cognitiva direta — memória · raciocínio · velocidade · memória de trabalho',
      short: 'Cognitivo (teste direto)', domain: 'Cognição', age: [48, 215],
      complaints: ['cognição', 'cognitivo', 'memória', 'raciocínio', 'inteligência', 'lentidão', 'esquece', 'aprende devagar', 'atenção', 'executiva', 'processamento'],
      symptoms: ['esquece o que acabou de ver/ouvir', 'pensa de forma muito concreta', 'lento para responder', 'dificuldade em sequência lógica']
    },
    visual: {
      id: 'td-visual', emoji: '🔍',
      title: 'Sondagem de reconhecimento visual — formas · cores · discriminação · figura-fundo · cópia',
      short: 'Reconhecimento visual (teste direto)', domain: 'Percepção visual', age: [36, 168],
      complaints: ['visual', 'percepção', 'reconhecimento visual', 'formas', 'cores', 'discriminação visual', 'figura-fundo', 'visomotor', 'cópia', 'não reconhece letras', 'desenho'],
      symptoms: ['não nomeia formas/cores esperadas', 'não acha o diferente', 'cópia desorganizada', 'perde-se em cena cheia']
    },
    sensorial: {
      id: 'td-sensorial', emoji: '✨',
      title: 'Sondagem sensorial direta — reatividade e tolerância gradual',
      short: 'Sensorial (teste direto)', domain: 'Processamento sensorial', age: [24, 215],
      complaints: ['sensorial', 'barulho', 'textura', 'luz', 'seletividade', 'alimentação', 'tato', 'etiqueta', 'regulação'],
      symptoms: ['tapa os ouvidos com sons', 'incomoda-se com texturas/etiquetas', 'seletividade alimentar intensa', 'busca muito movimento']
    },
    emocional: {
      id: 'td-emocional', emoji: '💗',
      title: 'Sondagem emocional direta — emoções · ansiedade · checagem de segurança',
      short: 'Emocional (teste direto)', domain: 'Saúde emocional', age: [60, 215],
      complaints: ['ansiedade', 'tristeza', 'humor', 'medo', 'emoções', 'irritabilidade', 'risco', 'preocupação', 'regulação'],
      symptoms: ['preocupa-se demais', 'triste/irritado na maior parte do dia', 'dificuldade em nomear emoções', 'viés negativo na interpretação']
    },
    motor: {
      id: 'td-motor', emoji: '🤸',
      title: 'Sondagem motora direta — coordenação grossa e motricidade fina',
      short: 'Motor (teste direto)', domain: 'Motor e coordenação', age: [24, 215],
      complaints: ['motor', 'coordenação', 'equilíbrio', 'motricidade fina', 'escrita', 'desajeitado', 'quedas', 'tdc', 'lápis'],
      symptoms: ['cai muito / tropeça', 'desajeitado para a idade', 'dificuldade com lápis e tesoura', 'cansa rápido no esforço']
    }
  };

  function uniq(arr) { var s = {}, o = []; arr.forEach(function (x) { if (x && !s[x]) { s[x] = 1; o.push(x); } }); return o; }
  function yrs(m) { return m % 12 === 0 ? (m / 12) : (m / 12).toFixed(0); }
  function band(min, max) { return yrs(min) + '–' + (max >= 216 ? '18+' : yrs(max)) + ' anos'; }

  var out = [];
  Object.keys(BUCKETS).forEach(function (k) {
    var cfg = BUCKETS[k];
    var tasks = TASKS[k] || [];
    if (!tasks.length) return; // sem tarefas → não gera (degrada com segurança)

    var direct_tasks = tasks.map(function (t) { return (t.emoji ? t.emoji + ' ' : '') + t.titulo + ' — ' + t.instrucao; });
    var plain_questions = tasks.map(function (t) { return t.titulo + ' — observar: ' + String(t.observar || '').replace(/\.$/, '') + '.'; });
    var min = cfg.age[0], max = cfg.age[1];

    out.push({
      id: cfg.id,
      title: cfg.emoji + ' ' + cfg.title,
      short_title: cfg.short,
      emoji: cfg.emoji,
      direct_test: true,
      kind: 'teste_direto',
      audience: 'clinico',
      audience_label: 'Teste direto (criança)',
      age_band: band(min, max),
      age_min_months: min,
      age_max_months: max,
      domain: cfg.domain,
      symptoms: cfg.symptoms,
      complaints: cfg.complaints,
      keywords: uniq([].concat(cfg.complaints, cfg.symptoms, ['teste direto', 'sondagem', 'aplicado na criança', 'pré-consulta', cfg.domain.toLowerCase(), band(min, max)])),
      plain_questions: plain_questions,
      direct_tasks: direct_tasks,
      clinical_use: 'Sondagem ATIVA aplicada na própria criança na pré-consulta — complementa o heterorrelato dos questionários de família/escola com desempenho observado.',
      differentiator: 'Testa diretamente a criança (desempenho), não só relato. Ideal para a secretária/equipe preparar a pré-consulta junto a um inventário de família.',
      not_normative_disclaimer: 'Apoio à observação clínica; não é teste normatizado nem ponto de corte. Não substitui avaliação especializada (fono, neuropsico, psicopedagogia).',
      page: 'testes-diretos.html',
      anchor: k,
      priority: 132
    });
  });

  var base = Array.isArray(window.NEUROPED_EDITORIAL_SCALES) ? window.NEUROPED_EDITORIAL_SCALES : [];
  var ids = new Set(base.map(function (x) { return x && x.id; }));
  window.NEUROPED_EDITORIAL_SCALES = out.filter(function (x) { return !ids.has(x.id); }).concat(base);
  window.NEUROPED_DIRECT_TESTS = out;
})();
