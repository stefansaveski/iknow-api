-- Phase 6 - advanced reports.
-- Runs after schema_creation.sql and data_load.sql; every routine is created
-- with OR REPLACE, so the script can be run repeatedly.

SET search_path TO project;

-- 1. Pass rate per subject and semester, compared to the subject's own average.
CREATE OR REPLACE FUNCTION rep_subject_pass_rate()
    RETURNS TABLE (
        subject_code   VARCHAR,
        subject        VARCHAR,
        year           INTEGER,
        semester_type  semester_type,
        enrolled       BIGINT,
        signed_count   BIGINT,
        passed         BIGINT,
        pass_rate      NUMERIC,
        average_grade  VARCHAR,
        deviation      VARCHAR
    )
    LANGUAGE sql
    STABLE
    SET search_path = project
AS $$
    WITH enrolled_per_semester AS (
        SELECT ss.subjects_id                      AS subject_id,
               es.semester_id                      AS semester_id,
               COUNT(ss.id)                        AS enrolled,
               COUNT(ps.id)                        AS passed,
               ROUND(AVG(ps.grade::TEXT::INT), 2)  AS average_grade
        FROM semesters_subjects ss
        JOIN enrolled_semesters es   ON es.id = ss.enrolled_semesters_id
        LEFT JOIN passed_subjects ps ON ps.enrolled_id = ss.id
        GROUP BY ss.subjects_id, es.semester_id
    ),
    signed_per_semester AS (
        SELECT ss.subjects_id  AS subject_id,
               es.semester_id  AS semester_id,
               COUNT(ss.id)    AS signed_count
        FROM semesters_subjects ss
        JOIN enrolled_semesters es ON es.id = ss.enrolled_semesters_id
        WHERE ss.signature = TRUE
        GROUP BY ss.subjects_id, es.semester_id
    ),
    subject_average AS (
        SELECT ss.subjects_id                      AS subject_id,
               ROUND(AVG(ps.grade::TEXT::INT), 2)  AS subject_average
        FROM semesters_subjects ss
        JOIN passed_subjects ps ON ps.enrolled_id = ss.id
        GROUP BY ss.subjects_id
    )
    SELECT s.code,
           s.name,
           a.year,
           a.type,
           eps.enrolled,
           COALESCE(sps.signed_count, 0),
           eps.passed,
           ROUND(100.0 * eps.passed / eps.enrolled, 1),
           COALESCE(CAST(eps.average_grade AS VARCHAR), 'нема оценки'),
           COALESCE(CAST(eps.average_grade - sa.subject_average AS VARCHAR), 'n/a')
    FROM enrolled_per_semester eps
    JOIN subjects s         ON s.id = eps.subject_id
    JOIN active_semesters a ON a.id = eps.semester_id
    LEFT JOIN signed_per_semester sps ON sps.subject_id  = eps.subject_id
                                     AND sps.semester_id = eps.semester_id
    LEFT JOIN subject_average sa      ON sa.subject_id   = eps.subject_id
    ORDER BY a.year, a.type, ROUND(100.0 * eps.passed / eps.enrolled, 1) DESC, s.code;
$$;

-- 2. Full dossier of a student: studies, money and documents in one row.
--    p_user_id IS NULL returns every student.
CREATE OR REPLACE FUNCTION rep_student_dossier(p_user_id INTEGER DEFAULT NULL)
    RETURNS TABLE (
        student_index        VARCHAR,
        student              TEXT,
        enrolled_semesters   BIGINT,
        completed_semesters  BIGINT,
        passed_subjects      BIGINT,
        pending_subjects     BIGINT,
        credits              BIGINT,
        average_grade        VARCHAR,
        total_paid           BIGINT,
        num_documents        BIGINT,
        documents_cost       BIGINT
    )
    LANGUAGE sql
    STABLE
    SET search_path = project
