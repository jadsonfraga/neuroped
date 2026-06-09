# 🗺️ ROADMAP: BLOCOs 3-6 (Funcionalidades → UI/UX)

Após conclusão de **BLOCO 1 (Performance)** e **BLOCO 2 (Qualidade)**, esta é a estratégia para os blocos finais.

---

## 📊 VISÃO GERAL

| BLOCO | Categoria | Atual | Meta | Esforço | Criticidade |
|-------|-----------|-------|------|---------|------------|
| **3** | Funcionalidades Clínicas | 7.2/10 | 8.0/10 | 🟠 Alto (1 sem) | 🔴 Alta |
| **4** | Escalas Clínicas | 7.7/10 | 8.0/10 | 🟡 Médio (5 dias) | 🟡 Média |
| **5** | Infraestrutura Backend | 7.8/10 | 8.0/10 | 🟢 Baixo (2 dias) | 🟢 Baixa |
| **6** | Frontend & UI/UX | 7.8/10 | 8.0/10 | 🟠 Alto (1 sem) | 🟡 Média |

**Total Restante:** ~2.5 semanas de trabalho

---

## 🟠 BLOCO 3: FUNCIONALIDADES CLÍNICAS (7.2 → 8.0)

### Problema Crítico Nº 4
> Integração multidisciplinar fraca; relatórios/gráficos limitados; features para pacientes básicas

### Tarefas

#### 3.1 Relatórios e Gráficos (Recharts)
**Arquivo:** `/client/src/components/ScaleCharts/`

```
✅ LongitudinalChart.tsx
   - Evolução de 1 escala over time para 1 paciente
   - X: data | Y: score
   - Exemplo: SCARED score trend

✅ ComparisonChart.tsx
   - Comparação entre 2+ aplicações mesma escala
   - Mostra melhora/piora
   - Exemplo: GAD7 Jan vs Mar vs Jun

✅ DomainBreakdownChart.tsx
   - Scores por domínio (atenção, comportamento, linguagem)
   - Radar chart ou bar chart
   - Visualiza força/fraqueza

✅ ExportChart.tsx
   - Export para PNG/SVG/PDF
   - Incluir em laudo
```

**Critério de Aceitação:**
- [ ] 3+ visualizações funcionais com dados reais
- [ ] Export para PNG/SVG
- [ ] Responsivo (desktop/mobile)

---

#### 3.2 Integração Multidisciplinar
**Arquivo:** `/client/src/features/multidisciplinary/`

```
✅ Model de Dados
   observations: {
     id, paciente_id,
     profissional_tipo (neuro, psicolog, fono, TO),
     profissional_nome,
     observacao_texto,
     timestamp,
     created_by_user_id
   }

✅ UI Components
   - ObservationForm.tsx (criar observação)
   - ObservationPanel.tsx (listar + filtrar por profissional)
   - ObservationHistory.tsx (timeline com autoria)

✅ API Routes
   POST /api/observations (criar)
   GET /api/patients/:id/observations (listar)
   DELETE /api/observations/:id (deletar - author only)
```

**Critério de Aceitação:**
- [ ] 2+ perfis profissionais conseguem anotar
- [ ] Observações com autoria + timestamp
- [ ] Teste: criar observação como Psicólogo, visualizar como Fonoaudiólogo
- [ ] Histórico mantém ordem cronológica

---

#### 3.3 Verbal vs Não-Verbal Completo
**Arquivo:** `/client/src/lib/verbalContext.ts`

```typescript
// Schema expandido (BLOCO 4 fornece metadata)
type VerbalizationType = 
  | "verbal_fluent"           // Conversação complexa
  | "verbal_phrases"          // Frases simples
  | "verbal_words"            // Palavras soltas
  | "verbal_babble"           // Balbucio
  | "nonverbal_gestural"      // Linguagem de sinais/gestos
  | "nonverbal_aac"           // AAC (comunicação alternativa)
  | "nonverbal_visual";       // Visuomotor

// Adaptar recomendações por tipo
// Ex: "nonverbal_gestural" → escalas visuoespaciais
```

**Critério de Aceitação:**
- [ ] Fluxo diferenciado para não-verbal
- [ ] Teste: criança não-verbal → escalas recomendadas sejam visuomotoras
- [ ] Adaptações sugeridas no laudo

---

#### 3.4 Export de Laudo (PDF/DOCX)
**Arquivo:** `/client/src/features/reports/generateReport.ts`

```
Usando: pdfkit + docx library

Estrutura:
  1. Header: NeuroPed | Data | Paciente (nome/DOB anonimizado)
  2. Avaliação: Escalas usadas, scores
  3. Gráficos: Embedados PNG
  4. Observações: Por profissional
  5. Conclusões: Achados clínicos (draft)
  6. Footer: Assinado por (profissional_nome + CRM)

Nome arquivo: AAAA-MM-DD_NOMEPACIENTE_TIPO.pdf
Exemplo: 2026-06-09_AnalisaS_TDAH_Assessment.pdf
```

