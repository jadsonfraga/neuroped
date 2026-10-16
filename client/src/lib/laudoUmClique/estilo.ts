// ============================================================================
// laudoUmClique/estilo.ts — conferência de prosa (porta do Apêndice A do dossiê)
// ----------------------------------------------------------------------------
// Verifica por regra, não por confiança: teto de 45 palavras, 90% < 30,
// vírgulas, léxico vetado, vazamento de processo, primeira pessoa, travessão,
// "não X, mas Y", escala/escore no corpo, declaração de fonte, CID coincidente,
// frase de 12 palavras repetida e última frase com data ou sinal.
// Bloqueio = impede emissão sem decisão do médico; alerta = recomendação.
// ============================================================================
import type { ItemCheck, RelatorioEstilo } from "./tipos";

export const LEXICO_VETADO = [
  "ademais", "outrossim", "vale ressaltar", "vale notar", "cabe notar", "note-se", "é digno de nota",
  "é importante destacar", "cabe salientar", "diante do exposto", "em suma", "nesse sentido", "neste sentido",
  "por fim", "faz-se necessário", "ressalta-se", "observa-se que", "é possível observar", "no que tange",
  "no âmbito de", "jornada", "holístic", "multifacetad", "robust", "promissor", "crucial", "fundamental",
  "abrangente", "naveg", "empoder", "potencializ", "desafio",
];

const PROCESSO = [
  /\bassistente\b/i, /\bficha\b/i, /\bmapa de fontes\b/i, /\bsistema\b(?!\s+(?:nervoso|imune|imunol[óo]gico|respirat[óo]rio|digest[óo]rio|cardiovascular|vestibular|l[ií]mbico|motor|sensorial|visual|auditivo|de ensino))/i, /\bprompt\b/i,
  /\bmodelo de linguagem\b/i, /\bIA\b/, /\bintelig[êe]ncia artificial\b/i, /\bgerad[oa]\b/i,
  /\brascunho\b/i, /\bminuta\b/i, /\bcomando\b/i,
];
const PRIMEIRA_PESSOA = [
  /\b(eu|meu|minha|comigo)\b/i,
  /\b(acompanhei|revejo|decidi|examinei|solicitei|prescrevi|indiquei|observei|avaliei|orientei)\b/i,
  /\bnossa equipe\b/i,
];
const ESCALA = /\b(SNAP|SRS|CARS|ADOS|ADI-R|M-CHAT|WISC|Vineland|Conners|CBCL|QI|percentil|escore|pontua[çc][ãa]o|escala)\b/i;
const CID_RE = /\b[A-Z]\d{2}\.\d\b|\b\d[A-Z]\d{2}(?:\.\d)?\b/g;

