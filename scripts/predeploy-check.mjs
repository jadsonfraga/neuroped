#!/usr/bin/env node
// Bloqueia `npm run deploy` se ha placeholders ou config faltando.
import { readFileSync, existsSync } from 'node:fs';

const errors = [];
const wrangler = readFileSync('wrangler.toml', 'utf8');

if (wrangler.includes('COLOCAR_DATABASE_ID_AQUI')) {
  errors.push('wrangler.toml ainda contem o placeholder COLOCAR_DATABASE_ID_AQUI. Rode `wrangler d1 create neuroped-db` e cole o id retornado.');
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
