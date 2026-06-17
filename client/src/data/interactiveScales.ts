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

// ============================================================
// FPS-R — Faces Pain Scale–Revised (Hicks et al., 2001; IASP)
// Uso clínico/não comercial livre. Autorrelato de dor, 3–18 anos.
// 6 faces pontuadas 0-2-4-6-8-10.
// ============================================================
const FPSR: InteractiveScaleDef = {
  id: "fps-r",
  name: "FPS-R",
  fullName: "Faces Pain Scale – Revised",
  respondent: "Criança/adolescente (autorrelato)",
  ageLabel: "3–18 anos",
  instructions:
    "Mostre as faces à criança e diga: 'Estas faces mostram o quanto algo pode doer. Esta face (a primeira) mostra que não dói nada. As faces seguintes mostram cada vez mais dor, até esta (a última), que mostra muita dor. Aponte a face que mostra o quanto dói AGORA.' Não use as palavras 'feliz' ou 'triste' — a escala mede dor, não humor.",
  items: [
    {
      text: "Qual face mostra o quanto dói agora?",
      options: [
        { label: "😐 Face 1 — não dói nada", value: 0 },
        { label: "🙁 Face 2 — dói um pouco", value: 2 },
        { label: "☹️ Face 3 — dói um pouco mais", value: 4 },
        { label: "😣 Face 4 — dói ainda mais", value: 6 },
        { label: "😫 Face 5 — dói muito", value: 8 },
        { label: "😭 Face 6 — dói o máximo que você pode imaginar", value: 10 },
      ],
    },
  ],
  bands: [
    { min: 0, max: 0, risk: "Sem dor", description: "A criança não refere dor neste momento. Reavalie conforme o contexto clínico.", tone: "ok" },
    { min: 1, max: 3, risk: "Dor leve", description: "Dor leve. Considere medidas não farmacológicas e reavaliação periódica.", tone: "ok" },
    { min: 4, max: 6, risk: "Dor moderada", description: "Dor moderada (FPS-R ≥ 4 costuma indicar dor clinicamente relevante). Considere analgesia e investigação da causa.", tone: "warn" },
    { min: 7, max: 10, risk: "Dor intensa", description: "Dor intensa. Priorize analgesia adequada, investigação da causa e reavaliação em curto intervalo.", tone: "alert" },
  ],
  source: "Hicks CL, von Baeyer CL, Spafford PA, van Korlaar I, Goodenough B (2001). Pain 93:173-183. IASP — uso clínico não comercial livre.",
  validationNote: "Aplique com o cartão visual oficial das 6 faces (IASP) sempre que possível; os emojis acima são apenas apoio de registro.",
};

// ============================================================
// NRS — Escala Numérica de Dor 0–10 (Numeric Rating Scale)
// Domínio público / uso universal em clínica.
// ============================================================
const NRSPAIN: InteractiveScaleDef = {
  id: "nrs-pain",
  name: "NRS Dor",
  fullName: "Numeric Rating Scale for Pain (0–10)",
  respondent: "Criança ≥ 8 anos / adolescente (autorrelato)",
  ageLabel: "8–18 anos",
  instructions:
    "Pergunte: 'Em uma escala de 0 a 10, em que 0 é nenhuma dor e 10 é a pior dor que você pode imaginar, que nota você dá para a sua dor AGORA?'",
  items: [
    {
      text: "Nota da dor agora (0 = nenhuma dor; 10 = pior dor imaginável)",
      options: [
        { label: "0 — nenhuma dor", value: 0 },
        { label: "1", value: 1 },
        { label: "2", value: 2 },
        { label: "3", value: 3 },
        { label: "4", value: 4 },
        { label: "5", value: 5 },
        { label: "6", value: 6 },
        { label: "7", value: 7 },
        { label: "8", value: 8 },
        { label: "9", value: 9 },
        { label: "10 — pior dor imaginável", value: 10 },
      ],
    },
  ],
  bands: [
    { min: 0, max: 0, risk: "Sem dor", description: "Sem dor referida no momento.", tone: "ok" },
    { min: 1, max: 3, risk: "Dor leve", description: "Dor leve (1–3). Medidas não farmacológicas e reavaliação.", tone: "ok" },
    { min: 4, max: 6, risk: "Dor moderada", description: "Dor moderada (4–6). Considere analgesia e investigue a causa. Redução ≥ 2 pontos após intervenção é clinicamente significativa (Farrar et al., 2001).", tone: "warn" },
    { min: 7, max: 10, risk: "Dor intensa", description: "Dor intensa (7–10). Priorize controle da dor e investigação imediata da causa.", tone: "alert" },
  ],
  source: "Escala clínica universal; pontos de corte usuais 1-3/4-6/7-10. Farrar JT et al. (2001), Pain 94:149-158 (mudança clinicamente significativa).",
};

