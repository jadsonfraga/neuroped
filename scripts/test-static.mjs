import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

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
// SEO: páginas públicas têm og:image + canonical + twitter (compartilhamento/busca)
for (const p of ['escalas.html','central-atalhos.html','sobre-dr-jadson.html','filtro-escalas.html','mapa-escalas.html','neuroped-pro.html','portal-familia-livre.html']) {
  assertIncludes(p, 'property="og:image"', p+' tem og:image (compartilhamento)');
  assertIncludes(p, 'rel="canonical"', p+' tem canonical (SEO)');
  assertIncludes(p, 'name="twitter:card"', p+' tem twitter card');
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
assertIncludes('filtro-escalas.html', 'central-atalhos.html', 'topbar do filtro volta ao app (hub)');
// Relevância do filtro: queixa casa por token (não substring frouxa) e sem tema derruba
assertIncludes('filtro-escalas.html', 'inalcançável pela não-temática', 'scoreScale usa patamar: escala temática sempre acima da irrelevante');
// Filtro redesenhado: entrada 100% por clique (idade+queixa) e saída = só as 3 mais indicadas
assertIncludes('filtro-escalas.html', 'id="ageChips"', 'idade é selecionada por clique (chips), sem digitar');
assertNotIncludes('filtro-escalas.html', '<textarea id="queixaLivre"', 'sem campo de queixa por digitação (só clique)');
assertIncludes('filtro-escalas.html', 'slice(0,3)', 'filtro retorna as 3 escalas mais indicadas (saída enxuta)');
assertIncludes('filtro-escalas.html', 'r.score>=500', 'filtro só mostra escalas temáticas relevantes (patamar 500+)');
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
for (const p of ['index.html','consulta.html','filtro-escalas.html','instrumento.html','escalas.html','banco-escalas.html','comunicacao-alternativa.html','portal-familia-livre.html','secretaria.html']) {
  assertIncludes(p, 'app-polish-mobile.css', p + ' carrega app-polish-mobile.css');
  assertIncludes(p, 'app-polish-mobile.js',  p + ' carrega app-polish-mobile.js');
}

// Identidade premium: tipografia institucional + capa do hub
assertIncludes('app-polish-mobile.css', 'Fraunces', 'tipografia premium (Fraunces) carregada globalmente');
assertIncludes('app-polish-mobile.css', '--np-font-display', 'fonte display institucional definida');
assertIncludes('index.html', 'fonts.googleapis.com', 'CSP permite Google Fonts (style-src)');
// Unificação visual: cards glassmorphism coesos (mesmo padrão premium do filtro)
assertIncludes('escalas.html', 'backdrop-filter', 'escalas.html usa glassmorphism (visual unificado)');
assertNotIncludes('escalas.html', 'background:linear-gradient(135deg,#ffffff', 'escalas.html sem cards de fundo branco (destoavam)');
assertIncludes('central-atalhos.html', 'backdrop-filter', 'central-atalhos usa glassmorphism (visual unificado)');
assertFile('np-cards.css');
// Perfil da Criança (espinha de dados — conecta filtro/escalas/histórico)
assertFile('np-store.js');
assertFile('perfil-crianca.html');
assertIncludes('np-store.js', 'NeuroPedScales.setPatient', 'criança ativa vira o paciente do sistema (fonte única, sem duplicar)');
assertIncludes('np-store.js', 'np:children', 'perfil usa namespace np:* (camada de dados única)');
assertIncludes('central-atalhos.html', 'perfil-crianca.html', 'hub linka o Perfil da Criança');
// Landing UX (v6.23): busca, recentes, skip-link
assertIncludes('escalas.html', 'id="toolSearch"', 'landing tem busca typeahead');
assertIncludes('escalas.html', 'np_recent_tools', 'landing rastreia acessados recentemente');
assertIncludes('escalas.html', 'skip-link', 'landing tem skip-link (WCAG)');
assertIncludes('escalas.html', 'Pular para o conteúdo', 'skip-link rotulado em pt-BR');
// Refinamento landing: busca acessível
assertIncludes('escalas.html', 'aria-live="polite"', 'busca anuncia resultados ao leitor de tela');
assertIncludes('escalas.html', 'sr-only', 'status de busca visualmente oculto mas lido');
assertIncludes('mapa-escalas.html', 'backdrop-filter', 'mapa-escalas usa glassmorphism (visual unificado)');
assertNotIncludes('mapa-escalas.html', 'background:#dcfce7', 'mapa-escalas sem badges de fundo claro (destoavam)');
assertIncludes('area-filho.html', 'backdrop-filter', 'area-filho usa glassmorphism (visual unificado)');
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
assertIncludes('central-atalhos.html', 'Da triagem ao encaminhamento', 'hub tem capa institucional (posicionamento)');
assertIncludes('central-atalhos.html', 'CRM-PE 25227', 'hub exibe credenciais do profissional');
assertNotIncludes('central-atalhos.html', 'reservada por PIN', 'hub não descreve biblioteca como reservada (já é aberta)');

// Polimento: skeletons, estados vazios, selo de qualidade, acessibilidade
assertIncludes('app-polish-mobile.css', '.np-skel', 'skeleton loaders definidos (sensação de app)');
assertIncludes('app-polish-mobile.css', '.np-empty', 'estado vazio institucional definido');
assertIncludes('filtro-escalas.html', 'np-skel', 'filtro mostra skeleton enquanto carrega');
assertIncludes('app-polish-mobile.js', 'qualitySeal', 'selo de qualidade no rodapé (robustez)');
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
assertIncludes('central-atalhos.html', 'sobre-dr-jadson.html', 'hub linka a página de autoridade');

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
assertIncludes('central-atalhos.html', './neuroped-master-vitrine.html', 'central-atalhos tem card da vitrine NeuroPed Master');
assertIncludes('central-atalhos.html', './solicitar-neuroped-master.html', 'central-atalhos tem card de solicitação');
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
assertIncludes('central-atalhos.html', './neuroped-master-biblioteca.html', 'central-atalhos tem card da Biblioteca Master');
assertIncludes('routes.config.js', 'neuroped-master-biblioteca.html', 'routes.config registra a Biblioteca');

// Gerador de Cards (conteúdo educacional com marca)
for (const f of ['gerador-cards.html','gerador-cards.js']) assertFile(f);
assertNotIncludes('gerador-cards.js', 'NEUROPED_MASTER_PRO.farmaco', 'gerador NÃO usa farmacoterapia (sensível) — só conteúdo educacional');
assertIncludes('gerador-cards.js', 'CRM-PE 25227', 'gerador imprime a marca/credenciais do autor');
assertIncludes('gerador-cards.html', './gerador-cards.js', 'gerador-cards carrega o script');
assertIncludes('central-atalhos.html', './gerador-cards.html', 'central-atalhos tem card do Gerador');
assertIncludes('routes.config.js', 'gerador-cards.html', 'routes.config registra o Gerador');

// App shell — hub dinâmico (chrome persistente, conteúdo em quadro)
assertFile('app-shell.html');
assertIncludes('app-shell.html', 'sh-frame', 'app-shell tem o quadro de conteúdo persistente');
assertIncludes('app-shell.html', 'comunicacao-alternativa.html', 'app-shell roteia a CAA');
assertIncludes('app-shell.html', 'neuroped-master-biblioteca.html', 'app-shell roteia a Biblioteca');
assertIncludes('manifest.json', './app-shell.html', 'manifest aponta o PWA para a casca dinâmica');
assertIncludes('sw.js', './app-shell.html', 'sw precache inclui a casca');
assertIncludes('app-polish-mobile.js', 'EMBEDDED', 'app-polish suprime chrome próprio quando embutido na casca');
// Catálogo de escalas: ligação dos geradores + abertura interativa real
assertFile('scales-diarios-uteis.js');
assertIncludes('scales-bundle.js', 'scales-453-authorial.js', 'filtro liga os geradores (453+)');
assertIncludes('scales-bundle.js', 'scales-diarios-uteis.js', 'filtro liga diários/testes/ferramentas');
assertIncludes('mapa-escalas.html', './scales-global-max.js', 'mapa liga o global-max');
assertIncludes('instrumento.html', './scales-diarios-uteis.js', 'instrumento liga o catálogo completo');
assertFile('instrumento.html');
assertIncludes('instrumento.html', 'nunca/ausente', 'instrumento tem respostas clicáveis (escala 0–4)');
assertIncludes('instrumento.html', 'Faixa orientativa', 'instrumento gera resultado/faixa ao final');
assertIncludes('filtro-escalas.html', 'r.page', 'filtro tem botão Abrir para o instrumento');
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
assertIncludes('portal-familia-livre.html', 'neuroped-pro.html', 'portal da família expõe o NeuroPed Pro (descoberta = vendas)');
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
assertIncludes('central-atalhos.html', 'guia-lancamento.html', 'hub linka o guia de lançamento');
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
assertIncludes('filtro-escalas.html', 'renderTriangulation', 'filtro sugere 3 visões distintas (triangulação)');
assertIncludes('scales-bundle.js', 'scales-impacto-medicacao.js', 'filtro carrega os inventários pós-medicação');
assertIncludes('filtro-escalas.html', 'Teste direto com a criança', 'filtro distingue teste direto com a criança');
assertIncludes('filtro-escalas.html', 'Autorrelato', 'filtro distingue autorrelato');

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
for (const p of ['central-atalhos.html','portal-familia-livre.html','sobre-dr-jadson.html','area-filho.html','comunicacao-alternativa.html','diario-escola-terapias-v2.html','guia-lancamento.html']) {
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

console.log('\nNeuroPed static quality check');
console.log('============================');
console.log(oks.join('\n'));
if(warnings.length) console.log('\nWarnings:\n'+warnings.join('\n'));
if(failures.length){console.error('\nFailures:\n'+failures.join('\n'));process.exit(1)}
console.log(`\nResultado: ${oks.length} OK, ${warnings.length} aviso(s), 0 falhas.`);
