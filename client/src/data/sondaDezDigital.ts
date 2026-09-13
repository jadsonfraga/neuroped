import {
  SONDA_DEZ_PROTOCOL,
  type BandDef,
  type FieldDef,
  type MissionDef,
} from "./sondaDezProtocol";

export const DIGITAL_VERSION = "2026-09-13.2";
export const DIGITAL_NATURE =
  "Adaptação digital autoral da Sonda Dez / AFN-10; registro observacional piloto, requer validação clínica; sem normas, percentis, pontos de corte ou diagnóstico.";
export const DIGITAL_LIMIT =
  "A resposta na tela descreve esta interação digital. Não equivale à manipulação de objetos reais, ao brincar presencial nem à avaliação motora, auditiva ou visual. Integração pelo médico.";
export type ActivityKind =
  | "objects"
  | "locked"
  | "cups"
  | "imitation"
  | "scene"
  | "sequence"
  | "grid"
  | "model"
  | "plan"
  | "blank";
export type ActivitySpec = {
  kind: ActivityKind;
  items?: string[];
  scene?: "rain" | "juice" | "social" | "message";
  target?: string;
  intervalMs?: number;
  durationSeconds?: number;
  prompt?: string;
  // Hide naming labels; the image itself remains accessible to the operator.
  naming?: boolean;
  responseRule?: Record<string, string>;
};
export type DigitalStep = {
  title: string;
  say: string;
  do: string;
  observe: string;
  activity: ActivitySpec;
  waitSeconds?: number;
  silent?: boolean;
};
export type DigitalMission = MissionDef & {
  steps: DigitalStep[];
  digitalLimit: string;
  reading: string[];
};
export type DigitalBand = Omit<BandDef, "missions"> & {
  missions: DigitalMission[];
};
const objects = (
  items = ["bola", "carro", "bebe", "colher", "copo", "telefone", "caixa"],
): ActivitySpec => ({ kind: "objects", items });
const step = (
  title: string,
  say: string,
  action: string,
  observe: string,
  activity: ActivitySpec,
  waitSeconds?: number,
): DigitalStep => ({ title, say, do: action, observe, activity, waitSeconds });
const blank: ActivitySpec = { kind: "blank" };
const scene = (value: ActivitySpec["scene"]): ActivitySpec => ({
  kind: "scene",
  scene: value,
});
export const DOGS15 = [
  "cachorro",
  "gato",
  "coelho",
  "cachorro",
  "peixe",
  "gato",
  "cachorro",
  "coelho",
  "peixe",
  "gato",
  "cachorro",
  "peixe",
  "coelho",
  "cachorro",
  "gato",
];
export const DOGS20 = [
  ...DOGS15,
  "gato",
  "peixe",
  "cachorro",
  "coelho",
  "gato",
];
export const SUN16 = [
  "sol",
  "lua",
  "sol",
  "lua",
  "lua",
  "sol",
  "sol",
  "lua",
  "sol",
  "lua",
  "sol",
  "sol",
  "lua",
  "lua",
  "sol",
  "lua",
];
export const DAY12 = [
  "DIA",
  "NOITE",
  "DIA",
  "DIA",
  "NOITE",
  "NOITE",
  "DIA",
  "NOITE",
  "DIA",
  "NOITE",
  "NOITE",
  "DIA",
];
export const SIDE12 = [
  "DIREITA",
  "ESQUERDA",
  "DIREITA",
  "DIREITA",
  "ESQUERDA",
  "ESQUERDA",
  "DIREITA",
  "ESQUERDA",
  "DIREITA",
  "ESQUERDA",
  "ESQUERDA",
  "DIREITA",
];
export const DOT_GRID = [
  "⊙",
  "○",
  "□",
  "⊙",
  "△",
  "○",
  "⊙",
  "◇",
  "⊙",
  "□",
  "○",
  "⊙",
  "△",
  "⊙",
  "○",
  "◇",
  "□",
  "○",
  "⊙",
  "△",
  "⊙",
  "○",
  "□",
  "◇",
];
export const SYMBOL_GRID = [
  "★A",
  "B",
  "★B",
  "△",
  "C",
  "★A",
  "□",
  "A",
  "★A",
  "○",
  "E",
  "★B",
  "B",
  "★A",
  "A",
  "□",
  "★B",
  "★A",
  "△",
  "C",
  "A",
  "○",
  "★A",
  "B",
];
export const MODEL = [
  "azul",
  "amarelo",
  "vermelho",
  "verde",
  "roxo",
  "laranja",
];
const serial = (items: string[], target?: string): ActivitySpec => ({
  kind: "sequence",
  items,
  target,
  intervalMs: 2500,
});
const attention = (items: string[]) => [
  step(
    "Entender a regra",
    "Quando aparecer um cachorro, toque no botão redondo. Se não for cachorro, espere.",
    "Antes da série, demonstre o botão no ensaio. Nesta aplicação, não ofereça treino com os itens da série. Se não compreender, use NA.",
    "Registre se entendeu a regra; familiaridade com toque é um interferente.",
    blank,
  ),
  step(
    "Apresentar a série",
    "Vamos começar.",
    "Vire a tela. O app apresenta uma figura a cada 2,5 segundos. Não nomeie figuras nem corrija. Ao fim, volte à aplicadora.",
    "O app registra toques por oportunidade; a aplicadora registra redirecionamentos e condições da tarefa.",
    serial(items, "cachorro"),
  ),
];
const socialEntry = (older = false) => [
  step(
    "Exploração livre",
    older ? "Oi. Olha o que temos aqui." : "Vamos olhar juntos?",
    "Sente-se ao lado, com seu rosto visível. Mostre a mesa digital e espere 30 segundos sem conduzir. Não peça contato visual.",
    "Diferencie olhar para a tela de alternar espontaneamente entre pessoa e tela; descreva gestos, sons ou comentários.",
    objects(["bola", "carro", "bebe"]),
    30,
  ),
  ...(!older
    ? [
        step(
          "Duas chamadas pelo nome",
          "Chame o nome habitual da criança, uma vez em cada oportunidade.",
          "Sem tocar, chamar mais alto ou acrescentar “olha aqui”. Separe as duas chamadas por uma pausa de cerca de 5 segundos. Registre a orientação à voz humana.",
          "Registre 0/2, 1/2 ou 2/2 somente se as duas chamadas puderam ser observadas. Dúvida auditiva, distração da tela ou recusa: contextualize ou use NA.",
          blank,
        ),
      ]
    : []),
];
const pointing = [
  step(
    "Referência lateral — duas oportunidades",
    "Olha!",
    "Vire a mesa digital para a criança, aponte para uma figura lateral e observe. Repita para outra figura. Mantenha seu rosto visível e não mova a cabeça da criança.",
    "Anote separadamente seguir o gesto, retornar o olhar e compartilhar espontaneamente. Seguir algo na tela não demonstra atenção conjunta em espaço real.",
    objects(["bola", "carro", "bebe"]),
  ),
];
const pretend = (ill = false) => [
  step(
    "Exploração do faz de conta",
    "Vamos brincar?",
    "Mostre bebê, colher, copo e telefone. Espere a exploração livre; não ensine a sequência. Um toque seleciona um item e outro indica o destino.",
    "Descreva os pares tocados e a fala/gestos produzidos. Movimento digital isolado não comprova simbolismo.",
    objects(),
    ill ? 20 : 30,
  ),
  step(
    "Propor a situação",
    ill
      ? "O bebê está doente. O que a gente pode fazer?"
      : "O bebê está com fome.",
    "Leia somente a frase. Aceite a criança narrar ou apontar, sem exigir uma resposta motora. Se a aplicadora tocar por ela, registre a mediação.",
    "Registre literalmente a proposta da criança. Brincar funcional e simbólico com objetos reais permanecem não avaliados por esta tela.",
    objects(),
  ),
];
const help = [
  step(
    "Oportunidade de pedir ajuda",
    "Aguarde sem perguntar inicialmente.",
    "Mostre a caixa digital fechada. O cadeado não abre com toques da criança. Espere até 20 segundos, menos se houver incômodo. Não provoque sofrimento.",
    "Observe gesto, alternância de olhar, palavra ou pedido de ajuda. A caixa virtual não avalia destreza manual.",
    { kind: "locked" },
    20,
  ),
  step(
    "Convite e acesso",
    "Precisa de alguma coisa?",
    "Pergunte uma vez. A aplicadora pode tocar em “Abrir caixa” para liberar o objeto depois da resposta. Registre se houve pista adicional.",
    "Espontâneo antes da pergunta = E; pedido após pergunta = I; após outra pista/repetição = P. Se recusar ou não entender a tela, use NA.",
    { kind: "locked", prompt: "unlock" },
  ),
];
const waiting = [
  step(
    "Três esperas breves",
    "Espere. Toque na bola só quando eu disser JÁ.",
    "Faça três oportunidades. Em cada uma, espere aproximadamente 3 segundos e diga JÁ. Não prenda a mão. A aplicadora conta esperas e antecipações; não inferir isso só pelo toque.",
    "Registre quantas oportunidades reais foram feitas. Se interromper antes de três, não complete o denominador com zeros.",
    objects(["bola"]),
  ),
];
const inhibition = (items: string[], reverse = false) => [
  step(
    reverse ? "Trocar a regra" : "Apresentar a regra",
    reverse
      ? "Agora mudou: LUA é uma palma; SOL é ficar parado."
      : "Quando aparecer SOL, bata uma palma. Quando aparecer LUA, fique parado.",
    "A aplicadora lê a regra antes de virar a tela. Verifique a compreensão verbal, sem fornecer respostas durante a sequência. Registre palmas observadas depois.",
    "O botão de resposta não é usado aqui. Uma palma é observação da aplicadora, não detecção automática do microfone.",
    {
      ...serial(items),
      responseRule: reverse
        ? { sol: "Esperar", lua: "Uma palma" }
        : { sol: "Uma palma", lua: "Esperar" },
    },
  ),
];
const verbal = (
  items: string[],
  instruction: string,
  responseRule: Record<string, string>,
) => [
  step(
    "Regra verbal",
    instruction,
    "A tela mostrará um cartão por vez para a aplicadora. Mantenha o visor fora da visão da criança, leia cada palavra e anote sua resposta. Não conte respostas corretas pela simples passagem dos cartões.",
    "A palavra escrita é roteiro da aplicadora; a criança responde à voz. Não aumentar o ritmo se houver dificuldade.",
    { ...serial(items), prompt: "operator-only", responseRule },
  ),
];
const narrative = (kind: "juice" | "rain") => [
  step(
    "Cena e relato",
    kind === "juice"
      ? "O que está acontecendo?"
      : "O que aconteceu? Por quê? O que pode acontecer depois?",
    "Mostre a cena sem ler legendas, sugerir causas ou completar frases. Faça uma pergunta por vez e espere.",
    "Aceite explicações plausíveis sustentadas pela cena. Não há uma frase única correta. Transcreva a fala breve para revisão.",
    scene(kind),
  ),
];
const conversation = (say: string) => [
  step(
    "Conversar e escutar",
    say,
    "Deixe a tela neutra. Olhe para a criança e espere. Não termine a história por ela; depois, se necessário, faça uma única pergunta de continuidade e registre essa ajuda.",
    "Anote se mantém o assunto, organiza o relato e responde ao interlocutor. Timidez ou silêncio nesta situação não provam dificuldade persistente.",
    blank,
  ),
];
const memoryOrders = (orders: string[]) =>
  orders.map((say, i) =>
    step(
      `Ordem ${i + 1}`,
      say,
      "Leia a ordem inteira uma única vez, sem apontar nem destacar os alvos. A criança toca os objetos na ordem indicada. Registre repetições e anote a sequência efetiva antes de passar.",
      "Conte etapas somente nas oportunidades apresentadas. Toque por outra pessoa, leitura visível do roteiro ou repetição altera a condição.",
      objects(["bola", "carro", "colher", "bebe"]),
    ),
  );
