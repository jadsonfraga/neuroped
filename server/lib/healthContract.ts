export interface ExpressHealthEnvironment {
  NEUROPED_JWT_SECRET?: string;
  STORAGE_PROVIDER?: string;
}

/** Contrato compartilhado com o health do Cloudflare consumido pelo cliente. */
export function buildExpressHealth(
  env: ExpressHealthEnvironment = process.env as ExpressHealthEnvironment,
  now = new Date(),
) {
  const jwtConfigured = (env.NEUROPED_JWT_SECRET?.trim().length ?? 0) >= 32;
  return {
    status: "ok",
    service: "neuroped-edj-api",
    time: now.toISOString(),
    timestamp: now.toISOString(),
    version: "2.1.0-cloud",
    environment: "express",
    storage: env.STORAGE_PROVIDER || "not-configured",
    // Todas as rotas Express usam o mesmo adapter better-sqlite3. Produção
    // canônica usa Cloudflare Functions + D1; DATABASE_URL não é anunciado.
    database: "sqlite",
    authentication: {
      // Este servidor expõe prontuários/APIs clínicas protegidas. A ausência de
      // segredo é erro de configuração, nunca permissão para cair no PIN local.
      required: true,
      configured: jwtConfigured,
    },
  } as const;
}
