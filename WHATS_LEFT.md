# O QUE AINDA FALTA — NeuroPed

> Reconciliação de produção: 10 de agosto de 2026.

## Estado comprovado nesta auditoria

O app possui rotas React registradas, filtro clínico com sinais/sintomas, modo de triagem efêmera sem cadastro, exportação PDF/CSV, escalas interativas, Clinical Core, Conecta, agenda/booking, recepção, documentos, autenticação remota, consentimento LGPD e deploy coordenado Cloudflare/Vercel. A suíte de release, auditoria completa de acessibilidade, E2E de escalas, auditoria de telas e build completo passaram antes desta reconciliação.

A partir desta revisão, endpoints clínicos nunca mais devolvem `201` fictício quando D1 está ausente: escritas falham com `503 DB_REQUIRED`, enquanto leitura demonstrativa continua explicitamente marcada como demo. A regra é coberta por teste runtime e estático dentro de `verify:release`.

## Pendências reais que permanecem

1. **Criptografia de dados clínicos reais em repouso (#514).** As tabelas clínicas atuais continuam deliberadamente demo-only. Não liberar persistência identificável de pacientes reais até concluir migração cifrada, backup/rollback e revisão LGPD.
2. **Revogação externa de credenciais históricas (#515).** O app removeu o mecanismo ICP aposentado e o purge de secrets Cloudflare já passou, mas revogação/rotação no emissor/provedor não pode ser provada apenas pelo repositório.
3. **Proveniência de conteúdo externo (#533).** Exige validação da fonte original fora do código; não deve ser "resolvida" por inferência.
4. **Peso clínico exato de sinais/sintomas (#438).** Sinais já participam do ranking, porém alterar peso para 50% muda decisão clínica do motor e permanece decisão médica explícita; não automatizar apenas para fechar issue antiga.

## Dívidas de produto não bloqueadoras

Propostas antigas exclusivamente estéticas ou de arquitetura visual devem ser tratadas como ideias opcionais, não como bugs de produção. O design atual é validado pelos gates de acessibilidade/design/telas e deve evoluir por mudanças pequenas com comparação visual e rollback.

## Catraca obrigatória

Antes de qualquer merge em `main`: `npm run verify:release`, `npm run audit:a11y:full`, `npm run test:e2e:scales`, `npm run audit:screens` e build completo. Depois do merge, Cloudflare e Vercel precisam publicar o mesmo SHA; qualquer divergência bloqueia a promoção.
