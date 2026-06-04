/* ============================================================
   NeuroPed SDG — scales-evidence-panel.js
   ------------------------------------------------------------
   Carrega curated-evidence/instruments.json e injeta um painel
   colapsável "📚 Evidência curada" sob o cabeçalho da escala
   no escala.html, quando o ID/título bate com um instrumento
   curado pelo PROMPT SUPREMO v2.0.

   Filosofia:
     - Camada PURA de display sobre dados frios (zero dependência
       de scales-bundle.js / scales-taxonomy)
     - Idempotente: só injeta uma vez por instrumento
     - Fallback silencioso quando o JSON não bate
     - CSP-safe: sem eval, sem fetch externo (só arquivo local)
     - Respeita prefers-reduced-motion

   Conteúdo do painel:
     - Resumo curto + faixa etária + tipo
     - Cutoffs / faixas de pontuação (formato lista)
     - Métricas-chave com nível (✔/≈/⚠)
     - Red flags
     - Contatos de emergência (quando aplicável)
     - Referências PubMed clicáveis (DOI)
   ============================================================ */
(function(){
  'use strict';
  if (window.__npEvidencePanel) return;
  window.__npEvidencePanel = true;

  var DATA_URL = './curated-evidence/instruments.json';
  var cache = null;
  var loading = false;
  var waiters = [];

  function fetchData(cb){
    if (cache) return cb(null, cache);
    waiters.push(cb);
    if (loading) return;
    loading = true;
    fetch(DATA_URL, { cache: 'no-store' })
      .then(function(r){ return r.ok ? r.json() : null; })
      .then(function(j){
        cache = j;
        waiters.splice(0).forEach(function(fn){ try { fn(null, j); } catch(e){} });
      })
      .catch(function(err){
        cache = null;
        waiters.splice(0).forEach(function(fn){ try { fn(err, null); } catch(e){} });
      });
  }

  function norm(s){
    return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').trim();
  }

  function paramId(){
    var p = new URLSearchParams(location.search).get('id');
    if (p) return p;
    var h = (location.hash || '').replace(/^#+/, '');
    return h || '';
  }

  function pageTitleText(){
    var el = document.getElementById('title');
    return el ? (el.textContent || '').trim() : '';
  }

  function matches(instr, idHint, titleHint){
    var idN = norm(idHint), titleN = norm(titleHint);
    var pool = [norm(instr.id), norm(instr.title), norm(instr.fullName)]
      .concat((instr.aliases || []).map(norm));
    if (idN) {
      for (var i = 0; i < pool.length; i++) if (pool[i] && (pool[i] === idN || idN.indexOf(pool[i]) >= 0 || pool[i].indexOf(idN) >= 0)) return true;
    }
    if (titleN) {
      for (var j = 0; j < pool.length; j++) if (pool[j] && (titleN.indexOf(pool[j]) >= 0 || pool[j].indexOf(titleN) >= 0)) return true;
    }
    return false;
  }

  function findInstrument(data, idHint, titleHint){
    if (!data || !data.instruments) return null;
    for (var i = 0; i < data.instruments.length; i++) {
      if (matches(data.instruments[i], idHint, titleHint)) return data.instruments[i];
    }
    return null;
  }

  function esc(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
      return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c];
    });
  }

  function levelBadge(level){
    var map = {
      verified: { sym: '✔', color: '#34d399', bg: 'rgba(52,211,153,.14)', border: 'rgba(52,211,153,.35)', label: 'Verificado' },
      consensus: { sym: '≈', color: '#fbbf24', bg: 'rgba(251,191,36,.14)', border: 'rgba(251,191,36,.35)', label: 'Consenso' },
      unverified: { sym: '⚠', color: '#f87171', bg: 'rgba(248,113,113,.14)', border: 'rgba(248,113,113,.35)', label: 'Não confirmado' }
    };
    var m = map[level] || map.consensus;
    return '<span title="' + m.label + '" style="display:inline-flex;align-items:center;gap:3px;padding:1px 6px;border-radius:999px;font:800 10px/1 system-ui;background:' + m.bg + ';color:' + m.color + ';border:1px solid ' + m.border + ';margin-left:6px;letter-spacing:.02em">' + m.sym + ' ' + m.label + '</span>';
  }

  function listSection(title, items, renderItem){
    if (!items || !items.length) return '';
    var lis = items.map(renderItem).join('');
    return '<section style="margin-top:12px"><h4 style="margin:0 0 6px;font:800 11px system-ui;letter-spacing:.06em;text-transform:uppercase;color:#a9a4d8">' + esc(title) + '</h4><ul style="list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px">' + lis + '</ul></section>';
  }

  function render(instr){
    var phaseColor = instr.phase === 1 ? '#34d399' : (instr.phase === 2 ? '#60a5fa' : '#e7c98b');
    var head =
      '<header style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;flex-wrap:wrap">' +
        '<div style="flex:1;min-width:0">' +
          '<div style="font:800 16px Georgia,serif;color:#fff;letter-spacing:-.01em">' + esc(instr.title) + '</div>' +
          '<div style="font-size:12px;color:#a9a4d8;margin-top:2px">' + esc(instr.fullName || '') + '</div>' +
        '</div>' +
        '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex-shrink:0">' +
          '<span style="padding:3px 9px;border-radius:999px;font:800 10px/1 system-ui;background:' + phaseColor + '22;color:' + phaseColor + ';border:1px solid ' + phaseColor + '55;letter-spacing:.04em">FASE ' + esc(instr.phase) + '</span>' +
          '<span style="font:600 11px/1.2 system-ui;color:#a9a4d8">' + esc(instr.ageRange) + ' · ' + esc(instr.domain) + '</span>' +
        '</div>' +
      '</header>';

    var summary = instr.shortSummary
      ? '<p style="margin:10px 0 0;color:#cdc8ee;font-size:13px;line-height:1.55">' + esc(instr.shortSummary) + '</p>'
      : '';

    var cutoffs = listSection('Cutoffs / faixas', instr.cutoffs, function(c){
      return '<li style="display:flex;gap:8px;font-size:12.5px;color:#cdc8ee;line-height:1.5">' +
        '<strong style="color:#e7c98b;flex:0 0 auto;min-width:120px">' + esc(c.label) + '</strong>' +
        '<span>' + esc(c.rule) + '</span></li>';
    });

    var metrics = listSection('Métricas-chave', instr.keyMetrics, function(m){
      var ci = m.ci ? ' <span style="color:#8b86b8">(IC95% ' + esc(m.ci) + ')</span>' : '';
      return '<li style="font-size:12.5px;color:#cdc8ee;line-height:1.5">' +
        '<strong style="color:#fff">' + esc(m.value) + '</strong>' + ci +
        levelBadge(m.level) +
        '<br><span style="font-size:11.5px;color:#a9a4d8">' + esc(m.name) + '</span></li>';
    });

    var redFlags = listSection('🚩 Red flags', instr.redFlags, function(f){
      return '<li style="font-size:12.5px;color:#fda4af;line-height:1.5;padding-left:8px;border-left:2px solid rgba(248,113,113,.5)">' + esc(f) + '</li>';
    });

    var emergency = '';
    if (instr.emergencyContacts && instr.emergencyContacts.length) {
      emergency = '<section style="margin-top:12px;padding:10px;background:rgba(248,113,113,.10);border:1px solid rgba(248,113,113,.35);border-radius:10px">' +
        '<h4 style="margin:0 0 6px;font:800 11px system-ui;letter-spacing:.06em;text-transform:uppercase;color:#fda4af">📞 Emergência</h4>' +
        '<ul style="list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:4px">' +
        instr.emergencyContacts.map(function(c){
          return '<li style="font-size:12.5px;color:#fff;font-weight:700">' +
            esc(c.label) + ' · ' + esc(c.phone) +
            (c.available ? ' <span style="font-size:11px;font-weight:500;color:#fda4af">(' + esc(c.available) + ')</span>' : '') +
            '</li>';
        }).join('') + '</ul></section>';
    }

    var references = '';
    if (instr.references && instr.references.length) {
      references = '<section style="margin-top:12px">' +
        '<h4 style="margin:0 0 6px;font:800 11px system-ui;letter-spacing:.06em;text-transform:uppercase;color:#a9a4d8">Referências PubMed</h4>' +
        '<ul style="list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:4px">' +
        instr.references.map(function(r){
          var doi = r.doi ? '<a href="https://doi.org/' + encodeURI(r.doi) + '" target="_blank" rel="noopener" style="color:#7c79ff;text-decoration:none;font-weight:700">DOI</a>' : '';
          var pmid = r.pmid ? '<a href="https://pubmed.ncbi.nlm.nih.gov/' + encodeURIComponent(r.pmid) + '/" target="_blank" rel="noopener" style="color:#7c79ff;text-decoration:none;font-weight:700;margin-right:6px">PMID ' + esc(r.pmid) + '</a>' : '';
          var note = r.note ? ' <em style="color:#8b86b8;font-size:11px">' + esc(r.note) + '</em>' : '';
          return '<li style="font-size:11.5px;color:#cdc8ee;line-height:1.5">' +
            esc(r.author) + '. <em>' + esc(r.journal) + '</em>. ' + esc(r.year) + '. ' + pmid + doi + note +
            '</li>';
        }).join('') + '</ul></section>';
    }

    var footer = '<footer style="margin-top:12px;padding-top:10px;border-top:1px dashed rgba(124,118,210,.24);font-size:10.5px;color:#8b86b8;line-height:1.5">' +
      '⚕️ Curadoria PROMPT SUPREMO v2.0 · Triagem ≠ Diagnóstico · Não é ponto de corte automático para conduta.' +
      '</footer>';

    return head + summary + cutoffs + metrics + redFlags + emergency + references + footer;
  }

  function mountPanel(instr){
    if (document.getElementById('npEvidencePanel')) return;
    var target = document.querySelector('#detail, main, body');
    if (!target) return;

    var details = document.createElement('details');
    details.id = 'npEvidencePanel';
    details.open = false;
    details.style.cssText = [
      'margin:14px 0',
      'padding:14px 16px',
      'border:1px solid rgba(124,118,210,.30)',
      'border-radius:16px',
      'background:linear-gradient(180deg,rgba(124,118,210,.10),rgba(124,118,210,.04))',
      'box-shadow:0 10px 30px -16px rgba(2,2,12,.6)'
    ].join(';');

    var summaryEl = document.createElement('summary');
    summaryEl.style.cssText = [
      'cursor:pointer','list-style:none','user-select:none',
      'display:flex','align-items:center','gap:8px',
      'font:800 13px system-ui','letter-spacing:.02em','color:#e7c98b'
    ].join(';');
    summaryEl.innerHTML = '<span aria-hidden="true" style="font-size:18px">📚</span>' +
      '<span>Evidência curada · ' + esc(instr.title) + '</span>' +
      '<span style="margin-left:auto;font-size:11px;font-weight:600;color:#a9a4d8;letter-spacing:.04em">tocar para expandir</span>';

    var body = document.createElement('div');
    body.style.cssText = 'margin-top:10px';
    body.innerHTML = render(instr);

    details.appendChild(summaryEl);
    details.appendChild(body);

    // Posição: logo após o #title se existir, senão antes do #detail
    var anchor = document.getElementById('meta') || document.getElementById('title');
    if (anchor && anchor.parentNode) {
      anchor.parentNode.insertBefore(details, anchor.nextSibling);
    } else if (target.firstChild) {
      target.insertBefore(details, target.firstChild);
    } else {
      target.appendChild(details);
    }
  }

  function tryMount(){
    var idHint = paramId();
    var titleHint = pageTitleText();
    if (!idHint && !titleHint) return false;
    fetchData(function(err, data){
      if (err || !data) return;
      var instr = findInstrument(data, idHint, titleHint);
      if (instr) mountPanel(instr);
    });
    return true;
  }

  function boot(){
    var tries = 0;
    var t = setInterval(function(){
      tries++;
      var titleEl = document.getElementById('title');
      var hasTitle = titleEl && titleEl.textContent && titleEl.textContent.trim() && titleEl.textContent !== 'Carregando…';
      if (hasTitle || tries > 40) {
        tryMount();
        clearInterval(t);
      }
    }, 200);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
