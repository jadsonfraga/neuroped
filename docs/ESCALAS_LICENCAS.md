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

## SWYC — escalas adicionadas (verificadas em 15/10/2026)
AIMS: já existe no catálogo (`aims-efeitos`, mergeado no #1145); a versão duplicada deste PR foi descartada.
| Escala | ids | Fonte oficial | Situação de uso |
|---|---|---|---|
| SWYC Marcos do Desenvolvimento (12 formulários: 2, 4, 6, 9, 12, 15, 18, 24, 30, 36, 48, 60 m) | `swyc-marcos-<n>m` | Tufts Medical Center, theSWYC.org; Manual v1.01 (2016); formulários em português v2 (23/05/2016); cortes: planilha oficial "Form Selector and Milestones Calculator" | `free_clinical_use`: © Tufts, uso gratuito sem permissão adicional; o Manual admite versões eletrônicas **sem custo ao usuário final**, atualizadas e com versão visível. **Não é licença aberta (CC/MIT)**; modificar exige permissão dos autores. Texto sem alteração (só ajustes tipográficos). |
| SWYC BPSC (1–17 m) | `swyc-bpsc` | idem; formulário em português v1.07 (01/04/2017) | idem. Corte oficial: ≥3 em qualquer subescala. |
| SWYC PPSC (18–65 m) | `swyc-ppsc` | idem | idem. Corte oficial: total ≥9. |

Observações de honestidade clínica:
- Os formulários SWYC em português são adaptação transcultural publicada (Moreira et al., 2019); o Manual declara que traduções não foram validadas de forma independente — as 14 escalas constam como **sem validação psicométrica** (catraca `catalogRunnablePendingPsychometricValidationMax` 111→125).
- SWYC Marcos: o ponto de corte depende da idade em meses; o app não pede a idade, mostra os cortes oficiais da faixa e **não classifica automaticamente**. Os formulários de 2 e 60 meses não têm corte (Manual).
- BPSC: os nomes das subescalas seguem os três fatores do Manual; o agrupamento usa os blocos de 4 itens da ordem do formulário. As 2 perguntas de "Preocupações dos pais" (não pontuadas) não foram incluídas.
- Pendente de ação do responsável (não solicitada por este projeto): a nota do Manual pede que quem cria versão eletrônica informe os autores; é um pedido, não uma condição de licença.

## Não implementadas (sem fonte aberta verificável em português ou exigem recurso inexistente)
POSI (exige múltipla escolha/opções por item), PHQ-9/GAD-7 cuidador (sem cópia PT-BR livre recuperável), SWAN, PedMIDAS-BR, AEP/LAEP, QOLCE-55, PUTS, P-YMRS/YMRS, PGBI-10M, PQ-B, DCDQ ("no charge" sem permissão de reprodução), Simpson-Angus (sem texto PT oficial encontrado).
