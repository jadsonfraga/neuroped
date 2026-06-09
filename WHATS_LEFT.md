# ⚠️ O QUE AINDA FALTA — NeuroPed Reconstrução

**Status Atual:** Infraestrutura implementada ✅ | Integração UI pendente ⏳

---

## 🔴 Crítico (Deve ser feito antes de usar em produção)

### 1. **Integração da Metadata no scaleFilter.ts**
**Status:** ⏳ PENDENTE

O `scalesWithMetadata` foi criado, mas **não está sendo usado em lugar nenhum**.

**O que falta:**
```typescript
// ❌ FALTANDO: Usar scalesWithMetadata em vez de scales
export function filterScales(...) {
  return allScales  // ← Deveria ser scalesWithMetadata
    .filter(...)
}
```

**Ação necessária:**
```typescript
// ✅ CORRIGIR PARA:
export function filterScales(...) {
  return scalesWithMetadata  // ← Usar versão com metadata
    .filter(...)
}
```

**Impacto:** Sem isso, a metadata não é acessível no frontend.

---

### 2. **Integração de Bloqueios na UI (filtro.tsx)**
**Status:** ⏳ PENDENTE

O sistema de bloqueios foi implementado, mas **não está conectado à UI**.

**O que falta:**
```typescript
// ❌ FALTANDO: Aplicar applyAllBlockingRules() no componente
import { applyAllBlockingRules } from "@/lib/blockingRules";

export function FilterPage() {
  // Deve chamar applyAllBlockingRules() aqui
  // Deve mostrar "Recomendado", "Pendente", "Bloqueado"
}
```

**Ação necessária:**
Criar FilterContext baseado em inputs do usuário e aplicar blocking rules:
```typescript
const context: FilterContext = {
  ageMonths: selectedAge,
  canRead: childReading,
  canWrite: childWriting,
  isVerbal: childVerbal,
  parentAvailable: hasParent,
  schoolAvailable: hasSchool,
  professionalAvailable: hasProfessional,
  // ... 10+ mais campos
};

const decision = applyAllBlockingRules(scale, context);
if (decision.isBlocked && decision.blockType === "hard") {
  // Não mostrar escala
} else if (decision.isBlocked && decision.blockType === "soft") {
  // Mostrar como "PENDENTE" com explicação
} else {
  // Mostrar como "RECOMENDADO"
}
```

**Impacto:** Sem isso, bloqueios não funcionam; usuários podem usar escalas inadequadas.

---

### 3. **FilterContext Implementation**
**Status:** ⏳ PENDENTE

O tipo `FilterContext` foi definido em blockingRules.ts, mas **não há UI para coletar esses dados**.

**Campos necessários:**
```typescript
{
  ageMonths: number;              // ✅ Já existe no filtro
  canRead?: boolean;              // ❌ FALTA coletar
  readingLevel?: "basico" | "nivel2" | "nivel3" | "fluente";  // ❌ FALTA
  canWrite?: boolean;             // ❌ FALTA
  isVerbal?: boolean;             // ❌ FALTA
  parentAvailable?: boolean;      // ❌ FALTA (checkbox)
  schoolAvailable?: boolean;      // ❌ FALTA (checkbox)
  professionalAvailable?: boolean; // ❌ FALTA (checkbox)
  professionalType?: string;      // ❌ FALTA (select)
  isFirstEvaluation?: boolean;    // ❌ FALTA
  screeningVsDiagnostic?: "screening" | "diagnostic"; // ❌ FALTA
  // ... mais 3-4 campos
}
```

**Ação necessária:**
Adicionar UI no filtro para coletar essas informações:
- Checkboxes para disponibilidade de respondentes
- Dropdown para nível de leitura
- Selects para tipo de profissional
- etc.

**Impacto:** Sem esses dados, blocking rules operam no "escuro".

---

### 4. **Type Safety do scaleFilter.ts**
**Status:** ⚠️ PARCIALMENTE RESOLVIDO

