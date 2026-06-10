# Guia de Integração — 230+ Escalas no NeuroPed

## ⚡ Quick Start

### 1. Filtrar escalas por queixa (Frontend)

```typescript
import { scales } from "@/data/scaleFilter";
import { escalasImportadas230Plus } from "@/data/escalasImportadas230Plus";

// Combinar escalas existentes com as 230 novas
const allScales = [...scales, ...escalasImportadas230Plus];

// Filtrar por queixa clínica
function filterByComplaint(complaint: string) {
  return allScales.filter(scale => scale.queixas.includes(complaint));
}

// Exemplo: Mostrar todas as escalas para "dor"
const painScales = filterByComplaint("dor");
console.log(painScales); // ≈ 10-30 escalas relacionadas a dor
```

### 2. Renderizar perguntas de uma escala

```typescript
import { getScaleMetadata, getScaleQuestions } from "@/data/scaleQuestions";

function renderScale(scaleId: string) {
  const metadata = getScaleMetadata(scaleId);
  const questions = getScaleQuestions(scaleId);
  
  if (!metadata || !questions) {
    return <div>Escala não encontrada</div>;
  }
  
  return (
    <form>
      <h1>{metadata.fullName}</h1>
      <p>Tempo estimado: {metadata.estimatedTime}</p>
      
      {questions.map(question => (
        <div key={question.id}>
          <label>{question.itemNumber}. {question.text}</label>
          
          {question.answerType === "yes_no" && (
            <select name={question.id}>
              {question.options?.map(opt => (
                <option key={opt.id} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}
          
          {question.answerType === "likert_5" && (
            <div className="likert">
              {question.options?.map(opt => (
                <label key={opt.id}>
                  <input type="radio" name={question.id} value={opt.value} />
                  {opt.label}
                </label>
              ))}
            </div>
          )}
          
          {question.help && <small>{question.help}</small>}
        </div>
      ))}
    </form>
  );
}
```

### 3. Calcular escore e gerar relatório

```typescript
import { generateScaleReportHTML } from "@/server/services/pdf-generator";
import { getScaleMetadata } from "@/data/scaleQuestions";

async function submitScale(scaleId: string, answers: Record<string, number>) {
  const metadata = getScaleMetadata(scaleId);
  
  // Calcular escore total
  const totalScore = Object.values(answers).reduce((a, b) => a + b, 0);
  
  // Encontrar classificação
  const cutoff = metadata?.scoringCutoffs?.find(
    c => totalScore >= c.minScore && totalScore <= c.maxScore
  );
  
  // Preparar dados para relatório
  const reportData = {
    scaleId,
    scaleName: metadata?.name || "",
    scaleFullName: metadata?.fullName || "",
    totalScore,
    maxScore: metadata?.maxScore || 0,
    classification: cutoff?.classification || "Desconhecido",
    description: cutoff?.description || "",
    answers: metadata?.questions?.map(q => ({
      itemNumber: q.itemNumber,
      question: q.text,
      answer: q.options?.find(o => o.value === answers[q.id])?.label || "",
      value: answers[q.id],
    })) || [],
    metadata,
    options: {
      patientName: "João Silva",
      patientAge: "8 anos",
      applicationDate: new Date().toLocaleDateString("pt-BR"),
    },
  };
  
  // Gerar HTML
  const html = generateScaleReportHTML(reportData);
  
  // Opção 1: Abrir em nova aba
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  window.open(url);
  
  // Opção 2: Salvar em banco de dados
  await fetch("/api/scales/result", {
    method: "POST",
    body: JSON.stringify({
      patientId: "patient-123",
      ...reportData,
    }),
  });
}
```

### 4. Integração com banco de dados (Backend)

