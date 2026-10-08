// Contrato visual e de conteúdo da impressão do Laudo SuperNeuroPed no padrão
// PANT (pasta Panty): capa azul-marinho com brasão, miolo creme com moldura
// dourada, seções em numeral romano, capitular na seção I, quadro de terapias,
// assinatura do emissor — sem perder uma linha do texto clínico.
import { readFileSync } from "node:fs";
import {
  gerarLaudoSuper,
  laudoSuperParaTexto,
  type SuperEntrada,
  type SuperMedico,
} from "../../client/src/lib/laudo/modeloSuper";
import {
  buildLaudoPantPrintHtml,
  cssString,
  romano,
  separarTexto,
  PANT_ASSETS,
  PANT_PALETA,
} from "../../client/src/lib/laudo/pantPrintTemplate";

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

const read = (p: string) => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");

// Emissor 100% sintético (a identidade real vem de client/src/lib/issuer.ts).
const medico: SuperMedico = {
  nome: "Dra. Emissora Sintética",
  titulos: "Neuropediatra",
  registro: "CRM-XX 00.000 · RQE 00.000",
  endereco: "Rua Sintética, 000 · Cidade/UF · CEP 00000-000",
  motto: "Lema sintético",
  empresa: "Clínica Sintética LTDA",
};

const caso: SuperEntrada = {
  nome: "Paciente Sintético",
  idade: "7 anos",
  tipoConsulta: "reavaliação",
  dataConsulta: "8 de outubro de 2026",
  resumoCapa: "Retorno por desatenção depois do recreio, sem diagnóstico firmado hoje.",
  caixaCid: "CID-10 F90.0 · CID-11 6A05.0, hipótese em investigação",
  protocolo: "2026-10-08-0001",
  cidade: "Cidade/UF",
  quemE: "Paciente sintético de sete anos que veio em retorno com a mãe.",
  acompanhadoPor: "Chega acompanhado da mãe.",
  observacaoEntrevista: "Colaborativo.",
  motivo: "Perde o fio da aula depois do recreio.",
  motivoContexto: "",
  historiaSubsecoes: [{ titulo: "Sono", texto: "Dorme às 23h com tablet." }],
  convergencia: "Mãe e escola convergem.",
  divergencias: "",
  documentosConvergentes: "",
  funcionando: ["Manhã organizada."],
  pedeAtencao: ["Sono curto."],
  hipoteses: [{ titulo: "TDAH desatento", texto: "Suspeita.", aFavor: ["Resposta ao remédio."], aPonderar: ["Sono curto."] }],
  achadosComplementares: "Exames sem alterações.",
  cids: [{ hipotese: "TDAH desatento", cid10: "F90.0", cid11: "6A05.0", status: "em investigação" }],
  planoMulti: [
    { titulo: "Psicoterapia", indicacao: "1 vez por semana", evidencia: "TCC, evidência moderada" },
    { titulo: "Rotina de sono", indicacao: "todas as noites por 3 semanas", evidencia: "" },
  ],
  condutaFarmaco: "Mantido metilfenidato 5 mg às 6h40.",
  solicitacoes: ["Escala SNAP-IV."],
  prognosticoLeitura: "Expectativa de melhora com o sono.",
  cenarioFavoravel: ["Melhora da tarde."],
  cenarioEsperado: ["Melhora parcial."],
  cenarioReservado: ["Persistência."],
  sinaisAlerta: ["Perda de apetite por mais de uma semana."],
  retornoCondicao: "Retorno em 12 de novembro de 2026.",
  sintese: "Este documento organiza os próximos passos.",
};

const texto = laudoSuperParaTexto(gerarLaudoSuper(caso, medico));
const base = {
  texto,
  paciente: caso.nome,
  medico,
  assetBase: "https://exemplo.invalid/app/",
  idade: caso.idade,
  tipoConsulta: caso.tipoConsulta,
  dataConsulta: caso.dataConsulta,
  protocoloPadrao: "20261008-1814",
  emitidoEm: "8 de outubro de 2026",
};
const html = buildLaudoPantPrintHtml(base);
const visivel = html
  .replace(/<style[\s\S]*?<\/style>/g, "")
  .replace(/<[^>]+>/g, "")
  .replace(/&amp;/g, "&")
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'")
  .replace(/&lt;/g, "<")
  .replace(/&gt;/g, ">")
  .replace(/\s+/g, " ");

