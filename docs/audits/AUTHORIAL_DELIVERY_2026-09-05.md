# Arquivo recorrente de escalas NeuroPed SDG

## Escopo e limites

Fonte única do Pacote 01: `client/src/data/authorialMonitoring.json`. O mesmo registro alimenta catálogo, filtro, aplicação interativa e exportação PDF. Adições futuras a esse contrato precisam manter ID/versão, idade, respondente, janela, itens, domínios, proveniência e classificação explícita no contrato de segurança do app. CI impede publicação de registros incompletos ou inconsistentes; revisão clínica não é inferida de um build verde.

O envio recorrente lê modelos em branco desse catálogo e inventários `autoral_diario` gerados a partir de 05/09/2026, sem enviar o acervo anterior. Não lê respostas, prontuários, banco de pacientes ou outros arquivos da conta. Não tem acesso automático a anexos de novas conversas: esses precisam ser incorporados ao contrato estruturado do repositório pelo fluxo de criação.

## Fluxo executável

Workflow `authorial-scale-delivery.yml`: dispara após alterações de fontes em main, após conclusão bem-sucedida do gerador diário autorizado e em reconciliações às 08h07, 15h07 e 19h07 de Recife. Os horários são aproximados, sujeitos à fila do GitHub Actions. A frequência de reconciliação NÃO significa criação garantida de três escalas inéditas/dia; a rotina geradora existente continua com sua cadência e revisão próprias.

Em pull requests há apenas testes offline; sem credenciais de correio nem envio. Em `workflow_run`, somente código de main é executado; os artefatos são lidos como JSON, nunca como código. O transporte usa TLS, anexos MIME reais e destinatário fixo `jadsonfraga@hotmail.com`. Cada lote contém até cinco PDFs individuais e um pacote combinado, com limite de mensagem. O PDF usa recorte da logo fornecida pelo usuário. Exportações do catálogo são identificadas como tais, sem fingir serem o binário original.

Inventários qualitativos continuam sem soma. Rascunhos enviados para armazenamento não são promovidos automaticamente a revisados clinicamente ou a testes validados. A integração/publicação do app continua pelos PRs, checks e pipelines oficiais Cloudflare/Vercel do mesmo SHA.

## Deduplicação e observabilidade

Recibos por conteúdo ficam na branch dedicada `automation/scale-email-receipts`, nunca em main. O Pacote 01 foi enviado na mensagem Gmail `1a072cdcc707a550`; o bootstrap evita reenviar seus três modelos. Antes de SMTP DATA grava-se estado `pending`; depois de aceite, `smtp_accepted`. Resultado incerto bloqueia reenvio automático e exige reconciliação do Message-ID no provedor. Isto não é garantia de exactly-once nem de entrega na caixa de entrada. Não remover recibos para forçar um teste.

## BLOCKED_EXTERNAL_SCALE_MAIL — preflight obrigatório

A conexão Gmail desta conversa confirmou o envio original, mas não fornece uma credencial reutilizável ao runner. A recorrência só pode ser declarada operacional após execução real bem-sucedida com o transporte autenticado.

Sistema: GitHub Actions + provedor SMTP autorizado. Configurar nos Actions secrets, não em código, conversa, issue ou PR: `SMTP_HOST`, `SMTP_PORT` (465 ou 587), `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_FROM`. São credenciais de envio autorizadas pelo provedor; não reutilizar segredo clínico/JWT, token de produção ou senha pessoal como fallback. O token efêmero do workflow precisa `contents:write` somente para a branch de recibos. Se uma política bloquear essa branch, liberar o escopo exato; não ampliar permissões de main.

Verificação: executar o workflow em main, conferir preflight, aceitação SMTP, anexos recebidos e recibo persistido. Campos ausentes ou rejeição externa fazem o job falhar visivelmente. Até essa comprovação, o estado é preparado/pendente de transporte, não envio recorrente ativo.

## Testes e rollback

Doze testes Python offline cobrem identidade de conteúdo, deduplicação do lote já enviado, resultado incerto, ausência de transporte, TLS obrigatório, itens duplicados, versão, proibição de total no inventário qualitativo, PDFs reais/determinísticos e MIME/ordem dos recibos. O transporte é simulado só no teste unitário; não prova entrega real. O filtro é testado separadamente com os módulos reais do aplicativo.

Rollback: desabilitar somente este workflow e reverter seus arquivos por PR; preservar a branch de recibos para não duplicar envios. Nenhuma migração de banco, modificação de autenticação ou dado de paciente foi feita.
