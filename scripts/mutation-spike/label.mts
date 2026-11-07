export function label(ok: boolean): string {
  if (ok) {
    return 'passed';
  }
  return 'failed';
}
