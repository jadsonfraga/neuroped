# Revisão técnica do inventário autoral de 11/09/2026

Referência: issue #854; commit fbf37aa3669f704e363f38e8fdf0141b35bcb219.
Comparação com main af515513: exatamente um JSON novo, 265 linhas,
NEUROPED-DIARIO-20260911-007 (RAC-APR-NeuroPed), 15 itens, 60–215 meses.
É contingência determinística, status rascunho_revisao, needsUpgrade=true,
sem validação psicométrica e sem soma habilitada. Não altera UI, escores ou API.

## Duplicação comprovada

14 dos 15 textos dos itens são idênticos aos arquivos de contingência já na main:
2026-08-09-contingencia-fam.json, 2026-08-10-contingencia-com.json,
2026-08-11-contingencia-fex.json e 2026-08-12-contingencia-emo.json.
O CT01 substitui o tema. Assim, não representa 15 perguntas novas específicas
sobre aprendizagem. A estrutura pode servir como registro genérico de contingência;
a decisão de mantê-la separada ou consolidar é do autor.

## Pontos concretos antes de promoção

- CT13–CT15 declaram presente_ausente, mas o JSON oferece opções globais de
frequência/intensidade. Verificar renderização de opções por item antes de uso;
não presumir que o componente consumirá corretamente esse contrato.
- "Não observado" vale 0, enquanto desconhecido vale null. Instruções devem
distinguir ausência observada de falta de oportunidade de observação; manter
sem total e sem inferência de normalidade para informação ausente.
- Há itens de dificuldade e itens de apoio/recuperação em direções diferentes.
Não converter o perfil em total de gravidade ou gráfico numérico agregado.

## Correção de contrato — 13/09/2026

O JSON determinístico permaneceu sem diff Git e sem edição manual. A camada de
apresentação agora resolve opções por `responseMode`: frequência conserva as
opções do registro; `presente_ausente` usa Presente, Ausente com oportunidade
de observação e Desconhecido por informação insuficiente. Os três estados têm
tokens semânticos distintos e nenhum item binário recebe valor numérico de
escore. Respostas descritivas permanecem sem escala fechada.

A regressão cobre CT13–CT15, separa `absent` de `unknown` e impede a UI de
voltar a aplicar `responseOptions` globais indiscriminadamente.

Parecer técnico: manter como rascunho; decidir se a repetição é intencional como
continuidade ou se deve ser consolidada. Nenhuma aprovação clínica foi atribuída.
Revisão limitada ao contrato dos arquivos; não é validação científica/psicométrica.

## Curadoria estrutural — 13/09/2026

A elegibilidade operacional foi centralizada em um gate fail-closed. Cada registro
recebe uma decisão de curadoria com estado `operational` ou `review_only` e motivos
explícitos: revisão clínica pendente, contingência, upgrade autoral pendente ou
contrato de resposta ambíguo. O catálogo clínico operacional deriva exclusivamente
dessa decisão, enquanto o catálogo de revisão preserva o registro e seus bloqueios.

Assim, alterar apenas `status` não promove um registro inseguro. O RAC-APR da #858
permanece `review_only` por ser contingência e exigir upgrade, embora o contrato de
resposta agora esteja íntegro. O JSON gerado continua sem edição manual.

Rollback: retirar somente este documento de auditoria. O JSON gerado foi preservado
sem edição manual, conforme AGENTS.md.
