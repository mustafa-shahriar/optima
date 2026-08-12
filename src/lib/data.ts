import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm';
import { db } from '@/db';
import {
  auditLogs,
  claimRequests,
  courses,
  exam,
  gradingScale,
  questions,
  resultComponents,
  students,
  user,
} from '@/db/schema';
import { EXAM_TYPES, type ExamType } from '@/lib/exams';

export interface StudentSummary {
  id: number;
  regNumber: string;
  name: string;
  section: string;
}

export interface ClaimRecord {
  id: number;
  userId: string;
  studentId: number;
  status: string;
  requestedAt: Date;
  decidedAt: Date | null;
  rejectionReason: string | null;
  email: string | null;
  userName: string | null;
  regNumber: string | null;
  studentName: string | null;
  section: string | null;
}

export interface CourseRecord {
  id: number;
  code: string;
  name: string;
  creditHours: string;
  yearLevel: number;
  semester: number;
  academicYear: number;
}

export interface ExamRecord {
  id: number;
  courseId: number;
  type: ExamType;
  maxMarks: string;
}

export interface QuestionRecord {
  id: number;
  courseId: number;
  courseCode: string | null;
  courseName: string | null;
  instructorName: string;
  term: string | null;
  questionText: string | null;
  fileUrl: string | null;
  createdAt: Date;
}

export interface ComponentBreakdown {
  examId: number;
  type: ExamType;
  maxMarks: string;
  marksObtained: string | null;
}

export interface CourseResultDetail {
  courseId: number;
  courseCode: string;
  courseName: string;
  creditHours: string;
  term: string;
  components: ComponentBreakdown[];
  total: number | null;
  grade: string | null;
  gradePoint: string | null;
  finalized: boolean;
  enteredCount: number;
  expectedCount: number;
}

export interface MarkHistoryRow {
  courseId: number;
  courseCode: string;
  courseName: string;
  creditHours: string;
  term: string;
  total: number;
  grade: string;
  gradePoint: string;
}

function requireDatabase() {
  if (!db) throw new Error('Database not configured');
  return db;
}

export async function writeAuditLog(input: {
  actorId: string | null;
  action: string;
  targetType?: string;
  targetId?: number;
  metadata?: Record<string, unknown>;
}) {
  const database = requireDatabase();
  await database.insert(auditLogs).values({
    actorId: input.actorId,
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId,
    metadata: input.metadata ? JSON.stringify(input.metadata) : null,
  });
}

/* ── Students / student records ─────────────────────── */

export async function listStudents(): Promise<StudentSummary[]> {
  const database = requireDatabase();
  return database
    .select({
      id: students.id,
      regNumber: students.regNumber,
      name: students.name,
      section: students.section,
    })
    .from(students)
    .orderBy(asc(students.regNumber));
}

