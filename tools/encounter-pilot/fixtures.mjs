// Entirely synthetic cases; never import real patients into this harness.
export const AS_OF = '2026-09-05T18:00:00Z';
export const SINCE = '2026-09-01T00:00:00Z';
export function event(id, eventType, data, source='clinician', kind='decision', extra={}) {
  return {id,patientId:'synthetic-patient-a',encounterId:'synthetic-encounter-a',eventType,data,
    provenance:{kind,source},status:'active',occurredAt:'2026-09-05T14:00:00Z',createdAt:'2026-09-05T14:00:00Z',storageMode:'demo-db',...extra};
}
export function baseInput() {
  return {patientId:'synthetic-patient-a',encounterId:'synthetic-encounter-a',since:SINCE,asOf:AS_OF,complete:true,
    requirements:[{label:'Relato familiar solicitado',required:true,received:true},{label:'Documento escolar solicitado',required:true,received:true}],
    events:[
      event('synthetic-visit','encounter',{encounterType:'followup',reason:'Atendimento inteiramente fictício para homologação.',setting:'clinic'}),
      event('synthetic-family','observation',{domain:'attention',findingStatus:'present',valueText:'Exemplo fictício: dificuldade descrita em casa.'},'family','reported'),
      event('synthetic-school','observation',{domain:'attention',findingStatus:'absent',valueText:'Exemplo fictício: dificuldade não observada na situação descrita.'},'school','documented'),
      event('synthetic-school-plan','plan',{kind:'school',target:'Registrar um exemplo concreto da atividade e do apoio utilizado, conforme decisão fictícia de demonstração.',status:'planned',priority:'routine',responsibleRole:'Equipe escolar',successCriterion:'Devolutiva descritiva na próxima revisão.'}),
      event('synthetic-family-plan','plan',{kind:'education',target:'Organizar as perguntas da família para o próximo encontro, conforme decisão fictícia de demonstração.',status:'planned',priority:'routine',responsibleRole:'Responsável familiar'}),
    ]};
}
export function scenarios() {
  const a=baseInput(), b=baseInput(), c=baseInput(), d=baseInput(), e=baseInput();
  b.requirements[1].received=false;
  b.events=b.events.filter(x=>x.id!=='synthetic-school');
  b.events.push(event('synthetic-unknown','observation',{domain:'sleep',findingStatus:'not_assessed'},'clinician','observed'));
  c.events.push(event('synthetic-old-new','observation',{domain:'communication',findingStatus:'present',valueText:'Documento antigo recebido agora; não representa exame atual.'},'document','documented',{occurredAt:'2026-08-01T12:00:00Z',createdAt:'2026-09-05T15:00:00Z',encounterId:'synthetic-prior-encounter'}));
  d.events.push(event('synthetic-safety','safety',{domain:'other',severity:'high',status:'identified',actionTaken:'Exemplo fictício: encaminhado à revisão médica no ambiente de teste.'},'clinician','observed'));
  e.events.find(x=>x.id==='synthetic-family').status='corrected';
  e.events.push(event('synthetic-correction','observation',{domain:'attention',findingStatus:'unknown',valueText:'Correção fictícia: informação insuficiente.'},'family','reported',{supersedesEventId:'synthetic-family'}));
  return [
    {title:'01 · Fontes e fechamento',input:a},
    {title:'02 · Informação essencial ausente',input:b},
    {title:'03 · Documento antigo recebido agora',input:c},
    {title:'04 · Sinalização para revisão médica',input:d},
    {title:'05 · Correção sem apagar o histórico',input:e},
  ];
}
