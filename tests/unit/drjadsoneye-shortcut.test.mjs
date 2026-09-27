import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { transformSync } from "esbuild";
import { createElement, isValidElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const componentSource = readFileSync(
  new URL("../../client/src/components/DrJadsoneyeShortcut.tsx", import.meta.url),
  "utf8",
);
const layoutSource = readFileSync(
  new URL("../../client/src/components/Layout.tsx", import.meta.url),
  "utf8",
);

// Use the same automatic JSX runtime as Vite, without importing the whole app.
// Keep the temporary module under the repo so its package imports resolve.
const temporaryDirectory = mkdtempSync(
  join(dirname(fileURLToPath(import.meta.url)), ".drjadsoneye-test-"),
);
let DrJadsoneyeShortcut;
let DRJADSONEYE_URL;
try {
  const modulePath = join(temporaryDirectory, "shortcut.mjs");
  writeFileSync(
    modulePath,
    transformSync(componentSource, {
      loader: "tsx",
      jsx: "automatic",
      format: "esm",
      target: "es2022",
    }).code,
  );
  ({ DrJadsoneyeShortcut, DRJADSONEYE_URL } = await import(
    pathToFileURL(modulePath).href
  ));
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}

function getLink(collapsed, onNavigate) {
  const tree = DrJadsoneyeShortcut({ collapsed, onNavigate });
  assert.ok(isValidElement(tree));
  const link = tree.props.children;
  assert.ok(isValidElement(link));
  assert.equal(link.type, "a", "external navigation must remain a native anchor");
  return link;
}

test("DrJadsoneye has a fixed production HTTPS destination without clinical data", () => {
  assert.equal(DRJADSONEYE_URL, "https://drjadsoneye.lovable.app");
  const url = new URL(DRJADSONEYE_URL);
  assert.equal(url.protocol, "https:");
  assert.equal(url.hostname, "drjadsoneye.lovable.app");
  assert.equal(url.pathname, "/");
  assert.equal(url.search, "");
  assert.equal(url.hash, "");
  assert.equal(url.username, "");
  assert.equal(url.password, "");
  assert.equal(url.port, "");
});

for (const collapsed of [false, true]) {
  test(`DrJadsoneye renders a safe accessible link (collapsed=${collapsed})`, () => {
    const link = getLink(collapsed);
    assert.equal(link.props.href, DRJADSONEYE_URL);
    assert.equal(link.props.target, "_blank");
    assert.deepEqual(new Set(link.props.rel.split(/\s+/)), new Set(["noopener", "noreferrer"]));
    assert.equal(link.props.referrerPolicy, "no-referrer");
    assert.equal(link.props["aria-label"], "DrJadsoneye Aplicativo externo · pesquisa (abre em nova aba)");
    assert.match(link.props.title, /pesquisa.*nova aba/);
    assert.match(link.props.className, /min-h-\[44px\]/);
    assert.match(link.props.className, /focus-visible:ring-2/);
    assert.notEqual(link.props.tabIndex, -1);

    const html = renderToStaticMarkup(createElement(DrJadsoneyeShortcut, { collapsed }));
    assert.equal((html.match(/<a\b/g) ?? []).length, 1);
    assert.match(html, />DrJadsoneye<\/span>/);
    assert.match(html, /Aplicativo externo · pesquisa/);
    assert.doesNotMatch(html, /<iframe|<form|<script/);
    if (collapsed) {
      assert.match(html, /class="min-w-0 lg:hidden"/);
      assert.doesNotMatch(html, /class="min-w-0 hidden"/);
    }
  });

  test(`accessible name includes the entire rendered label and subtitle (collapsed=${collapsed})`, () => {
    const link = getLink(collapsed);
    const textContainer = link.props.children.find((child) => isValidElement(child) && child.type === "span");
    assert.ok(textContainer, "the visible label container remains present");
    const labelSpans = textContainer.props.children.filter(
      (child) => isValidElement(child) && child.type === "span",
    );
    assert.equal(labelSpans.length, 2, "label and subtitle must remain two separate spans");
    const visibleText = labelSpans.map((child) => child.props.children).join(" ").replace(/\s+/g, " ").trim();
    assert.equal(visibleText, "DrJadsoneye Aplicativo externo · pesquisa");
    assert.ok(link.props["aria-label"].includes(visibleText), "label-content-name-mismatch must not return when the mobile or expanded label is shown");
    assert.match(link.props["aria-label"], /abre em nova aba/);

    // The mismatch actually shipped to production came from here: JSX drops
    // whitespace-only text nodes between sibling tags on their own line, so
    // "DrJadsoneye" and "Aplicativo..." rendered glued together with no
    // separator in the real DOM, even though this test's own `.join(" ")`
    // above made it look fine. Assert the literal markup carries a real
    // space between the two spans, matching what Lighthouse/axe read.
    const html = renderToStaticMarkup(createElement(DrJadsoneyeShortcut, { collapsed }));
    assert.match(
      html,
      /DrJadsoneye<\/span> <span/,
      "a real whitespace text node must separate the label and subtitle spans in the rendered DOM",
    );
  });
}

test("the drawer callback does not cancel the native link or change its target", () => {
  let calls = 0;
  const onNavigate = () => { calls += 1; };
  const link = getLink(false, onNavigate);
  assert.equal(link.props.onClick, onNavigate);
  const event = {
    defaultPrevented: false,
    preventDefault() { this.defaultPrevented = true; },
  };
  link.props.onClick(event);
  assert.equal(calls, 1);
  assert.equal(event.defaultPrevented, false);
  assert.equal(link.props.href, DRJADSONEYE_URL);
  assert.equal(link.props.target, "_blank");
});

test("the shortcut never reads a patient/session or performs a background handoff", () => {
  assert.doesNotMatch(componentSource, /\b(?:localStorage|sessionStorage|useAuth|useLocation|fetch|XMLHttpRequest|postMessage|sendBeacon|getUserMedia)\b/);
  assert.doesNotMatch(componentSource, /window\.|document\.|<iframe|<Link\b|preventDefault\(/);
  assert.doesNotMatch(componentSource, /\.\.\./, "do not spread caller-controlled data onto the anchor");
});

test("the shortcut is mounted once in the shared desktop/mobile sidebar behind existing access policy", () => {
  const occurrences = [...layoutSource.matchAll(/<DrJadsoneyeShortcut\b/g)];
  assert.equal(occurrences.length, 1);
  const start = layoutSource.indexOf("{/* Sidebar */}");
  const end = layoutSource.indexOf("{/* Main content */}");
  assert.ok(start >= 0 && end > start);
  assert.ok(occurrences[0].index > start && occurrences[0].index < end);
  assert.match(layoutSource, /!isLoading && !IS_PUBLIC_ZONE && canRenderNavItem\("\/conecta"\) && \(\s*<DrJadsoneyeShortcut\s+collapsed=\{collapsed\}\s+onNavigate=\{\(\) => setMobileOpen\(false\)\}/);
  assert.match(layoutSource, /const canRenderNavItem = \(path: string\) =>\s*canRenderNavigationItem\(/);
});

test("mobile modal isolation and consultation content remain intact", () => {
  assert.match(layoutSource, /setInert\(mobileHeaderRef\.current, true\);\s*setInert\(mainContentRef\.current, true\);/);
  assert.match(layoutSource, /if \(!mobileOpen \|\| isDesktop\) \{[\s\S]*?setInert\(mainContentRef\.current, false\);/);
  assert.match(layoutSource, /if \(event\.key === "Escape"\) \{[\s\S]*?setMobileOpen\(false\);/);
  assert.match(layoutSource, /ref=\{routeContentRef\}[^>]*>\{children\}<\/div>/);
});
