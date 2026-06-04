/* NeuroPed EDJ — Perfil Sensorial NeuroPed (PSN) · instrumento AUTORAL.
 * --------------------------------------------------------------------------
 * Triagem robusta de PROCESSAMENTO SENSORIAL por faixa etária, varrendo os
 * 7 sistemas sensoriais (tátil, auditivo, visual, gustativo/olfativo,
 * vestibular, proprioceptivo e interoceptivo). Cada sistema tem 3 itens que
 * cobrem os padrões de Dunn: HIPER-resposta (defensividade), HIPO-resposta
 * (baixo registro) e BUSCA sensorial — sempre redigidos para que MAIOR
 * frequência = MAIOR atipia/atenção. Itens 100% autorais do Dr. Jadson Fraga;
 * NÃO reproduz o Perfil Sensorial de Dunn nem qualquer instrumento
 * proprietário. Renderiza em instrumento-autoral.html (npe:true).
 */
(function () {
  'use strict';
  if (window.NEUROPED_SENSORIAL_PERFIL_LOADED) return;
  window.NEUROPED_SENSORIAL_PERFIL_LOADED = true;

  var DISC = 'Triagem sensorial autoral NeuroPed EDJ (itens próprios, por faixa etária). NÃO é normatizada e NÃO equivale ao Perfil Sensorial de Dunn nem a qualquer instrumento proprietário/validado. Os valores são pontos de atenção operacional, não pontos de corte diagnóstico, e não diagnosticam TEA, Transtorno do Processamento Sensorial ou alteração de integração sensorial. Resultados elevados indicam encaminhamento para avaliação de terapia ocupacional e/ou equipe multiprofissional.';

  // 4 níveis de frequência (0–3): direção única (maior = mais atípico).
  var O = ['Nunca ou quase nunca', 'Às vezes', 'Frequentemente', 'Quase sempre / atrapalha a rotina'];
  function opts(arr) { return arr.map(function (l, i) { return { label: l, value: i }; }); }

  // Ordem FIXA dos 7 sistemas (3 itens cada → 21 itens). idx das subescalas e
  // das traps dependem desta ordem e valem para todas as faixas.
  var SYS = [
    'Tátil (toque e texturas)',
    'Auditivo (sons e ruídos)',
    'Visual (luz e estímulo visual)',
    'Gustativo / Olfativo (sabores e cheiros)',
    'Vestibular (movimento e equilíbrio)',
    'Proprioceptivo (força e consciência corporal)',
    'Interoceptivo (sinais internos do corpo)'
  ];

  // ---- Itens por faixa etária (21 por faixa, na ordem dos 7 sistemas) ----
  var BANDS = [
    {
      id: 'sens-psn-0-2', code: 'PSN-B1', sigla: '0–2 anos', band: '0–2 anos', min: 0, max: 35,
      items: [
        // Tátil
        'Fica muito incomodado(a) ao ser tocado(a), trocado(a), com etiquetas/roupas, no banho ou ao cortar unhas e cabelo?',
        'Parece não reagir a fralda suja/molhada ou a pequenos machucados (registra pouco o toque e a dor)?',
        'Busca esfregar-se em superfícies, levar tudo à boca ou tocar texturas de forma intensa e repetida?',
        // Auditivo
        'Assusta-se demais, chora ou se desorganiza com sons comuns (liquidificador, aspirador, voz alta)?',
        'Parece não responder ou demora muito a virar para sons e para o seu chamado (com audição já testada)?',
        'Procura fazer ou ouvir barulho repetidamente (bater objetos, sons altos) para se estimular?',
        // Visual
        'Incomoda-se muito com luz forte, claridade ou ambientes muito coloridos e movimentados?',
        'Demora a seguir objetos e rostos com o olhar ou parece "não enxergar" o que está à frente?',
        'Fixa-se de forma intensa em luzes, ventiladores ou objetos que giram, ou olha de lado/perto demais?',
        // Gustativo / Olfativo
        'Recusa muitos alimentos por textura ou cheiro, com engasgos ou ânsia fácil ao comer?',
        'Parece não notar cheiros fortes ou leva à boca coisas sem sabor/impróprias sem reagir?',
        'Cheira objetos e pessoas ou busca sabores muito intensos de forma repetida?',
        // Vestibular
        'Fica aflito(a) ou chora ao ser movimentado(a), inclinado(a) ou no colo em movimento (insegurança ao perder o chão)?',
        'Parece não se incomodar ao girar/balançar muito e quase não fica tonto(a) ou desorientado(a)?',
        'Adora e procura muito balançar, girar, pular no colo ou ser jogado(a) para cima de forma intensa?',
        // Proprioceptivo
        'Parece "molinho(a)" (baixo tônus), escorrega no colo ou tem dificuldade para sustentar a postura esperada?',
        'Usa força de forma inadequada (aperta/bate demais ou segura muito fraco) ao pegar objetos?',
        'Busca apertar-se, ser abraçado(a) com força, empurrar ou bater o próprio corpo com frequência?',
        // Interoceptivo
        'Tem dificuldade em demonstrar fome e sede de forma previsível (não dá sinais claros)?',
        'Parece não perceber ou não avisar dor, desconforto, frio ou calor?',
        'Tem padrão muito irregular de sono e evacuação, sendo difícil "ler" os sinais do corpo dele(a)?'
      ]
    },
    {
      id: 'sens-psn-3-5', code: 'PSN-B2', sigla: '3–5 anos', band: '3–5 anos', min: 36, max: 71,
      items: [
        // Tátil
        'Incomoda-se com roupas, etiquetas, costuras, mãos sujas, ou com banho, escovar dentes e cortar unhas/cabelo?',
        'Parece não sentir dor, frio ou calor, ou não percebe quando está sujo(a)/molhado(a)?',
        'Toca em tudo o tempo todo, esfrega-se nas pessoas/objetos ou ainda leva coisas à boca para sentir a textura?',
        // Auditivo
        'Tapa os ouvidos, assusta-se ou se incomoda muito com barulhos comuns (secador, descarga, festa, sala cheia)?',
        'Não responde quando chamado(a) ou parece "não ouvir" em meio a ruído (com audição já testada)?',
        'Faz barulho com a boca/objetos, fala muito alto ou procura sons altos de forma repetida?',
        // Visual
        'Incomoda-se com luz/claridade, fecha os olhos ou se distrai demais em ambientes muito visuais?',
        'Não percebe detalhes, esbarra em coisas ou demora a achar objetos que estão à vista?',
        'Aproxima muito os olhos, olha de canto ou fixa em objetos que giram e em luzes de forma repetida?',
        // Gustativo / Olfativo
        'É muito seletivo(a) com comida por textura, cheiro ou aparência, com cardápio bem restrito?',
        'Não nota cheiros fortes ou coloca na boca objetos não-alimentares (chupa roupa, morde lápis)?',
        'Cheira objetos, comida ou pessoas, ou busca sabores muito intensos (azedo, picante, gelado)?',
        // Vestibular
        'Tem medo excessivo de altura, escorregador, balanço, pés fora do chão ou de cair?',
        'Gira e balança muito sem ficar tonto(a) e parece precisar de muito movimento para "se sentir"?',
        'Está sempre em movimento — pula, gira, corre e procura balanço/rodopio de forma intensa?',
        // Proprioceptivo
        'Tem postura "molinha", cansa rápido, escora-se muito ou senta em posições estranhas?',
        'Usa força demais ou de menos (quebra brinquedos, abraça/aperta forte, risca o papel apertando muito)?',
        'Busca empurrar, puxar, carregar peso, apertar-se, bater o corpo ou abraços bem apertados?',
        // Interoceptivo
        'Tem dificuldade para perceber fome e sede (não pede, ou come/bebe demais sem notar)?',
        'Demora a perceber ou avisar a vontade de ir ao banheiro, a dor ou o frio/calor?',
        'Tem dificuldade para se acalmar e identificar o que sente quando fica desregulado(a)?'
      ]
    },
    {
      id: 'sens-psn-6-8', code: 'PSN-B3', sigla: '6–8 anos', band: '6–8 anos', min: 72, max: 107,
      items: [
        // Tátil
        'Reclama de roupas, etiquetas, meias ou sujeira, ou evita atividades com cola/tinta/areia por incômodo no toque?',
        'Machuca-se e não percebe, não sente frio/calor adequadamente ou não nota sujeira no corpo e no rosto?',
        'Está sempre tocando/mexendo em tudo, esfrega-se, morde objetos/roupa ou mexe na pele e no cabelo?',
        // Auditivo
        'Cobre os ouvidos ou se desorganiza com sino, sirene, refeitório, recreio ou sala barulhenta?',
        '"Desliga" ou não responde quando há ruído de fundo, parecendo não ouvir (com audição normal)?',
        'Faz ruídos repetidos, fala/canta alto sem perceber ou procura ambientes e sons muito altos?',
        // Visual
        'Incomoda-se com a luz da sala, o brilho de telas/quadro, ou cansa e se distrai demais com muito estímulo visual?',
        'Perde-se em listas/textos, pula linhas, não acha o que está à vista ou esbarra em coisas?',
        'Fixa em detalhes, luzes ou objetos girando, ou aproxima-se demais para olhar?',
        // Gustativo / Olfativo
        'Mantém alimentação muito restrita por textura, cheiro ou sabor, recusando experimentar?',
        'Não percebe cheiros fortes (gás, comida queimada) ou ainda morde/chupa objetos não-alimentares?',
        'Procura cheirar coisas ou busca sabores e temperaturas muito intensos com frequência?',
        // Vestibular
        'Tem medo ou insegurança em escadas, altura, escorregador, balanço ou movimentos rápidos?',
        'Não fica tonto(a) ao girar muito e parece precisar de movimento constante para se manter atento(a)?',
        'Não para quieto(a): balança a cadeira, levanta o tempo todo, procura girar, pular e correr?',
        // Proprioceptivo
        'Tem letra muito apertada/fraca, cansa ao escrever, ou má postura e tônus baixo (escora a cabeça na mão)?',
        'Mede mal a força (esbarra sem querer, quebra a ponta do lápis, abraça/empurra forte demais)?',
        'Busca atividades pesadas: empurrar, carregar, apertar-se, roer/morder, bater o corpo ou abraços apertados?',
        // Interoceptivo
        'Tem dificuldade para perceber fome e sede na hora certa (esquece de comer/beber ou exagera)?',
        'Percebe tarde a vontade de ir ao banheiro (urgência/escapes) ou não nota dor, cansaço, frio e calor?',
        'Tem dificuldade para reconhecer e nomear o que sente no corpo quando fica nervoso(a)/desregulado(a)?'
      ]
    },
    {
      id: 'sens-psn-9-11', code: 'PSN-B4', sigla: '9–11 anos', band: '9–11 anos', min: 108, max: 143,
      items: [
        // Tátil
        'Continua incomodado(a) com tecidos, etiquetas e sujeira, evita contato físico inesperado ou certas texturas?',
        'Tem limiar de dor/temperatura alterado (não percebe machucados, frio ou calor) ou não nota a própria sujeira?',
        'Mexe constantemente em objetos, na pele, cabelo ou unhas, ou precisa tocar em tudo para se regular?',
        // Auditivo
        'Fica sobrecarregado(a) ou irritado(a) em ambientes barulhentos (refeitório, ginásio, festa, ônibus)?',
        'Tem dificuldade de ouvir/atender quando há ruído de fundo, parecendo não escutar (audição normal)?',
        'Faz sons repetidos, ouve música muito alta ou procura estímulo sonoro intenso para se concentrar?',
        // Visual
        'É sensível a luz, brilho e telas, com cansaço visual, dor de cabeça ou distração em ambientes cheios?',
        'Comete erros visuais (pula linhas, perde-se em tabelas, desorganiza o caderno) apesar de enxergar bem?',
        'Busca estímulo visual intenso (telas, luzes, padrões) de forma repetitiva e difícil de interromper?',
        // Gustativo / Olfativo
        'Mantém repertório alimentar restrito por sensorialidade, com prejuízo social (recusa comer fora de casa)?',
        'Tem baixa percepção de cheiros (risco com gás, comida estragada) ou ainda leva objetos à boca?',
        'Procura cheiros e sabores muito intensos ou específicos de forma marcante?',
        // Vestibular
        'Evita esportes, altura, girar e equilíbrio, ou enjoa fácil em carro/movimento (insegurança gravitacional)?',
        'Tolera girar e movimento intenso sem enjoar e parece precisar de muito movimento para se sentir bem?',
        'Tem inquietação motora alta, mexe-se o tempo todo e busca movimento de risco/radical?',
        // Proprioceptivo
        'Tem postura ruim, cansa fácil, é descoordenado(a) ou tem dificuldade na escrita/educação física por força e corpo?',
        'Continua medindo mal a força (esbarra, derruba, aperta demais) e parece "desajeitado(a)"?',
        'Busca pressão profunda: carregar peso, apertar-se, abraços fortes, roer/morder, bater o corpo?',
        // Interoceptivo
        'Tem dificuldade de perceber fome, sede e cansaço, afetando alimentação, hidratação ou sono?',
        'Percebe tarde os sinais do corpo (banheiro, dor, estar ficando doente) ou os ignora até ficarem intensos?',
        'Tem dificuldade de identificar e nomear emoções e sensações (a ansiedade vira dor de barriga, por exemplo)?'
      ]
    },
    {
      id: 'sens-psn-12-17', code: 'PSN-B5', sigla: '12–17 anos', band: '12–17 anos', min: 144, max: 215,
      items: [
        // Tátil
        'Evita certos tecidos, contato físico ou texturas, e isso afeta as roupas, a higiene ou o convívio?',
        'Tem percepção alterada de dor/temperatura (não percebe lesões, frio ou calor) ou pouca noção de higiene/aparência?',
        'Mexe constantemente em algo, na pele, unhas ou cabelo, ou precisa de estímulo tátil para se concentrar/acalmar?',
        // Auditivo
        'Fica sobrecarregado(a), ansioso(a) ou irritado(a) em ambientes barulhentos e tenta evitá-los?',
        'Tem dificuldade de filtrar o ruído de fundo para acompanhar conversas ou a aula (audição normal)?',
        'Usa fones ou música alta de forma constante, ou busca estímulo sonoro intenso para se regular?',
        // Visual
        'É sensível a luz, telas e brilho, com fadiga visual, dor de cabeça ou sobrecarga em ambientes muito visuais?',
        'Comete erros visuais de organização/leitura e perde-se em textos longos, apesar de boa visão?',
        'Busca telas e estímulo visual intenso de forma difícil de interromper (impacto no sono e na rotina)?',
        // Gustativo / Olfativo
        'Mantém alimentação restrita por sensorialidade, com impacto social ou nutricional?',
        'Tem baixa percepção de cheiros (risco de segurança) ou aversões olfativas que limitam ambientes?',
        'Procura sabores e cheiros muito intensos ou específicos de forma marcante?',
        // Vestibular
        'Evita movimento, altura e esportes, ou enjoa facilmente em movimento (insegurança gravitacional)?',
        'Procura muito movimento, velocidade ou risco para se sentir bem (busca vestibular intensa)?',
        'Tem inquietação corporal e dificuldade de ficar parado(a) por tempo prolongado?',
        // Proprioceptivo
        'Tem descoordenação, má postura, cansaço físico ou dificuldade motora (fina/grossa) para a idade?',
        'Mede mal a força (esbarra, derruba, aperta demais), parecendo "desajeitado(a)"?',
        'Busca pressão profunda ou atividade pesada (academia, carregar peso, apertar-se, roer) para se regular?',
        // Interoceptivo
        'Tem dificuldade de perceber fome, sede e cansaço, afetando alimentação, hidratação e sono?',
        'Percebe tarde ou ignora os sinais do corpo (banheiro, dor, doença, exaustão)?',
        'Tem dificuldade de reconhecer e nomear emoções e sensações (confunde ansiedade com sintomas físicos)?'
      ]
    }
  ];

  // Subescalas: 1 por sistema (3 itens consecutivos).
  function subsFor() {
    return SYS.map(function (name, k) { return { name: name, idx: [k * 3, k * 3 + 1, k * 3 + 2] }; });
  }

  // Faixas de interpretação (score_max = 3 × 21 = 63), iguais para todas as idades.
  var CUTOFFS = [
    { max: 10, label: 'Respostas sensoriais dentro do esperado nesta triagem', cls: 'ok' },
    { max: 24, label: 'Tendência sensorial leve — orientar adaptações e observar', cls: 'warn' },
    { max: 42, label: 'Padrão sensorial relevante — avaliação de terapia ocupacional indicada', cls: 'risk' },
    { max: 63, label: 'Impacto sensorial importante — avaliação especializada prioritária (considerar TEA/TPS)', cls: 'risk' }
  ];

  // Alertas por item-chave (a trap dispara se ALGUM item do idx ≥ min).
  var TRAPS = [
    { idx: [3], min: 2, msg: 'Defensividade/atipia auditiva frequente: antes de atribuir à hipersensibilidade, descartar perda auditiva ou otite — considerar avaliação audiológica.' },
    { idx: [0], min: 2, msg: 'Defensividade tátil frequente: pode afetar alimentação, higiene e vestir; orienta avaliação de terapia ocupacional e atenção a sinais de TEA/TPS.' },
    { idx: [1, 19], min: 2, level: 'prioritario', msg: 'Baixa percepção de dor, temperatura ou sinais internos do corpo: atenção à SEGURANÇA (queimaduras e lesões não percebidas) e ao controle de esfíncteres/sono — investigar.' },
    { idx: [14, 17], min: 3, msg: 'Busca muito intensa de movimento e de pressão profunda: pode indicar necessidade de "dieta sensorial"; avaliar com terapia ocupacional e diferenciar de inquietação por TDAH.' }
  ];

  // Sugestões por subdomínio predominante (subScore ≥ min; máx por sistema = 9).
  var SUGGEST = [
    { sub: 'Auditivo (sons e ruídos)', min: 6, msg: 'Predomínio auditivo: considerar avaliação audiológica e adaptações de ambiente (abafadores, pausas, avisar antes do ruído).' },
    { sub: 'Gustativo / Olfativo (sabores e cheiros)', min: 6, msg: 'Predomínio gustativo/olfativo: avaliar seletividade alimentar e risco nutricional (terapia ocupacional/fono e nutrição).' },
    { sub: 'Vestibular (movimento e equilíbrio)', min: 6, msg: 'Predomínio vestibular: avaliar equilíbrio, coordenação e segurança; oferecer movimento regulado ao longo do dia.' }
  ];

  var KW = ['sensorial', 'perfil sensorial', 'processamento sensorial', 'integracao sensorial', 'sensibilidade',
    'hipersensibilidade', 'hipossensibilidade', 'busca sensorial', 'defensividade tatil', 'barulho', 'tapa os ouvidos',
    'toque', 'textura', 'nao gosta de ser tocado', 'luz', 'cheiro', 'seletividade alimentar', 'recusa alimentar',
    'vestibular', 'gira muito', 'anda na ponta dos pes', 'propriocepcao', 'forca', 'interocepcao', 'nao sente dor',
    'nao sente fome', 'tea', 'autismo', 'tps', 'terapia ocupacional', 'modulacao sensorial'];

  function mk(b) {
    var score_max = (O.length - 1) * b.items.length; // 3 × 21 = 63
    return {
      id: b.id, anchor: b.id,
      title: '🌈 Perfil Sensorial NeuroPed · ' + b.band + ' (' + b.code + ')',
      short_title: b.code + ' · Perfil Sensorial ' + b.sigla,
      emoji: '🌈', code: b.code, sigla: 'PSN ' + b.sigla,
      audience: 'familia', audience_label: 'Pais/cuidador',
      age_band: b.band, age_min_months: b.min, age_max_months: b.max,
      periodo: 'Últimas 4 semanas',
      domain: 'Perfil sensorial (processamento sensorial)',
      finalidade: 'Triagem do perfil de processamento sensorial nos 7 sistemas (tátil, auditivo, visual, gustativo/olfativo, vestibular, proprioceptivo e interoceptivo), distinguindo hiper-resposta, hipo-resposta e busca sensorial, com itens próprios adaptados à faixa de ' + b.band + '.',
      symptoms: ['hipersensibilidade a sons/toque/luz', 'busca intensa de movimento/pressão', 'seletividade alimentar sensorial', 'baixa percepção de dor/sinais do corpo'],
      complaints: KW, keywords: KW.concat([b.code, 'PSN', 'autoral', 'neuroped']),
      nature: 'autoral', kind: 'autoral sensorial', applicable: true, npe: true, restrito: false, aviso: false,
      page: 'instrumento-autoral.html', priority: 184,
      options: opts(O), items: b.items, labels: O,
      // domains: faz o renderizador genérico (escala.html) mostrar uma SEÇÃO por
      // sistema sensorial e pontuar por domínio no laudo (fluxo real do filtro).
      domains: SYS.map(function (name, k) { return { name: name, items: b.items.slice(k * 3, k * 3 + 3) }; }),
      subs: subsFor(), cutoffs: CUTOFFS, traps: TRAPS, suggest: SUGGEST,
      score_max: score_max,
      plain_questions: b.items, // fallback de busca/laudo
      clinical_use: 'Triagem sensorial por faixa etária para mapear quais sistemas estão alterados e o padrão (hiper/hipo/busca), orientando adaptações e a indicação de avaliação de terapia ocupacional.',
      differentiator: 'Único instrumento do app a varrer os 7 sistemas sensoriais com itens adaptados por faixa etária (0–2, 3–5, 6–8, 9–11, 12–17), com subdomínio por sistema e alertas de segurança.',
      not_normative_disclaimer: DISC
    };
  }

  var INST = BANDS.map(mk);

  // Registro idempotente no catálogo global (mesmo padrão dos demais autorais).
  var base = Array.isArray(window.NEUROPED_EDITORIAL_SCALES) ? window.NEUROPED_EDITORIAL_SCALES : [];
  var ids = {}; base.forEach(function (x) { if (x && x.id) ids[x.id] = 1; });
  var add = INST.filter(function (x) { return !ids[x.id]; });
  window.NEUROPED_EDITORIAL_SCALES = add.concat(base);
  window.NEUROPED_SENSORIAL_PERFIL = add;
  window.NEUROPED_SENSORIAL_PERFIL_COUNT = add.length;
})();
