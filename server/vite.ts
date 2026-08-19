import { type Express } from "express";
import {
  createServer as createViteServer,
  createLogger,
} from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import fs from "fs";
import path from "path";

const viteLogger = createLogger();

export async function setupVite(server: Server, app: Express) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server, path: "/vite-hmr" },
    allowedHosts: true as const,
  };

  // `viteConfig` é uma função porque o root e o contrato de acesso dependem
  // do modo. Espalhar a função diretamente em `createServer` descarta o
  // resultado dela e faz o Vite usar a raiz padrão do processo (`/`), então
  // `/src/main.tsx` não é resolvido para `client/src/main.tsx`.
  const viteConfigInput =
    typeof viteConfig === "function"
      ? await viteConfig({
          command: "serve",
          mode: process.env.NODE_ENV ?? "development",
          isSsrBuild: false,
          isPreview: false,
        })
      : viteConfig;
  const vite = await createViteServer({
    ...viteConfigInput,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);

  app.use("/{*path}", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}
