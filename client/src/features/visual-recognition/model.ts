import sourceManifest from "../../../public/recognition-v2/manifest.json";

export const VERSION = "2026-09-23.2";
export const NATURE = "Observação clínica autoral, não padronizada. Não mede acuidade visual, inteligência, idade mental ou diagnóstico. Requer revisão profissional.";
export const CATEGORIES = { animais:"Animais", frutas:"Frutas", transportes:"Transportes", cores:"Cores", opostos:"Conceitos e opostos", objetos:"Objetos do cotidiano" } as const;
export type Category = keyof typeof CATEGORIES;
export const MODES = { receptivo:"Reconhecer · Mostre…", nomeacao:"Nomear · O que é isto?", pareamento:"Parear · Ache a igual" } as const;
export type Mode = keyof typeof MODES;
export const BANDS = [
  {id:"12-23",min:12,max:23,label:"12–23 meses",note:"Exploração compartilhada. Prefira objetos reais e respostas gestuais. Não exigir nomeação, cores ou conceitos abstratos."},
  {id:"24-35",min:24,max:35,label:"2 anos",note:"Poucas figuras familiares. Nomeação não é condição para reconhecer. Cores receptivas entram apenas no roteiro a partir de 30 meses."},
  {id:"36-47",min:36,max:47,label:"3 anos",note:"Figuras familiares e contrastes concretos. Confirme a compreensão da instrução antes de ampliar alternativas."},
  {id:"48-59",min:48,max:59,label:"4 anos",note:"Explore nomeação de algumas cores e relações concretas, sem transformar o roteiro em obrigação de desempenho."},
  {id:"60-83",min:60,max:83,label:"5–6 anos",note:"Amplie repertório e conceitos contextualizados. Familiaridade cultural e exposição à figura precisam ser registradas."},
  {id:"84-119",min:84,max:119,label:"7–9 anos",note:"Apresentação sóbria. Os itens básicos são amostras dirigidas, não uma avaliação cognitiva global desta idade."},
  {id:"120-155",min:120,max:155,label:"10–12 anos",note:"Seleção conforme questão clínica, linguagem e necessidade de apoio, sem infantilização nem idade equivalente."},
  {id:"156-239",min:156,max:239,label:"13–19 anos",note:"Use apenas quando pertinente ao repertório e à questão clínica; desconhecimento de uma figura não define déficit."},
] as const;
export const COLORS = [
  ["vermelho","Vermelho","var(--rv-color-red)"],["azul","Azul","var(--rv-color-blue)"],["amarelo","Amarelo","var(--rv-color-yellow)"],["verde","Verde","var(--rv-color-green)"],
  ["laranja-cor","Laranja","var(--rv-color-orange)"],["roxo","Roxo","var(--rv-color-purple)"],["rosa","Rosa","var(--rv-color-pink)"],["marrom","Marrom","var(--rv-color-brown)"],
  ["preto","Preto","var(--rv-color-black)"],["branco","Branco","var(--rv-color-white)"],["cinza","Cinza","var(--rv-color-gray)"],
] as const;
export const PAIRS = [
  {id:"tamanho",words:["Grande","Pequeno"],min:36,note:"Mesma bola, mesma escala: varia o tamanho."},
  {id:"comprimento",words:["Comprido","Curto"],min:36,note:"Mesma faixa, mesma largura: varia o comprimento."},
  {id:"conteudo",words:["Cheio","Vazio"],min:36,note:"Mesmo recipiente e enquadramento: varia o conteúdo."},
  {id:"abertura",words:["Aberto","Fechado"],min:36,note:"Mesma porta nos dois estados."},
  {id:"vertical",words:["Em cima","Embaixo"],min:36,note:"Posição da bola em relação à mesma mesa."},
  {id:"inclusao",words:["Dentro","Fora"],min:36,note:"Posição da bola em relação à mesma caixa."},
  {id:"quantidade",words:["Muitos","Poucos"],min:48,note:"Objetos idênticos. Não exigir contagem ou leitura de números."},
  {id:"altura",words:["Alto","Baixo"],min:48,note:"Mesma coluna, mesma linha de base: varia a altura."},
  {id:"temperatura",words:["Quente","Frio"],min:60,note:"Inferência semântica contextualizada; não mede temperatura nem sensibilidade térmica. Nunca utilizar líquidos quentes com a criança.",context:"Um recipiente contém água que acabou de ferver. O outro contém água com gelo."},
  {id:"massa",words:["Mais pesado","Mais leve"],min:60,note:"Inferência contextual, dependente de conhecimento dos materiais. Não mede massa ou força; o tamanho das caixas é igual. Objetos reais seguros podem ser necessários.",context:"As caixas têm o mesmo tamanho. Uma está cheia de pedras; a outra está cheia de algodão."},
] as const;
export interface Item {
  id:string; label:string; category:Category; minMonths:number; art:"symbol"|"color"|"opposite";
  aliases:string[]; hash:string; sourcePath?:string; color?:string; pair?:string; side?:number; note:string; context?:string;
}
const aliases:Record<string,string[]>={
  cachorro:["cão","au-au"],gato:["gatinho","miau"],passaro:["passarinho","ave"],porco:["porco"],tartaruga:["tartaruga"],
  moto:["moto"],aviao:["aeroplano"],onibus:["busão"],uva:["uvas","cacho de uvas"],caneca:["xícara"],garrafa:["garrafa","leite"],escova:["escova"],limao:["limão"],"guarda-chuva":["sombrinha"],
};
export const ITEMS:Item[]=[
  ...sourceManifest.items.map((item):Item=>({
    id:item.id,label:item.label,category:item.category as Category,minMonths:item.minMonths,art:"symbol",aliases:aliases[item.id]??[],hash:item.sha256,sourcePath:item.sourcePath,
    note:["Confira se esta representação faz parte do repertório da criança. Variantes e onomatopeias devem ser descritas; não equivalem automaticamente a nomeação convencional.",["limao","pessego","chapeu","garrafa","onibus","tartaruga"].includes(item.id)?"Exemplar específico: confirme familiaridade e aceite denominações usuais sem exigir espécie, variedade ou modelo.":""].filter(Boolean).join(" "),
  })),
  ...COLORS.map(([id,label,color],index):Item=>({id,label,color,category:"cores",minMonths:index<4?30:48,art:"color",aliases:[],hash:`${VERSION}:${id}`,note:"Mancha uniforme; brilho e filtros da tela interferem. Não é teste de visão cromática."})),
  ...PAIRS.flatMap(pair=>pair.words.map((label,side):Item=>({id:`${pair.id}-${side}`,label,category:"opostos",minMonths:pair.min,art:"opposite",aliases:[],hash:`${VERSION}:${pair.id}-${side}`,pair:pair.id,side,note:pair.note,...("context" in pair?{context:pair.context}:{})}))),
];
export const ITEM_MAP=new Map(ITEMS.map(item=>[item.id,item]));
export function itemFor(id:string):Item{const item=ITEM_MAP.get(id);if(!item)throw new Error(`Figura não cadastrada: ${id}`);return item;}
export function ageInMonths(years:string,months:string):number|null{
  if(!/^\d{1,2}$/.test(years)||!/^\d{1,2}$/.test(months))return null;
  const y=Number(years),m=Number(months),total=y*12+m;return m<=11&&total>=12&&total<=239?total:null;
}
export function bandFor(age:number){return Number.isInteger(age)?BANDS.find(b=>age>=b.min&&age<=b.max):undefined;}
export function eligibleItems(age:number,mode:Mode):Item[]{
  if(!bandFor(age)||!Object.hasOwn(MODES,mode))return [];
  return ITEMS.filter(item=>item.minMonths<=age&&!(mode==="nomeacao"&&item.category==="cores"&&age<48)&&!(mode==="pareamento"&&item.category==="opostos"));
}
export function shuffle<T>(values:readonly T[],seed:number):T[]{
  const out=[...values];let state=seed>>>0;
  const random=()=>{state+=0x6d2b79f5;let t=state;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};
  for(let i=out.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;
}
/**
 * Modo Fácil (joguinho): configuração graduada pela idade, sem decisão do
 * aplicador. Mais novo = menos figuras e duas alternativas bem diferentes;
 * mais velho = quatro alternativas da mesma categoria, sem infantilizar.
 */
export function easyPlanSettings(age:number):{choices:2|3|4;count:number;distractors:Config["distractors"];categories:Category[]}{
  if(age<24)return{choices:2,count:8,distractors:"distantes",categories:["animais","frutas","objetos","transportes"]};
  if(age<48)return{choices:2,count:10,distractors:"distantes",categories:Object.keys(CATEGORIES) as Category[]};
  if(age<84)return{choices:3,count:12,distractors:"distantes",categories:Object.keys(CATEGORIES) as Category[]};
  return{choices:4,count:12,distractors:"categoria",categories:Object.keys(CATEGORIES) as Category[]};
}
/** Plano do Modo Fácil já resolvido para a idade: figuras elegíveis e quantidade real (nunca promete mais do que o banco tem). */
export function easyPlanFor(age:number):ReturnType<typeof easyPlanSettings>&{ids:string[]}{
  const settings=easyPlanSettings(age);
  const ids=eligibleItems(age,"receptivo").filter(item=>!item.context&&settings.categories.includes(item.category)).map(item=>item.id);
  return{...settings,ids,count:Math.min(settings.count,ids.length)};
}
export interface Config{ageMonths:number;mode:Mode;choices:2|3|4;count:number;selectedIds:string[];seed:number;distractors:"distantes"|"categoria";contextAcknowledged:boolean;conditions:string[];}
/**
 * Outras figuras na tela para um alvo. Opostos ficam no par; cores só com cores.
 * "distantes" (Categorias distintas quando possível): figuras de outra categoria
 * sempre que houver o suficiente para preencher a tela; senão, qualquer figura do
 * mesmo tipo de arte. "categoria" (Mesma categoria): só a mesma categoria, e
 * falha fechado, com a categoria nomeada, quando ela não tem outra figura elegível.
 */
export function distractorPool(target:Item,selected:readonly Item[],choices:number,distractors:Config["distractors"]):Item[]{
  if(target.pair)return selected.filter(item=>item.pair===target.pair);
  if(target.category==="cores")return selected.filter(item=>item.category==="cores");
  const sameArt=selected.filter(item=>item.art===target.art&&item.id!==target.id);
  if(distractors==="categoria"){
    const same=sameArt.filter(item=>item.category===target.category);
    if(!same.length)throw new Error(`Em "Mesma categoria", ${CATEGORIES[target.category]} tem só ${target.label} elegível nesta seleção. Escolha "Categorias distintas quando possível" ou acrescente figuras da categoria.`);
    return[target,...same];
  }
  const distant=sameArt.filter(item=>item.category!==target.category);
  return[target,...(distant.length>=choices-1?distant:sameArt)];
}
export interface Trial{id:string;targetId:string;optionIds:string[];mode:Mode;question:string;context?:string;assetVersion:string;adaptedFrom?:string;}
export function makeTrial(targetId:string,mode:Mode,pool:Item[],choices:number,seed:number,index:number):Trial{
  const target=itemFor(targetId);
  if(!Object.hasOwn(MODES,mode)||![2,3,4].includes(choices))throw new Error("Configuração inválida.");
  let others=pool.filter(item=>item.id!==target.id&&(target.pair?item.pair===target.pair:item.art===target.art));
  if(!target.pair&&target.category==="cores")others=others.filter(item=>item.category==="cores");
  const need=target.pair?Math.min(1,others.length):Math.min(choices-1,others.length);
  if((mode!=="nomeacao"||target.pair)&&need<1)throw new Error("Selecione ao menos duas figuras compatíveis. Conceitos precisam dos dois estados do mesmo par.");
  const foils=shuffle(others,seed+index*37).slice(0,need).map(item=>item.id);
  const optionIds=mode==="nomeacao"&&!target.pair?[target.id]:foils;
  if(mode!=="nomeacao"||target.pair){
    const size=foils.length+1;
    // Keep balanced positions, changing the permutation for each block so
    // a fixed left-right alternation cannot substitute for recognition.
    const blockSeed=seed+Math.floor(index/size)*7919;
    const position=shuffle(Array.from({length:size},(_,i)=>i),blockSeed)[index%size];
    optionIds.splice(position,0,target.id);
  }
  const question=mode==="pareamento"?"Ache a figura igual ao modelo. O modelo continua visível.":mode==="nomeacao"?target.pair?"Compare as duas figuras. Como você descreveria a figura destacada?":target.category==="cores"?"Que cor é esta?":"O que é isto?":`Mostre: ${target.label.toLocaleLowerCase("pt-BR")}.`;
  return{id:`rv-${seed}-${index}`,targetId,optionIds,mode,question,context:target.context,assetVersion:VERSION};
}
export function buildPlan(config:Config):Trial[]{
  if(!bandFor(config.ageMonths)||![2,3,4].includes(config.choices)||!Number.isInteger(config.count)||config.count<1||config.count>100||!Number.isInteger(config.seed)||!Object.hasOwn(MODES,config.mode))throw new Error("Configuração inválida.");
  if(config.ageMonths<24&&config.mode==="nomeacao")throw new Error("Antes de 24 meses, prefira exploração e reconhecimento receptivo; não exigir nomeação.");
  const allowed=eligibleItems(config.ageMonths,config.mode);
  if(new Set(config.selectedIds).size!==config.selectedIds.length||config.selectedIds.some(id=>!allowed.some(item=>item.id===id)))throw new Error("Seleção incompatível com o roteiro ou modalidade.");
  const selected=allowed.filter(item=>config.selectedIds.includes(item.id));if(!selected.length)throw new Error("Selecione figuras para iniciar.");
  if(selected.some(item=>item.context)&&!config.contextAcknowledged)throw new Error("Leia os limites dos conceitos contextualizados antes de iniciar.");
  const groups=shuffle(Object.keys(CATEGORIES) as Category[],config.seed).map(category=>shuffle(selected.filter(item=>item.category===category),config.seed+category.length));
  const targets:Item[]=[];
  while(groups.some(group=>group.length)){for(const group of groups){const item=group.shift();if(item)targets.push(item);}}
  return targets.slice(0,config.count).map((target,index)=>makeTrial(target.id,config.mode,distractorPool(target,selected,config.choices,config.distractors),config.choices,config.seed,index));
}
export const OUTCOMES={correspondente:"Resposta correspondente",diferente:"Resposta diferente",sem_resposta:"Não respondeu",recusa:"Recusou",nao_aplicado:"Não aplicado",ambiguo:"Figura ambígua / não reconhecível",tecnico:"Problema técnico"} as const;
export type Outcome=keyof typeof OUTCOMES;
export const SUPPORTS={independente:"Sem ajuda",repeticao:"Repetição da instrução",gestual:"Pista gestual",semantica:"Pista semântica",modelo:"Nome/modelo fornecido",outra:"Outra ajuda"} as const;
export const CHANNELS={oral:"Fala",toque:"Toque na tela",apontar:"Apontar fora da tela",olhar:"Olhar interpretado pelo aplicador",caa:"Comunicação alternativa",misto:"Mais de uma via",nenhuma:"Sem resposta observável"} as const;
export interface StageEvent{kind:"apresentado"|"toque"|"encerrado"|"interrompido"|"erro-imagem";at:string;itemId?:string;detail?:string;}
export interface Draft{outcome:Outcome|"";literal:string;help:keyof typeof SUPPORTS;channel:keyof typeof CHANNELS|"";familiarity:"conhecida"|"incerta"|"desconhecida"|"";note:string;}
export const emptyDraft=():Draft=>({outcome:"",literal:"",help:"independente",channel:"",familiarity:"",note:""});
export interface Observation{id:string;trial:Trial;item:{label:string;category:Category;hash:string};options:{id:string;label:string;hash:string}[];response:Draft;events:StageEvent[];previousExposure:boolean;recordedAt:string;supersedes?:string;correctionReason?:string;}
export function problems(trial:Trial,draft:Draft,events:StageEvent[]):string[]{
  const errors:string[]=[];
  if(!draft.outcome||!Object.hasOwn(OUTCOMES,draft.outcome))errors.push("Escolha a situação observada.");
  if(!["conhecida","incerta","desconhecida"].includes(draft.familiarity))errors.push("Registre a familiaridade (pode ser incerta).");
  if(!Object.hasOwn(SUPPORTS,draft.help)||(draft.channel&&!Object.hasOwn(CHANNELS,draft.channel)))errors.push("Modalidade de ajuda ou resposta inválida.");
  if(!trial.optionIds.includes(trial.targetId)||new Set(trial.optionIds).size!==trial.optionIds.length||trial.optionIds.some(id=>!ITEM_MAP.has(id)))errors.push("Alternativas inconsistentes.");
  if(events.some(event=>!Number.isFinite(Date.parse(event.at))||!["apresentado","toque","encerrado","interrompido","erro-imagem"].includes(event.kind)||(event.kind==="toque"&&(!event.itemId||!trial.optionIds.includes(event.itemId)))))errors.push("Evento incompatível com as figuras apresentadas.");
  const presentations=events.filter(event=>event.kind==="apresentado").length;
  const technical=events.some(event=>event.kind==="erro-imagem");
  const interpretable=draft.outcome==="correspondente"||draft.outcome==="diferente";
  const performance=interpretable||draft.outcome==="sem_resposta";
  if(performance&&!presentations)errors.push("A figura precisa ter sido apresentada.");
  if(performance&&technical)errors.push("Falha de imagem impede registrar desempenho; encerre como problema técnico e reapresente em nova tentativa.");
  if(interpretable&&(!draft.channel||draft.channel==="nenhuma"))errors.push("Registre a via da resposta.");
  if(interpretable&&trial.mode==="nomeacao"&&!draft.literal.trim())errors.push("Transcreva a resposta de nomeação, sem corrigir a fala.");
  if(interpretable&&presentations>1&&draft.help==="independente")errors.push("Houve reapresentação: registre a repetição ou outra ajuda e descreva a condição.");
  if(draft.channel==="toque"&&interpretable){const last=events.filter(event=>event.kind==="toque").at(-1)?.itemId;if(!last)errors.push("Não houve toque registrado. Use apontar/olhar/fala quando a resposta foi observada pelo aplicador.");else if((last===trial.targetId)!==(draft.outcome==="correspondente"))errors.push("A classificação não corresponde ao último toque. Descreva uma resposta por outra via separadamente.");}
  if(["nao_aplicado","ambiguo","tecnico","recusa"].includes(draft.outcome)&&!draft.note.trim())errors.push("Explique o motivo sem atribuir falha à criança.");
  if(draft.help!=="independente"&&!draft.note.trim())errors.push("Descreva a ajuda utilizada.");
  if(draft.literal.length>1000||draft.note.length>2000)errors.push("Registro excede o limite de texto.");
  return errors;
}
export function activeObservations(ledger:Observation[]):Observation[]{const replaced=new Set(ledger.map(record=>record.supersedes).filter(Boolean));return ledger.filter(record=>!replaced.has(record.id));}
export function observe(trial:Trial,draft:Draft,events:StageEvent[],ledger:Observation[],supersedes?:string,correctionReason?:string):Observation{
  const errors=problems(trial,draft,events);if(errors.length)throw new Error(errors.join(" "));
  const active=activeObservations(ledger);
  if(!supersedes&&active.some(record=>record.trial.id===trial.id))throw new Error("Esta oportunidade já foi registrada; use correção com justificativa.");
  const original=supersedes?active.find(record=>record.id===supersedes):undefined;
  if(supersedes&&(!original||!correctionReason?.trim()||original.trial.id!==trial.id||JSON.stringify(original.trial)!==JSON.stringify(trial)||JSON.stringify(original.events)!==JSON.stringify(events)))throw new Error("Correção exige registro ativo, eventos preservados e justificativa.");
  const item=itemFor(trial.targetId);
  const previousExposure=original?.previousExposure??ledger.some(record=>record.trial.id!==trial.id&&record.trial.targetId===trial.targetId&&record.events.some(event=>event.kind==="apresentado")&&(record.trial.mode==="receptivo"||record.response.help!=="independente"));
  return{id:`${trial.id}-r${ledger.length+1}`,trial:{...trial,optionIds:[...trial.optionIds]},item:{label:item.label,category:item.category,hash:item.hash},options:trial.optionIds.map(id=>{const option=itemFor(id);return{id,label:option.label,hash:option.hash};}),response:{...draft},events:events.map(event=>({...event})),previousExposure,recordedAt:new Date().toISOString(),supersedes,correctionReason};
}
export function reportText(config:Config,plan:Trial[],ledger:Observation[]):string{
  const records=activeObservations(ledger);const primary=new Set(records.filter(record=>!record.trial.adaptedFrom).map(record=>record.trial.id));
  const header=["RECONHECIMENTO VISUAL · REGISTRO DESCRITIVO",`Versão ${VERSION} | ${config.ageMonths} meses | Roteiro ${bandFor(config.ageMonths)?.label??"não identificado"}`,NATURE,"As faixas organizam a aplicação; não são normas ou idades-limite para adquirir habilidades.",`Cobertura: ${primary.size} de ${plan.length} oportunidades principais documentadas. ${plan.length-primary.size} ainda sem registro.`,"Pareamento demonstra correspondência perceptual, não necessariamente conhecimento do significado. Figuras familiares, linguagem, visão, motricidade e condições da sessão interferem.",`Condições declaradas: ${config.conditions.join("; ")||"nenhuma informada"}.`,""];
  for(const mode of Object.keys(MODES) as Mode[]){const group=records.filter(record=>record.trial.mode===mode);if(!group.length)continue;header.push(`${MODES[mode]}: ${group.length} registros; ${group.filter(record=>record.response.outcome==="correspondente"&&record.response.help==="independente"&&!record.previousExposure).length} respostas correspondentes sem ajuda declarada e sem exposição prévia ao nome/ajuda registrada. Contagem descritiva, não escore normativo.`);}
  for(const record of records){const r=record.response;header.push("",`${record.item.label} · ${CATEGORIES[record.item.category]} · ${MODES[record.trial.mode]}`,`Pergunta: ${record.trial.question}`,record.trial.context?`Contexto lido: ${record.trial.context}`:"",`Ordem mostrada: ${record.options.map(option=>option.label).join(" | ")}`,`Situação: ${r.outcome?OUTCOMES[r.outcome]:"não registrado"}. Via: ${r.channel?CHANNELS[r.channel]:"não informada"}. Ajuda: ${SUPPORTS[r.help]}. Familiaridade: ${r.familiarity}.`,`Resposta literal: ${r.literal||"não verbalizada / não transcrita"}`,`Observações: ${r.note||"sem observação adicional"}`,`Apresentações: ${record.events.filter(event=>event.kind==="apresentado").length}; toques: ${record.events.filter(event=>event.kind==="toque").map(event=>record.options.find(option=>option.id===event.itemId)?.label??"evento inválido").join(" → ")||"nenhum"}.`,record.previousExposure?"Houve exposição prévia ao nome/ajuda nesta sessão: não interpretar como nomeação espontânea independente.":"",record.trial.adaptedFrom?"Tentativa complementar: manter separada da oportunidade inicial.":"",record.supersedes?`Registro corrigido com histórico preservado. Motivo: ${record.correctionReason}`:"");}
  header.push("","Síntese diagnóstica e assinatura: exclusivas do profissional após integração clínica.","Ilustrações: Mulberry Symbols, © 2018–2026 Steve Lee, CC BY-SA 4.0. Cores e relações geométricas: implementação autoral NeuroPed. Repertório visual ainda não validado psicometricamente em crianças brasileiras.");return header.join("\n");
}
