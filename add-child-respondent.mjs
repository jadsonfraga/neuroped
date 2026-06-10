#!/usr/bin/env node
import fs from 'fs';

console.log('🔧 Adicionando respondente "crianca" a escalas de adolescentes\n');

let content = fs.readFileSync('./client/src/data/scaleFilter.ts', 'utf-8');

const scalesToAddChild = [
  'scared', 'rcads', 'siq-jr', 'phq9', 'gad7', 'sdq',
  'spence', 'cpss-v', 'cyi', 'cites-ds', 'rads-2'
];

let addedCount = 0;
for (const scaleId of scalesToAddChild) {
  // Find scale with this ID
  const pattern = new RegExp(
    `(\\{\\s*id:\\s*["']${scaleId}["'].*?respondente:\\s*\\[)([^\\]]+)(\\])`,
    'g'
  );

  content = content.replace(pattern, (match, before, respondents, after) => {
    // Add 'crianca' if not already there
    if (!respondents.includes('crianca')) {
      const newRespondents = respondents.trim().replace(/\]$/, '') + `, "crianca"`;
      return before + newRespondents + after;
    }
    return match;
  });

  addedCount++;
}

console.log(`✅ Adicionado respondente "crianca" a ${addedCount} escalas\n`);

fs.writeFileSync('./client/src/data/scaleFilter.ts', content);

console.log('✅ Arquivo atualizado\n');
