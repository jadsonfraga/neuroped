(function(){
'use strict';
if(window.NEUROPED_GLOBAL_MAX_LOADED)return;window.NEUROPED_GLOBAL_MAX_LOADED=true;
const base=Array.isArray(window.NEUROPED_EDITORIAL_SCALES)?window.NEUROPED_EDITORIAL_SCALES:[];
const ages=[
{k:'baby',label:'0–2 anos',min:0,max:35,who:'bebês e crianças pequenas'},
{k:'pre',label:'3–5 anos',min:36,max:71,who:'pré-escolares'},
{k:'school',label:'6–11 anos',min:72,max:143,who:'crianças escolares'},
{k:'teen',label:'12–17 anos',min:144,max:215,who:'adolescentes'},
{k:'adult',label:'18+ anos',min:216,max:960,who:'adultos jovens e cuidadores'}
];
const resp=[
{k:'familia',label:'Teste familiar',by:'pais/cuidadores'},
{k:'escola',label:'Teste escolar',by:'professores/escola'},
{k:'autoteste',label:'Autoteste',by:'respondente quando possível'},
{k:'terapeuta',label:'Terapias/equipe',by:'fono, TO, psicologia, psicopedagogia ou equipe'},
{k:'clinico',label:'Clínico',by:'médico/avaliador'}
];
const sources=[
{k:'mchat',emoji:'🌱',name:'Sinais precoces de autismo',model:'M-CHAT-R/F',dom:'TEA',sym:['olhar','nome','apontar','brincar','interesse social'],age:['baby','pre']},
{k:'sdq',emoji:'🧭',name:'Comportamento e dificuldades gerais',model:'SDQ',dom:'Comportamento',sym:['emoção','conduta','hiperatividade','pares','prosocial'],age:['pre','school','teen']},
{k:'psc',emoji:'🧩',name:'Funcionamento psicossocial pediátrico',model:'PSC/PSC-17',dom:'Psicossocial',sym:['internalização','externalização','atenção','humor','comportamento'],age:['pre','school','teen']},
{k:'swyc',emoji:'👶',name:'Desenvolvimento inicial e família',model:'SWYC',dom:'Desenvolvimento',sym:['marcos','comportamento','família','rotina','linguagem'],age:['baby','pre']},
{k:'vanderbilt',emoji:'⚡',name:'Atenção, hiperatividade e escola',model:'Vanderbilt/NICHQ',dom:'TDAH',sym:['desatenção','hiperatividade','impulsividade','oposição','aprendizagem'],age:['school','teen']},
{k:'sared',emoji:'😟',name:'Ansiedade infantil e adolescente',model:'SCARED',dom:'Ansiedade',sym:['pânico','separação','social','escola','preocupação'],age:['school','teen']},
{k:'phq',emoji:'🕯️',name:'Humor e depressividade',model:'PHQ-9/PHQ-A',dom:'Humor',sym:['humor','prazer','sono','energia','autodepreciação'],age:['teen','adult']},
{k:'gad',emoji:'🌧️',name:'Preocupação e ansiedade generalizada',model:'GAD-7',dom:'Ansiedade',sym:['preocupação','tensão','medo','irritabilidade','relaxamento'],age:['teen','adult']},
{k:'c_ssrs',emoji:'🛟',name:'Segurança emocional e risco',model:'C-SSRS',dom:'Segurança',sym:['risco','ideação','autoagressão','plano de ajuda','proteção'],age:['teen','adult']},
{k:'crafft',emoji:'🧪',name:'Uso de substâncias no adolescente',model:'CRAFFT',dom:'Substâncias',sym:['álcool','drogas','risco','amigos','direção'],age:['teen','adult']},
{k:'promis',emoji:'📈',name:'Saúde autorreferida e qualidade de vida',model:'PROMIS',dom:'Qualidade de vida',sym:['dor','fadiga','sono','função física','social'],age:['school','teen','adult']},
{k:'whodas',emoji:'🌍',name:'Funcionalidade global',model:'WHODAS',dom:'Funcionalidade',sym:['cognição','mobilidade','autocuidado','relações','participação'],age:['teen','adult']},
{k:'audit',emoji:'🍷',name:'Risco por álcool',model:'AUDIT/AUDIT-C',dom:'Substâncias',sym:['álcool','frequência','perda de controle','impacto','risco'],age:['teen','adult']},
{k:'assist',emoji:'🧪',name:'Risco por substâncias psicoativas',model:'WHO ASSIST',dom:'Substâncias',sym:['substâncias','uso','compulsão','prejuízo','risco'],age:['teen','adult']},
{k:'ptsd',emoji:'🌩️',name:'Trauma e estresse pós-evento',model:'CPSS/PCL',dom:'Trauma',sym:['revivência','evitação','hipervigilância','pesadelos','medo'],age:['school','teen','adult']},
{k:'pain',emoji:'🤕',name:'Dor e impacto funcional',model:'NRS/FLACC funcional',dom:'Dor',sym:['dor','intensidade','sono','escola','atividade'],age:['baby','pre','school','teen','adult']},
{k:'sleep',emoji:'😴',name:'Sono, ritmo e impacto diurno',model:'BEARS/ISI',dom:'Sono',sym:['início do sono','despertar','ronco','sonolência','rotina'],age:['baby','pre','school','teen','adult']},
{k:'feeding',emoji:'🍽️',name:'Alimentação, textura e segurança',model:'Feeding checklists',dom:'Alimentação',sym:['seletividade','textura','engasgo','mastigação','recusa'],age:['baby','pre','school','teen']},
{k:'motor',emoji:'🏃',name:'Coordenação, praxia e escrita',model:'DCDQ/MABC domains',dom:'Motor',sym:['coordenação','equilíbrio','motricidade fina','praxia','caligrafia'],age:['pre','school','teen']},
{k:'tics',emoji:'🔁',name:'Tiques e repetição motora/vocal',model:'tic severity domains',dom:'Tiques',sym:['tique motor','tique vocal','urgência','controle','prejuízo'],age:['school','teen','adult']},
{k:'ocd',emoji:'🔒',name:'Obsessões, compulsões e rigidez',model:'OCD domains',dom:'TOC',sym:['obsessão','compulsão','ritual','checagem','sofrimento'],age:['school','teen','adult']},
{k:'headache',emoji:'🤯',name:'Cefaleia e gatilhos',model:'headache diary domains',dom:'Cefaleia',sym:['cefaleia','gatilho','náusea','fotofobia','impacto'],age:['school','teen','adult']},
{k:'epilepsy',emoji:'🧬',name:'Eventos paroxísticos e crises',model:'seizure diary domains',dom:'Epilepsia',sym:['crise','queda','abalo','recuperação','gatilho'],age:['baby','pre','school','teen','adult']},
{k:'adaptive',emoji:'🚽',name:'Autonomia e vida diária',model:'adaptive behavior domains',dom:'Autonomia',sym:['banheiro','higiene','roupa','alimentação','rotina'],age:['baby','pre','school','teen','adult']},
{k:'social',emoji:'🤝',name:'Pragmática social e pares',model:'social communication domains',dom:'Social',sym:['amigos','turnos','conversa','empatia','grupo'],age:['pre','school','teen','adult']},
{k:'screen',emoji:'📱',name:'Tela, jogos e regulação digital',model:'digital wellbeing domains',dom:'Rotina digital',sym:['tela','jogo','sono','irritação','limites'],age:['pre','school','teen','adult']},
{k:'med',emoji:'💊',name:'Monitoramento medicamentoso',model:'medication monitoring domains',dom:'Farmacologia',sym:['adesão','efeito','sono','apetite','humor'],age:['baby','pre','school','teen','adult']}
];
const styles=[
{k:'rastreio',label:'Rastreio breve'},
{k:'impacto',label:'Impacto funcional'},
{k:'seguimento',label:'Seguimento evolutivo'},
{k:'ambiente',label:'Comparativo por ambiente'},
{k:'redflags',label:'Sinais de alerta'},
{k:'forcas',label:'Pontos fortes e proteção'}
];
function cap(s){return String(s).charAt(0).toUpperCase()+String(s).slice(1)}
function slug(s){return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}
function questions(src,age,who,style){const q=[
`O padrão de ${src.name.toLowerCase()} aparece de forma clara em ${age.who}?`,
`O respondente (${who.by}) observa prejuízo em rotina, aprendizagem, saúde ou convivência?`,
`A intensidade mudou nas últimas semanas ou meses?`,
`A dificuldade ocorre em mais de um ambiente ou depende muito do contexto?`,
`Há estratégia que melhora o desempenho, como rotina, apoio visual, pausa, treino ou redução de estímulo?`
];
src.sym.slice(0,5).forEach(x=>q.push(`O domínio “${x}” está presente de forma frequente ou clinicamente relevante?`));
if(style.k==='impacto')q.push('O sinal reduz independência, participação social, rendimento escolar ou adesão terapêutica?');
if(style.k==='seguimento')q.push('Comparando com a última avaliação, houve melhora, estabilidade ou piora funcional?');
if(style.k==='ambiente')q.push('O comportamento muda de forma importante entre casa, escola, terapia e consulta?');
if(style.k==='redflags')q.push('Existe sinal de alerta que exige avaliação clínica prioritária ou orientação imediata?');
if(style.k==='forcas')q.push('Quais habilidades preservadas ajudam a compensar a dificuldade principal?');
return q.slice(0,12)}
function tasks(src,age){const universal=[
'Leitura curta: “Lia viu um sapo no jardim. O sapo pulou perto da flor.” Perguntar: quem viu o sapo, onde estava e o que aconteceu depois.',
'Ditado de palavras: casa, bola, janela, prato, brincadeira. Registrar trocas, omissões, lentidão e frustração.',
'Repetição de frase: “O menino guardou a bola azul dentro da caixa”. Registrar memória verbal e ordem das palavras.',
'Sequência de comandos: pegue o lápis, toque na mesa e desenhe um círculo. Registrar compreensão, atenção e execução.',
'Nomeação rápida: copo, bola, chave, gato, mão, sapato. Registrar acesso lexical e articulação.'
];
const k=src.k;
if(['mchat','social'].includes(k))return ['Cena social: “Pedro queria brincar, mas João pegou o carrinho e saiu.” Perguntar o que Pedro sentiu e o que poderia fazer.','Brincadeira simbólica com boneco, prato e carrinho; observar faz de conta, turnos e compartilhamento.','Atenção compartilhada: apontar figura interessante e observar se acompanha gesto/olhar.',...universal].slice(0,8);
if(['vanderbilt'].includes(k))return ['Atenção auditiva: dizer sol, bola, peixe, bola, casa; bater na mesa quando ouvir bola.','Inibição: quando eu disser dia, responda noite; quando disser noite, responda dia.','Memória: repetir 4-8-2 e depois 7-1-9-3 conforme idade.',...universal].slice(0,8);
if(['sared','gad','phq','c_ssrs'].includes(k))return ['Termômetro emocional 0–10 para escola, separação, sono, tristeza e preocupação.','História social: “Um colega não respondeu sua mensagem.” Levantar três explicações possíveis.','Rede de ajuda: listar três adultos que procuraria se piorasse.',...universal].slice(0,8);
if(['feeding'].includes(k))return ['Lista alimentar: cinco alimentos aceitos, cinco recusados e motivo percebido.','Tolerância gradual: olhar, tocar, cheirar e aproximar alimento novo sem forçar.','Escala de textura: macio, crocante, misturado, cheiro forte, líquido.',...universal].slice(0,8);
if(['pain','headache','epilepsy'].includes(k))return ['Linha do tempo: registrar antes, durante e depois do episódio, duração, gatilho e recuperação.','Mapa corporal: apontar local, intensidade 0–10 e impacto na rotina.','Diário breve por 7 dias: sono, alimentação, tela, escola, dor/evento.',...universal].slice(0,8);
if(['motor'].includes(k))return ['Praxia: imitar bater palma, tocar cabeça e cruzar braços.','Grafomotor: copiar círculo, cruz, quadrado e frase curta.','Equilíbrio: ficar em um pé e andar em linha imaginária.',...universal].slice(0,8);
return universal.slice(0,8)}
const rows=[];sources.forEach(src=>ages.filter(a=>src.age.includes(a.k)).forEach(age=>resp.forEach(who=>styles.forEach(style=>rows.push({src,age,who,style})))));
const generated=rows.slice(0,620).map((r,i)=>({
 id:`global-${String(i+1).padStart(3,'0')}-${slug(r.src.k)}-${slug(r.age.k)}-${slug(r.who.k)}-${slug(r.style.k)}`,
 title:`${r.src.emoji} Global NeuroPed — ${r.src.name} · ${r.style.label} · ${r.age.label} · ${r.who.label}`,
 short_title:`${r.src.name} · ${r.style.label}`,
 original_title:`Modelo internacional de domínio: ${r.src.model}`,
 emoji:r.src.emoji,
 audience:r.who.k,
 audience_label:r.who.label,
 age_band:r.age.label,
 age_min_months:r.age.min,
 age_max_months:r.age.max,
 symptoms:r.src.sym,
 complaints:r.src.sym,
 keywords:[r.src.model,r.src.name,r.src.dom,r.style.label,r.age.label,r.who.label,...r.src.sym],
 domain:r.src.dom,
 source_model:r.src.model,
 page:'instrumento.html',
 anchor:`global-${String(i+1).padStart(3,'0')}`,
 priority:76+(i%24),
 plain_questions:questions(r.src,r.age,r.who,r.style),
 direct_tasks:tasks(r.src,r.age),
 clinical_use:`Inventário autoral inspirado em domínios internacionais gratuitos/abertos (${r.src.model}), para ${r.age.who}, respondido por ${r.who.by}.`,
 differentiator:'Expande o banco NeuroPed com triagem operacional autoral, sem copiar itens proprietários ou reproduzir escala licenciada.',
 not_normative_disclaimer:'Instrumento autoral/operacional de triagem e acompanhamento. Não substitui escala oficial, avaliação clínica, licença de instrumento ou validação psicométrica quando necessária.'
}));
const seen=new Set(base.map(x=>x&&x.id));
window.NEUROPED_EDITORIAL_SCALES=base.concat(generated.filter(x=>!seen.has(x.id)));
window.NEUROPED_GLOBAL_MAX_COUNT=generated.length;
})();