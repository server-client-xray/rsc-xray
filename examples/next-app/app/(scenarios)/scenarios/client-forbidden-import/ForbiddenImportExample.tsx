'use client';

import * as fs from 'fs';

export function ForbiddenImportExample(): JSX.Element {
  // Accessing fs at runtime will explode in browsers; the goal is to show how the analyzer catches it.
  void fs;
  return (
    <div
      style={{
        padding: 16,
        borderRadius: 8,
        background: 'rgba(248,113,113,0.15)',
        border: '1px solid rgba(248,113,113,0.35)',
      }}
    >
      Forbidden import example
    </div>
  );
}
