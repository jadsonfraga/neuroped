# Portão de entrada PANT — Python

Ferramenta local de validação estrutural e documental. Issue #791. Não altera o aplicativo publicado, a API Cloudflare/D1 ou o motor PANT. Usa apenas a biblioteca padrão do Python 3.10 ou superior; execução local aferida no Python 3.13.5.

## Executar

```sh
cd tools/pant_intake
python run_gate.py --input exemplos/caso_demo_pronto.json
python run_gate.py --template --output caso_novo.json
python -m unittest discover -s tests -v
```

Saída 0: validação não bloqueante. Saída 2: bloqueio de entrada. Saída 1: falha de leitura/formato/escrita. Arquivos existentes não são sobrescritos.

## Contrato

`neuroped.intake.v1` conserva fontes, dados confirmados, hipóteses, medicações, terapias, pendências e riscos explicitamente registrados. `empty_case()` produz uma entrada vazia, não um atendimento preenchido. Cada achado tem `text`, `source_id` e `review_status`; só `confirmado` libera achado para a passagem de entrada. Ausência, negativa e não avaliação não são intercambiáveis.

`validate()` retorna `PRONTO`, `GERAVEL_COM_RESSALVAS` ou `BLOQUEADO`. A pontuação é apenas a proporção de verificações preenchidas; não é escala validada, medida de qualidade médica, verificação de critérios diagnósticos ou autorização para conduta. O mesmo caso pode ter conjuntos de verificações diferentes conforme a finalidade. Não comparar percentuais de finalidades distintas como desempenho clínico.

`import_notes()` aceita o contrato `TranscriptSegment` de `shared/notes/types.ts`, conferido no SHA `1b23a93f42fc5facfc49e04300a7d4771ae16652`. Bloqueia mistura de consultas e versões divergentes do mesmo segmento. Não atribui normalidade a exame ausente, não transforma inferência em observação e não infere doses/diagnósticos. Todo trecho importado começa pendente. É importação de JSON: não é gravação de microfone, ASR, integração Heidi ou serviço de transcrição.

`draft_documents()` compila somente conteúdo fornecido e mantém pendências fora do texto. São rascunhos de conferência, não documentos institucionais prontos ou receituários válidos. Códigos e referências têm presença verificada, não autenticidade/correção clínica.

`approve_text()` exige declaração expressa de aprovação e vincula o texto/dados por hash. A identificação digitada do médico é declaração local, não autenticação, prova de autoria, certificado ou assinatura digital. Qualquer alteração invalida a aprovação. `handoff()` produz um contrato intermediário, não os argumentos finais `render(CAPA, CORPO)`. Retorna intencionalmente `PENDENTE_ADAPTADOR_CANONICO` e `final_pdf_emitted=false`.

## Limites importantes

Não recomenda medicamentos nem doses. mg/kg/dia é aritmética sobre dados informados, não confirmação de segurança. O limiar de 90 dias para alertar sobre a data do peso é operacional, não diretriz clínica universal. Não consulta Consensus nem bases CID; exige registro de revisão quando aplicável e informa que não autentica referências. Sinalização de risco não substitui avaliação nem fornece diagnóstico automático.

Exemplos e testes são sintéticos. Use pseudônimos; o software não detecta nem anonimiza universalmente informações identificáveis. Não versionar entradas, transcrições, resultados clínicos ou segredos. Este módulo não implementa armazenamento clínico criptografado, controle de acesso multiusuário, prescrição eletrônica ou distribuição de documentos.

## Testes e integração

67 testes do núcleo/CLI executados localmente. O workflow específico roda a mesma suíte; seu resultado remoto deve ser conferido no PR. Não foram executados `npm ci`, lint, check, build ou verify do aplicativo completo nesta sessão; o aplicativo não foi modificado. Os 111 testes do pacote local ampliado não equivalem a 111 testes deste PR.

O piloto de interface local, pré-consulta, briefing e métricas foi entregue separadamente, fora deste PR de escopo único. Não existe endpoint Python de produção novo.

## Rollback

Antes de merge, fechar o PR sem alterar main. Depois de eventual merge aprovado, reverter seu commit pelo fluxo normal; remover apenas `tools/pant_intake`, seu workflow e o registro de auditoria adicionado. Nenhuma migração D1 ou alteração de dados foi realizada. Proteções de main e workflow oficial de deploy permanecem intactos.

Pendências externas e critérios de verificação: `docs/audits/BLOCKED_EXTERNAL_PANT_INPUT_2026-09-05.md`.
