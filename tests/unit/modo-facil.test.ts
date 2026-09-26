// Modo Fácil (joguinho): motor compartilhado EasyGame + integrações.
// Invariantes: sequência fixa; três desfechos (Acertou/Não acertou/Pular);
// resultado é contagem descritiva com aviso explícito; herói/estrelas são
// participação; a tela da criança (SondaDigitalActivity, TrialStage) continua
// sem gamificação; nenhum timer JS no motor (relógio falso dos e2e da Sonda).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { EASY_OUTCOME_LABEL, MANUAL_TAP_MIN_GAP_MS, acceptManualTap, buildEasyReport, easyCounts, localIsoDate, type EasyRecord } from "../../client/src/components/jogo-facil/easyReport";

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
  assert.match(report, /podem ser registrados pelo adulto ou, quando o item permite, calculados pela interação da criança na tela/);
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
  assert.match(engine, /setAwaitNext\(objective \|\| auto\)/, "acerto, erro e pulo (objetivo) e todo toque da criança usam a mesma transição segura");
  assert.match(engine, /Resposta registrada/, "interstício neutro não antecipa o próximo estímulo");
  assert.match(engine, /O próximo item ainda está oculto/, "próximo item não vaza durante a transição");
  assert.match(engine, /\{!childOpen && !objective && !awaitNext && \(/, "modo objetivo e transição escondem Acertou/Não acertou");
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
  assert.match(visual, /chosen:itemFor\(tap\)\.label,correct:item\.label/, "reconhecimento preserva resposta e gabarito");
  assert.match(visual, /Modo Fácil \(joguinho\): reconhecimento por toque na tela/);
  assert.match(trialStage, /autoFinishOnTap=false/);
  assert.doesNotMatch(trialStage, /jogo-facil|EasyGame|Acertou|estrela|her[oó]i/i);
});

