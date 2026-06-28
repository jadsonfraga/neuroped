// Sistema de Sinais e Sintomas Expandidos por Queixa e Idade
// Estrutura granular para permitir seleção específica além de categorias gerais

export interface Signal {
  id: string;
  label: string;
  description: string;
  severity?: "leve" | "moderado" | "grave";
}

export interface SymptomCluster {
  id: string;
  label: string;
  signals: Signal[];
}

export interface QueixaSignalMap {
  queixaId: string;
  queixaLabel: string;
  ageRange: string; // "0-6m" | "6-12m" | "1-2a" | "2-4a" | "4-6a" | "6-12a" | "12-18a"
  ageMin: number;
  ageMax: number;
  clusters: SymptomCluster[];
}

// TDAH - Sinais e Sintomas Expandidos
export const tdahSignals: QueixaSignalMap[] = [
  {
    queixaId: "tdah",
    queixaLabel: "TDAH",
    ageRange: "4-6a",
    ageMin: 48,
    ageMax: 71,
    clusters: [
      {
        id: "tdah-atencao-precoce",
        label: "Desatenção Precoce (4-6 anos)",
        signals: [
          { id: "tdah-dificuldade-focar", label: "Dificuldade de focar em atividades breves", description: "Não consegue manter atenção em brinquedos ou tarefas por mais de 5-10 minutos" },
          { id: "tdah-segue-instrucoes", label: "Dificuldade em seguir instruções simples", description: "Esquece ou não segue instruções básicas do dia a dia (2-3 passos)" },
          { id: "tdah-organizacao-precoce", label: "Desorganização em casa", description: "Dificuldade com rotina, perde objetos frequentemente, espaço desorganizado" },
          { id: "tdah-distrai-facilmente", label: "Distração muito fácil", description: "Desvia atenção constantemente com ruídos ou movimentos menores" },
        ]
      },
      {
        id: "tdah-hiperatividade-precoce",
        label: "Hiperatividade Precoce (4-6 anos)",
        signals: [
          { id: "tdah-movimento-excessivo", label: "Movimento corporal excessivo", description: "Constantemente se mexendo, inquieto, dificuldade em ficar sentado" },
          { id: "tdah-fala-excessiva", label: "Fala excessiva e desorganizada", description: "Fala muito, com dificuldade em deixar outros falarem, desorganiza pensamentos" },
          { id: "tdah-impulsividade-basica", label: "Impulsividade básica", description: "Corre sem avisar, responde perguntas antes de terminar, dificuldade de esperar vez" },
          { id: "tdah-brincadeira-barulhenta", label: "Brincadeira muito barulhenta/agitada", description: "Parece sempre em modo 'acelerado', brinca de forma desorganizada" },
        ]
      }
    ]
  },
  {
    queixaId: "tdah",
    queixaLabel: "TDAH",
    ageRange: "6-12a",
    ageMin: 72,
    ageMax: 143,
    clusters: [
      {
        id: "tdah-atencao-escolar",
        label: "Desatenção Escolar (6-12 anos)",
        signals: [
          { id: "tdah-lese-instrucoes", label: "Lê instrições mas não segue", description: "Pede para repetir instruções mesmo tendo ouvido; erros por desatenção" },
          { id: "tdah-perde-material", label: "Perde material escolar/pessoal", description: "Frequentemente perde lápis, dever, mochilas, brinquedos, cartas de identidade" },
          { id: "tdah-dificuldade-tarefas", label: "Dificuldade em completar tarefas", description: "Começa deveres mas não termina; 'esquecido' de tarefas de casa" },
          { id: "tdah-evita-focado", label: "Evita tarefas que exigem foco", description: "Reluta em começar ou fazer lição de casa; prefere TV/videogame" },
          { id: "tdah-erros-desatencao", label: "Erros por desatenção em provas", description: "Erra contas fáceis, lê errado, deixa em branco porque não leu bem" },
          { id: "tdah-aula-dificuldade", label: "Dificuldade em prestar atenção em aula", description: "Professores reclamam que não acompanha; frequentemente 'desligado' em sala" },
        ]
      },
      {
        id: "tdah-hiperatividade-escolar",
        label: "Hiperatividade/Impulsividade Escolar (6-12 anos)",
        signals: [
          { id: "tdah-nao-fica-sentado", label: "Não fica sentado em sala/mesa", description: "Sai do lugar, levanta frequentemente, mexe constantemente os pés/pernas" },
          { id: "tdah-fala-excessiva-aula", label: "Fala excessiva e desorganizada na aula", description: "Fala fora de hora, interrompe professora/colegas, dificuldade de esperar" },
          { id: "tdah-impulsivo-respostas", label: "Responde impulsivamente", description: "Levanta a mão e depois esquece o que ia falar; responde antes de terminar pergunta" },
          { id: "tdah-dificuldade-aguardar", label: "Dificuldade de esperar sua vez", description: "Na fila, em brincadeiras, em conversas — não consegue aguardar" },
          { id: "tdah-intrometido-atividades", label: "Se intromete em atividades/conversas", description: "Interrompe conversas, atrapalha brincadeiras de outros, invade espaço" },
          { id: "tdah-brincar-desorganizado", label: "Brincadeira desorganizada/perigosa", description: "Brinca de forma muito agitada; corre/pula em locais inapropriados" },
        ]
      },
      {
        id: "tdah-funcional-escolar",
        label: "Impacto Funcional Escolar (6-12 anos)",
        signals: [
          { id: "tdah-rendimento-baixo", label: "Rendimento escolar abaixo do esperado", description: "Notas baixas apesar de capacidade; repetência ou risco de reprovação" },
          { id: "tdah-relacao-professora", label: "Conflito frequente com professora", description: "Repreensões frequentes; chamada à direção; anotações no caderno" },
          { id: "tdah-relacao-colegas", label: "Dificuldade de relacionamento com colegas", description: "Discute, bate em colegas; chamado de 'chato'; poucos amigos" },
          { id: "tdah-autoestima-baixa", label: "Autoestima baixa/sentimento de incapacidade", description: "Fala 'Eu sou burro', 'Ninguém gosta de mim', recusa-se a tentar" },
        ]
      }
    ]
  },
  {
    queixaId: "tdah",
    queixaLabel: "TDAH",
    ageRange: "12-18a",
    ageMin: 144,
    ageMax: 216,
    clusters: [
      {
        id: "tdah-atencao-adolescente",
        label: "Desatenção em Adolescentes (12-18 anos)",
        signals: [
          { id: "tdah-leitura-compreensao", label: "Dificuldade em ler e compreender", description: "Relê parágrafos múltiplas vezes; não absorve conteúdo mesmo estudando" },
          { id: "tdah-organizacao-academica", label: "Desorganização acadêmica", description: "Perde deveres, datas de provas, material; agenda desorganizada" },
          { id: "tdah-procrastinacao", label: "Procrastinação severa", description: "Deixa tudo para última hora; mesmo assim não consegue fazer bem" },
          { id: "tdah-distracao-digital", label: "Distraído por celular/internet", description: "Impossível estudar; fica em redes sociais/jogos apesar de intenção" },
          { id: "tdah-dificuldade-memória-trabalho", label: "Dificuldade de memória de trabalho", description: "Começa frase e esquece o que ia falar; dificuldade com cálculos mentais" },
        ]
      },
      {
        id: "tdah-impulsividade-adolescente",
        label: "Impulsividade em Adolescentes (12-18 anos)",
        signals: [
          { id: "tdah-risco-comportamento", label: "Comportamentos arriscados", description: "Dirige sem atenção, toma riscos desnecessários, envolvimento em acidentes" },
          { id: "tdah-gastos-impulsivos", label: "Gastos e decisões impulsivas", description: "Compra sem pensar; troca de planos constantemente; gasta mesada rápido" },
          { id: "tdah-relacionamento-problematico", label: "Relacionamentos problemáticos", description: "Brigas frequentes, término abrupto de relacionamentos, ciúmes" },
          { id: "tdah-abuso-substancia", label: "Risco aumentado para abuso de substâncias", description: "Experimentou drogas/álcool impulsivamente; busca constante de novidade" },
        ]
      }
    ]
  }
];

