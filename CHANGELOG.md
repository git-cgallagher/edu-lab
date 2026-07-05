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

### Changed
- **Rebranded** the site's display name from `edu-lab` to **ACE LessonsAtHome**
  (page `<title>`, `<h1>`, and README brand). Infrastructure identifiers
  (domain `edulab.appalachiancloud.co`, ACM cert, S3 bucket, CloudFront, OIDC
  role, Terraform resources) are intentionally unchanged.
