# G3 — migração do paciente legado real (preparo)

Sem PHI. Base: D-012, D-013, censo agregado de produção.

## Censo observado (run 42474416434, HEAD `8d6a8fb`, 08/11/2026)
- `patients_demo` = 4; 3 seeds sem owner; 1 não-seed, da conta bootstrap; `matchesMemo = true`.
- Conta bootstrap: 1 vínculo ativo de titular em clínica ativa.
- Dependentes: seeds com 2 consultas, 1 escala, 1 documento; o registro real com 3 escalas e
  nenhuma consulta, documento, memória, Conecta ou evento.

## Operação preparada
`POST /api/admin/legacy-patient-migration` (cartão em Configurações › Privacidade, só para a conta
administradora principal).
- Refaz o censo na própria requisição e recusa divergência (`CENSUS_MISMATCH`), titularidade
  ambígua (`OWNER_CLINIC_NOT_UNIQUE`) ou dependente não coberto (`UNSUPPORTED_DEPENDENTS`).
- Copia o perfil para `live_patients` e as escalas para `live_assessments`, cifrados com a chave
  da clínica (`instrument_version = 'legado'`, título e dados originais no payload cifrado).
- Idempotente pelo blind index da referência `legacy:patients_demo:<id>` (`ALREADY_MIGRATED`).
- Não apaga nem altera a origem. Auditoria e resposta só com contagens e ID opaco.
- "Simular" (`dryRun`) faz todas as checagens sem gravar.

## Ainda NÃO feito (exige autorização separada)
1. Executar a migração em produção (proprietário, pelo cartão; primeiro "Simular").
2. Conferir o paciente no prontuário da clínica e repetir o censo.
3. Arquivar os 3 fixtures e dependentes; remover o bypass de admin global com testes Alfa/Beta.
