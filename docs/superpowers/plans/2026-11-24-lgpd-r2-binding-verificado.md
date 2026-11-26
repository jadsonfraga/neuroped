# Preservar vínculo R2 do Pages sem ampliar acesso de CI

- Pré-condição externa: administrador da conta Cloudflare confirma ou cria o bucket privado `neuroped-lgpd-exports`, sem URL pública, e configura no projeto de produção `neuroped` o vínculo `LGPD_EXPORT_BUCKET`. Não alterar chaves clínicas nem dar acesso R2 de escrita à automação para este caminho.
- Em 401/403 da API do R2, a catraca pode reutilizar apenas o vínculo de produção exato, conforme resposta bem-sucedida da API oficial de metadados do Pages. Ausência continua explicitamente bloqueada; vínculo divergente ou metadados não confiáveis param a publicação em vez de sobrescrever algo.
- Manter o provisionamento idempotente existente para contas que o autorizam. Manter conferência de D1 e R2 após publicação e verificar presença/configuração na aplicação publicada. Nunca afirmar que um vínculo comprovou exportação real.
- Provar casos em testes locais da etapa de CI, sem chamada Cloudflare. Provar o executor canônico com D1 e R2 emulados pelo runtime local, registros 100% fictícios, readback e hash. Sem R2, HTTP 503 antes de efetuar a operação.
- Após autorização de produção: validar a publicação exata, saúde, vínculo privado, leitura/gravação sintética autorizada e auditoria. Rollback da mudança de CI é só revertê-la; não excluir o bucket nem dados. Sem conta Cloudflare habilitada, manter o bloqueio.
