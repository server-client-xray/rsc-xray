# Agent Workflow & Guidelines

## GitHub Access
- Outbound GitHub API access is enabled—verify with `gh auth status` and `gh repo view <owner>/<repo> --json name` before running automation.
- If connectivity regresses, note it in the PR and continue with local work; never guess remote state.
- Use `scripts/fix_scx_issues_strict.sh --repo <owner/name>` (lives in the Pro repo) to sync milestones/labels/issues. Run a dry-run first, then `--apply`. Requires Bash ≥ 4 (use `/opt/homebrew/bin/bash` on macOS).

## Branch & Issue Flow
1. Identify the next roadmap task: find the matching issue or create one in the correct milestone (`docs/server-client-xray-github-issues.md` is the source of truth).
2. Create a local branch named `#issue-terse-description` (example: `#22-agent-guidelines`).
3. Implement the work in small, issue-referenced commits for easy debugging; add/update automated tests or checks whenever feasible.
4. Open the PR promptly, run the full test suite/CI, and fix failures before requesting review. Include a closing keyword in the PR description (e.g., `Closes #22`) so merging resolves the issue automatically.
5. Merge once CI is green and review (if needed) is done, then repeat the cycle by picking the next issue.

## Development Principles
- **YAGNI:** ship only what the current milestone/issue requires.
- **DRY:** centralize shared logic; avoid copy/paste across packages.
- **SOLID:** keep modules cohesive and responsibilities clear.
- **Offensive programming, defensive boundaries:** assert invariants internally, surface defensive validation/errors at user interfaces.
- Prefer early returns/guard clauses to keep control flow readable.
- Keep functions small and well named; comment only when intent is non-obvious.
- Update or add tests with code changes; ensure CI runs them to catch regressions.

## Task Checklist
- [ ] Review milestone + issue requirements (create one if missing).
- [ ] Confirm GitHub connectivity (note limitations in the PR if offline).
- [ ] Branch from `main` using the mandated naming pattern.
- [ ] Implement changes per these principles; add tests/checks and run them locally + in CI.
- [ ] Keep commits granular and descriptive.
- [ ] Update documentation/config/scripts affected by the change.
- [ ] Prepare PR summary with context, testing evidence, follow-ups; include closing keywords and merge before starting the next issue.
