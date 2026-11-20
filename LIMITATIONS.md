# Limitations

## Implemented

- Local, schema-versioned architecture workspace, persistence, duplicate, import and export.
- Deterministic architecture controls and actionable findings; no aggregate score.
- State-changing synthetic lifecycle commands for issue authorization, minting, onboarding, funding, subscription, DvP, coupon payment, redemption and reconciliation.
- Distinct deposit mirror and omnibus backing/entitlement state; separate non-deposit cash positions.
- HSM availability and MPC quorum use separate modeled controls.
- Fourteen named scenario definitions, including custody, liquidity, reconciliation, finality, servicing and redemption failures.
- Actual configuration comparison and JSON/Markdown/CSV pack export.
- Searchable source register and research views.

## Synthetic or simplified

- Actors, balances, eligibility, identifiers and evidence are fictional and local.
- Coupon logic is a simple periodic coupon calculation with integer minor units and per-holder floor rounding.
- Scenario recovery guidance is deterministic text and not an incident runbook for a live institution.
- Atomic settlement is only a configuration compatibility classification; no atomic settlement protocol is implemented.
- Workspace JSON schema v1 has basic validation and does not support migrations from future formats.

## Not implemented

- Backend, identity, multi-user collaboration, durable central storage, account integration, payment rail, transfer agent, trading venue, DLT node, custodian, HSM or MPC cryptographic service.
- ISO 20022 message serialization, schema validation or certification.
- Legal title, insolvency treatment, regulatory classification, compliance attestation or legal finality determination.
- Production resilience tests, performance benchmarks, penetration testing, audit or certification.

No result should be interpreted as a production architecture approval, legal opinion, operational assurance, or financial recommendation.
