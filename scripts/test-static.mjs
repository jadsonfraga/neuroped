import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';

const root = process.cwd();
const failures = [];
const warnings = [];
const oks = [];

function file(path) {
  const full = join(root, path);
  if (!existsSync(full)) return '';
  return readFileSync(full, 'utf8');
}
function pass(name) { oks.push(`OK: ${name}`); }
function warn(name, detail = '') { warnings.push(`WARN: ${name}${detail ? ' — ' + detail : ''}`); }
function fail(name, detail = '') { failures.push(`FAIL: ${name}${detail ? ' — ' + detail : ''}`); }
function assertFile(path) { existsSync(join(root, path)) ? pass(`arquivo existe: ${path}`) : fail(`arquivo ausente: ${path}`); }
function assertIncludes(path, needle, name) { const content = file(path); if (!content) return fail(name, `${path} ausente`); content.includes(needle) ? pass(name) : fail(name, `não encontrou ${needle}`); }
function assertNotIncludes(path, needle, name) { const content = file(path); if (!content) return fail(name, `${path} ausente`); !content.includes(needle) ? pass(name) : fail(name, `encontrou ${needle}`); }

const criticalFiles = [
  'index.html','manifest.json','sw.js','routes.config.js','storage-policy.js','app-mode.js',
  'app-shell.js','app-shell.css','brand-dr-jadson.js','brand-dr-jadson.css',
  'consulta.html','secretaria.html','portal-familia-livre.html','comunicacao-alternativa.html',
  'consulta-safe-exit.js','consulta-pin-fix.js','consulta-documentos.js','consulta-voz.js','consulta-docflow.js',
  'master-access-policy.js','safe-public-layer.js',
  'family-pass.js','family-pass-portal.js','family-voucher.js','family-voucher-ui.js','caa-hotfix.js',
  'filtro-escalas.html','mapa-escalas.html','escalas.html','scales-index.json',
  '404.html','_headers','_redirects',
  'functions/api/health.ts','functions/api/scales.ts','functions/api/submissions.ts',
  'wrangler.toml','tsconfig.json','schema.sql','DEPLOY.md',
  'scripts/predeploy-check.mjs','.env.example',
  '.github/workflows/deploy-cloudflare.yml',
  'docs/REGRAS_CRITICAS_ANTES_DE_ALTERAR.md','docs/AUDITORIA_CONTINUA_NEUROPED.md','docs/LGPD_CHECKLIST.md'
];
for (const f of criticalFiles) assertFile(f);

assertIncludes('sw.js', 'CACHE_NAME', 'sw.js define CACHE_NAME');
assertIncludes('sw.js', 'patchPdfLibEncoder', 'SW torna o encoder do pdf-lib tolerante a emoji (laudo PDF não quebra)');
assertIncludes('sw.js', 'PDFButton-', 'SW remenda o chunk-núcleo do pdf-lib (cobre todos os geradores de PDF)');
// SEO: páginas públicas têm og:image + canonical + twitter (compartilhamento/busca)
for (const p of ['escalas.html','sobre-dr-jadson.html','filtro-escalas.html','mapa-escalas.html','neuroped-pro.html']) {
  assertIncludes(p, 'property="og:image"', p+' tem og:image (compartilhamento)');
  assertIncludes(p, 'rel="canonical"', p+' tem canonical (SEO)');
  assertIncludes(p, 'name="twitter:card"', p+' tem twitter card');
}
// Páginas aposentadas (casca antiga): central-atalhos / portal-familia / area-filho
// viraram redirecionamentos para o SPA (home única). Garantia anti-regressão.
for (const p of ['central-atalhos.html','portal-familia-livre.html','area-filho.html']) {
  assertIncludes(p, 'location.replace', p+' é stub que redireciona para o app (SPA)');
  assertIncludes(p, './index.html', p+' redireciona para a home do SPA');
  assertIncludes(p, 'noindex', p+' aposentada é noindex');
}
assertIncludes('sitemap.xml', '<lastmod>', 'sitemap tem lastmod');
// Consolidação P0: política de privacidade com fonte única
assertIncludes('privacy-policy.html', 'privacidade.html', 'privacy-policy redireciona p/ fonte única de privacidade');
assertNotIncludes('terms-of-use.html', 'privacy-policy.html', 'termos apontam para a privacidade canônica');
// Rodada 9.0: perf + compliance + landing + a11y
assertFile('scales-bundle.js');
assertIncludes('index.html', 'modulepreload', 'index pré-carrega o módulo da SPA (perf)');
assertIncludes('app-polish-mobile.js', 'np_lgpd_ack', 'banner LGPD (1ª visita) — só localStorage, sem cookies');
assertIncludes('neuroped-pro.html', 'FAQPage', 'landing pro tem FAQ schema (SEO/rich result)');
assertIncludes('neuroped-pro.html', '"Service"', 'landing pro tem Service schema com preço');
assertIncludes('filtro-escalas.html', 'aria-live="polite"', 'filtro anuncia resultado ao leitor de tela');
// Fonte premium offline: SW cacheia Google Fonts (PWA funciona sem rede)
assertIncludes('sw.js', 'fonts.gstatic.com', 'SW cacheia arquivos de fonte (offline)');
// Correção: só a raiz atualiza ./index.html (navegar p/ outra página não corrompe o fallback do SPA)
assertIncludes('sw.js', 'if (isIndex) c.put', 'SW só sobrescreve ./index.html pela raiz/SPA — navegação a outra página não clobbera o fallback offline');
assertIncludes('sw.js', 'fonts.googleapis.com', 'SW cacheia CSS da fonte (offline)');
// Offline-readiness: páginas de uso diário precisam abrir sem internet
assertIncludes('sw.js', './diario-escola-terapias-v2.html', 'diário no precache (família usa offline)');
assertIncludes('sw.js', './banco-escalas.html', 'banco de escalas no precache offline');
assertIncludes('sw.js', './consulta.html', 'consulta no precache offline');
// Cache: JS/CSS internos usam stale-while-revalidate (correções chegam ao usuário)
assertIncludes('sw.js', 'isCode', 'sw.js trata JS/CSS com stale-while-revalidate (não cache-first eterno)');
assertIncludes('index.html', 'controllerchange', 'index recarrega quando novo SW assume (pega arquivos novos)');
assertIncludes('index.html', 'reg.update()', 'index força checagem de atualização do SW');
assertIncludes('app-shell.html', 'controllerchange', 'app-shell recarrega quando novo SW assume');
assertIncludes('consulta-pin-fix.js', 'toLowerCase', 'consulta-pin-fix normaliza para lowercase (PIN alfanumérico)');
assertIncludes('consulta.html', 'MASTER_HASH', 'consulta.html define MASTER_HASH inline');
assertIncludes('consulta.html', 'function persist', 'consulta salva rascunho local (não some ao fechar)');
assertIncludes('consulta.html', 'window.NPStore.active', 'consulta puxa a criança ativa do Perfil (sem ilha)');
assertIncludes('safe-public-layer.js', 'consulta.html?next=', 'área sensível envia para PIN');
assertIncludes('consulta-docflow.js', 'Não são assinatura digital ICP-Brasil', 'QR avisa que não substitui ICP-Brasil');
assertIncludes('manifest.json', 'CAA Gratuita', 'manifest mantém CAA Gratuita');
assertNotIncludes('manifest.json', 'CAA Premium', 'manifest não contém CAA Premium');
assertIncludes('docs/LGPD_CHECKLIST.md', 'Não apto para produção com dados clínicos reais', 'LGPD deixa produção real bloqueada');
assertIncludes('_headers', 'microphone=(self)', '_headers libera microfone para SpeechRecognition');
assertIncludes('index.html', 'microphone=(self)', 'index.html libera microfone para SpeechRecognition');
assertNotIncludes('index.html', 'og-image.png', 'index.html não cita og-image.png ausente');
assertIncludes('404.html', '<noscript>', '404.html oferece fallback sem JavaScript');
assertIncludes('functions/api/submissions.ts', 'timingSafeEqual', 'submissions.ts usa comparação de token em tempo constante');
assertIncludes('functions/api/submissions.ts', 'sameOrigin', 'submissions.ts valida Origin no POST (defesa CSRF)');
assertIncludes('family-pass-portal.js', 'safeChild', 'family-pass-portal sanitiza child antes de renderizar');
assertNotIncludes('family-pass-portal.js', "innerHTML='<strong", 'family-pass-portal não monta innerHTML com dados do passe');
assertIncludes('family-voucher-ui.js', '&amp;', 'family-voucher-ui escapa entidades HTML ao emitir voucher');
assertNotIncludes('caa-hotfix.js', "+t+'</button>'", 'caa-hotfix não concatena texto em innerHTML do botão');
assertIncludes('master-access-policy.js', 'eligible', 'master-access filtra inputs elegíveis (sem textareas)');
assertIncludes('master-access-policy.js', "addEventListener('storage'", 'master-access escuta storage event (sync cross-tab)');
assertIncludes('master-access-policy.js', 'aria-live', 'toast master tem aria-live para leitores de tela');
assertIncludes('app-shell.js', 'aria-label', 'app-shell anota acessibilidade na navegação');
assertIncludes('app-shell.js', 'aria-current', 'app-shell marca página atual com aria-current');
assertIncludes('app-shell.css', 'aria-current="page"', 'app-shell.css destaca página atual visualmente');
assertIncludes('app-shell.css', 'focus-visible', 'app-shell.css oferece foco visível para teclado');
assertIncludes('app-mode.js', 'aria-label', 'badge de modo tem aria-label descritivo');

assertFile('scales-enhance.js');
assertIncludes('scales-enhance.js', 'NeuroPedScales', 'scales-enhance expoe API global NeuroPedScales');
assertIncludes('scales-enhance.js', 'laudoText', 'scales-enhance gera texto pra laudo');
assertIncludes('scales-enhance.js', 'Respostas:', 'laudo registra as respostas item-a-item (não só o score)');
assertIncludes('scales-enhance.js', '<th>Resposta</th>', 'PDF do laudo tem coluna de Resposta por item');
assertIncludes('scales-enhance.js', 'Gerar laudo (PDF)', 'laudo PDF é a ação principal e clara ao fim da escala respondida');
// Ponte banco→laudo: cada banco expõe window.scales(+domains)/activeId/answers ao scales-enhance
for (const b of ['banco-escalas.html','banco-escalas-lote1.html','banco-escalas-lote2-80.html','banco-escalas-lote3-100.html','banco-escalas-lote4-200.html','banco-escalas-lote5-90.html']) {
  assertIncludes(b, 'window.scales=[', b + ': ponte do laudo (escala respondida → laudo PDF com respostas)');
}
// Resultado de escala SEMPRE aparece na tela (overlay), independente de pop-up
assertIncludes('scales-enhance.js', 'npResultOverlay', 'resultado da escala aparece em overlay na própria tela');
assertIncludes('scales-enhance.js', 'function showResultOverlay', 'overlay de resultado é renderizado sempre');
assertIncludes('scales-enhance.js', 'Imprimir / PDF', 'overlay tem botão de imprimir/PDF');
assertIncludes('scales-enhance.js', 'function fixGlobalPrint', 'intercepta o botão Imprimir da página (que imprimia o app todo)');
assertNotIncludes('scales-enhance.js', "var w = window.open('', '_blank');\n    if (!w) return;", 'sem retorno silencioso no pop-up bloqueado');
assertIncludes('scales-enhance.js', 'Math.min(perItem', 'escore blinda resposta fora da faixa (não estoura o máximo)');
 assertIncludes('scales-enhance.js', 'domainScores', 'scales-enhance calcula score por dominio');
