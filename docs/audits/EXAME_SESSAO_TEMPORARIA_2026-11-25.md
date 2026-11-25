# Exame por faixa etária: sessão, registros e encerramento

Base `f158277cfb619856672ec29106a5dea0d758c3ee`. Alteração local em Exame Neurológico e Mental, integrada ao refinamento de Observação Social documentado separadamente em `OBSERVACAO_SOCIAL_PRIVACIDADE_2026-11-25.md`.

## Fluxo e critérios

A rota existente mantém as 17 faixas do nascimento aos 19 anos, as seis atividades de cada faixa, o preparo específico, os exemplos lúdicos, as adaptações e as referências. A idade orienta a escolha da atividade e não determina um resultado. Na consulta, o caminho visível é **preparar, conduzir, registrar, revisar e encerrar**.

- Cada item começa sem classificação. O profissional decide entre observado diretamente, observado com apoio, relato não observado diretamente, sem oportunidade e preferiu parar. Nota descritiva sem seleção continua sem classificação, não vira achado normal.
- Assim que houver registro, o seletor de idade bloqueia. A síntese mostra só o que foi registrado, na ordem de condução do roteiro. Nenhuma atividade omitida vira resultado.
- Encerrar com registro exige confirmação. Cancelar preserva o que foi anotado; confirmar apaga e volta à escolha da idade. Reabrir a mesma faixa não traz notas da sessão anterior.
- O estado temporário fica em memória no componente. Não há gravação automática no prontuário, upload, câmera, PDF, escore, diagnóstico, assinatura ou migração. Nem mesmo enviar uma nota local exige acesso ao servidor.
- Esta mudança melhora o fluxo operacional, não valida o conteúdo como teste diagnóstico, não copia ADOS-2 e não altera rotas, autenticação, prescrição ou liberação.

## Verificação e rollback

`node --import tsx --test tests/unit/exame-por-idade.test.mjs tests/unit/exam-visit-session.test.ts`: confere as 17 faixas preservadas, transições, limites de entrada e síntese sem inferência. `node tests/e2e/exam-visit-session.mjs`: Chromium 820 × 1180 na rota real com login simulado; registra, revisa, cancela o encerramento, confirma e reinicia sem recuperar notas; nenhuma chamada de gravação clínica. Não é prova de Cloudflare/D1. Reverter os arquivos do patch não exige migração nem deixa dados persistidos.
