import { AGE_BANDS, OBS10_VERSION, OUTCOMES, PHASES, clock, type Outcome } from "./protocol";

export interface SessionContext {
  code: string;
  chronologicalMonths: number;
  correctedMonths: number | null;
  bandId: string;
  schooling: string;
  language: string;
  adaptations: string;
  conditions: string;
  familyReport: string;
  proneAllowed: boolean;
}
export interface Observation {
  id: string;
  phase: number;
  task: string;
  response: string;
  outcome: Outcome | "";
  assistance: string;
  quality: "" | "Nítido" | "Parcial" | "Não avaliável";
  clip: string;
  videoTime: string;
  applicationSecond: number;
}
export interface SessionRecord {
  version: string;
  context: SessionContext;
  observations: Observation[];
  durationSeconds: number;
  endReason: string;
  encodingSecond: number | null;
  recallSecond: number | null;
  recording: string;
}
export function parseAge(years: string, months: string): number | null {
  if (!/^\d+$/.test(years) || !/^\d+$/.test(months)) return null;
  const y = Number(years), m = Number(months);
  return y >= 0 && y <= 17 && m >= 0 && m <= 11 ? y * 12 + m : null;
}
export function validCorrectedAge(chronological: number | null, corrected: string, enabled: boolean): boolean {
  if (!enabled) return true;
  return chronological !== null && chronological < 24 && /^\d+$/.test(corrected)
    && Number(corrected) >= 0 && Number(corrected) <= chronological;
}
export function emptyObservation(id: string, phase: number, second: number): Observation {
  return { id, phase, task: "", response: "", outcome: "", assistance: "", quality: "", clip: "", videoTime: "", applicationSecond: second };
}
export function usableObservation(o: Observation): boolean {
  return Boolean(o.task.trim() && o.response.trim() && o.outcome);
}
export function exportFilename(code: string, extension: "txt" | "json" | "webm" | "mp4"): string {
  const safe = code.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 32) || "sem-codigo";
  return `OBS10-${safe}.${extension}`;
}
const textOrMissing = (s: string) => s.trim() || "Não informado";
export function makeReport(record: SessionRecord): string {
  const { context: c, observations } = record;
  const band = AGE_BANDS.find((b) => b.id === c.bandId);
  const lines = [
    `NEUROPED OBS-10 · v${OBS10_VERSION}`,
    "REGISTRO OBSERVACIONAL PARA REVISÃO MÉDICA — NÃO É LAUDO NEM DIAGNÓSTICO",
    `Código: ${textOrMissing(c.code)}`,
    `Idade cronológica: ${c.chronologicalMonths} meses | Corrigida: ${c.correctedMonths === null ? "não utilizada" : `${c.correctedMonths} meses, informada pela equipe`}`,
    `Ficha aplicada: ${band?.label ?? "Não informada"}`,
    `Escolaridade: ${textOrMissing(c.schooling)} | Idioma/comunicação: ${textOrMissing(c.language)}`,
    `Adaptações e apoios: ${textOrMissing(c.adaptations)}`,
    `Condições do dia e medicação/horário informados: ${textOrMissing(c.conditions)}`,
    `Prono autorizado pela equipe: ${c.proneAllowed ? "sim, apenas se acordado e tolerado" : "não; omitir posicionamento de bruços"}`,
    `Duração da aplicação: ${clock(record.durationSeconds)}. Encerramento: ${record.endReason || "em andamento"}.`,
    `Captação: ${record.recording}`,
    "Os horários do cronômetro são da aplicação, não comprovam um trecho de vídeo. Clipe/tempo abaixo são referências digitadas pela aplicadora, ainda não verificadas.",
    "",
  ];
  PHASES.forEach((p, index) => {
    lines.push(`${index + 1}. ${p.title.toUpperCase()}`);
    const entries = observations.filter((o) => o.phase === index && (o.task.trim() || o.response.trim() || o.outcome));
    if (!entries.length) lines.push("Sem registro de aplicação; não concluir que a habilidade está ausente ou preservada.");
    entries.forEach((o) => {
      lines.push(`Tarefa: ${textOrMissing(o.task)}`, `Fato/resposta literal: ${textOrMissing(o.response)}`,
        `Resposta: ${OUTCOMES.find((x) => x.id === o.outcome)?.label ?? "Não classificada"}`,
        `Ajuda/adaptação/motivo da não aplicação: ${textOrMissing(o.assistance)}`,
        `Qualidade referida pela aplicadora: ${o.quality || "Não verificada"}`,
        `Referência audiovisual informada: clipe ${textOrMissing(o.clip)} · ${textOrMissing(o.videoTime)}`,
        `Registro iniciado aos ${clock(o.applicationSecond)} da aplicação.`,
        ...(usableObservation(o) ? [] : ["Registro incompleto: completar tarefa, fato e categoria antes da revisão clínica."]));
    });
    lines.push("");
  });
  const interval = record.encodingSecond !== null && record.recallSecond !== null && record.recallSecond >= record.encodingSecond
    ? `${record.recallSecond - record.encodingSecond} segundos` : "não medido";
  if (c.chronologicalMonths >= 72) lines.push(`Intervalo entre registro inicial e evocação marcado pela aplicadora: ${interval}. Interpretar somente se o registro inicial foi documentado.`, "");
  lines.push("RELATO DO RESPONSÁVEL — NÃO É ACHADO OBSERVADO", textOrMissing(c.familyReport), "",
    "ALCANCE E LIMITES", "Resumo montado exclusivamente a partir dos registros da aplicadora. Nenhuma análise automática de vídeo, inferência diagnóstica, escore, percentil ou idade cognitiva foi realizada.",
    "Força segmentar, tônus, reflexos, sensibilidade e exame neurológico completo não foram examinados por este roteiro. Ausência de alteração na amostra não exclui dificuldade clínica.",
    "A assistente registra. O médico verifica as evidências, interpreta e decide. Risco e conteúdos sensíveis exigem atendimento presencial/confidencial, não espera por IA.",
    "Dr. Jadson Fraga · Neuropediatra · CRM-PE 25227 · RQE 17756");
  return lines.join("\n");
}
