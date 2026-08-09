export type ExamType = 'attendance' | 'term_test_1' | 'term_test_2' | 'quiz' | 'final_exam';

export const EXAM_TYPES: ExamType[] = [
  'attendance',
  'term_test_1',
  'term_test_2',
  'quiz',
  'final_exam',
];

export const EXAM_TYPE_LABELS: Record<ExamType, string> = {
  attendance: 'Attendance',
  term_test_1: 'Term Test 1',
  term_test_2: 'Term Test 2',
  quiz: 'Quiz',
  final_exam: 'Final Exam',
};
