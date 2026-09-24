import { AGE_BANDS, APPLICATION_RULES, OBS10_VERSION, OUTCOMES, PHASES, clock, type AgeBand, type Outcome } from "./protocol";
import { KITS, MATERIALS, PRACTICAL_TASKS, getTaskBudget, taskOmission, type PracticalTask } from "./practical";
import { observationIssues, type Observation, type SessionRecord } from "./session";
import { mediaClock, momentChanged, reviewChanged } from "./evidence";

/** Prose-ready wording for each category: behaviour observed, never a score. */
export const OUTCOME_PROSE: Record<Outcome, string> = {
  E: "realizou na proposta inicial, sem ajuda além da prevista",
  V: "realizou após ouvir o comando novamente",
  M: "realizou após gesto ou demonstração",
  A: "realizou com o apoio habitual descrito",
  ND: "teve oportunidade e não demonstrou neste momento",
  R: "recusou participar",
  NA: "proposta não aplicada ou não avaliável",
};
export const NOT_EXAMINED = "Força segmentar, tônus, reflexos, sensibilidade, acuidade visual e auditiva e exame neurológico completo não foram examinados por este roteiro.";
const quote = (s: string) => `«${s.trim()}»`;
const orMissing = (s: string) => s.trim() || "não informado";
const sentence = (s: string) => { const t = s.trim(); return /[.!?…»]$/.test(t) ? t : `${t}.`; };
export function ageText(months: number): string {
  const years = Math.floor(months / 12), rest = months % 12;
  const y = years ? `${years} ${years === 1 ? "ano" : "anos"}` : "";
  const m = rest || !years ? `${rest} ${rest === 1 ? "mês" : "meses"}` : "";
  return [y, m].filter(Boolean).join(" e ");
}
function bandOf(record: SessionRecord): AgeBand | undefined {
  return AGE_BANDS.find((b) => b.id === record.context.bandId);
}
function observedLines(o: Observation, prefix = "Observado"): string[] {
  const outcome = o.outcome ? OUTCOME_PROSE[o.outcome] : "categoria não marcada";
  const parts = [`${prefix}: ${outcome}.`];
  if (o.response.trim()) parts.push(`Descrição literal da aplicadora: ${quote(o.response)}`);
  if (o.assistance.trim()) parts.push(`Ajuda, adaptação ou motivo: ${quote(o.assistance)}`);
  if (o.quality) parts.push(`Qualidade do trecho referida: ${o.quality}.`);
  if (o.clip.trim() || o.videoTime.trim()) parts.push(`Referência de vídeo informada, não verificada: clipe ${orMissing(o.clip)}, ${orMissing(o.videoTime)}.`);
  parts.push(o.recordedAfterEnd ? "Anotação feita após o encerramento; não atribuir este horário à execução." : `Registro iniciado aos ${clock(o.applicationSecond)} da aplicação.`);
  if (o.editedAfterEnd) parts.push("Descrição complementada após a coleta; origem preservada.");
  if (o.modelInInstruction) parts.push("A proposta inclui demonstração: não descrever como produção espontânea.");
  const issues = observationIssues(o);
  if (issues.length) parts.push(`Registro incompleto: ${issues.join(" ")}`);
  return [parts.join(" ")];
}
function proposalLine(task: PracticalTask, record: SessionRecord, months: number): string[] {
  const flags: string[] = [];
  if (task.model) flags.push("demonstração faz parte da proposta");
  const omission = taskOmission(task, months, record.context.proneAllowed);
  if (omission) flags.push(`omissão prevista: ${omission}`);
  const missing = task.materials.filter((id) => record.context.missingMaterials?.includes(MATERIALS[id].label)).map((id) => MATERIALS[id].label);
  if (missing.length) flags.push(`material declarado ausente: ${missing.join(", ")}`);
  const head = `- **Proposta:** ${task.title}. Comando: ${quote(task.say)}${flags.length ? ` (${flags.join("; ")})` : ""}`;
  const entry = record.observations.find((o) => o.id === `guided-${task.id}`);
  if (!entry) return [head, "  Sem observação registrada para esta proposta. Não presumir aplicação, ausência ou presença da habilidade."];
  return [head, `  ${observedLines(entry).join(" ")}`];
}
/**
 * Markdown handed to the physician's own writing assistant, outside this app.
 * Structured as the "testagem direta" input of the PRÉ law: age-anchored, behaviour-only, source-labelled, gaps explicit.
 */
