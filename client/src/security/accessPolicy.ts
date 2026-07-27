import { isPublicRoute as isAllowlistedPublicRoute } from "@/lib/publicRoutes";

export type AccessLevel = "public" | "family" | "family-pass" | "clinical";

// ACESSO ABERTO (decisão explícita do autor, Dr. Jadson Fraga): quando true, o
// app INTEIRO é navegável SEM qualquer senha — nem PIN local, nem login remoto.
// Toda rota é tratada como pública para efeito das trancas de UI.
//
// Isto remove apenas as TRANCAS DE INTERFACE. A proteção real dos dados de
// paciente persistidos no backend (Cloudflare D1) permanece na camada de API:
// as Functions clínicas continuam exigindo JWT para ler/gravar prontuário. Ou
// seja, as telas abrem, mas o dado armazenado no servidor não é servido sem
// sessão. Reversível: basta voltar OPEN_ACCESS para false e o modelo
// "seguro por padrão" (allowlist pública + PIN/login) volta a valer.
export const OPEN_ACCESS = true;

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
