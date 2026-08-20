# Auditoria profunda das abas principais do NeuroPed

Data da auditoria: 2026-08-20

## Escopo inicial

Foram mapeados o shell de navegação, o guard de rotas, o contexto de autenticação, o dock móvel, o prontuário, a agenda e a aba de integrações Manus.

## Achados confirmados ou de alta probabilidade

### AUD-001 — Navegação principal não filtra itens por RBAC

**Evidência:** `client/src/components/Layout.tsx` calcula `visibleSections` filtrando somente `IS_PUBLIC_ZONE`; no workspace clínico devolve `navSections` completo. O mesmo componente expõe atalhos fixos por meio de `FeaturedShortcuts` sem consultar `user.role`. `useAuth()` é usado somente para `accessMode` e `logout`, embora o contexto disponibilize `user.role`.

**Contrato esperado:** `client/src/security/routeGuardPolicy.ts` define `/pacientes`, `/agenda`, `/manus` e outras rotas como sensíveis. O guard permite por padrão apenas `admin` e `professional`, com exceção explícita de `operator` para `/agenda`; `reader` só possui uma allowlist de instrumentos.

**Impacto:** perfis `reader` e `operator` podem visualizar links e atalhos para abas que serão bloqueados pelo `RouteGuard`, produzindo affordance falsa e fluxo quebrado. Não é bypass de autorização porque o guard falha fechado, mas é uma inconsistência funcional e de UX com risco de confusão operacional.

**Reprodução estática:** comparar `visibleSections`/`FeaturedShortcuts` com `decideRouteAccess`. Não há qualquer filtragem por papel antes dos `Link`s.

### AUD-002 — Dock móvel repete a exposição de rotas sem RBAC

**Evidência:** `client/src/components/MobilePrimaryDock.tsx` define links fixos para `/pacientes`, `/agenda` e `/filtro`; o componente só filtra por zona pública e prefixos de rota, sem consultar `useAuth()` ou `decideRouteAccess`.

**Impacto:** o problema do menu principal persiste no mobile, inclusive para perfis operacionais e leitores.

### AUD-003 — Aba Manus não detecta falha de iframe

**Evidência:** `client/src/pages/manus-integracoes.tsx` renderiza um `iframe` único sem `onLoad`, `onError`, timeout, estado de carregamento ou mensagem automática para bloqueio por `X-Frame-Options`/CSP. O fallback é apenas o botão manual “Abrir em nova guia”.

**Impacto:** tela em branco ou carregamento indefinido parece falha do NeuroPed, sem diagnóstico ou recuperação visual. Sites que proíbem incorporação não podem ser detectados de forma confiável por JavaScript do pai, portanto o UX precisa assumir falha após timeout e oferecer fallback.

### AUD-004 — Seletor de paciente da agenda usa somente os primeiros 100 registros

**Evidência:** `client/src/pages/agenda.tsx` usa a chave `/api/patients?limit=100&offset=0` para preencher o seletor de vínculo clínico.

**Impacto:** em bases com mais de 100 pacientes, um paciente existente pode não aparecer para associação a um agendamento manual. O problema afeta somente o seletor, não a autorização do backend.

### AUD-005 — Lista “Próximas” da agenda é truncada em 40 itens sem indicação

**Evidência:** `upcoming` filtra e ordena os agendamentos, depois aplica `.slice(0, 40)`, enquanto o backend retorna no máximo 250 appointments.

**Impacto:** consultas futuras válidas podem desaparecer da lista operacional sem paginação, filtro ou indicação de truncamento. A grade diária continua separada, mas a visão resumida não representa toda a agenda.

## Próximas verificações

1. Confirmar a cobertura dos auditores e localizar contratos quebrados entre frontend, backend Express e funções Cloudflare.
2. Executar `check`, builds, testes clínicos, testes de operações e verificações de navegação.
3. Inspecionar os fluxos de Receitas C1, impressão/PDF, pacientes, detalhe do paciente, laudo, Conecta e autenticação.
4. Corrigir somente achados reproduzidos, adicionar testes de regressão e validar deploy.

## Inspeção visual local — 2026-08-20

O primeiro carregamento em `http://localhost:5000/` exibiu uma tela branca por alguns segundos; após aguardar, a aplicação hidratou e redirecionou para `#/login` com o aviso de autenticação clínica não configurada no endereço local. O shell, a navegação e o modal de aviso legal foram renderizados.

Esse comportamento inicial precisa ser classificado como **observação de UX/performance**, não como bug confirmado: pode ser apenas o tempo de carregamento do bundle em desenvolvimento. A build mostrou chunks grandes, incluindo `generic-scale` com cerca de 1,2 MB minificado e `scaleFilter` com cerca de 795 kB, o que pode explicar a primeira tela branca e merece teste de carregamento em produção.

A inspeção visual confirmou que o menu completo aparece no estado de login público, mas ainda não permite inferir o papel remoto porque a sessão local não está autenticada. A divergência de RBAC já foi confirmada estaticamente no shell e no dock.

