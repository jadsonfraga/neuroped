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

const packageJson=file('package.json');
if(packageJson){try{const parsed=JSON.parse(packageJson);parsed.scripts?.['test:static']?pass('package.json contém script test:static'):fail('package.json sem script test:static');parsed.scripts?.test?pass('package.json contém script test'):warn('package.json sem script test')}catch(e){fail('package.json inválido',e.message)}}

console.log('\nNeuroPed static quality check');
console.log('============================');
console.log(oks.join('\n'));
if(warnings.length) console.log('\nWarnings:\n'+warnings.join('\n'));
if(failures.length){console.error('\nFailures:\n'+failures.join('\n'));process.exit(1)}
console.log(`\nResultado: ${oks.length} OK, ${warnings.length} aviso(s), 0 falhas.`);
