# Changelog

All notable, user-visible or infra changes to this project.
Format loosely follows [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added
- **Support-link framework** (`support.js`) — data-driven "support the project"
  links rendered into the sidebar footer. Ships with a Patreon link
  (`https://www.patreon.com/cw/AppalachianCloud`). Add/edit entries via the
  `SUPPORT_LINKS` array. Marked `no-print`, so it never appears on worksheets.
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
- **Terraform execution role renamed** to `appalachiancloud-edulab-terraform` (was
  `edulab-terraform`) for `appalachiancloud-*` prefix conformance — assumed
  `appalachiancloud-operator` (MFA) → `appalachiancloud-bootstrap` → this role. The
  GitHub Actions OIDC deploy role (`appalachiancloud-edulab-github-deploy`), the S3
  bucket, CloudFront, ACM cert, and the other resources are unchanged. `DEPLOY.md`
  and `AGENTS.md` updated to match.
- **Rebranded** the site's display name from `edu-lab` to **ACE LessonsAtHome**
  (page `<title>`, `<h1>`, and README brand). Infrastructure identifiers
  (domain `edulab.appalachiancloud.co`, ACM cert, S3 bucket, CloudFront, OIDC
  role, Terraform resources) are intentionally unchanged.
- **Patreon link** now points at the final `https://www.patreon.com/cw/AppalachianCloud`
  (the `/c/` path 307-redirects there), removing a redirect hop.

### Security
- **Internal `.claude/` files no longer published** — the S3 sync in `ci.yml`
  now excludes `.claude/*`, so `/.claude/settings.json` and
  `/.claude/hooks/guardrail.py` are no longer served publicly. The existing
  `--delete` purges the already-uploaded copies on the next deploy to `main`.
- **User-entered worksheet title rendered via `textContent`** (`app.js
  renderHeader`) — defense in depth against HTML injection through the Title
  field (the CSP already blocks inline scripts; the ANSWER KEY badge stays
  trusted static markup).
