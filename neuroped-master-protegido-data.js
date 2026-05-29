/* NeuroPed Master — Área protegida (somente após PIN master).
   Conteúdo autoral do Dr. Jadson Fraga, transcrito da obra (PANT · 100 Escalas Passivas,
   Parte IV Farmacoterapia, Parte V Referências e Volume II Diretriz Dosimétrica TEA).

   As 100 escalas seguem a estrutura editorial templada da obra: cada lente é descrita
   por macrodomínio + tipo (competência/alerta), e a matriz 0–4 é gerada fielmente a
   partir dos textos-âncora da obra. Material educacional de apoio ao raciocínio clínico;
   doses, faixas e condutas individuais sempre conforme o médico assistente, bula e
   diretrizes vigentes. */
window.NEUROPED_MASTER_PRO = {

  /* ===================== 100 ESCALAS PASSIVAS ===================== */
  escalas: {
    principio: 'A avaliação passiva lê a criança em situação natural, sem desempenho sob comando. Nenhum item se conclui por um episódio isolado: o valor está na repetição entre contextos. Cada lente recebe nota de 0 a 4 segundo um de dois tipos de escala — competência ou alerta.',
    fechamento: 'As escalas passivas não substituem o juízo clínico; elas o adensam, o organizam e o tornam mais prudente. Quando convertidas em narrativa médica, protegem o laudo contra descrições vagas ou impressionistas. O melhor uso ocorre quando o item isolado é sempre recolocado dentro do macrodomínio, do contexto, do tempo e do impacto funcional real.',

    /* impacto funcional por macrodomínio (usado na tradução clínica e na frase de laudo) */
    macrodominios: [
      { faixa:'01–20', titulo:'Comunicação social e reciprocidade', eixo:'Eixo nuclear de reciprocidade e sociabilidade declarativa.',
        observa:'surge sem convocação artificial, especialmente quando a criança precisa dividir experiência, reconhecer o outro e sustentar trocas espontâneas',
        vidaReal:'Ganha nitidez em brincadeiras espontâneas, procura do adulto, partilha de novidades e encontros do cotidiano, em roda, pátio, trocas com colegas, regras sociais implícitas e participação em grupo e também na consulta.',
        impacto:'reciprocidade social, engajamento compartilhado, base para comunicação e leitura de pares',
        contextoCasa:'ganha nitidez em novidades, rodas, pátio e pequenas trocas nas quais {n} deveria aparecer sem convite excessivo',
        contextoConsulta:'aparece na entrada, na novidade e quando o encontro pode ser usado para dividir prazer, validar ou sustentar troca' },
      { faixa:'21–40', titulo:'Linguagem funcional, pragmática e simbolização', eixo:'Eixo de linguagem funcional, pragmática e simbolização.',
        observa:'aparece como ferramenta real de comunicação, não apenas como repetição, nomeação isolada ou resposta mecanizada',
        vidaReal:'Ganha nitidez em pedidos, comentários, compreensão da rotina, conversas espontâneas e brincadeiras simbólicas, em resposta a perguntas, compreensão de comandos, conversa em grupo e produção narrativa e também na consulta.',
        impacto:'comunicação funcional, linguagem social, simbolização e clareza de trocas',
        contextoCasa:'fica mais visível em pedidos, perguntas, comandos e narrativas nas quais {n} precisa ser usado com função real',
        contextoConsulta:'aparece quando a criança precisa explicar, responder, reparar mal-entendidos ou compartilhar experiência' },
      { faixa:'41–60', titulo:'Atenção, flexibilidade e função executiva', eixo:'Eixo de sustentação atencional, flexibilidade e rendimento executivo.',
        observa:'se mantém quando a demanda exige autorregulação, organização interna, mudança de foco e menor suporte externo',
        vidaReal:'Ganha nitidez em rotinas com começo, meio e fim, espera, frustração, trocas de atividade e autonomia em pequenas tarefas, em sala de aula, permanência em tarefa, leitura do contexto, monitoramento de erro e rendimento diário e também na consulta.',
        impacto:'autorregulação cognitiva, rendimento executivo, autonomia em tarefa e capacidade de generalização',
        contextoCasa:'emerge em espera, tarefa, transição e organização interna, cenários em que {n} costuma cobrar alto custo',
        contextoConsulta:'ganha força quando há mudança de proposta, atraso, regra nova ou redução de pistas externas' },
      { faixa:'61–80', titulo:'Modulação sensorial, praxia e autonomia adaptativa', eixo:'Eixo de modulação sensorial, praxia e autonomia adaptativa.',
        observa:'repercute no corpo em ação, no conforto sensorial, nas rotinas práticas e na eficiência adaptativa cotidiana',
        vidaReal:'Ganha nitidez em alimentação, banho, vestir-se, toque, sono, higiene, motricidade e rotina corporal, em sentar, recortar, escrever, ajustar postura, tolerar estímulos ambientais e seguir o ritmo da turma e também na consulta.',
        impacto:'modulação do corpo, eficiência motora, conforto sensorial e independência prática',
        contextoCasa:'aparece em alimentação, higiene, vestir-se, postura, escrita, ruído ambiental e ritmo corporal, contextos muito sensíveis para {n}',
        contextoConsulta:'fica visível na exploração sensorial, na coordenação motora e na tolerância ao manejo do corpo' },
      { faixa:'81–100', titulo:'Regulação emocional, risco e ecologia familiar-escolar', eixo:'Eixo de regulação, suporte, risco, ecologia escolar e prognóstico.',
        observa:'se expressa diante de frustração, imprevisibilidade, risco, exigência ambiental e necessidade de suporte funcional',
        vidaReal:'Ganha nitidez em mudanças de rotina, frustração, sono, crises, sobrecarga familiar e necessidade de previsibilidade, em permanência em sala, necessidade de apoio, risco, comportamento reativo e tolerância ao ambiente e também na consulta.',
        impacto:'estabilidade emocional, segurança, necessidade de suporte e força documental do caso',
        contextoCasa:'costuma surgir em frustração, previsibilidade, permanência em sala, necessidade de apoio e segurança funcional ligadas a {n}',
        contextoConsulta:'aparece na entrada, no manejo do limite, na leitura do humor e na coerência entre relatos' }
    ],

    /* matriz 0–4 (templates-âncora da obra) */
    tipos: {
      competencia: {
        legenda: 'Escala de competência: quanto maior a pontuação, melhor a espontaneidade, a estabilidade e a generalização funcional.',
        rotulos: ['ausente','muito frágil','inconsistente','funcional parcial','espontâneo e generalizado'],
        ancoragem: [
          '{N} não se evidencia de modo útil no cotidiano; a criança não sustenta esse recurso de forma espontânea.',
          '{N} aparece apenas sob convite intenso, modelagem forte ou contexto muito facilitado.',
          '{N} surge em alguns momentos, mas oscila bastante, depende do contexto e não se mantém com estabilidade.',
          '{N} já aparece de forma funcional em parte do cotidiano, porém ainda com custo, oscilação ou baixa generalização.',
          '{N} está presente de forma espontânea, estável e generalizada entre ambientes, com boa utilidade funcional.'
        ],
        falas: ['Ele ainda não faz isso sozinho.','Só acontece quando a gente puxa muito.','Tem dias que aparece e tem dias que some.','Já consegue em boa parte das vezes, mas ainda varia bastante.','Faz sozinho, em vários lugares, sem precisar puxar.'],
        traducao: 'Quando {n} está frágil, o caso tende a exigir mais mediação, mais estrutura e maior cautela na leitura de autonomia. Quando aparece preservado e generalizado, funciona como fator de proteção dentro de {imp}.',
        armadilha: 'Armadilha comum: considerar {n} preservado apenas porque surge com alto nível de convite, treinamento ou ambiente excessivamente mediado. O ponto decisivo é a espontaneidade, a estabilidade e a generalização entre contextos.',
        laudo: 'Observou-se {n} abaixo do esperado para a faixa do desenvolvimento funcional, com impacto sobre espontaneidade, generalização e autonomia relacional/operacional.',
        peso: 'Ganha peso quando a fragilidade em {n} se repete em família, escola e consulta, sobretudo se a criança melhora muito apenas sob mediação.'
      },
      alerta: {
        legenda: 'Escala de alerta: quanto maior a pontuação, maior a frequência, a intensidade, o impacto funcional e a necessidade de suporte.',
        rotulos: ['ausente','leve / ocasional','situacional','frequente','marcado / generalizado'],
        ancoragem: [
          'Não se observam sinais clinicamente relevantes de {n}.',
          '{N} aparece de forma rara, breve ou leve, sem repercussão funcional consistente.',
          '{N} surge em gatilhos específicos e já merece registro, embora ainda não seja um padrão amplo e contínuo.',
          '{N} é frequente e já interfere de modo perceptível no funcionamento, pedindo adaptações ambientais e leitura integrada.',
          '{N} é intenso, aparece em múltiplos contextos e tem peso relevante na definição de suporte e prognóstico.'
        ],
        falas: ['Isso não chama atenção no dia a dia.','Acontece de vez em quando, mas passa rápido.','Quando sai da rotina ou aperta mais, isso aparece.','Tem sido frequente e já atrapalha bastante.','É muito marcado, aparece em vários contextos e pesa bastante no dia.'],
        traducao: 'Quando {n} aparece elevado, frequente ou generalizado, aumenta a carga clínica do caso e ajuda a justificar a proporção do suporte. Quando é discreto, situacional ou ausente, o peso documental desse eixo diminui.',
        armadilha: 'Armadilha comum: atribuir {n} apenas a temperamento, fase ou "manha", sem verificar frequência, contexto, intensidade e repercussão funcional. O peso maior vem da recorrência e da convergência entre casa, escola e observação clínica.',
        laudo: 'Há sinais clínicos de {n}, com repercussão funcional relevante e necessidade de integração desse eixo à leitura global do caso.',
        peso: 'Ganha peso quando {n} se repete em mais de um ambiente, interfere no funcionamento e já pede adaptação concreta de suporte.'
      }
    },

    /* 100 itens: [n, nome, macrodomínio(0–4), tipo('c'|'a')] */
    itens: [
      [1,'Atenção compartilhada iniciada',0,'c'],[2,'Atenção compartilhada responsiva',0,'c'],[3,'Mostra social de objetos',0,'c'],[4,'Procura do outro para validação',0,'c'],[5,'Uso social do sorriso',0,'c'],[6,'Resposta ao nome',0,'c'],[7,'Qualidade do contato ocular',0,'c'],[8,'Alternância de olhar pessoa-objeto',0,'c'],[9,'Iniciativa de interação',0,'c'],[10,'Manutenção da troca social',0,'c'],[11,'Imitação espontânea',0,'c'],[12,'Imitação sob modelo',0,'c'],[13,'Jogo simbólico emergente',0,'c'],[14,'Flexibilidade de brincadeira',0,'c'],[15,'Interesse por pares',0,'c'],[16,'Reciprocidade em pares',0,'c'],[17,'Entendimento de turnos',0,'c'],[18,'Percepção de regras sociais implícitas',0,'c'],[19,'Comunicação de prazer compartilhado',0,'c'],[20,'Sinais sutis de isolamento social',0,'a'],
      [21,'Intenção comunicativa global',1,'c'],[22,'Gesto protoimperativo',1,'c'],[23,'Gesto protodeclarativo',1,'c'],[24,'Apontar funcional',1,'c'],[25,'Repertório gestual substitutivo',1,'c'],[26,'Compreensão de ordens simples',1,'c'],[27,'Compreensão de ordens complexas',1,'c'],[28,'Vocabulário receptivo funcional',1,'c'],[29,'Vocabulário expressivo funcional',1,'c'],[30,'Combinação de palavras',1,'c'],[31,'Organização sintática espontânea',1,'c'],[32,'Coerência narrativa',1,'c'],[33,'Pragmática conversacional',1,'c'],[34,'Resposta a perguntas abertas',1,'c'],[35,'Prosódia funcional',1,'c'],[36,'Ecolalia imediata',1,'a'],[37,'Ecolalia tardia',1,'a'],[38,'Linguagem para regular o outro',1,'c'],[39,'Linguagem para compartilhar experiência',1,'c'],[40,'Reparo comunicativo',1,'c'],
      [41,'Atenção sustentada',2,'c'],[42,'Atenção seletiva',2,'c'],[43,'Atenção alternada',2,'c'],[44,'Controle inibitório',2,'c'],[45,'Tolerância à espera',2,'c'],[46,'Persistência em tarefa',2,'c'],[47,'Monitoramento de erro',2,'c'],[48,'Flexibilidade cognitiva',2,'c'],[49,'Planejamento motor-cognitivo',2,'c'],[50,'Organização sequencial',2,'c'],[51,'Memória operacional verbal',2,'c'],[52,'Memória operacional visuoespacial',2,'c'],[53,'Velocidade de processamento funcional',2,'c'],[54,'Compreensão de regras',2,'c'],[55,'Generalização de aprendizagem',2,'c'],[56,'Dependência de mediação',2,'a'],[57,'Autonomia diante de tarefa escolar',2,'c'],[58,'Leitura do contexto de sala',2,'c'],[59,'Fragilidade em transições',2,'a'],[60,'Sinais passivos de fadiga cognitiva',2,'a'],
      [61,'Hiporreatividade dolorosa',3,'a'],[62,'Hiperreatividade auditiva',3,'a'],[63,'Hiperreatividade tátil',3,'a'],[64,'Busca vestibular',3,'a'],[65,'Busca proprioceptiva',3,'a'],[66,'Seletividade alimentar sensorial',3,'a'],[67,'Mastigação e coordenação oral',3,'c'],[68,'Controle postural',3,'c'],[69,'Praxia global',3,'c'],[70,'Praxia fina',3,'c'],[71,'Coordenação bimanual',3,'c'],[72,'Marcha e padrão motor',3,'c'],[73,'Estereotipias motoras',3,'a'],[74,'Autorregulação corporal',3,'c'],[75,'Tolerância ao toque de cuidado',3,'a'],[76,'Vestir-se e despir-se',3,'c'],[77,'Higiene pessoal assistida',3,'c'],[78,'Controle esfincteriano funcional',3,'c'],[79,'Sono e ritmicidade biológica',3,'a'],[80,'Rotina adaptativa cotidiana',3,'c'],
      [81,'Regulação emocional basal',4,'c'],[82,'Irritabilidade reativa',4,'a'],[83,'Frustração e recuperação',4,'c'],[84,'Ansiedade antecipatória',4,'a'],[85,'Rigidez comportamental',4,'a'],[86,'Oposição reativa versus sobrecarga',4,'a'],[87,'Autoagressão',4,'a'],[88,'Heteroagressão',4,'a'],[89,'Segurança e percepção de risco',4,'c'],[90,'Pistas passivas de humor deprimido',4,'a'],[91,'Pistas passivas de crises paroxísticas',4,'a'],[92,'Eventos noturnos e sono',4,'a'],[93,'Sinais de dor somática ou cefaleia',4,'a'],[94,'Impacto gastrointestinal funcional',4,'a'],[95,'Sobrecarga familiar observável',4,'a'],[96,'Necessidade de previsibilidade ambiental',4,'a'],[97,'Capacidade de permanência escolar',4,'c'],[98,'Necessidade de apoio escolar individualizado',4,'a'],[99,'Convergência multiprofissional dos achados',4,'c'],[100,'Potencial de aprendizagem e prognóstico dinâmico',4,'c']
    ]
  },

  /* ===================== FARMACOTERAPIA (Parte IV) ===================== */
  farmaco: {
    lema: 'Start low, go slow — iniciar baixo, subir devagar, monitorar sempre.',
    nota: 'Toda dose é orientativa. Doses-alvo, titulação, monitorização laboratorial e interações devem ser cruzadas com bula vigente, diretrizes locais e o quadro individual. Substâncias controladas: Portaria SVS/MS 344/1998. Uso off-label: obter TCLE assinado.',
    blocos: [
      { n:1, titulo:'Antiepilépticos e uso frequente', resumo:'Anticonvulsivantes de uso primário em epilepsia pediátrica e estados convulsivos. Escolha guiada por tipo de crise/síndrome, perfil cognitivo e efeitos. 25 fármacos da classe.',
        agentes:['Levetiracetam','Lamotrigina','Valproato de sódio / Divalproato','Oxcarbazepina','Carbamazepina','Fenobarbital','Fenitoína / Fosfenitoína','Topiramato','Zonisamida','Etossuximida','Brivaracetam','Perampanel','Rufinamida','Vigabatrina','Gabapentina','Pregabalina','Tiagabina','Felbamato','Primidona','Clorazepato','Lorazepam','Acetazolamida','Canabidiol (CBD)','Everolimo','ACTH'] },
      { n:2, titulo:'Psicoestimulantes e fármacos para TDAH', resumo:'Estimulantes (padrão-ouro) e não-estimulantes. Monitorar peso, estatura, sono, apetite, humor, FC/PA e tiques.',
        drogas:[
          ['Metilfenidato','Ritalina · Ritalina LA · Concerta','TDAH (padrão-ouro, AAP 2019; Cortese 2018) e narcolepsia.','Redução de apetite, insônia inicial, cefaleia, dor abdominal, rebote ao fim da dose, leve ↑FC/PA; pode acentuar tiques.','Acima de 6 anos.','LI 0,3–1,0 mg/kg/dose 2–3×/dia. LP 18 mg matinais inicial. Máx. usual 60 mg/dia (Ritalina/LA) ou 72 mg/dia (Concerta).'],
          ['Lisdexanfetamina','Venvanse','TDAH em crianças/adolescentes; compulsão alimentar em adultos. Pró-fármaco, menor potencial de abuso.','Diminuição severa de apetite, boca seca, insônia, perda ponderal, ansiedade, taquicardia.','Acima de 6 anos.','Inicial 20–30 mg matinal. Titulação semanal de 10 mg. Máx. usual 70 mg/dia.'],
          ['Dexmetilfenidato','Focalin · Focalin XR','TDAH. Contém apenas o isômero d-threo ativo.','Semelhantes ao metilfenidato; possível menor incidência de tremores e palpitações.','Acima de 6 anos.','Geralmente metade da dose equivalente de metilfenidato. Inicial 2,5 mg (LI) ou 5 mg (XR).'],
          ['Atomoxetina','Strattera','TDAH — inibidor seletivo da recaptação de noradrenalina (não-estimulante). Boa em tiques, ansiedade grave ou risco de uso indevido.','Náuseas, vômitos, sonolência inicial, fadiga, risco raro de hepatotoxicidade; pode ↑PA/FC. Black box FDA (ideação suicida).','Acima de 6 anos.','Até 70 kg: iniciar 0,5 mg/kg/dia, alvo 1,2 mg/kg/dia. >70 kg: iniciar 40 mg, alvo 80–100 mg/dia. Pico em 4–8 semanas.'],
          ['Guanfacina LP','Intuniv','TDAH em mono ou adjuvância. Agonista alfa-2A. Útil com oposição, agressividade ou impulsividade.','Sonolência, fadiga, hipotensão, bradicardia, boca seca.','6 a 17 anos.','Inicial 1 mg/dia. Titulação semanal de 1 mg. Alvo 0,05–0,12 mg/kg/dia (máx. 4–7 mg/dia conforme peso).'],
          ['Clonidina','Atensina','TDAH (off-label, hiperatividade severa e distúrbios do sono), tiques/Tourette, agressividade. Agonista alfa-2 central.','Sedação importante (uso noturno), boca seca, tontura. Hipertensão rebote se interrompida — desmame obrigatório.','Uso pediátrico comum; off-label p/ TDAH no Brasil.','Inicial 0,025–0,05 mg à noite. Manutenção 0,1–0,4 mg/dia em 2–3 doses. Nunca interromper bruscamente.']
        ] },
      { n:3, titulo:'Antipsicóticos e estabilizadores', resumo:'Irritabilidade grave, agitação e transtornos comportamentais no TEA e estabilização do humor. Monitorização metabólica obrigatória.',
        drogas:[
          ['Risperidona','Risperdal','Irritabilidade grave no TEA (única indicação FDA pediátrica em TEA), agressividade severa, psicose precoce, tiques refratários. FDA ≥ 5 anos.','Ganho de peso significativo, hiperprolactinemia, sedação inicial, síndrome metabólica, EPS em doses altas, sialorreia.','Acima de 5 anos.','Inicial 0,25 mg/dia (<20 kg) ou 0,5 mg/dia (≥20 kg). Titular semanal. Manutenção 0,5–2,5 mg/dia. Monitorar peso, lipídios, glicemia e prolactina a cada 3–6 meses.'],
          ['Aripiprazol','Abilify','Irritabilidade no TEA (FDA ≥ 6 anos), tiques/Tourette, transtorno bipolar (≥10 anos), esquizofrenia adolescente.','Acatisia (frequente — buscar ativamente), sonolência paradoxal, náuseas iniciais, ganho de peso menor que risperidona.','≥ 6 anos (TEA); 10 anos (humor).','Inicial 2 mg/dia. Aumento de 2 mg/semana. Manutenção 5–15 mg/dia. Máx. usual 20 mg/dia.'],
          ['Olanzapina','Zyprexa','Quadros refratários — agitação grave, transtorno bipolar, anorexia nervosa. Uso restrito pelo perfil metabólico.','Ganho de peso intenso (maior da classe), risco metabólico, sonolência, hiperprolactinemia, dislipidemia.','Acima de 13 anos (restrito e criterioso).','Inicial 2,5 mg/noite. Manutenção 5–15 mg/dia. Reavaliar mensalmente nos 3 primeiros meses.'],
          ['Quetiapina','Seroquel','Agitação noturna, ansiedade severa, transtorno bipolar. Em pediatria, doses baixas para sono e ansiedade refratários.','Sonolência intensa (útil em baixas doses), hipotensão ortostática, ganho de peso moderado, tontura.','≥ 10 anos (mania); off-label em doses baixas para sono.','Sono/ansiedade (off-label) 12,5–50 mg à noite. Humor: titular até 200–600 mg/dia.'],
          ['Lítio','Carbolitium','Estabilizador clássico — transtorno bipolar pediátrico, agressividade severa refratária.','Tremor fino, polidipsia/poliúria, ganho de peso, hipotireoidismo, risco renal, janela terapêutica estreita.','Acima de 7 anos com monitoração intensiva.','Litemia-alvo 0,6–1,0 mEq/L. Inicial 15–25 mg/kg/dia. Litemia a cada 5 dias até estabilizar, depois trimestral. Função renal, TSH e cálcio a cada 6 meses.']
        ] },
      { n:4, titulo:'Antidepressivos (ISRS) com aplicação neuropediátrica', resumo:'Ansiedade, depressão pediátrica, TOC e comorbidades. Vigiar ativação comportamental e ideação nas primeiras semanas (black box FDA).',
        drogas:[
          ['Sertralina','Zoloft','TOC (FDA ≥ 6 anos), TAG, ansiedade social, depressão em adolescentes. 1ª linha (estudo POTS, JAMA 2004).','Náuseas iniciais, insônia/sonolência, cefaleia, ativação comportamental, ideação suicida (vigilância, sobretudo 4 primeiras semanas).','≥ 6 anos (TOC); 12 anos (depressão).','Inicial 12,5–25 mg/dia. Titulação semanal. Manutenção 50–200 mg/dia. Aguardar 6–12 semanas para resposta plena.'],
          ['Fluoxetina','Prozac','Depressão (FDA ≥ 8 anos), TOC (≥ 7 anos), bulimia em adolescentes. Meia-vida longa.','Ativação (insônia, agitação), náuseas, ↓apetite com leve perda ponderal, cefaleia, ativação especialmente em < 12 anos.','≥ 7 anos (TOC); 8 anos (depressão).','Inicial 5–10 mg/dia. Manutenção 10–60 mg/dia. Pico em 4–6 semanas.'],
          ['Escitalopram','Lexapro','Depressão adolescente (FDA ≥ 12 anos), TAG, ansiedade social. Boa tolerabilidade.','Náuseas, sonolência/insônia, prolongamento de QT em altas doses (considerar ECG basal), disfunção sexual.','Acima de 12 anos.','Inicial 5 mg/dia. Manutenção 10–20 mg/dia. ECG basal se história cardíaca, dose alta ou fármacos que prolongam QT.'],
          ['Fluvoxamina','Luvox','TOC pediátrico (FDA ≥ 8 anos). Alternativa em casos com componente obsessivo dominante.','Náuseas, insônia, sedação variável, interações via CYP1A2/2C19.','Acima de 8 anos.','Inicial 25 mg/dia à noite. Manutenção 50–200 mg/dia.']
        ] },
      { n:5, titulo:'Benzodiazepínicos e modulação motora', resumo:'Benzodiazepínicos em uso não-convulsivo, miorrelaxantes, agentes para espasticidade e terapia da AME. Cautela com sedação, tolerância e dependência.',
        agentes:['Diazepam (uso não-convulsivo)','Lorazepam (uso não-convulsivo)','Clonazepam (sono/ansiedade)','Baclofeno','Trihexifenidil','Nusinersen (Spinraza)'] },
      { n:6, titulo:'Profilaxia de cefaleia e manejo motor extrapiramidal', resumo:'Anticolinérgicos e profiláticos para cefaleia recorrente em pediatria.',
        drogas:[
          ['Propranolol','Inderal','Profilaxia de enxaqueca (1ª linha com flunarizina), tremor essencial, ansiedade de performance.','Bradicardia, hipotensão, broncoespasmo (contraindicado em asma), fadiga, pesadelos, hipoglicemia em diabéticos.','Acima de 6 anos com cautela cardiológica.','Inicial 0,5 mg/kg/dia. Manutenção 1–4 mg/kg/dia em 2–3 doses. Monitorar FC e PA.'],
          ['Flunarizina','Sibelium · Vertix','Profilaxia de enxaqueca (2ª linha com propranolol), vertigem recorrente.','Sonolência (dose noturna), ganho de peso, raros EPS com uso prolongado, depressão em adolescentes.','Acima de 5 anos.','5–10 mg à noite. Reavaliar eficácia em 8 semanas; se ausente, retirar.'],
          ['Topiramato','Topamax','Profilaxia de enxaqueca refratária, após falha de propranolol/flunarizina. Estudo CHAMP (NEJM 2017) não mostrou superioridade vs placebo — individualizar.','Parestesias, perda de apetite/peso, lentificação cognitiva, litíase renal, glaucoma agudo (raro).','Acima de 12 anos para profilaxia.','Inicial 12,5–25 mg à noite. Titulação muito lenta (semanal). Manutenção 50–100 mg/dia.']
        ] },
      { n:7, titulo:'Terapias específicas, genéticas e suporte metabólico', resumo:'Terapias-alvo (oligonucleotídeos antisense, terapia gênica) para doenças neuromusculares. Indicação e dispensação em centro especializado.',
        drogas:[
          ['Risdiplam','Evrysdi','Atrofia Muscular Espinhal (AME) tipos 1, 2 e 3 — alternativa oral ao nusinersen. Modulador do splicing do SMN2.','Febre transitória, diarreia, exantema, hepatotoxicidade (monitorar transaminases).','Acima de 2 meses (FDA).','Dose única diária oral por peso. 2 meses–2 anos: 0,2 mg/kg/dia. >2 anos e ≥20 kg: 5 mg/dia.'],
          ['Onasemnogene abeparvovec','Zolgensma','AME — terapia gênica de dose única (substituição do gene SMN1).','Hepatotoxicidade significativa (corticoide profilático 1 mg/kg por 2 meses), trombocitopenia transitória, troponina elevada.','Abaixo de 2 anos (≤ 21 kg em muitas jurisdições).','Infusão IV única por peso (1,1 × 10^14 vg/kg). Protocolos institucionais.']
        ] }
    ],
    calendarios: [
      ['Antipsicóticos atípicos','Peso/IMC, perímetro abdominal, PA e FC em toda consulta + EPS. Glicemia, HbA1c e lipídios na linha de base, ~12 semanas e depois trimestral. Prolactina, TSH, função hepática e ECG na base; prolactina trimestral no 1º ano, depois semestral.'],
      ['Estabilizadores (lítio, valproato, lamotrigina)','Nível sérico 5 dias após dose terapêutica, depois trimestral. Hemograma trimestral no 1º ano. Lítio: função renal, sódio, potássio, cálcio e TSH semestrais. Valproato: função hepática, plaquetas e amilase trimestrais nos 6 primeiros meses.'],
      ['Psicoestimulantes','Peso, estatura, percentis, PA e FC em toda consulta com curva de crescimento. Anamnese cardiológica/familiar basal; ECG se sintoma cardíaco, sopro, síncope ou história familiar. Triagem de sono, apetite, humor e tiques contínua.'],
      ['ISRS','Avaliação de ativação comportamental e ideação suicida em toda consulta, sobretudo nas 4 primeiras semanas (black box FDA). Reavaliar sintomas-alvo em 4 e 8 semanas; 6–12 semanas para resposta plena. ECG basal para escitalopram em dose alta ou comorbidade cardíaca.']
    ]
  },

  /* ===================== DIRETRIZ DOSIMÉTRICA TEA (Volume II) ===================== */
  dosimetria: {
    intro: 'Matriz de referência de carga horária terapêutica semanal para TEA, por faixa etária × nível de suporte DSM-5-TR. Soma das modalidades nucleares (comportamental + fonoaudiologia + terapia ocupacional). Os valores são tetos orientadores razoáveis — ponto de partida calibrado por resposta, metas (GAS), comorbidades e tolerância funcional. Acima do piso evidencial (~10 h/sem) e abaixo do teto pragmático (~35–40 h/sem).',
    matriz: {
      colunas:['Faixa etária','Nível 1','Nível 2','Nível 3'],
      linhas:[
        ['12–36 meses · janela neuroplástica','20 h','25 h','30 h'],
        ['3–5 anos · pré-escolar','20 h','35 h','40 h'],
        ['6–11 anos · escolar','12 h','25 h','35 h'],
        ['12–17 anos · adolescente','6 h','15 h','25 h'],
        ['≥ 18 anos · transição','4 h','10 h','15 h']
      ]
    },
    modulacao: {
      sobe: [
        'Comorbidade aguda em descompensação (autoagressão grave, sono fragmentado severo, recusa alimentar com perda ponderal): +4 a 5 h/sem por até 3 meses, com revisão.',
        'Ansiedade clinicamente significativa ou seletividade alimentar severa: +1 h/sem específica para a comorbidade.',
        'Regressão evolutiva documentada: acréscimo até retorno à linha de base, com reavaliação trimestral.',
        'Janela diagnóstica recente (≤ 36 meses, primeiros 6 meses): intensificar até o teto do nível 3 mesmo em casos nível 2.'
      ],
      desce: [
        'Tolerância funcional limitada (exaustão, regressão pós-sessão, irritabilidade persistente): reduzir 15–25% sobre o teto.',
        'Sobrecarga familiar significativa (cuidador adoecido, fragilidade social/econômica): redução temporária com reavaliação semestral.',
        'Resposta satisfatória sustentada (metas GAS atingidas por ≥ 6 meses): programa de redução gradual mantendo ganhos.'
      ]
    },
    modelos: [
      ['Modelo intensivo precoce','Janela de plasticidade (12–60 meses): abordagens naturalistas do desenvolvimento (ESDM/NDBI), alta carga e mediação familiar, máximo aproveitamento da janela.'],
      ['Modelo escolar funcional','Idade escolar: foco em funcionalidade, autonomia, habilidades sociais explícitas e inclusão, com carga ajustada à demanda e à fadiga; parte das horas em ambiente escolar.'],
      ['Modelo de manutenção e transição','Adolescência/adulto: psicoterapia, grupos de habilidades sociais, treinamento vocacional e suporte à vida independente, com carga seletiva por objetivo.']
    ],
    defesa: {
      titulo: 'Modelo de manifestação técnica contra negativa de operadora',
      texto: 'Quando a carga horária prescrita é negada, a defesa técnica articula a necessidade clínica individualizada (nível de suporte, metas funcionais, janela de plasticidade) com base legal e normativa, e com literatura indexada verificável. Estrutura recomendada: identificação, quadro clínico, prescrição original, narrativa da negativa, refutação técnica com referências, fundamentação jurídica, requerimento e termo de comprometimento.',
      base: [
        'Lei 12.764/2012 — Política Nacional de Proteção dos Direitos da Pessoa com TEA (art. 3º, III, b: atenção integral multiprofissional).',
        'Lei 13.146/2015 — Lei Brasileira de Inclusão: direito à saúde integral, habilitação e reabilitação.',
        'Súmula 102 do TJSP — é abusiva a negativa de tratamento prescrito sob argumento de natureza experimental ou de exclusão de rol.',
        'RN 539/2022 da ANS — cobertura sem limitação de número de sessões com psicólogo, fonoaudiólogo, TO e fisioterapeuta, por prescrição do médico assistente.'
      ]
    },
    estudos: [
      ['Sandbank et al., 2024 · JAMA Pediatrics','Meta-análise (144 estudos, 9.038 crianças): nenhuma associação positiva significativa entre quantidade de intervenção e magnitude de efeito quando controlada por tipo. Fundamenta o platô clínico ~25–30 h/sem.','doi:10.1001/jamapediatrics.2024.1832'],
      ['Freitag et al., 2025 · J Child Psychol Psychiatry','RCT fase III (A-FFIP): NDBI de baixa intensidade (≤ 5 h/sem + treinamento parental) com ganhos em comportamentos repetitivos e função executiva. Qualidade e ajuste importam mais que carga bruta.','doi:10.1111/jcpp.14162'],
      ['Sandbank et al., 2023 · BMJ','Project AIM atualizado: efeitos médios modestos, alta heterogeneidade e viés de publicação. Base da interpretação dosimétrica conservadora.','doi:10.1136/bmj-2023-076733'],
      ['Dawson et al., 2010 · Pediatrics','RCT do Early Start Denver Model: ~20 h/sem entre 18–30 meses com ganho em QI, linguagem e comportamento adaptativo.','doi:10.1542/peds.2009-0958'],
      ['Reichow et al., 2018 · Cochrane','Revisão de EIBI: benefício consistente (evidência baixa a moderada) em programas de 20–40 h/sem.','doi:10.1002/14651858.CD009260.pub3'],
      ['Linstead et al., 2017 · Transl Psychiatry / Behav Modif','Curva dose-resposta positiva mas côncava: efeitos a partir de ~10 h/sem, retornos decrescentes acima de 30–35 h/sem.','doi:10.1038/tp.2017.207']
    ]
  },

  /* ===================== REFERÊNCIAS PUBMED (Parte V) ===================== */
  referencias: [
    ['Vigilância e triagem','Lipkin & Macias (AAP), Pediatrics 2020 — vigilância e triagem do desenvolvimento. PMID 31843861'],
    ['Triagem TEA','Robins et al., Pediatrics 2014 — validação M-CHAT-R/F. PMID 24366990'],
    ['Diagnóstico TEA','Lebersfeld et al., J Autism Dev Disord 2021 — utilidade do ADOS-2/ADI-R. PMID 33475930'],
    ['Intervenção TEA','Hyman, Levy & Myers (AAP), Pediatrics 2020 — avaliação e manejo do TEA. PMID 31843864'],
    ['Intervenção TEA','Sandbank et al., BMJ 2023 — Project AIM atualizado. PMID 37963634'],
    ['Intervenção TEA','Dawson et al., Pediatrics 2010 — Early Start Denver Model. PMID 19948568'],
    ['Farmacoterapia TEA','Persico et al., Prog Neuropsychopharmacol Biol Psychiatry 2021 — psicofarmacologia do TEA. PMID 33857522'],
    ['TDAH','Wolraich et al. (AAP), Pediatrics 2019 — diretriz de TDAH. PMID 31570648'],
    ['TDAH','Cortese et al., Lancet Psychiatry 2018 — meta-análise em rede de fármacos. PMID 30097390'],
    ['TOC pediátrico','POTS Team, JAMA 2004 — TCC, sertralina e combinação no TOC. PMID 15507582'],
    ['Monitorização','Mead et al., Aust N Z J Psychiatry 2021 — monitorização metabólica de antipsicóticos. PMID 33951933'],
    ['Epilepsia','Fisher et al. (ILAE), Epilepsia 2017 — classificação operacional das crises. PMID 28276060'],
    ['Paralisia cerebral','Novak et al., JAMA Pediatr 2017 — diagnóstico e intervenção precoces na PC. PMID 28715518'],
    ['Cefaleia','CHAMP Study Group, Headache/NEJM — profilaxia de migrânea pediátrica.'],
    ['AME','Finkel et al., Lancet 2016 — nusinersen na AME infantil. PMID 27939059']
  ]
};
