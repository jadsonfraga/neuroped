# Recorrência NeuroPed SDG — contrato de conclusão e bloqueios reais

Data: 05/09/2026. Solicitação: uma nova escala às 08h, 15h e 19h, America/Recife, com PDF, catálogo/filtro, testes, publicação e arquivamento por e-mail. Este documento registra requisitos e evidência; NÃO ativa um agendamento nem certifica o ciclo completo.

Atualização de concorrência: o PR #793 foi mesclado por outro fluxo às 19h15 UTC, no commit 9a80feb, enquanto as novas travas desta auditoria eram preparadas. A árvore desse merge é idêntica à base 7a3c804 auditada. Estas sete alterações complementares são propostas separadamente, sobre 9a80feb; não fazem parte do merge anterior. O PR #790 foi colocado em rascunho, preservando todos os arquivos, para impedir a entrada duplicada das mesmas escalas antes da consolidação.

## Resultado desta alteração

- Incidente persistente no GitHub quando o teste ou envio de modelos falha em main. Uma única issue aberta do bot é atualizada; PRs e branches de trabalho não escrevem incidentes de produção.
- Uma execução verde/vazia não encerra o incidente nem comprova entrega. Nenhum reenvio cego é acrescentado; permanecem o destinatário fixo, TLS e recibos do transportador existente.
- Verificação do catálogo bruto antes de deduplicação: os três instrumentos não podem entrar duas vezes com IDs alternativos (ex.: afi12-sdg e afi-12-sdg). O estado de validação pendente é preservado.
- 19 testes unitários locais passaram. O YAML foi parseado e suas permissões/dependências conferidas. Isso não equivale a teste SMTP, CI integrado, deploy ou prova de três turnos.

## Evidência anterior preservada

O Pacote 01 foi localizado no Outlook do destinatário com os quatro anexos PDF. Não reenviar esse lote por prevenção. O commit 7a3c804 do PR #793 já contabiliza exatamente as três inclusões autorais no baseline, aumentando pisos de cobertura sem presumir validação. Essa alteração concorrente foi preservada, não refeita.

## Bloqueios antes de declarar 3 ciclos/dia ativos

1. O gerador em main ainda usa `generatedOn` como chave única por data; `validateOnly`, `replaceDatedRecord`, escolha do serial, fallback, nome de branch e verificação do workflow precisam compartilhar uma chave data+turno. Alterar apenas o cron pode pular turnos ou substituir um rascunho anterior. Legados e registros revisados precisam de migração compatível.
2. A rotina existente de geração é 19h40/20h20/21h15 Recife (primária/recuperações do mesmo dia), não três novos modelos. O cron de e-mail é reconciliação 08h07/15h07/19h07, não geração.
3. Consolidar as funções úteis de manifesto/checagem de deploy de #790 com a fonte canônica de #793, mas não importar a segunda cópia dos instrumentos. IDs existentes não devem ser renomeados silenciosamente.
4. Comprovar autenticação real do transportador configurado no runner. O conector desta sessão não administra Actions secrets; existência/validade de SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD e SMTP_FROM não foi certificada. Nunca solicitar seus valores em texto aberto.
5. Aprovar os checks do PR complementar e verificar Cloudflare e Vercel no mesmo commit e com os mesmos instrumentos, não apenas HTTP 200. Merge e sucesso de deploy são evidências diferentes.
6. Rodar um ciclo real por turno e uma falha controlada com recuperação. Nenhum desses testes ponta a ponta foi declarado concluído nesta alteração.

## Critério obrigatório para um ciclo completo

Identificador persistente `data-de-Recife/turno`; conteúdo original revisável e versão; PDFs íntegros (individual e pacote, logo, modelo em branco); entrada única e elegibilidade correta no filtro; gates aprovados; publicação oficial comprovada nos dois destinos; recibo de envio associado aos mesmos arquivos. Aceite SMTP é diferente de confirmação na caixa postal. Rascunho pode ser arquivado, mas não recebe aprovação clínica automática.

Falha em qualquer etapa deixa o ciclo pendente, registra a causa e preserva artefatos/recibos. Recuperação retoma a etapa faltante, sem gerar um segundo instrumento nem repetir uma entrega incerta. O aviso de incidente aqui é dependente do GitHub Actions: não detecta sozinho indisponibilidade total do GitHub ou um cron que nunca chegou a disparar; essa cobertura exige monitor externo independente.

## Limites de segurança

Não mudar proteções de main, autoaprovar revisão clínica, reutilizar segredos clínicos, publicar dados de pacientes, eliminar histórico ou elevar limites genericamente para forçar CI verde. Novos instrumentos autorais não devem substituir instrumentos validados em funções diagnósticas. Continuidade operacional tem de ser medida, não prometida como disponibilidade permanente.
