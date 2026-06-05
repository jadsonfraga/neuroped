/* ============================================================
   NeuroPed SDG — np-lgpd-consent.js · Consentimento LGPD + direitos do titular
   ============================================================
   Corrige duas lacunas de conformidade ao abrir o app para pacientes/famílias:

   (#3 LGPD)  Antes de qualquer uso que guarde dados, mostra UMA vez um aviso de
              consentimento claro: que são dados de SAÚDE (sensíveis), muitas
              vezes de CRIANÇAS, que ficam ARMAZENADOS LOCALMENTE NESTE APARELHO
              (não em servidor por padrão), com finalidade de apoio educativo/
              organização clínica, base legal = consentimento, e que o titular
              pode EXPORTAR (portabilidade) e APAGAR (esquecimento) a qualquer
              momento — direitos exercíveis por um botão sempre disponível.

   (#1 natureza) Reforça que a ferramenta é EDUCATIVA / de TRIAGEM não normatizada
              e NÃO substitui avaliação ou diagnóstico médico.

   Honesto: isto NÃO torna o app "100% conforme LGPD" (DPO, RIPD, retenção
   formal e base server-side são organizacionais) — mas implementa o mínimo
   exigível ao titular: informação, consentimento, portabilidade e eliminação.

   Idempotente · só no topo (não em iframe) · respeita prefers-reduced-motion.
   Carrega via <script src="./np-lgpd-consent.js" defer></script>.
   ============================================================ */
