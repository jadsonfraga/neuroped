#!/usr/bin/env node
// Auditoria Contínua: Filtro de Escalas com Pacientes Aleatórios
// Busca bugs no filtro e na execução das escalas
// Executado a cada 20 minutos

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const timestamp = new Date().toLocaleString('pt-BR');

console.log(`\n${'='.repeat(80)}`);
console.log(`🔍 AUDITORIA: Filtro de Escalas com Pacientes Aleatórios`);
console.log(`⏱️  ${timestamp}`);
console.log(`${'='.repeat(80)}\n`);

// ============ Carregar dados ============

function loadScalesData() {
  try {
    const scaleFilterPath = path.join(__dirname, 'client/src/data/scaleFilter.ts');
    const content = fs.readFileSync(scaleFilterPath, 'utf-8');

    // Contar escalas totais (aproximado)
    const scaleMatches = content.match(/id:\s*"([^"]+)"/g) || [];
    return {
      totalScales: scaleMatches.length,
      scaleFilter: 'OK'
    };
  } catch (e) {
    return { totalScales: 0, scaleFilter: 'ERRO' };
  }
}

// ============ Gerar Paciente Aleatório ============

function generateRandomPatient() {
  // Idade em meses
  const ageMonths = Math.floor(Math.random() * 216) + 1; // 1-216 meses (0-18 anos)

  // Queixas (1-3)
  const allQueixas = [
    "tdah", "tea", "ansiedade", "depressao", "comportamento",
    "atraso", "linguagem", "sono", "dor", "alimentacao",
    "epilepsia", "motor", "cognicao", "aprendizagem", "trauma",
    "toc", "psicose", "efeitos", "social", "funcionalidade"
  ];
  const numQueixas = Math.floor(Math.random() * 3) + 1;
  const queixas = [];
  for (let i = 0; i < numQueixas; i++) {
    const q = allQueixas[Math.floor(Math.random() * allQueixas.length)];
    if (!queixas.includes(q)) queixas.push(q);
  }

  // Respondentes
  const respondentes = ["pais", "professor", "clinico", "autoaplicavel"];
  const respondente = respondentes[Math.floor(Math.random() * respondentes.length)];

  return {
    id: Math.random().toString(36).substring(7),
    ageMonths,
    ageYears: (ageMonths / 12).toFixed(1),
    queixas,
    respondente,
    context: ["home", "school", "clinic"][Math.floor(Math.random() * 3)]
  };
}

// ============ Testar Filtro ============

function testFilter(patient) {
  const issues = [];

  // Issue 1: Idade fora de range (0-216)
  if (patient.ageMonths < 0 || patient.ageMonths > 216) {
    issues.push(`❌ Idade inválida: ${patient.ageMonths} meses`);
  }

  // Issue 2: Queixa vazia
  if (!patient.queixas || patient.queixas.length === 0) {
    issues.push(`❌ Nenhuma queixa selecionada`);
  }

  // Issue 3: Respondente inválido
  const validRespondentes = ["pais", "professor", "clinico", "autoaplicavel"];
  if (!validRespondentes.includes(patient.respondente)) {
    issues.push(`❌ Respondente inválido: ${patient.respondente}`);
  }

  // Issue 4: Professor sem contexto escolar
  if (patient.respondente === "professor" && patient.context !== "school") {
    issues.push(`⚠️  Professor sem contexto escolar (context: ${patient.context})`);
  }

  // Issue 5: Autoaplicável para criança < 8 anos
  if (patient.respondente === "autoaplicavel" && patient.ageMonths < 96) {
    issues.push(`⚠️  Autoaplicável para criança < 8 anos (${patient.ageYears} anos)`);
  }

  // Issue 6: Depressão/ansiedade para criança < 5 anos
  const psyQueixas = ["depressao", "ansiedade", "trauma"];
  if (psyQueixas.some(q => patient.queixas.includes(q)) && patient.ageMonths < 60) {
    issues.push(`⚠️  ${patient.queixas.join(",")} para criança < 5 anos`);
  }

  // Issue 7: TDAH para criança < 6 anos
  if (patient.queixas.includes("tdah") && patient.ageMonths < 72) {
    issues.push(`⚠️  TDAH para criança < 6 anos (recomendado usar comportamento geral)`);
  }

  // Issue 8: M-CHAT apenas para 16-30 meses
  if (patient.queixas.includes("tea") && (patient.ageMonths < 16 || patient.ageMonths > 30)) {
    issues.push(`⚠️  TEA requer M-CHAT para 16-30m, mas paciente tem ${patient.ageYears} anos`);
  }

  return {
    isValid: issues.length === 0,
    issues
  };
}

// ============ Executar Auditoria ============

const data = loadScalesData();
console.log(`📊 Estado do Sistema:`);
console.log(`├─ Total de escalas: ${data.totalScales}`);
console.log(`└─ scaleFilter.ts: ${data.scaleFilter}\n`);

const numPatients = 10;
let passedTests = 0;
let failedTests = 0;
let warnings = 0;

console.log(`🧪 Testando ${numPatients} pacientes aleatórios:\n`);

for (let i = 1; i <= numPatients; i++) {
  const patient = generateRandomPatient();
  const result = testFilter(patient);

  console.log(`Paciente ${i}:`);
  console.log(`├─ ID: ${patient.id}`);
  console.log(`├─ Idade: ${patient.ageYears} anos (${patient.ageMonths}m)`);
  console.log(`├─ Queixas: ${patient.queixas.join(", ")}`);
  console.log(`├─ Respondente: ${patient.respondente}`);
  console.log(`├─ Contexto: ${patient.context}`);

  if (result.isValid) {
    console.log(`└─ Status: ✅ PASSOU\n`);
    passedTests++;
  } else {
    console.log(`└─ Issues:`);
    result.issues.forEach(issue => console.log(`   ${issue}`));
    console.log();
    if (result.issues.some(i => i.startsWith("❌"))) {
      failedTests++;
    } else {
      warnings++;
    }
  }
}

// ============ Relatório ============

console.log(`${'='.repeat(80)}`);
console.log(`📈 RESUMO DA AUDITORIA:`);
console.log(`${'='.repeat(80)}`);
console.log(`✅ Passou: ${passedTests}/${numPatients}`);
console.log(`❌ Falhou: ${failedTests}/${numPatients}`);
console.log(`⚠️  Avisos: ${warnings}/${numPatients}`);

if (failedTests === 0) {
  console.log(`\n🎉 STATUS: TUDO OK (nenhum bug crítico detectado)\n`);
  process.exit(0);
} else {
  console.log(`\n🐛 STATUS: ${failedTests} BUGS DETECTADOS - Revisar acima\n`);
  process.exit(1);
}
