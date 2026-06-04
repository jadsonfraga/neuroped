export const onRequestGet: PagesFunction = async () => {
  return Response.json({
    ok: true,
    service: "NeuroPed SDG Backend",
    backend: "Cloudflare Pages Functions",
    database: "D1",
    version: "1.0.0",
    timestamp: new Date().toISOString()
  });
};
