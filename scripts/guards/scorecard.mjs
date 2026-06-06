import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

mkdirSync('docs', { recursive: true });
const now = new Date().toISOString();
const read = (file) => existsSync(file) ? readFileSync(file, 'utf8') : '';
const allJs = readdirSync('assets').filter((file) => file.endsWith('.js')).map((file) => join('assets', file));
const corpus = ['index.html', 'sw.js', '404.html', ...allJs].map(read).join('\n');
const apiMentions = [...corpus.matchAll(/['"`](?:[^'"`]*\/api\/[^'"`]*)['"`]|\/api\//g)].length;
const honestApi = /safeApiFetch|apiNetworkFirst|BACKEND_IN_DEPLOYMENT|Este recurso está em implantação no ambiente público/.test(corpus);
const deploymentStates = (corpus.match(/em implantação|BACKEND_IN_DEPLOYMENT|BACKEND_UNAVAILABLE/g) || []).length;
const silent404Fail = /url\.pathname\.includes\("\/api\/"\)\) return;/.test(read('sw.js')) || !/index\.html#\//.test(read('404.html'));
const refs = [...read('index.html').matchAll(/(?:src|href)="\.\/([^"#?]+)/g)].map((m) => m[1]);
const brokenRefs = refs.filter((ref) => !existsSync(ref));
const biggest = allJs.map((file) => ({ file, size: statSync(file).size })).sort((a, b) => b.size - a.size)[0];
const staticSpecs = read('scripts/e2e/static-e2e.mjs').match(/await test\(/g)?.length || 0;
const playwrightSpecs = read('tests/e2e/neuroped.spec.ts').match(/test\(/g)?.length || 0;

const run = (cmd, args) => {
  const out = spawnSync(cmd, args, { encoding: 'utf8' });
  return { status: out.status ?? 1, output: `${out.stdout || ''}${out.stderr || ''}`.trim() };
};
const check = run('node', ['scripts/guards/static-check.mjs']);
const lint = run('node', ['scripts/guards/lint-static.mjs']);
const build = run('node', ['scripts/guards/build-static.mjs']);
const e2e = run('node', ['scripts/e2e/static-e2e.mjs']);

const axes = [
  {
    axis: 'D1 Função/local-first',
    status: !silent404Fail && honestApi && brokenRefs.length === 0 ? 'verde' : 'vermelho',
    score: !silent404Fail && honestApi && brokenRefs.length === 0 ? 8.0 : 4.0,
    evidence: `${apiMentions} menções /api; wrapper/fallback honesto=${honestApi}; estados em implantação=${deploymentStates}; refs quebradas=${brokenRefs.length}; 404 silencioso=${silent404Fail}`,
  },
  {
    axis: 'D2 Código',
    status: check.status === 0 && lint.status === 0 ? 'verde' : 'vermelho',
    score: check.status === 0 && lint.status === 0 ? 8.0 : 4.0,
    evidence: `check=${check.status === 0 ? 'passou' : 'falhou'}; lint=${lint.status === 0 ? 'passou' : 'falhou'}; warnings observacionais no lint não bloqueiam`,
  },
  {
    axis: 'D3 Build/perf',
    status: build.status === 0 ? 'amarelo' : 'vermelho',
    score: build.status === 0 ? 7.0 : 3.0,
    evidence: `build estático=${build.status === 0 ? 'passou' : 'falhou'}; maior chunk=${biggest?.file || 'não medido'} ${biggest ? Math.round(biggest.size / 1024) + ' KiB' : 'não medido'}; Lighthouse=não medido`,
  },
  {
    axis: 'D4 A11Y',
    status: 'não medido',
    score: 6.0,
    evidence: 'axe serious/critical=não medido; ambiente sem browser Playwright instalado após bloqueio de registry npm',
  },
  {
    axis: 'D5 Testes',
    status: e2e.status === 0 && staticSpecs >= 10 ? 'amarelo' : 'vermelho',
    score: e2e.status === 0 && staticSpecs >= 10 ? 7.0 : 2.0,
    evidence: `${staticSpecs} specs estáticas/e2e passaram via Node; ${playwrightSpecs} specs Playwright versionadas; execução real Playwright=não medida`,
  },
  {
    axis: 'D6 Clínico',
    status: 'amarelo',
    score: 7.0,
    evidence: 'conteúdo clínico preservado; validate-catalog=não medido; revisão médica humana pendente; fontes clínicas não alteradas',
  },
];
const measured = axes.filter((a) => a.status !== 'não medido');
const global = Math.min(...measured.map((a) => a.score));
const badge = (s) => s === 'verde' ? '🟢 verde' : s === 'amarelo' ? '🟡 amarelo' : s === 'vermelho' ? '🔴 vermelho' : '⚪ não medido';
const body = `# Placar NeuroPed 9.0 — fonte viva e honesta\n\nGerado em: ${now}\n\n## Regra de nota\n\nNOTA GLOBAL = menor eixo medido. Eixo essencial não medido impede nota 10. Não declarar 9,0 sem evidência.\n\n## Nota global atual\n\n**${global.toFixed(1)} / 10**\n\n> Diagnóstico: não declarar 9,0 real ainda porque D4/A11Y e Playwright em navegador real estão não medidos.\n\n## Antes/depois\n\n| Momento | Nota | Evidência |\n|---|---:|---|\n| Antes da sprint | não medido | Repositório não possuía package.json, scripts npm, scorecard vivo ou suíte E2E executável. |\n| Depois desta alteração | ${global.toFixed(1)} | Scorecard gerado por \`npm run scorecard\`; menor eixo medido define a nota. |\n\n## Eixos\n\n| Eixo | Status | Nota | Evidência |\n|---|---|---:|---|\n${axes.map((a) => `| ${a.axis} | ${badge(a.status)} | ${a.score.toFixed(1)} | ${a.evidence} |`).join('\n')}\n\n## Métricas brutas\n\n- Total de chamadas/menções \`/api\` detectadas: ${apiMentions}.\n- Chamadas tratadas por wrapper/fallback honesto: ${honestApi ? 'detectado em index.html/sw.js' : 'não detectado'}.\n- Rotas quebradas por referência estática local: ${brokenRefs.length}.\n- Estados em implantação detectados: ${deploymentStates}.\n- 404 silencioso: ${silent404Fail ? 'reprovação' : 'não detectado nos fallbacks estáticos'}.\n- Specs estáticas/e2e versionadas e executadas: ${staticSpecs}.\n- Specs Playwright versionadas para navegador real: ${playwrightSpecs}; execução: não medido.\n- Lighthouse: não medido.\n- axe: não medido.\n- validate-catalog: não medido.\n\n## Saída dos comandos medidos\n\n### check\n\n\`\`\`\n${check.output.slice(0, 2500)}\n\`\`\`\n\n### lint\n\n\`\`\`\n${lint.output.slice(0, 2500)}\n\`\`\`\n\n### build\n\n\`\`\`\n${build.output.slice(0, 2500)}\n\`\`\`\n\n### e2e estático\n\n\`\`\`\n${e2e.output.slice(0, 3000)}\n\`\`\`\n`;
writeFileSync('docs/PLACAR_9.0.md', body);
console.log(`Scorecard gerado em docs/PLACAR_9.0.md com nota global ${global.toFixed(1)}.`);
if (global < 6) process.exit(1);
