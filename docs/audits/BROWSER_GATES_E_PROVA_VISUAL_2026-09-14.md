# Gates de navegador e prova visual — 2026-09-14

Base inspecionada: `efad2006ed18618468880759be51bd7ed2f04d55` (HEAD de `main` no
início da sessão, worktree limpa). Nenhuma migração, rota de API, contrato
clínico, segredo ou dado de paciente foi tocado. Fixtures 100% sintéticas.

## 1. O que estava quebrado

### 1.1 Resolução do Chromium (causa do bloqueio externo recorrente)

Cinco scripts resolviam o executável do Chromium por conta própria e enxergavam
apenas duas fontes: a variável `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` e o browser
gerenciado **exatamente na revisão** que o Playwright instalado espera.

Numa imagem que já traz Chromium em outra revisão — o caso de runners com
download de browser desligado, com `PLAYWRIGHT_BROWSERS_PATH` apontando para um
diretório pré-provisionado — `chromium.executablePath()` devolve um caminho que
não existe e todo gate visual declara "Chromium indisponível". Foi assim que a
prova visual virou `BLOCKED_EXTERNAL` repetido nas auditorias recentes.

Medido nesta máquina antes da correção:

```
Executable doesn't exist at /opt/pw-browsers/chromium_headless_shell-1208/...
$ ls /opt/pw-browsers
chromium-1194  chromium_headless_shell-1194  ffmpeg-1011
```

O binário existia o tempo todo, duas revisões ao lado do caminho procurado.

### 1.2 Verde por omissão no gate de contraste

`scripts/guards/audit-surface-contrast.mjs` respondia à ausência de browser com
`process.exit(0)`. O gate participa de `verify:release`. O efeito prático: em
qualquer ambiente sem o browser gerenciado, `verify:release` ficava **verde**
tendo medido **zero** superfície de contraste — o "check verde via skip" que o
`AGENTS.md` proíbe explicitamente.

Isto não afetava a CI (todos os workflows rodam `npx playwright install
--with-deps chromium`), e é exatamente por isso que passou despercebido: o falso
verde só acontecia fora dela, nas máquinas onde as auditorias eram conduzidas.

### 1.3 Escuta Clínica sem nenhuma prova visual

A matriz autenticada cobria 12 grupos e 65 estados, mas nenhum da captura de
consulta — a única superfície clínica com zero cobertura visual, e justamente a
que está sob correção ativa na PR #855.

## 2. O que foi feito

| Mudança | Arquivo |
| --- | --- |
| Resolução única de Chromium, com descoberta do browser presente na imagem | `scripts/lib/browser-audit-runtime.mjs` |
| Gate de contraste falha fechado sem browser | `scripts/guards/audit-surface-contrast.mjs` |
| a11y, Lighthouse e audit-screens passam a usar a resolução compartilhada | `scripts/audit-a11y.mjs`, `scripts/audit-lighthouse.mjs`, `scripts/guards/audit-screens.mjs` |
| Regressão dos dois defeitos | `tests/unit/browser-audit-chromium-resolution.test.mjs` |
| Escuta Clínica na matriz visual (3 estados, 3 larguras) | `scripts/audit-visual-authenticated.mjs`, `scripts/lib/synthetic-clinical-api.mjs` |
| Grupo "Escuta" obrigatório no contrato da matriz | `tests/unit/visual-authenticated-matrix.test.mjs` |
| Coluna implícita no mobile e abas truncadas | `client/src/pages/prontuario.tsx` |
| Escuta Clínica coerente no tema escuro | `client/src/styles/escuta-clinica.css` |

A variável `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` mantém precedência absoluta,
inclusive quando aponta para caminho inexistente: configuração errada tem de
aparecer como erro de launch, não ser mascarada por um browser diferente.

## 3. Evidência

Comandos e códigos de saída desta máquina:

