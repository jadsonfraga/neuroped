# Certificado A1 pessoal: cadastro único, autorização por documento

Escopo: Laudo NeuroPed, Laudo Super e Receita C1 (painel compartilhado) e C1 Express. Nenhum fluxo é habilitado automaticamente por login. Os bloqueios clínicos e de receita já existentes continuam em vigor. Formulários A/B e integração Mevo, Renderizador PANT e demais emissores não passam a usar este painel com esta alteração.

No app autenticado, o titular seleciona o arquivo oficial do dispositivo, marca "Memorizar na conta", digita a senha no navegador e clica em "Verificar certificado". Só o envelope cifrado sai do navegador: PBKDF2-SHA256 + AES-GCM com sal e IV novos, vinculado ao ID da conta. O PFX e a senha nunca integram o payload. A remoção do certificado da conta está disponível no painel. Não há fallback automático para o cofre do aparelho em modo remoto; uma falha no cofre é exibida ao usuário.

Cada verificação ou assinatura consome a senha digitada. O campo é limpo antes da operação assíncrona, inclusive quando falha. O envelope é aberto novamente em cada ação; o buffer temporário é descartado ao término. Enter no campo de senha não assina. Login, cadastro, aprovação clínica, clique para assinar e conferência externa são etapas distintas. Uma sessão substituída não pode gravar um envelope pendente ou baixar o resultado pendente.

QA local: testes do cofre cifrado (carga útil, senha errada/ausente, troca de conta/sessão), suíte clínica com validação criptográfica de artefatos sintéticos, lint, TypeScript e Chromium com o painel real e backend simulado. No Chromium, o PFX foi gerado para a prova: cadastrou, restabeleceu em um novo contexto, zerou o campo após erro e depois de assinar, não assinou com Enter e baixou um PDF cuja integridade foi verificada. Não foi usado certificado real ou dado clínico.

O teste não prova cadeia ICP-Brasil, identidade do prescritor nem aceitação pela farmácia. Após o eventual release, a conferência depende de conferência externa da assinatura do titular e de homologação específica da modalidade de receita. Não registrar a senha em chat, repositório ou logs.
