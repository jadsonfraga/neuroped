// ============================================================
// PODJ-TEA PRIME — Inventário observacional por faixa etária
//
// Conteúdo AUTORAL (Dr. Jadson Fraga), transcrito literalmente das
// Fichas de Aplicação do "Kit Fichas por Paciente" (PODJ-TEA PRIME):
//   • 1–6A   → 12 meses a 5 anos e 11 meses (80 itens observáveis)
//   • 6–12A  → 6 anos a 12 anos e 11 meses  (80 itens observáveis)
//   • 12–19A → 12 a 19 anos                 (80 itens observáveis)
//
// Cada item é observado pelo profissional e pontuado na MESMA legenda
// qualitativa da ficha original:
//   0 adequado · 1 discreto · 2 claro/moderado · 3 intenso/importante
//   NO não observado · NA não aplicável
//
// As "estações" (materiais/domínios de aplicação da folha de pontuação)
// foram REMOVIDAS a pedido do autor — mantém-se apenas o inventário de
// itens por faixa etária, agrupado por eixo clínico.
//
// Por decisão do autor (2026), o RESULTADO no app exibe apenas as
// perguntas e as respostas selecionadas por extenso — sem escore, ponto
// de corte, percentual ou classificação automática (o GenericScale já
// respeita isso). As faixas abaixo existem só para satisfazer o tipo e
// não são exibidas. Método observacional complementar — não é teste
// diagnóstico isolado; usar dentro do escopo profissional.
// ============================================================
import { ClipboardList, type LucideIcon } from "lucide-react";
import type { InteractiveScaleDef, InteractiveBand } from "./interactiveScaleItems";

// Legenda de pontuação idêntica à das fichas originais.
const PODJ_LABELS = [
  "0 · Adequado",
  "1 · Discreto",
  "2 · Claro / moderado",
  "3 · Intenso / importante",
  "NO · Não observado",
  "NA · Não aplicável",
];
// 0–3 refletem intensidade; NO/NA não somam. O escore não é exibido
// (resultado por extenso), então serve apenas para persistência interna.
const PODJ_POINTS = [0, 1, 2, 3, 0, 0];

const PODJ_INSTRUCTION =
  "Observe ou colha exemplos concretos e marque apenas uma pontuação por item, conforme a legenda (0 adequado · 1 discreto · 2 claro/moderado · 3 intenso/importante · NO não observado · NA não aplicável). Ao marcar 2 ou 3, descreva a evidência objetiva. No fechamento, resuma o impacto funcional e os diferenciais.";

// Faixa mínima obrigatória pelo tipo — NÃO é exibida (resultado por extenso).
const PODJ_BANDS: InteractiveBand[] = [
  {
    minPct: 0,
    classification: "Registro de respostas — análise clínica pelo profissional",
    color: "emerald",
    description:
      "Método observacional complementar (autoral). O resultado apresenta apenas as perguntas e as respostas selecionadas por extenso. A leitura clínica — pervasividade, impacto funcional e diferenciais — é do profissional.",
  },
];

const ICON: LucideIcon = ClipboardList;

