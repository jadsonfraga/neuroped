import { getContextUser } from "../auth/_authorization";
import { getClinicMembership, tenantError, tenantJson, type TenantEnv } from "../tenant/_core";
import { clinicalCryptoReady, decryptClinicalJson, encryptClinicalJson } from "../tenant/_crypto";
import { FACSIMILE_MAX_SEGMENTS, FACSIMILE_SEGMENT_SIZE, facsimileDigest, hasFacsimileShape, type FacsimileMedia, ownerFacsimileEligible, readBoundedFacsimile, verifyFacsimileObject } from "./_pdfFacsimile";

interface Env extends TenantEnv {
  NEUROPED_PDF_FACSIMILE_USER_ID?: string;
  NEUROPED_PDF_FACSIMILE_CLINIC_ID?: string;
}

const privateHeaders = { "Cache-Control": "private, no-store, max-age=0", "X-Content-Type-Options": "nosniff", Vary: "Authorization, X-Tenant-Id" };
const notApplicable = () => new Response(null, { status: 204, headers: privateHeaders });
const unavailable = () => tenantError("Imagem manuscrita do proprietário indisponível.", "PDF_FACSIMILE_UNAVAILABLE", 503);
const noImage = () => tenantError("Cadastre a imagem no perfil do proprietário antes de gerar o PDF.", "PDF_FACSIMILE_NOT_REGISTERED", 503);

async function authorized(context: EventContext<Env, string, Record<string, unknown>>, write: boolean) {
  const { env, request } = context;
  const user = getContextUser(context);
  const deny = () => write ? tenantError("Apenas o proprietário configurado pode cadastrar a imagem.", "FORBIDDEN", 403) : notApplicable();
  if (!user) return tenantError("Não autenticado.", "UNAUTHENTICATED", 401);
  const expectedUser = env.NEUROPED_PDF_FACSIMILE_USER_ID?.trim() ?? "";
  const expectedClinic = env.NEUROPED_PDF_FACSIMILE_CLINIC_ID?.trim() ?? "";
  if (!expectedUser || user.id !== expectedUser || user.mustChangePassword) return deny();
  const clinicId = request.headers.get("X-Tenant-Id")?.trim() ?? "";
  if (!expectedClinic || !clinicId || !env.DB) return unavailable();
  if (clinicId !== expectedClinic) return deny();
  const membership = await getClinicMembership(env.DB, clinicId, user);
  if (!membership || !ownerFacsimileEligible({
    userId: user.id, clinicId, clinicRole: membership.role, clinicStatus: membership.clinicStatus,
    expectedUser, expectedClinic, passwordChangeRequired: Boolean(user.mustChangePassword),
  })) return deny();
  if (!clinicalCryptoReady(env)) return unavailable();
  return { db: env.DB, clinicId, userId: user.id };
}

const ownerPredicate = `EXISTS (SELECT 1 FROM clinic_memberships m JOIN clinics c ON c.id = m.clinic_id
  WHERE m.clinic_id = ? AND m.user_id = ? AND m.active = 1 AND m.role = 'owner' AND c.status = 'active')`;
const purpose = (userId: string, hash: string, i: number) => `owner-pdf-facsimile:${userId}:${hash}:${i}`;
interface Segment { media_type: FacsimileMedia; image_sha256: string; segment_count: number; segment_order: number; ciphertext: string }

