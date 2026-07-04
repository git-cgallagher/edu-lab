###############################################################################
# edu-lab infrastructure
#
# A NO-BUILD static site hosted on a PRIVATE S3 bucket fronted by CloudFront
# (Origin Access Control), served over HTTPS via a DNS-validated ACM cert.
# GitHub Actions deploys over OIDC (no static AWS keys).
#
# Naming convention (per mountain-infra): appalachiancloud-{project}-{resource}
#   project slug = "edulab"
#
# DNS NOTE: per mountain-infra, DNS for appalachiancloud.com is managed in
# Cloudflare (NOT Route53). This config does NOT create DNS records. Terraform
# emits the ACM validation record(s) and the CloudFront target as outputs; you
# add the CNAME/validation records in Cloudflare by hand. See DEPLOY.md.
###############################################################################

terraform {
  required_version = ">= 1.10.0" # S3-native state locking (use_lockfile)

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Shared S3 backend provisioned by aws-account-baseline (see mountain-infra).
  # State is keyed per project under the shared bucket.
  # NOTE: this account uses S3-native locking (use_lockfile, Terraform >= 1.10).
  # The old DynamoDB lock table was removed — do NOT add dynamodb_table here.
  backend "s3" {
    bucket       = "appalachiancloud-tfstate-651120422878"
    key          = "edulab/terraform.tfstate"
    region       = "us-east-1"
    encrypt      = true
    kms_key_id   = "alias/appalachiancloud-audit"
    use_lockfile = true
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = var.tags
  }
}

data "aws_caller_identity" "current" {}

###############################################################################
# S3 — private origin bucket (public access fully blocked)
###############################################################################

resource "aws_s3_bucket" "site" {
  bucket = "appalachiancloud-edulab-site"
}

resource "aws_s3_bucket_public_access_block" "site" {
  bucket = aws_s3_bucket.site.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "site" {
  bucket = aws_s3_bucket.site.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "site" {
  bucket = aws_s3_bucket.site.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Bucket policy: allow ONLY this CloudFront distribution (via OAC) to read.
data "aws_iam_policy_document" "site_bucket_policy" {
  statement {
    sid       = "AllowCloudFrontServicePrincipalReadOnly"
    effect    = "Allow"
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.site.arn}/*"]

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.site.arn]
    }
  }
}

resource "aws_s3_bucket_policy" "site" {
  bucket = aws_s3_bucket.site.id
  policy = data.aws_iam_policy_document.site_bucket_policy.json
}

###############################################################################
# ACM — DNS-validated certificate for the custom domain (must be us-east-1)
###############################################################################

resource "aws_acm_certificate" "site" {
  domain_name       = var.domain_name
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

# NOTE: There is intentionally no aws_acm_certificate_validation resource here.
# Validation records live in Cloudflare and are added by hand (see DEPLOY.md);
# the records to create are exposed via the acm_validation_records output.

###############################################################################
# CloudFront — Origin Access Control + distribution
###############################################################################

resource "aws_cloudfront_origin_access_control" "site" {
  name                              = "appalachiancloud-edulab-oac"
  description                       = "OAC for edu-lab static site bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "site" {
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  comment             = "edu-lab static site"

  # Custom-domain aliases are attached only once the ACM cert is validated
  # (see enable_custom_domain). First apply runs with the default CloudFront
  # cert so the distribution provisions immediately; flip the flag and re-apply
  # after the cert is Issued.
  aliases = var.enable_custom_domain ? [var.domain_name] : []

  origin {
    domain_name              = aws_s3_bucket.site.bucket_regional_domain_name
    origin_id                = "s3-edulab-site"
    origin_access_control_id = aws_cloudfront_origin_access_control.site.id
  }

  default_cache_behavior {
    target_origin_id       = "s3-edulab-site"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true

    # AWS managed "CachingOptimized" policy.
    cache_policy_id = "658327ea-f89d-4fab-a63d-7e88639e58f6"
  }

  # SPA-style fallback so deep links and a missing index resolve gracefully.
  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    # Phase 1 (enable_custom_domain = false): default *.cloudfront.net cert,
    # works without a validated ACM cert. Phase 2: the validated ACM cert.
    cloudfront_default_certificate = var.enable_custom_domain ? null : true
    acm_certificate_arn            = var.enable_custom_domain ? aws_acm_certificate.site.arn : null
    ssl_support_method             = var.enable_custom_domain ? "sni-only" : null
    minimum_protocol_version       = var.enable_custom_domain ? "TLSv1.2_2021" : null
  }
}

###############################################################################
# GitHub OIDC deploy role
#
# IMPORTANT: the GitHub OIDC provider already exists in this account (created by
# aws-account-baseline and also used by bill-of-sale-generator). Creating it
# again would fail with EntityAlreadyExists, so we LOOK IT UP with a data source
# instead of declaring an aws_iam_openid_connect_provider resource.
###############################################################################

# Look up by ARN (deterministic) rather than URL — the URL form requires
# iam:ListOpenIDConnectProviders which the scoped edulab-terraform role
# deliberately lacks. Only iam:GetOpenIDConnectProvider is needed here.
data "aws_iam_openid_connect_provider" "github" {
  arn = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:oidc-provider/token.actions.githubusercontent.com"
}

data "aws_iam_policy_document" "github_assume_role" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [data.aws_iam_openid_connect_provider.github.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    # Scope trust to this repository only (any branch/tag/PR).
    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:${var.github_repo}:*"]
    }
  }
}

resource "aws_iam_role" "github_deploy" {
  name               = "appalachiancloud-edulab-github-deploy"
  assume_role_policy = data.aws_iam_policy_document.github_assume_role.json
}

# Least-privilege deploy policy: S3 sync to the bucket + CloudFront invalidation.
data "aws_iam_policy_document" "github_deploy" {
  statement {
    sid    = "S3SyncSite"
    effect = "Allow"
    actions = [
      "s3:ListBucket",
      "s3:GetBucketLocation",
    ]
    resources = [aws_s3_bucket.site.arn]
  }

  statement {
    sid    = "S3ObjectReadWrite"
    effect = "Allow"
    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:DeleteObject",
    ]
    resources = ["${aws_s3_bucket.site.arn}/*"]
  }

  statement {
    sid    = "CloudFrontInvalidate"
    effect = "Allow"
    actions = [
      "cloudfront:CreateInvalidation",
      "cloudfront:GetInvalidation",
      "cloudfront:ListInvalidations",
    ]
    resources = [aws_cloudfront_distribution.site.arn]
  }
}

resource "aws_iam_role_policy" "github_deploy" {
  name   = "appalachiancloud-edulab-github-deploy"
  role   = aws_iam_role.github_deploy.id
  policy = data.aws_iam_policy_document.github_deploy.json
}
