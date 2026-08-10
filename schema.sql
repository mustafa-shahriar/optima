-- ============================================================
-- Student Portal ("Result And More") — Database Schema
-- Target: PostgreSQL 14+
-- Based on: Student_Portal_SRS.docx v1.1
-- ============================================================

-- ---------------------------------------------------------
-- 1. Student Records — admin-managed, source of truth for who's real.
--    No login info ever lives here (FR1).
-- ---------------------------------------------------------
CREATE TABLE students (
    id          BIGSERIAL PRIMARY KEY,
    reg_number  VARCHAR(32)  NOT NULL UNIQUE,
    name        VARCHAR(120) NOT NULL,
    section     VARCHAR(32)  NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------
-- 2. OAuth-authenticated accounts.
--    role is a plain field, not hardcoded logic (per SRS design note).
--    student_id UNIQUE enforces "one account per student record" (FR7)
--    at the DB level, not just app logic.
-- ---------------------------------------------------------
CREATE TABLE users (
    id                BIGSERIAL PRIMARY KEY,
    email             VARCHAR(255) NOT NULL UNIQUE,
    oauth_provider    VARCHAR(32)  NOT NULL,
    oauth_subject_id  VARCHAR(255) NOT NULL,
    role              VARCHAR(16)  NOT NULL DEFAULT 'student'
                          CHECK (role IN ('student', 'admin')),
    student_id        BIGINT UNIQUE REFERENCES students(id) ON DELETE SET NULL,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    UNIQUE (oauth_provider, oauth_subject_id)
);

CREATE INDEX idx_users_student_id ON users(student_id);

-- ---------------------------------------------------------
-- 3. Claim requests — the real access-control gate (FR5-FR8).
--    Multiple pending claims on the same student_id are allowed
--    on purpose: two users can both claim a reg_number before an
--    admin sorts out which one is legitimate.
-- ---------------------------------------------------------
CREATE TABLE claim_requests (
    id                BIGSERIAL PRIMARY KEY,
    user_id           BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_id        BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    status            VARCHAR(16) NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending', 'approved', 'rejected')),
    requested_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    decided_by        BIGINT REFERENCES users(id) ON DELETE SET NULL,
    decided_at        TIMESTAMPTZ,
    rejection_reason  TEXT
);

CREATE INDEX idx_claims_student_id ON claim_requests(student_id);
CREATE INDEX idx_claims_status     ON claim_requests(status);
CREATE INDEX idx_claims_user_id    ON claim_requests(user_id);

-- ---------------------------------------------------------
-- 4. Courses.
--    year_level + semester = where this course sits in the program
--    (e.g. year_level=1, semester=2 is "1/2"). academic_year is the
--    actual calendar year a batch takes it (e.g. 2026) — so the same
--    course code can recur across years as a new row.
--    credit_hours is required to weight CGPA across courses (FR16) —
--    not in the SRS draft, added here.
-- ---------------------------------------------------------
CREATE TABLE courses (
    id             BIGSERIAL PRIMARY KEY,
    code           VARCHAR(32)  NOT NULL,
    name           VARCHAR(160) NOT NULL,
    credit_hours   NUMERIC(3,1) NOT NULL DEFAULT 3.0,
    year_level     SMALLINT NOT NULL,                  -- 1st/2nd/3rd/4th year of the program
    semester       SMALLINT NOT NULL CHECK (semester IN (1, 2)),
    academic_year  SMALLINT NOT NULL,                  -- e.g. 2026
    UNIQUE (code, academic_year)
);

-- ---------------------------------------------------------
-- 5. Exam — the weighted components that make up a course's 100
--    marks (attendance, term tests, quiz, final). type is a fixed
--    enum rather than free text. Scoped to course_id: each course
--    defines its own breakdown. The (id, course_id) unique pair lets
--    result_components below enforce, via composite FK, that its
--    course_id always matches the exam it's pointing at.
--
--    Note: baking "term_test_1"/"term_test_2" into the enum means
--    adding a 3rd term test later needs an ALTER TYPE migration. If
--    the number of term tests might vary by course, a plain
--    ('attendance','term_test','quiz','final_exam') enum plus a
--    small integer "sequence" column would flex more easily — happy
--    to switch to that if it's likely to come up.
-- ---------------------------------------------------------
CREATE TYPE exam_type AS ENUM (
    'attendance',
    'term_test_1',
    'term_test_2',
    'quiz',
    'final_exam'
);

CREATE TABLE exam (
    id          BIGSERIAL PRIMARY KEY,
    course_id   BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    type        exam_type NOT NULL,
    max_marks   NUMERIC(5,2) NOT NULL,
    UNIQUE (course_id, type),
    UNIQUE (id, course_id)
);

CREATE INDEX idx_exam_course ON exam(course_id);

-- Example: seeding the standard 100-mark breakdown for one course
-- offering. Repeat per course row (one per code + academic_year).
-- INSERT INTO exam (course_id, type, max_marks)
-- SELECT courses.id, v.type, v.max_marks
-- FROM courses, (VALUES
--     ('attendance'::exam_type,   10),
--     ('term_test_1'::exam_type,  10),
--     ('term_test_2'::exam_type,  10),
--     ('quiz'::exam_type,         10),
--     ('final_exam'::exam_type,   60)
-- ) AS v(type, max_marks)
-- WHERE courses.code = 'IPE-112' AND courses.academic_year = 2026;

-- ---------------------------------------------------------
-- 6. Result components — one row per student/course/term/exam.
--    Replaces a single "marks" field: each piece is entered
--    separately (attendance, each term test, quiz, final), then
--    summed via the view below to get the course total.
--    The composite FK ties exam_id to course_id so a component can
--    never point at another course's exam by mistake.
-- ---------------------------------------------------------
CREATE TABLE result_components (
    id              BIGSERIAL PRIMARY KEY,
    student_id      BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    course_id       BIGINT NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
    term            VARCHAR(32) NOT NULL,       -- e.g. '2026-Spring'
    exam_id         BIGINT NOT NULL,
    marks_obtained  NUMERIC(5,2) NOT NULL CHECK (marks_obtained >= 0),
    entered_by      BIGINT REFERENCES users(id) ON DELETE SET NULL,
    entered_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (student_id, course_id, term, exam_id),
    FOREIGN KEY (exam_id, course_id) REFERENCES exam(id, course_id)
);

CREATE INDEX idx_result_components_student ON result_components(student_id);
CREATE INDEX idx_result_components_course  ON result_components(course_id);

-- Note: now that a course row already pins year_level/semester/
-- academic_year, the free-text "term" here is somewhat redundant
-- with the course it points to. Worth dropping if you find yourself
-- keeping the two in sync by hand — flagging, not changing it yet.

-- ---------------------------------------------------------
-- 7. Grading scale — converts a summed 0-100 course total into a
--    letter grade and grade point. Fill in your university's actual
--    brackets; ranges below are a placeholder and must be contiguous
--    (no gaps, no overlaps) or student_course_grades will miss rows.
-- ---------------------------------------------------------
CREATE TABLE grading_scale (
    id           BIGSERIAL PRIMARY KEY,
    min_marks    NUMERIC(5,2) NOT NULL,
    max_marks    NUMERIC(5,2) NOT NULL,
    grade        VARCHAR(4)  NOT NULL,
    grade_point  NUMERIC(3,2) NOT NULL
);

-- Placeholder values — replace with the real scale:
INSERT INTO grading_scale (min_marks, max_marks, grade, grade_point) VALUES
    (80, 100, 'A+', 4.00),
    (75, 79.99, 'A',  3.75),
    (70, 74.99, 'A-', 3.50),
    (65, 69.99, 'B+', 3.25),
    (60, 64.99, 'B',  3.00),
    (55, 59.99, 'B-', 2.75),
    (50, 54.99, 'C+', 2.50),
    (45, 49.99, 'C',  2.25),
    (40, 44.99, 'D',  2.00),
    (0,  39.99, 'F',  0.00);

-- ---------------------------------------------------------
-- 8. Question bank (FR17-FR19).
--    instructor_name lives here (not on courses) because a course's
--    instructor can differ by term, and the question bank filters
--    on "who set this particular question," not "who currently
--    teaches this course."
-- ---------------------------------------------------------
CREATE TABLE questions (
    id               BIGSERIAL PRIMARY KEY,
    course_id        BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    instructor_name  VARCHAR(120) NOT NULL,
    term             VARCHAR(32),
    question_text    TEXT,
    file_url         TEXT,
    uploaded_by      BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (question_text IS NOT NULL OR file_url IS NOT NULL)
);

CREATE INDEX idx_questions_course_instructor ON questions(course_id, instructor_name);

-- ---------------------------------------------------------
-- 9. Admin audit log (NFR: Auditability).
-- ---------------------------------------------------------
CREATE TABLE audit_logs (
    id           BIGSERIAL PRIMARY KEY,
    actor_id     BIGINT REFERENCES users(id) ON DELETE SET NULL,
    action       VARCHAR(64) NOT NULL,   -- e.g. 'claim_approved', 'result_entered'
    target_type  VARCHAR(32),
    target_id    BIGINT,
    metadata     JSONB,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_actor ON audit_logs(actor_id);

-- ============================================================
-- Views — everything below is computed, nothing is hand-entered.
-- ============================================================

-- Sums a student's entered components into a course/term total.
-- Will be a partial sum until every exam has a row entered —
-- that's expected mid-term, just don't treat it as final until then.
CREATE VIEW student_course_totals AS
SELECT
    rc.student_id,
    rc.course_id,
    rc.term,
    SUM(rc.marks_obtained) AS total_marks
FROM result_components rc
GROUP BY rc.student_id, rc.course_id, rc.term;

-- Looks up the letter grade + grade point for each course total.
CREATE VIEW student_course_grades AS
SELECT
    t.student_id,
    t.course_id,
    t.term,
    t.total_marks,
    g.grade,
    g.grade_point
FROM student_course_totals t
JOIN grading_scale g
  ON t.total_marks >= g.min_marks AND t.total_marks <= g.max_marks;

-- Credit-weighted CGPA across all graded courses.
CREATE VIEW student_cgpa AS
SELECT
    scg.student_id,
    ROUND(
        SUM(scg.grade_point * c.credit_hours) / NULLIF(SUM(c.credit_hours), 0),
        2
    ) AS cgpa
FROM student_course_grades scg
JOIN courses c ON c.id = scg.course_id
GROUP BY scg.student_id;
