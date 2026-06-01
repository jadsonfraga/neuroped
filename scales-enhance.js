/* NeuroPed EDJ — scales-enhance.js
 * Acoplador clínico para as páginas banco-escalas*.html.
 *
 * Não substitui validação clínica: as faixas interpretativas usam a razão score/score_max
 * (baixo / moderado / elevado / muito elevado). O médico mantém a decisão.
 *
 * O que adiciona, sem alterar o array `scales` das páginas:
 *   - Campo de paciente (código local, livre, sem CPF).
 *   - Score por domínio em tempo real.
 *   - Faixa interpretativa por instrumento (0 a 4 níveis com base em % do máximo).
 *   - Persistência por (instrumento + paciente) em localStorage.
 *   - Histórico longitudinal navegável.
 *   - "Texto pra laudo" — bloco pronto para colar em prontuário/laudo.
 *   - Imprimir só o instrumento e respostas (não a página toda).
 *   - Submeter à Pages Function /api/submissions (com Origin check, opt-in).
 *   - Aviso explícito de que faixas são orientativas, não diagnóstico.
 */
(function(){
  'use strict';
  if (window.__neuropedScalesEnhanced) return;
  window.__neuropedScalesEnhanced = true;

  var PATIENT_KEY = 'neuroped_scales_patient_v1';
  var RESULTS_KEY = 'neuroped_scales_results_v1';
  var TIPS = [
    { upper: 0.25, label: 'baixa',         color: '#166534', bg: '#dcfce7', text: 'Pontuação relativamente baixa. Continue acompanhando o desenvolvimento e ajuste se aparecerem novos sinais.' },
    { upper: 0.50, label: 'moderada',      color: '#92400e', bg: '#fef3c7', text: 'Pontuação moderada. Considere observação dirigida em consulta, escala combinada e revisão de gatilhos funcionais.' },
    { upper: 0.75, label: 'elevada',       color: '#9a3412', bg: '#fed7aa', text: 'Pontuação elevada. Sugere prioridade clínica para investigação dirigida, integração com outras escalas e orientação à família.' },
    { upper: 1.01, label: 'muito elevada', color: '#7f1d1d', bg: '#fecaca', text: 'Pontuação muito elevada. Sugere prioridade alta; combinar com observação clínica, comorbidades e impacto funcional.' }
  ];

  function readJSON(k, fallback){
    try { var v = JSON.parse(localStorage.getItem(k) || 'null'); return v == null ? fallback : v; }
    catch (e) { return fallback; }
  }
  function writeJSON(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function getPatient(){ return readJSON(PATIENT_KEY, { code: '', name: '' }); }
  function setPatient(p){ writeJSON(PATIENT_KEY, p); }
  function allResults(){ return readJSON(RESULTS_KEY, []); }
  function saveResult(r){
    var list = allResults();
    list.unshift(r);
    list = list.slice(0, 400);
    writeJSON(RESULTS_KEY, list);
  }
  function historyFor(instrumentId, patientCode){
    return allResults().filter(function(r){
      return r.instrument_id === instrumentId && (!patientCode || r.patient_code === patientCode);
    });
  }

  function maxScorePerItem(inst){ return Math.max(0, (inst.labels || []).length - 1); }
  function domainScores(inst, answers){
    var perItem = maxScorePerItem(inst);
    return (inst.domains || []).map(function(d, di){
      var sum = 0, count = (d.items || []).length;
      (d.items || []).forEach(function(_, ii){
        var v = Number(answers && answers[di + '-' + ii]);
        if (Number.isFinite(v)) sum += v;
      });
      var max = count * perItem;
      return { name: d.name, score: sum, max: max, pct: max ? sum / max : 0 };
    });
  }
  function totalScore(inst, answers){
    return domainScores(inst, answers).reduce(function(acc, d){
      return { score: acc.score + d.score, max: acc.max + d.max };
    }, { score: 0, max: 0 });
  }
  function tipFor(pct){
    for (var i = 0; i < TIPS.length; i++) if (pct < TIPS[i].upper) return TIPS[i];
    return TIPS[TIPS.length - 1];
  }
  function fmtPct(p){ return (p * 100).toFixed(0) + '%'; }

  function laudoText(inst, answers, patient){
    var t = totalScore(inst, answers);
    var ds = domainScores(inst, answers);
    var tip = tipFor(t.max ? t.score / t.max : 0);
    var lines = [];
    lines.push('NeuroPed EDJ — registro estruturado de instrumento');
    lines.push('Instrumento: ' + (inst.title || inst.id));
    if (inst.subtitle) lines.push('Aplicação: ' + inst.subtitle);
    lines.push('Paciente: ' + (patient.name || patient.code || '—'));
    if (patient.code) lines.push('Código local: ' + patient.code);
    lines.push('Data: ' + new Date().toLocaleString('pt-BR'));
    lines.push('');
    lines.push('Pontuação bruta: ' + t.score + ' / ' + t.max + (t.max ? ' (' + fmtPct(t.score / t.max) + ')' : ''));
    lines.push('Faixa orientativa: ' + tip.label + ' — ' + tip.text);
    if (ds.length) {
      lines.push('');
      lines.push('Por domínio:');
      ds.forEach(function(d){
        lines.push('  · ' + d.name + ': ' + d.score + ' / ' + d.max + (d.max ? ' (' + fmtPct(d.pct) + ')' : ''));
      });
    }
    lines.push('');
    lines.push('Observação: faixa interpretativa baseada em % do score máximo bruto. Não substitui validação clínica nem cutoffs originais do instrumento. A decisão diagnóstica é do médico responsável.');
    return lines.join('\n');
  }

  function printResult(inst, answers, patient){
    var t = totalScore(inst, answers);
    var ds = domainScores(inst, answers);
    var tip = tipFor(t.max ? t.score / t.max : 0);
    var esc = function(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); };
    var rows = (inst.domains || []).map(function(d, di){
      var items = (d.items || []).map(function(item, ii){
        var v = answers && answers[di + '-' + ii];
        var label = (v != null && inst.labels && inst.labels[v]) || '—';
        return '<tr><td>' + (ii + 1) + '</td><td>' + esc(item) + '</td><td>' + esc(label) + '</td></tr>';
      }).join('');
      return '<h3>' + esc(d.name) + '</h3><table><thead><tr><th>#</th><th>Item</th><th>Resposta</th></tr></thead><tbody>' + items + '</tbody></table>';
    }).join('');
    var html =
      '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>' + esc(inst.title || inst.id) + '</title>' +
      '<style>body{font-family:Arial,Helvetica,sans-serif;color:#111;padding:24px;line-height:1.5}h1{font-size:20px;margin:0 0 6px;color:#7f1d1d}h2{font-size:16px;margin:14px 0 6px;color:#0f766e}h3{font-size:14px;margin:12px 0 4px;color:#7f1d1d}table{width:100%;border-collapse:collapse;margin-bottom:10px}th,td{border:1px solid #ddd;padding:6px 8px;font-size:12px;vertical-align:top;text-align:left}th{background:#f4e7d3}.box{border:1px solid #ddd;background:#fafafa;padding:10px;border-radius:8px;margin:8px 0}.tip{padding:8px;border-radius:8px}.warn{font-size:11px;color:#555;margin-top:18px;border-top:1px solid #ddd;padding-top:8px}@media print{body{padding:14mm}}</style>' +
      '</head><body>' +
      '<h1>' + esc(inst.title || inst.id) + '</h1>' +
      (inst.subtitle ? '<p>' + esc(inst.subtitle) + '</p>' : '') +
      '<div class="box"><b>Paciente:</b> ' + esc(patient.name || patient.code || '—') +
      (patient.code ? ' &middot; <b>Código local:</b> ' + esc(patient.code) : '') +
      ' &middot; <b>Data:</b> ' + esc(new Date().toLocaleString('pt-BR')) + '</div>' +
      '<div class="tip" style="background:' + tip.bg + ';color:' + tip.color + '"><b>Pontuação bruta:</b> ' + t.score + ' / ' + t.max +
      (t.max ? ' (' + fmtPct(t.score / t.max) + ')' : '') + ' &middot; <b>Faixa orientativa:</b> ' + tip.label + '<br>' + esc(tip.text) + '</div>' +
      '<h2>Domínios</h2><ul>' +
      ds.map(function(d){ return '<li>' + esc(d.name) + ': ' + d.score + ' / ' + d.max + (d.max ? ' (' + fmtPct(d.pct) + ')' : '') + '</li>'; }).join('') +
      '</ul>' + rows +
      '<div class="warn">Faixa interpretativa baseada em % do score máximo bruto. Não substitui validação clínica nem cutoffs originais do instrumento. Decisão diagnóstica é do médico responsável.</div>' +
      '</body></html>';

    // ===== ESTRATÉGIA À PROVA DE FALHAS =====
    // O resultado SEMPRE aparece na própria tela (overlay embutido), sem depender
    // de pop-up nem de impressão. Dentro dele há botões de Imprimir/PDF e Copiar.
    // Assim, mesmo com pop-up bloqueado (iOS Safari etc.), o usuário VÊ o resultado.
    showResultOverlay(html, inst, answers, patient);
  }

  function showResultOverlay(html, inst, answers, patient){
    var prev = document.getElementById('npResultOverlay');
    if (prev && prev.parentNode) prev.parentNode.removeChild(prev);

    var ov = document.createElement('div');
    ov.id = 'npResultOverlay';
    ov.setAttribute('role', 'dialog');
    ov.setAttribute('aria-modal', 'true');
    ov.setAttribute('aria-label', 'Resultado da escala');
    ov.style.cssText = 'position:fixed;inset:0;z-index:100000;background:rgba(8,8,20,.66);display:flex;align-items:flex-start;justify-content:center;overflow:auto;padding:20px;-webkit-overflow-scrolling:touch';

    var sheet = document.createElement('div');
    sheet.style.cssText = 'background:#fff;color:#111;max-width:760px;width:100%;border-radius:16px;box-shadow:0 24px 70px rgba(0,0,0,.5);overflow:hidden;margin:auto';

    var bar = document.createElement('div');
    bar.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;align-items:center;padding:12px 14px;background:#0e0e22;position:sticky;top:0';
    bar.innerHTML =
      '<strong style="color:#f2dca6;font:700 14px system-ui;margin-right:auto">Resultado da avaliação</strong>' +
      '<button id="npResPrint" style="border:0;border-radius:10px;padding:10px 14px;font:800 13px system-ui;cursor:pointer;background:#6d6af5;color:#fff">🖨️ Imprimir / PDF</button>' +
      '<button id="npResCopy" style="border:0;border-radius:10px;padding:10px 14px;font:800 13px system-ui;cursor:pointer;background:#e7c98b;color:#241a05">📋 Copiar</button>' +
      '<button id="npResClose" aria-label="Fechar" style="border:0;border-radius:10px;padding:10px 13px;font:800 15px system-ui;cursor:pointer;background:rgba(255,255,255,.14);color:#fff">✕</button>';

    var body = document.createElement('div');
    body.id = 'npResultContent';
    body.style.cssText = 'padding:18px 20px 26px;max-height:none';
    // injeta só o conteúdo do <body> do html (sem doctype/head)
    var inner = html.replace(/[\s\S]*<body>/, '').replace(/<\/body>[\s\S]*/, '');
    body.innerHTML = inner;

    sheet.appendChild(bar); sheet.appendChild(body); ov.appendChild(sheet);
    document.body.appendChild(ov);

    function close(){ if (ov.parentNode) ov.parentNode.removeChild(ov); }
    document.getElementById('npResClose').onclick = close;
    ov.addEventListener('click', function(ev){ if (ev.target === ov) close(); });
    document.addEventListener('keydown', function esc(ev){ if (ev.key === 'Escape'){ document.removeEventListener('keydown', esc); close(); } });

    document.getElementById('npResPrint').onclick = function(){ printViaIframe(html); };
    document.getElementById('npResCopy').onclick = function(){
      var txt = (typeof laudoText === 'function') ? laudoText(inst, answers, patient) : (body.innerText || '');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(txt).then(function(){ flash('npResCopy', '✓ Copiado'); }, function(){ selectText(body); });
      } else { selectText(body); }
    };
  }

  function flash(id, label){
    var b = document.getElementById(id); if (!b) return;
    var old = b.textContent; b.textContent = label;
    setTimeout(function(){ if (b) b.textContent = old; }, 1600);
  }
  function selectText(node){
    try { var r = document.createRange(); r.selectNodeContents(node); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); } catch (e) {}
  }

  // Impressão opcional via iframe oculto (não depende de pop-up). Só roda no clique.
  function printViaIframe(html){
    try {
      var old = document.getElementById('npScalesPrintFrame');
      if (old && old.parentNode) old.parentNode.removeChild(old);
      var f = document.createElement('iframe');
      f.id = 'npScalesPrintFrame';
      f.setAttribute('aria-hidden', 'true');
      f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0';
      document.body.appendChild(f);
      var fired = false;
      function doPrint(){ if (fired) return; fired = true; try { f.contentWindow.focus(); f.contentWindow.print(); } catch (e) { popupFallback(html); } }
      f.onload = function(){ setTimeout(doPrint, 120); };
      var doc = f.contentWindow.document; doc.open(); doc.write(html); doc.close();
      setTimeout(doPrint, 600);
    } catch (e) { popupFallback(html); }
  }

  // Último recurso de impressão: pop-up; se bloqueado, avisa (resultado já está na tela).
  function popupFallback(html){
    var w = window.open('', '_blank');
    if (w) {
      w.document.open(); w.document.write(html); w.document.close();
      setTimeout(function(){ try { w.focus(); w.print(); } catch (e) {} }, 250);
      return;
    }
    reportStatus('Impressão bloqueada pelo navegador — o resultado já está na tela. Use "Copiar" ou libere os pop-ups para imprimir.', true);
  }

  // Status sempre acessível (escreve no #npScalesStatus por id; alerta se ausente).
  function reportStatus(msg, isError){
    var el = document.getElementById('npScalesStatus');
    if (el) {
      el.textContent = msg;
      if (!isError) setTimeout(function(){ if (el.textContent === msg) el.textContent = ''; }, 5000);
      return;
    }
    if (isError) try { alert(msg); } catch (e) {}
  }

  function buildPayload(inst, answers, patient){
    var t = totalScore(inst, answers);
    var ds = domainScores(inst, answers);
    return {
      instrument_id: inst.id,
      instrument_title: inst.title,
      instrument_group: inst.cat || null,
      case_code: patient.code || null,
      patient_code: patient.name || null,
      answers_json: { answers: answers || {}, domains: ds, total: t },
      raw_score: t.score,
      total_items: ds.reduce(function(a, d){ return a + (d.max ? d.max / (inst.labels.length - 1) : 0); }, 0),
      source_page: location.pathname,
      notes: 'submitted from ' + location.pathname
    };
  }
  function submitToBackend(inst, answers, patient){
    var payload = buildPayload(inst, answers, patient);
    // Se Supabase opt-in estiver ativo, usar np-cloud.js (write-only via RLS).
    if (window.NeuroPedCloud && window.NeuroPedCloud.enabled && window.NeuroPedCloud.enabled()) {
      return window.NeuroPedCloud.saveSubmission(payload).then(function(r){
        return new Response(JSON.stringify(r.ok ? { ok: true, id: r.id, route: 'supabase' } : { ok: false, error: r.error || 'falhou', route: 'supabase' }), {
          status: r.ok ? 200 : (r.status || 500),
          headers: { 'Content-Type': 'application/json' }
        });
      });
    }
    // Fallback: Cloudflare Pages Function (D1) - rota canonica atual.
    return fetch('/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }

  function ensurePatientBar(){
    if (document.getElementById('npScalesPatientBar')) return;
    var bar = document.createElement('section');
    bar.id = 'npScalesPatientBar';
    bar.style.cssText = 'position:sticky;top:54px;z-index:18;background:rgba(14,14,34,.92);backdrop-filter:blur(10px);border:1px solid rgba(169,164,255,.16);border-radius:14px;padding:10px 12px;margin:8px 0;display:flex;gap:8px;flex-wrap:wrap;align-items:center';
    bar.innerHTML =
      '<strong style="color:#f2dca6;font-size:13px">Paciente</strong>' +
      '<input id="npScalesPatientCode" placeholder="código local (ex.: P-001)" style="flex:0 0 180px;background:rgba(20,18,46,.6);color:#ECEAFF;border:1px solid rgba(169,164,255,.16);border-radius:10px;padding:8px 10px;font-size:13px">' +
      '<input id="npScalesPatientName" placeholder="iniciais ou nome curto" style="flex:1;min-width:180px;background:rgba(20,18,46,.6);color:#ECEAFF;border:1px solid rgba(169,164,255,.16);border-radius:10px;padding:8px 10px;font-size:13px">' +
      '<span style="font-size:11px;color:#b6b2e6;flex:1 1 100%">Sem CPF. Identificação local apenas. Use somente dados não-sensíveis enquanto o backend não estiver homologado.</span>';
    var toolbar = document.querySelector('.toolbar');
    if (toolbar && toolbar.parentNode) toolbar.parentNode.insertBefore(bar, toolbar.nextSibling);
    else document.body.insertBefore(bar, document.body.firstChild);
    var p = getPatient();
    var c = document.getElementById('npScalesPatientCode');
    var n = document.getElementById('npScalesPatientName');
    c.value = p.code || ''; n.value = p.name || '';
    var save = function(){ setPatient({ code: c.value.trim(), name: n.value.trim() }); rerender(); };
    c.addEventListener('input', save);
    n.addEventListener('input', save);
  }

  function activeInstrument(){
    if (!window.scales || !Array.isArray(window.scales)) return null;
    var id = window.activeId || (window.scales[0] && window.scales[0].id);
    return window.scales.find(function(s){ return s.id === id; }) || window.scales[0] || null;
  }
  function currentAnswers(inst){
    if (!inst || !window.answers) return {};
    return window.answers[inst.id] || {};
  }

  function ensureFooter(){
    var detail = document.getElementById('detail');
    if (!detail) return;
    if (document.getElementById('npScalesFooter')) return;
    var foot = document.createElement('div');
    foot.id = 'npScalesFooter';
    foot.style.cssText = 'margin-top:14px;border:1px dashed rgba(169,164,255,.28);background:rgba(124,118,210,.08);border-radius:14px;padding:12px';
    foot.innerHTML =
      '<div id="npScalesInterpret" style="padding:10px;border-radius:10px;font-size:13px;margin-bottom:10px"></div>' +
      '<div id="npScalesDomains" style="font-size:12px;color:#241b1b;margin-bottom:10px"></div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
        '<button type="button" id="npScalesSave" class="btn">Salvar avaliação</button>' +
        '<button type="button" id="npScalesPrint" class="btn">Imprimir só este instrumento</button>' +
        '<button type="button" id="npScalesText" class="btn">Texto pra laudo</button>' +
        '<button type="button" id="npScalesSubmit" class="btn secondary">Submeter ao backend</button>' +
        '<button type="button" id="npScalesHist" class="btn secondary">Histórico</button>' +
      '</div>' +
      '<div id="npScalesStatus" style="font-size:12px;color:#675b56;margin-top:8px"></div>' +
      '<div id="npScalesHistList" style="margin-top:10px;display:none;font-size:12px"></div>';
    detail.appendChild(foot);
    var status = document.getElementById('npScalesStatus');
    var setStatus = function(t){ status.textContent = t || ''; setTimeout(function(){ if (status.textContent === t) status.textContent = ''; }, 4000); };
    document.getElementById('npScalesSave').onclick = function(){
      var inst = activeInstrument(); if (!inst) return;
      var ans = currentAnswers(inst);
      var t = totalScore(inst, ans);
      saveResult({
        id: 'sr-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
        instrument_id: inst.id,
        instrument_title: inst.title,
        instrument_group: inst.cat || null,
        patient_code: getPatient().code || '',
        patient_name: getPatient().name || '',
        created_at: new Date().toISOString(),
        score: t.score, max: t.max,
        domains: domainScores(inst, ans),
        answers: ans
      });
      setStatus('Avaliação salva localmente.');
    };
    document.getElementById('npScalesPrint').onclick = function(){
      var inst = activeInstrument(); if (!inst) return;
      printResult(inst, currentAnswers(inst), getPatient());
    };
    document.getElementById('npScalesText').onclick = function(){
      var inst = activeInstrument(); if (!inst) return;
      var txt = laudoText(inst, currentAnswers(inst), getPatient());
      if (navigator.clipboard) navigator.clipboard.writeText(txt).then(function(){ setStatus('Texto copiado pra área de transferência.'); });
      else setStatus(txt);
    };
    document.getElementById('npScalesSubmit').onclick = function(){
      var inst = activeInstrument(); if (!inst) return;
      setStatus('Enviando…');
      submitToBackend(inst, currentAnswers(inst), getPatient())
        .then(function(r){ return r.json().catch(function(){ return { ok: r.ok }; }); })
        .then(function(j){ setStatus(j && j.ok ? 'Enviado. id=' + (j.id || '—') : 'Falha: ' + (j && j.error ? j.error : 'sem resposta')); })
        .catch(function(e){ setStatus('Sem backend disponível neste deploy.'); });
    };
    document.getElementById('npScalesHist').onclick = function(){
      var inst = activeInstrument(); if (!inst) return;
      var box = document.getElementById('npScalesHistList');
      var p = getPatient();
      var hist = historyFor(inst.id, p.code).slice(0, 12);
      if (!hist.length) { box.style.display = 'block'; box.innerHTML = '<em>Sem avaliações anteriores deste instrumento para ' + (p.code || 'paciente sem código') + '.</em>'; return; }
      box.style.display = 'block';
      box.innerHTML = '<strong>Histórico (' + hist.length + ')</strong><ul style="margin:6px 0 0 18px;padding:0">' +
        hist.map(function(r){
          var d = new Date(r.created_at).toLocaleString('pt-BR');
          var ratio = r.max ? (r.score / r.max) : 0;
          var tip = tipFor(ratio);
          return '<li style="margin:4px 0">' + d + ' · ' + r.score + '/' + r.max + ' (' + fmtPct(ratio) + ') · <span style="color:' + tip.color + '">' + tip.label + '</span></li>';
        }).join('') + '</ul>';
    };
  }

  function rerender(){
    ensurePatientBar();
    ensureFooter();
    var inst = activeInstrument(); if (!inst) return;
    var ans = currentAnswers(inst);
    var t = totalScore(inst, ans);
    var pct = t.max ? t.score / t.max : 0;
    var tip = tipFor(pct);
    var interp = document.getElementById('npScalesInterpret');
    if (interp) interp.style.background = tip.bg, interp.style.color = tip.color,
      interp.innerHTML = '<strong>Faixa orientativa: ' + tip.label + '</strong> · ' + tip.text +
        (t.max ? ' <span style="opacity:.7">(' + t.score + '/' + t.max + ' &middot; ' + fmtPct(pct) + ')</span>' : '');
    var doms = document.getElementById('npScalesDomains');
    if (doms) {
      var ds = domainScores(inst, ans);
      doms.innerHTML = '<strong>Por domínio:</strong> ' + ds.map(function(d){
        var p = d.max ? d.pct : 0;
        var tt = tipFor(p);
        return '<span style="display:inline-block;margin:2px 6px 2px 0;padding:2px 8px;border-radius:999px;background:' + tt.bg + ';color:' + tt.color + '">' + d.name + ' · ' + d.score + '/' + d.max + '</span>';
      }).join('');
    }
  }

  function watch(){
    var detail = document.getElementById('detail');
    if (!detail) { setTimeout(watch, 250); return; }
    var mo = new MutationObserver(function(){ rerender(); });
    mo.observe(detail, { childList: true, subtree: false });
    rerender();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watch);
  else watch();

  window.NeuroPedScales = {
    patient: getPatient,
    setPatient: setPatient,
    results: allResults,
    saveResult: saveResult,
    history: historyFor,
    interpret: tipFor,
    laudoText: laudoText
  };
})();
