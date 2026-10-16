# Ondas — sem regressão

Plano de 16/10/2026. Cada onda soma. Não encurta rota, escore, laudo nem auth já em produção.
Onda só fecha com teste que falha pelo motivo certo antes da mudança. Sem migração nesta onda.

## Onda 1 — medir o laço, sem decidir (esta entrega)

Contrato puro em `shared/laco-consulta.ts`.

- Casa e escola ficam separados. Falta um lado: diferença **não medida**. Ausência não é zero.
- Minutos até o laudo assinado só se os dois instantes foram informados e a assinatura não antecede o início. Sem relógio, sem estimativa.
- Agregado da clínica: contagens e mediana dos tempos medidos. Sem escore, sem nome, sem id.
- Não entra no painel, no resumo pré-consulta, no PDF nem na API. O painel continua declarando que laudo em um clique e resumo rodam no navegador e não deixam registro (`shared/outcomes.ts`).

Teste: `node --import tsx --test tests/unit/laco-consulta.test.ts` (também no fim de `npm run test:clinical`).

Rollback: apagar `shared/laco-consulta.ts`, `tests/unit/laco-consulta.test.ts`, este arquivo, e tirar o comando novo de `test:clinical`. Nenhum dado persistido.

## Fora desta onda

| Onda | Escopo | Por que não agora |
| --- | --- | --- |
| 2 | Gravar início e assinatura no servidor, sem PHI no agregado, e só então mostrar no painel | Exige migration forward-only e prova de que o número não é a estimativa de `estimateTimeSaved` |
| 3 | Licença de instrumento comercial (Conners, BRIEF-2, CBCL, CDI-2, CARS-2, Denver II): sem licença, não pontua | Mexer no catálogo agora regressa aplicação já no ar |
| 4 | LGPD export/eliminação idempotente e cripto clínica em produção | Bloqueio externo de chave e bucket; não marcar `completed` sem efeito físico |
| 5 | Segunda clínica pagante | Asaas e e-mail de produção seguem bloqueio externo |

Critério para abrir a onda 2: a onda 1 permanece verde e o dado de tempo continua distinto da estimativa do painel.
