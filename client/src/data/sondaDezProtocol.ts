// Fonte presencial AFN-10 já existente, extraída sem alterar conteúdo.
// A adaptação digital tem versão e critérios próprios em sondaDezDigital.ts.
const CODES = ["E", "I", "P", "0", "NA"] as const;

export type FieldValue = string | number;
type FieldKind = "choice" | "count" | "text";

export type FieldDef = {
  id: string;
  label: string;
  kind: FieldKind;
  options?: string[];
  max?: number;
  hint?: string;
};

type ChildVisual = {
  title: string;
  subtitle?: string;
  items: string[];
};

export type MissionDef = {
  id: string;
  title: string;
  start: string;
  end: string;
  say: string[];
  doSteps: string[];
  materials: string[];
  observe: string[];
  fields: FieldDef[];
  interpretation: string[];
  childVisual?: ChildVisual;
};

export type BandDef = {
  id: string;
  label: string;
  minMonths: number;
  maxMonths: number;
  icon: string;
  subtitle: string;
  materials: string[];
  missions: MissionDef[];
};

const codeField = (id: string, label: string): FieldDef => ({
  id,
  label,
  kind: "choice",
  options: [...CODES],
});
const choiceField = (
  id: string,
  label: string,
  options: string[],
): FieldDef => ({
  id,
  label,
  kind: "choice",
  options,
});
const countField = (
  id: string,
  label: string,
  max?: number,
  hint?: string,
): FieldDef => ({
  id,
  label,
  kind: "count",
  max,
  hint,
});

