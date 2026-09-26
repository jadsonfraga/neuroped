# Gestão autônoma da clínica — 26 de setembro de 2026

Parte de #594. Base inspecionada: `5117f4434c7ae9428c5776ff19a44ea54f1cb747`.
Escopo: identidade/configuração institucional e autorização da gestão. Não
fecha S10 inteiro nem atesta o go-live comercial.

## Falhas reproduzidas

- Uma conta global `reader` ou `operator`, mesmo com membership ativa de
  owner/clinic_admin, recebia 403 antes do handler de gestão da clínica.
  O aceite de convite para conta existente preserva o papel global, portanto
  esse estado é alcançável sem adulterar a conta.
- A rota de configurações também barrava operator pelo papel global.
- O timbre era escrito fora do batch da clínica/auditoria. Triggers SQLite
  que recusam UPDATE da clínica ou INSERT da auditoria deixavam o timbre
  alterado apesar da falha. Uma falha no próprio timbre escapava do handler.

## Correção

- Gestão usa membership persistida do alvo real em path/body/query. Header
  não concede autoridade. A lista explícita de métodos/rotas inclui PATCH
  da clínica, POST/DELETE de membros e convites, POST de checkout e lifecycle.
  Rotas desconhecidas e escritas clínicas mantêm os guards globais existentes.
- Os handlers continuam repetindo suas permissões e gates de billing,
  entrega de convite, provedor, proteção do último owner e retenção. Lifecycle
  continua exclusivo do owner, inclusive quando suspenso. Admin de plataforma
  sem membership não recebe acesso. Erro na consulta de autorização falha 503.
- Cadastro, settings e auditoria passam pelo mesmo batch transacional. O
  UPDATE ancora clinic_id, status ativo e membership gestora no predicado
  final; os statements seguintes dependem de `changes() = 1`. Revogação
  concorrente anterior ao batch resulta em 403, sem escrita nem trilha falsa.
- A tela Configurações admite contas autenticadas dos quatro papéis globais;
  permissões de edição permanecem no backend e no contrato da clínica.
  Isso não altera o acesso ao prontuário nem promove papel global.
- A suíte self-service intercepta localmente o transporte de e-mail e verifica
  URL, método, destinatário sintético e credencial sintética. A revisão
  automática bloqueou a execução anterior por possível envio externo; a
  alternativa elimina a chamada de rede, sem remover o adapter de produção.

## Evidência

`tests/unit/tenant-management-authorization.test.ts`: middleware global,
sessões assinadas/revogáveis, handlers e todas as migrações SQLite reais.
Somente dados sintéticos. RED exit 1 contra a base; GREEN exit 0, 11 casos:

- gestor de cada papel global edita Alfa; Beta permanece idêntica;
- A→B, B→A, admin sem vínculo, assistente e ID inexistente negados;
- owner com papel global reader gerencia membro e revoga convite;
- billing suspenso ainda nega POST de membros e permite desligar/revogar;
- ausência de e-mail/provider retorna erro real, sem checkout/envio fictício;
- lifecycle conserva owner exclusivo e confirmação explícita;
- sessão revogada, membership removida e revogação entre leitura/escrita;
- falhas em cada uma das três escritas causam rollback integral;
- acesso à tela Configurações separado do acesso clínico.

Validações locais: `npm run check`, `npm run lint`, `npm run build:client`,
`npm run test:quick-wins`, `npm run test:saas-self-service`, isolamento LIVE,
hardening SaaS e lifecycle, todos exit 0. Os webhooks da jornada de teste usam
handler real e provedor interceptado: não são evidência de pagamento externo.

`tests/e2e/tenant-management.mjs` exercita a UI com fixture sintética em
390/1440 px, reader/operator, configurações acessíveis e prontuário negado.
Prova de backend é separada e não é substituída pela fixture. Chromium não
está disponível localmente; execução e capturas exigidas no CI da PR.

## Limites e próximo gargalo

- Papel clínico LIVE/legado e delegação da agenda ainda exigem a continuação
  de S10/OPS-03/OPS-04; esta entrega não amplia permissões nesses domínios.
- O censo do D1 legado, sandbox real de cobrança, recebimento real de e-mail,
  readiness criptográfica/storage e restauração comprovada continuam sendo
  gates próprios (#594, #926 e bloqueio de censo existente).
- Sem migração, exclusão, alteração de chave, preço ou dado clínico.
- Rollback por PR de revert. Preservar as configurações já persistidas;
  não desfazer permissões por UPDATE manual em contas globais.

## Refinamento da prova visual

A primeira execução remota em `043fb60` passou, mas a inspeção das capturas
mostrou a fixture de detalhe sem `canManage`: só provava abertura em leitura.
A fixture foi alinhada ao contrato real de detalhe e o E2E agora exige campo
habilitado, PATCH, confirmação e valor preservado após reload em 390/1440 px
para reader/operator com ownership sintético. Esse estado persiste só na memória
do servidor de teste; a prova D1 continua sendo o teste de handlers e SQL reais.
Não usar a primeira captura como prova de edição.

## Contrato de troca obrigatória de senha

O gate de CI ainda exigia a expressão anterior `passwordChangeFailure ?? roleFailure`.
O middleware atual retorna o erro de senha antes de consultar permissões. O contrato
foi atualizado para exigir esse retorno antecipado e o fallback de RBAC preservado.
Uma prova real adicional renomeia a tabela de memberships após marcar a conta como
pendente de troca: cadastro, membros, checkout e API clínica continuam respondendo
PASSWORD_CHANGE_REQUIRED (403), sem depender da autorização ou realizar mutações.
A assertiva antiga falhou antes da atualização; os 12 casos do handler passam.

A validação D1 passa a usar grupo de concorrência por ref: PRs diferentes não
cancelam a única vaga pendente umas das outras. Main mantém a serialização e o
job de migração continua inacessível a PRs. Achado observado no run 36269468745.
