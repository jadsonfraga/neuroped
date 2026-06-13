# Rotacao de Segredos - NeuroPed

Segredos nunca devem ser gravados no repositorio, em logs versionados, em scripts de deploy ou no bundle do frontend.

## Segredos obrigatorios

- `NEUROPED_MASTER_KEY`: chave mestra para criptografia de dados sensiveis.
- `NEUROPED_JWT_SECRET`: segredo de assinatura dos tokens JWT.
- `ADMIN_INITIAL_PASSWORD`: senha temporaria apenas para bootstrap inicial.
- Credenciais de provedores: Railway, Render, Cloudflare, Vercel, storage S3 e banco.

## Rotacao imediata apos vazamento

1. Revogue tokens de provedores no painel correspondente.
2. Gere novo `NEUROPED_JWT_SECRET` e force novo login de todos os usuarios.
3. Troque a senha administrativa temporaria e remova `ADMIN_INITIAL_PASSWORD` depois do primeiro login.
4. Se `NEUROPED_MASTER_KEY` vazou e ja houve dados reais, faca migracao controlada: decrypt em ambiente isolado com a chave antiga e re-encrypt com uma nova chave. Nao continue operando com a chave exposta.
5. Reescreva o historico Git com `git filter-repo` ou BFG e force-push coordenado.
6. Ative secret scanning e push protection no GitHub.

## Geracao local

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

Nunca cole os valores gerados em arquivos versionados.
