# Secretaria IA — arquitetura de reconstrução

## Finalidade

A rota pública `#/marcacao` substituirá o microsite externo de Secretaria IA por uma porta de entrada administrativa integrada ao Neuroped. Ela orientará a família para **agendar**, **remarcar/cancelar uma reserva existente** ou **tirar dúvidas sobre o processo**, sem oferecer diagnóstico, urgência clínica, prescrição, interpretação de exames ou coleta de relato clínico livre.

## Limite de dados e segurança

O fluxo reutilizará exclusivamente a API já existente em `/api/public-booking`. Os únicos dados submetidos serão os campos mínimos já contratados pelo serviço de agenda: nome da criança, nome do responsável, telefone ou e-mail, serviço e horário, mediante aceite de privacidade. Não haverá campo de sintomas, diagnóstico, medicamento, laudo ou transcrição de conversa.

As operações administrativas da equipe continuarão exclusivamente em `/api/operations`, com autenticação obrigatória. A rota pública não terá subrotas herdando acesso: `PUBLIC_ROUTES` continuará usando correspondência exata para `"/marcacao"`.

## Publicação das funções

O frontend está publicado pelo Cloudflare Pages. Como a agenda pública reside em `functions/api/public-booking.ts`, o workflow precisa enviar explicitamente o diretório `functions` no comando de deploy Pages. Essa inclusão permitirá que `#/agendar` e a nova Secretaria IA usem a mesma API e o mesmo D1, em vez de depender de um serviço externo.

## Critérios de aceite

| Critério | Verificação |
| --- | --- |
| Rota pública | `#/marcacao` abre sem PIN e sem carregar conteúdo clínico. |
| Privacidade | O fluxo exibe aviso explícito e nunca apresenta campo clínico livre. |
| Encaminhamento | Agendar, consultar reserva e suporte administrativo levam a ações existentes e auditáveis. |
| Backend | `/api/public-booking` responde no domínio Cloudflare após a publicação. |
| Operações internas | `/api/operations` permanece autenticada. |
