# Institutional Tokenisation Architecture

![CI](https://github.com/vishnugovind10/institutional-tokenisation-architecture/actions/workflows/ci.yml/badge.svg?branch=main) [![Release](https://img.shields.io/github/v/release/vishnugovind10/institutional-tokenisation-architecture)](https://github.com/vishnugovind10/institutional-tokenisation-architecture/releases) [![License](https://img.shields.io/github/license/vishnugovind10/institutional-tokenisation-architecture)](LICENSE) [![Project website](https://img.shields.io/badge/Workbench-live-126b62)](https://institutional-tokenisation-architec.vercel.app)

A versioned institutional architecture workbench for tokenised securities, digital money, custody, settlement, reconciliation and assurance.

**Live workbench:** [institutional-tokenisation-architec.vercel.app](https://institutional-tokenisation-architec.vercel.app) · **Current version:** 0.2.0

> This is a reference architecture and deterministic simulator using synthetic data. It is not a production banking platform, legal opinion, compliance product, regulated settlement venue or institutional deployment. The workbench has no live ledger, custody, payment or network connection. Related portfolio projects are conceptual references, not tested integrations or shared runtime.

## Contents

- [Workbench](#workbench)
- [Run locally](#run-locally)
- [Verify changes](#verify-changes)
- [Model boundaries](#model-boundaries)
- [Repository guide](#repository-guide)
- [Citation and license](#citation-and-license)

## Workbench

- **Architecture designer:** edit a versioned design, manage browser-local workspaces, and import/export JSON.
- **Assessment:** inspect rule-level PASS, WARNING, FAIL and UNASSESSED findings without a composite score.
- **Lifecycle simulator:** model issuance authorization, minting, investor onboarding, funding, subscription, DvP, coupon and redemption.
- **Scenario laboratory:** run 14 deterministic baseline and exception scenarios with state, evidence, expected outcome and recovery guidance.
- **Decision pack:** compare workspaces and export a configuration-aware Markdown, CSV and JSON pack.
- **Research library:** browse 10 dated primary-source records across money, DLT, custody, integration, settlement and regulation.

## Run locally

Requires Node.js 20 or newer.

```bash
npm ci
npm run dev
```

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

The model keeps the legal register, token asset balances, bank deposit ledger, token cash and omnibus pool distinct. Deposit mirror reconciliation compares bank and token balances account by account; omnibus reconciliation compares entitlements with pooled backing. CBDC, stablecoin and existing-rail cash are modeled as separate cash positions, not bank deposits. Selecting atomic settlement is downgraded to coordinated execution when the configured settlement boundary cannot support it.

All outcomes are bounded illustrations. Legal ownership, enforceability, regulatory classification, scheme rules, technical/network finality, privacy, operational resilience and institutional suitability require external analysis. HSM and MPC availability checks model control conditions; no cryptography or key management is implemented.

## Repository guide

- [Architecture and module boundaries](ARCHITECTURE.md)
- [Methodology](METHODOLOGY.md)
- [Limitations](LIMITATIONS.md)
- [Governance](GOVERNANCE.md)
- [Research register](RESEARCH.md) and [source notes](SOURCES.md)
- [v0.1 assessment](docs/audit/v0.1-assessment.md)
- [Research reports](docs/research/)
- [Change log](CHANGELOG.md)

## Citation and license

See [CITATION.cff](CITATION.cff). Released under the [MIT License](LICENSE).
