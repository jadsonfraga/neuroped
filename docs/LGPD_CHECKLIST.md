# LGPD Checklist — NeuroPed SDG

## Estado atual

O NeuroPed SDG está em modo de homologação estática. Não deve ser usado com dados clínicos reais sem backend seguro e política formal.

## Classificação de dados

### Públicos

- Conteúdo educativo.
- Guias familiares.
- CAA sem identificação clínica.
- Mapas e filtros informativos.

### Familiares não sensíveis

- Preferências locais.
- Rascunhos educativos.
- Passe familiar para conteúdo não sensível.

### Sensíveis

- Prontuário.
- Laudos.
- Prescrições.
- Relatórios clínicos.
- Mensagens clínicas.
- Dados identificáveis de pacientes.

## Regras obrigatórias

- Não usar dados reais sem consentimento e base legal.
- Não armazenar dado sensível em localStorage sem criptografia.
- Não cachear documento clínico sensível.
- Não expor credenciais no frontend.
- Não usar PIN frontend como segurança real de produção.
- Não enviar dados reais para embeddings ou IA externa sem política formal.

## Antes de produção

- Autenticação real.
- Sessão segura.
- Controle por perfil.
- RLS ou regra equivalente.
- Criptografia em repouso e trânsito.
- Backup.
- Logs de auditoria.
- Política de privacidade.
- Termos de uso.
- Processo de revogação de acesso.
- Treinamento da equipe.

## Veredito atual

Apto para demonstração e homologação sem dados reais. Não apto para produção com dados clínicos reais.
