/**
 * Missões da pré-consulta. A auxiliar faz brincadeiras curtas com material simples; a secretaria faz
 * o relato indireto com a família ou a escola, com roteiro próprio para cada idade (`roteiroPorIdade`).
 * Em todas, `fala` é o convite em voz alta, `material` diz o que separar, `passos` descrevem o que fazer
 * e `pistas` são marcadores tocáveis do que foi visto ou relatado. Sem termo técnico.
 *
 * Exame físico, procedimentos (careta, eco das palavras, caixa surpresa, dedo-nariz, ponte de equilíbrio,
 * fundo de olho, reflexos, nuca, força graduada, tônus, sensibilidade, perímetro cefálico) e entrevista
 * reservada (pensamento, insight e risco) não têm missão: são do médico na consulta.
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
  /** Roteiro próprio de cada idade para a secretaria: perguntas para a família ou a escola, sem termo técnico. */
  roteiroPorIdade?: Readonly<Record<number, readonly string[]>>;
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
  gait2: {
    fala: "Trilha dos animais! Anda até a porta como o bicho que você escolher.",
    material: "Espaço livre e seguro, duas marcas no chão",
    minutos: 3,
    passos: ["Peça para andar até a porta como um bicho da escolha dela, e depois correr um pouco.", "Peça para contornar duas marcas no chão e para ficar parada como estátua alguns segundos.", "Fique por perto para proteger e veja se tropeça, abre os braços ou precisa de apoio."],
    pistas: ["Anda com firmeza", "Cai ou tropeça", "Abre os braços para equilibrar", "Precisa de apoio", "Faz a curva com facilidade"],
  },
  involuntary: {
    fala: "Ligação para a família: a criança tem algum movimento, piscada ou som que se repete sem querer?",
    material: "Telefone ou mensagem para a família",
    minutos: 3,
    passos: ["Ligue ou escreva para a família e pergunte apenas o que foi visto em casa ou na escola.", "Faça as perguntas do roteiro da idade, sem pedir que a criança imite nada.", "Registre o relato com a fonte; movimento relatado vai para o médico avaliar."],
    pistas: ["Movimento repetido sem querer", "Piscadas, caretas ou sons repetidos", "Tremor em alguma parte do corpo", "Piora com nervosismo ou atenção", "Some quando se distrai", "Família não percebeu"],
    roteiroPorIdade: {
      2: ["Missão do olhar da família: pergunte se a criança tem algum movimento, piscada, careta ou som que se repete sem querer.", "Pergunte quando isso acontece: parada, brincando ou quando tenta pegar algum objeto.", "Pergunte se muda quando a criança se distrai ou quando alguém chama a atenção da criança."],
      3: ["Missão da brincadeira em casa: pergunte se algum movimento aparece quando a criança está quieta ou vendo algo.", "Pergunte se o movimento some quando a criança se distrai com um brinquedo.", "Pergunte se a família percebe o movimento de manhã, à noite ou só em algumas situações."],
      4: ["Missão do quintal: pergunte se a criança tem algum movimento repetido, piscada ou som que a família nota.", "Pergunte se o movimento piora quando a criança está nervosa ou concentrada.", "Pergunte se o movimento some quando a criança brinca ou se distrai."],
      5: ["Missão do colo da família: pergunte se há algum movimento ou som que se repete sem a criança querer.", "Pergunte se o movimento aparece com a criança parada e se piora com atenção ou tarefa.", "Pergunte se a creche ou a família notou o movimento, e em que momentos do dia."],
      6: ["Missão da mochila: pergunte se a família ou a escola notou algum movimento que se repete sem querer.", "Pergunte se o movimento aparece com a criança parada ou quando faz alguma tarefa com as mãos.", "Pergunte se o movimento piora com nervosismo ou atenção e some quando a criança se distrai."],
      7: ["Missão do caderno: pergunte se a família ou a escola percebeu algum movimento ou som que se repete.", "Pergunte se o movimento aparece em repouso, durante a escrita ou em outras tarefas.", "Pergunte se o movimento piora com atenção ou se some quando a criança está distraída."],
      8: ["Missão do diário: pergunte se a família ou a escola percebeu algum movimento que se repete sem querer.", "Pergunte em quais situações o movimento aparece e se piora com atenção ou tarefa.", "Pergunte se o movimento some quando a criança se distrai, e desde quando a família nota."],
      9: ["Missão da observação de casa: pergunte se a família ou a escola percebeu algum movimento repetido.", "Pergunte em que momentos aparece, se é em repouso e se piora com atenção.", "Pergunte se some quando a criança se distrai, e desde quando a família nota."],
      10: ["Missão de bastidores: pergunte se a família ou a escola percebeu algum movimento ou som repetido.", "Pergunte se aparece em repouso, em tarefas ou quando a pessoa está nervosa.", "Pergunte se piora com atenção, some com distração e desde quando é notado."],
      11: ["Missão da conversa em família: pergunte se há movimentos ou sons repetidos que a família ou a escola notou.", "Pergunte se aparecem em repouso, em tarefas ou sob pressão.", "Pergunte se melhoram ou pioram com distração e desde quando são notados."],
      12: ["Missão da observação familiar: pergunte se a pessoa tem movimentos ou sons repetidos que não controla.", "Pergunte se aparecem em repouso, em tarefas ou sob pressão.", "Pergunte se melhoram ou pioram com distração e desde quando são notados."],
      13: ["Missão da escuta da família: pergunte se há movimentos ou sons repetidos que a família notou.", "Pergunte se aparecem em repouso, durante estudos ou sob pressão.", "Pergunte se melhoram com distração e desde quando são notados."],
      14: ["Missão da conversa de casa: pergunte se a família notou movimentos ou sons repetidos sem controle.", "Pergunte se aparecem em repouso, durante estudos ou sob estresse.", "Pergunte se a pessoa percebe o movimento e se consegue controlá-lo por algum tempo."],
      15: ["Missão da visão de quem convive: pergunte se há movimentos ou sons repetidos sem controle.", "Pergunte se aparecem em repouso, durante estudos ou sob pressão.", "Pergunte se a pessoa percebe o movimento e se consegue controlá-lo por algum tempo."],
      16: ["Missão de transição: pergunte se há movimentos ou sons repetidos sem controle, do ponto de vista da família.", "Pergunte se aparecem em repouso, em tarefas ou sob pressão.", "Pergunte se a pessoa percebe o movimento e se consegue controlá-lo por algum tempo."],
      17: ["Missão de transição: pergunte se há movimentos ou sons repetidos sem controle, do ponto de vista da família.", "Pergunte se aparecem em repouso, em tarefas ou sob pressão.", "Pergunte desde quando são notados e se a pessoa percebe o movimento."],
    },
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
    fala: "Ligação para a família: queremos conhecer o começo da vida da criança, do jeito que a família lembra.",
    material: "Telefone ou mensagem para a família",
    minutos: 4,
    passos: ["Ligue ou escreva para a família, com a fonte identificada, e explique que a conversa é sobre o começo da vida da criança.", "Faça as perguntas do roteiro da idade, sem sugerir respostas.", "Registre o que foi relatado, separado do que a família não soube informar."],
    pistas: ["Marcos do início relatados", "Fala e frases relatadas", "Coordenação das mãos relatada", "Perda de habilidade relatada", "Família não sabe informar"],
    roteiroPorIdade: {
      2: ["Missão do álbum: pergunte à família com que idade a criança sentou, andou sem apoio e falou as primeiras palavras.", "Pergunte quais palavras a criança usava nessa época e se já juntava duas palavras.", "Pergunte se a criança aponta para o que quer, mostra coisas e imita gestos ou sons, e se algo mudou nas últimas semanas."],
      3: ["Missão da linha do tempo: pergunte quando a criança começou a andar bem, a correr e a subir escadas.", "Pergunte como a criança fala hoje e se já faz frases com três ou mais palavras.", "Pergunte se a criança pega objetos pequenos, como lápis ou colher, com precisão, e se houve mudança repentina."],
      4: ["Missão da memória: pergunte quando a criança começou a pular com os dois pés e a subir escadas alternando os pés.", "Pergunte se a criança conta uma história curta do dia a dia, com começo e fim.", "Pergunte se a criança já rabisca ou desenha com intenção e se a família notou perda de alguma habilidade."],
      5: ["Missão do dia a dia: pergunte o que a criança já faz sozinha, como se vestir, comer e lidar com botões e zíper.", "Pergunte como a fala da criança é entendida por quem não convive com a criança e como é a conversa com outras crianças.", "Pergunte se a família percebeu alguma habilidade que a criança tinha e deixou de ter."],
      6: ["Missão da mochila: pergunte como a criança se organiza para se vestir, comer e guardar as próprias coisas.", "Pergunte como a criança desenha e escreve, e como está o começo da alfabetização, se já começou.", "Pergunte se houve mudança recente na forma de usar as mãos ou de andar."],
      7: ["Missão do caderno: pergunte se a criança já lê e escreve e como se sai com letras e números.", "Pergunte como a criança corta com tesoura, amarra o tênis e usa o lápis.", "Pergunte se a família notou alguma habilidade que a criança tinha e perdeu, ou mudança repentina."],
      8: ["Missão do diário: pergunte como a criança lê e escreve hoje, em voz alta e no caderno.", "Pergunte se a criança se organiza sozinha para as tarefas de casa e para se arrumar.", "Pergunte se houve queda de rendimento ou perda de alguma habilidade nos últimos meses."],
      9: ["Missão da história da família: pergunte como foi o começo da vida da criança, do jeito que a família lembra.", "Pergunte como a criança fala hoje, conta histórias e se expressa com as próprias palavras.", "Pergunte se a criança tem dificuldade de coordenação em jogos, esportes ou na escrita, e se algo mudou recentemente."],
      10: ["Missão de bastidores: peça para a família contar, sem pressa, quando a criança sentou, andou e falou.", "Pergunte como a criança se sai na escrita, na leitura e nos trabalhos manuais.", "Pergunte se houve perda de habilidade ou mudança repentina na maneira de fazer as coisas."],
      11: ["Missão da conversa em família: peça para contar como foram os primeiros anos, a fala e o andar.", "Pergunte como a criança se organiza com a escrita, a leitura e os trabalhos da escola.", "Pergunte se houve mudança recente na forma de andar, escrever ou se movimentar."],
      12: ["Missão da caderneta: pergunte se a família tem registro dos primeiros anos e o que esse registro mostra.", "Pergunte como a pessoa lê, escreve e acompanha as matérias da escola.", "Pergunte se a pessoa perdeu alguma habilidade ou teve mudança repentina nos últimos meses."],
      13: ["Missão da caderneta: confira com a família o que os registros dos primeiros anos mostram.", "Pergunte como a pessoa se sai na escrita, na leitura e nas atividades manuais.", "Pergunte se houve mudança recente na coordenação, no andar ou na fala."],
      14: ["Missão da linha do tempo: pergunte como foram os primeiros anos e se há registros da família.", "Pergunte como a pessoa acompanha a escola, a escrita e a leitura hoje.", "Pergunte se houve perda de habilidade ou mudança repentina nos últimos meses."],
      15: ["Missão da história de vida: pergunte, do jeito que a família lembrar, como foram os primeiros anos.", "Pergunte como a pessoa organiza os estudos, a leitura e a escrita hoje.", "Pergunte se a família notou perda de habilidade ou mudança repentina recente."],
      16: ["Missão de transição: pergunte como foram os primeiros anos e se existe registro de desenvolvimento.", "Pergunte como a pessoa se organiza com estudos e tarefas do dia a dia.", "Pergunte se houve perda de habilidade ou mudança repentina recente."],
      17: ["Missão de transição: pergunte como foram os primeiros anos e se existe registro de desenvolvimento.", "Pergunte como a pessoa se organiza com estudos, trabalho ou rotina de casa.", "Pergunte se houve perda de habilidade ou mudança repentina recente, e desde quando."],
    },
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
    fala: "Ligação para a família ou a escola: como a criança tem estado nas últimas semanas?",
    material: "Telefone ou mensagem para a família ou a escola",
    minutos: 3,
    passos: ["Ligue ou escreva para a família ou a escola, com a fonte identificada.", "Faça as perguntas do roteiro da idade, sem sugerir respostas.", "Registre o que foi relatado; quem relata e quem observa ficam em linhas separadas."],
    pistas: ["Relata tristeza", "Relata irritação", "Relata preocupação", "Mudança recente em casa ou na escola", "Família não sabe informar"],
    roteiroPorIdade: {
      6: ["Missão da conversa de casa: pergunte como a criança tem se sentido nas últimas semanas e se algo mudou.", "Pergunte como a criança reage quando alguma coisa é difícil ou quando precisa se separar da família.", "Pergunte se a criança está mais triste, irritada ou preocupada do que costumava estar."],
      7: ["Missão do cartaz de sentimentos: pergunte como a criança se sente na escola e em casa nas últimas semanas.", "Pergunte o que mudou nessas semanas e como a criança reage a situações difíceis.", "Pergunte se a família percebe tristeza, irritação ou preocupação que antes não existia."],
      8: ["Missão do diário de humor: pergunte como a criança tem se sentido e o que a família percebeu de diferente.", "Pergunte como a criança lida com frustrações, com a escola e com os colegas.", "Pergunte se há mudança de humor, irritação frequente ou preocupação com algo específico."],
      9: ["Missão da roda de conversa: pergunte como a criança tem se sentido e se conta o que sente.", "Pergunte como a criança reage a situações difíceis e se pede ajuda quando precisa.", "Pergunte se a família notou tristeza, irritação ou medo que antes não estavam presentes."],
      10: ["Missão de bastidores: pergunte como a criança tem andado nas últimas semanas, do jeito que a família vê.", "Pergunte o que mudou em casa ou na escola e como a criança reage a situações difíceis.", "Pergunte se há tristeza, irritação ou preocupação persistente."],
      11: ["Missão da conversa em família: pergunte como a criança tem se sentido e o que a família percebeu.", "Pergunte se algo mudou em casa ou na escola e como a criança lida com isso.", "Pergunte se há tristeza, irritação ou preocupação que não passa."],
      12: ["Missão do termômetro familiar: pergunte como a pessoa tem se sentido nas últimas semanas.", "Pergunte o que mudou e como a pessoa reage quando algo é difícil.", "Pergunte se há tristeza, irritação ou preocupação que se repete."],
      13: ["Missão da escuta da família: pergunte como a pessoa tem estado, do ponto de vista de quem convive com a criança.", "Pergunte o que mudou em casa, na escola e nas amizades.", "Pergunte se há tristeza, irritação ou preocupação que persiste."],
      14: ["Missão da conversa de casa: pergunte como a pessoa tem se sentido e o que a família tem notado.", "Pergunte se houve mudança recente nas amizades, na escola ou em casa.", "Pergunte se a pessoa parece tensa, irritada ou preocupada com frequência."],
      15: ["Missão da visão de quem convive: pergunte como a pessoa tem estado nas últimas semanas.", "Pergunte se mudou o jeito de lidar com estudos, amigos ou família.", "Pergunte se há tristeza, irritação ou preocupação com frequência."],
      16: ["Missão de transição: pergunte como a pessoa tem estado nas últimas semanas, do ponto de vista da família.", "Pergunte se mudou o jeito de lidar com estudos, trabalho ou relações.", "Pergunte se há tristeza, irritação ou preocupação com frequência."],
      17: ["Missão de transição: pergunte como a pessoa tem estado nas últimas semanas, do ponto de vista da família.", "Pergunte se mudou o jeito de lidar com estudos, trabalho ou relações.", "Pergunte se há tristeza, irritação ou preocupação com frequência, e desde quando."],
    },
  },
  sleep: {
    fala: "Ligação para a família: como é o sono e a energia nos dias de rotina?",
    material: "Telefone ou mensagem para a família",
    minutos: 3,
    passos: ["Ligue ou escreva para a família e explique que a conversa é sobre o sono e a energia da criança.", "Faça as perguntas do roteiro da idade, sem sugerir respostas.", "Registre o relato com a fonte identificada e sem interpretar."],
    pistas: ["Dificuldade para dormir", "Acorda durante a noite", "Ronca ou faz pausas", "Sono durante o dia", "Mudança de apetite"],
    roteiroPorIdade: {
      2: ["Missão do ninar: pergunte como é a hora de dormir e quanto tempo a criança leva para pegar no sono.", "Pergunte se a criança acorda de madrugada, tem pesadelos e como fica depois.", "Pergunte se a criança ronca, para de respirar por instantes ou fica muito agitada ao dormir."],
      3: ["Missão do quarto: pergunte a que horas a criança dorme, acorda e se faz sesta.", "Pergunte se há despertares, medo do escuro ou pesadelos, e como a família acalma a criança.", "Pergunte se a criança ronca ou faz pausas na respiração, e se fica sonolenta durante o dia."],
      4: ["Missão da rotina: pergunte como é a rotina antes de dormir e se a rotina mudou nas últimas semanas.", "Pergunte se a criança acorda à noite, chama a família ou tem pesadelos.", "Pergunte se a criança tem muita sonolência durante o dia ou mudança de apetite."],
      5: ["Missão da noite tranquila: pergunte como a criança se prepara para dormir e quanto tempo leva para adormecer.", "Pergunte se acorda durante a noite, com medo ou com pesadelos, e o que ajuda a voltar a dormir.", "Pergunte se ronca, para de respirar por instantes ou está cansada ao acordar."],
      6: ["Missão do pijama: pergunte a que horas a criança deita, levanta e como é a rotina antes de dormir.", "Pergunte se acorda de madrugada ou tem pesadelos, e se a família percebe mudança recente.", "Pergunte se a criança ronca, faz pausas na respiração ou sente sono durante a aula."],
      7: ["Missão do relógio: pergunte o horário de dormir e de acordar nos dias de escola e nos fins de semana.", "Pergunte se a criança acorda à noite e como a criança volta a dormir.", "Pergunte se há roncos, pausas na respiração e cansaço de manhã ou durante o dia."],
      8: ["Missão do diário de sono: pergunte o horário de dormir e de acordar e se a criança demora a pegar no sono.", "Pergunte se há despertares, pesadelos e como a criança fica depois de acordar.", "Pergunte se há roncos, pausas na respiração, sonolência durante o dia ou mudança de apetite."],
      9: ["Missão da rotina da casa: pergunte como são as noites da criança e se a família nota algo diferente.", "Pergunte se a criança acorda durante a noite e o que faz depois.", "Pergunte se há roncos, pausas na respiração, sono durante o dia ou apetite diferente do habitual."],
      10: ["Missão da noite: pergunte o horário de dormir e de acordar nos dias de escola.", "Pergunte se a criança acorda à noite, tem pesadelos ou demora a adormecer.", "Pergunte se há roncos, cansaço ao acordar, sonolência na escola ou mudança de apetite."],
      11: ["Missão do sono: pergunte a rotina de dormir e de acordar, incluindo o fim de semana.", "Pergunte se a criança acorda à noite ou tem dificuldade para voltar a dormir.", "Pergunte se há roncos, pausas na respiração ou sonolência durante o dia."],
      12: ["Missão da rotina noturna: pergunte o horário de dormir e de acordar nos dias de aula.", "Pergunte se a pessoa acorda à noite, tem pesadelos ou demora a adormecer.", "Pergunte se há roncos, sonolência durante o dia ou mudança de apetite."],
      13: ["Missão da agenda: pergunte como o sono se encaixa entre estudos, celular e horário de dormir.", "Pergunte se a pessoa acorda à noite ou tem dificuldade para voltar a dormir.", "Pergunte se há roncos, sonolência durante o dia ou mudança de apetite."],
      14: ["Missão da rotina do fim de semana: pergunte como é o sono nos dias sem escola.", "Pergunte se a pessoa acorda à noite ou tem pesadelos.", "Pergunte se há roncos, cansaço ao acordar e mudança de energia ou de apetite."],
      15: ["Missão da noite de estudo: pergunte a que horas a pessoa dorme e como é a rotina de sono.", "Pergunte se há despertares, pesadelos ou dificuldade para pegar no sono.", "Pergunte se há roncos, sonolência durante o dia ou mudança de apetite."],
      16: ["Missão de transição: pergunte como é o sono da pessoa nos dias de estudo e de folga.", "Pergunte se há despertares ou dificuldade para pegar no sono.", "Pergunte se há roncos, sonolência durante o dia ou mudança de apetite."],
      17: ["Missão de transição: pergunte como é o sono da pessoa nos dias de estudo, trabalho e folga.", "Pergunte se há despertares ou dificuldade para pegar no sono.", "Pergunte se há roncos, sonolência durante o dia ou mudança de apetite, e desde quando."],
    },
  },
  escola: {
    fala: "Ligação para a escola ou creche: como a criança participa das atividades e da turma?",
    material: "Telefone da escola ou creche (ou da família, se não frequenta)",
    minutos: 4,
    passos: ["Ligue para a escola ou creche, com a fonte identificada; se a criança não frequenta, pergunte à família.", "Faça as perguntas do roteiro da idade, sem sugerir respostas.", "Registre o relato escolar com a descrição do funcionamento, sem interpretar."],
    pistas: ["Participa das atividades", "Acompanha a turma", "Atenção oscilante em tarefas longas", "Boa relação com colegas e professores", "Dificuldade com colegas ou professores"],
    roteiroPorIdade: {
      2: ["Missão da creche: pergunte se a criança frequenta creche e como participa das atividades da turma.", "Pergunte como a criança brinca e interage com outras crianças e com os educadores.", "Pergunte se a creche notou algo diferente na atenção, no contato ou na fala."],
      3: ["Missão da roda: pergunte como a criança participa das atividades da creche e se fica na roda.", "Pergunte como a criança brinca com os colegas e se segue as regras de um jogo simples.", "Pergunte se a creche notou dificuldade de atenção ou de contato que não existia antes."],
      4: ["Missão do recreio: pergunte como a criança se relaciona com os colegas e os educadores.", "Pergunte se a criança acompanha as atividades da turma e termina o que começa.", "Pergunte se a escola notou mudança de comportamento ou de participação recentemente."],
      5: ["Missão da sala de aula: pergunte como a criança participa das atividades e se acompanha a turma.", "Pergunte se a criança se concentra em tarefas que duram um tempo e como lida com a regra do grupo.", "Pergunte se a escola notou mudança de comportamento, de contato ou de participação."],
      6: ["Missão do caderno da escola: pergunte como a criança acompanha as atividades e os colegas.", "Pergunte se a criança consegue se concentrar em tarefas longas e como lida com as regras da turma.", "Pergunte se a escola notou dificuldade de aprendizagem ou mudança recente de comportamento."],
      7: ["Missão do recreio: pergunte como a criança se relaciona com colegas e professores.", "Pergunte se a criança acompanha a turma e como se sai em atividades que duram mais tempo.", "Pergunte se a escola notou dificuldade de aprendizagem ou mudança recente de comportamento."],
      8: ["Missão do boletim de bastidores: pergunte como a criança acompanha as matérias e a turma.", "Pergunte como a criança se concentra em atividades longas e se pede ajuda quando precisa.", "Pergunte se a escola notou queda de rendimento ou mudança recente de comportamento."],
      9: ["Missão da reunião de pais: pergunte como a criança acompanha a turma e as matérias.", "Pergunte como a criança se relaciona com colegas e professores.", "Pergunte se a escola notou queda de rendimento, cansaço ou mudança de comportamento."],
      10: ["Missão do recado da escola: pergunte como a criança acompanha as matérias e a organização das tarefas.", "Pergunte como a criança se concentra em atividades longas e se relaciona com a turma.", "Pergunte se a escola notou queda de rendimento ou mudança recente de comportamento."],
      11: ["Missão da conversa com a coordenação: pergunte como a criança acompanha as matérias e a turma.", "Pergunte como a criança se organiza com tarefas, provas e prazos.", "Pergunte se a escola notou queda de rendimento ou mudança recente de comportamento."],
      12: ["Missão da coordenação: pergunte como a pessoa acompanha as matérias e a rotina de estudo.", "Pergunte como a pessoa se relaciona com colegas e professores.", "Pergunte se a escola notou queda de rendimento ou mudança recente de comportamento."],
      13: ["Missão da orientação escolar: pergunte como a pessoa se organiza com as matérias e os prazos.", "Pergunte como a pessoa se relaciona com os colegas e professores.", "Pergunte se a escola notou queda de rendimento ou mudança recente de comportamento."],
      14: ["Missão do histórico escolar: pergunte como a pessoa acompanha as matérias e a rotina de estudo.", "Pergunte como a pessoa se relaciona com colegas e professores e participa das aulas.", "Pergunte se a escola notou queda de rendimento ou mudança recente de comportamento."],
      15: ["Missão do planejamento: pergunte como a pessoa organiza estudos, provas e prazos.", "Pergunte como a pessoa se relaciona com a turma e os professores.", "Pergunte se a escola notou queda de rendimento ou mudança recente de comportamento."],
      16: ["Missão de transição escolar: pergunte como a pessoa cumpre prazos e provas.", "Pergunte como a pessoa se relaciona com a turma e os professores.", "Pergunte se a escola notou queda de rendimento ou mudança recente de comportamento."],
      17: ["Missão de transição escolar: pergunte como a pessoa cumpre prazos, provas e trabalhos em grupo.", "Pergunte como a pessoa se relaciona com a turma, os professores ou a equipe de trabalho.", "Pergunte se a escola notou queda de rendimento ou mudança recente de comportamento."],
    },
  },
};

/** Estações do médico: exame físico, procedimentos e entrevista reservada. Não viram missão da pré-consulta. */
export const ESTACOES_SEM_MISSAO = ["vision", "fundus", "shoulders", "meningeal", "posture", "strength6", "reflex", "sensation", "growth", "thought6", "insight9", "risk", "face", "hearing", "stereognosis", "finger6", "gait6"] as const;
