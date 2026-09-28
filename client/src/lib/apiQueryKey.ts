/**
 * As queries da API usam o endpoint completo (com query string) como primeiro
 * elemento da chave, ex.: ["/api/patients?q=&page=2&limit=50"]. O casamento
 * parcial do TanStack Query compara elementos inteiros, então invalidar
 * ["/api/patients"] NÃO atinge essas chaves — e, com staleTime: Infinity, a
 * lista ficava desatualizada até recarregar a página.
 *
 * Casa o endpoint exato, com query string ou sub-recurso — nunca um prefixo
 * textual solto (ex.: "/api/patients" não casa "/api/patients-archive").
 */
export function apiQueryKeyMatches(queryKey: readonly unknown[], endpoint: string): boolean {
  const head = queryKey[0];
  if (typeof head !== "string") return false;
  return head === endpoint || head.startsWith(`${endpoint}?`) || head.startsWith(`${endpoint}/`);
}
