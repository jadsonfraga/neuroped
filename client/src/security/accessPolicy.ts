import { isPublicRoute as isAllowlistedPublicRoute } from "@/lib/publicRoutes";

export type AccessLevel = "public" | "family" | "family-pass" | "clinical";

// ACESSO ABERTO (decisão do autor): quando true, o app inteiro abre SEM qualquer
// senha — nem PIN local, nem login remoto. Nenhuma rota é tratada como clínica
// para efeito dos gates de UI. Reversível: basta voltar para false e o modelo
// "seguro por padrão" (allowlist pública + PIN/login) volta a valer.
//
// ATENÇÃO: isto remove as TRANCAS DE INTERFACE de todo o app, inclusive das
// áreas de dado de paciente. A proteção real dos dados persistidos no servidor
// (D1) permanece na camada de API (uma sessão ainda é necessária para ler/gravar
// prontuário no backend); mas qualquer pessoa com a URL passa a abrir a interface.
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
