# Recuperação segura do acesso administrativo

O bootstrap do NeuroPed cria o administrador inicial a partir de `ADMIN_EMAIL` e `ADMIN_INITIAL_PASSWORD`. A partir desta correção, ele também executa uma **migração única** para uma conta existente quando o marcador `auth.admin.bootstrap.v2` ainda não está no D1. Isso corrige o cenário em que a conta foi criada com uma senha anterior e o secret foi alterado depois, sem sobrescrever a senha em todos os logins.

## Procedimento

1. No GitHub, abra `jadsonfraga/neuroped` → **Settings** → **Secrets and variables** → **Actions**.
2. Atualize `ADMIN_EMAIL` com o e-mail administrativo correto.
3. Atualize `ADMIN_INITIAL_PASSWORD` com uma nova senha forte. Essa senha deve ser inserida diretamente no campo protegido do GitHub; não deve ser enviada pelo chat nem adicionada a arquivos.
4. Abra **Actions** → **Provision D1 backend** → **Run workflow** na branch `main`.
5. Aguarde a conclusão com sucesso. O workflow publica os secrets no projeto Pages e faz o deploy do backend. Na primeira chamada ao login, o bootstrap atualiza a senha da conta existente uma única vez, limpa bloqueio por tentativas e invalida sessões de refresh antigas.
6. Acesse `https://neuroped.pages.dev/#/login` e use o valor atual de `ADMIN_EMAIL` e a nova senha.
7. Depois de confirmar o acesso, remova `ADMIN_INITIAL_PASSWORD` do ambiente quando o bootstrap inicial não for mais necessário. Não publique a senha em commits, logs, documentos ou mensagens.

## Se ainda aparecer “Credenciais inválidas”

Confira primeiro se o workflow `Provision D1 backend` terminou com sucesso e se foi executado a partir de `main`. Depois confirme se o e-mail usado no formulário é exatamente o valor de `ADMIN_EMAIL`, ignorando maiúsculas e minúsculas, mas sem espaços extras. Não repita muitas tentativas, porque o backend aplica bloqueio temporário após falhas consecutivas.

Se o workflow falhar por secret ausente, binding D1 ou Cloudflare, corrija o item indicado no log e execute-o novamente. A API pública já responde com banco e autenticação configurados; a falha de credencial, portanto, costuma indicar divergência entre o secret configurado e a conta existente ou uma senha antiga persistida antes da correção.

As áreas de Receitas C1, Laudos e Agenda continuam exigindo uma sessão profissional válida. Não há instrução para desativar a proteção ou liberar dados clínicos anonimamente.
