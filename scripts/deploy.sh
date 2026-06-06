#!/bin/bash
# ============================================================
# NeuroPed — Script de Deploy Local
# Uso: bash scripts/deploy.sh
# ============================================================

set -e

echo ""
echo "🧠 NeuroPed — Deploy Script"
echo "============================================"
echo ""

# Verificar se o Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Instale em https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Node.js 20+ é necessário. Versão atual: $(node --version)"
    exit 1
fi

echo "✅ Node.js $(node --version) detectado"
echo ""

# Instalar dependências
echo "📦 Instalando dependências..."
npm ci
echo "✅ Dependências instaladas"
echo ""

# Build completo
echo "🏗️  Compilando projeto..."
NODE_ENV=production npm run build
echo ""
echo "✅ Build concluído!"
echo ""
echo "   → Frontend: dist/public/"
echo "   → Backend:  dist/index.cjs"
echo ""

# Verificar output
if [ -f "dist/public/index.html" ]; then
    ASSET_COUNT=$(ls dist/public/assets/*.js 2>/dev/null | wc -l)
    echo "📊 Estatísticas do build:"
    echo "   → index.html: $(du -sh dist/public/index.html | cut -f1)"
    echo "   → Chunks JS: $ASSET_COUNT arquivos"
else
    echo "⚠️  Aviso: dist/public/index.html não encontrado"
fi

echo ""
echo "============================================"
echo "🚀 PRÓXIMO PASSO — Deploy automático:"
echo "============================================"
echo ""
echo "  git add ."
echo "  git commit -m 'deploy: build $(date +%Y-%m-%d)'"
echo "  git push origin main"
echo ""
echo "  O GitHub Actions fará o deploy em ~2 minutos."
echo "  URL: https://jadsonfraga.github.io/neuroped/"
echo ""
echo "  Acompanhe em:"
echo "  https://github.com/jadsonfraga/neuroped/actions"
echo ""
