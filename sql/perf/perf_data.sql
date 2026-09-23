-- Bulk test data for the Phase 9 performance analysis.
-- Generated in the `perf` schema so the official `project` data is untouched.
SET search_path TO perf;

-- ---------- faculties of scale ----------
INSERT INTO major (id, name)
SELECT g, 'Major ' || g FROM generate_series(1, 6) g;

INSERT INTO active_semesters (id, year, type)
SELECT row_number() OVER (), y, t
FROM generate_series(2016, 2025) y
CROSS JOIN (VALUES ('winter'::semester_type), ('summer'::semester_type)) AS s(t);

-- 300 subjects
INSERT INTO subjects (id, name, code, awarded_credits, dependency_credit)
SELECT g,
       'Subject ' || g,
       'S' || lpad(g::TEXT, 5, '0'),
       6,
       CASE WHEN g % 3 = 0 THEN 6 ELSE 0 END
FROM generate_series(1, 300) g;

-- every subject offered by two programmes
INSERT INTO major_subjects (major_id, subject_id, mandatory_semester)
SELECT 1 + (g % 6), g, 1 + (g % 8) FROM generate_series(1, 300) g
UNION
SELECT 1 + ((g + 1) % 6), g, 1 + (g % 8) FROM generate_series(1, 300) g;

-- ---------- people ----------
-- 120 professors
INSERT INTO users (id, name, embg, surname, "index", bday, email, password, role, quota, enrollment_year)
SELECT g,
       'Prof' || g, lpad(g::TEXT, 13, '0'), 'Surname' || g, NULL,
       '1975-01-01'::TIMESTAMP,
       'prof' || g || '@finki.ukim.mk', 'hash', 'prof', NULL, NULL
FROM generate_series(1, 120) g;

-- 4000 students
INSERT INTO users (id, name, embg, surname, "index", bday, email, password, role, quota, enrollment_year)
SELECT 1000 + g,
       'Student' || g, lpad((1000 + g)::TEXT, 13, '0'), 'Student' || g,
       lpad((200000 + g)::TEXT, 6, '0'),
       '2003-01-01'::TIMESTAMP,
       'student' || g || '@students.finki.ukim.mk', 'hash', 'student',
       CASE WHEN g % 2 = 0 THEN 'drzavna'::quota_type ELSE 'privatna'::quota_type END,
       2018 + (g % 7)
FROM generate_series(1, 4000) g;

INSERT INTO contact (user_id, city, municipality, address, number)
SELECT 1000 + g, 'Skopje', 'Centar', 'Street ' || g, '070' || lpad(g::TEXT, 6, '0')
FROM generate_series(1, 4000) g;

INSERT INTO high_school (user_id, gpa, type)
SELECT 1000 + g, 3.0 + (g % 20) / 10.0,
       CASE WHEN g % 2 = 0 THEN 'gimnazija'::hs_type ELSE 'strucen'::hs_type END
FROM generate_series(1, 4000) g;

-- ---------- teaching schedule ----------
-- every (semester, subject) pair taught by one professor
INSERT INTO professour_subjects (prof_id, active_semester_id, subject_id)
SELECT 1 + ((s.id * 7 + sub.id) % 120), s.id, sub.id
FROM active_semesters s CROSS JOIN subjects sub;

-- ---------- enrolments ----------
-- each student enrols in 4 consecutive semesters
INSERT INTO enrolled_semesters (user_id, quota, major_id, semester_id, created_at, last_change, completed)
SELECT 1000 + g,
       CASE WHEN g % 2 = 0 THEN 'drzavna'::quota_type ELSE 'privatna'::quota_type END,
       1 + (g % 6),
       sem,
       now() - (interval '1 day' * (g % 900)),
       now() - (interval '1 day' * (g % 400)),
       CASE WHEN sem % 3 = 0 THEN now() - interval '30 days' ELSE NULL END
FROM generate_series(1, 4000) g
CROSS JOIN LATERAL (
    SELECT 1 + ((g + k) % 20) AS sem FROM generate_series(0, 3) k
) s
ON CONFLICT (user_id, semester_id) DO NOTHING;

-- five subjects per enrolment
INSERT INTO semesters_subjects (enrolled_semesters_id, subjects_id, professor_id, signature)
SELECT es.id,
       ps.subject_id,
       ps.prof_id,
       (es.id + ps.subject_id) % 4 <> 0
FROM enrolled_semesters es
CROSS JOIN LATERAL (
    SELECT p.subject_id, p.prof_id
    FROM professour_subjects p
    WHERE p.active_semester_id = es.semester_id
      AND p.subject_id IN (
          SELECT ms.subject_id FROM major_subjects ms WHERE ms.major_id = es.major_id
      )
    ORDER BY (p.subject_id * 13 + es.id) % 997
    LIMIT 5
) ps
ON CONFLICT (enrolled_semesters_id, subjects_id) DO NOTHING;

-- roughly 70% of enrolled subjects are passed
INSERT INTO passed_subjects (enrolled_id, grade, date_passed)
SELECT ss.id,
       (ARRAY['6','7','8','9','10']::grade_type[])[1 + (ss.id % 5)],
       now() - (interval '1 day' * (ss.id % 800))
FROM semesters_subjects ss
WHERE ss.id % 10 < 7
ON CONFLICT (enrolled_id) DO NOTHING;

-- ---------- payments and documents ----------
INSERT INTO payment (enrollment_id, amount)
SELECT es.id, 200 + (es.id % 5) * 100
FROM enrolled_semesters es;

INSERT INTO documents (id, type, body, cost)
SELECT g, 'Document type ' || g, 'Body of document ' || g, 50 * g
FROM generate_series(1, 8) g;

INSERT INTO user_documents (user_id, document_id)
SELECT 1000 + g, 1 + (g % 8) FROM generate_series(1, 4000) g
ON CONFLICT DO NOTHING;

-- sequences must catch up with the explicit ids
SELECT setval(pg_get_serial_sequence('perf.users',              'id'), (SELECT max(id) FROM users));
SELECT setval(pg_get_serial_sequence('perf.major',              'id'), (SELECT max(id) FROM major));
SELECT setval(pg_get_serial_sequence('perf.active_semesters',   'id'), (SELECT max(id) FROM active_semesters));
SELECT setval(pg_get_serial_sequence('perf.subjects',           'id'), (SELECT max(id) FROM subjects));
SELECT setval(pg_get_serial_sequence('perf.documents',          'id'), (SELECT max(id) FROM documents));

ANALYZE;