// TEA - Sinais e Sintomas Expandidos
export const teaSignals: QueixaSignalMap[] = [
  {
    queixaId: "tea",
    queixaLabel: "Transtorno do Espectro Autista",
    ageRange: "0-6m",
    ageMin: 0,
    ageMax: 5,
    clusters: [
      {
        id: "tea-social-precoce",
        label: "Déficit Social Muito Precoce (0-6 meses)",
        signals: [
          { id: "tea-contato-olho-ausente", label: "Ausência de contato ocular", description: "Não fixa olhar em rostos; não segue pessoas com o olhar" },
          { id: "tea-sorriso-social", label: "Ausência de sorriso social", description: "Não sorri para cuidadores; indiferente a vozes familiares" },
          { id: "tea-resposta-nome", label: "Não responde ao próprio nome", description: "Aos 6 meses ainda não vira para chamar do nome (pode sugerir audição também)" },
          { id: "tea-interesse-pessoas", label: "Desinteresse por pessoas", description: "Parece mais interessado em objetos que em interação; não acompanha movimentos" },
        ]
      }
    ]
  },
  {
    queixaId: "tea",
    queixaLabel: "Transtorno do Espectro Autista",
    ageRange: "6-12m",
    ageMin: 6,
    ageMax: 11,
    clusters: [
      {
        id: "tea-social-comunicacao-6m",
        label: "Déficit Social e Comunicativo (6-12 meses)",
        signals: [
          { id: "tea-balbucio-reduzido", label: "Balbucio reduzido ou ausente", description: "Aos 6-12m não balbacia; balbucio não social (não para chamar atenção)" },
          { id: "tea-gestos-ausentes", label: "Ausência de gestos communicativos", description: "Não aponta; não acena; não estende braço para ser pego" },
          { id: "tea-atencao-compartilhada", label: "Ausência de atenção compartilhada", description: "Não segue apontado; não mostra objetos para compartilhar interesse" },
          { id: "tea-resposta-social", label: "Resposta social reduzida", description: "Indiferente a brincadeiras sociais (esconde-esconde, palminhas)" },
          { id: "tea-preferencia-isolamento", label: "Preferência por isolamento", description: "Brinca sozinho; não busca proximidade com cuidadores (não é tímido, é desinteresse)" },
        ]
      },
      {
        id: "tea-comportamento-6m",
        label: "Comportamentos Restritos/Repetitivos (6-12 meses)",
        signals: [
          { id: "tea-repetitivo-movimentos", label: "Movimentos repetitivos", description: "Flapping (mexe mãos repetitivamente), alinhamento de brinquedos" },
          { id: "tea-fixacao-objetos", label: "Fixação em partes de objetos", description: "Apenas interessa as rodas do carro, não brinca com o todo" },
          { id: "tea-sensorial-atipico", label: "Resposta sensorial atípica", description: "Cobre as mãos nos ouvidos, sniff de objetos, tato de texturas incomum" },
        ]
      }
    ]
  },
  {
    queixaId: "tea",
    queixaLabel: "Transtorno do Espectro Autista",
    ageRange: "1-2a",
    ageMin: 12,
    ageMax: 23,
    clusters: [
      {
        id: "tea-social-toddler",
        label: "Déficit Social em Toddlers (1-2 anos)",
        signals: [
          { id: "tea-linguagem-atrasada", label: "Linguagem expressiva atrasada ou ausente", description: "Poucas palavras aos 18m (esperado 50+); palavras desconexas sem contexto" },
          { id: "tea-nao-presta-atencao", label: "Não presta atenção quando chamado", description: "Parece 'desligado'; mesmo teste auditiva normal" },
          { id: "tea-ecolalia", label: "Ecolalia (repetição de palavras)", description: "Repete o que ouve exatamente; não usa linguagem funcionalmente" },
          { id: "tea-gestos-funcionais", label: "Gestos funcionais ausentes", description: "Não aponta para pedir; não acena tchau; não cabeça para 'sim'" },
          { id: "tea-jogar-simbolico", label: "Ausência de jogo simbólico", description: "Não brinca de 'faz de conta'; não oferece boneca mamadeira imaginária" },
        ]
      },
      {
        id: "tea-comportamento-toddler",
        label: "Comportamentos Restritos (1-2 anos)",
        signals: [
          { id: "tea-rotina-rigida", label: "Necessidade de rotinas rígidas", description: "Distress se rota muda; insiste em mesmo caminho, mesma ordem de atividades" },
          { id: "tea-interesse-restrito", label: "Interesses extremamente restritos", description: "Apenas gira rodas, apenas aspira pó, apenas ordena itens" },
          { id: "tea-sensorial-sensibilidade", label: "Sensibilidade sensorial extrema", description: "Cobre ouvidos em barulhos normais; recusa certos alimentos por textura" },
          { id: "tea-comportamento-repetitivo", label: "Comportamentos motores repetitivos", description: "Flapping persistente, ponta de pé, rotação de objetos, alinhamento obsessivo" },
        ]
      }
    ]
  },
  {
    queixaId: "tea",
    queixaLabel: "Transtorno do Espectro Autista",
    ageRange: "2-4a",
    ageMin: 24,
    ageMax: 47,
    clusters: [
      {
        id: "tea-social-preschool",
        label: "Déficit Social Pré-Escolar (2-4 anos)",
        signals: [
          { id: "tea-interacao-prefere-adultos", label: "Interage melhor com adultos que pares", description: "Com direcionamento de adulto consegue, mas com crianças não inicia" },
          { id: "tea-dificuldade-jogar-coletivo", label: "Dificuldade em jogar coletivo", description: "Não consegue esperar vez; não adapta brincadeira às regras dos outros" },
          { id: "tea-amizade-superficial", label: "Dificuldade em fazer amigos genuínos", description: "Pode falar com colegas mas sem reciprocidade real; não mantém amizades" },
          { id: "tea-emocao-inadequada", label: "Expressão emocional inadequada", description: "Ri em momentos inapropriados; chora sem razão aparente; humor plano" },
          { id: "tea-interesse-objetos", label: "Mais interesse em objetos que pessoas", description: "Quando criança está chorando ao lado, ele ignora; prefere brinquedos" },
        ]
      },
      {
        id: "tea-comunicacao-preschool",
        label: "Comunicação Atípica (2-4 anos)",
        signals: [
          { id: "tea-fala-robotica", label: "Fala robótica ou formal", description: "Intonação estranha, como gravador; pronúncia impecável mas sem entonação" },
          { id: "tea-dificuldade-conversa", label: "Dificuldade em manter conversa", description: "Monologa sobre interesse próprio; não faz perguntas; não nota desinteresse do outro" },
          { id: "tea-linguagem-literal", label: "Interpretação literal da linguagem", description: "Não entende metáforas, piadas ou duplo sentido" },
          { id: "tea-pronomes-invertidos", label: "Confusão de pronomes (primeira/segunda pessoa)", description: "Diz 'ele quer' quando quer; 'você quer' quando alguém quer" },
        ]
      },
      {
        id: "tea-comportamento-preschool",
        label: "Comportamentos e Interesses Restritos (2-4 anos)",
        signals: [
          { id: "tea-interesse-particular-fixo", label: "Interesse fixo em tópico particular", description: "Fala APENAS sobre dinossauros, trens, letras, números; recusa outro tema" },
          { id: "tea-resistencia-mudanca", label: "Resistência e angústia com mudanças", description: "Meltdown se rota muda; insiste em mesma roupa, comida, sequência" },
          { id: "tea-alinhamento-ordenacao", label: "Alinhamento ou ordenação obsessiva", description: "Alinha brinquedos em linhas retas; abre/fecha portas repetidamente" },
          { id: "tea-movimento-estereotipado", label: "Movimentos estereotipados persistentes", description: "Flapping, ponta de pé, rotação do corpo, balanceio; piora com emoção" },
        ]
      },
      {
        id: "tea-sensorial-preschool",
        label: "Diferenças Sensoriais (2-4 anos)",
        signals: [
          { id: "tea-sensibilidade-auditiva", label: "Sensibilidade auditiva extrema", description: "Cobre ouvidos em locais normais (supermercado); pânico com certos sons" },
          { id: "tea-seletividade-alimentar", label: "Seletividade alimentar extrema", description: "Apenas certos alimentos (cor, marca, textura); recusa pelo cheiro mesmo" },
          { id: "tea-preferencia-texturas", label: "Preferência incomum por texturas", description: "Apenas tecidos macios; tira etiquetas obsessivamente; recusa certos materiais" },
          { id: "tea-aceitacao-toque", label: "Dificuldade em aceitar toque", description: "Hipertenso ao toque; recusa abraços mesmo de familiares" },
        ]
      }
    ]
  },
  {
    queixaId: "tea",
    queixaLabel: "Transtorno do Espectro Autista",
    ageRange: "4-6a",
    ageMin: 48,
    ageMax: 71,
    clusters: [
      {
        id: "tea-social-escola",
        label: "Déficit Social em Ambiente Escolar (4-6 anos)",
        signals: [
          { id: "tea-isolamento-escolar", label: "Isolamento social na escola", description: "Brinca sozinho no pátio; não participa de brincadeiras grupais" },
          { id: "tea-amizade-dificuldade", label: "Dificuldade em iniciar/manter amizades", description: "Colegas não o convidam; ele não tenta se aproximar; sem amigos de verdade" },
          { id: "tea-compreensao-regras-sociais", label: "Incompreensão de regras sociais implícitas", description: "Não sabe quando é hora de falar/calar; invade espaço pessoal; falta filtro" },
          { id: "tea-empatia-observada", label: "Dificuldade de empatia observada", description: "Não consola colega que chora; não percebe quando ofende; sem culpa aparente" },
        ]
      },
      {
        id: "tea-acadmica-escola",
        label: "Dificuldades Acadêmicas (4-6 anos)",
        signals: [
          { id: "tea-foco-seletivo", label: "Foco seletivo (hiperfoco em interesse)", description: "Só quer ler sobre dinossauros; recusa ler histórias; domina números/letras antes" },
          { id: "tea-seguir-instrucoes", label: "Dificuldade em seguir instruções de grupo", description: "Quando instrução é sobre assunto de interesse, segue; caso contrário, ignora" },
          { id: "tea-transicao-atividades", label: "Dificuldade com transições", description: "Resiste em mudar de atividade; quer continuar no mesmo jogo/tarefa" },
          { id: "tea-angustia-mudanca-rotina", label: "Angústia com mudança de rotina escolar", description: "Pânico em dia de aula diferente; se substituto vem, dia é perdido emocionalmente" },
        ]
      }
    ]
  }
];

