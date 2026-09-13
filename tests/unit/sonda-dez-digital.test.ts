import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  DIGITAL_BANDS,
  DIGITAL_VERSION,
  DOGS15,
  DOGS20,
  DOT_GRID,
  SYMBOL_GRID,
  digitalBandForMonths,
  physicalFieldReason,
} from "../../client/src/data/sondaDezDigital";
import { SONDA_DEZ_PROTOCOL } from "../../client/src/data/sondaDezProtocol";
import {
  buildDigitalReport,
  withRunHistory,
  emptyRecord,
  fieldValid,
  gridMetrics,
  recordedGridMetrics,
  markMissionUnavailable,
  recordProblems,
  sequenceMetrics,
  timingAdvance,
  type DigitalRecord,
} from "../../client/src/lib/sondaDezSession";
const context = {
  code: "SYNTHETIC",
  operator: "OPERADOR-TESTE",
  ageMonths: 36,
  school: "fictícia",
  confounders: [],
  flags: [],
  elapsedSeconds: 120,
};

test("42 missões / 76 etapas cobrem as seis trilhas sem alterar a fonte presencial", () => {
  assert.equal(DIGITAL_BANDS.length, 6);
  assert.equal(DIGITAL_BANDS.flatMap((b) => b.missions).length, 42);
  assert.equal(
    DIGITAL_BANDS.flatMap((b) => b.missions.flatMap((m) => m.steps)).length,
    76,
  );
  for (const [i, band] of DIGITAL_BANDS.entries()) {
    assert.deepEqual(
      band.missions.map((m) => m.id),
      SONDA_DEZ_PROTOCOL[i].missions.map((m) => m.id),
    );
    for (const mission of band.missions) {
      for (const step of mission.steps) {
        assert.ok(step.say.trim());
        assert.ok(step.do.trim());
        assert.ok(step.observe.trim());
        assert.ok(step.activity.kind);
      }
      assert.ok(mission.digitalLimit.includes("Não equivale"));
    }
  }
  assert.equal(
    SONDA_DEZ_PROTOCOL[2].missions
      .find((m) => m.id === "b-atencao-sustentada")
      ?.fields.find((f) => f.id === "omissoes")?.max,
    15,
  );
  assert.equal(
    DIGITAL_BANDS[2].missions
      .find((m) => m.id === "b-atencao-sustentada")
      ?.fields.find((f) => f.id === "omissoes")?.max,
    5,
  );
});

test("idade inválida não é arredondada para uma trilha; limites exatos", () => {
  for (const value of [NaN, Infinity, -1, 0, 11, 216, 17.9])
    assert.equal(digitalBandForMonths(value), undefined);
  for (const [age, id] of [
    [12, "12-23m"],
    [23, "12-23m"],
    [24, "24-35m"],
    [35, "24-35m"],
    [36, "3-4a"],
    [59, "3-4a"],
    [60, "5-7a"],
    [95, "5-7a"],
    [96, "8-11a"],
    [143, "8-11a"],
    [144, "12-17a"],
    [215, "12-17a"],
  ] as const)
    assert.equal(digitalBandForMonths(age)?.id, id);
});

test("banco tem contagens reais de alvo/distrator e toda modalidade possui implementação", () => {
  assert.equal(DOGS15.length, 15);
  assert.equal(DOGS15.filter((x) => x === "cachorro").length, 5);
  assert.equal(DOGS20.length, 20);
  assert.equal(DOGS20.filter((x) => x === "cachorro").length, 6);
  assert.equal(DOT_GRID.filter((x) => x === "⊙").length, 8);
  assert.equal(SYMBOL_GRID.filter((x) => x === "★A").length, 6);
  const renderer = fs.readFileSync(
    "client/src/components/sonda-dez/SondaDigitalActivity.tsx",
    "utf8",
  );
  for (const kind of new Set(
    DIGITAL_BANDS.flatMap((b) =>
      b.missions.flatMap((m) => m.steps.map((s) => s.activity.kind)),
    ),
  ))
    assert.match(renderer, new RegExp(`spec.kind\\s*===\\s*['"]${kind}['"]`));
});

test("campos vazios/NA/contagens inválidas não viram zero ou registro revisado", () => {
  const field = {
    id: "n",
    label: "quantidade",
    kind: "count" as const,
    max: 4,
  };
  for (const value of [
    undefined,
    "",
    " ",
    "-1",
    "1.2",
    "NaN",
    "5",
    "Infinity",
    "1e2",
  ])
    assert.equal(fieldValid(field, value), false);
  assert.equal(fieldValid(field, "0"), true);
  assert.equal(fieldValid(field, "4"), true);
  assert.equal(fieldValid(field, "NA"), false);
  assert.equal(fieldValid(field, "NA", "recusou"), true);
  assert.equal(
    fieldValid(
      { id: "s", label: "s", kind: "choice", options: ["sim", "não"] },
      "inventado",
    ),
    false,
  );
  assert.ok(
    recordProblems(DIGITAL_BANDS[0].missions[0], emptyRecord()).length > 0,
  );
});

