import { circuitForAge, type CircuitRecords } from "./clinicalCircuit";

/**
 * Guias de coleta por hipótese clínica. Organizam o que precisa ser observado ou relatado para o médico
 * investigar uma hipótese. Não pontuam, não comparam com norma e não estabelecem diagnóstico: a conclusão
 * depende da história longitudinal, de múltiplos contextos e de avaliação clínica do médico.
 */
export interface ItemColeta {
  id: string;
  texto: string;
  /** Estações do circuito que coletam este dado nas faixas em que existem. */
  estacoes: readonly string[];
  /** Fonte que o jogo não coleta: relato, documento ou exame. Sem ela, o item não se resolve pelas estações. */
  fonteExterna?: string;
}

export interface GuiaHipotese {
  id: string;
  titulo: string;
  min: number;
  max: number;
  objetivo: string;
  itens: readonly ItemColeta[];
}

export const GUIAS_HIPOTESE: readonly GuiaHipotese[] = [
  {
    id: "linguagem_comunicacao",
    titulo: "Linguagem e comunicação social na primeira infância (2 a 5 anos)",
    min: 2,
    max: 5,
    objetivo: "Organiza a coleta de linguagem, reciprocidade e comportamentos repetitivos. Não é critério diagnóstico de transtorno do espectro autista.",
    itens: [
      { id: "reciprocidade", texto: "Reciprocidade e atenção compartilhada observadas no brincar", estacoes: ["social2", "rapport"] },
      { id: "compreensao", texto: "Compreensão de comandos e nomeação observadas", estacoes: ["language2"] },
      { id: "comunicacao_funcional", texto: "Comunicação funcional por fala, gesto ou comunicação alternativa", estacoes: ["language2", "social2"] },
      { id: "padroes_repetitivos", texto: "Interesses restritos e movimentos repetitivos observados", estacoes: ["involuntary", "attention2"] },
      { id: "historia_desenvolvimento", texto: "Marcos e perda de habilidades relatados pelo cuidador", estacoes: ["milestones"] },
      { id: "audicao", texto: "Resposta auditiva e avaliação audiológica quando indicada", estacoes: ["hearing"], fonteExterna: "audiologia, quando indicada" },
    ],
  },
  {
    id: "aprendizagem_atencao",
    titulo: "Aprendizagem, atenção e funcionamento escolar (6 a 17 anos)",
    min: 6,
    max: 17,
    objetivo: "Organiza a coleta de atenção, funções executivas e aprendizagem. Sintomas precisam ser avaliados em mais de um contexto e com prejuízo documentado; o jogo não estabelece diagnóstico.",
    itens: [
      { id: "atencao_sustentada", texto: "Atenção sustentada e regulação após interrupção", estacoes: ["attention2", "attention6"] },
      { id: "flexibilidade", texto: "Flexibilidade e troca de regra", estacoes: ["attention6"] },
      { id: "leitura_escrita_calculo", texto: "Leitura, escrita e cálculo observados, quando alfabetizado", estacoes: ["language6", "copy6"] },
      { id: "funcionamento_escolar", texto: "Desempenho escolar e instrução recebida, relatados pela escola", estacoes: [], fonteExterna: "relatório ou relato escolar" },
      { id: "multiplos_contextos", texto: "Sintomas relatados em mais de um contexto (casa e escola)", estacoes: ["milestones"], fonteExterna: "relato de dois contextos" },
      { id: "sono_humor_diferenciais", texto: "Sono, humor e ansiedade como diferenciais", estacoes: ["sleep", "emotion6"] },
    ],
  },
  {
    id: "saude_mental_adolescencia",
    titulo: "Saúde mental na adolescência (12 a 17 anos)",
    min: 12,
    max: 17,
    objetivo: "Organiza entrevista e observação do estado mental. A entrevista de risco é privativa do profissional, reservada e não gamificada.",
    itens: [
      { id: "humor_afeto", texto: "Humor, afeto e congruência com o relato", estacoes: ["emotion6"] },
      { id: "pensamento", texto: "Forma e conteúdo do pensamento em diálogo reservado", estacoes: ["thought6"] },
      { id: "sono_energia", texto: "Sono, energia e rotina", estacoes: ["sleep"] },
      { id: "funcionamento_social", texto: "Relações e repercussões funcionais", estacoes: ["conversation6", "rapport"] },
      { id: "seguranca", texto: "Avaliação de segurança em entrevista reservada, somente profissional", estacoes: ["risk"] },
      { id: "historia_longitudinal", texto: "História longitudinal com dois ou mais informantes", estacoes: [], fonteExterna: "prontuário e relatos de informantes" },
    ],
  },
];

export type EstadoItem = "coletado" | "achado_a_esclarecer" | "fonte_externa" | "pendente";

export const ESTADO_ITEM_LABELS: Record<EstadoItem, string> = {
  coletado: "Coletado nas estações",
  achado_a_esclarecer: "Achado a esclarecer",
  fonte_externa: "Depende de fonte externa",
  pendente: "Pendente",
};

/** Guias cuja faixa inclui a idade informada. */
export function guiasAplicaveis(years: number): GuiaHipotese[] {
  return GUIAS_HIPOTESE.filter((guia) => years >= guia.min && years <= guia.max);
}

/** Estado de um item de coleta. Só a estação registrada resolve o item; fonte externa nunca vira coletada pelo jogo. */
export function estadoItem(item: ItemColeta, years: number, records: CircuitRecords): EstadoItem {
  const presentes = circuitForAge(years).map((task) => task.id);
  const aplicaveis = item.estacoes.filter((id) => presentes.includes(id));
  if (aplicaveis.some((id) => records[id]?.status === "achado")) return "achado_a_esclarecer";
  if (aplicaveis.some((id) => records[id]?.status === "observado")) return "coletado";
  if (item.fonteExterna) return "fonte_externa";
  return "pendente";
}
