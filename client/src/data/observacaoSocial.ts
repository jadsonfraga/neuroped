// Roteiros autorais de observação clínica. As faixas organizam as propostas de interação.
type Scene = [title: string, invitation: string, choices: string[], guide: string, observe: string, adaptation: string];
export const bands: [string, Scene[]][] = [
  ["12–17 meses", [
    [
      "Cesto de figuras",
      "Olha! Qual bichinho?",
      ["🐱 Gato", "🐦 Pássaro"],
      "Deixe as figuras ao alcance visual. Faça o som do animal que atraiu a criança e pare, mantendo o tablet junto ao cuidador.",
      "Depois do som, descreva para onde se orientou, se repetiu o som ou se tentou envolver alguém. Registre quem iniciou a troca.",
      "Se as figuras não despertarem interesse, use um bichinho familiar. O cuidador pode aproximá-lo sem conduzir a mão da criança."
    ],
    [
      "Ritmos em dupla",
      "Palma ou tchau?",
      ["👏 Palmas", "👋 Aceno"],
      "Peça ao cuidador que acompanhe um movimento da criança. Depois de uma breve sequência, ele repousa as mãos e espera.",
      "Registre o movimento inicial, o que o cuidador imitou e o que ocorreu na pausa, inclusive se a criança seguiu outro interesse.",
      "Se bater palmas for difícil, acompanhe um som, um movimento de pé ou uma expressão que ela já use."
    ],
    [
      "Dois caminhos",
      "Aqui ou ali?",
      ["🌳 Árvore", "🌼 Flor"],
      "Faça dois dedos passearem até a árvore. Pare no meio e deixe a criança indicar se o passeio continua ali ou vai até a flor.",
      "Descreva se acompanhou o percurso, indicou um destino, afastou o tablet ou precisou que os destinos fossem mostrados separadamente.",
      "Se a tela pequena dificultar a escolha, use dois objetos grandes e familiares sobre a mesa."
    ]
  ]],
  ["18–23 meses", [
    [
      "Janela do quintal",
      "Quem está aqui?",
      ["🐦 Ave", "🐈 Gato"],
      "Sente-se ao lado do cuidador. Mostre o quintal, acompanhe a figura que chamou atenção e deixe o cuidador fazer um comentário curto.",
      "Descreva se a criança aproximou a figura, fez um som dirigido ao cuidador ou continuou explorando sozinha após o comentário.",
      "Se não reconhecer o animal, o cuidador pode usar seu nome habitual ou mostrar um brinquedo conhecido."
    ],
    [
      "Tambor de mesa",
      "Bater ou abrir a mão?",
      ["🥁 Batida", "🖐️ Mão aberta"],
      "O cuidador reproduz uma batida ou um gesto iniciado pela criança e deixa a mão parada sobre a mesa. Aguarde sem pedir que repita.",
      "Registre como a troca recomeçou, quem retomou primeiro e se a criança mudou o ritmo ou encerrou a brincadeira.",
      "Se o som incomodar, faça o mesmo jogo abrindo e fechando as mãos em silêncio."
    ],
    [
      "Passeio do dedo",
      "Vamos até onde?",
      ["🌊 Água", "🌿 Folha"],
      "Deslize o dedo até a figura escolhida. Na volta, mostre a outra e deixe disponíveis os dois destinos.",
      "Registre como indicou repetir o destino, mudar ou parar, e se a segunda oferta foi percebida.",
      "Se arrastar o dedo for difícil, o adulto faz o percurso a partir de uma vocalização ou gesto."
    ]
  ]],
  ["24–29 meses", [
    [
      "Lanche de faz de conta",
      "Banana ou pão?",
      ["🍌 Banana", "🍞 Pão"],
      "Finja pegar o lanche escolhido e deixe a mão aberta perto do cuidador. Aguarde para ver quem a criança inclui na brincadeira.",
      "Descreva se levou o lanche a si, ofereceu ao outro ou indicou que o adulto deveria servir. Anote se houve demonstração anterior.",
      "Se o faz de conta não fizer sentido, use um prato e uma colher familiares, sem exigir que coma."
    ],
    [
      "Passos de bicho",
      "Quem vai andar?",
      ["🐢 Tartaruga", "🐇 Coelho"],
      "Faça a tartaruga andar com a mão e pare. Quando a criança iniciar um movimento, acompanhe o ritmo dela antes de oferecer outro turno.",
      "Registre se repetiu, variou, acompanhou o parceiro ou conduziu a mão dele. Indique a ajuda recebida.",
      "Se imitar com os dedos for difícil, movam juntos um animal de brinquedo, cada um à sua maneira."
    ],
    [
      "Casa do bicho",
      "Casa ou árvore?",
      ["🏠 Casa", "🌳 Árvore"],
      "Leve o bichinho ao lugar escolhido. Mostre a outra figura como um possível passeio e volte a oferecer os dois lugares.",
      "Descreva como a criança manteve ou mudou o destino e o que fez quando o adulto acolheu sua escolha.",
      "Use uma caixa aberta e um pano como destinos concretos se a cena na tela for abstrata."
    ]
  ]],
  ["30–35 meses", [
    [
      "Entrega especial",
      "O que vamos levar?",
      ["📦 Caixa", "🌷 Flor"],
      "Finja receber a caixa ou a flor. Convide a criança a mostrá-la a uma pessoa familiar que ainda não viu a escolha.",
      "Registre como aproximou a pessoa da descoberta, com gesto, entrega, palavra ou recurso de comunicação, e qual convite foi necessário.",
      "Se não houver parceiro familiar, o examinador pode receber a entrega após modelar uma vez."
    ],
    [
      "Cozinha em dupla",
      "Mexer ou servir?",
      ["🥣 Mexer", "🥄 Servir"],
      "Faça de conta que prepara algo na tigela. Siga a ação escolhida pela criança, pare e deixe a colher disponível para a próxima jogada.",
      "Descreva como a criança retomou a sequência, passou a vez ou mudou a receita depois da ação do parceiro.",
      "Ofereça utensílios vazios e deixe que ela escolha uma ação conhecida, mesmo fora das duas figuras."
    ],
    [
      "Lugar à mesa",
      "No prato ou na cesta?",
      ["🍽️ Prato", "🧺 Cesta"],
      "Coloque um alimento imaginário no destino indicado. Mostre o segundo recipiente e deixe a criança decidir onde colocar o próximo.",
      "Registre como expressou uma preferência, se precisou rever as opções e se quis encerrar.",
      "Se imaginar o alimento dificultar a tarefa, use um objeto grande de brinquedo que possa ser movido."
    ]
  ]],
  ["3 anos", [
    [
      "Jardim compartilhado",
      "O que vamos plantar?",
      ["🌻 Girassol", "🍓 Morango"],
      "A criança escolhe o que plantar. Faça uma covinha imaginária e espere que ela mostre ao parceiro onde colocar a semente.",
      "Registre como compartilhou o local ou a ideia e o que aconteceu quando o parceiro seguiu a indicação.",
      "Se apontar na tela for difícil, ofereça duas posições na mesa e aceite a direção indicada pelo corpo."
    ],
    [
      "Oficina de gestos",
      "Carro ou barco?",
      ["🚗 Carro", "🚤 Barco"],
      "Comece a construir a opção escolhida com um gesto. Deixe espaço para a criança acrescentar uma peça e incorpore a contribuição dela.",
      "Registre que ação cada pessoa acrescentou e se a criança retomou depois que o adulto usou sua ideia.",
      "Use blocos grandes ou objetos da sala se a construção no ar for pouco compreensível."
    ],
    [
      "Piquenique",
      "Onde vamos comer?",
      ["🌳 Jardim", "🏠 Sala"],
      "Monte o piquenique no local escolhido. Faça chuva com os dedos e convide a escolher se ficam, mudam ou guardam o lanche.",
      "Descreva como comunicou manter, mudar ou interromper a brincadeira e se a mudança foi compreendida.",
      "Mostre onde seria um abrigo e ofereça as opções por gesto se a pergunta verbal for longa."
    ]
  ]],
  ["4 anos", [
    [
      "Notícia da horta",
      "O que nasceu aqui?",
      ["🥕 Cenoura", "🌽 Milho"],
      "Finja colher a cenoura ou o milho. Convide a mostrar a descoberta a quem não viu e deixe o parceiro reagir com curiosidade.",
      "Registre como apresentou a descoberta e se acrescentou algo após o comentário do parceiro.",
      "Pode entregar a figura ou fazer o gesto de colher enquanto o adulto põe a ação em palavras."
    ],
    [
      "Loja em dupla",
      "Quer comprar ou vender?",
      ["🛍️ Comprar", "🏪 Vender"],
      "A criança escolhe um papel. Entre no outro e faça uma compra simples; espere que ela conduza uma parte da troca.",
      "Descreva a iniciativa de pedir, oferecer, entregar ou concluir a compra e qual ação ocorreu após o modelo.",
      "Uma peça pode representar a mercadoria. Aceite toda a troca por gestos, sem moedas ou contagem."
    ],
    [
      "Entrega no parque",
      "Vamos de quê?",
      ["🚲 Bicicleta", "🛒 Carrinho"],
      "Comece a entrega com o transporte escolhido. Ofereça outro meio para o trecho final, deixando o primeiro disponível.",
      "Registre se a criança manteve o transporte, aceitou a troca ou propôs outra forma e como comunicou a decisão.",
      "Percorra com a mão dois trajetos curtos para tornar concreto o que pode mudar."
    ]
  ]],
  ["5 anos", [
    [
      "Convite para brincar",
      "Quem vem brincar?",
      ["🐻 Urso", "🐰 Coelho"],
      "Depois da escolha, faça o parceiro entrar na cena e perguntar quem chegou. Deixe a criança apresentar o personagem como quiser.",
      "Descreva se apresentou o personagem, atribuiu uma ação ou convidou o parceiro a participar.",
      "O adulto pode segurar o personagem indicado se a criança preferir dirigir a cena sem manipulá-lo."
    ],
    [
      "Cena em dupla",
      "Praia ou bosque?",
      ["🏖️ Praia", "🌲 Bosque"],
      "Comece com uma ação curta no cenário escolhido. Espere o turno da criança e incorpore a contribuição dela à cena seguinte.",
      "Registre se a contribuição se ligou à anterior, abriu outra história ou dependeu de uma pista do parceiro.",
      "Represente a ação com os dedos ou figuras; a criança pode continuar movendo uma peça."
    ],
    [
      "Fantasia para a festa",
      "O que você quer usar?",
      ["🎩 Chapéu", "🧣 Lenço"],
      "Escolham acessórios para personagens fictícios. O parceiro pede uma troca uma vez e segue a decisão da criança.",
      "Descreva como expressou aceitar, recusar ou propor outro acordo e se conseguiu comunicar a escolha ao parceiro.",
      "Aponte os acessórios e ofereça sinais de sim e não; não é necessário vestir nenhum deles."
    ]
  ]],
  ["6 anos", [
    [
      "Clube de descobertas",
      "Que descoberta quer mostrar?",
      ["🦕 Fóssil", "🪐 Planeta"],
      "Escolha com a criança um detalhe do fóssil ou do planeta. Peça que o mostre ao parceiro, que pode comentar o que percebeu.",
      "Registre que detalhe ela destacou, como orientou a atenção do parceiro e se retomou a descoberta após o comentário.",
      "Se o tema for desconhecido, use um objeto de interesse que a criança queira apresentar."
    ],
    [
      "Mapa a dois",
      "Onde começa o caminho?",
      ["🌉 Ponte", "⛰️ Morro"],
      "Trace uma ponte ou um morro como início. A criança acrescenta um lugar e o parceiro liga os dois, deixando que ela indique o próximo trecho.",
      "Descreva como incorporou ou alterou a ligação proposta e de quem partiu a continuação.",
      "Use uma folha e dois objetos para marcar os lugares se for difícil acompanhar o mapa imaginário."
    ],
    [
      "Recreio com escolhas",
      "O que vamos fazer no recreio?",
      ["🖍️ Desenho", "⚽ Bola"],
      "Cada pessoa escolhe uma atividade. Diga sua preferência e convide a criança a combinar como usar o tempo de recreio.",
      "Registre se comunicou a própria escolha, perguntou sobre a outra ou propôs brincar separadamente ou em sequência.",
      "Represente duas rodadas com dois espaços na mesa para que possa organizar as escolhas sem falar."
    ]
  ]],
  ["7 anos", [
    [
      "Museu de bolso",
      "O que vai para o museu?",
      ["🐚 Concha", "🪨 Pedra"],
      "A criança escolhe a peça. Faça o papel de visitante e pergunte qual detalhe vale observar; siga a indicação que receber.",
      "Registre como mostrou o detalhe e se ajustou a explicação quando o visitante olhou para outra parte.",
      "Se a figura for insuficiente, use uma peça real segura e deixe o participante aproximá-la do visitante."
    ],
    [
      "Trilha cooperativa",
      "Quer guiar ou procurar?",
      ["🗺️ Guiar", "🔎 Procurar"],
      "Combine uma busca de faz de conta. Quem guia dá uma pista e quem procura indica um destino; ofereça a troca de papéis.",
      "Descreva o que fez no próprio turno e como reagiu a uma pista ou a um pedido de esclarecimento.",
      "Marque dois destinos visíveis e aceite pistas por apontar ou posicionar uma peça."
    ],
    [
      "Jogo adaptado",
      "Alternar ou jogar juntos?",
      ["🔄 Alternar", "🤝 Em dupla"],
      "Joguem uma rodada curta com a regra escolhida. Ofereça uma rodada com outra regra e aguarde a decisão antes de começar.",
      "Registre como expressou manter, experimentar ou negociar a regra e se foi preciso demonstrá-la.",
      "Demonstre cada regra com duas peças, evitando que a compreensão dependa da palavra “alternar”."
    ]
  ]],
  ["8 anos", [
    [
      "Dica para o colega",
      "O que você quer ensinar?",
      ["🧩 Quebra-cabeça", "🪁 Pipa"],
      "Faça o papel de colega iniciante. Peça uma primeira dica sobre a atividade escolhida e tente segui-la; deixe a criança corrigir sua tentativa.",
      "Registre que pista ofereceu e como complementou ou modificou a explicação diante de uma dúvida concreta.",
      "Deixe mostrar um movimento ou organizar peças; escolha outro tema se nenhum for familiar."
    ],
    [
      "Quadrinho em dupla",
      "Quem entra na história?",
      ["🤖 Robô", "🐉 Dragão"],
      "A criança cria a primeira ação do robô ou do dragão. O parceiro acrescenta um acontecimento e devolve a vez para decidir o desfecho.",
      "Descreva a ligação entre os turnos e se a criança aceitou, transformou ou preferiu descartar o acontecimento.",
      "Disponha três espaços para começo, meio e fim, preenchidos por desenho, palavra ou gesto."
    ],
    [
      "Passeio com chuva",
      "Onde vamos brincar?",
      ["🏟️ Quadra", "🏡 Varanda"],
      "Após a escolha entre quadra e varanda, introduza chuva na história. Deixe a criança mostrar o que ainda funciona e o que gostaria de mudar.",
      "Registre se solicitou informação, ajustou a brincadeira ou manteve o plano com uma condição.",
      "Mostre os dois locais e indique qual tem cobertura se esse detalhe for necessário para entender a cena."
    ]
  ]],
  ["9 anos", [
    [
      "Guia da escola",
      "O que mostrar ao visitante?",
      ["📚 Biblioteca", "🌱 Horta"],
      "Seja o visitante. Peça que a criança escolha um local e mostre algo sobre ele. Faça uma pergunta ligada ao que ela acabou de apresentar.",
      "Descreva como conduziu a visita e se respondeu à curiosidade do visitante ou redirecionou a conversa.",
      "Use um lugar que conheça bem se biblioteca ou horta forem experiências pouco familiares."
    ],
    [
      "Dupla de repórteres",
      "Quer perguntar ou responder?",
      ["🎙️ Perguntar", "💬 Responder"],
      "Escolham um assunto familiar. Façam uma pergunta e uma resposta, depois ofereça trocar os papéis e retomar algo que foi dito.",
      "Registre quem introduziu o assunto e se a pergunta seguinte aproveitou a resposta do parceiro, com ou sem apoio.",
      "Disponibilize os inícios “quem”, “onde” e “como”, que podem ser apontados ou completados pelo parceiro."
    ],
    [
      "Regras de equipe",
      "Sorteio ou escolha?",
      ["🎲 Sorteio", "✋ Escolha"],
      "Formem dois times imaginários. O parceiro prefere outro modo de divisão; peça que a criança diga ou mostre como gostaria de resolver.",
      "Registre as propostas de ambos e o que mudou após ouvir a preferência do parceiro.",
      "Use figuras neutras para formar os times, sem escolher colegas reais."
    ]
  ]],
  ["10 anos", [
    [
      "Curadoria da turma",
      "Música ou jogos para a turma?",
      ["🎵 Música", "🎮 Jogos"],
      "Convide a apresentar uma indicação à turma fictícia. Faça um comentário específico sobre a escolha e espere a pessoa conduzir a continuação.",
      "Registre como chamou a atenção para sua indicação e o que acrescentou diante do interesse do interlocutor.",
      "Aceite uma capa desenhada ou palavras-chave se falar diante de uma turma imaginária for desconfortável."
    ],
    [
      "Projeto em dupla",
      "Ilustrar ou entrevistar?",
      ["🎨 Ilustração", "💬 Entrevista"],
      "Escolham papéis para produzir uma página em dupla. Peça que combinem o que uma pessoa precisa receber da outra para começar.",
      "Registre como pediu informação, ofereceu sua parte ou ajustou o plano quando o parceiro fez uma sugestão.",
      "Esboce duas colunas com os papéis e permita organizar as tarefas apontando."
    ],
    [
      "Troca de local",
      "Onde o grupo se encontra?",
      ["📚 Biblioteca", "🌳 Praça"],
      "Combinem um encontro fictício. Informe que o primeiro local fechou e convide a pessoa a decidir o que gostaria de perguntar ao grupo.",
      "Registre qual informação buscou, como comunicou outra opção ou por que preferiu adiar a decisão.",
      "Mostre os locais e disponibilize a resposta “preciso saber mais”."
    ]
  ]],
  ["11 anos", [
    [
      "Tutorial curto",
      "Jogo ou desenho para ensinar?",
      ["🎮 Jogo", "🖊️ Desenho"],
      "Peça que demonstre o primeiro passo de algo que conhece. Execute esse passo e indique exatamente onde surgiu sua dúvida.",
      "Registre como mostrou, verificou ou reformulou a instrução e o apoio necessário para continuar.",
      "Aceite uma demonstração silenciosa e permita que o participante indique o seu próximo movimento."
    ],
    [
      "Roteiro de áudio",
      "Voz ou som de abertura?",
      ["🎤 Voz", "🎵 Som"],
      "Criem a abertura de um programa fictício. Faça uma contribuição e convide a decidir quando a parte de cada um entra.",
      "Descreva como sinalizou a vez, retomou a contribuição alheia ou sugeriu outra sequência.",
      "Os sons podem ser representados por cartões e gestos; dispense gravação e reprodução de áudio."
    ],
    [
      "Feira da turma",
      "Tarefas ou horário primeiro?",
      ["📋 Tarefas", "🕒 Horário"],
      "Combine a abertura de uma banca. Informe que a feira começará mais cedo e peça para escolher um detalhe que precisa ser revisto.",
      "Registre a primeira dúvida ou proposta e como combinou com o parceiro quem faria o ajuste.",
      "Use uma linha com “antes” e “depois” caso ler horários dificulte acompanhar a conversa."
    ]
  ]],
  ["12 anos", [
    [
      "Seleção de mídia",
      "Que história ou música indicar?",
      ["📖 História", "🎧 Música"],
      "Faça o papel de alguém que desconhece a escolha. Convide a apresentar um detalhe que ajude você a decidir se quer conhecê-la.",
      "Descreva como escolheu o detalhe e se buscou ou utilizou alguma reação do interlocutor.",
      "Pode usar título, trecho descrito ou ilustração; ofereça trocar a mídia por outro interesse."
    ],
    [
      "Grupo de trabalho",
      "Pesquisar ou ilustrar?",
      ["🔎 Pesquisar", "🖼️ Ilustrar"],
      "Escolham papéis para uma apresentação. O parceiro propõe começar pela imagem; convide a combinar uma ordem que funcione para ambos.",
      "Registre a proposta inicial, como respondeu à sugestão e se pediu esclarecer o que cada papel envolve.",
      "Disponha cartões com as duas ações para que possam ordená-las em conjunto."
    ],
    [
      "Convite ambíguo",
      "Que detalhe quer combinar?",
      ["📍 Onde", "🕒 Quando"],
      "Diga “vamos nos encontrar depois da aula?” e aguarde. Responda ao detalhe solicitado e deixe a pessoa aceitar, recusar ou seguir perguntando.",
      "Registre se pediu local, horário ou outra informação e como usou a resposta para decidir.",
      "Ofereça o convite por escrito ou CAA e indique que a pessoa pode responder mais tarde."
    ]
  ]],
  ["13 anos", [
    [
      "Canal de interesses",
      "Foto ou vídeo para compartilhar?",
      ["🎞️ Vídeo", "📷 Foto"],
      "Imagine um canal sobre um assunto escolhido pela pessoa. Peça que apresente uma ideia de postagem e comente o detalhe que lhe chamou atenção.",
      "Descreva como introduziu o interesse e se expandiu, abreviou ou mudou o assunto após seu comentário.",
      "Permita esboçar a postagem ou descrevê-la; dispense abrir perfis e mídias pessoais."
    ],
    [
      "Criação coletiva",
      "Texto ou imagem primeiro?",
      ["📝 Texto", "🎨 Imagem"],
      "Combinem uma publicação fictícia. Ofereça uma ideia para sua parte e peça que o parceiro mostre como as duas partes se ligam.",
      "Registre como respondeu à sua ideia e que ajuste cada um fez para construir o resultado conjunto.",
      "Uma folha com espaços para texto e imagem permite apontar, rascunhar ou ditar as mudanças."
    ],
    [
      "Mudança no grupo",
      "Mensagem ou conversa?",
      ["💬 Mensagem", "🤝 Conversa"],
      "Um grupo fictício mudou o ponto de encontro. Peça que escolha um meio para checar o novo plano e encene a resposta de um colega.",
      "Registre como expressou dúvida ou desconforto e se pediu outro detalhe após a resposta.",
      "Ofereça um diálogo escrito em papel, sem precisar enviar mensagem real."
    ]
  ]],
  ["14 anos", [
    [
      "Recomendação pessoal",
      "Áudio ou filme para indicar?",
      ["🎧 Áudio", "🎬 Filme"],
      "Dê uma preferência concreta do interlocutor, como gostar de histórias curtas. Convide a recomendar algo e explique o que despertou sua curiosidade.",
      "Descreva se explorou a preferência, explicou sua escolha ou negociou outra indicação quando recebeu retorno.",
      "Aceite palavras-chave, símbolos ou uma indicação alternativa se nenhum dos formatos for familiar."
    ],
    [
      "Decisão compartilhada",
      "Evento ou podcast em dupla?",
      ["🎪 Evento", "🎙️ Podcast"],
      "Escolham um projeto curto. Cada um indica a parte que quer assumir; se houver sobreposição, convide a decidir juntos o primeiro passo.",
      "Registre como manifestou a própria preferência e se respondeu à proposta de repartir ou alternar papéis.",
      "Desenhe duas colunas para as responsabilidades. O participante pode mover cartões ou ditar a distribuição."
    ],
    [
      "Mudança combinada",
      "Ajustar o horário ou o local?",
      ["🕒 Horário", "📍 Local"],
      "Num encontro fictício, proponha alterar um único detalhe. Deixe a pessoa informar se isso funciona e que condição facilitaria participar.",
      "Registre qual detalhe precisou confirmar, se manteve o combinado anterior ou propôs uma condição própria.",
      "Mantenha visíveis o combinado inicial e a proposta para reduzir a demanda de memória."
    ]
  ]],
  ["15 anos", [
    [
      "Clube de interesses",
      "Um jogo ou uma faixa para apresentar?",
      ["🎲 Jogo", "🎵 Faixa musical"],
      "Peça uma apresentação breve de algo escolhido pela pessoa. Conte uma experiência relacionada e aguarde o rumo que ela dá à conversa.",
      "Registre se retomou sua experiência, fez pergunta ou seguiu desenvolvendo o próprio interesse e em que contexto.",
      "Permita anotar ou apontar a parte mais importante antes de iniciar; dispense tocar música."
    ],
    [
      "Divisão de tarefas",
      "Planejar ou registrar o projeto?",
      ["📋 Planejar", "🎥 Registrar"],
      "Organizem um projeto fictício. Depois da divisão inicial, o parceiro pede ajuda com uma tarefa definida. Deixe espaço para negociar limites.",
      "Registre como ofereceu ajuda, pediu detalhes ou recusou e o que o parceiro precisou esclarecer.",
      "Use uma lista curta e permita indicar o que aceita, o que delega e o que prefere deixar em aberto."
    ],
    [
      "Convite de última hora",
      "Reagendar ou conversar sobre o convite?",
      ["📆 Reagendar", "💬 Conversar"],
      "Apresente um convite fictício para o mesmo dia. Responda como um colega à primeira reação e permita encerrar a troca sem justificativa.",
      "Descreva como comunicou disponibilidade, pediu tempo, recusou ou ofereceu alternativa após sua resposta.",
      "Ofereça o convite por escrito com a opção de responder depois, sem exigir improviso oral."
    ]
  ]],
  ["16 anos", [
    [
      "Oficina para iniciantes",
      "O que vale mostrar a um iniciante?",
      ["📸 Fotografia", "💻 Tecnologia"],
      "Peça uma dica prática no tema escolhido. Como iniciante, tente segui-la e diga qual parte precisa ver novamente.",
      "Registre como selecionou o detalhe e se adaptou a explicação à dúvida que você expressou.",
      "Pode apontar controles de um objeto fictício ou fazer um esquema, sem usar aparelho pessoal."
    ],
    [
      "Projeto voluntário",
      "Organizar materiais ou acolher quem chega?",
      ["🗂️ Organizar", "🤝 Acolher"],
      "Escolham uma ação voluntária fictícia. Expresse sua preferência por uma tarefa e combinem como uma pessoa avisa à outra que precisa de ajuda.",
      "Descreva como propôs dividir a tarefa e que sinal ou canal de ajuda combinou com o parceiro.",
      "Disponha a sequência em duas etapas e deixe que escreva, aponte ou dite o acordo."
    ],
    [
      "Alteração no trajeto",
      "Consultar o mapa ou avisar alguém?",
      ["🗺️ Mapa", "💬 Contato"],
      "Imagine que uma parada está fechada. Ofereça um esquema de percurso e um contato fictício; peça que escolha por onde começar.",
      "Registre como comunicou o que precisava saber e se reviu a decisão após receber essa informação.",
      "Use nomes fictícios e explique o esquema. Se transporte público for desconhecido, use um caminho familiar."
    ]
  ]],
  ["17 anos", [
    [
      "Visita a um curso",
      "Que espaço quer conhecer?",
      ["🔬 Laboratório", "🎨 Ateliê"],
      "Como anfitrião, apresente duas áreas e aguarde a escolha. Convide a indicar o que gostaria de ver ali e responda a partir do interesse expresso.",
      "Registre como iniciou a visita e como orientou o anfitrião para o aspecto que lhe interessava.",
      "Troque o curso por uma oficina de interesse e aceite uma pergunta escrita ou indicada por símbolo."
    ],
    [
      "Preparação de evento",
      "Divulgação ou agenda?",
      ["📢 Divulgação", "🗓️ Agenda"],
      "Planejem um evento pequeno. Ofereça cuidar da outra parte e combinem que informação deve passar de uma pessoa à outra antes de divulgar.",
      "Registre como coordenou as duas responsabilidades, solicitou confirmação ou identificou uma pendência.",
      "Use cartões de “quem”, “o quê” e “quando” para tornar visível a divisão acordada."
    ],
    [
      "Prazo revisto",
      "Rever a data ou a entrega?",
      ["📅 Data", "📦 Entrega"],
      "Um parceiro fictício pede antecipar a entrega. Deixe a pessoa expor o que seria viável e responda à condição ou ao limite comunicado.",
      "Descreva se pediu detalhes, renegociou a data, reduziu a entrega ou manteve o acordo e como fez isso.",
      "Mantenha as duas datas à vista e deixe redigir uma resposta curta ou ditá-la."
    ]
  ]],
  ["18 anos", [
    [
      "Apresentação a um grupo",
      "Começar por um interesse ou um projeto?",
      ["🎯 Interesse", "🛠️ Projeto"],
      "Imagine o primeiro encontro de um grupo escolhido pela pessoa. Convide a compartilhar apenas o que desejar e faça um comentário ligado ao tema.",
      "Registre como iniciou ou delimitou a apresentação e que uso fez do retorno do interlocutor.",
      "Pode usar um exemplo fictício, uma frase preparada ou CAA, preservando o controle sobre o que revela."
    ],
    [
      "Organização de encontro",
      "Local ou transporte primeiro?",
      ["📍 Local", "🚌 Transporte"],
      "Planejem uma saída fictícia. Cada um informa uma preferência e vocês combinam um detalhe que permita aos dois participar.",
      "Registre como buscou a preferência do outro e como expressou necessidades de acesso, transporte ou horário, se surgirem.",
      "Disponha as opções em texto ou símbolos e deixe comparar apenas um detalhe por vez."
    ],
    [
      "Compromissos simultâneos",
      "Ajustar o horário ou pedir apoio?",
      ["🕒 Horário", "🤝 Apoio"],
      "Apresente dois compromissos fictícios que se sobrepõem. Convide a escolher com quem negociaria primeiro e encene a resposta dessa pessoa.",
      "Registre a prioridade que comunicou e como manteve ou ajustou a proposta diante da resposta.",
      "Mostre a sobreposição em uma agenda simples; permita responder por escrito ou adiar a decisão."
    ]
  ]],
  ["19 anos", [
    [
      "Troca entre colegas",
      "Sobre o que quer conversar?",
      ["📚 Estudo", "🎭 Lazer"],
      "Como colega, inicie uma conversa sobre estudo ou lazer e siga o tema escolhido. Faça uma contribuição própria e deixe espaço para a pessoa conduzir o próximo turno.",
      "Descreva como abriu espaço para o interlocutor, aprofundou seu tema ou encerrou a troca e quais apoios utilizou.",
      "Ofereça conversa escrita ou escolha de um assunto fictício sem pedir exposição da vida pessoal."
    ],
    [
      "Projeto com autonomia",
      "Começar pelo objetivo ou pelo prazo?",
      ["📋 Escopo", "🗓️ Cronograma"],
      "Planejem uma atividade de interesse comum. Declare um limite concreto de tempo e combinem como repartir responsabilidades antes de iniciar.",
      "Registre como explicitou prioridades, pediu sua perspectiva e confirmou ou revisou o acordo.",
      "Escrevam o objetivo e o prazo lado a lado; o participante pode editar a proposta por gesto, texto ou CAA."
    ],
    [
      "Revisão de acordo",
      "Retomar por escrito ou em conversa?",
      ["💬 Por escrito", "🤝 Em conversa"],
      "Um parceiro fictício propõe alterar algo que vocês já tinham combinado. Deixe a pessoa escolher o canal e conduzir a resposta; acolha manter ou encerrar o acordo.",
      "Registre qual condição quis preservar, que esclarecimento solicitou e como indicou que a negociação estava concluída ou ainda aberta.",
      "Mostre uma versão breve do acordo inicial e dê tempo para preparar uma resposta pelo canal escolhido."
    ]
  ]]
];
export const domains = [
  ["Atenção compartilhada e iniciativa", "Observe como dirige a atenção do parceiro ou compartilha interesse, inclusive por gestos, sons, fala ou CAA."],
  ["Reciprocidade e turnos", "Descreva como inicia, acompanha, modifica ou encerra a troca e quais apoios facilitam a participação."],
  ["Flexibilidade e preferências", "Descreva como comunica preferências, mantém ou varia a proposta. Registre repetições ou desconforto sensorial apenas se observados. Interrompa se houver desconforto."]
];