**Critério de Aceitação:**
- [ ] PDF gerado com dados reais
- [ ] DOCX gerado e editável
- [ ] Gráficos aparecem no laudo
- [ ] Nome arquivo segue padrão

---

### Critério Global de Aceitação BLOCO 3
- [ ] 3+ visualizações funcionais (relatórios)
- [ ] Múltiplos profissionais anotam/visualizam (teste integração)
- [ ] Export PDF/DOCX funciona
- [ ] Verbal vs não-verbal tratado
- [ ] **Métrica:** Funcionalidades 7.2 → **8.0/10** ✅

---

## 🟡 BLOCO 4: SISTEMA DE ESCALAS (7.7 → 8.0)

### Problema Crítico Nº 1
> Metadata de escalas não é granular (~70% precisão)

### Tarefas

#### 4.1 Schema de Metadata Enriquecido
**Arquivo:** `/client/src/types/EnrichedScaleMetadata.ts`

```typescript
interface EnrichedScaleMetadata extends ClinicalScaleMetadata {
  // Novos campos
  respondent_type: "parental" | "self_report" | "professional" | "teacher" | "mixed";
  ideal_respondent: "parental_ideal" | "self_report_ideal" | "both_complementary";
  
  cutoff_scores?: {
    normal: [number, number];
    mild: [number, number];
    moderate: [number, number];
    severe: [number, number];
  };
  
  source_reference: string; // Ex: "DSM-5", "ICD-11"
  validation_status: "validated" | "pending_review" | "not_validated";
  version: string;
  
  // Falta clinical review?
  pending_clinical_review: boolean;
  pending_fields: string[]; // ["cutoff_scores", "validation_status"]
}
```

#### 4.2 Migração das 414+ Escalas
**Arquivo:** `/scripts/migrateScaleMetadata.ts`

```bash
# Script que:
# 1. Carrega todas 414+ escalas
# 2. Para cada uma, preenche novos campos
# 3. Marca campos vazios como "pending_review"
# 4. Gera relatório de completude

npm run migrate:scale-metadata
```

**Output:**
```
Migration complete:
  ✅ 100 escalas com metadata completa (100%)
  ⚠️ 314 escalas com campos pendentes (75%)
  ❌ 0 escalas com erros críticos

Campos mais frequentemente vazios:
  1. cutoff_scores (285 escalas)
  2. validation_status (301 escalas)
  3. source_reference (45 escalas)
```

#### 4.3 Relatório de Completude
**Arquivo:** `/METADATA_COVERAGE.md`

```markdown
# Metadata Coverage Report

| Escala | Respondent | Cutoff | Validation | Pending |
|--------|-----------|--------|------------|---------|
| SCARED-Pais | parental_ideal | 🟢 | 🟢 | — |
| GAD-7 | self_report_ideal | 🟡 | 🔴 | cutoff, validation |
| TDAH-IV | teacher | 🔴 | 🔴 | cutoff, validation, ref |

Resumo:
  100% completo: 100 (24%)
  Parcial: 314 (76%)
  
Bloqueador: Cutoff scores (70% das escalas)
Ação: Dr. Jadson revisar e preencher

[Link para planilha Google para coletar dados clínicos]
```

### Critério Global de Aceitação BLOCO 4
- [ ] Schema novo criado e validado
- [ ] 100% das escalas migradas (campos vazios marcados, não inventados)
- [ ] METADATA_COVERAGE.md gerado
- [ ] Dr. Jadson revisou e aprovou abordagem
- [ ] **Métrica:** Escalas 7.7 → **8.0/10** ✅

---

## 🟢 BLOCO 5: INFRAESTRUTURA BACKEND (7.8 → 8.0)

### Tarefas (2 dias)

#### 5.1 Tratamento de Erros Consistente
**Arquivo:** `/server/lib/errors.ts`

```typescript
// Custom error classes
class ValidationError extends Error { code = 400; }
class NotFoundError extends Error { code = 404; }
class UnauthorizedError extends Error { code = 401; }
class ConflictError extends Error { code = 409; }

// Middleware que converte erros em respostas padrão
app.use((err, req, res, next) => {
  const code = err.code || 500;
  const msg = err.message || "Internal Server Error";
  res.status(code).json({ error: { code, msg } });
});
```

#### 5.2 Validação com Zod
**Arquivo:** `/server/lib/schemas/`

```typescript
// Validar entrada em TODAS as rotas
const createScaleResultSchema = z.object({
  patient_id: z.string().uuid(),
  scale_name: z.string().min(1),
  answers: z.record(z.number().min(0).max(4)),
  total_score: z.number().min(0),
});

// Usage
app.post("/api/scale-results", (req, res) => {
  const validated = createScaleResultSchema.parse(req.body);
  // ...
});
```

#### 5.3 Health Check
**Arquivo:** `/server/routes/health.ts`

```typescript
app.get("/health", async (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    db: "connected",  // Verificar conexão DB
  });
});
```

