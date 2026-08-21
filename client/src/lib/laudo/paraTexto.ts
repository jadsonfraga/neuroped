// ============================================================================
// client/src/lib/laudo/paraTexto.ts — laudo estruturado → texto integral
// ----------------------------------------------------------------------------
// Converte o Laudo (modelo tipado PANT) em texto plano pronto para:
//   • a área de texto da página /laudo-neuroped (impressão/PDF existentes)
//   • o buildDocumentPdf (assinatura ICP-Brasil PAdES)
//   • cópia para o prontuário
// ============================================================================
import type { Laudo, LaudoBloco, LaudoSecao } from "./types";

function blocoEmTexto(b: LaudoBloco): string {
  switch (b.tipo) {
    case "abertura":
      return `${b.inicial}${b.texto}`;
    case "p":
      return b.texto;
    case "sub":
      return b.texto;
    case "tabela": {
      const header = b.cabec.join(" | ");
      const linhas = b.linhas.map((l) => l.join(" | ")).join("\n");
      return `${header}\n${linhas}`;
    }
    case "diagnosticos": {
      const linhas = b.itens.map((d) => {
        const parts = [d.dx, d.caracterizacao].filter(Boolean);
        return `${parts.join(" — ")} | CID-10: ${d.cid10} | CID-11: ${d.cid11}`;
      });
      return `• ${linhas.join("\n• ")}`;
    }
    case "assinatura":
      return b.localData;
    case "referencias":
      return b.texto;
    default:
      return "";
  }
}

function secaoEmTexto(s: LaudoSecao): string {
  const cab = `${s.numero}. ${s.titulo.toUpperCase()}`;
  const corpo = s.blocos
    .map((b) => blocoEmTexto(b))
    .filter((t) => t.trim().length > 0)
    .join("\n\n");
  return `${cab}\n\n${corpo}`;
}

export function laudoParaTexto(laudo: Laudo, identificador = true): string {
  const c = laudo.capa;
  const partes: string[] = ["LAUDO MÉDICO NEUROPEDIÁTRICO"];
  if (identificador) {
    const id: string[] = [];
    if (c.paciente) id.push(`Paciente: ${c.paciente}`);
    if (c.meta) id.push(c.meta);
    if (c.protocolo && c.protocolo !== "—") id.push(`Protocolo: ${c.protocolo}`);
    const dx: string[] = [];
    if (c.diagnostico) dx.push(`Diagnósticos: ${c.diagnostico}`);
    if (c.cid10) dx.push(`CID-10: ${c.cid10}`);
    if (c.cid11) dx.push(`CID-11: ${c.cid11}`);
    if (id.length) partes.push(id.join("\n"));
    if (dx.length) partes.push(dx.join("\n"));
  }
  for (const s of laudo.corpo) partes.push(secaoEmTexto(s));
  partes.push(laudo.localData);
  return partes.join("\n\n");
}
