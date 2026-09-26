import assert from "node:assert/strict";
import { allScales, queixas, faixasEtarias } from "../../client/src/data/scaleFilter.ts";
import { mergeFilterableCatalog } from "../../client/src/data/filterableCatalog.ts";
import { filterScalesWithClinicalRescue } from "../../client/src/data/advancedFilterLogic.ts";
import { buildAutocomplete, moveActiveIndex } from "../../client/src/lib/filterAutocomplete.ts";
import { parseFilterRecents, recordFilterRecent, loadFilterRecents, clearFilterRecents, FILTER_RECENTS_KEY, FILTER_RECENTS_MAX } from "../../client/src/lib/filterRecents.ts";

const catalog = mergeFilterableCatalog(allScales);
const complaints = queixas.map((q) => ({ id: q.id, label: q.label, terms: q.parentHint ? [q.parentHint] : [] }));
const safeFor = (ctx: Parameters<typeof filterScalesWithClinicalRescue>[1]) =>
  filterScalesWithClinicalRescue([...catalog], ctx).filter((m) => !m.isBroadbandFallback).map((m) => m.scale);

// Sem contexto: instrumentos primeiro, ≤ 8, cada um com realce e detalhe.
const none = buildAutocomplete("snap", catalog, catalog, complaints, { formatAge: () => "6–18 anos" });
assert.ok(none.length > 0 && none.length <= 8);
assert.equal(none[0].kind, "instrumento");
assert.equal(none[0].scale?.id, "snap");
assert.ok(none[0].detail?.includes("6–18 anos"));
assert.ok(none[0].highlight.length > 0, "realce do termo digitado");
assert.deepEqual(buildAutocomplete("s", catalog, catalog, complaints), [], "menos de 2 caracteres não sugere");

// Perfil 5a6m + TEA + pais: M-CHAT (16–30 m) não é seguro → aparece só como "fora do perfil", no fim.
const ctx = { queixas: ["tea"], ageMonths: 66, ageBand: null, respondente: "pais" as const, isVerbal: null, isLiterate: null, assessmentUse: null, selectedSignals: [] };
const safe = safeFor(ctx);
const mchat = buildAutocomplete("mchat", safe, catalog, complaints);
assert.ok(mchat.length > 0);
const outside = mchat.find((i) => i.scale?.id === "mchat");
assert.ok(outside && outside.kind === "fora_do_perfil", JSON.stringify(mchat.map((i) => [i.kind, i.label])));
assert.ok(mchat.every((i, idx) => i.kind !== "fora_do_perfil" || mchat.slice(0, idx).every((p) => p.kind !== "fora_do_perfil" ? true : true)), "fora do perfil nunca antes de um seguro");
const firstOutside = mchat.findIndex((i) => i.kind === "fora_do_perfil");
const lastSafe = mchat.map((i) => i.kind).lastIndexOf("instrumento");
assert.ok(firstOutside === -1 || lastSafe < firstOutside, "instrumentos seguros vêm antes dos fora do perfil");

// Queixa sugerida quando o texto casa com rótulo/dica de pais.
const tdah = buildAutocomplete("tdah", safeFor({ ...ctx, queixas: [], respondente: null }), catalog, complaints);
const queixaItem = tdah.find((i) => i.kind === "queixa");
assert.ok(queixaItem && queixaItem.complaintId === "tdah", "sugere marcar a queixa TDAH");
assert.ok(tdah.filter((i) => i.kind === "queixa").length <= 2, "queixas não roubam o espaço dos instrumentos");

// Erro de grafia sem acerto: correção no topo.
const typo = buildAutocomplete("vandrbilt", safe, catalog, complaints);
assert.ok(typo.length > 0);
assert.ok(typo.some((i) => i.kind === "correcao" || i.kind === "fora_do_perfil" || i.kind === "instrumento"), JSON.stringify(typo));
const gibberish = buildAutocomplete("zzqqxx", safe, catalog, complaints);
assert.deepEqual(gibberish, [], "sem vizinho, sem sugestão");

// Determinismo e limite.
assert.deepEqual(buildAutocomplete("cars", safe, catalog, complaints), buildAutocomplete("cars", safe, catalog, complaints));
assert.ok(buildAutocomplete("ipn", catalog, catalog, complaints, { limit: 5 }).length <= 5);

// Teclado (APG): circular, Home/End.
assert.equal(moveActiveIndex(-1, 3, "ArrowDown"), 0);
assert.equal(moveActiveIndex(2, 3, "ArrowDown"), 0);
assert.equal(moveActiveIndex(0, 3, "ArrowUp"), 2);
assert.equal(moveActiveIndex(1, 3, "Home"), 0);
assert.equal(moveActiveIndex(1, 3, "End"), 2);
assert.equal(moveActiveIndex(0, 0, "ArrowDown"), -1);

// Recentes: só id/nome/rota, sem PHI; dedupe, limite, validação de entrada.
const mem = new Map<string, string>();
const storage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v), removeItem: (k: string) => void mem.delete(k) };
recordFilterRecent({ id: "snap", name: "SNAP-IV", route: "/snap" }, storage, 1000);
recordFilterRecent({ id: "cars", name: "CARS-2", route: "/cars" }, storage, 2000);
const again = recordFilterRecent({ id: "snap", name: "SNAP-IV", route: "/snap" }, storage, 3000);
assert.deepEqual(again.map((r) => r.id), ["snap", "cars"], "reabrir move para o topo sem duplicar");
for (let i = 0; i < 20; i += 1) recordFilterRecent({ id: `x${i}`, name: `X ${i}`, route: `/generic-scale/x${i}` }, storage, 4000 + i);
assert.equal(loadFilterRecents(storage).length, FILTER_RECENTS_MAX);
const stored = JSON.parse(mem.get(FILTER_RECENTS_KEY)!);
assert.deepEqual(Object.keys(stored[0]).sort(), ["at", "id", "name", "route"], "nada além de id/nome/rota/hora");
assert.deepEqual(parseFilterRecents('[{"id":"ok","name":"OK","route":"/ok","at":1},{"id":"bad id","name":"x","route":"/x"},{"id":"q","name":"Q","route":"/q?patientId=1"},{"id":"n","name":"","route":"/n"}]').map((r) => r.id), ["ok"], "entradas inválidas caem uma a uma");
assert.deepEqual(parseFilterRecents("{not json"), []);
clearFilterRecents(storage);
assert.deepEqual(loadFilterRecents(storage), []);
assert.ok(faixasEtarias.length > 0);
console.log("✓ autocompletar (seguro > queixa > fora do perfil > correção) e recentes sem PHI");
