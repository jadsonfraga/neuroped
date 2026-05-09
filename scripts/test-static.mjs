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
  'index.html','manifest.json','sw.js','routes.config.js','storage-policy.js','app-mode.js','premium-experience.js',
  'teste-ouro-pin.html','qualidade-neuroped.html','auditoria-operacional.html','consulta.html','secretaria.html',
  'consulta-safe-exit.js','consulta-pin-fix.js','consulta-next-redirect.js','consulta-documentos.js','consulta-voz.js','consulta-docflow.js','verificar-documento.html',
  'portal-familia-livre.html','comunicacao-alternativa.html','diario-escola-terapias-v2.html','filtro-escalas.html','mapa-escalas.html','scales-index.json',
  'docs/REGRAS_CRITICAS_ANTES_DE_ALTERAR.md','docs/AUDITORIA_CONTINUA_NEUROPED.md','docs/LGPD_CHECKLIST.md','docs/PLANO_BACKEND_GRATUITO.md','docs/MEMORIA_E_EMBEDDINGS.md'
];
for (const f of criticalFiles) assertFile(f);

assertIncludes('sw.js', 'neuroped-v41-app-shell-consulta-livre', 'service worker está na versão v41');
for (const cached of ['./routes.config.js','./app-mode.js','./premium-experience.js','./consulta-documentos.js','./consulta-voz.js','./consulta-docflow.js','./verificar-documento.html','./secretaria.html']) assertIncludes('sw.js', cached, `cache inclui ${cached}`);
assertIncludes('premium-experience.js', 'Dr. Jadson Fraga', 'app shell exibe marca Dr Jadson');
assertIncludes('premium-experience.js', 'Secretaria', 'app shell contém Secretaria');
assertIncludes('premium-experience.js', 'np-shell', 'app shell unificado está presente');
assertIncludes('consulta-documentos.js', 'Consulta médica livre', 'Consulta carrega editor livre');
assertIncludes('consulta-documentos.js', 'Digite, cole ou dite livremente', 'editor livre aceita texto completo');
assertIncludes('consulta-documentos.js', 'data-modelo', 'modelos opcionais existem');
assertIncludes('secretaria.html', 'Secretaria', 'secretaria.html existe e tem título');
assertIncludes('secretaria.html', 'Novo atendimento', 'Secretaria permite novo atendimento');
assertIncludes('secretaria.html', 'Passe familiar', 'Secretaria inclui passe familiar');
assertIncludes('routes.config.js', './secretaria.html', 'routes.config aponta Secretaria para secretaria.html');
assertIncludes('consulta-safe-exit.js', 'after-fail', 'retorno só após erro de PIN');
assertIncludes('consulta-pin-fix.js', 'toLowerCase', 'PIN alfanumérico preservado por fallback');
assertIncludes('safe-public-layer.js', 'consulta.html?next=', 'área sensível vai primeiro para PIN');
assertIncludes('consulta-docflow.js', 'Não são assinatura digital ICP-Brasil', 'QR não promete ICP-Brasil');
assertIncludes('manifest.json', 'CAA Gratuita', 'manifest mantém CAA Gratuita');
assertNotIncludes('manifest.json', 'CAA Premium', 'manifest não contém CAA Premium');
assertIncludes('docs/LGPD_CHECKLIST.md', 'Não apto para produção com dados clínicos reais', 'LGPD deixa produção real bloqueada');
const chtml=file('consulta.html');
if(chtml.includes('inputmode="numeric"')) warn('consulta.html ainda contém inputmode numeric no HTML base', 'fallback consulta-pin-fix.js corrige em runtime'); else pass('consulta.html não contém inputmode numeric');

const packageJson=file('package.json');
if(packageJson){try{const parsed=JSON.parse(packageJson);parsed.scripts?.['test:static']?pass('package.json contém script test:static'):fail('package.json sem script test:static');parsed.scripts?.test?pass('package.json contém script test'):warn('package.json sem script test')}catch(e){fail('package.json inválido',e.message)}}
console.log('\nNeuroPed static quality check');
console.log('============================');
console.log(oks.join('\n'));
if(warnings.length) console.log('\nWarnings:\n'+warnings.join('\n'));
if(failures.length){console.error('\nFailures:\n'+failures.join('\n'));process.exit(1)}
console.log(`\nResultado: ${oks.length} OK, ${warnings.length} aviso(s), 0 falhas.`);
