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
  assert.match(page, /import\(["\']jspdf["\']\)/);
  assert.match(page, /createPdfBlob\(jsPDF/);
  assert.match(page, /disabled=\{!approved(?:\s*\|\|\s*busy)?\}/);
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

test("a versão definitiva só é liberada após PDF e hashes concluídos", () => {
  assert.match(page, /manifest\\?\\.release_status !== "draft_not_released"/);
  assert.match(page, /manifest\\?\\.release_status !== "definitive_after_medical_review"/);
  assert.doesNotMatch(page, /setApproved\\(release\\)/);
  assert.ok(page.indexOf("const [markdownHash, pdfHash]") > -1);
  assert.ok(page.indexOf("const [markdownHash, pdfHash]") < page.indexOf("setApproved(released);"));
  assert.match(page, /if \\(job !== generation\\.current\\) return;/);
  assert.match(page, /if \\(e\\.target\\.checked\\) \\{/);
  assert.match(page, /else \\{\\s*invalidate\\(\\);/);
});
