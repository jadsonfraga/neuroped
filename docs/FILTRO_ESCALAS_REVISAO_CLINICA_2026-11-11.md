# Filtro de escalas — revisão clínica pendente

Implementação técnica em 11/11/2026, base `4be01ef`. Este registro não constitui homologação médica.

## Regras submetidas ao Dr. Jadson

- Um sinal selecionado conta como coberto somente quando a escala possui tag correspondente ao ID ou rótulo resolvido; correspondência genérica de queixa não comprova cobertura específica.
- A composição procura cobrir cada sinal individualmente, respeitando idade, respondente, risco agudo, aplicabilidade, não redundância e o limite de 100 itens verificados. Uma dupla pode ser preferível a um trio que perderia sinal ou repetiria construto.
- Instrumentos de carga desconhecida não participam das três medalhas orçadas; podem aparecer em categorias separadas com aviso “Carga não verificada”. A contagem de uma tarefa variável usa o máximo real de campos de suas faixas, quando esse máximo foi conferido no protocolo.
- Idade em faixa admite sobreposição parcial somente com aviso para confirmar a idade exata antes da aplicação. Idade exata fora do intervalo permanece bloqueada.
- O texto “sem instrumento aplicável seguro para este perfil” não significa ausência clínica do sintoma; descreve apenas o catálogo e os filtros deste contexto.

## Evidência técnica

- 12.364 contextos sintéticos: 10/10 contextos com sinal e candidato seguro de carga conhecida cobertos; 6 contextos sem candidato nessa condição. Cobertura bruta 10/16 (62,5%).
- Zero violações de teto, respondente, idade exata, risco agudo, aplicabilidade ou redundância na medição.
- Suítes `test:filter`, `test:podium`, `test:ideal-choice`, `test:practical-filter`, `check`, `lint` e `build:client` executadas na branch.

**Decisão médica:** pendente de revisão dos enunciados, da priorização e dos limites etários. Nenhum aceite, assinatura ou liberação clínica foi inferido desta alteração técnica.