// ============================================================
// VAS — Escala Visual Analógica de Dor (adaptação digital 0–100)
// Domínio público (Huskisson, 1974). A linha de 100 mm é aproximada
// aqui em passos de 10 para registro digital.
// ============================================================
const VASPAIN: InteractiveScaleDef = {
  id: "vas-pain",
  name: "VAS Dor",
  fullName: "Visual Analog Scale for Pain (0–100, adaptação digital)",
  respondent: "Criança ≥ 8 anos / adolescente (autorrelato)",
  ageLabel: "8–18 anos",
  instructions:
    "Peça que o paciente marque na linha o ponto que representa a intensidade da dor, entre 'nenhuma dor' (0) e 'pior dor imaginável' (100). Nesta versão digital, selecione o valor mais próximo em passos de 10 mm.",
  validationNote: "Adaptação digital da linha de 100 mm em passos de 10 — para medida fina, use a régua VAS física.",
  items: [
    {
      text: "Posição na linha de dor (mm)",
      options: [
        { label: "0 — nenhuma dor", value: 0 },
        { label: "10", value: 10 },
        { label: "20", value: 20 },
        { label: "30", value: 30 },
        { label: "40", value: 40 },
        { label: "50", value: 50 },
        { label: "60", value: 60 },
        { label: "70", value: 70 },
        { label: "80", value: 80 },
        { label: "90", value: 90 },
        { label: "100 — pior dor imaginável", value: 100 },
      ],
    },
  ],
  bands: [
    { min: 0, max: 4, risk: "Sem dor", description: "Sem dor relevante referida.", tone: "ok" },
    { min: 5, max: 44, risk: "Dor leve", description: "Dor leve (~5–44 mm).", tone: "ok" },
    { min: 45, max: 74, risk: "Dor moderada", description: "Dor moderada (~45–74 mm). Considere analgesia e investigação.", tone: "warn" },
    { min: 75, max: 100, risk: "Dor intensa", description: "Dor intensa (≥ 75 mm). Priorize controle da dor e investigação.", tone: "alert" },
  ],
  source: "Huskisson EC (1974), Lancet 2:1127-1131. Faixas usuais de classificação em pediatria conforme literatura de dor aguda.",
};

// ============================================================
// ARI — Affective Reactivity Index (Stringaris et al., 2012)
// Irritabilidade — 6 itens de sintomas (0–2) somados; o item de
// prejuízo funcional do instrumento original deve ser avaliado
// clinicamente em separado. Uso livre para clínica e pesquisa.
// ============================================================
const ARI: InteractiveScaleDef = {
  id: "ari",
  name: "ARI",
  fullName: "Affective Reactivity Index — Índice de Reatividade Afetiva",
  respondent: "Pais/cuidador (ou autorrelato do adolescente)",
  ageLabel: "6–17 anos",
  instructions:
    "Considere o comportamento nos ÚLTIMOS 6 MESES, em comparação com outros jovens da mesma idade. O instrumento original inclui ainda um item de prejuízo ('a irritabilidade causa problemas para ele/ela'), que não entra na soma — registre-o na avaliação clínica.",
  validationNote:
    "Tradução de uso clínico — confirme a redação com a versão validada em português antes do uso formal. Soma dos 6 itens de sintomas (0–12), conforme Stringaris et al. (2012).",
  items: [
    { text: "Fica irritado(a) com facilidade pelos outros", options: [ { label: "Não é verdade", value: 0 }, { label: "Um pouco verdade", value: 1 }, { label: "Certamente verdade", value: 2 } ] },
    { text: "Frequentemente perde a paciência (explode)", options: [ { label: "Não é verdade", value: 0 }, { label: "Um pouco verdade", value: 1 }, { label: "Certamente verdade", value: 2 } ] },
    { text: "Permanece com raiva por muito tempo", options: [ { label: "Não é verdade", value: 0 }, { label: "Um pouco verdade", value: 1 }, { label: "Certamente verdade", value: 2 } ] },
    { text: "Está com raiva na maior parte do tempo", options: [ { label: "Não é verdade", value: 0 }, { label: "Um pouco verdade", value: 1 }, { label: "Certamente verdade", value: 2 } ] },
    { text: "Fica com raiva com frequência", options: [ { label: "Não é verdade", value: 0 }, { label: "Um pouco verdade", value: 1 }, { label: "Certamente verdade", value: 2 } ] },
    { text: "Perde o controle com facilidade", options: [ { label: "Não é verdade", value: 0 }, { label: "Um pouco verdade", value: 1 }, { label: "Certamente verdade", value: 2 } ] },
  ],
  bands: [
    { min: 0, max: 3, risk: "Irritabilidade baixa", description: "Sintomas de irritabilidade dentro do esperado para a idade na maioria dos contextos.", tone: "ok" },
    { min: 4, max: 7, risk: "Irritabilidade elevada", description: "Irritabilidade acima do habitual (literatura usa ≥ 4 como clinicamente relevante em amostras de pesquisa). Avalie prejuízo funcional, comorbidades (TDAH, TOD, depressão) e contexto familiar/escolar.", tone: "warn" },
    { min: 8, max: 12, risk: "Irritabilidade grave", description: "Irritabilidade acentuada e persistente. Investigue transtorno de desregulação disruptiva do humor, TOD, transtornos de humor e fatores ambientais; considere intervenção estruturada.", tone: "alert" },
  ],
  source: "Stringaris A, Goodman R, Ferdinando S, et al. (2012). J Child Psychol Psychiatry 53(11):1109-1117. Uso livre em clínica/pesquisa.",
};

