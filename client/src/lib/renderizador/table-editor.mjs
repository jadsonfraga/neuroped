export function structuredTableTemplate() {
  return [
    "| Cabeçalho 1 | Cabeçalho 2 | Cabeçalho 3 |",
    "| --- | --- | --- |",
    "| [preencher] | [preencher] | [preencher] |",
  ].join("\n");
}

export function hasUnfilledTableTemplate(markdown) {
  return /^\|.*(?:Cabeçalho\s+\d+|\[preencher\]).*\|$/im.test(markdown);
}

// Quadros opcionais; não inferir doses ou horários a partir de texto livre.
export function therapyTableTemplate() {
  return [
    "| Terapia | Frequência e duração | Objetivo principal |",
    "| --- | --- | --- |",
    "| [preencher] | [preencher] | [preencher] |",
  ].join("\n");
}

export function medicationTableTemplate() {
  return [
    "| Medicamento e concentração | Dose por tomada | Horários | Duração e ajustes |",
    "| --- | --- | --- | --- |",
    "| [preencher] | [preencher] | [preencher] | [preencher] |",
  ].join("\n");
}