assertIncludes('scales-enhance.js', 'historyFor', 'scales-enhance mantem historico por paciente+instrumento');
assertIncludes('scales-enhance.js', 'tipFor', 'scales-enhance interpreta faixa orientativa');
for (const b of ['banco-escalas.html','banco-escalas-lote1.html','banco-escalas-lote2-80.html','banco-escalas-lote3-100.html','banco-escalas-lote4-200.html','banco-escalas-lote5-90.html']) {
  assertIncludes(b, 'scales-enhance.js', b + ' carrega scales-enhance.js');
}
// Banco: dados brutos JSON recolhidos (laudo é o desfecho limpo, não o JSON)
for (const b of ['banco-escalas.html','banco-escalas-lote2-80.html','banco-escalas-lote5-90.html']) {
  assertIncludes(b, 'class="rawx"', b + ' recolhe os dados brutos num details (foco no laudo)');
}

// Filtro de escalas — utilidade clínica
assertIncludes('safe-public-layer.js', '/filtro', 'safe-public-layer reconhece /filtro como rota familiar');
assertIncludes('safe-public-layer.js', '/escalas', 'safe-public-layer reconhece /escalas como rota familiar');
assertIncludes('consulta-bridge.js', 'filtro-escalas.html', 'consulta-bridge redireciona hash /filtro para filtro-escalas.html');
assertIncludes('consulta-bridge.js', '/undefined', 'bridge captura #/undefined da SPA (hotfix) e manda ao filtro estático');
// Watchdog: rede de segurança contra QUALQUER beco sem saída da SPA
assertFile('spa-route-watchdog.js');
assertIncludes('spa-route-watchdog.js', 'forget to add the page', 'watchdog detecta a tela morta do router');
assertIncludes('spa-route-watchdog.js', 'filtro-escalas.html', 'watchdog resgata ao filtro estático');
assertIncludes('spa-route-watchdog.js', "addEventListener('click'", 'watchdog intercepta clique em link quebrado (proativo)');
assertIncludes('spa-route-watchdog.js', 'unhandledrejection', 'watchdog avisa erro silencioso de PDF (toast)');
assertIncludes('index.html', './spa-route-watchdog.js', 'index.html carrega o watchdog de rota');
// PDF da SPA: SW sanitiza emoji do gerador (WinAnsi) p/ o PDF não travar
assertIncludes('sw.js', 'patchPdfGenerator', 'SW corrige o gerador de PDF da SPA (emoji quebrava WinAnsi)');
assertIncludes('sw.js', 'async function xt(n){', 'patch usa âncora exata do generatePDF (auto-validável)');
assertIncludes('index.html', './consulta-bridge.js', 'index.html carrega o bridge de roteamento');
assertIncludes('filtro-escalas.html', 'scales-bundle.js', 'filtro carrega o bundle de escalas (13 requests viram 1) — scales-bundle.js (perf)');
assertIncludes('scales-bundle.js', 'scales-enhance.js', 'filtro-escalas carrega scales-enhance.js');
// PDF do Top 5 via iframe (sem pop-up bloqueável) + dinamismo visual
assertIncludes('filtro-escalas.html', 'npFiltroPrintFrame', 'filtro imprime Top 5 via iframe (sem pop-up)');
assertIncludes('filtro-escalas.html', '@keyframes npRise', 'filtro tem motion (entrada animada dos cards)');
assertIncludes('filtro-escalas.html', 'prefers-reduced-motion', 'motion respeita prefers-reduced-motion (acessibilidade)');
assertIncludes('filtro-escalas.html', 'conic-gradient', 'filtro tem score como anel de progresso (premium)');
assertIncludes('filtro-escalas.html', 'panel sticky', 'filtro tem painel de entrada fixo (UX premium)');
assertIncludes('filtro-escalas.html', 'Fraunces', 'filtro usa tipografia premium (Fraunces/Inter)');
// Chips de queixa com carinha (emoji) + motion fofo
assertIncludes('filtro-escalas.html', 'class="ce"', 'chips de queixa têm carinha/emoji (não só texto)');
assertIncludes('filtro-escalas.html', '@keyframes npBounce', 'chip faz bounce ao selecionar (motion fofo)');
assertIncludes('filtro-escalas.html', '@keyframes npWiggle', 'carinha do chip ativo balança (vivo)');
// Integração ao app: topbar coesa com voltar + marca (não parece página solta)
assertIncludes('filtro-escalas.html', 'class="topbar"', 'filtro tem topbar do app (integrado, não página solta)');
assertIncludes('filtro-escalas.html', 'href="./index.html"', 'topbar do filtro volta ao app (home/SPA)');
// Relevância do filtro: queixa casa por token (não substring frouxa) e sem tema derruba
assertIncludes('filtro-escalas.html', 'inalcançável pela não-temática', 'scoreScale usa patamar: escala temática sempre acima da irrelevante');
// Filtro redesenhado: entrada 100% por clique (idade+queixa) e saída = só as 3 mais indicadas
assertIncludes('filtro-escalas.html', 'id="ageChips"', 'idade é selecionada por clique (chips), sem digitar');
assertNotIncludes('filtro-escalas.html', '<textarea id="queixaLivre"', 'sem campo de queixa por digitação (só clique)');
assertIncludes('filtro-escalas.html', 'slice(0,3)', 'filtro retorna as 3 escalas mais indicadas (saída enxuta)');
assertIncludes('filtro-escalas.html', 'id="scaleSearch"', 'filtro unifica busca de QUALQUER escala (achar + aplicar na mesma tela)');
assertIncludes('filtro-escalas.html', 'function runSearch', 'busca varre todo o catálogo e abre no runner');
assertIncludes('filtro-escalas.html', 'r.score>=500', 'filtro só mostra escalas temáticas relevantes (patamar 500+)');
// Engine clínica: gate de idade duro + modalidade×idade + hierarquia ouro/prata/bronze
assertIncludes('filtro-escalas.html', 'score*=_mul', 'idade é GATE multiplicador (fora da faixa some — segurança clínica)');
assertIncludes('filtro-escalas.html', 'autorrelato pouco viável nesta idade', 'penaliza autorrelato impróprio p/ pré-escolar (modalidade×idade)');
assertIncludes('filtro-escalas.html', 'Ouro clínico', 'hierarquia clínica Ouro/Prata/Bronze (não ranking artificial)');
assertIncludes('filtro-escalas.html', 'const CONSTRUCTS=', 'filtro pensa por construto clínico (rigidez→flexibilidade executiva etc.), não só tag literal');
assertIncludes('filtro-escalas.html', 'function expandConstructs', 'queixa expande para construtos relacionados (raciocínio de neuropediatra)');
assertIncludes('filtro-escalas.html', 'const DIFFERENTIALS=', 'filtro surge diferenciais clínicos a cruzar (mimics/comorbidade), não só ranking');
assertIncludes('filtro-escalas.html', 'function renderReasoning', 'filtro mostra painel de raciocínio clínico (fenótipo + diferenciais)');
assertIncludes('filtro-escalas.html', 'Apoio à decisão, não diagnóstico', 'painel de raciocínio rotulado como apoio à decisão (defensabilidade médica)');
assertIncludes('filtro-escalas.html', 'STATE_KEY', 'filtro-escalas persiste a busca em localStorage');
assertIncludes('filtro-escalas.html', 'aria-pressed', 'chips do filtro têm aria-pressed');
assertIncludes('filtro-escalas.html', 'printTop', 'filtro tem função print do Top 5');
assertIncludes('filtro-escalas.html', 'exportTop', 'filtro tem função export do Top 5');

// App polish mobile (cara de app: bottom nav, toast, safe-area, splash)
assertFile('app-polish-mobile.css');
assertFile('app-polish-mobile.js');
assertIncludes('app-polish-mobile.css', 'safe-area-inset', 'polish CSS respeita safe-area (notch/home indicator)');
assertIncludes('app-polish-mobile.css', '.np-bottom-nav', 'polish CSS define bottom nav mobile');
assertIncludes('app-polish-mobile.css', '.np-toast', 'polish CSS define toast unificado');
assertIncludes('app-polish-mobile.css', '.np-sheet', 'polish CSS define bottom sheet');
assertIncludes('app-polish-mobile.css', 'prefers-reduced-motion', 'polish CSS respeita prefers-reduced-motion');
assertIncludes('app-polish-mobile.js', 'npToast', 'polish JS expoe window.npToast');
assertIncludes('app-polish-mobile.js', 'npConfirm', 'polish JS expoe window.npConfirm');
for (const p of ['index.html','consulta.html','filtro-escalas.html','instrumento.html','banco-escalas.html','comunicacao-alternativa.html','secretaria.html']) {
  assertIncludes(p, 'app-polish-mobile.css', p + ' carrega app-polish-mobile.css');
  assertIncludes(p, 'app-polish-mobile.js',  p + ' carrega app-polish-mobile.js');
}

// ===== Design System — Movimento 1: ponte de variáveis (coerência cromática) =====
// ds-bridge.css mapeia vocabulário legado (--teal/--cream/--ink…) → tokens canônicos,
// colapsando os violetas divergentes no --primary único. Sem reescrever markup.
assertFile('ds-bridge.css');
assertIncludes('ds-bridge.css', 'var(--primary)', 'bridge aponta --teal para o --primary canônico (unifica violetas)');
assertIncludes('ds-bridge.css', '--teal:', 'bridge cobre o vocabulário legado de cor');
assertIncludes('ds-bridge.css', 'var(--accent-gold)', 'bridge preserva ouro como ouro (semântico)');
assertIncludes('sw.js', './ds-bridge.css', 'ds-bridge no precache (offline)');
// As 6 telas-âncora carregam o bridge como ÚLTIMO stylesheet (vence o :root inline)
for (const p of ['index.html','perfil-crianca.html','filtro-escalas.html','intake.html','clinical-trajetoria.html','secretaria.html']) {
  assertIncludes(p, './ds-bridge.css', p + ' carrega a ponte do Design System (âncora do Movimento 1)');
  const c = file(p);
  (c.lastIndexOf('tokens.css') < c.lastIndexOf('ds-bridge.css'))
    ? pass(p + ': ds-bridge carrega depois de tokens.css (cascata correta)')
    : fail(p + ': ds-bridge deve vir DEPOIS de tokens.css', 'ordem de cascata invertida');
}

