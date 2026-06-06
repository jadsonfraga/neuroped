import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const required = ['index.html', 'manifest.json', 'sw.js', '404.html', 'icon-192.png', 'icon-512.png', '.nojekyll'];
const missing = required.filter((file) => !existsSync(file));
if (missing.length) {
  console.error(`Arquivos obrigatórios ausentes: ${missing.join(', ')}`);
  process.exit(1);
}

const index = readFileSync('index.html', 'utf8');
const refs = [...index.matchAll(/(?:src|href)="\.\/([^"#?]+)/g)].map((match) => match[1]);
const broken = refs.filter((ref) => !ref.startsWith('data:') && !existsSync(ref));
if (broken.length) {
  console.error(`Referências locais quebradas no index.html: ${broken.join(', ')}`);
  process.exit(1);
}

const manifest = readFileSync('manifest.json', 'utf8');
for (const token of ['"start_url"', '"scope"', '"display"', '"icons"']) {
  if (!manifest.includes(token)) {
    console.error(`Manifest sem ${token}.`);
    process.exit(1);
  }
}

const assets = readdirSync('assets').filter((name) => /\.(js|css|png|jpe?g|svg)$/.test(name));
if (assets.length < 10) {
  console.error('Poucos assets publicados para um build estático válido.');
  process.exit(1);
}

console.log(`Static check aprovado: ${required.length} arquivos-base, ${refs.length} referências locais e ${assets.length} assets publicados.`);