// ============================================================
// Viking Speech Scale — Inteligibilidade de fala na PC
// Classificação em 4 níveis (Pennington et al., 2010/2013). Uso livre.
// ============================================================
const VIKING: InteractiveScaleDef = {
  id: "viking-speech",
  name: "Viking Speech Scale",
  fullName: "Viking Speech Scale — Inteligibilidade de fala em paralisia cerebral",
  respondent: "Clínico (com pais/cuidador)",
  ageLabel: "≥ 4 anos (PC)",
  instructions:
    "Classifique a fala HABITUAL da criança no dia a dia, considerando ouvintes familiares e não familiares. Escolha o nível que melhor descreve a inteligibilidade.",
  validationNote: "Descritores resumidos — confirme com a publicação original/versão validada antes do uso formal.",
  items: [
    {
      text: "Nível de inteligibilidade da fala",
      options: [
        { label: "Nível I — A fala não é afetada pela desordem motora", value: 1 },
        { label: "Nível II — Fala imprecisa, mas habitualmente inteligível para ouvintes não familiares", value: 2 },
        { label: "Nível III — Fala pouco clara; habitualmente inteligível apenas para ouvintes familiares", value: 3 },
        { label: "Nível IV — Sem fala inteligível", value: 4 },
      ],
    },
  ],
  bands: [
    { min: 1, max: 1, risk: "Nível I", description: "Fala não afetada. Acompanhe o desenvolvimento de linguagem normalmente.", tone: "ok" },
    { min: 2, max: 2, risk: "Nível II", description: "Fala imprecisa porém funcional com estranhos. Considere fonoterapia para precisão articulatória.", tone: "ok" },
    { min: 3, max: 3, risk: "Nível III", description: "Inteligível só para familiares. Indique fonoterapia intensiva e considere apoio de comunicação suplementar.", tone: "warn" },
    { min: 4, max: 4, risk: "Nível IV", description: "Sem fala inteligível. Priorize Comunicação Aumentativa e Alternativa (CAA) — o app inclui módulo CAA gratuito.", tone: "alert" },
  ],
  source: "Pennington L, Virella D, Mjøen T, et al. (2013). Res Dev Disabil 34(10):3202-3210. Classificação de uso livre.",
};

