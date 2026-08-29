# Claude Cowork no Windows — assumir e concluir o Feed das Famílias

Este documento existe para uma coisa só: **o Claude Cowork, rodando no seu
Windows, assumir o trabalho do início ao fim** — preencher os segredos, mesclar
o pull request, publicar e conferir o site — sem que você precise entender
nenhum passo técnico.

---

## Caminho 1 — Sem Cowork: clique duplo (o mais simples)

Se você só quer que funcione agora:

1. Abra a pasta do projeto no Windows.
2. Vá em `scripts\windows\`.
3. **Clique duas vezes** em `INICIAR-FEED-FAMILIAS.bat`.

O configurador instala o que faltar, pede o que precisar e faz o resto sozinho.
Você pode apertar Enter em tudo — os padrões estão corretos.

---

## Caminho 2 — Com o Claude Cowork: cole o prompt abaixo

Abra o **Claude Cowork** no seu Windows e cole **exatamente** o texto dentro do
bloco. Ele foi escrito para o Claude executar tudo e só falar com você quando
precisar de algo que apenas você tem (um token, uma confirmação).

```texto
Assuma a configuração e a publicação do Feed Diário das Famílias do NeuroPed,
do começo ao fim, na minha máquina Windows. Trabalhe de forma autônoma e só me
pergunte o que apenas eu posso responder.

CONTEXTO
- Repositório GitHub: jadsonfraga/neuroped
- Pull request a publicar: #737
- Branch do PR: claude/neoped-instagram-news-feed-dv2tes
- Site principal: https://neuroped.pages.dev
- Espelho: https://superneuroped.vercel.app
- Instagram do consultório: @drjadsonfraganeuroped
- O que o PR entrega: cartão com o post mais recente do Instagram no Portal da
  Família, e uma seção de novidades de neuropediatria (autismo, TDAH, linguagem,
  sono, desenvolvimento, epilepsia, paralisia cerebral, genética) que se atualiza
  sozinha todos os dias por um workflow gratuito do GitHub Actions.

O QUE FAZER

1. Localize a pasta do projeto neuroped no meu computador. Se não encontrar,
   clone com: git clone https://github.com/jadsonfraga/neuroped.git
   Se encontrar, rode: git fetch origin && git checkout main && git pull

2. Garanta que Git, Node.js e GitHub CLI estejam instalados. Instale o que
   faltar usando winget (Git.Git, OpenJS.NodeJS, GitHub.cli). Se o PATH não
   atualizar na sessão atual, abra um novo terminal e continue.

3. Autentique o GitHub CLI se necessário: gh auth login --web
   Confirme o acesso ao repositório com: gh repo view jadsonfraga/neuroped

4. TOKEN DO INSTAGRAM (é aqui que você precisa falar comigo).
   Verifique se o segredo já existe: gh secret list --repo jadsonfraga/neuroped
   Se INSTAGRAM_ACCESS_TOKEN não existir, me explique em linguagem simples que
   sem ele o app ainda funciona pelo caminho público, mas com ele a captura do
   post fica garantida — e me guie para obter o token:
     a) A conta @drjadsonfraganeuroped precisa ser Profissional (Criador ou
        Empresa) no Instagram. Me diga como verificar isso no celular.
     b) Abra https://developers.facebook.com/ para mim, oriente a criar um app,
        adicionar o produto "Instagram" e gerar um token de longa duração.
     c) Quando eu colar o token, valide antes de gravar, chamando:
        https://graph.instagram.com/me?fields=id,username&access_token=TOKEN
        Confirme que o username retornado é drjadsonfraganeuroped.
     d) Estenda a validade chamando:
        https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=TOKEN
        e use o access_token retornado.
     e) Grave o segredo:
        gh secret set INSTAGRAM_ACCESS_TOKEN --repo jadsonfraga/neuroped
   Se eu disser que não quero fazer isso agora, siga sem o token e me avise que
   dá para adicionar depois.

5. PAT DE AUTOMAÇÃO (opcional, mas resolve para sempre).
   Se o segredo NEUROPED_AUTOMATION_TOKEN não existir, me explique que sem ele
   o token do Instagram precisa ser renovado a cada ~60 dias, e que com ele a
   automação renova sozinha e nunca mais para. Me guie para criar em
   https://github.com/settings/tokens com escopos "repo" e "workflow", e grave:
     gh secret set NEUROPED_AUTOMATION_TOKEN --repo jadsonfraga/neuroped
   Se eu recusar, siga em frente.

