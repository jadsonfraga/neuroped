# Auditoria final de consolidação — NeuroPed (2026-06-08)

## 1. Resumo executivo

Rodada executada de forma conservadora em 2026-06-08. O workspace local estava na branch `work`, sem remoto Git configurado e sem GitHub CLI instalado; além disso, acessos Git/API via terminal foram bloqueados por proxy HTTP 403. Por isso, não foi possível fechar/mergear PRs ou issues diretamente nesta sessão.

Foram aplicadas apenas mudanças seguras de governança/deploy:

- adição de sentinela versionada em `client/public/deploy-check.json`;
- ajuste dos workflows de GitHub Pages e Cloudflare Pages para publicar a sentinela no schema auditável com `deployed_commit` e validação JSON pós-deploy;
- registro explícito das limitações e resultados de validação nesta auditoria.

Veredito técnico desta rodada: **SUCESSO PARCIAL**. O build e as auditorias essenciais passaram localmente, mas o deploy público ainda não comprova o commit desta rodada e a reconciliação de PRs/issues não pôde ser executada sem `gh`, remoto e acesso autenticado.

## 2. PRs abertos antes

Estado conhecido pelo prompt/auditoria anterior:

| PR | Estado conhecido | Resultado nesta sessão |
| --- | --- | --- |
| #399 | aberto/pendente | Não alterado: sem `gh`, sem remoto e terminal bloqueado por proxy 403 para GitHub. |
| #402 | aberto/pendente | Não alterado: sem `gh`, sem remoto e terminal bloqueado por proxy 403 para GitHub. |
| #405 | aberto/pendente; objetivo de governança válido; não mergeável | Substituído parcialmente por implementação segura local dos trechos úteis de sentinela e verificação pós-deploy. PR remoto não foi fechado/mergeado nesta sessão. |

Comandos tentados para sincronização/auditoria remota:

| Comando | Resultado |
| --- | --- |
| `git fetch origin main --prune` | Falhou: `origin` não existe neste clone local. |
| `gh repo view jadsonfraga/neuroped --json nameWithOwner,defaultBranchRef,url` | Falhou: `gh: command not found`. |
| `git ls-remote https://github.com/jadsonfraga/neuroped.git HEAD refs/heads/main` | Falhou: `CONNECT tunnel failed, response 403`. |
| GitHub API via Python/urllib | Falhou: `Tunnel connection failed: 403 Forbidden`. |

## 3. O que foi mergeado

Nada foi mergeado remotamente nesta sessão. Localmente, os trechos seguros de governança/deploy foram aplicados em branch de trabalho para posterior PR.

## 4. O que foi fechado como superseded

Nenhum PR foi fechado nesta sessão, porque o ambiente não possui `gh`, não possui remoto Git configurado e não permitiu acesso Git/API ao GitHub pelo terminal.

## 5. Issues fechadas

Estado conhecido pelo prompt/auditoria anterior:

| Issue | Estado conhecido | Resultado nesta sessão |
| --- | --- | --- |
| #397 | fechada como completed | Não reaberta; confirmação remota direta indisponível no terminal. |
| #398 | fechada como completed | Não reaberta; confirmação remota direta indisponível no terminal. |

## 6. Commits finais

- Base local antes desta rodada: `a0763ea30e8a16de14e016a2987337be275ab62b`.
- Commit desta rodada: a ser gerado após este arquivo, com escopo esperado `ci: harden deploy sentinel verification`.

Observação: o arquivo versionado `client/public/deploy-check.json` usa status `pending-public-verification` porque o hash definitivo só é conhecido no momento do commit/workflow. Os workflows sobrescrevem a sentinela antes do build com `GITHUB_SHA` em `deployed_commit`.

## 7. Comandos rodados

