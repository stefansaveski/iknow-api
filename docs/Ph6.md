== Напредни извештаи од базата (SQL, складирани процедури и релациона алгебра)

Сите извештаи подолу се напишани и тестирани врз шемата '''project''' на доделената
проектна база, врз податоците од [attachment:data_load.sql].

Секој извештај е даден во три форми:

 * '''SQL''' - барањето како што се извршува врз базата
 * '''Релациона алгебра''' - истото барање изразено со операторите на релациона алгебра
 * '''Складирана процедура''' - барањето спакувано како рутина во базата, за да апликацијата го повикува со едно име наместо да го носи барањето во кодот

Сите рутини се во скриптата [attachment:reports.sql], која се стартува по
schema_creation.sql и data_load.sql. Скриптата е повторлива - секоја рутина се
креира со OR REPLACE.

Заедничка забелешка за сите извештаи: оценката е од набројувачки тип (grade_type),
па за пресметка на просек мора двојно да се претвори - {{{ps.grade::TEXT::INT}}}.

== 1. Проодност по предмет и по семестар со отстапување од просекот на предметот

=== Опис на извештајот

За секој предмет и секој семестар во кој тој бил слушан се прикажува колку студенти
го запишале, колку добиле потпис, колку го положиле, процентот на проодност и
просечната оценка. Последната колона покажува колку просекот во тој семестар
отстапува од вкупниот просек на предметот, што покажува дали предметот во определен
семестар бил полесен или потежок од вообичаеното.

=== SQL

{{{#!sql
SET search_path TO project;

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
SELECT s.code                                                      AS subject_code,
       s.name                                                      AS subject,
       a.year,
       a.type                                                      AS semester_type,
       eps.enrolled,
       COALESCE(sps.signed_count, 0)                               AS signed_count,
       eps.passed,
       ROUND(100.0 * eps.passed / eps.enrolled, 1)                 AS pass_rate,
       COALESCE(CAST(eps.average_grade AS VARCHAR), 'нема оценки')  AS average_grade,
       COALESCE(CAST(eps.average_grade - sa.subject_average AS VARCHAR), 'n/a') AS deviation
FROM enrolled_per_semester eps
JOIN subjects s         ON s.id = eps.subject_id
JOIN active_semesters a ON a.id = eps.semester_id
LEFT JOIN signed_per_semester sps ON sps.subject_id  = eps.subject_id
                                 AND sps.semester_id = eps.semester_id
LEFT JOIN subject_average sa      ON sa.subject_id   = eps.subject_id
ORDER BY a.year, a.type, pass_rate DESC, s.code;
}}}

=== Релациона алгебра

{{{
EnrolledPerSemester <-
γ subject_id := ss.subjects_id,
  semester_id := es.semester_id;
  enrolled := COUNT(ss.id),
  passed := COUNT(ps.id),
  average_grade := AVG(ps.grade)
(
  (
    semesters_subjects ss
    ⨝ (ss.enrolled_semesters_id = es.id) enrolled_semesters es
  )
  ⟕ (ss.id = ps.enrolled_id) passed_subjects ps
)

SignedPerSemester <-
γ subject_id := ss.subjects_id,
  semester_id := es.semester_id;
  signed_count := COUNT(ss.id)
(
  σ ss.signature = TRUE
  (
    semesters_subjects ss
    ⨝ (ss.enrolled_semesters_id = es.id) enrolled_semesters es
  )
)

SubjectAverage <-
γ subject_id := ss.subjects_id;
  subject_average := AVG(ps.grade)
(
  semesters_subjects ss ⨝ (ss.id = ps.enrolled_id) passed_subjects ps
)

Result <-
τ a.year, a.type, pass_rate DESC, s.code
(
  π s.code,
    s.name,
    a.year,
    a.type,
    eps.enrolled,
    sps.signed_count,
    eps.passed,
    pass_rate := (eps.passed * 100) / eps.enrolled,
    eps.average_grade,
    deviation := eps.average_grade − sa.subject_average
  (
    (
      (
        (
          EnrolledPerSemester eps ⨝ (eps.subject_id = s.id) subjects s
        )
        ⨝ (eps.semester_id = a.id) active_semesters a
      )
      ⟕ (eps.subject_id = sps.subject_id ∧
         eps.semester_id = sps.semester_id) SignedPerSemester sps
    )
    ⟕ (eps.subject_id = sa.subject_id) SubjectAverage sa
  )
)
}}}

