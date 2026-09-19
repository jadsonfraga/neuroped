export interface PendingAuthorialScaleIntake {
  id: string;
  title: string;
  expectedItems: number;
  knownDomains: string[];
  sourceStatus: "pendente_ingestao_fonte";
  filterStatus: "blocked_until_source_verified";
  reason: string;
}

/**
 * Instrumentos concluídos/informados pelo autor, mas sem fonte integral
 * recuperável no repositório/Drive atual. Permanecem fora do catálogo aplicável
 * para impedir reconstrução por memória, duplicação ou publicação de itens não
 * confrontados com a fonte canônica.
 */
export const pendingAuthorialScaleIntakes: PendingAuthorialScaleIntake[] = [
  {
    id: "pronto-sdg-28",
    title: "PRONTO-SDG 28 — Mapa Clínico Autoral de Prontidão Funcional Escolar",
    expectedItems: 28,
    knownDomains: ["rotina e permanência", "comunicação funcional", "autorregulação", "participação social", "coordenação prática", "aprendizagem e organização", "autonomia escolar"],
    sourceStatus: "pendente_ingestao_fonte",
    filterStatus: "blocked_until_source_verified",
    reason: "PDF/fonte integral dos 28 itens não localizado; não reconstruir itens a partir de resumo.",
  },  {
    id: "elo-com-30",
    title: "ELO-COM 30 — Mapa Clínico Autoral de Comunicação Funcional e Participação",
    expectedItems: 30,
    knownDomains: ["necessidades e intenções", "compreensão cotidiana", "iniciação, troca e reparo", "uso social e contexto", "flexibilidade e generalização", "participação e segurança funcional"],
    sourceStatus: "pendente_ingestao_fonte",
    filterStatus: "blocked_until_source_verified",
    reason: "Intake prévio já classificou a fonte integral como ausente; requer comparação item a item antes de promoção.",
  },
  {
    id: "passo-16-sdg",
    title: "PASSO-16 SDG — Perfil de Autonomia, Suporte e Segurança no Cotidiano",
    expectedItems: 16,
    knownDomains: ["autocuidado", "rotina e organização", "segurança e participação", "autogestão e pedido de ajuda"],
    sourceStatus: "pendente_ingestao_fonte",
    filterStatus: "blocked_until_source_verified",
    reason: "PDF/fonte integral dos 16 itens não localizado; não reconstruir itens a partir de resumo.",
  },
];

export const PENDING_AUTHORIAL_SOURCE_IDS: ReadonlySet<string> = new Set(
  pendingAuthorialScaleIntakes.map((item) => item.id),
);
