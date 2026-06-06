// tests/laudo/test-doutrina.mjs — prova o QA da doutrina do laudo (rode: npx tsx)
import { validarDoutrina } from "../../client/src/lib/laudo/doutrina.ts";

let pass = 0, fail = 0; const fails = [];
const ok = (c, m) => { if (c) pass++; else { fail++; fails.push(m); } };

const capaOK = {
  eyebrow: "x", tituloLinhas: ["Relatório"], subtituloDestacado: "INTEGRADO",
  pacienteLinhas: ["Fulano"], paciente: "Fulano de Tal",
  meta: "7 anos · Masculino", diagnostico: "TEA · TDAH",
  cid10: "F84.0 · F90.0", cid11: "6A02.0 · 6A05.2", protocolo: "nº 1",
};
const secoesOK = [
  { numero: 4, titulo: "Diagnósticos", blocos: [
    { tipo: "diagnosticos", itens: [{ dx: "TEA", caracterizacao: "nível 1", cid10: "F84.0", cid11: "6A02.0" }] },
  ]},
  { numero: 5, titulo: "Plano terapêutico", blocos: [{ tipo: "p", texto: "O plano dirige-se aos prejuízos demonstrados." }] },
  { numero: 8, titulo: "Acompanhamento e retorno", blocos: [{ tipo: "p", texto: "Retorno em 6 a 8 semanas." }] },
  { numero: 9, titulo: "Síntese", blocos: [{ tipo: "p", texto: "Firmam-se os diagnósticos." }] },
];

// 1) Laudo limpo → APROVADO
const limpo = { capa: capaOK, corpo: secoesOK, localData: "Petrolina/PE" };
const r1 = validarDoutrina(limpo);
ok(r1.aprovado, "laudo limpo deveria ser APROVADO; veio: " + r1.violacoes.join("; "));

// 2) Sem CID-11 na capa → reprova
const r2 = validarDoutrina({ ...limpo, capa: { ...capaOK, cid11: "" } });
ok(!r2.aprovado && r2.violacoes.some((x) => x.includes("CID-11")), "deveria pegar CID-11 ausente na capa");

// 3) Conector de IA na prosa → reprova
const corpoConector = secoesOK.map((s) => s.titulo === "Plano terapêutico"
  ? { ...s, blocos: [{ tipo: "p", texto: "Ademais, o plano segue." }] } : s);
const r3 = validarDoutrina({ ...limpo, corpo: corpoConector });
ok(!r3.aprovado && r3.violacoes.some((x) => x.toLowerCase().includes("ademais")), "deveria pegar conector 'ademais'");

// 4) Escore estimado "(est.)" → reprova
const corpoEst = secoesOK.map((s) => s.titulo === "Síntese"
  ? { ...s, blocos: [{ tipo: "p", texto: "Gravidade moderada (est.)." }] } : s);
const r4 = validarDoutrina({ ...limpo, corpo: corpoEst });
ok(!r4.aprovado && r4.violacoes.some((x) => x.includes("(est.)")), "deveria pegar escore estimado (est.)");

// 5) Seção essencial faltando (sem Síntese) → reprova
const r5 = validarDoutrina({ ...limpo, corpo: secoesOK.filter((s) => s.titulo !== "Síntese") });
ok(!r5.aprovado && r5.violacoes.some((x) => x.includes("síntese")), "deveria pegar Síntese ausente");

// 6) Diagnóstico sem CID-11 na linha → reprova
const corpoDxRuim = secoesOK.map((s) => s.titulo === "Diagnósticos"
  ? { ...s, blocos: [{ tipo: "diagnosticos", itens: [{ dx: "TEA", caracterizacao: "n1", cid10: "F84.0", cid11: "" }] }] } : s);
const r6 = validarDoutrina({ ...limpo, corpo: corpoDxRuim });
ok(!r6.aprovado && r6.violacoes.some((x) => x.includes("CID-11")), "deveria pegar diagnóstico sem CID-11");

console.log(`[laudo-doutrina] ${pass}/${pass + fail} testes OK` + (fail ? ` · ${fail} FALHA(S)` : ""));
if (fail) { console.error("  ✗ " + fails.join("\n  ✗ ")); process.exit(1); }
console.log("✓ Doutrina do laudo: QA validado (CID 10+11, sem perfumaria, sem escore inventado, seções).");
