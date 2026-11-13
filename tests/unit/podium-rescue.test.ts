import assert from "node:assert/strict";
import { selectPodium, estimatedQuestionCount, PODIUM_QUESTION_CAP } from "../../client/src/data/filterPodium.ts";
import type { RefinedScaleMatch } from "../../client/src/data/advancedFilterLogic.ts";

// Trava a semântica dos passes PÓS-TETO do pódio com fixtures sintéticas:
//  1. resgate por sinal consciente de orçamento — quando a candidata que fala o
//     sinal só cabe no teto de 100 se for a menor, o pódio final deve contê-la
//     (o hard cap é cego a sinais e desfazia o resgate pré-teto);
//  2. aproveitamento de curadoria — quando o teto estreitou o pódio e nenhuma
//     medalha é curada, a curada disponível que CABE no orçamento assume um
//     selo, com guards de relevância (Δ≤15), respondente e cobertura única.

type Scale = RefinedScaleMatch["scale"];

function makeMatch(partial: {
  id: string;
  rel: number;
  itens: number;
  queixas: string[];
  signalTags?: string[];
  respondente?: string[];
  ageMin?: number;
  ageMax?: number;
}): RefinedScaleMatch {
  const scale = {
    id: partial.id,
    nome: `Sintética ${partial.id}`,
    name: `Sintética ${partial.id}`,
    categoria: "triagem",
    queixas: partial.queixas,
    ageMin: partial.ageMin ?? 0,
    ageMax: partial.ageMax ?? 216,
    respondente: partial.respondente ?? ["pais", "clinico"],
    signalTags: partial.signalTags ?? [],
    verifiedItemCount: partial.itens,
    description: `${partial.itens} itens de teste sintético`,
    implementationStatus: "complete",
    appRoute: `/generic-scale/${partial.id}`,
  } as unknown as Scale;
  return {
    scale,
    relevanceScore: partial.rel,
    clinicalReason: "fixture",
    warningFlags: [],
    tier: "gold",
    confidenceLevel: 90,
    implementationStatus: "complete",
    implementationLabel: "Aplicação completa disponível no app.",
    applicationMode: "questionario_cuidador",
    licenseRestricted: false,
  } as RefinedScaleMatch;
}

function podiumIds(p: ReturnType<typeof selectPodium>): string[] {
  return [p.ouro, p.prata, p.bronze].filter(Boolean).map((s) => s!.scale.id);
}
function podiumTotal(p: ReturnType<typeof selectPodium>): number {
  return [p.ouro, p.prata, p.bronze]
    .filter(Boolean)
    .reduce((sum, s) => sum + estimatedQuestionCount(s!.scale), 0);
}

// ── 1. Resgate por sinal sobrevive ao hard cap ─────────────────────────────
{
  const matches = [
    // Top do ranking que fala o sinal: 100 itens — não cabe com mais ninguém.
    makeMatch({ id: "sig-gigante", rel: 90, itens: 100, queixas: ["tea"], signalTags: ["seletividade alimentar"] }),
    // Alternativa que fala o sinal e CABE ao lado das medalhas pequenas.
    makeMatch({ id: "sig-cabivel", rel: 80, itens: 40, queixas: ["tea"], signalTags: ["seletividade alimentar"] }),
    // Medalhas naturais por relevância, sem sinal.
    makeMatch({ id: "mudo-a", rel: 95, itens: 20, queixas: ["tea"] }),
    makeMatch({ id: "mudo-b", rel: 93, itens: 15, queixas: ["tea"] }),
    makeMatch({ id: "mudo-c", rel: 91, itens: 10, queixas: ["tea"] }),
  ];
  const podium = selectPodium(matches, null, {
    selectedQueixas: ["tea"],
    ageMonths: 60,
    selectedSignals: ["seletividade alimentar"],
  });
  const ids = podiumIds(podium);
  assert.ok(
    ids.includes("sig-cabivel"),
    `pódio deve conter a escala que fala o sinal e cabe no teto (veio: ${ids.join(", ")})`,
  );
  assert.ok(podiumTotal(podium) <= PODIUM_QUESTION_CAP, "teto de 100 permanece absoluto");
  console.log("✓ resgate por sinal pós-teto escolhe candidata que cabe no orçamento");
}

