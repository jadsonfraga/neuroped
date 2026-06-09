/**
 * METADATA CLÍNICA ESTENDIDA PARA ESCALAS
 *
 * Esta interface define TODOS os metadados clínicos necessários para:
 * - Classificar escalas corretamente
 * - Implementar blocking rules
 * - Criar filtro contra-restritivo
 * - Proteger contra mau uso
 * - Explicar decisões do sistema
 */

export type InstrumentCategory =
  | "questionario_parental"           // 1. Pergunta para pais
  | "questionario_escolar"             // 2. Pergunta para escola/professor
  | "questionario_profissional"        // 3. Pergunta para profissional preencher
  | "autorrelato_crianca"              // 4. Criança responde sobre si mesma
  | "teste_direto_desempenho"          // 5. Criança EXECUTA tarefa objetiva
  | "observacao_clinica_estruturada"   // 6. Clínico observa estruturadamente
  | "classificacao_funcional"          // 7. Clínico classifica (GMFCS, CFCS, etc)
  | "misto";                           // 8. Múltiplas fontes reais obrigatórias

export type AdministrationMode =
  | "questionario"                     // Formulário escrito/digital
  | "entrevista"                       // Entrevista semiestruturada (ADI-R)
  | "entrevista_rapida"                // Entrevista rápida (10-15 min)
  | "observacao_estruturada"           // Observação padronizada (Denver, GMA)
  | "teste_direto_tarefa"              // Criança executa tarefas (Bayley, PPVT)
  | "teste_direto_misto"               // Mistura observação + tarefas (Denver)
  | "checklist_comportamental"         // Observação comportamental (CARS, ADOS)
  | "classificacao"                    // Clínico classifica (GMFCS, Ashworth)
  | "registro_continuo";               // Diário/registro (cefaleia, epilepsia)

export type ReadingLevel =
  | "nao_exige"                        // Não exige leitura (figuras, sons)
  | "basico"                           // Lê palavras simples (2-3 sílabas)
  | "nivel2"                           // Lê frases simples (pré-escolar final)
  | "nivel3"                           // Lê textos curtos (escolar inicial)
  | "fluente";                         // Lê textos complexos (6º+ ano)

export type WritingLevel =
  | "nao_exige"                        // Não exige escrita
  | "copia"                            // Copia letras/palavras (pré-escrita)
  | "escreve_nome"                     // Escreve nome próprio
  | "escreve_palavras"                 // Escreve palavras ditadas
  | "escreve_espontaneo";              // Escreve textos livres

export type MotorRequirement =
  | "nenhum"
  | "motor_grosso"                     // Marcha, sentar, postura
  | "motor_fino"                       // Apontar, pinça, desenho
  | "ambos";                           // Exige coordenação fina e grossa

export type MisuseRisk =
  | "baixo"                            // Aplicação clara, difícil errar
  | "moderado"                         // Requer treinamento básico
  | "alto"                             // Requer profissional específico
  | "muito_alto";                      // Proibido para uso leigo (ADOS, ADI-R)

export interface DirectTestComponent {
  /** Identificador único do componente */
  id: string;

  /** Nome da tarefa (ex: "Apontação de cores", "Leitura de sílabas") */
  name: string;

  /** Domínio da tarefa */
  domain: "cognicao" | "linguagem_receptiva" | "linguagem_expressiva" |
          "pre_academico" | "leitura" | "escrita" | "aritmética" |
          "atencao" | "funcoes_executivas" | "memoria" | "motricidade_fina" |
          "motricidade_grossa" | "visuomotor" | "social" | "comportamento";

  /** Descrição da tarefa */
  description: string;

  /** Critério de acerto objetivo */
  passCriterion: string;

  /** Idade mínima recomendada */
  ageMinMonths?: number;

  /** Idade máxima recomendada */
  ageMaxMonths?: number;
}

export interface BlockingRule {
  /** ID único da regra */
  id: string;

  /** Condição lógica que desencadeia o bloqueio */
  condition: string;

  /** Mensagem clara para o usuário sobre por que foi bloqueada */
  userExplanation: string;

  /** Tipo de bloqueio */
  blockType: "idade" | "requisito_informante" | "requisito_habilidade" |
            "incompatibilidade_dominio" | "risco_mau_uso" | "profissional_apenas" |
            "hard" | "soft";

  /** Severeidade: se "hard", bloqueia; se "soft", marca como pendente */
  severity: "hard" | "soft";
}

export interface FormVariant {
  /** ID único do variant */
  variantId: string;

  /** Nome do variant (ex: "Parent Form", "Teacher Form") */
  name: string;

  /** Respondente desta versão */
  respondent: "pais" | "professor" | "profissional" | "crianca" | "adolescente" | "clinico";

  /** Faixa etária aplicável */
  ageMinMonths: number;
  ageMaxMonths: number;

  /** Tempo estimado */
  tempo: string;

