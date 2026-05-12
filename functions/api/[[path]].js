/**
 * Cloudflare Pages Function — proxy /api/* → Railway backend
 * Rota: /api/**  →  https://neuroped-api-production.up.railway.app/api/**
 *
 * Isso elimina a necessidade de CORS e de alterar API_BASE no frontend.
 */

const RAILWAY_BACKEND = "https://neuroped-api-production.up.railway.app";

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);

  // Monta a URL de destino no Railway
  const targetUrl = `${RAILWAY_BACKEND}${url.pathname}${url.search}`;

  // Clona os headers, removendo o Host para evitar rejeição pelo Railway
  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.set("x-forwarded-host", url.hostname);

  try {
    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: ["GET", "HEAD"].includes(request.method) ? undefined : request.body,
      redirect: "follow",
    });

    // Cria response com headers CORS para garantir compatibilidade
    const responseHeaders = new Headers(response.headers);
    responseHeaders.set("Access-Control-Allow-Origin", "*");
    responseHeaders.set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,PATCH,OPTIONS");
    responseHeaders.set("Access-Control-Allow-Headers", "Content-Type,Authorization");

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Proxy error", detail: err.message }),
      {
        status: 502,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
}

// Handle OPTIONS preflight
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,PATCH,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type,Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}
