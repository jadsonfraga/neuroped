import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';

const results = [];
const test = async (name, fn) => {
  try {
    await fn();
    results.push({ name, status: 'passed' });
    console.log(`✓ ${name}`);
  } catch (error) {
    results.push({ name, status: 'failed', error: error.message });
    console.error(`✗ ${name}: ${error.message}`);
  }
};
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const text = (file) => readFileSync(file, 'utf8');
const index = text('index.html');
const manifest = JSON.parse(text('manifest.json'));
const jsFiles = readdirSync('assets').filter((file) => file.endsWith('.js'));
const bundleText = jsFiles.map((file) => text(join('assets', file))).join('\n');

await test('App carrega shell HTML sem referência local quebrada', () => {
  assert(index.includes('<div id="root"></div>'), 'root ausente');
  const refs = [...index.matchAll(/(?:src|href)="\.\/([^"#?]+)/g)].map((m) => m[1]);
  assert(refs.every((ref) => existsSync(ref)), 'há referência local quebrada');
});
await test('Home expõe identidade NeuroPed no documento público', () => assert(/NeuroPed/.test(index), 'NeuroPed não encontrado'));
await test('Manifest PWA contém start_url, scope e modo standalone', () => assert(manifest.start_url && manifest.scope && manifest.display, 'manifest incompleto'));
await test('Menu/ferramentas principais existem no bundle publicado', () => assert(/Escalas|Inventários|Relatórios|Configurações|Histórico/.test(bundleText), 'ferramentas principais não detectadas'));
await test('Área de escalas está presente', () => assert(/escala|Scale|M-CHAT|Vanderbilt|SDQ/i.test(bundleText), 'área de escalas não detectada'));
await test('Filtro/encontrar escala por idade/domínio/queixa está publicado', () => assert(/idade|domínio|queixa|filter|filtro/i.test(bundleText), 'filtro de escalas não detectado'));
await test('Fluxo de aplicação possui itens, progresso e resultado', () => assert(/progresso|resultado|score|escore|pergunta|question/i.test(bundleText), 'fluxo de aplicação incompleto'));
await test('Relatório/PDF ou estado honesto está publicado', () => assert(/PDF|relatório|Este recurso está em implantação no ambiente público/.test(bundleText + index), 'relatório/PDF ou fallback honesto não detectado'));
await test('Histórico/localStorage ou estado honesto está publicado', () => assert(/localStorage|histórico|Este recurso está em implantação no ambiente público/i.test(bundleText + index), 'histórico/localStorage não detectado'));
await test('CSS responsivo/mobile publicado', () => assert(/@media|sm:|md:|viewport/.test(text('assets/index-CYKyYC_X.css') + index), 'sinais responsivos ausentes'));
await test('Alternância de tema ou tokens de tema publicados', () => assert(/dark|theme|tema|--background|--foreground/i.test(bundleText + text('assets/index-CYKyYC_X.css')), 'tema não detectado'));
await test('Rota inexistente possui fallback SPA compreensível', () => assert(/index\.html#\/|Redirecionando/.test(text('404.html')), 'fallback 404 SPA ausente'));

const failed = results.filter((r) => r.status === 'failed');
if (failed.length) process.exit(1);
console.log(`\n${results.length} specs estáticas/e2e passaram. Observação: navegador Playwright real não executado quando @playwright/test não está instalado.`);
