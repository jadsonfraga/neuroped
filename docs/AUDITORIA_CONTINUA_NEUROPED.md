# Auditoria Contínua NeuroPed SDG

## Registro v37 — Quality Foundation

Data: 2026-05-08

### Área auditada

- Fluxo de PIN master.
- Service worker.
- Rotas principais.
- Consulta.
- PWA.
- Política de armazenamento.
- Documentação LGPD.
- Planejamento backend/memória.

### Problemas tratados

1. Rotas espalhadas sem registro central.
2. Ausência de painel único de qualidade.
3. Falta de teste navegável específico para PIN master.
4. Consulta longa sem atalhos modulares.
5. Falta de documentação objetiva para backend gratuito.
6. Falta de documentação objetiva para memória/embeddings.
7. Falta de checklist LGPD resumido.

### Correções feitas

- Criado `routes.config.js`.
- Criado `teste-ouro-pin.html`.
- Criado `qualidade-neuroped.html`.
- Criado `consulta-tabs.js`.
- Criado `storage-policy.js`.
- Criado `app-mode.js`.
- Criado `docs/PLANO_BACKEND_GRATUITO.md`.
- Criado `docs/MEMORIA_E_EMBEDDINGS.md`.
- Criado `docs/LGPD_CHECKLIST.md`.

### Riscos restantes

- PIN frontend segue sendo controle de interface, não segurança de produção.
- O service worker ainda injeta várias camadas e deve ser consolidado progressivamente.
- Backend real ainda não foi implementado.
- Embeddings reais ainda não configurados.
- Dados clínicos reais continuam proibidos nesta fase.

---

## Registro v38 — Quality Panel Fix

Data: 2026-05-08

### Correção feita

- Atualizado `qualidade-neuroped.html` para carregar diretamente `./app-mode.js`.
- Ajustada validação do painel para considerar OK quando `window.NEUROPED_APP_MODE.mode === "HOMOLOGAÇÃO"`.
- Atualizado `sw.js` para `neuroped-v38-quality-panel-fix`.

### Riscos restantes

- Ausência de teste automatizado formal via npm naquela etapa.
- Service worker ainda injeta múltiplas camadas; consolidar em rodada futura.

---

## Registro v39 — Static Test Baseline

Data: 2026-05-08

### Correção feita

- Criado `scripts/test-static.mjs`.
- Adicionado `npm run test:static`.
- Adicionado `npm test` apontando para `test:static`.

### Teste

```bash
npm test
```

### Riscos restantes

- O teste é estático; ainda não substitui teste end-to-end real no navegador.
- O service worker continua acumulando responsabilidades além do cache.

---

## Registro v40 — Consulta Clinical Suite

Data: 2026-05-08

### Correções feitas

- Criado `consulta-voz.js` para anamnese por voz.
- Criado `consulta-docflow.js` com receituário livre, exames, laudo/PDF, QR e histórico local.
- Criado `verificar-documento.html`.
- Atualizado `consulta-documentos.js` para carregar módulos avançados.
- Atualizado `consulta-tabs.js`.
- Atualizado `scripts/test-static.mjs`.
- Atualizado `sw.js` para `neuroped-v40-consulta-clinical-suite`.

### Segurança e limite jurídico

QR/código é apenas conferência local de integridade. Não é assinatura digital ICP-Brasil.

---

## Registro v41 — App Shell, Consulta Livre e Secretaria

Data: 2026-05-09

### Área auditada

- Experiência global de navegação.
- Consulta após PIN master.
- Secretaria.
- App shell visual.
- Rotas centrais.
- Teste estático.
- Cache/PWA.

### Diagnóstico

O app já tinha módulos úteis, mas ainda parecia conjunto de páginas soltas. A Consulta continuava excessivamente estruturada como formulário e a Secretaria aparecia como rota simbólica, não como módulo operacional. O nome Dr. Jadson Fraga também precisava ganhar mais presença visual como marca institucional pediátrica.

### Correções feitas

- Atualizado `premium-experience.js` para adicionar app shell visual único, com marca Dr. Jadson Fraga, navegação principal e rodapé coeso.
- Atualizado `consulta-documentos.js` para inserir primeiro um editor de Consulta médica livre após PIN master.
- O editor livre permite colar/redigir texto completo, copiar, imprimir/PDF, salvar, limpar, inserir cabeçalho e inserir data/hora.
- Modelos opcionais foram adicionados como aceleradores editáveis, sem obrigar preenchimento por formulário.
- Criado `secretaria.html` com agenda local, status, pendências, mensagens copiáveis, passe familiar, impressão, exportação e importação JSON.
- Atualizado `routes.config.js` para apontar Secretaria para `./secretaria.html`.
- Atualizado `sw.js` para `neuroped-v41-app-shell-consulta-livre`, incluindo `secretaria.html` no cache.
- Atualizado `scripts/test-static.mjs` para validar app shell, consulta livre, secretaria, cache v41 e limites do QR.

