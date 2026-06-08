# 🎨 REFINAMENTO VISUAL SUPREMO — Filtro Obra-Prima + Layout Otimizado

**Visão:** Transformar NeuroPed em referência de **estética clínica pediátrica** com aproveitamento inteligente do legado.

---

## SEÇÃO 1: DIAGNÓSTICO DO LAYOUT ATUAL

### Layout Structure (Layout.tsx)
```
┌─────────────────────────────────────────────────┐
│ Header Mobile (h-14, fixed top-0) — MD:HIDDEN  │
├──────┬────────────────────────────────────────┤
│      │                                         │
│ Side │  Main Content                           │
│ bar  │  (md:ml-64 ou md:ml-16)                │
│ (fix │  max-w-[1600px] mx-auto                │
│  ed) │  p-3 md:p-5                            │
│      │                                         │
└──────┴────────────────────────────────────────┘
```

### Current Issues Identificados
- ❌ Sidebar ocupante (264px aberto, 64px fechado)
- ❌ Margem left automática mas conteúdo não otimizado
- ⚠️ Mobile (< 640px): sem sidebar visível, espaço disponível < 375px
- ⚠️ Zoom 75%: espaço disponível ~800px, desperdiçador
- ⚠️ Filtro: componentes empilhados, sem uso de grid/colunas

### Oportunidades
✨ Sidebar oferece espaço negativo para design
✨ Layout pode ser multi-coluna quando espaço disponível
✨ Assets legados podem preencher áreas antes vazias
✨ Zoom 75% é momento perfeito para two-column layout

---

## SEÇÃO 2: REFINAMENTOS VISUAIS DO FILTRO

### Proposta: Filtro Two-Column Layout (Desktop)

```
┌────────────────────────────────────────────────────┐
│ Header: "Filtro Clínico Inteligente"               │
├──────────────────────┬──────────────────────────────┤
│ ESQUERDA:            │ DIREITA:                     │
│ Controles            │ Resultados + Recomendações  │
│                      │                              │
│ ☐ Idade              │ 🥇 OURO                      │
│ [botões de idade]    │ ├─ Escala 1                 │
│                      │ ├─ Motivo                   │
│ ☐ Queixa             │ └─ [Link]                   │
│ [grid de queixa]     │                              │
│                      │ 🥈 PRATA                     │
│ ☐ Respondente        │ ├─ Escala 2                 │
│ [4 botões]           │ └─ [Link]                   │
│                      │                              │
│ [Search Box]         │ 🥉 BRONZE                    │
│                      │ └─ [Link]                   │
│                      │                              │
│ [Mascote: Arte]      │ [Catálogo Resumido]         │
│ (ocupando espaço)    │                              │
└──────────────────────┴──────────────────────────────┘
```

### Implementação

#### Step 1: Media Query para Two-Column
```tsx
// filtro.tsx
export default function FiltroPage() {
  return (
    <div className="page-enter container space-y-4 pb-8">
      {/* Header — Full Width */}
      <header className="col-span-2 ...">
        <h1>Filtro Clínico Inteligente</h1>
      </header>

      {/* Two Column Grid — Desktop Only */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 auto-rows-max">
        
        {/* LEFT COLUMN: Controles (lg:col-span-1) */}
        <section className="space-y-4 lg:sticky lg:top-5">
          {/* Idade */}
          {/* Queixa */}
          {/* Respondente */}
          {/* Search */}
          {/* Mascote */}
        </section>

        {/* RIGHT COLUMN: Resultados (lg:col-span-2) */}
        {hasSearch && (
          <section className="space-y-4 lg:col-span-2">
            {/* Recomendações */}
            {/* Catálogo */}
          </section>
        )}
      </div>
    </div>
  );
}
```

### Step 2: Sticky Controls
```tsx
{/* LEFT COLUMN — Sticky ao scroll */}
<section className="space-y-4 lg:sticky lg:top-5 lg:max-h-[calc(100vh-32px)] lg:overflow-y-auto">
  {/* Controles aqui */}
  {/* Mascote decora o espaço */}
</section>
```

### Step 3: Mascote Inteligente + Assets Legados

```tsx
{/* Espaço ao final dos controles — Mascote que muda com padrão detectado */}
{!hasSearch && (
  <div className="mt-6 flex justify-center lg:block">
    <SafeAssetImage
      src={brandAssets.mascots.superDoctor}  {/* Default: Super */}
      alt="Dr. Jadson SuperNeuroPed — vamos começar?"
      className="w-32 h-auto rounded-2xl shadow-lg"
    />
  </div>
)}

{/* Quando padrão detectado, trocar mascote */}
{detectedPattern && (
  <div className="mt-4 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50">
    <SafeAssetImage
      src={brandAssets.mascots.consultorioSuperman}  {/* Padrão detectado */}
      alt="Dr. Jadson — padrão detectado!"
      className="w-24 h-auto mx-auto mb-2"
    />
    <p className="text-xs text-center font-semibold text-amber-900 dark:text-amber-200">
      🧠 {detectedPattern.name}
    </p>
  </div>
)}
```

