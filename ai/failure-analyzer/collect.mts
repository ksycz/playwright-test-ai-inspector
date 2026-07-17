import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import type { FailureArtifacts, FailureContext } from './types.mts';

const SCREENSHOT_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp']);
const VIDEO_EXTENSIONS = new Set(['.webm', '.mp4']);

async function listFilesRecursive(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const absolutePath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFilesRecursive(absolutePath)));
      continue;
    }
    if (entry.isFile()) {
      files.push(absolutePath);
    }
  }

  return files;
}

function categorizeArtifacts(files: string[], rootDir: string): FailureArtifacts {
  const artifacts: FailureArtifacts = {
    screenshots: [],
    videos: [],
    traces: [],
    errorContextPath: null,
    otherFiles: [],
  };

  for (const file of files) {
    const relativePath = path.relative(rootDir, file);
    const baseName = path.basename(file).toLowerCase();
    const extension = path.extname(file).toLowerCase();

    if (baseName === 'error-context.md') {
      artifacts.errorContextPath = relativePath;
      continue;
    }

    if (SCREENSHOT_EXTENSIONS.has(extension)) {
      artifacts.screenshots.push(relativePath);
      continue;
    }

    if (VIDEO_EXTENSIONS.has(extension)) {
      artifacts.videos.push(relativePath);
      continue;
    }

    if (baseName === 'trace.zip' || extension === '.zip') {
      artifacts.traces.push(relativePath);
      continue;
    }

    if (baseName === '.gitkeep') {
      continue;
    }

    artifacts.otherFiles.push(relativePath);
  }

  artifacts.screenshots.sort();
  artifacts.videos.sort();
  artifacts.traces.sort();
  artifacts.otherFiles.sort();

  return artifacts;
}

export async function collectFailureContext(sourcePath: string): Promise<FailureContext> {
  const absoluteSource = path.resolve(sourcePath);
  const sourceStats = await stat(absoluteSource);

  if (!sourceStats.isDirectory()) {
    throw new Error(`Failure path is not a directory: ${absoluteSource}`);
  }

  const files = await listFilesRecursive(absoluteSource);
  const artifacts = categorizeArtifacts(files, absoluteSource);

  let errorContextText: string | null = null;
  if (artifacts.errorContextPath) {
    const errorContextAbsolute = path.join(absoluteSource, artifacts.errorContextPath);
    errorContextText = await readFile(errorContextAbsolute, 'utf8');
  }

  return {
    sourcePath: absoluteSource,
    collectedAt: new Date().toISOString(),
    artifacts,
    errorContextText,
  };
}
