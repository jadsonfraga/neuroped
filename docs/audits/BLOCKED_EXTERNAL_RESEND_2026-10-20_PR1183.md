# BLOCKED_EXTERNAL_RESEND — PR #1183 (2026-10-20)

**Status:** bloqueio externo de homologação, não falha dos testes simulados.
**Escopo:** cadastro, reenvio da confirmação, recuperação de senha e convites.
**Branch:** `claude/email-delivery-honesty` — não integrada à `main`.

## Comprovado no código
- O retorno do cadastro mantém `emailVerificationDelivery` quando a sessão falha.
- `202` em reenvio e recuperação confirma apenas o recebimento da solicitação.
- Os testes usam resposta sintética do provedor; não demonstram entrega externa.
- `email_verified_at` somente deve ser atualizado pelo consumo do token, nunca pelo probe.

## Acesso externo necessário
- Administrador do **Resend**: configurar domínio de `AUTH_EMAIL_FROM`, verificar DNS e status do domínio no painel; disponibilizar credencial apropriada sem registrá-la no Git.
- Administrador do **Cloudflare Pages**, ambiente de homologação primeiro: configurar `AUTH_RESEND_API_KEY`, `AUTH_EMAIL_FROM`, `AUTH_PUBLIC_APP_URL` com HTTPS e `AUTH_EMAIL_TRANSPORT=resend` (ou omitido).
- Operador de homologação: endereços de teste realmente controlados, nunca contas de pacientes; confirmar recebimento, consumo de token e trilha sem PII.

## Caminho de verificação sem afirmar envio
1. Manter `SAAS_SIGNUP_ENABLED=false` no ambiente público até a homologação e aceite humano.
2. Executar `node --import tsx scripts/ops/resend-operational-contract.ts` no ambiente autorizado e registrar somente `code`/`exit`/`missing` (nomes), sem imprimir segredos.
3. Executar `node --import tsx scripts/ops/resend-operational-contract.ts --probe`. `GET /domains` com 200 comprova apenas acesso de leitura; uma chave restrita a envio pode receber 403 mesmo apta a enviar.
4. Conferir no painel Resend que o domínio **específico** de `AUTH_EMAIL_FROM` esteja verificado; não basta `GET /domains` 200.
5. Testar em ambiente isolado cadastro, falha de entrega, reenvio, recuperação e convite com caixas controladas; inspecionar mensagem recebida e consumo real de token. Não expor tokens, senhas, dados clínicos ou endereços reais em evidências.
6. Registrar resultado e decisão de liberação separadamente; **não** converter `CONFIGURACAO_PRESENTE` ou `202` em `ENTREGA_REAL`.

## Risco e critério de conclusão
Sem domínio verificado/credencial funcional, o provedor pode recusar envio e usuários ficam sem confirmação ou recuperação de acesso. O bloqueio só é encerrado após evidência de recebimento e consumo de token no ambiente-alvo, sem bypass manual de verificação. Nenhuma entrega externa foi executada ou observada nesta atualização.