const configs: Record<string, DigitalStep[]> = {
  "a1-social-nome": socialEntry(),
  "a1-receptiva": ["Toque na bola.", "Toque no carro.", "Cadê o bebê?"].map(
    (s, i) =>
      step(
        `Pedido ${i + 1}`,
        s,
        "Apresente as três figuras juntas. Diga uma vez, espere e só depois repita se necessário, registrando a ajuda. Não olhar fixamente para a resposta.",
        "Nesta adaptação observa-se seleção de figura; entregar ou pegar objetos reais não foi avaliado.",
        objects(["bola", "carro", "bebe"]),
      ),
  ),
  "a1-imitacao": [
    step(
      "Quatro modelos",
      "Faz igual.",
      "Demonstre uma ação por vez: bater palmas, mandar beijo, tocar a cabeça e deslizar o dedo para mover o carro na tela. A animação acompanha o movimento digital; não substitui as ações humanas.",
      "Conte cada imitação apenas depois de observá-la. Diferencie o modelo humano do gesto sobre a tela.",
      { kind: "imitation" },
    ),
  ],
  "a1-atencao-conjunta": pointing,
  "a1-brincadeira": pretend(),
  "a1-ajuda": help,
  "a1-espera": [
    ...waiting,
    step(
      "Duas buscas visuais",
      "Olhe onde a bola vai ficar. Onde está a bola?",
      "O app mostra a bola, cobre com dois recipientes digitais e abre uma escolha. Faça as duas tentativas; não aponte o lado correto.",
      "Acerto registra busca visual no visor. Não equivale à permanência de objeto em manipulação real.",
      { kind: "cups" },
    ),
  ],
  "a2-social": socialEntry(),
  "a2-compreensao": [
    step(
      "Ordem simples",
      "Toque na bola.",
      "Apresente a mesa e leia uma vez.",
      "Registre ajuda, seleção e eventual recusa.",
      objects(),
    ),
    step(
      "Relação espacial",
      "Coloque o carro dentro da caixa.",
      "A criança toca o carro, escolhe a relação “dentro” e toca a caixa. Na preparação, ensine apenas o mecanismo com figuras neutras.",
      "Compreensão da interface pode interferir; não confundir toque aleatório com cumprimento.",
      objects(),
    ),
    step(
      "Duas etapas",
      "Pegue a colher e dê ao bebê.",
      "Toque seleciona a colher; o toque no bebê registra o destino. Não faça pela criança sem marcar ajuda.",
      "Registre a sequência observada. Seleção digital não avalia uso físico da colher.",
      objects(),
    ),
  ],
  "a2-expressiva": [
    ...["bola", "carro", "banana"].map((item) =>
      step(
        "Nomear uma figura",
        "O que é isso?",
        "Mostre só esta figura. Não leia o nome, dê a primeira sílaba ou ofereça alternativas.",
        "Registre a palavra produzida literalmente; aceite vocabulário equivalente.",
        { ...objects([item]), naming: true },
      ),
    ),
    step(
      "Solicitação espontânea",
      "Aguarde uma iniciativa.",
      "Volte à mesa livre e aguarde um pedido/comentário sem solicitar uma frase.",
      "Não classifique combinação de palavras se você ditou o modelo.",
      objects(),
    ),
  ],
  "a2-atencao": pointing,
  "a2-simbolica": pretend(),
  "a2-problema": help,
  "a2-memoria-inibicao": [
    ...memoryOrders(["Primeiro toque no carro, depois na bola."]),
    ...waiting,
  ],
  "b-interacao": socialEntry(true),
  "b-receptivo": [
    "Mostre a banana.",
    "Mostre a bola grande.",
    "Ponha o carro dentro da caixa.",
    "Ponha o bebê em cima da caixa.",
  ].map((s, i) =>
    step(
      `Conceito ${i + 1}`,
      s,
      "Leia uma vez. Nas relações, selecione o objeto, a relação e o destino. Não execute a resposta.",
      "Conte a resposta observada e a repetição necessária; dificuldade com os controles deve ser registrada.",
      objects([
        "banana",
        "bola-grande",
        "bola-pequena",
        "carro",
        "caixa",
        "bebe",
      ]),
    ),
  ),
  "b-expressivo": [
    ...["bola", "carro", "banana", "copo"].map((item) =>
      step(
        "Nomeação",
        "O que é isso?",
        "Mostre apenas a figura e não dê pistas de som ou nome.",
        "Anote o que foi dito; diferencie nomeação e inteligibilidade.",
        { ...objects([item]), naming: true },
      ),
    ),
    ...narrative("juice"),
  ],
  "b-atencao-ajuda": [...pointing, ...help],
  "b-simbolica": pretend(true),
  "b-atencao-sustentada": attention(DOGS15),
  "b-inibicao": [
    ...inhibition(SUN16.slice(0, 10)),
    ...inhibition(SUN16.slice(10, 14), true),
  ],
  "c-conversa": conversation(
    "Me conta alguma coisa legal que aconteceu hoje ou ontem.",
  ),
  "c-compreensao": memoryOrders([
    "Toque na bola e depois no carro.",
    "Toque no bebê, na colher e na bola.",
    "Antes de tocar no carro, toque na bola e depois na colher.",
  ]),
  "c-narrativa": narrative("rain"),
  "c-atencao": attention(DOGS20),
  "c-inibitorio": inhibition(SUN16),
  "c-flexibilidade": inhibition(SUN16.slice(0, 8), true),
  "c-visuoconstrutivo": [
    step(
      "Observar e reconstruir",
      "Olhe com atenção. Depois faça uma igual.",
      "A construção aparece por 5 segundos e é ocultada. A criança escolhe uma peça e uma posição para montar o painel. Não mostrar o modelo novamente.",
      "Observe organização e correções. Este painel 2D não avalia montagem tridimensional nem coordenação manual com blocos.",
      { kind: "model" },
    ),
  ],
  "d-pragmatica": conversation("Me conta como foi seu dia até chegar aqui."),
  "d-inferencia": [
    step(
      "Uma cena com mais de uma leitura",
      "O que acontece? Como a pessoa se sente? O que faz você pensar isso?",
      "Mostre a cena e pergunte uma coisa por vez. Não diga que houve rejeição, briga ou exclusão.",
      "Aceite alternativas plausíveis. Identificar emoção exige ligação com pistas, não adivinhar uma emoção escolhida pelo adulto.",
      scene("social"),
    ),
  ],
  "d-memoria": memoryOrders([
    "Toque na colher, no carro, na bola e no bebê, nessa ordem.",
  ]),
  "d-atencao": [
    step(
      "Busca visual de 60 segundos",
      "Marque apenas os círculos com ponto dentro. Você pode desmarcar tocando de novo.",
      "Antes de começar, mostre a diferença entre alvo e não alvo no ensaio. O relógio inicia ao abrir a grade e bloqueia toques após 60 segundos.",
      "O app conta seleções finais e correções. Registre se houve ajuda e como percorreu a grade.",
      { kind: "grid", items: DOT_GRID, target: "⊙", durationSeconds: 60 },
    ),
  ],
  "d-inibicao": verbal(
    DAY12,
    "Quando eu disser DIA, responda NOITE. Quando eu disser NOITE, responda DIA.",
    { DIA: "NOITE", NOITE: "DIA" },
  ),
  "d-flexibilidade": verbal(
    DAY12.slice(0, 8),
    "Agora mudou: quando eu disser DIA, responda SOL. Quando eu disser NOITE, responda LUA.",
    { DIA: "SOL", NOITE: "LUA" },
  ),
  "d-planejamento": [
    step(
      "Ordenar a manhã",
      "Organize esta rotina antes de sair às 7h30.",
      "A criança toca cartões para definir a ordem e pode desfazer. Peça a justificativa.",
      "Não há uma ordem única. Verifique se a sequência é viável na explicação da criança.",
      {
        kind: "plan",
        items: [
          "Vestir-se",
          "Tomar café",
          "Escovar os dentes",
          "Conferir a mochila",
          "Sair às 7h30",
        ],
      },
    ),
    step(
      "Modificar o plano",
      "O material ainda não está pronto. O que muda?",
      "O plano inicial reaparece. Peça que reorganize os cartões; registre o motivo da mudança.",
      "Descreva o ajuste efetivo ou a ausência de ajuste, sem ponto de corte.",
      {
        kind: "plan",
        items: [
          "Vestir-se",
          "Tomar café",
          "Escovar os dentes",
          "Conferir a mochila",
          "Sair às 7h30",
        ],
        prompt: "O material ainda não está pronto.",
      },
    ),
  ],
  "e-rotina": conversation("Me conta como está sendo sua rotina ultimamente."),
  "e-social": [
    step(
      "Interpretar a mensagem",
      "Uma mensagem foi visualizada e não teve resposta. Que explicações existem? Qual seria a pior reação? Qual seria uma resposta mais adequada?",
      "Apresente o diálogo fictício. Faça uma pergunta por vez sem sugerir intenções.",
      "Registre hipóteses distintas e a justificativa; discordância do adulto não é erro automático.",
      scene("message"),
    ),
  ],
  "e-atencao": [
    step(
      "Busca de símbolo e letra",
      "Marque somente a estrela acompanhada da letra A: ★A. Você pode desmarcar tocando de novo.",
      "Diferencie ★A de ★B e de A isolado no ensaio. Abra a grade por 60 segundos.",
      "Registre seleções finais, omissões entre alvos e seleções de distratores, sem classificar normalidade.",
      { kind: "grid", items: SYMBOL_GRID, target: "★A", durationSeconds: 60 },
    ),
  ],
  "e-memoria": [
    step(
      "Três palavras",
      "Vou falar palavras. Repita na ordem inversa: CASA — SOL — MAR.",
      "Mantenha a tela neutra para o adolescente. Leia um item por segundo. Referência da aplicadora: MAR — SOL — CASA.",
      "Conte posições corretas na ordem inversa. Registre as palavras ditas e qualquer repetição.",
      blank,
    ),
    step(
      "Quatro palavras",
      "Repita na ordem inversa: GATO — FLOR — RUA — LUA.",
      "Leia um item por segundo, sem exibir a lista. Referência: LUA — RUA — FLOR — GATO.",
      "Se a dificuldade persistir nas duas primeiras listas, pare e marque a próxima lista NA com motivo; não preencha zero sem apresentar.",
      blank,
    ),
    step(
      "Cinco palavras",
      "Repita na ordem inversa: BOLA — CHAVE — PÃO — LIVRO — RIO.",
      "Só apresente se houver condição de prosseguir. Referência: RIO — LIVRO — PÃO — CHAVE — BOLA.",
      "Registre estratégia verbal apenas se apareceu sem sugestão do adulto.",
      blank,
    ),
  ],
  "e-inibicao": verbal(
    SIDE12,
    "Quando eu disser DIREITA, responda ESQUERDA. Quando eu disser ESQUERDA, responda DIREITA.",
    { DIREITA: "ESQUERDA", ESQUERDA: "DIREITA" },
  ),
  "e-troca": verbal(
    SIDE12.slice(0, 8),
    "Agora responda o mesmo lado: DIREITA é DIREITA e ESQUERDA é ESQUERDA.",
    { DIREITA: "DIREITA", ESQUERDA: "ESQUERDA" },
  ),
  "e-planejamento": [
    step(
      "Planejar a noite",
      "Organize a noite: prova amanhã, trabalho, banho, jantar e 30 minutos livres. Quanto tempo reserva para cada coisa?",
      "Peça que ordene os cartões e informe tempos. Registre as estimativas ditas; não sugira uma duração correta.",
      "Observe a justificativa, a priorização e a compatibilidade das durações propostas.",
      {
        kind: "plan",
        items: [
          "Estudar para a prova",
          "Fazer o trabalho",
          "Banho",
          "Jantar",
          "30 minutos livres",
        ],
        prompt: "Planeje a noite e estime os tempos.",
      },
    ),
    step(
      "Uma hora a mais",
      "O trabalho vai levar uma hora a mais. O que muda?",
      "Apresente o plano inicial e permita reorganizar. Pergunte o que pode mudar e o que precisa ser preservado.",
      "Compare o plano inicial com o final e registre a explicação.",
      {
        kind: "plan",
        items: [
          "Estudar para a prova",
          "Fazer o trabalho",
          "Banho",
          "Jantar",
          "30 minutos livres",
        ],
        prompt: "O trabalho vai levar uma hora a mais.",
      },
    ),
  ],
};

