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
    { selectedQueixas: ["tdah"], ageMonths: 96, selectedSignals: ["impulsividade"] },
  );
  const ids = podiumIds(podium);
  assert.ok(podiumTotal(podium) <= PODIUM_QUESTION_CAP, `teto estourou: ${podiumTotal(podium)}`);
  assert.ok(
    ids.includes("x-sinal"),
    `sinal marcado com candidata viável deve estar coberto (veio: ${ids.join(", ")})`,
  );
  console.log("✓ sob pressão combinada, teto absoluto e cobertura de sinal se mantêm");
}

console.log("✓ passes pós-teto do pódio (sinal + curadoria) travados por fixtures");
