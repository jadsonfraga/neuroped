# NeuroPed — Correção de navegação

Data: 2026-06-08

## Correção aplicada

O caminho `/efeitos-colaterais` foi registrado no `App.tsx` como alias público do fluxo de pré-retorno.

Motivo:

- havia item de navegação apontando para esse caminho;
- antes, o clique podia cair em rota inexistente;
- agora o caminho abre o mesmo componente de `/pre-retorno`.

## Auditoria criada

Foi criado o arquivo:

`scripts/guards/audit-navigation-routes.mjs`

Objetivo:

- comparar os links do menu com as rotas registradas no app;
- reprovar links sem rota.

## Pendência

A ligação do novo guard ao `package.json` e aos workflows foi bloqueada pelo conector nesta sessão. O script existe e deve ser integrado ao CI no ambiente local/Codex/Cursor.
