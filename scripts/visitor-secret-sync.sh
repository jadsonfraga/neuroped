#!/usr/bin/env bash
# Sincroniza NEUROPED_VISITOR_PASSWORD (GitHub Actions) com o Cloudflare Pages.
#
# O GitHub é a fonte da verdade do segredo do visitante:
#   - valor válido (>= 8 caracteres após trim, como visitorPassword() no
#     servidor): grava no Pages;
#   - valor ausente ou curto demais: REMOVE do Pages o valor já gravado. Sem
#     isso, apagar o segredo no GitHub deixaria a senha antiga aceitando login;
#   - remoção que não se confirma por listagem: falha o passo (fail-closed).
#
# Entrada: VISITOR_PW_VALUE. O valor nunca é impresso nem vai em argv.
# Ferramenta: WRANGLER (padrão "npx wrangler@4"); trocável em testes.
set -euo pipefail

KEY=NEUROPED_VISITOR_PASSWORD
PROJECT=neuroped
MIN_LENGTH=8
read -ra WRANGLER_CMD <<<"${WRANGLER:-npx wrangler@4}"

# Trim nas duas pontas, igual a visitorPassword() em functions/api/auth/_visitor.ts.
raw="${VISITOR_PW_VALUE:-}"
value="${raw#"${raw%%[![:space:]]*}"}"
value="${value%"${value##*[![:space:]]}"}"

secret_present() {
  local listing
  listing=$("${WRANGLER_CMD[@]}" pages secret list --project-name "$PROJECT") || {
    echo "::error::não foi possível listar os segredos do Pages; sem essa leitura a remoção de $KEY não pode ser confirmada"
    exit 1
  }
  grep -q -F "$KEY" <<<"$listing"
}

put_secret() {
  printf '%s' "$value" | "${WRANGLER_CMD[@]}" pages secret put "$KEY" --project-name "$PROJECT" >/dev/null || {
    echo "::error::falha ao gravar $KEY no Pages"
    exit 1
  }
  echo "secret $KEY: definido no Pages"
}

remove_secret() {
  if ! secret_present; then
    echo "secret $KEY: ausente no Pages, nada a remover"
    return 0
  fi
  "${WRANGLER_CMD[@]}" pages secret delete "$KEY" --project-name "$PROJECT" >/dev/null || {
    echo "::error::falha ao remover $KEY do Pages; a senha anterior pode continuar válida"
    exit 1
  }
  if secret_present; then
    echo "::error::$KEY continua no Pages após a remoção"
    exit 1
  fi
  echo "secret $KEY: removido do Pages (login de visitante desligado)"
}

if [ "${#value}" -ge "$MIN_LENGTH" ]; then
  put_secret
elif [ -n "$value" ]; then
  echo "::warning::$KEY tem menos de $MIN_LENGTH caracteres: o login de visitante fica desligado e o valor anterior é removido do Pages"
  remove_secret
else
  echo "$KEY ausente no GitHub: login de visitante desligado (docs/VISITOR_ACCESS.md)"
  remove_secret
fi
