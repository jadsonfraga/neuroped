// Isolated local-only harness. Uses an actual compiled Pages Worker and D1,
// including for the two faults. No fixture DB from outside the repository.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { pathToFileURL } from "node:url";
import { startStaticServer } from "../../../scripts/lib/browser-audit-runtime.mjs";

const fault = process.env.SCALE_RETRY_FAULT;
let nextFault = fault;
assert.ok([undefined, "db", "response"].includes(fault));
assert.ok(process.env.SCALE_RETRY_MINIFLARE && process.env.SCALE_RETRY_WORKER, "Informe Miniflare e o Worker local compilado");
const { Miniflare, convertV4MiniflareOptions } = await import(pathToFileURL(process.env.SCALE_RETRY_MINIFLARE));
const password = randomBytes(24).toString("base64url");
const env = { ...process.env, LIVE_DISCOVERY_EMAIL: "owner-a@example.test", LIVE_DISCOVERY_PASSWORD: password };

function run(args, childEnv) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, { stdio: "inherit", env: childEnv });
    child.on("error", reject);
    child.on("exit", code => resolve(code ?? 1));
  });
}

const temp = mkdtempSync(join(tmpdir(), "neuroped-scale-retry-"));
const dbPath = join(temp, "fixture.sqlite");
let mf, server;
try {
  assert.equal(await run(["--import", "tsx", "tests/e2e/fixtures/live-patient-discovery.mts", dbPath], env), 0);
  const options = {
    modules: true,
    script: readFileSync(process.env.SCALE_RETRY_WORKER, "utf8"),
    compatibilityDate: "2024-11-01",
    compatibilityFlags: ["nodejs_compat"],
    d1Databases: { DB: "scale-retry-synthetic" },
    bindings: {
      ENVIRONMENT: "production",
      CLINICAL_LIVE_ENABLED: "true",
      NEUROPED_JWT_SECRET: randomBytes(48).toString("base64url"),
      CLINICAL_DATA_KEY: "multiclinic-data-key-0123456789-ABCDEFGHIJKLMNOPQRSTUVWXYZ",
      CLINICAL_DATA_KEY_ID: "k-mc-1",
      CLINICAL_INDEX_KEY: "multiclinic-index-key-9876543210-ZYXWVUTSRQPONMLKJIHGFEDCBA",
    },
  };
  mf = new Miniflare(convertV4MiniflareOptions ? convertV4MiniflareOptions(options) : options);
  const d1 = await mf.getD1Database("DB");
  const raw = new DatabaseSync(dbPath, { readOnly: true });
  try {
    const types = new Map(raw.prepare("PRAGMA table_list").all().map(row => [row.name, row.type]));
    const schema = raw.prepare("SELECT * FROM sqlite_schema WHERE sql IS NOT NULL AND name NOT LIKE 'sqlite_%'").all();
    const tables = schema.filter(row => row.type === "table" && types.get(row.name) === "table");
    const quote = name => '"' + name.replaceAll('"', '""') + '"';
    const insert = [];
    for (const table of tables) {
      const cols = raw.prepare("PRAGMA table_info(" + quote(table.name) + ")").all().map(row => quote(row.name));
      for (const { vals } of raw.prepare("SELECT " + cols.map(col => "quote(" + col + ")").join("||','||") + " AS vals FROM " + quote(table.name)).all()) {
        insert.push("INSERT INTO " + quote(table.name) + " (" + cols.join(",") + ") VALUES (" + vals + ")");
      }
    }
    const extra = schema.filter(row => ["trigger", "index"].includes(row.type) && types.get(row.tbl_name) === "table" &&
      !/notifications_fts|clinical_notes_fts|memory_fts/.test(row.sql));
    for (const statements of [tables.map(row => row.sql), ["PRAGMA defer_foreign_keys=ON", ...insert], extra.map(row => row.sql)]) {
      await d1.batch(statements.map(sql => d1.prepare(sql)));
    }
  } finally {
    raw.close();
  }

  if (fault === "db") {
    await d1.prepare("CREATE TRIGGER test_scale_document_failure BEFORE INSERT ON live_documents WHEN NEW.document_type = 'scale' BEGIN SELECT RAISE(ABORT, 'synthetic document write failure'); END").run();
  }
  server = await startStaticServer("dist/public", { port: 0, async apiHandler(req, res) {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const url = new URL(req.url, server.origin);
    const response = await mf.dispatchFetch(url.href, {
      method: req.method, headers: req.headers,
      body: /^(GET|HEAD)$/.test(req.method) ? undefined : Buffer.concat(chunks),
    });
    if (url.pathname === "/api/live/documents" && req.method === "POST" && nextFault) {
      const event = nextFault;
      nextFault = undefined;
      if (event === "db") {
        assert.equal(response.status, 500);
        await d1.prepare("DROP TRIGGER test_scale_document_failure").run();
      } else {
        assert.equal(response.status, 201);
        // Deliver the real status and only the start of its body. A reset
        // before headers could cause transport-level replay by Chromium.
        const body = Buffer.from(await response.arrayBuffer());
        assert.ok(body.length > 1);
        res.writeHead(response.status, {
          "Content-Type": response.headers.get("content-type") ?? "application/json",
          "Content-Length": body.length,
          Connection: "close",
        });
        res.end(body.subarray(0, 1));
        return true;
      }
    }
    const headers = Object.fromEntries(response.headers);
    delete headers["content-length"];
    delete headers["content-encoding"];
    res.writeHead(response.status, headers);
    res.end(Buffer.from(await response.arrayBuffer()));
    return true;
  }});
  process.exitCode = await run(["tests/e2e/live-scale-save-retry.mjs"], { ...env, LIVE_DISCOVERY_URL: server.origin });
  if (process.exitCode === 0) assert.equal(nextFault, undefined, "a falha solicitada não foi exercitada");
} finally {
  await server?.close();
  await mf?.dispose();
  rmSync(temp, { recursive: true, force: true });
}
