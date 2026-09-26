// Camada de aventura (herói, mensagens neutras, estrelas) aplicada ao
// Reconhecimento Visual e aba direta nos Testes Cognitivos por Faixa Etária.
// Mesma disciplina já testada para a Sonda Dez em
// sonda-dez-aventura-static.test.mjs: participação, nunca desempenho; nunca
// vaza para o registro clínico; a tela virada para a criança permanece pura
// onde esse é o desenho já estabelecido (Reconhecimento Visual/TrialStage).
import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs
  .readFileSync(path, "utf8")
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/(^|[^:])\/\/.*$/gm, "$1");

const workspace = read("client/src/features/visual-recognition/Workspace.tsx");
const trialStage = read("client/src/features/visual-recognition/TrialStage.tsx");
const model = read("client/src/features/visual-recognition/model.ts");
const cognitivePage = read("client/src/pages/testes-cognitivos-faixa-etaria.tsx");
const obs10Page = read("client/src/pages/pre-consulta-obs10.tsx");
const obs10Session = read("client/src/features/obs10/session.ts");
const obs10Dossier = read("client/src/features/obs10/dossier.ts");

test("Reconhecimento Visual: estrelas vêm de oportunidades registradas, nunca da situação observada", () => {
  assert.match(workspace, /import \{ DEFAULT_HERO, HeroGrid, NEUTRAL_CHEERS, StarCounter, type Hero \} from "@\/components\/aventura";/);
  assert.match(workspace, /<StarCounter stars=\{active\.length\}/);
  assert.doesNotMatch(workspace, /stars=\{[^}]*(outcome|draft\.outcome|OUTCOMES)[^}]*\}/);
  assert.match(workspace, /setMessage\(NEUTRAL_CHEERS\[ledger\.length%NEUTRAL_CHEERS\.length\]\)/, "mensagem gira por posição, nunca pela situação observada");
});

test("Reconhecimento Visual: a tela virada para a criança (TrialStage) continua pura, sem herói/estrela", () => {
  assert.doesNotMatch(trialStage, /components\/aventura|HeroGrid|StarCounter|hero|estrela/i);
});

test("Reconhecimento Visual: registro e relatório clínico não recebem nada da camada de aventura", () => {
  assert.doesNotMatch(model, /her[oó]i|estrela|aventura/i);
});

test("Reconhecimento Visual: herói é opcional e some da barra de progresso, nunca do registro exportado", () => {
  assert.match(workspace, /data-testid="rv-hero-picker"/);
  assert.match(workspace, /Não é dado clínico|não entram no registro|não entra no registro/);
});

test("Testes Cognitivos: aba direta pula só a escolha de herói, nunca a escolha do mundo nem a idade", () => {
  assert.match(cognitivePage, /data-testid="cognitive-track-tabs"/);
  assert.match(cognitivePage, /data-testid="cognitive-direct-tab"/);
  assert.match(cognitivePage, /setHero\(\(current\) => current \?\? DEFAULT_HERO\)/);
  assert.match(cognitivePage, /if \(direct\) \{\s*setHero\(\(current\) => current \?\? DEFAULT_HERO\);\s*setScreen\("map"\);/);
  // A idade continua obrigatória em ambas as trilhas: o botão "Iniciar aventura"
  // segue desabilitado sem idade válida, independente da aba escolhida.
  assert.match(cognitivePage, /disabled=\{!validAge\}/);
});

test("Testes Cognitivos: a troca de trilha trava depois de confirmar a idade, como nas outras três aplicações", () => {
  const tabs = cognitivePage.slice(
    cognitivePage.indexOf('data-testid="cognitive-track-tabs"'),
    cognitivePage.indexOf('data-testid="cognitive-direct-tab"') + 200,
  );
  assert.match(tabs, /disabled=\{confirmed\}/);
});

test("OBS-10: barra de estrelas conta blocos com registro, sem herói (a criança não vê esta tela) e sem vazar para o relatório/dossiê", () => {
  assert.match(obs10Page, /import \{ StarCounter \} from "@\/components\/aventura";/);
  assert.match(obs10Page, /<StarCounter stars=\{blocksWithContent\} label="blocos com registro" \/>/);
  assert.match(obs10Page, /new Set\(\s*observations\.filter\(usableObservation\)\.map\(\(o\) => o\.phase\),\s*\)\.size/);
  assert.doesNotMatch(obs10Page, /HeroGrid|DEFAULT_HERO/);
  assert.doesNotMatch(obs10Session, /her[oó]i|estrela|aventura/i);
  assert.doesNotMatch(obs10Dossier, /her[oó]i|estrela|aventura/i);
});
