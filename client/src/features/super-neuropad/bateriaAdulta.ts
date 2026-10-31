/**
 * Bateria adulta do Super NeuroPad — 18 anos ou mais, sem limite máximo.
 *
 * RASCUNHO NÃO HOMOLOGADO. `BATERIA_ADULTA_HOMOLOGADA` é `false`: nenhuma partida, pontuação
 * ou resultado adulto é gerado até a revisão clínica aprovar o conteúdo.
 *
 * Regras de construção:
 * - Não importa banco, missões, perfis anuais nem critérios da bateria de 2 a 17 anos.
 * - Mantém os seis mundos do jogo (mesmas chaves e ordem), com situações cotidianas: convivência,
 *   atenção, compreensão, planejamento, memória e autonomia prática.
 * - Cada tarefa descreve o que a pessoa faz. As observações registram o comportamento visto;
 *   não há acerto, escore, percentil, norma ou classificação. Quem interpreta é o profissional.
 * - Minutos são estimativas. Duração da sessão e número de tarefas por mundo dependem da homologação.
 */

export const ADULTO_IDADE_MINIMA = 18;
export const BATERIA_ADULTA_HOMOLOGADA: boolean = false;

export type MundoAdultoId = "vila" | "olhos" | "palavras" | "numeros" | "memoria" | "corpo";

export interface TarefaAdulta {
  /** Identificador único na bateria adulta. */
  id: string;
  /** Convite em linguagem adulta, dito ou lido para a pessoa. */
  fala: string;
  material: string;
  minutos: number;
  passos: readonly string[];
  /** Comportamentos observáveis que o profissional pode registrar. */
  observacoes: readonly string[];
}

export interface MundoAdulto {
  id: MundoAdultoId;
  nome: string;
  tema: string;
  tarefas: readonly TarefaAdulta[];
}

