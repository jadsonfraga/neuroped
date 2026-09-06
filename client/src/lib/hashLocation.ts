import { useHashLocation } from "wouter/use-hash-location";

/**
 * Caminho da rota a partir do hash, SEM a query.
 *
 * O `useHashLocation` do wouter devolve o hash inteiro como caminho. Quando a
 * URL vem no formato natural que uma pessoa escreve, copia ou salva nos
 * favoritos — `.../#/prontuario?patientId=abc` — o caminho vira
 * `"/prontuario?patientId=abc"` e NENHUMA `<Route path="/prontuario">` casa:
 * o app responde "Página não encontrada" para um link válido.
 *
 * A navegação interna não caía nisso porque o `navigate` do wouter move a
 * query para a query real da URL, produzindo `/?patientId=abc#/prontuario`.
 * Ou seja: o mesmo destino funcionava por dentro e quebrava por fora.
 *
 * Separar caminho de query aqui faz as duas formas resolverem para a mesma
 * rota. A leitura do parâmetro fica com `readRouteParam`
 * (client/src/lib/routeQuery.ts), que aceita as duas formas.
 */
export function hashPathWithoutQuery(location: string): string {
  const path = location.split("?")[0]?.split("#")[0] ?? "/";
  if (!path) return "/";
  return path.startsWith("/") ? path : `/${path}`;
}

export const useAppHashLocation: typeof useHashLocation = (options) => {
  const [location, navigate] = useHashLocation(options);
  return [hashPathWithoutQuery(location), navigate];
};
