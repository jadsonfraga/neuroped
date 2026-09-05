# NeuroPed SDG — integração recorrente de instrumentos autorais

Rastreio: #789. Fonte: Pacote 01 entregue pelo autor em 05/09/2026.

## Contrato permanente de entrada

Toda nova escala criada neste fluxo deve ser registrada em `client/src/data/authorialSdgRegistry.ts`, com itens completos, versão, arquivo-fonte, SHA-256, idade operacional, respondentes, queixas, sinais e alertas fora do escore. O cadastro gera automaticamente a ficha do filtro e a definição interativa. A redação autoral não é convertida em teste validado.

A criação de um PDF no chat, por si só, não executa uma chamada ao GitHub. O produtor do instrumento deve efetuar essa entrada via integração autorizada. Arquivos inacessíveis, proveniência incompleta ou instrumentos licenciados não são reconstruídos por aproximação. As automações de geração diária já existentes permanecem independentes: este fluxo não finge ler anexos de chats ou substituir sua validação editorial.

A adição deve incluir testes de fidelidade e classificação explícita em uma extensão `safety-classification-*.json`. Não executar `UPDATE_SAFETY_BASELINE=1` como aprovação automática. Instrumentos de risco suicida/psicose exigem modelagem e revisão de segurança específicas; não podem herdar os falsos desses três instrumentos de monitorização.

## Primeiro lote

- AFI-12 SDG: 12 itens, domínios 6/6, total 0–36; 60–215 meses; pais/professor, contextos separados.
- SDRD-12 SDG: 12 itens, domínios 4/4/4, total 0–36; 36–215 meses; responsável que acompanha a noite.
- SARF-12 SDG: 12 itens, domínios 4/4/4, total 0–36; 24–179 meses; responsável que observa refeições.

Os limites superiores incluem o ano completo de idade do PDF (17 anos até 17 anos e 11 meses; 14 anos até 14 anos e 11 meses). Faixas sugeridas não são normas etárias. Respondentes são uma restrição operacional conservadora do app, não uma validação nova. Os 36 itens foram conferidos literalmente contra os PDFs-fonte. Os hashes dos PDFs são registrados no cadastro; os binários originais continuam como anexos da conversa e não são falsamente apresentados como arquivos já arquivados no repositório.

EJIA-15 permanece na integração anterior (#788), sem duplicação nem mudança de suas regras neste lote. As aplicações usam o fluxo nativo GenericScale, incluindo bloqueio de formulário incompleto e exportação institucional já existente. Alertas são informações visíveis no formulário/resultado, fora do escore; não se alega existir um checklist interativo de emergência novo.

## Seleção e pontuação

A finalidade é exclusivamente monitorização. O filtro continua usando idade, queixa e respondente, sem bônus artificial por autoria e sem substituir instrumentos validados de rastreio/diagnóstico. Queixas foram limitadas ao construto de cada instrumento; coocorrência de TEA ou epilepsia não justifica classificá-los como instrumentos diagnósticos dessas condições.

O motor interativo existente calcula 0, 12, 24 e 36 nos extremos homogêneos. Os novos testes usam esse motor real e cada mês da faixa elegível, com exclusões por idade, respondente e finalidade. Escores não recebem normas, bandas de gravidade, diferença mínima importante ou percentuais de resposta inventados.

## Recorrência e publicação

`authorial-sdg-pipeline.yml` executa em PR/push pertinentes, acionamento manual e às 08h25, 15h25 e 19h25 de Recife (cron UTC). O agendamento somente entra em operação após o workflow chegar à branch padrão e depende de Actions habilitado.

1. Regerar índices e manifesto a partir da fonte única.
2. Auditar fidelidade, filtro, cálculo real, segurança, catálogo, tipos e build.
3. Em main exclusivamente, comparar SHA, manifesto e saúde dos ambientes publicados.
4. Havendo divergência, solicitar `daily-authorial-static-sync.yml`, sem substituir seu gate completo de release, sem escrever direto em main e sem obter segredos do provedor no chat.
5. Só confirmar publicação após nova leitura pública dos dois provedores e da saúde do backend canônico.
6. Registrar incidente rastreável em caso de falha. Correções clínicas e alterações de código não são inventadas por um reparador sem revisão.

O manifesto público `authorial-sdg-manifest.json` é gerado pelo prebuild já usado por Cloudflare/Vercel. Contém somente IDs, versão, hash da fonte, idades, quantidade de itens e status autoral não validado; nenhum paciente. O sincronizador oficial conserva os locks de publicação dos provedores. Uma execução superada por novo main não pode promover outro SHA silenciosamente.

## Verificação e bloqueios externos

Local: `node --experimental-strip-types tests/clinical/test-authorial-sdg-core.mjs` e `node tests/clinical/test-sdg-deployment-contract.mjs`. A conferência documental é adicional, não teste de produção.

No checkout completo: `npm ci`, `npm run gen:interactive-scale-ids`, `node --import tsx tests/clinical/test-authorial-sdg-integration.mjs`, `npm run validate:safety`, `npm run validate:catalog`, `npm run test:filter`, `npm run test:interactive`, `npm run check`, `npm run build:client`; a publicação oficial mantém `npm run verify`.

BLOCKED_EXTERNAL_LOCAL_REPOSITORY_DOWNLOAD: o ambiente inicial da integração não resolveu o host GitHub para clone/npm. Isso não é falha do aplicativo; os testes completos precisam de evidência do runner do GitHub, além dos testes puros locais. Não declarar a suíte completa verde sem o resultado do runner.

BLOCKED_EXTERNAL_VERCEL_CONNECTION_SCOPE: a conexão Vercel consultada não listou o projeto oficial; não recriar nem substituir o projeto. O caminho de publicação autorizado já existente usa o projeto oficial e os segredos do GitHub Actions. Exigir confirmação pública de SHA/manifesto; se falhar, registrar o erro e corrigir a permissão/credencial no ambiente competente.

## Rollback

Reverter o commit de integração por PR e executar o sincronizador canônico para o SHA revertido. Não há migração D1, edição de prontuário, mudança de autenticação ou exclusão de escala preexistente.
