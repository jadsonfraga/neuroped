# NeuroPed OBS-10 — pré-consulta por faixa etária

Versão do conteúdo: **1.0.0 — 17/09/2026**. Issue #893; PR #894.

## Entrada no aplicativo

Rota interna: `/#/avaliacao-pre-consulta-faixa-etaria`.

Rótulo solicitado pelo proprietário, preservado literalmente: **Avaliação de Pré-Consulta por Fachetária**. A funcionalidade aparece nos destaques e na seção **PRÉ-CONSULTA GUIADA**. A Sonda Dez e seus redirecionamentos continuam independentes e intactos.

Papéis remotos permitidos: `admin`, `professional`, `operator`. `reader` e usuário anônimo não recebem acesso. O modo local mantém as exigências de PIN configurado/desbloqueado que já existem no produto; nenhuma rota pública foi acrescentada.

## O que a assistente faz

1. Informa código institucional, anos e meses completos. A ficha é selecionada automaticamente. A idade corrigida só é utilizada quando informada pela equipe, antes de 24 meses e nunca maior que a cronológica. As 13 fichas podem ser consultadas sem iniciar ou alterar a idade da sessão.
2. Separa os materiais e confirma autorização institucional, participação/conforto, treinamento, disponibilidade do médico, segurança e enquadramento/áudio. Estas confirmações operacionais **não substituem** o termo institucional ou a avaliação de elegibilidade clínica.
3. Escolhe filmagem externa em outro dispositivo institucional ou câmera/microfone local compatíveis. Permissão negada não inicia a sessão. A preparação não integra o cronômetro.
4. Inicia a aplicação. Seis blocos: 00:00–00:30 acolhimento; 00:30–02:00 interação; 02:00–04:00 linguagem/cognição; 04:00–06:30 movimento; 06:30–08:30 mãos/grafismo; 08:30–10:00 retomada/encerramento. Pausas e transições após o início contam no limite.
5. Lê os comandos, aguarda cerca de cinco segundos, repete uma vez e demonstra somente quando previsto. Não treina, não provoca sofrimento, não exige contato ocular e não retira apoios. Abre um registro **por tarefa**, não uma nota geral do bloco.
6. Registra resposta literal, categoria descritiva, ajuda, adaptações, motivo de omissão, qualidade referida e eventual clipe/tempo conferido. As categorias são espontâneo, após repetição, após gesto/modelo, com apoio habitual, não demonstrado, recusou e não avaliável/não aplicado. Não há soma de pontos.
7. Encerra antes se necessário. Aos dez minutos a coleta é encerrada. Sair da aba também encerra a coleta; não continuar atividades fora do cronômetro. Registros ainda podem ser completados posteriormente, sem realizar novas tarefas.
8. Revê os registros, exporta TXT/JSON ou imprime o resumo. Se gravou no navegador, salva também o vídeo e confere a integridade. Somente depois inicia outra sessão ou sai da página.

## Cobertura e origem

13 fichas: 0–2, 3–5, 6–8, 9–11, 12–17, 18–23 e 24–35 meses; 3, 4 e 5 anos; 6–8, 9–11 e 12–17 anos. Há distinção explícita entre referências de 12/15 e 24/30 meses. Tarefas adicionais de 30 meses são sinalizadas para omissão nos menores.

Fonte autoral: **NeuroPed OBS-10 — Manual e Fichas** e **Guia Rápido da Assistente**, fornecidos/aprovados no briefing do proprietário de 17/09/2026. Referências de desenvolvimento (CDC/AAP), saúde mental (NIMH/AAP) e LGPD estão acessíveis no rodapé da interface. Essas fontes não validam o conjunto de tarefas ou seus tempos como instrumento diagnóstico.

**Status: proposta operacional não validada.** Não há sensibilidade, especificidade, percentil, escore, idade cognitiva, QI ou ponto de corte. Necessita revisão clínica, treinamento e primeiras aplicações supervisionadas. Expectativas de desenvolvimento contextualizam a observação; não constituem aprovação/reprovação.

## Segurança clínica

A assistente conduz tarefas seguras; não faz diagnóstico, prescrição nem exame neurológico completo. São proibidos resistência manual, reflexos, estímulo doloroso, tração, mobilizações passivas, desequilíbrio provocado, provas de olhos fechados, escadas, hiperventilação e exposição a estímulos perigosos. Prono depende de autorização clínica, vigília, tolerância e supervisão, sempre em superfície segura.

