// Script to add ClinicalReport to all standalone scale pages
const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'client/src/pages');

// Each scale config: what to import and what ClinicalReport props to build
const scales = [
  {
    file: 'snap.tsx',
    importLine: 'import { ClinicalReport } from "@/components/ClinicalReport";',
    insertAfterImport: 'SaveToPatient',
    // The items array needs to come from snapQuestions + answers
    itemsCode: `
        <ClinicalReport
          scaleName="SNAP-IV"
          scaleFullName="Swanson, Nolan and Pelham Questionnaire"
          totalScore={inattention + hyperactivity}
          maxScore={54}
          classification={result.combinedResult}
          description={result.description}
          domainResults={[
            { domain: "Desatenção", score: inattention, classification: result.inattentionResult },
            { domain: "Hiperatividade/Impulsividade", score: hyperactivity, classification: result.hyperactivityResult },
          ]}
          items={snapQuestions.map((q, i) => ({ question: q, answer: snapLabels[answers[i] ?? 0], value: answers[i] ?? 0 }))}
          patientAge="6-18 anos"
        />`,
  },
  {
    file: 'mchat.tsx',
    itemsCode: `
        <ClinicalReport
          scaleName="M-CHAT-R/F"
          scaleFullName="Modified Checklist for Autism in Toddlers, Revised with Follow-Up"
          totalScore={score}
          maxScore={20}
          classification={result.risk}
          description={result.description}
          items={mchatQuestions.map((q, i) => ({ question: q, answer: answers[i] ? "Sim" : "Não", value: answers[i] ? 1 : 0 }))}
          patientAge="16-30 meses"
        />`,
  },
  {
    file: 'cars.tsx',
    itemsCode: `
        <ClinicalReport
          scaleName="CARS"
          scaleFullName="Childhood Autism Rating Scale"
          totalScore={score}
          maxScore={60}
          classification={result.classification}
          description={result.description}
          items={carsItems.map((item, i) => ({ question: item.title, answer: String(answers[i] ?? 1), value: answers[i] ?? 1 }))}
          patientAge="≥ 2 anos"
        />`,
  },
  {
    file: 'sdq.tsx',
    itemsCode: `
        <ClinicalReport
          scaleName="SDQ"
          scaleFullName="Strengths and Difficulties Questionnaire"
          totalScore={result.total}
          maxScore={40}
          classification={result.classification}
          description={result.description}
          domainResults={result.subscales.map(s => ({ domain: s.name, score: s.score, classification: s.classification }))}
          items={sdqQuestions.map((q, i) => ({ question: q, answer: sdqLabels[answers[i] ?? 0], value: answers[i] ?? 0 }))}
          patientAge="4-17 anos"
        />`,
  },
  {
    file: 'scared.tsx',
    itemsCode: `
        <ClinicalReport
          scaleName="SCARED"
          scaleFullName="Screen for Child Anxiety Related Disorders"
          totalScore={totalScore}
          maxScore={82}
          classification={result.classification}
          description={result.description}
          domainResults={Object.entries(subscaleScores).map(([name, score]) => ({ domain: name, score, classification: score >= (name === "Pânico" ? 7 : name === "Ansiedade Generalizada" ? 9 : name === "Ansiedade Separação" ? 5 : name === "Fobia Social" ? 8 : 3) ? "Elevado" : "Normal" }))}
          items={scaredQuestions.map((q, i) => ({ question: q, answer: scaredLabels[answers[i] ?? 0], value: answers[i] ?? 0 }))}
          patientAge="8-18 anos"
        />`,
  },
  {
    file: 'conners.tsx',
    itemsCode: `
        <ClinicalReport
          scaleName="Conners Abreviada"
          scaleFullName="Conners Rating Scales — Abbreviated"
          totalScore={totalScore}
          maxScore={30}
          classification={result.classification}
          description={result.description}
          items={connersQuestions.map((q, i) => ({ question: q, answer: connersLabels[answers[i] ?? 0], value: answers[i] ?? 0 }))}
          patientAge="6-18 anos"
        />`,
  },
  {
    file: 'vineland.tsx',
    itemsCode: `
        <ClinicalReport
          scaleName="Vineland-3"
          scaleFullName="Vineland Adaptive Behavior Scales — Third Edition"
          totalScore={totalScore}
          classification={result.classification}
          description={result.description}
          domainResults={Object.entries(domainScores).map(([name, d]) => ({ domain: name, score: d.score, classification: d.score >= d.maxScore * 0.7 ? "Adequado" : d.score >= d.maxScore * 0.4 ? "Moderadamente Baixo" : "Baixo" }))}
          items={vinelandDomains.flatMap(d => d.items.map((item, i) => ({ question: item, answer: String(answers[d.name + "-" + i] ?? 0), value: answers[d.name + "-" + i] ?? 0 })))}
          patientAge="0-90 anos"
        />`,
  },
  {
    file: 'cdi2.tsx',
    itemsCode: `
        <ClinicalReport
          scaleName="CDI-2"
          scaleFullName="Children's Depression Inventory 2"
          totalScore={sum}
          maxScore={cdi2Items.length * 2}
          classification={result.classification}
          description={result.description}
          items={cdi2Items.map((item, i) => ({ question: item.options[0], answer: item.options[answers[i] ?? 0], value: answers[i] ?? 0 }))}
          patientAge="7-17 anos"
        />`,
  },
  {
    file: 'phqa.tsx',
    itemsCode: `
        <ClinicalReport
          scaleName="PHQ-A"
          scaleFullName="Patient Health Questionnaire for Adolescents"
          totalScore={sum}
          maxScore={phqaQuestions.length * 3}
          classification={result.classification}
          description={result.description}
          items={phqaQuestions.map((q, i) => ({ question: q, answer: phqaLabels[answers[i] ?? 0], value: answers[i] ?? 0 }))}
          patientAge="12-17 anos"
        />`,
  },
  {
    file: 'cssrs.tsx',
    itemsCode: `
        <ClinicalReport
          scaleName="C-SSRS"
          scaleFullName="Columbia Suicide Severity Rating Scale"
          totalScore={result.level}
          maxScore={6}
          classification={result.classification}
          description={result.description}
          items={cssrsQuestions.map((q, i) => ({ question: q, answer: answers[i] ? "Sim" : "Não", value: answers[i] ? 1 : 0 }))}
          patientAge="≥ 6 anos"
        />`,
  },
  {
    file: 'crafft.tsx',
    itemsCode: `
        <ClinicalReport
          scaleName="CRAFFT"
          scaleFullName="Car, Relax, Alone, Forget, Friends, Trouble"
          totalScore={score}
          maxScore={6}
          classification={result.classification}
          description={result.description}
          items={crafftQuestions.map((q, i) => ({ question: q, answer: answers[i] ? "Sim" : "Não", value: answers[i] ? 1 : 0 }))}
          patientAge="12-21 anos"
        />`,
  },
  {
    file: 'ygtss.tsx',
    itemsCode: `
        <ClinicalReport
          scaleName="YGTSS"
          scaleFullName="Yale Global Tic Severity Scale"
          totalScore={result.globalScore}
          maxScore={100}
          classification={result.severity}
          description={result.description}
          domainResults={[
            { domain: "Tics Motores", score: result.motorScore, classification: result.motorScore <= 10 ? "Leve" : result.motorScore <= 20 ? "Moderado" : "Grave" },
            { domain: "Tics Vocais", score: result.vocalScore, classification: result.vocalScore <= 10 ? "Leve" : result.vocalScore <= 20 ? "Moderado" : "Grave" },
            { domain: "Impacto Funcional", score: result.impairment, classification: result.impairment <= 10 ? "Leve" : result.impairment <= 30 ? "Moderado" : "Grave" },
          ]}
          items={ygtssItems.map((item, i) => ({ question: item.label || item.title || ("Item " + (i+1)), answer: String(answers[i] ?? 0), value: answers[i] ?? 0 }))}
          patientAge="5-18 anos"
        />`,
  },
  {
    file: 'ecar-si.tsx',
    itemsCode: `
        <ClinicalReport
          scaleName="ECAR-SI J26"
          scaleFullName="Escala de Avaliação de Risco de Autoagressão e Suicidalidade Infantil"
          totalScore={finalScore}
          classification={result.classification}
          description={result.description}
          domainResults={result.domainResults.map(dr => ({ domain: dr.domain, score: dr.score, classification: dr.classification }))}
          items={allItems.map(item => ({ question: item.text, answer: String(answers[item.key] ?? 0), value: answers[item.key] ?? 0 }))}
          patientAge="6-17 anos"
        />`,
  },
  {
    file: 'eaah.tsx',
    itemsCode: `
        <ClinicalReport
          scaleName="EAAH-J26"
          scaleFullName="Escala de Autoagressividade e Heteroagressividade"
          totalScore={finalScore}
          classification={result.classification}
          description={result.description}
          domainResults={result.domainResults.map(dr => ({ domain: dr.domain, score: dr.score, classification: dr.classification }))}
          items={allItems.map(item => ({ question: item.text, answer: String(answers[item.key] ?? 0), value: answers[item.key] ?? 0 }))}
          patientAge="4-17 anos"
        />`,
  },
];

