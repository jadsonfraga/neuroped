export const onRequestGet: PagesFunction = async () => {
  return Response.json({
    ok: true,
    version: "2.0.0",
    total: 507,
    entrypoint: "/escalas.html",
    sensitive_filter: "/filtro-escalas.html",
    instrument_index: "/scales-index.json",
    model: "instrument_index_v2",
    quality_summary: {
      explicit_items: 37,
      template_rendered: 470,
      normatized_claim: false,
      safe_label:
        "507 instrumentos autorais/operacionais preenchiveis; parte com itens explicitos e parte renderizada por template clinico"
    },
    sensitivity_changes: [
      "ranking por instrumento especifico, nao por pagina/lote generico",
      "idade em meses ou anos com normalizacao automatica",
      "sinonimos clinicos e queixas em linguagem familiar",
      "busca tolerante a pequenos erros de digitacao",
      "badge de qualidade: itens explicitos versus template renderizado"
    ],
    pages: [
      "/filtro-escalas.html",
      "/scales-index.json",
      "/banco-escalas.html",
      "/banco-escalas-lote1.html",
      "/banco-escalas-lote2-80.html",
      "/banco-escalas-lote3-100.html",
      "/banco-escalas-lote4-200.html",
      "/banco-escalas-lote5-90.html"
    ],
    warning:
      "Instrumentos autorais de triagem clinica, nao normatizados. Escalas comerciais/proprietarias permanecem travadas ate licenca formal."
  });
};
