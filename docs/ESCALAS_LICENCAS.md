# Escalas: registro de licença, duplicatas e lista de recusas

Fonte única: `client/src/data/scaleLicenseRegistry.ts` (validada por `npm run validate:licenses` e `npm run validate:canonical-duplicates`).

## Regras
1. O filtro (clínico e pré-consulta) só oferece escala que **abre por inteiro e funciona no app** (`implementationStatus = complete`). Fichas externas, não implementadas e só-metadados ficam fora do filtro; páginas e dados permanecem na biblioteca.
2. Um instrumento = um id canônico. Aliases (`world-*`) saem do filtro; a licença efetiva é a mais conservadora entre o registro e a entrada legada.
3. Escala nova só entra com fonte oficial verificada, URL, data, atribuição e uso em software permitido. Sem verificação, substitui-se por instrumento aberto e a substituição é documentada aqui.
4. Nenhum pedido de licença é feito por este projeto (decisão do responsável, 15/10/2026).
5. Sem ponto de corte inventado: só se cita corte da fonte (AGENTS.md · Verdade clínica).

## Licenciados retirados do app por decisão do responsável (17/10/2026)
Em 15/10/2026 o responsável manteve no app CBCL, Conners 3, BRIEF-2, CDI-2, ASQ-3, Denver II, PedsQL, CSHQ, ABC, CARS, M-CHAT-R/F, SDQ, SCARED, Vanderbilt e CRAFFT. Em 17/10/2026 **retirou todos**: as páginas e os itens saíram, o original virou ficha de referência (`external_only`, fora do filtro) com link para a alternativa no app, a rota antiga redireciona e o registro marca `softwareAllowed: false` com `basis: "owner_decision"`. `OWNER_RETAINED_LICENSED_IDS` ficou vazia.

| Original retirado | Alternativa no app |
|---|---|
| CBCL / TRF (ASEBA) | Perfil emocional e comportamental (pais, professor e adolescente) — autoral |
| Conners 3 (MHS) | Atenção, atividade e autocontrole (pais e professor) — autoral |
| CDI-2 (MHS) | Como eu me sinto (criança) e Humor depressivo (adolescente) — autoral |
| BRIEF-2 (PAR) | Funções executivas — versão ampliada (pais) e na escola (professor) — autoral |
| CARS-2 (WPS) | Observação clínica de sinais do espectro autista — autoral |
| ASQ-3 (Brookes) e Denver II | SWYC Marcos do desenvolvimento, formulário da idade (livre, Tufts) |
| PedsQL (Mapi) | Qualidade de vida (pais) e (criança e adolescente) — autoral |
| CSHQ | Sono da criança (pais) — autoral |
| ABC (Slosson) | Comportamentos que preocupam em TEA e deficiência intelectual — autoral |
| M-CHAT-R/F | Sinais precoces do espectro autista (pais) e Interação social precoce (pais) — autorais |
| SDQ (Youth in Mind) | Perfil emocional e comportamental (pais, professor e adolescente) — autoral; SWYC PPSC no pré-escolar |
| SCARED | Ansiedade (criança e adolescente) e Seguimento de ansiedade (pais) — autorais |
| Vanderbilt (AAP/NICHQ) | Atenção, atividade e autocontrole (pais e professor) — autoral |
| CRAFFT | Uso de substâncias (adolescente) — autoral |
| Vineland-3 (Pearson; já era ficha) | Comportamento adaptativo (pais) — autoral |

Envio remoto às famílias: o M-CHAT-R saiu da lista de questionários enviáveis; link pendente recebe aviso de retirada (410) e respostas já enviadas seguem legíveis por número do item (`RETIRED_REMOTE_SCALES`), sem o texto do instrumento. O `CHECK` do D1 (migração 0021) continua aceitando `mchat` por causa desse histórico. Os aliases `world-*` desses originais foram removidos.

Reclassificados por fonte oficial (eram `restrita` por engano): PHQ-A (domínio público), SNAP-IV (uso livre).

## Lista de recusas (não reproduzir sem licença)
CBCL/ASEBA, Conners 3, BRIEF-2, SRS-2, ADOS-2, Vineland-3, WISC-V, CDI-2, Bayley, Perfil Sensorial, ABAS-3, GMFM/PEDI, CPT-3, ECBI, TSCYC, Zarit, CARS-2, ABC, PEDS, PROMIS pediátrico, ASQ-3, Denver II, PedsQL, CSHQ, M-CHAT-R/F, SDQ, SCARED, Vanderbilt e CRAFFT (sem acordo). Os itens que existiam no app antes desta política foram retirados em 17/10/2026 (ver acima).

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


## Atualização (15/10/2026): lacunas cobertas por instrumentos AUTORAIS
SWAN, PUTS, P-YMRS/YMRS, Simpson-Angus, SCAS, PedMIDAS e PHQ-9/GAD-7 do cuidador já estão no catálogo executável (mergeados pelo responsável). As demais lacunas (AEP, QOLCE, PGBI, PQ-B, CES-DC, DCDQ, POSI, ICU, FMS, SDSC, RBS-R, S2BI e categorias) foram cobertas por **35 instrumentos autorais NeuroPed** — texto original, sem validação psicométrica, sem corte. Ver `docs/ESCALAS_AUTORAIS_NEUROPED.md`.
