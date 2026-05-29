/* =========================================================
   NeuroPed EDJ — Runtime configuration
   Este arquivo é carregado ANTES do app.
   Se você está usando Cloudflare Pages, defina via Settings:
     SUPABASE_URL  e  SUPABASE_ANON
   E essas serão injetadas via /api/config.
   Caso contrário, você pode editar manualmente este arquivo.
   ========================================================= */

window.NEUROPED_CONFIG = window.NEUROPED_CONFIG || {
  SUPABASE_URL: 'https://wizgmjcklfikgkwykewe.supabase.co',
  SUPABASE_ANON: '',  // <-- COLA aqui sua anon key OU configure no Cloudflare
  CLOUDFLARE_BASE: '',  // ex: https://neuroped.pages.dev
  APP_NAME: 'NeuroPed EDJ',
  DOCTOR: 'Dr. Jadson Fraga Araújo Júnior',
  CRM: 'CRM-PE 25227',
  RQE: 'RQE 17756',
  WHATSAPP: '5587960970280',
  INSTAGRAM: 'drjadsonfraga'
};

// Tenta carregar config injetada pelo backend (Cloudflare Functions)
fetch('/api/config').then(r => r.ok ? r.json() : null).then(cfg => {
  if (cfg && cfg.SUPABASE_URL) {
    Object.assign(window.NEUROPED_CONFIG, cfg);
    window.dispatchEvent(new CustomEvent('neuroped:config-ready', { detail: cfg }));
  }
}).catch(() => {});
