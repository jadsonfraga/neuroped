# Protocolo — registro do reteste com as formas A e B (compreensão e fluência)

**Natureza:** coleta descritiva. O app registra a forma usada (A ou B) no relatório, PDF e prontuário. A equivalência entre as formas **não foi estudada**; este roteiro apenas organiza os dados para estudá-la.

## Passos
1. Com autorização do responsável, aplicar a forma A e, após intervalo definido pelo estudo, a forma B (ou a ordem inversa, alternando entre crianças).
2. Registrar em `planilha-formas-ab.csv`: código da criança, faixa, forma, ordem (1ª/2ª), intervalo em dias, contagens brutas (acertos na compreensão; palavras lidas, erros e segundos na fluência).
3. `node --import tsx tests/tools/analise-planilhas.ts planilha-formas-ab.csv` devolve as diferenças entre formas por criança (valores absolutos e mediana das diferenças), sem rótulo.
