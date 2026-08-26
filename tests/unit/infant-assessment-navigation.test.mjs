import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const home = read("client/src/pages/home.tsx");
const nav = read("client/src/data/navigation.ts");
const infant = read("client/src/pages/testes-reconhecimento.tsx");
const cognitive = read("client/src/pages/avaliacao-cognitiva-infantil.tsx");

assert.match(home, /href: "\/testes-reconhecimento"/);
assert.match(home, /Reconhecimento Visual Infantil/);
assert.doesNotMatch(home, /Medicamentos e doses/);
assert.match(home, /label: "Testes diretos"/);

const clinicalStart = nav.indexOf('title: "CLÍNICA E ACOMPANHAMENTO"');
const referenceStart = nav.indexOf('title: "REFERÊNCIA"');
assert.ok(clinicalStart >= 0 && referenceStart > clinicalStart);
const clinicalSection = nav.slice(clinicalStart, referenceStart);
const referenceSection = nav.slice(referenceStart);
assert.match(clinicalSection, /href: "\/medicamentos"/);
assert.match(clinicalSection, /href: "\/farmacologia"/);
assert.match(clinicalSection, /href: "\/calculadora-dose"/);
assert.doesNotMatch(referenceSection, /href: "\/(medicamentos|farmacologia|calculadora-dose)"/);

assert.match(infant, /type InfantAgeGroup = "1" \| "2" \| "3" \| "4" \| "5"/);
for (const domain of ["frutas", "transportes", "corpo", "gerais"]) {
  assert.match(infant, new RegExp(`key: "${domain}"`));
}
for (const age of ["\"1\"", "\"2\"", "\"3\"", "\"4\"", "\"5\""]) {
  assert.match(infant, new RegExp(`${age}:`));
}
assert.match(infant, /não\s+force\s+nomeação\s+verbal/i);
assert.match(infant, /ClinicalReport\s+scaleName="Reconhecimento Visual Infantil"/);

for (const age of [6, 7, 8, 9, 10, 12, 13]) {
  assert.match(cognitive, new RegExp(`^  ${age}:`, "m"), `perfil exato de ${age} anos ausente`);
}
for (const domain of ["visual", "leitura", "escrita", "aritmetica"]) {
  assert.match(cognitive, new RegExp(`^    ${domain}:`, "m"), `domínio ${domain} ausente`);
}
assert.match(cognitive, /getQuestionsForAge\(domain, age, band\)/);
assert.match(cognitive, /ageProfileLabel\(age, band\)/);
assert.match(cognitive, /dificuldade progressiva/);

console.log("✓ Infant assessment navigation/content: home, sidebar clínica, 1–5 years and exact 6–13 profiles approved");
