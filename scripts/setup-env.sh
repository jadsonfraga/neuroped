#!/bin/bash
# ============================================================
# NeuroPed — Script de Configuração do Ambiente
# Uso: bash scripts/setup-env.sh
# ============================================================

echo ""
echo "🔐 NeuroPed — Configuração de Ambiente"
echo "============================================"
echo ""
echo "Este script gera o hash SHA-256 do seu PIN profissional"
echo "e cria o arquivo .env com as variáveis necessárias."
echo ""

# Verificar se .env já existe
if [ -f ".env" ]; then
    echo "⚠️  Arquivo .env já existe."
    read -p "   Deseja sobrescrever? (s/N): " OVERWRITE
    if [[ "$OVERWRITE" != "s" && "$OVERWRITE" != "S" ]]; then
        echo "   Operação cancelada."
        exit 0
    fi
fi

# Solicitar PIN
echo ""
read -s -p "Digite seu PIN profissional (mínimo 6 dígitos): " PIN
echo ""

if [ ${#PIN} -lt 6 ]; then
    echo "❌ PIN deve ter no mínimo 6 caracteres."
    exit 1
fi

# Gerar hash SHA-256
if command -v sha256sum &> /dev/null; then
    HASH=$(echo -n "$PIN" | sha256sum | cut -d' ' -f1)
elif command -v shasum &> /dev/null; then
    HASH=$(echo -n "$PIN" | shasum -a 256 | cut -d' ' -f1)
elif command -v node &> /dev/null; then
    HASH=$(node -e "process.stdout.write(require('crypto').createHash('sha256').update('$PIN').digest('hex'))")
else
    echo "❌ Não foi possível calcular o hash. Instale sha256sum, shasum ou Node.js."
    exit 1
fi

# Gerar JWT_SECRET aleatório
if command -v node &> /dev/null; then
    JWT_SECRET=$(node -e "process.stdout.write(require('crypto').randomBytes(64).toString('hex'))")
else
    JWT_SECRET=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 128 | head -n 1)
fi

# Criar .env
cat > .env << EOF
# NeuroPed — Variáveis de Ambiente
# Gerado em: $(date)
# IMPORTANTE: Nunca commite este arquivo no git!

# ── Autenticação ──────────────────────────────────
# Hash SHA-256 do PIN profissional
VITE_PIN_HASH=$HASH
PIN_HASH=$HASH

# Chave secreta para JWT (gerada aleatoriamente)
JWT_SECRET=$JWT_SECRET

# ── Banco de Dados ────────────────────────────────
# Descomente e configure conforme seu banco:
# DATABASE_URL=postgresql://user:password@host:5432/neuroped?sslmode=require

# ── Servidor ──────────────────────────────────────
NODE_ENV=development
PORT=5000

# ── Email (opcional) ──────────────────────────────
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=seu@email.com
# SMTP_PASS=sua_senha_app
EOF

echo ""
echo "✅ Arquivo .env criado com sucesso!"
echo ""
echo "============================================"
echo "📋 PRÓXIMOS PASSOS:"
echo "============================================"
echo ""
echo "1. Configure o GitHub Actions Secret:"
echo "   → https://github.com/jadsonfraga/neuroped/settings/secrets/actions"
echo "   → New repository secret"
echo "   → Name: VITE_PIN_HASH"
echo "   → Value: $HASH"
echo ""
echo "2. Configure o banco de dados no .env:"
echo "   → Edite .env e adicione DATABASE_URL"
echo ""
echo "3. Verifique que .env está no .gitignore:"
echo "   → grep .env .gitignore"
echo ""

# Verificar .gitignore
if ! grep -q "^\.env$" .gitignore 2>/dev/null; then
    echo "⚠️  AVISO: .env não está no .gitignore!"
    echo "   Execute: echo '.env' >> .gitignore"
    echo ""
fi
