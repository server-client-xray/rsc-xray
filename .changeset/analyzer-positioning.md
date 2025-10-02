---
'@rsc-xray/analyzer': minor
---

Improve route-segment-config diagnostic positioning

Diagnostics now point to actual export statements instead of hardcoded `line: 1, col: 1`.

- Enhanced `parseRouteSegmentConfig` to track AST nodes for each config option
- New `getLocation` helper converts AST nodes to accurate line/col positions
- Updated `detectConfigConflicts` to use node positions for all diagnostics
- All 190 tests passing with no behavior changes

Result: Users see diagnostics on the exact problematic export statement (e.g., `export const dynamic = 'force-dynamic'`) instead of always pointing to the first line.
