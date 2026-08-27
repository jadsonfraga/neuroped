# Validação da Central SaaS

A rota `#/saas` foi aberta no servidor local com acesso aberto explicitamente habilitado para demonstração. O DOM montou o shell completo do NeuroPed e confirmou 20 triggers de aba, numerados de 01 a 20: Workspace, Planos, Onboarding, Acessos, Marca branca, SLA, Continuidade, LGPD, Mensageria, Documentos, Lembretes, Intake, Rede, Escola-família, Tarefas, Analytics, Catálogo, Playbooks, FHIR/CSV e Developer API.

A central aparece dentro do shell existente, com busca de abas, resumo de módulos habilitados, estado persistido localmente para preferências de demonstração, cards de métricas, controles específicos por módulo e fronteira de escopo na parte inferior. O aviso educativo existente continua sendo exibido no primeiro acesso e foi preservado.

O build, `npm run check`, `audit:navigation`, `audit:inventory` e a auditoria integral de acessibilidade foram executados após a alteração. A auditoria integral passou com 55 rotas e zero violações axe em todas as severidades. O inventário passou a registrar 151 rotas, 56 itens navegáveis e 155 páginas TSX.

## Validação visual do hardening SaaS

Data: 2026-08-27.

A Central NeuroPed OS carregou no navegador local em `#/saas` sem tela branca ou erro visual. O cabeçalho exibiu `20 áreas em abas`, `MVP seguro` e `Demo local`; a mensagem deixou explícito que, sem tenant ativo, preferências ficam restritas à demonstração local. O guardrail visível informa que toggles locais não concedem acesso a PHI e que produção exige membership, entitlement, keyring, auditoria, consentimento e evidência de restore.

A inspeção mostrou as 20 abas nomeadas e numeradas. O aviso educativo inicial foi fechado pelo DOM, sem executar operação administrativa.

Os formulários de Continuidade e LGPD foram implementados para depender de tenant autenticado: a continuidade exige provedor e digest SHA-256, enquanto a LGPD transforma a referência do titular em hash no servidor. No modo demo não há gravação de dados no backend nem dados clínicos identificáveis.

A inspeção visual abriu a aba Continuidade e confirmou os campos de frequência, retenção, provedor, SHA-256 do snapshot, RPO, RTO e status de restore. O estado demo mostrou “Nenhuma evidência registrada para este tenant”, sem declarar restore simulado como sucesso. A tentativa de abrir LGPD pelo índice visual não alterou a aba, então a revisão de conteúdo da LGPD permanece coberta pelo smoke E2E e pelo código estático; nenhum erro de runtime foi observado.

A aba Continuidade foi validada visualmente com campos de provedor, SHA-256, RPO/RTO e status de evidência. A aba permaneceu em estado seguro de demo, exibindo que não há evidência registrada para o tenant. A inspeção não utilizou dados reais nem executou mutações administrativas. A navegação de LGPD foi confirmada pelo seletor Radix, embora a captura tenha permanecido visualmente na aba anterior; o contrato de renderização e a integração server-side permanecem cobertos pelos testes de TypeScript, lint, E2E e hardening estático.
