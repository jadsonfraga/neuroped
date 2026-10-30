import assert from "node:assert/strict";

import {
  getDailyFeaturedChapter,
  neuropedLibraryChapters,
} from "../../client/src/data/neuropedLibrary.ts";
import { navigablePages } from "../../client/src/data/navigation.ts";
import { isKnownRoute } from "../../client/src/security/knownRoutes.ts";
import {
  isReaderClinicalRoute,
  isVisitorRoute,
} from "../../client/src/security/routeGuardPolicy.ts";

const chapter = getDailyFeaturedChapter(new Date("2026-10-28T12:00:00-03:00"));

assert.equal(neuropedLibraryChapters.length, 1);
assert.equal(chapter.slug, "interpretacao-wisc-iv-neuropediatria");
assert.deepEqual(
  chapter.indices.map((index) => index.abbreviation),
  ["ICV", "IOP", "IMO", "IVP"],
  "o capítulo precisa ensinar os quatro índices brasileiros do WISC-IV",
);
assert.ok(
  chapter.diagnosticLenses.some((lens) => lens.id === "tdah"),
  "o raciocínio diferencial precisa incluir TDAH sem criar perfil diagnóstico",
);
assert.ok(
  chapter.diagnosticLenses.some((lens) => lens.id === "epilepsia"),
  "o capítulo precisa contemplar neurologia infantil além do neurodesenvolvimento",
);
assert.ok(
  chapter.references.length >= 6 &&
    chapter.references.every(
      (reference) =>
        reference.verifiedAt === "2026-10-28" &&
        reference.url.startsWith("https://"),
    ),
  "toda afirmação clínica central precisa apontar para fonte verificada",
);
assert.equal(chapter.evidence.consensus.status, "blocked_usage_counter");
assert.match(chapter.safety.disclaimer, /não estabelece diagnóstico/i);
assert.match(chapter.safety.copyright, /não reproduz itens/i);

assert.ok(isKnownRoute("/biblioteca"));
assert.ok(isReaderClinicalRoute("/biblioteca"));
assert.ok(isVisitorRoute("/biblioteca"));
assert.ok(
  navigablePages.some(
    (item) => item.href === "/biblioteca" && item.label === "Biblioteca",
  ),
  "a Biblioteca precisa estar visível na navegação do app",
);

console.log("✓ biblioteca NeuroPed: capítulo, evidência e rota auditáveis");
