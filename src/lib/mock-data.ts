export interface StudentProfile {
  name: string;
  regNumber: string;
  section: string;
  cgpa: number;
  term: string;
}

export interface ResultRow {
  course: string;
  term: string;
  total: number;
  grade: string;
  creditHours: number;
}

export interface QuestionEntry {
  course: string;
  instructor: string;
  term: string;
  body: string;
  attachment?: string;
}

export interface ClaimItem {
  email: string;
  regNumber: string;
  status: 'pending' | 'approved' | 'rejected';
}

export const studentProfile: StudentProfile = {
  name: 'Amina Rahman',
  regNumber: '2023-ENG-017',
  section: 'CSE-17',
  cgpa: 3.68,
  term: '2026 Spring',
};

export const resultRows: ResultRow[] = [
  { course: 'Data Structures', term: '2026 Spring', total: 86, grade: 'A', creditHours: 3 },
  { course: 'Operating Systems', term: '2026 Spring', total: 78, grade: 'A-', creditHours: 3 },
  { course: 'Database Systems', term: '2025 Fall', total: 81, grade: 'A', creditHours: 3 },
];

export const questionEntries: QuestionEntry[] = [
  {
    course: 'Database Systems',
    instructor: 'Prof. S. Ahmed',
    term: '2026 Spring',
    body: 'Explain normalization and write a 3NF example from the class notes.',
    attachment: 'db-normalization.pdf',
  },
  {
    course: 'Data Structures',
    instructor: 'Prof. R. Khan',
    term: '2026 Spring',
    body: 'Review binary tree traversal questions covered in the midterm revision sheet.',
  },
];

export const pendingClaims: ClaimItem[] = [
  { email: 'student1@example.com', regNumber: '2023-ENG-017', status: 'pending' },
  { email: 'student2@example.com', regNumber: '2023-ENG-018', status: 'pending' },
];
