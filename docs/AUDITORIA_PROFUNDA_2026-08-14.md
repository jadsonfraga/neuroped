# Auditoria profunda NeuroPed — 14/08/2026

## Resumo executivo

Auditoria executada sobre o commit `8d368124635422e0e128eaa105616c3c6cfeaa17`, cobrindo frontend React/PWA, filtros e instrumentos clínicos, persistência, Cloudflare Pages Functions, servidor Express, GitHub Actions, acessibilidade, backup e rotas.

O lote corrige falhas de segurança clínica, perda/silenciamento de dados, paginação incompleta, navegação, modais, mobile, privacidade local e automação. Nenhuma alteração deste lote autoriza ativar `Clinical LIVE`: os gates criptográficos e administrativos listados abaixo continuam obrigatórios.

## Correções implementadas

### Segurança clínica

- C-SSRS: Q1 e Q2 são sempre apresentadas; Q2 positiva abre Q3–Q5; Q6 aparece após Q2. A mesma função controla visibilidade e poda respostas obsoletas.
- PHQ-A: item 9 positivo impede concluir até confirmação explícita do protocolo de segurança; alerta recebe foco, permanece no resultado e entra no relatório/prontuário sem cálculo de escore.
- Filtro em suicídio/psicose falha fechado: não usa rastreador de desenvolvimento/banda larga para preencher pódio, inclusive quando existe co-queixa.
- Respondente explícito deixou de ser relaxado em rescue/fallback.
- C-SSRS clínica volta a respeitar sua faixa de 6–17 anos; o piso de 8 anos permanece apenas para autoquestionário.
- Cards OPB só resolvem instrumentos que já passaram por idade, respondente, licença e bloqueios clínicos no conjunto refinado.

