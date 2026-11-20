# Interoperability

## Architecture question

How can systems coordinate instructions and status without assuming that messages or bridges create a shared legal or settlement state?

## Design implications

- Use canonical transaction and instruction IDs across adapters.
- Define replay/idempotency, out-of-order events, timeout and finality-observation semantics.
- Specify who can see which data and how independent observers corroborate state.
- Preserve source-system records and make reconciliation breaks explicit.
- Distinguish common APIs, messaging, shared coordination, bridges and genuine atomic synchronisation.

## Sources and caveats

Project Agorá [SRC-004] describes an experimental shared-platform approach. Swift's ledger announcement [SRC-005] reports the initiative status on its publication date; a pilot announcement does not establish general availability or prove this workbench is integrated with it. No interoperability protocol is implemented here.
