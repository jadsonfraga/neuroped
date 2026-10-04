# ⚠️ AÇÕES URGENTES — Problemas Reportados

## PROBLEMA #1: Filtro Aparece "Lá Embaixo"

### Descrição
Ao abrir `/filtro`, o conteúdo do filtro não aparece imediatamente — está localizado no final da página, requerendo scroll para baixo.

### Causa Provável
**Welcome Dialog/Tour** está ocupando toda a viewport e empurrando o conteúdo para baixo.

### Solução 1: Fechar Dialog Automaticamente na Página /filtro

```tsx
// filtro.tsx — No início do component
useEffect(() => {
  // Fechar welcome tour se estiver aberto ao entrar em /filtro
  try {
    localStorage.setItem("np_tour_v2_done", "1");
  } catch {}
}, []);
```

### Solução 2: Alterar Dialog para Modal (Overlay)

Se o issue é que o dialog está no fluxo de layout ao invés de sobreposto:

```tsx
// WelcomeTour.tsx — Verificar que z-index e position são corretos
{open && (
  <div className="fixed inset-0 z-[99998] ..." role="dialog">  {/* ← fixed + z-index alto */}
    {/* ... */}
  </div>
)}
```

### Teste de Diagnóstico
```bash
# Abrir filtro em navegador
# Pressionar F12 (DevTools)
# Verificar: console.log(localStorage.getItem("np_tour_intro_v2"))
# Se retornar "1": tour já foi visto, não deveria abrir
# Se retornar null: tour abrir automaticamente
```

---

## PROBLEMA #2: Queixas Sem Emojis Visíveis

### Status Investigação
✅ **Verificado:** Todos os queixas NO DATA JÁ TÊM EMOJIS!

```
✅ 👶 Atraso do Desenvolvimento
✅ 🧩 Autismo / TEA
✅ ⚡ TDAH
... (todos com emoji)
```

### Problema Real
Os emojis **EXISTEM NOS DADOS** mas **NÃO ESTÃO RENDERIZANDO** na UI.

### Análise do Código (filtro.tsx linha 406)
```tsx
{queixas.slice(0, 24).map((q) => 
  <button>
    {q.emoji && <span className="text-sm flex-shrink-0">{q.emoji}</span>}
    <span className="truncate text-[11px] sm:text-xs">
      {q.label}
    </span>
  </button>
)}
```

✅ O código está **CORRETO** — renderiza `q.emoji` se existir.

### Por Que Não Aparecem?

**Hipótese 1:** CSS está ocultando
```css
/* Procurar em index.css: */
.hidden { display: none !important; }  {/* ← Pode estar aplicado globalmente */}
[class*="emoji"] { display: none; }     {/* ← Pode estar ocultando emojis */}
```

**Hipótese 2:** Dados não carregam corretamente
```ts
// Verificar no browser console:
// import { queixas } from '@/data/scaleFilter'
// console.log(queixas[0].emoji)  <- Deve mostrar "👶"
```

**Hipótese 3:** React não está renderizando (problema de chave)
```tsx
// Renderizar com chave explícita:
{queixas.map((q, i) => (
  <button key={`${q.id}-${i}`}>  {/* ← Chave única */}
    {q.emoji}
    {q.label}
  </button>
))}
```

### Solução Imediata: Debug no Navegador

1. **Abrir `/filtro`**
2. **Pressionar F12**
3. **Ir para Console tab**
4. **Executar:**
```javascript
// Verificar se queixas carregou
document.querySelectorAll('button').forEach((btn, i) => {
  if (i < 5) console.log(`Button ${i}:`, btn.textContent);
});
```

5. **Se ver emojis no console mas não na página:**
   - Issue é CSS ocultando
   - Check: `computed styles` do botão (F12 > Inspect)

6. **Se não ver emojis no console:**
   - Issue é React/dados
   - Verificar queixas array import

### Solução Técnica

#### Se CSS está ocultando:
```css
/* Adicionar em index.css */
[class*="emoji"] {
  display: inline !important;  {/* Override hide rule */}
  visibility: visible !important;
}
```

#### Se dados não carregam:
```tsx
// Verificar import em filtro.tsx
import { queixas } from "@/data/scaleFilter";  {/* ← Correto? */}

// Debug
console.log("Queixas loaded:", queixas.length, queixas[0].emoji);
```

#### Se React não renderiza:
```tsx
// Renderizar emoji EXPLICITAMENTE
{q.emoji && <span>{q.emoji}</span>}  {/* ← Já está assim! */}

// Se não renderiza, adicionar fallback
{<span className="text-sm">{q.emoji || "?"}</span>}
```

---

## PLANO DE EXECUÇÃO (15 min)

### Step 1: Fechar Welcome Tour no /filtro (3 min)
```tsx
// filtro.tsx linha 281+
export default function FiltroPage() {
  // Auto-close welcome tour
  useEffect(() => {
    try {
      localStorage.setItem("np_tour_v2_done", "1");
    } catch {}
  }, []);

  return (...)
}
```

**Result:** Filtro não mais oculto por dialog

### Step 2: Debug Emojis no Navegador (5 min)
1. Abrir `/filtro` em navegador
2. F12 > Console
3. Executar: `document.querySelector('button:has-text("Atraso")').textContent`
4. Verificar se emoji aparece

**Result:** Saber se issue é CSS ou dados

### Step 3: Fix Conforme Diagnóstico (7 min)
- Se CSS: adicionar override em index.css
- Se dados: verificar import
- Se React: adicionar console.log para debug

---

##  ✅ SUCESSO CRITERIA

- [ ] `/filtro` abre COM FILTRO VISÍVEL (não lá embaixo)
- [ ] Todos os queixas mostram emoji + texto
- [ ] No warnings ou errors no console
- [ ] Scroll não necessário para ver filtro na primeira abertura

---

## Próximo Passo
→ Execute Step 1 + 2 agora
→ Report resultado
→ Farei Step 3 conforme diagnóstico
