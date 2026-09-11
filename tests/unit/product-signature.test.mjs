import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
const login = read('client/src/pages/login.tsx');
const cockpit = read('client/src/components/clinical/ClinicalCockpit.tsx');
const css = read('client/src/styles/product-signature.css');
const main = read('client/src/main.tsx');
assert.ok(main.includes('import "./styles/product-signature.css"'));
assert.ok(css.includes('@media screen'), 'a camada não deve repintar documentos impressos');
for (const value of ['214.47 68.12%', '350.87 60.53%', '41.57 54.04%', '175.34 77.44%']) {
  assert.ok(css.includes(value), `paleta ausente: ${value}`);
}
for (const contract of ['safeNextRoute()', 'clearNextParam()', 'await login(email.trim(), password)', 'data-testid="login-form"', 'autoComplete="current-password"', 'autoComplete="username"', 'data-testid="forgot-password-link"', 'data-testid="pricing-link"', 'Entrar na área profissional']) {
  assert.ok(login.includes(contract), `contrato de entrada removido: ${contract}`);
}
assert.match(login, /\[showPassword, setShowPassword\] = useState\(false\)/, 'senha inicia oculta');
assert.match(login, /\{showPassword \? \(\s*<Input[^\n]*type="text"[^\n]*value=\{password\}[^\n]*\/>\s*\) : \(\s*<Input[^\n]*type="password"[^\n]*value=\{password\}/, 'controle explícito de visibilidade sem credencial nova');
assert.match(login, /aria-pressed=\{showPassword\}/);
assert.match(login, /aria-controls="login-password"/);
assert.match(login, /<button type="button" className="np-password-toggle"/);
assert.ok(cockpit.indexOf('className="np-workspace-context') < cockpit.indexOf('className="np-workspace-support'), 'contexto deve preceder recursos no DOM');
for (const contract of ['cockpit-current-patient', 'cockpit-loading', 'cockpit-empty', 'cockpit-action-prontuario', 'enabled: isRemoteClinical && Boolean(activeClinicId)', 'queryKey: [queryKey]']) {
  assert.ok(cockpit.includes(contract), `contrato clínico removido: ${contract}`);
}
const welcome = cockpit.slice(cockpit.indexOf('<section aria-label="Entrada'), cockpit.indexOf('<nav className="np-workspace-actions"'));
assert.equal((welcome.match(/<SafeAssetImage/g) ?? []).length, 1, 'um retrato discreto, não uma galeria');
assert.ok(!welcome.includes('atendimentoCrianca'), 'sem fotografia infantil no painel autenticado');
assert.ok(!/\b(?:localStorage|sessionStorage|fetch)\s*\./.test(welcome));
assert.ok(css.includes('prefers-reduced-motion'));
console.log('PASS: paleta, entrada, contexto clínico, fotografia e redução de movimento');
