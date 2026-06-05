// =====================================================================
// /api/sign — PAdES-BES com certificado ICP-Brasil A1 (.p12/.pfx)
// =====================================================================
// Usa node-forge para parse de PKCS#12 + construção PKCS#7/CMS
// Usa pdf-lib para embutir a assinatura no PDF
//
// REQUISITOS (variáveis de ambiente no Cloudflare Pages):
//   SUPABASE_URL          - URL do projeto Supabase
//   SUPABASE_ANON         - chave anônima
//   SUPABASE_SERVICE_ROLE - chave service role (Secret)
//   CERT_PFX_BASE64       - base64 do .p12/.pfx (Secret)
//   CERT_PASS             - senha do certificado (Secret)
//   SIGNING_SECRET        - segredo para assinatura HMAC fallback (Secret)
//   PUBLIC_BASE_URL       - URL pública do app (ex: https://neuroped.pages.dev)
//   TSA_URL               - URL da TSA RFC 3161 (opcional)
//
// PAYLOAD esperado (POST application/json):
//   {
//     "document_id": "uuid",
//     "document_type": "laudo|atestado|receita|pedido_exame|declaracao",
//     "pdf_base64": "...",            // PDF original a ser assinado
//     "signer_name": "Dr. Jadson Fraga",
//     "signer_crm": "CRM-PE 25227",
//     "patient_code": "PAC-001"
//   }
//
// RESPOSTA:
//   {
//     "ok": true,
//     "signed_pdf_base64": "...",
//     "signature_id": "uuid",
//     "content_hash": "sha256-base64",
//     "verification_url": "https://neuroped.pages.dev/verificar?doc=<hash>",
//     "format": "PAdES-BES",
//     "certificate": { ... }
//   }
// =====================================================================

import forge from 'node-forge';
import { PDFDocument, PDFName, PDFString, PDFHexString, PDFNumber, PDFArray, PDFDict } from 'pdf-lib';

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

// ---------- Helpers ----------
function b64ToBytes(b64) {
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}
function bytesToB64(arr) {
  let s = '';
  for (let i = 0; i < arr.length; i++) s += String.fromCharCode(arr[i]);
  return btoa(s);
}
async function sha256B64(bytes) {
  const buf = await crypto.subtle.digest('SHA-256', bytes);
  return bytesToB64(new Uint8Array(buf));
}

