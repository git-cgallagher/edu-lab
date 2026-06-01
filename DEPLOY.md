# Deploying edu-lab

This is the end-to-end runbook to stand up hosting and wire up CI/CD.

**Architecture:** private **S3** bucket → **CloudFront** (Origin Access Control)
→ **ACM** cert (DNS-validated) → custom domain. **GitHub Actions** deploys over
**OIDC** (no static AWS keys). **DNS is managed in Cloudflare** (per
mountain-infra), so the ACM validation records and the site CNAME are added in
the Cloudflare dashboard by hand.

> **All commands below run on YOUR machine** — you hold the AWS credentials
> (via aws-vault) and the GitHub credentials. Nothing here runs in CI except
> the final deploy, which is triggered by `git push`.

> **Domain:** `edulab.appalachiancloud.co`. This requires the
> `appalachiancloud.co` zone to exist in Cloudflare (the other ACE sites use
> `.com`/`.net`). If the `.co` zone is not set up yet, add it in Cloudflare
> first, or change `domain_name` in `terraform/variables.tf` back to a zone you
> already control **before** step 1.

---

## Prerequisites

- [aws-vault](https://github.com/99designs/aws-vault) configured with **two**
  profiles:
  - `mountain-admin` (or your admin IAM user) — to apply `aws-account-baseline`,
    which creates the edu-lab execution role.
  - `edulab-terraform` — assumes
    `arn:aws:iam::651120422878:role/edulab-terraform` (created by the baseline,
    below). This is the role that applies THIS stack — `mountain-terraform`
    deliberately cannot create IAM roles, which is why the first apply failed
    with `iam:CreateRole ... AccessDenied`.
- [Terraform](https://developer.hashicorp.com/terraform) >= 1.10 (S3-native
  state locking).
- The [GitHub CLI](https://cli.github.com/) (`gh`) or dashboard access for
  `git-cgallagher`.
- Access to the **Cloudflare** dashboard for the site's zone.

### One-time: create the edu-lab execution role

The edu-lab stack needs its own least-privilege Terraform identity (one exec
role per stack, matching `boss-bos-terraform`). It is defined in
`aws-account-baseline/terraform/edulab-terraform.tf`. Apply the baseline as your
**admin** user:

```bash
cd ../aws-account-baseline/terraform   # adjust path to the baseline repo
aws-vault exec mountain-admin -- terraform init
aws-vault exec mountain-admin -- terraform apply   # creates role: edulab-terraform
aws-vault exec mountain-admin -- terraform output -raw edulab_terraform_role_arn
```

Add an aws-vault profile that assumes it (in `~/.aws/config`):

```ini
[profile edulab-terraform]
source_profile = personal
role_arn       = arn:aws:iam::651120422878:role/edulab-terraform
```

Sanity check before applying the app stack:

```bash
aws-vault exec edulab-terraform -- aws sts get-caller-identity
# Expect account 651120422878, assumed-role/edulab-terraform
```

---

## Step 1 — Provision infrastructure with Terraform (phase 1)

The shared S3 state backend (`appalachiancloud-tfstate-651120422878`) is
provisioned by aws-account-baseline with **S3-native locking** (no DynamoDB
table), so `init` just connects to it.

Run the app stack with the **edulab-terraform** role (NOT mountain-terraform):

```bash
cd terraform

# (optional) override defaults
cp terraform.tfvars.example terraform.tfvars   # then edit if needed

aws-vault exec edulab-terraform -- terraform init -reconfigure
aws-vault exec edulab-terraform -- terraform plan
aws-vault exec edulab-terraform -- terraform apply
```

> **Two-phase domain.** The default `enable_custom_domain = false` makes this
> first apply provision CloudFront with the default `*.cloudfront.net`
> certificate — so it succeeds immediately even though the ACM cert is still
> `PENDING_VALIDATION`. The cert is still created, so you can read its validation
> records. You attach the custom domain in **Step 2a → phase 2** once the cert is
> Issued. (This avoids the `InvalidViewerCertificate` failure you get if
> CloudFront references an unvalidated cert.)

After apply, capture the outputs — you need them in steps 2 and 3:

```bash
aws-vault exec edulab-terraform -- terraform output

# Targeted reads:
aws-vault exec edulab-terraform -- terraform output -raw s3_bucket
aws-vault exec edulab-terraform -- terraform output -raw cloudfront_id
aws-vault exec edulab-terraform -- terraform output -raw cloudfront_domain_name
aws-vault exec edulab-terraform -- terraform output -raw aws_account_id
aws-vault exec edulab-terraform -- terraform output -json acm_validation_records
```

---

## Step 2 — Custom domain (DNS + phase 2)

DNS lives in **Cloudflare**, not Route53. The zone must be `appalachiancloud.co`
(the site domain). Add the records below in that zone.

### 2a. ACM validation record(s)

From `terraform output -json acm_validation_records`, for each entry create a
**CNAME** record:

| Field | Value |
|-------|-------|
| Type | `CNAME` (matches `type`) |
| Name | the `name` value (strip the trailing zone suffix if Cloudflare appends it automatically) |
| Target | the `value` value |
| Proxy status | **DNS only** (grey cloud) — validation records must NOT be proxied |

Wait until the ACM cert shows **Issued** in the ACM console (us-east-1).

### 2b. Phase 2 — attach the custom domain

Now that the cert is Issued, flip the switch and re-apply so CloudFront picks up
the alias + validated cert:

```bash
aws-vault exec edulab-terraform -- terraform apply -var enable_custom_domain=true
```

(Or set `enable_custom_domain = true` in `terraform.tfvars` to make it permanent,
then `terraform apply`.)

### 2c. Site record

Point the site hostname at CloudFront, using `cloudfront_domain_name`:

| Field | Value |
|-------|-------|
| Type | `CNAME` |
| Name | `edulab` (i.e. `edulab.appalachiancloud.co`) |
| Target | the `cloudfront_domain_name` output (e.g. `dxxxx.cloudfront.net`) |
| Proxy status | **DNS only** (grey cloud) recommended, so CloudFront serves the ACM cert directly |

---

## Step 3 — Create the GitHub repo and set repo Variables

Create the repository under the `git-cgallagher` org:

```bash
# With the GitHub CLI:
gh repo create git-cgallagher/edu-lab --public --source . --remote origin
# (or create it in the dashboard and add the remote in step 4)
```

Set the three required repo **Variables** (Settings → Secrets and variables →
Actions → **Variables**) from the Terraform outputs. The CI workflow reads these
as `${{ vars.* }}` and builds the deploy role ARN from `AWS_ACCOUNT_ID`:

```bash
gh variable set AWS_ACCOUNT_ID --repo git-cgallagher/edu-lab \
  --body "$(aws-vault exec edulab-terraform -- terraform -chdir=terraform output -raw aws_account_id)"

gh variable set S3_BUCKET --repo git-cgallagher/edu-lab \
  --body "$(aws-vault exec edulab-terraform -- terraform -chdir=terraform output -raw s3_bucket)"

gh variable set CLOUDFRONT_ID --repo git-cgallagher/edu-lab \
  --body "$(aws-vault exec edulab-terraform -- terraform -chdir=terraform output -raw cloudfront_id)"
```

These should resolve to:

| Variable | Value |
|----------|-------|
| `AWS_ACCOUNT_ID` | `651120422878` |
| `S3_BUCKET` | `appalachiancloud-edulab-site` |
| `CLOUDFRONT_ID` | (the distribution ID from terraform) |

> These are repo **Variables**, not Secrets — they are non-sensitive. There are
> **no AWS keys** anywhere; the deploy role is assumed via OIDC.

---

## Step 4 — Push to main to deploy

```bash
git init                       # if not already a repo
git add .
git commit -m "Initial edu-lab scaffold"
git branch -M main
git remote add origin git@github.com:git-cgallagher/edu-lab.git   # skip if `gh repo create` added it
git push -u origin main
```

The push to `main` triggers `.github/workflows/ci.yml`:

1. **build-test** — `node --check` on every JS file (+ optional `npm test`).
2. **deploy** — assumes `appalachiancloud-edulab-github-deploy` via OIDC,
   `aws s3 sync`s the static files to the bucket, and invalidates CloudFront.

Watch it:

```bash
gh run watch --repo git-cgallagher/edu-lab
```

Then visit **https://edulab.appalachiancloud.co**.

---

## Security follow-ups (TODO)

These are non-blocking but should be tightened before this is a long-lived
production site:

- **Scope the OIDC deploy role to `main` only.** The role trust in
  `terraform/main.tf` currently allows `repo:git-cgallagher/edu-lab:*` (any
  branch, tag, or PR can assume the deploy role). CI only deploys on push to
  `main`, so the effective surface is unchanged, but for defense-in-depth change
  the trust condition's subject to
  `repo:git-cgallagher/edu-lab:ref:refs/heads/main` (matching the
  bill-of-sale-generator pattern), then `terraform apply`.
- **Confirm bucket encryption.** Current config uses SSE-S3 (AES256). Switch to
  the shared KMS CMK (`alias/appalachiancloud-audit`) if you want CMK-managed
  encryption consistent with the rest of the account.

---

## Teardown

```bash
cd terraform
aws-vault exec edulab-terraform -- terraform destroy
```

Remember to remove the Cloudflare DNS records (validation + site CNAME) manually,
since Terraform does not manage Cloudflare DNS here.
