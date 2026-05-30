# 🤖 Prompt para o Claude no Chrome (operação autônoma com páginas logadas)

> **Como usar:** abra o Claude para Chrome (ou Claude com uso de navegador), esteja
> logado na sua conta do **Mercado Pago**, e **cole o bloco abaixo** (entre as linhas
> `====`). Ele opera passo a passo, pedindo sua confirmação antes de qualquer ação
> sensível — isso é proposital.

> **Expectativa honesta:** automação de navegador **não é 100% infalível**. O agente
> avança sozinho ao máximo e **para para você confirmar** em pontos sensíveis. Se
> travar, ele te explica onde parou.

> **Trade-off do Mercado Pago (importante):** diferente da Kiwify, o Mercado Pago
> **não entrega o código automaticamente** nem emite nota fiscal sozinho. A entrega
> do código será **manual** no início (você envia após o pagamento). Funciona bem
> para validar as primeiras vendas; quando o volume crescer, automatizamos.

---

```
========================== COLE A PARTIR DAQUI ==========================
PAPEL: Você é meu assistente de operações para lançar um produto digital. Trabalhe
de forma autônoma usando as páginas já logadas no meu navegador, mas SEMPRE peça
minha confirmação explícita antes de: (a) finalizar/criar cobrança, (b) tornar um
link público, (c) enviar qualquer mensagem ou e-mail. Nunca insira dados bancários
sem eu confirmar na tela.

CONTEXTO DO PROJETO:
- Produto: "NeuroPed Pro — Acesso Integral" (material educativo de neuropediatria).
- Autor: Dr. Jadson Fraga Araújo Júnior, Neurologista Infantil, CRM-PE 25227,
  RQE 17756, Petrolina-PE. (NUNCA usar CRM-BA nem outro endereço/registro.)
- App publicado: https://jadsonfraga.github.io/neuroped/neuroped-pro.html
- Entrega: o comprador recebe um CÓDIGO (formato PRO-XXXX-XXXX) e o digita no app
  para liberar o acesso. Acesso VITALÍCIO, pagamento único.
- Preço: R$ 47 (estratégia de volume — preço fixo, sem promessa de aumento).
- Plataforma: MERCADO PAGO.

OBJETIVO DESTA SESSÃO:
Criar no Mercado Pago um LINK DE PAGAMENTO funcional de R$ 47 para o produto e me
entregar, ao final: (1) o LINK de pagamento; (2) como verei cada venda paga;
(3) qualquer pendência.

PASSO A PASSO (confirme comigo a cada bloco antes de avançar):

1. ACESSAR O MERCADO PAGO
   - Vá a https://www.mercadopago.com.br e confirme que estou logado.
   - Localize a área "Seu negócio" → "Link de pagamento" / "Link de pagamento e QR"
     (ou "Checkout" / "Cobrar"). Me avise se a interface estiver diferente.

2. CRIAR O LINK DE PAGAMENTO
   - Tipo: produto/serviço digital, pagamento único.
   - Título: "NeuroPed Pro — Acesso Integral".
   - Descrição (use): "Acesso integral à biblioteca clínica do Dr. Jadson Fraga:
     210 protocolos, escalas, farmacoterapia e diretriz para TEA. Material educativo,
     acesso vitalício. Você receberá um código de ativação para usar no app."
   - Valor: R$ 47,00.
   - Meios de pagamento: Pix + cartão (com parcelamento, se disponível).
   - NÃO finalizar ainda — me mostrar o resumo para conferência.

3. PÁGINA DE SUCESSO (se houver opção de redirecionamento)
   - Se o Mercado Pago permitir "URL de retorno após pagamento aprovado", use:
     https://jadsonfraga.github.io/neuroped/neuroped-pro.html#unlock
   - Se não permitir, tudo bem — seguimos com entrega manual do código.

4. ENTREGA DO CÓDIGO (manual no início)
   - Confirme onde verei as vendas pagas (notificações / "Atividade" / e-mail).
   - Deixe pronto um TEXTO PADRÃO que eu enviarei ao comprador por WhatsApp/e-mail
     após o pagamento, contendo: o código (que eu forneço), e o link do app com a
     instrução "abra → 'Já tenho um código' → digite". Me mostre esse texto.

5. REVISÃO FINAL (antes de ativar o link)
   - Confira: valor R$ 47, título, descrição, dados do autor (CRM-PE 25227).
   - Me mostre tudo e PEÇA MINHA CONFIRMAÇÃO para ativar/gerar o link.

6. ENTREGA FINAL PARA MIM
   - Liste em destaque: o LINK DE PAGAMENTO, onde acompanho as vendas, o texto de
     entrega do código, e qualquer pendência.
   - Lembre-me dos próximos passos no app (feitos no Claude Code, não aqui):
     colar o link em CHECKOUT_URL (neuroped-pro.html) e publicar os hashes dos
     códigos em pro-hashes.js.

REGRAS:
- Se algo estiver ambíguo ou bloqueado, PARE e me pergunte — não invente dados.
- Não prometa "100% garantido"; relate o estado real a cada etapa.
- Mantenha os dados fixos do autor exatamente como acima.
=========================== FIM DO BLOCO ===========================
```

---

## Depois que o Claude no Chrome te entregar o link

Volte ao **Claude Code** (esta sessão ou nova) e diga:

> "Configure o checkout: CHECKOUT_URL = <seu-link-do-mercado-pago>"

E, com seu PIN, gere os códigos em `gerar-licencas-pro.html`, cole os hashes —
eu publico e testo a ativação de ponta a ponta. **Aí a porteira está aberta.**

> ⚙️ Como a entrega é manual no Mercado Pago: a cada venda paga, você pega um código
> do seu lote, envia ao comprador com o texto padrão, e risca esse código da lista.
