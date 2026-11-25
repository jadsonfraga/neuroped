// Matriz sintética. Sem acesso a pacientes, rede ou banco.
// Audita o motor contra o catálogo inicial do filtro; não imita a busca textual nem a carga do registro mundial.
import { allScales, allScalesComFichas, type ScaleEntry } from "../../client/src/data/scaleFilter.ts";
import { mergeFilterableCatalog } from "../../client/src/data/filterableCatalog.ts";
import { noCostWorldScales } from "../../client/src/data/noCostWorldScales.ts";
import { INTERACTIVE_SCALE_IDS } from "../../client/src/data/interactiveScaleIds.generated.ts";
import { filterScalesWithClinicalRescue, getImplementationStatus, type FilterContext, type RefinedScaleMatch } from "../../client/src/data/advancedFilterLogic.ts";
import { selectCuratedTiers, selectPodiumDetailed, getQuestionCountInfo } from "../../client/src/data/filterPodium.ts";
import { scaleAgeFit } from "../../client/src/data/scaleAgeFit.ts";
const raw = [...mergeFilterableCatalog(allScales), ...noCostWorldScales];
const seen = new Set<string>();
const catalog = raw.filter(scale => {
  if (seen.has(scale.id)) return false;
  seen.add(scale.id);
  return true;
}).filter(s => {
  const route = s.appRoute;
  const dedicated = route && !route.startsWith("/generic-scale/") && route !== "/escalas-neuropsiquiatria" && route !== "/filtro";
  return Boolean(s.applicationMode !== "psicoeducacao" && (dedicated || INTERACTIVE_SCALE_IDS.has(s.id)) && getImplementationStatus(s) === "complete");
});
const stats = {
  registeredCatalog: allScalesComFichas.length,
  actionableBaseCatalog: catalog.length,
  withUnknownVerifiedCount: catalog.filter(s => getQuestionCountInfo(s).count === null).length,
  markedPending: catalog.filter(s => s.pendente_validacao_clinica).length,
  withoutSourceInCatalogFields: catalog.filter(s => !s.fonte && !s.pubmedId).length,
};
const symptoms = [["sono"],["tdah"],["tea"],["dor"],["epilepsia"],["linguagem"],["aprendizagem"],["suicidio"],["psicose"],["tea","sono"],["tdah","aprendizagem"],["autonomia"]];
const ages = [6,15,24,48,66,96,144,192];
const respondents: (ScaleEntry["respondente"][number] | null)[] = [null,"pais","clinico","professor","autoaplicavel"];
let n=0, empty=0, one=0, two=0, three=0, wrongAge=0, wrongRespondent=0, over=0, fallback=0, exclusiveFallback=0;
const examples=new Map();
for(const queixas of symptoms) for(const ageMonths of ages) for(const respondente of respondents){
  const ctx: FilterContext = {queixas,ageMonths,respondente};
  const matches=filterScalesWithClinicalRescue(catalog,ctx);
  const rules=selectCuratedTiers(queixas,ageMonths,new Map(matches.map(m=>[m.scale.id,m])),respondente,null);
  const {podium}=selectPodiumDetailed(matches,rules,{selectedQueixas:queixas,ageMonths});
  const selected=[podium.ouro,podium.prata,podium.bronze].filter((m):m is RefinedScaleMatch=>Boolean(m));
  n++;
  if(selected.length===0) empty++; else if(selected.length===1) one++; else if(selected.length===2) two++; else three++;
  if(selected.some(m=>scaleAgeFit(m.scale,{exactAge:ageMonths,ageBand:null})!=="exact")) wrongAge++;
  if(respondente && selected.some(m=>!m.scale.respondente.includes(respondente))) wrongRespondent++;
  if(selected.reduce((s,m)=>s+(getQuestionCountInfo(m.scale).count??Infinity),0)>100) over++;
  if(selected.some(m=>m.isBroadbandFallback)) fallback++;
  if(selected.length>0&&selected.every(m=>m.isBroadbandFallback)) exclusiveFallback++;
  const key=queixas.join("+")+":"+ageMonths+":"+respondente;
  if(["suicidio:6:null","tea:24:pais","sono:15:pais","aprendizagem:24:professor","tdah+aprendizagem:96:professor","dor:144:autoaplicavel","epilepsia:48:null"].includes(key)) examples.set(key,selected.map(m=>[m.scale.id,m.isBroadbandFallback??false]));
}
console.log(JSON.stringify({stats,matrix:{n,empty,one,two,three,wrongAge,wrongRespondent,over,fallback,exclusiveFallback},examples:Object.fromEntries(examples)},null,2));
