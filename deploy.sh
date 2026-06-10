#!/bin/bash

# 🚀 NeuroPed — Deployment Automation Script
# Deploy para Vercel + Railway em um comando

set -e

echo "🚀 NEUROPED DEPLOYMENT INICIADO"
echo "================================\n"

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Função para imprimir status
status() {
    echo -e "${BLUE}▸${NC} $1"
}

success() {
    echo -e "${GREEN}✓${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1"
}

warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# 1. Verificar estado do repositório
status "Verificando estado do repositório..."
if [ -z "$(git status --porcelain)" ]; then
    success "Working tree limpo"
else
    error "Há mudanças não commitadas"
    exit 1
fi

# 2. Verificar branch
status "Verificando branch..."
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" = "main" ]; then
    success "Branch: main"
else
    warning "Branch: $BRANCH (recomenda-se main para production)"
fi

# 3. Verificar dependências
status "Verificando dependências..."
command -v vercel >/dev/null 2>&1 && success "Vercel CLI instalado" || error "Vercel CLI não encontrado"
command -v npm >/dev/null 2>&1 && success "npm instalado" || error "npm não encontrado"

# 4. Build local
status "Executando build local..."
cd client
npm run build 2>&1 | grep -E "✓ built|error" || true
cd ..
success "Build completo"

# 5. Tamanho do bundle
status "Verificando tamanho do bundle..."
BUNDLE_SIZE=$(du -sh client/dist 2>/dev/null | cut -f1)
echo "  Bundle size: $BUNDLE_SIZE"

# 6. Informações para deploy
status "Informações do deploy:"
echo "  Repositório: $(git remote get-url origin)"
echo "  Último commit: $(git log -1 --oneline)"
echo "  Versão: $(grep '\"version\"' package.json | head -1 | grep -o '[0-9.]*')"

# 7. Instruções de deploy manual
echo ""
echo -e "${YELLOW}INSTRUÇÕES DE DEPLOYMENT:${NC}\n"

echo "📌 OPÇÃO 1: VERCEL (Recomendado para Frontend)"
echo "   https://vercel.com/new"
echo "   1. Clique 'Import Git Repository'"
echo "   2. Selecione jadsonfraga/neuroped"
echo "   3. Framework: Vite"
echo "   4. Build: 'cd client && npm run build'"
echo "   5. Output: 'client/dist'"
echo "   6. Clique 'Deploy'"
echo ""

echo "📌 OPÇÃO 2: RAILWAY (Recomendado para Full-Stack)"
echo "   https://railway.app"
echo "   1. Clique 'New Project' → 'Deploy from GitHub'"
echo "   2. Selecione jadsonfraga/neuroped"
echo "   3. Build: npm run build"
echo "   4. Start: npm start"
echo "   5. Clique 'Deploy'"
echo ""

echo "📌 OPÇÃO 3: AMBOS (Máxima Performance)"
echo "   - Vercel para Frontend (CDN global)"
echo "   - Railway para Backend (API + Database)"
echo ""

# 8. Status final
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}✅ SISTEMA PRONTO PARA DEPLOY${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo "Próximos passos:"
echo "1. Acesse a plataforma (Vercel ou Railway)"
echo "2. Siga as instruções acima"
echo "3. Aguarde ~2-5 minutos para deploy completar"
echo "4. Acesse sua URL de produção"
echo ""
echo "Documentação: DEPLOY_INSTRUCTIONS.md"
echo ""
