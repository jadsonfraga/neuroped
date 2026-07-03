# Deploy em duas zonas: pública (famílias) × médica (Cloudflare Access)

Objetivo: **conteúdo educativo aberto** para as famílias num host, e **área
médica protegida no servidor** (edge) num subdomínio — segurança real, não só
tranca de UI.

Por que subdomínio: o app usa roteamento por **hash** (`#/rota`); o servidor só
vê `/`, então o Cloudflare Access só consegue proteger por **hostname**. Logo, a
área médica precisa de um **host próprio**.

---

## Passo 1 — Host público (famílias)

Deploy normal do repositório, com a env:

```
VITE_ZONE=public
VITE_MEDICAL_URL=https://medico.SEUDOMINIO.com   # opcional, p/ linkar
```

Efeito: sem PIN; o menu mostra só o conteúdo aberto; rotas médicas exibem
"Área do profissional" apontando para o subdomínio. (Nota: o código médico ainda
existe no bundle — o isolamento forte vem do Passo 2. Um build público enxuto é
melhoria futura.)

## Passo 2 — Subdomínio médico + Cloudflare Access

1. **Crie o subdomínio** `medico.SEUDOMINIO.com` apontando para um deploy do app
   com env:
   ```
   VITE_ZONE=medical
   VITE_PIN_HASH=<verificador PBKDF2 do seu PIN forte>   # ver docs/SEGURANCA-ACESSO.md
   ```
2. **Cloudflare Dashboard → Zero Trust → Access → Applications → Add → Self-hosted**
   - *Application domain:* `medico.SEUDOMINIO.com`
   - *Session duration:* 24h
3. **Policy** → *Allow* → Include → **Emails** → só o seu e-mail.
4. **Login method:** One-time PIN (código por e-mail) e/ou Google.
5. Salvar. Agora abrir `medico.SEUDOMINIO.com` **exige login verificado no edge
   da Cloudflare antes de qualquer arquivo ser servido** — impossível burlar pelo
   navegador, e nenhuma senha vai no bundle.

## Passo 3 — Backend de dados (se for guardar pacientes reais)

- As `functions/api/*` (login JWT, consultations, audit-log) rodam no
  **Cloudflare Pages** do subdomínio médico.
- Configure os secrets: `NEUROPED_JWT_SECRET`, `DB` (D1), `CORS_ORIGINS` (só o
  subdomínio médico), e `DEMO_API_WRITES_ENABLED=true` **somente** quando a
  conformidade LGPD estiver pronta (ver docs/LGPD-CHECKLIST.md).
- Mantenha a API **somente-leitura** até então (é o padrão atual).

---

## Resumo

| | Host público | Subdomínio médico |
|---|---|---|
| Env `VITE_ZONE` | `public` | `medical` |
| PIN | não | (opcional) + **Cloudflare Access** |
| Conteúdo | educativo/famílias | clínico completo |
| Proteção real | — | **Access no edge** + login JWT |
| Divulgar a pacientes | ✅ o link público | ❌ nunca o médico |