```typescript
// server/routes.ts

import { db } from "@/server/lib/db";
import { scaleResults } from "@/shared/schema";
import { generateScaleReportHTML } from "@/server/services/pdf-generator";

router.post("/api/scales/result", async (req, res) => {
  const { patientId, scaleId, totalScore, answers, options } = req.body;
  
  // Salvar no banco
  const result = await db.insert(scaleResults).values({
    patientId,
    appliedByUserId: req.user.id,
    scaleName: options.scaleName,
    answers: JSON.stringify(answers),
    totalScore,
    classification: options.classification,
    patientAge: options.patientAge,
  });
  
  // Gerar relatório HTML
  const html = generateScaleReportHTML({
    ...options,
    scaleId,
  });
  
  res.json({
    success: true,
    scaleResultId: result.id,
    reportHtml: html,
  });
});

// GET /api/scales/:scaleId/metadata
router.get("/api/scales/:scaleId/metadata", (req, res) => {
  const { scaleId } = req.params;
  const metadata = getScaleMetadata(scaleId);
  
  if (!metadata) {
    return res.status(404).json({ error: "Scale not found" });
  }
  
  res.json(metadata);
});

// GET /api/scales/by-complaint
router.get("/api/scales/by-complaint", (req, res) => {
  const { complaint, ageMonths, respondent } = req.query;
  
  let filtered = escalasImportadas230Plus;
  
  if (complaint) {
    filtered = filtered.filter(s => s.queixas.includes(complaint as string));
  }
  
  if (ageMonths) {
    const age = Number(ageMonths);
    filtered = filtered.filter(s => age >= s.ageMin && age <= s.ageMax);
  }
  
  if (respondent) {
    filtered = filtered.filter(s => s.respondente.includes(respondent as any));
  }
  
  res.json(filtered);
});
```

## 📦 Estrutura de Diretórios

```
neuroped/
├── data/
│   ├── escalasImportadas230Plus.ts          ← 230 escalas estruturadas
│   ├── scaleQuestions.ts                    ← Perguntas + exemplos
│   ├── scaleFilter.ts                       ← Filtro + queixas
│   └── escalasAutorais.ts                   ← Escalas do Dr. Jadson
│
├── server/
│   ├── services/
│   │   └── pdf-generator.ts                 ← Geração PDF/HTML/CSV
│   ├── routes.ts                            ← Endpoints de escalas
│   └── lib/
│       └── repositories/
│           └── ScaleResultRepository.ts     ← Acesso ao banco
│
├── client/src/
│   ├── pages/
│   │   ├── scales/
│   │   │   ├── [scaleId].tsx               ← Renderizar escala
│   │   │   └── filter.tsx                   ← Filtro inteligente
│   │   └── results/
│   │       └── [scaleResultId].tsx         ← Visualizar resultado
│   │
│   ├── components/
│   │   ├── ScaleRenderer.tsx               ← Renderizador dinâmico
│   │   ├── ScaleQuestion.tsx               ← Questão única
│   │   └── ScaleReportViewer.tsx           ← Visualizador de relatório
│   │
│   └── lib/
│       └── api/
│           └── scales.ts                    ← Cliente HTTP para escalas
│
└── GUIA_INTEGRACAO_ESCALAS.md              ← Este arquivo
```

## 🎯 Padrões de Uso por Contexto Clínico

### Triagem Neonatal (0-3 meses)

```typescript
const neonatalScreeningScales = escalasImportadas230Plus.filter(s =>
  s.ageMin === 0 &&
  s.prioridade === "triagem" &&
  s.queixas.some(q => ["neonatal", "atraso", "motor"].includes(q))
);

// Resultado: NAPI, NNNS, GMA, Bayley, Denver
```

### Avaliação de TEA (16-30 meses)

```typescript
const autismScreening = escalasImportadas230Plus.filter(s =>
  s.ageMin <= 18 &&
  s.ageMax >= 30 &&
  s.queixas.includes("tea")
);

// Resultado: M-CHAT-R/F, Q-CHAT-10, STAT
// Diagnóstico: ADOS-2, ADI-R, CARS-2
```

### Monitoramento de Qualidade de Vida (qualquer condição crônica)

```typescript
const qolScales = escalasImportadas230Plus.filter(s =>
  s.prioridade === "monitorizacao" &&
  (s.queixas.includes("qualidade_vida") ||
   s.queixas.includes("funcionalidade"))
);

// Resultado: PROMIS Global Health, PedsQL, CP QOL, QOLCE, etc.
```

