/* =====================================================================
   NeuroPed · np-flash-mode.js · v9.8 · Modo Consulta-Flash
   Dr. Jadson Fraga · CRM-PE 25227 · RQE 17756
   ---------------------------------------------------------------------
   Destrava a engine sem cadastro de paciente. Apenas idade + queixa
   em sessionStorage. Estado efêmero — saiu da aba, sumiu.

   Ativação:
     · URL  ?mode=flash
     · API  NPFlash.enter({age_months, complaints})
     · Botão data-np-flash em qualquer página
   ===================================================================== */
(function (global) {
  "use strict";

  const SS_KEY = "neuroped.flash.session.v1";

  function isFlashRoute() {
    return /[?&]mode=flash(\b|&|$)/.test(global.location?.search || "")
        || global.location?.hash?.includes("mode=flash");
  }

  function readSession() {
    try { return JSON.parse(sessionStorage.getItem(SS_KEY) || "null"); } catch (_) { return null; }
  }
  function writeSession(s) {
    try { sessionStorage.setItem(SS_KEY, JSON.stringify(s)); } catch (_) {}
  }
  function clearSession() { try { sessionStorage.removeItem(SS_KEY); } catch (_) {} }

  function enter({ age_months, complaints, intent } = {}) {
    const session = {
      mode: "flash",
      started_at: Date.now(),
      age_months: age_months ?? null,
      chief_complaints: complaints || [],
      intent: intent || null,
      patient: { id: "flash-" + Date.now().toString(36), name: "Paciente em flash", ephemeral: true }
    };
    writeSession(session);
    paintBanner();
    return session;
  }

  function paintBanner() {
    if (document.getElementById("np-flash-banner")) return;
    const b = document.createElement("div");
    b.id = "np-flash-banner";
    b.setAttribute("role", "status");
    b.style.cssText = [
      "position:sticky", "top:64px", "z-index:9",
      "padding:.6rem 1rem", "display:flex", "align-items:center", "gap:.6rem",
      "background:linear-gradient(90deg, rgba(124,121,255,.18), transparent)",
      "color:var(--np-text,#F5F3FF)",
      "border-bottom:1px solid var(--np-edge, rgba(255,255,255,.06))",
      "font:600 .85rem/1.4 var(--np-font-text, system-ui)"
    ].join(";");
    b.innerHTML = `
      <span style="display:inline-flex;width:8px;height:8px;border-radius:999px;background:var(--np-accent,#7C79FF);box-shadow:0 0 12px var(--np-accent,#7C79FF);"></span>
      <span><strong>Modo Consulta-Flash</strong> — efêmero. Os dados somem quando você sair da aba.</span>
      <button id="np-flash-exit" style="margin-left:auto;background:transparent;border:1px solid var(--np-edge,#fff3);color:inherit;padding:.4rem .8rem;border-radius:999px;font:inherit;cursor:pointer">Sair</button>
    `;
    document.body.appendChild(b);
    document.getElementById("np-flash-exit").addEventListener("click", () => {
      exit();
      global.location.href = "./index.html";
    });
  }

  function exit() { clearSession(); document.getElementById("np-flash-banner")?.remove(); }

  function autoInit() {
    if (isFlashRoute() || readSession()) {
      const s = readSession() || enter();
      // tenta acoplar a engine V3.2 se presente
      try {
        const npc = global.NeuroPedClinical;
        if (npc?.scaleEngine && typeof npc.scaleEngine.recommend === "function") {
          // engine já lê query externa via .recommend(query) — só publica patient.
        }
      } catch (_) {}
      paintBanner();
    }
    document.querySelectorAll("[data-np-flash]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        enter();
        const target = btn.getAttribute("href") || "./filtro-escalas.html?mode=flash";
        global.location.href = target.includes("mode=flash") ? target : (target + (target.includes("?") ? "&" : "?") + "mode=flash");
      });
    });
  }

  if (typeof window !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", autoInit);
    else autoInit();
  }

  global.NPFlash = { enter, exit, readSession, isFlashRoute, version: "9.8.0" };
})(typeof window !== "undefined" ? window : globalThis);