// ATRASO DO DESENVOLVIMENTO
export const atrasoSignals: QueixaSignalMap[] = [
  {
    queixaId: "atraso",
    queixaLabel: "Atraso do Desenvolvimento",
    ageRange: "0-6m",
    ageMin: 0,
    ageMax: 5,
    clusters: [
      {
        id: "atraso-motor-precoce",
        label: "Atraso Motor (0-6 meses)",
        signals: [
          { id: "atraso-controle-cabeca", label: "Controle de cabeça atrasado", description: "Aos 3m ainda não sustenta cabeça; aos 4-5m cabeça ainda muito mole" },
          { id: "atraso-rolamento", label: "Não consegue rolar", description: "Aos 5-6m ainda não rola de costas para barriga; imobilidade preocupante" },
          { id: "atraso-sustentacao", label: "Não sustenta peso nas pernas", description: "Quando levantado, não clica pés no chão; pernas muito frouxas ou muito rígidas" },
          { id: "atraso-preensao", label: "Preensão fraca ou ausente", description: "Não segura objetos oferecidos; mão aberta mesmo com estímulo" },
        ]
      },
      {
        id: "atraso-cognitivo-precoce",
        label: "Atraso Cognitivo (0-6 meses)",
        signals: [
          { id: "atraso-seguimento-visual", label: "Seguimento visual inadequado", description: "Não acompanha movimento de brinquedos; não foca em rosto" },
          { id: "atraso-resposta-estimulo", label: "Resposta reduzida a estímulos", description: "Não reage a sons; parece desligado; dificuldade em acordar" },
          { id: "atraso-interesse-brinquedos", label: "Sem interesse em brinquedos", description: "Oferece brinquedo, criança ignora; não inicia exploração" },
        ]
      }
    ]
  },
  {
    queixaId: "atraso",
    queixaLabel: "Atraso do Desenvolvimento",
    ageRange: "6-12m",
    ageMin: 6,
    ageMax: 11,
    clusters: [
      {
        id: "atraso-motor-6m",
        label: "Atraso Motor (6-12 meses)",
        signals: [
          { id: "atraso-sentado", label: "Não consegue sentar sem apoio", description: "Aos 9m ainda não senta; quando colocado senta mas com suporte" },
          { id: "atraso-engatinhado", label: "Ausência de engatinhado", description: "Aos 12m ainda não engatinha; apenas arrasta ou não se move" },
          { id: "atraso-bipedismo", label: "Não consegue ficar de pé com apoio", description: "Aos 9-12m não consegue se levantar agarrado em móvel" },
          { id: "atraso-pinça", label: "Ausência de pinça fina", description: "Aos 9-10m não consegue pegar pequenos objetos com polegar e indicador" },
        ]
      },
      {
        id: "atraso-linguagem-6m",
        label: "Atraso de Linguagem (6-12 meses)",
        signals: [
          { id: "atraso-balbucio", label: "Balbucio ausente ou muito reduzido", description: "Aos 9-12m não balbacia; apenas sons ocasionais" },
          { id: "atraso-compreensao", label: "Não compreende palavras simples", description: "Aos 12m não entende 'não', 'oi', seu próprio nome" },
          { id: "atraso-primeiras-palavras", label: "Sem primeiras palavras", description: "Aos 12-13m nenhuma palavra clara tipo 'mamã' ou 'papá'" },
          { id: "atraso-gestos-comunicativos", label: "Sem gestos comunicativos", description: "Não aponta; não acena; não estende braço para ser pego" },
        ]
      }
    ]
  }
];

