# Agenda #1039 — reconciliação do bootstrap com os triggers reais

## Falha e efeito real

A PR #1040 passou os 11 workflows e foi mesclada em
`63287310a0999c3c7d1f9a0dbc3aeac6137f7314`, mas a aplicação `36449195314`
falhou com `AGENDA_SETUP_PROVIDER_REQUEST_FAILED`. Isso não foi declarado
como correção concluída. O recibo foi baixado e seu digest conferido.

As leituras independentes `36449458957` e `36449687474` confirmaram zero
clínicas-alvo, memberships, customers-alvo e recibos-alvo: não houve criação
parcial a reaproveitar. SELECT simples, batch de SELECTs e a pré-condição
transacional exata retornaram sucesso. Nenhuma gravação foi repetida às cegas.

O schema de produção contém `trg_clinic_create_billing_trial`: INSERT em
clinics já cria billing_customer e subscription trial automaticamente.
O bootstrap da #1040 ignorava esse efeito e tentava inserir outro customer
para o mesmo clinic_id UNIQUE. Os testes iniciais executavam DDL real, mas
não incluíam esses triggers — lacuna de cobertura corrigida aqui.

## Reprodução e correção

Com os triggers reais de trial, ciclo de vida e assentos extraídos das
migrations atuais, o bootstrap anterior falhou localmente com exit 1:
`UNIQUE constraint failed: billing_customers.clinic_id`. A versão corrigida
passou com exit 0 o mesmo teste, mantendo as assertivas anteriores e ampliando
isolamento e rollback.

A transação agora conserva o customer recém-criado pelo trigger e o converte
no acesso interno não faturável já previsto (`provider=none`, ativo, sem trial).
A linha de subscription trial criada pelo trigger é removida **dentro da mesma
transação que criou a clínica**, antes de ser publicada. Não é assinatura
paga, não há referência de provedor externo, e não se apaga histórico comercial
preexistente. Qualquer referência externa ou estado inesperado aborta tudo.
A existência prévia de qualquer clínica/membership do proprietário também
continua impedindo a aplicação: esta não é uma rotina genérica de conversão.

O vínculo owner passa pelos triggers de assentos normalmente. Nenhum trigger,
guard, papel, contrato de autenticação ou regra de pagamento de outras contas
é alterado. O ciclo de vida automático do tenant é preservado. O acesso interno
é limitado ao proprietário; adicionar equipe requer configuração apropriada,
não criação automática de assentos ou liberação do limite.

A pós-condição é tenant-aware, sem exigir que o ID aleatório do customer
criado pelo trigger seja substituído por outro. O recibo registra ausência de
subscriptions retidas, não uma afirmação incorreta de que o trigger nunca
criou uma linha transitória. Erros futuros incluem somente status HTTP/códigos
numéricos do provedor, sem mensagens brutas, SQL, parâmetros ou credenciais.

## Testes e publicação

Executado localmente (exit 0):
`node --experimental-strip-types --experimental-sqlite tests/unit/institutional-agenda-setup.test.mjs`.

Cobre os triggers reais, idempotência, identidade exata, exclusão da conta E2E,
recusa de referência externa, preservação byte-a-byte das linhas de outra
clínica comercial sintética, preservação dos triggers, compatibilidade sem
trigger e rollback inclusive de tenant_lifecycle e trial automático.

Aplicação somente pelo workflow já existente após merge normal e CI verde.
O incidente #1039 permanece aberto até efeito persistente e confirmação da
agenda na sessão legítima; nenhum teste autenticado publicado é inventado.

## Rollback

Revert desta correção restaura o bootstrap anterior que falhava, não desfaz
registros já aplicados. Se a clínica já existir, não apagar em cascata nem
remover seu último owner: respeitar as proteções de ciclo de vida e proceder
por encerramento/revogação formal auditada e autorizada. Preservar dados que
forem legitimamente criados após o reparo. Nenhuma migration é modificada.
