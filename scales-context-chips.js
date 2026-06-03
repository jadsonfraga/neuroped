/* ============================================================
   NeuroPed EDJ — scales-context-chips.js
   ============================================================
   Adiciona terceira dimensão de filtro: CONTEXTO funcional.
   Atua junto com idade + queixa que já existem em filtro-escalas.html.

   Contextos: casa, escola, social, emocional, motor, sensorial, academico

   Integração:
     - Injeta chips abaixo dos chips de queixa
     - Persiste em localStorage junto com o estado atual
     - Expõe window.NPContextChips.active() → array de tags ativas
     - Quando muda, dispara CustomEvent('npContextChange')
   ============================================================ */
(function(){
  'use strict';
  if (window.NPContextChips) return;

  var CTX = [
    ['casa',      'Casa / rotina',       '🏠'],
    ['escola',    'Escola',              '🏫'],
    ['social',    'Social / pares',      '👫'],
    ['emocional', 'Emocional',           '💗'],
    ['motor',     'Motor / coordenação', '🤸'],
    ['sensorial', 'Sensorial',           '✨'],
    ['academico', 'Acadêmico',           '📚']
  ];

  var STATE_KEY = 'neuroped_filtro_context_v1';
  var active = new Set();

  function loadState(){
    try {
      var s = JSON.parse(localStorage.getItem(STATE_KEY) || '[]');
      if (Array.isArray(s)) s.forEach(function(t){ active.add(t); });
    } catch(e){}
  }
  function saveState(){
    try { localStorage.setItem(STATE_KEY, JSON.stringify([].concat(Array.from(active)))); } catch(e){}
  }

  function mount(hostSelector){
    var queixaChips = document.getElementById('chips');
    if (!queixaChips) return false;

    // Se já existe, não recria
    if (document.getElementById('contextChips')) return true;

    var field = document.createElement('div');
    field.className = 'field';
    field.id = 'contextField';
    field.innerHTML =
      '<label style="display:flex;align-items:center;gap:8px">' +
        '<span>3 · Contexto funcional</span>' +
        '<span style="font-size:10px;color:#8b86b8;font-weight:600;letter-spacing:.04em">opcional · refina o que mais pesa</span>' +
      '</label>' +
      '<div id="contextChips" class="chips" role="group" aria-label="Contexto funcional"></div>';

    queixaChips.parentNode.parentNode.insertBefore(field, queixaChips.parentNode.nextSibling);

    var box = field.querySelector('#contextChips');
    CTX.forEach(function(item){
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip';
      b.dataset.ctx = item[0];
      b.setAttribute('role','switch');
      b.setAttribute('aria-pressed', active.has(item[0]) ? 'true' : 'false');
      b.setAttribute('aria-label', item[1]);
      b.innerHTML = '<span class="ce" aria-hidden="true">' + item[2] + '</span><span class="cl">' + item[1] + '</span>';
      if (active.has(item[0])) b.classList.add('active');
      b.addEventListener('click', function(){
        var on = !active.has(item[0]);
        if (on) {
          active.add(item[0]);
          b.classList.remove('npBounce'); void b.offsetWidth; b.classList.add('npBounce');
        } else {
          active.delete(item[0]);
        }
        b.classList.toggle('active', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
        saveState();
        document.dispatchEvent(new CustomEvent('npContextChange', { detail: { active: [].concat(Array.from(active)) }}));
      });
      box.appendChild(b);
    });
    return true;
  }

  // Boost score for context match — usado pelo runtime do filtro
  function contextBoost(scale, contextTags){
    if (!contextTags || !contextTags.length) return 0;
    var corpus = (String(scale.domain||'') + ' ' + String(scale.audience_label||'') + ' ' + (scale.keywords||[]).join(' ') + ' ' + (scale.symptoms||[]).join(' '))
      .toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
    var ctxKeywords = {
      casa:      ['rotina','familia','casa','avd','autonomia','sono','alimenta'],
      escola:    ['escola','aprendiz','professor','sala','leitura','escrita','rendimento'],
      social:    ['social','reciprocidade','pares','interacao','brincar'],
      emocional: ['humor','ansiedade','depress','emocional','irritabilidade','frustr'],
      motor:     ['motor','marcha','equilibrio','coordenacao','quedas','grafomot'],
      sensorial: ['sensorial','barulho','textura','toque','luz'],
      academico: ['aprendiz','leitura','escrita','matematica','dislex','discalcul']
    };
    var hits = 0;
    contextTags.forEach(function(t){
      var keys = ctxKeywords[t] || [];
      if (keys.some(function(k){ return corpus.indexOf(k) >= 0; })) hits++;
    });
    return Math.min(20, hits * 8);
  }

  function clear(){
    active.clear();
    document.querySelectorAll('#contextChips .chip').forEach(function(c){
      c.classList.remove('active'); c.setAttribute('aria-pressed','false');
    });
    saveState();
    document.dispatchEvent(new CustomEvent('npContextChange', { detail: { active: [] }}));
  }

  loadState();

  window.NPContextChips = {
    version: '1.0.0',
    CTX: CTX,
    mount: mount,
    active: function(){ return [].concat(Array.from(active)); },
    contextBoost: contextBoost,
    clear: clear
  };
})();
