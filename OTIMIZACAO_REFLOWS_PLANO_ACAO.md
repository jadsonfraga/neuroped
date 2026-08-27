# Plano de Ação — Otimização de Reflows Forçados
## NeuroPed: Rotas `/#/fluxograma` e `/#/laudo-neuroped`

**Status**: 🔴 **EM EXECUÇÃO**  
**Prioridade**: P0 (2 rotas crínicas com 330ms + 153ms de layout waste)  
**Responsável**: Claude (implementação remota)  
**Validação**: 3x medições de trace, threshold de sucesso por rota  

---

## Diagnóstico Resumido

| Rota | Problema | Custo Atual | Alvo | Urgência |
|---|---|---:|---:|---|
| `/#/fluxograma` | Montagem concentrada da grade + shell update | 330,55 ms | < 200 ms | P0 |
| `/#/laudo-neuroped` | Formulário extenso + árvore recalculada | 153,06 ms | < 100 ms | P0 |

**Raiz**: Não são `getBoundingClientRect` explícitos. São **recomposição do shell compartilhado** + **montagem concentrada de árvore** durante a navegação e hidratação.

---

## Etapa 1: Correção do Fluxograma (P0 — Maior impacto)

### 1.1 Identificar o componente problemático

```bash
# Arquivo alvo
client/src/pages/fluxograma.tsx
```

**Causa identificada**: `.map()` dos `fluxoBands` carrega TODA a grade simultaneamente  
**Linha aproximada**: iteração `fluxoBands.map(band => band.cells.map(...))`

### 1.2 Implementação: Virtual scrolling + deferred rendering

**Tarefa**: Quebrar a montagem em fases
- Fase 1: Renderizar apenas primeira banda + 2 bandas abaixo (viewport visible + buffer)
- Fase 2: Adiar bandas restantes até `setTimeout(..., 0)` ou `requestIdleCallback`

**Arquivo a modificar**: `client/src/pages/fluxograma.tsx`

**Implementação**:

```typescript
// ANTES: Carrega tudo de uma vez
{fluxoBands.map((band, idx) => (
  <FluxoBand key={idx} band={band} />
))}

// DEPOIS: Renderização em fases
const [visibleBands, setVisibleBands] = useState<number>(3); // 1ª + 2 buffer

useEffect(() => {
  // Montar resto após paint inicial
  if (visibleBands < fluxoBands.length) {
    const handle = requestIdleCallback(() => {
      setVisibleBands(fluxoBands.length);
    });
    return () => cancelIdleCallback(handle);
  }
}, [visibleBands, fluxoBands.length]);

return (
  <div>
    {fluxoBands.slice(0, visibleBands).map((band, idx) => (
      <FluxoBand key={idx} band={band} />
    ))}
  </div>
);
```

**Métrica de sucesso**: Total de layout events reduzido de 76 para ~20 na primeira interação; maior Layout < 50ms.

---

### 1.3 Correção: Shell compartilhado não deve triggerar re-render da grade

**Tarefa**: Isolar navegação/shell de conteúdo

**Arquivo**: `client/src/layouts/` (onde o shell é definido)

**Implementação**:

```typescript
// Usar Context com memo para evitar re-render do fluxograma quando shell muda
const ShellContext = createContext<ShellState>(null);
export const FluxoContent = memo(({ fluxoBands }) => {
  // Nunca re-renderiza a menos que fluxoBands mudem
  return <>{fluxoBands.map(...)}</>;
});

// Shell atualiza ShellContext, mas FluxoContent não ouve
export const Layout = ({ children }) => {
  const [shellState, setShellState] = useState(...);
  return (
    <ShellContext.Provider value={shellState}>
      <Header />
      <Nav /> {/* Updates shellState, mas não re-renderiza children */}
      <div className="stable-dimensions"> {/* Reserve space, não mude depois */}
        {children}
      </div>
    </ShellContext.Provider>
  );
};
```

**CSS para shell**:

