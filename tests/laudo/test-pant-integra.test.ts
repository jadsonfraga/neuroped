// Íntegra do Laudo SuperNeuroPed: o laudo inteiro colado de outra IA vira o PDF
// no padrão PANT (pasta Panty) sem exigir nenhum campo por seção, sem perder
// nenhum parágrafo e sem gravar prontuário.
import { readFileSync } from "node:fs";
import type { SuperMedico } from "../../client/src/lib/laudo/modeloSuper";
import { gerarLaudoSuper, laudoSuperParaTexto } from "../../client/src/lib/laudo/modeloSuper";
import { buildLaudoPantPrintHtml, romano } from "../../client/src/lib/laudo/pantPrintTemplate";
import { prepararIntegra, tituloPadraoIntegra, PANT_TITULOS_PADRAO } from "../../client/src/lib/laudo/pantIntegra";

let ok = 0;
let falhas = 0;
function assert(cond: boolean, descricao: string) {
  if (cond) {
    ok++;
    console.log(`  ✓ ${descricao}`);
  } else {
    falhas++;
    console.error(`  ✗ FALHOU: ${descricao}`);
  }
}

const medico: SuperMedico = {
  nome: "Dra. Emissora Sintética",
  titulos: "Neuropediatra",
  registro: "CRM-XX 00.000 · RQE 00.000",
  endereco: "Rua Sintética, 000 · Cidade/UF",
  motto: "Lema sintético",
  empresa: "Clínica Sintética LTDA",
};

const imprimir = (texto: string, paciente: string, extra: Record<string, string> = {}) =>
  buildLaudoPantPrintHtml({
    texto,
    paciente,
    medico,
    assetBase: "https://exemplo.invalid/app/",
    protocoloPadrao: "20261008-1940",
    emitidoEm: "8 de outubro de 2026",
    ...extra,
  });

