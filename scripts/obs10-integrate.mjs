// Temporary integration helper for issue #893. Never runs on main.
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
const branch = execFileSync("git", ["branch", "--show-current"], { encoding: "utf8" }).trim();
if (branch !== "feat/obs10-preconsulta-faixa-etaria") throw new Error("Integration helper is restricted to the OBS-10 feature branch");
function insert(path, anchor, replacement, marker) {
  const source = readFileSync(path, "utf8");
  if (source.includes(marker)) return;
  if (source.split(anchor).length !== 2) throw new Error(`Expected one integration anchor: ${path}`);
  writeFileSync(path, source.replace(anchor, replacement));
}
insert("client/src/App.tsx", 'const PreConsultaPage = lazy(() => import("@/pages/pre-consulta"));', 'const PreConsultaPage = lazy(() => import("@/pages/pre-consulta"));\nconst PreConsultaObs10Page = lazy(() => import("@/pages/pre-consulta-obs10"));', "const PreConsultaObs10Page");
insert("client/src/App.tsx", '            <Route path="/pre-consulta" component={PreConsultaPage} />', '            <Route path="/avaliacao-pre-consulta-faixa-etaria" component={PreConsultaObs10Page} />\n            <Route path="/pre-consulta" component={PreConsultaPage} />', 'path="/avaliacao-pre-consulta-faixa-etaria"');
insert("client/src/data/navigation.ts", 'export const featuredNavigation: NavItem[] = [', 'const obs10Navigation: NavItem = {\n  href: "/avaliacao-pre-consulta-faixa-etaria",\n  label: "Avaliação de Pré-Consulta por Fachetária",\n  icon: Baby,\n  tone: "priority",\n  description: "OBS-10 · 13 faixas · guia da assistente",\n};\n\nexport const featuredNavigation: NavItem[] = [', "const obs10Navigation");
insert("client/src/data/navigation.ts", '    description: "Avaliação direta pré-consulta · 10 min",\n  },', '    description: "Avaliação direta pré-consulta · 10 min",\n  },\n  obs10Navigation,', '  obs10Navigation,');
insert("client/src/data/navigation.ts", 'export const navSections: NavSection[] = [', 'export const navSections: NavSection[] = [\n  { title: "PRÉ-CONSULTA GUIADA", items: [obs10Navigation] },', 'title: "PRÉ-CONSULTA GUIADA"');
insert("client/src/security/routeGuardPolicy.ts", 'export const SENSITIVE_ROUTES = [', 'export const SENSITIVE_ROUTES = [\n  "/avaliacao-pre-consulta-faixa-etaria",', '  "/avaliacao-pre-consulta-faixa-etaria",');
insert("client/src/security/routeGuardPolicy.ts", '  { route: "/testes-diretos", roles: DIRECT_TEST_ROLES },', '  { route: "/testes-diretos", roles: DIRECT_TEST_ROLES },\n  { route: "/avaliacao-pre-consulta-faixa-etaria", roles: DIRECT_TEST_ROLES },', 'route: "/avaliacao-pre-consulta-faixa-etaria"');
insert("client/src/features/obs10/protocol.ts", '  return Math.max(0, PHASES.findIndex((p) => seconds < p.end));', '  if (seconds >= MAX_SECONDS) return PHASES.length - 1;\n  return Math.max(0, PHASES.findIndex((p) => seconds < p.end));', 'if (seconds >= MAX_SECONDS)');
insert("client/src/pages/pre-consulta-obs10.tsx", '    starting.current = true;', '    starting.current = true;\n    if (!cameraEnabled) media.reset();', 'if (!cameraEnabled) media.reset();');
insert("client/src/pages/pre-consulta-obs10.tsx", '  function emergencyStop() {\n    media.cancel();', '  function emergencyStop() {\n    if (running) media.stop(); else media.cancel();', 'if (running) media.stop(); else media.cancel();');
// Integration tests compare the actual interval rendered/exported, not an assumed
// interval that would ignore the time spent editing or capturing screenshots.
insert("tests/e2e/obs10.mjs", '  await button("Marcar registro inicial agora").click();', '  await button("Marcar registro inicial agora").click();\n  const encodingText = await page.getByRole("button", { name: /^Registro marcado em/ }).textContent();', 'const encodingText');
insert("tests/e2e/obs10.mjs", '  await button("Marcar evocação agora").click();', '  await button("Marcar evocação agora").click();\n  const recallText = await page.getByRole("button", { name: /^Evocação marcada em/ }).textContent();\n  const secondsFromText = (value) => { const match = value.match(/(\\d{2}):(\\d{2})/); return Number(match[1]) * 60 + Number(match[2]); };\n  const actualInterval = secondsFromText(recallText) - secondsFromText(encodingText);', 'const actualInterval');
const e2ePath = "tests/e2e/obs10.mjs";
writeFileSync(e2ePath, readFileSync(e2ePath, "utf8").replace('assert.match(await page.locator(".obs10-summary pre").textContent(), /390 segundos/);', 'assert.ok((await page.locator(".obs10-summary pre").textContent()).includes(`${actualInterval} segundos`));'));
console.log("OBS-10 integration anchors applied; existing Sonda, authentication, backend and secrets untouched.");