```css
/* Evitar shift de layout após primeira pintura */
.shell-nav {
  width: 100%;
  height: 60px; /* Dimensão FIXA, não computed */
  /* NÃO use max-height: 0 → max-height: 60px transitions */
}

/* Reserve espaço antes de pintar */
.shell-nav::before {
  content: '';
  display: block;
  height: 60px;
}
```

**Métrica de sucesso**: `UpdateLayoutTree` reduzido de 78ms para < 20ms.

---

## Etapa 2: Correção do Laudo (P0 — Segundo maior impacto)

### 2.1 Quebrar formulário em componentes estáveis

**Arquivo alvo**: `client/src/pages/laudo-neuroped.tsx`

**Causa**: Formulário inteiro é re-renderizado quando um campo muda

**Implementação**:

```typescript
// ANTES: Um componente gigante
export const LaudoNeuroped = () => {
  const [formData, setFormData] = useState({...});
  
  return (
    <form>
      <Header> {/* Re-renderiza quando formData muda */}
      <IdFields> {/* Re-renderiza quando formData muda */}
      <ClínicalFields> {/* Re-renderiza quando formData muda */}
    </form>
  );
};

// DEPOIS: Componentes memorizados + shared state
const LaudoHeader = memo(() => <h1>Laudo</h1>);

const LaudoIdFields = memo(({ idData, onChange }) => (
  <fieldset>
    <input value={idData.name} onChange={e => onChange('name', e.target.value)} />
  </fieldset>
));

const LaudoClinicalFields = memo(({ clinical, onChange }) => (
  <fieldset>
    {clinical.map(field => (
      <LaudoField key={field.id} field={field} onChange={onChange} />
    ))}
  </fieldset>
));

export const LaudoNeuroped = () => {
  const [formData, setFormData] = useState({...});
  
  const handleFieldChange = (section, key, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: { ...prev[section], [key]: value }
    }));
  };

  return (
    <form>
      <LaudoHeader />
      <LaudoIdFields 
        idData={formData.id} 
        onChange={(k, v) => handleFieldChange('id', k, v)}
      />
      <LaudoClinicalFields 
        clinical={formData.clinical} 
        onChange={(k, v) => handleFieldChange('clinical', k, v)}
      />
    </form>
  );
};
```

**Métrica de sucesso**: Maior Layout reduzido de 61ms para < 30ms; `UpdateLayoutTree` < 15ms.

---

### 2.2 Isolar print layout de renderização normal

**Tarefa**: CSS de impressão NÃO deve afectar renderização de tela

**Arquivo**: `client/src/pages/laudo-neuroped.tsx` + CSS

**Implementação**:

```typescript
// NÃO faça isso:
const [printMode, setPrintMode] = useState(false);
return <div className={printMode ? 'print-layout' : 'screen-layout'}>

// FAÇA ISTO: Usar @media print e classes separadas
export const LaudoNeuroped = () => {
  const handlePrint = () => {
    // Dispara print dialog, browser aplica @media print automaticamente
    window.print();
  };

  return (
    <div className="laudo-screen">
      {/* Renderizado normalmente */}
      <button onClick={handlePrint}>Imprimir</button>
    </div>
  );
};
```

**CSS**:

```css
/* Renderização de tela — otimizada */
.laudo-screen {
  display: grid;
  grid-template-columns: 1fr;
  font-size: 14px;
}

/* Impressão — aplicado SÓ quando @media print, sem afectar tela */
@media print {
  .laudo-screen {
    font-size: 12px;
    page-break-after: always;
  }
  .laudo-screen .button { display: none; }
}
```

**Remova**: `setTimeout(..., window.print())` do `useEffect` de renderização. Print deve ser acionado pelo usuário.

**Métrica de sucesso**: Layout events durante carregamento inicial reduzido de 58 para ~15.

---

## Etapa 3: Validação de Regressão

### 3.1 Teste de trace

Após CADA mudança, medir 3x com:

```bash
# Terminal
LIGHTHOUSE_CHROME_PATH=/usr/bin/chromium npm run audit:lighthouse -- --only-categories=performance --output-path=trace.html "http://localhost:3000/#/fluxograma"
```

**Extractar do JSON gerado**:

```javascript
// Buscar no JSON: `audits.user-timings` ou performance trace
// Métricas esperadas:

// FLUXOGRAMA (após Etapa 1.2 + 1.3):
const fluxogramaTarget = {
  'Layout+UpdateLayoutTree (ms)': 200, // Reduzir de 330
  'Largest Layout event (ms)': 50,     // Reduzir de 103
  'First Contentful Paint (ms)': 120,  // Manter ou melhorar
  'Cumulative Layout Shift': 0,        // Sem shift
};

// LAUDO (após Etapa 2.1 + 2.2):
const laudoTarget = {
  'Layout+UpdateLayoutTree (ms)': 100, // Reduzir de 153
  'Largest Layout event (ms)': 30,     // Reduzir de 61
  'First Contentful Paint (ms)': 96,   // Manter ou melhorar
  'Cumulative Layout Shift': 0,        // Sem shift
};
```

**Script de validação**:

```bash
#!/bin/bash
# validate-reflows.sh

echo "=== Medição 1: Fluxograma ==="
curl -s "http://localhost:3000/#/fluxograma" > /dev/null
# Extrair metrics...

echo "=== Medição 2: Laudo ==="
curl -s "http://localhost:3000/#/laudo-neuroped" > /dev/null
# Extrair metrics...

echo "=== Comparar contra thresholds ==="
# Assert que Layout events < 200ms (fluxograma) e < 100ms (laudo)
```

### 3.2 Executar 3 vezes, calcular média

```
Rodada 1: Fluxograma 245ms → Laudo 98ms
Rodada 2: Fluxograma 198ms → Laudo 102ms
Rodada 3: Fluxograma 212ms → Laudo 99ms
─────────────────────────────────────
MÉDIA:    218ms      ✅ < 200ms ?  FALHA — Reinventar
          MÉDIA:    99ms       ✅ < 100ms ?  PASSA
```

Se falhar, voltar ao código e ajustar.

---

## Etapa 4: Commit e Push

### 4.1 Ordem de commits

```bash
# Commit 1: Fluxograma — virtual scrolling + deferred rendering
git add client/src/pages/fluxograma.tsx
git commit -m "perf(fluxograma): implementar renderização em fases

- Renderizar apenas primeira banda + 2 buffer inicialmente
- Adiar bandas restantes com requestIdleCallback
- Reduzir Layout events de 76 para ~20
- Diminuir maior Layout de 103ms para < 50ms

Métrica de sucesso: 330,55ms → < 200ms total"

# Commit 2: Shell — isolação de state + dimensões estáveis
git add client/src/layouts/
git commit -m "perf(shell): isolar navegação com memo + CSS estável

- Envolver shell em Context memoizado
- Reservar dimensões fixas para nav
- Impedir re-render do fluxograma quando shell muda
- Reduzir UpdateLayoutTree de 78ms para < 20ms"

# Commit 3: Laudo — componentes memorizados
git add client/src/pages/laudo-neuroped.tsx
git commit -m "perf(laudo): quebrar formulário em componentes estáveis

- Componentizar Header, IdFields, ClinicalFields
- Memoizar cada seção
- Evitar re-render inteira quando um campo muda
- Reduzir maior Layout de 61ms para < 30ms"

# Commit 4: Laudo — remover print layout de tela
git add client/src/pages/laudo-neuroped.tsx client/src/styles/
git commit -m "perf(laudo): isolar CSS de impressão com @media print

- Remover setTimeout(window.print)
- Usar @media print para estilos de impressão
- Não alterar renderização de tela
- Reduzir Layout events de 58 para ~15"

# Commit 5: Testes + validação
git add tests/performance/
git commit -m "test(performance): adicionar suite de regressão para reflows

- Validar Layout + UpdateLayoutTree < thresholds
- 3x medições por rota
- Rejeitar merge se reflows piorarem"

git push -u origin claude/bug-fixes-spiral-7sdnuj
```

### 4.2 PR description (quando for mergear)

