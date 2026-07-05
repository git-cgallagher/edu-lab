# Changelog

All notable, user-visible or infra changes to this project.
Format loosely follows [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added
- **Support-link framework** (`support.js`) — data-driven "support the project"
  links rendered into the sidebar footer. Ships with a Patreon link
  (`https://www.patreon.com/c/AppalachianCloud`). Add/edit entries via the
  `SUPPORT_LINKS` array. Marked `no-print`, so it never appears on worksheets.
- **README** — live-site link, a user-facing **Using the site** section, and
  documentation for the support-link framework.

### Fixed
- **Stale CSS/JS for returning visitors** (#16) — the deploy now appends a
  per-release version token (`?v=<short-sha>`) to the CSS/JS references in
  `index.html`, so repeat visitors fetch fresh assets each release instead of
  reusing their `immutable`-cached copies until a hard refresh. Assets keep
  their long-lived immutable cache; only the browser cache key changes.

### Changed
- **Rebranded** the site's display name from `edu-lab` to **ACE LessonsAtHome**
  (page `<title>`, `<h1>`, and README brand). Infrastructure identifiers
  (domain `edulab.appalachiancloud.co`, ACM cert, S3 bucket, CloudFront, OIDC
  role, Terraform resources) are intentionally unchanged.
