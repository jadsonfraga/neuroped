// Convites autorais, não marcos esperados. Não usar como rastreio ou teste.
export type GuideIcon = "face" | "hand" | "book" | "choice" | "turn" | "story";
export type ExamExample = {
  icon: GuideIcon; title: string; material: string; say: string; observe: string;
};

const example = (icon: GuideIcon, title: string, material: string, say: string, observe: string): ExamExample =>
  ({ icon, title, material, say, observe });

export const examExamples: Record<string, readonly [ExamExample, ExamExample]> = {
  "Nascimento a 27 dias": [
    example("face", "Rosto conhecido", "Com o bebê confortável no colo, deixe o cuidador se aproximar no campo visual, sem flash.", "Diga olá com a voz que ele conhece.", "Descreva se abriu os olhos, virou o rosto ou permaneceu dormindo."),
    example("hand", "Mãos em repouso", "Sem tocar nem mudar a posição, observe as mãos no colo do cuidador.", "Vamos só olhar um instante.", "Descreva o movimento que apareceu espontaneamente e de que lado."),
  ],
  "28 dias a 2 meses": [
    example("face", "Olá com pausa", "Com o bebê acordado no colo, peça ao cuidador que fale uma vez em tom habitual.", "Oi! Agora vamos esperar.", "Anote para onde estava olhando e o que mudou depois da fala."),
    example("hand", "Pés à vista", "Se os pés já estiverem visíveis e o bebê confortável, observe sem manobras.", "Vou observar enquanto ele fica à vontade.", "Anote quais movimentos espontâneos viu, sem provocar resposta."),
  ],
  "3 a 5 meses": [
    example("face", "Cadê o rosto?", "O cuidador se mantém à frente, sem mover a cabeça do bebê.", "Oi, estou aqui.", "Anote se o olhar mudou depois da voz ou se estava voltado para outro lugar."),
    example("choice", "Pano colorido à vista", "O cuidador segura um pano grande perto de si, sem encostar no bebê.", "Olha o pano.", "Descreva se olhou, vocalizou ou se virou; não repita se ficar desconfortável."),
  ],
  "6 a 8 meses": [
    example("hand", "Brinquedo na bandeja", "Com o bebê sentado com apoio habitual, o cuidador oferece um brinquedo grande e apropriado.", "Quer ver?", "Descreva como se aproximou: olhou, estendeu a mão ou não se interessou."),
    example("turn", "Sons em dupla", "O cuidador repete uma vocalização espontânea, em volume baixo, e pausa.", "Ouvi você.", "Anote o som inicial, o que o cuidador fez e o que veio a seguir."),
  ],
  "9 a 11 meses": [
    example("choice", "Bola ou boneco", "Mostre dois brinquedos grandes e familiares, na posição confortável que a criança já usa.", "Qual você quer ver?", "Descreva olhar, gesto ou outro modo de escolher, sem conduzir a mão."),
    example("turn", "Tchau do cuidador", "O cuidador faz seu aceno habitual uma vez, sem exigir repetição.", "Tchau!", "Descreva a reação e se apareceu antes ou depois do gesto."),
  ],
  "12 a 14 meses": [
    example("hand", "Colocar no cesto", "Use um cesto baixo estável e uma bola grande, à mesa ou no chão, com o cuidador.", "Quer pôr a bola aqui?", "Anote o que fez antes e depois de uma demonstração, se houver."),
    example("book", "Livro conhecido", "Ofereça um livro de figuras grandes e deixe a criança decidir a página.", "Vamos ver seu livro?", "Descreva se virou a página, mostrou uma imagem ou se afastou."),
  ],
  "15 a 17 meses": [
    example("turn", "Rolar de volta", "Role devagar uma bola macia sobre a mesa baixa, sem pedir que a criança se levante.", "Minha vez. Quer a sua?", "Anote se devolveu, segurou, fez outro movimento ou encerrou."),
    example("choice", "Mostrar um objeto", "Deixe dois objetos grandes conhecidos à vista e ao alcance confortável.", "Pode me mostrar qual você quer?", "Anote se escolheu por voz, olhar, gesto, toque ou outro meio."),
  ],
  "18 a 23 meses": [
    example("hand", "Encaixe grande", "Ofereça duas peças grandes e fáceis de segurar, sem dirigir a mão.", "Quer experimentar colocar uma aqui?", "Descreva o movimento e se a demonstração do adulto fez diferença."),
    example("book", "Cadê no desenho?", "Abra um livro conhecido numa imagem simples e aceite o modo habitual de resposta.", "Onde está o cachorro?", "Anote o que apontou, disse ou mostrou e se você usou alguma pista."),
  ],
  "2 anos": [
    example("story", "Brincar de cuidar", "Disponha boneco e tecido grande, sem peças soltas pequenas.", "O boneco quer descansar. O que a gente pode fazer?", "Descreva a ação proposta pela criança sem julgar a resposta."),
    example("hand", "Rabisco escolhido", "Ofereça papel e giz de cera grosso apropriado, com o cuidador por perto.", "Pode fazer uma marca aqui, se quiser.", "Anote como pegou e usou o material, sem posicionar a mão."),
  ],
  "3 anos": [
    example("hand", "Copiar um risco", "Deixe papel e giz grosso na mesa; faça um único risco de exemplo.", "Eu fiz assim. Você quer tentar do seu jeito?", "Anote como segurou o giz, o que fez e se pediu para ver novamente."),
    example("story", "Passeio do boneco", "Use o boneco e dois lugares desenhados no papel.", "Para onde ele vai primeiro?", "Descreva como indicou o destino e qualquer ajuda que você deu."),
  ],
  "4 anos": [
    example("story", "História de dois desenhos", "Mostre duas imagens de uma ação cotidiana, sem uma ordem obrigatória.", "O que você acha que aconteceu aqui?", "Anote o que contou ou mostrou, incluindo alguma pista que pediu."),
    example("choice", "Traços à escolha", "Mostre um traço reto e outro ondulado no papel, com lápis grosso à disposição.", "Qual desses você quer tentar?", "Descreva a escolha e como fez o traço, sem corrigir a execução."),
  ],
  "5 anos": [
    example("turn", "Um risco de cada vez", "Use a mesma folha. Combine que cada pessoa pode acrescentar uma marca ou passar.", "Eu começo ou você prefere começar?", "Anote como entrou na troca e se retomou após a pausa."),
    example("story", "Preparar a mochila", "Mostre fotos desenhadas de garrafa e livro, ou os objetos reais.", "O que você colocaria na mochila primeiro?", "Registre a ordem que explicou, sem dizer se acertou."),
  ],
  "6 a 8 anos": [
    example("hand", "Trajeto no papel", "Desenhe dois caminhos largos entre figuras; ofereça lápis ou aceite indicação por gesto.", "Escolha um caminho e me mostre como seguir.", "Anote a estratégia e se precisou de repetição ou de apoio visual."),
    example("book", "Notícia de um minuto", "Use três figuras de uma atividade de que a criança goste.", "Qual dessas você usaria para contar como foi sua manhã?", "Descreva como organizou a explicação e que apoio escolheu."),
  ],
  "9 a 11 anos": [
    example("story", "Explicar um jogo", "Ofereça papel para desenhar ou escrever, sem exigir leitura.", "Como você ensinaria seu jogo favorito a alguém novo?", "Anote a sequência apresentada e se a pessoa usou desenho, gesto ou fala."),
    example("choice", "Organizar o começo", "Mostre itens desenhados de uma tarefa escolar fictícia.", "Qual seria seu primeiro passo? Pode mostrar no papel.", "Registre o passo escolhido, a justificativa se espontânea e o apoio oferecido."),
  ],
  "12 a 14 anos": [
    example("choice", "Escolher como responder", "Ofereça verbalmente três opções: falar, escrever ou passar.", "Como você prefere me explicar um assunto de que gosta?", "Descreva a preferência e respeite a escolha; não registre conteúdo íntimo."),
    example("story", "Planejar um intervalo", "Dê uma folha em branco para dois passos, se quiser usar.", "Imagine um intervalo livre. O que faria primeiro e depois?", "Anote como organizou a proposta e o suporte que escolheu."),
  ],
  "15 a 17 anos": [
    example("story", "Explicar uma rotina fictícia", "Ofereça bloco de papel como apoio opcional, sem pedir informações pessoais.", "Que dois passos você sugeriria a alguém no primeiro dia de aula?", "Descreva a resposta e as condições, sem inferir juízo, memória ou humor."),
    example("choice", "Comparar dois formatos", "Apresente a mesma instrução fictícia em texto curto e oralmente, se a pessoa aceitar.", "Qual formato te ajudaria mais a começar?", "Anote a preferência e a razão, se a pessoa quiser explicá-la."),
  ],
  "18 a 19 anos": [
    example("story", "Organizar um compromisso fictício", "Use um compromisso inventado, sem perguntar horários ou endereço reais.", "O que você prepararia antes de sair?", "Descreva os passos expressos e o suporte utilizado, sem atribuir uma capacidade global."),
    example("turn", "Pedir uma explicação diferente", "Use uma instrução cotidiana neutra; combine que a pessoa pode parar.", "Se não ficou claro, como você prefere que eu explique?", "Registre o ajuste solicitado e se ele foi usado, sem avaliar acerto."),
  ],
};

