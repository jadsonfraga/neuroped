import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

const signer = read("client/src/lib/icpSign.ts");
assert.match(signer, /signPdfWithP12/);
assert.match(signer, /assertSignedPdfIntegrity/);
assert.match(signer, /\/ByteRange/);
assert.match(signer, /ETSI\\\.CAdES\\\.detached|ETSI\.CAdES\.detached/);

const documentPdf = read("client/src/lib/documentPdf.ts");
assert.match(documentPdf, /PDFDocument\.create\(\)/);
assert.match(documentPdf, /drJadsonLogoFile/);
assert.match(documentPdf, /embedBrandLogo/);
assert.match(documentPdf, /VALIDACAO E ASSINATURA DIGITAL/);

const laudo = read("client/src/pages/laudo-neuroped.tsx");
assert.match(laudo, /buildDocumentPdf/);
assert.match(laudo, /signPdfWithP12|AssinaturaIcpPanel/);
assert.match(laudo, /\.p12|\.pfx|PFX|P12/i);

const c1 = read("client/src/pages/receita-c1.tsx");
assert.match(c1, /PDFDocument\.create\(\)/);
assert.match(c1, /buildReceitaC1SignedPdfBytes/);
assert.match(c1, /AssinaturaIcpPanel/);
assert.match(c1, /embedJpg\(LOGO_SRC/);

const c1Express = read("client/src/pages/receita-c1-express.tsx");
assert.match(c1Express, /buildC1TemplatePdfBytes/);
assert.match(c1Express, /signPdfWithP12/);
assert.match(c1Express, /\.p12|\.pfx|PFX|P12/i);

console.log("[pdf-clinical-workflows] ✓ C1, C1 Express e laudo mantêm PDF real + caminho PFX/P12; documentos clínicos usam logo no construtor premium.");
