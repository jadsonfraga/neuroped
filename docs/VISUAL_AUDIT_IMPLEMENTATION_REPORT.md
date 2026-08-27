# Relatório de auditoria estética e implementação premium — NeuroPed

**Data:** 27 de agosto de 2026

**Branch:** `feat/operational-hardening-20260827`

**Escopo:** avaliação visual de ponta a ponta e elevação estética de superfícies públicas, familiares, institucionais, de login e de estados operacionais.

## Síntese executiva

A auditoria encontrou uma base visual já madura, com uma direção de arte própria baseada em pearl/ink, teal profundo, vinho contido, dourado de prioridade, tipografia editorial e mascotes autorais. O maior ganho potencial não era adicionar mais elementos, e sim concentrar a linguagem existente em superfícies com maior impacto: entrada profissional, galeria familiar, hero editorial, shell global e fallback de erro.

A implementação foi deliberadamente incremental. Não foram alteradas rotas, permissões, contratos de autenticação, dados clínicos, métricas de conteúdo ou fluxos de prescrição. Os efeitos são decorativos, respeitam `prefers-reduced-motion`, impressão e foco de teclado, e reutilizam somente ativos já versionados no repositório.

> Resultado: a entrada profissional passou a comunicar uma plataforma clínica proprietária e internacional; o Portal da Família deixou de apresentar slots vazios durante o carregamento inicial; o fallback operacional recebeu a mesma linguagem visual de confiança; e a auditoria visual passou a ser reproduzível por comando único.

## O que foi avaliado

| Superfície | Estado observado antes | Decisão após auditoria |
|---|---|---|
| Login profissional | Cartão central isolado em grande área de fundo, com pouca narrativa institucional | Criada composição de duas colunas: painel neural editorial + formulário preservado |
| Portal da Família | Hero forte, mas galeria com dois slots vazios em carregamento local | Assets da primeira tela marcados como prioritários, molduras estáveis e fallback editorial |
| Microsite infantil | Direção de arte forte e coerente; seletor global de zona invadia a primeira dobra | Mantido isolado; nenhuma camada clínica nova foi adicionada ao microsite |
| Vídeo-EEG | Referência interna positiva, com composição editorial marrom/creme e percurso em etapas | Preservado como benchmark visual, sem refatoração desnecessária |
| Central de ajuda | Cards escaneáveis, porém repetitivos em página longa | Mantida a estrutura; recebeu o polimento global de superfícies e ritmo |
| Sobre o NeuroPed | Conteúdo claro, com pouca variação composicional | Mantido o conteúdo; recebeu a nova assinatura global de hero e shell |
| Rotas clínicas protegidas | Redirecionamento correto ao login sem backend local | Não houve tentativa de autenticação nem relaxamento de guard |
| Fallback global de erro | Mensagem funcional, porém genérica | Adicionadas textura neural, cartão premium e mascote de apoio, preservando autocura de chunks |

## Implementação

### Entrada profissional

`client/src/pages/login.tsx` agora compõe um painel institucional com `neural-abstract.webp`, narrativa de clareza/contexto, três pilares de confiança e o mascote premium. O formulário continua usando `login`, `remoteConfigured`, mensagens de erro, `autoComplete`, rótulos e o mesmo CTA. A mudança é visual e estrutural apenas na apresentação.

### Sistema global

`client/src/styles/visual-reset.css` recebeu refinamentos centralizados para `PageHero`, shell lateral, ativos visuais, tela de erro, login e mobile. A nova camada usa os tokens existentes, não adiciona cores cruas e mantém a contagem do gate de design na baseline de **212 valores de cor crus**.

### Ativos e galeria

`SafeAssetImage` passou a aceitar `priority`, a usar transição de opacidade mais suave e a renderizar um fallback que reserva espaço e comunica indisponibilidade sem aparência de erro bruto. O `AssetShowcase` expõe a mesma opção, aplicada somente à galeria compacta do Portal da Família. A galeria final exibiu seis ativos no desktop e no mobile.

### Resiliência operacional

`AppErrorBoundary` recebeu tratamento visual para falhas de renderização, com arte neural de baixa opacidade e mascote de apoio. A recuperação automática de chunk, o cooldown de reload, os botões de recarregar/atualizar cache e a proteção dos registros locais permanecem inalterados.

### Reprodutibilidade

