/**
 * Entry point do servidor Express.
 *
 * Pipeline de middleware:
 *  1. helmet, cors, rate-limit (security)
 *  2. cookie-parser
 *  3. body parsers (json, urlencoded)
 *  4. logger de request
 *  5. rotas (/api/*)
 *  6. error handler
 *  7. estatico (producao) ou Vite (dev)
 */

import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import "dotenv/config";

import { registerRoutes } from "./routes.js";
import { serveStatic } from "./static.js";
import { applySecurity } from "./middleware/security.js";
import { bootstrapAdmin } from "./storage.js";
import { boundedIntegerEnv } from "./lib/runtimeConfig.js";

const app = express();
const httpServer = createServer(app);

// ----- Trust proxy (necessario para CF/Render/Heroku/Cloudflare) -----
app.set("trust proxy", 1);

// ----- Security middleware (helmet, cors, rate-limit, permissions-policy) -----
applySecurity(app);

// ----- Cookies -----
app.use(cookieParser());

// ----- Body parsers -----
declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    limit: "1mb",
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);
app.use(express.urlencoded({ extended: false, limit: "1mb" }));

// ----- Logger de request (sem dado sensivel) -----
export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  res.on("finish", () => {
    if (path.startsWith("/api")) {
      const duration = Date.now() - start;
      log(`${req.method} ${path} ${res.statusCode} ${duration}ms`);
    }
  });
  next();
});

/**
 * Valida configuração crítica no boot. Sem isto, um deploy sem
 * NEUROPED_JWT_SECRET sobe "saudável" e falha por request com 401/500
 * opacos que mandam o operador caçar um bug de token fantasma.
 */
function validateBootConfig(): void {
  const isProduction = process.env.NODE_ENV === "production";
  if (!process.env.NODE_ENV) {
    console.error(
      "[boot] AVISO: NODE_ENV não definido — CSP e outras proteções de produção " +
      "ficam DESLIGADAS. Defina NODE_ENV=production em qualquer deploy real.",
    );
  }
  const jwtSecret = process.env.NEUROPED_JWT_SECRET ?? "";
  if (isProduction && jwtSecret.length < 32) {
    throw new Error(
      "[boot] NEUROPED_JWT_SECRET ausente ou com menos de 32 caracteres. " +
      "O servidor não pode autenticar ninguém — abortando o boot em produção.",
    );
  }
}

(async () => {
  validateBootConfig();

  // Bootstrap (cria admin inicial se ADMIN_EMAIL/ADMIN_INITIAL_PASSWORD definidos)
  try {
    await bootstrapAdmin();
  } catch (e) {
    console.error("[bootstrap] error:", e);
  }

  await registerRoutes(httpServer, app);

  // ----- 404 JSON para rotas /api desconhecidas -----
  // Sem isto o catch-all da SPA devolve index.html com 200 para qualquer
  // /api/* inexistente: um DELETE numa rota renomeada "sucede" sem fazer nada.
  app.use("/api", (_req: Request, res: Response) => {
    res.status(404).json({ error: "Rota não encontrada", code: "NOT_FOUND" });
  });

  // ----- Estatico vs Vite -----
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite.js");
    await setupVite(httpServer, app);
  }

  // ----- Error handler global -----
  // Registrado por último: o Express só procura error handlers DEPOIS da layer
  // que falhou, então ele precisa vir após static/Vite para capturar erros de
  // sendFile (ex.: index.html ausente num build parcial).
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    if (status >= 500) {
      console.error("[error]", err);
    }
    if (res.headersSent) return;
    res.status(status).json({
      error: status >= 500 ? "Internal Server Error" : message,
      code: err.code,
    });
  });

  const port = boundedIntegerEnv("PORT", 5000, 1, 65535);
  const host = process.env.HOST || "0.0.0.0";
  // reusePort não é suportado no Windows (EINVAL) — desliga fora de plataformas POSIX.
  httpServer.listen({ port, host, reusePort: process.platform !== "win32" }, () => {
    log(`NeuroPed EDJ rodando em http://${host}:${port}`);
  });
})();
