// ============================================================================
// tests/laudo/test-gerador-embed.test.ts — QA do gerador embutido
// ----------------------------------------------------------------------------
// Prova que o gerador (sem API externa):
//   1. produz laudo APROVADO na doutrina PANT com dados completos;
//   2. produz texto integral com CID-10/CID-11 em paralelo;
//   3. extrai diagnósticos estruturados da prosa da hipótese;
//   4. mantém seções essenciais mesmo com campos vazios;
//   5. nunca injeta perfumaria de IA nem "(est.)".
// Rodar: node --import tsx tests/laudo/test-gerador-embed.test.ts
// ============================================================================
import { gerarEValidar, parseDiagnosticoProsa, gerarLaudo } from "../../client/src/lib/laudo/gerador";
import { validarDoutrina } from "../../client/src/lib/laudo/doutrina";
import { laudoParaTexto } from "../../client/src/lib/laudo/paraTexto";

let pass = 0,
  fail = 0;
const fails: string[] = [];
const ok = (cond: boolean, msg: string) => {
  if (cond) pass++;
  else {
    fail++;
    fails.push(msg);
  }
};

const base = {
  paciente: "Fulano de Tal",
  dataNascimento: "2019-03-14",
  idade: "7 anos",
  sexo: "masculino",
  cidade: "Petrolina/PE",
  dataAvaliacao: "2026-08-20",
  protocolo: "nº 2026-0145",
  motivoAvaliacao:
    "Encaminhado pela escola para investigação de dificuldade de atenção, inquietude motora e atraso na socialização com colegas.",
  historiaClinica:
    "Segundo filho de pais saudáveis, sem doença crônica conhecida. Convive com os pais e um irmão de 10 anos.",
  historiaNeurodesenvolvimento:
    "Andou aos 13 meses; primeiros vocábulos aos 22 meses. Fala frases curtas desde os 3 anos.",
  gestacaoPartoPuerperio: "Gestação sem intercorrências; parto a termo; Apgar 9 e 10; sem internação neonatal.",
  exameClinico: "Bom estado geral; peso e estatura no percentil 40; perímetro cefálico no percentil 55.",
  exameNeurologico:
    "Tônus e força muscular normais; reflexos osteotendinosos presentes e simétricos; marcha independente e regular; sem movimentos anormais.",
  exameComportamental:
    "Contato visual fugaz; brincadeira solitária; ecolalia parcial; atenção sustentada reduzida para a idade; atividade motora aumentada.",
  escalasInstrumentos: "M-CHAT-R/F (aplicado aos pais) e SNAP-IV (versão pais e professores).",
  escalasResultado: "M-CHAT-R/F: 7 de 23 respostas positivas, risco alto. SNAP-IV: desatenção 2,3 (pais), 2,5 (professores).",
  documentosAnalisados: "Relatório escolar de 2026; laudo fonoaudiológico de 03/2026.",
  hipoteseDiagnostica: "Transtorno do espectro autista nível 1 de gravidade (F84.0); transtorno de déficit de atenção e hiperatividade, apresentação combinada (F90.2).",
  cid10: "F84.0 · F90.2",
  cid11: "6A02.0 · 6A05.2",
  conduta:
    "Iniciar abordagem multiprofissional: fonoaudiologia quinzenal, terapia ocupacional semanal e orientação parental mensal.",
  recomendacoes: "Orientações escolares sobre adaptações curriculares e rotina previsível; pausas de atenção programadas.",
  diagnosticos: [],
};

// 1) Laudo completo → APROVADO
const r1 = gerarEValidar(base);
ok(r1.qa.startsWith("APROVADO"), "laudo completo deveria ser APROVADO; veio: " + r1.qa);

// 2) Texto integral preserva CID em paralelo
const texto1 = laudoParaTexto(r1.laudo);
ok(
  texto1.includes("CID-10: F84.0") && texto1.includes("CID-11: 6A02.0"),
  "texto integral deve trazer CID-10 e CID-11 em paralelo",
);
ok(texto1.includes("LAUDO MÉDICO NEUROPEDIÁTRICO"), "texto deve iniciar com o título do laudo");
ok(texto1.includes("2. MOTIVO DA AVALIAÇÃO"), "seções numeradas presentes");
ok(texto1.includes("Fulano de Tal"), "identificação presente");
ok(texto1.includes("Petrolina/PE,"), "fechamento com local");

// 3) Extração de diagnósticos da prosa
const dx = parseDiagnosticoProsa(
  "Transtorno do espectro autista nível 1 de gravidade (F84.0); TDAH apresentação combinada (F90.2)",
  "F84.0 · F90.2",
  "6A02.0 · 6A05.2",
);
ok(dx.length === 2, "deveria extrair 2 diagnósticos da prosa; veio " + dx.length);
ok(/n[íi]vel 1/.test(dx[0].caracterizacao), "caracterização 'nível 1' deveria ser extraída: " + dx[0].caracterizacao);
ok(dx[0].cid10 === "F84.0" && dx[0].cid11 === "6A02.0", "CID-10/CID-11 na linha 1");
ok(dx[1].cid10 === "F90.2" && dx[1].cid11 === "6A05.2", "CID-10/CID-11 na linha 2");

// 4) Com campos vazios → QA não reprova por estrutura, e não inventa nada
const vazio = { ...base };
vazio.motivoAvaliacao = "";
vazio.historiaClinica = "";
vazio.historiaNeurodesenvolvimento = "";
vazio.gestacaoPartoPuerperio = "";
vazio.exameClinico = "";
vazio.exameNeurologico = "";
vazio.exameComportamental = "";
vazio.escalasInstrumentos = "";
vazio.escalasResultado = "";
vazio.documentosAnalisados = "";
vazio.conduta = "";
vazio.recomendacoes = "";
vazio.hipoteseDiagnostica = "TEA nível 1 (F84.0)";
vazio.cid10 = "F84.0";
vazio.cid11 = "6A02.0";
vazio.diagnosticos = [];
const r4 = gerarEValidar(vazio);
ok(r4.qa.startsWith("APROVADO"), "laudo mínimo deveria ser APROVADO; veio: " + r4.qa);
const texto4 = laudoParaTexto(r4.laudo);
ok(!/\(est\.\)/i.test(texto4), "nunca injetar (est.)");

// 5) Prosa estrutural sem perfumaria de IA
const proibi = [
  "vale ressaltar", "ademais", "outrossim", "neste sentido", "dessa forma",
  "em suma", "por fim,", "salienta-se", "em síntese,",
];
for (const proibido of proibi) {
  ok(!texto1.toLowerCase().includes(proibido), `prosa não deve conter "${proibido}"`);
}

// 6) Dados do médico preservados literalmente no laudo
ok(texto1.includes("M-CHAT-R/F: 7 de 23 respostas positivas"), "escala do médico preservada literalmente");
ok(texto1.includes("Tônus e força muscular normais"), "exame do médico preservado literalmente");

console.log(`\n${pass} passaram, ${fail} falharam`);
if (fails.length) {
  console.log("FALHAS:\n  - " + fails.join("\n  - "));
  process.exit(1);
}
