import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { useClinic } from "@/contexts/ClinicContext";
import { authFetch } from "@/lib/authClient";
import { EscutaRecorder, base64Audio, decodeAudioFile, wavChunks, type RecordingState } from "@/lib/escutaRecorder";
import { ESCUTA_VERSION, SECTION_LABELS, noteText, type EscutaNote } from "@shared/escuta/core";
import "@/styles/escuta-clinica.css";

const FIXTURE = "Consulta fictícia QA-001. Médico: a criança tem sete anos. Responsável: a escola relata distração há oito meses. Andou com treze meses e falou as primeiras palavras com dezoito meses. Nunca perdeu habilidades. Não lembro o nome nem a concentração do medicamento. O relatório escolar está pendente. Médico: o diagnóstico ainda está em investigação. Não descrevi exame físico e não indiquei mudança de medicação.";
interface HistoryItem { id: string; updatedAt: string; version: { content: { title?: string; escutaVersion?: string; transcript?: string; note?: EscutaNote } } }
export default function EscutaClinicaPage() {
  const { activeClinicId } = useClinic();
  const [state,setState] = useState<RecordingState>("idle"); const [seconds,setSeconds] = useState(0); const [level,setLevel] = useState(0);
  const [transcript,setTranscript] = useState(""); const [note,setNote] = useState<EscutaNote|null>(null); const [reviewed,setReviewed] = useState(false);
  const [ack,setAck] = useState(false); const [busy,setBusy] = useState(false); const [message,setMessage] = useState(""); const [progress,setProgress] = useState("");
  const [ready,setReady] = useState(false); const [audioUrl,setAudioUrl] = useState(""); const [patientId,setPatientId] = useState("");
  const [patients,setPatients] = useState<Array<{ id: string; name: string }>>([]); const [history,setHistory] = useState<HistoryItem[]>([]);
  const recorder = useRef<EscutaRecorder|null>(null); const controller = useRef<AbortController|null>(null); const transcribed = useRef(new Map<number,string>()); const documentId = useRef<string|null>(null);
  const mounted = useRef(true); const inFlight = useRef(false);
  const active = state === "recording" || state === "paused" || state === "requesting";
  useEffect(()=> {
    mounted.current = true; const chunks = transcribed.current; recorder.current = new EscutaRecorder((s,t,v)=>{if(mounted.current){setState(s);setSeconds(t);setLevel(v);}});
    return ()=>{ mounted.current=false; controller.current?.abort(); recorder.current?.destroy(); chunks.clear(); };
  },[]);
  useEffect(()=>()=>{if(audioUrl) URL.revokeObjectURL(audioUrl);},[audioUrl]);
  useEffect(()=> {
    const warn = (event: BeforeUnloadEvent)=>{if(active || transcript || recorder.current?.parts.length){event.preventDefault();}};
    const hidden = ()=>{if(document.hidden && active) setMessage("A captura pode ser interrompida em segundo plano ou com a tela bloqueada. Mantenha esta aba visível e confira o áudio ao retornar.");};
    window.addEventListener("beforeunload",warn); document.addEventListener("visibilitychange",hidden);
    return ()=>{window.removeEventListener("beforeunload",warn);document.removeEventListener("visibilitychange",hidden);};
  },[active,transcript]);
  useEffect(()=> {
    const c = new AbortController(); setReady(false); setPatients([]); setPatientId(""); setHistory([]);
    if (!activeClinicId) return ()=>c.abort();
    void authFetch(`/api/live/escuta?clinicId=${encodeURIComponent(activeClinicId)}`,{signal:c.signal,cache:"no-store"}).then(async r=>{const b=await r.json();if(!c.signal.aborted){setReady(Boolean(r.ok && b.configured && b.enabled)); if(!r.ok) setMessage(b.error || "Serviço indisponível.");}}).catch(()=>{if(!c.signal.aborted)setMessage("Não foi possível verificar o processamento online.");});
    void authFetch(`/api/live/patients?clinicId=${encodeURIComponent(activeClinicId)}`,{signal:c.signal,cache:"no-store"}).then(async r=>{if(r.ok){const b=await r.json();if(!c.signal.aborted)setPatients(b.data || []);}}).catch(()=>undefined);
    return ()=>c.abort();
  },[activeClinicId]);
  async function task(work: ()=>Promise<void>) {
    if(inFlight.current) return; inFlight.current=true; setBusy(true);setMessage("");controller.current=new AbortController();
    try {await work();} catch(error) {if(mounted.current)setMessage(error instanceof Error?error.message:"Operação indisponível.");}
    finally {inFlight.current=false;if(mounted.current){setBusy(false);setProgress("");}}
  }
  async function post(path: string,body: Record<string,unknown>) {
    const r=await authFetch(path,{method:"POST",body:JSON.stringify(body),signal:controller.current?.signal,cache:"no-store"});
    const data=await r.json().catch(()=>({error:"Resposta inválida do servidor."}));
    if(!r.ok){const error=new Error(data.error || `Falha HTTP ${r.status}`) as Error & {code?:string};error.code=data.code;throw error;}return data;
  }
  function clearDraft() {setNote(null);setReviewed(false);documentId.current=null;}
  async function generate(text: string) {
    if(!ready || !ack) throw new Error("O processamento precisa estar habilitado e autorizado.");
    setNote(null); setReviewed(false); documentId.current=null;
    setProgress("Organizando a anamnese a partir da transcrição…");
    const result=await post("/api/live/escuta",{clinicId:activeClinicId,action:"generate",transcript:text,recordingAcknowledged:ack});
    if(mounted.current){setNote(result.note);setReviewed(false);setMessage("Rascunho gerado. Confira as informações e suas fontes antes de revisar.");}
  }
  async function processAudio() {
    if(!ready || !ack) throw new Error("Processamento não habilitado/autorizado.");
    const parts=recorder.current?.parts || []; if(!parts.length)throw new Error("Nenhum áudio capturado.");
    let index=0; let elapsed=0; const total=Math.ceil(parts.reduce((n,p)=>n+p.length,0)/16000/60);
    for(const bytes of wavChunks(parts)) {
      if(controller.current?.signal.aborted)throw new Error("Processamento cancelado. Áudio preservado na aba.");
      if(!transcribed.current.has(index)) {
        setProgress(`Transcrevendo trecho ${index+1} de ${total}…`);
        try {const result=await post("/api/live/escuta",{clinicId:activeClinicId,action:"transcribe",audio:base64Audio(bytes),recordingAcknowledged:ack});transcribed.current.set(index,`[${String(Math.floor(elapsed/60)).padStart(2,"0")}:${String(Math.floor(elapsed%60)).padStart(2,"0")}] ${result.transcript}`);}
        catch(error){if((error as Error & {code?:string}).code === "NO_SPEECH")transcribed.current.set(index,"[Trecho sem fala reconhecida; conferir no áudio]");else throw error;}
      }
      elapsed+=(bytes.length-44)/32000;index++;setTranscript(Array.from(transcribed.current.entries()).sort((a,b)=>a[0]-b[0]).map(([_i,t])=>t).join("\n"));
    }
    const text=Array.from(transcribed.current.entries()).sort((a,b)=>a[0]-b[0]).map(([_i,t])=>t).join("\n");
    if(Array.from(transcribed.current.values()).every(t=>t.startsWith("[Trecho sem fala")))throw new Error("Nenhuma fala foi reconhecida. Anamnese não gerada.");
    await generate(text);
  }
  function audioBlob(): Blob {
    const chunks=Array.from(wavChunks(recorder.current?.parts || [])); if(!chunks.length)throw new Error("Áudio ausente.");
    const header=chunks[0].slice(0,44);const size=chunks.reduce((n,c)=>n+c.length-44,0);const v=new DataView(header.buffer);v.setUint32(4,size+36,true);v.setUint32(40,size,true);
    return new Blob([header,...chunks.map(c=>c.subarray(44))] as BlobPart[],{type:"audio/wav"});
  }
  function previewAudio() {if(recorder.current?.parts.length)setAudioUrl(URL.createObjectURL(audioBlob()));}
  function download(contents: BlobPart,ext: string,type: string) {const url=URL.createObjectURL(new Blob([contents],{type}));const a=document.createElement("a");a.href=url;a.download=`escuta-clinica.${ext}`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  async function loadHistory() {
    if(!patientId)throw new Error("Escolha um paciente.");
    const r=await authFetch(`/api/live/documents?clinicId=${encodeURIComponent(activeClinicId || "")}&patientId=${encodeURIComponent(patientId)}`,{signal:controller.current?.signal,cache:"no-store"});const b=await r.json();if(!r.ok)throw new Error(b.error || "Histórico indisponível.");setHistory((b.data || []).filter((d: HistoryItem)=>d.version?.content?.escutaVersion===ESCUTA_VERSION));
  }
  return <div className="escuta-page">
    <header className="escuta-header"><div><small>NEUROPED SDG · DOCUMENTAÇÃO CLÍNICA</small><h1>Escuta Clínica</h1><p>Converse. Confira a transcrição. Revise a anamnese.</p></div><span className={`escuta-status ${ready?"is-ready":""}`}>{ready?"Processamento habilitado":"Processamento não habilitado"}</span></header>
    <aside className="escuta-notice">Piloto em validação. Use somente dados fictícios ou anonimizados. A gravação fica na memória desta aba; ao processar, o áudio é enviado à Cloudflare Workers AI. Não há gravação oculta nem assinatura automática.</aside>
    {!activeClinicId && <p role="alert">Selecione uma clínica autenticada no menu. <Link href="/login">Acessar conta</Link></p>}
    <div className="escuta-grid"><section className="escuta-card no-print"><h2>1. Capturar a conversa</h2>
      <label className="escuta-check"><input type="checkbox" checked={ack} disabled={active||busy} onChange={e=>setAck(e.target.checked)}/> Confirmo autorização para gravar e processar esta conversa.</label>
      <div className="escuta-recorder"><div className="escuta-time">{String(Math.floor(seconds/60)).padStart(2,"0")}:{String(Math.floor(seconds%60)).padStart(2,"0")}</div><progress aria-label="Nível real do microfone" max={1} value={level}/><p>{({idle:"Pronto para gravar",requesting:"Solicitando microfone",recording:"Gravando",paused:"Pausado",stopped:"Gravação encerrada"})[state]}</p></div>
      <div className="escuta-actions"><button disabled={!ack||active||busy} onClick={()=>void task(async()=>{if(recorder.current?.parts.length && !window.confirm("Descartar o áudio anterior e iniciar nova gravação?"))return;clearDraft();setTranscript("");transcribed.current.clear();setAudioUrl("");await recorder.current?.start();})}>🎙 Iniciar gravação</button><button disabled={busy||!(state==="recording"||state==="paused")} onClick={()=>state==="paused"?recorder.current?.resume():recorder.current?.pause()}>{state==="paused"?"Retomar":"Pausar"}</button><button disabled={busy||!(state==="recording"||state==="paused")} onClick={()=>void task(async()=>{await recorder.current?.stop();previewAudio();})}>Finalizar</button></div>
      <p className="escuta-help">Limite configurado: 60 minutos; mantenha a aba visível. Validação de consulta longa e hardware ainda pendente. Contador derivado das amostras de áudio, não de uma animação.</p>
      <label className="escuta-upload">Ou abrir arquivo de áudio (até 25 MB)<input type="file" accept="audio/*" disabled={active||busy} onChange={e=>{const f=e.target.files?.[0];if(f)void task(async()=>{if(recorder.current?.parts.length&&!window.confirm("Substituir o áudio atual?"))return;const parts=await decodeAudioFile(f);if(recorder.current){recorder.current.parts=parts;recorder.current.state="stopped";}setState("stopped");setSeconds(parts.reduce((n,p)=>n+p.length,0)/16000);transcribed.current.clear();setTranscript("");clearDraft();previewAudio();});e.target.value="";}}/></label>
      {audioUrl && <audio aria-label="Conferir áudio capturado" controls src={audioUrl}/>}
      {seconds>60&&<p className="escuta-help">Áudio segmentado em blocos válidos de até 60 segundos para processamento. A reprodução permite conferir a gravação completa.</p>}
      <div className="escuta-actions"><button disabled={active||busy||!ready||!ack||!seconds} onClick={()=>void task(processAudio)}>Transcrever e gerar anamnese</button><button disabled={busy||active||!seconds} onClick={()=>download(audioBlob(),"wav","audio/wav")}>Exportar áudio</button></div>
    </section><section className="escuta-card no-print"><h2>2. Conferir a transcrição</h2><p className="escuta-help">Correções no texto invalidam a anamnese anterior. Texto colado é uma entrada alternativa, não teste do microfone.</p><textarea aria-label="Transcrição da consulta" disabled={busy||active} value={transcript} maxLength={60000} onChange={e=>{setTranscript(e.target.value);clearDraft();}} placeholder="A transcrição real aparecerá aqui. Também é possível colar uma conversa anonimizada."/>
      <div className="escuta-actions"><button disabled={busy||active||!ready||!ack||transcript.trim().length<15} onClick={()=>void task(()=>generate(transcript))}>Gerar a partir do texto</button><button disabled={busy||active} onClick={()=>{if((transcript||note)&&!window.confirm("Substituir o rascunho atual pelo exemplo fictício?"))return;setTranscript(FIXTURE);clearDraft();}}>Carregar exemplo fictício</button></div>
    </section></div>
    {busy&&<p role="status" className="escuta-message">{progress||"Processando…"} <button onClick={()=>controller.current?.abort()}>Cancelar processamento</button></p>}{message&&<p role="status" className="escuta-message">{message}</p>}
    {note&&<section className="escuta-card escuta-document"><h2>3. Anamnese para revisão</h2><p>Rascunho sem assinatura · fontes verificáveis não substituem conferência do conteúdo.</p>{Object.entries(SECTION_LABELS).map(([key,label])=>{const section=note.sections.find(s=>s.key===key);return <article key={key}><h3>{label}</h3>{section?<><textarea aria-label={label} disabled={busy} value={section.text} onChange={e=>{setNote({...note,sections:note.sections.map(s=>s.key===key?{...s,text:e.target.value}:s)});setReviewed(false);}}/>{section.uncertain&&<strong>Informação a confirmar</strong>}<details className="no-print"><summary>Ver trechos da transcrição original</summary>{section.quotes.map((q,i)=><blockquote key={`${key}-${i}`}>{q}</blockquote>)}</details></>:<p>Não informado</p>}</article>;})}
      <label className="escuta-check no-print"><input type="checkbox" disabled={busy} checked={reviewed} onChange={e=>setReviewed(e.target.checked)}/> Conferi o conteúdo e as fontes. Qualquer edição exige nova revisão.</label>
      <div className="escuta-actions no-print"><button onClick={()=>download(noteText(note),"txt","text/plain;charset=utf-8")}>Exportar TXT</button><button onClick={()=>download(JSON.stringify({escutaVersion:ESCUTA_VERSION,note,transcript,reviewed,unsigned:true},null,2),"json","application/json")}>Exportar JSON</button><button onClick={()=>window.print()}>Imprimir / PDF</button></div>
      <div className="escuta-actions no-print"><label>Paciente do prontuário<select disabled={busy} value={patientId} onChange={e=>{setPatientId(e.target.value);setHistory([]);documentId.current=null;}}><option value="">Selecione um paciente</option>{patients.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><button disabled={!patientId||busy||!reviewed} onClick={()=>void task(async()=>{const saved=await post("/api/live/documents",{clinicId:activeClinicId,patientId,documentId:documentId.current,documentType:"clinical_note",origin:"clinician",status:"draft",familyVisibility:false,content:{title:"Escuta Clínica — anamnese",escutaVersion:ESCUTA_VERSION,note,transcript,reviewedAt:new Date().toISOString(),recordingAcknowledged:ack}});documentId.current=saved.id;setMessage("Rascunho salvo no prontuário clínico com a proteção já existente. Não publicado à família.");})}>Salvar rascunho revisado</button><button disabled={!patientId||busy} onClick={()=>void task(loadHistory)}>Consultar histórico</button></div>
      {history.map(item=><p key={item.id} className="no-print">{new Date(item.updatedAt).toLocaleString("pt-BR")} <button disabled={busy} onClick={()=>{if(!window.confirm("Abrir esta versão e substituir o rascunho atual?"))return;setTranscript(item.version.content.transcript||"");setNote(item.version.content.note||null);documentId.current=item.id;setReviewed(false);}}>Abrir versão</button></p>)}
    </section>}
    <footer className="escuta-help no-print">O áudio não é salvo automaticamente. Fechar ou recarregar a aba descarta o áudio e o rascunho não salvo. Falha de processamento preserva os trechos na aba para nova tentativa. Nenhum diagnóstico ou medicamento é acrescentado automaticamente.</footer>
  </div>;
}
