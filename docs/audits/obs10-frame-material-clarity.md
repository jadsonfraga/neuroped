# OBS-10 — precisão dos materiais no quadro de execução

23/09/2026 · continuidade da issue #929 / PR #930. Base e7d776d391104a04feee54cc9c3d58d25d080507.

A revisão final encontrou uma indicação genérica de folhas com a palavra “modelo”, mesmo nos cartões de produção livre. O comando da tarefa já estava correto, mas o recurso poderia confundir um iniciante. O plano de materiais agora distingue: uma folha em branco para produção livre/instruções; texto separado e folha em branco em leitura/escrita; folha do modelo e folha em branco exclusivamente em cópias previstas. O detalhe do papel também acompanha essa distinção, sem herdar a indicação genérica do kit.

Quantidades do cartão deixam de repetir a reserva do kit: um bloco quando é apenas um dos objetos de escolha/deslocamento; um brinquedo para olhar/alcançar e dois na proposta de duas mãos. O kit geral, comandos, tempos, respostas e todas as fichas clínicas continuam inalterados. Nenhum estímulo extra é ensinado e não há alteração de dados, esquema ou backend.

Regressão: teste unitário examina todos os cartões com papel, proibindo sugestão de modelo quando não é proposta de cópia. Casos específicos conferem leitura nas duas faixas, desenho livre, letras, escrita adolescente e quantidades de bloco/brinquedo. Os workflows existentes OBS-10 guiado e OBS-10 clínico executam sem redução de asserts, incluindo a jornada real de navegador.

Rollback: reverter somente a PR desta correção; a execução guiada da PR #930 permanece. Nenhuma migração ou persistência nova. Resultados e SHA publicado devem ser verificados nos workflows, não inferidos deste documento.
