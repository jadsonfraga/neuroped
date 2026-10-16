/**
 * Forma B da compreensão (reteste e variedade): um segundo texto ORIGINAL por faixa, com 4 perguntas
 * (2 literais e 2 inferenciais, mesma estrutura da forma A) e extensão próxima da forma A.
 * Conteúdo autoral do NeuroPed, escrito para esta triagem; sem fonte externa, sem equivalência
 * psicométrica comprovada entre as formas A e B (não há estudo de formas paralelas). Pendente de revisão
 * clínica/pedagógica do Dr. Jadson — ver docs/VALIDACAO_NEUROPAD.md.
 */
import type { BandId, ComprehensionSet } from "./bank";

export const COMPREHENSION_B: Record<BandId, ComprehensionSet> = {
  "5-6": {
    id: "c56b", title: "Mais histórias para ouvir (forma B)", listening: true,
    text: "A Malu pôs o chapéu porque o sol estava forte. O gato do Beto é preto e dorme no sofá. A Rita bebeu a água e pediu mais.",
    questions: [
      { id: "c56b-1", kind: "literal", question: "Por que a Malu pôs o chapéu?", answer: "☀️ Porque o sol estava forte", options: ["☔ Porque estava chovendo", "☀️ Porque o sol estava forte", "🎂 Porque era festa"] },
      { id: "c56b-2", kind: "literal", question: "Como é o gato do Beto?", answer: "🐱 Preto, e dorme no sofá", options: ["🐈 Branco, e dorme no chão", "🐶 É um cachorro", "🐱 Preto, e dorme no sofá"] },
      { id: "c56b-3", kind: "inferencial", question: "A Rita estava com sede?", answer: "💧 Sim, estava com sede", options: ["🙅 Não queria água", "💧 Sim, estava com sede", "🤷 Ela não bebeu"] },
      { id: "c56b-4", kind: "inferencial", question: "Por que a Malu pôs o chapéu e não o guarda-chuva?", answer: "☀️ Porque fazia sol, não chuva", options: ["☔ Porque estava chovendo", "☀️ Porque fazia sol, não chuva", "🌙 Porque era noite"] },
    ],
  },
  "7-8": {
    id: "c78b", title: "A lupa do Caio (forma B)", listening: false,
    text: "O Caio ganhou uma lupa e saiu para o jardim. Debaixo de uma pedra, ele viu formigas carregando folhas pequenas. Ele ficou quieto para não assustar as formigas. Em casa, desenhou tudo no caderno. Depois, mostrou o desenho para a mãe.",
    questions: [
      { id: "c78b-1", kind: "literal", question: "Onde o Caio viu as formigas?", answer: "Debaixo de uma pedra", options: ["No caderno", "Debaixo de uma pedra", "Dentro de casa"] },
      { id: "c78b-2", kind: "literal", question: "O que as formigas carregavam?", answer: "Folhas pequenas", options: ["Pedrinhas", "Pão", "Folhas pequenas"] },
      { id: "c78b-3", kind: "inferencial", question: "Por que o Caio ficou quieto?", answer: "Para não assustar as formigas", options: ["Porque estava com sono", "Para não assustar as formigas", "Porque a mãe mandou"] },
      { id: "c78b-4", kind: "inferencial", question: "Por que o Caio desenhou no caderno?", answer: "Para guardar o que observou", options: ["Porque a lupa quebrou", "Porque estava chovendo", "Para guardar o que observou"] },
    ],
  },
  "9-10": {
    id: "c910b", title: "O vulcão de massinha (forma B)", listening: false,
    text: "Na feira de ciências, o grupo da Marina montou um vulcão de massinha. Misturaram vinagre e bicarbonato de sódio e a espuma subiu pela boca do vulcão, como se fosse lava. Os colegas bateram palmas, mas um deles perguntou por que aquilo acontecia. Marina explicou que os dois ingredientes reagem e formam um gás, e é o gás que empurra a espuma para cima. Depois da apresentação, o grupo anotou a pergunta para estudar mais.",
    questions: [
      { id: "c910b-1", kind: "literal", question: "O que o grupo da Marina montou?", answer: "Um vulcão de massinha", options: ["Uma horta de papel", "Um vulcão de massinha", "Um foguete de lata"] },
      { id: "c910b-2", kind: "literal", question: "Quais ingredientes foram misturados?", answer: "Vinagre e bicarbonato de sódio", options: ["Água e sal", "Leite e açúcar", "Vinagre e bicarbonato de sódio"] },
      { id: "c910b-3", kind: "inferencial", question: "O que empurra a espuma para cima?", answer: "Um gás formado pela mistura", options: ["Um gás formado pela mistura", "O vento da sala", "Uma bomba escondida"] },
      { id: "c910b-4", kind: "inferencial", question: "Por que o grupo anotou a pergunta do colega?", answer: "Para estudar o assunto depois", options: ["Porque queria esquecer", "Porque o colega estava errado", "Para estudar o assunto depois"] },
    ],
  },
  "11-12": {
    id: "c1112b", title: "Os corais (forma B)", listening: false,
    text: "Os corais parecem pedras coloridas no fundo do mar, mas são animais muito pequenos que vivem em grupo. Eles dependem de algas microscópicas que moram dentro do seu corpo e lhes dão cor e alimento. Quando a água fica quente demais, os corais expulsam essas algas e ficam brancos, fenômeno chamado branqueamento. Se a água esfria a tempo, eles podem se recuperar; do contrário, morrem, e os peixes que abrigavam também perdem a casa.",
    questions: [
      { id: "c1112b-1", kind: "literal", question: "O que são os corais?", answer: "Animais pequenos que vivem em grupo", options: ["Pedras coloridas", "Plantas do fundo do mar", "Animais pequenos que vivem em grupo"] },
      { id: "c1112b-2", kind: "literal", question: "O que os corais expulsam quando a água fica quente demais?", answer: "As algas que vivem dentro deles", options: ["Os peixes", "As algas que vivem dentro deles", "A areia do fundo"] },
      { id: "c1112b-3", kind: "inferencial", question: "Por que um coral branqueado corre perigo?", answer: "Porque perdeu as algas que lhe dão alimento", options: ["Porque pegou sol demais", "Porque a água esfriou", "Porque perdeu as algas que lhe dão alimento"] },
      { id: "c1112b-4", kind: "inferencial", question: "O que a morte dos corais pode causar aos peixes que viviam neles?", answer: "Eles perdem o abrigo", options: ["Eles perdem o abrigo", "Eles ficam coloridos", "Eles passam a viver fora da água"] },
    ],
  },
  "13-14": {
    id: "c1314b", title: "Fazer tudo ao mesmo tempo (forma B)", listening: false,
    text: "Muitos adolescentes dizem que fazem várias coisas ao mesmo tempo: estudam, ouvem música e respondem mensagens. Pesquisas sobre atenção mostram que, na verdade, o cérebro não executa duas tarefas complexas juntas; ele alterna rapidamente entre elas. Cada alternância gasta um pouco de tempo e aumenta a chance de erros, de modo que o estudo costuma render menos. Por isso, professores sugerem blocos curtos de concentração, com o celular fora do alcance, seguidos de pequenas pausas. Quem testa o método costuma perceber que termina a lição mais cedo.",
    questions: [
      { id: "c1314b-1", kind: "literal", question: "O que o cérebro faz, segundo o texto, quando parece fazer duas tarefas complexas juntas?", answer: "Alterna rapidamente entre as tarefas", options: ["Executa as duas com a mesma qualidade", "Alterna rapidamente entre as tarefas", "Deixa uma delas para o dia seguinte"] },
      { id: "c1314b-2", kind: "inferencial", question: "Por que estudar com mensagens chegando costuma render menos?", answer: "Porque cada alternância gasta tempo e aumenta os erros", options: ["Porque as mensagens são sempre longas", "Porque cada alternância gasta tempo e aumenta os erros", "Porque a música atrapalha o celular"] },
      { id: "c1314b-3", kind: "literal", question: "O que os professores sugerem?", answer: "Blocos curtos de concentração, com o celular fora do alcance", options: ["Estudar a madrugada inteira", "Blocos curtos de concentração, com o celular fora do alcance", "Responder as mensagens durante a lição"] },
      { id: "c1314b-4", kind: "inferencial", question: "Qual é a ideia central do texto?", answer: "Fazer uma coisa de cada vez costuma ser mais eficiente", options: ["Fazer uma coisa de cada vez costuma ser mais eficiente", "Ouvir música sempre atrapalha", "Adolescentes não conseguem estudar"] },
    ],
  },
  "15-18": {
    id: "c1518b", title: "Como funciona a memória (forma B)", listening: false,
    text: "Muita gente acredita que a memória funciona como uma câmera, registrando os fatos tal como aconteceram. Estudos de psicologia mostram o contrário: lembrar é reconstruir. A cada vez que recuperamos uma lembrança, ela pode ser alterada por emoções, por conversas posteriores e por detalhes que imaginamos sem perceber. Isso explica por que duas pessoas que viveram o mesmo episódio contam versões diferentes com a mesma convicção. Por essa razão, advogados e juízes tratam depoimentos com cautela e buscam provas que não dependam apenas da lembrança de uma testemunha.",
    questions: [
      { id: "c1518b-1", kind: "literal", question: "Que ideia comum o texto contesta?", answer: "Que a memória registra tudo fielmente, como uma câmera", options: ["Que a memória registra tudo fielmente, como uma câmera", "Que as emoções existem", "Que juízes trabalham com provas"] },
      { id: "c1518b-2", kind: "inferencial", question: "O que significa dizer que \"lembrar é reconstruir\"?", answer: "A lembrança é refeita a cada vez e pode mudar", options: ["A lembrança fica guardada intacta para sempre", "A lembrança é refeita a cada vez e pode mudar", "Só se lembra o que foi escrito"] },
      { id: "c1518b-3", kind: "inferencial", question: "Por que duas pessoas contam versões diferentes do mesmo episódio?", answer: "Porque cada uma reconstrói a lembrança à sua maneira", options: ["Porque uma delas está mentindo de propósito", "Porque cada uma reconstrói a lembrança à sua maneira", "Porque o episódio nunca aconteceu"] },
      { id: "c1518b-4", kind: "literal", question: "O que advogados e juízes buscam além do depoimento?", answer: "Provas que não dependam só da lembrança da testemunha", options: ["Mais testemunhas com a mesma versão", "Provas que não dependam só da lembrança da testemunha", "Que a testemunha esteja convicta"] },
    ],
  },
};
