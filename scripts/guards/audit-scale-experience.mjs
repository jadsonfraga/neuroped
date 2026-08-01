// Auditoria profunda da experiência de escalas.
//
// Fecha contratos que não cabem numa inspeção visual superficial:
// - recomendadores por cuidadores devem derivar metadados do catálogo canônico;
// - nenhuma queixa órfã ou instrumento de outro informante pode entrar no bloco;
// - páginas genéricas não podem conservar UI de PIN, senha ou escore inventado;
// - fichas e aplicações devem compartilhar apresentação etária e linguagem visual;
// - a navegação para pendências deve permanecer acessível e verificável.
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const read = (path) => readFileSync(resolve(root, path), "utf8");
const imp = (path) => import(pathToFileURL(resolve(root, path)).href);

const { allScales, queixas } = await imp("client/src/data/scaleFilter.ts");
const {
  testesPaisRecommendations,
  parentAssessmentPaths,
} = await imp("client/src/data/testesPaisRecommendations.ts");

const violations = [];
const check = (condition, message) => {
  if (!condition) violations.push(message);
};

const canonicalComplaintIds = new Set(queixas.map((complaint) => complaint.id));
const scaleById = new Map(allScales.map((scale) => [scale.id, scale]));
const recommendationById = new Map(
  testesPaisRecommendations.map((recommendation) => [
    recommendation.id,
    recommendation,
  ]),
);
const expectedParentScaleIds = [
  "snap",
  "vanderbilt",
  "conners",
  "asq3",
  "cbcl",
  "brief2",
  "mchat",
  "abc",
  "scared",
  "sdq",
  "cshq",
].sort();

check(
  new Set(testesPaisRecommendations.map((item) => item.id)).size ===
    testesPaisRecommendations.length,
  "recomendações por cuidadores possuem ids duplicados",
);
check(
  JSON.stringify(
    testesPaisRecommendations.map((item) => item.scaleId).sort(),
  ) === JSON.stringify(expectedParentScaleIds),
  `conjunto canônico de escalas por cuidadores divergiu: ${testesPaisRecommendations
    .map((item) => item.scaleId)
    .sort()
    .join(", ")}`,
);

for (const recommendation of testesPaisRecommendations) {
  const canonical = scaleById.get(recommendation.scaleId);
  check(Boolean(canonical), `${recommendation.id}: escala canônica ausente`);
  if (!canonical) continue;

  for (const complaint of recommendation.queixas) {
    check(
      canonicalComplaintIds.has(complaint),
      `${recommendation.id}: queixa não canônica ${complaint}`,
    );
  }
  check(
    recommendation.queixas.length > 0,
    `${recommendation.id}: nenhuma queixa curada`,
  );
  check(
    canonical.respondente.includes("pais"),
    `${recommendation.id}/${canonical.id}: apresentado como cuidador, mas catálogo responde por ${canonical.respondente.join(", ")}`,
  );
  check(
    !canonical.queixas.includes("suicidio") &&
      !canonical.queixas.includes("psicose"),
    `${recommendation.id}: instrumento sentinela não pode entrar como questionário parental auxiliar`,
  );
  check(
    recommendation.name === canonical.name,
    `${recommendation.id}: nome diverge do catálogo (${recommendation.name} != ${canonical.name})`,
  );
  check(
    recommendation.ageMin === canonical.ageMin &&
      recommendation.ageMax === canonical.ageMax,
    `${recommendation.id}: idade diverge do catálogo`,
  );
  check(
    recommendation.tempo === canonical.tempo,
    `${recommendation.id}: tempo diverge do catálogo`,
  );
  check(
    recommendation.route ===
      (canonical.appRoute || `/generic-scale/${canonical.id}`),
    `${recommendation.id}: rota diverge do catálogo`,
  );
  check(
    recommendation.canonicalScale === canonical,
    `${recommendation.id}: referência canônica não preservada`,
  );
  check(
    recommendation.queixas.some((complaint) =>
      canonical.queixas.includes(complaint),
    ),
    `${recommendation.id}: curadoria não compartilha nenhum domínio com ${canonical.id}`,
  );
  check(
    recommendation.razao.length >= 60,
    `${recommendation.id}: justificativa clínica insuficiente`,
  );
  check(
    !/(?:confirma|confirmar|confirmação)\s+(?:o\s+)?diagn[oó]stico|diagn[oó]stico\s+(?:confirmado|fechado)|obrigat[oó]rio\b/i.test(
      recommendation.razao,
    ),
    `${recommendation.id}: linguagem excessivamente conclusiva`,
  );
}

