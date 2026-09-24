import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
import {COLORS} from "../../client/src/features/visual-recognition/model.ts";
const tokens=readFileSync(new URL("../../client/src/styles/tokens.css",import.meta.url),"utf8");
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
