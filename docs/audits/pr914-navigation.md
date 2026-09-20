# PR #914 — prioridade clínica e navegação

Rastreio: https://github.com/jadsonfraga/neuroped/pull/914

## Problema e correção

- Sonda Dez volta a ser o primeiro destaque e o único cartão principal. OBS-10
  vem imediatamente depois, seguido de Pacientes, Agenda, Laudos e Receita C1.
- `tone: "connection"` separa Secretaria IA, Conecta, EEG e Nesplora dos cartões
  clínicos. A filtragem de autorização existente continua aplicada antes da
  apresentação e da escolha do cartão principal.
- OBS-10 compartilha nome e configuração entre destaque e a única seção
  canônica, PRÉ-CONSULTA GUIADA. A cópia extra em Triagem foi retirada.
- No empate de rota, a seção real vence o destaque; uma rota mais específica
  continua vencendo um prefixo. A rolagem usa `href`, restrito à sidebar, e
  espera hidratação e autorização.
- Nesplora mantém link HTML direto para o microsite local, fora das rotas SPA.
  A revisão encontrou um script residual de `manus-analytics.com`; o
  sincronizador agora o remove, o HTML foi regenerado com essa transformação
  e o guard de retirada do Manus também proíbe esse domínio.

## Verificação local

Comandos concluídos com código de saída 0:

- `npm ci --no-audit --no-fund`
- `npm run check`
- `npm run lint`
- `VITE_OPEN_ACCESS=false VITE_AUTH_MODE=remote npm run build:client`
- As oito suítes `tests/unit/obs10*.test.ts` executadas pelo workflow OBS-10.
- `npm run test:sonda`
- `npm run audit:navigation`
- `npm run test:operations`
- `node --import tsx tests/unit/featured-navigation.test.ts` (6 testes)
- `node tests/e2e/featured-navigation.mjs` (desktop, celular, menu recolhido,
  login sintético, reload com seção fechada, navegação real e auto-scroll).
- `node tests/unit/manus-retirement.test.mjs`
- `node tests/unit/workflow-governance.test.mjs`

A prova visual local usou Chromium 153 via
`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`, porque o download padrão do Playwright
expirou neste ambiente. O workflow conserva sua instalação normal do Chromium;
nenhum navegador ou pacote adicional foi incorporado às dependências do app.
Os testes usam exclusivamente credenciais e dados sintéticos. Nenhuma
asserção existente foi retirada ou enfraquecida.

## Gate remoto e rollback

O workflow OBS-10 inclui os novos testes de navegação e preserva todas as seis
jornadas OBS-10 existentes. Alterações de `Layout.tsx` passam a acioná-lo também;
as capturas de navegação integram o artefato de verificação.

A aprovação para merge depende do resultado completo desse workflow no novo
HEAD, incluindo navegador. Verificação local e status do commit anterior não
substituem esse gate. Esta correção não executa merge ou deploy.

Rollback: antes do merge, reverter o commit corretivo na mesma branch; após o
merge, reverter a PR pelo fluxo normal de revisão. Não há migração de banco,
mudança de permissões ou alteração de dados clínicos.
