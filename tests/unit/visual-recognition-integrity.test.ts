import assert from "node:assert/strict";
import { test } from "node:test";
import { ITEMS, makeTrial, observe, problems, emptyDraft, type Draft, type StageEvent } from "../../client/src/features/visual-recognition/model.ts";
const events: StageEvent[] = [{ kind:"apresentado", at:"2026-09-23T12:00:00Z" }, { kind:"encerrado", at:"2026-09-23T12:00:02Z" }];
const answer = (): Draft => ({ ...emptyDraft(), outcome:"correspondente", channel:"apontar", familiarity:"conhecida" });
const pool = ITEMS.filter(item=>item.category==="animais");

test("a ordem dos blocos não é uma alternância fixa esquerda-direita", () => {
  const patterns = new Set<string>();
  for(let seed=0;seed<20;seed++){
    const sequence = Array.from({length:20},(_,index)=>{
      const trial=makeTrial("gato","receptivo",pool,2,seed,index);
      return trial.optionIds.indexOf("gato");
    });
    assert.equal(sequence.filter(position=>position===0).length,10);
    patterns.add(sequence.join(""));
  }
  assert.ok(patterns.size>2,"sementes precisam produzir mais que duas alternâncias espelhadas");
});

test("problema de imagem não é ausência de resposta da criança", () => {
  const trial=makeTrial("gato","receptivo",pool,2,7,0);
  const broken:StageEvent[]=[...events,{kind:"erro-imagem",itemId:"gato",at:"2026-09-23T12:00:03Z"}];
  assert.ok(problems(trial,{...answer(),outcome:"sem_resposta",channel:"nenhuma"},broken).some(error=>error.includes("Falha de imagem")));
  const repeated:StageEvent[]=[...events,...events];
  assert.ok(problems(trial,answer(),repeated).some(error=>error.includes("reapresentação")));
  assert.deepEqual(problems(trial,{...answer(),help:"repeticao",note:"Reapresentação documentada."},repeated),[]);
});

test("correção preserva exposição original e não altera estímulo ou eventos", () => {
  const naming=makeTrial("gato","nomeacao",pool,2,7,0);
  const first=observe(naming,{...answer(),literal:"gatinho",channel:"oral"},events,[]);
  assert.equal(first.previousExposure,false);
  const receptive=makeTrial("gato","receptivo",pool,2,7,1);
  const later=observe(receptive,answer(),events,[first]);
  const corrected=observe(naming,{...answer(),literal:"gato",channel:"oral"},events,[first,later],first.id,"Ajuste da transcrição.");
  assert.equal(corrected.previousExposure,false,"tentativa posterior não pode retroagir à primeira nomeação");
  assert.throws(()=>observe({...naming,question:"Outra pergunta"},{...answer(),literal:"gato"},events,[first],first.id,"Ajuste"),/eventos preservados/);
  assert.throws(()=>observe(naming,{...answer(),literal:"gato"},[events[0]],[first],first.id,"Ajuste"),/eventos preservados/);
});

test("item não apresentado não cria exposição anterior ao nome", () => {
  const receptive=makeTrial("gato","receptivo",pool,2,8,0);
  const skipped=observe(receptive,{...answer(),outcome:"nao_aplicado",channel:"nenhuma",note:"Não apresentado."},[],[]);
  const naming=makeTrial("gato","nomeacao",pool,2,8,1);
  const response=observe(naming,{...answer(),literal:"gato",channel:"oral"},events,[skipped]);
  assert.equal(response.previousExposure,false);
});