=== Складирана процедура

{{{#!sql
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
    -- барањето прикажано погоре
$$;

SELECT * FROM rep_subject_pass_rate();
}}}

Функцијата е означена како STABLE бидејќи само чита, и има сопствена патека
{{{SET search_path = project}}}, па повикувачот не мора однапред да ја постави.

=== Резултат врз тест податоците

{{{
 subject_code |           subject           | year | semester_type | enrolled | signed_count | passed | pass_rate | average_grade | deviation
--------------+-----------------------------+------+---------------+----------+--------------+--------+-----------+---------------+-----------
 F18L1S001    | Structured Programming      | 2024 | winter        |        3 |            3 |      3 |     100.0 | 8.67          | 0.00
 F18L2S011    | Operating Systems           | 2024 | winter        |        1 |            1 |      1 |     100.0 | 8.00          | 0.00
 F18L2S010    | Databases                   | 2024 | winter        |        1 |            0 |      0 |       0.0 | нема оценки   | n/a
 F18L1S002    | Object Oriented Programming | 2025 | summer        |        1 |            0 |      0 |       0.0 | нема оценки   | n/a
}}}

== 2. Досие на студент - студии, финансии и документи во еден ред

=== Опис на извештајот

За секој студент се собираат податоци кои инаку се расфрлани низ пет различни
табели: колку семестри запишал и колку завршил, колку предмети положил, колку му
остануваат неположени, колку кредити собрал, каков просек има, колку вкупно платил
и колку документи подигнал. Секој од овие броеви се пресметува во посебен
подизраз, а потоа сите се спојуваат со надворешно спојување, за студент кој нема
ниту еден запис во некоја од табелите сепак да се појави во извештајот.

=== SQL

{{{#!sql
SET search_path TO project;

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
SELECT u."index"                                                  AS student_index,
       u.name || ' ' || u.surname                                 AS student,
       COALESCE(sem.enrolled_semesters, 0)                        AS enrolled_semesters,
       COALESCE(sem.completed_semesters, 0)                       AS completed_semesters,
       COALESCE(ps.passed_subjects, 0)                            AS passed_subjects,
       COALESCE(pen.pending_subjects, 0)                          AS pending_subjects,
       COALESCE(ps.credits, 0)                                    AS credits,
       COALESCE(CAST(ps.average_grade AS VARCHAR), 'нема оценки')  AS average_grade,
       COALESCE(pay.total_paid, 0)                                AS total_paid,
       COALESCE(doc.num_documents, 0)                             AS num_documents,
       COALESCE(doc.documents_cost, 0)                            AS documents_cost
FROM users u
LEFT JOIN passed_stats ps    ON ps.user_id  = u.id
LEFT JOIN semester_stats sem ON sem.user_id = u.id
LEFT JOIN pending_stats pen  ON pen.user_id = u.id
LEFT JOIN payment_stats pay  ON pay.user_id = u.id
LEFT JOIN document_stats doc ON doc.user_id = u.id
WHERE u.role = 'student'
ORDER BY COALESCE(ps.credits, 0) DESC, COALESCE(ps.average_grade, 0) DESC, u."index";
}}}

Подредувањето намерно оди по нумеричките колони од подизразите, а не по излезните
колони. Излезната колона average_grade е претворена во текст заради вредноста
'нема оценки', па подредувањето по неа би било азбучно и оценката 9.00 би излегла
пред 10.00.

Плаќањата се врзуваат за студентот преку enrolled_semesters, а не преку
payment.user_id, согласно нормализираниот модел од Фаза 5 во кој таа колона е
отстранета.

=== Релациона алгебра

