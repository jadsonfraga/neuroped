// Cada cena reúne um convite, opções visuais e uma intervenção do parceiro.
type Scene = [title: string, invitation: string, choices: string[], guide: string];
export const bands: [string, Scene[]][] = [
  ["1–2 anos", [
    ["Cesto de figuras", "Qual vamos descobrir?", ["🐱 Gato", "🐦 Pássaro"], "Acompanhe o foco da criança e imite suavemente o animal escolhido. Faça uma pausa e acolha qualquer iniciativa."],
    ["Ritmos em dupla", "Vamos brincar?", ["👏 Palmas", "👋 Aceno"], "Convide o cuidador a acompanhar um movimento escolhido pela criança. Deixe espaço para ela repetir, variar ou encerrar."],
    ["Dois caminhos", "Por onde vamos?", ["🌳 Árvore", "🌼 Flor"], "Passeie com o dedo até uma figura. Ofereça a outra como possibilidade, mantendo a primeira disponível."]]],
  ["3–5 anos", [
    ["Jardim compartilhado", "O que plantamos juntos?", ["🌻 Girassol", "🍓 Morango"], "Convide a criança a mostrar ao parceiro o que plantar. Comente a escolha e aguarde a continuação."],
    ["Oficina de gestos", "O que vamos construir?", ["🚗 Carro", "🚤 Barco"], "Faça uma parte da construção no ar. Convide a criança a acrescentar outra e imite sua contribuição."],
    ["Piquenique", "Onde vai ser?", ["🌳 Jardim", "🏠 Sala"], "Após a escolha, proponha imaginar um dia de chuva. Pergunte se prefere manter o local, mudar ou parar."]]],
  ["6–9 anos", [
    ["Clube de descobertas", "O que quer mostrar?", ["🦕 Fóssil", "🪐 Planeta"], "Peça que mostre algo interessante ao parceiro. Responda ao que comunicou e dê tempo para retomar."],
    ["Mapa a dois", "Onde começa nosso mapa?", ["🌉 Ponte", "⛰️ Morro"], "Cada pessoa acrescenta um lugar ao mapa imaginário. Observe como combina as contribuições."],
    ["Recreio com escolhas", "Qual atividade vamos propor?", ["🖍️ Desenho", "⚽ Bola"], "O parceiro propõe outra atividade. Convide a combinar um plano que comporte as preferências de ambos."]]],
  ["10–13 anos", [
    ["Curadoria da turma", "Qual tema apresentar?", ["🎵 Música", "🎮 Jogos"], "Convide a apresentar o tema como preferir. Faça um comentário genuíno e aguarde a resposta."],
    ["Projeto em dupla", "Que parte você quer assumir?", ["🎨 Ilustração", "💬 Entrevista"], "Assuma o outro papel. Combine como juntar as partes e acolha pedidos de esclarecimento."],
    ["Troca de local", "Onde encontrar o grupo?", ["📚 Biblioteca", "🌳 Praça"], "Imagine que o local escolhido está fechado. Convide a negociar uma alternativa ou pedir mais informações."]]],
  ["14–19 anos", [
    ["Recomendação pessoal", "O que vale recomendar?", ["🎧 Áudio", "🎬 Filme"], "Convide a recomendar algo a alguém com interesses diferentes. Ofereça uma pista sobre o interlocutor."],
    ["Decisão compartilhada", "O que organizar juntos?", ["🎪 Evento", "🎙️ Podcast"], "Apresente uma preferência própria e convide a negociar papéis. Permita escrever, apontar ou usar CAA."],
    ["Mudança combinada", "O que podemos ajustar?", ["🕒 Horário", "📍 Local"], "Em um encontro fictício, sugira uma mudança e pergunte o que ajudaria. Considere a justificativa e os apoios escolhidos."]]]
];
export const domains = [
  ["Atenção compartilhada e iniciativa", "Observe como dirige a atenção do parceiro ou compartilha interesse, inclusive por gestos, sons, fala ou CAA."],
  ["Reciprocidade e turnos", "Descreva como inicia, acompanha, modifica ou encerra a troca e quais apoios facilitam a participação."],
  ["Flexibilidade e preferências", "Descreva como comunica preferências, mantém ou varia a proposta. Registre repetições ou desconforto sensorial apenas se observados. Interrompa se houver desconforto."]
];
