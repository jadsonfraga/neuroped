/* ============================================================================
   tests/run-clinical-tests.mjs — driver de CI dos testes clínicos (V3.2 + V4)
   ----------------------------------------------------------------------------
   Roda NeuroPedTests.runAll() em Node (sem browser): monta um `window` que é um
   EventTarget REAL (addEventListener/dispatchEvent/CustomEvent funcionam), stubs
   de document/local/sessionStorage, dispara DOMContentLoaded p/ os seeds, carrega
   a stack clínica + as suítes V3.2 e V4, e exige passed === total. Captura
   rejeições async (testes V4 são assíncronos). Sai !=0 em qualquer falha.

   Por que Node e não Puppeteer: nenhuma PÁGINA do app carrega a suíte
   (clinical-integrity-tests.js) — abrir testes-diretos.html não expõe
   NeuroPedTests (o job Puppeteer dava timeout). Aqui carregamos a suíte
   explicitamente: determinístico, rápido e verificável localmente (29/29).
   Uso: node tests/run-clinical-tests.mjs
   ============================================================================ */
import { createRequire } from 'node:module';
import { join } from 'node:path';

const require = createRequire(import.meta.url);
const root = process.cwd();

// ── window como EventTarget REAL ───────────────────────────────────────────
const win = new EventTarget();
function softSet(obj, k, v) { try { obj[k] = v; } catch { /* read-only no Node — ok */ } }
softSet(globalThis, 'window', win);
win.window = win;

const noop = () => {};
const elStub = () => ({ style: {}, appendChild: noop, setAttribute: noop, removeAttribute: noop, addEventListener: noop, removeEventListener: noop, classList: { add: noop, remove: noop, toggle: noop, contains: () => false }, querySelector: () => null, querySelectorAll: () => [] });
const doc = {
  addEventListener: noop, removeEventListener: noop, dispatchEvent: () => true,
  querySelector: () => null, querySelectorAll: () => [], getElementById: () => null,
  createElement: elStub, createElementNS: elStub, readyState: 'complete',
  head: elStub(), body: elStub(), documentElement: elStub()
};
softSet(globalThis, 'document', doc); win.document = doc;

const _store = {};
const localStorageStub = {
  getItem: (k) => (k in _store ? _store[k] : null),
  setItem: (k, v) => { _store[k] = String(v); },
  removeItem: (k) => { delete _store[k]; },
  clear: () => { for (const k of Object.keys(_store)) delete _store[k]; },
  key: (i) => Object.keys(_store)[i] || null,
  get length() { return Object.keys(_store).length; }
};
softSet(globalThis, 'localStorage', localStorageStub); win.localStorage = localStorageStub;
// sessionStorage: backing separado (o auth adapter guarda a sessão aqui)
const _sess = {};
const sessionStorageStub = {
  getItem: (k) => (k in _sess ? _sess[k] : null),
  setItem: (k, v) => { _sess[k] = String(v); },
  removeItem: (k) => { delete _sess[k]; },
  clear: () => { for (const k of Object.keys(_sess)) delete _sess[k]; },
  key: (i) => Object.keys(_sess)[i] || null,
  get length() { return Object.keys(_sess).length; }
};
softSet(globalThis, 'sessionStorage', sessionStorageStub); win.sessionStorage = sessionStorageStub;
softSet(globalThis, 'navigator', { userAgent: 'node-ci', vibrate: noop }); win.navigator = globalThis.navigator;
softSet(globalThis, 'location', { href: '', search: '', pathname: '/', origin: 'http://localhost' }); win.location = globalThis.location;
softSet(globalThis, 'fetch', () => Promise.reject(new Error('no fetch in CI')));
win.fetch = globalThis.fetch;

// ── carrega a stack clínica + testes (ordem do app + dependências) ──────────
const MODULES = [
  // catálogo (alguns testes inspecionam instrumentos reais)
  'scales-editorial.js', 'scales-bundle.js',
  // núcleo clínico V3.2
  'clinical-event-bus.js', 'clinical-storage.js', 'clinical-meta.js', 'clinical-engines.js',
  'clinical-governance.js', 'clinical-migrations.js', 'clinical-plugin-sdk.js',
  'clinical-recommendation-pipeline.js', 'clinical-pdf-auditable.js', 'clinical-future-adapters.js',
  'clinical-normalization.js', 'clinical-explainability.js', 'clinical-decision-support.js',
  // suíte V3.2
  'clinical-integrity-tests.js',
  // V4: adapters + integração + suíte
  'clinical-lgpd-consent.js', 'clinical-auth-adapter.js', 'clinical-drive-adapter.js',
  'clinical-fhir-adapter.js', 'clinical-v4-integration.js', 'clinical-v4-tests.js'
];
const loadErrors = [];
for (const f of MODULES) {
  try { require(join(root, f)); }
  catch (e) { loadErrors.push(`${f}: ${e.message}`); }
}

// dispara DOMContentLoaded no window real → roda seeds/inits que os adapters
// registram (seedDoctorProfile do auth, init do v4-integration).
try { win.dispatchEvent(new Event('DOMContentLoaded')); } catch (e) { loadErrors.push('DOMContentLoaded: ' + e.message); }

// ── rejeições não tratadas (testes V4 assíncronos) viram falha ──────────────
const rejections = [];
process.on('unhandledRejection', (r) => { rejections.push(r && r.message ? r.message : String(r)); });

const T = win.NeuroPedTests || globalThis.NeuroPedTests;
if (!T || typeof T.runAll !== 'function') {
  console.error('✗ NeuroPedTests.runAll indisponível. Erros de carga:\n  ' + (loadErrors.join('\n  ') || '(nenhum)'));
  process.exit(1);
}

const report = T.runAll({ verbose: true });

// dá um tick para os testes assíncronos (V4) resolverem/rejeitarem
await new Promise((r) => setTimeout(r, 300));

console.log(`\n[clinical-ci] V3.2+V4: ${report.passed}/${report.total} passaram (${report.pass_rate})`);
if (loadErrors.length) console.log('[clinical-ci] módulos que não carregaram:\n  ' + loadErrors.join('\n  '));
const asyncFails = rejections.length;
if (asyncFails) console.error(`[clinical-ci] ${asyncFails} rejeição(ões) async:\n  ` + rejections.join('\n  '));

if (report.failed > 0 || asyncFails > 0) {
  console.error(`\n✗ CI clínico FALHOU (sync=${report.failed}, async=${asyncFails}).`);
  process.exit(1);
}
console.log('\n✓ CI clínico: todos os testes clínicos passaram.');
process.exit(0);