let successCount = 0;
let errorCount = 0;

for (const scale of scales) {
  const filePath = path.join(pagesDir, scale.file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`SKIP: ${scale.file} not found`);
    continue;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Skip if already has ClinicalReport
  if (content.includes('ClinicalReport')) {
    console.log(`SKIP: ${scale.file} already has ClinicalReport`);
    continue;
  }
  
  // 1. Add import for ClinicalReport
  const importLine = 'import { ClinicalReport } from "@/components/ClinicalReport";';
  
  // Find the last import line
  const lines = content.split('\n');
  let lastImportIdx = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('import ') || lines[i].startsWith('import{')) {
      lastImportIdx = i;
    }
  }
  lines.splice(lastImportIdx + 1, 0, importLine);
  content = lines.join('\n');
  
  // 2. Insert ClinicalReport just before <SaveToPatient
  const saveToPatientIdx = content.indexOf('<SaveToPatient');
  if (saveToPatientIdx === -1) {
    console.log(`WARN: ${scale.file} has no <SaveToPatient`);
    errorCount++;
    continue;
  }
  
  content = content.slice(0, saveToPatientIdx) + scale.itemsCode + '\n        ' + content.slice(saveToPatientIdx);
  
  fs.writeFileSync(filePath, content);
  console.log(`OK: ${scale.file}`);
  successCount++;
}

console.log(`\nDone: ${successCount} updated, ${errorCount} errors`);
