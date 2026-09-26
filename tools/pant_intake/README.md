# Portão de entrada PANT — Python

Ferramenta local de validação estrutural e documental. Issue #791. Não altera o aplicativo publicado, a API Cloudflare/D1 nem a autoridade PANT. O núcleo usa apenas a biblioteca padrão do Python 3.10 ou superior.

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

`validate()` retorna `PRONTO`, `GERAVEL_COM_RESSALVAS` ou `BLOQUEADO`. A pontuação é apenas a proporção de verificações preenchidas; não é escala validada, medida de qualidade médica, verificação de critérios diagnósticos ou autorização para conduta.

`import_notes()` aceita o contrato `TranscriptSegment` de `shared/notes/types.ts`. Bloqueia mistura de consultas e versões divergentes do mesmo segmento. Não atribui normalidade a exame ausente, não transforma inferência em observação e não infere doses/diagnósticos. Todo trecho importado começa pendente.

`draft_documents()` compila somente conteúdo fornecido e mantém pendências fora do texto. `approve_text()` exige declaração expressa de aprovação e vincula texto/dados por hash. A identificação digitada do médico é declaração local, não autenticação, certificado ou assinatura digital. Qualquer alteração invalida a aprovação. `handoff()` produz `neuroped.pant_handoff.v1`, ainda com `final_pdf_emitted=false`.

## Autoridade PANT V12

A autoridade vigente é exclusivamente **PANT V12**. O intake/desktop deste diretório prepara e valida dados e rascunhos; **não é um renderizador clínico V12** e não deve emitir PDF final.

O antigo `pant_adapter.py` permanece apenas como **tombstone fail-closed** para compatibilidade de imports. Qualquer chamada a `inspect_runtime()`, `emit_pant()` ou ao CLI termina com `PANT_LEGACY_ADAPTER_RETIRED_USE_V12`. Não existe fallback para arquitetura anterior.

Um executor final só pode ser considerado apto quando demonstrar, por execução real, todos os gates da autoridade V12: leitura viva BUS→CURRENT, verificação dos assets/hash, aprovação médica explícita ligada aos bytes exatos, QA de fonte e PDF com zero bloqueios, inspeção visual e readback do provedor. Ausência do runtime V12 ou falha de qualquer gate significa **STOP**, nunca retorno a runtime antigo ou renderização Windows.

## Limites importantes

Não recomenda medicamentos nem doses. mg/kg/dia é aritmética sobre dados informados, não confirmação de segurança. Não consulta Consensus nem bases CID; exige registro de revisão quando aplicável e não autentica referências. Sinalização de risco não substitui avaliação.

Exemplos e testes são sintéticos. Use pseudônimos; o software não detecta nem anonimiza universalmente informações identificáveis. Não versionar entradas, transcrições, resultados clínicos ou segredos. Este módulo não implementa armazenamento clínico criptografado, controle de acesso multiusuário, prescrição eletrônica ou assinatura digital.

## Desktop Windows

A interface Desktop portátil continua limitada a intake/rascunhos. O smoke test exige `final_pdfs_emitted == 0`. O executável Windows não deve ser tratado como renderizador PANT e não autoriza emissão clínica final.

## Testes e integração

A suíte contém uma catraca antirregressão específica para impedir a ressurreição do runtime legado no `pant_adapter.py`. A CI também verifica marcadores proibidos no módulo e nesta documentação.

A integração de um executor V12 real deve ocorrer em trabalho separado, depois de homologação do runtime e dos gates do `pant_v12_guard.py`. Até lá, este repositório não possui via autorizada de renderização final PANT.

## Rollback

Reverter este tombstone só é aceitável mediante nova decisão explícita que substitua a autoridade V12. Rollback técnico comum não deve reativar runtime legado, fallback ou emissão Windows.

Pendências externas e critérios de verificação históricos permanecem documentados em `docs/audits/BLOCKED_EXTERNAL_PANT_INPUT_2026-09-05.md`.
