# Security policy

This project is a browser-local synthetic reference workbench. It is not designed to hold secrets, private keys, customer data or production financial records.

## Reporting

For a suspected security issue, use GitHub's private vulnerability reporting for this repository when available. Do not include real credentials, private URLs, customer data or exploit payloads in public issues.

## Scope

The application has no backend or external API credentials. Browser-local workspaces are user-controlled and should be treated as untrusted input when imported. Report parser, download, dependency or domain-invariant issues with a minimal synthetic reproduction.


## SaaS security baseline (under development)

The SaaS implementation adds Supabase Auth, organisation membership, PostgreSQL Row Level Security, role-based assessment writes, database-generated audit events and a server-side invitation function. See [SaaS architecture and deployment](docs/saas-architecture.md).

These controls are a security baseline, not a production security certification. Browser session tokens are stored in local storage in this first implementation. Assessment decisions are computed by the browser engine and submitted as versioned snapshots; the database records what was submitted but does not independently recompute or attest the decision. Audit events are append-only through application privileges and triggers, but are not cryptographically tamper-evident against privileged database operators.

Do not enable this mode for confidential or regulated institutional data until the deployment checklist, independent review, identity controls, backup/restore, monitoring, data residency, retention and incident response controls are completed.
