import type { ScaleEntry } from "./scaleFilter";

export interface RecoveredMonitor {
  id: string; name: string; version: string; source: string; sourceKind: "pdf" | "authored-app"; sourceNote: string;
  ageMin: number; ageMax: number; windowDays: number; schoolDays?: boolean;
  respondents: Array<"pais" | "professor" | "clinico">;
  contexts: string[]; focus: string; cluster: string;
  instruction: string; labels: string[]; maxPoint: number; direction: "higher_better" | "higher_worse";
  metric: "mean" | "percent"; domainMinimum: number; globalMinimum: number;
  domains: Array<{ name: string; items: string[] }>;
  redFlags: string[];
}
export const AUTHORIAL_NOTICE = "Instrumento clínico autoral de monitorização, não teste diagnóstico validado. Sem percentis, normas populacionais, classificação de gravidade ou ponto de corte diagnóstico. A revisão profissional é necessária.";
const safety = [
  "Perda de habilidade anteriormente adquirida ou piora funcional abrupta.",
  "Autoagressão, fala de morte, agressão com risco ou incapacidade de manter a segurança.",
  "Fuga ou exposição a trânsito, água, altura ou outro perigo imediato.",
  "Alteração de consciência, perda de resposta, crise convulsiva ou novo déficit neurológico.",
  "Engasgos recorrentes, dificuldade respiratória, recusa de líquidos, sedação intensa ou dificuldade incomum para despertar.",
  "Dor importante, febre com mudança de comportamento, reação medicamentosa importante, violência ou bullying grave.",
];
const appSource = "github:jadsonfraga/neuroped@b7adca686b8dba657b4b1317583f485cede7a0c8:client/src/data/interactiveScaleItemsAuthorial20260910.ts";
const operationalNote = "Fonte integral: redação autoral operacional já existente na branch de 10/09/2026. O PDF original não foi recuperado; não afirmar equivalência textual com ele. Preservar este contrato e iniciar basal próprio, sem converter versões anteriores.";
const common = { windowDays: 14, respondents: ["pais", "professor", "clinico"] as RecoveredMonitor["respondents"], contexts: ["casa", "escola", "terapia"], redFlags: safety };

