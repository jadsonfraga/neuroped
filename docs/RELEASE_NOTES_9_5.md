# Release Notes — Iteração NeuroPed 9,5

## Problema

A experiência anterior parecia ampla, mas densa. Esta release prioriza clareza, confiança e auditabilidade.

## Solução aplicada

### UX
- Home com quatro ações principais.
- Atalhos secundários agrupados.
- Menu em accordions.

### Clínica
- Filtro guiado por idade, queixa, objetivo e contexto.
- Cards com indicação, limitação e ações.

### Compliance/PWA
- Links legais globais.
- Avisos de privacidade em pacientes.
- Offline page e cache v6.

## Arquivos alterados

- `client/src/pages/home.tsx`
- `client/src/pages/filtro.tsx`
- `client/src/components/Layout.tsx`
- `client/src/pages/pacientes.tsx`
- `client/public/sw.js`
- `client/public/offline.html`
- `docs/*.md`

## Critério de aceitação

- Build client deve passar.
- Typecheck deve passar.
- Validação do catálogo deve passar.
- Limitações devem estar explícitas.

## Evidência

- Ver `docs/AUDITORIA_NEUROPED_6_PARA_9_5.md` e `docs/TEST_PLAN.md`.

## Pendências honestas

- Não declarar média 9,5 até coletar Lighthouse, E2E, screenshots e auditoria externa pós-deploy.
