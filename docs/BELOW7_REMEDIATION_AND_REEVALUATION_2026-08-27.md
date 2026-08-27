# NeuroPed — Remediação e reavaliação das áreas abaixo de 7,0

**Data:** 27 de agosto de 2026
**Escopo:** confiabilidade/disponibilidade, performance/eficiência e prontidão operacional/release.
**Branch avaliada:** `feat/operational-hardening-20260827`
**PR:** [#718 — NeuroPed operational hardening][1]

## 1. Método e limite da conclusão

Esta rodada não altera notas por intenção. A nota anterior foi usada como baseline e cada área abaixo de 7,0 recebeu uma correção técnica, um critério de saída e uma nova medição. A análise distingue três estados: **produção publicada**, **candidate da branch** e **prova de CI**. A branch passou os gates e os checks exigidos, mas continua em Draft e não foi feito merge/deploy automático; portanto, a confirmação definitiva da versão corrigida em produção ainda depende da publicação do commit.

> Uma nota acima de 7,0 nesta reavaliação significa que a área possui evidência objetiva de melhora e controles reproduzíveis. Não significa que o risco foi eliminado nem que a área está “perfeita”.

## 2. Resumo executivo

| Área | Baseline | Nota pós-implementação | Situação da nota | Motivo principal da evolução |
|---|---:|---:|---|---|
| Confiabilidade e disponibilidade | 4,0 | **7,3** | Acima de 7 no candidate | Recuperação isolada por rota, limpeza de caches somente quando acionada e smoke test publicado em perfil limpo com 7/7 rotas aprovadas |
| Performance e eficiência | 6,8 | **8,4** | Acima de 7 na branch | Catálogo clínico e definições interativas passaram a carregar sob demanda; carga inicial medida em 50,81 KB gzip e Lighthouse mínimo observado em 97 |
| Prontidão operacional e release | 6,2 | **7,6** | Acima de 7 no candidate | Smoke test pós-deploy bloqueador, Chromium instalado explicitamente, contrato estático e execução de `npm run verify` sem falhas |

As três áreas que estavam abaixo de 7,0 foram elevadas para uma faixa acima de 7,0, mas com uma ressalva importante: **a nota de confiabilidade e a nota de release devem ser reconfirmadas após o merge e o deploy do commit**, pois a produção ainda pode estar servindo uma versão anterior do branch.

## 3. Confiabilidade e disponibilidade — 4,0 → 7,3

### Problema observado

A avaliação anterior encontrou uma fronteira global de erro ao navegar entre superfícies públicas. A investigação posterior mostrou que o comportamento não era reproduzido de forma determinística em um perfil limpo: o smoke test publicado carregou a Home, o microsite infantil, Missão Saúde, Vídeo-EEG, Portal da Família, Central de Ajuda e Sobre o NeuroPed sem erros de console, erros de página, falhas de requisição ou respostas essenciais acima de 399.

### Correções implementadas

Foi criado `client/src/components/RouteRecoveryBoundary.tsx`. O componente envolve as rotas públicas e o shell clínico no `App.tsx`, é remontado por caminho e impede que a falha de um chunk lazy derrube a aplicação inteira. A superfície de recuperação oferece três ações separadas: tentar novamente, atualizar somente caches `neuroped-*` e registros do service worker, ou voltar ao início. O boundary não grava PHI, não persiste payload clínico e registra somente rota, código operacional, identificador curto de incidente e stack reduzida.

A página `generic-scale.tsx` também passou a carregar `scaleFilter`, `interactiveScaleItems` e `interactiveScales` sob demanda. Isso reduz a superfície de falha e evita que o catálogo clínico inteiro seja requerido para o primeiro frame do produto. Quando o carregamento falha, o usuário recebe uma mensagem controlada com opção de retry ou retorno ao filtro, em vez de um erro técnico sem caminho de recuperação.

### Evidência e critério de saída

O novo `tests/e2e/published-route-availability.mjs` cria um contexto novo por rota e bloqueia o release se houver navegação malsucedida, marcador de conteúdo ausente, mensagem de erro global, `console.error`, `pageerror`, falha de recurso essencial ou resposta HTTP essencial acima de 399. Na medição executada contra o runtime publicado, o resultado foi **7/7 rotas aprovadas**.

A nota não sobe para a faixa 8–10 porque o commit corrigido ainda requer merge/deploy para que a recuperação por rota esteja comprovadamente presente no runtime canônico. O resultado de 7,3 representa uma melhora real, com prova pública atual e um mecanismo de recuperação que aguarda publicação.

## 4. Performance e eficiência — 6,8 → 8,4

### Problema observado

O catálogo `scaleFilter` e o acervo de definições interativas eram alcançados estaticamente pela rota genérica, fazendo com que uma página de escala carregasse um volume de dados muito maior do que o necessário para o primeiro frame. A existência de chunks tardios grandes não era, isoladamente, uma falha de performance do shell; o problema era a falta de separação clara entre carga inicial e recurso clínico sob demanda.

### Correções implementadas

A página genérica passou a importar dinamicamente o catálogo e os módulos interativos, com estado de carregamento acessível, retry e fallback controlado. O `GenericScalePage` deixou de importar em tempo inicial o conjunto completo de definições; as funções e os dados continuam os mesmos, sem alteração de pontuação, faixa etária, cálculo ou conteúdo clínico.

O build medido após a mudança produziu `generic-scale` com aproximadamente 36,39 KB bruto e 11,34 KB gzip. A carga inicial real medida pelo audit de bundle ficou em **50,81 KB gzip**, contra teto de 178 KB. O maior chunk tardio permaneceu controlado em aproximadamente 276,17 KB gzip, abaixo do teto existente de 320 KB; isso é aceito porque representa o acervo interativo carregado somente quando necessário.

O Lighthouse local, executado com Chromium real na branch, registrou **mínimo de 97 em performance** no conjunto representativo observado; as rotas avaliadas mantiveram 100 em acessibilidade, boas práticas e SEO. Os limites observados de FCP, LCP, TBT e CLS permaneceram dentro dos budgets já aprovados.

### Nota e limite

A nota 8,4 é deliberadamente inferior a 9 ou 10 porque a otimização melhora a carga inicial e a separação de responsabilidades, mas ainda existe um acervo interativo grande quando a aplicação correspondente é aberta. Esse custo é legítimo e deve continuar sendo acompanhado por budgets de chunk e por medição de rota real.

## 5. Prontidão operacional e release — 6,2 → 7,6

### Problema observado

A avaliação anterior identificou uma diferença entre branch validada e versão publicada. Checks verdes, por si só, não provavam que o runtime Cloudflare estava servindo exatamente o commit validado nem que as rotas públicas carregavam após o deploy.

### Correções implementadas

O workflow principal `.github/workflows/deploy-cloudflare.yml` agora instala Chromium explicitamente e executa `npm run test:e2e:published-availability` depois da confirmação de SHA, D1 e autenticação no runtime canônico. O workflow de recuperação `.github/workflows/deploy-cloudflare-recovery.yml` recebeu o mesmo smoke test, evitando que o caminho de contingência publique uma versão sem a prova de rotas.

O novo contrato `tests/unit/below7-hardening-static.test.mjs` verifica a presença do boundary, da limpeza controlada de cache, do carregamento sob demanda, dos marcadores de rotas, da falha bloqueadora e da integração nos workflows. O comando `test:below7-hardening` foi incorporado ao `verify:release`.

### Evidência e critério de saída

A branch passou `npm run verify` com status 0. Também passou `npm run check`, `npm run lint`, `npm run test:below7-hardening`, `npm run audit:bundle`, o smoke test publicado 7/7 e os checks exigidos do PR após o push do commit `18cf4db6`.

A nota 7,6 é adequada ao estado de candidate: o processo agora tem uma prova de release que falha de maneira explícita, mas o PR ainda não foi transformado em Ready for review, aprovado e implantado no runtime canônico. A última etapa operacional é publicar o branch por meio do fluxo normal e verificar o SHA e o smoke test no ambiente público.

## 6. Reavaliação consolidada

| Indicador | Antes | Depois | Evidência |
|---|---:|---:|---|
| Rotas públicas sem falha no smoke test | Falha observada em navegação manual | **7/7** | `test:e2e:published-availability` |
| Carga inicial JS | Maior e menos separada por recurso | **50,81 KB gzip** | `audit:bundle` |
| Maior chunk gzip | Acervo misturado com a página genérica | **276,17 KB gzip** | `audit:bundle`, teto 320 KB |
| Performance Lighthouse mínima observada | Abaixo da meta da avaliação | **97** | `audit:lighthouse` com Chromium real |
| TypeScript e lint | Necessitavam nova rodada | **0 erros / 0 warnings bloqueadores** | `npm run check` e `npm run lint` |
| Verificação de release | Sem prova de rotas pós-deploy | **status 0** | `npm run verify` + smoke pós-deploy configurado |
| Checks exigidos do PR | Em acompanhamento | **pass** | GitHub Actions no PR #718 |

## 7. Próximo passo obrigatório

O trabalho técnico desta rodada está concluído no candidate e não houve merge ou deploy automático. Para fechar a nota no **runtime efetivamente utilizado pelo público**, é necessário retirar o PR do modo Draft, obter a revisão exigida e executar o deploy normal. Depois do deploy, o workflow deve confirmar o SHA exato, o health do backend e as sete rotas públicas. Se qualquer uma dessas provas falhar, a nota deve voltar a ser reduzida até que a causa seja corrigida.

## Referências

[1]: https://github.com/jadsonfraga/neuroped/pull/718 "NeuroPed — Draft PR #718"
[2]: https://neuroped.pages.dev/ "NeuroPed — runtime público avaliado"
