/* ============================================================================
   np-restricted-cta.js — §M5 do PROMPT MESTRE 7.8→9.8
   ----------------------------------------------------------------------------
   Cada card com tag "Estudo · restrito" (ou .np-tag--restricted, ou texto
   similar) ganha um botão secundário "Solicitar liberação" que abre um modal
   com formulário (nome + CRM + finalidade) e registra em localStorage.
   Dispara evento neuroped:study-access-requested.

   Aditivo. Runtime DOM patch. Idempotente.
   Honra prefers-reduced-motion (anima ou crossfade).
   Dr. Jadson Fraga · CRM-PE 25227 · RQE 17756
   ============================================================================ */
(function (root) {
  "use strict";
  if (root.__npRestrictedCTA) return;
  root.__npRestrictedCTA = true;

  const STORAGE_KEY = "np:study-access-requests:v1";

  /* ---------- util ---------- */
  function norm(s) {
    return (s || "").toString().normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
  }
  function loadRequests() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
  }
  function saveRequest(req) {
    const list = loadRequests();
    list.unshift({ id: Date.now(), recorded_at: new Date().toISOString(), ...req });
    while (list.length > 500) list.pop();
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch {}
  }
  function esc(s) {
    return (s || "").toString().replace(/[&<>"]/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[c]));
  }
  function reducedMotion() {
    return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }

  /* ---------- detecção de cards restritos ---------- */
  function isRestrictedCard(el) {
    if (!el || el.nodeType !== 1) return false;
    if (el.dataset.npRestrictedBound === "1") return false;
    // 1) tag CSS class
    if (el.querySelector('.np-tag--restricted, [data-tag="restrito"], [data-status="restricted"]')) return true;
    // 2) texto literal — heurística defensiva
    const t = norm(el.textContent || "");
    if (t.includes("estudo · restrito") || t.includes("estudo restrito") || t.includes("estudo. restrito")) {
      // confirma que o el é razoavelmente "card-like"
      const cls = (el.className || "").toString();
      if (/\b(card|tile|box|article|item)\b/i.test(cls) || el.tagName === "ARTICLE") return true;
    }
    return false;
  }

  /* ---------- botão "Solicitar liberação" ---------- */
  function buildCTA(card) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "np-cta-libera";
    btn.setAttribute("data-np-press", "1");
    btn.textContent = "Solicitar liberação";
    btn.style.cssText = [
      "display:inline-flex",
      "align-items:center",
      "gap:6px",
      "padding:7px 14px",
      "margin-top:10px",
      "border-radius:var(--np-r-pill, 999px)",
      "background:transparent",
      "border:1px solid color-mix(in oklab, var(--np-accent,#7C79FF) 36%, transparent)",
      "color:var(--np-accent-hi, #9D9BFF)",
      "font-family:var(--np-font-text, 'Inter', system-ui, sans-serif)",
      "font-size:12px",
      "font-weight:600",
      "letter-spacing:0.02em",
      "cursor:pointer",
      "transition:background 200ms cubic-bezier(0.16,1,0.30,1)",
    ].join(";");
    btn.addEventListener("mouseenter", () => {
      btn.style.background = "color-mix(in oklab, var(--np-accent,#7C79FF) 14%, transparent)";
    });
    btn.addEventListener("mouseleave", () => {
      btn.style.background = "transparent";
    });
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const ctx = {
        card_title: (card.querySelector("h1,h2,h3,h4,h5,h6,.title,[role='heading']")?.textContent || "").trim(),
        card_snippet: (card.textContent || "").trim().slice(0, 200),
      };
      openModal(ctx);
    });
    return btn;
  }

  /* ---------- modal ---------- */
  function buildModal(ctx) {
    const wrap = document.createElement("div");
    wrap.id = "np-modal-libera";
    wrap.setAttribute("role", "dialog");
    wrap.setAttribute("aria-modal", "true");
    wrap.setAttribute("aria-labelledby", "np-modal-libera-title");
    wrap.style.cssText = [
      "position:fixed",
      "inset:0",
      "background:rgba(8,4,20,0.78)",
      "backdrop-filter:blur(8px)",
      "display:flex",
      "align-items:center",
      "justify-content:center",
      "z-index:99999",
      "padding:24px",
      "font-family:var(--np-font-text,'Inter',system-ui,sans-serif)",
    ].join(";");

    const box = document.createElement("div");
    box.style.cssText = [
      "max-width:480px",
      "width:100%",
      "background:var(--np-ink-1, #0F0F22)",
      "border:1px solid var(--np-edge-hi, rgba(255,255,255,0.10))",
      "border-radius:var(--np-r-3, 20px)",
      "padding:28px",
      "box-shadow:0 24px 60px rgba(0,0,0,0.55)",
      "color:var(--np-text, #F5F3FF)",
    ].join(";");

    box.innerHTML = `
      <h2 id="np-modal-libera-title" style="margin:0 0 8px;font-family:var(--np-font-display,'Fraunces',Georgia,serif);font-size:22px;font-weight:500;letter-spacing:-0.02em">Solicitar liberação de instrumento</h2>
      <p style="margin:0 0 18px;font-size:13px;line-height:1.5;color:var(--np-text-mute,#A8A5C8)">
        Este instrumento é de uso restrito (estudo / pesquisa / autorização do autor). Informe seus dados profissionais.
        ${ctx?.card_title ? `<br><strong style="color:var(--np-text,#F5F3FF)">Instrumento:</strong> ${esc(ctx.card_title)}` : ""}
      </p>
      <form id="np-libera-form" novalidate>
        <label style="display:block;margin-bottom:12px">
          <span style="display:block;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;font-weight:600;color:var(--np-text-mute,#A8A5C8);margin-bottom:4px">Nome completo *</span>
          <input name="nome" required style="width:100%;height:40px;padding:0 12px;background:var(--np-ink-2,#15152E);border:1px solid var(--np-edge,rgba(255,255,255,0.06));border-radius:10px;color:var(--np-text,#F5F3FF);font-family:inherit;font-size:14px;outline:none">
        </label>
        <label style="display:block;margin-bottom:12px">
          <span style="display:block;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;font-weight:600;color:var(--np-text-mute,#A8A5C8);margin-bottom:4px">CRM / registro profissional *</span>
          <input name="crm" required placeholder="CRM-PE 12345 ou CRP/CRFa..." style="width:100%;height:40px;padding:0 12px;background:var(--np-ink-2,#15152E);border:1px solid var(--np-edge,rgba(255,255,255,0.06));border-radius:10px;color:var(--np-text,#F5F3FF);font-family:inherit;font-size:14px;outline:none">
        </label>
        <label style="display:block;margin-bottom:12px">
          <span style="display:block;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;font-weight:600;color:var(--np-text-mute,#A8A5C8);margin-bottom:4px">E-mail profissional</span>
          <input type="email" name="email" placeholder="opcional" style="width:100%;height:40px;padding:0 12px;background:var(--np-ink-2,#15152E);border:1px solid var(--np-edge,rgba(255,255,255,0.06));border-radius:10px;color:var(--np-text,#F5F3FF);font-family:inherit;font-size:14px;outline:none">
        </label>
        <label style="display:block;margin-bottom:18px">
          <span style="display:block;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;font-weight:600;color:var(--np-text-mute,#A8A5C8);margin-bottom:4px">Finalidade do uso *</span>
          <textarea name="finalidade" required rows="3" placeholder="Pesquisa / consultório / formação..." style="width:100%;padding:10px 12px;background:var(--np-ink-2,#15152E);border:1px solid var(--np-edge,rgba(255,255,255,0.06));border-radius:10px;color:var(--np-text,#F5F3FF);font-family:inherit;font-size:14px;outline:none;resize:vertical;min-height:72px"></textarea>
        </label>
        <p style="font-size:11px;color:var(--np-text-low,#6E6B8F);margin:0 0 16px;line-height:1.4">
          A solicitação fica registrada localmente neste dispositivo. O Dr. Jadson Fraga revisará e responderá por e-mail.
        </p>
        <div style="display:flex;gap:10px;justify-content:flex-end">
          <button type="button" id="np-libera-cancel" style="padding:9px 16px;background:transparent;border:1px solid var(--np-edge,rgba(255,255,255,0.06));border-radius:10px;color:var(--np-text-mute,#A8A5C8);font-family:inherit;font-size:13px;font-weight:500;cursor:pointer">Cancelar</button>
          <button type="submit" style="padding:9px 16px;background:var(--np-accent,#7C79FF);border:1px solid var(--np-accent,#7C79FF);border-radius:10px;color:#fff;font-family:inherit;font-size:13px;font-weight:600;cursor:pointer">Enviar solicitação</button>
        </div>
      </form>
    `;
    wrap.appendChild(box);

    function close() {
      if (!reducedMotion() && wrap.animate) {
        wrap.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, easing: "cubic-bezier(0.7,0,0.84,0)" })
            .finished.catch(()=>{}).finally(() => wrap.remove());
      } else {
        wrap.remove();
      }
      document.body.style.overflow = "";
    }

    wrap.querySelector("#np-libera-cancel").addEventListener("click", close);
    wrap.addEventListener("click", (e) => { if (e.target === wrap) close(); });
    document.addEventListener("keydown", function onEsc(e) {
      if (e.key === "Escape") { close(); document.removeEventListener("keydown", onEsc); }
    });

    wrap.querySelector("#np-libera-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const f = e.target;
      const data = {
        nome: f.nome.value.trim(),
        crm: f.crm.value.trim(),
        email: f.email.value.trim(),
        finalidade: f.finalidade.value.trim(),
        context: ctx || null,
      };
      if (!data.nome || !data.crm || !data.finalidade) {
        return;
      }
      saveRequest(data);
      try {
        window.dispatchEvent(new CustomEvent("neuroped:study-access-requested", { detail: data }));
      } catch (_) {}
      // confirmação visual
      box.innerHTML = `
        <div style="text-align:center;padding:20px 0">
          <div style="font-size:36px;margin-bottom:12px;color:var(--np-success,#4ADE80)">✓</div>
          <h3 style="margin:0 0 6px;font-family:var(--np-font-display,'Fraunces',Georgia,serif);font-size:18px">Solicitação registrada</h3>
          <p style="margin:0;font-size:13px;color:var(--np-text-mute,#A8A5C8);line-height:1.5">Você receberá retorno em até 48 horas no e-mail informado (se houver) ou na próxima sessão presencial.</p>
          <button id="np-libera-ok" style="margin-top:18px;padding:9px 20px;background:var(--np-accent,#7C79FF);border:none;border-radius:10px;color:#fff;font-family:inherit;font-size:13px;font-weight:600;cursor:pointer">Fechar</button>
        </div>
      `;
      box.querySelector("#np-libera-ok").addEventListener("click", close);
    });

    return wrap;
  }

  function openModal(ctx) {
    if (document.getElementById("np-modal-libera")) return;
    const m = buildModal(ctx);
    document.body.appendChild(m);
    document.body.style.overflow = "hidden";
    if (!reducedMotion() && m.animate) {
      m.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: "cubic-bezier(0.16,1,0.30,1)" });
      const box = m.firstChild;
      box.animate([
        { transform: "scale(0.94)", opacity: 0 },
        { transform: "scale(1)", opacity: 1 }
      ], { duration: 320, easing: "cubic-bezier(0.32,0.72,0,1)" });
    }
    setTimeout(() => m.querySelector("input")?.focus(), 200);
  }

  /* ---------- aplicação ---------- */
  function scan(root) {
    const cards = (root || document).querySelectorAll(
      '[class*="card"], [class*="Card"], article, [role="article"], [class*="tile"], [class*="item"]'
    );
    cards.forEach((card) => {
      if (!isRestrictedCard(card)) return;
      card.dataset.npRestrictedBound = "1";
      const cta = buildCTA(card);
      // anexa no final do card
      card.appendChild(cta);
    });
  }

  function init() {
    scan(document);
    // observa rerenders
    const mo = new MutationObserver(() => {
      clearTimeout(init._t);
      init._t = setTimeout(() => scan(document), 120);
    });
    mo.observe(document.body || document.documentElement, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }

  /* ---------- export ---------- */
  root.NP_RestrictedCTA = {
    open: openModal,
    list: loadRequests,
    version: "1.0.0",
  };
})(window);
