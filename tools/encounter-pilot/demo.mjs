import {buildReview,closureState,onePage} from '../../shared/encounter-closure.mjs';
import {scenarios} from './fixtures.mjs';
for (const scenario of scenarios()) {
  const snapshot=await buildReview(scenario.input);
  const closure=closureState(snapshot,{performed:false,paymentStatus:'pending',requiredDocuments:['family','school'],documents:[]});
  console.log(JSON.stringify({scenario:scenario.title,version:snapshot.version,changes:snapshot.changes.length,contrasts:snapshot.contrasts.length,missing:snapshot.missing,safety:snapshot.safety.length,careComplete:closure.careComplete,financePending:closure.financePending,schoolDraft:onePage(snapshot,'school')},null,2));
}
