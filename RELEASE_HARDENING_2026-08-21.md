# NeuroPed — Hardening e prontidão de release

**Data:** 21 de agosto de 2026  
**Escopo:** frontend, backend, contratos clínicos, acesso, navegação, acessibilidade, performance, build, testes e deploy.

## Resumo executivo

Esta rodada corrigiu falhas funcionais reproduzidas no roteamento, acessibilidade e caminho crítico de carregamento. A rota `/marcacao` foi alinhada ao contrato público já exercido pela jornada de Secretaria IA. A rota de Vídeo-EEG deixou de redirecionar automaticamente para um domínio externo e passou a apresentar uma página interna acessível, com ação explícita para abertura externa. O ramo dessa rota foi separado do shell clínico para eliminar landmarks `main` aninhados sem remover o `RouteGuard`.

O shell clínico passou a carregar o Layout por `React.lazy`, a Home deixou de materializar o catálogo clínico completo no primeiro render, `appMetrics` deixou de importar catálogos clínicos e farmacológicos pesados e o Splash deixou de embutir o JPEG base64 gigante no chunk inicial. O SVG institucional público é usado apenas na splash; o asset base64 foi preservado para os fluxos que precisam de bytes locais para geração de PDF.

A navegação secundária do sidebar é hidratada no período ocioso do navegador. A seção principal e a seção que contém a rota atual permanecem disponíveis no primeiro paint; após o idle callback, todas as seções autorizadas são montadas. A mudança mantém filtros de zona, autenticação, RBAC e guards de rota intactos.

## Alterações realizadas

| Área | Correção | Evidência |
| --- | --- | --- |
| Navegação | `/marcacao` entrou na lista única de rotas públicas. | `scripts/guards/validate-public-split.mjs` e teste de Secretaria IA |
| Acessibilidade | EEG ganhou título, idioma, `h1`, landmark único e link externo com `noopener`. | `client/src/pages/eletroencefalograma.tsx` |
| Acessibilidade | O EEG foi removido do segundo `main` do shell clínico. | `client/src/App.tsx` |
| Performance | Layout clínico passou a ser carregado sob demanda. | `client/src/App.tsx` |
| Performance | Catálogo de busca da Home passou a carregar somente quando o usuário busca. | `client/src/pages/home.tsx` |
| Performance | Métricas do shell foram reduzidas a um snapshot leve. | `client/src/data/appMetrics.ts` |
| Performance | O JPEG base64 da splash foi removido do chunk inicial. | `client/src/components/SplashScreen.tsx` |
| Performance | Seções secundárias do sidebar passaram a hidratar em idle. | `client/src/components/Layout.tsx` |
| Acessibilidade | Overrides de `aria-label` que divergiam do texto visível foram removidos para Nesplora no desktop e mobile. | `Layout.tsx` e `MobilePrimaryDock.tsx` |
| Testes | Regressões EEG e fronteiras de performance foram adicionadas ao `verify:release`. | `tests/unit/eeg-route-accessibility-static.test.mjs`, `tests/unit/performance-boundaries.test.mjs`, `package.json` |

## Gates executados

| Gate | Resultado |
| --- | --- |
| TypeScript (`npm run check`) | Passou |
| ESLint sem warnings | Passou |
| Build frontend e fullstack | Passou |
| `npm audit --omit=dev --audit-level=high` | 0 vulnerabilidades |
| Testes clínicos, segurança, ownership, operações, filtros e documentos | Passaram no verify até o Lighthouse |
| Axe em navegador real, cobertura integral de 96 rotas | 0 violações serious/critical; 0 violações totais no relatório final |
| Regressões de hardening EEG/performance | Passaram |
| Lighthouse | Melhorou na Home, mas ainda abaixo do gate de 95 em rotas pesadas |

## Performance observada

A remoção do logo base64 reduziu o chunk `SplashScreen` de aproximadamente 132,84 kB para 4,53 kB, e de aproximadamente 98,94 kB para 1,74 kB gzip. O entrypoint permaneceu em aproximadamente 309 kB minificado e 97 kB gzip. A hidratação ociosa do sidebar elevou a Home observada para performance 89 e reduziu o TBT observado para 267 ms em uma execução Lighthouse.

