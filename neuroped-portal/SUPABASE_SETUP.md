# Supabase Setup

1. Criar novo projeto no Supabase.
2. Copiar Project URL.
3. Copiar anon public key.
4. Criar `.env.local` com:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-public-key
VITE_APP_ENV=demo
```

5. Inserir as mesmas variáveis no Cloudflare Pages.
6. Abrir SQL Editor.
7. Rodar `supabase/migrations/001_initial_schema.sql`.
8. Conferir se RLS está ativa nas tabelas.
9. Conferir se o bucket `private-documents` está privado.
10. Criar usuários no Supabase Auth.
11. Criar registros correspondentes na tabela `profiles`.
12. Testar acesso por perfil.

Perfis previstos:

- admin
- medico
- secretaria
- familia

Supabase Free serve para demo e validação inicial. Supabase Pro é recomendado para produção.

Paciente real somente após revisão técnica, LGPD, backup, logs, RLS, permissões e assinatura válida quando aplicável.
