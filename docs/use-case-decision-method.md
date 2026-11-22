# Use-case decision method

## Purpose and scope

The Decision Studio answers: **Should this asset or financial workflow be tokenised, and what must be true before proceeding?** It compares the conventional workflow with a tokenisation hypothesis, evaluates explicit decision gates and creates a portable, versioned record. It is a deterministic early-stage decision aid. It does not verify user-entered evidence, establish legal title, certify compliance, select a DLT vendor or authorize production transactions.

## Decision outcomes

- **NO-GO:** no operational friction is stated, the workflow is not recurring and multi-party, the sourced comparison shows no measured improvement, or a user-confirmed conventional alternative is adequate without a tokenisation-specific differentiator.
- **HOLD:** one or more evidence, comparison, economics, legal, rights, cash, custody, technology, ownership, counterparty or data gates remain open. Each open gate lists the consequence, owner and evidence quality.
- **PILOT CANDIDATE:** only when the problem, traceable baseline, conventional comparison, measurable hypothesis and all applicable prerequisite gates are complete. This is a proposal for a bounded pilot, not approval to handle live assets.

There is no aggregate readiness score. A decision is explained by rule-level findings and open gate consequences.

## Evidence and economics

Evidence labels are user-entered: **user-marked verified**, **assumption**, or **missing**. “User-marked verified” means only that a user asserts the evidence is sourced; the application does not validate it. Baseline source and observation period should be stated. Proposed targets remain hypotheses until measured.

The economic comparison annualises current-versus-proposed cost per event, hours per event and exception rates over the stated event volume. The user selects a primary objective (cost, time or exception rate). That objective must improve for the economic gate to pass; improvement in another measure alone is not enough. The result lists improvements and deteriorations separately. Configurable per-measure tolerance thresholds determine whether a deterioration is material. A material deterioration leaves the gate open until the user explicitly accepts it, and an accepted trade-off remains visible in the recommendation and portable record. Proposed values remain modeled hypotheses, not measured outcomes.

The comparison also includes one-time implementation cost, annual operating cost, and net first-year and recurring cost results when inputs are available. Costs and benefits use the same currency (EUR in this version). Missing implementation/run costs leave net results unquantified and the economic gate open. No time or exception reduction is silently converted into cash.

Single-gate sensitivity is explicitly labeled: **“Hypothetical result assuming the selected evidence gate is satisfied. No evidence has been independently verified or upgraded.”** It marks one gate in an isolated copy and never changes the saved assessment. The label appears alongside each sensitivity analysis so a counterfactual cannot be confused with evidence verification. If other blockers remain, the hypothetical result remains HOLD; this identifies dependencies that need to move together.

## Decision gates

| Gate | Required condition | Example evidence or decision |
|---|---|---|
| Operational problem | Recurring, material workflow friction selected | Reconciliation breaks, settlement delay, manual eligibility |
| Baseline | Described observation, source and user-marked quality | Operating data and measurement period |
| Scale | At least one annual event and two participants | Workflow volume and participant map |
| Mechanism | A concrete shared-state, rights, conditional settlement, lifecycle or entitlement need | Why a token representation changes coordination |
| Conventional alternative | Direct assessment, written gap and evidence quality | Database/API/workflow-control comparison |
| Economic case | Selected primary objective improves; modeled trade-offs stay within tolerance or are explicitly accepted; sourced baseline and source note; implementation and ongoing costs entered | Like-for-like cost model, tolerance thresholds and target assumptions |
| Legal authority and rights | Legal register, transfer/consent rules and empowered parties identified | Agreement, register and control-owner mapping |
| Collateral eligibility | Agreement criteria, valuation, haircuts and overrides understood | Eligibility and valuation rules |
| Custody | Asset location, encumbrance, control and release authority understood | Custodian inventory and custody controls |
| Technology | Data, integration, identity and reconciliation boundaries mapped | Source/interface inventory and timestamps |
| Cash settlement | Instrument, operator, funding, cut-offs and recovery route stated | Settlement runbook and cash account responsibilities |
| Operating owner | Exception, reconciliation and closeout functions assigned | Named business/operations owner |
| Counterparty and data | Pilot counterparty and representative data available | Sponsor commitment and permissioned sample data |

An “adequate” conventional alternative supported by user-confirmed evidence returns NO-GO absent a defensible differentiator. A measured case showing no cost, time or exception improvement also returns NO-GO. Unknowns remain HOLD rather than being converted to a score.

## End-to-end demonstration: collateral allocation and settlement

The demonstration walks through:

1. **Business case:** identify reconciliation, settlement-delay and manual-eligibility friction; compare current and proposed costs, time and exceptions; include implementation and run costs.
2. **Architecture decision:** map legal agreement/register, eligibility and valuation rules, custodian inventory/encumbrance, cash settlement operator, workflow coordinator and reconciliation responsibilities.
3. **Lifecycle rehearsal:** allocate eligible collateral, coordinate delivery and cash confirmation, discharge the allocation, release collateral and reconcile independent synthetic records.
4. **Failure scenarios:** insufficient cash, ineligible collateral, failed delivery, stale source data and reconciliation mismatch.
5. **Decision package:** export executive recommendation, rationale, business problem and baseline, alternative, economic case, proposed architecture and system-of-record responsibilities, dependencies and evidence quality, failure paths, remediation owners, assumptions and review history.

The lifecycle states, amounts, event identifiers and controls are synthetic. Each attempted action returns an applied/blocked status, structured error and cloned next state. A blocked attempt appends a `BLOCKED` event to the returned state while preserving the previous state and its successful business fields. The simulator renders that event in the lifecycle trail and includes it in isolated failure-scenario reports. No custody, banking, legal-register, payment, collateral-management or DLT adapter is connected. A scenario passing means the local control detected or blocked its configured failure; it is not proof of external settlement or legal effect.

## Portable record and version history

The record supports JSON and a committee memo in Markdown. It contains the decision engine version, assessment version and timestamp; executive recommendation and rationale; baseline and conventional alternative; economic inputs and modeled outputs; proposed architecture and system-of-record responsibilities; dependencies with owners/status/evidence quality; failure scenarios; remediation actions; assumptions and limitations; and review events when retained by the optional institution workspace. Browser-local versions are device-local and should be exported for durable circulation. Tenant-scoped server versions and review events are available only when the optional institutional service is configured.

## Architecture defaults and limitations

1. Identify legal authority before selecting a token balance record.
2. Treat token records as representations unless the relevant legal framework establishes their effect.
3. Keep asset, legal, custody, cash and settlement records distinct and name each system of record.
4. Start with existing cash rails unless a shared cash instrument and settlement boundary are evidenced.
5. Separate legal rights, custody control, operational availability and technical finality.
6. Measure a like-for-like workflow before asserting cost, liquidity, capital or settlement benefits.

The decision engine is deterministic and its evidence fields are assertions, not external verification. Any live-asset pilot requires independent legal, compliance, risk, custody, security and operational approval.