console.log("\n[1] Padrão visual PANT (pasta Panty)");
assert(html.includes(`background:${PANT_PALETA.papel}`), "miolo em papel creme #F6F0E2");
for (const [nome, cor] of Object.entries({ ouro: "#D4A83B", numeral: "#A8801F", titulo: "#0A1830", vermelho: "#A41E1E" })) {
  assert(html.includes(cor), `paleta: ${nome} ${cor}`);
}
assert(/family=Cormorant\+Garamond/.test(html) && /family=Lato/.test(html), "tipografia Cormorant Garamond + Lato");
assert(/@page capa\{margin:0/.test(html) && /class="capa"/.test(html), "capa de página inteira (página nomeada sem margem)");
assert(html.includes(`${base.assetBase}${PANT_ASSETS.brasao}`), "capa usa o brasão do app (client/public/brand)");
assert(html.includes(`${base.assetBase}${PANT_ASSETS.folha}`), "folha com moldura dourada, selo e régua ouro/vermelho/azul");
assert(/SUPERNEUROPED/.test(html) && /<h1>Laudo Neuropediátrico<\/h1>/.test(html), "marca SUPERNEUROPED e título Laudo Neuropediátrico");
assert(/counter\(page\) " de " counter\(pages\)/.test(html), "folha numerada fl. N de M");
assert(/@top-left\{content:"SUPERNEUROPED"/.test(html), "cabeçalho de todas as folhas com a marca");

console.log("\n[2] Seções, capitular e quadro");
const nums = [...html.matchAll(/<div class="num">([IVXLCDM]+)<\/div>/g)].map((m) => m[1]);
assert(nums.join(",") === Array.from({ length: 14 }, (_, i) => romano(i + 1)).join(","), `14 seções em romano I…XIV (${nums.join(" ")})`);
assert((html.match(/class="drop"/g) || []).length === 1, "uma única capitular");
assert(/<div class="num">I<\/div><h2>[^<]*<\/h2><\/header>\s*<p class="drop"><span class="dc">P<\/span>/.test(html), "capitular no primeiro parágrafo da seção I");
assert(/Quadro de terapias[\s\S]*<td>Psicoterapia<\/td><td>1 vez por semana<\/td><td>TCC, evidência moderada<\/td>/.test(html), "plano multiprofissional vira quadro de terapias");
assert(/<td>Rotina de sono<\/td><td>todas as noites por 3 semanas<\/td><td><\/td>/.test(html), "linha do quadro sem evidência continua no quadro");
assert(romano(4) === "IV" && romano(9) === "IX" && romano(14) === "XIV", "conversão romana");

console.log("\n[3] Conteúdo clínico preservado");
const { corpo } = separarTexto(texto);
const faltando = corpo
  .map((l) => l.trim())
  .filter((l) => l && !l.includes("=".repeat(60)) && l !== "—")
  .map((l) => l.replace(/^\d{2}\s{2,}/, "").replace(/^[—◆■✦·]\s/, "").replace(/^\[[^\]]+\]\s*/, "").trim())
  // Rótulos estruturais viram layout (célula do quadro, linha de código CID):
  // o que se exige é o valor clínico, inteiro.
  .map((l) => l.replace(/^(INDICAÇÃO|EVIDÊNCIA):\s*/i, ""))
  .flatMap((l) => l.split(/ — (?=CID-10 )| — (?=[^—]+$)/))
  .filter((l) => l && !visivel.includes(l.replace(/\s+/g, " ")));
assert(faltando.length === 0, `todas as linhas do corpo aparecem no documento${faltando.length ? ` (faltando: ${faltando.slice(0, 3).join(" | ")})` : ""}`);
assert(visivel.includes(caso.resumoCapa) && visivel.includes(caso.caixaCid), "síntese e CID da capa abrem o miolo");
assert(visivel.includes("CID-10 F90.0 · CID-11 6A05.0"), "códigos CID-10/CID-11 preservados");
assert(html.includes('@bottom-center{content:"SuperNeuroPed nº 2026-10-08-0001"'), "protocolo do texto no rodapé");
assert(visivel.includes("7 anos") && visivel.includes("reavaliação") && visivel.includes("8 de outubro de 2026"), "idade, tipo e data na capa");

console.log("\n[4] Emissor e assinatura (fonte única issuer.ts)");
assert((html.match(/Dra\. Emissora Sintética/g) || []).length >= 3, "nome do emissor na capa, no cabeçalho e na assinatura");
assert(html.includes("Neuropediatra · CRM-XX 00.000 · RQE 00.000"), "credenciais do emissor");
assert(html.includes(medico.endereco), "endereço do emissor no rodapé da capa");
assert(/<div class="fecho">[\s\S]*class="sign"[\s\S]*Lema sintético/.test(html), "assinatura e lema no mesmo bloco indivisível");
const fonte = read("client/src/lib/laudo/pantPrintTemplate.ts");
assert(!/Jadson|CRM-PE|Raimundo Lacerda|Petrolina|9109-7371/.test(fonte), "nenhuma identidade pessoal embutida no template");

console.log("\n[5] Segurança do documento");
const hostil = buildLaudoPantPrintHtml({
  ...base,
  paciente: `<img src=x onerror=alert(1)>"</style><script>alert(2)</script>`,
  texto: texto.replace("Exames sem alterações.", "<script>alert(3)</script> **negrito** ==alerta=="),
});
assert(!/<script>alert/.test(hostil) && !/<img src=x/.test(hostil), "HTML do paciente e do texto escapado");
assert(!/content:"[^"]*<\/style>/.test(hostil), "nome do paciente no rodapé (CSS) não fecha o <style>");
assert(/<b>negrito<\/b>/.test(hostil) && /<mark>alerta<\/mark>/.test(hostil), "marcação **negrito** e ==destaque== do motor PANT");
assert(cssString('a"b\\c\nd</style>') === '"a\\"b\\\\c\\A d\\3C /style>"', "cssString escapa aspas, barra, quebra e <");

