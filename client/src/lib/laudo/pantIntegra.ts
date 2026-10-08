// ============================================================================
// client/src/lib/laudo/pantIntegra.ts — "Íntegra": laudo inteiro colado de
// outra IA → texto no formato que o template PANT (pantPrintTemplate.ts) lê.
// ----------------------------------------------------------------------------
// Aceita, sem exigir nenhum campo por seção:
//   • o markdown do MOTOR_PANT (# capítulo, ## subtítulo, **negrito**,
//     ==destaque==, tabelas | |) — passa como está;
//   • prosa simples com os títulos I–XIII do padrão ("Em uma página",
//     "Quem é …", … "Quando nos revemos"), com ou sem numeral, #, ** ou ":";
//   • o texto do próprio gerador por seções (separador ==== e "01  TÍTULO").
// Nenhum parágrafo é descartado: só somem marcações decorativas (linhas ---,
// frontmatter YAML e a linha-título "Laudo Neuropediátrico", que já está na
// capa). Função pura (sem DOM), testável em Node.
// ============================================================================

const SEPARADOR = "=".repeat(60);

/** Títulos-padrão I–XIII (INSTRUCOES-PADRAO-PANT, seção 4), sem acento e em minúsculas. */
export const PANT_TITULOS_PADRAO: ReadonlyArray<{ num: number; re: RegExp; rotulo: string }> = [
  { num: 1, re: /^em uma pagina$/, rotulo: "Em uma página" },
  { num: 2, re: /^quem e\b/, rotulo: "Quem é …" },
  { num: 3, re: /^como\b.{0,80}\bchegou ate aqui\b/, rotulo: "Como … chegou até aqui" },
  { num: 4, re: /^o que a familia contou\b/, rotulo: "O que a família contou nesta consulta" },
  { num: 5, re: /^o que a escola descreve\b/, rotulo: "O que a escola descreve" },
  { num: 6, re: /^o que a psicoterapia registra\b/, rotulo: "O que a psicoterapia registra" },
  { num: 7, re: /^o que os exames trazem\b/, rotulo: "O que os exames trazem" },
  { num: 8, re: /^o exame neurologico\b/, rotulo: "O exame neurológico e o estado mental nesta consulta" },
  { num: 9, re: /^o que esses achados significam\b/, rotulo: "O que esses achados significam quando lidos juntos" },
  { num: 10, re: /^o diagnostico\b/, rotulo: "O diagnóstico, firmado, em investigação e em suspeita" },
  { num: 11, re: /^o que fazer a partir de agora\b/, rotulo: "O que fazer a partir de agora" },
  { num: 12, re: /^o que a escola precisa saber\b/, rotulo: "O que a escola precisa saber" },
  { num: 13, re: /^quando nos revemos\b/, rotulo: "Quando nos revemos" },
];

export interface IntegraPreparada {
  /** Texto pronto para buildLaudoPantPrintHtml({ texto }). */
  texto: string;
  /** Nome do paciente achado no texto ("Paciente: …", linha-nome ou "Quem é …"). */
  paciente: string;
  /** Títulos de seção reconhecidos, na ordem em que vão para o PDF (I, II, …). */
  secoes: string[];
  /** "estruturado" = já vinha no formato do gerador/motor; "titulos" = dividido pelos títulos; "prosa" = sem títulos. */
  modo: "estruturado" | "titulos" | "prosa";
}

export interface IntegraOpcoes {
  /**
   * true quando os campos Nome/idade/data da capa estão preenchidos: a linha
   * "Paciente: …" do texto fica no miolo (como parágrafo) e a capa usa os campos.
   */
  identidadePreenchida?: boolean;
}

