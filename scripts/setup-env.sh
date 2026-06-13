#!/bin/bash
set -euo pipefail

echo ""
echo "NeuroPed - Configuracao de Ambiente"
echo "==================================="
echo ""
echo "Este script cria um .env local sem PIN global de frontend."
echo "Areas clinicas com dados reais exigem login nominal no backend."
echo ""

if [ -f ".env" ]; then
    echo "Arquivo .env ja existe."
    read -p "Deseja sobrescrever? (s/N): " OVERWRITE
    if [[ "$OVERWRITE" != "s" && "$OVERWRITE" != "S" ]]; then
        echo "Operacao cancelada."
        exit 0
    fi
fi

if command -v node >/dev/null 2>&1; then
    MASTER_KEY=$(node -e "process.stdout.write(require('crypto').randomBytes(48).toString('base64'))")
    JWT_SECRET=$(node -e "process.stdout.write(require('crypto').randomBytes(64).toString('base64'))")
    ADMIN_PASSWORD=$(node -e "process.stdout.write(require('crypto').randomBytes(24).toString('base64url'))")
else
    MASTER_KEY=$(LC_ALL=C tr -dc 'A-Za-z0-9' </dev/urandom | head -c 64)
    JWT_SECRET=$(LC_ALL=C tr -dc 'A-Za-z0-9' </dev/urandom | head -c 96)
    ADMIN_PASSWORD=$(LC_ALL=C tr -dc 'A-Za-z0-9' </dev/urandom | head -c 32)
fi

cat > .env << EOF
# NeuroPed - Variaveis de Ambiente
# Gerado em: $(date)
# IMPORTANTE: Nunca commite este arquivo no git.

NODE_ENV=development
PORT=5000
HOST=0.0.0.0
DATABASE_PATH=./neuroped.db

NEUROPED_MASTER_KEY=$MASTER_KEY
NEUROPED_JWT_SECRET=$JWT_SECRET

ADMIN_EMAIL=admin@example.local
ADMIN_NAME=Administrador
ADMIN_INITIAL_PASSWORD=$ADMIN_PASSWORD

# Configure quando usar object storage real:
# STORAGE_PROVIDER=supabase
# STORAGE_ENDPOINT=
# STORAGE_REGION=auto
# STORAGE_BUCKET=neuroped-files
# STORAGE_ACCESS_KEY=
# STORAGE_SECRET_KEY=
EOF

echo ""
echo "Arquivo .env criado com sucesso."
echo ""
echo "Proximos passos:"
echo "1. Troque ADMIN_EMAIL/ADMIN_NAME antes do primeiro uso local."
echo "2. Faca login e altere a senha temporaria imediatamente."
echo "3. Remova ADMIN_INITIAL_PASSWORD depois do primeiro login."
echo "4. Configure segredos reais apenas nos provedores de deploy."
