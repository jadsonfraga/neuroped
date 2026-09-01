/**
 * Regressão: o hub de integrações não pode fingir sucesso de iframe.
 * `onLoad` cross-origin dispara mesmo com X-Frame-Options/CSP bloqueando a
 * incorporação — antes da correção o overlay sumia ("ready") sobre um frame em
 * branco, e o timer de 10s rebaixava para "timeout" até um frame carregado.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolveFrameLoadStatus } from "../../client/src/lib/frameStatus";

// Mesma origem: documento legível → sucesso genuíno.
assert.equal(
  resolveFrameLoadStatus({ contentDocument: {} as Document }),
  "ready",
  "frame de mesma origem com documento legível é sucesso verificado",
);

// Cross-origin (acesso nulo ou negado): nunca declarar sucesso.
assert.equal(
  resolveFrameLoadStatus({ contentDocument: null }),
  "unverified",
  "onLoad cross-origin não pode virar 'ready' — pode ser página de bloqueio",
);
assert.equal(
  resolveFrameLoadStatus({
    get contentDocument(): Document | null {
      throw new DOMException("Blocked a frame", "SecurityError");
    },
  }),
  "unverified",
  "acesso negado ao documento também é estado não verificado, não sucesso",
);

const source = readFileSync("client/src/pages/manus-integracoes.tsx", "utf8");
assert.doesNotMatch(
  source,
  /onLoad=\{\(\)\s*=>\s*setFrameStatus\("ready"\)\}/,
  "onLoad não pode declarar sucesso incondicional",
);
assert.match(
  source,
  /onLoad=\{\(event\)\s*=>\s*setFrameStatus\(resolveFrameLoadStatus\(event\.currentTarget\)\)\}/,
  "onLoad deve passar pelo verificador honesto de carregamento",
);
assert.match(
  source,
  /setFrameStatus\(\(status\)\s*=>\s*\(status === "loading" \? "timeout" : status\)\)/,
  "o timer só pode promover 'loading' → 'timeout'; nunca rebaixar frame carregado",
);
assert.match(
  source,
  /frameStatus === "unverified"/,
  "estado não verificado precisa de aviso visível com saída externa",
);

console.log("✓ integrações: iframe bloqueado não vira sucesso falso; timeout não rebaixa frame carregado");