// ANSIEDADE
export const ansiedadeSignals: QueixaSignalMap[] = [
  {
    queixaId: "ansiedade",
    queixaLabel: "Ansiedade",
    ageRange: "4-6a",
    ageMin: 48,
    ageMax: 71,
    clusters: [
      {
        id: "ansiedade-separacao",
        label: "Ansiedade de Separação (4-6 anos)",
        signals: [
          { id: "ansiedade-sep-mae", label: "Apego excessivo a cuidador principal", description: "Chora ao sair de vista da mãe; impossível deixar em escola/creche" },
          { id: "ansiedade-sep-sono", label: "Recusa de dormir sozinho", description: "Precisa que adulto fique; acordar noite procurando cuidador" },
          { id: "ansiedade-sep-somatico", label: "Queixa somática ao separar", description: "Quando vai separar, diz 'dói barriguinha', 'dói cabeça'" },
          { id: "ansiedade-sep-pesadelos", label: "Pesadelos com temas de separação", description: "Sonha que mãe morreu, que foi perdido, que ninguém volta buscar" },
        ]
      },
      {
        id: "ansiedade-social",
        label: "Ansiedade Social (4-6 anos)",
        signals: [
          { id: "ansiedade-soc-estranhos", label: "Medo extremo de estranhos", description: "Esconde em cuidador; recusa falar com pessoas novas; chora" },
          { id: "ansiedade-soc-atividades", label: "Recusa participar em atividades em grupo", description: "Não entra na aula, não vai ao aniversário de colega; muito tímido" },
          { id: "ansiedade-soc-vergonha", label: "Vergonha extrema/rubor", description: "Fica todo vermelho; quer morrer de vergonha; evita ser centro atenção" },
        ]
      },
      {
        id: "ansiedade-fobias",
        label: "Fobias Específicas (4-6 anos)",
        signals: [
          { id: "ansiedade-fobia-animais", label: "Fobia de animais (cão, gato)", description: "Pânico quando vê animal; esconde/chora; evita casas com pets" },
          { id: "ansiedade-fobia-barulhos", label: "Fobia de barulhos (sirene, trovão)", description: "Cobre ouvidos; vai para quarto mais interno; pânico mesmo leve trovão" },
          { id: "ansiedade-fobia-escuro", label: "Fobia de escuro", description: "Recusa dormir sem luz; pânico em local escuro; imagina monstros" },
        ]
      }
    ]
  },
  {
    queixaId: "ansiedade",
    queixaLabel: "Ansiedade",
    ageRange: "6-12a",
    ageMin: 72,
    ageMax: 143,
    clusters: [
      {
        id: "ansiedade-gad-crianca",
        label: "Ansiedade Generalizada (6-12 anos)",
        signals: [
          { id: "ansiedade-gad-preocupacao", label: "Preocupação excessiva diária", description: "Preocupa com tudo: notas, saúde, segurança; dificuldade em desligar" },
          { id: "ansiedade-gad-somatico", label: "Queixas somáticas frequentes", description: "Diz frequentemente: dor de cabeça, barriga, desconforto sem causa clear" },
          { id: "ansiedade-gad-sono", label: "Insônia relacionada à ansiedade", description: "Dificuldade em adormecer; mente acelerada; acorda noite com preocupações" },
          { id: "ansiedade-gad-tensao", label: "Tensão muscular/irritabilidade", description: "Tenso, rígido; facilmente irritado; dificuldade em relaxar" },
        ]
      },
      {
        id: "ansiedade-escolar",
        label: "Ansiedade Escolar (6-12 anos)",
        signals: [
          { id: "ansiedade-esc-recusa", label: "Recusa escolar ou absentismo", description: "Frequentemente recusa ir à escola; falta muitos dias sem estar doente" },
          { id: "ansiedade-esc-provas", label: "Ansiedade de prova severa", description: "Antes de prova: vômito, diarréia, tremores; branco mental mesmo sabendo" },
          { id: "ansiedade-esc-apresentacao", label: "Pânico com apresentações públicas", description: "Seminário/apresentação causa pânico; choro; impossível fazer em aula" },
          { id: "ansiedade-esc-tarefas", label: "Ansiedade com tarefas de casa", description: "Toma horas para fazer; pede ajuda constantemente; revê 20 vezes" },
        ]
      }
    ]
  }
];

