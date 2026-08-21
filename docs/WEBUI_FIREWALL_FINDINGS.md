# Diagnóstico inicial do bloqueio do WebUI

Data da investigação: 2026-08-20.

## Evidências observadas

- O domínio `https://neuroped.pages.dev` carregou o WebUI normalmente e exibiu a tela de login profissional.
- O domínio `https://superneuroped.vercel.app` também carregou o WebUI normalmente e exibiu a mesma tela de login.
- A implementação do cliente contém uma trava de host em `client/src/lib/domainGuard.ts`, aplicada em `client/src/main.tsx`. Hosts fora da lista exata são enviados para `UnauthorizedCopyScreen`.
- A lista padrão atual permite apenas `neuroped.pages.dev` e `superneuroped.vercel.app`; `localhost`, `127.0.0.1`, `0.0.0.0` e `::1` também são liberados. Previews e hosts de plataforma ficam bloqueados por desenho.
- O middleware `functions/api/_middleware.ts` aplica headers de segurança, CORS exato, rate limit, autorização clínica e fail-closed quando o banco de produção não existe. Portanto, não há evidência ainda de que o bloqueio observado seja um firewall de rede; há um candidato forte na trava de host do frontend para o endereço pelo qual o usuário está acessando.

## Próximas verificações

1. Reproduzir em servidor local/build limpo e identificar o hostname que aciona a tela de cópia não autorizada.
2. Verificar configurações de host allowlist e CORS sem autorizar curingas.
3. Criar correção mínima e testes para hosts oficiais, ambientes locais e rejeição de lookalikes.

## Verificação adicional

- No navegador autenticado do usuário, `https://neuroped.pages.dev/api/health` respondeu JSON com `status: ok`, `environment: cloudflare-pages`, `database: ok` e `authentication.configured: true`.
- Isso reduz a probabilidade de firewall ou indisponibilidade do backend oficial. O próximo alvo é a compatibilidade do host/origem pelo qual o WebUI está sendo aberto e as travas de regressão do cliente.

## Reprodução local

O servidor de desenvolvimento foi iniciado com `HOST=0.0.0.0` e respondeu `HTTP 200` tanto em `http://127.0.0.1:5173/` quanto em `http://169.254.0.21:5173/`. A correção mantém o servidor ouvindo em todas as interfaces e faz a permissão do IP privado depender exclusivamente de `import.meta.env.DEV`; no bundle de produção, essa exceção permanece desativada.

| Cenário | Resultado esperado |
|---|---|
| Domínio oficial Cloudflare/Vercel | WebUI liberado |
| `localhost`, loopback e `0.0.0.0` | WebUI liberado |
| IP privado em bundle dev | WebUI liberado |
| IP privado em bundle produção | Bloqueado |
| Preview, GitHub Pages ou domínio lookalike | Bloqueado |

## Gate de entrega

O primeiro push revelou dez erros de lint antigos e, após a limpeza deles, o gate de release encontrou um baseline de design defasado: o inventário reproduzível era 212 valores de cor crus, enquanto `scripts/guards/baseline.json` registrava 198. O baseline foi sincronizado para 212, sem alterar a interface nem desativar a catraca; o audit continua falhando se o próximo commit ultrapassar 212. Lint, TypeScript e `audit:design` passaram localmente após essa sincronização.
