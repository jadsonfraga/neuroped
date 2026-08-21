import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const root = new URL("../..", import.meta.url);

async function source(path) {
  return readFile(new URL(path, root), "utf8");
}

test("a jornada de marcação fica pública, navegável e aponta para a Secretaria IA", async () => {
  const [app, navigation, publicRoutes, page, links] = await Promise.all([
    source("client/src/App.tsx"),
    source("client/src/data/navigation.ts"),
    source("client/src/lib/publicRoutes.ts"),
    source("client/src/pages/marcacao.tsx"),
    source("client/src/lib/manusLinks.ts"),
  ]);

  assert.match(app, /import\("@\/pages\/marcacao"\)/);
  assert.match(app, /path="\/marcacao" component=\{MarcacaoPage\}/);
  assert.match(navigation, /href: "\/marcacao", label: "Marcação · Secretaria IA"/);
  assert.match(publicRoutes, /"\/marcacao"/);
  assert.match(page, /href=\{SECRETARIA_IA_URL\}/);
  assert.match(page, /data-testid="link-secretaria-ia-direto"/);
  assert.match(links, /https:\/\/secretariaia-7jubr6nq\.manus\.space/);
});
