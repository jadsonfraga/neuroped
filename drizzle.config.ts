import { defineConfig } from "drizzle-kit";

const databaseUrl = process.env.DATABASE_URL;
const allowLocalSchemaTools =
  process.env.NEUROPED_ALLOW_LOCAL_SCHEMA_TOOLS === "1";

if (!databaseUrl || !allowLocalSchemaTools) {
  throw new Error(
    "Drizzle está restrito ao desenvolvimento local. Produção usa D1 pelos workflows oficiais.",
  );
}

const hostname = new URL(databaseUrl).hostname;
if (!new Set(["localhost", "127.0.0.1", "::1"]).has(hostname)) {
  throw new Error("Drizzle não pode apontar para banco externo.");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});
