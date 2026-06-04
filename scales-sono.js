/* NeuroPed EDJ — Sono NeuroPed (SON) · AUTORAL.
 * --------------------------------------------------------------------------
 * Triagem do sono por faixa etária (0–2, 3–5, 6–8, 9–11, 12–17), varrendo 7
 * eixos: rotina/higiene do sono, adormecer, manutenção do sono, parassonias,
 * respiração no sono (suspeita de SAOS), movimento/desconforto e impacto diurno.
 * Itens autorais do Dr. Jadson Fraga; direção única (maior frequência = mais
 * atenção). Despertares e ajuda para dormir são normais nos primeiros anos —
 * interpretar pela idade. Renderiza em escala.html (via `domains`) e no autoral.
 */
(function () {
  'use strict';
  if (window.NEUROPED_SONO_LOADED) return;
  window.NEUROPED_SONO_LOADED = true;

  var DISC = 'Triagem autoral NeuroPed EDJ do sono (itens próprios, por faixa etária). NÃO é normatizada nem diagnóstica. Despertares noturnos e necessidade de ajuda para dormir fazem parte do desenvolvimento nos primeiros anos — interprete conforme a idade. Os valores são pontos de atenção operacional, não pontos de corte. Ronco habitual, pausas na respiração, sonolência diurna importante ou parassonias frequentes exigem avaliação médica (descartar apneia obstrutiva do sono e privação de sono).';

  var O = ['Nunca ou quase nunca', 'Às vezes', 'Frequentemente', 'Quase sempre / todas as noites'];
  function opts(arr) { return arr.map(function (l, i) { return { label: l, value: i }; }); }

  // 7 eixos (ordem fixa; 3 itens cada → 21). idx de subs/traps seguem esta ordem.
  var SYS = [
    'Rotina e higiene do sono',
    'Adormecer',
    'Manutenção do sono',
    'Parassonias',
    'Respiração no sono',
    'Movimento e desconforto',
    'Dia seguinte (impacto diurno)'
  ];

  var BANDS = [
    {
      id: 'sono-son-0-2', code: 'SON-B1', sigla: '0–2 anos', band: '0–2 anos', min: 0, max: 35,
      items: [
        // Rotina e higiene
        'Tem horários de dormir e acordar muito irregulares (variam muito a cada dia)?',
        'Falta um ritual calmo e previsível antes de dormir?',
        'Fica exposto(a) a telas, luz forte ou agitação perto da hora de dormir?',
        // Adormecer
        'Tem dificuldade para pegar no sono (demora muito para adormecer)?',
        'Só adormece com condições específicas (peito/mamadeira, colo, balanço, no carro)?',
        'Resiste ou chora muito na hora de ir dormir?',
        // Manutenção
        'Acorda várias vezes à noite precisando de ajuda para voltar a dormir?',
        'Tem dificuldade para voltar a dormir sozinho(a) após acordar?',
        'O sono total (dia + noite) parece abaixo do esperado para a idade?',
        // Parassonias
        'Acorda gritando ou aterrorizado(a), inconsolável, sem parecer acordar de fato?',
        'Tem pesadelos ou choro intenso recorrente durante o sono?',
        'Range os dentes, geme ou se mexe muito durante o sono?',
        // Respiração
        'Ronca quase toda noite?',
        'Respira pela boca ou parece "lutar" para respirar dormindo?',
        'Você já percebeu pausas na respiração, engasgos ou sono muito suado e agitado?',
        // Movimento e desconforto
        'Tem sono muito agitado (mexe-se muito, muda de posição o tempo todo)?',
        'Faz movimentos repetidos para dormir (bate a cabeça, balança o corpo)?',
        'Parece desconfortável, com cólicas ou inquietação que atrapalham o sono?',
        // Dia seguinte
        'Acorda irritado(a) ou parece não ter descansado?',
        'Fica muito sonolento(a) ou "apagado(a)" em horários inadequados?',
        'O sono ruim afeta o humor e o comportamento durante o dia?'
      ]
    },
    {
      id: 'sono-son-3-5', code: 'SON-B2', sigla: '3–5 anos', band: '3–5 anos', min: 36, max: 71,
      items: [
        'Tem horários de dormir e acordar irregulares (mudam muito nos dias)?',
        'Falta uma rotina calma e previsível antes de dormir?',
        'Usa telas ou fica agitado(a) perto da hora de dormir?',
        'Demora muito (mais de 30 min) para pegar no sono?',
        'Só dorme com a presença do adulto ou com condições específicas?',
        'Faz muita resistência ou birra na hora de dormir?',
        'Acorda à noite e vai para a cama dos pais?',
        'Tem dificuldade para voltar a dormir sozinho(a)?',
        'Dorme menos horas que o esperado para a idade?',
        'Tem terror noturno (acorda gritando, assustado(a), sem reconhecer ninguém)?',
        'Tem pesadelos frequentes?',
        'Anda dormindo (sonambulismo), fala ou range os dentes à noite?',
        'Ronca quase todas as noites?',
        'Dorme de boca aberta / respira pela boca?',
        'Tem pausas na respiração, engasgos ou sono muito suado e agitado?',
        'Tem sono muito agitado (mexe-se muito, "roda" na cama)?',
        'Reclama de desconforto nas pernas ou precisa mexê-las para dormir?',
        'Faz movimentos repetidos (balançar, bater a cabeça) para dormir?',
        'Acorda de mau humor ou parece cansado(a)?',
        'Tem sonolência diurna excessiva ou ainda precisa de soneca longa que atrapalha a noite?',
        'O sono ruim piora atenção, agitação ou comportamento durante o dia?'
      ]
    },
    {
      id: 'sono-son-6-8', code: 'SON-B3', sigla: '6–8 anos', band: '6–8 anos', min: 72, max: 107,
      items: [
        'Tem horários de dormir e acordar irregulares (inclusive nos fins de semana)?',
        'Falta uma rotina ou ritual consistente antes de dormir?',
        'Usa telas (TV, tablet, jogos) na última hora antes de dormir?',
        'Demora muito para pegar no sono?',
        'Precisa do adulto por perto ou de condições específicas para dormir?',
        'Resiste ou protela a hora de dormir (enrola, levanta várias vezes)?',
        'Acorda à noite e tem dificuldade para voltar a dormir?',
        'Vai para a cama dos pais durante a noite?',
        'Dorme menos horas que o necessário para a idade?',
        'Tem terror noturno ou desperta confuso(a) sem lembrar depois?',
        'Tem pesadelos frequentes?',
        'Anda dormindo (sonambulismo), fala ou range os dentes?',
        'Ronca quase todas as noites?',
        'Respira pela boca ao dormir (ou também de dia)?',
        'Tem pausas na respiração, engasgos ou sono muito suado e agitado?',
        'Tem sono muito agitado e inquieto?',
        'Reclama de desconforto ou formigamento nas pernas, precisando mexê-las?',
        'Tem despertares com movimento ou inquietação que fragmentam o sono?',
        'Acorda cansado(a) ou de mau humor, difícil de levantar?',
        'Tem sonolência diurna (cochila na escola, no carro)?',
        'O sono insuficiente piora atenção, hiperatividade ou irritabilidade (parece TDAH)?'
      ]
    },
    {
      id: 'sono-son-9-11', code: 'SON-B4', sigla: '9–11 anos', band: '9–11 anos', min: 108, max: 143,
      items: [
        'Tem horários de sono irregulares (dorme e acorda em horas muito variáveis)?',
        'Falta rotina consistente e ambiente adequado para dormir?',
        'Usa telas na cama ou na última hora antes de dormir?',
        'Demora muito para pegar no sono (fica "ligado(a)")?',
        'Precisa de condições específicas (luz, som, companhia) para dormir?',
        'Protela ativamente a hora de dormir?',
        'Acorda à noite e custa a voltar a dormir?',
        'Tem sono fragmentado (vários despertares)?',
        'Dorme menos horas do que precisa para a idade?',
        'Tem episódios de despertar confuso, terror noturno ou sonambulismo?',
        'Tem pesadelos frequentes?',
        'Range os dentes (bruxismo) ou fala dormindo?',
        'Ronca habitualmente?',
        'Respira pela boca ao dormir?',
        'Tem pausas ou engasgos na respiração, ou sono muito agitado e suado?',
        'Tem sono inquieto, com muito movimento?',
        'Reclama de desconforto nas pernas ou necessidade de mexê-las à noite?',
        'Tem despertares ligados a movimento das pernas ou do corpo?',
        'Acorda cansado(a), difícil de levantar para a escola?',
        'Tem sonolência diurna que atrapalha aula e atividades?',
        'O déficit de sono prejudica atenção, humor e desempenho (mimetiza TDAH)?'
      ]
    },
    {
      id: 'sono-son-12-17', code: 'SON-B5', sigla: '12–17 anos', band: '12–17 anos', min: 144, max: 215,
      items: [
        'Tem horários de sono muito irregulares (dorme muito tarde e muda muito nos fins de semana)?',
        'Falta higiene do sono (cafeína à noite, ambiente inadequado, sem rotina)?',
        'Usa telas ou celular na cama, atrasando o sono?',
        'Demora muito para pegar no sono (mente acelerada, ansiedade)?',
        'Só dorme muito tarde, com atraso importante do horário (adormece de madrugada)?',
        'Protela ativamente o sono (fica no celular, jogos, séries)?',
        'Acorda à noite e custa a voltar a dormir?',
        'Tem sono fragmentado ou de má qualidade?',
        'Dorme bem menos horas do que precisa (privação crônica)?',
        'Tem despertares confusos, sonambulismo ou pesadelos frequentes?',
        'Range os dentes (bruxismo) à noite?',
        'Tem sono não reparador apesar de horas na cama?',
        'Ronca habitualmente?',
        'Respira pela boca ao dormir?',
        'Tem pausas ou engasgos na respiração, ou sono muito agitado e suado?',
        'Tem sono inquieto, com muito movimento?',
        'Reclama de desconforto nas pernas ou necessidade de mexê-las à noite?',
        'Acorda com sensação de não ter descansado por sono agitado?',
        'Acorda exausto(a), com muita dificuldade de levantar?',
        'Tem sonolência diurna (dorme em aula, cochilos longos)?',
        'O sono ruim prejudica humor, atenção, escola e até sintomas de ansiedade/tristeza?'
      ]
    }
  ];

  function subsFor() { return SYS.map(function (name, k) { return { name: name, idx: [k * 3, k * 3 + 1, k * 3 + 2] }; }); }

  var CUTOFFS = [
    { max: 10, label: 'Sono dentro do esperado nesta triagem', cls: 'ok' },
    { max: 24, label: 'Sinais leves — orientar higiene do sono e observar', cls: 'warn' },
    { max: 42, label: 'Padrão de sono relevante — avaliação indicada', cls: 'risk' },
    { max: 63, label: 'Impacto importante — avaliação especializada prioritária (descartar SAOS, parassonias, privação de sono)', cls: 'risk' }
  ];

  var TRAPS = [
    { idx: [12, 13, 14], min: 2, level: 'prioritario', msg: 'Ronco habitual, respiração pela boca ou pausas no sono: investigar apneia obstrutiva do sono (SAOS) — avaliação otorrino/pediátrica; impacta atenção, humor e crescimento.' },
    { idx: [9, 10, 11], min: 2, msg: 'Parassonias frequentes (terror noturno, sonambulismo, pesadelos): geralmente benignas, mas a frequência alta pede higiene do sono, segurança do ambiente e atenção à privação de sono e ao SAOS.' },
    { idx: [15, 16, 17], min: 2, msg: 'Pernas inquietas, sono muito agitado ou desconforto noturno: investigar síndrome das pernas inquietas / deficiência de ferro; considerar avaliação.' },
    { idx: [18, 19, 20], min: 2, msg: 'Sonolência e irritabilidade diurnas com impacto na atenção: a privação de sono mimetiza e agrava o TDAH — priorizar o sono antes de outras conclusões.' }
  ];

  var SUGGEST = [
    { sub: 'Respiração no sono', min: 5, msg: 'Sinais de respiração obstrutiva: priorizar avaliação para SAOS (otorrinolaringologia/pediatria).' },
    { sub: 'Rotina e higiene do sono', min: 6, msg: 'Predomínio de rotina/higiene: padronizar horários, criar ritual de sono e remover telas antes de dormir.' },
    { sub: 'Adormecer', min: 6, msg: 'Predomínio na hora de adormecer: trabalhar associações de sono e independência ao iniciar o sono.' }
  ];

  var KW = ['sono', 'dormir', 'nao dorme', 'insonia', 'acorda a noite', 'demora pra dormir', 'pesadelo',
    'terror noturno', 'sonambulismo', 'ronco', 'ronca', 'apneia', 'respira pela boca', 'range os dentes',
    'bruxismo', 'sonolencia', 'cansado', 'cochila', 'pernas inquietas', 'sono agitado', 'rotina de sono',
    'higiene do sono', 'cama dos pais'];

  function mk(b) {
    var score_max = (O.length - 1) * b.items.length;
    return {
      id: b.id, anchor: b.id,
      title: '😴 Sono NeuroPed · ' + b.band + ' (' + b.code + ')',
      short_title: b.code + ' · Sono ' + b.sigla,
      emoji: '😴', code: b.code, sigla: 'SON ' + b.sigla,
      audience: 'familia', audience_label: 'Pais/cuidador',
      age_band: b.band, age_min_months: b.min, age_max_months: b.max,
      periodo: 'Últimas 4 semanas',
      domain: 'Sono (higiene e distúrbios)',
      finalidade: 'Triagem do sono nos 7 eixos (rotina/higiene, adormecer, manutenção, parassonias, respiração/SAOS, movimento e impacto diurno), com itens próprios por faixa etária, para orientar higiene do sono e sinalizar apneia, parassonias e privação de sono.',
      symptoms: ['demora/dificuldade para dormir', 'desperta muito à noite', 'ronco/respiração bucal (suspeita de SAOS)', 'sonolência e irritabilidade diurnas'],
      complaints: KW, keywords: KW.concat([b.code, 'SON', 'autoral', 'neuroped']),
      nature: 'autoral', kind: 'autoral sono', applicable: true, npe: true, restrito: false, aviso: false,
      page: 'instrumento-autoral.html', priority: 184,
      options: opts(O), items: b.items, labels: O,
      domains: SYS.map(function (name, k) { return { name: name, items: b.items.slice(k * 3, k * 3 + 3) }; }),
      subs: subsFor(), cutoffs: CUTOFFS, traps: TRAPS, suggest: SUGGEST,
      score_max: score_max,
      plain_questions: b.items,
      clinical_use: 'Triagem do sono por faixa etária separando higiene, início, manutenção, parassonias, respiração e impacto diurno, orientando conduta e encaminhamento (otorrino, polissonografia, abordagem comportamental do sono).',
      differentiator: 'Bateria de sono por faixa etária (0–2, 3–5, 6–8, 9–11, 12–17) que separa os 7 eixos do sono, com alerta dedicado para apneia obstrutiva (SAOS) e para a privação de sono que mimetiza TDAH.',
      not_normative_disclaimer: DISC
    };
  }

  var INST = BANDS.map(mk);
  var base = Array.isArray(window.NEUROPED_EDITORIAL_SCALES) ? window.NEUROPED_EDITORIAL_SCALES : [];
  var ids = {}; base.forEach(function (x) { if (x && x.id) ids[x.id] = 1; });
  var add = INST.filter(function (x) { return !ids[x.id]; });
  window.NEUROPED_EDITORIAL_SCALES = add.concat(base);
  window.NEUROPED_SONO = add;
  window.NEUROPED_SONO_COUNT = add.length;
})();
