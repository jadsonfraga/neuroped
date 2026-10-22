/**
 * Missões guiadas do circuito clínico complementar. Cada estação vira uma brincadeira com passos
 * em linguagem de jogo para o auxiliar e marcadores tocáveis do que foi percebido. O auxiliar registra
 * pelos toques; a criança não é interrogada sobre sintomas. A estação `risk` não é gamificada de propósito:
 * é entrevista reservada somente para profissional e não pode ser apresentada como missão infantil.
 * Esta lista não pontua, não compara com norma e não conclui diagnóstico.
 */
export interface Missao {
  passos: readonly string[];
  pistas: readonly string[];
}

export const MISSOES: Readonly<Record<string, Missao>> = {
  consciencia: {
    passos: ["Chame a criança pelo nome e converse normalmente, sem estímulo doloroso.", "Observe se responde, procura você com o olhar e acompanha a sala.", "Repare se fica sonolenta ou agitada ao longo das missões."],
    pistas: ["Alerta e responsiva", "Responde com demora", "Sonolenta", "Agitada ou irritada", "Procura o adulto"],
  },
  language2: {
    passos: ["Mostre figuras de objetos conhecidos e peça para apontar o que você nomear.", "Peça um comando simples, como pegar a bola ou pôr no balde.", "Convide a criança a contar algo por fala, gesto ou comunicação alternativa."],
    pistas: ["Aponta o que é pedido", "Nomeia objetos", "Usa frases curtas", "Usa gestos ou apontar", "Usa comunicação alternativa"],
  },
  language6: {
    passos: ["Peça para contar o que fez hoje, na ordem em que aconteceu.", "Dê uma instrução com três etapas, como pegar o lápis, desenhar um círculo e entregar.", "Se a criança for alfabetizada, peça para ler uma frase curta em voz alta."],
    pistas: ["Conta em sequência", "Segue as três etapas", "Fala com fluência", "Troca palavras ou faz pausas longas", "Lê com dificuldade"],
  },
  vision: {
    passos: ["Segure um alvo colorido à frente dos olhos, a uma distância confortável.", "Mova o alvo devagar para os lados, para cima e para baixo, pedindo que siga com os olhos sem mover a cabeça.", "Observe se os olhos acompanham juntos e compare os dois lados, com a técnica de pupila do médico."],
    pistas: ["Segue o alvo com os dois olhos", "Olhos desalinhados", "Dificuldade em uma direção", "Movimentos bruscos ou tremor", "Pupilas iguais à luz"],
  },
  fundus: {
    passos: ["Com o oftalmoscópio, peça para a criança olhar para um ponto fixo, em ambiente de pouca luz.", "Observe a borda e a cor do disco óptico e os vasos, olho a olho.", "Se a criança não tolerar, registre o motivo e siga para a próxima missão."],
    pistas: ["Exame feito", "Não tolerou", "Bordas do disco nítidas", "Bordas elevadas ou borradas", "Assimetria entre os olhos"],
  },
  face: {
    passos: ["Peça para a criança fazer careta de dragão: sorrir, fechar os olhos com força e encher as bochechas.", "Observe os dois lados do rosto em cada movimento, espontâneo e pedido.", "Se houver colaboração, peça para franzir a testa e mostrar os dentes."],
    pistas: ["Movimenta os dois lados igual", "Um lado mais fraco", "Fecha os dois olhos", "Não colaborou", "Mímica espontânea simétrica"],
  },
  hearing: {
    passos: ["Chame a criança por trás, sem que ela veja você, em voz de conversa e depois mais baixa.", "Observe se vira ou responde, e compare as duas orelhas quando possível.", "Peça para repetir uma palavra simples e observe a voz e a articulação."],
    pistas: ["Responde ao chamado", "Resposta diferente entre as orelhas", "Voz clara", "Voz rouca ou fraca", "Articulação com dificuldade"],
  },
  shoulders: {
    passos: ["Peça para encolher os ombros contra a sua mão, com resistência gentil.", "Peça para virar a cabeça para um lado contra a sua mão e depois para o outro.", "Compare os lados e observe amplitude e esforço."],
    pistas: ["Força igual nos dois lados", "Mais fraco de um lado", "Dor relatada", "Não colaborou", "Amplitude completa"],
  },
  meningeal: {
    passos: ["Com a criança deitada, flexione a cabeça suavemente em direção ao peito, sem forçar.", "Observe resistência, dor ou desconforto relatado.", "Se houver febre, confusão ou convulsão, pare e acione atendimento de urgência."],
    pistas: ["Flexão livre", "Resistência ao movimento", "Dor ao mover a nuca", "Não colaborou", "Febre referida no momento"],
  },
  posture: {
    passos: ["Peça para a criança ficar parada como uma estátua, com os braços estendidos à frente.", "Observe por alguns segundos se os braços ficam firmes, caem ou tremem.", "Mova suavemente braços e pernas, um lado de cada vez, e observe a resistência."],
    pistas: ["Braços firmes", "Tremor ou movimento involuntário", "Braço cai de um lado", "Resistência igual nos dois lados", "Rígido ou muito flexível ao mover"],
  },
  strength2: {
    passos: ["Peça para a criança sentar no chão e se levantar sem apoio.", "Peça para alcançar um brinquedo com cada mão, alternando.", "Peça para agachar e voltar a ficar em pé, com você por perto."],
    pistas: ["Levanta sem apoio", "Usa as duas mãos", "Usa uma mão mais que a outra", "Precisa de apoio", "Cai ou perde o equilíbrio"],
  },
  strength2p: {
    passos: ["Peça para a criança empurrar suas mãos com força, como num jogo de braço.", "Peça para puxar um brinquedo e depois empurrar um bloco, com resistência gentil.", "Compare os dois lados e observe cansaço ou queda."],
    pistas: ["Força igual nos dois lados", "Mais fraco de um lado", "Cansa rápido", "Cai ou perde o equilíbrio", "Não quis"],
  },
  strength6: {
    passos: ["Peça para manter os braços estendidos à frente, palmas para baixo, por alguns segundos.", "Faça resistência gentil nos braços e nas pernas, um lado de cada vez, comparando.", "Peça para subir na ponta dos pés e nos calcanhares, se houver segurança."],
    pistas: ["Mantém os braços estendidos", "Um braço desce ou gira", "Força igual nos lados", "Força menor em um lado", "Dor relatada"],
  },
  reflex: {
    passos: ["Com a criança sentada e relaxada, distraia-a com uma conversa e examine os joelhos com o martelo.", "Compare o lado direito com o esquerdo e teste a sola do pé suavemente.", "Registre apenas o que foi efetivamente examinado."],
    pistas: ["Joelho direito igual ao esquerdo", "Resposta reduzida de um lado", "Resposta plantar em flexão", "Resposta plantar em extensão", "Não examinado"],
  },
  sensation: {
    passos: ["Com os olhos da criança fechados, toque de leve a pele com algodão em diferentes pontos.", "Peça para dizer ou mostrar com a mão quando sentir, comparando os dois lados.", "Pare se a criança demonstrar desconforto."],
    pistas: ["Sente igual dos dois lados", "Não sente em uma área", "Sente com atraso", "Não colaborou", "Relata formigamento"],
  },
  stereognosis: {
    passos: ["Coloque um objeto familiar e seguro na mão da criança, com os olhos fechados.", "Peça para dizer ou mostrar o que é, com cada mão.", "Compare as duas mãos e registre erros ou tempo de resposta."],
    pistas: ["Reconhece nas duas mãos", "Reconhece só em uma mão", "Precisou de dica", "Não reconheceu", "Não colaborou"],
  },
  reach2: {
    passos: ["Coloque um brinquedo em lugares diferentes à frente da criança.", "Peça para pegar com cada mão, alternando.", "Observe a pinça e se a mão erra o alvo ou treme ao se aproximar."],
    pistas: ["Pega com precisão", "Erra o alvo", "Tremor ao se aproximar", "Usa uma mão só", "Pega e solta com facilidade"],
  },
  dismetria2: {
    passos: ["Use um brinquedo como alvo e avise antes de mudar de lugar.", "Peça para tocar o alvo com cada mão, em posições diferentes.", "Observe a aproximação, a correção no meio do caminho e o tremor."],
    pistas: ["Toca no alvo com precisão", "Passa do alvo", "Corrige no meio do caminho", "Tremor ao se aproximar", "Diferença entre as mãos"],
  },
  finger6: {
    passos: ["Peça para tocar a ponta do nariz e depois o seu dedo, alternando.", "Peça para fazer o movimento mais rápido, alternando as mãos.", "Se for pertinente, peça para deslizar o calcanhar pelo joelho de cada lado."],
    pistas: ["Precisão nos dois lados", "Erra o alvo", "Tremor ao se aproximar", "Movimento rápido lento", "Diferença entre os lados"],
  },
  gait2: {
    passos: ["Peça para a criança andar até a porta como um animal da escolha dela.", "Peça para correr um pouco e depois fazer uma curva.", "Peça para ficar em pé sem apoio por alguns segundos."],
    pistas: ["Anda com firmeza", "Cai ou tropeça", "Braços abertos para equilibrar", "Faz a curva com facilidade", "Precisa de apoio"],
  },
  romberg: {
    passos: ["Peça para ficar em pé com os pés juntos e os braços ao lado, de olhos abertos, por alguns segundos.", "Repita de olhos fechados, com você por perto para proteger.", "Pare ao primeiro sinal de insegurança."],
    pistas: ["Mantém de olhos abertos", "Oscila de olhos abertos", "Oscila mais de olhos fechados", "Precisa de apoio", "Interrompido por segurança"],
  },
  gait6: {
    passos: ["Peça para andar em linha reta, normalmente, por alguns passos.", "Peça para andar em linha reta com um pé na frente do outro, calcanhar encostado na ponta.", "Peça para ficar na ponta dos pés e depois nos calcanhares, se houver segurança."],
    pistas: ["Marcha firme", "Desvio para um lado", "Precisa de apoio", "Oscila na marcha em linha", "Não conseguiu nas pontas"],
  },
  involuntary: {
    passos: ["Observe a criança sentada e em repouso por alguns minutos, durante a brincadeira.", "Peça para manter os braços estendidos com os dedos abertos.", "Anote o tipo, o local e se o movimento piora ou melhora com atenção ou distração."],
    pistas: ["Movimento em repouso", "Movimento com braços estendidos", "Piora com atenção ou tarefa", "Diminui com distração", "Piscadas, caretas ou sons repetidos"],
  },
  praxis3: {
    passos: ["Faça um gesto simples, como acenar ou bater palmas, e peça para copiar como num espelho.", "Repita com outro gesto, como tocar o nariz ou mostrar o polegar.", "Observe se copia com as duas mãos e se precisa de modelo."],
    pistas: ["Copia com as duas mãos", "Copia com uma mão só", "Precisa de modelo", "Não entendeu a instrução", "Copia com esforço"],
  },
  praxis6: {
    passos: ["Mostre uma sequência de três gestos, incluindo um gesto simbólico, como dar tchau.", "Peça para repetir de memória e depois por imitação espelhada.", "Observe a ordem, o lado usado e se corrige sozinha."],
    pistas: ["Repete a sequência", "Ordem trocada", "Usa o lado errado", "Corrige sozinha", "Precisa de modelo em cada gesto"],
  },
  copy6: {
    passos: ["Mostre uma figura simples e peça para copiar no papel, com lápis.", "Peça para copiar sem apagar, com a mão de costume.", "Observe forma, proporção, posição e ordem dos traços."],
    pistas: ["Copia a forma", "Proporções fora", "Posição trocada", "Ordem dos traços desorganizada", "Precisa de modelo"],
  },
  hand: {
    passos: ["Observe com qual mão a criança pega, aponta e desenha ao longo das missões.", "Proponha uma tarefa com as duas mãos, como segurar um objeto com uma e manipular com a outra.", "Anote a troca de mão, se houver."],
    pistas: ["Prefere a mão direita", "Prefere a mão esquerda", "Troca de mão", "Usa as duas mãos juntas", "Ainda não definida"],
  },
  milestones: {
    passos: ["Pergunte ao cuidador, com a fonte identificada, sobre sentar, andar e as primeiras palavras.", "Pergunte sobre frases, habilidades motoras finas e desempenho escolar ou na creche.", "Pergunte se houve perda de habilidades ou mudança recente."],
    pistas: ["Relatou sentar", "Relatou andar", "Relatou primeiras palavras", "Relatou frases", "Relatou perda de habilidade", "Não sabe informar"],
  },
  growth: {
    passos: ["Meça o perímetro cefálico com fita, quando a criança tolerar.", "Observe postura, assimetrias do rosto e do corpo e manchas na pele.", "Registre só o que foi medido ou observado; o restante fica como não examinado."],
    pistas: ["Perímetro medido", "Não medido", "Assimetria observada", "Manchas na pele", "Traços dismórficos observados"],
  },
  rapport: {
    passos: ["Receba a criança como convidada, com um brinquedo na mesa.", "Observe apresentação, contato e reação à sala e ao adulto.", "Repare no nível de atividade e na adaptação ao ambiente."],
    pistas: ["Contato espontâneo", "Contato reduzido", "Reage bem à sala", "Inquieta", "Lenta ou sem iniciativa", "Adaptação difícil"],
  },
  social2: {
    passos: ["Proponha um brinquedo para dividir a vez, como rolar uma bola.", "Mostre algo interessante e observe se a criança compartilha.", "Observe gestos, imitação e atenção compartilhada."],
    pistas: ["Alterna turnos", "Mostra algo ao adulto", "Imita gestos", "Compartilha atenção", "Precisa de ajuda"],
  },
  conversation6: {
    passos: ["Converse sobre um interesse da criança e um fato do dia a dia.", "Observe se os turnos são respeitados e se a fala segue o tema.", "Repare no tom, no ritmo e se entende o contexto."],
    pistas: ["Turnos respeitados", "Fala segue o tema", "Tom e ritmo registrados", "Dificuldade de entender o contexto", "Precisa de ajuda para continuar"],
  },
  attention2: {
    passos: ["Deixe a criança brincar livremente com dois brinquedos novos.", "Chame a atenção para o segundo brinquedo e observe a mudança.", "Interrompa gentilmente e observe como volta à brincadeira."],
    pistas: ["Sustenta a brincadeira", "Muda de atividade com frequência", "Volta à tarefa com ajuda", "Atividade motora intensa", "Atenção conjunta"],
  },
  attention6: {
    passos: ["Mostre cartas e peça para separar por cor, com uma regra simples.", "Troque a regra com instrução clara, por exemplo, separar por forma.", "Suspenda se a criança ficar frustrada."],
    pistas: ["Entende a regra", "Troca de regra com facilidade", "Continua na regra antiga", "Pede ajuda", "Frustração"],
  },
  memory6: {
    passos: ["Pergunte, em linguagem da idade, onde estão e que dia é hoje.", "Retome algo combinado minutos antes, na conversa.", "Observe se lembra sozinha ou com pistas."],
    pistas: ["Orientada no lugar", "Orientada no tempo", "Lembra sem pista", "Lembra com pista", "Não lembra"],
  },
  emotion2: {
    passos: ["Observe as expressões ao longo do encontro, na brincadeira e nas trocas.", "Pergunte ao cuidador sobre humor, irritabilidade e sono, separando o relato da observação.", "Registre se o afeto combina com a situação."],
    pistas: ["Expressão alegre", "Expressão triste", "Irritada", "Afeto combina com a situação", "Afeto diferente da situação"],
  },
  emotion6: {
    passos: ["Pergunte como a criança tem se sentido nas últimas semanas.", "Pergunte o que mudou e como ela reage a situações difíceis.", "Observe o afeto durante a fala e separe o relato da observação."],
    pistas: ["Relata humor triste", "Relata irritabilidade", "Relata ansiedade", "Afeto combina com o relato", "Afeto diferente do relato"],
  },
  sleep: {
    passos: ["Pergunte sobre horário, despertares e pesadelos.", "Pergunte sobre roncos, pausas na respiração e cansaço ao acordar.", "Pergunte sobre apetite e energia durante o dia."],
    pistas: ["Relata dificuldade para dormir", "Relata despertares", "Relata roncos ou pausas", "Relata sonolência diurna", "Relata mudança de apetite"],
  },
  thought6: {
    passos: ["Converse sobre o dia da criança, deixando que ela conte com as próprias palavras.", "Observe se o raciocínio segue e se a fala tem começo, meio e fim.", "Se surgir tema incomum, registre o que a criança disse, sem questionar nem sugerir."],
    pistas: ["Raciocínio organizado", "Raciocínio desorganizado", "Muda de assunto", "Tema incomum relatado", "Fantasia infantil"],
  },
  insight9: {
    passos: ["Converse sobre uma decisão do dia a dia e suas consequências.", "Pergunte quem poderia ajudar nas dificuldades.", "Observe como ela se percebe diante das próprias dificuldades."],
    pistas: ["Reflete sobre consequências", "Reconhece dificuldades", "Nega dificuldades", "Pede ajuda", "Precisa de exemplos"],
  },
};

/** Estações sem missão: somente entrevista reservada ao profissional. */
export const ESTACOES_SEM_MISSAO = ["risk"] as const;
