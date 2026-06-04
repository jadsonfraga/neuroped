/* NeuroPed EDJ — Comportamento Alimentar NeuroPed (CAL) · AUTORAL.
 * --------------------------------------------------------------------------
 * Triagem do comportamento alimentar por faixa etária (0–2, 3–5, 6–8, 9–11,
 * 12–17), varrendo 7 eixos: seletividade/variedade, apetite/volume, comportamento
 * à mesa, habilidades de comer (mastigar/engolir), rituais e rigidez, sinais de
 * alerta clínicos, e impacto/contexto. Foco no COMPORTAMENTO alimentar e em
 * sinais de ARFID — complementa (não repete) a triagem sensorial de alimentação.
 * Itens autorais do Dr. Jadson Fraga; direção única (maior frequência = mais
 * atenção). Renderiza em escala.html (via `domains`) e no autoral.
 */
(function () {
  'use strict';
  if (window.NEUROPED_COMP_ALIMENTAR_LOADED) return;
  window.NEUROPED_COMP_ALIMENTAR_LOADED = true;

  var DISC = 'Triagem autoral NeuroPed EDJ do comportamento alimentar (itens próprios, por faixa etária). NÃO é normatizada nem diagnóstica e complementa — não substitui — a avaliação de pediatria, nutrição, fonoaudiologia e terapia ocupacional. Os valores são pontos de atenção operacional, não pontos de corte. Engasgos ou vômitos ao comer, baixo ganho de peso/emagrecimento, restrição rápida e intensa, dor para engolir ou sinais de transtorno alimentar exigem avaliação médica e nutricional.';

  var O = ['Nunca ou quase nunca', 'Às vezes', 'Frequentemente', 'Quase sempre / todos os dias'];
  function opts(arr) { return arr.map(function (l, i) { return { label: l, value: i }; }); }

  // 7 eixos (ordem fixa; 3 itens cada → 21). idx de subs/traps seguem esta ordem.
  var SYS = [
    'Seletividade e variedade',
    'Apetite e volume',
    'Comportamento à mesa',
    'Habilidades de comer (mastigar/engolir)',
    'Rituais e rigidez alimentar',
    'Sinais de alerta clínicos',
    'Impacto e contexto'
  ];

  var BANDS = [
    {
      id: 'cal-alim-0-2', code: 'CAL-B1', sigla: '0–2 anos', band: '0–2 anos', min: 0, max: 35,
      items: [
        // Seletividade
        'Recusa muitos alimentos ou aceita uma variedade muito pequena para a idade?',
        'Rejeita alimentos novos quase sempre (não aceita experimentar)?',
        'Aceitou variedade e foi restringindo (a lista de alimentos diminuindo)?',
        // Apetite/volume
        'Mama ou come muito pouco para a idade (apetite muito baixo)?',
        'Dá poucos sinais de fome e saciedade (difícil saber quando quer comer)?',
        'Demora muito tempo para mamar ou comer cada refeição?',
        // Comportamento à mesa
        'As refeições são difíceis, com choro, recusa ou estresse?',
        'Só aceita comer com distração (colo, brinquedo, movimento)?',
        'Vira o rosto, cospe ou empurra a comida com frequência?',
        // Habilidades
        'Tem dificuldade para sugar ou pegar bem o peito/bico?',
        'Engasga, tosse ou "se afoga" ao mamar ou ao comer?',
        'Tem dificuldade para evoluir de texturas (pastoso → pedaços) na idade esperada?',
        // Rigidez
        'Só aceita o alimento de um jeito específico (marca, temperatura, recipiente)?',
        'Recusa quando os alimentos se misturam ou mudam de aparência?',
        'Come sempre os mesmos poucos alimentos, repetidamente?',
        // Sinais de alerta
        'Vomita com frequência durante ou após as refeições?',
        'Está ganhando pouco peso ou crescendo abaixo do esperado?',
        'Faz careta de dor, arqueia o corpo ou parece sentir dor ao comer?',
        // Impacto
        'As refeições geram muito estresse ou choro na família?',
        'É preciso forçar, "fazer aviãozinho" ou insistir muito para alimentar?',
        'A alimentação atrapalha a rotina ou a convivência?'
      ]
    },
    {
      id: 'cal-alim-3-5', code: 'CAL-B2', sigla: '3–5 anos', band: '3–5 anos', min: 36, max: 71,
      items: [
        'Aceita poucos alimentos (cardápio bem restrito) para a idade?',
        'Recusa experimentar alimentos novos quase sempre (neofobia)?',
        'A lista de alimentos aceitos vem diminuindo com o tempo?',
        'Come muito pouco nas refeições (apetite baixo)?',
        'Tem sinais de fome e saciedade pouco claros (não pede, ou come sem parar)?',
        'Demora demais (mais de 30–40 min) para terminar de comer?',
        'As refeições são uma "batalha", com recusa, birra ou estresse?',
        'Só come com tela, brinquedo ou andando (precisa de distração)?',
        'Levanta o tempo todo e não fica sentado(a) para comer?',
        'Tem dificuldade para mastigar (engole inteiro, segura na bochecha)?',
        'Engasga, tosse ou tem ânsia ao comer certos alimentos/texturas?',
        'Tem dificuldade para usar talheres ou copo conforme a idade?',
        'Só aceita marcas ou apresentações específicas (corte, prato, temperatura)?',
        'Recusa quando os alimentos se encostam ou mudam de aparência?',
        'Come quase sempre os mesmos pratos, repetidamente?',
        'Vomita ou tem ânsia frequente nas refeições?',
        'Está com baixo ganho de peso ou crescimento abaixo do esperado?',
        'Reclama de dor para engolir ou na barriga ligada à comida?',
        'As refeições em família são fonte de estresse e conflito?',
        'É preciso forçar, subornar ou pressionar para a criança comer?',
        'A seletividade impede comer fora, na escola ou em festas?'
      ]
    },
    {
      id: 'cal-alim-6-8', code: 'CAL-B3', sigla: '6–8 anos', band: '6–8 anos', min: 72, max: 107,
      items: [
        'Mantém um cardápio restrito, recusando muitos grupos de alimentos?',
        'Recusa experimentar coisas novas quase sempre?',
        'O repertório de alimentos vem diminuindo (eliminando itens)?',
        'Come pouco ou sem apetite na maioria das refeições?',
        'Tem percepção pobre de fome e saciedade (pula refeições ou exagera)?',
        'Demora demais para comer (refeições muito longas)?',
        'As refeições geram conflito, recusa ou negociação constante?',
        'Precisa de tela ou distração para comer?',
        'Não permanece sentado(a) e foge das refeições?',
        'Tem dificuldade de mastigação (engole inteiro, acumula na boca)?',
        'Engasga, tosse ou tem ânsia com certas texturas?',
        'Tem dificuldade ou desajeito com talheres para a idade?',
        'Exige preparo/apresentação específicos e recusa fora do padrão?',
        'Não aceita alimentos que se toquem ou se misturem no prato?',
        'Repete sempre os mesmos pratos, com pouca flexibilidade?',
        'Vomita, tem ânsia ou dor ligadas às refeições?',
        'Tem baixo peso, emagrecimento ou crescimento abaixo do esperado?',
        'A restrição é tão intensa que preocupa a nutrição (faltam grupos inteiros)?',
        'As refeições em família são tensas e conflituosas?',
        'É preciso pressionar ou forçar para a criança comer?',
        'A alimentação limita escola, festas, viagens e vida social?'
      ]
    },
    {
      id: 'cal-alim-9-11', code: 'CAL-B4', sigla: '9–11 anos', band: '9–11 anos', min: 108, max: 143,
      items: [
        'Tem repertório alimentar restrito para a idade, recusando muitos alimentos?',
        'Evita experimentar alimentos novos quase sempre?',
        'Vem eliminando alimentos que antes aceitava?',
        'Tem apetite muito baixo (come pouco) na maioria das refeições?',
        'Tem regulação pobre de fome e saciedade (pula refeições ou come demais)?',
        'As refeições se arrastam por muito tempo?',
        'As refeições geram conflito ou negociação constantes?',
        'Depende de telas ou distração para comer?',
        'Evita refeições em família ou foge da mesa?',
        'Tem dificuldade de mastigar ou engolir certos alimentos?',
        'Engasga, tem ânsia ou medo de engasgar?',
        'Tem desajeito relevante para se servir ou usar talheres?',
        'Exige marcas/apresentações específicas, recusando fora do padrão?',
        'Não tolera alimentos misturados ou que se toquem?',
        'Mantém-se preso(a) a poucos pratos, com muita rigidez?',
        'Tem vômitos, dor ou medo de engasgar ligados a comer?',
        'Tem perda de peso, baixo crescimento ou restrição rápida e intensa recente?',
        'A dieta é tão restrita que compromete a nutrição (grupos inteiros ausentes)?',
        'As refeições são fonte de conflito familiar?',
        'É preciso pressionar ou forçar a comer?',
        'A alimentação prejudica vida social, escola ou viagens?'
      ]
    },
    {
      id: 'cal-alim-12-17', code: 'CAL-B5', sigla: '12–17 anos', band: '12–17 anos', min: 144, max: 215,
      items: [
        'Mantém repertório alimentar restrito ou seletivo para a idade?',
        'Evita experimentar alimentos novos?',
        'Vem restringindo alimentos progressivamente?',
        'Tem apetite muito baixo ou pula refeições com frequência?',
        'Tem regulação pobre de fome e saciedade (restringe muito ou come em excesso)?',
        'Leva tempo excessivo ou evita o momento das refeições?',
        'Evita refeições em família ou come isolado(a)?',
        'Depende de telas ou distração para comer?',
        'As refeições geram tensão ou conflito?',
        'Tem dificuldade de mastigar/engolir ou medo de engasgar?',
        'Tem ânsia ou náusea ao comer certos alimentos/texturas?',
        'Evita comer em público por insegurança com o ato de comer?',
        'Exige preparo/apresentação específicos, recusando fora do padrão?',
        'Não tolera misturas ou alimentos que se toquem?',
        'Mantém rigidez intensa (poucos alimentos, regras próprias)?',
        'Tem vômitos, dor, medo de engasgar ou restrição rápida e intensa?',
        'Tem perda de peso, baixo crescimento ou preocupação nutricional?',
        'Há sinais de relação disfuncional com a comida ou a imagem corporal (alerta para transtorno alimentar)?',
        'As refeições geram conflito familiar importante?',
        'Há pressão ou cobrança intensa em torno do comer?',
        'A alimentação prejudica vida social, escola/trabalho ou saúde?'
      ]
    }
  ];

  function subsFor() { return SYS.map(function (name, k) { return { name: name, idx: [k * 3, k * 3 + 1, k * 3 + 2] }; }); }

  var CUTOFFS = [
    { max: 10, label: 'Comportamento alimentar dentro do esperado nesta triagem', cls: 'ok' },
    { max: 24, label: 'Sinais leves de dificuldade alimentar — orientar e observar', cls: 'warn' },
    { max: 42, label: 'Dificuldade alimentar relevante — avaliação indicada (pediatria/nutrição/fono/TO)', cls: 'risk' },
    { max: 63, label: 'Dificuldade importante — avaliar ARFID e impacto nutricional; avaliação especializada prioritária', cls: 'risk' }
  ];

  var TRAPS = [
    { idx: [9, 10, 11], min: 2, level: 'prioritario', msg: 'Engasgos, tosse, ânsia/vômito ao comer ou dificuldade de mastigar e engolir: risco de aspiração/disfagia — avaliação de fonoaudiologia/pediatria e cuidado com as texturas.' },
    { idx: [15, 16, 17], min: 2, level: 'prioritario', msg: 'Sinais de alerta (baixo peso/crescimento, restrição rápida e intensa, dor ao engolir, recusa que compromete a nutrição): avaliar ARFID e — em adolescentes — também transtorno alimentar; avaliação médica e nutricional.' },
    { idx: [0, 1, 2], min: 3, msg: 'Seletividade muito intensa (cardápio mínimo, recusa ampla e estável): impacto nutricional e social — abordagem multiprofissional (nutrição, fonoaudiologia/TO, comportamental).' },
    { idx: [18, 19, 20], min: 2, msg: 'Refeições com muita pressão/conflito ou impossibilidade de comer fora/na escola: evitar forçar — estruturar refeições previsíveis e considerar apoio comportamental.' }
  ];

  var SUGGEST = [
    { sub: 'Sinais de alerta clínicos', min: 4, msg: 'Sinais de alerta presentes: priorizar avaliação médica e nutricional (crescimento, exames, descartar causa orgânica).' },
    { sub: 'Seletividade e variedade', min: 6, msg: 'Predomínio de seletividade: exposição gradual sem pressão para ampliar o repertório; considerar fono/TO se houver base sensório-motora.' },
    { sub: 'Habilidades de comer (mastigar/engolir)', min: 6, msg: 'Predomínio em mastigação/deglutição: avaliação de fonoaudiologia (disfagia / motricidade orofacial).' }
  ];

  var KW = ['alimentacao', 'comer', 'nao come', 'recusa alimentar', 'seletividade', 'seletivo', 'come pouco',
    'sem apetite', 'inapetencia', 'birra para comer', 'dificuldade de mastigar', 'engasga', 'vomita ao comer',
    'arfid', 'cardapio restrito', 'nao experimenta', 'forca para comer', 'refeicao', 'seletividade alimentar',
    'baixo peso', 'nao ganha peso', 'transtorno alimentar'];

  function mk(b) {
    var score_max = (O.length - 1) * b.items.length;
    return {
      id: b.id, anchor: b.id,
      title: '🍽️ Comportamento Alimentar NeuroPed · ' + b.band + ' (' + b.code + ')',
      short_title: b.code + ' · Comportamento Alimentar ' + b.sigla,
      emoji: '🍽️', code: b.code, sigla: 'CAL ' + b.sigla,
      audience: 'familia', audience_label: 'Pais/cuidador',
      age_band: b.band, age_min_months: b.min, age_max_months: b.max,
      periodo: 'Últimas 4 semanas',
      domain: 'Comportamento alimentar (seletividade/ARFID)',
      finalidade: 'Triagem do comportamento alimentar nos 7 eixos (seletividade, apetite, comportamento à mesa, habilidades de mastigar/engolir, rigidez, sinais de alerta e impacto), com itens próprios por faixa etária, sinalizando ARFID e risco nutricional.',
      symptoms: ['cardápio muito restrito / recusa alimentar', 'come pouco / sem apetite', 'engasgos ou dificuldade de mastigar', 'refeições com conflito/pressão'],
      complaints: KW, keywords: KW.concat([b.code, 'CAL', 'autoral', 'neuroped']),
      nature: 'autoral', kind: 'autoral comportamento alimentar', applicable: true, npe: true, restrito: false, aviso: false,
      page: 'instrumento-autoral.html', priority: 184,
      options: opts(O), items: b.items, labels: O,
      domains: SYS.map(function (name, k) { return { name: name, items: b.items.slice(k * 3, k * 3 + 3) }; }),
      subs: subsFor(), cutoffs: CUTOFFS, traps: TRAPS, suggest: SUGGEST,
      score_max: score_max,
      plain_questions: b.items,
      clinical_use: 'Triagem do comportamento alimentar por faixa etária para mapear seletividade, apetite, habilidades de comer e sinais de alerta nutricional, orientando conduta e encaminhamento (nutrição/fono/TO/pediatria).',
      differentiator: 'Foca o COMPORTAMENTO alimentar e sinais de ARFID por faixa etária (0–2, 3–5, 6–8, 9–11, 12–17) — complementa a triagem sensorial de alimentação, sem reproduzi-la, com eixos de mastigação/deglutição e alerta nutricional.',
      not_normative_disclaimer: DISC
    };
  }

  var INST = BANDS.map(mk);
  var base = Array.isArray(window.NEUROPED_EDITORIAL_SCALES) ? window.NEUROPED_EDITORIAL_SCALES : [];
  var ids = {}; base.forEach(function (x) { if (x && x.id) ids[x.id] = 1; });
  var add = INST.filter(function (x) { return !ids[x.id]; });
  window.NEUROPED_EDITORIAL_SCALES = add.concat(base);
  window.NEUROPED_COMP_ALIMENTAR = add;
  window.NEUROPED_COMP_ALIMENTAR_COUNT = add.length;
})();
