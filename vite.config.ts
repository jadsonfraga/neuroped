import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    // Polyfills mínimos para a assinatura PDF (PAdES) no navegador: @signpdf
    // usa Buffer/process. A chave privada do certificado NUNCA sai do dispositivo.
    nodePolyfills({ include: ["buffer", "process", "util", "stream"], globals: { Buffer: true, process: true } }),
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
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    cssMinify: "esbuild",
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalizedId = id.replaceAll("\\", "/");
          if (!normalizedId.includes("/node_modules/")) return undefined;
          // Casar o pacote exato evita classificar `recharts`,
          // `react-hook-form` e `@radix-ui/react-*` como React core.
          if (/\/node_modules\/(?:react|react-dom|scheduler|wouter)\//.test(normalizedId)) return "vendor-react";
          // Deixe o Rolldown separar as demais dependencias conforme as rotas
          // dinamicas. Um unico `vendor` fazia bibliotecas de PDF e outras
          // features tardias entrarem no carregamento inicial do shell.
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
