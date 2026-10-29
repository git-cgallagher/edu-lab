# Security policy

## Reporting a vulnerability

Please report security issues **privately** through GitHub:
[Report a vulnerability](https://github.com/git-cgallagher/edu-lab/security/advisories/new)
(the **Security** tab, then **Report a vulnerability**). Don't open a public issue for a security problem.

If you'd rather use email, the live site lists a contact in its
[`security.txt`](https://edulab.appalachiancloud.co/.well-known/security.txt) (RFC 9116).

We aim to acknowledge reports within 5 business days. This is a small project, so fixes are best effort.

## Supported versions

Only the live site, <https://edulab.appalachiancloud.co/>, gets fixes. It is deployed from `main`.

## Scope

LessonsAtHome (this repository, `edu-lab`) is a static site that generates printable K–5 worksheets.
It is plain HTML, CSS and JavaScript, served from a private S3 bucket through CloudFront. It has no
accounts and no server-side code of its own. Worksheets are built in the browser, and the only thing
kept between visits is a local "onboarding seen" flag in `localStorage`.

The one thing a visitor can send is the form on `contact.html`. It posts to a shared contact relay
behind Cloudflare Turnstile. The relay lives in a separate repository, but problems with it are in
scope here too. The AWS infrastructure is defined in `terraform/`.

Please don't run automated scans that degrade the site for other users.
