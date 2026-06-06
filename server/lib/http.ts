/**
 * Utilitarios HTTP compartilhados.
 *
 * No Express 5, quando uma rota recebe middlewares encadeados
 * (ex.: app.get(path, requireAuth, handler)) o TypeScript nao consegue
 * inferir os parametros da rota e cai no default ParamsDictionary, cujo
 * index signature e `string | string[]`. oneParam normaliza isso para o
 * valor unico esperado pelos handlers de rota :id.
 */
export function oneParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}
