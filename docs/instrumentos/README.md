# Instrumentos de coleta (prontos para uso, sem dados)

Estes arquivos permitem que o Dr. Jadson (ou equipe) colete, fora do código, os dados que o aplicativo **não pode gerar sozinho**.
O aplicativo não define limites, níveis nem comparações; estes instrumentos só organizam a coleta e o cálculo de números descritivos.
**Nenhum campo foi preenchido; nenhum resultado foi inventado.**

| Arquivo | Para quê | Depende de |
|---|---|---|
| `PROTOCOLO_CONCORDANCIA_EXAMINADORES.md` + `planilha-concordancia-examinadores.csv` | Duas aplicadoras registram, de forma independente, os mesmos itens julgados | ≥ 2 aplicadoras e crianças reais |
| `PROTOCOLO_MEDICAO_TEMPO.md` + `planilha-medicao-tempo.csv` | Comparar o tempo medido nas aplicações com o tempo previsto pelo app | Aplicações reais |
| `PROTOCOLO_EQUIVALENCIA_FORMAS_AB.md` + `planilha-formas-ab.csv` | Registrar o reteste com as formas A e B dos textos | Crianças reais, autorização do responsável |
| `PROTOCOLO_PILOTO_CRIANCAS.md` | Roteiro do estudo piloto (consentimento, amostra, registro) | Comitê de ética e crianças reais |
| `inventario-itens-super-neuropad.csv`, `inventario-itens-jogo-letras-numeros.csv` | Lista, gerada do código, de cada item com origem e tempo previsto; colunas vazias para a revisão clínica | Revisão do médico |

Os inventários são gerados por `node --import tsx tests/tools/inventario-itens.ts`; um teste garante que não ficam desatualizados em relação ao código.
Para calcular concordância e diferenças de tempo a partir das planilhas preenchidas: `node --import tsx tests/tools/analise-planilhas.ts <arquivo.csv>`.
O resultado é sempre número descritivo (percentuais, contagens, medianas); a leitura é do profissional responsável.
