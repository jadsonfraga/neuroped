# MISSÃO 8.4 REAL — Correções implementadas

## Escalas — aplicação e robustez

- Adicionada persistência local de rascunho por escala genérica em `localStorage`.
- Adicionado indicador “Progresso salvo neste dispositivo”.
- Submissão incompleta agora mantém o botão acionável, mostra aviso claro e rola para o primeiro item pendente.
- Itens pendentes ficam destacados após tentativa de conclusão.
- Reset limpa respostas, estado de resultado, tentativa de submissão e rascunho local.

## Interpretação e documento

- Removido envio automático de relatório ao montar o componente.
- Relatório agora exige escala, classificação, descrição e respostas antes de imprimir/enviar.
- Botão de PDF/impressão é desabilitado quando o relatório está incompleto.
- Conteúdo interpolado no HTML de impressão passa por escape básico para reduzir risco de HTML indevido.
- Texto do email deixa claro quando o app de email apenas foi preparado.

## Salvamento e recuperação

- Salvamento em paciente exibe erro clínico claro quando paciente não é selecionado, criação falha ou salvamento falha.
- Lista de pacientes mostra carregamento, estado vazio e falha de carregamento.
- Estado de salvamento usa feedback “Salvando com segurança...” com spinner.
- Relatório do paciente não é exportável quando não há avaliações salvas, evitando documento vazio.

## Filtro e recomendação

- Removido confetti automático do filtro para reduzir ruído e custo visual.
- Escalas passaram a aparecer antes de ferramentas de apoio no fluxo principal.
- Adicionado bloco “Próximo passo clínico” orientando aplicar primeiro a escala recomendada.
- Ferramentas extras foram renomeadas visualmente como apoio secundário.

## Home

- Hero passou a explicar objetivamente o que é o NeuroPed e para quem serve.
- Ações primárias foram reduzidas e padronizadas para:
  1. Aplicar Escala;
  2. Pacientes;
  3. Evolução;
  4. Documentos.
- Removido mascote da home inicial e faixa de imagens do fluxo inicial para reduzir ruído visual e carga inicial percebida.

## Guardrails

- `scripts/guards/scorecard.mjs` foi reconstruído como script válido e reprodutível, sem declarar nota final clínica.
