# SOC 2 Control Map — react-ts-app

Browser-client controls only. API, data and infrastructure controls are mapped in
`revenact-backend/.soc2/CONTROL_MAP.md`. Update in the same PR as the code.

Status: **met** | **partial** | **missing** | **excepted** (see `EXCEPTIONS.md`) | **n/a**

| Requirement | Status | Implementation (file:symbol) | Evidence | Owner | Last verified |
|-------------|--------|------------------------------|----------|-------|---------------|
| AUTH-01 | met | `src/components/auth/ProtectedRoute.tsx` gates routes; `src/lib/apiClient.ts` attaches the bearer token and retries once after a refresh | `ProtectedRoute.test.tsx`, `apiClient.test.ts` | @aggtushar123 | 2026-09-15 |
| AUTH-05 | partial | `src/features/auth/authSlice.ts:refreshSession` stores the rotated refresh token the backend now returns (single-use tokens) and logs out when a refresh is rejected. Gap: access and refresh tokens still live in `localStorage` (readable by any XSS); moving the refresh token to an httpOnly cookie is gap report #14 | `authSlice.test.ts` "refresh session" | @aggtushar123 | 2026-09-15 |
| API-02 | met | React escaping throughout; no `dangerouslySetInnerHTML`, `innerHTML` or `eval`; production CSP `script-src 'self'` set by Caddy (`revenact-infra/deploy/Caddyfile`) | `grep -rn dangerouslySetInnerHTML src` → none; `dist/index.html` has no inline scripts | @aggtushar123 | 2026-09-15 |
| API-06 | met | Security headers and CSP for the SPA in `revenact-infra/deploy/Caddyfile` (HSTS, nosniff, frame DENY, referrer, CSP allowing Google Fonts and same-origin API/WebSocket) | `curl -I https://<host>/` after `make sync` | @aggtushar123 | 2026-09-15 |
| DATA-06 | partial | Only `VITE_API_URL` is baked into the bundle; no secrets. JWTs and the user profile in `localStorage` (see AUTH-05) | `.env.example`, `Dockerfile` | | 2026-09-15 |
| SEC-01 | met | `.env` git-ignored; gitleaks in CI (`.github/workflows/soc2-gates.yml: secret-scan`) and pre-commit (`.pre-commit-config.yaml`); `.gitleaks.toml` allowlist | Actions run "soc2-gates / secret-scan" | @aggtushar123 | 2026-09-15 |
| SEC-03 | met | `package-lock.json`; `npm audit --omit=dev --audit-level=high` in CI; Dependabot weekly (`.github/dependabot.yml`) | Actions run "dependency-scan", Dependabot PRs | @aggtushar123 | 2026-09-15 |
| SEC-04 | met | semgrep `p/security-audit`, `p/secrets`, `p/owasp-top-ten`, `p/react`, `p/typescript` in CI (`soc2-gates.yml: static-analysis`) | Actions run "static-analysis" | @aggtushar123 | 2026-09-15 |
| SEC-05 | partial | `Dockerfile`: builds with `node:22-alpine`, publishes from `alpine:3.20` by copying `dist` into a volume and exiting. Runs as root for the seconds it takes to write the root-owned volume; no ports, no secrets, no long-running process. Accepted ("should") | `Dockerfile` | @aggtushar123 | 2026-09-15 |
| CHG-01 | excepted | EX-001: GitHub Free private repo, no branch protection available | `EXCEPTIONS.md` | @aggtushar123 | 2026-09-15 |
| CHG-02 | partial | `ci.yml` (eslint, vitest, build; actions on v4) + `soc2-gates.yml` on every PR and push to main; cannot be made required (EX-001). Vercel deploy job still present though the live deployment is the Azure VM | Actions tab | @aggtushar123 | 2026-09-15 |
| CHG-03 | met | `.github/pull_request_template.md` with the SOC 2 checklist | | @aggtushar123 | 2026-09-15 |
| CHG-04 | met | `.github/CODEOWNERS` (auth, API client, CI, Dockerfile, `.soc2/`) | | @aggtushar123 | 2026-09-15 |
| EVD-01 | met | This file; `.claude/skills/soc2-dev/scripts/control_map.py` drift check in `soc2-gates.yml` | | @aggtushar123 | 2026-09-15 |
| EVD-03 | met | `.soc2/EXCEPTIONS.md` | | @aggtushar123 | 2026-09-15 |
