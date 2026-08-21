# Recuperação segura do acesso administrativo

O bootstrap do NeuroPed cria o administrador inicial a partir de `ADMIN_EMAIL` e `ADMIN_INITIAL_PASSWORD`. Uma conta existente que já possui senha **não é sobrescrita por padrão**. Uma migração única de senha só pode ser autorizada explicitamente com `ADMIN_FORCE_PASSWORD_RESET=true`; essa flag deve ser removida imediatamente após o bootstrap controlado.

## Procedimento

1. No GitHub, abra `jadsonfraga/neuroped` → **Settings** → **Secrets and variables** → **Actions**.
2. Atualize `ADMIN_EMAIL` com o e-mail administrativo correto.
3. Atualize `ADMIN_INITIAL_PASSWORD` com uma nova senha forte. Essa senha deve ser inserida diretamente no campo protegido do GitHub; não deve ser enviada pelo chat nem adicionada a arquivos.
4. Se a conta existente precisar de uma migração única de senha, defina também `ADMIN_FORCE_PASSWORD_RESET=true`; não habilite essa flag como configuração permanente.
5. Abra **Actions** → **Provision D1 backend** → **Run workflow** na branch `main`.
6. Aguarde a conclusão com sucesso. O workflow publica os secrets no projeto Pages e faz o deploy do backend. A migração de uma conta existente só ocorrerá com a flag explícita e ainda não marcada no D1; nesse caso, ela limpa bloqueio por tentativas e invalida sessões de refresh antigas.
7. Acesse `https://neuroped.pages.dev/#/login` e use o valor atual de `ADMIN_EMAIL` e a nova senha.
8. Depois de confirmar o acesso, remova `ADMIN_INITIAL_PASSWORD` e `ADMIN_FORCE_PASSWORD_RESET` do ambiente quando o bootstrap não for mais necessário. Não publique a senha em commits, logs, documentos ou mensagens.

## Se ainda aparecer “Credenciais inválidas”

Confira primeiro se o workflow `Provision D1 backend` terminou com sucesso e se foi executado a partir de `main`. Depois confirme se o e-mail usado no formulário é exatamente o valor de `ADMIN_EMAIL`, ignorando maiúsculas e minúsculas, mas sem espaços extras. Não repita muitas tentativas, porque o backend aplica bloqueio temporário após falhas consecutivas.

Se o workflow falhar por secret ausente, binding D1 ou Cloudflare, corrija o item indicado no log e execute-o novamente. A API pública já responde com banco e autenticação configurados; a falha de credencial deve ser investigada sem ativar redefinições implícitas. Use a flag explícita somente em uma migração controlada e remova-a depois.

As áreas de Receitas C1, Laudos e Agenda continuam exigindo uma sessão profissional válida. Não há instrução para desativar a proteção ou liberar dados clínicos anonimamente.
