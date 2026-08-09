import { pgTable, bigint, varchar, timestamp, text, numeric, smallint, boolean, uniqueIndex, pgEnum } from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role', ['student', 'admin']);
export const examTypeEnum = pgEnum('exam_type', ['attendance', 'term_test_1', 'term_test_2', 'quiz', 'final_exam']);

export const students = pgTable('students', {
  id: bigint('id', { mode: 'number' }).primaryKey(),
  regNumber: varchar('reg_number', { length: 32 }).notNull().unique(),
  name: varchar('name', { length: 120 }).notNull(),
  section: varchar('section', { length: 32 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const users = pgTable('users', {
  id: bigint('id', { mode: 'number' }).primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  oauthProvider: varchar('oauth_provider', { length: 32 }).notNull().default('credentials'),
  oauthSubjectId: varchar('oauth_subject_id', { length: 255 }).notNull().default('credentials'),
  passwordHash: varchar('password_hash', { length: 255 }),
  role: roleEnum('role').notNull().default('student'),
  studentId: bigint('student_id', { mode: 'number' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const claimRequests = pgTable('claim_requests', {
  id: bigint('id', { mode: 'number' }).primaryKey(),
  userId: bigint('user_id', { mode: 'number' }).notNull(),
  studentId: bigint('student_id', { mode: 'number' }).notNull(),
  status: varchar('status', { length: 16 }).notNull().default('pending'),
  requestedAt: timestamp('requested_at', { withTimezone: true }).notNull().defaultNow(),
  decidedBy: bigint('decided_by', { mode: 'number' }),
  decidedAt: timestamp('decided_at', { withTimezone: true }),
  rejectionReason: text('rejection_reason'),
});

export const courses = pgTable('courses', {
  id: bigint('id', { mode: 'number' }).primaryKey(),
  code: varchar('code', { length: 32 }).notNull(),
  name: varchar('name', { length: 160 }).notNull(),
  creditHours: numeric('credit_hours', { precision: 3, scale: 1 }).notNull().default('3.0'),
  yearLevel: smallint('year_level').notNull(),
  semester: smallint('semester').notNull(),
  academicYear: smallint('academic_year').notNull(),
});

export const exam = pgTable('exam', {
  id: bigint('id', { mode: 'number' }).primaryKey(),
  courseId: bigint('course_id', { mode: 'number' }).notNull(),
  type: examTypeEnum('type').notNull(),
  maxMarks: numeric('max_marks', { precision: 5, scale: 2 }).notNull(),
});

export const resultComponents = pgTable('result_components', {
  id: bigint('id', { mode: 'number' }).primaryKey(),
  studentId: bigint('student_id', { mode: 'number' }).notNull(),
  courseId: bigint('course_id', { mode: 'number' }).notNull(),
  term: varchar('term', { length: 32 }).notNull(),
  examId: bigint('exam_id', { mode: 'number' }).notNull(),
  marksObtained: numeric('marks_obtained', { precision: 5, scale: 2 }).notNull(),
  enteredBy: bigint('entered_by', { mode: 'number' }),
  enteredAt: timestamp('entered_at', { withTimezone: true }).notNull().defaultNow(),
});

export const gradingScale = pgTable('grading_scale', {
  id: bigint('id', { mode: 'number' }).primaryKey(),
  minMarks: numeric('min_marks', { precision: 5, scale: 2 }).notNull(),
  maxMarks: numeric('max_marks', { precision: 5, scale: 2 }).notNull(),
  grade: varchar('grade', { length: 4 }).notNull(),
  gradePoint: numeric('grade_point', { precision: 3, scale: 2 }).notNull(),
});

export const questions = pgTable('questions', {
  id: bigint('id', { mode: 'number' }).primaryKey(),
  courseId: bigint('course_id', { mode: 'number' }).notNull(),
  instructorName: varchar('instructor_name', { length: 120 }).notNull(),
  term: varchar('term', { length: 32 }),
  questionText: text('question_text'),
  fileUrl: text('file_url'),
  uploadedBy: bigint('uploaded_by', { mode: 'number' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const auditLogs = pgTable('audit_logs', {
  id: bigint('id', { mode: 'number' }).primaryKey(),
  actorId: bigint('actor_id', { mode: 'number' }),
  action: varchar('action', { length: 64 }).notNull(),
  targetType: varchar('target_type', { length: 32 }),
  targetId: bigint('target_id', { mode: 'number' }),
  metadata: text('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
