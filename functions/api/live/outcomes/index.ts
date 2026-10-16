/**
 * Painel de resultados (item 8) — SÓ agregados, da própria clínica.
 *
 * - Todas as consultas filtram por clinic_id; nenhuma devolve id/nome de paciente ou de usuário.
 * - Permissão `outcomes.read` (owner, clinic_admin, professional). Secretaria/financeiro: 403.
 * - Sem IA externa, sem envio externo. Só leitura (a premissa de tempo é editada em ./assumptions).
 * - Cada bloco tolera tabela ausente (migration não aplicada): vira `null` e a tela diz "indisponível".
 * - Testes próprios do NeuroPad: só contagem de aplicações; nunca resultado, corte, nível ou classe.
 */
import { getContextUser } from "../../auth/_authorization";
import { requireBillingEntitlement } from "../../billing/_guard";
import { parseOutcomeWindow } from "../../../../shared/outcomes";
import { getClinicMembership, membershipHas, tenantError, tenantJson, type TenantEnv } from "../../tenant/_core";
import { readOutcomes } from "./_read";

export const onRequestGet: PagesFunction<TenantEnv> = async (context) => {
  const db = context.env.DB;
  const user = getContextUser(context);
  if (!db) return tenantError("Banco LIVE não configurado.", "SAAS_DB_NOT_CONFIGURED", 503);
  if (!user) return tenantError("Não autenticado.", "UNAUTHENTICATED", 401);
  const url = new URL(context.request.url);
  const clinicId = (url.searchParams.get("clinicId") ?? "").trim().slice(0, 80);
  if (!clinicId) return tenantError("clinicId é obrigatório.", "VALIDATION_ERROR", 400);
  const days = parseOutcomeWindow(url.searchParams.get("days"));
  if (days === null) return tenantError("days deve ser 7, 30 ou 90.", "VALIDATION_ERROR", 400);
  const membership = await getClinicMembership(db, clinicId, user);
  if (!membership || !membershipHas(membership, "outcomes.read")) {
    return tenantError("Painel de resultados indisponível para o seu papel nesta clínica.", "TENANT_FORBIDDEN", 403);
  }
  const billingError = await requireBillingEntitlement(db, user.id, clinicId, "clinical");
  if (billingError) return billingError;
  try {
    return tenantJson({ data: await readOutcomes(db, clinicId, days) });
  } catch (error) {
    console.error("[live.outcomes.GET] DB error", error);
    return tenantError("Não foi possível calcular o painel.", "DB_ERROR", 500);
  }
};
