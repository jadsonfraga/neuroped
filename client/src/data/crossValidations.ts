// Sistema de Validações Cruzadas Inteligentes
// Detecta compatibilidades/incompatibilidades entre escalas e recomendações

export interface ValidationAlert {
  id: string;
  severity: "info" | "warning" | "error";
  title: string;
  message: string;
  recommendation: string;
  scales: string[];
}

export interface ValidationCheck {
  condition: string;
  validate: (selectedScales: string[], detectedPattern: string) => boolean;
  alert: ValidationAlert;
}

export const validationAlerts: Record<string, ValidationAlert> = {
  // ===== CONFLITOS DIAGNÓSTICOS =====
  "tdah-sem-atraso-cognitivo": {
    id: "tdah-sem-atraso-cognitivo",
    severity: "warning",
    title: "⚠️ TDAH sem Atraso Cognitivo Detectado",
    message:
      "Você selecionou SNAP-IV positivo (TDAH) mas Bayley-III mostra cognição normal. Isso é COMPATÍVEL - TDAH é desatenção/hiperatividade, não atraso cognitivo. Procurar atraso apenas se Bayley <85.",
    recommendation:
      "Continuar com diagnóstico TDAH. Avaliar função executiva com BRIEF-2. TDAH + QI normal é apresentação esperada em 70% casos.",
    scales: ["snap", "bayley"]
  },

  "atraso-mas-sem-tea-sinais": {
    id: "atraso-mas-sem-tea-sinais",
    severity: "info",
    title: "ℹ️ Atraso Global Sem Sinais TEA",
    message:
      "Atraso detectado em Bayley-III mas M-CHAT negativo. Isso sugere atraso GLOBAL (não TEA). Avaliar causas: prematuridade, deficiência intelectual, privação estimulação.",
    recommendation:
      "Descartar TEA (M-CHAT negativo). Investigar etiologia do atraso. Encaminhar para intervenção precoce. Reavaliação M-CHAT em 6-12 meses (pode emergir sinais de TEA).",
    scales: ["bayley", "mchat"]
  },

  "comportamento-e-tdah-simultaneos": {
    id: "comportamento-e-tdah-simultaneos",
    severity: "info",
    title: "✓ Comportamento + TDAH (Padrão Comum)",
    message:
      "SNAP-IV positivo + CBCL elevado = TDAH com comorbidade comportamental (60% coexistem). Não é duplicação - cada escala mede aspecto diferente.",
    recommendation:
      "Usar SNAP para TDAH, CBCL para comorbidade. Considerar BRIEF-2 para função executiva. Tratamento pode beneficiar ambos (medicação TDAH + terapia comportamental).",
    scales: ["snap", "cbcl"]
  },

  // ===== INCOMPATIBILIDADES FAIXA ETÁRIA =====
  "escala-fora-faixa-etaria": {
    id: "escala-fora-faixa-etaria",
    severity: "error",
    title: "❌ Escala Fora da Faixa Etária",
    message:
      "Você selecionou escala não apropriada para a idade. Exemplo: ADOS-2 é para 12+ meses, M-CHAT é para 16-30 meses. Usar fora dessa faixa reduz validade.",
    recommendation:
      "Verificar faixa etária de cada escala. Se criança <16m com suspeita TEA, usar Bayley-III ou Griffiths, não M-CHAT. Considerar remover escala inapropriada.",
    scales: []
  },

  // ===== REDUNDÂNCIAS =====
  "multiplas-tdah-triagem": {
    id: "multiplas-tdah-triagem",
    severity: "warning",
    title: "⚠️ Múltiplas Escalas TDAH (Redundância)",
    message:
      "Você selecionou SNAP-IV, Conners E Vanderbilt (todas triagem TDAH). Só uma triagem é suficiente. As outras três são redundantes.",
    recommendation:
      "Manter apenas 1 triagem (SNAP-IV recomendado, validade DSM-5). Usar Conners se reavaliação longitudinal. Usar BRIEF-2 complementar (função executiva), não outra triagem TDAH.",
    scales: ["snap", "conners", "vanderbilt"]
  },

  "multiplos-atraso": {
    id: "multiplos-atraso",
    severity: "warning",
    title: "⚠️ Múltiplas Escalas Atraso (Escolha Uma Primária)",
    message:
      "Bayley-III + Griffiths + Denver são todas para atraso. Bayley é ouro, Griffiths é boa alternativa. Denver é apenas triagem. Usar todas três é custoso sem valor agregado.",
    recommendation:
      "Escolher: Bayley-III OU Griffiths como primária (não ambas). Denver apenas se falha acesso Bayley/Griffiths. Complementar com Vineland para funcionalidade.",
    scales: ["bayley", "griffiths", "denver"]
  },

  // ===== FALTAM ELEMENTOS IMPORTANTES =====
  "depressao-sem-risco-suicida": {
    id: "depressao-sem-risco-suicida",
    severity: "warning",
    title: "⚠️ Depressão Detectada Mas Sem Escala Risco Suicida",
    message:
      "PHQ-9 ≥15 (depressão moderada/grave) foi identificado sem aplicar Columbia Suicide Risk Scale. RISCO IMINENTE pode não ser detectado.",
    recommendation:
      "APLICAR COLUMBIA OBRIGATORIAMENTE se PHQ-9 ≥15. Se ideação presente: comunicar responsável e considerar encaminhamento urgente.",
    scales: ["phq9", "columbia"]
  },

  "tdah-sem-func-executiva": {
    id: "tdah-sem-func-executiva",
    severity: "info",
    title: "ℹ️ TDAH Detectado Mas Sem Avaliação Função Executiva",
    message:
      "SNAP-IV positivo (TDAH) sem BRIEF-2. Você pode estar perdendo dificuldades de função executiva (inibição, flexibilidade) que não comportamentais.",
    recommendation:
      "Considerar adicionar BRIEF-2 para completar avaliação. Especialmente se SNAP positivo mas baixa resposta medicação esperada.",
    scales: ["snap", "brief2"]
  },

  "tea-sem-funcionalidade": {
    id: "tea-sem-funcionalidade",
    severity: "info",
    title: "ℹ️ TEA Confirmado Mas Sem Avaliação Funcionalidade",
    message:
      "ADOS-2 positivo (TEA diagnóstico) sem Vineland. Você conhece diagnóstico mas não sabe impacto nas atividades de vida diária.",
    recommendation:
      "Adicionar Vineland-II para avaliar habilidades adaptativas. Essencial para planejamento de intervenção e suporte necessário.",
    scales: ["ados2", "vineland"]
  },

  // ===== PADRÕES SUSPEITOS =====
  "comorbidade-nao-esperada": {
    id: "comorbidade-nao-esperada",
    severity: "info",
    title: "ℹ️ Comorbidade Inesperada (Validar Contexto)",
    message:
      "Detectada comorbidade rara. Exemplo: TDAH + Traços autistas + Ansiedade. Possível - mas validar se comorbidade real ou efeito escala falho.",
    recommendation:
      "Rever respostas em cada escala. Considerar efeito prática (cansaço). Possível que uma escala tenha falso positivo. Consulte clínico experiente.",
    scales: []
  },

  "perfil-contraditor": {
    id: "perfil-contraditor",
    severity: "warning",
    title: "⚠️ Perfil Contraditório (Revisar Aplicação)",
    message:
      "Resultado contradiz observação clínica. Exemplo: SNAP-IV negativo mas criança com dificuldade atenção visível, OU CBCL normal mas relato comportamento grave.",
    recommendation:
      "Possível: erro aplicação, criança cansada, pais/professor minimizando/exagerando. Reavalie em outra sessão. Considere diferentes respondentes.",
    scales: []
  }
};

