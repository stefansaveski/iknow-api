SET search_path TO project;

TRUNCATE TABLE
    professour_subjects,
    dependency_subject,
    major_subjects,
    payment,
    token,
    user_documents,
    documents,
    passed_subjects,
    semesters_subjects,
    enrolled_semesters,
    subjects,
    active_semesters,
    major,
    contact,
    high_school,
    users
RESTART IDENTITY CASCADE;

INSERT INTO users (id, name, embg, surname, "index", bday, email, password, role, quota, enrollment_year) VALUES
(1, 'Stefan',  '0101999450001', 'Saveski',     '233149', '1999-01-01', 'stefan.saveski@students.finki.ukim.mk',    '$2a$11$S9QIoRlV/rmkif7CKBjryuHwfLo1wTsXckX9oTduqrdyNWInCqR0S', 'student', 'drzavna',  2023),
(2, 'Boris',   '0202999450002', 'Gjorgjievski','233188', '1999-02-02', 'boris.gjorgjievski@students.finki.ukim.mk','$2a$11$S9QIoRlV/rmkif7CKBjryuHwfLo1wTsXckX9oTduqrdyNWInCqR0S', 'student', 'privatna', 2023),
(3, 'Ana',     '0303000450003', 'Petrova',     '233200', '2000-03-03', 'ana.petrova@students.finki.ukim.mk',       '$2a$11$S9QIoRlV/rmkif7CKBjryuHwfLo1wTsXckX9oTduqrdyNWInCqR0S', 'student', 'drzavna',  2023);

INSERT INTO users (id, name, embg, surname, "index", bday, email, password, role, quota, enrollment_year) VALUES
(4, 'Vangel',  '0404198045004', 'Ajanovski',   NULL,     '1980-04-04', 'vangel.ajanovski@finki.ukim.mk',           '$2a$11$S9QIoRlV/rmkif7CKBjryuHwfLo1wTsXckX9oTduqrdyNWInCqR0S', 'prof',    NULL, NULL),
(5, 'Marija',  '0505198545005', 'Ilievska',    NULL,     '1985-05-05', 'marija.ilievska@finki.ukim.mk',            '$2a$11$S9QIoRlV/rmkif7CKBjryuHwfLo1wTsXckX9oTduqrdyNWInCqR0S', 'prof',    NULL, NULL);

INSERT INTO users (id, name, embg, surname, "index", bday, email, password, role, quota, enrollment_year) VALUES
(6, 'Igor',    '0606197545006', 'Adminovski',  NULL,     '1975-06-06', 'igor.adminovski@finki.ukim.mk',            '$2a$11$S9QIoRlV/rmkif7CKBjryuHwfLo1wTsXckX9oTduqrdyNWInCqR0S', 'admin',   NULL, NULL);

INSERT INTO users (id, name, embg, surname, "index", bday, email, password, role, quota, enrollment_year) VALUES
(7, 'Riste',   '0707197845007', 'Stojanov',    NULL,     '1978-07-07', 'riste.stojanov@finki.ukim.mk',             '$2a$11$S9QIoRlV/rmkif7CKBjryuHwfLo1wTsXckX9oTduqrdyNWInCqR0S', 'prof',    NULL, NULL),
(8, 'Katerina','0808198245008', 'Zdravkova',   NULL,     '1982-08-08', 'katerina.zdravkova@finki.ukim.mk',         '$2a$11$S9QIoRlV/rmkif7CKBjryuHwfLo1wTsXckX9oTduqrdyNWInCqR0S', 'prof',    NULL, NULL);

INSERT INTO high_school (id, user_id, gpa, type) VALUES
(1, 1, 4.85, 'gimnazija'),
(2, 2, 4.60, 'strucen'),
(3, 3, 4.95, 'gimnazija');

