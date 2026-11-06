import type { RegistryLookupResult } from './gate.mts';

function registryPackagePath(name: string): string {
  return name.replace('/', '%2f');
}

export async function lookupNpmPackage(
  name: string,
  fetchImpl: typeof fetch = fetch,
): Promise<RegistryLookupResult> {
  const encoded = registryPackagePath(name);

  let metaResponse: Response;
  try {
    metaResponse = await fetchImpl(`https://registry.npmjs.org/${encoded}`, {
      headers: { accept: 'application/json' },
    });
  } catch {
    return { ok: false, status: 0 };
  }

  if (metaResponse.status === 404) return { ok: false, status: 404 };
  if (!metaResponse.ok) return { ok: false, status: metaResponse.status };

  let created: string;
  try {
    const body = (await metaResponse.json()) as { time?: { created?: unknown } };
    if (typeof body.time?.created !== 'string') return { ok: false, status: metaResponse.status };
    created = body.time.created;
  } catch {
    return { ok: false, status: metaResponse.status };
  }

  let weeklyDownloads = 0;
  try {
    const downloadsResponse = await fetchImpl(
      `https://api.npmjs.org/downloads/point/last-week/${encoded}`,
      { headers: { accept: 'application/json' } },
    );
    if (downloadsResponse.ok) {
      const body = (await downloadsResponse.json()) as { downloads?: unknown };
      if (typeof body.downloads === 'number' && Number.isFinite(body.downloads)) {
        weeklyDownloads = body.downloads;
      }
    }
  } catch {
    return { ok: false, status: 0 };
  }

  return { ok: true, info: { created, weeklyDownloads } };
}
