// ============================================================
// Aplicações interativas para as LACUNAS DO PÓDIO (2026-07).
// Origem: auditoria da regra de ouro (test-filter-ideal-choice R8) —
// estas escalas medalhavam como ficha por não ter aplicação no app.
//
// Política de conteúdo:
//  - Escalas LIVRES (CY-BOCS, YMRS, TSI, SSQ, PRIME, BBD, BISQ-R,
//    CHEOPS, Pediatric Feeding): grade de aplicação em REDAÇÃO
//    PRÓPRIA, fiel ao construto; equivalências e cortes originais
//    ficam no infoBox — o app NUNCA reproduz item licenciado.
//  - PANT (Escalas Passivas do ebook do Dr. Jadson) e PODJ-TEA PRIME
//    (protocolo autoral): conteúdo autoral expandido em checklist
//    observacional aplicável.
// Nenhuma delas estabelece diagnóstico; interpretação é descritiva.
// ============================================================
import type { InteractiveScaleDef } from "./interactiveScaleItems";

const FREQ4 = ["Nunca ou raramente", "Às vezes (1–2x/semana)", "Frequentemente (3–4x/semana)", "Quase sempre (diariamente)"];
const GRAV5 = ["Ausente", "Leve", "Moderado", "Grave", "Extremo"];


// Faixas genéricas de triagem (raw %: maior = mais sinais). Descrições curtas e
// sem promessa diagnóstica, no padrão das demais escalas do app.
const TRIAGEM_BANDS = [
  { minPct: 0, classification: "Sem sinais relevantes", color: "emerald", description: "Padrão dentro do esperado no período observado. Manter acompanhamento de rotina. Triagem não substitui avaliação clínica." },
  { minPct: 25, classification: "Atenção — observar e reavaliar", color: "amber", description: "Alguns sinais presentes. Orientar família/escola, observar por 4–8 semanas e reavaliar; levar o resultado à consulta." },
  { minPct: 50, classification: "Alterações moderadas — investigar", color: "orange", description: "Sinais frequentes com provável impacto funcional. Discutir com o clínico para investigação dirigida e plano de cuidado." },
  { minPct: 75, classification: "Alterações importantes — priorizar avaliação", color: "red", description: "Sinais intensos e persistentes. Priorizar avaliação clínica detalhada e plano de intervenção." },
] as const;

// CY-BOCS: equivalência das faixas originais 0–40 em % do máximo.
const CYBOCS_BANDS = [
  { minPct: 0, classification: "Subclínico (0–7)", color: "emerald", description: "Sintomas mínimos. Manter observação; reavaliar se houver piora." },
  { minPct: 20, classification: "Leve (8–15)", color: "amber", description: "Sintomas leves com pouco prejuízo. Psicoeducação e monitorização; considerar TCC conforme o caso." },
  { minPct: 40, classification: "Moderado (16–23)", color: "orange", description: "Prejuízo funcional claro. Indicada intervenção estruturada (TCC/ERP; avaliar farmacoterapia)." },
  { minPct: 60, classification: "Grave (24–31)", color: "red", description: "Prejuízo importante em múltiplos contextos. Tratamento intensivo e reavaliações próximas." },
  { minPct: 80, classification: "Extremo (32–40)", color: "red", description: "Comprometimento muito grave. Priorizar manejo especializado imediato." },
] as const;

const PRIME_BANDS = [
  { minPct: 0, classification: "Baixa carga de experiências", color: "emerald", description: "Relatos ausentes ou mínimos. Experiências isoladas são comuns na adolescência." },
  { minPct: 30, classification: "Carga intermediária — explorar em consulta", color: "amber", description: "Alguns relatos merecem conversa clínica cuidadosa sobre contexto, sono, substâncias e sofrimento." },
  { minPct: 60, classification: "Carga alta — avaliação especializada", color: "red", description: "Relatos frequentes/intensos. Encaminhar para avaliação especializada em saúde mental — triagem não é diagnóstico." },
] as const;

const DOR_BANDS = [
  { minPct: 0, classification: "Confortável", color: "emerald", description: "Sem sinais comportamentais de dor no momento da observação." },
  { minPct: 20, classification: "Desconforto leve", color: "amber", description: "Sinais discretos: conforto ambiental, reavaliar em minutos." },
  { minPct: 45, classification: "Dor moderada", color: "orange", description: "Sinais claros: analgesia conforme protocolo e reavaliação após intervenção." },
  { minPct: 70, classification: "Dor intensa", color: "red", description: "Sofrimento importante: analgesia imediata, investigar causa e reavaliar de perto." },
] as const;

