import {
  DIGITAL_NATURE,
  DIGITAL_VERSION,
  fieldGuidance,
  physicalFieldReason,
  digitalAgeContext,
  type ActivitySpec,
  type DigitalBand,
  type DigitalMission,
} from "../data/sondaDezDigital";
import type { FieldDef } from "../data/sondaDezProtocol";

export type SondaEvent = { type: string; value: string; elapsedMs: number };
export type StepRun = {
  previousRuns?: Array<Omit<StepRun, "previousRuns">>;
  status: "complete" | "interrupted" | "skipped";
  events: SondaEvent[];
  elapsedMs: number;
  reason?: string;
};
export function withRunHistory(
  previous: StepRun | undefined,
  next: StepRun,
): StepRun {
  if (!previous) return next;
  return {
    ...next,
    previousRuns: [
      ...(previous.previousRuns ?? []),
      {
        status: previous.status,
        events: previous.events,
        elapsedMs: previous.elapsedMs,
        reason: previous.reason,
      },
    ],
  };
}

export type DigitalRecord = {
  values: Record<string, string>;
  reasons: Record<string, string>;
  notes: string;
  runs: Record<number, StepRun>;
  reviewed: boolean;
};
export const emptyRecord = (): DigitalRecord => ({
  values: {},
  reasons: {},
  notes: "",
  runs: {},
  reviewed: false,
});

export function responseOptions(spec: ActivitySpec): string[] {
  return [...new Set([
    ...(spec.prompt === "operator-only" ? spec.items ?? [] : []),
    ...Object.values(spec.responseRule ?? {}),
    ...Object.values(spec.previousRule ?? {}),
    "Outra resposta",
    ...(spec.prompt === "operator-only" ? ["Sem resposta"] : []),
    "Não observado",
  ])];
}

/** Latest explicit observation wins; absent/unobserved is never an error or zero. */
export function observedResponses(spec: ActivitySpec, run?: StepRun): Record<number, string> {
  const answers: Record<number, string> = {};
  for (const event of run?.events ?? []) {
    if (!["resposta-verbal", "resposta-observada"].includes(event.type)) continue;
    try {
      const v = JSON.parse(event.value);
      if (!Number.isInteger(v.item) || v.item < 1 || v.item > (spec.items?.length ?? 0) ||
          v.stimulus !== spec.items?.[v.item - 1] || !responseOptions(spec).includes(v.answer)) return {};
      answers[v.item - 1] = v.answer;
    } catch { return {}; }
  }
  return answers;
}

export function recordObservedResponse(spec: ActivitySpec, run: StepRun, index: number, answer: string): StepRun {
  if (run.status !== "complete" || !spec.responseRule || !Number.isInteger(index) ||
      !spec.items?.[index] || !responseOptions(spec).includes(answer)) return run;
  return {
    ...run,
    events: [...run.events, {
      type: "resposta-observada",
      value: JSON.stringify({ item: index + 1, stimulus: spec.items[index], answer, source: "conferência da aplicadora após apresentação" }),
      elapsedMs: run.elapsedMs,
    }],
  };
}

function completeSequence(spec: ActivitySpec, run?: StepRun): boolean {
  if (!run || run.status !== "complete" || !spec.items?.length) return false;
  const interval = spec.intervalMs ?? 2500;
  const shown = run.events.filter((e) => e.type === "apresentado");
  return run.elapsedMs >= spec.items.length * interval &&
    shown.length === spec.items.length &&
    shown.every((e, i) => e.value === String(i) && e.elapsedMs >= i * interval && e.elapsedMs < (i + 1) * interval) &&
    run.events.some((e) => e.type === "serie-concluida" && e.value === String(spec.items!.length) &&
      e.elapsedMs >= spec.items!.length * interval && e.elapsedMs <= run.elapsedMs);
}

