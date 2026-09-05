import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildReview,closureState,onePage,effectiveRate,aggregateMetrics,digest,instant} from '../../shared/encounter-closure.mjs';
import {baseInput,scenarios,event,AS_OF} from '../../tools/encounter-pilot/fixtures.mjs';
const review=()=>buildReview(baseInput());
function evidence(s) {
  return {performed:true,paymentStatus:'pending',requiredDocuments:['family','school'],
    review:{role:'clinician',actorId:'synthetic-clinician',version:s.version,at:AS_OF,acknowledgedSafety:s.safety.map(e=>e.id),contrastsAcknowledged:true},
    documents:['family','school'].map(kind=>({kind,version:s.version,sha256:'a'.repeat(64),visualQa:'passed',delivery:{evidenceId:'synthetic-delivery-'+kind,sha256:'a'.repeat(64),at:AS_OF}}))};
}
test('five synthetic cases are executable',async()=>{for(const c of scenarios()){const s=await buildReview(c.input);assert.match(s.version,/^[a-f0-9]{64}$/);assert.ok(s.active.length);}});
test('source order does not change version',async()=>{const a=baseInput(),b=baseInput();b.events.reverse();assert.equal((await buildReview(a)).version,(await buildReview(b)).version);});
test('input mutation cannot alter signed projection',async()=>{const input=baseInput(),s=await buildReview(input);input.events[0].data.reason='changed';assert.notEqual(s.active.find(e=>e.id==='synthetic-visit').data.reason,'changed');assert.throws(()=>{s.active[0].status='voided';},TypeError);});
test('cross-patient events fail closed',async()=>{const i=baseInput();i.events[0].patientId='synthetic-other';await assert.rejects(buildReview(i),/SCOPE/);});
test('duplicate events fail closed',async()=>{const i=baseInput();i.events.push(i.events[0]);await assert.rejects(buildReview(i),/DUPLICATE/);});
test('missing provenance is rejected',async()=>{const i=baseInput();delete i.events[0].provenance;await assert.rejects(buildReview(i),/INVALID_EVENT/);});
test('invalid calendar day is rejected',()=>assert.throws(()=>instant('2026-02-30T12:00:00Z'),/INVALID_TIME/));
test('reversed review window is rejected',async()=>{const i=baseInput();i.since='2027-01-01T00:00:00Z';await assert.rejects(buildReview(i),/INVALID_SNAPSHOT/);});
test('incomplete pagination never certifies completeness',async()=>{const i=baseInput();i.complete=false;const s=await buildReview(i);assert.equal(s.readyForReview,false);assert.equal(closureState(s,evidence(s)).careComplete,false);});
test('empty clinical base is not ready',async()=>{const i=baseInput();i.events=[];assert.equal((await buildReview(i)).readyForReview,false);});
test('old document newly received appears among changes',async()=>{const s=await buildReview(scenarios()[2].input);assert.ok(s.changes.some(e=>e.id==='synthetic-old-new'));});
test('future event is excluded and flagged',async()=>{const i=baseInput();i.events[0].occurredAt='2027-01-01T00:00:00Z';const s=await buildReview(i);assert.ok(!s.active.some(e=>e.id==='synthetic-visit'));assert.equal(s.readyForReview,false);});
test('context differences are preserved, not resolved automatically',async()=>{const s=await review();assert.equal(s.contrasts.length,1);assert.equal(s.contrasts[0].eventIds.length,2);});
test('different encounters do not create false contrast',async()=>{const i=baseInput();i.events[2].encounterId='synthetic-prior';assert.equal((await buildReview(i)).contrasts.length,0);});
test('unknown is not normality',async()=>{const s=await buildReview(scenarios()[1].input);assert.equal(s.unassessed[0].data.findingStatus,'not_assessed');assert.equal(s.readyForReview,false);});
test('correction supersedes only the earlier event',async()=>{const s=await buildReview(scenarios()[4].input);assert.ok(!s.active.some(e=>e.id==='synthetic-family'));assert.ok(s.active.some(e=>e.id==='synthetic-correction'));});
test('missing correction history blocks readiness',async()=>{const i=scenarios()[4].input;i.events=i.events.filter(e=>e.id!=='synthetic-family');assert.equal((await buildReview(i)).readyForReview,false);});
test('correction cycles are rejected',async()=>{const i=baseInput();i.events[0].supersedesEventId=i.events[1].id;i.events[1].supersedesEventId=i.events[0].id;await assert.rejects(buildReview(i),/CYCLE/);});
test('paid does not prove attendance',async()=>{const s=await review(),e=evidence(s);e.performed=false;e.paymentStatus='paid';assert.equal(closureState(s,e).careComplete,false);});
test('pending finance does not prevent care closure',async()=>{const s=await review(),r=closureState(s,evidence(s));assert.equal(r.careComplete,true);assert.equal(r.financePending,true);assert.equal(r.queue.length,0);});
test('string false cannot prove attendance',async()=>{const s=await review(),e=evidence(s);e.performed='false';assert.throws(()=>closureState(s,e),/INVALID_ATTENDANCE/);});
test('operator cannot substitute clinician approval',async()=>{const s=await review(),e=evidence(s);e.review.role='operator';assert.equal(closureState(s,e).careComplete,false);});
test('new source invalidates prior approval',async()=>{const s=await review(),e=evidence(s),i=baseInput();i.events.push(event('synthetic-new','observation',{domain:'sleep',findingStatus:'unknown'},'family','reported'));const updated=await buildReview(i);assert.notEqual(updated.version,s.version);assert.equal(closureState(updated,e).careComplete,false);});
test('unacknowledged safety remains a clinical task',async()=>{const s=await buildReview(scenarios()[3].input),e=evidence(s);e.review.acknowledgedSafety=[];assert.ok(closureState(s,e).queue.some(t=>t.code==='SAFETY'));});
test('contrasts require current clinician acknowledgment',async()=>{const s=await review(),e=evidence(s);e.review.contrastsAcknowledged=false;assert.ok(closureState(s,e).queue.some(t=>t.code==='CONTRASTS'));});
test('future approval is invalid',async()=>{const s=await review(),e=evidence(s);e.review.at='2027-01-01T00:00:00Z';assert.equal(closureState(s,e).careComplete,false);});
for(const [label,change] of [
 ['missing artifact hash',d=>{d.sha256='';}],['failed visual QA',d=>{d.visualQa='failed';}],
 ['missing delivery evidence',d=>{d.delivery.evidenceId='';}],['delivery hash mismatch',d=>{d.delivery.sha256='b'.repeat(64);}],
 ['old document version',d=>{d.version='old';}],['delivery before review',d=>{d.delivery.at='2026-09-04T00:00:00Z';}],
]) test(label+' prevents false completion',async()=>{const s=await review(),e=evidence(s);change(e.documents[0]);assert.equal(closureState(s,e).careComplete,false);});
test('duplicate document proof is rejected',async()=>{const s=await review(),e=evidence(s);e.documents.push(e.documents[0]);assert.throws(()=>closureState(s,e),/DUPLICATE_DOCUMENT/);});
test('unknown financial status is rejected',async()=>{const s=await review(),e=evidence(s);e.paymentStatus='approved';assert.throws(()=>closureState(s,e),/INVALID_PAYMENT_STATE/);});
test('school output does not leak family-only plan',async()=>{const s=await review(),text=onePage(s,'school');assert.ok(text.includes('atividade'));assert.ok(!text.includes('perguntas da família'));assert.ok(text.includes(s.version));});
test('reported plan is not converted into a decision',async()=>{const i=baseInput();i.events[3].provenance.kind='reported';const s=await buildReview(i);assert.ok(!onePage(s,'school').includes('Registrar um exemplo'));});
test('no content is invented when no plan exists',async()=>{const i=baseInput();i.events=i.events.filter(e=>e.eventType!=='plan');assert.ok(onePage(await buildReview(i),'family').includes('Nenhuma orientação foi criada'));});
test('missing duration is not zero',()=>{const r=effectiveRate({netReceivedCents:80000,minutes:{preparation:10,consultation:45,documentation:null,followup:0}});assert.equal(r.totalMinutes,null);assert.equal(r.rateCentsPerHour,null);});
test('zero duration never divides by zero',()=>{assert.equal(effectiveRate({netReceivedCents:0,minutes:{preparation:0,consultation:0,documentation:0,followup:0}}).rateCentsPerHour,null);});
test('missing receipt is not zero revenue',()=>{assert.equal(effectiveRate({netReceivedCents:null,minutes:{preparation:10,consultation:45,documentation:15,followup:5}}).rateCentsPerHour,null);});
test('75 to 60 minutes increases rate by 25 percent at same net receipt',()=>{const a=effectiveRate({netReceivedCents:80000,minutes:{preparation:10,consultation:45,documentation:15,followup:5}}),b=effectiveRate({netReceivedCents:80000,minutes:{preparation:5,consultation:45,documentation:5,followup:5}});assert.equal(b.rateCentsPerHour/a.rateCentsPerHour,1.25);});
test('pooled rate uses matched rows and weighted time',()=>{const r=aggregateMetrics([{netReceivedCents:80000,minutes:{preparation:10,consultation:45,documentation:15,followup:5}},{netReceivedCents:40000,minutes:{preparation:0,consultation:25,documentation:0,followup:0}},{netReceivedCents:null,minutes:{preparation:0,consultation:200,documentation:0,followup:0}}]);assert.equal(r.rateSample,2);assert.equal(r.rateCentsPerHour,72000);});
test('invalid numerical inputs are rejected',()=>{for(const v of [-1,Infinity,'5',NaN]) assert.throws(()=>effectiveRate({netReceivedCents:1,minutes:{preparation:v,consultation:1,documentation:1,followup:1}}),/INVALID_MINUTES/);});
test('cryptographic digest is stable across key ordering',async()=>assert.equal(await digest({b:2,a:1}),await digest({a:1,b:2})));
test('core has no browser storage, database or network calls',()=>{const src=readFileSync(new URL('../../shared/encounter-closure.mjs',import.meta.url),'utf8');assert.doesNotMatch(src,/localStorage|sessionStorage|indexedDB|fetch\(|XMLHttpRequest|process\.env/);});

test('24-hour time rollover is rejected',()=>assert.throws(()=>instant('2026-09-05T24:00:00Z'),/INVALID_TIME/));
test('review cannot predate received source',async()=>{const s=await review(),e=evidence(s);e.review.at='2026-09-04T00:00:00Z';assert.equal(closureState(s,e).careComplete,false);});
test('invalid required document scope is rejected',async()=>{const s=await review(),e=evidence(s);e.requiredDocuments=[''];assert.throws(()=>closureState(s,e),/INVALID_CLOSURE/);});
test('forked corrections are rejected',async()=>{const i=scenarios()[4].input;i.events.push({...i.events.at(-1),id:'synthetic-fork'});await assert.rejects(buildReview(i),/SUPERSESSION_FORK/);});