export const recoveredAuthorialMonitors: RecoveredMonitor[] = [
  {
    ...common, id: "adapta-18-sdg", name: "ADAPTA-18 SDG", version: "2.0-app-20260910", source: appSource, sourceKind: "authored-app", sourceNote: operationalNote,
    ageMin: 36, ageMax: 215, focus: "transicoes", cluster: "irritabilidade-transicoes", maxPoint: 3, direction: "higher_worse", metric: "mean", domainMinimum: 4, globalMinimum: 14,
    instruction: "Considere os últimos 14 dias. Marque quanto cada situação interferiu na participação habitual. Use N/O quando não houve oportunidade suficiente. Esta é a revisão operacional autoral para o app, não uma reconstrução textual do PDF anterior.",
    labels: ["0 — Não ocorreu / sem dificuldade relevante", "1 — Ocasional ou leve; apoio breve costuma bastar", "2 — Frequente ou moderado; exige apoio estruturado", "3 — Intenso; interrompe participação ou exige apoio prolongado", "N/O — Não observado / não aplicável"],
    domains: [
      { name: "A. Transições e passagem entre atividades", items: [
        "Mesmo com aviso prévio, interromper uma atividade muito desejada exige vários lembretes ou intervenção direta do adulto.",
        "Depois que uma atividade termina, demora para iniciar a próxima porque permanece preso(a) ao que estava fazendo.",
        "Trocas de ambiente, como sair de casa, mudar de sala ou ir para outra etapa da rotina, provocam resistência ou perda de organização.",
        "Quando o percurso, a sequência ou o horário habitual muda, precisa de apoio adicional para seguir a rotina.",
        "Passar de tela, brincadeira ou interesse preferido para uma obrigação cotidiana costuma gerar conflito ou atraso prolongado.",
        "Encerrar visita, aula, passeio ou outra situação e efetivamente ir embora costuma exigir negociação repetida ou ajuda intensa.",
      ] },
      { name: "B. Flexibilidade diante de imprevistos e alternativas", items: [
        "Uma mudança inesperada de plano provoca reação emocional maior do que a situação costuma exigir.",
        "Tem dificuldade para aceitar pessoa, material, lugar ou forma de fazer diferente daquela esperada.",
        "Quando a primeira estratégia não funciona, continua insistindo nela mesmo após receber orientação para tentar outra.",
        "Pequenas mudanças na ordem ou no horário das atividades geram preocupação, oposição ou necessidade de confirmação repetida.",
        "Quando uma opção desejada fica indisponível, permanece fixado(a) nela por tempo que atrapalha escolher outra possibilidade.",
        "Aceitar uma alternativa razoável costuma depender de mediação repetida do adulto, mesmo quando a alternativa já é conhecida.",
      ] },
      { name: "C. Recuperação e retorno à participação", items: [
        "Depois de ouvir um limite, errar ou perder algo desejado, demora para voltar ao estado habitual.",
        "Após conflito ou frustração, continua retomando o acontecimento de modo que atrapalha a atividade seguinte.",
        "Precisa de ajuda intensa do adulto para reorganizar-se depois de um contratempo cotidiano.",
        "Mesmo após se acalmar visivelmente, permanece com participação reduzida ou evita retomar o que estava previsto.",
        "Uma frustração em um momento do dia interfere de forma perceptível em atividades posteriores ou em outro ambiente.",
        "Quando está muito frustrado(a), tem dificuldade para usar uma estratégia de recuperação já conhecida, como pedir ajuda, fazer pausa ou combinar uma alternativa.",
      ] },
    ],
  },
  {
    ...common, id: "porta-20-sdg", name: "PORTA-20 SDG", version: "2.0-pdf-arquivo-2.1-20260910", source: "NeuroPed_SDG_PORTA20_Premium_v2_1_2026-09-10.pdf · sha256:4686c65cb711a6e09ba5481ae9c63073792b6a8f459eba093bd5677b64005198", sourceKind: "pdf", sourceNote: "O nome do arquivo informa v2_1, mas o conteúdo e rodapés informam v2.0. Contrato identificado por ambos, sem presumir uma nova versão clínica. Faixa impressa 4–10 anos, inclusive.",
    ageMin: 48, ageMax: 131, schoolDays: true, respondents: ["professor", "clinico"], contexts: ["escola"], focus: "participacao-escolar", cluster: "participacao-escolar", maxPoint: 3, direction: "higher_worse", metric: "mean", domainMinimum: 4, globalMinimum: 16,
    instruction: "Considere os últimos 14 dias com frequência escolar e a demanda de apoio adicional além dos apoios habituais já previstos. Responda apenas se observou diretamente a rotina escolar. Não retirar apoios eficazes para testar independência. N/O não entra no denominador.",
    labels: ["0 — Sem demanda adicional relevante. Participa com os apoios habituais já previstos.", "1 — Apoio breve. Uma pista, lembrete, antecipação ou ajuste simples costuma bastar.", "2 — Apoio estruturado. Exige repetição, adaptação planejada, supervisão próxima ou pausa para manter participação.", "3 — Apoio intensivo. Exige intervenção prolongada/individual ou a participação fica interrompida, muito reduzida ou insegura.", "N/O — Não observado, sem oportunidade suficiente ou não aplicável."],
    domains: [
      { name: "A. Chegada e transições", items: [
        "Na chegada, precisa de intervenção repetida do adulto para separar-se do acompanhante e iniciar a rotina.",
        "Depois de entrar na escola, demora para se organizar e participar da primeira atividade do período.",
        "Trocas entre sala, recreio, banheiro, refeitório ou outro espaço provocam resistência, atraso ou perda de organização.",
        "Mudanças avisadas de horário, professor, atividade ou sequência do dia exigem apoio maior do que o habitual.",
        "Na saída ou em outra transição de encerramento, apresenta dificuldade que interfere na organização ou segurança.",
      ] },
      { name: "B. Início, sustentação e conclusão de atividades", items: [
        "Mesmo entendendo a proposta, precisa de vários lembretes para iniciar uma atividade compatível com sua rotina escolar.",
        "Perde o objetivo da tarefa durante a execução e necessita de redirecionamentos frequentes para continuar.",
        "Precisa que instruções sejam repetidas, reduzidas ou apresentadas passo a passo para conseguir acompanhar.",
        "Necessita de presença muito próxima do adulto para concluir atividades que, em outros momentos, já consegue realizar com menos ajuda.",
        "Ao longo do turno, a participação cai de forma perceptível e exige aumento de pausas, pistas ou redução de demanda.",
      ] },
      { name: "C. Autonomia prática e comunicação de necessidades", items: [
        "Precisa de ajuda adicional para localizar, guardar ou organizar materiais pessoais e escolares.",
        "Precisa de apoio adicional para higiene, banheiro, alimentação ou hidratação durante a rotina escolar.",
        "Tem dificuldade para comunicar que precisa de ajuda, pausa, água, banheiro, mudança de posição ou outro suporte.",
        "Quando sente dor, mal-estar ou desconforto, tem dificuldade para sinalizar o problema de forma compreensível antes de se desorganizar.",
        "Precisa de supervisão adicional para deslocar-se e permanecer em ambientes da escola com segurança.",
      ] },
      { name: "D. Participação social, autorregulação e recuperação", items: [
        "Tem dificuldade para entrar em atividade de grupo mesmo quando recebe convite, modelo ou apoio inicial.",
        "Esperar a vez, dividir materiais ou lidar com limites gera conflitos que interrompem a participação.",
        "Após frustração, correção ou erro, demora para se reorganizar e voltar à atividade proposta.",
        "Barulho, aglomeração, toque, iluminação ou movimento do ambiente reduzem claramente sua participação.",
        "Tem dificuldade para pedir ajuda ou uma pausa antes que a sobrecarga evolua para choro, fuga, agressividade, paralisação ou abandono da atividade.",
      ] },
    ],
  },
  {
    ...common, id: "ticar-18-sdg", name: "TICAR-18 SDG", version: "1.1-app-fonte-20260910", source: appSource, sourceKind: "authored-app", sourceNote: operationalNote,
    ageMin: 60, ageMax: 215, windowDays: 7, focus: "tiques", cluster: "tiques", maxPoint: 3, direction: "higher_worse", metric: "mean", domainMinimum: 4, globalMinimum: 14,
    instruction: "Considere os últimos 7 dias e a repercussão dos tiques, não apenas quantas vezes apareceram. Não peça à criança que contenha o tique para pontuar melhor. Use N/O quando o item não pôde ser observado. Este monitor não diferencia tiques de crises epilépticas ou outros movimentos anormais. Autorrelato requer avaliação própria; esta aplicação é para adultos observadores.",
    labels: ["0 — Sem repercussão relevante", "1 — Repercussão pequena", "2 — Repercussão moderada", "3 — Repercussão importante", "N/O — Não observado / informação insuficiente"],
    domains: [
      { name: "A. Conforto corporal e esforço de contenção", items: [
        "Os movimentos ou sons causaram dor, ardor, irritação, fadiga muscular ou outro desconforto físico perceptível.",
        "A criança interrompeu uma atividade desejada para se recompor fisicamente depois de uma sequência de tiques.",
        "Houve machucado, vermelhidão, dor de cabeça, rouquidão ou outro efeito corporal associado ao padrão de tiques.",
        "A criança relatou incômodo interno, sensação de pressão ou necessidade difícil de adiar antes de alguns movimentos ou sons.",
        "Depois de tentar conter ou disfarçar os tiques por algum tempo, ficou mais cansada, irritada ou precisou de pausa para se reorganizar.",
        "Na rotina de dormir, preocupação ou desconforto relacionado aos tiques dificultou relaxar e iniciar o sono.",
      ] },
      { name: "B. Participação e desempenho nas atividades", items: [
        "Os tiques atrapalharam leitura, escrita, desenho, uso de teclado, recorte ou outra atividade que exige coordenação fina.",
        "Os tiques interromperam fala, leitura em voz alta, resposta oral ou outra situação de comunicação.",
        "Durante tarefa escolar ou atividade dirigida, a criança perdeu o ritmo ou precisou de tempo extra por causa dos tiques.",
        "Os tiques atrapalharam alimentação, higiene, vestir-se ou outra rotina prática do dia.",
        "Os tiques reduziram participação em brincadeira, esporte, passeio ou atividade física que a criança queria realizar.",
        "A criança evitou ou abandonou uma situação social, escolar ou pública porque os tiques estavam difíceis de manejar naquele momento.",
      ] },
      { name: "C. Contexto, autorregulação e repercussão social", items: [
        "Comentários, olhares, brincadeiras ou perguntas de outras pessoas sobre os tiques causaram desconforto ou mudaram a participação da criança.",
        "Pedidos para \"parar\", \"se controlar\" ou esconder os tiques aumentaram tensão, vergonha, irritação ou dificuldade de continuar a atividade.",
        "A criança gastou esforço perceptível tentando esconder os tiques em sala, consulta, transporte, visita ou outro ambiente social.",
        "Foi necessário sair brevemente do ambiente, fazer uma pausa ou ir a um local mais reservado por causa da carga de tiques ou do desconforto associado.",
        "A família ou a escola precisou explicar, mediar ou proteger a criança diante de reação inadequada de outras pessoas aos tiques.",
        "Os tiques, ou a preocupação com eles, geraram sofrimento suficiente para a criança pedir ajuda, reclamar repetidamente ou evitar uma situação.",
      ] },
    ],
  },
  {
    ...common, id: "ponte-16-sdg", name: "PONTE-16 SDG", version: "1.0-app-fonte-20260910", source: appSource, sourceKind: "authored-app", sourceNote: operationalNote,
    ageMin: 36, ageMax: 216, contexts: ["multiplos"], focus: "generalizacao", cluster: "generalizacao", maxPoint: 3, direction: "higher_better", metric: "mean", domainMinimum: 2, globalMinimum: 12,
    instruction: "Considere os últimos 14 dias. Responda sobre o que fez quando teve oportunidade em casa, escola, terapia ou comunidade. Esta aplicação exige observação suficiente em pelo menos dois contextos; não preencher por suposição nem combinar numericamente formulários de pessoas diferentes. Use N/O quando não houve oportunidade suficiente.",
    labels: ["0 — Não demonstrou / aparece apenas em treino muito dirigido", "1 — Demonstra com ajuda direta ou em contexto muito específico", "2 — Demonstra com pista leve ou em mais de um contexto", "3 — Demonstra espontaneamente e de modo consistente quando há oportunidade", "N/O — Não observado / oportunidade insuficiente"],
    domains: [
      { name: "A. Transferência entre ambientes", items: [
        "Usa fora do local de treino uma habilidade que já aprendeu ou praticou em terapia, escola, consulta ou em casa.",
        "Usa formas de comunicação já conhecidas para pedir, responder ou compartilhar necessidades em mais de um ambiente.",
        "Executa uma rotina familiar, como guardar material, higiene ou organização, mesmo quando ela acontece em outro lugar.",
        "Aplica uma habilidade de autonomia em uma situação real do cotidiano, e não somente quando alguém transforma a situação em treino.",
      ] },
      { name: "B. Transferência entre pessoas e materiais", items: [
        "Responde a uma instrução ou combinado já conhecido quando ele é apresentado por mais de uma pessoa familiar.",
        "Consegue usar a mesma habilidade com materiais, exemplos ou objetos diferentes daqueles usados durante o ensino inicial.",
        "Usa uma habilidade social ou comunicativa aprendida com pessoas diferentes, quando a situação pede essa habilidade.",
        "Mantém o desempenho quando muda quem oferece o apoio, sem precisar reaprender toda a tarefa com cada adulto.",
      ] },
      { name: "C. Espontaneidade e dependência de pistas", items: [
        "Inicia uma habilidade já aprendida quando a situação pede, sem esperar uma ordem direta para começar.",
        "Pede ajuda, esclarecimento, pausa ou recurso necessário antes que o adulto precise adivinhar ou antecipar tudo.",
        "Depois de um erro ou dificuldade, tenta uma estratégia já ensinada sem depender de condução passo a passo.",
        "Conclui ações familiares com pouca ou nenhuma repetição de comandos, gestos-modelo ou ajuda física.",
      ] },
      { name: "D. Estabilidade e utilidade funcional", items: [
        "Mantém uma habilidade já adquirida mesmo quando há pequenas variações naturais de horário, sequência ou ambiente.",
        "Continua demonstrando uma habilidade após alguns dias sem treino direto daquela tarefa.",
        "Usa uma habilidade aprendida para resolver uma necessidade real, como terminar uma tarefa, participar, comunicar-se ou cuidar de si.",
        "O uso das habilidades aprendidas reduz ajuda adulta ou melhora de forma perceptível a participação em atividades do cotidiano.",
      ] },
    ],
  },
  {
    ...common, id: "rota-aut-18-sdg", name: "ROTA-AUT 18 SDG", version: "1.0-pdf-20260911", source: "ROTA_AUT_18_SDG_v1_0_11-09-2026.pdf · sha256:1bc9ce1fda6ae6b57012621e6a803917169f8f09928ca7db68d5345447161aca", sourceKind: "pdf", sourceNote: "Fonte integral conferida. Percentual funcional descritivo, não percentil nem medida de idade mental. Não reduzir supervisão de segurança apenas por pontuação alta.",
    ageMin: 48, ageMax: 215, contexts: ["casa", "escola"], focus: "autonomia", cluster: "autonomia", maxPoint: 4, direction: "higher_better", metric: "percent", domainMinimum: 3, globalMinimum: 1,
    instruction: "Considere os últimos 14 dias e o desempenho habitual, não o melhor nem o pior dia. Pontue o que a criança faz na maior parte das oportunidades. Considere apoios e adaptações em uso. Não tente atividades perigosas para testar independência. N/O não entra no cálculo. Formulários de respondentes diferentes são separados.",
    labels: ["0 — Não demonstrado: o adulto realiza quase tudo, ou a habilidade não é executada com apoio habitual.", "1 — Apoio intenso: participa apenas com orientação passo a passo e ajuda contínua.", "2 — Apoio frequente: realiza partes da tarefa, mas precisa de vários lembretes, pistas ou ajuda prática.", "3 — Apoio leve: completa a tarefa com preparação do ambiente ou poucos lembretes.", "4 — Independente e seguro: completa de forma habitual, adequada ao contexto e sem supervisão extra além da esperada.", "N/O — Não observado / não aplicável"],
    domains: [
      { name: "A. Autocuidado e rotinas pessoais", items: [
        "Inicia a rotina de higiene pessoal quando chega o horário combinado, sem depender de repetidas cobranças.",
        "Executa os passos de higiene adequados ao seu nível de desenvolvimento (por exemplo: mãos, rosto, dentes, banho) na sequência esperada.",
        "Escolhe, veste e ajusta roupas e calçados compatíveis com a situação, com o nível de ajuda esperado para seu desenvolvimento.",
        "Percebe a necessidade de usar o banheiro ou comunica essa necessidade e realiza os passos da rotina com o apoio habitual.",
        "Participa da refeição de forma funcional: senta-se, utiliza utensílios ou estratégias adaptadas e encerra a refeição com organização compatível com seu nível.",
        "Prepara objetos pessoais necessários para sair de casa, ir à escola ou realizar uma atividade prevista.",
      ] },
      { name: "B. Organização e responsabilidade", items: [
        "Segue uma rotina curta de duas ou três etapas sem precisar que cada passo seja lembrado novamente.",
        "Confere se possui os materiais necessários antes de começar uma tarefa ou sair para uma atividade.",
        "Passa de uma atividade preferida para outra necessária usando a rotina combinada, sem que o adulto precise reorganizar tudo por ele.",
        "Percebe quando algo deu errado, ficou incompleto ou foi esquecido e tenta corrigir ou pede ajuda de forma específica.",
        "Usa algum marcador de tempo que já conhece - relógio, alarme, quadro visual ou aviso combinado - para se preparar para a próxima atividade.",
        "Cumpre uma responsabilidade simples e regular (guardar um objeto, organizar mochila, levar garrafa, separar material) com constância.",
      ] },
      { name: "C. Segurança e participação funcional", items: [
        "Diante de porta, portão, estacionamento ou rua, para e aguarda o adulto, sinal ou regra de segurança já ensinada.",
        "Em local público, mantém-se dentro do limite combinado de distância ou supervisão, compatível com seu desenvolvimento.",
        "Segue regras aprendidas diante de riscos domésticos relevantes, como calor, eletricidade, medicamentos, objetos cortantes, produtos químicos ou água.",
        "Sabe a quem recorrer ou como pedir ajuda quando se perde, se confunde, sente medo ou não consegue continuar uma tarefa.",
        "Comunica dor, mal-estar, medo, toque inadequado, ameaça ou outra situação que o faça se sentir inseguro, usando fala, gesto, comunicação alternativa ou outro meio confiável.",
        "Participa de uma tarefa simples fora de casa adequada ao seu nível (por exemplo: fazer um pedido, localizar um setor, entregar algo, acompanhar uma compra ou identificar o destino) com supervisão proporcional à necessidade.",
      ] },
    ],
  },
  {
    ...common, id: "ritmo-sono-20-sdg", name: "RITMO-SONO 20 SDG", version: "1.0-pdf-20260912", source: "RITMO_SONO_20_SDG_v1_0_12-09-2026.pdf · sha256:e710cf4a8fbc596698e3e41c4d8a9e959927233774309d8d868e7ddceff47e01", sourceKind: "pdf", sourceNote: "Fonte integral conferida. Escola/terapeuta pode contribuir apenas sobre repercussão diurna, não preencher o questionário noturno completo. Esta aplicação é a versão do cuidador; autorrelato paralelo não é misturado.",
    ageMin: 24, ageMax: 215, respondents: ["pais"], contexts: ["casa"], focus: "sono", cluster: "sono", maxPoint: 4, direction: "higher_worse", metric: "percent", domainMinimum: 1, globalMinimum: 1,
    instruction: "Considere os últimos 14 dias. Marque a frequência real, não a gravidade percebida. Evento pouco frequente, mas intenso, deve ser descrito separadamente. Doença, viagem, férias ou mudanças de medicação precisam ser registradas. Use N/O quando não observável.",
    labels: ["0 — Não ocorreu: nenhum dia ou situação praticamente ausente.", "1 — Pouco frequente: 1–2 dias nos últimos 14 dias.", "2 — Intermitente: 3–5 dias nos últimos 14 dias.", "3 — Frequente: 6–9 dias nos últimos 14 dias.", "4 — Muito frequente: 10–14 dias nos últimos 14 dias.", "N/O — Não observável / não se aplica"],
    domains: [
      { name: "A. Preparação e início do sono", items: [
        "Permanece acordado por mais de 30 minutos depois de já estar deitado, com luzes reduzidas e rotina de dormir encerrada.",
        "Precisa que um adulto permaneça ao lado, converse, embale ou intervenha repetidamente para conseguir adormecer, além do apoio habitual esperado para sua idade.",
        "Sai da cama, adia o horário ou reinicia atividades várias vezes depois de a família sinalizar que é hora de dormir.",
        "Fica mais alerta após telas, brincadeiras agitadas ou atividades estimulantes perto do horário de dormir, dificultando o início do sono.",
        "O horário em que finalmente adormece varia mais de 1 hora entre dias com rotina semelhante.",
      ] },
      { name: "B. Continuidade e conforto noturno", items: [
        "Acorda durante a noite e permanece desperto por pelo menos 15 minutos antes de voltar a dormir.",
        "Depois de um despertar noturno, precisa de ajuda prolongada do cuidador para retornar ao sono.",
        "Apresenta movimentação corporal intensa, chutes, troca constante de posição ou inquietação que fragmenta o próprio sono ou o de quem dorme perto.",
        "Queixa-se ou demonstra desconforto noturno recorrente - dor, coceira, congestão, tosse, refluxo, calor ou outro incômodo - que interrompe o sono.",
        "Acorda antes do horário planejado e não consegue retomar o sono, apesar de ainda haver tempo previsto para dormir.",
      ] },
      { name: "C. Ritmo, despertar e sonolência", items: [
        "O horário de acordar varia mais de 2 horas entre dias semelhantes, sem que haja necessidade externa clara para essa diferença.",
        "Precisa de vários chamados, contato físico repetido ou muito tempo para despertar o suficiente e iniciar a rotina da manhã.",
        "Dorme de forma não planejada durante o dia em situações em que normalmente se esperaria que permanecesse acordado.",
        "Faz cochilo tardio ou prolongado que empurra o horário de dormir e desorganiza o restante da noite.",
        "Nos fins de semana ou folgas, desloca o horário de dormir e/ou acordar de modo acentuado em comparação aos dias de rotina.",
      ] },
      { name: "D. Impacto diurno e familiar", items: [
        "Nas primeiras horas após acordar, apresenta irritabilidade, choro, oposição ou lentidão que parece relacionada a ter dormido mal.",
        "Após uma noite ruim, mostra piora perceptível de atenção, participação, rendimento ou persistência em tarefas ao longo do dia.",
        "A sonolência interfere em refeições, deslocamentos, escola, terapias, brincadeiras ou atividades familiares.",
        "A rotina noturna exige reorganização relevante da família - um cuidador perde sono, muda de quarto, interrompe trabalho ou deixa outras tarefas para manejar o sono da criança/adolescente.",
        "O padrão de sono gera preocupação recorrente da família ou da própria criança/adolescente e altera decisões sobre compromissos do dia seguinte.",
      ] },
    ],
    redFlags: [
      "Pausas respiratórias observadas, engasgos repetidos, esforço para respirar, coloração arroxeada/pálida incomum ou despertares com sensação de sufocamento.",
      "Rigidez, abalos rítmicos, postura focal, perda de resposta, automatismos incomuns ou confusão prolongada ao despertar, especialmente se estereotipados.",
      "Episódios de sono irresistível em atividade, quedas de tônus desencadeadas por emoção ou sonolência nova e intensa sem explicação clara.",
      "Sair de casa/quarto, subir em locais altos, abrir portas/janelas, manipular objetos perigosos ou sofrer lesões durante episódios noturnos.",
      "Redução marcante da necessidade de sono acompanhada de aceleração comportamental, agitação fora do habitual ou mudança importante de humor.",
      "Perda de peso, dor persistente, vômitos recorrentes, cefaleia matinal frequente, piora neurológica ou queda funcional associada ao problema de sono.",
    ],
  },
];

