import path from 'node:path';
import type { FullConfig, FullResult, Reporter, Suite, TestCase, TestError, TestResult } from '@playwright/test/reporter';
import { formatDuration, formatReadableLine, type ReadableStatus } from './readable-line.mts';

/**
 * One line per test: status, leaf title, duration.
 * The built-in list reporter also prints the file path and every parent title,
 * then truncates the middle so the names are hard to scan in a terminal.
 */
class ReadableReporter implements Reporter {
  private rootDir = '';
  private passed = 0;
  private failed = 0;
  private skipped = 0;
  private flaky = 0;

  onError(error: TestError): void {
    const message = error.message ?? error.value ?? 'Unknown error';
    process.stderr.write(`${message}\n`);
    if (error.stack) process.stderr.write(`${error.stack}\n`);
  }

  onBegin(config: FullConfig, suite: Suite): void {
    this.rootDir = config.rootDir;
    const count = suite.allTests().length;
    process.stdout.write(`\nRunning ${count} test${count === 1 ? '' : 's'}\n\n`);
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    const status = result.status as ReadableStatus;
    process.stdout.write(
      `${formatReadableLine({
        title: test.title,
        status,
        durationMs: result.duration,
        retry: result.retry,
      })}\n`,
    );

    if (status !== 'passed' && status !== 'skipped') {
      const file = path.relative(this.rootDir, test.location.file);
      process.stdout.write(`     ${file}:${test.location.line}\n`);
      const message = result.error?.message?.split('\n')[0];
      if (message) process.stdout.write(`     ${message}\n`);
    }

    const willRetry = status !== test.expectedStatus && status !== 'skipped' && test.results.length <= test.retries;
    if (willRetry) return;

    const outcome = test.outcome();
    if (outcome === 'expected') this.passed += 1;
    else if (outcome === 'skipped') this.skipped += 1;
    else if (outcome === 'flaky') this.flaky += 1;
    else this.failed += 1;
  }

  onEnd(result: FullResult): void {
    const parts: string[] = [];
    if (this.failed) parts.push(`${this.failed} failed`);
    if (this.flaky) parts.push(`${this.flaky} flaky`);
    if (this.skipped) parts.push(`${this.skipped} skipped`);
    if (this.passed) parts.push(`${this.passed} passed`);
    const summary = parts.length ? parts.join(', ') : result.status;
    process.stdout.write(`\n${summary} (${formatDuration(result.duration)})\n`);
  }
}

export default ReadableReporter;
