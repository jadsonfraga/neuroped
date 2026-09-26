// Modo Fácil (joguinho): motor compartilhado EasyGame + integrações.
// Invariantes: sequência fixa; três desfechos (Acertou/Não acertou/Pular);
// resultado é contagem descritiva com aviso explícito; herói/estrelas são
// participação; a tela da criança (SondaDigitalActivity, TrialStage) continua
// sem gamificação; nenhum timer JS no motor (relógio falso dos e2e da Sonda).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { EASY_OUTCOME_LABEL, buildEasyReport, easyCounts, type EasyRecord } from "../../client/src/components/jogo-facil/easyReport";

const read = (path: string) => readFileSync(path, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
const engine = read("client/src/components/jogo-facil/EasyGame.tsx");
const sonda = read("client/src/components/sonda-dez/SondaDigitalGuided.tsx");
const sondaActivity = read("client/src/components/sonda-dez/SondaDigitalActivity.tsx");
const obs10 = read("client/src/pages/pre-consulta-obs10.tsx");
const visual = read("client/src/features/visual-recognition/Workspace.tsx");
const trialStage = read("client/src/features/visual-recognition/TrialStage.tsx");
const cognitive = read("client/src/pages/testes-cognitivos-faixa-etaria.tsx");

const records: EasyRecord[] = [
  { id: "a", group: "Missão 1", title: "Toque na bola", outcome: "acertou", auto: false },
  { id: "b", group: "Missão 1", title: "Ache o gato", outcome: "acertou", auto: true },
  { id: "c", group: "Missão 2", title: "Imite", outcome: "nao", auto: false },
  { id: "d", group: "Missão 2", title: "Marcha", outcome: "pulou", auto: false },
];

test("contagem por desfecho e resultado descritivo com aviso, sem escore", () => {
  assert.deepEqual(easyCounts(records), { total: 4, acertou: 2, nao: 1, pulou: 1 });
  const report = buildEasyReport({ title: "Sonda Dez", ageLabel: "48 meses", nature: "Natureza.", records, totalSteps: 5, footer: "Limite.", date: "2026-09-24" });
  assert.match(report, /^Sonda Dez · Modo Fácil \(joguinho\)/);
  assert.match(report, /NÃO É ESCORE, PERCENTIL NEM DIAGNÓSTICO/);
  assert.match(report, /Itens previstos: 5 · Registrados: 4 · Acertou: 2 · Não acertou: 1 · Pulou: 1/);
  assert.match(report, /2\. \[Missão 1\] Ache o gato — Acertou \(toque da criança na tela\)/);
  assert.match(report, /4\. \[Missão 2\] Marcha — Pulou/);
  assert.ok(report.endsWith("Natureza.\nLimite."));
  assert.doesNotMatch(report, /percentil: |ponto de corte: |\d+%/);
  assert.deepEqual(Object.values(EASY_OUTCOME_LABEL), ["Acertou", "Não acertou", "Pulou"]);
});

test("motor: três botões gigantes, avanço automático, sem timers JS, herói como participação", () => {
  for (const id of ["acertou", "nao", "pular", "show", "results", "progress"]) assert.ok(engine.includes(`data-testid={\`\${testid}-${id}\`}`), id);
  assert.doesNotMatch(engine, /setTimeout\(\(\) => set|setInterval\(|requestAnimationFrame\(|framer-motion/);
  assert.match(engine, /setIndex\(index \+ 1\)/);
  assert.match(engine, /const stars = records\.filter\(\(r\) => r\.outcome !== "pulou"\)\.length/);
  assert.match(engine, /Estrelas são participação, não nota/);
  assert.match(engine, /if \(auto\) record\(auto, true, detail\)/, "toque da criança decide e avança sozinho");
  assert.match(engine, /data-testid=\{`\$\{testid\}-next`\}/, "modo objetivo: Próximo entre itens contra toque duplo");
  assert.match(engine, /const transitionLock = useRef\(false\)/, "motor bloqueia corrida entre resposta e pulo");
  assert.match(engine, /if \(!step \|\| transitionLock\.current\) return;/, "uma única transição por item");
  assert.match(engine, /setAwaitNext\(objective\)/, "acerto, erro e pulo usam a mesma transição segura");
  assert.match(engine, /Resposta registrada/, "interstício neutro não antecipa o próximo estímulo");
  assert.match(engine, /O próximo item ainda está oculto/, "próximo item não vaza durante a transição");
  assert.match(engine, /\{!childOpen && !objective && \(/, "modo objetivo esconde Acertou/Não acertou");
});

test("Sonda 10: aba Modo Fácil usa o banco objetivo (1 a 19 anos), sem a trilha clínica nem objeto externo", () => {
  assert.match(sonda, /id: "easy",\s*label: "🎮 Modo Fácil · joguinho"/);
  assert.match(sonda, /"sonda-easy-tab"/);
  assert.match(sonda, /buildObjectiveSteps\("sonda", easyYears, "sonda-easy"\)/);
  assert.match(sonda, /objectiveBandForYears\(easyYears\)/);
  assert.match(sonda, /testid="sonda-easy"[\s\S]*?objective\n/);
  const easyBlock = sonda.slice(sonda.indexOf("if (easy) {"), sonda.indexOf("  return (\n    <div\n      className=\"mx-auto w-full max-w-6xl space-y-5 pb-16\"", sonda.indexOf("if (easy) {")));
  assert.doesNotMatch(easyBlock, /band\.missions|SondaDigitalActivity|s\.activity/);
  assert.doesNotMatch(sondaActivity, /jogo-facil|EasyGame|Acertou/);
});

test("OBS-10: aba Modo Fácil usa o banco objetivo, sem tarefas práticas, kit, câmera ou prono", () => {
  assert.match(obs10, /data-testid="obs10-easy-tab"/);
  assert.match(obs10, /buildObjectiveSteps\("obs10", easyYears, "obs10-easy"\)/);
  assert.match(obs10, /testid="obs10-easy"[\s\S]*?objective\n/);
  const easyBlock = obs10.slice(obs10.indexOf("if (easy) {"), obs10.indexOf('data-testid="obs10-workspace">', obs10.indexOf("if (easy) {") + 200));
  assert.doesNotMatch(easyBlock, /PRACTICAL_TASKS|taskOmission|TaskPicture|proneAllowed|media\.start|getUserMedia|MediaRecorder/);
});

test("tela de escolha objetiva: um toque por item, opções grandes, sem certo/errado para a criança", () => {
  const choice = read("client/src/components/jogo-facil/ObjectiveStep.tsx");
  assert.match(choice, /const answered = useRef\(false\);/);
  assert.match(choice, /if \(answered\.current\) return;/);
  assert.match(choice, /data-testid=\{`\$\{testid\}-option`\}/);
  assert.match(choice, /onDone\(chosen === item\.answer \? "acertou" : "nao", \{ chosen, correct: item\.answer \}\)/);
  assert.doesNotMatch(choice, /setTimeout|setInterval|requestAnimationFrame|framer-motion/);
  assert.doesNotMatch(choice, /Certo|Errado|✅|❌/);
});

test("Reconhecimento Visual: aba Modo Fácil decide pelo toque da criança e a tela infantil só ganha o auto-fechar", () => {
  assert.match(visual, /data-testid="rv-easy-tab"/);
  assert.match(visual, /mode:"receptivo"/);
  assert.match(visual, /autoFinishOnTap/);
  assert.match(visual, /onDone\(tap\?\(tap===trial\.targetId\?"acertou":"nao"\):undefined\)/);
  assert.match(visual, /Modo Fácil \(joguinho\): reconhecimento por toque na tela/);
  assert.match(trialStage, /autoFinishOnTap=false/);
  assert.doesNotMatch(trialStage, /jogo-facil|EasyGame|Acertou|estrela|her[oó]i/i);
});

test("Testes Cognitivos: Modo Fácil encadeia os quatro mundos e fecha com contagem descritiva", () => {
  assert.match(cognitive, /data-testid="cognitive-easy-tab"/);
  assert.match(cognitive, /if \(easy\) \{\s*setHero\(\(current\) => current \?\? DEFAULT_HERO\);\s*setActiveWorld\(WORLD_ORDER\[0\]\);\s*setScreen\("world"\);/);
  assert.match(cognitive, /useState\(easy && !result\)/, "mundo começa a jogar sem tela de introdução");
  assert.match(cognitive, /data-testid="cognitive-easy-next"/);
  assert.match(cognitive, /else setScreen\("results"\)/);
  assert.match(cognitive, /NÃO É ESCORE, PERCENTIL, IDADE EQUIVALENTE NEM DIAGNÓSTICO/);
  assert.match(cognitive, /data-testid="cognitive-easy-results"/);
});

test("Testes Cognitivos: toque duplo em Próxima fase não pula fase nem estoura o índice (bug corrigido)", () => {
  assert.match(cognitive, /const advancing = useRef\(false\);/);
  assert.match(cognitive, /if \(advancing\.current \|\| phase !== "registered"\) return;/);
  assert.match(cognitive, /setIdx\(Math\.min\(idx \+ 1, questions\.length - 1\)\);/);
  const registered = cognitive.slice(cognitive.indexOf('{phase === "registered" && ('), cognitive.indexOf("function ObsQuest("));
  assert.doesNotMatch(registered, /AnimatePresence|motion\.div|exit=/, "painel de avanço sem animação de saída: nenhum nó fantasma recebe o toque seguinte");
  assert.match(registered, /motion-safe:animate-in/);
});
