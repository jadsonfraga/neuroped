import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
import {COLORS} from "../../client/src/features/visual-recognition/model.ts";
const tokens=readFileSync(new URL("../../client/src/styles/tokens.css",import.meta.url),"utf8");
const css=readFileSync(new URL("../../client/src/features/visual-recognition/visual-recognition.css",import.meta.url),"utf8");
test("recognition uses canonical tokens with stable stimulus colors",()=>{
 const names=["red","blue","yellow","green","orange","purple","pink","brown","black","white","gray"];
 assert.equal(COLORS.length,names.length);
 for(const [index] of COLORS.entries()){assert.equal(COLORS[index][2],"var(--rv-color-"+names[index]+")");}
 for(const file of ["visual-recognition.css","Stimulus.tsx","model.ts"]){
  const source=readFileSync(new URL("../../client/src/features/visual-recognition/"+file,import.meta.url),"utf8");
  assert.doesNotMatch(source,/#[0-9a-fA-F]{3,8}\b/);
  for(const match of source.matchAll(/var\((--rv-(?:ui|art|color)-[a-z0-9-]+)\)/g)){assert.ok(tokens.includes(match[1]+":"),match[1]);}
 }
 assert.match(tokens,/RECOGNITION_FIXED_PALETTE_V2/);
});

test("phone recognition layout keeps controls readable and child choices symmetric",()=>{
 assert.match(css,/@media\(max-width:600px\)[\s\S]*?\.rv-form-grid,\.rv-response \.rv-form-grid\{grid-template-columns:1fr;gap:12px\}/);
 assert.match(css,/\.rv-catalog\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\);gap:10px;max-height:520px;padding-bottom:82px;scroll-padding-bottom:82px\}/);
 assert.match(css,/\.rv-child-grid\.rv-options-3\{grid-template-columns:1fr;grid-template-rows:repeat\(3,minmax\(0,1fr\)\);max-width:520px\}/);
});
