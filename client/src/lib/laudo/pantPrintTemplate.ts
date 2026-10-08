// ============================================================================
// client/src/lib/laudo/pantPrintTemplate.ts — impressão do Laudo SuperNeuroPed
// no padrão visual PANT (mesmo desenho dos laudos arquivados na pasta Panty).
// ----------------------------------------------------------------------------
// Capa azul-marinho com moldura dupla dourada, brasão recortado, marca
// SUPERNEUROPED, título "Laudo Neuropediátrico", bloco do paciente e rodapé do
// emissor. Miolo em papel creme (#F6F0E2) com moldura dourada, selo e régua
// ouro/vermelho/azul no cabeçalho, seções em numeral romano, capitular na
// seção I, quadro de terapias, assinatura e folha "fl. N de M".
//
// Identidade do emissor: sempre do call site (client/src/lib/issuer.ts) —
// nenhum nome, CRM ou endereço é embutido aqui.
// Tipografia: Cormorant Garamond + Lato (Google Fonts, liberadas na CSP).
// Função pura (sem DOM): testável em Node e reaproveitável por outros emissores.
// ============================================================================

import { escapeHtml } from "../htmlEscape";
import type { SuperMedico } from "./modeloSuper";

export const PANT_PALETA = {
  papel: "#F6F0E2",
  ouro: "#D4A83B",
  numeral: "#A8801F",
  titulo: "#0A1830",
  vermelho: "#A41E1E",
  capa: "#0A1830",
  tinta: "#1B2033",
} as const;

export const PANT_FONTES_URL =
  "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Lato:wght@300;400;700&display=swap";

/** Arquivos em client/public/brand (servidos pelo próprio app). */
export const PANT_ASSETS = {
  brasao: "brand/laudo-brasao.webp",
  capa: "brand/laudo-capa.svg",
  folha: "brand/laudo-folha.svg",
} as const;

const SEPARADOR = "=".repeat(60);

