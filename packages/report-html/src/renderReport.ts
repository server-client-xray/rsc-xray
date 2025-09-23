import type { Model, Suggestion } from '@server-client-xray/schemas';

const styles = `
  body {
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: #0f172a;
    color: #e2e8f0;
    margin: 0;
    padding: 32px;
  }
  h1 {
    margin-bottom: 24px;
  }
  .route {
    background: rgba(148, 163, 184, 0.08);
    border: 1px solid rgba(148, 163, 184, 0.2);
    border-radius: 12px;
    margin-bottom: 24px;
    padding: 16px 20px;
  }
  .route-header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
  }
  .route-chunks {
    font-size: 13px;
    color: rgba(148, 163, 184, 0.8);
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 12px;
  }
  th, td {
    border-bottom: 1px solid rgba(148, 163, 184, 0.15);
    padding: 8px 4px;
    text-align: left;
    font-size: 14px;
  }
  th {
    color: rgba(226, 232, 240, 0.8);
    font-weight: 600;
  }
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(148, 163, 184, 0.15);
    border-radius: 999px;
    padding: 2px 10px;
    font-size: 12px;
    color: rgba(226, 232, 240, 0.9);
  }
  .badge.warn {
    background: rgba(249, 115, 22, 0.2);
    color: rgb(251, 191, 36);
  }
  .badge.info {
    background: rgba(56, 189, 248, 0.2);
    color: rgb(125, 211, 252);
  }
  .suggestions-table {
    margin-top: 12px;
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }
  .suggestions-table th,
  .suggestions-table td {
    border-bottom: 1px solid rgba(148, 163, 184, 0.15);
    padding: 6px 4px;
    text-align: left;
  }
  .suggestions-table th {
    text-transform: uppercase;
    letter-spacing: 0.04em;
    font-size: 12px;
    color: rgba(226, 232, 240, 0.7);
  }
  .suggestion-level-warn {
    color: rgb(249, 115, 22);
  }
  .suggestion-level-info {
    color: rgb(56, 189, 248);
  }
`;

function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) {
    return '';
  }
  const kilobytes = bytes / 1024;
  if (kilobytes < 1) {
    return `${bytes.toFixed(0)} B`;
  }
  return `${kilobytes.toFixed(kilobytes >= 100 ? 0 : 1)} KB`;
}

function renderSuggestionsBadge(suggestions?: Suggestion[]): string {
  if (!suggestions || suggestions.length === 0) {
    return '';
  }
  const hasWarn = suggestions.some((item) => item.level === 'warn');
  const title = suggestions
    .map((item) => `${item.level.toUpperCase()}: ${item.message}`)
    .join('\n');
  return `<span class="badge ${hasWarn ? 'warn' : 'info'}" title="${title}">Suggestions ${suggestions.length}</span>`;
}

function indentLabel(label: string, depth: number): string {
  if (depth <= 0) {
    return label;
  }
  const padding = '&nbsp;'.repeat(depth * 4);
  return `${padding}${label}`;
}

function renderNodeRows(model: Model, nodeId: string, depth: number): string {
  const node = model.nodes[nodeId];
  if (!node) {
    return '';
  }

  const label = indentLabel(node.file ?? node.name ?? node.id, depth);
  const bytesLabel = formatBytes(node.bytes);
  const suggestions = renderSuggestionsBadge(node.suggestions);

  const currentRow = `<tr>
    <td>${node.kind.toUpperCase()}</td>
    <td>${label}</td>
    <td>${bytesLabel}</td>
    <td>${suggestions}</td>
  </tr>`;

  const childRows = (node.children ?? [])
    .map((childId) => renderNodeRows(model, childId, depth + 1))
    .join('');

  return `${currentRow}${childRows}`;
}

interface CollectedSuggestion {
  nodeLabel: string;
  suggestion: Suggestion;
}

function collectRouteSuggestions(model: Model, nodeId: string): CollectedSuggestion[] {
  const node = model.nodes[nodeId];
  if (!node) {
    return [];
  }

  const nodeLabel = node.file ?? node.name ?? node.id;
  const ownSuggestions = (node.suggestions ?? []).map((suggestion) => ({
    nodeLabel,
    suggestion,
  }));

  const childSuggestions = (node.children ?? [])
    .map((childId) => collectRouteSuggestions(model, childId))
    .flat();

  return [...ownSuggestions, ...childSuggestions];
}

export function renderHtmlReport(model: Model): string {
  const routeSections = model.routes
    .map((route) => {
      const node = model.nodes[route.rootNodeId];
      const rows = (node?.children ?? [])
        .map((childId) => renderNodeRows(model, childId, 0))
        .join('');

      const collectedSuggestions = collectRouteSuggestions(model, route.rootNodeId);
      const suggestionsTable = collectedSuggestions.length
        ? `<table class="suggestions-table">
            <thead>
              <tr>
                <th>Rule</th>
                <th>Level</th>
                <th>Location</th>
                <th>Message</th>
                <th>Node</th>
              </tr>
            </thead>
            <tbody>
              ${collectedSuggestions
                .map(({ nodeLabel, suggestion }) => {
                  const loc = suggestion.loc
                    ? `${suggestion.loc.file}:${suggestion.loc.line}:${suggestion.loc.col}`
                    : 'n/a';
                  const levelClass = `suggestion-level-${suggestion.level}`;
                  return `<tr>
                    <td>${suggestion.rule}</td>
                    <td class="${levelClass}">${suggestion.level.toUpperCase()}</td>
                    <td>${loc}</td>
                    <td>${suggestion.message}</td>
                    <td>${nodeLabel}</td>
                  </tr>`;
                })
                .join('')}
            </tbody>
          </table>`
        : '<p style="margin-top: 12px; font-size: 13px; color: rgba(148, 163, 184, 0.75);">No suggestions for this route.</p>';

      const chunkLabel = route.chunks?.join(', ') ?? 'n/a';
      const bytesLabel = formatBytes(route.totalBytes);

      return `<section class="route">
        <div class="route-header">
          <h2>${route.route}</h2>
          <span class="route-chunks">${chunkLabel}</span>
          <span class="badge">${node?.kind.toUpperCase()}</span>
          <span class="badge">${bytesLabel || '0 KB'}</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>Kind</th>
              <th>File</th>
              <th>Bytes</th>
              <th>Suggestions</th>
            </tr>
         </thead>
         <tbody>${rows}
          </tbody>
       </table>
        ${suggestionsTable}
      </section>`;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Server-Client XRay Report</title>
    <style>${styles}</style>
  </head>
  <body>
    <h1>Server-Client XRay Report</h1>
    ${routeSections}
  </body>
</html>`;
}
