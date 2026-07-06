variable "aws_region" {
  description = "AWS region for all resources. CloudFront + ACM certs for CloudFront must be us-east-1."
  type        = string
  default     = "us-east-1"
}

variable "domain_name" {
  description = "Custom domain for the site. DNS is managed in Cloudflare (see DEPLOY.md)."
  type        = string

  default = "edulab.appalachiancloud.co"
}

variable "enable_custom_domain" {
  description = <<-EOT
    Two-phase custom-domain switch (DNS is manual in Cloudflare, so the ACM cert
    can't validate before the first apply):
      false — CloudFront serves the default *.cloudfront.net cert with no aliases.
              Set this ONLY for the very FIRST apply of a brand-new distribution
              (before the ACM cert is Issued); it provisions immediately and emits
              acm_validation_records.
      true (default) — attach the custom domain alias + validated ACM cert. This is
              the STEADY STATE, and the default: the live site is already launched on
              edulab.appalachiancloud.co with the ACM cert Issued. It defaults to true
              because there is NO committed tfvars to hold this toggle — defaulting to
              false previously caused every subsequent `terraform plan/apply` to
              silently revert the live custom domain to the default cert + TLSv1.
              Only flip to false for a genuine from-scratch re-bootstrap.
  EOT
  type        = bool
  default     = true
}

variable "github_repo" {
  description = "GitHub repository in owner/repo form. Scopes the OIDC deploy role trust policy."
  type        = string
  default     = "git-cgallagher/edu-lab"
}

variable "tags" {
  description = "Tags applied to all resources."
  type        = map(string)
  default = {
    Project   = "edulab"
    ManagedBy = "terraform"
  }
}
