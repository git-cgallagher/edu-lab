output "s3_bucket" {
  description = "S3 origin bucket name. Set this as the GitHub repo VARIABLE 'S3_BUCKET'."
  value       = aws_s3_bucket.site.bucket
}

output "cloudfront_id" {
  description = "CloudFront distribution ID. Set this as the GitHub repo VARIABLE 'CLOUDFRONT_ID'."
  value       = aws_cloudfront_distribution.site.id
}

output "github_deploy_role_arn" {
  description = "ARN of the OIDC deploy role assumed by GitHub Actions. The workflow builds this ARN from the 'AWS_ACCOUNT_ID' repo VARIABLE; this output lets you confirm it matches."
  value       = aws_iam_role.github_deploy.arn
}

output "aws_account_id" {
  description = "AWS account ID. Set this as the GitHub repo VARIABLE 'AWS_ACCOUNT_ID'."
  value       = data.aws_caller_identity.current.account_id
}

output "cloudfront_domain_name" {
  description = "CloudFront *.cloudfront.net domain. Create a CNAME in Cloudflare from your custom domain to this value."
  value       = aws_cloudfront_distribution.site.domain_name
}

output "acm_validation_records" {
  description = "DNS validation records for the ACM cert. Add each of these as a CNAME in Cloudflare to validate the certificate (see DEPLOY.md)."
  value = [
    for o in aws_acm_certificate.site.domain_validation_options : {
      name  = o.resource_record_name
      type  = o.resource_record_type
      value = o.resource_record_value
    }
  ]
}
