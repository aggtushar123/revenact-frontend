# SOC 2 Control Exceptions

A requirement that cannot be met as written is recorded here rather than ignored.
Every exception needs a compensating control, an approver, and an expiry. Expired
exceptions are findings. Review this file quarterly.

| ID | Requirement | Scope (paths/services) | Rationale | Compensating control | Approver | Opened | Expires | Status |
|----|-------------|------------------------|-----------|----------------------|----------|--------|---------|--------|
| EX-001 | CHG-01 (branch protection), CHG-02 (required checks) | GitHub `aggtushar123/revenact-frontend` | Private repository on the GitHub Free plan: branch protection and rulesets are unavailable (API returns 403 "Upgrade to GitHub Pro or make this repository public"). | `ci.yml` (lint, tests, build) and `soc2-gates.yml` (gitleaks, npm audit, semgrep, heuristic scan) run on every push to `main` and every PR; pre-commit gitleaks locally; CODEOWNERS and PR template in place; one maintainer today. Same as backend EX-002. | [TODO: name] | 2026-09-15 | 2027-03-31 | closed 2026-09-16 — repository public, ruleset on `main` (PR + all checks required, no force push, no bypass) |
