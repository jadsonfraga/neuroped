/* ============================================================
   NeuroPed EDJ — scales-why-card.js
   ============================================================
   Gera o painel "Por que indicado?" para uma escala dado o sinal
   clínico fornecido (idade + queixas + contexto + audiência).

   Filosofia: NÃO recalcula score. Apenas traduz os sinais usados
   pelo recommender em prosa clínica curta, item a item.
   ============================================================ */
(function(){
  'use strict';
  if (window.NPScaleWhy) return;

  function norm(s){ return String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,''); }

  function ageReason(scale, ageMonths){
    if (!ageMonths) return null;
    var min = Number(scale.age_min_months || scale.idade_min_meses || 0);
    var max = Number(scale.age_max_months || scale.idade_max_meses || 240);
    if (ageMonths >= min && ageMonths <= max) {
      var band = scale.age_band || (min + '–' + max + ' meses');
      return { tag: 'idade', text: 'Faixa etária bate: ' + band + '.' };
    }
    var dist = ageMonths < min ? (min - ageMonths) : (ageMonths - max);
    if (dist <= 12) return { tag: 'idade-borda', text: 'Idade na borda da faixa preferencial — interpretar com cautela.' };
    return null;
  }

  function complaintReasons(scale, complaintTags){
    var matched = [];
    var sc = (scale.complaints || []).map(norm);
    (complaintTags || []).forEach(function(t){
      var n = norm(t);
      if (sc.indexOf(n) >= 0) matched.push(t);
    });
    if (!matched.length) return null;
    var labelMap = {
      tea: 'TEA / espectro', tdah: 'TDAH / desatenção', fala: 'fala e linguagem',
      escola: 'aprendizagem escolar', comportamento: 'comportamento/oposição',
      agressividade: 'agressividade/crises', sono: 'sono', alimentacao: 'alimentação',
      ansiedade: 'ansiedade', humor: 'humor/tristeza', motor: 'desenvolvimento motor',
      sensorial: 'perfil sensorial', epilepsia: 'crises/epilepsia', cefaleia: 'cefaleia',
      autonomia: 'autonomia/AVDs', risco: 'risco/autolesão', medicacao: 'resposta a medicação'
    };
    var labeled = matched.map(function(t){ return labelMap[t] || t; });
    return { tag: 'queixa', text: 'Cobre a queixa: ' + labeled.join(', ') + '.' };
  }

  function audienceReason(scale){
    var aud = norm(scale.audience);
    var map = {
      familia: 'Família responde — bom pra mapear casa e rotina.',
      escola:  'Professor responde — captura desempenho em sala.',
      auto:    'Autorrelato — voz da criança/adolescente.',
      autoteste: 'Autorrelato — voz da criança/adolescente.',
      clinico: 'Aplicado pelo clínico — observação direta.',
      terapeuta: 'Aplicado em sessão terapêutica — observação direta.',
      direto:  'Tarefa direta com a criança — desempenho ao vivo.'
    };
    if (map[aud]) return { tag: 'audiencia', text: map[aud] };
    return null;
  }

  function contextReasons(scale, contextTags){
    if (!contextTags || !contextTags.length) return null;
    var sc = norm((scale.domain || '') + ' ' + (scale.audience_label || '') + ' ' + (scale.keywords || []).join(' '));
    var hits = [];
    var ctxMap = {
      casa:      ['rotina','familia','casa','avd','autonomia','sono','alimenta'],
      escola:    ['escola','aprendiz','professor','sala','leitura','escrita','rendimento'],
      social:    ['social','reciprocidade','pares','interacao','brincar'],
      emocional: ['humor','ansiedade','depress','emocional','irritabilidade','frustr'],
      motor:     ['motor','marcha','equilibrio','coordenacao','quedas','grafomot'],
      sensorial: ['sensorial','barulho','textura','toque','luz'],
      academico: ['aprendiz','leitura','escrita','matematica','dislex','discalcul']
    };
    contextTags.forEach(function(t){
      var keys = ctxMap[t] || [];
      if (keys.some(function(k){ return sc.indexOf(k) >= 0; })) hits.push(t);
    });
    if (!hits.length) return null;
    return { tag: 'contexto', text: 'Contexto alvo: ' + hits.join(', ') + '.' };
  }

  function typeReason(scale){
    var tx = window.NPScaleTaxonomy;
    if (!tx) return null;
    var tipo = tx.inferType(scale);
    var meta = tx.TYPES[tipo];
    return { tag: 'tipo', text: meta.emoji + ' ' + meta.label + ' — ' + meta.desc + '.' };
  }

  function build(scale, signals){
    signals = signals || {};
    var reasons = [
      typeReason(scale),
      ageReason(scale, signals.ageMonths),
      complaintReasons(scale, signals.complaints),
      contextReasons(scale, signals.contexts),
      audienceReason(scale)
    ].filter(Boolean);

    // Razões intrínsecas pré-existentes
    if (scale.clinical_use)   reasons.push({ tag: 'uso',  text: scale.clinical_use });
    if (scale.differentiator) reasons.push({ tag: 'diff', text: 'Diferencial: ' + scale.differentiator });

    return reasons;
  }

  function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]; }); }

  function html(scale, signals){
    var reasons = build(scale, signals);
    if (!reasons.length) return '';
    var name = scale.short_title || scale.title || 'Instrumento';
    var items = reasons.map(function(r){
      return '<li class="np-why-item" data-tag="' + esc(r.tag) + '" style="margin:6px 0;padding-left:6px;display:flex;gap:8px;align-items:flex-start">' +
        '<span aria-hidden="true" style="color:#7c79ff;font-weight:800">›</span>' +
        '<span>' + esc(r.text) + '</span></li>';
    }).join('');
    return '<details class="np-why-card" style="margin-top:10px;border:1px solid rgba(124,118,210,.24);background:rgba(124,118,210,.06);border-radius:14px;padding:10px 12px">' +
      '<summary style="cursor:pointer;font-weight:800;color:#e7c98b;font-size:13px;letter-spacing:.02em">🧠 Por que ' + esc(name) + '?</summary>' +
      '<ul style="list-style:none;margin:8px 0 0;padding:0;color:#cdc8ee;font-size:13px;line-height:1.55">' + items + '</ul>' +
      '</details>';
  }

  window.NPScaleWhy = {
    version: '1.0.0',
    build: build,
    html: html
  };
})();