export function makeDossier(record: SessionRecord): string {
  const c = record.context;
  const band = bandOf(record);
  const months = c.correctedMonths ?? c.chronologicalMonths;
  const tasks = PRACTICAL_TASKS[c.bandId] ?? [];
  const lines: string[] = [
    "# Testagem direta em pré-consulta · material para redação sob a lei PRÉ",
    `Código institucional: ${orMissing(c.code)} · Sessão: ${record.sessionId || "não informada"} · Registro v${record.version} · Gerado localmente, sem análise automática, escore ou diagnóstico.`,
    "",
    "## Instruções para quem redige",
    "1. Este material é a entrada «testagem direta com a criança na pré-consulta» da lei PRÉ. Redija em prosa corrida, na voz do neuropediatra, sem título, lista ou tabela.",
    "2. Ancore cada observação na idade e na escolaridade informadas antes de dizer o que a criança fez.",
    "3. A fonte primária é a descrição literal da aplicadora; a categoria e a ajuda apenas qualificam o comportamento observável.",
    "4. Não nomeie roteiro, aplicativo, blocos, cartões, categorias ou contagens. A referência etária calibra o grau («aquém do esperado para a idade»); não é transcrita.",
    "5. Proposta sem observação, não aplicada, não demonstrada ou recusada não vira achado: vira omissão declarada ou pendência. Nada se completa por suposição.",
    "6. Relato do responsável e comentários profissionais são fontes distintas; declare a fonte dentro da frase.",
    "7. Sem diagnóstico. Hipótese, quando houver, é investigação a realizar.",
    "",
    "## 1. Quem foi observado e em que condições",
    `- Idade cronológica: ${ageText(c.chronologicalMonths)} (${c.chronologicalMonths} meses).`,
    c.correctedMonths === null ? "- Idade corrigida: não utilizada." : `- Idade corrigida informada pelo médico: ${ageText(c.correctedMonths)} (${c.correctedMonths} meses); a leitura usa a idade corrigida.`,
    `- Escolaridade: ${orMissing(c.schooling)}.`,
    `- Idioma e comunicação: ${orMissing(c.language)}.`,
    `- Óculos, aparelho auditivo, comunicação e apoios habituais: ${orMissing(c.adaptations)}.`,
    `- Condições do dia (sono, fome, dor, doença, medicação e horário): ${orMissing(c.conditions)}.`,
    `- Posição de bruços: ${c.proneAllowed ? "autorizada pelo médico, somente acordado e tolerado" : "não autorizada; propostas em prono omitidas"}.`,
    `- Materiais declarados ausentes: ${c.missingMaterials?.length ? c.missingMaterials.join(", ") : "nenhum"}.`,
    `- Duração da observação: ${clock(record.durationSeconds)} de até 10:00. Encerramento: ${sentence(record.endReason || "em andamento")}`,
    `- Captação: ${sentence(record.recording)}`,
    ...(record.importedForReview ? [`- Registro reaberto de arquivo exportado; captação de origem declarada, não verificada: ${record.sourceRecording || "não informada"}.`] : []),
    "",
    "## 2. Referência interna da faixa (calibra a leitura; não transcrever)",
    `- Faixa de referência: ${band?.label ?? "não informada"} (${band ? `${band.min}–${band.max - 1} meses` : "sem faixa"}).`,
    `- Esperado para a faixa: ${sentence(band?.reference ?? "não informado")}`,
    `- Cuidado de interpretação: ${sentence(band?.caution ?? "não informado")}`,
    "",
    "## 3. O que foi proposto e o que a criança fez",
    "Cada proposta traz o comando dado e, quando existe, o registro da aplicadora. Os horários são do cronômetro da aplicação e não comprovam trechos de vídeo.",
  ];
  PHASES.forEach((phase, index) => {
    lines.push("", `### Bloco ${index + 1} · ${phase.title} (${clock(phase.start)}–${clock(phase.end)})`);
    for (const task of tasks.filter((t) => t.phase === index)) lines.push(...proposalLine(task, record, months));
    const free = record.observations.filter((o) => o.phase === index && !o.id.startsWith("guided-") && (o.task.trim() || o.response.trim() || o.outcome));
    for (const o of free) lines.push(`- **Registro livre da aplicadora:** ${orMissing(o.task)}.`, `  ${observedLines(o).join(" ")}`);
  });
  if (c.chronologicalMonths >= 72) {
    const interval = record.encodingSecond !== null && record.recallSecond !== null && record.recallSecond >= record.encodingSecond ? `${record.recallSecond - record.encodingSecond} segundos` : "não medido";
    lines.push("", `Memória: intervalo entre a apresentação das palavras e a evocação, marcado pela aplicadora: ${interval}. Interpretar apenas se a repetição inicial foi documentada.`);
  }
  lines.push("", "## 4. Relato do responsável (fonte distinta: entra como anamnese com a família)", orMissing(c.familyReport));
  lines.push("", "## 5. Trechos de vídeo e comentários profissionais (fonte distinta)");
  const e = record.evidence;
  if (!e || !e.moments.length) lines.push("Nenhum trecho de vídeo vinculado a tarefa. Ausência de trecho não significa normalidade nem alteração.");
  for (const m of e?.moments ?? []) {
    const o = record.observations.find((item) => item.id === m.observationId);
    lines.push(`- Trecho ${mediaClock(m.startSecond)}–${mediaClock(m.endSecond)} (${e?.clips.find((k) => k.id === m.clipId)?.label ?? "clipe"}) vinculado a «${o?.task || m.observationId}»${momentChanged(m, record.observations) ? "; o registro textual mudou depois da marcação, reconferir" : ""}.`);
    for (const r of e?.reviews.filter((x) => x.momentId === m.id) ?? []) lines.push(`  Comentário profissional (${r.decision}${r.origin === "imported-unverified" ? "; importado, autoria não autenticada" : ""}${reviewChanged(r, e!, record.observations) ? "; registro alterado desde o comentário" : ""}): ${quote(r.comment)}`);
  }
  lines.push("", "## 6. Pendências e domínios não observados");
  PHASES.forEach((phase, index) => {
    const unmarked = tasks.filter((t) => t.phase === index && !record.observations.some((o) => o.id === `guided-${t.id}`)).map((t) => t.title);
    if (unmarked.length) lines.push(`- Sem observação registrada no bloco ${index + 1} (${phase.title}): ${unmarked.join("; ")}.`);
  });
  const notShown = record.observations.filter((o) => o.outcome === "ND" || o.outcome === "R" || o.outcome === "NA");
  if (notShown.length) lines.push(`- Não demonstrado, recusado ou não aplicado: ${notShown.map((o) => `${orMissing(o.task)} (${OUTCOMES.find((x) => x.id === o.outcome)?.label})`).join("; ")}.`);
  const incomplete = record.observations.filter((o) => observationIssues(o).length);
  if (incomplete.length) lines.push(`- Registros incompletos, a esclarecer com a aplicadora: ${incomplete.map((o) => orMissing(o.task)).join("; ")}.`);
  if (record.durationSeconds < 600 && record.endReason) lines.push(`- Observação encerrada antes dos dez minutos: ${sentence(record.endReason)}`);
  lines.push(`- ${NOT_EXAMINED}`);
  lines.push("", "## 7. Limites deste material",
    "Roteiro observacional autoral não validado; sem sensibilidade, especificidade, escore, percentil, idade cognitiva ou ponto de corte. Nenhuma análise automática de vídeo, imagem ou som foi realizada.",
    "Uma amostra de até dez minutos, num dia, com um adulto pouco conhecido, não representa o funcionamento habitual. Ausência de alteração na amostra não exclui dificuldade; recusa e não demonstração não são alteração.",
    "A assistente registrou. O médico verifica as evidências, interpreta e decide. Dr. Jadson Fraga · Neuropediatra · CRM-PE 25227 · RQE 17756");
  return lines.join("\n");
}
/** Full paper script of one sheet, to read beside the camera. Plain text for isolated printing. */
export function makeScript(bandId: string, options: { proneAllowed?: boolean; months?: number } = {}): string {
  const band = AGE_BANDS.find((b) => b.id === bandId);
  if (!band) return "";
  const months = options.months ?? band.min;
  const tasks = PRACTICAL_TASKS[band.id] ?? [];
  const lines = [
    `OBS-10 v${OBS10_VERSION} · ROTEIRO COMPLETO DA FICHA ${band.label.toUpperCase()} (${band.min}–${band.max - 1} meses)`,
    "Guia da aplicadora para ler ao lado da câmera. Você aplica e registra; o médico interpreta. Não é escala nem diagnóstico.",
    "",
    "KIT, ALÉM DO DISPOSITIVO DE FILMAGEM FIXO",
    ...KITS[band.id].map(({ id, quantity }) => `- ${MATERIALS[id].label} · ${quantity ?? MATERIALS[id].quantity}. ${MATERIALS[id].detail} Substituto seguro: ${MATERIALS[id].substitute}`),
    "",
    "A CADA TAREFA",
    ...APPLICATION_RULES.map((rule, i) => `${i + 1}. ${rule}`),
    "Uma repetição verbal; uma demonstração só quando prevista. Registre a ajuda e siga. Não treine até acertar, não pressione, não retire apoios.",
    "",
    "REFERÊNCIA E CUIDADO DESTA FAIXA (para o médico; não é critério de aprovação)",
    band.reference, band.caution,
    band.min < 9 ? (options.proneAllowed ? "Prono autorizado pelo médico: somente acordado, supervisionado e tolerado." : "Prono NÃO autorizado: observe apenas a posição habitual segura.") : "",
  ];
  PHASES.forEach((phase, index) => {
    lines.push("", `BLOCO ${index + 1} · ${phase.title.toUpperCase()} · ${clock(phase.start)}–${clock(phase.end)} · ~${getTaskBudget(band.id, index)} s de tarefas`, `Como filmar: ${phase.camera}`);
    tasks.filter((t) => t.phase === index).forEach((task, n) => {
      const flags = [task.model ? "demonstração prevista" : "", task.minMonths ? `somente a partir de ${task.minMonths} meses` : "", task.prone ? "só com prono autorizado" : "", task.walking ? "só com marcha estável" : ""].filter(Boolean);
      const omission = taskOmission(task, months, Boolean(options.proneAllowed));
      lines.push("", `${index + 1}.${n + 1} ${task.title} · ~${task.seconds} s${flags.length ? ` · ${flags.join(" · ")}` : ""}`,
        `DIGA / FAÇA: ${task.say}`,
        ...task.steps.map((step, i) => `   ${i + 1}) ${step}`),
        `REGISTRE: ${task.record}`,
        task.materials.length ? `MATERIAIS: ${task.materials.map((id) => MATERIALS[id].label).join(", ")}` : "",
        omission ? `OMITIR NESTA IDADE: ${omission}` : "");
    });
    if (band.min >= 72 && (index === 2 || index === 5)) lines.push("", index === 2 ? "MEMÓRIA: ao conferir a repetição das três palavras, toque em «Marcar registro inicial agora»." : "MEMÓRIA: ao pedir as palavras, toque em «Marcar evocação agora». Sem pistas, imagens ou sílabas.");
    lines.push("", `Roteiro integral de referência do bloco: ${band.tasks[index]}`);
  });
  lines.push("", "NUNCA FAÇA: reflexos, força contra resistência, estímulo doloroso, tração pelos braços, movimentos passivos, olhos fechados, escadas, hiperventilação ou sustos. Dor, recusa persistente, tontura ou cansaço: pare a tarefa.",
    "EMERGÊNCIA: alteração de consciência, crise, dificuldade respiratória, fraqueza súbita ou risco imediato: interrompa e chame o médico. SAMU 192.",
    "Ao terminar: encerre na tela, descreva os fatos literalmente, exporte o registro e, se houver, salve o vídeo no dispositivo institucional.");
  return lines.filter((line, i, all) => line !== "" || all[i - 1] !== "").join("\n");
}