A tentativa de fechar o modal de aviso legal por coordenada não alterou a tela; o modal continuou presente. Isso ainda não é bug confirmado, pois a ação foi feita com coordenada aproximada em uma viewport anotada e precisa ser repetida por elemento acessível ou teclado antes de classificar como falha.

A interação foi repetida localizando o botão pelo texto no DOM; o clique correto fechou o modal e deixou a tela de login clínica utilizável. Portanto, não há bug confirmado no modal. A página local informa corretamente que a autenticação profissional não está configurada naquele endereço, em vez de exibir uma área clínica sem sessão.

## Confirmação visual de RBAC e navegação

Ao navegar sem sessão para `http://localhost:5000/#/manus`, o app redirecionou corretamente para `/?next=%2Fmanus#/login`; portanto, a proteção de rota funciona. Entretanto, a mesma tela de login exibiu visualmente os atalhos `Agenda & Gestão`, `Pacientes / Prontuário`, `Laudos`, `Receita C1` e `Integrações Manus` na sidebar. Isso confirma o **AUD-001** como bug de navegação/affordance: os destinos sensíveis são apresentados mesmo quando a sessão não está autenticada e o guard irá redirecionar ao login.

Também foi exibido um prompt de instalação PWA na tela de login. Não foi classificado como bug nesta etapa, mas deve ser avaliado quanto a repetição, prioridade e possível sobreposição em telas clínicas pequenas.

### AUD-006 — Aba Pacientes mostra e pesquisa somente a primeira página

**Evidência:** `client/src/pages/pacientes.tsx` usa `useQuery` com a chave `/api/patients` sem `page`, `limit` ou `q`, depois filtra `patients` apenas em memória. A API Cloudflare aplica `limit` padrão 20 e máximo 50 (`functions/api/patients/index.ts`, linhas 91–93), com paginação por página.

**Impacto:** com mais de 20 pacientes, a tela pode omitir registros recentes/antigos dependendo da ordenação; a busca por nome não encontra pacientes que não estejam no primeiro lote. Isso também torna o seletor e o acesso ao prontuário inconsistentes com a base real. O backup possui paginação própria, mas a operação cotidiana da aba não.

**Classificação:** bug funcional confirmado, severidade média; correção recomendada com busca server-side e paginação explícita, reutilizando o padrão da `CommandPalette`.

### AUD-007 — Campos “Idade do paciente” e “Doses por dia” ausentes nas duas Receitas C1

**Evidência:** `client/src/pages/receita-c1.tsx` define `ReceitaFields` apenas com `pac`, `end`, `med`, `qtd`, `qtde`, `poso` e `data`; o formulário renderiza os mesmos campos e `buildReceitaC1Html`/`buildReceitaC1SignedPdfBytes` não recebem idade nem doses por dia. `client/src/pages/receita-c1-express.tsx` também não possui esses campos no contrato, formulário, impressão ou PDF.

**Impacto:** a exigência registrada no histórico do produto não está refletida no código atualmente auditado. Uma receita pode ser gerada sem esses dados, criando divergência entre requisito, tela e documento final.

**Classificação:** bug funcional/regulatório, severidade alta para o fluxo C1; requer correção nas duas variantes, validação e cobertura de impressão/PDF.

### AUD-008 — Paleta de comandos também expõe rotas e busca pacientes sem RBAC/server-side

**Evidência:** `client/src/components/CommandPalette.tsx` expõe `navigablePages` e ações clínicas sem consultar `user.role`/`decideRouteAccess`, e carrega `/api/patients` sem `q`, `page` ou `limit`, filtrando apenas o primeiro lote no cliente.

**Impacto:** corrigir apenas sidebar e dock deixaria um terceiro caminho de navegação inconsistente; a busca global continuaria omitindo pacientes fora da primeira página.

**Classificação:** bug funcional/UX confirmado, severidade média.

## Estado da reprodução até aqui

A auditoria automatizada, TypeScript, lint, builds, auditorias de segurança e contratos principais foram executados. A inspeção visual local confirmou o redirecionamento seguro para login, mas também confirmou que links clínicos continuam visíveis em estados sem sessão. O próximo passo é corrigir os achados reproduzidos, começando por navegação/RBAC, busca/paginação de pacientes, campos das Receitas C1 e fallback visual das integrações Manus.

## Correções aplicadas nesta rodada — 2026-08-20

- **AUD-007 corrigido:** `receita-c1.tsx` e `receita-c1-express.tsx` agora possuem os campos obrigatórios **Idade do paciente** e **Doses por dia** no contrato, formulário, validações de assinatura/impressão/PDF, conteúdo canônico e metadados de arquivamento quando aplicável.
- O layout A5 de ambas as variantes foi expandido de forma controlada para incluir os novos dados sem remover endereço, município, validade ou posologia.
- A validação permanece fail-closed: uma emissão não é gerada quando idade ou doses por dia estão ausentes.

A correção ainda precisa passar pela bateria final de TypeScript, lint, testes de PDF/assinatura e inspeção visual antes de ser considerada publicada.

