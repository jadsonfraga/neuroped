# Plano de Testes — NeuroPed 9,5

## Problema

A maturidade do produto depende de testes reproduzíveis para filtro, escalas, pacientes, PWA, acessibilidade e performance.

## Solução aplicada

Foram executadas verificações programáticas disponíveis localmente:

- TypeScript sem emissão.
- Build client Vite.
- Validação de catálogo.
- Auditoria estática de acessibilidade.
- Auditoria de bundle gzip inicial.

## Arquivos alterados

- `docs/TEST_PLAN.md`
- Código de UX/PWA listado nos documentos correlatos.

## Critério de aceitação

### Unitários
- Pontuação das principais escalas.
- Filtro inteligente.
- Storage seguro.
- Exportação.

### E2E
- Abrir app.
- Buscar escala.
- Aplicar escala.
- Salvar em paciente.
- Gerar relatório.
- Usar offline.
- Mobile viewport.

### Auditorias
- Lighthouse Performance, Accessibility e PWA.
- Bundle size.
- Links quebrados.

## Evidência

- `npm run check`.
- `npm run build:client`.
- `npm run validate:catalog`.
- `npm run audit:a11y`.
- `npm run audit:bundle`.

## Pendências honestas

- Lighthouse não foi executado nesta entrega por depender de browser/servidor auditável.
- E2E completo autenticado precisa credenciais/seed definidos para ambiente CI.