Referências de conferência da C-SSRS: [Columbia Lighthouse Project](https://cssrs.columbia.edu/wp-content/uploads/Columbia_Protocol.pdf) e [CMS — C-SSRS Screen Version](https://www.cms.gov/files/document/cssrs-screen-version-instrument.pdf).

### Privacidade e dados

- O filtro não persiste mais busca, queixas, sinais, idade, respondente, comunicação, letramento ou finalidade clínica em `localStorage`.
- Apenas a preferência não clínica de disponibilidade usa chave versionada; o payload clínico legado é expurgado no startup.
- O fluxograma envia prefill por `history.state`, consumido uma vez.
- Backup pagina pacientes e resultados nos dois runtimes, valida total, IDs, shape e estabilidade, respeita `Retry-After` em `429` e não cria arquivo parcial.
- `/api/patients/:id/results` ganhou envelope opt-in `{ data, total, page, limit, hasMore }`, ordenação determinística e compatibilidade com array legado sem parâmetros.
- Importação separa pacientes integrais, parciais e não criados; falhas de resultados não são mais anunciadas como sucesso.
- Exclusão de avaliação exige diálogo acessível e reconcilia a query em `onSettled`, inclusive após 404/conflito entre abas.
- Exportação de imagem e clipboard aguardam conclusão e exibem erro real.

### UX, acessibilidade e PWA

- Paleta navega para a rota real `/paciente/:id` e codifica o identificador.
- Dock móvel reconhece detalhe singular e runners `/cognitive-lab/*`.
- Toast móvel não ocupa/captura a viewport inteira; somente o toast permanece interativo.
- Removido auto-scroll do filtro que sequestrava a posição ao digitar/selecionar.
- Aviso legal agora limita altura, rola, move/trava/restaura foco e isola o scroller.
- `ConfirmDialog` usa Radix AlertDialog, com Escape, foco, fundo inerte e restauração.
- Legal gate, onboarding, tour, ajuda e paleta são serializados; “Ler Termos” não é coberto pelo onboarding.
- Estados loading/error/empty são distintos em pacientes e resultados; falha de resultados não desmonta o cockpit clínico.
- Service worker prioriza o cache da versão atual e usa cache legado somente como fallback, evitando asset não hasheado obsoleto eterno.
- `PreferencesPanel` foi lazy-loaded para manter o orçamento inicial.

### GitHub Actions

- O watchdog do inventário não exige que um draft PR esteja em `main` antes da revisão humana.
- Valida run, artefato, branch, SHA-256 e PR same-repo/mesmo SHA; retorna `review_pending` sem push direto à `main`.
- Backfills históricos não verificam produção nem fecham o incidente corrente.
- Evitados redispatch/loops e corrigido o uso de `jq`.

## Validação executada

- TypeScript `--noEmit`: aprovado.
- ESLint completo TS/TSX, zero warnings: aprovado.
- Build Vite + servidor: aprovado.
- Orçamento: entrada `108,84 KB gzip`; carga inicial `169,55 KB gzip` (teto `170,5 KB`); maior chunk `306,03 KB gzip` (teto `320 KB`).
- Shell offline: 67 assets, Home e atalhos essenciais íntegros.
- Auditoria clínica: 356 casos e 93.276 assertivas.
- Filtro: 105 verificações de segurança; 518.459 combinações de pódio; 672/672 escolhas ideais; 100 cenários práticos com média 10,00.
- Paginação: testes dinâmicos Cloudflare/Express com 205 resultados, duplicidade, truncamento legado e `429`.
- Rotas, ownership, backup, exclusão, modal, privacidade, watchdog, PIN no build e `git diff --check`: aprovados.
- Workflow: YAML válido e 13 blocos shell aprovados em `bash -n`.

Limitações locais: Chromium não estava instalado para Lighthouse/E2E real e a política do ambiente bloqueou `npm audit`; esses gates devem rodar no GitHub Actions antes de merge.

## Gates P0 que exigem operação/migração externa

| Gate | Risco | Ação obrigatória |
| --- | --- | --- |
| [#514](https://github.com/jadsonfraga/neuroped/issues/514) | PHI em tabelas D1 legadas em claro | Backup/rollback, envelope AES-GCM versionado, índice cego, migração idempotente e prova de ausência residual |
| [#575](https://github.com/jadsonfraga/neuroped/issues/575) | Dados operacionais usam fallback para o segredo JWT; rotação pode torná-los indecifráveis | Chave dedicada com key-id/current+previous, recriptografia validada e provisionamento |
| [#515](https://github.com/jadsonfraga/neuroped/issues/515) | Secrets de certificado ainda existem no repositório e falta evidência de revogação | Remover com privilégio Admin, revogar/rotacionar no emissor e habilitar secret scanning/push protection |
| [#584](https://github.com/jadsonfraga/neuroped/issues/584) | `main` sem proteção/ruleset | Exigir PR, branch atualizada, checks críticos, conversas resolvidas; bloquear force-push/deleção/bypass |
| [#601](https://github.com/jadsonfraga/neuroped/issues/601) | `NEUROPED_AUTOMATION_TOKEN` vazio impede publicar o draft PR diário | Provisionar PAT repo-scoped `contents` + `pull_requests` write ou redesenhar a automação |
| [#594](https://github.com/jadsonfraga/neuroped/issues/594) | Go-live clínico sem gates completos | Manter `Clinical LIVE` desativado até evidências dos gates acima |

## Backlog formalizado nesta auditoria

- [#629 — Verdade clínica de instrumentos/licenças/sentinelas](https://github.com/jadsonfraga/neuroped/issues/629): CDI-2, M-CHAT-R/F, fórmulas aproximadas, allowlist de instrumentos completos e sentinelas restantes.
- [#630 — LGPD no runtime canônico](https://github.com/jadsonfraga/neuroped/issues/630): audit trail atômica, direitos do titular em Pages Functions e evidência versionada de consentimento público.

## Decisão de release

Este lote pode seguir por PR e CI como hardening do modo atual. Não fazer push direto à `main`, não contornar checks e não promover `Clinical LIVE` enquanto #514, #575, #515, #584, #601 e #594 estiverem abertos sem evidência operacional.
