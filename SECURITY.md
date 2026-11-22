# Security policy

TokenOps Studio includes a synthetic local workbench and an optional SaaS preview. It is not currently approved for confidential, personal, commercially sensitive or regulated institutional data.

## Reporting

Use GitHub's private vulnerability reporting for this repository when available. Do not include credentials, private URLs, customer data or exploit payloads in public issues.

## SaaS security controls

- Supabase Auth authenticates users; Edge Functions validate caller JWTs and enforce organization roles before privileged writes.
- PostgreSQL Row Level Security scopes organization, membership, assessment and audit queries.
- The server recomputes use-case decisions before saving an assessment. Browser-provided decisions are not authoritative.
- Independent reviewers cannot approve or reject assessments they created or last updated.
- Database triggers create versioned audit events. Application database roles cannot update or delete those events.
- The service-role key is used only by server-side Edge Functions and must never be exposed to the browser.

These controls are a security baseline, not production certification. Browser sessions are stored in local storage. Audit events are not tamper-evident against privileged database operators. The project has not completed independent threat modeling, penetration testing, restore exercises, alerting and incident response validation, identity hardening or institutional data-protection review.

Complete the [SaaS release validation checklist](docs/saas-validation-checklist.md) and obtain independent review before handling sensitive data. See [SaaS architecture and deployment](docs/saas-architecture.md) and [product limitations](LIMITATIONS.md).
