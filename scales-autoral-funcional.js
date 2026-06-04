/* NeuroPed EDJ — Instrumentos AUTORAIS Dr. Jadson: funcional/adaptativo,
 * risco cognitivo e risco de dislexia.
 * --------------------------------------------------------------------------
 * Conteúdo 100% autoral (perguntas originais sobre o construto). NÃO reproduz
 * itens de instrumentos de terceiros (ex.: Vineland é proprietário). Triagem
 * de apoio à decisão — não diagnostica.
 */
(function () {
  'use strict';
  if (window.NEUROPED_AUTORAL_FUNCIONAL_LOADED) return;
  window.NEUROPED_AUTORAL_FUNCIONAL_LOADED = true;

  var INST = [
    {
      id: 'jf-autonomia-idade',
      title: '🧗 Autonomia e Independência por idade (NeuroPed)',
      short_title: 'Autonomia e Independência',
      emoji: '🧗', audience: 'familia', audience_label: 'Família/Escola',
      age_band: '0–18+ anos', age_min_months: 0, age_max_months: 960,
      domain: 'Autonomia e funcionamento adaptativo',
      complaints: ['autonomia', 'independencia', 'adaptativo', 'vida diaria', 'avd', 'autocuidado', 'depende', 'nao faz sozinho', 'vestir', 'come sozinho', 'banheiro'],
      symptoms: ['depende para tarefas da idade', 'não realiza autocuidado esperado', 'pouca autonomia'],
      keywords: ['autonomia', 'independencia', 'adaptativo', 'comportamento adaptativo', 'vida diaria', 'autocuidado'],
      plain_questions: [
        'Come sozinho(a) de forma compatível com a idade (talheres, copo)?',
        'Cuida da própria higiene esperada para a idade (lavar mãos, escovar dentes, banho com supervisão adequada)?',
        'Veste-se e calça sapatos com a independência esperada para a idade?',
        'Avisa ou vai ao banheiro sozinho(a) conforme a idade?',
        'Comunica suas necessidades e vontades de forma clara para a idade?',
        'Cumpre pequenas tarefas e combinados da rotina sem precisar repetir muito?',
        'Organiza seus pertences (mochila, brinquedos, quarto) conforme a idade?',
        'Tem a noção de segurança esperada (rua, tomada, estranhos) para a idade?',
        'Desloca-se com a independência esperada para a idade (casa, escola, trajetos)?',
        'Resolve pequenos problemas do dia a dia sem depender totalmente do adulto?',
        'Maiores/adolescentes: administra tempo, dinheiro e compromissos básicos?',
        'No geral, a autonomia está compatível com a idade ou abaixo do esperado?'
      ],
      clinical_use: 'Triagem do funcionamento adaptativo e da autonomia em relação ao esperado para a idade, por relato de família/escola.',
      differentiator: 'Mede INDEPENDÊNCIA FUNCIONAL por faixa etária (autocuidado, comunicação, vida diária, segurança), não só sintomas.',
      not_normative_disclaimer: 'Instrumento autoral de triagem; não substitui avaliação formal do comportamento adaptativo nem instrumento normatizado.',
      page: 'instrumento.html', priority: 190
    },
    {
      id: 'jf-risco-cognitivo',
      title: '🧠 Triagem de risco cognitivo — nível de desenvolvimento por idade (NeuroPed)',
      short_title: 'Risco cognitivo / nível de desenvolvimento',
      emoji: '🧠', audience: 'familia', audience_label: 'Família/Clínico',
      age_band: '1–18 anos', age_min_months: 12, age_max_months: 215,
      domain: 'Desenvolvimento cognitivo (triagem de risco)',
      complaints: ['cognicao', 'atraso cognitivo', 'deficiencia intelectual', 'atraso global', 'idade mental', 'aprende devagar', 'imaturo', 'atrasado para a idade', 'atraso de desenvolvimento'],
      symptoms: ['atraso em vários marcos', 'raciocínio abaixo da idade', 'aprende mais devagar que os colegas'],
      keywords: ['cognicao', 'atraso cognitivo', 'deficiencia intelectual', 'atraso global do desenvolvimento', 'nivel de desenvolvimento'],
      plain_questions: [
        'A fala e a compreensão estão no nível esperado para a idade?',
        'O raciocínio e a resolução de problemas acompanham a idade?',
        'A criança aprende coisas novas no ritmo dos colegas da mesma idade?',
        'Brinca de forma compatível com a idade (faz-de-conta, regras, complexidade)?',
        'A autonomia (autocuidado, vida diária) está no nível da idade?',
        'Houve atraso para alcançar marcos importantes (andar, falar, frases)?',
        'A criança parece "mais nova" que a idade em várias áreas ao mesmo tempo?',
        'Já perdeu habilidades que antes tinha (regressão)?',
        'Precisa de muito mais apoio e repetição que os colegas para aprender?',
        'A dificuldade aparece em CASA e na ESCOLA (vários ambientes)?',
        'Há fatores de risco na história (prematuridade, intercorrência no parto, causa genética)?',
        'No geral, o nível de desenvolvimento parece compatível com a idade ou abaixo?'
      ],
      clinical_use: 'Triagem de SINAL DE ALERTA para atraso global do desenvolvimento / risco de deficiência intelectual: estima descompasso entre o nível de desenvolvimento e a idade cronológica, em vários domínios.',
      differentiator: 'Compara funcionamento × idade em múltiplos domínios (linguagem, raciocínio, aprendizagem, autonomia, brincar) para sinalizar quando indicar avaliação cognitiva/adaptativa formal.',
      not_normative_disclaimer: 'Triagem autoral de RISCO — NÃO mede QI, NÃO mede "idade mental" e NÃO diagnostica deficiência intelectual. Resultado abaixo do esperado indica encaminhamento para avaliação neuropsicológica/multiprofissional formal.',
      page: 'instrumento.html', priority: 188
    },
    {
      id: 'jf-dislexia-risco',
      title: '📖 Triagem de risco de dislexia — leitura e escrita (NeuroPed)',
      short_title: 'Risco de dislexia',
      emoji: '📖', audience: 'familia', audience_label: 'Família/Escola',
      age_band: '5–14 anos', age_min_months: 60, age_max_months: 168,
      domain: 'Aprendizagem — leitura e escrita (dislexia)',
      complaints: ['dislexia', 'leitura', 'escrita', 'le devagar', 'troca letras', 'nao le', 'dificuldade de leitura', 'soletra', 'alfabetizacao', 'inverte letras'],
      symptoms: ['lê devagar/silabando', 'troca ou inverte letras', 'erros de escrita persistentes'],
      keywords: ['dislexia', 'leitura', 'escrita', 'consciencia fonologica', 'transtorno de leitura'],
      plain_questions: [
        'Demorou a falar ou trocou muitos sons quando menor?',
        'Tem dificuldade de perceber rimas e sons das palavras (consciência fonológica)?',
        'Confunde letras parecidas (b/d, p/q) ou inverte ao ler/escrever?',
        'Lê mais devagar, silabando ou adivinhando, comparado aos colegas?',
        'Comete muitos erros de escrita que persistem apesar do ensino?',
        'Tem dificuldade de entender o que leu, mesmo conseguindo decodificar?',
        'O esforço para ler/escrever é muito maior que o resultado obtido?',
        'Evita ler em voz alta, lição de leitura/escrita, ou se frustra muito?',
        'A dificuldade contrasta com bom desempenho em outras áreas (oral, raciocínio)?',
        'Há histórico de dislexia ou dificuldade de leitura na família?',
        'A dificuldade persiste há mais de um ano apesar de apoio?',
        'No geral, a leitura/escrita está bem abaixo do esperado para a série?'
      ],
      clinical_use: 'Triagem de sinais de risco para dislexia (transtorno específico de leitura), por relato de família/escola.',
      differentiator: 'Foca a tríade da dislexia: consciência fonológica + decodificação/velocidade + discrepância esforço×resultado, com história familiar.',
      not_normative_disclaimer: 'Triagem autoral; NÃO diagnostica dislexia. Sinais positivos indicam avaliação psicopedagógica, fonoaudiológica e/ou neuropsicológica formal.',
      page: 'instrumento.html', priority: 186
    }
  ];

  var base = Array.isArray(window.NEUROPED_EDITORIAL_SCALES) ? window.NEUROPED_EDITORIAL_SCALES : [];
  var ids = {}; base.forEach(function (x) { if (x && x.id) ids[x.id] = 1; });
  var add = INST.filter(function (x) { return !ids[x.id]; });
  window.NEUROPED_EDITORIAL_SCALES = add.concat(base);
  window.NEUROPED_AUTORAL_FUNCIONAL = add;
})();