const screenOnlyFields: Record<string, string[]> = {
  "a1-imitacao": ["mostrar"],
  "a1-brincadeira": ["funcional", "simbolismo", "sequencia"],
  "a2-simbolica": ["funcional", "simbolico", "sequencia"],
  "b-simbolica": ["simbolismo", "sequencia", "flexibilidade"],
};
export function physicalFieldReason(
  missionId: string,
  fieldId: string,
): string | undefined {
  return screenOnlyFields[missionId]?.includes(fieldId)
    ? "Este campo descreve brincar/manipulação com objeto real; nesta modalidade registrar a interação digital nas notas e manter o campo presencial NA."
    : undefined;
}
export const DIGITAL_BANDS: DigitalBand[] = SONDA_DEZ_PROTOCOL.map((band) => ({
  ...band,
  materials: [
    "Tela com toque ou mouse",
    "Figuras, objetos, cenas e cartões internos",
    "Som interno opcional e voz da aplicadora",
  ],
  missions: band.missions.map((mission) => {
    const steps = configs[mission.id];
    if (!steps?.length)
      throw new Error(`Roteiro digital ausente: ${mission.id}`);
    return {
      ...mission,
      steps: steps.map((s) => ({
        ...s,
        silent: /^(Aguarde|Chame o nome)/.test(s.say),
      })),
      digitalLimit: DIGITAL_LIMIT,
      reading: mission.interpretation,
      fields: mission.fields.map((field) => ({
        ...field,
        ...(mission.id === "b-atencao-sustentada" && field.id === "omissoes"
          ? { max: 5 }
          : {}),
        options: field.options && [...field.options],
      })),
    };
  }),
}));
export function digitalBandForMonths(months: number): DigitalBand | undefined {
  return Number.isInteger(months)
    ? DIGITAL_BANDS.find((b) => months >= b.minMonths && months <= b.maxMonths)
    : undefined;
}
export const PREPARATION = [
  "Ambiente tranquilo; criança confortável; responsável orientado a não responder por ela.",
  "Rosto da aplicadora visível ao lado da tela. A criança pode apontar, falar ou tocar; registre quem operou.",
  "Figuras legíveis e controles funcionando no ensaio. Não exigir toque quando houver limitação motora.",
  "Se usar som, volume baixo e confortável, conferido antes. Não usar som para testar audição.",
  "Li as regras de ajuda, de pausa e de NA. Sei que a leitura final pertence ao médico.",
];
export const CONFOUNDERS = [
  "Sono/fadiga",
  "Dor, fome ou mal-estar",
  "Ansiedade, recusa ou pouco vínculo",
  "Dificuldade para ver a tela",
  "Dúvida sobre audição",
  "Dificuldade motora/toque",
  "Idioma ou compreensão das instruções",
  "Pouca familiaridade com tela",
  "Responsável ofereceu ajuda",
  "Medicação ou sedação referida",
];
export const TRAINING_CASES = [
  {
    question:
      "Você disse “toque na bola” uma vez. A criança tocou. Como registrar?",
    answer: "I",
    why: "A resposta veio após a instrução. Isso não é espontâneo.",
  },
  {
    question:
      "A criança respondeu somente após você repetir e apontar. Como registrar?",
    answer: "P",
    why: "Repetição ou pista é ajuda adicional e precisa aparecer no registro.",
  },
  {
    question: "A criança chorou e não aceitou olhar a tela. Como registrar?",
    answer: "NA",
    why: "Não houve oportunidade válida; recusa não comprova ausência da habilidade.",
  },
  {
    question:
      "A regra foi compreendida, a oportunidade foi válida e a resposta não apareceu. Como registrar?",
    answer: "0",
    why: "Não demonstrado nesta oportunidade. Não é diagnóstico nem incapacidade definitiva.",
  },
  {
    question:
      "Antes de qualquer pergunta, a criança apontou e pediu ajuda. Como registrar?",
    answer: "E",
    why: "A iniciativa ocorreu sem instrução ou pista adicional.",
  },
];
export function fieldGuidance(field: FieldDef): string {
  if (field.kind === "count")
    return `${COUNT_GUIDANCE[field.id] ?? "Conte apenas as ocorrências deste campo que você observou."} Contagem bruta${field.max !== undefined ? ` (máximo ${field.max})` : ""}. Deixe em branco se ainda não contou; use NA quando não houve condição. Zero só se houve oportunidade válida e nenhuma ocorrência.`;
  if (field.options?.includes("E") || field.options?.includes("P"))
    return "E: antes de instrução; I: após uma instrução; P: depois de repetir, modelar ou dar pista; 0: não demonstrado em oportunidade válida; NA: condição insuficiente. Não há soma de pontos.";
  if (/inteligibilidade/i.test(field.label))
    return "Boa: você compreendeu a amostra sem pedir esclarecimento. Parcial: compreendeu parte. Baixa: não conseguiu compreender a maior parte. Descreva uma fala e condições; não é classificação fonoaudiológica.";
  if (
    /organiza|narrativa|sequência|tópico|varredura|estratégia/i.test(
      field.label,
    )
  )
    return "Organizada/coerente: sequência identificável e ligação entre as partes; parcial/breve: alguns elementos sem toda a ligação; baixa/desorganizada/aleatória: não se identificou um percurso nesta amostra. Anote um exemplo. Não são faixas normativas.";
  if (/adapta|flexibili/i.test(field.label))
    return "Descreva quando e como mudou a regra/plano. Rápida ou gradual são descrições da observação, sem limite numérico validado. Se não mudou, registre isso sem inferir um transtorno.";
  if (/reciproci/i.test(field.label))
    return "Boa: houve trocas ligadas ao que o outro disse/fez; limitada: ocorreram poucas trocas ou foi preciso conduzir. Anote uma troca concreta. Ansiedade ou pouco vínculo podem interferir.";
  return "Marque somente o que observou neste item e descreva um exemplo. “Sim” exige ocorrência observada; “não” exige oportunidade válida. Se houve dúvida, recusa, ajuda que contaminou ou condição sensorial/motora, use NA e explique.";
}

