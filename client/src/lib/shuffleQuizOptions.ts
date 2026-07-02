/**
 * Embaralha a ORDEM DE EXIBIÇÃO das alternativas dos testes interativos
 * infantis. Motivação clínica (pedido do autor, 2026-07): a alternativa
 * correta estava quase sempre na primeira posição e as crianças aprenderam
 * o padrão, invalidando a sondagem.
 *
 * Só a exibição muda: o valor marcado continua sendo o ÍNDICE ORIGINAL da
 * alternativa, então `answers[id] === task.correct` (ou a comparação por
 * valor) segue funcionando sem tocar nos dados nem no gabarito.
 *
 * A ordem é sorteada UMA vez por montagem/lista (estável enquanto a criança
 * responde — as opções não pulam de lugar entre cliques) e muda a cada nova
 * aplicação.
 */
import { useMemo } from "react";

export function shuffledIndexOrder(n: number): number[] {
  const order = Array.from({ length: n }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

/** Mapa id da questão → ordem de exibição dos índices das alternativas. */
export function useShuffledOptionOrders(
  tasks: Array<{ id: string; options?: string[] }>
): Record<string, number[]> {
  // Chaveado pelos ids (não pela identidade do array): listas recalculadas a
  // cada render não re-embaralham; trocar de faixa/dificuldade sorteia de novo.
  const key = tasks.map((t) => t.id).join("|");
  return useMemo(() => {
    const m: Record<string, number[]> = {};
    for (const t of tasks) m[t.id] = shuffledIndexOrder(t.options?.length ?? 0);
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}
