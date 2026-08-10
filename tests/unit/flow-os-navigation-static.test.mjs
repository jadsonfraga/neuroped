import assert from "node:assert/strict";
import fs from "node:fs";

const dock = fs.readFileSync("client/src/components/MobilePrimaryDock.tsx", "utf8");
const palette = fs.readFileSync("client/src/components/CommandPalette.tsx", "utf8");
const main = fs.readFileSync("client/src/main.tsx", "utf8");
const css = fs.readFileSync("client/src/styles/flow-os.css", "utf8");

for (const label of ["Início", "Pacientes", "Clínica", "Agenda", "Buscar"]) {
  assert.match(dock, new RegExp(`label: \\"${label}\\"`), `dock deve manter a ação ${label}`);
}

assert.match(dock, /IS_PUBLIC_ZONE/, "dock deve permanecer fora da zona pública");
assert.match(dock, /safe-area-inset-bottom/, "dock deve respeitar safe area de iPhone");
assert.match(dock, /aria-label="Navegação principal"/, "dock deve ter landmark acessível");
assert.match(dock, /openCommandPalette\(\)/, "busca do dock deve abrir a paleta global");
assert.match(dock, /\/pacientes/, "dock deve dar acesso direto aos pacientes");
assert.match(dock, /\/filtro/, "dock deve dar acesso direto ao fluxo clínico");
assert.match(dock, /\/agenda/, "dock deve dar acesso direto à agenda");

assert.match(main, /<MobilePrimaryDock \/>/, "shell autorizado deve renderizar o dock");
assert.match(main, /\.\/styles\/flow-os\.css/, "shell deve carregar o contrato de espaçamento do Flow OS");
assert.match(css, /#main-content/, "conteúdo principal deve reservar espaço para o dock");
assert.match(css, /safe-area-inset-bottom/, "reserva do conteúdo deve considerar safe area");

assert.match(palette, /queryKey: \["\/api\/patients"\]/, "busca global deve consultar pacientes reais");
assert.match(palette, /normalizedSearch\.length >= 2/, "pacientes só devem ser consultados após intenção de busca");
assert.match(palette, /enabled: patientSearchReady/, "consulta de pacientes deve ser condicional");
assert.match(palette, /IS_PUBLIC_ZONE/, "pacientes não devem ser consultados na zona pública");
assert.match(palette, /navigate\(`\/pacientes\/\$\{id\}`\)/, "resultado deve abrir o prontuário do paciente");
assert.match(palette, /Abrir prontuário longitudinal/, "resultado deve comunicar a ação clínica");
assert.doesNotMatch(palette, /localStorage.*patient/i, "paleta não deve persistir nomes de pacientes em recentes");

console.log("[flow-os] ✓ dock mobile, busca clínica real e proteções de privacidade aprovados.");
