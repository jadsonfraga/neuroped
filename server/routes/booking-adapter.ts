import type { Express, Request as ExpressRequest, Response } from "express";
import { sqlite } from "../storage.js";
import { requireAuth } from "../middleware/auth.js";
import {
  onRequestGet as operationsGet,
  onRequestPost as operationsPost,
} from "../../functions/api/operations/index.js";
import {
  onRequestGet as publicBookingGet,
  onRequestPost as publicBookingPost,
} from "../../functions/api/public-booking.js";

type D1RunResult = {
  success: true;
  meta: {
    changes: number;
    duration: number;
    last_row_id?: number;
  };
};

type D1AllResult<T> = {
  success: true;
  results: T[];
  meta: {
    changes: number;
    duration: number;
  };
};

/**
 * Ponte mínima entre a API assíncrona do Cloudflare D1 e o SQLite usado pelo
 * servidor Express. Os handlers de `functions/api` continuam sendo a fonte
 * única das regras de Agenda; esta ponte apenas preserva o contrato de banco.
 */
class SqliteD1Statement {
  public readonly sql: string;
  private readonly parameters: unknown[];

  constructor(sql: string, parameters: unknown[] = []) {
    this.sql = sql;
    this.parameters = parameters;
  }

  bind(...values: unknown[]): SqliteD1Statement {
    return new SqliteD1Statement(this.sql, values);
  }

  runSync(): D1RunResult {
    const startedAt = Date.now();
    const result = sqlite.prepare(this.sql).run(...this.parameters);
    return {
      success: true,
      meta: {
        changes: result.changes,
        duration: Date.now() - startedAt,
        last_row_id: Number(result.lastInsertRowid),
      },
    };
  }

  firstSync<T>(): T | null {
    return (
      (sqlite.prepare(this.sql).get(...this.parameters) as T | undefined) ??
      null
    );
  }

  allSync<T>(): D1AllResult<T> {
    const startedAt = Date.now();
    const results = sqlite.prepare(this.sql).all(...this.parameters) as T[];
    return {
      success: true,
      results,
      meta: { changes: 0, duration: Date.now() - startedAt },
    };
  }

  async run(): Promise<D1RunResult> {
    return this.runSync();
  }

  async first<T>(): Promise<T | null> {
    return this.firstSync<T>();
  }

  async all<T>(): Promise<D1AllResult<T>> {
    return this.allSync<T>();
  }

  async raw<T extends unknown[] = unknown[]>(): Promise<T[]> {
    return sqlite
      .prepare(this.sql)
      .raw(true)
      .all(...this.parameters) as T[];
  }
}

class SqliteD1Adapter {
  prepare(sql: string): SqliteD1Statement {
    return new SqliteD1Statement(sql);
  }

  async batch(statements: SqliteD1Statement[]): Promise<D1RunResult[]> {
    const results: D1RunResult[] = [];
    const transaction = sqlite.transaction(() => {
      for (const statement of statements) {
        if (!(statement instanceof SqliteD1Statement)) {
          throw new Error("AGENDA_DB_ADAPTER_STATEMENT_INVALID");
        }
        results.push(statement.runSync());
      }
    });
    transaction();
    return results;
  }

  async exec(query: string): Promise<{ count: number; duration: number }> {
    const startedAt = Date.now();
    sqlite.exec(query);
    return { count: 0, duration: Date.now() - startedAt };
  }
}

const bookingDb = new SqliteD1Adapter();

type BookingDatabase = object;
type AuthedExpressRequest = ExpressRequest & {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
};

function operationalEnv() {
  const operationalKey = process.env.OPERATIONAL_DATA_KEY?.trim();
  if (!operationalKey || operationalKey.length < 32) {
    throw new Error("OPERATIONAL_CRYPTO_NOT_CONFIGURED");
  }
  return {
    DB: bookingDb as unknown as BookingDatabase,
    OPERATIONAL_DATA_KEY: operationalKey,
  };
}

function buildRequest(req: AuthedExpressRequest): globalThis.Request {
  const protocol = req.protocol || "http";
  const host = req.get("host") || "localhost";
  const bodyAllowed = req.method !== "GET" && req.method !== "HEAD";
  const headers = new Headers();
  for (const [name, value] of Object.entries(req.headers)) {
    if (typeof value === "string") headers.set(name, value);
    else if (Array.isArray(value)) headers.set(name, value.join(", "));
  }
  if (bodyAllowed && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  return new globalThis.Request(`${protocol}://${host}${req.originalUrl}`, {
    method: req.method,
    headers,
    body: bodyAllowed ? JSON.stringify(req.body ?? {}) : undefined,
  });
}

function buildAuthContext(req: AuthedExpressRequest) {
  return req.user
    ? {
        authUser: {
          id: req.user.id,
          email: req.user.email,
          name: req.user.name,
          role: req.user.role,
          mustChangePassword: false,
        },
      }
    : undefined;
}

async function sendWebResponse(
  response: globalThis.Response,
  res: Response,
): Promise<void> {
  response.headers.forEach((value, key) => res.setHeader(key, value));
  const body = await response.text();
  const contentType = response.headers.get("content-type") || "";
  res.status(response.status);
  if (contentType.includes("application/json")) {
    try {
      res.json(JSON.parse(body));
      return;
    } catch {
      // Resposta inválida não deve derrubar o processo; devolve o corpo original.
    }
  }
  res.send(body);
}

type PagesHandler = (context: {
  env: ReturnType<typeof operationalEnv>;
  request: globalThis.Request;
  data?: unknown;
}) => Promise<globalThis.Response>;

function bridge(handler: PagesHandler) {
  return async (req: AuthedExpressRequest, res: Response): Promise<void> => {
    try {
      const response = await handler({
        env: operationalEnv(),
        request: buildRequest(req),
        data: buildAuthContext(req),
      });
      await sendWebResponse(response, res);
    } catch (error) {
      if (error instanceof Error && error.message === "OPERATIONAL_CRYPTO_NOT_CONFIGURED") {
        if (!res.headersSent) {
          res.status(503).json({
            error: "Criptografia operacional não configurada.",
            code: "OPERATIONAL_CRYPTO_NOT_CONFIGURED",
          });
        }
        return;
      }
      console.error("[booking-adapter]", error);
      if (!res.headersSent) {
        res.status(500).json({
          error: "Não foi possível processar a Agenda.",
          code: "BOOKING_BACKEND_FAILED",
        });
      }
    }
  };
}

export function registerBookingRoutes(app: Express): void {
  app.get(
    "/api/operations",
    requireAuth,
    bridge(operationsGet as unknown as PagesHandler),
  );
  app.post(
    "/api/operations",
    requireAuth,
    bridge(operationsPost as unknown as PagesHandler),
  );

  app.get(
    "/api/public-booking",
    bridge(publicBookingGet as unknown as PagesHandler),
  );
  app.post(
    "/api/public-booking",
    bridge(publicBookingPost as unknown as PagesHandler),
  );
}
