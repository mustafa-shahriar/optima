import { EXAM_TYPE_LABELS, type ExamType } from '@/lib/exams';

export const ROSTER_CSV_HEADERS = 'regNumber,name,section';

export const ROSTER_AI_PROMPT = `You are helping an admin import student records into the Optima student portal.

Convert the attached document (PDF, spreadsheet, or text) into a CSV file with EXACTLY these columns (header row required):

${ROSTER_CSV_HEADERS}

Rules:
- regNumber: official registration / roll number exactly as issued (e.g. 2023-ENG-017)
- name: full student name
- section: section or group label (e.g. A, B, Morning)
- One student per row, no blank rows
- Output ONLY the CSV — no markdown fences, no explanation
- If a field contains a comma, wrap it in double quotes

Example:
${ROSTER_CSV_HEADERS}
2023-ENG-017,John Doe,A
2023-ENG-018,Jane Smith,B`;

export function buildResultsAiPrompt(examTypes: ExamType[]): string {
  const headers = ['regNumber', ...examTypes].join(',');
  const labels = examTypes.map((t) => `${t} (${EXAM_TYPE_LABELS[t]})`).join(', ');

  return `You are helping an admin import exam marks into the Optima student portal.

Convert the attached result document (PDF, spreadsheet, or text from a teacher) into a CSV file with EXACTLY these columns (header row required):

${headers}

Column meanings:
- regNumber: student registration number (must match roster exactly)
- ${labels}
- Use numeric marks only; leave a cell empty if that component was not graded yet
- Do NOT include totals or letter grades — only individual component marks
- One student per row, no blank rows
- Output ONLY the CSV — no markdown fences, no explanation
- If a field contains a comma, wrap it in double quotes

Example:
${headers}
2023-ENG-017,10,18,15,8,72
2023-ENG-018,9,,14,7,`;
}

export function buildResultsCsvHeaders(examTypes: ExamType[]): string {
  return ['regNumber', ...examTypes].join(',');
}
