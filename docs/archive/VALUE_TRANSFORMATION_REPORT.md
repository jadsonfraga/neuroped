# VALUE_TRANSFORMATION_REPORT

**NeuroPed — Operação VALUE ×3**  
**Data:** 26 de setembro de 2026.  
**Aceite global: PARTIAL. Não aprovado para produção.**

Este relatório consolida implementação, testes executados e contribuições concorrentes. Substitui a fotografia de encerramento anterior do commit `c832437d919305aaaa06b3d731dcbd2d1b876e2a`, preservada no histórico Git. Estados de CI são fotografias dos runs identificados, não monitoramento contínuo. A existência de código, aprovação de um teste, deploy, operação comercial e receita são evidências distintas.

## 1. Antes — o que realmente existia

Repositório: `jadsonfraga/neuroped`. Base inicial auditada: `0b4f74fb49214d00944fc2a366d3b4454363601a`.

O produto já possuía cliente React/TypeScript, backend Cloudflare Pages Functions, D1/SQLite e migrations, clínica/membership, catálogo central de permissões, integração Asaas, entitlements de servidor, armazenamento clínico LIVE criptografado, documentos, avaliações, auditoria e fluxos de governança. Não eram componentes ausentes a reconstruir.

A auditoria distinguiu a rota legada `/api/clinical-core`, apoiada em dados demo, do armazenamento LIVE. O catálogo de permissões já existia; havia autorização derivada de papel no painel de métricas. A presença de checkout/webhook não comprovava cobrança comercial. O diretório solicitado `docs/dataroom/` não existia na base consultada.

A inspeção foi amostral, com leitura dos contratos e caminhos relevantes; não foi inventário exaustivo de todas as entidades, rotas e runtimes. Nenhum cliente, receita, certificação ou resultado clínico foi inferido da existência do código.

## 2. Depois — implementação efetiva

### Transformação 1 — Autonomous SaaS

PR **#1003**, branch `value/autonomous-saas`.

Foram implementados progresso de onboarding calculado no servidor, permissões servidas pelo backend para o painel e contratos contra dados/completude fabricados. Uma contribuição concorrente consolidou essa implementação em `shared/onboarding.ts`, `OnboardingProgressCard.tsx` e no handler canônico de onboarding, removendo os módulos duplicados iniciais. Essa contribuição foi preservada, não sobrescrita.

A versão consolidada acompanha dez marcos e seus timestamps, diferencia configuração externa de evento persistido, exclui o proprietário do marco de primeiro membro adicional, integra o card à home/configurações e amplia a jornada sintética com handlers reais e schema/migrations. As fronteiras HTTP Asaas/Resend continuam simuladas nessa jornada; `SERVER_CONFIRMED` em um fixture ou sandbox não é receita real.

Uma regressão de ordenação de timestamps foi reproduzida após a consolidação: uma data SQLite posterior podia preceder uma data ISO anterior por comparação textual. O commit `8109bee515c7850ce1d6f2fd456be4edf353ade8` corrige sete seleções para ordenar por instante e acrescenta regressão à suíte canônica existente. O teste canônico executou com sucesso no CI.

O commit `45d1f61d1590bdcb36fe58446fba1a0b637d77f3` reconcilia o contrato antigo de owner: deixa de exigir o texto de uma mensagem e o nome de um helper removido, passando a exigir o predicado de permissão e as verificações SQL finais de owner ativo. A proteção não foi removida; o gate LIVE de isolamento passou no novo SHA.

**Aceite integral: PARTIAL.** O cliente-zero operacional completo, pagamento/e-mail reais, exportação reconciliada e todos os gates ainda não estão comprovados.

### Transformação 2 — Clinical Intelligence

PR **#1000**, branch `value/clinical-intelligence`.

O novo motor preserva fontes, autor, paciente, tenant e natureza da informação; constrói timeline e cobertura de 17 domínios; calcula deltas numéricos apenas entre medidas estruturalmente comparáveis; explicita divergências potenciais, informação ausente e alertas documentados. Observações corrigidas, anuladas ou futuras não fornecem comparações indevidas.

O endpoint `/api/live/intelligence` reutiliza o leitor LIVE existente, com seus controles de membership, billing, paciente e criptografia. Não cria armazenamento paralelo nem chama provedor de IA. Documentos e questionários não extraídos permanecem identificados como tal.

Uma diferença numérica não é chamada de melhora clínica. Categoria de fonte não equivale à identidade do informante. O resultado é rascunho que exige revisão profissional, sem diagnóstico, prescrição ou mudança terapêutica autônoma.

**Aceite integral: PARTIAL.** O motor foi testado, mas a publicação de todo documento final do produto ainda não está vinculada a uma atestação durável universal de revisão. A jornada autenticada do novo endpoint e sua utilização no navegador não foram comprovadas em produção.

### Transformação 3 — Enterprise Trust

