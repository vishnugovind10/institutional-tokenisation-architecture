# Architecture decision records

These are reference positions for discussion, not universal policy. Every decision must be revisited against instrument documentation, jurisdiction, scheme rules, risk appetite and the institution's operating model.

## ADR-001 — Authoritative legal register and token ledger

- **Context:** one holding can appear in legal documents, a transfer register, custody books and DLT state.
- **Alternatives:** token ledger is authoritative; legal register is authoritative; dual registers with precedence rules.
- **Decision:** treat the governing instrument and designated legal register as authoritative until legal terms expressly establish another rule. Token ledger is operational state.
- **Rationale:** makes ownership, entitlement and technical representation explicit and reconciliable.
- **Consequences:** maintain a controlled synchronization and discrepancy process; identify precedence and correction authority.
- **Risks / limitations:** enforceability and register status depend on law, documentation and system rules; this is not legal advice.

## ADR-002 — Deposit mirror versus omnibus architecture

- **Context:** deposit token balances may mirror customer accounts or represent positions backed by a pooled deposit.
- **Alternatives:** mirror; omnibus; use another cash asset or existing rails.
- **Decision:** no universal default. Document liability, account structure, entitlement, redemption and reconciliation before selecting.
- **Rationale:** the models distribute authority, liquidity and reconciliation differently.
- **Consequences:** mirror requires synchronization with core banking; omnibus requires a controlled subledger and clear pooled-account governance.
- **Risks / limitations:** account ownership, insolvency, customer rights and finality require jurisdiction- and scheme-specific analysis.

## ADR-003 — Single versus multiple ledgers

- **Context:** shared state can simplify coordination but creates common governance and privacy requirements.
- **Alternatives:** single shared permissioned ledger; independent ledgers with interoperability; shared coordination layer over existing systems.
- **Decision:** assess all three; select only after participant, privacy, resilience and governance fit are evidenced.
- **Rationale:** topology should follow institutional boundaries, not token format alone.
- **Consequences:** multi-ledger designs need canonical IDs, status handling, idempotency, observations and break management.
- **Risks / limitations:** message or bridge connectivity does not imply atomic settlement.

## ADR-004 — Besu, Fabric or Canton

- **Context:** the platforms offer different privacy, identity, contract and operating models.
- **Alternatives:** Besu; Fabric; Canton; another public or permissioned DLT.
- **Decision:** keep technology selection use-case specific; compare privacy, membership, governance, finality, contracts, integration and operating cost qualitatively.
- **Rationale:** a universal winner or unsupported benchmark would misstate evidence.
- **Consequences:** validate deployment-specific features, versions, ecosystem support and exit paths in technical discovery.
- **Risks / limitations:** vendor documentation alone does not prove institutional suitability or operational performance.

## ADR-005 — Atomic versus coordinated DvP

- **Context:** asset and money may reside in different systems.
- **Alternatives:** true shared atomic mechanism; coordinated reservations and settlement; sequential processing over existing rails.
- **Decision:** claim atomicity only where one mechanism and rulebook govern both obligations. Otherwise model intermediate states and recovery.
- **Rationale:** prevents false settled status after one leg fails.
- **Consequences:** coordinated workflows need timeouts, releases, observation, escalation and retry controls.
- **Risks / limitations:** rollback may not be possible after an irreversible leg; legal outcome depends on settlement rules.

## ADR-006 — HSM versus MPC custody

- **Context:** signing must enforce authority separation, limits and recoverability.
- **Alternatives:** HSM-backed keys; MPC signing; hybrid or qualified custodian model.
- **Decision:** select from threat model, control ownership, independent approvals, recovery, availability and provider assessment.
- **Rationale:** cryptographic form does not replace institutional authorization and operations.
- **Consequences:** maintain signer inventory, threshold policy, pause, rotation, recovery and continuity exercises.
- **Risks / limitations:** this project models a 2-of-3 outcome and implements no HSM or MPC cryptography.

## ADR-007 — ISO 20022 and core banking integration

- **Context:** payment and account systems use established message, reference and ledger semantics.
- **Alternatives:** direct point-to-point mapping; canonical internal model with adapters; shared API/event contracts.
- **Decision:** use explicit adapters that preserve business identifiers, parties, amounts, references and source statuses; map ISO 20022 concepts where applicable.
- **Rationale:** adapters isolate system differences and support audit and reconciliation.
- **Consequences:** define duplicate, rejection, cancellation, status and version semantics per corridor and system.
- **Risks / limitations:** a message mapping is conceptual here; it is not an implemented ISO 20022 interface or certification.

## ADR-008 — Technical versus legal finality

- **Context:** network confirmation and operational completion do not alone establish legal finality.
- **Alternatives:** conflate statuses; expose distinct status dimensions.
- **Decision:** expose technical finality, operational completion and legal finality separately; mark legal status unassessed absent authoritative rules.
- **Rationale:** status semantics must not outrun evidence.
- **Consequences:** downstream consumers need to interpret each state explicitly.
- **Risks / limitations:** legal finality is defined by applicable law and system rulebooks, not this simulator.

## ADR-009 — Privacy and information visibility

- **Context:** participants need enough information to operate and evidence a transaction without unnecessary disclosure.
- **Alternatives:** public shared state; partitioned state; bilateral messaging; scoped attestations; hybrid model.
- **Decision:** define visibility by role and purpose and minimize disclosed data; test how auditors can verify scoped claims.
- **Rationale:** privacy and evidential completeness must be addressed together.
- **Consequences:** partitioning can increase evidence and reconciliation complexity.
- **Risks / limitations:** cryptographic privacy, lawful disclosure and completeness proofs are out of scope of the workbench.

## ADR-010 — Recovery and incident governance

- **Context:** uncertain finality, unavailable signers and mismatched books require safe pause and recovery.
- **Alternatives:** blind retry; automatic compensating action; controlled exception workflow with fresh authority.
- **Decision:** pause on ambiguity, preserve source observations, block duplicate processing, assign incident owner and reconcile before retry or release.
- **Rationale:** unsafe automation can duplicate value movement or hide unresolved state.
- **Consequences:** recovery requires clear roles, escalation timing and evidence retention.
- **Risks / limitations:** specific incident obligations, time limits and reporting are institution- and jurisdiction-specific.
