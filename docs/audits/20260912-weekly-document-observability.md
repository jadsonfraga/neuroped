# Observabilidade documental semanal — 12/09/2026

Coletor existente de C:\NeuroPed\WeeklyRecap versionado para revisão/reuso.
Acrescenta seção PANTY própria, contagem local modificada/criada na janela e
metadados de cobertura. PRE-PANT/PRE-PANTY são excluídos. Arquivo inacessível
produz null/NOT_VERIFIED, nunca zero presumido. PANTY não entra também em PANT.

A cobertura local se limita a PANT_OUT e revisao. Não representa inventário
completo do Drive; total_drive_count permanece null até consulta conectada.
A automação do recap foi atualizada para buscar a contagem complementar no Drive,
deduplicar por ID/versão e ler a autoridade BUS/PANT CURRENT ao vivo.

O script não altera CURRENT, selo ou autoridade PANT. Mantém o verificador
original. Validação sintática e contagem com arquivos sintéticos devem anteceder
a execução no Windows. Rollback: restaurar o backup do coletor anterior.
