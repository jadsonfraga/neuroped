# Consolidação da caça espiral de falhas — NeuroPed

## Escopo congelado

Esta rodada não criou funcionalidades novas. Foram analisados e corrigidos somente falhas, inconsistências, defeitos, bypasses de segurança, contratos desatualizados, problemas de acessibilidade e falhas de validação encontrados no estado existente do aplicativo.

A investigação foi executada em ciclos sucessivos, cobrindo mais de 12 verificações independentes. O foco foi o caminho já existente de autenticação, Agenda, Secretaria, Memória Clínica, Prontuário, integrações, avaliações, acessibilidade, bundles e persistência.

## Defeito crítico encontrado e corrigido

Foi encontrado um bypass real em `client/src/App.tsx`: a rota `/marcacao` possuía um retorno antecipado fora do `RouteGuard`. Isso fazia com que a Secretaria IA pudesse montar antes da validação de sessão, apesar de a rota já ter sido retirada da allowlist pública.

A correção removeu o retorno antecipado e deixou a rota passar pelo bloco protegido com os papéis `admin`, `professional` e `operator`. O contrato de regressão agora também falha se `/marcacao` voltar a aparecer em qualquer comparação de `location` fora do guard.

A proteção foi conferida nos quatro pontos relevantes: roteador React, middleware de Pages Functions, adaptador Express e allowlist público-clínica.

## Defeitos menores encontrados e corrigidos

| Área | Falha | Correção |
|---|---|---|
| Acessibilidade | Dois `select` da Nova avaliação cognitiva não tinham nome acessível detectável pelo auditor estático. | Inclusão de `aria-label` para `Etapa escolar` e `Quem acompanha a resposta`. |
| Contrato público-clínico | O validador ainda classificava `/agendar` e `/marcacao` como rotas familiares públicas. | Ambas passaram para a lista de rotas sensíveis; a allowlist pública ficou coerente. |
| Auditoria de acesso | O auditor ainda exigia `/marcacao` como rota pública e produzia falso erro depois do bloqueio solicitado. | A lista de rotas públicas do auditor foi alinhada à política de autenticação. |
| Adaptador Express | `/api/public-booking` não tinha `requireAuth` no adaptador Node, embora a camada Cloudflare já estivesse protegida. | `requireAuth` foi aplicado a GET e POST no adaptador Express, fechando o caminho alternativo. |
| Contrato de Secretaria | O teste não impedia o retorno antecipado da página fora do `RouteGuard`. | Foi adicionada uma asserção explícita contra o bypass. |
| Auditoria visual | O auditor dependia de um Chromium instalado pelo Playwright, embora o ambiente já tivesse `/usr/bin/chromium`. | O auditor agora usa automaticamente o Chromium do sistema quando não há caminho configurado. |
| Ambiente de testes | `better-sqlite3` não tinha binding nativo porque as dependências haviam sido instaladas sem scripts. | As ferramentas de compilação foram instaladas e o binding foi recompilado; os testes reais de pacientes passaram. |

## Bateria executada

Foram executados 25 grupos de validação, distribuídos em ciclos espirais:

| Ciclo | Cobertura | Resultado |
|---:|---|---|
| 1 | Lint | Aprovado |
| 2 | TypeScript/check | Aprovado |
| 3 | Build do cliente | Aprovado |
| 4 | Bootstrap de autenticação | Aprovado |
| 5 | Middleware Cloudflare | Aprovado |
| 6 | Política de RouteGuard/RBAC | Aprovado |
| 7 | Segurança de pacientes | Aprovado após recompilar binding nativo |
| 8 | Ownership por usuário | Aprovado |
| 9 | Clinical Core | 356 casos e 93.276 assertivas aprovadas |
| 10 | Ciclo de vida da Agenda | Aprovado |
| 11 | Contratos operacionais | Aprovado |
| 12 | Memória da clínica em nuvem | Aprovado |
| 13 | Escrita clínica falsa | Aprovado |
| 14 | Funcionalidades incompletas/loose ends | Aprovado |
| 15 | Inventário diário | Aprovado |
| 16 | Notas | Aprovado |
| 17 | Auditoria de dados | Aprovado |
| 18 | Offline shell | Aprovado |
| 19 | Acessibilidade estática | 0 violações serious/critical e 0 violações totais |
| 20 | Design | Aprovado |
| 21 | Cores | Aprovado |
| 22 | Assets | Aprovado |
| 23 | Bundle e PIN compilado | Aprovado |
| 24 | Integrações, UX master e avaliações cognitivas | Aprovado |
| 25 | Bateria final após correções | Aprovado |

Os contratos finais aprovados incluem `test:operations`, `test:agenda-lifecycle`, `test:live-clinic-memory`, `test:patient-safety`, `test:ownership`, `test:clinical`, `audit:access`, `validate:public`, `audit:navigation`, `audit:a11y`, lint, check, build e diff check.

## Estado consolidado de segurança

O contrato público-clínico confirma **28 rotas públicas exatas** e **29 rotas sensíveis atrás dos gates**. A Agenda, Marcação, Prontuário, Recepção e Memória Clínica não são liberados pela allowlist pública. A Secretaria pode acessar as superfícies permitidas somente com sessão autenticada e papel compatível.

O agendamento continua com duração padrão de uma hora, horário comercial, edição, cancelamento, locks e conflitos persistentes. O bloqueio de público externo foi aplicado tanto no frontend como nas APIs Cloudflare e Express.

## Estado consolidado de persistência

A memória compartilhada da clínica e da secretaria segue protegida por tenant, criptografia, idempotência, revisão otimista e auditoria. Ownership do paciente e Clinical Core continuam aprovados. Os testes não indicaram regressão na separação entre memória operacional da secretaria e conteúdo clínico.

## Limitação residual de validação

A auditoria visual completa percorreu 300 rotas com o Chromium do sistema. Ela não encontrou exceções React ou `console.error`, mas marcou algumas telas como vazias quando executada no servidor estático sem backend e sem sessão. Esse é um limite do harness: rotas públicas que dependem do bootstrap de autenticação/API podem ficar aguardando ou não montar quando o servidor de captura devolve `503 /api/*`. Não foi mascarado como aprovação de produto.

Também não foi possível comprovar nesta sessão uma criação, edição e cancelamento contra um D1 de produção com contas reais. O código e os contratos passaram; a confirmação final em staging deve usar dados anonimizados e verificar reload, concorrência entre duas contas e isolamento de clínica.

## Publicação

As correções desta rodada foram registradas no commit rebased `eac2ea9c` do branch `feat/premium-product-architecture` e publicadas no GitHub. Arquivos antigos de auditoria, capturas executivas e documentos não relacionados permaneceram fora do commit.

## Conclusão

Após os ciclos espirais, não restou falha de código conhecida dentro do escopo auditado que justificasse outra alteração imediata sem acesso a um ambiente de staging autenticado. O único trabalho restante é validação operacional contra infraestrutura real: D1, chaves criptográficas, conta de secretaria, conta profissional, concorrência e persistência após reload.

Isso não é apresentado como prova de produção pronta; é a distinção entre o que foi corrigido e validado no repositório e o que exige uma execução real com credenciais e dados anonimizados.
