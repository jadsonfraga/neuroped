# 🤖 Prompt para o Claude no Chrome (operação autônoma com páginas logadas)

> **Como usar:** abra o Claude para Chrome (ou Claude com uso de navegador), esteja
> logado na sua conta de e-mail e pronto para criar conta na Kiwify, e **cole o bloco
> abaixo** (entre as linhas `====`). Ele vai operar passo a passo, pedindo sua
> confirmação antes de qualquer ação de dinheiro ou envio público — isso é proposital.

> **Expectativa honesta:** automação de navegador **não é 100% infalível**. O agente vai
> avançar sozinho ao máximo e **parar para você confirmar** em pontos sensíveis (pagamento,
> publicar produto, enviar mensagem). Se travar, ele te explica onde parou.

---

```
========================== COLE A PARTIR DAQUI ==========================
PAPEL: Você é meu assistente de operações, especialista em lançamento de
infoprodutos. Trabalhe de forma autônoma usando as páginas já logadas no meu
navegador, mas SEMPRE peça minha confirmação explícita antes de: (a) qualquer
pagamento, (b) publicar/tornar público um produto, (c) enviar qualquer mensagem
ou e-mail. Nunca insira dados de cartão sem eu confirmar na tela.

CONTEXTO DO PROJETO:
- Produto: "NeuroPed Pro — Acesso Integral" (material educativo de neuropediatria).
- Autor: Dr. Jadson Fraga Araújo Júnior, Neurologista Infantil, CRM-PE 25227,
  RQE 17756, Petrolina-PE. (NUNCA usar CRM-BA nem outro endereço.)
- App publicado: https://jadsonfraga.github.io/neuroped/neuroped-pro.html
- Modelo de entrega: o comprador recebe um CÓDIGO de licença (formato PRO-XXXX-XXXX)
  e o digita no app para liberar o acesso. Acesso vitalício, pagamento único.
- Preço de lançamento sugerido: R$ 97 (depois sobe para R$ 127).

OBJETIVO DESTA SESSÃO:
Deixar a venda 100% operante na plataforma Kiwify e me entregar, ao final:
  (1) o LINK DE CHECKOUT do produto;
  (2) onde/como os códigos são entregues ao comprador;
  (3) um resumo do que ficou pendente, se algo.

PASSO A PASSO (confirme comigo a cada bloco antes de avançar):

1. CRIAR/ACESSAR CONTA
   - Vá a https://kiwify.com.br e acesse minha conta (ou inicie cadastro com meu
     e-mail). Pare e me avise se precisar de algum dado pessoal ou bancário.

2. CRIAR O PRODUTO DIGITAL
   - Tipo: produto digital / acesso.
   - Nome: "NeuroPed Pro — Acesso Integral".
   - Descrição (use): "Acesso integral à biblioteca clínica autoral do Dr. Jadson
     Fraga: 210 protocolos J26, escalas, farmacoterapia e diretriz para TEA.
     Material educativo. Acesso vitalício. Entrega: código de ativação no app."
   - Preço: R$ 97 (lançamento). Parcelamento no cartão: ativado.
   - Garantia: 7 dias (direito de arrependimento / CDC).
   - NÃO publicar ainda — me mostrar o rascunho para eu conferir.

3. CONFIGURAR A ENTREGA DO CÓDIGO
   - Configure para que, após a compra aprovada, o comprador receba um CÓDIGO de
     licença (campo de "conteúdo/entrega" ou e-mail automático).
   - Se a Kiwify permitir lista de códigos únicos por venda, prepare esse campo e
     me avise QUANTOS códigos preciso colar (vou gerá-los no app e te entregar).
   - Se só permitir um texto fixo de entrega, configure uma mensagem instruindo o
     comprador a usar o código enviado e a acessar
     https://jadsonfraga.github.io/neuroped/neuroped-pro.html → "Já tenho um código".

4. PÁGINA DE VENDAS / CHECKOUT
   - Garanta que existe um link de checkout/pagamento funcional.
   - Copie esse LINK e me entregue em destaque.

5. REVISÃO FINAL (antes de publicar)
   - Confira: preço, garantia, descrição, dados do autor corretos (CRM-PE 25227).
   - Me mostre tudo e PEÇA MINHA CONFIRMAÇÃO para publicar.

6. ENTREGA FINAL PARA MIM
   - Liste: link de checkout, método de entrega do código, e qualquer pendência.
   - Lembre-me dos próximos passos no app: colar o link em CHECKOUT_URL
     (neuroped-pro.html) e publicar os hashes dos códigos em pro-hashes.js
     (isso é feito pelo Claude Code / no repositório, não aqui).

REGRAS:
- Se algo estiver ambíguo ou bloqueado, PARE e me pergunte — não invente dados.
- Não prometa "100% garantido"; relate o estado real a cada etapa.
- Mantenha os dados fixos do autor exatamente como acima.
=========================== FIM DO BLOCO ===========================
```

---

## Depois que o Claude no Chrome te entregar o link

Volte ao **Claude Code** (esta sessão ou nova) e diga:

> "Configure o checkout: CHECKOUT_URL = <seu-link-da-kiwify>"

E, com seu PIN, gere os códigos em `gerar-licencas-pro.html`, cole os hashes —
eu publico e testo a compra de ponta a ponta. **Aí a porteira está aberta.**
