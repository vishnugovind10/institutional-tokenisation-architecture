# SaaS architecture and deployment

## Product boundary

The SaaS edition turns the local decision workbench into an organisation-scoped assessment and governance workspace. It retains the existing deterministic TypeScript decision engine; it does not replace it with a generative model.

## Runtime

- **Web client:** existing React/Vite application.
- **Identity and data plane:** Supabase Auth and PostgreSQL.
- **Tenant boundary:** organisation membership plus PostgreSQL Row Level Security on every tenant-owned table.
- **Roles:** owner, admin, editor, reviewer and viewer. Only owner/admin/editor can create or update assessments.
- **Decision record:** title, use case, complete input snapshot, decision snapshot, engine version, record version and timestamps.
- **Audit:** database trigger writes a snapshot event on every assessment create/update; application roles cannot update/delete audit events.
- **Hosting:** Vercel static frontend; Supabase is a separately provisioned managed backend.

## Request path

`User -> Supabase Auth -> JWT -> RLS-protected PostgREST/RPC -> PostgreSQL`

The browser uses only the publishable/anon key. Tenant isolation is enforced by database policies, not by hiding UI controls. A user cannot gain access to another tenant by changing an organisation ID in a request.

## First-release scope

1. Email/password sign-up and sign-in.
2. First-user organisation creation.
3. Organisation selector for memberships already provisioned in Supabase.
4. Tenant-isolated assessment persistence and database-side audit events.
5. Deterministic decision snapshot versioning.
6. Read-only roles for reviewer/viewer.

## Required before a paid institutional deployment

- Enterprise SSO (SAML/OIDC), MFA enforcement, SCIM lifecycle and verified invitations.
- Admin UI for member lifecycle and role changes.
- Assessment review/approval workflow, sign-off identity, segregation of duties and policy versioning.
- Evidence attachment storage with malware scanning, encryption, retention and access logging.
- Audit export, external immutable/WORM retention, SIEM integration and legal hold.
- Tenant-specific data residency and contractual retention/deletion controls.
- Rate limiting, abuse monitoring, alerting, backup/restore tests and operational runbooks.
- Independent threat model and penetration test.

## Provisioning checklist

1. Create a Supabase project in the intended region and configure authentication.
2. Apply `supabase/migrations/202611220001_institutional_saas.sql`.
3. Set Vercel environment variables:
   - `VITE_SAAS_MODE=true`
   - `VITE_SUPABASE_URL=https://<project-ref>.supabase.co`
   - `VITE_SUPABASE_ANON_KEY=<publishable-or-anon-key>`
4. Configure Auth site URL and allowed redirect URLs for the production domain.
5. Redeploy the Vercel application.
6. Register an account and create the first organisation.
7. Provision additional members through a reviewed administrative process. Do not grant browser clients service-role access.

## Demo and SaaS modes

When `VITE_SAAS_MODE` is not `true`, the existing public synthetic demo remains available. When enabled, authentication is mandatory before the workbench is rendered. Missing backend configuration produces a setup screen rather than silently falling back to local-only mode.
