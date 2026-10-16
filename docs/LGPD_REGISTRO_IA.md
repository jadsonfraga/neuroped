# LGPD + registro de uso de IA (item 7)

Leitura dos textos oficiais em 16/10/2026: Resolução CFM 2.454/2026 (PDF do CFM; DOU 27/02/2026, retificação 05/03/2026; vigência em 26/08/2026), Lei 13.709/2018 (LGPD, compilada, Planalto) e Lei 13.787/2018 (Planalto).
As citações ficam em `shared/lgpd-compliance.ts` (`LEGAL_REFERENCES`) e as dúvidas em `PENDING_LEGAL_DECISIONS`.

## O que a norma diz (aplicável) e onde o produto atende
| Norma | O que diz | Produto |
|---|---|---|
| CFM 2.454, art. 4º, V | médico registra no prontuário o uso de IA como apoio à decisão | Painel "Registro de uso de IA" no cockpit do paciente + **linha sugerida** para copiar ao prontuário |
| CFM, art. 4º, I–II; art. 18; art. 15 p.ú. | IA só apoia; julgamento crítico; supervisão humana obrigatória | Campo "revisei criticamente e mantive a decisão final" no registro e na linha |
| CFM, art. 5º §1º e art. 11 | paciente deve ser informado/ter explicado o uso de IA | **Marcação de ciência da família** (informada / recusou), com quem e quando |
| CFM, art. 5º §3º | respeitar recusa informada | Status "Família recusou" na linha do prontuário |
| CFM, art. 5º §2º | vedado delegar à IA a comunicação de diagnóstico/prognóstico/conduta | Nada é enviado à família por IA; portal da família (item 5) só com texto revisado pelo médico |
| CFM, art. 6º e §§ | dados com IA só se estritamente necessário, conforme finalidade informada | Campo "dados enviados à IA" (nenhum / pseudonimizado / identificável); prompt pseudonimizado do item 1 |
| CFM, arts. 12–13, Anexo II | avaliação de risco (baixo/médio/alto/inaceitável) pela instituição | Campo opcional, **sem valor padrão** (pendente) |
| CFM, art. 14, Anexo III | governança, transparência, acesso de órgãos de controle | Trilha de auditoria consultável + export com registro de IA |
| LGPD, art. 5º II, 11, 14 §1º | dado de saúde é sensível; criança exige consentimento específico dos responsáveis | Consentimentos existentes (portal, intake); sem novo tratamento |
| LGPD, arts. 18–19 | direitos do titular; resposta em até 15 dias | Orientação por tipo de pedido (`evaluateSubjectRequest`) + fluxo existente de exportação/eliminação |
| LGPD, art. 16, I; Lei 13.787, art. 6º | conservação por obrigação legal; prontuário só eliminável após 20 anos do último registro | **Piso de 20 anos** no handler, no CHECK do banco e no purge do titular |
| LGPD, art. 37 | registro das operações de tratamento | `saas_audit_log` (só enums/flags/ids), `family_portal_audit_log` |

## O que foi feito
1. **Registro de uso de IA** (`/api/live/ai-use`, migration 0036 versionada, não aplicada). Só metadados: ferramenta, finalidade, autor (da sessão), data/hora, dados enviados, revisão humana, risco opcional, ciência da família. Append-only no banco (gatilhos); ciência da família só uma vez. Escrita só com `clinical.write`; secretaria e financeiro: 403. Sem conteúdo clínico, resultado, nível ou corte.
2. **Retenção por categoria** (`/api/live/governance/retention`, tabela `clinic_retention_rules`): prontuário ≥ 7300 dias (não reduzível, imposto também por CHECK). Demais categorias sem piso assumido.
3. **Piso legal na eliminação do titular** (`_purge.ts`): o purge de escopo `patient` recusa (`RETENTION_PENDING`) enquanto houver registro com menos de 20 anos (ou do prazo maior da clínica), com checagem fresca e cerca atômica no batch.
4. **Trilha de auditoria consultável** (`/api/live/governance/audit`): une `saas_audit_log` e `family_portal_audit_log` da própria clínica, filtros de origem, ação e datas; só gestor; a consulta também deixa rastro.
5. **Export LGPD** (clínica) passa a incluir `aiUseRecords` e `retentionRules`.
6. **Configurações → Privacidade e IA** (gestor): retenção, orientação de pedidos do titular, trilha, base legal e pendências.
7. Aviso na tela do Laudo em um clique sobre registrar o uso de IA externa.

## Regra do médico
Nenhum campo, rótulo ou linha sugerida contém corte, nível ou classificação de teste do NeuroPad; teste unitário varre a linha gerada.

## Pendente de decisão do médico/jurídico (não assumido)
Ver `PENDING_LEGAL_DECISIONS`: forma da ciência da família (registro do médico × aceite assinado), grau de risco por uso, quais usos registrar, alcance dos 20 anos para criança/adolescente e para trilhas e registro de IA, eliminação/anonimização dentro do prazo, encarregado (DPO) e Comissão de IA e Telemedicina.

## Limitações
- Migration 0036 não aplicada: sem ela, `/api/live/ai-use` e o PUT de retenção respondem 503; o GET de retenção devolve os padrões; o piso do purge vale mesmo sem a tabela (usa 20 anos).
- Retenção das categorias fora do prontuário é só configuração: nenhuma rotina apaga automaticamente (`physicalDeletionAutomatic: false`).
- O purge de escopo `clinic` não recebeu o piso por registro (usa o `retention_until` do ciclo de vida); revisar com o jurídico.
- O registro de IA mantém o id opaco do paciente após a eliminação (evidência de accountability); decisão jurídica pendente.
- A tela do Laudo em um clique usa o cadastro legado de pacientes; o registro de IA vive no cockpit do paciente (Clinical LIVE).
- Anonimização do prontuário não foi implementada (depende da decisão jurídica acima).
