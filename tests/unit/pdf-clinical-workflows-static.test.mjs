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
// Contrato novo (multi-tenant): a logo é opcional e parametrizada por tenant
// (logoDataUri no DocSpec); o asset pessoal dr-jadson-logo não pode voltar.
assert.doesNotMatch(documentPdf, /dr-jadson-logo/);
assert.match(documentPdf, /logoDataUri\?/);
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
// Identidade agora vem da fonte única (@/lib/issuer); logo pessoal embutida saiu.
assert.match(c1, /@\/lib\/issuer/);
assert.doesNotMatch(c1, /embedJpg\(LOGO_SRC/);
assert.match(c1, /idadePaciente/);
assert.match(c1, /dosesPorDia/);
assert.match(c1, /Idade do paciente/);
assert.match(c1, /Doses por dia/);

const c1Express = read("client/src/pages/receita-c1-express.tsx");
assert.match(c1Express, /buildC1TemplatePdfBytes/);
assert.match(c1Express, /signPdfWithP12/);
assert.match(c1Express, /\.p12|\.pfx|PFX|P12/i);
assert.match(c1Express, /idadePaciente/);
assert.match(c1Express, /dosesPorDia/);
assert.match(c1Express, /Idade do paciente/);
assert.match(c1Express, /Doses por dia/);

const archiveClient = read("client/src/lib/clinicalDocumentsClient.ts");
assert.match(archiveClient, /uploadFile/);
assert.match(archiveClient, /authFetch\("\/api\/documents"/);
assert.match(archiveClient, /sha256/);
assert.doesNotMatch(archiveClient, /p12|pfx|privateKey|senha/i);

const documentRoutes = read("server/routes/documents.ts");
assert.match(documentRoutes, /retentionPolicy: "permanent"/);
assert.match(documentRoutes, /isImmutable: true/);
assert.match(documentRoutes, /PERMANENT_RETENTION/);
assert.match(documentRoutes, /sha256Match/);
assert.match(documentRoutes, /FILE_NOT_CONFIRMED/);
assert.match(documentRoutes, /PATIENT_FILE_MISMATCH/);
assert.match(documentRoutes, /getObjectSha256/);

const filesRoutes = read("server/routes/files.ts");
assert.match(filesRoutes, /clinicalDocuments/);
assert.match(filesRoutes, /CLINICAL_DOCUMENT_IMMUTABLE/);
assert.match(filesRoutes, /getObjectSha256/);

const scaleReport = read("client/src/components/ClinicalReport.tsx");
assert.match(scaleReport, /buildDocumentPdf/);
assert.match(scaleReport, /Exportar PDF Premium Completo/);
assert.match(scaleReport, /Perguntas e respostas completas/);

const scaleSave = read("client/src/components/SaveToPatient.tsx");
assert.match(scaleSave, /archiveClinicalPdf/);
assert.match(scaleSave, /sourceVersion: "premium-v1"/);

console.log("[pdf-clinical-workflows] ✓ PDFs clínicos, assinatura PFX/P12, arquivamento permanente e exportação premium das escalas permanecem conectados.");
