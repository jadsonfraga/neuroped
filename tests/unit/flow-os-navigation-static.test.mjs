import assert from "node:assert/strict";
import fs from "node:fs";

const dock = fs.readFileSync("client/src/components/MobilePrimaryDock.tsx", "utf8");
const palette = fs.readFileSync("client/src/components/CommandPalette.tsx", "utf8");
const main = fs.readFileSync("client/src/main.tsx", "utf8");
const css = fs.readFileSync("client/src/styles/flow-os.css", "utf8");
const layout = fs.readFileSync("client/src/components/Layout.tsx", "utf8");
const legalGate = fs.readFileSync("client/src/components/AvisoLegalGate.tsx", "utf8");
const serviceWorkerManager = fs.readFileSync("client/src/components/ServiceWorkerManager.tsx", "utf8");
const shellCss = fs.readFileSync("client/src/styles/premium-app-shell-v12.css", "utf8");
const polishCss = fs.readFileSync("client/src/styles/premium-polish-10.css", "utf8");

for (const label of ["Início", "Pacientes", "Clínica", "Agenda", "Buscar"]) {
  assert.match(dock, new RegExp(`label: \\"${label}\\"`), `dock deve manter a ação ${label}`);
}

assert.match(dock, /IS_PUBLIC_ZONE/, "dock deve permanecer fora da zona pública");
for (const publicFlow of ["/familia", "/agendar", "/pre-consulta", "/pre-retorno", "/efeitos-colaterais"]) {
  assert.match(dock, new RegExp(publicFlow.replace("/", "\\/")), `dock não deve invadir o fluxo público ${publicFlow}`);
}
assert.match(dock, /safe-area-inset-bottom/, "dock deve respeitar safe area de iPhone");
assert.match(dock, /aria-label="Navegação principal"/, "dock deve ter landmark acessível");
assert.match(dock, /openCommandPalette\(\)/, "busca do dock deve abrir a paleta global");
assert.match(dock, /\/pacientes/, "dock deve dar acesso direto aos pacientes");
assert.match(dock, /\/filtro/, "dock deve dar acesso direto ao fluxo clínico");
assert.match(dock, /\/agenda/, "dock deve dar acesso direto à agenda");
assert.match(dock, /\bz-40\b/, "dock deve ficar abaixo de dialogs/paleta z-50");
assert.doesNotMatch(dock, /z-\[99970\]/, "dock não pode sobrepor dialogs e command palette");

assert.match(main, /<MobilePrimaryDock \/>/, "shell autorizado deve renderizar o dock");
assert.match(main, /\.\/styles\/flow-os\.css/, "shell deve carregar o contrato de espaçamento do Flow OS");
assert.match(css, /#main-content/, "conteúdo principal deve reservar espaço para o dock");
assert.match(css, /safe-area-inset-bottom/, "reserva do conteúdo deve considerar safe area");

// Sidebar fixa voltou a valer a partir de md (768px) a pedido do Dr. Jadson
// (2026-08-12): tablet retrato mantém a sidebar; drawer+dock só no celular.
assert.match(dock, /\bmd:hidden\b/, "dock deve encerrar no breakpoint md de 768px");
assert.match(layout, /matchMedia\("\(min-width: 768px\)"\)/, "shell React deve compartilhar o breakpoint md");
assert.match(layout, /document\.documentElement\.classList\.toggle\("np-mobile-drawer-open", drawerOpen\)/, "drawer deve travar o scroller raiz");
assert.match(layout, /document\.body\.classList\.toggle\("np-mobile-drawer-open", drawerOpen\)/, "drawer deve sinalizar isolamento do dock");
assert.doesNotMatch(layout, /document\.body\.style\.overflow/, "Layout não pode disputar lock inline com dialogs");
assert.doesNotMatch(layout, /window\.scrollTo/, "Layout não pode duplicar o reset de rota do AppRouter");
assert.match(legalGate, /document\.documentElement\.classList\.add\("np-legal-gate-open"\)/, "aviso deve travar o scroller raiz");
assert.match(legalGate, /document\.body\.classList\.add\("np-legal-gate-open"\)/, "aviso deve adquirir owner próprio");
assert.match(legalGate, /document\.documentElement\.classList\.remove\("np-legal-gate-open"\)/, "aviso deve liberar o root");
assert.match(legalGate, /document\.body\.classList\.remove\("np-legal-gate-open"\)/, "aviso deve liberar só o próprio owner");
assert.doesNotMatch(legalGate, /document\.body\.style\.overflow/, "aviso não pode restaurar lock inline alheio");
assert.match(serviceWorkerManager, /classList\.contains\("np-legal-gate-open"\)/, "watchdog deve preservar o aviso legítimo");
assert.match(
  css,
  /html\.np-mobile-drawer-open,\s*html\.np-legal-gate-open,\s*body\.np-mobile-drawer-open,\s*body\.np-legal-gate-open\s*\{\s*overflow:\s*hidden;/,
  "owners de drawer e aviso devem compor a trava sem restauração cruzada",
);
assert.match(
  polishCss,
  /html\s*\{[^}]*overscroll-behavior-y:\s*contain;/s,
  "overscroll deve pertencer ao document.scrollingElement",
);
assert.doesNotMatch(
  polishCss,
  /body\s*\{[^}]*overscroll-behavior-y:/s,
  "body não pode fingir ser o scroller raiz",
);
assert.match(css, /@media screen and \(max-width: 767px\)/, "contrato mobile deve valer apenas em tela");
assert.match(
  css,
  /body\.np-mobile-drawer-open \[data-testid="mobile-primary-dock"\][\s\S]*?display: none !important;/,
  "dock deve sair da árvore visual enquanto o drawer modal estiver aberto",
);
for (const [source, name] of [
  [css, "flow-os"],
  [shellCss, "premium-app-shell"],
  [polishCss, "premium-polish"],
]) {
  assert.doesNotMatch(
    source,
    /@media \(max-width: 1023px\)/,
    `${name} não pode aplicar regras de tela tablet durante impressão`,
  );
}

assert.match(palette, /queryKey: \["\/api\/patients"\]/, "busca global deve consultar pacientes reais");
assert.match(palette, /normalizedSearch\.length >= 2/, "pacientes só devem ser consultados após intenção de busca");
assert.match(palette, /enabled: patientSearchReady/, "consulta de pacientes deve ser condicional");
assert.match(palette, /IS_PUBLIC_ZONE/, "pacientes não devem ser consultados na zona pública");
assert.match(palette, /navigate\(`\/pacientes\/\$\{id\}`\)/, "resultado deve abrir o prontuário do paciente");
assert.match(palette, /Abrir prontuário longitudinal/, "resultado deve comunicar a ação clínica");
assert.doesNotMatch(palette, /localStorage.*patient/i, "paleta não deve persistir nomes de pacientes em recentes");

console.log("[flow-os] ✓ dock tablet, impressão, fronteira pública, stacking, busca clínica real e privacidade aprovados.");