// Identidade premium: tipografia institucional + capa do hub
assertIncludes('app-polish-mobile.css', 'Fraunces', 'tipografia premium (Fraunces) carregada globalmente');
assertIncludes('app-polish-mobile.css', '--np-font-display', 'fonte display institucional definida');
assertIncludes('index.html', 'fonts.googleapis.com', 'CSP permite Google Fonts (style-src)');
// Unificação visual: cards glassmorphism coesos (mesmo padrão premium do filtro)
assertNotIncludes('escalas.html', 'background:linear-gradient(135deg,#ffffff', 'escalas.html sem cards de fundo branco (destoavam)');
assertFile('np-cards.css');
// Perfil da Criança (espinha de dados — conecta filtro/escalas/histórico)
assertFile('np-store.js');
assertFile('perfil-crianca.html');
assertIncludes('np-store.js', 'NeuroPedScales.setPatient', 'criança ativa vira o paciente do sistema (fonte única, sem duplicar)');
assertIncludes('np-store.js', 'np:children', 'perfil usa namespace np:* (camada de dados única)');
// Malha central: escala respondida → histórico da criança (dado não morre na tela)
assertIncludes('np-store.js', 'resultsFor', 'np-store lê o histórico de avaliações da criança (histórico longitudinal)');
assertIncludes('scales-enhance.js', 'gerar o laudo TAMBÉM registra', 'gerar laudo grava o resultado no histórico da criança');
assertIncludes('perfil-crianca.html', 'histLine', 'Perfil mostra as últimas avaliações por criança');
assertIncludes('perfil-crianca.html', 'function chartSVG', 'Perfil tem linha do tempo (evolução das avaliações em gráfico)');
assertIncludes('perfil-crianca.html', 'function buildReport', 'Perfil gera relatório consolidado (prontuário PDF da criança)');
assertIncludes('perfil-crianca.html', 'function insights', 'Perfil sugere próximos passos (inteligência operacional, regras não-diagnósticas)');
assertIncludes('np-store.js', 'function exportAll', 'portabilidade: exporta o prontuário local (LGPD/backup)');
assertIncludes('np-store.js', 'function importAll', 'portabilidade: importa mesclando (não apaga)');
assertIncludes('perfil-crianca.html', 'id="btnExport"', 'Perfil tem exportar/importar dados da criança');
assertIncludes('perfil-crianca.html', 'renderTimeline', 'timeline desenha o histórico da criança ativa');
assertIncludes('np-store.js', 'PATIENT_KEY', 'np-store escreve direto na chave do paciente (sem depender do scales-enhance)');
assertNotIncludes('perfil-crianca.html', 'scales-enhance.js', 'perfil não carrega scales-enhance (sem poll eterno de 250ms)');
assertIncludes('filtro-escalas.html', 'NPStore.ageBand', 'filtro pré-seleciona a idade da criança ativa (conexão real, não só nome)');
assertIncludes('diario-escola-terapias-v2.html', 'np-store.js', 'diário carrega a espinha de dados (Perfil)');
assertIncludes('diario-escola-terapias-v2.html', 'window.NPStore.active', 'diário semeia a criança do Perfil (fim do cadastro duplicado)');
// Hub antigo (central-atalhos) aposentado: discoverability migrou para o SPA + filtro.
// O índice (escalas.html) agora redireciona direto para a home (SPA).
assertIncludes('escalas.html', "location.replace('./index.html')", 'escalas.html redireciona para a home (SPA)');
// CONSOLIDAÇÃO: mapa-escalas foi ABSORVIDO pelo Filtro (porta única) → agora redireciona
assertIncludes('mapa-escalas.html', "location.replace('./filtro-escalas.html')", 'mapa-escalas redireciona para a porta única (filtro)');
assertNotIncludes('mapa-escalas.html', 'background:#dcfce7', 'mapa-escalas sem badges de fundo claro (destoavam)');
assertIncludes('secretaria.html', 'backdrop-filter', 'secretaria usa glassmorphism (visual unificado)');
// Estética J26 nos 6 bancos de escalas (sidebar com avatar+sigla+emoji)
assertFile('escalas-card-premium.css');
assertFile('escalas-card-premium.js');
assertIncludes('escalas-card-premium.js', 'jpEmoji', 'decorator tem heurística de emoji por queixa');
assertIncludes('escalas-card-premium.js', 'jpColor', 'decorator tem cor determinística por categoria');
for (const b of ['banco-escalas.html','banco-escalas-lote1.html','banco-escalas-lote2-80.html','banco-escalas-lote3-100.html','banco-escalas-lote4-200.html','banco-escalas-lote5-90.html']) {
  assertIncludes(b, 'escalas-card-premium.css', b+' carrega o CSS premium dos cards');
  assertIncludes(b, 'escalas-card-premium.js', b+' carrega o decorator J26');
}

// Polimento: skeletons, estados vazios, selo de qualidade, acessibilidade
assertIncludes('app-polish-mobile.css', '.np-skel', 'skeleton loaders definidos (sensação de app)');
assertIncludes('app-polish-mobile.css', '.np-empty', 'estado vazio institucional definido');
assertIncludes('filtro-escalas.html', 'np-skel', 'filtro mostra skeleton enquanto carrega');
assertIncludes('app-polish-mobile.js', 'qualitySeal', 'selo de qualidade no rodapé (robustez)');
assertIncludes('app-polish-mobile.js', 'function pageExit', 'navegação guiada: transição de saída ao trocar de tela (app-wide)');
assertIncludes('app-polish-mobile.js', 'np-leaving', 'fade de saída por opacidade (não quebra sticky/fixed)');
assertIncludes('app-polish-mobile.js', 'function journeyGuide', 'guia de jornada: etapa atual + próximo passo contextual (fluxo guiado)');
assertIncludes('app-polish-mobile.js', 'Próximo passo', 'jornada destaca o próximo passo (navegação preditiva)');
assertIncludes('app-polish-mobile.js', "'impacto-medicacao.html': function", 'guia cobre telas-ramo (impacto) — sem becos sem saída');
assertIncludes('app-polish-mobile.js', "'diario-escola-terapias-v2.html': function", 'guia cobre telas-ramo (diário)');
assertIncludes('app-polish-mobile.js', "'consulta.html': function", 'guia cobre telas-ramo (consulta)');
assertIncludes('app-polish-mobile.js', 'function onboarding', 'onboarding de primeiro uso guiado em 3 passos (Camada I — ativação)');
assertIncludes('app-polish-mobile.js', 'np_onboarded', 'onboarding aparece só na 1ª visita (não repete)');
// Amadurecimento contínuo: continuidade no ponto de entrada + micro-tema premium
assertIncludes('app-polish-mobile.js', '::selection', 'micro-tema premium universal (seleção/scrollbar temáticas)');
assertIncludes('perfil-crianca.html', 'tl-redo', 'histórico permite reaplicar a mesma escala em 1 toque (reavaliação → comparador)');
assertIncludes('perfil-crianca.html', './escala.html?id=', 'reaplicar abre o runner com o mesmo instrumento (reuso/continuidade)');
assertIncludes('filtro-escalas.html', 'function stateKey', 'filtro lembra queixa/idade POR CRIANÇA (descoberta automática, sem herdar contexto)');
// Camada D — consistência: tipografia de exibição (Fraunces) unificada nas telas-ramo
assertIncludes('diario-escola-terapias-v2.html', 'Fraunces', 'diário usa a fonte de exibição unificada (Fraunces)');
assertIncludes('consulta.html', 'Fraunces', 'consulta usa a fonte de exibição unificada (Fraunces)');
assertIncludes('comunicacao-alternativa.html', 'Fraunces', 'CAA usa a fonte de exibição unificada (Fraunces)');
assertIncludes('neuroped-master-biblioteca.css', 'Fraunces', 'biblioteca usa a fonte de exibição unificada (Fraunces)');
assertIncludes('app-polish-mobile.js', 'function predictivePrefetch', 'prefetch preditivo: próxima tela carrega antes do clique (instantâneo)');
assertFile('logo-jadson.jpg');
assertIncludes('app-polish-mobile.js', 'function brandMark', 'logo do Dr. Jadson presente em toda tela (marca)');
assertIncludes('app-polish-mobile.js', './logo-jadson.jpg', 'selo de marca usa a logo oficial');
assertIncludes('sw.js', './logo-jadson.jpg', 'logo no precache (marca disponível offline)');
assertIncludes('filtro-escalas.html', 'Responder a 1ª agora', 'filtro: atalho de 1 toque para a escala mais indicada (menos cliques)');
assertIncludes('filtro-escalas.html', "'np:reco'", 'filtro grava a fila de recomendadas (runner encadeia próxima)');
assertIncludes('escala.html', 'Próxima recomendada', 'runner encadeia a próxima escala recomendada (triagem em sequência)');
assertIncludes('diario-escola-terapias-v2.html', 'aria-label="Novo registro"', 'diário tem aria-label nos botões só-ícone');
assertIncludes('diario-escola-terapias-v2.html', 'np-empty', 'diário usa estado vazio institucional');
{
  // selo exibe a versão canônica (mantém honestidade do número)
  const pj = file('package.json'); let v = '';
  try { v = JSON.parse(pj).version; } catch {}
  const js = file('app-polish-mobile.js');
  (v && js.includes("'" + v + "'")) ? pass(`selo de qualidade referencia a versão canônica ${v}`)
    : fail('selo de qualidade desalinhado da versão', v);
}

// ===== Monetização: NeuroPed Pro (licença por código, offline, sem backend) =====
assertFile('neuroped-pro.html');
assertFile('pro-license.js');
assertFile('pro-hashes.js');
assertFile('gerar-licencas-pro.html');
assertIncludes('pro-license.js', 'NEUROPED_PRO_HASHES', 'pro-license valida contra lista de hashes (sem guardar códigos)');
assertIncludes('pro-license.js', 'crypto.subtle.digest', 'pro-license usa SHA-256 (verificação offline segura)');
assertNotIncludes('pro-hashes.js', 'PRO-', 'pro-hashes NÃO contém códigos em texto (só hashes)');
assertIncludes('neuroped-pro.html', 'Garantia de 7 dias', 'landing Pro informa direito de arrependimento (CDC)');
assertIncludes('neuroped-pro.html', 'não estabelece diagnóstico', 'landing Pro mantém disclaimer de natureza educativa');
assertIncludes('neuroped-pro.html', 'CHECKOUT_URL', 'landing Pro tem ponto único de configuração do checkout');
assertIncludes('neuroped-master-biblioteca.html', 'pro-license.js', 'biblioteca reconhece licença Pro');
assertIncludes('gerar-licencas-pro.html', 'noindex', 'gerador de licenças é noindex (uso do autor)');
assertIncludes('gerar-licencas-pro.html', 'unlockIfPin', 'gerador de licenças exige PIN master');

