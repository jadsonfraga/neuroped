# Plano Sprint 9.0 real — NeuroPed

## Princípio

Não declarar 9,0 sem evidência. A nota global deve ser o menor eixo medido, com eixos não medidos explicitados.

## Fatia executada nesta PR

1. Restaurar maturidade mínima de engenharia em repositório estático: `package.json`, lockfile e scripts npm.
2. Criar scorecard vivo e honesto.
3. Criar auditoria inicial com separação entre medido e não medido.
4. Implementar fallback honesto para `/api` em ambiente público estático.
5. Versionar specs Playwright futuras e uma suíte estática executável como prova mínima enquanto browser real está indisponível.
6. Documentar deploy e arquitetura local-first.

## Fora desta PR

- Refatoração visual real da home e design system, porque o repositório contém build estático compilado e não contém `src/` editável.
- Alteração profunda do fluxo clínico, porque isso exige fonte editável, testes de navegador e autorização/revisão médica.
- Declaração de release 9.0.

## Próximas PRs recomendadas

1. Importar/restaurar fonte React/TypeScript do app para permitir refatoração segura.
2. Habilitar Playwright no CI com browsers cacheados.
3. Rodar auditoria visual real de produção e anexar prints.
4. Refatorar home/fluxo principal no código-fonte, não em bundles minificados.
5. Integrar axe e Lighthouse ao scorecard.
6. Executar validação clínica humana documentada.