const visivel = (html: string) =>
  html
    .replace(/<style[\s\S]*?<\/style>/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ");

const nums = (html: string) => [...html.matchAll(/<div class="num">([IVXLCDM]+)<\/div><h2>([^<]*)<\/h2>/g)].map((m) => [m[1], m[2]]);

// Laudo colado em prosa simples, com os 13 títulos do padrão e nenhum markdown.
const TITULOS = [
  "Em uma página",
  "Quem é Helena Martins Duarte",
  "Como Helena chegou até aqui",
  "O que a família contou nesta consulta",
  "O que a escola descreve",
  "O que a psicoterapia registra",
  "O que os exames trazem",
  "O exame neurológico e o estado mental nesta consulta",
  "O que esses achados significam quando lidos juntos",
  "O diagnóstico, firmado, em investigação e em suspeita",
  "O que fazer a partir de agora",
  "O que a escola precisa saber",
  "Quando nos revemos",
];
const paragrafos = TITULOS.map((_, i) => [
  `Parágrafo ${i + 1}A da paciente fictícia, com fatos sintéticos e frase completa.`,
  `Parágrafo ${i + 1}B, segundo bloco da mesma seção, também sintético.`,
]);
const colado = [
  "Laudo Neuropediátrico",
  "Paciente: Helena Martins Duarte, 7 anos, retorno",
  "",
  ...TITULOS.flatMap((t, i) => [t, "", paragrafos[i][0], "", paragrafos[i][1], ""]),
].join("\n");

console.log("\n[1] Prosa colada com os 13 títulos (sem nenhum campo de seção)");
const prep = prepararIntegra(colado);
const html = imprimir(prep.texto, prep.paciente);
const secs = nums(html);
assert(prep.modo === "titulos" && prep.secoes.length === 13, `13 títulos reconhecidos (${prep.secoes.length})`);
assert(secs.length === 13 && secs.every(([n], i) => n === romano(i + 1)), `seções I…XIII em romano (${secs.map((s) => s[0]).join(" ")})`);
assert(secs.every(([, t], i) => t === TITULOS[i].replace(/&/g, "&amp;")), "cada título colado vira o título da seção, na ordem");
const vis = visivel(html);
const faltando = paragrafos.flat().filter((p) => !vis.includes(p.slice(1)));
assert(faltando.length === 0, `todos os 26 parágrafos colados aparecem no PDF${faltando.length ? ` (faltando: ${faltando.slice(0, 2).join(" | ")})` : ""}`);
assert((html.match(/class="drop"/g) || []).length === 1 && /<h2>Em uma página<\/h2><\/header>\s*<p class="drop"><span class="dc">P<\/span>/.test(html), "capitular única no primeiro parágrafo de “Em uma página”");
assert(prep.paciente === "Helena Martins Duarte", `nome da capa vem da linha “Paciente:” (${prep.paciente})`);
assert(/<div class="nome">Helena Martins Duarte<\/div>/.test(html) && /<div class="meta">7 anos <i>·<\/i> retorno<\/div>/.test(html), "capa: nome, idade e tipo vindos do texto colado");
assert(/@bottom-left\{content:"Helena Martins Duarte"/.test(html), "rodapé das folhas com o nome do paciente");
assert(!/<p>Laudo Neuropediátrico<\/p>/.test(html), "linha-título “Laudo Neuropediátrico” não duplica no miolo (já está na capa)");
assert(PANT_TITULOS_PADRAO.length === 13, "lista-padrão I–XIII com 13 títulos");

console.log("\n[2] Formas comuns de título em texto de IA");
const formas = [
  "## I. Em uma página",
  "**II — Quem é Helena Martins Duarte**",
  "III · Como Helena chegou até aqui:",
  "### 4. O que a família contou nesta consulta",
  "Seção V – O que a escola descreve",
  "**XIII. Quando nos revemos**",
];
assert(formas.every((f) => tituloPadraoIntegra(f) !== null), "aceita #, **, numeral romano/arábico, “Seção” e “:” final");
assert(tituloPadraoIntegra("O diagnóstico não foi firmado nesta consulta.") === null, "frase de parágrafo que começa igual a um título não vira seção");
const mdForm = prepararIntegra(formas.map((f, i) => `${f}\n\nTexto ${i + 1} da seção.`).join("\n\n"));
const mdHtml = imprimir(mdForm.texto, mdForm.paciente);
assert(nums(mdHtml).map(([, t]) => t).join("|") === "Em uma página|Quem é Helena Martins Duarte|Como Helena chegou até aqui|O que a família contou nesta consulta|O que a escola descreve|Quando nos revemos", "numeral e marcação saem do título; o template renumera I, II, …");
assert(mdForm.paciente === "Helena Martins Duarte", "sem “Paciente:”, o nome sai do título “Quem é …”");

console.log("\n[3] Markdown do MOTOR_PANT (# capítulos, **negrito**, ==destaque==, tabela)");
const motor = [
  "# Em uma página",
  "",
  "Retorno por **desatenção** depois do ==recreio==, sem diagnóstico firmado.",
  "",
  "# Conduta e terapias",
  "",
  "## Sono",
  "",
  "- Dormir às 21h.",
  "* Sem tela após 20h.",
  "",
  "| Terapia | Carga | Responsável | Objetivo |",
  "|---|---|---|---|",
  "| Psicoterapia | 1x/semana | Psicóloga | Rotina *da tarde* |",
].join("\n");
const pm = prepararIntegra(motor);
const hm = imprimir(pm.texto, "Paciente Sintético");
assert(nums(hm).length === 2 && nums(hm)[1][1] === "Conduta e terapias", "# capítulos do motor seguem como seções (inclusive fora da lista-padrão)");
assert(/<h3>Sono<\/h3>/.test(hm), "## vira subtítulo");
assert(/<b>desatenção<\/b>/.test(hm) && /<mark>recreio<\/mark>/.test(hm), "**negrito** e ==destaque== preservados");
assert(/Quadro de terapias/.test(hm) && /<td>Psicoterapia<\/td><td>1x\/semana<\/td><td>Psicóloga<\/td><td>Rotina <i>da tarde<\/i><\/td>/.test(hm), "tabela | | vira o quadro de terapias com 4 colunas e *itálico*");
assert(/<li class="ponto">[\s\S]*Dormir às 21h\.[\s\S]*Sem tela após 20h\./.test(hm), "listas - e * viram itens do padrão");

console.log("\n[4] Identidade preenchida: a capa usa os campos; a linha do texto fica no miolo");
const comId = prepararIntegra(colado, { identidadePreenchida: true });
const hId = imprimir(comId.texto, "Nome Do Campo", { idade: "8 anos", dataConsulta: "8 de outubro de 2026" });
assert(/<div class="nome">Nome Do Campo<\/div>/.test(hId) && /<div class="meta">8 anos <i>·<\/i> 8 de outubro de 2026<\/div>/.test(hId), "capa com Nome/idade/data dos campos");
assert(visivel(hId).includes("Paciente: Helena Martins Duarte, 7 anos, retorno"), "linha “Paciente:” do texto não some: vai para a abertura do miolo");
assert(nums(hId).length === 13, "corpo continua vindo da Íntegra (13 seções)");

console.log("\n[5] Prosa sem títulos e texto copiado de PDF");
const prosa = "Helena Martins Duarte\n\nPrimeiro parágrafo sem título nenhum.\n\nSegundo parágrafo que foi quebrado\nno meio por cópia de PDF e continua aqui.\n\nTerceiro parágrafo.";
const pp = prepararIntegra(prosa);
const hp = visivel(imprimir(pp.texto, pp.paciente));
assert(pp.modo === "prosa" && pp.paciente === "Helena Martins Duarte", "sem títulos: nome da primeira linha que parece nome");
assert(["Primeiro parágrafo sem título nenhum.", "Segundo parágrafo que foi quebrado no meio por cópia de PDF e continua aqui.", "Terceiro parágrafo."].every((p) => hp.includes(p)), "todos os parágrafos entram; quebra mole de PDF é reunida");
assert(!/Sem conteúdo informado/.test(hp), "prosa sem títulos não vira documento vazio");

console.log("\n[6] Texto do gerador por seções colado na Íntegra");
const gerado = laudoSuperParaTexto(gerarLaudoSuper({
  nome: "Paciente Sintético", idade: "7 anos", tipoConsulta: "retorno", dataConsulta: "8 de outubro de 2026",
  resumoCapa: "Síntese.", caixaCid: "", protocolo: "2026-10-08-0002", cidade: "", quemE: "Quem é sintético.",
  acompanhadoPor: "", observacaoEntrevista: "", motivo: "Motivo sintético.", motivoContexto: "", historiaSubsecoes: [],
  convergencia: "", divergencias: "", documentosConvergentes: "", funcionando: [], pedeAtencao: [], hipoteses: [],
  achadosComplementares: "", cids: [], planoMulti: [], condutaFarmaco: "", solicitacoes: [], prognosticoLeitura: "",
  cenarioFavoravel: [], cenarioEsperado: [], cenarioReservado: [], sinaisAlerta: [], retornoCondicao: "", sintese: "",
}, medico));
const pg = prepararIntegra(gerado);
assert(pg.modo === "estruturado" && pg.texto === gerado.replace(/\r\n?/g, "\n"), "formato do gerador passa intacto para o template");
assert(nums(imprimir(pg.texto, "Paciente Sintético")).length === 14, "14 seções do gerador preservadas");

console.log("\n[7] Segurança");
const hostil = prepararIntegra("Paciente: <img src=x onerror=alert(1)>\n\nEm uma página\n\n<script>alert(2)</script> texto.");
const hh = imprimir(hostil.texto, hostil.paciente);
assert(!/<script>alert/.test(hh) && !/<img src=x/.test(hh), "HTML colado é escapado (nome e corpo)");

console.log("\n[8] Página: Íntegra basta para gerar, visualizar e imprimir; nada é gravado");
const pagina = readFileSync(new URL("../../client/src/pages/laudo-super.tsx", import.meta.url), "utf8");
assert(/>\s*Íntegra\s*</.test(pagina) && /data-testid="textarea-laudo-integra"/.test(pagina), "campo “Íntegra” no topo do editor");
assert(/prepararIntegra/.test(pagina), "página usa prepararIntegra antes do template PANT");
assert(/disabled=\{!podeGerar\}/.test(pagina) && /podeGerar = configurado \|\| integraAtiva/.test(pagina), "Gerar laudo habilita só com a Íntegra");
assert((pagina.match(/disabled=\{!podeImprimir\}/g) || []).length === 2 && /podeImprimir = integraAtiva \|\| !!texto/.test(pagina), "Visualizar e Imprimir habilitam só com a Íntegra");
assert(!/apiRequest|fetch\(|useMutation|\/api\/patients|savePatient/.test(pagina), "colar/visualizar/imprimir não grava prontuário (sem chamada de API na página)");

console.log(`\nResultado: ${ok} aprovadas, ${falhas} falhas\n`);
process.exit(falhas > 0 ? 1 : 0);