{{{
PassedStats <-
γ user_id := es.user_id;
  passed_subjects := COUNT(ps.id),
  credits := SUM(s.awarded_credits),
  average_grade := AVG(ps.grade)
(
  (
    (enrolled_semesters es ⨝ (es.id = ss.enrolled_semesters_id) semesters_subjects ss)
    ⨝ (ss.id = ps.enrolled_id) passed_subjects ps
  )
  ⨝ (ss.subjects_id = s.id) subjects s
)

SemesterStats <-
γ user_id := es.user_id;
  enrolled_semesters := COUNT(es.id),
  completed_semesters := COUNT(es.completed)
(
  enrolled_semesters es
)

PendingStats <-
γ user_id := es.user_id;
  pending_subjects := COUNT(ss.id)
(
  σ ps.id IS NULL
  (
    (enrolled_semesters es ⨝ (es.id = ss.enrolled_semesters_id) semesters_subjects ss)
    ⟕ (ss.id = ps.enrolled_id) passed_subjects ps
  )
)

PaymentStats <-
γ user_id := es.user_id;
  total_paid := SUM(p.amount)
(
  payment p ⨝ (p.enrollment_id = es.id) enrolled_semesters es
)

DocumentStats <-
γ user_id := ud.user_id;
  num_documents := COUNT(ud.document_id),
  documents_cost := SUM(d.cost)
(
  user_documents ud ⨝ (ud.document_id = d.id) documents d
)

Result <-
τ credits DESC, average_grade DESC, u.index
(
  π u.index,
    student := u.name || ' ' || u.surname,
    sem.enrolled_semesters,
    sem.completed_semesters,
    ps.passed_subjects,
    pen.pending_subjects,
    ps.credits,
    ps.average_grade,
    pay.total_paid,
    doc.num_documents,
    doc.documents_cost
  (
    σ u.role = 'student'
    (
      (
        (
          (
            (
              users u ⟕ (u.id = ps.user_id) PassedStats ps
            )
            ⟕ (u.id = sem.user_id) SemesterStats sem
          )
          ⟕ (u.id = pen.user_id) PendingStats pen
        )
        ⟕ (u.id = pay.user_id) PaymentStats pay
      )
      ⟕ (u.id = doc.user_id) DocumentStats doc
    )
  )
)
}}}

=== Складирана процедура

Извештајот е даден и како функција со параметар, за апликацијата со истата рутина
да добие и едно досие и списокот на сите студенти:

{{{#!sql
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
    -- барањето прикажано погоре, со услов:
    -- AND (p_user_id IS NULL OR u.id = p_user_id)
$$;

SELECT * FROM rep_student_dossier();   -- сите студенти
SELECT * FROM rep_student_dossier(1);  -- едно досие
}}}

Истиот извештај е спакуван и како вистинска процедура која отвора курсор, за
повикувач кој ги чита редовите еден по еден наместо одеднаш:

{{{#!sql
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
}}}

Повик:

{{{#!sql
BEGIN;
CALL rep_student_dossier_cursor(1);
FETCH ALL FROM dossier;
COMMIT;
}}}

Курсорот постои само во рамки на трансакцијата во која е отворен, затоа повикот е
опкружен со BEGIN и COMMIT.

=== Резултат врз тест податоците

{{{
 student_index |      student       | enrolled_semesters | completed_semesters | passed_subjects | pending_subjects | credits | average_grade | total_paid | num_documents | documents_cost
---------------+--------------------+--------------------+---------------------+-----------------+------------------+---------+---------------+------------+---------------+----------------
 233149        | Stefan Saveski     |                  2 |                   1 |               2 |                1 |      12 | 9.00          |        400 |             2 |            150
 233188        | Boris Gjorgjievski |                  1 |                   1 |               1 |                0 |       6 | 9.00          |        400 |             1 |             50
 233200        | Ana Petrova        |                  1 |                   0 |               1 |                1 |       6 | 7.00          |        200 |             1 |            100
}}}

== 3. Најуспешен студент по студиска програма

=== Опис на извештајот

За секоја студиска програма се бара студентот со најмногу собрани кредити, а при
ист број кредити - оној со повисок просек. Ако и просекот е ист, победува
студентот со помал идентификатор, за извештајот да враќа точно еден ред по
програма и да дава ист резултат при секое стартување.

