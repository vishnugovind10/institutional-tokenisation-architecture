# Decision record — Tokenised collateral allocation and settlement — committee assessment

**Recommendation:** HOLD · **Version:** 1 · **Engine:** use-case-decision/2.2

Generated: 2026-11-23T12:00:00.000Z. Synthetic decision aid; user-supplied evidence and assumptions are not independently verified.

## Executive recommendation

9 decision gate(s) remain open. Resolve the named evidence, economic, legal, custody, cash, data and operating dependencies before recommending a pilot. Selected mechanisms: Multiple parties need a shared, consistently updated position or ownership state; Asset and cash actions need coordinated, conditional execution across participants.

- Baseline evidence has a traceable source: Capture a measurable baseline, source and observation period. A user-marked verified source is not independently checked by this application.
- Conventional alternative directly compared: Compare the incumbent workflow and conventional database/API option against the specific requirement; identify evidence for the stated gap.
- Primary objective and trade-offs are acceptable: Material deterioration exceeds tolerance: Exception rate: deteriorates 11.1% (exceeds 10% tolerance). Explicitly accept the trade-off or revise the proposed case.
- Transfer, consent and eligibility rules defined: Document eligibility, transfer restrictions, consent, substitution and release rules.
- Collateral eligibility and haircut rules defined: Identify the agreement, asset criteria, valuation source, haircut schedule, concentration rules and override authority.
- Custody control and asset availability confirmed: Confirm control location, segregation, encumbrance status, authorization and release authority.
- Data and integration boundaries defined: Map source data, interfaces, timestamps, identity, shared-state and reconciliation responsibilities.
- Pilot counterparty identified: Identify a named participant willing to run a bounded shadow or controlled pilot.
- Representative workflow data available: Secure permissioned representative data and a repeatable source for like-for-like baseline comparison.
- Hours / event: deteriorates 7.7%.
- Exception rate: deteriorates 11.1% (exceeds 10% tolerance).

## Business problem and baseline

Workflow: collateral. 120 events/year across 4 parties.

SYNTHETIC: the illustrative workflow takes 6.5 hours per allocation, costs €420 per event and records a 9% exception rate.

Source: Synthetic demonstration dataset COLLATERAL-DEMO-001; illustrative 90-day observation window. · Quality: assumption.

## Conventional alternative

Assessment: insufficient · Evidence: assumption.

SYNTHETIC: assume the incumbent API process needs manual eligibility checks and independent position reconciliation across four parties.

## Economic case

| Measure | Current baseline | Proposed target | Annualised difference | Evidence |
| --- | --- | --- | --- | --- |
| Cost per event (€) | 420 | 310 | €13200.00 / year | assumption |
| Hours per event | 6.5 | 7 | -60.00 hours / year | assumption |
| Exception rate (%) | 9 | 10 | -1.20 / year | assumption |

Primary objective: cost · Improvement: modeled · Tolerances (cost / time / exceptions): 10% / 10% / 10% · Material deterioration accepted: no.

Modeled improvements:
- Cost / event: improves 26.2%.

Modeled deteriorations:
- Hours / event: deteriorates 7.7%.
- Exception rate: deteriorates 11.1% (exceeds 10% tolerance).

One-time implementation cost: €8000 · Annual operating cost: €3000 · Net first year: €2200.00 · Net recurring: €10200.00.

Annualised modeled differences over 120 events. Proposed values are assumption and are not measured outcomes. The primary objective is cost; material deteriorations require explicit acceptance. Net returns include implementation and run costs only when entered.

## Proposed architecture and system of record

- Legal agreement and authoritative collateral register define rights, substitution and release conditions.
- Collateral operations own eligibility, valuation, haircut and concentration adjudication; custody confirms control and availability.
- A pre-pledge allocation proposal is distinct from pledge execution and release; settlement records retain separate accepted, delivered and released states.
- Model settlement cash, fees and shortfall funding separately; do not treat tokenised collateral as cash.
- Token representation is optional. Use it only if its measured shared-state or conditional-settlement benefit exceeds conventional workflow cost and control impact.

| Domain | Authoritative record | Owner |
| --- | --- | --- |
| Legal rights | Collateral agreement and legal collateral register | Legal and collateral documentation |
| Eligibility and valuation | Collateral eligibility rules, valuation source and haircut schedule | Collateral Risk |
| Asset inventory | Custodian inventory and encumbrance record | Custody Operations |
| Settlement | Settlement operator status and cash account record | Settlement Operations |
| Operational state | Allocation coordinator and independent reconciliation evidence | Collateral Operations |

## Dependencies and evidence quality

