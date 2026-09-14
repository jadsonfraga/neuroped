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
Readiness de exportacao tambem exige o schema LIVE/LGPD minimo das migrations 0014/0017;
schema parcial gera LGPD_SCHEMA_NOT_READY e nunca configured=true.
Binding R2 parcial (sem put/get/delete) e recusado antes de iniciar a operacao.
Nenhum conteudo, identificador de paciente, erro bruto ou segredo entra no health.

## Bloqueios externos reais

### BLOCKED_EXTERNAL_CLINICAL_CRYPTO

Sistema: Cloudflare Pages / ambiente de producao. Permissao: Pages Edit e acesso
ao cofre autorizado das chaves clinicas EXISTENTES. Validar CLINICAL_DATA_KEY,
CLINICAL_DATA_KEY_ID, CLINICAL_INDEX_KEY e keyring anterior quando aplicavel.
Nao substituir/gerar chaves cegamente: isso pode tornar ciphertext existente ilegivel.
Fechamento: configuracao conferida sem imprimir segredos, health coerente e prova
sintetica cifrar/persistir/ler/decifrar, sem dados reais e sem chamar isso de prova clinica.
Risco aberto: Clinical LIVE/Escuta continuam nao prontos apesar do site acessivel.

### BLOCKED_EXTERNAL_R2

Sistema: Cloudflare R2 + Pages. Permissoes: R2 Edit e Pages Edit na conta correta.
Falta comprovar bucket privado e LGPD_EXPORT_BUCKET no deployment. Nao ativar
r2.dev publico, dominio publico nem fallback local. Criar/bindar apenas apos
conferir recursos existentes. Configuracao de binding exige novo deploy.
Fechamento: put/get/delete sinteticos, exportacao cifrada com readback e ledger,
e purge sintetico verificado. Nao executar eliminacao real para testar.
Risco aberto: direitos operacionais de exportacao dependem de infraestrutura nao comprovada.
Os tres caminhos padrao de Wrangler consultados e variaveis locais nao forneceram
credenciais; conector Cloudflare nao foi encontrado. Nao equivale a ausencia global.

## Validacao e rollback

Regressoes novas: tests/unit/runtime-readiness.test.ts (8 casos, sem skip), mais
contratos existentes de autenticacao e endpoints LGPD. CI dedicada executa todos.
Resultados efetivamente executados sao registrados na PR; verify:release completo
nao deve ser presumido. Reverter por PR restaura o contrato antigo mas reintroduz
falso positivo de health; rollback nao altera storage, schema ou dados.
Nao mesclar sem checks/revisao do HEAD. Nao afirmar deploy nem conformidade LGPD
integral a partir desta alteracao.

### Execucao local confirmada

Readiness 8/8, autenticacao Cloudflare, exportacao LGPD, eliminacao LGPD,
contrato de monitoramento, governanca de workflows, npm run check, npm run lint
e git diff --check: todos exit 0. Nenhuma assercao removida ou ignorada.
Dependencias reutilizadas por junction somente apos conferir package-lock identico.
Prova publica e baseline de tokens/billing tambem exit 0. CI do novo HEAD ainda
precisa ser verificada; estes resultados nao atestam deploy.