// ===== Autoridade + alcance nacional (pai-para-pai), LGPD-safe =====
assertFile('sobre-dr-jadson.html');
assertIncludes('sobre-dr-jadson.html', '"@type":"Physician"', 'página de autoridade tem schema Physician (SEO médico)');
assertIncludes('sobre-dr-jadson.html', 'og:title', 'página de autoridade tem Open Graph (compartilhamento)');
assertIncludes('sobre-dr-jadson.html', 'substitui consulta', 'página de autoridade mantém aviso ético');
assertIncludes('neuroped-pro.html', 'og:title', 'landing Pro tem Open Graph para compartilhamento profissional');
assertIncludes('app-polish-mobile.js', 'referralWidget', 'widget de indicação pai-para-pai (crescimento)');
assertIncludes('sitemap.xml', 'sobre-dr-jadson.html', 'sitemap inclui a página de autoridade');
assertIncludes('sitemap.xml', 'neuroped-pro.html', 'sitemap inclui a landing Pro');

// Backend Supabase opcional (coexiste com D1)
assertFile('db/supabase-schema.sql');
assertFile('np-cloud.js');
assertFile('cloud-config.js');
assertFile('cloud-config.example.js');
assertFile('SUPABASE.md');
assertIncludes('db/supabase-schema.sql', 'enable row level security', 'schema Supabase ativa RLS');
assertIncludes('db/supabase-schema.sql', 'anon can insert submissions', 'schema permite INSERT anon em submissions');
assertIncludes('db/supabase-schema.sql', 'anon cannot select submissions', 'schema BLOQUEIA SELECT anon em submissions');
assertIncludes('np-cloud.js', 'NeuroPedCloud', 'np-cloud expoe API global NeuroPedCloud');
assertIncludes('np-cloud.js', 'saveSubmission', 'np-cloud tem saveSubmission');
assertIncludes('np-cloud.js', '/rest/v1/submissions', 'np-cloud usa endpoint REST do Supabase');
assertIncludes('cloud-config.js', 'enabled: false', 'cloud-config padrao vem desabilitado');
assertNotIncludes('cloud-config.js', 'eyJh', 'cloud-config nao contem JWT real');
assertIncludes('_headers', 'https://*.supabase.co', '_headers permite Supabase em connect-src');
assertIncludes('index.html', 'https://*.supabase.co', 'index.html permite Supabase em connect-src');
assertIncludes('index.html', './np-cloud.js', 'index.html carrega np-cloud.js');
assertIncludes('index.html', './cloud-config.js', 'index.html carrega cloud-config.js');
assertIncludes('scales-enhance.js', 'NeuroPedCloud', 'scales-enhance roteia para Supabase quando disponivel');
assertIncludes('scales-enhance.js', 'dedupe de sessão', 'laudo reimpresso não duplica o histórico (mesma escala+paciente+score em <5min)');

// Instrumento enhance
assertFile('instrumento-enhance.js');
assertFile('instrumento.html');
assertIncludes('instrumento.html', './instrumento-enhance.js', 'instrumento.html carrega instrumento-enhance.js');
assertIncludes('instrumento-enhance.js', 'NeuroPedScales', 'instrumento-enhance integra com NeuroPedScales');
assertIncludes('instrumento-enhance.js', 'NeuroPedCloud', 'instrumento-enhance roteia Submeter ao Supabase opt-in');
assertIncludes('instrumento-enhance.js', 'data-v="na"', 'instrumento-enhance adiciona botao Nao Aplicavel');
assertIncludes('instrumento-enhance.js', 'renderDiff', 'instrumento-enhance compara com avaliacao anterior');
assertIncludes('instrumento-enhance.js', 'bindKeyboard', 'instrumento-enhance liga atalhos 1..5 e 0 para n/a');
// Botão Imprimir gera documento LIMPO de resultado (não a página toda) via iframe
assertIncludes('instrumento-enhance.js', 'function printResultDoc', 'instrumento gera documento de resultado limpo');
assertIncludes('instrumento-enhance.js', 'npInstPrintFrame', 'instrumento imprime via iframe (sem pop-up bloqueável)');
assertIncludes('instrumento-enhance.js', 'fixPrintButton', 'instrumento substitui o print() da página inteira');

// NeuroPed Master — vitrine pública (TEST_STATIC_ACRESCENTAR)
const NPM_FILES = ['neuroped-master-vitrine.html','neuroped-master-vitrine.css','neuroped-master-vitrine.js','neuroped-master-vitrine-data.js','solicitar-neuroped-master.html'];
for (const f of NPM_FILES) assertFile(f);
for (const f of NPM_FILES) {
  assertNotIncludes(f, 'localStorage', `${f} não usa localStorage`);
  assertNotIncludes(f, 'sessionStorage', `${f} não usa sessionStorage`);
  assertNotIncludes(f, 'indexedDB', `${f} não usa IndexedDB`);
  assertNotIncludes(f, '.pdf', `${f} não expõe link público a PDF`);
}
assertIncludes('neuroped-master-vitrine.html', './neuroped-master-vitrine-data.js', 'vitrine carrega o catálogo (data.js)');
assertIncludes('neuroped-master-vitrine.html', 'Direitos reservados', 'vitrine declara direitos reservados');
assertIncludes('neuroped-master-vitrine-data.js', 'NEUROPED_MASTER', 'data.js expõe catálogo NEUROPED_MASTER');
assertIncludes('routes.config.js', 'neuroped-master-vitrine.html', 'routes.config registra a vitrine');
assertIncludes('routes.config.js', 'solicitar-neuroped-master.html', 'routes.config registra a solicitação');

// NeuroPed Master — Biblioteca (catálogo público + área reservada por PIN)
const NPM_BIB_FILES = ['neuroped-master-biblioteca.html','neuroped-master-biblioteca.css','neuroped-master-biblioteca.js','neuroped-master-biblioteca-data.js','neuroped-master-protegido-data.js'];
for (const f of NPM_BIB_FILES) assertFile(f);
for (const f of NPM_BIB_FILES) {
  assertNotIncludes(f, '.pdf', `${f} não expõe link público a PDF`);
}
// catálogo público não deve gravar dados; gate é só de interface (master-access-policy)
assertNotIncludes('neuroped-master-biblioteca-data.js', 'localStorage', 'catálogo público não usa localStorage');
assertNotIncludes('neuroped-master-protegido-data.js', 'localStorage', 'data reservado não usa localStorage');
assertIncludes('neuroped-master-biblioteca-data.js', 'NEUROPED_MASTER_LIB', 'data.js expõe catálogo NEUROPED_MASTER_LIB');
assertIncludes('neuroped-master-protegido-data.js', 'NEUROPED_MASTER_PRO', 'data reservado expõe NEUROPED_MASTER_PRO');
assertIncludes('neuroped-master-biblioteca.html', './master-access-policy.js', 'biblioteca carrega a política de PIN master');
assertIncludes('neuroped-master-biblioteca.js', 'NeuroPedMasterAccess', 'biblioteca usa o gate de PIN master para a área reservada');
assertIncludes('routes.config.js', 'neuroped-master-biblioteca.html', 'routes.config registra a Biblioteca');

// Gerador de Cards (conteúdo educacional com marca)
for (const f of ['gerador-cards.html','gerador-cards.js']) assertFile(f);
assertNotIncludes('gerador-cards.js', 'NEUROPED_MASTER_PRO.farmaco', 'gerador NÃO usa farmacoterapia (sensível) — só conteúdo educacional');
assertIncludes('gerador-cards.js', 'CRM-PE 25227', 'gerador imprime a marca/credenciais do autor');
assertIncludes('gerador-cards.html', './gerador-cards.js', 'gerador-cards carrega o script');
assertIncludes('routes.config.js', 'gerador-cards.html', 'routes.config registra o Gerador');

// App shell — hub dinâmico (chrome persistente, conteúdo em quadro)
assertFile('app-shell.html');
assertIncludes('app-shell.html', 'sh-frame', 'app-shell tem o quadro de conteúdo persistente');
assertIncludes('app-shell.html', 'logo-jadson.jpg', 'casca usa a logo oficial no topo e no splash');
// Moldura única (Opção A): ferramentas abrem DENTRO da home (SPA) por overlay em iframe
assertFile('np-frame.js');
assertIncludes('index.html', './np-frame.js', 'home (SPA) carrega a moldura de ferramentas');
assertIncludes('np-frame.js', 'npf-ov', 'np-frame tem overlay de moldura');
assertIncludes('np-frame.js', 'self !== window.top', 'np-frame só age no topo (não empilha molduras)');
assertIncludes('sw.js', './np-frame.js', 'np-frame no precache (offline)');
// Fluxo único de escalas: runner abre DENTRO da superfície (overlay), sem trocar de página
assertIncludes('filtro-escalas.html', './np-frame.js', 'filtro abre o runner em overlay (achar→aplicar numa tarefa só)');
assertIncludes('filtro-escalas.html', 'id="allScales"', 'filtro é porta única: "Todas as escalas" foca a busca (sem sair do fluxo)');
assertNotIncludes('filtro-escalas.html', 'href="./mapa-escalas.html"', 'filtro não puxa o usuário para fora do fluxo (mapa via hub)');
assertIncludes('perfil-crianca.html', './np-frame.js', 'perfil abre runner/reaplicar em overlay (fluxo contínuo)');
// S1 (roadmap 9.9): README na versão canônica + sem vazamentos/divergências
assertNotIncludes('README.md', 'v5.1', 'README não está mais na versão defasada (v5.1)');
assertNotIncludes('README.md', 'REMOVIDO', 'README não expõe PIN em texto claro (S12)');
assertNotIncludes('README.md', '9609-7028', 'README sem WhatsApp divergente');
assertIncludes('README.md', 'CRM-PE 25227', 'README traz o registro canônico (CRM-PE 25227)');
assertIncludes('README.md', 'wa.me/5587991097371', 'README traz o WhatsApp canônico');
assertIncludes('README.md', 'Soli Deo Gloria', 'README traz o fechamento institucional');
assertIncludes('app-shell.html', 'comunicacao-alternativa.html', 'app-shell roteia a CAA');
assertIncludes('app-shell.html', 'neuroped-master-biblioteca.html', 'app-shell roteia a Biblioteca');
assertIncludes('manifest.json', './index.html', 'manifest aponta o PWA para a home (SPA)');
assertIncludes('sw.js', './app-shell.html', 'sw precache inclui a casca');
assertIncludes('app-polish-mobile.js', 'EMBEDDED', 'app-polish suprime chrome próprio quando embutido na casca');
// Catálogo de escalas: ligação dos geradores + abertura interativa real
assertFile('scales-diarios-uteis.js');
assertIncludes('scales-bundle.js', 'scales-453-authorial.js', 'filtro liga os geradores (453+)');
assertIncludes('scales-bundle.js', 'scales-diarios-uteis.js', 'filtro liga diários/testes/ferramentas');
assertIncludes('filtro-escalas.html', 'scales-bundle.js', 'o filtro (porta única) carrega o catálogo completo incl. global-max (absorveu o mapa)');
assertIncludes('instrumento.html', './scales-diarios-uteis.js', 'instrumento liga o catálogo completo');
assertFile('instrumento.html');
assertIncludes('instrumento.html', 'nunca/ausente', 'instrumento tem respostas clicáveis (escala 0–4)');
assertIncludes('instrumento.html', 'Faixa orientativa', 'instrumento gera resultado/faixa ao final');
assertIncludes('filtro-escalas.html', 'Responder e gerar laudo', 'filtro tem botão para responder a escala e gerar laudo');
// Validados + curadoria honesta






