# TokenOps Studio

![CI](https://github.com/vishnugovind10/tokenops-studio/actions/workflows/ci.yml/badge.svg?branch=main) [![License](https://img.shields.io/github/license/vishnugovind10/tokenops-studio)](LICENSE)

TokenOps Studio is a decision and architecture workspace for institutional teams exploring tokenised finance. Assess a specific workflow, define a bounded pilot, model the operating architecture and preserve reviewable decision records.

**Live demo:** [institutional-tokenisation-architec.vercel.app](https://institutional-tokenisation-architec.vercel.app) · **Product release:** 0.2.0

> The public demo uses synthetic data. Optional SaaS mode adds authenticated, organisation-scoped assessments and independent review. It is a product preview, not a production financial service or a claim of institutional deployment.

## Product workflows

- **Use-case decision:** evaluate tokenised bonds, fund units, private-credit participations and collateral workflows against business evidence, simpler alternatives, operating ownership, legal readiness, settlement and data prerequisites.
- **Architecture designer:** configure asset, money, custody, settlement, integration and governance assumptions; keep browser-local workspaces and import or export JSON.
- **Assessment:** review rule-level PASS, WARNING, FAIL and UNASSESSED findings with evidence and remediation.
- **Lifecycle simulator:** rehearse synthetic issuance, onboarding, funding, subscription, delivery-versus-payment, coupons, redemption and reconciliation.
- **Scenario lab:** run 14 deterministic baseline and exception cases.
- **Decision materials:** compare configurations and export JSON, Markdown and CSV.
- **Team SaaS preview:** authenticate with Supabase, create or join organizations, invite colleagues by email, set or recover passwords, assign roles, save tenant-scoped assessments, submit them for independent review and inspect audit history.

## Run locally

Requires Node.js 20 or newer.

```bash
npm ci
npm run dev
```

Without `VITE_SAAS_MODE=true`, the workbench runs in local demo mode and stores drafts in the current browser. No backend is required for the synthetic demo.

Regenerate the reproducible collateral committee package with:

```bash
npm run sample:collateral
```

The output is [a portable JSON assessment](examples/collateral-committee-assessment.json) and [the committee memo](examples/collateral-committee-assessment.md). See the [90-second product demo runbook](docs/collateral-product-demo.md) for the decision, economic trade-offs, lifecycle and blocked-event walkthrough.

## Configure SaaS mode

SaaS mode requires a Supabase project and a Vercel deployment. Copy `.env.example` to `.env.local` and set the public client values:

```dotenv
VITE_SAAS_MODE=true
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<publishable-or-anon-key>
```

Apply `supabase/migrations/202611220001_institutional_saas.sql`, configure Auth email confirmation, site URL and allowed redirects, then set `APP_ORIGIN` in Supabase Function secrets. Deploy both functions:

```bash
supabase functions deploy save-assessment
supabase functions deploy invite-member
```

Add the three `VITE_` values to the Vercel environment and redeploy. Keep the Supabase service-role key in Supabase Function secrets only; never put it in browser or Vite variables. Detailed provisioning, trust boundaries and release limitations are in [docs/saas-architecture.md](docs/saas-architecture.md), [SECURITY.md](SECURITY.md) and [docs/saas-validation-checklist.md](docs/saas-validation-checklist.md).

The existing public deployment is still the synthetic demo until the SaaS backend is provisioned and configured. Do not use confidential or regulated data until the deployment checklist and an independent security review are complete.

## Verify changes

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run docs:check
npm audit --audit-level=high
```

## Model boundaries

All outcomes are bounded illustrations. The model does not determine legal ownership, enforceability, regulatory classification, scheme rules, technical or network finality, privacy, operational resilience or institutional suitability. It does not provide legal advice, compliance certification or production approval. No banking, trading, custody, payment or DLT adapter is connected; HSM and MPC availability are modeled as control conditions only.

## Project guide

- [Architecture and module boundaries](ARCHITECTURE.md)
- [Methodology](METHODOLOGY.md)
- [Use-case decision method](docs/use-case-decision-method.md)
- [SaaS architecture](docs/saas-architecture.md)
- [Current deployment status](docs/deployment-status.md)
- [Collateral demo and committee memo](docs/collateral-product-demo.md)
- [Security boundary](SECURITY.md)
- [Release validation checklist](docs/saas-validation-checklist.md)
- [Limitations](LIMITATIONS.md)
- [Research register](RESEARCH.md) and [source notes](SOURCES.md)
- [Changelog](CHANGELOG.md)

## Citation and license

See [CITATION.cff](CITATION.cff). Released under the [MIT License](LICENSE).
