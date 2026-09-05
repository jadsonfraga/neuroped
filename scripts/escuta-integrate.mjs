import { readFileSync, writeFileSync } from "node:fs";
// Bootstrap idempotente, restrito a esta integração. Divergência bloqueia.
function patch(path, oldValue, value, marker) {
  const source = readFileSync(path, "utf8");
  if (source.includes(marker)) return;
  if (!source.includes(oldValue)) throw new Error(`Integration conflict: ${path}`);
  writeFileSync(path, source.replace(oldValue, value));
}
patch("client/src/App.tsx", 'const DocumentosPage = lazy(', 'const EscutaClinicaPage = lazy(() => import("@/pages/escuta-clinica"));\nconst DocumentosPage = lazy(', 'const EscutaClinicaPage');
patch("client/src/App.tsx", '            <Route path="/documentos">', '            <Route path="/escuta-clinica">\n              <RouteGuard roles={["admin", "professional"]}>\n                <EscutaClinicaPage />\n              </RouteGuard>\n            </Route>\n            <Route path="/documentos">', '<Route path="/escuta-clinica">');
patch("client/src/security/routeGuardPolicy.ts", '  "/documentos",', '  "/documentos",\n  "/escuta-clinica",', '  "/escuta-clinica",');
patch("client/src/data/navigation.ts", '  { href: "/conecta",', '  { href: "/escuta-clinica", label: "Escuta Clínica", icon: Waves, description: "Áudio e anamnese estruturada" },\n  { href: "/conecta",', 'href: "/escuta-clinica"');
for (const path of ["client/public/_headers", "vercel.json"]) {
  patch(path, 'microphone=()', 'microphone=(self)', 'microphone=(self)');
  patch(path, "worker-src 'self' blob:;", "media-src 'self' blob:; worker-src 'self' blob:;", "media-src 'self' blob:;");
}
patch("client/src/lib/escutaRecorder.ts", 'throw new Error("Microfone não autorizado. Libere a permissão do site no navegador.");', 'throw new Error("Microfone não autorizado. Libere a permissão do site no navegador.", { cause: error });', 'navegador.", { cause: error }');
patch("client/src/pages/escuta-clinica.tsx", 'mounted.current = true; recorder.current', 'mounted.current = true; const chunks = transcribed.current; recorder.current', 'const chunks = transcribed.current');
patch("client/src/pages/escuta-clinica.tsx", 'recorder.current?.destroy(); transcribed.current.clear();', 'recorder.current?.destroy(); chunks.clear();', 'recorder.current?.destroy(); chunks.clear();');
patch("client/src/pages/escuta-clinica.tsx", 'setProgress("Organizando a anamnese a partir da transcrição…");', 'setNote(null); setReviewed(false); documentId.current=null;\n    setProgress("Organizando a anamnese a partir da transcrição…");', 'setNote(null); setReviewed(false); documentId.current=null;');
console.log("Integration applied idempotently; invitation restrictions and clinical guards preserved.");
