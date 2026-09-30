#!/usr/bin/env node
/**
 * Sentinela pública de deploy do Cloudflare Pages (client/public/deploy-check.json).
 *
 * Toda publicação de produção no Pages precisa gravar o commit/execução reais
 * ANTES do build: senão o arquivo commitado ("pending-deploy-workflow") vai ao
 * ar e o Deploy Vercel, o smoke S13 e a verificação do apex deixam de enxergar o
 * commit publicado. Usado pelo deploy canônico (deploy-cloudflare.yml) e pelos
 * outros workflows que republicam o Pages (boaconsulta-import-release.yml,
 * provision-d1.yml), com os mesmos campos.
 */
import { mkdirSync, writeFileSync } from "node:fs";

export function deployCheck(env = process.env, now = new Date()) {
  const required = ["GITHUB_REF_NAME", "GITHUB_SHA", "GITHUB_RUN_ID", "GITHUB_RUN_NUMBER"];
  const missing = required.filter((name) => !env[name]);
  if (missing.length) throw new Error(`Variáveis ausentes para a sentinela de deploy: ${missing.join(", ")}`);
  if (!/^[a-f0-9]{40}$/.test(env.GITHUB_SHA)) throw new Error("GITHUB_SHA inválido para a sentinela de deploy.");
  return {
    app: "NeuroPed",
    provider: "cloudflare-pages",
    branch: env.GITHUB_REF_NAME,
    commit: env.GITHUB_SHA,
    run_id: String(env.GITHUB_RUN_ID),
    run_number: String(env.GITHUB_RUN_NUMBER),
    deployed_at_utc: now.toISOString().replace(/\.\d{3}Z$/, "Z"),
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const target = process.argv[2] || "client/public/deploy-check.json";
    mkdirSync(target.replace(/\/[^/]+$/, ""), { recursive: true });
    const body = `${JSON.stringify(deployCheck(), null, 2)}\n`;
    writeFileSync(target, body);
    process.stdout.write(body);
  } catch (error) {
    console.log(`::error::${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}