Барањето е решено без прозорски функции, со NOT EXISTS: се задржува само оној ред
за кој '''не постои''' подобар ред во истата програма. Истата техника е употребена
и во извештаите 4 и 5.

=== SQL

{{{#!sql
SET search_path TO project;

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
SELECT m.name                       AS major,
       u."index"                    AS student_index,
       u.name || ' ' || u.surname   AS student,
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
}}}

Празните вредности се претворени во нула уште во подизразот standing. Ако тоа не
се направи, споредбите со NULL даваат NULL наместо точно или неточно, па студент
без ниту една оценка не би можел да биде ниту задржан ниту отфрлен.

=== Релациона алгебра

{{{
Standing <-
γ user_id := es.user_id,
  major_id := es.major_id;
  passed_subjects := COUNT(ps.id),
  credits := SUM(s.awarded_credits),
  average_grade := AVG(ps.grade)
(
  (
    (enrolled_semesters es ⟕ (es.id = ss.enrolled_semesters_id) semesters_subjects ss)
    ⟕ (ss.id = ps.enrolled_id) passed_subjects ps
  )
  ⟕ (ss.subjects_id = s.id ∧ ps.id IS NOT NULL) subjects s
)

Dominated <-
π attributes(st)
(
  σ st.major_id = st1.major_id ∧
    (
      st.credits < st1.credits
      ∨ (st.credits = st1.credits ∧ st.average_grade < st1.average_grade)
      ∨ (st.credits = st1.credits ∧ st.average_grade = st1.average_grade ∧
         st.user_id > st1.user_id)
    )
  (
    ρ st(Standing) × ρ st1(Standing)
  )
)

TopStudents <- Standing − Dominated

Result <-
τ m.name
(
  π m.name,
    u.index,
    student := u.name || ' ' || u.surname,
    st.passed_subjects,
    st.credits,
    st.average_grade
  (
    (
      TopStudents st ⨝ (st.user_id = u.id) users u
    )
    ⨝ (st.major_id = m.id) major m
  )
)
}}}

Условот NOT EXISTS во релациона алгебра се изразува со разлика: од сите редови се
одземаат оние за кои постои подобар ред во истата група.

=== Складирана процедура

{{{#!sql
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
    -- барањето прикажано погоре
$$;

SELECT * FROM rep_top_student_per_major();
}}}

=== Резултат врз тест податоците

{{{
                    major                     | student_index |    student     | passed_subjects | credits | average_grade
----------------------------------------------+---------------+----------------+-----------------+---------+---------------
 Computer Science and Engineering             | 233200        | Ana Petrova    |               1 |       6 |          7.00
 Software Engineering and Information Systems | 233149        | Stefan Saveski |               2 |      12 |          9.00
}}}

== 4. Најоптоварен професор по активен семестар

=== Опис на извештајот

За секој активен семестар се бара професорот кај кого се запишани најмногу
студенти, а при ист број - оној кој оценил повеќе. Извештајот тргнува од табелата
active_semesters, па во него се појавуваат и семестрите во кои сè уште никој не се
запишал; за нив се прикажува 'n/a' и нули. Тоа е список кој администраторот го
користи за да види каде распоредот сè уште не е пополнет.

=== SQL

{{{#!sql
SET search_path TO project;

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
       a.type                                      AS semester_type,
       COALESCE(u.name || ' ' || u.surname, 'n/a') AS professor,
       COALESCE(b.subjects_taught, 0)              AS subjects_taught,
       COALESCE(b.enrolled_students, 0)            AS enrolled_students,
       COALESCE(b.graded_students, 0)              AS graded_students
FROM active_semesters a
LEFT JOIN busiest b ON b.semester_id = a.id
LEFT JOIN users u   ON u.id = b.professor_id
ORDER BY a.year, CASE a.type WHEN 'summer' THEN 1 ELSE 2 END;
}}}

Подредувањето не оди по името на семестарот, туку по година и по редоследот во
академската година - летниот семестар доаѓа пред зимскиот од истата година.

=== Релациона алгебра

