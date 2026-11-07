export type DiffLine = {
  file: string;
  line: number;
  text: string;
  added: boolean;
};

/**
 * Added and context lines from a unified diff, limited to tests/.
 * Line numbers are the new-file numbers from each hunk.
 */
export function readTestDiff(diff: string): DiffLine[] {
  const rows: DiffLine[] = [];
  let file: string | null = null;
  let newLine = 0;
  let inHunk = false;

  for (const raw of diff.split('\n')) {
    if (raw.startsWith('diff --git ')) {
      file = null;
      inHunk = false;
      continue;
    }

    const nextFile = raw.match(/^\+\+\+ b\/(.+)$/);
    if (nextFile) {
      file = nextFile[1]?.startsWith('tests/') ? nextFile[1] : null;
      inHunk = false;
      continue;
    }

    const hunk = raw.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
    if (hunk) {
      newLine = Number(hunk[1]);
      inHunk = file !== null;
      continue;
    }

    if (!inHunk || !file) {
      continue;
    }

    if (raw.startsWith('+') && !raw.startsWith('+++')) {
      rows.push({ file, line: newLine, text: raw.slice(1), added: true });
      newLine += 1;
      continue;
    }

    if (raw.startsWith('-') && !raw.startsWith('---')) {
      continue;
    }

    if (raw.startsWith('\\')) {
      continue;
    }

    rows.push({ file, line: newLine, text: raw.startsWith(' ') ? raw.slice(1) : raw, added: false });
    newLine += 1;
  }

  return rows;
}
