#!/usr/bin/env bash

set -euo pipefail

printf '%s\n' \
  'ERRO: deploy.sh foi desativado por segurança.' \
  'Não crie projetos nem publique manualmente em Vercel, Railway ou outro provedor.' \
  'Use exclusivamente os workflows versionados após merge aprovado em main.' \
  'Consulte docs/DEPLOY_OFICIAL.md.' >&2

exit 1