// COMPORTAMENTO
export const comportamentoSignals: QueixaSignalMap[] = [
  {
    queixaId: "comportamento",
    queixaLabel: "Comportamento / Externalizantes",
    ageRange: "2-4a",
    ageMin: 24,
    ageMax: 47,
    clusters: [
      {
        id: "comportamento-oposicao",
        label: "Comportamento Opositivo (2-4 anos)",
        signals: [
          { id: "comp-recusa-instrucoes", label: "Recusa frequente de instruções", description: "Diz 'não' a tudo; deliberadamente desobedece; quer fazer ao seu modo" },
          { id: "comp-birra-frequente", label: "Birras frequentes e intensas", description: "Chora, grita, piso, bate quando não consegue o que quer; dura 20+ minutos" },
          { id: "comp-argumentacao", label: "Argumentação/discussão excessiva", description: "Discute tudo com adulto; nunca aceita 'não'; quer sempre última palavra" },
          { id: "comp-tantrums", label: "Tantrums sem razão aparente", description: "Birra pode começar do nada; sem trigger claro; muito impredizível" },
        ]
      },
      {
        id: "comportamento-agressao",
        label: "Agressão (2-4 anos)",
        signals: [
          { id: "comp-bate-pais", label: "Bate em pais/cuidadores", description: "Soca, chuta pais quando frustrado; sem controle; não é acidental" },
          { id: "comp-agride-colegas", label: "Agride crianças na creche", description: "Pega brincadeiras, bate, puxa cabelo; professora reclama frequentemente" },
          { id: "comp-morde-pica", label: "Morde ou pica outras crianças", description: "Deixa marcas com dentes ou unhas; faz na raiva mas também brincando" },
          { id: "comp-destrói-brinquedos", label: "Destrói brinquedos propositalmente", description: "Quebra itens quando está mal; sem remorso; refaz comportamento" },
        ]
      }
    ]
  },
  {
    queixaId: "comportamento",
    queixaLabel: "Comportamento / Externalizantes",
    ageRange: "6-12a",
    ageMin: 72,
    ageMax: 143,
    clusters: [
      {
        id: "comportamento-desafio",
        label: "Desafio a Autoridade (6-12 anos)",
        signals: [
          { id: "comp-desafio-pais", label: "Desafio aberto a pais", description: "Nega o que foi pedido deliberadamente; faz pior coisa possível; combativa" },
          { id: "comp-regras-ignora", label: "Ignora regras deliberadamente", description: "Sabe a regra mas faz mesmo assim; testando limites constantemente" },
          { id: "comp-responsabilidade", label: "Nega responsabilidade", description: "Nunca é culpa dele; sempre culpa do outro; mente quando pegado" },
          { id: "comp-maledicencia", label: "Linguagem ofensiva/vulgar", description: "Xinga pais, professores; xingamentos intencionais para machucar" },
        ]
      },
      {
        id: "comportamento-agressao-escolar",
        label: "Agressão Escolar (6-12 anos)",
        signals: [
          { id: "comp-bullying-ativo", label: "Bullying ativo (agressor)", description: "Agride colegas fisicamente; rouba; aterroriza crianças menores" },
          { id: "comp-agressao-professora", label: "Agressão verbal/física a professoras", description: "Xinga professora; bate mesa; ameaça; insubordinado em aula" },
          { id: "comp-vandalismo", label: "Vandalismo escolar", description: "Picha, quebra carteiras, destrói material escolar; tira sarro" },
        ]
      },
      {
        id: "comportamento-roubo",
        label: "Roubo e Mentira Patológica (6-12 anos)",
        signals: [
          { id: "comp-roubo", label: "Rouba frequentemente", description: "De pais, escola, colegas; não é por necessidade; por adrenalina ou hábito" },
          { id: "comp-mentira", label: "Mentira frequente e compulsiva", description: "Mente mesmo quando verdade seria melhor; sobre qualquer coisa; sem razão" },
          { id: "comp-tagarelice", label: "Tagarelice patológica", description: "Histórias elaboradas falsas; não consegue parar; fabulação" },
        ]
      }
    ]
  }
];

