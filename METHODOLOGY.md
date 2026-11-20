# Methodology

## Design assessment

Architecture validation uses named, independent controls. A control returns status, domain, finding, impact, observed configuration evidence and remediation. There is no aggregate readiness or risk score. A PASS is a local rule result, not evidence of institutional control effectiveness.

## Lifecycle engine

Commands return a new state or reject with an explicit error. Financial amounts are integer minor units and security positions are integer units. The model separates issuance authorization, register supply, token balances, eligibility, cash availability, custody service availability, instruction idempotency and reconciliation. Rejected commands do not mutate the submitted state.

The mirror model checks bank cash and token cash independently. The omnibus model tracks a pooled bank asset, token cash entitlements and aggregate backing coverage. Alternative cash instruments use a separate cash-position ledger and do not masquerade as a commercial-bank deposit.

## Scenario design

Scenarios declare initial conditions, injected events, expected behavior, observed state, evidence references and recovery. Preconditions gate model-specific scenarios. PASS means the deterministic engine produced the specified safe response; it does not describe a live incident or deployment.

## Research discipline

The searchable source registry favors primary legislation, central banks, market infrastructure operators and official technology documentation. It records a stable ID, organization, category, known dates, access date, canonical URL, supported claims and limitations. Missing dates are labeled “not stated,” not inferred. Initiative announcements are not represented as production status.

## Financial calculation

Coupon accrual uses integer minor units, annual coupon basis points, configured frequency and floor rounding per holder. The calculation is deterministic and rejects unsafe-integer overflow. It is an illustrative simple periodic coupon model, not a complete bond cash-flow engine.
