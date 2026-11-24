// Automatic, presentation-only structuring for text pasted into the PANT renderer.
// It may add Markdown syntax (#, |, ---, "- ") and replace bullet glyphs, but it
// never adds, removes, reorders or rewrites a word. `wordsOf` guards that invariant
// and structurePastedText fails closed if it is ever violated.

const TERMINAL = /[.!?;:,…]$/;
const BULLET = /^[•●▪◦·‣∙]\s+/;
const LIST = /^(?:[-*+]\s+|\d{1,3}[.)]\s+|[a-z][.)]\s+)/i;
const NUMBER_PREFIX = /^(?:\d{1,3}(?:\.\d{1,3})*[.)]?|[IVXLC]{1,6}[.)])\s+/;

export function wordsOf(text) {
  return String(text).normalize("NFC").match(/[\p{L}\p{N}]+/gu) || [];
}

function words(line) {
  return line.split(/\s+/).filter(Boolean).length;
}

function hasLetters(line) {
  return /\p{L}/u.test(line);
}

function isUpperTitle(line) {
  const letters = line.replace(NUMBER_PREFIX, "").match(/\p{L}/gu) || [];
  return letters.length >= 3 && !/\p{Ll}/u.test(line) && words(line) <= 12 && line.length <= 100 && !/[.;,]$/.test(line);
}

function isLabel(line) {
  return /^[\p{Lu}\d][^:]{1,58}:$/u.test(line) && words(line) <= 8;
}

function isShortTitle(line) {
  return /^[\p{Lu}\d]/u.test(line) && words(line) <= 8 && line.length <= 70 && !TERMINAL.test(line) && hasLetters(line);
}

function isLongText(line) {
  return words(line) >= 10 || /[.!?…]$/.test(line);
}

function escapeCell(cell) {
  return cell.trim().replace(/\|/g, "\\|");
}

function splitPipeRow(line) {
  return line.trim().replace(/^\|/, "").replace(/\|$/, "").split(/(?<!\\)\|/).map((c) => c.trim());
}

function isPipeSeparator(line) {
  return /^\s*\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)*\|?\s*$/.test(line);
}

function tableToMarkdown(rows) {
  const cols = Math.max(...rows.map((r) => r.length));
  const pad = (r) => [...r, ...Array(cols - r.length).fill("")];
  const line = (r) => "| " + pad(r).map((c) => escapeCell(c) || " ").join(" | ") + " |";
  return [line(rows[0]), "| " + Array(cols).fill("---").join(" | ") + " |", ...rows.slice(1).map(line)].join("\n");
}

const TAB_ROW = (l) => l.includes("\t") && l.split("\t").filter((c) => c.trim()).length >= 2;
const FRAMED_ROW = (l) => /^\s*\|.*\|\s*$/.test(l);
const PIPE_ROW = (l) => FRAMED_ROW(l) && splitPipeRow(l).length >= 2;
const BARE_PIPE_ROW = (l) => /(?<!\\)\|/.test(l) && splitPipeRow(l).length >= 2;
const SPACE_ROW = (l) => !/[\t|]/.test(l) && l.trim().split(/\s{2,}/).length >= 2;

// Collects consecutive delimited rows. Strict mode (any text) accepts only tab-separated rows
// (as copied from Word/Excel/Sheets) and pipe rows framed by "|". Loose mode, used only right
// after a clinical table title or on a recognised clinical header row, also accepts pipes
// without the outer bars and columns separated by two or more spaces.
function readDelimited(lines, start, loose) {
  const first = lines[start];
  const pipeRow = loose ? BARE_PIPE_ROW : PIPE_ROW;
  // A one-column Markdown table (the framed title produced for free-text prescriptions) is a table
  // only when its separator row follows, so reapplying the structuring to its own output is stable.
  const oneColumn = FRAMED_ROW(first) && isPipeSeparator(lines[start + 1] ?? "");
  const kind = TAB_ROW(first) ? "tab" : pipeRow(first) || oneColumn ? "pipe" : loose && SPACE_ROW(first) ? "space" : null;
  if (!kind) return null;
  const rows = [];
  let i = start;
  let hasSeparator = false;
  for (; i < lines.length; i++) {
    const l = lines[i];
    if (kind === "pipe" && isPipeSeparator(l)) {
      if (i !== start + 1) break;
      hasSeparator = true;
      continue;
    }
    if (kind === "tab" ? !TAB_ROW(l) : kind === "pipe" ? !(pipeRow(l) || (oneColumn && FRAMED_ROW(l))) : !SPACE_ROW(l)) break;
    rows.push(kind === "tab" ? l.split("\t") : kind === "pipe" ? splitPipeRow(l) : l.trim().split(/\s{2,}/));
  }
  return rows.length ? { kind, rows, end: i, hasSeparator } : null;
}