// TEA - extensão escolar/adolescente para o filtro não ficar preso só até 6 anos
export const teaExtendedSignals: QueixaSignalMap[] = [
  {
    queixaId: "tea",
    queixaLabel: "Transtorno do Espectro Autista",
    ageRange: "6-12a",
    ageMin: 72,
    ageMax: 143,
    clusters: [
      {
        id: "tea-pragmatica-escolar",
        label: "Comunicação Social / Pragmática (6-12 anos)",
        signals: [
          { id: "tea-pragmatica-conversa", label: "Conversa unilateral ou pouco recíproca", description: "Monologa, muda pouco de tema e não percebe sinais de desinteresse." },
          { id: "tea-pragmatica-piadas", label: "Dificuldade com piadas, ironia ou duplo sentido", description: "Interpreta de forma literal e se confunde em situações sociais." },
          { id: "tea-pragmatica-turnos", label: "Dificuldade em alternar turnos de fala", description: "Interrompe, fala sobre o próprio interesse ou responde fora do contexto." },
          { id: "tea-pragmatica-contexto", label: "Comunicação muda muito conforme o contexto", description: "Vai melhor com adulto estruturando, mas piora com pares ou grupos." },
        ],
      },
      {
        id: "tea-social-escolar-avancado",
        label: "Socialização Escolar (6-12 anos)",
        signals: [
          { id: "tea-amizade-ingenua", label: "Amizades frágeis ou ingênuas", description: "Quer amigos, mas não entende reciprocidade, limites ou brincadeiras coletivas." },
          { id: "tea-bullying-isolamento", label: "Bullying, exclusão ou isolamento", description: "Fica só, é alvo de colegas ou não percebe provocações." },
          { id: "tea-regras-sociais-implicitas", label: "Dificuldade com regras sociais implícitas", description: "Não capta combinados não ditos, tom de voz ou expressão facial." },
          { id: "tea-sofrimento-social", label: "Sofrimento após interação social", description: "Chega exausto, irritado ou choroso depois de escola/festas." },
        ],
      },
      {
        id: "tea-flexibilidade-sensorial-escolar",
        label: "Rigidez, Hiperfoco e Sensorialidade (6-12 anos)",
        signals: [
          { id: "tea-hiperfoco-escolar", label: "Hiperfoco que atrapalha rotina escolar", description: "Insiste no mesmo tema e resiste a tarefas fora do interesse." },
          { id: "tea-mudanca-rotina-escolar", label: "Crise com mudança de rotina", description: "Substituição de professor, passeio ou alteração de sala desorganiza o dia." },
          { id: "tea-sobrecarga-sensorial-escolar", label: "Sobrecarga sensorial na escola", description: "Barulho, fila, recreio ou uniforme geram irritação, fuga ou choro." },
          { id: "tea-seletividade-alimentar-escolar", label: "Seletividade alimentar impactando escola", description: "Recusa merenda, marcas ou texturas e isso limita permanência/rotina." },
        ],
      },
    ],
  },
  {
    queixaId: "tea",
    queixaLabel: "Transtorno do Espectro Autista",
    ageRange: "12-18a",
    ageMin: 144,
    ageMax: 216,
    clusters: [
      {
        id: "tea-adolescente-camuflagem",
        label: "Camuflagem e Exaustão Social (12-18 anos)",
        signals: [
          { id: "tea-camuflagem-social", label: "Camufla sintomas em público", description: "Imita pares, ensaia respostas e colapsa em casa depois." },
          { id: "tea-exaustao-social", label: "Exaustão intensa após socializar", description: "Precisa de isolamento prolongado depois da escola ou eventos." },
          { id: "tea-amizades-instaveis", label: "Amizades instáveis ou muito assimétricas", description: "É explorado, não percebe intenção do outro ou se apega demais." },
          { id: "tea-vulnerabilidade-social", label: "Ingenuidade/vulnerabilidade social", description: "Dificuldade de julgar risco, malícia, pressão de pares ou abuso." },
        ],
      },
      {
        id: "tea-adolescente-funcional",
        label: "Funcionalidade e Autonomia no Adolescente",
        signals: [
          { id: "tea-autonomia-baixa", label: "Autonomia abaixo do esperado", description: "Precisa de ajuda excessiva para higiene, organização, dinheiro ou deslocamento." },
          { id: "tea-planejamento-vida-diaria", label: "Dificuldade de planejar rotina", description: "Perde prazos, esquece materiais e se desorganiza sem adulto." },
          { id: "tea-rigidez-incerteza", label: "Intolerância à incerteza", description: "Sofre quando planos mudam ou quando precisa decidir sem regra clara." },
          { id: "tea-sofrimento-ansioso-social", label: "Ansiedade social secundária ao TEA", description: "Evita grupos por medo de errar socialmente ou ser ridicularizado." },
        ],
      },
    ],
  },
];

