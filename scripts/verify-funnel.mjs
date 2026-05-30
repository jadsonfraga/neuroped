/* Verificação COMPORTAMENTAL do funil de venda (não só sintaxe).
 * Carrega a landing num DOM real (jsdom), executa os scripts e confirma que
 * os botões de compra disparam a ação correta e a prova social nasce oculta.
 *
 * jsdom é opcional: se ausente, o teste é PULADO (não falha o pipeline).
 * Para rodar com verificação real:  npm i -D jsdom && node scripts/verify-funnel.mjs
 */
import fs from 'fs';

let JSDOM;
try { ({ JSDOM } = await import('jsdom')); }
catch { console.log('· verify-funnel: jsdom ausente — verificação comportamental PULADA (ok).'); process.exit(0); }

let pass = 0, fail = 0;
const ok = (c, m) => { c ? (pass++, console.log('  ✓ ' + m)) : (fail++, console.log('  ✗ FALHA: ' + m)); };

let html = fs.readFileSync('neuroped-pro.html', 'utf8');
html = html.replace(/<script src="\.\/(pro-hashes|master-access-policy|pro-license|app-polish-mobile)\.js"[^>]*><\/script>/g, '');

const dom = new JSDOM(html, { runScripts: 'outside-only', pretendToBeVisual: true, url: 'https://x/neuroped-pro.html' });
const { window } = dom;
global.window = window; global.document = window.document;
window.crypto = globalThis.crypto;
let opened = [];
window.open = (u) => { opened.push(u); return { focus() {} }; };
window.scrollTo = () => {};
window.IntersectionObserver = class { observe() {} disconnect() {} };

const run = (code) => { const s = window.document.createElement('script'); s.textContent = code; window.document.body.appendChild(s); };
run(fs.readFileSync('pro-hashes.js', 'utf8'));
run(fs.readFileSync('master-access-policy.js', 'utf8'));
run(fs.readFileSync('pro-license.js', 'utf8'));
run(html.match(/<script>([\s\S]*?)<\/script>/)[1]);

const $ = (id) => window.document.getElementById(id);
ok($('buyBar') && $('buyBarBtn'), 'barra de compra fixa existe no DOM');
ok($('depoimentos').hidden === true, 'depoimentos nascem ocultos (sem prova social falsa)');
ok(/R\$ 47/.test($('priceVal').textContent), 'preço R$ 47 renderizado');
ok(/R\$ 47/.test(window.document.querySelector('#buyBar .bp b').textContent), 'barra mostra preço sincronizado');

opened = []; $('buyBarBtn').click();
ok(opened.length === 1 && /wa\.me\/5587991097371/.test(opened[0]), 'barra → abre WhatsApp (venda manual ativa hoje)');
ok(/NeuroPed Pro/.test(decodeURIComponent(opened[0])), 'mensagem do WhatsApp cita o produto');
opened = []; $('checkoutBtn').click();
ok(opened.length === 1 && /wa\.me/.test(opened[0]), 'botão final de compra também dispara ação');

ok(typeof window.NeuroPedPro?.unlock === 'function', 'motor de licença disponível');
const r = await window.NeuroPedPro.unlock('PRO-XXXX-FAKE');
ok(r && r.ok === false, 'código inválido é rejeitado');

console.log(`\nverify-funnel: ${pass} OK, ${fail} falha(s).`);
process.exit(fail ? 1 : 0);
