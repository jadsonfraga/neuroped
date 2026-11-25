// Cada cena reúne um convite, opções visuais e uma intervenção do parceiro.
type Scene = [title: string, invitation: string, choices: string[], guide: string];
export const bands: [string, Scene[]][] = [
  ["12–17 meses", [
    ["Cesto de figuras", "Qual vamos descobrir?", ["🐱 Gato", "🐦 Pássaro"], "Acompanhe o foco da criança e imite suavemente o animal escolhido. Faça uma pausa e acolha qualquer iniciativa."],
    ["Ritmos em dupla", "Vamos brincar?", ["👏 Palmas", "👋 Aceno"], "Convide o cuidador a acompanhar um movimento escolhido pela criança. Deixe espaço para ela repetir, variar ou encerrar."],
    ["Dois caminhos", "Por onde vamos?", ["🌳 Árvore", "🌼 Flor"], "Passeie com o dedo até uma figura. Ofereça a outra como possibilidade, mantendo a primeira disponível."]
  ]],
  ["18–23 meses", [
    ["Janela do quintal", "O que apareceu?", ["🐦 Ave", "🐈 Gato"], "Acompanhe o interesse da criança. Convide o cuidador a comentar a figura e aguarde uma iniciativa dirigida a ele."],
    ["Tambor de mesa", "Como brincar?", ["🥁 Batida", "🖐️ Mão aberta"], "O cuidador acompanha um som ou gesto da criança e faz uma pausa. Aceite a continuação por movimento, vocalização ou aproximação."],
    ["Passeio do dedo", "Onde passear?", ["🌊 Água", "🌿 Folha"], "Percorra o primeiro destino no tablet e ofereça o segundo. Observe como a criança aceita, mantém ou encerra o passeio."]
  ]],
  ["24–29 meses", [
    ["Lanche de faz de conta", "O que oferecer?", ["🍌 Banana", "🍞 Pão"], "Convide a oferecer o lanche imaginário ao cuidador. Aguarde e acompanhe a forma escolhida para incluí-lo."],
    ["Passos de bicho", "Quem anda agora?", ["🐢 Tartaruga", "🐇 Coelho"], "Imite o animal com a mão. Deixe que a criança conduza o próximo turno, inclusive repetindo o movimento."],
    ["Casa do bicho", "Onde ele fica?", ["🏠 Casa", "🌳 Árvore"], "Mova a mão até o lugar escolhido. Convide a experimentar outro destino e aceite manter a primeira ideia."]
  ]],
  ["30–35 meses", [
    ["Entrega especial", "O que chegou?", ["📦 Caixa", "🌷 Flor"], "Ofereça uma entrega de faz de conta para a criança apresentar a uma pessoa familiar. Aguarde sua iniciativa."],
    ["Cozinha em dupla", "O que fazer juntos?", ["🥣 Mexer", "🥄 Servir"], "Siga uma ação da criança na cozinha imaginária e faça uma pausa para ela propor o próximo passo."],
    ["Lugar à mesa", "Onde colocar?", ["🍽️ Prato", "🧺 Cesta"], "Convide a escolher onde pôr o alimento imaginário. Ofereça a outra possibilidade e acolha a preferência."]
  ]],
  ["3 anos", [
    ["Jardim compartilhado", "O que plantamos juntos?", ["🌻 Girassol", "🍓 Morango"], "Convide a criança a mostrar ao parceiro o que plantar. Comente a escolha e aguarde a continuação."],
    ["Oficina de gestos", "O que vamos construir?", ["🚗 Carro", "🚤 Barco"], "Faça uma parte da construção no ar. Convide a criança a acrescentar outra e imite sua contribuição."],
    ["Piquenique", "Onde vai ser?", ["🌳 Jardim", "🏠 Sala"], "Após a escolha, proponha imaginar um dia de chuva. Pergunte se prefere manter o local, mudar ou parar."]
  ]],
  ["4 anos", [
    ["Notícia da horta", "O que nasceu?", ["🥕 Cenoura", "🌽 Milho"], "Proponha contar ou mostrar a descoberta ao parceiro. Observe como o inclui e se retoma após o comentário dele."],
    ["Loja em dupla", "Quem começa?", ["🛍️ Comprar", "🏪 Vender"], "Cada pessoa escolhe um papel. Aguarde como a criança abre, responde ou encerra a troca."],
    ["Entrega no parque", "Como levar?", ["🚲 Bicicleta", "🛒 Carrinho"], "Proponha uma entrega imaginária e ofereça outra forma de transporte. A criança pode manter seu plano."]
  ]],
  ["5 anos", [
    ["Convite para brincar", "Quem vamos convidar?", ["🐻 Urso", "🐰 Coelho"], "Peça que mostre a um parceiro quem entrou na brincadeira. Acompanhe como apresenta o personagem."],
    ["Cena em dupla", "Onde começa?", ["🏖️ Praia", "🌲 Bosque"], "Cada pessoa acrescenta uma ação à história. Descreva como a criança acolhe, transforma ou ignora a contribuição."],
    ["Fantasia para a festa", "Qual acessório?", ["🎩 Chapéu", "🧣 Lenço"], "Imagine que um colega deseja trocar um acessório. Convide a expressar uma preferência e aceite a recusa."]
  ]],
  ["6 anos", [
    ["Clube de descobertas", "O que quer mostrar?", ["🦕 Fóssil", "🪐 Planeta"], "Peça que mostre algo interessante ao parceiro. Responda ao que comunicou e dê tempo para retomar."],
    ["Mapa a dois", "Onde começa nosso mapa?", ["🌉 Ponte", "⛰️ Morro"], "Cada pessoa acrescenta um lugar ao mapa imaginário. Observe como combina as contribuições."],
    ["Recreio com escolhas", "Qual atividade vamos propor?", ["🖍️ Desenho", "⚽ Bola"], "O parceiro propõe outra atividade. Convide a combinar um plano que comporte as preferências de ambos."]
  ]],
  ["7 anos", [
    ["Museu de bolso", "O que expor?", ["🐚 Concha", "🪨 Pedra"], "O parceiro desconhece o objeto. Convide a apontar ou demonstrar o que merece atenção."],
    ["Trilha cooperativa", "Quem faz o quê?", ["🗺️ Guiar", "🔎 Procurar"], "Combine papéis em uma busca imaginária. Faça sua parte e dê espaço para a próxima iniciativa."],
    ["Jogo adaptado", "Qual regra combinar?", ["🔄 Alternar", "🤝 Em dupla"], "Ofereça uma regra diferente para uma rodada fictícia. Pergunte como gostaria de jogar e acolha alternativas."]
  ]],
  ["8 anos", [
    ["Dica para o colega", "O que ensinar?", ["🧩 Quebra-cabeça", "🪁 Pipa"], "Peça uma dica sobre a atividade escolhida. Faça uma pergunta concreta e observe como a pessoa responde ao seu interesse."],
    ["Quadrinho em dupla", "Qual personagem entra?", ["🤖 Robô", "🐉 Dragão"], "Acrescentem uma ação por vez. Deixe que a criança indique, desenhe no ar ou narre o próximo acontecimento."],
    ["Passeio com chuva", "Onde brincar?", ["🏟️ Quadra", "🏡 Varanda"], "Imagine chuva no local combinado. Convide a manter, adaptar ou trocar o plano e a dizer o que ajudaria."]
  ]],
  ["9 anos", [
    ["Guia da escola", "O que mostrar primeiro?", ["📚 Biblioteca", "🌱 Horta"], "Faça o papel de visitante. Observe como a criança seleciona o que compartilhar e responde à curiosidade do parceiro."],
    ["Dupla de repórteres", "Quem começa?", ["🎙️ Perguntar", "💬 Responder"], "Alternem papéis numa entrevista sobre um interesse escolhido. Ofereça apoio para formular a pergunta."],
    ["Regras de equipe", "Como dividir?", ["🎲 Sorteio", "✋ Escolha"], "Apresente outra preferência para formar equipes. Convide a combinar uma solução aceitável para ambos."]
  ]],
  ["10 anos", [
    ["Curadoria da turma", "Qual tema apresentar?", ["🎵 Música", "🎮 Jogos"], "Convide a apresentar o tema como preferir. Faça um comentário genuíno e aguarde a resposta."],
    ["Projeto em dupla", "Que parte você quer assumir?", ["🎨 Ilustração", "💬 Entrevista"], "Assuma o outro papel. Combine como juntar as partes e acolha pedidos de esclarecimento."],
    ["Troca de local", "Onde encontrar o grupo?", ["📚 Biblioteca", "🌳 Praça"], "Imagine que o local escolhido está fechado. Convide a negociar uma alternativa ou pedir mais informações."]
  ]],
  ["11 anos", [
    ["Tutorial curto", "O que demonstrar?", ["🎮 Jogo", "🖊️ Desenho"], "Convide a ensinar um passo ao parceiro, que pode pedir esclarecimento. A demonstração pode ser inteiramente gestual."],
    ["Roteiro de áudio", "Como contribuir?", ["🎤 Voz", "🎵 Som"], "Construam juntos uma abertura imaginária. Faça uma contribuição e espere a resposta ou contraproposta."],
    ["Feira da turma", "Como reorganizar?", ["📋 Tarefas", "🕒 Horário"], "Imagine uma mudança de horário da feira. Convide a escolher o que rever e que informação pedir."]
  ]],
  ["12 anos", [
    ["Seleção de mídia", "O que indicar?", ["📖 História", "🎧 Música"], "Convide a apresentar uma escolha a alguém que desconhece o tema. Observe como percebe ou solicita retorno."],
    ["Grupo de trabalho", "Qual papel assumir?", ["🔎 Pesquisar", "🖼️ Ilustrar"], "Negociem a ordem das contribuições. Dê uma sugestão e aguarde a resposta sem completar pela pessoa."],
    ["Convite ambíguo", "O que perguntar?", ["📍 Onde", "🕒 Quando"], "Apresente um convite com detalhes em aberto. Acolha pedidos de informação, propostas ou a decisão de recusar."]
  ]],
  ["13 anos", [
    ["Canal de interesses", "O que compartilhar?", ["🎞️ Vídeo", "📷 Foto"], "Convide a selecionar um assunto e perguntar se o parceiro quer saber mais, ou compartilhá-lo de outra forma."],
    ["Criação coletiva", "Qual parte preparar?", ["📝 Texto", "🎨 Imagem"], "Combinem duas contribuições para uma publicação fictícia. Descreva a negociação e a retomada após uma sugestão."],
    ["Mudança no grupo", "O que combinar?", ["💬 Mensagem", "🤝 Conversa"], "Imagine que o grupo mudou o combinado. Convide a escolher como esclarecer o plano ou manifestar desconforto."]
  ]],
  ["14 anos", [
    ["Recomendação pessoal", "O que vale recomendar?", ["🎧 Áudio", "🎬 Filme"], "Convide a recomendar algo a alguém com interesses diferentes. Ofereça uma pista sobre o interlocutor."],
    ["Decisão compartilhada", "O que organizar juntos?", ["🎪 Evento", "🎙️ Podcast"], "Apresente uma preferência própria e convide a negociar papéis. Permita escrever, apontar ou usar CAA."],
    ["Mudança combinada", "O que podemos ajustar?", ["🕒 Horário", "📍 Local"], "Em um encontro fictício, sugira uma mudança e pergunte o que ajudaria. Considere a justificativa e os apoios escolhidos."]
  ]],
  ["15 anos", [
    ["Clube de interesses", "O que apresentar?", ["🎲 Jogo", "🎵 Faixa musical"], "Converse sobre algo de interesse da pessoa. Comente sua própria experiência e aguarde como ela conduz a troca."],
    ["Divisão de tarefas", "O que assumir?", ["📋 Planejar", "🎥 Registrar"], "Negociem papéis em um projeto escolhido. Observe como pede, oferece ou recusa ajuda."],
    ["Convite de última hora", "Como responder?", ["📆 Reagendar", "💬 Conversar"], "Apresente um convite inesperado e permita aceitar, recusar ou negociar condições."]
  ]],
  ["16 anos", [
    ["Oficina para iniciantes", "Que tema escolher?", ["📸 Fotografia", "💻 Tecnologia"], "Convide a apresentar algo que um iniciante talvez desconheça. Mostre uma dúvida genuína e aguarde a reação."],
    ["Projeto voluntário", "Como colaborar?", ["🗂️ Organizar", "🤝 Acolher"], "Planejem juntos uma tarefa fictícia, considerando uma preferência de cada participante."],
    ["Alteração no trajeto", "O que consultar?", ["🗺️ Mapa", "💬 Contato"], "Apresente uma mudança fictícia de percurso. Convide a buscar apoio ou propor outra combinação."]
  ]],
  ["17 anos", [
    ["Visita a um curso", "O que quer conhecer?", ["🔬 Laboratório", "🎨 Ateliê"], "Faça o papel de anfitrião. Deixe que a pessoa indique o próprio interesse e escolha como iniciar a conversa."],
    ["Preparação de evento", "Qual papel prefere?", ["📢 Divulgação", "🗓️ Agenda"], "Proponha montar juntos um evento de interesse. Negociem responsabilidades e descreva os apoios utilizados."],
    ["Prazo revisto", "O que negociar?", ["📅 Data", "📦 Entrega"], "Imagine que o grupo antecipou um prazo. Convide a comunicar limites e sugerir condições possíveis."]
  ]],
  ["18 anos", [
    ["Apresentação a um grupo", "Por onde começar?", ["🎯 Interesse", "🛠️ Projeto"], "Convide a escolher algo que gostaria de compartilhar num grupo novo. Responda como interlocutor e aguarde."],
    ["Organização de encontro", "O que definir juntos?", ["📍 Local", "🚌 Transporte"], "Planejem um encontro considerando duas preferências diferentes. Permita comunicação escrita ou por símbolos."],
    ["Compromissos simultâneos", "O que ajustar?", ["🕒 Horário", "🤝 Apoio"], "Descreva dois compromissos fictícios sobrepostos. Convide a negociar ajustes, pedir ajuda ou recusar."]
  ]],
  ["19 anos", [
    ["Troca entre colegas", "Que experiência compartilhar?", ["📚 Estudo", "🎭 Lazer"], "Convide a compartilhar uma experiência escolhida com um colega fictício. Dê espaço para reciprocidade, silêncio ou mudança de assunto."],
    ["Projeto com autonomia", "O que decidir em dupla?", ["📋 Escopo", "🗓️ Cronograma"], "Combine um projeto de interesse com responsabilidades compartilhadas. Ofereça sua perspectiva e observe a negociação."],
    ["Revisão de acordo", "Como prefere retomar?", ["💬 Por escrito", "🤝 Em conversa"], "Apresente uma mudança fictícia num acordo entre pares. Convide a expressar necessidades e negociar como seguir."]
  ]]
];
export const domains = [
  ["Atenção compartilhada e iniciativa", "Observe como dirige a atenção do parceiro ou compartilha interesse, inclusive por gestos, sons, fala ou CAA."],
  ["Reciprocidade e turnos", "Descreva como inicia, acompanha, modifica ou encerra a troca e quais apoios facilitam a participação."],
  ["Flexibilidade e preferências", "Descreva como comunica preferências, mantém ou varia a proposta. Registre repetições ou desconforto sensorial apenas se observados. Interrompa se houver desconforto."]
];
