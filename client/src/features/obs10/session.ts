import type { EvidenceBundle } from "./evidence";
import type { PilotRecord } from "./pilot";
import { AGE_BANDS, OUTCOMES, PHASES, clock, type Outcome } from "./protocol";

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
  missingMaterials?: string[];
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
  modelInInstruction?: boolean;
  recordedAfterEnd?: boolean;
  editedAfterEnd?: boolean;
}
export interface HandoffReview {
  recordsReviewed: boolean;
  mediaReviewed: boolean;
  filesChecked: boolean;
  declaredAt: string | null;
}
export const emptyHandoff = (): HandoffReview => ({ recordsReviewed: false, mediaReviewed: false, filesChecked: false, declaredAt: null });
export interface SessionRecord {
  version: string;
  sessionId?: string;
  context: SessionContext;
  observations: Observation[];
  durationSeconds: number;
  endReason: string;
  encodingSecond: number | null;
  recallSecond: number | null;
  recording: string;
  sourceRecording?: string;
  importedForReview?: boolean;
  handoff?: HandoffReview;
  evidence?: EvidenceBundle;
  pilot?: PilotRecord;
}
export function parseAge(years: string, months: string): number | null {
  if (!/^\d+$/.test(years) || !/^\d+$/.test(months)) return null;
  const y = Number(years), m = Number(months);
  return y >= 0 && y <= 17 && m >= 0 && m <= 11 ? y * 12 + m : null;
}
/** Completed months between two ISO dates (yyyy-mm-dd); null when either date is invalid or the reference precedes the birth. The dates are never stored. */
export function monthsBetween(birthISO: string, referenceISO: string): number | null {
  const parse = (iso: string) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso); if (!m) return null; const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])); return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3] ? d : null; };
  const birth = parse(birthISO), ref = parse(referenceISO);
  if (!birth || !ref || ref < birth) return null;
  let months = (ref.getUTCFullYear() - birth.getUTCFullYear()) * 12 + ref.getUTCMonth() - birth.getUTCMonth();
  if (ref.getUTCDate() < birth.getUTCDate()) months -= 1;
  return months;
}
export function validCorrectedAge(chronological: number | null, corrected: string, enabled: boolean): boolean {
  if (!enabled) return true;
  return chronological !== null && chronological < 24 && /^\d+$/.test(corrected)
    && Number(corrected) >= 0 && Number(corrected) <= chronological;
}
export function emptyObservation(id: string, phase: number, second: number): Observation {
  return { id, phase, task: "", response: "", outcome: "", assistance: "", quality: "", clip: "", videoTime: "", applicationSecond: second };
}
export function observationIssues(o: Observation): string[] {
  const issues: string[] = [];
  if (!o.task.trim()) issues.push("Informe a tarefa.");
  if (!o.response.trim()) issues.push("Descreva o fato ou a limitação; não complete por suposição.");
  if (!o.outcome) issues.push("Selecione a categoria observada.");
  if (["V", "M", "A", "NA"].includes(o.outcome) && !o.assistance.trim()) issues.push("Descreva repetição, ajuda, adaptação ou motivo da não aplicação.");
  if (o.outcome && o.outcome !== "NA" && !o.quality) issues.push("Confira a qualidade audiovisual ou marque não avaliável.");
  if (o.videoTime.trim() && !/^(?:[0-5]?[0-9]):[0-5][0-9]$/.test(o.videoTime.trim())) issues.push("Use minuto:segundo, por exemplo 01:20; não use horário da aplicação como trecho verificado.");
  if (o.videoTime.trim() && !o.clip.trim()) issues.push("Identifique o clipe ao informar um tempo no vídeo.");
  return issues;
}
export function usableObservation(o: Observation): boolean {
  return observationIssues(o).length === 0;
}
/** Editing a description later must not erase the original application timestamp. */
export function amendObservation(o: Observation, patch: Partial<Observation>, afterEnd: boolean): Observation {
  return { ...o, ...patch, id: o.id, phase: o.phase, applicationSecond: o.applicationSecond,
    recordedAfterEnd: o.recordedAfterEnd, editedAfterEnd: afterEnd || o.editedAfterEnd };
}
export function exportFilename(code: string, extension: "txt" | "json" | "md" | "webm" | "mp4", sessionId = ""): string {
  const safe = code.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 32) || "sem-codigo";
  const suffix = sessionId.replace(/[^a-zA-Z0-9-]/g, "").slice(0, 45);
  return `OBS10-${safe}${suffix ? `-${suffix}` : ""}.${extension}`;
}
const textOrMissing = (s: string) => s.trim() || "Não informado";
export function makeReport(record: SessionRecord): string {
  const { context: c, observations } = record;
  const band = AGE_BANDS.find((b) => b.id === c.bandId);
  const lines = [
    `NEUROPED OBS-10 · v${record.version}`,
    "REGISTRO OBSERVACIONAL PARA REVISÃO MÉDICA — NÃO É LAUDO NEM DIAGNÓSTICO",
    `Código: ${textOrMissing(c.code)}`,
    `Sessão: ${record.sessionId || "Não informada (registro anterior)"}`,
    `Materiais ausentes referidos: ${c.missingMaterials?.join(", ") || "Nenhum informado"}`,
    `Idade cronológica: ${c.chronologicalMonths} meses | Corrigida: ${c.correctedMonths === null ? "não utilizada" : `${c.correctedMonths} meses, informada pela equipe`}`,
    `Ficha aplicada: ${band?.label ?? "Não informada"}`,
    `Escolaridade: ${textOrMissing(c.schooling)} | Idioma/comunicação: ${textOrMissing(c.language)}`,
    `Adaptações e apoios: ${textOrMissing(c.adaptations)}`,
    `Condições do dia e medicação/horário informados: ${textOrMissing(c.conditions)}`,
    `Prono autorizado pela equipe: ${c.proneAllowed ? "sim, apenas se acordado e tolerado" : "não; omitir posicionamento de bruços"}`,
    `Duração da aplicação: ${clock(record.durationSeconds)}. Encerramento: ${record.endReason || "em andamento"}.`,
    `Captação: ${record.recording}`,
    ...(record.importedForReview ? ["JSON reaberto apenas para revisão. O JSON não reabre vídeo. Arquivos associados separadamente e posições do reprodutor constam na seção de evidências; não houve transmissão ou análise automática.", `Captação descrita no registro de origem (não verificada nesta sessão): ${record.sourceRecording || "Não informada"}`] : []),
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
        o.recordedAfterEnd ? "Anotação realizada após o encerramento; não atribuir este horário à execução da tarefa." : `Registro iniciado aos ${clock(o.applicationSecond)} da aplicação.`,
        ...(o.editedAfterEnd ? ["Descrição complementada ou corrigida após a coleta; o horário e a origem da anotação inicial foram preservados."] : []),
        ...(o.modelInInstruction ? ["Esta tarefa inclui modelo na proposta inicial; não confundir cópia/execução após modelo previsto com produção espontânea."] : []),
        ...observationIssues(o).map((issue) => `Registro incompleto: ${issue}`));
    });
    lines.push("");
  });
  const interval = record.encodingSecond !== null && record.recallSecond !== null && record.recallSecond >= record.encodingSecond
    ? `${record.recallSecond - record.encodingSecond} segundos` : "não medido";
  if (c.chronologicalMonths >= 72) lines.push(`Intervalo entre registro inicial e evocação marcado pela aplicadora: ${interval}. Interpretar somente se o registro inicial foi documentado.`, "");
  const h = record.handoff;
  lines.push("CONFERÊNCIA DECLARADA PELA APLICADORA — NÃO É RECIBO DE ENVIO",
    `Registros/blocos revistos: ${h?.recordsReviewed ? "declarado" : "não declarado"}. Áudio/enquadramento ou indisponibilidade conferidos: ${h?.mediaReviewed ? "declarado" : "não declarado"}. Destino e arquivos disponíveis antes do fechamento: ${h?.filesChecked ? "declarado" : "não declarado"}.`,
    h?.declaredAt ? `Fechamento para encaminhamento declarado em ${h.declaredAt} (horário do dispositivo, não autenticado). Os arquivos finais são reexportados e confirmados fora deste JSON. Não comprova recebimento, arquivamento ou revisão médica.` : "Fechamento para encaminhamento não declarado nesta revisão.", "");
  lines.push("RELATO DO RESPONSÁVEL — NÃO É ACHADO OBSERVADO", textOrMissing(c.familyReport), "",
    "ALCANCE E LIMITES", "Observações transcritas dos registros da aplicadora; eventuais comentários profissionais são identificados em seção separada. Nenhuma análise automática de vídeo, inferência diagnóstica, escore, percentil ou idade cognitiva foi realizada.",
    "Força segmentar, tônus, reflexos, sensibilidade e exame neurológico completo não foram examinados por este roteiro. Ausência de alteração na amostra não exclui dificuldade clínica.",
    "A assistente registra. O médico verifica as evidências, interpreta e decide. Risco e conteúdos sensíveis exigem atendimento presencial/confidencial, não espera por IA.",
    "Dr. Jadson Fraga · Neuropediatra · CRM-PE 25227 · RQE 17756");
  return lines.join("\n");
}
