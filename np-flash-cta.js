/* =====================================================================
   NeuroPed · np-flash-cta.js · v9.9 (M6 do prompt mestre, gap UX 3.1)
   Dr. Jadson Fraga · CRM-PE 25227 · RQE 17756
   ---------------------------------------------------------------------
   Injeta CTA "Triar sem cadastrar" abaixo do hero da home, antes do
   primeiro card. Reativo. Some se a página não for index/home.
   ===================================================================== */
(function () {
  "use strict";
  if (window.__npFlashCTA) return; window.__npFlashCTA = true;

  const isHome = () => {
    const p = location.pathname || "";
    return /\/(index\.html)?$/.test(p) || p.endsWith("/neuroped/") || p === "/neuroped";
  };

  function injectStyles() {
    if (document.getElementById("np-flash-cta-style")) return;
    const css = `
      .np-flash-cta {
        display: flex; align-items: center; justify-content: center; gap: 12px;
        margin: 24px auto; max-width: 640px; padding: 14px 22px;
        border: 1px solid rgba(124,121,255,.32);
        background: linear-gradient(135deg, rgba(124,121,255,.10), rgba(157,155,255,.04));
        border-radius: 999px; backdrop-filter: saturate(180%) blur(10px);
        color: #F5F3FF; font-family: "Inter", system-ui, sans-serif; font-size: 15px; font-weight: 600;
        text-decoration: none; cursor: pointer; user-select: none;
        transition: transform .2s cubic-bezier(0.16,1,0.30,1), border-color .2s cubic-bezier(0.16,1,0.30,1), background .2s cubic-bezier(0.16,1,0.30,1);
        min-height: 56px;
      }
      .np-flash-cta:hover { transform: translateY(-2px); border-color: rgba(124,121,255,.6); background: linear-gradient(135deg, rgba(124,121,255,.18), rgba(157,155,255,.06)); }
      .np-flash-cta__icon { width: 26px; height: 26px; border-radius: 50%; background: #7C79FF; color: #fff; display: grid; place-items: center; font-size: 14px; box-shadow: 0 0 16px rgba(124,121,255,.6); }
      .np-flash-cta__txt strong { display: block; }
      .np-flash-cta__sub  { display: block; font-weight: 500; opacity: .75; font-size: 12px; letter-spacing: .04em; }
    `;
    const s = document.createElement("style"); s.id = "np-flash-cta-style"; s.textContent = css;
    document.head.appendChild(s);
  }

  function buildCTA() {
    const a = document.createElement("a");
    a.className = "np-flash-cta";
    a.href = "./filtro-escalas.html?mode=flash";
    a.setAttribute("data-np-flash", "");
    a.setAttribute("data-np-tap", "");
    a.innerHTML =
      '<span class="np-flash-cta__icon" aria-hidden="true">⚡</span>' +
      '<span class="np-flash-cta__txt">' +
      '<strong>Triar sem cadastrar →</strong>' +
      '<span class="np-flash-cta__sub">Modo consulta-flash · efêmero · sem identificação</span>' +
      "</span>";
    return a;
  }

  function inject() {
    if (!isHome()) return true;
    if (document.querySelector(".np-flash-cta")) return true;
    // Tenta achar o hero/stats area
    const candidates = [
      document.querySelector('[class*="hero" i]'),
      document.querySelector("main"),
      document.querySelector("#root > div"),
      document.body
    ].filter(Boolean);
    const host = candidates[0];
    if (!host) return false;
    injectStyles();
    const cta = buildCTA();
    // Insere depois do primeiro filho (que é tipicamente o hero card)
    if (host.children.length >= 2) host.insertBefore(cta, host.children[1]);
    else host.appendChild(cta);
    return true;
  }

  function init() {
    if (inject()) return;
    const obs = new MutationObserver(() => { if (inject()) { /* mantém para re-renders */ } });
    obs.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => obs.disconnect(), 20000);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
