# Checagem de dose por peso e idade (apoio)

Rota: `/checagem-dose` (perfis admin e profissional). **Apoio à leitura, nunca decisão ou prescrição.**

## Princípios
- Nenhuma faixa é inventada. Cada limite guarda o **trecho literal** da bula oficial, e `scripts/doses/verify-sources.mjs` reconfere esses trechos contra a fonte (openFDA/DailyMed).
- Dados separados do código: `client/src/data/doses/referencias-dose.json`. O médico revisa cada entrada e muda o `status` para `validado_medico` (com `validacao.por` e `validacao.em`) ou `rejeitado_medico` (a entrada deixa de ser usada).
- Estado padrão de toda entrada: `aguardando_validacao_medico` (selo visível na tela).
- Sem dado verificável (medicamento fora da base, idade/peso fora das populações da fonte): resultado **"Sem dado validado"**, sem estimativa.
- Os alertas só comparam com números da fonte e exibem a "faixa de referência" com o trecho; não dizem qual dose usar nem sugerem conduta. Aviso fixo de apoio sempre visível.
- Nada sai do aplicativo: cálculo local, sem IA externa.

## Funcionamento
Entrada: medicamento, dose por administração (mg), administrações/dia, peso (kg), idade. Calcula mg/dia e mg/kg/dia e compara com cada limite da entrada que cobre idade e peso:
`acima-do-limite-da-fonte` (máximo), `acima-da-dose-alvo-da-fonte`, `abaixo-da-dose-inicial-da-fonte` (informativo; pode ser titulação), `dentro-da-faixa-da-fonte` (com ressalva de que não confirma adequação).

## Base inicial (todas aguardando validação do médico)
| id | medicamento | fonte | setId | versão | vigência | consulta | status |
|---|---|---|---|---|---|---|---|
| `levetiracetam-focal-1m-a-6m` | levetiracetam | Keppra (levetiracetam) prescribing information | 3ca9df05-a506-4ec8-a4fe-320f1219ab21 | v36 | 2026-01-28 | 2026-10-16 | aguardando_validacao_medico |
| `levetiracetam-focal-6m-a-4a` | levetiracetam | Keppra (levetiracetam) prescribing information | 3ca9df05-a506-4ec8-a4fe-320f1219ab21 | v36 | 2026-01-28 | 2026-10-16 | aguardando_validacao_medico |
| `levetiracetam-focal-4a-a-16a` | levetiracetam | Keppra (levetiracetam) prescribing information | 3ca9df05-a506-4ec8-a4fe-320f1219ab21 | v36 | 2026-01-28 | 2026-10-16 | aguardando_validacao_medico |
| `atomoxetina-tdah-6a-menos70kg` | atomoxetina | Strattera (atomoxetine hydrochloride) prescribing information | 309de576-c318-404a-bc15-660c2b1876fb | v69 | 2026-06-30 | 2026-10-16 | aguardando_validacao_medico |
| `atomoxetina-tdah-6a-70kg-ou-mais` | atomoxetina | Strattera (atomoxetine hydrochloride) prescribing information | 309de576-c318-404a-bc15-660c2b1876fb | v69 | 2026-06-30 | 2026-10-16 | aguardando_validacao_medico |
| `carbamazepina-epilepsia-menor-6a` | carbamazepina | Tegretol (carbamazepine) prescribing information | 8d409411-aa9f-4f3a-a52c-fbcb0c3ec053 | v39 | 2026-08-20 | 2026-10-16 | aguardando_validacao_medico |
| `carbamazepina-epilepsia-6a-a-12a` | carbamazepina | Tegretol (carbamazepine) prescribing information | 8d409411-aa9f-4f3a-a52c-fbcb0c3ec053 | v39 | 2026-08-20 | 2026-10-16 | aguardando_validacao_medico |
| `carbamazepina-epilepsia-12a-a-15a` | carbamazepina | Tegretol (carbamazepine) prescribing information | 8d409411-aa9f-4f3a-a52c-fbcb0c3ec053 | v39 | 2026-08-20 | 2026-10-16 | aguardando_validacao_medico |
| `valproato-crises-parciais-complexas-10a-ou-mais` | valproato | Depakote Sprinkles (divalproex sodium) prescribing information | 4619aff4-0f80-444f-858d-42e4137aa809 | v1631 | 2026-03-31 | 2026-10-16 | aguardando_validacao_medico |

Fontes: bulas FDA (DailyMed SPL) via openFDA, seção "Dosage and Administration". Não são a bula ANVISA.

## Limitações
- Fonte é a bula americana; a bula nacional (ANVISA) pode diferir e deve ser conferida pelo médico.
- Não modela: função renal/hepática, CYP2D6 (atomoxetina), interações, formulação (liberação prolongada x imediata, tetos específicos), indicações diferentes da listada, titulação, uso off-label.
- Carbamazepina ≥ 15 anos ficou de fora (texto da bula ambíguo): "sem dado validado".
- A página `calculadora-dose` e `farmacologia.ts` existentes **não têm fonte** e não foram reaproveitadas.

## Como adicionar um medicamento
Incluir entrada no JSON com fonte completa e `trecho` literal para cada limite, `status: aguardando_validacao_medico`; rodar `npm run test:checagem-dose` e `npm run verify:doses-sources`.

## Testes
`npm run test:checagem-dose` (unitários, valores fictícios), `npm run test:e2e:checagem-dose` (Playwright, após `npm run build`).
