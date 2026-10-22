/**
 * Missões da assistente na pré-consulta. Cada estação que a assistente executa vira uma brincadeira curta, com o
 * material necessário, passos em linguagem simples e marcadores tocáveis do que foi percebido. Nenhuma missão pede
 * manobra, instrumento médico, contato físico com resistência ou pergunta sobre sintomas à criança.
 * Exames com técnica (fundo de olho, reflexos, sinais meníngeos, força, sensibilidade, pares cranianos, tônus,
 * Romberg, tandem, dedo-nariz) e entrevistas sobre pensamento, insight ou risco pertencem ao médico e não têm missão.
 * Esta lista não pontua, não compara com referência e não conclui diagnóstico.
 */
export interface Missao {
  /** Em uma frase, o que a assistente está olhando, sem termo técnico. */
  objetivo: string;
  /** Material necessário; "nenhum" quando a missão usa só a conversa ou o ambiente. */
  material: string;
  /** Duração aproximada, em minutos. */
  minutos: number;
  passos: readonly string[];
  pistas: readonly string[];
}

export const MISSOES: Readonly<Record<string, Missao>> = {
  rapport: {
    objetivo: "Como a criança chega e se adapta à sala.",
    material: "Um brinquedo sobre a mesa.",
    minutos: 2,
    passos: ["Receba a criança com um sorriso e deixe um brinquedo à vista, sem pressa.", "Observe como ela cumprimenta, olha para você e reage à sala.", "Repare se está agitada, quieta ou se adapta aos poucos."],
    pistas: ["Cumprimenta ou olha para você", "Demora a se aproximar", "Explora a sala com interesse", "Fica agitada", "Fica quieta e sem iniciativa"],
  },
  social2: {
    objetivo: "Brincar junto: revezar, mostrar, imitar.",
    material: "Uma bola e um brinquedo que faça algo divertido.",
    minutos: 3,
    passos: ["Role a bola para a criança e espere ela devolver, para brincarem de revezar.", "Mostre um brinquedo interessante e veja se ela olha para você ou mostra de volta.", "Faça um gesto simples, como acenar, e veja se ela imita."],
    pistas: ["Devolve a bola e espera a vez", "Mostra algo para você", "Imita gestos", "Olha para você durante a brincadeira", "Precisou de muita ajuda"],
  },
  conversation6: {
    objetivo: "Como a criança conversa sobre um assunto de que gosta.",
    material: "Nenhum.",
    minutos: 3,
    passos: ["Pergunte sobre algo de que ela gosta, como um jogo, um desenho ou um animal.", "Deixe falar e responda com interesse, esperando a sua vez de falar.", "Repare se ela fala sobre o assunto, espera a vez e entende o que você pergunta."],
    pistas: ["Conversa sobre o assunto", "Espera a vez de falar", "Entende o que é perguntado", "Muda de assunto sozinha", "Precisa de ajuda para continuar"],
  },
  consciencia: {
    objetivo: "Se a criança está desperta e atenta ao ambiente.",
    material: "Nenhum.",
    minutos: 1,
    passos: ["Chame a criança pelo nome em voz de conversa, sem tocar nem estimular.", "Veja se ela olha para você e acompanha o que acontece na sala.", "Repare, ao longo das missões, se ela fica muito sonolenta ou muito agitada."],
    pistas: ["Desperta e atenta", "Demora a responder", "Sonolenta", "Agitada ou irritada", "Procura o adulto com o olhar"],
  },
  language2: {
    objetivo: "Se a criança entende pedidos simples e se faz entender.",
    material: "Figuras ou objetos conhecidos (bola, copo, sapato).",
    minutos: 3,
    passos: ["Mostre duas ou três figuras e peça para ela apontar a que você nomear.", "Peça uma tarefa simples, como pôr a bola no balde.", "Convide a criança a contar algo por fala, gesto ou como ela se comunica."],
    pistas: ["Aponta o que é pedido", "Fala o nome de objetos", "Usa frases curtas", "Usa gestos ou aponta", "Usa figuras ou aparelho para se comunicar"],
  },
  language6: {
    objetivo: "Se a criança conta uma história em ordem e segue pedidos em etapas.",
    material: "Lápis e papel.",
    minutos: 3,
    passos: ["Peça para a criança contar o que fez hoje, desde que acordou.", "Dê um pedido em três etapas: pegar o lápis, desenhar uma bola e entregar a você.", "Se ela já lê, peça para ler em voz alta uma frase curta."],
    pistas: ["Conta na ordem certa", "Faz as três etapas", "Fala sem travar", "Faz pausas longas ou troca palavras", "Lê com dificuldade"],
  },
  strength2: {
    objetivo: "Como a criança levanta, alcança e agacha numa brincadeira.",
    material: "Um brinquedo e espaço livre no chão.",
    minutos: 3,
    passos: ["Sente a criança no chão e convide para se levantar sozinha, ficando por perto.", "Coloque um brinquedo de cada lado e peça para pegar, uma mão de cada vez.", "Peça para agachar e voltar a ficar em pé, sempre perto para evitar queda."],
    pistas: ["Levanta sem apoio", "Usa as duas mãos", "Usa mais uma mão que a outra", "Precisa de apoio", "Cai ou perde o equilíbrio"],
  },
  reach2: {
    objetivo: "Se a mão vai certeira até o brinquedo.",
    material: "Um brinquedo pequeno e seguro.",
    minutos: 2,
    passos: ["Segure o brinquedo à frente da criança, num lugar de cada vez: à direita, à esquerda e no meio.", "Peça para pegar com cada mão, alternando.", "Observe se a mão acerta o brinquedo e se pega e solta com facilidade."],
    pistas: ["Pega o brinquedo de primeira", "Erra o alvo", "A mão treme ao chegar", "Usa só uma das mãos", "Pega e solta com facilidade"],
  },
  gait2: {
    objetivo: "Como a criança anda, corre e muda de direção.",
    material: "Espaço livre e seguro, com alguns metros.",
    minutos: 3,
    passos: ["Convide a criança a andar até a porta como um bichinho que ela escolher.", "Peça para correr um pouco e fazer uma curva em volta de um objeto.", "Peça para ficar em pé parada por alguns segundos, sem se apoiar."],
    pistas: ["Anda com firmeza", "Tropeça ou cai", "Abre os braços para se equilibrar", "Faz a curva sem dificuldade", "Precisa de apoio"],
  },
  involuntary: {
    objetivo: "Se aparece algum movimento que a criança não controla.",
    material: "Nenhum.",
    minutos: 2,
    passos: ["Durante a brincadeira, repare nas mãos, no rosto e no corpo quando a criança está parada.", "Peça para esticar os braços à frente, com os dedos abertos, por alguns segundos.", "Se notar algo, anote onde aparece e se muda quando ela se distrai."],
    pistas: ["Nenhum movimento diferente notado", "Movimento com a criança parada", "Movimento com os braços esticados", "Piscadas, caretas ou sons repetidos", "Diminui quando se distrai"],
  },
  praxis3: {
    objetivo: "Se a criança copia gestos como num espelho.",
    material: "Nenhum.",
    minutos: 2,
    passos: ["Diga que vão brincar de espelho e faça um gesto simples, como acenar ou bater palmas.", "Peça para a criança fazer igual e repita o gesto uma vez, se ela precisar.", "Faça outro gesto, como mostrar o polegar, e observe se usa as duas mãos."],
    pistas: ["Copia com as duas mãos", "Copia só com uma mão", "Precisa que você repita o gesto", "Não entendeu a brincadeira", "Copia com muito esforço"],
  },
  praxis6: {
    objetivo: "Se a criança repete uma sequência de gestos.",
    material: "Nenhum.",
    minutos: 3,
    passos: ["Mostre três gestos seguidos, por exemplo dar tchau, bater palmas e tocar o nariz.", "Peça para ela repetir a sequência logo depois de você, como um espelho.", "Peça de novo, depois de alguns segundos, sem você mostrar."],
    pistas: ["Repete a sequência toda", "Troca a ordem", "Usa a mão trocada", "Corrige sozinha", "Precisa que você mostre cada gesto"],
  },
  copy6: {
    objetivo: "Como a criança copia desenhos simples.",
    material: "Lápis, papel e figuras simples (círculo, cruz, quadrado).",
    minutos: 4,
    passos: ["Mostre uma figura simples, como um círculo, e peça para copiar no papel.", "Repita com a cruz e o quadrado, sem apagar.", "Observe a mão que usa, a forma do desenho e por onde ela começa."],
    pistas: ["Copia a forma", "Desenho com tamanho ou posição trocados", "Começa por lugares diferentes", "Precisa ver o modelo o tempo todo", "Cansa ou desiste"],
  },
  hand: {
    objetivo: "Qual mão a criança prefere.",
    material: "Nenhum além do que já está sendo usado.",
    minutos: 1,
    passos: ["Durante as missões, repare com qual mão ela pega, aponta e desenha.", "Peça para segurar o papel com uma mão enquanto desenha com a outra.", "Anote se ela troca de mão ao longo das tarefas."],
    pistas: ["Prefere a mão direita", "Prefere a mão esquerda", "Troca de mão", "Usa as duas mãos juntas", "Ainda não tem preferência"],
  },
  milestones: {
    objetivo: "O que o cuidador conta sobre o desenvolvimento da criança.",
    material: "Nenhum. Converse com quem convive com a criança.",
    minutos: 4,
    passos: ["Pergunte ao cuidador com que idade a criança sentou, andou e falou as primeiras palavras.", "Pergunte como ela está hoje na fala, nas habilidades com as mãos e na escola ou creche.", "Pergunte se alguma habilidade foi perdida ou mudou de repente nos últimos meses."],
    pistas: ["Cuidador contou quando sentou", "Cuidador contou quando andou", "Cuidador contou as primeiras palavras", "Cuidador contou como fala hoje", "Cuidador contou perda de habilidade", "Cuidador não sabe informar"],
  },
  attention2: {
    objetivo: "Por quanto tempo a criança brinca e como volta à brincadeira.",
    material: "Dois brinquedos que a criança ainda não conhece.",
    minutos: 3,
    passos: ["Deixe a criança brincar à vontade com os dois brinquedos.", "Mostre o segundo brinquedo e veja se ela olha e troca de brincadeira.", "Interrompa com gentileza e observe como ela volta a brincar."],
    pistas: ["Brinca com um brinquedo por um tempo", "Troca de brincadeira toda hora", "Volta à brincadeira com ajuda", "Muito movimento durante a brincadeira", "Olha o que você mostra"],
  },
  attention6: {
    objetivo: "Se a criança segue uma regra e se adapta quando ela muda.",
    material: "Cartas ou figuras de cores e formas diferentes.",
    minutos: 4,
    passos: ["Peça para separar as cartas por cor e treine com duas cartas antes de valer.", "Depois de alguns minutos, avise que a regra mudou e peça para separar por forma.", "Pare se a criança ficar frustrada ou cansada."],
    pistas: ["Entende a primeira regra", "Troca de regra com facilidade", "Continua na regra antiga", "Pede ajuda", "Fica frustrada"],
  },
  memory6: {
    objetivo: "Se a criança sabe onde está, que dia é e lembra do que foi combinado.",
    material: "Nenhum.",
    minutos: 3,
    passos: ["Combine uma coisa simples no início, como lembrar de uma palavra, e siga com as outras missões.", "Mais adiante, pergunte em tom de conversa onde estão e que dia é hoje.", "Pergunte pela coisa combinada e veja se lembra sozinha ou com uma dica."],
    pistas: ["Sabe onde está", "Sabe o dia aproximado", "Lembra do combinado sozinha", "Lembra com uma dica", "Não lembra"],
  },
  emotion2: {
    objetivo: "Como a criança demonstra o que sente durante o encontro.",
    material: "Nenhum.",
    minutos: 2,
    passos: ["Observe o rosto e o jeito da criança durante as brincadeiras: alegria, frustração, medo.", "Pergunte ao cuidador como ela costuma ficar em casa: humor, irritação e sono.", "Anote separado o que você viu e o que o cuidador contou."],
    pistas: ["Demonstra alegria", "Demonstra tristeza", "Fica irritada", "Reação combina com a situação", "Cuidador contou mudança em casa"],
  },
  sleep: {
    objetivo: "O que o cuidador conta sobre sono, apetite e energia.",
    material: "Nenhum. Converse com o cuidador.",
    minutos: 3,
    passos: ["Pergunte a que horas a criança dorme e acorda e se acorda durante a noite.", "Pergunte se ronca, faz pausas na respiração ou tem pesadelos.", "Pergunte como estão o apetite e a energia durante o dia."],
    pistas: ["Cuidador contou dificuldade para dormir", "Cuidador contou despertares", "Cuidador contou roncos ou pausas", "Cuidador contou sono durante o dia", "Cuidador contou mudança no apetite"],
  },
};
