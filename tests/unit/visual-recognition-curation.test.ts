import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync, existsSync } from "node:fs";
import { ITEMS, itemFor } from "../../client/src/features/visual-recognition/model.ts";
const root=new URL("../../client/public/recognition-v2/",import.meta.url);
const manifest=JSON.parse(readFileSync(new URL("manifest.json",root),"utf8"));

test("a ave do banco é um galo vivo, com nome e origem corretos",()=>{
  const bird=itemFor("galo");
  assert.equal(bird.label,"Galo");
  assert.equal(bird.category,"animais");
  assert.equal(bird.sourcePath,"EN/cockerel.svg");
  assert.equal(ITEMS.some(item=>item.category==="animais"&&item.sourcePath==="EN/chicken.svg"),false);
  assert.equal(existsSync(new URL("galinha.svg",root)),false);
  assert.ok(existsSync(new URL("galo.svg",root)));
});

test("prato e garrafa isolam o objeto principal e documentam a adaptação",()=>{
  for(const [id,crop] of [["prato",[25,325,800,485]],["garrafa",[245,40,350,770]]] as const){
    const item=manifest.items.find((entry:{id:string})=>entry.id===id);
    assert.deepEqual(item.crop,crop);
    assert.equal(item.license,"CC-BY-SA-4.0");
    assert.match(item.adaptation,/Recorte/);
    const svg=readFileSync(new URL(`${id}.svg`,root),"utf8");
    assert.ok(svg.includes(`viewBox="${crop.join(" ")}"`));
    assert.match(svg,/<svg\b[^>]*overflow="hidden"/);
  }
});
