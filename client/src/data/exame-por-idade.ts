export type ExamStep = { title: string; action: string; observe: string };
export type ExamBand = { age: string; setup: string; steps: ExamStep[] };

function step(title: string, action: string, observe: string): ExamStep {
  return { title, action, observe };
}

const infantExam = [
  step("Cabeça e postura", "Meça o perímetro cefálico, confira a trajetória na curva apropriada e palpe a fontanela com o bebê tranquilo.", "Forma craniana, tensão da fontanela, postura e trajetória das medidas. Considere idade corrigida na interpretação do desenvolvimento do prematuro."),
  step("Tônus e reflexos", "Com cabeça e tronco apoiados, mobilize suavemente cada membro. Compare reflexos profundos homólogos e pesquise reflexos primitivos pertinentes à idade e ao estado de alerta.", "Resistência passiva, controle axial, simetria e presença ou persistência de respostas no contexto da maturidade."),
  step("Sensibilidade e nervos cranianos", "Durante o manuseio, compare a reação ao toque leve de cada lado. Verifique pupilas e reflexo vermelho. Observe sucção, voz ou choro e manejo de saliva conforme a história.", "Descreva a resposta realmente obtida e a via examinada. Oriente investigação específica de visão, audição ou deglutição conforme o achado."),
];

const playExam = [
  step("Força e tônus", "Convide a empurrar suas mãos ou levantar-se do chão como conseguir. No colo ou sentada, deixe a criança relaxar e mobilize braços e pernas suavemente.", "Compare lados, resistência passiva, esforço antigravitário, compensações e movimentos involuntários."),
  step("Reflexos e sensibilidade", "Mostre o martelo no boneco e compare reflexos profundos homólogos com o membro relaxado. Demonstre um toque leve e peça para apontar onde sentiu, se compreender.", "Anote reflexo, lado e resposta. Em criança pré-verbal, descreva localização ou retirada observada e os limites da comparação."),
  step("Visão, audição e função oral", "Examine pupilas; adapte o teste visual de cada olho à linguagem. Observe resposta à voz, movimento facial, língua, voz e manejo de saliva.", "Registre cada função examinada, correção visual ou dispositivo auditivo usado e eventual necessidade de exame dirigido."),
];

const olderExam = [
  step("Tônus, força e postura", "Observe trofismo e movimentos involuntários em repouso. Mobilize articulações relaxadas; demonstre como resistir e compare segmentos proximais e distais.", "Descreva distribuição, lado, dor, fadiga e compensações durante o esforço."),
  step("Reflexos e sensibilidade", "Com membros apoiados, compare bicipitais, tricipitais, patelares e aquileus. Avalie resposta plantar quando pertinente. Demonstre toque leve e compare pontos homólogos com os olhos fechados.", "Registre distribuição e simetria. Explore posição articular ou vibração se a queixa ou o padrão observado indicar."),
  step("Nervos cranianos dirigidos", "Confira pupilas, alinhamento ocular e acuidade de cada olho. Compare sensibilidade facial, mastigação, audição clínica, elevação dos ombros, palato, voz e língua conforme a participação.", "Identifique lado, função e método; detalhe o exame de fundo de olho e a avaliação visual ou auditiva formal quando indicados."),
];

