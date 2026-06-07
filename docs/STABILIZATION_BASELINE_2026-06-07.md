# NeuroPed — Baseline de Consolidação e Estabilização

Data: 2026-06-07

## Objetivo

Consolidar os ganhos recentes sem adicionar escopo novo. A prioridade deste baseline é estabilizar o app em produção, reduzir regressão visual, manter acesso público correto e preservar as áreas sensíveis protegidas.

## Estado estável desejado

### 1. Acesso

- O app público deve abrir sem PIN.
- O PIN master deve aparecer apenas em rotas sensíveis.
- A LGPD deve funcionar como aviso/registro não bloqueante.
- Rotas sensíveis devem permanecer centralizadas em `RouteGuard.tsx` e espelhadas em `App.tsx` por `Protected`.

Rotas sensíveis centrais:

- `/pant`
- `/assinatura-digital`
- `/pacientes`
- `/paciente/`
- `/prontuario`
- `/calculadora-dose`
- `/farmacologia`
- `/satisfacao-medicacao`
- `/plano-terapeutico`
- `/plano-intervencao`
- `/avaliacao-multiprofissional`
- `/fichas-registro`

### 2. Filtro de escalas

- O filtro deve preservar a regra visual do PR #260.
- Não alterar hierarquia de cards, medalhas, faixa superior e proporção sem ordem explícita.
- Arquivos protegidos:
  - `client/src/pages/filtro.tsx`
  - `client/src/index.css`
  - `docs/GOLDEN_RULE_FILTRO_PR260.md`

### 3. Imagens, mascotes e proporção

- Todas as imagens oficiais devem constar em `visualAssetRegistry`.
- A rota `/qualidade` deve renderizar todos os assets oficiais com `SafeAssetImage`.
- A home e o Portal da Família podem reaproveitar assets, mas sem cortar, distorcer ou gerar zoom visual.
- Guardas globais ficam em `client/src/styles/proportion-guards.css`.

### 4. Relatório final das escalas

- PDF/impressão deve conter todas as respostas.
- WhatsApp/Zap deve copiar/preparar relatório, preservando fallback quando o texto exceder limite de URL.
- Não reintroduzir envio automático silencioso.

### 5. CI e deploy

Workflow canônico:

- `.github/workflows/verify.yml`

Deploys protegidos:

- `.github/workflows/deploy.yml`
- `.github/workflows/deploy-cloudflare.yml`

Workflow legado preservado apenas para execução manual:

- `.github/workflows/test.yml`

Checks esperados antes de publicação:

- `npm ci`
- `npm run check`
- `npm run validate:catalog`
- `npm run audit:assets`
- `npm run test:clinical`
- `npm run build:client`

### 6. Regra de estabilização

Não adicionar novos módulos grandes até validar:

- `/`
- `/filtro`
- `/qualidade`
- `/portal-familia`
- `/pre-retorno`
- `/pant`
- `/pacientes`
- `/prontuario`

Critério mínimo:

- rotas públicas abrem sem PIN;
- rotas sensíveis pedem PIN;
- imagens principais carregam;
- filtro não sofre zoom/corte;
- relatório de escala gera PDF/impressão com respostas;
- deploy-check do Cloudflare aponta para SHA recente.

## Congelamento recomendado

Durante a próxima rodada, priorizar apenas:

1. correção de bugs;
2. teste visual em iPhone/Android/desktop;
3. melhoria de acessibilidade;
4. correção de textos institucionais;
5. redução de ruído de CI.

Evitar:

- redesign global;
- nova paleta;
- nova navegação;
- troca do padrão visual do filtro;
- mais assets sem registro central;
- novos fluxos clínicos sem teste.
