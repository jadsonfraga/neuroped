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
    /postMessage|localStorage|sessionStorage|usePatient|\/api\//,
  );
  // Auth provides the scope alone; the renderer makes no clinical network writes.
  assert.match(page, /<RenderizadorSession key=\{scope\} scope=\{scope\}/);
  assert.equal([...page.matchAll(/\bfetch\(/g)].length, 2, "only static visual assets are fetched directly");
  assert.equal([...page.matchAll(/\bfetch\(import\.meta\.env\.BASE_URL \+ "renderizador\//g)].length, 2);
  const owner = read("client/src/lib/ownerPdfFacsimile.ts");
  assert.match(owner, /authFetch\("\/api\/me\/pdf-facsimile", \{ cache: "no-store", signal:/);
  assert.doesNotMatch(owner, /method: "(?:POST|PUT|PATCH)"|\bbody:/);
  assert.match(page, /BASE_URL\s*\+\s*["\']renderizador\//);
});
test("a assinatura manuscrita é o único dado guardado e só entra na versão definitiva", () => {
  const store = read("client/src/lib/renderizador/signature-store.ts");
  // O módulo toca uma única chave, só com PNG em data URL, e nada além do localStorage.
  assert.deepEqual([...store.matchAll(/localStorage\.(\w+)\(([^,)]*)/g)].map((m) => m[2]), ["SIGNATURE_PREFIX + scope", "SIGNATURE_PREFIX + scope", "SIGNATURE_PREFIX + scope"]);
  assert.match(store, /const SIGNATURE_PREFIX = "neuroped\.renderizador\.assinatura\.v2:";/);
  assert.equal([...store.matchAll(/if \(!scope\)/g)].length, 3);
  assert.match(store, /if \(!PNG_DATA_URL.test\(dataUrl\)\) return false/);
  assert.match(store, /PNG_DATA_URL = \/\^data:image\\\/png;base64,/);
  assert.doesNotMatch(store, /sessionStorage|indexedDB|fetch\(|\/api\/|postMessage/);
  // A página só repassa a assinatura ao PDF quando a versão é a liberada.
  assert.match(page, /const signatureApplied = Boolean\(released && artwork\?\.image\);/);
  assert.match(page, /\.\.\.\(signatureApplied && artwork \? \{ signature: artwork\.image \} : \{\}\)/);
  assert.match(page, /handwritten_signature_applied: signatureApplied/);
});
test("Cloudflare e Vercel permitem somente a prévia local de PDF no frame", () => {
  for (const path of ["client/public/_headers", "vercel.json"]) {
    assert.match(read(path), /frame-src 'self' blob:;/);
    assert.match(read(path), /frame-ancestors 'none'/);
  }
});

test("a versão definitiva só é liberada após PDF e hashes concluídos", () => {
  assert.match(page, /manifest\?\.release_status !== "draft_not_released"/);
  assert.match(page, /manifest\?\.release_status !== "definitive_after_medical_review"/);
  assert.doesNotMatch(page, /setApproved\(release\)/);
  const hashes = "const [markdownHash, renderedHash, pdfHash, imageHash]";
  assert.ok(page.indexOf(hashes) > -1);
  assert.ok(page.indexOf(hashes) < page.indexOf("setApproved(released);"));
  assert.match(page, /createPdfBlob\(jsPDF, prepared\.markdown,/);
  assert.match(page, /rendered_markdown_sha256: renderedHash/);
  assert.match(page, /handwritten_signature_data_url_sha256: imageHash/);
  assert.match(page, /hash\(await blob.arrayBuffer\(\)\)/);
  assert.match(page, /artwork\?\.assertSameScope\(\);\s*if \(job !== generation\.current\) return;\s*const nextManifest/);
  assert.match(page, /if \(job !== generation\.current\) return;/);
  assert.match(page, /if \(e\.target\.checked\) \{/);
  assert.match(page, /else \{\s*invalidate\(\);/);
});