assertIncludes('scales-bundle.js', 'scales-curate.js', 'filtro liga a curadoria (enxuga + rótulos)');
assertIncludes('scales-curate.js', 'NEUROPED_CATALOG_STATS', 'curadoria publica estatística honesta');
// Catálogo oficial de terceiros (conformidade: sem itens, com fonte)
assertFile('scales-oficiais.js'); assertFile('scales-curate.js');
assertIncludes('scales-oficiais.js', 'official_url', 'catálogo oficial traz link de fonte oficial');
assertIncludes('scales-oficiais.js', 'official_catalog', 'itens oficiais marcados como catálogo (não aplicáveis)');
assertIncludes('scales-oficiais.js', 'mchatscreen.com', 'M-CHAT como catálogo+fonte (sem itens)');
assertNotIncludes('scales-oficiais.js', 'plain_questions:[\'', 'catálogo oficial NÃO reproduz perguntas');
assertIncludes('scales-bundle.js', 'scales-oficiais.js', 'filtro liga o catálogo oficial');
assertIncludes('filtro-escalas.html', 'Abrir fonte oficial', 'filtro abre a fonte oficial dos instrumentos de terceiros');
assertIncludes('scales-curate.js', 'oficiais', 'curadoria separa fontes oficiais da contagem aplicável');
// Instrumentos autorais NPE-BR (itens próprios + lógica clínica)
assertFile('scales-autorais-npe.js'); assertFile('instrumento-autoral.html');
assertIncludes('scales-autorais-npe.js', 'NPE-BR-001', 'série NPE-BR cadastrada');
assertIncludes('scales-autorais-npe.js', 'NPE-BR-012', 'NPE-BR inclui diferencial DI leve (012)');
assertIncludes('scales-autorais-npe.js', 'ponto de atenção operacional', 'NPE-BR usa ponto de atenção operacional (não corte diagnóstico)');
assertIncludes('instrumento-autoral.html', 'Uso profissional restrito', 'autoral marca instrumentos restritos');
assertIncludes('instrumento-autoral.html', 'level005', 'autoral classifica risco S0–S3 (NPE-BR-005)');
assertIncludes('instrumento-autoral.html', 'sentinel', 'autoral trata pergunta-sentinela (004→005)');
assertIncludes('instrumento-autoral.html', 'differential', 'autoral trata diferencial dislexia×global (011)');
assertIncludes('scales-bundle.js', 'scales-autorais-npe.js', 'filtro liga os autorais NPE-BR');
assertIncludes('instrumento.html', '#0e0e22', 'instrumento.html no tema índigo (coesão)');
// Coesão de paleta: abas centrais no mesmo tema índigo escuro (sem salto)
for (const p of ['comunicacao-alternativa.html','portal-familia-livre.html','area-filho.html','diario-escola-terapias-v2.html','consulta.html','secretaria.html']) {
  assertIncludes(p, 'content="#0e0e22"', p + ' usa o tema índigo escuro (coesão visual)');
  assertNotIncludes(p, 'content="#1a6b65"', p + ' não usa mais o tema teal claro');
}
assertIncludes('filtro-escalas.html', 'autorais distintos', 'filtro mostra contagem honesta');

// ===== Caça às bruxas — coesão e honestidade (anti-regressão) =====
// Contagem inflada "507" não pode voltar nas páginas de lote
for (const b of ['banco-escalas.html','banco-escalas-lote1.html','banco-escalas-lote2-80.html','banco-escalas-lote3-100.html','banco-escalas-lote4-200.html','banco-escalas-lote5-90.html']) {
  assertNotIncludes(b, '507', b + ' não exibe a contagem inflada 507');
  assertIncludes(b, 'content="#0e0e22"', b + ' usa o tema índigo escuro (coesão)');
  assertNotIncludes(b, '--bg:#f7f2e8', b + ' não usa mais o tema creme antigo');
}
// app-polish-mobile não pode reescrever o theme-color para teal
assertNotIncludes('app-polish-mobile.js', "content = '#1a6b65'", 'app-polish-mobile não força theme-color teal');
assertIncludes('app-polish-mobile.js', "content = '#0e0e22'", 'app-polish-mobile usa theme-color índigo');
assertNotIncludes('app-polish-mobile.css', 'rgba(250, 248, 244', 'bottom-nav global não usa fundo creme');
// camadas editoriais/branding no índigo
assertNotIncludes('editorial-impact.css', '#faf8f4 0%', 'editorial-impact não força fundo creme no body');
assertNotIncludes('app-shell.css', 'background:#faf8f4', 'app-shell.css não usa barra creme');
assertNotIncludes('master-access-policy.js', 'rgba(250,248,244', 'painel da família injetado não é creme');
// honestidade SEO: sem overclaim "escalas validadas"
assertNotIncludes('index.html', 'escalas validadas', 'index.html não promete "escalas validadas" (autoral ≠ validado)');
// sem link quebrado de credibilidade
assertNotIncludes('mapa-escalas.html', 'credibilidade-clinica.html', 'mapa-escalas não aponta para página inexistente');
// 404 no tema escuro
assertIncludes('404.html', 'content="#0e0e22"', '404.html usa o tema índigo escuro');

// ===== Ética clínica & segurança (anti-regressão) =====
assertIncludes('instrumento.html', 'Natureza da ferramenta', 'instrumento.html declara natureza não-diagnóstica');
assertIncludes('instrumento.html', 'ato médico', 'instrumento.html lembra que diagnóstico é ato médico');
assertIncludes('instrumento-autoral.html', 'Natureza da ferramenta', 'instrumento-autoral.html declara natureza não-diagnóstica');
assertIncludes('instrumento-autoral.html', 'SAMU 192', 'alerta de risco direciona à emergência (SAMU 192)');
assertIncludes('instrumento-autoral.html', 'CVV 188', 'alerta de risco oferece apoio emocional (CVV 188)');
// UX: anti-zoom no toque + tour com saída sempre disponível
// a11y (WCAG 1.4.4): zoom de toque DEVE ser permitido. maximum-scale=1 bloqueava ampliar.
assertNotIncludes('index.html', 'maximum-scale=1', 'index.html NÃO bloqueia zoom de toque (a11y)');
assertNotIncludes('app-shell.html', 'maximum-scale=1', 'app-shell NÃO bloqueia zoom de toque (a11y)');
assertIncludes('app-polish-mobile.js', 'maximum-scale=5', 'fixViewport permite pinch-zoom até 5x (a11y)');
assertIncludes('app-polish-mobile.css', 'touch-action: manipulation', 'polish global desativa double-tap-zoom');
// Camada F — a11y: NENHUMA tela do app pode travar o zoom (varredura cross-file)
{
  const htmlAll = readdirSync(root).filter(f => f.endsWith('.html'));
  const zoomLocked = htmlAll.filter(f => /user-scalable\s*=\s*(no|0)|maximum-scale\s*=\s*1\b/.test(file(f) || ''));
  zoomLocked.length === 0
    ? pass(`a11y: nenhuma das ${htmlAll.length} telas trava o zoom (WCAG 1.4.4)`)
    : fail('a11y: telas travando zoom de toque', zoomLocked.join(', '));
}
assertIncludes('tour.js', 'npt-x', 'tour tem botão × de fechar/pular em todos os passos');
assertIncludes('tour.js', "ev.key==='Escape'", 'tour fecha com ESC');
// Segurança: links target=_blank gerados no checklist usam rel=noopener (anti-tabnabbing)
assertIncludes('teste-e2e-manual.html', 'rel="noopener"', 'checklist usa rel=noopener em links externos');
// Performance: janela de impressão do filtro não injeta o chrome do app
{
  const c = file('filtro-escalas.html');
  const total = (c.match(/app-polish-mobile\.js/g) || []).length;
  total === 1 ? pass('filtro-escalas carrega o polish 1× (sem injeção no print)') : fail('filtro-escalas com app-polish duplicado', `${total}×`);
}
// favicon e página de teste sem paleta antiga
assertNotIncludes('index.html', "fill='%231a6b65'", 'favicon não usa mais o teal antigo');
assertIncludes('teste-e2e-manual.html', 'noindex', 'página de teste interna marcada como noindex');
// páginas internas/admin/teste não devem ser indexadas pelo Google
for (const f of ['auditoria-operacional.html','qa-smoke-test.html','qualidade-neuroped.html','teste-ouro-pin.html','verificar-app.html','gerar-licencas-pro.html','guia-lancamento.html']) {
  assertIncludes(f, 'noindex', `${f} (interna) marcada como noindex`);
}
// Conversão: landing Pro com comparativo + descoberta do Pro no portal
assertFile('guia-lancamento.html');
assertIncludes('guia-lancamento.html', 'np_launch_progress_v1', 'guia de lançamento salva progresso (checklist)');
assertIncludes('neuroped-pro.html', 'Grátis × Pro', 'landing Pro tem comparativo Grátis × Pro (conversão)');
assertIncludes('neuroped-pro.html', 'Como funciona', 'landing Pro tem passo a passo (reduz fricção de compra)');
assertIncludes('neuroped-pro.html', 'id="depoimentos"', 'landing Pro tem estrutura de prova social (depoimentos)');
{
  const c = file('neuroped-pro.html');
  // a seção de depoimentos nasce oculta (nunca exibe depoimento inventado)
  /id="depoimentos"[^>]*\shidden/.test(c) ? pass('depoimentos ocultos por padrão (sem prova social falsa)') : fail('depoimentos deveriam nascer ocultos');
}
assertIncludes('neuroped-pro.html', 'acesso vitalício', 'landing Pro tem âncora de valor honesta (vitalício)');
assertIncludes('sobre-dr-jadson.html', 'neuroped-pro.html', 'página de autoridade leva ao Pro (funil tráfego→oferta)');
// Inteligência clínica: sinais de alerta (red flags) no filtro de escalas
assertFile('scales-red-flags.js');
assertIncludes('scales-red-flags.js', 'NEUROPED_RED_FLAGS', 'módulo de sinais de alerta expõe a base');
assertIncludes('scales-bundle.js', 'scales-red-flags.js', 'filtro carrega o módulo de sinais de alerta');
assertIncludes('filtro-escalas.html', 'renderRedFlags', 'filtro renderiza sinais de alerta por queixa');
assertIncludes('filtro-escalas.html', 'Apoio à decisão, não diagnóstico', 'painel de alerta mantém disclaimer (não diagnóstico)');
// Consistência da oferta: guia/gerador alinhados ao Mercado Pago R$ 47 (sem preço antigo)
assertNotIncludes('guia-lancamento.html', 'R$ 127', 'guia de lançamento sem preço antigo (R$ 127)');
assertIncludes('guia-lancamento.html', 'Mercado Pago', 'guia de lançamento alinhado ao Mercado Pago');
assertIncludes('neuroped-pro.html', 'application/ld+json', 'landing Pro tem JSON-LD (rich SEO comercial)');
assertIncludes('neuroped-pro.html', '"price": "47.00"', 'JSON-LD da landing com preço R$ 47 consistente');
// Robustez funcional: Diário gera tendências (humor/regularidade) no relatório
assertIncludes('diario-escola-terapias-v2.html', 'function trendInsights', 'Diário calcula tendências do período');
assertIncludes('diario-escola-terapias-v2.html', 'trendInsights(regs,hum)', 'relatório do Diário inclui as tendências');
assertIncludes('diario-escola-terapias-v2.html', 'apoio à observação, não diagnóstico', 'tendências do Diário mantêm disclaimer');
assertIncludes('neuroped-pro.html', 'id="buyBar"', 'landing tem barra de compra fixa (reduz abandono no mobile)');
assertIncludes('neuroped-pro.html', 'data-no-bottom-nav', 'landing de vendas sem nav competindo (foco em 1 ação)');
assertIncludes('app-polish-mobile.js', 'data-no-bottom-nav', 'app-polish suporta opt-out de nav por página');
// telas de triagem/escala mantêm aviso ético (não substitui avaliação)
for (const f of ['escalas.html','mapa-escalas.html']) {
  const c = file(f);
  /substitui avaliação|substituem .*avaliação|avaliação clínica/i.test(c) ? pass(`${f} mantém aviso ético`) : fail(`${f} sem aviso ético`);
}

