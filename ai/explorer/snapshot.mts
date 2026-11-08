/**
 * Minimal reader for Playwright MCP accessibility snapshots (ARIA YAML).
 * Only what the explorer needs: role, accessible name, ref, and inline text.
 */
export type SnapshotNode = {
  role: string;
  name: string;
  ref?: string;
  text: string;
  /** Attribute flags such as `invalid`, `disabled`, `level=1`. */
  attributes: string[];
};

function unquote(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1).replace(/\\(.)/g, '$1');
  }
  return trimmed;
}

/** Pull the YAML body out of an MCP tool response (```yaml fenced block). */
export function extractSnapshot(responseText: string): string {
  // The closing fence must start a line: page text inside the snapshot can contain ```.
  const match = responseText.match(/```yaml\n([\s\S]*?\n)```[ \t]*(?:\n|$)/);
  return match ? match[1] : '';
}

export function parseSnapshot(yaml: string): SnapshotNode[] {
  const nodes: SnapshotNode[] = [];
  for (const line of yaml.split('\n')) {
    const item = line.match(/^\s*- (.*)$/);
    if (!item) continue;
    let rest = item[1];

    const roleMatch = rest.match(/^[a-z][a-z-]*/);
    if (!roleMatch) continue; // `/url:` and similar property lines
    const role = roleMatch[0];
    rest = rest.slice(role.length);

    let name = '';
    const nameMatch = rest.match(/^ "((?:[^"\\]|\\.)*)"/);
    if (nameMatch) {
      name = nameMatch[1].replace(/\\(.)/g, '$1');
      rest = rest.slice(nameMatch[0].length);
    }

    const attributes: string[] = [];
    let ref: string | undefined;
    const attrPattern = /^\s*\[([^\]]*)\]/;
    let attrMatch = rest.match(attrPattern);
    while (attrMatch) {
      const value = attrMatch[1];
      if (value.startsWith('ref=')) {
        ref = value.slice(4);
      } else {
        attributes.push(value);
      }
      rest = rest.slice(attrMatch[0].length);
      attrMatch = rest.match(attrPattern);
    }

    const textMatch = rest.match(/^:\s?(.*)$/);
    const text = textMatch ? unquote(textMatch[1]) : '';
    nodes.push({ role, name, ref, text, attributes });
  }
  return nodes;
}

export function findNode(
  nodes: SnapshotNode[],
  role: string,
  name: string | RegExp,
): SnapshotNode | undefined {
  return nodes.find(
    (node) =>
      node.role === role && (typeof name === 'string' ? node.name === name : name.test(node.name)),
  );
}

/** Every name and text value on the page, one per line, for text oracles. */
export function visibleText(nodes: SnapshotNode[]): string {
  return nodes
    .flatMap((node) => [node.name, node.text])
    .filter((value) => value.length > 0)
    .join('\n');
}

/** `- Page URL: http://...` line from an MCP response, when present. */
export function pageUrl(responseText: string): string | undefined {
  return responseText.match(/^- Page URL: (\S+)/m)?.[1];
}
