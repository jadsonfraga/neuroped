/**
 * GUARD validate:licenses — registro de licença por escala (Onda 0).
 * Falha se: escala oferecida no filtro sem registro resolvível; instrumento licenciado
 * oferecido sem registro explícito ou fora da lista mantida pelo responsável; registro
 * "verificado" sem URL/data; escala de onda ≥ 1 sem fonte verificada e uso em software permitido.
 */
import { allScales } from "../../client/src/data/scaleFilter.ts";
import { noCostWorldScales } from "../../client/src/data/noCostWorldScales.ts";
import { mergeFilterableCatalog } from "../../client/src/data/filterableCatalog.ts";
import {
  SCALE_LICENSE_RECORDS, OWNER_RETAINED_LICENSED_IDS, resolveLicenseRecord,
  requiresExplicitLicenseRecord, getExplicitLicenseRecord,
} from "../../client/src/data/scaleLicenseRegistry.ts";
import { INTERACTIVE_SCALE_IDS } from "../../client/src/data/interactiveScaleIds.generated.ts";

const offered = mergeFilterableCatalog([...allScales, ...noCostWorldScales]);
const errors: string[] = [];
const retained = new Set(OWNER_RETAINED_LICENSED_IDS);

for (const s of offered) {
  const rec = resolveLicenseRecord(s);
  if (!rec) { errors.push(`${s.id}: sem registro de licença (licencaUso=${s.licencaUso ?? "ausente"}).`); continue; }
  if (requiresExplicitLicenseRecord(s) && !getExplicitLicenseRecord(s.id)) {
    errors.push(`${s.id}: licença ${s.licencaUso ?? "ausente"} exige registro explícito em scaleLicenseRegistry.ts.`);
  }
  const restricted = s.licencaUso === "restrita" || s.licencaUso === "comercial" || s.licencaUso === "contato_autor";
  if (restricted && !retained.has(s.id) && getExplicitLicenseRecord(s.id)?.softwareAllowed !== true) {
    errors.push(`${s.id}: instrumento licenciado oferecido sem estar na lista mantida pelo responsável nem com uso em software verificado.`);
  }
}
for (const r of SCALE_LICENSE_RECORDS) {
  if (r.basis === "verified_official_source" && (!r.sourceUrl || !r.verifiedOn)) errors.push(`${r.id}: registro verificado sem sourceUrl/verifiedOn.`);
  if (r.basis === "owner_decision" && r.softwareAllowed === true) errors.push(`${r.id}: decisão do responsável não pode afirmar licença verificada.`);
  if ((r.wave ?? 0) >= 1) {
    if (r.basis !== "verified_official_source" || !r.sourceUrl || !r.verifiedOn) errors.push(`${r.id}: escala de onda ${r.wave} exige fonte oficial verificada.`);
    if (r.softwareAllowed !== true) errors.push(`${r.id}: escala de onda ${r.wave} exige uso em software permitido.`);
    if (!r.attribution) errors.push(`${r.id}: escala de onda ${r.wave} exige atribuição.`);
    if (!INTERACTIVE_SCALE_IDS.has(r.id)) errors.push(`${r.id}: escala de onda ${r.wave} sem aplicação interativa.`);
  }
}
if (errors.length) { console.error(`validate:licenses FALHOU (${errors.length}):\n` + errors.map((e) => " - " + e).join("\n")); process.exit(1); }
console.log(`validate:licenses OK — ${offered.length} escalas oferecidas, ${SCALE_LICENSE_RECORDS.length} registros explícitos, ${retained.size} licenciadas mantidas por decisão do responsável.`);
