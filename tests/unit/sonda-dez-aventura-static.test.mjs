import assert from "node:assert/strict";
import fs from "node:fs";

// Camada de aventura da Sonda Dez: gamificação sem tocar o contrato clínico.
//
// O que este teste trava:
//   1. estrelas derivam de missões FECHADAS (participação), nunca de código de
//      resposta (E/I/P/0/NA) nem de contagem;
//   2. a tela da criança (SondaDigitalActivity) continua estímulo puro, sem
//      importar nada da aventura;
//   3. o relatório e o resumo ao médico (sondaDezSession) não recebem estrela,
//      medalha ou herói;
//   4. só animação CSS na Sonda: o e2e instala relógio falso que congela rAF.

// Comentários explicam a regra e podem citá-la; a assertiva vale para o código.
const read = (path) =>
  fs
    .readFileSync(path, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
const guided = read("client/src/components/sonda-dez/SondaDigitalGuided.tsx");
const activity = read("client/src/components/sonda-dez/SondaDigitalActivity.tsx");
const session = read("client/src/lib/sondaDezSession.ts");
const aventura = read("client/src/components/aventura/index.tsx");

// 1. estrelas = missões fechadas
assert.match(guided, /import \{[\s\S]*MissionTrail[\s\S]*\} from "@\/components\/aventura"/);
assert.match(guided, /<StarCounter stars=\{completedCount\}/);
assert.match(guided, /const completedCount = missionDone\.filter\(Boolean\)\.length/);
assert.match(guided, /recordProblems\(m, records\[m\.id\]\)\.length === 0/);
assert.doesNotMatch(guided, /stars=\{[^}]*(values|counts|"E"|'E')[^}]*\}/);
assert.match(guided, /setCheer\(\{ mission: missionIndex \+ 1 \}\)/);

// 2. tela da criança sem aventura
assert.doesNotMatch(activity, /components\/aventura|HeroGrid|MissionTrail|StarCounter|estrela/i);

// 3. relatório sem gamificação
assert.doesNotMatch(session, /estrela|medalha|herói|heroi|aventura/i);

// 4. sem animação por JavaScript na Sonda e no módulo compartilhado
assert.doesNotMatch(guided, /framer-motion|canvas-confetti|@\/lib\/confetti/);
assert.doesNotMatch(aventura, /framer-motion|canvas-confetti|@\/lib\/confetti|setTimeout|requestAnimationFrame/);
assert.match(aventura, /motion-safe:animate-in/);

// Filosofia declarada onde a aplicadora lê
assert.match(guided, /Estrela é\s+participação, não desempenho/);
assert.match(guided, /Não entram\s+no registro clínico e não são escore/);

console.log("✓ Aventura da Sonda Dez: estrelas por participação, estímulo puro, relatório intacto, animação só CSS");
