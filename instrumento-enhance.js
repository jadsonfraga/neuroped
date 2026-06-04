/* NeuroPed SDG - instrumento-enhance.js
 *
 * Acoplador da pagina instrumento.html, ativado por <script src> no HTML.
 * Adiciona, sem reescrever a logica original (label, render, calc):
 *   - Barra de paciente (codigo + nome) sincronizada com NeuroPedScales
 *   - Persistencia das respostas + obs por (id_instrumento + paciente)
 *   - "Nao aplicavel" por item (n/a nao conta no raw nem no max)
 *   - Atalhos de teclado: 1..5 marcam o item ativo; 0 marca N/A; setas movem foco
 *   - Barra de progresso visual (X de Y respondidos)
 *   - Botoes "Salvar localmente", "Texto pra laudo", "Submeter ao backend"
 *   - Diff vs avaliacao anterior (chips comparativos)
 *   - Foco visivel nos botoes da escala (focus-visible)
 */
(function(){
  'use strict';
  if (window.__instrumentoEnhanced) return;
  window.__instrumentoEnhanced = true;

  var LABELS = ['nunca/ausente','raro/leve','as vezes','frequente','muito intenso'];
  var STATE_PREFIX = 'np_instrumento_v1::';
  var TIPS = [
    { upper: 0.25, label: 'baixa',         color: '#166534', bg: '#dcfce7' },
    { upper: 0.50, label: 'moderada',      color: '#92400e', bg: '#fef3c7' },
    { upper: 0.75, label: 'elevada',       color: '#9a3412', bg: '#fed7aa' },
    { upper: 1.01, label: 'muito elevada', color: '#7f1d1d', bg: '#fecaca' }
  ];
  function tipFor(p){ for (var i = 0; i < TIPS.length; i++) if (p < TIPS[i].upper) return TIPS[i]; return TIPS[TIPS.length-1]; }

  function instrumentId(){
    var q = new URLSearchParams(location.search).get('id');
    if (q) return q;
    var h = (location.hash || '').replace(/^#+/, '');
    return h || 'instrumento-generico';
  }
  function patient(){
    try { return (window.NeuroPedScales && window.NeuroPedScales.patient && window.NeuroPedScales.patient()) || {}; } catch(e){ return {}; }
  }
  function stateKey(){ var p = patient(); return STATE_PREFIX + instrumentId() + '::' + (p.code || '_anon'); }
  function readState(){ try { return JSON.parse(localStorage.getItem(stateKey()) || '{}'); } catch(e){ return {}; } }
  function writeState(s){ try { localStorage.setItem(stateKey(), JSON.stringify(s)); } catch(e){} }

  function answersFromButtons(){
    var out = {}, nas = {};
    document.querySelectorAll('.scale').forEach(function(scale, di){
      // ignoramos 'di' visual; usamos data-i do botao ativo
    });
    document.querySelectorAll('[data-i]').forEach(function(b){
      var i = b.dataset.i, v = b.dataset.v;
      if (!b.classList.contains('active')) return;
      if (v === 'na') nas[i] = true;
      else out[i] = Number(v);
    });
    return { values: out, na: nas };
  }

  function applyAnswers(s){
    if (!s || (!s.values && !s.na)) return;
    document.querySelectorAll('[data-i]').forEach(function(b){ b.classList.remove('active'); });
    Object.keys(s.values || {}).forEach(function(i){
      var btn = document.querySelector('[data-i="'+i+'"][data-v="'+s.values[i]+'"]');
      if (btn) btn.classList.add('active');
    });
    Object.keys(s.na || {}).forEach(function(i){
      if (!s.na[i]) return;
      var btn = document.querySelector('[data-i="'+i+'"][data-v="na"]');
      if (btn) btn.classList.add('active');
    });
    var obs = document.getElementById('obs');
    if (obs && typeof s.obs === 'string') obs.value = s.obs;
  }

  function recompute(){
    var ans = answersFromButtons();
    var totalItems = document.querySelectorAll('.item').length;
    var values = Object.values(ans.values).map(Number);
    var raw = values.reduce(function(a, b){ return a + b; }, 0);
    var answered = values.length;
    var naCount = Object.keys(ans.na).filter(function(k){return ans.na[k]}).length;
    var effectiveMax = (totalItems - naCount) * 4;
    var pct = effectiveMax > 0 ? raw / effectiveMax : 0;
    var tip = tipFor(pct);
    var setText = function(id, t){ var el = document.getElementById(id); if (el) el.textContent = t; };
    setText('answered', answered + (naCount ? ' (' + naCount + ' n/a)' : ''));
    setText('raw', raw);
    setText('pct', Math.round(pct * 100) + '%');
    setText('band', tip.label);
    var interp = document.getElementById('interp');
    if (interp) {
      interp.style.background = tip.bg;
      interp.style.color = tip.color;
      interp.textContent = 'Faixa orientativa: ' + tip.label + '. Use junto com historia clinica, exame, escola/terapias e impacto funcional. Nao e diagnostico automatico.';
    }
    renderProgress(answered + naCount, totalItems);
    renderDiff(raw, effectiveMax, pct);
    saveState(ans);
  }

  function renderProgress(done, total){
    var bar = document.getElementById('npInstrumentoProgress');
    if (!bar) return;
    var fill = bar.querySelector('.fill');
    var label = bar.querySelector('.label');
    var p = total > 0 ? Math.min(1, done / total) : 0;
    if (fill) fill.style.width = (p * 100).toFixed(0) + '%';
    if (label) label.textContent = done + ' de ' + total + ' itens respondidos';
  }

  function saveState(ans){
    var obs = document.getElementById('obs');
    writeState({
      values: ans.values,
      na: ans.na,
      obs: obs ? obs.value : '',
      ts: Date.now(),
      instrument_id: instrumentId(),
      patient: patient()
    });
  }

  function renderPatientBar(){
    if (document.getElementById('npInstrumentoPatient')) return;
    var top = document.querySelector('header.top');
    var bar = document.createElement('div');
    bar.id = 'npInstrumentoPatient';
    bar.style.cssText = 'margin:6px 14px 0;padding:8px 10px;border:1px solid rgba(169,164,255,.16);border-radius:14px;background:rgba(124,118,210,.10);font-size:12px;color:#b6b2e6;display:flex;gap:8px;flex-wrap:wrap;align-items:center';
    var p = patient();
    bar.innerHTML = '<strong style="color:#f2dca6">Paciente:</strong> ' +
      '<input id="npInstPatientCode" placeholder="codigo local (P-001)" style="border:1px solid rgba(169,164,255,.16);background:rgba(20,18,46,.6);color:#ECEAFF;border-radius:10px;padding:6px 8px;font-size:12px;width:160px" value="' + (p.code || '') + '">' +
      '<input id="npInstPatientName" placeholder="iniciais ou nome curto" style="border:1px solid rgba(169,164,255,.16);background:rgba(20,18,46,.6);color:#ECEAFF;border-radius:10px;padding:6px 8px;font-size:12px;width:200px" value="' + (p.name || '') + '">' +
      '<span style="font-size:11px;opacity:.8">Sem CPF. Identificacao local.</span>';
    if (top && top.parentNode) top.parentNode.insertBefore(bar, top.nextSibling);
    else document.body.insertBefore(bar, document.body.firstChild);
    var c = document.getElementById('npInstPatientCode'),
        n = document.getElementById('npInstPatientName');
    var sync = function(){
      var np = { code: c.value.trim(), name: n.value.trim() };
      try { window.NeuroPedScales && window.NeuroPedScales.setPatient && window.NeuroPedScales.setPatient(np); } catch(e){}
      // Re-aplicar respostas porque o stateKey muda quando o codigo do paciente muda
      applyAnswers(readState());
      recompute();
    };
    c.addEventListener('input', sync);
    n.addEventListener('input', sync);
  }

  function renderProgressBar(){
    if (document.getElementById('npInstrumentoProgress')) return;
    var hero = document.getElementById('hero');
    var bar = document.createElement('div');
    bar.id = 'npInstrumentoProgress';
    bar.setAttribute('role','progressbar');
    bar.setAttribute('aria-label','Progresso da aplicacao');
    bar.style.cssText = 'margin-top:8px;border:1px solid rgba(169,164,255,.16);border-radius:14px;overflow:hidden;background:rgba(124,118,210,.10)';
    bar.innerHTML = '<div class="fill" style="height:8px;background:linear-gradient(135deg,#6d6af5,#4f46e5);width:0%;transition:width .25s ease"></div>' +
      '<div class="label" style="padding:6px 10px;font-size:12px;color:#b6b2e6">0 de 0 itens respondidos</div>';
    if (hero) hero.appendChild(bar);
  }

  function addNAButtons(){
    document.querySelectorAll('.scale').forEach(function(scale){
      if (scale.querySelector('[data-v="na"]')) return;
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.dataset.v = 'na';
      btn.textContent = 'n/a';
      btn.title = 'Nao aplicavel (nao conta na soma)';
      btn.setAttribute('aria-label', 'Marcar como nao aplicavel');
      btn.style.cssText = 'background:rgba(124,118,210,.10);color:#b6b2e6;border:1px dashed rgba(169,164,255,.28);font-style:italic';
      // copia data-i do irmao
      var sib = scale.querySelector('[data-i]');
      if (sib) btn.dataset.i = sib.dataset.i;
      scale.appendChild(btn);
    });
    // Atualizar grid-template-columns para acomodar 6 botoes (5 + N/A)
    document.querySelectorAll('.scale').forEach(function(scale){ scale.style.gridTemplateColumns = 'repeat(6, 1fr)'; });
  }

  function bindClicks(){
    document.querySelectorAll('[data-i]').forEach(function(b){
      if (b.__npBound) return;
      b.__npBound = true;
      b.addEventListener('click', function(){
        var i = b.dataset.i, v = b.dataset.v;
        // Toggle: clicar de novo no mesmo desmarca
        var wasActive = b.classList.contains('active');
        document.querySelectorAll('[data-i="'+i+'"]').forEach(function(x){ x.classList.remove('active'); });
        if (!wasActive) b.classList.add('active');
        recompute();
      });
    });
    var obs = document.getElementById('obs');
    if (obs && !obs.__npBound) { obs.__npBound = true; obs.addEventListener('input', debounce(recompute, 200)); }
  }

  function debounce(fn, ms){ var t; return function(){ var a=arguments; clearTimeout(t); t=setTimeout(function(){fn.apply(null,a)}, ms); }; }

  function focusedItemIndex(){
    var active = document.activeElement;
    if (!active || !active.dataset || active.dataset.i == null) return -1;
    return Number(active.dataset.i);
  }
  function activateItem(idx, v){
    var btn = document.querySelector('[data-i="'+idx+'"][data-v="'+v+'"]');
    if (btn) { btn.click(); btn.focus({preventScroll:false}); }
  }

  function bindKeyboard(){
    if (window.__instrumentoKbBound) return;
    window.__instrumentoKbBound = true;
    document.addEventListener('keydown', function(ev){
      var tag = (ev.target && ev.target.tagName) || '';
      if (tag === 'TEXTAREA' || tag === 'INPUT') return;
      var idx = focusedItemIndex();
      if (ev.key >= '1' && ev.key <= '5' && idx >= 0) {
        ev.preventDefault();
        activateItem(idx, Number(ev.key) - 1);
      } else if (ev.key === '0' && idx >= 0) {
        ev.preventDefault();
        activateItem(idx, 'na');
      } else if (ev.key === 'ArrowDown' && idx >= 0) {
        ev.preventDefault();
        var next = document.querySelector('[data-i="'+(idx+1)+'"][data-v="0"]');
        if (next) next.focus();
      } else if (ev.key === 'ArrowUp' && idx > 0) {
        ev.preventDefault();
        var prev = document.querySelector('[data-i="'+(idx-1)+'"][data-v="0"]');
        if (prev) prev.focus();
      }
    });
  }

  function renderActions(){
    if (document.getElementById('npInstrumentoActions')) return;
    var interp = document.getElementById('interp');
    if (!interp) return;
    var box = document.createElement('div');
    box.id = 'npInstrumentoActions';
    box.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;margin-top:10px';
    box.innerHTML =
      '<button type="button" id="npInstSave" class="btn">Salvar local</button>' +
      '<button type="button" id="npInstLaudo" class="btn">Texto pra laudo</button>' +
      '<button type="button" id="npInstCloud" class="btn ghost">Submeter ao backend</button>' +
      '<button type="button" id="npInstClear" class="btn wine">Limpar</button>' +
      '<span id="npInstStatus" style="align-self:center;font-size:12px;color:#6f6963"></span>';
    interp.parentNode.appendChild(box);
    document.getElementById('npInstSave').addEventListener('click', function(){
      recompute(); // ja salva
      setStatus('Avaliacao salva localmente.');
      saveToHistory();
    });
    document.getElementById('npInstLaudo').addEventListener('click', function(){
      var txt = laudoText();
      if (navigator.clipboard) navigator.clipboard.writeText(txt).then(function(){ setStatus('Texto pra laudo copiado.'); });
      else setStatus(txt);
    });
    document.getElementById('npInstCloud').addEventListener('click', function(){
      submitCloud();
    });
    document.getElementById('npInstClear').addEventListener('click', function(){
      if (!confirm('Limpar respostas deste instrumento para este paciente?')) return;
      writeState({});
      document.querySelectorAll('[data-i]').forEach(function(b){ b.classList.remove('active'); });
      var obs = document.getElementById('obs'); if (obs) obs.value = '';
      recompute();
    });
  }

  function setStatus(t){
    var el = document.getElementById('npInstStatus');
    if (!el) return;
    el.textContent = t || '';
    setTimeout(function(){ if (el.textContent === t) el.textContent = ''; }, 4000);
  }

  function laudoText(){
    var ans = answersFromButtons();
    var totalItems = document.querySelectorAll('.item').length;
    var naCount = Object.keys(ans.na).filter(function(k){return ans.na[k]}).length;
    var raw = Object.values(ans.values).reduce(function(a,b){return a+Number(b)},0);
    var effectiveMax = (totalItems - naCount) * 4;
    var pct = effectiveMax > 0 ? raw / effectiveMax : 0;
    var tip = tipFor(pct);
    var p = patient();
    var title = (document.title || '').replace(/ -- NeuroPed.*/, '');
    var lines = [];
    lines.push('NeuroPed SDG - registro de instrumento');
    lines.push('Instrumento: ' + title + ' (' + instrumentId() + ')');
    if (p.name || p.code) lines.push('Paciente: ' + (p.name || p.code || '-') + (p.code && p.name ? ' (' + p.code + ')' : ''));
    lines.push('Data: ' + new Date().toLocaleString('pt-BR'));
    lines.push('');
    lines.push('Itens respondidos: ' + Object.keys(ans.values).length + ' (n/a: ' + naCount + ')');
    lines.push('Pontuacao bruta: ' + raw + ' / ' + effectiveMax + ' (' + Math.round(pct*100) + '%)');
    lines.push('Faixa orientativa: ' + tip.label);
    var obs = document.getElementById('obs');
    if (obs && obs.value.trim()) { lines.push(''); lines.push('Observacoes: ' + obs.value.trim()); }
    lines.push('');
    lines.push('Observacao: faixa baseada em % do score maximo bruto, descontando itens marcados n/a. Nao substitui validacao clinica.');
    return lines.join('\n');
  }

  function saveToHistory(){
    try {
      if (!window.NeuroPedScales || !window.NeuroPedScales.saveResult) return;
      var ans = answersFromButtons();
      var totalItems = document.querySelectorAll('.item').length;
      var naCount = Object.keys(ans.na).filter(function(k){return ans.na[k]}).length;
      var raw = Object.values(ans.values).reduce(function(a,b){return a+Number(b)},0);
      var effectiveMax = (totalItems - naCount) * 4;
      var p = patient();
      window.NeuroPedScales.saveResult({
        id: 'inst-' + Date.now() + '-' + Math.random().toString(36).slice(2,8),
        instrument_id: instrumentId(),
        instrument_title: (document.title || '').replace(/ -- NeuroPed.*/, ''),
        instrument_group: 'instrumento-funcional',
        patient_code: p.code || '',
        patient_name: p.name || '',
        created_at: new Date().toISOString(),
        score: raw, max: effectiveMax,
        domains: [{ name: 'total', score: raw, max: effectiveMax }],
        answers: ans.values,
        na: ans.na
      });
    } catch(e){}
  }

  function submitCloud(){
    if (!window.NeuroPedCloud || !window.NeuroPedCloud.enabled || !window.NeuroPedCloud.enabled()) {
      setStatus('Backend Supabase nao esta ativo (cloud-config.js).');
      return;
    }
    var ans = answersFromButtons();
    var totalItems = document.querySelectorAll('.item').length;
    var naCount = Object.keys(ans.na).filter(function(k){return ans.na[k]}).length;
    var raw = Object.values(ans.values).reduce(function(a,b){return a+Number(b)},0);
    var effectiveMax = (totalItems - naCount) * 4;
    var p = patient();
    setStatus('Enviando ao backend...');
    window.NeuroPedCloud.saveSubmission({
      instrument_id: instrumentId(),
      instrument_title: (document.title || '').replace(/ -- NeuroPed.*/, ''),
      instrument_group: 'instrumento-funcional',
      case_code: p.code || null,
      patient_code: p.name || null,
      answers_json: { values: ans.values, na: ans.na, obs: (document.getElementById('obs')||{}).value || '' },
      raw_score: raw,
      total_items: totalItems - naCount,
      source_page: location.pathname,
      notes: 'instrumento.html'
    }).then(function(r){
      setStatus(r && r.ok ? 'Enviado. id=' + (r.id || '-') : 'Falha: ' + (r && r.error ? r.error : 'sem resposta'));
    }).catch(function(e){ setStatus('Erro: ' + e.message); });
  }

  function renderDiff(currentRaw, currentMax, currentPct){
    var diffBox = document.getElementById('npInstrumentoDiff');
    if (!diffBox) {
      var interp = document.getElementById('interp');
      if (!interp || !interp.parentNode) return;
      diffBox = document.createElement('div');
      diffBox.id = 'npInstrumentoDiff';
      diffBox.style.cssText = 'margin-top:10px;font-size:12px;color:#6f6963';
      interp.parentNode.insertBefore(diffBox, interp.nextSibling);
    }
    try {
      if (!window.NeuroPedScales || !window.NeuroPedScales.history) { diffBox.textContent = ''; return; }
      var p = patient();
      var hist = window.NeuroPedScales.history(instrumentId(), p.code).slice(0, 1);
      if (!hist.length || !currentMax) { diffBox.textContent = ''; return; }
      var last = hist[0];
      var lastPct = last.max ? (last.score / last.max) : 0;
      var deltaPct = (currentPct - lastPct) * 100;
      var arrow = deltaPct > 0.5 ? '▲' : (deltaPct < -0.5 ? '▼' : '=');
      var color = deltaPct > 0.5 ? '#9a3412' : (deltaPct < -0.5 ? '#166534' : '#6f6963');
      diffBox.innerHTML = '<strong>Vs. avaliacao anterior</strong> (' +
        new Date(last.created_at).toLocaleDateString('pt-BR') + '): ' +
        last.score + '/' + last.max + ' (' + Math.round(lastPct*100) + '%) -> ' +
        currentRaw + '/' + currentMax + ' (' + Math.round(currentPct*100) + '%) ' +
        '<span style="color:' + color + ';font-weight:900">' + arrow + ' ' +
        (deltaPct > 0 ? '+' : '') + deltaPct.toFixed(1) + ' p.p.</span>';
    } catch(e){ diffBox.textContent = ''; }
  }

  // O botão "Imprimir" original chamava window.print() = imprimia a PÁGINA INTEIRA
  // do app (fundo escuro, menus) — saía quebrado e parecia "não gerar resultado".
  // Trocamos por um documento LIMPO só com o resultado, impresso via iframe oculto
  // (não depende de pop-up, que iOS Safari bloqueia).
  function fixPrintButton(){
    var btns = document.querySelectorAll('button');
    for (var i = 0; i < btns.length; i++){
      var b = btns[i];
      if (/^\s*imprimir\s*$/i.test(b.textContent || '') && !b.__npFixed){
        b.__npFixed = true;
        b.removeAttribute('onclick');
        b.addEventListener('click', function(ev){ ev.preventDefault(); printResultDoc(); });
      }
    }
  }

  function getText(id){ var el = document.getElementById(id); return el ? (el.value != null && el.tagName === 'TEXTAREA' ? el.value : el.textContent) || '' : ''; }

  function printResultDoc(){
    var esc = function(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[c]; }); };
    var titleEl = document.querySelector('#hero h1, h1');
    var title = titleEl ? titleEl.textContent : 'Instrumento';
    var pac = '';
    var pbar = document.getElementById('npPatientBar') || document.getElementById('instPatientBar');
    if (pbar && pbar.textContent.trim()) pac = pbar.textContent.trim();
    var raw = getText('raw'), pct = getText('pct'), band = getText('band'), answered = getText('answered');
    var interp = (document.getElementById('interp') && document.getElementById('interp').textContent) || '';
    var obs = getText('obs');
    // tabela de perguntas/respostas a partir do DOM já renderizado
    var rows = '';
    var items = document.querySelectorAll('.item');
    for (var i = 0; i < items.length; i++){
      var qEl = items[i].querySelector('.q, .question, p, label');
      var q = qEl ? qEl.textContent : ('Item ' + (i + 1));
      var sel = items[i].querySelector('.opt.active, .opt[aria-pressed="true"], button.active');
      var ans = sel ? sel.textContent.trim() : '—';
      rows += '<tr><td>' + (i + 1) + '</td><td>' + esc(q) + '</td><td>' + esc(ans) + '</td></tr>';
    }
    var html =
      '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>' + esc(title) + '</title>' +
      '<style>body{font-family:Arial,Helvetica,sans-serif;color:#111;padding:24px;line-height:1.5}h1{font-size:20px;margin:0 0 6px;color:#7f1d1d}.box{border:1px solid #ddd;background:#fafafa;padding:10px;border-radius:8px;margin:8px 0;font-size:13px}.tip{padding:10px;border-radius:8px;background:#fef3c7;color:#92400e;margin:8px 0;font-weight:700}table{width:100%;border-collapse:collapse;margin:10px 0}th,td{border:1px solid #ddd;padding:6px 8px;font-size:12px;text-align:left;vertical-align:top}th{background:#f4e7d3}.warn{font-size:11px;color:#555;margin-top:18px;border-top:1px solid #ddd;padding-top:8px}@media print{body{padding:14mm}}</style>' +
      '</head><body><h1>' + esc(title) + '</h1>' +
      (pac ? '<div class="box">' + esc(pac) + '</div>' : '') +
      '<div class="box"><b>Data:</b> ' + esc(new Date().toLocaleString('pt-BR')) +
      ' &middot; <b>Respondidos:</b> ' + esc(answered) + '</div>' +
      '<div class="tip">Pontuação bruta: ' + esc(raw) + (pct ? ' &middot; ' + esc(pct) : '') +
      (band ? ' &middot; Faixa orientativa: ' + esc(band) : '') + '</div>' +
      (interp ? '<p>' + esc(interp) + '</p>' : '') +
      (rows ? '<table><thead><tr><th>#</th><th>Item</th><th>Resposta</th></tr></thead><tbody>' + rows + '</tbody></table>' : '') +
      (obs ? '<div class="box"><b>Observações:</b> ' + esc(obs) + '</div>' : '') +
      '<div class="warn">Faixa interpretativa baseada em % do score máximo bruto. Não substitui validação clínica nem cutoffs originais do instrumento. Decisão diagnóstica é do médico responsável.</div>' +
      '</body></html>';
    printViaIframe(html);
  }

  function printViaIframe(html){
    try {
      var old = document.getElementById('npInstPrintFrame');
      if (old && old.parentNode) old.parentNode.removeChild(old);
      var f = document.createElement('iframe');
      f.id = 'npInstPrintFrame';
      f.setAttribute('aria-hidden', 'true');
      f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0';
      document.body.appendChild(f);
      var fired = false;
      function doPrint(){ if (fired) return; fired = true; try { f.contentWindow.focus(); f.contentWindow.print(); } catch (e) { popupPrint(html); } }
      f.onload = function(){ setTimeout(doPrint, 120); };
      var doc = f.contentWindow.document; doc.open(); doc.write(html); doc.close();
      setTimeout(doPrint, 600);
    } catch (e) { popupPrint(html); }
  }
  function popupPrint(html){
    var w = window.open('', '_blank');
    if (w){ w.document.open(); w.document.write(html); w.document.close(); setTimeout(function(){ try { w.focus(); w.print(); } catch (e) {} }, 250); return; }
    try { alert('Impressão bloqueada pelo navegador. Libere os pop-ups deste site ou use "Copiar resumo".'); } catch (e) {}
  }

  function attemptEnhance(){
    if (!document.querySelectorAll('.item').length) return false;
    renderPatientBar();
    renderProgressBar();
    addNAButtons();
    bindClicks();
    bindKeyboard();
    fixPrintButton();
    renderActions();
    applyAnswers(readState());
    recompute();
    return true;
  }

  function watch(){
    // load() do instrumento.html e async; pode demorar. Retry curto.
    if (attemptEnhance()) return;
    var n = 0;
    var t = setInterval(function(){
      n++;
      if (attemptEnhance() || n > 40) clearInterval(t);
    }, 200);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watch);
  else watch();
})();
