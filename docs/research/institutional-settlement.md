# Institutional settlement

## Architecture question

What evidence is required to move from a matched instruction to operational completion without confusing technical finality with legal finality?

## Design implications

- Track eligibility, asset availability, cash availability, custody authority, instruction identity, each leg's status and reconciliation separately.
- Treat retries as idempotent operations and distinguish duplicate messages from new instructions.
- For independent systems, expose intermediate states, timeouts, uncertain finality and recovery actions.
- Claim atomic DvP only when both obligations use a supported settlement mechanism and governing rulebook within one boundary.
- Keep legal finality unassessed until legal and scheme sources are reviewed.

## Sources and caveats

The CPMI tokenisation report [SRC-007] discusses potential settlement benefits and risks. The DLT Pilot Regime [SRC-003] is a defined EU framework for certain market infrastructures, not a generic settlement guarantee. The workbench simulates coordination; it does not execute a settlement protocol.
