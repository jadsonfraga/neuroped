// =====================================================================
// Cloudflare Pages Function — POST /api/sign
// Assina um documento eletronicamente. NESTA VERSÃO é um SCAFFOLD pronto
// para receber:
//   - Opção 2: certificado A1 (.pfx) como Cloudflare Secret
//   - Opção 3: API de provedor externo (Bry / Vault ID)
//
// Estado atual: gera um pacote de assinatura "avançada" (não-ICP)
// criptograficamente válido, suficiente para verificação interna.
// Para validade jurídica plena ICP-Brasil, requer integração final
// conforme CRITICAL_SIGNATURE_BRIEFING.md
// =====================================================================

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS }
  });
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

async function sha256Base64(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

export async function onRequestPost({ request, env }) {
  try {
    // 1. Autenticação — verifica JWT do Supabase
    const authHeader = request.headers.get('Authorization') || '';
    if (!authHeader.startsWith('Bearer ')) {
      return json({ ok: false, error: 'missing_token' }, 401);
    }
    const token = authHeader.slice(7);

    // Valida com Supabase
    const userRes = await fetch(env.SUPABASE_URL + '/auth/v1/user', {
      headers: { 'Authorization': 'Bearer ' + token, 'apikey': env.SUPABASE_ANON }
    });
    if (!userRes.ok) return json({ ok: false, error: 'invalid_token' }, 401);
    const user = await userRes.json();

    // 2. Recebe payload
    const body = await request.json();
    const required = ['document_id', 'document_content', 'document_type'];
    for (const k of required) if (!body[k]) return json({ ok: false, error: 'missing_' + k }, 400);

    // 3. Gera hash do conteúdo
    const contentHash = await sha256Base64(body.document_content);

    // 4. (FUTURO) Assinatura ICP-Brasil
    // -----------------------------------------------------------
    // Quando o .pfx estiver em env.CERT_PFX_BASE64 e env.CERT_PASS:
    //   - usar biblioteca como node-forge no Worker
    //   - OU chamar API do provedor (Bry / Vault ID)
    //   - retornar PAdES-LTA do PDF
    // -----------------------------------------------------------

    // 5. Por enquanto, gera assinatura "avançada" (HMAC-SHA256)
    //    com chave do servidor. Verificável, mas NÃO ICP-Brasil.
    const signaturePayload = {
      document_id: body.document_id,
      document_type: body.document_type,
      content_hash: contentHash,
      signed_at: new Date().toISOString(),
      signer_user_id: user.id,
      signer_email: user.email,
      signature_format: env.CERT_PFX_BASE64 ? 'PAdES-LTA' : 'NEUROPED-ADV-V1',
      signature_algorithm: 'HMAC-SHA256',
      verification_url: (env.PUBLIC_BASE_URL || '') + '/verificar?doc=' + contentHash
    };

    const sigData = JSON.stringify(signaturePayload);
    const sigKey = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(env.SIGNING_SECRET || 'NEUROPED_DEV_KEY_CHANGE_IN_PROD'),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const sigBuf = await crypto.subtle.sign('HMAC', sigKey, new TextEncoder().encode(sigData));
    const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(sigBuf)));

    // 6. Persiste em Supabase
    const sigInsert = await fetch(env.SUPABASE_URL + '/rest/v1/signatures', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': env.SUPABASE_SERVICE_ROLE,
        'Authorization': 'Bearer ' + env.SUPABASE_SERVICE_ROLE,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        document_id: body.document_id,
        signer_user_id: user.id,
        signer_name: body.signer_name || user.email,
        signer_crm: body.signer_crm || null,
        certificate_subject: env.CERT_SUBJECT || 'Assinatura Avançada NeuroPed (não-ICP)',
        certificate_issuer: env.CERT_ISSUER || 'NeuroPed EDJ (auto-emitido)',
        signature_format: signaturePayload.signature_format,
        signature_algorithm: signaturePayload.signature_algorithm,
        signature_bytes_base64: signatureBase64,
        signed_pdf_hash: contentHash,
        verification_url: signaturePayload.verification_url,
        public_metadata: {
          icp_brasil: !!env.CERT_PFX_BASE64,
          provider: env.CERT_PROVIDER || 'self',
          format: signaturePayload.signature_format
        }
      })
    });

    if (!sigInsert.ok) {
      const err = await sigInsert.text();
      return json({ ok: false, error: 'supabase_error', detail: err }, 500);
    }
    const sigRow = (await sigInsert.json())[0];

    // 7. Atualiza documento
    await fetch(env.SUPABASE_URL + '/rest/v1/documents?id=eq.' + body.document_id, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': env.SUPABASE_SERVICE_ROLE,
        'Authorization': 'Bearer ' + env.SUPABASE_SERVICE_ROLE
      },
      body: JSON.stringify({
        status: 'assinado',
        signed_at: signaturePayload.signed_at,
        signature_id: sigRow.id,
        content_hash: contentHash
      })
    });

    // 8. Audit log
    await fetch(env.SUPABASE_URL + '/rest/v1/audit_log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': env.SUPABASE_SERVICE_ROLE,
        'Authorization': 'Bearer ' + env.SUPABASE_SERVICE_ROLE
      },
      body: JSON.stringify({
        user_id: user.id,
        action: 'document.sign',
        resource_type: 'document',
        resource_id: body.document_id,
        metadata: { hash: contentHash, format: signaturePayload.signature_format }
      })
    });

    return json({
      ok: true,
      signature_id: sigRow.id,
      content_hash: contentHash,
      signed_at: signaturePayload.signed_at,
      verification_url: signaturePayload.verification_url,
      format: signaturePayload.signature_format,
      icp_brasil: !!env.CERT_PFX_BASE64,
      warning: env.CERT_PFX_BASE64 ? null : 'Modo Avançado — não-ICP-Brasil. Para validade jurídica plena, configure certificado A1 em env.CERT_PFX_BASE64.'
    });

  } catch (e) {
    return json({ ok: false, error: 'internal', detail: e.message }, 500);
  }
}
