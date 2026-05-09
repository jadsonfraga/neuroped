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
function assertIncludes(path, needle, name) {
  const content = file(path);
  if (!content) return fail(name, `${path} ausente`);
  content.includes(needle) ? pass(name) : fail(name, `não encontrou ${needle}`);
}
function assertNotIncludes(path, needle, name) {
  const content = file(path);
  if (!content) return fail(name, `${path} ausente`);
  !content.includes(needle) ? pass(name) : fail(name, `encontrou ${needle}`);
}

const criticalFiles = [
  'index.html',
  'manifest.json',
  'sw.js',
  'routes.config.js',
  'storage-policy.js',
  'app-mode.js',
  'teste-ouro-pin.html',
  'qualidade-neuroped.html',
  'auditoria-operacional.html',
  'consulta.html',
  'consulta-safe-exit.js',
  'consulta-pin-fix.js',
  'consulta-next-redirect.js',
  'consulta-documentos.js',
  'consulta-voz.js',
  'consulta-docflow.js',
  'verificar-documento.html',
  'portal-familia-livre.html',
  'comunicacao-alternativa.html',
  'diario-escola-terapias-v2.html',
  'filtro-escalas.html',
  'mapa-escalas.html',
  'scales-index.json',
  'docs/REGRAS_CRITICAS_ANTES_DE_ALTERAR.md',
  'docs/AUDITORIA_CONTINUA_NEUROPED.md',
  'docs/LGPD_CHECKLIST.md',
  'docs/PLANO_BACKEND_GRATUITO.md',
  'docs/MEMORIA_E_EMBEDDINGS.md'
];

for (const f of criticalFiles) assertFile(f);

assertIncludes('sw.js', 'neuroped-v40-consulta-clinical-suite', 'service worker está na versão v40');
for (const cached of [
  './routes.config.js',
  './storage-policy.js',
  './app-mode.js',
  './teste-ouro-pin.html',
  './qualidade-neuroped.html',
  './consulta-safe-exit.js',
  './consulta-pin-fix.js',
  './consulta-next-redirect.js',
  './consulta-documentos.js',
  './consulta-voz.js',
  './consulta-docflow.js',
  './verificar-documento.html'
]) {
  assertIncludes('sw.js', cached, `cache inclui ${cached}`);
}

assertIncludes('manifest.json', 'Qualidade NeuroPed', 'manifest inclui atalho de qualidade');
assertIncludes('manifest.json', 'Teste de Ouro do PIN', 'manifest inclui teste de ouro do PIN');
assertIncludes('manifest.json', 'CAA Gratuita', 'manifest mantém CAA Gratuita');
assertNotIncludes('manifest.json', 'CAA Premium', 'manifest não contém CAA Premium');

assertIncludes('routes.config.js', 'NEUROPED_ROUTES', 'routes.config.js expõe NEUROPED_ROUTES');
assertIncludes('routes.config.js', 'requiresPin:true', 'routes.config.js marca rotas protegidas');
assertIncludes('storage-policy.js', 'semanticSearchStatus', 'storage-policy declara semanticSearchStatus');
assertIncludes('storage-policy.js', 'not_configured', 'storage-policy mantém fallback honesto de embeddings');
assertIncludes('storage-policy.js', 'sensitiveStorage', 'storage-policy declara sensitiveStorage');
assertIncludes('app-mode.js', 'HOMOLOGAÇÃO', 'app-mode declara modo HOMOLOGAÇÃO');

assertIncludes('consulta-safe-exit.js', 'after-fail', 'consulta-safe-exit só mostra retorno após erro');
assertIncludes('consulta-safe-exit.js', 'Senha não conferiu', 'consulta-safe-exit identifica erro de senha');
assertIncludes('consulta-pin-fix.js', 'inputmode', 'consulta-pin-fix ajusta inputmode');
assertIncludes('consulta-pin-fix.js', 'text', 'consulta-pin-fix usa teclado alfanumérico');
assertIncludes('consulta-pin-fix.js', 'toLowerCase', 'consulta-pin-fix normaliza PIN alfanumérico');
assertIncludes('consulta-next-redirect.js', 'nextPath', 'consulta-next-redirect lê nextPath');
assertIncludes('consulta-next-redirect.js', 'index.html#', 'consulta-next-redirect retorna para rota solicitada');
assertIncludes('safe-public-layer.js', 'consulta.html?next=', 'safe-public-layer envia área sensível primeiro para PIN');

assertIncludes('consulta-voz.js', 'SpeechRecognition', 'consulta tem anamnese por voz quando navegador permite');
assertIncludes('consulta-voz.js', 'pt-BR', 'anamnese por voz usa português do Brasil');
assertIncludes('consulta-docflow.js', 'Solicitação de exames', 'consulta tem solicitação de exames');
assertIncludes('consulta-docflow.js', 'Receituário livre', 'consulta tem receituário livre/manual');
assertIncludes('consulta-docflow.js', 'Laudo / relatório com PDF', 'consulta tem gerador de laudos/relatórios imprimíveis');
assertIncludes('consulta-docflow.js', 'Não são assinatura digital ICP-Brasil', 'consulta documenta limite do QR/código');
assertIncludes('consulta-docflow.js', 'api.qrserver.com', 'consulta gera QR code para conferência');
assertIncludes('verificar-documento.html', 'não é assinatura digital ICP-Brasil', 'verificador documenta limite jurídico');

assertIncludes('qualidade-neuroped.html', './app-mode.js', 'painel de qualidade carrega app-mode.js diretamente');
assertIncludes('qualidade-neuroped.html', 'NEUROPED_APP_MODE.mode', 'painel valida modo do app');
assertIncludes('teste-ouro-pin.html', 'Área sensível vai primeiro ao PIN', 'teste de ouro cobre área sensível para PIN');
assertIncludes('teste-ouro-pin.html', 'PIN alfanumérico', 'teste de ouro cobre PIN alfanumérico');

assertIncludes('docs/REGRAS_CRITICAS_ANTES_DE_ALTERAR.md', 'Nunca mostrar “voltar para conteúdo educacional” antes da tentativa de PIN', 'regra crítica do PIN documentada');
assertIncludes('docs/LGPD_CHECKLIST.md', 'Não apto para produção com dados clínicos reais', 'LGPD deixa produção real bloqueada');
assertIncludes('docs/MEMORIA_E_EMBEDDINGS.md', 'semanticSearchStatus', 'memória/embeddings documenta status honesto');

const packageJson = file('package.json');
if (packageJson) {
  try {
    const parsed = JSON.parse(packageJson);
    parsed.scripts?.['test:static'] ? pass('package.json contém script test:static') : fail('package.json sem script test:static');
    parsed.scripts?.test ? pass('package.json contém script test') : warn('package.json sem script test');
  } catch (e) {
    fail('package.json inválido', e.message);
  }
}

console.log('\nNeuroPed static quality check');
console.log('============================');
console.log(oks.join('\n'));
if (warnings.length) console.log('\nWarnings:\n' + warnings.join('\n'));
if (failures.length) {
  console.error('\nFailures:\n' + failures.join('\n'));
  process.exit(1);
}
console.log(`\nResultado: ${oks.length} OK, ${warnings.length} aviso(s), 0 falhas.`);
