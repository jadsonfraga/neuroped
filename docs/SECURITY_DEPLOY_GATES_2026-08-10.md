# Gate pós-deploy — certificado ICP aposentado

Data: 10 de agosto de 2026

Após cada `Deploy Cloudflare Pages` concluído com sucesso na `main`, o workflow `Certificate retirement smoke` verifica no ambiente publicado que `/api/cert` continua retornando HTTP 410 e o código `CERT_ENDPOINT_RETIRED`.

O objetivo é impedir regressão silenciosa do antigo mecanismo de distribuição remota de certificado. O teste não acessa, armazena nem imprime certificados ou senhas.

A remoção/rotação de secrets no GitHub e a revogação formal de credenciais históricas continuam dependentes de evidência administrativa do provedor e não são inferidas a partir do código.