---

## SEÇÃO 3: OTIMIZAÇÃO PARA ZOOM 75%

### Layout Math
- **100% zoom, desktop 1024px** → Sidebar 264px + Content 760px = 1024px ✅
- **75% zoom, desktop 1024px** → Effective width = 1365px
  - Sidebar 264px (não escala) + Content 1101px = Muito espaço! ✨
  - **Oportunidade:** Usar grid 4 colunas, reorganizar assets

### Proposta para 75% Zoom
```css
/* Detectar zoom e otimizar layout */
@media (min-width: 1200px) {
  .filtro-container {
    grid-template-columns: 280px 1fr 1fr;  /* Sidebar + Controles + Resultados + Extra */
  }
}

@media (min-width: 1400px) {
  .filtro-container {
    grid-template-columns: 280px 280px 1fr;  /* Mais espaço para assets visuais */
  }
}
```

---

## SEÇÃO 4: INTEGRAÇÃO DE ASSETS LEGADOS

### Mapeamento de Oportunidades

#### 4.1 Filtro Page (/filtro)
- **Mascote Default:** Dr. Jadson SuperNeuroPed (já existe) ✅
- **Quando padrão detectado:** Consultório Superman (resultado positivo)
- **Background Asset:** Neural Abstract (subtle, discreta)
- **Bonus:** Figura pediátrica ao lado dos controles

#### 4.2 Resultados (Recomendações)
```tsx
{/* Card de OURO */}
<Card className="border-amber-300/50">
  <div className="flex gap-4">
    <div className="flex-1">
      <h3>{scale.name}</h3>
      <p>{scale.description}</p>
    </div>
    {/* Asset legado: Superman para sucesso */}
    <SafeAssetImage
      src={brandAssets.mascots.consultorioSuperman}
      alt="Resultado clínico recomendado"
      className="w-24 h-auto flex-shrink-0 hidden sm:block"
    />
  </div>
</Card>
```

#### 4.3 Catálogo Resumido (Bottom)
- **Asset:** Team Multiprofessional (mostra equipe)
- **Contexto:** "100+ escalas mundiais sem custo"
- **Placement:** Card com AssetShowcase integrado

### Checklist Anti-Poluição Visual
- ✅ Máx 1 mascote por seção principal
- ✅ Assets apenas como complementos, não protagonistas
- ✅ Placeholder se asset não carrega (SafeAssetImage)
- ✅ Sem repetição de mesma imagem
- ✅ Opacidade reduzida para assets em background

---

## SEÇÃO 5: ZOOM RESPONSIVENESS TESTING

### Matriz de Testes

| Viewport | Zoom | Effective | Expected | Test |
|----------|------|-----------|----------|------|
| Mobile 375px | 100% | 375px | Single column | ✅ |
| Mobile 375px | 75% | 500px | Single col + wider | Test |
| Tablet 768px | 100% | 768px | 2-col (narrow) | ✅ |
| Tablet 768px | 75% | 1024px | 2-col (comfortable) | Test |
| Desktop 1024px | 100% | 1024px | 2-col | ✅ |
| Desktop 1024px | 75% | 1365px | 3-col possible | **OPTIMIZE** |
| Desktop 1440px | 75% | 1920px | Full 4-col layout | **OPTIMIZE** |

### Responsive Breakpoints Refinados

```tsx
// Atual (inadequado para zoom 75%)
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

// Refinado (respeita zoom)
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
```

---

## SEÇÃO 6: FILTRO COMO OBRA-PRIMA — DETALHES VISUAIS

### 6.1 Micro-Interactions
```tsx
{/* Idade button — ao hover, mostra intervalo */}
<button 
  title="Selecionar faixa etária: 0-6 meses"
  onMouseEnter={() => softHover()}
  className="group relative ..."
>
  <span>0-6m</span>
  {/* Tooltip aparece em hover */}
  <span className="absolute bottom-full hidden group-hover:block text-xs bg-foreground text-background px-2 py-1 rounded whitespace-nowrap">
    0 a 6 meses (recomendado para triagem precoce)
  </span>
</button>
```

### 6.2 Padrão Detectado — Visual Celebration
```tsx
{detectedPattern && (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/20 border-2 border-amber-300/60"
  >
    <div className="flex items-center gap-3">
      <span className="text-3xl">🧠</span>
      <div className="flex-1">
        <p className="font-bold text-amber-900 dark:text-amber-200">{detectedPattern.name}</p>
        <p className="text-xs text-amber-800 dark:text-amber-300">{detectedPattern.reason}</p>
      </div>
    </div>
  </motion.div>
)}
```

