import express, { type Express } from "express";
import fs from "fs";
import path from "path";

function firstExistingPath(candidates: string[]): string | null {
  return candidates.find((candidate) => fs.existsSync(candidate)) ?? null;
}

export function serveStatic(app: Express) {
  const bundleDir = typeof __dirname !== "undefined" ? __dirname : null;
  const distPath = firstExistingPath([
    path.resolve(process.cwd(), "dist", "public"),
    path.resolve(process.cwd(), "public"),
    ...(bundleDir ? [path.resolve(bundleDir, "public")] : []),
  ]);

  if (!distPath) {
    throw new Error(
      "Could not find the client build directory. Run `npm run build` before starting production.",
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("/{*path}", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
