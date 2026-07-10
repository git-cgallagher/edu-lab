# Changelog

All notable, user-visible or infra changes to this project.
Format loosely follows [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added
- **Support-link framework** (`support.js`) — data-driven "support the project"
  links rendered into the sidebar footer via the `SUPPORT_LINKS` array. Ships
  **empty** (no public support page exists yet — re-enable criteria are in the
  file). Marked `no-print`, so it never appears on worksheets.
- **Brand endorsement + structured data** (`index.html`) — an "an Appalachian
  Cloud project" byline linking `appalachiancloud.co`, `WebApplication` JSON-LD
  (CSP-safe data block), `theme-color`, and a `robots.txt`.
- **README** — live-site link, a user-facing **Using the site** section, and
  documentation for the support-link framework.
- **SEO + social metadata & favicon** (`index.html`) — canonical URL, a meta
  description, Open Graph + Twitter Card tags, and a small inline SVG favicon
  (brand "A" mark as a `data:` URI, permitted by the `img-src 'self' data:` CSP).

### Fixed
- **Stale CSS/JS for returning visitors** (#16) — the deploy now appends a
  per-release version token (`?v=<short-sha>`) to the CSS/JS references in
  `index.html`, so repeat visitors fetch fresh assets each release instead of
  reusing their `immutable`-cached copies until a hard refresh. Assets keep
  their long-lived immutable cache; only the browser cache key changes.
- **Word search listed unfindable words** — the "Find these words" list now
  renders `data.placed` (words actually placed on the grid) instead of
  `data.words` (all requested). Placement uses a bounded retry and can silently
  drop a word (~7.6% of sheets had ≥1), which previously left an unsolvable word
  on the list. The list now matches the answer-key highlight.
- **Decimals answer key showed a doubled `=`** — `app.js renderInline` appended
  ` = <answer>` even when the question already ended in `=` (e.g.
  `1.50 + 2.30 =`), yielding `= =` in the key. The answer is now rendered exactly
  once; the dead `tail` variable was removed.
- **K / Grade-1 duplicate arithmetic** — `genAddition`/`genSubtraction` disabled
  de-duplication below grade 2 while `TYPE_META` requested 48 problems from a
  tiny operand space (K addition has only 21 distinct). De-dup is now on for all
  grades, and the requested count is capped to the distinct-problem space for
  K/G1, so sheets fill with unique problems. Grades 2+ are unchanged.
- **Duplicate question-bank entries** (`banks.js`) — removed a repeated `-able`
  suffix, a repeated `because` in the grade-2 spelling list, and a cross-grade
  `vacuum` (kept in grade 5).

### Changed
- **AI-agent guardrails: tfvars now agent-readable** (`AGENTS.md`) — the
  `Read(./**/*.tfvars)` deny was removed from `.claude/settings.json` on
  2026-07-07, so agents may read/write tfvars directly. Secrets still belong
  in SSM (a secret found in a tfvars is a finding to move there); the
  `Read(./**/*.tfstate)` deny stays, and editing `.claude/settings.json` /
  `.claude/hooks/` remains human-only.
- **Terraform execution role renamed** to `appalachiancloud-edulab-terraform` (was
  `edulab-terraform`) for `appalachiancloud-*` prefix conformance — assumed
  `appalachiancloud-operator` (MFA) → `appalachiancloud-bootstrap` → this role. The
  GitHub Actions OIDC deploy role (`appalachiancloud-edulab-github-deploy`), the S3
  bucket, CloudFront, ACM cert, and the other resources are unchanged. `DEPLOY.md`
  and `AGENTS.md` updated to match.
- **Rebranded** the display name to **LessonsAtHome** (dropping the `ACE`
  prefix), positioned as an endorsed **"an Appalachian Cloud project"** sub-brand
  of Appalachian Cloud Engineering. Updated `<title>`/OG/Twitter, `<h1>`, README,
  and `AGENTS.md`. Infrastructure identifiers (domain `edulab.appalachiancloud.co`,
  ACM cert, S3 bucket, CloudFront, OIDC role, Terraform resources) are unchanged.
- **Shipped the warm skin, accessibly** — reconciled the code to the documented
  palette but with WCAG-AA text colors: UI/text accent `#1F6FA5` (AA) on Cloud
  White `#FAFAF5`, with Sky Blue `#3DA5D9` / Sunshine `#FFC93C` as decoration-only
  tokens (`--sky`/`--sun`). Retokenized hardcoded colors outside `:root`
  (`styles.css`, `themes.css`, `app.js` SVG fills, favicon). Rounded display
  stack for the app title.
- **Ownership** — MIT `LICENSE`/README copyright holder is now
  **Appalachian Cloud Engineering, LLC** (was Chris Gallagher).

### Removed
- **Broken Patreon link** — `support.js` no longer ships the
  `patreon.com/cw/AppalachianCloud` entry (that URL 404s — no page is published
  yet). `SUPPORT_LINKS` is now empty; the framework and re-enable criteria remain.

### Accessibility
- Worksheet title is now an `<h2>` (was a second `<h1>`), fixing the heading
  outline (WCAG 1.3.1 / 2.4.6). Added a visible `:focus-visible` outline and a
  `prefers-reduced-motion` guard.

### Security
- **Internal `.claude/` files no longer published** — the S3 sync in `ci.yml`
  now excludes `.claude/*`, so `/.claude/settings.json` and
  `/.claude/hooks/guardrail.py` are no longer served publicly. The existing
  `--delete` purges the already-uploaded copies on the next deploy to `main`.
- **User-entered worksheet title rendered via `textContent`** (`app.js
  renderHeader`) — defense in depth against HTML injection through the Title
  field (the CSP already blocks inline scripts; the ANSWER KEY badge stays
  trusted static markup).
