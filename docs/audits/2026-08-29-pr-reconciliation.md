# Matriz de reconciliação de PRs — 2026-08-29

Baseline: `main@21b480381de6e9892b67f22dace8ab28812ce300`.
Dados estruturados: [`2026-08-29-pr-reconciliation.json`](./2026-08-29-pr-reconciliation.json)
(coletados da API pública do GitHub em 2026-08-29; contagem de arquivos amostrada até 100 por PR).

**Status das decisões: PROVISÓRIAS.** A verificação local reproduzida nesta
execução passou nos gates de tipagem, lint e contratos/regressões selecionados;
os gates que dependem de serviços externos ou de publicação continuam sem
prova local. Nenhuma decisão abaixo autoriza merge sem checks verdes
verificáveis. Nenhuma PR histórica foi fechada nesta etapa (regra 1.4 da
missão: fechar somente após a substituta correspondente ser mesclada com prova).

## Decisões por PR

| PR | Escopo observado | Decisão provisória | Justificativa |
|----|------------------|--------------------|---------------|
| #704 | Identidade E2E dedicada (ci + functions + tests, 19 arquivos) | **ADOPT_ATOMIC (candidata)** | Escopo único alinhado à Fase 7; aguarda checks verdes. |
| #708 | Reconciliação "witch-hunt" (85 arquivos, 6 domínios) | **REIMPLEMENT** | Multi-domínio; portar commits atômicos por fase, não merge wholesale (proibição 3). |
| #710 | Perf: reflows em fluxograma/laudo (claude[bot], draft) | **ADOPT_ATOMIC (candidata)** | Escopo coeso de performance; validar com build/lint antes. |
| #713 | Redesign navegação/cockpit (42 arquivos) | **REIMPLEMENT (P2)** | UI ampla; só após P0/P1 verdes (Fase 12). |
| #716 | Probe de #704 sobre reconcile branch (draft) | **SUPERSEDED** | Mesma head da #704; a #704 é o veículo. |
| #717 | Probe de #713 sobre reconcile branch (draft) | **SUPERSEDED** | Mesma head da #713; a #713 é o veículo. |
| #718 | Hardening operacional LIVE (69 arquivos, 9 domínios) | **REIMPLEMENT** | Multi-domínio; separar por fases 2/4/10. |
| #719 | Separar avaliação cognitiva + nova bateria (60 arquivos) | **REIMPLEMENT** | Mistura frontend, dados clínicos e scripts; exigir separação verdade-clínica (Fase 9). |
| #720 | 20-tab SaaS operations center (frontend) | **REIMPLEMENT (P2)** | Frontend novo; após núcleo de tenant (Fase 2). |
| #721 | Harden SaaS multi-tenant e LGPD (31 arquivos) | **REIMPLEMENT** | Núcleo da Fase 2/8; portar por commits atômicos com testes IDOR de duas clínicas. |
| #722 | Hub SaaS: parceiros, comunicação e NPS (29 arquivos) | **REIMPLEMENT** | Alvo direto das Fases 4 (outbox, sem falso sucesso) e 5 (NPS correto); não adotar sem esses contratos. |
| #723 | Console operacional de tenant (base: #721) | **REIMPLEMENT** | Cadeia dependente (#721→#723→#724→#725); reimplementar na ordem de dependência. |
| #724 | Fechar lacunas de hardening (base: #723) | **REIMPLEMENT** | Idem cadeia. |
| #725 | Gates de produção (base: #724) | **REIMPLEMENT** | Idem cadeia; gates entram na Fase 10. |
| #726 | SaaS Phase 1 — schemas e migrações (draft, +5048) | **REIMPLEMENT** | Migrações novas exigem prova de ledger e matriz da Fase 3 antes de qualquer adoção. |
| #727 | Integrar rascunho Qwen ao laudo PANT | **REIMPLEMENT (P2)** | Conteúdo de laudo; passar pelo gate de verdade clínica (Fase 9). |
| #728 | Merge monolítico "all built features" (draft, 100+ arquivos, 8 domínios) | **REJECT como veículo** | Proibição explícita da missão; conteúdo redistribuído pelas decisões acima. Fechar somente após substitutas mescladas com prova (regra 1.4). |
| #731 | Golden rule + auditoria v43 + CSS (75 arquivos raiz) | **REIMPLEMENT (P2)** | Fase 12.2 exige separar lógica clínica da limpeza CSS desta PR. |
| #732 | Security: ownership/auth/crypto (37 arquivos) | **REIMPLEMENT** | Conteúdo P0 relevante (Fase 2/6), mas mistura frontend+api+scripts; portar por domínio. |
| #733 | Zera erros ESLint (±316/−316) | **ADOPT_ATOMIC (candidata)** | Formatação/lint pura é permitida como PR separada; confirmar ausência de mudança funcional no diff antes do merge. |
| #734 | Atualiza BUILD_ID/buildInfo manualmente | **REJECT** | Artefatos gerados devem ser reproduzidos pela CI, não commitados à mão (Fase 12.4). |
| #737 | Feed diário Instagram para famílias (criada 2026-08-29) | **OUT_OF_SCOPE_NEW** | Posterior à baseline da missão; tratar em fluxo normal de revisão. |
| #738 | Premium Visual v13 + trava antirregressão (criada 2026-08-29) | **OUT_OF_SCOPE_NEW** | Posterior à baseline; tratar em fluxo normal de revisão. |

