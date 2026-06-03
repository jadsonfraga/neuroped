# Auditoria — Arquitetura V3 paralela e proposta de consolidação (2026-06)

A mega-deploy V3.2 (#232, de outra sessão) introduziu uma **arquitetura clínica paralela**
(novas páginas + engines) que **coexiste e DUPLICA** funções da arquitetura clássica.
Este documento mapeia as duplicações e propõe consolidação **não-destrutiva**.

> **Importante:** NÃO removi nada. Consolidar (escolher canônico e aposentar o resto)
> é decisão sua — envolve trabalho de outra sessão e pode ter intenção que eu desconheço.

## Duplicações identificadas

### 1. Diários (listagem)
| Página | Origem | Lista |
|---|---|---|
| `diarios.html` | minha (PR #229) | diários do catálogo `NEUROPED_EDITORIAL_SCALES`, abre em `instrumento.html?id=` |
| `diarios-clinicos.html` | V3 (#232) | diários via `neuroped-diarios.js` / `clinical-router` |
**Proposta:** escolher **um** canônico. Sugiro `diarios-clinicos.html` se for a direção V3, e
fazer `diarios.html` redirecionar para ele (ou vice-versa). Hoje há dois caminhos para a mesma coisa.

### 2. Seleção de instrumentos / pré-consulta
| Página | Origem | Papel |
|---|---|---|
| `filtro-escalas.html` | clássica | filtro por idade+queixa (testes/questionários/inventários/escalas) |
| `escalas-questionarios.html` | V3 | escalas e questionários (classificação `clinical-router`) |
| `menu-instrumentos.html` | V3 | menu de instrumentos (`neuroped-router`) |
**Proposta:** definir o ponto de entrada canônico de seleção. Provável: `menu-instrumentos.html`
(hub) → encaminha para filtro/escalas/testes/diários. Evitar 3 portas para o mesmo fluxo.

### 3. Testes diretos
- `testes-diretos.html` foi **reescrito** pela V3 (stack `clinical-*`), mas `testes-diretos-engine.js` (clássico) permanece. Verificar se o engine clássico ainda é usado ou virou órfão.

### 4. Roteadores / taxonomias (vários)
- Roteamento: `clinical-router.js` (V3), `neuroped-router.js` (V3), `scales-taxonomy.js` (clássico).
- Taxonomias: `clinical-taxonomy-v3.json` **e** `clinical-taxonomy-v3.1.json` (duas versões) + `scales-taxonomy.js`.
**Proposta:** eleger **uma** taxonomia canônica (provável `clinical-taxonomy-v3.1.json`) e
aposentar a v3.0; unificar o roteamento em um módulo.

### 5. Engines de diário
- `neuroped-diarios.js` (V3) × `scales-diarios-uteis.js` (clássico, fonte dos diários do catálogo).

## Risco de NÃO consolidar
- **Divergência de dados**: o mesmo instrumento pode ser classificado/listado diferente em cada caminho.
- **Confusão de navegação**: usuário chega à mesma função por páginas diferentes.
- **Manutenção dobrada**: correção precisa ser feita em 2 lugares (e pode esquecer um).
- **Peso/precache**: dois conjuntos de engines carregando.

## Plano de consolidação seguro (proposto, faseado)
1. **Decidir canônico** por item (você confirma a direção: V3 ou clássica).
2. **Redirecionar** os duplicados para o canônico (sem apagar): `<meta http-equiv=refresh>` ou
   o próprio guard `app-shell#v=<canônico>`. Reversível.
3. **Marcar como deprecado** (comentário + remover dos hubs/precache) por 1 ciclo.
4. **Remover** só após confirmação de que nada quebrou (com os testes `npm test` verdes).
5. Unificar **uma** taxonomia + **um** roteador.

## O que preciso de você para executar
- Confirmar, por par, qual fica **canônico** (V3 ou clássico).
- Aval para aposentar a taxonomia v3.0 (mantendo v3.1).

> Enquanto não decidirmos, **nada foi removido** — tudo continua funcionando (em duplicidade).