INSERT INTO contact (id, user_id, city, municipality, address, number, microsoft_email) VALUES
(1, 1, 'Skopje', 'Centar', 'Bul. Partizanski Odredi 15', '070111111', 'stefan.saveski@live.finki.ukim.mk'),
(2, 2, 'Skopje', 'Karpos', 'Ul. Ivan Milutinovic 22',    '071222222', 'boris.gjorgjievski@live.finki.ukim.mk'),
(3, 3, 'Tetovo', 'Tetovo', 'Ul. Ilindenska 5',           '072333333', NULL);

INSERT INTO major (id, name) VALUES
(1, 'Software Engineering and Information Systems'),
(2, 'Computer Science and Engineering');

INSERT INTO active_semesters (id, year, type) VALUES
(1, 2024, 'winter'),
(2, 2025, 'summer'),
(3, 2025, 'winter'),
(4, 2026, 'summer'),
(5, 2026, 'winter');

INSERT INTO subjects (id, name, code, awarded_credits, dependency_credit) VALUES
(1,  'Structured Programming',         'F18L1S001', 6, 0),
(2,  'Object Oriented Programming',    'F18L1S002', 6, 6),
(3,  'Databases',                      'F18L2S010', 6, 6),
(4,  'Operating Systems',              'F18L2S011', 6, 0),
(5,  'Web Programming',                'F18L3S020', 6, 12),
(6,  'Algorithms and Data Structures', 'F18L2S012', 6, 6),
(7,  'Computer Networks',              'F18L2S013', 6, 6),
(8,  'Software Engineering',           'F18L3S021', 6, 12),
(9,  'Discrete Mathematics',           'F18L1S003', 6, 0),
(10, 'Calculus',                       'F18L1S004', 6, 0),
(11, 'Linear Algebra',                 'F18L1S005', 6, 0),
(12, 'Computer Architecture',          'F18L1S006', 6, 0),
(13, 'Artificial Intelligence',        'F18L3S022', 6, 12),
(14, 'Machine Learning',               'F18L4S030', 6, 18),
(15, 'Information Security',           'F18L3S023', 6, 12),
(16, 'Mobile Platforms',               'F18L3S024', 6, 12),
(17, 'Distributed Systems',            'F18L4S031', 6, 18),
(18, 'Human-Computer Interaction',     'F18L2S014', 6, 6),
(19, 'Probability and Statistics',     'F18L2S015', 6, 6),
(20, 'Compiler Design',                'F18L4S032', 6, 18);

INSERT INTO enrolled_semesters (id, user_id, quota, major_id, note, student_comment, last_change, completed, semester_id) VALUES
(1, 1, 'drzavna',  1, NULL, 'prva godina',  '2024-10-01 10:00:00', '2025-02-01 12:00:00', 1),
(2, 1, 'drzavna',  1, NULL, NULL,           '2025-03-01 10:00:00', NULL,                  2),
(3, 2, 'privatna', 1, NULL, NULL,           '2024-10-05 09:30:00', '2025-02-03 11:00:00', 1),
(4, 3, 'drzavna',  2, NULL, NULL,           '2024-10-02 08:15:00', NULL,                  1);

INSERT INTO semesters_subjects (id, enrolled_semesters_id, subjects_id, professor_id, signature) VALUES
(1, 1, 1, 4, TRUE),
(2, 1, 4, 5, TRUE),
(3, 2, 2, 4, FALSE),
(4, 3, 1, 4, TRUE),
(5, 4, 1, 4, TRUE),
(6, 4, 3, 5, FALSE);

INSERT INTO passed_subjects (id, enrolled_id, grade, date_passed) VALUES
(1, 1, '10', '2025-01-25 14:00:00'),
(2, 2, '8',  '2025-01-30 11:30:00'),
(3, 4, '9',  '2025-01-28 09:45:00'),
(4, 5, '7',  '2025-01-29 13:15:00');