### Critério Global de Aceitação BLOCO 5
- [ ] Todas rotas validadas com Zod
- [ ] Erros retornam código HTTP correto
- [ ] /health endpoint respondendo
- [ ] **Métrica:** Backend 7.8 → **8.0/10** ✅

---

## 🟠 BLOCO 6: FRONTEND & UI/UX (7.8 → 8.0)

### Tarefas (1 semana)

#### 6.1 Loading/Error/Empty States
**Arquivo:** `/client/src/components/States/`

```
✅ LoadingState.tsx
   - Skeleton loaders
   - Spinner com mensagem
   - Progress bar para uploads

✅ ErrorState.tsx
   - Erro descrição
   - Botão retry
   - Logging do erro

✅ EmptyState.tsx
   - "Nenhuma escala aplicada"
   - CTA: "Aplicar primeira escala"
```

**Onde aplicar:**
- [ ] Listagem de escalas
- [ ] Gráficos
- [ ] Observações multidisciplinares
- [ ] Histórico de paciente

#### 6.2 Acessibilidade (a11y ≥90)
**Checklist:**

- [ ] Labels em inputs (aria-label)
- [ ] Tab navigation funciona
- [ ] Cores com contrast ≥ 4.5:1
- [ ] Teclado-only navegável
- [ ] Lighthouse a11y score ≥90

**Ferramentas:**
```bash
npm run audit:a11y
# Run axe DevTools no navegador
```

#### 6.3 Responsividade
**Breakpoints:**
- [ ] Desktop (1024px+)
- [ ] Tablet (768px-1023px)
- [ ] Mobile (320px-767px)

**Testar:**
- [ ] Filtro em tablet
- [ ] Gráficos responsivos
- [ ] Forms mobile-friendly

### Critério Global de Aceitação BLOCO 6
- [ ] Lighthouse a11y ≥90
- [ ] Loading states em todas as telas principais
- [ ] Responsivo (desktop/tablet/mobile)
- [ ] Teste keyboard navigation
- [ ] **Métrica:** Frontend 7.8 → **8.0/10** ✅

---

## ✅ CHECKLIST FINAL

### Antes de Considerar PRONTO:

```
MÉTRICA GERAL:
 [ ] Infraestrutura Backend: 8.0/10 ✅ (BLOCO 1)
 [ ] Qualidade de Código: 8.1/10 ✅ (BLOCO 2)
 [ ] Funcionalidades Clínicas: 8.0/10 ⏳ (BLOCO 3)
 [ ] Sistema de Escalas: 8.0/10 ⏳ (BLOCO 4)
 [ ] Infraestrutura Backend (errors): 8.0/10 ⏳ (BLOCO 5)
 [ ] Frontend & UI/UX: 8.0/10 ⏳ (BLOCO 6)

GERAL: 7.5 → 8.0+/10 ✅

VALIDAÇÃO TÉCNICA:
 [ ] Build limpo: npm run build:client
 [ ] Audit passa: npm run audit:scales:clinical
 [ ] Lint passa: npm run lint
 [ ] TypeCheck passa: npm run check
 [ ] CI verde: GitHub Actions
 [ ] Type safety: 0 critical errors

VALIDAÇÃO CLÍNICA:
 [ ] Dr. Jadson revisou metadata
 [ ] Scales funcionais em clínica real
 [ ] Nenhum paciente data vazou
 [ ] LGPD compliance mantido

DOCUMENTAÇÃO:
 [ ] BLOCO1_PERFORMANCE.md ✅
 [ ] BLOCO2_QUALIDADE_CODIGO.md ✅
 [ ] BLOCO3_FUNCIONALIDADES.md ⏳
 [ ] BLOCO4_ESCALAS.md ⏳
 [ ] BLOCO5_BACKEND.md ⏳
 [ ] BLOCO6_FRONTEND.md ⏳
 [ ] README atualizado
 [ ] DEPLOYMENT_GUIDE.md criado
```

---

## 🚀 PRÓXIMAS AÇÕES

### Imediato (hoje)
1. ✅ Revisar BLOCO 1 + 2 (completos)
2. ⏳ Começar BLOCO 3 (relatórios + integração)

### This Week
3. ⏳ BLOCO 4 (metadata enriquecida)
4. ⏳ BLOCO 5 (erro handling + validação)

### Next Week
5. ⏳ BLOCO 6 (UI states + a11y)
6. ⏳ Testes integrados completos
7. ⏳ Deploy final para produção

### Go-Live
- [ ] Auditoria final (antes/depois)
- [ ] Load test com Postgres
- [ ] Smoke test em produção
- [ ] Monitoramento ativo (logs, errors)

---

**Coordenação:** Se executado em paralelo, todas 6 blocos podem estar prontos em **10-14 dias**.

Qualquer dúvida, ver arquivo correspondente ou contactar Dr. Jadson para decisões clínicas.

---

**Status Overall:** 2/6 BLOCOs completos | 4 BLOCOs em pipeline  
**Métrica:** 7.5 → 8.0+/10 em progresso 🚀

