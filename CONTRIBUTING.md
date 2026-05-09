# Contribuindo

Software medico exige rigor maior que projetos genericos. Leia tudo antes de abrir PR.

## Quem pode contribuir

- Profissionais de saude com registro ativo (revisao clinica)
- Desenvolvedores convidados pelo CODEOWNER
- Pesquisadores da area de saude digital

## Setup dev

```bash
git clone <repo>
cd "NeuroPed Escalas de Neuropedia"
cp .env.example .env
# Editar .env com valores de dev
npm install
npm run dev
```

## Branch model

- `main` — producao, protegida
- `feat/<descricao>` — feature em desenvolvimento
- `fix/<descricao>` — correcao
- `chore/<descricao>` — manutencao
- `docs/<descricao>` — apenas documentacao

## Commit convention

Inspirado em Conventional Commits:

- `feat:` nova feature
- `fix:` correcao
- `chore:` manutencao
- `docs:` documentacao
- `refactor:` refatoracao sem mudanca funcional
- `test:` testes
- `security:` correcao de seguranca (descreva privadamente antes)

Exemplos:
- `feat: add LGPD export request endpoint`
- `fix: prevent timing attack in password verify`
- `security: rotate JWT secret on every deploy`

## PR checklist

Todo PR precisa:

- [ ] Build passa (`npm run build`)
- [ ] TypeScript sem erros (`npm run check`)
- [ ] Lint sem warnings
- [ ] Sem segredos commitados (git secrets ou similar)
- [ ] Sem dados de paciente reais (anonimizar testes)
- [ ] Documentacao atualizada se mudou API publica
- [ ] CHANGELOG atualizado se mudanca user-facing
- [ ] Audit log adicionado se evento sensivel novo

## Codigo clinico

Funcoes que calculam scores ou interpretam escalas DEVEM ter:

```ts
/**
 * @clinical-source <citacao primaria>
 * @scale-version <versao>
 * @last-clinical-review <data>
 */
```

Sem isso, o PR sera bloqueado.

## Seguranca

- Nunca commitar `.env`, segredos, tokens
- Nunca log de senha, mesmo em desenvolvimento
- Validar entrada com Zod antes de qualquer operacao
- Escapar saida em templates (React faz por padrao)
- Adicionar audit log para qualquer endpoint que toque dado sensivel

Se descobrir vulnerabilidade, NAO abra PR publica. Use o canal privado em SECURITY.md.

## Estilo

- Prettier config oficial
- ESLint config oficial
- TypeScript strict
- Imports ordenados (auto via Prettier)

## Testes

Cobertura minima:
- 90% em codigo de cripto, auth, audit
- 70% global

Rode `npm run test` antes de abrir PR.

## Deploy

PRs em main disparam deploy automatico (em producao). PRs em branches feature criam preview environments (se provedor suportar).

## Contato

- Code review: marcar @jadsonfraga
- Duvidas tecnicas: abrir issue
- Duvidas clinicas: contato direto
- Seguranca: ver SECURITY.md

---

Atualizado: 2026-05-07.
