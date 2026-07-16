export interface DirectResponseItem {
  question: string;
  answer: string;
}

export interface DirectTestRecord {
  id: string;
  label: string;
  responses: DirectResponseItem[];
}

/**
 * Monta a entrega única dos testes diretos sem inferir desempenho. A ordem dos
 * testes e das tentativas é preservada para que o profissional receba exatamente
 * o estímulo apresentado e a resposta fornecida pela criança.
 */
export function buildDirectSessionItems(
  records: Readonly<Record<string, DirectTestRecord>>,
  orderedIds: readonly string[],
): DirectResponseItem[] {
  return orderedIds.flatMap((id) => {
    const record = records[id];
    if (!record) return [];
    return record.responses.map((response, index) => ({
      question: `[${record.label} · tentativa ${index + 1}] ${response.question}`,
      answer: response.answer,
    }));
  });
}
