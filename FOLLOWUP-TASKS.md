# Follow-Up Tasks — OSS Repository

This document tracks future improvements that couldn't be completed in the current cleanup PR.

---

## Visual Assets (Phase 3 - Deferred)

### Screenshots & GIFs for Documentation

#### Root README.md

- [ ] **Add demo GIF** showing interactive demo at demo.rsc-xray.dev
  - Show: Code editing → Real-time diagnostics → Red squiggles appearing
  - Duration: ~10-15 seconds
  - Tool suggestion: [Kap](https://getkap.co/) or [LICEcap](https://www.cockos.com/licecap/)
  - Placement: After "Try it live" link, before "Features (Free/OSS)" section

- [ ] **Add HTML report screenshot** showing static report
  - Show: Bundle analysis, component tree, diagnostics with file/line numbers
  - Tool: Browser screenshot (Chrome DevTools)
  - Placement: Under "What's in the HTML Report?" section
  - Alt text: "RSC X-Ray HTML report showing boundary tree, bundle sizes, and diagnostics"

#### packages/cli/README.md

- [ ] **Add terminal output example** showing CLI in action
  - Show: `npx @rsc-xray/cli analyze` with progress and success output
  - Tool: `script` command or [asciinema](https://asciinema.org/)
  - Format: Code block or screenshot
  - Placement: After Quick Start section

#### packages/report-html/README.md

- [ ] **Add report screenshot** (same as root README)
  - Show: Full HTML report interface
  - Placement: Under "What it does" section

#### examples/demo/README.md

- [ ] **Add demo interface screenshot**
  - Show: Split-panel layout with CodeMirror and explanation
  - Show: Diagnostics appearing in code
  - Tool: Browser screenshot
  - Placement: Near top of README

---

## Example READMEs (Phase 3 - Partially Complete)

### examples/demo/README.md

- [ ] **Add architecture diagram** explaining split-panel design
  - Components: ExplanationPanel, CodeEditorPanel, StatusBar
  - Data flow: User edits → API route → LSP analysis → Diagnostics rendering
  - Tool: [Mermaid](https://mermaid.js.org/) or [Excalidraw](https://excalidraw.com/)

- [ ] **Add scenario development guide**
  - How to add new scenarios
  - Scenario file structure
  - Context requirements for different rules

- [ ] **Document Pro teaser implementation**
  - Visual-only replicas with static data
  - No Pro business logic exposed
  - Safe for OSS repo

### examples/next-app/README.md

- [ ] **Enhance setup instructions**
  - Prerequisites (Node.js version, Next.js version)
  - Environment variables (if any)
  - Port configuration

- [ ] **Document demo routes**
  - Purpose of each route (`/products`, `/scenarios/*`)
  - Which rules each route triggers
  - Expected diagnostics

- [ ] **Add analyzer workflow guide**
  - Build → Analyze → Report cycle
  - How to test new analyzer rules
  - Fixture development

---

## Documentation Cross-Links (Phase 4 - Verification)

### Link Validation Script

- [ ] **Create automated link checker**
  - Tool: [markdown-link-check](https://github.com/tcort/markdown-link-check)
  - Run in CI on doc changes
  - Check: Relative links, internal anchors, external URLs

Example script:

```bash
#!/bin/bash
# scripts/check-docs-links.sh
find docs -name "*.md" -exec markdown-link-check {} \;
find packages -name "README.md" -exec markdown-link-check {} \;
find examples -name "README.md" -exec markdown-link-check {} \;
```

---

## Issue & PR Templates (Phase 4 - Review)

### Enhancement: Issue Templates

- [ ] **Bug report template** (.github/ISSUE_TEMPLATE/bug_report.md)
  - Currently exists, verify completeness
  - Add fields: Next.js version, Node.js version, example repo link

- [ ] **Feature request template** (.github/ISSUE_TEMPLATE/feature_request.md)
  - Currently exists, verify completeness
  - Add field: Use case description

- [ ] **Question template** (.github/ISSUE_TEMPLATE/question.md)
  - Create new template for general questions
  - Direct to Discussions for non-issues

### Enhancement: PR Template

- [ ] **Review .github/pull_request_template.md**
  - Currently exists, verify completeness
  - Add checklist items:
    - [ ] Tests added/updated
    - [ ] Documentation updated
    - [ ] CHANGELOG.md entry added (if applicable)
    - [ ] Screenshots added (if UI changes)

---

## Package README Improvements (Future)

### All Packages

- [ ] **Add "When to use this package" section**
  - Direct usage vs CLI usage
  - Programmatic API examples

- [ ] **Add troubleshooting sections**
  - Common errors and solutions
  - Debug tips

### Specific Packages

#### packages/schemas/README.md

- [ ] **Add Model JSON guide**
  - Schema documentation
  - Example model.json with annotations
  - Type safety examples

#### packages/hydration/README.md

- [ ] **Add performance impact notes**
  - Overhead analysis
  - When to enable/disable
  - Production considerations

#### packages/report-html/README.md

- [ ] **Add customization guide**
  - Template modification
  - Branding options
  - Embedding in CI dashboards

---

## CI/CD Enhancements (Future)

### Documentation in CI

- [ ] **Add documentation build check**
  - Verify all markdown renders correctly
  - Check for broken links
  - Validate code blocks (syntax highlighting)

- [ ] **Add screenshot freshness check**
  - Warn if screenshots are >6 months old
  - Automated screenshot generation (if feasible)

---

## Dependabot PRs (Phase 4 - Pending Decision)

### Open Dependabot PRs (as of 2025-10-02)

- [ ] **PR #88**: Bump @types/node from 20.15.0 to 24.6.0
  - **Action**: Test for compatibility issues
  - **Risk**: Major version bump
  - **Decision**: Merge if tests pass, close if breaking

- [ ] **PR #87**: Bump typescript-eslint from 8.44.0 to 8.45.0
  - **Action**: Merge (minor version, low risk)

- [ ] **PR #86**: Bump lint-staged from 16.1.6 to 16.2.3
  - **Action**: Merge (patch version, safe)

- [ ] **PR #85**: Bump next from 14.2.5 to 15.5.4
  - **Action**: Close (already manually updated to 15.5.4 in demo)
  - **Note**: Add comment explaining manual update

### Dependabot Policy

- [ ] **Configure Dependabot grouping**
  - Group patch updates
  - Group minor updates
  - Separate major updates

---

## Metrics & Analytics (Future)

### npm Package Stats

- [ ] **Track download metrics**
  - Monitor adoption via npm stats
  - Identify most-used packages
  - Inform prioritization

### Documentation Analytics

- [ ] **Add simple analytics to demo**
  - Track scenario popularity
  - Identify drop-off points
  - Improve UX based on data

---

## Priority Ranking

### High Priority (Next Sprint)

1. ✅ **PR #87** - Merge typescript-eslint bump
2. ✅ **PR #86** - Merge lint-staged bump
3. 📸 **Root README GIF** - Demo visibility crucial
4. 📸 **HTML report screenshot** - Show value proposition

### Medium Priority (Next Month)

5. 📝 **Demo architecture diagram** - Help contributors
6. 📝 **Link validation script** - Prevent broken links
7. 📸 **CLI terminal output** - Show real usage
8. 🔄 **Review issue/PR templates** - Improve contributions

### Low Priority (Future)

9. 📝 **Enhanced troubleshooting guides** - As issues arise
10. 📊 **Analytics setup** - After launch growth

---

## How to Contribute to These Tasks

1. **Pick a task** from above
2. **Create an issue** referencing this document
3. **Open a PR** with the improvement
4. **Update this file** to mark task complete

---

## Notes

- **Screenshots**: Use consistent theme (light mode preferred)
- **GIFs**: Keep under 5MB, use modern formats (WebP, MP4)
- **Diagrams**: Use Mermaid for version control friendliness
- **Alt text**: Always include descriptive alt text for accessibility

---

**Last Updated**: October 2, 2025  
**Related PR**: #151 (Phase 1 & 2 cleanup)
