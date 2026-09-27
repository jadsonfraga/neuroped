# NeuroPed — entrada operacional para Claude

Leia primeiro `AGENTS.md`, que é a autoridade operacional deste repositório.

Repositório canônico: **jadsonfraga/neuroped**.
Produção: **Cloudflare Pages Functions + D1**. Vercel é apenas o espelho do
frontend no mesmo SHA. Não criar outro backend ou projeto para recuperar o
checkout.

Após reset de sandbox, não pedir novamente owner/repo. Consulte o GitHub
para verificar PR, branch e SHA atuais antes de reconstruir. Ausência de
`/home/claude` ou `.git` não prova perda de commits enviados. Não considerar
revisões/processos locais do contêiner anterior como ainda em execução.

Procedimento online/offline: `docs/REPOSITORY_RECOVERY.md`.
Detalhes OBS-60: `docs/audits/OBS60_RECOVERY_2026-09-27.md`.
A PR #1023 e a branch `claude/obs-60-neuroped-module-28nyqy` são referências
históricas de retomada; conferir seus estados e SHAs atuais, sem fixar a
sessão nova a um commit antigo. Preserve trabalho não enviado e branches
originais. O workflow `Repository recovery bundle` verifica um clone offline
antes de disponibilizar o artifact de código/histórico.

Respeite a autorização mais recente: quando o usuário reservar merge/deploy
para si, preparar e validar as alterações não autoriza publicar. Não
confundir teste, merge, deploy, ativação da IA externa e validação clínica.
