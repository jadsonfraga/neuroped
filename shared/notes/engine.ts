import { requiredConsultationTopics, topicKeywordMap, topicLabels } from "./clinicalTaxonomy";
import type { ChecklistSuggestion, GeneratedClinicalDocuments, NoteEvidenceSource, NoteSpeakerRole, NoteTopic, TranscriptSegment } from "./types";

export function classifyTopics(text: string): NoteTopic[] {
  return Object.entries(topicKeywordMap)
    .filter(([, patterns]) => patterns.some((pattern) => pattern.test(text)))
    .map(([topic]) => topic as NoteTopic);
}

export function inferEvidenceSource(text: string, speaker: NoteSpeakerRole): NoteEvidenceSource {
  if (speaker === "medico" || /ao exame|observo|minha impressão/i.test(text)) return "observacao_medico";
  if (/relatório escolar|professor|boletim|escola informa/i.test(text)) return "documento_escolar";
  if (/relatório terapêutico|fono|terapeuta|aba/i.test(text)) return "relatorio_terapeutico";
  if (/sugere|compatível|hipótese|infer/i.test(text)) return "inferencia_ia";
  return "relato_pais";
}

export function buildChecklistSuggestions(segments: TranscriptSegment[]): ChecklistSuggestion[] {
  const covered = new Set(segments.flatMap((segment) => segment.topics));
  return requiredConsultationTopics.filter((item) => !covered.has(item.topic));
}

const RISK_TOPIC: NoteTopic = "risco_autolesao_suicidio";

/**
 * O resumo clínico normalmente mostra só os primeiros segmentos (visão geral
 * rápida), mas um relato de risco de autolesão/suicídio nunca pode ficar de
 * fora dele só porque apareceu depois do 12º segmento da consulta.
 */
function buildResumoSegments(segments: TranscriptSegment[]): TranscriptSegment[] {
  const preview = segments.slice(0, 12);
  const riskSegments = segments.filter((segment) => segment.topics.includes(RISK_TOPIC));
  if (riskSegments.length === 0) return preview;
  const seen = new Set(preview.map((segment) => segment.id));
  const merged = [...preview, ...riskSegments.filter((segment) => !seen.has(segment.id))];
  return merged.sort((a, b) => a.startMs - b.startMs);
}

export function generateClinicalDocuments(segments: TranscriptSegment[]): GeneratedClinicalDocuments {
  const byTopic = new Map<NoteTopic, TranscriptSegment[]>();
  for (const segment of segments) {
    for (const topic of segment.topics) byTopic.set(topic, [...(byTopic.get(topic) ?? []), segment]);
  }
  const section = (topic: NoteTopic) => formatSegments(byTopic.get(topic) ?? []);
  const camposPendentes = requiredConsultationTopics.map((item) => item.topic).filter((topic) => !byTopic.has(topic));
  const historia = ["queixa_principal", "hda", "gestacao", "parto", "neonatal", "desenvolvimento_motor", "desenvolvimento_linguagem", "escola", "historia_familiar"] as NoteTopic[];
  const exame = ["exame_fisico", "exame_neurologico"] as NoteTopic[];
  return {
    anamnese: historia.map((topic) => `## ${topicLabels[topic]}\n${section(topic)}`).join("\n\n"),
    evolucao: [RISK_TOPIC, "observacoes_medico", "hipoteses", "condutas", "orientacoes"].map((topic) => `## ${topicLabels[topic as NoteTopic]}\n${section(topic as NoteTopic)}`).join("\n\n"),
    pant: [`# PANT`, `## ${topicLabels[RISK_TOPIC]}\n${section(RISK_TOPIC) || "Pendente"}`, `## História organizada\n${historia.map(section).filter(Boolean).join("\n") || "Pendente"}`, `## Exame\n${exame.map(section).filter(Boolean).join("\n") || "Pendente"}`, `## Hipóteses\n${section("hipoteses") || "Pendente"}`, `## Conduta\n${section("condutas") || "Pendente"}`, `## Campos pendentes\n${camposPendentes.map((topic) => `- ${topicLabels[topic]}`).join("\n") || "Nenhum"}`].join("\n\n"),
    resumoClinico: formatSegments(buildResumoSegments(segments)),
    cartaEscola: section("informacoes_escolares") || "Modelo pendente de revisão médica antes do envio.",
    cartaTerapias: section("relatos_terapeuticos") || "Modelo pendente de revisão médica antes do envio.",
    receitaModelo: "Modelo de receita pendente de revisão, assinatura e CRM do médico.",
    solicitacoesExames: section("condutas") || "Sem solicitações registradas.",
    encaminhamentos: section("orientacoes") || "Sem encaminhamentos registrados.",
    camposPendentes,
  };
}

function formatSegments(segments: TranscriptSegment[]): string {
  return segments.map((segment) => `- [${formatMs(segment.startMs)}] (${segment.speaker}; ${segment.source}) ${segment.text}`).join("\n");
}

function formatMs(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}
