import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync("client/src/pages/receita-c1-express.tsx", "utf8");

const controls = [
  ["certificado-p12", "Selecionar certificado .p12 / .pfx"],
  ["senha-cert", "Senha do certificado"],
  ["paciente-nome", "Nome completo"],
  ["paciente-data-nascimento", "Data de nascimento"],
  ["paciente-idade", "Idade do paciente"],
  ["doses-por-dia", "Doses por dia"],
  ["endereco", "Endereço"],
  ["municipio-uf", "Município / UF"],
  ["cep", "CEP"],
  ["medicamento", "Medicamento"],
  ["concentracao", "Concentração"],
  ["forma-farmaceutica", "Forma farmacêutica"],
  ["quantidade", "Quantidade"],
  ["quantidade-extenso", "Quantidade (por extenso)"],
  ["instrucoes-posologia", "Instruções de uso / Posologia"],
  ["cid-10", "CID-10"],
];

for (const [id, label] of controls) {
  assert.match(
    source,
    new RegExp(`htmlFor="${id}"`),
    `${label} deve apontar para o controle ${id}`,
  );
  assert.match(
    source,
    new RegExp(`id="${id}"`),
    `o controle ${id} deve expor um id estável`,
  );
}

console.log("✓ Receita C1 Express: controles de formulário possuem labels associados");
