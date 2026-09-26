import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Stimulus } from "./Stimulus";
import { itemFor, type StageEvent, type Trial } from "./model";

export default function TrialStage({trial,urls,onEvent,onFinish,autoFinishOnTap=false}:{trial:Trial;urls:Record<string,string>;onEvent:(event:StageEvent)=>void;onFinish:()=>void;autoFinishOnTap?:boolean}){
  const ref=useRef<HTMLDialogElement>(null);
  const handlers=useRef({onEvent,onFinish});handlers.current={onEvent,onFinish};
  const closed=useRef(false),failed=useRef(new Set<string>()),presented=useRef<string|null>(null);
  const [selected,setSelected]=useState<string|null>(null),[broken,setBroken]=useState(false);
  const event=(kind:StageEvent["kind"],itemId?:string,detail?:string)=>handlers.current.onEvent({kind,at:new Date().toISOString(),itemId,detail});
  const finish=(interrupted=false)=>{
    if(closed.current)return;closed.current=true;
    event(interrupted?"interrompido":"encerrado",undefined,interrupted?"A janela ficou oculta durante a apresentação.":"Aplicador encerrou a apresentação.");
    ref.current?.close();handlers.current.onFinish();
  };
  useEffect(()=>{
    const dialog=ref.current;
    closed.current=false;failed.current.clear();
    dialog?.showModal();
    if(presented.current!==trial.id){
      presented.current=trial.id;
      handlers.current.onEvent({kind:"apresentado",at:new Date().toISOString()});
    }
    const visibility=()=>{if(document.hidden){
      if(closed.current)return;closed.current=true;
      handlers.current.onEvent({kind:"interrompido",at:new Date().toISOString(),detail:"Apresentação interrompida: janela oculta."});
      dialog?.close();handlers.current.onFinish();
    }};
    document.addEventListener("visibilitychange",visibility);
    return()=>{document.removeEventListener("visibilitychange",visibility);dialog?.close();};
  },[trial.id]);
  const error=(id:string)=>{if(failed.current.has(id))return;failed.current.add(id);setBroken(true);event("erro-imagem",id,"Falha no desenho: não interpretar como desempenho infantil.");};
  const target=itemFor(trial.targetId);
  return createPortal(<dialog ref={ref} className="rv-child-dialog" aria-label="Apresentação de figuras" onCancel={e=>{e.preventDefault();finish();}}>
    <div className="rv-child-toolbar"><button type="button" onClick={()=>finish()}>← Voltar ao aplicador</button><span>Olhar com calma</span></div>
    {broken?<div className="rv-child-error" role="alert"><p>Não foi possível mostrar as figuras.</p><button type="button" onClick={()=>finish()}>Voltar ao aplicador</button></div>:<div className={`rv-child-content ${trial.mode==="pareamento"?"rv-with-model":""}`}>
      {trial.mode==="pareamento" && <div className="rv-model" aria-label="Modelo que permanece visível"><Stimulus id={trial.targetId} urls={urls} child onError={error}/></div>}
      <div className={`rv-child-grid rv-options-${trial.optionIds.length}`}>
        {trial.optionIds.map((id,index)=>{
          const nameTarget=trial.mode==="nomeacao" && target.art==="opposite" && id===trial.targetId;
          return trial.mode==="nomeacao"?<div key={id} className={`rv-picture ${nameTarget?"rv-naming-target":""}`} aria-label={`Figura ${index+1}${nameTarget?", destacada":""}`}><Stimulus id={id} urls={urls} child onError={error}/></div>:<button key={id} type="button" aria-label={`Selecionar figura ${index+1}`} aria-pressed={selected===id} className={`rv-picture ${selected===id?"rv-chosen":""}`} onClick={()=>{if(broken)return;setSelected(id);event("toque",id);if(autoFinishOnTap)finish();}}><Stimulus id={id} urls={urls} child onError={error}/></button>;
        })}
      </div>
    </div>}
  </dialog>,document.body);
}
