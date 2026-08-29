# Feed diário das famílias — novidades + Instagram

Automação gratuita que mantém o Portal das Famílias sempre atualizado, sem
custo e sem intervenção manual.

## O que a automação faz

Todos os dias (06h00 e 10h00 em Recife, redundante e idempotente) o workflow
[`family-feed-daily.yml`](../.github/workflows/family-feed-daily.yml) executa
[`scripts/update-family-feed.mjs`](../scripts/update-family-feed.mjs), que:

1. **Notícias em português** — consulta o RSS público do Google Notícias
   (gratuito, sem chave) por tema de neuropediatria: autismo, TDAH,
   desenvolvimento da linguagem, sono infantil, atraso do desenvolvimento,
   epilepsia, paralisia cerebral e genética/neurogenética.
2. **Último post do Instagram** — busca o post mais recente de
   [@drjadsonfraganeuroped](https://www.instagram.com/drjadsonfraganeuroped/)
   e baixa a imagem para o próprio site (compatível com a CSP), com link
   direto para o post e para o perfil.
3. **Persistência** — mescla com o conteúdo já publicado em
   `client/public/family-feed/novidades.json`. Uma falha de rede nunca apaga
   o que já existe: o feed apenas mantém a última versão válida (memória
   persistente no próprio repositório Git).
4. **Publicação automática** — commita no `main`; o push dispara o deploy do
   Cloudflare Pages (ou, sem o PAT de automação, o workflow dispara a
   sincronização estática oficial). O site é atualizado sozinho.

## Onde aparece no app

- `/portal-familia` — cartão com o post mais recente do Instagram.
- `/portal-familia/novidades` — post do Instagram + seção "Novidades em
  neuropediatria" com filtro por tema, seguida da biblioteca autoral.

Componentes: `client/src/components/FamilyFeedNovidades.tsx`
(`InstagramLatestCard` e `FamilyNewsFeed`).

## Instagram: dois caminhos, ambos gratuitos

| Caminho | Requisito | Confiabilidade |
| --- | --- | --- |
| **Graph API oficial** (preferido) | Segredo `INSTAGRAM_ACCESS_TOKEN` no GitHub | Alta — API oficial e estável |
| Endpoint público de perfil web | Nenhum | Média — pode ser limitado pelo Instagram |

Sem nenhum dos dois, o cartão continua funcionando com o link direto para o
perfil (e mantém a última imagem já publicada, se houver).

### Como ativar a Graph API (recomendado, ~10 minutos, grátis)

1. A conta `@drjadsonfraganeuroped` precisa ser **Profissional** (Criador ou
   Empresa) no Instagram.
2. Em <https://developers.facebook.com/>, crie um app e adicione o produto
   **Instagram** ("API do Instagram com login do Instagram").
3. Gere um **token de acesso de longa duração** (60 dias) para a conta.
4. No GitHub: repositório → Settings → Secrets and variables → Actions →
   `New repository secret` → nome `INSTAGRAM_ACCESS_TOKEN`.

O workflow **renova o token automaticamente a cada execução** (a renovação
estende a validade por mais 60 dias). Se o segredo `NEUROPED_AUTOMATION_TOKEN`
(PAT com permissão de administrar segredos) existir, o token renovado é salvo
de volta no segredo — a automação fica perpétua, sem manutenção.

## Operação manual

- Rodar agora: aba **Actions** → "Feed diário das famílias" → *Run workflow*.
- Testar localmente: `node scripts/update-family-feed.mjs`.

## Garantias

- **Gratuito**: apenas GitHub Actions, RSS público e API oficial gratuita.
- **Diário**: dois horários de cron; execuções extras não duplicam conteúdo.
- **Persistente**: histórico versionado no Git; falhas não regridem o feed.
- **Seguro**: notícias são apenas título + link para a fonte externa; nenhum
  HTML de terceiros é renderizado; imagem do Instagram servida pelo próprio
  domínio.
