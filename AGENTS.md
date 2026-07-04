# AGENTS.md — edu-lab

> Tool-agnostic guide for AI agents **and** humans. A **no-build static** worksheet
> generator (printable K–5 worksheets) published to `edulab.appalachiancloud.co`.
> Read this, then `README.md` + `DEPLOY.md`, then `~/Code/AGENTS.md` (workspace map).

## Stack & publish
- **Site:** plain HTML/CSS/JS, no build step (`index.html`, `app.js`, `banks.js`, `generator.js`, `stem.*`, `themes.*`, `styles.css`). CI syntax-checks JS with `node --check`.
- **Infra:** `terraform/` — S3 (AES256) + CloudFront (OAC) + ACM (DNS-validated). Apply with **`aws-vault exec edulab-terraform`** (region us-east-1, MFA). The account baseline + `edulab-terraform` role already exist.
- **Deploy:** merge to `main` → GitHub Actions → OIDC (`appalachiancloud-edulab-github-deploy`) → S3 sync → CloudFront invalidation. Requires repo **variables** `AWS_ACCOUNT_ID`, `S3_BUCKET`, `CLOUDFRONT_ID` (from `terraform output`; see `DEPLOY.md`).

## ⚠️ Open items / gotchas
- **Live (2026-07-04):** `https://edulab.appalachiancloud.co/` serves HTTP/2 200 via CloudFront `E30K4N661AMPGX` on ACM cert `fc790fc9-b282-4b22-a93a-ccdb405c82e4` (Amazon RSA 2048, valid to 2027-01-17). TLS 1.2+ only. Origin S3 bucket `appalachiancloud-edulab-site` is public-access-blocked and OAC-locked. Baseline security headers (HSTS 1y+includeSubDomains, XFO SAMEORIGIN, XCTO nosniff, Referrer-Policy strict-origin-when-cross-origin, XSS-Protection, CSP) applied via `aws_cloudfront_response_headers_policy.site`. Deploys via GitHub Actions OIDC (`appalachiancloud-edulab-github-deploy`) on push to `main`.
- **Domain:** `edulab.appalachiancloud.co` (`.co`, not `.com`). `.co` is the primary ACE zone; `.com` is redirect-only. `README.md`, `DEPLOY.md`, and `terraform/variables.tf` are consistent.
- **CI:** the build/deploy workflow (`ci.yml`) passes. **CodeQL** requires enabling *Code Scanning* in Settings → Code security → Code scanning → *Default* (the workflow itself is fine; it currently fails with "Code scanning is not enabled for this repository"). Repo-settings flip, not a code fix.
- **OIDC provider lookup uses `arn`, not `url`:** the scoped `edulab-terraform` role has `iam:GetOpenIDConnectProvider` but not `ListOpenIDConnectProviders`. The data source in `terraform/main.tf` is ARN-form so plan/apply work without a baseline change.
- Unlike Boss BOS, edu-lab uses **AES256** (not KMS) with no origin-request policy and no `aws:RequestedRegion` condition, so it does not need those fixes.

## 📝 Documentation & change discipline

Publication must stay **repeatable from the repo**. In the **same PR** as any change, update the docs it affects — the change isn't done until they are: this `AGENTS.md`, `README.md`/`DEPLOY.md`, the gotchas above (a failure + its fix), **TODO/follow-ups**, and `CHANGELOG.md`.

**Out-of-band changes → raise an issue.** Anything changed outside Terraform/Git — a hand-edited **SSM** parameter or an **SSH**/console change — is drift: open a GitHub issue (`mountain-infra` for server/SSM; this repo for the site/its infra) so it gets codified, and prefer changing code first. Never read/exfiltrate SSM secrets, `*.tfvars`, or `*.tfstate`.

See **`~/Code/AGENTS.md`** for the full workspace map + policy, and this repo's `.claude/settings.json` + `PreToolUse` hook for the enforced "do no harm" guardrails (work on branches, open PRs, treat `main` as protected).
