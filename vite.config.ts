import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { readFile, writeFile } from "node:fs/promises";
import { resolveOfflineShellRoots } from "./scripts/guards/lib/offline-shell-roots.mjs";

const publicOutDir = path.resolve(import.meta.dirname, "dist/public");

function serviceWorkerPrecacheManifest() {
  return {
    name: "neuroped-service-worker-precache-manifest",
    apply: "build" as const,
    async closeBundle() {
      const manifestPath = path.join(publicOutDir, ".vite", "manifest.json");
      const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as Record<
        string,
        {
          file: string;
          isEntry?: boolean;
          imports?: string[];
          css?: string[];
          assets?: string[];
        }
      >;
      const [appSource, webManifestSource] = await Promise.all([
        readFile(path.resolve(import.meta.dirname, "client", "src", "App.tsx"), "utf8"),
        readFile(path.resolve(import.meta.dirname, "client", "public", "manifest.json"), "utf8"),
      ]);
      const { roots } = resolveOfflineShellRoots({
        appSource,
        webManifest: JSON.parse(webManifestSource),
        buildManifest: manifest,
      });
      const visited = new Set<string>();
      const assets = new Set<string>();

      const includeChunk = (source: string) => {
        if (visited.has(source)) return;
        visited.add(source);
        const chunk = manifest[source];
        if (!chunk) {
          throw new Error(`Chunk ausente no manifesto do build: ${source}`);
        }
        assets.add(`./${chunk.file}`);
        chunk.css?.forEach((file) => assets.add(`./${file}`));
        chunk.assets?.forEach((file) => assets.add(`./${file}`));
        chunk.imports?.forEach(includeChunk);
      };
      roots.forEach(includeChunk);
      const sortedAssets = [...assets].sort();

      if (sortedAssets.length === 0) {
        throw new Error("Build sem shell para o precache offline.");
      }

      await writeFile(
        path.join(publicOutDir, "sw-assets.js"),
        `// GERADO PELO BUILD — não editar.\nself.__NEUROPED_PRECACHE_ASSETS__ = ${JSON.stringify(sortedAssets, null, 2)};\n`,
        "utf8",
      );
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    serviceWorkerPrecacheManifest(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  // base "./" usa caminhos relativos — funciona no GitHub Pages em qualquer subpath
  // O roteamento é hash-based (wouter + useHashLocation), portanto não precisa de basename absoluto
  base: "./",
  build: {
    outDir: publicOutDir,
    emptyOutDir: true,
    manifest: true,
    cssMinify: "esbuild",
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalizedId = id.replaceAll("\\", "/");
          if (!normalizedId.includes("/node_modules/")) return undefined;
          // Só o núcleo React entra no chunk inicial compartilhado. O match
          // exato evita puxar recharts/react-hook-form e bibliotecas tardias.
          if (/\/node_modules\/(?:react|react-dom|scheduler|wouter)\//.test(normalizedId)) {
            return "vendor-react";
          }
          // As demais dependências acompanham suas rotas dinâmicas. Um único
          // mega-vendor forçava PDF, gráficos e polyfills no primeiro acesso.
          return undefined;
        },
      },
    },
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
