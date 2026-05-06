import{r as R,j as i,ar as z,m as O,n as F,F as L,B as J,i as A,at as B,e as E,au as W,R as U,L as P,av as q,o as H,aw as S,ax as V,ay as M,az as _}from"./index-CCN60Z39.js";import{C as G}from"./copy-xOJZIXZ_.js";import{M as Q}from"./mail-BblxXyg_.js";import{S as Y}from"./share-2-D16Kh6PL.js";function X({labels:a,values:h,maxLabel:l="Máx",color:n="#7c3aed",size:d=240}){const g=R.useRef(null);return R.useEffect(()=>{const x=g.current;if(!x||a.length<3)return;const o=x.getContext("2d");if(!o)return;const f=window.devicePixelRatio||1;x.width=d*f,x.height=d*f,x.style.width=`${d}px`,x.style.height=`${d}px`,o.scale(f,f);const c=d/2,b=d/2,m=d*.36,w=a.length,v=2*Math.PI/w,e=-Math.PI/2,y=document.documentElement.classList.contains("dark"),p=y?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.06)",s=y?"rgba(255,255,255,0.6)":"rgba(0,0,0,0.5)";o.clearRect(0,0,d,d);for(let t=1;t<=4;t++){const u=m*t/4;o.beginPath();for(let r=0;r<=w;r++){const N=e+r*v,$=c+u*Math.cos(N),j=b+u*Math.sin(N);r===0?o.moveTo($,j):o.lineTo($,j)}o.closePath(),o.strokeStyle=p,o.lineWidth=1,o.stroke()}for(let t=0;t<w;t++){const u=e+t*v;o.beginPath(),o.moveTo(c,b),o.lineTo(c+m*Math.cos(u),b+m*Math.sin(u)),o.strokeStyle=p,o.lineWidth=1,o.stroke()}o.beginPath();for(let t=0;t<w;t++){const u=e+t*v,r=Math.min(100,Math.max(0,h[t]||0))/100,N=c+m*r*Math.cos(u),$=b+m*r*Math.sin(u);t===0?o.moveTo(N,$):o.lineTo(N,$)}o.closePath(),o.fillStyle=n+"20",o.fill(),o.strokeStyle=n,o.lineWidth=2,o.stroke();for(let t=0;t<w;t++){const u=e+t*v,r=Math.min(100,Math.max(0,h[t]||0))/100,N=c+m*r*Math.cos(u),$=b+m*r*Math.sin(u);o.beginPath(),o.arc(N,$,3.5,0,Math.PI*2),o.fillStyle=n,o.fill(),o.strokeStyle=y?"#1a1a2e":"#fff",o.lineWidth=1.5,o.stroke()}o.font="10px Inter, system-ui, sans-serif",o.fillStyle=s,o.textAlign="center",o.textBaseline="middle";for(let t=0;t<w;t++){const u=e+t*v,r=m+18,N=c+r*Math.cos(u),$=b+r*Math.sin(u),j=a[t].length>14?a[t].slice(0,13)+"…":a[t];o.fillText(j,N,$)}},[a,h,n,d]),a.length<3?null:i.jsx("div",{className:"flex justify-center",children:i.jsx("canvas",{ref:g,style:{width:d,height:d}})})}const T=["#7c3aed","#a855f7","#f59e0b","#fbbf24","#14b8a6","#06b6d4","#ec4899","#f43f5e","#10b981","#8b5cf6"];function K(a,h){const l=document.createElement("canvas");l.style.cssText=`
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 9999;
  `,l.width=window.innerWidth,l.height=window.innerHeight,document.body.appendChild(l);const n=l.getContext("2d");if(!n){document.body.removeChild(l);return}const d=window.innerWidth/2,g=window.innerHeight*.65,x=Array.from({length:60},()=>{const v=Math.PI,e=-Math.PI/2+(Math.random()-.5)*v,y=4+Math.random()*10;return{x:d+(Math.random()-.5)*40,y:g,vx:Math.cos(e)*y,vy:Math.sin(e)*y,rotation:Math.random()*360,rotationSpeed:(Math.random()-.5)*12,size:4+Math.random()*8,color:T[Math.floor(Math.random()*T.length)],shape:Math.random()>.4?"rect":"circle",opacity:1,fadeSpeed:.012+Math.random()*.008}}),o=.3,f=.98;let c;const b=Date.now(),m=2500;function w(){const v=Date.now()-b;if(v>m){cancelAnimationFrame(c),l.parentNode&&l.parentNode.removeChild(l);return}n.clearRect(0,0,l.width,l.height);for(const e of x)e.opacity<=0||(e.vy+=o,e.vx*=f,e.vy*=f,e.x+=e.vx,e.y+=e.vy,e.rotation+=e.rotationSpeed,v>m*.6?e.opacity-=e.fadeSpeed*1.5:(e.opacity=Math.max(0,1-v/(m*3)),e.opacity=1),n.save(),n.globalAlpha=Math.max(0,e.opacity),n.fillStyle=e.color,n.translate(e.x,e.y),n.rotate(e.rotation*Math.PI/180),e.shape==="rect"?n.fillRect(-e.size/2,-e.size/4,e.size,e.size/2):(n.beginPath(),n.arc(0,0,e.size/2,0,Math.PI*2),n.fill()),n.restore());c=requestAnimationFrame(w)}c=requestAnimationFrame(w),setTimeout(()=>{cancelAnimationFrame(c),l.parentNode&&l.parentNode.removeChild(l)},m+500)}const D="jadsonfraga@hotmail.com",C="Aplicado via NeuroPed — App do Dr. Jadson Fraga",Z=`Dr. Jadson Fraga Araújo Júnior — Neuropediatra
CRM-PE 25227 | CRM-BA 23384 | RQE 17756 / 14499 / 13119
Petrolina-PE: Rua Raimundo Lacerda, 1 · Juazeiro-BA: Rua do Paraíso, 409
Tel: (87) 3201-3648 · WhatsApp: (87) 9 9243-2326 | (87) 9 9109-7371 | (87) 8179-8094 · (87) 9 9109-7371 · (87) 8179-8094
www.drjadsonfraga.com · @drjadsonfraganeuroped`,ee="⚠️ Resultado educacional — não substitui consulta presencial.";async function k(a,h,l,n){const d=`[NeuroPed] ${a} — ${new Date().toLocaleDateString("pt-BR")}`;try{if((await H("POST","/api/send-report",{subject:d,body:h})).ok){l(!0),S(),n({title:"✉️ Enviado",description:`Relatório enviado para ${D}`});return}}catch{}try{const g=h.length>3e3?h.slice(0,3e3)+`

[...continua]`:h,x=`https://wa.me/5587992432326?text=${encodeURIComponent(d+`

`+g)}`;window.open(x,"_blank"),l(!0),S(),n({title:"📨 WhatsApp aberto",description:"Envie o relatório pelo WhatsApp para Dr. Jadson."});return}catch{}try{const g=h.length>1800?h.slice(0,1800)+`

[...relatório truncado]`:h,x=`mailto:${D}?subject=${encodeURIComponent(d)}&body=${encodeURIComponent(g)}`;window.open(x,"_blank"),l(!0),n({title:"✉️ Email aberto",description:"Envie pelo seu app de email."})}catch{n({title:"Copie o texto",description:"Use o botão Copiar e cole no email ou WhatsApp.",variant:"destructive"})}}function ae(a){const{scaleName:h,scaleFullName:l,totalScore:n,maxScore:d,classification:g,description:x,domainResults:o,items:f,patientAge:c,patientName:b,completionTime:m}=a,v=new Date().toLocaleDateString("pt-BR",{day:"2-digit",month:"long",year:"numeric"});let e="";e+=`RELATÓRIO DE AVALIAÇÃO CLÍNICA
`,e+=`${C}
`,e+=`${"─".repeat(50)}
`,e+=`Escala: ${h}${l?` (${l})`:""}
`,e+=`Data da aplicação: ${v}
`,b&&(e+=`Paciente: ${b}
`),c&&(e+=`Faixa etária: ${c}
`),m&&(e+=`Tempo de preenchimento: ${m}
`),e+=`
`,e+=`RESULTADO GERAL
`,e+=`Pontuação total: ${n}${d?` de ${d} pontos possíveis`:""}
`,e+=`Classificação: ${g}
`,e+=`Interpretação: ${x}
`,e+=`
`,o&&o.length>0&&(e+=`RESULTADOS POR DOMÍNIO
`,o.forEach(s=>{e+=`- ${s.domain}: ${s.score} pontos — ${s.classification}
`}),e+=`
`),e+=`DETALHAMENTO DAS RESPOSTAS
`,e+=`A seguir, são apresentados todos os itens respondidos na avaliação, com a resposta selecionada e o valor atribuído.

`,f.forEach((s,t)=>{e+=`Item ${t+1}: ${s.question}
`,e+=`  Resposta: ${s.answer} (valor: ${s.value})
`}),e+=`
`,e+=`INTERPRETAÇÃO CLÍNICA DETALHADA

`,e+=`A aplicação da ${h} resultou em uma pontuação total de ${n}`,d&&(e+=` em um total máximo de ${d} pontos`),e+=`, o que corresponde à classificação "${g}". `,e+=`${x}

`,o&&o.length>0&&(e+=`Na análise por domínios, observou-se o seguinte perfil:

`,o.forEach(s=>{e+=`No domínio "${s.domain}", a pontuação obtida foi de ${s.score} pontos, classificada como "${s.classification}". `;const t=s.classification.toLowerCase();t.includes("normal")||t.includes("típic")||t.includes("baixo risco")||t.includes("adequad")?e+="Este resultado sugere funcionamento dentro dos parâmetros esperados para este domínio, sem indicativos de comprometimento significativo. ":t.includes("leve")||t.includes("borderline")||t.includes("limítrofe")||t.includes("risco")?e+="Este resultado sugere a presença de dificuldades leves a moderadas neste domínio, que merecem acompanhamento e reavaliação. Recomenda-se monitorização clínica e eventual encaminhamento para avaliação complementar. ":t.includes("moderado")||t.includes("moder")?e+="Este resultado indica comprometimento moderado neste domínio, sugerindo necessidade de intervenção terapêutica direcionada e acompanhamento especializado. ":(t.includes("grave")||t.includes("alto")||t.includes("clínico")||t.includes("significativ")||t.includes("elevad"))&&(e+="Este resultado indica comprometimento significativo neste domínio, sinalizando necessidade de intervenção imediata e acompanhamento multidisciplinar intensivo. "),e+=`
`}),e+=`
`);const y=f.filter(s=>{const t=Math.max(2,...f.map(u=>u.value));return s.value>=t*.75&&s.value>0});y.length>0&&(e+=`ITENS COM PONTUAÇÃO ELEVADA

`,e+=`Os seguintes itens receberam pontuação elevada, indicando áreas de maior preocupação clínica:

`,y.forEach(s=>{e+=`- "${s.question}" — Resposta: ${s.answer} (${s.value} pontos)
`}),e+=`
`,e+=`Estes itens devem ser considerados prioritariamente no planejamento terapêutico e na orientação aos cuidadores.

`);const p=f.filter(s=>s.value===0);return p.length>0&&p.length<f.length&&(e+=`ÁREAS DE FUNCIONAMENTO PRESERVADO

`,e+=`${p.length} de ${f.length} itens receberam pontuação zero, sugerindo funcionamento preservado nas seguintes áreas:
`,p.slice(0,10).forEach(s=>{e+=`- "${s.question}"
`}),p.length>10&&(e+=`  ... e mais ${p.length-10} itens.
`),e+=`
`),e+=`OBSERVAÇÕES

`,e+="Este relatório foi gerado automaticamente pela plataforma NeuroPed — Escalas de Neuropediatria. ",e+="Os resultados apresentados devem ser interpretados no contexto clínico global do paciente, ",e+="considerando a anamnese, o exame neurológico, os exames complementares e a avaliação multidisciplinar. ",e+=`O diagnóstico clínico não deve se basear exclusivamente em pontuações de escalas.

`,e+=`${ee}

`,e+=`${"─".repeat(50)}
`,e+=`${Z}
`,e}function se(a){const[h,l]=R.useState(!1),[n,d]=R.useState(!1),[g,x]=R.useState(!1),[o,f]=R.useState(!1),{toast:c}=z(),b=R.useRef(!1),m=ae(a);R.useEffect(()=>{b.current||(b.current=!0,setTimeout(()=>K(),300),k(a.scaleName,m,d,c))},[]);async function w(){try{await navigator.clipboard.writeText(m),x(!0),M(),c({title:"Copiado!",description:"Relatório copiado para a área de transferência."}),setTimeout(()=>x(!1),3e3)}catch{c({title:"Erro",description:"Não foi possível copiar. Tente novamente.",variant:"destructive"})}}function v(){const p=window.open("","_blank");if(!p){c({title:"Erro",description:"Não foi possível abrir a janela de impressão. Verifique o bloqueador de pop-ups.",variant:"destructive"});return}const t=new Date().toLocaleDateString("pt-BR",{day:"2-digit",month:"long",year:"numeric"}),u=`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Relatório ${a.scaleName} — ${t}</title>
  <style>
    @page { margin: 2cm; size: A4; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 11pt; line-height: 1.6; color: #1a1a1a; padding: 0; position: relative; }

    /* ── Watermark diagonal ── */
    body::before {
      content: "NeuroPed — Dr. Jadson Fraga © 2026";
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-35deg);
      font-size: 28pt;
      font-weight: bold;
      color: rgba(109, 40, 217, 0.07);
      white-space: nowrap;
      pointer-events: none;
      z-index: 0;
      letter-spacing: 2px;
    }

    /* ── Header ── */
    .header { border-bottom: 3px solid #6d28d9; padding-bottom: 16px; margin-bottom: 20px; display: flex; align-items: flex-start; gap: 14px; }
    .header-text { flex: 1; }
    .header h1 { font-size: 15pt; color: #6d28d9; margin-bottom: 3px; }
    .header .subtitle { font-size: 11pt; color: #444; font-weight: bold; }
    .header .meta { font-size: 9pt; color: #777; margin-top: 6px; }
    .header .crm { font-size: 8.5pt; color: #888; margin-top: 3px; }
    .header-logo { width: 60px; height: 60px; border-radius: 50%; object-fit: cover; border: 2px solid #6d28d9; flex-shrink: 0; }

    /* ── Attribution box ── */
    .attribution { background: #f3f0ff; border: 1px solid #c4b5fd; border-radius: 6px; padding: 8px 12px; margin-bottom: 16px; font-size: 9pt; color: #5b21b6; text-align: center; }

    /* ── Sections ── */
    .section { margin-bottom: 18px; position: relative; z-index: 1; }
    .section h2 { font-size: 11pt; color: #6d28d9; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
    .result-box { background: #f3f0ff; border-left: 4px solid #6d28d9; padding: 12px 16px; border-radius: 4px; margin-bottom: 14px; }
    .result-box .score { font-size: 20pt; font-weight: bold; color: #6d28d9; }
    .result-box .label { font-size: 9pt; color: #555; }
    .result-box .classification { font-size: 12pt; font-weight: bold; color: #1a1a1a; margin-top: 4px; }
    .domain-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .domain-item { background: #faf9ff; border: 1px solid #e5e7eb; border-radius: 4px; padding: 8px 12px; }
    .domain-item .name { font-weight: bold; font-size: 10pt; }
    .domain-item .detail { font-size: 9pt; color: #555; }
    .items-table { width: 100%; border-collapse: collapse; font-size: 9pt; }
    .items-table th { background: #6d28d9; color: white; padding: 6px 10px; text-align: left; }
    .items-table td { padding: 5px 10px; border-bottom: 1px solid #eee; }
    .items-table tr:nth-child(even) { background: #faf9ff; }
    .items-table .high { background: #fef3c7; font-weight: bold; }
    .narrative { text-align: justify; }
    .disclaimer { background: #fffbeb; border: 1px solid #fcd34d; border-radius: 4px; padding: 8px 12px; font-size: 9pt; color: #92400e; margin-top: 10px; }

    /* ── Footer ── */
    .footer { margin-top: 30px; border-top: 2px solid #6d28d9; padding-top: 14px; font-size: 9pt; color: #555; }
    .footer .doc-name { font-size: 12pt; font-weight: bold; color: #1a1a1a; margin-bottom: 4px; }
    .footer .contact-row { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 4px; font-size: 8.5pt; }
    .footer .generated { margin-top: 10px; font-size: 8pt; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 8px; }

    @media print {
      body { padding: 0; }
      body::before { position: fixed; }
    }
  </style>
</head>
<body>
  <!-- Header with Dr. Jadson info -->
  <div class="header">
    <div class="header-text">
      <h1>NeuroPed — Relatório de Avaliação Clínica</h1>
      <div class="subtitle">Escala: ${a.scaleName}${a.scaleFullName?` (${a.scaleFullName})`:""}</div>
      <div class="meta">Data: ${t}${a.patientAge?` | Faixa etária: ${a.patientAge}`:""}${a.patientName?` | Paciente: ${a.patientName}`:""}${a.completionTime?` | Tempo: ${a.completionTime}`:""}</div>
      <div class="crm">Dr. Jadson Fraga Araújo Júnior | CRM-PE 25227 | CRM-BA 23384 | RQE 17756 / 14499 / 13119</div>
    </div>
  </div>

  <!-- Attribution -->
  <div class="attribution">
    <strong>Aplicado via NeuroPed — App do Dr. Jadson Fraga</strong><br>
    www.drjadsonfraga.com · WhatsApp: (87) 9 9243-2326 · (87) 9 9109-7371 · (87) 8179-8094 · @drjadsonfraganeuroped
  </div>

  <div class="section">
    <h2>Resultado Geral</h2>
    <div class="result-box">
      <span class="score">${a.totalScore}</span>
      <span class="label">${a.maxScore?` / ${a.maxScore} pontos`:" pontos"}</span>
      <div class="classification">${a.classification}</div>
    </div>
    <p class="narrative">${a.description}</p>
  </div>

  ${a.domainResults&&a.domainResults.length>0?`
  <div class="section">
    <h2>Resultados por Domínio</h2>
    <div class="domain-grid">
      ${a.domainResults.map(r=>`
        <div class="domain-item">
          <div class="name">${r.domain}</div>
          <div class="detail">${r.score} pts — ${r.classification}</div>
        </div>
      `).join("")}
    </div>
  </div>`:""}

  <div class="section">
    <h2>Detalhamento das Respostas</h2>
    <table class="items-table">
      <thead><tr><th>#</th><th>Item</th><th>Resposta</th><th>Valor</th></tr></thead>
      <tbody>
        ${a.items.map((r,N)=>{const $=Math.max(2,...a.items.map(I=>I.value));return`<tr class="${r.value>=$*.75&&r.value>0?"high":""}"><td>${N+1}</td><td>${r.question}</td><td>${r.answer}</td><td>${r.value}</td></tr>`}).join("")}
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2>Interpretação Clínica</h2>
    <p class="narrative">${a.description}</p>
    ${a.domainResults&&a.domainResults.length>0?`<p class="narrative" style="margin-top:10px;">Na análise por domínios: ${a.domainResults.map(r=>`${r.domain} obteve ${r.score} pontos (${r.classification})`).join("; ")}.`:""}
    <div class="disclaimer">⚠️ Resultado educacional — não substitui consulta presencial com o neuropediatra.</div>
  </div>

  <div class="section">
    <h2>Observações</h2>
    <p class="narrative">Este relatório foi gerado pela plataforma NeuroPed — Escalas de Neuropediatria, ferramenta educacional desenvolvida pelo Dr. Jadson Fraga Araújo Júnior (Neuropediatra — O SuperNeuroPed). Os resultados devem ser interpretados no contexto clínico global do paciente, considerando anamnese, exame neurológico, exames complementares e avaliação multidisciplinar. O diagnóstico clínico não deve se basear exclusivamente em pontuações de escalas.</p>
  </div>

  <!-- Footer with full contact -->
  <div class="footer">
    <div class="doc-name">Dr. Jadson Fraga Araújo Júnior — Neuropediatra</div>
    <div class="contact-row">
      <span>CRM-PE 25227 | CRM-BA 23384 | RQE 17756 / 14499 / 13119</span>
    </div>
    <div class="contact-row">
      <span>📍 Petrolina-PE: Rua Raimundo Lacerda, 1</span>
      <span>📍 Juazeiro-BA: Rua do Paraíso, 409</span>
    </div>
    <div class="contact-row">
      <span>📞 (87) 3201-3648</span>
      <span>💬 WhatsApp: (87) 9 9243-2326 · (87) 9 9109-7371 · (87) 8179-8094</span>
      <span>🌐 www.drjadsonfraga.com</span>
      <span>📷 @drjadsonfraganeuroped</span>
    </div>
    <div class="contact-row">
      <span>💊 Consulta: R$750 (presencial) · Particular</span>
    </div>
    <div class="generated">
      Documento gerado automaticamente pelo app NeuroPed · ${t} · NeuroPed © 2026 — Todos os direitos reservados
    </div>
  </div>
</body>
</html>`;p.document.write(u),p.document.close(),p.onload=()=>{p.print()},V(),c({title:"Impressão",description:"Janela de impressão aberta."})}async function e(){l(!0),await k(a.scaleName,m,d,c),l(!1)}async function y(){const s=new Date().toLocaleDateString("pt-BR",{day:"2-digit",month:"long",year:"numeric"}),t=[`📋 Resultado: ${a.scaleName}`,a.scaleFullName?`(${a.scaleFullName})`:"",a.patientName?`👤 Paciente: ${a.patientName}`:"",a.patientAge?`🎂 Faixa etária: ${a.patientAge}`:"",`📊 Pontuação: ${a.totalScore}${a.maxScore?`/${a.maxScore}`:""} — ${a.classification}`,`📅 Data: ${s}`,a.completionTime?`⏱️ Tempo: ${a.completionTime}`:"","",`${C}`,"www.drjadsonfraga.com · (87) 9 9243-2326"].filter(Boolean).join(`
`);if(_(),typeof navigator<"u"&&navigator.share)try{await navigator.share({title:`NeuroPed — ${a.scaleName}`,text:t}),f(!0),c({title:"Compartilhado!",description:"Resultado compartilhado com sucesso."}),setTimeout(()=>f(!1),3e3);return}catch(u){if(u?.name==="AbortError")return}try{await navigator.clipboard.writeText(t),f(!0),M(),c({title:"Copiado para compartilhar!",description:"Texto copiado. Cole no WhatsApp, email ou onde preferir."}),setTimeout(()=>f(!1),3e3)}catch{c({title:"Não foi possível compartilhar",description:"Tente usar o botão Copiar Texto.",variant:"destructive"})}}return i.jsxs(O,{className:"border-primary/30 bg-gradient-to-br from-primary/5 to-chart-2/5 dark:from-primary/10 dark:to-chart-2/10 relative overflow-hidden",children:[i.jsx("a",{href:"https://www.drjadsonfraga.com",target:"_blank",rel:"noopener noreferrer",className:"absolute bottom-2 right-2 z-10 flex items-center gap-1.5 bg-primary/8 hover:bg-primary/15 border border-primary/15 rounded-full px-2.5 py-1 transition-colors",title:"Dr. Jadson Fraga NeuroPed",children:i.jsx("span",{className:"text-[10px] font-semibold text-primary/60",children:"Dr. Jadson Fraga NeuroPed"})}),i.jsxs(F,{className:"p-5 space-y-4",children:[i.jsxs("div",{className:"flex items-center gap-2",children:[i.jsx(L,{className:"w-5 h-5 text-primary"}),i.jsx("h3",{className:"text-sm font-bold text-foreground",children:"Relatório Clínico Completo"}),n&&i.jsx(J,{className:"text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",children:"Enviado"})]}),i.jsx("div",{className:"flex items-center gap-2 rounded-lg bg-primary/5 border border-primary/15 px-3 py-2",children:i.jsx("span",{className:"text-[11px] text-primary/80 font-medium",children:C})}),a.domainResults&&a.domainResults.length>=3&&i.jsxs("div",{className:"py-2",children:[i.jsx("p",{className:"text-[11px] text-muted-foreground text-center mb-2",children:"Perfil por Domínio"}),i.jsx(X,{labels:a.domainResults.map(p=>p.domain),values:a.domainResults.map(p=>{const s=a.maxScore?a.maxScore/a.domainResults.length:30;return Math.min(100,Math.round(p.score/s*100))}),color:"#7c3aed",size:220})]}),i.jsxs(A,{onClick:v,className:"w-full h-12 gap-3 bg-gradient-to-r from-primary to-chart-2 hover:from-primary/90 hover:to-chart-2/90 text-white shadow-lg shadow-primary/20 text-sm font-semibold","data-testid":"button-print-report",children:[i.jsx(B,{className:"w-5 h-5"}),"Gerar PDF / Imprimir Relatório"]}),i.jsxs("div",{className:"grid grid-cols-3 gap-2",children:[i.jsxs(A,{variant:"outline",size:"sm",onClick:w,className:"gap-1.5 h-9","data-testid":"button-copy-report",children:[g?i.jsx(E,{className:"w-4 h-4 text-emerald-600"}):i.jsx(G,{className:"w-4 h-4"}),g?"Copiado":"Copiar"]}),i.jsxs(A,{variant:"outline",size:"sm",onClick:e,disabled:h||n,className:"gap-1.5 h-9","data-testid":"button-send-email",children:[h?i.jsx(W,{className:"w-4 h-4 animate-spin"}):n?i.jsx(E,{className:"w-4 h-4 text-emerald-600"}):i.jsx(Q,{className:"w-4 h-4"}),h?"Enviando…":n?"Enviado":"Email"]}),i.jsxs(A,{variant:"outline",size:"sm",onClick:y,className:"gap-1.5 h-9","data-testid":"button-share-report",children:[o?i.jsx(E,{className:"w-4 h-4 text-emerald-600"}):i.jsx(Y,{className:"w-4 h-4"}),o?"Feito!":"Compartilhar"]})]}),i.jsxs("p",{className:"text-[10px] text-muted-foreground text-center leading-relaxed bg-muted/40 rounded-lg px-3 py-2",children:["⚠️ ",i.jsx("strong",{children:"Resultado educacional"})," — não substitui consulta presencial com o neuropediatra."]}),i.jsxs("details",{className:"group",children:[i.jsx("summary",{className:"text-xs text-primary cursor-pointer hover:underline",children:"Ver relatório em texto"}),i.jsx("div",{className:"mt-2 max-h-48 overflow-y-auto rounded-lg bg-background/80 border border-border p-3",children:i.jsx("pre",{className:"text-[11px] text-foreground whitespace-pre-wrap font-sans leading-relaxed",children:m})})]}),n&&i.jsx("p",{className:"text-xs text-emerald-600 dark:text-emerald-400 text-center",children:"Relatório enviado para jadsonfraga@hotmail.com"}),i.jsxs("div",{className:"flex gap-2 pt-1",children:[i.jsxs(A,{variant:"outline",size:"sm",className:"flex-1 gap-2 h-9",onClick:()=>window.history.back(),"data-testid":"button-back",children:[i.jsx(U,{className:"w-3.5 h-3.5"}),"Refazer"]}),i.jsx(P,{href:"/",children:i.jsxs(A,{variant:"outline",size:"sm",className:"flex-1 gap-2 h-9","data-testid":"button-home",children:[i.jsx(q,{className:"w-3.5 h-3.5"}),"Início"]})}),i.jsx(P,{href:"/filtro",children:i.jsx(A,{size:"sm",className:"flex-1 gap-2 h-9 bg-gradient-to-r from-primary to-chart-2 text-white","data-testid":"button-goto-filter",children:"Próxima Escala"})})]})]})]})}export{se as C};
