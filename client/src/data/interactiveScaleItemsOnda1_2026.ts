// ============================================================
// Onda 1 do plano de escalas (15/10/2026): efeitos adversos de
// medicação, seguimento de humor/tiques/TDAH e saúde mental do
// cuidador.
//
// Política de conteúdo (mesma do restante do acervo):
//  - PHQ-9 e GAD-7 são de domínio público: texto da versão pública em
//    português (a do GAD-7 é a mesma já usada em /generic-scale/gad7).
//  - AIMS, Simpson-Angus, CGI, PUTS, P-YMRS e SWAN: grade de aplicação
//    em REDAÇÃO PRÓPRIA, fiel ao construto. Cortes originais aparecem
//    só como referência no infoBox quando a pontuação é equivalente;
//    onde não é (P-YMRS sem ponderação, SWAN sem norma brasileira), o
//    resultado é descritivo.
// Nenhum destes instrumentos estabelece diagnóstico.
// ============================================================
import type { InteractiveScaleDef } from "./interactiveScaleItems";

const PHQ_LABELS = ["Nenhuma vez", "Vários dias", "Mais da metade dos dias", "Quase todos os dias"];
const SEVERITY_0_4 = ["0 · Nenhum", "1 · Mínimo", "2 · Leve", "3 · Moderado", "4 · Grave"];

const DESCRIPTIVE_BAND = [
  { minPct: 0, classification: "Perfil descritivo", color: "amber", description: "Sem ponto de corte aplicável a esta versão. Leia item a item e compare com aplicações anteriores do mesmo paciente. Não é diagnóstico." },
] as const;

