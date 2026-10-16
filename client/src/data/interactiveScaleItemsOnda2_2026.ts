// ============================================================
// Onda 2 do plano de escalas (15/10/2026): saúde mental ampla e
// seguimento (PHQ-2, PSC-35, CES-DC, HAM-D, CGAS) e função motora
// (FMS). Todos de domínio público ou uso livre; grade em REDAÇÃO
// PRÓPRIA, fiel ao construto. Cortes originais só onde a pontuação
// é a mesma do instrumento. Nenhum estabelece diagnóstico.
// ============================================================
import type { InteractiveScaleDef } from "./interactiveScaleItems";

const PHQ_LABELS = ["Nenhuma vez", "Vários dias", "Mais da metade dos dias", "Quase todos os dias"];
const SEV_0_4 = ["0 · Ausente", "1 · Leve", "2 · Moderado", "3 · Grave", "4 · Muito grave"];
const SEV_0_2 = ["0 · Ausente", "1 · Leve ou duvidoso", "2 · Claramente presente"];

const DESCRIPTIVE_BAND = [
  { minPct: 0, classification: "Perfil descritivo", color: "amber", description: "Sem ponto de corte aplicável a esta versão. Leia item a item e compare com aplicações anteriores do mesmo paciente. Não é diagnóstico." },
] as const;

