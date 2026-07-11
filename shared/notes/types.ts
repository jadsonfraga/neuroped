export const noteSpeakerRoles = ["medico", "mae", "pai", "paciente", "professor", "acompanhante", "outro"] as const;
export type NoteSpeakerRole = (typeof noteSpeakerRoles)[number];

export const noteEvidenceSources = ["relato_pais", "observacao_medico", "documento_escolar", "relatorio_terapeutico", "inferencia_ia"] as const;
export type NoteEvidenceSource = (typeof noteEvidenceSources)[number];

export const noteTopics = [
  "queixa_principal", "hda", "gestacao", "parto", "neonatal", "desenvolvimento_motor", "desenvolvimento_linguagem",
  "interacao_social", "brincadeiras", "comportamentos_repetitivos", "perfil_sensorial", "sono", "alimentacao", "escola",
  "aprendizagem", "comportamento", "ansiedade", "humor", "tiques", "epilepsia", "crises", "medicacoes", "alergias",
  "antecedentes", "historia_familiar", "observacoes_medico", "informacoes_escolares", "relatos_terapeuticos", "exame_fisico",
  "exame_neurologico", "hipoteses", "condutas", "orientacoes",
] as const;
export type NoteTopic = (typeof noteTopics)[number];

export interface TranscriptSegment {
  id: string;
  consultationId: string;
  startMs: number;
  endMs: number;
  text: string;
  speaker: NoteSpeakerRole;
  speakerLabel?: string;
  confidence?: number;
  topics: NoteTopic[];
  source: NoteEvidenceSource;
  correctedByUserId?: string;
  createdAt: string;
}

export interface TranscriptionProvider {
  readonly name: "openai_whisper" | "deepgram" | "google_speech" | "azure_speech" | "local_mock";
  transcribeChunk(input: AudioChunk): Promise<TranscriptionChunkResult>;
}

export interface AudioChunk {
  consultationId: string;
  sequence: number;
  mimeType: string;
  bytes: Uint8Array;
  capturedAt: string;
}

export interface TranscriptionChunkResult {
  text: string;
  startMs: number;
  endMs: number;
  confidence?: number;
  providerTraceId?: string;
}

export interface DiarizationProvider {
  readonly name: "provider_native" | "pyannote" | "manual" | "heuristic";
  assignSpeaker(input: DiarizationInput): Promise<Pick<TranscriptSegment, "speaker" | "speakerLabel" | "confidence">>;
}

export interface DiarizationInput {
  text: string;
  previousSegments: TranscriptSegment[];
  audioFeatures?: Record<string, number>;
}

export interface ChecklistSuggestion {
  topic: NoteTopic;
  message: string;
  priority: "baixa" | "media" | "alta";
}

export interface GeneratedClinicalDocuments {
  anamnese: string;
  evolucao: string;
  pant: string;
  resumoClinico: string;
  cartaEscola: string;
  cartaTerapias: string;
  receitaModelo: string;
  solicitacoesExames: string;
  encaminhamentos: string;
  camposPendentes: NoteTopic[];
}
