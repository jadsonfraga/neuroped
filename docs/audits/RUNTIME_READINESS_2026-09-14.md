# Readiness operacional - 14/09/2026

Parte de #880. Base: efad2006ed18618468880759be51bd7ed2f04d55.
Escopo desta mudanca: contrato de saude e validacao de binding LGPD, sem
migracao, alteracao de chaves, eliminacao, abertura comercial ou mudanca clinica.

## Evidencia antes da alteracao

Snapshot publico executado em 2026-09-14T03:09Z: Cloudflare e Vercel serviam
o mesmo SHA efad2006ed18. D1 e autenticacao estavam operacionais. Escuta tinha
enabled=true, configured=false, clinicalCryptoConfigured=false e nativeAiBinding=true.
O smoke horario existente passou porque verifica o nucleo, nao a prontidao da Escuta.
Arquivo local de evidencia: artifacts/e2e/published-health.json (somente respostas publicas).

O codigo da main tem 26 migracoes SQL, 163 arquivos unitarios *.test.* e 81
workflows YAML. Esses numeros NAO sao quantidade de assercoes executadas.
A superficie familia (/familia, /portal-familia, /caa - Vou Falar!) esta no mesmo
app que o SaaS clinico. A diferenca e de audiencia/autorizacao, nao de repositorio.
A autoridade e Cloudflare Pages Functions + D1. Vercel e espelho de frontend.
Billing mesclado: R$99/assento/mes, trial 14 dias, Asaas; aquisicao gated.
A proposta comercial da PR #840 nao foi mesclada e nao redefine esta base.

## Correcao

/api/health agora devolve HTTP503/status degraded para falha de banco/schema/auth
quando o nucleo persistente e obrigatorio. Conserva authentication.configured
na indisponibilidade transitoria do D1 para nao mudar o contrato de autenticacao.
Producao sem DB continua exigindo autenticacao remota e nao permite fallback local.
readiness separa saude do nucleo, disponibilidade criptografica e binding de exportacao.
A existencia do binding NAO prova exportacao/purge: executionVerified e false.
Readiness de exportacao exige a flag LIVE, keyring, storage privado e o schema
real tocado pelo runtime de exportacao. O health usa probes SELECT ... WHERE 0
sobre as colunas de clinics, memberships, pacientes, eventos, billing, lifecycle,
requests e worker, sem ler linhas, e exige os sete triggers da migration 0017.
Isso cobre inclusive canceled_at/grace_ends_at de billing_customers (0013) e
impede configured=true em deploys parciais de 0013/0014/0017.
Binding R2 parcial (sem put/get/delete) e recusado antes de iniciar a operacao.
Nenhum conteudo, identificador de paciente, erro bruto ou segredo entra no health.

## Evidencia Cloudflare read-only de fechamento

Em 14/09/2026 foi executada auditoria metadata-only via GitHub Actions usando as
credenciais ja existentes do repositorio, sem PHI e sem imprimir valores secretos.
O projeto Pages neuroped mostrou CLINICAL_LIVE_ENABLED=true e ESCUTA_ENABLED=true;
NEUROPED_JWT_SECRET, CLINICAL_DATA_KEY, CLINICAL_DATA_KEY_ID, CLINICAL_INDEX_KEY e
OPERATIONAL_DATA_KEY aparecem presentes como secret_text. O D1 canonico respondeu
e continha as tabelas e colunas LGPD/LIVE inspecionadas. A configuracao de producao
Pages, porem, nao possui binding R2. A listagem de inventario R2 retornou HTTP403,
logo o token atual nao autoriza afirmar se existe bucket reutilizavel na conta.
Presenca de secret nao e prova de keyring valido; a prova runtime continua sendo o
health apos deploy e, para exportacao, execucao sintetica somente depois do R2.

## Bloqueios externos reais

### BLOCKED_EXTERNAL_CLINICAL_CRYPTO

As chaves clinicas atuais estao presentes no Pages como secret_text, portanto o
bloqueio nao e mais "segredo ausente". Falta comprovar que o keyring existente e
semanticamente valido para o runtime publicado e para ciphertext ja existente.
Nao substituir/gerar chaves cegamente: isso pode tornar ciphertext existente ilegivel.
Fechamento: health publicado com clinicalCryptoConfigured=true e prova sintetica
cifrar/persistir/ler/decifrar, sem dados reais e sem chamar isso de prova clinica.

### BLOCKED_EXTERNAL_R2

Sistema: Cloudflare R2 + Pages. O projeto Pages confirma ausencia de binding R2 em
producao. O token atual consegue ler Pages/D1, mas recebeu HTTP403 ao listar R2;
portanto nao ha permissao suficiente para inventariar, criar ou bindar storage com
seguranca. Nao ativar r2.dev publico, dominio publico nem fallback local.
Fechamento: operador/token com R2 Read/Edit confirma bucket privado existente ou cria
um dedicado, adiciona LGPD_EXPORT_BUCKET ao Pages e faz novo deploy; depois executar
put/get/delete sinteticos, exportacao cifrada com readback/ledger e purge sintetico.
Nao executar eliminacao real para testar.

## Validacao e rollback

Regressoes novas: tests/unit/runtime-readiness.test.ts (10 casos, sem skip), mais
contratos existentes de autenticacao e endpoints LGPD. CI dedicada executa todos.
Resultados efetivamente executados sao registrados na PR; verify:release completo
nao deve ser presumido. Reverter por PR restaura o contrato antigo mas reintroduz
falso positivo de health; rollback nao altera storage, schema ou dados.
Nao mesclar sem checks/revisao do HEAD. Nao afirmar deploy nem conformidade LGPD
integral a partir desta alteracao.

### Execucao confirmada

No delta publicado, a CI dedicada de readiness e os checks gerais devem ser a fonte
de verdade antes do merge. A rodada local anterior validou autenticacao Cloudflare,
exportacao LGPD, eliminacao LGPD, governanca de workflows, TypeScript, lint e diff-check
sem skip. Nenhuma assercao foi removida ou ignorada. A auditoria read-only Cloudflare
tambem concluiu com sucesso no run 34828175726, sem mutacoes de infraestrutura.
