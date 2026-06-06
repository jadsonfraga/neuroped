// ============================================================================
// client/src/lib/laudo/render.ts — render do laudo em HTML/print (padrão PANT)
// ----------------------------------------------------------------------------
// Função PURA: Laudo -> documento HTML (imprimível em PDF pelo navegador).
// Aproxima o visual ReportLab do template (capa navy, numerais de seção em ouro,
// capitular, tabela de diagnósticos, separador losango, fecho institucional).
// VISUAL: o refino fino (brasão, fita multicor, moldura dupla) deve ser conferido
// no navegador (Claude in Chrome) — aqui fica a base fiel à ESTRUTURA + doutrina.
// Sem emoji (documento clínico formal).
// ============================================================================
import type { Laudo, LaudoBloco } from "./types";

function esc(s: string): string {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
// **negrito** -> <strong> (doutrina: negrito só em Dx/CID/doses/prazos/alertas)
function inline(s: string): string {
  return esc(s).replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

function bloco(b: LaudoBloco): string {
  switch (b.tipo) {
    case "abertura":
      return `<p class="lead"><span class="dropcap">${esc(b.inicial)}</span>${inline(b.texto)}</p>`;
    case "p":
      return `<p>${inline(b.texto)}</p>`;
    case "sub":
      return `<h3 class="sub">${esc(b.texto)}</h3>`;
    case "referencias":
      return `<div class="refs"><h3 class="sub">Referências</h3><p>${inline(b.texto)}</p></div>`;
    case "assinatura":
      return `<div class="sig"><div class="losango">&#9670;</div>
        <p class="sig-local">${esc(b.localData)}</p>
        <div class="sig-line"></div>
        <p class="sig-nome">Dr. Jadson Fraga Araújo Júnior</p>
        <p class="sig-reg">Neuropediatria · CRM-PE 25227 · RQE 17756</p></div>`;
    case "tabela": {
      const cols = b.larguras || [];
      const head = b.cabec.map((c, i) => `<th${cols[i] ? ` style="width:${cols[i]}"` : ""}>${esc(c)}</th>`).join("");
      const rows = b.linhas.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`).join("");
      return `<table class="tbl"><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table>`;
    }
    case "diagnosticos": {
      const rows = b.itens.map((d) =>
        `<tr><td><strong>${esc(d.dx)}</strong></td><td>${esc(d.caracterizacao)}</td>
         <td class="cid"><strong>${esc(d.cid10)}</strong></td><td class="cid"><strong>${esc(d.cid11)}</strong></td></tr>`).join("");
      return `<table class="tbl tbl-dx"><thead><tr><th style="width:26%">Diagnóstico</th><th>Caracterização</th>
        <th style="width:12%">CID-10</th><th style="width:12%">CID-11</th></tr></thead><tbody>${rows}</tbody></table>`;
    }
  }
}

export function renderLaudoHTML(laudo: Laudo): string {
  const { capa, corpo } = laudo;
  const titulo = capa.tituloLinhas.map(esc).join("<br>");
  const nome = capa.pacienteLinhas.map(esc).join("<br>");
  const secoes = corpo.map((s) => `
    <section class="sec">
      <h2 class="sec-h"><span class="num">${String(s.numero).padStart(2, "0")}</span>${esc(s.titulo)}</h2>
      ${s.blocos.map(bloco).join("\n")}
    </section>`).join("\n");

  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<title>Laudo — ${esc(capa.paciente)}</title>
<style>
  :root{--navy:#0f1b3d;--navy2:#16264f;--gold:#b8924a;--ink:#1a1d29;--mut:#5b6072;--line:#dfe2ea}
  *{box-sizing:border-box} html,body{margin:0}
  body{font-family:"Georgia","Cormorant Garamond",serif;color:var(--ink);line-height:1.6;font-size:11.5pt}
  .cover{background:linear-gradient(160deg,var(--navy),var(--navy2));color:#fff;padding:60px 54px;min-height:340px;page-break-after:always}
  .eyebrow{font-size:9.5pt;letter-spacing:.22em;text-transform:uppercase;color:#c9cee0;margin:0 0 24px}
  .cover h1{font-size:34pt;line-height:1.05;margin:0 0 4px;font-weight:600}
  .cover .destaque{color:var(--gold);font-size:18pt;letter-spacing:.18em;text-transform:uppercase;margin:6px 0 28px}
  .cover .nome{font-size:20pt;margin:0 0 6px;color:#eef1f8}
  .cover .meta{font-size:10.5pt;color:#c9cee0;margin:0 0 22px}
  .cover .dx{font-size:11pt;color:#fff;margin:0} .cover .cids{color:var(--gold);font-weight:700;margin:4px 0 0}
  .cover .proto{margin-top:26px;font-size:9pt;letter-spacing:.08em;color:#aeb5cc;text-transform:uppercase}
  .doc{padding:36px 54px}
  .sec{margin:0 0 22px;page-break-inside:avoid}
  .sec-h{font-size:14pt;color:var(--navy);border-bottom:1px solid var(--line);padding-bottom:6px;margin:0 0 10px;font-weight:600}
  .sec-h .num{color:var(--gold);font-weight:700;margin-right:10px}
  p{margin:0 0 10px;text-align:justify} .lead{margin-top:2px}
  .dropcap{float:left;font-size:38pt;line-height:.8;color:#7a1f2b;font-weight:700;padding:4px 8px 0 0}
  .sub{font-size:10pt;letter-spacing:.08em;text-transform:uppercase;color:var(--mut);margin:14px 0 6px}
  .tbl{width:100%;border-collapse:collapse;margin:8px 0 12px;font-size:10.5pt}
  .tbl th{background:var(--navy);color:#fff;text-align:left;padding:7px 10px;font-weight:600}
  .tbl td{border-bottom:1px solid var(--line);padding:7px 10px;vertical-align:top}
  .tbl-dx .cid{font-variant-numeric:tabular-nums;color:var(--navy)}
  .sig{margin:26px 0 6px;text-align:center} .losango{color:var(--gold);font-size:13pt;margin-bottom:10px}
  .sig-local{color:var(--mut);font-size:10pt;margin:0 0 30px} .sig-line{width:280px;height:1px;background:var(--ink);margin:0 auto 6px}
  .sig-nome{font-weight:700;margin:0} .sig-reg{color:var(--mut);font-size:9.5pt;margin:2px 0 0}
  .refs p{font-size:9.5pt;color:var(--mut);text-align:left}
  .foot{border-top:1px solid var(--line);margin:28px 54px 0;padding:12px 0;color:var(--mut);font-size:8.5pt;text-align:center}
  @media print{ .cover{-webkit-print-color-adjust:exact;print-color-adjust:exact} .doc{padding:24px 48px} }
</style></head>
<body>
  <header class="cover">
    <p class="eyebrow">${esc(capa.eyebrow)}</p>
    <h1>${titulo}</h1>
    <div class="destaque">${esc(capa.subtituloDestacado)}</div>
    <p class="nome">${nome}</p>
    <p class="meta">${esc(capa.meta)}</p>
    <p class="dx">${esc(capa.diagnostico)}</p>
    <p class="cids">CID-10: ${esc(capa.cid10)} &nbsp;·&nbsp; CID-11: ${esc(capa.cid11)}</p>
    <p class="proto">${esc(capa.protocolo)}</p>
  </header>
  <main class="doc">${secoes}</main>
  <footer class="foot">SuperNeuroPed · Dr. Jadson Fraga · Documento clínico — não substitui avaliação presencial.</footer>
</body></html>`;
}