function readTable(lines, start, loose = false) {
  const table = readDelimited(lines, start, loose);
  if (!table || table.rows.length < 2) return null;
  const framed = lines.slice(start, table.end).every((l) => FRAMED_ROW(l) || isPipeSeparator(l));
  if (table.kind === "pipe" && table.hasSeparator && framed) {
    return { end: table.end, markdown: lines.slice(start, table.end).join("\n"), converted: false };
  }
  return { end: table.end, markdown: tableToMarkdown(table.rows), converted: true };
}

// ---- Clinical tables: "QUADRO DE TERAPIAS" / "QUADRO DE FARMACOLOGIA" and plain prescriptions ----
const THERAPY_TITLE = /^(?:(?:quadro|tabela)\s+(?:de\s+|das\s+)?|(?:prescrição|carga horária|plano)\s+de\s+)?terapias(?:\s+(?:indicadas|prescritas|propostas|recomendadas))?$/iu;
const DRUG_TITLE = /^(?:(?:quadro|tabela)\s+(?:de\s+|da\s+|das\s+)?|prescrição\s+de\s+)?(?:medicações|medicamentos|fármacos|farmacologia|farmacoterapia)(?:\s+(?:indicad[ao]s|prescrit[ao]s|propost[ao]s|recomendad[ao]s))?$|^tratamento medicamentoso$/iu;
const THERAPY_COLUMNS = "carga horária|carga|frequência e duração|frequência|duração|responsável|objetivo principal|objetivo|indicação|evidência|justificativa";
const THERAPY_HEADER = new RegExp(`^(?:terapia|intervenção|especialidade)(?:\\s+(?:${THERAPY_COLUMNS})){1,5}$`, "iu");
const DRUG_COLUMNS = "dose por tomada|dose|posologia|concentração|horários?|via|duração|ajustes|frequência|responsável|e";
const DRUG_HEADER = new RegExp(`^(?=.*\\b(?:dose|posologia|concentração)\\b)(?:medicamento|fármaco|medicação)(?:\\s+e\\s+concentração)?(?:\\s+(?:${DRUG_COLUMNS})){1,6}$`, "iu");
const EXPLICIT_TABLE_TITLE = /^(?:quadro|tabela)\b/i;
const COLUMN_HEAD = /^(?:terapia|interven[çc][ãa]o|especialidade|medicamentos?(?: e concentra[çc][ãa]o)?|f[áa]rmaco|medica[çc][ãa]o)$/i;
const THERAPY_UNIT = /\b(?:\d+(?:[.,]\d+)?|uma?|duas|tr[êe]s|quatro|cinco|seis|meia)\s*(?:h(?:oras?)?|min(?:utos?)?|sess(?:ão|ões)|vezes|x)\s*(?:\/|por|ao|na|no|a cada|semanais?|quinzenais?|mensais?|diári[ao]s?)|\b(?:semanais?|quinzenais?|mensais?)\b/iu;
const DRUG_UNIT = /\b\d+(?:[.,]\d+)?\s*(?:mg|mcg|µg|g|mL|gotas?|comprimidos?|cápsulas?|UI)\b/iu;