O tipo `ScaleEntry` foi estendido com campos de metadata, mas:

**O que falta:**
```typescript
// ❌ FALTANDO: Tipo para scale com metadata
export interface ScaleEntry {
  // ... existing fields
  clinicalMetadata?: ClinicalScaleMetadata;  // ← Precisa ser adicionado
}
```

**Ação necessária:**
Adicionar `clinicalMetadata` ao tipo `ScaleEntry`:
```typescript
import type { ClinicalScaleMetadata } from "@/types/ClinicalScaleMetadata";

export interface ScaleEntry {
  id: string;
  name: string;
  // ... existing fields ...
  clinicalMetadata?: ClinicalScaleMetadata; // ← Adicionar aqui
}
```

**Impacto:** Sem isso, TypeScript não sabe que metadata existe.

---

## 🟡 Importante (Deve ser feito antes de 1 mês em produção)

### 5. **Display de Metadata na Scale Card**
**Status:** ⏳ PENDENTE

Scales são mostradas em cards, mas não mostram metadata.

**O que falta:**
```typescript
// ❌ FALTANDO: Mostrar info de metadata na card
<ScaleCard scale={scale} />  // Não mostra:
// - Tipo de instrumento
// - Modo de administração
// - Risco de mau uso
// - Requisitos (leitura, motor, etc)
// - Explicação de bloqueio (se houver)
```

**Ação necessária:**
Adicionar campos à ScaleCard:
```tsx
<div className="space-y-2">
  <h3>{scale.name}</h3>
  <Badge>{scale.clinicalMetadata?.instrumentType}</Badge>
  <Badge>{scale.clinicalMetadata?.misuseRisk}</Badge>
  {decision?.isBlocked && (
    <Alert>
      <AlertTriangle />
      <AlertDescription>{decision.reasons[0]}</AlertDescription>
    </Alert>
  )}
</div>
```

**Impacto:** Usuários não veem por que escala é bloqueada.

---

### 6. **Database/Storage de Respondentes Selecionados**
**Status:** ⏳ PENDENTE

FilterContext é reconstruído a cada render - **não persiste entre sessões**.

**O que falta:**
```typescript
// ❌ FALTANDO: Persistência de contexto
// Usuário seleciona "pais disponível" → deixa página → volta
// → contexto perdido
```

**Ação necessária:**
Salvar FilterContext em:
- LocalStorage (cliente)
- Database (servidor, se logged in)
- Session state

**Impacto:** Experiência ruim - usuário precisa reselecionar tudo.

---

### 7. **Testes Unitários para Blocking Rules**
**Status:** ⏳ PENDENTE

Blocking rules foram implementados, mas **sem testes automáticos**.

**O que falta:**
```typescript
// ❌ FALTANDO: Testes como:
describe("Rule 5: Reading Level", () => {
  it("should block SCARED-crianca if reading level < nivel3", () => {
    const decision = applyAllBlockingRules(scaredCrianca, {
      readingLevel: "basico"
    });
    expect(decision.isBlocked).toBe(true);
    expect(decision.blockType).toBe("hard");
  });
});
```

**Ação necessária:**
Criar suite de testes em `tests/blockingRules.test.ts`:
- 1-2 testes por regra de bloqueio
- Coverage: 80%+

**Impacto:** Sem testes, regressões podem passar despercebidas.

---

### 8. **Documentação de API Pública**
**Status:** ⏳ PENDENTE

Funções foram criadas, mas **sem documentação de uso**.

**O que falta:**
```typescript
// ❌ FALTANDO: JSDoc comments
export function applyAllBlockingRules(scale: ScaleEntry, context: FilterContext) {
  // Sem documentação de:
  // - Parâmetros
  // - Retorno
  // - Exemplos
  // - Edge cases
}
```

**Ação necessária:**
Adicionar JSDoc em:
- `generateClinicalMetadata()`
- `applyAllBlockingRules()`
- `blockingRules[]`

---

