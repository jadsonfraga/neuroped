-- 0031 — Entrega por e-mail da caixa de saída operacional.
--
-- `notification_outbox` já tinha canal ('manual','email',...) e status
-- ('pending_provider','manual_sent','delivered','failed'), mas nenhum registro
-- de tentativa. Sem contador, "não tentar para sempre" não era verificável.
--
--   attempts         tentativas de envio por e-mail (0 = nunca tentado;
--                    linhas antigas e envio manual continuam 0).
--   last_attempt_at  instante ISO da última tentativa (janela anti-duplo envio).
--   last_error       código curto do último erro (ex.: 'provider_error').
--                    NUNCA destinatário, corpo ou resposta do provedor.
--
-- Colunas aditivas, sem dado de titular: o purge LGPD continua removendo as
-- linhas pela cascata de `appointments`, como antes.
--
-- Rollback: reverter o código. As colunas aditivas podem permanecer.

ALTER TABLE notification_outbox ADD COLUMN attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE notification_outbox ADD COLUMN last_attempt_at TEXT;
ALTER TABLE notification_outbox ADD COLUMN last_error TEXT;
