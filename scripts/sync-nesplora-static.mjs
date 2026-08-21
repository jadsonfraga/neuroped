import { cp, copyFile, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const nesploraBuild = "/home/ubuntu/nesplora-premium/dist/public";
const nesploraAssets = "/home/ubuntu/webdev-static-assets";
const destination = path.join(repositoryRoot, "client", "public", "nesplora");
const mediaDestination = path.join(destination, "media");

const mediaFiles = [
  ["dr-jadson-fraga-logo.png", "dr-jadson-fraga-logo_966aa1f5.png"],
  ["nesplora-glass-installation.jpeg", "nesplora-glass-installation_9e86b34a.jpeg"],
  ["nesplora-video-institucional.mp4", "nesplora-video-institucional_11252018.mp4"],
  ["nesplora-video-poster.jpg", "nesplora-video-poster_07c630c8.jpg"],
  ["nesplora-vr-happy-mobile.webp", "nesplora-vr-happy-mobile_05c9eaf2.webp"],
  ["nesplora-vr-happy.jpg", "nesplora-vr-happy_248c5a06.jpg"],
];

async function listFiles(directory) {
  const entries = await readdir(directory);
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(directory, entry);
      return (await stat(fullPath)).isDirectory() ? listFiles(fullPath) : [fullPath];
    }),
  );
  return nested.flat();
}

await rm(destination, { recursive: true, force: true });
await mkdir(mediaDestination, { recursive: true });
await cp(path.join(nesploraBuild, "assets"), path.join(destination, "assets"), { recursive: true });

let html = await readFile(path.join(nesploraBuild, "index.html"), "utf8");
html = html
  .replace(/\s*<script id="manus-runtime">[\s\S]*?<\/script>/, "")
  .replace(/\s*<script src="\/__manus__\/debug-collector\.js" defer><\/script>/, "")
  .replaceAll('src="/assets/', 'src="./assets/')
  .replaceAll('href="/assets/', 'href="./assets/');
await writeFile(path.join(destination, "index.html"), html, "utf8");

for (const [sourceName, destinationName] of mediaFiles) {
  await copyFile(path.join(nesploraAssets, sourceName), path.join(mediaDestination, destinationName));
}

for (const assetFile of await listFiles(path.join(destination, "assets"))) {
  if (!/\.(?:js|css)$/i.test(assetFile)) continue;
  const source = await readFile(assetFile, "utf8");
  const rewritten = source.replace(/\/manus-storage\/([^"' )]+)/g, "./media/$1");
  await writeFile(assetFile, rewritten, "utf8");
}

await writeFile(
  path.join(destination, "_headers"),
  `/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n\n/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n\n/media/*\n  Cache-Control: public, max-age=31536000, immutable\n`,
  "utf8",
);

await writeFile(
  path.join(destination, "sw.js"),
  `/* Ponte de migração Nesplora: assume /nesplora/ uma vez para escapar do cache legado do NeuroPed. */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim().then(async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    await Promise.all(windows.map((client) => {
      const path = new URL(client.url).pathname;
      return path === "/nesplora" || path.startsWith("/nesplora/") ? client.navigate(client.url) : undefined;
    }));
  }));
});
`,
  "utf8",
);

await writeFile(
  path.join(destination, "README.md"),
  "# Nesplora estática\n\nEsta pasta é uma cópia autônoma compilada da Nesplora, publicada pelo próprio deploy do Neuroped em `/nesplora/`. Os arquivos de mídia ficam em `media/`; não há dependência de URLs Manus em runtime. O `sw.js` local é uma ponte de migração que recupera navegadores com cache legado do NeuroPed. Para atualizar a cópia a partir do projeto-fonte, execute `node scripts/sync-nesplora-static.mjs` no repositório do Neuroped.\n",
  "utf8",
);

console.log("Nesplora incorporada em client/public/nesplora com ativos locais.");