AS $$
    WITH passed_stats AS (
        SELECT es.user_id,
               COUNT(ps.id)                        AS passed_subjects,
               SUM(s.awarded_credits)              AS credits,
               ROUND(AVG(ps.grade::TEXT::INT), 2)  AS average_grade
        FROM enrolled_semesters es
        JOIN semesters_subjects ss ON ss.enrolled_semesters_id = es.id
        JOIN passed_subjects ps    ON ps.enrolled_id = ss.id
        JOIN subjects s            ON s.id = ss.subjects_id
        GROUP BY es.user_id
    ),
    semester_stats AS (
        SELECT es.user_id,
               COUNT(es.id)        AS enrolled_semesters,
               COUNT(es.completed) AS completed_semesters
        FROM enrolled_semesters es
        GROUP BY es.user_id
    ),
    pending_stats AS (
        SELECT es.user_id,
               COUNT(ss.id) AS pending_subjects
        FROM enrolled_semesters es
        JOIN semesters_subjects ss   ON ss.enrolled_semesters_id = es.id
        LEFT JOIN passed_subjects ps ON ps.enrolled_id = ss.id
        WHERE ps.id IS NULL
        GROUP BY es.user_id
    ),
    payment_stats AS (
        SELECT es.user_id,
               SUM(p.amount) AS total_paid
        FROM payment p
        JOIN enrolled_semesters es ON es.id = p.enrollment_id
        GROUP BY es.user_id
    ),
    document_stats AS (
        SELECT ud.user_id,
               COUNT(ud.document_id) AS num_documents,
               SUM(d.cost)           AS documents_cost
        FROM user_documents ud
        JOIN documents d ON d.id = ud.document_id
        GROUP BY ud.user_id
    )
    SELECT u."index",
           u.name || ' ' || u.surname,
           COALESCE(sem.enrolled_semesters, 0),
           COALESCE(sem.completed_semesters, 0),
           COALESCE(ps.passed_subjects, 0),
           COALESCE(pen.pending_subjects, 0),
           COALESCE(ps.credits, 0),
           COALESCE(CAST(ps.average_grade AS VARCHAR), 'нема оценки'),
           COALESCE(pay.total_paid, 0),
           COALESCE(doc.num_documents, 0),
           COALESCE(doc.documents_cost, 0)
    FROM users u
    LEFT JOIN passed_stats ps    ON ps.user_id  = u.id
    LEFT JOIN semester_stats sem ON sem.user_id = u.id
    LEFT JOIN pending_stats pen  ON pen.user_id = u.id
    LEFT JOIN payment_stats pay  ON pay.user_id = u.id
    LEFT JOIN document_stats doc ON doc.user_id = u.id
    WHERE u.role = 'student'
      AND (p_user_id IS NULL OR u.id = p_user_id)
    ORDER BY COALESCE(ps.credits, 0) DESC, COALESCE(ps.average_grade, 0) DESC, u."index";
$$;

-- 3. Best student of every study programme; ties broken deterministically.
CREATE OR REPLACE FUNCTION rep_top_student_per_major()
    RETURNS TABLE (
        major            VARCHAR,
        student_index    VARCHAR,
        student          TEXT,
        passed_subjects  BIGINT,
        credits          BIGINT,
        average_grade    NUMERIC
    )
    LANGUAGE sql
    STABLE
    SET search_path = project
AS $$
    WITH standing AS (
        SELECT es.user_id,
               es.major_id,
               COUNT(ps.id)                                    AS passed_subjects,
               COALESCE(SUM(s.awarded_credits), 0)             AS credits,
               COALESCE(ROUND(AVG(ps.grade::TEXT::INT), 2), 0) AS average_grade
        FROM enrolled_semesters es
        LEFT JOIN semesters_subjects ss ON ss.enrolled_semesters_id = es.id
        LEFT JOIN passed_subjects ps    ON ps.enrolled_id = ss.id
        LEFT JOIN subjects s            ON s.id = ss.subjects_id AND ps.id IS NOT NULL
        GROUP BY es.user_id, es.major_id
    )
    SELECT m.name,
           u."index",
           u.name || ' ' || u.surname,
           st.passed_subjects,
           st.credits,
           st.average_grade
    FROM standing st
    JOIN users u ON u.id = st.user_id
    JOIN major m ON m.id = st.major_id
    WHERE NOT EXISTS (
        SELECT 1
        FROM standing st1
        WHERE st1.major_id = st.major_id
          AND (st.credits < st1.credits
               OR (st.credits = st1.credits AND st.average_grade < st1.average_grade)
               OR (st.credits = st1.credits AND st.average_grade = st1.average_grade
                   AND st.user_id > st1.user_id))
    )
    ORDER BY m.name;
$$;

-- 4. Busiest professor of every active semester, including semesters nobody
--    has enrolled in yet.
CREATE OR REPLACE FUNCTION rep_busiest_professor()
    RETURNS TABLE (
        year               INTEGER,
        semester_type      semester_type,
        professor          TEXT,
        subjects_taught    BIGINT,
        enrolled_students  BIGINT,
        graded_students    BIGINT
    )
    LANGUAGE sql
    STABLE
    SET search_path = project
