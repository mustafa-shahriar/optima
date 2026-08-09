import { pgTable, text, timestamp, boolean, bigint, varchar, numeric, smallint, pgEnum, uniqueIndex } from 'drizzle-orm/pg-core';

/* ── Better Auth core tables ───────────────────────────── */

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  role: text('role').notNull().default('student'),
  studentId: bigint('student_id', { mode: 'number' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
});

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

/* ── App-specific tables ─────────────────────────────────── */

export const students = pgTable('students', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
  regNumber: varchar('reg_number', { length: 32 }).notNull().unique(),
  name: varchar('name', { length: 120 }).notNull(),
  section: varchar('section', { length: 32 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const claimRequests = pgTable('claim_requests', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
  userId: text('user_id').notNull(),
  studentId: bigint('student_id', { mode: 'number' }).notNull(),
  status: varchar('status', { length: 16 }).notNull().default('pending'),
  requestedAt: timestamp('requested_at', { withTimezone: true }).notNull().defaultNow(),
  decidedBy: text('decided_by'),
  decidedAt: timestamp('decided_at', { withTimezone: true }),
  rejectionReason: text('rejection_reason'),
});

export const courses = pgTable('courses', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
  code: varchar('code', { length: 32 }).notNull(),
  name: varchar('name', { length: 160 }).notNull(),
  creditHours: numeric('credit_hours', { precision: 3, scale: 1 }).notNull().default('3.0'),
  yearLevel: smallint('year_level').notNull(),
  semester: smallint('semester').notNull(),
  academicYear: smallint('academic_year').notNull(),
}, (table) => ({
  codeYear: uniqueIndex('courses_code_academic_year_uidx').on(table.code, table.academicYear),
}));

export const examTypeEnum = pgEnum('exam_type', ['attendance', 'term_test_1', 'term_test_2', 'quiz', 'final_exam']);

export const exam = pgTable('exam', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
  courseId: bigint('course_id', { mode: 'number' }).notNull(),
  type: examTypeEnum('type').notNull(),
  maxMarks: numeric('max_marks', { precision: 5, scale: 2 }).notNull(),
}, (table) => ({
  courseType: uniqueIndex('exam_course_type_uidx').on(table.courseId, table.type),
}));

export const resultComponents = pgTable('result_components', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
  studentId: bigint('student_id', { mode: 'number' }).notNull(),
  courseId: bigint('course_id', { mode: 'number' }).notNull(),
  term: varchar('term', { length: 32 }).notNull(),
  examId: bigint('exam_id', { mode: 'number' }).notNull(),
  marksObtained: numeric('marks_obtained', { precision: 5, scale: 2 }).notNull(),
  enteredBy: text('entered_by'),
  enteredAt: timestamp('entered_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  uniqueComponent: uniqueIndex('result_components_unique_uidx').on(
    table.studentId,
    table.courseId,
    table.term,
    table.examId,
  ),
}));

export const gradingScale = pgTable('grading_scale', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
  minMarks: numeric('min_marks', { precision: 5, scale: 2 }).notNull(),
  maxMarks: numeric('max_marks', { precision: 5, scale: 2 }).notNull(),
  grade: varchar('grade', { length: 4 }).notNull(),
  gradePoint: numeric('grade_point', { precision: 3, scale: 2 }).notNull(),
});

export const questions = pgTable('questions', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
  courseId: bigint('course_id', { mode: 'number' }).notNull(),
  instructorName: varchar('instructor_name', { length: 120 }).notNull(),
  term: varchar('term', { length: 32 }),
  questionText: text('question_text'),
  fileUrl: text('file_url'),
  uploadedBy: text('uploaded_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const auditLogs = pgTable('audit_logs', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
  actorId: text('actor_id'),
  action: varchar('action', { length: 64 }).notNull(),
  targetType: varchar('target_type', { length: 32 }),
  targetId: bigint('target_id', { mode: 'number' }),
  metadata: text('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type { ExamType } from '@/lib/exams';
export { EXAM_TYPES, EXAM_TYPE_LABELS } from '@/lib/exams';