export const onda1Items2026: Record<string, InteractiveScaleDef> = {
  // ── Saúde mental do cuidador ───────────────────────────────────────────
  "phq9-cuidador": {
    instruction: "Estas perguntas são sobre VOCÊ, cuidador(a), e não sobre a criança. Nas últimas 2 semanas, com que frequência você foi incomodado(a) por cada um dos problemas abaixo?",
    infoBox: "PHQ-9 (Kroenke, Spitzer & Williams, 2001; domínio público). Escore 0–27: 0–4 mínimo · 5–9 leve · 10–14 moderado · 15–19 moderadamente grave · 20–27 grave. Rastreio do cuidador, não diagnóstico. Qualquer resposta diferente de \"Nenhuma vez\" no item 9 exige conversa sobre segurança no mesmo dia.",
    labels: PHQ_LABELS,
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "Escore PHQ-9 do cuidador (0–27)",
    instrumentVersion: "phq9-cuidador-v1",
    bands: [
      { minPct: 0, classification: "Sintomas mínimos (0–4)", color: "emerald", description: "Poucos sintomas depressivos no cuidador neste momento." },
      { minPct: 18.5, classification: "Sintomas leves (5–9)", color: "amber", description: "Observar, acolher e repetir o rastreio no próximo encontro." },
      { minPct: 37, classification: "Sintomas moderados (10–14)", color: "orange", description: "Sugere depressão clinicamente relevante: orientar avaliação do cuidador na rede de saúde." },
      { minPct: 55.5, classification: "Moderadamente graves (15–19)", color: "red", description: "Encaminhar o cuidador para avaliação e tratamento; considerar o impacto no cuidado da criança." },
      { minPct: 74, classification: "Graves (20–27)", color: "red", description: "Prioridade: avaliação do cuidador sem demora e verificação de segurança." },
    ],
    domains: [{ name: "Últimas 2 semanas (sobre você)", items: [
      "Pouco interesse ou pouco prazer em fazer as coisas",
      "Sentir-se para baixo, deprimido(a) ou sem esperança",
      "Dificuldade para pegar no sono ou permanecer dormindo, ou dormir mais do que de costume",
      "Sentir-se cansado(a) ou com pouca energia",
      "Falta de apetite ou comer demais",
      "Sentir-se mal consigo mesmo(a), ou achar que é um fracasso ou que decepcionou a si mesmo(a) ou sua família",
      "Dificuldade para se concentrar nas coisas, como ler o jornal ou ver televisão",
      "Lentidão para se movimentar ou falar a ponto de outras pessoas perceberem, ou o oposto: estar tão agitado(a) ou inquieto(a) que se mexe muito mais do que de costume",
      {
        text: "Pensar que seria melhor estar morto(a) ou pensar em se ferir de alguma maneira",
        example: "Se a resposta não for \"Nenhuma vez\", fale hoje com a equipe ou procure ajuda (CVV 188, SAMU 192).",
        sentinel: { positiveOptionIndexes: [1, 2, 3], label: "Pensamentos de morte ou de se ferir (cuidador)" },
      },
    ] }],
  },
  "gad7-cuidador": {
    instruction: "Estas perguntas são sobre VOCÊ, cuidador(a), e não sobre a criança. Nas últimas 2 semanas, com que frequência você foi incomodado(a) por cada um dos problemas abaixo?",
    infoBox: "GAD-7 (Spitzer et al., 2006; domínio público). Escore 0–21: 0–4 mínima · 5–9 leve · 10–14 moderada · 15–21 grave. Corte ≥10 = ansiedade clinicamente relevante. Rastreio do cuidador, não diagnóstico.",
    labels: PHQ_LABELS,
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "Escore GAD-7 do cuidador (0–21)",
    instrumentVersion: "gad7-cuidador-v1",
    bands: [
      { minPct: 0, classification: "Ansiedade mínima (0–4)", color: "emerald", description: "Poucos sintomas ansiosos no cuidador neste momento." },
      { minPct: 23, classification: "Ansiedade leve (5–9)", color: "amber", description: "Observar, acolher e repetir o rastreio no próximo encontro." },
      { minPct: 47, classification: "Ansiedade moderada (10–14)", color: "orange", description: "Orientar avaliação do cuidador na rede de saúde." },
      { minPct: 71, classification: "Ansiedade grave (15–21)", color: "red", description: "Encaminhar o cuidador para avaliação e manejo sem demora." },
    ],
    domains: [{ name: "Últimas 2 semanas (sobre você)", items: [
      "Sentir-se nervoso(a), ansioso(a) ou muito tenso(a)",
      "Não conseguir parar ou controlar as preocupações",
      "Preocupar-se demais com diferentes coisas",
      "Dificuldade para relaxar",
      "Ficar tão agitado(a) que se torna difícil permanecer parado(a)",
      "Ficar facilmente aborrecido(a) ou irritado(a)",
      "Sentir medo, como se algo terrível fosse acontecer",
    ] }],
  },

  // ── Efeitos adversos de medicação ──────────────────────────────────────
  "aims-efeitos": {
    instruction: "Exame do clínico. Observe o paciente sentado, em repouso e durante as manobras de ativação (abrir a boca, pôr a língua para fora, bater os dedos no polegar, estender os braços, levantar e caminhar). Pontue o PIOR movimento observado em cada região; pontue um grau abaixo se o movimento só aparece com ativação.",
    infoBox: "AIMS — Abnormal Involuntary Movement Scale (Guy, 1976; NIMH, domínio público). Redação própria da grade. Itens 1–7: gravidade por região (0–4). Itens 8–10: julgamento global. Itens 11–12: estado dentário (texto). Critério de referência (Schooler & Kane): 2 em ≥ 2 regiões ou ≥ 3 em uma região sugere discinesia — leia os itens, não o total. Não é diagnóstico isolado.",
    labels: SEVERITY_0_4,
    optionPoints: [0, 1, 2, 3, 4],
    scoreDirection: "higher_worse",
    totalLabel: "AIMS — soma descritiva dos itens 1–10",
    instrumentVersion: "aims-efeitos-v1",
    descriptiveDomainSummary: true,
    bands: [...DESCRIPTIVE_BAND],
    domains: [
      { name: "Movimentos faciais e orais", items: [
        { text: "Músculos da expressão facial", example: "Movimentos de testa, sobrancelhas, região dos olhos e bochechas; caretas, piscar excessivo." },
        { text: "Lábios e região perioral", example: "Franzir, fazer bico, estalar os lábios." },
        { text: "Mandíbula", example: "Morder, cerrar os dentes, mastigar, abrir a boca, movimentos laterais." },
        { text: "Língua", example: "Pontue só o aumento de movimento dentro e fora da boca, não a incapacidade de manter a língua parada." },
      ] },
      { name: "Extremidades", items: [
        { text: "Membros superiores (braços, punhos, mãos, dedos)", example: "Movimentos coreicos (rápidos, irregulares, sem propósito) ou atetoides (lentos, serpenteantes). Não inclui tremor rítmico." },
        { text: "Membros inferiores (pernas, joelhos, tornozelos, dedos dos pés)", example: "Afastar os joelhos lateralmente, bater o pé, girar o calcanhar, contorcer o pé." },
      ] },
      { name: "Tronco", items: [
        { text: "Pescoço, ombros e quadril", example: "Balançar, torcer, contorcer, movimentos pélvicos." },
      ] },
      { name: "Julgamento global", items: [
        { text: "Gravidade global dos movimentos anormais", example: "Igual ao item de maior pontuação entre 1 e 7." },
        { text: "Incapacidade causada pelos movimentos anormais" },
        { text: "Consciência do paciente sobre os movimentos (sofrimento relatado)", example: "0 = não percebe · 1 = percebe sem sofrimento · 2 = sofrimento leve · 3 = moderado · 4 = grave." },
      ] },
      { name: "Estado dentário", items: [
        { text: "Há problemas atuais com dentes e/ou prótese dentária? (sim/não; descreva)", responseType: "text", required: true, placeholder: "Ex.: não" },
        { text: "O paciente usa prótese dentária habitualmente? (sim/não)", responseType: "text", required: true, placeholder: "Ex.: não" },
      ] },
    ],
  },
  "sas": {
    instruction: "Exame do clínico, com o paciente em repouso e nas manobras indicadas em cada item. Pontue de 0 (normal) a 4 (máximo).",
    infoBox: "Escala de Simpson-Angus (Simpson & Angus, 1970; uso livre). Redação própria da grade. 10 itens 0–4; escore médio = total ÷ 10. Média > 0,3 (total ≥ 4) é a referência usual de parkinsonismo induzido por medicação em adultos; o uso em crianças é extrapolado. Não é diagnóstico isolado.",
    labels: ["0 · Normal", "1 · Leve", "2 · Moderado", "3 · Acentuado", "4 · Extremo"],
    optionPoints: [0, 1, 2, 3, 4],
    scoreDirection: "higher_worse",
    totalLabel: "Simpson-Angus — total (0–40); média = total ÷ 10",
    instrumentVersion: "sas-v1",
    bands: [
      { minPct: 0, classification: "Sem parkinsonismo relevante (total 0–3)", color: "emerald", description: "Média ≤ 0,3. Manter a monitorização conforme a medicação." },
      { minPct: 10, classification: "Sinais extrapiramidais (total ≥ 4)", color: "orange", description: "Média > 0,3: sugere parkinsonismo induzido. Rever dose, tempo de uso e alternativas." },
      { minPct: 40, classification: "Sinais extrapiramidais acentuados (total ≥ 16)", color: "red", description: "Carga alta de sinais: revisão medicamentosa sem demora." },
    ],
    domains: [{ name: "Exame extrapiramidal", items: [
      { text: "Marcha", example: "Redução do balanço dos braços, passos curtos, postura rígida." },
      { text: "Queda dos braços", example: "Braços erguidos à altura dos ombros e soltos: queda lenta ou com pouco rebote." },
      { text: "Balanço dos ombros", example: "Rigidez ao balançar passivamente os ombros." },
      { text: "Rigidez do cotovelo", example: "Resistência à flexão e extensão passiva." },
      { text: "Rigidez do punho", example: "Resistência ao movimento passivo do punho." },
      { text: "Pêndulo das pernas", example: "Sentado na borda da maca, pernas soltas: balanço reduzido." },
      { text: "Queda da cabeça", example: "Deitado, cabeça erguida e solta: queda lenta." },
      { text: "Toque glabelar", example: "Piscadas que não se esgotam com toques repetidos na glabela." },
      { text: "Tremor", example: "Tremor de repouso em mãos, mandíbula ou lábios." },
      { text: "Salivação", example: "Sialorreia ou escape de saliva." },
    ] }],
  },

  // ── Impressão clínica global ───────────────────────────────────────────
  "cgi-s": {
    instruction: "Considerando sua experiência total com esta população de pacientes, qual a gravidade da condição do paciente neste momento?",
    infoBox: "CGI-S — Impressão Clínica Global, Gravidade (Guy, 1976; NIMH, domínio público). 1 item de 1 a 7. Registro do julgamento do clínico para comparar ao longo do seguimento. Não é diagnóstico.",
    labels: ["1 · Normal, não doente", "2 · Limítrofe", "3 · Levemente doente", "4 · Moderadamente doente", "5 · Acentuadamente doente", "6 · Gravemente doente", "7 · Entre os mais gravemente doentes"],
    optionPoints: [1, 2, 3, 4, 5, 6, 7],
    scoreDirection: "higher_worse",
    totalLabel: "CGI-S (1–7)",
    instrumentVersion: "cgi-s-v1",
    bands: [
      { minPct: 0, classification: "1 · Normal", color: "emerald", description: "Sem doença neste momento." },
      { minPct: 20, classification: "2 · Limítrofe", color: "emerald", description: "Sinais limítrofes." },
      { minPct: 40, classification: "3 · Levemente doente", color: "amber", description: "Doença leve." },
      { minPct: 55, classification: "4 · Moderadamente doente", color: "orange", description: "Doença moderada." },
      { minPct: 70, classification: "5 · Acentuadamente doente", color: "orange", description: "Doença acentuada." },
      { minPct: 85, classification: "6 · Gravemente doente", color: "red", description: "Doença grave." },
      { minPct: 99, classification: "7 · Entre os mais graves", color: "red", description: "Entre os pacientes mais graves." },
    ],
    domains: [{ name: "Gravidade atual", items: ["Gravidade da condição do paciente neste momento"] }],
  },
  "cgi-i": {
    instruction: "Comparado à condição do paciente no início do tratamento (ou na avaliação de referência), como ele está agora?",
    infoBox: "CGI-I — Impressão Clínica Global, Melhora (Guy, 1976; NIMH, domínio público). 1 item de 1 a 7. 1–2 costumam ser lidos como resposta ao tratamento. Registre a referência usada na comparação. Não é diagnóstico.",
    labels: ["1 · Muitíssimo melhor", "2 · Muito melhor", "3 · Um pouco melhor", "4 · Sem alteração", "5 · Um pouco pior", "6 · Muito pior", "7 · Muitíssimo pior"],
    optionPoints: [1, 2, 3, 4, 5, 6, 7],
    scoreDirection: "higher_worse",
    totalLabel: "CGI-I (1–7)",
    instrumentVersion: "cgi-i-v1",
    bands: [
      { minPct: 0, classification: "1 · Muitíssimo melhor", color: "emerald", description: "Melhora muito acentuada desde a referência." },
      { minPct: 20, classification: "2 · Muito melhor", color: "emerald", description: "Melhora acentuada desde a referência." },
      { minPct: 40, classification: "3 · Um pouco melhor", color: "amber", description: "Melhora discreta." },
      { minPct: 55, classification: "4 · Sem alteração", color: "amber", description: "Sem mudança desde a referência." },
      { minPct: 70, classification: "5 · Um pouco pior", color: "orange", description: "Piora discreta." },
      { minPct: 85, classification: "6 · Muito pior", color: "red", description: "Piora acentuada." },
      { minPct: 99, classification: "7 · Muitíssimo pior", color: "red", description: "Piora muito acentuada." },
    ],
    domains: [{ name: "Mudança desde a referência", items: ["Melhora global desde o início do tratamento ou da referência"] }],
  },

  // ── Tiques: sensação premonitória ──────────────────────────────────────
  "puts": {
    instruction: "Pense nos seus tiques. Marque o quanto cada frase combina com o que você sente.",
    infoBox: "PUTS — Premonitory Urge for Tics Scale (Woods et al., 2005; uso livre). Redação própria. Itens 1–9 pontuam de 1 a 4 (total 9–36); o item sobre conseguir segurar os tiques é registrado à parte e não entra no total. Sem ponto de corte: maior escore = sensações premonitórias mais intensas, o que ajuda a planejar a terapia comportamental (CBIT). Validade menor abaixo de 10 anos.",
    labels: ["Nem um pouco", "Um pouco", "Bastante", "Muito"],
    optionPoints: [1, 2, 3, 4],
    scoreDirection: "higher_worse",
    totalLabel: "PUTS — soma dos dois blocos; o escore da escala é o 1º bloco (9–36)",
    instrumentVersion: "puts-v1",
    descriptiveDomainSummary: true,
    bands: [...DESCRIPTIVE_BAND],
    domains: [
      { name: "Sensação antes do tique (itens 1–9)", items: [
        "Pouco antes do tique, sinto uma coceira por dentro.",
        "Pouco antes do tique, sinto uma pressão dentro do corpo ou da cabeça.",
        "Pouco antes do tique, fico tenso(a) ou \"elétrico(a)\" por dentro.",
        "Pouco antes do tique, sinto que alguma coisa não está do jeito certo.",
        "Pouco antes do tique, sinto que alguma coisa ficou incompleta.",
        "Pouco antes do tique, sinto uma energia no corpo que precisa sair.",
        "Tenho essas sensações quase sempre antes dos tiques.",
        "Essas sensações aparecem em todos os meus tiques.",
        "Depois que faço o tique, a sensação passa, pelo menos por um tempo.",
      ] },
      { name: "Controle (registrado à parte)", items: [
        "Consigo segurar os tiques, nem que seja por pouco tempo.",
      ] },
    ],
  },

  // ── Humor: versão para pais da escala de mania ─────────────────────────
  "p-ymrs": {
    instruction: "Pense no comportamento do(a) seu(sua) filho(a) na última semana, comparado com o jeito habitual dele(a). Marque a intensidade de cada mudança.",
    infoBox: "P-YMRS — versão para pais da Young Mania Rating Scale (Gracious et al., 2002). Redação própria; 11 itens de 0 a 4, sem a ponderação da escala original. Por isso o resultado é DESCRITIVO: os cortes publicados não se aplicam a esta soma. Serve para acompanhar mudança no mesmo paciente e orientar a entrevista. Não é diagnóstico.",
    labels: ["0 · Ausente", "1 · Leve", "2 · Moderado", "3 · Acentuado", "4 · Grave"],
    optionPoints: [0, 1, 2, 3, 4],
    scoreDirection: "higher_worse",
    totalLabel: "P-YMRS — soma não ponderada (0–44)",
    instrumentVersion: "p-ymrs-v1",
    descriptiveDomainSummary: true,
    bands: [...DESCRIPTIVE_BAND],
    domains: [{ name: "Mudanças na última semana", items: [
      { text: "Humor eufórico ou exageradamente alegre, fora do contexto" },
      { text: "Energia e atividade aumentadas, não para" },
      { text: "Interesse ou comportamento sexual inadequado para a idade" },
      { text: "Precisa de bem menos sono e não se mostra cansado(a)" },
      { text: "Irritabilidade ou explosões" },
      { text: "Fala mais rápido ou muito mais que o habitual, difícil de interromper" },
      { text: "Pensamentos acelerados, pula de um assunto para outro" },
      { text: "Ideias de grandeza: acha que tem poderes ou capacidades especiais" },
      { text: "Comportamento agressivo ou destrutivo" },
      { text: "Descuido com a aparência ou a higiene" },
      { text: "Não percebe que está diferente do habitual" },
    ] }],
  },

  // ── TDAH: pontos fortes e fracos ───────────────────────────────────────
  "swan": {
    instruction: "Compare a criança com outras da mesma idade. Para cada habilidade, marque onde ela está em relação à média.",
    infoBox: "SWAN — Strengths and Weaknesses of ADHD-symptoms and Normal-behavior (Swanson et al.; domínio público). Redação própria. 18 itens em 7 pontos; aqui 0 = muito acima da média e 6 = muito abaixo (equivale a −3 a +3 da escala original, somando 3). Não há norma brasileira: o resultado é DESCRITIVO por subescala (média mais alta = mais dificuldade). Útil para acompanhar mudança no mesmo paciente.",
    labels: ["Muito acima da média", "Acima da média", "Um pouco acima", "Na média", "Um pouco abaixo", "Abaixo da média", "Muito abaixo da média"],
    optionPoints: [0, 1, 2, 3, 4, 5, 6],
    scoreDirection: "higher_worse",
    totalLabel: "SWAN — soma descritiva (0–108)",
    instrumentVersion: "swan-v1",
    descriptiveDomainSummary: true,
    bands: [...DESCRIPTIVE_BAND],
    domains: [
      { name: "Atenção (itens 1–9)", items: [
        "Presta atenção aos detalhes e evita erros por descuido",
        "Mantém a atenção em tarefas e brincadeiras",
        "Escuta quando falam diretamente com ele(a)",
        "Segue instruções até o fim e termina tarefas e deveres",
        "Organiza tarefas e atividades",
        "Encara tarefas que exigem esforço mental prolongado",
        "Cuida dos objetos necessários para as atividades",
        "Não se distrai com estímulos externos",
        "Lembra-se das atividades do dia a dia",
      ] },
      { name: "Atividade e impulsividade (itens 10–18)", items: [
        "Fica quieto(a): controla os movimentos de mãos e pés",
        "Permanece sentado(a) quando é esperado",
        "Controla a atividade motora: não corre nem escala em hora inadequada",
        "Brinca de forma tranquila",
        "Consegue desacelerar: não age como se estivesse \"ligado na tomada\"",
        "Controla a fala: não fala em excesso",
        "Pensa antes de responder: espera a pergunta terminar",
        "Espera a sua vez",
        "Entra em conversas e brincadeiras sem interromper os outros",
      ] },
    ],
  },
  // ── Depressão perinatal do cuidador (opções próprias por item) ─────────
  "epds": {
    instruction: "Estas perguntas são sobre VOCÊ (mãe ou cuidador principal), não sobre o bebê. Marque a resposta que mais se aproxima do que sentiu nos ÚLTIMOS 7 DIAS, não só hoje.",
    infoBox: "EPDS — Escala de Depressão Pós-Natal de Edimburgo (Cox, Holden & Sagovsky, 1987; © Royal College of Psychiatrists, reprodução permitida com citação). Redação própria; as opções vão sempre da menor (0) para a maior pontuação (3), sem a alternância de ordem do original. Total 0–30: ≥ 10 possível depressão (corte da validação brasileira, Santos et al., 2007) · ≥ 13 provável depressão. QUALQUER resposta diferente de \"Nunca\" no item 10 exige avaliação de segurança no mesmo dia. Rastreio, não diagnóstico.",
    labels: ["0", "1", "2", "3"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "EPDS (0–30)",
    instrumentVersion: "epds-v1",
    bands: [
      { minPct: 0, classification: "Abaixo do corte (0–9)", color: "emerald", description: "Sem indicação de depressão perinatal neste rastreio. Repetir se surgirem sinais." },
      { minPct: 33.3, classification: "Possível depressão (10–12)", color: "orange", description: "Orientar avaliação da mãe ou cuidador na rede de saúde." },
      { minPct: 43.3, classification: "Provável depressão (≥ 13)", color: "red", description: "Encaminhar para avaliação e tratamento sem demora." },
    ],
    domains: [{ name: "Últimos 7 dias (sobre você)", items: [
      { text: "Tenho conseguido rir e ver o lado engraçado das coisas", options: ["Tanto quanto antes", "Um pouco menos que antes", "Bem menos que antes", "De jeito nenhum"] },
      { text: "Tenho pensado no futuro com alegria", options: ["Tanto quanto antes", "Um pouco menos que antes", "Bem menos que antes", "Quase nunca"] },
      { text: "Tenho me culpado sem necessidade quando as coisas dão errado", options: ["Não, nunca", "Raramente", "Sim, às vezes", "Sim, na maior parte do tempo"] },
      { text: "Tenho ficado ansiosa(o) ou preocupada(o) sem um bom motivo", options: ["Não, de jeito nenhum", "Quase nunca", "Sim, às vezes", "Sim, muitas vezes"] },
      { text: "Tenho sentido medo ou pânico sem um bom motivo", options: ["Não, de jeito nenhum", "Não muito", "Sim, às vezes", "Sim, muitas vezes"] },
      { text: "Tenho sentido que as coisas estão demais para mim", options: ["Não, tenho dado conta como sempre", "Não, quase sempre tenho dado conta", "Sim, às vezes não dou conta como antes", "Sim, quase sempre não dou conta"] },
      { text: "Tenho me sentido tão infeliz que tenho dificuldade para dormir", options: ["Não, de jeito nenhum", "Raramente", "Sim, às vezes", "Sim, na maior parte do tempo"] },
      { text: "Tenho me sentido triste ou arrasada(o)", options: ["Não, de jeito nenhum", "Raramente", "Sim, muitas vezes", "Sim, na maior parte do tempo"] },
      { text: "Tenho me sentido tão infeliz que tenho chorado", options: ["Não, nunca", "Só de vez em quando", "Sim, muitas vezes", "Sim, na maior parte do tempo"] },
      {
        text: "Tenho pensado em fazer mal a mim mesma(o)",
        options: ["Nunca", "Quase nunca", "Às vezes", "Sim, muitas vezes"],
        example: "Se a resposta não for \"Nunca\", fale hoje com a equipe ou procure ajuda (CVV 188, SAMU 192).",
        sentinel: { positiveOptionIndexes: [1, 2, 3], label: "Pensamento de se ferir (mãe/cuidador)" },
      },
    ] }],
  },

  // ── Cefaleia: incapacidade (dias) ──────────────────────────────────────
  "pedmidas": {
    instruction: "Responda pensando nos ÚLTIMOS 3 MESES e escreva o NÚMERO DE DIAS em cada pergunta (0 se não aconteceu). Um adulto pode ajudar a lembrar.",
    infoBox: "PedMIDAS — Pediatric Migraine Disability Assessment (Hershey et al., 2001; © Cincinnati Children's, uso clínico livre). Redação própria. Escore = soma dos dias das 6 perguntas: 0–10 pouca ou nenhuma incapacidade (grau I) · 11–30 leve (II) · 31–50 moderada (III) · > 50 grave (IV). Some os dias na leitura do resultado; não conte o mesmo dia em duas perguntas.",
    labels: ["—"],
    scoreDirection: "higher_worse",
    totalLabel: "PedMIDAS — some os dias informados",
    instrumentVersion: "pedmidas-v1",
    descriptiveDomainSummary: true,
    bands: [
      { minPct: 0, classification: "Some os dias para o grau", color: "amber", description: "0–10 grau I · 11–30 grau II · 31–50 grau III · > 50 grau IV. Compare com a aplicação anterior para avaliar resposta ao tratamento." },
    ],
    domains: [
      { name: "Escola", items: [
        { text: "Quantos dias inteiros de aula você perdeu por causa da dor de cabeça?", responseType: "text", required: true, maxLength: 3, placeholder: "Nº de dias (0 a 90)" },
        { text: "Quantos dias você saiu mais cedo ou chegou atrasado(a) por causa da dor de cabeça? (não conte os dias da pergunta anterior)", responseType: "text", required: true, maxLength: 3, placeholder: "Nº de dias" },
        { text: "Em quantos dias de aula você rendeu menos da metade do normal por causa da dor de cabeça? (não conte os dias já contados acima)", responseType: "text", required: true, maxLength: 3, placeholder: "Nº de dias" },
      ] },
      { name: "Casa e atividades", items: [
        { text: "Em quantos dias você não conseguiu fazer as coisas de casa (tarefas, lição de casa) por causa da dor de cabeça?", responseType: "text", required: true, maxLength: 3, placeholder: "Nº de dias" },
        { text: "Em quantos dias você deixou de participar de outras atividades (brincar, sair, esportes) por causa da dor de cabeça?", responseType: "text", required: true, maxLength: 3, placeholder: "Nº de dias" },
        { text: "Em quantos dias você participou dessas atividades, mas rendeu menos da metade do normal? (não conte os dias da pergunta anterior)", responseType: "text", required: true, maxLength: 3, placeholder: "Nº de dias" },
      ] },
    ],
  },
};
