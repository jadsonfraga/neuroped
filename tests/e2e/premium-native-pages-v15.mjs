/**
 * Prova por arquétipos das páginas internas do NeuroPED.
 *
 * Valida invariantes de produto em navegador real: shell de app, ausência de
 * overflow, títulos operacionais, PageHero compacto, controles legíveis,
 * touch real e rotas preservadas.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import {
  ACCEPTED_FIRST_VISIT_STORAGE,
  ensureClientBuild,
  startStaticServer,
} from "../../scripts/lib/browser-audit-runtime.mjs";

const repoRoot = process.cwd();
const outputDir = path.resolve(repoRoot, "artifacts/premium-v15");
fs.rmSync(outputDir, { recursive: true, force: true });
fs.mkdirSync(outputDir, { recursive: true });

const dist = ensureClientBuild(repoRoot);
const server = await startStaticServer(dist, 0);
const browser = await chromium.launch();

const archetypes = [
  { key: "patients", route: "/pacientes" },
  { key: "agenda", route: "/agenda" },
  { key: "filter", route: "/filtro" },
  { key: "library", route: "/biblioteca-instrumentos" },
  { key: "documents", route: "/laudo-neuroped" },
  { key: "scale", route: "/mchat" },
];

const viewports = [
  { key: "desktop", width: 1440, height: 1000, hasTouch: false },
  { key: "tablet", width: 1024, height: 1366, hasTouch: true },
  { key: "mobile", width: 390, height: 844, hasTouch: true },
];

const manifest = {
  generatedAt: new Date().toISOString(),
  commit: process.env.GITHUB_SHA || "local",
  source: "tests/e2e/premium-native-pages-v15.mjs",
  captures: [],
};

try {
  for (const viewport of viewports) {
    for (const archetype of archetypes) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        hasTouch: viewport.hasTouch,
        reducedMotion: "reduce",
        colorScheme: "light",
        deviceScaleFactor: 1,
      });
      const page = await context.newPage();
      const pageErrors = [];
      page.on("pageerror", (error) => pageErrors.push(String(error)));

      await page.addInitScript((storage) => {
        for (const [key, value] of Object.entries(storage)) {
          localStorage.setItem(key, value);
        }
        localStorage.setItem("neuroped:theme", "light");
      }, ACCEPTED_FIRST_VISIT_STORAGE);

      try {
        await page.goto(`${server.origin}/#${archetype.route}`, {
          waitUntil: "domcontentloaded",
          timeout: 30000,
        });
        await page
          .getByTestId("splash-screen")
          .waitFor({ state: "detached", timeout: 15000 })
          .catch(() => {});
        await page.locator("#main-content").waitFor({
          state: "visible",
          timeout: 20000,
        });
        await page.waitForTimeout(350);
        await page.evaluate(async () => {
          await document.fonts?.ready;
          window.scrollTo(0, 0);
        });

        const contract = await page.evaluate(
          ({ expectedRoute }) => {
            const visible = (element) => {
              if (!(element instanceof HTMLElement)) return false;
              const style = getComputedStyle(element);
              const rect = element.getBoundingClientRect();
              return (
                style.display !== "none" &&
                style.visibility !== "hidden" &&
                Number(style.opacity || "1") > 0 &&
                rect.width > 0 &&
                rect.height > 0
              );
            };
            const rect = (element) => {
              if (!(element instanceof HTMLElement)) return null;
              const value = element.getBoundingClientRect();
              return {
                left: value.left,
                right: value.right,
                top: value.top,
                bottom: value.bottom,
                width: value.width,
                height: value.height,
              };
            };

            const main = document.querySelector("#main-content");
            const sidebar = document.querySelector(
              'aside[aria-label="Menu de navegação"]',
            );
            const mobileMenu = document.querySelector(
              '[data-testid="button-mobile-menu"]',
            );
            const dock = document.querySelector(
              '[data-testid="mobile-primary-dock"]',
            );
            const pageHero = main?.querySelector(".np-page-hero");
            const headings = Array.from(main?.querySelectorAll("h1") || []).filter(
              visible,
            );
            const firstHeading = headings[0];
            const controls = Array.from(
              main?.querySelectorAll(
                'input:not([type="checkbox"]):not([type="radio"]):not([type="range"]), textarea, select, [role="combobox"]',
              ) || [],
            )
              .filter(visible)
              .slice(0, 12)
              .map((element) => ({
                tag: element.tagName.toLowerCase(),
                height: element.getBoundingClientRect().height,
                fontSize: Number.parseFloat(getComputedStyle(element).fontSize),
              }));

            const hashPath = window.location.hash.replace(/^#/, "").split("?")[0];
            const bodyText = document.body.innerText.replace(/\s+/g, " ").trim();
            const titleSize =
              firstHeading instanceof HTMLElement
                ? Number.parseFloat(getComputedStyle(firstHeading).fontSize)
                : 0;

            return {
              expectedRoute,
              hashPath,
              documentWidth: document.documentElement.scrollWidth,
              bodyWidth: document.body.scrollWidth,
              mainVisible: visible(main),
              sidebarVisible: visible(sidebar),
              sidebarAriaHidden: sidebar?.getAttribute("aria-hidden") ?? null,
              mobileMenuVisible: visible(mobileMenu),
              dockVisible: visible(dock),
              pageHero: rect(pageHero),
              titleCount: headings.length,
              titleSize,
              controls,
              bodyTextLength: bodyText.length,
              notFound: /página não encontrada|page not found/i.test(bodyText),
              forbidden: /acesso negado|forbidden/i.test(bodyText),
              login: /entrar no neuroped|iniciar sessão/i.test(bodyText),
            };
          },
          { expectedRoute: archetype.route },
        );

        assert.equal(
          contract.mainVisible,
          true,
          `${viewport.key}/${archetype.key}: shell principal invisível`,
        );
        assert.ok(
          contract.hashPath === archetype.route ||
            contract.hashPath.startsWith(`${archetype.route}/`),
          `${viewport.key}/${archetype.key}: rota desviou para ${contract.hashPath}`,
        );
        assert.equal(
          contract.notFound,
          false,
          `${viewport.key}/${archetype.key}: página não encontrada`,
        );
        assert.equal(
          contract.forbidden,
          false,
          `${viewport.key}/${archetype.key}: acesso indevidamente negado`,
        );
        assert.equal(
          contract.login,
          false,
          `${viewport.key}/${archetype.key}: fluxo local desviou ao login`,
        );
        assert.ok(
          contract.bodyTextLength >= 40,
          `${viewport.key}/${archetype.key}: conteúdo interno vazio`,
        );
        assert.ok(
          contract.documentWidth <= viewport.width + 2,
          `${viewport.key}/${archetype.key}: overflow horizontal no documento (${contract.documentWidth}px)`,
        );
        assert.ok(
          contract.bodyWidth <= viewport.width + 2,
          `${viewport.key}/${archetype.key}: overflow horizontal no body (${contract.bodyWidth}px)`,
        );
        assert.ok(
          pageErrors.length === 0,
          `${viewport.key}/${archetype.key}: erro de página: ${pageErrors.join(" | ")}`,
        );

        if (contract.titleCount > 0) {
          const titleCeiling = viewport.width <= 767 ? 40 : 48;
          assert.ok(
            contract.titleSize <= titleCeiling,
            `${viewport.key}/${archetype.key}: título voltou a escala de landing page (${contract.titleSize}px)`,
          );
        }

        if (contract.pageHero) {
          const heroCeiling = viewport.width <= 767 ? 300 : 360;
          assert.ok(
            contract.pageHero.height <= heroCeiling,
            `${viewport.key}/${archetype.key}: PageHero excessivamente alto (${contract.pageHero.height}px)`,
          );
          assert.ok(
            contract.pageHero.left >= -1 &&
              contract.pageHero.right <= viewport.width + 1,
            `${viewport.key}/${archetype.key}: PageHero saiu do viewport`,
          );
        }

        for (const control of contract.controls) {
          assert.ok(
            control.height >= 40,
            `${viewport.key}/${archetype.key}: ${control.tag} abaixo de 40 px (${control.height}px)`,
          );
          if (viewport.hasTouch) {
            assert.ok(
              control.fontSize >= 16,
              `${viewport.key}/${archetype.key}: ${control.tag} pode provocar zoom no iOS (${control.fontSize}px)`,
            );
          }
        }

        if (viewport.width < 1024) {
          assert.equal(
            contract.mobileMenuVisible,
            true,
            `${viewport.key}/${archetype.key}: menu mobile ausente`,
          );
          assert.equal(
            contract.dockVisible,
            true,
            `${viewport.key}/${archetype.key}: tab bar mobile ausente`,
          );
          assert.equal(
            contract.sidebarAriaHidden,
            "true",
            `${viewport.key}/${archetype.key}: drawer deve iniciar fechado`,
          );
        } else {
          assert.equal(
            contract.sidebarVisible,
            true,
            `${viewport.key}/${archetype.key}: sidebar desktop ausente`,
          );
        }

        const fileName = `${viewport.key}-${archetype.key}.png`;
        await page.screenshot({
          path: path.join(outputDir, fileName),
          fullPage: true,
          animations: "disabled",
        });

        manifest.captures.push({
          viewport,
          archetype,
          file: fileName,
          contract,
        });
        console.log(`[premium-native-pages-v15] ✓ ${viewport.key}/${archetype.key}`);
      } finally {
        await context.close();
      }
    }
  }

  fs.writeFileSync(
    path.join(outputDir, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );
  console.log(
    `[premium-native-pages-v15] ✓ ${manifest.captures.length} arquétipos capturados`,
  );
} finally {
  await browser.close();
  await server.close();
}
