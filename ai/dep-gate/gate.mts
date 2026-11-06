/** Seven days matches the "published last week" failure case in the Phase 9 spec. */
export const DEFAULT_MIN_AGE_DAYS = 7;

/**
 * Floor against typosquats and unused packages. Version bumps of existing
 * dependencies are not checked; Renovate and npm audit cover those.
 */
export const DEFAULT_MIN_WEEKLY_DOWNLOADS = 1000;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type PackageManifest = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
};

export type ManifestPair = {
  label: string;
  base: PackageManifest;
  head: PackageManifest;
};

export type PackageRegistryInfo = {
  created: string;
  weeklyDownloads: number;
};

export type RegistryLookupResult =
  | { ok: true; info: PackageRegistryInfo }
  | { ok: false; status: number };

export type RegistryLookup = (name: string) => Promise<RegistryLookupResult>;

export type DependencyRule = 'not-found' | 'too-young' | 'low-downloads' | 'registry-error';

export type DependencyViolation = {
  manifest: string;
  packageName: string;
  rule: DependencyRule;
  message: string;
};

export type GateResult = {
  ok: boolean;
  violations: DependencyViolation[];
};

const DEPENDENCY_FIELDS = ['dependencies', 'devDependencies', 'optionalDependencies'] as const;

function dependencyNames(manifest: PackageManifest): Set<string> {
  const names = new Set<string>();
  for (const field of DEPENDENCY_FIELDS) {
    const record = manifest[field];
    if (!record) continue;
    for (const name of Object.keys(record)) {
      names.add(name);
    }
  }
  return names;
}

export function findNewDependencyNames(base: PackageManifest, head: PackageManifest): string[] {
  const baseNames = dependencyNames(base);
  return [...dependencyNames(head)].filter((name) => !baseNames.has(name)).sort();
}

function violation(
  manifest: string,
  packageName: string,
  rule: DependencyRule,
  detail: string,
): DependencyViolation {
  return {
    manifest,
    packageName,
    rule,
    message: `${manifest}: ${packageName}: ${detail}`,
  };
}

function formatDays(ageDays: number): string {
  const rounded = Math.floor(ageDays * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export async function gateNewDependencies(input: {
  pairs: ManifestPair[];
  lookup: RegistryLookup;
  now?: Date;
  minAgeDays?: number;
  minWeeklyDownloads?: number;
}): Promise<GateResult> {
  const now = input.now ?? new Date();
  const minAgeDays = input.minAgeDays ?? DEFAULT_MIN_AGE_DAYS;
  const minWeeklyDownloads = input.minWeeklyDownloads ?? DEFAULT_MIN_WEEKLY_DOWNLOADS;
  const violations: DependencyViolation[] = [];

  for (const pair of input.pairs) {
    for (const packageName of findNewDependencyNames(pair.base, pair.head)) {
      let lookedUp: RegistryLookupResult;
      try {
        lookedUp = await input.lookup(packageName);
      } catch {
        lookedUp = { ok: false, status: 0 };
      }

      if (!lookedUp.ok) {
        if (lookedUp.status === 404) {
          violations.push(
            violation(pair.label, packageName, 'not-found', 'package was not found on the npm registry'),
          );
        } else {
          violations.push(
            violation(
              pair.label,
              packageName,
              'registry-error',
              `npm registry lookup failed (status ${lookedUp.status})`,
            ),
          );
        }
        continue;
      }

      const createdAt = new Date(lookedUp.info.created);
      if (Number.isNaN(createdAt.getTime())) {
        violations.push(
          violation(pair.label, packageName, 'registry-error', 'npm registry response has no valid time.created'),
        );
        continue;
      }

      const ageDays = (now.getTime() - createdAt.getTime()) / MS_PER_DAY;
      if (ageDays < minAgeDays) {
        violations.push(
          violation(
            pair.label,
            packageName,
            'too-young',
            `package is ${formatDays(ageDays)} days old, minimum is ${minAgeDays} days`,
          ),
        );
      }

      if (lookedUp.info.weeklyDownloads < minWeeklyDownloads) {
        violations.push(
          violation(
            pair.label,
            packageName,
            'low-downloads',
            `package has ${lookedUp.info.weeklyDownloads} weekly downloads, minimum is ${minWeeklyDownloads}`,
          ),
        );
      }
    }
  }

  return { ok: violations.length === 0, violations };
}