AS $$
    WITH professor_load AS (
        SELECT es.semester_id,
               ss.professor_id,
               COUNT(ss.id)                   AS enrolled_students,
               COUNT(ps.id)                   AS graded_students,
               COUNT(DISTINCT ss.subjects_id) AS subjects_taught
        FROM semesters_subjects ss
        JOIN enrolled_semesters es   ON es.id = ss.enrolled_semesters_id
        LEFT JOIN passed_subjects ps ON ps.enrolled_id = ss.id
        GROUP BY es.semester_id, ss.professor_id
    ),
    busiest AS (
        SELECT pl.*
        FROM professor_load pl
        WHERE NOT EXISTS (
            SELECT 1
            FROM professor_load pl1
            WHERE pl1.semester_id = pl.semester_id
              AND (pl.enrolled_students < pl1.enrolled_students
                   OR (pl.enrolled_students = pl1.enrolled_students
                       AND pl.graded_students < pl1.graded_students)
                   OR (pl.enrolled_students = pl1.enrolled_students
                       AND pl.graded_students = pl1.graded_students
                       AND pl.professor_id > pl1.professor_id))
        )
    )
    SELECT a.year,
           a.type,
           COALESCE(u.name || ' ' || u.surname, 'n/a'),
           COALESCE(b.subjects_taught, 0),
           COALESCE(b.enrolled_students, 0),
           COALESCE(b.graded_students, 0)
    FROM active_semesters a
    LEFT JOIN busiest b ON b.semester_id = a.id
    LEFT JOIN users u   ON u.id = b.professor_id
    ORDER BY a.year, CASE a.type WHEN 'summer' THEN 1 ELSE 2 END;
$$;

-- 5. Change of activity between two consecutive semesters.
CREATE OR REPLACE FUNCTION rep_semester_growth()
    RETURNS TABLE (
        semester                 TEXT,
        previous_semester        TEXT,
        enrolments               BIGINT,
        subject_enrolments       BIGINT,
        passed                   BIGINT,
        prev_subject_enrolments  VARCHAR,
        pct_change               VARCHAR
    )
    LANGUAGE sql
    STABLE
    SET search_path = project
AS $$
    WITH ordered_semesters AS (
        SELECT a.id,
               a.year,
               a.type,
               a.year * 10 + CASE a.type WHEN 'summer' THEN 1 ELSE 2 END AS chrono
        FROM active_semesters a
    ),
    semester_stats AS (
        SELECT o.id                  AS semester_id,
               o.year,
               o.type,
               o.chrono,
               COUNT(DISTINCT es.id) AS enrolments,
               COUNT(ss.id)          AS subject_enrolments,
               COUNT(ps.id)          AS passed
        FROM ordered_semesters o
        LEFT JOIN enrolled_semesters es ON es.semester_id = o.id
        LEFT JOIN semesters_subjects ss ON ss.enrolled_semesters_id = es.id
        LEFT JOIN passed_subjects ps    ON ps.enrolled_id = ss.id
        GROUP BY o.id, o.year, o.type, o.chrono
    ),
    consecutive AS (
        SELECT cur.year, cur.type, cur.chrono,
               cur.enrolments, cur.subject_enrolments, cur.passed,
               prev.year               AS prev_year,
               prev.type               AS prev_type,
               prev.subject_enrolments AS prev_subject_enrolments
        FROM semester_stats cur
        LEFT JOIN semester_stats prev
               ON prev.chrono < cur.chrono
              AND NOT EXISTS (SELECT 1
                              FROM semester_stats mid
                              WHERE mid.chrono < cur.chrono
                                AND mid.chrono > prev.chrono)
    )
    SELECT c.year || '-' || c.type,
           COALESCE(c.prev_year || '-' || c.prev_type, 'нема претходен'),
           c.enrolments,
           c.subject_enrolments,
           c.passed,
           COALESCE(CAST(c.prev_subject_enrolments AS VARCHAR), 'n/a'),
           COALESCE(CAST(ROUND(((c.subject_enrolments - c.prev_subject_enrolments) * 100.0)
                               / NULLIF(c.prev_subject_enrolments, 0)) AS VARCHAR) || '%', 'n/a')
    FROM consecutive c
    ORDER BY c.chrono;
$$;

-- The same dossier as a stored procedure returning an open cursor, for callers
-- that read the report row by row instead of as a result set.
CREATE OR REPLACE PROCEDURE rep_student_dossier_cursor(
        IN    p_user_id INTEGER,
        INOUT p_cursor  REFCURSOR DEFAULT 'dossier')
    LANGUAGE plpgsql
    SET search_path = project
AS $$
BEGIN
    OPEN p_cursor FOR SELECT * FROM rep_student_dossier(p_user_id);
END;
$$;
