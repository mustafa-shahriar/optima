import { desc, eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import { claimRequests, courses, questions, resultComponents, students, users } from '@/db/schema';

export interface StudentSummary {
  id: number;
  regNumber: string;
  name: string;
  section: string;
}

export interface ResultRow {
  course: string | null;
  term: string;
  total: string | number;
  grade: string;
}

export interface QuestionEntry {
  course: string | null;
  instructor: string;
  term: string | null;
  body: string | null;
  attachment?: string | null;
}

export interface ClaimItem {
  email: string | null;
  regNumber: string | null;
  status: string;
}

export async function getStudents(limit = 10): Promise<StudentSummary[]> {
  if (!db) {
    return [];
  }

  try {
    return await db
      .select({
        id: students.id,
        regNumber: students.regNumber,
        name: students.name,
        section: students.section,
      })
      .from(students)
      .orderBy(desc(students.createdAt))
      .limit(limit);
  } catch {
    return [];
  }
}

export async function getStudentProfile(): Promise<StudentSummary | null> {
  const studentsRow = await getStudents(1);
  return studentsRow[0] ?? null;
}

export async function getResults(): Promise<ResultRow[]> {
  if (!db) {
    return [];
  }

  try {
    const rows = await db
      .select({
        course: courses.name,
        term: resultComponents.term,
        total: resultComponents.marksObtained,
        grade: sql<string>`'—'`,
      })
      .from(resultComponents)
      .leftJoin(courses, eq(resultComponents.courseId, courses.id))
      .orderBy(desc(resultComponents.enteredAt));

    return rows.map((row) => ({
      ...row,
      total: typeof row.total === 'string' ? row.total : Number(row.total),
    }));
  } catch {
    return [];
  }
}

export async function getQuestions(): Promise<QuestionEntry[]> {
  if (!db) {
    return [];
  }

  try {
    return await db
      .select({
        course: courses.name,
        instructor: questions.instructorName,
        term: questions.term,
        body: questions.questionText,
        attachment: questions.fileUrl,
      })
      .from(questions)
      .leftJoin(courses, eq(questions.courseId, courses.id))
      .orderBy(desc(questions.createdAt));
  } catch {
    return [];
  }
}

export async function getClaims(): Promise<ClaimItem[]> {
  if (!db) {
    return [];
  }

  try {
    return await db
      .select({
        email: users.email,
        regNumber: students.regNumber,
        status: claimRequests.status,
      })
      .from(claimRequests)
      .leftJoin(users, eq(claimRequests.userId, users.id))
      .leftJoin(students, eq(claimRequests.studentId, students.id))
      .orderBy(desc(claimRequests.requestedAt));
  } catch {
    return [];
  }
}

export async function getDashboardData() {
  const [student, results, questions, claims] = await Promise.all([
    getStudentProfile(),
    getResults(),
    getQuestions(),
    getClaims(),
  ]);

  return { student, results, questions, claims };
}
