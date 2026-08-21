import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const [sourcePath, outputDir] = process.argv.slice(2);

if (!sourcePath || !outputDir) {
  throw new Error('Uso: node scripts/import-missao-instagram-assets.mjs <posts.json> <diretorio-de-saida>');
}

const selectedPosts = new Map([
  ['18123143824749883', 'movimento-brincar.jpg'],
  ['18091090025208845', 'rotina-sono.jpg'],
  ['18073567139448253', 'linguagem-comunicacao.jpg'],
  ['17994224273823952', 'marcos-desenvolvimento.jpg'],
]);

const source = JSON.parse(await readFile(sourcePath, 'utf8'));
const posts = source?.result?.data ?? [];
const selected = posts.filter((post) => selectedPosts.has(post.id));

if (selected.length !== selectedPosts.size) {
  throw new Error('A lista de posts não contém todos os ativos autorizados esperados.');
}

await mkdir(outputDir, { recursive: true });

const manifest = [];
for (const post of selected) {
  const response = await fetch(post.media_url);
  if (!response.ok) {
    throw new Error(`Falha ao baixar a arte do post ${post.id}: HTTP ${response.status}`);
  }

  const fileName = selectedPosts.get(post.id);
  const filePath = join(outputDir, fileName);
  const data = new Uint8Array(await response.arrayBuffer());
  await writeFile(filePath, data);

  manifest.push({
    file: fileName,
    postId: post.id,
    source: post.permalink,
    captionTheme: post.caption.split('\n')[0],
  });
}

await writeFile(join(outputDir, 'origens.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Importados ${manifest.length} ativos para ${outputDir}`);