type DerivedCount = { value?: number; step: number; source: string };
export function derivedCounts(mission: DigitalMission, record?: DigitalRecord): Record<string, DerivedCount> {
  const result: Record<string, DerivedCount> = {};
  mission.steps.forEach(({ activity: spec }, step) => {
    if (!spec.countFields) return;
    const run = record?.runs[step];
    let metrics: Partial<Record<"hits" | "omissions" | "commissions" | "errors" | "perseverations", number>> | undefined;
    const source = spec.responseRule ? "respostas registradas pela aplicadora" : "interações digitais registradas";
    if (spec.kind === "grid" && run) metrics = recordedGridMetrics(spec.items ?? [], spec.target ?? "", run, (spec.durationSeconds ?? 60) * 1000);
    if (spec.kind === "sequence" && run && completeSequence(spec, run)) {
      if (spec.target) {
        const validTouches = run.events.filter((e) => e.type === "toque").every((e) =>
          /^\d+$/.test(e.value) && Number(e.value) < (spec.items?.length ?? 0) &&
          e.elapsedMs >= Number(e.value) * (spec.intervalMs ?? 2500) &&
          e.elapsedMs < (Number(e.value) + 1) * (spec.intervalMs ?? 2500));
        if (validTouches) metrics = sequenceMetrics(spec.items!, spec.target, run.events);
      } else if (spec.responseRule) {
        const answers = observedResponses(spec, run);
        if (spec.items!.every((_, i) => answers[i] && answers[i] !== "Não observado")) {
          metrics = { hits: 0, omissions: 0, commissions: 0, errors: 0, perseverations: 0 };
          spec.items!.forEach((item, i) => {
            const answer = answers[i];
            const expected = spec.responseRule![item];
            if (answer === expected) metrics!.hits!++;
            else {
              metrics!.errors!++;
              if (expected === "Uma palma" && answer === "Esperar") metrics!.omissions!++;
              if (expected === "Esperar" && answer === "Uma palma") metrics!.commissions!++;
              if (spec.previousRule?.[item] === answer) metrics!.perseverations!++;
            }
          });
        }
      }
    }
    for (const [metric, field] of Object.entries(spec.countFields))
      result[field] = { step, source, value: metrics?.[metric as keyof typeof metrics] };
  });
  return result;
}

