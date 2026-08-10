import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const app = path.join(root, 'vercel-conecta');
const read = (file) => fs.readFileSync(path.join(app, file), 'utf8');
const fail = (message) => { console.error(`✗ ${message}`); process.exitCode = 1; };
const pass = (message) => console.log(`✓ ${message}`);
const assert = (condition, message) => condition ? pass(message) : fail(message);

const files = [
  'vercel.json',
  'api/proxy.mjs',
  'np-preload.js',
  'np-enhance.js',
  'np-enhance.css',
  'insights.html',
  'insights.js',
  'manifest.webmanifest',
  'brand-logo.jpeg',
];
for (const file of files) {
  const target = path.join(app, file);
  assert(fs.existsSync(target) && fs.statSync(target).size > 0, `${file} existe e não está vazio`);
}

const proxy = read('api/proxy.mjs');
const enhance = read('np-enhance.js');
const preload = read('np-preload.js');
const insightsHtml = read('insights.html');
const insights = read('insights.js');
const css = read('np-enhance.css');
const manifest = read('manifest.webmanifest');
const vercel = read('vercel.json');

assert(proxy.includes("const UPSTREAM = 'https://neuroped-conecta.lovable.app'"), 'upstream HTTPS explícito e único');
assert(proxy.includes('/np-preload.js') && proxy.includes('/np-enhance.js') && proxy.includes('/np-enhance.css'), 'camada premium injetada pelo proxy');
assert(!proxy.includes('service_role') && !insights.includes('service_role'), 'nenhuma service role embutida');
assert(preload.includes('np:supabase:url') && preload.includes('np:supabase:anon'), 'captura somente configuração pública necessária ao insight live');
assert(!preload.includes('access_token') && !preload.includes('refresh_token'), 'preload não persiste tokens de sessão');

assert(insightsHtml.includes('Insight informativo baseado nos registros disponíveis. Não constitui diagnóstico, prescrição ou ajuste de tratamento.'), 'disclaimer clínico explícito em Insights');
assert(insights.includes("state.mode === 'demo'") && insights.includes('loadLive'), 'Insights separa DEMO e LIVE');
assert(insights.includes("if (state.mode === 'demo')") && insights.includes('demoRows()'), 'fixture usada apenas em ramo DEMO explícito');
assert(insights.includes('dados suficientes'), 'insights tratam insuficiência de dados');
assert(insights.includes('Não confirma diagnóstico, causalidade ou resposta a medicamento'), 'limitação causal explícita');

assert(enhance.includes('Conteúdo demonstrativo bloqueado'), 'trava fail-closed contra conteúdo demo em conta real');
assert(enhance.includes('Lucas Demo') && enhance.includes('live'), 'sentinela de vazamento DEMO×LIVE presente');
assert(enhance.includes('REGISTRO SALVO') && enhance.includes('Ver tendência'), 'registro devolve resultado e CTA de tendência');
assert(enhance.includes('/insights'), 'atalho global para Insights');
assert(enhance.includes('Casa × Escola') && enhance.includes('Metas observáveis') && enhance.includes('Tratamento com trava clínica'), 'módulos recebem microcopy funcional específica');
assert(enhance.includes('SAMU 192') && enhance.includes('não coloque nada na boca'), 'diário de crises mantém cartão educativo de segurança');

assert(css.includes(':focus-visible'), 'foco por teclado definido');
assert(css.includes('prefers-reduced-motion'), 'reduced motion respeitado');
assert(css.includes('min-height:44px'), 'alvos de toque mínimos definidos');
assert(css.includes('.dark') || css.includes('[data-theme="dark"]'), 'dark mode refinado');

assert(manifest.includes('"display": "standalone"') && manifest.includes('"start_url": "/app"'), 'PWA standalone preservada');
assert(vercel.includes('api/proxy.mjs') && vercel.includes('/insights'), 'Vercel serve proxy e rota local de Insights');

const dangerous = [
  /\b(aumente|reduza|suspenda|inicie)\s+(a\s+)?dose\b/i,
  /\bconfirma\s+(o\s+)?diagnóstico\b/i,
  /\bdiagnóstico\s+confirmado\b/i,
];
const productText = `${enhance}\n${insightsHtml}\n${insights}`;
for (const re of dangerous) assert(!re.test(productText), `microcopy não contém padrão perigoso ${re}`);

if (process.exitCode) {
  console.error('\nAnti-regressão NeuroPed Conecta: FALHOU.');
  process.exit(process.exitCode);
}
console.log('\nAnti-regressão NeuroPed Conecta: APROVADO.');