```
npm run lint                       exit 0   (antes e depois)
npm run check                      exit 0   (antes e depois)
npm run test:quick-wins            exit 0   (antes e depois)
npm run test:filter                exit 0   (antes; 356 casos clínicos verdes)
npm run test:clinical              exit 0   (antes)
npm run test:hardening-regressions exit 0
npm run audit:color                exit 0

npm run audit:visual-authenticated exit 1   ANTES  → "Chromium indisponível"
npm run audit:visual-authenticated exit 0   DEPOIS → 65/65 estados
npm run audit:visual-authenticated exit 1   com Escuta → 1 falha real (ver 3.2)
npm run audit:visual-authenticated exit 0   com tema escuro corrigido → 68/68

npm run audit:contrast             exit 0   538 linhas medidas em pixel real
npm run audit:a11y                 exit 0   modo=axe-playwright, 7 rotas, 0 violações
```

Os dois últimos são a medida do problema descrito em 1.1 e 1.2. Nesta máquina,
antes da correção, `audit:contrast` saía com exit 0 **sem medir uma única
linha** e `audit:a11y` caía no lint estático. Agora o contraste mede 538 linhas
de texto em pixel real e o axe roda em navegador (`modo=axe-playwright`, não o
fallback). O verde continua verde — mas pela primeira vez neste ambiente ele
corresponde a medição.

### 3.1 Regressão falha com o defeito reintroduzido

```
node tests/unit/browser-audit-chromium-resolution.test.mjs
  exit 1  com o process.exit(0) do contraste de volta
  exit 0  com a correção

node tests/unit/visual-authenticated-matrix.test.mjs
  exit 1  quando os estados da Escuta saem do grupo próprio
  exit 0  com a cobertura no lugar
```

Com a descoberta removida do resolvedor, `resolveAuditChromiumPath()` volta a
devolver `null` nesta máquina — isto é, o bloqueio externo retorna.

### 3.2 O gate novo achou defeito real na primeira execução

`escuta-tablet-dark` reprovou com `axe:color-contrast(serious)` em
`input[type="file"]`, `textarea` e `label > select`. A captura mostra a causa:
a página derivava só dos tokens claros, então no tema escuro os cartões ficavam
brancos dentro do aplicativo escuro enquanto regras globais de `.dark` pintavam
os controles de formulário com a cor de card escura — um bloco escuro dentro de
um cartão branco. Corrigido mapeando as superfícies da Escuta para o mesmo tema
do resto do aplicativo, sem introduzir nenhuma cor literal nova
(`npm run audit:color` exit 0).

Este é o argumento de que a cobertura valia a pena: ela não passou verde de
saída, achou um defeito que existia em produção e ninguém tinha visto.

### 3.3 Antes e depois do prontuário

- `prontuario-mobile-light` (390 px): "Data de nascimento" ocupava meia linha
  com o seletor nativo de data cortado, porque `col-span-2` incondicional criava
  uma segunda coluna implícita numa grade `grid-cols-1`. Depois: linha inteira,
  seletor visível, campos empilhados.
- `prontuario-desktop-light` (1440 px): a primeira aba lia "Identifi…" enquanto
  as abas curtas sobravam espaço, porque `flex-1` reparte a faixa em partes
  iguais ignorando o conteúdo. Depois: "Identificação" por extenso e espaço
  extra distribuído.

## 4. Limites — o que isto NÃO prova

- Não é prova manual da Escuta em hardware real. A matriz certifica enquadramento,
  presença do aviso de piloto e do estado do processamento; **não** grava áudio,
  não usa microfone e não substitui o gate manual pendente na PR #855.
- Não é certificação de acessibilidade: o axe roda nos estados da matriz, com os
  tetos já configurados, não em cobertura integral do aplicativo.
- Não houve deploy, merge, alteração de binding, segredo ou migração.
- `verify:release` completo não foi executado nesta sessão; foram executadas as
  suítes nomeadas acima.

## 5. Rollback

Cada lote é um commit próprio e reversível de forma independente:

1. Resolução de Chromium + contraste fail-closed + regressão.
2. Layout do prontuário.
3. Cobertura visual da Escuta + tema escuro da Escuta.

Reverter qualquer um restaura o comportamento anterior. Nenhum dado, migração,
rota de API ou contrato clínico é tocado por qualquer um dos três.

## 6. Efeito colateral esperado na CI

O gate de contraste passa a falhar fechado. Todos os workflows que o executam
instalam `chromium` antes, então o resultado em CI não muda. Se algum workflow
futuro rodar `audit:contrast` sem instalar o browser, ele vai **falhar** — e
isso é o comportamento correto, não uma regressão a contornar.
