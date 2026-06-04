/* ============================================================
   NeuroPed EDJ — np-lgpd-consent.js · Consentimento LGPD + direitos do titular
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
    var payload = { app: 'NeuroPed EDJ', exported_at: new Date().toISOString(), note: 'Cópia dos dados guardados neste aparelho (portabilidade LGPD).', data: collect() };
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
    try { console.log('[NeuroPed]', msg); } catch (e) {}
  }

  /* ---------- Modal de consentimento (1ª vez) ---------- */
  function gate() {
    if (document.getElementById('np-lgpd-gate')) return;
    // SEM backdrop-filter: no iOS Safari um pai com backdrop-filter faz os FILHOS
    // não renderizarem — a caixa do consentimento sumia e a tela travava borrada.
    var scrim = el('div', 'position:fixed;inset:0;z-index:2147483630;display:grid;place-items:center;padding:18px;' +
      'background:rgba(3,2,16,.9)');
    scrim.id = 'np-lgpd-gate'; scrim.setAttribute('role', 'dialog'); scrim.setAttribute('aria-modal', 'true'); scrim.setAttribute('aria-labelledby', 'np-lgpd-h');
    var box = el('div', 'max-width:560px;width:100%;max-height:88vh;overflow:auto;border-radius:20px;padding:22px 20px;' +
      'background:#0f1223;color:#E5E7EB;border:1px solid rgba(169,164,255,.22);box-shadow:0 30px 80px rgba(0,0,0,.6);' +
      'font:15px/1.55 -apple-system,Segoe UI,Roboto,sans-serif');
    box.innerHTML =
      '<h2 id="np-lgpd-h" style="margin:0 0 6px;font:700 19px Georgia,serif;color:#f2dca6">Privacidade e natureza da ferramenta</h2>' +
      '<p style="margin:0 0 10px;color:#cfd3e6"><b>O NeuroPed EDJ é uma ferramenta educativa e de triagem.</b> Os instrumentos autorais são de triagem <b>não normatizada</b> e <b>não substituem</b> avaliação, diagnóstico ou conduta de um profissional.</p>' +
      '<div style="background:rgba(124,118,210,.10);border:1px solid rgba(169,164,255,.16);border-radius:14px;padding:12px 14px;margin:0 0 12px">' +
        '<p style="margin:0 0 8px"><b>Sobre seus dados (LGPD):</b></p>' +
        '<ul style="margin:0;padding-left:18px;color:#cfd3e6">' +
          '<li>São dados de <b>saúde</b> (sensíveis), frequentemente de <b>crianças</b>.</li>' +
          '<li>Ficam <b>armazenados localmente neste aparelho/navegador</b> — não em servidor, por padrão.</li>' +
          '<li>Finalidade: apoio educativo e organização clínica. Base legal: <b>seu consentimento</b>.</li>' +
          '<li>Você pode <b>exportar</b> (portabilidade) ou <b>apagar</b> (eliminação) seus dados a qualquer momento, pelo botão 🛡️ no canto da tela.</li>' +
        '</ul>' +
      '</div>' +
      '<p style="margin:0 0 14px;font-size:13px;color:#94A3B8">Leia a <a href="' + POLICY + '" target="_blank" rel="noopener" style="color:#a9a4ff">Política de Privacidade</a> e os <a href="' + TERMS + '" target="_blank" rel="noopener" style="color:#a9a4ff">Termos de Uso</a>.</p>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap">' +
        '<button id="np-lgpd-ok" style="flex:1;min-width:160px;border:0;border-radius:12px;padding:13px 16px;font:800 14px system-ui;cursor:pointer;color:#fff;background:linear-gradient(135deg,#7C3AED,#4F46E5)">Li e concordo — continuar</button>' +
        '<button id="np-lgpd-no" style="border:1px solid rgba(169,164,255,.3);border-radius:12px;padding:13px 16px;font:700 14px system-ui;cursor:pointer;color:#cfd3e6;background:transparent">Recusar</button>' +
      '</div>';
    scrim.appendChild(box);
    document.body.appendChild(scrim);
    document.documentElement.style.overflow = 'hidden';
    var okBtn = box.querySelector('#np-lgpd-ok');
    var noBtn = box.querySelector('#np-lgpd-no');
    function declineMsg() { window.alert('Sem o consentimento não é possível usar as áreas que guardam dados pessoais. Você pode fechar a página ou ler a Política de Privacidade.'); }
    // foco preso no diálogo; Esc não fecha à força (exibe a explicação de recusa)
    var release = trapFocus(box, function () { try { noBtn.focus(); } catch (e) {} declineMsg(); });
    okBtn.addEventListener('click', function () {
      setConsent(); document.documentElement.style.overflow = ''; release(); scrim.remove(); mountShield();
    });
    noBtn.addEventListener('click', declineMsg);
    setTimeout(function () { try { okBtn.focus(); } catch (e) {} }, 30); // foco no botão primário
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
      '<p style="margin:0 0 12px;font-size:13.5px;color:#94A3B8">Seus dados ficam <b>neste aparelho</b>. Use os botões abaixo para exercer seus direitos (LGPD).</p>' +
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
