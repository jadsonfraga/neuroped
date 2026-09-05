import { isDeepStrictEqual } from "node:util";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export function verifySdgDeployment(expectedCommit, expectedManifest, payloads) {
  if (!/^[a-f0-9]{40}$/.test(expectedCommit)) throw new Error("Commit esperado deve ser um SHA completo.");
  const cloudflare = payloads.cloudflare?.sentinel;
  const vercel = payloads.vercel?.sentinel;
  const health = payloads.health;
  const checks = {
    cloudflareCommit: cloudflare?.provider === "cloudflare-pages" && cloudflare?.status === "deployed" && cloudflare?.commit === expectedCommit,
    vercelCommit: vercel?.provider === "vercel" && vercel?.status === "deployed" && [expectedCommit, expectedCommit.slice(0, 12)].includes(vercel?.commit),
    cloudflareCatalog: isDeepStrictEqual(payloads.cloudflare?.manifest, expectedManifest),
    vercelCatalog: isDeepStrictEqual(payloads.vercel?.manifest, expectedManifest),
    backend: health?.database === "ok" && health?.authentication?.required === true && health?.authentication?.configured === true,
  };
  return { ok: Object.values(checks).every(Boolean), expectedCommit, checks };
}

async function getPublicJson(url) {
  let lastError;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(`${url}?sdg_check=${Date.now()}-${attempt}`, { signal: AbortSignal.timeout(15000), headers: { accept: "application/json", "cache-control": "no-cache" } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      lastError = error;
      if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  throw new Error(`Falha ao verificar ${new URL(url).hostname}: ${lastError instanceof Error ? lastError.message : "resposta inválida"}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    const [commit, manifestPath] = process.argv.slice(2);
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    if (manifest.schemaVersion !== 1 || !Array.isArray(manifest.instruments) || manifest.instruments.length === 0) throw new Error("Manifesto local ausente ou inválido.");
    const [cfSentinel, vcSentinel, cfManifest, vcManifest, health] = await Promise.all([
      getPublicJson("https://neuroped.pages.dev/deploy-check.json"),
      getPublicJson("https://superneuroped.vercel.app/deploy-check.json"),
      getPublicJson("https://neuroped.pages.dev/authorial-sdg-manifest.json"),
      getPublicJson("https://superneuroped.vercel.app/authorial-sdg-manifest.json"),
      getPublicJson("https://neuroped.pages.dev/api/health"),
    ]);
    const result = verifySdgDeployment(commit, manifest, { cloudflare: { sentinel: cfSentinel, manifest: cfManifest }, vercel: { sentinel: vcSentinel, manifest: vcManifest }, health });
    console.log(JSON.stringify(result, null, 2));
    process.exitCode = result.ok ? 0 : 1;
  } catch (error) {
    console.error(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : "Falha de verificação" }));
    process.exitCode = 1;
  }
}
