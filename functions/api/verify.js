// =====================================================================
// Cloudflare Pages Function — GET /api/verify?doc=<hash>
// Verifica assinatura de documento. Acesso PÚBLICO — qualquer pessoa
// com o hash pode validar autenticidade.
// =====================================================================

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS }
  });
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const docHash = url.searchParams.get('doc');
  const sigId = url.searchParams.get('sig');

  if (!docHash && !sigId) {
    return json({ ok: false, error: 'missing_doc_or_sig' }, 400);
  }

  try {
    let query;
    if (sigId) {
      query = '/rest/v1/signatures_public?id=eq.' + encodeURIComponent(sigId);
    } else {
      query = '/rest/v1/signatures_public?signed_pdf_hash=eq.' + encodeURIComponent(docHash);
    }

    const res = await fetch(env.SUPABASE_URL + query, {
      headers: { 'apikey': env.SUPABASE_ANON }
    });

    if (!res.ok) {
      return json({ ok: false, error: 'lookup_failed' }, 502);
    }

    const rows = await res.json();
    if (!rows.length) {
      return json({
        ok: false,
        verified: false,
        reason: 'Assinatura não encontrada. Verifique o hash ou o identificador.',
        searched_hash: docHash || null,
        searched_id: sigId || null
      }, 404);
    }

    const sig = rows[0];
    const isRevoked = !!sig.revoked_at;
    const certExpired = sig.certificate_valid_until && new Date(sig.certificate_valid_until) < new Date();

    return json({
      ok: true,
      verified: !isRevoked && !certExpired,
      status: isRevoked ? 'revogado' : certExpired ? 'certificado expirado' : 'válido',
      signer: {
        name: sig.signer_name,
        crm: sig.signer_crm
      },
      certificate: {
        subject: sig.certificate_subject,
        issuer: sig.certificate_issuer,
        valid_from: sig.certificate_valid_from,
        valid_until: sig.certificate_valid_until
      },
      signature: {
        format: sig.signature_format,
        algorithm: sig.signature_algorithm,
        timestamp_authority: sig.timestamp_authority,
        signed_at: sig.signed_at,
        document_hash: sig.signed_pdf_hash
      },
      revocation: isRevoked ? { revoked_at: sig.revoked_at } : null,
      icp_brasil: !!(sig.public_metadata && sig.public_metadata.icp_brasil),
      verified_at: new Date().toISOString()
    });

  } catch (e) {
    return json({ ok: false, error: 'internal', detail: e.message }, 500);
  }
}
