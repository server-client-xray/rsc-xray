---
'@rsc-xray/analyzer': patch
'@rsc-xray/cli': patch
'@rsc-xray/hydration': patch
'@rsc-xray/report-html': patch
'@rsc-xray/schemas': patch
---

Consolidate CI/CD workflows and improve repository configuration

- Unified ci.yml and publish.yml into single ci-release.yml workflow
- Clear job dependencies: lint-and-format + test → build → publish
- Updated TypeScript to 5.6.2 and Vitest to 3.2.4
- Added package descriptions for better npm registry display
- Configured Dependabot for automated dependency updates
- Added .nvmrc for Node.js version consistency
