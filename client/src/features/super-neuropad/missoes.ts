/**
 * Missões guiadas da auxiliar, aplicadas antes da consulta. Cada missão é uma brincadeira curta:
 * `fala` é o convite para ler em voz alta, `material` diz o que separar, `passos` descrevem o que
 * fazer em linguagem simples e `pistas` são marcadores tocáveis do que foi visto. Sem termo técnico:
 * a auxiliar descreve o que viu, quem interpreta é o médico.
 *
 * Exame físico e entrevista reservada (fundo de olho, reflexos, sinais meníngeos, força graduada,
 * tônus, sensibilidade, perímetro cefálico, pensamento, insight e risco) não têm missão: ficam
 * listados como "reservados ao médico" e nunca viram obrigação da auxiliar.
 * Esta lista não pontua, não compara com norma e não conclui diagnóstico.
 */
export interface Missao {
  /** Convite em voz alta, na linguagem da criança. */
  fala: string;
  /** O que separar antes de começar. */
  material: string;
  /** Duração aproximada em minutos. */
  minutos: number;
  passos: readonly string[];
  pistas: readonly string[];
}

export const MISSOES: Readonly<Record<string, Missao>> = {
  rapport: {
    fala: "Oi! Hoje você é nosso convidado de honra. Pode escolher um brinquedo da mesa.",
    material: "Um brinquedo na mesa",
    minutos: 2,
    passos: ["Receba a criança com um brinquedo na mesa e chame pelo nome, em tom de conversa.", "Observe se ela olha, responde, se aproxima e como reage à sala e a você.", "Repare se fica sonolenta, agitada ou parada demais ao longo da visita."],
    pistas: ["Alerta e atenta", "Responde com demora", "Sonolenta", "Agitada ou inquieta", "Contato reduzido", "Procura o adulto"],
  },
  social2: {
    fala: "Vamos brincar de passar a bola? Agora é a sua vez!",
    material: "Uma bola ou um carrinho",
    minutos: 3,
    passos: ["Role a bola e espere a criança devolver, alternando as vezes.", "Mostre algo interessante e veja se ela olha para você e para o objeto.", "Faça um gesto simples, como tchau, e veja se ela imita."],
    pistas: ["Alterna as vezes", "Mostra algo ao adulto", "Imita gestos", "Divide a atenção com você", "Precisa de ajuda"],
  },
  language2: {
    fala: "Cadê a bola? Me mostra! Agora me conta o que é isto.",
    material: "3 brinquedos ou figuras de objetos conhecidos",
    minutos: 3,
    passos: ["Peça para apontar um objeto conhecido que você nomear.", "Peça uma ação simples, como pôr a bola no balde.", "Convide a criança a contar algo por fala, gesto ou figura."],
    pistas: ["Aponta o que é pedido", "Nomeia objetos", "Usa frases curtas", "Usa gestos ou apontar", "Usa figuras para se comunicar"],
  },
  language6: {
    fala: "Me conta uma aventura: o que você fez hoje, do começo ao fim?",
    material: "Nenhum",
    minutos: 4,
    passos: ["Peça para contar o que fez hoje, na ordem em que aconteceu.", "Dê uma missão de três passos, como pegar o lápis, desenhar uma bolinha e entregar.", "Converse sobre um assunto que a criança goste e veja se ela segue o tema e espera a vez de falar."],
    pistas: ["Conta em sequência", "Faz os três passos", "Fala com fluidez", "Troca palavras ou faz pausas longas", "Foge do assunto", "Precisa de ajuda para continuar"],
  },
  face: {
    fala: "Careta do dragão! Sorri bem grande, fecha os olhos com força e enche as bochechas.",
    material: "Nenhum",
    minutos: 2,
    passos: ["Peça sorriso grande, olhos bem fechados e bochechas cheias, fazendo junto com ela.", "Olhe o rosto de frente e veja se os dois lados se mexem igual.", "Observe também o rosto enquanto ela fala e brinca, sem estar pedindo nada."],
    pistas: ["Os dois lados se mexem igual", "Um lado parece mais fraco", "Fecha os dois olhos", "Não quis fazer", "Rosto expressivo ao brincar"],
  },
  hearing: {
    fala: "Escuta bem! Vou chamar você e você vira para mim. Depois repete uma palavra.",
    material: "Nenhum",
    minutos: 2,
    passos: ["Chame a criança por trás, sem ela ver, em voz de conversa e depois mais baixa.", "Veja se ela vira ou responde, e de que lado vira.", "Peça para repetir uma palavra simples e ouça a voz e a clareza da fala."],
    pistas: ["Vira ou responde ao chamado", "Responde só se for mais alto", "Vira sempre para o mesmo lado", "Voz clara", "Voz rouca ou fraca", "Fala difícil de entender"],
  },
  strength2: {
    fala: "Hora de ser super-herói! Levanta do chão sem se apoiar e empurra a caixa bem forte.",
    material: "Um brinquedo leve para empurrar e outro para pegar",
    minutos: 3,
    passos: ["Peça para sentar no chão e levantar sem se apoiar, com você por perto.", "Peça para empurrar e puxar um brinquedo e alcançar outro com cada mão, alternando.", "Peça para agachar e voltar a ficar em pé, e para manter os braços esticados à frente como uma estátua."],
    pistas: ["Levanta sem apoio", "Usa as duas mãos", "Usa uma mão mais que a outra", "Precisa de apoio", "Cansa rápido", "Um braço desce ou cai"],
  },
  reach2: {
    fala: "Pega a estrela! Agora com a outra mão.",
    material: "Um brinquedo atraente",
    minutos: 2,
    passos: ["Coloque o brinquedo em lugares diferentes à frente da criança.", "Peça para pegar com uma mão e depois com a outra.", "Veja se a mão chega no alvo, se treme ao se aproximar e qual mão ela escolhe sozinha."],
    pistas: ["Pega com precisão", "Erra o alvo", "Tremor ao se aproximar", "Prefere a mão direita", "Prefere a mão esquerda", "Pega e solta com facilidade"],
  },
  finger6: {
    fala: "Missão astronauta: toque o seu nariz e depois o meu dedo, cada vez mais rápido!",
    material: "Nenhum",
    minutos: 2,
    passos: ["Fique à frente da criança e mostre o dedo: ela toca o próprio nariz e depois o seu dedo.", "Repita mais rápido e depois com a outra mão.", "Veja se acerta o alvo, se a mão treme e se há diferença entre as mãos."],
    pistas: ["Acerta o alvo", "Erra o alvo", "Mão treme ao chegar", "Fica lento ou se atrapalha", "Prefere a mão direita", "Prefere a mão esquerda"],
  },
  stereognosis: {
    fala: "Caixa surpresa! Fecha os olhos e adivinha o que eu coloquei na sua mão.",
    material: "Objetos seguros e grandes (chave de brinquedo, colher, bola pequena de borracha)",
    minutos: 3,
    passos: ["Peça para fechar os olhos ou olhar para o lado e coloque um objeto familiar na mão.", "Peça para dizer ou mostrar o que é, e repita com a outra mão.", "Anote se acertou nas duas mãos, se precisou de dica ou se não quis."],
    pistas: ["Reconhece nas duas mãos", "Reconhece só em uma mão", "Precisou de dica", "Não reconheceu", "Não quis fazer"],
  },
  gait2: {
    fala: "Trilha dos animais! Anda até a porta como o bicho que você escolher.",
    material: "Espaço livre e seguro, duas marcas no chão",
    minutos: 3,
    passos: ["Peça para andar até a porta como um bicho da escolha dela, e depois correr um pouco.", "Peça para contornar duas marcas no chão e para ficar parada como estátua alguns segundos.", "Fique por perto para proteger e veja se tropeça, abre os braços ou precisa de apoio."],
    pistas: ["Anda com firmeza", "Cai ou tropeça", "Abre os braços para equilibrar", "Precisa de apoio", "Faz a curva com facilidade"],
  },
  gait6: {
    fala: "Ponte de equilíbrio! Anda na linha, pé na frente do outro, e depois fica parado como estátua.",
    material: "Uma linha no chão (fita)",
    minutos: 3,
    passos: ["Peça para andar na linha, um pé na frente do outro, e depois na ponta dos pés e nos calcanhares.", "Peça para ficar parado como estátua, pés juntos, de olhos abertos; se topar, repita de olhos fechados com você ao lado.", "Pare ao primeiro sinal de insegurança e anote o que aconteceu."],
    pistas: ["Anda firme na linha", "Desvia ou perde a linha", "Oscila parado", "Oscila mais de olhos fechados", "Precisa de apoio", "Não conseguiu nas pontas"],
  },
  involuntary: {
    fala: "Agora vamos brincar de estátua com os braços esticados e dedos abertos!",
    material: "Nenhum",
    minutos: 2,
    passos: ["Observe a criança sentada e brincando por alguns minutos, sem chamar atenção para isso.", "Peça para esticar os braços à frente com os dedos abertos por alguns segundos.", "Anote se viu algum movimento que ela não controla, onde aparece e se muda com a atenção."],
    pistas: ["Nenhum movimento visto", "Tremor nas mãos", "Piscadas, caretas ou sons repetidos", "Movimento em repouso", "Piora quando se concentra", "Some quando se distrai"],
  },
  praxis3: {
    fala: "Faz igual o espelho! Eu faço, você faz também.",
    material: "Nenhum",
    minutos: 2,
    passos: ["Faça um gesto simples, como acenar ou bater palmas, e peça para copiar.", "Repita com outro gesto, como tocar o nariz ou mostrar o polegar.", "Veja se copia com as duas mãos e se precisa que você mostre de novo."],
    pistas: ["Copia com as duas mãos", "Copia com uma mão só", "Precisa que mostre de novo", "Não entendeu o jogo", "Copia com esforço"],
  },
  praxis6: {
    fala: "Sequência secreta: faz os três gestos na mesma ordem que eu!",
    material: "Nenhum",
    minutos: 3,
    passos: ["Mostre três gestos em sequência, incluindo dar tchau, e peça para repetir.", "Peça para repetir de novo, sem você mostrar, e depois como num espelho.", "Veja a ordem, o lado usado e se ela corrige sozinha."],
    pistas: ["Repete a sequência", "Troca a ordem", "Usa o lado trocado", "Corrige sozinha", "Precisa que mostre cada gesto"],
  },
  copy6: {
    fala: "Desenhista oficial! Copia este desenho do jeitinho que você vê, sem apagar.",
    material: "Papel, lápis e figuras simples (círculo, cruz, quadrado)",
    minutos: 4,
    passos: ["Mostre uma figura simples e peça para copiar no papel, sem apagar.", "Repita com mais uma ou duas figuras, da mais simples para a mais difícil.", "Veja a forma, o tamanho, a posição e a mão que ela usa para desenhar."],
    pistas: ["Copia a forma", "Tamanho ou proporção fora", "Posição trocada", "Traços desorganizados", "Prefere a mão direita", "Prefere a mão esquerda"],
  },
  milestones: {
    fala: "Para o responsável: conte como foi o crescimento, do jeito que você lembrar.",
    material: "Nenhum",
    minutos: 3,
    passos: ["Pergunte ao responsável com que idade sentou, andou e falou as primeiras palavras.", "Pergunte sobre frases, desenho e desempenho na creche ou escola.", "Pergunte se perdeu alguma habilidade ou mudou de repente nos últimos meses."],
    pistas: ["Relatou sentar", "Relatou andar", "Relatou primeiras palavras", "Relatou frases", "Relatou perda de habilidade", "Não sabe informar"],
  },
  attention2: {
    fala: "Hora de brincar à vontade com estes brinquedos novos!",
    material: "Dois brinquedos novos",
    minutos: 4,
    passos: ["Deixe a criança brincar livremente com dois brinquedos novos.", "Chame a atenção para o segundo brinquedo e veja como ela muda de um para o outro.", "Interrompa com gentileza e veja como ela volta para a brincadeira."],
    pistas: ["Sustenta a brincadeira", "Muda de atividade com frequência", "Volta à brincadeira com ajuda", "Muito ativa", "Divide a atenção com você"],
  },
  attention6: {
    fala: "Jogo das cartas: separa por cor. Atenção, vou mudar a regra no meio!",
    material: "Cartas ou peças de 2 cores e 2 formas",
    minutos: 4,
    passos: ["Peça para separar as peças por cor.", "Troque a regra com instrução clara, por exemplo, separar por forma.", "Pare se a criança ficar frustrada e anote como ela reagiu."],
    pistas: ["Entende a regra", "Troca de regra com facilidade", "Continua na regra antiga", "Pede ajuda", "Fica frustrada"],
  },
  memory6: {
    fala: "Mapa secreto: onde estamos e o que combinamos há pouco?",
    material: "Nenhum",
    minutos: 2,
    passos: ["Pergunte, em linguagem da idade, onde estamos e que dia é hoje.", "No começo da conversa combine algo simples e, minutos depois, pergunte sobre isso.", "Veja se lembra sozinha ou só com uma dica."],
    pistas: ["Sabe onde está", "Sabe o dia aproximado", "Lembra sem dica", "Lembra com dica", "Não lembra"],
  },
  emotion2: {
    fala: "Para o responsável: como tem sido o humor, o sono e o medo nos últimos dias?",
    material: "Nenhum",
    minutos: 2,
    passos: ["Observe as expressões da criança durante a visita, na brincadeira e nas trocas.", "Pergunte ao responsável sobre humor, irritação, medo e sono, separando o que ele conta do que você viu.", "Anote se a expressão combina com o momento."],
    pistas: ["Expressão alegre", "Expressão triste", "Irritada", "Combina com o momento", "Diferente do momento"],
  },
  emotion6: {
    fala: "Como você tem se sentido nas últimas semanas? Pode contar do seu jeito.",
    material: "Nenhum",
    minutos: 3,
    passos: ["Pergunte como a criança tem se sentido nas últimas semanas.", "Pergunte o que mudou e como ela reage quando algo é difícil.", "Anote o que ela disse e o que você viu na expressão, em linhas separadas."],
    pistas: ["Relata tristeza", "Relata irritação", "Relata preocupação", "Expressão combina com a fala", "Expressão diferente da fala"],
  },
  sleep: {
    fala: "Para o responsável: como é o sono e a energia nos dias normais?",
    material: "Nenhum",
    minutos: 2,
    passos: ["Pergunte sobre horário de dormir, despertares e pesadelos.", "Pergunte sobre ronco, pausas na respiração e cansaço ao acordar.", "Pergunte sobre apetite e energia durante o dia."],
    pistas: ["Dificuldade para dormir", "Acorda durante a noite", "Ronca ou faz pausas", "Sono durante o dia", "Mudança de apetite"],
  },
};

/** Estações sem missão: exame físico e entrevista reservada, que ficam com o médico. */
export const ESTACOES_SEM_MISSAO = ["vision", "fundus", "shoulders", "meningeal", "posture", "strength6", "reflex", "sensation", "growth", "thought6", "insight9", "risk"] as const;
