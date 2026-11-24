import { isPlainObject } from "../../_request";
import { tenantError, type TenantEnv } from "../../tenant/_core";
import { listLivePatients } from "./index";

export const onRequestPost: PagesFunction<TenantEnv> = async (context) => {
  let input: unknown;
  try {
    input = await context.request.json();
  } catch {
    return tenantError("Corpo JSON inválido.", "INVALID_JSON", 400);
  }
  if (!isPlainObject(input)) return tenantError("Corpo JSON inválido.", "INVALID_JSON", 400);
  return listLivePatients(context, input);
};