export const validationChecks: ValidationCheck[] = [
  // Faixa etária
  {
    condition: "mchat-age",
    validate: (scales, pattern) => scales.includes("mchat"),
    alert: validationAlerts["escala-fora-faixa-etaria"]
  },

  // Múltiplas triagens
  {
    condition: "tdah-redundancy",
    validate: (scales, pattern) =>
      scales.filter(s => ["snap", "conners", "vanderbilt"].includes(s)).length > 1,
    alert: validationAlerts["multiplas-tdah-triagem"]
  },

  // Depressão sem risco
  {
    condition: "depression-risk",
    validate: (scales, pattern) =>
      scales.includes("phq9") && !scales.includes("columbia") && pattern.includes("depressao"),
    alert: validationAlerts["depressao-sem-risco-suicida"]
  },

  // TEA sem funcionalidade
  {
    condition: "tea-functionality",
    validate: (scales, pattern) =>
      scales.includes("ados2") && !scales.includes("vineland"),
    alert: validationAlerts["tea-sem-funcionalidade"]
  },

  // TDAH sem função executiva
  {
    condition: "tdah-executive",
    validate: (scales, pattern) =>
      scales.includes("snap") && !scales.includes("brief2"),
    alert: validationAlerts["tdah-sem-func-executiva"]
  }
];

export function validateScaleSelection(
  selectedScales: string[],
  detectedPattern: string
): ValidationAlert[] {
  const alerts: ValidationAlert[] = [];

  // Executar checks e coletar alerts
  for (const check of validationChecks) {
    if (check.validate(selectedScales, detectedPattern)) {
      alerts.push(check.alert);
    }
  }

  // Alertas específicos por padrão
  if (detectedPattern.includes("depressao") && selectedScales.includes("phq9")) {
    alerts.push(validationAlerts["depressao-sem-risco-suicida"]);
  }

  if (detectedPattern.includes("tdah") && selectedScales.includes("snap")) {
    if (!selectedScales.includes("brief2")) {
      alerts.push(validationAlerts["tdah-sem-func-executiva"]);
    }
  }

  if (detectedPattern.includes("tea") && selectedScales.includes("ados2")) {
    if (!selectedScales.includes("vineland")) {
      alerts.push(validationAlerts["tea-sem-funcionalidade"]);
    }
  }

  // Remover duplicatas
  return Array.from(new Map(alerts.map(a => [a.id, a])).values());
}

export function getAlertColor(severity: "info" | "warning" | "error"): string {
  return {
    info: "bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-200",
    warning:
      "bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-200",
    error: "bg-red-50 border-red-200 text-red-900 dark:bg-red-950/30 dark:border-red-800 dark:text-red-200"
  }[severity];
}

export function getAlertIcon(severity: "info" | "warning" | "error"): string {
  return {
    info: "ℹ️",
    warning: "⚠️",
    error: "❌"
  }[severity];
}
