/**
 * GUARD validate:canonical-duplicates — um instrumento = um id no filtro.
 * Falha se aliases canônicos aparecem no catálogo oferecido, se dois itens oferecidos
 * compartilham nome normalizado ou rota dedicada, ou se um alias aponta para canônico inexistente.
 */
import { allScales } from "../../client/src/data/scaleFilter.ts";
import { noCostWorldScales } from "../../client/src/data/noCostWorldScales.ts";
import { mergeFilterableCatalog } from "../../client/src/data/filterableCatalog.ts";
import { CANONICAL_ALIASES, CANONICAL_ALIAS_IDS } from "../../client/src/data/scaleLicenseRegistry.ts";

const offered = mergeFilterableCatalog([...allScales, ...noCostWorldScales]);
const ids = new Set(offered.map((s) => s.id));
const errors: string[] = [];
for (const [canon, aliases] of Object.entries(CANONICAL_ALIASES)) {
  if (!ids.has(canon)) errors.push(`canônico ${canon} não está oferecido.`);
  for (const a of aliases) if (ids.has(a)) errors.push(`alias ${a} (de ${canon}) está oferecido.`);
}
for (const id of CANONICAL_ALIAS_IDS) if (ids.has(id)) errors.push(`alias ${id} vazou no catálogo.`);
const norm = (n: string) => n.toLowerCase().replace(/[^a-z0-9]/g, "");
const byName = new Map<string, string[]>();
const byRoute = new Map<string, string[]>();
for (const s of offered) {
  byName.set(norm(s.name), [...(byName.get(norm(s.name)) ?? []), s.id]);
  if (s.appRoute && s.appRoute !== "/testes-diretos" && s.appRoute !== "/filtro" && !s.appRoute.startsWith("/generic-scale/")) byRoute.set(s.appRoute, [...(byRoute.get(s.appRoute) ?? []), s.id]);
}
// Nomes homônimos já existentes e revisados (ratchet: lista só pode encolher).
const KNOWN_SAME_NAME: ReadonlySet<string> = new Set([]);
for (const [n, v] of byName) if (v.length > 1 && !KNOWN_SAME_NAME.has(n)) errors.push(`nome duplicado "${n}": ${v.join(", ")}`);
for (const [r, v] of byRoute) if (v.length > 1) errors.push(`rota ${r} compartilhada: ${v.join(", ")}`);
if (errors.length) { console.error(`validate:canonical-duplicates FALHOU (${errors.length}):\n` + errors.map((e) => " - " + e).join("\n")); process.exit(1); }
console.log(`validate:canonical-duplicates OK — ${offered.length} escalas oferecidas, ${Object.keys(CANONICAL_ALIASES).length} grupos canônicos.`);