### Arquivos alterados

- `premium-experience.js`
- `consulta-documentos.js`
- `secretaria.html`
- `routes.config.js`
- `sw.js`
- `scripts/test-static.mjs`
- `deploy-trigger.json`
- `docs/AUDITORIA_CONTINUA_NEUROPED.md`

### Limites mantidos

- PIN frontend continua sendo controle de interface, não segurança real de produção.
- Dados clínicos reais continuam proibidos sem backend seguro.
- QR/código local não é assinatura digital ICP-Brasil.
- Modelos não sugerem medicação, dose, exame ou diagnóstico automaticamente.

### Teste

`npm test` foi atualizado para validar os arquivos e padrões críticos do v41.

### Riscos restantes

- `consulta.html` ainda contém marcação antiga do PIN na origem; o fallback `consulta-pin-fix.js` corrige em runtime.
- App shell está implementado via `premium-experience.js`, não em arquivos separados `app-shell.js/css`, por limitação operacional do conector nesta rodada.
- Secretaria é local/homologação, sem backend.
- O service worker ainda concentra múltiplas responsabilidades.

### Próximo passo sugerido

Separar formalmente o shell em `app-shell.js/css`, criar `secretaria.js` separado e corrigir `consulta.html` na origem quando o conector permitir substituição segura do arquivo completo.

---

## Registro v42 — Auditoria Completa da Stack | Baseline v6.46.0

Data: 2026-06-06

### Escopo auditado

- Suite estática completa (`npm test`)
- Smoke tests (sintaxe, contratos DOM, lógica)
- Lockstep de versão (`package.json` ↔ `sw.js`)
- Contraste WCAG AA
- Cascata de tema (token → palette)
- Motor pré-consulta (engine clínica)
- Sistema de estilos (sprawl)
- Scorecard 7,0 → 9,0

### Resultado dos testes

| Check | Resultado | Meta |
|---|---|---|
| Asserções estáticas (`npm test`) | **915 OK, 0 falhas** | 0 falhas |
| Smoke (sintaxe + DOM + lógica) | **14 OK, 0 falhas** | 0 falhas |
| Motor pré-consulta | **48 OK, 0 falhas** | 0 falhas |
| Lockstep de versão | **✓ v6.46.0 sincronizado** | coerente |
| Contraste WCAG AA | **todos os pares passam** | AA |
| Cascata de tema | **✓ 72 páginas válidas** | todas as páginas |
| APIs órfãs (SPA→404) | **0** | 0 |
| `console.log/.debug` em prod | **0** | 0 |
| Marcadores de conflito git | **0** | 0 |
| Cobertura skin `np-skin` | **96% (69/72)** | ≥60% |
| Scorecard geral | **4/5 métricas no alvo** | 5/5 |

### Destaques positivos (novos desde v41)

- **Lote 2 de instrumentos internacionais livres:** 52 instrumentos integrados ao bundle de escalas. Zero IDs duplicados, todos com proveniência e faixas etárias válidas.
- **Scaffold `auth-supabase`:** 15 asserções cobrindo `parseAuthHash`, `isExpired` e `buildOtpBody` — todas passando. Módulo permanece **desligado por padrão** (sem risco de ativação acidental).
- **`clinical-trajetoria.html`** adicionada ao smoke (2 blocos inline + 3 âncoras DOM verificadas).
- Total de asserções estáticas cresceu de ~780 para **915** sem nenhuma regressão.

### Déficit persistente

**Sistemas de estilo:** 8 arquivos canônicos + 9 legados ativos (meta final ≤ 3).

```
tokens.css, np-tokens.css, ds-tokens.css,
app-skin.css, np-skin.css, escalas-hero.css,
premium-override.css, design-system.css
```

Inventário **congelado** (nenhum novo sistema adicionado desde v41). Consolidação progressiva prevista em `docs/PLANO_7_PARA_9.md` — Ondas 1–4.

### Limites mantidos