// ===== Filtro: visões/triangulação + impacto pós-medicação =====
assertFile('scales-impacto-medicacao.js');
assertFile('impacto-medicacao.html');
assertIncludes('scales-impacto-medicacao.js', 'npe-med-pais', 'inventário pós-medicação visão família');
assertIncludes('scales-impacto-medicacao.js', 'npe-med-escola', 'inventário pós-medicação visão escola');
assertIncludes('impacto-medicacao.html', 'content="#0e0e22"', 'impacto-medicacao no tema índigo');
assertIncludes('impacto-medicacao.html', 'eficácia farmacológica', 'impacto deixa claro que não mede eficácia');
// Resposta à medicação ligada ao perfil (stream SEPARADO, não polui linha do tempo das escalas)
assertIncludes('np-store.js', 'medLogFor', 'np-store guarda resposta à medicação por criança (stream separado)');
assertIncludes('np-store.js', "MEDLOG_KEY = 'np:medlog'", 'resposta à medicação em namespace próprio (np:medlog)');
assertIncludes('impacto-medicacao.html', './np-store.js', 'impacto-medicacao integra a criança ativa');
assertIncludes('impacto-medicacao.html', 'addMedLog', 'impacto-medicacao salva a resposta no perfil');
assertIncludes('perfil-crianca.html', 'Resposta à medicação', 'perfil mostra resposta à medicação (separada das escalas)');
assertIncludes('perfil-crianca.html', 'medLogFor', 'perfil lê o stream de resposta à medicação');
assertIncludes('filtro-escalas.html', 'renderTriangulation', 'filtro sugere 3 visões distintas (triangulação)');
assertIncludes('scales-bundle.js', 'scales-impacto-medicacao.js', 'filtro carrega os inventários pós-medicação');
assertIncludes('filtro-escalas.html', 'Teste direto com a criança', 'filtro distingue teste direto com a criança');
assertIncludes('filtro-escalas.html', 'Autorrelato', 'filtro distingue autorrelato');

// ===== CORE: runner unificado de escala (corrige "escalas não abriam") =====
// Antes: filtro abria banco-X.html#anchor, mas os bancos ignoravam o hash e os
// anchors não batiam com os ids — toda recomendação caía na escala-padrão do banco.
// Agora o filtro abre escala.html?id=<id>, que responde QUALQUER escala e gera laudo.
assertFile('escala.html');
assertIncludes('filtro-escalas.html', 'escala.html?id=', 'filtro abre a escala recomendada no runner (corrige abertura)');
assertNotIncludes('filtro-escalas.html', "href=\"./'+r.page+(r.anchor", 'filtro não usa mais o link de banco+anchor (que não abria a escala certa)');
assertIncludes('escala.html', './scales-bundle.js', 'runner carrega o catálogo+motor pelo bundle');
assertNotIncludes('escala.html', 'src="./scales-enhance.js"', 'runner não recarrega o motor (evita laudo duplicado; já vem no bundle)');
assertIncludes('escala.html', 'window.scales', 'runner expõe o instrumento ao motor de laudo');
assertIncludes('escala.html', "qs('id')", 'runner resolve a escala pelo id da URL');
assertIncludes('escala.html', './np-store.js', 'runner amarra o laudo à criança ativa');
assertIncludes('sw.js', './escala.html', 'runner no precache (funciona offline)');
assertIncludes('escala.html', 'id="doneBanner"', 'runner celebra a conclusão e leva ao laudo');
assertIncludes('escala.html', 'function advance', 'runner guia ao próximo item sem resposta (fluxo guiado)');
assertIncludes('escala.html', 'class="skel"', 'runner mostra skeleton enquanto carrega o catálogo');

// ===== Cara de app: transições entre páginas + navegação fluida =====
assertIncludes('app-polish-mobile.css', '@view-transition', 'transições entre páginas (View Transitions API)');
assertIncludes('app-polish-mobile.css', '.np-navbar', 'barra de progresso de navegação definida');
assertIncludes('app-polish-mobile.js', 'navProgress', 'progresso de navegação ativado (sensação de app)');
// Portal da família sem pedir dado identificável (só info genérica/útil)
assertNotIncludes('area-filho.html', 'Data de nascimento', 'Área do Filho não pede data de nascimento');
assertNotIncludes('area-filho.html', 'Último sobrenome', 'Área do Filho não pede sobrenome');
assertNotIncludes('portal-familia-livre.html', 'nascimento e sobrenome', 'portal não exige nascimento/sobrenome');

// ===== Pragmatismo: ferramentas úteis salvam local + doses liberadas com blindagem =====
assertIncludes('diario-escola-terapias-v2.html', 'localStorage.setItem(KEY', 'diário salva localmente (não é mais demo vazio)');
assertNotIncludes('diario-escola-terapias-v2.html', 'Exportação desativada', 'diário tem exportação real');
assertIncludes('secretaria.html', 'localStorage.setItem(K', 'secretaria salva localmente (PIN, no aparelho)');
// Bugs similares varridos: print limpo, sem falha silenciosa de pop-up, anti-zoom global
assertIncludes('secretaria.html', '@media print', 'secretaria imprime limpo (não a página do app)');
assertIncludes('family-voucher-ui.js', 'npVoucherFrame', 'voucher imprime via iframe (sem pop-up bloqueável)');
assertNotIncludes('family-voucher-ui.js', "if(!w)return", 'voucher não falha em silêncio no pop-up bloqueado');
assertIncludes('app-polish-mobile.js', 'function fixViewport', 'app-polish corrige viewport (anti-zoom) em todas as telas');
assertIncludes('app-polish-mobile.js', 'function premiumNav', 'app-polish injeta navegação premium (fade/scroll/fonte) em todas as telas');
assertIncludes('app-polish-mobile.js', 'npPageIn', 'fade-in de entrada de página');
assertIncludes('app-polish-mobile.js', 'scroll-behavior:smooth', 'scroll suave global');
assertIncludes('app-polish-mobile.js', 'prefers-reduced-motion:no-preference', 'navegação premium respeita reduced-motion');
// Shell de design unificado (Fase 4)
assertFile('neuroped-shell.css');
assertIncludes('neuroped-shell.css', 'data-ns-shell', 'shell escopa estilos por data-ns-shell (não invasivo)');
assertIncludes('neuroped-shell.css', 'ns-fade-in', 'shell tem animação de entrada');
for (const p of ['sobre-dr-jadson.html','comunicacao-alternativa.html','diario-escola-terapias-v2.html','guia-lancamento.html']) {
  assertIncludes(p, 'neuroped-shell.css', p+' carrega o shell unificado');
  assertIncludes(p, 'data-ns-shell', p+' ativa o shell no body');
}
assertNotIncludes('agenda-financeiro.html', 'data-ns-shell', 'agenda (tema claro) preservada sem shell escuro');
assertIncludes('acessibilidade.html', 'data-ns-shell', 'acessibilidade (tema escuro) herda o shell unificado');
// SUPERMEGA v6.21.0: shell em mais páginas escuras + print styles
assertIncludes('neuroped-shell.css', '@media print', 'shell imprime limpo (esconde nav, cards monocromáticos)');
for (const p of ['filtro-escalas.html','instrumento.html','neuroped-pro.html','secretaria.html','impacto-medicacao.html','neuroped-master-biblioteca.html']) {
  assertIncludes(p, 'data-ns-shell', p+' herda o shell unificado');
}
assertNotIncludes('assinatura-digital.html', 'data-ns-shell', 'assinatura-digital (superfície de documento) preservada sem shell');
// A11y: formulários com label/aria-label (leitor de tela anuncia campos)
assertIncludes('consulta.html', 'label for=', 'consulta associa labels aos campos (a11y)');
assertIncludes('diario-escola-terapias-v2.html', 'for="f_nome"', 'diário associa labels aos campos (a11y)');
assertIncludes('agenda-financeiro.html', 'aria-label=', 'agenda rotula selects/datas (a11y)');
for (const p of ['filtro-escalas.html','banco-escalas.html','mapa-escalas.html','consulta.html']) {
  assertIncludes(p, 'name="description"', p+' tem meta description (SEO)');
}
assertNotIncludes('consulta.html', 'data-ns-shell', 'consulta (superfície de edição) preservada');
assertNotIncludes('neuroped-master-biblioteca.js', 'Farmacoterapia · acesso restrito', 'farmacoterapia liberada como psicoeducação (sem PIN)');
assertIncludes('neuroped-master-biblioteca.js', 'isenta o autor', 'farmacoterapia traz aviso educativo que blinda o autor');
assertIncludes('neuroped-master-biblioteca.js', 'Nunca inicie, ajuste ou suspenda medicação', 'doses trazem alerta contra automedicação');
assertIncludes('neuroped-master-biblioteca.js', 'Faixa de referência — orientativa', 'cada medicamento traz selo orientativo (não prescrição)');
assertNotIncludes('scales-enhance.js', 'background:#fffaf1', 'rodapé do scales-enhance não usa fundo claro');
// páginas legadas viram redirecionamento (sem duplicata clara nem contradição de privacidade)
assertIncludes('consulta-livre.html', "location.replace('./consulta.html", 'consulta-livre (legada) redireciona para consulta.html');
assertIncludes('diario-escola-terapias.html', "location.replace('./diario-escola-terapias-v2.html", 'diário v1 (legado) redireciona para v2');
assertNotIncludes('consulta-livre.html', 'nada é salvo', 'consulta-livre não contradiz a persistência (é redirect)');

