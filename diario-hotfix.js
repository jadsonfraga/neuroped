(function(){
  function toast(msg){
    const t=document.getElementById('toast');
    if(t){t.textContent=msg;t.classList.add('on');setTimeout(()=>t.classList.remove('on'),2200);}
  }
  function text(){
    const el=document.getElementById('reportContent');
    return el?el.innerText.trim():'';
  }
  function buildMedicalSummary(){
    const base=text();
    if(!base){toast('Abra o relatório primeiro');return;}
    let box=document.getElementById('consultaSummaryBox');
    if(!box){
      box=document.createElement('div');
      box.id='consultaSummaryBox';
      box.className='box';
      box.style.border='2px solid rgba(184,150,62,.65)';
      const report=document.getElementById('report');
      report&&report.prepend(box);
    }
    box.innerHTML='<h3>Preparado para consulta</h3>'+
      '<p><b>Resumo executivo:</b> consolidar os registros recentes de escola, terapias, humor, habilidades e observações familiares.</p>'+
      '<p><b>Evolução observada:</b> revisar habilidades com níveis iniciais e finais no período.</p>'+
      '<p><b>Conquistas:</b> considerar atividades registradas como positivas ou novos avanços funcionais.</p>'+
      '<p><b>Desafios:</b> observar crises, recusa, sono, alimentação, comportamento e dificuldade escolar quando descritos.</p>'+
      '<p><b>Sinais de atenção:</b> piora importante, regressão, risco autolesivo, agressividade intensa, alteração de sono persistente ou perda funcional devem ser discutidos diretamente com a equipe.</p>'+
      '<p><b>Perguntas para a equipe:</b> o plano atual está adequado? Quais metas devem ser priorizadas? Há necessidade de ajuste terapêutico, escolar ou medicamentoso?</p>'+
      '<p class="mini">Complemento gerado automaticamente a partir do diário. Não substitui avaliação profissional.</p>'+
      '<div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn primary" id="copyMedicalSummary">Copiar resumo médico</button><button class="btn secondary" id="printMedicalSummary">Imprimir relatório</button></div>';
    document.getElementById('copyMedicalSummary').onclick=function(){navigator.clipboard&&navigator.clipboard.writeText(box.innerText+'\n\n'+base).then(()=>toast('Resumo médico copiado'),()=>toast('Não foi possível copiar'));};
    document.getElementById('printMedicalSummary').onclick=function(){window.print();};
    toast('Resumo para consulta preparado');
  }
  function addButton(){
    const view=document.getElementById('view-relatorio');
    if(!view||document.getElementById('prepConsultaBtn'))return false;
    const btn=document.createElement('button');
    btn.id='prepConsultaBtn';
    btn.className='btn primary';
    btn.type='button';
    btn.textContent='🩺 Preparar para consulta';
    btn.onclick=buildMedicalSummary;
    const actions=view.querySelector('div[style*="display:flex"]');
    if(actions)actions.prepend(btn);else view.appendChild(btn);
    return true;
  }
  function boot(){let i=0;const t=setInterval(()=>{i++;if(addButton()||i>60)clearInterval(t);},250);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();