/** Recompute on every evidence change, including reopening/NA; no stale totals. */
export function synchronizeCounts(mission: DigitalMission, record: DigitalRecord): DigitalRecord {
  const values = { ...record.values };
  for (const [field, count] of Object.entries(derivedCounts(mission, record))) {
    if (values[field] === "NA") continue;
    if (count.value === undefined) delete values[field];
    else values[field] = String(count.value);
  }
  return { ...record, values };
}
export function fieldValid(
  field: FieldDef,
  value: string | undefined,
  reason?: string,
): boolean {
  if (value === "NA") return Boolean(reason?.trim());
  if (value === undefined || value.trim() === "") return false;
  if (field.kind === "count") {
    if (!/^\d+$/.test(value)) return false;
    const number = Number(value);
    return (
      Number.isSafeInteger(number) &&
      number >= 0 &&
      (field.max === undefined || number <= field.max)
    );
  }
  return field.kind === "choice"
    ? Boolean(field.options?.includes(value))
    : value.trim().length > 0;
}
export function recordProblems(
  mission: DigitalMission,
  record?: DigitalRecord,
): string[] {
  if (!record) return ["Registro não iniciado."];
  const issues: string[] = [];
  mission.steps.forEach((_, i) => {
    const run = record.runs[i];
    if (!run || run.status === "interrupted")
      issues.push(
        `Etapa ${i + 1}: não concluída; registre o motivo para não avaliar.`,
      );
    if (run?.status === "skipped" && !run.reason?.trim())
      issues.push(`Etapa ${i + 1}: motivo ausente.`);
    const activity = mission.steps[i].activity;
    if (
      run?.status === "complete" &&
      mission.steps[i].waitSeconds &&
      run.elapsedMs < mission.steps[i].waitSeconds! * 1000
    )
      issues.push(
        `Etapa ${i + 1}: observação encerrada antes do tempo previsto.`,
      );
    if (
      run?.status === "complete" &&
      activity.kind === "sequence" &&
      !completeSequence(activity, run)
    )
      issues.push(`Etapa ${i + 1}: série sem prova de apresentação completa.`);
    if (
      run?.status === "complete" &&
      activity.kind === "grid" &&
      (!run.events.some((e) => e.type === "grade-concluida") ||
        run.elapsedMs < (activity.durationSeconds ?? 60) * 1000)
    )
      issues.push(`Etapa ${i + 1}: grade encerrada antes do tempo previsto.`);
  });
  if (
    mission.steps.every((_, i) => record.runs[i]?.status === "skipped") &&
    mission.fields.some((field) => record.values[field.id] !== "NA")
  )
    issues.push(
      "Nenhuma etapa foi avaliável: mantenha os campos como NA, com motivo.",
    );
  if (Object.values(record.values).includes("P") && !record.notes.trim())
    issues.push(
      "Descreva nas notas a repetição, pista ou ajuda que levou ao registro P.",
    );
  mission.fields.forEach((field) => {
    if (!fieldValid(field, record.values[field.id], record.reasons[field.id]))
      issues.push(`${field.label}: registro ausente ou inválido.`);
    if (
      physicalFieldReason(mission.id, field.id) &&
      record.values[field.id] !== "NA"
    )
      issues.push(`${field.label}: campo presencial deve permanecer NA.`);
  });
  for (const [field, count] of Object.entries(derivedCounts(mission, record))) {
    const value = record.values[field];
    if (value === "NA") continue; // reason is checked by fieldValid above
    if (count.value === undefined)
      issues.push(`${field}: evidência incompleta na etapa ${count.step + 1}; registre as respostas observadas ou NA com motivo.`);
    else if (value !== String(count.value))
      issues.push(`${field}: contagem divergente dos eventos (esperado ${count.value}).`);
  }
  // No inferred success from a skipped or disrupted presentation.
  if (
    Object.values(record.runs).some((run) => run.status !== "complete") &&
    mission.fields.some((field) => record.values[field.id] !== "NA") &&
    !record.notes.trim()
  ) {
    issues.push(
      "Explique nas notas quais oportunidades foram válidas e quais não foram apresentadas.",
    );
  }
  if (!record.reviewed)
    issues.push("Confirme a revisão do registro da missão.");
  return issues;
}
export function markMissionUnavailable(
  mission: DigitalMission,
  record: DigitalRecord,
  reason: string,
): DigitalRecord {
  if (!reason.trim()) return record;
  return {
    ...record,
    reviewed: false,
    values: Object.fromEntries(mission.fields.map((f) => [f.id, "NA"])),
    reasons: Object.fromEntries(
      mission.fields.map((f) => [
        f.id,
        physicalFieldReason(mission.id, f.id) ?? reason.trim(),
      ]),
    ),
    runs: Object.fromEntries(
      mission.steps.map((_, i) => [
        i,
        record.runs[i]?.status === "complete"
          ? record.runs[i]
          : {
              ...record.runs[i],
              status: "skipped",
              events: record.runs[i]?.events ?? [],
              elapsedMs: record.runs[i]?.elapsedMs ?? 0,
              reason: reason.trim(),
            },
      ]),
    ),
  };
}
export function sequenceMetrics(
  items: string[],
  target: string,
  events: SondaEvent[],
) {
  const presented = new Set(
    events.filter((e) => e.type === "apresentado").map((e) => Number(e.value)),
  );
  const responses = new Set(
    events.filter((e) => e.type === "toque").map((e) => Number(e.value)),
  );
  const indices = [...presented].filter(
    (i) => Number.isInteger(i) && i >= 0 && i < items.length,
  );
  const hits = indices.filter(
    (i) => items[i] === target && responses.has(i),
  ).length;
  const omissions = indices.filter(
    (i) => items[i] === target && !responses.has(i),
  ).length;
  const commissions = indices.filter(
    (i) => items[i] !== target && responses.has(i),
  ).length;
  return {
    presented: indices.length,
    hits,
    omissions,
    commissions,
    complete:
      indices.length === items.length &&
      events.some((e) => e.type === "serie-concluida"),
  };
}
export function gridMetrics(
  items: string[],
  target: string,
  selected: number[],
) {
  const unique = [...new Set(selected)].filter(
    (i) => Number.isInteger(i) && i >= 0 && i < items.length,
  );
  return {
    hits: unique.filter((i) => items[i] === target).length,
    omissions:
      items.filter((x) => x === target).length -
      unique.filter((i) => items[i] === target).length,
    commissions: unique.filter((i) => items[i] !== target).length,
  };
}
export function recordedGridMetrics(
  items: string[],
  target: string,
  run: StepRun,
  minimumMs = 60000,
) {
  const last = run.events.findLast((e) => e.type === "grade-concluida");
  if (!last || run.status !== "complete" || run.elapsedMs < minimumMs || last.elapsedMs < minimumMs || last.elapsedMs > run.elapsedMs) return undefined;
  try {
    const value: unknown = JSON.parse(last.value);
    if (
      value &&
      typeof value === "object" &&
      "selected" in value &&
      Array.isArray(value.selected) &&
      value.selected.every((i) => Number.isInteger(i) && i >= 0 && i < items.length) &&
      new Set(value.selected).size === value.selected.length
    )
      return gridMetrics(items, target, value.selected);
  } catch {
    /* An incomplete event never becomes a zero count. */
  }
  return undefined;
}
export function timingAdvance(
  previous: number,
  elapsedMs: number,
  intervalMs: number,
  total: number,
): { index: number; delayed: boolean; finished: boolean } {
  const index = Math.floor(elapsedMs / intervalMs);
  return {
    index: Math.min(index, total),
    delayed: index > previous + 1,
    finished: index >= total,
  };
}
export function describeCode(value: string): string {
  return (
    (
      {
        E: "Surgiu espontaneamente, antes da instrução.",
        I: "Surgiu após uma instrução direta.",
        P: "Surgiu após ajuda, pista ou repetição.",
        "0": "Não demonstrado nesta oportunidade válida; não prova ausência da habilidade.",
        NA: "Não avaliável nas condições registradas.",
      } as Record<string, string>
    )[value] ?? `Descrição da aplicadora: ${value}.`
  );
}
export type ReportContext = {
  code: string;
  ageMonths: number;
  school: string;
  confounders: string[];
  flags: string[];
  operator: string;
  elapsedSeconds: number;
  familiarizations?: string[];
};
export function buildDigitalReport(
  band: DigitalBand,
  records: Record<string, DigitalRecord>,
  context: ReportContext,
): string {
  const completed = band.missions.filter(
    (m) => recordProblems(m, records[m.id]).length === 0,
  ).length;
  const allComplete = completed === band.missions.length;
  const hasNA = Object.values(records).some((r) =>
    Object.values(r.values).includes("NA"),
  );
  const lines = [
    `SONDA DEZ — MODALIDADE DIGITAL GUIADA v${DIGITAL_VERSION}`,
    DIGITAL_NATURE,
    `Estado: ${allComplete ? (hasNA ? "registro preenchido com campos não avaliáveis" : "registro preenchido para revisão médica") : "registro parcial; sem síntese interpretativa"}. Missões registradas: ${completed}/${band.missions.length}.`,
    `Código: ${context.code.trim() || "não informado"}. Idade: ${context.ageMonths} meses. Trilha: ${band.label}. Escolaridade: ${context.school.trim() || "não informada"}.`,
    ...(digitalAgeContext(context.ageMonths) ? [digitalAgeContext(context.ageMonths)] : []),
    `Aplicadora (código): ${context.operator.trim() || "não informado"}. Tempo ativo: ${context.elapsedSeconds}s; referência operacional 600s${context.elapsedSeconds > 600 ? "; tempo ampliado" : ""}.`,
    `Interferentes: ${context.confounders.join("; ") || "nenhum assinalado; não equivale a investigação negativa"}.`,
    `Alertas ao médico: ${context.flags.join("; ") || "nenhum assinalado"}.`,
    `Familiarização com controles durante a aplicação: ${context.familiarizations?.join("; ") || "não acionada"}. Eventos do ensaio não entram nas respostas das missões.`,
    "",
  ];
  band.missions.forEach((mission, index) => {
    const record = records[mission.id];
    const counts = derivedCounts(mission, record);
    lines.push(
      `${index + 1}. ${mission.title}`,
      `Limite: ${mission.digitalLimit}`,
    );
    mission.steps.forEach((s, i) => {
      const run = record?.runs[i];
      if (run?.previousRuns?.length) {
        lines.push(
          `Reapresentação: ${run.previousRuns.length} tentativa(s) anterior(es); familiaridade e ajuda podem interferir. Não tratar como primeira exposição.`,
        );
        run.previousRuns.forEach((prior, attempt) => {
          lines.push(
            `Tentativa anterior ${attempt + 1}: ${prior.status}; ${prior.reason ?? "sem motivo adicional"}.`,
            ...prior.events.map(
              (e) =>
                `  Evento anterior ${Math.round(e.elapsedMs)}ms: ${e.type} — ${e.value}`,
            ),
          );
        });
      }

      lines.push(
        `Etapa ${i + 1} — ${s.title}. Instrução: ${s.say}`,
        `Apresentação: ${run?.status === "complete" ? "concluída" : run?.status === "skipped" ? "não apresentada/concluída; " + run.reason : run?.status === "interrupted" ? "interrompida; " + run.reason : "não registrada"}.`,
        ...(run?.events.map(
          (e) =>
            `  Evento ${Math.round(e.elapsedMs)}ms: ${e.type} — ${e.value}`,
        ) ?? []),
      );
    });
    mission.fields.forEach((field) => {
      const value = record?.values[field.id];
      const count = counts[field.id];
      if (count) {
        lines.push(`${field.label} — fonte: ${count.source}; etapa ${count.step + 1}; contagem verificável: ${count.value ?? "indisponível"}.`);
        if (value !== undefined && value !== "" && value !== "NA" && value !== String(count.value)) {
          lines.push(`${field.label}: DADO INCONSISTENTE — valor informado ${value} não confirmado pelos eventos; não interpretar.`);
          return;
        }
      }
      lines.push(
        `${field.label}: ${value === undefined || value === "" ? "DADO AUSENTE" : value}${value === "NA" ? " — " + (record?.reasons[field.id] || "MOTIVO AUSENTE") : ""}.`,
      );
      if (allComplete && value !== undefined)
        lines.push(
          field.kind === "count" && value !== "NA"
            ? "Contagem bruta, sem comparação normativa."
            : value === "NA" ||
                field.options?.some((option) =>
                  ["E", "I", "P"].includes(option),
                )
              ? describeCode(value)
              : `Descrição da aplicadora: ${value}.`,
        );
    });
    lines.push(
      `Observação direta e ajudas: ${record?.notes.trim() || "não registradas"}.`,
    );
    if (allComplete) lines.push("Como ler: " + mission.reading.join(" "));
    else
      lines.push(
        "Pendências: " +
          (recordProblems(mission, record).join(" ") ||
            "nenhuma nesta missão."),
      );
    lines.push("");
  });
  lines.push(
    "Entrega à família: “Registramos como participou destas atividades e quanta ajuda precisou. O médico vai reunir estas observações com a história e as outras avaliações.”",
    "Próxima ação: entregar o registro ao médico; informar interferentes e alertas antes da interpretação. Não comunicar diagnóstico ou normalidade pela Sonda.",
    "Não há gravação de áudio/vídeo nem salvamento automático de dados clínicos nesta tela.",
  );
  return lines.join("\n");
}
export { fieldGuidance };
