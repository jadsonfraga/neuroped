-- ============================================================
-- NeuroPed — Seed de dados DEMO fictícios
-- Branch: feat/auditoria-total-ui-backend-memoria
-- Criado: 2026-05-08
--
-- ⚠️  TODOS OS DADOS AQUI SÃO COMPLETAMENTE FICTÍCIOS.
--     Nomes, datas, diagnósticos e contatos NÃO representam pessoas reais.
--     is_demo = 1 em todos os registros.
--
-- USO: somente ambiente local de demonstração. Não aplicar manualmente em
-- produção; o fluxo oficial não publica este seed.
-- ============================================================

-- Limpar dados demo existentes antes do seed
DELETE FROM scale_results_demo WHERE is_demo = 1;
DELETE FROM documents_demo WHERE is_demo = 1;
DELETE FROM consultations_demo WHERE is_demo = 1;
DELETE FROM patients_demo WHERE is_demo = 1;
DELETE FROM memory_notes WHERE is_demo = 1;

-- ============================================================
-- Pacientes Demo (3 registros fictícios)
-- ============================================================
INSERT INTO patients_demo (id, name, birth_date, guardian_name, guardian_phone, diagnosis_code, notes, is_demo, created_at) VALUES
(
  'demo-001',
  'Demo Paciente 1 — Fictício',
  '2018-03-15',
  'Responsável Demo 1 — Fictício',
  '(81) 99000-0001',
  'F84.0',
  'TEA leve — paciente de demonstração. Dados completamente fictícios. Não representa pessoa real.',
  1,
  '2025-01-10T08:00:00Z'
),
(
  'demo-002',
  'Demo Paciente 2 — Fictício',
  '2016-07-22',
  'Responsável Demo 2 — Fictício',
  '(81) 99000-0002',
  'F90.0',
  'TDAH combinado — paciente de demonstração. Dados completamente fictícios. Não representa pessoa real.',
  1,
  '2025-02-14T10:00:00Z'
),
(
  'demo-003',
  'Demo Paciente 3 — Fictício',
  '2020-11-05',
  'Responsável Demo 3 — Fictício',
  '(81) 99000-0003',
  'G40.3',
  'Epilepsia focal — paciente de demonstração. Dados completamente fictícios. Não representa pessoa real.',
  1,
  '2025-03-01T09:00:00Z'
);

-- ============================================================
-- Consultas Demo (2 registros fictícios)
-- ============================================================
INSERT INTO consultations_demo (id, patient_id, date, subjective, objective, assessment, plan, is_demo, created_at) VALUES
(
  'cons-demo-001',
  'demo-001',
  '2025-04-10T14:00:00Z',
  'Mãe relata melhora gradual na comunicação verbal após fonoterapia semanal. Criança com 7 anos em escola regular com auxílio de cuidador. DADO FICTÍCIO.',
  'Criança colaborativa durante consulta. Contato ocular mantido por períodos maiores. Responde ao próprio nome. DADO FICTÍCIO.',
  'TEA leve (F84.0) — evolução favorável com suporte terapêutico. DADO FICTÍCIO.',
  'Manter fonoaudiologia 2x/semana. Terapia ocupacional mensal. Reavaliação clínica em 3 meses. DADO FICTÍCIO.',
  1,
  '2025-04-10T14:30:00Z'
),
(
  'cons-demo-002',
  'demo-002',
  '2025-04-15T10:00:00Z',
  'Responsável refere dificuldade de atenção persistente no ambiente escolar. Professora enviou relatório com queixas de hiperatividade. DADO FICTÍCIO.',
  'Criança ativa, dificuldade em permanecer sentada por mais de 5 minutos. Sem sinais de ansiedade aparente. DADO FICTÍCIO.',
  'TDAH combinado (F90.0) — revisão de medicação indicada. DADO FICTÍCIO.',
  'Ajuste de dose de metilfenidato. Contato com equipe escolar em 30 dias. Reforçar rotinas em casa. DADO FICTÍCIO.',
  1,
  '2025-04-15T10:45:00Z'
);

