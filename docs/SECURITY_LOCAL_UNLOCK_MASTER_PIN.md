# NeuroPed - bloqueio local / PIN master

Status: desativado em 2026-06-13.

O NeuroPed nao deve usar PIN master, hash de PIN no frontend ou bloqueio local como controle de acesso clinico.

## Regra operacional

- Rotas publicas continuam abertas.
- Areas clinicas com dados reais exigem autenticacao nominal no backend oficial.
- Modo local/offline, quando existir, e apenas demonstrativo e nao deve receber dados reais identificaveis.
- Nenhum segredo, PIN, hash de PIN, JWT secret ou chave mestra deve ser enviado ao bundle frontend.

## Historico

Qualquer hash de PIN anteriormente versionado deve ser tratado como comprometido. A correcao atual removeu o fluxo de PIN do codigo ativo, mas o historico Git ainda precisa ser reescrito antes de distribuir ou tornar o repositorio confiavel.
