# SaaS architecture and deployment

## Product boundary

The SaaS edition turns the local decision workbench into an organisation-scoped assessment and governance workspace. It retains the existing deterministic TypeScript decision engine; it does not replace it with a generative model.

## Runtime

- **Web client:** existing React/Vite application.
- **Identity and data plane:** Supabase Auth, PostgreSQL and server-side Supabase Edge Functions.
- **Decision engine:** one shared deterministic TypeScript module is imported by the browser for preview and by the server save function for authoritative recomputation.
- **Tenant boundary:** organisation membership plus PostgreSQL Row Level Security on every tenant-owned table.
- **Roles:** owner, admin, editor, reviewer and viewer. Only owner/admin/editor can create or update assessments.
- **Decision record:** title, use case, complete input snapshot, server-computed decision snapshot, engine version, record version, author/updater identity and timestamps.
- **Review workflow:** draft → in review → approved/rejected. Only an independent owner/admin/reviewer can approve or reject; the submitter cannot review their own assessment. Review comments and actions are retained.
- **Audit:** database trigger writes a snapshot event on every assessment create/update and invited-member provisioning; application roles cannot update/delete audit events. The workbench displays the latest 100 tenant events.
- **Hosting:** Vercel static frontend; Supabase is a separately provisioned managed backend.

## Request path

`User -> Supabase Auth -> JWT -> Edge Function (role check + deterministic recompute) -> PostgreSQL`

The browser uses only the publishable/anon key. Browser-local architecture drafts are namespaced by organisation and user; SaaS decision assessments are persisted in the tenant database rather than the public demo's shared local draft key. Tenant isolation is enforced by database policies, not by hiding UI controls. A user cannot gain access to another tenant by changing an organisation ID in a request. The invitation Edge Function validates the caller JWT and checks the caller's owner/admin membership using the service role held only in the function environment.

## First-release scope

1. Email/password sign-up and sign-in.
2. First-user organisation creation.
3. Organisation selector for memberships already provisioned in Supabase.
4. Tenant-isolated assessment persistence and database-side audit events.
5. Deterministic decision snapshot versioning, recomputed server-side on every save.
6. Owner/admin email invitations through a Supabase Edge Function; membership is attached when the invited identity is created.
7. Server-side decision recomputation before persistence; browser clients cannot write assessment rows directly.
7. Segregated assessment review with mandatory rationale and database-side author/reviewer separation.
8. Read-only roles for reviewer/viewer.

## Required before a paid institutional deployment

- Enterprise SSO (SAML/OIDC), MFA enforcement, SCIM lifecycle and verified invitations.
- Admin UI for member lifecycle and role changes, invitation revocation and membership removal.
- Formal policy versioning, multi-stage approvals, delegated authority matrices and policy-specific sign-off.
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
4. Configure Auth site URL, allowed redirect URLs and email templates for the production domain.
5. Set the Edge Function secret `APP_ORIGIN` to the production application origin; keep the service-role key in Supabase function secrets only.
6. Deploy the assessment function: `supabase functions deploy save-assessment`.
7. Deploy the invitation function: `supabase functions deploy invite-member`.
8. Redeploy the Vercel application.
9. Register an account, confirm the email and create the first organisation.
10. Invite additional users from the organisation bar. The invitation creates a membership after the invitee's Auth identity is provisioned. Do not grant browser clients service-role access.

## Demo and SaaS modes

When `VITE_SAAS_MODE` is not `true`, the existing public synthetic demo remains available. When enabled, authentication is mandatory before the workbench is rendered. Missing backend configuration produces a setup screen rather than silently falling back to local-only mode.