INSERT INTO documents (id, type, body, cost) VALUES
(1, 'Uverenie za polozeni ispiti', 'Sodrzina na uverenie za polozeni ispiti...', 100),
(2, 'Potvrda za redoven student',  'Sodrzina na potvrda za redoven student...', 50),
(3, 'Diploma',                     'Sodrzina na diploma...',                     500);

INSERT INTO user_documents (user_id, document_id) VALUES
(1, 1),
(1, 2),
(2, 2),
(3, 1);

INSERT INTO token (id, user_id, token, expires_at, is_valid) VALUES
(1, 1, 'tok_abc123_stefan', '2026-08-01 00:00:00', TRUE),
(2, 2, 'tok_def456_boris',  '2026-08-01 00:00:00', TRUE),
(3, 1, 'tok_old789_stefan', '2026-01-01 00:00:00', FALSE);

INSERT INTO payment (id, enrollment_id, amount) VALUES
(1, 1, 200),
(2, 2, 200),
(3, 3, 400),
(4, 4, 200);

INSERT INTO major_subjects (major_id, subject_id, mandatory_semester) VALUES
(1, 1, 1), (1, 9, 1), (1, 10, 1), (1, 11, 1), (1, 12, 1),
(1, 2, 2), (1, 6, 2), (1, 18, 2), (1, 19, 2),
(1, 3, 3), (1, 4, 3), (1, 7, 3),
(1, 5, 4), (1, 8, 4), (1, 13, 4), (1, 15, 4), (1, 16, 4),
(1, 14, 5), (1, 17, 5),
(2, 1, 1), (2, 9, 1), (2, 10, 1), (2, 11, 1), (2, 12, 1),
(2, 2, 2), (2, 6, 2), (2, 19, 2),
(2, 3, 3), (2, 4, 3), (2, 7, 3), (2, 18, 3),
(2, 5, 4), (2, 13, 4), (2, 15, 4),
(2, 14, 5), (2, 17, 5), (2, 20, 5);

INSERT INTO dependency_subject (subject_id, dependency_id) VALUES
(2, 1),
(5, 2),
(3, 1);

INSERT INTO professour_subjects (prof_id, active_semester_id, subject_id)
SELECT teacher.id, sem.id, subj.id
FROM subjects subj
CROSS JOIN active_semesters sem
CROSS JOIN LATERAL (
    SELECT u.id
    FROM users u
    WHERE u.role = 'prof'
    ORDER BY u.id
    OFFSET subj.id % (SELECT count(*) FROM users WHERE role = 'prof')
    LIMIT 1
) AS teacher;

SELECT setval(pg_get_serial_sequence('users',              'id'), (SELECT max(id) FROM users));
SELECT setval(pg_get_serial_sequence('high_school',        'id'), (SELECT max(id) FROM high_school));
SELECT setval(pg_get_serial_sequence('contact',            'id'), (SELECT max(id) FROM contact));
SELECT setval(pg_get_serial_sequence('major',              'id'), (SELECT max(id) FROM major));
SELECT setval(pg_get_serial_sequence('active_semesters',   'id'), (SELECT max(id) FROM active_semesters));
SELECT setval(pg_get_serial_sequence('subjects',           'id'), (SELECT max(id) FROM subjects));
SELECT setval(pg_get_serial_sequence('enrolled_semesters', 'id'), (SELECT max(id) FROM enrolled_semesters));
SELECT setval(pg_get_serial_sequence('semesters_subjects', 'id'), (SELECT max(id) FROM semesters_subjects));
SELECT setval(pg_get_serial_sequence('passed_subjects',    'id'), (SELECT max(id) FROM passed_subjects));
SELECT setval(pg_get_serial_sequence('documents',          'id'), (SELECT max(id) FROM documents));
SELECT setval(pg_get_serial_sequence('token',              'id'), (SELECT max(id) FROM token));
SELECT setval(pg_get_serial_sequence('payment',            'id'), (SELECT max(id) FROM payment));