// Linguagem / comunicação
export const linguagemSignals: QueixaSignalMap[] = [
  {
    queixaId: "linguagem",
    queixaLabel: "Linguagem / Comunicação",
    ageRange: "1-6a",
    ageMin: 12,
    ageMax: 71,
    clusters: [
      {
        id: "linguagem-expressiva-precoce",
        label: "Linguagem Expressiva",
        signals: [
          { id: "linguagem-poucas-palavras", label: "Poucas palavras para a idade", description: "Vocabulário reduzido, frases ausentes ou muito curtas." },
          { id: "linguagem-frases-atrasadas", label: "Não combina palavras/frases", description: "Não junta duas palavras ou não estrutura frases simples." },
          { id: "linguagem-inteligibilidade-baixa", label: "Fala pouco inteligível", description: "Família entende, mas pessoas de fora têm dificuldade." },
          { id: "linguagem-ecolalia", label: "Ecolalia ou fala repetitiva", description: "Repete falas sem função comunicativa clara." },
        ],
      },
      {
        id: "linguagem-receptiva-precoce",
        label: "Compreensão / Receptiva",
        signals: [
          { id: "linguagem-nao-segue-comandos", label: "Não segue comandos simples", description: "Dificuldade para entender ordens de um ou dois passos." },
          { id: "linguagem-nao-responde-nome", label: "Não responde quando chamado", description: "Parece não ouvir apesar de audição aparentemente preservada." },
          { id: "linguagem-compreensao-baixa", label: "Compreensão abaixo da expressão", description: "Fala algumas palavras, mas entende pouco o que é pedido." },
        ],
      },
    ],
  },
  {
    queixaId: "linguagem",
    queixaLabel: "Linguagem / Comunicação",
    ageRange: "6-18a",
    ageMin: 72,
    ageMax: 216,
    clusters: [
      {
        id: "linguagem-pragmatica-escolar",
        label: "Pragmática e Narrativa",
        signals: [
          { id: "linguagem-narrativa-desorganizada", label: "Narrativa desorganizada", description: "Conta fatos sem sequência, perde começo/meio/fim ou detalhes essenciais." },
          { id: "linguagem-inferencia", label: "Dificuldade de inferência", description: "Lê ou ouve, mas não entende implícitos, intenção ou contexto." },
          { id: "linguagem-pragmatica-social", label: "Uso social da linguagem prejudicado", description: "Não adapta fala ao interlocutor, idade ou situação." },
          { id: "linguagem-vocabulario-academico", label: "Vocabulário acadêmico fraco", description: "Dificuldade com termos abstratos, textos e explicações escolares." },
        ],
      },
    ],
  },
];

// Aprendizagem
export const aprendizagemSignals: QueixaSignalMap[] = [
  {
    queixaId: "aprendizagem",
    queixaLabel: "Aprendizagem",
    ageRange: "6-18a",
    ageMin: 72,
    ageMax: 216,
    clusters: [
      {
        id: "aprendizagem-leitura-escrita",
        label: "Leitura e Escrita",
        signals: [
          { id: "aprendizagem-leitura-lenta", label: "Leitura lenta ou silabada", description: "Demora, troca letras ou evita leitura em voz alta." },
          { id: "aprendizagem-compreensao-texto", label: "Baixa compreensão de texto", description: "Decodifica, mas não entende a ideia principal." },
          { id: "aprendizagem-ortografia", label: "Muitos erros ortográficos persistentes", description: "Trocas, omissões e escrita muito abaixo da escolaridade." },
          { id: "aprendizagem-producao-textual", label: "Produção textual pobre", description: "Dificuldade para organizar frases, parágrafos e ideias." },
        ],
      },
      {
        id: "aprendizagem-matematica-executiva",
        label: "Matemática e Funções Executivas",
        signals: [
          { id: "aprendizagem-calculo", label: "Dificuldade em cálculo", description: "Erra operações básicas, fatos aritméticos ou valor posicional." },
          { id: "aprendizagem-problemas", label: "Dificuldade em problemas matemáticos", description: "Não identifica operação ou dados importantes." },
          { id: "aprendizagem-organizacao-escolar", label: "Desorganização escolar importante", description: "Perde tarefas, esquece prazos e não acompanha rotina." },
          { id: "aprendizagem-rendimento-discrepante", label: "Rendimento muito abaixo do potencial", description: "Esforça-se, mas desempenho não acompanha capacidade aparente." },
        ],
      },
    ],
  },
];