// ── 2. Curadoria aproveitada quando cabe no orçamento ──────────────────────
{
  const matches = [
    makeMatch({ id: "heur-ouro", rel: 92, itens: 30, queixas: ["cognicao"] }),
    makeMatch({ id: "heur-prata", rel: 89, itens: 48, queixas: ["cognicao"] }),
    // Curada: relevância 5 pontos menor, cabe no lugar da prata (30+63≤100).
    makeMatch({ id: "curada-fit", rel: 84, itens: 63, queixas: ["cognicao"] }),
  ];
  const podium = selectPodium(
    matches,
    { queixa: "cognicao", ageMin: 0, ageMax: 216, ouro: "curada-fit", reason: "fixture" },
    { selectedQueixas: ["cognicao"], ageMonths: 215, selectedSignals: [] },
  );
  const ids = podiumIds(podium);
  assert.ok(
    ids.includes("curada-fit"),
    `pódio deve aproveitar a curada que cabe no orçamento (veio: ${ids.join(", ")})`,
  );
  assert.ok(podiumTotal(podium) <= PODIUM_QUESTION_CAP, "teto de 100 permanece absoluto");
  console.log("✓ curadoria pós-teto assume um selo quando cabe no orçamento");
}

// ── 3. Invariante combinado: sinal + curadoria + orçamento apertado ────────
// Sob pressão simultânea (curadoria disponível, sinal marcado e teto justo),
// o teto de 100 NUNCA cede e o sinal segue coberto quando há candidata viável.
// INTEGRAÇÃO REAL (auditoria semanal, P1): o sinal chega no FORMATO DA UI —
// o ID "tdah-impulsividade-basica" (signalsAndSymptoms), não o termo da tag.
// A versão antiga deste fixture usava "impulsividade" (forma da signalTag) e
// mantinha a suíte verde enquanto o pódio comparava ID×tag e nunca casava no
// uso real. Só a correspondência canônica (ID → rótulo/descrição → tokens)
// faz este caso passar.
{
  const matches = [
    makeMatch({ id: "x-ouro", rel: 94, itens: 35, queixas: ["tdah"] }),
    makeMatch({ id: "x-prata", rel: 90, itens: 30, queixas: ["tdah"] }),
    makeMatch({ id: "x-sinal", rel: 78, itens: 30, queixas: ["tdah"], signalTags: ["impulsividade"] }),
    makeMatch({ id: "x-curada-grande", rel: 85, itens: 90, queixas: ["tdah"] }),
  ];
  const podium = selectPodium(
    matches,
    { queixa: "tdah", ageMin: 0, ageMax: 216, ouro: "x-curada-grande", reason: "fixture" },
    { selectedQueixas: ["tdah"], ageMonths: 96, selectedSignals: ["tdah-impulsividade-basica"] },
  );
  const ids = podiumIds(podium);
  assert.ok(podiumTotal(podium) <= PODIUM_QUESTION_CAP, `teto estourou: ${podiumTotal(podium)}`);
  assert.ok(
    ids.includes("x-sinal"),
    `sinal marcado com candidata viável deve estar coberto (veio: ${ids.join(", ")})`,
  );
  console.log("✓ sob pressão combinada, teto absoluto e cobertura de sinal se mantêm");
}

// ── 4. Discriminação do matcher canônico contra o CATÁLOGO REAL ────────────
// Evidência forte exigida: sinal de impulsividade do TDAH é "falado" pelas
// escalas de TDAH e NUNCA pelas de TEA/desenvolvimento — sobreposição de verbos
// genéricos da descrição não vira afirmação categórica.
{
  const { scaleMatchesSelectedSignals } = await import(
    "../../client/src/data/advancedFilterLogic.ts"
  );
  const { allScales } = await import("../../client/src/data/scaleFilter.ts");
  const ctx = { queixas: ["tdah"], selectedSignals: ["tdah-impulsividade-basica"] };
  const check = (id: string, expected: boolean) => {
    const scale = allScales.find((s) => s.id === id)!;
    assert.equal(
      scaleMatchesSelectedSignals(scale, ctx),
      expected,
      `${id}: esperado ${expected} para sinal real da UI`,
    );
  };
  for (const id of ["snap", "na-atencao-atividade-pais", "na-atencao-atividade-professor"]) check(id, true);
  // M-CHAT, Denver II e SCARED saíram em 17/10/2026: as alternativas no app não podem "falar" impulsividade.
  for (const id of ["na-sinais-precoces-tea-pais", "na-observacao-clinica-tea", "swyc-marcos-24m", "na-ansiedade-autorrelato"]) check(id, false);
  console.log("✓ matcher canônico discrimina sinais reais da UI no catálogo real");
}

