import assert from "node:assert/strict";
import fs from "node:fs";

const dock = fs.readFileSync(
  "client/src/components/MobilePrimaryDock.tsx",
  "utf8",
);
const palette = fs.readFileSync(
  "client/src/components/CommandPalette.tsx",
  "utf8",
);
const app = fs.readFileSync("client/src/App.tsx", "utf8");
const main = fs.readFileSync("client/src/main.tsx", "utf8");
const css = fs.readFileSync("client/src/styles/flow-os.css", "utf8");
const layout = fs.readFileSync("client/src/components/Layout.tsx", "utf8");
const filterPage = [
  fs.readFileSync("client/src/pages/filtro.tsx", "utf8"),
  fs.readFileSync("client/src/pages/filtro-engine.tsx", "utf8"),
].join("\n");
const floatingHelp = fs.readFileSync(
  "client/src/components/FloatingHelp.tsx",
  "utf8",
);
const pageMascotDecor = fs.readFileSync(
  "client/src/components/PageMascotDecor.tsx",
  "utf8",
);
const welcomeTour = fs.readFileSync(
  "client/src/components/WelcomeTour.tsx",
  "utf8",
);
const toastPrimitive = fs.readFileSync(
  "client/src/components/ui/toast.tsx",
  "utf8",
);
const legalGate = fs.readFileSync(
  "client/src/components/AvisoLegalGate.tsx",
  "utf8",
);
const serviceWorkerManager = fs.readFileSync(
  "client/src/components/ServiceWorkerManager.tsx",
  "utf8",
);
const shellCss = fs.readFileSync(
  "client/src/styles/premium-app-shell-v12.css",
  "utf8",
);
const polishCss = fs.readFileSync(
  "client/src/styles/premium-polish-10.css",
  "utf8",
);

for (const label of ["Início", "Pacientes", "Clínica", "Agenda"]) {
  assert.match(
    dock,
    new RegExp(`label: \\"${label}\\"`),
    `dock deve manter a ação ${label}`,
  );
}

assert.match(
  dock,
  /IS_PUBLIC_ZONE/,
  "dock deve permanecer fora da zona pública",
);
for (const publicFlow of [
  "/familia",
  "/agendar",
  "/pre-consulta",
  "/pre-retorno",
  "/efeitos-colaterais",
]) {
  assert.match(
    dock,
    new RegExp(publicFlow.replace("/", "\\/")),
    `dock não deve invadir o fluxo público ${publicFlow}`,
  );
}
assert.match(
  dock,
  /safe-area-inset-bottom/,
  "dock deve respeitar safe area de iPhone",
);
assert.match(
  dock,
  /aria-label="Navegação principal"/,
  "dock deve ter landmark acessível",
);
assert.match(
  palette,
  /COMMAND_PALETTE_OPEN_EVENT|open-command/,
  "paleta global deve manter o contrato de abertura por evento",
);
assert.match(dock, /\/pacientes/, "dock deve dar acesso direto aos pacientes");
assert.match(dock, /\/filtro/, "dock deve dar acesso direto ao fluxo clínico");
assert.match(dock, /\/agenda/, "dock deve dar acesso direto à agenda");
assert.match(dock, /\bz-40\b/, "dock deve ficar abaixo de dialogs/paleta z-50");
assert.doesNotMatch(
  dock,
  /z-\[99970\]/,
  "dock não pode sobrepor dialogs e command palette",
);
assert.match(
  dock,
  /path === "\/pacientes" \|\| path\.startsWith\("\/paciente\/"\)/,
  "detalhe singular deve manter Pacientes como destino ativo",
);
assert.match(
  dock,
  /path\.startsWith\("\/cognitive-lab\/"\)/,
  "runner cronometrado deve ocultar o dock sem ocultar o hub",
);
assert.doesNotMatch(
  dock,
  /\/cognitive-task/,
  "dock não pode depender da rota cognitiva removida",
);

assert.match(
  app,
  /<MobilePrimaryDock \/>/,
  "shell autorizado deve renderizar o dock na composição principal",
);
assert.match(
  main,
  /\.\/styles\/flow-os\.css/,
  "shell deve carregar o contrato de espaçamento do Flow OS",
);
assert.match(
  css,
  /#main-content/,
  "conteúdo principal deve reservar espaço para o dock",
);
assert.match(
  css,
  /safe-area-inset-bottom/,
  "reserva do conteúdo deve considerar safe area",
);

