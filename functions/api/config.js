// /api/config — expõe configuração pública (apenas dados não-secretos)
export async function onRequest({ env }) {
  return new Response(JSON.stringify({
    SUPABASE_URL: env.SUPABASE_URL || '',
    SUPABASE_ANON: env.SUPABASE_ANON || '',
    PUBLIC_BASE_URL: env.PUBLIC_BASE_URL || '',
    HAS_CERT: !!(env.CERT_PFX_BASE64 && env.CERT_PASS),
    CERT_SUBJECT: env.CERT_SUBJECT_CN || '',
    BUILD: 'v6.0',
    BUILD_AT: new Date().toISOString()
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=60',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