// ===== Sintaxe de TODOS os .js da raiz (impede arquivo quebrado/corrompido no deploy) =====
{
  const jsFiles = readdirSync(root).filter(f => f.endsWith('.js'));
  let broken = 0;
  for (const f of jsFiles) {
    try { execSync(`node --check ${JSON.stringify(join(root, f))}`, { stdio: 'pipe' }); }
    catch (e) { fail(`${f} com erro de sintaxe JS`, String(e.stderr || e).split('\n')[0]); broken++; }
  }
  if (!broken) pass(`todos os ${jsFiles.length} arquivos .js da raiz têm sintaxe válida`);
  for (const f of ['instrumento-enhance.js','scales-enhance.js','app-mode.js']) {
    const c = file(f); if (!c) continue;
    const dup = (c.match(/Não se aplica/g) || []).length;
    dup <= 3 ? pass(`${f} sem duplicação em massa`) : fail(`${f} corrompido (linhas duplicadas)`, `${dup}x`);
  }
}

const packageJson=file('package.json');
if(packageJson){try{const parsed=JSON.parse(packageJson);parsed.scripts?.['test:static']?pass('package.json contém script test:static'):fail('package.json sem script test:static');parsed.scripts?.test?pass('package.json contém script test'):warn('package.json sem script test');
  // versão única: cache do service worker e verificador alinhados ao package.json
  const ver=parsed.version;const swc=file('sw.js')||'';const expected=`neuroped-edj-v${ver}`;
  swc.includes(expected)?pass(`sw.js usa cache alinhado ao package.json (${expected})`):fail('sw.js com cache desalinhado da versão',`esperava ${expected}`);
  (file('verificar-app.html')||'').includes(`'${ver}'`)?pass(`verificar-app.html referencia a versão canônica ${ver}`):fail('verificar-app.html não referencia a versão canônica',ver);
}catch(e){fail('package.json inválido',e.message)}}

// ===== Compliance de identidade (varredura cross-file, anti-regressão) =====
{
  const htmlFiles = readdirSync(root).filter(f => f.endsWith('.html'));
  let crmBad = [], addrBad = [];
  // Registro profissional: SÓ CRM-PE 25227. Qualquer outro CRM de UF é divergente.
  const crmRe = /CRM[-\s]?([A-Z]{2})\s?\d/g;
  // Endereço: aceitar apenas a forma canônica padronizada.
  const oldAddrRe = /Raimundo Lacerda,\s*(00?1|nº\s*1)\b/;
  for (const f of htmlFiles) {
    const c = file(f);
    let m; while ((m = crmRe.exec(c))) { if (m[1] !== 'PE') crmBad.push(`${f}:${m[0]}`); }
    if (oldAddrRe.test(c)) addrBad.push(f);
  }
  crmBad.length === 0 ? pass('compliance: nenhum CRM divergente (só CRM-PE) em todo o app')
    : fail('compliance: CRM divergente encontrado (deve ser só CRM-PE)', crmBad.join(', '));
  addrBad.length === 0 ? pass('compliance: endereço na forma canônica (Casa 01 — Bairro São José) em todo o app')
    : fail('compliance: endereço em formato divergente', addrBad.join(', '));
}

// Frescor do bundle: deve bater com a concatenação dos fontes (evita bundle defasado)
try {
  const { buildBundle } = await import("./build-scales-bundle.mjs");
  const onDisk = file("scales-bundle.js");
  buildBundle(root).trim() === onDisk.trim() ? pass("scales-bundle está fresco (= concatenação dos fontes)") : fail("scales-bundle DEFASADO — rode: node scripts/build-scales-bundle.mjs");
} catch (e) { warn("não validou frescor do bundle", String(e)); }

