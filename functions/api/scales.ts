export const onRequestGet: PagesFunction = async () => {
  return Response.json({
    ok: true,
    total: 507,
    entrypoint: "/escalas.html",
    pages: [
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
