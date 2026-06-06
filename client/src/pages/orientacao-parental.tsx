import { useState } from "react";
import { Heart, ChevronDown, ChevronUp, CheckCircle, XCircle, AlertTriangle, PhoneCall } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Disorder {
  id: string;
  title: string;
  emoji: string;
  color: string;
  doList: string[];
  dontList: string[];
  alertSigns: string[];
  whenToSeekHelp: string[];
}

const disorders: Disorder[] = [
  {
    id: "tdah",
    title: "TDAH",
    emoji: "⚡",
    color: "from-blue-500 to-indigo-500",
    doList: [
      "Mantenha uma rotina fixa — café, escola, almoço, tarefa, banho, jantar, dormir. Criança com TDAH precisa de previsibilidade como de água.",
      "Divida as tarefas em passos pequenos. Em vez de 'arruma o quarto', diga: 'primeiro junta os brinquedos, depois dobra a roupa'.",
      "Use reforço positivo na hora certa — elogie logo depois que fez, não horas depois. 'Boa, você terminou a tarefa! Percebi que você se esforçou!'",
      "Coloque o filho perto de você na hora da lição, sem TV ou celular por perto. Ambiente sem distrações faz diferença enorme.",
      "Dê alertas de transição: 'em 5 minutos vamos jantar'. Mudanças bruscas de atividade são difíceis para o TDAH.",
    ],
    dontList: [
      "Não diga 'você é preguiçoso' ou 'não tá nem aí'. O cérebro com TDAH tem dificuldade real de iniciar e manter tarefas — não é falta de vontade.",
      "Não compare com o irmão ou colega. 'Seu irmão faz sem reclamar' destrói a autoestima e não resolve nada.",
      "Não faça a lição pelo filho. Ajude, divida em partes, mas deixe ele fazer. Autonomia precisa ser construída.",
      "Não castigue por esquecer a mochila ou o caderno todo dia. Use lembretes visuais, checklist na porta, caixas coloridas.",
      "Não exija que ele fique quieto em situações longas. Pausa de movimento é necessária — deixe levantar, pular, antes de voltar ao foco.",
    ],
    alertSigns: [
      "Muito atraso na alfabetização mesmo com estimulação, pode haver dislexia ou dificuldade de aprendizagem associada.",
      "Agressividade frequente com pares ou familiares que piora ao longo do tempo.",
      "Tristeza persistente, fala de que 'ninguém gosta' ou que é 'burro' — risco de autoestima muito baixa.",
    ],
    whenToSeekHelp: [
      "Quando a medicação não parece funcionar mais, a criança está muito irritada ou há efeitos colaterais intensos como perda de apetite severa.",
      "Quando o comportamento está causando exclusão social real — sem amigos, expulsões repetidas, recusa de ir à escola.",
    ],
  },
  {
    id: "tea",
    title: "Autismo / TEA",
    emoji: "🧩",
    color: "from-purple-500 to-violet-500",
    doList: [
      "Respeite as rotinas e avise com antecedência qualquer mudança. Flexibilidade é uma habilidade que precisa ser ensinada devagar, não exigida abruptamente.",
      "Aprenda a linguagem do seu filho — se ele usa figuras, imagens, sons ou palavras específicas, encontre ele onde ele está.",
      "Aceite e celebre os interesses dele, mesmo que pareçam repetitivos. O interesse restrito é uma porta de entrada para o aprendizado.",
      "Leve a criança em terapias com regularidade — ABA, fonoaudiologia, TO, psicologia. A combinação importa tanto quanto a frequência.",
      "Cuide também de você. Pais de crianças com TEA têm altíssimas taxas de burnout. Busque grupo de apoio, redes de mães/pais de autistas.",
    ],
    dontList: [
      "Não force contato visual — pode ser doloroso fisicamente para algumas crianças. Contato visual forçado é estressor, não conexão.",
      "Não puna crises sensoriais com isolamento ou castigo. A crise é uma resposta ao sofrimento — o que a criança precisa é de acolhimento e regulação.",
      "Não acredite em 'curas milagrosas', protocolos não científicos ou quelação. Podem ser perigosos e retardam o acesso ao tratamento real.",
      "Não compare o seu filho a outra criança com autismo. O espectro é amplo — cada pessoa com TEA é única.",
      "Não exija que ele 'seja normal' em eventos sociais. Planejar a saída, ter espaço seguro e permitir fones de ouvido é muito mais eficaz.",
    ],
    alertSigns: [
      "Regressão de habilidades — a criança perde fala ou comportamentos que já tinha adquirido. Isso precisa de avaliação urgente.",
      "Comportamentos de autolesão frequentes — bater a cabeça, morder as mãos, arranhar a pele — sinal de sofrimento intenso.",
      "Episódios que se parecem com convulsões — crianças com TEA têm maior risco de epilepsia.",
    ],
    whenToSeekHelp: [
      "Quando as crises de choro, agressividade ou autolesão estão muito frequentes e interferem no sono e na alimentação.",
      "Quando há suspeita de epilepsia associada — perda de consciência, movimentos repetitivos, olhar fixo sem resposta.",
    ],
  },
  {
    id: "ansiedade",
    title: "Ansiedade Infantil",
    emoji: "😰",
    color: "from-amber-500 to-orange-500",
    doList: [
      "Valide o sentimento antes de oferecer solução: 'Eu entendo que você está com medo de errar na prova. Isso é difícil mesmo.' Sentir-se compreendido já ajuda.",
      "Ensine técnicas simples de respiração — inspirar contando até 4, segurar 4, soltar 6. Pratique nos momentos tranquilos, não só na crise.",
      "Exponha a criança de forma gradual ao que tem medo. Se tem medo de falar em público, comece falando para um familiar, depois dois, depois uma turma pequena.",
      "Mantenha rotina previsível — ansiedade aumenta na incerteza. Saber o que vai acontecer reduz o alarme do cérebro ansioso.",
      "Mostre que errar é humano — compartilhe histórias suas de fracasso e superação. Perfeccionismo alimenta ansiedade.",
    ],
    dontList: [
      "Não diga 'não é nada' ou 'tá exagerando'. Para a criança, o medo é muito real. Minimizar o sentimento fecha a comunicação.",
      "Não evite completamente as situações temidas — isso reforça a ansiedade. Evitação alivia a curto prazo e piora a longo prazo.",
      "Não antecipe problemas em voz alta na frente da criança. 'Vai ter muita gente, vai ter barulho, você vai ficar nervoso' prepara o terreno para a ansiedade.",
      "Não puna recusa escolar com punição severa sem investigar o motivo. Muitas vezes há bullying ou ansiedade social por trás.",
      "Não tranquilize demais em excesso — ficar dizendo 'vai dar tudo certo' sem desenvolver repertório de enfrentamento cria dependência emocional.",
    ],
    alertSigns: [
      "Recusa escolar frequente com queixas físicas (dor de barriga, enjoo) que somem no fim de semana.",
      "Rituais e verificações repetitivas que tomam mais de 1 hora do dia — pode ser TOC.",
      "Fobia de contaminação, de engasgar, ou restrição alimentar severa por medo — pode precisar de avaliação especializada.",
    ],
    whenToSeekHelp: [
      "Quando a ansiedade impede atividades básicas: não come na escola, não dorme, não vai ao banheiro fora de casa.",
      "Quando há crises de pânico — coração acelerado, falta de ar, sensação de morte — mesmo em crianças pequenas.",
    ],
  },
  {
    id: "depressao",
    title: "Depressão na Infância",
    emoji: "🌧️",
    color: "from-slate-500 to-gray-600",
    doList: [
      "Mantenha conversas abertas, sem pressa. 'Como você está de verdade?' e depois silêncio para ouvir. Crianças precisam de espaço para falar.",
      "Garanta rotina de sono regular — dormir mal piora muito a depressão. Horário fixo para dormir e acordar, mesmo nos fins de semana.",
      "Estimule atividade física — é comprovado cientificamente que exercício tem efeito antidepressivo. Não precisa ser academia, pode ser brincar na rua.",
      "Reduza pressão escolar no período agudo. Conversar com a escola pode ajudar a aliviar cobranças enquanto o tratamento começa a fazer efeito.",
      "Esteja presente — não precisa resolver tudo. Às vezes sentar ao lado, assistir um filme juntos, faz mais do que qualquer conselho.",
    ],
    dontList: [
      "Não diga 'você tem tudo para ser feliz' ou 'tem gente passando fome e você triste'. Isso causa culpa, não melhora.",
      "Não minimize reclamações de dor sem causa aparente — crianças deprimidas frequentemente se queixam de dores físicas.",
      "Não dê celular e tela como solução para tristeza — o isolamento nas redes piora o quadro.",
      "Não espere 'passar sozinho' por meses. Depressão infantil tratada rápido tem prognóstico muito melhor.",
      "Não ignore fala de morte, de que 'queria não existir' ou de que ninguém vai sentir falta. Sempre leve a sério.",
    ],
    alertSigns: [
      "Criança que fala em morte, em não querer mais viver, em ser um fardo para a família — encaminhar urgente.",
      "Perda de peso e apetite significativas, ou ganho excessivo, por mais de 2 semanas.",
      "Regressão intensa — criança que volta a fazer xixi na cama, a falar como bebê, ou a ter comportamento muito infantilizado.",
    ],
    whenToSeekHelp: [
      "Quando há qualquer menção a pensamentos de morte ou autolesão — isso é urgência em saúde mental.",
      "Quando os sintomas duram mais de 2 semanas e não melhoram com ajustes de rotina e acolhimento familiar.",
    ],
  },
  {
    id: "epilepsia",
    title: "Epilepsia",
    emoji: "⚡",
    color: "from-yellow-500 to-amber-600",
    doList: [
      "Conheça o tipo de crise do seu filho — não é tudo convulsão. Há crises de ausência (olhar vago), crises focais (movimentos em um lado), e muitas outras.",
      "Mantenha um diário de crises — data, hora, duração, o que aconteceu antes. Isso é ouro para o médico ajustar o tratamento.",
      "Dê o medicamento no horário certo, todos os dias. Anticonvulsivantes funcionam com nível sérico estável — atrasar doses aumenta risco de crises.",
      "Oriente professores e familiares sobre como agir na crise: colocar de lado, proteger a cabeça, não colocar nada na boca, cronometrar a duração.",
      "Informe a escola por escrito — o direito de ter medicação na escola em caso de emergência é garantido por lei.",
    ],
    dontList: [
      "Não coloque objetos na boca durante a crise — isso machuca. A pessoa não engole a língua, isso é mito.",
      "Não segure a pessoa à força durante a convulsão — pode machucar ossos e articulações.",
      "Não tire restrições de atividade sem orientação médica. Piscina sem acompanhante, escalar altura sozinho — há riscos reais.",
      "Não deixe de vacinar por medo de crise febril. O risco da doença é maior. Converse com o médico sobre cuidados pós-vacina.",
      "Não trate com 'chás' ou rituais religiosos no lugar da medicação. Crises mal controladas causam dano cerebral.",
    ],
    alertSigns: [
      "Crise com duração maior que 5 minutos — chamar SAMU/192 imediatamente. Pode ser status epilepticus.",
      "Crise seguida de déficit neurológico — fraqueza de um lado, alteração de fala que dura mais de 30 minutos.",
      "Aumento brusco de frequência de crises sem mudança de medicação.",
    ],
    whenToSeekHelp: [
      "Quando a crise dura mais de 5 minutos, há lesão, ou o filho não recupera a consciência em 10 minutos — pronto-socorro.",
      "Quando mesmo com medicação as crises não estão controladas — revisar diagnóstico e tratamento com neuropediatra.",
    ],
  },
  {
    id: "linguagem",
    title: "Atraso de Linguagem",
    emoji: "🗣️",
    color: "from-teal-500 to-emerald-500",
    doList: [
      "Fale muito com a criança desde bebê — nomear objetos, descrever o que está fazendo, contar histórias. Banho de linguagem é o melhor estimulante.",
      "Leia livros com imagens todos os dias. Mostre figuras, nomeie, pergunte 'o que é isso?'. Criar o hábito de leitura compartilhada faz enorme diferença.",
      "Responda e expanda as tentativas de comunicação. Se a criança diz 'aua', você diz 'água! Você quer água?'. Não corrija, apenas modele.",
      "Reduza o tempo de tela especialmente antes dos 2 anos. Tela não ensina fala — interação humana, sim.",
      "Inicie fonoaudiologia o quanto antes. O período de aquisição de linguagem é curto — cada mês importa.",
    ],
    dontList: [
      "Não antecipe tudo o que a criança quer — deixe ela tentar comunicar, mesmo que por gestos ou sons.",
      "Não use baby talk excessivo depois dos 18 meses. Fale com clareza e pronúncia correta.",
      "Não compare com outras crianças: 'o primo já fala tudo e ele não fala nada'. Comparação não estimula, bloqueia.",
      "Não espere 'chegar aos 3 anos para ver'. Se aos 18 meses não tem palavras ou aos 2 anos não tem 2 palavras juntas, avalie já.",
      "Não descarte bilinguismo como causa — ele pode atrasar levemente, mas não bloqueia. Ambas as línguas devem ser estimuladas.",
    ],
    alertSigns: [
      "Ausência de balbucio aos 12 meses, nenhuma palavra aos 16 meses, ou nenhuma frase de 2 palavras aos 24 meses.",
      "Perda de habilidades de fala que já tinha conquistado — isso é sinal de alerta e exige avaliação imediata.",
      "Dificuldade de compreensão além da expressão — não entende comandos simples para a idade.",
    ],
    whenToSeekHelp: [
      "Desde o momento em que você perceber que o desenvolvimento de fala está atrasado. Não existe 'cedo demais' para fonoaudiologia.",
      "Quando o atraso de linguagem está acompanhado de pouco contato visual ou pouco interesse social — avaliar TEA.",
    ],
  },
  {
    id: "aprendizagem",
    title: "Dificuldade de Aprendizagem",
    emoji: "📚",
    color: "from-indigo-500 to-blue-600",
    doList: [
      "Comunique-se com a escola formalmente — peça relatórios, solicite reunião com professor e coordenação, peça adaptações curriculares por escrito.",
      "Valorize o esforço mais do que o resultado. 'Você treinou bastante essa matéria' é mais poderoso que 'tirou 10'.",
      "Utilize múltiplos formatos para estudar: audiolivros, vídeos explicativos, jogos educativos. Nem toda criança aprende lendo.",
      "Peça avaliação neuropsicológica para identificar se há dislexia, discalculia, ou outro transtorno específico de aprendizagem.",
      "Mantenha suporte emocional — crianças com dificuldade de aprendizagem têm muito mais risco de desenvolver baixa autoestima e depressão.",
    ],
    dontList: [
      "Não diga 'você não tá estudando direito' quando a criança claramente se esforça. O problema pode não ser esforço, mas processamento.",
      "Não retire atividades que a criança ama (esporte, música) como punição por notas baixas. Isso tira o único campo de sucesso que ela tem.",
      "Não ignore laudos ou relatórios médicos. Escola é obrigada por lei a adaptar — use isso.",
      "Não faça toda a lição com ela, impedindo que ela desenvolva estratégias próprias.",
      "Não trate reprovação como solução. Para dislexia e discalculia, repetir o mesmo sem adaptação não funciona.",
    ],
    alertSigns: [
      "Criança que já foi alfabetizada mas apresenta regressão ou piora progressiva — pode haver causa neurológica.",
      "Dificuldade muito específica (só matemática, só escrita) com desempenho normal nas outras áreas.",
      "Dificuldade de aprendizagem acompanhada de cefaleia frequente ou alterações visuais — avaliar visão e neurologia.",
    ],
    whenToSeekHelp: [
      "Quando a escola já aplicou reforço e não houve progresso — indicação para avaliação especializada.",
      "Quando a criança apresenta sofrimento emocional intenso relacionado à escola: choro, vômitos, recusa escolar.",
    ],
  },
  {
    id: "conduta",
    title: "Transtorno de Conduta / TOD",
    emoji: "🔥",
    color: "from-red-500 to-orange-500",
    doList: [
      "Mantenha regras claras, pouquíssimas e com consequências previsíveis. Crianças com TOD funcionam melhor quando o ambiente é estruturado e consistente.",
      "Escolha com sabedoria quais batalhas lutar. Não transforme tudo em confronto — priorize as regras mais importantes.",
      "Reforce comportamentos positivos explicitamente e com frequência. A criança com TOD recebe muito mais punição que elogio — inverta isso.",
      "Conecte antes de corrigir — 'eu sei que você está bravo, entendo que ficou frustrado' — antes de dizer o que não pode fazer.",
      "Terapia de pais é tão importante quanto terapia da criança. Parent training (PMT) tem evidência sólida para TOD.",
    ],
    dontList: [
      "Não entre em disputas de poder. 'Você vai fazer porque eu mandei' com uma criança com TOD é combustível para explosão.",
      "Não use punição física — isso piora agressividade e comportamento opositor.",
      "Não ameaça sem cumprir. Ameaça que não tem consequência real ensina que regra não tem valor.",
      "Não ignore os comportamentos positivos — eles existem, mesmo que raros. Pegue a criança fazendo certo.",
      "Não diagnose como 'sem limites' sem buscar avaliação. TOD frequentemente vem com TDAH, ansiedade ou trauma não tratado.",
    ],
    alertSigns: [
      "Comportamento destrutivo frequente com objetos, machucar animais — risco para transtorno de conduta grave.",
      "Mentiras elaboradas frequentes, manipulação de adultos sem remorso visível.",
      "Envolvimento com atos ilegais mesmo na infância — furtos, destruição de propriedade.",
    ],
    whenToSeekHelp: [
      "Quando a criança está ameaçando ou machucando fisicamente membros da família de forma recorrente.",
      "Quando o comportamento está levando a expulsão escolar repetida ou exclusão social severa.",
    ],
  },
  {
    id: "tiques",
    title: "Tiques / Tourette",
    emoji: "💫",
    color: "from-cyan-500 to-sky-500",
    doList: [
      "Aceite os tiques sem chamar atenção para eles. Quanto mais a criança tenta suprimir, mais ansiosa fica e mais os tiques aumentam.",
      "Informe os professores de forma sigilosa — peça que não corrija ou chame atenção na frente da turma.",
      "Explique ao filho de forma simples: 'seu cérebro manda um sinal que o corpo precisa obedecer. Não é sua culpa e isso não te define.'",
      "Identifique gatilhos que pioram os tiques — estresse, ansiedade, cansaço, calor. Reduzir os gatilhos ajuda.",
      "Se a criança quiser, ensine onde e quando pode soltar os tiques — ter uma 'zona livre de tiques' e um 'tempo de soltar' pode ajudar.",
    ],
    dontList: [
      "Não mande parar de tiquear. A criança normalmente não tem controle — mandar parar é como mandar parar de piscar.",
      "Não ria, imite ou deixe outros irmãos imitarem os tiques. Isso causa sofrimento enorme.",
      "Não retire atividades físicas por causa dos tiques — exercício geralmente melhora.",
      "Não trate com múltiplos medicamentos sem orientação especializada. Tiques simples muitas vezes não precisam de medicação.",
      "Não superproteja — a criança pode ter vida social normal, praticar esportes, fazer arte.",
    ],
    alertSigns: [
      "Tiques que causam dor física — cervicalgia por tiques de pescoço intensos, por exemplo.",
      "Tiques vocais com palavrões (coprolalia) que levam a exclusão social severa.",
      "Comportamentos obsessivo-compulsivos intensos associados — TOC é comum no Tourette.",
    ],
    whenToSeekHelp: [
      "Quando os tiques estão causando sofrimento emocional intenso ou prejudicando o desempenho escolar e social.",
      "Quando os tiques aumentam muito em frequência ou intensidade, ou surgem novos tipos de tiques rapidamente.",
    ],
  },
  {
    id: "sono",
    title: "Distúrbios do Sono",
    emoji: "🌙",
    color: "from-violet-500 to-purple-600",
    doList: [
      "Estabeleça uma rotina noturna de 30-45 minutos: banho, leitura, luzes baixas, dormir. O cérebro aprende o ritual e começa a preparar o sono.",
      "Mantenha o horário de acordar fixo mesmo nos fins de semana — isso âncora o relógio biológico.",
      "Diminua telas pelo menos 1 hora antes de dormir. A luz azul suprime melatonina e atrasa o sono.",
      "O quarto precisa estar escuro e fresco. Cortinas blackout são um excelente investimento.",
      "Considere melatonina em baixa dose (0,5-1mg) 30 minutos antes de dormir, especialmente em crianças com TDAH ou TEA. Discuta com o médico.",
    ],
    dontList: [
      "Não permita telas no quarto — celular, tablet, TV — especialmente após as 20h.",
      "Não entre no quarto da criança todas as vezes que ela chamar à noite. Ensine a se autorregular gradualmente.",
      "Não dê bebidas com cafeína — refrigerante, chá mate, achocolatado com muita cafeína — especialmente à tarde.",
      "Não force dormir a hora certa na base da punição. Rituais e consistência funcionam melhor que castigo.",
      "Não ignore ronco intenso, paradas respiratórias ou agitação excessiva durante o sono — pode ser apneia do sono.",
    ],
    alertSigns: [
      "Ronco intenso, pausas respiratórias, agitação ou posições estranhas durante o sono — avaliar apneia.",
      "Terror noturno frequente com grito, agitação e impossibilidade de consolar — diferente de pesadelo.",
      "Sonambulismo frequente com risco de queda ou saída de casa.",
    ],
    whenToSeekHelp: [
      "Quando a criança não consegue dormir sem a presença física de um adulto e isso está comprometendo a vida familiar.",
      "Quando há suspeita de apneia do sono — sonolência diurna excessiva, ronco alto, paradas respiratórias observadas.",
    ],
  },
  {
    id: "seletividade",
    title: "Seletividade Alimentar",
    emoji: "🥦",
    color: "from-green-500 to-emerald-600",
    doList: [
      "Exponha novos alimentos sem exigir que coma — coloque no prato, deixe olhar, cheirar, tocar. A exposição repetida sem pressão é o caminho.",
      "Inclua a criança no preparo — crianças que ajudam a cozinhar têm mais curiosidade sobre o que fizeram.",
      "Siga uma divisão de responsabilidades: você decide o que oferecer, ela decide se come e quanto. Não force, não suborn.",
      "Ofereça o mesmo alimento de 10 a 20 vezes em contextos variados. Parecer novidade diminui. A aceitação pode demorar muitas exposições.",
      "Se houver sensibilidade sensorial intensa (textura, cor, cheiro), considere terapia ocupacional com abordagem sensorial alimentar.",
    ],
    dontList: [
      "Não faça refeições separadas para a criança seletiva. Isso reforça o padrão e aumenta a seletividade a longo prazo.",
      "Não use TV ou tela para distrair e enfiar comida. A criança precisa aprender a comer presente, não desligada.",
      "Não negocie com comida (você come a cenoura e ganhar sorvete). Reforço com outro alimento cria relação negativa com os dois.",
      "Não faça expressões de nojo ou desaprovação — crianças são muito observadoras.",
      "Não catastrofize em voz alta — 'ele não come nada, vai ser desnutrido' na frente da criança piora a ansiedade alimentar.",
    ],
    alertSigns: [
      "Perda de peso ou ausência de ganho ponderal esperado para a faixa etária.",
      "Seletividade tão intensa que a criança aceita menos de 5-10 alimentos no total.",
      "Ansiedade extrema diante de alimentos novos, com choro, vômito ou reação de pânico.",
    ],
    whenToSeekHelp: [
      "Quando a seletividade está causando déficit nutricional real — encaminhar para nutricionista pediátrico e fonoaudiólogo.",
      "Quando há suspeita de ARFID (transtorno evitativo/restritivo da ingestão alimentar) — avaliação psiquiátrica e nutricional.",
    ],
  },
  {
    id: "enurese",
    title: "Enurese (Xixi na Cama)",
    emoji: "💧",
    color: "from-sky-500 to-blue-500",
    doList: [
      "Tranquilize a criança — enurese é muito comum (1 em cada 5 crianças aos 5 anos). Ela não faz de propósito e se envergonha muito.",
      "Limite líquidos 2 horas antes de dormir, especialmente sucos, refrigerantes e chá. Água pode ser dada com moderação.",
      "Leve ao banheiro antes de dormir como parte da rotina, mesmo que diga que não precisa.",
      "Considere o alarme de enurese — é o tratamento com maior taxa de cura a longo prazo. O dispositivo acorda na primeira gota.",
      "Registre os dias secos e celebre discretamente. Um calendário com estrelinhas pode motivar sem pressionar.",
    ],
    dontList: [
      "Nunca envergonhe, grite ou puna por molhar a cama. Isso piora a enurese por ansiedade e destrói a autoestima.",
      "Não diga 'você não faz isso de propósito, né?' em tom de desconfiança. Enurese raramente é deliberada.",
      "Não acorde para ir ao banheiro às 3h da manhã — isso prejudica o sono sem ajudar a treinar a bexiga.",
      "Não retire a fralda antes de a criança estar pronta. Forçar prontidão antes da hora cria trauma.",
      "Não faça a criança lavar o próprio lençol como punição. Pode participar, mas como parte do cuidado, não como humilhação.",
    ],
    alertSigns: [
      "Criança que estava seca por 6 meses e voltou a molhar — enurese secundária pode indicar estresse, abuso ou problema médico.",
      "Enurese diurna (xixi de dia) associada à noturna — pode ser problema vesical ou neurológico.",
      "Dor ao urinar, frequência aumentada, ou urina com cheiro forte — investigar infecção urinária.",
    ],
    whenToSeekHelp: [
      "Quando a enurese persiste após os 7 anos sem resposta a mudanças de rotina básicas — medicação e alarme podem ser indicados.",
      "Quando há enurese secundária (criança que estava seca e voltou a molhar) — sempre investigar causa.",
    ],
  },
];

