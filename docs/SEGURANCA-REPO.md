# Segurança & limites estruturais — leitura antes de divulgar amplo

Fechamento das 5 últimas críticas. Algumas têm correção de código; outras são
**limites estruturais** que só um backend (ou uma decisão sua) resolve. Aqui está
o estado honesto de cada uma.

## 1) Histórico público do git  ⚠️ (sua decisão)
O `strip-private.mjs` tira os sensíveis do **deploy**, e o HEAD do repositório já
foi limpo dos hashes. **Mas o HISTÓRICO do git ainda contém** os arquivos
removidos e segredos antigos (PIN `REMOVIDO`, hashes), legíveis por `git show`.

- **Tornar o repo privado NÃO é solução simples:** o GitHub Pages no plano grátis
  exige repo **público** — privar derruba o site.
- **Solução real:** reescrever o histórico com **`scripts/purge-history.sh`**
  (usa `git-filter-repo`). É **destrutivo** (`push --force`, quebra clones/forks).
  Por isso **não roda em CI** — execute conscientemente, com backup.
- **De todo modo:** considere o PIN antigo **comprometido** e use um novo no build
  privado. A purga reduz exposição; não substitui rotação.

## 2) Pro "vende sem entregar"  ✅ (mitigado)
O checkout não estava configurado (`CHECKOUT_URL=''`) → o botão já caía em
**WhatsApp (venda manual)**. Adicionamos um **aviso de pré-lançamento** claro na
landing: acesso por contato, **sem cobrança automática** nesta etapa. Decisão
pendente sua: ligar um checkout/entrega real (precisa de backend) ou manter manual.

## 3) Instrumentos autorais não validados  ⚠️ (transparência)
É a **natureza declarada** do produto: triagem **orientadora, não normatizada**,
que **não diagnostica**. Já há aviso de natureza em cada instrumento, corredor de
crise nos rastreios de risco e a página `sobre-natureza.html`. Validação externa
(amostra, sensibilidade/especificidade, revisão por pares) é **projeto de
pesquisa**, fora do escopo de código — não dá para "resolver" no app.

## 4) Client-only / dispositivo compartilhado  ⚠️ (mitigado ao limite)
Sem backend, dados ficam no `localStorage` do aparelho. Mitigações **possíveis**
já no app: consentimento LGPD, botão 🛡️ com **exportar/apagar**, e um lembrete de
**dispositivo compartilhado** (apague ao sair). Segurança/persistência regulada
de verdade (auth, RLS, retenção, auditoria) **exige backend** — próximo passo.

## 5) Retrô  ✅ (sob controle do usuário)
Já restrito às telas infantis. Agora há **controle do usuário**: botão 🎮 nas
telas lúdicas e `window.npRetro.{on,off,toggle}` (preferência persistente). Quem
não quiser, desliga.

---

### Resumo
- **Código:** #2, #4, #5 fechados ao limite do possível; HEAD limpo (#1).
- **Sua decisão (não-código):** rodar a purga de histórico (#1) e definir o modelo
  Pro (#2). 
- **Estrutural (precisa de backend/pesquisa):** segurança real (#4) e validação
  científica (#3).
