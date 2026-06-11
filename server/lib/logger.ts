/**
 * BLOCO 2: Logging Estruturado
 *
 * Pino logger com:
 * - JSON output para fácil parsing
 * - Níveis: trace, debug, info, warn, error, fatal
 * - Correlação de request
 * - Sem vazar dados sensíveis de paciente
 */

import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";
const logLevel = process.env.LOG_LEVEL || "info";

/**
 * Instância global do logger
 */
export const logger = pino({
  level: logLevel,
  // Em produção: JSON estruturado
  // Em desenvolvimento: pretty-printed
  ...(isProduction
    ? {
        // JSON for production logging aggregators
        formatters: {
          level: (label: string) => {
            return { level: label };
          },
        },
        timestamp: pino.stdTimeFunctions.isoTime,
      }
    : {
        // Pretty-print for development
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            singleLine: false,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
          },
        },
      }),

  // Redact sensitive information
  redact: {
    paths: [
      "password",
      "password_hash",
      "cpf",
      "cpf_encrypted",
      "cpf_hash",
      "email",
      "phone",
      "address",
      "token",
      "token_hash",
      "refresh_token",
      "access_token",
      "apiKey",
      "secret",
      "Authorization",
      "authorization",
      "req.headers.authorization",
      "req.headers.cookie",
    ],
    remove: true,
  },
});

/**
 * Middleware para Express que adiciona correlação de request
 */
export function createLoggerMiddleware(req: any, res: any, next: any) {
  // Gera um ID único para esta request
  const requestId = crypto.randomUUID();
  req.id = requestId;
  req.logger = logger.child({ requestId });

  // Log de entrada
  req.logger.info({
    msg: "Incoming request",
    method: req.method,
    path: req.path,
    ip: req.ip,
  });

  // Hook para log de saída
  res.on("finish", () => {
    req.logger.info({
      msg: "Request completed",
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${Date.now() - req.start}ms`,
    });
  });

  req.start = Date.now();
  next();
}

/**
 * Wrapper para endpoints que precisam de request-scoped logging
 */
export function withLogger(handler: (req: any, res: any, log: import("pino").Logger) => Promise<any>) {
  return async (req: any, res: any) => {
    const childLogger = req.logger || logger.child({ requestId: crypto.randomUUID() });
    try {
      return await handler(req, res, childLogger);
    } catch (error) {
      childLogger.error({ error, msg: "Handler error" }, error);
      throw error;
    }
  };
}

/**
 * Log de queries para debug (dev only)
 */
export function logQuery(sql: string, params?: any[]) {
  if (process.env.DEBUG_QUERIES === "true") {
    logger.debug({
      msg: "SQL Query",
      sql,
      params: params?.map((p) => (typeof p === "string" ? p.substring(0, 50) : p)),
    });
  }
}

export default logger;
