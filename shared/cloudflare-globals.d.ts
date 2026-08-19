import type {
  D1Database as CloudflareD1Database,
  D1PreparedStatement as CloudflareD1PreparedStatement,
} from "@cloudflare/workers-types";

declare global {
  type D1Database = CloudflareD1Database;
  type D1PreparedStatement = CloudflareD1PreparedStatement;
  type PagesFunction<
    Env = unknown,
    Params extends string = any,
    Data extends Record<string, unknown> = Record<string, unknown>,
  > = (context: {
    request: globalThis.Request;
    functionPath: string;
    waitUntil: (promise: Promise<unknown>) => void;
    passThroughOnException: () => void;
    next: (input?: globalThis.Request | string, init?: globalThis.RequestInit) => Promise<globalThis.Response>;
    env: Env;
    params: Record<string, string | undefined>;
    data: Data;
  }) => globalThis.Response | Promise<globalThis.Response>;
}

export {};
