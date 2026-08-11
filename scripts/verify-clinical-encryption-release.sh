#!/usr/bin/env bash
set -euo pipefail

: "${CLOUDFLARE_API_TOKEN:?CLOUDFLARE_API_TOKEN ausente}"
: "${CLOUDFLARE_ACCOUNT_ID:?CLOUDFLARE_ACCOUNT_ID ausente}"
: "${GITHUB_SHA:?GITHUB_SHA ausente}"

PROJECT="neuroped"

ok=0
for attempt in $(seq 1 18); do
  sleep 10
  if curl -fsSL "https://neuroped.pages.dev/deploy-check.json?final=${GITHUB_RUN_ID:-0}-${attempt}" \
       -o /tmp/clinical-final-deploy-check.json 2>/dev/null \
    && grep -q "$GITHUB_SHA" /tmp/clinical-final-deploy-check.json; then
    ok=1
    break
  fi
done
cat /tmp/clinical-final-deploy-check.json 2>/dev/null || true
[ "$ok" -eq 1 ] || { echo "::error::Apex não confirmou o mesmo SHA após finalização criptográfica."; exit 1; }

health_ok=0
for attempt in $(seq 1 18); do
  if curl -fsSL "https://neuroped.pages.dev/api/health?crypto=${GITHUB_RUN_ID:-0}-${attempt}" \
       -o /tmp/clinical-final-health.json 2>/dev/null \
    && jq -e '
      .database == "ok" and
      .authentication.required == true and
      .authentication.configured == true and
      .encryption.readyForIdentifiableClinicalData == true and
      .encryption.clinicalStrict == true and
      .encryption.clinicalPhase == "strict" and
      .encryption.operationalConfigured == true
    ' /tmp/clinical-final-health.json >/dev/null; then
    health_ok=1
    break
  fi
  sleep 10
done
cat /tmp/clinical-final-health.json 2>/dev/null || true
[ "$health_ok" -eq 1 ] || { echo "::error::Backend não atingiu prontidão criptográfica strict."; exit 1; }

cert_code="$(curl -sS -o /tmp/cert-retired.json -w '%{http_code}' https://neuroped.pages.dev/api/cert)"
[ "$cert_code" = "410" ] || { echo "::error::/api/cert deveria permanecer 410; recebeu ${cert_code}."; cat /tmp/cert-retired.json; exit 1; }
jq -e '.code == "CERT_ENDPOINT_RETIRED"' /tmp/cert-retired.json >/dev/null

npx wrangler@4 pages secret list --project-name "$PROJECT" > /tmp/neuroped-pages-secrets-verify.txt
for retired in OPERATIONAL_DATA_KEY_PREVIOUS CERT_P12_B64 CERT_P12_PASSWORD; do
  if grep -Eq "(^|[^A-Za-z0-9_])${retired}([^A-Za-z0-9_]|$)" /tmp/neuroped-pages-secrets-verify.txt; then
    echo "::error::Secret temporário/aposentado ainda presente: ${retired}"
    exit 1
  fi
done
for required in CLINICAL_DATA_KEY CLINICAL_ENCRYPTION_STRICT OPERATIONAL_DATA_KEY; do
  grep -Eq "(^|[^A-Za-z0-9_])${required}([^A-Za-z0-9_]|$)" /tmp/neuroped-pages-secrets-verify.txt || {
    echo "::error::Secret requerido ausente após migração: ${required}"
    exit 1
  }
done

echo "Criptografia clínica strict, chave operacional separada e endpoint ICP aposentado confirmados."
