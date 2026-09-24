import { itemFor, type Item } from "./model";

export function assetUrl(id:string):string { return new URL(`recognition-v2/${encodeURIComponent(id)}.svg`,document.baseURI).href; }
export function Stimulus({id,urls,child=false,onError}:{id:string;urls?:Record<string,string>;child?:boolean;onError?:(id:string)=>void}){
  const item=itemFor(id);
  const label=child?"Figura de avaliação":item.label;
  if(item.art==="symbol") return <img draggable={false} src={urls?.[id] ?? assetUrl(id)} alt={label} className="rv-illustration" onError={()=>onError?.(id)} />;
  if(item.art==="color") return <svg viewBox="0 0 240 220" role="img" aria-label={label} className="rv-illustration"><rect x="35" y="25" width="170" height="170" rx="20" fill={item.color} stroke="var(--rv-art-swatch-outline)" strokeWidth="2"/></svg>;
  return <Opposite item={item} label={label}/>;
}
function Opposite({item,label}:{item:Item;label:string}){
  const first=item.side===0, pair=item.pair;
  return <svg viewBox="0 0 240 220" role="img" aria-label={label} className="rv-illustration">
    {pair==="tamanho" && <g><circle cx="120" cy="110" r={first?72:34} fill="var(--rv-art-ball)" stroke="var(--rv-art-ball-outline)" strokeWidth="3"/><path d={first?"M56 79 Q120 134 184 79 M55 143 Q120 90 185 143":"M91 96 Q120 124 149 96 M91 126 Q120 101 149 126"} fill="none" stroke="var(--rv-art-ball-seam)" strokeWidth="5"/></g>}
    {pair==="comprimento" && <rect x="25" y="89" width={first?190:75} height="42" rx="8" fill="var(--rv-art-ribbon)" stroke="var(--rv-art-ribbon-outline)" strokeWidth="3"/>}
    {pair==="conteudo" && <g><path d="M55 30 H185 L173 192 H67Z" fill="var(--rv-art-glass)" stroke="var(--rv-art-glass-outline)" strokeWidth="4"/>{first && <path d="M62 55 H178 L169 187 H71Z" fill="var(--rv-art-water)"/>}<path d="M55 30 H185" stroke="var(--rv-art-glass-outline)" strokeWidth="4"/></g>}
    {pair==="abertura" && <g><rect x="55" y="20" width="130" height="180" rx="3" fill="var(--rv-art-doorway)" stroke="var(--rv-art-doorway-outline)" strokeWidth="7"/>{first?<g><path d="M57 22 L130 51 V174 L57 198Z" fill="var(--rv-art-door)" stroke="var(--rv-art-wood-outline)" strokeWidth="3"/><circle cx="113" cy="119" r="5" fill="var(--rv-art-handle)"/></g>:<g><rect x="61" y="27" width="118" height="166" fill="var(--rv-art-door)" stroke="var(--rv-art-wood-outline)" strokeWidth="2"/><circle cx="160" cy="115" r="5" fill="var(--rv-art-handle)"/></g>}</g>}
    {pair==="vertical" && <g><rect x="30" y="95" width="180" height="16" rx="4" fill="var(--rv-art-table)"/><path d="M48 110 V195 M192 110 V195" stroke="var(--rv-art-table-legs)" strokeWidth="12"/><circle cx="120" cy={first?66:154} r="27" fill="var(--rv-art-position-ball)" stroke="var(--rv-art-position-outline)" strokeWidth="3"/></g>}
    {pair==="inclusao" && <g><path d="M22 62 H157 V190 H22Z" fill="var(--rv-art-box-interior)" stroke="var(--rv-art-box-outline)" strokeWidth="4"/><path d="M22 62 L42 40 H178 L157 62 M157 190 L178 167 V40" fill="none" stroke="var(--rv-art-box-outline)" strokeWidth="3"/><circle cx={first?87:205} cy="123" r="25" fill="var(--rv-art-counter)" stroke="var(--rv-art-counter-outline)" strokeWidth="3"/></g>}
    {pair==="quantidade" && Array.from({length:first?8:2},(_,i)=><circle key={i} cx={50+(i%4)*46} cy={78+Math.floor(i/4)*62} r="17" fill="var(--rv-art-counter)" stroke="var(--rv-art-counter-outline)" strokeWidth="2"/>)}
    {pair==="altura" && <g><path d="M25 197 H215" stroke="var(--rv-art-baseline)" strokeWidth="3"/><rect x="87" y={first?27:115} width="66" height={first?168:80} rx="5" fill="var(--rv-art-column)" stroke="var(--rv-art-column-outline)" strokeWidth="3"/></g>}
    {pair==="temperatura" && <g><path d="M55 93 H167 V188 H55Z" fill="var(--rv-art-cup)" stroke="var(--rv-art-cup-outline)" strokeWidth="4"/><path d="M169 110 C224 96 224 173 169 166" fill="none" stroke="var(--rv-art-cup-outline)" strokeWidth="8"/><ellipse cx="111" cy="93" rx="55" ry="10" fill="var(--rv-art-water-surface)" stroke="var(--rv-art-cup-outline)" strokeWidth="3"/>{first?<g fill="none" stroke="var(--rv-art-steam)" strokeWidth="5" strokeLinecap="round"><path d="M78 74 C58 56 96 43 78 22"/><path d="M109 72 C87 55 130 39 111 19"/><path d="M141 76 C121 58 161 42 141 23"/></g>:<g fill="var(--rv-art-ice)" stroke="var(--rv-art-ice-outline)" strokeWidth="3"><rect x="68" y="76" width="27" height="27" rx="4" transform="rotate(-15 81 89)"/><rect x="118" y="76" width="29" height="29" rx="4" transform="rotate(12 132 90)"/></g>}</g>}
    {pair==="massa" && <g><path d="M32 68 H191 L210 49 H53Z" fill="var(--rv-art-carton-top)" stroke="var(--rv-art-carton-outline)" strokeWidth="3"/><path d="M32 68 H191 V190 H32Z" fill="var(--rv-art-carton-front)" stroke="var(--rv-art-carton-outline)" strokeWidth="3"/><path d="M191 68 L210 49 V169 L191 190Z" fill="var(--rv-art-carton-side)" stroke="var(--rv-art-carton-outline)" strokeWidth="3"/>{Array.from({length:9},(_,i)=>first?<path key={i} d={`M${48+(i%3)*45} ${83+Math.floor(i/3)*33} l18 -5 16 12 -8 16 -23 -1Z`} fill="var(--rv-art-stone)" stroke="var(--rv-art-stone-outline)" strokeWidth="2"/>:<g key={i} fill="var(--rv-art-cotton)" stroke="var(--rv-art-cotton-outline)" strokeWidth="1.8"><ellipse cx={64+(i%3)*45} cy={96+Math.floor(i/3)*33} rx="19" ry="13"/><circle cx={62+(i%3)*45} cy={89+Math.floor(i/3)*33} r="10"/></g>)}</g>}
  </svg>;
}

