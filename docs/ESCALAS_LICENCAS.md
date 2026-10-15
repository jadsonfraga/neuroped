# Escalas: registro de licença, duplicatas e lista de recusas

Fonte única: `client/src/data/scaleLicenseRegistry.ts` (validada por `npm run validate:licenses` e `npm run validate:canonical-duplicates`).

## Regras
1. O filtro (clínico e pré-consulta) só oferece escala que **abre por inteiro e funciona no app** (`implementationStatus = complete`). Fichas externas, não implementadas e só-metadados ficam fora do filtro; páginas e dados permanecem na biblioteca.
2. Um instrumento = um id canônico. Aliases (`world-*`) saem do filtro; a licença efetiva é a mais conservadora entre o registro e a entrada legada.
3. Escala nova só entra com fonte oficial verificada, URL, data, atribuição e uso em software permitido. Sem verificação, substitui-se por instrumento aberto e a substituição é documentada aqui.
4. Nenhum pedido de licença é feito por este projeto (decisão do responsável, 15/10/2026).
5. Sem ponto de corte inventado: só se cita corte da fonte (AGENTS.md · Verdade clínica).

## Licenciados mantidos no app por decisão do responsável (15/10/2026)
CBCL, Conners 3, BRIEF-2, CDI-2, ASQ-3, Denver II, PedsQL, CSHQ, ABC, CARS, M-CHAT-R/F, SDQ, SCARED, Vanderbilt, CRAFFT (e aliases). **Decisão de manutenção não é licença**: o registro marca `softwareAllowed: "unverified"` e `basis: "owner_decision"`; o app não os apresenta como "oficiais" ou "validados".

Reclassificados por fonte oficial (eram `restrita` por engano): PHQ-A (domínio público), SNAP-IV (uso livre).

## Lista de recusas (não reproduzir sem licença)
CBCL/ASEBA, Conners 3, BRIEF-2, SRS-2, ADOS-2, Vineland-3, WISC-V, CDI-2, Bayley, Perfil Sensorial, ABAS-3, GMFM/PEDI, CPT-3, ECBI, TSCYC, Zarit, CARS-2, ABC, PEDS, PROMIS pediátrico (sem acordo). Os itens que já existiam no app antes desta política seguem pela decisão acima.
