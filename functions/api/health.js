// Cloudflare Pages Function — /api/health
export async function onRequest(context) {
  return new Response(JSON.stringify({
    ok: true,
    service: 'NeuroPed EDJ',
    version: '3.0.0',
    timestamp: new Date().toISOString()
  }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });
}
