import assert from "node:assert/strict";
import { getAccessLevel } from "../../client/src/security/accessPolicy.ts";
import { decideRouteAccess } from "../../client/src/security/routeGuardPolicy.ts";

for (const path of [
  "/",
  "/mchat",
  "/cars",
  "/filtro",
  "/generic-scale/smfq",
  "/rota-clinica-adicionada-no-futuro",
  "/familiares",
  "/login-admin",
]) {
  assert.equal(getAccessLevel(path), "clinical", `${path} deve falhar fechado`);
}

for (const path of [
  "/login",
  "/login?next=%2Fpacientes",
  "/sessao-expirada",
  "/familia",
  "/portal-familia/novidades",
]) {
  assert.equal(getAccessLevel(path), "public", `${path} deve permanecer pública`);
}

assert.equal(
  decideRouteAccess({
    path: "/mchat",
    accessMode: "checking",
    isAuthenticated: false,
    isLoading: true,
  }),
  "checking",
);
assert.equal(
  decideRouteAccess({
    path: "/mchat",
    accessMode: "remote",
    isAuthenticated: false,
    isLoading: true,
  }),
  "checking",
);
assert.equal(
  decideRouteAccess({
    path: "/mchat",
    accessMode: "remote",
    isAuthenticated: true,
    isLoading: true,
  }),
  "checking",
);
assert.equal(
  decideRouteAccess({
    path: "/mchat",
    accessMode: "remote",
    isAuthenticated: false,
    isLoading: false,
  }),
  "login",
);
assert.equal(
  decideRouteAccess({
    path: "/mchat",
    accessMode: "remote",
    isAuthenticated: true,
    isLoading: false,
  }),
  "allow",
);
assert.equal(
  decideRouteAccess({
    path: "/familia",
    accessMode: "remote",
    isAuthenticated: false,
    isLoading: true,
  }),
  "allow",
);
assert.equal(
  decideRouteAccess({
    path: "/mchat",
    accessMode: "local",
    isAuthenticated: false,
    isLoading: false,
  }),
  "allow",
);

console.log("✓ rotas remotas falham fechadas e aguardam o bootstrap de autenticação");
