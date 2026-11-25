import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";
import {
  ACCEPTED_FIRST_VISIT_STORAGE,
  auditBrowserLaunchOptions,
  ensureClientBuild,
  startStaticServer,
} from "../../scripts/lib/browser-audit-runtime.mjs";
import {
  createSyntheticClinicalApi,
  SYNTHETIC_CREDENTIALS,
} from "../../scripts/lib/synthetic-clinical-api.mjs";

const captures = process.env.NEUROPED_VISUAL_CAPTURES;
if (captures) mkdirSync(captures, { recursive: true });

const dist = ensureClientBuild(process.cwd(), "authenticated");
const server = await startStaticServer(dist, { port: 4630, apiHandler: createSyntheticClinicalApi() });
let browser;
try {
  const signed = await fetch(`${server.origin}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(SYNTHETIC_CREDENTIALS),
  });
  assert.equal(signed.status, 200);
  const session = await signed.json();
  browser = await chromium.launch(auditBrowserLaunchOptions());

  for (const [width, height] of [[390, 844], [820, 1180], [1440, 900]]) {
    for (const theme of ["light", "dark"]) {
      const context = await browser.newContext({
        viewport: { width, height }, colorScheme: theme,
        reducedMotion: width === 1440 ? "no-preference" : "reduce",
        hasTouch: width < 1024,
      });
      try {
        await context.addInitScript(({ storage, theme, session }) => {
          for (const [key, value] of Object.entries(storage)) localStorage.setItem(key, value);
          localStorage.setItem("neuroped:theme", theme);
          sessionStorage.setItem("neuroped:access", session.accessToken);
          sessionStorage.setItem("neuroped:refresh", session.refreshToken);
          sessionStorage.setItem("neuroped:user", JSON.stringify(session.user));
          const Original = window.AudioContext;
          window.__interfaceNotes = 0;
          window.AudioContext = class extends Original {
            createOscillator() {
              window.__interfaceNotes += 1;
              return super.createOscillator();
            }
          };
        }, { storage: ACCEPTED_FIRST_VISIT_STORAGE, theme, session });
        const page = await context.newPage();
        page.setDefaultTimeout(12_000);
        const runtimeErrors = [];
        page.on("pageerror", (err) => runtimeErrors.push(err.message));
        await page.goto(`${server.origin}/#/`);
        await page.getByTestId("cockpit-context").waitFor();
        const main = page.locator(".np-app-shell");
        const route = page.locator(".np-route-in");
        assert.match(await main.evaluate(el => getComputedStyle(el).backgroundImage), /linear-gradient/);
        if (width === 1440) {
          await page.addStyleTag({ content: ".np-route-in { animation-duration: 20s !important; }" });
          const minOpacity = await route.evaluate(el => {
            const animation = el.getAnimations().find(a => a.animationName === "np-route-enter");
            return animation && Math.min(...animation.effect.getKeyframes().map(k => Number(k.opacity)));
          });
          assert.ok(minOpacity >= 0.9, "o conteúdo é legível desde o quadro inicial");
          await page.evaluate(() => document.querySelector(".np-route-in").getAnimations().forEach(a => a.finish()));
          await page.keyboard.press("Tab");
          const sidebarControl = page.getByTestId("button-command-palette");
          await sidebarControl.focus();
          assert.equal(await sidebarControl.evaluate(el => getComputedStyle(el).outlineWidth), "2px");
        } else {
          assert.equal(await route.evaluate(el => getComputedStyle(el).animationName), "none");
        }
        const viewportFits = () => document.documentElement.scrollWidth <= innerWidth + 1;
        assert.ok(await page.evaluate(viewportFits), "shell não deve causar overflow lateral");
        if (captures) await page.screenshot({ path: join(captures, `neuroPed-${width}-${theme}-inicio.png`), animations: "disabled" });
        const toggle = page.getByTestId(width === 1440 ? "button-sound-toggle" : "button-sound-toggle-mobile");
        assert.equal(await toggle.getAttribute("aria-pressed"), "false");
        await page.getByTestId("button-floating-help").click();
        assert.equal(await page.evaluate(() => window.__interfaceNotes), 0, "gesto sem opt-in não usa áudio");
        await page.getByTestId("button-open-preferences").click();
        const preferences = page.getByTestId("preferences-panel");
        await preferences.waitFor();
        const soundPreference = preferences.getByRole("button", { name: /Sons da interface/ });
        const sample = preferences.getByRole("button", { name: "Ouvir amostra" });
        assert.ok(await sample.isDisabled());
        await soundPreference.click();
        const enableNotes = await page.evaluate(() => window.__interfaceNotes);
        assert.equal(enableNotes, 1, "ouvir apenas um toque ao habilitar");
        await sample.click();
        assert.equal(await page.evaluate(() => window.__interfaceNotes), enableNotes + 1);
        const slider = preferences.getByTestId("range-sound-volume");
        await slider.focus();
        await slider.press("Home");
        assert.ok(await sample.isDisabled(), "volume zero bloqueia amostra");
        await slider.press("End");
        assert.ok(await sample.isEnabled());
        if (captures) await page.screenshot({ path: join(captures, `neuroPed-${width}-${theme}-preferencias.png`), animations: "disabled" });
        await page.keyboard.press("Escape");
        await preferences.waitFor({ state: "hidden" });
        if (width === 1440) {
          await page.getByTestId("button-command-palette").hover();
        }
        const notesBeforeNavigation = await page.evaluate(() => window.__interfaceNotes);
        assert.equal(notesBeforeNavigation, enableNotes + 1, "passar o cursor sem clicar não toca som");
        await page.evaluate(() => { location.hash = "#/filtro"; });
        await page.waitForURL("**/#/filtro");
        await page.locator(".container-filtro").waitFor();
        await page.waitForTimeout(300);
        assert.equal(await page.evaluate(() => window.__interfaceNotes), notesBeforeNavigation, "rota não emite som passivo");
        assert.equal(await page.getByTestId(width === 1440 ? "button-sound-toggle" : "button-sound-toggle-mobile").getAttribute("aria-pressed"), "true");
        assert.ok(await page.evaluate(viewportFits), "filtro não deve causar overflow lateral");
        assert.deepEqual(runtimeErrors, []);
        console.log(`✓ shell e preferências: ${width}px / ${theme}`);
      } finally {
        await context.close();
      }
    }
  }
} finally {
  await browser?.close();
  await server.close();
}
