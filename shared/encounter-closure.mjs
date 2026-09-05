/** NeuroPed SDG — pure projection of the canonical Clinical Core contract.
 * No database, browser persistence, authorization, diagnosis or prescribing.
 * Callers must authenticate, authorize and validate clinicalEventInputSchema
 * before projecting real events. This module is not an access-control boundary.
 */
export const VERSION = '1.0.0-pilot';
const KINDS = new Set(['reported','observed','measured','documented','inferred','decision']);
const TYPES = new Set(['encounter','problem','medication','observation','plan','outcome','safety']);
const SOURCES = new Set(['patient','family','school','therapist','clinician','instrument','laboratory','imaging','eeg','genetics','document','device','system','other']);
const PHASES = ['preparation','consultation','documentation','followup'];
const requiredText = (v, label) => {
  if (typeof v !== 'string' || !v.trim() || v.length > 1000) throw new Error(`INVALID_${label}`);
  return v;
};
export function instant(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/.test(value)) throw new Error('INVALID_TIME');
  const ms = Date.parse(value);
  const day = Date.parse(value.slice(0,10) + 'T00:00:00Z');
  if (!Number.isFinite(ms) || !Number.isFinite(day) || new Date(day).toISOString().slice(0,10) !== value.slice(0,10)) throw new Error('INVALID_TIME');
  return ms;
}
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().filter(k => value[k] !== undefined).map(k => [k, canonical(value[k])]));
  return value;
}
function deepFreeze(value) {
  if (value && typeof value === 'object') { Object.values(value).forEach(deepFreeze); Object.freeze(value); }
  return value;
}
export async function digest(value) {
  const bytes = new TextEncoder().encode(JSON.stringify(canonical(value)));
  const hash = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2,'0')).join('');
}
export async function buildReview({patientId, encounterId, events, since, asOf, complete, requirements = []}) {
  requiredText(patientId, 'PATIENT'); requiredText(encounterId, 'ENCOUNTER');
  const start = instant(since), end = instant(asOf);
  if (start > end || !Array.isArray(events) || events.length > 10000 || typeof complete !== 'boolean') throw new Error('INVALID_SNAPSHOT');
  if (!Array.isArray(requirements) || requirements.some(r => !r || typeof r.required !== 'boolean' || typeof r.received !== 'boolean' || typeof r.label !== 'string')) throw new Error('INVALID_REQUIREMENTS');
  events = structuredClone(events); requirements = structuredClone(requirements);
  const byId = new Map();
  for (const e of events) {
    if (!e || e.patientId !== patientId) throw new Error('PATIENT_SCOPE_MISMATCH');
    requiredText(e.id,'EVENT_ID');
    if (byId.has(e.id)) throw new Error('DUPLICATE_EVENT_ID');
    if (!TYPES.has(e.eventType) || !['active','corrected','voided'].includes(e.status) || !KINDS.has(e.provenance?.kind) || !SOURCES.has(e.provenance?.source) || !e.data || typeof e.data !== 'object') throw new Error('INVALID_EVENT');
    instant(e.occurredAt); instant(e.createdAt);
    if (e.provenance.capturedAt !== undefined) instant(e.provenance.capturedAt);
    byId.set(e.id,e);
  }
  const warnings = [], superseded = new Set(), successors = new Map();
  for (const e of events) {
    if (!e.supersedesEventId) continue;
    if (!byId.has(e.supersedesEventId)) { warnings.push('HISTORICO_DE_CORRECAO_INCOMPLETO'); continue; }
    const visited = new Set([e.id]); let previous = e;
    while (previous?.supersedesEventId) {
      if (visited.has(previous.supersedesEventId)) throw new Error('SUPERSESSION_CYCLE');
      visited.add(previous.supersedesEventId); previous = byId.get(previous.supersedesEventId);
    }
    if (successors.has(e.supersedesEventId)) throw new Error('SUPERSESSION_FORK');
    successors.set(e.supersedesEventId,e.id);
    if (instant(e.createdAt) <= end) superseded.add(e.supersedesEventId);
  }
  if (events.some(e => instant(e.createdAt)>end || instant(e.occurredAt)>end)) warnings.push('EVENTOS_FUTUROS_EXCLUIDOS');
  if (!complete) warnings.push('FONTE_PAGINADA_OU_INCOMPLETA');
  const active = events.filter(e => e.status === 'active' && !superseded.has(e.id) && instant(e.createdAt)<=end && instant(e.occurredAt)<=end)
    .sort((a,b) => instant(b.occurredAt)-instant(a.occurredAt) || a.id.localeCompare(b.id));
  if (!active.some(e=>e.eventType==='encounter' && e.encounterId===encounterId)) warnings.push('REGISTRO_DO_ATENDIMENTO_AUSENTE');
  const changes = active.filter(e => instant(e.createdAt)>start || instant(e.occurredAt)>start);
  const observations = active.filter(e => e.encounterId === encounterId && e.eventType === 'observation');
  const contrasts = [];
  for (let i=0;i<observations.length;i++) for (let j=i+1;j<observations.length;j++) {
    const a=observations[i], b=observations[j];
    if (a.data.domain === b.data.domain && a.provenance.source !== b.provenance.source &&
      [a.data.findingStatus,b.data.findingStatus].sort().join('|') === 'absent|present') contrasts.push({domain:a.data.domain,eventIds:[a.id,b.id],label:'Diferença entre fontes/contextos; requer interpretação, não diagnóstico automático.'});
  }
  const safety = active.filter(e => (e.eventType === 'safety' && e.data.status !== 'resolved') || (e.eventType === 'observation' && e.data.redFlag === true));
  const missing = requirements.filter(r => r.required && !r.received).map(r => r.label);
  const unassessed = observations.filter(e => ['unknown','not_assessed'].includes(e.data.findingStatus));
  const plans = active.filter(e => e.eventType === 'plan' && e.encounterId === encounterId && e.provenance.kind === 'decision' && e.provenance.source === 'clinician' && ['planned','in_progress'].includes(e.data.status));
  const version = await digest({patientId,encounterId,since,complete,requirements,events:[...events].sort((a,b)=>a.id.localeCompare(b.id)),included:active.map(e=>e.id)});
  return deepFreeze({version,patientId,encounterId,asOf,active,changes,contrasts,safety,missing,unassessed,plans,warnings:[...new Set(warnings)],readyForReview:complete && warnings.length===0 && missing.length===0});
}
/** Required-document scope must come from the professional's explicit decision. */
export function closureState(snapshot, evidence) {
  if (!snapshot || !evidence || !Array.isArray(evidence.requiredDocuments) || !evidence.requiredDocuments.length || new Set(evidence.requiredDocuments).size !== evidence.requiredDocuments.length || evidence.requiredDocuments.some(k=>typeof k!=='string' || !k.trim())) throw new Error('INVALID_CLOSURE');
  if (typeof evidence.performed !== 'boolean') throw new Error('INVALID_ATTENDANCE');
  if (!['unknown','pending','partial','paid','waived'].includes(evidence.paymentStatus)) throw new Error('INVALID_PAYMENT_STATE');
  const queue = [];
  if (!evidence.performed) queue.push({owner:'operations',code:'ATTENDANCE',label:'Confirmar atendimento realizado; agendamento não comprova atendimento.'});
  for (const label of snapshot.missing) queue.push({owner:'operations',code:'MISSING_SOURCE',label});
  for (const label of snapshot.warnings) queue.push({owner:'operations',code:'INCOMPLETE_SOURCE',label});
  const review = evidence.review;
  const current = !!review && review.role === 'clinician' && typeof review.actorId === 'string' && !!review.actorId.trim() && review.version === snapshot.version && (()=>{try{return instant(review.at)<=instant(snapshot.asOf) && snapshot.active.every(e=>instant(e.createdAt)<=instant(review.at));}catch{return false;}})();
  if (!current) queue.push({owner:'clinician',code:'REVIEW',label:'Revisão médica da versão atual pendente.'});
  const acknowledged = new Set(current && Array.isArray(review.acknowledgedSafety) ? review.acknowledgedSafety : []);
  if (snapshot.safety.some(e=>!acknowledged.has(e.id))) queue.push({owner:'clinician',code:'SAFETY',label:'Sinalizações registradas exigem avaliação e ciência médica explícita.'});
  if (snapshot.contrasts.length && !(current && review.contrastsAcknowledged === true)) queue.push({owner:'clinician',code:'CONTRASTS',label:'Revisar diferenças entre fontes/contextos.'});
  const documents = evidence.documents ?? [];
  if (!Array.isArray(documents) || new Set(documents.map(d=>d.kind)).size !== documents.length) throw new Error('DUPLICATE_DOCUMENT');
  for (const kind of evidence.requiredDocuments) {
    const doc=documents.find(d=>d.kind===kind);
    const title={family:'Família',school:'Escola',clinician:'Revisão médica'}[kind] || kind;
    const prepared=doc && doc.version===snapshot.version && /^[a-f0-9]{64}$/.test(doc.sha256 ?? '') && doc.visualQa==='passed';
    if (!prepared) queue.push({owner:'operations',code:'DOCUMENT',label:`Preparar e conferir documento: ${title}.`});
    const delivered=prepared && doc.delivery?.evidenceId && doc.delivery?.sha256===doc.sha256 && (()=>{try{return instant(doc.delivery.at)<=instant(snapshot.asOf) && current && instant(doc.delivery.at)>=instant(review.at);}catch{return false;}})();
    if (!delivered) queue.push({owner:'operations',code:'DELIVERY',label:`Registrar prova de entrega da versão aprovada: ${title}.`});
  }
  const careComplete = queue.length === 0 && snapshot.readyForReview;
  const financePending = ['unknown','pending','partial'].includes(evidence.paymentStatus);
  return {careComplete,financePending,financialStatus:evidence.paymentStatus,queue,financeQueue:financePending ? [{owner:'finance',code:'RECONCILE',label:'Conferir recebimento; isso não bloqueia entrega assistencial.'}] : []};
}
export function onePage(snapshot, audience) {
  if (!['family','school','clinician'].includes(audience)) throw new Error('INVALID_AUDIENCE');
  const selected = snapshot.plans.filter(e => audience !== 'school' || e.data.kind === 'school');
  const rows = ['NEUROPED SDG | RASCUNHO PARA REVISÃO',`Destinatário: ${{family:'Família',school:'Escola',clinician:'Revisão médica'}[audience]}`,`Versão da base: ${snapshot.version}`,''];
  for (const e of selected) {
    rows.push(e.data.target,`Fonte: decisão médica registrada | Evento: ${e.id} | Data: ${e.occurredAt}`);
    if (e.data.responsibleRole) rows.push(`Responsável informado: ${e.data.responsibleRole}`);
    if (e.data.dueAt) rows.push(`Prazo informado: ${e.data.dueAt}`);
    if (e.data.successCriterion) rows.push(`Critério informado: ${e.data.successCriterion}`);
    rows.push('');
  }
  if (!selected.length) rows.push('Não há plano decidido e registrado para esta saída. Nenhuma orientação foi criada.');
  if (audience==='clinician') rows.push(`Novos registros: ${snapshot.changes.length}. Diferenças entre fontes: ${snapshot.contrasts.length}. Sinalizações: ${snapshot.safety.length}.`,`Pendências: ${snapshot.missing.join('; ') || 'nenhuma exigência pendente na lista fornecida'}.`);
  rows.push('Documento não assinado. Conferir destinatário, conteúdo e versão antes de emitir.');
  return rows.join('\n');
}
export function effectiveRate({netReceivedCents, minutes}) {
  if (!minutes || typeof minutes !== 'object') throw new Error('INVALID_MINUTES');
  const values=PHASES.map(k=>minutes[k]);
  for (const v of values) if (v!=null && (typeof v!=='number' || !Number.isFinite(v) || v<0)) throw new Error('INVALID_MINUTES');
  if (netReceivedCents!=null && (!Number.isSafeInteger(netReceivedCents) || netReceivedCents<0)) throw new Error('INVALID_AMOUNT');
  const complete=values.every(v=>v!=null), total=complete ? values.reduce((a,b)=>a+b,0) : null;
  const admin=[minutes.preparation,minutes.documentation,minutes.followup];
  return {totalMinutes:total,adminMinutes:admin.every(v=>v!=null)?admin.reduce((a,b)=>a+b,0):null,rateCentsPerHour:total>0 && netReceivedCents!=null ? netReceivedCents*60/total : null};
}
export function aggregateMetrics(rows) {
  const measured=rows.map(r=>({...r,...effectiveRate(r)}));
  const rateRows=measured.filter(r=>r.totalMinutes>0 && r.netReceivedCents!=null);
  const rateMinutes=rateRows.reduce((n,r)=>n+r.totalMinutes,0);
  const adminRows=measured.filter(r=>r.adminMinutes!=null);
  return {count:rows.length,rateSample:rateRows.length,adminSample:adminRows.length,
    rateCentsPerHour:rateMinutes?rateRows.reduce((n,r)=>n+r.netReceivedCents,0)*60/rateMinutes:null,
    meanAdminMinutes:adminRows.length?adminRows.reduce((n,r)=>n+r.adminMinutes,0)/adminRows.length:null};
}
