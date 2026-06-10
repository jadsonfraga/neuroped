#!/usr/bin/env node

/**
 * Filter Logic Simulator
 * Simulates the filter algorithm to predict expected outputs
 */

import fs from 'fs';

console.log('\n🧪 SIMULAÇÃO DA LÓGICA DE FILTRO NEUROPED\n');

// Read scaleFilter to get actual scales
const scaleFilterPath = '/home/user/neuroped/client/src/data/scaleFilter.ts';
let allScalesStr = fs.readFileSync(scaleFilterPath, 'utf-8');

// Use a safer approach - just grep for critical scales
const criticalScales = {
  'mchat': 'M-CHAT-R/F',
  'ados2': 'ADOS-2',
  'snap': 'SNAP-IV',
  'bayley': 'Bayley-III',
  'denver': 'Denver II',
  'rcads': 'RCADS',
  'scared': 'SCARED',
  'brief2': 'BRIEF-2',
  'griffiths': 'Griffiths',
  'cbcl': 'CBCL'
};

// Check which critical scales exist
let allScales = Object.entries(criticalScales)
  .filter(([id, name]) => {
    const pattern = new RegExp(`id:\\s*["']${id}["']`);
    return pattern.test(allScalesStr);
  })
  .map(([id, name]) => ({ id, name }));

console.log(`✅ Found ${allScales.length} critical scales in catalog\n`);

// Clinical patterns (copied from filtro.tsx)
const clinicalPatterns = [
  { signature: ['tea', 'atraso'], goldStandard: 'mchat', name: 'TEA em lactentes', minAge: 16, maxAge: 30 },
  { signature: ['tea', 'comportamento', 'linguagem'], goldStandard: 'ados2', name: 'TEA (completo)', minAge: 12, maxAge: 216 },
  { signature: ['tdah', 'comportamento'], goldStandard: 'snap', name: 'TDAH (completo)', minAge: 72, maxAge: 204 },
  { signature: ['tdah', 'cognicao'], goldStandard: 'brief2', name: 'TDAH + função executiva', minAge: 6, maxAge: 204 },
  { signature: ['atraso', 'linguagem', 'motor'], goldStandard: 'bayley', name: 'Atraso global', minAge: 1, maxAge: 42 },
  { signature: ['atraso'], goldStandard: 'denver', name: 'Atraso (triagem)', minAge: 0, maxAge: 60 },
  { signature: ['ansiedade', 'depressao'], goldStandard: 'rcads', name: 'Ansiedade + Depressão', minAge: 96, maxAge: 216 },
  { signature: ['ansiedade'], goldStandard: 'scared', name: 'Ansiedade', minAge: 96, maxAge: 216 },
];

// Test cases
const testCases = [
  {
    id: 'CASO1_TEA',
    name: 'Lucas M. - TEA em lactente (20m)',
    ageMonths: 20,
    queixas: ['tea', 'atraso', 'linguagem'],
    respondent: null,
  },
  {
    id: 'CASO2_TDAH',
    name: 'Marina S. - TDAH + Comportamento (84m)',
    ageMonths: 84,
    queixas: ['tdah', 'comportamento'],
    respondent: 'professor',
  },
  {
    id: 'CASO3_DEPANSA',
    name: 'João A. - Depressão + Ansiedade (168m)',
    ageMonths: 168,
    queixas: ['depressao', 'ansiedade'],
    respondent: 'pais',
  },
  {
    id: 'CASO4_ATRASO',
    name: 'Sofia R. - Atraso global (10m)',
    ageMonths: 10,
    queixas: ['atraso'],
    respondent: 'clinico',
  },
  {
    id: 'CASO5_TDAH',
    name: 'Pedro G. - TDAH (108m)',
    ageMonths: 108,
    queixas: ['tdah'],
    respondent: null,
  },
];

// Function to detect gold standard (same logic as filtro.tsx)
function detectGoldStandard(queixas, ageMonths) {
  if (queixas.length < 2) return null; // Needs 2+ symptoms

  let bestMatch = null;
  for (const pattern of clinicalPatterns) {
    const matchCount = pattern.signature.filter(s => queixas.includes(s)).length;
    const score = matchCount / pattern.signature.length;

    if (matchCount >= 2) { // Needs at least 2 matches
      // Check age validity
      if (ageMonths >= pattern.minAge && ageMonths <= pattern.maxAge) {
        if (!bestMatch || score > bestMatch.score) {
          bestMatch = { pattern, score };
        }
      }
    }
  }

  return bestMatch?.pattern ?? null;
}

// Simulate filter for each test case
console.log('═'.repeat(60));
console.log('SIMULAÇÃO DE LÓGICA DE FILTRO');
console.log('═'.repeat(60) + '\n');

for (const testCase of testCases) {
  console.log(`\n🧪 ${testCase.name}`);
  console.log(`   Queixas: ${testCase.queixas.join(', ')}`);
  console.log(`   Idade: ${testCase.ageMonths} meses`);

  // Simulate gold standard detection
  const goldStandard = detectGoldStandard(testCase.queixas, testCase.ageMonths);

  if (goldStandard) {
    console.log(`\n   ✅ PADRÃO-OURO DETECTADO:`);
    console.log(`      Padrão: ${goldStandard.name}`);
    console.log(`      Escala: ${goldStandard.goldStandard}`);

    // Find the actual scale
    const scale = allScales.find(s => s.id === goldStandard.goldStandard);
    if (scale) {
      console.log(`      Nome: ${scale.name}`);
    }
  } else {
    console.log(`\n   ⚠️  PADRÃO-OURO NÃO DETECTADO (1 queixa ou sem match)`);
  }
}

console.log('\n' + '═'.repeat(60));
console.log('ANÁLISE');
console.log('═'.repeat(60));

console.log(`
✅ Casos que DEVEM ter Gold-Standard:
   1. Lucas (3 queixas, 2+ matches): TEA padrão
   2. Marina (2 queixas, 2+ matches): TDAH padrão
   3. João (2 queixas, 2+ matches): Ansiedade+Depressão
   4. Sofia (1 queixa, <2 matches): NÃO detecta padrão
   5. Pedro (1 queixa, <2 matches): NÃO detecta padrão

⚠️  Achado Crítico:
   - Casos 4 e 5 com apenas 1 queixa não acionam padrão-ouro
   - Isso é CORRETO por design (evita falsos positivos)
   - Mas as escalas devem aparecer no ranking normal
`);

console.log('\n' + '═'.repeat(60) + '\n');
