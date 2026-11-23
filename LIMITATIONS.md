# Product boundaries and limitations

## Implemented

- Browser-local architecture workspaces with import, export and synthetic lifecycle simulations.
- Deterministic use-case decision evaluation for tokenised bonds, fund units, private credit and collateral.
- Optional Supabase Auth and organization-scoped SaaS mode with owner, admin, editor, reviewer and viewer roles.
- Tenant-scoped assessment records with server-side deterministic recomputation and version metadata.
- Draft, in-review, approved and rejected assessment workflow with independent reviewer separation.
- Database-generated append-only audit events for assessment and invited-membership changes.
- Server-side email invitations through Supabase Auth Edge Functions.

## SaaS preview limitations

- A Supabase project must be provisioned, the migration applied, Edge Functions deployed, Auth configured and Vercel environment variables set. The existing public URL remains a synthetic demo until these steps are completed.
- The SaaS release checklist is not complete. There is no independent security review, penetration test, backup restore evidence, production monitoring or service-level commitment.
- Supabase Auth sessions are stored in browser local storage in this implementation. Treat the application as unsuitable for confidential or regulated institutional records until the security review accepts this design or replaces it.
- Audit events are append-only through application privileges and database triggers; a privileged database operator can alter them. They are not cryptographically tamper-evident or externally retained.
- Organization member lifecycle is limited: there is no in-product role change, invitation revocation, member removal, organization deletion, account deletion or access request workflow.
- There is no billing, subscription management, usage metering, enterprise SSO, enforced MFA, SCIM, customer support operation or custom domain.
- Evidence attachments, external immutable audit export, legal hold, tenant-specific data residency, contractual retention controls and organization-level backups are not implemented in the application.
- Auth email deliverability, rate limits, recovery settings, data region, retention and backup policies depend on operator configuration.

## Synthetic and simplified finance model

- Participants, balances, eligibility, identifiers and scenario evidence are fictional unless supplied by the user as design inputs.
- Coupon calculations use integer minor units and per-holder floor rounding.
- Scenario recovery guidance is deterministic text, not an incident runbook for a live institution.
- Atomic settlement is a configuration compatibility classification; no settlement protocol is implemented.
- No banking, payment, transfer-agent, trading, DLT, custodian, HSM or MPC adapter or cryptographic service is connected.
- The tool does not determine legal title, insolvency treatment, regulatory classification, compliance, legal finality or production suitability.
- Economic inputs must be finite and non-negative; invalid values are omitted from comparisons. Deterioration tolerances are percentages clamped to 0–1,000%. A zero-to-positive change is treated as an increase from zero and is material at any tolerance. The selected primary objective must improve; tolerances never waive that requirement. These safeguards do not validate whether entered assumptions are true or economically complete.
- Sensitivity results are counterfactuals. They may explore an assumption under a simulated evidence gate and do not verify, upgrade or establish evidence.
- Collateral lifecycle actions and failure cases run against isolated synthetic state. Their event history demonstrates modeled control behavior; it is not a custody, payment, legal register or settlement record.

Do not use results as production architecture approval, legal advice, operational assurance, regulatory clearance or a financial recommendation. Do not store confidential, customer, investor, account or transaction data in the SaaS preview.

## Current public deployment

The public Vercel URL is a synthetic product demonstration. It is not the configured multi-tenant SaaS service: Supabase provisioning, migrations, Auth settings, Edge Function deployment and Vercel environment configuration are prerequisites for SaaS mode. See [deployment status](docs/deployment-status.md) for the verified release boundary. The demo has no production financial integrations, security review, service-level commitment or institutional adoption claim.
