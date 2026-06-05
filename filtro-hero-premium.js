/* =====================================================================
   NeuroPed · filtro-hero-premium.js · MP9.1
   Dr. Jadson Fraga · CRM-PE 25227 · RQE 17756
   ---------------------------------------------------------------------
   Injeta o hero editorial premium "Clinical Intelligence Engine" no
   filtro-escalas.html. Substitui o título antigo (texto neon roxo) por
   uma estrutura Apple-grade: eyebrow + título gradient + halo + sparkles.
   ===================================================================== */
(function () {
  "use strict";
  if (window.__npHeroCIE) return; window.__npHeroCIE = true;

  const SPARKLE_SVG = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
    '<path d="M12 2 L13.5 9.5 L21 11 L13.5 12.5 L12 20 L10.5 12.5 L3 11 L10.5 9.5 Z"/>' +
    '</svg>';

  function buildHero() {
    const sec = document.createElement("section");
    sec.className = "np-hero-cie";
    sec.setAttribute("aria-label", "Clinical Intelligence Engine");

    const halo = document.createElement("div");
    halo.className = "np-hero-cie__halo";
    halo.setAttribute("aria-hidden", "true");
    sec.appendChild(halo);

    [1,2,3,4,5].forEach(i => {
      const s = document.createElement("span");
      s.className = "np-hero-cie__spark np-hero-cie__spark--" + i;
      s.setAttribute("aria-hidden", "true");
      s.innerHTML = SPARKLE_SVG;
      sec.appendChild(s);
    });

    const inner = document.createElement("div");
    inner.className = "np-hero-cie__inner";
    inner.innerHTML =
      '<span class="np-hero-cie__eyebrow">Inteligência Clínica · NeuroPed</span>' +
      '<h1 class="np-hero-cie__title">' +
        '<span class="np-hero-cie__t1">Clinical Intelligence</span>' +
        '<span class="np-hero-cie__t2">Engine</span>' +
      '</h1>' +
      '<p class="np-hero-cie__sub">' +
        'Descreva <strong>idade + queixa</strong> — a busca prioriza os instrumentos ' +
        'certos do catálogo curado, com <em>evidência verificada</em> quando houver.' +
      '</p>' +
      '<div class="np-hero-cie__stats">' +
        '<div class="np-hero-cie__stat"><span class="np-hero-cie__stat-n">490</span><span class="np-hero-cie__stat-l">Catalogados</span></div>' +
        '<div class="np-hero-cie__stat"><span class="np-hero-cie__stat-n">71</span><span class="np-hero-cie__stat-l">Ativos</span></div>' +
        '<div class="np-hero-cie__stat"><span class="np-hero-cie__stat-n">18</span><span class="np-hero-cie__stat-l">Evidência A</span></div>' +
        '<div class="np-hero-cie__stat"><span class="np-hero-cie__stat-n">15</span><span class="np-hero-cie__stat-l">Domínios</span></div>' +
      '</div>';
    sec.appendChild(inner);
    return sec;
  }

  function isFiltro() {
    return /filtro-escalas\.html(\?|#|$)/.test(window.location.pathname + window.location.search + window.location.hash);
  }

  function findOldHero() {
    // procura por h1/título contendo "CLINICAL INTELLIGENCE" ou "Clinical Intelligence" ou imagem astronauta
    const candidates = Array.from(document.querySelectorAll("h1, h2, .hero, [class*=hero], [class*=title]"));
    return candidates.find(el => /clinical\s*intelligence/i.test(el.textContent || ""));
  }

  function replaceHero() {
    if (document.querySelector(".np-hero-cie")) return true;
    const old = findOldHero();
    if (!old) return false;
    const parent = old.closest("section, header, div, main") || old.parentElement;
    if (!parent) return false;
    // Esconder o título antigo + qualquer figura/img anterior (astronauta)
    const oldImg = parent.querySelector("img, svg");
    if (oldImg && /astron|robot|space/i.test((oldImg.alt || "") + (oldImg.outerHTML || ""))) {
      oldImg.style.display = "none";
    }
    old.style.display = "none";
    // Ocultar subtítulo se for irmão imediato com texto "Descreva idade"
    let sib = old.nextElementSibling;
    while (sib && /Descreva|idade\s*\+\s*queixa/i.test(sib.textContent || "")) {
      sib.style.display = "none";
      sib = sib.nextElementSibling;
    }
    parent.insertBefore(buildHero(), parent.firstChild);
    return true;
  }

  function init() {
    if (!isFiltro()) return;
    if (replaceHero()) return;
    const obs = new MutationObserver(() => { if (replaceHero()) obs.disconnect(); });
    obs.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => obs.disconnect(), 20000);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
