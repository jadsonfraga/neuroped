import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const app = read("client/src/App.tsx");
const page = read("client/src/pages/missao-saude.tsx");
const styles = read("client/src/styles/missao-saude.css");
const publicRoutes = read("client/src/lib/publicRoutes.ts");
const integrations = read("client/src/pages/manus-integracoes.tsx");
const integrationManifest = read("client/src/data/integrations.ts");

assert.match(app, /if \(location === "\/missao-saude"\)[\s\S]*?<Route path="\/missao-saude" component=\{MissaoSaudePage\} \/>[\s\S]*?<\/Switch>/, "Missão Saúde deve ser uma rota pública direta fora do shell clínico");
assert.doesNotMatch(app, /<Layout>[\s\S]*?<Route path="\/missao-saude" component=\{MissaoSaudePage\}/, "Missão Saúde não pode herdar o landmark main do shell clínico");
assert.match(publicRoutes, /"\/missao-saude"/, "Missão Saúde deve constar na allowlist exata de rotas públicas");
assert.match(page, /aria-live="polite"/, "interações devem anunciar mudanças de estado sem depender de cor ou animação");
assert.match(styles, /prefers-reduced-motion/, "a experiência deve respeitar preferência de redução de movimento");
assert.doesNotMatch(page, /localStorage|sessionStorage|fetch\(/, "Missão Saúde não pode persistir dados nem consultar serviços externos");
assert.match(page, /movimento-brincar\.jpg/, "cartaz autorizado de movimento deve ser local");
assert.match(page, /linguagem-comunicacao\.jpg/, "cartaz autorizado de linguagem deve ser local");
assert.match(page, /rotina-sono\.jpg/, "cartaz autorizado de rotina deve ser local");
assert.match(
  integrationManifest,
  /id: "missao"[\s\S]{0,260}href: "\/#\/missao-saude"/,
  "o manifesto de integrações deve apontar para a página interna",
);
assert.doesNotMatch(integrations, /drjadsongame-ko8qudqs\.manus\.space/, "dependência externa legada da Missão Saúde não pode permanecer");

console.log("✓ contrato estático da rota Missão Saúde aprovado");
