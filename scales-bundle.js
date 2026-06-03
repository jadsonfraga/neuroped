/* scales-bundle.js — GERADO por scripts/build-scales-bundle.mjs.
   NÃO editar à mão. Edite os scales-*.js e rode o build. */

/* ===== scales-enhance.js ===== */
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
    var prev = list[0];
    // dedupe de sessão: gerar/reimprimir o MESMO laudo (mesma escala+paciente+score)
    // em < 5 min substitui a última entrada em vez de duplicar o histórico.
    // Uma reavaliação real (score diferente OU depois de 5 min) cria entrada nova.
    if (prev && prev.instrument_id === r.instrument_id
        && (prev.patient_code || '') === (r.patient_code || '')
        && prev.score === r.score && prev.max === r.max
        && prev.created_at && r.created_at
        && Math.abs(new Date(r.created_at).getTime() - new Date(prev.created_at).getTime()) < 300000) {
      list[0] = r;
    } else {
      list.unshift(r);
    }
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
        // blindagem: resposta corrompida/fora da faixa não estoura o máximo (evita faixa >100%)
        if (Number.isFinite(v)) sum += Math.max(0, Math.min(perItem, v));
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
    // Respostas item-a-item (o laudo precisa registrar O QUE foi respondido, não só o score)
    if ((inst.domains || []).length) {
      lines.push('');
      lines.push('Respostas:');
      (inst.domains || []).forEach(function(d, di){
        lines.push('• ' + (d.name || ('Domínio ' + (di + 1))));
        (d.items || []).forEach(function(item, ii){
          var v = answers && answers[di + '-' + ii];
          var label = (v != null && inst.labels && inst.labels[v] != null) ? inst.labels[v] : '— (não respondida)';
          lines.push('   ' + (ii + 1) + '. ' + item + '  →  ' + label);
        });
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
        '<button type="button" id="npScalesPrint" class="btn" style="background:linear-gradient(135deg,#e7c98b,#caa56a);color:#241a05;font-weight:900;box-shadow:0 10px 26px -10px rgba(231,201,139,.6)">📄 Gerar laudo (PDF)</button>' +
        '<button type="button" id="npScalesText" class="btn">📋 Copiar laudo</button>' +
        '<button type="button" id="npScalesSave" class="btn secondary">💾 Salvar avaliação</button>' +
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
      var ans = currentAnswers(inst);
      // gerar o laudo TAMBÉM registra no histórico da criança (dado não morre na tela)
      try {
        var tt = totalScore(inst, ans);
        saveResult({
          id: 'sr-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
          instrument_id: inst.id, instrument_title: inst.title, instrument_group: inst.cat || null,
          patient_code: getPatient().code || '', patient_name: getPatient().name || '',
          created_at: new Date().toISOString(),
          score: tt.score, max: tt.max, domains: domainScores(inst, ans), answers: ans
        });
      } catch (e) {}
      printResult(inst, ans, getPatient());
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

  // O botão "Imprimir" do topo da página chama window.print() = imprime a PÁGINA
  // INTEIRA do app (fundo escuro, lista, menus) — sai quebrado e parece que "não
  // gera resultado". Interceptamos para mostrar o resultado limpo do instrumento ativo.
  function fixGlobalPrint(){
    var btns = document.querySelectorAll('button');
    for (var i = 0; i < btns.length; i++){
      var b = btns[i];
      var oc = b.getAttribute && b.getAttribute('onclick');
      if (b.__npPrintFixed) continue;
      if ((oc && /(^|\W)print\(\)/.test(oc)) || /^\s*imprimir\s*$/i.test(b.textContent || '')){
        b.__npPrintFixed = true;
        b.removeAttribute('onclick');
        b.addEventListener('click', function(ev){
          ev.preventDefault();
          var inst = activeInstrument();
          if (!inst){ try { window.print(); } catch (e) {} return; }
          printResult(inst, currentAnswers(inst), getPatient());
        });
      }
    }
  }

  function watch(){
    var detail = document.getElementById('detail');
    if (!detail) { setTimeout(watch, 250); return; }
    var mo = new MutationObserver(function(){ rerender(); });
    mo.observe(detail, { childList: true, subtree: false });
    rerender();
    fixGlobalPrint();
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


/* ===== scales-editorial.js ===== */
window.NEUROPED_EDITORIAL_SCALES=(function(){
const D='Instrumento autoral/operacional de triagem e acompanhamento; não substitui escala normatizada quando indicada.';
function perguntas(s,a){const p=a==='autoteste'?'Eu':'Ele';return [`${p} apresenta ${s[0]} com frequência?`,`${p} precisa de ajuda por causa de ${s[1]||s[0]}?`,`Isso atrapalha casa, escola ou terapias?`,`O problema melhora com rotina, apoio visual ou pausa?`,`Houve piora, perda de habilidade ou risco relacionado a ${s[s.length-1]}?`];}
function it(x){const [id,e,t,a,l,fa,min,max,s,c,d,page,anchor,prio]=x;return {id,title:e+' '+t,short_title:t.split(' — ')[0],original_title:'',emoji:e,audience:a,audience_label:l,age_band:fa,age_min_months:min,age_max_months:max,symptoms:s,complaints:c,keywords:[...new Set([...s,...c,d.toLowerCase(),t.toLowerCase()])],domain:d,page,anchor,priority:prio,plain_questions:perguntas(s,a),clinical_use:`Organizar sinais de ${d.toLowerCase()} por idade, sintoma e respondente, sem substituir avaliação clínica.`,differentiator:'Nome editorial e funcional, compreensível para pais e diferente de escalas clássicas normatizadas.',not_normative_disclaimer:D};}
const S=[
['fam-12-36-tea','🌱','Primeiros Sinais TEA — Olhar, Nome e Brincar','familia','Teste familiar','12–36 meses',12,36,['não fala','não responde ao nome','brinca sozinho','barulho'],['tea','fala','sensorial','social'],'TEA','banco-escalas-lote1.html','tea-precoce',99],
['fam-12-36-fala','🗣️','Fala Inicial — Pedidos, Gestos e Sons','familia','Teste familiar','12–36 meses',12,36,['atraso de fala','poucos gestos','não pede'],['fala','linguagem','tea'],'Linguagem','banco-escalas-lote1.html','comunicacao-funcional',97],
['fam-12-36-alimentacao','🍽️','Alimentação Sensorial — Texturas e Recusas','familia','Teste familiar','12–36 meses',12,36,['seletividade','textura','engasgo','recusa'],['alimentacao','sensorial'],'Alimentação','banco-escalas-lote1.html','seletividade-alimentar',98],
['fam-12-36-sono','😴','Sono do Pequeno — Rotina e Despertares','familia','Teste familiar','12–36 meses',12,36,['insônia','despertares','ronco','irritabilidade'],['sono'],'Sono','banco-escalas.html','sono',90],
['fam-12-36-brincar','🧸','Brincar e Interesse Social — Aproximação e Troca','familia','Teste familiar','12–36 meses',12,36,['brinca sozinho','pouca troca','não imita'],['tea','social'],'Social','banco-escalas.html','social-pragmatica',93],
['fam-12-36-motor','👣','Marcos Motores Iniciais — Sentar, Andar e Explorar','familia','Teste familiar','12–36 meses',12,36,['atraso motor','quedas','marcha insegura'],['motor'],'Motor','banco-escalas-lote3-100.html','motor-global-fino',86],
['fam-3-5-comunicacao','💬','Comunicação Funcional — Pedir, Mostrar e Responder','familia','Teste familiar','3–5 anos',36,71,['não pede','não responde','fala pouco'],['fala','linguagem','tea'],'Linguagem','banco-escalas-lote1.html','comunicacao-funcional',96],
['fam-3-5-crises','🌪️','Crises e Frustração — Birras, Choro e Transições','familia','Teste familiar','3–5 anos',36,71,['birra','crise','mudança de rotina'],['comportamento','agressividade','tea'],'Comportamento','banco-escalas.html','auto-heteroagressividade',95],
['fam-3-5-sensorial','🎧','Sensorial Diário — Barulho, Toque e Luz','familia','Teste familiar','3–5 anos',36,71,['barulho','toque','luz','textura'],['sensorial','tea'],'Sensorial','banco-escalas-lote1.html','perfil-sensorial',94],
['fam-3-5-autonomia','🚽','Autonomia Inicial — Banheiro, Roupa e Higiene','familia','Teste familiar','3–5 anos',36,71,['banheiro','desfralde','roupa','higiene'],['autonomia'],'Autonomia','banco-escalas-lote1.html','autonomia-avd',88],
['fam-3-5-flexibilidade','🧩','Flexibilidade e Rotina — Mudanças, Espera e Combinação','familia','Teste familiar','3–5 anos',36,71,['rigidez','rotina','não aceita mudança'],['tea','comportamento'],'TEA/Comportamento','banco-escalas-lote1.html','oposicao-irritabilidade',90],
['fam-3-5-brincar-simbolico','🎭','Brincar Simbólico — Faz de Conta, Imitação e Troca','familia','Teste familiar','3–5 anos',36,71,['faz de conta','imitação','brincar repetitivo'],['tea','social'],'Social','banco-escalas.html','social-pragmatica',89],
['fam-6-11-atencao','📚','Atenção em Casa e Tarefa — Começar, Manter e Terminar','familia','Teste familiar','6–11 anos',72,143,['desatenção','não termina tarefa','esquece'],['tdah','escola'],'TDAH','banco-escalas.html','funcoes-executivas',97],
['fam-6-11-organizacao','🧠','Organização e Memória do Dia a Dia — Materiais e Rotina','familia','Teste familiar','6–11 anos',72,143,['perde objetos','esquece recados','desorganização'],['tdah','autonomia'],'Funções Executivas','banco-escalas.html','funcoes-executivas',92],
['fam-6-11-ansiedade','😟','Ansiedade Infantil — Medos, Evitação e Separação','familia','Teste familiar','6–11 anos',72,143,['medo','evitação','dor antes da escola'],['ansiedade','escola'],'Ansiedade','banco-escalas.html','ansiedade-medos',91],
['fam-6-11-oposicao','😡','Irritabilidade e Oposição — Limites e Explosões','familia','Teste familiar','6–11 anos',72,143,['oposição','irritabilidade','desafio'],['comportamento','agressividade','tdah'],'Comportamento','banco-escalas-lote1.html','oposicao-irritabilidade',90],
['fam-6-11-sono','🛏️','Sono Escolar — Horário, Despertares e Cansaço','familia','Teste familiar','6–11 anos',72,143,['sono ruim','cansaço','telas'],['sono','tdah'],'Sono','banco-escalas.html','sono',88],
['fam-6-11-aprendizagem','✏️','Aprendizagem em Casa — Leitura, Escrita e Matemática','familia','Teste familiar','6–11 anos',72,143,['leitura','escrita','matemática'],['escola','aprendizagem'],'Aprendizagem','banco-escalas.html','alfabetizacao',90],
['fam-12-17-humor','🕯️','Humor e Isolamento — Tristeza, Retraimento e Energia','familia','Teste familiar','12–17 anos',144,216,['humor','isolamento','tristeza'],['humor','ansiedade'],'Humor','banco-escalas.html','humor-tristeza',94],
['fam-12-17-risco','⚠️','Risco Autolesivo — Alerta Familiar Imediato','familia','Teste familiar','12–17 anos',144,216,['autolesão','suicídio','não quer viver'],['humor','agressividade','risco'],'Risco','banco-escalas.html','risco-autolesivo-suicida',100],
['fam-12-17-digital-sono','📱','Rotina Digital e Sono — Telas, Horário e Irritabilidade','familia','Teste familiar','12–17 anos',144,216,['telas','sono','irritabilidade'],['sono','humor','tdah'],'Sono','banco-escalas.html','sono',88],
['fam-12-17-autonomia','🧭','Autonomia Adolescente — Rotina, Responsabilidade e Segurança','familia','Teste familiar','12–17 anos',144,216,['autonomia','responsabilidade','segurança'],['autonomia','tdah'],'Autonomia','banco-escalas-lote1.html','autonomia-avd',87],
['fam-12-17-social','💬','Comunicação Social Adolescente — Conversa, Amizade e Contexto','familia','Teste familiar','12–17 anos',144,216,['amizade','conversa','contexto social'],['tea','linguagem','social'],'Social/TEA','banco-escalas.html','social-pragmatica',90],
['fam-12-17-alimentacao','🥣','Alimentação e Ansiedade — Textura, Controle e Evitação','familia','Teste familiar','12–17 anos',144,216,['seletividade','ansiedade','controle'],['alimentacao','ansiedade','sensorial'],'Alimentação','banco-escalas-lote1.html','seletividade-alimentar',86],
['esc-infantil-adaptacao','🏫','Adaptação Escolar Inicial — Entrada, Separação e Rotina','escola','Teste escolar','Educação infantil',24,71,['adaptação','separação','rotina'],['escola','ansiedade','tea'],'Escola','banco-escalas.html','inventario-escolar-tea',90],
['esc-infantil-atencao-compartilhada','👀','Atenção Compartilhada na Sala — Olhar, Chamar e Participar','escola','Teste escolar','Educação infantil',24,71,['atenção compartilhada','olhar','participação'],['tea','fala','escola'],'TEA','banco-escalas.html','inventario-escolar-tea',94],
['esc-infantil-brincar-pares','🧩','Brincar com Pares — Aproximação, Turnos e Imitação','escola','Teste escolar','Educação infantil',24,71,['pares','turnos','imitação'],['tea','social','escola'],'Social','banco-escalas.html','social-pragmatica',92],
['esc-infantil-barulho-rotina','🔔','Reação a Barulho e Rotina — Sala, Pátio e Transições','escola','Teste escolar','Educação infantil',24,71,['barulho','pátio','transições'],['sensorial','tea','escola'],'Sensorial','banco-escalas-lote1.html','perfil-sensorial',91],
['esc-fund-atencao-tarefa','📘','Atenção e Tarefa Escolar — Foco, Início e Finalização','escola','Teste escolar','Ensino fundamental',72,143,['atenção','tarefa','não termina'],['tdah','escola'],'TDAH','banco-escalas.html','funcoes-executivas',97],
['esc-fund-leitura-escrita','✏️','Leitura, Escrita e Ritmo de Aprendizagem','escola','Teste escolar','Ensino fundamental',72,143,['leitura','escrita','baixo rendimento'],['escola','aprendizagem','linguagem'],'Aprendizagem','banco-escalas.html','alfabetizacao',93],
['esc-fund-matematica','🧮','Matemática Funcional — Quantidade, Problema e Cálculo','escola','Teste escolar','Ensino fundamental',72,143,['matemática','cálculo','problemas'],['escola','aprendizagem'],'Aprendizagem','banco-escalas-lote3-100.html','matematica-funcional',88],
['esc-fund-social','🤝','Habilidades Sociais na Escola — Grupo, Turnos e Conflitos','escola','Teste escolar','Ensino fundamental',72,143,['grupo','turnos','conflitos'],['tea','social','escola'],'Social','banco-escalas.html','social-pragmatica',90],
['esc-fund-executivas','🧠','Funções Executivas em Sala — Planejar, Organizar e Conferir','escola','Teste escolar','Ensino fundamental',72,143,['organização','planejamento','materiais'],['tdah','escola'],'Funções Executivas','banco-escalas.html','funcoes-executivas',94],
['esc-ado-organizacao','📚','Organização de Estudos — Prazos, Provas e Autonomia','escola','Teste escolar','Adolescente',144,216,['estudo','prazos','autonomia'],['tdah','escola','autonomia'],'Funções Executivas','banco-escalas.html','funcoes-executivas',90],
['esc-ado-humor','😶','Isolamento e Humor na Escola — Participação e Energia','escola','Teste escolar','Adolescente',144,216,['isolamento','humor','queda escolar'],['humor','escola','ansiedade'],'Humor','banco-escalas.html','humor-tristeza',92],
['esc-ado-risco','⚠️','Sinais de Risco Escolar — Queda, Isolamento e Alerta','escola','Teste escolar','Adolescente',144,216,['risco','autolesão','bullying'],['humor','escola','agressividade'],'Risco','banco-escalas.html','risco-autolesivo-suicida',99],
['auto-8-11-sinto-escola','🙂','Como Eu Me Sinto na Escola — Autopercepção Infantil','autoteste','Autoteste','8–11 anos',96,143,['sentimentos','escola','medo'],['ansiedade','humor','escola'],'Autopercepção','banco-escalas.html','ansiedade-medos',88],
['auto-8-11-incomoda','🎧','O Que Me Incomoda — Sons, Toques, Luzes e Cheiros','autoteste','Autoteste','8–11 anos',96,143,['sensorial','barulho','toque'],['sensorial','tea'],'Sensorial','banco-escalas-lote1.html','perfil-sensorial',90],
['auto-8-11-atencao','📚','Minha Atenção — Quando Consigo e Quando Perco o Foco','autoteste','Autoteste','8–11 anos',96,143,['atenção','foco','tarefa'],['tdah','escola'],'TDAH','banco-escalas.html','minha-atencao',91],
['auto-8-11-amizades','🤝','Minhas Amizades — Brincar, Conversar e Entender o Outro','autoteste','Autoteste','8–11 anos',96,143,['amizade','social','conflito'],['tea','social','escola'],'Social','banco-escalas.html','social-pragmatica',84],
['auto-12-17-humor','🕯️','Meu Humor nos Últimos Dias — Energia, Vontade e Isolamento','autoteste','Autoteste','12–17 anos',144,216,['humor','isolamento','energia'],['humor'],'Humor','banco-escalas.html','humor-tristeza',94],
['auto-12-17-ansiedade','😰','Minha Ansiedade — Medos, Corpo e Evitação','autoteste','Autoteste','12–17 anos',144,216,['ansiedade','medo','evitação'],['ansiedade','escola'],'Ansiedade','banco-escalas.html','ansiedade-medos',93],
['auto-12-17-risco','⚠️','Quando Penso em Me Machucar — Pedido de Ajuda','autoteste','Autoteste','12–17 anos',144,216,['autolesão','suicídio','risco'],['humor','agressividade','risco'],'Risco','banco-escalas.html','risco-autolesivo-suicida',100],
['auto-12-17-sono','🛏️','Meu Sono — Tela, Horário e Cansaço','autoteste','Autoteste','12–17 anos',144,216,['sono','telas','cansaço'],['sono','humor'],'Sono','banco-escalas.html','sono',88],
['ter-fono-comunicacao','🗣️','Comunicação Funcional em Sessão — Pedidos, Respostas e Trocas','terapeuta','Terapias','Fono',12,216,['comunicação','fala','pedidos'],['fala','linguagem','tea'],'Fonoaudiologia','banco-escalas-lote1.html','comunicacao-funcional',94],
['ter-fono-ecolalia','🔁','Ecolalia e Uso Funcional da Fala — Repetição com Sentido','terapeuta','Terapias','Fono',24,216,['ecolalia','fala','pragmática'],['fala','tea','linguagem'],'Fonoaudiologia','banco-escalas-lote3-100.html','ecolalia-funcional',88],
['ter-fono-oral','👄','Sensorial Oral e Motricidade — Boca, Mastigação e Textura','terapeuta','Terapias','Fono',12,180,['oral','mastigação','textura'],['alimentacao','sensorial','fala'],'Fonoaudiologia','banco-escalas-lote1.html','seletividade-alimentar',90],
['ter-to-sensorial','🎧','Perfil Sensorial Terapêutico — Busca, Evita e Modula','terapeuta','Terapias','TO',12,216,['sensorial','modulação','to'],['sensorial','tea','motor'],'Terapia Ocupacional','banco-escalas-lote1.html','perfil-sensorial',92],
['ter-to-motricidade','✋','Motricidade Fina e Planejamento Motor — Mãos, Praxia e Escrita','terapeuta','Terapias','TO',24,144,['motricidade fina','praxia','escrita'],['motor','escola'],'Terapia Ocupacional','banco-escalas-lote3-100.html','motor-global-fino',86],
['ter-to-avd','🚽','Autonomia e AVDs — Banho, Banheiro, Roupa e Alimentação','terapeuta','Terapias','TO',24,216,['autonomia','avd','higiene'],['autonomia','motor','sensorial'],'Terapia Ocupacional','banco-escalas-lote1.html','autonomia-avd',89],
['ter-psico-regulacao','🌪️','Regulação Emocional — Crise, Recuperação e Ajuda','terapeuta','Terapias','Psicologia/ABA',24,216,['regulação','crise','frustração'],['comportamento','agressividade','ansiedade'],'Psicologia/ABA','banco-escalas-lote2-80.html','regulacao-emocional',93],
['ter-psico-flexibilidade','🧩','Flexibilidade Comportamental — Mudança, Espera e Escolha','terapeuta','Terapias','Psicologia/ABA',24,216,['flexibilidade','rigidez','espera'],['tea','comportamento'],'Psicologia/ABA','banco-escalas-lote1.html','oposicao-irritabilidade',88],
['ter-psico-social','🤝','Habilidades Sociais Treináveis — Cumprimentar, Pedir e Participar','terapeuta','Terapias','Psicologia/ABA',36,216,['social','grupo','turnos'],['tea','social','escola'],'Psicologia/ABA','banco-escalas.html','social-pragmatica',87],
['ter-psicoped-ritmo','📘','Ritmo de Aprendizagem — Atenção, Memória e Estratégia','terapeuta','Terapias','Psicopedagogia',60,216,['aprendizagem','memória','atenção'],['escola','tdah'],'Psicopedagogia','banco-escalas.html','alfabetizacao',86],
['ter-psicoped-leitura','📖','Leitura e Compreensão — Decodificar, Entender e Responder','terapeuta','Terapias','Psicopedagogia',72,216,['leitura','compreensão','escola'],['escola','linguagem'],'Psicopedagogia','banco-escalas.html','alfabetizacao',86],
['ter-psicoped-escrita','✍️','Escrita Funcional — Ideia, Organização e Produção','terapeuta','Terapias','Psicopedagogia',72,216,['escrita','organização','aprendizagem'],['escola','tdah'],'Psicopedagogia','banco-escalas.html','alfabetizacao',85],
['cli-crises-eventos','🩺','Crises Epilépticas e Eventos Paroxísticos — Descrição Familiar','clinico','Clínico','0–17 anos',0,216,['epilepsia','crise','desmaio'],['epilepsia'],'Neurologia','banco-escalas-lote1.html','epilepsia-crises',96],
['cli-cefaleia','🤕','Cefaleia e Dor Recorrente — Frequência, Sinais e Impacto','clinico','Clínico','4–17 anos',48,216,['cefaleia','dor','vômito'],['cefaleia','dor'],'Neurologia','banco-escalas-lote1.html','cefaleia-dor',88],
['cli-regressao','⚠️','Alerta de Regressão — Perda de Fala, Habilidades ou Autonomia','clinico','Clínico','0–17 anos',0,216,['regressão','perda','habilidades'],['tea','neurologia','autonomia'],'Neurologia','banco-escalas-lote4-200.html','alerta-regressao',99],
['cli-medicacao','💊','Monitoramento Medicamentoso Familiar — Efeito, Sono e Eventos','clinico','Clínico','0–17 anos',0,216,['medicação','evento adverso','sono'],['medicacao','sono','comportamento'],'Neurologia','banco-escalas-lote5-90.html','monitoramento-medicamentoso',87],
['cli-reavaliacao','📈','Reavaliação Neurodesenvolvimental — Evolução, Escola e Terapias','clinico','Clínico','0–17 anos',0,216,['reavaliação','evolução','terapias'],['tea','tdah','escola','autonomia'],'Neurologia','banco-escalas.html','reavaliacao',90],
['cli-sinais-neuro','🚨','Sinais Neurológicos de Alerta — Força, Marcha e Consciência','clinico','Clínico','0–17 anos',0,216,['marcha','força','consciência'],['motor','epilepsia'],'Neurologia','banco-escalas-lote4-200.html','sinais-neurologicos',98],
['cli-tdah','🧠','Triagem Clínica TDAH — Atenção, Impulsividade e Prejuízo','clinico','Clínico','6–17 anos',72,216,['tdah','atenção','impulsividade'],['tdah','escola'],'TDAH','banco-escalas.html','funcoes-executivas',93],
['cli-tea','🌱','Triagem Clínica TEA — Comunicação, Social e Rigidez','clinico','Clínico','0–17 anos',0,216,['tea','social','rigidez'],['tea','fala','sensorial'],'TEA','banco-escalas.html','inventario-escolar-tea',95]
];
return S.map(it);
})();

/* ===== scales-453-authorial.js ===== */
(function(){
'use strict';
const base=Array.isArray(window.NEUROPED_EDITORIAL_SCALES)?window.NEUROPED_EDITORIAL_SCALES:[];
if(window.NEUROPED_453_AUTHORIAL_LOADED)return;
window.NEUROPED_453_AUTHORIAL_LOADED=true;
const ages=[
  {k:'0-2',label:'0–2 anos',min:0,max:35,focus:'bebê/criança pequena'},
  {k:'3-5',label:'3–5 anos',min:36,max:71,focus:'pré-escolar'},
  {k:'6-11',label:'6–11 anos',min:72,max:143,focus:'idade escolar'},
  {k:'12-17',label:'12–17 anos',min:144,max:215,focus:'adolescente'},
  {k:'adulto',label:'18+ anos',min:216,max:960,focus:'adulto/jovem adulto'}
];
const auds=[
  {k:'familia',label:'Teste familiar',who:'família/cuidador'},
  {k:'escola',label:'Teste escolar',who:'escola/professor'},
  {k:'autoteste',label:'Autoteste',who:'criança/adolescente quando possível'},
  {k:'terapeuta',label:'Terapias/equipe',who:'terapeuta/equipe'},
  {k:'clinico',label:'Clínico',who:'médico/avaliador'}
];
const domains=[
  {k:'tea',emoji:'🌱',name:'TEA e comunicação social',sym:['TEA','olhar','nome','brincar','rigidez'],compl:['autismo','autimo','não responde nome','brinca sozinho','estereotipia']},
  {k:'linguagem',emoji:'🗣️',name:'Linguagem e comunicação funcional',sym:['fala','gesto','compreensão','pedido','ecolalia'],compl:['não fala','atraso de fala','linguagem','fono']},
  {k:'tdah',emoji:'⚡',name:'TDAH e atenção',sym:['desatenção','impulsividade','hiperatividade','tarefa','foco'],compl:['tdah','desatencao','não termina','agitado']},
  {k:'executivas',emoji:'🧠',name:'Funções executivas',sym:['planejamento','memória','organização','tempo','inibição'],compl:['organização','perde objetos','esquece','rotina']},
  {k:'aprendizagem',emoji:'📚',name:'Aprendizagem global',sym:['leitura','escrita','matemática','rendimento','escola'],compl:['aprendizagem','escola','não acompanha','baixo rendimento']},
  {k:'dislexia',emoji:'🔤',name:'Leitura e dislexia operacional',sym:['leitura','trocas','fluência','compreensão','consciência fonológica'],compl:['dislexia','lê mal','troca letras','silabado']},
  {k:'discalculia',emoji:'🧮',name:'Matemática funcional',sym:['número','quantidade','cálculo','problema','tempo'],compl:['matemática','calculo','tabuada','número']},
  {k:'sensorial',emoji:'🎧',name:'Perfil sensorial cotidiano',sym:['barulho','toque','luz','cheiro','textura'],compl:['sensorial','sensorail','barulho','textura','cheiro']},
  {k:'alimentacao',emoji:'🍽️',name:'Alimentação e seletividade',sym:['seletividade','textura','recusa','engasgo','mastigação'],compl:['seletividade','seletivdade','alimentação','engasgo']},
  {k:'sono',emoji:'😴',name:'Sono e ritmo diário',sym:['sono','insônia','despertares','ronco','cansaço'],compl:['sono','insônia','insonia','acorda','ronco']},
  {k:'ansiedade',emoji:'😟',name:'Ansiedade e evitação',sym:['medo','preocupação','evitação','separação','somatização'],compl:['ansiedade','medo','evita','dor antes da escola']},
  {k:'humor',emoji:'🕯️',name:'Humor, tristeza e isolamento',sym:['tristeza','isolamento','anedonia','energia','choro'],compl:['triste','isolado','desânimo','depressivo']},
  {k:'risco',emoji:'⚠️',name:'Risco autolesivo e segurança',sym:['autolesão','morte','risco','impulso','segurança'],compl:['não quer viver','se machuca','autolesão','suicid']},
  {k:'tod',emoji:'🌪️',name:'Oposição, irritabilidade e crises',sym:['oposição','irritabilidade','birra','agressividade','limites'],compl:['birra','birrra','oposição','agressivo','crise']},
  {k:'epilepsia',emoji:'🧬',name:'Crises epilépticas e eventos paroxísticos',sym:['crise','olhar parado','abalo','queda','recuperação'],compl:['epilepsia','convulsão','crise','desmaio']},
  {k:'cefaleia',emoji:'🤕',name:'Cefaleia e dor recorrente',sym:['dor','cabeça','náusea','luz','rotina'],compl:['cefaleia','cabeça','enxaqueca','vomita']},
  {k:'tiques',emoji:'🔁',name:'Tiques e movimentos repetitivos',sym:['tiques','piscar','caretas','sons','urgência'],compl:['tiques','piscar','careta','movimento']},
  {k:'motor',emoji:'🏃',name:'Coordenação motora e praxia',sym:['coordenação','equilíbrio','motricidade','queda','caligrafia'],compl:['motor','desajeitado','cai','coordenação']},
  {k:'autonomia',emoji:'🚽',name:'Autonomia e AVDs',sym:['banheiro','higiene','roupa','alimentação','rotina'],compl:['autonomia','banheiro','desfralde','higiene']},
  {k:'social',emoji:'🤝',name:'Habilidades sociais e pragmática',sym:['pares','conversa','turnos','empatia','brincar'],compl:['social','amigos','isolado','não interage']},
  {k:'telas',emoji:'📱',name:'Tela, jogos e rotina digital',sym:['tela','jogo','sono','irritação','limite'],compl:['celular','tela','jogo','vício']},
  {k:'farmaco',emoji:'💊',name:'Monitoramento medicamentoso familiar',sym:['efeito','apetite','sono','humor','adesão'],compl:['medicação','remédio','efeito colateral','apetite']}
];
function cap(s){return String(s).charAt(0).toUpperCase()+String(s).slice(1)}
function slug(s){return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}
function qbank(d,a,u){const common=[
  `O sinal aparece com frequência no contexto de ${u.who}?`,
  `O padrão observado prejudica a rotina do ${a.focus}?`,
  `A dificuldade ocorre em mais de um ambiente ou situação?`,
  `A criança melhora quando recebe apoio visual, pausa ou antecipação?`,
  `Houve piora recente, perda de habilidade ou aumento de intensidade?`
];
const map={
 tea:[`Responde quando chamado pelo nome?`,`Compartilha interesse mostrando objetos, gestos ou olhar?`,`Participa de brincadeiras sociais compatíveis com a idade?`,`Apresenta rigidez, repetição ou interesse restrito que atrapalha a rotina?`,`Reage de modo incomum a sons, texturas, luzes ou mudanças?`],
 linguagem:[`Usa fala, gesto ou figura para pedir o que deseja?`,`Compreende ordens simples sem muitas pistas?`,`Responde perguntas simples de forma funcional?`,`Consegue contar algo que aconteceu com começo, meio e fim?`,`Repete palavras/frases sem uso comunicativo claro?`],
 tdah:[`Consegue iniciar tarefas sem muitas chamadas?`,`Mantém atenção até terminar uma atividade curta?`,`Interrompe, levanta ou age antes de pensar?`,`Esquece instruções ou perde materiais com frequência?`,`O comportamento muda quando há estrutura, rotina e reforço?`],
 executivas:[`Planeja passos antes de iniciar uma tarefa?`,`Organiza materiais, horários e sequência da rotina?`,`Consegue mudar de estratégia quando erra?`,`Lembra instruções com duas ou mais etapas?`,`Controla impulso suficiente para esperar sua vez?`],
 aprendizagem:[`Acompanha o conteúdo esperado para a série/idade?`,`Demonstra compreensão após explicação individual?`,`Consegue registrar respostas por fala, desenho ou escrita?`,`O desempenho oscila conforme atenção, sono ou ansiedade?`,`A dificuldade persiste apesar de treino e repetição?`],
 dislexia:[`Lê palavras simples com precisão compatível com a idade?`,`Troca, omite ou inverte sons/letras ao ler?`,`Compreende o que leu quando a leitura é lenta ou com esforço?`,`Consegue identificar rimas, sílabas e sons iniciais?`,`A escrita mostra trocas fonológicas persistentes?`],
 discalculia:[`Reconhece números e quantidades compatíveis com a idade?`,`Compara maior/menor e antes/depois em sequência numérica?`,`Resolve contas simples com apoio concreto?`,`Entende problemas matemáticos curtos do cotidiano?`,`Confunde sinais, posições ou procedimentos de cálculo?`],
 sensorial:[`Barulho comum causa sofrimento, fuga ou crise?`,`Textura de roupa, comida ou toque incomoda de forma intensa?`,`Busca estímulos como pular, girar, apertar ou cheirar?`,`Luz, cheiro ou ambiente cheio alteram o comportamento?`,`Estratégias sensoriais reduzem a desorganização?`],
 alimentacao:[`Aceita variedade alimentar compatível com a idade?`,`Recusa alimentos por textura, cheiro, cor ou mistura?`,`Mastiga e engole com segurança aparente?`,`A refeição gera conflito frequente?`,`Tolera olhar, tocar ou cheirar alimento novo sem ser forçado?`],
 sono:[`Demora para iniciar o sono?`,`Acorda muitas vezes ou desperta muito cedo?`,`Ronca, respira pela boca ou parece cansado ao acordar?`,`Tela, ansiedade ou rotina irregular pioram o sono?`,`Sono ruim piora atenção, humor ou crises?`],
 ansiedade:[`Evita atividades por medo ou preocupação?`,`Apresenta queixas físicas antes de escola ou separação?`,`Busca confirmação excessiva para se sentir seguro?`,`Tem medo desproporcional de erro, crítica ou mudança?`,`A ansiedade impede participação social, escolar ou familiar?`],
 humor:[`Perdeu interesse por atividades antes prazerosas?`,`Fica isolado, choroso ou irritado por muitos dias?`,`Mostra queda de energia, apetite ou sono?`,`Expressa culpa, inutilidade ou desesperança?`,`A mudança de humor prejudica escola, família ou autocuidado?`],
 risco:[`Falou em sumir, morrer ou não querer viver?`,`Machuca a si mesmo ou ameaça se machucar?`,`Existe plano, acesso a meios ou perda de controle?`,`A família precisa supervisionar por segurança?`,`Há adulto protetor e plano de ajuda imediata?`],
 tod:[`Desafia regras simples de forma repetida?`,`Explode em raiva com frustrações pequenas?`,`Agride, morde, empurra, quebra ou ameaça?`,`Culpa os outros ou recusa reparar o dano?`,`A crise melhora com rotina, escolhas limitadas ou pausa?`],
 epilepsia:[`Houve episódio com perda de contato, queda, abalos ou olhar parado?`,`O evento teve início e fim claros?`,`Após o episódio houve sono, confusão ou dor?`,`Existe gatilho como febre, sono, luz ou estresse?`,`Vídeo, descrição e tempo do evento foram registrados?`],
 cefaleia:[`A dor atrapalha escola, brincadeira ou sono?`,`Há náusea, vômito, luz incomodando ou tontura?`,`A dor tem horário, gatilho ou padrão repetido?`,`Usa analgésicos com frequência?`,`Há sinal de alerta como despertar noturno, piora progressiva ou déficit?`],
 tiques:[`Movimentos ou sons repetitivos aparecem sem intenção clara?`,`Aumentam com ansiedade, cansaço ou exposição social?`,`A criança sente vontade/urgência antes do tique?`,`Consegue segurar por pouco tempo com esforço?`,`O tique causa dor, vergonha, bullying ou prejuízo?`],
 motor:[`Tropeça, cai ou parece desajeitado para a idade?`,`Tem dificuldade com lápis, tesoura, botão ou talher?`,`Evita esportes, parque ou atividades motoras?`,`Apresenta caligrafia muito lenta ou ilegível?`,`Consegue imitar gestos e sequências motoras simples?`],
 autonomia:[`Realiza higiene, roupa e alimentação com autonomia compatível?`,`Sinaliza fome, sede, dor, banheiro ou desconforto?`,`Segue rotina visual ou verbal de autocuidado?`,`Precisa de ajuda excessiva para a idade?`,`A autonomia melhora com treino estruturado e previsibilidade?`],
 social:[`Inicia conversa, brincadeira ou aproximação social?`,`Respeita turnos e percebe sinais do outro?`,`Compreende piadas, ironias ou regras implícitas conforme idade?`,`Mantém amizade ou participação em grupo?`,`Repara quando magoa alguém ou comete erro social?`],
 telas:[`O uso de tela passa do combinado e gera conflito?`,`A retirada de tela causa crise intensa ou agressividade?`,`A tela prejudica sono, escola, alimentação ou interação?`,`Consegue alternar tela com brincadeira, leitura ou atividade física?`,`O conteúdo digital muda humor, linguagem ou comportamento?`],
 farmaco:[`A medicação está sendo tomada no horário combinado?`,`Houve mudança de sono, apetite, humor ou energia?`,`A família percebe benefício funcional claro?`,`Há efeito adverso que atrapalha rotina ou segurança?`,`A escola ou terapia observou mudança após início/ajuste?`]
};
return [...(map[d.k]||common),...common].slice(0,10)}
function tasks(d,a){const baseText='Lia viu um sapo no jardim. O sapo pulou perto da flor. Depois, Lia chamou a mãe para mostrar o sapo.';const dict='casa, bola, janela, prato, brincadeira';
const universal=[`Texto para interpretação: "${baseText}" Perguntar: quem viu o sapo? onde ele estava? o que Lia fez depois?`,`Ditado de palavras: ${dict}. Registrar trocas, omissões e tempo.`,`Frase para repetir: "O menino guardou a bola azul dentro da caixa". Registrar omissões e ordem.`,`Sequência de comandos: pegue o lápis, toque na mesa e desenhe um círculo.`,`Nomeação rápida: copo, bola, chave, gato, mão, sapato.`];
const map={
 tea:[`Cena social: "Pedro queria brincar, mas João pegou o carrinho e saiu". Perguntar o que Pedro pode sentir e o que poderia fazer.`,`Brincadeira simbólica: oferecer boneco, prato e carrinho; observar faz de conta e turnos.`,`Atenção compartilhada: apontar figura interessante e observar se acompanha o gesto/olhar.`,...universal],
 linguagem:[`Pragmática: pedir para explicar como se escova os dentes em três passos.`,`Compreensão: "antes de bater palmas, coloque o lápis embaixo do papel".`,...universal],
 tdah:[`Atenção auditiva: diga sol, bola, peixe, bola, casa; bater na mesa quando ouvir bola.`,`Inibição: quando eu disser dia, responda noite; quando disser noite, responda dia.`,`Memória: repetir 4-8-2 e depois 7-1-9-3, conforme idade.`,...universal],
 executivas:[`Planejamento: organizar verbalmente três passos para preparar a mochila.`,`Flexibilidade: resolver um problema de duas formas diferentes.`,...universal],
 aprendizagem:[`Leitura: "O gato subiu no muro e viu a lua." Perguntar quem subiu e o que viu.`,`Cópia: "Hoje eu vou aprender com calma."`,`Ditado de frase: "A menina gosta de ler na escola."`,...universal],
 dislexia:[`Consciência fonológica: dizer palavras que começam com /p/: pato, pé, panela.`,`Rima: perguntar o que rima com mão: pão, bola ou casa?`,`Leitura de pseudopalavras autorais: mipo, laveco, sanute.`,...universal],
 discalculia:[`Quantidade: mostrar 7 objetos e pedir para separar 3.`,`Cálculo mental: 8+5, 14-6, metade de 10.`,`Problema: "Ana tinha 5 lápis e ganhou 3. Com quantos ficou?"`,...universal],
 sensorial:[`Escala sensorial: de 0 a 5, quanto incomoda liquidificador, etiqueta, luz forte e cheiro de comida?`,`Escolha regulatória: testar pausa, respiração, fone imaginário ou objeto de conforto.`,...universal],
 alimentacao:[`Lista alimentar: 5 alimentos aceitos, 5 recusados e motivo percebido: textura, cheiro, cor, mistura.`,`Tolerância gradual: olhar, tocar, cheirar e aproximar alimento novo sem forçar ingestão.`,...universal],
 sono:[`Rotina: pedir para ordenar cartões: banho, pijama, escovar dentes, história, dormir.`,`Relato: contar como foi a última noite de sono em começo, meio e fim.`,...universal],
 ansiedade:[`Termômetro emocional: marcar 0–10 para escola, separação, prova, dormir e falar em público.`,`Interpretação: "Um colega não respondeu sua mensagem". Levantar três explicações possíveis.`,...universal],
 humor:[`Nomeação emocional: escolher entre feliz, triste, bravo, medo, cansado e explicar o motivo.`,`Atividade prazerosa: listar três coisas que antes gostava e como está hoje.`,...universal],
 risco:[`Segurança: perguntar de forma adequada se já pensou em se machucar, sumir ou morrer. Se positivo, acionar protocolo clínico.`,`Rede de ajuda: listar três adultos que pode procurar em crise.`,...universal],
 tod:[`Frustração simulada leve: propor regra simples e observar negociação, oposição e recuperação.`,`Reparação: perguntar o que fazer depois de quebrar algo ou machucar alguém.`,...universal],
 epilepsia:[`Linha do tempo: registrar antes, durante e depois do evento; hora, duração e recuperação.`,`Consciência: perguntar se ouviu chamados, respondeu e lembrou do episódio.`,...universal],
 cefaleia:[`Mapa da dor: apontar local, intensidade 0–10, duração e gatilhos.`,`Diário breve: registrar sono, tela, alimentação, escola e dor por 7 dias.`,...universal],
 tiques:[`Observação de 2 minutos: registrar movimento/som, contexto e frequência sem chamar atenção.`,`Urgência: perguntar se sente vontade antes do movimento e se consegue segurar.`,...universal],
 motor:[`Praxia: imitar sequência bater palma, tocar cabeça, cruzar braços.`,`Grafomotor: copiar círculo, cruz, quadrado e frase curta.`,`Equilíbrio: ficar em um pé e andar em linha imaginária.`,...universal],
 autonomia:[`Sequência AVD: explicar ou demonstrar lavar mãos em passos.`,`Escolha funcional: pedir ajuda, banheiro, água e pausa usando fala/gesto/figura.`,...universal],
 social:[`História social: "Maria entrou no jogo sem pedir". Perguntar o que os colegas podem sentir.`,`Turnos: jogo curto de alternância com regra simples.`,...universal],
 telas:[`Rotina digital: listar horário de tela, conteúdo e reação ao desligar.`,`Alternativa: escolher três atividades sem tela que conseguiria fazer hoje.`,...universal],
 farmaco:[`Monitoramento: comparar antes/depois em sono, apetite, humor, atenção e crises.`,`Adesão: explicar horários do remédio e quem supervisiona.`,...universal]
};
return (map[d.k]||universal).slice(0,8)}
function title(d,a,u,i){return `${d.emoji} Inventário ${cap(a.focus)} — ${d.name} · ${u.label} ${String(i+1).padStart(3,'0')}`}
const combos=[];domains.forEach((d,di)=>ages.forEach((a,ai)=>auds.forEach((u,ui)=>combos.push({d,a,u,di,ai,ui,rank:(di*37+ai*17+ui*29)%997}))));
combos.sort((x,y)=>x.rank-y.rank||x.di-y.di||x.ai-y.ai||x.ui-y.ui);
const generated=combos.slice(0,453).map((c,i)=>({
  id:`aut453-${String(i+1).padStart(3,'0')}-${slug(c.a.k)}-${slug(c.u.k)}-${slug(c.d.k)}`,
  title:title(c.d,c.a,c.u,i),
  short_title:`${c.d.name} — ${c.a.label}`,
  original_title:'Inventário operacional autoral NeuroPed EDJ',
  emoji:c.d.emoji,
  audience:c.u.k,
  audience_label:c.u.label,
  age_band:c.a.label,
  age_min_months:c.a.min,
  age_max_months:c.a.max,
  symptoms:c.d.sym,
  complaints:c.d.compl,
  keywords:[...c.d.sym,...c.d.compl,c.a.label,c.u.label,c.d.name],
  domain:c.d.name,
  page:'instrumento.html',
  anchor:`aut453-${String(i+1).padStart(3,'0')}`,
  priority:72+(i%28),
  plain_questions:qbank(c.d,c.a,c.u),
  direct_tasks:tasks(c.d,c.a),
  clinical_use:`Inventário autoral para organizar sinais de ${c.d.name.toLowerCase()} em ${c.a.focus}, respondido por ${c.u.who}.`,
  differentiator:'Instrumento criado para triagem clínica operacional, com linguagem simples, itens funcionais e tarefas diretas quando aplicável.',
  not_normative_disclaimer:'Instrumento autoral/operacional de triagem e acompanhamento; não substitui escala normatizada, avaliação clínica ou instrumento licenciado quando indicado.'
}));
const ids=new Set(base.map(x=>x&&x.id));
window.NEUROPED_EDITORIAL_SCALES=base.concat(generated.filter(x=>!ids.has(x.id)));
window.NEUROPED_453_AUTHORIAL_COUNT=generated.length;
})();

/* ===== scales-global-max.js ===== */
(function(){
'use strict';
if(window.NEUROPED_GLOBAL_MAX_LOADED)return;window.NEUROPED_GLOBAL_MAX_LOADED=true;
const base=Array.isArray(window.NEUROPED_EDITORIAL_SCALES)?window.NEUROPED_EDITORIAL_SCALES:[];
const ages=[
{k:'baby',label:'0–2 anos',min:0,max:35,who:'bebês e crianças pequenas'},
{k:'pre',label:'3–5 anos',min:36,max:71,who:'pré-escolares'},
{k:'school',label:'6–11 anos',min:72,max:143,who:'crianças escolares'},
{k:'teen',label:'12–17 anos',min:144,max:215,who:'adolescentes'},
{k:'adult',label:'18+ anos',min:216,max:960,who:'adultos jovens e cuidadores'}
];
const resp=[
{k:'familia',label:'Teste familiar',by:'pais/cuidadores'},
{k:'escola',label:'Teste escolar',by:'professores/escola'},
{k:'autoteste',label:'Autoteste',by:'respondente quando possível'},
{k:'terapeuta',label:'Terapias/equipe',by:'fono, TO, psicologia, psicopedagogia ou equipe'},
{k:'clinico',label:'Clínico',by:'médico/avaliador'}
];
const sources=[
{k:'mchat',emoji:'🌱',name:'Sinais precoces de autismo',model:'M-CHAT-R/F',dom:'TEA',sym:['olhar','nome','apontar','brincar','interesse social'],age:['baby','pre']},
{k:'sdq',emoji:'🧭',name:'Comportamento e dificuldades gerais',model:'SDQ',dom:'Comportamento',sym:['emoção','conduta','hiperatividade','pares','prosocial'],age:['pre','school','teen']},
{k:'psc',emoji:'🧩',name:'Funcionamento psicossocial pediátrico',model:'PSC/PSC-17',dom:'Psicossocial',sym:['internalização','externalização','atenção','humor','comportamento'],age:['pre','school','teen']},
{k:'swyc',emoji:'👶',name:'Desenvolvimento inicial e família',model:'SWYC',dom:'Desenvolvimento',sym:['marcos','comportamento','família','rotina','linguagem'],age:['baby','pre']},
{k:'vanderbilt',emoji:'⚡',name:'Atenção, hiperatividade e escola',model:'Vanderbilt/NICHQ',dom:'TDAH',sym:['desatenção','hiperatividade','impulsividade','oposição','aprendizagem'],age:['school','teen']},
{k:'sared',emoji:'😟',name:'Ansiedade infantil e adolescente',model:'SCARED',dom:'Ansiedade',sym:['pânico','separação','social','escola','preocupação'],age:['school','teen']},
{k:'phq',emoji:'🕯️',name:'Humor e depressividade',model:'PHQ-9/PHQ-A',dom:'Humor',sym:['humor','prazer','sono','energia','autodepreciação'],age:['teen','adult']},
{k:'gad',emoji:'🌧️',name:'Preocupação e ansiedade generalizada',model:'GAD-7',dom:'Ansiedade',sym:['preocupação','tensão','medo','irritabilidade','relaxamento'],age:['teen','adult']},
{k:'c_ssrs',emoji:'🛟',name:'Segurança emocional e risco',model:'C-SSRS',dom:'Segurança',sym:['risco','ideação','autoagressão','plano de ajuda','proteção'],age:['teen','adult']},
{k:'crafft',emoji:'🧪',name:'Uso de substâncias no adolescente',model:'CRAFFT',dom:'Substâncias',sym:['álcool','drogas','risco','amigos','direção'],age:['teen','adult']},
{k:'promis',emoji:'📈',name:'Saúde autorreferida e qualidade de vida',model:'PROMIS',dom:'Qualidade de vida',sym:['dor','fadiga','sono','função física','social'],age:['school','teen','adult']},
{k:'whodas',emoji:'🌍',name:'Funcionalidade global',model:'WHODAS',dom:'Funcionalidade',sym:['cognição','mobilidade','autocuidado','relações','participação'],age:['teen','adult']},
{k:'audit',emoji:'🍷',name:'Risco por álcool',model:'AUDIT/AUDIT-C',dom:'Substâncias',sym:['álcool','frequência','perda de controle','impacto','risco'],age:['teen','adult']},
{k:'assist',emoji:'🧪',name:'Risco por substâncias psicoativas',model:'WHO ASSIST',dom:'Substâncias',sym:['substâncias','uso','compulsão','prejuízo','risco'],age:['teen','adult']},
{k:'ptsd',emoji:'🌩️',name:'Trauma e estresse pós-evento',model:'CPSS/PCL',dom:'Trauma',sym:['revivência','evitação','hipervigilância','pesadelos','medo'],age:['school','teen','adult']},
{k:'pain',emoji:'🤕',name:'Dor e impacto funcional',model:'NRS/FLACC funcional',dom:'Dor',sym:['dor','intensidade','sono','escola','atividade'],age:['baby','pre','school','teen','adult']},
{k:'sleep',emoji:'😴',name:'Sono, ritmo e impacto diurno',model:'BEARS/ISI',dom:'Sono',sym:['início do sono','despertar','ronco','sonolência','rotina'],age:['baby','pre','school','teen','adult']},
{k:'feeding',emoji:'🍽️',name:'Alimentação, textura e segurança',model:'Feeding checklists',dom:'Alimentação',sym:['seletividade','textura','engasgo','mastigação','recusa'],age:['baby','pre','school','teen']},
{k:'motor',emoji:'🏃',name:'Coordenação, praxia e escrita',model:'DCDQ/MABC domains',dom:'Motor',sym:['coordenação','equilíbrio','motricidade fina','praxia','caligrafia'],age:['pre','school','teen']},
{k:'tics',emoji:'🔁',name:'Tiques e repetição motora/vocal',model:'tic severity domains',dom:'Tiques',sym:['tique motor','tique vocal','urgência','controle','prejuízo'],age:['school','teen','adult']},
{k:'ocd',emoji:'🔒',name:'Obsessões, compulsões e rigidez',model:'OCD domains',dom:'TOC',sym:['obsessão','compulsão','ritual','checagem','sofrimento'],age:['school','teen','adult']},
{k:'headache',emoji:'🤯',name:'Cefaleia e gatilhos',model:'headache diary domains',dom:'Cefaleia',sym:['cefaleia','gatilho','náusea','fotofobia','impacto'],age:['school','teen','adult']},
{k:'epilepsy',emoji:'🧬',name:'Eventos paroxísticos e crises',model:'seizure diary domains',dom:'Epilepsia',sym:['crise','queda','abalo','recuperação','gatilho'],age:['baby','pre','school','teen','adult']},
{k:'adaptive',emoji:'🚽',name:'Autonomia e vida diária',model:'adaptive behavior domains',dom:'Autonomia',sym:['banheiro','higiene','roupa','alimentação','rotina'],age:['baby','pre','school','teen','adult']},
{k:'social',emoji:'🤝',name:'Pragmática social e pares',model:'social communication domains',dom:'Social',sym:['amigos','turnos','conversa','empatia','grupo'],age:['pre','school','teen','adult']},
{k:'screen',emoji:'📱',name:'Tela, jogos e regulação digital',model:'digital wellbeing domains',dom:'Rotina digital',sym:['tela','jogo','sono','irritação','limites'],age:['pre','school','teen','adult']},
{k:'med',emoji:'💊',name:'Monitoramento medicamentoso',model:'medication monitoring domains',dom:'Farmacologia',sym:['adesão','efeito','sono','apetite','humor'],age:['baby','pre','school','teen','adult']}
];
const styles=[
{k:'rastreio',label:'Rastreio breve'},
{k:'impacto',label:'Impacto funcional'},
{k:'seguimento',label:'Seguimento evolutivo'},
{k:'ambiente',label:'Comparativo por ambiente'},
{k:'redflags',label:'Sinais de alerta'},
{k:'forcas',label:'Pontos fortes e proteção'}
];
function cap(s){return String(s).charAt(0).toUpperCase()+String(s).slice(1)}
function slug(s){return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}
function questions(src,age,who,style){const q=[
`O padrão de ${src.name.toLowerCase()} aparece de forma clara em ${age.who}?`,
`O respondente (${who.by}) observa prejuízo em rotina, aprendizagem, saúde ou convivência?`,
`A intensidade mudou nas últimas semanas ou meses?`,
`A dificuldade ocorre em mais de um ambiente ou depende muito do contexto?`,
`Há estratégia que melhora o desempenho, como rotina, apoio visual, pausa, treino ou redução de estímulo?`
];
src.sym.slice(0,5).forEach(x=>q.push(`O domínio “${x}” está presente de forma frequente ou clinicamente relevante?`));
if(style.k==='impacto')q.push('O sinal reduz independência, participação social, rendimento escolar ou adesão terapêutica?');
if(style.k==='seguimento')q.push('Comparando com a última avaliação, houve melhora, estabilidade ou piora funcional?');
if(style.k==='ambiente')q.push('O comportamento muda de forma importante entre casa, escola, terapia e consulta?');
if(style.k==='redflags')q.push('Existe sinal de alerta que exige avaliação clínica prioritária ou orientação imediata?');
if(style.k==='forcas')q.push('Quais habilidades preservadas ajudam a compensar a dificuldade principal?');
return q.slice(0,12)}
function tasks(src,age){const universal=[
'Leitura curta: “Lia viu um sapo no jardim. O sapo pulou perto da flor.” Perguntar: quem viu o sapo, onde estava e o que aconteceu depois.',
'Ditado de palavras: casa, bola, janela, prato, brincadeira. Registrar trocas, omissões, lentidão e frustração.',
'Repetição de frase: “O menino guardou a bola azul dentro da caixa”. Registrar memória verbal e ordem das palavras.',
'Sequência de comandos: pegue o lápis, toque na mesa e desenhe um círculo. Registrar compreensão, atenção e execução.',
'Nomeação rápida: copo, bola, chave, gato, mão, sapato. Registrar acesso lexical e articulação.'
];
const k=src.k;
if(['mchat','social'].includes(k))return ['Cena social: “Pedro queria brincar, mas João pegou o carrinho e saiu.” Perguntar o que Pedro sentiu e o que poderia fazer.','Brincadeira simbólica com boneco, prato e carrinho; observar faz de conta, turnos e compartilhamento.','Atenção compartilhada: apontar figura interessante e observar se acompanha gesto/olhar.',...universal].slice(0,8);
if(['vanderbilt'].includes(k))return ['Atenção auditiva: dizer sol, bola, peixe, bola, casa; bater na mesa quando ouvir bola.','Inibição: quando eu disser dia, responda noite; quando disser noite, responda dia.','Memória: repetir 4-8-2 e depois 7-1-9-3 conforme idade.',...universal].slice(0,8);
if(['sared','gad','phq','c_ssrs'].includes(k))return ['Termômetro emocional 0–10 para escola, separação, sono, tristeza e preocupação.','História social: “Um colega não respondeu sua mensagem.” Levantar três explicações possíveis.','Rede de ajuda: listar três adultos que procuraria se piorasse.',...universal].slice(0,8);
if(['feeding'].includes(k))return ['Lista alimentar: cinco alimentos aceitos, cinco recusados e motivo percebido.','Tolerância gradual: olhar, tocar, cheirar e aproximar alimento novo sem forçar.','Escala de textura: macio, crocante, misturado, cheiro forte, líquido.',...universal].slice(0,8);
if(['pain','headache','epilepsy'].includes(k))return ['Linha do tempo: registrar antes, durante e depois do episódio, duração, gatilho e recuperação.','Mapa corporal: apontar local, intensidade 0–10 e impacto na rotina.','Diário breve por 7 dias: sono, alimentação, tela, escola, dor/evento.',...universal].slice(0,8);
if(['motor'].includes(k))return ['Praxia: imitar bater palma, tocar cabeça e cruzar braços.','Grafomotor: copiar círculo, cruz, quadrado e frase curta.','Equilíbrio: ficar em um pé e andar em linha imaginária.',...universal].slice(0,8);
return universal.slice(0,8)}
const rows=[];sources.forEach(src=>ages.filter(a=>src.age.includes(a.k)).forEach(age=>resp.forEach(who=>styles.forEach(style=>rows.push({src,age,who,style})))));
const generated=rows.slice(0,620).map((r,i)=>({
 id:`global-${String(i+1).padStart(3,'0')}-${slug(r.src.k)}-${slug(r.age.k)}-${slug(r.who.k)}-${slug(r.style.k)}`,
 title:`${r.src.emoji} Global NeuroPed — ${r.src.name} · ${r.style.label} · ${r.age.label} · ${r.who.label}`,
 short_title:`${r.src.name} · ${r.style.label}`,
 original_title:`Modelo internacional de domínio: ${r.src.model}`,
 emoji:r.src.emoji,
 audience:r.who.k,
 audience_label:r.who.label,
 age_band:r.age.label,
 age_min_months:r.age.min,
 age_max_months:r.age.max,
 symptoms:r.src.sym,
 complaints:r.src.sym,
 keywords:[r.src.model,r.src.name,r.src.dom,r.style.label,r.age.label,r.who.label,...r.src.sym],
 domain:r.src.dom,
 source_model:r.src.model,
 page:'instrumento.html',
 anchor:`global-${String(i+1).padStart(3,'0')}`,
 priority:76+(i%24),
 plain_questions:questions(r.src,r.age,r.who,r.style),
 direct_tasks:tasks(r.src,r.age),
 clinical_use:`Inventário autoral inspirado em domínios internacionais gratuitos/abertos (${r.src.model}), para ${r.age.who}, respondido por ${r.who.by}.`,
 differentiator:'Expande o banco NeuroPed com triagem operacional autoral, sem copiar itens proprietários ou reproduzir escala licenciada.',
 not_normative_disclaimer:'Instrumento autoral/operacional de triagem e acompanhamento. Não substitui escala oficial, avaliação clínica, licença de instrumento ou validação psicométrica quando necessária.'
}));
const seen=new Set(base.map(x=>x&&x.id));
window.NEUROPED_EDITORIAL_SCALES=base.concat(generated.filter(x=>!seen.has(x.id)));
window.NEUROPED_GLOBAL_MAX_COUNT=generated.length;
})();

/* ===== scales-featured-extra.js ===== */
(function(){
'use strict';
if(window.NEUROPED_FEATURED_EXTRA_LOADED)return;window.NEUROPED_FEATURED_EXTRA_LOADED=true;
const base=Array.isArray(window.NEUROPED_EDITORIAL_SCALES)?window.NEUROPED_EDITORIAL_SCALES:[];
function q(a){return a}function t(a){return a}
const extra=[
{id:'jf-einp-tdah-tod-12mais',title:'⚡ EINP-TDAH/TOD 12+ — Adolescente, escola, impacto e proteção',short_title:'EINP-TDAH/TOD 12+',emoji:'⚡',audience:'escola',audience_label:'Teste escolar/adolescente',age_band:'12–17+ anos',age_min_months:144,age_max_months:960,domain:'TDAH/TOD Adolescente',symptoms:['desatenção','função executiva','oposição','impacto','pontos positivos'],complaints:['tdah adolescente','tod','não estuda','desorganizado','oposição'],priority:985,featured_rank:11,featured_label:'Escala em destaque',source_document:'EINP-TDAH/TOD 12+',plain_questions:q(['Mantém atenção em aulas longas, leitura ou atividades que exigem esforço mental?','Começa tarefas, mas perde o fio da atividade ou abandona etapas?','Organiza agenda, prazos, tarefas, material e provas?','Comete erros por pressa, descuido ou falta de revisão?','Apresenta oposição, irritabilidade ou recusa diante de regras escolares?','O prejuízo funcional aparece em notas, rotina, convivência ou autonomia?','Há impacto em sono, telas, humor, motivação ou vida familiar?','Existem fatores positivos que reduzem risco e ajudam no plano?','O adolescente reconhece a própria dificuldade ou nega completamente?','A escola observa padrão persistente nos últimos 30 a 60 dias?']),direct_tasks:t(['Pedir que organize uma semana de provas e tarefas em três prioridades.','Leitura curta com pergunta inferencial para observar atenção sustentada.','Tarefa de inibição: dia/noite, com aumento progressivo de velocidade.','Memória operacional: repetir números e reorganizar uma sequência simples.','Planejamento: listar passos para estudar para uma prova difícil.','Autorrelato breve: o que mais atrapalha seus estudos hoje?','Comparar relato do adolescente com professor/família.','Registrar fatores positivos de proteção e motivação.']),clinical_use:'Triagem clínico-pedagógica para adolescentes com sinais de TDAH/TOD, prejuízo funcional e fatores positivos.',differentiator:'Bloco de impacto pesa mais e fatores positivos reduzem escore, evitando olhar apenas deficitário.',not_normative_disclaimer:'Instrumento autoral de triagem; não substitui avaliação médica, psicológica ou neuropsicológica.'},
{id:'jf-enf-tea-drj',title:'🧩 ENF-TEA-DRJ — Nivelamento funcional do TEA por idade',short_title:'ENF-TEA-DRJ',emoji:'🧩',audience:'clinico',audience_label:'Clínico/Família',age_band:'12 meses–17 anos',age_min_months:12,age_max_months:215,domain:'TEA nível de suporte',symptoms:['TEA','comunicação social','rigidez','sensorial','suporte'],complaints:['nível tea','autismo leve moderado grave','suporte','terapia'],priority:984,featured_rank:12,featured_label:'Escala em destaque',source_document:'ENF-TEA-DRJ',plain_questions:q(['A comunicação social está compatível com a idade?','A criança compartilha interesses, gestos, olhar e atenção com outras pessoas?','Há dificuldade de reciprocidade social, brincadeira ou conversa?','Há rigidez, repetição, interesses restritos ou resistência a mudanças?','Há resposta sensorial incomum que cause prejuízo funcional?','O funcionamento exige suporte eventual, regular ou muito substancial?','O prejuízo aparece em casa, escola, terapia e comunidade?','A autonomia está reduzida por comunicação, comportamento ou segurança?','O escore combina com a história clínica e observação direta?','Há comorbidades que aumentam suporte sem serem TEA em si?']),direct_tasks:t(['Observação de atenção compartilhada com brinquedo/figura interessante.','Brincadeira simbólica ou social conforme idade.','Comando social: pedir, esperar, alternar turno e reparar erro.','Mudança pequena de regra para observar flexibilidade.','Registro de resposta sensorial a barulho, toque, luz ou transição.','Cena social para interpretação: colega pega o brinquedo e sai.','Listar nível de ajuda necessário para escola e rotina.','Gerar síntese de suporte: nível 1, 2 ou 3 apenas se clinicamente compatível.']),clinical_use:'Organiza sinais funcionais por faixa etária para estimar necessidade provável de suporte em TEA.',differentiator:'Separa comunicação social, restrição/sensorialidade e impacto funcional.',not_normative_disclaimer:'Instrumento autoral de apoio; não substitui avaliação diagnóstica individualizada.'},
{id:'jf-enso-ped-sono',title:'😴 ENSO-Ped Nordeste — Sono pediátrico 2–17 anos',short_title:'ENSO-Ped Nordeste',emoji:'😴',audience:'familia',audience_label:'Teste familiar',age_band:'2–17 anos',age_min_months:24,age_max_months:215,domain:'Sono pediátrico',symptoms:['sono','ronco','despertares','sonolência','parassonia'],complaints:['dorme mal','ronca','acorda','sono agitado','sonolência'],priority:983,featured_rank:13,featured_label:'Escala em destaque',source_document:'ENSO-Ped Nordeste JF',plain_questions:q(['A criança demora para iniciar o sono na maioria das noites?','Acorda várias vezes ou desperta muito cedo?','Ronca, respira pela boca ou parece ter pausas respiratórias?','Fica sonolenta, irritada ou desatenta durante o dia?','Tem pesadelos, terror noturno, sonambulismo ou movimentos repetitivos?','O uso de telas atrasa o sono ou piora a rotina noturna?','A rotina de dormir é regular nos dias de escola?','O sono piora comportamento, atenção, linguagem ou aprendizagem?','Há suspeita de crise noturna ou evento neurológico durante o sono?','O bloco respiratório exige prioridade mesmo com escore total baixo?']),direct_tasks:t(['Montar linha do tempo: jantar, tela, banho, cama, sono, despertares e acordar.','Registrar 7 dias: horário de dormir, despertares, ronco e sonolência.','Perguntar à criança: “o que atrapalha seu sono?” quando possível.','Checar sinais respiratórios: ronco, boca aberta, pausas, suor, sono inquieto.','Relacionar sono com atenção, humor, hiperatividade e escola.','Orientar vídeo seguro de evento noturno se houver suspeita de crise.','Classificar prioridade: rotina, respiratório, parassonia, neurológico ou comportamento.','Gerar plano inicial de higiene do sono e indicação de investigação quando necessário.']),clinical_use:'Triagem clínica de sono pediátrico com escore e sinais de alerta.',differentiator:'Valoriza ronco/respiração e impacto diurno mesmo quando o escore total não parece alto.',not_normative_disclaimer:'Instrumento autoral de triagem; não substitui consulta ou exames quando indicados.'},
{id:'jf-epil-ne',title:'🧬 EPIL-NE — Escala Epileptológica Neuropediátrica Nordestina',short_title:'EPIL-NE',emoji:'🧬',audience:'clinico',audience_label:'Clínico',age_band:'0–18 anos',age_min_months:0,age_max_months:216,domain:'Epilepsia',symptoms:['crise','semiologia ictal','padrão temporal','impacto','farmacologia'],complaints:['epilepsia','convulsão','crise','olhar parado','abalo'],priority:982,featured_rank:14,featured_label:'Escala em destaque',source_document:'EPIL-NE v1.0',plain_questions:q(['Qual foi o tipo de crise predominante nos últimos 3 meses?','Houve perda ou comprometimento da consciência?','A crise teve generalização, queda, abalos, ausência ou espasmos?','A duração habitual passa de 2 minutos ou há recuperação lenta?','Há padrão temporal, gatilho ou agrupamento de crises?','A crise trouxe prejuízo escolar, familiar, social ou risco físico?','Há carga farmacológica alta, efeitos adversos ou má adesão?','O contexto social dificulta acesso, sono, rotina ou acompanhamento?','O nível de complexidade exige retorno mais curto ou investigação urgente?','Há vídeo, diário ou descrição confiável dos eventos?']),direct_tasks:t(['Construir linha do tempo: antes, durante e depois do evento.','Classificar tipo de crise pelo relato e vídeo, quando disponível.','Registrar duração, frequência, recuperação e gatilhos.','Checar consciência, queda, abalos, olhar parado, automatismos e pós-ictal.','Mapear medicações, adesão, efeitos adversos e dose atual.','Avaliar impacto em escola, sono, segurança e autonomia.','Gerar Índice de Complexidade Epileptológica orientativo.','Definir urgência de EEG, RM, ajuste terapêutico ou seguimento.']),clinical_use:'Rastreamento multidimensional de epilepsia pediátrica para complexidade, seguimento e investigação.',differentiator:'Integra semiologia, tempo, repercussão, carga farmacológica e contexto.',not_normative_disclaimer:'Instrumento autoral de apoio; não substitui classificação ILAE, EEG, avaliação clínica ou decisão médica.'},
{id:'jf-ecnfaj-cefaleia',title:'🤕 ECNFAJ-1 — Cefaleia Neuropediátrica Fraga Araújo Júnior',short_title:'ECNFAJ-1 Cefaleia',emoji:'🤕',audience:'familia',audience_label:'Família/Clínico',age_band:'infância e adolescência',age_min_months:60,age_max_months:215,domain:'Cefaleia',symptoms:['dor de cabeça','intensidade','gatilhos','impacto','medicação'],complaints:['cefaleia','enxaqueca','dor cabeça','vômito','luz'],priority:981,featured_rank:15,featured_label:'Escala em destaque',source_document:'ECNFAJ-1',plain_questions:q(['Qual foi a intensidade da dor na pior crise e na crise atual?','Quantos dias no mês houve cefaleia?','Quantos dias precisou de medicação?','A dor fez faltar à escola ou parar atividades?','A dor vem com náusea, vômito, tontura, luz ou barulho incomodando?','Há gatilhos como sol, jejum, sono ruim, estresse, tela ou menstruação?','A cefaleia prejudica concentração e rendimento escolar?','Há sinais de alerta: piora progressiva, despertar noturno, déficit ou vômitos persistentes?','Existe uso excessivo de analgésico?','O diário de crises foi preenchido de forma suficiente?']),direct_tasks:t(['Mostrar escala de faces ou nota 0–10 para pior dor e dor atual.','Preencher diário dos últimos 30 dias com início, duração, localização e gatilho.','Mapear localização: frontal, temporal, occipital, parietal, unilateral, bilateral ou toda cabeça.','Registrar qualidade: latejante, pressão, agulhada, queimação ou aperto.','Contar dias de escola perdidos e dias com medicação.','Checar luz, barulho, vômito, tontura e necessidade de deitar.','Identificar sinais de alerta que exigem avaliação prioritária.','Gerar plano: diário, higiene do sono, gatilhos e investigação quando indicada.']),clinical_use:'Instrumento autoral para avaliação multidimensional da cefaleia na infância e adolescência.',differentiator:'Integra faces, diário de crises, gatilhos, medicação e impacto funcional.',not_normative_disclaimer:'Instrumento clínico de triagem; não substitui avaliação neurológica ou investigação quando houver alerta.'},
{id:'jf-eani-ansiedade',title:'😟 EANI-FJ — Ansiedade Neuropediátrica Infantojuvenil',short_title:'EANI-FJ Ansiedade',emoji:'😟',audience:'familia',audience_label:'Família/Autoteste',age_band:'4–17 anos',age_min_months:48,max_age_months:215,age_max_months:215,domain:'Ansiedade',symptoms:['ansiedade generalizada','separação','social','pânico','somatização','impacto'],complaints:['ansiedade','medo','pânico','separação','nervoso'],priority:980,featured_rank:16,featured_label:'Escala em destaque',source_document:'EANI-FJ',plain_questions:q(['A criança se preocupa demais com coisas pequenas ou futuras?','Tem medo intenso de se separar dos pais ou cuidadores?','Evita falar, participar ou se expor por medo de julgamento?','Tem crises com falta de ar, coração acelerado, tremor ou sensação de perder controle?','Queixa-se de dor de barriga, aperto no peito, náusea ou mal-estar de nervoso?','Evita escola, prova, passeio, dormir fora ou situações sociais?','A ansiedade atrapalha sono, alimentação, estudo ou convivência?','A família precisa tranquilizar repetidamente?','A criança reconhece o medo como exagerado ou não consegue controlar?','Há comorbidade com TDAH, TEA, epilepsia ou aprendizagem?']),direct_tasks:t(['Termômetro emocional 0–10 para escola, separação, prova, sono e falar em público.','História: “um colega não respondeu sua mensagem”. Pedir três explicações possíveis.','Nomear emoções: medo, vergonha, tristeza, raiva, preocupação.','Pedir que conte onde sente ansiedade no corpo.','Listar situações evitadas e o que acontece se precisar enfrentar.','Identificar adulto seguro e estratégia de regulação.','Comparar relato parental e autorrelato em maiores de 10 anos.','Gerar plano inicial: psicoeducação, rotina, exposição gradual e encaminhamento quando necessário.']),clinical_use:'Triagem multidimensional de ansiedade em crianças e adolescentes no contexto neuropediátrico.',differentiator:'Integra ansiedade generalizada, separação, social, pânico/fobias, somatização e impacto.',not_normative_disclaimer:'Instrumento autoral de uso clínico; não substitui avaliação psicológica/psiquiátrica ou escala validada.'},
{id:'jf-brif-neuroped',title:'🧭 BRIF-NeuroPed / EBIRF — Relato funcional multi-informante',short_title:'BRIF-NeuroPed',emoji:'🧭',audience:'familia',audience_label:'Família/Escola/Terapias',age_band:'0–17+ anos',age_min_months:0,age_max_months:960,domain:'Triagem funcional multi-informante',symptoms:['relato familiar','escola','terapia','impacto','pontos positivos'],complaints:['triagem geral','família escola','relatório','funcional'],priority:979,featured_rank:17,featured_label:'Escala em destaque',source_document:'BRIF-NeuroPed/EBIRF',plain_questions:q(['Qual é a maior preocupação sobre a criança hoje em uma frase?','Conte uma cena real recente que mostre a dificuldade.','Quando os sinais começaram e como evoluíram?','Houve perda de fala, contato, brincadeira, autonomia, sono ou controle de esfíncter?','Como a criança pede ajuda, mostra dor, recusa ou conta novidade?','Quais situações disparam crises, irritação, fuga ou travamento?','O que ajuda a recuperar depois de crise?','Como estão sono, alimentação, sensorialidade e telas?','O que a escola relata como maior dificuldade?','Quais são as maiores qualidades e pontos fortes da criança?']),direct_tasks:t(['Entrevista com família pedindo exemplos concretos.','Comparar relato da escola com relato familiar.','Registrar 20 perguntas abertas essenciais antes ou depois da escala fechada.','Pontuar sintomas, impacto funcional dobrado e pontos positivos subtraídos.','Classificar índice clínico em baixo, leve, moderado, alto ou muito alto.','Identificar divergência entre informantes como dado clínico.','Gerar narrativa funcional para consulta ou relatório.','Selecionar instrumentos específicos a partir do perfil obtido.']),clinical_use:'Triagem funcional multi-informante para organizar relatos de família, escola, cuidadores e terapeutas.',differentiator:'Combina sintomas, impacto funcional e pontos positivos, com 20 perguntas abertas essenciais.',not_normative_disclaimer:'Instrumento autoral; não reproduz escala protegida e não substitui avaliação especializada.'},
{id:'jf-esm-edj-medicacao',title:'💊 ESM-EDJ — Satisfação com a medicação em neuropediatria',short_title:'ESM-EDJ Medicação',emoji:'💊',audience:'familia',audience_label:'Cuidador/Adolescente',age_band:'infância e adolescência',age_min_months:0,age_max_months:215,domain:'Monitoramento medicamentoso',symptoms:['eficácia','efeitos adversos','adesão','qualidade de vida','continuidade'],complaints:['medicação','efeito colateral','apetite','sono','adesão'],priority:978,featured_rank:18,featured_label:'Escala em destaque',source_document:'ESM-EDJ',plain_questions:q(['A medicação trouxe benefício percebido no principal sintoma-alvo?','Houve melhora funcional em casa, escola ou terapias?','A família percebe efeitos adversos relevantes?','Sono, apetite, humor, irritabilidade ou energia mudaram após a medicação?','A rotina de uso está sendo seguida corretamente?','Há esquecimento, recusa, atraso ou uso irregular?','A medicação melhorou qualidade de vida ou participação?','A relação médico-família favorece confiança e compreensão do tratamento?','A família deseja manter, ajustar ou discutir a medicação?','O benefício supera o desconforto ou risco observado?']),direct_tasks:t(['Listar medicamento, dose, início e sintoma-alvo.','Comparar antes/depois em atenção, comportamento, sono, crises, humor e escola.','Registrar efeitos adversos por intensidade e impacto.','Checar adesão: horário, esquecimentos, supervisão e dificuldades.','Perguntar ao adolescente, quando possível, como se sente com a medicação.','Calcular satisfação percentual por módulos.','Gerar resumo: benefício, tolerabilidade, adesão e conduta a discutir.','Nunca mudar dose automaticamente; apenas organizar dados para decisão médica.']),clinical_use:'Avalia satisfação, benefício percebido, tolerabilidade, adesão e continuidade em farmacoterapia neuropediátrica.',differentiator:'Integra cuidador, adolescente, adesão e efeitos adversos em formato multidimensional.',not_normative_disclaimer:'Instrumento de monitoramento clínico; não substitui decisão médica ou farmacovigilância formal.'},
{id:'jf-eci-fraga-cognitiva',title:'🧠 ECI-Fraga / NeuroQI-Fraga — Cognição infantil estimada',short_title:'ECI-Fraga Cognitiva',emoji:'🧠',audience:'clinico',audience_label:'Clínico',age_band:'0–16 anos',age_min_months:0,age_max_months:203,domain:'Cognição infantil',symptoms:['linguagem','raciocínio não verbal','memória','visuoespacial','aprendizagem','adaptação'],complaints:['QI','cognição','deficiência intelectual','atraso global','não verbal'],priority:977,featured_rank:19,featured_label:'Escala em destaque',source_document:'ECI-Fraga',plain_questions:q(['A criança demonstra resolução de problemas compatível com a idade?','A linguagem receptiva e/ou expressiva está compatível com o funcionamento global?','Em crianças não verbais, há raciocínio por gesto, olhar, escolha, figuras ou CAA?','A memória operacional permite seguir instruções com etapas?','A organização visuoespacial e pareamento visual estão preservados?','A aprendizagem de novas habilidades ocorre com repetição e apoio?','A adaptação funcional combina com a idade cronológica?','A baixa colaboração torna o resultado pouco confiável?','O perfil sugere atraso global, deficiência intelectual ou discrepância específica?','O resultado deve ser descrito como estimativa funcional, não QI oficial?']),direct_tasks:t(['Pareamento visual: igual/diferente com figuras ou objetos.','Classificação: separar objetos por cor, forma ou função.','Sequência: reproduzir padrão simples com blocos ou figuras.','Memória: repetir dois a quatro itens conforme idade.','Problema prático: como pegar objeto fora de alcance?','Linguagem receptiva: seguir comandos simples e com duas etapas.','Para não verbal: oferecer escolha por olhar, gesto, figura ou toque.','Registrar confiabilidade: boa, moderada ou baixa.']),clinical_use:'Estimativa funcional de cognição/desenvolvimento intelectual quando teste formal não é possível ou ainda não indicado.',differentiator:'Separa linguagem oral de inteligência funcional e valoriza respostas não verbais.',not_normative_disclaimer:'Não mede QI oficial; não substitui teste psicométrico padronizado ou avaliação neuropsicológica.'},
{id:'jf-efdi-v-nv',title:'🧩 EFDI-V/NV — Deficiência intelectual em verbais e não verbais',short_title:'EFDI-V/NV',emoji:'🧩',audience:'clinico',audience_label:'Clínico/Família/Escola',age_band:'crianças verbais e não verbais',age_min_months:0,age_max_months:215,domain:'Deficiência intelectual funcional',symptoms:['deficiência intelectual','não verbal','autonomia','adaptação','raciocínio funcional'],complaints:['deficiência intelectual','não verbal','retardo','atraso global','baixo funcionamento'],priority:976,featured_rank:20,featured_label:'Escala em destaque',source_document:'EFDI-V/NV',plain_questions:q(['A criança realiza tarefas práticas compatíveis com a idade?','A comunicação funcional ocorre por fala, gesto, olhar, figuras, tablet ou CAA?','A criança compreende comandos e rotinas simples?','Resolve problemas práticos com objetos familiares?','A autonomia em alimentação, higiene, roupa e banheiro está compatível?','A aprendizagem escolar/terapêutica generaliza para a vida real?','Há discrepância entre linguagem oral e raciocínio funcional?','A criança não verbal demonstra escolha, intenção, imitação ou solução de problemas?','O funcionamento adaptativo está abaixo do esperado em múltiplos ambientes?','A idade exige cautela antes de afirmar deficiência intelectual definitiva?']),direct_tasks:t(['Escolha funcional entre dois objetos: água/brinquedo, figura/objeto.','Pareamento: objeto igual, cor igual ou figura correspondente.','Imitação: bater palma, tocar cabeça, empurrar carrinho.','Problema prático: abrir pote simples ou buscar objeto visível.','CAA/figuras: pedir ajuda, banheiro, dor ou pausa.','Comandos: “pegue”, “guarde”, “dê para mim”, “coloque em cima”.','Observação adaptativa: autonomia, segurança e tolerância a limites.','Classificar estimativa com prudência e registrar fonte: família, escola, consulta e terapias.']),clinical_use:'Triagem funcional para estimar comprometimento intelectual-adaptativo em crianças verbais e não verbais.',differentiator:'Evita confundir ausência de fala com ausência de raciocínio funcional.',not_normative_disclaimer:'Instrumento clínico autoral; não substitui avaliação neuropsicológica, psicométrica ou adaptativa padronizada.'}
];
const ids=new Set(base.map(x=>x&&x.id));
window.NEUROPED_FEATURED_EXTRA=extra;
window.NEUROPED_EDITORIAL_SCALES=extra.filter(x=>!ids.has(x.id)).concat(base);
})();

/* ===== scales-featured-10.js ===== */
(function(){
'use strict';
if(window.NEUROPED_FEATURED10_LOADED)return;window.NEUROPED_FEATURED10_LOADED=true;
const base=Array.isArray(window.NEUROPED_EDITORIAL_SCALES)?window.NEUROPED_EDITORIAL_SCALES:[];
function q(arr){return arr}
function t(arr){return arr}
const featured=[
{
 id:'jf-pc-funcional-integrada',title:'♿ PC Funcional Integrada — GMFCS · MACS · CFCS · VFCS · BFMF · FMS',short_title:'PC Funcional Integrada',emoji:'♿',audience:'clinico',audience_label:'Clínico',age_band:'0–18+ anos',age_min_months:0,age_max_months:960,domain:'Paralisia Cerebral',symptoms:['paralisia cerebral','motricidade grossa','mãos','comunicação','fala','mobilidade'],complaints:['PC','GMFCS','MACS','CFCS','FMS','cadeira de rodas'],priority:995,featured_rank:1,featured_label:'Escala prioritária',source_document:'PC Escalas Funcionais por Faixa Etária',plain_questions:q(['Qual é a mobilidade habitual da criança em casa, escola e comunidade?','Como a criança usa as mãos em atividades reais do dia a dia?','A comunicação é eficaz com familiares e também com pessoas desconhecidas?','A fala é compreensível para pessoas fora da família?','Há diferença importante entre desempenho motor grosso e função manual?','A criança precisa de dispositivo, cadeira de rodas, órtese ou auxílio humano para locomoção?','A classificação mudou após cirurgia, toxina, reabilitação intensiva ou crescimento?','A limitação funcional interfere em escola, autocuidado, alimentação ou participação social?','Há dissociação entre potencial máximo em sessão e desempenho habitual?','Quais metas funcionais são realistas para os próximos 6 meses?']),direct_tasks:t(['Observar sentar, transferir, levantar e caminhar curta distância, quando seguro.','Testar manipulação: pegar copo, lápis, brinquedo pequeno e objeto bimanual.','Registrar comunicação com familiar e com avaliador desconhecido.','Pedir frase simples ou vocalização funcional e registrar inteligibilidade.','Registrar mobilidade em 5m, 50m e 500m por relato funcional.','Anotar dispositivo usado em cada ambiente: nenhum, corrimão, andador, muleta, cadeira manual ou motorizada.','Comparar capacidade máxima em consultório versus desempenho habitual.','Gerar síntese com níveis funcionais e metas por domínio.']),clinical_use:'Integra classificação funcional em paralisia cerebral por faixa etária, priorizando desempenho habitual e tomada de decisão clínica.',differentiator:'Agrupa motricidade grossa, função manual, comunicação, fala, bimanualidade e mobilidade funcional.',not_normative_disclaimer:'Instrumento operacional complementar; aplicar respeitando critérios originais das escalas funcionais e julgamento clínico.'
},
{
 id:'jf-tdl-aprendizagem-ate8',title:'🗣️ TDL e Aprendizagem até 8 anos — Linguagem · leitura · escrita · aritmética',short_title:'TDL e Aprendizagem até 8 anos',emoji:'🗣️',audience:'familia',audience_label:'Família/Escola',age_band:'0–8 anos',age_min_months:0,age_max_months:107,domain:'Linguagem e Aprendizagem',symptoms:['fala','linguagem','leitura','escrita','aritmética','TDL'],complaints:['não fala','dificuldade escolar','troca sons','não lê','não escreve'],priority:994,featured_rank:2,featured_label:'Escala prioritária',source_document:'Escala TDL e Aprendizagem Escolar',plain_questions:q(['Demorou para começar a falar palavras ou frases?','Usa frases curtas demais para a idade?','Tem dificuldade para contar o que aconteceu no dia?','Troca palavras ou usa termos vagos como “isso”, “coisa” ou “aquele”?','Tem dificuldade para entender comandos com duas ou mais etapas?','Tem dificuldade para reconhecer rimas ou separar sílabas?','Confunde letras visualmente parecidas ou sons parecidos?','Evita atividades com livros, letras, leitura ou escrita?','Tem dificuldade para copiar, ditar ou escrever palavras simples?','A dificuldade causa prejuízo escolar, emocional ou familiar?']),direct_tasks:t(['Nomeação: copo, bola, casa, mão, gato, sapato.','Compreensão: “pegue o lápis e coloque embaixo do papel”.','Repetição: “O menino pegou a bola azul”.','Consciência fonológica: bater palmas para ca-sa, bo-la, ja-ne-la.','Rima: o que rima com pão: mão, bola ou casa?','Ditado: casa, bola, pato, janela, escola.','Frase para escrever: “A menina gosta de brincar.”','Interpretação curta: “Lia viu um sapo no jardim.” Perguntar quem viu e onde estava.']),clinical_use:'Triagem clínico-escolar para sinais de TDL e dificuldades iniciais de leitura, escrita e aritmética.',differentiator:'Integra linguagem oral, pré-leitura, alfabetização e impacto funcional até 8 anos.',not_normative_disclaimer:'Instrumento autoral de triagem; não substitui avaliação fonoaudiológica, neuropsicológica ou psicopedagógica formal.'
},
{
 id:'jf-einp-tdah-tod-6-12',title:'⚡ EINP-TDAH/TOD 6–12 — Atenção · oposição · impacto · pontos positivos',short_title:'EINP-TDAH/TOD 6–12',emoji:'⚡',audience:'escola',audience_label:'Teste escolar',age_band:'6–12 anos',age_min_months:72,age_max_months:155,domain:'TDAH/TOD',symptoms:['desatenção','hiperatividade','impulsividade','oposição','impacto escolar'],complaints:['tdah','tod','agitado','desatento','não termina tarefa','opositor'],priority:993,featured_rank:3,featured_label:'Escala prioritária',source_document:'EINP-TDAH/TOD 6–12',plain_questions:q(['Tem dificuldade para começar atividade quando a professora explica para a turma?','Precisa que a instrução seja repetida várias vezes?','Começa a atividade, mas se perde, para ou muda de assunto?','Esquece materiais, tarefas, recados ou combinados escolares?','Levanta-se da cadeira quando deveria permanecer sentado?','Fala fora de hora, interrompe ou responde antes de ser chamado?','Tem dificuldade para esperar a vez em fila, jogo ou roda?','Desafia regras simples ou recusa cumprir combinados?','O comportamento causa prejuízo real em aprendizagem, convivência ou rotina?','Quais pontos positivos protegem a criança e devem ser usados no plano?']),direct_tasks:t(['Atenção auditiva: bater na mesa quando ouvir “bola” na sequência sol, bola, peixe, bola, casa.','Inibição: quando eu disser dia, responda noite; quando disser noite, responda dia.','Memória de trabalho: repetir 4-8-2 e 7-1-9-3 conforme idade.','Sequência escolar: desenhar círculo, escrever nome e fazer um risco embaixo.','Planejamento: listar três passos para organizar a mochila.','Leitura curta com perguntas para observar atenção sustentada.','Tarefa de espera: jogo curto de turnos com regra simples.','Registrar se melhora com instrução curta, pista visual e reforço positivo.']),clinical_use:'Organiza observação escolar de TDAH, TOD, impacto funcional e fatores positivos em crianças de 6 a 12 anos.',differentiator:'Valoriza prejuízo funcional e pontos positivos, não apenas sintomas.',not_normative_disclaimer:'Instrumento autoral clínico-pedagógico; não substitui diagnóstico clínico ou escala padronizada.'
},
{
 id:'jf-protocolo-exames-tea-tdah',title:'🧪 Protocolo de Exames TEA/TDAH/Farmacogenética — Semáforo clínico',short_title:'Protocolo de Exames TEA/TDAH',emoji:'🧪',audience:'clinico',audience_label:'Clínico',age_band:'0–17 anos',age_min_months:0,age_max_months:215,domain:'Exames complementares',symptoms:['TEA','TDAH','genética','EEG','RM','farmacogenética'],complaints:['exames','farmacogenética','eeg','ressonância','genética'],priority:992,featured_rank:4,featured_label:'Protocolo prioritário',source_document:'Protocolo de Exames Complementares TEA/TDAH/Farmacogenética',plain_questions:q(['Há atraso global, deficiência intelectual, dismorfismo, epilepsia ou história familiar forte?','Há crise, evento paroxístico, perda de contato, automatismo ou regressão?','Há sinal neurológico focal, regressão motora, cefaleia de alarme ou crise focal?','Há atraso de fala, baixa resposta ao nome, suspeita auditiva ou otites recorrentes?','Há seletividade alimentar severa, fadiga, perda ponderal ou sintomas sistêmicos?','Há falha terapêutica repetida ou efeito adverso intenso com psicotrópicos?','O exame solicitado mudará conduta, segurança, prognóstico ou aconselhamento familiar?','O pedido evita pacote universal sem pergunta clínica concreta?','A justificativa foi registrada em prontuário/laudo?','A família entendeu que exame não confirma nem exclui isoladamente TEA/TDAH?']),direct_tasks:t(['Classificar cada exame como verde, amarelo ou vermelho.','Registrar pergunta clínica que o exame deve responder.','Preencher: hipótese, achado motivador, resultado esperado e impacto potencial.','Revisar audição/visão antes de exames caros quando há atraso de fala.','Checar sinais neurológicos, regressão e eventos paroxísticos antes de EEG/RM.','Decidir se genética é indicada por atraso global, DI, epilepsia, regressão ou fenótipo sindrômico.','Decidir se farmacogenética é acionável ou apenas curiosidade sem mudança de conduta.','Gerar frase curta para a família explicando o motivo do exame.']),clinical_use:'Apoia decisão prudente sobre exames em TEA/TDAH e farmacogenética, evitando rastreios caros sem impacto.',differentiator:'Usa semáforo clínico e pergunta final: se alterar, o que mudará na conduta?',not_normative_disclaimer:'Protocolo operacional de consultório; não substitui julgamento clínico individualizado.'
},
{
 id:'jf-tea-check-documentado',title:'🧩 TEA Check Documentado — Funcionamento atual e metas de 6 meses',short_title:'TEA Check Documentado',emoji:'🧩',audience:'clinico',audience_label:'Clínico/Família/Escola',age_band:'0–17 anos',age_min_months:0,age_max_months:215,domain:'TEA funcional',symptoms:['TEA','metas','comunicação','brincar','regulação','escola'],complaints:['tea check','autismo','metas','evolução','terapias'],priority:991,featured_rank:5,featured_label:'Escala prioritária',source_document:'TEA Check Documentado',plain_questions:q(['Qual é o funcionamento atual da criança em comunicação funcional?','Como está a interação social, atenção compartilhada e brincar?','Quais comportamentos ou sinais sensoriais mais interferem na rotina?','Quais são os pontos fortes mais úteis para intervenção?','Quais vulnerabilidades precisam virar metas objetivas?','A escola e as terapias descrevem o mesmo perfil da família?','Houve evolução boa, parcial ou insuficiente nos últimos meses?','Quais metas realistas podem ser acompanhadas em 6 meses?','Há necessidade de alinhamento com escola ou equipe terapêutica?','O documento final será breve, útil e compreensível para família?']),direct_tasks:t(['Avaliação direta de 20 minutos: observar comunicação, interação, brincar, atenção e regulação.','Análise documental de 20 minutos: escola, fono, TO, psicologia, psicopedagogia e PEI.','Listar 3 pontos fortes e 3 vulnerabilidades prioritárias.','Definir 3 a 5 metas funcionais de 6 meses.','Classificar evolução: boa, parcial ou insuficiente.','Registrar adaptações escolares objetivas.','Gerar devolutiva de 20 minutos aos pais.','Se necessário, preparar alinhamento de até 20 minutos com escola.']),clinical_use:'Avaliação funcional complementar para organizar funcionamento atual, metas realistas e alinhamento família-escola-terapias em TEA.',differentiator:'Conecta consulta, observação direta, análise documental, devolutiva e metas de 6 meses.',not_normative_disclaimer:'Avaliação funcional breve e complementar; não é teste diagnóstico isolado.'
},
{
 id:'jf-tde-nordeste',title:'📚 TDE-Nordeste — Leitura · escrita · aritmética por idade',short_title:'TDE-Nordeste',emoji:'📚',audience:'clinico',audience_label:'Clínico/Escolar',age_band:'6–17 anos',age_min_months:72,age_max_months:215,domain:'Desempenho escolar',symptoms:['leitura','escrita','aritmética','compreensão','produção textual'],complaints:['tde','dislexia','discalculia','disgrafia','baixo rendimento'],priority:990,featured_rank:6,featured_label:'Escala prioritária',source_document:'TDE-Nordeste',plain_questions:q(['A leitura está compatível com idade e série?','A criança reconhece palavras, frases e textos curtos com precisão?','A compreensão literal e inferencial está preservada?','A escrita apresenta organização, ortografia e legibilidade adequadas?','O ditado mostra trocas, omissões ou segmentação inadequada?','A aritmética funcional está compatível com idade?','Há discrepância entre leitura, escrita e matemática?','A observação clínica mostra lentidão, impulsividade ou frustração?','O desempenho melhora com apoio individual?','Há necessidade de avaliação neuropsicológica, psicopedagógica ou fonoaudiológica?']),direct_tasks:t(['6–8 anos: leitura de palavras simples, frase curta e perguntas literais.','9–12 anos: texto interpretativo curto, resumo oral e produção explicativa.','13–17 anos: leitura crítica e síntese escrita breve.','Ditado de palavras: casa, bola, janela, prato, brincadeira.','Ditado de frase: “A menina gosta de ler na escola.”','Produção textual: “Conte uma coisa boa que aconteceu na escola.”','Aritmética: 8+5, 14-6, 3 grupos de 4, metade de 10.','Problema funcional: “Se um lanche custa 7 reais e você tem 10, quanto sobra?”']),clinical_use:'Rastreio funcional autoral de leitura, escrita e aritmética por idade, com observação clínica integrada.',differentiator:'Organiza leitura, escrita, aritmética e comportamento durante a tarefa em escore funcional.',not_normative_disclaimer:'Instrumento autoral complementar; não é versão oficial ou substituto normativo de teste comercial.'
},
{
 id:'jf-columbia-nordestina-triagem',title:'🛟 Columbia Nordestina — Triagem de ideação e comportamento suicida',short_title:'Columbia Nordestina — Triagem',emoji:'🛟',audience:'clinico',audience_label:'Clínico',age_band:'crianças, adolescentes e adultos',age_min_months:72,age_max_months:960,domain:'Risco suicida',symptoms:['ideação passiva','ideação ativa','plano','intenção','comportamento suicida'],complaints:['não quer viver','se machuca','suicídio','sumir','morrer'],priority:989,featured_rank:7,featured_label:'Escala prioritária',source_document:'Columbia Nordestina',plain_questions:q(['Você já ficou com vontade de sumir, não acordar ou desaparecer?','Você já pensou em se matar ou tirar a própria vida, mesmo sem saber como?','Você já pensou em algum jeito específico de fazer isso?','Você chegou a pensar que poderia realmente fazer?','Você preparou algo, tentou ou chegou perto de tentar?','Esses pensamentos acontecem com que frequência?','Quanto é difícil controlar esses pensamentos quando aparecem?','Existe algo ou alguém que impede você de fazer isso?','Há acesso a meios de risco em casa ou no ambiente?','Qual adulto pode ser acionado imediatamente se o risco aumentar?']),direct_tasks:t(['Aplicar perguntas em ordem crescente, sem pular etapas.','Se itens iniciais forem negativos, ainda investigar comportamento preparatório quando houver suspeita.','Mapear nível mais grave presente.','Registrar frequência, duração, controle, motivo e fatores protetivos.','Avaliar acesso a meios de risco e supervisão familiar.','Definir plano imediato de segurança se qualquer item de risco for positivo.','Documentar linguagem usada pelo paciente, não apenas interpretação do avaliador.','Encaminhar urgência quando houver plano, intenção, tentativa, intoxicação ou falta de proteção.']),clinical_use:'Triagem clínica de risco suicida com linguagem acessível, mantendo lógica de gravidade e segurança.',differentiator:'Adaptação linguística cultural para facilitar comunicação com crianças, adolescentes e famílias do interior.',not_normative_disclaimer:'Instrumento clínico adaptado; não substitui C-SSRS original, validação psicométrica ou julgamento clínico.'
},
{
 id:'jf-icad-nordeste',title:'🚽 ICAD-Nordeste — Autonomia e desenvolvimento adaptativo',short_title:'ICAD-Nordeste',emoji:'🚽',audience:'familia',audience_label:'Família/Escola/Clínico',age_band:'12 meses–17 anos',age_min_months:12,age_max_months:215,domain:'Autonomia adaptativa',symptoms:['comunicação funcional','autocuidado','rotina','socialização','segurança','escola','autorregulação'],complaints:['autonomia','banheiro','higiene','segurança','vida diária','dependência'],priority:988,featured_rank:8,featured_label:'Escala prioritária',source_document:'ICAD-Nordeste',plain_questions:q(['A criança usa comunicação funcional para pedir, negar, relatar e compreender?','Realiza alimentação, higiene, banho, vestir e banheiro com ajuda compatível?','Participa da rotina doméstica e aceita transições simples?','Brinca, socializa e participa de grupos conforme esperado?','Reconhece perigos, estranhos, privacidade e situações de risco?','Participa da escola e usa habilidades acadêmicas de modo funcional?','Tolera frustração, espera e mudanças com mediação adequada?','A habilidade ocorre só em casa ou também generaliza para escola e comunidade?','Quais são as principais forças adaptativas?','Quais metas de 3 a 6 meses são mais importantes?']),direct_tasks:t(['Pedir uma solicitação funcional: água, banheiro, ajuda ou pausa.','Simular rotina: pegar material, guardar objeto e seguir instrução simples.','Observar higiene/AVD por relato: lavar mãos, escovar dentes, vestir peça simples.','Testar sequência: acordar, comer, escola, banho e dormir.','Perguntar o que fazer se se perder, se um estranho chamar ou se sentir dor.','Observar espera breve e recuperação após frustração leve.','Listar 3 forças adaptativas e 3 fragilidades funcionais.','Definir metas práticas de autonomia para 3–6 meses.']),clinical_use:'Inventário clínico autoral para funcionamento adaptativo real em casa, escola e comunidade.',differentiator:'Foca vida real: comunicação, autocuidado, rotina, socialização, segurança, escola e autorregulação.',not_normative_disclaimer:'Instrumento autoral complementar; não deve ser anunciado como substituto de Vineland, ABAS ou avaliação formal.'
},
{
 id:'jf-denver-nordestino',title:'👶 Denver II Nordestino — Desenvolvimento infantil 0–4 anos',short_title:'Denver II Nordestino',emoji:'👶',audience:'clinico',audience_label:'Clínico/Família',age_band:'0–4 anos',age_min_months:0,age_max_months:59,domain:'Desenvolvimento infantil',symptoms:['pessoal-social','motor fino','linguagem','motor grosso','marcos'],complaints:['atraso desenvolvimento','denver','marcos','não anda','não fala'],priority:987,featured_rank:9,featured_label:'Escala prioritária',source_document:'Denver II Nordestino',plain_questions:q(['Os marcos pessoal-sociais estão compatíveis com a idade?','A criança imita, brinca, participa e se separa do cuidador conforme esperado?','O motor fino-adaptativo está compatível com idade?','A linguagem receptiva e expressiva está compatível com idade?','O motor grosso está compatível com idade e prematuridade corrigida?','Há falha em itens esperados para a linha de idade?','Há itens não observados por falta de oportunidade?','A família percebe regressão ou perda de marco?','Há discrepância importante entre domínios?','Quais domínios exigem intervenção ou investigação prioritária?']),direct_tasks:t(['Pessoal-social: observar sorriso, imitação, brincar, separação e participação.','Motor fino: entregar cubos, lápis ou objeto pequeno e observar preensão/adaptação.','Linguagem: chamar pelo nome, pedir apontar, nomear e repetir sons/palavras.','Motor grosso: observar controle cefálico, sentar, engatinhar, levantar, andar ou correr conforme idade.','Registrar P, F, não observado ou sem oportunidade.','Corrigir idade para prematuridade quando aplicável.','Identificar domínio com maior defasagem.','Gerar orientação de estimulação e necessidade de reavaliação.']),clinical_use:'Triagem autoral de desenvolvimento infantil por domínios, com linguagem visual e foco em marcos.',differentiator:'Organiza pessoal-social, motor fino-adaptativo, linguagem e motor grosso com linha de idade.',not_normative_disclaimer:'Versão autoral de triagem; não substitui teste padronizado original, avaliação clínica ou acompanhamento longitudinal.'
},
{
 id:'jf-columbia-nordestina-monitoramento',title:'⚠️ Columbia Nordestina — Monitoramento longitudinal de segurança',short_title:'Columbia Nordestina — Monitoramento',emoji:'⚠️',audience:'clinico',audience_label:'Clínico/Seguimento',age_band:'crianças, adolescentes e adultos',age_min_months:72,age_max_months:960,domain:'Segurança emocional',symptoms:['intensidade','frequência','controle','fator protetor','plano de segurança'],complaints:['risco','autoagressão','morrer','sumir','monitorar segurança'],priority:986,featured_rank:10,featured_label:'Escala prioritária',source_document:'Columbia Nordestina duplicada/seguimento',plain_questions:q(['Desde a última avaliação, os pensamentos de sumir ou morrer voltaram?','A frequência aumentou, reduziu ou permaneceu igual?','A duração dos pensamentos mudou?','O controle sobre os pensamentos melhorou ou piorou?','Houve nova autoagressão, preparo ou tentativa?','O paciente consegue procurar ajuda antes de agir?','Os fatores protetivos continuam presentes?','A família removeu ou reduziu acesso a meios de risco?','A escola ou responsáveis foram orientados quando necessário?','O plano de segurança precisa ser atualizado hoje?']),direct_tasks:t(['Comparar risco atual com avaliação anterior.','Registrar maior nível de gravidade desde o último contato.','Atualizar plano de segurança com nomes e telefones de adultos protetores.','Checar acesso a meios de risco.','Definir intervalo de retorno ou encaminhamento urgente.','Registrar orientação dada à família.','Copiar resumo objetivo para prontuário.','Se risco atual for alto, interromper rotina e priorizar manejo de segurança.']),clinical_use:'Módulo de seguimento para monitorar risco, proteção e plano de segurança em pacientes já triados.',differentiator:'Transforma a segunda cópia do material em módulo operacional de acompanhamento, evitando duplicidade inútil.',not_normative_disclaimer:'Instrumento clínico adaptado de acompanhamento; não substitui avaliação de risco em urgência ou instrumento oficial.'
}
];
const ids=new Set(base.map(x=>x&&x.id));
window.NEUROPED_EDITORIAL_SCALES=featured.filter(x=>!ids.has(x.id)).concat(base);
window.NEUROPED_FEATURED10=featured;
})();

/* ===== scales-priority-uploaded.js ===== */
(function(){
'use strict';
if(window.NEUROPED_PRIORITY_UPLOADS_LOADED)return;window.NEUROPED_PRIORITY_UPLOADS_LOADED=true;
const base=Array.isArray(window.NEUROPED_EDITORIAL_SCALES)?window.NEUROPED_EDITORIAL_SCALES:[];
const existingExtra=Array.isArray(window.NEUROPED_FEATURED_EXTRA)?window.NEUROPED_FEATURED_EXTRA:[];
function q(a){return a}function t(a){return a}
const priority=[
{
 id:'jf-epa-dj-superneuroped-v3-precision95',title:'🌟 EPA-DJ SuperNeuroPed v3.0 Precision-95 — Autismo por camadas',short_title:'EPA-DJ v3.0 Precision-95',emoji:'🌟',audience:'clinico',audience_label:'Clínico/Família/Escola/Terapias',age_band:'12 meses–17 anos',age_min_months:12,age_max_months:215,domain:'TEA Precision-95',symptoms:['TEA','autismo','multiambiente','fenótipo feminino','diferenciais','vídeo natural','reteste'],complaints:['autismo','tea','não responde nome','rigidez','feminino','camuflagem','zona cinzenta'],priority:1000,featured_rank:0,featured_label:'Escala prioritária importada',source_document:'EPA-DJ SuperNeuroPed v3.0 Precision-95',plain_questions:q(['Há prejuízo persistente de reciprocidade social, comunicação funcional ou atenção compartilhada?','Os sinais aparecem em mais de um ambiente: casa, escola, terapias, consulta ou vídeos naturais?','O perfil inclui rigidez, interesses restritos, repetição ou resposta sensorial incomum?','Há subscore sentinela forte, com sinais mais específicos de TEA?','Existem diferenciais críticos que podem explicar o quadro, como TDL, DI, TDAH, ansiedade, privação, audição ou epilepsia?','O fenótipo feminino foi investigado: camuflagem, mimetismo, exaustão social e discrepância casa-escola-consulta?','O caso é robusto ou está em zona cinzenta, exigindo reteste longitudinal?','Há vídeo natural domiciliar ou escolar que confirme comportamento espontâneo?','O escore total combina com impacto funcional real e necessidade de suporte?','A decisão final respeita três saídas: baixo risco robusto, TEA provável robusto ou zona cinzenta?']),direct_tasks:t(['Aplicar entrevista familiar estruturada com história longitudinal, regressão, sensorialidade e impacto.','Realizar estações práticas: atenção conjunta, imitação, brincar simbólico, reciprocidade, agência social e empatia.','Coletar confirmação multiambiente: casa, escola, terapias, consulta e vídeos naturais.','Aplicar travas diferenciais antes de fechar classificação.','Investigar fenótipo feminino: camuflagem, esforço social, interesses socialmente aceitos e colapso pós-escola.','Solicitar vídeo natural curto de brincadeira, refeição, rotina ou interação com pares quando houver dúvida.','Classificar confiança: baixa, parcial, moderada ou alta convergência.','Reaplicar em 8–12 semanas se zona cinzenta ou baixa convergência.']),clinical_use:'Arquitetura autoral em camadas para rastreio estruturado, estratificação de risco e organização observacional do TEA, com controle de diferenciais e zona cinzenta.',differentiator:'Não depende de escore único; combina entrevista, estações práticas, multiambiente, diferenciais, fenótipo feminino, vídeo natural e estabilidade longitudinal.',not_normative_disclaimer:'Instrumento autoral em pré-validação. Não substitui diagnóstico médico, validação psicométrica formal ou avaliação individualizada.'
},
{
 id:'jf-tdl-aprendizagem-ate8-importada',title:'🗣️ TDL e Aprendizagem Escolar até 8 anos — Versão prioritária importada',short_title:'TDL e Aprendizagem até 8 anos',emoji:'🗣️',audience:'familia',audience_label:'Família/Escola/Terapias',age_band:'0–8 anos',age_min_months:0,age_max_months:107,domain:'TDL e aprendizagem',symptoms:['linguagem oral','consciência fonológica','leitura inicial','escrita','aritmética','impacto'],complaints:['TDL','atraso de fala','dificuldade de leitura','escrita','aritmética','alfabetização'],priority:999,featured_rank:1,featured_label:'Escala prioritária importada',source_document:'Escala Dr. Jadson TDL e Aprendizagem Escolar',plain_questions:q(['Demorou para começar a falar palavras ou frases?','Usa frases curtas demais para a idade?','Tem dificuldade para contar o que aconteceu no dia?','Troca palavras ou usa termos vagos como “isso”, “coisa” ou “aquele”?','Tem dificuldade para entender comandos com duas ou mais etapas?','Tem dificuldade para reconhecer rimas ou separar sílabas?','Confunde letras visualmente parecidas ou sons parecidos?','Lê de forma lenta, adivinha palavras ou não compreende o que leu?','Apresenta dificuldade para copiar, ditar ou escrever palavras simples?','O prejuízo impacta escola, autoestima, família ou participação social?']),direct_tasks:t(['Nomeação: copo, bola, casa, mão, gato e sapato.','Compreensão: “pegue o lápis e coloque embaixo do papel”.','Repetição: “O menino pegou a bola azul”.','Consciência fonológica: bater palmas para ca-sa, bo-la, ja-ne-la.','Rima: perguntar o que rima com pão: mão, bola ou casa.','Ditado: casa, bola, pato, janela, escola.','Frase para escrever: “A menina gosta de brincar.”','Interpretação curta: “Lia viu um sapo no jardim.” Perguntar quem viu e onde estava.']),clinical_use:'Triagem clínico-escolar para suspeita de TDL, dificuldades de linguagem, alfabetização, escrita, aritmética inicial e impacto funcional.',differentiator:'Integra linguagem oral, pré-leitura, leitura inicial, escrita, aritmética e impacto funcional com peso clínico para prejuízo real.',not_normative_disclaimer:'Instrumento autoral de triagem. Não substitui avaliação médica, fonoaudiológica, neuropsicológica ou psicopedagógica formal.'
},
{
 id:'jf-einp-tdah-tod-6-12-importada',title:'⚡ EINP-TDAH/TOD 6–12 — Versão prioritária importada',short_title:'EINP-TDAH/TOD 6–12',emoji:'⚡',audience:'escola',audience_label:'Teste escolar',age_band:'6–12 anos',age_min_months:72,age_max_months:155,domain:'TDAH/TOD escolar',symptoms:['desatenção','hiperatividade','impulsividade','oposição','aprendizagem','impacto','fatores positivos'],complaints:['TDAH','TOD','agitação','desatenção','não termina tarefa','oposição'],priority:998,featured_rank:2,featured_label:'Escala prioritária importada',source_document:'EINP-TDAH/TOD 6-12',plain_questions:q(['Tem dificuldade para começar atividade quando a professora explica para a turma toda?','Precisa que a instrução seja repetida várias vezes?','Começa a atividade, mas logo se perde, para ou muda de assunto?','Esquece materiais, tarefas, recados ou combinados escolares?','Levanta-se da cadeira quando deveria permanecer sentado?','Fala fora de hora, interrompe explicações ou responde antes de ser chamado?','Tem dificuldade para esperar sua vez em fila, jogo, roda ou atividade em grupo?','Questiona regras simples de forma repetitiva ou desafiadora?','O comportamento atrapalha aprendizagem, convivência ou vínculo com a escola?','Quais pontos positivos devem ser usados como proteção no plano?']),direct_tasks:t(['Atenção auditiva: bater na mesa quando ouvir “bola” na sequência sol, bola, peixe, bola, casa.','Inibição: quando eu disser dia, responda noite; quando disser noite, responda dia.','Memória de trabalho: repetir 4-8-2 e depois 7-1-9-3 conforme idade.','Sequência escolar: desenhar círculo, escrever nome e fazer um risco embaixo.','Planejamento: listar três passos para organizar a mochila.','Leitura curta com perguntas para observar atenção sustentada.','Jogo de turnos com regra simples para observar espera e impulsividade.','Registrar resposta a instrução curta, pista visual e reforço positivo.']),clinical_use:'Triagem escolar autoral para organizar desatenção, hiperatividade/impulsividade, oposição, aprendizagem, impacto funcional negativo e fatores positivos.',differentiator:'Inclui bloco de impacto funcional e fatores positivos de proteção para evitar leitura apenas deficitária.',not_normative_disclaimer:'Instrumento autoral de triagem clínico-pedagógica. Não substitui diagnóstico clínico nem instrumento psicométrico validado.'
},
{
 id:'jf-protocolo-exames-tea-tdah-farmacogenetica-importada',title:'🧪 Protocolo de Exames TEA/TDAH/Farmacogenética — Versão prioritária importada',short_title:'Protocolo Exames TEA/TDAH',emoji:'🧪',audience:'clinico',audience_label:'Clínico',age_band:'0–17 anos',age_min_months:0,age_max_months:215,domain:'Exames complementares',symptoms:['TEA','TDAH','audição','visão','genética','EEG','RM','farmacogenética'],complaints:['exames','farmacogenética','genética','EEG','ressonância','audição'],priority:997,featured_rank:3,featured_label:'Protocolo prioritário importado',source_document:'Protocolo de Exames Complementares TEA/TDAH/Farmacogenética',plain_questions:q(['O exame solicitado responde a uma pergunta clínica que pode mudar conduta?','Há atraso global, deficiência intelectual, epilepsia, regressão, dismorfismos ou história familiar forte?','Há atraso de fala, baixa resposta ao nome, otites ou suspeita auditiva?','Há sinais visuais objetivos como estrabismo, tropeços, aproximação excessiva ou baixa visão?','Há crise, olhar parado, perda de contato, automatismos ou confusão pós-evento?','Há indicação concreta para genética por atraso global, DI, epilepsia, regressão ou fenótipo sindrômico?','A farmacogenética pode mudar segurança, escolha ou tolerabilidade medicamentosa?','O exame foi classificado como verde, amarelo ou vermelho?','A justificativa clínica foi registrada?','Foi explicado à família que exames não confirmam nem excluem isoladamente TEA/TDAH?']),direct_tasks:t(['Definir a pergunta clínica antes de pedir qualquer exame.','Classificar cada exame em semáforo: verde, amarelo ou vermelho.','Checar audição/visão em atraso de fala ou baixa resposta ao chamado.','Priorizar genética quando houver TEA + atraso global/DI, epilepsia, regressão ou sinais sindrômicos.','Solicitar EEG quando houver crise, evento paroxístico ou regressão, não como rotina para TEA.','Evitar pacote universal de exames sem impacto esperado.','Gerar frase para laudo justificando cada exame.','Gerar frase simples para a família explicando o motivo.']),clinical_use:'Organiza decisão prudente e defensável sobre exames em TEA, TDAH e farmacogenética.',differentiator:'Usa pergunta clínica, semáforo prático e foco em segurança, prognóstico e mudança de conduta.',not_normative_disclaimer:'Protocolo técnico de apoio. Não substitui julgamento clínico, exame neurológico ou discussão individualizada com a família.'
},
{
 id:'jf-einp-tdah-tod-12mais-importada',title:'⚡ EINP-TDAH/TOD 12+ — Versão prioritária importada',short_title:'EINP-TDAH/TOD 12+',emoji:'⚡',audience:'escola',audience_label:'Teste escolar/adolescente',age_band:'12–17+ anos',age_min_months:144,age_max_months:960,domain:'TDAH/TOD adolescente',symptoms:['desatenção','função executiva','oposição','impacto funcional','fatores positivos'],complaints:['tdah adolescente','tod','não estuda','desorganização','oposição'],priority:996,featured_rank:4,featured_label:'Escala prioritária importada',source_document:'EINP-TDAH/TOD 12+',plain_questions:q(['Tem dificuldade para manter atenção em aulas longas, leitura ou atividades de esforço mental?','Começa tarefas, mas perde o fio, abandona etapas ou precisa ser chamado para retomar?','Comete erros por descuido, pressa ou falta de revisão?','Tem dificuldade para organizar agenda, prazos, material, provas e responsabilidades?','Esquece recados, datas de entrega ou compromissos escolares?','Mostra inquietação corporal, fala excessiva ou impulsividade em sala e redes sociais?','Questiona regras, limites ou orientações de forma irônica ou desafiadora?','O impacto funcional em estudo, rotina, convivência ou autonomia é claro?','Há fatores positivos de proteção, como esforço, vínculo, colaboração ou talento específico?','O escore de impacto pesa mais que sintomas isolados?']),direct_tasks:t(['Organizar uma semana de provas e tarefas em três prioridades.','Leitura curta com pergunta inferencial para observar atenção sustentada.','Tarefa de inibição dia/noite com aumento progressivo de velocidade.','Memória operacional: repetir números e reorganizar sequência simples.','Planejamento: listar passos para estudar para uma prova difícil.','Autorrelato: o que mais atrapalha seus estudos hoje?','Comparar relato do adolescente com professor/família.','Registrar fatores positivos de proteção e motivação.']),clinical_use:'Triagem clínico-pedagógica para adolescentes com sinais de TDAH/TOD, impacto funcional e fatores positivos.',differentiator:'Bloco de impacto pesa mais e fatores positivos subtraem pontos por representarem proteção.',not_normative_disclaimer:'Instrumento autoral de triagem. Não substitui avaliação médica, psicológica, neuropsicológica ou psicopedagógica.'
},
{
 id:'jf-enf-tea-drj-importada',title:'🧩 ENF-TEA-DRJ — Nivelamento funcional do TEA por idade importado',short_title:'ENF-TEA-DRJ',emoji:'🧩',audience:'clinico',audience_label:'Clínico/Família',age_band:'12 meses–17 anos',age_min_months:12,age_max_months:215,domain:'TEA nível de suporte',symptoms:['comunicação social','reciprocidade','restrição','sensorialidade','impacto funcional','suporte'],complaints:['nível tea','autismo','suporte','terapia','funcionalidade'],priority:995,featured_rank:5,featured_label:'Escala prioritária importada',source_document:'ENF-TEA-DRJ',plain_questions:q(['A comunicação social e reciprocidade estão compatíveis com a idade?','A criança compartilha interesses, gestos, olhar e atenção?','Há dificuldade de conversa, brincadeira social ou leitura de contexto?','Há rigidez, repetição, interesses restritos ou resposta sensorial clinicamente relevante?','O impacto funcional exige suporte eventual, regular ou muito substancial?','Há prejuízo em autonomia, família, escola ou segurança?','O pior eixo funcional foi considerado, mesmo se o escore total parecer menor?','Há ausência de linguagem funcional após 36 meses, perda de habilidade, fuga ou autoagressão?','A faixa etária aplicada corresponde à idade real?','O resultado foi integrado à história clínica, escola, terapias e observação direta?']),direct_tasks:t(['Escolher faixa etária: 12–23m, 24–35m, 3–5a, 6–8a, 9–12a ou 13–17a.','Observar atenção compartilhada com objeto/figura interessante.','Testar brincadeira simbólica ou social conforme idade.','Observar reciprocidade, turnos, pedidos e reparo social.','Testar pequena mudança de regra para avaliar flexibilidade.','Registrar resposta a barulho, toque, luz, textura ou transição.','Listar necessidade de suporte em casa, escola e comunidade.','Classificar nível provável apenas se clinicamente compatível.']),clinical_use:'Estimativa estruturada de necessidade provável de suporte no TEA por faixa etária.',differentiator:'Valoriza comunicação social, restrição/sensorialidade e impacto funcional, com regra de elevação clínica.',not_normative_disclaimer:'Instrumento autoral de apoio clínico. Não substitui avaliação diagnóstica individualizada.'
},
{
 id:'jf-enso-ped-jf-importada',title:'😴 ENSO-Ped Nordeste JF — Sono pediátrico prioritário',short_title:'ENSO-Ped Nordeste JF',emoji:'😴',audience:'familia',audience_label:'Teste familiar',age_band:'2–17 anos',age_min_months:24,age_max_months:215,domain:'Sono pediátrico',symptoms:['sono','rotina','despertares','ronco','parassonias','impacto diurno'],complaints:['dorme mal','ronca','acorda','sono agitado','sonolência'],priority:994,featured_rank:6,featured_label:'Escala prioritária importada',source_document:'ENSO-Ped Nordeste JF',plain_questions:q(['Demora mais de 30 minutos para pegar no sono?','Faz resistência para ir dormir, enrola, pede várias coisas ou chora?','Acorda durante a noite e demora para voltar a dormir?','Tem sono picado, inquieto ou sem descanso verdadeiro?','Dorme menos horas do que parece precisar para acordar bem?','Ronca alto, prende a respiração, engasga ou dorme de boca aberta?','Tem pesadelos, terror noturno, sonambulismo ou movimentos durante o sono?','O sono piora atenção, humor, hiperatividade, linguagem ou aprendizagem?','O bloco de ronco/respiração sugere alerta mesmo com escore total baixo?','Há suspeita de crise noturna ou evento neurológico durante o sono?']),direct_tasks:t(['Montar linha do tempo: jantar, tela, banho, cama, sono, despertares e acordar.','Registrar 7 dias de horário de dormir, despertares, ronco e sonolência.','Perguntar à criança/adolescente: “o que atrapalha seu sono?” quando possível.','Checar sinais respiratórios: ronco, boca aberta, pausas, suor, sono inquieto.','Relacionar sono com atenção, humor, hiperatividade e escola.','Orientar vídeo seguro de evento noturno quando houver suspeita de crise.','Classificar prioridade: rotina, respiratório, parassonia, neurológico ou comportamento.','Gerar plano inicial de higiene do sono e investigação quando indicada.']),clinical_use:'Triagem clínica e organização da anamnese do sono pediátrico de 2 a 17 anos.',differentiator:'Blocos respiratório e impacto diurno têm maior peso clínico para não subestimar risco.',not_normative_disclaimer:'Instrumento autoral de triagem e acompanhamento. Não substitui consulta, exame físico ou exames quando indicados.'
}
];
const ids=new Set(base.map(x=>x&&x.id));
const clean=priority.filter(x=>!ids.has(x.id));
window.NEUROPED_PRIORITY_UPLOADS=priority;
window.NEUROPED_FEATURED_EXTRA=priority.concat(existingExtra.filter(x=>!new Set(priority.map(p=>p.id)).has(x.id)));
window.NEUROPED_EDITORIAL_SCALES=clean.concat(base);
})();

/* ===== scales-diarios-uteis.js ===== */
/* NeuroPed EDJ — Diários de controle, testes diretos e ferramentas úteis gratuitas.
   Conteúdo educacional autoral, anexado ao catálogo (NEUROPED_EDITORIAL_SCALES).
   Tipos que faltavam: diários diários (monitoração), testes diretos rápidos,
   inventários e ferramentas práticas — todos gratuitos. Não substituem
   avaliação profissional nem instrumentos normatizados. */
(function () {
  'use strict';
  if (window.NEUROPED_DIARIOS_UTEIS_LOADED) return;
  window.NEUROPED_DIARIOS_UTEIS_LOADED = true;

  var AUD = { familia:'Teste familiar', escola:'Teste escolar', autoteste:'Autoteste', terapeuta:'Terapias/equipe', clinico:'Clínico' };
  var DISC = 'Instrumento autoral/operacional de apoio (gratuito); não substitui avaliação clínica nem instrumento normatizado.';

  function mk(o){
    return {
      id: o.id, title: o.title, short_title: o.short || o.title, original_title: o.title,
      emoji: o.emoji || '📝', audience: o.aud || 'familia', audience_label: AUD[o.aud || 'familia'],
      age_band: o.band || '0–17 anos', age_min_months: o.min == null ? 0 : o.min, age_max_months: o.max == null ? 215 : o.max,
      symptoms: o.sym || [], complaints: o.compl || [],
      keywords: (o.sym || []).concat(o.compl || [], o.kw || [], [o.kind || '', o.domain || '']),
      domain: o.domain || 'Apoio clínico', kind: o.kind || 'ferramenta', daily: !!o.daily,
      page: 'instrumento.html', anchor: 'util-' + o.id, priority: o.pri || 120,
      plain_questions: o.q || [], direct_tasks: o.t || [],
      clinical_use: o.use || '', differentiator: o.diff || 'Ferramenta gratuita de organização e monitoração, em linguagem simples.',
      not_normative_disclaimer: DISC
    };
  }

  var DATA = [
    /* ===================== DIÁRIOS DE CONTROLE (diários) ===================== */
    mk({ id:'diario-sono', emoji:'😴', title:'Diário do Sono (controle diário)', short:'Diário do Sono', aud:'familia', band:'0–17 anos', kind:'diário', daily:true, domain:'Sono', pri:160,
      sym:['insônia','demora pra dormir','acorda à noite','ronco'], compl:['sono','melatonina','pesadelo','despertar'], kw:['diário do sono','registro de sono','higiene do sono'],
      q:['A que horas deitou e a que horas dormiu de fato (latência)?','Quantas vezes acordou durante a noite?','A que horas acordou de manhã?','Roncou, fez pausas ou respirou pela boca?','Cochilou durante o dia? Por quanto tempo?','Usou tela na última hora antes de deitar?','Tomou alguma medicação para dormir? Qual e que horas?','Como acordou: descansado ou cansado/irritado?'],
      use:'Monitorização diária do sono por 7–14 dias para apoiar decisão sobre rotina, melatonina e investigação de SAOS.' }),
    mk({ id:'diario-humor', emoji:'🌦️', title:'Diário de Humor e Irritabilidade', short:'Diário de Humor', aud:'familia', band:'4–17 anos', min:48, kind:'diário', daily:true, domain:'Humor', pri:158,
      sym:['irritabilidade','choro','explosões','tristeza'], compl:['humor','raiva','depressão','bipolar'], kw:['diário de humor','registro de irritabilidade'],
      q:['Humor predominante do dia (0 péssimo a 10 ótimo)?','Houve explosão de raiva ou choro intenso? Quantas vezes?','O que veio antes (gatilho)?','Quanto tempo durou e como passou?','Houve momento de alegria/tranquilidade?','Dormiu e se alimentou bem hoje?','Tomou medicação? Qual e horário?'],
      use:'Acompanha oscilação de humor e irritabilidade no tempo, útil antes/depois de ajustes de conduta ou medicação.' }),
    mk({ id:'diario-crises', emoji:'⚡', title:'Diário de Crises Epilépticas', short:'Diário de Crises', aud:'familia', band:'0–17 anos', kind:'diário', daily:true, domain:'Epilepsia', pri:170,
      sym:['convulsão','crise','olhar parado','abalos'], compl:['epilepsia','crise','convulsão','eeg'], kw:['diário de crises','registro de convulsão'],
      q:['Data e horário da crise?','Tipo: abalos, rigidez, olhar parado, queda, automatismos?','Duração aproximada (segundos/minutos)?','Houve perda de consciência?','Gatilho possível: febre, sono ruim, esqueceu remédio, luz, estresse?','Como ficou depois (pós-ictal): sonolento, confuso, dor de cabeça?','Precisou de medicação de resgate? Qual?'],
      use:'Registro objetivo de crises para classificação, ajuste de antiepiléptico e decisão sobre exames.' }),
    mk({ id:'diario-cefaleia', emoji:'🤕', title:'Diário de Cefaleia / Dor de Cabeça', short:'Diário de Cefaleia', aud:'familia', band:'5–17 anos', min:60, kind:'diário', daily:true, domain:'Dor e cefaleia', pri:150,
      sym:['dor de cabeça','enxaqueca','náusea'], compl:['cefaleia','enxaqueca','dor'], kw:['diário de cefaleia','registro de enxaqueca'],
      q:['Teve dor de cabeça hoje? Que horas começou?','Intensidade de 0 a 10?','Onde doeu e como era (latejante, aperto)?','Veio acompanhada de náusea, luz ou som incomodando?','Possível gatilho: jejum, sono, tela, calor, estresse?','O que aliviou (repouso, analgésico)? Que horas?','Faltou à escola ou parou atividades por causa da dor?'],
      use:'Caracteriza padrão, frequência e gatilhos da cefaleia; base para decisão sobre profilaxia.' }),
    mk({ id:'diario-comportamento-abc', emoji:'🧩', title:'Diário de Comportamento (modelo A-B-C)', short:'Diário A-B-C', aud:'familia', band:'2–17 anos', min:24, kind:'diário', daily:true, domain:'Comportamento', pri:156,
      sym:['birra','agressividade','autoagressão','oposição'], compl:['comportamento','birra','crise','tea','tdah'], kw:['abc','antecedente comportamento consequência','análise funcional'],
      q:['ANTECEDENTE: o que aconteceu logo antes do comportamento?','COMPORTAMENTO: o que a criança fez exatamente?','CONSEQUÊNCIA: o que aconteceu logo depois (como os adultos reagiram)?','Onde e com quem ocorreu?','Quanto tempo durou e qual a intensidade?','O que parecia querer evitar ou conseguir?'],
      use:'Mapeia a função do comportamento (A-B-C) para um plano comportamental individualizado.' }),
    mk({ id:'diario-alimentar', emoji:'🍽️', title:'Diário Alimentar e de Seletividade', short:'Diário Alimentar', aud:'familia', band:'0–17 anos', kind:'diário', daily:true, domain:'Alimentação', pri:148,
      sym:['seletividade','recusa alimentar','engasgo'], compl:['alimentação','seletividade','arfid','nutrição'], kw:['diário alimentar','registro de refeições'],
      q:['O que foi oferecido em cada refeição?','O que aceitou e o que recusou?','Texturas/temperaturas recusadas?','Quanto tempo durou a refeição e como foi o clima?','Houve engasgo, ânsia ou vômito?','Comeu sozinho ou com ajuda?'],
      use:'Acompanha repertório aceito, recusas e padrão sensorial alimentar ao longo dos dias.' }),
    mk({ id:'diario-medicacao', emoji:'💊', title:'Diário de Efeitos da Medicação', short:'Diário de Medicação', aud:'familia', band:'2–17 anos', min:24, kind:'diário', daily:true, domain:'Monitorização de medicação', pri:162,
      sym:['efeito colateral','perda de apetite','sonolência'], compl:['medicação','metilfenidato','risperidona','efeito colateral'], kw:['diário de medicação','monitoração de efeitos'],
      q:['Qual medicação e dose hoje? Horário(s)?','Tomou conforme prescrito? Esqueceu alguma dose?','Apetite hoje (pior/igual/melhor)?','Sono hoje (pior/igual/melhor)?','Humor e irritabilidade?','Algum efeito novo (tique, dor, náusea, tontura)?','Efeito desejado apareceu (atenção, calma)? Quanto tempo durou?'],
      use:'Monitora resposta e efeitos adversos para ajuste fino de dose pelo médico assistente.' }),
    mk({ id:'diario-tela', emoji:'📱', title:'Diário de Tempo de Tela', short:'Diário de Tela', aud:'familia', band:'2–17 anos', min:24, kind:'diário', daily:true, domain:'Saúde digital', pri:138,
      sym:['uso excessivo de tela','irritação ao tirar a tela'], compl:['tela','celular','digital','sono'], kw:['diário de tela','uso de telas'],
      q:['Quanto tempo total de tela hoje?','Em que momentos (refeição, antes de dormir)?','Como reagiu quando a tela foi retirada?','Trocou brincadeira/atividade física por tela?','Usou tela na última hora antes de dormir?'],
      use:'Dimensiona uso de telas e impacto em sono, humor e atividade — base para combinados familiares.' }),
    mk({ id:'diario-enurese', emoji:'💧', title:'Diário de Enurese (xixi noturno)', short:'Diário de Enurese', aud:'familia', band:'5–14 anos', min:60, max:168, kind:'diário', daily:true, domain:'Enurese', pri:140,
      sym:['xixi na cama','enurese'], compl:['enurese','xixi noturno','bexiga'], kw:['diário de enurese','registro de xixi'],
      q:['A cama amanheceu seca ou molhada?','Quantas vezes urinou na cama?','Quanto líquido bebeu após o jantar?','Foi ao banheiro antes de deitar?','Acordou sozinho para urinar?','Houve constipação (intestino preso)?'],
      use:'Acompanha noites secas/molhadas e fatores associados; base para alarme e conduta.' }),
    mk({ id:'diario-intestinal', emoji:'🚽', title:'Diário Intestinal (constipação)', short:'Diário Intestinal', aud:'familia', band:'0–17 anos', kind:'diário', daily:true, domain:'Gastrointestinal', pri:130,
      sym:['constipação','intestino preso','dor para evacuar'], compl:['constipação','evacuação','encoprese'], kw:['diário intestinal','registro de evacuação','escala de bristol'],
      q:['Evacuou hoje? Quantas vezes?','Consistência (duro em bolinhas / normal / pastoso / líquido)?','Houve dor, sangue ou esforço?','Escapes nas roupas (sujou a calcinha)?','Comeu fibras e bebeu água?'],
      use:'Monitora trânsito intestinal e escapes; apoia manejo de constipação e encoprese.' }),
    mk({ id:'diario-tiques', emoji:'😬', title:'Diário de Tiques', short:'Diário de Tiques', aud:'familia', band:'4–17 anos', min:48, kind:'diário', daily:true, domain:'Tiques/Tourette', pri:128,
      sym:['tique motor','tique vocal','piscar','pigarro'], compl:['tique','tourette'], kw:['diário de tiques'],
      q:['Quais tiques apareceram hoje (motores/vocais)?','Frequência (raros, frequentes, quase o tempo todo)?','Pioraram com estresse, cansaço ou tela?','Atrapalharam atividades ou geraram constrangimento?','Conseguiu segurar por um tempo?'],
      use:'Acompanha tipo, frequência e gatilhos dos tiques ao longo do tempo.' }),
    mk({ id:'diario-ansiedade', emoji:'😰', title:'Diário de Ansiedade', short:'Diário de Ansiedade', aud:'familia', band:'5–17 anos', min:60, kind:'diário', daily:true, domain:'Ansiedade', pri:136,
      sym:['medo','preocupação','dor de barriga','recusa escolar'], compl:['ansiedade','medo','pânico','escola'], kw:['diário de ansiedade'],
      q:['Houve episódio de ansiedade/medo hoje? Em que situação?','Intensidade de 0 a 10?','Sintomas no corpo (barriga, coração, falta de ar)?','O que ajudou a acalmar?','Evitou alguma coisa por medo (escola, dormir só)?'],
      use:'Registra situações, intensidade e estratégias que ajudam — base para psicoeducação e TCC.' }),
    mk({ id:'diario-dor', emoji:'🩹', title:'Diário de Dor (escala de faces 0–10)', short:'Diário de Dor', aud:'familia', band:'3–17 anos', min:36, kind:'diário', daily:true, domain:'Dor', pri:126,
      sym:['dor','dor abdominal','dor em membros'], compl:['dor','dor crônica'], kw:['diário de dor','escala de faces'],
      q:['Sentiu dor hoje? Onde?','Intensidade de 0 a 10 (escala de faces)?','Quando piora e quando melhora?','Atrapalhou sono, escola ou brincar?','O que aliviou?'],
      use:'Caracteriza dor recorrente e impacto funcional ao longo dos dias.' }),
    mk({ id:'diario-convulsao-febril', emoji:'🌡️', title:'Registro de Convulsão Febril', short:'Convulsão Febril', aud:'familia', band:'0–6 anos', min:0, max:72, kind:'diário', domain:'Epilepsia', pri:132,
      sym:['convulsão com febre','febre alta'], compl:['convulsão febril','febre'], kw:['convulsão febril','registro'],
      q:['Qual a temperatura no momento da crise?','Duração da convulsão?','Foi generalizada (corpo todo) ou de um lado?','Quanto tempo levou para recuperar a consciência?','Quantas crises nesse episódio febril?','História de convulsão febril na família?'],
      use:'Documenta convulsões febris para estratificar risco e orientar a família.' }),
    mk({ id:'diario-rotina', emoji:'🗓️', title:'Diário de Rotina e Transições', short:'Diário de Rotina', aud:'familia', band:'2–12 anos', min:24, max:144, kind:'diário', daily:true, domain:'Atenção/FE', pri:122,
      sym:['dificuldade em transições','desorganização'], compl:['rotina','transição','tea','tdah'], kw:['diário de rotina','transições'],
      q:['Quais transições foram difíceis hoje (acordar, sair, dormir)?','O que ajudou na transição (aviso, agenda visual)?','Cumpriu a rotina combinada?','Onde houve mais conflito?'],
      use:'Identifica pontos de atrito na rotina para estruturar previsibilidade e apoio visual.' }),

    /* ===================== TESTES DIRETOS (administração rápida) ===================== */
    mk({ id:'teste-span-digitos', q:['Repete sequências curtas (3–4) na ordem direta com dificuldade?','Falha ao aumentar para 5–6 dígitos?','Tem dificuldade marcada na ordem inversa?','Desempenho abaixo do esperado para a idade?'],  emoji:'🔢', title:'Teste Direto: Span de Dígitos (memória de trabalho)', short:'Span de Dígitos', aud:'clinico', band:'5–17 anos', min:60, kind:'teste direto', domain:'Atenção/FE', pri:155,
      sym:['esquece instruções','memória de trabalho'], compl:['memória','atenção','tdah','aprendizagem'], kw:['span de dígitos','memória de trabalho','digit span'],
      t:['Diga sequências de números em ritmo de 1 por segundo e peça para repetir na ordem (3-8-2 → ...).','Aumente 1 dígito a cada acerto: 4, 5, 6 dígitos.','Depois peça para repetir na ORDEM INVERSA (7-1-9 → 9-1-7).','Registre o maior span direto e inverso alcançado.','Compare com o esperado para a idade (orientativo).'],
      use:'Estimativa rápida e direta da memória de trabalho verbal, à beira do leito.' }),
    mk({ id:'teste-atencao-cancelamento', q:['Omite muitos alvos na folha?','Perde linhas ou pula trechos?','Desacelera/distrai ao longo da tarefa?','Marca não-alvos por impulsividade?'],  emoji:'🎯', title:'Teste Direto: Atenção Sustentada (cancelamento)', short:'Atenção/Cancelamento', aud:'clinico', band:'6–17 anos', min:72, kind:'teste direto', domain:'Atenção/FE', pri:150,
      sym:['desatenção','distrai fácil'], compl:['atenção','tdah','concentração'], kw:['teste de cancelamento','atenção sustentada'],
      t:['Apresente uma folha cheia de símbolos/letras e peça para marcar todos os alvos (ex.: todas as letras "A").','Marque o tempo total e conte acertos, omissões e erros.','Observe se desacelera, perde linhas ou se distrai ao longo da tarefa.','Registre desempenho inicial × final (queda = fadiga atencional).'],
      use:'Avalia atenção sustentada e seletiva de forma direta e observável.' }),
    mk({ id:'teste-dia-noite', q:['Erra dizendo a resposta automática (falha de inibição)?','Precisa de lembrete constante da regra?','Responde impulsivamente antes de pensar?','Piora quando o ritmo acelera?'],  emoji:'🌗', title:'Teste Direto: Inibição Dia/Noite', short:'Inibição Dia/Noite', aud:'clinico', band:'4–10 anos', min:48, max:131, kind:'teste direto', domain:'Atenção/FE', pri:146,
      sym:['impulsividade','responde antes da hora'], compl:['inibição','impulsividade','tdah','função executiva'], kw:['dia noite','controle inibitório','stroop infantil'],
      t:['Regra: ao ver SOL a criança diz "noite"; ao ver LUA diz "dia".','Faça 16 cartões alternados em ritmo constante.','Conte acertos e erros; observe autocorreção.','Erros frequentes sugerem fragilidade de controle inibitório.'],
      use:'Mede controle inibitório (tipo Stroop) de forma lúdica e direta.' }),
    mk({ id:'teste-nomeacao-rapida', q:['Nomeia a matriz lentamente?','Comete erros/autocorreções frequentes?','Trava ou hesita entre itens?','Velocidade abaixo do esperado para a idade?'],  emoji:'⏱️', title:'Teste Direto: Nomeação Rápida (RAN)', short:'Nomeação Rápida', aud:'clinico', band:'5–12 anos', min:60, max:144, kind:'teste direto', domain:'Linguagem', pri:148,
      sym:['lê devagar','troca letras'], compl:['dislexia','leitura','linguagem'], kw:['ran','nomeação rápida','acesso lexical'],
      t:['Mostre uma matriz com 5 cores/objetos/letras repetidos em linhas.','Peça para nomear o mais rápido possível, em voz alta, da esquerda para a direita.','Cronometre o tempo total e conte erros.','Lentidão marcada é um marcador de risco para dislexia.'],
      use:'Rastreia velocidade de acesso lexical — preditor de fluência de leitura.' }),
    mk({ id:'teste-consciencia-fonologica', q:['Erra tarefas de rima?','Tem dificuldade para separar sílabas?','Não identifica o som inicial das palavras?','Falha ao juntar fonemas em palavra?'],  emoji:'🔤', title:'Teste Direto: Consciência Fonológica', short:'Consc. Fonológica', aud:'clinico', band:'4–8 anos', min:48, max:107, kind:'teste direto', domain:'Linguagem', pri:147,
      sym:['dificuldade com rima','não separa sílabas'], compl:['dislexia','alfabetização','leitura'], kw:['consciência fonológica','rima','sílaba'],
      t:['Rima: "O que rima com PÃO: mão, bola ou casa?" (3 itens).','Sílabas: bater palmas para CA-SA, BO-LA, JA-NE-LA.','Fonema inicial: "Com que som começa BOLA?"','Síntese: "Que palavra é /c/ /a/ /sa/?"','Registre acertos por bloco.'],
      use:'Avalia diretamente habilidades fonológicas, base da alfabetização.' }),
    mk({ id:'teste-sequencia-motora', q:['Dificuldade para imitar gestos simples?','Erra a ordem em sequências motoras?','Dificuldade na pantomima (gesto sem objeto)?','Movimentos desajeitados ou lentos?'],  emoji:'🤲', title:'Teste Direto: Imitação de Gestos e Sequência Motora', short:'Praxia/Gestos', aud:'terapeuta', band:'3–12 anos', min:36, max:144, kind:'teste direto', domain:'Motor e praxia', pri:134,
      sym:['desajeitado','dificuldade de imitar'], compl:['praxia','coordenação','tdc','motor'], kw:['imitação de gestos','praxia','sequência motora'],
      t:['Peça para imitar gestos simples (acenar, bater palma) e depois sequências (palma-punho-lado).','Observe se inverte, omite ou troca a ordem.','Teste gesto sem objeto ("mostre como escova os dentes").','Registre facilidade/dificuldade de planejamento motor.'],
      use:'Rastreia praxia e planejamento motor de forma direta.' }),
    mk({ id:'teste-aritmetica-basica', q:['Dificuldade para contar / de 2 em 2?','Erra comparação de quantidades?','Falha em somas/subtrações simples para a idade?','Depende de contar nos dedos além do esperado?'],  emoji:'➕', title:'Teste Direto: Contagem e Aritmética Básica', short:'Aritmética Básica', aud:'clinico', band:'5–11 anos', min:60, max:143, kind:'teste direto', domain:'Aprendizagem', pri:138,
      sym:['dificuldade com números','conta nos dedos'], compl:['discalculia','matemática','aprendizagem'], kw:['aritmética','contagem','discalculia'],
      t:['Contar de 1 a 20 e de 2 em 2.','Comparar quantidades (qual é maior: 7 ou 9?).','Somas e subtrações simples adequadas à idade.','Resolver um probleminha falado ("tinha 5, ganhou 3...").','Registre estratégia (de cabeça, dedos, erro de procedimento).'],
      use:'Rastreio direto de senso numérico e aritmética — sinais de discalculia.' }),
    mk({ id:'teste-emocoes-faces', q:['Erra ao nomear emoções básicas em faces?','Não infere a emoção a partir da cena?','Dificuldade para justificar o porquê da emoção?','Leitura social abaixo do esperado?'],  emoji:'🙂', title:'Teste Direto: Reconhecimento de Emoções em Faces', short:'Emoções em Faces', aud:'terapeuta', band:'4–14 anos', min:48, max:179, kind:'teste direto', domain:'Comunicação social', pri:135,
      sym:['dificuldade social','não lê expressões'], compl:['tea','cognição social','empatia'], kw:['reconhecimento de emoções','faces','cognição social'],
      t:['Mostre faces de alegria, tristeza, raiva, medo e peça para nomear.','Pergunte "como essa pessoa está se sentindo?" diante de uma cena.','Pergunte o porquê (inferência da causa da emoção).','Registre acertos e qualidade da justificativa.'],
      use:'Avalia diretamente cognição social básica e leitura emocional.' }),
    mk({ id:'teste-fluencia-verbal', q:['Produz poucas palavras por categoria em 1 min?','Repete itens ou quebra a regra?','Demora/hesita para achar palavras?','Abaixo do esperado para a idade?'],  emoji:'💬', title:'Teste Direto: Fluência Verbal (1 minuto)', short:'Fluência Verbal', aud:'clinico', band:'5–17 anos', min:60, kind:'teste direto', domain:'Linguagem', pri:133,
      sym:['vocabulário pobre','demora para achar palavras'], compl:['linguagem','função executiva','acesso lexical'], kw:['fluência verbal','semântica','fonológica'],
      t:['Semântica: "diga o máximo de ANIMAIS em 1 minuto".','Fonológica: "diga palavras que começam com F em 1 minuto".','Conte o total e observe repetições/quebras de regra.','Compare com o esperado para a faixa (orientativo).'],
      use:'Estima acesso lexical e função executiva de forma rápida.' }),
    mk({ id:'teste-copia-formas', q:['Cópia de formas básicas abaixo do esperado?','Traçado irregular ou fechamento ruim?','Preensão/pressão do lápis inadequadas?','Dificuldade de proporção e direção?'],  emoji:'✏️', title:'Teste Direto: Cópia de Formas (visomotor)', short:'Cópia de Formas', aud:'clinico', band:'3–10 anos', min:36, max:131, kind:'teste direto', domain:'Motor e praxia', pri:131,
      sym:['letra ruim','dificuldade de copiar'], compl:['disgrafia','visomotor','coordenação'], kw:['cópia de formas','integração visomotora','beery'],
      t:['Peça para copiar: círculo, cruz, quadrado, triângulo e losango.','Observe traçado, fechamento, proporção e direção.','Compare a forma esperada por idade (orientativo).','Registre preensão do lápis e pressão.'],
      use:'Rastreia integração visomotora e maturidade gráfica.' }),
    mk({ id:'teste-ordens', q:['Falha em comandos de 2 passos?','Falha em comandos de 3 passos?','Precisa de gesto/pista para entender?','Compreensão abaixo do esperado para a idade?'],  emoji:'👂', title:'Teste Direto: Compreensão de Ordens (1-2-3 passos)', short:'Ordens 1-2-3', aud:'clinico', band:'2–8 anos', min:24, max:107, kind:'teste direto', domain:'Linguagem', pri:142,
      sym:['não obedece comandos','parece não entender'], compl:['linguagem','compreensão','audição','tea'], kw:['compreensão de ordens','comandos'],
      t:['1 passo: "pegue o lápis".','2 passos: "pegue o lápis e coloque na caixa".','3 passos: "pegue o lápis, abra o livro e me entregue".','Sem apontar/gestos. Registre quantos passos executa.'],
      use:'Avalia compreensão verbal e memória de instruções de forma direta.' }),
    mk({ id:'teste-permanencia-objeto', q:['Não puxa o pano para achar objeto parcialmente coberto?','Não procura objeto totalmente escondido?','Erra entre dois esconderijos?','Abaixo do marco esperado para a idade?'],  emoji:'🧸', title:'Teste Direto: Permanência do Objeto (lactente)', short:'Permanência Objeto', aud:'clinico', band:'0–2 anos', min:6, max:24, kind:'teste direto', domain:'Cognição precoce', pri:129,
      sym:['não procura objeto escondido'], compl:['desenvolvimento','cognição','bebê'], kw:['permanência do objeto','piaget','lactente'],
      t:['Mostre um brinquedo, cubra parcialmente com um pano: o bebê puxa?','Cubra totalmente diante dele: ele procura?','Esconda em 2 lugares alternados: procura no lugar certo?','Registre o nível alcançado por idade.'],
      use:'Marco cognitivo precoce observável diretamente no consultório.' }),

    /* ===================== INVENTÁRIOS ÚTEIS ===================== */
    mk({ id:'inv-marcos-alerta', emoji:'🚦', title:'Inventário de Sinais de Alerta por Idade (0–5a)', short:'Sinais de Alerta', aud:'familia', band:'0–5 anos', min:0, max:71, kind:'inventário', domain:'Triagem do desenvolvimento', pri:165,
      sym:['atraso','não fala','não anda','não interage'], compl:['desenvolvimento','marcos','atraso','tea'], kw:['sinais de alerta','red flags','marcos do desenvolvimento'],
      q:['Aos 3 meses: sorri, fixa o olhar e sustenta a cabeça?','Aos 9 meses: senta, balbucia e responde ao nome?','Aos 12 meses: aponta, faz gestos e fala mamã/papá?','Aos 18 meses: anda, fala algumas palavras e aponta para mostrar?','Aos 24 meses: junta 2 palavras e imita o cotidiano?','Aos 36 meses: faz frases e brinca de faz de conta?','Houve PERDA de algo que já fazia (regressão)?'],
      use:'Checklist de red flags por idade para acionar avaliação precoce.' }),
    mk({ id:'inv-sensorial-rapido', emoji:'🌈', title:'Inventário Sensorial Rápido', short:'Perfil Sensorial', aud:'familia', band:'1–12 anos', min:12, max:144, kind:'inventário', domain:'Sensorial', pri:144,
      sym:['tapa o ouvido','não gosta de etiqueta','busca movimento'], compl:['sensorial','tea','integração sensorial'], kw:['perfil sensorial','hipersensibilidade'],
      q:['Reage demais a sons (tapa ouvidos, assusta)?','Incomoda-se com texturas de roupa/etiqueta/comida?','Busca movimento intenso (girar, pular, se jogar)?','Evita sujar as mãos (tinta, areia, cola)?','Parece não sentir dor/temperatura como esperado?','Seletividade alimentar por textura/cheiro?'],
      use:'Triagem rápida de hiper/hiporreatividade sensorial para orientar TO.' }),
    mk({ id:'inv-avd-autonomia', emoji:'🧦', title:'Inventário de Autonomia (AVDs)', short:'Autonomia/AVD', aud:'familia', band:'2–17 anos', min:24, kind:'inventário', domain:'Autonomia', pri:140,
      sym:['dependente','não se veste'], compl:['autonomia','avd','independência'], kw:['avd','autonomia','autocuidado'],
      q:['Come sozinho com talheres adequado à idade?','Veste e despe roupas e calçados?','Higiene: escova dentes, lava as mãos, banho com supervisão?','Usa o banheiro de forma independente?','Organiza material/mochila?','Cumpre passos de rotina sem lembrete constante?'],
      use:'Mapeia independência funcional para metas terapêuticas e laudo.' }),
    mk({ id:'inv-protecao-resiliencia', emoji:'🛡️', title:'Inventário de Fatores de Proteção', short:'Fatores de Proteção', aud:'familia', band:'3–17 anos', min:36, kind:'inventário', domain:'Saúde mental', pri:124,
      sym:[], compl:['resiliência','proteção','saúde mental'], kw:['fatores de proteção','resiliência','pontos fortes'],
      q:['Tem ao menos um adulto de confiança e disponível?','Tem um talento/interesse que dá prazer e orgulho?','Tem amigo(s) ou vínculo social positivo?','A rotina familiar é previsível e acolhedora?','A escola é parceira e compreensiva?','Pratica atividade física ou lazer regular?'],
      use:'Destaca pontos fortes e proteção — equilibra a leitura deficitária e guia o plano.' }),
    mk({ id:'inv-higiene-sono', emoji:'🛌', title:'Inventário de Higiene do Sono', short:'Higiene do Sono', aud:'familia', band:'1–17 anos', min:12, kind:'inventário', domain:'Sono', pri:139,
      sym:['demora pra dormir','dorme tarde'], compl:['sono','higiene do sono','melatonina'], kw:['higiene do sono','rotina de sono'],
      q:['Tem horário fixo para deitar e acordar?','Há ritual calmo antes de dormir (banho, leitura)?','Tela é desligada pelo menos 1h antes?','O quarto é escuro, silencioso e fresco?','Evita cafeína/açúcar à noite?','Cochilos diurnos são adequados à idade?'],
      use:'Checklist de higiene do sono antes de considerar medicação.' }),
    mk({ id:'inv-prontidao-escolar', emoji:'🎒', title:'Inventário de Prontidão Escolar', short:'Prontidão Escolar', aud:'familia', band:'4–7 anos', min:48, max:95, kind:'inventário', domain:'Aprendizagem', pri:137,
      sym:['imaturo para a escola'], compl:['escola','alfabetização','prontidão'], kw:['prontidão escolar','pré-requisitos'],
      q:['Fica sentado em atividade por ~15 minutos?','Segue regras simples em grupo?','Segura o lápis e copia formas básicas?','Reconhece letras/números e rima?','Separa-se do cuidador sem sofrimento excessivo?','Comunica necessidades (banheiro, ajuda)?'],
      use:'Apoia decisão sobre prontidão e adaptações na entrada escolar.' }),

    /* ===================== FERRAMENTAS ÚTEIS GRATUITAS ===================== */
    mk({ id:'fer-preparar-consulta', emoji:'📋', title:'Checklist: Preparar a Consulta', short:'Preparar Consulta', aud:'familia', band:'0–17 anos', kind:'ferramenta', domain:'Apoio clínico', pri:152,
      sym:[], compl:['consulta','organização'], kw:['preparar consulta','checklist','anamnese'],
      q:['Liste as 3 maiores preocupações de agora.','Quando os sinais começaram e o que mudou?','Traga relatórios da escola e de terapeutas.','Liste medicações e doses atuais.','Anote dúvidas para não esquecer.','Traga vídeos curtos de crises/comportamentos, se houver.'],
      use:'Organiza a família para uma consulta objetiva e produtiva.' }),
    mk({ id:'fer-plano-crise-epilepsia', emoji:'🚑', title:'Plano de Crise — Epilepsia (modelo)', short:'Plano de Crise', aud:'familia', band:'0–17 anos', kind:'ferramenta', domain:'Epilepsia', pri:158,
      sym:['convulsão'], compl:['epilepsia','crise','emergência'], kw:['plano de crise','primeiros socorros','diazepam'],
      q:['Proteja a cabeça, deite de lado e NÃO coloque nada na boca.','Marque o horário de início da crise.','Medicação de resgate: qual, dose e a partir de quantos minutos?','Quando chamar o SAMU (192): crise > 5 min ou crises seguidas.','Contatos de emergência e do médico.','O que fazer no pós-crise (repouso, observar).'],
      use:'Modelo de plano de ação para crises, para casa e escola.' }),
    mk({ id:'fer-plano-comportamental', emoji:'✅', title:'Plano Comportamental (casa/escola)', short:'Plano Comportamental', aud:'familia', band:'2–17 anos', min:24, kind:'ferramenta', domain:'Comportamento', pri:145,
      sym:['birra','oposição'], compl:['comportamento','reforço','rotina'], kw:['plano comportamental','reforço positivo'],
      q:['Escolha 1–2 comportamentos-alvo claros e positivos.','Defina o que será reforçado e como (elogio, ficha, tempo de prazer).','Combine antecedentes que ajudam (aviso, agenda visual, escolhas).','Defina resposta calma e consistente às crises.','Garanta que casa e escola usem a MESMA estratégia.','Reavalie em 2–4 semanas.'],
      use:'Estrutura um plano comportamental simples e consistente entre contextos.' }),
    mk({ id:'fer-registro-gatilhos', emoji:'🔎', title:'Registro de Gatilhos', short:'Registro de Gatilhos', aud:'familia', band:'1–17 anos', min:12, kind:'ferramenta', domain:'Comportamento', pri:127,
      sym:['crise','sobrecarga'], compl:['gatilho','sensorial','comportamento'], kw:['gatilhos','antecedentes'],
      q:['Que situações costumam preceder a crise/sobrecarga?','Há padrão de horário (fome, sono, fim do dia)?','Ambientes específicos (barulho, multidão, transição)?','Demandas específicas (tarefa, banho, sair)?','O que costuma prevenir ou reduzir?'],
      use:'Identifica padrões para prevenir crises e ajustar o ambiente.' }),
    mk({ id:'fer-agenda-visual', emoji:'🖼️', title:'Guia: Agenda Visual / Rotina', short:'Agenda Visual', aud:'familia', band:'2–12 anos', min:24, max:144, kind:'ferramenta', domain:'Atenção/FE', pri:125,
      sym:['dificuldade em transições'], compl:['rotina','agenda visual','tea','tdah'], kw:['agenda visual','rotina','previsibilidade'],
      q:['Liste os passos da rotina em ordem (manhã/tarde/noite).','Use imagens/desenhos para cada passo.','Antecipe mudanças com aviso ("faltam 5 minutos").','Deixe a criança "marcar" o que concluiu.','Mantenha a sequência estável por alguns dias.'],
      use:'Guia para montar previsibilidade visual e reduzir conflitos de transição.' }),
    mk({ id:'fer-metas-gas', emoji:'🎯', title:'Registro de Metas Terapêuticas (GAS)', short:'Metas (GAS)', aud:'terapeuta', band:'0–17 anos', kind:'ferramenta', domain:'Qualidade de vida', pri:143,
      sym:[], compl:['metas','gas','terapia'], kw:['gas','goal attainment scaling','metas terapêuticas'],
      q:['Defina 3–5 metas funcionais e centradas na família.','Para cada meta, descreva o nível atual.','Descreva o resultado esperado em 3–6 meses.','Defina como saber que melhorou (observável).','Marque data de reavaliação.'],
      use:'Estrutura metas mensuráveis (GAS) para acompanhar evolução real.' }),
    mk({ id:'fer-carta-escola', emoji:'🏫', title:'Guia: Carta para a Escola (adaptações)', short:'Carta para Escola', aud:'familia', band:'3–17 anos', min:36, kind:'ferramenta', domain:'Escola', pri:141,
      sym:[], compl:['escola','inclusão','adaptações','aee'], kw:['carta para escola','adaptações','mediador'],
      q:['Resuma o diagnóstico/queixa de forma respeitosa.','Liste adaptações pedidas (tempo extra, lugar à frente, pausas).','Necessita de mediador/acompanhante? Justifique.','Combine canal de comunicação família-escola.','Anexe relatórios e plano terapêutico.'],
      use:'Modelo para solicitar adaptações escolares razoáveis de forma clara.' })
  ];

  var base = Array.isArray(window.NEUROPED_EDITORIAL_SCALES) ? window.NEUROPED_EDITORIAL_SCALES : [];
  var ids = new Set(base.map(function(x){ return x && x.id; }));
  window.NEUROPED_EDITORIAL_SCALES = base.concat(DATA.filter(function(x){ return !ids.has(x.id); }));
  window.NEUROPED_DIARIOS_UTEIS_COUNT = DATA.length;
})();


/* ===== scales-autorais-npe.js ===== */
/* NeuroPed EDJ — Instrumentos Autorais Brasileiros (série NPE-BR).
   Conteúdo AUTORAL do Dr. Jadson Fraga (itens próprios) — pode ser exibido
   por extenso. NÃO normatizado: faixas são "ponto de atenção operacional",
   nunca ponto de corte diagnóstico; sem equivalência a instrumentos
   internacionais. Renderiza em instrumento-autoral.html. */
(function () {
  'use strict';
  if (window.NEUROPED_NPE_LOADED) return; window.NEUROPED_NPE_LOADED = true;

  var DISC = 'Instrumento autoral brasileiro NeuroPed EDJ para triagem e acompanhamento clínico. Não normatizado. Não substitui avaliação médica, neuropsicológica ou multiprofissional e não corresponde a tradução ou versão validada de instrumento internacional. Os valores são pontos de atenção operacional, não pontos de corte diagnósticos.';

  var O_FREQ = ['Nunca ou quase nunca','Ocasionalmente','Frequentemente','Muito frequentemente / prejuízo importante'];
  var O_002  = ['Faz claramente e com frequência','Faz, mas de forma inconsistente','Raramente faz','Não faz ou deixou de fazer'];
  var O_003  = ['Nunca ou quase nunca','Às vezes','Frequentemente','Muito frequentemente'];
  var O_004  = ['Nenhum dia','Alguns dias','Muitos dias','Quase todos os dias / grande prejuízo'];
  var O_006  = ['Faz de forma consistente (esperado p/ a fase)','Faz às vezes / precisa de ajuda maior','Ainda não faz / dificuldade importante','Fazia e deixou de fazer'];
  var O_007  = ['Independência e eficiência','Lentidão / adaptação / pequena ajuda','Ajuda frequente / tecnologia assistiva','Não realiza / depende de terceiros'];
  var O_008  = ['Nunca','Uma vez / há bastante tempo','Algumas vezes / no último ano','Atualmente / repetido / gerou problema'];
  var O_009  = ['Não ocorre / sem dificuldade','Ocasionalmente','Frequentemente','Muito / interfere fortemente'];
  function opts(arr){ return arr.map(function(l,i){ return { label:l, value:i }; }); }

  var INSTR = [
    { id:'npe-br-001', code:'NPE-BR-001', sigla:'SECADI-12', emoji:'🧠',
      title:'Saúde Emocional, Comportamento e Atenção', aud:'familia', audLabel:'Pais/cuidador',
      band:'4–17 anos', min:48, max:215, periodo:'Últimas 4 semanas', restrito:false,
      domain:'Saúde emocional e comportamento', kw:['humor','ansiedade','comportamento','atenção','irritabilidade','impacto funcional','triagem global'],
      fim:'Triagem global de humor, ansiedade, comportamento, atenção e impacto funcional.',
      options:opts(O_FREQ),
      items:['A criança/adolescente tem apresentado irritação, choro ou mudanças de humor maiores do que o esperado para situações comuns?',
        'Tem parecido triste, desanimado ou com pouca vontade de participar de atividades de que normalmente gosta?',
        'Demonstra preocupações excessivas, medos frequentes ou necessidade constante de confirmação dos adultos?',
        'Tem dificuldade importante para obedecer combinados simples ou aceitar limites adequados à idade?',
        'Entra em conflitos frequentes com adultos, irmãos ou colegas?',
        'Age de forma impulsiva, interrompe situações ou se coloca em dificuldades por não conseguir esperar ou pensar antes de agir?',
        'Tem dificuldade para manter atenção em tarefas, brincadeiras ou atividades escolares compatíveis com a idade?',
        'Evita pessoas, ambientes ou atividades por medo, insegurança ou desconforto emocional?',
        'Apresentou queda no rendimento, recusa escolar ou dificuldade relevante para concluir atividades?',
        'Tem dificuldade para fazer amizades, manter interação ou participar de grupos?',
        'O comportamento ou sofrimento emocional tem gerado desgaste importante na rotina da família?',
        'As dificuldades interferem perceptivelmente na vida em casa, na escola, nas terapias ou nas relações sociais?'],
      subs:[{name:'Humor e ansiedade',idx:[0,1,2,7]},{name:'Atenção e impulsividade',idx:[5,6,8]},{name:'Comportamento e impacto funcional',idx:[3,4,9,10,11]}],
      cutoffs:[{max:8,label:'Poucos sinais relatados',cls:'ok'},{max:17,label:'Sinais leves ou situacionais — acompanhar',cls:'warn'},{max:26,label:'Sinais clinicamente relevantes — avaliação direcionada',cls:'risk'},{max:36,label:'Impacto elevado — avaliação especializada prioritária',cls:'risk'}],
      traps:[{idx:[10,11],min:2,msg:'Itens de impacto familiar/funcional elevados: indicar aprofundamento clínico mesmo com total < 18.'}],
      suggest:[{sub:'Humor e ansiedade',min:7,msg:'Predomínio humor/ansiedade: sugerir NPE-BR-004.'},{sub:'Atenção e impulsividade',min:6,msg:'Predomínio atenção/impulsividade: sugerir NPE-BR-003.'}] },

    { id:'npe-br-002', code:'NPE-BR-002', sigla:'SPACS-12', emoji:'🌱',
      title:'Sinais Precoces de Autismo e Comunicação Social', aud:'familia', audLabel:'Pais/cuidador',
      band:'18–42 meses', min:18, max:42, periodo:'Comportamento habitual (últimas semanas)', restrito:false,
      domain:'TEA precoce e comunicação social', kw:['tea','autismo','comunicação social','brincar','atenção compartilhada','regressão','estereotipia'],
      fim:'Triagem de comunicação social, brincar e comportamentos repetitivos (ausência/inconsistência aumenta o alerta).',
      options:opts(O_002),
      items:['Olha para o adulto para compartilhar interesse, alegria ou surpresa diante de algo que chamou sua atenção?',
        'Aponta para mostrar coisas interessantes (brinquedos, animais, pessoas, acontecimentos) e não apenas para pedir?',
        'Responde quando é chamada pelo nome, especialmente quando não está muito distraída?',
        'Imita gestos, expressões faciais, brincadeiras simples ou ações de um adulto?',
        'Procura espontaneamente o adulto para brincar junto, compartilhar uma descoberta ou pedir ajuda?',
        'Usa gestos, sons, palavras ou combinações para comunicar necessidades de maneira funcional?',
        'Acompanha o olhar ou o apontar do adulto para descobrir o que ele está mostrando?',
        'Demonstra interesse por outras crianças (observa, aproxima-se, tenta brincar)?',
        'Brinca de formas variadas, usando brinquedos de modo funcional ou imaginativo, conforme a idade?',
        'Aceita pequenas mudanças de rotina ou interrupções sem sofrimento desproporcional frequente?',
        'Apresenta pouca necessidade de repetir movimentos, alinhar objetos, girar peças ou repetir a mesma brincadeira de forma rígida?',
        'Mantém as habilidades de comunicação, interação e brincar já adquiridas, sem perda perceptível?'],
      subs:[{name:'Atenção compartilhada e reciprocidade',idx:[0,1,2,4,6,7]},{name:'Comunicação funcional',idx:[3,5]},{name:'Brincar, flexibilidade e repetição',idx:[8,9,10]},{name:'Regressão',idx:[11]}],
      cutoffs:[{max:6,label:'Poucos sinais observados',cls:'ok'},{max:12,label:'Monitorar comunicação social e desenvolvimento',cls:'warn'},{max:20,label:'Investigação clínica indicada',cls:'risk'},{max:36,label:'Alta concentração de sinais — avaliação neuropediátrica prioritária',cls:'risk'}],
      traps:[{idx:[11],min:3,level:'prioritario',msg:'PERDA DE HABILIDADES (regressão): avaliação prioritária independentemente do total.'},{idx:[1],min:3,msg:'Apontar para mostrar ausente — sinal de alerta.'},{idx:[2],min:3,msg:'Resposta ao nome ausente — sinal de alerta.'},{idx:[5],min:3,msg:'Comunicação funcional ausente — sinal de alerta.'}] },

    { id:'npe-br-003', code:'NPE-BR-003', sigla:'DHOE-12', emoji:'⚡',
      title:'Desatenção, Hiperatividade e Organização Escolar', aud:'escola', audLabel:'Pais/cuidador/professor',
      band:'5–17 anos', min:60, max:215, periodo:'Últimos 6 meses', restrito:false,
      domain:'TDAH e função executiva', kw:['tdah','desatenção','hiperatividade','impulsividade','organização','escola','função executiva'],
      fim:'Triagem de desatenção, hiperatividade/impulsividade e prejuízo executivo.',
      options:opts(O_003),
      items:['Tem dificuldade para manter atenção em tarefas escolares, atividades dirigidas ou brincadeiras que exigem concentração?',
        'Parece não escutar quando alguém fala diretamente com ele, mesmo sem oposição evidente?',
        'Inicia atividades, mas frequentemente não consegue terminá-las sem supervisão repetida?',
        'Perde materiais, esquece recados ou se desorganiza em atividades compatíveis com a idade?',
        'Evita ou se irrita diante de tarefas que exigem esforço mental contínuo (ler, escrever, estudar, organizar)?',
        'Levanta-se, movimenta-se excessivamente ou mexe em objetos quando deveria permanecer mais organizado?',
        'Fala em excesso, interrompe conversas ou responde antes de a pergunta terminar?',
        'Tem dificuldade para esperar sua vez em jogos, conversas ou atividades em grupo?',
        'Age por impulso, sem avaliar riscos ou consequências imediatas?',
        'O desempenho escolar fica abaixo do potencial por distração, pressa ou falta de organização?',
        'Precisa de supervisão muito maior do que outras crianças da mesma idade para realizar tarefas diárias?',
        'Essas dificuldades aparecem em mais de um ambiente (casa, escola, terapias, esporte, convivência)?'],
      subs:[{name:'Desatenção e organização',idx:[0,1,2,3,4]},{name:'Hiperatividade e impulsividade',idx:[5,6,7,8]},{name:'Prejuízo funcional e múltiplos ambientes',idx:[9,10,11]}],
      cutoffs:[{max:8,label:'Poucos sinais no relato atual',cls:'ok'},{max:17,label:'Sinais leves ou dependentes do contexto',cls:'warn'},{max:26,label:'Perfil compatível com necessidade de avaliação para TDAH e diferenciais',cls:'risk'},{max:36,label:'Sinais intensos com provável impacto funcional significativo',cls:'risk'}],
      gate_message:{ requireTotal:18, anyItem:[9,10,11], min:2, msg:'Investigação clínica para TDAH indicada (total ≥ 18 + prejuízo funcional em múltiplos ambientes). Investigar sono, ansiedade, TEA, DI, dificuldades de aprendizagem, audição e contexto familiar/escolar. Não fecha diagnóstico.' } },

    { id:'npe-br-004', code:'NPE-BR-004', sigla:'ATIE-12', emoji:'🌧️',
      title:'Ansiedade, Tristeza e Impacto Emocional', aud:'autoteste', audLabel:'Criança/adolescente',
      band:'7–17 anos', min:84, max:215, periodo:'Últimas 2 semanas', restrito:false, aviso:true,
      domain:'Ansiedade e humor', kw:['ansiedade','tristeza','depressão','medo','preocupação','irritabilidade','autorrelato'],
      fim:'Rastreio de ansiedade, tristeza, irritabilidade e impacto emocional (autorrelato).',
      options:opts(O_004),
      items:['Você ficou preocupado com coisas ruins que poderiam acontecer, mesmo sem saber se realmente aconteceriam?',
        'Você sentiu medo, nervosismo ou tensão em situações que outras pessoas da sua idade enfrentam com mais facilidade?',
        'Você teve dificuldade para relaxar porque seus pensamentos ficavam repetindo preocupações?',
        'Você evitou escola, pessoas, passeios ou atividades por medo, vergonha ou ansiedade?',
        'Você sentiu sintomas físicos ao se preocupar (dor de barriga, enjoo, tremor, aperto no peito, falta de ar, coração acelerado)?',
        'Você se sentiu triste, desanimado ou sem vontade de fazer coisas de que costuma gostar?',
        'Você sentiu que não era bom o suficiente, que errava demais ou que era pior do que outras pessoas?',
        'Você teve dificuldade para dormir ou descansar por preocupação, tristeza ou pensamentos repetitivos?',
        'Você ficou mais irritado, impaciente ou explosivo por causa do que estava sentindo?',
        'Suas emoções atrapalharam estudar, brincar, conversar, sair ou cumprir suas atividades?',
        'Você precisou pedir confirmação, proteção ou presença de adultos muitas vezes por medo ou insegurança?',
        'A ansiedade, tristeza ou irritação atrapalhou sua convivência com familiares, colegas ou professores?'],
      subs:[{name:'Ansiedade e preocupação',idx:[0,1,2,3,4,10]},{name:'Humor e autoimagem',idx:[5,6,7,8]},{name:'Impacto funcional',idx:[9,11]}],
      cutoffs:[{max:8,label:'Poucos sintomas relatados',cls:'ok'},{max:16,label:'Sintomas leves — acompanhar e orientar',cls:'warn'},{max:24,label:'Sofrimento emocional clinicamente relevante — avaliação indicada',cls:'risk'},{max:36,label:'Sintomas intensos — avaliação especializada prioritária',cls:'risk'}],
      sentinel:{ q:'Em algum momento recente você pensou em se machucar, desaparecer, morrer ou sentiu que não conseguiria permanecer seguro?', options:['Não','Não sei','Sim'], positive:[1,2], target:'npe-br-005',
        msg:'Resposta positiva ou hesitante na pergunta-sentinela: a interpretação simples foi bloqueada. Encaminhar ao módulo profissional NPE-BR-005 (Segurança Emocional e Risco de Autoagressão) e fazer avaliação breve de segurança com profissional.' } },

    { id:'npe-br-005', code:'NPE-BR-005', sigla:'SERA-10', emoji:'🛟',
      title:'Segurança Emocional e Risco de Autoagressão', aud:'clinico', audLabel:'Profissional (entrevista)',
      band:'10–20 anos', min:120, max:252, periodo:'Entrevista individual', restrito:true,
      domain:'Segurança / risco de autoagressão', kw:['risco','autoagressão','suicídio','ideação','segurança','crise','autolesão'],
      fim:'Avaliação clínica de segurança emocional e risco de autoagressão. Sem escore — classificação S0–S3.',
      risk_mode:true, options:[{label:'Não',value:0},{label:'Não sei',value:1},{label:'Sim',value:2}],
      items:['Nas últimas semanas, você teve momentos em que sentiu que a vida estava pesada demais ou que não valia a pena continuar?',
        'Você desejou desaparecer, dormir e não acordar ou morrer, mesmo sem planejar fazer algo?',
        'Você pensou em machucar a si mesmo de propósito (cortar, ferir, tomar algo para se prejudicar)?',
        'Você já tentou se machucar ou tirar a própria vida alguma vez?',
        'Atualmente, você pensou em alguma forma específica de se machucar ou morrer?',
        'Você tem acesso a medicamentos, armas, objetos cortantes, lugares perigosos ou outros meios?',
        'Neste momento, você sente que conseguiria permanecer seguro sem se machucar?',
        'Há algum adulto de confiança que possa acompanhá-lo hoje, se necessário?',
        'Aconteceu algo recente que aumentou muito seu sofrimento (bullying, violência, abuso, exposição digital, perda, separação, conflito, rejeição)?',
        'Você usou álcool, medicamentos ou substâncias para aliviar sofrimento ou criar coragem para se machucar?'],
      protective:[6,7], // Sim = fator protetor
      risk_rules:{ s3_any_pos:[4], s3_combo:{plan:4,means:5}, s2_any_pos:[2,3,5], s2_unsafe_item:6, s1_any_pos:[0,1] },
      levels:[
        {k:'S0',label:'Sem risco identificado no momento',cls:'ok',conduct:'Registrar a entrevista e orientar seguimento conforme o quadro.'},
        {k:'S1',label:'Sofrimento com ideação passiva',cls:'warn',conduct:'Avaliação clínica ampliada, plano de segurança e seguimento próximo.'},
        {k:'S2',label:'Risco significativo',cls:'risk',conduct:'Avaliação imediata no mesmo atendimento; acionar responsável/rede de suporte.'},
        {k:'S3',label:'Risco iminente',cls:'risk',conduct:'NÃO deixar desacompanhado; encaminhamento emergencial imediato.'}
      ] },

    { id:'npe-br-006', code:'NPE-BR-006', sigla:'MDFMS-12', emoji:'👶',
      title:'Marcos do Desenvolvimento, Fala, Movimento e Socialização', aud:'familia', audLabel:'Pais/cuidador',
      band:'12–60 meses', min:12, max:60, periodo:'Habilidades atuais e evolução recente', restrito:false,
      domain:'Vigilância do desenvolvimento', kw:['desenvolvimento','marcos','atraso de fala','motor','socialização','regressão','linguagem'],
      fim:'Vigilância clínica do desenvolvimento global (ausência/perda aumenta o alerta).',
      options:opts(O_006),
      items:['Comunica necessidades ou interesses por gestos, sons, palavras ou frases adequadas à idade?',
        'Compreende orientações simples ou comandos compatíveis com a idade?',
        'Olha, aponta, mostra objetos ou procura o adulto para compartilhar interesse e interação?',
        'Demonstra interesse por pessoas, brincadeiras sociais ou outras crianças?',
        'Usa brinquedos de forma funcional e, quando esperado, faz brincadeiras de faz de conta?',
        'Senta, fica em pé, anda, corre ou se movimenta conforme a etapa de desenvolvimento?',
        'Usa as mãos para alcançar, pegar, encaixar, empilhar, desenhar ou manipular objetos conforme a idade?',
        'Participa da alimentação com progressiva autonomia (levar à boca, copo, talheres quando esperado)?',
        'Participa de rotinas simples (guardar objetos, colaborar ao vestir-se, compreender pequenas sequências)?',
        'Tolera mudanças simples na rotina e consegue reorganizar-se com apoio compatível com a idade?',
        'Vem adquirindo novas habilidades ao longo dos últimos meses?',
        'Mantém as habilidades já aprendidas, sem perda de fala, interação, brincar, marcha ou autonomia?'],
      subs:[{name:'Linguagem e compreensão',idx:[0,1]},{name:'Socialização e brincar',idx:[2,3,4,9]},{name:'Motor e autonomia',idx:[5,6,7,8]},{name:'Evolução e regressão',idx:[10,11]}],
      cutoffs:[{max:5,label:'Sem alerta importante nesta triagem',cls:'ok'},{max:10,label:'Acompanhar e orientar estimulação adequada',cls:'warn'},{max:18,label:'Avaliação do desenvolvimento indicada',cls:'risk'},{max:36,label:'Alterações significativas — avaliação neuropediátrica prioritária',cls:'risk'}],
      traps:[{idx:[11],min:3,level:'prioritario',msg:'REGRESSÃO de habilidades: avaliação prioritária independentemente do total.'},{idx:[0],min:2,msg:'Linguagem/compreensão em alerta.'},{idx:[2],min:2,msg:'Socialização/atenção compartilhada em alerta.'},{idx:[5],min:2,msg:'Desenvolvimento motor em alerta.'},{idx:[10],min:2,msg:'Aquisição de novas habilidades lenta.'}] },

    { id:'npe-br-007', code:'NPE-BR-007', sigla:'MUAPC-12', emoji:'🦽',
      title:'Mobilidade, Uso das Mãos e Autonomia na Paralisia Cerebral', aud:'clinico', audLabel:'Profissional (com a família)',
      band:'2–18 anos', min:24, max:215, periodo:'Funcionalidade atual', restrito:true,
      domain:'Paralisia cerebral / função motora', kw:['paralisia cerebral','mobilidade','marcha','habilidade manual','autonomia','motor','espasticidade'],
      fim:'Organização funcional motora e manual. NÃO substitui GMFCS-E&R, MACS ou Mini-MACS oficiais.',
      aviso_oficial:'Instrumento autoral e organizacional. Não substitui GMFCS-E&R, MACS ou Mini-MACS oficiais — registre as classificações oficiais separadamente quando disponíveis.',
      options:opts(O_007),
      items:['Mantém postura adequada para brincar, estudar ou participar de atividades do cotidiano?',
        'Muda de posição, senta-se, levanta-se ou faz transferências adequadas ao seu nível funcional?',
        'Desloca-se dentro de casa com independência compatível com sua condição?',
        'Desloca-se fora de casa, na escola ou na comunidade com participação funcional?',
        'Acompanha brincadeiras, escola ou atividades sem fadiga motora excessiva?',
        'Usa as mãos para pegar e manter objetos de uso cotidiano?',
        'Manipula brinquedos, materiais escolares, talheres ou objetos pessoais?',
        'Utiliza as duas mãos de forma coordenada quando a atividade exige?',
        'Participa da alimentação, higiene ou vestir-se com autonomia compatível com seu potencial?',
        'Espasticidade, distonia, tremor ou movimentos involuntários interferem nas atividades diárias?',
        'Sente dor, desconforto ou limitação postural que reduz a participação?',
        'Necessita de adaptação, órtese, cadeira, dispositivo ou apoio contínuo para participar da rotina?'],
      subs:[{name:'Mobilidade e postura',idx:[0,1,2,3,4]},{name:'Habilidade manual',idx:[5,6,7]},{name:'Autonomia e suporte',idx:[8,9,10,11]}],
      cutoffs:[{max:8,label:'Limitação funcional leve ou bem compensada',cls:'ok'},{max:17,label:'Necessidade moderada de suporte/adaptação',cls:'warn'},{max:26,label:'Dependência funcional relevante — plano terapêutico estruturado',cls:'risk'},{max:36,label:'Dependência elevada — suporte intensivo multidisciplinar',cls:'risk'}],
      traps:[{idx:[9,10],min:2,msg:'Avaliar dor, tônus e conforto postural.'},{idx:[11],min:2,msg:'Revisar tecnologias assistivas e acessibilidade.'}] },

    { id:'npe-br-008', code:'NPE-BR-008', sigla:'AVNOS-12', emoji:'🚭',
      title:'Álcool, Vape, Nicotina e Outras Substâncias', aud:'autoteste', audLabel:'Adolescente/jovem (privacidade)',
      band:'12–20 anos', min:144, max:252, periodo:'Exposição/uso', restrito:true,
      domain:'Substâncias (adolescente)', kw:['álcool','vape','nicotina','drogas','substâncias','adolescente','risco'],
      fim:'Triagem autoral de exposição, uso e prejuízo relacionado a substâncias. Aplicar com privacidade e sem julgamento.',
      options:opts(O_008),
      items:['Você já consumiu bebida alcoólica, mesmo em festas, encontros ou por curiosidade?',
        'Você já utilizou vape, pod, cigarro eletrônico ou outro produto com nicotina?',
        'Você já fumou cigarro, narguilé ou outro produto de tabaco?',
        'Você já usou maconha ou outra substância para experimentar, relaxar ou se sentir diferente?',
        'Você já utilizou medicamento sem orientação, em dose maior, misturado com bebida ou para ficar acordado/calmo/alterado?',
        'Você já esteve em carro, moto ou situação perigosa com alguém que havia usado álcool ou drogas?',
        'Você já escondeu da família o uso de bebida, vape, medicamento ou outra substância?',
        'Você já usou alguma substância para aliviar tristeza, ansiedade, raiva, solidão ou pressão de amigos?',
        'O uso já causou briga, queda escolar, perda de confiança, acidente, mal-estar importante ou outra consequência?',
        'Você tem dificuldade para recusar quando amigos oferecem bebida, vape ou outras substâncias?',
        'Você já sentiu vontade forte de repetir o uso ou percebeu que precisava usar para se sentir melhor?',
        'Existe alguém próximo que facilita acesso, incentiva ou trata esse uso como algo sem risco?'],
      subs:[{name:'Exposição e uso',idx:[0,1,2,3,4]},{name:'Risco e vulnerabilidade',idx:[5,6,7,8,9,10,11]}],
      cutoffs:[{max:0,label:'Nenhuma exposição relatada',cls:'ok'},{max:5,label:'Exposição/experimentação — orientação preventiva',cls:'warn'},{max:11,label:'Uso com fatores de vulnerabilidade — intervenção breve e seguimento',cls:'risk'},{max:36,label:'Uso relevante ou com prejuízo — avaliação clínica ampliada prioritária',cls:'risk'}],
      traps:[{idx:[4,5,7,8,10],min:2,level:'prioritario',msg:'Avaliação prioritária: automedicação, coerção/situação perigosa, uso para aliviar sofrimento, consequência relevante ou compulsão. Verificar tristeza intensa, ansiedade grave e risco de autoagressão.'}] },

    { id:'npe-br-009', code:'NPE-BR-009', sigla:'CRSPE-12', emoji:'🏫',
      title:'Comportamento, Relações Sociais e Participação na Escola', aud:'escola', audLabel:'Professor/coordenação/cuidador',
      band:'4–17 anos', min:48, max:215, periodo:'Últimas 4 semanas', restrito:false,
      domain:'Comportamento e participação escolar', kw:['comportamento','escola','social','autorregulação','pares','inclusão','participação'],
      fim:'Avaliar autorregulação, interação social e participação escolar.',
      options:opts(O_009),
      items:['Tem dificuldade para lidar com frustrações sem chorar, gritar, abandonar atividades ou apresentar crises?',
        'Tem dificuldade para seguir regras básicas ou combinados do ambiente escolar?',
        'Tem dificuldade para aguardar sua vez em brincadeiras, conversas ou tarefas coletivas?',
        'Demonstra pouca percepção dos sentimentos ou necessidades de colegas em situações sociais?',
        'Tem dificuldade para cooperar, dividir materiais ou participar de atividades em grupo?',
        'Tem dificuldade para iniciar ou manter interação adequada com outras crianças?',
        'Fica isolado, rejeitado ou envolvido em conflitos frequentes com colegas?',
        'Apresenta agressividade verbal, física ou comportamentos intimidadores em situações comuns?',
        'Fica excessivamente inquieto, desorganizado ou fora da atividade durante tarefas coletivas?',
        'Suas emoções ou seu comportamento atrapalham o aprendizado?',
        'Necessita de ajuda muito maior do que colegas da mesma idade para participar das atividades escolares?',
        'Precisa de mediação individual constante para permanecer incluído, organizado ou seguro na rotina escolar?'],
      subs:[{name:'Autorregulação e regras',idx:[0,1,2,7,8]},{name:'Relações sociais',idx:[3,4,5,6]},{name:'Participação e aprendizagem',idx:[9,10,11]}],
      cutoffs:[{max:8,label:'Poucas dificuldades relatadas',cls:'ok'},{max:16,label:'Dificuldades leves ou situacionais',cls:'warn'},{max:24,label:'Impacto escolar relevante — planejamento conjunto indicado',cls:'risk'},{max:36,label:'Prejuízo elevado de participação — avaliação clínica e escolar prioritária',cls:'risk'}],
      suggest:[{sub:'Participação e aprendizagem',min:5,msg:'Sugerir elaboração/revisão de PEI ou plano de apoio escolar.'}],
      traps:[{idx:[7],min:2,msg:'Investigar gatilhos, sofrimento emocional, bullying e segurança.'},{idx:[5,6],min:2,msg:'Aprofundar socialização, TEA, ansiedade social ou exclusão escolar.'}] },

    { id:'npe-br-010', code:'NPE-BR-010', sigla:'SRDIC-12', emoji:'😴',
      title:'Sono, Ronco, Despertares e Impacto no Comportamento', aud:'familia', audLabel:'Pais/cuidador',
      band:'2–17 anos', min:24, max:215, periodo:'Últimas 4 semanas', restrito:false,
      domain:'Sono', kw:['sono','ronco','despertares','insônia','apneia','eventos noturnos','impacto diurno'],
      fim:'Triagem de sono, respiração noturna, eventos paroxísticos e repercussão diurna.',
      options:opts(O_FREQ),
      items:['Demora muito para adormecer, mesmo com a rotina de sono organizada?',
        'Precisa de presença constante, telas, mamadeira, movimentos ou rituais prolongados para dormir?',
        'Acorda várias vezes durante a noite ou permanece acordada por períodos longos?',
        'Ronca alto, respira pela boca, engasga ou parece fazer pausas respiratórias durante o sono?',
        'Dorme de forma muito agitada, com movimentos intensos, gritos, sustos ou despertares confusos?',
        'Apresenta sonolência excessiva, cansaço ou dificuldade para despertar durante o dia?',
        'Fica mais irritada, hiperativa, impulsiva ou desorganizada após noites ruins?',
        'Apresenta dificuldades de atenção, memória ou rendimento escolar possivelmente ligadas ao sono?',
        'Dorme e acorda em horários muito irregulares, dificultando a rotina familiar ou escolar?',
        'Usa telas próximo ao horário de dormir de forma que atrapalhe o início ou a qualidade do sono?',
        'Apresenta episódios noturnos que geram dúvida entre pesadelo, terror noturno, sonambulismo ou crise neurológica?',
        'O sono interfere de maneira importante na qualidade de vida da criança ou da família?'],
      subs:[{name:'Início e manutenção do sono',idx:[0,1,2,8,9]},{name:'Respiração e eventos noturnos',idx:[3,4,10]},{name:'Impacto diurno e familiar',idx:[5,6,7,11]}],
      cutoffs:[{max:7,label:'Sem alteração importante relatada',cls:'ok'},{max:14,label:'Dificuldades leves — orientar higiene do sono',cls:'warn'},{max:22,label:'Alteração clinicamente relevante — avaliação indicada',cls:'risk'},{max:36,label:'Impacto elevado — investigação prioritária',cls:'risk'}],
      traps:[{idx:[3],min:2,level:'prioritario',msg:'Roncos/pausas: investigar distúrbio respiratório do sono (SAOS).'},{idx:[10],min:2,level:'prioritario',msg:'Eventos noturnos: avaliação médica para diferenciar fenômenos do sono de crises epilépticas.'},{idx:[5],min:2,msg:'Sonolência diurna: avaliar sono insuficiente, medicações e comorbidades.'}] },

    { id:'npe-br-011', code:'NPE-BR-011', sigla:'DLEG-12', emoji:'📖',
      title:'Leitura/Escrita: dificuldade específica (dislexia) vs global', aud:'escola', audLabel:'Professor/cuidador/clínico',
      band:'6–17 anos', min:72, max:215, periodo:'Últimos meses', restrito:false, aviso:true,
      domain:'Aprendizagem (dislexia × dificuldade global)', kw:['dislexia','leitura','escrita','aprendizagem','consciência fonológica','dificuldade global','deficiência intelectual'],
      fim:'Triagem para distinguir dificuldade ESPECÍFICA de leitura/escrita (perfil dislexia) de dificuldade GLOBAL de aprendizagem (investigar DI). Contrasta marcadores de leitura com funcionamento geral.',
      options:opts(O_003),
      items:['Lê devagar, soletra ou adivinha palavras muito além do esperado para a série?',
        'Troca, omite ou inverte letras/sílabas ao ler ou escrever de forma persistente?',
        'Tem dificuldade para associar letra–som, perceber rimas ou separar sílabas (consciência fonológica)?',
        'Comete muitos erros ortográficos persistentes, mesmo após ensino adequado?',
        'A leitura/escrita está claramente abaixo do esperado, apesar de esforço e ensino regular?',
        'Cansa-se, evita ou resiste muito a tarefas de leitura/escrita especificamente?',
        'Tem dificuldade para entender explicações faladas, conversas ou resolver problemas do dia a dia (fora da leitura)?',
        'Tem dificuldade em raciocínio, lógica, jogos ou atividades práticas que NÃO dependem de ler?',
        'Tem dificuldade importante em autonomia diária (vestir-se, higiene, lidar com dinheiro, tarefas) para a idade?',
        'Demorou para alcançar marcos globais (fala, linguagem, desenvolvimento) de forma ampla?',
        'A dificuldade aparece em quase TODAS as áreas (matemática, oral, prática), não só leitura/escrita?',
        'Comparado a colegas, o desempenho é mais baixo de forma AMPLA, não apenas na leitura?'],
      subs:[{name:'Marcadores de leitura/escrita (específicos)',idx:[0,1,2,3,4,5]},{name:'Funcionamento geral/adaptativo',idx:[6,7,8,9,10,11]}],
      differential:{ a:{name:'Marcadores de leitura/escrita',idx:[0,1,2,3,4,5]}, b:{name:'Funcionamento geral/adaptativo',idx:[6,7,8,9,10,11]},
        rules:[
          {when:'a>=7 && b<=5',label:'Perfil sugestivo de DISLEXIA (dificuldade específica de leitura/escrita)',cls:'risk',note:'Leitura/escrita afetadas com funcionamento geral relativamente preservado. Encaminhar avaliação fonoaudiológica/psicopedagógica e consciência fonológica. Não fecha diagnóstico.'},
          {when:'a>=7 && b>=8',label:'Dificuldade mais GLOBAL — diferenciar DI leve',cls:'risk',note:'Dificuldade ampla (não só leitura). Sugerir avaliação cognitiva/neuropsicológica e de funcionamento adaptativo (ver NPE-BR-012). Não fecha diagnóstico.'},
          {when:'a<=6 && b>=8',label:'Dificuldade global predominante',cls:'warn',note:'Sinais difusos com leitura menos específica. Avaliar cognição, adaptação e contexto.'},
          {when:'a<=6 && b<=5',label:'Poucos sinais nesta triagem',cls:'ok',note:'Acompanhar e reavaliar conforme evolução escolar.'}
        ] } },

    { id:'npe-br-012', code:'NPE-BR-012', sigla:'FADI-12', emoji:'🧩',
      title:'Funcionamento Adaptativo e Suspeita de DI Leve', aud:'familia', audLabel:'Pais/cuidador/clínico',
      band:'4–17 anos', min:48, max:215, periodo:'Funcionamento habitual', restrito:false, aviso:true,
      domain:'Funcionamento adaptativo (suspeita de DI leve)', kw:['deficiência intelectual','di leve','funcionamento adaptativo','autonomia','aprendizagem global','atraso cognitivo'],
      fim:'Triagem de funcionamento adaptativo (comunicação, vida diária, social, acadêmico) para apoiar suspeita de DI leve. Não mede QI; complementa avaliação cognitiva.',
      options:opts(O_006),
      items:['Compreende e usa a linguagem (vocabulário, instruções, explicações) no nível esperado para a idade?',
        'Resolve problemas do dia a dia e aprende com a experiência como esperado para a idade?',
        'Tem autonomia em higiene, vestir-se e autocuidado compatível com a idade?',
        'Lida com dinheiro, horários, tarefas e responsabilidades simples conforme a idade?',
        'Aprende conteúdos escolares (leitura, escrita, matemática) no ritmo esperado para a série?',
        'Generaliza o que aprende para situações novas, sem precisar reensino constante?',
        'Interage socialmente, entende regras sociais e mantém amizades adequadas à idade?',
        'Percebe riscos e se protege em situações cotidianas como esperado para a idade?',
        'Comunica-se de forma funcional para pedir, narrar e se fazer entender?',
        'Participa de jogos, brincadeiras e atividades com regras compatíveis com a idade?',
        'Atingiu marcos de desenvolvimento (fala, motor, autonomia) dentro do esperado ao longo da vida?',
        'O conjunto das dificuldades aparece em VÁRIAS áreas da vida (casa, escola, social), de forma ampla?'],
      subs:[{name:'Conceitual (linguagem, aprendizagem, raciocínio)',idx:[0,1,4,5]},{name:'Prático (autonomia, autocuidado, riscos)',idx:[2,3,7,10]},{name:'Social e comunicação',idx:[6,8,9]},{name:'Amplitude/impacto global',idx:[11]}],
      cutoffs:[{max:6,label:'Funcionamento adaptativo dentro do esperado nesta triagem',cls:'ok'},{max:13,label:'Algumas áreas a acompanhar — orientar estimulação',cls:'warn'},{max:22,label:'Limitações adaptativas relevantes — avaliação cognitiva/adaptativa indicada',cls:'risk'},{max:36,label:'Limitações amplas — avaliação neuropsicológica/multiprofissional prioritária (diferenciar DI)',cls:'risk'}],
      traps:[{idx:[11],min:2,level:'prioritario',msg:'Dificuldades AMPLAS em várias áreas: sugerir avaliação cognitiva e de funcionamento adaptativo (diferenciar DI leve de dificuldade específica como dislexia — ver NPE-BR-011).'},{idx:[10],min:2,msg:'Atraso global de marcos — considerar avaliação do desenvolvimento.'}] }
  ];

  function decorate(s){
    var max = (s.options ? s.options.length - 1 : 3) * s.items.length;
    return {
      id:s.id, title:s.emoji + ' ' + s.title + ' (' + s.code + ')', short_title:s.code + ' · ' + s.sigla, emoji:s.emoji,
      code:s.code, sigla:s.sigla, audience:s.aud, audience_label:s.audLabel, age_band:s.band, age_min_months:s.min, age_max_months:s.max,
      periodo:s.periodo, finalidade:s.fim, domain:s.domain, symptoms:s.kw.slice(0,5), complaints:s.kw,
      keywords:s.kw.concat([s.code, s.sigla, 'autoral', 'neuroped', 'npe-br', s.domain]),
      nature:'autoral', kind:'autoral NPE-BR', applicable:true, npe:true, restrito:!!s.restrito, aviso:!!s.aviso,
      page:'instrumento-autoral.html', anchor:s.id, priority:185,
      options:s.options, items:s.items, subs:s.subs || null, cutoffs:s.cutoffs || null,
      traps:s.traps || null, suggest:s.suggest || null, sentinel:s.sentinel || null,
      gate_message:s.gate_message || null, risk_mode:!!s.risk_mode, risk_rules:s.risk_rules || null,
      levels:s.levels || null, protective:s.protective || null, aviso_oficial:s.aviso_oficial || null, score_max:max,
      plain_questions:s.items, // fallback de busca
      clinical_use:s.fim, differentiator:'Instrumento autoral brasileiro (série NPE-BR) — itens próprios, faixas como ponto de atenção operacional.',
      not_normative_disclaimer:DISC
    };
  }
  window.NEUROPED_NPE = INSTR.map(decorate);
  var base = Array.isArray(window.NEUROPED_EDITORIAL_SCALES) ? window.NEUROPED_EDITORIAL_SCALES : [];
  var ids = new Set(base.map(function(x){ return x && x.id; }));
  window.NEUROPED_EDITORIAL_SCALES = base.concat(window.NEUROPED_NPE.filter(function(x){ return !ids.has(x.id); }));
  window.NEUROPED_NPE_COUNT = window.NEUROPED_NPE.length;
})();


/* ===== scales-impacto-medicacao.js ===== */
/* NeuroPed EDJ — Inventários de Impacto Pós-Medicação (autorais)
   Acompanhamento da RESPOSTA PERCEBIDA ao tratamento medicamentoso,
   em duas visões independentes (família e escola), para triangulação.
   Não medem eficácia farmacológica nem são escalas validadas. */
(function () {
  "use strict";

  var COMMON_DISC =
    "Inventário autoral de acompanhamento da resposta percebida ao tratamento. " +
    "Não é escala validada/normatizada, não mede eficácia farmacológica e não " +
    "estabelece conduta. A decisão sobre manter, ajustar ou suspender medicação é " +
    "exclusivamente médica, individual e presencial.";

  var IMPROVE_OPTIONS = ["Piorou", "Sem mudança", "Melhora leve", "Melhora moderada", "Melhora importante"];

  var SIDE_EFFECTS = [
    "Perda de apetite", "Dificuldade para dormir", "Dor de cabeça",
    "Dor de barriga / náusea", "Tristeza ou choro fácil", "Tiques (piscar, sons)",
    "Irritabilidade de rebote (fim da tarde)", "Sonolência excessiva",
    "Aceleração / coração disparado", "Apatia / 'criança apagada'"
  ];

  var IMPACTO = [
    {
      id: "npe-med-pais", code: "NPE-MED-PAIS",
      title: "💊 Impacto Pós-Medicação — Visão da Família",
      short_title: "Pós-medicação (família)",
      emoji: "💊",
      audience: "familia", audience_label: "Heterorrelato — família/cuidadores",
      respondent: ["pais"],
      age_min_months: 36, age_max_months: 216, age_band: "3–18 anos",
      domain: "Resposta terapêutica / acompanhamento",
      nature: "autoral", npe: true,
      page: "impacto-medicacao.html", anchor: "pais",
      priority: 90,
      improvement_scale: true,
      options: IMPROVE_OPTIONS,
      side_effects: SIDE_EFFECTS,
      symptoms: ["melhora pós-medicação", "atenção", "comportamento", "sono", "apetite", "efeitos colaterais"],
      keywords: ["medicacao", "medicação", "remedio", "remédio", "metilfenidato", "ritalina", "concerta",
        "risperidona", "aripiprazol", "melhora", "pos medicacao", "pós medicação", "efeito colateral",
        "colateral", "tratamento", "resposta ao tratamento", "reavaliacao", "reavaliação", "acompanhamento"],
      complaints: ["medicacao", "tdah", "tea", "comportamento", "sono", "apetite", "humor"],
      plain_questions: [
        "A atenção/concentração da criança melhorou em casa e nas tarefas?",
        "A agitação/inquietude diminuiu?",
        "A impulsividade (agir sem pensar, interromper) diminuiu?",
        "A irritabilidade/oposição/birras melhoraram?",
        "O humor e a interação em casa melhoraram?",
        "A organização para começar e terminar atividades melhorou?",
        "O sono melhorou (pegar no sono e manter)?",
        "O apetite/alimentação se manteve adequado?",
        "A rotina do dia acontece com menos conflito?",
        "No geral, a família percebe que valeu a pena manter o tratamento?"
      ],
      not_normative_disclaimer: COMMON_DISC
    },
    {
      id: "npe-med-escola", code: "NPE-MED-ESC",
      title: "💊 Impacto Pós-Medicação — Visão da Escola",
      short_title: "Pós-medicação (escola)",
      emoji: "💊",
      audience: "escola", audience_label: "Heterorrelato — escola/professores",
      respondent: ["escola"],
      age_min_months: 48, age_max_months: 216, age_band: "4–18 anos",
      domain: "Resposta terapêutica / acompanhamento",
      nature: "autoral", npe: true,
      page: "impacto-medicacao.html", anchor: "escola",
      priority: 90,
      improvement_scale: true,
      options: IMPROVE_OPTIONS,
      side_effects: SIDE_EFFECTS,
      symptoms: ["melhora pós-medicação", "atenção em aula", "tarefas", "impulsividade", "rendimento", "disciplina"],
      keywords: ["medicacao", "medicação", "remedio", "remédio", "metilfenidato", "ritalina", "concerta",
        "melhora", "pos medicacao", "pós medicação", "efeito colateral", "tratamento", "resposta ao tratamento",
        "professor", "professora", "escola", "rendimento", "aula", "reavaliacao", "reavaliação", "acompanhamento"],
      complaints: ["medicacao", "tdah", "escola", "aprendizagem", "comportamento"],
      plain_questions: [
        "A atenção nas aulas melhorou?",
        "A criança termina as tarefas dentro do tempo?",
        "A agitação / sair do lugar diminuiu?",
        "A impulsividade (responder sem esperar, interromper) diminuiu?",
        "A criança espera a vez e segue combinados com mais facilidade?",
        "A interação com colegas melhorou?",
        "A organização do material e da agenda melhorou?",
        "O rendimento em leitura, escrita ou cálculo melhorou?",
        "Houve menos queixas disciplinares/ocorrências?",
        "No geral, a escola percebe diferença positiva no aprendizado?"
      ],
      not_normative_disclaimer: COMMON_DISC
    }
  ];

  window.NEUROPED_IMPACTO = IMPACTO;
  // dedup por id (mesmo padrão dos demais merges) — evita reentrar a mesma escala
  var __npBase = window.NEUROPED_EDITORIAL_SCALES || [];
  var __npIds = new Set(__npBase.map(function (x) { return x && x.id; }));
  window.NEUROPED_EDITORIAL_SCALES = __npBase.concat(IMPACTO.filter(function (x) { return x && !__npIds.has(x.id); }));
})();


/* ===== scales-oficiais.js ===== */
/* NeuroPed EDJ — CATÁLOGO de instrumentos oficiais de terceiros.
   CONFORMIDADE: NÃO reproduz itens/perguntas protegidas no app público.
   Cada item é um CARD pesquisável (nome, sigla, finalidade, faixa, respondente,
   palavras-chave, STATUS jurídico/clínico e link para a FONTE OFICIAL).
   Não são contabilizados como instrumentos autorais aplicáveis. */
(function () {
  'use strict';
  if (window.NEUROPED_OFICIAIS_LOADED) return;
  window.NEUROPED_OFICIAIS_LOADED = true;

  var AUD = { familia:'Família', escola:'Escola', autoteste:'Autoteste', clinico:'Clínico', misto:'Múltiplos respondentes' };

  function mk(o){
    return {
      id:'ofc-' + o.id, title:o.title, short_title:o.sigla || o.title, sigla:o.sigla || '',
      emoji:o.emoji || '📚', audience:o.aud || 'clinico', audience_label:AUD[o.aud || 'clinico'],
      age_band:o.band || 'pediátrico', age_min_months:o.min == null ? 0 : o.min, age_max_months:o.max == null ? 215 : o.max,
      domain:o.area, finalidade:o.fim, status:o.status, official_url:o.url,
      official_catalog:true, applicable:false, nature:'oficial', kind:'fonte oficial',
      symptoms:o.kw.slice(0,5), complaints:o.kw, keywords:o.kw.concat([o.sigla, o.area, 'fonte oficial', 'oficial', 'validado']),
      page:'', anchor:'', priority:o.pri || 90,
      plain_questions:[], clinical_use:o.fim,
      differentiator:'Instrumento oficial de terceiros — catalogado com fonte. ' + o.status,
      not_normative_disclaimer:'Instrumento oficial de terceiros. Itens não reproduzidos no app por conformidade de licença. ' + o.status + ' Acesse a fonte oficial para uso conforme os termos.'
    };
  }

  var OFC = [
    mk({ id:'psc', title:'Pediatric Symptom Checklist (PSC / Y-PSC / PSC-17)', sigla:'PSC', emoji:'🧠', aud:'familia',
      band:'4–16 anos', min:48, max:200, area:'Saúde mental global', pri:96,
      fim:'Rastreio psicossocial amplo (emocional, comportamental e atencional). Variantes PSC-35, Y-PSC, PSC-17 e Y-PSC-17. Versão Portuguese (Brazilian-American).',
      status:'Fonte oficial — integração clínica privada futura.',
      url:'https://www.massgeneral.org/psychiatry/treatments-and-services/pediatric-symptom-checklist',
      kw:['comportamento','humor','ansiedade','atenção','dificuldade escolar','sofrimento emocional','psicossocial'] }),
    mk({ id:'crafft', title:'CRAFFT 2.1 / 2.1+N — uso de substâncias', sigla:'CRAFFT', emoji:'🚬', aud:'autoteste',
      band:'12–21 anos', min:144, max:252, area:'Substâncias (adolescente)', pri:92,
      fim:'Rastreio de álcool, drogas, nicotina e vaping no adolescente. Versões 2.1 e 2.1+N, PT-BR oficial.',
      status:'Integração condicionada à autorização formal da equipe CRAFFT.',
      url:'https://crafft.org/get-the-crafft/',
      kw:['álcool','drogas','substâncias','nicotina','vape','vaping','adolescência','comportamento de risco'] }),
    mk({ id:'asq', title:'Ask Suicide-Screening Questions (ASQ Toolkit)', sigla:'ASQ', emoji:'🆘', aud:'clinico',
      band:'≥ 8 anos', min:96, max:215, area:'Segurança / risco de suicídio', pri:98,
      fim:'Triagem breve de segurança para necessidade de avaliação imediata de risco. Uso em ambiente clínico.',
      status:'Exige fluxo profissional de segurança — sem aplicação pública aberta.',
      url:'https://www.nimh.nih.gov/research/research-conducted-at-nimh/asq-toolkit-materials',
      kw:['segurança','risco','suicídio','autolesão','crise','humor grave','adolescente'] }),
    mk({ id:'cssrs', title:'Columbia Suicide Severity Rating Scale (C-SSRS)', sigla:'C-SSRS', emoji:'🛟', aud:'clinico',
      band:'pediátrico/adolescente', min:60, max:215, area:'Segurança / risco de suicídio', pri:98,
      fim:'Avaliação de ideação e comportamento suicida (Columbia Protocol). Orienta condutas de segurança.',
      status:'Exige fluxo profissional de segurança — sem preenchimento público.',
      url:'https://cssrs.columbia.edu/the-columbia-scale-c-ssrs/about-the-scale/',
      kw:['segurança','risco','suicídio','autolesão','crise','ideação','humor grave'] }),
    mk({ id:'mchat', title:'M-CHAT-R/F — rastreio de autismo (16–30 meses)', sigla:'M-CHAT-R/F', emoji:'🌱', aud:'familia',
      band:'16–30 meses', min:16, max:30, area:'TEA precoce', pri:97,
      fim:'Rastreio de probabilidade de TEA em crianças pequenas, com etapa de seguimento.',
      status:'Somente fonte oficial no app público — não republicar itens sem licença.',
      url:'https://www.mchatscreen.com/',
      kw:['tea','autismo','linguagem','comunicação social','brincar','criança pequena','rastreio'] }),
    mk({ id:'sdq', title:'Strengths and Difficulties Questionnaire (SDQ)', sigla:'SDQ', emoji:'🧩', aud:'misto',
      band:'2–17 anos', min:24, max:215, area:'Comportamento / saúde mental', pri:95,
      fim:'Triagem de sintomas emocionais, conduta, hiperatividade, relações com pares e pró-social. Pais, professores e autorrelato.',
      status:'Somente fonte oficial — não criar versão preenchível sem autorização.',
      url:'https://www.sdqinfo.org/',
      kw:['comportamento','hiperatividade','tdah','emoção','escola','pares','pró-social','conduta'] }),
    mk({ id:'phq-gad', title:'PHQ-9 / PHQ-A / GAD-7 — humor e ansiedade', sigla:'PHQ/GAD', emoji:'🌧️', aud:'autoteste',
      band:'≥ 11 anos', min:132, max:215, area:'Depressão e ansiedade (adolescente)', pri:94,
      fim:'Triagem de sintomas depressivos (PHQ-9/PHQ-A) e ansiosos (GAD-7) no adolescente.',
      status:'Termos de integração eletrônica a confirmar — catálogo e fonte por enquanto.',
      url:'https://www.phqscreeners.com/',
      kw:['humor','depressão','ansiedade','preocupação','adolescente','phq','gad'] }),
    mk({ id:'rcads', title:'Revised Child Anxiety and Depression Scale (RCADS)', sigla:'RCADS', emoji:'😟', aud:'misto',
      band:'criança/adolescente', min:72, max:215, area:'Ansiedade e humor', pri:90,
      fim:'Sintomas ansiosos e depressivos, incluindo diferentes manifestações de ansiedade. Versões criança e pais.',
      status:'Termos de integração eletrônica a confirmar.',
      url:'https://www.childfirst.ucla.edu/resources/',
      kw:['ansiedade','humor','depressão','medo','fobia','ansiedade de separação'] }),
    mk({ id:'pswqc', title:'Penn State Worry Questionnaire for Children (PSWQ-C)', sigla:'PSWQ-C', emoji:'🌀', aud:'autoteste',
      band:'criança/adolescente', min:72, max:215, area:'Ansiedade / preocupação', pri:88,
      fim:'Avaliação de preocupação excessiva e persistente em crianças e adolescentes.',
      status:'Termos de integração eletrônica a confirmar.',
      url:'https://www.childfirst.ucla.edu/resources/',
      kw:['ansiedade','preocupação','ruminação','medo'] }),
    mk({ id:'mtt', title:'My Thoughts about Therapy (Youth / Caregiver)', sigla:'MTT', emoji:'💭', aud:'misto',
      band:'criança/adolescente + cuidador', min:72, max:215, area:'Seguimento terapêutico', pri:80,
      fim:'Monitora percepção e engajamento do paciente/cuidador no processo terapêutico. Não é instrumento diagnóstico.',
      status:'Termos de integração eletrônica a confirmar.',
      url:'https://www.childfirst.ucla.edu/resources/',
      kw:['terapia','adesão','engajamento','acompanhamento'] }),
    mk({ id:'swyc', title:'Survey of Well-being of Young Children (SWYC / PPSC / POSI / BPSC)', sigla:'SWYC', emoji:'👶', aud:'familia',
      band:'primeira infância', min:0, max:65, area:'Desenvolvimento (primeira infância)', pri:93,
      fim:'Triagem ampla de desenvolvimento, comportamento e indicadores precoces de comunicação social. Inclui PPSC, POSI e BPSC.',
      status:'Termos de redistribuição eletrônica e tradução PT a confirmar.',
      url:'https://www.theswyc.org/',
      kw:['atraso do desenvolvimento','atraso de fala','comportamento','tea precoce','lactente','pré-escolar','posi'] }),
    mk({ id:'vanderbilt', title:'NICHQ Vanderbilt Assessment Scales (TDAH)', sigla:'NICHQ Vanderbilt', emoji:'⚡', aud:'misto',
      band:'6–12 anos', min:72, max:155, area:'TDAH', pri:95,
      fim:'Avaliação estruturada de desatenção, hiperatividade/impulsividade, prejuízo funcional e comorbidades. Pais e professores.',
      status:'Termos de integração eletrônica e versão PT a confirmar.',
      url:'https://nichq.org/resource/nichq-vanderbilt-assessment-scales',
      kw:['tdah','desatenção','hiperatividade','impulsividade','escola','oposição'] }),
    mk({ id:'gmfcs', title:'GMFCS-E&R — função motora grossa (paralisia cerebral)', sigla:'GMFCS-E&R', emoji:'🦽', aud:'clinico',
      band:'criança/adolescente', min:24, max:215, area:'Paralisia cerebral / motor', pri:90,
      fim:'Classifica a função motora grossa na PC (mobilidade, marcha, transferências, dispositivos). Não é escala diagnóstica.',
      status:'Acesso técnico oficial — classificação funcional.',
      url:'https://www.canchild.ca/en/resources/42-gross-motor-function-classification-system-expanded-revised-gmfcs-e-r',
      kw:['paralisia cerebral','motor','mobilidade','marcha','cadeira de rodas','gmfcs'] }),
    mk({ id:'macs', title:'MACS — Manual Ability Classification System (PC)', sigla:'MACS', emoji:'✋', aud:'clinico',
      band:'4–18 anos', min:48, max:215, area:'Paralisia cerebral / habilidade manual', pri:88,
      fim:'Classifica como crianças com PC usam as mãos para manusear objetos no cotidiano.',
      status:'Acesso técnico oficial — classificação funcional.',
      url:'https://macs.nu/',
      kw:['paralisia cerebral','mão','habilidade manual','manipulação','motor fino'] }),
    mk({ id:'minimacs', title:'Mini-MACS — habilidade manual na primeira infância (PC)', sigla:'Mini-MACS', emoji:'🤏', aud:'clinico',
      band:'1–4 anos', min:12, max:59, area:'Paralisia cerebral / habilidade manual', pri:86,
      fim:'Classifica habilidade manual funcional em crianças pequenas com PC. Versão brasileira disponível na fonte.',
      status:'Acesso técnico oficial — classificação funcional.',
      url:'https://macs.nu/',
      kw:['paralisia cerebral','criança pequena','função manual','motor fino'] }),
    mk({ id:'cdc-milestones', title:'Marcos do Desenvolvimento — CDC "Learn the Signs. Act Early."', sigla:'CDC Milestones', emoji:'🗓️', aud:'familia',
      band:'0–5 anos', min:0, max:71, area:'Vigilância do desenvolvimento', pri:92,
      fim:'Apoia a vigilância de marcos (comunicação, cognição, socialização, motor). Ferramenta educativa de vigilância, não teste diagnóstico.',
      status:'Acesso educativo oficial (CDC).',
      url:'https://www.cdc.gov/ncbddd/actearly/milestones/index.html',
      kw:['atraso do desenvolvimento','marcos','atraso de fala','motor','interação social','vigilância'] })
  ];

  window.NEUROPED_OFICIAIS = OFC;
  var base = Array.isArray(window.NEUROPED_EDITORIAL_SCALES) ? window.NEUROPED_EDITORIAL_SCALES : [];
  var ids = new Set(base.map(function(x){ return x && x.id; }));
  window.NEUROPED_EDITORIAL_SCALES = base.concat(OFC.filter(function(x){ return !ids.has(x.id); }));
  window.NEUROPED_OFICIAIS_COUNT = OFC.length;
})();

/* Expansão oficial lote 2: carregada antes da curadoria nos módulos de Filtro e Mapa.
   O uso de document.write aqui ocorre apenas durante a análise inicial das páginas estáticas,
   garantindo que o catálogo adicional esteja disponível antes de scales-curate.js. */
if (!window.NEUROPED_OFICIAIS_LOTE2_LOADED && document.readyState === 'loading') {
  document.write('<script src="./scales-oficiais-lote2.js"><\/script>');
}

/* ===== scales-curate.js ===== */
/* NeuroPed EDJ — Curadoria do catálogo (roda por último).
   Carrega o lote NPE-BR-013 a NPE-BR-024 antes da curadoria para que
   os novos testes sejam contados como aplicáveis e ranqueados no filtro.
   Publica NEUROPED_CATALOG_STATS, incluindo fontes oficiais separadas. */
(function () {
  'use strict';
  function curate(){
    if (window.NEUROPED_CURATED) return; window.NEUROPED_CURATED = true;
    var all = Array.isArray(window.NEUROPED_EDITORIAL_SCALES) ? window.NEUROPED_EDITORIAL_SCALES : [];
    function isGen(s){ var a = (s.anchor || '') + ' ' + (s.id || ''); return /aut453-|gmax|global/.test(a); }
    function band(m){ m = m || 0; return m < 72 ? 'p' : (m < 144 ? 's' : 't'); }
    var KEEP_AUD = { familia:1, escola:1, clinico:1 };
    function kindOf(s){
      if (s.validated) return 'validado';
      var t = (s.title || '').toLowerCase();
      if (/diári|diario|controle diário|registro de|monitor/.test(t)) return 'diário';
      if (/teste direto/.test(t)) return 'teste direto';
      if (/invent[áa]rio/.test(t)) return 'inventário';
      if (/checklist|plano|guia:|carta|gatilhos|agenda visual|metas/.test(t)) return 'ferramenta';
      return 'rastreio';
    }
    var seen = {}, keep = [];
    all.forEach(function (s) {
      if (s.official_catalog) { s.nature = 'oficial'; s.kind = 'fonte oficial'; s.applicable = false; keep.push(s); return; }
      if (!s.nature) s.nature = 'triagem autoral';
      if (!s.kind) s.kind = kindOf(s);
      if (!isGen(s)) { keep.push(s); return; }
      if (!KEEP_AUD[s.audience]) return;
      var k = s.domain + '|' + band(s.age_min_months) + '|' + s.audience;
      if (seen[k]) return; seen[k] = 1; keep.push(s);
    });
    window.NEUROPED_EDITORIAL_SCALES = keep;
    var doms = {}, oficiais = 0, curados = 0, variacoes = 0, byKind = {};
    keep.forEach(function (s) {
      byKind[s.kind] = (byKind[s.kind] || 0) + 1;
      if (s.official_catalog) { oficiais++; return; }
      doms[s.domain] = 1;
      if (isGen(s)) variacoes++; else curados++;
    });
    window.NEUROPED_CATALOG_STATS = { total:curados+variacoes, aplicaveis:curados+variacoes, curados:curados, variacoes:variacoes, oficiais:oficiais, dominios:Object.keys(doms).length, distintos:curados, porTipo:byKind };
  }
  window.NeuroPedCurate = curate;
  if (!window.NEUROPED_NPE_LOTE2_LOADED && document.readyState === 'loading') {
    document.write('<script src="./scales-autorais-npe-lote2.js"><\/script><script>window.NeuroPedCurate();<\/script>');
  } else { curate(); }
})();

/* ===== scales-red-flags.js ===== */
/* NeuroPed — Sinais de alerta (red flags) por queixa.
 *
 * Apoio à DECISÃO, não diagnóstico: quando o filtro detecta uma queixa, este
 * módulo destaca os sinais que sugerem PRIORIDADE/URGÊNCIA de avaliação.
 * Conteúdo educativo, conservador, alinhado à conduta de não substituir o exame.
 *
 * Estrutura: NEUROPED_RED_FLAGS[tag] = { urgente:[...], prioritario:[...] }
 *  - urgente     → encaminhamento/avaliação imediata
 *  - prioritario → avaliação em curto prazo, não postergar
 *
 * Fontes de referência (marcos e sinais amplamente consolidados): CDC Developmental
 * Milestones, M-CHAT-R/F (uso), diretrizes gerais de neuropediatria/pediatria.
 */
(function () {
  'use strict';
  window.NEUROPED_RED_FLAGS = {
    fala: {
      prioritario: [
        'Sem balbucio até 12 meses; sem palavras até 16 meses',
        'Sem frases de 2 palavras (espontâneas, não ecolálicas) até 24 meses',
        'Não atende pelo nome / pouco contato visual associado',
      ],
      urgente: [
        'Perda/regressão de linguagem ou de habilidades sociais em qualquer idade',
      ],
    },
    tea: {
      prioritario: [
        'Pouco contato visual, ausência de apontar protodeclarativo até 18 meses',
        'Ausência de atenção compartilhada / brincar de faz de conta até 24 meses',
        'Padrões restritos/repetitivos com prejuízo funcional',
      ],
      urgente: [
        'Regressão de linguagem ou social (perda de marcos já adquiridos)',
      ],
    },
    tdah: {
      prioritario: [
        'Prejuízo em ≥2 contextos (casa e escola) com impacto acadêmico/social',
        'Sintomas presentes antes dos 12 anos e persistentes (≥6 meses)',
      ],
      urgente: [
        'Impulsividade com risco real (correr para rua, acidentes de repetição)',
      ],
    },
    escola: {
      prioritario: [
        'Dificuldade de leitura/escrita desproporcional à idade/escolaridade',
        'Queda abrupta de rendimento ou recusa escolar persistente',
      ],
    },
    comportamento: {
      prioritario: [
        'Oposição/agressão com prejuízo funcional e sofrimento familiar',
        'Padrão persistente (>6 meses) e desproporcional à idade',
      ],
      urgente: [
        'Agressão com risco a si ou a terceiros',
      ],
    },
    agressividade: {
      urgente: [
        'Auto ou heteroagressão com risco de lesão',
        'Crises de descontrole com perda de contato/segurança',
      ],
    },
    sono: {
      prioritario: [
        'Ronco alto habitual com pausas respiratórias (suspeita de apneia)',
        'Sonolência diurna excessiva afetando aprendizagem',
      ],
    },
    alimentacao: {
      urgente: [
        'Engasgos de repetição / sinais de aspiração',
        'Recusa alimentar com perda de peso ou desidratação',
      ],
      prioritario: [
        'Seletividade extrema com restrição nutricional',
      ],
    },
    ansiedade: {
      prioritario: [
        'Evitação que impede escola/rotina/sono',
        'Sintomas físicos recorrentes (dor abdominal, cefaleia) sem causa orgânica',
      ],
    },
    humor: {
      urgente: [
        'Ideação de morte, desesperança ou menção a não querer viver',
      ],
      prioritario: [
        'Tristeza/irritabilidade persistente (≥2 semanas) com perda de interesse',
      ],
    },
    motor: {
      prioritario: [
        'Não senta sem apoio aos 9 meses; não anda aos 18 meses',
        'Assimetria de movimento / preferência de mão antes de 12–18 meses',
      ],
      urgente: [
        'Perda de marcos motores já adquiridos (regressão)',
        'Hipotonia importante ou fraqueza progressiva',
      ],
    },
    sensorial: {
      prioritario: [
        'Reações sensoriais que impedem alimentação, higiene ou convívio',
      ],
    },
    epilepsia: {
      urgente: [
        'Crise > 5 minutos ou crises subentrantes (emergência)',
        'Primeira crise, crise com febre atípica, ou alteração de consciência prolongada',
        'Olhar parado com perda de contato e quedas inexplicadas recorrentes',
      ],
    },
    cefaleia: {
      urgente: [
        'Cefaleia que acorda à noite ou piora pela manhã com vômitos',
        'Piora progressiva, sinais neurológicos focais ou alteração de comportamento',
        'Pior cefaleia da vida / início súbito e intenso',
      ],
    },
    autonomia: {
      prioritario: [
        'Perda de autonomia já adquirida (regressão de AVDs)',
      ],
    },
    risco: {
      urgente: [
        'Ideação ou comportamento de autolesão/suicídio — acionar fluxo de segurança',
        'Plano, acesso a meios ou tentativa prévia',
      ],
    },
    medicacao: {
      prioritario: [
        'Efeito colateral relevante (apetite, sono, humor, cardiovascular)',
        'Ausência de resposta após titulação adequada — reavaliar diagnóstico/dose',
      ],
    },
  };
})();