As rotas mais pesadas ainda incluem `/filtro`, `CARS`, `CBCL`, `CAA`, `/fluxograma` e `/laudo-neuroped`. O Lighthouse é sensível à carga do ambiente e apresentou variação entre execuções, mas o problema é real: há TBT acima de 160 ms e chunks clínicos grandes, especialmente `generic-scale` e `scaleFilter`. O release não deve declarar performance perfeita enquanto essa etapa de divisão de dados e renderização não for concluída.

> Decisão de segurança: não relaxei o threshold do Lighthouse para transformar falha em sucesso. O gate continua sinalizando o risco real, enquanto os demais gates clínicos, de autenticação e acessibilidade permanecem rigorosos.

## Preparação de deploy

Os workflows existentes publicam o redirecionador canônico no GitHub Pages, o frontend fullstack e Functions no Cloudflare Pages e o espelho frontend na Vercel. Ambos os workflows exigem `main`, executam `npm run verify`, validam secrets, publicam sentinelas por commit e executam health checks de autenticação. Nenhuma publicação externa foi disparada nesta rodada porque o gate oficial ainda falha no Lighthouse e porque a publicação em produção exige confirmação explícita após a revisão final do commit.

## Próximos bloqueadores antes do deploy

A divisão final das rotas de escala deve ser feita para que questionários, gráficos e relatórios não compartilhem catálogos agregados no primeiro render. Em seguida, o Lighthouse integral deve ser repetido em build limpo e os thresholds devem ser mantidos, não reduzidos. Após todos os gates verdes, o commit deve ser publicado em `main`; os workflows então executarão a publicação controlada e validarão as sentinelas de GitHub Pages, Cloudflare e Vercel.

## Segunda rodada de performance permanente

A segunda rodada removeu importações estáticas de `ClinicalReport` e `SaveToPatient` do `GenericScale`, do runner interativo, do M-CHAT e do CARS. Esses módulos agora são carregados somente quando o resultado é exibido, com um estado acessível de carregamento; os dados enviados ao relatório e ao salvamento permanecem os mesmos.

M-CHAT e CARS também foram extraídos do arquivo monolítico `data/scales.ts` para `data/mchat.ts` e `data/cars.ts`. `data/scales.ts` mantém reexports compatíveis para consumidores existentes, enquanto as rotas usam as fontes dedicadas. O chunk específico de M-CHAT caiu para aproximadamente 1,46 kB mais o page chunk de aproximadamente 8,07 kB; CARS passou a usar um módulo dedicado de aproximadamente 6,15 kB mais o page chunk de aproximadamente 8,69 kB.

O motor do filtro agora não executa ranking clínico quando não há critério selecionado. A tela inicial continua exibindo instrução e controles; o ranking só é calculado quando há busca, idade, queixa, respondente, sinais, finalidade ou modo `Todas`. Os testes de filtro clínico e de segurança passaram após a alteração.

Os novos testes de hardening continuam integrados ao `verify:release`, e TypeScript, ESLint, build frontend, testes clínicos e segurança passaram nesta rodada. O Lighthouse apresentou melhora do filtro para TBT observado na faixa de centenas de milissegundos, mas ainda não atingiu o threshold de 160 ms em todas as rotas; não foi feito relaxamento artificial de threshold.

## Homologação determinística adicional

Os gates de política de acesso, navegação, integridade de dados, shell offline, bundle, inventário, identidade institucional e documentos clínicos passaram na rodada final. O bundle reportou entrypoint de aproximadamente 94,23 kB gzip, JavaScript inicial real de aproximadamente 147,76 kB gzip e maior chunk bruto de aproximadamente 1,20 MB, dentro dos tetos internos atualmente configurados. O maior chunk ainda é o `generic-scale`; ele permanece funcional e é carregado por rota, mas deve continuar como alvo de refinamento futuro se o objetivo for performance de nível excepcional em conexões lentas.

Os testes de backend e hardening também passaram: autenticação fail-closed, lockout, rotação de refresh, ownership, prontuário, documentos, consentimentos Express/Cloudflare, limites de entrada, contratos de health, RBAC, rotas e workflows. A auditoria de acessibilidade em navegador real permaneceu sem violações serious/critical e sem violações totais no relatório executado.
