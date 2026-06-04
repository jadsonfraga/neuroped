#!/usr/bin/env bash
# ============================================================
# NeuroPed EDJ — purge-history.sh
# ------------------------------------------------------------
# DESTRUTIVO. NÃO roda em CI. Use só com decisão consciente.
#
# Problema: o repositório é PÚBLICO (necessário para o GitHub Pages no plano
# grátis). Tornar privado DERRUBA o site público. Mas o HISTÓRICO do git ainda
# contém arquivos sensíveis já removidos do deploy (consulta, gerador de
# licenças, conteúdo pago) e segredos antigos (o PIN 'REMOVIDO', hashes).
# Qualquer um faz `git log`/`git show` e lê.
#
# Este script REESCREVE o histórico removendo esses arquivos e o texto do PIN
# antigo de TODOS os commits, usando git-filter-repo (https://github.com/newren/git-filter-repo).
#
# CONSEQUÊNCIAS (leia antes):
#   - Reescreve TODO o histórico → exige `git push --force` na main.
#   - Quebra clones/forks existentes e quaisquer branches/PRs abertos.
#   - O PIN antigo deve ser considerado COMPROMETIDO de qualquer forma —
#     troque-o no build privado (não confie só na purga).
#   - Faça um BACKUP do repositório antes (clone --mirror).
#
# Uso:
#   pip install git-filter-repo
#   bash scripts/purge-history.sh
#   # revise, então:  git push origin --force --all && git push origin --force --tags
# ============================================================
set -euo pipefail

command -v git-filter-repo >/dev/null 2>&1 || { echo "Instale: pip install git-filter-repo"; exit 1; }

echo "Backup espelhado em ../neuroped-backup.git ..."
git clone --mirror . ../neuroped-backup.git || true

# Arquivos sensíveis a apagar de TODO o histórico (mesma lista do strip-private).
PATHS=(
  consulta.html consulta-livre.html intake.html assinatura-digital.html
  consulta-pin-fix.js consulta-docflow.js consulta-documentos.js consulta-voz.js
  consulta-safe-exit.js consulta-next-redirect.js assinatura-digital.js
  secretaria.html agenda-financeiro.html
  gerar-licencas-pro.html ativar-passe-familiar.html politica-acesso-familiar.html
  family-pass.js family-pass-generator.js family-pass-portal.js family-voucher.js family-voucher-ui.js
  neuroped-master-protegido-data.js
  auditoria-ontologia.html auditoria-operacional.html
  qa-smoke-test.html teste-e2e-manual.html teste-ouro-pin.html
  scale-engine-demo.html clinical-trajetoria-demo.html ds-pilot.html
  verificar.html verificar-app.html cloud-status.html setup.html guia-lancamento.html
)
ARGS=(); for p in "${PATHS[@]}"; do ARGS+=(--path "$p"); done

# 1) Remove os arquivos sensíveis de todo o histórico.
git filter-repo --invert-paths "${ARGS[@]}" --force

# 2) Apaga o texto do PIN antigo e hashes que tenham vazado em qualquer arquivo.
cat > /tmp/np-secrets.txt <<'EOF'
REMOVIDO==>REMOVIDO
removido==>removido
REMOVIDO==>REMOVIDO
REMOVIDO==>REMOVIDO
EOF
git filter-repo --replace-text /tmp/np-secrets.txt --force

echo
echo "Histórico reescrito. Revise (git log) e então:"
echo "  git push origin --force --all && git push origin --force --tags"
echo "Lembre: troque o PIN no build privado — o antigo está comprometido."
