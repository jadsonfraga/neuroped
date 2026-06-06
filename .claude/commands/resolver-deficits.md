---
description: Resolve os déficits diagnosticados na auditoria v42 do NeuroPed SDG. Execute em fases atômicas, uma por PR. Passe a fase como argumento (ex: "fase-1", "fase-2", "fase-3", "fase-4").
argument-hint: fase-1 | fase-2 | fase-3 | fase-4
---

# PROMPT ESTRATÉGICO — RESOLUÇÃO DE DÉFICITS NEUROPED (Auditoria v42)

## CONTEXTO DO PROJETO

**App:** NeuroPed SDG · v6.46.0 · PWA local-first para rastreamento neurodesenvolvimento infantil  
**Autor:** Dr. Jadson Fraga Araújo Júnior · CRM-PE 25227 · RQE 17756  
**Stack:** HTML/JS/CSS puro (zero framework, por design) · Service Worker · GitHub Pages  
**Gate CI:** `npm run verify` (915 asserções + 14 smoke + 48 motor) — DEVE passar 100% antes de todo commit  
**Baseline design:** `node scripts/design-audit.mjs --check` — NÃO pode subir acima de 8388  
**Scorecard:** `npm run audit` — referência de avanço mensurável (meta 4/5 → 5/5)

---

## MAPA DE DÉFICITS (Registro v42 · 2026-06-06)

### DÉFICIT A — Sprawl de estilos [ÚNICO DÉFICIT NO SCORECARD]
**Medição:** `npm run audit` → "Sistemas de estilo: 8, alvo ≤3"  
**Causa-raiz:** 3 arquivos de tokens paralelos + 2 skins paralelos + arquivos legados nunca removidos  

Inventário de tokens atual:
- `tokens.css` (228 linhas) — canônico alvo
- `np-tokens.css` (104 linhas) — variáveis NP, deve migrar para tokens.css
- `ds-tokens.css` (54 linhas) — subconjunto, deve ser absorvido
- `premium-override.css` — sobreposições de acento, deve virar seção em tokens.css
- `design-system-premium.css` — legado, migrar e deletar

Inventário de skins atual:
- `np-skin.css` (40 linhas) — canônico alvo (baixa cobertura: 69/72 páginas)
- `app-skin.css` (366 linhas) — legado com lógica valiosa, deve ser absorvido em np-skin.css

### DÉFICIT B — `consulta.html` com marcação PIN legada
**Causa-raiz:** `consulta.html` ainda depende de `consulta-pin-fix.js` como fallback em runtime.  
O fix de runtime foi criado como paliativo no v41; a origem nunca foi corrigida.  
**Arquivos envolvidos:** `consulta.html`, `consulta-pin-fix.js`

### DÉFICIT C — App shell acoplado a `premium-experience.js`
**Causa-raiz:** Shell visual (nav + rodapé + marca Dr. Jadson) vive dentro de `premium-experience.js`.  
Dificulta manutenção e aumenta risco de regressão ao tocar UX premium.  
**Meta:** Shell em `app-shell.js` + `app-shell.css` independentes. `premium-experience.js` passa a importar o shell, não contê-lo.

---

## FASES DE EXECUÇÃO (ordem de valor/risco)

### FASE 1 — Consolidação de tokens (Déficit A · Onda 1)
**Objetivo:** Fundir `np-tokens.css` e `ds-tokens.css` em `tokens.css`. Eliminar 2 arquivos.

**Passos:**
1. Ler `tokens.css`, `np-tokens.css`, `ds-tokens.css` integralmente.
2. Identificar variáveis em `np-tokens.css` e `ds-tokens.css` que NÃO existem em `tokens.css` → copiar para `tokens.css` em seção nova `/* === np-tokens migrados === */`.
3. Identificar variáveis duplicadas → garantir que `tokens.css` usa o valor mais atual/semântico.
4. Buscar em TODOS os arquivos `.html` e `.js` qualquer `@import` ou `<link>` para `np-tokens.css` ou `ds-tokens.css` → substituir por `tokens.css`.
5. Deletar `np-tokens.css` e `ds-tokens.css`.
6. Rodar `node scripts/design-audit.mjs --check` — baseline NÃO pode subir.
7. Rodar `npm run verify` — deve fechar 915 OK.
8. Rodar `npm run audit` — verificar se "sistemas de estilo" baixou de 8.

**Aceite:** `npm run verify` 100% verde · baseline design não regrediu · 2 arquivos a menos no inventário.

---

### FASE 2 — Unificação de skins (Déficit A · Onda 2)
**Objetivo:** Absorver `app-skin.css` em `np-skin.css`. Eliminar `app-skin.css`.

