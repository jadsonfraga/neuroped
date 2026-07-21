#!/usr/bin/env bash

set -euo pipefail

printf '%s\n' \
  'ERRO: deploy-production.sh foi desativado por segurança.' \
  'A produção NeuroPed é publicada exclusivamente pelos workflows versionados:' \
  '  - .github/workflows/deploy-cloudflare.yml (canônico)' \
  '  - .github/workflows/deploy-vercel.yml (mirror público)' \
  '  - .github/workflows/deploy.yml (redirecionador GitHub Pages)' \
  'Consulte docs/DEPLOY_OFICIAL.md e publique somente por merge/push em main.' >&2

exit 1
