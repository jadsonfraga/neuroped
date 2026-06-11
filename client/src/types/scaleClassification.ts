/**
 * NEW CLASSIFICATION SYSTEM — 7-Category Respondent + Task Type Framework
 *
 * Replaces ambiguous 4-category system with precise, clinically meaningful categories.
 * Based on ABSOLUTE RULE: Teste direto com criança ≠ Pergunta subjetiva feita à criança
 */

/** 7 Distinct respondent types based on WHO RESPONDS and HOW */
export type RespondentType =
  | "questionario-parental"          // Pais/responsáveis respondent a pergunta
  | "questionario-escolar"           // Professor/escola respondent a pergunta
  | "questionario-profissional"      // Clínico/psicólogo/fono/TO respondent a pergunta
  | "autorrelato"                    // Criança/adolescente responde sobre si mesma
  | "teste-direto-desempenho"        // Criança FAZ tarefa objetiva (performance test)
  | "observacao-clinica-estruturada" // Clínico OBSERVA comportamento/desenvolvimento
  | "misto";                         // Múltiplas fontes com igual importância

/** Type of task/instrument — what is actually being measured */
export type TarefaTipo =
  | "questionario-fechado"           // Likert, sim/não, múltipla escolha
  | "pergunta-aberta"                // Perguntas discursivas
  | "tarefa-desempenho-cognitivo"    // Teste de cognição, QI, memória, atenção
  | "tarefa-desempenho-motor"        // Teste de coordenação, força, motricidade
  | "observacao-comportamental"      // Observação estruturada de comportamento
  | "escala-registro"                // GAS, COPM, registro de progresso
  | "entrevista-estruturada"         // Entrevista clínica com scoring
  | "paradigma-instrumental"         // Eye-tracking, EEG, testes computadorizados
  | "diario-registro"                // Diário de sintomas/eventos (sete dias)
  | "misto";                         // Múltiplos tipos

/** Age prerequisites for scale application */
export interface PrerequisitosIdade {
  minimo_meses: number;              // Absolute minimum age (0 = neonatal)
  ideal_meses: number;               // Optimal age range
  maximo_meses: number;              // Upper limit (null = open-ended)
  notas: string;                     // e.g., "Requer leitura fluente (≥7a)"
}

/** Competency prerequisites */
export interface PrerequisitosCompetencia {
  requer_linguagem_oral: boolean;    // Child must understand/speak language?
  requer_leitura: boolean;           // Child must read?
  requer_escrita: boolean;           // Child must write?
  requer_alfabetizacao: boolean;     // School-level literacy?
  requer_colaboracao: boolean;       // Child cooperation needed?
  requer_privacidade: boolean;       // Room without distractions?
  requer_material_especifico: string | null; // e.g., "cubes, blocks, stimuli cards"
}

/** Application mode details */
export interface ModoAplicacao {
  quem_aplica: ("pais" | "professor" | "clinico" | "crianca" | "autoaplicavel")[];
  onde_aplica: ("casa" | "escola" | "consultorio" | "online" | "hibrido")[];
  crianca_presente: boolean;         // Child must be present?
  tempo_estimado_minutos: number;    // Total time in minutes
  requer_explicacao: boolean;        // Needs instruction/demo?
  requer_demonstracao: boolean;      // Needs model/example?
  pode_ser_aplicado_remotamente: boolean;
}

/** Blocking rules: when NOT to use this scale */
export interface BloqueiosRestrições {
  condicoes_bloqueio: string[];      // e.g., ["deficiência auditiva não-mitigada", "criança não-falante"]
  contraindicações: string[];        // e.g., ["psicose ativa", "risco imediato"]
  avisos_importantes: string[];      // e.g., ["pode sensibilizar trauma"]
  requer_clinico_treinado: boolean;  // Needs certified administrator?
  requer_supervizao: boolean;        // Needs clinician oversight?
}

