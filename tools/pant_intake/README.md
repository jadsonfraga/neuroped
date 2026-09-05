# Portão de entrada PANT — Python

Ferramenta local de validação estrutural e documental. Issue #791. Não altera o aplicativo publicado, a API Cloudflare/D1 ou o motor PANT. Usa apenas a biblioteca padrão do Python 3.10 ou superior no núcleo; o adaptador final usa o runtime PANT externo já homologado.

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

## Adaptador PANT v5 externo

`pant_adapter.py` consome o handoff aprovado e só chama o motor depois de conferir novamente caso, rascunho, aprovação, Lei, selo, motor, QA, fontes e brasões. O repositório público não contém fontes nem brasões.

```sh
python pant_adapter.py inspect --runtime /caminho/para/runtime_pant_v5
python pant_adapter.py emit --runtime /caminho/para/runtime_pant_v5 \
  --handoff handoff.json --output documento.pdf --qa-output emissao.json
```

O runtime precisa conter `00_LEI_PANT_VIGENTE_v5.md`, `01_MOTOR_PANT_HELENA_ESTHER.py`, `00_TRAVA_ANTIRREGRESSAO.py`, `01_QA_PANT_HELENA_ESTHER.py`, `marca_capa.png`, `marca_miolo.png` e as fontes declaradas pelo motor. A Lei v5 verificada no Drive em 05/09/2026 fica presa ao SHA-256 `5c699519ed0e33dcead0ad20cd398c6c116de35f4f3d6336487fe45079b8672e` e ao selo `900cb06d69bb6da7`. Divergência bloqueia até revisão explícita; uma Lei futura exige atualizar conscientemente essa âncora, nunca aceitar um arquivo só por ser mais recente.

A saída é criada de forma exclusiva: arquivo existente nunca é substituído. O motor trabalha primeiro em diretório temporário; somente QA com `passa=true` e zero bloqueios permite gravar o PDF no destino. Falha de QA não deixa PDF final. A assinatura digital permanece etapa separada.

O adaptador não redige conteúdo clínico novo. Ele transforma em blocos de apresentação o material já aprovado na Fase 1, preserva a origem dos parágrafos e deriva marcações do ponto crítico de frases já existentes. Hipóteses e pares CID vêm do caso aprovado; ausência desses dados bloqueia em vez de completar automaticamente.

## Limites importantes

Não recomenda medicamentos nem doses. mg/kg/dia é aritmética sobre dados informados, não confirmação de segurança. Não consulta Consensus nem bases CID; exige registro de revisão quando aplicável e não autentica referências. Sinalização de risco não substitui avaliação.

Exemplos e testes são sintéticos. Use pseudônimos; o software não detecta nem anonimiza universalmente informações identificáveis. Não versionar entradas, transcrições, resultados clínicos ou segredos. Este módulo não implementa armazenamento clínico criptografado, controle de acesso multiusuário, prescrição eletrônica ou assinatura digital.

## Testes e integração

105 testes do núcleo/CLI/desktop/adaptador passaram localmente nesta revisão. A CI precisa repetir a mesma suíte no SHA atual. O adaptador também foi confrontado nesta sessão com o runtime v5 recuperado do Drive: uma prova sintética independente do código do PR foi emitida pelo motor canônico e obteve QA 10,00, zero bloqueios; esse ensaio não substitui a homologação no PCDRJADSON.

A interface Desktop portátil continua sem dependências pesadas do motor incorporadas. A instalação do runtime canônico e sua ligação à interface serão feitas no PCDRJADSON após inventário do ambiente; até lá o adaptador funciona como módulo/CLI em ambiente Python compatível.

## Rollback

Antes de merge, fechar o PR sem alterar main. Depois de eventual merge aprovado, reverter pelo fluxo normal. Nenhuma migração D1 ou alteração de dados foi realizada. Proteções de main e workflow oficial de deploy permanecem intactos.

Pendências externas e critérios de verificação: `docs/audits/BLOCKED_EXTERNAL_PANT_INPUT_2026-09-05.md` e checkpoint persistente no Google Drive.