// ---------- Auth check ----------
async function getUser(request, env) {
  const auth = request.headers.get('Authorization') || '';
  if (!auth.startsWith('Bearer ')) return null;
  const token = auth.slice(7);
  try {
    const res = await fetch(env.SUPABASE_URL + '/auth/v1/user', {
      headers: { 'Authorization': 'Bearer ' + token, 'apikey': env.SUPABASE_ANON }
    });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

// ---------- Parse PKCS#12 ----------
function parsePfx(pfxBase64, pass) {
  const pfxDer = forge.util.decode64(pfxBase64);
  const pfxAsn1 = forge.asn1.fromDer(pfxDer);
  const p12 = forge.pkcs12.pkcs12FromAsn1(pfxAsn1, false, pass);
  let privateKey = null, certificate = null, chain = [];
  for (const safeContents of p12.safeContents) {
    for (const safeBag of safeContents.safeBags) {
      if (safeBag.type === forge.pki.oids.keyBag || safeBag.type === forge.pki.oids.pkcs8ShroudedKeyBag) {
        privateKey = safeBag.key;
      } else if (safeBag.type === forge.pki.oids.certBag) {
        if (!certificate) certificate = safeBag.cert;
        chain.push(safeBag.cert);
      }
    }
  }
  if (!privateKey || !certificate) throw new Error('p12 missing key or cert');
  return { privateKey, certificate, chain };
}

// ---------- Construir PAdES-BES ----------
async function signPdfPades(pdfBytes, privateKey, certificate, chain, opts) {
  const pdfDoc = await PDFDocument.load(pdfBytes, { updateMetadata: false });

  // Constrói o objeto Sig dictionary
  const signatureLength = 16384; // espaço reservado para o /Contents (PKCS#7)
  const placeholder = Array(signatureLength).fill('0').join('');

  const sigDict = pdfDoc.context.obj({
    Type: 'Sig',
    Filter: 'Adobe.PPKLite',
    SubFilter: 'adbe.pkcs7.detached',
    ByteRange: [0, 0, 0, 0],            // será atualizado
    Contents: PDFHexString.of(placeholder),
    Reason: PDFString.of(opts.reason || 'Assinatura digital ICP-Brasil'),
    Location: PDFString.of(opts.location || 'NeuroPed SDG'),
    ContactInfo: PDFString.of(opts.contact || ''),
    Name: PDFString.of(opts.signerName || 'Dr. Jadson Fraga'),
    M: PDFString.of('D:' + new Date().toISOString().replace(/[-:T]/g,'').slice(0,14) + 'Z00\'00\'')
  });
  const sigRef = pdfDoc.context.register(sigDict);

  // Form field para assinatura
  const fieldDict = pdfDoc.context.obj({
    Type: 'Annot',
    Subtype: 'Widget',
    FT: 'Sig',
    Rect: [0, 0, 0, 0],
    V: sigRef,
    T: PDFString.of('Signature1'),
    F: 4,
    P: pdfDoc.getPage(0).ref
  });
  const fieldRef = pdfDoc.context.register(fieldDict);

  // AcroForm
  const acroForm = pdfDoc.context.obj({
    Fields: [fieldRef],
    SigFlags: 3
  });
  const acroRef = pdfDoc.context.register(acroForm);
  pdfDoc.catalog.set(PDFName.of('AcroForm'), acroRef);

  // Salva PDF com placeholder
  const pdfWithPlaceholder = await pdfDoc.save({ useObjectStreams: false });

  // Acha as posições do /Contents <0000...> e do /ByteRange [0 0 0 0]
  const pdfStr = new TextDecoder('latin1').decode(pdfWithPlaceholder);
  const contentsMarker = '/Contents <' + placeholder + '>';
  const contentsIdx = pdfStr.indexOf(contentsMarker);
  if (contentsIdx < 0) throw new Error('PDF placeholder not found');
  const contentsStart = contentsIdx + '/Contents <'.length;
  const contentsEnd = contentsStart + signatureLength;

  const byteRangeRegex = /\/ByteRange\s*\[\s*0\s+0\s+0\s+0\s*\]/;
  const byteRangeMatch = pdfStr.match(byteRangeRegex);
  if (!byteRangeMatch) throw new Error('ByteRange placeholder not found');

  // Constrói o ByteRange final
  const before = contentsStart - 1;  // -1 para excluir o '<'
  const afterStart = contentsEnd + 1; // +1 para excluir o '>'
  const total = pdfWithPlaceholder.length;
  const br = [0, before, afterStart, total - afterStart];

  const brString = `/ByteRange [${br[0]} ${br[1]} ${br[2]} ${br[3]}]`.padEnd(byteRangeMatch[0].length, ' ');

  // Substitui ByteRange no buffer
  const pdfBuffer = new Uint8Array(pdfWithPlaceholder);
  const brBytes = new TextEncoder().encode(brString);
  for (let i = 0; i < brBytes.length; i++) {
    pdfBuffer[byteRangeMatch.index + i] = brBytes[i];
  }

  // Concatena byte range para assinatura
  const part1 = pdfBuffer.slice(0, before);
  const part2 = pdfBuffer.slice(afterStart, total);
  const toSign = new Uint8Array(part1.length + part2.length);
  toSign.set(part1, 0);
  toSign.set(part2, part1.length);

  // Calcula SHA-256 do conteúdo
  const digestBuf = await crypto.subtle.digest('SHA-256', toSign);
  const digestHex = [...new Uint8Array(digestBuf)].map(b => b.toString(16).padStart(2,'0')).join('');

  // Constrói PKCS#7 detached usando node-forge
  const p7 = forge.pkcs7.createSignedData();
  p7.content = forge.util.createBuffer(toSign.buffer);
  p7.addCertificate(certificate);
  for (const c of chain) {
    if (c !== certificate) p7.addCertificate(c);
  }
  p7.addSigner({
    key: privateKey,
    certificate: certificate,
    digestAlgorithm: forge.pki.oids.sha256,
    authenticatedAttributes: [
      { type: forge.pki.oids.contentType, value: forge.pki.oids.data },
      { type: forge.pki.oids.messageDigest },
      { type: forge.pki.oids.signingTime, value: new Date() }
    ]
  });
  p7.sign({ detached: true });
  const pkcs7Der = forge.asn1.toDer(p7.toAsn1()).getBytes();

  // Converte para hex e preenche placeholder
  let hexSig = '';
  for (let i = 0; i < pkcs7Der.length; i++) {
    hexSig += pkcs7Der.charCodeAt(i).toString(16).padStart(2, '0');
  }
  hexSig = hexSig.padEnd(signatureLength, '0');

  // Substitui no buffer
  const hexBytes = new TextEncoder().encode(hexSig);
  for (let i = 0; i < hexBytes.length; i++) {
    pdfBuffer[contentsStart + i] = hexBytes[i];
  }

  // Hash do PDF final assinado
  const finalDigestBuf = await crypto.subtle.digest('SHA-256', pdfBuffer);
  const finalDigestB64 = bytesToB64(new Uint8Array(finalDigestBuf));

  return {
    pdfSigned: pdfBuffer,
    pdfHashB64: finalDigestB64,
    signedDigestHex: digestHex,
    certificate: certificate
  };
}

// ---------- Handler principal ----------
export async function onRequestPost({ request, env }) {
  try {
    // 1. Auth
    const user = await getUser(request, env);
    if (!user) return json({ ok: false, error: 'unauthorized' }, 401);

    // 2. Body
    const body = await request.json();
    if (!body.document_id || !body.pdf_base64) {
      return json({ ok: false, error: 'missing_fields' }, 400);
    }

    const pdfBytes = b64ToBytes(body.pdf_base64);

    let signedPdfB64, signaturePayload, certInfo;

    if (env.CERT_PFX_BASE64 && env.CERT_PASS) {
      // === MODO ICP-Brasil PAdES ===
      const { privateKey, certificate, chain } = parsePfx(env.CERT_PFX_BASE64, env.CERT_PASS);
      const result = await signPdfPades(pdfBytes, privateKey, certificate, chain, {
        signerName: body.signer_name || env.CERT_SUBJECT_CN || 'Médico',
        location: body.location || 'NeuroPed SDG',
        reason: 'Documento médico — Lei 14.063/2020 / MP 2.200-2/2001',
        contact: body.contact || ''
      });

      signedPdfB64 = bytesToB64(result.pdfSigned);

      const subject = certificate.subject.attributes.map(a => a.shortName + '=' + a.value).join(', ');
      const issuer = certificate.issuer.attributes.map(a => a.shortName + '=' + a.value).join(', ');

      certInfo = {
        subject,
        issuer,
        serial: certificate.serialNumber,
        valid_from: certificate.validity.notBefore.toISOString(),
        valid_until: certificate.validity.notAfter.toISOString()
      };

      signaturePayload = {
        document_id: body.document_id,
        signer_user_id: user.id,
        signer_name: body.signer_name || env.CERT_SUBJECT_CN,
        signer_crm: body.signer_crm || null,
        certificate_subject: subject,
        certificate_issuer: issuer,
        certificate_serial: certificate.serialNumber,
        certificate_valid_from: certInfo.valid_from,
        certificate_valid_until: certInfo.valid_until,
        signature_format: 'PAdES-BES',
        signature_algorithm: 'RSA-SHA256',
        signed_pdf_hash: result.pdfHashB64,
        verification_url: (env.PUBLIC_BASE_URL || '') + '/verificar?doc=' + encodeURIComponent(result.pdfHashB64),
        public_metadata: { icp_brasil: true, format: 'PAdES-BES', provider: 'cloudflare-functions' }
      };
    } else {
      // === MODO AVANÇADO (sem ICP-Brasil) ===
      // Fail-closed: sem SIGNING_SECRET configurado NÃO assinamos. O fallback
      // antigo usava uma chave de dev conhecida ('NEUROPED_DEV_KEY') → qualquer
      // um reproduziria o HMAC e forjaria a assinatura. Melhor erro explícito do
      // que documento "assinado" com chave pública. Configure SIGNING_SECRET
      // (Secret no Cloudflare Pages) ou habilite o certificado ICP-Brasil.
      if (!env.SIGNING_SECRET) {
        return json({ ok: false, error: 'signing_not_configured' }, 503);
      }
      const sigKey = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(env.SIGNING_SECRET),
        { name: 'HMAC', hash: 'SHA-256' },
        false, ['sign']
      );
      const sigBuf = await crypto.subtle.sign('HMAC', sigKey, pdfBytes);
      const pdfHashB64 = await sha256B64(pdfBytes);

      signedPdfB64 = body.pdf_base64; // PDF não modificado em modo avançado
      certInfo = {
        subject: 'NeuroPed SDG — Advanced Signature',
        issuer: 'Self',
        valid_until: new Date(Date.now() + 365*86400000).toISOString()
      };
      signaturePayload = {
        document_id: body.document_id,
        signer_user_id: user.id,
        signer_name: body.signer_name || user.email,
        signer_crm: body.signer_crm,
        certificate_subject: certInfo.subject,
        certificate_issuer: certInfo.issuer,
        signature_format: 'NEUROPED-ADV-V1',
        signature_algorithm: 'HMAC-SHA256',
        signature_bytes_base64: bytesToB64(new Uint8Array(sigBuf)),
        signed_pdf_hash: pdfHashB64,
        verification_url: (env.PUBLIC_BASE_URL || '') + '/verificar?doc=' + encodeURIComponent(pdfHashB64),
        public_metadata: { icp_brasil: false, format: 'advanced', provider: 'cloudflare-functions' }
      };
    }

    // 3. Salva no Supabase
    const sigInsert = await fetch(env.SUPABASE_URL + '/rest/v1/signatures', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': env.SUPABASE_SERVICE_ROLE,
        'Authorization': 'Bearer ' + env.SUPABASE_SERVICE_ROLE,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(signaturePayload)
    });
    if (!sigInsert.ok) {
      const err = await sigInsert.text();
      return json({ ok: false, error: 'supabase_error', detail: err.slice(0, 200) }, 500);
    }
    const sigRow = (await sigInsert.json())[0];

    // 4. Audit log
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
        metadata: {
          hash: signaturePayload.signed_pdf_hash,
          format: signaturePayload.signature_format,
          icp: signaturePayload.public_metadata.icp_brasil
        }
      })
    });

    // 5. Atualiza document
    await fetch(env.SUPABASE_URL + '/rest/v1/documents?id=eq.' + body.document_id, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': env.SUPABASE_SERVICE_ROLE,
        'Authorization': 'Bearer ' + env.SUPABASE_SERVICE_ROLE
      },
      body: JSON.stringify({
        status: 'assinado',
        signed_at: new Date().toISOString(),
        signature_id: sigRow.id,
        content_hash: signaturePayload.signed_pdf_hash
      })
    });

    return json({
      ok: true,
      signed_pdf_base64: signedPdfB64,
      signature_id: sigRow.id,
      content_hash: signaturePayload.signed_pdf_hash,
      verification_url: signaturePayload.verification_url,
      format: signaturePayload.signature_format,
      icp_brasil: signaturePayload.public_metadata.icp_brasil,
      certificate: certInfo,
      signed_at: new Date().toISOString()
    });

  } catch (e) {
    return json({ ok: false, error: 'internal', detail: e.message }, 500);
  }
}
