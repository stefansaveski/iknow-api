# Schema diagram

Generated from [`schema_creation.sql`](schema_creation.sql), which is the source of truth. If you change
a table there, change it here too.

Renders inline on GitHub and in the VS Code markdown preview (Ctrl+Shift+V) -
no extension or tooling needed. Relationship labels use the names from the
conceptual ER model.

```mermaid
erDiagram
    users {
        integer id PK
        varchar name
        varchar embg
        varchar surname
        varchar index
        timestamp bday
        varchar email UK
        varchar password
        user_role role
        quota_type quota
        integer enrollment_year
        timestamp created_at
    }

    high_school {
        integer id PK
        integer user_id FK,UK
        real gpa
        hs_type type
    }

    contact {
        integer id PK
        integer user_id FK,UK
        varchar city
        varchar municipality
        varchar address
        varchar number
        varchar microsoft_email
    }

    major {
        integer id PK
        varchar name
    }

    active_semesters {
        integer id PK
        integer year UK
        semester_type type UK
    }

    subjects {
        integer id PK
        varchar name UK
        varchar code UK
        integer awarded_credits
        integer dependency_credit
    }

    enrolled_semesters {
        integer id PK
        integer user_id FK,UK
        quota_type quota
        integer major_id FK
        varchar note
        varchar student_comment
        timestamp created_at
        timestamp last_change
        timestamp completed
        integer semester_id FK,UK
    }

    semesters_subjects {
        integer id PK
        integer enrolled_semesters_id FK,UK
        integer subjects_id FK,UK
        integer professor_id FK
        boolean signature
    }

    passed_subjects {
        integer id PK
        integer enrolled_id FK,UK
        grade_type grade
        timestamp date_passed
    }

    documents {
        integer id PK
        varchar type
        text body
        integer cost
    }

    user_documents {
        integer user_id PK,FK
        integer document_id PK,FK
    }

    token {
        integer id PK
        integer user_id FK
        varchar token
        timestamp expires_at
        boolean is_valid
    }

    payment {
        integer id PK
        integer user_id FK
        integer enrollment_id FK
        integer amount
    }

    major_subjects {
        integer major_id PK,FK
        integer subject_id PK,FK
        integer mandatory_semester
    }

    dependency_subject {
        integer subject_id PK,FK
        integer dependency_id PK,FK
    }

    professour_subjects {
        integer prof_id PK,FK
        integer active_semester_id PK,FK
        integer subject_id PK,FK
    }

    users               ||--o| high_school        : has_hs
    users               ||--o| contact            : has_contact
    users               ||--o{ token              : has_token
    users               ||--o{ payment            : pays
    users               ||--o{ enrolled_semesters : submits
    users               ||--o{ user_documents     : owns
    documents           ||--o{ user_documents     : owned_by
    users               ||--o{ semesters_subjects : teaches
    users               ||--o{ professour_subjects : teaches_subject

    major               ||--o{ enrolled_semesters : for_major
    active_semesters    ||--o{ enrolled_semesters : during
    enrolled_semesters  ||--o{ semesters_subjects : contains
    enrolled_semesters  ||--o{ payment            : for_enrollment

    subjects            ||--o{ semesters_subjects : taken_in
    semesters_subjects  ||--o| passed_subjects    : results_in

    major               ||--o{ major_subjects     : includes
    subjects            ||--o{ major_subjects     : included_in

    subjects            ||--o{ dependency_subject : requires
    subjects            ||--o{ dependency_subject : prerequisite_for

    active_semesters    ||--o{ professour_subjects : taught_in
    subjects            ||--o{ professour_subjects : taught_as
```

## Enum types

| Type | Labels |
|------|--------|
| `user_role` | `student`, `prof`, `admin` |
| `hs_type` | `strucen`, `gimnazija` |
| `quota_type` | `privatna`, `drzavna`, `stipendija` |
| `semester_type` | `summer`, `winter` |
| `grade_type` | `6`, `7`, `8`, `9`, `10` |

## Notes

- `UK` on `enrolled_semesters.user_id` / `semester_id` is the composite
  `UNIQUE (user_id, semester_id)` - one enrolment per student per semester.
  Same for `semesters_subjects (enrolled_semesters_id, subjects_id)` and
  `active_semesters (year, type)`.
- `users` appears twice around `semesters_subjects`: once as the student, via
  `enrolled_semesters.user_id`, and once as `professor_id`. The ER model links
  the student through the enrolment, not directly.
- `dependency_subject` is `subjects` related to itself: `subject_id` is the
  dependent subject and `dependency_id` the prerequisite, with a `CHECK` that
  they differ.
- `professour_subjects` keeps the spelling used by the table in `schema_creation.sql`.
