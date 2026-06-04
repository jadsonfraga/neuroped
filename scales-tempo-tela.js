/* NeuroPed EDJ — Tempo de Tela e Hábitos Digitais NeuroPed (HDN) · AUTORAL.
 * --------------------------------------------------------------------------
 * Triagem do uso de telas por faixa etária (0–2, 3–5, 6–8, 9–11, 12–17),
 * varrendo 7 dimensões do hábito digital: quantidade/onipresença, conflito ao
 * limitar, sono, substituição de atividades, refeições/rotina, conteúdo e
 * segurança, e impacto no humor/atenção. Itens 100% autorais do Dr. Jadson
 * Fraga; direção única (maior frequência = mais atenção). Renderiza no fluxo
 * comum (escala.html, via `domains`) e no autoral (instrumento-autoral.html).
 */
(function () {
  'use strict';
  if (window.NEUROPED_TEMPO_TELA_LOADED) return;
  window.NEUROPED_TEMPO_TELA_LOADED = true;

  var DISC = 'Triagem autoral NeuroPed EDJ de hábitos digitais (itens próprios, por faixa etária). NÃO é normatizada nem diagnostica "dependência de telas"/transtorno de jogos. Os valores são pontos de atenção operacional, não pontos de corte, e servem para orientar a conversa familiar sobre limites, sono e segurança digital. Em impacto importante (sono, humor, escola, segurança), indica avaliação clínica.';

  var O = ['Nunca ou quase nunca', 'Às vezes', 'Frequentemente', 'Quase sempre / todos os dias'];
  function opts(arr) { return arr.map(function (l, i) { return { label: l, value: i }; }); }

  // 7 dimensões (ordem fixa; 3 itens cada → 21). idx de subs/traps seguem esta ordem.
  var SYS = [
    'Quantidade e onipresença',
    'Conflito ao limitar',
    'Sono e telas',
    'Substituição de atividades',
    'Refeições e rotina',
    'Conteúdo e segurança',
    'Impacto no humor e na atenção'
  ];

  var BANDS = [
    {
      id: 'hdn-tela-0-2', code: 'HDN-B1', sigla: '0–2 anos', band: '0–2 anos', min: 0, max: 35,
      items: [
        // Quantidade
        'Passa algum tempo diante de telas (TV, celular, tablet) em um dia comum?',
        'Fica com a TV ou telas ligadas "de fundo" no ambiente durante boa parte do dia?',
        'Recebe o celular/tablet para se distrair ou se acalmar (no carro, fila, choro)?',
        // Conflito
        'Fica muito irritado(a) ou chora quando a tela é desligada ou retirada?',
        'Já é difícil tirar a criança da tela depois que ela começa a usar?',
        'Procura ou pede a tela ativamente (aponta, busca o aparelho)?',
        // Sono
        'Usa telas perto da hora de dormir ou para adormecer?',
        'Há TV ou telas ligadas no quarto onde a criança dorme?',
        'O sono parece pior nos dias de mais tela (demora a dormir, mais agitado)?',
        // Substituição
        'A tela substitui o brincar livre, o colo ou a interação com adultos?',
        'Fica em telas em vez de explorar brinquedos e o ambiente?',
        'Tem menos conversa e troca de olhares com os pais por causa da tela?',
        // Refeições
        'É alimentado(a) olhando para a tela?',
        'A tela é usada para a criança aceitar a comida?',
        'As refeições em família acontecem com telas ligadas?',
        // Conteúdo e segurança
        'Assiste a vídeos muito acelerados (muitos cortes, cores e sons fortes)?',
        'Usa telas sozinho(a), sem um adulto por perto mediando?',
        'O conteúdo não é pensado para a idade (vídeos aleatórios, reprodução automática)?',
        // Impacto
        'Fica mais agitado(a) ou irritadiço(a) depois de usar telas?',
        'Tem dificuldade de se concentrar em brincadeiras quando não há tela?',
        'A linguagem ou a atenção parecem abaixo do esperado junto do uso intenso de telas?'
      ]
    },
    {
      id: 'hdn-tela-3-5', code: 'HDN-B2', sigla: '3–5 anos', band: '3–5 anos', min: 36, max: 71,
      items: [
        'Passa mais de 1 hora por dia em telas (TV, jogos, vídeos)?',
        'Tem telas ligadas "de fundo" em boa parte do dia em casa?',
        'Recebe a tela como recurso para se acalmar ou ficar quieto(a)?',
        'Faz birra, chora ou se descontrola quando a tela é desligada?',
        'É muito difícil cumprir o combinado de tempo de tela?',
        'Pede telas de forma insistente ao longo do dia?',
        'Usa telas na hora que antecede o sono?',
        'Há tela (TV/tablet) no quarto onde dorme?',
        'Dorme pior ou demora mais a dormir nos dias de mais tela?',
        'Prefere a tela a brincar, desenhar ou brincar com outras crianças?',
        'Reduziu brincadeiras ativas/ao ar livre por causa das telas?',
        'Fica entediado(a) ou "sem saber brincar" quando está sem uma tela?',
        'Come olhando para a tela (refeições com tela ligada)?',
        'Só aceita comer com a tela como distração?',
        'As refeições em família têm telas ligadas?',
        'Assiste a conteúdo não adequado à idade (violência, vídeos aleatórios)?',
        'Usa telas sozinho(a), sem supervisão de um adulto?',
        'O conteúdo é muito acelerado ou excitante (autoplay, vídeos curtos em sequência)?',
        'Fica agitado(a), irritado(a) ou "elétrico(a)" depois de usar telas?',
        'Tem dificuldade de manter a atenção ou brincar com calma sem tela?',
        'As telas atrapalham a rotina (tarefas, banho, sair de casa)?'
      ]
    },
    {
      id: 'hdn-tela-6-8', code: 'HDN-B3', sigla: '6–8 anos', band: '6–8 anos', min: 72, max: 107,
      items: [
        'Passa mais de 2 horas por dia em telas de lazer (fora as atividades escolares)?',
        'Usa telas em quase todos os momentos livres do dia?',
        'Recorre à tela sempre que fica ocioso(a) ou entediado(a)?',
        'Reage com raiva ou explosão quando você limita ou desliga a tela?',
        'É um conflito diário cumprir o tempo de tela combinado?',
        'Esconde ou burla limites para continuar usando (pega escondido)?',
        'Usa telas na última hora antes de dormir?',
        'Tem tela (TV, tablet, videogame) no quarto?',
        'Dorme menos ou pior por causa do uso de telas (vai dormir tarde)?',
        'Troca brincadeiras, esportes ou amigos por tempo de tela?',
        'Faz menos atividade física por causa das telas?',
        'Perdeu interesse por brincadeiras e hobbies que não sejam telas?',
        'Come olhando telas (refeições com celular/TV)?',
        'Resiste a comer sem uma tela por perto?',
        'As refeições em família ocorrem com telas ligadas?',
        'Acessa conteúdo inadequado para a idade (violência, classificação acima)?',
        'Usa internet ou jogos online sem supervisão?',
        'Já teve contato com estranhos ou situações de risco online (chat, jogos)?',
        'Fica mais irritado(a)/agitado(a) ou "desliga do mundo" com as telas?',
        'A atenção e o desempenho escolar pioram com o uso de telas?',
        'As telas geram brigas e tensão frequentes em casa?'
      ]
    },
    {
      id: 'hdn-tela-9-11', code: 'HDN-B4', sigla: '9–11 anos', band: '9–11 anos', min: 108, max: 143,
      items: [
        'Passa mais de 2 a 3 horas por dia em telas de lazer (fora o estudo)?',
        'Está conectado(a) em quase todo o tempo livre (celular sempre à mão)?',
        'Pega o celular automaticamente ao acordar ou ao ficar ocioso(a)?',
        'Reage com irritação ou explosão quando você limita o uso?',
        'Cumprir limites de tela é um conflito constante?',
        'Burla regras (usa escondido, mente sobre o tempo de uso)?',
        'Usa telas na cama ou antes de dormir?',
        'Leva o celular/tablet para o quarto à noite?',
        'Dorme tarde ou pouco por causa de telas (jogos, vídeos, redes)?',
        'Prefere telas a atividades físicas, presenciais ou hobbies?',
        'Reduziu o convívio presencial com amigos/família por causa das telas?',
        'Abandonou interesses que não envolvem telas?',
        'Come com o celular ou telas durante as refeições?',
        'Isola-se com telas durante as refeições em família?',
        'As refeições da casa têm telas ligadas com frequência?',
        'Acessa conteúdo inadequado para a idade (violência, sexual, classificação acima)?',
        'Usa redes ou jogos online sem supervisão ou abaixo da idade permitida?',
        'Já houve contato com estranhos, exposição de dados ou bullying online?',
        'Fica irritado(a), ansioso(a) ou agitado(a) ligado ao uso ou à limitação de telas?',
        'O rendimento escolar e a atenção pioram com o tempo de tela?',
        'O uso de telas gera conflitos e afastamento na família?'
      ]
    },
    {
      id: 'hdn-tela-12-17', code: 'HDN-B5', sigla: '12–17 anos', band: '12–17 anos', min: 144, max: 215,
      items: [
        'Passa mais de 3 horas por dia em telas de lazer (fora estudo/trabalho)?',
        'Fica conectado(a) praticamente o tempo todo (checa o celular sem parar)?',
        'Sente necessidade de estar sempre on-line (ansiedade se fica sem o celular)?',
        'Reage com irritação ou agressividade quando você tenta limitar o uso?',
        'Limitar telas é fonte de conflito constante?',
        'Mente ou esconde o quanto e como usa as telas?',
        'Usa telas na cama, atrasando o horário de dormir?',
        'Mantém o celular no quarto e o usa de madrugada?',
        'Dorme pouco ou mal por causa de jogos, vídeos ou redes sociais?',
        'Prefere telas a sair, praticar atividade física ou conviver presencialmente?',
        'Reduziu amizades ou atividades presenciais por causa das telas?',
        'Abandonou hobbies e responsabilidades por causa do uso?',
        'Come quase sempre com o celular ou telas?',
        'Isola-se com telas nas refeições em família?',
        'Usa telas o tempo todo, inclusive em momentos sociais?',
        'Acessa conteúdo de risco (violento, sexual, automutilação, apostas)?',
        'Usa redes ou jogos sem critérios de segurança e privacidade?',
        'Já houve exposição, contato com estranhos, bullying ou assédio online?',
        'Fica irritado(a), ansioso(a) ou para baixo ligado ao uso ou à abstinência de telas?',
        'O desempenho escolar ou ocupacional cai por causa das telas?',
        'As telas prejudicam o humor, a autoestima ou as relações?'
      ]
    }
  ];

  function subsFor() { return SYS.map(function (name, k) { return { name: name, idx: [k * 3, k * 3 + 1, k * 3 + 2] }; }); }

  var CUTOFFS = [
    { max: 10, label: 'Uso de telas dentro do esperado nesta triagem', cls: 'ok' },
    { max: 24, label: 'Sinais leves de uso excessivo — orientar limites e higiene digital', cls: 'warn' },
    { max: 42, label: 'Uso problemático relevante — plano de redução e estrutura familiar', cls: 'risk' },
    { max: 63, label: 'Uso disfuncional importante — abordar impacto (sono/humor/atenção) e dependência de telas', cls: 'risk' }
  ];

  var TRAPS = [
    { idx: [3, 4, 5], min: 2, msg: 'Perda de controle ou explosões ao limitar telas: marcador de uso problemático — combinar limites previsíveis, evitar a tela como único calmante e definir um plano familiar (horários, locais, telas fora do quarto).' },
    { idx: [6, 7, 8], min: 2, level: 'prioritario', msg: 'Telas à noite ou no quarto: das maiores inimigas do sono — retirar telas do quarto e suspender o uso cerca de 1 hora antes de dormir.' },
    { idx: [15, 16, 17], min: 2, level: 'prioritario', msg: 'Conteúdo inadequado, uso sem supervisão ou contato/exposição online: orientar segurança digital, supervisão ativa e configurações de privacidade/controle parental.' },
    { idx: [18, 19, 20], min: 2, msg: 'Impacto em humor, atenção e clima familiar: rever a "dose" de telas e fortalecer rotinas sem tela (brincar, atividade física, convívio).' }
  ];

  var SUGGEST = [
    { sub: 'Sono e telas', min: 6, msg: 'Predomínio de impacto no sono: aplicar higiene do sono digital (sem telas ~1 h antes; quarto livre de telas).' },
    { sub: 'Conteúdo e segurança', min: 6, msg: 'Predomínio de conteúdo/segurança: priorizar supervisão, controle parental e conversa sobre riscos online.' },
    { sub: 'Conflito ao limitar', min: 6, msg: 'Predomínio de conflito: limites previsíveis e consequências consistentes; evitar a tela como único recurso para acalmar.' }
  ];

  var KW = ['tela', 'telas', 'tempo de tela', 'celular', 'tablet', 'tv', 'televisao', 'videogame', 'games', 'jogos',
    'youtube', 'internet', 'redes sociais', 'vicio em tela', 'dependencia de tela', 'nao larga o celular',
    'birra ao tirar a tela', 'uso de telas', 'higiene digital', 'controle parental', 'sono e telas', 'cyberbullying'];

  function mk(b) {
    var score_max = (O.length - 1) * b.items.length;
    return {
      id: b.id, anchor: b.id,
      title: '📱 Tempo de Tela e Hábitos Digitais NeuroPed · ' + b.band + ' (' + b.code + ')',
      short_title: b.code + ' · Tempo de Tela ' + b.sigla,
      emoji: '📱', code: b.code, sigla: 'HDN ' + b.sigla,
      audience: 'familia', audience_label: 'Pais/cuidador',
      age_band: b.band, age_min_months: b.min, age_max_months: b.max,
      periodo: 'Últimas 4 semanas',
      domain: 'Tempo de tela e hábitos digitais',
      finalidade: 'Triagem de hábitos digitais nas 7 dimensões (quantidade, conflito ao limitar, sono, substituição de atividades, refeições, conteúdo/segurança e impacto), com itens próprios por faixa etária, para orientar limites, higiene de sono e segurança online.',
      symptoms: ['uso excessivo de telas', 'conflito/explosão ao limitar', 'telas prejudicando o sono', 'telas substituindo brincar/convívio'],
      complaints: KW, keywords: KW.concat([b.code, 'HDN', 'autoral', 'neuroped']),
      nature: 'autoral', kind: 'autoral hábitos digitais', applicable: true, npe: true, restrito: false, aviso: false,
      page: 'instrumento-autoral.html', priority: 184,
      options: opts(O), items: b.items, labels: O,
      domains: SYS.map(function (name, k) { return { name: name, items: b.items.slice(k * 3, k * 3 + 3) }; }),
      subs: subsFor(), cutoffs: CUTOFFS, traps: TRAPS, suggest: SUGGEST,
      score_max: score_max,
      plain_questions: b.items,
      clinical_use: 'Triagem do uso de telas por faixa etária para dimensionar quantidade, conflito, impacto no sono/humor/atenção e segurança online, orientando o plano familiar de telas.',
      differentiator: 'Único instrumento do app dedicado a hábitos digitais, varrendo 7 dimensões por faixa etária (0–2, 3–5, 6–8, 9–11, 12–17), com alertas de sono e segurança online.',
      not_normative_disclaimer: DISC
    };
  }

  var INST = BANDS.map(mk);
  var base = Array.isArray(window.NEUROPED_EDITORIAL_SCALES) ? window.NEUROPED_EDITORIAL_SCALES : [];
  var ids = {}; base.forEach(function (x) { if (x && x.id) ids[x.id] = 1; });
  var add = INST.filter(function (x) { return !ids[x.id]; });
  window.NEUROPED_EDITORIAL_SCALES = add.concat(base);
  window.NEUROPED_TEMPO_TELA = add;
  window.NEUROPED_TEMPO_TELA_COUNT = add.length;
})();
