// ============================================================================
// client/src/lib/laudo/doutrina.ts — QA da prosa do laudo (equiv. a L.qa)
// ----------------------------------------------------------------------------
// Aplica os GUARDA-CORPOS do template PANT por VERIFICAÇÃO, não por confiança:
//   • CID-10 e CID-11 sempre em paralelo (capa + cada linha de diagnóstico)
//   • sem conector/perfumaria de IA ("vale ressaltar", "ademais", ...)
//   • sem escore inventado / "(est.)"
//   • seções essenciais presentes (Diagnósticos, Plano, Acompanhamento, Síntese)
// Retorna { aprovado, violacoes } — use no gate/teste antes de emitir o PDF.
// ============================================================================
import type { Laudo, LaudoSecao } from "./types";

// Conectores e marcadores de IA vetados pela doutrina (caixa-insensível).
const CONECTORES_VETADOS = [
  "vale ressaltar", "vale destacar", "vale lembrar", "ademais", "outrossim",
  "neste sentido", "nesse sentido", "dessa forma", "desta forma", "em suma",
  "em síntese,", "neste contexto", "nesse contexto", "por fim,", "cabe ressaltar",
  "é importante notar", "nota-se que", "convém salientar", "salienta-se",
];

const CID10 = /\b[A-Z]\d{2}(\.\d+)?\b/;          // ex.: F84.0
const CID11 = /\b\d[A-Z]\d{2}(\.\d+)?\b/;        // ex.: 6A02.0

function textoDaSecao(s: LaudoSecao): string {
  const out: string[] = [s.titulo];
  for (const b of s.blocos) {
    if (b.tipo === "abertura") out.push(b.inicial + b.texto);
    else if (b.tipo === "p" || b.tipo === "sub" || b.tipo === "referencias") out.push(b.texto);
    else if (b.tipo === "tabela") out.push(b.cabec.join(" "), ...b.linhas.map((l) => l.join(" ")));
    else if (b.tipo === "diagnosticos") out.push(...b.itens.map((d) => `${d.dx} ${d.caracterizacao} ${d.cid10} ${d.cid11}`));
  }
  return out.join("\n");
}

export interface ResultadoDoutrina {
  aprovado: boolean;
  violacoes: string[];
}

export function validarDoutrina(laudo: Laudo): ResultadoDoutrina {
  const v: string[] = [];
  const { capa, corpo } = laudo;

  // 1. CID-10 e CID-11 em paralelo na capa
  if (!capa.cid10 || !CID10.test(capa.cid10)) v.push("capa: CID-10 ausente ou inválido");
  if (!capa.cid11 || !CID11.test(capa.cid11)) v.push("capa: CID-11 ausente ou inválido (CID-10 e CID-11 sempre em paralelo)");

  // 2. Cada diagnóstico da tabela com os DOIS CIDs
  for (const s of corpo) {
    for (const b of s.blocos) {
      if (b.tipo === "diagnosticos") {
        b.itens.forEach((d, i) => {
          if (!CID10.test(d.cid10 || "")) v.push(`§${s.numero} diagnóstico ${i + 1} ("${d.dx}"): CID-10 ausente/ inválido`);
          if (!CID11.test(d.cid11 || "")) v.push(`§${s.numero} diagnóstico ${i + 1} ("${d.dx}"): CID-11 ausente/ inválido`);
        });
      }
    }
  }

  // 3. Conectores/perfumaria de IA + escore inventado, em toda a prosa
  const textoTudo = corpo.map(textoDaSecao).join("\n").toLowerCase();
  for (const c of CONECTORES_VETADOS) {
    if (textoTudo.includes(c)) v.push(`prosa: conector/perfumaria vetado — "${c.trim()}"`);
  }
  if (/\(est\.\)|\(estimad/i.test(textoTudo)) v.push('prosa: escore/medida estimada "(est.)" — vetado (gravidade em prosa, não número inventado)');

  // 4. Seções essenciais do padrão PANT
  const titulos = corpo.map((s) => s.titulo.toLowerCase());
  for (const req of ["diagnóstic", "plano", "acompanhamento", "síntese"]) {
    if (!titulos.some((t) => t.includes(req))) v.push(`estrutura: seção essencial ausente ("${req}…")`);
  }

  return { aprovado: v.length === 0, violacoes: v };
}

/** Linha de QA estilo L.qa(): "APROVADO …" ou a lista de violações. */
export function qa(laudo: Laudo): string {
  const r = validarDoutrina(laudo);
  return r.aprovado
    ? "APROVADO — prosa orgânica, CID-10/CID-11 em paralelo, sem perfumaria."
    : "REPROVADO:\n  - " + r.violacoes.join("\n  - ");
}
