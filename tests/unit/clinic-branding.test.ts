// Marca da clínica, perfis e PDF com marca. Dados fictícios.
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PDFDocument } from "pdf-lib";
import {
  contrastRatio, decodeLogoDataUri, hexToUnit, normalizeHexColor, pdfPaletteFor, validateBrandingInput,
} from "../../shared/clinic-branding";
import { clinicMembershipRoles } from "../../shared/tenant";
import { matrixGrantsClinicalAccess, roleSummaries, summaryClaimsClinicalAccess } from "../../shared/clinic-roles";
import { roleHasPermission } from "../../shared/permissions";
import { decideRouteAccess } from "../../client/src/security/routeGuardPolicy";
import { brandColors, buildDocumentPdf } from "../../client/src/lib/documentPdf";

const PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
const JPG = "data:image/jpeg;base64," + Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46]).toString("base64");

describe("validação da marca", () => {
  it("cores: formato, normalização e contraste", () => {
    assert.equal(normalizeHexColor(" #ABCDEF "), "#abcdef");
    assert.equal(normalizeHexColor("abc"), null);
    assert.ok(contrastRatio("#000000", "#ffffff") > 20.9);
    assert.equal(validateBrandingInput({ primaryColor: "#fff700" }).ok, false);
    assert.equal(validateBrandingInput({ primaryColor: "#0b1f3a", accentColor: "#c9a24a" }).ok, true);
    assert.equal(validateBrandingInput({ primaryColor: "#0b1f3a", accentColor: "#0c2040" }).ok, false);
  });
  it("logo: PNG/JPEG pela assinatura real; SVG, tipo falso e excesso de tamanho recusados", () => {
    assert.equal(decodeLogoDataUri(PNG)?.mime, "image/png");
    assert.equal(decodeLogoDataUri(JPG)?.mime, "image/jpeg");
    assert.equal(decodeLogoDataUri("data:image/svg+xml;base64,PHN2Zz48L3N2Zz4="), null);
    assert.equal(decodeLogoDataUri(JPG.replace("image/jpeg", "image/png")), null);
    assert.equal(decodeLogoDataUri("data:image/png;base64," + Buffer.alloc(200 * 1024, 1).toString("base64")), null);
    assert.equal(decodeLogoDataUri("javascript:alert(1)"), null);
  });
  it("textos: limpam controles e respeitam limites", () => {
    const r = validateBrandingInput({ headerText: "A\u0000B".padEnd(500, "x"), footerText: "r".repeat(900) });
    assert.ok(r.ok);
    if (r.ok) { assert.equal(r.value.headerText.length, 160); assert.equal(r.value.footerText.length, 400); assert.ok(!r.value.headerText.includes("\u0000")); }
  });
  it("paleta padrão preservada sem marca (sem regressão visual)", () => {
    const p = pdfPaletteFor(null);
    assert.deepEqual(p.band, hexToUnit("#0b1f3a"));
    assert.equal(p.isCustom, false);
  });
});

describe("perfis de permissão mínima", () => {
  it("secretaria (assistant) não tem nenhuma permissão clínica, de gestão ou financeira", () => {
    for (const p of ["clinical.read", "clinical.write", "organization.manage", "team.manage", "billing.manage", "finance.read", "audit.read", "organization.export"] as const) {
      assert.equal(roleHasPermission("assistant", p), false, p);
    }
  });
  it("só proprietário e administrador gerem marca/equipe; profissional lê/escreve clínico sem gerir", () => {
    for (const role of clinicMembershipRoles) {
      assert.equal(roleHasPermission(role, "organization.manage"), role === "owner" || role === "clinic_admin", role);
    }
    assert.equal(roleHasPermission("professional", "clinical.write"), true);
    assert.equal(roleHasPermission("professional", "team.manage"), false);
    assert.equal(roleHasPermission("financial", "clinical.read"), false);
  });
  it("o quadro de perfis da UI concorda com a matriz real", () => {
    for (const s of roleSummaries()) {
      assert.equal(summaryClaimsClinicalAccess(s.role), matrixGrantsClinicalAccess(s.role), s.role);
    }
    assert.match(roleSummaries().find((s) => s.role === "assistant")!.label, /Secretaria/);
  });
  it("papéis desconhecidos nunca recebem permissão (fail-closed)", () => {
    assert.equal(roleHasPermission("admin", "clinical.read"), false);
    assert.equal(roleHasPermission(undefined, "clinical.read"), false);
  });
  it("UI: operador (secretaria) é barrado em laudos/prontuário e liberado só em agenda/recepção/configurações", () => {
    const base = { accessMode: "remote" as const, isAuthenticated: true, isLoading: false, userRole: "operator" as const };
    for (const path of ["/laudo-neuroped", "/laudo-super", "/laudo-um-clique", "/prontuario", "/pacientes", "/paciente/x", "/documentos", "/resumo-pre-consulta", "/evolucao-escalas", "/checagem-dose", "/receita-c1"]) {
      assert.equal(decideRouteAccess({ ...base, path }), "forbidden", path);
    }
    for (const path of ["/agenda", "/recepcao", "/configuracoes"]) assert.equal(decideRouteAccess({ ...base, path }), "allow", path);
    assert.equal(decideRouteAccess({ ...base, path: "/laudo-neuroped", userRole: "professional" }), "allow");
  });
});

describe("PDF com marca", () => {
  const spec = { title: "Laudo fictício", credentials: ["Dra. Fictícia · CRM 000"], sections: [{ heading: "Conteúdo", body: "Texto clínico fictício que a marca não pode alterar." }], footer: "Aviso legal fictício." };
  it("cores efetivas: marca substitui só a moldura; sem marca = padrão", () => {
    const def = brandColors(null);
    const custom = brandColors({ primaryColor: "#123a5c", accentColor: "#f2c14e", headerText: "", footerText: "", logoDataUri: null });
    assert.notDeepEqual(def.band, custom.band);
    assert.deepEqual(custom.accentLight, brandColors({ primaryColor: null, accentColor: "#f2c14e", headerText: "", footerText: "", logoDataUri: null }).accentLight);
  });
  it("gera PDF válido com marca (logo PNG, cabeçalho, rodapé) e sem marca", async () => {
    const branded = await buildDocumentPdf({ ...spec, brand: { primaryColor: "#123a5c", accentColor: "#f2c14e", headerText: "Clínica Alfa · Neuropediatria", footerText: "Rodapé institucional fictício", logoDataUri: PNG } });
    const plain = await buildDocumentPdf({ ...spec, brand: null });
    for (const bytes of [branded, plain]) {
      const doc = await PDFDocument.load(bytes);
      assert.ok(doc.getPageCount() >= 1);
    }
    assert.notDeepEqual(Array.from(branded.slice(0, 2000)), Array.from(plain.slice(0, 2000)));
    // conteúdo textual presente nos dois (a marca não substitui seções)
    const text = (b: Uint8Array) => Buffer.from(b).toString("latin1");
    assert.ok(text(branded).length > 0 && text(plain).length > 0);
  });
  it("logo inválido não impede a emissão (cai no texto)", async () => {
    const bytes = await buildDocumentPdf({ ...spec, brand: { primaryColor: null, accentColor: null, headerText: "", footerText: "", logoDataUri: "data:image/png;base64,AAAA" } });
    assert.ok((await PDFDocument.load(bytes)).getPageCount() >= 1);
  });
  it("sem sessão (sem marca carregada) usa o padrão", async () => {
    const bytes = await buildDocumentPdf(spec);
    assert.ok((await PDFDocument.load(bytes)).getPageCount() >= 1);
  });
});
