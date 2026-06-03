# NeuroPed EDJ — Integração de Escalas por Extenso

## Objetivo

Transformar o Filtro Inteligente de escalas em um banco real de instrumentos preenchíveis, com:

- itens por extenso;
- opções de marcação;
- cálculo de escore bruto;
- domínios/subdomínios;
- pontos de corte quando existentes;
- referência ou autoria;
- classificação de segurança jurídica.

## Situação atual

Após auditoria da `main` restaurada para o commit `748ec66ddd3827eb67218821e7c5458bdc4fe7e4`, o app possui:

- aproximadamente 54 instrumentos/formulários realmente preenchíveis;
- cerca de 453+ instrumentos/protocolos apenas citados no Filtro Inteligente, sem itens por extenso no app;
- badge público `507+`, que representa catálogo/recomendador, não 507 escalas integrais aplicáveis.

## Arquivo integrado

Foi criado o arquivo:

```txt
banco-escalas.html
```

Ele funciona como módulo estático independente, sem alterar os chunks Vite compilados.

### Conteúdo inicial do banco

Foram inseridos por extenso, em formato preenchível:

1. Como Eu Me Sinto — Humor/Tristeza
2. Minhas Preocupações — Ansiedade/Medos
3. Minha Atenção — TDAH Autoavaliação
4. Como Eu Me Comporto — Irritabilidade
5. Meu Sono
6. Minha Alimentação
7. Eu e os Outros — Social
8. Minha Escola — Aprendizado
9. Inventário Escolar — Comportamento Global
10. Inventário Escolar — Sinais TEA
11. Inventário Escolar — Alfabetização
12. Inventário Escolar — Funções Executivas
13. EMDI — Escala Multidimensional de Desenvolvimento Infantil
14. Escala Clínica de Auto/Heteroagressividade
15. Escala Clínica de Risco Autolesivo/Suicida
16. Triagem AH/SD × TEA
17. Bloco de controle: escalas clássicas protegidas/licenciadas
18. Bloco de controle: 453+ protocolos pendentes do filtro

## Regra de segurança jurídica

Não reproduzir por extenso instrumentos comerciais, proprietários ou licenciados sem autorização, licença ou conteúdo fornecido pelo titular.

### Exemplos que exigem cautela/licença

- Vineland
- Conners
- BRIEF-2
- CBCL
- CDI-2
- CARS
- ASQ-3
- PedsQL
- escalas publicadas por editoras ou sistemas pagos

Para esses casos, o app deve manter uma das opções:

1. apenas referência e campo de lançamento manual do escore;
2. checklist autoral inspirado em domínios clínicos, sem reprodução de itens;
3. módulo desbloqueado apenas se o usuário inserir localmente o texto licenciado.

## Modelo de integração de cada nova escala

Cada escala deve conter, no mínimo:

```js
{
  id: "identificador-curto",
  status: "integral | licenciada | pendente",
  group: "categoria",
  title: "Nome da escala",
  subtitle: "Faixa etária / respondente",
  labels: ["0 — ...", "1 — ..."],
  domains: [
    {
      name: "Nome do domínio",
      items: [
        "Item 1 por extenso",
        "Item 2 por extenso"
      ]
    }
  ],
  scoring: {
    max: 0,
    cutoffs: []
  }
}
```

## Ordem recomendada para completar as 453+ entradas

### Fase 1 — Escalas autorais e operacionais

Priorizar as escalas Dr. Jadson já citadas no filtro, pois podem ser escritas integralmente como instrumentos autorais sem conflito com editoras.

Ordem sugerida:

1. TEA — perfil sensorial
2. TEA — interesses restritos
3. TEA — comunicação funcional
4. TEA — atenção conjunta
5. TEA — nível de suporte
6. TEA — sono
7. TDAH — disregulação emocional
8. TDAH — tempo cognitivo lento
9. TDAH — memória de trabalho
10. TDAH — impacto familiar
11. TOD/oposição
12. problemas de conduta
13. raiva e tolerância à frustração
14. seletividade alimentar
15. cefaleia/diário de dor
16. epilepsia/diário de crise
17. autonomia/autocuidado
18. função executiva cotidiana
19. linguagem pragmática
20. teoria da mente

### Fase 2 — Escalas públicas ou abertas

Inserir instrumentos com uso livre confirmado ou adaptar em formato autoral.

### Fase 3 — Escalas proprietárias/licenciadas

Manter travadas até licença formal ou uso apenas como entrada manual de escore.

## Critério para contar como escala real

Uma escala só deve entrar na contagem pública se cumprir todos os critérios:

- aparece por extenso;
- possui itens/perguntas;
- possui campo de resposta clicável;
- calcula escore ou estrutura resultado;
- permite impressão/exportação;
- tem autoria/referência e status jurídico claro.

## Ajuste recomendado no marketing do app

Evitar afirmar “507 escalas completas” enquanto a maioria estiver apenas no catálogo.

Formulação mais segura:

> Banco com 50+ instrumentos preenchíveis e catálogo inteligente com 500+ protocolos clínicos em expansão.

Depois da integração real:

> Banco com 500+ instrumentos clínicos e protocolos preenchíveis, com filtros por idade, queixa e respondente.
