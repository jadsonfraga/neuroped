# Cloudflare Pages

Configuração para o portal:

- Root directory: `neuroped-portal`
- Framework: Vite
- Build command: `npm run build`
- Output directory: `dist`

Passos:

1. Abrir Cloudflare Dashboard.
2. Entrar em Workers & Pages.
3. Criar novo projeto Pages.
4. Importar repositório do GitHub.
5. Selecionar `jadsonfraga/neuroped`.
6. Definir Root directory como `neuroped-portal`.
7. Definir Build command como `npm run build`.
8. Definir Output directory como `dist`.
9. Adicionar variáveis:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_APP_ENV=demo`
10. Salvar e fazer o primeiro deploy.

Para domínio próprio, usar a área Custom domains do projeto Pages.

Erros comuns:

- Diretório errado: conferir Root directory.
- Variável ausente: conferir Environment variables.
- Banco bloqueado: revisar políticas RLS no Supabase.
- Página branca: conferir logs do build e console do navegador.

Nunca colocar chaves administrativas no frontend.
