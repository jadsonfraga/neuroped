import assert from "node:assert/strict";
import { isAuthorizedHost } from "../../client/src/lib/domainGuard";

for (const host of [
  "neuroped.pages.dev",
  "superneuroped.vercel.app",
  "NEUROPED.PAGES.DEV.",
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "[::1]",
]) {
  assert.equal(isAuthorizedHost(host), true, `${host} deve ser autorizado`);
}

for (const host of [
  "neuroped.vercel.app",
  "evil-neuroped.vercel.app",
  "neuroped-git-main-jadsonfragas-projects.vercel.app",
  "superneuroped-git-main-jadsonfragas-projects.vercel.app",
  "e30b5544.neuroped.pages.dev",
  "neuroped.vercel.app.example.com",
  "neuroped-attacker.example.com",
  "jadsonfraga.github.io",
  "192.168.1.42",
  "10.0.0.8",
  "172.16.0.10",
  "169.254.10.20",
  "fc00::42",
]) {
  assert.equal(
    isAuthorizedHost(host),
    false,
    `${host} deve permanecer bloqueado no build de produção`,
  );
}

for (const host of [
  "192.168.1.42",
  "10.0.0.8",
  "172.16.0.10",
  "169.254.10.20",
  "[fc00::42]",
  "[fe80::1]",
]) {
  assert.equal(
    isAuthorizedHost(host, { allowPrivateNetwork: true }),
    true,
    `${host} deve funcionar quando o Vite expõe o WebUI na rede local`,
  );
}

assert.equal(
  isAuthorizedHost("8.8.8.8", { allowPrivateNetwork: true }),
  false,
  "IP público não pode ser liberado pela exceção de rede privada",
);
assert.equal(
  isAuthorizedHost("neuroped.pages.dev.evil.example", { allowPrivateNetwork: true }),
  false,
  "lookalike de domínio oficial não pode ser liberado",
);

console.log("✓ trava de domínio autoriza hosts oficiais e rede privada somente no desenvolvimento");
