import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
const read = (path) => readFileSync(path, "utf8");
const app = read("client/src/App.tsx");
const nav = read("client/src/data/navigation.ts");
const page = read("client/src/pages/renderizador.tsx");
test("Renderizador integra menu e roteador sem redirecionar a outro site", () => {
  assert.match(
    app,
    /const RenderizadorPage = lazy\(\(\) => import\("@\/pages\/renderizador"\)\)/,
  );
  assert.match(
    app,
    /<Route path="\/renderizador" component=\{RenderizadorPage\} \/>/,
  );
  assert.equal([...nav.matchAll(/href: "\/renderizador"/g)].length, 2);
  assert.match(read("client/src/security/knownRoutes.ts"), /"\/renderizador"/);
  assert.doesNotMatch(page, /chatgpt\.site|target="_blank"|window\.open/);
});
test("renderização é local, com revisão e sem acesso ao prontuário", () => {
  assert.match(page, /import\(["\']pdfmake\/build\/pdfmake["\']\)/);
  assert.match(page, /\.getBlob\(resolve\)/);
  assert.match(page, /disabled=\{!approved\}/);
  assert.match(page, /crypto\.subtle\.digest\(["\']SHA-256["\']/);
  assert.doesNotMatch(
    page,
    /postMessage|localStorage|sessionStorage|usePatient|useAuth|\/api\//,
  );
  assert.match(page, /BASE_URL\s*\+\s*["\']renderizador\//);
});
test("Cloudflare e Vercel permitem somente a prévia local de PDF no frame", () => {
  for (const path of ["client/public/_headers", "vercel.json"]) {
    assert.match(read(path), /frame-src 'self' blob:;/);
    assert.match(read(path), /frame-ancestors 'none'/);
  }
});