export const RECOVERED_MONITOR_IDS = new Set(recoveredAuthorialMonitors.map((d) => d.id));
export function recoveredRoute(id: string) { return `/filtro?autoral=acervo&instrumento=${encodeURIComponent(id)}`; }
const complaints: Record<string, string[]> = { transicoes: ["comportamento"], "participacao-escolar": ["aprendizagem", "funcionalidade"], tiques: ["tiques"], generalizacao: ["funcionalidade", "evolucao"], autonomia: ["autonomia", "funcionalidade"], sono: ["sono"] };
export const recoveredMonitorCatalog: ScaleEntry[] = recoveredAuthorialMonitors.map((d) => ({
  id: d.id, name: d.name, fullName: `${d.name} · ${d.version}`, ageMin: d.ageMin, ageMax: d.ageMax,
  queixas: complaints[d.focus], respondente: d.respondents, prioridade: "monitorizacao", assessmentUse: "monitorizacao",
  tempo: `${d.domains.flatMap((v) => v.items).length} itens; tempo não aferido`, appRoute: recoveredRoute(d.id),
  implementationStatus: "complete", description: `${d.instruction} ${AUTHORIAL_NOTICE} ${d.sourceNote}`,
  fonte: d.source, licencaUso: "autoral", validacaoBrasil: "Sem validação psicométrica publicada.",
  pendente_validacao_clinica: true, pendencia: d.sourceNote,
  suicideRiskInstrument: false, psychosisRiskInstrument: false, verbalRequirement: "indiferente", literacyRequirement: "indiferente",
  scoringCutoff: "Sem cortes diagnósticos. Cobertura e direção específicas do instrumento; nunca somar escalas diferentes.",
  signalTags: [d.focus, d.cluster, "monitorizacao funcional"],
}));

/** Mesmos nomes com números diferentes são instrumentos distintos, não versões equivalentes. */
export const unresolvedAuthorialSources = [
  { id: "elo-com-18-sdg", name: "ELO-COM 18 SDG", reason: "PDF/itens integrais não recuperados. Não substituir pelo ELO-COM 30." },
  { id: "vigia-med-18-sdg", name: "VIGIA-MED 18 SDG", reason: "PDF/itens integrais não recuperados. VIGIA-MED 24 já existe e não é substituto equivalente." },
];