## 🔐 Gerenciamento de Licenças

```typescript
// Escalas que podem ser embarcadas completamente (open)
const freeScales = escalasImportadas230Plus.filter(s => 
  s.licencaUso === "livre"
);

// Escalas que requerem licença
const commercialScales = escalasImportadas230Plus.filter(s =>
  s.licencaUso === "comercial"
);

// Para comercial: mostrar apenas metadados + link para fonte oficial
function renderScale(scaleId: string) {
  const scale = escalasImportadas230Plus.find(s => s.id === scaleId);
  
  if (scale?.licencaUso === "comercial") {
    return (
      <div className="scale-metadata">
        <h2>{scale.fullName}</h2>
        <p>{scale.description}</p>
        <p>⚠️ Escala comercial. Requer licença.</p>
        <a href={`https://official-site.com/${scale.name}`}>
          Obter licença →
        </a>
      </div>
    );
  }
  
  return <ScaleRenderer scaleId={scaleId} />;
}
```

## 📊 Exemplos de Queries SQL

```sql
-- Buscar todas as escalas aplicadas em um paciente
SELECT 
  sr.id,
  sr.scale_name,
  sr.total_score,
  sr.classification,
  sr.created_at
FROM scale_results sr
WHERE sr.patient_id = 'patient-123'
ORDER BY sr.created_at DESC;

-- Contar escalas por categoria clínica
SELECT 
  COUNT(*) as count,
  queixa
FROM (
  SELECT unnest(queixas) as queixa
  FROM escalas_importadas_230
)
GROUP BY queixa
ORDER BY count DESC;

-- Escalas recomendadas por idade
SELECT *
FROM escalas_importadas_230
WHERE age_min <= EXTRACT(MONTH FROM age('2010-06-10'::date, '2008-03-15'::date))
  AND age_max >= EXTRACT(MONTH FROM age('2010-06-10'::date, '2008-03-15'::date))
ORDER BY prioridade, name;
```

## 🧪 Testes Unitários

```typescript
// __tests__/scales.test.ts

describe("Escalas Importadas", () => {
  it("deve ter exatamente 230 escalas", () => {
    expect(escalasImportadas230Plus.length).toBe(230);
  });
  
  it("cada escala deve ter id único", () => {
    const ids = escalasImportadas230Plus.map(s => s.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(escalasImportadas230Plus.length);
  });
  
  it("deve filtrar escalas por idade corretamente", () => {
    const ageMonths = 18;
    const filtered = escalasImportadas230Plus.filter(s =>
      ageMonths >= s.ageMin && ageMonths <= s.ageMax
    );
    expect(filtered.length).toBeGreaterThan(0);
  });
  
  it("deve gerar HTML de relatório válido", () => {
    const html = generateScaleReportHTML({
      scaleId: "scale_001",
      scaleName: "PROMIS Anger",
      scaleFullName: "...",
      totalScore: 15,
      maxScore: 25,
      classification: "Moderado",
      description: "...",
      answers: [],
    });
    
    expect(html).toContain("<html");
    expect(html).toContain("PROMIS Anger");
    expect(html).toContain("15/25");
  });
});
```

## 🚀 Deployment Checklist

- [ ] Todas as 230 escalas validadas em test
- [ ] ScaleQuestions implementado para ≥50 escalas
- [ ] PDF generator com html2pdf/puppeteer
- [ ] Componente ScaleRenderer no React
- [ ] API endpoints para /scales/by-complaint, /scales/:id/metadata
- [ ] Banco de dados scale_results testado
- [ ] Validação de idade/respondente
- [ ] Segurança de licenciamento
- [ ] Testes E2E com casos clínicos reais
- [ ] Documentação para profissionais

## 📞 Suporte

Para dúvidas de integração:
- Veja `/ESCALAS_230_IMPLEMENTACAO.md` para visão geral
- Consulte exemplos em `data/scaleQuestions.ts`
- Teste com: `npm test -- scales.test.ts`

---

**Status**: Pronto para desenvolvimento frontend  
**Próximo**: Implementar <ScaleRenderer /> React component  
**Data**: 2026-06-10
