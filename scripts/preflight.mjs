import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const requiredFiles = [
  'package.json',
  'vite.config.ts',
  'tsconfig.json',
  'src/main.tsx',
  'src/App.tsx',
  '.env.example',
  'supabase/migrations/20260506_secure_clinical_core.sql'
];

const forbiddenRuntimePatterns = [
  'api.npoint.io',
  'CPF como senha',
  'cpf como senha',
  'ASSINADO DIGITALMENTE - ICP-Brasil',
  'ASSINATURA DIGITAL ICP-BRASIL',
  'Perplexity Computer'
];

function walk(directory, files = []) {
  for (const entry of readdirSync(directory)) {
    if (['node_modules', 'dist', '.git'].includes(entry)) continue;
    const absolute = join(directory, entry);
    const stat = statSync(absolute);
    if (stat.isDirectory()) walk(absolute, files);
    else files.push(absolute);
  }
  return files;
}

const missing = requiredFiles.filter((file) => !existsSync(join(root, file)));
if (missing.length > 0) {
  console.error('Arquivos obrigatorios ausentes:');
  for (const file of missing) console.error(`- ${file}`);
  process.exit(1);
}

const scannedFiles = walk(join(root, 'src')).concat([
  join(root, 'index.html'),
  join(root, 'sw.js'),
  join(root, 'manifest.json')
]);

const findings = [];
for (const file of scannedFiles) {
  if (!existsSync(file)) continue;
  const content = readFileSync(file, 'utf8');
  for (const pattern of forbiddenRuntimePatterns) {
    if (content.includes(pattern)) findings.push({ file, pattern });
  }
}

if (findings.length > 0) {
  console.error('Padroes inseguros encontrados no runtime:');
  for (const finding of findings) console.error(`- ${finding.file}: ${finding.pattern}`);
  process.exit(1);
}

console.log('Preflight NeuroPed EDJ aprovado.');