## Ordem de dependência recomendada (Fase 1.3)

1. PR-base: AGENTS.md + baseline + esta matriz (branch `codex/reconcile-neuroped-2026-08-29-21b4803`).
2. Determinismo do inventário diário (correção aplicada em
   `scripts/generate-daily-authorial-fallback.mts`; a regressão compara bytes e
   SHA-256 de duas reexecuções).
3. #704 (E2E dedicada) após checks.
4. Núcleo tenant (reimplementação de #721/#732 por domínio) + testes IDOR.
5. Comunicações/outbox/NPS (reimplementação de #722).
6. Migrações SaaS (#726) após prova de ledger.
7. Cadeia #723→#724→#725 reimplementada sobre o núcleo.
8. P2: #713/#719/#720/#727/#731 (UI/CSS/conteúdo).
9. Fechamento de #728/#716/#717 com links das substitutas.

## Verificação local desta retomada

- `npm run verify:release` equivalente executado com Node 24: **passou**.
- Lint, TypeScript, auditorias de segurança/acesso, catálogo, filtros, clínica,
  interativas, notes, cognitive lab, bundle e shell offline: **passaram**.
- O E2E de Missão Saúde executou o fallback estático porque Chromium não está
  instalado; não foi registrada uma falsa aprovação visual.
- O teste dinâmico do fallback confirmou `generatedAt` estável e SHA-256
  idêntico entre reexecuções da mesma data.
- A suíte local de laudos/PDF passou: contratos clínicos, assinatura PFX/P12
  efêmera, retenção permanente, largura, CAA, registro de 425 verificações e
  fidelidade tela→PDF.
- Após a correção de fidelidade em `GenericScale`, `verify:release` foi
  executado novamente até o fim com sucesso.

## Classificação solicitada — mergeável / conflitante / obsoleta / duplicada

Dados de `mergeable`/`mergeable_state` obtidos ao vivo da API do GitHub
(`GET /repos/jadsonfraga/neuroped/pulls/{n}`) nesta retomada — ver
[`2026-08-29-pr-mergeable.json`](./2026-08-29-pr-mergeable.json). "Mergeável"
aqui é uma constatação técnica do GitHub (sem conflito de texto contra
`main`), **não** uma autorização de merge — isso continua exigindo os checks
verdes e as regras de PROIBIÇÕES ABSOLUTAS da missão.

| PR | Classificação | Base do veredito |
|----|----------------|-------------------|
| #704 | **Mergeável** | `clean`; candidata a `ADOPT_ATOMIC` após checks. |
| #708 | **Mergeável** | `clean`, mas 85 arquivos/6 domínios — dividir antes de mesclar (`REIMPLEMENT`). |
| #710 | **Conflitante** | `dirty` — não mescla contra `main` atual sem rebase manual. |
| #713 | **Mergeável** | `clean`; conteúdo P2 (UI), aguardar P0/P1. |
| #716 | **Duplicada** (e conflitante) | `dirty`; é um probe da própria #704 sobre branch de reconciliação — mesma intenção, veículo redundante. |
| #717 | **Duplicada** (e conflitante) | `dirty`; probe da própria #713 — mesma observação. |
| #718 | **Mergeável (checks falhando)** | `unstable` — sem conflito de texto, mas status checks não estão verdes. |
| #719 | **Mergeável** | `clean`. |
| #720 | **Mergeável** | `clean`. |
| #721 | **Mergeável** | `clean`. |
| #722 | **Mergeável** | `clean`. |
| #723 | **Mergeável** | `clean`. |
| #724 | **Mergeável** | `clean`. |
| #725 | **Mergeável** | `clean`. |
| #726 | **Mergeável (checks falhando)** | `unstable`. |
| #727 | **Mergeável (checks falhando)** | `unstable`. |
| #728 | **Obsoleta** | `unstable`/draft; é o merge monolítico proibido explicitamente pela missão — conteúdo já redistribuído pelas decisões acima. |
| #731 | **Conflitante** | `dirty`. |
| #732 | **Mergeável (checks falhando)** | `unstable`. |
| #733 | **Conflitante** | `dirty`. |
| #734 | **Obsoleta** | `clean`, mas atualiza `BUILD_ID`/`buildInfo` manualmente — artefato gerado que a Fase 12.4 exige ser reproduzido pela CI, não commitado à mão. |
| #737 | **Mergeável** | `clean`; posterior à baseline, fluxo normal de revisão. |
| #738 | **Mergeável** | `clean`; posterior à baseline, fluxo normal de revisão. |

Nenhum merge foi executado. Correções triviais e seguras identificadas nesta
retomada (alinhamento de versão de Node nos workflows e o determinismo do
inventário diário) foram aplicadas **localmente**, na branch
`codex/reconcile-neuroped-2026-08-29-21b4803`, sem push.

## Bloqueios externos registrados

- `BLOCKED_EXTERNAL_GITHUB_AUTH`: criação da issue rastreadora e leitura de
  branch protection retornam HTTP 401 sem token. Ação exata: criar PAT com
  escopos `repo` (ou instalar `gh` autenticado) e executar
  `POST /repos/jadsonfraga/neuroped/issues` com o título
  `[UORC] Reconciliação segura NeuroPED — D1, tenant, LGPD, clínica e release`.
  Verificação: issue visível e referenciada nas PRs.
- `BLOCKED_ENV_GTK3_MISSING`: o motor de PDF PANT (`supneuroped_pant.py`, fora
  deste repositório, em `C:\Users\User\`) depende do WeasyPrint, que nesta
  máquina Windows não consegue importar (`libgobject-2.0-0` ausente — WeasyPrint
  usa Pango via cffi para shaping de texto). Instalar o runtime GTK3 exige um
  instalador de sistema, uma mudança de ambiente que não é revertida por
  simples `pip uninstall` e que não executei sem aprovação explícita. Ação
  exata: instalar o runtime GTK3 para Windows (ex.: via MSYS2,
  `pacman -S mingw-w64-x86_64-gtk3`, adicionando o `bin` ao PATH) e então
  `python -m pip install --force-reinstall weasyprint`. Verificação:
  `python -c "import weasyprint"` sem erro.
