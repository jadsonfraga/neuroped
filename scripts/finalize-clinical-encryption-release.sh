#!/usr/bin/env bash
set -euo pipefail

: "${CLOUDFLARE_API_TOKEN:?CLOUDFLARE_API_TOKEN ausente}"
: "${CLOUDFLARE_ACCOUNT_ID:?CLOUDFLARE_ACCOUNT_ID ausente}"
: "${D1_DATABASE_ID:?D1_DATABASE_ID ausente}"

PROJECT="neuroped"
DB_NAME="neuroped-db"

secret_present() {
  local name="$1"
  grep -Eq "(^|[^A-Za-z0-9_])${name}([^A-Za-z0-9_]|$)" /tmp/neuroped-pages-secrets-final.txt
}

put_secret() {
  local name="$1"
  local value="$2"
  printf '%s' "$value" | npx wrangler@4 pages secret put "$name" --project-name "$PROJECT" >/dev/null
  echo "Cloudflare Pages secret ${name}: atualizado."
}

delete_secret_if_present() {
  local name="$1"
  npx wrangler@4 pages secret list --project-name "$PROJECT" > /tmp/neuroped-pages-secrets-final.txt
  if secret_present "$name"; then
    printf 'y\n' | npx wrangler@4 pages secret delete "$name" --project-name "$PROJECT" >/dev/null
    npx wrangler@4 pages secret list --project-name "$PROJECT" > /tmp/neuroped-pages-secrets-final.txt
    if secret_present "$name"; then
      echo "::error::Secret aposentado ${name} continuou presente no Pages."
      exit 1
    fi
    echo "Secret aposentado ${name}: removido do Cloudflare Pages."
  else
    echo "Secret aposentado ${name}: já ausente no Cloudflare Pages."
  fi
}

if [ "${CLINICAL_MIGRATION_REQUIRED:-false}" = "true" ]; then
  : "${CLINICAL_DATA_KEY:?CLINICAL_DATA_KEY ausente no passo de migração}"
  : "${OPERATIONAL_DATA_KEY:?OPERATIONAL_DATA_KEY ausente no passo de migração}"
  : "${LEGACY_OPERATIONAL_DATA_KEY:?LEGACY_OPERATIONAL_DATA_KEY ausente no passo de migração}"
  : "${CLINICAL_BACKUP_SHA256:?CLINICAL_BACKUP_SHA256 ausente}"

  for secret in "$CLINICAL_DATA_KEY" "$OPERATIONAL_DATA_KEY" "$LEGACY_OPERATIONAL_DATA_KEY"; do
    echo "::add-mask::$secret"
  done

  echo "Migrando registros clínicos e rotacionando a chave operacional..."
  CLINICAL_DATA_KEY="$CLINICAL_DATA_KEY" \
  OPERATIONAL_DATA_KEY="$OPERATIONAL_DATA_KEY" \
  LEGACY_OPERATIONAL_DATA_KEY="$LEGACY_OPERATIONAL_DATA_KEY" \
    node --import tsx scripts/migrate-d1-clinical-encryption.mts apply

  # O backup foi descriptografado e restaurado com integrity_check=ok antes da
  # migração. Registra somente hash/evidência temporal, nunca material secreto.
  npx wrangler@4 d1 execute "$DB_NAME" --remote --yes --command \
    "UPDATE clinical_encryption_state SET backup_sha256='${CLINICAL_BACKUP_SHA256}', rollback_verified_at=CURRENT_TIMESTAMP WHERE id=1;"

  CLINICAL_DATA_KEY="$CLINICAL_DATA_KEY" \
    node --import tsx scripts/migrate-d1-clinical-encryption.mts verify

  put_secret CLINICAL_ENCRYPTION_STRICT "true"
  delete_secret_if_present OPERATIONAL_DATA_KEY_PREVIOUS
else
  echo "Migração clínica já estava concluída; preservando chaves existentes."
fi

# O endpoint ICP foi aposentado. Esses valores nunca mais devem permanecer no
# runtime do Pages, mesmo em uma instalação que já estivesse strict.
delete_secret_if_present CERT_P12_B64
delete_secret_if_present CERT_P12_PASSWORD

echo "Finalização de dados concluída. O workflow oficial deve republicar o mesmo SHA e validar produção."
