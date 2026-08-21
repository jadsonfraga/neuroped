import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const root = new URL("../..", import.meta.url);

async function source(path) {
  return readFile(new URL(path, root), "utf8");
}

test("a jornada de marcação fica pública, navegável e é atendida pela Secretaria IA interna", async () => {
  const [app, navigation, publicRoutes, page] = await Promise.all([
    source("client/src/App.tsx"),
    source("client/src/data/navigation.ts"),
    source("client/src/lib/publicRoutes.ts"),
    source("client/src/pages/marcacao.tsx"),
  ]);

  assert.match(app, /import\("@\/pages\/marcacao"\)/);
  assert.match(app, /path="\/marcacao" component=\{MarcacaoPage\}/);
  assert.match(app, /if \(location === "\/marcacao"\) \{[\s\S]*?<MarcacaoPage \/>[\s\S]*?\n  \}/);
  assert.match(navigation, /href: "\/marcacao", label: "Marcação · Secretaria IA"/);
  assert.match(publicRoutes, /"\/marcacao"/);
  assert.match(page, /fetch\("\/api\/public-booking\?action=providers"/);
  assert.match(page, /href=\{`#\/agendar\?provider=\$\{encodeURIComponent\(provider\.slug\)\}`\}/);
  assert.doesNotMatch(page, /SECRETARIA_IA_URL|manus\.space/);
});
