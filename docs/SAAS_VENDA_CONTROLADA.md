# NeuroPed — liberação SaaS controlada (25/10/2026)

**Situação: NO-GO até comprovação externa e revisão humana.**

O repositório já contém login, clínicas isoladas, trial, checkout, webhook, prontuário LIVE, trilhas de auditoria e exportação. Implementação local/CI NÃO prova operação publicada, receita, conformidade jurídica ou emissão médica final.

## Alterações
- Admin go-live: prontidão clínica (CLINICAL_LIVE, cifragem e R2) separada da presença de configuração comercial. O campo legado pronto continua significando apenas presença de configuração.
- Cadastro: preço/trial vêm do domínio canônico, sem especialidade médica atribuída por padrão. Falha de salvamento do perfil é mostrada sem nova criação de clínica.
- Página de planos: não promete conformidade operacional homologada, assinatura automática nem assinatura médica sem aceite.
- Gate local de evidência: scripts/ops/saas-release-gate.ts. Verifica health publicado recente (até 1h), smoke cliente-zero recente (até 72h) com pagamento em PRODUÇÃO, todos os passos essenciais e documento sintético, e dez revisões documentadas.

## Execução do gate
Executar em máquina autorizada, com três arquivos JSON PRIVADOS:
- health: resposta real de GET /api/health no ambiente publicado.
- smoke: relatório do script scripts/ops/cliente-zero-published-smoke.ts executado no ambiente publicado.
- reviews: objeto com schemaVersion=1, target igual à origem HTTPS, e checkpoints com as chaves REQUIRED_REVIEWS exportadas pelo gate.

Cada checkpoint exige reviewer, reviewedAt (ISO, até 180 dias) e artifactSha256 (SHA-256 hexadecimal da evidência conservada em acervo privado). Um hash NÃO comprova o conteúdo: a revisão real continua obrigação humana.

Comando:

    node --import tsx scripts/ops/saas-release-gate.ts --origin https://neuroped.pages.dev --health /pasta-privada/health.json --smoke /pasta-privada/smoke.json --reviews /pasta-privada/reviews.json

Exit 2: NO_GO. Exit 0: READY_FOR_HUMAN_DECISION; **não abre signup, não cobra, não faz merge, não publica e não autoriza uso clínico**. Exit 1: argumento inválido. Logs não contêm dados clínicos, senhas, tokens ou evidências anexadas.

## Pendências humanas e externas
1. Chaves clínicas e bucket R2 privados, env efetiva, banco e exportação cifrada; validar por health e execução REAL.
2. Resend com e-mail REAL entregue, verificação de posse e convites.
3. Asaas em produção com pagamento real, webhook idempotente e entitlement efetivamente persistido; nunca inferir receita do redirect.
4. Revisão jurídica dos termos/privacidade, contratos com operadores, proteção de dados de crianças, plano de incidente e requisitos LGPD.
5. Análise regulatória por finalidade (incluindo software médico e IA). Não vender motor de diagnóstico autônomo.
6. Backup e restore com RPO/RTO medidos.
7. PANT: aceite médico real vinculado à versão/hash, assinatura somente autorizada, QA de todas as páginas.
8. Cadastro e jornada cliente-zero publicados concluídos por profissional externo.
9. Validar comercialmente 10 entrevistas, 3 pilotos PAGOS, segunda fatura, métricas de ativação e margem.
10. NeuroPed Evolution é hipótese de roadmap; não afirmar na vitrine como função já disponível.

## Validação
Rodar:
- node --import tsx tests/unit/saas-release-gate.test.ts
- node --import tsx tests/unit/go-live-readiness.test.ts
- node tests/unit/planos-page-contract.test.mjs
- npm run check
- npm run lint
- npm run test:saas-self-service

Preservar gates de isolamento multi-tenant, LGPD, aprovação clínica e review dos PRs antes de merge.
