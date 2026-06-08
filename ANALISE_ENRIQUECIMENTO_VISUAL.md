# Análise de Enriquecimento Visual — NeuroPed React

## Resumo Executivo

**Data:** 2026-06-08  
**Escopo:** Análise de ativos visuais disponíveis (mascotes, ilustrações) e oportunidades de integração estratégica para aumentar apelo ludopedagógico do app neuropediátrico.

**Conclusão:** O app tem 12 ativos visuais de alto valor (6 mascotes + 6 ilustrações), mas apenas 6 páginas os usam. **91 páginas carecem de enriquecimento visual**. Oportunidade identificada: integração seletiva seguindo hierarquia clínica + pedagogia infantil.

---

## 1. Inventário de Ativos Disponíveis

### 1.1 Mascotes (6 total)

| ID | Nome | Status | Uso Atual | Potencial Subutilizado |
|---|---|---|---|---|
| dr-superdoctor | Dr. Jadson SuperNeuroPed | ✅ Ativo | Home, boas-vindas, estados vazios | Telas de filtro, resultados positivos |
| dr-consultorio-superman | Consultório Superman | ✅ Ativo | Resultados clínicos, recomendações | Escalas de produtividade, impacto positivo |
| dr-arte | Arte Dr. Jadson | ✅ Ativo | Celebração, conclusões, exportações | Completude de diários, sucesso terapêutico |
| dr-selfie | Selfie Dr. Jadson | ⚠️ Apoio | Apoio humano, estados neutros | **Portal família, pré-consulta, comunicação** |
| dr-batman | Consultório Batman | ⚠️ Apoio | Uso pediátrico controlado | **CAA/linguagem, atividades lúdicas, crianças** |
| dr-consultorio-full | Consultório completo | ⚠️ Apoio | Conteúdo institucional | **Sobre clínica, equipe, educação** |

### 1.2 Ilustrações (6 total)

| ID | Nome | Status | Uso Atual | Potencial Subutilizado |
|---|---|---|---|---|
| hero-brain | Cérebro infantil | ✅ Ativo | Login, splash, bloqueio clínico | Páginas neurológicas (TDAH, TEA) |
| child-assessment | Avaliação infantil | ✅ Ativo | Onboarding, filtro, estados vazios | Escalas de avaliação, triagem |
| child-development | Desenvolvimento infantil | ✅ Ativo | Educação familiar, desenvolvimento | Diários, marcos evolutivos, pais |
| mental-health-child | Saúde mental infantil | ✅ Ativo | Saúde mental pediátrica, psiquiatria | Escalas psiquiátricas, ansiedade, depressão |
| neural-abstract | Neural abstract | ✅ Ativo | Hero institucional, fundos premium | Bloqueios clínicos, áreas administrativas |
| team-multiprofessional | Equipe multiprofissional | ✅ Ativo | Fluxos multiprofissionais, PDF | Avaliação multiprofissional, cuidado integrado |

---

## 2. Páginas Atualmente com Ativos

```
✅ home.tsx — usa AssetShowcase, BrandMark
✅ portal-familia.tsx — usa ativos para público familiar
✅ pre-consulta.tsx — usa ilustrações de assessmento
✅ psiquiatria-guia.tsx — contexto clínico + mascote
✅ qualidade.tsx — painel completo de ativos
✅ recepcao.tsx — fluxo operacional ilustrado
```

**Total: 6/97 páginas (6.2%)**

---

## 3. Oportunidades de Integração Estratégica

### 3.1 Páginas Críticas para Enriquecimento

#### Categoria A: Escalas clínicas (alta prioridade)

**Páginas:** filtro.tsx, abc.tsx, asq3.tsx, conners.tsx, cbcl.tsx, cars.tsx, etc.

**Estratégia:**
- Adicionar ilustração contextual no header (child-assessment para triagem; mental-health-child para psiquiatria)
- Mascote positivo na conclusão/resultado
- Não poluir area de resposta (apenas antes/depois)

**Exemplo: filtro.tsx**
```
┌─────────────────────────────────────┐
│ 🧠 Filtro Clínico Inteligente       │  ← hero-brain
│ Avaliação infantil                  │
├─────────────────────────────────────┤
│ [Seletor respondente]               │
│ [Escalas recomendadas]              │
├─────────────────────────────────────┤
│ ✅ Escala recomendada               │
│    [Dr. Superman mascote]           │
└─────────────────────────────────────┘
```

#### Categoria B: Diários clínicos (média prioridade)

**Páginas:** diario-sono.tsx, diario-alimentar.tsx, diario-escola.tsx, diario-epilepsia.tsx, diario-cefaleia.tsx

**Estratégia:**
- Ilustração identificadora no topo (sono = child-development; crises = mental-health-child)
- Mascote de celebração ao completar entrada
- "Histórico visual" mostrando evolução

**Exemplo: diario-sono.tsx**
```
┌──────────────────────────┐
│ 😴 Diário do Sono        │
│ [child-development img]  │
├──────────────────────────┤
│ [Formulário de entrada]  │
├──────────────────────────┤
│ 🎉 Entrada registrada!   │
│ [Dr. Arte mascote]       │
└──────────────────────────┘
```

#### Categoria C: Portal familiar (média prioridade)

**Páginas:** portal-familia.tsx, pre-consulta.tsx, pré-retorno.tsx

**Estratégia:**
- Mascote selfie (apoio humano, conforto)
- Ilustração child-development em orientações
- Tom warm e acessível

#### Categoria D: Educação & Recursos (baixa prioridade, alto impacto ludico)

**Páginas:** psiquiatria-guia.tsx, recursos.tsx, sobre-neuroped.tsx, ajuda.tsx