test("série interrompida não fabrica exposições nem interpreta a fração como série completa", () => {
  const events = [
    { type: "apresentado", value: "0", elapsedMs: 0 },
    { type: "toque", value: "0", elapsedMs: 250 },
    { type: "toque", value: "0", elapsedMs: 300 },
    { type: "apresentado", value: "1", elapsedMs: 2500 },
    { type: "toque", value: "1", elapsedMs: 2700 },
  ];
  assert.deepEqual(sequenceMetrics(DOGS15, "cachorro", events), {
    presented: 2,
    hits: 1,
    omissions: 0,
    commissions: 1,
    complete: false,
  });
  assert.deepEqual(timingAdvance(0, 8000, 2500, 15), {
    index: 3,
    delayed: true,
    finished: false,
  });
  assert.equal(timingAdvance(14, 37500, 2500, 15).finished, true);
});

test("marcar, desmarcar e tocar repetidamente não duplica alvos; omissões usam alvos reais", () => {
  assert.deepEqual(gridMetrics(["⊙", "○", "⊙"], "⊙", [0, 0, 1]), {
    hits: 1,
    omissions: 1,
    commissions: 1,
  });
  assert.deepEqual(gridMetrics(["⊙", "○", "⊙"], "⊙", [0, 2]), {
    hits: 2,
    omissions: 0,
    commissions: 0,
  });
  assert.deepEqual(gridMetrics(["⊙", "○", "⊙"], "⊙", [0, 99, -1]), {
    hits: 1,
    omissions: 1,
    commissions: 0,
  });
});

test("NA exige motivo, mantém eventos e não atribui avaliação de objeto real à tela", () => {
  const mission = DIGITAL_BANDS[0].missions.find(
    (m) => m.id === "a1-brincadeira",
  )!;
  const initial = emptyRecord();
  initial.runs[0] = {
    status: "interrupted",
    events: [{ type: "objeto-tocado", value: "bebe", elapsedMs: 40 }],
    elapsedMs: 50,
    reason: "recusa",
  };
  assert.deepEqual(markMissionUnavailable(mission, initial, ""), initial);
  const record = markMissionUnavailable(mission, initial, "Recusou a tela");
  record.reviewed = true;
  assert.equal(record.runs[0].events.length, 1);
  assert.deepEqual(recordProblems(mission, record), []);
  record.values.funcional = "E";
  assert.ok(
    recordProblems(mission, record).some((p) => p.includes("presencial")),
  );
  assert.ok(physicalFieldReason(mission.id, "funcional"));
});

test("completude verifica a apresentação real das séries e o tempo das grades", () => {
  const mission = DIGITAL_BANDS[2].missions.find(
    (m) => m.id === "b-atencao-sustentada",
  )!;
  const record = markMissionUnavailable(
    mission,
    emptyRecord(),
    "condição não avaliável",
  );
  record.reviewed = true;
  record.runs[1] = { status: "complete", events: [], elapsedMs: 2000 };
  assert.ok(recordProblems(mission, record).some((p) => p.includes("série")));
  const grid = DIGITAL_BANDS[4].missions.find((m) => m.id === "d-atencao")!;
  const record2 = markMissionUnavailable(
    grid,
    emptyRecord(),
    "condição não avaliável",
  );
  record2.reviewed = true;
  record2.runs[0] = {
    status: "complete",
    events: [{ type: "grade-concluida", value: "{}", elapsedMs: 10 }],
    elapsedMs: 10,
  };
  assert.ok(recordProblems(grid, record2).some((p) => p.includes("tempo")));
});

test("registro parcial preserva lacunas e não produz síntese interpretativa", () => {
  const text = buildDigitalReport(DIGITAL_BANDS[2], {}, context);
  assert.match(text, /registro parcial; sem síntese interpretativa/);
  assert.match(text, /DADO AUSENTE/);
  assert.doesNotMatch(text, /Como ler:/);
  assert.match(text, new RegExp(DIGITAL_VERSION.replaceAll(".", "\\.")));
  assert.match(text, /sem normas, percentis/);
});

test("registro com NA continua explícito, sem diagnóstico e sem transformar repetição zero em falta de habilidade", () => {
  const band = DIGITAL_BANDS[2];
  const records: Record<string, DigitalRecord> = {};
  for (const mission of band.missions) {
    records[mission.id] = markMissionUnavailable(
      mission,
      emptyRecord(),
      "sem condição nesta oportunidade",
    );
    records[mission.id].reviewed = true;
  }
  let text = buildDigitalReport(band, records, context);
  assert.match(text, /registro preenchido com campos não avaliáveis/);
  assert.match(text, /NA — sem condição/);
  const m = band.missions.find((m) => m.id === "b-receptivo")!;
  records[m.id].values.repetir = "0";
  records[m.id].notes = "Este campo foi observado antes da interrupção.";
  records[m.id].runs[0] = { status: "complete", events: [], elapsedMs: 5000 };
  text = buildDigitalReport(band, records, context);
  assert.match(text, /Precisou repetir: 0\.\nDescrição da aplicadora: 0\./);
});

