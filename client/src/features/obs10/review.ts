import { PHASES, clock } from "./protocol";
import { MATERIALS, PRACTICAL_TASKS, taskOmission } from "./practical";
import { observationIssues, type SessionRecord } from "./session";

/** Documentation coverage only; never a clinical score or an assessment of the child. */
export function reviewSession(record: SessionRecord) {
  const tasks = PRACTICAL_TASKS[record.context.bandId] ?? [];
  const months = record.context.correctedMonths ?? record.context.chronologicalMonths;
  const blocks = PHASES.map((phase, index) => {
    const expected = tasks.filter((task) => task.phase === index);
    const entries = record.observations.filter((entry) => entry.phase === index);
    return {
      index, title: phase.title, icon: phase.icon,
      recorded: entries.length,
      pending: entries.filter((entry) => observationIssues(entry).length > 0).length,
      unmarked: expected.filter((task) => !entries.some((entry) => entry.id === `guided-${task.id}`)),
      freeRecords: entries.filter((entry) => !entry.id.startsWith("guided-")).length,
    };
  });
  const warnings = record.observations.flatMap((entry) => observationIssues(entry).map((message) => ({
    id: `${entry.id}-${message}`, phase: entry.phase, task: entry.task || "Registro sem tarefa", message,
  })));
  for (const entry of record.observations) {
    const task = tasks.find((item) => `guided-${item.id}` === entry.id);
    if (!task || !entry.outcome || entry.outcome === "NA") continue;
    const missing = task.materials.filter((id) => record.context.missingMaterials?.includes(MATERIALS[id].label));
    const reason = taskOmission(task, months, record.context.proneAllowed) ?? (missing.length ? "Material necessário marcado como ausente." : null);
    if (reason) warnings.push({ id: `${entry.id}-eligibility`, phase: entry.phase, task: entry.task, message: `Conferir divergência entre preparação e registro: ${reason}` });
  }
  if (!record.context.code.trim()) warnings.push({ id: "code", phase: -1, task: "Identificação", message: "Código institucional não informado. Não use nome completo." });
  return { blocks, warnings, hasObservations: record.observations.length > 0 };
}

export function reviewText(record: SessionRecord): string {
  const { blocks, warnings } = reviewSession(record);
  const lines = ["CONFERÊNCIA OPERACIONAL DA DOCUMENTAÇÃO — NÃO É PONTUAÇÃO CLÍNICA"];
  for (const block of blocks) {
    lines.push(`${block.title}: ${block.recorded} registro(s); ${block.pending} a completar; ${block.freeRecords} livre(s).`);
    if (block.unmarked.length) lines.push(`Sem marcação guiada: ${block.unmarked.map((task) => task.title).join("; ")}. Conferir registros livres: ausência de marcação não prova não aplicação ou incapacidade.`);
  }
  if (warnings.length) lines.push("Pendências de registro:", ...warnings.map((w) => `${w.task}: ${w.message}`));
  else lines.push("Sem pendências nos campos conferidos automaticamente. Isso não valida achados nem atesta exame completo.");
  lines.push(`Tempo de coleta registrado: ${clock(record.durationSeconds)}. Revisão posterior não acrescenta tempo nem autoriza novas tarefas.`);
  return lines.join("\n");
}
