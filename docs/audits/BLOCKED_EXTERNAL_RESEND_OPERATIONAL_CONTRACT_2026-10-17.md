# BLOCKED_EXTERNAL — contrato operacional Resend (2026-10-17)

## Sistema
Credenciais Resend desta sessão (`AUTH_RESEND_API_KEY`, `AUTH_EMAIL_FROM`,
`AUTH_PUBLIC_APP_URL`). Não há conta de envio acessível daqui.

## Permissão exata necessária
Variáveis no Cloudflare Pages (Production), sem ecoar o valor:

- `AUTH_RESEND_API_KEY` — chave da conta Resend
- `AUTH_EMAIL_FROM` — remetente de um domínio verificado nessa conta
- `AUTH_PUBLIC_APP_URL` — URL pública HTTPS

## Comando executado

```bash
env -u AUTH_RESEND_API_KEY -u AUTH_EMAIL_FROM -u AUTH_PUBLIC_APP_URL \
  -u AUTH_EMAIL_TRANSPORT \
  node --import tsx scripts/ops/resend-operational-contract.ts
```

Exit code: **2**.

```json
{
  "status": "BLOCKED_EXTERNAL",
  "code": "BLOCKED_EXTERNAL_RESEND",
  "missing": [
    "AUTH_PUBLIC_APP_URL",
    "AUTH_RESEND_API_KEY",
    "AUTH_EMAIL_FROM"
  ],
  "probe": "not_attempted",
  "proves": []
}
```

Nenhum e-mail foi enviado. Nenhuma conta foi marcada com `email_verified_at`.

## Ação que falta
Provisionar as três variáveis, repetir o comando e depois
`node --import tsx scripts/ops/resend-operational-contract.ts --probe`.
Exit 0 do probe só prova que `GET /domains` aceitou a chave. O fechamento
exige uma mensagem real de verificação e de convite, e o consumo do token
em `POST /api/auth/verify-email`.

## Risco de não executar
O cadastro self-service com e-mail ausente continua recusado. Abrir
`SAAS_SIGNUP_ENABLED` nesse estado criaria a ordem invertida já bloqueada
pelo go-live. Marcar e-mail verificado no banco sem o token seria bypass.

## Como verificar a conclusão
1. O comando sem `--probe` sai 0 com `proves: ["CONFIGURACAO_PRESENTE"]`.
2. O comando com `--probe` sai 0 com `RESEND_ACCOUNT_READ_OK`.
3. Uma conta sintética só cria clínica depois de `email_verified_at`
   preenchido com `email_verified_source = self_service_token`.
4. Um convite só muda papel depois do aceite pelo link recebido. A URL não
   volta para quem convidou.
