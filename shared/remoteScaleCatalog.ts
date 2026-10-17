// remoteScaleCatalog.ts — allowlist EXPLÍCITA de escalas seguras para
// preenchimento remoto e não supervisionado pela família, em casa.
//
// Fronteira de segurança clínica (decisão deliberada, não default técnico):
// só entram aqui instrumentos de AUTORRELATO ou RELATO POR PAIS/CUIDADOR,
// sem item de risco de autolesão/suicídio explícito, que já são rotina de
// aplicação "para casa" na prática pediátrica (questionários breves de
// triagem). NUNCA incluir aqui:
//   - escalas clínico-administradas/observacionais (ex.: Viking Speech,
//     Mini-MACS, BFMF — respondent "Clínico"/"Clínico (com pais/cuidador)");
//   - instrumentos de rastreio ativo de risco de suicídio/autolesão (C-SSRS
//     e similares) — esses exigem entrevista conduzida por profissional;
//   - testes cognitivos/neuropsicológicos de aplicação direta (WISC, Leiter,
//     Raven, Bayley...) — exigem examinador treinado.
// Extensão da lista é decisão do clínico responsável, revisando cada item.
//
// Reutiliza literalmente o texto das escalas já publicadas no acervo do app
// (client/src/data) — nunca inventa item, opção ou pontuação.
import { getInteractiveScale } from "../client/src/data/interactiveScales";

export const REMOTE_SCALE_IDS = [
  "q-chat-10",
  "psc17",
  "ari",
  "gad7ped",
  "smfq",
] as const;

export type RemoteScaleId = (typeof REMOTE_SCALE_IDS)[number];

export function isRemoteScaleId(value: unknown): value is RemoteScaleId {
  return (
    typeof value === "string" &&
    (REMOTE_SCALE_IDS as readonly string[]).includes(value)
  );
}

export interface RemoteScaleOption {
  label: string;
}

export interface RemoteScaleItem {
  text: string;
  emoji?: string;
  example?: string;
  options: RemoteScaleOption[];
}

export interface RemoteScaleDescriptor {
  id: RemoteScaleId;
  name: string;
  fullName: string;
  instructions: string;
  /** Faixa etária/quem responde — só texto informativo, nunca dado do paciente. */
  ageLabel: string;
  respondent: string;
  items: RemoteScaleItem[];
}

/**
 * Escalas que SAÍRAM do envio remoto (licenciadas, retiradas do app em 17/10/2026). Convite novo não é
 * aceito e link pendente recebe aviso de retirada; respostas já enviadas continuam legíveis por número do
 * item, sem o texto do instrumento, que não fica mais no app. O CHECK do D1 (migração 0021) segue aceitando
 * o id por causa desse histórico.
 */
export const RETIRED_REMOTE_SCALES: Readonly<Record<string, { name: string; itemCount: number; options: readonly string[] }>> = {
  mchat: { name: "Registro M-CHAT-R (retirado do app)", itemCount: 20, options: ["Sim", "Não"] },
};

export function isRetiredRemoteScaleId(value: unknown): boolean {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(RETIRED_REMOTE_SCALES, value);
}

/** Respostas já enviadas de escala retirada: "Item N" → opção escolhida. */
export function decodeRetiredRemoteAnswers(scaleId: string, answers: readonly number[]): Array<{ label: string; value: string }> {
  const retired = isRetiredRemoteScaleId(scaleId) ? RETIRED_REMOTE_SCALES[scaleId] : undefined;
  if (!retired) return [];
  return Array.from({ length: retired.itemCount }, (_, index) => ({
    label: `Item ${index + 1}`,
    value: retired.options[answers[index]] ?? "—",
  }));
}

function buildFromInteractiveScale(id: RemoteScaleId): RemoteScaleDescriptor | null {
  const scale = getInteractiveScale(id);
  if (!scale) return null;
  return {
    id,
    name: scale.name,
    fullName: scale.fullName,
    instructions: scale.instructions,
    ageLabel: scale.ageLabel,
    respondent: scale.respondent,
    // Nunca expõe `value` (peso da pontuação) nem `bands` (interpretação) à
    // família — só o profissional revisa e interpreta as respostas.
    items: scale.items.map((item) => ({
      text: item.text,
      emoji: item.emoji,
      example: item.example,
      options: item.options.map((option) => ({ label: option.label })),
    })),
  };
}

export function getRemoteScaleDescriptor(
  id: string,
): RemoteScaleDescriptor | null {
  if (!isRemoteScaleId(id)) return null;
  return buildFromInteractiveScale(id);
}

/** Só o essencial para listas/seletor no lado profissional (sem os itens). */
export const REMOTE_SCALE_SUMMARIES: ReadonlyArray<{
  id: RemoteScaleId;
  name: string;
  fullName: string;
}> = REMOTE_SCALE_IDS.map((id) => {
  const descriptor = getRemoteScaleDescriptor(id);
  return {
    id,
    name: descriptor?.name ?? id,
    fullName: descriptor?.fullName ?? id,
  };
});

export const remoteScaleRespondentKinds = ["family", "patient"] as const;
export type RemoteScaleRespondentKind =
  (typeof remoteScaleRespondentKinds)[number];
export function isRemoteScaleRespondentKind(
  value: unknown,
): value is RemoteScaleRespondentKind {
  return (
    typeof value === "string" &&
    (remoteScaleRespondentKinds as readonly string[]).includes(value)
  );
}

export const REMOTE_SCALE_CONSENT_VERSION = "remote-scale-v1-2026-09-04";
export const REMOTE_SCALE_CONSENT_NOTICE =
  "Autorizo o envio destas respostas à equipe assistencial responsável para revisão profissional. Entendo que este questionário é uma triagem, não substitui consulta nem produz diagnóstico ou conduta automática.";
export const REMOTE_SCALE_SAFETY_NOTICE =
  "Este formulário não é canal de urgência nem é monitorado em tempo real. Em emergência, procure atendimento imediato ou acione o SAMU 192.";

export function remoteScaleFormId(id: RemoteScaleId): string {
  return `remote-scale:${id}:v1`;
}
