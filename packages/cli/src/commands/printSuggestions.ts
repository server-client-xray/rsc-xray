import { readFile } from 'node:fs/promises';
import type { Writable } from 'node:stream';

import type { Model, Suggestion } from '@rsc-xray/schemas';

interface PrintSuggestionsOptions {
  modelPath: string;
  output?: Writable;
}

const DEFAULT_OUTPUT: Writable = process.stdout;

const LEVEL_ORDER: Record<Suggestion['level'], number> = {
  warn: 0,
  info: 1,
};

function formatLocation(suggestion: Suggestion): string {
  if (!suggestion.loc) {
    return '-';
  }
  return `${suggestion.loc.file}:${suggestion.loc.range.from}-${suggestion.loc.range.to}`;
}

export async function printSuggestions({
  modelPath,
  output = DEFAULT_OUTPUT,
}: PrintSuggestionsOptions): Promise<void> {
  const raw = await readFile(modelPath, 'utf8');
  const model = JSON.parse(raw) as Model;

  const collected: Array<{ nodeKind: string; nodeLabel: string; suggestion: Suggestion }> = [];

  for (const node of Object.values(model.nodes)) {
    if (!node.suggestions || node.suggestions.length === 0) {
      continue;
    }
    const label = node.file ?? node.name ?? node.id;
    for (const suggestion of node.suggestions) {
      collected.push({
        nodeKind: node.kind.toUpperCase(),
        nodeLabel: label,
        suggestion,
      });
    }
  }

  if (collected.length === 0) {
    output.write('No suggestions found\n');
    return;
  }

  collected.sort((a, b) => {
    const levelDiff = LEVEL_ORDER[a.suggestion.level] - LEVEL_ORDER[b.suggestion.level];
    if (levelDiff !== 0) {
      return levelDiff;
    }
    return a.nodeLabel.localeCompare(b.nodeLabel);
  });

  const header = ['Kind', 'File', 'Level', 'Rule', 'Message', 'Location'];
  const lines: string[] = [header.join(' | ')];

  for (const entry of collected) {
    const { suggestion } = entry;
    const location = formatLocation(suggestion);
    lines.push(
      [
        entry.nodeKind,
        entry.nodeLabel,
        suggestion.level.toUpperCase(),
        suggestion.rule,
        suggestion.message,
        location,
      ].join(' | ')
    );
  }

  output.write(lines.join('\n'));
  output.write('\n');
}
