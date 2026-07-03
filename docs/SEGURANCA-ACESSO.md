# Segurança de acesso — Público × Médico

## O que já está feito (nível 1 — tranca de UI)

- **Separação por rota** (`client/src/lib/publicRoutes.ts`): seguro por padrão —
  só a allowlist pública abre sem PIN; todo o resto é área médica.
- **PIN só na área médica** (`PrivateGate` ciente de rota). Famílias acessam o
  conteúdo aberto sem senha; profissional entra com PIN.
- **Guard de CI** (`validate:public`) impede que rotas clínicas (receita,
  prontuário, escalas…) caiam na lista pública por engano.
- **PIN protegido**: hash guardado em *secret* (`VITE_PIN_HASH`), PBKDF2 310k
  iterações, bloqueio após 5 tentativas com espera exponencial.

## A verdade honesta (por que isso ainda NÃO é "impossível de hackear")

Este app é um **site estático** (Pages/Cloudflare/Vercel). Nesse modelo:

1. **O conteúdo médico já é baixado pelo navegador** dentro do JS. O PIN esconde
   a *tela*, não o *conteúdo*: quem sabe abrir o bundle lê as escalas mesmo sem o
   PIN.
2. **Roteamento por hash** (`#/filtro`): o servidor só vê `/`. Logo, um firewall
   de borda não consegue distinguir rota pública de médica no mesmo domínio.

Conclusão: tranca de cliente é **ofuscação**, não isolamento. Para segurança de
verdade, o conteúdo médico precisa ser **entregue pelo servidor só após login**.

## Nível 2 (recomendado, segurança REAL de borda) — Cloudflare Access

Ideia: publicar a **área médica num subdomínio próprio** protegido por Cloudflare
Access (Zero Trust). O conteúdo nem chega a quem não autenticou.

1. **Subdomínio médico**: crie um projeto/host separado, ex. `med.seudominio` (ou
   um segundo Cloudflare Pages), servindo o build do app. O domínio público atual
   continua aberto só com o conteúdo das famílias.
2. **Cloudflare Zero Trust → Access → Applications → Add self-hosted**:
   - Application domain: `med.seudominio`.
   - Session duration: ex. 24h.
3. **Policy**: *Allow* apenas o seu e-mail (regra "Emails" → seu e-mail). Método
   de login: **One-time PIN por e-mail** (não precisa de conta) ou Google.
4. Pronto: abrir `med.seudominio` exige login verificado **no servidor da
   Cloudflare** antes de qualquer arquivo ser servido. Impossível burlar pelo
   navegador, e a "senha" nunca vai no bundle.

> Enquanto o Nível 2 não existe, mantenha o conteúdo verdadeiramente sensível
> (dados de pacientes reais) **fora** do site estático.

## Nível 3 (máximo) — backend com autenticação

Mover catálogo e dados médicos para trás de uma API autenticada (ex.: Supabase
Auth + Postgres). O cliente só recebe o que o servidor liberar após login. Maior
esforço, controle total, e o único modelo adequado para **dados de pacientes**.

## Higiene do PIN (faça agora)

- **Mantenha o PIN só no secret** `VITE_PIN_HASH` (GitHub → Settings → Secrets →
  Actions) e na env do projeto Vercel — nunca no fallback público do workflow.
- **Use PBKDF2** (formato `pbkdf2$310000$salt$hash`), não SHA-256 cru.
- **PIN longo**: 6 dígitos são força-bruta-veis; prefira 10+ caracteres
  alfanuméricos. Aí, mesmo que o hash vaze, quebrar fica inviável.
