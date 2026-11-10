export function structuredTableTemplate() {
  return [
    "| Cabeçalho 1 | Cabeçalho 2 | Cabeçalho 3 |",
    "| --- | --- | --- |",
    "| [preencher] | [preencher] | [preencher] |",
  ].join("\n");
}

export function hasUnfilledTableTemplate(markdown) {
  return /^\|\s*(?:Cabeçalho\s+\d+|\[preencher\])\s*\|/im.test(markdown);
}
