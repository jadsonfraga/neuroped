import assert from "node:assert/strict";
import { test } from "node:test";
import { isKnownRoute } from "../../client/src/security/knownRoutes";
import { canRenderNavigationItem, decideRouteAccess, type RouteUserRole } from "../../client/src/security/routeGuardPolicy";

const guide = "/exame-via-assistente";
const exam = "/exame-neurologico-mental";
const remote = { accessMode: "remote" as const, isAuthenticated: true, isLoading: false };

test("guia independente exige sessão remota e restringe papéis no menu e na rota", () => {
  assert.equal(isKnownRoute(guide), true);
  for (const userRole of ["operator", "professional", "admin", "reader", "visitor"] as RouteUserRole[]) {
    const allowed = userRole === "operator" || userRole === "professional" || userRole === "admin";
    const session = { ...remote, path: guide, userRole };
    assert.equal(decideRouteAccess(session), allowed ? "allow" : "forbidden");
    assert.equal(canRenderNavigationItem(session), allowed);
  }
  assert.equal(decideRouteAccess({ ...remote, isAuthenticated: false, path: guide }), "login");
  assert.equal(decideRouteAccess({ ...remote, accessMode: "checking", path: guide }), "checking");
  assert.equal(decideRouteAccess({ ...remote, accessMode: "local", localPinConfigured: true, localPinUnlocked: true, path: guide }), "forbidden");
});

test("registro da rota médica mantém a barreira efetiva no roteador", () => {
  assert.equal(isKnownRoute(exam), true);
  for (const path of [exam, "/prontuario"]) {
    assert.equal(decideRouteAccess({ ...remote, path, userRole: "operator" }), "forbidden");
    assert.equal(decideRouteAccess({ ...remote, path, isAuthenticated: false }), "login");
    assert.equal(decideRouteAccess({ ...remote, path, userRole: "professional" }), "allow");
  }
});