PR **#1005**, branch `value/enterprise-trust`.

Foi criado **Product Evidence**, integrado à área de atividade, com endpoint de metadados autorizado por clinic/membership/permissão, contagens SQL reais, observação pontual do health check e auditoria mínima com request ID. Contagem observada zero aparece como zero; MRR, churn, uptime, deploy, backup e outras evidências não conectadas permanecem desconhecidas, nunca zeradas por conveniência.

Foi implementado verificador de recuperação com backup e restore SQLite reais em diretório isolado usando apenas dados sintéticos: schema, integridade, foreign keys, contagens, checksums HMAC e leitura de sentinela. O mecanismo mede RPO/RTO de laboratório e rejeita corrupção mesmo quando a contagem não muda. Não se converte esse ensaio em prova de recuperação D1/produção.

Foi reproduzido e corrigido um defeito no catálogo de entitlements: propriedades herdadas de objetos JavaScript e valores não-string podiam escapar do contrato de plano desconhecido. O catálogo agora exige chave própria e string. Não foi demonstrada exploração em produção.

Foram publicados os 13 arquivos de `docs/dataroom/`, a matriz de lacunas e os relatórios de validação. **Aceite integral: PARTIAL.** Recuperação operacional, isolamento universal e enforcement de todos os gates de produção não estão certificados.

## 3. Evidências

### Commits e PRs

| Frente | Evidência de código e reconciliação | PR |
|---|---|---|
| SaaS | Inicial `d7a6e58b681055d160262086d3ca245acf9e21e1`; consolidação concorrente preservada `752f58f8f2300888fbba74f2b7224bcf664d07e5`; cronologia `8109bee515c7850ce1d6f2fd456be4edf353ade8`; contratos de owner `45d1f61d1590bdcb36fe58446fba1a0b637d77f3` | https://github.com/jadsonfraga/neuroped/pull/1003 |
| Clínica | Implementação `3201e5acf765b308200793cb042400d01bc6d135`; reconciliação com main `dd70f44a06b5ce559950113836773e600222fa75` | https://github.com/jadsonfraga/neuroped/pull/1000 |
| Trust | Código `231472d084db7cd81996f53f149e3a226168e5a5`; data room `33e9884d109fe4243762cf8b410b4fcf3c44a716`; relatório concorrente preservado `c832437d919305aaaa06b3d731dcbd2d1b876e2a`; integração de main `693aace7c0e493861ee02e6f988a4d271701540d` | https://github.com/jadsonfraga/neuroped/pull/1005 |

A base principal mudou durante a operação. As alterações LGPD de `d3fa9239586e98b6453cd5609a11bb592c40949f` foram preservadas nas reconciliações. A frente Trust incorpora também os arquivos de exportação de `574236b350181651664313f72afcf26297940003`, sem reescrevê-los. Isso não é revalidação da exportação. Uma tentativa de atualização não-fast-forward foi rejeitada e investigada; não foi feito force push.

### CI consultado diretamente

| SHA / run | Resultado observado | Limite |
|---|---|---|
| Clínica `3201e5a`, run `36277849886` | SUCCESS | Contratos novos, typecheck, lint e regressões clínicas existentes. |
| Clínica reconciliada `dd70f44`, run `36279546329` | SUCCESS | Contratos clínicos após incorporar main d3fa923. |
| SaaS inicial `d7a6e58`, run `36278299458` | SUCCESS | Implementação inicial, posteriormente consolidada; não atesta a nova versão. |
| SaaS `8109bee`, run `36279977720`, job `108509834430` | FAILURE global; onboarding, UI, autorização e jornada parcial passaram | Cliente-zero falhou na expectativa de completude de exportação: recebido true, esperado false. |
| SaaS `8109bee`, run `36279977813` | FAILURE | Teste adversarial passou; contrato antigo de owner falhou por texto/helper obsoletos. |
| SaaS `45d1f61`, run `36280253367` | SUCCESS | Gate de isolamento LIVE após reconciliar o contrato de owner. |
| SaaS `45d1f61`, runs `36280253289` e `36280253377` | FAILURE | Atomicidade LGPD e Membership seat fix D1; causas completas ainda não revalidadas neste fechamento. |
| Trust `33e9884`, run `36279316186` | SUCCESS | Typecheck, lint, evidência, SQL sintético, entitlement e restore sintético. |

Links dos runs seguem o padrão `https://github.com/jadsonfraga/neuroped/actions/runs/<ID>`. Outros jobs estavam pendentes na consulta. Workflow pulado não é aprovado. Um commit documental ou de reconciliação posterior não herda automaticamente a aprovação do SHA anterior. Runs de PR podem testar o merge virtual com uma main mais recente, como `a315bf777639e0d266fa5e98d8e1896448551439` para o head SaaS `8109bee`.

### Testes locais e RED → FIX → GREEN

