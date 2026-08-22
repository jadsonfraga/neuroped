// @ts-check
/**
 * test-filter-safety.mjs — Segurança clínica do motor de filtro (advancedFilterLogic).
 *
 * Executar:  tsx tests/clinical/test-filter-safety.mjs   (ou: npm run test:filter)
 *
 * Cobre os cenários A–G da especificação de reconstrução cirúrgica do filtro:
 *  A) Lactente 0–6m: sem suicídio / TDAH / psicose / autoaplicável.
 *  B) 16–30m + TEA: M-CHAT aparece; instrumentos comerciais/restritos não fingem
 *     aplicação completa.
 *  C) 7 anos + TDAH + professor: prioriza questionário de professor.
 *  D) Adolescente + suicídio: aparece COM aviso de risco.
 *  E) Efeitos colaterais + monitorização: retorna EUSM-10; pré-consulta não.
 *  F) Sem escala segura: lista vazia + mensagem segura (nunca o catálogo inteiro).
 *  G) ASQ: ASQ-3 = desenvolvimento; ASQ suicídio = suicídio; "asq" isolado ≠ suicídio.
 *
 * Falha (exit 1) em qualquer violação.
 */
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";
import { readFileSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..", "..");
const imp = (rel) => import(pathToFileURL(resolve(repoRoot, rel)).href);

const { allScales, allScalesComFichas, faixasEtarias } = await imp(
  "client/src/data/scaleFilter.ts",
);
const { mergeFilterableCatalog } = await imp(
  "client/src/data/filterableCatalog.ts",
);
const { noCostWorldScales } = await imp("client/src/data/noCostWorldScales.ts");
const { alimentacao } = await imp(
  "client/src/data/scalasComplementares230Bloco3.ts",
);
const {
  filterScalesIntelligently,
  filterScalesWithClinicalRescue,
  getBroadbandFallback,
  clinicalHardBlock,
  generateContextualRecommendation,
  getApplicationMode,
  getAssessmentUse,
  getLiteracyRequirement,
  getVerbalRequirement,
  SAFE_EMPTY_MESSAGE,
} = await imp("client/src/data/advancedFilterLogic.ts");
const { guessQueixas } = await imp("client/src/data/queixaMapping.ts");

const catalog = mergeFilterableCatalog(allScales);
const run = (ctx) =>
  filterScalesIntelligently(catalog, {
    queixas: [],
    selectedSignals: [],
    ...ctx,
  });
const runWithRescue = (ctx) =>
  filterScalesWithClinicalRescue(catalog, {
    queixas: [],
    selectedSignals: [],
    ...ctx,
  });

let failures = 0;
let checks = 0;
function ok(cond, msg) {
  checks++;
  if (!cond) {
    failures++;
    console.error(`  ❌ ${msg}`);
  }
}
function head(t) {
  console.log(`\n=== ${t} ===`);
}

// ---------- A) Lactente 0–6 meses ----------
head("A) Lactente 0–6m — bloqueios duros");
{
  const tea = run({ queixas: ["tea"], ageMonths: 3 });
  ok(
    tea.every((m) => !m.scale.queixas.includes("suicidio")),
    "0–6m+TEA não deve conter escala de suicídio",
  );
  ok(
    tea.every((m) => !m.scale.queixas.includes("psicose")),
    "0–6m+TEA não deve conter escala de psicose",
  );
  ok(
    tea.every(
      (m) =>
        getApplicationMode(m.scale) !== "autoquestionario_crianca_adolescente",
    ),
    "0–6m não deve conter instrumento autoaplicável",
  );
  ok(
    tea.every((m) => m.scale.ageMin <= 3 && m.scale.ageMax >= 3),
    "0–6m: toda escala retornada cobre a idade",
  );

  ok(
    run({ queixas: ["suicidio"], ageMonths: 3 }).length === 0,
    "0–6m + suicídio => vazio",
  );
  ok(
    run({ queixas: ["tdah"], ageMonths: 3 }).length === 0,
    "0–6m + TDAH => vazio",
  );
  ok(
    run({ queixas: ["psicose"], ageMonths: 3 }).length === 0,
    "0–6m + psicose => vazio",
  );
}

// ---------- B) 16–30 meses + TEA ----------
head("B) 16–30m + TEA — M-CHAT presente; comerciais não 'completos'");
{
  const r = run({ queixas: ["tea"], ageMonths: 23 });
  ok(r.length > 0, "16–30m+TEA deve retornar candidatos");
  ok(
    r.some((m) => m.scale.id === "mchat"),
    "M-CHAT-R/F deve aparecer (triagem TEA 16–30m)",
  );
  const commercial = r.filter((m) =>
    ["ados2", "cars", "adir", "srs2"].includes(m.scale.id),
  );
  ok(
    commercial.every((m) => m.implementationStatus === "external_only"),
    "Instrumentos comerciais/restritos (ADOS-2/CARS-2/ADI-R/SRS-2) => external_only (não 'complete')",
  );
}

// ---------- C) 7 anos + TDAH + professor ----------
head("C) 7 anos + TDAH + professor");
{
  const r = run({ queixas: ["tdah"], ageMonths: 84, respondente: "professor" });
  ok(r.length > 0, "7a+TDAH+professor deve retornar candidatos");
  ok(
    r.every((m) => m.scale.respondente.includes("professor")),
    "todo resultado deve aceitar respondente professor",
  );
  ok(
    r.every((m) => m.scale.ageMin <= 84 && m.scale.ageMax >= 84),
    "nenhuma escala de bebê (idade incompatível)",
  );
  ok(
    getApplicationMode(r[0].scale) === "questionario_professor",
    "o melhor resultado deve ser um questionário de professor",
  );

  // Se a combinação queixa/respondente não tiver instrumento específico, o
  // rescue não pode apagar silenciosamente o respondente para fabricar pódio.
  const sparseCtx = {
    queixas: ["sono"],
    ageMonths: 84,
    respondente: "professor",
  };
  ok(
    runWithRescue(sparseCtx).length === 0,
    "rescue sem escala específica de professor deve falhar fechado",
  );
  const safeFallback = getBroadbandFallback(catalog, {
    ...sparseCtx,
    selectedSignals: [],
  });
  ok(
    safeFallback.every((m) => m.scale.respondente.includes("professor")),
    "fallback nunca pode remover o respondente professor",
  );
  ok(
    safeFallback.every((m) => m.isBroadbandFallback),
    "alternativa compatível de professor permanece rotulada como fallback",
  );
}

// ---------- D) Adolescente + suicídio ----------
head("D) Adolescente (15a) + suicídio — com aviso de risco");
{
  const r = run({ queixas: ["suicidio"], ageMonths: 180 });
  ok(r.length > 0, "adolescente + suicídio deve retornar candidatos");
  ok(
    r.every((m) => m.warningFlags.some((w) => /risco suicida/i.test(w))),
    "todo instrumento de suicídio deve exibir aviso de risco",
  );

  // A idade mínima pertence ao instrumento. C-SSRS é clínico desde 72 meses;
  // o piso geral de 8 anos vale somente para modo autoquestionário.
  for (const ageMonths of [72, 84]) {
    const clinicianResults = run({
      queixas: ["suicidio"],
      ageMonths,
      respondente: "clinico",
    });
    ok(
      clinicianResults.some((m) => m.scale.id === "cssrs"),
      `C-SSRS clínico deve ser permitido aos ${ageMonths / 12} anos`,
    );
  }

  const siqJr = allScalesComFichas.find((scale) => scale.id === "siqjr");
  ok(Boolean(siqJr), "SIQ-Jr deve existir no catálogo documental");
  if (siqJr) {
    const siqCtx = {
      queixas: ["suicidio"],
      selectedSignals: [],
      respondente: "autoaplicavel",
      isLiterate: true,
    };
    ok(
      clinicalHardBlock(siqJr, { ...siqCtx, ageMonths: 84 }) ===
        "Autoaplicável requer ≥ 8 anos",
      "SIQ-Jr autoquestionário deve permanecer bloqueado abaixo de 8 anos",
    );
    ok(
      clinicalHardBlock(siqJr, { ...siqCtx, ageMonths: 96 }) === null,
      "SIQ-Jr deixa de ter bloqueio etário de modo aos 8 anos",
    );
  }
}

// ---------- E) Efeitos colaterais + monitorização ----------
head("E) Efeitos + monitorização — EUSM-10 entra; pré-consulta não");
{
  const mon = run({
    queixas: ["efeitos"],
    ageMonths: 120,
    assessmentUse: "monitorizacao",
  });
  ok(mon.length > 0, "efeitos + monitorização deve retornar candidatos");
  ok(
    mon.some((m) => /eusm|satisfa/i.test(m.scale.id + " " + m.scale.name)),
    "efeitos + monitorização deve incluir EUSM-10 / satisfação medicação",
  );

  const pre = run({ queixas: ["tdah"], ageMonths: 84 });
  ok(
    pre.every(
      (m) =>
        !m.scale.queixas.includes("efeitos") &&
        m.scale.prioridade !== "monitorizacao",
    ),
    "pré-consulta diagnóstica NÃO deve conter satisfação medicamentosa/monitorização",
  );
}

// ---------- F) Sem escala segura ----------
head("F) Sem escala segura — vazio + mensagem segura");
{
  const r = run({ queixas: ["suicidio"], ageMonths: 3 });
  ok(
    r.length === 0,
    "perfil inseguro => lista vazia (sem fallback de catálogo)",
  );
  ok(
    generateContextualRecommendation(r) === SAFE_EMPTY_MESSAGE,
    "lista vazia => mensagem segura 'sem escala segura'",
  );
}

// ---------- G) ASQ ----------
head("G) ASQ — desenvolvimento vs suicídio");
{
  const asq3 = guessQueixas(
    "Desenvolvimento",
    "ASQ-3 Ages & Stages Questionnaire 3",
  );
  ok(
    asq3.includes("atraso"),
    "ASQ-3 / Ages & Stages => desenvolvimento (atraso)",
  );
  ok(!asq3.includes("suicidio"), "ASQ-3 NÃO deve classificar como suicídio");

  const asqSuicide = guessQueixas(
    "Risco",
    "Ask Suicide-Screening Questions (ASQ)",
  );
  ok(asqSuicide.includes("suicidio"), "Ask Suicide-Screening => suicídio");

  const asqAlone = guessQueixas("", "ASQ");
  ok(
    !asqAlone.includes("suicidio"),
    "'ASQ' isolado NÃO deve virar suicídio automaticamente",
  );
}

// ---------- H) Metadados enriquecidos (verbal/alfabetização derivados) ----------
head("H) Metadados derivados — comunicação e alfabetização");
{
  const byId = (id) => catalog.find((s) => s.id === id);
  // Não-verbal compatível: testes cognitivos não-verbais
  for (const id of ["leiter3", "raven", "toni4"]) {
    const s = byId(id);
    if (s)
      ok(
        getVerbalRequirement(s) === "nao_verbal_compativel",
        `${id} => não-verbal compatível`,
      );
  }
  // Verbal: avaliação direta de linguagem expressiva/fluência
  const fas = byId("fas-fluencia");
  if (fas)
    ok(
      getVerbalRequirement(fas) === "verbal",
      "FAS (fluência verbal) => requer verbal",
    );
  // Autorrelato => requer alfabetização
  for (const id of ["cdi2", "phqa"]) {
    const s = byId(id);
    if (s)
      ok(
        getLiteracyRequirement(s) === "alfabetizado",
        `${id} (autorrelato) => requer alfabetização`,
      );
  }
  // Questionário de pais NÃO exige alfabetização da criança
  for (const id of ["mchat", "cbcl", "scared"]) {
    const s = byId(id);
    if (s)
      ok(
        getLiteracyRequirement(s) === "indiferente",
        `${id} (pais) => alfabetização indiferente`,
      );
  }
  // Pictórico/visual-analógico autorrelato NÃO exige leitura (criança aponta)
  const eva = byId("eva-ped");
  if (eva)
    ok(
      getLiteracyRequirement(eva) === "indiferente",
      "EVA pictórica => alfabetização indiferente",
    );

  // STEP é aplicado pelo clínico entre 0–60 meses; nunca pode ser bloqueado
  // por alfabetização da criança.
  const step = alimentacao.find((scale) => scale.id === "step");
  ok(Boolean(step), "STEP deve permanecer no catálogo documental");
  if (step) {
    ok(
      getLiteracyRequirement(step) === "indiferente",
      "STEP (clínico, 0–60m) => alfabetização indiferente",
    );
  }

  // assessmentUse: seguimento (reavaliação/evolução) vs override explícito
  const segScale = {
    id: "x",
    name: "Reavaliação X",
    fullName: "",
    queixas: ["evolucao"],
    prioridade: "monitorizacao",
    respondente: ["clinico"],
  };
  ok(
    getAssessmentUse(segScale) === "seguimento",
    "queixa evolução/reavaliação => seguimento",
  );
  const eusm = byId("eusm10");
  if (eusm)
    ok(
      getAssessmentUse(eusm) === "monitorizacao",
      "EUSM-10 (override explícito) => monitorização",
    );
  const denver2 = byId("denver");
  if (denver2)
    ok(getAssessmentUse(denver2) === "triagem", "Denver (triagem) => triagem");

  // Efeito no filtro: criança não-verbal não recebe instrumento que exige verbal,
  // mas recebe os não-verbais compatíveis.
  const nonVerbalCog = run({
    queixas: ["cognicao"],
    ageMonths: 96,
    isVerbal: false,
  });
  ok(
    nonVerbalCog.every((m) => getVerbalRequirement(m.scale) !== "verbal"),
    "criança não-verbal: nenhum instrumento que exige fala é recomendado",
  );

  // Efeito no filtro: criança pré-alfabetizada não recebe autorrelato que exige leitura.
  const preLit = run({
    queixas: ["depressao"],
    ageMonths: 108,
    isLiterate: false,
  });
  ok(
    preLit.every((m) => getLiteracyRequirement(m.scale) !== "alfabetizado"),
    "criança pré-alfabetizada: nenhum instrumento que exige leitura é recomendado",
  );
}

// ---------- I) Respondente "Direto" => só testes diretos interativos ----------
head('I) "Direto" (teste_direto_crianca) — só testes diretos interativos');
{
  const direto = run({ respondente: "teste_direto_crianca", ageMonths: 96 });
  ok(direto.length > 0, "'Direto' deve retornar candidatos");
  ok(
    direto.every((m) => getApplicationMode(m.scale) === "teste_direto_crianca"),
    "'Direto' só retorna instrumentos de teste direto interativo",
  );
  ok(
    direto.some((m) => m.scale.id === "academico-interativo"),
    "'Direto' inclui os testes interativos (ex.: Acadêmico Interativo)",
  );
  ok(
    direto.every((m) => getApplicationMode(m.scale) !== "questionario_pais"),
    "'Direto' NÃO traz questionário de pais",
  );
}

// ---------- J) Toda escala do filtro ABRE (rota real) ----------
head("J) Catálogo do filtro — toda escala abre uma página real");
{
  // Espelha resolveAppRoute/opensInApp de filtro.tsx: appRoute dedicado, ou
  // ficha /generic-scale/:id (id ∈ allScales), ou /escalas-neuropsiquiatria (world-*).
  const allIds = new Set(allScales.map((s) => s.id));
  const appSource = readFileSync(
    resolve(repoRoot, "client/src/App.tsx"),
    "utf8",
  );
  const appRoutes = new Set(
    [...appSource.matchAll(/<Route\s+path="([^"]+)"/g)].map((m) => m[1]),
  );
  // Rotas parametrizadas (ex.: "/generic-scale/:id", "/classificacao/:id") casam
  // qualquer appRoute concreta com o mesmo prefixo, como o wouter resolve no app.
  const paramPrefixes = [...appRoutes]
    .filter((r) => r.includes("/:"))
    .map((r) => r.slice(0, r.indexOf("/:") + 1));
  const routeIsRegistered = (route) =>
    appRoutes.has(route) || paramPrefixes.some((p) => route.startsWith(p));
  const resolveRoute = (s) =>
    s.appRoute
      ? s.appRoute
      : allIds.has(s.id)
        ? `/generic-scale/${s.id}`
        : s.id.startsWith("world-")
          ? "/escalas-neuropsiquiatria"
          : null;

  // Catálogo como o app monta (CORE + mundiais sem custo), já filtrado por "abre".
  const seen = new Set();
  const merged = [
    ...mergeFilterableCatalog(allScales),
    ...noCostWorldScales,
  ].filter((s) => (seen.has(s.id) ? false : (seen.add(s.id), true)));
  const filtered = merged.filter((s) => resolveRoute(s) !== null);

  const naoAbrem = filtered.filter((s) => resolveRoute(s) === null);
  ok(
    naoAbrem.length === 0,
    `nenhuma escala do filtro sem rota real (${naoAbrem.length} violações)`,
  );
  const appRoutesInvalidas = filtered.filter((s) => {
    const route = resolveRoute(s);
    return route && !routeIsRegistered(route);
  });
  ok(
    appRoutesInvalidas.length === 0,
    `nenhuma appRoute do filtro aponta para rota ausente (${appRoutesInvalidas.length} violações)`,
  );
  ok(filtered.length > 0, "catálogo filtrado não pode ficar vazio");

  // Simulação de 300 perfis: TODA recomendação do motor abre (nunca o loop /filtro).
  const queixaPool = [
    "tea",
    "tdah",
    "ansiedade",
    "depressao",
    "atraso",
    "linguagem",
    "sono",
    "tique",
    "comportamento",
    "cognicao",
    "aprendizagem",
    "efeitos",
    "epilepsia",
  ];
  const ageMonthsPool = [3, 9, 18, 24, 36, 48, 60, 84, 108, 132, 156, 180, 204];
  const respondentePool = [
    null,
    "pais",
    "professor",
    "clinico",
    "teste_direto_crianca",
  ];
  let seed = 1234567;
  const rng = () =>
    (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  const pick = (arr) => arr[Math.floor(rng() * arr.length)];

  let recsComEscala = 0;
  let recsQueAbrem = 0;
  const naoAbrePorRec = new Set();
  for (let i = 0; i < 300; i++) {
    const nq = 1 + Math.floor(rng() * 2);
    const qs = Array.from({ length: nq }, () => pick(queixaPool));
    const matches = filterScalesIntelligently(filtered, {
      queixas: [...new Set(qs)],
      selectedSignals: [],
      ageMonths: pick(ageMonthsPool),
      respondente: pick(respondentePool),
    });
    for (const m of matches.slice(0, 5)) {
      recsComEscala++;
      const route = resolveRoute(m.scale);
      if (route && route !== "/filtro") recsQueAbrem++;
      else naoAbrePorRec.add(m.scale.id);
    }
  }
  ok(recsComEscala > 0, "simulação 300 perfis deve gerar recomendações");
  ok(
    recsQueAbrem === recsComEscala,
    `toda recomendação abre (${recsQueAbrem}/${recsComEscala}); não abrem: ${[...naoAbrePorRec].slice(0, 10).join(", ")}`,
  );
}

// ---------- K) Invariantes do motor (anti-regressão) ----------
head("K) Invariantes do motor — limites, ordenação e determinismo");
{
  const ctx = {
    queixas: ["tdah"],
    selectedSignals: [],
    ageMonths: 84,
    respondente: "professor",
    assessmentUse: "diagnostico",
  };
  const r1 = run(ctx);
  ok(r1.length > 0, "cenário de referência deve retornar candidatos");

  // Limites: relevanceScore e confidenceLevel sempre em [0, 100].
  ok(
    r1.every((m) => m.relevanceScore >= 0 && m.relevanceScore <= 100),
    "relevanceScore de toda recomendação está em [0,100]",
  );
  ok(
    r1.every((m) => m.confidenceLevel >= 0 && m.confidenceLevel <= 100),
    "confidenceLevel de toda recomendação está em [0,100]",
  );

  // Ordenação monótona não-crescente por relevanceScore (ranking confiável).
  let monotonic = true;
  for (let i = 1; i < r1.length; i++)
    if (r1[i].relevanceScore > r1[i - 1].relevanceScore) monotonic = false;
  ok(monotonic, "resultados ordenados por relevanceScore não-crescente");

  // Determinismo: mesma entrada => mesma ordem (sort estável com desempate por nome).
  const r2 = run(ctx);
  ok(
    r1.length === r2.length &&
      r1.every((m, i) => m.scale.id === r2[i].scale.id),
    "filtragem é determinística (mesma entrada, mesma ordem)",
  );

  // Coerência de tier x score (limiares declarados no motor).
  ok(
    r1.every(
      (m) =>
        (m.tier === "gold" && m.relevanceScore >= 80) ||
        (m.tier === "silver" &&
          m.relevanceScore >= 62 &&
          m.relevanceScore < 80) ||
        (m.tier === "bronze" &&
          m.relevanceScore >= 45 &&
          m.relevanceScore < 62) ||
        (m.tier === "conditional" && m.relevanceScore < 45),
    ),
    "tier coerente com a faixa de relevanceScore",
  );
}

// ---------- L) Fallback de triagem ampla — seguro e fail-closed em risco ----------
head("L) Fallback de triagem ampla — seguro e fail-closed em risco agudo");
{
  const bandFor = (m) => {
    const f =
      faixasEtarias.find((b) => m >= b.min && m <= b.max) ??
      faixasEtarias[faixasEtarias.length - 1];
    return { min: f.min, max: f.max };
  };
  const fbCtx = (q, m) => ({
    queixas: q ? [q] : [],
    selectedSignals: [],
    ageMonths: m,
    ageBand: bandFor(m),
  });

  // 1) Toda faixa etária tem ≥1 rastreador amplo real, marcado, cobrindo a idade.
  for (const f of faixasEtarias) {
    const mid = Math.round((f.min + f.max) / 2);
    const fb = getBroadbandFallback(catalog, {
      queixas: [],
      selectedSignals: [],
      ageMonths: mid,
      ageBand: { min: f.min, max: f.max },
    });
    ok(fb.length >= 1, `faixa ${f.min}-${f.max}m: ≥1 rastreador amplo`);
    ok(
      fb.every((x) => x.isBroadbandFallback),
      `${f.min}-${f.max}m: fallback marcado isBroadbandFallback`,
    );
    ok(
      fb.every((x) => x.scale.ageMax >= f.min && x.scale.ageMin <= f.max),
      `${f.min}-${f.max}m: rastreador cobre a idade`,
    );
  }

  // 2) Contextos não agudos sem instrumento específico podem receber triagem
  // ampla apropriada à idade.
  for (const [q, m] of [
    ["substancias", 24],
    ["ansiedade", 3],
    ["toc", 18],
    ["tiques", 6],
    ["trauma", 6],
    ["enurese", 9],
  ]) {
    const fb = getBroadbandFallback(catalog, fbCtx(q, m));
    ok(fb.length >= 1, `${q} @ ${m}m: fallback oferece ≥1 rastreador amplo`);
  }

  // 3) SEGURANÇA: risco suicida/psicose sem instrumento específico seguro
  // falha fechado; não transforma desenvolvimento geral em "Ouro".
  for (const [q, m] of [
    ["suicidio", 3],
    ["psicose", 9],
  ]) {
    const ctx = fbCtx(q, m);
    ok(
      getBroadbandFallback(catalog, ctx).length === 0,
      `${q} @ ${m}m: sem fallback irrelevante`,
    );
    ok(
      runWithRescue(ctx).length === 0,
      `${q} @ ${m}m: motor falha fechado sem pódio`,
    );
  }

  // 4) Co-queixa não pode reabrir o pódio por outro domínio. Em contexto
  // agudo, todo candidato precisa cobrir explicitamente a queixa aguda.
  for (const [acute, other, m] of [
    ["suicidio", "atraso", 3],
    ["psicose", "atraso", 9],
  ]) {
    const ctx = { ...fbCtx(acute, m), queixas: [acute, other] };
    const matches = runWithRescue(ctx);
    ok(
      matches.every((match) => match.scale.queixas.includes(acute)),
      `${acute} + ${other} @ ${m}m: nenhum candidato de outro domínio`,
    );
    ok(
      matches.length === 0,
      `${acute} + ${other} @ ${m}m: falha fechado sem instrumento agudo seguro`,
    );
  }
  for (const acute of ["suicidio", "psicose"]) {
    const matches = runWithRescue({
      queixas: [acute, "atraso"],
      ageMonths: 180,
      ageBand: { min: 144, max: 216 },
    });
    ok(
      matches.length > 0,
      `${acute} + atraso @ 180m: mantém instrumentos agudos adequados à idade`,
    );
    ok(
      matches.every((match) => match.scale.queixas.includes(acute)),
      `${acute} + atraso @ 180m: todos cobrem o domínio agudo`,
    );
  }

  // 5) Quando HÁ instrumento específico, o motor não cai no fallback.
  ok(
    runWithRescue({ queixas: ["tea"], ageMonths: 23 }).length > 0 &&
      runWithRescue({ queixas: ["tea"], ageMonths: 23 }).every(
        (x) => !x.isBroadbandFallback,
      ),
    "com instrumento específico, sem fallback",
  );
}

// ---------- M) OPB não pode contornar o conjunto seguro ----------
head("M) OPB — somente resultados refinados e seguros");
{
  const filtroSource = [
    readFileSync(resolve(repoRoot, "client/src/pages/filtro.tsx"), "utf8"),
    readFileSync(resolve(repoRoot, "client/src/pages/filtro-engine.tsx"), "utf8"),
  ].join("\n");
  ok(
    /if \(!hasSafeResults \|\| selectedQueixas\.length !== 1\) return null;/.test(
      filtroSource,
    ),
    "OPB não renderiza quando o motor falha fechado",
  );
  ok(
    /const resolveScale = \(id: string\) => refinedById\.get\(id\)\?\.scale;/.test(
      filtroSource,
    ),
    "OPB resolve o trio exclusivamente em refinedById",
  );
  ok(
    !/catalogById\.get\(id\)[\s\S]{0,180}allScalesById\.get\(id\)/.test(
      filtroSource,
    ),
    "OPB não reintroduz catálogo/allScales fora do hard-block",
  );
}

// ---------- Resumo ----------
console.log(`\n${"=".repeat(48)}`);
if (failures === 0) {
  console.log(`✅ FILTER SAFETY OK — ${checks} verificações passaram.`);
  process.exit(0);
} else {
  console.error(
    `❌ FILTER SAFETY FALHOU — ${failures}/${checks} verificações falharam.`,
  );
  process.exit(1);
}
