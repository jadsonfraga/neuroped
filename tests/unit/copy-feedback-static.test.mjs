import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

// `copyText` (client/src/lib/shareText.ts) devolve false quando o clipboard é
// negado ou indisponível. Toda tela que usa o helper compartilhado precisa usar
// esse resultado: confirmar "copiado" só quando copiou e avisar quando falhou.
// Regressão: pré-consulta, pré-retorno e recepção descartavam o retorno e o
// usuário não sabia que nada tinha sido copiado.
function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : /\.(ts|tsx)$/.test(name) ? [path] : [];
  });
}

const importsSharedCopy = /import\s*\{[^}]*\bcopyText\b[^}]*\}\s*from\s*"@\/lib\/shareText"/;
const callers = walk("client/src").filter((file) => importsSharedCopy.test(readFileSync(file, "utf8")));
const ignored = [];
let calls = 0;
for (const file of callers) {
  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((line, index) => {
    if (!/\bcopyText\(/.test(line) || /^\s*import\b/.test(line) || /function copyText\(/.test(line)) return;
    calls += 1;
    const usesResult = /(if\s*\(\s*!?\(?\s*await copyText\(|=\s*await copyText\(|return\s+(await\s+)?copyText\()/.test(line);
    if (!usesResult) ignored.push(`${file}:${index + 1}: ${line.trim()}`);
  });
}
assert.ok(calls >= 7, `esperava ao menos 7 chamadas ao copyText compartilhado, achei ${calls}`);
assert.deepEqual(ignored, [], "chamada ao copyText compartilhado que ignora se a cópia funcionou");

for (const page of ["pre-consulta", "pre-retorno", "recepcao"]) {
  const source = readFileSync(`client/src/pages/${page}.tsx`, "utf8");
  assert.match(source, /Não foi possível copiar o resumo/, `${page}: falta aviso de falha na cópia`);
  assert.match(source, /variant: "destructive"/, `${page}: aviso de falha deve ser destrutivo`);
}
console.log(`copy-feedback-static ok (${callers.length} arquivos, ${calls} chamadas)`);
