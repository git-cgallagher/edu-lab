# AGENTS.md — edu-lab

> Tool-agnostic guide for AI agents **and** humans. A **no-build static** worksheet
> generator (printable K–5 worksheets) published to `edulab.appalachiancloud.co`.
> Read this, then `README.md` + `DEPLOY.md`, then `~/Code/AGENTS.md` (workspace map).

## Stack & publish
- **Site:** plain HTML/CSS/JS, no build step (`index.html`, `app.js`, `banks.js`, `generator.js`, `stem.*`, `themes.*`, `styles.css`). CI syntax-checks JS with `node --check`.
- **Infra:** `terraform/` — S3 (AES256) + CloudFront (OAC) + ACM (DNS-validated). Apply with **`aws-vault exec edulab-terraform`** (region us-east-1, MFA). The account baseline + `edulab-terraform` role already exist.
- **Deploy:** merge to `main` → GitHub Actions → OIDC (`appalachiancloud-edulab-github-deploy`) → S3 sync → CloudFront invalidation. Requires repo **variables** `AWS_ACCOUNT_ID`, `S3_BUCKET`, `CLOUDFRONT_ID` (from `terraform output`; see `DEPLOY.md`).

## ⚠️ Open items / gotchas
- **Launch in progress (2026-07-04):** phase-1 `terraform apply` completed — S3 policy, CloudFront `E30K4N661AMPGX` on the default `*.cloudfront.net` cert, ACM cert `PENDING_VALIDATION`, `appalachiancloud-edulab-github-deploy` OIDC role. Validation CNAME + site CNAME added to Cloudflare via a `mountain-infra` PR (both grey cloud). Once ACM reaches `Issued`, run `terraform apply -var enable_custom_domain=true` to swap CloudFront onto the validated cert.
- **Domain:** `edulab.appalachiancloud.co` (`.co`, not `.com`). `.co` is the primary ACE zone; `.com` is redirect-only. `README.md`, `DEPLOY.md`, and `terraform/variables.tf` are consistent.
- **CI:** the build/deploy workflow (`ci.yml`) passes. **CodeQL** requires enabling *Code Scanning* in Settings → Code security → Code scanning → *Default* (the workflow itself is fine; it currently fails with "Code scanning is not enabled for this repository"). Repo-settings flip, not a code fix.
- **OIDC provider lookup uses `arn`, not `url`:** the scoped `edulab-terraform` role has `iam:GetOpenIDConnectProvider` but not `ListOpenIDConnectProviders`. The data source in `terraform/main.tf` is ARN-form so plan/apply work without a baseline change.
- Unlike Boss BOS, edu-lab uses **AES256** (not KMS) with no origin-request policy and no `aws:RequestedRegion` condition, so it does not need those fixes.

## 🔐 Secret & PII discipline (public repo)

**This repo is public.** The static site is meant to be public; the code is meant to be reviewable; all AWS access is OIDC-derived at deploy time; runtime holds no secrets. Every file here is world-readable — treat every commit that way.

### Threat model
- Static S3+CloudFront site, no user accounts, no server-side code, no runtime credentials.
- CI/CD assumes an OIDC-scoped IAM role (`appalachiancloud-edulab-github-deploy`). Zero static AWS keys anywhere in the repo.
- Committed identifiers — AWS account ID (`651120422878`), CloudFront distribution ID, deploy role name, S3 bucket names, KMS alias — are **not secrets** by AWS's own posture (they leak via S3 signed URLs, SNS, and CloudFront responses anyway). Accepted disclosure.
- **What IS sensitive**: real AWS access keys, private keys, GitHub tokens, SSM `SecureString` values, third-party API keys, PII beyond the commit-author email.

### Never commit
`.gitignore` covers the file classes below — do not override:
- `*.tfvars` (except `*.tfvars.example`), `*.tfstate*`, `.terraform/`, `.terraform.lock.hcl`
- `.env`, `.env.*`
- `*.pem`, `*.p12`, `*.pfx`, `*.key`

Also never commit content matching:
- `AKIA[0-9A-Z]{16}` — AWS Access Key ID
- `-----BEGIN … PRIVATE KEY-----` — any private key or cert
- `ghp_`, `gho_`, `ghs_`, `github_pat_` — GitHub tokens
- `sk_(live|test)_…` — Stripe · `xox[bpaors]-…` — Slack · `AIza[0-9A-Za-z_-]{35}` — Google
- `hex(24):hex(64)` — Ghost Admin API key shape
- JWT (`eyJhb…`)
- Anything from `aws ssm get-parameter --with-decryption` output

### AI-agent rules (Claude Code, Cursor, Copilot, etc.)
- Before staging a NEW file: grep it for the patterns above. If in doubt, refuse and ask.
- Never `Read` `.env`, `.tfvars`, `.tfstate`, or `.pem` files (already denied in `.claude/settings.json`).
- Never resolve `aws ssm get-parameter --with-decryption` and paste output into a shell, file, or PR body.
- If asked to add config that looks credential-shaped, refuse and route it to SSM Parameter Store (`SecureString`) + runtime read via the OIDC role.
- If asked to add a piece of PII (email, address, phone) that isn't the accepted commit-author email, refuse and ask the human whether the field is intended-public.
- Operational blocks (destroy, force-push, curl|sh, etc.) are enforced by `.claude/hooks/guardrail.py` — the deny list here is the intent, the hook is the enforcement.

### If a secret leaks
1. **Rotate first.** Reset the AWS key / GitHub token / Ghost Admin API key / whatever it is. Review CloudTrail (AWS) or audit log (GitHub) for use of the leaked credential.
2. **Then rewrite history.** Use `git filter-repo` (never `git filter-branch`, never blind `--force` push). Coordinate with any downstream mirrors — force-pushing to a shared branch requires everyone else to re-clone.
3. **Post-mortem.** Update this section with what leaked, how, and the safeguard that would have caught it earlier (pre-commit hook, `gitleaks` in CI, etc.).

### Enabled repo-level protections
- **GitHub Secret Scanning + Push Protection** (blocks pushes containing known secret shapes at the API level).
- **CodeQL** default setup on JavaScript.
- **Dependabot** alerts + weekly updates.
- Branch protection on `main` — recommended (verify in repo Settings).

See `~/Code/AGENTS.md` for the workspace-wide policy, this repo's `.claude/settings.json` for enforced deny rules, and `.claude/hooks/guardrail.py` for the PreToolUse pattern matcher.

## 📝 Documentation & change discipline

Publication must stay **repeatable from the repo**. In the **same PR** as any change, update the docs it affects — the change isn't done until they are: this `AGENTS.md`, `README.md`/`DEPLOY.md`, the gotchas above (a failure + its fix), **TODO/follow-ups**, and `CHANGELOG.md`.

**Out-of-band changes → raise an issue.** Anything changed outside Terraform/Git — a hand-edited **SSM** parameter or an **SSH**/console change — is drift: open a GitHub issue (`mountain-infra` for server/SSM; this repo for the site/its infra) so it gets codified, and prefer changing code first. Never read/exfiltrate SSM secrets, `*.tfvars`, or `*.tfstate`.

See **`~/Code/AGENTS.md`** for the full workspace map + policy, and this repo's `.claude/settings.json` + `PreToolUse` hook for the enforced "do no harm" guardrails (work on branches, open PRs, treat `main` as protected).
