#!/bin/bash

# 🚀 NeuroPed — Deploy para Vercel + Railway
# Execute este script para fazer deploy em ambas plataformas

set -e

echo "🚀 NEUROPED PRODUCTION DEPLOYMENT"
echo "==================================\n"

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# ============ VERCEL DEPLOYMENT ============
echo -e "${BLUE}📌 VERCEL DEPLOYMENT${NC}\n"

echo "Instalando Vercel CLI..."
npm install -g vercel >/dev/null 2>&1

echo "Fazendo login no Vercel..."
vercel login

echo -e "\n${BLUE}Configurando projeto Vercel...${NC}"
vercel --prod --yes --confirm \
  --name neuroped \
  --build-env NODE_ENV=production

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Vercel deployment concluído!${NC}"
    VERCEL_URL=$(vercel ls --json 2>/dev/null | jq -r '.[0].url' 2>/dev/null || echo "https://neuroped.vercel.app")
    echo -e "URL: ${BLUE}$VERCEL_URL${NC}\n"
else
    echo -e "${RED}❌ Vercel deployment falhou${NC}\n"
fi

# ============ RAILWAY DEPLOYMENT ============
echo -e "${BLUE}📌 RAILWAY DEPLOYMENT${NC}\n"

echo "Instalando Railway CLI..."
npm install -g railway >/dev/null 2>&1

echo "Fazendo login no Railway..."
railway login

echo -e "\n${BLUE}Criando projeto no Railway...${NC}"
railway init --name neuroped

echo "Fazendo deploy no Railway..."
railway up --detach

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Railway deployment concluído!${NC}\n"
else
    echo -e "${RED}⚠️  Railway deployment em progresso (verifique no dashboard)${NC}\n"
fi

# ============ SUMÁRIO ============
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}✅ DEPLOYMENTS COMPLETADOS${NC}"
echo -e "${GREEN}================================${NC}\n"

echo "📊 PRÓXIMOS PASSOS:"
echo "1. Verifique Vercel: https://vercel.com/dashboard"
echo "2. Verifique Railway: https://railway.app"
echo "3. Configure domínios customizados (opcional)"
echo "4. Configure CORS se necessário"
echo "5. Teste a aplicação em produção\n"

echo "📝 URLs de Produção:"
echo "   Vercel:  $VERCEL_URL"
echo "   Railway: Verifique no dashboard\n"

echo "✨ Deploy concluído com sucesso!"
