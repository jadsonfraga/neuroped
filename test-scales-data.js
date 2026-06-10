#!/usr/bin/env node

/**
 * NeuroPed Scales Data Audit
 * Validates that scales are properly configured for the test cases
 */

import fs from 'fs';
import path from 'path';

console.log('\n🔍 AUDITORIA DE DADOS DE ESCALAS\n');

// Read the scaleFilter.ts file to check scale configuration
const scaleFilterPath = '/home/user/neuroped/client/src/data/scaleFilter.ts';

try {
  const content = fs.readFileSync(scaleFilterPath, 'utf-8');

  // Count scales
  const scaleMatches = content.match(/{\s*id:/g) || [];
  console.log(`✅ Total de escalas carregadas: ${scaleMatches.length}`);

  // Check for critical scales
  const criticalScales = [
    { name: 'M-CHAT-R/F', searchTerm: 'M-CHAT' },
    { name: 'ADOS-2', searchTerm: 'ADOS' },
    { name: 'Bayley-III', searchTerm: 'Bayley' },
    { name: 'SNAP-IV', searchTerm: 'SNAP' },
    { name: 'BRIEF-2', searchTerm: 'BRIEF' },
    { name: 'RCADS', searchTerm: 'RCADS' },
    { name: 'Columbia Suicide Risk Scale', searchTerm: 'Columbia' },
    { name: 'EUSM-10', searchTerm: 'EUSM' },
    { name: 'Denver II', searchTerm: 'Denver' },
    { name: 'Griffiths', searchTerm: 'Griffiths' },
  ];

  console.log('\n📋 Verificando escalas críticas para os casos de teste:\n');

  let found = 0;
  for (const scale of criticalScales) {
    if (content.includes(scale.searchTerm)) {
      console.log(`✅ ${scale.name}`);
      found++;
    } else {
      console.log(`❌ ${scale.name}`);
    }
  }

  console.log(`\n📊 ${found}/${criticalScales.length} escalas críticas encontradas`);

  // Check for difficulty levels configuration
  console.log('\n🎯 Verificando configuração de níveis de dificuldade:\n');

  const difficultyPath = '/home/user/neuroped/client/src/data/difficulttyLevels.ts';
  if (fs.existsSync(difficultyPath)) {
    const diffContent = fs.readFileSync(difficultyPath, 'utf-8');

    const diffLevels = ['nivel1', 'nivel2', 'nivel3', 'nivel4', 'nivel5', 'nivel6'];
    let foundDiff = 0;

    for (const level of diffLevels) {
      if (diffContent.includes(`"${level}"`) || diffContent.includes(`id: "${level}"`)) {
        console.log(`✅ ${level} configurado`);
        foundDiff++;
      }
    }

    console.log(`\n✅ ${foundDiff}/${diffLevels.length} níveis de dificuldade encontrados`);
  } else {
    console.log(`❌ Arquivo difficulttyLevels.ts não encontrado`);
  }

  // Check for BatteryRecommendation component
  console.log('\n🔋 Verificando componentes de bateria inteligente:\n');

  const batteryPath = '/home/user/neuroped/client/src/data/batteryRecommendations.ts';
  if (fs.existsSync(batteryPath)) {
    const batContent = fs.readFileSync(batteryPath, 'utf-8');

    const batteries = ['tea-comprehensive', 'tdah-comprehensive', 'atraso-diagnostico', 'ansiedade-depressao', 'comportamento-disruptivo'];
    let foundBat = 0;

    for (const bat of batteries) {
      if (batContent.includes(bat)) {
        console.log(`✅ ${bat}`);
        foundBat++;
      }
    }

    console.log(`\n✅ ${foundBat}/${batteries.length} baterias inteligentes encontradas`);
  } else {
    console.log(`⚠️  Arquivo batteryRecommendations.ts não encontrado`);
  }

  // Check for CrossValidation component
  console.log('\n✔️  Verificando sistema de validações cruzadas:\n');

  const validationPath = '/home/user/neuroped/client/src/data/crossValidations.ts';
  if (fs.existsSync(validationPath)) {
    const valContent = fs.readFileSync(validationPath, 'utf-8');

    const alerts = [
      'tdah-sem-atraso-cognitivo',
      'depressao-sem-risco',
      'tea-sem-funcionalidade',
      'tdah-sem-func-executiva',
    ];

    let foundAlerts = 0;
    for (const alert of alerts) {
      if (valContent.includes(alert)) {
        console.log(`✅ Alerta: ${alert}`);
        foundAlerts++;
      }
    }

    console.log(`\n✅ ${foundAlerts}/${alerts.length} alertas de validação encontrados`);
  } else {
    console.log(`⚠️  Arquivo crossValidations.ts não encontrado`);
  }

  // Check for report generator
  console.log('\n📄 Verificando gerador de relatórios:\n');

  const reportPath = '/home/user/neuroped/client/src/lib/reportGenerator.ts';
  if (fs.existsSync(reportPath)) {
    const repContent = fs.readFileSync(reportPath, 'utf-8');

    if (repContent.includes('generateClinicalReport')) {
      console.log(`✅ generateClinicalReport() presente`);
    }
    if (repContent.includes('exportReportAsText')) {
      console.log(`✅ exportReportAsText() presente`);
    }
    console.log(`\n✅ Gerador de relatórios configurado`);
  } else {
    console.log(`⚠️  Arquivo reportGenerator.ts não encontrado`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ AUDITORIA DE DADOS CONCLUÍDA\n');

} catch (error) {
  console.error('❌ Erro ao ler arquivos:', error.message);
  process.exit(1);
}
