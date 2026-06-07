# NeuroPed — Bloqueio local / PIN master

Status: confirmado em 2026-06-07.

## Regra operacional

O PIN master não deve ser armazenado em texto claro no código-fonte, documentação ou bundle.

A validação local deve usar exclusivamente o hash SHA-256 configurado em:

- `client/src/lib/localUnlock.ts`

Hash ativo:

```txt
d48b2da02ca999eddf04ea7acc0f5673423f2cf618c014bf3863f4452a6ec207
```

## Fluxo esperado

1. O app inicia.
2. O `SplashScreen` conclui.
3. Se o app não estiver desbloqueado na sessão/dispositivo, renderiza `LocalUnlockGate`.
4. Apenas após validação positiva, o `Router` e as rotas internas são renderizados.

## Observação de segurança

Este é um bloqueio local leve para app estático/frontend/local-first. Ele reduz acesso casual, mas não substitui autenticação robusta com backend para dados médicos sensíveis.
