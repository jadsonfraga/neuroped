/* NeuroPed EDJ - app-polish-mobile.js
 * Aspira "cara de app": bottom nav fixo no mobile, toast/sheet uniformes
 * (em vez de alert/confirm), splash boot, micro-interacoes.
 *
 * Idempotente. Carrega via <script src="./app-polish-mobile.js" defer>.
 * Nao toca os modulos existentes (master-access, scales-enhance, etc).
 */
(function(){
  'use strict';
  if (window.__npPolishMobile) return;
  window.__npPolishMobile = true;

  /* =====================================================
     1) Toast manager (substitui alert)
     ===================================================== */
  function toastStack(){
    var el = document.getElementById('npToastStack');
    if (el) return el;
    el = document.createElement('div');
    el.id = 'npToastStack';
    el.className = 'np-toast-stack';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.setAttribute('aria-atomic', 'false');
    document.body.appendChild(el);
    return el;
  }
  function toast(msg, kind){
    if (!msg) return;
    var stack = toastStack();
    var t = document.createElement('div');
    t.className = 'np-toast' + (kind ? ' ' + kind : '');
    t.textContent = String(msg);
    stack.appendChild(t);
    requestAnimationFrame(function(){ t.classList.add('show'); });
    var ttl = Math.max(2200, Math.min(6000, String(msg).length * 60));
    setTimeout(function(){
      t.classList.remove('show');
      setTimeout(function(){ if (t.parentNode) t.parentNode.removeChild(t); }, 300);
    }, ttl);
  }
  window.npToast = toast;

  /* =====================================================
     2) Bottom sheet (substitui confirm)
     ===================================================== */
  function sheet(opts){
    return new Promise(function(resolve){
      var bg = document.createElement('div');
      bg.className = 'np-sheet-backdrop';
      var box = document.createElement('div');
      box.className = 'np-sheet';
      box.setAttribute('role', 'dialog');
      box.setAttribute('aria-modal', 'true');
      if (opts.titleId) box.setAttribute('aria-labelledby', opts.titleId);
      var h = document.createElement('h3'); h.textContent = opts.title || 'Confirmar';
      var p = document.createElement('p'); p.textContent = opts.body || '';
      var row = document.createElement('div'); row.className = 'row';
      var cancel = document.createElement('button'); cancel.className = 'cancel'; cancel.textContent = opts.cancelLabel || 'Cancelar';
      var ok = document.createElement('button'); ok.className = opts.danger ? 'danger' : 'ok'; ok.textContent = opts.okLabel || 'OK';
      row.appendChild(cancel); row.appendChild(ok);
      box.appendChild(h); if (opts.body) box.appendChild(p); box.appendChild(row);
      bg.appendChild(box);
      document.body.appendChild(bg);
      requestAnimationFrame(function(){ bg.classList.add('show'); ok.focus(); });
      function close(value){
        bg.classList.remove('show');
        setTimeout(function(){ if (bg.parentNode) bg.parentNode.removeChild(bg); }, 220);
        resolve(value);
      }
      cancel.addEventListener('click', function(){ close(false); });
      ok.addEventListener('click', function(){ close(true); });
      bg.addEventListener('click', function(ev){ if (ev.target === bg) close(false); });
      document.addEventListener('keydown', function esc(ev){
        if (ev.key === 'Escape') { document.removeEventListener('keydown', esc); close(false); }
      });
    });
  }
  window.npConfirm = sheet;

  /* =====================================================
     3) Bottom nav (so no mobile)
     ===================================================== */
  var NAV_ITEMS = [
    { label: 'Inicio',   href: './index.html',                  ic: '🏠' },
    { label: 'Consulta', href: './consulta.html',               ic: '🩺' },
    { label: 'Escalas',  href: './filtro-escalas.html',         ic: '📋' },
    { label: 'CAA',      href: './comunicacao-alternativa.html', ic: '💬' },
    { label: 'Familia',  href: './portal-familia-livre.html',   ic: '🌿' }
  ];
  function bottomNav(){
    if (document.querySelector('.np-bottom-nav')) return;
    var nav = document.createElement('nav');
    nav.className = 'np-bottom-nav';
    nav.setAttribute('aria-label', 'Navegacao principal');
    var here = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    NAV_ITEMS.forEach(function(it){
      var hrefName = it.href.split('/').pop().toLowerCase();
      var a = document.createElement('a');
      a.href = it.href;
      a.setAttribute('aria-label', it.label);
      if (hrefName === here) a.setAttribute('aria-current', 'page');
      var ic = document.createElement('span'); ic.className = 'ic'; ic.setAttribute('aria-hidden', 'true'); ic.textContent = it.ic;
      var lbl = document.createElement('span'); lbl.className = 'lbl'; lbl.textContent = it.label;
      a.appendChild(ic); a.appendChild(lbl);
      nav.appendChild(a);
    });
    document.body.appendChild(nav);
  }

  /* =====================================================
     4) Splash boot (so primeira visita por sessao)
     ===================================================== */
  function splash(){
    try {
      if (sessionStorage.getItem('np_splash_shown')) return;
      sessionStorage.setItem('np_splash_shown', '1');
    } catch (e) {}
    var el = document.createElement('div');
    el.className = 'np-splash';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML =
      '<div class="logo">🧠</div>' +
      '<div class="name">NeuroPed EDJ</div>' +
      '<div class="tag">Dr. Jadson Fraga</div>' +
      '<div class="spinner"></div>';
    document.body.appendChild(el);
    setTimeout(function(){
      el.classList.add('hide');
      setTimeout(function(){ if (el.parentNode) el.parentNode.removeChild(el); }, 400);
    }, 650);
  }

  /* =====================================================
     5) Theme color dinamica (status bar do iOS/Android)
     ===================================================== */
  function themeColor(){
    var meta = document.querySelector('meta[name="theme-color"]:not([media])');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      meta.content = '#1a6b65';
      document.head.appendChild(meta);
    }
  }

  /* =====================================================
     6) Bridge alert/confirm -> toast/sheet (opcional, opt-in)
     Por padrao NAO sobrescreve para nao quebrar contratos
     existentes. Codigo novo pode usar npToast / npConfirm.
     ===================================================== */

  /* =====================================================
     Boot
     ===================================================== */
  function boot(){
    themeColor();
    splash();
    bottomNav();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