for (const path of parentAssessmentPaths) {
  check(
    canonicalComplaintIds.has(path.queixa),
    `caminho parental usa queixa não canônica: ${path.queixa}`,
  );
  check(
    new Set(path.primaryTests).size === path.primaryTests.length,
    `caminho ${path.queixa}: recomendações repetidas`,
  );
  for (const recommendationId of path.primaryTests) {
    const recommendation = recommendationById.get(recommendationId);
    check(
      Boolean(recommendation),
      `caminho ${path.queixa}: recomendação ausente ${recommendationId}`,
    );
    if (recommendation) {
      check(
        recommendation.queixas.includes(path.queixa),
        `caminho ${path.queixa}: ${recommendationId} não é alcançável pela própria queixa`,
      );
    }
  }
}

const genericPage = read("client/src/pages/generic-scale.tsx");
const fichaPage = read("client/src/components/ScaleFichaPage.tsx");
const runnerPage = read("client/src/components/InteractiveScaleRunner.tsx");
const parentCards = read("client/src/components/ParentTestsRecommender.tsx");
const sharedCard = read(
  "client/src/components/FilterRecommendationLinkCard.tsx",
);
const presentation = read("client/src/lib/scalePresentation.ts");
const advancedFilter = read("client/src/data/advancedFilterLogic.ts");
const openAccessGuard = read("scripts/guards/assert-open-access.mjs");

check(
  genericPage.includes("PageHero") &&
    genericPage.includes("data-testid=\"scale-implementation-status\"") &&
    genericPage.includes("data-testid=\"clinical-observation-workspace\""),
  "página genérica perdeu hero, status honesto ou workspace observacional",
);
check(
  !/PIN master|verifyMasterPin|getMasterPinLockSeconds|isMasterPinUnlocked|type=["']password["']/i.test(
    genericPage,
  ),
  "página genérica reintroduziu UI de PIN/senha",
);
check(
  !/PIN master/i.test(advancedFilter) &&
    advancedFilter.includes("registro observacional complementar"),
  "motor compartilhado reintroduziu cópia de PIN ou perdeu a descrição aberta do registro complementar",
);
check(
  !genericPage.includes("bg-slate-950 min-h-screen") &&
    genericPage.includes("bg-card") &&
    genericPage.includes("text-foreground"),
  "página genérica voltou ao tema rígido fora dos tokens do design system",
);
check(
  genericPage.includes("não reproduz itens oficiais") &&
    genericPage.includes("não calcula escore") &&
    genericPage.includes("Roteiro autoral"),
  "workspace observacional deixou de distinguir conteúdo autoral de instrumento oficial",
);
check(
  genericPage.includes("formatScaleAgeRange") &&
    !genericPage.includes("Math.round(scale.ageMax / 12)"),
  "página genérica voltou a arredondar idade para a faixa seguinte",
);
check(
  fichaPage.includes("@/lib/scalePresentation") &&
    genericPage.includes("@/lib/scalePresentation"),
  "ficha e página genérica deixaram de compartilhar apresentação canônica",
);
check(
  presentation.includes("47.99") &&
    presentation.includes("Math.floor") &&
    presentation.includes("diagnostica"),
  "helper de apresentação perdeu precisão decimal ou rótulo diagnóstico",
);
check(
  runnerPage.includes("PageHero") &&
    runnerPage.includes("firstMissingIndex") &&
    runnerPage.includes("aria-invalid={pending}") &&
    runnerPage.includes("button-next-missing"),
  "runner interativo perdeu padrão visual ou navegação para pendência",
);
check(
  runnerPage.includes("useSecureScaleDraft") &&
    runnerPage.includes("ClinicalReport") &&
    runnerPage.includes("SaveToPatient"),
  "runner interativo perdeu rascunho protegido ou entrega integral",
);
check(
  parentCards.includes("Questionários coerentes com idade e informante") &&
    parentCards.includes("canonicalScale") &&
    parentCards.includes("scaleLicenseLabel"),
  "cards de cuidadores perderam transparência de informante/licença",
);
check(
  sharedCard.includes("footer?: string") &&
    sharedCard.includes("focus-visible:ring-2") &&
    (sharedCard.match(/<Link\b/g) || []).length === 1 &&
    !/<Button\b|<a\b/.test(sharedCard),
  "card canônico perdeu rodapé, foco ou superfície clicável única",
);
check(
  openAccessGuard.includes(
    "escala genérica não contém prompt, senha ou PIN de acesso",
  ) &&
    !openAccessGuard.includes(
      '"client/src/pages/generic-scale.tsx",\n].sort()',
    ),
  "guard de acesso não foi endurecido para a página genérica",
);

if (violations.length > 0) {
  console.error(
    `\n[scale-experience] ✗ ${violations.length} inconsistência(s) detectada(s):`,
  );
  for (const violation of violations) console.error(`  · ${violation}`);
  process.exit(1);
}

console.log(
  `[scale-experience] escalas-parentais=${testesPaisRecommendations.length} · caminhos=${parentAssessmentPaths.length}`,
);
console.log(
  "[scale-experience] ✓ catálogo canônico, informantes, idade, licença, PIN, Lovable UI e pendências convergiram.",
);