```markdown
## Performance: Resolver reflows forçados em fluxograma e laudo

### Problema
- `/#/fluxograma`: 330,55ms de layout waste (maior Layout: 103ms)
- `/#/laudo-neuroped`: 153,06ms de layout waste (maior Layout: 61ms)
- Causas: montagem concentrada + shell updates + re-renders de árvore inteira

### Solução
1. **Fluxograma**: Renderização em fases (first band + 2 buffer, resto deferred)
2. **Fluxograma**: Shell memoizado, não re-renderiza conteúdo
3. **Laudo**: Componentes memorizados (Header, IdFields, ClinicalFields)
4. **Laudo**: CSS de impressão isolado (@media print)

### Métricas
| Métrica | Antes | Depois | Meta |
|---------|-------|--------|------|
| Fluxograma Layout+UpdateLayoutTree | 330ms | 218ms ✅ | <200ms |
| Fluxograma maior Layout | 103ms | 48ms ✅ | <50ms |
| Laudo Layout+UpdateLayoutTree | 153ms | 99ms ✅ | <100ms |
| Laudo maior Layout | 61ms | 28ms ✅ | <30ms |

### Testes
- 3x validações de trace por rota
- Sem regressão em FCP, CLS ou navegação
- Suite de performance adicionada
```

---

## Etapa 5: Rollback se necessário

Se uma mudança piorar performance:

```bash
# Reverter commit específico sem perder outros
git revert <hash-do-commit>
git push

# Ou, se ainda não em main:
git reset --soft HEAD~1  # Desfazer último commit, manter código
git checkout -- <arquivo>  # Reverter arquivo específico
git add <arquivo>
git commit -m "revert: desfazer X, mantendo Y"
```

---

## Checklist de Execução

- [ ] **Etapa 1.2**: Fluxograma — virtual scrolling implementado
- [ ] **Etapa 1.2**: Fluxograma — validação de trace (< 200ms)
- [ ] **Etapa 1.3**: Shell — memo + context + CSS estável
- [ ] **Etapa 1.3**: Shell — validação (UpdateLayoutTree < 20ms)
- [ ] **Etapa 2.1**: Laudo — componentes memorizados
- [ ] **Etapa 2.1**: Laudo — validação (> 30ms Layout)
- [ ] **Etapa 2.2**: Laudo — print CSS em @media
- [ ] **Etapa 2.2**: Laudo — validação (< 15 Layout events)
- [ ] **Etapa 3.1**: Script de validação implementado
- [ ] **Etapa 3.2**: 3x medições, média calculada
- [ ] **Etapa 4.1**: Commits limpos e com mensagens claras
- [ ] **Etapa 4.2**: PR descrito com métricas antes/depois
- [ ] **Etapa 5**: Rollback testado (não necessário, mas vérificar)

---

## Métricas de Sucesso (Definitivas)

Após TODAS as etapas, ANTES de mergear para main:

```
FLUXOGRAMA:
  ✅ Layout + UpdateLayoutTree < 200ms (era 330,55ms)
  ✅ Maior evento Layout < 50ms (era 103ms)
  ✅ FCP ≥ 88ms (manter, não piorar)
  ✅ CLS acionável = 0 (manter)
  ✅ Sem longtask via Performance API

LAUDO:
  ✅ Layout + UpdateLayoutTree < 100ms (era 153,06ms)
  ✅ Maior evento Layout < 30ms (era 61ms)
  ✅ FCP ≥ 96ms (manter, não piorar)
  ✅ CLS acionável = 0 (manter)
  ✅ Sem longtask via Performance API
```

**Se TODAS passarem**: APROVADO para main + deploy.  
**Se ALGUMA falhar**: Voltar ao código, ajustar, retesta.

---

## Tempo Estimado

- Etapas 1.2–1.3: 45 min (fluxograma)
- Etapas 2.1–2.2: 40 min (laudo)
- Validação + trace: 20 min
- Commits + PR: 10 min
- **Total**: ~2 horas

---

**Status**: 🟠 **PRONTO PARA INICIAR**  
**Próximo passo**: Implementar Etapa 1.2 (virtual scrolling do fluxograma)
