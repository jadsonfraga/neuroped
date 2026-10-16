# Protocolo — concordância entre aplicadoras (itens julgados pelo examinador)

**Natureza:** instrumento de coleta. Não define limites de aceitação; o cálculo devolve apenas números descritivos.

## Itens cobertos
Itens de fala e ação do Super NeuroPad (julgados pela aplicadora) e itens de leitura em voz alta e ditado do Jogo das Letras e Números.

## Procedimento
1. Duas aplicadoras (A e B) acompanham a mesma criança na mesma sessão: uma conduz, a outra observa sem intervir (ou assiste a gravação, se houver autorização de gravação).
2. Cada uma registra **sozinha**, no app ou em papel, o resultado de cada item (acerto, erro, sem resposta, recusa). Não podem conversar antes de terminar.
3. Preencher uma linha por item em `planilha-concordancia-examinadores.csv`: sessão, id do item (use o inventário), resultado da aplicadora A, resultado da aplicadora B.
4. Registrar na coluna `observacao` qualquer divergência de condições (ruído, repetição de comando).
5. Guardar apenas código da sessão (sem nome da criança) na planilha. A chave de identificação fica separada, sob guarda do responsável.

## Cálculo (descritivo)
`node --import tsx tests/tools/analise-planilhas.ts planilha-concordancia-examinadores.csv` informa: itens comparados, itens com o mesmo registro, percentual de coincidência, coeficiente kappa de Cohen e a lista de itens com registros diferentes. O programa não rotula o valor.

## Cuidados
- Treino prévio igual para as duas aplicadoras, registrado na planilha de sessão.
- Consentimento do responsável e aprovação ética antes de qualquer coleta com crianças (ver `PROTOCOLO_PILOTO_CRIANCAS.md`).