export const socialAlternatives: Record<string, string> = {
  "12–17 meses": "O cuidador oferece um bichinho grande familiar e pausa: “Você quer ver?”. Observe como a criança continua, muda ou encerra a troca.",
  "18–23 meses": "Use um livro conhecido; o cuidador comenta uma figura e espera. Anote se a criança mostra outra imagem, faz um som ou segue explorando.",
  "24–29 meses": "Ponha dois brinquedos grandes na mesa: “Qual a gente usa primeiro?”. Aceite gesto, som, olhar ou a escolha de não participar.",
  "30–35 meses": "Faça uma marca no papel e ofereça o giz grosso: “Quer fazer a sua?”. Anote quem iniciou e o que houve na pausa.",
  "3 anos": "Use um boneco e um pano: “Onde ele pode descansar?”. Acompanhe a ideia da criança sem pedir resposta certa.",
  "4 anos": "Desenhe dois destinos simples: “Por onde nosso personagem vai?”. Descreva como compartilhou ou mudou o caminho, se quiser.",
  "5 anos": "Dividam uma folha para desenhar: “Quer escolher o primeiro detalhe?”. Observe como propõe ou passa a vez.",
  "6 anos": "Comece um desenho de praça: “O que você colocaria aqui?”. Aguarde antes de oferecer uma segunda ideia.",
  "7 anos": "Imagine uma história em dupla: “Eu começo ou você?”. Observe como combinam quem começa ou se prefere outra proposta.",
  "8 anos": "Ponha dois títulos inventados no papel: “Qual você escolheria para uma história?”. Aceite que a criança proponha um terceiro.",
  "9 anos": "Peça uma dica para um personagem que entrou num jogo novo. Observe como oferece a dica e reage a um pedido neutro de esclarecimento.",
  "10 anos": "Planejem uma brincadeira fictícia: “Temos duas ideias, como dá para juntar?”. Descreva a negociação sem exigir acordo.",
  "11 anos": "Apresente dois finais neutros para uma história. Peça que escolha ou sugira outro e anote como explicou a preferência.",
  "12 anos": "Mostre duas formas de organizar uma atividade fictícia em grupo. Observe como indica uma opção ou pede mais informação.",
  "13 anos": "Convide a inventar um cartaz em dupla: “Você prefere escolher o título ou a imagem?”. Descreva como combinam os papéis.",
  "14 anos": "Imagine um grupo que precisa escolher um local para uma atividade. Peça uma ideia e observe como a pessoa responde a uma alternativa neutra.",
  "15 anos": "Proponha uma conversa fictícia em que duas pessoas preferem horários diferentes. Pergunte como poderiam combinar, sem trazer situações pessoais.",
  "16 anos": "Ofereça escolher entre escrever ou falar uma sugestão para melhorar um evento inventado. Anote o meio escolhido e o apoio utilizado.",
  "17 anos": "Conversem sobre dois jeitos de organizar uma tarefa em dupla. Observe como esclarece sua preferência ou decide não continuar.",
  "18 anos": "Peça uma proposta para dividir duas atividades de um projeto fictício. Registre como negocia a ordem, se desejar.",
  "19 anos": "Peça que escolha como quer compartilhar uma sugestão sobre um projeto imaginário. Registre a escolha e se a proposta precisou ser ajustada.",
};