// ============================================================
// Mini-MACS — Manual Ability Classification System (1–4 anos)
// Classificação em 5 níveis (Eliasson et al., 2017). Uso livre com citação.
// ============================================================
const MINIMACS: InteractiveScaleDef = {
  id: "mini-macs",
  name: "Mini-MACS",
  fullName: "Mini Manual Ability Classification System — habilidade manual (PC, 1–4 anos)",
  respondent: "Clínico (com pais/cuidador)",
  ageLabel: "1–4 anos (PC)",
  instructions:
    "Classifique como a criança HABITUALMENTE manuseia objetos apropriados para a idade em casa/creche — desempenho típico, não o máximo. Decida junto com quem convive com a criança.",
  validationNote: "Descritores resumidos — confirme com a brochura oficial (macs.nu) antes do uso formal.",
  items: [
    {
      text: "Nível de habilidade manual habitual",
      options: [
        { label: "Nível I — Manuseia objetos com facilidade e sucesso", value: 1 },
        { label: "Nível II — Manuseia a maioria dos objetos, com alguma redução de qualidade/velocidade", value: 2 },
        { label: "Nível III — Manuseia com dificuldade; precisa de ajuda para preparar/adaptar atividades", value: 3 },
        { label: "Nível IV — Manuseia poucos objetos facilmente manejáveis e precisa de apoio contínuo", value: 4 },
        { label: "Nível V — Não manuseia objetos; habilidade gravemente limitada mesmo para ações simples", value: 5 },
      ],
    },
  ],
  bands: [
    { min: 1, max: 1, risk: "Nível I", description: "Independência manual adequada para a idade.", tone: "ok" },
    { min: 2, max: 2, risk: "Nível II", description: "Limitação leve de qualidade/velocidade; estimulação dirigida.", tone: "ok" },
    { min: 3, max: 3, risk: "Nível III", description: "Necessita preparo/adaptação das atividades; terapia ocupacional indicada.", tone: "warn" },
    { min: 4, max: 4, risk: "Nível IV", description: "Apoio contínuo necessário; planeje adaptações e tecnologia assistiva.", tone: "warn" },
    { min: 5, max: 5, risk: "Nível V", description: "Dependência total para manuseio; foco em posicionamento, tecnologia assistiva e participação.", tone: "alert" },
  ],
  source: "Eliasson AC, Ullenhag A, Wahlström U, Krumlinde-Sundholm L (2017). Dev Med Child Neurol 59(1):72-78. Uso livre com citação (macs.nu).",
};

// ============================================================
// BFMF — Bimanual Fine Motor Function (Beckung & Hagberg, 2002)
// Classificação em 5 níveis da função motora fina bimanual na PC.
// ============================================================
const BFMF: InteractiveScaleDef = {
  id: "bfmf",
  name: "BFMF",
  fullName: "Bimanual Fine Motor Function — função motora fina bimanual (PC)",
  respondent: "Clínico",
  ageLabel: "3–18 anos (PC)",
  instructions:
    "Classifique a função motora fina considerando as DUAS mãos, conforme o desempenho habitual da criança.",
  validationNote: "Descritores resumidos — confirme com a publicação original antes do uso formal.",
  items: [
    {
      text: "Nível de função motora fina bimanual",
      options: [
        { label: "Nível I — Uma mão manipula sem restrições; a outra, sem restrições ou com limitação apenas em habilidades finas avançadas", value: 1 },
        { label: "Nível II — Uma mão manipula sem restrições; a outra apenas segura ou tem limitação evidente", value: 2 },
        { label: "Nível III — Ambas as mãos com limitação; uma manipula com ajuda/adaptação", value: 3 },
        { label: "Nível IV — Função limitada nas duas mãos; no máximo segura objetos com apoio", value: 4 },
        { label: "Nível V — Não segura nem manipula; dependência total", value: 5 },
      ],
    },
  ],
  bands: [
    { min: 1, max: 1, risk: "Nível I", description: "Função fina preservada ou quase; estimule habilidades avançadas.", tone: "ok" },
    { min: 2, max: 2, risk: "Nível II", description: "Assimetria funcional relevante; considere terapia de uso forçado/bimanual.", tone: "ok" },
    { min: 3, max: 3, risk: "Nível III", description: "Limitação bilateral com manipulação assistida; terapia ocupacional dirigida.", tone: "warn" },
    { min: 4, max: 4, risk: "Nível IV", description: "Função restrita à preensão com apoio; adaptações e tecnologia assistiva.", tone: "warn" },
    { min: 5, max: 5, risk: "Nível V", description: "Sem preensão funcional; foco em posicionamento e participação assistida.", tone: "alert" },
  ],
  source: "Beckung E, Hagberg G (2002). Dev Med Child Neurol 44(5):309-316.",
};

