# ACE LessonsAtHome

> **Printable worksheets for curious kids, in seconds.**

**▶ Live: <https://edulab.appalachiancloud.co>** &nbsp;·&nbsp; repo & infra name: `edu-lab`

A fast, free educational worksheet generator for grades K–5. Pick a grade,
subject, and theme — get a clean, print-ready worksheet (plus answer key) in
your browser. No accounts, no tracking, no build step.

If it's useful to your family or classroom, you can
[**support us on Patreon**](https://www.patreon.com/cw/AppalachianCloud) — there's
a link in the app sidebar too.

---

## Brand

| | |
|---|---|
| **Name** | ACE LessonsAtHome |
| **Tagline** | Printable worksheets for curious kids, in seconds. |
| **Audience** | Parents & teachers of grades K–5 |
| **Palette** | Sunshine Yellow `#FFC93C` · Sky Blue `#3DA5D9` on Cloud White `#FAFAF5` |
| **Font** | [Baloo 2](https://fonts.google.com/specimen/Baloo+2) (display) · system sans (body) |
| **Domain** | `edulab.appalachiancloud.co` |

---

## Features

- **Grade-aware** — tailored content for Kindergarten through Grade 5
- **Subjects** — Math, Language Arts, Reading, and STEM
- **Themes** — kid-friendly themes (space, animals, ocean, dinosaurs, and more) for graphics and word banks
- **Math** — addition/subtraction, multiplication/division, fractions, decimals, place value, word problems
- **Language Arts** — spelling, vocabulary, parts of speech, sentence building, handwriting
- **Reading** — short passages with comprehension questions
- **STEM** — observation, sorting, simple logic, and measurement activities
- **Answer keys** — auto-generated alongside each worksheet
- **Print-ready** — dedicated print stylesheet; one click to print or Save-as-PDF
- **No-build, no-account** — plain HTML/CSS/JS; just open `index.html`

---

## Using the site

Open **<https://edulab.appalachiancloud.co>** (or `index.html` locally) — no
account or sign-in. From the left sidebar:

1. **Subject** — Math, Language Arts, Reading, or STEM.
2. **Worksheet type** — options update to match the subject + grade.
3. **Starting grade** & **Difficulty** — tune the content level.
4. **Problems per page** — defaults per type; override if you like.
5. *(optional)* **Seed** — reuse the same seed + settings to regenerate the
   **identical** sheet later, so a printed answer key always matches.
6. *(optional)* **Answer key** and **Fun theme** toggles for a key page and
   kid-friendly decorations.
7. **Generate**, then **Print** (or Save-as-PDF from the print dialog).

Everything runs in your browser — nothing is uploaded.

---

## Local Usage

This is a **no-build static site** — there is nothing to install or compile.

```bash
# Just open the file in your browser:
open index.html

# …or serve it locally if you prefer (any static server works):
python3 -m http.server 8000
# then visit http://localhost:8000
```

If a `package.json` with tests is present, you can also run:

```bash
npm install   # only if package.json exists
npm test      # optional unit tests
```

---

## Project Structure

```
edu-lab/
├── index.html       # App entry — full single-page UI
├── app.js           # UI wiring, dropdown population, print handler
├── generator.js     # Seeded RNG (mulberry32) + math / LA / reading generators
├── stem.js          # STEM generators (self-registers onto window.WS)
├── banks.js         # Themed word banks (space, animals, ocean, dinosaurs, …)
├── themes.js        # Theme metadata + decorate helpers
├── support.js       # Data-driven "support the project" links (Patreon, …)
├── styles.css       # Brand + layout + print styles
├── themes.css       # Per-theme visual accents
├── stem.css         # STEM worksheet styles
│
├── terraform/       # S3 (private) + CloudFront (OAC) + OIDC deploy role
│
├── .github/
│   ├── workflows/
│   │   ├── ci.yml      # No-build syntax check + OIDC deploy on push-to-main
│   │   └── codeql.yml  # CodeQL security scanning
│   └── dependabot.yml
│
├── DEPLOY.md
├── LICENSE
└── README.md
```

Scripts load in dependency order in `index.html` (`banks.js` → `generator.js` → `themes.js` → `stem.js` → `support.js` → `app.js`). Everything self-registers onto `window` — no bundler, no imports.

To add or change support links, edit the `SUPPORT_LINKS` array in `support.js` — entries render automatically into the sidebar footer.

---

## Deploy

Hosting is **AWS S3 (private) + CloudFront** with a DNS-validated ACM
certificate, deployed by **GitHub Actions over OIDC** (no static AWS keys).
DNS is managed in **Cloudflare**.

See **[DEPLOY.md](DEPLOY.md)** for the full, copy-pasteable runbook:

1. `terraform apply` the infrastructure (via the `edulab-terraform` aws-vault profile — `mountain-terraform` deliberately cannot create IAM roles)
2. Add the ACM validation + site CNAME records to Cloudflare (managed as code in `mountain-infra/terraform/cloudflare`)
3. Set the edu-lab repo **Variables** (`AWS_ACCOUNT_ID`, `S3_BUCKET`, `CLOUDFRONT_ID`, `AWS_REGION`) from `terraform output`
4. `git push` to `main` — CI deploys automatically via OIDC

---

## License

MIT — see [LICENSE](LICENSE). Copyright © 2026 Chris Gallagher.
