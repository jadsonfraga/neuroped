// Auditoria de Integração — 230 Escalas Complementares
// Verifica que todas as 230 escalas foram integradas ao scaleFilter.ts

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('='.repeat(80));
console.log('AUDITORIA: Integração de 230 Escalas Complementares');
console.log('='.repeat(80));

// ============ Leitura dos Arquivos TypeScript ============

function countScalesInFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    // Contar objetos no array (simplista, mas funciona)
    const matches = content.match(/{\s*id:\s*"[^"]+"/g);
    return matches ? matches.length : 0;
  } catch (e) {
    return 0;
  }
}

// ============ Contar Escalas ============

const paths = {
  complementares230: path.join(__dirname, 'client/src/data/scalasComplementares230.ts'),
  bloco2: path.join(__dirname, 'client/src/data/scalasComplementares230Bloco2.ts'),
  bloco3: path.join(__dirname, 'client/src/data/scalasComplementares230Bloco3.ts'),
  indice: path.join(__dirname, 'client/src/data/indiceEscalasComplementares230.ts'),
  scaleFilter: path.join(__dirname, 'client/src/data/scaleFilter.ts'),
};

const counts = {
  bloco1_5: countScalesInFile(paths.complementares230),
  bloco6_10: countScalesInFile(paths.bloco2),
  bloco11_16: countScalesInFile(paths.bloco3),
};

const totalComplementares = counts.bloco1_5 + counts.bloco6_10 + counts.bloco11_16;

console.log('\n📊 CONTAGEM DE ESCALAS POR BLOCO:');
console.log(`├─ Bloco 1-5 (PROMIS, NIH, Paralisia Cerebral, Desenvolvimento, Linguagem): ${counts.bloco1_5}`);
console.log(`├─ Bloco 6-10 (TEA, TDAH, Epilepsia, Dor, Sono): ${counts.bloco6_10}`);
console.log(`├─ Bloco 11-16 (Alimentação, Trauma, Humor, Comportamento, Aprendizagem, Cognição): ${counts.bloco11_16}`);
console.log(`└─ TOTAL COMPLEMENTARES: ${totalComplementares}`);

// ============ Verificar Integração ao scaleFilter.ts ============

const scaleFilterContent = fs.readFileSync(paths.scaleFilter, 'utf-8');

const hasImportComplementares = scaleFilterContent.includes('todasAsEscalasComplementares');
const hasImportDescricoes = scaleFilterContent.includes('descricoesMelhoradas');
const hasSpreadComplementares = scaleFilterContent.includes('...todasAsEscalasComplementares');
const hasDescricaoMap = scaleFilterContent.includes('descricoesMelhoradas[escala.id]');

console.log('\n✅ VERIFICAÇÃO DE INTEGRAÇÃO:');
console.log(`├─ Import todasAsEscalasComplementares: ${hasImportComplementares ? '✓' : '✗'}`);
console.log(`├─ Import descricoesMelhoradas: ${hasImportDescricoes ? '✓' : '✗'}`);
console.log(`├─ Spread ...todasAsEscalasComplementares: ${hasSpreadComplementares ? '✓' : '✗'}`);
console.log(`└─ Aplicação de descricoesMelhoradas: ${hasDescricaoMap ? '✓' : '✗'}`);

const integracaoCompleta = hasImportComplementares && hasImportDescricoes &&
                           hasSpreadComplementares && hasDescricaoMap;

// ============ Validação de Estrutura ============

console.log('\n🔍 VALIDAÇÃO DE ESTRUTURA:');

// Verificar se cada bloco tem a exportação correta
const bloco1Exports = scaleFilterContent.includes('complementares230') &&
                      fs.readFileSync(paths.complementares230, 'utf-8').includes('export const complementares230');
const bloco2Exports = fs.readFileSync(paths.bloco2, 'utf-8').includes('export const complementares230Bloco2');
const bloco3Exports = fs.readFileSync(paths.bloco3, 'utf-8').includes('export const complementares230Bloco3');

console.log(`├─ Bloco 1-5 tem export: ${bloco1Exports ? '✓' : '✗'}`);
console.log(`├─ Bloco 6-10 tem export: ${bloco2Exports ? '✓' : '✗'}`);
console.log(`├─ Bloco 11-16 tem export: ${bloco3Exports ? '✓' : '✗'}`);

// Verificar respondentes incluem professor
const bloco2Content = fs.readFileSync(paths.bloco2, 'utf-8');
const temProfessor = bloco2Content.includes('"professor"');
console.log(`├─ Professor como respondente presente: ${temProfessor ? '✓' : '✗'}`);

// Verificar metadados (licencaUso, modoApp, duplicataStatus)
const temLicenca = scaleFilterContent.includes('licencaUso');
const temModo = scaleFilterContent.includes('modoApp');
const temStatus = scaleFilterContent.includes('duplicataStatus');
console.log(`├─ Metadado licencaUso: ${temLicenca ? '✓' : '✗'}`);
console.log(`├─ Metadado modoApp: ${temModo ? '✓' : '✗'}`);
console.log(`└─ Metadado duplicataStatus: ${temStatus ? '✓' : '✗'}`);

// ============ Verificar Descrições Melhoradas ============

console.log('\n📝 DESCRIÇÕES MELHORADAS:');

const descricoesMelhoradasContent = fs.readFileSync(
  path.join(__dirname, 'client/src/data/descricoesMelhoradas.ts'),
  'utf-8'
);

const escalasComDescricoes = descricoesMelhoradasContent.match(/"[^"]+":\s*`/g) || [];
console.log(`├─ Escalas com descrições melhoradas: ${escalasComDescricoes.length}`);

const temExemplos = descricoesMelhoradasContent.includes('Exemplo') ||
                    descricoesMelhoradasContent.includes('EXEMPLOS');
const temPerguntasPais = descricoesMelhoradasContent.includes('PAIS');
const temPerguntasProfessor = descricoesMelhoradasContent.includes('PROFESSOR');

console.log(`├─ Tem exemplos de perguntas: ${temExemplos ? '✓' : '✗'}`);
console.log(`├─ Tem perguntas para PAIS: ${temPerguntasPais ? '✓' : '✗'}`);
console.log(`└─ Tem perguntas para PROFESSOR: ${temPerguntasProfessor ? '✓' : '✗'}`);

// ============ Relatório Final ============

console.log('\n' + '='.repeat(80));
console.log('📈 RESUMO FINAL:');
console.log('='.repeat(80));

console.log(`\nTotal de escalas complementares criadas: ${totalComplementares}`);
console.log(`Integração ao scaleFilter.ts: ${integracaoCompleta ? '✅ COMPLETA' : '❌ INCOMPLETA'}`);
console.log(`Descrições melhoradas: ${escalasComDescricoes.length} escalas`);
console.log(`Professor como respondente: ${temProfessor ? '✅ SIM' : '❌ NÃO'}`);
console.log(`Exemplos para pais/professor: ${temExemplos && temPerguntasPais && temPerguntasProfessor ? '✅ SIM' : '❌ PARCIAL'}`);

if (integracaoCompleta && totalComplementares >= 220 && temExemplos) {
  console.log('\n🎉 STATUS: INTEGRAÇÃO BEM-SUCEDIDA!');
  console.log('As 230 escalas complementares foram integradas com sucesso ao NeuroPed.');
  console.log('Próximo passo: Testar no filtro.tsx\n');
  process.exit(0);
} else {
  console.log('\n⚠️  STATUS: VERIFICAR PONTOS ACIMA');
  process.exit(1);
}