Foram executados historicamente 46 casos locais nas versões iniciais: 11 clínicos, 5 de onboarding, 7 SQL de onboarding, 6 Product Evidence, 5 SQL de evidências, 9 de restore e 3 de entitlement. **Não são 46 E2E nem uma suíte atual reconciliada.** Os 12 casos iniciais de onboarding foram substituídos pela implementação canônica concorrente; seus logs são históricos.

Os testes do motor usam o código efetivo; os testes SQL executam SQLite sobre projeções sintéticas. A recuperação realiza operações reais de SQLite, mas sobre duas tabelas e três registros sintéticos. Módulo ausente foi RED de funcionalidade nova, não incidente de produção. A falha de chave herdada e a falha de ordenação temporal foram reproduzidas antes da correção.

Há logs sanitizados e relatório de restore no pacote de evidências. Não há screenshot pós-deploy, SHA servido, cliente pagante, cobrança comercial ou receita comprovados para estas três transformações.

## 4. Bloqueios externos

**BLOCKED_EXTERNAL:** validação autorizada com entrega real de e-mail, identidade profissional, checkout/pagamento, fatura, cancelamento e reativação no provedor. A disponibilidade de credenciais de produção não foi estabelecida; isso não demonstra indisponibilidade do serviço.

**BLOCKED_EXTERNAL:** recuperação operacional autorizada, em ambiente seguro, incluindo chaves, schema integral, dados e volume representativos. Nenhuma cópia de dados clínicos reais foi realizada por esta execução.

O computador conectado estava offline e o clone no container falhou por resolução DNS; a API GitHub permitiu leitura e escrita reais. Os testes locais disponíveis e o CI remoto foram usados dentro de seus limites. **Falha de CI, ausência de implementação e reconciliação pendente são pendências de engenharia, não bloqueios externos.**

## 5. Riscos remanescentes

A versão conjunta ainda não passou por todos os gates. Há falhas explícitas de LGPD/assentos e incompatibilidade do cliente-zero com a exportação incorporada à main. Não foi alterada uma expectativa para simplesmente aceitar `complete: true`; é preciso verificar o conteúdo efetivamente exportado e suas provas de completude. Relatórios anteriores que dizem invariavelmente `complete: false` não devem ser aplicados automaticamente à nova implementação.

SaaS e Trust alteram o mesmo painel; o merge conjunto deve preservar permissões do backend, onboarding canônico e Product Evidence. A integração visual/autenticada combinada ainda não foi comprovada. Não houve merge destas PRs em main, bypass de proteção ou deploy de produção por esta execução.

O núcleo clínico limita a leitura a 500 eventos, explicita truncamento e não extrai universalmente documentos. Revisão profissional durável em todos os caminhos de publicação, registro completo de protocolos e comparabilidade clínica de medidas continuam pendentes.

O restore sintético não prova backup válido de produção, D1 Time Travel, recuperação de chaves clínicas ou RPO/RTO operacionais. Manifesto confiável e custódia da chave de verificação também exigem processo operacional.

O inventário de tenant e auditoria não é exaustivo. Um lookup de exceção por `supersedes_event_id` sem predicado tenant explícito permanece objeto de revisão de defesa em profundidade; verificações anteriores existem e não foi demonstrado vazamento. Presença de endpoints LGPD não equivale a conformidade legal.

As evidências comerciais globais e de segurança ainda não alimentam integralmente o painel. Os workflows novos não se tornam automaticamente gates obrigatórios de todos os caminhos de deploy. O arquivo `KNOWN_LIMITATIONS.md` permanece obrigatório e atualizado.

## 6. Impacto econômico técnico

**Autonomous SaaS:** cria meios para reduzir intervenção manual, localizar abandono no onboarding e manter controle de acesso comercial. A redução de custo, conversão e receita precisam ser medidas em operação real.

**Clinical Intelligence:** organiza dados longitudinais rastreáveis e suas lacunas, criando diferenciação potencial e uma base para continuidade de uso. Não comprova eficácia clínica, retenção ou resultados econômicos realizados.

**Enterprise Trust:** torna verificáveis parte das decisões de segurança, integridade e limitações, reduzindo dependência de declarações do criador em uma auditoria. Não equivale a certificação nem permite quantificar redução de risco sem validação operacional.

Não foi estimado valuation, MRR, ARPA, churn ou receita. Código e testes não foram tratados como clientes pagantes.

## 7. Próximo maior multiplicador

**Um piloto operacional ponta a ponta com uma clínica independente, após resolver os gates e reconciliar as três PRs.** O investimento deve comprovar, com intervenção técnica contabilizada, onboarding autônomo, cobrança confirmada, atendimento longitudinal revisado, exportação completa e recuperação controlada. Essa única prova converte componentes implementados em evidência de operação, transferência e monetização do ativo.

---

**Decisão:** entrega parcial preservada no repositório; release não autorizado. Os três critérios integrais de sucesso ainda não foram atingidos.