function DisorderCard({ disorder }: { disorder: Disorder }) {
  const [open, setOpen] = useState(false);

  return (
    <Card className="border-card-border overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        data-testid={`button-disorder-${disorder.id}`}
        className="w-full text-left"
      >
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${disorder.color} flex items-center justify-center text-lg shadow-sm`}>
              <span>{disorder.emoji}</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">{disorder.title}</h3>
              <p className="text-xs text-muted-foreground">{disorder.doList.length} orientações • {disorder.alertSigns.length} alertas</p>
            </div>
          </div>
          {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-border">
          <CardContent className="p-4 space-y-5">
            {/* O Que Fazer */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-wide flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" /> O Que Fazer
              </h4>
              <ul className="space-y-2">
                {disorder.doList.map((item, i) => (
                  <li key={i} className="flex gap-2 text-xs text-foreground">
                    <span className="w-1.5 h-1.5 mt-1.5 rounded-full bg-green-500 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* O Que NÃO Fazer */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wide flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5" /> O Que NÃO Fazer
              </h4>
              <ul className="space-y-2">
                {disorder.dontList.map((item, i) => (
                  <li key={i} className="flex gap-2 text-xs text-foreground">
                    <span className="w-1.5 h-1.5 mt-1.5 rounded-full bg-red-500 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Sinais de Alerta */}
            <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/20 p-3 space-y-2">
              <h4 className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> Sinais de Alerta
              </h4>
              <ul className="space-y-1.5">
                {disorder.alertSigns.map((item, i) => (
                  <li key={i} className="flex gap-2 text-xs text-amber-800 dark:text-amber-300">
                    <span className="w-1.5 h-1.5 mt-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Quando Procurar Ajuda */}
            <div className="rounded-lg border border-blue-300 bg-blue-50 dark:bg-blue-950/20 p-3 space-y-2">
              <h4 className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wide flex items-center gap-1.5">
                <PhoneCall className="w-3.5 h-3.5" /> Quando Procurar Ajuda
              </h4>
              <ul className="space-y-1.5">
                {disorder.whenToSeekHelp.map((item, i) => (
                  <li key={i} className="flex gap-2 text-xs text-blue-800 dark:text-blue-300">
                    <span className="w-1.5 h-1.5 mt-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </div>
      )}
    </Card>
  );
}

export default function OrientacaoParentalPage() {
  const [search, setSearch] = useState("");

  const filtered = disorders.filter(d =>
    d.title.toLowerCase().includes(search.toLowerCase()) ||
    d.doList.some(i => i.toLowerCase().includes(search.toLowerCase())) ||
    d.dontList.some(i => i.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center shadow-sm">
          <Heart className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-bold">Orientação para Pais</h1>
          <p className="text-xs text-muted-foreground">Guia prático por transtorno — linguagem acessível</p>
        </div>
        <Badge variant="secondary" className="text-xs">{disorders.length} transtornos</Badge>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Buscar por transtorno ou orientação..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full h-10 px-4 rounded-xl border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        data-testid="input-search-disorder"
      />

      {/* Intro card */}
      {!search && (
        <Card className="border-card-border bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/20 dark:to-pink-950/20">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Este guia foi feito para ser compartilhado com as famílias. As orientações usam linguagem direta e prática, pensada para a realidade do dia a dia. Cada transtorno tem orientações sobre o que fazer, o que evitar, sinais de alerta e quando procurar ajuda.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Disorder list */}
      <div className="space-y-3">
        {filtered.map(d => (
          <DisorderCard key={d.id} disorder={d} />
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-10 text-sm text-muted-foreground">
            Nenhum resultado para &quot;{search}&quot;.
          </div>
        )}
      </div>
    </div>
  );
}
