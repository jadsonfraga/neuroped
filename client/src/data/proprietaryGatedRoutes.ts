// Rotas de escalas PROPRIETÁRIAS com página dedicada que reproduziam itens.
// Gate de copyright: redirecionadas para /generic-scale/<id>, que renderiza a
// FICHA (metadado, sem itens nem escore) — não a aplicação interativa.
//
// Mantida estática e leve (não importa o catálogo). O invariante
// scripts/guards/audit-copyright-gate.mjs FALHA se uma proprietária (licencaUso
// comercial/restrita/contato_autor) voltar a ter runner com itens.
export const PROPRIETARY_GATED_ROUTES: ReadonlyArray<{ path: string; id: string }> = [
  { path: "/denver", id: "denver" },
  { path: "/asq3", id: "asq3" },
  { path: "/cars", id: "cars" },
  { path: "/conners", id: "conners" },
  { path: "/brief2", id: "brief2" },
  { path: "/cbcl", id: "cbcl" },
  { path: "/abc", id: "abc" },
  { path: "/cdi2", id: "cdi2" },
  { path: "/cshq", id: "cshq" },
  { path: "/vineland", id: "vineland" },
  { path: "/pedsql", id: "pedsql" },
];
