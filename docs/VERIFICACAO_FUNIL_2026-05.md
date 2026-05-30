# ✅ Verificação Comportamental do Funil de Venda

> **Data:** 2026-05-30 · **Versão:** 6.7.0 · **Método:** execução real em DOM (jsdom), não só sintaxe.

## Por que esta verificação
A frente comercial adicionou JS de runtime (barra de compra fixa, render de prova
social, fallback de checkout). Sintaxe válida **não** garante comportamento correto.
Antes de declarar o funil pronto, ele foi **executado** num DOM real e observado.

## O que foi verificado (`scripts/verify-funnel.mjs`)
Carrega `neuroped-pro.html` + `pro-hashes.js` + `master-access-policy.js` +
`pro-license.js` num DOM (jsdom), executa os scripts e confirma:

| # | Verificação | Resultado |
|---|---|---|
| 1 | Barra de compra fixa existe no DOM | ✅ |
| 2 | Depoimentos nascem **ocultos** (sem prova social falsa) | ✅ |
| 3 | Preço **R$ 47** renderizado | ✅ |
| 4 | Barra de compra mostra o preço sincronizado | ✅ |
| 5 | Botão da barra → abre **WhatsApp** (venda manual ativa **hoje**) | ✅ |
| 6 | Mensagem do WhatsApp cita o produto | ✅ |
| 7 | Botão final de compra também dispara a ação | ✅ |
| 8 | Motor de licença (`NeuroPedPro.unlock`) disponível | ✅ |
| 9 | Código **inválido é rejeitado** | ✅ |

**Resultado: 9 OK, 0 falhas.** (A aceitação de código válido já fora comprovada no
E2E original do motor de licença — PR #68, 10/10 códigos válidos aceitos.)

## Conclusão prática
O funil **funciona de ponta a ponta agora**, em modo de **venda manual via WhatsApp**
— sem depender do checkout do Mercado Pago. Ou seja: **é possível vender hoje.**
O único passo restante para automatizar o pagamento é colar o `CHECKOUT_URL`.

## Como reexecutar
```bash
npm test            # estático (388) + comportamental (9)
npm run test:funnel # só o comportamental (pula sozinho se jsdom ausente)
```
> `jsdom` é dependência opcional de verificação; o teste é pulado com aviso se
> não estiver instalado, sem quebrar o pipeline.