// Sono
export const sonoSignals: QueixaSignalMap[] = [
  {
    queixaId: "sono",
    queixaLabel: "Sono",
    ageRange: "0-18a",
    ageMin: 0,
    ageMax: 216,
    clusters: [
      {
        id: "sono-insonia-rotina",
        label: "Insônia e Rotina",
        signals: [
          { id: "sono-inicio-demorado", label: "Demora muito para iniciar sono", description: "Leva mais de 30-60 minutos para dormir com frequência." },
          { id: "sono-despertares", label: "Despertares noturnos frequentes", description: "Acorda várias vezes e precisa de ajuda para voltar a dormir." },
          { id: "sono-rotina-irregular", label: "Rotina de sono irregular", description: "Horários muito variáveis, telas à noite ou resistência intensa ao sono." },
          { id: "sono-sonolencia-diurna", label: "Sonolência diurna", description: "Cochila excessiva, irritabilidade ou queda escolar por sono ruim." },
        ],
      },
      {
        id: "sono-respiratorio-parassonia",
        label: "Respiração e Parassonias",
        signals: [
          { id: "sono-ronco-apneia", label: "Ronco alto ou pausas respiratórias", description: "Ronca, engasga ou parece parar de respirar durante o sono." },
          { id: "sono-pesadelos-terrores", label: "Pesadelos/terrores noturnos", description: "Episódios intensos de medo, gritos ou confusão à noite." },
          { id: "sono-pernas-inquietas", label: "Movimento de pernas/desconforto", description: "Precisa mexer pernas ou relata desconforto ao deitar." },
        ],
      },
    ],
  },
];

// Sensorial e funcionalidade, usados tanto isoladamente quanto como refinadores de TEA
export const sensorialSignals: QueixaSignalMap[] = [
  {
    queixaId: "sensorial",
    queixaLabel: "Sensorial",
    ageRange: "0-18a",
    ageMin: 0,
    ageMax: 216,
    clusters: [
      {
        id: "sensorial-hiperresponsividade",
        label: "Hiperresponsividade Sensorial",
        signals: [
          { id: "sensorial-auditivo", label: "Hipersensibilidade auditiva", description: "Cobre ouvidos, evita ambientes ruidosos ou entra em crise com sons comuns." },
          { id: "sensorial-tatil", label: "Hipersensibilidade tátil", description: "Recusa roupas, etiquetas, corte de cabelo/unhas ou toque." },
          { id: "sensorial-alimentar-textura", label: "Recusa por textura/cheiro de alimento", description: "Seletividade intensa por marca, cor, textura ou cheiro." },
          { id: "sensorial-visual", label: "Sensibilidade visual", description: "Incomoda-se com luz, movimento ou ambientes visualmente cheios." },
        ],
      },
      {
        id: "sensorial-busca-propriocepcao",
        label: "Busca Sensorial / Propriocepção",
        signals: [
          { id: "sensorial-busca-movimento", label: "Busca movimento intenso", description: "Pula, gira, corre ou se joga em objetos repetidamente." },
          { id: "sensorial-pressao-profunda", label: "Busca pressão profunda", description: "Aperta, se enfia em espaços, pede cobertor pesado ou abraços fortes." },
          { id: "sensorial-baixa-dor", label: "Resposta incomum à dor", description: "Parece não sentir dor ou reage de forma exagerada a estímulos leves." },
        ],
      },
    ],
  },
];

export const funcionalidadeSignals: QueixaSignalMap[] = [
  {
    queixaId: "funcionalidade",
    queixaLabel: "Funcionalidade / Autonomia",
    ageRange: "0-18a",
    ageMin: 0,
    ageMax: 216,
    clusters: [
      {
        id: "funcionalidade-avd-autonomia",
        label: "Atividades de Vida Diária",
        signals: [
          { id: "funcionalidade-higiene", label: "Dificuldade em higiene/autocuidado", description: "Precisa de ajuda acima do esperado para banho, escovar dentes ou vestir." },
          { id: "funcionalidade-alimentacao", label: "Baixa autonomia alimentar", description: "Dificuldade para comer sozinho, aceitar alimentos ou manter rotina alimentar." },
          { id: "funcionalidade-rotina", label: "Não acompanha rotina diária", description: "Precisa de prompts constantes para tarefas simples." },
          { id: "funcionalidade-seguranca", label: "Baixa noção de segurança", description: "Não percebe risco em rua, fogo, objetos cortantes ou estranhos." },
        ],
      },
      {
        id: "funcionalidade-escola-comunidade",
        label: "Escola e Comunidade",
        signals: [
          { id: "funcionalidade-participacao-escolar", label: "Participação escolar limitada", description: "Precisa de adaptação/mediador para acompanhar rotina da turma." },
          { id: "funcionalidade-generalizacao", label: "Não generaliza habilidades", description: "Aprende em terapia, mas não leva para casa/escola." },
          { id: "funcionalidade-impacto-familiar", label: "Impacto familiar importante", description: "Rotina da família gira em torno dos sintomas e crises." },
        ],
      },
    ],
  },
];

// Combinar todos os sinais por queixa
export const allSignalsMap: Record<string, QueixaSignalMap[]> = {
  tdah: tdahSignals,
  tea: [...teaSignals, ...teaExtendedSignals],
  atraso: atrasoSignals,
  ansiedade: ansiedadeSignals,
  comportamento: comportamentoSignals,
  linguagem: linguagemSignals,
  aprendizagem: aprendizagemSignals,
  sono: sonoSignals,
  sensorial: sensorialSignals,
  funcionalidade: funcionalidadeSignals,
  social: [...teaSignals, ...teaExtendedSignals],
};

export function getSignalsForQueixaAndAge(queixaId: string, ageMonths: number): SymptomCluster[] {
  const maps = allSignalsMap[queixaId] || [];
  const matching = maps.find(m => ageMonths >= m.ageMin && ageMonths <= m.ageMax);
  return matching?.clusters || [];
}

export function getAllSignalsForQueixa(queixaId: string): Signal[] {
  const maps = allSignalsMap[queixaId] || [];
  const allSignals: Signal[] = [];
  maps.forEach(map => {
    map.clusters.forEach(cluster => {
      allSignals.push(...cluster.signals);
    });
  });
  return allSignals;
}