test("Testes Cognitivos: Modo Fácil usa o motor compartilhado com os 16 itens da idade, e a tela da criança decide toque e montagem", () => {
  assert.match(cognitive, /data-testid="cognitive-easy-tab"/);
  assert.match(cognitive, /import EasyGame, \{ type EasyStep \} from "@\/components\/jogo-facil\/EasyGame"/);
  assert.match(cognitive, /testid="cognitive-easy"/);
  assert.match(cognitive, /WORLD_ORDER\.flatMap\(\(domain\) =>\s*itemsFor\(age, domain\)\.map/, "os quatro mundos viram passos lineares, na ordem");
  assert.match(cognitive, /child: \(\{ onDone \}\) => <ChildScreen item=\{item\} onDone=\{onDone\} \/>/);
  assert.match(cognitive, /NÃO É ESCORE, PERCENTIL, IDADE EQUIVALENTE NEM DIAGNÓSTICO/);
  assert.doesNotMatch(cognitive, /VISUAL_BANK|LEITURA_BANK|ESCRITA_BANK|ARITMETICA_BANK|COGNITIVE_AGE_BANKS|ObsBlock|l[áa]pis\/caneta/, "bancos antigos (com observação de lápis e papel) extintos");
  const screens = read("client/src/features/cognitive-age/screens.tsx");
  assert.match(screens, /chosen: option, correct: item\.answer/, "toque da criança decide e preserva resposta");
  assert.match(screens, /chosen: placed\.join\(""\), correct: item\.target\.join\(""\)/, "montagem preserva resposta e gabarito");
  assert.match(screens, /← Voltar ao aplicador/);
  assert.doesNotMatch(screens, /setTimeout|setInterval|requestAnimationFrame|framer-motion/, "tela da criança sem timers JS");
  assert.doesNotMatch(screens, /Acertou|acertou!|certo!|errado!|Errou/, "a criança não vê certo/errado");
});

test("Testes Cognitivos: toque duplo em Próxima fase não pula fase nem estoura o índice (bug corrigido)", () => {
  assert.match(cognitive, /const advancing = useRef\(false\);/);
  assert.match(cognitive, /if \(advancing\.current \|\| phase !== "registered"\) return;/);
  assert.match(cognitive, /setIdx\(Math\.min\(idx \+ 1, questions\.length - 1\)\);/);
  const registered = cognitive.slice(cognitive.indexOf('{phase === "registered" && ('), cognitive.indexOf("function WorldScreen("));
  assert.doesNotMatch(registered, /AnimatePresence|motion\.div|exit=/, "painel de avanço sem animação de saída: nenhum nó fantasma recebe o toque seguinte");
  assert.match(registered, /motion-safe:animate-in/);
});

test("motor: toque duplo do adulto em Acertou/Não acertou/Pular/Próximo/Voltar registra uma única ação (bug corrigido)", () => {
  // Regra pura: segundo toque dentro do intervalo é ignorado; o carimbo é o do
  // evento (event.timeStamp), nunca Date.now/performance.now (relógio falso dos e2e).
  assert.equal(MANUAL_TAP_MIN_GAP_MS, 300);
  assert.equal(acceptManualTap(Number.NEGATIVE_INFINITY, 1000), true, "primeiro toque sempre entra");
  assert.equal(acceptManualTap(1000, 1120), false, "toque duplo (120 ms) não registra o item seguinte");
  assert.equal(acceptManualTap(1000, 1299), false, "limite: 299 ms ainda é toque duplo");
  assert.equal(acceptManualTap(1000, 1300), true, "300 ms já é um toque deliberado");
  assert.equal(acceptManualTap(1000, Number.NaN), true, "evento sem carimbo não trava o jogo");
  for (const outcome of ["acertou", "nao", "pulou"]) assert.match(engine, new RegExp(`onClick=\\{\\(event\\) => manual\\("${outcome}", event\\)\\}`), outcome);
  assert.equal((engine.match(/manual\("pulou", event\)/g) ?? []).length, 2, "Pular guardado nos dois modos (manual e objetivo)");
  assert.doesNotMatch(engine, /onClick=\{\(\) => record\(/, "nenhum botão manual chama record sem a trava");
  assert.match(engine, /if \(!acceptManualTap\(lastActivationAt\.current, event\.timeStamp\)\) return false;/);
  assert.match(engine, /onClick=\{next\}/, "Próximo e Ver resultado passam pela trava");
  assert.match(engine, /onClick=\{openChild\}/, "Mostrar passa pela trava e carimba a abertura da tela da criança");
  assert.match(engine, /onClick=\{\(event\) => undo\(event\)\}/, "Voltar um passo passa pela trava");
  assert.match(engine, /if \(auto\) record\(auto, true, detail\)/, "toque da criança continua direto, sem trava de tempo própria");
  assert.doesNotMatch(engine, /Date\.now\(\)|performance\.now\(\)/, "sem relógio JS no motor");
});

test("motor: nada nasce sob o dedo da criança — transição após todo toque automático, entrega neutra no fim, dica do aplicador some (bugs corrigidos)", () => {
  assert.match(engine, /\{step\.child && !childOpen && !objective && !awaitNext && \(/, "Mostrar não aparece durante a transição");
  assert.match(engine, /onClickCapture=\{\(event\) => \{\s*if \(!acceptManualTap\(childOpenedAt\.current, event\.timeStamp\)\)/, "primeiro toque dentro da tela da criança respeita o intervalo desde a abertura (toque duplo em Próximo/Mostrar)");
  assert.match(engine, /className=\{childOpen \? "sr-only" : /, "título do passo (rótulo do aplicador, pode trazer a palavra ditada) some com a tela da criança aberta; a fala à criança permanece");
  assert.match(engine, /\{step\.hint && !childOpen && /, "dica do aplicador (traz o esperado) some com a tela da criança aberta");
  assert.match(engine, /\{step\.visual && !childOpen && /, "ilustração do aplicador some com a tela da criança aberta");
  assert.match(engine, /\{finished && awaitNext && \(/, "último toque da criança leva a uma tela neutra de entrega");
  assert.match(engine, /data-testid=\{`\$\{testid\}-handover`\}/);
  assert.match(engine, /\{finished && !awaitNext && \(/, "resultado com contagem só depois que o adulto toca em Ver resultado");
  const handover = engine.slice(engine.indexOf("{finished && awaitNext && ("), engine.indexOf("{finished && !awaitNext && ("));
  assert.doesNotMatch(handover, /counts\.|records\.map|Acertou|Errado|Não acertou|label\[/, "tela de entrega sem contagem nem certo/errado");
});

test("registro: data local (não UTC) e nome de arquivo sem acentos mutilados", () => {
  assert.equal(localIsoDate(new Date(2026, 8, 24, 23, 30)), "2026-09-24", "23h30 no fuso local continua sendo o mesmo dia, não o UTC do dia seguinte");
  assert.equal(localIsoDate(new Date(2026, 0, 5, 0, 5)), "2026-01-05");
  assert.match(buildEasyReport({ title: "T", ageLabel: "1", nature: "N", records: [], totalSteps: 1 }), new RegExp(`Data: ${localIsoDate()}`));
  assert.doesNotMatch(read("client/src/components/jogo-facil/easyReport.ts"), /toISOString\(\)\.slice\(0, 10\)/, "data do registro nunca em UTC");
  assert.match(engine, /title\.normalize\("NFD"\)\.replace\(\/\[\\u0300-\\u036f\]\/g, ""\)\.toLowerCase\(\)\.replace\(\/\[\^a-z0-9\]\+\/g, "-"\)/, "acentos removidos antes de trocar por hífen: 'Etária' vira 'etaria', não 'et-ria'");
});

test("Testes Cognitivos, modo guiado: a resposta esperada de itens de fala fica numa dobra do aplicador, não solta na tela compartilhada", () => {
  assert.doesNotMatch(cognitive, /Esperado: <strong>\{q\.expected\}<\/strong>/);
  assert.match(cognitive, /data-testid="cognitive-say-expected"/);
  const fold = cognitive.slice(cognitive.indexOf('data-testid="cognitive-say-expected"'), cognitive.indexOf("</details>", cognitive.indexOf('data-testid="cognitive-say-expected"')));
  assert.match(fold, /Resposta esperada \(só o aplicador lê\)/);
  assert.match(fold, /<strong>\{q\.expected\}<\/strong>/);
});

test("Testes Cognitivos: Modo Fácil informa progresso e guarda a saída, o reinício e a troca de idade", () => {
  assert.match(cognitive, /useSondaExitGuard\(easyProgress > 0, EASY_EXIT_PROMPT\);/, "guarda central reconhece modo e sessão reais, além do prompt próprio");
  assert.match(cognitive, /if \(easyProgress > 0 && !window\.confirm\(EASY_EXIT_PROMPT\)\) return false;\s*setEasyProgress\(0\);\s*setConfirmed\(false\);/, "Reiniciar jogo confirma antes de apagar");
  assert.match(cognitive, /onChange=\{\(e\) => \{\s*if \(!resetAdventure\(\)\) return;/, "trocar a idade confirma antes de apagar");
  assert.match(cognitive, /steps=\{easySteps\}\s*onProgress=\{setEasyProgress\}/);
});