export const onda2Items2026: Record<string, InteractiveScaleDef> = {
  "phq2": {
    instruction: "Nas últimas 2 semanas, com que frequência você foi incomodado(a) por cada um dos problemas abaixo?",
    infoBox: "PHQ-2 (Kroenke, Spitzer & Williams, 2003; domínio público). Primeiro passo do rastreio de depressão: escore 0–6; ≥ 3 indica aplicar o PHQ-A completo. Não é diagnóstico.",
    labels: PHQ_LABELS,
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "PHQ-2 (0–6)",
    instrumentVersion: "phq2-v1",
    bands: [
      { minPct: 0, classification: "Rastreio negativo (0–2)", color: "emerald", description: "Sem indicação de aprofundar agora; repetir se surgirem sinais." },
      { minPct: 50, classification: "Rastreio positivo (≥ 3)", color: "orange", description: "Aplicar o PHQ-A completo e avaliar clinicamente." },
    ],
    domains: [{ name: "Últimas 2 semanas", items: [
      "Pouco interesse ou pouco prazer em fazer as coisas",
      "Sentir-se para baixo, deprimido(a) ou sem esperança",
    ] }],
  },

  "psc35": {
    instruction: "Marque com que frequência cada situação acontece com a criança.",
    infoBox: "PSC-35 — Pediatric Symptom Checklist (Jellinek et al., 1988; domínio público). Redação própria. Itens 0–2 (nunca, às vezes, frequentemente); total 0–70. Corte ≥ 28 para 6–16 anos; aos 4–5 anos o corte é ≥ 24. Subescalas de referência: atenção ≥ 7 (itens 4, 7, 8, 9, 14), internalização ≥ 5 (11, 13, 19, 22, 27), externalização ≥ 7 (16, 29, 31, 32, 33, 34, 35). Triagem, não diagnóstico.",
    labels: ["Nunca", "Às vezes", "Frequentemente"],
    optionPoints: [0, 1, 2],
    scoreDirection: "higher_worse",
    totalLabel: "PSC-35 (0–70)",
    instrumentVersion: "psc35-v1",
    bands: [
      { minPct: 0, classification: "Abaixo do corte (0–23)", color: "emerald", description: "Sem indicação de prejuízo psicossocial nesta triagem." },
      { minPct: 34.2, classification: "24–27: positivo só aos 4–5 anos", color: "amber", description: "Aos 4–5 anos já é positivo (≥ 24); de 6 a 16 anos fica abaixo do corte. Confira a idade." },
      { minPct: 40, classification: "Positivo (≥ 28)", color: "orange", description: "Sugere prejuízo psicossocial: avaliação clínica dirigida, olhando as subescalas." },
    ],
    domains: [{ name: "Comportamento e emoções", items: [
      "Reclama de dores", "Passa mais tempo sozinho(a)", "Cansa fácil, tem pouca energia", "Inquieto(a), não consegue ficar sentado(a)",
      "Tem problemas com o(a) professor(a)", "Perdeu interesse pela escola", "Age como se estivesse ligado(a) num motor", "Fica sonhando acordado(a) demais",
      "Distrai-se com facilidade", "Tem medo de situações novas", "Sente-se triste, infeliz", "Fica irritado(a), com raiva",
      "Sente-se sem esperança", "Tem dificuldade para se concentrar", "Perdeu interesse pelos amigos", "Briga com outras crianças",
      "Falta à escola", "As notas estão caindo", "Fala mal de si mesmo(a)", "Vai ao médico e o médico não encontra nada",
      "Tem dificuldade para dormir", "Preocupa-se muito", "Quer ficar com você mais do que antes", "Acha que é mau(má)",
      "Corre riscos desnecessários", "Machuca-se com frequência", "Parece estar se divertindo menos", "Age como se fosse mais novo(a) do que é",
      "Não obedece às regras", "Não demonstra os sentimentos", "Não entende o que os outros sentem", "Provoca os outros",
      "Culpa os outros pelos próprios problemas", "Pega coisas que não são dele(a)", "Recusa-se a compartilhar",
    ] }],
  },

  "ces-dc": {
    instruction: "Pense na ÚLTIMA SEMANA. Marque o quanto você se sentiu ou agiu assim.",
    infoBox: "CES-DC — Center for Epidemiological Studies Depression Scale for Children (Weissman et al., 1980; domínio público). Redação própria. 20 itens 0–3; os itens 4, 8, 12 e 16 são positivos e pontuam ao contrário. Total 0–60; ≥ 15 sugere sintomas depressivos relevantes. Triagem, não diagnóstico.",
    labels: ["Nem um pouco", "Um pouco", "Mais ou menos", "Muito"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "CES-DC (0–60)",
    instrumentVersion: "ces-dc-v1",
    bands: [
      { minPct: 0, classification: "Abaixo do corte (0–14)", color: "emerald", description: "Sem indicação de sintomas depressivos relevantes nesta triagem." },
      { minPct: 25, classification: "Sintomas relevantes (≥ 15)", color: "orange", description: "Avaliação clínica do humor; considerar PHQ-A a partir de 11 anos." },
    ],
    domains: [{ name: "Última semana", items: [
      "Fiquei incomodado(a) com coisas que normalmente não me incomodam",
      "Não tive vontade de comer, estava sem fome",
      "Não consegui me sentir feliz, mesmo quando família ou amigos tentaram ajudar",
      { text: "Senti que eu era tão bom(boa) quanto as outras crianças", reversed: true },
      "Senti que não conseguia prestar atenção no que estava fazendo",
      "Senti-me para baixo e infeliz",
      "Senti-me cansado(a) demais para fazer as coisas",
      { text: "Senti que alguma coisa boa ia acontecer", reversed: true },
      "Senti que as coisas que eu fazia antes não davam mais certo",
      "Senti medo",
      "Não dormi tão bem quanto costumo",
      { text: "Estive feliz", reversed: true },
      "Fiquei mais quieto(a) do que o normal",
      "Senti-me sozinho(a), como se não tivesse amigos",
      "Senti que as crianças que conheço não eram simpáticas ou não queriam ficar comigo",
      { text: "Diverti-me", reversed: true },
      "Tive vontade de chorar",
      "Senti-me triste",
      "Senti que as pessoas não gostavam de mim",
      "Foi difícil começar a fazer as coisas",
    ] }],
  },

  "hamd": {
    instruction: "Entrevista clínica sobre a ÚLTIMA SEMANA. Pontue cada item pela opção que melhor descreve o paciente.",
    infoBox: "HAM-D 17 — Escala de Hamilton para Depressão (Hamilton, 1960; domínio público). Redação própria das âncoras. Itens 0–4 ou 0–2; total 0–52: 0–7 normal · 8–13 leve · 14–18 moderada · 19–22 grave · ≥ 23 muito grave. Validada em adultos; em adolescentes, use com cautela. O item 3 é sentinela de risco.",
    labels: SEV_0_4,
    optionPoints: [0, 1, 2, 3, 4],
    scoreDirection: "higher_worse",
    totalLabel: "HAM-D 17 (0–52)",
    instrumentVersion: "hamd-v1",
    bands: [
      { minPct: 0, classification: "Sem depressão (0–7)", color: "emerald", description: "Sem sintomas depressivos relevantes." },
      { minPct: 15.3, classification: "Depressão leve (8–13)", color: "amber", description: "Sintomas leves: acompanhar e rever o plano." },
      { minPct: 26.9, classification: "Depressão moderada (14–18)", color: "orange", description: "Sintomas moderados: tratamento estruturado." },
      { minPct: 36.5, classification: "Depressão grave (19–22)", color: "red", description: "Sintomas graves: tratamento especializado e seguimento próximo." },
      { minPct: 44.2, classification: "Depressão muito grave (≥ 23)", color: "red", description: "Prioridade máxima; avaliar segurança." },
    ],
    domains: [{ name: "Última semana", items: [
      { text: "Humor deprimido", example: "Tristeza, desesperança, desamparo; relatado ou percebido." },
      { text: "Sentimentos de culpa", example: "De autocensura até ideias de culpa ou de castigo." },
      {
        text: "Ideias de morte ou suicídio",
        example: "1 = acha que a vida não vale a pena · 2 = deseja estar morto · 3 = ideias ou gestos suicidas · 4 = tentativa.",
        sentinel: { positiveOptionIndexes: [1, 2, 3, 4], label: "Ideação ou comportamento suicida" },
      },
      { text: "Insônia inicial", options: SEV_0_2, example: "Demora para pegar no sono." },
      { text: "Insônia intermediária", options: SEV_0_2, example: "Acorda durante a noite." },
      { text: "Insônia tardia", options: SEV_0_2, example: "Acorda cedo e não volta a dormir." },
      { text: "Trabalho, escola e atividades", example: "Perda de interesse, queda de rendimento, abandono de atividades." },
      { text: "Lentificação", example: "Pensamento e fala lentos, concentração prejudicada, atividade motora reduzida." },
      { text: "Agitação", example: "Inquietação, mexer as mãos, não conseguir ficar parado." },
      { text: "Ansiedade psíquica", example: "Tensão, irritabilidade, preocupação, apreensão." },
      { text: "Ansiedade somática", example: "Boca seca, palpitações, sudorese, sintomas digestivos, respiratórios." },
      { text: "Sintomas gastrointestinais", options: SEV_0_2, example: "Perda de apetite, sensação de peso no abdome." },
      { text: "Sintomas somáticos gerais", options: SEV_0_2, example: "Cansaço, dores no corpo, cabeça pesada." },
      { text: "Interesse sexual e sintomas genitais", options: SEV_0_2, example: "Aplique conforme a idade; adolescentes: perda de interesse." },
      { text: "Hipocondria", example: "Preocupação excessiva com a saúde." },
      { text: "Perda de peso", options: SEV_0_2, example: "1 = provável · 2 = definida pelo relato ou pela balança." },
      { text: "Crítica sobre a doença", options: ["0 · Reconhece que está deprimido", "1 · Reconhece, mas atribui a outras causas", "2 · Nega estar doente"] },
    ] }],
  },

  "cgas": {
    instruction: "Pense no funcionamento do paciente no ÚLTIMO MÊS em casa, na escola e com os amigos. Escolha a faixa que melhor descreve o PIOR período desse mês.",
    infoBox: "CGAS — Children's Global Assessment Scale (Shaffer et al., 1983; domínio público). Redação própria das âncoras. Escala única de 1 a 100 (maior = melhor); acima de 70 costuma indicar funcionamento normal. Escolha a faixa e, se quiser, registre o número exato no prontuário. Não é diagnóstico.",
    labels: ["—"],
    scoreDirection: "higher_better",
    totalLabel: "CGAS — faixa escolhida",
    instrumentVersion: "cgas-v1",
    descriptiveDomainSummary: true,
    bands: [...DESCRIPTIVE_BAND],
    domains: [{ name: "Funcionamento global", items: [
      { text: "Faixa de funcionamento no último mês", options: [
        "91–100 · Funcionamento superior em todas as áreas",
        "81–90 · Bom funcionamento; só problemas passageiros do dia a dia",
        "71–80 · Prejuízo leve e passageiro, reação esperada a estressores",
        "61–70 · Alguma dificuldade em uma área, mas funciona bem em geral",
        "51–60 · Funcionamento variável, dificuldades esporádicas em várias áreas",
        "41–50 · Prejuízo moderado na maioria das áreas ou grave em uma",
        "31–40 · Prejuízo importante em várias áreas; incapaz em uma delas",
        "21–30 · Incapaz de funcionar em quase todas as áreas",
        "11–20 · Precisa de supervisão considerável para não se ferir",
        "1–10 · Precisa de supervisão constante (24 horas)",
      ] },
    ] }],
  },

  "fms": {
    instruction: "Para cada distância, escolha como a criança se locomove HABITUALMENTE (não o melhor desempenho). Pergunte à família e confira com a observação.",
    infoBox: "FMS — Functional Mobility Scale (Graham et al., 2004; uso livre). Redação própria. Três distâncias: 5 m (casa), 50 m (escola) e 500 m (comunidade). Notas 6 (independente em qualquer superfície) a 1 (cadeira de rodas), C (engatinha) e N (não se aplica, ex.: não percorre a distância). O resultado é o trio de notas (ex.: 5-5-1), não uma soma.",
    labels: ["—"],
    scoreDirection: "higher_better",
    totalLabel: "FMS — trio de notas",
    instrumentVersion: "fms-v1",
    descriptiveDomainSummary: true,
    bands: [...DESCRIPTIVE_BAND],
    domains: [{ name: "Mobilidade por distância", items: [
      { text: "5 metros (em casa)", options: FMS_OPTIONS() },
      { text: "50 metros (na escola)", options: FMS_OPTIONS() },
      { text: "500 metros (na comunidade, shopping)", options: FMS_OPTIONS() },
    ] }],
  },
};

function FMS_OPTIONS(): string[] {
  return [
    "6 · Independente em qualquer superfície",
    "5 · Independente no plano; precisa de corrimão em escadas",
    "4 · Usa bengala(s) ou muleta de antebraço sem ajuda",
    "3 · Usa muletas",
    "2 · Usa andador",
    "1 · Usa cadeira de rodas",
    "C · Engatinha",
    "N · Não se aplica (não percorre essa distância)",
  ];
}
