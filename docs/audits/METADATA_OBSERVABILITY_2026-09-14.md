# Observabilidade sem conteúdo clínico - 14/09/2026

Parte de #880. Base efad2006ed18618468880759be51bd7ed2f04d55.
Escopo: metadados técnicos e agregados de atividade já auditada, sem nova
telemetria de famílias/crianças, sem coletar corpos de requisição, sem SDK terceiro.

## Entrega

O middleware canônico Cloudflare escreve no Analytics Engine duração limitada,
status HTTP, método allowlisted e categoria fixa. Não envia URL, query, token,
identificador de usuário/clínica/paciente, conteúdo, IP, stack ou mensagem de erro.
Somente chamadas autenticadas do host canônico entram; rotas públicas, previews,
login e saúde ficam fora. A API original preserva resposta, headers e exceção.
Uma falha do coletor não interfere na operação clínica nem substitui a auditoria legal.
Binding API_METRICS / dataset neuroped_api_metrics está no wrangler.toml;
a configuração versionada NÃO atesta deployment, escrita ou histórico disponível.

GET /api/tenants/:id/metrics agrega o saas_audit_log existente, sem nova migração.
Consulta atômica vincula clinic_id, usuário e membership ativa de owner/clinic_admin.
Admin global não tem bypass. Clínica suspensa/fechada ou outra clínica não é exposta.
Contagens distintas por dia/7/30 dias, volume auditado e série diária são calculados
por SQL real. A janela usa dias UTC, inclui o dia atual parcial e exclui amanhã.
Ausência de atividade vira zero; falha de schema/banco vira 503, nunca zero inventado.
Resposta no-store, sem linhas de eventos, identidades, target_id ou metadata_json.

Configurações > Atividade monta painel de proprietário/administrador, com fonte,
limites, período e botão atualizar. Query por usuário+clínica, cancelável e sem
persistência; troca de clínica desmonta o painel. Payload é validado por schema.
Estado indisponível não mostra valores estimados, zeros falsos nem dados antigos.

## Limites que permanecem explícitos

Não são DAU/MAU completos do produto: contam somente contas com operações na
trilha SaaS. Visitantes públicos, páginas vistas, cohort retention, browser errors,
traces distribuídos e Web Vitals não são medidos por esta entrega. Campos para
DAU/MAU completos e retenção permanecem null; não extrapolar a partir destes dados.
Analytics Engine pode aplicar sampling: consultas de contagem/média precisam
ponderar _sample_interval. Nenhum dashboard com contagens ingênuas foi inventado.
Documentação oficial: https://developers.cloudflare.com/pages/functions/bindings/#analytics-engine
https://developers.cloudflare.com/analytics/analytics-engine/sampling/
https://developers.cloudflare.com/analytics/analytics-engine/pricing/
Custo/quota depende da conta e termos vigentes; não prometer custo zero permanente.

## Prova e operação

Testes SQL executam SQLite real em memória com duas clínicas; cobertura inclui
cross-tenant, papel, revogação, estado da clínica, query override, ausência de schema,
validação do payload, ausência de PHI e preservação de resposta/erro no middleware real.
Browser testa somente fixture sintética isolada: sucesso, 503 e payload inválido em
390 e 1440px; não confundir fixture de UI com autorização/backend comprovados.
CI dedicada executa ambos mais quick-wins, acesso e build sem remover guards.

BLOCKED_EXTERNAL_METRICS_DELIVERY: após revisão/checks/merge/deploy canônico,
conferir binding e escrita/readback do dataset na conta Cloudflare autorizada.
O Analytics Engine não tem suporte local equivalente ao binding de produção.
Executar operação sintética autenticada e consultar apenas dimensões permitidas.
Aparecer binding configurado no painel não encerra esse bloqueio.
Rollback por PR remove middleware/painel/binding sem alterar dados clínicos ou schema.
R2 e keyring clínico continuam bloqueios separados em #880; esta PR não os resolve.

## Execução local

11 testes adversariais + 2 contratos UI/schema, tipos, lint e auditoria de acesso
passaram. A suíte quick-wins local parou em dr-rehearsal-safety por ENOENT de Bash
no Windows, não em asserção da mudança; CI Linux continua obrigatório. Evidências
finais de browser/build e commit exato são registradas na PR, não presumidas aqui.

## Atualização 22/09/2026

O binding API_METRICS foi comentado no wrangler.toml porque a conta Cloudflare
não tem Analytics Engine habilitado e a publicação das Functions era recusada.
Registro, risco assumido e verificação de fechamento em
docs/audits/BLOCKED_EXTERNAL_CLOUDFLARE_ANALYTICS_ENGINE_2026-09-22.md.
