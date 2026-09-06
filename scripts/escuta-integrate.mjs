import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
// Valida somente arquivos já commitados. Não modifica a árvore no CI.
const read=path=>readFileSync(path,"utf8");
assert.match(read("client/src/App.tsx"),/const EscutaClinicaPage = lazy/);
assert.match(read("client/src/App.tsx"),/<Route path="\/escuta-clinica">\s*<RouteGuard roles=\{\["admin", "professional"\]\}>/);
assert(read("client/src/security/routeGuardPolicy.ts").includes('"/escuta-clinica"'));
assert(read("client/src/data/navigation.ts").includes('href: "/escuta-clinica"'));
for(const path of ["client/public/_headers","vercel.json"]){const data=read(path);assert(data.includes("microphone=(self)"));assert(data.includes("media-src 'self' blob:;"));}
assert(read("client/public/_headers").split("microphone=()").length>=3,"As duas restrições específicas de rotas públicas devem permanecer.");
assert(read("client/src/pages/escuta-clinica.tsx").includes("patientOptions(b.data)"));
console.log("PASS integração já commitada, guardas e políticas de mídia; nenhuma mutação de arquivos.");