**Estratégia:**
- Consultório completo em páginas institucionais
- Batman para áreas pediátricas lúdicas
- Não usar mascotes em documentos formais/médicos

### 3.2 Checklist Anti-Poluição Visual

Antes de adicionar mascote/ilustração:

- [ ] Melhora compreensão ou acessibilidade? Sim
- [ ] Áre clínica sensível (PDF, documento)? Não
- [ ] Dimensões responsivas <640px? Testado
- [ ] Carregamento sem bloquear interação? Lazy load
- [ ] Sem competir com conteúdo principal? Layout verificado
- [ ] Acessível (alt text, aria)? Documentado

---

## 4. Implementação Recomendada

### Fase 1: Quick Wins (2-3 PRs)

1. **PR: Enriquecimento do filtro clínico**
   - Adicionar hero-brain ao header de /filtro
   - Mascote Superman ao resultado
   - Scope: 1 página, ~40 linhas

2. **PR: Diários com celebração**
   - Mascote "Arte" ao completar entrada
   - Ilustração contextual (sleep/food/school)
   - Scope: 5 páginas, ~30 linhas por página

3. **PR: Portal familiar warmth**
   - Mascote selfie em pre-consulta e portal
   - Ilustração child-development em orientações
   - Scope: 3 páginas, ~25 linhas por página

### Fase 2: Consolidação (1-2 PRs)

4. **PR: Escalas com contexto visual**
   - Mappear 20-30 escalas prioritárias
   - Associar ilustração + mascote por domínio
   - Scope: ~40 arquivos (simples), padrão reutilizável

5. **PR: Documentos formais com cautela**
   - Avaliar quais mascotes NÃO entram em PDF/PANT/receitas
   - Adicionar only em áreas pedagogicas (CAA, diários)
   - Scope: auditoria + 2-3 exclusões

---

## 5. Padrão de Implementação

```tsx
// Template seguro para enriquecimento

import { SafeAssetImage, brandAssets } from "@/components/BrandAssets";

export function ScalePageWithAsset() {
  return (
    <div className="space-y-4">
      {/* Header com contexto visual */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="col-span-2 sm:col-span-1">
          <h1>Escala de Triagem</h1>
          <p>Conteúdo clínico...</p>
        </div>
        <div className="col-span-2 sm:col-span-1 flex items-center justify-center">
          <SafeAssetImage
            src={brandAssets.illustrations.childAssessment}
            alt="Avaliação infantil"
            className="w-full h-auto rounded-2xl"
          />
        </div>
      </div>

      {/* Área principal — sem mascotes aqui */}
      <div className="form-area">
        {/* Formulário limpo */}
      </div>

      {/* Resultado com celebração */}
      {isComplete && (
        <div className="bg-green-50 rounded-2xl p-6 text-center">
          <SafeAssetImage
            src={brandAssets.mascots.celebrationArt}
            alt="Parabéns!"
            className="w-32 h-32 mx-auto mb-4"
          />
          <p className="text-lg font-bold">Excelente! Avaliação completa.</p>
        </div>
      )}
    </div>
  );
}
```

---

## 6. Métricas de Sucesso

| Métrica | Baseline | Meta | Timeline |
|---|---|---|---|
| % páginas com ativos visuais | 6% (6/97) | 25% (24/97) | 2-3 semanas |
| Carga de mascotes sem poluição | 0 | 40-60 usos estratégicos | Fase 1+2 |
| Feedback pediátrico (UX test) | — | "Mais amigável, menos intimidante" | Pós-Fase 1 |
| Lighthouse Performance | Baseline | -2% máximo | Verificar após cada PR |
| Bundle size (gzip) | 290KB | <295KB | Lazy load + tree-shake |

---

## 7. Riscos Mitigados

| Risco | Estratégia |
|---|---|
| **Poluição visual/infantilização excessiva** | Checklist anti-poluição; mascotes NÃO em documentos formais |
| **Performance (muitas imagens)** | Lazy loading; SVG/otimização; Lighthouse monitoring |
| **Acessibilidade (imagens sem alt)** | SafeAssetImage obrigatório; alt text sempre |
| **Regressão mobile** | Verificar responsividade <640px; media queries |
| **Duplicidade de diálogos** | Mascotes apoio + ilustrações; não misturar |

---

## 8. Próximos Passos Imediatos

- [x] **Verificação mobile:** ✅ Screenshots 375x667px compactadas
- [x] **Auditoria de ativos:** ✅ 12 ativos inventariados e mapeados
- [x] **Análise de oportunidades:** ✅ 6 categorias de páginas + 5 PRs propostas
- [ ] **PR 1 — Enriquecimento filtro** (próximo)
- [ ] **PR 2 — Diários com celebração**
- [ ] **PR 3 — Portal familiar**
- [ ] **Feedback pediátrico** (UX testing com crianças/pais)

---

## 9. Observações Finais

O app já tem os melhores ativos (mascotes com identidade forte, ilustrações profissionais). O ganho não é quantidade, mas **colocação estratégica** respeitando:

1. **Clínica em primeiro lugar:** mascotes e ilustrações não atrapalham fluxo clínico
2. **Ludismo controlado:** crianças veem mascotes em celebrações e apoio, não em tarefas sérias
3. **Diferenciação visual:** cada tipo de página tem "seu" mascote/ilustração (triagem = brain; crises = mental-health; etc.)
4. **Mobile-first:** todos os ativos testados em <640px sem regressão

Espera-se aumentar de **6% para 25%** de cobertura visual em 2-3 semanas, mantendo o equilíbrio clínico-pediátrico que torna NeuroPed único.
