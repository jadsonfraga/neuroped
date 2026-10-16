# Protocolo — medição de tempo real das aplicações

**Natureza:** o app já registra o tempo de resposta por item, por mundo, o tempo ativo, as pausas e o início da sessão (relatório, PDF e prontuário). Este protocolo organiza a comparação com o tempo previsto.

## Passos
1. Após cada aplicação, copie do relatório: faixa/idade, tempo previsto (linha "estimativa"), tempo ativo/duração da sessão, pausas e se a sessão terminou por limite de tempo.
2. Preencha uma linha em `planilha-medicao-tempo.csv` (sem nome da criança; use código).
3. Rode `node --import tsx tests/tools/analise-planilhas.ts planilha-medicao-tempo.csv` para obter, por faixa: número de aplicações, mediana, mínimo e máximo do tempo medido e a diferença para o tempo previsto.
4. A decisão de mudar teto de sessão ou número de itens é do Dr. Jadson, com base nesses números. O app não altera nada automaticamente.