// O shell compacto vai até 1023px: tablets ganham drawer + dock e preservam
// largura útil. A sidebar fixa entra apenas em desktop (>=1024px).
assert.match(
  dock,
  /\blg:hidden\b/,
  "dock deve encerrar apenas no breakpoint desktop de 1024px",
);
assert.match(
  layout,
  /matchMedia\("\(min-width: 1024px\)"\)/,
  "shell React deve compartilhar o breakpoint desktop de 1024px",
);
assert.match(
  layout,
  /document\.documentElement\.classList\.toggle\("np-mobile-drawer-open", drawerOpen\)/,
  "drawer deve travar o scroller raiz",
);
assert.match(
  layout,
  /document\.body\.classList\.toggle\("np-mobile-drawer-open", drawerOpen\)/,
  "drawer deve sinalizar isolamento do dock",
);
assert.doesNotMatch(
  layout,
  /document\.body\.style\.overflow/,
  "Layout não pode disputar lock inline com dialogs",
);
assert.doesNotMatch(
  layout,
  /window\.scrollTo/,
  "Layout não pode duplicar o reset de rota do AppRouter",
);
assert.doesNotMatch(
  filterPage,
  /scrollIntoView\(/,
  "filtro não pode tirar foco ou pular controles quando os resultados aparecem",
);
assert.doesNotMatch(
  filterPage,
  /resultsSectionRef/,
  "filtro não deve manter âncora de auto-scroll obsoleta",
);
assert.doesNotMatch(
  filterPage,
  /PIN master/,
  "filtro não deve prometer um gate de PIN desativado",
);
assert.match(
  filterPage,
  /encaminha para a fonte oficial/,
  "licença deve indicar a alternativa real disponível",
);
assert.match(
  app,
  /useState\(hasAcceptedLegalNotice\)/,
  "shell deve iniciar pelo aceite legal persistido",
);
assert.match(
  app,
  /const onboardingVisible =\s*splashComplete && legalAccepted && showOnboarding && isRootRoute/,
  "onboarding só pode montar depois do aceite legal e apenas na home",
);
assert.match(
  app,
  /currentPath === "\/" && getCurrentHashPath\(\) === "\/"/,
  "a rota real deve impedir o onboarding de cobrir uma navegação recém-iniciada",
);
assert.match(
  app,
  /window\.addEventListener\("hashchange", syncCurrentPath\)/,
  "o shell deve acompanhar mudanças de rota fora do Router",
);
assert.match(
  app,
  /const auxiliarySurfacesVisible =\s*splashComplete && legalAccepted && !onboardingVisible/,
  "paleta, tour e superfícies auxiliares devem aguardar aviso e onboarding visível",
);
assert.match(
  app,
  /useState\(shouldShowOnboarding\)/,
  "onboarding deve iniciar bloqueado sem flash das superfícies auxiliares",
);
for (const surface of ["CommandPalette", "WelcomeTour"]) {
  assert.match(
    app,
    new RegExp(
      `auxiliarySurfacesVisible && \\(\\s*<Suspense[\\s\\S]{0,120}<${surface} \\/>`,
    ),
    `${surface} não pode competir com o aviso legal nem com o onboarding`,
  );
}
assert.doesNotMatch(
  app,
  /<PrivateGate>[\s\S]{0,180}<CommandPalette \/>/,
  "PrivateGate sozinho não basta para liberar a paleta antes do aceite",
);
assert.match(
  app,
  /<AvisoLegalGate\s+onAccepted=\{\(\) => setLegalAccepted\(true\)\}\s*\/>/,
  "aceite deve liberar o shell na mesma sessão",
);
for (const surface of ["InstallPrompt", "PreferencesPanel", "FloatingHelp"]) {
  assert.match(
    app,
    new RegExp(`auxiliarySurfacesVisible && \\([\\s\\S]*?<${surface} \\/>`),
    `${surface} não pode competir com o aviso legal nem com o onboarding`,
  );
}
const openTerms = legalGate.match(/function abrirTermos[\s\S]*?\n  }/)?.[0];
assert.ok(openTerms, "link de termos deve ter navegação explícita");
assert.ok(
  openTerms.indexOf('window.location.hash = "#/termos"') <
    openTerms.indexOf("aceitar();"),
  "a rota de termos deve mudar antes de liberar o onboarding",
);
assert.equal(
  (main.match(/localStorage\.removeItem\("np_filtro_state_v1"\)/g) ?? [])
    .length,
  1,
  "startup deve executar uma única sanitização do estado clínico legado",
);
assert.match(
  legalGate,
  /document\.documentElement\.classList\.add\("np-legal-gate-open"\)/,
  "aviso deve travar o scroller raiz",
);
assert.match(
  legalGate,
  /document\.body\.classList\.add\("np-legal-gate-open"\)/,
  "aviso deve adquirir owner próprio",
);
assert.match(
  legalGate,
  /document\.documentElement\.classList\.remove\("np-legal-gate-open"\)/,
  "aviso deve liberar o root",
);
assert.match(
  legalGate,
  /document\.body\.classList\.remove\("np-legal-gate-open"\)/,
  "aviso deve liberar só o próprio owner",
);
assert.doesNotMatch(
  legalGate,
  /document\.body\.style\.overflow/,
  "aviso não pode restaurar lock inline alheio",
);
assert.match(
  legalGate,
  /max-h-\[calc\(100dvh-2rem\)\]/,
  "aviso deve caber em viewports de pouca altura",
);
assert.match(
  legalGate,
  /overflow-y-auto/,
  "conteúdo do aviso deve permanecer rolável",
);
assert.match(
  legalGate,
  /acceptButtonRef\.current\?\.focus\(\)/,
  "aceite deve receber foco inicial",
);
assert.match(
  legalGate,
  /event\.key !== "Tab"/,
  "aviso deve implementar contenção de Tab",
);
assert.match(
  legalGate,
  /last\.focus\(\)/,
  "Shift+Tab deve circular para o último controle",
);
assert.match(
  legalGate,
  /first\.focus\(\)/,
  "Tab deve circular para o primeiro controle",
);
assert.match(
  legalGate,
  /previouslyFocused\?\.focus\(\)/,
  "aviso deve devolver o foco ao fechar",
);
assert.match(
  legalGate,
  /onAccepted\?\.\(\)/,
  "aviso deve notificar o shell após persistir o aceite",
);
assert.match(
  serviceWorkerManager,
  /aria-labelledby="aviso-legal-title"/,
  "watchdog deve exigir um aviso legal vivo antes de preservar seu owner",
);
assert.match(
  serviceWorkerManager,
  /classList\.remove\(owner\.className\)/,
  "watchdog deve remover classes de owner sem overlay vivo",
);
assert.match(
  serviceWorkerManager,
  /\[role="dialog"\]\[data-state="open"\]/,
  "watchdog deve preservar um dialog Radix realmente aberto",
);
assert.match(
  serviceWorkerManager,
  /dataset\.state === "closed"/,
  "watchdog deve ignorar overlays fechados ainda montados",
);
assert.match(
  serviceWorkerManager,
  /style\.display !== "none"/,
  "watchdog deve ignorar overlays com display none",
);
assert.match(
  serviceWorkerManager,
  /style\.visibility !== "hidden"/,
  "watchdog deve ignorar overlays com visibility hidden",
);
assert.match(
  serviceWorkerManager,
  /getClientRects\(\)\.length > 0/,
  "watchdog deve exigir geometria visível do overlay",
);
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
assert.match(
  css,
  /@media screen and \(max-width: 1023px\)/,
  "contrato compacto deve valer em celular e tablet, apenas em tela",
);
assert.match(
  css,
  /body\.np-mobile-drawer-open \[data-testid="mobile-primary-dock"\][\s\S]*?display: none !important;/,
  "dock deve sair da árvore visual enquanto o drawer modal estiver aberto",
);
assert.match(
  css,
  /\[data-testid="button-floating-help"\][\s\S]*?bottom:\s*calc\(6\.65rem \+ env\(safe-area-inset-bottom\)\)/,
  "ajuda flutuante única deve ficar acima do dock no shell compacto",
);
assert.match(
  floatingHelp,
  /bottom-6/,
  "ajuda deve ter posição-base única fora do shell compacto",
);
assert.match(
  floatingHelp,
  /dispatchEvent\(new Event\(eventName\)\)/,
  "o helper de assistência deve despachar o evento recebido explicitamente",
);
assert.match(
  floatingHelp,
  /openAuxiliarySurface\(OPEN_TOUR_EVENT\)/,
  "a ajuda única deve abrir o tour pelo helper compartilhado",
);
assert.match(
  floatingHelp,
  /openAuxiliarySurface\(OPEN_PREFERENCES_EVENT\)/,
  "a ajuda única deve abrir preferências pelo helper compartilhado",
);
assert.match(
  floatingHelp,
  /data-testid="button-start-tour"/,
  "o diálogo de ajuda deve expor a ação de tour testável",
);
assert.match(
  welcomeTour,
  /addEventListener\("neuroped:open-tour", openTour\)/,
  "o tour deve escutar a ação da ajuda única",
);
assert.doesNotMatch(
  welcomeTour,
  /data-testid="button-tour"/,
  "o tour não pode manter um segundo botão flutuante persistente",
);
assert.match(
  pageMascotDecor,
  /routesWithInlineNino = \["\/", "\/filtro", "\/filtro-escalas", "\/prontuario"\]/,
  "prontuário deve bloquear mascote fixo sobre o cabeçalho",
);
assert.match(
  pageMascotDecor,
  /const denseClinicalWorkspace = isDenseClinicalWorkspace\(pathname\)/,
  "workspaces densos devem ter política explícita de silêncio visual",
);
assert.match(
  pageMascotDecor,
  /const showLegacyCameo = pathname === "\/sobre" \|\| pathname === "\/sobre-neuroped"/,
  "acervo histórico deve ficar restrito às páginas institucionais",
);
assert.match(
  css,
  /\[data-radix-toast-viewport\][\s\S]*?top:\s*auto !important;[\s\S]*?pointer-events:\s*none !important;/,
  "viewport de toast não pode ocupar nem capturar a tela entre o topo e o dock",
);
assert.match(
  toastPrimitive,
  /pointer-events-none fixed top-0/,
  "viewport de toast deve ser transparente a cliques",
);
assert.match(
  toastPrimitive,
  /data-radix-toast-viewport=""/,
  "viewport deve expor o seletor usado pelo contrato de posicionamento mobile",
);
assert.match(
  toastPrimitive,
  /group pointer-events-auto/,
  "o próprio toast deve continuar interativo",
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

assert.match(
  palette,
  /\/api\/patients\?q=\$\{encodeURIComponent\(normalizedSearch\)\}&page=1&limit=20/,
  "busca global deve consultar pacientes reais com busca parametrizada e paginação limitada",
);
assert.match(
  palette,
  /normalizedSearch\.length >= 2/,
  "pacientes só devem ser consultados após intenção de busca",
);
assert.match(
  palette,
  /enabled: patientSearchReady/,
  "consulta de pacientes deve ser condicional",
);
assert.match(
  palette,
  /IS_PUBLIC_ZONE/,
  "pacientes não devem ser consultados na zona pública",
);
assert.match(
  app,
  /<Route path="\/paciente\/:id"/,
  "roteador deve declarar o detalhe singular do paciente",
);
assert.match(
  palette,
  /navigate\(`\/paciente\/\$\{encodeURIComponent\(id\)\}`\)/,
  "resultado deve abrir a rota singular registrada e codificar o identificador",
);
assert.doesNotMatch(
  palette,
  /navigate\(`\/pacientes\/\$\{id\}`\)/,
  "teste não pode aceitar novamente a rota plural inexistente",
);
assert.match(
  palette,
  /Abrir prontuário longitudinal/,
  "resultado deve comunicar a ação clínica",
);
assert.doesNotMatch(
  palette,
  /localStorage.*patient/i,
  "paleta não deve persistir nomes de pacientes em recentes",
);

console.log(
  "[flow-os] ✓ shell compacto, ajuda única, impressão, fronteira pública, stacking, busca clínica real e privacidade aprovados.",
);
