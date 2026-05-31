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

> **Domain note:** the default domain is `edulab.appalachiancloud.com` (.com).
> If you actually intended the `.co` TLD, change `domain_name` in
> `terraform/variables.tf` (or set it in `terraform.tfvars`) **before** step 1.

---

## Prerequisites

- [aws-vault](https://github.com/99designs/aws-vault) configured with the
  `mountain-terraform` profile (see the mountain-infra README — it assumes
  `arn:aws:iam::651120422878:role/appalachiancloud-mountain-terraform`).
- [Terraform](https://developer.hashicorp.com/terraform) >= 1.5.
- The [GitHub CLI](https://cli.github.com/) (`gh`) or dashboard access for
  `git-cgallagher`.
- Access to the **Cloudflare** dashboard for `appalachiancloud.com`.

Sanity check your AWS profile first:

```bash
aws-vault exec mountain-terraform -- aws sts get-caller-identity
# Expect account 651120422878
```

---

## Step 1 — Provision infrastructure with Terraform

The shared S3 state backend (`appalachiancloud-tfstate-651120422878`) is
provisioned by aws-account-baseline, so `init` just connects to it.

```bash
cd terraform

# (optional) override defaults
cp terraform.tfvars.example terraform.tfvars   # then edit if needed

aws-vault exec mountain-terraform -- terraform init
aws-vault exec mountain-terraform -- terraform plan
aws-vault exec mountain-terraform -- terraform apply
```

After apply, capture the outputs — you need them in steps 2 and 3:

```bash
aws-vault exec mountain-terraform -- terraform output

# Targeted reads:
aws-vault exec mountain-terraform -- terraform output -raw s3_bucket
aws-vault exec mountain-terraform -- terraform output -raw cloudfront_id
aws-vault exec mountain-terraform -- terraform output -raw cloudfront_domain_name
aws-vault exec mountain-terraform -- terraform output -raw aws_account_id
aws-vault exec mountain-terraform -- terraform output -json acm_validation_records
```

> The first `apply` will pause CloudFront until the ACM cert is **issued**.
> The cert stays in `PENDING_VALIDATION` until you complete step 2 — that's
> expected. You may need to `terraform apply` once more after the cert validates
> so CloudFront finishes provisioning with the issued certificate.

---

## Step 2 — Add DNS records in Cloudflare

DNS for `appalachiancloud.com` lives in **Cloudflare**, not Route53. Add two
kinds of records in the Cloudflare dashboard (zone: `appalachiancloud.com`):

### 2a. ACM validation record(s)

From `terraform output -json acm_validation_records`, for each entry create a
**CNAME** record:

| Field | Value |
|-------|-------|
| Type | `CNAME` (matches `type`) |
| Name | the `name` value (strip the trailing `.appalachiancloud.com` if Cloudflare appends the zone automatically) |
| Target | the `value` value |
| Proxy status | **DNS only** (grey cloud) — validation records must NOT be proxied |

Wait until the ACM cert shows **Issued** (re-run `terraform apply` if needed).

### 2b. Site record

Point the site hostname at CloudFront, using `cloudfront_domain_name`:

| Field | Value |
|-------|-------|
| Type | `CNAME` |
| Name | `edulab` (i.e. `edulab.appalachiancloud.com`) |
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
  --body "$(aws-vault exec mountain-terraform -- terraform -chdir=terraform output -raw aws_account_id)"

gh variable set S3_BUCKET --repo git-cgallagher/edu-lab \
  --body "$(aws-vault exec mountain-terraform -- terraform -chdir=terraform output -raw s3_bucket)"

gh variable set CLOUDFRONT_ID --repo git-cgallagher/edu-lab \
  --body "$(aws-vault exec mountain-terraform -- terraform -chdir=terraform output -raw cloudfront_id)"
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

Then visit **https://edulab.appalachiancloud.com**.

---

## Teardown

```bash
cd terraform
aws-vault exec mountain-terraform -- terraform destroy
```

Remember to remove the Cloudflare DNS records (validation + site CNAME) manually,
since Terraform does not manage Cloudflare DNS here.
