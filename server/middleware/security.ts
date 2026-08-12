/**
 * Middleware de seguranca de aplicacao:
 *  - helmet: headers de seguranca padroes (HSTS, CSP, X-Frame-Options, etc).
 *  - cors: restritivo via env CORS_ORIGINS (comma-separated).
 *  - rate-limit: 100 req/min global, 5 req/15min em /api/auth/login.
 */

import type { Express, Request, Response, NextFunction } from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";


export function isCorsOriginAllowed(
  origin: string | undefined,
  corsOrigins: readonly string[],
  isProduction = process.env.NODE_ENV === "production",
): boolean {
  if (!origin) return true;
  if (corsOrigins.includes(origin)) return true;

  // Wildcard é útil apenas para desenvolvimento local. Em produção, aceitar
  // `*` junto de `credentials: true` converte um erro de configuração em CORS
  // aberto para qualquer origem. Falha fechada: somente origens nominais.
  return !isProduction && corsOrigins.includes("*");
}

export function applySecurity(app: Express): void {
  // ----- Helmet: headers de seguranca -----
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "blob:"],
          // Uploads usam URLs HTTPS pré-assinadas do provedor de objetos.
          connectSrc: ["'self'", "https:"],
          frameAncestors: ["'none'"],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          upgradeInsecureRequests: [],
        },
      },
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: "same-site" },
      hsts: {
        maxAge: 31_536_000,
        includeSubDomains: true,
        preload: true,
      },
      referrerPolicy: { policy: "strict-origin-when-cross-origin" },
      permittedCrossDomainPolicies: { permittedPolicies: "none" },
    }),
  );

  // ----- CORS restritivo -----
  const corsOrigins = (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (corsOrigins.length > 0) {
    app.use(
      cors({
        origin: (origin, cb) => {
          if (isCorsOriginAllowed(origin, corsOrigins)) return cb(null, true);
          return cb(new Error("Origem nao autorizada pelo CORS"));
        },
        credentials: true,
        methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
        maxAge: 600,
      }),
    );
  }

  // ----- Rate limit global -----
  const globalLimiter = rateLimit({
    windowMs: 60_000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests", code: "RATE_LIMIT" },
    skip: (req) => req.method === "OPTIONS",
  });
  app.use("/api", globalLimiter);

  // ----- Permissions-Policy reforcado -----
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
    );
    next();
  });
}

/** Limite agressivo para endpoints de login (anti-brute-force). */
export const loginRateLimit = rateLimit({
  windowMs: 15 * 60_000, // 15 min
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    error: "Muitas tentativas de login. Aguarde 15 minutos.",
    code: "AUTH_RATE_LIMIT",
  },
});

/** Limite para endpoints de criacao de recurso. */
export const writeRateLimit = rateLimit({
  windowMs: 60_000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

/** Limite para envio de email (anti-spam). */
export const emailRateLimit = rateLimit({
  windowMs: 60 * 60_000, // 1h
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Limite de envios de email atingido. Aguarde 1 hora.",
    code: "EMAIL_RATE_LIMIT",
  },
});
