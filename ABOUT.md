# About TokenOps Studio

TokenOps Studio helps institutional teams decide where tokenisation can improve a financial workflow, define a bounded pilot, and document the architecture and controls around it. The workbench combines synthetic lifecycle simulation with a cloud workspace for organisation-scoped assessments, independent review and audit history.

## Product workflows

- Assess tokenised bond, fund-unit, private-credit and collateral workflows against operational evidence, alternatives and readiness gates.
- Configure asset, cash, custody, settlement, integration and governance assumptions.
- Inspect deterministic control findings with evidence, impacts and remediation guidance.
- Rehearse synthetic issuance, funding, subscription, delivery-versus-payment, coupon, redemption and reconciliation flows.
- Run 14 reproducible baseline and exception scenarios.
- Compare architecture workspaces and export JSON, Markdown and CSV decision materials.
- Save assessments to an organisation-scoped cloud workspace, invite colleagues by email and use editor, reviewer, viewer and administrator roles.
- Complete invited-account setup by setting a password; request a password reset from the sign-in screen.
- Submit assessments for independent review and retain review comments and database-generated audit events.

## Runtime and status

The application uses React, TypeScript and Vite. Supabase Auth, Postgres row-level security and Edge Functions provide the optional SaaS mode. Local mode remains available without cloud credentials. Enabling SaaS mode requires a provisioned Supabase project, the supplied database migration, deployed Edge Functions, configured authentication and Vercel environment variables. The public deployment and SaaS configuration are not represented as production-ready until those deployment steps and the release checklist are complete.

Vishnu Govind is the author. Attribution does not imply a client engagement, institutional adoption, endorsement or deployment.

## Product boundaries

Architecture analysis and lifecycle results use synthetic or user-provided design inputs. The product does not connect to banking, custody, payment, transfer-agent, trading or DLT systems. It does not determine legal ownership, regulatory status, compliance or production suitability. See [LIMITATIONS.md](LIMITATIONS.md), [SECURITY.md](SECURITY.md) and [docs/saas-architecture.md](docs/saas-architecture.md).