6. PUBLICAR A FUNCIONALIDADE.
   Veja o estado do PR: gh pr view 737 --repo jadsonfraga/neuroped
   Se houver CI falhando ou conflito, me mostre o que é em linguagem simples e
   pergunte antes de prosseguir. Se estiver limpo, confirme comigo e mescle:
     gh pr merge 737 --repo jadsonfraga/neuroped --squash --delete-branch
   O merge dispara o deploy automático.

7. RODAR A PRIMEIRA ATUALIZAÇÃO DO FEED.
     gh workflow run family-feed-daily.yml --repo jadsonfraga/neuroped
   Depois acompanhe até terminar:
     gh run list --workflow family-feed-daily.yml --repo jadsonfraga/neuroped --limit 1
     gh run watch <ID> --repo jadsonfraga/neuroped --exit-status
   Se falhar, leia o log com: gh run view <ID> --repo jadsonfraga/neuroped --log-failed
   Diagnostique e conserte o que estiver ao seu alcance. Importante: uma falha
   de rede NÃO perde conteúdo — o feed anterior continua publicado.

8. CONFERIR O SITE.
   Baixe https://neuroped.pages.dev/family-feed/novidades.json e me diga:
   - a data em "updatedAt"
   - quantas notícias vieram no total (somando os itens de todos os temas)
   - se "instagram.permalink" existe (significa que o post foi capturado)
   Depois abra no navegador para eu ver com meus olhos:
     https://neuroped.pages.dev/portal-familia/novidades
   Confira também o espelho https://superneuroped.vercel.app se o principal
   estiver bom.

9. RELATÓRIO FINAL.
   Me diga em português claro, sem jargão:
   - o que ficou funcionando
   - se o Instagram está no caminho oficial (com token) ou no público (sem)
   - se a renovação está perpétua (com PAT) ou se vou precisar mexer em ~60 dias
   - o que eu preciso fazer, se é que preciso fazer alguma coisa

ATALHO: o repositório já traz um script que faz as etapas 2 a 8 sozinho:
  powershell -ExecutionPolicy Bypass -File scripts\windows\Configurar-FeedFamilias.ps1
Use esse script se preferir — ele é interativo e pede o que precisar. Se algo
nele falhar, faça as etapas manualmente pelos comandos acima.

REGRAS
- Nunca escreva o token do Instagram nem o PAT em nenhum arquivo do repositório,
  em commit, em log ou em texto que fique salvo. Eles só entram como segredo do
  GitHub via "gh secret set".
- Não faça force-push e não reescreva histórico.
- Antes de mesclar o PR, me pergunte. Depois disso, siga sem me interromper.
- Se algo falhar, tente resolver antes de me chamar. Quando me chamar, diga o
  que aconteceu e o que você precisa de mim.
```

---

## O que o Cowork vai pedir a você

| Momento | O que ele pede | Você pode pular? |
| --- | --- | --- |
| Etapa 4 | Token do Instagram | Sim — o app funciona sem, pelo caminho público |
| Etapa 5 | PAT do GitHub | Sim — só significa renovar o token a cada ~60 dias |
| Etapa 6 | Confirmar o merge do PR | Não — é a sua decisão de publicar |

Tudo o mais ele resolve sozinho.

---

## Depois que terminar

O feed passa a se atualizar **todo dia, às 06h e 10h (horário de Recife)**, sem
nenhuma ação sua. As páginas que mostram o resultado:

- `https://neuroped.pages.dev/portal-familia` — cartão do Instagram
- `https://neuroped.pages.dev/portal-familia/novidades` — Instagram + novidades

Detalhes técnicos da automação estão em
[`FAMILY_FEED_AUTOMACAO.md`](FAMILY_FEED_AUTOMACAO.md).

---

## Se algo der errado

| Sintoma | O que fazer |
| --- | --- |
| "gh não é reconhecido" | Feche e reabra o terminal (o PATH mudou), ou rode o `.bat` de novo |
| Workflow falhou | O feed anterior continua publicado; peça ao Cowork para ler `gh run view <ID> --log-failed` |
| Instagram sem post | Configure o token (Etapa 4); enquanto isso o link do perfil funciona |
| Site não atualizou | Aguarde alguns minutos; o deploy roda depois do commit do feed |
