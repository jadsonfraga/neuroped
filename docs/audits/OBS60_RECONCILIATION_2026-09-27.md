# OBS-60 — reconciliação após reconstrução do checkout

Data: 27 de setembro de 2026.
Base: main `90829a2b716624e87215d60ac4b636ca3c225010`, merge da PR #1023.
Branch preservada: `claude/obs-60-neuroped-module-28nyqy` em
`b206820a02a49c15e3f6e7354727fd448a10f2ee`.

## Descoberta e procedência

O bundle do run `36345759842`, artifact `10940322712`, recuperou o histórico
completo alcançável dos quatro refs declarados. Hash do ZIP conferido,
SHA256SUMS do pacote aprovados, clone offline e git fsck executados com
sucesso no novo ambiente. A captura identificou um commit adicional na
branch Claude, posterior ao `4a47f451...` recuperado durante a PR #1023.
Nenhuma branch original foi apagada, resetada ou sobrescrita.

## Mudanças selecionadas

Quatro arquivos são reconciliados sobre o main, mantendo os guards atuais:

- Obs60Panel: estado explícito de conversão do arquivo para impedir nova
  ação enquanto a gravação é preparada; limpeza por geração e anúncio de
  conclusão para tecnologia assistiva.
- Transporte: distinguir cancelamento do cliente (REQUEST_ABORTED, 499) de
  timeout do processamento (VIDEO_TIMEOUT, 504), com limpeza do timer e
  listener. O bloqueio de MIME não textual introduzido no main é preservado.
- Contrato: rejeitar vocabulário diagnóstico/escores e percentuais no canal
  livre de transcrição; preservar a validação estrita de ajuda como string.
- Testes: oito casos adicionais do commit recuperado, incluindo evidência
  ausente, limites da síntese, resposta fragmentada e cancelamento em curso.

O filtro lexical é conservador, não valida a percepção da IA e pode rejeitar
fala literal legítima que contenha os termos listados. Rejeição significa
resultado não disponibilizado e necessidade de revisão; não é diagnóstico,
não autoriza alterar a fala e não prova ausência de outras extrapolações.

## Decisão sobre a auditoria

O commit original também propõe ignorar exceções na escrita dos eventos de
conclusão/falha. Essa parte NÃO foi portada: o endpoint e seus testes de
integração permanecem idênticos ao main, que não devolve análise concluída
quando a auditoria exigida falha. Não foi removida asserção de teste canônico.
O commit original completo e seus testes continuam preservados no Git e no
bundle; preservar história não obriga a aplicar toda mudança sem revisão.

A nota histórica sobre smoke S13 permanece na branch original, fora do
escopo OBS-60. Não foi declarada resolvida por esta reconciliação.

## Validação efetivamente executada

Node 22.16.0, no checkout reconstruído, comando:

```sh
node --experimental-strip-types --test tests/unit/obs60.test.mjs tests/unit/obs60-mount-static.test.mjs tests/unit/obs60-input-shape.test.mjs
```

Resultado local: 54 testes passaram, zero falhas, zero omissões; exit code 0.
Controles de reconstrução: 46 passaram no código integrado anterior e 47
na branch Claude isolada. Esses conjuntos se sobrepõem; não devem ser
somados como casos independentes.

As provas de middleware/SQLite, typecheck, lint, frontend compilado e
navegador exigem confirmação do CI no novo head. O workflow OBS60 existente
já cobre os quatro caminhos alterados. A existência deste registro não
antecipa sucesso de CI, merge, deploy ou ativação do provedor.

## Liberação e rollback

Merge e deploy foram reservados ao usuário. Esta mudança não os executa,
não configura segredos, não habilita IA externa e não adiciona migrations.
Os bloqueios externos de vídeo/provedor e revisão institucional continuam
em `BLOCKED_EXTERNAL_OBS60_VIDEO_AI.md`.

Rollback: reverter somente esta PR de reconciliação; preservar #1023 e a
branch histórica. Revalidar os gates antes de publicar qualquer reversão.
