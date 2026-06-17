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
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("react") || id.includes("wouter")) return "vendor-react";
          if (id.includes("@radix-ui") || id.includes("cmdk") || id.includes("lucide-react")) return "vendor-ui";
          if (id.includes("recharts") || id.includes("date-fns")) return "vendor-charts";
          return "vendor";
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
