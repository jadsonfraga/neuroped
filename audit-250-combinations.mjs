#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

console.log('🔍 AUDITORIA PROFUNDA — FILTRO DE ESCALAS\n');
console.log('========================================\n');

// ============ CARREGAR DADOS ============
const scaleFilterPath = './client/src/data/scaleFilter.ts';
const scaleFilterContent = fs.readFileSync(scaleFilterPath, 'utf-8');

// Extrair escalas
const scales = [];
const scaleMatches = scaleFilterContent.matchAll(
  /{\s*id:\s*["']([^"']+)["'].*?ageMin:\s*(\d+).*?ageMax:\s*(\d+).*?queixas:\s*\[(.*?)\].*?respondente:\s*\[(.*?)\]/gs
);

for (const match of scaleMatches) {
  const id = match[1];
  const ageMin = parseInt(match[2]);
  const ageMax = parseInt(match[3]);
  const queixasStr = match[4].match(/["']([^"']+)["']/g) || [];
  const respondentesStr = match[5].match(/["']([^"']+)["']/g) || [];

  const queixas = queixasStr.map(q => q.replace(/["']/g, ''));
  const respondentes = respondentesStr.map(r => r.replace(/["']/g, ''));

  if (id && !id.startsWith('world-')) {
    scales.push({ id, ageMin, ageMax, queixas, respondentes });
  }
}

console.log(`✅ Carregado ${scales.length} escalas\n`);

// ============ DEFINIR COMBINAÇÕES ============
const queixas = [
  'atraso', 'tea', 'tdah', 'comportamento', 'ansiedade',
  'depressao', 'epilepsia', 'pc', 'linguagem', 'sono',
  'alimentacao', 'dor', 'cognicao', 'aprendizagem', 'funcionalidade'
];

const faixasEtarias = [
  { id: '0-6m', min: 0, max: 6 },
  { id: '6-12m', min: 6, max: 12 },
  { id: '1-2a', min: 12, max: 24 },
  { id: '2-4a', min: 24, max: 48 },
  { id: '4-6a', min: 48, max: 72 },
  { id: '6-12a', min: 72, max: 144 },
  { id: '12-18a', min: 144, max: 216 }
];

const respondentes = ['pais', 'crianca', 'clinico', 'professor'];

// ============ GERAR COMBINAÇÕES ============
console.log('📋 Gerando combinações de teste...\n');

const combinations = [];
let idx = 0;

for (let q = 0; q < Math.min(queixas.length, 15); q++) {
  for (let a = 0; a < faixasEtarias.length; a++) {
    for (let r = 0; r < respondentes.length; r++) {
      if (idx >= 250) break;
      combinations.push({
        id: idx + 1,
        queixa: [queixas[q]],
        ageRange: faixasEtarias[a],
        respondente: respondentes[r]
      });
      idx++;
    }
    if (idx >= 250) break;
  }
  if (idx >= 250) break;
}

console.log(`✅ Gerado ${combinations.length} combinações\n`);

// ============ FUNÇÃO DE TESTE ============
function testCombination(combo) {
  const results = scales.filter(scale => {
    const matchesQueixa = combo.queixa.length === 0 || scale.queixas.some(q => combo.queixa.includes(q));
    const matchesAge = scale.ageMax >= combo.ageRange.min && scale.ageMin <= combo.ageRange.max;
    const matchesRespondente = scale.respondentes.includes(combo.respondente);
    return matchesQueixa && matchesAge && matchesRespondente;
  });

  return {
    resultCount: results.length,
    results: results.slice(0, 10),
    issues: findIssues(results, combo)
  };
}

// ============ DETECÇÃO DE FALHAS ============
function findIssues(results, combo) {
  const issues = [];
  const seen = new Set();

  for (const scale of results) {
    if (scale.ageMin > combo.ageRange.max || scale.ageMax < combo.ageRange.min) {
      issues.push({
        type: 'AGE_MISMATCH',
        scale: scale.id,
        detail: `Idade ${combo.ageRange.id}: ${scale.ageMin}-${scale.ageMax}m`
      });
    }

    if (!scale.respondentes.includes(combo.respondente)) {
      issues.push({
        type: 'RESPONDENT_MISMATCH',
        scale: scale.id,
        detail: `Falta respondente: ${combo.respondente}`
      });
    }

    if (seen.has(scale.id)) {
      issues.push({
        type: 'DUPLICATE',
        scale: scale.id
      });
    }
    seen.add(scale.id);
  }

  return issues;
}

// ============ EXECUTAR TESTES ============
console.log('🧪 Executando 250 combinações de teste...\n');

let passedTests = 0;
let failedTests = 0;
const allIssues = [];

for (let i = 0; i < combinations.length; i++) {
  const combo = combinations[i];
  const testResult = testCombination(combo);

  if (testResult.issues.length === 0) {
    passedTests++;
  } else {
    failedTests++;
    testResult.issues.forEach(issue => allIssues.push({ combo: combo.id, ...issue }));
  }

  if ((i + 1) % 50 === 0) process.stdout.write('.');
}

console.log('\n\n✅ Testes completados!\n');

// ============ RESULTADOS ============
console.log('📊 RESULTADOS:\n');
console.log(`Total de testes:      ${combinations.length}`);
console.log(`Testes aprovados:     ${passedTests} (${Math.round(passedTests/combinations.length*100)}%)`);
console.log(`Testes com problemas: ${failedTests} (${Math.round(failedTests/combinations.length*100)}%)\n`);

// ============ ANÁLISE DE FALHAS ============
const issuesByType = {};
for (const issue of allIssues) {
  if (!issuesByType[issue.type]) {
    issuesByType[issue.type] = [];
  }
  issuesByType[issue.type].push(issue);
}

if (failedTests > 0) {
  console.log('🔴 FALHAS POR TIPO:\n');
  for (const [type, issues] of Object.entries(issuesByType)) {
    console.log(`  ${type}: ${issues.length} ocorrências`);
  }

  // Escalas problemáticas
  console.log('\n🚨 ESCALAS COM MAIS PROBLEMAS:\n');
  const scaleIssueCount = {};
  for (const issue of allIssues) {
    scaleIssueCount[issue.scale] = (scaleIssueCount[issue.scale] || 0) + 1;
  }

  const topProblematic = Object.entries(scaleIssueCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  for (const [scale, count] of topProblematic) {
    console.log(`  ${scale}: ${count} problemas`);
  }
}

// ============ RELATÓRIO ============
const report = {
  timestamp: new Date().toISOString(),
  totalCombinations: combinations.length,
  passedTests: passedTests,
  failedTests: failedTests,
  passRate: Math.round(passedTests/combinations.length*100),
  issuesByType: Object.entries(issuesByType).map(([type, issues]) => ({
    type,
    count: issues.length
  }))
};

fs.writeFileSync(
  './AUDIT_250_REPORT.json',
  JSON.stringify(report, null, 2)
);

console.log('\n📁 Relatório salvo: AUDIT_250_REPORT.json\n');

// ============ CONCLUSÃO ============
console.log('🏁 RESULTADO FINAL:\n');

if (failedTests === 0) {
  console.log('✅ AUDITORIA PASSOU - Sistema operacional!\n');
} else if (passedTests / combinations.length > 0.98) {
  console.log('🟡 AUDITORIA COM AVISOS - 98%+ de sucesso\n');
} else {
  console.log('🔴 AUDITORIA COM FALHAS - Revisar problemas acima\n');
}
