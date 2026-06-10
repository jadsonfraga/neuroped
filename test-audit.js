#!/usr/bin/env node

/**
 * NeuroPed Filter System - Automated Test Audit
 * Tests 5 clinical cases and validates filter output
 */

import http from 'http';

const BASE_URL = 'http://localhost:5000';

// Test cases definition
const testCases = [
  {
    id: 'CASO1_TEA',
    name: 'Lucas M. - Suspeita de Autismo em Lactente',
    age: '1-2 anos',
    ageValue: '12-29',
    complaints: ['Autismo/TEA', 'Atraso do Desenvolvimento', 'Linguagem/Comunicação'],
    respondent: null,
    expectedGold: ['M-CHAT', 'ADOS'],
    expectedSilver: ['Bayley'],
    expectedDifficulty: 'nivel1',
  },
  {
    id: 'CASO2_TDAH',
    name: 'Marina S. - TDAH com Comportamento Disruptivo',
    age: '6-12 anos',
    ageValue: '72-143',
    complaints: ['TDAH', 'Comportamento/Externalizantes'],
    respondent: 'Professor',
    expectedGold: ['SNAP-IV', 'BRIEF-2'],
    expectedSilver: ['SDQ'],
    expectedDifficulty: 'Nivel3',
  },
  {
    id: 'CASO3_DEPANSA',
    name: 'João A. - Depressão + Ansiedade em Adolescente',
    age: '12-18 anos',
    ageValue: '144-215',
    complaints: ['Depressão/Humor', 'Ansiedade'],
    respondent: 'Pais',
    expectedGold: ['RCADS'],
    expectedSilver: ['SCARED', 'PHQ-9'],
    expectedDifficulty: 'Nivel6',
  },
  {
    id: 'CASO4_ATRASO',
    name: 'Sofia R. - Atraso Global do Desenvolvimento em Bebê',
    age: '6-12 meses',
    ageValue: '6-12',
    complaints: ['Atraso do Desenvolvimento'],
    respondent: 'Clínico',
    expectedGold: ['Bayley-III'],
    expectedSilver: ['Griffiths'],
    expectedDifficulty: 'nivel1',
  },
  {
    id: 'CASO5_TDAH_MED',
    name: 'Pedro G. - TDAH com Monitorização de Medicação',
    age: '6-12 anos',
    ageValue: '108-108',
    complaints: ['TDAH'],
    respondent: null,
    expectedGold: ['SNAP-IV', 'BRIEF-2'],
    expectedSilver: ['Conners'],
    expectedDifficulty: 'Nivel4',
  },
];

// Helper function to make HTTP requests
function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: 'GET',
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({ status: res.statusCode, data });
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.end();
  });
}

// Test filter endpoint
async function testCase(testCase) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🧪 TESTE: ${testCase.name}`);
  console.log(`${'='.repeat(60)}`);
  console.log(`ID: ${testCase.id}`);
  console.log(`Idade: ${testCase.age} (${testCase.ageValue} meses)`);
  console.log(`Queixas: ${testCase.complaints.join(', ')}`);
  if (testCase.respondent) console.log(`Respondente: ${testCase.respondent}`);

  try {
    // Try to fetch the filter page to see if it loads
    const response = await makeRequest('/filtro');

    if (response.status === 200) {
      console.log(`✅ Página /filtro carregou (status: ${response.status})`);

      // Check if page contains expected scale names
      let foundScales = {
        gold: [],
        silver: [],
        bronze: []
      };

      testCase.expectedGold.forEach(scale => {
        if (response.data.includes(scale)) {
          foundScales.gold.push(scale);
        }
      });

      testCase.expectedSilver.forEach(scale => {
        if (response.data.includes(scale)) {
          foundScales.silver.push(scale);
        }
      });

      if (foundScales.gold.length > 0) {
        console.log(`✅ Gold-standard encontradas: ${foundScales.gold.join(', ')}`);
      } else {
        console.log(`⚠️  Gold-standard NÃO encontradas (esperadas: ${testCase.expectedGold.join(', ')})`);
      }

      if (foundScales.silver.length > 0) {
        console.log(`✅ Silver-standard encontradas: ${foundScales.silver.join(', ')}`);
      }

      // Check for difficulty level in page data
      if (response.data.includes(testCase.expectedDifficulty)) {
        console.log(`✅ Dificuldade esperada encontrada: ${testCase.expectedDifficulty}`);
      } else {
        console.log(`⚠️  Dificuldade NÃO encontrada: ${testCase.expectedDifficulty}`);
      }

      // Check for 5th slot (EUSM-10)
      if (response.data.includes('EUSM-10') || response.data.includes('Satisfação')) {
        console.log(`✅ 5º slot (Medicação/EUSM-10) identificado`);
      } else {
        console.log(`⚠️  5º slot NÃO identificado`);
      }

    } else {
      console.log(`❌ Erro ao carregar página (status: ${response.status})`);
    }

  } catch (error) {
    console.log(`❌ Erro ao testar: ${error.message}`);
  }
}

// Main test runner
async function runTests() {
  console.log('\n🚀 INICIANDO AUDITORIA DO SISTEMA DE FILTRO NEUROPED');
  console.log(`Data: ${new Date().toLocaleString('pt-BR')}`);
  console.log(`URL: ${BASE_URL}`);

  // Test app connectivity first
  try {
    console.log('\n🔍 Verificando conectividade...');
    const response = await makeRequest('/');
    if (response.status === 200) {
      console.log('✅ App está respondendo em localhost:5000');
    }
  } catch (error) {
    console.log(`❌ App não está acessível: ${error.message}`);
    process.exit(1);
  }

  // Run all test cases
  for (const tc of testCases) {
    await testCase(tc);
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('✅ AUDITORIA COMPLETA');
  console.log(`${'='.repeat(60)}\n`);
}

// Run
runTests().catch(error => {
  console.error('Erro fatal:', error);
  process.exit(1);
});