export const onRequestGet: PagesFunction<Env> = async context => {
  try {
    const scope = await authorized(context, false);
    if (scope instanceof Response) return scope;
    const { db, clinicId, userId } = scope;
    if (new URL(context.request.url).searchParams.get("configuration") === "1") {
      const row = await db.prepare(`SELECT 1 AS present FROM owner_pdf_facsimile WHERE clinic_id = ? AND user_id = ?
        AND ${ownerPredicate}`).bind(clinicId, userId, clinicId, userId).first<{ present: number }>();
      return tenantJson({ configured: row?.present === 1 });
    }
    const q = await db.prepare(`SELECT p.media_type, p.image_sha256, p.segment_count, s.segment_order, s.ciphertext
      FROM owner_pdf_facsimile p JOIN owner_pdf_facsimile_segment s
      ON s.clinic_id = p.clinic_id AND s.user_id = p.user_id
      WHERE p.clinic_id = ? AND p.user_id = ? AND ${ownerPredicate}
      ORDER BY s.segment_order`).bind(clinicId, userId, clinicId, userId).all<Segment>();
    const rows = q.results;
    if (!rows.length) return noImage();
    const { image_sha256: hash, media_type: media } = rows[0];
    if (media !== "image/png" && media !== "image/jpeg") return unavailable();
    if (rows.length !== rows[0].segment_count || rows.length > FACSIMILE_MAX_SEGMENTS) return unavailable();
    const buffer = new Uint8Array(FACSIMILE_SEGMENT_SIZE * FACSIMILE_MAX_SEGMENTS);
    let size = 0;
    for (const [index, row] of rows.entries()) {
      if (row.segment_order !== index || row.image_sha256 !== hash) return unavailable();
      const base64 = await decryptClinicalJson<string>(context.env, clinicId, purpose(userId, hash, index), row.ciphertext);
      const binary = atob(base64);
      if (binary.length < 1 || binary.length > FACSIMILE_SEGMENT_SIZE || size + binary.length > buffer.length) return unavailable();
      for (let i = 0; i < binary.length; i++) buffer[size++] = binary.charCodeAt(i);
    }
    const body = buffer.slice(0, size);
    if (!await verifyFacsimileObject(body, hash, media)) return unavailable();
    return new Response(body, { headers: { ...privateHeaders, "Content-Type": media } });
  } catch { return unavailable(); }
};

export const onRequestPut: PagesFunction<Env> = async context => {
  try {
    const scope = await authorized(context, true);
    if (scope instanceof Response) return scope;
    const { db, clinicId, userId } = scope;
    const upload = await readBoundedFacsimile(context.request);
    if (!upload || !hasFacsimileShape(upload.bytes, upload.media)) return tenantError("Envie um PNG de até 480 KB ou um JPEG de até 120 KB.", "INVALID_PDF_FACSIMILE", 400);
    const { bytes: body, media } = upload;
    const hash = await facsimileDigest(body);
    const count = Math.ceil(body.length / FACSIMILE_SEGMENT_SIZE);
    const batch = [
      db.prepare(`INSERT INTO owner_pdf_facsimile (clinic_id, user_id, media_type, image_sha256, segment_count)
        SELECT ?, ?, ?, ?, ? WHERE ${ownerPredicate}
        ON CONFLICT (clinic_id, user_id) DO UPDATE SET media_type = excluded.media_type, image_sha256 = excluded.image_sha256,
        segment_count = excluded.segment_count, updated_at = CURRENT_TIMESTAMP`)
        .bind(clinicId, userId, media, hash, count, clinicId, userId),
      db.prepare(`DELETE FROM owner_pdf_facsimile_segment WHERE clinic_id = ? AND user_id = ? AND ${ownerPredicate}`)
        .bind(clinicId, userId, clinicId, userId),
    ];
    for (let index = 0; index < count; index++) {
      const bytes = body.subarray(index * FACSIMILE_SEGMENT_SIZE, (index + 1) * FACSIMILE_SEGMENT_SIZE);
      const base64 = btoa(String.fromCharCode(...bytes));
      const ciphertext = await encryptClinicalJson(context.env, clinicId, purpose(userId, hash, index), base64);
      batch.push(db.prepare(`INSERT INTO owner_pdf_facsimile_segment (clinic_id, user_id, segment_order, ciphertext)
        SELECT ?, ?, ?, ? WHERE ${ownerPredicate}`).bind(clinicId, userId, index, ciphertext, clinicId, userId));
    }
    const result = await db.batch(batch);
    if (result[0]?.meta.changes !== 1) return tenantError("Acesso de proprietário não confirmado.", "FORBIDDEN", 403);
    return tenantJson({ configured: true, sha256: hash });
  } catch { return unavailable(); }
};
