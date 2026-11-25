-- A imagem manuscrita do titular não é certificado nem chave de assinatura.
-- A imagem fica segmentada e cifrada, em linhas pequenas para backup SQL.
CREATE TABLE IF NOT EXISTS owner_pdf_facsimile (
  clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL CHECK(media_type IN ('image/png', 'image/jpeg')),
  image_sha256 TEXT NOT NULL CHECK(length(image_sha256) = 64),
  segment_count INTEGER NOT NULL CHECK(segment_count BETWEEN 1 AND 16),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(clinic_id, user_id)
);

CREATE TABLE IF NOT EXISTS owner_pdf_facsimile_segment (
  clinic_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  segment_order INTEGER NOT NULL CHECK(segment_order BETWEEN 0 AND 15),
  ciphertext TEXT NOT NULL CHECK(length(ciphertext) BETWEEN 32 AND 64000),
  PRIMARY KEY(clinic_id, user_id, segment_order),
  FOREIGN KEY(clinic_id, user_id) REFERENCES owner_pdf_facsimile(clinic_id, user_id) ON DELETE CASCADE
);
