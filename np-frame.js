/* NeuroPed EDJ — np-frame.js
 * MOLDURA ÚNICA: mantém o usuário dentro da tela inicial bonita (SPA).
 * Intercepta cliques em links para as PÁGINAS-FERRAMENTA e as abre num
 * overlay em <iframe> por cima da home, com botão voltar — em vez de
 * navegar para fora. As páginas internas detectam EMBEDDED (self!==top)
 * e suprimem o próprio chrome, encaixando na moldura.
 *
 * Não-invasivo e idempotente: só age sobre <a href> reais para .html de
 * ferramenta. Se a home usar JS (sem âncora), não dispara — navegação normal.
 * Carrega via <script src="./np-frame.js" defer>.
 */
(function () {
  'use strict';
  if (window.__npFrame) return; window.__npFrame = true;
  // só no topo (nunca dentro de um iframe — senão empilharia molduras)
  try { if (window.self !== window.top) return; } catch (e) { return; }

  // páginas que abrem DENTRO da moldura (ferramentas da jornada)
  var TOOLS = /(?:^|\/)(filtro-escalas|escala|perfil-crianca|impacto-medicacao|instrumento|instrumento-autoral|diario-escola-terapias-v2|banco-escalas[a-z0-9-]*|comunicacao-alternativa|consulta|neuroped-master-biblioteca|intake|sobre-dr-jadson)\.html$/i;

  var ov = null, frame = null, titleEl = null, open = false;

  function style(){
    if (document.getElementById('np-frame-style')) return;
    var s = document.createElement('style'); s.id = 'np-frame-style';
    s.textContent =
      '.npf-ov{position:fixed;inset:0;z-index:100000;display:flex;flex-direction:column;background:#0a0a16;' +
        'opacity:0;transition:opacity .2s ease;visibility:hidden}' +
      '.npf-ov.show{opacity:1;visibility:visible}' +
      '.npf-bar{flex:0 0 auto;display:flex;align-items:center;gap:10px;padding:calc(env(safe-area-inset-top,0px) + 9px) 14px 9px;' +
        'background:linear-gradient(180deg,#15143a,#0e0e22);border-bottom:1px solid rgba(169,164,255,.16);box-shadow:0 6px 22px -14px rgba(0,0,0,.7)}' +
      '.npf-back{display:inline-flex;align-items:center;gap:7px;border:1px solid rgba(169,164,255,.24);background:rgba(124,118,210,.14);' +
        'color:#ECEAFF;border-radius:12px;padding:8px 13px;font:800 13px system-ui;cursor:pointer}' +
      '.npf-back:hover{background:rgba(124,118,210,.24)}' +
      '.npf-ttl{font:700 14px "Fraunces",Georgia,serif;color:#f2dca6;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
      '.npf-seal{width:26px;height:26px;border-radius:8px;overflow:hidden;flex:0 0 auto;margin-left:auto;box-shadow:0 0 0 1px rgba(231,201,139,.4)}' +
      '.npf-seal img{width:100%;height:100%;object-fit:cover;display:block}' +
      '.npf-stage{flex:1 1 auto;position:relative;overflow:hidden;background:#0a0a16}' +
      '.npf-frame{position:absolute;inset:0;width:100%;height:100%;border:0;background:#0a0a16}' +
      '.npf-load{position:absolute;inset:0;display:grid;place-items:center}' +
      '.npf-spin{width:38px;height:38px;border-radius:50%;border:3px solid rgba(169,164,255,.25);border-top-color:#a9a4ff;animation:npfspin .8s linear infinite}' +
      '@keyframes npfspin{to{transform:rotate(360deg)}}' +
      '@media(prefers-reduced-motion:reduce){.npf-ov{transition:none}.npf-spin{animation:none}}';
    document.head.appendChild(s);
  }

  function build(){
    if (ov) return;
    style();
    ov = document.createElement('div');
    ov.className = 'npf-ov'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true');
    ov.innerHTML =
      '<div class="npf-bar"><button type="button" class="npf-back" aria-label="Voltar">‹ Voltar</button>' +
        '<span class="npf-ttl"></span><span class="npf-seal"><img src="./logo-jadson.jpg" alt="" width="26" height="26"></span></div>' +
      '<div class="npf-stage"><div class="npf-load"><div class="npf-spin"></div></div>' +
        '<iframe class="npf-frame" title="Ferramenta" src="about:blank"></iframe></div>';
    document.body.appendChild(ov);
    frame = ov.querySelector('.npf-frame');
    titleEl = ov.querySelector('.npf-ttl');
    var load = ov.querySelector('.npf-load');
    frame.addEventListener('load', function(){ if (load) load.style.display = 'none'; try{ var t=frame.contentWindow.document.title; if(t) titleEl.textContent=t.split('—')[0].split('·')[0].trim().slice(0,40); }catch(e){} });
    ov.querySelector('.npf-back').addEventListener('click', function(){ closeFrame(true); });
    document.addEventListener('keydown', function(e){ if (open && e.key === 'Escape') closeFrame(true); });
  }

  function openTool(url, label){
    build();
    var load = ov.querySelector('.npf-load'); if (load) load.style.display = 'grid';
    titleEl.textContent = (label || 'Carregando…').slice(0, 40);
    frame.src = url;
    requestAnimationFrame(function(){ ov.classList.add('show'); var bk=ov.querySelector('.npf-back'); if(bk)bk.focus(); });
    open = true;
    document.documentElement.style.overflow = 'hidden';
    try { history.pushState({ npFrame: 1 }, '', '#ferramenta'); } catch (e) {}
  }
  function closeFrame(viaUser){
    if (!open) return;
    ov.classList.remove('show'); open = false;
    document.documentElement.style.overflow = '';
    setTimeout(function(){ if (frame) frame.src = 'about:blank'; }, 220);
    if (viaUser && history.state && history.state.npFrame) { try { history.back(); } catch (e) {} }
  }
  window.addEventListener('popstate', function(){ if (open) closeFrame(false); });

  document.addEventListener('click', function(e){
    if (e.defaultPrevented) return;
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target && e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    if (a.target && a.target !== '_self') return;
    if (a.hasAttribute('download')) return;
    if (a.origin && a.origin !== location.origin) return;
    var file = (a.pathname || '').split('/').pop().toLowerCase();
    if (!TOOLS.test(file)) return;                       // só páginas-ferramenta
    // abre DENTRO da moldura (capture: tem prioridade sobre o fade de saída)
    e.preventDefault(); e.stopImmediatePropagation();
    openTool(a.href, (a.textContent || '').trim());
  }, true);                                              // capture
})();
