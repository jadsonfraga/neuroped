/**
 * interactiveScales.ts — Motor de escalas interativas dirigido por DADOS.
 *
 * Cada definição aqui transforma uma escala (que hoje é só "ficha") em uma
 * APLICAÇÃO COMPLETA no app: itens, opções, escore e interpretação. O
 * componente InteractiveScaleRunner renderiza qualquer definição (progresso,
 * cálculo de escore, faixas de interpretação e relatório/PDF), sem código novo
 * por escala.
 *
 * REGRA DE OURO (não maquiar): só entram instrumentos com conteúdo REAL e
 * verificável. Cada definição cita a `source`. Conteúdo autoral (protocolos
 * Dr. Jadson / j26-*) deve ser fornecido pelo autor — não é inventado aqui.
 *
 * A chave do registro é o `id` da escala no catálogo (scaleFilter), de modo que
 * a rota /generic-scale/:id passa a abrir a aplicação interativa.
 */

export interface InteractiveOption {
  /** Texto da opção mostrada ao respondente. */
  label: string;
  /** Pontos que esta opção atribui ao item (já refletindo a direção/score). */
  value: number;
}

export interface InteractiveItem {
  /** Enunciado do item. */
  text: string;
  /** Opções específicas deste item (a pontuação já embute a polaridade). */
  options: InteractiveOption[];
}

export interface InterpretationBand {
  /** Faixa de escore total (inclusive) que esta interpretação cobre. */
  min: number;
  max: number;
  /** Rótulo curto (ex.: "Baixo risco", "Sugere rastreio positivo"). */
  risk: string;
  /** Texto explicativo da conduta sugerida. */
  description: string;
  /** Tom visual: ok (verde), warn (âmbar), alert (vermelho). */
  tone: "ok" | "warn" | "alert";
}

export interface InteractiveScaleDef {
  /** Casa com o id da escala no catálogo (scaleFilter). */
  id: string;
  name: string;
  fullName: string;
  /** Quem responde (ex.: "Pais/cuidador", "Criança/adolescente", "Clínico"). */
  respondent: string;
  /** Faixa etária textual (apenas exibição). */
  ageLabel: string;
  /** Instruções de preenchimento. */
  instructions: string;
  items: InteractiveItem[];
  bands: InterpretationBand[];
  /** Fonte/referência do instrumento — obrigatória (sem inventar). */
  source: string;
  /**
   * Aviso honesto: tradução/uso a validar pelo clínico antes do uso formal.
   * Exibido como banner na aplicação interativa.
   */
  validationNote?: string;
}

// Escore máximo = soma do maior valor possível de cada item.
export function maxScoreOf(def: InteractiveScaleDef): number {
  return def.items.reduce((acc, it) => acc + Math.max(...it.options.map((o) => o.value)), 0);
}

