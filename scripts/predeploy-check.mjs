#!/usr/bin/env node
// Bloqueia `npm run deploy` se ha placeholders ou config faltando.
import { readFileSync, existsSync } from 'node:fs';

const errors = [];
const wrangler = readFileSync('wrangler.toml', 'utf8');

// Em CI o workflow cria/busca o D1 e patcha o wrangler.toml antes deste check;
// localmente bloqueia ate o id real estar no arquivo.
if (wrangler.includes('COLOCAR_DATABASE_ID_AQUI') && process.env.CI !== 'true') {
  errors.push('wrangler.toml ainda contem o placeholder COLOCAR_DATABASE_ID_AQUI. Rode `wrangler d1 create neuroped-db` e cole o id retornado.');
}
if (wrangler.includes('COLOCAR_DATABASE_ID_AQUI') && process.env.CI === 'true') {
  errors.push('Em CI mas wrangler.toml nao foi patched antes deste check (deveria ter ID real). Verifique a ordem das steps.');
}
if (!existsSync('schema.sql')) {
  errors.push('schema.sql ausente.');
}
if (!existsSync('functions/api/health.ts')) {
  errors.push('functions/api/health.ts ausente.');
}

if (errors.length) {
  console.error('Pre-deploy bloqueado:');
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
}
console.log('Pre-deploy OK.');