export const podjTeaPrimeItems: Record<string, InteractiveScaleDef> = {
  // ----------------------------------------------------------
  // 1–6A · 12 meses a 5 anos e 11 meses (80 itens)
  // ----------------------------------------------------------
  "podj-tea-prime-1-6a": {
    icon: ICON,
    gradient: "from-violet-500 to-purple-600",
    instruction: PODJ_INSTRUCTION,
    infoBox:
      "PODJ-TEA PRIME — Inventário observacional 12 meses a 5 anos e 11 meses. Método clínico-observacional autoral, complementar e ainda sem validação psicométrica própria. Não usar como teste diagnóstico isolado nem como substituto de avaliação médica, psicológica, neuropsicológica, fonoaudiológica, terapêutica ocupacional ou multiprofissional.",
    labels: PODJ_LABELS,
    optionPoints: PODJ_POINTS,
    scoreDirection: "higher_worse",
    totalLabel: "Inventário PODJ-TEA PRIME 1–6A",
    bands: PODJ_BANDS,
    domains: [
      {
        name: "Comunicação social e reciprocidade",
        color: "text-violet-600 dark:text-violet-400",
        items: [
          { text: "Responde ao nome de forma consistente e socialmente dirigida", emoji: "👂", example: "Ex.: quando você chama o nome dele, ele para e olha para você, não só às vezes?" },
          { text: "Busca o rosto do adulto durante interação prazerosa", emoji: "👀", example: "Ex.: numa brincadeira gostosa, ele procura olhar no seu rosto?" },
          { text: "Sorri socialmente em resposta ao outro", emoji: "😊", example: "Ex.: quando você sorri para ele, ele devolve o sorriso?" },
          { text: "Alterna olhar entre pessoa e objeto", emoji: "🔄", example: "Ex.: ao ver um brinquedo, ele olha o objeto e depois olha para você?" },
          { text: "Procura o adulto para compartilhar, não apenas para pedir", emoji: "🤝", example: "Ex.: ele te mostra algo só para dividir a alegria, não só para conseguir o que quer?" },
          { text: "Demonstra prazer em jogos sociais simples", emoji: "🙈", example: "Ex.: ele se diverte em brincadeiras como esconde-esconde ou cadê-achou?" },
          { text: "Reconhece mudanças emocionais no adulto", emoji: "😟", example: "Ex.: se você fica triste ou bravo, ele percebe e reage?" },
          { text: "Aproxima-se de pessoas familiares espontaneamente", emoji: "🏃", example: "Ex.: ele vai sozinho até avó, pai ou irmãos por vontade própria?" },
          { text: "Diferencia presença humana de objetos de interesse", emoji: "❤️", example: "Ex.: ele demonstra que gente é diferente de brinquedo, buscando as pessoas?" },
          { text: "Mantém engajamento social por tempo compatível com a idade", emoji: "⏱️", example: "Ex.: ele consegue brincar junto com você por um tempo, sem se desligar logo?" },
        ],
      },
      {
        name: "Atenção compartilhada e gestos",
        color: "text-violet-600 dark:text-violet-400",
        items: [
          { text: "Aponta para pedir objetos ou ajuda", emoji: "👉", example: "Ex.: ele aponta o dedo para o que quer, como um brinquedo ou comida?" },
          { text: "Aponta para mostrar algo interessante", emoji: "☝️", example: "Ex.: ele aponta um cachorro ou avião só para te mostrar, não para pedir?" },
          { text: "Segue o apontar do adulto", emoji: "👀", example: "Ex.: quando você aponta algo longe, ele olha para onde você mostra?" },
          { text: "Mostra objetos espontaneamente", emoji: "🧸", example: "Ex.: ele te traz ou levanta um brinquedo para você ver, por conta própria?" },
          { text: "Leva objetos para compartilhar, não apenas entregar", emoji: "🎁", example: "Ex.: ele te dá algo para dividir o interesse, olhando no seu rosto, não só entregar?" },
          { text: "Busca aprovação social após conquista", emoji: "🙌", example: "Ex.: depois de acertar algo, ele olha para você esperando um elogio?" },
          { text: "Compartilha surpresa, alegria ou medo", emoji: "😲", example: "Ex.: diante de um susto ou surpresa, ele te olha para dividir a reação?" },
          { text: "Alterna olhar entre objeto desejado e adulto", emoji: "🔄", example: "Ex.: querendo algo, ele olha o objeto, olha para você e volta a olhar o objeto?" },
          { text: "Usa gestos para chamar atenção", emoji: "🙋", example: "Ex.: ele acena, estica os braços ou faz gestos para você notar ele?" },
          { text: "Sustenta atenção conjunta por alguns segundos", emoji: "⏱️", example: "Ex.: ele consegue olhar a mesma coisa que você por alguns segundos?" },
        ],
      },
      {
        name: "Linguagem e comunicação verbal",
        color: "text-violet-600 dark:text-violet-400",
        items: [
          { text: "Usa sons, gestos ou palavras para pedir", emoji: "🗣️", example: "Ex.: ele faz sons, aponta ou fala para pedir o que precisa?" },
          { text: "Usa comunicação para compartilhar interesses", emoji: "💬", example: "Ex.: ele fala ou gesticula para dividir algo que achou legal, não só para pedir?" },
          { text: "Compreende comandos simples com contexto", emoji: "🧠", example: "Ex.: com o contexto ajudando, ele entende 'pega a bola' ou 'vem cá'?" },
          { text: "Compreende comandos simples sem pistas visuais", emoji: "👂", example: "Ex.: só com a fala, sem você apontar ou mostrar, ele entende um pedido?" },
          { text: "Usa palavras funcionais", emoji: "🔤", example: "Ex.: ele usa palavras com sentido, como 'água', 'mamãe' ou 'quero'?" },
          { text: "Combina palavras de modo comunicativo", emoji: "🔗", example: "Ex.: ele junta duas palavras para se comunicar, como 'quer água'?" },
          { text: "Usa fala para interação, não apenas repetição", emoji: "💬", example: "Ex.: ele conversa e responde, em vez de só repetir frases soltas?" },
          { text: "Apresenta ecolalia imediata clinicamente relevante", emoji: "🔁", example: "Ex.: ao ser perguntado, ele repete a pergunta em vez de responder?" },
          { text: "Apresenta ecolalia tardia ou fala roteirizada", emoji: "📺", example: "Ex.: ele repete falas de desenhos ou frases decoradas fora de hora?" },
          { text: "Ajusta entonação e volume ao contexto", emoji: "🔊", example: "Ex.: ele fala mais baixo em lugar calmo e muda o tom conforme a situação?" },
        ],
      },
      {
        name: "Comunicação não verbal",
        color: "text-violet-600 dark:text-violet-400",
        items: [
          { text: "Usa gestos convencionais, como tchau ou beijo", emoji: "👋", example: "Ex.: ele dá tchau, manda beijo ou faz gestos que todos entendem?" },
          { text: "Balança a cabeça para sim ou não", emoji: "🙆", example: "Ex.: ele balança a cabeça para concordar ou negar quando você pergunta?" },
          { text: "Usa expressão facial variada", emoji: "😄", example: "Ex.: o rosto dele muda conforme a emoção: alegria, surpresa, tristeza?" },
          { text: "Coordena olhar, gesto e vocalização", emoji: "🤹", example: "Ex.: ele junta olhar, apontar e som ao mesmo tempo para se comunicar?" },
          { text: "Demonstra emoção de forma compartilhada", emoji: "🥰", example: "Ex.: ele te olha ao demonstrar alegria, como se dividisse o sentimento?" },
          { text: "Entende expressão facial do adulto", emoji: "🧐", example: "Ex.: ele percebe pelo seu rosto se você está feliz, bravo ou triste?" },
          { text: "Usa o corpo para comunicação social", emoji: "🕺", example: "Ex.: ele usa o corpo, como abraçar ou se aproximar, para se comunicar?" },
          { text: "Evita contato visual social de modo persistente", emoji: "🙈", example: "Ex.: ele quase nunca olha nos olhos durante a interação, desviando sempre?" },
          { text: "Usa a mão do adulto como ferramenta", emoji: "✋", example: "Ex.: em vez de apontar, ele pega sua mão e leva até o que quer?" },
          { text: "Apresenta comunicação pouco integrada", emoji: "🧩", example: "Ex.: olhar, gesto, som e expressão parecem soltos, sem se juntar numa mensagem?" },
        ],
      },
      {
        name: "Imitação e aprendizagem social",
        color: "text-violet-600 dark:text-violet-400",
        items: [
          { text: "Imita gestos simples, como bater palmas", emoji: "👏", example: "Ex.: quando você bate palmas, ele copia o gesto?" },
          { text: "Imita movimentos corporais amplos", emoji: "🙆", example: "Ex.: ele copia quando você levanta os braços ou pula?" },
          { text: "Imita ações com objetos", emoji: "🧸", example: "Ex.: se você finge dar comida ao boneco, ele repete a ação?" },
          { text: "Imita sons ou vocalizações", emoji: "🔊", example: "Ex.: ele repete sons que você faz, como 'brum-brum' do carrinho?" },
          { text: "Imita palavras", emoji: "🗣️", example: "Ex.: ele tenta repetir palavras novas quando você fala?" },
          { text: "Imita expressões faciais", emoji: "😜", example: "Ex.: se você faz uma careta, ele tenta imitar seu rosto?" },
          { text: "Aprende observando outra criança ou adulto", emoji: "👀", example: "Ex.: ele aprende a fazer algo só de ver outra pessoa fazendo?" },
          { text: "Copia brincadeiras sociais", emoji: "🎈", example: "Ex.: ele repete brincadeiras que viu outras crianças fazendo?" },
          { text: "Participa de jogos imitativos", emoji: "🎭", example: "Ex.: ele entra em brincadeiras de imitar, como 'faz igual a mim'?" },
          { text: "Usa imitação de forma espontânea e social", emoji: "🤝", example: "Ex.: ele imita por vontade própria para brincar junto, não só quando pedem?" },
        ],
      },
      {
        name: "Brincadeira e criatividade lúdica",
        color: "text-violet-600 dark:text-violet-400",
        items: [
          { text: "Usa brinquedos de modo funcional", emoji: "🧸", example: "Ex.: ele usa o carrinho para andar e o telefone para 'ligar', como devem ser usados?" },
          { text: "Faz brincadeira simples de causa e efeito", emoji: "🔘", example: "Ex.: ele aperta um botão para ver a luz acender ou o som tocar?" },
          { text: "Evita uso exclusivamente repetitivo dos objetos", emoji: "🔁", example: "Ex.: ele varia a brincadeira, sem ficar só girando roda ou enfileirando peças?" },
          { text: "Realiza faz de conta simples", emoji: "🎭", example: "Ex.: ele finge, como dar comidinha ao boneco ou falar no telefone de brinquedo?" },
          { text: "Simula rotina com boneco ou miniaturas", emoji: "🍼", example: "Ex.: ele brinca de dar banho, ninar ou dar comida ao boneco?" },
          { text: "Aceita variações na brincadeira", emoji: "🔀", example: "Ex.: ele aceita quando você propõe um jeito diferente de brincar?" },
          { text: "Compartilha brincadeira com adulto", emoji: "🤝", example: "Ex.: ele brinca junto com você, trocando ações, não sozinho ao seu lado?" },
          { text: "Compartilha brincadeira com criança", emoji: "🧒", example: "Ex.: ele brinca junto com outras crianças, dividindo a brincadeira?" },
          { text: "Tolera interrupção da brincadeira", emoji: "⏸️", example: "Ex.: se a brincadeira para de repente, ele lida sem crise intensa?" },
          { text: "Demonstra criatividade lúdica compatível com a idade", emoji: "✨", example: "Ex.: ele inventa histórias ou usos novos para os brinquedos?" },
        ],
      },
      {
        name: "Interesses restritos, rigidez e comportamentos repetitivos",
        color: "text-violet-600 dark:text-violet-400",
        items: [
          { text: "Alinha objetos repetidamente", emoji: "📏", example: "Ex.: ele enfileira carrinhos ou brinquedos em linha reta várias vezes?" },
          { text: "Gira rodas, tampas ou objetos", emoji: "🔄", example: "Ex.: ele fica girando as rodas do carrinho em vez de brincar com ele?" },
          { text: "Observa objetos por ângulos incomuns", emoji: "🔍", example: "Ex.: ele aproxima muito os olhos ou olha o brinquedo de lado, de canto?" },
          { text: "Apresenta movimentos repetitivos de mãos ou corpo", emoji: "🙌", example: "Ex.: ele balança as mãos, gira o corpo ou faz movimentos repetidos?" },
          { text: "Demonstra apego excessivo a objetos específicos", emoji: "🧲", example: "Ex.: ele precisa andar sempre com um objeto específico e não larga?" },
          { text: "Resiste a mudanças simples de rotina", emoji: "🚧", example: "Ex.: mudar o caminho de casa ou a ordem do banho já causa incômodo?" },
          { text: "Apresenta interesses incomuns para a idade", emoji: "🌀", example: "Ex.: ele se fixa em coisas diferentes do esperado, como ventiladores ou logotipos?" },
          { text: "Repete sequências de forma rígida", emoji: "🔁", example: "Ex.: ele faz sempre a mesma sequência de ações, sem aceitar mudar a ordem?" },
          { text: "Insiste em fazer tudo do mesmo jeito", emoji: "📌", example: "Ex.: tudo precisa ser exatamente igual, mesmo copo, mesmo lugar, mesma rotina?" },
          { text: "Apresenta crises por quebra de padrão esperado", emoji: "💥", example: "Ex.: quando algo sai do padrão que ele espera, tem crise forte de choro ou raiva?" },
        ],
      },
      {
        name: "Sensorialidade e funcionalidade",
        color: "text-violet-600 dark:text-violet-400",
        items: [
          { text: "Hipersensibilidade a sons comuns", emoji: "🔊", example: "Ex.: ele tapa os ouvidos ou se assusta muito com liquidificador, aspirador ou secador?" },
          { text: "Hipersensibilidade a texturas", emoji: "🧦", example: "Ex.: ele reclama muito de etiquetas, grama, areia ou certas roupas na pele?" },
          { text: "Cheira, lambe ou toca objetos de forma incomum", emoji: "👅", example: "Ex.: ele leva objetos ao nariz ou à boca para cheirar e lamber com frequência?" },
          { text: "Busca movimento de forma excessiva", emoji: "🌀", example: "Ex.: ele adora girar, balançar ou pular sem parar, buscando movimento o tempo todo?" },
          { text: "Apresenta seletividade alimentar importante", emoji: "🍽️", example: "Ex.: ele come pouquíssimos alimentos e recusa por cor, cheiro ou textura?" },
          { text: "Tem dificuldade intensa em transições", emoji: "🔀", example: "Ex.: sair de uma atividade para outra, como parar de brincar para o banho, vira crise?" },
          { text: "Apresenta crises desproporcionais à frustração", emoji: "💥", example: "Ex.: por uma frustração pequena, ele tem crise muito intensa e longa?" },
          { text: "Tem dificuldade de se acalmar com ajuda do adulto", emoji: "🫂", example: "Ex.: mesmo com seu colo e voz calma, ele custa muito a se acalmar?" },
          { text: "Demonstra baixa percepção de perigo", emoji: "⚠️", example: "Ex.: ele corre para a rua ou sobe em lugares altos sem notar o risco?" },
          { text: "Apresenta prejuízo funcional em casa, escola ou terapias", emoji: "🏠", example: "Ex.: essas dificuldades atrapalham o dia a dia em casa, na escola ou na terapia?" },
        ],
      },
    ],
  },

  // ----------------------------------------------------------
  // 6–12A · 6 anos a 12 anos e 11 meses (80 itens)
  // ----------------------------------------------------------
  "podj-tea-prime-6-12a": {
    icon: ICON,
    gradient: "from-indigo-500 to-violet-600",
    instruction: PODJ_INSTRUCTION,
    infoBox:
      "PODJ-TEA PRIME — Inventário observacional 6 anos a 12 anos e 11 meses. Método clínico-observacional autoral, complementar e ainda sem validação psicométrica própria. Não usar como teste diagnóstico isolado nem como substituto de avaliação médica, psicológica, neuropsicológica, fonoaudiológica, terapêutica ocupacional ou multiprofissional.",
    labels: PODJ_LABELS,
    optionPoints: PODJ_POINTS,
    scoreDirection: "higher_worse",
    totalLabel: "Inventário PODJ-TEA PRIME 6–12A",
    bands: PODJ_BANDS,
    domains: [
      {
        name: "Comunicação social e reciprocidade",
        color: "text-indigo-600 dark:text-indigo-400",
        items: [
          { text: "Inicia interação social espontânea", emoji: "🙋", example: "Ex.: ele puxa conversa ou chama alguém para brincar por vontade própria?" },
          { text: "Responde de forma adequada à aproximação social", emoji: "🤝", example: "Ex.: quando alguém fala com ele, ele responde de um jeito que combina com a situação?" },
          { text: "Mantém troca de ida e volta na conversa", emoji: "💬", example: "Ex.: ele conversa revezando, fala e escuta, não só monólogo?" },
          { text: "Demonstra interesse pelo outro", emoji: "❤️", example: "Ex.: ele se importa com o que o amigo gosta, sente ou fez?" },
          { text: "Faz perguntas sobre sentimentos ou experiências alheias", emoji: "❓", example: "Ex.: ele pergunta como o outro está ou o que o outro fez no fim de semana?" },
          { text: "Compartilha experiências pessoais com adequação", emoji: "🗣️", example: "Ex.: ele conta coisas dele na hora certa, sem falar sem parar do próprio tema?" },
          { text: "Percebe quando o outro perdeu interesse", emoji: "👀", example: "Ex.: ele nota quando o amigo ficou entediado e muda de assunto?" },
          { text: "Modula comportamento conforme o ambiente", emoji: "🎚️", example: "Ex.: ele age diferente na sala de aula e no parquinho, ajustando ao lugar?" },
          { text: "Demonstra prazer social genuíno", emoji: "😄", example: "Ex.: ele parece realmente feliz de estar junto com outras crianças?" },
          { text: "Evita isolamento persistente", emoji: "🧍", example: "Ex.: ele evita ficar sempre sozinho e busca companhia dos colegas?" },
        ],
      },
      {
        name: "Pragmática e linguagem",
        color: "text-indigo-600 dark:text-indigo-400",
        items: [
          { text: "Mantém assunto de forma recíproca", emoji: "🔄", example: "Ex.: ele segue o assunto que os dois estão falando, sem puxar tudo para o dele?" },
          { text: "Evita monólogos sobre tema favorito", emoji: "🎯", example: "Ex.: ele consegue não falar sem parar só do assunto preferido dele?" },
          { text: "Entende ironias simples", emoji: "😏", example: "Ex.: ele percebe quando alguém fala 'que dia lindo' num dia de chuva, brincando?" },
          { text: "Entende piadas e duplo sentido conforme a idade", emoji: "😄", example: "Ex.: ele pega o sentido de piadas e brincadeiras compatíveis com a idade?" },
          { text: "Usa entonação natural", emoji: "🎵", example: "Ex.: a fala dele tem tom natural, sem soar robótica ou cantada?" },
          { text: "Ajusta volume da voz ao contexto", emoji: "🔊", example: "Ex.: ele fala mais baixo na biblioteca e mais alto no parque, conforme o lugar?" },
          { text: "Respeita turnos de fala", emoji: "⏳", example: "Ex.: ele espera o outro terminar de falar antes de responder?" },
          { text: "Evita interpretação excessivamente literal", emoji: "🧠", example: "Ex.: ao ouvir 'quebrar a cabeça', ele entende o sentido e não leva ao pé da letra?" },
          { text: "Usa gestos e expressão facial junto com a fala", emoji: "🙆", example: "Ex.: ele acompanha a fala com gestos e expressões, não fala parado e sério?" },
          { text: "Relata fatos com organização narrativa", emoji: "📖", example: "Ex.: ele conta uma história com começo, meio e fim, dá para entender?" },
        ],
      },
      {
        name: "Cognição social e teoria da mente",
        color: "text-indigo-600 dark:text-indigo-400",
        items: [
          { text: "Reconhece emoções em si mesmo", emoji: "🪞", example: "Ex.: ele consegue dizer se está triste, com raiva ou com medo?" },
          { text: "Reconhece emoções nos outros", emoji: "😊", example: "Ex.: ele percebe pelo rosto ou pela voz se o amigo está feliz ou chateado?" },
          { text: "Percebe desconforto alheio", emoji: "😟", example: "Ex.: ele nota quando alguém ficou incomodado com o que ele fez ou disse?" },
          { text: "Entende que outra pessoa pode pensar diferente", emoji: "🧠", example: "Ex.: ele entende que o amigo pode gostar de algo que ele não gosta?" },
          { text: "Compreende regras sociais implícitas", emoji: "📋", example: "Ex.: ele entende regras não faladas, como esperar a vez ou não interromper?" },
          { text: "Pede desculpas com compreensão real", emoji: "🙏", example: "Ex.: quando erra, ele pede desculpas entendendo que magoou, não só por obrigação?" },
          { text: "Demonstra empatia prática", emoji: "🤗", example: "Ex.: ele ajuda ou consola um colega que se machucou ou ficou triste?" },
          { text: "Interpreta expressões faciais adequadamente", emoji: "😐", example: "Ex.: ele lê no rosto das pessoas se estão bravas, alegres ou surpresas?" },
          { text: "Compreende consequências sociais do que fala", emoji: "💭", example: "Ex.: ele percebe que certas falas podem magoar ou irritar os outros?" },
          { text: "Diferencia brincadeira, provocação e agressão", emoji: "🎭", example: "Ex.: ele distingue uma brincadeira de uma provocação de verdade ou de uma agressão?" },
        ],
      },
      {
        name: "Amizades e pares",
        color: "text-indigo-600 dark:text-indigo-400",
        items: [
          { text: "Tem amigos compatíveis com a idade", emoji: "👫", example: "Ex.: ele tem colegas da mesma idade com quem brinca de verdade?" },
          { text: "Mantém amizades ao longo do tempo", emoji: "🕰️", example: "Ex.: ele conserva os mesmos amigos por meses, não só amizades que somem rápido?" },
          { text: "Participa de grupos sem exclusão frequente", emoji: "👥", example: "Ex.: ele entra nas brincadeiras em grupo sem ser deixado de fora toda hora?" },
          { text: "Entende regras de jogos coletivos", emoji: "🎲", example: "Ex.: ele compreende e segue as regras de jogos com outras crianças?" },
          { text: "Aceita perder em jogos", emoji: "🏅", example: "Ex.: quando perde uma partida, ele lida sem crise ou choro intenso?" },
          { text: "Negocia conflitos simples", emoji: "🤝", example: "Ex.: numa briga por brinquedo, ele consegue combinar uma solução com o colega?" },
          { text: "Evita isolamento persistente", emoji: "🧍", example: "Ex.: ele evita ficar sempre sozinho no recreio e busca os colegas?" },
          { text: "Não depende apenas de adultos para socializar", emoji: "🧒", example: "Ex.: ele consegue brincar com outras crianças sem precisar de um adulto por perto?" },
          { text: "Compreende limites físicos e sociais", emoji: "🚧", example: "Ex.: ele respeita o espaço do outro, sem abraçar ou empurrar demais?" },
          { text: "Adapta comportamento conforme o grupo", emoji: "🎚️", example: "Ex.: ele muda o jeito de agir conforme está com a família, colegas ou professores?" },
        ],
      },
      {
        name: "Flexibilidade e rotina",
        color: "text-indigo-600 dark:text-indigo-400",
        items: [
          { text: "Tolera mudanças de rotina", emoji: "🔀", example: "Ex.: quando a rotina muda, ele se adapta sem grande sofrimento?" },
          { text: "Aceita alteração de planos sem crise intensa", emoji: "📅", example: "Ex.: se o passeio combinado é cancelado, ele lida sem crise forte?" },
          { text: "Consegue mudar de assunto", emoji: "💬", example: "Ex.: ele consegue sair de um assunto e falar de outro quando preciso?" },
          { text: "Aceita correções", emoji: "✏️", example: "Ex.: quando corrigem algo que ele fez, ele aceita sem reagir muito mal?" },
          { text: "Tolera frustrações compatíveis com a idade", emoji: "😤", example: "Ex.: diante de um 'não', ele se frustra de forma esperada para a idade?" },
          { text: "Consegue esperar sua vez", emoji: "⏳", example: "Ex.: ele espera a vez na fila ou no jogo sem grande dificuldade?" },
          { text: "Aceita regras diferentes em ambientes diferentes", emoji: "🏫", example: "Ex.: ele entende que na escola valem regras diferentes das de casa?" },
          { text: "Abandona atividade preferida quando necessário", emoji: "🛑", example: "Ex.: ele consegue parar a atividade favorita quando é hora, sem crise?" },
          { text: "Lida com imprevistos escolares", emoji: "🎒", example: "Ex.: troca de professor ou mudança de sala, ele se adapta razoavelmente?" },
          { text: "Não se prende rigidamente a detalhes", emoji: "🔍", example: "Ex.: ele não trava por um detalhe fora do lugar, conseguindo seguir em frente?" },
        ],
      },
      {
        name: "Hiperfoco e interesses restritos",
        color: "text-indigo-600 dark:text-indigo-400",
        items: [
          { text: "Apresenta interesse muito intenso por tema específico", emoji: "🎯", example: "Ex.: ele se dedica de forma muito intensa a um único assunto, como dinossauros ou trens?" },
          { text: "Fala repetidamente sobre o mesmo tema", emoji: "🔁", example: "Ex.: ele volta sempre para o mesmo assunto, mesmo quando o outro não quer?" },
          { text: "Tem dificuldade de variar assuntos", emoji: "💬", example: "Ex.: ele custa a falar de outra coisa que não seja o interesse dele?" },
          { text: "Demonstra conhecimento incomum e rígido sobre tema restrito", emoji: "📚", example: "Ex.: ele sabe detalhes fora do comum sobre um tema, de forma muito fixa?" },
          { text: "Irrita-se quando interrompido no hiperfoco", emoji: "😠", example: "Ex.: quando o tiram da atividade preferida, ele fica muito irritado?" },
          { text: "Prefere atividades solitárias ligadas ao interesse", emoji: "🧍", example: "Ex.: ele prefere ficar sozinho fazendo o que gosta a brincar com outros?" },
          { text: "Organiza objetos ou informações de forma rígida", emoji: "📦", example: "Ex.: ele arruma os objetos numa ordem exata e não aceita mudar?" },
          { text: "Repete rotinas mentais ou sequências", emoji: "🔂", example: "Ex.: ele repete a mesma sequência de passos ou pensamentos sempre igual?" },
          { text: "Apresenta apego excessivo a coleções, objetos ou padrões", emoji: "🗂️", example: "Ex.: ele tem apego muito forte a coleções e fica aflito se falta uma peça?" },
          { text: "O hiperfoco prejudica socialização ou escola", emoji: "⚠️", example: "Ex.: o interesse tão intenso atrapalha os estudos ou o convívio com colegas?" },
        ],
      },
      {
        name: "Comportamentos repetitivos e sensorialidade",
        color: "text-indigo-600 dark:text-indigo-400",
        items: [
          { text: "Apresenta movimentos repetitivos de mãos, dedos ou corpo", emoji: "🙌", example: "Ex.: ele balança as mãos, mexe os dedos ou gira o corpo de forma repetida?" },
          { text: "Faz sons repetitivos ou vocalizações incomuns", emoji: "🔊", example: "Ex.: ele repete sons, ruídos ou barulhos com a boca sem função clara?" },
          { text: "Repete frases, cenas ou diálogos", emoji: "🎬", example: "Ex.: ele repete falas de filmes, jogos ou cenas várias vezes?" },
          { text: "Demonstra incômodo intenso com sons", emoji: "🙉", example: "Ex.: ele tapa os ouvidos ou sofre com barulhos como sinal da escola ou trânsito?" },
          { text: "Demonstra incômodo com cheiros, texturas ou etiquetas", emoji: "🧦", example: "Ex.: ele reclama de cheiros fortes, roupas ásperas ou etiquetas na pele?" },
          { text: "Apresenta seletividade alimentar persistente", emoji: "🍽️", example: "Ex.: ele come sempre os mesmos poucos alimentos e recusa novidades?" },
          { text: "Busca estímulos sensoriais excessivamente", emoji: "🌀", example: "Ex.: ele procura muito girar, se apertar, cheirar ou tocar tudo?" },
          { text: "Evita ambientes cheios, barulhentos ou imprevisíveis", emoji: "🏟️", example: "Ex.: ele fica muito desconfortável em festas, shoppings ou lugares cheios?" },
          { text: "Apresenta baixa tolerância a contato físico inesperado", emoji: "🤚", example: "Ex.: ele se incomoda muito quando alguém encosta nele de surpresa?" },
          { text: "Tem crises associadas à sobrecarga sensorial", emoji: "💥", example: "Ex.: em ambientes muito estimulantes, ele tem crise por excesso de estímulos?" },
        ],
      },
      {
        name: "Autonomia, funcionalidade e sofrimento",
        color: "text-indigo-600 dark:text-indigo-400",
        items: [
          { text: "Apresenta prejuízo de autonomia para a idade", emoji: "🧩", example: "Ex.: ele depende de ajuda em tarefas que crianças da idade dele já fazem sozinhas?" },
          { text: "Tem dificuldade significativa em autocuidado", emoji: "🪥", example: "Ex.: ele tem muita dificuldade para se vestir, escovar os dentes ou tomar banho sozinho?" },
          { text: "Necessita mediação excessiva de adultos", emoji: "🧑‍🏫", example: "Ex.: ele precisa de um adulto guiando o tempo todo para dar conta das atividades?" },
          { text: "Apresenta sofrimento social relevante", emoji: "😔", example: "Ex.: ele sofre bastante com as dificuldades de se relacionar com os colegas?" },
          { text: "Tem prejuízo acadêmico por rigidez, atenção ou socialização", emoji: "📉", example: "Ex.: o aprendizado dele é prejudicado por rigidez, desatenção ou dificuldade social?" },
          { text: "Apresenta crises em casa por frustração ou mudança", emoji: "💥", example: "Ex.: em casa, mudanças ou frustrações desencadeiam crises frequentes?" },
          { text: "Sofre bullying, isolamento ou rejeição frequente", emoji: "🚫", example: "Ex.: ele é excluído, zombado ou rejeitado pelos colegas com frequência?" },
          { text: "Tem baixa percepção das próprias dificuldades", emoji: "🪞", example: "Ex.: ele parece não perceber as próprias dificuldades ou o efeito delas?" },
          { text: "Apresenta ansiedade associada à interação social ou rotina", emoji: "😰", example: "Ex.: situações sociais ou mudanças de rotina deixam ele ansioso?" },
          { text: "Há prejuízo funcional em dois ou mais contextos", emoji: "🌐", example: "Ex.: as dificuldades aparecem em mais de um lugar, como em casa e na escola?" },
        ],
      },
    ],
  },

  // ----------------------------------------------------------
  // 12–19A · 12 a 19 anos (80 itens)
  // Itens de saúde mental (74–77) NÃO pontuam TEA e disparam
  // protocolo de segurança — ver infoBox.
  // ----------------------------------------------------------
  "podj-tea-prime-12-19a": {
    icon: ICON,
    gradient: "from-blue-500 to-indigo-600",
    instruction: PODJ_INSTRUCTION,
    infoBox:
      "PODJ-TEA PRIME — Inventário observacional 12 a 19 anos. ⚠️ Alerta clínico importante: os itens de SAÚDE MENTAL E SEGURANÇA (ansiedade, humor deprimido, autolesão, ideação suicida) NÃO pontuam TEA. Se houver autolesão, ideação suicida, plano, intenção ou acesso a meios, suspender o foco classificatório e acionar imediatamente o responsável, a rede de proteção ou a emergência conforme a gravidade — CVV 188 (24h) e SAMU 192. Método clínico-observacional autoral, complementar e ainda sem validação psicométrica própria; não usar como teste diagnóstico isolado.",
    labels: PODJ_LABELS,
    optionPoints: PODJ_POINTS,
    scoreDirection: "higher_worse",
    totalLabel: "Inventário PODJ-TEA PRIME 12–19A",
    bands: PODJ_BANDS,
    domains: [
      {
        name: "Comunicação social e reciprocidade",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          { text: "Inicia interação social espontânea com pares ou adultos", emoji: "🙋", example: "Ex.: ele puxa conversa com colegas ou adultos por vontade própria?" },
          { text: "Sustenta conversa com troca de ida e volta", emoji: "💬", example: "Ex.: ele mantém um papo revezando fala e escuta, sem virar monólogo?" },
          { text: "Demonstra interesse genuíno pela experiência do outro", emoji: "❤️", example: "Ex.: ele se interessa de verdade pelo que o outro viveu ou sente?" },
          { text: "Faz perguntas socialmente pertinentes ao interlocutor", emoji: "❓", example: "Ex.: ele faz perguntas que combinam com a conversa e com quem está falando?" },
          { text: "Percebe quando o outro perdeu interesse", emoji: "👀", example: "Ex.: ele nota quando a pessoa ficou entediada e ajusta o assunto?" },
          { text: "Ajusta comportamento social ao contexto", emoji: "🎚️", example: "Ex.: ele age diferente numa festa, na aula ou numa entrevista, conforme o lugar?" },
          { text: "Compartilha experiências pessoais de modo recíproco", emoji: "🔄", example: "Ex.: ele conta coisas dele e também ouve as do outro, de forma equilibrada?" },
          { text: "Demonstra prazer social espontâneo", emoji: "😄", example: "Ex.: ele demonstra gostar de estar com outras pessoas, de forma natural?" },
          { text: "Evita isolamento social persistente", emoji: "🧍", example: "Ex.: ele evita ficar isolado o tempo todo e busca convívio?" },
          { text: "Não depende exclusivamente de adultos para interação social", emoji: "🧑‍🤝‍🧑", example: "Ex.: ele consegue se relacionar com os colegas sem precisar sempre de um adulto?" },
        ],
      },
      {
        name: "Pragmática avançada e linguagem",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          { text: "Usa linguagem de forma socialmente ajustada", emoji: "🗣️", example: "Ex.: ele fala de um jeito que combina com a pessoa e com a situação?" },
          { text: "Evita monólogos prolongados sobre tema preferido", emoji: "🎯", example: "Ex.: ele consegue não discursar sem parar sobre o assunto favorito dele?" },
          { text: "Reconhece ironia, indiretas e duplo sentido", emoji: "😏", example: "Ex.: ele entende quando alguém está sendo irônico ou falando nas entrelinhas?" },
          { text: "Interpreta intenção comunicativa além do literal", emoji: "🧠", example: "Ex.: ele capta o que a pessoa quis dizer, não só as palavras exatas?" },
          { text: "Ajusta volume, ritmo e entonação ao contexto", emoji: "🔊", example: "Ex.: ele adapta o tom e a velocidade da fala conforme o ambiente?" },
          { text: "Usa expressão facial e gestos integrados à fala", emoji: "🙆", example: "Ex.: o rosto e os gestos dele acompanham o que ele fala, de forma natural?" },
          { text: "Respeita turnos conversacionais em grupo", emoji: "⏳", example: "Ex.: numa roda de conversa, ele espera a vez sem interromper?" },
          { text: "Percebe desconforto ou tédio do interlocutor", emoji: "😐", example: "Ex.: ele nota quando a pessoa ficou desconfortável ou entediada?" },
          { text: "Consegue mudar de assunto sem sofrimento excessivo", emoji: "🔀", example: "Ex.: ele troca de assunto quando preciso, sem ficar muito incomodado?" },
          { text: "Evita fala excessivamente formal, pedante ou deslocada", emoji: "🎩", example: "Ex.: ele evita falar de um jeito formal demais ou fora de contexto com os colegas?" },
        ],
      },
      {
        name: "Cognição social e julgamento",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          { text: "Compreende regras sociais implícitas", emoji: "📋", example: "Ex.: ele entende regras não ditas, como não contar segredo dos outros?" },
          { text: "Reconhece emoções complexas em si mesmo", emoji: "🪞", example: "Ex.: ele identifica em si sentimentos como vergonha, ciúme ou frustração?" },
          { text: "Reconhece emoções complexas nos outros", emoji: "😟", example: "Ex.: ele percebe quando alguém está decepcionado, constrangido ou magoado?" },
          { text: "Entende que outra pessoa pode ter perspectiva diferente", emoji: "🧠", example: "Ex.: ele aceita que os outros pensem e sintam diferente dele?" },
          { text: "Diferencia brincadeira, provocação, ironia e agressão", emoji: "🎭", example: "Ex.: ele distingue uma zoeira de amigo de uma provocação ou agressão de verdade?" },
          { text: "Mantém amizades compatíveis com a idade", emoji: "👫", example: "Ex.: ele tem amizades duradouras com pessoas da idade dele?" },
          { text: "Participa de grupos sem exclusão recorrente", emoji: "👥", example: "Ex.: ele é aceito nos grupos, sem ficar de fora repetidamente?" },
          { text: "Negocia conflitos simples sem ruptura desproporcional", emoji: "🤝", example: "Ex.: numa discordância, ele negocia sem romper a relação de forma exagerada?" },
          { text: "Compreende limites físicos, sociais e digitais", emoji: "🚧", example: "Ex.: ele respeita espaço, privacidade e limites também nas redes sociais?" },
          { text: "Percebe consequências sociais do que fala ou posta", emoji: "📱", example: "Ex.: ele pensa antes de postar ou falar, prevendo como os outros vão reagir?" },
          { text: "Apresenta julgamento social compatível com a idade", emoji: "⚖️", example: "Ex.: ele avalia situações sociais com bom senso esperado para a idade?" },
          { text: "Evita ingenuidade social com vulnerabilidade importante", emoji: "🛡️", example: "Ex.: ele evita ser facilmente enganado ou manipulado por outros?" },
          { text: "Demonstra empatia prática em situações cotidianas", emoji: "🤗", example: "Ex.: ele ajuda ou apoia alguém que está passando por dificuldade?" },
          { text: "Consegue ajustar identidade social sem sofrimento extremo", emoji: "🧩", example: "Ex.: ele lida com a busca de quem é, sem sofrer de forma muito intensa?" },
        ],
      },
      {
        name: "Flexibilidade e rotina",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          { text: "Tolera mudanças de rotina sem crise intensa", emoji: "🔀", example: "Ex.: quando a rotina muda, ele se adapta sem crise forte?" },
          { text: "Aceita alteração de planos com adaptação gradual", emoji: "📅", example: "Ex.: se um plano muda, ele consegue se ajustar aos poucos?" },
          { text: "Lida com imprevistos escolares ou familiares", emoji: "🎒", example: "Ex.: diante de um imprevisto na escola ou em casa, ele reage de forma equilibrada?" },
          { text: "Aceita correções sem reação desproporcional", emoji: "✏️", example: "Ex.: quando é corrigido, ele aceita sem explosão ou fechamento excessivo?" },
          { text: "Não se prende rigidamente a regras ou detalhes", emoji: "🔍", example: "Ex.: ele não trava por causa de uma regra ou detalhe fora do lugar?" },
          { text: "Tolera frustrações compatíveis com a idade", emoji: "😤", example: "Ex.: diante de contrariedades, ele se frustra de forma esperada para a idade?" },
          { text: "Consegue abandonar atividade preferida quando necessário", emoji: "🛑", example: "Ex.: ele consegue parar o que gosta de fazer quando é preciso?" },
          { text: "Tolera incerteza e ambiguidade razoavelmente", emoji: "🌫️", example: "Ex.: ele lida bem com situações indefinidas, sem saber exatamente o que vai acontecer?" },
          { text: "Apresenta flexibilidade para mudar de opinião", emoji: "💡", example: "Ex.: diante de um bom argumento, ele consegue rever e mudar de ideia?" },
        ],
      },
      {
        name: "Hiperfoco e comportamentos repetitivos",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          { text: "Apresenta interesse muito intenso por tema específico", emoji: "🎯", example: "Ex.: ele mergulha de forma muito intensa em um único assunto, como games ou astronomia?" },
          { text: "Fala repetidamente sobre o mesmo tema", emoji: "🔁", example: "Ex.: ele volta sempre ao mesmo assunto, mesmo quando o outro não demonstra interesse?" },
          { text: "Tem dificuldade de variar assuntos", emoji: "💬", example: "Ex.: ele custa a conversar sobre outra coisa que não seja o interesse dele?" },
          { text: "Irrita-se quando interrompido no hiperfoco", emoji: "😠", example: "Ex.: quando o interrompem no que ele está focado, ele fica muito irritado?" },
          { text: "O hiperfoco prejudica socialização, escola ou rotina", emoji: "⚠️", example: "Ex.: o interesse tão intenso atrapalha os estudos, o convívio ou a rotina dele?" },
          { text: "Organiza informações, objetos ou rotinas de forma rígida", emoji: "📦", example: "Ex.: ele arruma coisas e rotinas numa ordem exata, sem aceitar mudanças?" },
          { text: "Repete frases, cenas, músicas, trechos ou diálogos", emoji: "🎬", example: "Ex.: ele repete falas, músicas ou cenas várias vezes?" },
          { text: "Apresenta movimentos repetitivos de mãos, dedos ou corpo", emoji: "🙌", example: "Ex.: ele balança as mãos, mexe os dedos ou o corpo de forma repetida?" },
          { text: "Apresenta vocalizações ou sons repetitivos", emoji: "🔊", example: "Ex.: ele faz sons ou ruídos repetidos, principalmente quando ansioso?" },
          { text: "Demonstra apego excessivo a objetos, coleções ou padrões", emoji: "🗂️", example: "Ex.: ele tem apego muito forte a objetos, coleções ou padrões fixos?" },
        ],
      },
      {
        name: "Sensorialidade",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          { text: "Demonstra incômodo intenso com sons", emoji: "🙉", example: "Ex.: ele sofre com barulhos como música alta, multidão ou sirenes?" },
          { text: "Demonstra incômodo com texturas, roupas ou etiquetas", emoji: "🧦", example: "Ex.: ele evita certas roupas, tecidos ou corta etiquetas por incômodo?" },
          { text: "Apresenta seletividade alimentar com impacto funcional", emoji: "🍽️", example: "Ex.: ele come uma variedade muito restrita de alimentos, atrapalhando a rotina?" },
          { text: "Evita ambientes cheios, barulhentos ou imprevisíveis", emoji: "🏟️", example: "Ex.: ele se recusa ou sofre em festas, shows ou lugares muito cheios?" },
          { text: "Tem crises por sobrecarga sensorial", emoji: "💥", example: "Ex.: em ambientes com excesso de estímulos, ele tem crises de sobrecarga?" },
        ],
      },
      {
        name: "Autonomia e funcionalidade",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          { text: "Apresenta prejuízo de autonomia para a idade", emoji: "🧩", example: "Ex.: ele depende de ajuda em coisas que jovens da idade dele já fazem sozinhos?" },
          { text: "Tem dificuldade significativa em autocuidado", emoji: "🚿", example: "Ex.: ele precisa ser lembrado ou ajudado em higiene e cuidados básicos?" },
          { text: "Necessita mediação excessiva de adultos", emoji: "🧑‍🏫", example: "Ex.: ele precisa de um adulto conduzindo o tempo todo para dar conta das tarefas?" },
          { text: "Tem dificuldade de organizar rotina, agenda ou materiais", emoji: "🗒️", example: "Ex.: ele se perde com horários, prazos e materiais escolares?" },
          { text: "Apresenta prejuízo escolar por rigidez, ansiedade ou socialização", emoji: "📉", example: "Ex.: rigidez, ansiedade ou dificuldade social prejudicam o desempenho na escola?" },
          { text: "Apresenta prejuízo em trabalhos em grupo ou apresentações", emoji: "🗣️", example: "Ex.: ele tem muita dificuldade em trabalhos coletivos ou em apresentar na frente da turma?" },
          { text: "Sofre bullying, exclusão ou rejeição frequente", emoji: "🚫", example: "Ex.: ele é alvo de bullying, excluído ou rejeitado com frequência?" },
          { text: "Apresenta sofrimento social relevante", emoji: "😔", example: "Ex.: ele sofre de forma importante com as dificuldades de relacionamento?" },
          { text: "Tem baixa percepção das próprias dificuldades", emoji: "🪞", example: "Ex.: ele parece não perceber as próprias dificuldades e o impacto delas?" },
          { text: "Apresenta crises em casa após demanda social", emoji: "💥", example: "Ex.: depois de um dia social puxado, ele descarrega em crises em casa?" },
          { text: "Precisa de recuperação prolongada após eventos sociais", emoji: "🔋", example: "Ex.: após festas ou aulas, ele precisa de muito tempo sozinho para se recuperar?" },
          { text: "Tem dificuldade em lidar com transição para vida adulta", emoji: "🧭", example: "Ex.: ele demonstra dificuldade em pensar em faculdade, trabalho ou independência?" },
          { text: "Apresenta dependência familiar desproporcional à idade", emoji: "🏠", example: "Ex.: ele depende da família muito mais do que o esperado para a idade?" },
          { text: "Apresenta prejuízo funcional em dois ou mais contextos", emoji: "🌐", example: "Ex.: as dificuldades aparecem em mais de um lugar, como em casa e na escola?" },
          { text: "Há impacto relevante na participação social, escolar ou familiar", emoji: "⚠️", example: "Ex.: as dificuldades atrapalham bastante a vida social, escolar e familiar dele?" },
        ],
      },
      {
        name: "⚠️ Saúde mental e segurança (não pontua TEA)",
        color: "text-red-600 dark:text-red-400",
        items: [
          { text: "Apresenta ansiedade clinicamente relevante", emoji: "😰", example: "Ex.: ele vive preocupado, tenso ou com medo a ponto de atrapalhar o dia a dia? Merece atenção." },
          { text: "Apresenta humor deprimido, desesperança ou isolamento intenso", emoji: "🌧️", example: "Ex.: ele anda muito triste, sem esperança ou se isolando de tudo? Isso pede acolhimento e ajuda." },
          { text: "Apresenta autolesão não suicida ou comportamento de risco", emoji: "🩹", example: "Ex.: notou marcas de que ele se machucou de propósito ou se expõe a riscos? Requer atenção imediata." },
          { text: "Apresenta ideação suicida, plano, intenção ou risco atual", emoji: "🆘", example: "Ex.: falou em querer sumir, se machucar ou que não vale a pena viver? Isso exige atenção imediata." },
        ],
      },
      {
        name: "Camuflagem e exaustão social",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          { text: "Apresenta discrepância entre bom desempenho externo e colapso em casa", emoji: "🎭", example: "Ex.: ele parece bem na escola mas chega em casa esgotado, com crises?" },
          { text: "Usa scripts, imitação social ou controle consciente para parecer adequado", emoji: "🎬", example: "Ex.: ele decora falas e imita os outros para parecer que se encaixa no grupo?" },
          { text: "Relata exaustão, perda de identidade ou sofrimento por tentar se encaixar", emoji: "🔋", example: "Ex.: ele diz estar exausto ou perdido de tanto tentar se encaixar e agradar?" },
        ],
      },
    ],
  },
};
