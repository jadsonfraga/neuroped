/** NeuroPed OBS-10 v1.1. Source: Manual e Fichas, 17/09/2026, approved conversation brief.
 * Authorial observational workflow, NOT a validated diagnostic/psychometric instrument.
 * Durations, commands and response categories are operational, never normative scores.
 */
export const OBS10_VERSION = "1.2.0";
export const OBS10_TITLE = "Avaliação de Pré-Consulta por Fachetária";
export const OBS10_ROUTE = "/avaliacao-pre-consulta-faixa-etaria";
export const MAX_SECONDS = 600;
export const PHASES = [
  { title: "Acolher e observar", start: 0, end: 30, icon: "🌱", camera: "Filme a chegada e os movimentos espontâneos. Não dê comandos imediatamente." },
  { title: "Interagir e conversar", start: 30, end: 120, icon: "💬", camera: "Mostre rosto, mãos, interlocutor e brinquedos. Grave sua voz e a resposta." },
  { title: "Linguagem e raciocínio", start: 120, end: 240, icon: "🧩", camera: "Mostre o material, a criança e qualquer ajuda. Não dê pistas para acertar." },
  { title: "Movimentar com segurança", start: 240, end: 390, icon: "👣", camera: "Corpo inteiro, pés e trajeto visíveis. Cuidador próximo; mantenha os apoios habituais." },
  { title: "Mãos, desenho e escrita", start: 390, end: 510, icon: "✏️", camera: "Mostre as duas mãos, o objeto e a folha por um ângulo oblíquo. Não corrija a pega." },
  { title: "Retomar e encerrar", start: 510, end: 600, icon: "🌟", camera: "Grave a última tarefa e o encerramento. Não repita para obter uma resposta melhor." },
] as const;
export type AgeBand = {
  id: string; label: string; min: number; max: number; icon: string;
  materials: string; reference: string; caution: string; tasks: readonly string[];
};
export const MOTOR_CORE = [
  "0–20 s · ‘Olhe este brinquedo/caneta enquanto eu movo devagar.’ Pequeno arco horizontal e vertical, sem luz. ‘Pode sorrir?’",
  "20–60 s · ‘Caminhe até a marca, vire e volte no seu ritmo.’ Cerca de 3 metros de piso plano; somente se seguro, com cuidador próximo.",
  "60–80 s · ‘Sente no chão e levante do seu jeito.’ Apenas se habitual e sem dor/risco; caso contrário, levantar da cadeira. Não impedir apoio das mãos.",
  "80–95 s · ‘Estique os braços à frente, com as palmas para cima, e fique assim um pouquinho.’ Até 10 segundos, olhos abertos, sem resistência.",
  "95–120 s · ‘Toque o seu nariz com este dedo e depois o meu dedo.’ Três movimentos de cada lado, lentamente, sem exigir velocidade.",
  "120–140 s · ‘Fique em um pé por um pouquinho, depois no outro.’ Até 5 segundos por lado, apenas com marcha estável e proteção próxima. Olhos abertos.",
  "140–150 s · Encerrar, permitir sentar e registrar tarefas omitidas. Não acrescentar provas.",
] as const;
const motor = "Aplicar o núcleo motor abaixo, em até 2min30. Não repetir para melhorar a execução. Omitir qualquer tarefa insegura e registrar o motivo.";
const rule = "‘Quando eu disser SOL, bata uma vez na mesa; quando disser LUA, deixe as mãos paradas.’ Uma prática de cada. Se não entender, omitir. Sequência: SOL–SOL–LUA–SOL–LUA–LUA–SOL–LUA, com 2–3 segundos entre estímulos. Não somar pontos.";
export const AGE_BANDS: readonly AgeBand[] = [
  { id: "m00", label: "0–2 meses", min: 0, max: 3, icon: "🐣", materials: "Colchonete firme no chão e brinquedo grande de alto contraste. Cuidador faz o posicionamento.", reference: "Por volta de 2 meses: atenção ao rosto, sorriso em interação, vocalizações além do choro e breve elevação da cabeça em prono. Não exigir esse conjunto de um recém-nascido.", caution: "Não realizar tração para sentar, suspensão, reflexos ou sustos. Prono apenas com autorização médica, acordado e tolerando. Não interpretar tônus pelo vídeo.", tasks: [
    "Registrar se está acordado e confortável; filmar posição espontânea, abertura dos olhos e movimentos dos quatro membros. Não provocar choro.",
    "Pedir ao cuidador que converse e sorria perto do rosto, sem exigir fixação. Pausar. Se houver choro espontâneo, registrar o acolhimento habitual, sem provocar desconforto.",
    "Apresentar o brinquedo parado e movê-lo lentamente em pequeno arco para cada lado. Alternar com rosto e voz do cuidador. Registrar vocalizações e orientação observáveis.",
    "Filmar deitado de costas. SOMENTE com autorização médica, acordado e confortável: cuidador coloca de bruços por 15–30 segundos no chão, supervisionando continuamente. Interromper diante de desconforto.",
    "Voltar à posição confortável. Observar abertura das mãos e movimentos para a linha média, sem abrir dedos à força ou usar peças pequenas.",
    "Retomar a interação acolhedora. Encerrar antes se houver cansaço; não é necessário preencher dez minutos.",
  ] },
  { id: "m03", label: "3–5 meses", min: 3, max: 6, icon: "🧸", materials: "Colchonete e brinquedo leve, grande, sem peças destacáveis.", reference: "Referência aos 4 meses: trocas vocais, orientação à voz, cabeça mais estável quando segurado, segurar brinquedo oferecido e apoio nos antebraços em prono.", caution: "Não retirar apoios para testar queda. Não exigir sentar sozinho ou rolar aos 3 meses; instabilidade observada não estabelece hipotonia.", tasks: [
    "Registrar alerta, conforto e postura espontânea no colo ou no colchonete.",
    "Cuidador conversa, sorri e faz uma pausa. Repetir uma vocalização emitida pelo bebê e aguardar. Sem cócegas ou sustos.",
    "Mostrar brinquedo na linha média e depois de cada lado. Aproximar do alcance das mãos e observar olhar, alcance e exploração.",
    "Filmar no colo com apoio habitual da cabeça e do tronco. Somente se autorizado e tolerado: 30–45 segundos de bruços no chão. Não retirar apoio.",
    "Oferecer brinquedo a uma mão e depois à outra, sem forçar abertura. Observar se sustenta e leva mãos à boca. Não exigir transferência entre mãos.",
    "Retomar troca vocal, observar conforto e encerrar se houver fadiga.",
  ] },
  { id: "m06", label: "6–8 meses", min: 6, max: 9, icon: "🌼", materials: "Colchonete, dois brinquedos grandes e leves e recipiente largo.", reference: "Aos 6 meses: alcançar objeto, alternar sons, apoiar braços estendidos em prono e usar mãos como apoio ao sentar. Rolamento integra a vigilância, não um teste de aprovação.", caution: "Não exigir sentar sem apoio aos 6 meses. Não usar alimento, grão ou moeda para pinça. Não demonstrar no vídeo não significa não conseguir.", tasks: [
    "Registrar conforto, postura e movimentos espontâneos.",
    "Cuidador conversa e espera vocalização. Brincar de aparecer e desaparecer com o próprio rosto; nunca cobrir a face do bebê.",
    "Oferecer brinquedo na linha média e de cada lado. Disponibilizar um segundo brinquedo; observar interesse e exploração sem impor um jeito de brincar.",
    "No chão firme, observar apoio em prono se autorizado, tentativas espontâneas de rolar e sentar com apoio habitual. Cuidador ao alcance para impedir queda. Não produzir movimentos passivamente.",
    "Observar uso das duas mãos e eventual transferência. Permitir alcançar o recipiente. Sem peças pequenas ou alimento.",
    "Retomar interação com o cuidador. Encerrar antes se necessário.",
  ] },
  { id: "m09", label: "9–11 meses", min: 9, max: 12, icon: "🐻", materials: "Dois blocos grandes, brinquedo, pano para esconder só o brinquedo e colchonete.", reference: "Aos 9 meses: sentar sem apoio, assumir posição sentada, transferir objetos, balbucio variado e orientação quando chamado, conforme estado e oportunidade.", caution: "Engatinhar não é condição de aprovação. Registrar ‘não se orientou nas oportunidades filmadas’, não ‘não responde ao nome’. Não concluir audição normal ou autismo.", tasks: [
    "Filmar exploração espontânea e postura no chão ou colo.",
    "Cuidador chama como habitualmente, em voz usual, em até duas ocasiões separadas. Brincar de aparecer e desaparecer. Não exigir contato ocular.",
    "Esconder parcialmente brinquedo sob pano diante da criança e aguardar busca. Registrar balbucio, gestos e pedidos; retirar o pano se houver frustração.",
    "Observar sentar sem apoio quando já realizado, transições espontâneas e deslocamento habitual. Cuidador previne queda. Não colocar de pé à força.",
    "Entregar um bloco grande e depois outro. Modelar uma vez bater blocos entre si; registrar também transferência espontânea.",
    "Solicitar troca simples com o brinquedo e avisar o encerramento. Não retirar objeto de conforto.",
  ] },
  { id: "m12", label: "12–17 meses", min: 12, max: 18, icon: "🪁", materials: "Blocos grandes, copo plástico vazio, boneco, livro cartonado e apoio fixo seguro.", reference: "12 meses: colocar objeto em recipiente e deslocar-se com apoio. 15 meses: mostrar, apontar para pedir, tentar palavras, empilhar dois objetos e dar alguns passos. Diferenciar 12 de 15 meses.", caution: "Não exigir marcha livre de toda criança de 12 meses. Amostra verbal não mede vocabulário total. Sem peças pequenas.", tasks: [
    "Disponibilizar dois objetos e observar escolha e manipulação.",
    "Cuidador faz até duas chamadas naturais separadas. Oferecer escolha. Apontar para brinquedo: ‘Olha!’ Observar pedir, mostrar e compartilhar; sem exigir olhar nos olhos.",
    "‘Me dê o bloco’, com a mão estendida. Depois ‘Coloque aqui’, mostrando recipiente. Perguntar sobre figura familiar e observar uso de copo ou boneco.",
    "Observar levantar com apoio, deslocar-se junto a móvel e passos espontâneos se presentes. Ida e volta curta sem puxar pelos braços. Manter apoios habituais.",
    "Oferecer dois blocos para empilhar; modelar uma vez se necessário. Explorar livro e colocar/retirar objetos grandes de recipiente.",
    "‘Vamos guardar este e pegar o livro.’ Observar recusa, pedido de ajuda e reengajamento. Sem confronto.",
  ] },
  { id: "m18", label: "18–23 meses", min: 18, max: 24, icon: "🌷", materials: "Boneco, colher de brinquedo grande, carrinho, blocos grandes, giz grosso e papel.", reference: "Aos 18 meses: marcha independente, rabiscos, comando simples sem gesto, tentativas de palavras e apontar para compartilhar. Faz de conta é sondagem, não corte diagnóstico.", caution: "Distinguir espontâneo de imitado. Pouca fala, recusa ou falta de simbolização no trecho não estabelecem diagnóstico.", tasks: [
    "Permitir escolher um brinquedo. Observar exploração e iniciativa.",
    "Oferecer escolha, acompanhar interesse e observar mostrar/apontar. Chamar naturalmente em até duas ocasiões, sem insistir.",
    "‘Me dê o carrinho’, sem apontar. Se não responder, repetir uma vez e depois acrescentar gesto, registrando. Boneco e colher: ‘O bebê está com fome; vamos brincar?’ Se necessário, modelar uma ação.",
    "Pedir levar brinquedo ao cuidador em trajeto curto. Colocar outro objeto grande no chão e convidar a pegar, sem obrigar agachamento. Observar levantar, andar e virar.",
    "Oferecer giz grosso: ‘Pode desenhar.’ Permitir rabiscos e breve montagem com blocos; não corrigir preensão ou uso da outra mão.",
    "‘Agora vamos guardar dois brinquedos.’ Ajudar se necessário e registrar como solicita apoio e se reorganiza.",
  ] },
  { id: "m24", label: "24–35 meses", min: 24, max: 36, icon: "🚂", materials: "Livro, boneco, copo e colher de brinquedo, bola macia, giz grosso e blocos grandes.", reference: "24 meses: combinar duas palavras, apontar partes do corpo, usar duas mãos e chutar bola. 30 meses: combinações com verbos, dois passos e salto com ambos os pés. Não antecipar exigências de 30 meses.", caution: "Antes de 30 meses, omitir o desafio adicional de dois passos e o salto. Não exigir geometria nem número de blocos. Frustração breve não estabelece transtorno.", tasks: [
    "Disponibilizar brinquedos e registrar exploração espontânea.",
    "‘O que você quer brincar?’ Observar escolha e combinações de palavras. Com boneco: ‘Ele quer dormir; o que fazemos?’",
    "Pedir apontar duas partes do corpo e uma figura do livro. SOMENTE aos 30 meses ou mais: ‘Pegue o bloco e coloque no copo’, sem gesto inicial.",
    "Pedir caminhada curta, virada e chute em bola macia. SOMENTE aos 30 meses ou mais, se seguro: convidar a pequeno salto com dois pés. Sem escada.",
    "Observar rabiscos, abrir recipiente fácil e ação coordenada das mãos. Não exigir figura geométrica ou número de blocos.",
    "Avisar troca para guardar objeto e folhear livro. Registrar comunicação de desagrado e recuperação com ajuda.",
  ] },
  { id: "y03", label: "3 anos", min: 36, max: 48, icon: "🦋", materials: "Boneco, objetos de brincar, livro, papel, giz/lápis grosso e bola macia.", reference: "Aos 3 anos: trocas de conversa, descrever ações em figuras, fala geralmente compreensível e círculo após demonstração. Demais desafios são qualitativos.", caution: "Sem exigir alfabetização. Não interpretar desenho de forma projetiva nem diagnosticar linguagem, apraxia ou emoção por uma palavra/desenho/recusa.", tasks: [
    "Permitir escolher brinquedo. Registrar iniciativa e adaptação ao ambiente.",
    "‘Do que você gosta de brincar?’ ‘O que deixa você chateado?’ Aceitar gesto ou brincadeira; não sugerir emoção pela aparência.",
    "Mostrar figura: ‘O que está acontecendo?’ Propor duas ações com boneco, como comer e dormir. Dar instrução familiar de dois passos e registrar ajuda.",
    "Convidar a caminhar, virar, pegar objeto grande no chão e chutar bola macia. Observar levantar espontâneo. Pequeno salto de pés juntos apenas se seguro; olhos abertos.",
    "Desenhar círculo: ‘Faça um parecido.’ Permitir desenho livre e blocos. Observar preensão e apoio da outra mão sem corrigir ou interpretar simbolismo.",
    "Fazer duas trocas de bola/brinquedo. Avisar o fim; oferecer escolha de qual guardar primeiro.",
  ] },
  { id: "y04", label: "4 anos", min: 48, max: 60, icon: "🎨", materials: "Livro com cena simples, papel, lápis/giz, pares de blocos e bola macia grande.", reference: "Aos 4 anos: frases de quatro ou mais palavras, relato do dia, utilidade dos objetos, pessoa com três ou mais partes e recepção de bola grande. Duas tentativas não medem frequência habitual.", caution: "Copiar cruz é sondagem, não corte obrigatório. Não atribuir atraso global por um erro nem interpretar conteúdo emocional do desenho.", tasks: [
    "Observar entrada, iniciativa e escolha de atividade.",
    "‘Conte uma coisa que aconteceu hoje.’ ‘Teve algo que deixou você preocupado ou chateado?’ Acolher sem interrogar conteúdos sensíveis.",
    "Mostrar cena e perguntar o que acontece. ‘Para que serve um guarda-chuva?’ Separar objetos por característica visível; mudar critério só se entender o primeiro.",
    "Caminhar e virar, pegar objeto no chão e levantar espontaneamente. Convidar a receber duas bolas lançadas suavemente ao tronco de pequena distância. Não forçar corrida ou equilíbrio.",
    "‘Desenhe uma pessoa.’ Depois modelar círculo e cruz para copiar. Registrar execução e preensão. A cruz não é exigência diagnóstica.",
    "‘Vamos terminar o desenho e guardar o lápis.’ Oferecer escolha e perguntar qual parte gostou, aceitando não responder.",
  ] },
  { id: "y05", label: "5 anos", min: 60, max: 72, icon: "🌈", materials: "Papel, lápis e cinco blocos grandes. História e regra estão nesta tela.", reference: "Aos 5 anos: narrativa com dois acontecimentos, respostas sobre história, contagem até dez, algumas letras e salto em um pé. SOL/LUA e quadrado são sondagens sem corte etário.", caution: "Não exigir leitura de texto. Erros na regra podem refletir compreensão, audição, novidade ou atenção; não diagnosticam TDAH.", tasks: [
    "Observar postura, iniciativa, fala espontânea e disponibilidade.",
    "‘O que foi legal nos últimos dias?’ ‘Tem alguma coisa atrapalhando suas brincadeiras ou seu sono?’ Silêncio não significa ausência de sofrimento.",
    "Contar: ‘Um gato ficou preso numa árvore. Uma pessoa trouxe uma escada e ajudou o gato a descer.’ Perguntar ‘O que aconteceu?’ e ‘Como ele desceu?’ Contar cinco blocos e, se confortável, até dez.",
    motor,
    "Pedir algumas letras conhecidas, sem nome completo. Copiar círculo e quadrado simples como sondagem. Observar desenho e manipulação; não corrigir pega.",
    "‘Quando eu disser SOL, bata uma vez na mesa; quando disser LUA, deixe as mãos paradas.’ Treinar uma vez cada. Fazer SOL–LUA–SOL–LUA com 2–3 segundos entre eles. Omitir se não compreender. Avisar o fim.",
  ] },
  { id: "y06", label: "6–8 anos", min: 72, max: 108, icon: "🧭", materials: "Papel, lápis e frase simples. Recursos de comunicação habituais disponíveis.", reference: "Amostra de compreensão, narrativa, aquisição escolar e coordenação em tarefas acessíveis. Sem normas próprias de leitura, palavras lembradas, equilíbrio ou erros por idade.", caution: "Registrar escolaridade, idioma e adaptações. Se não houve registro inicial das palavras, evocação não isola retenção. Não estimar QI, dislexia ou atenção habitual.", tasks: [
    "Observar entrada, postura, iniciativa e atividade espontânea.",
    "‘Você sabe por que veio aqui?’ ‘Como tem se sentido?’ ‘O que está mais difícil na escola ou em casa?’ Oferecer conversa privada com o médico. Não pedir nomes de colegas.",
    "‘Guarde estas palavras para me contar depois: casa, gato, pão.’ Pedir repetição; no máximo duas apresentações. Registrar literalmente e marcar horário do registro. Depois: ‘Pegue o papel e coloque o lápis em cima dele.’ Perguntar o que fez antes de chegar.",
    motor,
    "Se compatível com ensino recebido, convidar a ler ‘O gato dorme na cadeira’, até 20 segundos, sem constranger. Copiar ou escrever frase curta espontânea. Tocar polegar nos outros dedos, uma mão por vez.",
    "Perguntar as três palavras sem dica inicial; marcar horário da evocação. " + rule + " Avisar o encerramento.",
  ] },
  { id: "y09", label: "9–11 anos", min: 108, max: 144, icon: "🔭", materials: "Papel, lápis e duas frases compatíveis com escolaridade, sem dados pessoais reais.", reference: "Observar sequência de ideias e ações, leitura com compreensão, escrita e autocorreção. Tarefas autorais sem percentis, idade cognitiva ou nota de corte.", caution: "Comportamento adequado por dez minutos não exclui dificuldade habitual. Risco suicida dos 8 aos 11 anos: fluxo clínico próprio quando indicado; não investigar trauma filmando.", tasks: [
    "Registrar postura, atividade e iniciativa sem pedir que pareça mais atento.",
    "Perguntar onde está e por que veio. ‘Como tem sido seu humor?’ ‘Alguma preocupação atrapalha sono, estudo ou convivência?’ Oferecer conversa privada com médico; sem explorar trauma na câmera.",
    "Apresentar casa–gato–pão; pedir repetição, máximo duas apresentações, registrar e marcar horário. ‘Toque na mesa, vire a folha e entregue o lápis.’ ‘Como você organizaria a mochila para amanhã?’ Não corrigir durante execução.",
    motor,
    "Ler duas frases compatíveis com escolaridade e explicar sentido. Escrever uma frase. Após modelo, alternar palma/dorso na mesa por cerca de 5 segundos com cada mão.",
    "Pedir palavras sem dicas; marcar horário de evocação. " + rule + " Descrever compreensão e tipo de erro, sem escore.",
  ] },
  { id: "y12", label: "12–17 anos", min: 144, max: 216, icon: "✨", materials: "Papel e lápis. Privacidade e oportunidade de entrevista médica sem acompanhante.", reference: "Discurso, raciocínio contextual, planejamento, grafismo, flexibilidade e funcionamento referido. Sem presumir maturidade uniforme dos 12 aos 17 anos.", caution: "Linguagem respeitosa, não infantilizada. Aparência tranquila não exclui risco. Rastreio específico de risco suicida a partir de 12 anos pertence ao fluxo clínico confidencial por equipe treinada.", tasks: [
    "Explicar finalidade e reafirmar que pode recusar tarefa ou gravação. Observar postura, iniciativa e fala espontânea.",
    "Confirmar onde está e por que veio. ‘Nas últimas duas semanas, como ficaram seu humor, energia e interesse?’ ‘O que mais atrapalha sua rotina?’ Oferecer conversa médica sem acompanhante. Sem intimidades na câmera.",
    "Apresentar casa–gato–pão e verificar repetição, no máximo duas apresentações; marcar horário. ‘Como você dividiria três tarefas escolares para terminar hoje?’ ‘Em que uma bicicleta e um ônibus se parecem?’ Aceitar respostas plausíveis, sem exigir uma abstração única.",
    motor,
    "Uma frase escrita explicando atividade de interesse e breve resumo oral do que escreveu. Modelar alternância palma/dorso por cerca de 5 segundos em cada mão.",
    "Pedir palavras sem dicas; marcar horário da evocação. " + rule + " Só se compreender e couber no tempo, inverter regra por quatro estímulos. Encerrar perguntando se prefere dizer algo diretamente ao médico.",
  ] },
];
export const OUTCOMES = [
  { id: "E", label: "Na proposta inicial", description: "Sem ajuda adicional à proposta da tarefa; quando há modelo previsto, não significa produção espontânea." },
  { id: "V", label: "Após repetição", description: "Precisou ouvir o comando novamente." },
  { id: "M", label: "Após gesto/modelo", description: "Precisou de gesto ou demonstração permitida; registre se o modelo já fazia parte da tarefa." },
  { id: "A", label: "Com apoio habitual", description: "Descreva a adaptação ou apoio de segurança. Não executar pela criança." },
  { id: "ND", label: "Não demonstrado", description: "Houve oportunidade, mas não demonstrou neste momento. Não significa incapacidade." },
  { id: "R", label: "Recusou", description: "Não quis participar. Não insistir; recusa não é diagnóstico." },
  { id: "NA", label: "Não avaliável / não aplicado", description: "Informe motivo: tempo, segurança, acesso à tarefa, áudio ou enquadramento." },
] as const;
export type Outcome = typeof OUTCOMES[number]["id"];
export function bandForMonths(months: number): AgeBand | undefined {
  return Number.isFinite(months) && months >= 0 ? AGE_BANDS.find((b) => months >= b.min && months < b.max) : undefined;
}
export function phaseForSeconds(seconds: number): number {
  if (seconds >= MAX_SECONDS) return PHASES.length - 1;
  return Math.max(0, PHASES.findIndex((p) => seconds < p.end));
}
export function elapsedSeconds(start: number, now: number): number {
  return Math.min(MAX_SECONDS, Math.max(0, Math.floor((now - start) / 1000)));
}
export function clock(seconds: number): string {
  const safe = Math.max(0, Math.min(MAX_SECONDS, Math.floor(seconds)));
  return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
}
export const SOURCES = [
  ["CDC · Marcos do desenvolvimento (vigilância, não teste)", "https://www.cdc.gov/act-early/milestones/index.html"],
  ["AAP · Vigilância e rastreio do desenvolvimento", "https://publications.aap.org/pediatrics/article/145/1/e20193449/36971/Promoting-Optimal-Development-Identifying-Infants"],
  ["AAP · Idade corrigida para prematuros", "https://www.healthychildren.org/English/ages-stages/baby/preemie/Pages/Corrected-Age-For-Preemies.aspx"],
  ["AAP · Fluxo clínico de risco suicida", "https://www.aap.org/en/patient-care/blueprint-for-youth-suicide-prevention/strategies-for-clinical-settings-for-youth-suicide-prevention/screening-for-suicide-risk-in-clinical-practice/"],
  ["NIMH · Saúde mental de crianças e adolescentes", "https://www.nimh.nih.gov/health/publications/children-and-mental-health"],
  ["LGPD · Lei 13.709/2018", "https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm"],
] as const;
