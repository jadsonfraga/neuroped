/** Binary layout checks; uses no real patient, drug, prescription, certificate or external API. */
import { execFileSync } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { build } from "esbuild";
const cwd = process.cwd();
const workspace = await mkdtemp(join(cwd, "tests", ".layout-c1-"));
const output = join(workspace, "synthetic-pdf-c1.mjs");
try {
  await build({
    absWorkingDir: cwd, entryPoints: ["tests/fixtures/pdf-facsimile-c1.ts"], outfile: output,
    bundle: true, platform: "node", format: "esm", packages: "external",
    alias: { "@": "./client/src", "@shared": "./shared", "@assets": "./attached_assets" },
    loader: { ".jpeg": "dataurl", ".jpg": "dataurl", ".png": "dataurl", ".svg": "dataurl", ".webp": "dataurl", ".css": "text" },
  });
  execFileSync(process.execPath, ["--test", output], { cwd, stdio: "inherit" });
} finally { await rm(workspace, { recursive: true, force: true }); }
