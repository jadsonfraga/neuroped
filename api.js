/* ===========================================================
   NeuroPed EDJ — Cloud API client
   Suporta dois modos:
   1) Local (IndexedDB / localStorage) — funciona offline
   2) Supabase (cloud sync, multi-device)
   Configure window.NEUROPED_CONFIG abaixo para ativar nuvem.
   =========================================================== */

window.NEUROPED_CONFIG = window.NEUROPED_CONFIG || {
  // Preencha com sua instância Supabase para ativar nuvem:
  SUPABASE_URL: '',       // ex: 'https://xxxx.supabase.co'
  SUPABASE_ANON: '',      // anon public key
  // Cloudflare Functions (já existe no neuroped):
  CLOUDFLARE_BASE: '',    // ex: 'https://neuroped.pages.dev'
  APP_NAME: 'NeuroPed EDJ',
  DOCTOR: 'Dr. Jadson Fraga'
};

const Cloud = (() => {
  const LS_KEY = 'neuroped:v3';
  const cfg = window.NEUROPED_CONFIG;

  function load() {
    try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; }
    catch { return {}; }
  }
  function save(state) { localStorage.setItem(LS_KEY, JSON.stringify(state)); }

  function table(name) {
    const s = load();
    s[name] = s[name] || [];
    return {
      list: () => s[name].slice(),
      add: (item) => { s[name].unshift({ ...item, _id: 'L_' + Date.now() + '_' + Math.random().toString(36).slice(2,6), _at: new Date().toISOString() }); save(s); return s[name][0]; },
      update: (id, patch) => { const i = s[name].findIndex(x => x._id === id); if (i >= 0) { s[name][i] = { ...s[name][i], ...patch, _at: new Date().toISOString() }; save(s); return s[name][i]; } return null; },
      remove: (id) => { s[name] = s[name].filter(x => x._id !== id); save(s); },
      clear: () => { s[name] = []; save(s); }
    };
  }

  async function ping() {
    if (!cfg.CLOUDFLARE_BASE) return { ok: false, reason: 'no-config' };
    try {
      const r = await fetch(cfg.CLOUDFLARE_BASE.replace(/\/$/, '') + '/api/health', { mode: 'cors' });
      const j = await r.json();
      return { ok: !!j.ok, raw: j };
    } catch (e) { return { ok: false, error: e.message }; }
  }

  async function pushToCloud(payload) {
    if (cfg.SUPABASE_URL && cfg.SUPABASE_ANON) {
      try {
        const r = await fetch(cfg.SUPABASE_URL + '/rest/v1/submissions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': cfg.SUPABASE_ANON,
            'Authorization': 'Bearer ' + cfg.SUPABASE_ANON,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(payload)
        });
        if (r.ok) return { ok: true, via: 'supabase' };
      } catch (e) { /* fallthrough */ }
    }
    if (cfg.CLOUDFLARE_BASE) {
      try {
        const r = await fetch(cfg.CLOUDFLARE_BASE.replace(/\/$/, '') + '/api/submissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (r.ok) return { ok: true, via: 'cloudflare' };
      } catch (e) { /* fallthrough */ }
    }
    return { ok: false, reason: 'no-cloud-or-offline' };
  }

  return {
    cfg,
    submissions: table('submissions'),
    consultas:   table('consultas'),
    diario:      table('diario'),
    agenda:      table('agenda'),
    pacientes:   table('pacientes'),
    settings:    table('settings'),
    ping,
    pushToCloud,
    status: () => ({
      hasCloud: !!(cfg.SUPABASE_URL && cfg.SUPABASE_ANON) || !!cfg.CLOUDFLARE_BASE,
      mode: (cfg.SUPABASE_URL ? 'supabase' : (cfg.CLOUDFLARE_BASE ? 'cloudflare' : 'local'))
    })
  };
})();

window.NEUROPED_CLOUD = Cloud;
