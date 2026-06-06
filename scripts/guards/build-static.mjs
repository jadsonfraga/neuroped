import { statSync, readdirSync } from 'node:fs';
const entry = statSync('index.html').size;
const jsAssets = readdirSync('assets').filter((name) => name.endsWith('.js')).map((name) => ({ name, size: statSync(`assets/${name}`).size })).sort((a, b) => b.size - a.size);
if (!jsAssets.length) {
  console.error('Nenhum bundle JS publicado em assets/.');
  process.exit(1);
}
console.log(`Build estático validado: index.html ${entry} bytes; maior bundle ${jsAssets[0].name} ${Math.round(jsAssets[0].size / 1024)} KiB.`);
