import type { ChecklistSuggestion, NoteTopic } from "./types";

export const topicLabels: Record<NoteTopic, string> = {
  queixa_principal: "Queixa principal", hda: "HDA", gestacao: "Gestação", parto: "Parto", neonatal: "Neonatal",
  desenvolvimento_motor: "Desenvolvimento motor", desenvolvimento_linguagem: "Desenvolvimento da linguagem", interacao_social: "Interação social",
  brincadeiras: "Brincadeiras", comportamentos_repetitivos: "Comportamentos repetitivos", perfil_sensorial: "Perfil sensorial", sono: "Sono",
  alimentacao: "Alimentação", escola: "Escola", aprendizagem: "Aprendizagem", comportamento: "Comportamento", ansiedade: "Ansiedade",
  humor: "Humor", tiques: "Tiques", epilepsia: "Epilepsia", crises: "Crises", medicacoes: "Medicações", alergias: "Alergias",
  antecedentes: "Antecedentes", historia_familiar: "História familiar", observacoes_medico: "Observações do médico",
  informacoes_escolares: "Informações escolares", relatos_terapeuticos: "Relatos terapêuticos", exame_fisico: "Exame físico",
  exame_neurologico: "Exame neurológico", hipoteses: "Hipóteses", condutas: "Condutas", orientacoes: "Orientações",
  risco_autolesao_suicidio: "Risco de autolesão/suicídio",
};

export const topicKeywordMap: Record<NoteTopic, RegExp[]> = {
  queixa_principal: [/queixa|motivo|procurou|demanda/i], hda: [/história atual|começou|início|evolu/i], gestacao: [/gesta|gravidez|pré[- ]?natal/i], parto: [/parto|cesárea|normal/i], neonatal: [/uti neonatal|apgar|icterícia|neonatal/i],
  desenvolvimento_motor: [/sentou|andou|engatinh|motor/i], desenvolvimento_linguagem: [/fala|linguagem|palavra|frase/i], interacao_social: [/olho|intera|social|compartilha/i], brincadeiras: [/brinca|faz de conta|brinquedo/i], comportamentos_repetitivos: [/repetitiv|estereotip|alinhar/i], perfil_sensorial: [/sensorial|barulho|textura|seletividade/i], sono: [/sono|dorme|insônia|desperta/i], alimentacao: [/aliment|come|seletiv/i], escola: [/escola|professor|sala/i], aprendizagem: [/aprendiz|leitura|escrita|matemática/i], comportamento: [/comport|agress|opositor|birra/i], ansiedade: [/ansiedade|medo|preocup/i], humor: [/humor|triste|irritad/i], tiques: [/tique|piscar|careta/i], epilepsia: [/epileps|eeg/i], crises: [/crise|convuls|ausência/i], medicacoes: [/medica|remédio|dose|mg/i], alergias: [/alerg/i], antecedentes: [/antecedente|internação|cirurgia/i], historia_familiar: [/família|familiar|heredit|parent/i], observacoes_medico: [/observo|ao exame|durante a consulta/i], informacoes_escolares: [/relatório escolar|professora|boletim/i], relatos_terapeuticos: [/terapia|fono|to |psicolog|aba/i], exame_fisico: [/exame físico|peso|altura|perímetro/i], exame_neurologico: [/neurológico|tônus|reflexo|marcha/i], hipoteses: [/hipótese|suspeita|compatível/i], condutas: [/conduta|prescrevo|solicito|encaminho/i], orientacoes: [/oriento|orientação|explico/i],
  risco_autolesao_suicidio: [/suicid|autoles|automutil|se matar|matar-se|acabar com a vida|n[ãa]o quer viver|quer morrer|cortar-se|cortes? no (braço|pulso)|autoextermínio/i],
};

export const requiredConsultationTopics: ChecklistSuggestion[] = [
  { topic: "risco_autolesao_suicidio", message: "Triagem obrigatória: perguntar ativamente sobre ideação suicida, autolesão ou tentativas prévias.", priority: "alta" },
  { topic: "historia_familiar", message: "Talvez seja interessante perguntar sobre história familiar neuropsiquiátrica.", priority: "media" },
  { topic: "crises", message: "Talvez seja interessante checar regressão, crises ou convulsões.", priority: "alta" },
  { topic: "sono", message: "Talvez seja interessante perguntar sobre sono e despertares.", priority: "media" },
  { topic: "desenvolvimento_motor", message: "Talvez seja interessante registrar lateralidade, autonomia e marcos motores.", priority: "media" },
  { topic: "escola", message: "Talvez seja interessante revisar história escolar e aprendizagem.", priority: "media" },
  { topic: "medicacoes", message: "Talvez seja interessante confirmar uso prévio de medicamentos.", priority: "media" },
];
