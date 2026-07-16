import { isPublicRoute as isAllowlistedPublicRoute } from "@/lib/publicRoutes";

export type AccessLevel = "public" | "family" | "family-pass" | "clinical";

export function getAccessLevel(pathname: string): AccessLevel {
  // Uma única allowlist governa PIN local, zona pública e autenticação remota.
  // Qualquer rota nova ou desconhecida fica fechada até ser revisada e incluída
  // explicitamente em publicRoutes.ts.
  return isAllowlistedPublicRoute(pathname) ? "public" : "clinical";
}

export function isClinicalRoute(pathname: string): boolean {
  return getAccessLevel(pathname) === "clinical";
}

export function isPublicRoute(pathname: string): boolean {
  return getAccessLevel(pathname) === "public";
}