// ============================================================
// GAD-7 — Generalized Anxiety Disorder 7-item (autorrelato, adolescente)
// Spitzer RL, Kroenke K, Williams JBW, Löwe B. Arch Intern Med. 2006.
// Domínio público. Cada item 0–3; total 0–21. Cortes: 5/10/15 (leve/moderada/
// grave); ≥10 sugere transtorno de ansiedade provável.
// ============================================================
const GAD7_OPTIONS: InteractiveOption[] = [
  { label: "Nenhuma vez", value: 0 },
  { label: "Vários dias", value: 1 },
  { label: "Mais da metade dos dias", value: 2 },
  { label: "Quase todos os dias", value: 3 },
];
const GAD7: InteractiveScaleDef = {
  id: "gad7ped",
  name: "GAD-7",
  fullName: "Generalized Anxiety Disorder 7-item — autorrelato",
  respondent: "Criança/adolescente",
  ageLabel: "12–18 anos",
  instructions:
    "Nas últimas 2 semanas, com que frequência você foi incomodado(a) pelos seguintes problemas?",
  validationNote:
    "Itens conforme a versão validada em português (Moreno et al.). Confirme a redação antes do uso formal. Corte ≥ 10 sugere ansiedade provável.",
  items: [
    "Sentir-se nervoso(a), ansioso(a) ou muito tenso(a)",
    "Não conseguir parar ou controlar as preocupações",
    "Preocupar-se muito com diversas coisas",
    "Dificuldade para relaxar",
    "Ficar tão agitado(a) que se torna difícil permanecer parado(a)",
    "Ficar facilmente aborrecido(a) ou irritável",
    "Sentir medo como se algo terrível fosse acontecer",
  ].map((text) => ({ text, options: GAD7_OPTIONS })),
  bands: [
    { min: 0, max: 4, risk: "Ansiedade mínima", description: "Sintomas mínimos. Acompanhamento de rotina; reavalie se houver piora.", tone: "ok" },
    { min: 5, max: 9, risk: "Ansiedade leve", description: "Sintomas leves. Monitorize; oriente estratégias e reavalie em algumas semanas.", tone: "warn" },
    { min: 10, max: 14, risk: "Ansiedade moderada", description: "≥10: ansiedade provável. Avaliação clínica e considerar intervenção.", tone: "alert" },
    { min: 15, max: 21, risk: "Ansiedade grave", description: "Sintomas graves. Avaliação clínica prioritária e plano terapêutico.", tone: "alert" },
  ],
  source: "Spitzer RL, Kroenke K, Williams JBW, Löwe B (2006), Arch Intern Med 166:1092-1097. Cortes 5/10/15.",
};

// ============================================================
// SMFQ — Short Mood and Feelings Questionnaire (autorrelato, criança)
// Angold A, Costello EJ, et al. 1995. Livre para uso clínico/pesquisa.
// 13 itens; 0 (Não é verdade) / 1 (Às vezes) / 2 (Verdade); total 0–26.
// Corte ≥ 8 sugere possíveis sintomas depressivos.
// ============================================================
const SMFQ_OPTIONS: InteractiveOption[] = [
  { label: "Não é verdade", value: 0 },
  { label: "Às vezes", value: 1 },
  { label: "Verdade", value: 2 },
];
const SMFQ: InteractiveScaleDef = {
  id: "smfq",
  name: "SMFQ",
  fullName: "Short Mood and Feelings Questionnaire — autorrelato",
  respondent: "Criança/adolescente",
  ageLabel: "5–12 anos",
  instructions:
    "Pensando nas últimas 2 semanas, marque o quanto cada frase descreveu como você se sentiu ou agiu.",
  validationNote:
    "Tradução para uso clínico (verifique a redação validada em português antes do uso formal). Corte ≥ 8 sugere sintomas depressivos — se positivo, avalie risco e ideação.",
  items: [
    "Eu me senti muito triste ou infeliz.",
    "Eu não consegui aproveitar ou gostar de nada.",
    "Eu me senti tão cansado(a) que só queria sentar e não fazer nada.",
    "Eu fiquei muito agitado(a) ou inquieto(a).",
    "Eu senti que não valia mais nada.",
    "Eu chorei bastante.",
    "Tive dificuldade para pensar ou me concentrar.",
    "Eu me odiei.",
    "Eu achei que era uma pessoa ruim.",
    "Eu me senti sozinho(a).",
    "Eu achei que ninguém gostava de verdade de mim.",
    "Eu achei que nunca seria tão bom(boa) quanto as outras crianças.",
    "Eu senti que fazia tudo errado.",
  ].map((text) => ({ text, options: SMFQ_OPTIONS })),
  bands: [
    { min: 0, max: 7, risk: "Abaixo do corte", description: "Pontuação abaixo de 8. Sem rastreio positivo para sintomas depressivos no momento; reavalie se houver mudança.", tone: "ok" },
    { min: 8, max: 26, risk: "Rastreio positivo", description: "≥ 8: sugere sintomas depressivos. Aprofunde a avaliação e investigue ativamente risco/ideação suicida. Triagem não confirma diagnóstico.", tone: "alert" },
  ],
  source: "Angold A, Costello EJ, et al. (1995). Short Mood and Feelings Questionnaire. Corte ≥ 8.",
};