// Design system (SUPERNEUROPED fase 1 + 3)
assertFile('tokens.css');
assertFile('components.css');
assertFile('scripts/design-audit.mjs');
assertIncludes('tokens.css', '--space-1:', 'tokens escala 4 px (--space-1 a --space-16)');
assertIncludes('tokens.css', '--radius-sm: 8px', 'tokens raios sm/md/lg/xl');
assertIncludes('tokens.css', '--shadow-1:', 'tokens sombras em 3 camadas');
assertIncludes('tokens.css', '--primary:        #7C3AED', 'tokens primary = violeta SuperNeuroPed (briefing definitivo)');
assertIncludes(  'tokens.css', '[data-theme="light"]', 'tokens definem light via data-theme (dark = padrão)');
assertIncludes(  'tokens.css', '--accent-gold:', 'tokens preservam o realce dourado da marca');
assertIncludes(  'tokens.css', '--bg:            #030712', 'fundo padrão = navy profundo (DNA SuperNeuroPed)');
assertIncludes(  'tokens.css', '--primary-gradient:', 'tokens definem gradient violeta-azul CTA');
assertFile('app-skin.css');
assertFile('animations.css');
assertFile('app-frame.js');
assertIncludes('app-skin.css', 'backdrop-filter', 'app-skin usa glassmorphism (backdrop-filter)');
assertIncludes('app-skin.css', 'safe-area-inset', 'app-skin respeita safe-area iOS/Android');
assertIncludes('animations.css', '@keyframes np-fade-up', 'animations define fade-up');
assertIncludes('animations.css', '@keyframes np-shimmer', 'animations define shimmer skeleton');
assertIncludes('app-frame.js', 'npFrameHeader', 'app-frame injeta header brand universal');
assertIncludes('app-frame.js', 'npFrameNav', 'app-frame injeta bottom nav universal');
assertIncludes(  'sw.js', "'./tokens.css'", 'tokens.css no precache do SW (design system offline)');
assertIncludes(  'sw.js', "'./components.css'", 'components.css no precache do SW (design system offline)');
assertIncludes(  'tokens.css', 'prefers-reduced-motion: reduce', 'tokens anulam motion em prefers-reduced-motion');
assertIncludes(  'components.css', '.np-card', 'components define .np-card');
assertIncludes(  'components.css', '.np-btn--primary', 'components define .np-btn--primary');
assertIncludes(  'components.css', '.np-input', 'components define .np-input');
assertIncludes(  'components.css', '.np-badge', 'components define .np-badge');
assertIncludes(  'components.css', '.np-modal', 'components define .np-modal');
assertIncludes(  'components.css', '.np-table', 'components define .np-table');
assertIncludes(  'components.css', '.np-sidebar', 'components define .np-sidebar');
assertIncludes(  'components.css', '.np-skeleton', 'components define .np-skeleton');
assertIncludes(  'components.css', '.np-empty', 'components define .np-empty');
assertNotIncludes('components.css', '#2D6FF0', 'components NAO contem hex cru (consome tokens)');
for (const p of ['index.html','consulta.html','filtro-escalas.html','escalas.html','banco-escalas.html']) {
  assertIncludes(p, 'tokens.css', p + ' carrega tokens.css');
  assertIncludes(p, 'components.css', p + ' carrega components.css');
}
// Fase 4 Lote C — telas de apoio consomem os tokens (cores via var(--*), sem hex cru no :root)
for (const p of ['comunicacao-alternativa.html','impacto-medicacao.html','sobre-dr-jadson.html']) {
  assertIncludes(p, 'var(--primary)', p + ' (Lote C) consome o token de cor primária');
  assertIncludes(p, 'var(--text)', p + ' (Lote C) consome o token de texto');
}
// Regressão: canvas NÃO pode usar var(--token) cru — o contexto 2D ignora e o gráfico
// fica sem cor. Tem de resolver em runtime (cvar via getComputedStyle).
assertNotIncludes('agenda-financeiro.html', "Style = 'var(--", 'canvas resolve cor em runtime (cvar), não var() cru');
assertIncludes('agenda-financeiro.html', 'function cvar', 'agenda resolve token do CSS p/ o canvas (theme-aware)');
// Regressão app-wide: var(--token) em ATRIBUTO de apresentação SVG (fill=/stroke=/
// stop-color=) NÃO resolve em vários navegadores → ícone/gráfico fica preto/invisível.
// O correto é style="fill:var(--x)". Pega a classe inteira de bug (efeito de migração em massa).
{
  const reAttr = /(?:fill|stroke|stop-color|flood-color)="var\(--[a-z0-9-]+\)"/i;
  const offenders = readdirSync(root).filter(f => f.endsWith('.html'))
    .filter(f => reAttr.test(readFileSync(join(root, f), 'utf8')));
  offenders.length === 0
    ? pass('nenhum SVG usa var(--token) em atributo de apresentação (usa style= — resolve em todo navegador)')
    : fail('SVG com var() em atributo de apresentação (invisível em Safari/etc.): ' + offenders.join(', '), 'troque por style="fill:var(--x)"');
}
// Perf: ambient-effects não empilha em iframe (np-frame abre páginas dentro de outra)
assertIncludes('ambient-effects.js', 'ancestorHasAmbient', 'ambient não duplica aurora/partículas quando a página abre dentro de outra (perf tablet)');
// CRÍTICO: todo <script> inline executável tem de PARSEAR. Pega regressão de
// edição em massa (ex.: injeção de <link>/<script> + \n DENTRO de string de doc
// de impressão → quebra a string e/ou trunca o script com </script> literal).
{
  let broken = 0, scanned = 0;
  for (const f of readdirSync(root).filter(f => f.endsWith('.html'))) {
    const html = readFileSync(join(root, f), 'utf8');
    for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
      const attrs = m[1] || '';
      if (/\bsrc=/i.test(attrs)) continue;
      const tm = attrs.match(/\btype\s*=\s*["']?([^"'\s>]+)/i);
      if (tm && !/javascript|module/.test(tm[1].toLowerCase())) continue; // pula ld+json
      scanned++;
      try { new Function(m[2]); }
      catch (e) { broken++; fail(`script inline quebrado em ${f}`, e.message.split('\n')[0]); }
    }
  }
  if (!broken) pass(`todos os ${scanned} <script> inline executáveis parseiam (sem quebra por edição em massa)`);
}
// Taxonomia clínica de instrumentos (fundação do módulo de escalas/testes)
assertFile('scales-taxonomy.js');
assertIncludes('sw.js', "'./scales-taxonomy.js'", 'taxonomia no precache do SW (offline)');
{
  const require = createRequire(import.meta.url);
  const tax = require(join(root, 'scales-taxonomy.js'));
  const cases = [
    [{ direct_test: true, title: 'Span de dígitos' }, 'teste_direto'],
    [{ title: 'Nomeação automática rápida (RAN) — leitura' }, 'teste_direto'],
    [{ title: 'Protocolo de observação — contato ocular e brincar simbólico' }, 'observacao'],
    [{ title: 'M-CHAT-R/F triagem de autismo' }, 'triagem'],
    [{ title: 'Inventário de comportamento CBCL' }, 'inventario'],
    [{ audience: 'autoteste', title: 'Autorrelato do adolescente' }, 'autorrelato'],
    [{ audience: 'escola', title: 'versão professor' }, 'escala_escola'],
    [{ audience: 'pais', title: 'questionário para os pais' }, 'escala_pais'],
  ];
  const wrong = cases.filter(([inp, exp]) => tax.classify(inp).kind !== exp);
  wrong.length === 0
    ? pass(`taxonomia classifica os ${cases.length} tipos (escala parental × teste direto × inventário × observação × triagem…)`)
    : fail('taxonomia errou', wrong.map(([i, e]) => (i.title || '') + '≠' + e).join(' · '));
  (tax.functionalExamples('tdah') && tax.functionalExamples('tea'))
    ? pass('taxonomia expõe exemplos funcionais por queixa (prompts genéricos, não itens de instrumento)')
    : fail('functionalExamples ausente');
  // (B) anti over-call: escala de avaliação clínica NÃO pode virar "teste direto"
  const naoDireto = [
    { audience: 'clinico', title: 'Protocolo de Exames TEA/TDAH/Farmacogenética' },
    { audience: 'clinico', title: 'TDL e Aprendizagem Escolar até 8 anos' },
    { audience: 'clinico', title: 'Avaliação de consciência fonológica' },
  ];
  naoDireto.every(s => tax.classify(s).kind !== 'teste_direto')
    ? pass('classify não rotula escala clínica como teste_direto (refino contra catálogo real)')
    : fail('classify ainda super-rotula teste_direto', naoDireto.map(s => s.title + '→' + tax.classify(s).kind).join(' · '));
  // (C, pré-ligação) balanceByType: mistura modalidades no topo (não empilha 3 parentais)
  if (typeof tax.balanceByType === 'function') {
    const pool = [
      { title: 'Questionário de linguagem para pais', audience: 'pais' },
      { title: 'Escala de desenvolvimento — pais', audience: 'pais' },
      { title: 'M-CHAT-R/F triagem de autismo' },
      { title: 'Tarefa de resposta ao nome', direct_test: true },
    ];
    const top = tax.balanceByType(pool, 3);
    const distinct = new Set(top.map(tax.bucketOf)).size;
    (distinct >= 3 && tax.bucketOf(top[1]) !== 'familia')
      ? pass('balanceByType diversifica modalidade no topo (teste direto/triagem entram, não 3 questionários parentais)')
      : fail('balanceByType não diversificou', top.map(tax.bucketOf).join(','));
  } else { fail('balanceByType ausente'); }
}
// Camada de perguntas-guia enriquecidas (dados frios, prontos p/ o runner)
assertFile('scales-questions.js');
assertIncludes('sw.js', "'./scales-questions.js'", 'perguntas-guia no precache do SW (offline)');
assertIncludes('scales-questions.js', 'NÃO são itens de instrumentos proprietários', 'perguntas-guia declaram conformidade (não reproduzem itens protegidos)');
{
  const require = createRequire(import.meta.url);
  const Q = require(join(root, 'scales-questions.js'));
  const g = Q.guide('tdah', 84);
  const ok = Array.isArray(g) && g.length >= 1 && g.every(x => x.pergunta && x.emoji && Array.isArray(x.exemplos) && Array.isArray(x.contexto) && Array.isArray(x.faixa));
  ok ? pass(`perguntas-guia enriquecidas (emoji+exemplos+contexto+faixa) — ${g.length} p/ TDAH @84m`)
     : fail('schema de pergunta-guia incompleto');
  // adaptação por idade nunca esvazia + fallback genérico (queixa sem guia curado)
  (Q.guide('tdah', 30).length >= 1 && Q.guide('sono', 48).length >= 1)
    ? pass('guia adapta por idade sem esvaziar e tem fallback genérico (queixa sem guia curado)')
    : fail('guia esvaziou por idade/fallback');
}
// Modo fadiga + salvar/retomar progresso (helper puro, pronto p/ o runner)
assertFile('scales-progress.js');
assertIncludes('sw.js', "'./scales-progress.js'", 'progresso de escala no precache do SW (offline)');
{
  const require = createRequire(import.meta.url);
  const P = require(join(root, 'scales-progress.js'));
  // fadiga (pura): blocos balanceados, sem bloco órfão de 1 item
  const plan = P.blockPlan(20, 8).map(b => b.count);
  const balanced = plan.reduce((a, b) => a + b, 0) === 20 && Math.min(...plan) >= Math.max(...plan) - 1;
  (P.isLong(20) && !P.isLong(10) && balanced && P.shouldOfferBreak(8, 8) && !P.shouldOfferBreak(0, 8))
    ? pass('fadiga: isLong + blocos balanceados (' + plan.join('/') + ') + pausa no limite de bloco')
    : fail('lógica de fadiga incorreta', plan.join('/'));
  // salvar → retomar → limpar
  P.save({ instrumentId: 't1', childCode: 'c1', index: 4, total: 18 });
  const r = P.load('t1', 'c1');
  (r && r.index === 4 && P.percent(r) === 22 && (P.clear('t1', 'c1'), P.load('t1', 'c1') === null))
    ? pass('progresso salva/retoma/limpa (retomar de onde parou — reduz abandono)')
    : fail('save/load/clear de progresso falhou');
}
// Trilhos da curadoria de evidência: validador anti-fabricação (afirmação sem citação reprova)
assertFile('clinical-meta.js');
assertFile('evidence-registry.json'); assertFile('clinical-ontology.json');
assertIncludes('sw.js', "'./clinical-meta.js'", 'loader de meta clínica no precache do SW');
{
  const require = createRequire(import.meta.url);
  const M = require(join(root, 'clinical-meta.js'));
  // 1) o registry real (só template hoje) tem de ser válido
  let ev = {}; try { ev = JSON.parse(readFileSync(join(root, 'evidence-registry.json'), 'utf8')); } catch (e) {}
  M.validateRegistry(ev).ok
    ? pass('evidence-registry válido (sem afirmação sem fonte)')
    : fail('evidence-registry inválido', M.validateRegistry(ev).errors.join(' · '));
  // 2) o validador REPROVA claim sem citação (garante a regra anti-fabricação)
  const bad = { instruments: { x: { guideline_support: [{ body: 'AAP', statement: 's' }], evidence_level: 'A' } } };
  const good = { instruments: { x: { guideline_support: [{ body: 'AAP', statement: 's', citation: 'AAP 2020' }] } } };
  (!M.validateRegistry(bad).ok && M.validateRegistry(good).ok)
    ? pass('validador bloqueia afirmação clínica SEM citação e aceita COM citação (anti-fabricação)')
    : fail('validador de evidência não aplica a regra de citação');
  // 3) TODA entrada curada tem fonte primária + PMID rastreável (Fase 1 + GMFCS/MACS)
  const cur = M.curatedOnly(ev);
  const ids = Object.keys(cur);
  const semPmid = ids.filter(id => !(cur[id].validation_sources || []).some(s => /^\d{6,9}$/.test(String(s.pmid || ''))));
  (ids.length >= 7 && semPmid.length === 0)
    ? pass(`evidence-registry: ${ids.length} instrumentos curados, todos com fonte primária + PMID`)
    : fail('entrada curada sem PMID rastreável', semPmid.join(', ') || ('curados=' + ids.length));
  // PVI-L: toda fonte curada declara verification (proveniência)
  const semVer = ids.filter(id => (cur[id].validation_sources || []).some(s => !s.verification || !String(s.verification).trim()));
  semVer.length === 0
    ? pass('PVI-L: toda fonte curada declara verification (✔/◻/⚠ — proveniência)')
    : fail('fonte curada sem verification (PVI-L)', semVer.join(', '));
}
// PVI-L: o gerador da declaração de pendências roda a partir do registro vivo
assertFile('scripts/pvi-l-report.mjs');
assertIncludes('scripts/pvi-l-report.mjs', 'evidence-registry.json', 'pvi-l-report gera a declaração a partir do registro vivo (não cópia que drifta)');
// Integração (A): filtro usa a taxonomia (selo de tipo + exemplos funcionais)
assertIncludes('filtro-escalas.html', 'scales-taxonomy.js', 'filtro carrega a taxonomia');
assertIncludes('filtro-escalas.html', 'NeuroPedTaxonomy.classify', 'filtro mostra o TIPO do instrumento no card (teste direto × escala dos pais…)');
assertIncludes('filtro-escalas.html', 'NeuroPedTaxonomy.functionalExamples', 'filtro injeta exemplos funcionais (o que observar) no raciocínio');
assertIncludes('filtro-escalas.html', 'clinical-meta.js', 'filtro carrega a meta clínica (evidência curada)');
assertIncludes('filtro-escalas.html', 'NeuroPedMeta.evidence', 'filtro mostra 📚 Evidência (citação + PMID) quando o instrumento tem fonte curada');
assertIncludes('clinical-meta.js', 'api.load()', 'clinical-meta auto-carrega o registry no browser');

// ── Sumário (no FIM: garante que TODAS as asserções, inclusive as do design
//    system, sejam contadas e que uma falha aqui faça o CI falhar) ──
console.log('\nNeuroPed static quality check');
console.log('============================');
console.log(oks.join('\n'));
if(warnings.length) console.log('\nWarnings:\n'+warnings.join('\n'));
if(failures.length){console.error('\nFailures:\n'+failures.join('\n'));process.exit(1)}
console.log(`\nResultado: ${oks.length} OK, ${warnings.length} aviso(s), 0 falhas.`);

// Camada Apple Secret Lab (manifesto NEUROPED SUPERSYSTEM)
assertFile('ambient-effects.js');
assertIncludes('ambient-effects.js', 'npAmbientAurora', 'ambient: breathing aurora overlay');
assertIncludes('ambient-effects.js', 'npAmbientNoise', 'ambient: noise cinematográfico SVG fractal');
assertIncludes('ambient-effects.js', 'npAmbientParticles', 'ambient: partículas neurodigitais drift');
assertIncludes('ambient-effects.js', 'np-bloom', 'ambient: bloom interno reativo em cards');
assertIncludes('ambient-effects.js', 'prefers-reduced-motion', 'ambient respeita prefers-reduced-motion');
assertIncludes('tokens.css', 'Plus Jakarta Sans', 'tokens incluem Plus Jakarta Sans no font stack');
assertIncludes('tokens.css', '--glow-violet:', 'tokens definem --glow-violet específico');
assertIncludes('tokens.css', '--glow-cyan:', 'tokens definem --glow-cyan específico');
