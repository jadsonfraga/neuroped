import { tenantError, tenantJson } from "../../tenant/_core";
import { recordCommercialUsage } from "../_core";
import { readClinicId, requireCommercialFeature, type CommercialGuardEnv } from "../_guard";

const EXPORT_CHANNELS = new Set(["print", "email", "copy", "download"]);

function paramCode(params: Record<string, string | string[]>): string {
  const raw = params.code;
  const value = Array.isArray(raw) ? raw[0] : raw;
  return (value ?? "").trim().slice(0, 80);
}

function usageFailure(error: unknown): Response {
  const detail = error instanceof Error ? `${error.message} ${String(error.cause ?? "")}` : String(error);
  if (detail.includes("COMMERCIAL_ACCESS_CHANGED")) {
    return tenantError("O vínculo, a unidade ou a licença mudou durante a operação. Confirme novamente o acesso.", "COMMERCIAL_ACCESS_CHANGED", 403);
  }
  return tenantError("Não foi possível registrar a operação do material.", "COMMERCIAL_USAGE_NOT_RECORDED", 500);
}

/** Confirma entitlement e registra abertura; o INSERT revalida o vínculo atual. */
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
  } catch (error) {
    return usageFailure(error);
  }

  return tenantJson({
    material: {
      code: material.code, title: material.title, summary: material.summary,
      routes: [...material.routes], deliveryChannel: material.deliveryChannel,
    },
    license: {
      id: snapshot.licenseId, offerCode: snapshot.offerCode,
      contractVersion: snapshot.contractVersion, expiresAt: snapshot.expiresAt,
    },
  });
};

/**
 * Autoriza e registra o INÍCIO de uma exportação, antes da ação no navegador.
 * Não comprova impressão concluída, entrega de e-mail nem salvamento em disco:
 * esses resultados dependem do usuário/cliente externo e podem ser cancelados.
 * Nenhum conteúdo do material é aceito; somente o canal operacional.
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
  if (Object.keys(body).some((key) => key !== "channel")) {
    return tenantError("Envie somente o canal, nunca conteúdo do material.", "COMMERCIAL_EXPORT_BODY_INVALID", 400);
  }

  const channel = typeof body.channel === "string" ? body.channel.trim() : "";
  if (!EXPORT_CHANNELS.has(channel)) {
    return tenantError("channel deve ser print, email, copy ou download.", "COMMERCIAL_EXPORT_CHANNEL_INVALID", 400);
  }
  const { db, user, snapshot, material } = guard.context;
  try {
    await recordCommercialUsage(db, {
      clinicId: snapshot.clinicId, licenseId: snapshot.licenseId, actorUserId: user.id,
      kind: "material_export", featureCode: material.code,
      metadata: { materialId: material.code, deliveryChannel: channel },
    });
  } catch (error) {
    return usageFailure(error);
  }
  return tenantJson({ recorded: true, stage: "authorized_initiation", code: material.code, channel });
};