{{{
ProfessorLoad <-
γ semester_id := es.semester_id,
  professor_id := ss.professor_id;
  enrolled_students := COUNT(ss.id),
  graded_students := COUNT(ps.id),
  subjects_taught := COUNT(DISTINCT ss.subjects_id)
(
  (
    semesters_subjects ss
    ⨝ (ss.enrolled_semesters_id = es.id) enrolled_semesters es
  )
  ⟕ (ss.id = ps.enrolled_id) passed_subjects ps
)

Dominated <-
π attributes(pl)
(
  σ pl.semester_id = pl1.semester_id ∧
    (
      pl.enrolled_students < pl1.enrolled_students
      ∨ (pl.enrolled_students = pl1.enrolled_students ∧
         pl.graded_students < pl1.graded_students)
      ∨ (pl.enrolled_students = pl1.enrolled_students ∧
         pl.graded_students = pl1.graded_students ∧
         pl.professor_id > pl1.professor_id)
    )
  (
    ρ pl(ProfessorLoad) × ρ pl1(ProfessorLoad)
  )
)

Busiest <- ProfessorLoad − Dominated

Result <-
τ a.year, (a.type = 'summer' ? 1 : 2)
(
  π a.year,
    a.type,
    professor := u.name || ' ' || u.surname,
    b.subjects_taught,
    b.enrolled_students,
    b.graded_students
  (
    (
      active_semesters a ⟕ (a.id = b.semester_id) Busiest b
    )
    ⟕ (b.professor_id = u.id) users u
  )
)
}}}

=== Складирана процедура

{{{#!sql
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
    -- барањето прикажано погоре
$$;

SELECT * FROM rep_busiest_professor();
}}}

=== Резултат врз тест податоците

{{{
 year | semester_type |    professor     | subjects_taught | enrolled_students | graded_students
------+---------------+------------------+-----------------+-------------------+-----------------
 2024 | winter        | Vangel Ajanovski |               1 |                 3 |               3
 2025 | summer        | Vangel Ajanovski |               1 |                 1 |               0
 2025 | winter        | n/a              |               0 |                 0 |               0
 2026 | summer        | n/a              |               0 |                 0 |               0
 2026 | winter        | n/a              |               0 |                 0 |               0
}}}

== 5. Процентуална промена на активноста меѓу два последователни семестри

=== Опис на извештајот

За секој активен семестар се прикажува колку запишувања, колку запишани предмети и
колку положени предмети имало, и колку тоа отстапува од претходниот семестар,
изразено во проценти. Ова е извештајот со кој се следи дали бројот на запишувања
расте или опаѓа.

Семестрите немаат колона со редослед - тие се пар од година и тип. Затоа прво се
пресметува хронолошки клуч, а потоа за секој семестар се бара претходниот како оној
пред него за кој '''не постои''' семестар помеѓу нив.

=== SQL

{{{#!sql
SET search_path TO project;

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
SELECT c.year || '-' || c.type                                       AS semester,
       COALESCE(c.prev_year || '-' || c.prev_type, 'нема претходен')  AS previous_semester,
       c.enrolments,
       c.subject_enrolments,
       c.passed,
       COALESCE(CAST(c.prev_subject_enrolments AS VARCHAR), 'n/a')   AS prev_subject_enrolments,
       COALESCE(CAST(ROUND(((c.subject_enrolments - c.prev_subject_enrolments) * 100.0)
                           / NULLIF(c.prev_subject_enrolments, 0)) AS VARCHAR) || '%',
                'n/a')                                              AS pct_change
FROM consecutive c
ORDER BY c.chrono;
}}}

Процентот се спојува со знакот '%' преку операторот {{{||}}}, а не преку CONCAT.
CONCAT ги игнорира празните вредности и за семестар без претходник би вратил само
'%', па COALESCE никогаш не би се активирал. Операторот {{{||}}} враќа NULL ако
некој од операндите е NULL, што е токму она што му треба на COALESCE за да испише
'n/a'.

Делењето е заштитено со NULLIF, за семестар во кој претходно немало ниту еден
запишан предмет да не предизвика делење со нула.

=== Релациона алгебра

