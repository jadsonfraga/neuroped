# Receituários controlados físicos — C1, A1 e B1

Estado do fluxo no app: versão física, com numeração externa fornecida pela Vigilância Sanitária. O NeuroPed não cria, reserva, consome nem valida números SNCR neste fluxo.

## C1 — Receita de Controle Especial

A RCE física não recebe numeração SNCR. O campo opcional na aba C1 serve apenas para anotar uma referência física local, se a Visa a tiver atribuído especificamente para essa finalidade. O rótulo impresso a identifica como referência local, não como número SNCR.

## A1 e B1 — Notificações físicas

- Receita A1 usa o formulário físico Notificação de Receita A, com numeração física da Visa.
- Receita B1 usa o formulário físico Notificação de Receita B, com numeração física da Visa.
- A aba exige número, dados de identificação, dados de prescrição e confirmação de origem antes de abrir a impressão.
- A ferramenta não inventa número, não solicita numeração à Visa e não permite usar número eletrônico no impresso.
- A impressão é um formulário do app com os campos da versão 2 e link para o modelo oficial vigente. O prescritor deve conferir o modelo oficial antes de assinar e usar.

## Fluxo eletrônico

A emissão eletrônica de A/B exige serviço de prescrição integrado à API SNCR e utiliza modelo e numeração próprios. Login Gov.br isolado não constitui integração. A emissão eletrônica C1/RCE sem numeração SNCR permanece em transição até 03/03/2027; a partir de 04/03/2027, a via eletrônica deve trazer numeração do SNCR. Impressão física continua sendo uma via distinta.

Fontes oficiais consultadas em 10/11/2026:

- Anvisa — Receituário físico, versão 2: https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/controlados/sncr/receituario-fisico
- Anvisa — Início de nova etapa do SNCR em 30/09/2026: https://www.gov.br/anvisa/pt-br/assuntos/noticias-anvisa/2026/inicio-de-nova-etapa-do-sncr-o-que-muda-a-partir-de-30-de-setembro
- Anvisa — Situação do SNCR: https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/controlados/sncr/situacao-do-sncr-ocorrencias-e-orientacoes
- RDC Anvisa nº 1.046/2026 (alteração do prazo do art. 18 da RDC nº 1.000/2025).

Rollback: reverter o PR que adiciona as duas rotas, o campo local opcional da RCE, a correção do prazo e esta documentação.
