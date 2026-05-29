/* NeuroPed EDJ — Inventários de Impacto Pós-Medicação (autorais)
   Acompanhamento da RESPOSTA PERCEBIDA ao tratamento medicamentoso,
   em duas visões independentes (família e escola), para triangulação.
   Não medem eficácia farmacológica nem são escalas validadas. */
(function () {
  "use strict";

  var COMMON_DISC =
    "Inventário autoral de acompanhamento da resposta percebida ao tratamento. " +
    "Não é escala validada/normatizada, não mede eficácia farmacológica e não " +
    "estabelece conduta. A decisão sobre manter, ajustar ou suspender medicação é " +
    "exclusivamente médica, individual e presencial.";

  var IMPROVE_OPTIONS = ["Piorou", "Sem mudança", "Melhora leve", "Melhora moderada", "Melhora importante"];

  var SIDE_EFFECTS = [
    "Perda de apetite", "Dificuldade para dormir", "Dor de cabeça",
    "Dor de barriga / náusea", "Tristeza ou choro fácil", "Tiques (piscar, sons)",
    "Irritabilidade de rebote (fim da tarde)", "Sonolência excessiva",
    "Aceleração / coração disparado", "Apatia / 'criança apagada'"
  ];

  var IMPACTO = [
    {
      id: "npe-med-pais", code: "NPE-MED-PAIS",
      title: "💊 Impacto Pós-Medicação — Visão da Família",
      short_title: "Pós-medicação (família)",
      emoji: "💊",
      audience: "familia", audience_label: "Heterorrelato — família/cuidadores",
      respondent: ["pais"],
      age_min_months: 36, age_max_months: 216, age_band: "3–18 anos",
      domain: "Resposta terapêutica / acompanhamento",
      nature: "autoral", npe: true,
      page: "impacto-medicacao.html", anchor: "pais",
      priority: 90,
      improvement_scale: true,
      options: IMPROVE_OPTIONS,
      side_effects: SIDE_EFFECTS,
      symptoms: ["melhora pós-medicação", "atenção", "comportamento", "sono", "apetite", "efeitos colaterais"],
      keywords: ["medicacao", "medicação", "remedio", "remédio", "metilfenidato", "ritalina", "concerta",
        "risperidona", "aripiprazol", "melhora", "pos medicacao", "pós medicação", "efeito colateral",
        "colateral", "tratamento", "resposta ao tratamento", "reavaliacao", "reavaliação", "acompanhamento"],
      complaints: ["medicacao", "tdah", "tea", "comportamento", "sono", "apetite", "humor"],
      plain_questions: [
        "A atenção/concentração da criança melhorou em casa e nas tarefas?",
        "A agitação/inquietude diminuiu?",
        "A impulsividade (agir sem pensar, interromper) diminuiu?",
        "A irritabilidade/oposição/birras melhoraram?",
        "O humor e a interação em casa melhoraram?",
        "A organização para começar e terminar atividades melhorou?",
        "O sono melhorou (pegar no sono e manter)?",
        "O apetite/alimentação se manteve adequado?",
        "A rotina do dia acontece com menos conflito?",
        "No geral, a família percebe que valeu a pena manter o tratamento?"
      ],
      not_normative_disclaimer: COMMON_DISC
    },
    {
      id: "npe-med-escola", code: "NPE-MED-ESC",
      title: "💊 Impacto Pós-Medicação — Visão da Escola",
      short_title: "Pós-medicação (escola)",
      emoji: "💊",
      audience: "escola", audience_label: "Heterorrelato — escola/professores",
      respondent: ["escola"],
      age_min_months: 48, age_max_months: 216, age_band: "4–18 anos",
      domain: "Resposta terapêutica / acompanhamento",
      nature: "autoral", npe: true,
      page: "impacto-medicacao.html", anchor: "escola",
      priority: 90,
      improvement_scale: true,
      options: IMPROVE_OPTIONS,
      side_effects: SIDE_EFFECTS,
      symptoms: ["melhora pós-medicação", "atenção em aula", "tarefas", "impulsividade", "rendimento", "disciplina"],
      keywords: ["medicacao", "medicação", "remedio", "remédio", "metilfenidato", "ritalina", "concerta",
        "melhora", "pos medicacao", "pós medicação", "efeito colateral", "tratamento", "resposta ao tratamento",
        "professor", "professora", "escola", "rendimento", "aula", "reavaliacao", "reavaliação", "acompanhamento"],
      complaints: ["medicacao", "tdah", "escola", "aprendizagem", "comportamento"],
      plain_questions: [
        "A atenção nas aulas melhorou?",
        "A criança termina as tarefas dentro do tempo?",
        "A agitação / sair do lugar diminuiu?",
        "A impulsividade (responder sem esperar, interromper) diminuiu?",
        "A criança espera a vez e segue combinados com mais facilidade?",
        "A interação com colegas melhorou?",
        "A organização do material e da agenda melhorou?",
        "O rendimento em leitura, escrita ou cálculo melhorou?",
        "Houve menos queixas disciplinares/ocorrências?",
        "No geral, a escola percebe diferença positiva no aprendizado?"
      ],
      not_normative_disclaimer: COMMON_DISC
    }
  ];

  window.NEUROPED_IMPACTO = IMPACTO;
  window.NEUROPED_EDITORIAL_SCALES = (window.NEUROPED_EDITORIAL_SCALES || []).concat(IMPACTO);
})();