/** Clinical metadata — information useful for decision-making */
export interface MetadadosClinicos {
  sensibilidade_estimada: number;    // % (0-100) — ability to detect condition
  especificidade_estimada: number;   // % (0-100) — ability to rule out condition
  tempo_retest_minimo_dias: number;  // Minimum days between applications
  vieses_conhecidos: string[];       // e.g., ["cultural bias", "language bias"]
  adequado_para_monitoracao: boolean; // Good for longitudinal tracking?
  ponto_corte_validado: boolean;     // Has validated cutoff score?
}

/** New comprehensive scale entry combining old + new fields */
export interface ScaleEntryV2 {
  // CORE FIELDS (existing, required)
  id: string;
  name: string;
  fullName: string;
  queixas: string[];                 // Clinical domains
  prioridade: "triagem" | "diagnostica" | "monitorizacao";
  description: string;

  // AGE (existing, keep as-is)
  ageMin: number;                    // months
  ageMax: number;                    // months

  // NEW CLASSIFICATION (required)
  respondente_novo: RespondentType;  // NEW: precise 7-category
  tarefa_tipo: TarefaTipo;           // NEW: what type of task

  // NEW DETAILS (required for accuracy)
  modo_aplicacao: ModoAplicacao;     // WHO applies, WHERE, HOW
  prerequisitos_idade: PrerequisitosIdade;
  prerequisitos_competencia: PrerequisitosCompetencia;
  bloqueios_restricoes: BloqueiosRestrições;
  metadata_clinicos: MetadadosClinicos;

  // BACKWARDS COMPATIBILITY (phase-out these gradually)
  respondente?: ("pais" | "crianca" | "clinico" | "professor" | "autoaplicavel")[];
  tempo?: string;
  appRoute?: string;

  // PROVENANCE (existing, keep)
  fonte?: string;
  licenca?: "passiva" | "ativa" | "mista";
  licencaUso?: "livre" | "comercial" | "restrita" | "contato_autor" | "autoral";
  pubmedId?: string | null;
  validacaoBrasil?: string;
  scoringCutoff?: string;
  pendente_validacao_clinica?: boolean;
  pendencia?: string;
}

/**
 * Migration helper: convert old respondente to new respondente_novo
 * (This is a bridge; not meant for permanent use)
 */
export function migrateRespondente(
  old: ("pais" | "crianca" | "clinico" | "professor" | "autoaplicavel")[],
  tarefa_tipo: TarefaTipo
): RespondentType {
  // Logic to infer new category from old + task type
  if (old.includes("pais") && !old.includes("clinico")) return "questionario-parental";
  if (old.includes("professor") && !old.includes("clinico")) return "questionario-escolar";
  if (old.includes("crianca") || old.includes("autoaplicavel")) return "autorrelato";
  if (old.includes("clinico") && tarefa_tipo.includes("desempenho")) return "teste-direto-desempenho";
  if (old.includes("clinico") && tarefa_tipo.includes("observacao")) return "observacao-clinica-estruturada";
  if (old.length > 1) return "misto";
  return "misto";
}

/** Validation: ensure scale classification respects absolute rule */
export function validateAbsoluteRule(
  respondente: RespondentType,
  tarefa_tipo: TarefaTipo
): { valid: boolean; error?: string } {
  // ABSOLUTE RULE: teste-direto-desempenho MUST be tarefa performance, NOT pergunta
  if (respondente === "teste-direto-desempenho") {
    if (tarefa_tipo.includes("pergunta") || tarefa_tipo.includes("questionario")) {
      return {
        valid: false,
        error: `VIOLAÇÃO: respondente 'teste-direto-desempenho' não pode ter tarefa '${tarefa_tipo}'`
      };
    }
    if (!tarefa_tipo.includes("desempenho")) {
      return {
        valid: false,
        error: `VIOLAÇÃO: respondente 'teste-direto-desempenho' requer tarefa-desempenho, não '${tarefa_tipo}'`
      };
    }
  }

  // autorrelato MUST be pergunta (questionnaire-type), not performance test
  if (respondente === "autorrelato") {
    if (tarefa_tipo.includes("desempenho")) {
      return {
        valid: false,
        error: `VIOLAÇÃO: respondente 'autorrelato' não pode ser 'teste-direto-desempenho'`
      };
    }
  }

  return { valid: true };
}