export const MUNDOS_ADULTOS: readonly MundoAdulto[] = [
  {
    id: "vila",
    nome: "Vila da Convivência",
    tema: "Comunicação e convivência no dia a dia",
    tarefas: [
      {
        id: "vila-combinar-encontro",
        fala: "Você quer combinar um encontro com um amigo por mensagem. Escreva ou diga, do começo ao fim, como faria.",
        material: "Celular ou papel e caneta",
        minutos: 4,
        passos: ["Peça para combinar dia, horário e local com alguém que não está presente.", "Informe um imprevisto e peça para ajustar o combinado.", "Observe se a pessoa confirma os detalhes e se considera o que o outro pode fazer."],
        observacoes: ["Descreve dia, horário e local", "Confirma os detalhes", "Ajusta o combinado após o imprevisto", "Pede confirmação quando há dúvida", "Precisa de apoio para organizar a mensagem"],
      },
      {
        id: "vila-pedir-ajuda",
        fala: "Você precisa da ajuda de um colega para terminar uma tarefa do trabalho. Como você pede?",
        material: "Nenhum",
        minutos: 3,
        passos: ["Peça que explique como faria o pedido, com as próprias palavras.", "Mude a situação para um pedido de troca de horário e peça nova resposta.", "Observe se a pessoa explica o motivo, oferece alternativa e agradece."],
        observacoes: ["Explica o motivo do pedido", "Oferece alternativa", "Agradece", "Pede de forma direta demais", "Evita pedir ajuda"],
      },
      {
        id: "vila-desacordo",
        fala: "Um vizinho reclama do barulho da sua festa de sábado. O que você responde?",
        material: "Nenhum",
        minutos: 4,
        passos: ["Peça que responda em voz alta, como numa conversa real.", "Apresente uma segunda reação do vizinho, mais irritada.", "Observe se a pessoa reconhece o ponto do outro, propõe solução e mantém o tom."],
        observacoes: ["Reconhece o ponto do outro", "Propõe uma solução", "Responde na defensiva", "Muda de assunto", "Mantém o tom diante da segunda reação"],
      },
      {
        id: "vila-recusar-convite",
        fala: "Um colega convida você para um compromisso num dia em que você não pode. Como responde?",
        material: "Nenhum",
        minutos: 3,
        passos: ["Peça a resposta com as próprias palavras.", "Se a pessoa preferir, peça uma recusa sem justificativa longa.", "Observe se a recusa é clara e cordial e se a pessoa sugere outra data."],
        observacoes: ["Recusa com clareza", "Mantém o tom cordial", "Sugere outra data", "Justifica em excesso", "Precisa de um modelo para responder"],
      },
    ],
  },
  {
    id: "olhos",
    nome: "Mirante da Atenção",
    tema: "Atenção e troca de foco na rotina",
    tarefas: [
      {
        id: "olhos-lista-de-compras",
        fala: "Confira esta lista de compras com as prateleiras da figura e marque o que encontrar.",
        material: "Lista de 8 itens e uma cena de mercado com 15 produtos fictícios, na tela ou impressa",
        minutos: 4,
        passos: ["Mostre a lista e a cena ao mesmo tempo.", "Peça que localize os itens na ordem da lista.", "Acrescente à cena um item parecido com outro da lista e observe a busca."],
        observacoes: ["Localiza os itens na ordem da lista", "Distrai-se com itens parecidos", "Confere a lista ao final", "Pede que a lista seja repetida", "Desiste antes de terminar"],
      },
      {
        id: "olhos-texto-e-fala",
        fala: "Vou ler uma mensagem em voz alta. Acompanhe o texto na tela e me avise quando eu trocar uma palavra.",
        material: "Texto curto de 5 linhas na tela, com uma palavra trocada pelo profissional durante a leitura",
        minutos: 3,
        passos: ["Leia o texto em voz alta enquanto a pessoa acompanha na tela.", "Troque uma palavra sem aviso e observe se a pessoa percebe.", "Interrompa a leitura e peça que retome do ponto em que parou."],
        observacoes: ["Acompanha o texto e a fala ao mesmo tempo", "Percebe a mudança", "Retoma após a interrupção", "Perde o ponto da leitura", "Pede para repetir"],
      },
      {
        id: "olhos-troca-de-foco",
        fala: "Enquanto organiza a agenda da semana, responda à pergunta que eu fizer e depois volte para a agenda.",
        material: "Agenda simples de três dias, em papel ou na tela",
        minutos: 4,
        passos: ["Peça que preencha a agenda de três dias.", "Interrompa com uma pergunta curta sobre outro assunto.", "Observe se a pessoa volta à agenda do ponto em que parou."],
        observacoes: ["Volta ao ponto em que parou", "Responde à interrupção sem perder o assunto", "Perde o fio da tarefa", "Pede que a pergunta seja repetida", "Retoma com ajuda"],
      },
      {
        id: "olhos-prioridades-visuais",
        fala: "Veja estes quatro cartões de tarefas e coloque em ordem, da mais urgente para a menos urgente.",
        material: "Quatro cartões com tarefas do dia a dia, fictícias",
        minutos: 3,
        passos: ["Apresente os quatro cartões embaralhados.", "Peça a ordem de prioridade.", "Mude o prazo de um cartão e peça que reorganize."],
        observacoes: ["Ordena por prioridade", "Reorganiza após a mudança", "Explica a nova ordem", "Mantém a ordem anterior sem revisar", "Precisa de apoio para priorizar"],
      },
    ],
  },
  {
    id: "palavras",
    nome: "Ilha da Compreensão",
    tema: "Compreensão de instruções, recados e textos",
    tarefas: [
      {
        id: "palavras-instrucoes-em-sequencia",
        fala: "Ouça com atenção: separe a conta de luz, anote o valor no caderno e guarde o comprovante. Faça na ordem que eu disse.",
        material: "Caderno, caneta e um comprovante fictício",
        minutos: 3,
        passos: ["Diga as três instruções uma única vez, em ritmo de conversa.", "Peça que repita com as próprias palavras antes de começar.", "Observe a ordem usada e se a pessoa pede repetição de alguma instrução."],
        observacoes: ["Repete com as próprias palavras", "Mantém a ordem pedida", "Pede repetição de uma instrução", "Troca a ordem", "Executa sem pedir esclarecimento"],
      },
      {
        id: "palavras-recado-de-voz",
        fala: "Ouça este recado de um colega e diga o que ele pede e até quando.",
        material: "Recado em áudio de cerca de 40 segundos, com um pedido e um prazo, fictício",
        minutos: 3,
        passos: ["Reproduza o recado uma única vez.", "Pergunte o que a pessoa entendeu, sem sugerir a resposta.", "Pergunte qual detalhe ela considera mais importante e por quê."],
        observacoes: ["Identifica o pedido", "Identifica o prazo", "Confunde detalhes", "Pede esclarecimento", "Resume o conteúdo principal"],
      },
      {
        id: "palavras-ideia-principal",
        fala: "Leia este aviso de condomínio e diga, com as suas palavras, qual é o assunto principal.",
        material: "Texto fictício de 5 linhas, na tela ou impresso",
        minutos: 4,
        passos: ["Peça que leia em silêncio ou em voz alta.", "Pergunte o assunto principal, sem indicar a resposta.", "Pergunte um detalhe específico e observe se a pessoa o localiza no texto."],
        observacoes: ["Nomeia o assunto principal", "Localiza o detalhe no texto", "Acrescenta informação que não está no texto", "Pede para reler", "Mistura assuntos"],
      },
      {
        id: "palavras-sentido-no-contexto",
        fala: "Leia estas duas frases e explique o que a palavra 'prazo' quer dizer em cada uma.",
        material: "Duas frases fictícias em que a mesma palavra muda de sentido",
        minutos: 3,
        passos: ["Apresente as duas frases.", "Peça que explique o sentido da palavra em cada uma.", "Observe se a pessoa usa o contexto ou pede outra explicação."],
        observacoes: ["Usa o contexto da frase", "Explica os dois sentidos", "Dá um só sentido para as duas", "Pede uma definição", "Precisa de um exemplo"],
      },
    ],
  },
  {
    id: "numeros",
    nome: "Ateliê do Planejamento",
    tema: "Planejamento, tempo e números do cotidiano",
    tarefas: [
      {
        id: "numeros-orcamento-da-semana",
        fala: "Você tem R$ 200 para a semana e quatro gastos previstos. Organize o que pagar primeiro e diga quanto sobra.",
        material: "Lista com quatro gastos fictícios, com valor e prazo; papel e caneta ou calculadora",
        minutos: 4,
        passos: ["Apresente os quatro gastos com valores e prazos.", "Peça que ordene por prazo e prioridade e calcule o saldo.", "Mude um valor e peça que refaça o plano."],
        observacoes: ["Ordena por prazo e prioridade", "Calcula o saldo", "Refaz o plano após a mudança", "Precisa de calculadora", "Confunde valores"],
      },
      {
        id: "numeros-troco",
        fala: "Uma conta de R$ 47 será paga com uma nota de R$ 100. Quanto você recebe de troco e como chegou a esse valor?",
        material: "Papel e caneta, se a pessoa quiser",
        minutos: 2,
        passos: ["Peça que diga o troco em voz alta.", "Peça que explique o passo a passo do cálculo.", "Observe se a pessoa confere o resultado antes de responder."],
        observacoes: ["Explica o cálculo", "Confere o resultado", "Usa a estratégia de completar até o valor", "Precisa de papel", "Pede para repetir os valores"],
      },
      {
        id: "numeros-agenda-da-semana",
        fala: "Distribua estas quatro tarefas em três dias da semana, respeitando o prazo de quinta-feira.",
        material: "Quatro tarefas fictícias com duração estimada e uma folha com três dias",
        minutos: 4,
        passos: ["Apresente as quatro tarefas com duração e prazo.", "Peça que monte a agenda dia a dia.", "Acrescente um compromisso fixo e peça que ajuste a agenda."],
        observacoes: ["Distribui por dia e duração", "Respeita o prazo", "Ajusta após o compromisso fixo", "Deixa tarefas sem dia", "Precisa de apoio para estimar a duração"],
      },
      {
        id: "numeros-prioridades-do-dia",
        fala: "Liste as cinco coisas mais importantes do seu dia e diga por que escolheu a primeira.",
        material: "Papel ou tela",
        minutos: 3,
        passos: ["Peça a lista sem interferir.", "Pergunte por que escolheu essa ordem.", "Pergunte o que faria se a primeira não fosse possível."],
        observacoes: ["Justifica a ordem", "Prevê uma alternativa", "Organiza a lista por critério", "Lista sem critério aparente", "Tem dificuldade para decidir"],
      },
    ],
  },
  {
    id: "memoria",
    nome: "Arquivo da Memória",
    tema: "Memória de trabalho e lembranças do cotidiano",
    tarefas: [
      {
        id: "memoria-lista-de-cabeca",
        fala: "Vou dizer seis itens de compra. Guarde-os e, daqui a pouco, me diga quais são.",
        material: "Nenhum",
        minutos: 4,
        passos: ["Diga os seis itens em ritmo de conversa, sem apoio visual.", "Converse por alguns minutos sobre outro assunto.", "Peça a lista e observe se a pessoa usa alguma estratégia."],
        observacoes: ["Lembra sem pista", "Lembra com pista", "Agrupa por categoria", "Esquece itens", "Usa repetição mental"],
      },
      {
        id: "memoria-combinado-do-inicio",
        fala: "No começo desta conversa combinamos algo. Você lembra o que foi e quando seria?",
        material: "Nenhum",
        minutos: 3,
        passos: ["Combine no início um detalhe simples, como dia e local.", "Retome outro assunto por alguns minutos.", "Pergunte o combinado sem pista e, se for preciso, com uma pista."],
        observacoes: ["Lembra sem pista", "Lembra com pista", "Lembra o local, mas não o dia", "Não lembra o combinado", "Pergunta para confirmar"],
      },
      {
        id: "memoria-sequencia-de-rotina",
        fala: "Veja estas quatro etapas de uma rotina de casa. Depois vou esconder a lista e você conta a ordem.",
        material: "Cartão com quatro etapas fictícias, como preparar, servir, lavar e guardar",
        minutos: 3,
        passos: ["Mostre a lista de etapas por alguns segundos.", "Esconda a lista e peça a ordem.", "Peça que diga o que vem antes e o que vem depois de uma etapa."],
        observacoes: ["Recupera a ordem", "Troca etapas de lugar", "Recupera com pista", "Pede nova exposição à lista"],
      },
      {
        id: "memoria-relato-do-dia",
        fala: "Conte o que você fez ontem, do começo do dia até a noite, com os detalhes que lembrar.",
        material: "Nenhum",
        minutos: 4,
        passos: ["Peça o relato espontâneo, sem interromper.", "Pergunte sobre um momento que ficou de fora, sem sugerir a resposta.", "Observe a sequência e a clareza do relato."],
        observacoes: ["Relata em sequência", "Inclui detalhes", "Pula etapas", "Precisa de perguntas para continuar", "Confunde a ordem dos dias"],
      },
    ],
  },
  {
    id: "corpo",
    nome: "Oficina da Autonomia",
    tema: "Autonomia prática, organização e tarefas do cotidiano",
    tarefas: [
      {
        id: "corpo-lanche-em-etapas",
        fala: "Você vai preparar um lanche simples. Diga as etapas, da primeira à última, e como faria cada uma.",
        material: "Objetos da mesa para mostrar, se a pessoa quiser",
        minutos: 3,
        passos: ["Peça que narre as etapas em ordem.", "Peça que mostre com os objetos da mesa, se preferir.", "Observe a sequência e se a pessoa pede ajuda em alguma etapa."],
        observacoes: ["Narra as etapas na ordem", "Mostra com os objetos", "Pede ajuda em alguma etapa", "Esquece uma etapa", "Organiza o espaço antes de começar"],
      },
      {
        id: "corpo-mochila-do-dia",
        fala: "Organize esta mochila para um dia com reunião de manhã e academia à tarde.",
        material: "Mochila e itens fictícios de peso leve, como caderno, garrafa, carregador e toalha",
        minutos: 4,
        passos: ["Peça que organize a mochila do jeito que preferir.", "Acrescente um item e peça que encaixe.", "Observe como separa os itens por uso e como pensa na ordem."],
        observacoes: ["Separa por uso", "Encaixa o item extra", "Esquece algum item", "Pergunta antes de começar", "Manuseia os itens com segurança"],
      },
      {
        id: "corpo-tarefas-manuais",
        fala: "Dobre esta peça de roupa e, quando terminar, passe para o próximo item sem deixar o primeiro pela metade.",
        material: "Peça de roupa e um item de mesa, como talheres",
        minutos: 3,
        passos: ["Peça que dobre a peça de roupa.", "Peça que, sem terminar a dobra, guarde os talheres e volte à dobra.", "Observe se faz a troca com fluidez e se usa as duas mãos."],
        observacoes: ["Troca de tarefa com fluidez", "Deixa a primeira tarefa pela metade", "Usa as duas mãos", "Usa uma mão só", "Pede ajuda para começar"],
      },
      {
        id: "corpo-compra-online",
        fala: "Monte um pedido de três itens em um aplicativo de mercado de exemplo, da busca até a confirmação.",
        material: "Tela com aplicativo de exemplo fictício, ou protótipo com as mesmas etapas",
        minutos: 4,
        passos: ["Peça que busque e escolha os três itens.", "Peça que revise o pedido antes de confirmar.", "Observe se conclui as etapas em ordem, se pede ajuda na tela e se revisa antes de confirmar."],
        observacoes: ["Conclui as etapas em ordem", "Revisa antes de confirmar", "Pede ajuda na tela", "Confirma sem revisar", "Abandona no meio"],
      },
    ],
  },
];

export const MENSAGEM_NAO_HOMOLOGADA = "A bateria adulta está em desenvolvimento e ainda não foi homologada. Nenhuma partida, pontuação ou resultado adulto é gerado.";

export type AcessoBateriaAdulta =
  | { ok: true }
  | { ok: false; motivo: "idade_invalida" | "menor_de_18" | "nao_homologada"; mensagem: string };

/** Barreira da bateria adulta: enquanto não homologada, nenhuma idade libera partida. */
export function acessoBateriaAdulta(anos: number): AcessoBateriaAdulta {
  if (!Number.isInteger(anos)) return { ok: false, motivo: "idade_invalida", mensagem: "Informe a idade em anos completos." };
  if (anos < ADULTO_IDADE_MINIMA) return { ok: false, motivo: "menor_de_18", mensagem: `A bateria adulta é para pessoas a partir de ${ADULTO_IDADE_MINIMA} anos.` };
  if (!BATERIA_ADULTA_HOMOLOGADA) return { ok: false, motivo: "nao_homologada", mensagem: MENSAGEM_NAO_HOMOLOGADA };
  return { ok: true };
}
