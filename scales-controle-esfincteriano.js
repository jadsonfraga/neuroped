/* NeuroPed EDJ — Controle Esfincteriano NeuroPed (CEN) · AUTORAL.
 * --------------------------------------------------------------------------
 * Triagem do controle esfincteriano por faixa etária (2–3, 4–5, 6–8, 9–11,
 * 12–17), varrendo 7 eixos: hábito/autonomia no banheiro, xixi de dia (controle
 * diurno), xixi à noite (enurese noturna), cocô (constipação/retenção), cocô
 * (escape/encoprese), sinais urinários de alerta, e impacto/comportamento.
 * Itens autorais do Dr. Jadson Fraga; direção única (maior frequência = mais
 * atenção). IMPORTANTE: controle noturno só é esperado a partir de ~5 anos.
 * Renderiza em escala.html (via `domains`) e no autoral (instrumento-autoral.html).
 */
(function () {
  'use strict';
  if (window.NEUROPED_CONTROLE_ESFINCTER_LOADED) return;
  window.NEUROPED_CONTROLE_ESFINCTER_LOADED = true;

  var DISC = 'Triagem autoral NeuroPed EDJ do controle esfincteriano (itens próprios, por faixa etária). NÃO é normatizada nem diagnóstica. Lembre-se: o controle do xixi à noite só é esperado a partir de cerca de 5 anos — molhar a cama antes disso costuma fazer parte do desfralde normal. Os valores são pontos de atenção operacional, não pontos de corte; enurese e constipação/encoprese são condições tratáveis. Dor ou ardência, sangue na urina, infecções urinárias de repetição, perda de controle após período seco (regressão) ou grande sofrimento exigem avaliação médica.';

  var O = ['Nunca ou quase nunca', 'Às vezes', 'Frequentemente', 'Quase sempre / todos os dias'];
  function opts(arr) { return arr.map(function (l, i) { return { label: l, value: i }; }); }

  // 7 eixos (ordem fixa; 3 itens cada → 21). idx de subs/traps seguem esta ordem.
  var SYS = [
    'Hábito e autonomia no banheiro',
    'Xixi de dia (controle diurno)',
    'Xixi à noite (enurese noturna)',
    'Cocô — constipação e retenção',
    'Cocô — escape (encoprese)',
    'Sinais urinários de alerta',
    'Impacto e comportamento'
  ];

  var BANDS = [
    {
      id: 'cen-esfincter-2-3', code: 'CEN-B1', sigla: '2–3 anos', band: '2–3 anos', min: 24, max: 47,
      items: [
        // Hábito e autonomia
        'Tem dificuldade para perceber ou avisar que precisa fazer xixi ou cocô?',
        'Demonstra pouco interesse ou resistência em usar o penico/vaso para a idade?',
        'O desfralde diurno não avança (não consegue ficar seco(a) por períodos curtos)?',
        // Xixi de dia
        'Faz xixi nas roupas durante o dia (além do esperado no início do desfralde)?',
        'Tem muita urgência para o xixi (não consegue segurar nem um pouco)?',
        'Faz xixi muitas vezes ao dia, em pequena quantidade de cada vez?',
        // Xixi à noite
        'Acorda molhado(a) na maioria das noites? (controle noturno ainda não é esperado nesta idade)',
        'Já tinha ficado seco(a) à noite e voltou a molhar a cama (regressão)?',
        'Não apresenta nenhuma noite seca, mesmo ocasional?',
        // Cocô — constipação
        'Faz cocô duro, ressecado ou com dor e esforço?',
        'Evacua com pouca frequência (menos de 3 vezes por semana)?',
        '"Segura" o cocô, esconde-se ou faz força para reter quando vem a vontade?',
        // Cocô — escape
        'Suja a roupa íntima com fezes (manchas ou escapes)?',
        'Faz cocô em lugares inadequados, fora do vaso, de forma repetida?',
        'Tem fezes muito volumosas, que chegam a entupir o vaso?',
        // Sinais urinários
        'Reclama de dor ou ardência ao fazer xixi?',
        'Você já notou sangue, cheiro muito forte ou xixi turvo?',
        'Bebe e/ou urina muito mais que o habitual, ou já teve infecção urinária?',
        // Impacto
        'Evita o penico/banheiro ou tem muito medo ou recusa de evacuar?',
        'A questão do xixi/cocô gera estresse, choro ou conflito em casa?',
        'Houve mudança recente (regressão) ligada a um evento (irmão, mudança, creche)?'
      ]
    },
    {
      id: 'cen-esfincter-4-5', code: 'CEN-B2', sigla: '4–5 anos', band: '4–5 anos', min: 48, max: 71,
      items: [
        'Tem dificuldade para perceber a tempo que precisa ir ao banheiro?',
        'Depende muito do lembrete do adulto para usar o banheiro?',
        'O desfralde diurno ainda não se completou ou é muito instável?',
        'Faz xixi nas calças durante o dia?',
        'Tem urgência miccional (corre para o banheiro e às vezes não dá tempo)?',
        'Faz xixi muitas vezes ao dia ou em jatos curtos e repetidos?',
        'Acorda com a cama molhada na maioria das noites?',
        'Já tinha ficado seco(a) à noite por meses e voltou a molhar (regressão)?',
        'Não apresenta noites secas, mesmo ocasionais?',
        'Faz cocô duro, em bolinhas, ou com dor e esforço?',
        'Evacua menos de 3 vezes por semana?',
        '"Segura" o cocô (cruza as pernas, esconde-se, fica na ponta dos pés)?',
        'Suja a roupa íntima com fezes (escapes ou manchas)?',
        'Faz cocô fora do vaso de forma repetida?',
        'Tem fezes muito volumosas, que entopem o vaso?',
        'Reclama de dor ou ardência ao urinar?',
        'Você notou sangue, xixi turvo ou cheiro muito forte?',
        'Bebe/urina muito mais que o habitual, ou tem infecções urinárias de repetição?',
        'Evita o banheiro (em casa ou na escola) ou tem medo/recusa de evacuar?',
        'O tema xixi/cocô gera vergonha, estresse ou conflito?',
        'Houve regressão ligada a algum evento emocional ou mudança?'
      ]
    },
    {
      id: 'cen-esfincter-6-8', code: 'CEN-B3', sigla: '6–8 anos', band: '6–8 anos', min: 72, max: 107,
      items: [
        'Tem dificuldade para ir ao banheiro de forma independente quando precisa?',
        'Adia ir ao banheiro a ponto de quase não dar tempo?',
        'Tem dificuldade para se limpar e se higienizar sozinho(a) adequadamente?',
        'Faz xixi nas roupas durante o dia (em idade em que já deveria ter controle)?',
        'Tem urgência miccional forte (corre e vaza um pouco antes de chegar)?',
        'Vai ao banheiro muitas vezes, ou muito poucas vezes, ao dia?',
        'Molha a cama à noite (já depois dos 5 anos)?',
        'Já tinha ficado seco(a) por meses e voltou a molhar (regressão)?',
        'A enurese noturna acontece em quase todas as noites?',
        'Faz cocô duro/ressecado ou com dor e esforço?',
        'Evacua menos de 3 vezes por semana?',
        'Adia ou "segura" a evacuação com frequência?',
        'Suja a roupa íntima com fezes (escape/encoprese)?',
        'O escape costuma vir acompanhado de prisão de ventre (cocô preso)?',
        'Tem fezes muito volumosas, que entopem o vaso?',
        'Reclama de dor ou ardência ao urinar?',
        'Você notou sangue, xixi turvo ou cheiro forte?',
        'Bebe/urina muito mais que o habitual, ou tem infecção urinária de repetição?',
        'Evita usar o banheiro da escola ou "segura" o dia todo?',
        'Sente vergonha, esconde os episódios ou evita dormir fora por isso?',
        'O tema gera sofrimento, baixa autoestima ou conflito em casa?'
      ]
    },
    {
      id: 'cen-esfincter-9-11', code: 'CEN-B4', sigla: '9–11 anos', band: '9–11 anos', min: 108, max: 143,
      items: [
        'Tem dificuldade para gerir sozinho(a) as idas ao banheiro e a própria higiene?',
        'Adia ir ao banheiro a ponto de ter pressa ou escapes?',
        'Precisa ser lembrado(a) para ir ao banheiro ou se higienizar?',
        'Tem escapes de xixi durante o dia?',
        'Tem urgência miccional (precisa correr, vaza antes de chegar)?',
        'Tem padrão miccional alterado (muitas idas, ou segurar demais)?',
        'Continua molhando a cama à noite nesta idade?',
        'Voltou a molhar após um longo período seco (regressão)?',
        'A enurese ocorre na maioria das noites?',
        'Faz cocô duro, com dor ou esforço?',
        'Evacua menos de 3 vezes por semana?',
        'Adia ou "segura" a evacuação com frequência?',
        'Suja a roupa com fezes (encoprese)?',
        'O escape vem associado a prisão de ventre?',
        'Tem fezes muito volumosas (que entopem o vaso)?',
        'Reclama de dor ou ardência ao urinar?',
        'Você notou sangue, xixi turvo ou cheiro forte?',
        'Tem sede/urina excessivas ou infecção urinária de repetição?',
        'Evita o banheiro da escola, viagens ou dormir fora por causa disso?',
        'Tem vergonha, ansiedade ou isolamento ligados ao controle?',
        'Há sofrimento ou conflito importante em torno do tema?'
      ]
    },
    {
      id: 'cen-esfincter-12-17', code: 'CEN-B5', sigla: '12–17 anos', band: '12–17 anos', min: 144, max: 215,
      items: [
        'Tem dificuldade de autonomia/organização nas idas ao banheiro e na higiene?',
        'Adia ir ao banheiro a ponto de ter pressa ou escapes?',
        'Há descuido com a higiene íntima que chama atenção?',
        'Tem escapes ou perdas de urina durante o dia?',
        'Tem urgência miccional importante?',
        'Tem padrão miccional alterado (frequência muito alta ou retenção)?',
        'Continua com enurese noturna na adolescência?',
        'Voltou a molhar após anos seco(a) (regressão)?',
        'A enurese ocorre na maioria das noites?',
        'Faz cocô duro, com dor ou esforço?',
        'Evacua menos de 3 vezes por semana?',
        'Adia ou "segura" a evacuação com frequência?',
        'Tem escape de fezes (encoprese)?',
        'O escape associa-se a constipação/retenção?',
        'Tem fezes muito volumosas?',
        'Reclama de dor ou ardência ao urinar?',
        'Você notou sangue, xixi turvo ou cheiro forte?',
        'Tem sede/urina excessivas ou infecção urinária de repetição?',
        'Evita situações sociais (dormir fora, viagens, escola) por causa disso?',
        'Tem vergonha intensa, ansiedade, isolamento ou impacto na autoestima?',
        'O tema gera sofrimento importante ou conflito familiar?'
      ]
    }
  ];

  function subsFor() { return SYS.map(function (name, k) { return { name: name, idx: [k * 3, k * 3 + 1, k * 3 + 2] }; }); }

  var CUTOFFS = [
    { max: 10, label: 'Dentro do esperado para a fase (inclui o processo normal de desfralde)', cls: 'ok' },
    { max: 24, label: 'Sinais leves — orientar e observar', cls: 'warn' },
    { max: 42, label: 'Padrão relevante — avaliação indicada (uropediatria/gastro/abordagem comportamental)', cls: 'risk' },
    { max: 63, label: 'Impacto importante — avaliação especializada prioritária', cls: 'risk' }
  ];

  var TRAPS = [
    { idx: [9, 10, 11], min: 2, msg: 'Constipação/retenção fecal: tratar é prioridade — é causa frequente de enurese e de escape fecal; orientar (hidratação, fibras, rotina) e considerar avaliação.' },
    { idx: [12, 13, 14], min: 2, msg: 'Escape de fezes nas roupas (encoprese): na maioria das vezes ligado à constipação crônica com retenção — avaliação gastro/comportamental, não punir.' },
    { idx: [15, 16, 17], min: 2, level: 'prioritario', msg: 'Sinais urinários de alerta (dor/ardência, sangue, jato fraco, sede/xixi excessivos, ITU de repetição): avaliação médica/uropediátrica.' },
    { idx: [7, 18, 19, 20], min: 2, msg: 'Perda de controle após período seco (regressão) ou grande sofrimento/evitação: investigar causa (constipação, ITU, fatores emocionais) e acolher.' }
  ];

  var SUGGEST = [
    { sub: 'Xixi à noite (enurese noturna)', min: 6, msg: 'Predomínio noturno: orientar (líquidos à noite, urinar antes de dormir). A enurese é tratável a partir dos ~5 anos — considerar alarme noturno/avaliação se persistente.' },
    { sub: 'Cocô — constipação e retenção', min: 6, msg: 'Predomínio de constipação: hidratação, fibras e rotina no banheiro; tratar a constipação costuma melhorar a enurese e o escape fecal.' },
    { sub: 'Sinais urinários de alerta', min: 4, msg: 'Sinais urinários presentes: priorizar avaliação médica (exame de urina, descartar ITU/causas orgânicas).' }
  ];

  var KW = ['xixi', 'xixi na cama', 'enurese', 'enurese noturna', 'faz xixi nas calcas', 'escape de xixi',
    'perde xixi', 'desfralde', 'penico', 'controle esfincteriano', 'coco', 'constipacao', 'prisao de ventre',
    'segura o coco', 'encoprese', 'escape de fezes', 'suja a roupa', 'infeccao urinaria', 'itu',
    'dor para urinar', 'bexiga', 'intestino', 'nao avisa para fazer xixi'];

  function mk(b) {
    var score_max = (O.length - 1) * b.items.length;
    return {
      id: b.id, anchor: b.id,
      title: '🚽 Controle Esfincteriano NeuroPed · ' + b.band + ' (' + b.code + ')',
      short_title: b.code + ' · Controle Esfincteriano ' + b.sigla,
      emoji: '🚽', code: b.code, sigla: 'CEN ' + b.sigla,
      audience: 'familia', audience_label: 'Pais/cuidador',
      age_band: b.band, age_min_months: b.min, age_max_months: b.max,
      periodo: 'Últimas 4 semanas',
      domain: 'Controle esfincteriano (enurese/encoprese)',
      finalidade: 'Triagem do controle esfincteriano nos 7 eixos (hábito/autonomia, xixi de dia, xixi à noite, constipação/retenção, escape fecal, sinais urinários de alerta e impacto), com itens próprios por faixa etária. Controle noturno só é esperado a partir de ~5 anos.',
      symptoms: ['xixi na cama (enurese noturna)', 'escapes de xixi de dia', 'constipação/retenção fecal', 'escape de fezes (encoprese)'],
      complaints: KW, keywords: KW.concat([b.code, 'CEN', 'autoral', 'neuroped']),
      nature: 'autoral', kind: 'autoral controle esfincteriano', applicable: true, npe: true, restrito: false, aviso: false,
      page: 'instrumento-autoral.html', priority: 184,
      options: opts(O), items: b.items, labels: O,
      domains: SYS.map(function (name, k) { return { name: name, items: b.items.slice(k * 3, k * 3 + 3) }; }),
      subs: subsFor(), cutoffs: CUTOFFS, traps: TRAPS, suggest: SUGGEST,
      score_max: score_max,
      plain_questions: b.items,
      clinical_use: 'Triagem do controle de xixi e cocô por faixa etária, separando os eixos urinário (diurno/noturno) e intestinal (constipação/encoprese), com sinais de alerta, para orientar conduta e encaminhamento.',
      differentiator: 'Único instrumento do app dedicado ao controle esfincteriano, varrendo 7 eixos por faixa etária (2–3, 4–5, 6–8, 9–11, 12–17), distinguindo enurese, constipação e encoprese, com sinais urinários de alerta.',
      not_normative_disclaimer: DISC
    };
  }

  var INST = BANDS.map(mk);
  var base = Array.isArray(window.NEUROPED_EDITORIAL_SCALES) ? window.NEUROPED_EDITORIAL_SCALES : [];
  var ids = {}; base.forEach(function (x) { if (x && x.id) ids[x.id] = 1; });
  var add = INST.filter(function (x) { return !ids[x.id]; });
  window.NEUROPED_EDITORIAL_SCALES = add.concat(base);
  window.NEUROPED_CONTROLE_ESFINCTER = add;
  window.NEUROPED_CONTROLE_ESFINCTER_COUNT = add.length;
})();