const COUNT_GUIDANCE: Record<string, string> = {
  acertos:
    "Conte respostas de acordo com a regra vigente. Nas tarefas de palmas, esperar quando a regra pede também é uma resposta correta; nas de cachorro, conte somente alvos respondidos.",
  omissoes:
    "Conte alvos apresentados que ficaram sem a resposta pedida. Ex.: apareceu cachorro e não houve toque. Não conte estímulos que não chegaram a aparecer.",
  comissoes:
    "Conte respostas a estímulos que pediam esperar. Ex.: toque no gato ou palma quando a regra pedia ficar parado. Na grade, conte distratores que ficaram marcados ao final.",
  falsos:
    "Conte figuras que ficaram marcadas ao final e não eram o alvo da grade.",
  alvos:
    "Conte somente os alvos que ficaram marcados ao final, sem duplicar toques nem incluir marcações desfeitas.",
  redirecionamentos:
    "Conte cada intervenção sua para trazer a criança de volta à tarefa. Ex.: dizer “vamos continuar”. Registre a frase nas notas.",
  autocorrecoes:
    "Conte mudanças iniciadas pela própria criança, antes de você corrigir. Um segundo toque ou mudança aleatória, por si só, não comprova autocorreção.",
  repeticao:
    "Conte quantas vezes a instrução precisou ser dita novamente. A primeira leitura não é repetição. Registre quem pediu e o que foi repetido.",
  antecipacoes:
    "Conte respostas iniciadas antes de o estímulo ser apresentado. Diferencie uma resposta antecipada de um erro depois da apresentação.",
  perseveracoes:
    "Conte respostas que seguem a regra anterior depois da troca. Anote qual resposta ocorreu; não conte automaticamente todo erro como perseveração.",
  adaptou:
    "Registre o número do primeiro item a partir do qual a nova regra foi mantida até o fim. Se não houve adaptação identificável, use NA e descreva; não invente zero ou um item.",
  erros:
    "Conte respostas que não seguiram a regra. Descreva o que foi dito; erro isolado não demonstra impulsividade.",
  etapas:
    "Conte as ações pedidas que foram realizadas. Registre a ordem separadamente: realizar os objetos certos fora da ordem não preserva a sequência.",
  hipoteses:
    "Conte explicações diferentes para a situação. Repetir a mesma ideia com outras palavras não acrescenta uma hipótese.",
};

