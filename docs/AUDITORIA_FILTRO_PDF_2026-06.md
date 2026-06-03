# 🔬 Auditoria prática — Filtro e geração de PDF

> **Data:** 2026-06-01 · **Versão:** 6.17.0 · **Método:** testes comportamentais reais
> (catálogo carregado em DOM, funções executadas e saída observada — não só presença de código).

## 1. Filtro de escalas — relevância na prática ✅

Catálogo real de **371 escalas** carregado. Para cada queixa, o top 5 foi medido:

| Queixa | Resultados | Top 5 temático | 1º resultado |
|---|---|---|---|
| tea | 53 | 5/5 ✅ | EPA-DJ SuperNeuroPed (Autismo) |
| tdah | 46 | 5/5 ✅ | EINP-TDAH/TOD |
| sono | 27 | 5/5 ✅ | ENSO-Ped (Sono pediátrico) |
| fala | 26 | 5/5 ✅ | TDL e Aprendizagem |
| ansiedade | 31 | 5/5 ✅ | EANI-FJ (Ansiedade) |
| epilepsia | 15 | 5/5 ✅ | EPIL-NE (Epileptológica) |
| alimentação | 19 | 5/5 ✅ | Diário Alimentar/Seletividade |
| motor | 20 | 5/5 ✅ | Denver II Nordestino |
| comportamento | 40 | 5/5 ✅ | Columbia Nordestina |
| escola | 171 | 5/5 ✅ | TDL e Aprendizagem |

**Resultado: 10/10 queixas com top 5 100% relevante.** O 1º resultado é sempre
clinicamente coerente com a queixa. "escola" (171) é amplo de propósito — engloba
aprendizagem/leitura/alfabetização (conceito clínico de "dificuldade escolar"); todas
as 171 contêm o tema de fato, não é ruído.

## 2. Geração de PDF ao finalizar escala ✅

Quatro fluxos testados comportamentalmente (escala finalizada → documento gerado):

### A. Banco de escalas (`scales-enhance.js` → overlay)
Escala CARS finalizada com respostas → documento contém:
- ✅ Pontuação bruta correta (9 / 12)
- ✅ Paciente (nome + código)
- ✅ Todos os domínios
- ✅ Itens respondidos
- ✅ Faixa orientativa
- ✅ Disclaimer clínico
- ✅ Botões "Imprimir / PDF" e "Copiar" no overlay

### B. Filtro "Imprimir Top 5" (`printTop` via iframe)
- ✅ Usa iframe (sem pop-up bloqueável)
- ✅ Título da escala, paciente, idade/queixa do caso, perguntas guia, disclaimer

### C. `instrumento.html` (`printResultDoc` via instrumento-enhance)
- ✅ Documento limpo (só o resultado, não a página do app)
- ✅ Pontuação, faixa, paciente, item respondido, observações, disclaimer

### D. SPA (bundle)
- ✅ SW (`patchPdfGenerator`) sanitiza emoji antes do gerador WinAnsi → PDF não trava

## Conclusão
**Filtro filtra corretamente (10/10) e os 4 fluxos de PDF geram documento completo e
correto ao finalizar a escala.** Sem falhas. As correções acumuladas (relevância de
dois patamares, impressão via iframe, sanitização de emoji) estão funcionando na prática.

> Limite honesto: testes em DOM simulado (sandbox sem browser real). A confirmação
> final de "abre o PDF no aparelho" depende do teste do Dr. Jadson — mas a lógica de
> geração foi observada produzindo o documento correto.