-- ============================================================
-- Resultado de Escala Demo (1 registro fictício)
-- ============================================================
INSERT INTO scale_results_demo (id, patient_id, scale_id, scale_name, score, interpretation, details, is_demo, applied_at) VALUES
(
  'scale-demo-001',
  'demo-001',
  'mchat',
  'M-CHAT-R/F',
  8,
  'Risco elevado para TEA — encaminhamento para avaliação diagnóstica especializada recomendado. DADO FICTÍCIO.',
  '{"version":"M-CHAT-R_F_v2","itens_positivos":[1,2,3,4,5,6,7,8],"total_positivos":8,"limiar_risco":3,"is_demo":true}',
  1,
  '2025-04-05T11:00:00Z'
);

-- ============================================================
-- Documento Demo (1 laudo fictício)
-- ============================================================
INSERT INTO documents_demo (id, patient_id, type, title, content, is_family_visible, is_demo, created_at) VALUES
(
  'doc-demo-001',
  'demo-001',
  'laudo',
  'Laudo de Avaliação Neuropediátrica — Demonstração',
  '⚠️ DOCUMENTO DE DEMONSTRAÇÃO — DADOS COMPLETAMENTE FICTÍCIOS

Paciente: Demo Paciente 1 — Fictício
Data de Nascimento: 15/03/2018
Responsável: Responsável Demo 1 — Fictício

HIPÓTESE DIAGNÓSTICA (FICTÍCIA):
Transtorno do Espectro Autista Leve (F84.0)

INSTRUMENTOS UTILIZADOS (DEMO):
- M-CHAT-R/F: Score 8 — Risco elevado
- Observação clínica estruturada

RECOMENDAÇÕES (FICTÍCIAS):
- Fonoaudiologia 2x/semana
- Terapia Ocupacional 1x/semana
- Suporte educacional inclusivo

Este documento é inteiramente fictício, destinado exclusivamente a demonstração da plataforma NeuroPed. Não representa avaliação clínica real de nenhuma criança.',
  0,
  1,
  '2025-04-20T16:00:00Z'
);

-- ============================================================
-- Notas de Memória Demo
-- ============================================================
INSERT INTO memory_notes (id, title, content, category, source, patient_id, tags, is_demo, created_at) VALUES
(
  'mem-demo-001',
  'M-CHAT-R/F — Pontos de corte',
  'M-CHAT-R/F: Score 0-2 = baixo risco; 3-7 = risco moderado (realizar entrevista follow-up); 8-20 = risco elevado (encaminhamento imediato). Sensibilidade 91%, especificidade 95%.',
  'escala',
  'manual_mchat',
  NULL,
  '["mchat","tea","triagem","autismo"]',
  1,
  '2025-01-01T00:00:00Z'
),
(
  'mem-demo-002',
  'SNAP-IV — Interpretação clínica',
  'SNAP-IV: Limiar clínico = média dos itens ≥ 2.0 por subescala. Desatenção: 9 itens (α=0.94). Hiperatividade/Impulsividade: 9 itens (α=0.88). Usar percentis por idade e sexo.',
  'escala',
  'manual_snap',
  NULL,
  '["snap","tdah","hiperatividade","atencao"]',
  1,
  '2025-01-01T00:00:00Z'
),
(
  'mem-demo-003',
  'Metilfenidato — Posologia pediátrica',
  'Metilfenidato: dose inicial 5mg 1-2x/dia. Titulação semanal de 5mg até resposta clínica. Dose máxima: 60mg/dia (ou 2mg/kg/dia). Formulação de liberação imediata: duração 3-5h. Avaliar: apetite, sono, crescimento, FC e PA a cada consulta. DADO FICTÍCIO — consultar bula e protocolo institucional.',
  'farmacologia',
  'prontuario_demo',
  'demo-002',
  '["metilfenidato","tdah","posologia","pediatria"]',
  1,
  '2025-02-01T00:00:00Z'
);

-- FTS sync
INSERT INTO memory_notes_fts(memory_notes_fts) VALUES('rebuild');
