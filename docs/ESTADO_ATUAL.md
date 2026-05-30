# 📸 Estado Atual do Projeto — NeuroPed

> Fotografia do estado de programação para retomada autônoma (humano ou agente).
> **Atualizado em:** 2026-05-30 · **Versão:** 6.6.0 · **Testes:** 375 OK, 0 falhas

---

## 1. O que é

PWA estático (HTML/CSS/JS + bundle React em `index.html`), hospedado no **GitHub Pages**
em `https://jadsonfraga.github.io/neuroped/`. **53 telas .html.** Funciona offline
(Service Worker). **Sem backend ativo para dado de paciente** — tudo roda no dispositivo
(`localStorage`). Modo **HOMOLOGAÇÃO** (não apto a dado clínico real de produção).

- **Autor:** Dr. Jadson Fraga Araújo Júnior — Neurologista Infantil
- **Registro (FIXO):** CRM-PE 25227 · RQE 17756 — **NUNCA citar CRM-BA**
- **Endereço (FIXO):** Rua Raimundo Lacerda, Casa 01, Bairro São José, Petrolina-PE
- **WhatsApp:** wa.me/5587991097371

---

## 2. Infraestrutura de RECEITA (construída e testada)

| Componente | Arquivo | Estado |
|---|---|---|
| Landing de vendas | `neuroped-pro.html` | ✅ pronta (comparativo Grátis×Pro, urgência, FAQ, garantia CDC) |
| Motor de licença (offline, SHA-256) | `pro-license.js` | ✅ testado E2E (10/10 válidos, falso rejeitado) |
| Lista de hashes válidos | `pro-hashes.js` | ⚠️ **lote DEMO (10 códigos)** — substituir pelos reais |
| Gerador de códigos (PIN, noindex) | `gerar-licencas-pro.html` | ✅ pronto |
| Página de autoridade (SEO + OG) | `sobre-dr-jadson.html` | ✅ pronta (schema Physician) |
| Motor de indicação pai-para-pai | `app-polish-mobile.js` | ✅ ativo nas telas de família |
| Descoberta do Pro | `portal-familia-livre.html` | ✅ card Pro inserido |
| Guia de lançamento (checklist) | `guia-lancamento.html` | ✅ pronto (3 fases, textos prontos) |

---

## 3. ⛔ BLOQUEIO ATUAL (o que falta para o dinheiro entrar)

Apenas **2 passos**, ambos fora do código (dependem do autor):

1. **Checkout não configurado.** `CHECKOUT_URL` em `neuroped-pro.html` está **vazio**
   (`''`). Hoje o botão "Comprar" cai no WhatsApp. → Criar link de pagamento no
   **Mercado Pago** (R$ 47, estratégia de volume) e colar o link. Entrega do código
   é **manual** no início (ver `docs/PROMPT_CLAUDE_CHROME.md`).
2. **Códigos reais não gerados.** `pro-hashes.js` tem só o **lote DEMO**. → Abrir
   `gerar-licencas-pro.html` (com PIN master), gerar lote, publicar os hashes e
   cadastrar os códigos na plataforma de venda como entrega pós-pagamento.

> Depois desses 2 passos, qualquer pessoa no Brasil compra → recebe código →
> ativa o Pro no app. Porteira aberta.

---

## 4. Compliance e qualidade (blindados por testes)

- **Guards automáticos** (`scripts/test-static.mjs`, rode com `node scripts/test-static.mjs`):
  - Zero CRM divergente (só CRM-PE); endereço na forma canônica.
  - Disclaimers éticos nas telas de triagem/instrumento ("não substitui avaliação").
  - `noindex` nas páginas internas/admin.
  - Sintaxe JS de todos os módulos; links internos; SW precache íntegro; JSON-LD válido.
- **Conceitos protegidos:** TDAH e TOD nunca confundidos.
- **LGPD:** nenhum dado de paciente enviado a servidor; compartilhamento sem rastreio.

---

## 5. Fluxo de trabalho (Git)

- Branch de desenvolvimento: `claude/work-session-QPKTk`
- Deploy: merge na `main` → GitHub Pages publica.
- **Antes de qualquer commit:** `node scripts/test-static.mjs` deve dar **0 falhas**.
- Versão única: bump em `package.json`, `sw.js` (CACHE_NAME), `verificar-app.html`,
  `app-polish-mobile.js` (`__NP_VERSION`) e páginas de auditoria.

---

## 6. Comando reutilizável

`/refinar <tarefa>` (`.claude/commands/refinar.md`) — motor de refinamento recursivo
com compliance embutido. Use em qualquer sessão futura.

---

## 7. Próximos passos sugeridos (ordem de impacto)

1. **[BLOQUEIO]** Configurar checkout Kiwify + gerar códigos reais (ver §3).
2. Testar a compra de ponta a ponta (comprar → código → ativar Pro).
3. Anunciar à base regional (WhatsApp + Instagram — textos em `guia-lancamento.html`).
4. Google Search Console (indexação nacional).
5. Conteúdo educativo semanal (Gerador de Cards) → ciclo de compartilhamento.
