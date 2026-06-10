#!/usr/bin/env node
import fs from 'fs';

console.log('🔧 CORRIGINDO PROBLEMAS ENCONTRADOS\n');

let content = fs.readFileSync('./client/src/data/scaleFilter.ts', 'utf-8');

const fixes = [
  // 1. Age ranges inválidos (>216)
  { find: /id: "masc2".*?ageMax: 228/, replace: m => m.replace('228', '216') },
  { find: /id: "celf5".*?ageMax: 252/, replace: m => m.replace('252', '216') },
  { find: /id: "pedicat".*?ageMax: 252/, replace: m => m.replace('252', '216') },
  { find: /id: "crafft".*?ageMax: 252/, replace: m => m.replace('252', '216') },
  { find: /id: "leiter3-ext".*?ageMax: 900/, replace: m => m.replace('900', '216') },
  { find: /id: "toni4".*?ageMax: 1068/, replace: m => m.replace('1068', '216') },
  { find: /id: "sb5".*?ageMax: 1020/, replace: m => m.replace('1020', '216') },
  { find: /id: "wcst".*?ageMax: 1068/, replace: m => m.replace('1068', '216') },
  { find: /id: "d2".*?ageMax: 720/, replace: m => m.replace('720', '216') },
  { find: /id: "celf5-new".*?ageMax: 252/, replace: m => m.replace('252', '216') },
  { find: /id: "ppvt4-new".*?ageMax: 1080/, replace: m => m.replace('1080', '216') },
  { find: /id: "ctopp2".*?ageMax: 288/, replace: m => m.replace('288', '216') },
  { find: /id: "eowpvt4".*?ageMax: 960/, replace: m => m.replace('960', '216') },
  { find: /id: "bot2".*?ageMax: 252/, replace: m => m.replace('252', '216') },
  { find: /id: "pedi-cat".*?ageMax: 252/, replace: m => m.replace('252', '216') },
  { find: /id: "ace".*?ageMax: 1200/, replace: m => m.replace('1200', '216') },
  { find: /id: "sips".*?ageMax: 300/, replace: m => m.replace('300', '216') },
  { find: /id: "prime-screen".*?ageMax: 300/, replace: m => m.replace('300', '216') },
  { find: /id: "basc3".*?ageMax: 252/, replace: m => m.replace('252', '216') },

  // 2. ECAR-SI: foi corrigido para 96, mas verifique
  // (já estava correto)

  // 3. YMRS: mínimo deve ser 144 (12 anos)
  { find: /id: "ymrs".*?ageMin: 60/, replace: m => m.replace('ageMin: 60', 'ageMin: 144') },

  // 4. PANSS-ped: mínimo deve ser 144 (12 anos)
  { find: /id: "panss-ped".*?ageMin: 72/, replace: m => m.replace('ageMin: 72', 'ageMin: 144') },
];

let fixedCount = 0;
for (const fix of fixes) {
  const before = content;
  content = content.replace(fix.find, fix.replace);
  if (content !== before) {
    fixedCount++;
  }
}

console.log(`✅ Corrigidos ${fixedCount} problemas de age range\n`);

// Salvar
fs.writeFileSync('./client/src/data/scaleFilter.ts', content);

console.log('✅ Arquivo atualizado: scaleFilter.ts\n');
