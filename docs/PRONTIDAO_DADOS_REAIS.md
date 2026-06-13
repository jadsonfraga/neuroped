# PRONTIDAO PARA DADOS REAIS - NeuroPed EDJ

Ultima revisao: 2026-06-13.

## Status atual

Nao pronto para processar dados reais identificaveis ate concluir os controles externos de operacao, LGPD, deploy e rotacao de segredos.

## Criterios blocantes

- [ ] HTTPS obrigatorio em toda a aplicacao.
- [ ] API oficial autenticada com sessoes nominais e autorizacao server-side por paciente/resultado.
- [ ] `NEUROPED_MASTER_KEY` unico por ambiente e guardado apenas no provedor de secrets.
- [ ] `NEUROPED_JWT_SECRET` unico por ambiente e guardado apenas no provedor de secrets.
- [ ] Senha admin temporaria trocada no primeiro login e `ADMIN_INITIAL_PASSWORD` removido do ambiente.
- [ ] Banco de dados com criptografia em repouso, backup e restauracao testada.
- [ ] `NODE_ENV=production` e `CORS_ORIGINS` restrito aos dominios oficiais.
- [ ] Nenhum segredo em codigo-fonte, logs, scripts ou historico publicado.
- [ ] Historico Git reescrito para remover segredos antigos.

## Controles removidos

O PIN master e qualquer hash de PIN no frontend foram desativados. Eles nao substituem autenticacao real e nao devem ser reintroduzidos para dados clinicos.

## LGPD e operacao

- [ ] Politica de privacidade publicada e revisada.
- [ ] Base legal para dados de saude documentada.
- [ ] Consentimento e direitos do titular operacionalizados.
- [ ] Plano de resposta a incidentes documentado.
- [ ] DPO/encarregado e canal de contato definidos.
- [ ] Monitoramento, alertas e auditoria operacional ativos.

## Proximos passos prioritarios

1. Rotacionar todos os segredos que ja apareceram no repositorio.
2. Reescrever o historico Git antes de publicar ou compartilhar o repositorio.
3. Validar ambiente de producao com API oficial autenticada, nao apenas frontend estatico.
4. Testar backup, restauracao e plano de resposta a incidente.
