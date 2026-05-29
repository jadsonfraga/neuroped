/* NeuroPed EDJ — Instrumentos VALIDADOS e gratuitos (uso livre / domínio público).
   Diferente do catálogo autoral: estes têm itens, pontuação e PONTOS DE CORTE
   validados na literatura, com citação. Abrem em instrumento-validado.html.
   Continuam sendo TRIAGEM — não fecham diagnóstico, que é clínico. */
(function () {
  'use strict';
  if (window.NEUROPED_VALIDATED_LOADED) return;
  window.NEUROPED_VALIDATED_LOADED = true;

  var YN = [{ label:'Sim', value:1 }, { label:'Não', value:0 }];
  var FREQ4 = [{ label:'Nenhum dia', value:0 }, { label:'Vários dias', value:1 }, { label:'Mais da metade dos dias', value:2 }, { label:'Quase todos os dias', value:3 }];
  var VAND4 = [{ label:'Nunca', value:0 }, { label:'Ocasional', value:1 }, { label:'Frequente', value:2 }, { label:'Muito frequente', value:3 }];
  var SC3 = [{ label:'Não é verdade', value:0 }, { label:'Mais ou menos', value:1 }, { label:'Verdade', value:2 }];

  var V = [
    /* ---------------- M-CHAT-R/F ---------------- */
    {
      id:'val-mchat-rf', title:'M-CHAT-R/F — Rastreio de Autismo (16–30 meses)', short_title:'M-CHAT-R/F', emoji:'🌱',
      audience:'familia', audience_label:'Teste familiar', age_band:'16–30 meses', age_min_months:16, age_max_months:30,
      domain:'TEA', citation:'Robins DL et al. Pediatrics 2014;133(1):37-45. doi:10.1542/peds.2013-1813 (domínio público).',
      instructions:'Responda pensando no comportamento HABITUAL da criança. Se o comportamento é raro (viu uma ou duas vezes), responda como se não fizesse.',
      score_kind:'risk_match', options:YN,
      items:[
        { q:'Se você aponta para algo do outro lado do cômodo, seu filho(a) olha para o que você aponta?', risk:0 },
        { q:'Você já se perguntou se seu filho(a) é surdo(a)?', risk:1 },
        { q:'Seu filho(a) brinca de faz de conta (ex.: dar comida a uma boneca, falar ao telefone de brinquedo)?', risk:0 },
        { q:'Seu filho(a) gosta de subir em coisas (escada, móveis, brinquedos)?', risk:0 },
        { q:'Seu filho(a) faz movimentos incomuns com os dedos perto dos olhos?', risk:1 },
        { q:'Seu filho(a) aponta com um dedo para pedir algo ou para pedir ajuda?', risk:0 },
        { q:'Seu filho(a) aponta com um dedo para mostrar algo interessante a você?', risk:0 },
        { q:'Seu filho(a) se interessa por outras crianças (observa, sorri, se aproxima)?', risk:0 },
        { q:'Seu filho(a) mostra coisas a você trazendo-as ou levantando-as para você ver?', risk:0 },
        { q:'Seu filho(a) responde quando você o(a) chama pelo nome?', risk:0 },
        { q:'Quando você sorri para seu filho(a), ele(a) sorri de volta?', risk:0 },
        { q:'Seu filho(a) se incomoda com barulhos do dia a dia (aspirador, música alta)?', risk:1 },
        { q:'Seu filho(a) anda sem ajuda?', risk:0 },
        { q:'Seu filho(a) olha nos seus olhos quando você fala, brinca ou veste ele(a)?', risk:0 },
        { q:'Seu filho(a) tenta imitar o que você faz (acenar, aplaudir, fazer “tchau”)?', risk:0 },
        { q:'Se você vira a cabeça para olhar algo, seu filho(a) olha na mesma direção?', risk:0 },
        { q:'Seu filho(a) tenta fazer você olhar para ele(a) (busca sua atenção)?', risk:0 },
        { q:'Seu filho(a) entende quando você manda fazer algo simples (“põe na cadeira”)?', risk:0 },
        { q:'Se algo novo acontece, seu filho(a) olha para o seu rosto para ver sua reação?', risk:0 },
        { q:'Seu filho(a) gosta de atividades com movimento (ser balançado, pular no colo)?', risk:0 }
      ],
      cutoffs:[
        { max:2, label:'Baixo risco', cls:'ok', note:'Risco baixo. Manter vigilância do desenvolvimento na puericultura. (Se < 24 meses, reavaliar.)' },
        { max:7, label:'Risco médio', cls:'warn', note:'Aplicar a ENTREVISTA DE SEGUIMENTO (M-CHAT-R/F). Se permanecer ≥ 2, encaminhar para avaliação diagnóstica e intervenção precoce.' },
        { max:20, label:'Risco alto', cls:'risk', note:'Encaminhar DIRETAMENTE para avaliação diagnóstica de TEA e intervenção precoce, sem necessidade de seguimento.' }
      ]
    },
    /* ---------------- Vanderbilt (pais) — sintomas TDAH ---------------- */
    {
      id:'val-vanderbilt-pais', title:'Vanderbilt (Pais) — Triagem de TDAH (6–12 anos)', short_title:'Vanderbilt TDAH', emoji:'⚡',
      audience:'familia', audience_label:'Teste familiar', age_band:'6–12 anos', age_min_months:72, age_max_months:155,
      domain:'TDAH', citation:'NICHQ Vanderbilt Assessment Scale (AAP/NICHQ) — uso livre. Wolraich ML et al.',
      instructions:'Marque a frequência de cada comportamento nos últimos 6 meses. Sintoma é contado como presente quando “Frequente” ou “Muito frequente”.',
      score_kind:'count_threshold', options:VAND4,
      subs:{ 'Desatenção (itens 1–9)':{ from:0, to:8, min:6 }, 'Hiperatividade/Impulsividade (itens 10–18)':{ from:9, to:17, min:6 } },
      items:[
        { q:'Não presta atenção a detalhes ou comete erros por descuido.' },{ q:'Tem dificuldade de manter a atenção em tarefas ou brincadeiras.' },
        { q:'Parece não escutar quando se fala diretamente com ele(a).' },{ q:'Não segue instruções e não termina tarefas.' },
        { q:'Tem dificuldade para organizar tarefas e atividades.' },{ q:'Evita ou reluta em tarefas que exigem esforço mental prolongado.' },
        { q:'Perde coisas necessárias para tarefas/atividades.' },{ q:'Distrai-se facilmente com estímulos externos.' },
        { q:'É esquecido(a) em atividades diárias.' },
        { q:'Mexe mãos/pés ou se remexe na cadeira.' },{ q:'Levanta-se em situações em que deveria ficar sentado(a).' },
        { q:'Corre ou sobe em coisas em situações inadequadas (inquietude).' },{ q:'Tem dificuldade de brincar/se ocupar de forma calma.' },
        { q:'Está “a mil” ou age como se estivesse “a todo vapor”.' },{ q:'Fala em excesso.' },
        { q:'Responde antes de a pergunta terminar.' },{ q:'Tem dificuldade de esperar a vez.' },{ q:'Interrompe ou se intromete.' }
      ],
      cutoffs:[] // band definido pela contagem por subescala (count_threshold)
    },
    /* ---------------- PHQ-9 (adolescente) ---------------- */
    {
      id:'val-phq9', title:'PHQ-9 — Triagem de Depressão (≥ 11 anos)', short_title:'PHQ-9', emoji:'🌧️',
      audience:'autoteste', audience_label:'Autoteste', age_band:'11–17 anos', age_min_months:132, age_max_months:215,
      domain:'Depressão e humor', citation:'Kroenke K, Spitzer RL, Williams JBW. J Gen Intern Med 2001 — uso livre. Versão adolescente (PHQ-A).',
      instructions:'Nas ÚLTIMAS 2 SEMANAS, com que frequência você foi incomodado(a) por cada problema?',
      score_kind:'sum', options:FREQ4, safety_item:8,
      items:[
        'Pouco interesse ou prazer em fazer as coisas.',
        'Sentir-se para baixo, deprimido(a) ou sem esperança.',
        'Dificuldade para dormir, ou dormir demais.',
        'Sentir-se cansado(a) ou com pouca energia.',
        'Falta de apetite ou comer demais.',
        'Sentir-se mal consigo mesmo(a) — ou que é um fracasso, ou que decepcionou a si ou a família.',
        'Dificuldade de concentração (ex.: ler, assistir TV).',
        'Lentidão para se mover/falar, ou o contrário: muito agitado(a)/inquieto(a).',
        'Pensar que seria melhor estar morto(a) ou em se machucar de algum modo.'
      ],
      cutoffs:[
        { max:4, label:'Mínimo', cls:'ok', note:'Sintomas mínimos. Acompanhar.' },
        { max:9, label:'Leve', cls:'warn', note:'Depressão leve. Psicoeducação, apoio e reavaliação.' },
        { max:14, label:'Moderada', cls:'warn', note:'Considerar plano de cuidado/psicoterapia; reavaliar.' },
        { max:19, label:'Moderadamente grave', cls:'risk', note:'Tratamento ativo (psicoterapia ± farmacológico), seguimento próximo.' },
        { max:27, label:'Grave', cls:'risk', note:'Tratamento ativo e avaliação de risco. Item 9 positivo exige avaliação de segurança imediata.' }
      ]
    },
    /* ---------------- GAD-7 ---------------- */
    {
      id:'val-gad7', title:'GAD-7 — Triagem de Ansiedade (≥ 11 anos)', short_title:'GAD-7', emoji:'😰',
      audience:'autoteste', audience_label:'Autoteste', age_band:'11–17 anos', age_min_months:132, age_max_months:215,
      domain:'Ansiedade', citation:'Spitzer RL et al. Arch Intern Med 2006 — uso livre.',
      instructions:'Nas ÚLTIMAS 2 SEMANAS, com que frequência você foi incomodado(a) por cada problema?',
      score_kind:'sum', options:FREQ4,
      items:[
        'Sentir-se nervoso(a), ansioso(a) ou muito tenso(a).',
        'Não conseguir parar ou controlar as preocupações.',
        'Preocupar-se demais com diferentes coisas.',
        'Dificuldade para relaxar.',
        'Ficar tão agitado(a) que se torna difícil ficar parado(a).',
        'Ficar facilmente aborrecido(a) ou irritado(a).',
        'Sentir medo como se algo terrível fosse acontecer.'
      ],
      cutoffs:[
        { max:4, label:'Mínima', cls:'ok', note:'Ansiedade mínima.' },
        { max:9, label:'Leve', cls:'warn', note:'Ansiedade leve. Psicoeducação e reavaliação.' },
        { max:14, label:'Moderada', cls:'warn', note:'Considerar avaliação e plano de cuidado.' },
        { max:21, label:'Grave', cls:'risk', note:'Ansiedade grave. Avaliação e tratamento ativos.' }
      ]
    },
    /* ---------------- SCARED (5 itens, screener) ---------------- */
    {
      id:'val-scared5', title:'SCARED-5 — Rastreio breve de Ansiedade (≥ 8 anos)', short_title:'SCARED-5', emoji:'🫨',
      audience:'autoteste', audience_label:'Autoteste', age_band:'8–17 anos', age_min_months:96, age_max_months:215,
      domain:'Ansiedade', citation:'Birmaher B et al. (SCARED) — versão breve de 5 itens; uso livre em pesquisa/clínica.',
      instructions:'Pensando em como você TEM SE SENTIDO, marque o quanto cada frase é verdadeira para você.',
      score_kind:'sum', options:SC3,
      items:[
        'Quando fico com medo, sinto falta de ar.',
        'Tenho dores de cabeça ou de barriga na escola.',
        'Não gosto de ficar com pessoas que não conheço bem.',
        'Tenho medo de dormir longe de casa.',
        'Preocupo-me que as pessoas não gostem de mim.'
      ],
      cutoffs:[
        { max:2, label:'Improvável', cls:'ok', note:'Pouco provável transtorno de ansiedade. Acompanhar.' },
        { max:10, label:'Possível (≥ 3)', cls:'warn', note:'Triagem positiva. Aplicar o SCARED completo (41 itens) e avaliar clinicamente.' }
      ]
    }
  ];

  function decorate(s){
    s.kind = 'validado'; s.nature = 'validado'; s.validated = true;
    s.page = 'instrumento-validado.html'; s.anchor = s.id;
    s.priority = 200; // validados aparecem no topo do ranqueamento
    s.symptoms = s.symptoms || [s.domain];
    s.complaints = s.complaints || [s.domain.toLowerCase()];
    s.keywords = [s.short_title, s.domain, 'validado', 'cutoff', 'pontos de corte'].concat(s.complaints);
    s.plain_questions = s.items.map(function(it){ return it.q || it; }); // fallback de busca
    s.clinical_use = 'Instrumento de triagem VALIDADO (citação na referência). Resultado com ponto de corte da literatura — orienta conduta, não fecha diagnóstico.';
    s.differentiator = 'Validado e gratuito, com itens e pontos de corte reais.';
    s.not_normative_disclaimer = 'Instrumento de triagem validado e de uso livre. A triagem positiva indica necessidade de avaliação; o diagnóstico é clínico e do médico responsável.';
    return s;
  }
  window.NEUROPED_VALIDATED = V.map(decorate);

  var base = Array.isArray(window.NEUROPED_EDITORIAL_SCALES) ? window.NEUROPED_EDITORIAL_SCALES : [];
  var ids = new Set(base.map(function(x){ return x && x.id; }));
  window.NEUROPED_EDITORIAL_SCALES = base.concat(window.NEUROPED_VALIDATED.filter(function(x){ return !ids.has(x.id); }));
  window.NEUROPED_VALIDATED_COUNT = window.NEUROPED_VALIDATED.length;
})();