### 6.3 Recomendações — Card Design
```tsx
{/* Ouro com fundo gradiente sutil */}
<Card className="relative overflow-hidden border-2 border-amber-300/70 bg-gradient-to-br from-amber-50 via-white to-yellow-50 dark:from-amber-950/20 dark:via-slate-950 dark:to-slate-950">
  {/* Decoração background */}
  <div className="absolute -right-12 -bottom-12 w-32 h-32 opacity-5" aria-hidden="true">
    <SafeAssetImage src={brandAssets.illustrations.heroBrain} alt="" />
  </div>
  
  {/* Conteúdo */}
  <div className="relative z-10">
    <div className="flex items-start gap-4">
      <Award className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-foreground">{item.title}</h3>
        <p className="text-sm text-muted-foreground mt-1">{item.subtitle}</p>
      </div>
    </div>
    {/* Botão com asset ao lado */}
    <div className="mt-3 flex items-center gap-3">
      <Link href={item.route} className="text-sm font-bold text-primary hover:underline">
        Abrir →
      </Link>
      <SafeAssetImage
        src={brandAssets.mascots.consultorioSuperman}
        alt="Recomendação ativa"
        className="w-12 h-12 rounded-lg hidden sm:block"
      />
    </div>
  </div>
</Card>
```

### 6.4 States & Animations
```tsx
// Hover state — elevação sutil
<Card className="transition-all duration-200 hover:shadow-lg hover:border-primary/50 cursor-pointer">

// Active state — scale feedback
<button className="active:scale-95 transition-transform">

// Loading state — skeleton com gradient
<Skeleton className="bg-gradient-to-r from-muted via-background to-muted animate-pulse" />
```

---

## SEÇÃO 7: MOBILE-FIRST VERSIONING

### Mobile (<640px)
```
┌──────────────────┐
│ Header (Fixed)   │
├──────────────────┤
│ Idade            │
│ [Botões]         │
├──────────────────┤
│ Queixa           │
│ [Grid 2-col]     │
├──────────────────┤
│ Respondente      │
│ [4 botões row]   │
├──────────────────┤
│ Search           │
│ [Input]          │
├──────────────────┤
│ Mascote          │
│ [Pequeno, 80px]  │
├──────────────────┤
│ RESULTADOS       │
│ [Cards 1-col]    │
├──────────────────┤
│ Catálogo         │
│ [Cards compact]  │
└──────────────────┘
```

### Tablet (640px-1024px)
```
┌──────────────────────────────────┐
│ Header                           │
├──────────────┬──────────────────┤
│ Controles    │ Recomendações    │
│ (sticky)     │ + Catálogo       │
└──────────────┴──────────────────┘
```

### Desktop (1024px+)
```
┌────────────────────────────────────────────┐
│ Header                                     │
├────────────┬──────────────┬────────────────┤
│Controles   │Recomendações │ Catálogo +     │
│(sticky)    │(3 cards)     │ Assets         │
│+ Mascote   │              │ Visuais        │
└────────────┴──────────────┴────────────────┘
```

---

## SEÇÃO 8: PLANO DE IMPLEMENTAÇÃO

### Phase 1: Layout Refinement (2-3 horas)
- [ ] Two-column grid para filtro (`lg:grid-cols-3`)
- [ ] Sticky left column para controles
- [ ] Reorganizar componentes de resultados
- [ ] Test em 3 viewports (mobile, tablet, desktop)

### Phase 2: Asset Integration (2-3 horas)
- [ ] Mascote default no espaço dos controles
- [ ] Mascote ao detectar padrão clínico
- [ ] Card redesign com assets sutis
- [ ] Anti-poluição visual checklist

### Phase 3: Visual Polish (2-3 horas)
- [ ] Micro-interactions (tooltips, hovers)
- [ ] Padrão detectado com celebração visual
- [ ] Card gradients e decorações
- [ ] Animations com framer-motion

### Phase 4: Zoom Testing (1-2 horas)
- [ ] Test 75% zoom em desktop 1024px
- [ ] Test 75% zoom em desktop 1440px
- [ ] Verify 3-column layout render
- [ ] Screenshot proof

---

## SEÇÃO 9: SUCCESS CRITERIA

✅ Filtro ocupa espaço horizontalmente (2-col em tablet, 3-col em desktop)  
✅ Assets legados integrados sem poluição visual  
✅ Padrão ouro detectado = celebração visual  
✅ Mascotes estrategicamente posicionados  
✅ Zoom 75% funciona com layout otimizado  
✅ Mobile ainda é 1-col compacto (<640px)  
✅ Nenhum elemento overflow em 75% zoom  
✅ Filtro é visualmente excepcional e clínico-apropriado  

---

## 📸 VISUAL TARGETS

**Target 1: Two-Column Tablet View**
- Esquerda: Controles + Mascote (60% altura)
- Direita: Resultados fluindo verticalmente

**Target 2: Desktop with Assets**
- Controles sticky com Mascote ao final
- Cards de resultado com decoração sutil (Neural Abstract BG)
- Catálogo resumido com Ilustração Team

**Target 3: 75% Zoom Desktop**
- Layout expande para 3 colunas
- Assets visíveis mas não intrusivos
- Espaçamento confortável

---

**Status:** Pronto para implementação  
**Esforço Estimado:** 6-10 horas  
**Impacto:** Transformar filtro em obra-prima visual + clínico
