/**
 * Tipos compartilhados para APIs SaaS
 */

import type { Context } from "hono";
import type { Database } from "better-sqlite3";

export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "professional" | "reader" | "operator";
  clinicId?: string;
}

export interface HonoContext {
  Variables: {
    user: User | null;
    db: Database | null;
    clinicId: string | null;
  };
}

export type SaasContext = Context<HonoContext>;
