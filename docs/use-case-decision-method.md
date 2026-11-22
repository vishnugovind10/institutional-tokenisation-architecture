# Use-case decision method

## Purpose

The decision studio answers a bounded question: **is there a sufficiently evidenced, multi-party financial workflow for which tokenisation is worth testing, and what is the smallest credible pilot?**

It is an early-stage decision aid. It does not choose a DLT vendor, certify compliance, establish legal title, calculate a production business case or authorize live transactions.

## Decision outcomes

### NO-GO

Returned when no operational friction has been selected. A token representation is not itself a business benefit. The user should first identify a material workflow problem.

### HOLD

Returned when a problem is selected but the baseline evidence is missing, the workflow is not multi-party, or one or more minimum prerequisites remain open. The output explains what must be established.

### PILOT CANDIDATE

Returned only when the workflow problem and baseline are stated, at least one annual event and two participating parties are in scope, and all prerequisite gates are marked ready. This is a candidate for a bounded pilot proposal, not a production approval.

## Gates

| Gate | Ready condition | Why it matters |
|---|---|---|
| Operational problem | One or more concrete workflow frictions selected | Avoids technology-first tokenisation |
| Baseline evidence | At least 12 characters of user-entered evidence | Requires an attributable starting point; not independently verified |
| Workflow scale | At least one event per year and two parties | Establishes a multi-party process rather than a single-user record |
| Legal authority | Authoritative legal register identified | Separates legal ownership from technical representation |
| Transfer rules | Transfer restrictions, eligibility and consent rules documented | Determines who may hold or receive the asset and when rights change |
| Cash settlement | Cash instrument, operator and recovery route identified | Prevents assuming a tokenised asset automatically has a cash leg |
| Operating owner | Accountable workflow and exception owner assigned | Ensures someone owns breaks, approvals and operations |
| Pilot counterparty | At least one real counterparty identified | Distinguishes an actual pilot from an internal demonstration |
| Data | Representative workflow data available | Allows like-for-like baseline and shadow testing |

## Use-case pilot templates

- **Tokenised bond issuance:** one instrument and issuance event, eligibility and allocation, authoritative register update, reconciliation and one servicing event. Secondary trading is excluded initially.
- **Fund units:** one share class, transfer-agent workflow, onboarding, subscription/redemption and position reconciliation. Dealing cut-offs, NAV, gates and redemption liquidity remain explicit.
- **Private credit:** one loan or participation, investor allocation, transfer consent, servicing cashflows and reporting. Token transfer is not assumed to alter borrower obligations.
- **Collateral:** one agreement and margin-call type, eligibility/haircut adjudication and shadow allocation. Live pledging and asset movement are excluded.

## Architecture defaults

1. Identify the legally authoritative register before choosing where token balances are stored.
2. Treat DLT records as representations unless the applicable legal framework establishes their legal effect.
3. Start with existing cash rails unless pilot counterparties can access an agreed tokenised-money instrument.
4. Model settlement as coordinated unless asset and cash demonstrably share an atomic settlement boundary.
5. Separate legal rights, custody control, operational availability and technical finality.
6. Measure workflow outcomes before claiming cost, liquidity, capital or settlement benefits.

## Evidence and limitations

The app stores the working inputs in browser local storage and supports JSON and Markdown exports. Gate status is entered by the user; it is not checked against external registries, legal documents, counterparties or connected systems. All recommendations are deterministic templates, not professional advice. Any pilot involving live assets requires independent legal, compliance, risk, custody, security and operational approval.