export const gapsPodium2026Items: Record<string, InteractiveScaleDef> = {
  // ── PANT — Escalas Passivas (autoral, ebook Dr. Jadson) ────────────────
  "pant-v7-074": {
    instruction: "Pense nos últimos 30 dias e marque com que frequência cada situação acontece com a criança ou adolescente.",
    infoBox: "Autorregulação corporal (PANT — Escala Passiva 74, autoral Dr. Jadson Fraga). Observação de como o corpo se organiza em repouso, espera e frustração. Triagem descritiva — não estabelece diagnóstico.",
    labels: FREQ4,
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "Autorregulação corporal — escore total (0–24)",
    bands: [...TRIAGEM_BANDS],
    domains: [
      { name: "Autorregulação do corpo no dia a dia", items: [
        { text: "O corpo fica agitado mesmo em momentos de calma (mexe pernas, mãos, tronco sem parar).", emoji: "🌀", example: "Ex.: assistindo TV ou na refeição, o corpo não para quieto." },
        { text: "Precisa se levantar, andar ou buscar movimento o tempo todo.", emoji: "🏃", example: "Ex.: levanta da cadeira várias vezes durante o jantar ou a aula." },
        { text: "Depois de se agitar, custa a acalmar o corpo de novo.", emoji: "🧯", example: "Ex.: após brincadeira animada, segue elétrico(a) por muito tempo." },
        { text: "Tem grande dificuldade de esperar parado(a) (fila, consultório, mesa).", emoji: "⏳", example: "Ex.: na fila da escola, se pendura, gira, cutuca os colegas." },
        { text: "Reage com o corpo inteiro a barulho, luz forte ou ambiente cheio (encolhe, agita, explode).", emoji: "📢", example: "Ex.: em festa de aniversário, fica descontrolado(a) ou se tapa." },
        { text: "Usa balanceios, pulinhos ou apertar as mãos para se organizar.", emoji: "🔁", example: "Ex.: balança o corpo ou sacode as mãos quando está animado(a) ou nervoso(a)." },
        { text: "O corpo trava ou fica tenso/rígido quando é contrariado(a).", emoji: "🧱", example: "Ex.: endurece o corpo todo e não sai do lugar quando ouve 'não'." },
        { text: "Só se acalma com ajuda externa (colo, pressão, abraço apertado, sair do ambiente).", emoji: "🫂", example: "Ex.: precisa que o adulto contenha ou retire do local para se organizar." },
      ] },
    ],
  },
  "pant-v7-068": {
    instruction: "Compare com crianças da mesma idade e marque a frequência de cada situação nos últimos 30 dias.",
    infoBox: "Controle postural (PANT — Escala Passiva 68, autoral Dr. Jadson Fraga). Observação de sustentação, equilíbrio e transições posturais de 0 a 8 anos. Triagem descritiva — alterações pedem exame neurológico presencial.",
    labels: FREQ4,
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "Controle postural — escore total (0–24)",
    bands: [...TRIAGEM_BANDS],
    domains: [
      { name: "Postura, equilíbrio e transições", items: [
        { text: "A sustentação de cabeça e tronco parece atrasada ou frouxa para a idade.", emoji: "🧷", example: "Ex.: bebê que ainda não firma a cabeça na idade esperada." },
        { text: "Senta ou fica em pé de forma instável, precisando de apoio além do esperado.", emoji: "🪑", example: "Ex.: desaba para o lado quando sentado(a) sem encosto." },
        { text: "Tem dificuldade nas transições (rolar, sentar-se sozinho, passar de sentado para em pé).", emoji: "🔄", example: "Ex.: não consegue levantar do chão sem escalar em móveis ou pessoas." },
        { text: "Perde o equilíbrio ou cai mais que as outras crianças da mesma idade.", emoji: "🤕", example: "Ex.: tropeça e cai várias vezes ao dia em chão plano." },
        { text: "Apoia-se em paredes, móveis ou pessoas para se manter em pé ou andar.", emoji: "🧱", example: "Ex.: anda 'costurando' pelos móveis muito depois da idade típica." },
        { text: "Escorrega da cadeira, deita na mesa ou se apoia na mão durante atividades sentadas.", emoji: "🛋️", example: "Ex.: na refeição ou desenho, o tronco vai desmontando aos poucos." },
        { text: "Um lado do corpo parece mais fraco, mais duro ou menos usado que o outro.", emoji: "⚖️", example: "Ex.: usa quase só uma das mãos e arrasta uma perna ao engatinhar." },
        { text: "Evita brincadeiras de equilíbrio (subir, escorregar, pular) que os colegas fazem.", emoji: "🛝", example: "Ex.: foge do parquinho ou pede colo em terrenos irregulares." },
      ] },
    ],
  },
  "pant-v7-078": {
    instruction: "Considere os últimos 30 dias e marque a frequência de cada situação.",
    infoBox: "Controle esfincteriano funcional (PANT — Escala Passiva 78, autoral Dr. Jadson Fraga). Observação do controle de urina e fezes entre 18 meses e 6 anos, respeitando a variabilidade normal do desfralde. Triagem descritiva.",
    labels: FREQ4,
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "Controle esfincteriano — escore total (0–24)",
    bands: [...TRIAGEM_BANDS],
    domains: [
      { name: "Controle de urina e fezes no dia a dia", items: [
        { text: "Escapes de urina durante o dia depois de já ter desfraldado.", emoji: "💧", example: "Ex.: volta molhado(a) da escola mesmo já usando roupa íntima." },
        { text: "Faz xixi na cama durante o sono em idade em que os colegas já ficam secos.", emoji: "🛏️", example: "Ex.: acorda molhado(a) várias noites na semana." },
        { text: "Escapes de cocô na roupa ou dificuldade para evacuar no vaso/penico.", emoji: "🚽", example: "Ex.: só evacua na fralda ou escondido(a) atrás do sofá." },
        { text: "Segura o xixi ou o cocô por muito tempo (cruza as pernas, dança, se esconde).", emoji: "🤸", example: "Ex.: aperta as pernas e nega que precisa ir ao banheiro." },
        { text: "Não percebe ou não avisa a vontade a tempo de chegar ao banheiro.", emoji: "⏰", example: "Ex.: avisa somente quando já escapou um pouco." },
        { text: "Evacuações duras, dolorosas ou espaçadas (menos de 3 vezes por semana).", emoji: "🪨", example: "Ex.: chora ou sangra ao evacuar; fica dias sem fazer cocô." },
        { text: "Resiste à rotina de banheiro (recusa sentar no vaso, faz birra no desfralde).", emoji: "🚫", example: "Ex.: chora e trava quando é levado(a) ao banheiro." },
        { text: "Voltou a ter escapes depois de um período seco (regressão), especialmente após estresse.", emoji: "↩️", example: "Ex.: voltou a molhar a cama após mudança de escola ou nascimento de irmão." },
      ] },
    ],
  },
  "pant-v7-067": {
    instruction: "Pense nas refeições dos últimos 30 dias e marque a frequência de cada situação.",
    infoBox: "Mastigação e coordenação oral (PANT — Escala Passiva 67, autoral Dr. Jadson Fraga). Observação da coordenação oral de 6 meses a 6 anos. Engasgos frequentes ou perda de peso pedem avaliação presencial imediata (fonoaudiologia/pediatria).",
    labels: FREQ4,
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "Mastigação e coordenação oral — escore total (0–24)",
    bands: [...TRIAGEM_BANDS],
    domains: [
      { name: "Coordenação oral nas refeições", items: [
        { text: "Recusa ou custa a aceitar novas texturas (só aceita amassados/líquidos além da idade típica).", emoji: "🥣", example: "Ex.: com 2 anos ainda só come papinha lisa e liquidificada." },
        { text: "Engole pedaços quase sem mastigar ou 'amassa' com a língua em vez de mastigar.", emoji: "😮", example: "Ex.: some com a comida rápido demais, sem movimento de mastigação." },
        { text: "Engasga, tosse ou fica com a voz molhada durante ou após comer/beber.", emoji: "😖", example: "Ex.: tosse ao beber líquido fino ou engasga com arroz." },
        { text: "Perde comida ou saliva pelo canto da boca ao comer.", emoji: "💦", example: "Ex.: baba muito além da fase de dentição; a comida escapa dos lábios." },
        { text: "Guarda comida na bochecha ou demora demais para terminar cada garfada.", emoji: "🐿️", example: "Ex.: fica com o bocado 'estocado' na boca por minutos." },
        { text: "As refeições passam de 30–40 minutos pelo esforço de mastigar.", emoji: "⏲️", example: "Ex.: todos terminam e a criança segue na metade do prato." },
        { text: "Prefere sempre alimentos moles, líquidos ou que derretem, evitando os que exigem mastigar.", emoji: "🍮", example: "Ex.: aceita iogurte e purê, recusa carne e frutas firmes." },
        { text: "Faz náusea ou ânsia quando o alimento é mais consistente.", emoji: "🤢", example: "Ex.: ânsia ao ver ou provar pedaços maiores." },
      ] },
    ],
  },

  // ── Escalas livres de heteroaplicação clínica ──────────────────────────
  "cybocs": {
    instruction: "Aplicação pelo CLÍNICO após entrevista com a criança/adolescente e a família: gradue cada dimensão pela ÚLTIMA SEMANA. As 5 primeiras referem-se às OBSESSÕES (pensamentos intrusivos) e as 5 últimas às COMPULSÕES (rituais/comportamentos repetitivos).",
    infoBox: "Grade de gravidade baseada na CY-BOCS (Children's Yale-Brown Obsessive Compulsive Scale; Scahill et al., 1997 — uso clínico livre). Descritores em redação própria do app. Escore original 0–40: 0–7 subclínico; 8–15 leve; 16–23 moderado; 24–31 grave; 32–40 extremo. Instrumento de gravidade/monitorização — o diagnóstico de TOC é clínico.",
    labels: GRAV5,
    optionPoints: [0, 1, 2, 3, 4],
    scoreDirection: "higher_worse",
    totalLabel: "Gravidade TOC (grade CY-BOCS) — total (0–40)",
    bands: [...CYBOCS_BANDS],
    domains: [
      { name: "Obsessões (pensamentos intrusivos)", items: [
        { text: "Tempo ocupado pelas obsessões ao longo do dia.", emoji: "🕐", example: "Leve: < 1h/dia · Extremo: quase o dia inteiro." },
        { text: "Interferência das obsessões na escola, família e amizades.", emoji: "🏫", example: "Leve: atrapalha pouco · Extremo: incapacitante." },
        { text: "Sofrimento/ansiedade que as obsessões causam.", emoji: "😰", example: "Leve: incômodo tolerável · Extremo: angústia quase constante." },
        { text: "Resistência: quanto tenta afastar ou ignorar as obsessões.", emoji: "🛡️", example: "0: sempre resiste · Extremo: cede completamente a elas." },
        { text: "Controle: quanto consegue de fato interromper ou desviar das obsessões.", emoji: "🎛️", example: "Leve: geralmente controla · Extremo: nenhum controle." },
      ] },
      { name: "Compulsões (rituais e repetições)", items: [
        { text: "Tempo gasto em rituais/comportamentos repetitivos por dia.", emoji: "⏱️", example: "Leve: < 1h/dia · Extremo: quase o dia inteiro." },
        { text: "Interferência dos rituais nas rotinas (banho, tarefa, saída de casa).", emoji: "🚪", example: "Leve: pequenos atrasos · Extremo: rotinas inviáveis." },
        { text: "Ansiedade se o ritual é impedido ou interrompido.", emoji: "⚡", example: "Leve: leve inquietação · Extremo: crise intensa." },
        { text: "Resistência: quanto tenta não realizar os rituais.", emoji: "✋", example: "0: sempre tenta resistir · Extremo: nem tenta mais." },
        { text: "Controle: quanto consegue de fato adiar ou reduzir os rituais.", emoji: "🎚️", example: "Leve: adia com esforço · Extremo: impossível adiar." },
      ] },
    ],
  },
  "ymrs": {
    instruction: "Aplicação pelo CLÍNICO com base na entrevista e na observação das últimas 48 horas + relato da família. Gradue cada dimensão de 0 (ausente) a 4 (extremo).",
    infoBox: "Grade descritiva de sintomas maníacos baseada na YMRS (Young Mania Rating Scale, 1978 — uso clínico livre), em ADAPTAÇÃO UNIFORME 0–4 de redação própria (a YMRS original pondera 4 itens com peso dobrado; os cortes originais NÃO se aplicam diretamente aqui). Uso: monitorização descritiva de sintomas em ≥12 anos — não é diagnóstico de bipolaridade.",
    labels: GRAV5,
    optionPoints: [0, 1, 2, 3, 4],
    scoreDirection: "higher_worse",
    totalLabel: "Sintomas maníacos (grade YMRS adaptada) — total (0–44)",
    bands: [...TRIAGEM_BANDS],
    domains: [
      { name: "Sintomas observados/relatados", items: [
        { text: "Humor elevado, eufórico ou expansivo além do contexto.", emoji: "🎈", example: "Ex.: alegria exagerada e contagiante sem motivo proporcional." },
        { text: "Energia e atividade motora aumentadas.", emoji: "⚡", example: "Ex.: não para, faz mil coisas ao mesmo tempo, agitação psicomotora." },
        { text: "Interesse/comentários sexuais inadequados para idade e contexto.", emoji: "⚠️", example: "Ex.: erotização do discurso incomum para o adolescente." },
        { text: "Redução da necessidade de sono SEM cansaço no dia seguinte.", emoji: "🌙", example: "Ex.: dorme 3–4h e acorda 'elétrico', sem sonolência." },
        { text: "Irritabilidade, pavio curto ou hostilidade.", emoji: "😠", example: "Ex.: explode com facilidade, discute com todos." },
        { text: "Fala acelerada, alta, difícil de interromper (pressão de fala).", emoji: "🗣️", example: "Ex.: atropela as palavras, não dá espaço na conversa." },
        { text: "Pensamento acelerado, fuga de ideias, saltos de assunto.", emoji: "💭", example: "Ex.: muda de tema a cada frase, difícil de acompanhar." },
        { text: "Conteúdo grandioso, planos irreais, sensação de poderes especiais.", emoji: "👑", example: "Ex.: convicção de talento/importância fora da realidade." },
        { text: "Comportamento disruptivo, desafiador ou agressivo na entrevista/em casa.", emoji: "💥", example: "Ex.: provoca, ameaça, quebra objetos." },
        { text: "Aparência desorganizada, extravagante ou descuidada em relação ao habitual.", emoji: "🧢", example: "Ex.: combinações bizarras, higiene abandonada na última semana." },
        { text: "Crítica reduzida: não reconhece que algo está diferente/errado.", emoji: "🪞", example: "Ex.: nega qualquer mudança apesar dos relatos da família." },
      ] },
    ],
  },
  "tsi": {
    instruction: "Responda com base nas ÚLTIMAS 4 SEMANAS, junto com a família (ou pelo clínico em entrevista).",
    infoBox: "Rastreio de tiques baseado no TSI (Tics Screening Interview — uso livre), com itens em redação própria. Diferencia presença, tipo e impacto de tiques motores e vocais. Positivo → considerar YGTSS (padrão-ouro de gravidade) e avaliação clínica.",
    labels: FREQ4,
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "Rastreio de tiques — escore total (0–24)",
    bands: [...TRIAGEM_BANDS],
    domains: [
      { name: "Tiques motores e vocais", items: [
        { text: "Movimentos repetidos, rápidos e involuntários simples (piscar, careta, encolher ombro, sacudir cabeça).", emoji: "👁️", example: "Ex.: pisca forte várias vezes seguidas sem irritação nos olhos." },
        { text: "Movimentos involuntários mais elaborados (tocar objetos, pular, agachar, gesto em sequência).", emoji: "🤾", example: "Ex.: toca o chão ou repete um gesto complexo sempre igual." },
        { text: "Sons involuntários simples (fungar, pigarrear, tossir sem gripe, grunhir).", emoji: "👃", example: "Ex.: pigarreia o dia todo há semanas, sem causa alérgica." },
        { text: "Sons ou palavras involuntárias mais complexas (sílabas, palavras, repetir o que ouve).", emoji: "🔊", example: "Ex.: solta palavras ou repete frases fora de contexto." },
        { text: "Sensação de 'aviso' antes do tique e alívio depois; consegue segurar por pouco tempo à custa de tensão.", emoji: "🌡️", example: "Ex.: descreve 'coceira por dentro' que só passa ao fazer o movimento." },
        { text: "Os tiques pioram com ansiedade, cansaço, telas ou empolgação.", emoji: "📈", example: "Ex.: aumentam em semana de prova ou após videogame." },
        { text: "Os tiques atrapalham a escola, o sono ou causam dor/constrangimento.", emoji: "🏫", example: "Ex.: colegas comentam; o pescoço dói de tanto repetir." },
        { text: "A criança/adolescente sofre com os tiques ou tenta escondê-los.", emoji: "🙈", example: "Ex.: evita apresentar trabalho para os colegas não verem." },
      ] },
    ],
  },
  "ssq": {
    instruction: "Responda pensando nas CRISES EPILÉPTICAS dos últimos 3 meses (ou desde a última consulta).",
    infoBox: "Percepção de gravidade das crises baseada no SSQ (Seizure Severity Questionnaire — uso livre), itens em redação própria. Complementa (não substitui) o diário de crises e a classificação clínica. Mudanças importantes → reavaliação médica.",
    labels: ["Não acontece / muito leve", "Leve", "Moderado", "Intenso / muito frequente"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "Gravidade percebida das crises — total (0–24)",
    bands: [...TRIAGEM_BANDS],
    domains: [
      { name: "Como têm sido as crises", items: [
        { text: "Frequência das crises no período.", emoji: "📅", example: "Leve: rara (1 no período) · Intenso: várias por semana/dia." },
        { text: "Duração de cada crise.", emoji: "⏱️", example: "Leve: segundos · Intenso: minutos prolongados." },
        { text: "Intensidade dos movimentos/abalos durante a crise.", emoji: "🌊", example: "Leve: piscamentos/pausas sutis · Intenso: abalos generalizados." },
        { text: "Comprometimento da consciência durante a crise.", emoji: "💫", example: "Leve: percebe tudo · Intenso: desconecta completamente." },
        { text: "Tempo e dificuldade de recuperação após a crise (sonolência, confusão, dor).", emoji: "🛌", example: "Leve: volta ao normal logo · Intenso: horas 'fora do ar'." },
        { text: "Quedas, ferimentos ou acidentes causados pelas crises.", emoji: "🩹", example: "Ex.: já se machucou ao cair durante crise." },
        { text: "Crises sem nenhum aviso prévio (sem aura), pegando todos de surpresa.", emoji: "🎲", example: "Ex.: acontece do nada, em qualquer lugar." },
        { text: "Impacto das crises nas atividades (escola, esporte, banho, sono).", emoji: "🚸", example: "Ex.: deixou de nadar ou precisa de supervisão constante." },
      ] },
    ],
  },
  "prime-screen": {
    instruction: "Para adolescentes (12+): leia cada frase e marque o quanto concorda, pensando no ÚLTIMO ANO. Não existe resposta certa — responda com sinceridade.",
    infoBox: "Triagem de experiências perceptuais/cognitivas incomuns baseada no PRIME Screen-Revised (Yale PRIME clinic — uso livre), itens em redação própria. No original, item máximo (concordo totalmente) ou 2+ itens quase-máximos sugerem avaliação especializada. Triagem NÃO é diagnóstico: experiências isoladas são comuns na adolescência; o resultado exige entrevista clínica cuidadosa.",
    labels: ["Discordo totalmente", "Discordo", "Discordo um pouco", "Nem concordo nem discordo", "Concordo um pouco", "Concordo", "Concordo totalmente"],
    optionPoints: [0, 1, 2, 3, 4, 5, 6],
    scoreDirection: "higher_worse",
    totalLabel: "PRIME (adaptado) — total (0–72)",
    bands: [...PRIME_BANDS],
    domains: [
      { name: "Experiências no último ano", items: [
        { text: "Já achei que algo estranho ou inexplicável estava acontecendo comigo ou ao meu redor.", emoji: "❓", example: "Uma sensação de que as coisas estão 'diferentes' de um jeito difícil de explicar." },
        { text: "Já me perguntei se as coisas que vejo ou ouço são reais ou só da minha cabeça.", emoji: "🪞", example: "Dúvida sobre o que é real e o que é imaginação." },
        { text: "Já ouvi sons ou vozes que outras pessoas não ouviram.", emoji: "👂", example: "Ouvir seu nome ou murmúrios quando não havia ninguém." },
        { text: "Já vi coisas (vultos, sombras, figuras) que outras pessoas não viram.", emoji: "👤", example: "Vultos passando pelo canto do olho com frequência." },
        { text: "Já senti que a TV, músicas ou a internet mandavam mensagens especialmente para mim.", emoji: "📺", example: "Sensação de recado pessoal em conteúdo comum." },
        { text: "Já desconfiei que pessoas queriam me prejudicar, mesmo sem provas.", emoji: "🕵️", example: "Sentir-se vigiado(a) ou perseguido(a) sem motivo claro." },
        { text: "Já senti que meus pensamentos não eram meus ou que alguém podia lê-los/controlá-los.", emoji: "🧠", example: "Impressão de pensamento 'colocado' ou lido por outros." },
        { text: "Já senti que eu tinha poderes ou uma missão que outras pessoas não têm.", emoji: "✨", example: "Convicção forte de capacidade especial fora da realidade." },
        { text: "Meus pensamentos às vezes ficam tão confusos ou rápidos que não consigo me organizar.", emoji: "🌪️", example: "Ideias embaralhadas que dificultam falar ou estudar." },
        { text: "Pessoas próximas comentaram que ando falando coisas estranhas ou sem sentido.", emoji: "💬", example: "Família ou amigos estranharam seu jeito de falar/pensar." },
        { text: "Tenho me afastado das pessoas porque o mundo parece estranho ou ameaçador.", emoji: "🚪", example: "Isolar-se por desconfiança ou estranheza, não por preferência." },
        { text: "Essas experiências têm me assustado ou atrapalhado minha vida.", emoji: "😨", example: "Medo, queda nas notas ou brigas por causa dessas sensações." },
      ] },
    ],
  },
  "bowel-bladder-checklist": {
    instruction: "Responda pensando nos últimos 30 dias.",
    infoBox: "Checklist de disfunção vesical e intestinal (BBD — domínio público, itens em redação própria). Xixi e cocô andam juntos: constipação piora escapes urinários. Triagem descritiva — escapes persistentes após os 5 anos merecem avaliação.",
    labels: FREQ4,
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "Disfunção vesical/intestinal — total (0–30)",
    bands: [...TRIAGEM_BANDS],
    domains: [
      { name: "Bexiga", items: [
        { text: "Escapes de urina durante o dia (calcinha/cueca úmida ou molhada).", emoji: "💧", example: "Ex.: volta da escola com a roupa íntima molhada." },
        { text: "Urgência: quando dá vontade, precisa correr para não escapar.", emoji: "🏃", example: "Ex.: larga tudo e sai correndo para o banheiro." },
        { text: "Manobras de segurar: cruza as pernas, agacha, aperta, 'dança'.", emoji: "🤸", example: "Ex.: senta sobre o calcanhar para segurar o xixi." },
        { text: "Faz xixi muito poucas vezes (≤3x/dia) ou muitas vezes (≥8x/dia).", emoji: "🔢", example: "Ex.: passa a manhã inteira sem ir ao banheiro." },
        { text: "Faz xixi na cama dormindo.", emoji: "🛏️", example: "Ex.: acorda molhado(a) 2+ noites por semana." },
      ] },
      { name: "Intestino", items: [
        { text: "Fezes duras, em bolinhas ou calibrosas, com esforço ou dor.", emoji: "🪨", example: "Ex.: chora para evacuar; entope o vaso de vez em quando." },
        { text: "Fica 3 dias ou mais sem evacuar.", emoji: "📆", example: "Ex.: a família perde a conta de quando foi o último cocô." },
        { text: "Escapes de fezes na roupa (raias ou mais).", emoji: "🩲", example: "Ex.: suja a roupa íntima sem perceber." },
        { text: "Dor de barriga recorrente que alivia após evacuar.", emoji: "😣", example: "Ex.: reclama de dor perto do umbigo quase todo dia." },
        { text: "Comportamento de retenção: se esconde, cruza as pernas, recusa o vaso para evacuar.", emoji: "🙈", example: "Ex.: pede fralda ou se esconde atrás do sofá para fazer cocô." },
      ] },
    ],
  },
  "bisq-r": {
    instruction: "Responda sobre o sono do bebê/criança pequena nas ÚLTIMAS 2 SEMANAS.",
    infoBox: "Triagem do sono do lactente baseada no BISQ-R (Brief Infant Sleep Questionnaire — uso livre), em ADAPTAÇÃO de redação própria com escore descritivo (o BISQ-R original usa formato misto). Padrões variam muito nos primeiros anos — o resultado orienta a conversa, não fecha diagnóstico.",
    labels: FREQ4,
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "Sono do lactente (BISQ-R adaptado) — total (0–24)",
    bands: [...TRIAGEM_BANDS],
    domains: [
      { name: "Como o bebê dorme", items: [
        { text: "Demora mais de 30 minutos para adormecer à noite.", emoji: "⏳", example: "Ex.: mesmo com sono, rola e chora por longos períodos." },
        { text: "Só adormece com ajuda intensa (colo, embalo, peito/mamadeira, carro).", emoji: "🤱", example: "Ex.: precisa mamar até dormir toda noite." },
        { text: "Acorda 3 vezes ou mais por noite.", emoji: "🌙", example: "Ex.: desperta chorando várias vezes e a casa toda acorda junto." },
        { text: "Fica acordado(a) mais de 1 hora somada durante a madrugada.", emoji: "🕑", example: "Ex.: às 3h está 'pronto para brincar'." },
        { text: "Dorme e acorda em horários muito irregulares de um dia para o outro.", emoji: "🔀", example: "Ex.: um dia dorme às 20h, no outro às 23h30." },
        { text: "O total de sono nas 24h parece baixo para a idade.", emoji: "📉", example: "Ex.: sonecas curtíssimas e noite entrecortada." },
        { text: "Ronco, respiração ruidosa ou pausas na respiração durante o sono.", emoji: "😤", example: "Ex.: ronca alto ou faz pausas que assustam." },
        { text: "A família considera o sono do bebê um problema.", emoji: "🆘", example: "Ex.: o sono da casa está esgotando os cuidadores." },
      ] },
    ],
  },
  "cheops": {
    instruction: "Aplicação pelo PROFISSIONAL (ou cuidador orientado) OBSERVANDO a criança de 1 a 7 anos durante/após procedimento doloroso ou queixa de dor. Marque o que observa AGORA.",
    infoBox: "Grade observacional de dor baseada na CHEOPS (Children's Hospital of Eastern Ontario Pain Scale — uso livre), em ADAPTAÇÃO UNIFORME 0–3 de redação própria (a CHEOPS original pontua 4–13 com pesos próprios; os cortes originais não se aplicam diretamente). Dor é sinal vital: escores altos pedem analgesia e reavaliação.",
    labels: ["Ausente / confortável", "Discreto", "Moderado", "Intenso"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "Dor observada (grade CHEOPS adaptada) — total (0–18)",
    bands: [...DOR_BANDS],
    domains: [
      { name: "Comportamento observado", items: [
        { text: "Choro (do gemido ao choro vigoroso/gritos).", emoji: "😭", example: "0: sem choro · 3: grito contínuo, inconsolável." },
        { text: "Expressão facial (careta de dor, sobrancelhas franzidas, olhos apertados).", emoji: "😖", example: "0: rosto relaxado · 3: careta de dor constante." },
        { text: "Queixas verbais de dor (para os que já falam).", emoji: "🗣️", example: "0: fala de outras coisas · 3: só fala da dor ('ai', 'dói')." },
        { text: "Tronco: inquieto, tenso, arqueado ou tentando levantar.", emoji: "🛏️", example: "0: quieto e relaxado · 3: contorce-se, arqueia o corpo." },
        { text: "Mãos em direção ao local dolorido (toca, aperta, protege).", emoji: "🤲", example: "0: não toca · 3: agarra e protege o local o tempo todo." },
        { text: "Pernas: chutando, encolhidas, tensas ou em posição de proteção.", emoji: "🦵", example: "0: soltas e relaxadas · 3: chuta ou trava as pernas." },
      ] },
    ],
  },
  "pediatric-feeding-q": {
    instruction: "Responda sobre a alimentação do bebê/criança pequena nas ÚLTIMAS 4 SEMANAS.",
    infoBox: "Triagem de dificuldades alimentares do lactente (6–24 meses) em redação própria (base: Pediatric Feeding Questionnaire, uso livre). Sinais de alarme — engasgos frequentes, perda de peso, recusa total — pedem avaliação presencial rápida.",
    labels: FREQ4,
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "Alimentação do lactente — total (0–24)",
    bands: [...TRIAGEM_BANDS],
    domains: [
      { name: "Como têm sido as refeições", items: [
        { text: "Recusa a refeição: vira o rosto, fecha a boca, empurra a colher.", emoji: "🙅", example: "Ex.: fecha a boca e vira a cara já na primeira colherada." },
        { text: "Aceita pouquíssima variedade de alimentos para a idade.", emoji: "🍽️", example: "Ex.: só aceita 4–5 alimentos e recusa qualquer novidade." },
        { text: "As refeições demoram mais de 30 minutos ou viram uma 'batalha'.", emoji: "⏲️", example: "Ex.: cada refeição é longa, com choro e negociação." },
        { text: "Engasga, tosse ou vomita durante as refeições.", emoji: "😖", example: "Ex.: ânsia ou vômito ao provar pedaços novos." },
        { text: "Travou na transição de texturas (não evoluiu de papinha para amassados/pedaços).", emoji: "🥄", example: "Ex.: com 15 meses ainda só aceita alimentos liquidificados." },
        { text: "Só come distraído(a) (telas, brinquedo, andando pela casa).", emoji: "📱", example: "Ex.: sem o desenho favorito, não abre a boca." },
        { text: "A quantidade que come parece pequena e preocupa quanto ao ganho de peso.", emoji: "⚖️", example: "Ex.: poucas colheradas e o peso anda 'parado' na curva." },
        { text: "Os cuidadores sentem estresse ou aflição na hora de alimentar.", emoji: "😥", example: "Ex.: a hora da comida virou o momento mais tenso do dia." },
      ] },
    ],
  },
  "podj-tea-prime-familiar": {
    instruction: "Entrevista com a FAMÍLIA (aplicada pelo clínico ou respondida pelos pais): marque a frequência de cada comportamento nos últimos 3 meses.",
    infoBox: "PODJ-TEA PRIME — Ficha de Entrevista Familiar (protocolo autoral Dr. Jadson Fraga). Observação estruturada de sinais do espectro autista relatados pela família, de 1 a 18 anos. Triagem/organização da entrevista — não substitui avaliação diagnóstica padronizada (ex.: ADOS-2, ADI-R).",
    labels: FREQ4,
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "PODJ-TEA Familiar — total (0–30)",
    bands: [...TRIAGEM_BANDS],
    domains: [
      { name: "Comunicação e reciprocidade em casa", items: [
        { text: "Não olha ou olha pouco nos olhos durante interações afetivas.", emoji: "👀", example: "Ex.: desvia o olhar mesmo no colo, em momentos gostosos." },
        { text: "Demora ou falha em responder quando é chamado(a) pelo nome.", emoji: "📣", example: "Ex.: parece 'não ouvir' o nome, mas escuta o barulho do desenho." },
        { text: "Aponta pouco para mostrar/compartilhar interesse (não só para pedir).", emoji: "👉", example: "Ex.: não aponta o avião no céu para você olhar junto." },
        { text: "Compartilha pouco: não traz objetos para mostrar nem busca o olhar do adulto nas descobertas.", emoji: "🎁", example: "Ex.: brinca de costas para a família, sem 'olha, mãe!'." },
        { text: "Usa a mão do adulto como ferramenta para conseguir o que quer.", emoji: "🤝", example: "Ex.: pega sua mão e leva até a porta ou o pote, sem olhar para você." },
      ] },
      { name: "Brincar, interesses e sensorialidade", items: [
        { text: "Brincar repetitivo: enfileira, gira, organiza — com pouco faz de conta.", emoji: "🚗", example: "Ex.: enfileira carrinhos em vez de fazê-los 'andar'." },
        { text: "Interesses intensos e restritos, difíceis de interromper.", emoji: "🔍", example: "Ex.: só quer saber de um único tema/objeto o dia todo." },
        { text: "Movimentos repetitivos com corpo ou mãos quando animado(a) ou tenso(a) (flapping, girar, balançar).", emoji: "🦋", example: "Ex.: sacode as mãos quando vê algo empolgante." },
        { text: "Reações sensoriais intensas: incômodo com sons/texturas OU busca incomum (cheirar, olhar de lado, tocar tudo).", emoji: "🎧", example: "Ex.: tapa os ouvidos no liquidificador; olha rodinhas bem de perto." },
        { text: "Sofrimento importante com mudanças de rotina ou de caminho.", emoji: "🔄", example: "Ex.: crise intensa quando muda o trajeto da escola." },
      ] },
    ],
  },
  "podj-tea-prime-escola-terapia": {
    instruction: "Preenchida pela ESCOLA ou equipe TERAPÊUTICA (aplicada/revisada pelo clínico): frequência de cada comportamento nos últimos 2 meses no ambiente coletivo.",
    infoBox: "PODJ-TEA PRIME — Ficha Escola/Terapia (protocolo autoral Dr. Jadson Fraga). Observação estruturada em ambiente coletivo, de 2 a 18 anos, complementar à entrevista familiar: sinais sociais aparecem de forma diferente no grupo. Não substitui avaliação diagnóstica padronizada.",
    labels: FREQ4,
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "PODJ-TEA Escola/Terapia — total (0–30)",
    bands: [...TRIAGEM_BANDS],
    domains: [
      { name: "Interação no grupo", items: [
        { text: "Fica à margem das brincadeiras coletivas ou interage só com adultos.", emoji: "🧍", example: "Ex.: no recreio, anda sozinho(a) pela borda do pátio." },
        { text: "Tem dificuldade de entrar, manter e revezar em brincadeiras com pares.", emoji: "🎲", example: "Ex.: quer o jogo só do seu jeito ou desiste na primeira troca de vez." },
        { text: "Comunicação pouco funcional no grupo: não pede ajuda, não comenta, não responde aos colegas.", emoji: "💬", example: "Ex.: precisa que a professora 'traduza' o que ele(a) quer." },
        { text: "Entende mal combinados sociais, ironia e brincadeiras — leva ao pé da letra.", emoji: "😐", example: "Ex.: acha que o apelido carinhoso é ofensa e revida." },
        { text: "Pouca imitação e pouco acompanhamento das atividades dirigidas em roda/grupo.", emoji: "🎵", example: "Ex.: na música com gestos, não acompanha os movimentos do grupo." },
      ] },
      { name: "Rotinas, rigidez e sensorialidade no coletivo", items: [
        { text: "Sofre nas transições entre atividades (parquinho → sala, troca de professora).", emoji: "🚪", example: "Ex.: crise ao encerrar uma atividade preferida." },
        { text: "Insiste em mesmice: mesmo lugar, mesma ordem, mesmos materiais.", emoji: "📌", example: "Ex.: desorganiza-se se outro colega senta 'na sua cadeira'." },
        { text: "Reage mal ao ambiente sensorial coletivo (barulho da turma, sinal, refeitório).", emoji: "🔔", example: "Ex.: tapa os ouvidos ou foge do refeitório barulhento." },
        { text: "Comportamentos repetitivos visíveis no grupo (balançar, girar, vocalizar).", emoji: "🌀", example: "Ex.: balança o corpo na rodinha ou vocaliza sons repetidos." },
        { text: "Habilidades que faz com um adulto 1:1 não aparecem no grupo (não generaliza).", emoji: "🔁", example: "Ex.: fala frases na terapia, mas na sala não usa com colegas." },
      ] },
    ],
  },
};
