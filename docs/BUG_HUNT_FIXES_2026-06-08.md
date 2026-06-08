# NeuroPed — Correção de bugs pós-auditoria

## Corrigido

1. Relatório clínico:
   - frontend envia `to: EMAIL_TO`;
   - backend usa fallback profissional;
   - destino real agora bate com a interface.

2. Navegação:
   - `/efeitos-colaterais` removido do menu;
   - item passa a apontar para `/pre-retorno`;
   - rótulo ajustado para “Efeitos percebidos”.

3. Auditoria:
   - criado `audit:navigation`;
   - verify/deploy passam a barrar links de menu sem rota.

## Validação

- `npm run check`
- `npm run validate:catalog`
- `npm run audit:access`
- `npm run audit:identity`
- `npm run audit:navigation`
- `npm run audit:assets`
- `npm run test:clinical`
- `npm run build:client`
- `npm run verify`

## Rotas pós-deploy para checar

- `/` deve permanecer pública.
- `/filtro` deve permanecer pública.
- `/portal-familia` deve permanecer pública.
- `/qualidade` deve permanecer pública.
- `/pre-retorno` deve permanecer pública e exibir “Sintomas ou efeitos percebidos pela família”.
- `/pant`, `/pacientes`, `/prontuario` e `/farmacologia` devem continuar protegidas por PIN/autenticação profissional.
