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
  'npoint.io',
  'SUPABASE_SERVICE_ROLE',
  'service_role',
  'CPF como senha',
  'cpf como senha',
  'senha CPF',
  'ASSINADO DIGITALMENTE - ICP-Brasil',
  'ASSINATURA DIGITAL ICP-BRASIL',
  'Certificado válido',
  'Validade jurídica garantida',
  'Perplexity Computer'
];

const forbiddenFiles = [
  '.env',
  '.env.local',
  '.env.production',
  '.env.development'
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
  console.error('Arquivos obrigatorios ausentes:');
  for (const file of missing) console.error(`- ${file}`);
  process.exit(1);
}

const sensitiveFilesFound = forbiddenFiles.filter((file) => existsSync(join(root, file)));
if (sensitiveFilesFound.length > 0) {
  console.error('Arquivos sensiveis nao devem ser commitados:');
  for (const file of sensitiveFilesFound) console.error(`- ${file}`);
  process.exit(1);
}

const runtimeRoots = ['src', 'public'];
const scannedFiles = runtimeRoots.flatMap((directory) => walk(join(root, directory))).concat([
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
