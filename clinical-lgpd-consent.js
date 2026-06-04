/* =====================================================================
   NeuroPed EDJ · LGPD CONSENT LAYER V4.0
   Dr. Jadson Fraga · CRM-PE 25227 · RQE 17756
   ---------------------------------------------------------------------
   Conformidade LGPD para o NeuroPed Clinical Platform.

   Scopes:
     · local_storage    — armazenar registros localmente
     · clinical_processing — processar dados clínicos pelo engine
     · pdf_generation   — gerar laudos PDF
     · drive_sync       — sincronizar com Google Drive (CLAUDE.md)
     · fhir_export      — exportar bundle FHIR

   API:
     requestConsent(scope)  → Promise<boolean>
     revokeConsent(scope)   → void
     hasConsent(scope)      → boolean
     purgePatientData(id)   → limpa registros do paciente em todas as engines
     auditLog()             → trilha completa
     openConsentModal()     → UI
   ===================================================================== */
(function (global) {
  "use strict";

  const NS = "neuroped.lgpd.v4";
  const CONSENT_KEY = NS + ".consents";
  const AUDIT_KEY = NS + ".audit";

  const SCOPES = {
    local_storage: {
      label: "Armazenamento local",
      description: "Salvar registros, resultados de instrumentos e snapshots no seu próprio dispositivo (localStorage). Os dados NÃO são enviados a servidor algum.",
      essential: true,
      icon: "💾"
    },
    clinical_processing: {
      label: "Processamento clínico",
      description: "Permitir que o motor clínico analise queixas e gere recomendações de instrumentos. Tudo local.",
      essential: true,
      icon: "🧠"
    },
    pdf_generation: {
      label: "Geração de laudos PDF",
      description: "Gerar PDFs profissionais com cabeçalho institucional, QR auditável e assinatura.",
      essential: false,
      icon: "📄"
    },
    drive_sync: {
      label: "Sincronizar com Google Drive",
      description: "Subir cópia dos laudos para a pasta 'Laudos NeuroPed' no Google Drive da conta médica.",
      essential: false,
      icon: "☁️"
    },
    fhir_export: {
      label: "Exportar dados em FHIR R4",
      description: "Gerar bundles FHIR para interoperabilidade com prontuário eletrônico.",
      essential: false,
      icon: "🔗"
    }
  };

  /* ------------------------------------------------------------------
   *  STATE
   * ------------------------------------------------------------------ */
  function readConsents() {
    try { return JSON.parse(localStorage.getItem(CONSENT_KEY) || "{}"); }
    catch (_) { return {}; }
  }
  function writeConsents(c) {
    try { localStorage.setItem(CONSENT_KEY, JSON.stringify(c)); }
    catch (_) {}
  }
  function audit(action, payload) {
    let log = [];
    try { log = JSON.parse(localStorage.getItem(AUDIT_KEY) || "[]"); } catch (_) {}
    log.push({ ts: Date.now(), iso: new Date().toISOString(), action, ...payload });
    if (log.length > 1000) log.splice(0, log.length - 1000);
    try { localStorage.setItem(AUDIT_KEY, JSON.stringify(log)); } catch (_) {}
    const bus = global.NeuroPedClinicalEventBus?.bus;
    bus && bus.emit("storage:migrated", { lgpd: { action, ...payload } }, { engine: "LGPDConsentLayer" });
  }

  /* ------------------------------------------------------------------
   *  API
   * ------------------------------------------------------------------ */
  function hasConsent(scope) {
    const c = readConsents();
    return !!c[scope]?.granted;
  }
  function grantConsent(scope) {
    if (!SCOPES[scope]) throw new Error(`scope inválido: ${scope}`);
    const c = readConsents();
    c[scope] = { granted: true, ts: Date.now(), iso: new Date().toISOString() };
    writeConsents(c);
    audit("grant", { scope });
    return true;
  }
  function revokeConsent(scope) {
    const c = readConsents();
    if (c[scope]) {
      c[scope].granted = false;
      c[scope].revoked_at = new Date().toISOString();
      writeConsents(c);
      audit("revoke", { scope });
    }
  }
  function consentSnapshot() { return readConsents(); }
  function auditLog() {
    try { return JSON.parse(localStorage.getItem(AUDIT_KEY) || "[]"); }
    catch (_) { return []; }
  }

  /** Apaga todos os dados de um paciente em todos os namespaces das engines. */
  function purgePatientData(patientId) {
    if (!patientId) return { ok: false, error: "missing_patient_id" };
    const removed = [];
    const namespaces = ["neuro.direct.v3-1", "neuro.scale.v3-1", "neuro.diary.v3-1", "neuroped.diaries.v3"];
    namespaces.forEach((nsKey) => {
      try {
        const raw = localStorage.getItem(nsKey);
        if (!raw) return;
        const data = JSON.parse(raw);
        let changed = false;
        Object.keys(data).forEach((k) => {
          if (Array.isArray(data[k])) {
            const before = data[k].length;
            data[k] = data[k].filter((entry) => entry?.patient_id !== patientId && entry?.patient_context?.id !== patientId);
            if (data[k].length !== before) { changed = true; removed.push({ ns: nsKey, key: k, removed: before - data[k].length }); }
          }
        });
        if (changed) localStorage.setItem(nsKey, JSON.stringify(data));
      } catch (_) {}
    });
    audit("purge_patient", { patientId, removed });
    return { ok: true, removed_total: removed.reduce((s, x) => s + x.removed, 0), details: removed };
  }

  /* ------------------------------------------------------------------
   *  REQUEST CONSENT — Promise resolvida pelo usuário no modal
   * ------------------------------------------------------------------ */
  function requestConsent(scope) {
    return new Promise((resolve) => {
      if (hasConsent(scope)) return resolve(true);
      openConsentModal((finalConsents) => {
        resolve(!!finalConsents[scope]?.granted);
      });
    });
  }

  /* ------------------------------------------------------------------
   *  MODAL UI
   * ------------------------------------------------------------------ */
  function openConsentModal(onFinish) {
    if (document.getElementById("np-lgpd-modal")) return;
    const overlay = document.createElement("div");
    overlay.id = "np-lgpd-modal";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "np-lgpd-title");

    const current = readConsents();
    const items = Object.entries(SCOPES).map(([k, s]) => `
      <label class="np-lgpd-item">
        <input type="checkbox" name="${k}" ${current[k]?.granted ? "checked" : ""} ${s.essential ? "checked disabled" : ""}>
        <span class="np-lgpd-icon">${s.icon}</span>
        <span class="np-lgpd-text">
          <strong>${s.label}${s.essential ? " (essencial)" : ""}</strong>
          <small>${s.description}</small>
        </span>
      </label>
    `).join("");

    overlay.innerHTML = `
      <style>
        #np-lgpd-modal { position:fixed; inset:0; z-index:99999; display:grid; place-items:center;
          background:rgba(10,10,22,.85); backdrop-filter:blur(8px); font-family:system-ui,sans-serif; color:#f2dca6; }
        #np-lgpd-modal .np-lgpd-panel { background:linear-gradient(160deg,#15143a,#221c52 60%,#15143a);
          border:1px solid rgba(231,201,139,.28); border-radius:1.1rem; padding:1.4rem 1.6rem;
          width:min(640px,94vw); max-height:90vh; overflow-y:auto;
          box-shadow:0 20px 60px rgba(0,0,0,.5); }
        #np-lgpd-modal h2 { font-family:"Fraunces",Georgia,serif; margin:0 0 .25rem; color:#f2dca6; font-size:1.4rem; }
        #np-lgpd-modal .np-lgpd-subtitle { opacity:.85; margin:0 0 1.1rem; font-size:.95rem; line-height:1.45; }
        #np-lgpd-modal .np-lgpd-item { display:grid; grid-template-columns:auto auto 1fr; gap:.65rem;
          padding:.7rem .8rem; margin:.55rem 0; border:1px solid rgba(231,201,139,.18);
          border-radius:.7rem; align-items:start; background:rgba(10,10,22,.35); cursor:pointer; }
        #np-lgpd-modal .np-lgpd-item input[type=checkbox] { accent-color:#7c79ff; width:1.1rem; height:1.1rem; margin-top:.18rem; }
        #np-lgpd-modal .np-lgpd-icon { font-size:1.3rem; }
        #np-lgpd-modal .np-lgpd-text strong { display:block; color:#e7c98b; font-size:.96rem; }
        #np-lgpd-modal .np-lgpd-text small { display:block; opacity:.82; font-size:.85rem; margin-top:.18rem; line-height:1.42; }
        #np-lgpd-modal .np-lgpd-foot { display:flex; justify-content:flex-end; gap:.6rem; margin-top:1.1rem;
          padding-top:.85rem; border-top:1px solid rgba(231,201,139,.18); }
        #np-lgpd-modal button { padding:.65rem 1.05rem; border-radius:999px; border:0; font-weight:600;
          font-size:.92rem; cursor:pointer; min-height:44px; font-family:inherit; }
        #np-lgpd-modal .np-btn-confirm { background:linear-gradient(135deg,#f2dca6,#e7c98b); color:#0a0a16; }
        #np-lgpd-modal .np-btn-cancel  { background:transparent; color:#f2dca6; border:1px solid rgba(231,201,139,.35); }
        #np-lgpd-modal .np-lgpd-legal { margin-top:.85rem; font-size:.78rem; opacity:.7; line-height:1.45; }
      </style>
      <div class="np-lgpd-panel">
        <h2 id="np-lgpd-title">Consentimento — LGPD</h2>
        <p class="np-lgpd-subtitle">
          Para operar como sistema clínico, o NeuroPed precisa do seu consentimento explícito
          em cada finalidade. Você pode revogar a qualquer momento em <em>Configurações → Privacidade</em>.
        </p>
        ${items}
        <p class="np-lgpd-legal">
          Conforme Lei nº 13.709/2018 (LGPD), você é o titular dos dados. Os itens marcados como
          <em>essenciais</em> são necessários para o funcionamento mínimo da plataforma.
          Você pode solicitar a exclusão completa dos seus dados a qualquer momento.
        </p>
        <div class="np-lgpd-foot">
          <button type="button" class="np-btn-cancel" id="np-lgpd-deny">Negar opcionais</button>
          <button type="button" class="np-btn-confirm" id="np-lgpd-accept">Confirmar consentimento</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    function finish(grantOpts) {
      const checks = overlay.querySelectorAll('input[type="checkbox"]');
      const consents = readConsents();
      checks.forEach((cb) => {
        const k = cb.name;
        const granted = grantOpts ? cb.checked : (SCOPES[k]?.essential ? true : false);
        consents[k] = { granted, ts: Date.now(), iso: new Date().toISOString() };
      });
      writeConsents(consents);
      audit("modal_close", { result: grantOpts ? "accepted" : "denied_optional" });
      overlay.remove();
      onFinish && onFinish(consents);
    }
    overlay.querySelector("#np-lgpd-accept").addEventListener("click", () => finish(true));
    overlay.querySelector("#np-lgpd-deny").addEventListener("click", () => finish(false));
    audit("modal_open", {});
  }

  /* ------------------------------------------------------------------
   *  EXPORT
   * ------------------------------------------------------------------ */
  global.NeuroPedClinicalV4 = global.NeuroPedClinicalV4 || {};
  global.NeuroPedClinicalV4.LGPDConsentLayer = {
    requestConsent, revokeConsent, hasConsent, grantConsent,
    consentSnapshot, auditLog, purgePatientData, openConsentModal,
    SCOPES, version: "4.0.0"
  };
  global.NeuroPedClinicalV4.lgpd = global.NeuroPedClinicalV4.LGPDConsentLayer;
  if (typeof module !== "undefined" && module.exports) module.exports = global.NeuroPedClinicalV4.LGPDConsentLayer;

  // dispara modal na primeira vez que o paciente abre o app
  if (typeof window !== "undefined") {
    window.addEventListener("DOMContentLoaded", () => {
      const c = readConsents();
      const essentialMissing = Object.entries(SCOPES).some(([k, s]) => s.essential && !c[k]?.granted);
      if (essentialMissing && !window.__npLgpdShown) {
        window.__npLgpdShown = true;
        // só dispara fora de páginas administrativas
        if (!/admin|console|test/i.test(window.location.pathname)) {
          setTimeout(() => openConsentModal(), 800);
        }
      }
    });
  }
})(typeof window !== "undefined" ? window : globalThis);