export async function getStudentById(id: number): Promise<StudentSummary | null> {
  const database = requireDatabase();
  const rows = await database
    .select({
      id: students.id,
      regNumber: students.regNumber,
      name: students.name,
      section: students.section,
    })
    .from(students)
    .where(eq(students.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function getStudentByRegNumber(regNumber: string): Promise<StudentSummary | null> {
  const database = requireDatabase();
  const rows = await database
    .select({
      id: students.id,
      regNumber: students.regNumber,
      name: students.name,
      section: students.section,
    })
    .from(students)
    .where(eq(students.regNumber, regNumber))
    .limit(1);
  return rows[0] ?? null;
}

export async function createStudent(input: { regNumber: string; name: string; section: string }) {
  const database = requireDatabase();
  const rows = await database
    .insert(students)
    .values({
      regNumber: input.regNumber.trim(),
      name: input.name.trim(),
      section: input.section.trim(),
    })
    .returning({
      id: students.id,
      regNumber: students.regNumber,
      name: students.name,
      section: students.section,
    });
  return rows[0];
}

export async function updateStudent(
  id: number,
  input: Partial<{ regNumber: string; name: string; section: string }>,
) {
  const database = requireDatabase();
  const rows = await database
    .update(students)
    .set({
      ...(input.regNumber !== undefined ? { regNumber: input.regNumber.trim() } : {}),
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.section !== undefined ? { section: input.section.trim() } : {}),
      updatedAt: new Date(),
    })
    .where(eq(students.id, id))
    .returning({
      id: students.id,
      regNumber: students.regNumber,
      name: students.name,
      section: students.section,
    });
  return rows[0] ?? null;
}

export async function deleteStudent(id: number) {
  const database = requireDatabase();
  const claimed = await database
    .select({ id: user.id })
    .from(user)
    .where(eq(user.studentId, id))
    .limit(1);

  const rows = await database
    .delete(students)
    .where(eq(students.id, id))
    .returning({ id: students.id });

  return { deleted: Boolean(rows[0]), wasClaimed: claimed.length > 0 };
}

export async function isStudentClaimed(studentId: number): Promise<boolean> {
  const database = requireDatabase();
  const rows = await database
    .select({ id: user.id })
    .from(user)
    .where(eq(user.studentId, studentId))
    .limit(1);
  return rows.length > 0;
}

/* ── Claims ────────────────────────────────────────────── */

export async function listClaims(status?: string): Promise<ClaimRecord[]> {
  const database = requireDatabase();
  const base = database
    .select({
      id: claimRequests.id,
      userId: claimRequests.userId,
      studentId: claimRequests.studentId,
      status: claimRequests.status,
      requestedAt: claimRequests.requestedAt,
      decidedAt: claimRequests.decidedAt,
      rejectionReason: claimRequests.rejectionReason,
      email: user.email,
      userName: user.name,
      regNumber: students.regNumber,
      studentName: students.name,
      section: students.section,
    })
    .from(claimRequests)
    .leftJoin(user, eq(claimRequests.userId, user.id))
    .leftJoin(students, eq(claimRequests.studentId, students.id));

  const rows = status
    ? await base.where(eq(claimRequests.status, status)).orderBy(desc(claimRequests.requestedAt))
    : await base.orderBy(desc(claimRequests.requestedAt));

  return rows;
}

export async function getClaimsForUser(userId: string): Promise<ClaimRecord[]> {
  const database = requireDatabase();
  return database
    .select({
      id: claimRequests.id,
      userId: claimRequests.userId,
      studentId: claimRequests.studentId,
      status: claimRequests.status,
      requestedAt: claimRequests.requestedAt,
      decidedAt: claimRequests.decidedAt,
      rejectionReason: claimRequests.rejectionReason,
      email: user.email,
      userName: user.name,
      regNumber: students.regNumber,
      studentName: students.name,
      section: students.section,
    })
    .from(claimRequests)
    .leftJoin(user, eq(claimRequests.userId, user.id))
    .leftJoin(students, eq(claimRequests.studentId, students.id))
    .where(eq(claimRequests.userId, userId))
    .orderBy(desc(claimRequests.requestedAt));
}

export async function getLatestClaimForUser(userId: string): Promise<ClaimRecord | null> {
  const rows = await getClaimsForUser(userId);
  return rows[0] ?? null;
}

export async function countPendingClaims(): Promise<number> {
  const database = requireDatabase();
  const rows = await database
    .select({ count: sql<number>`count(*)::int` })
    .from(claimRequests)
    .where(eq(claimRequests.status, 'pending'));
  return rows[0]?.count ?? 0;
}

export async function createClaimRequest(userId: string, studentId: number) {
  const database = requireDatabase();

  // Allow multiple pending claims (corrections). Block only an identical pending duplicate.
  const duplicate = await database
    .select({ id: claimRequests.id })
    .from(claimRequests)
    .where(
      and(
        eq(claimRequests.userId, userId),
        eq(claimRequests.studentId, studentId),
        eq(claimRequests.status, 'pending'),
      ),
    )
    .limit(1);

  if (duplicate[0]) {
    throw new Error('You already have a pending claim for that registration number.');
  }

  const rows = await database
    .insert(claimRequests)
    .values({ userId, studentId, status: 'pending' })
    .returning();

  return rows[0];
}

export async function createDirectAdminClaim(adminUserId: string, studentId: number) {
  const database = requireDatabase();

  const claimed = await isStudentClaimed(studentId);
  if (claimed) {
    throw new Error('That student record is already linked to another account');
  }

  await database
    .update(user)
    .set({ studentId, updatedAt: new Date() })
    .where(eq(user.id, adminUserId));

  const rows = await database
    .insert(claimRequests)
    .values({
      userId: adminUserId,
      studentId,
      status: 'approved',
      decidedBy: adminUserId,
      decidedAt: new Date(),
    })
    .returning();

  return rows[0];
}

export async function decideClaim(input: {
  claimId: number;
  adminId: string;
  decision: 'approved' | 'rejected';
  rejectionReason?: string | null;
}) {
  const database = requireDatabase();

  const claimRows = await database
    .select()
    .from(claimRequests)
    .where(eq(claimRequests.id, input.claimId))
    .limit(1);
  const claim = claimRows[0];
  if (!claim) throw new Error('Claim not found');
  if (claim.status !== 'pending') throw new Error('Claim is no longer pending');

  if (input.decision === 'approved') {
    const alreadyLinked = await database
      .select({ id: user.id })
      .from(user)
      .where(eq(user.studentId, claim.studentId))
      .limit(1);
    if (alreadyLinked[0]) {
      throw new Error('That student record is already linked to another account');
    }

    await database
      .update(user)
      .set({ studentId: claim.studentId, updatedAt: new Date() })
      .where(eq(user.id, claim.userId));

    // Auto-reject other pending claims for the same student
    await database
      .update(claimRequests)
      .set({
        status: 'rejected',
        decidedBy: input.adminId,
        decidedAt: new Date(),
        rejectionReason: 'Another claim for this registration number was approved',
      })
      .where(
        and(
          eq(claimRequests.studentId, claim.studentId),
          eq(claimRequests.status, 'pending'),
          sql`${claimRequests.id} <> ${input.claimId}`,
        ),
      );
  }

  const updated = await database
    .update(claimRequests)
    .set({
      status: input.decision,
      decidedBy: input.adminId,
      decidedAt: new Date(),
      rejectionReason: input.decision === 'rejected' ? (input.rejectionReason ?? null) : null,
    })
    .where(eq(claimRequests.id, input.claimId))
    .returning();

  await writeAuditLog({
    actorId: input.adminId,
    action: input.decision === 'approved' ? 'claim_approved' : 'claim_rejected',
    targetType: 'claim_request',
    targetId: input.claimId,
    metadata: {
      userId: claim.userId,
      studentId: claim.studentId,
      rejectionReason: input.rejectionReason ?? null,
    },
  });

  return updated[0];
}

/* ── Courses & exams ───────────────────────────────────── */

export async function listCourses(): Promise<CourseRecord[]> {
  const database = requireDatabase();
  return database
    .select({
      id: courses.id,
      code: courses.code,
      name: courses.name,
      creditHours: courses.creditHours,
      yearLevel: courses.yearLevel,
      semester: courses.semester,
      academicYear: courses.academicYear,
    })
    .from(courses)
    .orderBy(desc(courses.academicYear), asc(courses.code));
}

export async function getCourse(id: number): Promise<CourseRecord | null> {
  const database = requireDatabase();
  const rows = await database
    .select({
      id: courses.id,
      code: courses.code,
      name: courses.name,
      creditHours: courses.creditHours,
      yearLevel: courses.yearLevel,
      semester: courses.semester,
      academicYear: courses.academicYear,
    })
    .from(courses)
    .where(eq(courses.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function createCourse(input: {
  code: string;
  name: string;
  creditHours: number | string;
  yearLevel: number;
  semester: number;
  academicYear: number;
}) {
  const database = requireDatabase();
  const rows = await database
    .insert(courses)
    .values({
      code: input.code.trim().toUpperCase(),
      name: input.name.trim(),
      creditHours: String(input.creditHours),
      yearLevel: input.yearLevel,
      semester: input.semester,
      academicYear: input.academicYear,
    })
    .returning({
      id: courses.id,
      code: courses.code,
      name: courses.name,
      creditHours: courses.creditHours,
      yearLevel: courses.yearLevel,
      semester: courses.semester,
      academicYear: courses.academicYear,
    });
  return rows[0];
}

export async function updateCourse(
  id: number,
  input: Partial<{
    code: string;
    name: string;
    creditHours: number | string;
    yearLevel: number;
    semester: number;
    academicYear: number;
  }>,
) {
  const database = requireDatabase();
  const rows = await database
    .update(courses)
    .set({
      ...(input.code !== undefined ? { code: input.code.trim().toUpperCase() } : {}),
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.creditHours !== undefined ? { creditHours: String(input.creditHours) } : {}),
      ...(input.yearLevel !== undefined ? { yearLevel: input.yearLevel } : {}),
      ...(input.semester !== undefined ? { semester: input.semester } : {}),
      ...(input.academicYear !== undefined ? { academicYear: input.academicYear } : {}),
    })
    .where(eq(courses.id, id))
    .returning({
      id: courses.id,
      code: courses.code,
      name: courses.name,
      creditHours: courses.creditHours,
      yearLevel: courses.yearLevel,
      semester: courses.semester,
      academicYear: courses.academicYear,
    });
  return rows[0] ?? null;
}

export async function deleteCourse(id: number) {
  const database = requireDatabase();
  const rows = await database.delete(courses).where(eq(courses.id, id)).returning({ id: courses.id });
  return Boolean(rows[0]);
}

export async function listExamsForCourse(courseId: number): Promise<ExamRecord[]> {
  const database = requireDatabase();
  const rows = await database
    .select({
      id: exam.id,
      courseId: exam.courseId,
      type: exam.type,
      maxMarks: exam.maxMarks,
    })
    .from(exam)
    .where(eq(exam.courseId, courseId));

  const order = new Map(EXAM_TYPES.map((t, i) => [t, i]));
  return rows.sort((a, b) => (order.get(a.type) ?? 99) - (order.get(b.type) ?? 99));
}

export async function replaceExamsForCourse(
  courseId: number,
  weights: Array<{ type: ExamType; maxMarks: number }>,
) {
  const database = requireDatabase();
  await database.delete(exam).where(eq(exam.courseId, courseId));

  if (weights.length === 0) return [];

  const rows = await database
    .insert(exam)
    .values(
      weights.map((w) => ({
        courseId,
        type: w.type,
        maxMarks: String(w.maxMarks),
      })),
    )
    .returning({
      id: exam.id,
      courseId: exam.courseId,
      type: exam.type,
      maxMarks: exam.maxMarks,
    });

  return rows;
}

/* ── Results / CGPA ────────────────────────────────────── */

async function ensureDefaultGradingScale() {
  const database = requireDatabase();
  const existing = await database.select({ id: gradingScale.id }).from(gradingScale).limit(1);
  if (existing[0]) return;

  await database.insert(gradingScale).values([
    { minMarks: '80', maxMarks: '100', grade: 'A+', gradePoint: '4.00' },
    { minMarks: '75', maxMarks: '79.99', grade: 'A', gradePoint: '3.75' },
    { minMarks: '70', maxMarks: '74.99', grade: 'A-', gradePoint: '3.50' },
    { minMarks: '65', maxMarks: '69.99', grade: 'B+', gradePoint: '3.25' },
    { minMarks: '60', maxMarks: '64.99', grade: 'B', gradePoint: '3.00' },
    { minMarks: '55', maxMarks: '59.99', grade: 'B-', gradePoint: '2.75' },
    { minMarks: '50', maxMarks: '54.99', grade: 'C+', gradePoint: '2.50' },
    { minMarks: '45', maxMarks: '49.99', grade: 'C', gradePoint: '2.25' },
    { minMarks: '40', maxMarks: '44.99', grade: 'D', gradePoint: '2.00' },
    { minMarks: '0', maxMarks: '39.99', grade: 'F', gradePoint: '0.00' },
  ]);
}

async function lookupGrade(total: number): Promise<{ grade: string; gradePoint: string } | null> {
  await ensureDefaultGradingScale();
  const database = requireDatabase();
  const rows = await database
    .select({
      grade: gradingScale.grade,
      gradePoint: gradingScale.gradePoint,
    })
    .from(gradingScale)
    .where(
      and(
        sql`${total} >= ${gradingScale.minMarks}::numeric`,
        sql`${total} <= ${gradingScale.maxMarks}::numeric`,
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}

export async function getStudentResults(studentId: number, filters?: {
  courseId?: number;
  term?: string;
}): Promise<CourseResultDetail[]> {
  const database = requireDatabase();

  let courseList = await listCourses();
  if (filters?.courseId) {
    courseList = courseList.filter((c) => c.id === filters.courseId);
  }

  const examsByCourse = new Map<number, ExamRecord[]>();
  for (const course of courseList) {
    examsByCourse.set(course.id, await listExamsForCourse(course.id));
  }

  const conditions = [eq(resultComponents.studentId, studentId)];
  if (filters?.courseId) conditions.push(eq(resultComponents.courseId, filters.courseId));
  if (filters?.term) conditions.push(eq(resultComponents.term, filters.term));

  const components = await database
    .select({
      courseId: resultComponents.courseId,
      term: resultComponents.term,
      examId: resultComponents.examId,
      marksObtained: resultComponents.marksObtained,
    })
    .from(resultComponents)
    .where(and(...conditions));

  const termKeys = new Set<string>();
  for (const row of components) {
    termKeys.add(`${row.courseId}::${row.term}`);
  }
  if (filters?.term && filters?.courseId) {
    termKeys.add(`${filters.courseId}::${filters.term}`);
  }

  const results: CourseResultDetail[] = [];

  for (const key of termKeys) {
    const [courseIdStr, term] = key.split('::');
    const courseId = Number(courseIdStr);
    const course = courseList.find((c) => c.id === courseId);
    if (!course) continue;

    const exams = examsByCourse.get(courseId) ?? [];
    const entered = components.filter((c) => c.courseId === courseId && c.term === term);
    const enteredByExam = new Map(entered.map((e) => [e.examId, e.marksObtained]));

    const breakdown: ComponentBreakdown[] = exams.map((ex) => ({
      examId: ex.id,
      type: ex.type,
      maxMarks: ex.maxMarks,
      marksObtained: enteredByExam.has(ex.id) ? String(enteredByExam.get(ex.id)) : null,
    }));

    const finalized = exams.length > 0 && breakdown.every((b) => b.marksObtained !== null);
    const total = finalized
      ? breakdown.reduce((sum, b) => sum + Number(b.marksObtained ?? 0), 0)
      : null;
    const gradeInfo = total !== null ? await lookupGrade(total) : null;

    results.push({
      courseId: course.id,
      courseCode: course.code,
      courseName: course.name,
      creditHours: course.creditHours,
      term,
      components: breakdown,
      total,
      grade: gradeInfo?.grade ?? null,
      gradePoint: gradeInfo?.gradePoint ?? null,
      finalized,
      enteredCount: breakdown.filter((b) => b.marksObtained !== null).length,
      expectedCount: exams.length,
    });
  }

  return results.sort((a, b) => b.term.localeCompare(a.term) || a.courseCode.localeCompare(b.courseCode));
}

export async function getMarkHistory(studentId: number): Promise<MarkHistoryRow[]> {
  const results = await getStudentResults(studentId);
  return results
    .filter((r) => r.finalized && r.total !== null && r.grade)
    .map((r) => ({
      courseId: r.courseId,
      courseCode: r.courseCode,
      courseName: r.courseName,
      creditHours: r.creditHours,
      term: r.term,
      total: r.total as number,
      grade: r.grade as string,
      gradePoint: r.gradePoint as string,
    }));
}

export async function getStudentCgpa(studentId: number): Promise<number | null> {
  const history = await getMarkHistory(studentId);
  if (history.length === 0) return null;

  let weighted = 0;
  let credits = 0;
  for (const row of history) {
    const ch = Number(row.creditHours);
    weighted += Number(row.gradePoint) * ch;
    credits += ch;
  }
  if (credits === 0) return null;
  return Math.round((weighted / credits) * 100) / 100;
}

export async function upsertResultComponents(input: {
  studentId: number;
  courseId: number;
  term: string;
  enteredBy: string;
  marks: Array<{ examId: number; marksObtained: number }>;
}) {
  const database = requireDatabase();
  const exams = await listExamsForCourse(input.courseId);
  const examIds = new Set(exams.map((e) => e.id));

  for (const mark of input.marks) {
    if (!examIds.has(mark.examId)) {
      throw new Error(`Exam ${mark.examId} does not belong to course ${input.courseId}`);
    }
    if (mark.marksObtained < 0) {
      throw new Error('Marks cannot be negative');
    }
  }

  const saved = [];
  for (const mark of input.marks) {
    const existing = await database
      .select({ id: resultComponents.id })
      .from(resultComponents)
      .where(
        and(
          eq(resultComponents.studentId, input.studentId),
          eq(resultComponents.courseId, input.courseId),
          eq(resultComponents.term, input.term),
          eq(resultComponents.examId, mark.examId),
        ),
      )
      .limit(1);

    if (existing[0]) {
      const rows = await database
        .update(resultComponents)
        .set({
          marksObtained: String(mark.marksObtained),
          enteredBy: input.enteredBy,
          enteredAt: new Date(),
        })
        .where(eq(resultComponents.id, existing[0].id))
        .returning();
      saved.push(rows[0]);
    } else {
      const rows = await database
        .insert(resultComponents)
        .values({
          studentId: input.studentId,
          courseId: input.courseId,
          term: input.term,
          examId: mark.examId,
          marksObtained: String(mark.marksObtained),
          enteredBy: input.enteredBy,
        })
        .returning();
      saved.push(rows[0]);
    }
  }

  await writeAuditLog({
    actorId: input.enteredBy,
    action: 'result_entered',
    targetType: 'course',
    targetId: input.courseId,
    metadata: {
      studentId: input.studentId,
      term: input.term,
      count: input.marks.length,
    },
  });

  return saved;
}

export async function getResultEntryGrid(courseId: number, term: string) {
  const course = await getCourse(courseId);
  if (!course) throw new Error('Course not found');

  const exams = await listExamsForCourse(courseId);
  const roster = await listStudents();

  const database = requireDatabase();
  const components = await database
    .select()
    .from(resultComponents)
    .where(and(eq(resultComponents.courseId, courseId), eq(resultComponents.term, term)));

  const byStudent = new Map<number, Map<number, string>>();
  for (const row of components) {
    if (!byStudent.has(row.studentId)) byStudent.set(row.studentId, new Map());
    byStudent.get(row.studentId)!.set(row.examId, String(row.marksObtained));
  }

  return {
    course,
    term,
    exams,
    rows: roster.map((student) => ({
      student,
      marks: Object.fromEntries(
        exams.map((ex) => [ex.id, byStudent.get(student.id)?.get(ex.id) ?? '']),
      ) as Record<number, string>,
    })),
  };
}

/* ── Questions ─────────────────────────────────────────── */

export async function listQuestions(filters?: {
  courseId?: number;
  instructor?: string;
}): Promise<QuestionRecord[]> {
  const database = requireDatabase();

  const conditions = [];
  if (filters?.courseId) conditions.push(eq(questions.courseId, filters.courseId));
  if (filters?.instructor) conditions.push(eq(questions.instructorName, filters.instructor));

  const base = database
    .select({
      id: questions.id,
      courseId: questions.courseId,
      courseCode: courses.code,
      courseName: courses.name,
      instructorName: questions.instructorName,
      term: questions.term,
      questionText: questions.questionText,
      fileUrl: questions.fileUrl,
      createdAt: questions.createdAt,
    })
    .from(questions)
    .leftJoin(courses, eq(questions.courseId, courses.id));

  const rows = conditions.length
    ? await base.where(and(...conditions)).orderBy(desc(questions.createdAt))
    : await base.orderBy(desc(questions.createdAt));

  return rows;
}

export async function listInstructors(): Promise<string[]> {
  const database = requireDatabase();
  const rows = await database
    .selectDistinct({ instructorName: questions.instructorName })
    .from(questions)
    .orderBy(asc(questions.instructorName));
  return rows.map((r) => r.instructorName);
}

export async function createQuestion(input: {
  courseId: number;
  instructorName: string;
  term?: string | null;
  questionText?: string | null;
  fileUrl?: string | null;
  uploadedBy: string;
}) {
  if (!input.questionText?.trim() && !input.fileUrl?.trim()) {
    throw new Error('Provide question text or a file URL');
  }

  const database = requireDatabase();
  const rows = await database
    .insert(questions)
    .values({
      courseId: input.courseId,
      instructorName: input.instructorName.trim(),
      term: input.term?.trim() || null,
      questionText: input.questionText?.trim() || null,
      fileUrl: input.fileUrl?.trim() || null,
      uploadedBy: input.uploadedBy,
    })
    .returning();

  return rows[0];
}

export async function deleteQuestion(id: number) {
  const database = requireDatabase();
  const rows = await database.delete(questions).where(eq(questions.id, id)).returning({ id: questions.id });
  return Boolean(rows[0]);
}

/* ── Dashboard helpers ─────────────────────────────────── */

export async function getStudentDashboard(studentId: number) {
  const student = await getStudentById(studentId);
  const cgpa = await getStudentCgpa(studentId);
  const results = await getStudentResults(studentId);
  const history = await getMarkHistory(studentId);
  return { student, cgpa, results, history };
}

export async function getAdminDashboard() {
  const [pendingClaims, studentCount, courseCount, questionCount] = await Promise.all([
    countPendingClaims(),
    listStudents().then((s) => s.length),
    listCourses().then((c) => c.length),
    listQuestions().then((q) => q.length),
  ]);
  return { pendingClaims, studentCount, courseCount, questionCount };
}

/** @deprecated Prefer getStudentDashboard / getAdminDashboard */
export async function getDashboardData() {
  return {
    student: null,
    results: [],
    questions: [],
    claims: [],
  };
}

export async function getStudents(limit = 10) {
  const all = await listStudents();
  return all.slice(0, limit);
}

export async function getStudentProfile() {
  const all = await listStudents();
  return all[0] ?? null;
}

export async function getResults() {
  return [] as Array<{ course: string | null; term: string; total: string | number; grade: string }>;
}

export async function getQuestions() {
  return listQuestions();
}

export async function getClaims() {
  return listClaims();
}

export async function bulkCreateStudents(
  items: Array<{ regNumber: string; name: string; section: string }>,
  actorId: string,
) {
  const database = requireDatabase();
  let createdCount = 0;
  let skippedCount = 0;
  const errors: string[] = [];

  for (const item of items) {
    const regNumber = item.regNumber?.trim();
    const name = item.name?.trim();
    const section = item.section?.trim();

    if (!regNumber || !name || !section) {
      errors.push(`Skipped row with missing fields: ${JSON.stringify(item)}`);
      skippedCount++;
      continue;
    }

    const existing = await database
      .select({ id: students.id })
      .from(students)
      .where(eq(students.regNumber, regNumber))
      .limit(1);

    if (existing[0]) {
      skippedCount++;
      continue;
    }

    try {
      await database.insert(students).values({
        regNumber,
        name,
        section,
      });
      createdCount++;
    } catch (err) {
      errors.push(`Error adding ${regNumber}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      skippedCount++;
    }
  }

  await writeAuditLog({
    actorId,
    action: 'roster_bulk_imported',
    targetType: 'student',
    metadata: { createdCount, skippedCount, totalItems: items.length },
  });

  return { createdCount, skippedCount, total: items.length, errors };
}

export async function bulkUpsertResults(
  courseId: number,
  term: string,
  items: Array<{ regNumber: string; marks: Array<{ examId: number; marksObtained: number }> }>,
  actorId: string,
) {
  let savedStudentsCount = 0;
  let totalComponentsSaved = 0;
  const unmappedRegNumbers: string[] = [];
  const errors: string[] = [];

  const allStudents = await listStudents();
  const studentMapByReg = new Map(allStudents.map((s) => [s.regNumber.toUpperCase(), s.id]));

  for (const item of items) {
    const regUpper = item.regNumber?.trim().toUpperCase();
    if (!regUpper) continue;
    const studentId = studentMapByReg.get(regUpper);

    if (!studentId) {
      unmappedRegNumbers.push(item.regNumber);
      continue;
    }

    if (!item.marks || item.marks.length === 0) {
      continue;
    }

    try {
      const saved = await upsertResultComponents({
        studentId,
        courseId,
        term,
        enteredBy: actorId,
        marks: item.marks,
      });
      savedStudentsCount++;
      totalComponentsSaved += saved.length;
    } catch (err) {
      errors.push(`Error saving results for ${item.regNumber}: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  await writeAuditLog({
    actorId,
    action: 'results_bulk_imported',
    targetType: 'course',
    targetId: courseId,
    metadata: { courseId, term, savedStudentsCount, totalComponentsSaved, unmappedRegNumbers },
  });

  return { savedStudentsCount, totalComponentsSaved, unmappedRegNumbers, errors };
}

export { inArray };