// ============================================================
// PSC-17 — Pediatric Symptom Checklist-17 (pais/cuidador)
// Gardner W et al. (1999/2007). Domínio público (Massachusetts General Hospital).
// 17 itens; 0 (Nunca) / 1 (Às vezes) / 2 (Frequentemente); total 0–34.
// Corte total ≥ 17 sugere comprometimento psicossocial (rastreio positivo).
// Subescalas: internalizante (≥5), atenção (≥7), externalizante (≥7).
// ============================================================
const PSC17_OPTIONS: InteractiveOption[] = [
  { label: "Nunca", value: 0 },
  { label: "Às vezes", value: 1 },
  { label: "Frequentemente", value: 2 },
];
const PSC17: InteractiveScaleDef = {
  id: "psc17",
  name: "PSC-17",
  fullName: "Pediatric Symptom Checklist-17 — pais/cuidador",
  respondent: "Pais/cuidador",
  ageLabel: "4–16 anos",
  instructions:
    "Marque a frequência com que cada situação descreve a criança/adolescente nos últimos tempos.",
  validationNote:
    "Tradução para uso clínico (confirme a redação validada em português). Rastreio de banda larga — corte total ≥ 17 sugere comprometimento psicossocial; subescalas: internalizante ≥5, atenção ≥7, externalizante ≥7.",
  items: [
    // Internalizante
    "Sente-se triste ou infeliz",
    "Sente-se sem esperança",
    "Deprecia a si mesmo(a) (acha que não presta)",
    "Preocupa-se muito",
    "Parece estar se divertindo menos",
    // Atenção
    "Fica inquieto(a), não consegue ficar parado(a)",
    "Sonha acordado(a) em excesso",
    "Distrai-se com facilidade",
    "Tem dificuldade de concentração",
    "Age como se estivesse 'a mil' (movido(a) a motor)",
    // Externalizante
    "Briga com outras crianças",
    "Não segue regras",
    "Não entende os sentimentos das outras pessoas",
    "Implica ou provoca os outros",
    "Culpa os outros pelos próprios problemas",
    "Recusa-se a dividir/compartilhar",
    "Pega coisas que não lhe pertencem",
  ].map((text) => ({ text, options: PSC17_OPTIONS })),
  bands: [
    { min: 0, max: 16, risk: "Rastreio negativo", description: "Abaixo do corte total (≥17). Sem rastreio positivo de comprometimento psicossocial; mantenha vigilância de rotina.", tone: "ok" },
    { min: 17, max: 34, risk: "Rastreio positivo", description: "≥17: sugere comprometimento psicossocial. Aprofunde a avaliação (verifique também as subescalas internalizante/atenção/externalizante). Triagem não confirma diagnóstico.", tone: "alert" },
  ],
  source: "Gardner W, Murphy M, Childs G, et al. (1999); Pediatric Symptom Checklist-17. Domínio público (MGH). Corte total ≥ 17.",
};

export const interactiveScales: Record<string, InteractiveScaleDef> = {
  "q-chat-10": QCHAT10,
  "psc17": PSC17,
  "fps-r": FPSR,
  // O catálogo tem também a entrada "faces" (FPS-R) — mesma aplicação.
  faces: { ...FPSR, id: "faces" },
  "nrs-pain": NRSPAIN,
  "vas-pain": VASPAIN,
  ari: ARI,
  "viking-speech": VIKING,
  "mini-macs": MINIMACS,
  bfmf: BFMF,
  "gad7ped": GAD7,
  "smfq": SMFQ,
};

export function getInteractiveScale(id: string | undefined): InteractiveScaleDef | null {
  if (!id) return null;
  return interactiveScales[id] ?? null;
}
