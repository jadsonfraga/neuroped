/**
 * Trava de uniformidade visual das superfícies internas do NeuroPED.
 *
 * Força um build local/offline para exercitar o conteúdo clínico real, percorre
 * arquétipos funcionais distintos em desktop e mobile e comprova que a camada
 * v15 atua como canvas de aplicativo sem ocultar controles ou invadir rotas
 * públicas. Nenhum dado clínico real é criado.
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
const outputDir = path.resolve(
  repoRoot,
  process.env.PREMIUM_INTERNAL_DIR || "artifacts/premium-v15",
);

fs.rmSync(outputDir, { recursive: true, force: true });
fs.mkdirSync(outputDir, { recursive: true });
// Evita reutilizar um bundle remoto deixado por outro job: as rotas abaixo
// precisam renderizar o workspace local completo, não apenas a tela de login.
fs.rmSync(path.resolve(repoRoot, "dist/public"), {
  recursive: true,
  force: true,
});

const dist = ensureClientBuild(repoRoot);
const server = await startStaticServer(dist, 0);
const executablePath =
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?.trim();
const browser = await chromium.launch(
  executablePath
    ? {
        executablePath,
        args: ["--no-sandbox", "--disable-dev-shm-usage"],
      }
    : undefined,
);

const archetypes = [
  { name: "agenda", route: "/agenda" },
  { name: "pacientes", route: "/pacientes" },
  { name: "laudo", route: "/laudo-neuroped" },
  { name: "escala", route: "/mchat" },
  { name: "calculadora", route: "/calculadora-dose" },
  { name: "biblioteca", route: "/biblioteca-instrumentos" },
];

const cases = [
  ...archetypes.map((item) => ({
    ...item,
    viewportName: "desktop",
    width: 1280,
    height: 900,
    theme: item.name === "biblioteca" ? "dark" : "light",
    hasTouch: false,
  })),
  ...archetypes.slice(0, 4).map((item) => ({
    ...item,
    viewportName: "mobile",
    width: 390,
    height: 844,
    theme: item.name === "escala" ? "dark" : "light",
    hasTouch: true,
  })),
];

const manifest = {
  generatedAt: new Date().toISOString(),
  commit: process.env.GITHUB_SHA || "local",
  source: "tests/e2e/premium-internal-workspace.mjs",
  captures: [],
};

function tokenForRoute(route) {
  if (route === "/") return "home";
  const firstSegment = route.split("/").filter(Boolean)[0] || "workspace";
  return (
    firstSegment
      .replace(/[^a-zA-Z0-9-]+/g, "-")
      .replace(/-+/g, "-") || "workspace"
  );
}

async function openRoute(page, route, theme) {
  await page.addInitScript(
    ({ storage, selectedTheme }) => {
      for (const [key, value] of Object.entries(storage)) {
        localStorage.setItem(key, value);
      }
      localStorage.setItem("neuroped:theme", selectedTheme);
    },
    { storage: ACCEPTED_FIRST_VISIT_STORAGE, selectedTheme: theme },
  );

  await page.goto(`${server.origin}/#${route}`, {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });
  await page
    .getByTestId("splash-screen")
    .waitFor({ state: "detached", timeout: 15000 })
    .catch(() => {});
  await page.locator(".np-app-content").waitFor({
    state: "visible",
    timeout: 25000,
  });
  await page.waitForFunction(
    ({ workspace, routeToken }) =>
      document.documentElement.dataset.npWorkspace === workspace &&
      document.documentElement.dataset.npRoute === routeToken,
    { workspace: "clinical", routeToken: tokenForRoute(route) },
    { timeout: 10000 },
  );
  await page.evaluate(async () => {
    await document.fonts?.ready;
    window.scrollTo(0, 0);
  });
}

async function auditCase(spec) {
  const context = await browser.newContext({
    viewport: { width: spec.width, height: spec.height },
    colorScheme: spec.theme,
    reducedMotion: "reduce",
    hasTouch: spec.hasTouch,
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  try {
    await openRoute(page, spec.route, spec.theme);

    const contract = await page.evaluate(() => {
      const root = document.documentElement;
      const content = document.querySelector(".np-app-content");
      const functionalRoot = document.querySelector(
        ".np-app-content > div:first-child",
      );
      const contextBar = document.querySelector("#main-content > .sticky");
      const pageHero = document.querySelector(".np-page-hero");
      const card = document.querySelector(".shadcn-card");
      const tablist = document.querySelector(
        '[role="tablist"]:not([aria-orientation="vertical"])',
      );
      const table = document.querySelector("table");
      const formControl = Array.from(
        document.querySelectorAll(
          'input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="file"]):not([type="hidden"]), textarea, select, [role="combobox"]',
        ),
      ).find((element) => {
        if (!(element instanceof HTMLElement)) return false;
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return (
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          rect.width > 0 &&
          rect.height > 0
        );
      });
      const mobileMenu = document.querySelector(
        '[data-testid="button-mobile-menu"]',
      );
      const mobileDock = document.querySelector(
        '[data-testid="mobile-primary-dock"]',
      );
      const sidebar = document.querySelector(
        'aside[aria-label="Menu de navegação"]',
      );
      const legal = document.querySelector(".np-legal-disclosure");

      const visible = (element) => {
        if (!(element instanceof HTMLElement)) return false;
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return (
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          rect.width > 0 &&
          rect.height > 0
        );
      };
      const geometry = (element) => {
        if (!(element instanceof HTMLElement)) return null;
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return {
          left: rect.left,
          right: rect.right,
          top: rect.top,
          bottom: rect.bottom,
          width: rect.width,
          height: rect.height,
          borderTopWidth: style.borderTopWidth,
          borderRadius: Number.parseFloat(style.borderTopLeftRadius),
          backgroundColor: style.backgroundColor,
          overflowX: style.overflowX,
          fontSize: Number.parseFloat(style.fontSize),
        };
      };

      const visibleTopLevel =
        functionalRoot instanceof HTMLElement
          ? Array.from(functionalRoot.children).filter(visible)
          : [];
      const interactiveCount = Array.from(
        document.querySelectorAll(
          ".np-app-content button, .np-app-content a[href], .np-app-content input, .np-app-content textarea, .np-app-content select, .np-app-content [role=button], .np-app-content [role=tab]",
        ),
      ).filter(visible).length;

      return {
        workspace: root.dataset.npWorkspace,
        route: root.dataset.npRoute,
        dark: root.classList.contains("dark"),
        hashPath: window.location.hash.replace(/^#/, "").split("?")[0],
        documentWidth: document.documentElement.scrollWidth,
        bodyWidth: document.body.scrollWidth,
        bodyText: document.body.innerText,
        content: geometry(content),
        functionalRoot: geometry(functionalRoot),
        firstSurface: geometry(visibleTopLevel[0]),
        visibleTopLevelCount: visibleTopLevel.length,
        interactiveCount,
        v15Radius: getComputedStyle(root)
          .getPropertyValue("--np-v15-radius-lg")
          .trim(),
        contextBar: geometry(contextBar),
        hero: geometry(pageHero),
        card: geometry(card),
        tablist: geometry(tablist),
        table: geometry(table),
        control: geometry(formControl),
        legalVisible: visible(legal),
        mobileMenuVisible: visible(mobileMenu),
        mobileDockVisible: visible(mobileDock),
        sidebarVisible: visible(sidebar),
        sidebarAriaHidden: sidebar?.getAttribute("aria-hidden") ?? null,
      };
    });

    const file = `${spec.name}-${spec.viewportName}-${spec.theme}.png`;
    await page.screenshot({
      path: path.join(outputDir, file),
      fullPage: true,
      animations: "disabled",
    });
    manifest.captures.push({ ...spec, file, contract });

    assert.equal(contract.workspace, "clinical", `${spec.name}: workspace incorreto`);
    assert.equal(
      contract.route,
      tokenForRoute(spec.route),
      `${spec.name}: token da rota não sincronizou`,
    );
    assert.equal(
      contract.hashPath,
      spec.route,
      `${spec.name}: navegador deixou a rota auditada`,
    );
    assert.equal(
      contract.dark,
      spec.theme === "dark",
      `${spec.name}: tema ${spec.theme} não foi aplicado`,
    );
    assert.ok(
      !/erro inesperado|application error|failed to render/i.test(contract.bodyText),
      `${spec.name}: erro fatal visível no módulo`,
    );
    assert.ok(
      contract.documentWidth <= spec.width + 1 &&
        contract.bodyWidth <= spec.width + 1,
      `${spec.name}: overflow horizontal no documento`,
    );
    assert.ok(contract.content, `${spec.name}: canvas principal ausente`);
    assert.equal(
      contract.content.borderTopWidth,
      "0px",
      `${spec.name}: moldura de site voltou ao canvas principal`,
    );
    assert.equal(
      contract.content.backgroundColor,
      "rgba(0, 0, 0, 0)",
      `${spec.name}: canvas principal deixou de ser transparente`,
    );
    assert.equal(
      contract.v15Radius,
      "1.2rem",
      `${spec.name}: tokens compartilhados da v15 não estão ativos`,
    );
    assert.ok(
      contract.functionalRoot && contract.visibleTopLevelCount > 0,
      `${spec.name}: módulo não renderizou estado funcional, vazio, carregando ou erro recuperável`,
    );
    assert.ok(
      contract.firstSurface &&
        contract.firstSurface.width > 0 &&
        contract.firstSurface.width <= contract.content.width + 1,
      `${spec.name}: primeira superfície saiu do canvas`,
    );
    assert.ok(
      contract.interactiveCount > 0,
      `${spec.name}: módulo perdeu todos os controles e destinos navegáveis`,
    );
    assert.ok(contract.contextBar, `${spec.name}: chrome clínico ausente`);
    assert.ok(
      contract.contextBar.height <= 64,
      `${spec.name}: faixa clínica alta demais (${contract.contextBar.height}px)`,
    );
    assert.equal(
      contract.legalVisible,
      true,
      `${spec.name}: aviso responsável foi removido`,
    );

    if (contract.hero) {
      assert.ok(
        contract.hero.borderRadius >= 14 && contract.hero.borderRadius <= 24,
        `${spec.name}: PageHero fora da geometria de aplicativo`,
      );
      assert.ok(
        contract.hero.width <= spec.width + 1,
        `${spec.name}: PageHero excedeu o viewport`,
      );
    }
    if (contract.card) {
      assert.ok(
        contract.card.borderRadius >= 14,
        `${spec.name}: card sem acabamento compartilhado`,
      );
    }
    if (contract.control) {
      assert.ok(
        contract.control.height >= 44,
        `${spec.name}: controle de formulário menor que 44 px`,
      );
    }
    if (contract.tablist) {
      assert.ok(
        contract.tablist.width <= contract.content.width + 1,
        `${spec.name}: tabs saíram do canvas`,
      );
    }
    if (contract.table) {
      assert.ok(contract.table.width > 0, `${spec.name}: tabela colapsou`);
    }

    if (spec.width < 1024) {
      assert.equal(
        contract.mobileMenuVisible,
        true,
        `${spec.name}: app bar mobile ausente`,
      );
      assert.equal(
        contract.mobileDockVisible,
        true,
        `${spec.name}: tab bar mobile ausente`,
      );
      assert.equal(
        contract.sidebarAriaHidden,
        "true",
        `${spec.name}: drawer deve iniciar fechado`,
      );
    } else {
      assert.equal(
        contract.mobileMenuVisible,
        false,
        `${spec.name}: menu mobile vazou para desktop`,
      );
      assert.equal(
        contract.mobileDockVisible,
        false,
        `${spec.name}: dock mobile vazou para desktop`,
      );
      assert.equal(
        contract.sidebarVisible,
        true,
        `${spec.name}: sidebar desktop ausente`,
      );
    }

    console.log(
      `[premium-internal-v15] ✓ ${spec.name} · ${spec.viewportName} · ${spec.theme}`,
    );
  } finally {
    await context.close();
  }
}

try {
  for (const spec of cases) await auditCase(spec);

  const publicContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
  });
  const publicPage = await publicContext.newPage();
  try {
    await publicPage.goto(`${server.origin}/#/familia`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await publicPage.waitForFunction(
      () =>
        document.documentElement.dataset.npWorkspace === "public" &&
        document.documentElement.dataset.npRoute === "familia",
      undefined,
      { timeout: 10000 },
    );
    assert.equal(
      await publicPage.evaluate(
        () => document.documentElement.dataset.npWorkspace,
      ),
      "public",
      "A camada interna invadiu a área pública",
    );
  } finally {
    await publicContext.close();
  }

  fs.writeFileSync(
    path.join(outputDir, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );
  console.log(
    `[premium-internal-v15] ✓ ${manifest.captures.length} capturas internas validadas; rota pública preservada.`,
  );
} finally {
  await browser.close();
  await server.close();
}