/** Load every required local symbol into memory before permitting presentation.
 * No patient data, CDN, remote image search, cache mutation or persistent record.
 */
export async function preloadSymbols(ids:string[],signal:AbortSignal):Promise<Record<string,string>>{
  const urls:Record<string,string>={};
  try{
    for(const id of [...new Set(ids)]){
      const item=itemFor(id);if(item.art!=="symbol")continue;
      const response=await fetch(assetUrl(id),{signal,cache:"force-cache"});
      if(!response.ok)throw new Error(`Não foi possível carregar ${item.label}. Não iniciar a aplicação.`);
      const bytes=await response.arrayBuffer();
      if(!crypto.subtle)throw new Error("É necessária uma conexão segura para verificar o banco visual.");
      const digest=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",bytes))).map(value=>value.toString(16).padStart(2,"0")).join("");
      if(digest!==item.hash)throw new Error(`Versão da figura ${item.label} divergente. Atualize o aplicativo antes de aplicar.`);
      const url=URL.createObjectURL(new Blob([bytes],{type:"image/svg+xml"}));urls[id]=url;
      const image=new Image();image.src=url;await image.decode();
      if(signal.aborted)throw new Error("Carregamento cancelado.");
    }
    return urls;
  }catch(error){Object.values(urls).forEach(url=>URL.revokeObjectURL(url));throw error;}
}
