# HUMAN ACTION REQUIRED

## Ação única bloqueante (atualizada 02/10/2026): configurar criptografia clínica e bucket LGPD no Cloudflare

**Por quê:** produção (`neuroped.pages.dev`) roda com `CLINICAL_LIVE_ENABLED=true`, mas
`/api/health` reporta `clinicalCryptoConfigured: false` e
`blockers: ["CLINICAL_CRYPTO_NOT_READY", "LGPD_BUCKET_NOT_CONFIGURED"]`. O CI
`Clinical and LGPD production readiness audit` falha fechado pelo mesmo motivo (issue #926).
O código e os gates estão corretos; falta a configuração no provider. A credencial desta sessão
não tem acesso à conta Cloudflare (wrangler "not authenticated") e segredos de produção não
devem ser gerados/instalados por agente sem acesso provider.

### Ação única (owner da conta Cloudflare; ~15 min; dashboard ou wrangler)

1. Gerar dois segredos aleatórios ≥32 chars (ex.: `openssl rand -base64 48`):
   - `CLINICAL_DATA_KEY`
   - `CLINICAL_INDEX_KEY`
2. Criar bucket R2 privado (ex.: `neuroped-lgpd-export`) na conta do Pages.
3. No projeto Pages `neuroped` (Settings → Variables and Secrets / Bindings):
   - Secret: `CLINICAL_DATA_KEY` (encrypted);
   - Secret: `CLINICAL_INDEX_KEY` (encrypted);
   - Var: `CLINICAL_DATA_KEY_ID` = `k1`;
   - Binding R2 com nome **exatamente** `LGPD_EXPORT_BUCKET` → bucket criado.
4. Redeploy (ou re-run do workflow `deploy-cloudflare` no HEAD atual do main).

### Verificação (sem expor segredos)

```
curl -s https://neuroped.pages.dev/api/health
```

Esperado: `clinicalCryptoConfigured: true`, `storageBindingPresent: true`,
`lgpdExport.configured: true`, `blockers: []`.

### Notas

- Rotação futura: `CLINICAL_DATA_KEY_PREVIOUS` + `CLINICAL_DATA_KEY_PREVIOUS_ID` suportados
  por `functions/api/tenant/_crypto.ts`.
- Consumo: `functions/api/live/governance/_artifactStore.ts` (R2), `functions/api/health.ts`
  (diagnóstico público, sem segredos).
- Histórico: a ação anterior deste arquivo (proteger `main` via ruleset) foi concluída —
  `main.protected=true` verificado e push direto rejeitado em prova prática (02/10/2026);
  issue #584 fechada. Não remover esta seção sem evidência equivalente.
