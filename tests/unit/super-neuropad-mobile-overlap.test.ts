// Auditoria de 21/10/2026: no celular a barra inferior do app e o botão de ajuda cobriam os controles de resposta
// durante a partida, e o cabeçalho fixo cobria o topo da tela depois de rolar até o jogo.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync("client/src/pages/super-neuropad-game.tsx", "utf8");
const css = readFileSync("client/src/styles/flow-os.css", "utf8");

test("partida: a barra inferior e o botão de ajuda saem enquanto o jogo está em andamento e voltam depois", () => {
  assert.match(page, /classList\.toggle\("np-task-running", screen === "play"\)/);
  assert.match(page, /return \(\) => document\.body\.classList\.remove\("np-task-running"\)/);
  const block = css.slice(css.indexOf("body.np-task-running"));
  assert.match(block, /body\.np-task-running \[data-testid="mobile-primary-dock"\]/);
  assert.match(block, /body\.np-task-running \[data-testid="button-floating-help"\]/);
  assert.match(block, /display: none !important/);
  // Só em telas com a barra (até 1023 px); a regra mora dentro do mesmo @media das regras do dock.
  const media = css.slice(0, css.indexOf("body.np-task-running"));
  assert.ok(media.lastIndexOf("@media screen and (max-width: 1023px)") > media.lastIndexOf("@media print"), "regra dentro do @media do celular");
});

test("tela: rolar até o jogo deixa o topo abaixo do cabeçalho fixo do celular (4 rem)", () => {
  const root = /data-testid="super-neuropad-game"/.exec(page);
  assert.ok(root);
  const tag = page.slice(page.lastIndexOf("<div", root.index), root.index);
  assert.match(tag, /scroll-mt-20/);
  assert.match(tag, /lg:scroll-mt-4/);
});