function semAcento(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

const ROMANO_VALIDO = /^(?:X{0,2})(?:IX|IV|V?I{0,3})$/;

/** Tira #, **, __, numeral (I. / 01 / Seção I —) e ":" final de um candidato a título. */
function limparTitulo(linha: string): { texto: string; numerado: boolean; markdown: boolean } {
  let t = linha.trim();
  const markdown = /^#{1,6}\s/.test(t);
  t = t.replace(/^#{1,6}\s+/, "");
  for (let i = 0; i < 2; i++) {
    const m = t.match(/^(\*\*|__)(.+)\1$/);
    if (m) t = m[2].trim();
  }
  let numerado = false;
  const num = t.match(/^(?:[Ss]e[cç][aã]o\s+)?([IVX]{1,5}|\d{1,2})(?:\s*[.·—–:)-]\s*|\s+)(.+)$/);
  if (num) {
    const n = num[1];
    const ehRomano = /^[IVX]+$/.test(n) && ROMANO_VALIDO.test(n);
    const ehArabico = /^\d{1,2}$/.test(n) && Number(n) >= 1 && Number(n) <= 20;
    if (ehRomano || ehArabico) {
      t = num[2].trim();
      numerado = true;
    }
  }
  for (let i = 0; i < 2; i++) {
    const m = t.match(/^(\*\*|__)(.+)\1$/);
    if (m) t = m[2].trim();
  }
  t = t.replace(/\s*:\s*$/, "").trim();
  return { texto: t, numerado, markdown };
}

/** Título-padrão I–XIII? Devolve o título limpo (com a grafia do texto colado) ou null. */
export function tituloPadraoIntegra(linha: string): string | null {
  const bruta = linha.trim();
  if (!bruta || bruta.length > 140 || bruta.startsWith("|")) return null;
  const { texto } = limparTitulo(bruta);
  if (!texto || texto.length > 110) return null;
  // Frase de parágrafo termina em ponto; título não.
  if (/[.;,!]$/.test(texto)) return null;
  const chave = semAcento(texto).toLowerCase().replace(/\s+/g, " ");
  return PANT_TITULOS_PADRAO.some((p) => p.re.test(chave)) ? texto : null;
}

/** Título numerado fora da lista-padrão ("IV. Exames" / "## 4 · Exames"). */
function tituloNumerado(linha: string): string | null {
  const bruta = linha.trim();
  if (!bruta || bruta.length > 120 || bruta.startsWith("|")) return null;
  const r = limparTitulo(bruta);
  if (!r.numerado || !r.texto || r.texto.length > 90) return null;
  if (/[.;,!]$/.test(r.texto)) return null;
  // Exige separador explícito ou forma de título (markdown/negrito) para não
  // confundir com item de lista numerada ("1. Fono 1x/semana").
  const explicito = /^(?:#{1,6}\s+)?(?:\*\*|__)?\s*(?:se[cç][aã]o\s+)?[IVX]{1,5}\s*[.·—–:)-]\s/i.test(bruta) || r.markdown || /^(\*\*|__)/.test(bruta);
  if (!explicito) return null;
  if (!/^\p{Lu}/u.test(r.texto)) return null;
  return r.texto;
}

const TITULO_DOCUMENTO = /^(?:#{1,6}\s*)?(?:\*\*)?\s*laudo neuropedi[aá]trico(?:\s+premium)?\s*(?:\*\*)?$/i;

function linhaPaciente(l: string): RegExpMatchArray | null {
  return l.trim().match(/^(?:\*\*)?\s*paciente\s*(?:\*\*)?\s*:\s*(?:\*\*)?\s*(.+?)\s*(?:\*\*)?$/i);
}

/** "Helena Martins Duarte, 7 anos · retorno" → nome + resto (o resto nunca se perde). */
function dividirNome(valor: string): { nome: string; resto: string } {
  const v = valor.replace(/\*\*/g, "").trim();
  const m = v.match(/^(.+?)\s*(?:[,;|(]|\s[·—–-]\s)\s*(.*)$/);
  if (!m) return { nome: v, resto: "" };
  return { nome: m[1].trim(), resto: m[2].replace(/\)\s*$/, "").trim() };
}

const PALAVRA_NOME = /^(?:\p{Lu}[\p{L}'’-]+|d[aeo]s?|e)$/u;

function pareceNome(l: string): boolean {
  const t = l.replace(/\*\*/g, "").replace(/^#{1,6}\s+/, "").trim();
  if (t.length < 5 || t.length > 70 || /[\d:.;!?]/.test(t)) return false;
  const palavras = t.split(/\s+/);
  if (palavras.length < 2 || palavras.length > 7) return false;
  if (!/^\p{Lu}/u.test(palavras[0]) || !/^\p{Lu}/u.test(palavras[palavras.length - 1])) return false;
  if (/neuropedi|superneuroped|laudo|avalia|consulta|relat[oó]rio/i.test(t)) return false;
  return palavras.every((p) => PALAVRA_NOME.test(p));
}

/** Junta quebras "moles" (texto copiado de PDF): linha sem pontuação final + próxima em minúscula. */
function juntarQuebrasMoles(linhas: string[]): string[] {
  const out: string[] = [];
  for (const l of linhas) {
    const prev = out[out.length - 1];
    const t = l.trim();
    if (
      prev !== undefined &&
      prev.trim() &&
      t &&
      /^\p{Ll}/u.test(t) &&
      !/[.!?:;)»"”|]$/.test(prev.trim()) &&
      !/^(?:#|\||[-*•·◆■✦—]\s|\d+[.)]\s)/.test(prev.trim())
    ) {
      out[out.length - 1] = `${prev.replace(/\s+$/, "")} ${t}`;
      continue;
    }
    out.push(l);
  }
  return out;
}

function tirarFrontmatter(linhas: string[]): string[] {
  if (linhas[0]?.trim() !== "---") return linhas;
  const fim = linhas.findIndex((l, i) => i > 0 && l.trim() === "---");
  if (fim <= 0 || fim > 40) return linhas;
  const meio = linhas.slice(1, fim).filter((l) => l.trim());
  if (!meio.every((l) => /^\s*[\w\u00C0-\u017F-]+\s*:/.test(l))) return linhas;
  return linhas.slice(fim + 1);
}

/**
 * Converte o laudo colado no campo Íntegra no texto que o template PANT lê.
 * Nunca exige estado de seção do editor.
 */
export function prepararIntegra(bruto: string, opcoes: IntegraOpcoes = {}): IntegraPreparada {
  const original = String(bruto ?? "").replace(/\r\n?/g, "\n").replace(/\u00a0/g, " ");
  let linhas = tirarFrontmatter(original.split("\n"));

  // Nome do paciente: "Paciente: …" > linha-nome antes do 1º título > "Quem é …".
  let paciente = "";
  const pacIdx = linhas.findIndex((l) => linhaPaciente(l));
  if (pacIdx >= 0) paciente = dividirNome(linhaPaciente(linhas[pacIdx])![1]).nome;

  // Já no formato do gerador por seções ou do texto PANT: passa como está.
  const estruturado = linhas.some((l) => l.includes(SEPARADOR)) && linhas.some((l) => /^\d{1,2}\s{2,}\S/.test(l.trim()));
  if (estruturado) {
    const secoes = linhas.filter((l) => /^\d{1,2}\s{2,}\S/.test(l.trim())).map((l) => l.trim().replace(/^\d{1,2}\s{2,}/, ""));
    return { texto: linhas.join("\n"), paciente, secoes, modo: "estruturado" };
  }

  linhas = linhas.filter((l) => !/^\s*(?:-{3,}|\*{3,}|_{3,}|⸻+)\s*$/.test(l));
  linhas = juntarQuebrasMoles(linhas);

  const ehPadrao = linhas.map((l) => tituloPadraoIntegra(l));
  const ehNumerado = linhas.map((l, i) => (ehPadrao[i] ? null : tituloNumerado(l)));
  // "# Capítulo" do MOTOR_PANT continua sendo seção (exceto a linha-título do documento).
  const ehCapitulo = linhas.map((l) => {
    const m = l.trim().match(/^#\s+(.+)$/);
    return m && !TITULO_DOCUMENTO.test(l.trim()) ? limparTitulo(l).texto || null : null;
  });
  const totalPadrao = ehPadrao.filter(Boolean).length;
  const totalNumerado = ehNumerado.filter(Boolean).length;
  const totalCapitulos = ehCapitulo.filter(Boolean).length;
  const usarNumerados = totalNumerado >= 2;
  const titulo = (i: number) => ehPadrao[i] || (usarNumerados ? ehNumerado[i] : null) || ehCapitulo[i];
  const temTitulos = totalPadrao >= 1 || usarNumerados || totalCapitulos >= 1;

  const primeiro = temTitulos ? linhas.findIndex((_, i) => titulo(i)) : -1;
  const preambulo = primeiro > 0 ? linhas.slice(0, primeiro) : [];
  const corpo = primeiro >= 0 ? linhas.slice(primeiro) : linhas;

  if (!paciente) {
    const nomeLinha = (primeiro >= 0 ? preambulo : linhas.slice(0, 6)).find((l) => pareceNome(l));
    if (nomeLinha) paciente = nomeLinha.replace(/\*\*/g, "").replace(/^#{1,6}\s+/, "").trim();
  }
  if (!paciente) {
    for (const l of linhas) {
      const t = tituloPadraoIntegra(l);
      const m = t && semAcento(t).toLowerCase().startsWith("quem e ") ? t.slice(6).trim() : "";
      if (m && pareceNome(m)) {
        paciente = m;
        break;
      }
    }
  }

  const converterItem = (l: string): string => {
    const t = l.trim();
    const item = t.match(/^[-*•]\s+(.+)$/);
    return item ? `· ${item[1]}` : l;
  };

  // Preâmbulo (antes do 1º título): vai para a abertura do miolo; a linha
  // "Paciente:" alimenta a capa quando a identidade não foi preenchida.
  const preOut: string[] = [];
  for (const l of preambulo) {
    const t = l.trim();
    if (!t || TITULO_DOCUMENTO.test(t)) continue;
    const pac = linhaPaciente(t);
    if (pac && !opcoes.identidadePreenchida) {
      const { nome, resto } = dividirNome(pac[1]);
      preOut.push(`PACIENTE: ${nome}${resto ? ` · ${resto.split(/\s*[,;]\s*|\s+[·—–-]\s+/).filter(Boolean).join(" · ")}` : ""}`);
      continue;
    }
    if (pac) {
      // Capa vem dos campos de identidade: a linha fica no miolo, inteira.
      preOut.push(`**Paciente:** ${pac[1]}`);
      continue;
    }
    if (pareceNome(t) && t.replace(/\*\*/g, "").replace(/^#{1,6}\s+/, "").trim() === paciente && !opcoes.identidadePreenchida) continue; // já vai na capa
    preOut.push(converterItem(t.replace(/^#{1,6}\s+/, "")));
  }

  const secoes: string[] = [];
  const corpoOut: string[] = [];
  corpo.forEach((l, k) => {
    const i = k + (primeiro >= 0 ? primeiro : 0);
    const t = l.trim();
    const tit = temTitulos ? titulo(i) : null;
    if (tit) {
      secoes.push(tit);
      corpoOut.push("", `# ${tit}`, "");
      return;
    }
    if (!t) {
      corpoOut.push("");
      return;
    }
    if (temTitulos && /^#{1,6}\s+/.test(t)) {
      // Outros # viram subtítulo: não roubam a numeração romana das seções.
      corpoOut.push(`## ${t.replace(/^#{1,6}\s+/, "")}`);
      return;
    }
    if (!temTitulos && primeiro < 0 && k < 3 && TITULO_DOCUMENTO.test(t)) return;
    corpoOut.push(converterItem(l));
  });

  let texto: string;
  if (preOut.length && temTitulos) texto = [...preOut, SEPARADOR, ...corpoOut].join("\n");
  else texto = corpoOut.join("\n");
  return { texto, paciente, secoes, modo: temTitulos ? "titulos" : "prosa" };
}
