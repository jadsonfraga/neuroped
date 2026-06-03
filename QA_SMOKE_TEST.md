# QA SMOKE-TEST — NeuroPed EDJ (validação no aparelho)

> Objetivo: em ~5 min, percorrer o caso clínico completo no celular e confirmar
> que cada etapa funciona. Para cada passo há o **esperado**. Se divergir, anote
> o nº do passo + o que aconteceu (print ajuda) e me envie — eu corrijo cirúrgico.

**Versão canônica atual:** ver em `…/verificar-app.html` (deve bater com `package.json`).

---

## 0. Preparação (cache)
1. Abra `https://jadsonfraga.github.io/neuroped/` e **recarregue** (puxe pra baixo / aba anônima).
   - *Esperado:* splash com a **logo do escudo** → home "Dr. Jadson Fraga / SuperNeuroPed".
   - *Se vier tela antiga:* abra `…/verificar-app.html` → "Recarregar app".

## 1. Marca em toda tela
2. Em qualquer tela, olhe o **canto inferior esquerdo**.
   - *Esperado:* selo pequeno com a **logo** (não bloqueia toque; some ao imprimir).

## 2. Moldura única (tudo abre dentro)
3. Na home, toque em **"Encontrar Escala"** (ou no card de escalas).
   - *Esperado:* a tela de escalas abre **dentro** de um overlay com **"‹ Voltar"** no topo — **sem sair** da home.
   - *⚠️ Se abrir uma página separada (trocou de tela):* me diga "passo 3 trocou de página" (a home dispara por JS, não por link — eu intercepto no ponto certo).

## 3. Filtro = achar + aplicar (porta única)
4. Toque **idade** e **queixa** (ex.: 6–11 anos + Desatenção/TDAH).
   - *Esperado:* aparecem **3 escalas** mais indicadas (a 1ª com selo dourado "1ª indicada") + botão **"▶ Responder a 1ª agora"**.
5. No campo **"Buscar qualquer escala…"**, digite `autismo`.
   - *Esperado:* lista de escalas de TEA (cards compactos), cada uma com **"▶ Responder"**.

## 4. Responder + laudo (runner)
6. Toque **"▶ Responder"** numa escala.
   - *Esperado:* abre o **runner dentro do overlay**; barra de **progresso**; ao responder um item, **avança sozinho** para o próximo.
7. Responda todos os itens.
   - *Esperado:* surge o cartão dourado **"✓ Tudo respondido → Gerar laudo agora"**.
8. Toque **"📄 Gerar laudo (PDF)"**.
   - *Esperado:* aparece o **laudo na tela** (overlay branco) com pontuação, faixa e **cada item → resposta**; botões Imprimir/Copiar.
   - *Item não respondido* deve sair como **"(não respondida)"** (não "undefined").

## 5. Histórico / Perfil / continuidade
9. Cadastre/escolha uma **criança** em **Perfil** (se ainda não fez) e refaça o passo 8 com ela ativa.
   - *Esperado:* o laudo traz o **nome da criança**; o resultado aparece na **linha do tempo** do Perfil.
10. **Gere o mesmo laudo 2×** seguidas.
    - *Esperado:* o histórico **NÃO duplica** (continua 1 entrada para aquela aplicação).
11. No Perfil, toque **"↻ Reaplicar"** numa avaliação.
    - *Esperado:* abre o runner com a **mesma escala**; ao concluir, a linha do tempo mostra a 2ª medição e o **delta** (▲/▼ pts).
12. Veja **"🧠 Síntese do caso"**.
    - *Esperado:* cruza escalas × medicação × diário + "Próximos passos".

## 6. Documentos
13. Em **Documentos prontos**, toque "Declaração escolar".
    - *Esperado:* PDF pré-preenchido com a criança + CRM-PE 25227; abre sem depender de pop-up.

## 7. Backup (LGPD)
14. No Perfil: **⬇️ Exportar dados** → salva `.json`. Depois **⬆️ Importar** o mesmo arquivo.
    - *Esperado:* "Importado: N criança(s)…"; **nada duplica** ao reimportar.

## 8. Offline
15. Ative o **modo avião** e reabra o app.
    - *Esperado:* abre normal; filtro → responder → laudo **funcionam offline**.

## 9. Acessibilidade
16. Tente dar **zoom com os dedos** (pinch) em qualquer tela.
    - *Esperado:* **amplia** (não fica travado).

---

### O que me reportar
Para cada divergência: **nº do passo · o que esperava · o que aconteceu · (print)**.
Com isso eu reproduzo a lógica, corrijo e mostro a evidência. Soli Deo Gloria.
