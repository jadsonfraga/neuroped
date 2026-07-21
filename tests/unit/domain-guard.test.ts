import assert from "node:assert/strict";
import { isAuthorizedHost } from "../../client/src/lib/domainGuard";

for (const host of [
  "neuroped.vercel.app",
  "neuroped-git-main-jadsonfragas-projects.vercel.app",
  "superneuroped.vercel.app",
  "superneuroped-git-main-jadsonfragas-projects.vercel.app",
]) {
  assert.equal(isAuthorizedHost(host), true, `${host} deve ser autorizado`);
}

for (const host of [
  "evil-neuroped.vercel.app",
  "neuroped.vercel.app.example.com",
  "neuroped-attacker.example.com",
]) {
  assert.equal(
    isAuthorizedHost(host),
    false,
    `${host} deve permanecer bloqueado`,
  );
}

console.log("✓ trava de domínio autoriza somente hosts oficiais do NeuroPed");
