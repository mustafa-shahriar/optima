export interface ParsedRosterRow {
  regNumber: string;
  name: string;
  section: string;
}

export function parseRosterCsv(text: string): ParsedRosterRow[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];

  const parseLine = (line: string): string[] => {
    const delimiter = line.includes('\t') ? '\t' : ',';
    const result: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        result.push(cur.trim().replace(/^["']|["']$/g, ''));
        cur = '';
      } else {
        cur += char;
      }
    }
    result.push(cur.trim().replace(/^["']|["']$/g, ''));
    return result;
  };

  const rows: ParsedRosterRow[] = [];
  const firstLineCells = parseLine(lines[0]);
  const firstCol = (firstLineCells[0] || '').toLowerCase();
  const secondCol = (firstLineCells[1] || '').toLowerCase();
  const hasHeader = firstCol.includes('reg') || firstCol.includes('number') || secondCol.includes('name');

  const startIndex = hasHeader ? 1 : 0;
  for (let i = startIndex; i < lines.length; i++) {
    const cells = parseLine(lines[i]);
    if (cells.length >= 3 && cells[0] && cells[1] && cells[2]) {
      rows.push({
        regNumber: cells[0],
        name: cells[1],
        section: cells[2],
      });
    }
  }

  return rows;
}

export interface ParsedResultRow {
  regNumber: string;
  marks: Record<string, string>; // examType -> raw mark string
}

export function parseResultsCsv(text: string, knownExamTypes: string[]): ParsedResultRow[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];

  const parseLine = (line: string): string[] => {
    const delimiter = line.includes('\t') ? '\t' : ',';
    const result: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        result.push(cur.trim().replace(/^["']|["']$/g, ''));
        cur = '';
      } else {
        cur += char;
      }
    }
    result.push(cur.trim().replace(/^["']|["']$/g, ''));
    return result;
  };

  const firstLine = parseLine(lines[0]);
  const headers = firstLine.map((h) => h.toLowerCase());
  const hasHeader = headers[0]?.includes('reg') || knownExamTypes.some((t) => headers.some((h) => h.includes(t.toLowerCase())));

  const startIndex = hasHeader ? 1 : 0;

  let colMap: Array<string | null>;
  if (hasHeader) {
    colMap = headers.map((h) => {
      const found = knownExamTypes.find((t) => h.includes(t.toLowerCase()));
      return found ?? null;
    });
  } else {
    colMap = [null, ...knownExamTypes];
  }

  const rows: ParsedResultRow[] = [];
  for (let i = startIndex; i < lines.length; i++) {
    const cells = parseLine(lines[i]);
    if (cells.length === 0 || !cells[0]) continue;

    const regNumber = cells[0];
    const marks: Record<string, string> = {};

    for (let c = 1; c < cells.length; c++) {
      const examType = colMap[c];
      if (examType && cells[c] !== undefined && cells[c] !== '' && cells[c] !== null) {
        marks[examType] = cells[c];
      }
    }

    if (Object.keys(marks).length > 0) {
      rows.push({ regNumber, marks });
    }
  }

  return rows;
}
