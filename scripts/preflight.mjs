import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const requiredFiles = [
  'package.json',
  'vite.config.ts',
  'tsconfig.json',
  'src/main.tsx',
  'src/App.tsx',
  'src/config.ts',
  '.env.example',
  'public/manifest.json',
  'public/icon.svg',
  'supabase/migrations/20260506_secure_clinical_core.sql'
];

const forbiddenRuntimePatterns = [
  'api.npoint.io',
  'CPF como senha',
  'cpf como senha',
  'ASSINADO DIGITALMENTE - ICP-Brasil',
  'ASSINATURA DIGITAL ICP-BRASIL',
  'ICP-Brasil simulada',
  'Perplexity Computer',
  'data-pplx-inline-edit',
  'INLINE_EDIT_CAPTURE_REQUEST',
  'Psiquiatria Infantil',
  '/neuroped/manifest.json',
  '/neuroped/icon.svg',
  'SUPABASE_SERVICE_ROLE_KEY'
];

function walk(directory, files = []) {
  if (!existsSync(directory)) return files;

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
  console.error('Arquivos obrigatórios ausentes:');
  for (const file of missing) console.error(`- ${file}`);
  process.exit(1);
}

const scannedFiles = [
  ...walk(join(root, 'src')),
  ...walk(join(root, 'public')),
  join(root, 'index.html')
];

const findings = [];
for (const file of scannedFiles) {
  if (!existsSync(file)) continue;
  const content = readFileSync(file, 'utf8');
  for (const pattern of forbiddenRuntimePatterns) {
    if (content.includes(pattern)) findings.push({ file, pattern });
  }
}

if (findings.length > 0) {
  console.error('Padrões inseguros encontrados no runtime:');
  for (const finding of findings) console.error(`- ${finding.file}: ${finding.pattern}`);
  process.exit(1);
}

console.log('Preflight NeuroPed EDJ aprovado.');
