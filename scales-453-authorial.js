(function(){
'use strict';
const base=Array.isArray(window.NEUROPED_EDITORIAL_SCALES)?window.NEUROPED_EDITORIAL_SCALES:[];
if(window.NEUROPED_453_AUTHORIAL_LOADED)return;
window.NEUROPED_453_AUTHORIAL_LOADED=true;
const ages=[
  {k:'0-2',label:'0–2 anos',min:0,max:35,focus:'bebê/criança pequena'},
  {k:'3-5',label:'3–5 anos',min:36,max:71,focus:'pré-escolar'},
  {k:'6-11',label:'6–11 anos',min:72,max:143,focus:'idade escolar'},
  {k:'12-17',label:'12–17 anos',min:144,max:215,focus:'adolescente'},
  {k:'adulto',label:'18+ anos',min:216,max:960,focus:'adulto/jovem adulto'}
];
const auds=[
  {k:'familia',label:'Teste familiar',who:'família/cuidador'},
  {k:'escola',label:'Teste escolar',who:'escola/professor'},
  {k:'autoteste',label:'Autoteste',who:'criança/adolescente quando possível'},
  {k:'terapeuta',label:'Terapias/equipe',who:'terapeuta/equipe'},
  {k:'clinico',label:'Clínico',who:'médico/avaliador'}
];
const domains=[
  {k:'tea',emoji:'🌱',name:'TEA e comunicação social',sym:['TEA','olhar','nome','brincar','rigidez'],compl:['autismo','autimo','não responde nome','brinca sozinho','estereotipia']},
  {k:'linguagem',emoji:'🗣️',name:'Linguagem e comunicação funcional',sym:['fala','gesto','compreensão','pedido','ecolalia'],compl:['não fala','atraso de fala','linguagem','fono']},
  {k:'tdah',emoji:'⚡',name:'TDAH e atenção',sym:['desatenção','impulsividade','hiperatividade','tarefa','foco'],compl:['tdah','desatencao','não termina','agitado']},
  {k:'executivas',emoji:'🧠',name:'Funções executivas',sym:['planejamento','memória','organização','tempo','inibição'],compl:['organização','perde objetos','esquece','rotina']},
  {k:'aprendizagem',emoji:'📚',name:'Aprendizagem global',sym:['leitura','escrita','matemática','rendimento','escola'],compl:['aprendizagem','escola','não acompanha','baixo rendimento']},
  {k:'dislexia',emoji:'🔤',name:'Leitura e dislexia operacional',sym:['leitura','trocas','fluência','compreensão','consciência fonológica'],compl:['dislexia','lê mal','troca letras','silabado']},
  {k:'discalculia',emoji:'🧮',name:'Matemática funcional',sym:['número','quantidade','cálculo','problema','tempo'],compl:['matemática','calculo','tabuada','número']},
  {k:'sensorial',emoji:'🎧',name:'Perfil sensorial cotidiano',sym:['barulho','toque','luz','cheiro','textura'],compl:['sensorial','sensorail','barulho','textura','cheiro']},
  {k:'alimentacao',emoji:'🍽️',name:'Alimentação e seletividade',sym:['seletividade','textura','recusa','engasgo','mastigação'],compl:['seletividade','seletivdade','alimentação','engasgo']},
  {k:'sono',emoji:'😴',name:'Sono e ritmo diário',sym:['sono','insônia','despertares','ronco','cansaço'],compl:['sono','insônia','insonia','acorda','ronco']},
  {k:'ansiedade',emoji:'😟',name:'Ansiedade e evitação',sym:['medo','preocupação','evitação','separação','somatização'],compl:['ansiedade','medo','evita','dor antes da escola']},
  {k:'humor',emoji:'🕯️',name:'Humor, tristeza e isolamento',sym:['tristeza','isolamento','anedonia','energia','choro'],compl:['triste','isolado','desânimo','depressivo']},
  {k:'risco',emoji:'⚠️',name:'Risco autolesivo e segurança',sym:['autolesão','morte','risco','impulso','segurança'],compl:['não quer viver','se machuca','autolesão','suicid']},
  {k:'tod',emoji:'🌪️',name:'Oposição, irritabilidade e crises',sym:['oposição','irritabilidade','birra','agressividade','limites'],compl:['birra','birrra','oposição','agressivo','crise']},
  {k:'epilepsia',emoji:'🧬',name:'Crises epilépticas e eventos paroxísticos',sym:['crise','olhar parado','abalo','queda','recuperação'],compl:['epilepsia','convulsão','crise','desmaio']},
  {k:'cefaleia',emoji:'🤕',name:'Cefaleia e dor recorrente',sym:['dor','cabeça','náusea','luz','rotina'],compl:['cefaleia','cabeça','enxaqueca','vomita']},
  {k:'tiques',emoji:'🔁',name:'Tiques e movimentos repetitivos',sym:['tiques','piscar','caretas','sons','urgência'],compl:['tiques','piscar','careta','movimento']},
  {k:'motor',emoji:'🏃',name:'Coordenação motora e praxia',sym:['coordenação','equilíbrio','motricidade','queda','caligrafia'],compl:['motor','desajeitado','cai','coordenação']},
  {k:'autonomia',emoji:'🚽',name:'Autonomia e AVDs',sym:['banheiro','higiene','roupa','alimentação','rotina'],compl:['autonomia','banheiro','desfralde','higiene']},
  {k:'social',emoji:'🤝',name:'Habilidades sociais e pragmática',sym:['pares','conversa','turnos','empatia','brincar'],compl:['social','amigos','isolado','não interage']},
  {k:'telas',emoji:'📱',name:'Tela, jogos e rotina digital',sym:['tela','jogo','sono','irritação','limite'],compl:['celular','tela','jogo','vício']},
  {k:'farmaco',emoji:'💊',name:'Monitoramento medicamentoso familiar',sym:['efeito','apetite','sono','humor','adesão'],compl:['medicação','remédio','efeito colateral','apetite']}
];
function cap(s){return String(s).charAt(0).toUpperCase()+String(s).slice(1)}
function slug(s){return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}
function qbank(d,a,u){const common=[
  `O sinal aparece com frequência no contexto de ${u.who}?`,
  `O padrão observado prejudica a rotina do ${a.focus}?`,
  `A dificuldade ocorre em mais de um ambiente ou situação?`,
  `A criança melhora quando recebe apoio visual, pausa ou antecipação?`,
  `Houve piora recente, perda de habilidade ou aumento de intensidade?`
];
const map={
 tea:[`Responde quando chamado pelo nome?`,`Compartilha interesse mostrando objetos, gestos ou olhar?`,`Participa de brincadeiras sociais compatíveis com a idade?`,`Apresenta rigidez, repetição ou interesse restrito que atrapalha a rotina?`,`Reage de modo incomum a sons, texturas, luzes ou mudanças?`],
 linguagem:[`Usa fala, gesto ou figura para pedir o que deseja?`,`Compreende ordens simples sem muitas pistas?`,`Responde perguntas simples de forma funcional?`,`Consegue contar algo que aconteceu com começo, meio e fim?`,`Repete palavras/frases sem uso comunicativo claro?`],
 tdah:[`Consegue iniciar tarefas sem muitas chamadas?`,`Mantém atenção até terminar uma atividade curta?`,`Interrompe, levanta ou age antes de pensar?`,`Esquece instruções ou perde materiais com frequência?`,`O comportamento muda quando há estrutura, rotina e reforço?`],
 executivas:[`Planeja passos antes de iniciar uma tarefa?`,`Organiza materiais, horários e sequência da rotina?`,`Consegue mudar de estratégia quando erra?`,`Lembra instruções com duas ou mais etapas?`,`Controla impulso suficiente para esperar sua vez?`],
 aprendizagem:[`Acompanha o conteúdo esperado para a série/idade?`,`Demonstra compreensão após explicação individual?`,`Consegue registrar respostas por fala, desenho ou escrita?`,`O desempenho oscila conforme atenção, sono ou ansiedade?`,`A dificuldade persiste apesar de treino e repetição?`],
 dislexia:[`Lê palavras simples com precisão compatível com a idade?`,`Troca, omite ou inverte sons/letras ao ler?`,`Compreende o que leu quando a leitura é lenta ou com esforço?`,`Consegue identificar rimas, sílabas e sons iniciais?`,`A escrita mostra trocas fonológicas persistentes?`],
 discalculia:[`Reconhece números e quantidades compatíveis com a idade?`,`Compara maior/menor e antes/depois em sequência numérica?`,`Resolve contas simples com apoio concreto?`,`Entende problemas matemáticos curtos do cotidiano?`,`Confunde sinais, posições ou procedimentos de cálculo?`],
 sensorial:[`Barulho comum causa sofrimento, fuga ou crise?`,`Textura de roupa, comida ou toque incomoda de forma intensa?`,`Busca estímulos como pular, girar, apertar ou cheirar?`,`Luz, cheiro ou ambiente cheio alteram o comportamento?`,`Estratégias sensoriais reduzem a desorganização?`],
 alimentacao:[`Aceita variedade alimentar compatível com a idade?`,`Recusa alimentos por textura, cheiro, cor ou mistura?`,`Mastiga e engole com segurança aparente?`,`A refeição gera conflito frequente?`,`Tolera olhar, tocar ou cheirar alimento novo sem ser forçado?`],
 sono:[`Demora para iniciar o sono?`,`Acorda muitas vezes ou desperta muito cedo?`,`Ronca, respira pela boca ou parece cansado ao acordar?`,`Tela, ansiedade ou rotina irregular pioram o sono?`,`Sono ruim piora atenção, humor ou crises?`],
 ansiedade:[`Evita atividades por medo ou preocupação?`,`Apresenta queixas físicas antes de escola ou separação?`,`Busca confirmação excessiva para se sentir seguro?`,`Tem medo desproporcional de erro, crítica ou mudança?`,`A ansiedade impede participação social, escolar ou familiar?`],
 humor:[`Perdeu interesse por atividades antes prazerosas?`,`Fica isolado, choroso ou irritado por muitos dias?`,`Mostra queda de energia, apetite ou sono?`,`Expressa culpa, inutilidade ou desesperança?`,`A mudança de humor prejudica escola, família ou autocuidado?`],
 risco:[`Falou em sumir, morrer ou não querer viver?`,`Machuca a si mesmo ou ameaça se machucar?`,`Existe plano, acesso a meios ou perda de controle?`,`A família precisa supervisionar por segurança?`,`Há adulto protetor e plano de ajuda imediata?`],
 tod:[`Desafia regras simples de forma repetida?`,`Explode em raiva com frustrações pequenas?`,`Agride, morde, empurra, quebra ou ameaça?`,`Culpa os outros ou recusa reparar o dano?`,`A crise melhora com rotina, escolhas limitadas ou pausa?`],
 epilepsia:[`Houve episódio com perda de contato, queda, abalos ou olhar parado?`,`O evento teve início e fim claros?`,`Após o episódio houve sono, confusão ou dor?`,`Existe gatilho como febre, sono, luz ou estresse?`,`Vídeo, descrição e tempo do evento foram registrados?`],
 cefaleia:[`A dor atrapalha escola, brincadeira ou sono?`,`Há náusea, vômito, luz incomodando ou tontura?`,`A dor tem horário, gatilho ou padrão repetido?`,`Usa analgésicos com frequência?`,`Há sinal de alerta como despertar noturno, piora progressiva ou déficit?`],
 tiques:[`Movimentos ou sons repetitivos aparecem sem intenção clara?`,`Aumentam com ansiedade, cansaço ou exposição social?`,`A criança sente vontade/urgência antes do tique?`,`Consegue segurar por pouco tempo com esforço?`,`O tique causa dor, vergonha, bullying ou prejuízo?`],
 motor:[`Tropeça, cai ou parece desajeitado para a idade?`,`Tem dificuldade com lápis, tesoura, botão ou talher?`,`Evita esportes, parque ou atividades motoras?`,`Apresenta caligrafia muito lenta ou ilegível?`,`Consegue imitar gestos e sequências motoras simples?`],
 autonomia:[`Realiza higiene, roupa e alimentação com autonomia compatível?`,`Sinaliza fome, sede, dor, banheiro ou desconforto?`,`Segue rotina visual ou verbal de autocuidado?`,`Precisa de ajuda excessiva para a idade?`,`A autonomia melhora com treino estruturado e previsibilidade?`],
 social:[`Inicia conversa, brincadeira ou aproximação social?`,`Respeita turnos e percebe sinais do outro?`,`Compreende piadas, ironias ou regras implícitas conforme idade?`,`Mantém amizade ou participação em grupo?`,`Repara quando magoa alguém ou comete erro social?`],
 telas:[`O uso de tela passa do combinado e gera conflito?`,`A retirada de tela causa crise intensa ou agressividade?`,`A tela prejudica sono, escola, alimentação ou interação?`,`Consegue alternar tela com brincadeira, leitura ou atividade física?`,`O conteúdo digital muda humor, linguagem ou comportamento?`],
 farmaco:[`A medicação está sendo tomada no horário combinado?`,`Houve mudança de sono, apetite, humor ou energia?`,`A família percebe benefício funcional claro?`,`Há efeito adverso que atrapalha rotina ou segurança?`,`A escola ou terapia observou mudança após início/ajuste?`]
};
return [...(map[d.k]||common),...common].slice(0,10)}
function tasks(d,a){const baseText='Lia viu um sapo no jardim. O sapo pulou perto da flor. Depois, Lia chamou a mãe para mostrar o sapo.';const dict='casa, bola, janela, prato, brincadeira';
const universal=[`Texto para interpretação: "${baseText}" Perguntar: quem viu o sapo? onde ele estava? o que Lia fez depois?`,`Ditado de palavras: ${dict}. Registrar trocas, omissões e tempo.`,`Frase para repetir: "O menino guardou a bola azul dentro da caixa". Registrar omissões e ordem.`,`Sequência de comandos: pegue o lápis, toque na mesa e desenhe um círculo.`,`Nomeação rápida: copo, bola, chave, gato, mão, sapato.`];
const map={
 tea:[`Cena social: "Pedro queria brincar, mas João pegou o carrinho e saiu". Perguntar o que Pedro pode sentir e o que poderia fazer.`,`Brincadeira simbólica: oferecer boneco, prato e carrinho; observar faz de conta e turnos.`,`Atenção compartilhada: apontar figura interessante e observar se acompanha o gesto/olhar.`,...universal],
 linguagem:[`Pragmática: pedir para explicar como se escova os dentes em três passos.`,`Compreensão: "antes de bater palmas, coloque o lápis embaixo do papel".`,...universal],
 tdah:[`Atenção auditiva: diga sol, bola, peixe, bola, casa; bater na mesa quando ouvir bola.`,`Inibição: quando eu disser dia, responda noite; quando disser noite, responda dia.`,`Memória: repetir 4-8-2 e depois 7-1-9-3, conforme idade.`,...universal],
 executivas:[`Planejamento: organizar verbalmente três passos para preparar a mochila.`,`Flexibilidade: resolver um problema de duas formas diferentes.`,...universal],
 aprendizagem:[`Leitura: "O gato subiu no muro e viu a lua." Perguntar quem subiu e o que viu.`,`Cópia: "Hoje eu vou aprender com calma."`,`Ditado de frase: "A menina gosta de ler na escola."`,...universal],
 dislexia:[`Consciência fonológica: dizer palavras que começam com /p/: pato, pé, panela.`,`Rima: perguntar o que rima com mão: pão, bola ou casa?`,`Leitura de pseudopalavras autorais: mipo, laveco, sanute.`,...universal],
 discalculia:[`Quantidade: mostrar 7 objetos e pedir para separar 3.`,`Cálculo mental: 8+5, 14-6, metade de 10.`,`Problema: "Ana tinha 5 lápis e ganhou 3. Com quantos ficou?"`,...universal],
 sensorial:[`Escala sensorial: de 0 a 5, quanto incomoda liquidificador, etiqueta, luz forte e cheiro de comida?`,`Escolha regulatória: testar pausa, respiração, fone imaginário ou objeto de conforto.`,...universal],
 alimentacao:[`Lista alimentar: 5 alimentos aceitos, 5 recusados e motivo percebido: textura, cheiro, cor, mistura.`,`Tolerância gradual: olhar, tocar, cheirar e aproximar alimento novo sem forçar ingestão.`,...universal],
 sono:[`Rotina: pedir para ordenar cartões: banho, pijama, escovar dentes, história, dormir.`,`Relato: contar como foi a última noite de sono em começo, meio e fim.`,...universal],
 ansiedade:[`Termômetro emocional: marcar 0–10 para escola, separação, prova, dormir e falar em público.`,`Interpretação: "Um colega não respondeu sua mensagem". Levantar três explicações possíveis.`,...universal],
 humor:[`Nomeação emocional: escolher entre feliz, triste, bravo, medo, cansado e explicar o motivo.`,`Atividade prazerosa: listar três coisas que antes gostava e como está hoje.`,...universal],
 risco:[`Segurança: perguntar de forma adequada se já pensou em se machucar, sumir ou morrer. Se positivo, acionar protocolo clínico.`,`Rede de ajuda: listar três adultos que pode procurar em crise.`,...universal],
 tod:[`Frustração simulada leve: propor regra simples e observar negociação, oposição e recuperação.`,`Reparação: perguntar o que fazer depois de quebrar algo ou machucar alguém.`,...universal],
 epilepsia:[`Linha do tempo: registrar antes, durante e depois do evento; hora, duração e recuperação.`,`Consciência: perguntar se ouviu chamados, respondeu e lembrou do episódio.`,...universal],
 cefaleia:[`Mapa da dor: apontar local, intensidade 0–10, duração e gatilhos.`,`Diário breve: registrar sono, tela, alimentação, escola e dor por 7 dias.`,...universal],
 tiques:[`Observação de 2 minutos: registrar movimento/som, contexto e frequência sem chamar atenção.`,`Urgência: perguntar se sente vontade antes do movimento e se consegue segurar.`,...universal],
 motor:[`Praxia: imitar sequência bater palma, tocar cabeça, cruzar braços.`,`Grafomotor: copiar círculo, cruz, quadrado e frase curta.`,`Equilíbrio: ficar em um pé e andar em linha imaginária.`,...universal],
 autonomia:[`Sequência AVD: explicar ou demonstrar lavar mãos em passos.`,`Escolha funcional: pedir ajuda, banheiro, água e pausa usando fala/gesto/figura.`,...universal],
 social:[`História social: "Maria entrou no jogo sem pedir". Perguntar o que os colegas podem sentir.`,`Turnos: jogo curto de alternância com regra simples.`,...universal],
 telas:[`Rotina digital: listar horário de tela, conteúdo e reação ao desligar.`,`Alternativa: escolher três atividades sem tela que conseguiria fazer hoje.`,...universal],
 farmaco:[`Monitoramento: comparar antes/depois em sono, apetite, humor, atenção e crises.`,`Adesão: explicar horários do remédio e quem supervisiona.`,...universal]
};
return (map[d.k]||universal).slice(0,8)}
function title(d,a,u,i){return `${d.emoji} Inventário ${cap(a.focus)} — ${d.name} · ${u.label} ${String(i+1).padStart(3,'0')}`}
const combos=[];domains.forEach((d,di)=>ages.forEach((a,ai)=>auds.forEach((u,ui)=>combos.push({d,a,u,di,ai,ui,rank:(di*37+ai*17+ui*29)%997}))));
combos.sort((x,y)=>x.rank-y.rank||x.di-y.di||x.ai-y.ai||x.ui-y.ui);
const generated=combos.slice(0,453).map((c,i)=>({
  id:`aut453-${String(i+1).padStart(3,'0')}-${slug(c.a.k)}-${slug(c.u.k)}-${slug(c.d.k)}`,
  title:title(c.d,c.a,c.u,i),
  short_title:`${c.d.name} — ${c.a.label}`,
  original_title:'Inventário operacional autoral NeuroPed SDG',
  emoji:c.d.emoji,
  audience:c.u.k,
  audience_label:c.u.label,
  age_band:c.a.label,
  age_min_months:c.a.min,
  age_max_months:c.a.max,
  symptoms:c.d.sym,
  complaints:c.d.compl,
  keywords:[...c.d.sym,...c.d.compl,c.a.label,c.u.label,c.d.name],
  domain:c.d.name,
  page:'instrumento.html',
  anchor:`aut453-${String(i+1).padStart(3,'0')}`,
  priority:72+(i%28),
  plain_questions:qbank(c.d,c.a,c.u),
  direct_tasks:tasks(c.d,c.a),
  clinical_use:`Inventário autoral para organizar sinais de ${c.d.name.toLowerCase()} em ${c.a.focus}, respondido por ${c.u.who}.`,
  differentiator:'Instrumento criado para triagem clínica operacional, com linguagem simples, itens funcionais e tarefas diretas quando aplicável.',
  not_normative_disclaimer:'Instrumento autoral/operacional de triagem e acompanhamento; não substitui escala normatizada, avaliação clínica ou instrumento licenciado quando indicado.'
}));
const ids=new Set(base.map(x=>x&&x.id));
window.NEUROPED_EDITORIAL_SCALES=base.concat(generated.filter(x=>!ids.has(x.id)));
window.NEUROPED_453_AUTHORIAL_COUNT=generated.length;
})();