function cleanTitle(line) {
  return line.trim().replace(/^#{1,6}\s+/, "").replace(/[*_=+`]/g, "").replace(NUMBER_PREFIX, "").replace(/[:.]$/, "").trim();
}

function clinicalTitle(line) {
  const title = cleanTitle(line);
  const explicit = EXPLICIT_TABLE_TITLE.test(title);
  if (THERAPY_TITLE.test(title)) return { therapy: true, explicit, headerLine: false };
  if (DRUG_TITLE.test(title)) return { therapy: false, explicit, headerLine: false };
  if (THERAPY_HEADER.test(title)) return { therapy: true, explicit: false, headerLine: true };
  if (DRUG_HEADER.test(title)) return { therapy: false, explicit: false, headerLine: true };
  return null;
}

// A title line that introduces a table (not a header row that already names the columns).
function isClinicalTitle(line) {
  const info = line && clinicalTitle(line);
  return Boolean(info && !info.headerLine);
}

// A delimited row whose first cell is a column name ("Terapia", "Medicamento e concentração"…).
function isHeaderRow(cells) {
  return COLUMN_HEAD.test(cells[0].trim()) && !cells.some((c) => /\d/.test(c));
}

// Detect clinical blocks conservatively; retain entire prescriptions when column boundaries are ambiguous.
function readClinicalTable(lines, start) {
  const header = lines[start].trim();
  if (/[|\t\\]/.test(header)) return null;
  const info = clinicalTitle(header);
  if (!info) return null;
  const heading = header.replace(/^#{1,6}\s+/, "");
  let i = start + 1;
  if (!lines[i]?.trim()) i++;

  // A title followed by a line that names the columns stays a heading; that line starts the table.
  if (!info.headerLine && lines[i]?.trim() && !/[|\t\\]/.test(lines[i]) && clinicalTitle(lines[i])?.headerLine) return null;

  // Delimited rows under a title: with a real header row the title stays a heading and the table
  // is read on its own; with data rows only, the title becomes the table header (no word is added).
  if (!info.headerLine && lines[i]) {
    const delimited = readDelimited(lines, i, true);
    if (delimited) {
      if (delimited.hasSeparator || isHeaderRow(delimited.rows[0])) return null;
      return { end: delimited.end, markdown: tableToMarkdown([[heading], ...delimited.rows]), converted: true };
    }
  }

  // Free rows: one per line, kept whole in a single cell because column boundaries are ambiguous.
  // After an explicit "Quadro/Tabela de …" title any short row belongs to the table; otherwise
  // each row must carry a recognisable unit (carga horária or dose).
  const unit = info.therapy ? THERAPY_UNIT : DRUG_UNIT;
  const explicit = info.explicit && !info.headerLine;
  const rows = [];
  for (; i < lines.length; i++) {
    const row = lines[i].trim();
    if (!row || /^#|^.{1,70}:$/.test(row) || /[|\\]/.test(row) || isUpperTitle(row) || /^(?:carga total|total)\b/i.test(row)) break;
    if (!(unit.test(row) || (explicit && !isLongText(row)))) break;
    rows.push([row]);
  }
  if (!rows.length) return null;
  // Keep the original heading and all characters of each prescription.
  return { end: i, markdown: tableToMarkdown([[heading], ...rows]), converted: true };
}

/**
 * @param {string} input text pasted or loaded by the clinician
 * @returns {{markdown:string, mode:"markdown"|"plain", headings:number, tables:number, lists:number, titles:string[], changed:boolean}}
 */
export function structurePastedText(input) {
  const source = String(input ?? "").replace(/\r\n?/g, "\n").replace(/ /g, " ");
  const explicitHeadings = /^#{1,6}\s+\S/m.test(source);
  const mode = explicitHeadings ? "markdown" : "plain";
  const lines = source.split("\n");
  const blocks = [];
  let headings = 0;
  let tables = 0;
  let lists = 0;
  let inFence = false;

  const nextText = (from) => {
    for (let j = from; j < lines.length; j++) if (lines[j].trim()) return lines[j].trim();
    return "";
  };
  const previousText = (from) => {
    for (let j = from - 1; j >= 0; j--) if (lines[j].trim()) return lines[j].trim();
    return "";
  };
  // Loose delimiters (pipes without outer bars, columns split by 2+ spaces) are read only
  // right after a clinical table title or on a row that starts with a column name.
  const looseContext = (i) => {
    if (isClinicalTitle(previousText(i))) return true;
    const delimited = readDelimited(lines, i, true);
    return Boolean(delimited && isHeaderRow(delimited.rows[0]));
  };

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();
    if (/^```/.test(line)) inFence = !inFence;
    if (inFence || /^```/.test(line)) {
      blocks.push({ type: "raw", text: raw });
      continue;
    }
    if (!line) {
      blocks.push({ type: "blank" });
      continue;
    }
    const table = readTable(lines, i, looseContext(i)) || readClinicalTable(lines, i);
    if (table) {
      blocks.push({ type: "table", text: table.markdown });
      if (table.converted) tables++;
      i = table.end - 1;
      continue;
    }
    if (mode === "markdown") {
      blocks.push({ type: "raw", text: raw });
      continue;
    }
    if (BULLET.test(line)) {
      blocks.push({ type: "list", text: "- " + line.replace(BULLET, "") });
      lists++;
      continue;
    }
    if (LIST.test(line) && !isUpperTitle(line)) {
      blocks.push({ type: "list", text: line });
      continue;
    }
    const prev = blocks.filter((b) => b.type !== "blank").at(-1);
    const prevBlank = !blocks.length || blocks.at(-1).type === "blank";
    const prevClosed = !prev || prevBlank || prev.type !== "para" || TERMINAL.test(prev.text);
    const following = nextText(i + 1);
    if ((isUpperTitle(line) || isClinicalTitle(line)) && following) {
      blocks.push({ type: "heading", text: "## " + line });
      headings++;
      continue;
    }
    if (isLabel(line) && following && !isLabel(following) && prevClosed) {
      blocks.push({ type: "heading", text: "### " + line });
      headings++;
      continue;
    }
    if (isShortTitle(line) && prevClosed && following && isLongText(following) && !readTable(lines, i + 1, looseContext(i + 1)) && !readClinicalTable(lines, i + 1)) {
      blocks.push({ type: "heading", text: "## " + line });
      headings++;
      continue;
    }
    // Hard-wrapped line continuing a sentence (e.g. copied from a PDF): keep it in the same paragraph.
    const last = blocks.at(-1);
    if (last && last.type === "para" && !TERMINAL.test(last.text) && /^\p{Ll}/u.test(line)) {
      last.text += " " + line;
      continue;
    }
    blocks.push({ type: "para", text: line });
  }

  // A leading all-caps line above other sections is the document title (level 1).
  const firstText = blocks.find((b) => b.type !== "blank");
  if (mode === "plain" && headings >= 2 && firstText && firstText.type === "heading" &&
      firstText.text.startsWith("## ") && isUpperTitle(firstText.text.slice(3)) &&
      !NUMBER_PREFIX.test(firstText.text.slice(3))) {
    firstText.text = "# " + firstText.text.slice(3);
  }

  let markdown;
  if (mode === "markdown") {
    markdown = blocks.map((b) => (b.type === "blank" ? "" : b.text)).join("\n");
  } else {
    const out = [];
    blocks.forEach((b, idx) => {
      if (b.type === "blank") return;
      const prev = blocks.slice(0, idx).filter((p) => p.type !== "blank").at(-1);
      const tight = prev && ((prev.type === "list" && b.type === "list") || (prev.type === "raw" && b.type === "raw"));
      out.push((out.length && !tight ? "\n" : "") + b.text);
    });
    markdown = out.join("\n");
  }
  markdown = markdown.replace(/\n{3,}/g, "\n\n").trim() + "\n";

  const before = wordsOf(source);
  const after = wordsOf(markdown);
  if (before.length !== after.length || before.some((w, k) => w !== after[k])) {
    throw Error("A estruturação automática alteraria o texto. Nenhum PDF foi gerado; marque os títulos manualmente com #.");
  }
  const titles = markdown.split("\n").filter((l) => /^#{1,6}\s+\S/.test(l)).map((l) => l.replace(/^#{1,6}\s+/, ""));
  return { markdown, mode, headings, tables, lists, titles, changed: markdown.trim() !== source.trim() };
}
