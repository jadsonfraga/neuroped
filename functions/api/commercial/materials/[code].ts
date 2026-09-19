import { tenantError, tenantJson } from "../../tenant/_core";
import { recordCommercialUsage } from "../_core";
import { readClinicId, requireCommercialFeature, type CommercialGuardEnv } from "../_guard";

const EXPORT_CHANNELS = new Set(["print", "email", "copy", "download"]);

function paramCode(params: Record<string, string | string[]>): string {
  const raw = params.code;
  const value = Array.isArray(raw) ? raw[0] : raw;
  return (value ?? "").trim().slice(0, 80);
}

/**
 * GET /api/commercial/materials/:code?clinicId=...
 *
 * Confirma o entitlement no servidor e registra a abertura no ledger comercial.
 * A tela do material vive no cliente; este endpoint é a autoridade que diz se
 * aquela abertura é legítima naquela unidade, para aquele usuário, hoje.
 */
export const onRequestGet: PagesFunction<CommercialGuardEnv> = async (context) => {
  const clinicId = readClinicId(context.request);
  const guard = await requireCommercialFeature(context, paramCode(context.params), clinicId);
  if (!guard.ok) return guard.response;

  const { db, user, snapshot, material } = guard.context;
  try {
    await recordCommercialUsage(db, {
      clinicId: snapshot.clinicId,
      licenseId: snapshot.licenseId,
      actorUserId: user.id,
      kind: "material_open",
      featureCode: material.code,
      metadata: { materialId: material.code, deliveryChannel: material.deliveryChannel },
    });
  } catch {
    // O ledger comercial é parte do que foi vendido. Não devolvemos sucesso de
    // abertura sem tê-la registrado.
    return tenantError(
      "Não foi possível registrar a abertura do material.",
      "COMMERCIAL_USAGE_NOT_RECORDED",
      500,
    );
  }

  return tenantJson({
    material: {
      code: material.code,
      title: material.title,
      summary: material.summary,
      routes: [...material.routes],
      deliveryChannel: material.deliveryChannel,
    },
    license: {
      id: snapshot.licenseId,
      offerCode: snapshot.offerCode,
      contractVersion: snapshot.contractVersion,
      expiresAt: snapshot.expiresAt,
    },
  });
};

/**
 * POST /api/commercial/materials/:code?clinicId=...
 *
 * Registra a entrega efetiva (impressão, e-mail, cópia ou download) do material
 * licenciado. Nada do conteúdo preenchido é enviado: o corpo aceita apenas o
 * canal, e a metadata passa pela allow-list compartilhada.
 */
export const onRequestPost: PagesFunction<CommercialGuardEnv> = async (context) => {
  const clinicId = readClinicId(context.request);
  const guard = await requireCommercialFeature(context, paramCode(context.params), clinicId);
  if (!guard.ok) return guard.response;

  let body: Record<string, unknown>;
  try {
    const parsed = await context.request.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return tenantError("Corpo JSON inválido.", "INVALID_JSON", 400);
    }
    body = parsed as Record<string, unknown>;
  } catch {
    return tenantError("Corpo JSON inválido.", "INVALID_JSON", 400);
  }

  const channel = typeof body.channel === "string" ? body.channel.trim() : "";
  if (!EXPORT_CHANNELS.has(channel)) {
    return tenantError(
      "channel deve ser print, email, copy ou download.",
      "COMMERCIAL_EXPORT_CHANNEL_INVALID",
      400,
    );
  }

  const { db, user, snapshot, material } = guard.context;
  try {
    await recordCommercialUsage(db, {
      clinicId: snapshot.clinicId,
      licenseId: snapshot.licenseId,
      actorUserId: user.id,
      kind: "material_export",
      featureCode: material.code,
      metadata: { materialId: material.code, deliveryChannel: channel },
    });
  } catch {
    return tenantError(
      "Não foi possível registrar a entrega do material.",
      "COMMERCIAL_USAGE_NOT_RECORDED",
      500,
    );
  }

  return tenantJson({ recorded: true, code: material.code, channel });
};
