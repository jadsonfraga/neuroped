export const remoteIntakeRespondentKinds = [
  "family",
  "school",
  "therapist",
  "patient",
] as const;
export type RemoteIntakeRespondentKind = (typeof remoteIntakeRespondentKinds)[number];

export const remoteIntakeFormKinds = [
  "pre_consulta",
  "pre_retorno",
  "school_report",
] as const;
export type RemoteIntakeFormKind = (typeof remoteIntakeFormKinds)[number];

export const remoteIntakeQuestionTypes = ["short_text", "long_text", "yes_no"] as const;
export type RemoteIntakeQuestionType = (typeof remoteIntakeQuestionTypes)[number];

export interface RemoteIntakeQuestion {
  id: string;
  label: string;
  type: RemoteIntakeQuestionType;
  required?: boolean;
  help?: string;
  maxLength?: number;
}

export interface RemoteIntakeTemplate {
  kind: RemoteIntakeFormKind;
  title: string;
  description: string;
  questions: readonly RemoteIntakeQuestion[];
}

export const REMOTE_INTAKE_CONSENT_VERSION = "remote-intake-v1-2026-09-01";
export const REMOTE_INTAKE_CONSENT_NOTICE =
  "Autorizo o envio destas informações à equipe assistencial responsável pelo paciente para organização da avaliação clínica. Entendo que o formulário não substitui consulta, não produz diagnóstico automático e não é canal de urgência.";

export const remoteIntakeTemplates: Record<RemoteIntakeFormKind, RemoteIntakeTemplate> = {
  pre_consulta: {
    kind: "pre_consulta",
    title: "Pré-consulta estruturada",
    description: "Informações iniciais para organizar a consulta e reduzir retrabalho durante o atendimento.",
    questions: [
      {
        id: "chief_complaint",
        label: "Qual é a principal preocupação ou motivo da consulta?",
        type: "long_text",
        required: true,
        maxLength: 5_000,
      },
      {
        id: "development_history",
        label: "Há aspectos do desenvolvimento, comunicação, comportamento ou aprendizagem que considera importantes?",
        type: "long_text",
        maxLength: 5_000,
      },
      {
        id: "current_medications",
        label: "Quais medicamentos estão sendo usados atualmente? Informe nome, dose e horários, se souber.",
        type: "long_text",
        maxLength: 3_000,
      },
      {
        id: "therapies_school",
        label: "Quais terapias, apoios ou adaptações escolares estão em andamento?",
        type: "long_text",
        maxLength: 5_000,
      },
      {
        id: "sleep_feeding",
        label: "Há alterações relevantes de sono ou alimentação?",
        type: "long_text",
        maxLength: 3_000,
      },
      {
        id: "safety_concerns",
        label: "Existe alguma preocupação atual de segurança que a equipe deva revisar?",
        type: "long_text",
        help: "Não use este formulário para uma urgência em curso. Em emergência, procure atendimento imediato ou acione o SAMU 192.",
        maxLength: 3_000,
      },
    ],
  },
  pre_retorno: {
    kind: "pre_retorno",
    title: "Atualização antes do retorno",
    description: "Mudanças desde a última consulta, resposta às condutas e prioridades para o próximo atendimento.",
    questions: [
      {
        id: "main_changes",
        label: "O que mudou desde a última consulta?",
        type: "long_text",
        required: true,
        maxLength: 5_000,
      },
      {
        id: "medication_use",
        label: "Como estão sendo usados os medicamentos atualmente?",
        type: "long_text",
        maxLength: 3_000,
      },
      {
        id: "adverse_effects",
        label: "Percebeu algum efeito indesejado ou dificuldade com o tratamento?",
        type: "long_text",
        maxLength: 3_000,
      },
      {
        id: "school_therapy_changes",
        label: "Houve mudanças na escola, terapias ou funcionalidade do dia a dia?",
        type: "long_text",
        maxLength: 5_000,
      },
      {
        id: "events_since_last",
        label: "Houve crises, idas à emergência, acidentes ou outros eventos relevantes?",
        type: "long_text",
        help: "Se houver uma urgência em curso, procure atendimento imediato ou acione o SAMU 192.",
        maxLength: 3_000,
      },
      {
        id: "current_priorities",
        label: "Quais são as principais prioridades para este retorno?",
        type: "long_text",
        required: true,
        maxLength: 5_000,
      },
    ],
  },
  school_report: {
    kind: "school_report",
    title: "Questionário escolar estruturado",
    description: "Relato funcional da escola para complementar a avaliação clínica, sem gerar diagnóstico automático.",
    questions: [
      {
        id: "strengths",
        label: "Quais são os principais pontos fortes do aluno?",
        type: "long_text",
        required: true,
        maxLength: 5_000,
      },
      {
        id: "main_difficulties",
        label: "Quais são as principais dificuldades observadas no ambiente escolar?",
        type: "long_text",
        required: true,
        maxLength: 5_000,
      },
      {
        id: "attention_behavior",
        label: "Como estão atenção, organização, impulsividade e comportamento em sala?",
        type: "long_text",
        maxLength: 5_000,
      },
      {
        id: "communication_social",
        label: "Como estão comunicação, interação com colegas e participação em atividades coletivas?",
        type: "long_text",
        maxLength: 5_000,
      },
      {
        id: "academic_function",
        label: "Como está o desempenho acadêmico e em quais áreas há maior necessidade de apoio?",
        type: "long_text",
        maxLength: 5_000,
      },
      {
        id: "supports",
        label: "Quais estratégias, adaptações ou apoios já foram tentados e qual foi a resposta?",
        type: "long_text",
        maxLength: 5_000,
      },
      {
        id: "teacher_concerns",
        label: "Há alguma outra preocupação que o professor considere importante comunicar à equipe clínica?",
        type: "long_text",
        maxLength: 5_000,
      },
    ],
  },
};

export function isRemoteIntakeRespondentKind(value: unknown): value is RemoteIntakeRespondentKind {
  return typeof value === "string" && remoteIntakeRespondentKinds.includes(value as RemoteIntakeRespondentKind);
}

export function isRemoteIntakeFormKind(value: unknown): value is RemoteIntakeFormKind {
  return typeof value === "string" && remoteIntakeFormKinds.includes(value as RemoteIntakeFormKind);
}

/**
 * Um `formKind` desconhecido (backend adiante do cliente, ou registro antigo)
 * devolvia `undefined` e o primeiro acesso a `.questions` derrubava a ficha
 * inteira do paciente pelo error boundary. Sem modelo, o item é listado sem
 * detalhamento — nenhuma resposta é inventada.
 */
const emptyRemoteIntakeTemplate: RemoteIntakeTemplate = {
  ...remoteIntakeTemplates.pre_consulta,
  title: "Formulário não reconhecido",
  questions: [],
};

export function getRemoteIntakeTemplate(kind: RemoteIntakeFormKind): RemoteIntakeTemplate {
  return remoteIntakeTemplates[kind] ?? emptyRemoteIntakeTemplate;
}
