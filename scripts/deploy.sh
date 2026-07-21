#!/usr/bin/env bash

# NEUROPED_LEGACY_DEPLOY_DISABLED
set -euo pipefail

printf '%s\n' \
  'ERRO: helper legado desativado por segurança.' \
  'Use exclusivamente os workflows versionados após PR aprovado e merge em main.' \
  'Consulte docs/DEPLOY_OFICIAL.md.' >&2

exit 1
