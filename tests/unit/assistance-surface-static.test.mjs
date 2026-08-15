import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const floatingHelp = read("client/src/components/FloatingHelp.tsx");
const preferencesPanel = read("client/src/components/PreferencesPanel.tsx");
const welcomeTour = read("client/src/components/WelcomeTour.tsx");
const app = read("client/src/App.tsx");
const assistanceAudit = read("scripts/audit-assistance-states.mjs");

assert.equal(
  [...floatingHelp.matchAll(/data-testid="button-floating-help"/g)].length,
  1,
  "o shell deve expor exatamente um botão persistente de assistência",
);
assert.match(
  floatingHelp,
  /const OPEN_PREFERENCES_EVENT = "neuroped:open-preferences"/,
  "a ajuda única deve declarar o canal de preferências",
);
assert.match(
  floatingHelp,
  /openAuxiliarySurface\(OPEN_PREFERENCES_EVENT\)/,
  "preferências devem abrir a partir da ajuda única",
);
assert.match(
  floatingHelp,
  /data-testid="button-open-preferences"/,
  "a ação de preferências deve permanecer testável",
);
assert.match(
  preferencesPanel,
  /addEventListener\(OPEN_PREFERENCES_EVENT, openPreferences\)/,
  "o painel deve escutar o canal explícito do shell",
);
assert.match(
  preferencesPanel,
  /<Dialog open=\{open\} onOpenChange=\{setOpen\}>/,
  "preferências devem usar Dialog com foco, Escape e retorno de foco",
);
assert.match(
  preferencesPanel,
  /data-testid="preferences-panel"/,
  "o painel de preferências deve ser verificável no navegador",
);
assert.match(
  preferencesPanel,
  /aria-pressed=\{on\}/,
  "as preferências binárias devem anunciar estado assistivo",
);
assert.doesNotMatch(
  preferencesPanel,
  /fixed\s+bottom-4\s+left-4|<Settings\b|data-testid="button-preferences"/,
  "preferências não podem reintroduzir um FAB concorrente",
);
assert.doesNotMatch(
  welcomeTour,
  /data-testid="button-tour"/,
  "o tour não pode reintroduzir um segundo botão persistente",
);
assert.match(
  app,
  /<PreferencesPanel \/>/,
  "o receptor de preferências deve permanecer montado no aplicativo",
);
assert.match(
  assistanceAudit,
  /page\.locator\('\[role="dialog"\]\[aria-label="Tour guiado"\]'\)/,
  "a prova do tour deve usar o seletor estrutural estável",
);
assert.doesNotMatch(
  assistanceAudit,
  /getByRole\("dialog",\s*\{\s*name:\s*"Tour guiado"/,
  "a prova não pode depender de nome acessível sobrescrito por aria-labelledby",
);
assert.match(
  assistanceAudit,
  /\[hidden\], \[inert\], \[aria-hidden=\\"true\\"\], \[data-state=\\"closed\\"\]/,
  "a contagem de diálogos deve ignorar superfícies fechadas ou inertes",
);

console.log("[assistance-surface] ✓ ajuda, tour e preferências convergem em uma única superfície persistente.");
