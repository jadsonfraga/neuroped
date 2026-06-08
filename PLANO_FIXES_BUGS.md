# PLANO DE AÇÃO — FIXES DOS 3 BUGS ENCONTRADOS

## Status: 🟡 EM PROGRESSO

Auditoria completada com **83.3% de testes aprovados**. **3 bugs identificados** e documentados. Este documento detalha como fixá-los.

---

## BUG #1: Welcome Dialog Close (CRÍTICO)

### 📋 Descrição
Dialog do tour não fecha completamente quando clica "Pular".

### 📍 Localização
`/home/user/neuroped/client/src/components/WelcomeTour.tsx`

### ✅ Análise de Código
- Linha 104: `const [open, setOpen] = useState(false);` ✅ (começa fechado)
- Linha 153-158: `finish()` → `setOpen(false)` ✅ (lógica correta)
- Linha 210: `{open && (...)}` ✅ (renderização condicional correta)
- Linha 268: Botão "Pular" → `onClick={finish}` ✅ (wired correctly)

### 🔍 Investigação
O código está **tecnicamente correto**. O dialog deveria fechar.

### Possíveis Causas
1. **Dialog auto-abre no /filtro** — Verificar se há `useEffect` que chama `start()`
2. **Delay na re-renderização** — React precisa de tempo para atualizar state
3. **Outro componente dialog** — Pode haver múltiplos dialogs

### ✨ Fix Proposto
```tsx
function finish() {
  setOpen(false);
  setIdx(0);  // Reset para próxima abertura
  try {
    localStorage.setItem(DONE_KEY, "1");
  } catch { }
}
```

### 🚀 Próximo Passo
```bash
# Verificar se há auto-open do tour
grep -rn "start()\|setOpen(true)" client/src/pages/ --include="*.tsx"

# Se não encontrar, issue pode estar no test setup, não no código
```

---

## BUG #2: Age Range Labels Não Mostram

### 📋 Descrição
Botões de faixa etária (0-6 meses, 2-5 anos, etc.) não exibem labels.

### 📍 Localização
`/home/user/neuroped/client/src/pages/filtro.tsx` linha 392-394

### ✅ Análise de Código
```tsx
{faixasEtarias.map((age) => 
  <button key={age.id} ...>
    {age.label}  {/* ← Deve renderizar "0-6 meses", etc */}
  </button>
)}
```

- `faixasEtarias` é importado ✅
- Dados tem `label` field ✅
- Renderização é correta ✅

### 🔍 Investigação
Data em `/home/user/neuroped/client/src/data/scaleFilter.ts` linhas 80-88:
```tsx
export const faixasEtarias = [
  { id: "0-6m", label: "0–6 meses", min: 0, max: 6 },  ✅
  { id: "6-12m", label: "6–12 meses", min: 6, max: 12 }, ✅
  // ...
];
```

### Possíveis Causas
1. **CSS ocultando** — `display: none` ou `opacity: 0`
2. **Font color matching background** — Text invisible mas renderizado
3. **Tailwind classe bug** — Classe truncate removendo conteúdo
4. **React key issue** — Array não renderizando corretamente

### ✨ Fix Proposto

**Option 1: Verificar CSS**
```bash
grep -n "hidden\|display.*none\|text-transparent" client/src/index.css
```

**Option 2: Aumentar visibilidade (debug)**
```tsx
{faixasEtarias.map((age) => 
  <button key={age.id} className="...">
    <span className="text-sm font-bold">{age.label}</span>
  </button>
)}
```

**Option 3: Usar spread attribute**
```tsx
{faixasEtarias.map((age) => (
  <button key={age.id} {...buttonProps}>
    {age.label}
  </button>
))}
```

### 🚀 Próximo Passo
1. Build e check console errors: `npm run build`
2. Abrir dev console no navegador (F12)
3. Inspecionar botão: `<button>` > Should have text inside
4. Se vazio: issue é React/data
5. Se texto existe mas invisível: issue é CSS/color

---

## BUG #3: Complaint Labels Não Mostram

### 📋 Descrição
Botões de queixa (TEA, TDAH, ansiedade, etc.) mostram apenas emoji, não label.

### 📍 Localização
`/home/user/neuroped/client/src/pages/filtro.tsx` linha 405-407

### ✅ Análise de Código
```tsx
{queixas.slice(0, 24).map((q) => 
  <button key={q.id} className="... truncate ...">
    {q.emoji && <span>{q.emoji}</span>}
    <span className="truncate text-[11px] sm:text-xs">
      {q.label}  {/* ← Deve renderizar "Atraso do Desenvolvimento", etc */}
    </span>
  </button>
)}
```

- `queixas` é importado ✅
- Dados tem `label` + `emoji` ✅
- Renderização é correta ✅

### Possíveis Causas
**MESMAS do BUG #2**, + :
1. **`truncate` CSS classe** — Pode estar escondendo texto
2. **Grid overflow** — Container muito pequeno no mobile
3. **Responsive hiding** — `hidden sm:inline` invertido

### ✨ Fix Proposto

**Quick Debug:**
```tsx
// Temporariamente expandir para ver se conteúdo existe
<button className="min-w-[150px]">  {/* Increase width */}
  {q.emoji && <span>{q.emoji}</span>}
  <span className="truncate">  
    {q.label}
  </span>
</button>
```

**Permanent Fix:**
```tsx
<button className="... flex-col sm:flex-row ...">  {/* Stack on mobile */}
  {q.emoji && <span className="text-lg">{q.emoji}</span>}
  <span className="text-xs leading-tight">
    {q.label}
  </span>
</button>
```

### 🚀 Próximo Passo
Mesmo do BUG #2 — build, inspect, verificar se elemento tem conteúdo.

---

## 🚀 ORDEM DE EXECUÇÃO DOS FIXES

### Phase 1: Diagnóstico (15 min)
```bash
cd /home/user/neuroped/client
npm run build  # Check for errors
npm run dev    # Start dev server
# Abra browser, inspecione elementos com F12
```

### Phase 2: Quick Wins (30 min)
1. Se CSS está ocultando → Remove classe
2. Se Tailwind conflita → Adiciona `!important`
3. Se conteúdo vazio → Issue nos dados (trace import)

### Phase 3: Refinement (30 min)
1. Test em mobile (<640px)
2. Test em desktop (1024px)
3. Test em zoom 75%

### Phase 4: Commit & Push
```bash
git add -A
git commit -m "fix: resolve 3 UI bugs in filter (dialog, labels)"
git push -u origin claude/neuroped-filter-refinement-mxsye3
```

---

## 📊 Success Criteria

✅ BUG #1 FIX: Dialog closes immediately when "Pular" clicked  
✅ BUG #2 FIX: "0-6 meses", "2-5 anos" etc. visible on buttons  
✅ BUG #3 FIX: "Atraso do Desenvolvimento", "TDAH", etc. visible on buttons  
✅ No regression: Filter still works, scoring still correct  
✅ Tests pass: `npm run check && npm run build`

---

## ⚡ Emergency Hotline

**If stuck:**
1. Check browser console (F12) for errors
2. Check element inspector — what's actually in the DOM?
3. Check CSS cascade — is a rule overriding unexpectedly?
4. Check React devtools — state update working?

**If quick debug fails:**
→ Extract the buggy component to a minimal reproducible example
→ Trace data flow from import → render
→ Add console.log at each step