- PIN frontend é controle de interface, não segurança de produção.
- Dados clínicos reais permanecem proibidos (ver `GO_LIVE_CHECKLIST.md`).
- QR/código local não é assinatura digital ICP-Brasil.
- `auth-supabase` é scaffold; autenticação real requer backend configurado.
- CRM válido: **CRM-PE 25227 / RQE 17756** (nenhuma referência a CRM-BA no código).

### Arquivos verificados (integridade)

`routes.config.js`, `sw.js` (v6.46.0), `package.json`, `manifest.json`, `cloud-config.js` (Supabase desligado), `master-access-policy.js`, `clinical-engines.js`, `scales-bundle.js`, `np-lgpd-consent.js`, `clinical-trajetoria.html`, `secretaria.html`.

### Próximos passos (executados em v43 — ver abaixo)

1. ~~Consolidação de tokens (ds-tokens.css → tokens.css)~~ ✓ FASE 1
2. ~~Unificação de skins (app-skin.css → np-skin.css)~~ ✓ FASE 2
3. ~~Limpeza de consulta.html~~ ✓ já estava resolvida
4. ~~Formalização do App Shell~~ ✓ já estava resolvida

---

## Registro v43 — Consolidação de Estilos | Scorecard 5/5

Data: 2026-06-06

### Escopo executado

- FASE 1: Eliminação de `ds-tokens.css` e `design-system-premium.css`
- FASE 2: Absorção de `app-skin.css` em `np-skin.css`
- FASE 2b: Inline de `escalas-hero.css` (3 páginas) e `premium-override.css` (index.html)
- FASE 3: Verificada — `consulta.html` já tinha PIN completo inline
- FASE 4: Verificada — `app-shell.js/css` já existiam como arquivos dedicados

### Resultado dos testes

| Check | Resultado | Meta |
|---|---|---|
| Asserções estáticas (`npm test`) | **914 OK, 0 falhas** | 0 falhas |
| Smoke (sintaxe + DOM + lógica) | 14 OK, 0 falhas | 0 falhas |
| Motor pré-consulta | 48 OK, 0 falhas | 0 falhas |
| Lockstep de versão | ✓ v6.46.0 | coerente |
| Contraste WCAG AA | todos os pares passam | AA |
| Cascata de tema | ✓ 72 páginas | todas |
| Scorecard geral | **5/5 métricas no alvo** | 5/5 ✅ |

### Scorecard detalhado (5/5)

| Métrica | Antes | Depois | Meta |
|---|---|---|---|
| API órfãos (SPA→404) | 0 | **0** | 0 |
| Sistemas de estilo | 8 | **3** | ≤3 ✅ |
| Cobertura skin (np-skin) | 96% | **97%** | ≥60% |
| console.log/debug (prod) | 0 | **0** | 0 |
| Marcadores de conflito | 0 | **0** | 0 |

### Arquivos eliminados

- `ds-tokens.css` — bridge aliases migrados para `tokens.css`
- `design-system-premium.css` — arquivo morto (não referenciado por nenhuma página)
- `app-skin.css` (366 linhas) — absorvido em `np-skin.css` como Seção 1 global
- `escalas-hero.css` — inlined em `filtro-escalas.html`, `escala.html`, `banco-escalas.html`
- `premium-override.css` — inlined em `index.html`

### Sistemas de estilo remanescentes (3 — meta atingida)

1. `tokens.css` — tokens canônicos + aliases-ponte legacy
2. `np-tokens.css` — tokens Apple-grade (`--np-*`)
3. `np-skin.css` — skin canônica unificada (Seção 1 global + Seção 2 `.np-skin` opt-in)

### Baseline design-audit

- Antes (v42): 9068 raw values
- Após (v43): **8758** (−310 desde o início da sessão)

### Ratchet `check-styles.mjs`

- BASELINE_LEGACY: 9 → 4 arquivos legados
- MAX_LEGACY auto: 9 → 4

### Limites mantidos

- PIN frontend: controle de interface, não segurança de produção.
- Dados clínicos reais: proibidos (ver `GO_LIVE_CHECKLIST.md`).
- CRM: **CRM-PE 25227 / RQE 17756** — nenhuma referência a CRM-BA.
- `consulta-pin-fix.js`: mantido como utilitário; não é dependência de `consulta.html`.

### Próximos passos

1. Completar as Ondas 3-4 do `PLANO_7_PARA_9.md` (rollout skin + home com tokens).
2. Implementar Workstream 1 (endpoints backend) quando a infraestrutura estiver disponível.
3. Testes Lighthouse ≥90 (Workstream 4) — requer browser.
