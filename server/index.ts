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
import { registerAgendaRoutes } from "./routes/agenda.js";
import { serveStatic } from "./static.js";
import { applySecurity } from "./middleware/security.js";
import { bootstrapAdmin } from "./storage.js";

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

(async () => {
  // Bootstrap (cria admin inicial se ADMIN_EMAIL/ADMIN_INITIAL_PASSWORD definidos)
  try {
    await bootstrapAdmin();
  } catch (e) {
    console.error("[bootstrap] error:", e);
  }

  await registerRoutes(httpServer, app);
  // Agenda operacional compartilhada: separada do núcleo clínico e com RBAC próprio.
  registerAgendaRoutes(app);

  // ----- Error handler global -----
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

  // ----- Estatico vs Vite -----
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite.js");
    await setupVite(httpServer, app);
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  const host = process.env.HOST || "0.0.0.0";
  // reusePort não é suportado no Windows (EINVAL) — desliga fora de plataformas POSIX.
  httpServer.listen({ port, host, reusePort: process.platform !== "win32" }, () => {
    log(`NeuroPed EDJ rodando em http://${host}:${port}`);
  });
})();