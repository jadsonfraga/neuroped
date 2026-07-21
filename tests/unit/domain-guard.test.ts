import assert from "node:assert/strict";
import { isAuthorizedHost } from "../../client/src/lib/domainGuard";

for (const host of ["neuroped.pages.dev", "superneuroped.vercel.app"]) {
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
]) {
  assert.equal(
    isAuthorizedHost(host),
    false,
    `${host} deve permanecer bloqueado`,
  );
}

console.log("✓ trava de domínio autoriza somente hosts oficiais do NeuroPed");
