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

// Prescrição de terapias e de medicações sempre em tabela. O Renderizador não
// converte texto livre em tabela (separar nome, concentração, dose e horário
// por inferência poderia trocar uma dose); oferece os quadros com cabeçalho
// fixo, que o médico preenche célula a célula, e bloqueia o PDF enquanto uma
// seção de prescrição estiver sem tabela.
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

const HISTORY = /\b(em uso|em curso|anteriores?|pr[ée]vi[ao]s|realizad[ao]s|atuais|usad[ao]s|hist[óo]rico|j[áa] feit[ao]s)\b/i;
const PRESCRIPTION = /\bprescri[çc][ãa]o\b|\bprescrit[ao]s?\b|\bprescrevo\b|\bplano terap[êe]utico\b|\btratamento medicamentoso\b/i;
const THERAPY = /\bterapias?\b/i;
const MEDICATION = /\bmedica[çc](?:[ãa]o|[õo]es)\b|\bmedicamentos?\b/i;

/** Títulos de seção de prescrição de terapias ou medicações cujo conteúdo não tem tabela. */
export function prescriptionSectionsWithoutTable(markdown) {
  const lines = String(markdown).split("\n");
  const missing = [];
  lines.forEach((line, start) => {
    const heading = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
    if (!heading) return;
    const title = heading[2].replace(/[*_=+`]/g, "").trim();
    const isPrescription = PRESCRIPTION.test(title) || ((THERAPY.test(title) || MEDICATION.test(title)) && !HISTORY.test(title));
    if (!isPrescription) return;
    const depth = heading[1].length;
    let end = start + 1;
    while (end < lines.length) {
      const next = /^(#{1,6})\s/.exec(lines[end]);
      if (next && next[1].length <= depth) break;
      end++;
    }
    const body = lines.slice(start + 1, end);
    if (!body.some((l) => l.trim())) return;
    const hasTable = body.some((l, i) => /^\s*\|.*\|\s*$/.test(l) && /^\s*\|\s*:?-{3,}/.test(body[i + 1] || ""));
    if (!hasTable) missing.push(title);
  });
  return missing;
}
