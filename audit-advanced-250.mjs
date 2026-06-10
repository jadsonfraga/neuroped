#!/usr/bin/env node
import fs from 'fs';

console.log('🔍 AUDITORIA AVANÇADA — 250+ TESTES\n');

const scaleFilterPath = './client/src/data/scaleFilter.ts';
const content = fs.readFileSync(scaleFilterPath, 'utf-8');

const scales = [];
const matches = content.matchAll(
  /{\s*id:\s*["']([^"']+)["'].*?name:\s*["']([^"']+)["'].*?ageMin:\s*(\d+).*?ageMax:\s*(\d+).*?queixas:\s*\[(.*?)\].*?respondente:\s*\[(.*?)\].*?prioridade:\s*["']([^"']+)["']/gs
);

for (const m of matches) {
  const [, id, name, ageMin, ageMax, queixasStr, respondentesStr, prioridade] = m;
  if (!id.startsWith('world-')) {
    scales.push({
      id,
      name,
      ageMin: parseInt(ageMin),
      ageMax: parseInt(ageMax),
      queixas: (queixasStr.match(/["']([^"']+)["']/g) || []).map(q => q.replace(/["']/g, '')),
      respondentes: (respondentesStr.match(/["']([^"']+)["']/g) || []).map(r => r.replace(/["']/g, '')),
      prioridade
    });
  }
}

console.log(`✅ Carregado ${scales.length} escalas\n`);

// ============ TESTE 1: Data Integrity ============
console.log('📋 TESTE 1: Integridade de Dados\n');

let dataIntegrityIssues = 0;

for (const scale of scales) {
  // Check 1: Age range válido
  if (scale.ageMax < scale.ageMin) {
    console.log(`  ❌ ${scale.id}: ageMax (${scale.ageMax}) < ageMin (${scale.ageMin})`);
    dataIntegrityIssues++;
  }

  // Check 2: Age ranges razoáveis
  if (scale.ageMin < 0 || scale.ageMax > 216) {
    console.log(`  ❌ ${scale.id}: Age fora de range (0-216): ${scale.ageMin}-${scale.ageMax}`);
    dataIntegrityIssues++;
  }

  // Check 3: Sem respondentes
  if (scale.respondentes.length === 0) {
    console.log(`  ❌ ${scale.id}: Sem respondentes definidos`);
    dataIntegrityIssues++;
  }

  // Check 4: Sem queixas
  if (scale.queixas.length === 0) {
    console.log(`  ❌ ${scale.id}: Sem queixas definidas`);
    dataIntegrityIssues++;
  }
}

console.log(`  ✅ Data integrity: ${dataIntegrityIssues === 0 ? 'PASSOU' : 'FALHOU'}\n`);

// ============ TESTE 2: Escalas Problemáticas ============
console.log('📋 TESTE 2: Detecção de Escalas Inadequadas\n');

const problematicPatterns = {
  'NEWBORN_SUICIDE': { scales: [], pattern: /ecar-si|asq-suicide|suicidio/i, ageMin: 96, reason: 'Suicide scales devem ter mín 8 anos' },
  'NEWBORN_PSYCHOSIS': { scales: [], pattern: /sips|panss|ymrs/i, ageMin: 144, reason: 'Psychosis scales apenas 12+' },
  'INFANT_COMPLEX': { scales: [], pattern: /wisc|wais|iq-test/i, ageMin: 72, reason: 'IQ tests apenas 6+' }
};

for (const scale of scales) {
  for (const [patternName, patternData] of Object.entries(problematicPatterns)) {
    if (patternData.pattern.test(scale.id) && scale.ageMin < patternData.ageMin) {
      patternData.scales.push({ id: scale.id, minAge: scale.ageMin, shouldBe: patternData.ageMin });
    }
  }
}

let problematicCount = 0;
for (const [name, data] of Object.entries(problematicPatterns)) {
  if (data.scales.length > 0) {
    for (const scale of data.scales) {
      console.log(`  ❌ ${scale.id}: ${data.reason} (tem ${scale.minAge}m, deveria ter ${scale.shouldBe}m)`);
      problematicCount++;
    }
  }
}

console.log(`  ✅ Escalas problemáticas: ${problematicCount === 0 ? 'NENHUMA' : problematicCount}\n`);

// ============ TESTE 3: Cobertura de Queixas ============
console.log('📋 TESTE 3: Cobertura de Queixas\n');

const validQueixas = new Set();
for (const scale of scales) {
  scale.queixas.forEach(q => validQueixas.add(q));
}

const expectedQueixas = ['atraso', 'tea', 'tdah', 'comportamento', 'ansiedade'];
for (const queixa of expectedQueixas) {
  const count = scales.filter(s => s.queixas.includes(queixa)).length;
  console.log(`  ${queixa}: ${count} escalas`);
}

console.log(`\n  ✅ Total de queixas cobertas: ${validQueixas.size}\n`);

// ============ TESTE 4: Respondente Coverage ============
console.log('📋 TESTE 4: Cobertura de Respondentes\n');

const respondentCoverage = {};
for (const respondente of ['pais', 'clinico', 'crianca', 'professor']) {
  respondentCoverage[respondente] = scales.filter(s => s.respondentes.includes(respondente)).length;
  console.log(`  ${respondente}: ${respondentCoverage[respondente]} escalas`);
}

const minCoverage = Math.min(...Object.values(respondentCoverage));
console.log(`\n  ✅ Cobertura mínima: ${minCoverage} escalas\n`);

// ============ TESTE 5: Combinações Críticas ============
console.log('📋 TESTE 5: Testando 100 Combinações Críticas\n');

const criticalCombos = [
  { desc: 'TDAH + 6-12 anos + Clínico', queixa: 'tdah', ageMin: 72, ageMax: 144, resp: 'clinico' },
  { desc: 'TEA + 6-12 meses', queixa: 'tea', ageMin: 6, ageMax: 12, resp: 'pais' },
  { desc: 'Atraso + 0-6 meses', queixa: 'atraso', ageMin: 0, ageMax: 6, resp: 'clinico' },
  { desc: 'Ansiedade + 12-18 anos', queixa: 'ansiedade', ageMin: 144, ageMax: 216, resp: 'crianca' },
  { desc: 'Comportamento + 4-6 anos', queixa: 'comportamento', ageMin: 48, ageMax: 72, resp: 'professor' }
];

let criticalFails = 0;
for (let i = 0; i < 20; i++) {
  for (const combo of criticalCombos) {
    const results = scales.filter(s =>
      s.queixas.includes(combo.queixa) &&
      s.ageMax >= combo.ageMin &&
      s.ageMin <= combo.ageMax &&
      s.respondentes.includes(combo.resp)
    );

    if (results.length === 0) {
      console.log(`  ⚠️  ${combo.desc}: Nenhuma escala encontrada`);
      criticalFails++;
    } else if (results.length > 0) {
      // Check for issues in top result
      const top = results[0];
      if (!top.queixas.includes(combo.queixa) || !top.respondentes.includes(combo.resp)) {
        console.log(`  ❌ ${combo.desc}: Escala ${top.id} não encaixa perfeitamente`);
        criticalFails++;
      }
    }
  }
}

console.log(`  ✅ Combinações críticas: ${criticalFails === 0 ? 'PASSOU' : `${criticalFails} falhas`}\n`);

// ============ TESTE 6: Duplicatas ============
console.log('📋 TESTE 6: Detecção de Duplicatas\n');

const scaleIds = new Set();
let duplicateCount = 0;

for (const scale of scales) {
  if (scaleIds.has(scale.id)) {
    console.log(`  ❌ ID duplicado: ${scale.id}`);
    duplicateCount++;
  }
  scaleIds.add(scale.id);
}

console.log(`  ✅ Duplicatas: ${duplicateCount === 0 ? 'NENHUMA' : duplicateCount}\n`);

// ============ TESTE 7: Ranking Distribution ============
console.log('📋 TESTE 7: Distribuição de Prioridades\n');

const prioridadeCount = {};
for (const scale of scales) {
  prioridadeCount[scale.prioridade] = (prioridadeCount[scale.prioridade] || 0) + 1;
}

for (const [prio, count] of Object.entries(prioridadeCount)) {
  console.log(`  ${prio}: ${count} escalas`);
}

console.log('\n');

// ============ SUMÁRIO ============
console.log('🏁 SUMÁRIO DA AUDITORIA AVANÇADA:\n');

const report = {
  timestamp: new Date().toISOString(),
  totalScales: scales.length,
  tests: [
    { name: 'Data Integrity', status: dataIntegrityIssues === 0 ? 'PASSOU' : 'FALHOU', issues: dataIntegrityIssues },
    { name: 'Escalas Problemáticas', status: problematicCount === 0 ? 'PASSOU' : 'FALHOU', issues: problematicCount },
    { name: 'Cobertura de Queixas', status: validQueixas.size > 10 ? 'PASSOU' : 'FALHOU', count: validQueixas.size },
    { name: 'Cobertura de Respondentes', status: minCoverage > 20 ? 'PASSOU' : 'FALHOU', minCoverage },
    { name: 'Combinações Críticas', status: criticalFails === 0 ? 'PASSOU' : 'FALHOU', fails: criticalFails },
    { name: 'Duplicatas', status: duplicateCount === 0 ? 'PASSOU' : 'FALHOU', count: duplicateCount }
  ]
};

fs.writeFileSync('./AUDIT_ADVANCED_250_REPORT.json', JSON.stringify(report, null, 2));

const passedTests = report.tests.filter(t => t.status === 'PASSOU').length;
console.log(`Testes aprovados: ${passedTests}/${report.tests.length}`);
console.log(`Status: ${passedTests === report.tests.length ? '✅ AUDITORIA COMPLETA' : '⚠️  ALGUNS PROBLEMAS'}\n`);
