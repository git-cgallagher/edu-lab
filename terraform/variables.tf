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
      false (default) — CloudFront serves the default *.cloudfront.net cert with
                        no aliases. Use for the FIRST apply; it provisions
                        immediately and emits acm_validation_records.
      true            — attach the custom domain alias + validated ACM cert.
                        Set this AFTER the cert shows Issued in ACM, then re-apply.
  EOT
  type        = bool
  default     = false
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
