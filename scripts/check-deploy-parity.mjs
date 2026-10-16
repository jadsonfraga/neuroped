// Compara o commit publicado nos dois deploys (Cloudflare Pages × espelho Vercel).
// Uso: node scripts/check-deploy-parity.mjs
// Sai com código 1 se os commits divergirem. Os hashes dos bundles JS SEMPRE
// diferem entre os sites (VITE_API_URL é embutido no build: "" no Cloudflare,
// https://neuroped.pages.dev no Vercel); o que deve coincidir é o commit.
const SITES = {
  cloudflare: "https://neuroped.pages.dev/deploy-check.json",
  vercel: "https://superneuroped.vercel.app/deploy-check.json",
};
const commits = {};
for (const [name, url] of Object.entries(SITES)) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
  const data = await res.json();
  commits[name] = String(data.commit ?? data.deployed_commit ?? "unknown").slice(0, 12);
  console.log(`${name}: ${commits[name]} (${data.deployed_at_utc ?? "?"})`);
}
if (new Set(Object.values(commits)).size !== 1) {
  console.error("DIVERGÊNCIA: os deploys estão em commits diferentes.");
  process.exit(1);
}
console.log("OK: ambos os deploys estão no mesmo commit.");
