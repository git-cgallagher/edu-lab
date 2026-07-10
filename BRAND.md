# BRAND.md — the Appalachian Cloud brand family

> Canonical brand spec for the **Appalachian Cloud** family and its **LessonsAtHome**
> child product. This file is the authoritative written spec; the authoritative
> *implementation* is the token block in **`styles.css :root`** (this repo) and
> **`assets/css/main.css` `--color-accent`** (the `ace-site` repo). There is no
> shared build — each repo hand-mirrors the values, and drift is caught by diffing
> hex. Update this file in the **same PR** as any brand change.
>
> `~/Code/BRAND.md` (if present) is a **non-authoritative local pointer** only
> (`~/Code` is not a git repo, so nothing there is reproducible from a repo).

---

## 1. Brand architecture — three tiers

The estate is a single **endorsed sub-brand** family, not one brand and not two
unrelated ones.

| Tier | Name | Appears on |
|---|---|---|
| **Family / umbrella** | **Appalachian Cloud** | Endorsement signature + marketing only. It has **no standalone site**. |
| **Legal entity / B2B brand** | **Appalachian Cloud Engineering, LLC** (short: **ACE**) | B2B surfaces only (`ace-site`, contracts, copyright holder). |
| **Child product** | **LessonsAtHome** *(display only; repo/infra stay `edu-lab`/`edulab`)* | The education tool only. |

**Rules**
- Never write bare **"Appalachian Cloud"** as a *company* — it is the family
  signature, not a legal entity.
- **"ACE" is forbidden on any education surface.** A K–5 parent must never see the
  consultancy acronym.
- The endorsement links the **primary `.co`** domain (`https://appalachiancloud.co`),
  never `.com` (`.com` is redirect-only).
- Endorsement signature wording: **"an Appalachian Cloud project"**.

---

## 2. Voice contract

| Brand | Grammatical person | Tone |
|---|---|---|
| **ACE** (consultancy) | first person **"I"** | plain, senior, understated, no hype ("No unnecessary complexity.") |
| **LessonsAtHome** | **"we" / "the project"** — never "I", **never "ACE"** | warm, encouraging, concrete, jargon-free |

**Shared:** honest, no dark patterns. The *no-tracking / no-account* claims must
stay **literally true**. Support copy says **"support" / "tip"** — never
**"donate"** (Appalachian Cloud Engineering is an LLC, not a 501(c)(3); tips are
not tax-deductible).

---

## 3. Color system

**Principle:** *Brand hue is never the sole signal. Decorative tokens are never
used for text, focus rings, or essential borders.*

All estate blues sit in one hue family — **hue ~196–208°** — so ACE slate and the
LessonsAtHome sky read as relatives (Sky `#3DA5D9` = 200.0°, ACE accent-light
`#2e86c1` = 204.1°, a ~4° spread). That shared hue is the visual thread between the
two skins; the accent *value* and display type stay deliberately different.

### LessonsAtHome tokens (`edu-lab/styles.css :root`)

| Token | Hex | Role | Contrast on `#FAFAF5` |
|---|---|---|---|
| `--bg` | `#FAFAF5` | page background (Cloud White) | — |
| `--ink` | `#172A38` | body text | 14.1:1 (AAA) |
| `--label` | `#33414F` | form labels / chrome | ~10:1 (AAA) |
| `--muted` | `#5C6773` | secondary text | 5.5:1 (AA) |
| `--accent` | `#1F6FA5` | links / buttons / answers | 5.2:1; 5.4:1 white-on (AA) |
| `--accent-d` | `#155A87` | hover | 7.4:1 white-on (AAA) |
| `--sky` | `#3DA5D9` | **decoration only** | 2.65:1 — **fails as text** |
| `--sun` | `#FFC93C` | **fill only**, pair with `--ink` | 1.47:1 alone — **fails as text** |

### ACE tokens (`ace-site/assets/css/main.css`) — reference

`--color-accent: #1a5276` (Deep Appalachian slate, 8.4:1 on white),
`--color-accent-light: #2e86c1`, `--color-accent-dark: #0e2e42`.
**Known trap — do not inherit:** `.hero__eyebrow` uses `#2e86c1` at 14px/600 =
3.97:1 (sub-AA). Fix if touched; never copy the pattern.

**A recolor is only partial if it stops at `:root`.** Also update: the word-search
hit (`styles.css .wsgrid td.wshit`), `themes.css` `var(--accent, …)` fallbacks,
`app.js` inline-SVG fills (fraction bars, geometry, clock hand), and the inline SVG
favicon in `index.html`. Gate: `grep -rn '2563eb|1d4ed8|f4f6fb|eef2ff|bfdbfe'`
over shipped `css/js/html` returns nothing.

---

## 4. Brandmark

One shared **cloud glyph** is the family mark, in two skins:
- **LessonsAtHome** — sky (`#3DA5D9`) tile + a sunshine accent + white cloud.
- **ACE** — slate (`#1a5276`) tile + white cloud, no sun.

Store the canonical glyph here (once implemented) with `fill="currentColor"` on the
cloud group so it can be reused in-DOM (e.g. `ace-site .site-nav__logo`). Until then
the LessonsAtHome favicon is an inline SVG "A" mark on a sky tile (`index.html`),
which preserves the zero-third-party / `img-src 'self' data:` invariant.

---

## 5. Typography

- **ACE:** Inter (sans) + Lora (serif), loaded via Google Fonts (`ace-site` accepts
  a CDN; this is **not** a precedent for edu-lab).
- **LessonsAtHome:** system sans body; a **rounded display stack**
  (`ui-rounded, "SF Pro Rounded", "Baloo 2", system-ui`) for the app title.
  *Open ADR:* self-host a subset **Baloo 2** `.woff2` (display-only) to ship a
  committed rounded identity on all platforms. The CSP already allows it
  (`font-src 'self' data:`), so it is a content-only deploy — no Terraform. Caveat:
  the CI `?v=<sha>` rewrite only versions `.css`/`.js` refs in `index.html`, not a
  `url()` inside CSS, so a self-hosted font ships immutable on an unversioned name —
  bump the *filename* (`baloo2-v2.woff2`) to change glyphs later.

---

## 6. Ownership & support

- **Copyright holder** across the family: **Appalachian Cloud Engineering, LLC**.
- **Support platforms** (when live): Ko-fi one-time tip for LessonsAtHome (guest
  checkout, family audience); GitHub Sponsors reserved for ACE's developer audience.
  Never re-enable a support link until its URL returns HTTP 200 logged-out.

---

## 7. Intentional asymmetries — do NOT normalize

- ACE loads web fonts from a CDN; **edu-lab forbids all third-party requests.**
- The ACE logo is a Ghost Admin asset (`@site.logo`), never a committed file.
- Accent value + display typeface + voice differ **on purpose** — the shared hue
  family, the endorsement signature, and this spec are what make them one family.

---

## 8. Open questions (non-blocking)

- Wordmark: keep CamelCase **LessonsAtHome** vs spaced "Lessons at Home"?
  (Decision to date: CamelCase.)
- Ship the self-hosted Baloo 2 `.woff2` (see §5 ADR).