| Dependency | Status | Evidence quality | Owner | What remains |
| --- | --- | --- | --- | --- |
| Operational problem evidenced | READY | assumption | Collateral Operations |  |
| Baseline evidence has a traceable source | OPEN | assumption | Operations Analytics | Capture a measurable baseline, source and observation period. A user-marked verified source is not independently checked by this application. |
| Multi-party workflow is in scope | READY | assumption | Collateral Operations |  |
| Tokenisation-specific mechanism identified | READY | assumption | Architecture |  |
| Conventional alternative directly compared | OPEN | assumption | Architecture | Compare the incumbent workflow and conventional database/API option against the specific requirement; identify evidence for the stated gap. |
| Primary objective and trade-offs are acceptable | OPEN | assumption | Collateral Operations | Material deterioration exceeds tolerance: Exception rate: deteriorates 11.1% (exceeds 10% tolerance). Explicitly accept the trade-off or revise the proposed case. |
| Authoritative legal register identified | READY | assumption | Legal and collateral documentation |  |
| Transfer, consent and eligibility rules defined | OPEN | assumption | Collateral Operations | Document eligibility, transfer restrictions, consent, substitution and release rules. |
| Collateral eligibility and haircut rules defined | OPEN | assumption | Collateral Risk | Identify the agreement, asset criteria, valuation source, haircut schedule, concentration rules and override authority. |
| Custody control and asset availability confirmed | OPEN | assumption | Custody Operations | Confirm control location, segregation, encumbrance status, authorization and release authority. |
| Data and integration boundaries defined | OPEN | assumption | Architecture | Map source data, interfaces, timestamps, identity, shared-state and reconciliation responsibilities. |
| Cash settlement route and recovery identified | READY | assumption | Settlement Operations |  |
| Accountable workflow and exception owner assigned | READY | assumption | Collateral Operations |  |
| Pilot counterparty identified | OPEN | assumption | Pilot Sponsor | Identify a named participant willing to run a bounded shadow or controlled pilot. |
| Representative workflow data available | OPEN | assumption | Operations Analytics | Secure permissioned representative data and a repeatable source for like-for-like baseline comparison. |

## Failure scenarios

- **Insufficient settlement cash:** Block cash settlement, preserve both obligations and identify the funding owner.
- **Ineligible collateral:** Reject allocation against the governing eligibility and haircut rules; retain a reason code.
- **Failed delivery:** Keep the margin obligation open; do not mark collateral mobilised without source confirmation.
- **Stale valuation or inventory data:** Block allocation until an authoritative fresh observation is received.
- **Reconciliation mismatch:** Open a break across agreement, inventory, custody and settlement records; never silently repair.

## Remediation and next decisions

- [ ] Baseline evidence has a traceable source: Capture a measurable baseline, source and observation period. A user-marked verified source is not independently checked by this application. · Owner: Operations Analytics
- [ ] Conventional alternative directly compared: Compare the incumbent workflow and conventional database/API option against the specific requirement; identify evidence for the stated gap. · Owner: Architecture
- [ ] Primary objective and trade-offs are acceptable: Material deterioration exceeds tolerance: Exception rate: deteriorates 11.1% (exceeds 10% tolerance). Explicitly accept the trade-off or revise the proposed case. · Owner: Collateral Operations
- [ ] Transfer, consent and eligibility rules defined: Document eligibility, transfer restrictions, consent, substitution and release rules. · Owner: Collateral Operations
- [ ] Collateral eligibility and haircut rules defined: Identify the agreement, asset criteria, valuation source, haircut schedule, concentration rules and override authority. · Owner: Collateral Risk
- [ ] Custody control and asset availability confirmed: Confirm control location, segregation, encumbrance status, authorization and release authority. · Owner: Custody Operations
- [ ] Data and integration boundaries defined: Map source data, interfaces, timestamps, identity, shared-state and reconciliation responsibilities. · Owner: Architecture
- [ ] Pilot counterparty identified: Identify a named participant willing to run a bounded shadow or controlled pilot. · Owner: Pilot Sponsor
- [ ] Representative workflow data available: Secure permissioned representative data and a repeatable source for like-for-like baseline comparison. · Owner: Operations Analytics

## Review history

No independent review actions recorded for this version.

## Record assumptions and limitations

- Baseline narrative is marked as an assumption or missing; it has not been verified.
- Proposed cost/time/exception values are assumptions, not measured outcomes.
- Conventional alternative assessment is not user-confirmed.
- Operational problem evidenced is marked ready by the user but its evidence is assumption.
- Multi-party workflow is in scope is marked ready by the user but its evidence is assumption.
- Tokenisation-specific mechanism identified is marked ready by the user but its evidence is assumption.
- Authoritative legal register identified is marked ready by the user but its evidence is assumption.
- Cash settlement route and recovery identified is marked ready by the user but its evidence is assumption.
- Accountable workflow and exception owner assigned is marked ready by the user but its evidence is assumption.