export const SONDA_DEZ_PROTOCOL: BandDef[] = [
  {
    id: "12-23m",
    label: "12–23 meses",
    minMonths: 12,
    maxMonths: 23,
    icon: "🌱",
    subtitle:
      "Interação, compreensão, gestos, brincadeira e autorregulação inicial",
    materials: [
      "brinquedo pequeno e interessante",
      "bola",
      "carrinho",
      "boneco/bebê",
      "colher e copo",
      "telefone de brinquedo",
      "caixa transparente difícil de abrir",
      "2 recipientes opacos iguais",
    ],
    missions: [
      {
        id: "a1-social-nome",
        title: "Entrada social + resposta ao nome",
        start: "0:00",
        end: "1:00",
        say: ["Após 30 s livres, chame o nome da criança 2 vezes, sem tocar."],
        doSteps: [
          "Mostre um brinquedo interessante.",
          "Espere 30 segundos sem comando.",
          "Chame o nome duas vezes, sem tocar na criança.",
        ],
        materials: ["brinquedo interessante"],
        observe: [
          "alterna olhar entre pessoa e objeto",
          "gesto ou vocalização espontânea",
          "quantas vezes responde ao nome",
        ],
        fields: [
          choiceField("alterna", "Alterna pessoa–objeto", ["E", "0", "NA"]),
          choiceField("gesto", "Gesto/vocalização", ["E", "0", "NA"]),
          choiceField("nome", "Resposta ao nome", ["0/2", "1/2", "2/2", "NA"]),
        ],
        interpretation: [
          "Alternar pessoa–objeto descreve coordenação social da atenção nesta situação.",
          "Responder ao nome em uma, duas ou nenhuma oportunidade é registro bruto; não é ponto de corte.",
        ],
      },
      {
        id: "a1-receptiva",
        title: "Linguagem receptiva",
        start: "1:00",
        end: "2:30",
        say: ["Me dê a bola.", "Pegue o carro.", "Cadê o bebê?"],
        doSteps: [
          "Apresente os objetos ao alcance.",
          "Diga cada ordem uma vez.",
          "Só depois use pista/repetição se necessário e registre isso.",
        ],
        materials: ["bola", "carrinho", "boneco/bebê"],
        observe: [
          "se executa após instrução",
          "se precisa de pista/repetição",
          "se a tarefa fica não avaliável",
        ],
        fields: [
          codeField("bola", "Bola"),
          codeField("carro", "Carrinho"),
          codeField("bebe", "Bebê"),
        ],
        interpretation: [
          "I registra execução após a instrução direta; P registra necessidade de pista/repetição; 0 significa apenas que não foi demonstrado aqui.",
        ],
        childVisual: { title: "Mostre os objetos", items: ["⚽", "🚗", "🧸"] },
      },
      {
        id: "a1-imitacao",
        title: "Imitação + gestos",
        start: "2:30",
        end: "3:45",
        say: ["Faz igual."],
        doSteps: [
          "Bata palmas.",
          "Mande beijo.",
          "Toque a cabeça.",
          "Empurre o carrinho.",
        ],
        materials: ["carrinho"],
        observe: [
          "quantas das 4 ações imita",
          "apontar espontâneo",
          "mostrar/entregar objeto espontaneamente",
        ],
        fields: [
          countField("imitacoes", "Imitações", 4),
          choiceField("apontar", "Apontar", ["E", "0", "NA"]),
          choiceField("mostrar", "Mostrar/entregar objeto", ["E", "0", "NA"]),
        ],
        interpretation: [
          "O número de imitações é uma contagem bruta das quatro oportunidades apresentadas.",
          "Gestos espontâneos são registrados separadamente de respostas provocadas.",
        ],
      },
      {
        id: "a1-atencao-conjunta",
        title: "Atenção conjunta",
        start: "3:45",
        end: "5:15",
        say: ["Olha!"],
        doSteps: [
          "Aponte para um estímulo lateral.",
          "Crie duas oportunidades naturais, sem reposicionar fisicamente a criança.",
        ],
        materials: ["objeto lateral interessante"],
        observe: [
          "segue apontar/olhar",
          "olha de volta para a pessoa",
          "inicia compartilhamento",
        ],
        fields: [
          countField("segue", "Segue apontar/olhar", 2),
          countField("retorno", "Olha de volta para a pessoa", 2),
          choiceField("inicia", "Inicia compartilhamento", ["E", "0", "NA"]),
        ],
        interpretation: [
          "Seguir a referência e depois retornar o olhar descreve coordenação da atenção social na aplicação.",
          "Iniciativa de compartilhar deve ser registrada somente quando surgir sem indução.",
        ],
      },
      {
        id: "a1-brincadeira",
        title: "Brincadeira funcional",
        start: "5:15",
        end: "6:45",
        say: ["O bebê está com fome."],
        doSteps: [
          "Deixe 30 segundos de exploração livre.",
          "Depois use a frase proposta, sem modelar imediatamente a ação.",
        ],
        materials: [
          "boneco",
          "colher",
          "copo",
          "carrinho",
          "telefone de brinquedo",
        ],
        observe: ["uso funcional", "simbolismo", "sequência de ações"],
        fields: [
          choiceField("funcional", "Uso funcional", ["E", "I", "0", "NA"]),
          choiceField("simbolismo", "Simbolismo observado", [
            "sim",
            "não",
            "NA",
          ]),
          choiceField("sequencia", "Sequência de ações", ["sim", "não", "NA"]),
        ],
        interpretation: [
          "Uso funcional descreve ação coerente com o objeto; simbolismo e sequência são descritos separadamente para não colapsar comportamentos diferentes.",
        ],
      },
      {
        id: "a1-ajuda",
        title: "Problema + pedido de ajuda",
        start: "6:45",
        end: "8:15",
        say: ["Precisa de alguma coisa?"],
        doSteps: [
          "Coloque um brinquedo desejável dentro de caixa difícil.",
          "Espere 20 segundos.",
          "Só então faça a pergunta.",
        ],
        materials: ["brinquedo desejável", "caixa transparente difícil"],
        observe: [
          "como solicita ajuda",
          "se muda estratégia",
          "como se regula diante do obstáculo",
        ],
        fields: [
          codeField("ajuda", "Solicitação de ajuda"),
          choiceField("estrategia", "Muda estratégia", ["sim", "não", "NA"]),
          choiceField("regula", "Regula-se", ["sim", "não", "NA"]),
        ],
        interpretation: [
          "Pedido espontâneo e pedido após instrução/pista representam graus diferentes de mediação; nenhum deles equivale a diagnóstico.",
          "Frustração intensa ou sofrimento sustentado é motivo para interromper, não para insistir.",
        ],
      },
      {
        id: "a1-espera",
        title: "Espera + permanência do objeto",
        start: "8:15",
        end: "10:00",
        say: ["Espera... agora!"],
        doSteps: [
          "Faça a espera três vezes.",
          "Depois esconda um objeto sob um de dois recipientes, em duas tentativas.",
        ],
        materials: ["objeto pequeno", "2 recipientes opacos iguais"],
        observe: [
          "quantas vezes espera",
          "busca no recipiente correto",
          "reação à interrupção",
        ],
        fields: [
          countField("espera", "Espera até o sinal", 3),
          countField("busca", "Busca objeto correto", 2),
          choiceField("interrupcao", "Reação à interrupção", [
            "adequada",
            "intensa",
            "NA",
          ]),
        ],
        interpretation: [
          "A contagem de espera descreve controle da resposta nas três oportunidades.",
          "Reação intensa deve ser contextualizada por sono, dor/fome, ansiedade/recusa e demais interferentes.",
        ],
      },
    ],
  },
  {
    id: "24-35m",
    label: "24–35 meses",
    minMonths: 24,
    maxMonths: 35,
    icon: "🌿",
    subtitle:
      "Comunicação, simbolismo, resolução de problema e inibição inicial",
    materials: [
      "bola",
      "carrinho",
      "caixa",
      "colher",
      "boneco/bebê",
      "banana ou figura de banana",
      "telefone de brinquedo",
      "caixa transparente difícil",
    ],
    missions: [
      {
        id: "a2-social",
        title: "Entrada social + nome",
        start: "0:00",
        end: "1:00",
        say: ["Após 30 s livres, chame o nome 2 vezes sem tocar."],
        doSteps: [
          "Ofereça um brinquedo interessante.",
          "Observe por 30 segundos sem dirigir.",
          "Chame o nome duas vezes.",
        ],
        materials: ["brinquedo interessante"],
        observe: [
          "alterna pessoa–objeto",
          "iniciativa comunicativa",
          "resposta ao nome",
        ],
        fields: [
          choiceField("alterna", "Alterna pessoa–objeto", ["E", "0", "NA"]),
          choiceField("iniciativa", "Iniciativa comunicativa", [
            "E",
            "0",
            "NA",
          ]),
          choiceField("nome", "Resposta ao nome", ["0/2", "1/2", "2/2", "NA"]),
        ],
        interpretation: [
          "Iniciativa comunicativa deve ser marcada como espontânea apenas se surgir sem solicitação direta.",
          "Resposta ao nome permanece uma contagem bruta de duas oportunidades.",
        ],
      },
      {
        id: "a2-compreensao",
        title: "Compreensão verbal",
        start: "1:00",
        end: "2:30",
        say: [
          "Me dê a bola.",
          "Ponha o carro dentro da caixa.",
          "Pegue a colher e dê ao bebê.",
        ],
        doSteps: [
          "Apresente os objetos.",
          "Diga as três ordens na sequência prevista.",
          "Registre se foi necessário repetir ou dar pista.",
        ],
        materials: ["bola", "carrinho", "caixa", "colher", "boneco/bebê"],
        observe: ["ordem simples", "relação espacial", "ordem em duas etapas"],
        fields: [
          codeField("ordem1", "Ordem 1"),
          codeField("ordem2", "Ordem 2"),
          codeField("duas", "Ordem de 2 etapas"),
        ],
        interpretation: [
          "Compare a quantidade de mediação necessária entre ordens, sem converter esse padrão em classificação normativa.",
        ],
      },
      {
        id: "a2-expressiva",
        title: "Linguagem expressiva + fala",
        start: "2:30",
        end: "3:45",
        say: ["O que é isso?"],
        doSteps: [
          "Mostre bola, carrinho e banana.",
          "Depois crie uma oportunidade natural para uma solicitação espontânea.",
        ],
        materials: ["bola", "carrinho", "banana ou figura"],
        observe: [
          "nomeação",
          "combinação de palavras",
          "inteligibilidade nesta amostra",
        ],
        fields: [
          countField("nomeacao", "Nomeação", 3),
          choiceField("combina", "Combina palavras", ["sim", "não", "NA"]),
          choiceField("inteligibilidade", "Inteligibilidade", [
            "boa",
            "parcial",
            "baixa",
            "NA",
          ]),
        ],
        interpretation: [
          "A inteligibilidade é uma descrição da fala produzida nesta amostra curta; não substitui avaliação fonoaudiológica.",
        ],
        childVisual: { title: "O que é isso?", items: ["⚽", "🚗", "🍌"] },
      },
      {
        id: "a2-atencao",
        title: "Atenção conjunta + gesto",
        start: "3:45",
        end: "5:00",
        say: ["Olha!"],
        doSteps: [
          "Aponte duas vezes para estímulos laterais.",
          "Depois ofereça oportunidade para a criança apontar/mostrar algo interessante.",
        ],
        materials: ["2 estímulos interessantes"],
        observe: ["segue referência", "aponta", "mostra/compartilha"],
        fields: [
          countField("segue", "Segue referência", 2),
          choiceField("apontar", "Apontar", ["E", "I", "0", "NA"]),
          choiceField("mostrar", "Mostrar/compartilhar", ["E", "0", "NA"]),
        ],
        interpretation: [
          "Diferencie resposta ao apontar de iniciativa de compartilhar; são comportamentos distintos no registro.",
        ],
      },
      {
        id: "a2-simbolica",
        title: "Brincadeira simbólica",
        start: "5:00",
        end: "6:30",
        say: ["O bebê está com fome."],
        doSteps: [
          "Deixe 30 segundos livres com os objetos.",
          "Depois faça a frase sem modelar a ação.",
        ],
        materials: ["boneco", "copo", "colher", "telefone"],
        observe: ["uso funcional", "simbolismo", "sequência de 2 ações"],
        fields: [
          choiceField("funcional", "Uso funcional", ["sim", "não", "NA"]),
          choiceField("simbolico", "Simbólico", ["E", "I", "0", "NA"]),
          choiceField("sequencia", "Sequência de 2 ações", [
            "sim",
            "não",
            "NA",
          ]),
        ],
        interpretation: [
          "O app separa uso funcional, simbolismo e sequência para evitar uma conclusão única a partir de comportamentos diferentes.",
        ],
      },
      {
        id: "a2-problema",
        title: "Resolução de problema + ajuda",
        start: "6:30",
        end: "8:00",
        say: ["Precisa de alguma coisa?"],
        doSteps: [
          "Coloque o objeto desejável em caixa transparente difícil.",
          "Espere antes de perguntar.",
        ],
        materials: ["objeto desejável", "caixa transparente difícil"],
        observe: ["solicitação de ajuda", "persistência", "frustração"],
        fields: [
          codeField("ajuda", "Solicita ajuda"),
          choiceField("persistencia", "Persistência", ["boa", "baixa", "NA"]),
          choiceField("frustracao", "Frustração", ["leve", "intensa", "NA"]),
        ],
        interpretation: [
          "Frustração intensa ou recusa sustentada deve interromper a exigência da tarefa; marque interferente/alerta em vez de insistir.",
        ],
      },
      {
        id: "a2-memoria-inibicao",
        title: "Memória inicial + inibição",
        start: "8:00",
        end: "10:00",
        say: [
          "Primeiro o carro, depois a bola.",
          "Espera... só quando eu disser JÁ.",
        ],
        doSteps: [
          "Aplique a sequência carro→bola.",
          "Depois faça três oportunidades de espera.",
        ],
        materials: ["carrinho", "bola"],
        observe: [
          "sequência correta",
          "quantas esperas cumpre",
          "respostas antecipadas",
        ],
        fields: [
          codeField("sequencia", "Sequência correta"),
          countField("espera", "Espera até o JÁ", 3),
          countField("antecipadas", "Respostas antecipadas", 3),
        ],
        interpretation: [
          "Resposta antecipada descreve ação antes do sinal; pode ocorrer por compreensão, engajamento, controle da resposta ou outros fatores e não é diagnóstico de impulsividade.",
        ],
      },
    ],
  },
  {
    id: "3-4a",
    label: "3–4 anos",
    minMonths: 36,
    maxMonths: 59,
    icon: "🚀",
    subtitle:
      "Interação, conceitos, linguagem, atenção sustentada e troca de regra",
    materials: [
      "banana/figura",
      "objetos grande/pequeno",
      "carrinho e caixa",
      "boneco",
      "copo",
      "colher",
      "telefone",
      "15 figuras com 5 cachorros",
      "cartões SOL/LUA",
      "fichas",
    ],
    missions: [
      {
        id: "b-interacao",
        title: "Interação espontânea",
        start: "0:00",
        end: "1:00",
        say: ["Oi. Olha o que eu tenho aqui."],
        doSteps: [
          "Deixe a criança explorar e conversar sem dirigir por 30 segundos.",
        ],
        materials: ["objeto interessante"],
        observe: ["reciprocidade", "comentário/pergunta", "fala espontânea"],
        fields: [
          codeField("reciprocidade", "Reciprocidade"),
          choiceField("comentario", "Comentário/pergunta", ["E", "0", "NA"]),
          choiceField("fala", "Fala espontânea", ["sim", "não", "NA"]),
        ],
        interpretation: [
          "Espontaneidade é registrada antes de qualquer ajuda; não confunda silêncio inicial com incapacidade se houver ansiedade/recusa.",
        ],
      },
      {
        id: "b-receptivo",
        title: "Receptivo + conceitos",
        start: "1:00",
        end: "2:30",
        say: [
          "Mostre a banana.",
          "Mostre o grande.",
          "Ponha o carro dentro da caixa.",
          "Boneco em cima.",
        ],
        doSteps: [
          "Aplique as quatro instruções.",
          "Conte quantas repetições foram necessárias.",
        ],
        materials: [
          "banana/figura",
          "objetos grande/pequeno",
          "carrinho",
          "caixa",
          "boneco",
        ],
        observe: [
          "nomeação receptiva",
          "conceitos espaciais/tamanho",
          "necessidade de repetição",
        ],
        fields: [
          countField("nomeacao", "Nomeação receptiva", 1),
          countField("conceitos", "Conceitos", 3),
          choiceField("repetir", "Precisou repetir", ["0", "1", "2+", "NA"]),
        ],
        interpretation: [
          "Registre o número de conceitos demonstrados e a repetição necessária sem classificar o resultado como normal ou alterado.",
        ],
        childVisual: {
          title: "Mostre o que eu pedir",
          items: ["🍌", "🔵", "🔷", "🚗"],
        },
      },
      {
        id: "b-expressivo",
        title: "Expressivo + amostra de fala",
        start: "2:30",
        end: "4:00",
        say: ["O que é isso?", "O que está acontecendo?"],
        doSteps: [
          "Nomeie quatro figuras, uma por vez.",
          "Depois mostre uma cena autoral e peça uma descrição.",
        ],
        materials: ["4 figuras", "cena autoral"],
        observe: ["nomeação", "frase espontânea", "inteligibilidade"],
        fields: [
          countField("nomeacao", "Nomeação", 4),
          choiceField("frase", "Frase espontânea", ["sim", "não", "NA"]),
          choiceField("inteligibilidade", "Inteligibilidade", [
            "boa",
            "parcial",
            "baixa",
            "NA",
          ]),
        ],
        interpretation: [
          "Descreva a amostra produzida; não extrapole a inteligibilidade desta tarefa para todos os contextos.",
        ],
      },
      {
        id: "b-atencao-ajuda",
        title: "Atenção conjunta + ajuda",
        start: "4:00",
        end: "5:15",
        say: ["Olha!", "Precisa de ajuda?"],
        doSteps: [
          "Crie um episódio de apontar/olhar.",
          "Crie um objeto difícil ou inacessível.",
        ],
        materials: ["estímulo lateral", "objeto difícil/inacessível"],
        observe: ["segue referência", "alterna olhar", "pede ajuda"],
        fields: [
          codeField("segue", "Segue referência"),
          choiceField("alterna", "Alterna olhar", ["E", "0", "NA"]),
          codeField("ajuda", "Pede ajuda"),
        ],
        interpretation: [
          "Observe separadamente resposta à referência social e estratégia de pedir ajuda.",
        ],
      },
      {
        id: "b-simbolica",
        title: "Brincadeira simbólica",
        start: "5:15",
        end: "6:30",
        say: ["O bebê está doente. O que a gente pode fazer?"],
        doSteps: [
          "Deixe 20 segundos livres com boneco e objetos.",
          "Depois faça a pergunta.",
        ],
        materials: ["boneco e objetos de faz-de-conta"],
        observe: ["simbolismo", "sequência", "flexibilidade"],
        fields: [
          codeField("simbolismo", "Simbolismo"),
          choiceField("sequencia", "Sequência", ["sim", "não", "NA"]),
          choiceField("flexibilidade", "Flexibilidade", [
            "boa",
            "limitada",
            "NA",
          ]),
        ],
        interpretation: [
          "Flexibilidade aqui descreve variedade/ajuste do brincar na cena proposta, não um traço diagnóstico.",
        ],
      },
      {
        id: "b-atencao-sustentada",
        title: "Atenção sustentada",
        start: "6:30",
        end: "8:15",
        say: ["Toda vez que aparecer um cachorro, coloque uma ficha aqui."],
        doSteps: [
          "Apresente 15 figuras, sendo 5 alvos.",
          "Não corrija durante a sequência.",
          "Registre redirecionamentos externos.",
        ],
        materials: ["15 figuras", "fichas"],
        observe: ["acertos", "omissões", "comissões", "redirecionamentos"],
        fields: [
          countField("acertos", "Acertos", 5),
          countField("omissoes", "Omissões", 15),
          countField("comissoes", "Comissões", 10),
          countField("redirecionamentos", "Redirecionamentos"),
        ],
        interpretation: [
          "Omissão = alvo apresentado sem resposta registrada; pode refletir atenção, compreensão, fadiga, engajamento ou outros fatores.",
          "Comissão = resposta quando o estímulo não era alvo; descreve falha de contenção da resposta nesta tarefa, sem confirmar TDAH.",
        ],
        childVisual: {
          title: "Quando aparecer 🐶, coloque uma ficha",
          subtitle: "Não toque nos outros",
          items: [
            "🐶",
            "🐱",
            "🐰",
            "🐶",
            "🦊",
            "🐻",
            "🐶",
            "🐼",
            "🐯",
            "🐸",
            "🐶",
            "🐵",
            "🦁",
            "🐶",
            "🐮",
          ],
        },
      },
      {
        id: "b-inibicao",
        title: "Inibição + troca de regra",
        start: "8:15",
        end: "10:00",
        say: [
          "SOL = bater palma. LUA = não fazer nada.",
          "Agora vamos inverter a regra.",
        ],
        doSteps: [
          "Aplique 10 itens na regra inicial.",
          "Se a criança compreendeu, inverta nos 4 finais.",
        ],
        materials: ["cartões SOL/LUA"],
        observe: [
          "acertos na regra inicial",
          "comissões",
          "acertos após inversão",
          "perseverações",
        ],
        fields: [
          countField("acertos", "Regra inicial: acertos", 10),
          countField("comissoes", "Comissões", 10),
          countField("inversao", "Inversão: acertos", 4),
          countField("perseveracoes", "Perseverações", 4),
        ],
        interpretation: [
          "Perseveração = manutenção da regra anterior após a mudança; descreva a adaptação observada sem classificá-la por norma.",
        ],
        childVisual: {
          title: "SOL = palma · LUA = parar",
          items: ["☀️", "🌙", "☀️", "☀️", "🌙", "☀️", "🌙", "🌙", "☀️", "🌙"],
        },
      },
    ],
  },
  {
    id: "5-7a",
    label: "5–7 anos",
    minMonths: 60,
    maxMonths: 95,
    icon: "🧭",
    subtitle:
      "Narrativa, memória operacional, atenção, inibição, flexibilidade e visuoconstrução",
    materials: [
      "cena autoral",
      "objetos para ordens de 2–3 etapas",
      "20 estímulos com 6 cachorros",
      "cartões SOL/LUA",
      "6 blocos de construção",
    ],
    missions: [
      {
        id: "c-conversa",
        title: "Conversação",
        start: "0:00",
        end: "0:45",
        say: ["Me conta alguma coisa legal que aconteceu hoje ou ontem."],
        doSteps: ["Espere a resposta sem completar a história pela criança."],
        materials: ["nenhum"],
        observe: ["reciprocidade", "organização narrativa"],
        fields: [
          choiceField("reciprocidade", "Reciprocidade", [
            "boa",
            "limitada",
            "NA",
          ]),
          choiceField("narrativa", "Narrativa", [
            "coerente",
            "breve",
            "desorganizada",
            "NA",
          ]),
        ],
        interpretation: [
          "A classificação descreve esta conversa curta; ansiedade, timidez e pouco vínculo podem interferir.",
        ],
      },
      {
        id: "c-compreensao",
        title: "Compreensão + memória operacional",
        start: "0:45",
        end: "2:15",
        say: ["Vou te pedir algumas coisas. Escuta tudo antes de começar."],
        doSteps: [
          "Aplique três ordens progressivas de 2 a 3 etapas.",
          "Inclua antes/depois em uma delas.",
          "Conte repetições.",
        ],
        materials: ["objetos para ordens de 2–3 etapas"],
        observe: ["etapas cumpridas", "ordem temporal", "pedidos de repetição"],
        fields: [
          countField("ordem1", "Ordem 1: etapas corretas", 2),
          countField("ordem2", "Ordem 2: etapas corretas", 3),
          countField("temporal", "Ordem temporal: etapas corretas", 3),
          countField("repeticao", "Repetições"),
        ],
        interpretation: [
          "Etapas corretas são contagem bruta de execução; pedidos de repetição também podem representar estratégia de checagem.",
        ],
      },
      {
        id: "c-narrativa",
        title: "Narrativa + inferência",
        start: "2:15",
        end: "3:30",
        say: ["O que aconteceu?", "Por quê?", "O que vai acontecer depois?"],
        doSteps: [
          "Mostre uma cena autoral.",
          "Faça as três perguntas sem sugerir respostas.",
        ],
        materials: ["cena autoral"],
        observe: ["sequência", "causalidade", "previsão"],
        fields: [
          choiceField("sequencia", "Sequência", ["sim", "não", "NA"]),
          codeField("causalidade", "Causalidade"),
          codeField("previsao", "Previsão"),
        ],
        interpretation: [
          "Registre se a criança constrói sequência, causa e previsão a partir desta cena específica.",
        ],
        childVisual: {
          title: "Olhe a cena e conte a história",
          items: ["🌧️", "🧒", "☂️", "🏠"],
        },
      },
      {
        id: "c-atencao",
        title: "Atenção sustentada",
        start: "3:30",
        end: "5:15",
        say: ["Responda apenas quando aparecer o cachorro."],
        doSteps: [
          "Apresente 20 estímulos, 6 alvos, um a cada 2–3 s.",
          "Não comente os erros durante a tarefa.",
        ],
        materials: ["20 estímulos"],
        observe: [
          "acertos",
          "omissões",
          "comissões",
          "autocorreções",
          "redirecionamentos",
        ],
        fields: [
          countField("acertos", "Acertos", 6),
          countField("omissoes", "Omissões", 6),
          countField("comissoes", "Comissões", 14),
          countField("autocorrecoes", "Autocorreções"),
          countField("redirecionamentos", "Redirecionamentos"),
        ],
        interpretation: [
          "Omissões e comissões são fenômenos distintos; uma tarefa curta não estabelece causa clínica isoladamente.",
          "Autocorreção registra monitoramento da própria resposta quando ocorre sem correção externa.",
        ],
        childVisual: {
          title: "Responda só ao 🐶",
          items: [
            "🐶",
            "🐱",
            "🦊",
            "🐶",
            "🐻",
            "🐰",
            "🐶",
            "🐼",
            "🐯",
            "🐸",
            "🐶",
            "🐵",
            "🦁",
            "🐮",
            "🐶",
            "🐷",
            "🐔",
            "🐧",
            "🐶",
            "🦆",
          ],
        },
      },
      {
        id: "c-inibitorio",
        title: "Controle inibitório",
        start: "5:15",
        end: "6:45",
        say: ["SOL = uma palma. LUA = ficar parado."],
        doSteps: ["Aplique 16 itens.", "Não comente erros durante a tarefa."],
        materials: ["cartões SOL/LUA"],
        observe: ["acertos", "comissões", "omissões", "antecipações"],
        fields: [
          countField("acertos", "Acertos", 16),
          countField("comissoes", "Comissões", 16),
          countField("omissoes", "Omissões", 16),
          countField("antecipacoes", "Antecipações", 16),
        ],
        interpretation: [
          "Comissão = agir quando deveria inibir; omissão = não agir no alvo; antecipação = agir antes da apresentação completa. Registre separadamente.",
        ],
        childVisual: {
          title: "☀️ = palma · 🌙 = parado",
          items: ["☀️", "🌙", "☀️", "🌙", "🌙", "☀️", "☀️", "🌙"],
        },
      },
      {
        id: "c-flexibilidade",
        title: "Flexibilidade cognitiva",
        start: "6:45",
        end: "8:15",
        say: ["Agora mudou: LUA = palma; SOL = parado."],
        doSteps: ["Aplique 8 itens com a regra invertida."],
        materials: ["cartões SOL/LUA"],
        observe: [
          "acertos",
          "perseverações",
          "quantos itens até adaptação",
          "autocorreção",
        ],
        fields: [
          countField("acertos", "Acertos", 8),
          countField("perseveracoes", "Perseverações", 8),
          countField("adaptou", "Adaptou após quantos itens", 8),
          choiceField("autocorrecao", "Autocorreção", ["sim", "não", "NA"]),
        ],
        interpretation: [
          "Perseveração descreve continuidade da regra anterior após a mudança; adaptação rápida ou gradual é registrada sem ponto de corte.",
        ],
      },
      {
        id: "c-visuoconstrutivo",
        title: "Planejamento visuoconstrutivo",
        start: "8:15",
        end: "10:00",
        say: ["Agora faça uma igual."],
        doSteps: [
          "Mostre uma construção de 6 blocos por 5 segundos.",
          "Desmonte e peça a reprodução.",
        ],
        materials: ["6 blocos"],
        observe: ["conclusão", "autocorreções", "estratégia organizada"],
        fields: [
          choiceField("conclusao", "Conclusão", [
            "concluiu",
            "parcial",
            "não concluiu",
            "NA",
          ]),
          countField("autocorrecoes", "Autocorreções"),
          choiceField("estrategia", "Estratégia organizada", [
            "sim",
            "não",
            "NA",
          ]),
        ],
        interpretation: [
          "Observe o método usado além do produto final: organização e autocorreção são dados diferentes de conclusão.",
        ],
        childVisual: {
          title: "Veja por 5 segundos",
          subtitle: "Depois faça uma igual com os blocos",
          items: ["🟦", "🟨", "🟥", "🟩", "🟪", "🟧"],
        },
      },
    ],
  },
  {
    id: "8-11a",
    label: "8–11 anos",
    minMonths: 96,
    maxMonths: 143,
    icon: "🧠",
    subtitle:
      "Pragmática, inferência social, memória operacional, atenção, flexibilidade e planejamento",
    materials: [
      "cena social ambígua autoral",
      "4 objetos",
      "grade autoral de alvos",
      "cronômetro do app",
      "cartões/estímulos DIA/NOITE",
      "cartões de rotina",
    ],
    missions: [
      {
        id: "d-pragmatica",
        title: "Pragmática espontânea",
        start: "0:00",
        end: "0:45",
        say: ["Me conta como foi seu dia até chegar aqui."],
        doSteps: [
          "Escute sem interromper inicialmente.",
          "Não complete a narrativa pela criança.",
        ],
        materials: ["nenhum"],
        observe: ["organização", "reciprocidade", "manutenção do tópico"],
        fields: [
          choiceField("organizacao", "Organização", [
            "boa",
            "parcial",
            "baixa",
            "NA",
          ]),
          choiceField("reciprocidade", "Reciprocidade", [
            "boa",
            "limitada",
            "NA",
          ]),
          choiceField("topico", "Mantém tópico", ["sim", "não", "NA"]),
        ],
        interpretation: [
          "A pragmática é descrita a partir desta conversa breve e deve ser correlacionada com contextos naturais.",
        ],
      },
      {
        id: "d-inferencia",
        title: "Inferência social",
        start: "0:45",
        end: "2:00",
        say: [
          "O que acontece?",
          "Como a pessoa se sente?",
          "O que faz você pensar isso?",
        ],
        doSteps: [
          "Mostre uma cena social ambígua autoral.",
          "Faça as três perguntas sem oferecer alternativas.",
        ],
        materials: ["cena social ambígua autoral"],
        observe: [
          "contexto",
          "emoção",
          "justificativa espontânea ou após instrução/pista",
        ],
        fields: [
          choiceField("contexto", "Identifica contexto", ["sim", "não", "NA"]),
          choiceField("emocao", "Identifica emoção", ["sim", "não", "NA"]),
          codeField("justificativa", "Justificativa"),
        ],
        interpretation: [
          "Uma justificativa espontânea mostra que a criança explicitou pistas usadas; ausência nesta cena não define cognição social global.",
        ],
        childVisual: {
          title: "O que você acha que aconteceu?",
          items: ["🧒📚", "👧↩️", "😕", "💬"],
        },
      },
      {
        id: "d-memoria",
        title: "Memória operacional",
        start: "2:00",
        end: "3:30",
        say: ["Vou dizer quatro coisas. Faça na ordem que eu falar."],
        doSteps: [
          "Diga uma ordem de 4 etapas com objetos.",
          "Não repita automaticamente.",
        ],
        materials: ["4 objetos"],
        observe: ["etapas corretas", "ordem preservada", "pedido de repetição"],
        fields: [
          countField("etapas", "Etapas corretas", 4),
          choiceField("ordem", "Ordem preservada", ["sim", "não", "NA"]),
          choiceField("repeticao", "Pediu repetição", ["sim", "não", "NA"]),
        ],
        interpretation: [
          "Pedir repetição pode ser estratégia adaptativa; registre em separado do número de etapas executadas.",
        ],
      },
      {
        id: "d-atencao",
        title: "Atenção seletiva/sustentada",
        start: "3:30",
        end: "5:15",
        say: [
          "Você tem 60 segundos. Marque apenas os círculos com ponto dentro.",
        ],
        doSteps: [
          "Apresente a grade autoral.",
          "Inicie o cronômetro de 60 segundos.",
          "Não indique erros durante a tarefa.",
        ],
        materials: ["grade autoral de alvos"],
        observe: [
          "alvos",
          "omissões",
          "falsos positivos",
          "estratégia de varredura",
        ],
        fields: [
          countField("alvos", "Alvos marcados"),
          countField("omissoes", "Omissões"),
          countField("falsos", "Falsos positivos"),
          choiceField("varredura", "Varredura", [
            "organizada",
            "aleatória",
            "NA",
          ]),
        ],
        interpretation: [
          "Varredura organizada ou aleatória descreve a estratégia visível; omissões e falsos positivos permanecem medidas brutas desta grade.",
        ],
        childVisual: {
          title: "Marque somente círculos com ponto",
          subtitle: "60 segundos",
          items: [
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
          ],
        },
      },
      {
        id: "d-inibicao",
        title: "Inibição verbal",
        start: "5:15",
        end: "6:45",
        say: [
          "Quando eu disser DIA, responda NOITE. Quando eu disser NOITE, responda DIA.",
        ],
        doSteps: [
          "Aplique 12 itens em ritmo regular.",
          "Não corrija durante a sequência.",
        ],
        materials: ["estímulos DIA/NOITE"],
        observe: ["acertos", "erros impulsivos", "autocorreções", "latência"],
        fields: [
          countField("acertos", "Acertos", 12),
          countField("erros", "Erros impulsivos", 12),
          countField("autocorrecoes", "Autocorreções"),
          choiceField("latencia", "Latência", ["estável", "variável", "NA"]),
        ],
        interpretation: [
          "Erro impulsivo aqui significa resposta automática antes de aplicar a regra oposta; não equivale por si só a impulsividade clínica.",
        ],
        childVisual: {
          title: "Responda o contrário",
          items: [
            "DIA",
            "NOITE",
            "DIA",
            "DIA",
            "NOITE",
            "NOITE",
            "DIA",
            "NOITE",
          ],
        },
      },
      {
        id: "d-flexibilidade",
        title: "Flexibilidade",
        start: "6:45",
        end: "8:00",
        say: ["Agora mudou: DIA = SOL; NOITE = LUA."],
        doSteps: ["Aplique 8 itens com a nova regra."],
        materials: ["estímulos DIA/NOITE"],
        observe: ["acertos", "perseverações", "velocidade de adaptação"],
        fields: [
          countField("acertos", "Acertos", 8),
          countField("perseveracoes", "Perseverações", 8),
          choiceField("adaptacao", "Adaptação", [
            "rápida",
            "gradual",
            "não ocorreu",
            "NA",
          ]),
        ],
        interpretation: [
          "Adaptação descreve o comportamento após a troca; não há ponto de corte para rápida/gradual nesta prova piloto.",
        ],
      },
      {
        id: "d-planejamento",
        title: "Planejamento + imprevisto",
        start: "8:00",
        end: "10:00",
        say: [
          "Organize esta rotina antes de sair às 7h30.",
          "O material ainda não está pronto. O que muda?",
        ],
        doSteps: [
          "Apresente cartões com uma rotina.",
          "Depois introduza o imprevisto.",
        ],
        materials: ["cartões de rotina"],
        observe: [
          "priorização",
          "sequência",
          "flexibilidade diante do imprevisto",
        ],
        fields: [
          choiceField("prioriza", "Prioriza", ["sim", "não", "NA"]),
          choiceField("sequencia", "Sequência", ["coerente", "parcial", "NA"]),
          choiceField("flexibiliza", "Flexibiliza após imprevisto", [
            "sim",
            "não",
            "NA",
          ]),
        ],
        interpretation: [
          "Planejamento e replanejamento são registrados como respostas à situação proposta; o produto não estima função executiva por norma.",
        ],
      },
    ],
  },
  {
    id: "12-17a",
    label: "12–17 anos",
    minMonths: 144,
    maxMonths: 215,
    icon: "✨",
    subtitle:
      "Narrativa, cognição social, atenção seletiva, memória operacional e planejamento executivo",
    materials: [
      "cenário de mensagem visualizada",
      "grade autoral de símbolos/letras",
      "listas de 3–5 palavras",
      "estímulos DIREITA/ESQUERDA",
      "cartões de tarefas para planejamento",
    ],
    missions: [
      {
        id: "e-rotina",
        title: "Narrativa da rotina",
        start: "0:00",
        end: "1:00",
        say: ["Me conta como está sendo sua rotina ultimamente."],
        doSteps: [
          "Deixe o adolescente organizar o relato antes de fazer perguntas adicionais.",
        ],
        materials: ["nenhum"],
        observe: ["organização", "espontaneidade", "reciprocidade"],
        fields: [
          choiceField("organizacao", "Organização", [
            "boa",
            "parcial",
            "baixa",
            "NA",
          ]),
          choiceField("espontaneidade", "Espontaneidade", [
            "boa",
            "baixa",
            "NA",
          ]),
          choiceField("reciprocidade", "Reciprocidade", [
            "boa",
            "limitada",
            "NA",
          ]),
        ],
        interpretation: [
          "Descreva a forma do relato e considere vínculo, ansiedade e disposição para falar como possíveis interferentes.",
        ],
      },
      {
        id: "e-social",
        title: "Cognição social + flexibilidade",
        start: "1:00",
        end: "2:30",
        say: [
          "Uma mensagem foi visualizada e não teve resposta. Que explicações existem?",
          "Qual seria a pior reação?",
          "Qual seria uma resposta mais adequada?",
        ],
        doSteps: [
          "Apresente o cenário sem sugerir motivo para a falta de resposta.",
        ],
        materials: ["cenário de mensagem visualizada"],
        observe: [
          "número de hipóteses",
          "considera alternativas",
          "resposta impulsiva/rígida",
        ],
        fields: [
          countField("hipoteses", "Hipóteses levantadas"),
          choiceField("alternativas", "Considera alternativas", [
            "sim",
            "não",
            "NA",
          ]),
          choiceField("rigida", "Resposta impulsiva/rígida", [
            "sim",
            "não",
            "NA",
          ]),
        ],
        interpretation: [
          "Gerar múltiplas hipóteses descreve flexibilidade de explicações nesta situação social; uma resposta rígida isolada não fecha diagnóstico.",
        ],
        childVisual: {
          title: "Mensagem visualizada · sem resposta",
          subtitle: "Pense em mais de uma explicação possível",
          items: ["📱", "✓✓", "…", "🤔"],
        },
      },
      {
        id: "e-atencao",
        title: "Atenção seletiva",
        start: "2:30",
        end: "4:00",
        say: ["Durante 60 segundos, marque apenas os alvos definidos."],
        doSteps: [
          "Apresente a grade autoral de símbolos/letras.",
          "Defina claramente o alvo antes de iniciar.",
        ],
        materials: ["grade autoral de símbolos/letras"],
        observe: ["alvos", "omissões", "comissões", "estratégia"],
        fields: [
          countField("alvos", "Alvos"),
          countField("omissoes", "Omissões"),
          countField("comissoes", "Comissões"),
          choiceField("estrategia", "Estratégia", [
            "organizada",
            "aleatória",
            "NA",
          ]),
        ],
        interpretation: [
          "Omissões e comissões são descritas separadamente; estratégia organizada/aleatória é observacional e não normativa.",
        ],
        childVisual: {
          title: "Marque somente: ★A",
          subtitle: "60 segundos",
          items: [
            "★A",
            "B",
            "★A",
            "△",
            "C",
            "★A",
            "□",
            "D",
            "★A",
            "○",
            "E",
            "★A",
          ],
        },
      },
      {
        id: "e-memoria",
        title: "Memória operacional verbal",
        start: "4:00",
        end: "5:30",
        say: ["Vou falar palavras. Repita em ordem inversa."],
        doSteps: [
          "Use sequências de 3 a 5 palavras.",
          "Pare após dificuldade consistente.",
        ],
        materials: ["listas de 3–5 palavras"],
        observe: [
          "desempenho em 3, 4 e 5 itens",
          "estratégia verbal espontânea",
        ],
        fields: [
          countField("tres", "3 itens: corretos", 3),
          countField("quatro", "4 itens: corretos", 4),
          countField("cinco", "5 itens: corretos", 5),
          choiceField("estrategia", "Estratégia verbal espontânea", [
            "sim",
            "não",
            "NA",
          ]),
        ],
        interpretation: [
          "Registre até onde a sequência foi manipulada nesta tarefa; não use o número como índice padronizado.",
        ],
      },
      {
        id: "e-inibicao",
        title: "Inibição",
        start: "5:30",
        end: "7:00",
        say: ["DIREITA → responda ESQUERDA. ESQUERDA → responda DIREITA."],
        doSteps: [
          "Aplique 12 itens rápidos.",
          "Não corrija cada resposta durante a sequência.",
        ],
        materials: ["estímulos DIREITA/ESQUERDA"],
        observe: [
          "acertos",
          "erros",
          "autocorreções",
          "impulsividade observável na tarefa",
        ],
        fields: [
          countField("acertos", "Acertos", 12),
          countField("erros", "Erros", 12),
          countField("autocorrecoes", "Autocorreções"),
          choiceField("impulsividade", "Resposta impulsiva observável", [
            "sim",
            "não",
            "NA",
          ]),
        ],
        interpretation: [
          "Resposta impulsiva observável é rótulo descritivo da forma de responder nesta tarefa; não equivale a diagnóstico de TDAH.",
        ],
        childVisual: {
          title: "Responda o lado contrário",
          items: [
            "DIREITA",
            "ESQUERDA",
            "DIREITA",
            "DIREITA",
            "ESQUERDA",
            "ESQUERDA",
          ],
        },
      },
      {
        id: "e-troca",
        title: "Troca de regra",
        start: "7:00",
        end: "8:15",
        say: ["Agora DIREITA continua DIREITA e ESQUERDA continua ESQUERDA."],
        doSteps: ["Aplique 8 itens com a regra nova."],
        materials: ["estímulos DIREITA/ESQUERDA"],
        observe: ["acertos", "perseverações", "adaptação"],
        fields: [
          countField("acertos", "Acertos", 8),
          countField("perseveracoes", "Perseverações", 8),
          choiceField("adaptacao", "Adaptação", [
            "rápida",
            "gradual",
            "não ocorreu",
            "NA",
          ]),
        ],
        interpretation: [
          "Perseveração descreve manutenção da regra oposta anterior; adaptação é registrada sem corte normativo.",
        ],
      },
      {
        id: "e-planejamento",
        title: "Planejamento executivo",
        start: "8:15",
        end: "10:00",
        say: [
          "Organize uma noite com prova, trabalho, banho, jantar e 30 minutos livres.",
          "Agora acrescente 1 hora ao trabalho. O que muda?",
        ],
        doSteps: [
          "Apresente as demandas juntas.",
          "Depois introduza a mudança de duração do trabalho.",
        ],
        materials: ["cartões de tarefas para planejamento"],
        observe: ["priorização", "estimativa de tempo", "replanejamento"],
        fields: [
          choiceField("prioriza", "Prioriza", ["sim", "não", "NA"]),
          choiceField("estima", "Estima tempo", ["sim", "não", "NA"]),
          choiceField("replaneja", "Replaneja", [
            "sim",
            "parcial",
            "não",
            "NA",
          ]),
        ],
        interpretation: [
          "O foco é se e como o adolescente reorganiza o plano quando a restrição muda; não há classificação normativa automática.",
        ],
      },
    ],
  },
];
