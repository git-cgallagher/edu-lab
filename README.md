# edu-lab

> **Printable worksheets for curious kids, in seconds.**

A fast, free educational worksheet generator for grades K–5. Pick a grade,
subject, and theme — get a clean, print-ready worksheet (plus answer key) in
your browser. No accounts, no tracking, no build step.

---

## Brand

| | |
|---|---|
| **Name** | edu-lab |
| **Tagline** | Printable worksheets for curious kids, in seconds. |
| **Audience** | Parents & teachers of grades K–5 |
| **Palette** | Sunshine Yellow `#FFC93C` · Sky Blue `#3DA5D9` on Cloud White `#FAFAF5` |
| **Font** | [Baloo 2](https://fonts.google.com/specimen/Baloo+2) (display) · system sans (body) |
| **Domain** | `edulab.appalachiancloud.com` |

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
├── index.html              # App entry — the whole UI
├── styles.css              # Brand + layout stylesheet
├── print.css               # Print-only stylesheet (worksheet layout)
├── app.js                  # App bootstrap & DOM wiring
│
├── src/                    # Worksheet logic (plain ES modules)
│   ├── generators/         # Pure worksheet generators by subject
│   │   ├── math.js
│   │   ├── language-arts.js
│   │   ├── reading.js
│   │   └── stem.js
│   ├── renderers.js        # Generator output → printable HTML
│   ├── themes.js           # Theme metadata + word banks
│   └── utils.js            # Helpers (random, escHtml, etc.)
│
├── assets/                 # Static images / line art / fonts
│
├── tests/                  # Optional unit tests (if present)
│
├── terraform/              # Infrastructure as code (S3 + CloudFront + OIDC)
│   └── ...
│
├── .github/
│   ├── workflows/
│   │   ├── ci.yml          # CI/CD: test on PR, deploy on push to main
│   │   └── codeql.yml      # CodeQL security scanning
│   └── dependabot.yml      # Weekly dependency updates
│
├── DEPLOY.md               # Deploy runbook (Terraform → Cloudflare → GitHub → push)
├── LICENSE
└── README.md               # This file
```

---

## Deploy

Hosting is **AWS S3 (private) + CloudFront** with a DNS-validated ACM
certificate, deployed by **GitHub Actions over OIDC** (no static AWS keys).
DNS is managed in **Cloudflare**.

See **[DEPLOY.md](DEPLOY.md)** for the full, copy-pasteable runbook:

1. `terraform apply` the infrastructure (via the `mountain-terraform` aws-vault profile)
2. Add the ACM validation + site CNAME records in Cloudflare
3. Create the GitHub repo and set repo **Variables** (`AWS_ACCOUNT_ID`, `S3_BUCKET`, `CLOUDFRONT_ID`)
4. `git push` to `main` — CI deploys automatically

---

## License

MIT — see [LICENSE](LICENSE). Copyright © 2026 Chris Gallagher.