const ROMANOS: Array<[number, string]> = [
  [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"],
  [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
];

export function romano(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return String(n);
  let r = "";
  let v = Math.floor(n);
  for (const [k, s] of ROMANOS) {
    while (v >= k) {
      r += s;
      v -= k;
    }
  }
  return r;
}

/** String segura para `content:` de @page (margem): aspas, barras, quebra e `<`. */
export function cssString(value: string): string {
  return (
    '"' +
    Array.from(String(value ?? ""))
      .filter((ch) => {
        const c = ch.charCodeAt(0);
        return c === 10 || c === 13 || (c >= 32 && c !== 127);
      })
      .join("")
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"')
      .replace(/</g, "\\3C ")
      .replace(/\r?\n/g, "\\A ") +
    '"'
  );
}

/** Marcação inline herdada do motor PANT: **negrito** e ==destaque em vermelho==. */
function inline(raw: string): string {
  return escapeHtml(raw)
    .replace(/\*\*([^*\n]+?)\*\*/g, "<b>$1</b>")
    .replace(/==([^=\n]+?)==/g, '<mark>$1</mark>');
}

// ── Leitura do texto final (editável) ───────────────────────────────────────

export interface PantPreambulo {
  sintese: string;
  cid: string;
  protocolo: string;
  meta: string;
  outros: Array<{ rotulo: string; texto: string }>;
  livres: string[];
}

type Bloco =
  | { t: "secao"; num: string; titulo: string }
  | { t: "sub"; texto: string }
  | { t: "legenda"; rotulo: string; texto: string }
  | { t: "p"; texto: string }
  | { t: "rotulado"; rotulo: string; texto: string }
  | { t: "item"; tipo: "pro" | "con" | "alerta" | "ponto"; texto: string }
  | { t: "cid"; nome: string; cid10: string; cid11: string; status: string }
  | { t: "quadro"; cabecalho: string[]; linhas: string[][]; legenda: string }
  | { t: "assinatura"; linhas: string[] };

const CABECALHO_TEXTO = [
  /^SUPER\s*NEURO\s*PED\b.*LAUDO/i,
  /^Avalia[cç][aã]o Neuropsiqui[aá]trica do Neurodesenvolvimento$/i,
];

function lerPreambulo(linhas: string[]): PantPreambulo {
  const pre: PantPreambulo = { sintese: "", cid: "", protocolo: "", meta: "", outros: [], livres: [] };
  for (const bruta of linhas) {
    const l = bruta.trim();
    if (!l) continue;
    if (CABECALHO_TEXTO.some((re) => re.test(l))) continue;
    const pac = l.match(/^PACIENTE:\s*(.*)$/i);
    if (pac) {
      const partes = pac[1].split(/\s+·\s+/);
      pre.meta = partes.slice(1).join(" · ").trim();
      continue;
    }
    const proto = l.match(/^SuperNeuroPed n[º°o]\.?\s*(.*)$/i);
    if (proto) {
      pre.protocolo = proto[1].trim();
      continue;
    }
    const box = l.match(/^\[([^\]]+)\]\s*(.*)$/);
    if (box) {
      const rot = box[1].trim();
      if (/^S[IÍ]NTESE DA CONSULTA$/i.test(rot)) pre.sintese = box[2].trim();
      else if (/^CAIXA CID$/i.test(rot)) pre.cid = box[2].trim();
      else pre.outros.push({ rotulo: rot, texto: box[2].trim() });
      continue;
    }
    pre.livres.push(l);
  }
  return pre;
}

function linhasDoMedico(m: SuperMedico): string[] {
  return [m.nome, m.titulos, m.registro, m.motto, m.empresa]
    .map((s) => (s || "").trim())
    .filter(Boolean);
}

function lerCorpo(linhas: string[], medico: SuperMedico): Bloco[] {
  const out: Bloco[] = [];
  const doMedico = new Set(linhasDoMedico(medico));
  let secaoSeq = 0;
  let assinatura: string[] | null = null;
  let tabela: string[] = [];

  const fecharTabela = () => {
    if (!tabela.length) return;
    const rows = tabela
      .filter((l) => !/^\s*\|[\s:|-]+\|\s*$/.test(l))
      .map((l) => l.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim()));
    tabela = [];
    if (!rows.length) return;
    const legenda = /terapia/i.test(rows[0][0] || "")
      ? "Quadro de terapias"
      : /medica|f[aá]rmaco/i.test(rows[0][0] || "")
        ? "Quadro de farmacologia"
        : "Quadro";
    out.push({ t: "quadro", cabecalho: rows[0], linhas: rows.slice(1), legenda });
  };

  for (const bruta of linhas) {
    const l = bruta.trim();
    if (l.startsWith("|")) {
      tabela.push(l);
      continue;
    }
    fecharTabela();
    if (!l || l.includes(SEPARADOR)) continue;

    if (assinatura) {
      assinatura.push(l);
      continue;
    }
    if (l === "—" || l === "--") {
      assinatura = [];
      continue;
    }

    const sec = l.match(/^(\d{1,2})\s{2,}(.+)$/);
    if (sec) {
      secaoSeq = Number(sec[1]);
      out.push({ t: "secao", num: romano(secaoSeq), titulo: sec[2].trim() });
      continue;
    }
    const md2 = l.match(/^##\s+(.+)$/);
    if (md2) {
      out.push({ t: "sub", texto: md2[1].trim() });
      continue;
    }
    const md1 = l.match(/^#\s+(.+)$/);
    if (md1) {
      secaoSeq += 1;
      out.push({ t: "secao", num: romano(secaoSeq), titulo: md1[1].trim() });
      continue;
    }
    const box = l.match(/^\[([^\]]+)\]\s*(.*)$/);
    if (box) {
      out.push({ t: "legenda", rotulo: box[1].trim(), texto: box[2].trim() });
      continue;
    }
    if (/^— /.test(l)) {
      out.push({ t: "sub", texto: l.slice(2).trim() });
      continue;
    }
    if (/^◆ /.test(l)) { out.push({ t: "item", tipo: "pro", texto: l.slice(2) }); continue; }
    if (/^■ /.test(l)) { out.push({ t: "item", tipo: "con", texto: l.slice(2) }); continue; }
    if (/^✦ /.test(l)) { out.push({ t: "item", tipo: "alerta", texto: l.slice(2) }); continue; }
    const cid = l.match(/^· (.+) — CID-10 ([A-Z0-9.]+) · CID-11 ([0-9A-Z.]+) — (.+)$/);
    if (cid) {
      out.push({ t: "cid", nome: cid[1], cid10: cid[2], cid11: cid[3], status: cid[4] });
      continue;
    }
    if (/^· /.test(l)) { out.push({ t: "item", tipo: "ponto", texto: l.slice(2) }); continue; }
    const rot = l.match(/^(INDICAÇÃO|EVIDÊNCIA|SOLICITAÇÕES DESTA CONSULTA):\s*(.*)$/i);
    if (rot) {
      out.push({ t: "rotulado", rotulo: rot[1], texto: rot[2] });
      continue;
    }
    if (doMedico.has(l)) {
      // Linha de identidade solta fora do bloco "—": continua formatada como assinatura.
      out.push({ t: "assinatura", linhas: [l] });
      continue;
    }
    out.push({ t: "p", texto: l });
  }
  fecharTabela();
  if (assinatura) out.push({ t: "assinatura", linhas: assinatura });
  return agruparPlano(out);
}

/**
 * Seção 09 do perfil: "Título / INDICAÇÃO: … / EVIDÊNCIA: …" vira o quadro de
 * terapias do padrão PANT. Nenhum texto é descartado: título, indicação e
 * evidência passam inteiros para as células.
 */
function agruparPlano(blocos: Bloco[]): Bloco[] {
  const out: Bloco[] = [];
  let i = 0;
  while (i < blocos.length) {
    const linhas: string[][] = [];
    let j = i;
    while (j + 1 < blocos.length) {
      const a = blocos[j];
      const b = blocos[j + 1];
      if (a.t !== "p" || b.t !== "rotulado" || !/^INDICA/i.test(b.rotulo)) break;
      const c = blocos[j + 2];
      const temEvid = c && c.t === "rotulado" && /^EVID/i.test(c.rotulo);
      linhas.push([a.texto, b.texto, temEvid ? (c as { texto: string }).texto : ""]);
      j += temEvid ? 3 : 2;
    }
    if (linhas.length) {
      out.push({
        t: "quadro",
        cabecalho: ["Terapia", "Indicação", "Evidência"],
        linhas,
        legenda: "Quadro de terapias",
      });
      i = j;
      continue;
    }
    out.push(blocos[i]);
    i += 1;
  }
  return out;
}

// ── Renderização ────────────────────────────────────────────────────────────

function capitular(texto: string): string {
  const chars = Array.from(texto);
  const primeira = chars[0] || "";
  if (!/\p{L}/u.test(primeira)) return inline(texto);
  return `<span class="dc">${escapeHtml(primeira)}</span>${inline(chars.slice(1).join(""))}`;
}

function renderBlocos(blocos: Bloco[], medico: SuperMedico): string {
  const html: string[] = [];
  let secoes = 0;
  let capitularPendente = false;
  let lista: string[] = [];
  let secaoAberta = false;

  const fecharLista = () => {
    if (lista.length) html.push(`<ul class="itens">${lista.join("")}</ul>`);
    lista = [];
  };
  const fecharSecao = () => {
    fecharLista();
    if (secaoAberta) html.push("</section>");
    secaoAberta = false;
  };

  for (const b of blocos) {
    if (b.t !== "item") fecharLista();
    switch (b.t) {
      case "secao":
        fecharSecao();
        secoes += 1;
        capitularPendente = secoes === 1;
        secaoAberta = true;
        html.push(
          `<section class="secao"><header class="cab-secao"><div class="num">${b.num}</div><h2>${inline(b.titulo)}</h2></header>`,
        );
        break;
      case "sub":
        html.push(`<h3>${inline(b.texto)}</h3>`);
        break;
      case "legenda":
        html.push(`<div class="legenda">${escapeHtml(b.rotulo)}</div>`);
        if (b.texto) html.push(`<p>${inline(b.texto)}</p>`);
        break;
      case "p":
        if (capitularPendente) {
          html.push(`<p class="drop">${capitular(b.texto)}</p>`);
          capitularPendente = false;
        } else {
          html.push(`<p>${inline(b.texto)}</p>`);
        }
        break;
      case "rotulado":
        html.push(`<p><span class="rot">${escapeHtml(b.rotulo)}:</span> ${inline(b.texto)}</p>`);
        break;
      case "item": {
        const marca = b.tipo === "pro" ? "◆" : b.tipo === "con" ? "■" : b.tipo === "alerta" ? "✦" : "·";
        lista.push(`<li class="${b.tipo}"><span class="m" aria-hidden="true">${marca}</span>${inline(b.texto)}</li>`);
        break;
      }
      case "cid":
        html.push(
          `<p class="dx"><b>${inline(b.nome)}</b><span class="cod">CID-10 ${escapeHtml(b.cid10)} · CID-11 ${escapeHtml(b.cid11)}</span><span class="st">${inline(b.status)}</span></p>`,
        );
        break;
      case "quadro": {
        const th = b.cabecalho.map((c) => `<th>${inline(c)}</th>`).join("");
        const tb = b.linhas
          .map((r) => `<tr>${b.cabecalho.map((_, k) => `<td>${inline(r[k] || "")}</td>`).join("")}</tr>`)
          .join("");
        html.push(
          `<div class="quadro"><div class="t">${escapeHtml(b.legenda)}</div><table><thead><tr>${th}</tr></thead><tbody>${tb}</tbody></table></div>`,
        );
        break;
      }
      case "assinatura":
        html.push(renderAssinatura(b.linhas, medico));
        break;
    }
  }
  fecharSecao();
  return html.join("\n");
}

function renderAssinatura(linhas: string[], medico: SuperMedico): string {
  const nome = (medico.nome || "").trim();
  const cred = [medico.titulos, medico.registro].map((s) => (s || "").trim()).filter(Boolean);
  const motto = (medico.motto || "").trim();
  const empresa = (medico.empresa || "").trim();
  const conhecidas = new Set([nome, ...cred, motto, empresa].filter(Boolean));
  const extras = linhas.filter((l) => !conhecidas.has(l));
  const temNome = linhas.includes(nome) && !!nome;
  const credLinhas = cred.filter((c) => linhas.includes(c));
  const partes: string[] = [];
  if (temNome || credLinhas.length) {
    partes.push(
      `<div class="sign"><div class="who"><div class="line"></div>` +
        (temNome ? `<div class="nm">${escapeHtml(nome)}</div>` : "") +
        (credLinhas.length ? `<div class="cr">${credLinhas.map(escapeHtml).join(" · ")}</div>` : "") +
        `</div></div>`,
    );
  }
  for (const e of extras) partes.push(`<p class="sig-extra">${inline(e)}</p>`);
  const fecho: string[] = [];
  if (empresa && linhas.includes(empresa)) fecho.push(`<div class="r">${escapeHtml(empresa)}</div>`);
  if (motto && linhas.includes(motto)) fecho.push(`<div class="s">${escapeHtml(motto)}</div>`);
  if (fecho.length) partes.push(`<div class="closing">${fecho.join("")}</div>`);
  // Assinatura e fecho viajam juntos: nunca sobra o lema sozinho numa folha.
  return partes.length ? `<div class="fecho">${partes.join("\n")}</div>` : "";
}

// ── Documento ───────────────────────────────────────────────────────────────

export interface PantPrintInput {
  /** Texto final do laudo (o que está no editor, inclusive edições manuais). */
  texto: string;
  paciente: string;
  medico: SuperMedico;
  /** URL absoluta da raiz do app (para os arquivos de client/public/brand). */
  assetBase: string;
  /** Dados da capa quando o texto não trouxer a linha "PACIENTE: …". */
  idade?: string;
  tipoConsulta?: string;
  dataConsulta?: string;
  /** Protocolo de reserva quando o texto não trouxer "SuperNeuroPed nº …". */
  protocoloPadrao: string;
  /** Data de emissão por extenso (pt-BR). */
  emitidoEm: string;
}

function asset(base: string, rel: string): string {
  const b = base.endsWith("/") ? base : `${base}/`;
  return b + rel;
}

export function separarTexto(texto: string): { preambulo: string[]; corpo: string[] } {
  let linhas = String(texto || "").replace(/\r\n?/g, "\n").split("\n");
  // Frontmatter do .md do motor PANT (--- … ---): metadado, não corpo.
  if (linhas[0]?.trim() === "---") {
    const fim = linhas.findIndex((l, i) => i > 0 && l.trim() === "---");
    if (fim > 0) linhas = linhas.slice(fim + 1);
  }
  const idx = linhas.findIndex((l) => l.includes(SEPARADOR));
  if (idx < 0) return { preambulo: [], corpo: linhas };
  return { preambulo: linhas.slice(0, idx), corpo: linhas.slice(idx) };
}

export function buildLaudoPantPrintHtml(input: PantPrintInput): string {
  const { medico } = input;
  const { preambulo, corpo } = separarTexto(input.texto);
  const pre = lerPreambulo(preambulo);
  const blocos = lerCorpo(corpo, medico);
  const paciente = input.paciente.trim();
  const protocoloTexto = pre.protocolo && pre.protocolo !== "—" ? pre.protocolo : "";
  const protocolo = `SuperNeuroPed nº ${protocoloTexto || input.protocoloPadrao}`;

  const metaPartes = pre.meta
    ? pre.meta.split(/\s+·\s+/)
    : [input.idade, input.tipoConsulta, input.dataConsulta].map((s) => (s || "").trim()).filter(Boolean);
  const metaCapa = metaPartes.length ? metaPartes.map(escapeHtml).join(' <i>·</i> ') : escapeHtml(input.emitidoEm);

  const credCapa = [medico.titulos, medico.registro].map((s) => (s || "").trim()).filter(Boolean).join(" · ");
  const credCab = credCapa;

  const abertura: string[] = [];
  if (pre.sintese) abertura.push(`<div class="legenda">Síntese da consulta</div><p class="sintese">${inline(pre.sintese)}</p>`);
  if (pre.cid) abertura.push(`<div class="legenda">Classificação (CID)</div><p class="cid">${inline(pre.cid)}</p>`);
  for (const o of pre.outros) abertura.push(`<div class="legenda">${escapeHtml(o.rotulo)}</div>${o.texto ? `<p>${inline(o.texto)}</p>` : ""}`);
  for (const l of pre.livres) abertura.push(`<p>${inline(l)}</p>`);

  const vazio = !blocos.length && !abertura.length;
  const corpoHtml = vazio ? "<p>Sem conteúdo informado.</p>" : renderBlocos(blocos, medico);

  const ornamento = (top: number) =>
    `<div class="dia" style="top:${top}mm"><svg viewBox="0 0 52 4" aria-hidden="true"><circle cx="1" cy="2" r="0.35" fill="#c9a24e"/><circle cx="51" cy="2" r="0.35" fill="#c9a24e"/><path d="M24 2 L26 0.4 L28 2 L26 3.6 Z" fill="none" stroke="#d4ac57" stroke-width="0.3"/><circle cx="29.6" cy="2" r="0.3" fill="#d4ac57"/></svg></div>`;

  const P = PANT_PALETA;
  const esc = escapeHtml;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Laudo Neuropediátrico — ${esc(paciente || "Paciente")}</title>
<meta name="author" content="${esc(medico.nome || "")}">
<meta name="generator" content="SuperNeuroPed">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${PANT_FONTES_URL}" rel="stylesheet">
<style>
@page{size:A4;margin:35mm 28mm 27mm 28mm;
  background:${P.papel} url("${asset(input.assetBase, PANT_ASSETS.folha)}") no-repeat -28mm -35mm/210mm 297mm;
  @top-left{content:"SUPERNEUROPED";font:600 9.6pt "Cormorant Garamond",Georgia,serif;letter-spacing:.32em;color:${P.titulo};vertical-align:top;padding-top:17.6mm;padding-left:15mm;width:90mm;white-space:nowrap}
  @top-right{content:${cssString([medico.nome, credCab].filter(Boolean).join("\n"))};white-space:pre;text-align:right;font:300 6.9pt Lato,Arial,sans-serif;line-height:1.6;color:#9d9e9e;letter-spacing:.02em;vertical-align:top;padding-top:15.2mm;width:80mm}
  @bottom-left{content:${cssString(paciente)};font:300 6.4pt Lato,Arial,sans-serif;color:#b1a688;vertical-align:top;padding-top:12.3mm;width:55mm;white-space:nowrap}
  @bottom-center{content:${cssString(protocolo)};font:italic 400 7pt "Cormorant Garamond",Georgia,serif;color:#b9a982;vertical-align:top;padding-top:12.1mm;width:60mm;white-space:nowrap}
  @bottom-right{content:"fl. " counter(page) " de " counter(pages);font:400 6.4pt Lato,Arial,sans-serif;color:${P.numeral};vertical-align:top;padding-top:12.3mm;width:45mm;text-align:right}
}
@page capa{margin:0;background:${P.capa} url("${asset(input.assetBase, PANT_ASSETS.capa)}") no-repeat 0 0/210mm 297mm;
  @top-left{content:none}@top-right{content:none}@bottom-left{content:none}@bottom-center{content:none}@bottom-right{content:none}}
*{box-sizing:border-box}
html{font-family:"Cormorant Garamond",Georgia,serif;color:${P.tinta};-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{margin:0}
@media screen{
  body{background:#5b6170;padding:8mm 0}
  .capa,.corpo{width:210mm;margin:0 auto 8mm;box-shadow:0 2mm 8mm rgba(0,0,0,.35)}
  .corpo{background:${P.papel} url("${asset(input.assetBase, PANT_ASSETS.folha)}") no-repeat 0 0/210mm 297mm;padding:35mm 28mm 27mm;min-height:297mm}
}

/* ── capa ── */
.capa{page:capa;height:297mm;position:relative;overflow:hidden;text-align:center;color:#f3ead6;break-after:page;
  background:${P.capa} url("${asset(input.assetBase, PANT_ASSETS.capa)}") no-repeat 0 0/210mm 297mm}
.capa .brasao{position:absolute;left:50%;top:21mm;height:110mm;width:auto;transform:translateX(-50%)}
.capa .marca{position:absolute;top:137.2mm;left:0;right:0;font:400 7.6pt Lato,Arial,sans-serif;letter-spacing:.52em;padding-left:.52em;color:#d4ac57}
.capa .dia{position:absolute;left:0;right:0;height:4mm}
.capa .dia svg{width:52mm;height:4mm}
.capa h1{position:absolute;top:148mm;left:0;right:0;margin:0;font:400 34pt "Cormorant Garamond",Georgia,serif;letter-spacing:.005em;color:#f3ead6}
.capa .sub{position:absolute;top:170.5mm;left:0;right:0;font:300 7.4pt Lato,Arial,sans-serif;letter-spacing:.3em;padding-left:.3em;color:#b49a62;text-transform:uppercase}
.capa .rotulo{position:absolute;top:204mm;left:0;right:0;font:400 6.6pt Lato,Arial,sans-serif;letter-spacing:.42em;color:#d4ac57}
.capa .rotulo span{display:inline-block;width:15mm;height:.3mm;background:#c9a24e;vertical-align:middle;margin:0 5mm}
.capa .nome{position:absolute;top:210.3mm;left:12mm;right:12mm;font:600 23.5pt/1.1 "Cormorant Garamond",Georgia,serif;color:#f3ead6}
.capa .meta{position:absolute;top:226mm;left:12mm;right:12mm;font:400 8.3pt Lato,Arial,sans-serif;color:#e9e1cf}
.capa .meta i{font-style:normal;font-weight:300;color:#a9a392}
.capa .curto{position:absolute;top:255.4mm;left:92mm;width:26mm;height:.25mm;background:#8f7a4c}
.capa .medico{position:absolute;top:261.5mm;left:0;right:0;font:500 12.2pt "Cormorant Garamond",Georgia,serif;color:#f3ead6}
.capa .crm{position:absolute;top:269.6mm;left:0;right:0;font:400 7pt Lato,Arial,sans-serif;letter-spacing:.24em;color:#a8873f;text-transform:uppercase}
.capa .end{position:absolute;top:275.6mm;left:14mm;right:14mm;font:300 6.1pt Lato,Arial,sans-serif;color:#7f8597}

/* ── miolo ── */
.corpo{font-size:12.6pt}
.secao{margin-top:9.5mm}
.secao:first-child{margin-top:0}
.cab-secao{break-inside:avoid;break-after:avoid;page-break-after:avoid}
.num{font:500 9.5pt "Cormorant Garamond",Georgia,serif;letter-spacing:.35em;color:${P.numeral};margin:0 0 1.2mm}
.num::after{content:"";display:inline-block;width:12mm;height:.3mm;background:${P.ouro};vertical-align:middle;margin-left:2.2mm}
h2{font:600 19.5pt/1.15 "Cormorant Garamond",Georgia,serif;color:${P.titulo};margin:0 0 4.2mm}
h3{font:600 italic 13.5pt/1.2 "Cormorant Garamond",Georgia,serif;color:${P.titulo};margin:5mm 0 2mm;break-after:avoid;page-break-after:avoid}
p{font-size:12.6pt;line-height:18.6pt;text-align:justify;margin:0 0 3.6mm;orphans:2;widows:2;hyphens:manual}
p.drop .dc{float:left;font:600 50pt/.78 "Cormorant Garamond",Georgia,serif;color:${P.titulo};margin:1.6mm 1.6mm 0 0}
p b,li b{font-weight:700;color:${P.titulo}}
mark{background:none;color:${P.vermelho};font-weight:600}
.legenda{font:400 6.6pt Lato,Arial,sans-serif;letter-spacing:.32em;text-transform:uppercase;color:${P.numeral};margin:5mm 0 2.2mm;break-after:avoid;page-break-after:avoid}
.legenda::before{content:"";display:inline-block;width:6mm;height:.3mm;background:${P.ouro};vertical-align:middle;margin-right:2.5mm}
.abertura{margin-bottom:9mm;padding-bottom:3mm;border-bottom:.25mm solid #e3cf9b}
.abertura .legenda:first-child{margin-top:0}
p.cid{color:${P.titulo}}
.rot{font:700 7pt Lato,Arial,sans-serif;letter-spacing:.16em;color:${P.vermelho};text-transform:uppercase}
ul.itens{list-style:none;margin:0 0 3.6mm;padding:0}
ul.itens li{position:relative;padding-left:6mm;font-size:12.2pt;line-height:17.6pt;text-align:justify;margin:0 0 1.6mm;break-inside:avoid}
ul.itens li .m{position:absolute;left:0;top:0;font-size:9pt;color:${P.ouro}}
ul.itens li.con .m{color:${P.titulo}}
ul.itens li.alerta .m{color:${P.vermelho}}
p.dx{text-align:left}
p.dx b{display:block;color:${P.titulo}}
p.dx .cod{display:block;font:400 8pt Lato,Arial,sans-serif;letter-spacing:.12em;color:${P.numeral};margin-top:.6mm}
p.dx .st{display:block;font-style:italic}
.quadro{margin:6.5mm 0 4mm;break-inside:avoid}
.quadro .t{font:400 6.4pt Lato,Arial,sans-serif;letter-spacing:.32em;text-transform:uppercase;color:${P.numeral};margin-bottom:2.4mm}
.quadro .t::before{content:"";display:inline-block;width:6mm;height:.3mm;background:${P.ouro};vertical-align:middle;margin-right:2.5mm}
.quadro table{width:100%;border-collapse:collapse}
.quadro th{font:400 6.4pt Lato,Arial,sans-serif;letter-spacing:.2em;text-transform:uppercase;color:${P.numeral};text-align:left;padding:2.2mm 2mm 2.2mm 0;border-top:.45mm solid ${P.ouro};border-bottom:.25mm solid ${P.ouro}}
.quadro td{font-size:10.4pt;line-height:13.4pt;vertical-align:top;padding:2.4mm 2.5mm 2.6mm 0;border-bottom:.2mm solid #e3cf9b;text-align:left}
.quadro td:first-child{font-weight:700;color:${P.titulo};width:30mm}
.quadro tr:last-child td{border-bottom:.45mm solid ${P.ouro}}
/* fecho compacto e preso ao último parágrafo: folha de assinatura nunca sai sem texto */
.fecho{break-inside:avoid;page-break-inside:avoid;break-before:avoid;page-break-before:avoid;margin-top:10mm}
.sign{break-inside:avoid}
.sign .who{width:92mm}
.sign .line{height:11mm;border-bottom:.25mm solid #8a7a55;margin-bottom:2mm}
.sign .nm{font:600 11.5pt "Cormorant Garamond",Georgia,serif;color:${P.titulo}}
.sign .cr{font:300 6.8pt Lato,Arial,sans-serif;color:#8f8f8f;margin-top:.6mm;letter-spacing:.02em}
p.sig-extra{text-align:left;font-size:10.5pt}
.closing{margin-top:6mm;border-top:.2mm solid #e3cf9b;padding-top:3mm;text-align:center;break-inside:avoid}
.closing .r{font:300 6.4pt Lato,Arial,sans-serif;color:#a59d8a}
.closing .s{font:italic 500 11pt "Cormorant Garamond",Georgia,serif;color:${P.numeral};margin-top:2mm;letter-spacing:.04em}
</style>
</head>
<body>
<section class="capa" aria-label="Capa">
  <img class="brasao" src="${asset(input.assetBase, PANT_ASSETS.brasao)}" alt="">
  <div class="marca">SUPERNEUROPED</div>
  ${ornamento(142.6)}
  <h1>Laudo Neuropediátrico</h1>
  <div class="sub">Avaliação neuropsiquiátrica do neurodesenvolvimento</div>
  ${ornamento(194.6)}
  <div class="rotulo"><span></span>PACIENTE<span></span></div>
  <div class="nome">${esc(paciente || "—")}</div>
  <div class="meta">${metaCapa}</div>
  <div class="curto"></div>
  ${medico.nome ? `<div class="medico">${esc(medico.nome)}</div>` : ""}
  ${credCapa ? `<div class="crm">${esc(credCapa)}</div>` : ""}
  ${medico.endereco ? `<div class="end">${esc(medico.endereco)}</div>` : ""}
</section>
<main class="corpo">
${abertura.length ? `<div class="abertura">${abertura.join("\n")}</div>` : ""}
${corpoHtml}
</main>
</body>
</html>`;
}
