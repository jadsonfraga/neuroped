/** Browser test of the shipped Sonda UI. Synthetic login only; no clinical API
 * replacement inside the Sonda (it has none), no direct manipulation of React state.
 * Playwright's clock runs all timer ticks; fastForward is used only to simulate a
 * suspended browser and verify interrupted presentations fail closed.
 */
import assert from "node:assert/strict";
import { mkdir, readFile } from "node:fs/promises";
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
async function finishActivity(spec) {
  const dialog = page.getByRole("dialog");
  await dialog.waitFor();
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
    if (spec.target)
      await dialog
        .getByRole("button", { name: "Responder ao alvo", exact: true })
        .click();
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
  for (const [bandIndex, band] of DIGITAL_BANDS.entries()) {
    if (bandIndex > 0) {
      await click("Nova aplicação");
      await click("Apagar e começar outra");
    }
    await prepare(band);
    for (const [mi, mission] of band.missions.entries()) {
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
        await finishActivity(step.activity);
        stepsTested++;
        if (si < mission.steps.length - 1) await click("Próxima etapa");
      }
      for (const field of mission.fields) {
        const group = page
          .getByRole("group")
          .filter({
            has: page
              .locator("legend")
              .filter({
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
        if (field.kind === "count")
          await group.getByRole("spinbutton").fill("0");
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
    assert.doesNotMatch(
      report,
      /relação — sol para lua/,
      "Practice events must not leak into the report",
    );
    const download = page.waitForEvent("download");
    await click("Baixar registro");
    const file = await download;
    assert.equal(await readFile(await file.path(), "utf8"), report);
    console.log(
      `PASS ${band.id}: ${band.missions.length} missões, exportação fiel`,
    );
  }
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
  assert.deepEqual(errors, []);
  assert.equal(stepsTested, 76);
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
