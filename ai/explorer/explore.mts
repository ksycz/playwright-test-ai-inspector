import type { ModelExploration } from './agent.mts';
import type { Probe, ProbeContext, ProbeOutcome } from './probes.mts';
import { BudgetExceededError, type ExplorerSession } from './session.mts';
import type {
  Action,
  Charter,
  CharterSummary,
  DroppedFinding,
  ExplorationResult,
  Finding,
} from './types.mts';

export type ExploreOptions = {
  session: ExplorerSession;
  charters: Charter[];
  probes: Probe[];
  context: ProbeContext;
  baseUrl: string;
  /** Optional model-driven exploration, run after the probes of each charter. */
  model?: ModelExploration | null;
  now?: () => Date;
  log?: (message: string) => void;
};

type Attempt = { outcome: ProbeOutcome; steps: string[]; actions: Array<Action | null> };

async function attempt(probe: Probe, options: ExploreOptions): Promise<Attempt> {
  const { session, context } = options;
  await session.reset();
  let outcome: ProbeOutcome;
  try {
    outcome = await probe.run(session, context);
  } catch (error) {
    if (error instanceof BudgetExceededError) throw error;
    const message = error instanceof Error ? error.message : String(error);
    outcome = { ok: false, expected: 'flow completes', actual: message };
  }
  return {
    outcome,
    steps: session.steps.map((step) => step.note),
    actions: session.steps.map((step) => step.action ?? null),
  };
}

/**
 * Run each probe; a failure is only reported if a second run from a fresh state
 * fails the same way. Otherwise it is listed as dropped (not reproducible).
 */
export async function explore(options: ExploreOptions): Promise<ExplorationResult> {
  const { session, charters, probes, model } = options;
  const now = options.now ?? (() => new Date());
  const log = options.log ?? (() => undefined);
  const findings: Finding[] = [];
  const dropped: DroppedFinding[] = [];
  const summaries: CharterSummary[] = [];
  const startedAt = now().toISOString();

  for (const charter of charters) {
    const summary: CharterSummary = {
      charter: charter.id,
      checksRun: 0,
      checksPassed: 0,
      findings: 0,
      dropped: 0,
    };
    summaries.push(summary);

    try {
      for (const probe of probes.filter((item) => item.charter === charter.id)) {
        summary.checksRun += 1;
        log(`[${charter.id}] ${probe.id}`);
        const first = await attempt(probe, options);
        if (first.outcome.ok) {
          summary.checksPassed += 1;
          continue;
        }

        const second = await attempt(probe, options);
        if (second.outcome.ok || second.outcome.actual !== first.outcome.actual) {
          summary.dropped += 1;
          dropped.push({
            id: probe.id,
            source: 'probe',
            charter: charter.id,
            title: probe.title,
            reason: second.outcome.ok
              ? 'passed on the second run'
              : `different result on the second run (${second.outcome.actual})`,
          });
          continue;
        }

        const screenshot = await session.screenshot(`${probe.id}.png`);
        summary.findings += 1;
        findings.push({
          id: probe.id,
          source: 'probe',
          charter: charter.id,
          specRef: probe.requirement,
          title: probe.title,
          expected: second.outcome.expected,
          actual: second.outcome.actual,
          steps: second.steps,
          screenshot,
          actions: second.actions,
          ...(second.outcome.checks ? { checks: second.outcome.checks } : {}),
        });
      }

      if (model) {
        log(`[${charter.id}] model exploration (${model.name})`);
        let result;
        try {
          result = await model.explore(session, charter);
        } catch (error) {
          if (error instanceof BudgetExceededError) throw error;
          // A failed model call costs this charter its model pass, not the whole run.
          const message = error instanceof Error ? error.message : String(error);
          summary.stoppedEarly = `model error: ${message}`;
          log(`[${charter.id}] model error: ${message}; continuing with the next charter`);
          continue;
        }
        summary.checksRun += result.reported;
        summary.findings += result.findings.length;
        summary.dropped += result.dropped.length;
        findings.push(...result.findings);
        dropped.push(...result.dropped);
        if (result.stoppedEarly) summary.stoppedEarly = result.stoppedEarly;
      }
    } catch (error) {
      if (!(error instanceof BudgetExceededError)) throw error;
      summary.stoppedEarly = error.message;
      log(`[${charter.id}] ${error.message}; stopping`);
      for (const skipped of charters.slice(charters.indexOf(charter) + 1)) {
        summaries.push({
          charter: skipped.id,
          checksRun: 0,
          checksPassed: 0,
          findings: 0,
          dropped: 0,
          stoppedEarly: 'not run: step budget used up',
        });
      }
      break;
    }
  }

  return {
    baseUrl: options.baseUrl,
    startedAt,
    budget: session.budget,
    stepsUsed: session.used,
    modelUsed: model?.name ?? null,
    charters: summaries,
    findings,
    dropped,
  };
}
