import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const root = new URL("../..", import.meta.url);

async function source(path) {
  return readFile(new URL(path, root), "utf8");
}

test("a jornada de marcação fica protegida, navegável e é atendida pela Secretaria IA interna", async () => {
  const [app, navigation, publicRoutes, page] = await Promise.all([
    source("client/src/App.tsx"),
    source("client/src/data/navigation.ts"),
    source("client/src/lib/publicRoutes.ts"),
    source("client/src/pages/marcacao.tsx"),
  ]);

  assert.match(app, /import\("@\/pages\/marcacao"\)/);
  assert.match(app, /path="\/marcacao"/);
  assert.match(
    app,
    /path="\/marcacao"[\s\S]*?<RouteGuard roles=\{\["admin", "professional", "operator"\]\}>[\s\S]*?<MarcacaoPage \/>/,
  );
  assert.doesNotMatch(
    app,
    /location\s*===\s*["']\/marcacao["']/,
    "Marcação não pode contornar o RouteGuard por retorno antecipado",
  );
  assert.match(
    app,
    /path="\/agendar"[\s\S]*?<RouteGuard roles=\{\["admin", "professional", "operator"\]\}>[\s\S]*?<AgendarPage \/>/,
  );
  assert.match(
    navigation,
    /href: "\/marcacao",\s*label: "Marcação · Secretaria IA"/,
  );
  assert.doesNotMatch(publicRoutes, /"\/marcacao"/);
  assert.doesNotMatch(publicRoutes, /"\/agendar"/);
  assert.match(page, /<main className=/);
  assert.match(
    page,
    /apiRequest\("GET", "\/api\/public-booking\?action=providers"\)/,
  );
  assert.match(
    page,
    /href=\{`#\/agendar\?provider=\$\{encodeURIComponent\(provider\.slug\)\}`\}/,
  );
  assert.doesNotMatch(page, /SECRETARIA_IA_URL|manus\.space/);
});