Alteração de consciência, crise, dificuldade respiratória, fraqueza súbita, instabilidade nova, dor intensa ou risco imediato interrompem a coleta e exigem acionamento da equipe presencial; emergência: SAMU 192. Em crise, proteger de lesões, não conter e não colocar nada na boca. Não aguardar IA.

Conteúdos sensíveis devem sair da filmagem e seguir fluxo clínico confidencial. Avaliação de risco suicida pertence à equipe treinada; aparência tranquila ou resposta negativa na amostra não exclui risco.

## Verdade do registro

O resumo é produzido **a partir da digitação da aplicadora**, não da análise do vídeo. Relato do responsável permanece separado de observação. Domínios sem dados são explicitados como sem registro, nunca preenchidos como normais. Campos incompletos permanecem sinalizados.

Horários de aplicação não são timestamps verificados de vídeo. Clipe/tempo são referências digitadas pela aplicadora. O intervalo de memória só é calculado quando ela marca registro inicial e evocação; não gera nota nem interpretação de retenção sem aprendizagem inicial documentada.

Apenas o médico revisa a evidência e interpreta. Não há afirmação de força 5/5, tônus/reflexos preservados, exame normal, CID, diagnóstico, inteligência ou ausência de sofrimento.

## Privacidade e câmera

- Estado e vídeo ficam em memória; não há banco, localStorage, sessionStorage, IndexedDB, upload, chamada de IA ou nova API clínica neste módulo.
- TXT/JSON e vídeo só saem por ação explícita de download/impressão. Confirme o destino institucional. Não foi implementado envio ao prontuário, Drive, e-mail ou outro serviço.
- Recarregar, encerrar ou navegar para outra página perde o que não foi exportado. Há aviso permanente e proteção de saída de documento. Bloqueios/encerramentos pelo sistema operacional podem impedir qualquer aviso; não presumir salvamento.
- Câmera exige contexto seguro e suporte a MediaRecorder/getUserMedia. Formato é escolhido conforme suporte (WebM/MP4); recursos de mídia e URLs temporárias são liberados ao encerrar/limpar/desmontar. Permissão negada tem alternativa externa, sem início silencioso.
- Testes automatizados cobrem Chromium com mídia sintética; não afirmam homologação de todos os aparelhos ou navegadores móveis. Validar câmera, áudio e posicionamento no dispositivo institucional antes de uso clínico. A alternativa externa é mantida.
- Rosto/voz identificam a criança; código não anonimiza o vídeo. Autorização/base legal, acesso, retenção, armazenamento e eventual processamento externo/IA pertencem ao fluxo institucional.

## Verificação reproduzível

```sh
npm ci
npm run check
npx eslint client/src/features/obs10/*.ts client/src/pages/pre-consulta-obs10.tsx tests/unit/obs10.test.ts --max-warnings=0
node --import tsx tests/unit/obs10.test.ts
npm run test:sonda
npm run audit:navigation
npm run test:operations
VITE_OPEN_ACCESS=false npm run build:client
npx playwright install --with-deps chromium
node tests/e2e/obs10.mjs
```

A jornada usa o componente real do build e o servidor sintético de autenticação já adotado pelo repositório. Não substitui lógica clínica nem injeta estado React. Cobre consulta às 13 fichas; validade/consentimento; faixa corrigida e restrições infantis; limite de tempo; registros; conteúdo escapado; exportação; interrupção; mídia local e liberação de tracks; permissão negada; saída de aba; ausência de escritas clínicas; acessibilidade e viewport desktop/celular.

**Primeira execução integral aprovada:** GitHub Actions run `35217438312`, job `105189144592`, código de aplicação verificado no commit `2bafd37899501824e3e90ec078d4954857ba20e4`. Todos os passos de tipo, lint, contrato, regressões, build e jornada de navegador concluíram com sucesso. Artefato `obs10-verification` contém capturas, relatórios axe e resultados sintéticos. A verificação final de PR ocorre novamente após remoção dos arquivos temporários de integração.

O workflow permanente `.github/workflows/obs10.yml` é somente leitura e não faz commits, deploys, alterações de segredos ou modificações em dados clínicos. O mecanismo temporário de integração foi removido da entrega.

## Publicação e rollback

Publicação segue exclusivamente a PR e os gates de produção já existentes. Cloudflare Pages/Functions é a produção canônica; Vercel é espelho. Não considerar a funcionalidade publicada só porque existe branch, PR, build ou preview: verificar merge, deploy e SHA servido.

Rollback: reverter a PR #894. Não há migração nem persistência nova a reverter; arquivos exportados sob controle da clínica continuam sujeitos à sua política de retenção.
