/** Browser test of the shipped Sonda UI. Synthetic login only; no clinical API
 * replacement inside the Sonda (it has none), no direct manipulation of React state.
 * Playwright's clock runs all timer ticks; fastForward is used only to simulate a
 * suspended browser and verify interrupted presentations fail closed.
 */
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import {
  startStaticServer,
  auditBrowserLaunchOptions,
  ACCEPTED_FIRST_VISIT_STORAGE,
} from "../../scripts/lib/browser-audit-runtime.mjs";
import {
  createSyntheticClinicalApi,
  SYNTHETIC_CREDENTIALS,
} from "../../scripts/lib/synthetic-clinical-api.mjs";
import {
  DIGITAL_BANDS,
  TRAINING_CASES,
  physicalFieldReason,
} from "../../client/src/data/sondaDezDigital.ts";

const artifactDir = process.env.SONDA_E2E_ARTIFACT_DIR || "/tmp/sonda-e2e";
await mkdir(artifactDir, { recursive: true });
const server = await startStaticServer("dist/public", {
  port: 0,
  apiHandler: createSyntheticClinicalApi({ patients: "empty" }),
});
const browser = await chromium.launch(auditBrowserLaunchOptions());
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  acceptDownloads: true,
});
await context.addInitScript((storage) => {
  for (const [key, value] of Object.entries(storage))
    localStorage.setItem(key, value);
}, ACCEPTED_FIRST_VISIT_STORAGE);
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("dialog", (dialog) => dialog.accept());
let stepsTested = 0;
const checkedKinds = new Set();
const a11yResults = [];
const btn = (name) => page.getByRole("button", { name, exact: true });
async function click(name) {
  await btn(name).click();
}
async function noOverflow() {
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    ),
    false,
  );
}
async function auditScreen(label, scope = '[data-testid="sonda-digital"]') {
  await noOverflow();
  const result = await new AxeBuilder({ page }).include(scope).analyze();
  if (result.violations.length) await writeFile(`${artifactDir}/axe-${label}-failure.json`, JSON.stringify(result.violations, null, 2));
  assert.deepEqual(
    result.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => n.target),
    })),
    [],
    label,
  );
  a11yResults.push({ label, violations: 0, passes: result.passes.length });
}
async function finishActivity(spec, waitSeconds, { respondToTarget = true, observeRule = true } = {}) {
  const dialog = page.getByRole("dialog");
  await dialog.waitFor();
  if (waitSeconds) {
    assert.equal(
      await btn("Concluir observação").isDisabled(),
      true,
      "Free observation must not finish early",
    );
    await page.clock.runFor(waitSeconds * 1000 + 100);
  }
  const invalidPaint = await dialog
    .locator("svg [fill], svg [stroke]")
    .evaluateAll((nodes) =>
      nodes.flatMap((node) =>
        ["fill", "stroke"]
          .filter(
            (prop) =>
              node.hasAttribute(prop) &&
              !CSS.supports(prop, node.getAttribute(prop)),
          )
          .map((prop) => node.getAttribute(prop)),
      ),
    );
  assert.deepEqual(invalidPaint, [], "Stimulus colors must be valid CSS");
  if (spec.kind === "objects") {
    const buttons = dialog.getByRole("button", {
      name: spec.items[0],
      exact: true,
    });
    if (await buttons.count()) await buttons.click();
    if (spec.items.length > 1) {
      const objects = dialog.locator("button[aria-pressed]");
      await objects.nth(1).click();
    }
  } else if (spec.kind === "imitation") {
    for (let i = 0; i < 3; i++)
      await dialog
        .getByRole("button", { name: "Próximo modelo", exact: true })
        .click();
    await dialog.getByRole("slider").fill("65");
  } else if (spec.kind === "cups") {
    for (let trial = 0; trial < 2; trial++) {
      await click("Cobrir recipientes");
      await dialog
        .getByRole("button", { name: `Recipiente ${trial + 1}`, exact: true })
        .click();
      if (trial === 0) await click("Segunda tentativa");
    }
  } else if (spec.kind === "sequence") {
    // Real timer ticks, with at least one response when there is a response button.
    if (spec.target && respondToTarget)
      await dialog
        .getByRole("button", { name: "Responder ao alvo", exact: true })
        .click();
    if (spec.prompt === "operator-only" && observeRule) {
      for (const item of spec.items) {
        await dialog
          .getByRole("button", { name: spec.responseRule[item], exact: true })
          .click();
        await page.clock.runFor(spec.intervalMs ?? 2500);
      }
    } else if (spec.responseRule && observeRule) {
      for (const item of spec.items) {
        await page.keyboard.press(spec.responseRule[item] === "Uma palma" ? "1" : "2");
        await page.clock.runFor(spec.intervalMs ?? 2500);
      }
    } else
      await page.clock.runFor(
        spec.items.length * (spec.intervalMs ?? 2500) + 150,
      );
  } else if (spec.kind === "grid") {
    const cell = dialog.getByRole("button", { name: /Posição 1:/ });
    await cell.click();
    await cell.click();
    await dialog.getByRole("button", { name: /Posição 2:/ }).click();
    await page.clock.runFor((spec.durationSeconds ?? 60) * 1000 + 150);
    assert.equal(await cell.isDisabled(), true);
  } else if (spec.kind === "model") {
    await page.clock.runFor(5200);
    await dialog
      .getByRole("button", { name: "Peça azul", exact: true })
      .click();
    await dialog
      .getByRole("button", { name: "Posição 1", exact: true })
      .click();
  } else if (spec.kind === "plan") {
    await click("Reorganizar tudo");
    for (const item of [...spec.items].reverse())
      await dialog.getByRole("button", { name: item, exact: true }).click();
  } else if (spec.kind === "locked" && spec.prompt === "unlock")
    await click("Abrir caixa");
  await noOverflow();
  if (!checkedKinds.has(spec.kind) && spec.kind !== "blank") {
    // Run accessibility scanning after timed presentations to avoid delaying stimuli.
    await auditScreen(`activity-${spec.kind}`, "dialog");
    checkedKinds.add(spec.kind);
  }
  await click(
    spec.kind === "sequence" || spec.kind === "grid"
      ? "Voltar ao registro"
      : "Concluir observação",
  );
  await page.getByRole("dialog").waitFor({ state: "detached" });
}
async function prepare(band) {
  await page
    .getByLabel("Idade em anos", { exact: true })
    .fill(String(Math.floor(band.minMonths / 12)));
  await page
    .getByLabel("Meses adicionais", { exact: true })
    .fill(String(band.minMonths % 12));
  await page
    .getByLabel("Código anônimo da sessão (opcional)", { exact: true })
    .fill("CASO-SINTETICO");
  const prep = page
    .getByRole("heading", { name: "Conferir antes de começar", exact: true })
    .locator("..");
  for (const checkbox of await prep.getByRole("checkbox").all())
    await checkbox.check();
  await click("Usar sem som eletrônico");
  await click("Ir para o ensaio");
  assert.equal(await btn("Iniciar aplicação").isDisabled(), true);
  for (const [i, spec] of [
    { kind: "objects", items: ["sol", "lua", "caixa"] },
    {
      kind: "sequence",
      items: ["sol", "lua", "sol", "lua"],
      target: "sol",
      intervalMs: 2500,
    },
    {
      kind: "grid",
      items: ["⊙", "○", "□", "⊙"],
      target: "⊙",
      durationSeconds: 5,
    },
  ].entries()) {
    await page
      .getByRole("button", { name: new RegExp(`^${i + 1}\\. Treinar`) })
      .click();
    await finishActivity(spec);
  }
  for (const q of TRAINING_CASES)
    await page
      .getByRole("group")
      .filter({ has: page.locator("legend", { hasText: q.question }) })
      .getByRole("button", { name: q.answer, exact: true })
      .click();
  if (band === DIGITAL_BANDS[0]) {
    const group = page.getByRole("group").filter({
      has: page.locator("legend", { hasText: TRAINING_CASES[0].question }),
    });
    await group.getByRole("button", { name: "E", exact: true }).click();
    assert.equal(
      await btn("Iniciar aplicação").isDisabled(),
      true,
      "Wrong interpretation blocks training completion",
    );
    await group.getByRole("button", { name: "I", exact: true }).click();
    await auditScreen("training");
    await page.screenshot({
      path: `${artifactDir}/ensaio-desktop.png`,
      fullPage: true,
    });
  }
  await click("Iniciar aplicação");
}
try {
  await page.goto(`${server.origin}/#/testes-diretos`);
  await page.waitForLoadState("networkidle");
  await page.locator("#login-email").fill(SYNTHETIC_CREDENTIALS.email);
  await page.locator("#login-password").fill(SYNTHETIC_CREDENTIALS.password);
  await page
    .locator('[data-testid="login-form"] button[type="submit"]')
    .click();
  await page
    .locator('[data-testid="sonda-digital"]')
    .waitFor({ timeout: 20000 });
  // Finish the real route entrance animation before mocking the task clock.
  // Installing a clock mid-animation can freeze an opacity-zero ancestor.
  await page.waitForFunction(() => {
    let node = document.querySelector('[data-testid="sonda-digital"]');
    if (!node) return false;
    while (node) {
      if (Number(getComputedStyle(node).opacity) < 0.99) return false;
      node = node.parentElement;
    }
    return true;
  });
  await page.screenshot({
    path: `${artifactDir}/preparacao-desktop.png`,
    fullPage: true,
    animations: "disabled",
  });
  const prepA11y = await new AxeBuilder({ page })
    .include('[data-testid="sonda-digital"]')
    .analyze();
  assert.deepEqual(
    prepA11y.violations.map((v) => v.id),
    [],
  );
  await page.clock.install();
  assert.equal(await btn("Ouvi e está confortável").isDisabled(), true);
  await click("Testar som");
  await page.waitForFunction(() =>
    [...document.querySelectorAll("button")].some(
      (b) => b.textContent.trim() === "Ouvi e está confortável" && !b.disabled,
    ),
  );
  assert.equal(await btn("Ir para o ensaio").isDisabled(), true);
  await page.getByLabel("Idade em anos", { exact: true }).fill("18");
  assert.equal(await btn("Ir para o ensaio").isDisabled(), true);
  await page.setViewportSize({ width: 320, height: 740 });
  await auditScreen("preparation-320");
  await page.screenshot({
    path: `${artifactDir}/preparacao-mobile.png`,
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  for (const [bandIndex, band] of DIGITAL_BANDS.entries()) {
    if (bandIndex > 0) {
      await click("Nova aplicação");
      await click("Apagar e começar outra");
    }
    await prepare(band);
    if (bandIndex === 0) {
      await page
        .getByText("Familiarizar com os controles", { exact: true })
        .click();
      await click("1. Treinar seleção e relação");
      await finishActivity({ kind: "objects", items: ["sol", "lua", "caixa"] });
      assert.equal(await btn("Abrir estímulo desta etapa").isDisabled(), true);
      await click("Retomar");
      await page.setViewportSize({ width: 390, height: 844 });
      await auditScreen("application-mobile");
      await page.screenshot({
        path: `${artifactDir}/aplicacao-mobile.png`,
        fullPage: true,
      });
      await page.setViewportSize({ width: 1440, height: 1000 });
    }
    for (const [mi, mission] of band.missions.entries()) {
      const observedCounts = {};
      const finish = btn(
        mi < band.missions.length - 1
          ? "Concluir missão e continuar"
          : "Concluir e revisar registro",
      );
      assert.equal(
        await finish.isDisabled(),
        true,
        "Missing observations must block completion",
      );
      for (const [si, step] of mission.steps.entries()) {
        await page
          .getByLabel("Li a instrução e sei o que observar nesta etapa.", {
            exact: true,
          })
          .check();
        await click(
          step.activity.prompt === "operator-only"
            ? "Abrir cartões da aplicadora"
            : "Abrir estímulo desta etapa",
        );
        if (bandIndex === 0 && mi === 0 && si === 0) {
          await page.setViewportSize({ width: 390, height: 844 });
          await noOverflow();
          await page.screenshot({
            path: `${artifactDir}/objetos-mobile.png`,
            fullPage: false,
            animations: "disabled",
          });
          await page.setViewportSize({ width: 1440, height: 1000 });
          const a11y = await new AxeBuilder({ page })
            .include("dialog")
            .analyze();
          assert.deepEqual(
            a11y.violations.map((v) => v.id),
            [],
          );
        }
        await finishActivity(step.activity, step.waitSeconds);
        if (step.activity.kind === "sequence" && step.activity.target) {
          const targets = step.activity.items.filter((item) => item === step.activity.target).length;
          Object.assign(observedCounts, {acertos:1, omissoes:targets - 1, comissoes:0});
          assert.ok(await page.getByText(`Toques registrados: 1 em alvos; ${targets - 1} alvos sem toque; 0 em outros estímulos.`, {exact:false}).count());
        }
        if (step.activity.kind === "grid") {
          const hits = step.activity.items[1] === step.activity.target ? 1 : 0;
          const omissions = step.activity.items.filter((item) => item === step.activity.target).length - hits;
          Object.assign(observedCounts, {alvos:hits, omissoes:omissions, falsos:1 - hits, comissoes:1 - hits});
          assert.ok(await page.getByText(`Alvos marcados: ${hits}. Omissões: ${omissions}. Distratores marcados: ${1 - hits}.`, {exact:true}).count());
        }
        if (step.activity.prompt === "operator-only") Object.assign(observedCounts, {acertos: step.activity.items.length, erros:0, perseveracoes:0});
        if (step.activity.responseRule && step.activity.prompt !== "operator-only") {
          if (mission.id === "b-inibicao" && si === 1) Object.assign(observedCounts, { inversao: step.activity.items.length, perseveracoes: 0 });
          else Object.assign(observedCounts, { acertos: step.activity.items.length, comissoes: 0, omissoes: 0, perseveracoes: 0 });
          assert.equal(await page.getByLabel(`Resposta ao cartão 1: ${step.activity.items[0]}`, { exact: true }).inputValue(), step.activity.responseRule[step.activity.items[0]]);
        }
        stepsTested++;
        if (si < mission.steps.length - 1) await click("Próxima etapa");
      }
      for (const field of mission.fields) {
        const group = page.getByRole("group").filter({
          has: page.locator("legend").filter({
            hasText: new RegExp(
              `^${field.label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
            ),
          }),
        });
        if (physicalFieldReason(mission.id, field.id)) {
          assert.equal(
            await group
              .getByRole("button", { name: "NA", exact: true })
              .isDisabled(),
            true,
          );
          continue;
        }
        if (field.kind === "count") {
          const input = group.getByRole("spinbutton");
          const derived = mission.steps.some((s) => Object.values(s.activity.countFields ?? {}).includes(field.id));
          if (derived) {
            assert.equal(await input.isDisabled(), true, `${mission.id}/${field.id}: derived total cannot be typed`);
            assert.equal(await input.inputValue(), String(observedCounts[field.id]), `${mission.id}/${field.id}: events match total`);
          } else await input.fill(String(observedCounts[field.id] ?? 0));
        }
        else
          await group
            .getByRole("button", {
              name: field.options.includes("I")
                ? "I"
                : field.options.find((option) => option !== "NA"),
              exact: true,
            })
            .click();
      }
      await page
        .getByLabel("Observação direta, fala e ajudas oferecidas", {
          exact: true,
        })
        .fill(
          "Exemplo inteiramente sintético para verificar controles; sem interpretação clínica de paciente.",
        );
      await page
        .getByLabel(
          "Conferi as oportunidades, ajudas, registros e motivos de NA desta missão.",
          { exact: true },
        )
        .check();
      assert.equal(
        await finish.isEnabled(),
        true,
        `Mission ${mission.id} has unfinished gates`,
      );
      await finish.click();
    }
    const report = await page
      .getByRole("textbox", { name: "Registro completo", exact: true })
      .inputValue();
    assert.match(report, /Missões registradas: 7\/7/);
    assert.doesNotMatch(report, /DADO AUSENTE/);
    assert.match(report, /requer validação clínica/);
    if (bandIndex === 0)
      assert.match(
        report,
        /Familiarização com controles durante a aplicação:.*concluída/,
      );
    if (bandIndex >= 4) assert.match(report, /resposta-verbal/);
    assert.doesNotMatch(
      report,
      /relação — sol para lua/,
      "Practice events must not leak into the report",
    );
    const download = page.waitForEvent("download");
    await click("Baixar registro");
    const file = await download;
    assert.equal(await readFile(await file.path(), "utf8"), report);
    await writeFile(`${artifactDir}/registro-${band.id}.txt`, report);
    if (bandIndex === 0) {
      await auditScreen("complete-report");
      await page.screenshot({
        path: `${artifactDir}/revisao-desktop.png`,
        fullPage: true,
      });
      await click("Nova aplicação");
      await page.setViewportSize({ width: 320, height: 740 });
      await noOverflow();
      await click("Manter esta aplicação");
      assert.equal(
        await page
          .getByRole("textbox", { name: "Registro completo", exact: true })
          .inputValue(),
        report,
      );
      await page.setViewportSize({ width: 1440, height: 1000 });
    }
    console.log(
      `PASS ${band.id}: ${band.missions.length} missões, exportação fiel`,
    );
  }
  // Exact reproduction: 36 months, all 15 cards, no touch -> 0 / 5 / 0.
  await click("Nova aplicação");
  await click("Apagar e começar outra");
  await prepare(DIGITAL_BANDS[2]);
  await click("Revisar / encerrar");
  await page.getByRole("button", { name: "6. Atenção sustentada", exact: true }).click();
  await click("Retomar");
  await page.getByLabel("Li a instrução e sei o que observar nesta etapa.", { exact: true }).check();
  await click("Abrir estímulo desta etapa");
  await finishActivity({ kind: "blank" });
  await click("Próxima etapa");
  await page.getByLabel("Li a instrução e sei o que observar nesta etapa.", { exact: true }).check();
  await click("Abrir estímulo desta etapa");
  await finishActivity(DIGITAL_BANDS[2].missions[5].steps[1].activity, undefined, { respondToTarget: false });
  for (const [label, value] of [["Acertos", "0"], ["Omissões", "5"], ["Comissões", "0"]]) {
    const input = page.getByLabel(`Quantidade de ${label}`, { exact: true });
    assert.equal(await input.isDisabled(), true);
    assert.equal(await input.inputValue(), value);
  }
  await click("Revisar / encerrar");
  const noTouchReport = await page.getByRole("textbox", { name: "Registro completo", exact: true }).inputValue();
  assert.match(noTouchReport, /Idade: 36 meses/);
  assert.match(noTouchReport, /Omissões: 5\./);
  assert.match(noTouchReport, /não expectativas equivalentes nem normas/);
  await page.getByRole("button", { name: "7. Inibição + troca de regra", exact: true }).click();
  await click("Retomar");
  await page.getByLabel("Li a instrução e sei o que observar nesta etapa.", { exact: true }).check();
  await click("Abrir estímulo desta etapa");
  const ruleSpec = DIGITAL_BANDS[2].missions[6].steps[0].activity;
  await finishActivity(ruleSpec, undefined, { observeRule: false });
  const ruleTotal = page.getByLabel("Quantidade de Regra inicial: acertos", { exact: true });
  assert.equal(await ruleTotal.inputValue(), "", "no observations is not zero");
  assert.equal(await btn("Concluir e revisar registro").isDisabled(), true);
  for (const [i, item] of ruleSpec.items.entries()) {
    await page.getByLabel(`Resposta ao cartão ${i + 1}: ${item}`, { exact: true }).selectOption(ruleSpec.responseRule[item]);
  }
  assert.equal(await ruleTotal.inputValue(), "10");
  const firstResponse = page.getByLabel(`Resposta ao cartão 1: ${ruleSpec.items[0]}`, { exact: true });
  await firstResponse.selectOption("Esperar");
  assert.equal(await ruleTotal.inputValue(), "9");
  await firstResponse.selectOption("Não observado");
  assert.equal(await ruleTotal.inputValue(), "");
  await page.setViewportSize({ width: 390, height: 844 });
  await auditScreen("per-card-review-mobile");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await click("Revisar / encerrar");
  const missingObservation = await page.getByRole("textbox", { name: "Registro completo", exact: true }).inputValue();
  assert.match(missingObservation, /Regra inicial: acertos: DADO AUSENTE/);
  assert.match(missingObservation, /resposta-observada/);
  assert.match(missingObservation, /registro parcial/);
  console.log("PASS 36 months negative paths: 0/5/0 locked; missing observation invalidates totals; corrections retained");
  // A suspended browser must not turn an interrupted series into a completed one.
  await click("Nova aplicação");
  await click("Apagar e começar outra");
  await prepare(DIGITAL_BANDS[3]);
  await click("Revisar / encerrar");
  await page.getByRole("button", { name: /4\. Atenção sustentada/ }).click();
  await click("Retomar");
  await page
    .getByLabel("Li a instrução e sei o que observar nesta etapa.", {
      exact: true,
    })
    .check();
  await click("Abrir estímulo desta etapa");
  await finishActivity({ kind: "blank" });
  await click("Próxima etapa");
  await page
    .getByLabel("Li a instrução e sei o que observar nesta etapa.", {
      exact: true,
    })
    .check();
  await click("Abrir estímulo desta etapa");
  await page.clock.fastForward(10000);
  await page.getByRole("dialog").waitFor({ state: "detached" });
  assert.ok(
    await page
      .getByText("Apresentação interrompida.", { exact: false })
      .count(),
  );
  assert.equal(await btn("Concluir missão e continuar").isDisabled(), true);
  await click("Retomar");
  await click("Abrir estímulo desta etapa");
  await finishActivity(DIGITAL_BANDS[3].missions[3].steps[1].activity);
  await click("Revisar / encerrar");
  const partial = await page
    .getByRole("textbox", { name: "Registro completo", exact: true })
    .inputValue();
  assert.match(partial, /registro parcial/);
  assert.match(partial, /Reapresentação: 1 tentativa/);
  assert.match(partial, /Evento anterior/);
  assert.doesNotMatch(partial, /Como ler:/);
  await page.setViewportSize({ width: 390, height: 844 });
  await noOverflow();
  await page.screenshot({
    path: `${artifactDir}/revisao-mobile.png`,
    fullPage: true,
  });
  // Real UI negative paths: missing NA reason, all-skipped scoring, keyboard pause,
  // help attribution, and denied clipboard. Only the clipboard failure is injected.
  await page
    .getByRole("button", {
      name: `3. ${DIGITAL_BANDS[3].missions[2].title}`,
      exact: true,
    })
    .click();
  await click("Retomar");
  assert.equal(await btn("Toda a missão: NA").isDisabled(), true);
  await page
    .getByLabel("Se não pôde apresentar, descreva o motivo", { exact: true })
    .fill("Exemplo sintético: recusou esta atividade.");
  await click("Toda a missão: NA");
  const cause = page
    .getByRole("group")
    .filter({ has: page.locator("legend", { hasText: /^Causalidade$/ }) });
  await cause.getByRole("button", { name: "0", exact: true }).click();
  await page
    .getByLabel("Observação direta, fala e ajudas oferecidas", { exact: true })
    .fill("Nenhuma oportunidade foi apresentada.");
  await page
    .getByLabel(
      "Conferi as oportunidades, ajudas, registros e motivos de NA desta missão.",
      { exact: true },
    )
    .check();
  assert.equal(await btn("Concluir missão e continuar").isDisabled(), true);
  await cause.getByRole("button", { name: "NA", exact: true }).click();
  await page.getByLabel("Motivo de NA — Causalidade", { exact: true }).fill("");
  await page
    .getByLabel(
      "Conferi as oportunidades, ajudas, registros e motivos de NA desta missão.",
      { exact: true },
    )
    .check();
  assert.equal(await btn("Concluir missão e continuar").isDisabled(), true);
  await page
    .getByLabel("Motivo de NA — Causalidade", { exact: true })
    .fill("Recusa observada.");
  await page
    .getByLabel(
      "Conferi as oportunidades, ajudas, registros e motivos de NA desta missão.",
      { exact: true },
    )
    .check();
  assert.equal(await btn("Concluir missão e continuar").isEnabled(), true);
  await click("Reabrir etapa não avaliável");
  await click("Retomar");
  await page
    .getByLabel("Li a instrução e sei o que observar nesta etapa.", {
      exact: true,
    })
    .check();
  await click("Abrir estímulo desta etapa");
  await finishActivity(DIGITAL_BANDS[3].missions[2].steps[0].activity);
  await cause.getByRole("button", { name: "P", exact: true }).click();
  await page
    .getByLabel("Observação direta, fala e ajudas oferecidas", { exact: true })
    .fill("");
  await page
    .getByLabel(
      "Conferi as oportunidades, ajudas, registros e motivos de NA desta missão.",
      { exact: true },
    )
    .check();
  assert.equal(
    await btn("Concluir missão e continuar").isDisabled(),
    true,
    "P without the actual help is incomplete",
  );
  await page
    .getByLabel("Observação direta, fala e ajudas oferecidas", { exact: true })
    .fill("Exemplo sintético: respondeu após uma repetição da pergunta.");
  await page
    .getByLabel(
      "Conferi as oportunidades, ajudas, registros e motivos de NA desta missão.",
      { exact: true },
    )
    .check();
  assert.equal(await btn("Concluir missão e continuar").isEnabled(), true);
  await click("Revisar / encerrar");
  await page
    .getByRole("button", {
      name: `1. ${DIGITAL_BANDS[3].missions[0].title}`,
      exact: true,
    })
    .click();
  await click("Retomar");
  await page
    .getByLabel("Li a instrução e sei o que observar nesta etapa.", {
      exact: true,
    })
    .check();
  await click("Abrir estímulo desta etapa");
  await page.keyboard.press("Escape");
  await page.getByRole("dialog").waitFor({ state: "detached" });
  assert.equal(await btn("Abrir estímulo desta etapa").isDisabled(), true);
  await click("Revisar / encerrar");
  await page.evaluate(() =>
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async () => {
          throw new Error("denied for E2E");
        },
      },
    }),
  );
  await click("Copiar registro");
  assert.ok(
    await page.getByText("Não foi possível copiar.", { exact: false }).count(),
  );
  assert.equal(await btn("Copiado").count(), 0);
  await auditScreen("partial-report-mobile");
  await page.getByTestId("button-theme-toggle-mobile").click();
  await page.waitForFunction(() => document.documentElement.classList.contains("dark"));
  // Finish finite color transitions before measuring contrast in the final theme.
  // A screenshot with animations disabled advances CSS transitions to their end.
  await page.screenshot({
    path: `${artifactDir}/revisao-dark-mobile.png`,
    fullPage: true,
    animations: "disabled",
  });
  await auditScreen("partial-report-dark");
  assert.deepEqual(errors, []);
  assert.equal(stepsTested, 76);
  await writeFile(
    `${artifactDir}/a11y.json`,
    JSON.stringify(a11yResults, null, 2),
  );
  console.log(
    `PASS: ${stepsTested} etapas, 6 trilhas, exportações, controles móveis, ausência de dados do ensaio, pausa e série interrompida.`,
  );
} catch (error) {
  await page.screenshot({ path: `${artifactDir}/failure.png`, fullPage: true });
  throw error;
} finally {
  await context.close();
  await browser.close();
  await server.close();
}
