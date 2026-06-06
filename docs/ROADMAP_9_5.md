# Roadmap 9,5 — NeuroPed

## Problema

O produto já possui muitos módulos, porém maturidade 9,5 exige prova técnica contínua, consistência de escala, fluxos de paciente e métricas automatizadas.

## Solução aplicada nesta etapa

1. Reduzir densidade inicial com home em quatro ações principais.
2. Transformar o filtro em triagem guiada.
3. Melhorar navegação lateral com grupos recolhíveis.
4. Expor compliance no rodapé e no cadastro de pacientes.
5. Documentar evidências, limites e próximos passos.

## Arquivos alterados

- `client/src/pages/home.tsx`
- `client/src/pages/filtro.tsx`
- `client/src/components/Layout.tsx`
- `client/src/pages/pacientes.tsx`
- `client/public/sw.js`
- `client/public/offline.html`

## Critério de aceitação

- Usuário entende o app em até 10 segundos.
- O caminho principal é: home → filtro → escala → paciente → relatório.
- Toda afirmação de melhoria possui arquivo, teste ou pendência documentada.

## Evidência

- Build client concluído.
- Typecheck concluído.
- Validação de catálogo concluída.

## Pendências honestas

- Criar Playwright E2E para fluxo completo autenticado.
- Padronizar todas as páginas de escala com componente único de aplicação guiada.
- Medir Lighthouse mobile em produção após deploy.
