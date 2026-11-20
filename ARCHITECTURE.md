# Architecture

See the detailed [enterprise architecture reference](docs/architecture.md) and [architecture decision records](docs/decisions.md).

## Runtime layout

```text
src/domain/architecture.ts     versioned workspace schema and deterministic validation rules
src/domain/lifecycle.ts        immutable lifecycle commands and financial record invariants
src/domain/scenarios.ts        reproducible failure definitions and outcomes
src/domain/pack.ts             system-of-record matrix, comparison and export generation
src/domain/research.ts         categorized, searchable primary-source register
src/workbench/storage.ts       browser-local persistence and workspace import/duplicate/delete
src/workbench.tsx              React workbench views and interaction flows
```

The browser shell holds the active versioned configuration and invokes pure domain functions. Local storage contains user-created configurations and recent synthetic scenario outcomes. No server state exists.

## Source-of-record boundaries

The architecture distinguishes the governing instrument and legal register, the token asset ledger, the underlying bank deposit, tokenized deposit entitlement, pooled backing, custody authorization, coordinator observations and accounting/reconciliation records. A token transfer alone does not establish legal title, cash settlement, operational completion or legal finality.

## Settlement resolution

A requested atomic architecture is treated as atomic only when the configuration specifies a shared settlement domain, one ledger and a same-ledger cash mechanism. Otherwise it resolves to coordinated settlement. The lifecycle event records that effective model and the reason; the assessment reports an incompatible atomic request as FAIL.

## Workspace schema

Workspace JSON uses `schemaVersion: 1`. Import merges known fields with the v1 defaults, rejects unsupported versions and validates key financial amounts, dates and option values. Future schema changes require explicit migration logic.
