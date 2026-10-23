import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";
import { snapshotCompletedFamilySession } from "../../client/src/features/super-neuropad/familyDelivery";

// Executa os handlers reais com o estado do render anterior, como no batching React.
const source = readFileSync(new URL("../../client/src/pages/super-neuropad-game.tsx", import.meta.url), "utf8");
const tree = ts.createSourceFile("page.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
function handler(name: string, scope: Record<string, unknown>) {
  let body = "";
  function visit(node: ts.Node) {
    if (ts.isFunctionDeclaration(node) && node.name?.text === name) body = node.getText(tree);
    ts.forEachChild(node, visit);
  }
  visit(tree);
  assert.ok(body, `handler ${name} existe`);
  const js = ts.transpile(body, { target: ts.ScriptTarget.ES2022 });
  return new Function(...Object.keys(scope), `${js}; return ${name};`)(...Object.values(scope));
}

const noop = () => {};
test("encerramento entrega retrato final com última resposta, motivo e data, sem alterar render anterior", () => {
  const previous = { answers: [{ itemId: "primeiro" }], skipped: [], finishedAt: null, pausedSeconds: 0 };
  const answers = [...previous.answers, { itemId: "ultimo" }];
  const skipped = [{ phaseId: "corpo", reason: "Recusa registrada" }];
  const delivered: unknown[][] = [];
  const finishedAt = { current: null };
  const finish = handler("finishGame", {
    session: previous, answers: previous.answers, skipped: previous.skipped,
    pausedAt: { current: null }, pausedMs: { current: 2500 }, finishedAt,
    playFlagPole: noop, celebrate: noop, music: { current: null }, setPaused: noop, setScreen: noop,
    familyContact: { email: "familia@example.invalid" }, familyDeliveryStatus: "ready",
    snapshotCompletedFamilySession,
    deliverToFamily: (...args: unknown[]) => delivered.push(args),
  });
  finish(answers, skipped);
  assert.equal(delivered.length, 1);
  const snapshot = delivered[0][1] as typeof previous;
  assert.ok(snapshot, "entrega recebe sessão explícita, sem closure antiga");
  assert.deepEqual(snapshot.answers, answers);
  assert.deepEqual(snapshot.skipped, skipped);
  assert.equal(snapshot.finishedAt, finishedAt.current);
  assert.ok(snapshot.finishedAt);
  assert.equal(snapshot.pausedSeconds, 3);
  assert.equal(previous.finishedAt, null);
  assert.equal(previous.answers.length, 1);
});

test("última resposta e último mundo pulado passam suas mudanças ao encerramento", () => {
  const finished: unknown[][] = [];
  const finishGame = (...args: unknown[]) => finished.push(args);
  const old = [{ itemId: "anterior" }];
  const last = { itemId: "ultimo" };
  handler("pushAnswer", { paused: false, playCoin: noop, answers: old, setAnswers: noop,
    showCheer: noop, CHEERS: ["Obrigado"], itemIndex: 0, items: [last], phaseIndex: 5,
    PHASE_ORDER: [0, 1, 2, 3, 4, 5], finishGame })(last);
  assert.deepEqual(finished[0][0], [...old, last]);
  handler("skipPhase", { softTap: noop, setSkipOpen: noop, setSkipped: noop, skipped: [],
    phaseId: "corpo", phaseIndex: 5, PHASE_ORDER: [0, 1, 2, 3, 4, 5], answers: old,
    finishGame })("Cansaço");
  assert.deepEqual(finished[1], [old, [{ phaseId: "corpo", reason: "Cansaço" }]]);
});
