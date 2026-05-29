import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

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
assertIncludes('index.html', './consulta-bridge.js', 'index.html carrega o bridge de roteamento');
assertIncludes('filtro-escalas.html', 'scales-enhance.js', 'filtro-escalas carrega scales-enhance.js');
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
assertIncludes('filtro-escalas.html', './scales-453-authorial.js', 'filtro liga os geradores (453+)');
assertIncludes('filtro-escalas.html', './scales-diarios-uteis.js', 'filtro liga diários/testes/ferramentas');
assertIncludes('mapa-escalas.html', './scales-global-max.js', 'mapa liga o global-max');
assertIncludes('instrumento.html', './scales-diarios-uteis.js', 'instrumento liga o catálogo completo');
assertFile('instrumento.html');
assertIncludes('instrumento.html', 'nunca/ausente', 'instrumento tem respostas clicáveis (escala 0–4)');
assertIncludes('instrumento.html', 'Faixa orientativa', 'instrumento gera resultado/faixa ao final');
assertIncludes('filtro-escalas.html', 'r.page', 'filtro tem botão Abrir para o instrumento');
// Validados + curadoria honesta






assertIncludes('filtro-escalas.html', './scales-curate.js', 'filtro liga a curadoria (enxuga + rótulos)');
assertIncludes('scales-curate.js', 'NEUROPED_CATALOG_STATS', 'curadoria publica estatística honesta');
// Catálogo oficial de terceiros (conformidade: sem itens, com fonte)
assertFile('scales-oficiais.js'); assertFile('scales-curate.js');
assertIncludes('scales-oficiais.js', 'official_url', 'catálogo oficial traz link de fonte oficial');
assertIncludes('scales-oficiais.js', 'official_catalog', 'itens oficiais marcados como catálogo (não aplicáveis)');
assertIncludes('scales-oficiais.js', 'mchatscreen.com', 'M-CHAT como catálogo+fonte (sem itens)');
assertNotIncludes('scales-oficiais.js', 'plain_questions:[\'', 'catálogo oficial NÃO reproduz perguntas');
assertIncludes('filtro-escalas.html', './scales-oficiais.js', 'filtro liga o catálogo oficial');
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
assertIncludes('filtro-escalas.html', './scales-autorais-npe.js', 'filtro liga os autorais NPE-BR');
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
// favicon e página de teste sem paleta antiga
assertNotIncludes('index.html', "fill='%231a6b65'", 'favicon não usa mais o teal antigo');
assertIncludes('teste-e2e-manual.html', 'noindex', 'página de teste interna marcada como noindex');

// ===== Filtro: visões/triangulação + impacto pós-medicação =====
assertFile('scales-impacto-medicacao.js');
assertFile('impacto-medicacao.html');
assertIncludes('scales-impacto-medicacao.js', 'npe-med-pais', 'inventário pós-medicação visão família');
assertIncludes('scales-impacto-medicacao.js', 'npe-med-escola', 'inventário pós-medicação visão escola');
assertIncludes('impacto-medicacao.html', 'content="#0e0e22"', 'impacto-medicacao no tema índigo');
assertIncludes('impacto-medicacao.html', 'eficácia farmacológica', 'impacto deixa claro que não mede eficácia');
assertIncludes('filtro-escalas.html', 'renderTriangulation', 'filtro sugere 3 visões distintas (triangulação)');
assertIncludes('filtro-escalas.html', 'scales-impacto-medicacao.js', 'filtro carrega os inventários pós-medicação');
assertIncludes('filtro-escalas.html', 'Teste direto com a criança', 'filtro distingue teste direto com a criança');
assertIncludes('filtro-escalas.html', 'Autorrelato', 'filtro distingue autorrelato');

const packageJson=file('package.json');
if(packageJson){try{const parsed=JSON.parse(packageJson);parsed.scripts?.['test:static']?pass('package.json contém script test:static'):fail('package.json sem script test:static');parsed.scripts?.test?pass('package.json contém script test'):warn('package.json sem script test');
  // versão única: cache do service worker e verificador alinhados ao package.json
  const ver=parsed.version;const swc=file('sw.js')||'';const expected=`neuroped-edj-v${ver}`;
  swc.includes(expected)?pass(`sw.js usa cache alinhado ao package.json (${expected})`):fail('sw.js com cache desalinhado da versão',`esperava ${expected}`);
  (file('verificar-app.html')||'').includes(`'${ver}'`)?pass(`verificar-app.html referencia a versão canônica ${ver}`):fail('verificar-app.html não referencia a versão canônica',ver);
}catch(e){fail('package.json inválido',e.message)}}

console.log('\nNeuroPed static quality check');
console.log('============================');
console.log(oks.join('\n'));
if(warnings.length) console.log('\nWarnings:\n'+warnings.join('\n'));
if(failures.length){console.error('\nFailures:\n'+failures.join('\n'));process.exit(1)}
console.log(`\nResultado: ${oks.length} OK, ${warnings.length} aviso(s), 0 falhas.`);