  /** Idioma disponível */
  language: "pt-BR" | "en" | "es";

  /** Link para form específico */
  appRoute?: string;
}

export interface ClinicalScaleMetadata {
  /**
   * ===== IDENTIDADE E CLASSIFICAÇÃO =====
   */

  /** Categoria-mãe obrigatória */
  instrumentType: InstrumentCategory;

  /** Como é administrado exatamente */
  administrationMode: AdministrationMode;

  /** Descrição breve e clinicamente precisa */
  clinicalDescription: string;

  /**
   * ===== RESPONDENTES E REQUISITOS =====
   */

  /** Exige resposta de pais/responsáveis? */
  requiresParent: boolean;

  /** Exige resposta de escola/professor? */
  requiresSchool: boolean;

  /** Exige aplicação por profissional treinado? */
  requiresProfessional: boolean;

  /** Tipo de profissional exigido (se requiresProfessional = true) */
  professionalType?: "psicólogo" | "fonoaudiólogo" | "neuropediatra" |
                     "TO" | "psicopedagogo" | "terapeuta" | "generalista";

  /** Criança deve estar presente? */
  requiresChildPresence: boolean;

  /** Colaboração mínima da criança necessária? */
  requiresMinimumCollaboration: boolean;

  /**
   * ===== HABILIDADES DA CRIANÇA NECESSÁRIAS =====
   */

  /** Exige linguagem oral (falar)? */
  requiresVerbalLanguage: boolean;

  /** Exige compreensão de linguagem? */
  requiresLanguageComprehension: boolean;

  /** Exige leitura? */
  requiresReading: boolean;

  /** Se exige leitura, qual nível mínimo? */
  minReadingLevel?: ReadingLevel;

  /** Exige escrita? */
  requiresWriting: boolean;

  /** Se exige escrita, qual nível mínimo? */
  minWritingLevel?: WritingLevel;

  /** Exige controle motor? */
  motorRequirement: MotorRequirement;

  /** Exige atenção/colaboração sustentada? */
  requiresSustainedAttention: boolean;

  /** Exige compreensão abstrata? */
  requiresAbstractThinking: boolean;

  /**
   * ===== TESTES DIRETOS (se houver) =====
   */

  /** Array de componentes de teste direto (se instrumentType = "teste_direto_desempenho") */
  directTestComponents?: DirectTestComponent[];

  /**
   * ===== MÚLTIPLAS FORMAS/VERSÕES =====
   */

  /** Tem múltiplas formas (pais vs criança vs professor)? */
  hasFormVariants: boolean;

  /** Se sim, listar todas as variantes */
  formVariants?: FormVariant[];

  /**
   * ===== CONTEXTOS DE USO =====
   */

  /** É adequado para triagem inicial? */
  isScreeningTool: boolean;

  /** É adequado para seguimento/monitorização? */
  isMonitoringTool: boolean;

  /** É adequado para apoio diagnóstico? */
  isDiagnosticSupport: boolean;

  /** É avaliação funcional? */
  isFunctionalAssessment: boolean;

  /**
   * ===== CONTRAINDICAÇÕES E RESTRIÇÕES =====
   */

  /** Array de contraindicações clínicas */
  contraindications: string[];

  /** Array de restrições de uso */
  restrictions: string[];

  /** Risco de mau uso */
  misuseRisk: MisuseRisk;

  /** Explicação do risco de mau uso */
  misuseRiskExplanation?: string;

  /**
   * ===== REGRAS DE BLOQUEIO =====
   */

  /** Array de regras que bloqueiam esta escala */
  blockingRules: BlockingRule[];

  /**
   * ===== RECOMENDAÇÕES E CONTEXTO =====
   */

  /** Recomendado quando... (array de razões) */
  recommendedWhen: string[];

  /** Evitar quando... (array de motivos) */
  avoidWhen: string[];

  /** Observações clínicas importantes */
  clinicalNotes?: string;
}

/**
 * ESCALA ESTENDIDA COM METADATA CLÍNICA
 */
export interface ScaleEntryWithClinicalMetadata {
  // Campos originais de ScaleEntry
  id: string;
  name: string;
  fullName: string;
  ageMin: number;
  ageMax: number;
  queixas: string[];
  respondente: ("pais" | "clinico" | "professor" | "autoaplicavel")[];
  prioridade: "triagem" | "diagnostica" | "monitorizacao";
  tempo: string;
  appRoute?: string;
  description: string;
  fonte?: string;
  licenca?: "passiva" | "ativa" | "mista";
  tipo?: string;
  pendente_validacao_clinica?: boolean;
  pendencia?: string;
  pubmedId?: string | null;
  validacaoBrasil?: string;
  scoringCutoff?: string;
  licencaUso?: "livre" | "comercial" | "restrita" | "contato_autor" | "autoral";

  // NOVOS: Metadata clínica
  clinicalMetadata: ClinicalScaleMetadata;
}
