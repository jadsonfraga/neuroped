import test from "node:test";
import assert from "node:assert/strict";
import { readFile, mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  COMMUNICATION_DOMAINS, COMMUNICATION_ITEMS, COMMUNICATION_RED_FLAGS,
  COMMUNICATION_RESPONSE_OPTIONS, COMMUNICATION_INSTRUCTIONS,
  COMMUNICATION_LIMITATIONS, COMMUNICATION_SAFETY_NOTE
} from "../../scripts/daily-authorial-communication.mjs";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const FILE = path.join(ROOT, "client/src/data/daily-authorial/2026-10-19-contingencia-com.json");
const record = JSON.parse(await readFile(FILE, "utf8"));

function inspect(candidate) {
  assert.equal(candidate.status, "rascunho_revisao");
  assert.equal(candidate.validationStatus, "nao_validado_psicometricamente");
  assert.equal(candidate.contingency, true);
  assert.equal(candidate.needsUpgrade, true);
  assert.equal(candidate.scoring.totalScoreEnabled, false);
  assert.equal(candidate.scoring.mode, "perfil_qualitativo_sem_total");
  assert.deepEqual(candidate.domains, COMMUNICATION_DOMAINS);
  assert.deepEqual(candidate.items, COMMUNICATION_ITEMS);
  assert.deepEqual(candidate.redFlags, COMMUNICATION_RED_FLAGS);
  assert.deepEqual(candidate.responseOptions, COMMUNICATION_RESPONSE_OPTIONS);
  assert.equal(candidate.instructions, COMMUNICATION_INSTRUCTIONS);
  assert.deepEqual(candidate.limitations, COMMUNICATION_LIMITATIONS);
  assert.equal(candidate.safetyNote, COMMUNICATION_SAFETY_NOTE);
  const ids = candidate.items.map(x=>x.id);
  assert.equal(new Set(ids).size, 15);
  assert.deepEqual(candidate.items.filter(x=>!x.redFlag).map(x=>x.id), Array.from({length:12},(_,i)=>"CT"+String(i+1).padStart(2,"0")));
  assert.deepEqual(candidate.items.filter(x=>x.redFlag).map(x=>x.id), ["CT13","CT14","CT15"]);
  assert.deepEqual(candidate.redFlags.map(x=>x.itemId), ["CT13","CT14","CT15"]);
  assert.ok(candidate.items.every(x=>candidate.domains.some(d=>d.id===x.domainId)));
  assert.ok(candidate.items.filter(x=>!x.redFlag).every(x=>x.responseMode==="frequencia_0_3"));
  assert.ok(candidate.items.filter(x=>x.redFlag).every(x=>x.responseMode==="presente_ausente"));
  assert.ok(candidate.responseOptions.filter(x=>x.value===null).length===1);
  assert.ok(candidate.responseOptions.filter(x=>x.value!==null).every(x=>/observad|oportunidade|frequente/i.test(x.label)));
  assert.ok(candidate.redFlags.every(x=>/SAMU 192/.test(x.action)));
  assert.ok(/imediat/i.test(candidate.redFlags[0].action));
  assert.ok(/urgente/i.test(candidate.redFlags[1].action));
  assert.ok(/imediat/i.test(candidate.redFlags[2].action));
  assert.ok(/não colocar nada na boca/.test(candidate.safetyNote));
  assert.ok(/não exige|não exigir|não equivale/i.test(candidate.instructions+" "+candidate.limitations.join(" ")));
  assert.ok(!/ponto de corte|sensibilidade\s*de\s*\d|especificidade\s*de\s*\d/i.test(candidate.scoring.instructions));
}

test("snapshot COM 19/10 é temático, coerente e bloqueado para uso clínico",()=>inspect(record));
test("gerador determinístico COM repete contrato com data-alvo independente",async()=>{
  const dir=await mkdtemp(path.join(tmpdir(),"neuroped-issue1186-"));
  try {
    const r=spawnSync(process.execPath,[
      "--experimental-strip-types",
      path.join(ROOT,"scripts/generate-daily-authorial-fallback.mts")
    ],{cwd:ROOT,encoding:"utf8",env:{...process.env,NEUROPED_DAILY_OUTPUT_DIR:dir,NEUROPED_GENERATION_DATE:"2026-10-26"},timeout:30000});
    assert.equal(r.status,0,(r.stderr||r.stdout).slice(-3000));
    const files=await readdir(dir);
    assert.deepEqual(files,["2026-10-26-contingencia-com.json"]);
    const generated=JSON.parse(await readFile(path.join(dir,files[0]),"utf8"));
    inspect(generated);
    assert.equal(generated.generatedAt,"2026-10-26T00:00:00.000Z");
  } finally {await rm(dir,{recursive:true,force:true});}
});