function palavras(s: string): string[] {
  return s.match(/[A-Za-zÀ-ÿ0-9]+(?:[-'][A-Za-zÀ-ÿ0-9]+)*/g) ?? [];
}

function silabas(w: string): number {
  const base = w.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return Math.max(1, (base.match(/[aeiouy]+/g) ?? []).length);
}

export function dividirFrases(texto: string): string[] {
  return texto
    .split(/(?<=[.!?:])\s+(?=[A-ZÀ-Ý"“])/)
    .map((f) => f.trim())
    .filter((f) => palavras(f).length > 0);
}

export interface EntradaEstilo {
  /** Corpo clínico: capítulos, sem quadro, sem anexo, sem nota final. */
  corpo: string;
  /** Texto do quadro "Em uma página" (para conferir CID coincidente). */
  quadro: string;
  /** Quantidade de capítulos. */
  capitulos: number;
}

export function conferirEstilo(e: EntradaEstilo): RelatorioEstilo {
  const itens: ItemCheck[] = [];
  const add = (id: string, ok: boolean, nivel: ItemCheck["nivel"], mensagem: string) => itens.push({ id, ok, nivel, mensagem });

  const linhasCorpo = e.corpo.split("\n").filter((l) => l.trim());
  const limpo = linhasCorpo.join(" ").replace(/\*\*/g, "");
  const frases = dividirFrases(limpo);
  const tam = frases.map((f) => palavras(f).length);
  const nFrases = Math.max(frases.length, 1);
  const total = tam.reduce((a, b) => a + b, 0);
  const media = total / nFrases;
  const pctAbaixo30 = (tam.filter((t) => t < 30).length / nFrases) * 100;

  const pal = palavras(limpo);
  const sil = pal.reduce((a, w) => a + silabas(w), 0);
  const flesch = pal.length ? 248.835 - 1.015 * (pal.length / nFrases) - 84.6 * (sil / pal.length) : 0;

  add("capitulos", e.capitulos >= 10, "alerta", `${e.capitulos} capítulos (meta: 10 a 12; fonte ausente no material não vira capítulo vazio).`);

  const longas = frases.filter((f) => palavras(f).length > 45);
  add("teto-45", longas.length === 0, "bloqueio", longas.length ? `${longas.length} frase(s) acima de 45 palavras: "${longas[0].slice(0, 80)}…"` : "Nenhuma frase acima de 45 palavras.");
  add("pct-30", pctAbaixo30 >= 90, "alerta", `${pctAbaixo30.toFixed(0)}% das frases abaixo de 30 palavras (meta: 90%).`);
  const virgulas = frases.filter((f) => (f.match(/,/g) ?? []).length > 3);
  add("virgulas", virgulas.length === 0, "alerta", virgulas.length ? `${virgulas.length} frase(s) com mais de três vírgulas.` : "Vírgulas dentro do limite.");
  add("flesch", flesch >= 45, "alerta", `Legibilidade estimada ${flesch.toFixed(0)} (meta: acima de 45).`);

  const low = limpo.toLowerCase().replace(/ensino fundamental/g, "ensino-básico");
  const vetados = LEXICO_VETADO.filter((v) => low.includes(v));
  add("lexico", vetados.length === 0, "bloqueio", vetados.length ? `Léxico vetado: ${vetados.join(", ")}.` : "Sem léxico vetado.");

  const proc = PROCESSO.filter((r) => r.test(limpo)).map((r) => r.source.replace(/\\b/g, ""));
  add("processo", proc.length === 0, "bloqueio", proc.length ? `Possível vazamento de processo: ${proc.join(", ")}.` : "Sem vazamento de processo.");

  const semFalas = limpo.replace(/["“][^"”]*["”]/g, "");
  const prim = PRIMEIRA_PESSOA.filter((r) => r.test(semFalas)).map((r) => r.source);
  add("primeira-pessoa", prim.length === 0, "bloqueio", prim.length ? "Possível primeira pessoa fora de fala literal." : "Voz impessoal mantida.");

  add("travessao", !/\s[—–-]\s/.test(limpo) && !/[—–]/.test(limpo), "bloqueio", "Sem travessão, meia-risca ou hífen solto.");
  add("nao-mas", !/\bnão\b[^.]{0,80},\s*mas\b/i.test(semFalas), "alerta", 'Sem construção "não X, mas Y" fora de fala literal.');
  add("marcadores", !/[[\]{}]/.test(e.corpo), "bloqueio", "Sem colchete, chave ou placeholder no corpo.");
  add("escala-no-corpo", !ESCALA.test(limpo), "bloqueio", "Sem nome de escala, escore ou percentil no corpo (só no Anexo técnico).");

  const nFonte = (limpo.match(/sem verifica[çc][ãa]o direta/gi) ?? []).length;
  add("fonte", nFonte >= 1, "bloqueio", `${nFonte} declaração(ões) de fonte (mínimo: 1 por laudo).`);

  const cidCorpo = new Set(e.corpo.match(CID_RE) ?? []);
  const cidQuadro = new Set(e.quadro.match(CID_RE) ?? []);
  const igual = cidQuadro.size === cidCorpo.size && [...cidQuadro].every((c) => cidCorpo.has(c));
  add("cid-coincide", igual, "bloqueio", igual ? "CID do quadro coincide com o capítulo do diagnóstico." : "CID do quadro difere do capítulo do diagnóstico.");

  const vistos = new Map<string, number>();
  const ws = pal.map((w) => w.toLowerCase());
  let repetido = "";
  for (let i = 0; i + 12 <= ws.length; i++) {
    const k = ws.slice(i, i + 12).join(" ");
    vistos.set(k, (vistos.get(k) ?? 0) + 1);
    if ((vistos.get(k) ?? 0) > 1 && !repetido) repetido = k;
  }
  add("repeticao-12", !repetido, "alerta", repetido ? `Trecho de 12 palavras repetido: "${repetido}".` : "Sem trecho de 12 palavras repetido.");

  const ultima = frases[frases.length - 1] ?? "";
  add("ultima-frase", /\d|retorno|reavalia|se (surgir|houver|aparecer)|sinal/i.test(ultima), "alerta", "Última frase traz data ou sinal-gatilho.");

  const bloqueios = itens.filter((i) => !i.ok && i.nivel === "bloqueio");
  return {
    aprovado: bloqueios.length === 0,
    itens,
    metricas: {
      capitulos: e.capitulos,
      palavras: total,
      frases: frases.length,
      mediaPalavrasFrase: Number(media.toFixed(1)),
      pctAbaixo30: Number(pctAbaixo30.toFixed(0)),
      flesch: Number(flesch.toFixed(0)),
      declaracoesFonte: nFonte,
    },
  };
}