| Comando | Resultado |
| --- | --- |
| `npm ci` | **Falhou por limitação de ambiente/proxy e Node 24**: download do binário `bcrypt` retornou 403; fallback `node-gyp` também falhou ao baixar headers Node 24 com HTTP 403. |
| `npm ci --ignore-scripts` | **Passou para diagnóstico**: dependências instaladas sem scripts nativos. Não substitui instalação real completa. |
| `npm run check` | **Passou**. |
| `npm run validate:catalog` | **Passou**: 583 instrumentos, 577 com fonte, 6 pendentes, integridade estrutural OK. |
| `npm run audit:access` | **Passou**: app público aberto e PIN reservado a rotas sensíveis. |
| `npm run audit:identity` | **Passou**: identidade institucional central aprovada. |
| `npm run audit:navigation` | **Passou**: todos os itens do menu apontam para rotas registradas. |
| `npm run audit:filter` | **Passou**: Filtro PR260 aprovado; estética, hierarquia e forma de filtrar preservadas. |
| `npm run audit:assets` | **Passou**: 14 assets oficiais presentes, não vazios, registrados e renderizados em `/qualidade`. |
| `npm run test:clinical` | **Passou**: 347 casos, 141314 assertivas, 583 escalas. |
| `npm run build:client` | **Passou** com avisos de CSS/import e chunks grandes já existentes. |
| `npm run verify` | **Falhou** em `audit-design`: regressão de cores cruas `275 > baseline 253`. As etapas anteriores do verify passaram até esse ponto. |

## 8. Resultado de cada comando

Resumo objetivo:

- Validações essenciais solicitadas individualmente passaram após instalação diagnóstica com `--ignore-scripts`.
- A instalação real `npm ci` não passou, portanto a validação completa não deve ser declarada como 100% verde.
- `npm run verify` não passou por baseline de design, pendência que deve ser tratada separadamente sem redesenhar o app.

## 9. Evidência de deploy

URLs públicas verificadas via ferramenta web em 2026-06-08:

### GitHub Pages

- URL Home: https://jadsonfraga.github.io/neuroped/
- Sentinela: https://jadsonfraga.github.io/neuroped/deploy-check.json
- Conteúdo retornado:

```json
{ "app": "NeuroPed", "provider": "github-pages", "branch": "main", "commit": "a0763ea30e8a16de14e016a2987337be275ab62b", "run_id": "27132553181", "run_number": "984", "deployed_at_utc": "2026-06-08T10:49:44Z" }
```

Status: **HTTP 200 público verificado**, mas ainda com schema antigo (campo `commit`) e commit anterior ao commit desta rodada.

### Cloudflare Pages

- URL Home: https://neuroped.pages.dev/
- Sentinela: https://neuroped.pages.dev/deploy-check.json
- Conteúdo retornado:

```json
{ "app": "NeuroPed", "provider": "cloudflare-pages", "branch": "main", "commit": "54ffb63b5ab63dbb177c47829b06932babfcdfaa", "run_id": "27130850018", "run_number": "670", "deployed_at_utc": "2026-06-08T10:15:17Z" }
```

Status: **HTTP 200 público verificado**, mas commit não bate com a base local atual desta sessão (`a0763ea30e8a16de14e016a2987337be275ab62b`) nem com o futuro commit desta rodada.

### Rotas mínimas testadas por carregamento HTML público

Em GitHub Pages, as rotas hash retornaram o HTML/título do app, sem evidência de 404 servidor:

- `#/`
- `#/filtro`
- `#/pre-consulta`
- `#/pre-retorno`
- `#/portal-familia`
- `#/pant`
- `#/assinatura-digital`

Observação: esta verificação confirma entrega pública do shell HTML, mas não substitui teste end-to-end em browser com inspeção visual/interativa.

## 10. Pendências restantes

1. Fechar/mergear/reconciliar PRs #399, #402 e #405 no GitHub com acesso autenticado.
2. Confirmar remotamente issues #397 e #398 pelo GitHub após recuperar `gh`/token/remoto.
3. Fazer deploy do commit desta rodada em GitHub Pages e Cloudflare Pages.
4. Revalidar que `deployed_commit` público bate com o commit publicado.
5. Resolver a divergência Cloudflare Pages, atualmente em commit diferente do GitHub Pages.
6. Corrigir a falha de `npm run verify` em `audit-design` ou atualizar baseline justificadamente.
7. Rodar `npm ci` em ambiente com Node 20 e acesso aos binários/headers nativos, sem `--ignore-scripts`.

## 11. Nota realista final

- Código: **8.0/10** — check, catálogo, auditorias essenciais, testes clínicos e build passaram; verify ainda falha em design baseline.
- Deploy: **6.5/10** — URLs públicas respondem 200, mas commits entre provedores divergem e ainda não apontam para o commit desta rodada.
- Governança: **7.0/10** — workflows e sentinela melhorados, porém PRs remotos não puderam ser fechados/mergeados.
- UX: **8.0/10** — auditorias de filtro PR260, navegação, assets e acesso passaram; sem redesenho aplicado.
- Nota geral: **7.3/10** — sucesso parcial, com pendências objetivas de ambiente, PRs remotos, deploy pós-commit e verify.
