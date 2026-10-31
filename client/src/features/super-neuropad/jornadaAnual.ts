/**
 * Camada narrativa opcional: uma jornada própria para cada idade (2–17).
 * Não acrescenta testes, estímulos, dicas de resposta, regras de acerto,
 * pontuação, critérios normativos nem altera o banco da bateria principal.
 * Textos de missão são exibidos à aplicadora antes do mundo, nunca no lugar
 * do comando padronizado do item. Assentimento, recusa e pausas são respeitados.
 */
import type { PhaseId } from "./bank";

export type JornadaAnual = Readonly<{
  idade: number;
  titulo: string;
  convite: string;
  apoio: string;
  pausa: string;
  fecho: string;
  mundos: Readonly<Record<PhaseId, string>>;
}>;

export const JORNADAS_ANUAIS = [
  {
    "idade": 2,
    "titulo": "Pequenas descobertas",
    "convite": "Vamos brincar um pouquinho, uma surpresa de cada vez.",
    "apoio": "Mostre a tela com calma; aceite apontar, olhar ou gesticular. Cuidador pode ficar perto.",
    "pausa": "Faça pausas frequentes; não insista se houver desconforto.",
    "fecho": "Obrigado por brincar comigo!",
    "mundos": {
      "vila": "Vamos conhecer o lugar, sem pressa.",
      "olhos": "Vamos olhar juntos, do seu jeito.",
      "palavras": "Agora é hora de brincar com os sons.",
      "numeros": "Vamos conhecer outra parte da aventura.",
      "memoria": "Uma surpresa pequena vem aí.",
      "corpo": "Vamos nos movimentar como for confortável."
    }
  },
  {
    "idade": 3,
    "titulo": "Brincadeira que ganha vida",
    "convite": "Que tal descobrir o que acontece nessa história?",
    "apoio": "Use frases curtas e demonstração antes de começar; aceite gestos e participação do cuidador.",
    "pausa": "Uma pausa breve entre mundos pode ajudar; encerre à recusa.",
    "fecho": "Que bom compartilhar esta brincadeira!",
    "mundos": {
      "vila": "A história começa com uma brincadeira.",
      "olhos": "Nosso personagem quer explorar a paisagem.",
      "palavras": "Vamos conversar com a aventura.",
      "numeros": "O próximo lugar guarda uma surpresa.",
      "memoria": "Agora tem uma brincadeira de lembrar.",
      "corpo": "Vamos experimentar um faz de conta."
    }
  },
  {
    "idade": 4,
    "titulo": "Aventura dos personagens",
    "convite": "Você escolhe como vamos explorar esta aventura.",
    "apoio": "Apresente uma instrução por vez; não exija leitura e aceite comunicação alternativa.",
    "pausa": "Ofereça descanso entre mundos sem penalidade.",
    "fecho": "Adorei conhecer suas ideias!",
    "mundos": {
      "vila": "Os personagens chegaram ao primeiro lugar.",
      "olhos": "Uma nova cena apareceu para explorar.",
      "palavras": "A história continua com outras falas.",
      "numeros": "Chegou uma parte diferente do caminho.",
      "memoria": "Vamos acompanhar o que acontece depois.",
      "corpo": "O personagem vai explorar os movimentos."
    }
  },
  {
    "idade": 5,
    "titulo": "Guardiões da história",
    "convite": "Vamos passar por seis partes de uma história que você ajuda a contar.",
    "apoio": "Use pistas visuais apenas para explicar a regra, sem indicar a resposta.",
    "pausa": "Combine intervalos curtos; não acelere para concluir.",
    "fecho": "Sua participação fez parte da história!",
    "mundos": {
      "vila": "O começo da história está aqui.",
      "olhos": "Vamos explorar outra cena.",
      "palavras": "Agora a história tem vozes e palavras.",
      "numeros": "Seguimos para um desafio diferente.",
      "memoria": "O caminho pede atenção ao que acontece.",
      "corpo": "Chegamos ao capítulo dos movimentos."
    }
  },
  {
    "idade": 6,
    "titulo": "Exploradores da escola",
    "convite": "Cada lugar tem uma missão; você pode pedir ajuda.",
    "apoio": "Leia os comandos quando necessário; não presuma alfabetização.",
    "pausa": "Pausas são permitidas sem perda de pontos de registro.",
    "fecho": "Você participou do percurso inteiro no seu ritmo!",
    "mundos": {
      "vila": "A equipe se reúne para começar.",
      "olhos": "Vamos investigar o que aparece.",
      "palavras": "Agora entram as mensagens da missão.",
      "numeros": "Chegamos a um lugar com novos desafios.",
      "memoria": "Esta parte pede observar a sequência.",
      "corpo": "O percurso termina com movimento seguro."
    }
  },
  {
    "idade": 7,
    "titulo": "Detetives do cotidiano",
    "convite": "Vamos explorar pistas de uma aventura do dia a dia.",
    "apoio": "Fale em linguagem concreta; deixe claro que pode pedir repetição nos limites da tarefa.",
    "pausa": "Intervalos curtos e sem pressão de tempo.",
    "fecho": "Gostei de investigar este caminho com você!",
    "mundos": {
      "vila": "O detetive começa seu percurso.",
      "olhos": "Uma nova pista aparece no cenário.",
      "palavras": "Vamos investigar as mensagens.",
      "numeros": "A próxima área tem um desafio diferente.",
      "memoria": "Chegou a hora de acompanhar os acontecimentos.",
      "corpo": "A última pista envolve o corpo em ação."
    }
  },
  {
    "idade": 8,
    "titulo": "Expedição de ideias",
    "convite": "Você escolhe seu herói para explorar seis etapas.",
    "apoio": "Apresente o objetivo sem antecipar o resultado ou dar dicas de acerto.",
    "pausa": "Faça um intervalo quando a criança solicitar.",
    "fecho": "Sua estratégia teve espaço nesta aventura!",
    "mundos": {
      "vila": "Vamos iniciar a expedição.",
      "olhos": "O mapa revela uma área para explorar.",
      "palavras": "Nesta área, vamos ouvir e conversar.",
      "numeros": "Agora a expedição muda de cenário.",
      "memoria": "A equipe acompanha outra sequência.",
      "corpo": "A expedição termina com ações seguras."
    }
  },
  {
    "idade": 9,
    "titulo": "Mapa de caminhos",
    "convite": "Vamos descobrir seis lugares e escolher como avançar.",
    "apoio": "Permita que explique suas escolhas; não transforme a justificativa em nota extra.",
    "pausa": "A velocidade da passagem entre lugares é livre.",
    "fecho": "Obrigado por construir seu próprio caminho!",
    "mundos": {
      "vila": "O mapa está aberto para começar.",
      "olhos": "Vamos observar outro trecho do mapa.",
      "palavras": "Agora o caminho tem comunicação.",
      "numeros": "É hora de explorar uma nova área.",
      "memoria": "Vamos acompanhar o percurso da memória.",
      "corpo": "Chegamos à etapa de movimento."
    }
  },
  {
    "idade": 10,
    "titulo": "Missão planejamento",
    "convite": "Vamos organizar nossa viagem por seis etapas.",
    "apoio": "Leia apenas o comando previsto; não ensine estratégias durante o registro.",
    "pausa": "Ofereça intervalo sem comparar com outras crianças.",
    "fecho": "Mais uma etapa registrada na nossa viagem!",
    "mundos": {
      "vila": "O ponto de partida está definido.",
      "olhos": "Vamos explorar o próximo ambiente.",
      "palavras": "Agora a missão envolve comunicação.",
      "numeros": "Surge uma nova tarefa na sequência.",
      "memoria": "A viagem continua com atenção e lembrança.",
      "corpo": "Vamos terminar com movimento e conforto."
    }
  },
  {
    "idade": 11,
    "titulo": "Investigadores de estratégias",
    "convite": "Vamos explorar desafios diferentes e descobrir maneiras de participar.",
    "apoio": "Pergunte se prefere receber a instrução oralmente; preserve exatamente o comando do item.",
    "pausa": "Respeite o tempo de elaboração e a decisão de pausar.",
    "fecho": "Obrigado por participar e compartilhar seu jeito de pensar!",
    "mundos": {
      "vila": "A investigação começa por aqui.",
      "olhos": "Vamos examinar outro cenário.",
      "palavras": "Agora surgem questões de linguagem.",
      "numeros": "O próximo desafio muda o contexto.",
      "memoria": "Vamos acompanhar uma sequência de informações.",
      "corpo": "A última parte envolve ações no espaço."
    }
  },
  {
    "idade": 12,
    "titulo": "Laboratório de escolhas",
    "convite": "Você pode escolher como participar de cada etapa.",
    "apoio": "Ofereça autonomia na escolha do personagem; verifique compreensão sem induzir respostas.",
    "pausa": "Permita intervalo e respeite privacidade.",
    "fecho": "Sua participação ficou registrada, sem nota sobre você.",
    "mundos": {
      "vila": "Vamos iniciar nosso percurso.",
      "olhos": "Esta etapa convida a observar.",
      "palavras": "Agora entramos em uma situação de comunicação.",
      "numeros": "O cenário muda para uma tarefa distinta.",
      "memoria": "Seguimos para outra sequência.",
      "corpo": "Encerramos a rodada com movimentos seguros."
    }
  },
  {
    "idade": 13,
    "titulo": "Percurso de estratégias",
    "convite": "São seis etapas curtas. Você pode participar no seu ritmo.",
    "apoio": "Use linguagem de adolescente e ofereça os apoios necessários sem infantilizar.",
    "pausa": "Explique que pode pausar ou recusar sem julgamento.",
    "fecho": "Obrigado por participar; suas respostas não definem quem você é.",
    "mundos": {
      "vila": "Começamos com uma etapa de aproximação.",
      "olhos": "Agora o foco é observar a situação.",
      "palavras": "Esta etapa envolve comunicação.",
      "numeros": "O percurso segue para outra tarefa.",
      "memoria": "É hora de trabalhar com informações.",
      "corpo": "A última etapa inclui ação e movimento."
    }
  },
  {
    "idade": 14,
    "titulo": "Projetos e possibilidades",
    "convite": "Você escolhe o personagem e participa de um percurso de seis etapas.",
    "apoio": "Explique o propósito de registrar observações, não medir valor pessoal.",
    "pausa": "Respeite escolha, privacidade e intervalos.",
    "fecho": "Participação concluída; nenhuma resposta vira diagnóstico.",
    "mundos": {
      "vila": "Vamos iniciar o projeto.",
      "olhos": "Seguimos para uma etapa de observação.",
      "palavras": "Agora exploramos uma forma de comunicação.",
      "numeros": "O projeto passa por um desafio diferente.",
      "memoria": "A etapa seguinte envolve organização de informações.",
      "corpo": "Encerramos com atividade segura."
    }
  },
  {
    "idade": 15,
    "titulo": "Desafios do cotidiano",
    "convite": "Vamos percorrer seis situações breves, sem competição.",
    "apoio": "Não use elogios de acerto/erro; combine com o adolescente a forma de apresentação.",
    "pausa": "Pausa e recusa são escolhas válidas e ficam registradas de forma neutra.",
    "fecho": "Obrigado pelo tempo dedicado a esta atividade.",
    "mundos": {
      "vila": "O percurso começa com uma situação cotidiana.",
      "olhos": "Agora mudamos o foco de observação.",
      "palavras": "Seguimos com uma atividade de comunicação.",
      "numeros": "Chegamos a uma nova situação.",
      "memoria": "Vamos explorar informações ao longo do tempo.",
      "corpo": "A etapa final envolve uma ação possível."
    }
  },
  {
    "idade": 16,
    "titulo": "Rotas e decisões",
    "convite": "Você pode participar de seis etapas e decidir quando precisa de pausa.",
    "apoio": "Pergunte a preferência de comunicação e respeite a autonomia progressiva.",
    "pausa": "Não exponha informação sensível; pausa e recusa não são derrota.",
    "fecho": "Registro encerrado; interpretação clínica é separada.",
    "mundos": {
      "vila": "Vamos abrir a primeira rota.",
      "olhos": "Outra rota começa com observação.",
      "palavras": "Esta etapa trabalha com comunicação.",
      "numeros": "Surge um contexto diferente para explorar.",
      "memoria": "A próxima etapa envolve organização de dados.",
      "corpo": "Finalizamos com uma atividade segura."
    }
  },
  {
    "idade": 17,
    "titulo": "Autonomia em percurso",
    "convite": "São seis etapas. Sua colaboração é voluntária, com espaço para dúvidas.",
    "apoio": "Convide a participação sem pressão, respeitando comunicação, assentimento e privacidade.",
    "pausa": "Interrompa quando solicitado; nenhuma recompensa depende de resposta correta.",
    "fecho": "Obrigado por colaborar com este registro observacional.",
    "mundos": {
      "vila": "Começamos com o contexto da atividade.",
      "olhos": "Esta etapa explora uma situação visual.",
      "palavras": "Agora seguimos para comunicação.",
      "numeros": "O percurso muda para outro contexto.",
      "memoria": "A penúltima etapa envolve informações e lembrança.",
      "corpo": "A última etapa é uma atividade de movimento seguro."
    }
  }
] as const satisfies readonly JornadaAnual[];

/** Sem aproximação de idade: o ano precisa ter uma jornada própria. */
export function jornadaAnual(idade: number): JornadaAnual | undefined {
  if (!Number.isInteger(idade) || idade < 2 || idade > 17) return undefined;
  return JORNADAS_ANUAIS.find((jornada) => jornada.idade === idade);
}
