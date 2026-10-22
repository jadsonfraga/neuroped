# Super NeuroPad — catálogo de 50 desafios por idade

Rastreio: #1196. Desenho aprovado em 21/10/2026. Versão de interface: 2026-10-21.1.

## Comportamento entregue

Cada uma das 16 idades (2–17 anos completos) dispõe de 50 desafios: bateria principal e extensão opcional.
O núcleo publicado mantém IDs, ordem, critérios, contagens, estimativas e limites.
A extensão é opcional, tem registro próprio e não transforma itens não aplicados em erros.

| Idade | Núcleo | Opcionais | Disponíveis | Limite do núcleo |
|---|---:|---:|---:|---:|
| 2 | 18 | 32 | 50 | 12 min |
| 3–5 | 24 | 26 | 50 | 15 min aos 3; 20 min aos 4–5 |
| 6–7 | 30 | 20 | 50 | 20 min |
| 8–17 | 36 | 14 | 50 | 20 min |

Os opcionais ficam fora do orçamento do núcleo. A interface apresenta uma estimativa
própria, sem prometer duração validada com crianças. Margens menores que 90 segundos
no núcleo recebem orientação de pausas, encerramento parcial e aplicação da extensão
em outro momento. Não há obrigação de completar o catálogo.

## Origem e critérios

- Reuso direto dos bancos anuais cognitivos, objetivo compartilhado Sonda 10/OBS-10
  e manifesto do Reconhecimento Visual, sem modificar esses bancos de origem.
- Intercalação dos domínios cognitivos, do banco objetivo e das tarefas visuais elegíveis
  para a idade; seleção por conceito e referência para evitar repetição.
- As referências cognitivas apontam idade, domínio e índice. O banco objetivo
  preserva enunciado, alternativas, resposta e divisão par/ímpar Sonda/OBS.
- Figuras e número de distratores reutilizam a elegibilidade e graduação do
  Reconhecimento Visual para a idade. A ampliação de um catálogo não valida
  psicometricamente os itens nem substitui avaliação clínica do adolescente.
- Seleção técnica por faixa não equivale a validação psicométrica, norma, escore,
  equivalência de instrumento licenciado ou diagnóstico. A revisão de pertinência
  clínica item a item continua sob responsabilidade do profissional.

## Registro e ergonomia

Opcionais aceitam toque, fala/ação julgada e montagem de letras pelos mesmos
componentes do jogo. Preservam recusa, não resposta, repetição, gesto previsto,
ajuda adicional e fonte da resposta. Exportação TXT/cópia local lista itens aplicados
e não aplicados. Não envia dados à família, prontuário ou servidor automaticamente.

Pausa, ocultação da aba e execução da bateria principal suspendem o tempo ativo
dos opcionais. Os registros ficam em memória, separados por idade; a navegação e
"Nova partida" protegem registros ainda não copiados. Uma cópia assíncrona só libera
a proteção da revisão efetivamente copiada; respostas novas durante a cópia continuam protegidas.

Texto de aplicação usa fonte de sistema, metadados de pelo menos 14 px e botões de
pelo menos 48 px. Temas distinguem primeira infância, exploração, estratégia e
autonomia; adolescência tem menos ornamentos e animações. Mascote global é retirado
dessa rota. A saída “Escolher outra idade” usa a confirmação já existente do jogo.

Os itens e registros opcionais usam `extensao.ts`; a saída principal mantém o circuito
clínico obrigatório. O import explícito `ClinicalCircuit.tsx` evita colisão com
`clinicalCircuit.ts` em sistemas Windows sem distinção de caixa.

## Verificação

Reconciliação: circuito clínico obrigatório de #1194 e auditoria de opcionais de #1200
preservados. A extensão reutiliza a elegibilidade visual por idade e elimina a única
repetição de conceito anteriormente restante aos 5 anos.

Verificações locais: `npm run test:super-neuropad` (139/139), TypeScript do cliente e
Functions, guard de fontes autorais e build de produção aprovados. E2E do núcleo e do
circuito clínico passou; E2E dos opcionais confirmou 16 faixas, 50 itens por idade,
registro e pausa, troca de aba, cópia, ausência de mascote global, axe sem violações e
celular sem overflow. Regressão de pausa confirma que 1,2 s pausado não entra no tempo
registrado e a marca de repetição permanece. Lint focado sem alertas.

Revisão técnica corrigiu o total de alternativas nas referências visuais opcionais e
acumulou apenas segmentos ativos do cronômetro; o metadado do núcleo permaneceu igual
ao golden congelado. Revisão visual dos screenshots móveis: texto legível, controles
sem sobreposição e sem rolagem horizontal.

## Relação com outras propostas e rollback

A proposta #1195 adota uma bateria principal ampliada apenas aos 8–17 anos e outro
limite de duração. O presente desenho oferece 50 disponíveis em todas as idades com
núcleo preservado; as duas propostas não devem ser mescladas simultaneamente sem
reconciliação explícita. Este trabalho não modifica nem fecha o rascunho anterior.

Rollback: reverter o commit desta entrega. Não há migração de banco, persistência
clínica nova, alteração de instrumento de origem ou dependência adicional.
