/* =====================================================================
   NeuroPed · np-study-access.js · v9.8 · Modal "Solicitar liberação"
   Dr. Jadson Fraga · CRM-PE 25227 · RQE 17756
   ---------------------------------------------------------------------
   Cards com tag "Estudo · restrito" recebem CTA secundário automático.
   Dispatcha "neuroped:study-access-requested" + persiste em localStorage.
   ===================================================================== */
(function (global) {
  "use strict";

  const LS_KEY = "neuroped.study.access.requests.v1";

  function readRequests() {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); } catch (_) { return []; }
  }
  function writeRequests(r) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(r.slice(-200))); } catch (_) {}
  }

  function openModal(instrumentId, instrumentName) {
    if (document.getElementById("np-study-modal")) return;
    const overlay = document.createElement("div");
    overlay.id = "np-study-modal";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.style.cssText = "position:fixed;inset:0;z-index:100;display:grid;place-items:center;background:rgba(11,11,26,.86);backdrop-filter:blur(12px);font-family:var(--np-font-text,system-ui);color:var(--np-text,#F5F3FF);";
    overlay.innerHTML = `
      <div style="background:var(--np-ink-1,#0F0F22);border:1px solid var(--np-edge,rgba(255,255,255,.06));border-radius:20px;padding:1.6rem 1.75rem;width:min(440px,92vw);box-shadow:0 24px 60px rgba(0,0,0,.55);">
        <h3 style="margin:0 0 .25rem;font-family:var(--np-font-display,Georgia,serif);font-weight:500;font-size:1.4rem;letter-spacing:-.01em;">Solicitar liberação para estudo</h3>
        <p style="margin:.25rem 0 1rem;color:var(--np-text-mute,#A8A5C8);font-size:.92rem;line-height:1.5;">
          Instrumento <strong>${instrumentName || instrumentId}</strong>. Esta solicitação é registrada localmente para revisão do Dr. Jadson Fraga.
        </p>
        <form id="np-study-form" style="display:grid;gap:.85rem;">
          <label style="display:grid;gap:.3rem;">
            <span style="font-size:.75rem;letter-spacing:.18em;text-transform:uppercase;color:var(--np-accent,#7C79FF);font-weight:600;">Nome</span>
            <input required name="name" type="text" autocomplete="name" style="background:transparent;border:0;border-bottom:1px solid var(--np-edge,rgba(255,255,255,.06));color:inherit;padding:.5rem 0;font:inherit;outline:none;">
          </label>
          <label style="display:grid;gap:.3rem;">
            <span style="font-size:.75rem;letter-spacing:.18em;text-transform:uppercase;color:var(--np-accent,#7C79FF);font-weight:600;">CRM / Registro</span>
            <input required name="registry" type="text" autocomplete="organization" style="background:transparent;border:0;border-bottom:1px solid var(--np-edge,rgba(255,255,255,.06));color:inherit;padding:.5rem 0;font:inherit;outline:none;">
          </label>
          <label style="display:grid;gap:.3rem;">
            <span style="font-size:.75rem;letter-spacing:.18em;text-transform:uppercase;color:var(--np-accent,#7C79FF);font-weight:600;">Finalidade</span>
            <textarea required name="purpose" rows="3" style="background:transparent;border:1px solid var(--np-edge,rgba(255,255,255,.06));border-radius:14px;color:inherit;padding:.65rem .85rem;font:inherit;outline:none;resize:vertical;"></textarea>
          </label>
          <div style="display:flex;gap:.5rem;justify-content:flex-end;margin-top:.5rem;">
            <button type="button" id="np-study-cancel" style="min-height:44px;padding:0 1rem;border-radius:14px;border:1px solid var(--np-edge,rgba(255,255,255,.06));background:transparent;color:inherit;font:inherit;cursor:pointer;">Cancelar</button>
            <button type="submit" style="min-height:44px;padding:0 1.25rem;border-radius:14px;border:0;background:var(--np-accent,#7C79FF);color:#fff;font:inherit;font-weight:600;cursor:pointer;">Enviar solicitação</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(overlay);
    document.getElementById("np-study-cancel").addEventListener("click", () => overlay.remove());
    overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });
    overlay.querySelector("#np-study-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const req = {
        ts: Date.now(),
        iso: new Date().toISOString(),
        instrumentId, instrumentName,
        name:     fd.get("name"),
        registry: fd.get("registry"),
        purpose:  fd.get("purpose")
      };
      const all = readRequests(); all.push(req); writeRequests(all);
      const ev = new CustomEvent("neuroped:study-access-requested", { detail: req });
      global.dispatchEvent(ev);
      overlay.remove();
      if (global.NPMotion?.toast) global.NPMotion.toast("Solicitação registrada. O Dr. revisará em breve.", { kind: "success" });
    });
  }

  /* Auto-wire: encontra cards com "Estudo · restrito" e injeta CTA */
  function attachCTAs() {
    document.querySelectorAll('[data-np-card], .np-card').forEach((card) => {
      const text = card.textContent || "";
      if (!/Estudo\s*·\s*restrito/i.test(text)) return;
      if (card.querySelector(".np-study-cta")) return;
      const id = card.getAttribute("data-instrument-id") || "";
      const name = card.querySelector("h3, h4, .np-card__title")?.textContent?.trim() || id;
      const actions = card.querySelector(".np-card__actions") || (() => {
        const d = document.createElement("div");
        d.className = "np-card__actions";
        card.appendChild(d);
        return d;
      })();
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "np-btn np-btn--ghost np-study-cta";
      btn.textContent = "Solicitar liberação";
      btn.addEventListener("click", () => openModal(id, name));
      actions.appendChild(btn);
    });
  }

  if (typeof window !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", attachCTAs);
    else attachCTAs();
    // re-wire em mudanças do DOM (resultado da engine)
    const obs = new MutationObserver(() => attachCTAs());
    obs.observe(document.body, { childList: true, subtree: true });
  }

  global.NPStudyAccess = { openModal, readRequests, version: "9.8.0" };
})(typeof window !== "undefined" ? window : globalThis);
