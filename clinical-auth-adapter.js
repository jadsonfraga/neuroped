/* =====================================================================
   NeuroPed EDJ · CLINICAL AUTH ADAPTER V4.0
   Dr. Jadson Fraga · CRM-PE 25227 · RQE 17756
   ---------------------------------------------------------------------
   Autenticação local (sem backend) com 4 roles + capability gates.

   Roles e capabilities:
     · medico       — full (todos os 3 painéis + laudo + drive + admin)
     · secretaria   — pré-consulta + cadastro + entrega de questionário
     · paciente     — autoteste adolescente + diário próprio
     · familia      — questionários parentais + diários do filho

   PIN salvo com hash FNV-1a (não criptografia real — é gate operacional
   e não substitui auth de servidor; documentado no R6.3).
   ===================================================================== */
(function (global) {
  "use strict";

  const NS = "neuroped.auth.v4";

  const ROLES = {
    medico: {
      label: "Médico",
      icon: "👨‍⚕️",
      capabilities: ["read_all", "apply_test", "fill_scale", "log_diary", "generate_pdf", "drive_sync", "fhir_export", "admin_panel", "purge_data"]
    },
    secretaria: {
      label: "Secretária",
      icon: "📋",
      capabilities: ["read_pre_consultation", "fill_scale", "register_patient"]
    },
    paciente: {
      label: "Paciente / Adolescente",
      icon: "🙂",
      capabilities: ["self_assessment", "log_own_diary"]
    },
    familia: {
      label: "Família",
      icon: "👨‍👩‍👧",
      capabilities: ["parent_questionnaire", "log_child_diary"]
    }
  };

  function fnv1a(str, seed) {
    let h = (seed >>> 0) || 0x811c9dc5;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return h >>> 0;
  }
  function hashPIN(pin, salt) {
    const s = String(salt || "neuroped-v4-salt");
    return fnv1a(pin + "|" + s, 0x811c9dc5).toString(16).padStart(8, "0") +
           fnv1a(pin + "|" + s, 0xa1b2c3d4).toString(16).padStart(8, "0");
  }

  /* ------------------------------------------------------------------
   *  PROFILE STORE (todos os usuários cadastrados localmente)
   * ------------------------------------------------------------------ */
  function readProfiles() { try { return JSON.parse(localStorage.getItem(NS + ".profiles") || "{}"); } catch (_) { return {}; } }
  function writeProfiles(p) { try { localStorage.setItem(NS + ".profiles", JSON.stringify(p)); } catch (_) {} }

  /* ------------------------------------------------------------------
   *  SESSION
   * ------------------------------------------------------------------ */
  function readSession() {
    try { return JSON.parse(sessionStorage.getItem(NS + ".session") || "null"); } catch (_) { return null; }
  }
  function writeSession(s) {
    try { sessionStorage.setItem(NS + ".session", JSON.stringify(s)); } catch (_) {}
    const bus = global.NeuroPedClinicalEventBus?.bus;
    bus && bus.emit("plugin:loaded", { auth_session_changed: !!s, role: s?.role }, { engine: "AuthAdapter" });
  }
  function clearSession() {
    try { sessionStorage.removeItem(NS + ".session"); } catch (_) {}
  }

  /* ------------------------------------------------------------------
   *  CADASTRO
   * ------------------------------------------------------------------ */
  function registerUser({ id, role, name, pin, salt }) {
    if (!id || !role || !pin) throw new Error("registerUser: id+role+pin obrigatórios");
    if (!ROLES[role]) throw new Error("role inválido: " + role);
    const p = readProfiles();
    p[id] = {
      id, role, name: name || id,
      pinHash: hashPIN(pin, salt),
      salt: salt || null,
      created_at: new Date().toISOString()
    };
    writeProfiles(p);
    return { ok: true, id };
  }

  /* ------------------------------------------------------------------
   *  LOGIN / LOGOUT
   * ------------------------------------------------------------------ */
  function login({ id, pin }) {
    const p = readProfiles();
    const prof = p[id];
    if (!prof) return { ok: false, error: "user_not_found" };
    if (prof.pinHash !== hashPIN(pin, prof.salt)) return { ok: false, error: "invalid_pin" };
    const session = { id: prof.id, role: prof.role, name: prof.name, since: Date.now() };
    writeSession(session);
    return { ok: true, session };
  }
  function logout() { clearSession(); }
  function currentUser() { return readSession(); }
  function isAuthenticated() { return !!readSession(); }
  function roles() { return ROLES; }

  /* ------------------------------------------------------------------
   *  CAPABILITY GATES
   * ------------------------------------------------------------------ */
  function hasCapability(cap) {
    const s = readSession();
    if (!s) return false;
    return (ROLES[s.role]?.capabilities || []).includes(cap);
  }
  function requireCapability(cap) {
    if (!hasCapability(cap)) {
      const err = new Error(`capability ausente: ${cap}`);
      err.code = "AUTH_FORBIDDEN";
      throw err;
    }
  }
  function guardElement(el, cap) {
    if (!hasCapability(cap)) {
      el.setAttribute("hidden", "");
      el.setAttribute("aria-hidden", "true");
    }
  }
  function guardAllByDataAttr(attr = "data-np-cap") {
    if (typeof document === "undefined") return;
    document.querySelectorAll(`[${attr}]`).forEach((el) => guardElement(el, el.getAttribute(attr)));
  }

  /* ------------------------------------------------------------------
   *  UI HELPERS (modal de login simples)
   * ------------------------------------------------------------------ */
  function openLoginModal() {
    if (document.getElementById("np-auth-modal")) return;
    const overlay = document.createElement("div");
    overlay.id = "np-auth-modal";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.innerHTML = `
      <style>
        #np-auth-modal { position:fixed; inset:0; z-index:99998; display:grid; place-items:center;
          background:rgba(10,10,22,.86); backdrop-filter:blur(8px); font-family:system-ui,sans-serif; color:#f2dca6; }
        #np-auth-modal .np-panel { background:linear-gradient(160deg,#15143a,#221c52 60%,#15143a);
          border:1px solid rgba(231,201,139,.28); border-radius:1rem; padding:1.4rem 1.5rem;
          width:min(420px,92vw); box-shadow:0 20px 60px rgba(0,0,0,.5); }
        #np-auth-modal h2 { font-family:"Fraunces",Georgia,serif; margin:0 0 .5rem; color:#f2dca6; }
        #np-auth-modal label { display:block; font-size:.85rem; color:#e7c98b; margin:.6rem 0 .3rem; }
        #np-auth-modal input, #np-auth-modal select { width:100%; padding:.65rem .8rem; border-radius:.55rem;
          background:rgba(10,10,22,.6); border:1px solid rgba(231,201,139,.28); color:#f2dca6;
          font-size:.95rem; font-family:inherit; }
        #np-auth-modal input:focus, #np-auth-modal select:focus { outline:2px solid #7c79ff; outline-offset:1px; border-color:transparent; }
        #np-auth-modal .np-foot { display:flex; gap:.5rem; justify-content:flex-end; margin-top:1rem;
          padding-top:.85rem; border-top:1px solid rgba(231,201,139,.18); }
        #np-auth-modal button { padding:.6rem 1rem; border-radius:999px; border:0; font-weight:600;
          min-height:44px; font-family:inherit; cursor:pointer; }
        #np-auth-modal .np-btn-go { background:linear-gradient(135deg,#f2dca6,#e7c98b); color:#0a0a16; }
        #np-auth-modal .np-btn-cancel { background:transparent; color:#f2dca6; border:1px solid rgba(231,201,139,.35); }
        #np-auth-modal .np-error { color:#ff8c8c; font-size:.85rem; margin-top:.4rem; min-height:1.1rem; }
      </style>
      <div class="np-panel">
        <h2>Entrar no NeuroPed</h2>
        <p style="opacity:.85;margin:0 0 .6rem;font-size:.9rem;">Selecione seu perfil e digite seu PIN.</p>
        <label>Usuário</label>
        <input type="text" id="np-auth-id" autocomplete="username" placeholder="seu identificador">
        <label>PIN</label>
        <input type="password" id="np-auth-pin" autocomplete="current-password" placeholder="••••">
        <div class="np-error" id="np-auth-err"></div>
        <div class="np-foot">
          <button type="button" class="np-btn-cancel" id="np-auth-cancel">Cancelar</button>
          <button type="button" class="np-btn-go" id="np-auth-go">Entrar</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelector("#np-auth-cancel").addEventListener("click", () => overlay.remove());
    overlay.querySelector("#np-auth-go").addEventListener("click", () => {
      const id = overlay.querySelector("#np-auth-id").value.trim();
      const pin = overlay.querySelector("#np-auth-pin").value;
      const r = login({ id, pin });
      const err = overlay.querySelector("#np-auth-err");
      if (r.ok) {
        err.textContent = `Bem-vindo, ${r.session.name}`;
        setTimeout(() => { overlay.remove(); guardAllByDataAttr(); }, 600);
      } else {
        err.textContent = r.error === "user_not_found" ? "Usuário não encontrado" : "PIN inválido";
      }
    });
  }

  /* ------------------------------------------------------------------
   *  SEED INICIAL: cria perfil do Dr. Jadson Fraga se não existir
   * ------------------------------------------------------------------ */
  function seedDoctorProfile() {
    const p = readProfiles();
    if (!p["dr.jadson"]) {
      registerUser({
        id: "dr.jadson",
        role: "medico",
        name: "Dr. Jadson Fraga · CRM-PE 25227 · RQE 17756",
        pin: "neuroped"  // o Dr. deve trocar no primeiro uso
      });
    }
  }
  if (typeof window !== "undefined") {
    window.addEventListener("DOMContentLoaded", () => {
      seedDoctorProfile();
      guardAllByDataAttr();
    });
  }

  /* ------------------------------------------------------------------
   *  EXPORT
   * ------------------------------------------------------------------ */
  global.NeuroPedClinicalV4 = global.NeuroPedClinicalV4 || {};
  global.NeuroPedClinicalV4.AuthAdapter = {
    registerUser, login, logout, currentUser, isAuthenticated,
    hasCapability, requireCapability, guardElement, guardAllByDataAttr,
    openLoginModal, roles, ROLES, version: "4.0.0"
  };
  global.NeuroPedClinicalV4.auth = global.NeuroPedClinicalV4.AuthAdapter;
  if (typeof module !== "undefined" && module.exports) module.exports = global.NeuroPedClinicalV4.AuthAdapter;
})(typeof window !== "undefined" ? window : globalThis);