// ── 5. Todos os sinais cobertos individualmente ────────────────────────────
// Cobrir o primeiro sinal não pode suprimir o resgate do segundo.
{
  const matches = [
    makeMatch({ id: "sinal-a", rel: 98, itens: 20, queixas: ["tdah"], signalTags: ["desatencao"] }),
    makeMatch({ id: "generica-a", rel: 97, itens: 15, queixas: ["tdah"] }),
    makeMatch({ id: "generica-b", rel: 96, itens: 15, queixas: ["tdah"] }),
    makeMatch({ id: "sinal-b", rel: 78, itens: 24, queixas: ["tdah"], signalTags: ["impulsividade"] }),
  ];
  const podium = selectPodium(matches, null, {
    selectedQueixas: ["tdah"],
    ageMonths: 96,
    selectedSignals: ["desatencao", "impulsividade"],
  });
  const ids = podiumIds(podium);
  assert.ok(ids.includes("sinal-a"), `desatenção deve permanecer coberta (veio: ${ids.join(", ")})`);
  assert.ok(ids.includes("sinal-b"), `impulsividade deve ser resgatada (veio: ${ids.join(", ")})`);
  assert.ok(podiumTotal(podium) <= PODIUM_QUESTION_CAP);
}

// Ranking determinístico com empate e candidato de carga desconhecida.
{
  const matches = [
    makeMatch({ id: "estavel-a", rel: 85, itens: 20, queixas: ["sono"] }),
    makeMatch({ id: "estavel-b", rel: 85, itens: 25, queixas: ["sono"] }),
    makeMatch({ id: "estavel-c", rel: 82, itens: 30, queixas: ["sono"] }),
    makeMatch({ id: "sem-contagem", rel: 100, itens: 20, queixas: ["sono"] }),
  ];
  delete matches[3].scale.verifiedItemCount;
  matches[3].scale.description = "Carga não conferida";
  const context = { selectedQueixas: ["sono"], ageMonths: 96, selectedSignals: [] };
  const first = podiumIds(selectPodium(matches, null, context));
  const second = podiumIds(selectPodium(matches, null, context));
  assert.deepEqual(second, first, "mesma entrada deve produzir ordem estável");
  assert.ok(!first.includes("sem-contagem"), "carga desconhecida não entra no trio fechado");
}

// ── 6. Uma dupla melhor não pode ser desfeita para completar três selos ────
// Cenário real equivalente ao AHSD: uma candidata longa (66) cabe com a âncora
// funcional (24), mas não ao lado das duas primeiras medalhas (20 + 20).
{
  const matches = [
    makeMatch({ id: "generica-ouro", rel: 99, itens: 20, queixas: ["altas-habilidades"] }),
    makeMatch({ id: "generica-prata", rel: 98, itens: 20, queixas: ["altas-habilidades"] }),
    makeMatch({ id: "eaf", rel: 70, itens: 24, queixas: ["funcionalidade"] }),
    makeMatch({
      id: "ahsd-especifica",
      rel: 50,
      itens: 66,
      queixas: ["altas-habilidades"],
      signalTags: ["super inteligente"],
    }),
  ];
  const podium = selectPodium(matches, null, {
    selectedQueixas: ["altas-habilidades"],
    ageMonths: 90,
    selectedSignals: ["super inteligente"],
  });
  const ids = podiumIds(podium);
  assert.ok(ids.includes("ahsd-especifica"), `a dupla viável deve preservar o sinal (veio: ${ids.join(", ")})`);
  assert.ok(ids.includes("eaf"), "a âncora funcional compatível deve permanecer");
  assert.ok(podiumTotal(podium) <= PODIUM_QUESTION_CAP);
}

console.log("✓ passes pós-teto do pódio (sinal + curadoria) travados por fixtures");
