# Saneamento de historico Git

## Objetivo

Remover artefatos antigos sensiveis do historico publico, quando necessario.

## Importante

Esta etapa exige execucao local ou ambiente CI controlado. Reescrever historico altera SHAs e pode quebrar clones existentes.

## Ferramentas

- git filter-repo
- BFG Repo-Cleaner

## Procedimento sugerido com git filter-repo

```bash
git clone --mirror git@github.com:jadsonfraga/neuroped.git
cd neuroped.git

git filter-repo --path assets/certificado-digital-DHQYeKcD.js --invert-paths
git filter-repo --path assets/receita-eletronica-CyOI5NKF.js --invert-paths

git push --force --mirror
```

## Depois do force-push

1. invalidar caches locais;
2. avisar colaboradores;
3. recriar clones;
4. rotacionar qualquer segredo que possa ter sido exposto;
5. verificar novamente com busca no GitHub.

## Alternativa conservadora

Se nao houver segredo real exposto, manter historico e garantir que o deploy publique apenas `dist/`. Esta e a situacao atual apos o rebuild.