{{{
OrderedSemesters <-
π a.id,
  a.year,
  a.type,
  chrono := a.year * 10 + (a.type = 'summer' ? 1 : 2)
(
  active_semesters a
)

SemesterStats <-
γ semester_id := o.id,
  year := o.year,
  type := o.type,
  chrono := o.chrono;
  enrolments := COUNT(DISTINCT es.id),
  subject_enrolments := COUNT(ss.id),
  passed := COUNT(ps.id)
(
  (
    (
      OrderedSemesters o ⟕ (o.id = es.semester_id) enrolled_semesters es
    )
    ⟕ (es.id = ss.enrolled_semesters_id) semesters_subjects ss
  )
  ⟕ (ss.id = ps.enrolled_id) passed_subjects ps
)

Earlier <-
σ prev.chrono < cur.chrono
(
  ρ cur(SemesterStats) × ρ prev(SemesterStats)
)

NotImmediate <-
π attributes(Earlier)
(
  σ mid.chrono < cur.chrono ∧ mid.chrono > prev.chrono
  (
    Earlier × ρ mid(SemesterStats)
  )
)

Immediate <- Earlier − NotImmediate

Consecutive <-
SemesterStats cur ⟕ (cur.chrono = imm.cur_chrono) Immediate imm

Result <-
τ c.chrono
(
  π semester := c.year || '-' || c.type,
    previous_semester := c.prev_year || '-' || c.prev_type,
    c.enrolments,
    c.subject_enrolments,
    c.passed,
    c.prev_subject_enrolments,
    pct_change := ((c.subject_enrolments − c.prev_subject_enrolments) * 100)
                  / c.prev_subject_enrolments
  (
    Consecutive c
  )
)
}}}

Релацијата Immediate ги содржи само паровите (семестар, претходен семестар) меѓу
кои нема трет семестар. Тоа е истата разлика како во извештаите 3 и 4: од сите
порани парови се одземаат оние за кои постои семестар помеѓу.

=== Складирана процедура

{{{#!sql
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
    -- барањето прикажано погоре
$$;

SELECT * FROM rep_semester_growth();
}}}

=== Резултат врз тест податоците

{{{
  semester   | previous_semester | enrolments | subject_enrolments | passed | prev_subject_enrolments | pct_change
-------------+-------------------+------------+--------------------+--------+-------------------------+------------
 2024-winter | нема претходен    |          3 |                  5 |      4 | n/a                     | n/a
 2025-summer | 2024-winter       |          1 |                  1 |      0 | 5                       | -80%
 2025-winter | 2025-summer       |          0 |                  0 |      0 | 1                       | -100%
 2026-summer | 2025-winter       |          0 |                  0 |      0 | 0                       | n/a
 2026-winter | 2026-summer       |          0 |                  0 |      0 | 0                       | n/a
}}}

== Заеднички забелешки за имплементацијата

 * '''Еден ред по група без прозорски функции.''' Извештаите 3, 4 и 5 бараат „најдобриот во групата“ односно „претходниот по ред“. Наместо ROW_NUMBER, употребен е NOT EXISTS, кој во релациона алгебра директно се пресликува во разлика на две релации. Условот за израмнување е секогаш строг и завршува со споредба на идентификатор, па извештајот враќа точно еден ред по група и е повторлив.
 * '''Надворешни спојувања наместо внатрешни.''' Предмет кој никој не го положил, семестар во кој никој не се запишал и студент кој нема платено сепак се појавуваат во извештаите. Внатрешно спојување би ги сокрило токму редовите кои се најинтересни за администраторот.
 * '''Претворање на оценката.''' grade е од набројувачки тип, па {{{AVG(grade)}}} не е дозволено. Секаде е употребено {{{ps.grade::TEXT::INT}}}.
 * '''Празни вредности.''' Сите бројачи излегуваат преку COALESCE како нула, а просеците како текстот 'нема оценки'. Делењата се заштитени со NULLIF.
 * '''Патека на шемата.''' Секоја рутина носи {{{SET search_path = project}}}, па работи исто без оглед на тоа што повикувачот поставил.

== Историјат

 '''Верзија 1''' - Прва верзија: пет извештаи, секој со SQL, релациона алгебра и
 складирана рутина. Сите барања се тестирани врз шемата project со податоците од
 data_load.sql.

== Статус

 ''' [[span(style=color: #FF8000, Во тек )]] '''