- **AUD-003 corrigido:** a aba Manus agora mostra estado de carregamento, timeout de 10 segundos, tratamento de erro e fallback explícito para abrir o domínio em nova guia. O comportamento não tenta inspecionar conteúdo cross-origin; assume bloqueio de incorporação de forma segura e orienta a recuperação.
- **AUD-004 corrigido:** o vínculo de paciente na agenda agora usa busca server-side parametrizada, com indicação de resultados.
- **AUD-005 corrigido:** a lista “Próximas consultas” não aplica mais o corte silencioso de 40 itens e informa a quantidade carregada.
- **AUD-001/AUD-002/AUD-008 corrigidos anteriormente:** sidebar, dock móvel e paleta de comandos passaram a respeitar a política central de RBAC e o estado fail-closed de autenticação.
- **AUD-006 corrigido anteriormente:** Pacientes passou a usar busca server-side, paginação e total retornado pela API.

## Correções e validação final — 2026-08-20

- **Bundle:** o entrypoint inicial chegou a 123,57 KB gzip e depois 119,76 KB após a primeira divisão. O carregamento tardio de `PageMascotDecor`, do dock móvel, da tela de domínio não autorizado e das superfícies opcionais do shell reduziu o entrypoint para **103,38 KB gzip**, com carga inicial real de **157,70 KB gzip**, ambos abaixo dos tetos de 118/178 KB. O maior chunk tardio permaneceu dentro do limite: 306,04 KB gzip contra 320 KB.
- **Validação:** `npm run verify` foi executado após as correções e terminou aprovado, incluindo lint, TypeScript, testes de segurança, Clinical Core, operações, PDFs clínicos, navegação, acessibilidade, design, Lighthouse, build, shell offline e baseline.
- **Worktree:** os artefatos gerados pelo build/auditoria foram revertidos; permanecem somente alterações funcionais, testes de regressão e o relatório desta auditoria.

## Classificação residual

Os avisos de chunks grandes do bundler referem-se a chunks tardios de escalas e documentos, mas os limites específicos de chunk bruto/gzip e o orçamento de carga inicial foram respeitados. Não foi encontrado bypass de autorização nas rotas protegidas: os problemas confirmados foram de exposição indevida de links, corrigidos com filtragem centralizada por papel e estado de autenticação.

A inspeção local sem sessão confirmou redirecionamento para login; o ambiente local não possui autenticação clínica remota configurada, portanto não foi possível testar uma sessão real de cada papel no navegador. Os contratos automatizados de RBAC e o modo local protegido por PIN foram aprovados.

## Achado adicional reproduzido e corrigido — 2026-08-20

### AUD-009 — Dock móvel montado fora do `AuthProvider`

**Reprodução:** o diagnóstico com Chromium mostrou erro de runtime `useAuth must be used within <AuthProvider>`, `#main-content` ausente, shell sem conteúdo e teste responsivo expirando após 15 segundos. A causa era a montagem de `MobilePrimaryDock` diretamente em `main.tsx`, como irmão de `<App />`, enquanto o componente chama `useAuth()` na montagem.

**Correção:** o dock passou a ser lazy-loaded dentro de `App.tsx`, na árvore protegida pelo `QueryClientProvider` e `AuthProvider`; a montagem duplicada foi removida de `main.tsx`. O code splitting foi preservado.

**Validação:** TypeScript, lint e diagnóstico DOM passaram sem erros; o E2E responsivo completo passou em 390, 640, 767, 768, 834, 1023, 1024 e 1280 pixels, incluindo drawer, dock, foco, Escape, touch, zoom e impressão.

**Classificação:** bug funcional crítico do shell, corrigido.

### AUD-010 — Gate de acessibilidade atribuía ao NeuroPed violações internas de iframe externo

**Reprodução:** o workflow `Filter and scales spiral audit` no SHA `1dc9b642` encontrou uma violação `color-contrast` serious em três elementos internos de `Home.tsx` do site Manus carregado na rota `/#/manus`, com contraste 4,31:1. O relatório também apontou `landmark-unique` no `#main-content` do próprio shell.

**Análise:** os três nós de contraste pertencem ao DOM do site externo incorporado, não ao NeuroPed. Como a aba Manus foi desenhada para carregar os domínios originais em isolamento, o gate do NeuroPed não deve transformar a acessibilidade de terceiros em falha de release. O landmark principal, por outro lado, é responsabilidade do shell e estava sem nome acessível único.

**Correção:** o `main#main-content` recebeu `aria-label="Conteúdo principal"`. O auditor axe passou a excluir o DOM interno de `iframe` externo, mantendo a verificação do próprio elemento incorporado e o lint estático de `title`/contratos de iframe.

**Validação:** a reprodução dirigida com Chromium local retornou `violations: []` em `/#/manus`; `npm run verify` passou localmente após a alteração. O workflow de acessibilidade será repetido no novo SHA para confirmação em navegador limpo.

**Classificação:** bug de acessibilidade/limite de auditoria, corrigido.

## Estado pós-correção

A auditoria funcional foi concluída e a correção do AUD-010 está pronta para publicação. O novo SHA precisa passar novamente pelos checks de segurança, acessibilidade e deploy antes da entrega final.
