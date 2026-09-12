# PR #851 — logout e gate visual

Sincronizada com main af515513 (merge e360006f). O gate expôs dois problemas:
run 34694699906 encontrou dois button-session-enter; run 34694699904 tentou
avaliar layout durante o reload. O controle oculto da sidebar deixa de ser
montado na rota de login; ProductChrome preserva o convite funcional ao campo.
O teste aguarda o evento load após o clique e então verifica presença de Entrar
com seletor estrito e ausência de Sair. Nenhuma assertiva foi retirada.

node tests/unit/product-signature.test.mjs, npm run check e npm run lint:
exit 0 local. O gate completo de navegador será reexecutado no novo HEAD;
a prova visual anterior verde não substitui essa nova execução.
Rollback: reverter somente este commit; nenhuma mudança de autenticação/API.
