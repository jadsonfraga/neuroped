const UPSTREAM = 'https://neuroped-conecta.lovable.app';
const VERSION = '2026.08.10-premium-1';
const HOP_BY_HOP = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailers',
  'transfer-encoding',
  'upgrade',
  'content-length',
  'content-encoding',
]);

function normalizedPath(value) {
  return String(value || '')
    .replace(/^\/+/, '')
    .replace(/\.\.(?:\/|\\)/g, '');
}

function requestHeaders(request) {
  const headers = new Headers();
  for (const [key, value] of Object.entries(request.headers || {})) {
    if (!value || HOP_BY_HOP.has(key.toLowerCase()) || key.toLowerCase() === 'host') continue;
    headers.set(key, Array.isArray(value) ? value.join(', ') : String(value));
  }
  headers.set('x-neuroped-conecta-proxy', VERSION);
  return headers;
}

function injectPremiumLayer(html) {
  const head = `\n<!-- NeuroPed Conecta premium layer ${VERSION} -->\n<meta name="application-name" content="NeuroPed Conecta">\n<meta name="apple-mobile-web-app-title" content="NeuroPed Conecta">\n<meta name="theme-color" content="#0b5963">\n<link rel="icon" type="image/jpeg" href="/brand-logo.jpeg">\n<link rel="apple-touch-icon" href="/brand-logo.jpeg">\n<link rel="manifest" href="/manifest.webmanifest">\n<link rel="stylesheet" href="/np-enhance.css?v=${VERSION}">\n<script src="/np-preload.js?v=${VERSION}"></script>\n`;
  const body = `\n<script defer src="/np-enhance.js?v=${VERSION}"></script>\n`;

  let out = html;
  if (/<head[^>]*>/i.test(out)) out = out.replace(/<head([^>]*)>/i, `<head$1>${head}`);
  else out = `${head}${out}`;

  if (/<\/body>/i.test(out)) out = out.replace(/<\/body>/i, `${body}</body>`);
  else out += body;

  return out;
}

function applyResponseHeaders(response, upstream, contentType) {
  upstream.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (HOP_BY_HOP.has(lower)) return;
    // CSP do app original permanece quando compatível; headers de transporte são reconstruídos.
    if (lower === 'content-security-policy-report-only') return;
    try { response.setHeader(key, value); } catch { /* header não suportado */ }
  });

  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('X-Frame-Options', 'DENY');
  response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  response.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  response.setHeader('X-NeuroPed-Conecta', VERSION);

  if (/text\/html|application\/json/i.test(contentType || '')) {
    response.setHeader('Cache-Control', 'private, no-store, max-age=0');
    response.setHeader('Vercel-CDN-Cache-Control', 'no-store');
  } else {
    response.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=3600');
  }
}

export default async function handler(request, response) {
  try {
    const path = normalizedPath(request.query?.path);
    const incoming = new URL(request.url || '/', 'https://neuroped-conecta.vercel.app');
    const target = new URL(`/${path}`, UPSTREAM);
    incoming.searchParams.forEach((value, key) => {
      if (key !== 'path') target.searchParams.append(key, value);
    });

    const method = String(request.method || 'GET').toUpperCase();
    const init = {
      method,
      headers: requestHeaders(request),
      redirect: 'manual',
    };

    if (!['GET', 'HEAD'].includes(method) && request.body != null) {
      init.body = typeof request.body === 'string' || Buffer.isBuffer(request.body)
        ? request.body
        : JSON.stringify(request.body);
    }

    const upstream = await fetch(target, init);
    const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
    applyResponseHeaders(response, upstream, contentType);
    response.statusCode = upstream.status;

    const location = upstream.headers.get('location');
    if (location) {
      try {
        const resolved = new URL(location, UPSTREAM);
        if (resolved.origin === UPSTREAM) {
          response.setHeader('Location', `${resolved.pathname}${resolved.search}${resolved.hash}`);
        }
      } catch { /* mantém Location original */ }
    }

    if (method === 'HEAD') return response.end();

    if (/text\/html/i.test(contentType)) {
      const html = injectPremiumLayer(await upstream.text());
      response.setHeader('Content-Type', 'text/html; charset=utf-8');
      return response.end(html);
    }

    const payload = Buffer.from(await upstream.arrayBuffer());
    return response.end(payload);
  } catch (error) {
    console.error('neuroped-conecta-proxy', error instanceof Error ? error.message : error);
    response.statusCode = 502;
    response.setHeader('Content-Type', 'text/html; charset=utf-8');
    response.setHeader('Cache-Control', 'no-store');
    return response.end(`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>NeuroPed Conecta</title><style>body{font-family:Inter,system-ui,sans-serif;margin:0;background:#f5f7f3;color:#102d33;display:grid;min-height:100dvh;place-items:center;padding:24px}.card{max-width:480px;background:white;border:1px solid #d9e5e2;border-radius:24px;padding:28px;box-shadow:0 18px 60px rgba(16,45,51,.1)}a{color:#0b5963;font-weight:700}</style><main class="card"><h1>Não foi possível carregar o NeuroPed Conecta</h1><p>Tente novamente em instantes. Nenhum dado foi alterado.</p><p><a href="/">Tentar novamente</a></p></main></html>`);
  }
}
