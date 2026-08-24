import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(resolve(root, path), "utf8");

const generic = read("client/src/components/GenericScale.tsx");
const runner = read("client/src/components/InteractiveScaleRunner.tsx");
const report = read("client/src/components/ClinicalReport.tsx");
const save = read("client/src/components/SaveToPatient.tsx");
const helper = read("client/src/lib/scaleResponseReport.ts");

// A data nasce UMA vez, no instante real de conclusão da aplicação.
assert.match(generic, /setApplicationDate\(new Date\(\)\.toISOString\(\)\)/);
assert.match(runner, /setApplicationDate\(new Date\(\)\.toISOString\(\)\)/);
assert.match(generic, /applicationDate=\{applicationDate \?\? undefined\}/);
assert.match(runner, /applicationDate=\{applicationDate \?\? undefined\}/);
assert.match(report, /applicationDate\?: string \| Date/);
assert.match(save, /applicationDate\?: string \| Date/);
assert.match(report, /Data da aplicação: \$\{formatClinicalDateTime\(applicationDate\)\}/);
assert.match(save, /appliedAt: applicationDate\.toISOString\(\)/);
assert.doesNotMatch(save, /appliedAt: new Date\(\)\.toISOString\(\)/);

// A resposta exibida e a exportada precisam vir do MESMO snapshot literal.
assert.match(generic, /const qaItems = allItems\.map/);
assert.match(generic, /config\.labels\[answers\[item\.key\] \?\? -1\]/);
assert.match(generic, /items=\{qaItems\}/);
assert.match(runner, /const reportItems = def\.items\.map/);
assert.match(runner, /item\.options\[answers\[index\]\]\.label/);
assert.match(runner, /items=\{reportItems\}/);
assert.match(report, /const answerBody = props\.items/);
assert.match(report, /\$\{item\.answer \|\| "Não respondida"\}/);
assert.match(helper, /answer: clean\(item\.answer, "Não respondida"\)/);

// Regressão histórica: o registro não pode reinterpretar/recodificar a alternativa.
assert.doesNotMatch(generic, /formatScaleResponseAnswer\(\s*config\.labels/);
assert.doesNotMatch(runner, /formatScaleResponseAnswer\(/);

console.log("✓ PDF: data de conclusão e respostas literais usam o mesmo snapshot da tela");
