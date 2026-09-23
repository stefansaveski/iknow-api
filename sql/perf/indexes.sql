SET search_path TO perf;

-- Foreign keys with no supporting index. PostgreSQL indexes primary keys and
-- UNIQUE constraints automatically, but never the referencing side of a
-- foreign key, and a composite index only helps queries that use its
-- leading column.
CREATE INDEX IF NOT EXISTS ix_semesters_subjects_subject   ON semesters_subjects (subjects_id);
CREATE INDEX IF NOT EXISTS ix_semesters_subjects_professor ON semesters_subjects (professor_id);
CREATE INDEX IF NOT EXISTS ix_enrolled_semesters_semester  ON enrolled_semesters (semester_id);
CREATE INDEX IF NOT EXISTS ix_enrolled_semesters_major     ON enrolled_semesters (major_id);
CREATE INDEX IF NOT EXISTS ix_payment_enrollment           ON payment (enrollment_id);
CREATE INDEX IF NOT EXISTS ix_major_subjects_subject       ON major_subjects (subject_id);
CREATE INDEX IF NOT EXISTS ix_professour_subjects_semester ON professour_subjects (active_semester_id, subject_id);
CREATE INDEX IF NOT EXISTS ix_user_documents_document      ON user_documents (document_id);
CREATE INDEX IF NOT EXISTS ix_token_user                   ON token (user_id);

-- Supports the very common "this student's grades" path without touching the heap.
CREATE INDEX IF NOT EXISTS ix_passed_subjects_enrolled_grade ON passed_subjects (enrolled_id, grade);

ANALYZE;