**Passos:**
1. Ler `app-skin.css` (366 linhas) e `np-skin.css` (40 linhas) integralmente.
2. Mapear blocos em `app-skin.css` por categoria: variáveis, componentes, layout, animações.
3. Mover para `np-skin.css`:
   - Variáveis não cobertas por `tokens.css` (pós-fase-1)
   - Regras de componente que não existem em `components.css`
   - Regras específicas de skin (aparência, cor, sombra)
4. Descartar de `app-skin.css` qualquer bloco já coberto por `tokens.css` ou `np-skin.css`.
5. Buscar todos os `<link>` para `app-skin.css` → substituir por `np-skin.css`.
6. Deletar `app-skin.css`.
7. Verificar cobertura skin: `npm run audit` → "Cobertura skin" deve manter ≥96%.
8. Rodar `node scripts/design-audit.mjs --check` e `npm run verify`.

**Aceite:** `app-skin.css` deletado · cobertura skin ≥96% · verify 100% verde.

---

### FASE 3 — Limpeza de `consulta.html` (Déficit B)
**Objetivo:** Corrigir a origem de `consulta.html` e eliminar a dependência de `consulta-pin-fix.js`.

**Passos:**
1. Ler `consulta.html` integralmente para mapear a marcação PIN legada.
2. Ler `consulta-pin-fix.js` para entender EXATAMENTE o que ele corrige em runtime.
3. Aplicar as correções de `consulta-pin-fix.js` diretamente no HTML/JS inline de `consulta.html` na origem.
4. Remover o `<script src="consulta-pin-fix.js">` de `consulta.html`.
5. Verificar em `scripts/test-static.mjs` se há asserção sobre `consulta-pin-fix` — se sim, atualizar o teste para validar a correção na origem.
6. Rodar `npm run verify`.

**Aceite:** `consulta.html` sem `consulta-pin-fix.js` · verify verde · comportamento de PIN inalterado.

---

### FASE 4 — Formalização do App Shell (Déficit C)
**Objetivo:** Separar shell visual de `premium-experience.js` em arquivos próprios.

**Passos:**
1. Ler `premium-experience.js` integralmente.
2. Identificar o bloco que injeta o app shell (nav, rodapé, marca Dr. Jadson).
3. Extrair esse bloco para `app-shell.js` (novo arquivo).
4. Extrair os estilos do shell para `app-shell.css` (novo arquivo) usando apenas variáveis de `tokens.css`.
5. No topo de `premium-experience.js`, importar/incluir `app-shell.js` via script dinâmico ou módulo.
6. Adicionar `app-shell.js` e `app-shell.css` ao cache do `sw.js` (na lista de assets do CACHE_NAME atual).
7. Adicionar `app-shell.js` e `app-shell.css` à lista de arquivos críticos em `scripts/test-static.mjs`.
8. Rodar `npm run verify`.

**Aceite:** Shell funciona identicamente · `premium-experience.js` delega ao shell · verify verde · sw.js com novos assets.

---

## GATES OBRIGATÓRIOS (antes de todo commit, em toda fase)

```bash
npm run verify
# deve retornar: 915 OK (ou mais), 0 falhas

node scripts/design-audit.mjs --check
# deve retornar: baseline ≤8388 (nunca subir)

npm run audit
# informativo — documentar progressão no commit
```

Commit somente se TODOS os três passarem. Nunca use `--no-verify` ou skip de hook.

---

## REGRAS DE COMPLIANCE (absolutas)

- **CRM:** Sempre CRM-PE 25227 / RQE 17756. NUNCA mencionar CRM-BA em nenhum arquivo.
- **Endereço:** Rua Raimundo Lacerda, Casa 01, Bairro São José, Petrolina-PE.
- **Dados clínicos:** Dados de pacientes reais continuam PROIBIDOS nesta fase (sem backend seguro).
- **PIN:** Controle de interface apenas. Nunca apresentar como segurança de produção.
- **Instrumentos clássicos:** M-CHAT, CARS, SNAP-IV etc. são REFERENCIADOS, nunca reproduzidos.
- **TDAH ≠ TOD:** Nunca confundir, sobrepor ou tratar como sinônimos.
- **Sem !important** (exceto em reset) · sem emoji em UI clínica formal · sem cor crua em CSS de feature.

---

## CRITÉRIO DE SUCESSO FINAL

```
npm run audit retorna: 5/5 métricas no alvo
  ✓ API órfãos: 0
  ✓ Sistemas de estilo: ≤3
  ✓ Cobertura skin: ≥60%
  ✓ console.log/.debug: 0
  ✓ Marcadores de conflito: 0
```

Scorecard 4/5 → **5/5** = meta atingida.  
Documentar em `docs/AUDITORIA_CONTINUA_NEUROPED.md` como Registro v43+.

---

## FASE SOLICITADA

$ARGUMENTS