test("todas as etapas não avaliáveis impedem resposta ou zero, mesmo com nota", () => {
  const mission = DIGITAL_BANDS[3].missions[1];
  const record = markMissionUnavailable(mission, emptyRecord(), "Recusou");
  record.reviewed = true;
  record.notes = "Nenhuma oportunidade válida";
  record.values.ordem1 = "0";
  assert.ok(
    recordProblems(mission, record).some((p) => p.includes("Nenhuma etapa")),
  );
  record.values.ordem1 = "NA";
  assert.deepEqual(recordProblems(mission, record), []);
});

test("P exige descrição da ajuda e exploração exige o tempo previsto", () => {
  const mission = DIGITAL_BANDS[0].missions.find((m) => m.id === "a1-ajuda")!;
  const record = markMissionUnavailable(mission, emptyRecord(), "Parcial");
  record.reviewed = true;
  record.runs[0] = { status: "complete", events: [], elapsedMs: 100 };
  record.values[mission.fields.find((field) => field.options?.includes("P"))!.id] = "P";
  const issues = recordProblems(mission, record);
  assert.ok(issues.some((p) => p.includes("tempo previsto")));
  assert.ok(issues.some((p) => p.includes("registro P")));
  record.runs[0].elapsedMs = 30000;
  record.notes =
    "Repeti a instrução uma vez; a criança respondeu após a repetição.";
  assert.ok(
    !recordProblems(mission, record).some((p) =>
      /tempo previsto|registro P/.test(p),
    ),
  );
  assert.deepEqual(recordProblems(mission, record), []);
});

test("conferência da grade deriva seleções finais e não transforma evento ausente em zero", () => {
  const run = {
    status: "complete" as const,
    elapsedMs: 60000,
    events: [
      {
        type: "grade-concluida",
        value: JSON.stringify({ selected: [0, 1] }),
        elapsedMs: 60000,
      },
    ],
  };
  assert.deepEqual(recordedGridMetrics(["A", "B", "A"], "A", run), {
    hits: 1,
    omissions: 1,
    commissions: 1,
  });
  assert.equal(
    recordedGridMetrics(["A"], "A", { ...run, events: [] }),
    undefined,
  );
  assert.equal(
    recordedGridMetrics(["A"], "A", { ...run, status: "interrupted" }),
    undefined,
  );
});

test("referências da regra cobrem cada cartão e orientação silenciosa não vira fala", () => {
  for (const band of DIGITAL_BANDS)
    for (const mission of band.missions)
      for (const step of mission.steps) {
        if (step.activity.responseRule)
          for (const item of step.activity.items ?? [])
            assert.ok(step.activity.responseRule[item]);
        if (/^(Aguarde|Chame o nome)/.test(step.say))
          assert.equal(step.silent, true);
      }
});

test("modalidade não introduz persistência clínica, imagens remotas, gravação ou reconhecimento automático", () => {
  const files = [
    "client/src/components/sonda-dez/SondaDigitalGuided.tsx",
    "client/src/components/sonda-dez/SondaDigitalActivity.tsx",
    "client/src/components/sonda-dez/SondaDigitalArt.tsx",
    "client/src/lib/sondaDezSession.ts",
    "client/src/lib/sondaDezAudio.ts",
  ];
  for (const path of files) {
    const source = fs.readFileSync(path, "utf8");
    assert.doesNotMatch(
      source,
      /localStorage|sessionStorage|indexedDB|fetch\(|getUserMedia|MediaRecorder|https?:\/\//,
    );
  }
  const audio = fs.readFileSync(files[4], "utf8");
  assert.match(audio, /context.close/);
  assert.match(audio, /context.state/);
});

test("reapresentação preserva tentativas anteriores sem somar seus toques à série atual", () => {
  const first = {
    status: "interrupted" as const,
    events: [
      { type: "apresentado", value: "0", elapsedMs: 0 },
      { type: "toque", value: "0", elapsedMs: 100 },
    ],
    elapsedMs: 2000,
    reason: "aplicadora pausou",
  };
  const next = {
    status: "complete" as const,
    events: [
      { type: "apresentado", value: "0", elapsedMs: 0 },
      { type: "serie-concluida", value: "1", elapsedMs: 2500 },
    ],
    elapsedMs: 2600,
  };
  const combined = withRunHistory(first, next);
  assert.equal(combined.previousRuns?.length, 1);
  assert.deepEqual(combined.previousRuns?.[0].events, first.events);
  assert.equal(
    sequenceMetrics(["cachorro"], "cachorro", combined.events).hits,
    0,
  );
  assert.equal(
    sequenceMetrics(["cachorro"], "cachorro", combined.events).omissions,
    1,
  );
  const band = DIGITAL_BANDS[0];
  const records = {
    [band.missions[0].id]: { ...emptyRecord(), runs: { 0: combined } },
  };
  assert.match(
    buildDigitalReport(band, records, context),
    /Reapresentação: 1 tentativa/,
  );
  assert.match(
    buildDigitalReport(band, records, context),
    /Evento anterior 100ms: toque/,
  );
});
