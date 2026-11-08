import type { Charter, Flow } from './types.mts';

/** APP_SPEC.md sections each charter is built from. */
export const CHARTER_SECTIONS: Record<Flow, string[]> = {
  cart: ['Shopping Cart'],
  checkout: ['Checkout'],
  auth: ['Login', 'Error Handling'],
};

/** Bullet points, and sentences with should/must, under a `## <heading>` in APP_SPEC.md. */
export function readSpecSection(spec: string, heading: string): string[] | null {
  const lines = spec.split('\n');
  const start = lines.findIndex((line) => line.trim() === `## ${heading}`);
  if (start === -1) return null;

  const requirements: string[] = [];
  let inFence = false;
  for (const line of lines.slice(start + 1)) {
    if (/^#{1,2} /.test(line)) break;
    if (line.trim().startsWith('```')) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const bullet = line.match(/^\s*- (.+)$/);
    if (bullet) {
      requirements.push(bullet[1].trim());
      continue;
    }
    // Requirements written as a sentence, e.g. "The cart should persist after page refresh."
    const sentence = line.trim();
    if (/\b(should|must)\b/i.test(sentence) && !sentence.endsWith(':') && !sentence.startsWith('*')) {
      requirements.push(sentence);
    }
  }
  return requirements;
}

/** One charter per flow. Throws when APP_SPEC no longer has a section a charter relies on. */
export function buildCharters(spec: string, flows: readonly Flow[]): Charter[] {
  return flows.map((flow) => {
    const requirements: string[] = [];
    for (const heading of CHARTER_SECTIONS[flow]) {
      const section = readSpecSection(spec, heading);
      if (section === null) {
        throw new Error(`docs/APP_SPEC.md has no "## ${heading}" section (needed by the ${flow} charter)`);
      }
      requirements.push(...section.map((item) => `${heading}: ${item}`));
    }
    return { id: flow, specSection: CHARTER_SECTIONS[flow].join(' + '), requirements };
  });
}