The tool does not verify external data, legal rights, custody control, counterparty commitment, regulatory compliance or economic outcomes. A PILOT CANDIDATE is not production approval.

## Committee resolution

**Decision: HOLD.** Continue discovery and a bounded shadow-mode design only. Do not authorize production execution or claim realized savings. The selected cost objective improves in the illustrative model, while the proposed exception rate worsens by 11.1%, beyond its 10% tolerance; that deterioration has not been accepted. Baseline and target values are synthetic assumptions, so the economic gate remains open.

### Economic trade-offs

- Modeled annual cost reduction: €13200.00 across 120 events.
- Modeled annual time change: -60.00 hours (negative means more time required).
- Modeled annual exception change: -1.20 (negative means more exceptions).
- Modeled net first year: €2200.00; net recurring: €10200.00.
- Primary objective: cost. Tolerances: cost 10%, time 10%, exception rate 10%. Material deterioration acceptance: no.
- These are counterfactual model outputs, not observed results or evidence upgrades.

## Sensitivity check

Hypothetical result assuming the selected evidence gate is satisfied. No evidence has been independently verified or upgraded.

If the custody-control gate were satisfied as a what-if, the result would be HOLD; remaining open gates: Baseline evidence has a traceable source, Conventional alternative directly compared, Primary objective and trade-offs are acceptable, Transfer, consent and eligibility rules defined, Collateral eligibility and haircut rules defined, Data and integration boundaries defined, Pilot counterparty identified, Representative workflow data available.

## Lifecycle demonstration

Synthetic state only. A rejected allocation for ineligible BOND-002 is recorded before the valid BOND-001 lifecycle completes.

| Event | Action | Status | Detail |
| --- | --- | --- | --- |
| COL-EVT-001 | allocate | BLOCKED | Asset is ineligible under the selected agreement rules. |
| COL-EVT-002 | allocate | APPLIED | BOND-001 reserved at haircut-adjusted value €760.000 against a €500.000 obligation. |
| COL-EVT-003 | deliver | APPLIED | Source delivery confirmed for BOND-001; cash leg €7.500 settled. |
| COL-EVT-004 | discharge | APPLIED | Authorized obligation discharge recorded; collateral may now enter the release workflow. |
| COL-EVT-005 | release | APPLIED | BOND-001 released after confirmed obligation discharge. |
| COL-EVT-006 | reconcile | APPLIED | Agreement, legal register, inventory and custody states reconcile at the current workflow stage. |

Final modeled stage: **RELEASED**. Settlement cash remaining: **€5.000**.

## Failure scenario results

| Scenario | Control result | Attempt history | Remediation owner |
| --- | --- | --- | --- |
| Insufficient settlement cash | PASS — Insufficient settlement cash: €0 available; €7.500 due. | allocate APPLIED; deliver BLOCKED | Settlement Operations |
| Ineligible collateral | PASS — Asset is ineligible under the selected agreement rules. | allocate BLOCKED | Collateral Operations |
| Failed delivery | PASS — Delivery confirmation was not received; keep the obligation open and do not mark the asset mobilised. | allocate APPLIED; deliver BLOCKED | Custody Operations |
| Stale valuation data | PASS — Asset valuation or inventory data is stale; refresh its source observation. | allocate BLOCKED | Data Owner |
| Reconciliation mismatch | PASS — Reconciliation break: custody: observed AVAILABLE, expected DELIVERED. Preserve source records and route to the record owner. | reconcile BLOCKED | Operations |

## Committee actions before reconsideration

1. Legal and collateral documentation: confirm authoritative register, enforceable rights, transfer and release rules.
2. Collateral Risk and Operations: approve eligible asset criteria, valuation source, haircut and concentration rules.
3. Custody Operations: evidence asset control, availability, segregation and delivery/release confirmations.
4. Settlement Operations: document the cash route, funding, cut-offs, failure recovery and finality evidence.
5. Architecture: assign systems of record, interface boundaries, identity, freshness and reconciliation responsibilities.
6. Operations Analytics: replace synthetic values with sourced, like-for-like baseline and pilot measurement plan.
7. Pilot Sponsor: obtain counterparty commitment and define bounded shadow-mode scope, exit criteria and accountable incident owners.

## Reproduction

Demo fixture: COLLATERAL-DEMO-001 · assessment version 1 · engine use-case-decision/2.2 · fixed generation time 2026-11-23T12:00:00.000Z.
Run `npm run sample:collateral` from the repository root to regenerate this memo and the portable JSON package. The simulator uses fixed synthetic state and deterministic rules.