export const NOVICE_STEPS = [
  "Prepare sem a criança: confira idade, conforto, tela e som. Faça os três ensaios e os cinco exemplos de registro.",
  "Acolha a criança e o responsável: “Vamos fazer algumas atividades curtas. Não precisa acertar tudo. Podemos parar se ficar desconfortável.” Peça ao responsável que não antecipe respostas.",
  "Antes de cada etapa, leia a fala e o que observar com a tela voltada para você. Se precisar, use Familiarizar com os controles; os exemplos neutros não entram nas respostas da missão.",
  "Diga somente a fala indicada. Quando estiver escrito Observação em silêncio, não leia a orientação em voz alta. Abra o estímulo e vire a tela; nos cartões verbais, mantenha a tela voltada para você.",
  "Observe antes de ajudar. Registre uma repetição, pista, demonstração ou toque feito por outra pessoa. Não invente respostas a partir do que o responsável conta.",
  "Ao voltar, anote a resposta e a ajuda antes da próxima etapa. Se não houve condição, use Não avaliar esta etapa ou Toda a missão: NA e escreva o motivo. Confira os campos e conclua a missão.",
  "Na revisão, confira lacunas, ajudas e interferentes. Copie ou baixe o registro antes de sair desta tela e entregue ao médico. A fala para a família já está pronta no encerramento.",
];