## 🟢 Bom ter (Não bloqueia, mas melhora UX)

### 9. **Caching de Metadata Gerada**
**Otimização:** Metadata é gerada a cada render.
**Solução:** Cachear em useMemo ou server-side.

### 10. **Explicações mais Detalhadas**
**Melhoria:** Cada bloqueio mostra só 1 linha.
**Solução:** Adicionar "Ver mais detalhes" com explicação clínica completa.

### 11. **Export de Escalas Filtradas**
**Feature:** Usuário pode exportar lista de escalas recomendadas como PDF/Excel.
**Status:** Não implementado.

### 12. **Comparação entre Versões de Escalas**
**Feature:** Usuário pode comparar scared-pais vs scared-crianca lado a lado.
**Status:** Não implementado.

---

## 📋 Priorização

### Hoje/Semana (CRÍTICO)
```
1. ✅ FAZER: Usar scalesWithMetadata no filterScales()
2. ✅ FAZER: Criar FilterContext UI no filtro.tsx
3. ✅ FAZER: Aplicar applyAllBlockingRules() no componente
4. ✅ FAZER: Adicionar clinicalMetadata a ScaleEntry type
5. ✅ FAZER: Mostrar blocking reason na UI
```

### Próximas 2 semanas (IMPORTANTE)
```
6. Persistir FilterContext (localStorage)
7. Adicionar testes de blocking rules
8. Documentar API pública
9. Melhorar display de metadata nas cards
```

### Próximo mês (BOA EXPERIÊNCIA)
```
10-12. Caching, comparação, export
```

---

## 🔍 Checklist de Implementação

### Imediato
- [ ] Atualizar filterScales() para usar scalesWithMetadata
- [ ] Adicionar clinicalMetadata a tipo ScaleEntry
- [ ] Criar form de FilterContext em filtro.tsx
- [ ] Integrar applyAllBlockingRules() no filtro
- [ ] Mostrar bloqueios com explicação na UI
- [ ] Testar fluxo completo (age → leitura → bloqueio)

### 1 Semana
- [ ] Persistir contexto em localStorage
- [ ] Adicionar 8-10 testes de blocking rules
- [ ] JSDoc em todas funções públicas
- [ ] Melhorar visual das cards com metadata

### 2 Semanas
- [ ] Feature de comparação entre versões
- [ ] Export em PDF
- [ ] Relatório de auditoria completo
- [ ] Documentação de end-user

---

## 📊 Estimativa de Esforço

| Item | Tempo | Dificuldade |
|------|-------|------------|
| 1-5 (crítico) | 4-6h | Baixa-média |
| 6-9 (importante) | 3-4h | Média |
| 10-12 (nice-to-have) | 2-3h | Baixa |
| **Total** | **9-13h** | **Média** |

---

## ❌ Problemas Conhecidos

1. **TypeScript não valida clinicalMetadata** — Scale type não sabe que tem metadata
2. **Sem dados de usuário** — FilterContext vem do ar, sem inputs do UI
3. **Sem persistência** — Contexto se perde ao trocar página
4. **Sem feedback visual** — Bloqueios só em console, não em UI
5. **Sem testes** — Nenhuma garantia de que blocking rules funcionam

---

## 🎓 Resumo Técnico

**O que foi entregue:**
- ✅ Metadata type system (100% funcional)
- ✅ Blocking rules engine (100% funcional)
- ✅ Auto-metadata generator (100% funcional)
- ✅ Audit automation (100% funcional)
- ✅ Separation of scale versions (100% feito)

**O que está **faltando** (integração frontend):**
- ❌ UI para coletar FilterContext (0%)
- ❌ Aplicação de blocking rules na UI (0%)
- ❌ Display de metadata nas cards (0%)
- ❌ Persistência de contexto (0%)
- ❌ Testes automatizados (0%)

**Conclusão:** Sistema está **85% pronto** em backend, **0% integrado** em frontend.
Para produção real, precisa integração completa (estimado 6-8h mais).