(function () {
  'use strict';
  if (window.__npLgpd) return; window.__npLgpd = true;
  try { if (window.self !== window.top) return; } catch (e) { return; } // só no topo

  var KEY = 'np_lgpd_consent_v1';
  var VERSION = 2;                 // suba para forçar novo aceite quando a política mudar
  var POLICY = './privacidade.html', TERMS = './terms-of-use.html';

  // Páginas onde NÃO bloqueamos (políticas, erro, restrito) — evita laço.
  var here = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  var NO_GATE = /^(privacidade|privacy-policy|terms-of-use|acessibilidade|restricted|404)\.html$/.test(here);

  function consent() { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; } }
  function hasConsent() { var c = consent(); return !!(c && c.ok && c.v >= VERSION); }
  function setConsent() { try { localStorage.setItem(KEY, JSON.stringify({ ok: true, v: VERSION, ts: Date.now() })); } catch (e) {} }

  function el(tag, css, html) { var d = document.createElement(tag); if (css) d.style.cssText = css; if (html != null) d.innerHTML = html; return d; }

  /* ---------- Exportar / apagar dados (direitos do titular) ---------- */
  function collect() {
    var out = {}; try {
      for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); out[k] = localStorage.getItem(k); }
    } catch (e) {}
    return out;
  }
  function exportData() {
    var payload = { app: 'NeuroPed SDG', exported_at: new Date().toISOString(), note: 'Cópia dos dados guardados neste aparelho (portabilidade LGPD).', data: collect() };
    try {
      var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      var a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = 'neuroped-meus-dados-' + new Date().toISOString().slice(0, 10) + '.json';
      document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); if (a.parentNode) a.parentNode.removeChild(a); }, 1500);
      toast('Backup gerado. Guarde o arquivo em local seguro.');
    } catch (e) { toast('Não foi possível exportar neste navegador.'); }
  }
  function eraseData() {
    var n = 0; try { n = localStorage.length; } catch (e) {}
    var ok = window.confirm('Apagar TODOS os dados do NeuroPed guardados neste aparelho (' + n + ' itens)?\n\nIsto é irreversível: avaliações, diários, perfis e preferências locais serão removidos. Exporte um backup antes, se desejar.');
    if (!ok) return;
    try { localStorage.clear(); } catch (e) {}
    try { sessionStorage.clear(); } catch (e) {}
    try {
      if (window.indexedDB && indexedDB.databases) indexedDB.databases().then(function (dbs) { (dbs || []).forEach(function (d) { try { indexedDB.deleteDatabase(d.name); } catch (e) {} }); });
    } catch (e) {}
    alert('Dados apagados deste aparelho. A página será recarregada.');
    location.reload();
  }
  function toast(msg) {
    try { if (typeof window.npToast === 'function') { window.npToast(msg); return; } } catch (e) {}
    // Fallback autossuficiente (0 console em produção): toast efêmero no DOM,
    // visível ao usuário (o console.log anterior não era). Não depende do DS.
    try {
      var el = document.createElement('div');
      el.setAttribute('role', 'status');
      el.style.cssText = 'position:fixed;left:50%;bottom:20px;transform:translateX(-50%);z-index:2147483647;max-width:90vw;padding:10px 14px;border-radius:12px;background:#15152e;color:#f5f3ff;font:500 13px system-ui;box-shadow:0 8px 24px rgba(0,0,0,.4)';
      el.textContent = String(msg);
      (document.body || document.documentElement).appendChild(el);
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 4000);
    } catch (e) {}
  }

  /* ---------- Modal de consentimento (1ª vez) ---------- */
  function gate() {
    if (document.getElementById('np-lgpd-gate')) return;
    // Aviso NÃO-BLOQUEANTE: faixa fixa no RODAPÉ. Sem scrim de tela cheia, sem
    // travar o scroll, sem prender foco — elimina qualquer "tela bloqueada"
    // (inclusive bugs de iOS com overlay). Fundo sólido = sempre visível/clicável.
    var scrim = null;
    var box = el('div', 'position:fixed;left:0;right:0;bottom:0;z-index:2147483630;max-height:82vh;overflow:auto;' +
      'padding:14px 16px calc(14px + env(safe-area-inset-bottom,0px));border-top:1px solid rgba(169,164,255,.28);' +
      'background:#0f1223;color:#E5E7EB;box-shadow:0 -18px 50px rgba(0,0,0,.55);' +
      'font:14px/1.5 -apple-system,Segoe UI,Roboto,sans-serif');
    box.id = 'np-lgpd-gate'; box.setAttribute('role', 'region'); box.setAttribute('aria-label', 'Aviso de privacidade');
    box.innerHTML =
      '<div style="max-width:820px;margin:0 auto;display:flex;gap:12px 16px;align-items:center;flex-wrap:wrap;justify-content:space-between">' +
        '<div style="flex:1;min-width:220px;font-size:13px;color:#cfd3e6">' +
          '<b style="color:#f2dca6">Privacidade · ferramenta educativa.</b> Triagem <b>não normatizada</b> — não substitui avaliação médica. Dados de saúde ficam <b>só neste aparelho</b> (LGPD); exporte/apague pelo 🛡️. ' +
          '<a href="' + POLICY + '" target="_blank" rel="noopener" style="color:#a9a4ff">Política</a> · ' +
          '<a href="' + TERMS + '" target="_blank" rel="noopener" style="color:#a9a4ff">Termos</a>.' +
        '</div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
          '<button id="np-lgpd-ok" style="border:0;border-radius:11px;padding:11px 18px;font:800 13px system-ui;cursor:pointer;color:#fff;background:linear-gradient(135deg,#7C3AED,#4F46E5)">Li e concordo</button>' +
          '<button id="np-lgpd-no" style="border:1px solid rgba(169,164,255,.3);border-radius:11px;padding:11px 14px;font:700 13px system-ui;cursor:pointer;color:#cfd3e6;background:transparent">Recusar</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(box);
    var okBtn = box.querySelector('#np-lgpd-ok');
    var noBtn = box.querySelector('#np-lgpd-no');
    function declineMsg() { window.alert('Sem o consentimento não é possível usar as áreas que guardam dados pessoais. Você pode fechar a página ou ler a Política de Privacidade.'); }
    okBtn.addEventListener('click', function () { setConsent(); box.remove(); mountShield(); });
    if (noBtn) noBtn.addEventListener('click', declineMsg);
  }

  /* ---------- Botão sempre disponível: direitos do titular ---------- */
  function mountShield() {
    if (document.getElementById('np-lgpd-shield') || !document.body) return;
    var b = el('button', 'position:fixed;right:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));z-index:99984;' +
      'width:42px;height:42px;border-radius:50%;display:grid;place-items:center;font-size:18px;cursor:pointer;' +
      'background:#14132e;color:#ECEAFF;border:1px solid rgba(169,164,255,.28);' +
      'box-shadow:0 12px 30px -12px rgba(4,3,18,.7)');
    b.id = 'np-lgpd-shield'; b.type = 'button'; b.textContent = '🛡️';
    b.title = 'Privacidade e meus dados'; b.setAttribute('aria-label', 'Privacidade e meus dados');
    b.addEventListener('click', sheet);
    document.body.appendChild(b);
  }
  function sheet() {
    if (document.getElementById('np-lgpd-sheet')) return;
    var scrim = el('div', 'position:fixed;inset:0;z-index:2147483631;display:flex;align-items:flex-end;justify-content:center;' +
      'background:rgba(3,2,16,.82)');
    scrim.id = 'np-lgpd-sheet';
    var box = el('div', 'max-width:520px;width:100%;border-radius:20px 20px 0 0;padding:18px 18px calc(18px + env(safe-area-inset-bottom,0px));' +
      'background:#0f1223;color:#E5E7EB;border:1px solid rgba(169,164,255,.22);box-shadow:0 -20px 60px rgba(0,0,0,.5);font:15px/1.5 -apple-system,Segoe UI,Roboto,sans-serif');
    box.innerHTML =
      '<h3 style="margin:0 0 4px;font:700 17px Georgia,serif;color:#f2dca6">Privacidade e meus dados</h3>' +
      '<p style="margin:0 0 8px;font-size:13.5px;color:#94A3B8">Seus dados ficam <b>neste aparelho</b>. Use os botões abaixo para exercer seus direitos (LGPD).</p>' +
      '<p style="margin:0 0 12px;font-size:12.5px;color:#e6c98b;background:rgba(231,201,139,.10);border:1px solid rgba(231,201,139,.24);border-radius:10px;padding:8px 11px">📵 <b>Computador compartilhado</b> (biblioteca, escola, lan house)? <b>Apague os dados ao sair</b> para a próxima pessoa não vê-los.</p>' +
      '<div style="display:grid;gap:8px">' +
        '<button id="np-lgpd-export" style="border:0;border-radius:12px;padding:13px;font:800 14px system-ui;cursor:pointer;color:#fff;background:linear-gradient(135deg,#7C3AED,#4F46E5)">⬇️ Exportar meus dados (backup)</button>' +
        '<button id="np-lgpd-erase" style="border:1px solid rgba(244,63,94,.4);border-radius:12px;padding:13px;font:800 14px system-ui;cursor:pointer;color:#fda4af;background:rgba(244,63,94,.10)">🗑️ Apagar todos os dados deste aparelho</button>' +
        '<a href="' + POLICY + '" style="text-align:center;border:1px solid rgba(169,164,255,.24);border-radius:12px;padding:12px;font:700 14px system-ui;text-decoration:none;color:#cfd3e6">📄 Política de Privacidade</a>' +
        '<button id="np-lgpd-close" style="border:0;border-radius:12px;padding:11px;font:700 13px system-ui;cursor:pointer;color:#94A3B8;background:transparent">Fechar</button>' +
      '</div>';
    scrim.appendChild(box); document.body.appendChild(scrim);
    var release = trapFocus(box, function () { close(); });   // Esc fecha a folha
    function close() { release(); scrim.remove(); }
    scrim.addEventListener('click', function (e) { if (e.target === scrim) close(); });
    box.querySelector('#np-lgpd-export').addEventListener('click', exportData);
    box.querySelector('#np-lgpd-erase').addEventListener('click', eraseData);
    box.querySelector('#np-lgpd-close').addEventListener('click', close);
    setTimeout(function () { try { box.querySelector('#np-lgpd-export').focus(); } catch (e) {} }, 30);
  }

  /* ---------- Acessibilidade: foco preso, Tab cíclico, Esc, retorno de foco ---------- */
  function focusables(c) {
    return Array.prototype.slice.call(c.querySelectorAll(
      'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea,[tabindex]:not([tabindex="-1"])'
    )).filter(function (n) { return n.offsetParent !== null || n === document.activeElement; });
  }
  function trapFocus(container, onEsc) {
    var prev = document.activeElement;
    function onKey(e) {
      if (e.key === 'Escape') { if (onEsc) { e.preventDefault(); onEsc(); } return; }
      if (e.key !== 'Tab') return;
      var f = focusables(container); if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    document.addEventListener('keydown', onKey, true);
    return function release() {
      document.removeEventListener('keydown', onKey, true);
      try { if (prev && prev.focus) prev.focus(); } catch (e) {}
    };
  }

  function init() {
    mountShield();
    if (!NO_GATE && !hasConsent()) gate();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
