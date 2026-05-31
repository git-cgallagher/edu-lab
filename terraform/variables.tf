variable "aws_region" {
  description = "AWS region for all resources. CloudFront + ACM certs for CloudFront must be us-east-1."
  type        = string
  default     = "us-east-1"
}

variable "domain_name" {
  description = "Custom domain for the site. DNS is managed in Cloudflare (see DEPLOY.md)."
  type        = string

  # NOTE: change to .co here if intended — default is the .com domain.
  default = "edulab.appalachiancloud.com"
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
