// Contrato estático: a página do filtro consome o motor de busca v2, o
// diagnóstico e o deep-link — e mantém os contratos que os testes anteriores
// exigem (idade única, cards não aninhados em Link, modo efêmero sem URL).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const engine = readFileSync("client/src/pages/filtro-engine.tsx", "utf8");
const must = [
  'from "@/lib/scaleSearch"',
  "searchScaleCatalog(matches.map((m) => m.scale), query)",
  "suggestSearchCorrections(catalog, search",
  "parseFilterQueryIntent(search)",
  "computeFilterFacetCounts(catalog, filterContext",
  "diagnoseEmptyResult(catalog, filterContext",
  "withinTimeBudget(m.scale, timeBudget)",
  "readFilterUrlState({",
  "writeFilterUrlState({",
  'data-testid="filter-query-intents"',
  'data-testid="filter-search-suggestions"',
  'data-testid="filter-applied-chips"',
  'data-testid="filter-empty-diagnosis"',
  'data-testid="filter-time-budget"',
  'data-testid="filter-sort-mode"',
  'data-testid="filter-match-reason"',
  "<CountBadge n={facetCounts?.respondente.pais} />",
  "<CountBadge n={facetCounts?.faixa[age.id]} />",
  "ref={searchInputRef}",
  'event.key !== "/"',
  // Autocompletar (combobox APG) e recentes sem PHI.
  'role="combobox"',
  'aria-controls="filter-autocomplete-listbox"',
  'aria-activedescendant={acVisible && acIndex >= 0 ? `filter-ac-option-${acIndex}` : undefined}',
  'data-testid="filter-autocomplete"',
  'data-testid="filter-autocomplete-option"',
  "buildAutocomplete(search, safeCandidates, catalog",
  "moveActiveIndex(current, autocompleteItems.length",
  'data-testid="filter-recents"',
  "loadFilterRecents()",
  "if (flashMode) return;\n    setRecents(recordFilterRecent(",
];
for (const needle of must) assert.ok(engine.includes(needle), `filtro-engine deve conter: ${needle}`);

// Busca antiga por substring foi retirada; nada de fallback silencioso.
assert.ok(!engine.includes("function searchBoost("), "searchBoost legado removido");
assert.ok(!engine.includes("expandComplaintSearch"), "expansão antiga não é mais usada pela página");

// Deep-link nunca escreve em modo efêmero (privacidade do 'triar sem cadastrar').
const urlEffect = engine.slice(engine.indexOf("// Deep-link vivo"), engine.indexOf("writeFilterUrlState({"));
assert.ok(urlEffect.includes("if (flashMode) return;"), "modo efêmero não escreve a URL");

// Respondente lido do texto só vira filtro por toque: a intenção nunca chama setSelectedRespondente fora do apply.
const intentBlock = engine.slice(engine.indexOf("const pendingIntents = useMemo"), engine.indexOf("// \"Você quis dizer\""));
assert.ok(intentBlock.includes("apply: () => setSelectedRespondente(respondent)"), "aplicação explícita por toque");
assert.ok(!/\n\s*setSelectedRespondente\(/.test(intentBlock), "sem auto-aplicação de respondente");

// Diagnóstico do vazio nunca 'relaxa' idade automaticamente: só foca o campo.
const emptyBlock = engine.slice(engine.indexOf('data-testid="filter-empty-diagnosis"'), engine.indexOf('data-testid="filter-empty-safety"'));
assert.ok(emptyBlock.includes('case "idade":') && emptyBlock.includes('getElementById("filter-age-years")?.focus()'), "idade: foco, não remoção");
assert.ok(!emptyBlock.includes("setExactAge("), "diagnóstico não altera idade");

// Recentes: nunca em modo efêmero (leitura e gravação).
assert.ok(engine.includes("useState<FilterRecentItem[]>(() => (flashMode ? [] : loadFilterRecents()))"), "modo efêmero não lê recentes");
assert.ok(engine.includes("{!flashMode && recents.length > 0 && ("), "modo efêmero não mostra recentes");

// Módulos puros existem e não importam React.
for (const file of ["client/src/lib/scaleSearch.ts", "client/src/lib/filterDiagnostics.ts", "client/src/lib/filterUrlState.ts", "client/src/data/scaleSearchAliases.ts", "client/src/lib/filterAutocomplete.ts", "client/src/lib/filterRecents.ts"]) {
  const src = readFileSync(file, "utf8");
  assert.ok(!/from "react"/.test(src), `${file} é puro (sem React)`);
}
// A suíte de filtro executa os testes novos.
const pkg = JSON.parse(readFileSync("package.json", "utf8"));
for (const needle of ["tests/clinical/test-filter-search-quality.mjs", "tests/unit/filter-query-intent.test.ts", "tests/unit/filter-diagnostics.test.ts", "tests/unit/filter-url-state.test.ts", "tests/unit/filter-autocomplete.test.ts", "tests/unit/filter-search-v2-static.test.mjs"]) {
  assert.ok(pkg.scripts["test:filter"].includes(needle), `test:filter deve rodar ${needle}`);
}
console.log("✓ contrato estático da busca v2 / diagnóstico / deep-link no filtro");
