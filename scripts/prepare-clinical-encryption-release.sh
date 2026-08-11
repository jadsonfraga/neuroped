#!/usr/bin/env bash
set -euo pipefail

: "${CLOUDFLARE_API_TOKEN:?CLOUDFLARE_API_TOKEN ausente}"
: "${CLOUDFLARE_ACCOUNT_ID:?CLOUDFLARE_ACCOUNT_ID ausente}"
: "${NEUROPED_JWT_SECRET:?NEUROPED_JWT_SECRET ausente}"
: "${GITHUB_ENV:?GITHUB_ENV ausente}"

PROJECT="neuroped"
DB_NAME="neuroped-db"
BACKUP_SQL="/tmp/neuroped-clinical-pre-migration.sql"
BACKUP_ENC="/tmp/neuroped-clinical-pre-migration.enc.json"
RESTORE_SQL="/tmp/neuroped-clinical-restore.sql"
RESTORE_DB="/tmp/neuroped-clinical-restore.db"

secret_present() {
  local name="$1"
  grep -Eq "(^|[^A-Za-z0-9_])${name}([^A-Za-z0-9_]|$)" /tmp/neuroped-pages-secrets.txt
}

put_secret() {
  local name="$1"
  local value="$2"
  printf '%s' "$value" | npx wrangler@4 pages secret put "$name" --project-name "$PROJECT" >/dev/null
  echo "Cloudflare Pages secret ${name}: definido."
}

npx wrangler@4 pages secret list --project-name "$PROJECT" > /tmp/neuroped-pages-secrets.txt
D1_DATABASE_ID="$(npx wrangler@4 d1 list --json | jq -r --arg name "$DB_NAME" '.[] | select(.name==$name) | (.uuid // .id)' | head -n1)"
if [ -z "$D1_DATABASE_ID" ] || [ "$D1_DATABASE_ID" = "null" ]; then
  echo "::error::Não foi possível resolver o ID do D1 ${DB_NAME}."
  exit 1
fi
printf 'D1_DATABASE_ID=%s\n' "$D1_DATABASE_ID" >> "$GITHUB_ENV"

echo "Consultando estado da criptografia clínica..."
state_table="$(npx wrangler@4 d1 execute "$DB_NAME" --remote --command "SELECT name FROM sqlite_master WHERE type='table' AND name='clinical_encryption_state';" 2>&1 || true)"
phase=""
if grep -q "clinical_encryption_state" <<<"$state_table"; then
  phase="$(npx wrangler@4 d1 execute "$DB_NAME" --remote --json --command "SELECT phase FROM clinical_encryption_state WHERE id=1 LIMIT 1;" 2>/dev/null | jq -r '.[0].results[0].phase // empty' || true)"
fi

if [ "$phase" = "strict" ]; then
  for required in CLINICAL_DATA_KEY CLINICAL_ENCRYPTION_STRICT OPERATIONAL_DATA_KEY; do
    if ! secret_present "$required"; then
      echo "::error::D1 está strict, mas o secret Cloudflare ${required} não existe. Falha fechada."
      exit 1
    fi
  done
  printf 'CLINICAL_MIGRATION_REQUIRED=false\n' >> "$GITHUB_ENV"
  echo "Criptografia clínica já está em strict; nenhuma chave precisa ser lida pelo runner."
  exit 0
fi

# Se existe uma chave não recuperável, mas o estado D1 não prova migração concluída,
# sobrescrevê-la poderia tornar dados irrecuperáveis. O workflow falha fechado.
for unexpected in CLINICAL_DATA_KEY OPERATIONAL_DATA_KEY; do
  if secret_present "$unexpected"; then
    echo "::error::${unexpected} já existe no Pages, mas clinical_encryption_state não está strict. Não é seguro sobrescrever uma chave desconhecida."
    exit 1
  fi
done

CLINICAL_DATA_KEY="$(openssl rand -hex 32)"
OPERATIONAL_DATA_KEY="$(openssl rand -hex 32)"
for secret in "$CLINICAL_DATA_KEY" "$OPERATIONAL_DATA_KEY" "$NEUROPED_JWT_SECRET"; do
  echo "::add-mask::$secret"
done

put_secret CLINICAL_DATA_KEY "$CLINICAL_DATA_KEY"
put_secret CLINICAL_ENCRYPTION_STRICT "false"
put_secret OPERATIONAL_DATA_KEY "$OPERATIONAL_DATA_KEY"
# A aplicação antiga cifrava a Operational Suite usando o JWT como fallback.
# A chave antiga fica explicitamente nomeada e temporária durante a rotação.
put_secret OPERATIONAL_DATA_KEY_PREVIOUS "$NEUROPED_JWT_SECRET"

printf 'CLINICAL_DATA_KEY=%s\n' "$CLINICAL_DATA_KEY" >> "$GITHUB_ENV"
printf 'OPERATIONAL_DATA_KEY=%s\n' "$OPERATIONAL_DATA_KEY" >> "$GITHUB_ENV"
printf 'LEGACY_OPERATIONAL_DATA_KEY=%s\n' "$NEUROPED_JWT_SECRET" >> "$GITHUB_ENV"
printf 'CLINICAL_MIGRATION_REQUIRED=true\n' >> "$GITHUB_ENV"

# Adiciona colunas/tabelas antes da primeira publicação dual-read.
CLINICAL_DATA_KEY="$CLINICAL_DATA_KEY" \
  node --import tsx scripts/migrate-d1-clinical-encryption.mts schema

rm -f "$BACKUP_SQL" "$BACKUP_ENC" "$RESTORE_SQL" "$RESTORE_DB"
echo "Exportando snapshot D1 pré-migração..."
npx wrangler@4 d1 export "$DB_NAME" --remote --output "$BACKUP_SQL"
test -s "$BACKUP_SQL"

MIGRATION_BACKUP_KEY_MATERIAL="$NEUROPED_JWT_SECRET" \
  node scripts/clinical-backup-crypto.mjs encrypt "$BACKUP_SQL" "$BACKUP_ENC" > /tmp/neuroped-backup-sha.txt
BACKUP_SHA256="$(tail -n1 /tmp/neuroped-backup-sha.txt | tr -d '\r\n')"
[[ "$BACKUP_SHA256" =~ ^[0-9a-f]{64}$ ]]
printf 'CLINICAL_BACKUP_SHA256=%s\n' "$BACKUP_SHA256" >> "$GITHUB_ENV"

# Plaintext não permanece como artefato nem atravessa passos do workflow.
rm -f "$BACKUP_SQL"

# Testa restauração em ambiente controlado antes de tocar nos registros remotos.
MIGRATION_BACKUP_KEY_MATERIAL="$NEUROPED_JWT_SECRET" \
  node scripts/clinical-backup-crypto.mjs decrypt "$BACKUP_ENC" "$RESTORE_SQL" > /tmp/neuroped-restore-sha.txt
RESTORE_SHA256="$(tail -n1 /tmp/neuroped-restore-sha.txt | tr -d '\r\n')"
[ "$RESTORE_SHA256" = "$BACKUP_SHA256" ]
sqlite3 "$RESTORE_DB" < "$RESTORE_SQL"
[ "$(sqlite3 "$RESTORE_DB" 'PRAGMA integrity_check;')" = "ok" ]
for table in patients_demo consultations_demo scale_results_demo documents_demo memory_notes; do
  sqlite3 "$RESTORE_DB" "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='${table}';" | grep -qx '1'
done
rm -f "$RESTORE_SQL" "$RESTORE_DB"

echo "Backup pré-migração cifrado e restauração controlada verificados: ${BACKUP_SHA256}."
