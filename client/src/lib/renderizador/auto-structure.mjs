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

// Collects consecutive rows of an explicit table (tab-separated, as copied from
// Word/Excel/Sheets, or pipe-delimited without the Markdown separator row).
function readTable(lines, start) {
  const tabRow = (l) => l.includes("\t") && l.split("\t").filter((c) => c.trim()).length >= 2;
  const pipeRow = (l) => /^\s*\|.*\|\s*$/.test(l) && splitPipeRow(l).length >= 2;
  const kind = tabRow(lines[start]) ? "tab" : pipeRow(lines[start]) ? "pipe" : null;
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
    if (kind === "tab" ? !tabRow(l) : !pipeRow(l)) break;
    rows.push(kind === "tab" ? l.split("\t") : splitPipeRow(l));
  }
  if (rows.length < 2) return null;
  if (kind === "pipe" && hasSeparator) return { end: i, markdown: lines.slice(start, i).join("\n"), converted: false };
  return { end: i, markdown: tableToMarkdown(rows), converted: true };
}

/**
 * @param {string} input text pasted or loaded by the clinician
 * @returns {{markdown:string, mode:"markdown"|"plain", headings:number, tables:number, lists:number, changed:boolean}}
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
    const table = readTable(lines, i);
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
    if (isUpperTitle(line) && following) {
      blocks.push({ type: "heading", text: "## " + line });
      headings++;
      continue;
    }
    if (isLabel(line) && following && !isLabel(following) && prevClosed) {
      blocks.push({ type: "heading", text: "### " + line });
      headings++;
      continue;
    }
    if (isShortTitle(line) && prevClosed && following && isLongText(following) && !readTable(lines, i + 1)) {
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
  return { markdown, mode, headings, tables, lists, changed: markdown.trim() !== source.trim() };
}
