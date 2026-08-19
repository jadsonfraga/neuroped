import { isPublicRoute as isAllowlistedPublicRoute } from "@/lib/publicRoutes";

export type AccessLevel = "public" | "family" | "family-pass" | "clinical";

// Modo aberto é opt-in e nunca pode ser ativado por default no bundle de produção.
// Ele remove apenas as trancas de interface para instalações locais de demonstração;
// a proteção real dos dados clínicos continua obrigatória no backend.
// Para uma instalação local explicitamente controlada, use VITE_OPEN_ACCESS=true.
// O workflow de produção define VITE_OPEN_ACCESS=false de forma explícita.
const BUILD_OPEN_ACCESS =
  typeof __NEUROPED_OPEN_ACCESS__ === "boolean"
    ? __NEUROPED_OPEN_ACCESS__
    : import.meta.env?.VITE_OPEN_ACCESS === "true";

export const OPEN_ACCESS = BUILD_OPEN_ACCESS;

export function getAccessLevel(pathname: string): AccessLevel {
  if (OPEN_ACCESS) return "public";
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