// ============================================================
// Q-CHAT-10 — Quantitative Checklist for Autism in Toddlers (10 itens)
// Allison C, Auyeung B, Baron-Cohen S. J Am Acad Child Adolesc Psychiatry. 2012.
// Domínio público / livremente reproduzível para uso clínico e de pesquisa.
// Pontuação: para os itens 1–9, as respostas "atípicas" (menos frequentes do
// comportamento esperado) valem 1; o item 10 tem polaridade invertida. Total
// ≥ 3 sugere rastreio positivo e necessidade de avaliação adicional.
// ============================================================
const QCHAT10: InteractiveScaleDef = {
  id: "q-chat-10",
  name: "Q-CHAT-10",
  fullName: "Quantitative Checklist for Autism in Toddlers — 10 itens",
  respondent: "Pais/cuidador",
  ageLabel: "18–36 meses",
  instructions:
    "Responda com base no comportamento HABITUAL da criança nas últimas semanas. Cada pergunta tem uma resposta que melhor descreve a frequência observada.",
  validationNote:
    "Tradução para uso clínico — confirme a redação com a versão validada em português antes do uso formal. Pontuação conforme Allison et al. (2012).",
  items: [
    {
      text: "A criança olha para você quando você a chama pelo nome?",
      options: [
        { label: "Sempre", value: 0 },
        { label: "Quase sempre", value: 0 },
        { label: "Às vezes", value: 1 },
        { label: "Raramente", value: 1 },
        { label: "Nunca", value: 1 },
      ],
    },
    {
      text: "Quão fácil é para você obter contato visual com a criança?",
      options: [
        { label: "Muito fácil", value: 0 },
        { label: "Razoavelmente fácil", value: 0 },
        { label: "Razoavelmente difícil", value: 1 },
        { label: "Muito difícil", value: 1 },
        { label: "Impossível", value: 1 },
      ],
    },
    {
      text: "A criança aponta para indicar que quer algo (ex.: um brinquedo fora de alcance)?",
      options: [
        { label: "Muitas vezes por dia", value: 0 },
        { label: "Algumas vezes por dia", value: 0 },
        { label: "Algumas vezes por semana", value: 1 },
        { label: "Menos de uma vez por semana", value: 1 },
        { label: "Nunca", value: 1 },
      ],
    },
    {
      text: "A criança aponta para compartilhar interesse com você (ex.: apontar algo interessante)?",
      options: [
        { label: "Muitas vezes por dia", value: 0 },
        { label: "Algumas vezes por dia", value: 0 },
        { label: "Algumas vezes por semana", value: 1 },
        { label: "Menos de uma vez por semana", value: 1 },
        { label: "Nunca", value: 1 },
      ],
    },
    {
      text: "A criança brinca de faz de conta (ex.: cuidar de bonecas, falar em telefone de brinquedo)?",
      options: [
        { label: "Muitas vezes por dia", value: 0 },
        { label: "Algumas vezes por dia", value: 0 },
        { label: "Algumas vezes por semana", value: 1 },
        { label: "Menos de uma vez por semana", value: 1 },
        { label: "Nunca", value: 1 },
      ],
    },
    {
      text: "A criança segue para onde você está olhando?",
      options: [
        { label: "Muitas vezes por dia", value: 0 },
        { label: "Algumas vezes por dia", value: 0 },
        { label: "Algumas vezes por semana", value: 1 },
        { label: "Menos de uma vez por semana", value: 1 },
        { label: "Nunca", value: 1 },
      ],
    },
    {
      text: "Se alguém da família está visivelmente triste, a criança demonstra querer confortar (ex.: acariciar, abraçar)?",
      options: [
        { label: "Sempre", value: 0 },
        { label: "Quase sempre", value: 0 },
        { label: "Às vezes", value: 1 },
        { label: "Raramente", value: 1 },
        { label: "Nunca", value: 1 },
      ],
    },
    {
      text: "Como você descreveria as primeiras palavras da criança?",
      options: [
        { label: "Muito típicas", value: 0 },
        { label: "Razoavelmente típicas", value: 0 },
        { label: "Pouco típicas", value: 1 },
        { label: "Muito atípicas", value: 1 },
        { label: "A criança não fala", value: 1 },
      ],
    },
    {
      text: "A criança usa gestos simples (ex.: acenar 'tchau')?",
      options: [
        { label: "Muitas vezes por dia", value: 0 },
        { label: "Algumas vezes por dia", value: 0 },
        { label: "Algumas vezes por semana", value: 1 },
        { label: "Menos de uma vez por semana", value: 1 },
        { label: "Nunca", value: 1 },
      ],
    },
    {
      // Item 10 — polaridade invertida: fixar-se intensamente é o "atípico".
      text: "A criança fixa o olhar em nada aparente / observa intensamente objetos sem propósito claro?",
      options: [
        { label: "Muitas vezes por dia", value: 1 },
        { label: "Algumas vezes por dia", value: 1 },
        { label: "Algumas vezes por semana", value: 1 },
        { label: "Menos de uma vez por semana", value: 0 },
        { label: "Nunca", value: 0 },
      ],
    },
  ],
  bands: [
    { min: 0, max: 2, risk: "Rastreio negativo", description: "Pontuação abaixo do ponto de corte (≥3). Mantenha vigilância do desenvolvimento na rotina. Reavalie se surgirem novas preocupações.", tone: "ok" },
    { min: 3, max: 10, risk: "Rastreio positivo", description: "Pontuação ≥ 3: sugere encaminhamento para avaliação diagnóstica de TEA. O Q-CHAT-10 é triagem — não confirma diagnóstico.", tone: "alert" },
  ],
  source: "Allison C, Auyeung B, Baron-Cohen S (2012), J Am Acad Child Adolesc Psychiatry 51(2):202-212. Ponto de corte ≥ 3.",
};

export const interactiveScales: Record<string, InteractiveScaleDef> = {
  "q-chat-10": QCHAT10,
};

export function getInteractiveScale(id: string | undefined): InteractiveScaleDef | null {
  if (!id) return null;
  return interactiveScales[id] ?? null;
}
