(() => {
  'use strict';

  const VERSION = '2026.08.10-premium-1';
  const root = document.documentElement;
  root.dataset.npPolish = '1';
  root.dataset.npVersion = VERSION;

  window.__NP_CONECTA_POLISH__ = Object.freeze({ version: VERSION, product: 'NeuroPed Conecta' });

  const rememberSupabase = (input, init) => {
    try {
      const rawUrl = typeof input === 'string' || input instanceof URL ? String(input) : input?.url;
      if (!rawUrl || !/\.supabase\.co\//i.test(rawUrl)) return;
      const url = new URL(rawUrl);
      sessionStorage.setItem('np:supabase:url', url.origin);

      const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined));
      const apiKey = headers.get('apikey');
      if (apiKey && apiKey.length > 40) sessionStorage.setItem('np:supabase:anon', apiKey);
    } catch {
      // Configuração pública não é necessária para o app original continuar funcionando.
    }
  };

  const nativeFetch = window.fetch.bind(window);
  window.fetch = function patchedFetch(input, init) {
    rememberSupabase(input, init);
    return nativeFetch(input, init);
  };

  function mountSplash() {
    if (document.getElementById('np-premium-splash')) return;
    const splash = document.createElement('div');
    splash.id = 'np-premium-splash';
    splash.setAttribute('aria-hidden', 'true');
    splash.innerHTML = `
      <div class="np-splash-inner">
        <img src="/brand-logo.jpeg" alt="" width="72" height="72" decoding="async">
        <div><strong>NeuroPed Conecta</strong><span>Jornada neurofuncional</span></div>
      </div>`;
    document.body.appendChild(splash);

    const dismiss = () => {
      splash.classList.add('np-splash-out');
      window.setTimeout(() => splash.remove(), 360);
    };
    window.setTimeout(dismiss, 620);
    window.addEventListener('load', () => window.setTimeout(dismiss, 80), { once: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountSplash, { once: true });
  else mountSplash();
})();
