import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const rel = (file) => path.join(root, file);
const read = (file) => fs.readFileSync(rel(file), "utf8");
const exists = (file) => fs.existsSync(rel(file));

const app = read("client/src/App.tsx");
const navigation = read("client/src/data/navigation.ts");

const routePaths = [...app.matchAll(/<Route\s+path="([^"]+)"/g)].map((match) => match[1]);
const navEntries = [...navigation.matchAll(/\{\s*href:\s*"([^"]+)",\s*label:\s*"([^"]+)"/g)].map((match) => ({
  href: match[1],
  label: match[2],
}));

const lazyImports = [...app.matchAll(/(?:const\s+(\w+)\s*=\s*lazy\(\(\)\s*=>\s*import\("@\/pages\/([^"]+)"\)\)|import\s+(\w+)\s+from\s+"@\/pages\/([^"]+)")/g)]
  .map((match) => ({ symbol: match[1] || match[3], page: match[2] || match[4] }));

const pageFiles = fs.readdirSync(rel("client/src/pages")).filter((file) => file.endsWith(".tsx"));
const dataFiles = fs.readdirSync(rel("client/src/data")).filter((file) => file.endsWith(".ts"));
const componentFiles = fs.readdirSync(rel("client/src/components")).filter((file) => file.endsWith(".tsx"));
const assetFiles = [
  ...fs.readdirSync(rel("client/public")).map((file) => `client/public/${file}`),
  ...fs.readdirSync(rel("client/src/assets/images")).map((file) => `client/src/assets/images/${file}`),
].filter((file) => exists(file) && fs.statSync(rel(file)).isFile());

const localStorageKeys = new Set();
for (const base of ["client/src/components", "client/src/hooks", "client/src/lib", "client/src/pages"]) {
  const stack = [rel(base)];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(full);
      if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
        const text = fs.readFileSync(full, "utf8");
        for (const match of text.matchAll(/localStorage\.(?:getItem|setItem|removeItem)\(\s*"([^"]+)"/g)) {
          localStorageKeys.add(match[1]);
        }
      }
    }
  }
}

const missingNavRoutes = navEntries.filter((entry) => !routePaths.includes(entry.href));
const missingImportedPages = lazyImports.filter(({ page }) => !exists(`client/src/pages/${page}.tsx`));
const orphanPages = pageFiles
  .map((file) => file.replace(/\.tsx$/, ""))
  .filter((page) => page !== "not-found" && !lazyImports.some((item) => item.page === page));

const classifications = [
  ["A", "Núcleo clínico operacional", "rotas, navegação, busca, catálogo e escalas com rotas públicas/protegidas"],
  ["A", "Persistência de preferências", [...localStorageKeys].sort().join(", ") || "sem chaves detectadas"],
  ["B", "Páginas não citadas diretamente por App.tsx", orphanPages.join(", ") || "nenhuma"],
  ["B", "Assets e mascotes", `${assetFiles.length} assets públicos/de imagem inventariados`],
  ["C", "Duplicação reduzida", "navegação lateral e paleta de comandos usam client/src/data/navigation.ts"],
  ["D", "Abandonado crítico", missingNavRoutes.length || missingImportedPages.length ? "existem inconsistências bloqueantes" : "nenhum item bloqueante encontrado"],
];

console.log("\nInventário NeuroPed — consolidação 8,5");
console.log("=======================================");
console.log(`Rotas declaradas: ${routePaths.length}`);
console.log(`Itens navegáveis: ${navEntries.length}`);
console.log(`Páginas TSX: ${pageFiles.length}`);
console.log(`Módulos de dados: ${dataFiles.length}`);
console.log(`Componentes: ${componentFiles.length}`);
console.log(`Assets: ${assetFiles.length}`);
console.log(`Chaves localStorage: ${localStorageKeys.size}`);
console.log("\nClassificação A/B/C/D:");
for (const [grade, title, detail] of classifications) {
  console.log(`- ${grade} — ${title}: ${detail}`);
}

if (missingNavRoutes.length) {
  console.error("\nRotas ausentes para itens de navegação:");
  for (const item of missingNavRoutes) console.error(`- ${item.href} (${item.label})`);
}

if (missingImportedPages.length) {
  console.error("\nImports de páginas sem arquivo correspondente:");
  for (const item of missingImportedPages) console.error(`- ${item.symbol}: client/src/pages/${item.page}.tsx`);
}

if (orphanPages.length) {
  console.warn("\nAtenção: páginas existentes sem import direto em App.tsx (avaliar se são patrimônio B ou remover da árvore):");
  for (const page of orphanPages) console.warn(`- client/src/pages/${page}.tsx`);
}

if (missingNavRoutes.length || missingImportedPages.length) {
  process.exitCode = 1;
}
