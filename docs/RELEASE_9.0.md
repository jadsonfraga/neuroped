# Release 9.0 real — estado atual

## Veredito

Não declarar release 9.0 real nesta PR.

## Nota antes

não medido. Linha de base não tinha scripts npm/scorecard executáveis no repositório.

## Nota depois

Ver `docs/PLACAR_9.0.md`, gerado por `npm run scorecard`.

## Eixos verdes

- D1 parcialmente verde no scorecard estático: fallback honesto para `/api` e referências locais sem quebra.
- D2 verde quando `npm run check` e `npm run lint` passam.

## Eixos amarelos

- D3 build/perf: build estático validado, Lighthouse não medido.
- D5 testes: 12 specs estáticas/e2e passam; Playwright real versionado mas não executado.
- D6 clínico: conteúdo preservado; validação humana não medida.

## Eixos vermelhos

- Produção Cloudflare acessada por automação retornou 403 neste ambiente, impedindo auditoria visual real.

## Eixos não medidos

- D4 axe serious/critical.
- Lighthouse.
- Browser real Playwright.
- Prints antes/depois.
- Revisão médica humana.

## Evidências de CI

- Workflow estático existente: `.github/workflows/static-check.yml`.
- Esta PR adiciona scripts npm; a inclusão em CI deve ser feita quando Playwright/browser estiver disponível.

## Evidências de navegador

não medido.

## Prints

não medido.

## Riscos restantes

- Sem fonte editável, não é seguro refatorar design system/home/fluxo clínico diretamente em bundles minificados.
- Backend público não comprovado.
- Cloudflare Pages não documentado no repositório.

## Próxima versão

- PR seguinte: restaurar fonte do app e configurar Playwright real no CI.
- Depois: refatorar fluxo “Encontrar escala → Aplicar → Resultado” com E2E desktop/mobile e revisão clínica humana.

## Decisões clínicas pendentes

- Aprovação humana de interpretações e recomendações por escala.
- Proveniência e revisão de fontes clínicas.
- Limites éticos de relatório/PDF.