Foram adicionados `scripts/visual-capture.mjs`, `scripts/visual-contact-sheet.py` e o script `npm run audit:visual`. A captura visita seis rotas em desktop e três delas em mobile, aceita o aviso legal somente no ambiente local, verifica texto de erro de runtime e gera a prancha em `artifacts/visual-final-contact-sheet.png`.

## Evidência visual

A prancha consolidada está disponível em [`docs/assets/visual-audit-final-contact-sheet.png`](assets/visual-audit-final-contact-sheet.png). As capturas completas ficam no artefato local `artifacts/visual-final/` e podem ser regeneradas com:

```bash
npm run audit:visual
```

A execução final gerou nove capturas sem runtime error: seis desktop (`login`, `portal-familia`, `brincando-e-aprendendo`, `sobre-neuroped`, `eletroencefalograma`, `ajuda`) e três mobile (`login`, `portal-familia`, `brincando-e-aprendendo`).

## Validações executadas

| Gate | Resultado |
|---|---|
| `npm run check` | Aprovado |
| `npm run lint` | Aprovado com `--max-warnings=0` |
| `npm run build:client` | Aprovado; build em 6,59 s na rodada final |
| `npm run audit:design` | Aprovado; 212 ≤ baseline 212 |
| `npm run audit:assets` | Aprovado; 14 ativos oficiais íntegros e registrados |
| `npm run audit:a11y` | Aprovado no modo static-lint; 0 violações serious/critical |
| `npm run test:quick-wins` | Aprovado; autenticação, chunks, storage seguro, rotas, contratos e guards passaram |
| `npm run test:hardening-regressions` | Aprovado; EEG, Missão Saúde e performance boundaries passaram |
| `npm run audit:performance` | Aprovado; 30,88 MB de JavaScript inicial/estático medido contra os budgets vigentes, sem violações |
| `npm run audit:visual` | Aprovado; nove capturas, sem runtime error detectado |
| `git diff --check` | Aprovado; sem whitespace error |
| GitHub Actions do PR #718 | Aprovado; 18 Checks successful, 0 failing, 0 pending |

O `audit:a11y` foi executado no modo estático porque o próprio script não encontrou Chromium no caminho que procura. A auditoria visual foi executada separadamente com o Chromium do sistema (`/usr/bin/chromium`) e produziu as imagens acima.

## Guardrails preservados

Nenhum dado clínico real foi usado. Nenhuma senha foi solicitada ou acessada. Nenhum fluxo de autenticação foi contornado. Nenhuma permissão, rota protegida, API, migration, binding, storage ou contrato clínico foi alterado pela melhoria visual. As rotas clínicas continuaram redirecionando para login no ambiente local sem backend configurado.

A produção havia apresentado anteriormente uma falha persistente no microsite infantil após navegação. A mesma rota carregou corretamente na branch local e no capturador headless; por isso, a hipótese mais segura continua sendo risco de deploy/cache/chunk no ambiente publicado, a ser verificado pelos Checks e por uma publicação controlada, não por limpeza automática de cache no navegador do usuário.

## Arquivos principais

| Arquivo | Papel |
|---|---|
| `client/src/pages/login.tsx` | Nova composição institucional do login |
| `client/src/components/BrandAssets.tsx` | Prioridade, fallback e moldura de assets |
| `client/src/pages/portal-familia.tsx` | Galeria familiar com carregamento prioritário |
| `client/src/components/AppErrorBoundary.tsx` | Fallback operacional premium |
| `client/src/styles/visual-reset.css` | Tokens e acabamento global |
| `scripts/visual-capture.mjs` | Captura desktop/mobile reproduzível |
| `scripts/visual-contact-sheet.py` | Prancha de evidências |
| `docs/VISUAL_DIRECTION_PREMIUM_2026-08-27.md` | Direção de arte e guardrails |
| `docs/visual-audit-baseline.md` | Registro detalhado da auditoria antes/depois |

## Conclusão

A entrega aumenta o impacto visual sem depender de excesso de efeitos. O resultado combina **hierarquia, materiais visuais próprios, narrativa institucional, resiliência de assets e consistência operacional**. A percepção premium vem do controle de composição: imagem neural onde comunica confiança, mascote onde acolhe, dourado somente onde sinaliza prioridade e superfícies calmas onde a tarefa clínica exige concentração.
