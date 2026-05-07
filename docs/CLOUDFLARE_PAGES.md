# Cloudflare Pages — NeuroPed EDJ

## Configuracao recomendada

Use esta configuracao se o repositorio publicar o projeto Vite pela raiz atual:

- Framework: Vite
- Build command: `npm run build`
- Output directory: `dist`

Se o projeto for reorganizado para uma pasta isolada no futuro, use:

- Root directory: `neuroped-portal`
- Build command: `npm run build`
- Output directory: `dist`

## Variaveis de ambiente

Para demo:

```txt
VITE_APP_ENV=demo
VITE_APP_BASE_PATH=/
```

Para producao:

```txt
VITE_APP_ENV=production
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon
```

Nunca configure `SUPABASE_SERVICE_ROLE_KEY` no frontend.

## Passos

1. Acesse Cloudflare Dashboard.
2. Abra Workers & Pages.
3. Crie um novo projeto Pages.
4. Conecte ao GitHub.
5. Selecione `jadsonfraga/neuroped`.
6. Configure build e output conforme a estrutura escolhida.
7. Adicione as variaveis de ambiente.
8. Execute o primeiro deploy.
9. Teste a navegacao principal.
10. So avance para dados reais apos Supabase, RLS, auditoria, LGPD e assinatura valida estarem revisados.

## Erros comuns

- Pagina branca: conferir `base` no Vite e caminho do deploy.
- Build falha em lint: rodar `npm run lint` localmente.
- Build falha em preflight: remover padroes inseguros do runtime.
- Banco bloqueia leitura: revisar RLS e grants do usuario.
