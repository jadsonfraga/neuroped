# Diagnóstico do login — 2026-08-19

A execução mais recente do workflow `Provision D1 backend` foi a run `32286286294`, no commit `9fc67c81`, iniciada em 2026-08-19T18:15:15Z.

O workflow conseguiu publicar os secrets, fazer o deploy Cloudflare e executar o smoke test `/api/health` com `status=ok`, `database=ok` e `authentication.configured=true`. A etapa final `Verificar login nominal após provisionamento` falhou porque `POST /api/auth/login` retornou HTTP 401.

O log não expôs valores dos secrets. A conclusão é que Cloudflare, D1, JWT e o backend estão configurados; a divergência está na combinação do `ADMIN_EMAIL`/`ADMIN_INITIAL_PASSWORD` usada pelo workflow com a conta persistida no D1, ou na propagação/alias do deploy no instante do smoke test. O próximo diagnóstico deve repetir o teste após a conclusão da publicação e confirmar os nomes dos secrets sem ler os valores. Não enviar senha ao chat e não liberar rotas clínicas anonimamente.

Referência do workflow: https://github.com/jadsonfraga/neuroped/actions/runs/32286286294
