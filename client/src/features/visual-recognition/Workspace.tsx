import { useEffect, useMemo, useRef, useState } from "react";
import { Apple, Bus, Check, ChevronRight, ClipboardCheck, Download, Eye, Images, Layers, Palette, PawPrint, Search, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { ITEMS, CATEGORIES, MODES, BANDS, VERSION, NATURE, OUTCOMES, SUPPORTS, CHANNELS, itemFor, ageInMonths, bandFor, eligibleItems, buildPlan, makeTrial, emptyDraft, observe, activeObservations, reportText, easyPlanSettings, easyPlanSelection, easyPlanCount, type Category, type Mode, type Config, type Trial, type StageEvent, type Draft, type Observation } from "./model";
import { Stimulus, preloadSymbols } from "./Stimulus";
import TrialStage from "./TrialStage";
import { DEFAULT_HERO, HeroGrid, NEUTRAL_CHEERS, StarCounter, type Hero } from "@/components/aventura";
import EasyGame, { type EasyStep } from "@/components/jogo-facil/EasyGame";
import "./visual-recognition.css";

const icons={animais:PawPrint,frutas:Apple,transportes:Bus,cores:Palette,opostos:Layers,objetos:Images};
const PREPARATION=["Revisei as figuras e retirei as que não são adequadas ao repertório da criança.","Conferi conforto, iluminação, brilho e filtros de cor do tablet.","Vou registrar o que foi observado, sem inferir diagnóstico ou desempenho normativo."];
export const DIRECT_TRACK_NOTE="Modo direto: guia de primeira aplicação e conferências de preparo dispensados pela aplicadora experiente";
const CONDITIONS=["Visão/óculos a considerar","Audição a considerar","Comunicação não oral","Dificuldade motora para tocar","Idioma ou repertório cultural diferente","Cansaço ou distração"];
const readableError=(error:unknown)=>error instanceof Error?error.message:"Não foi possível concluir esta operação.";
function downloadFile(text:string,type:string,name:string){const url=URL.createObjectURL(new Blob([text],{type}));const anchor=document.createElement("a");anchor.href=url;anchor.download=name;anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function useExitGuard(active:boolean){
  useEffect(()=>{
    if(!active)return;
    const held=window.location.href,state=window.history.state;let leaving=false;
    const prompt="Os registros estão somente nesta sessão. Baixe o registro antes de sair. Deseja sair e descartar os dados?";
    const isOther=(url:string)=>new URL(url,held).href.split("?")[0]!==held.split("?")[0];
    const warn=(event:BeforeUnloadEvent)=>{if(!leaving){event.preventDefault();event.returnValue="";}};
    const click=(event:MouseEvent)=>{
      if(event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey||!(event.target instanceof Element))return;
      const anchor=event.target.closest("a[href]");if(!(anchor instanceof HTMLAnchorElement)||anchor.target==="_blank"||anchor.hasAttribute("download")||!isOther(anchor.href))return;
      if(window.confirm(prompt)){leaving=true;return;}event.preventDefault();event.stopPropagation();
    };
    const change=(event:Event)=>{if(leaving||!isOther(window.location.href))return;if(window.confirm(prompt)){leaving=true;return;}event.stopImmediatePropagation();window.history.replaceState(state,"",held);};
    window.addEventListener("beforeunload",warn);document.addEventListener("click",click,true);window.addEventListener("hashchange",change,true);window.addEventListener("popstate",change,true);
    return()=>{window.removeEventListener("beforeunload",warn);document.removeEventListener("click",click,true);window.removeEventListener("hashchange",change,true);window.removeEventListener("popstate",change,true);};
  },[active]);
}
export default function VisualRecognitionWorkspace(){
  const [phase,setPhase]=useState<"prepare"|"run"|"report">("prepare");
  const [track,setTrack]=useState<"easy"|"guided"|"direct">("guided");const direct=track==="direct",easy=track==="easy";
  const [easyPlan,setEasyPlan]=useState<Trial[]>([]),[easyProgress,setEasyProgress]=useState(0);
  const easyTap=useRef<string|null>(null);
  // Camada de aventura: herói e mensagens neutras entre oportunidades. Não é
  // dado clínico, não entra no registro. Estrelas = oportunidades registradas
  // (participação), nunca a situação observada escolhida.
  const [hero,setHero]=useState<Hero>(DEFAULT_HERO);
  const [years,setYears]=useState(""),[months,setMonths]=useState("0"),[preview,setPreview]=useState("48-59");
  const [mode,setMode]=useState<Mode>("receptivo"),[choices,setChoices]=useState<2|3|4>(2),[count,setCount]=useState(12),[distractors,setDistractors]=useState<Config["distractors"]>("distantes");
  const [categories,setCategories]=useState<Category[]>(Object.keys(CATEGORIES) as Category[]),[excluded,setExcluded]=useState<string[]>([]),[search,setSearch]=useState("");
  const [contexts,setContexts]=useState(false),[checks,setChecks]=useState<boolean[]>([false,false,false]),[conditions,setConditions]=useState<string[]>([]);
  const [message,setMessage]=useState(""),[loading,setLoading]=useState(false),[urls,setUrls]=useState<Record<string,string>>({});
  const [config,setConfig]=useState<Config|null>(null),[basePlan,setBasePlan]=useState<Trial[]>([]),[queue,setQueue]=useState<Trial[]>([]),[index,setIndex]=useState(0);
  const [ledger,setLedger]=useState<Observation[]>([]),[draft,setDraft]=useState<Draft>(emptyDraft),[events,setEvents]=useState<StageEvent[]>([]),[stage,setStage]=useState(false);
  const [editing,setEditing]=useState<Observation|null>(null),[correction,setCorrection]=useState("");
  const abort=useRef<AbortController|null>(null),liveUrls=useRef<Record<string,string>>({});
  const pendingBeforeEdit=useRef<{draft:Draft;events:StageEvent[]}|null>(null);
  const committing=useRef(false);
  useEffect(()=>{committing.current=false;},[index,editing,phase]);
  const leaveEditing=()=>{const pending=pendingBeforeEdit.current;if(pending){setDraft(pending.draft);setEvents(pending.events);}pendingBeforeEdit.current=null;setEditing(null);setCorrection("");};
  const age=ageInMonths(years,months),previewBand=BANDS.find(band=>band.id===preview)??BANDS[3],displayAge=age??previewBand.min;
  const band=bandFor(displayAge);
  const available=useMemo(()=>eligibleItems(displayAge,mode).filter(item=>contexts||!item.context),[displayAge,mode,contexts]);
  const candidates=available.filter(item=>categories.includes(item.category));
  const selected=candidates.filter(item=>!excluded.includes(item.id));
  const shown=candidates.filter(item=>(item.label+" "+item.aliases.join(" ")).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().includes(search.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase()));
  const trial=editing?.trial??queue[index],target=trial?itemFor(trial.targetId):null;
  const active=activeObservations(ledger),report=config?reportText(config,basePlan,ledger):"";
  useExitGuard(config!==null||easyProgress>0);
  useEffect(()=>()=>{abort.current?.abort();Object.values(liveUrls.current).forEach(url=>URL.revokeObjectURL(url));},[]);
  const patch=(value:Partial<Draft>)=>setDraft(current=>({...current,...value}));
  const toggleItem=(id:string)=>{const item=itemFor(id);const ids=item.pair?ITEMS.filter(candidate=>candidate.pair===item.pair).map(candidate=>candidate.id):[id];setExcluded(current=>current.includes(id)?current.filter(value=>!ids.includes(value)):[...new Set([...current,...ids])]);setChecks([false,false,false]);};
  const start=async()=>{
    setMessage("");
    if(age===null){setMessage("Informe a idade exata: anos completos e meses adicionais, entre 12 meses e 19 anos e 11 meses. A prévia não define a idade.");return;}
    if(!direct&&!checks.every(Boolean)){setMessage("Conclua os três cuidados de preparação.");return;}
    if(selected.length===0){setMessage("Selecione ao menos uma figura para esta sessão.");return;}
    const next:Config={ageMonths:age,mode,choices,count,selectedIds:selected.map(item=>item.id),seed:crypto.getRandomValues(new Uint32Array(1))[0],distractors,contextAcknowledged:contexts,conditions:direct?[...conditions,DIRECT_TRACK_NOTE]:[...conditions]};
    try{
      const plan=buildPlan(next);setLoading(true);abort.current?.abort();const controller=new AbortController();abort.current=controller;
      const loaded=await preloadSymbols(next.selectedIds,controller.signal);if(controller.signal.aborted){Object.values(loaded).forEach(url=>URL.revokeObjectURL(url));return;}
      Object.values(liveUrls.current).forEach(url=>URL.revokeObjectURL(url));liveUrls.current=loaded;setUrls(loaded);
      setConfig(next);setBasePlan(plan);setQueue(plan);setIndex(0);setLedger([]);setDraft(emptyDraft());setEvents([]);setPhase("run");
    }catch(error){setMessage(readableError(error));}finally{setLoading(false);}
  };
  const startEasy=async()=>{
    setMessage("");
    if(age===null){setMessage("Informe a idade exata: anos completos e meses adicionais, entre 12 meses e 19 anos e 11 meses.");return;}
    const settings=easyPlanSettings(age);
    const ids=easyPlanSelection(age);
    const next:Config={ageMonths:age,mode:"receptivo",choices:settings.choices,count:settings.count,selectedIds:ids,seed:crypto.getRandomValues(new Uint32Array(1))[0],distractors:settings.distractors,contextAcknowledged:false,conditions:[`Modo Fácil (joguinho): reconhecimento por toque na tela, ${settings.choices} alternativas, sem conferências de preparo`]};
    try{
      const plan=buildPlan(next);setLoading(true);abort.current?.abort();const controller=new AbortController();abort.current=controller;
      const loaded=await preloadSymbols(next.selectedIds,controller.signal);if(controller.signal.aborted){Object.values(loaded).forEach(url=>URL.revokeObjectURL(url));return;}
      Object.values(liveUrls.current).forEach(url=>URL.revokeObjectURL(url));liveUrls.current=loaded;setUrls(loaded);
      setEasyPlan(plan);
    }catch(error){setMessage(readableError(error));}finally{setLoading(false);}
  };
  const easySteps:EasyStep[]=easyPlan.map(trial=>{const item=itemFor(trial.targetId);return{
    id:trial.id,group:`${CATEGORIES[item.category]}`,title:item.label,say:`“${trial.question}”`,hint:`Leia em voz alta e toque em Mostrar. A criança toca na figura; se acertar ou errar, o jogo passa sozinho. Se ela apontar fora da tela ou não responder, marque você. Esperado: ${item.label.toLocaleLowerCase("pt-BR")}`,childLabel:"Mostrar as figuras",
    child:({onDone})=><TrialStage trial={trial} urls={urls} autoFinishOnTap onEvent={event=>{if(event.kind==="apresentado")easyTap.current=null;if(event.kind==="toque"&&event.itemId)easyTap.current=event.itemId;}} onFinish={()=>{const tap=easyTap.current;easyTap.current=null;onDone(tap?(tap===trial.targetId?"acertou":"nao"):undefined,tap?{chosen:itemFor(tap).label,correct:item.label}:undefined);}}/>,
  };});
  const save=(complement=false)=>{
    if(!trial||!config||committing.current)return;
    committing.current=true;
    try{
      let extra:Trial|undefined;
      if(complement){
        const pool=ITEMS.filter(item=>config.selectedIds.includes(item.id) && (target?.pair?item.pair===target.pair:config.distractors==="categoria"?item.category===target?.category:item.art===target?.art));
        extra={...makeTrial(trial.targetId,"receptivo",pool,config.choices,config.seed,queue.length+100),adaptedFrom:trial.id};
      }
      const record=observe(trial,draft,events,ledger,editing?.id,correction);
      setLedger(current=>[...current,record]);setDraft(emptyDraft());setEvents([]);
      if(editing){setMessage("");leaveEditing();setPhase("report");return;}
      // Frase neutra por posição, nunca pela situação observada escolhida.
      setMessage(NEUTRAL_CHEERS[ledger.length%NEUTRAL_CHEERS.length]);
      const nextQueue=extra?[...queue.slice(0,index+1),extra,...queue.slice(index+1)]:queue;
      if(extra)setQueue(nextQueue);
      setIndex(index+1);
      if(index+1>=nextQueue.length)setPhase("report");
    }catch(error){committing.current=false;setMessage(readableError(error));}
  };
  const newSession=()=>{
    if(config&&!window.confirm("Baixou o registro que deseja preservar? Nova sessão descarta os dados da sessão atual."))return;
    abort.current?.abort();Object.values(liveUrls.current).forEach(url=>URL.revokeObjectURL(url));liveUrls.current={};setUrls({});setConfig(null);setQueue([]);setBasePlan([]);setLedger([]);setEvents([]);setDraft(emptyDraft());setEditing(null);setIndex(0);setMessage("");setChecks([false,false,false]);setPhase("prepare");
  };
  const copy=async()=>{try{await navigator.clipboard.writeText(report);setMessage("Registro copiado. Revise antes de inserir no prontuário.");}catch{setMessage("Cópia não disponível neste navegador. Use Baixar texto.");}};
  const exportJson=()=>{if(!config)return;downloadFile(JSON.stringify({schema:"neuroped-recognition-observation-v2",version:VERSION,nature:NATURE,config,plan:basePlan,ledger,report},null,2),"application/json",`reconhecimento-${config.seed}.json`);};
  return <div className={`rv-workspace ${displayAge>=84?"rv-mature":""}`}>
    <header className="rv-hero rv-no-print">
      <div className="rv-hero-copy"><span className="rv-eyebrow"><Eye size={16}/> NEUROPED · AVALIAÇÃO DIRETA</span><h1>Teste de<br/><span>Reconhecimento Visual</span></h1><p>Figuras claras. Uma pergunta de cada vez.<br/>Um registro fiel ao que a criança demonstra.</p><div className="rv-tags"><span>{ITEMS.length} estímulos</span><span>6 categorias</span><span>8 roteiros etários</span></div></div>
      <div className="rv-hero-pictures" aria-hidden="true"><div><Stimulus id="gato"/></div><div><Stimulus id="banana"/></div><div><Stimulus id="carro"/></div><div><Stimulus id="vermelho"/></div></div>
    </header>
    <div className="rv-notice rv-no-print"><ShieldCheck size={19}/><p><strong>Registro observacional · sem normas diagnósticas.</strong> A idade organiza o roteiro, não determina o que a criança é obrigada a saber. Avaliação e assinatura permanecem com o profissional.</p></div>
    {phase==="prepare"&&<div className="rv-tracks rv-no-print" role="tablist" aria-label="Modo de aplicação" data-testid="rv-track-tabs">
      <button type="button" role="tab" aria-selected={easy} className={easy?"":"rv-track-easy"} data-testid="rv-easy-tab" disabled={loading||easyProgress>0} onClick={()=>{setTrack("easy");setMessage("Modo Fácil: informe a idade e toque em Começar. Leia a pergunta, mostre as figuras e a criança toca. Acertou ou errou, o jogo passa sozinho.");}}><strong>🎮 Modo Fácil · joguinho</strong><span>A criança toca na figura e o jogo passa sozinho. Resultado no fim.</span></button>
      <button type="button" role="tab" aria-selected={track==="guided"} disabled={loading||easyProgress>0} onClick={()=>{setTrack("guided");setMessage("");}}><strong>Guia de primeira aplicação</strong><span>Preparar, apresentar e revisar, com conferências passo a passo.</span></button>
      <button type="button" role="tab" aria-selected={direct} disabled={loading||easyProgress>0} onClick={()=>{setTrack("direct");setMessage("Modo direto: sem guia nem conferências de preparo. Informe a idade e inicie. O registro declara que o preparo guiado foi dispensado.");}}><strong>Direto ao teste</strong><span>Aplicadora experiente: idade, modalidade e início imediato.</span></button>
    </div>}
    {easy&&<>
      {message&&<div role="status" className="rv-message rv-no-print">{message}</div>}
      {easyPlan.length===0&&<section className="rv-panel" data-testid="rv-easy-start"><h2><SlidersHorizontal size={21}/> Idade da criança</h2><div className="rv-form-grid">
        <label>Anos completos<input inputMode="numeric" pattern="[0-9]*" aria-label="Anos completos" value={years} maxLength={2} onChange={event=>setYears(event.target.value)} placeholder="Ex.: 4"/></label>
        <label>Meses adicionais<input inputMode="numeric" pattern="[0-9]*" aria-label="Meses adicionais" value={months} maxLength={2} onChange={event=>setMonths(event.target.value)}/></label>
      </div>
      <div className="rv-age-note"><strong>{age===null?"Informe a idade exata para montar o jogo":`Idade informada: ${age} meses · ${band?.label}`}</strong><p>{age===null?"Modo Fácil: a idade define quantas figuras e quantas alternativas. A criança toca; o jogo passa sozinho.":`Modo Fácil: ${easyPlanCount(age)} figuras para reconhecer (“Mostre…”), ${easyPlanSettings(age).choices} alternativas por vez. A criança toca; o jogo passa sozinho.`}</p></div>
      <div className="rv-actions"><button type="button" className="rv-primary" disabled={loading||age===null} onClick={()=>void startEasy()}>{loading?"Carregando as figuras…":"Começar o jogo"}<ChevronRight size={19}/></button></div></section>}
      {easyPlan.length>0&&<EasyGame key={easyPlan[0]?.id} testid="rv-easy" title="Reconhecimento Visual" ageLabel={`${age} meses · ${band?.label??""}`} nature={NATURE} footer="Modo Fácil: reconhecimento por toque na tela (“Mostre…”), até 12 figuras; sem conferências de preparo, nomeação ou pareamento." steps={easySteps} onProgress={setEasyProgress} onRestart={()=>{setEasyPlan([]);}}/>}
    </>}
    {!easy&&<nav className="rv-steps rv-no-print" aria-label="Etapas da aplicação"><span aria-current={phase==="prepare"?"step":undefined}>{direct?"1 · Idade":"1 · Preparar"}</span><ChevronRight size={16}/><span aria-current={phase==="run"?"step":undefined}>2 · Apresentar e registrar</span><ChevronRight size={16}/><span aria-current={phase==="report"?"step":undefined}>3 · Revisar</span></nav>}
    {!easy&&message&&<div role="status" className="rv-message rv-no-print">{message}</div>}
    {!easy&&phase==="prepare"&&direct&&<section className="rv-panel" data-testid="rv-direct-start"><h2><SlidersHorizontal size={21}/> 1. Idade e início</h2><div className="rv-form-grid">
        <label>Anos completos<input inputMode="numeric" pattern="[0-9]*" aria-label="Anos completos" value={years} maxLength={2} onChange={event=>{setYears(event.target.value);setChecks([false,false,false]);}} placeholder="Ex.: 4"/></label>
        <label>Meses adicionais<input inputMode="numeric" pattern="[0-9]*" aria-label="Meses adicionais" value={months} maxLength={2} onChange={event=>{setMonths(event.target.value);setChecks([false,false,false]);}}/></label>
        <label>Modalidade<select aria-label="Modalidade" value={mode} onChange={event=>{setMode(event.target.value as Mode);setExcluded([]);setChecks([false,false,false]);}}>{Object.entries(MODES).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label>
        <label>Alternativas por tela<select aria-label="Alternativas por tela" value={choices} disabled={mode==="nomeacao"} onChange={event=>setChoices(Number(event.target.value) as 2|3|4)}><option value={2}>2 · campo reduzido</option><option value={3}>3 · campo intermediário</option><option value={4}>4 · campo ampliado</option></select></label>
        <label>Tamanho da sessão<select aria-label="Tamanho da sessão" value={count} onChange={event=>setCount(Number(event.target.value))}><option value={6}>Até 6 oportunidades</option><option value={12}>Até 12 oportunidades</option><option value={20}>Até 20 oportunidades</option><option value={100}>Todo o conjunto selecionado</option></select></label>
        <label>Outras figuras na tela<select aria-label="Outras figuras na tela" value={distractors} onChange={event=>setDistractors(event.target.value as Config["distractors"])}><option value="distantes">Categorias distintas quando possível</option><option value="categoria">Mesma categoria</option></select></label>
      </div>
      <div className="rv-age-note"><strong>{age===null?"Informe a idade exata para liberar o início":`Idade informada: ${age} meses · ${band?.label}`}</strong><p>{age===null?"Anos completos e meses adicionais, entre 12 meses e 19 anos e 11 meses.":band?.note}</p></div>
      <details className="rv-details"><summary>Ajustar categorias e figuras desta sessão ({selected.length} selecionadas)</summary>
        <div className="rv-category-grid">{(Object.keys(CATEGORIES) as Category[]).map(category=>{const Icon=icons[category],n=available.filter(item=>item.category===category).length;return <button type="button" key={category} disabled={n===0} aria-pressed={categories.includes(category)&&n>0} onClick={()=>{setCategories(current=>current.includes(category)?current.filter(value=>value!==category):[...current,category]);}}><Icon size={25}/><strong>{CATEGORIES[category]}</strong><span>{n} estímulos neste roteiro</span></button>;})}</div>
        {displayAge>=60&&mode!=="pareamento"&&<label className="rv-check rv-context-check"><input type="checkbox" checked={contexts} onChange={event=>setContexts(event.target.checked)}/><span>Incluir quente/frio e pesado/leve. Li que são inferências contextualizadas, dependentes de repertório; não medem temperatura, massa, força ou sensibilidade. Nunca apresentar calor real.</span></label>}
        <div className="rv-catalog-tools"><label><Search size={18}/><input aria-label="Buscar figura" placeholder="Buscar no conjunto…" value={search} onChange={event=>setSearch(event.target.value)}/></label><span>{selected.length} selecionados</span><button type="button" onClick={()=>setExcluded([])}>Restaurar seleção</button></div>
        <div className="rv-catalog" aria-label="Banco de figuras para revisão do profissional">{shown.map(item=><label className={`rv-catalog-card ${excluded.includes(item.id)?"rv-excluded":""}`} key={item.id}><div className="rv-thumb"><Stimulus id={item.id}/></div><span className="rv-catalog-label"><input type="checkbox" checked={!excluded.includes(item.id)} onChange={()=>toggleItem(item.id)} aria-label={`Usar ${item.label}`}/><strong>{item.label}</strong></span><span className="rv-category-label">{CATEGORIES[item.category]}</span>{item.context&&<span className="rv-context-badge">Contextualizado</span>}</label>)}</div>
        {shown.length===0&&<p className="rv-empty">Nenhuma figura neste filtro. Ajuste categoria, busca ou roteiro.</p>}
      </details>
      <details className="rv-details"><summary>Condições a considerar (opcional)</summary><div className="rv-conditions">{CONDITIONS.map(condition=><label className="rv-check" key={condition}><input type="checkbox" checked={conditions.includes(condition)} onChange={()=>setConditions(current=>current.includes(condition)?current.filter(value=>value!==condition):[...current,condition])}/>{condition}</label>)}</div></details>
      <p className="rv-small">Modo direto: a aplicadora experiente responde pela revisão das figuras, pelo conforto e pela tela. O registro declara que o preparo guiado foi dispensado. Sem nome, foto ou cadastro da criança; dados apenas em memória.</p>
      <div className="rv-actions"><button type="button" className="rv-primary" disabled={loading||selected.length===0} onClick={()=>void start()}>{loading?"Verificando as figuras…":"Iniciar aplicação"}<ChevronRight size={19}/></button>{loading&&<button type="button" onClick={()=>abort.current?.abort()}>Cancelar carregamento</button>}</div>
    </section>}
    {!easy&&phase==="prepare"&&!direct&&<>
      <section className="rv-panel"><h2><SlidersHorizontal size={21}/> 1. Escolha como observar</h2><div className="rv-form-grid">
        <label>Anos completos<input inputMode="numeric" pattern="[0-9]*" aria-label="Anos completos" value={years} maxLength={2} onChange={event=>{setYears(event.target.value);setChecks([false,false,false]);}} placeholder="Ex.: 4"/></label>
        <label>Meses adicionais<input inputMode="numeric" pattern="[0-9]*" aria-label="Meses adicionais" value={months} maxLength={2} onChange={event=>{setMonths(event.target.value);setChecks([false,false,false]);}}/></label>
        <label>Modalidade<select aria-label="Modalidade" value={mode} onChange={event=>{setMode(event.target.value as Mode);setExcluded([]);setChecks([false,false,false]);}}>{Object.entries(MODES).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label>
        <label>Alternativas por tela<select aria-label="Alternativas por tela" value={choices} disabled={mode==="nomeacao"} onChange={event=>setChoices(Number(event.target.value) as 2|3|4)}><option value={2}>2 · campo reduzido</option><option value={3}>3 · campo intermediário</option><option value={4}>4 · campo ampliado</option></select></label>
        <label>Tamanho da sessão<select aria-label="Tamanho da sessão" value={count} onChange={event=>setCount(Number(event.target.value))}><option value={6}>Até 6 oportunidades</option><option value={12}>Até 12 oportunidades</option><option value={20}>Até 20 oportunidades</option><option value={100}>Todo o conjunto selecionado</option></select></label>
        <label>Outras figuras na tela<select aria-label="Outras figuras na tela" value={distractors} onChange={event=>setDistractors(event.target.value as Config["distractors"])}><option value="distantes">Categorias distintas quando possível</option><option value="categoria">Mesma categoria</option></select></label>
      </div><p className="rv-small">Nomeação: não fale o nome antes da resposta. Reconhecimento: leia “Mostre…”. Pareamento: o modelo permanece visível e não comprova conhecimento do significado. Opostos sempre usam os dois estados do mesmo par.</p>
      <details className="rv-details"><summary>Explorar roteiros etários sem definir a idade da criança</summary><div className="rv-band-tabs">{BANDS.map(value=><button type="button" key={value.id} aria-pressed={preview===value.id} onClick={()=>setPreview(value.id)}>{value.label}</button>)}</div></details>
      <div className="rv-age-note"><strong>{age===null?`Prévia: ${previewBand.label} · idade ainda não informada`:`Idade informada: ${age} meses · ${band?.label}`}</strong><p>{band?.note}</p></div>
      </section>
      <section className="rv-panel"><h2><Images size={21}/> 2. Monte um conjunto familiar</h2><p className="rv-small">Escolha categorias e retire figuras duvidosas. A confirmação abaixo é revisão desta aplicação, não validação científica do banco.</p><div className="rv-category-grid">{(Object.keys(CATEGORIES) as Category[]).map(category=>{const Icon=icons[category],n=available.filter(item=>item.category===category).length;return <button type="button" key={category} disabled={n===0} aria-pressed={categories.includes(category)&&n>0} onClick={()=>{setCategories(current=>current.includes(category)?current.filter(value=>value!==category):[...current,category]);setChecks([false,false,false]);}}><Icon size={25}/><strong>{CATEGORIES[category]}</strong><span>{n} estímulos neste roteiro</span></button>;})}</div>
      {displayAge>=60&&mode!=="pareamento"&&<label className="rv-check rv-context-check"><input type="checkbox" checked={contexts} onChange={event=>{setContexts(event.target.checked);setChecks([false,false,false]);}}/><span>Incluir quente/frio e pesado/leve. Li que são inferências contextualizadas, dependentes de repertório; não medem temperatura, massa, força ou sensibilidade. Nunca apresentar calor real.</span></label>}
      <div className="rv-catalog-tools"><label><Search size={18}/><input aria-label="Buscar figura" placeholder="Buscar no conjunto…" value={search} onChange={event=>setSearch(event.target.value)}/></label><span>{selected.length} selecionados</span><button type="button" onClick={()=>{setExcluded([]);setChecks([false,false,false]);}}>Restaurar seleção</button></div>
      <div className="rv-catalog" aria-label="Banco de figuras para revisão do profissional">{shown.map(item=><label className={`rv-catalog-card ${excluded.includes(item.id)?"rv-excluded":""}`} key={item.id}><div className="rv-thumb"><Stimulus id={item.id}/></div><span className="rv-catalog-label"><input type="checkbox" checked={!excluded.includes(item.id)} onChange={()=>toggleItem(item.id)} aria-label={`Usar ${item.label}`}/><strong>{item.label}</strong></span><span className="rv-category-label">{CATEGORIES[item.category]}</span>{item.context&&<span className="rv-context-badge">Contextualizado</span>}</label>)}</div>
      {shown.length===0&&<p className="rv-empty">Nenhuma figura neste filtro. Ajuste categoria, busca ou roteiro.</p>}
      </section>
      <section className="rv-panel"><h2><ClipboardCheck size={21}/> 3. Prepare e comece</h2><div className="rv-conditions">{CONDITIONS.map(condition=><label className="rv-check" key={condition}><input type="checkbox" checked={conditions.includes(condition)} onChange={()=>setConditions(current=>current.includes(condition)?current.filter(value=>value!==condition):[...current,condition])}/>{condition}</label>)}</div><div className="rv-preflight">{PREPARATION.map((text,i)=><label className="rv-check" key={text}><input type="checkbox" checked={checks[i]} onChange={event=>setChecks(current=>current.map((value,j)=>j===i?event.target.checked:value))}/>{text}</label>)}</div><div className="rv-actions"><button type="button" className="rv-primary" disabled={loading||selected.length===0} onClick={()=>void start()}>{loading?"Verificando as figuras…":"Verificar banco e iniciar"}<ChevronRight size={19}/></button>{loading&&<button type="button" onClick={()=>abort.current?.abort()}>Cancelar carregamento</button>}<span className="rv-small">Sem nome, foto ou cadastro da criança. Dados da aplicação apenas em memória.</span></div></section>
    </>}
    {!easy&&phase==="prepare"&&<details className="rv-details rv-hero-picker rv-no-print" data-testid="rv-hero-picker">
      <summary>{hero.emoji} Herói desta aplicação: {hero.name} · opcional, para acompanhar a barra de estrelas</summary>
      <div className="rv-hero-picker-body">
        <HeroGrid current={hero} onPick={setHero} compact/>
        <p className="rv-small">O herói e as estrelas ficam só nesta tela do aplicador: acompanham as oportunidades registradas, não entram no registro nem aparecem na tela virada para a criança.</p>
      </div>
    </details>}
        {phase==="run"&&trial&&target&&config&&<section className="rv-panel rv-run">
      <div className="rv-run-top"><span className="rv-eyebrow">{editing?"CORREÇÃO COM HISTÓRICO":trial.adaptedFrom?"TENTATIVA COMPLEMENTAR":`OPORTUNIDADE ${index+1} DE ${queue.length}`}</span><div className="rv-run-hero" aria-label={`Herói: ${hero.name}`}><span aria-hidden="true">{hero.emoji}</span><StarCounter stars={active.length} label="oportunidades registradas"/></div><button type="button" onClick={()=>{if(editing)leaveEditing();setPhase("report");setMessage("");}}>Revisar registros</button></div>
      <div className="rv-run-grid"><div><div className="rv-operator-preview"><Stimulus id={target.id} urls={urls}/></div><h2>{target.label}</h2><p>{CATEGORIES[target.category]} · {MODES[trial.mode]}</p><p className="rv-small">{target.note}</p>{target.aliases.length>0&&<p className="rv-small">Respostas para contextualizar: {target.aliases.join("; ")}. A classificação é do aplicador, não automática.</p>}</div>
      <div className="rv-instruction"><span className="rv-eyebrow">LEIA ANTES DE VIRAR A TELA</span>{trial.context&&<div className="rv-context"><strong>Primeiro, descreva a cena:</strong><p>{trial.context}</p></div>}<blockquote>{trial.question}</blockquote><p>Aguarde sem ensinar a resposta. Aceite a via comunicativa possível. Não há cronômetro ou correção automática.</p><button type="button" className="rv-primary rv-present" disabled={!!editing} onClick={()=>setStage(true)}><Eye size={23}/>{events.some(event=>event.kind==="apresentado")?"Apresentar novamente · registrar repetição":"Mostrar somente as figuras à criança"}</button><p className="rv-small">{editing?"Uma correção altera o registro, não cria uma nova apresentação.":"A tela da criança esconde nomes, instruções do aplicador e respostas. Todas as figuras desta sessão já foram verificadas e carregadas."}</p>{events.some(event=>event.kind==="interrompido")&&<p className="rv-message">Houve interrupção. Descreva a condição e reapresente quando apropriado; a interrupção ficará no histórico.</p>}</div></div>
      <div className="rv-response"><h3>Depois da apresentação, registre a resposta</h3><p className="rv-small">Toques registrados: {events.filter(event=>event.kind==="toque").map(event=>itemFor(event.itemId!).label).join(" → ")||"nenhum"}. O sistema não transforma ausência de resposta em erro.</p><div className="rv-form-grid">
        <label>Situação observada<select aria-label="Situação observada" value={draft.outcome} onChange={event=>patch({outcome:event.target.value as Draft["outcome"]})}><option value="">Selecione…</option>{Object.entries(OUTCOMES).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label>
        <label>Via da resposta<select aria-label="Via da resposta" value={draft.channel} onChange={event=>patch({channel:event.target.value as Draft["channel"]})}><option value="">Selecione…</option>{Object.entries(CHANNELS).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label>
        <label>Ajuda utilizada<select aria-label="Ajuda utilizada" value={draft.help} onChange={event=>patch({help:event.target.value as Draft["help"]})}>{Object.entries(SUPPORTS).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label>
        <label>Familiaridade com o item<select aria-label="Familiaridade com o item" value={draft.familiarity} onChange={event=>patch({familiarity:event.target.value as Draft["familiarity"]})}><option value="">Selecione…</option><option value="conhecida">Conhecida / referida</option><option value="incerta">Incerta</option><option value="desconhecida">Provavelmente desconhecida</option></select></label>
      </div><label className="rv-wide-label">Resposta literal / forma de comunicação<textarea maxLength={1000} value={draft.literal} onChange={event=>patch({literal:event.target.value})} placeholder="Ex.: disse ‘au-au’; apontou; usou CAA. Não identificar a criança."/></label><label className="rv-wide-label">Ajuda, interferentes ou motivo de não aplicação<textarea maxLength={2000} value={draft.note} onChange={event=>patch({note:event.target.value})} placeholder="Descreva a condição, sem atribuir falha à criança."/></label>
      {editing&&<label className="rv-wide-label">Motivo da correção (obrigatório)<input value={correction} maxLength={1000} onChange={event=>setCorrection(event.target.value)}/></label>}
      <div className="rv-actions"><button type="button" className="rv-primary" onClick={()=>save()}><Check size={19}/>{editing?"Salvar correção com histórico":"Registrar e continuar"}</button>{!editing&&trial.mode==="nomeacao"&&<button type="button" onClick={()=>save(true)}>Registrar e complementar com “Mostre…”</button>}<button type="button" onClick={()=>{patch({outcome:"nao_aplicado",channel:"nenhuma"});setMessage("Descreva o motivo e registre para manter a cobertura correta.");}}>Não aplicar este item</button></div></div>
    </section>}
    {phase==="report"&&config&&<section className="rv-panel"><div className="rv-no-print"><h2><ClipboardCheck size={22}/> Revisão profissional</h2><p>{active.length} {active.length===1?"registro ativo":"registros ativos"} · {ledger.length-active.length} {ledger.length-active.length===1?"versão anterior preservada":"versões anteriores preservadas"}. Sem porcentagem diagnóstica, ponto de corte ou conclusão automática.</p><p className="rv-small">{hero.emoji} {hero.name} acompanhou {active.length} {active.length===1?"oportunidade":"oportunidades"} nesta aplicação. Estrelas registram participação, não entram no registro clínico e não são escore.</p><div className="rv-actions"><button type="button" className="rv-primary" onClick={()=>void copy()}>Copiar registro</button><button type="button" onClick={()=>downloadFile(report,"text/plain;charset=utf-8",`reconhecimento-${config.seed}.txt`)}><Download size={18}/> Baixar texto</button><button type="button" onClick={exportJson}>Baixar JSON com histórico</button><button type="button" onClick={()=>window.print()}>Imprimir</button>{index<queue.length&&<button type="button" onClick={()=>{setPhase("run");setMessage("");}}>Continuar aplicação</button>}<button type="button" onClick={newSession}>Nova sessão</button></div>
      <div className="rv-records">{active.map(record=><div key={record.id}><span><strong>{record.item.label}</strong> · {MODES[record.trial.mode]} · {record.response.outcome?OUTCOMES[record.response.outcome]:"Sem situação"}</span><button type="button" onClick={()=>{pendingBeforeEdit.current={draft:{...draft},events:events.map(event=>({...event}))};setEditing(record);setDraft({...record.response});setEvents(record.events.map(event=>({...event})));setCorrection("");setPhase("run");setMessage("");}}>Corrigir com justificativa</button></div>)}</div></div><pre className="rv-report rv-print-target" aria-label="Registro descritivo">{report}</pre></section>}
    <footer className="rv-footer rv-no-print"><details><summary>Critérios, fontes e direitos das figuras</summary><p>{NATURE} O banco é uma seleção de ilustrações para observação, não um instrumento validado em crianças brasileiras. Registre familiaridade, adequação da imagem e a via de resposta. A dificuldade da figura não pode ser atribuída automaticamente à criança.</p><p>Mulberry Symbols, © 2018–2026 Steve Lee. Figuras sob <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer">CC BY-SA 4.0</a>, com títulos, metadados e inscrições em texto removidos; prato e garrafa com recorte do objeto principal; demais formas preservadas. <a href="./recognition-v2/manifest.json" target="_blank" rel="noreferrer">Manifesto de origem, versões e integridade</a>. Comparações geométricas e manchas de cor: implementação autoral.</p><p>Referências de desenvolvimento: <a href="https://www.cdc.gov/act-early/milestones/30-months.html" target="_blank" rel="noreferrer">CDC · 30 meses</a> e <a href="https://www.cdc.gov/act-early/milestones/4-years.html" target="_blank" rel="noreferrer">CDC · 4 anos</a>. Servem de orientação geral, não normatizam estes itens. Referências de interação: Tactus Therapy e Bitsboard; nenhuma transferência de validação, conteúdo proprietário ou normas.</p></details><span>NeuroPed · Reconhecimento Visual · v{VERSION}</span></footer>
    {stage&&trial&&<TrialStage trial={trial} urls={urls} onEvent={event=>setEvents(current=>[...current,event])} onFinish={()=>setStage(false)}/>}
  </div>;
}