export const examBands: ExamBand[] = [
  {
    age: "Nascimento a 27 dias",
    setup: "Espere um período de vigília tranquila, no colo ou em superfície firme, com cabeça e tronco apoiados.",
    steps: [
      step("Olhos, face e comunicação", "Quando abrir os olhos, aproxime seu rosto e peça ao cuidador que fale suavemente.", "Abertura ocular, mudança de alerta à voz e simetria da mímica durante o choro espontâneo."),
      step("Movimento e coordenação", "Observe o bebê deitado antes de tocá-lo. Ofereça seu dedo à palma de cada mão.", "Postura, variedade e simetria dos movimentos espontâneos e da preensão palmar reflexa."),
      step("Interação e estado mental", "Peça ao cuidador que o acolha como costuma fazer quando ele desperta ou chora.", "Transição entre estados, qualidade do choro e resposta ao consolo. Registre se estava sonolento ou com fome."),
      ...infantExam,
    ],
  },
  {
    age: "28 dias a 2 meses",
    setup: "Com o bebê acordado e confortável, alterne rosto, voz e pausas.",
    steps: [
      step("Olhos, face e comunicação", "Apresente o rosto na linha média e desloque-o lentamente para cada lado.", "Fixação breve, deslocamento conjugado dos olhos, reação à voz e simetria facial."),
      step("Movimento e coordenação", "Em superfície firme, observe braços e pernas livres. Se tolerado, coloque-o de bruços, acordado e sob supervisão direta.", "Movimentos contra a gravidade, lados usados e tentativa de elevar ou girar a cabeça."),
      step("Interação e estado mental", "Converse de perto, faça uma pausa e espere sua vez.", "Mudança de expressão, vocalização, interesse e recuperação após o manuseio."),
      ...infantExam,
    ],
  },
  {
    age: "3 a 5 meses",
    setup: "Use o rosto do cuidador e um brinquedo grande, leve e lavável.",
    steps: [
      step("Olhos, face e comunicação", "Mova o brinquedo devagar pelo campo visual. Depois, fale de cada lado em volume habitual.", "Seguimento ocular, orientação ao som e simetria do sorriso."),
      step("Movimento e coordenação", "Ofereça o brinquedo na linha média e de cada lado, com o tronco apoiado conforme necessário.", "Controle da cabeça, abertura das mãos, tentativas de alcance e simetria dos braços."),
      step("Interação e estado mental", "Imite um som do bebê e aguarde. Repita acompanhando o ritmo dele.", "Trocas vocais, atenção ao rosto ou à voz e sinais de cansaço."),
      ...infantExam,
    ],
  },
  {
    age: "6 a 11 meses",
    setup: "Use uma bola macia e um pano. Comece na postura que o bebê já sustenta.",
    steps: [
      step("Olhos, face e comunicação", "Role a bola de um lado ao outro e convide o cuidador a chamá-lo.", "Seguimento em ambos os sentidos, orientação à voz e expressão facial."),
      step("Movimento e coordenação", "Ofereça a bola de cada lado e depois um segundo brinquedo. Deixe que mude de posição como costuma fazer.", "Alcance bilateral, transferência entre mãos, estabilidade do tronco e estratégias de deslocamento."),
      step("Interação e estado mental", "Brinque de esconder seu rosto atrás do pano. Faça uma pausa antes de reaparecer.", "Antecipação, busca, gestos, balbucio e tentativa de retomar a brincadeira."),
      ...infantExam,
    ],
  },
  {
    age: "12 a 17 meses",
    setup: "Sente-se no chão perto do cuidador. Separe uma bola e um pote grande.",
    steps: [
      step("Olhos, face e comunicação", "Role a bola para um lado e depois para o outro. Chame a criança quando estiver olhando para a bola.", "Orientação dos olhos e da cabeça, reação à voz e mímica."),
      step("Movimento e coordenação", "Convide a buscar a bola e colocá-la no pote. Permita engatinhar ou usar o apoio habitual.", "Transições, apoio dos pés, equilíbrio, alternância das mãos e soltura voluntária."),
      step("Interação e estado mental", "Estenda a mão e diga “me dá a bola”. Depois espere que a criança peça outra rodada.", "Compreensão com e sem gesto, iniciativa, vocalização e forma de compartilhar interesse."),
      ...playExam,
    ],
  },
  {
    age: "18 a 23 meses",
    setup: "Convide a criança a cuidar de um boneco com uma colher grande.",
    steps: [
      step("Olhos, face e comunicação", "Faça o boneco passear pelo campo visual e peça para mostrar a boca dele e a própria.", "Seguimento visual, compreensão da proposta e simetria facial ao imitar."),
      step("Movimento e coordenação", "Ponha o boneco em um banco baixo e a colher no chão. Convide a pegá-los e alimentar o boneco.", "Marcha habitual se adquirida, agachamento, retorno à postura e coordenação das duas mãos."),
      step("Interação e estado mental", "Diga “o bebê está com fome” e espere antes de mostrar o que fazer.", "Uso funcional ou simbólico, gestos e palavras, imitação e ajuda necessária."),
      ...playExam,
    ],
  },
  {
    age: "2 a 3 anos",
    setup: "Monte uma entrega de encomendas com caixa aberta e blocos grandes.",
    steps: [
      step("Olhos, face e comunicação", "Peça para seguir o bloco que “voa” e depois imitar um sorriso e a língua de fora.", "Movimentos oculares, simetria da face e mobilidade da língua, considerando a compreensão."),
      step("Movimento e coordenação", "Convide a levar a caixa, pegar blocos no chão e empilhá-los. Demonstre um chute em bola parada.", "Base da marcha, equilíbrio nas mudanças de posição, alcance e precisão manual."),
      step("Interação e estado mental", "Peça uma entrega simples e depois troque os papéis. Pergunte quem receberá o próximo bloco.", "Compreensão, iniciativa, combinação de palavras ou símbolos, atenção e reação à troca."),
      ...playExam,
    ],
  },
  {
    age: "4 a 5 anos",
    setup: "Diga “agora você é o mestre”. Revezem quem inventa o movimento.",
    steps: [
      step("Olhos, face e comunicação", "Faça caretas, infle as bochechas e mova um alvo para os lados e para cima e para baixo.", "Simetria facial, conjugação ocular, articulação e qualidade da voz."),
      step("Movimento e coordenação", "Proponha andar sobre uma linha, equilibrar-se em um pé com proteção e tocar seu dedo e o próprio nariz.", "Equilíbrio, ajuste de direção, precisão e diferenças entre lados."),
      step("Interação e estado mental", "Invente uma história curta com um boneco triste. Peça que continue e depois conte o começo.", "Organização da fala, atenção, evocação, expressão afetiva e distinção entre faz de conta e experiência."),
      ...playExam,
    ],
  },
  {
    age: "6 a 8 anos",
    setup: "Convide a criança a desenhar um mapa e percorrê-lo pela sala.",
    steps: [
      step("Olhos, face e comunicação", "Use seu dedo como alvo e peça que o siga só com os olhos. Compare visão de cada olho com figuras apropriadas.", "Alinhamento, excursão ocular, diferença visual entre olhos e compreensão da tarefa."),
      step("Movimento e coordenação", "Percorram o mapa na ponta dos pés e nos calcanhares, com proteção. Alterne palma e dorso da mão sobre a mesa.", "Marcha, força funcional distal, ritmo, coordenação e assimetria."),
      step("Interação e estado mental", "Peça para explicar o mapa, guardar três itens do percurso e lembrá-los ao final. Pergunte qual trecho foi divertido ou difícil.", "Atenção, entendimento, memória no contexto da tarefa, humor referido e afeto observado."),
      ...olderExam,
    ],
  },
  {
    age: "9 a 11 anos",
    setup: "Ofereça um desafio de sequência e deixe a criança escolher por onde começar.",
    steps: [
      step("Olhos, face e comunicação", "Compare visão de cada olho e campos por confrontação, demonstrando primeiro. Peça para erguer as sobrancelhas e mostrar os dentes.", "Acuidade com correção habitual, campos testáveis, motilidade e simetria facial."),
      step("Movimento e coordenação", "Demonstre marcha em tandem com proteção, oposição sequencial dos dedos e dedo-nariz dos dois lados.", "Base, oscilação, precisão, ritmo e consistência das diferenças entre lados."),
      step("Interação e estado mental", "Peça que ensine as regras de um jogo, adapte uma regra e conte como foi a semana. Retome um detalhe ao final.", "Sequência do pensamento, flexibilidade, evocação, preocupações e relação entre humor e expressão."),
      ...olderExam,
    ],
  },
  {
    age: "12 a 14 anos",
    setup: "Ofereça escolha entre demonstração e instrução verbal. Reserve um momento individual, explicando os limites do sigilo.",
    steps: [
      step("Olhos, face e comunicação", "Peça para acompanhar um alvo, identificar estímulos nos campos visuais e repetir uma frase. Pergunte sobre visão dupla.", "Motilidade, campos, articulação, voz e sintoma referido em cada posição."),
      step("Movimento e coordenação", "Com proteção ao lado, proponha marcha em tandem e giros. Compare força segmentar contra resistência e movimentos alternados rápidos.", "Distribuição da força, equilíbrio e velocidade ou irregularidade entre lados."),
      step("Interação e estado mental", "Converse sobre uma situação recente. Pergunte como se sentiu, o que passou pela cabeça e a quem recorreria.", "Aparência, psicomotricidade, atenção, humor, afeto, curso e conteúdo do pensamento e julgamento contextual."),
      ...olderExam,
    ],
  },
  {
    age: "15 a 19 anos",
    setup: "Combine o roteiro diretamente com o jovem, respeitando preferências e privacidade.",
    steps: [
      step("Olhos, face e comunicação", "Investigue sintomas visuais e bulbares. Examine campos, pupilas, motilidade ocular, face, voz, palato e língua conforme a queixa.", "Lateralidade, diplopia referida, disartria, disfonia e assimetrias objetivas."),
      step("Movimento e coordenação", "Explique cada etapa. Compare força proximal e distal, faça dedo-nariz e calcanhar-joelho e observe marcha habitual e em tandem, se segura.", "Padrão segmentar, dismetria, compensações e estabilidade nas mudanças de direção."),
      step("Interação e estado mental", "Explore um dilema real, seus planos e o impacto do humor no cotidiano. Pergunte em particular sobre experiências perceptivas, sofrimento e segurança.", "Organização do pensamento, percepção, orientação, crítica, julgamento e recursos de proteção."),
      ...olderExam,
    ],
  },
];