console.log("\n[6] Robustez do texto editado");
const semProto = buildLaudoPantPrintHtml({ ...base, texto: texto.replace("SuperNeuroPed nº 2026-10-08-0001", "SuperNeuroPed nº —") });
assert(semProto.includes("SuperNeuroPed nº 20261008-1814"), "protocolo ausente cai no carimbo de data");
const md = buildLaudoPantPrintHtml({
  ...base,
  texto: "---\npaciente: X\n---\n# Em uma página\n\nMotivo do retorno.\n\n# Conduta\n\n| Terapia | Carga |\n|---|---|\n| Fono | 1x |\n",
});
assert(/<div class="num">I<\/div><h2>Em uma página<\/h2>[\s\S]*<span class="dc">M<\/span>otivo/.test(md), "markdown do motor PANT (# capítulo) numera em romano com capitular");
assert(/<div class="num">II<\/div>/.test(md) && /<td>Fono<\/td><td>1x<\/td>/.test(md), "tabela | | do .md vira quadro");
assert(!/paciente: X/.test(md), "frontmatter não vaza para o corpo");
assert(/Sem conteúdo informado/.test(buildLaudoPantPrintHtml({ ...base, texto: "" })), "texto vazio declara ausência");

console.log("\n[7] Arquivos da marca");
const folha = read(`client/public/${PANT_ASSETS.folha}`);
const capa = read(`client/public/${PANT_ASSETS.capa}`);
assert(/#a41e1e/i.test(folha) && /#d4a83b/i.test(folha) && /#0a1830/i.test(folha), "régua ouro/vermelho/azul na folha");
assert(!/href="(?!data:)/.test(folha) && !/href="(?!data:)/.test(capa), "SVGs autocontidos (sem recurso externo)");
const brasao = readFileSync(new URL(`../../client/public/${PANT_ASSETS.brasao}`, import.meta.url));
assert(brasao.subarray(0, 4).toString() === "RIFF" && brasao.subarray(8, 12).toString() === "WEBP" && brasao.length < 150_000, "brasão recortado em WebP leve (<150 KB)");

const pagina = read("client/src/pages/laudo-super.tsx");
assert(/buildLaudoPantPrintHtml/.test(pagina) && !/function buildPrintHtmlSuper/.test(pagina), "Laudo SuperNeuroPed imprime pelo template PANT (sem gerador paralelo)");
assert(/fonts\?\.ready/.test(pagina), "impressão espera as fontes carregarem");

console.log(`\nResultado: ${ok} aprovadas, ${falhas} falhas\n`);
process.exit(falhas > 0 ? 1 : 0);
