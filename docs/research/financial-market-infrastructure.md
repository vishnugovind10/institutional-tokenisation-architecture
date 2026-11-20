# Financial market infrastructure

## Architecture question

Which market roles and settlement functions are performed by trading venues, transfer agents, custodians, payment systems, central securities depositories and scheme operators?

## Design implications

- Assign the issuer/register, trade capture, settlement system, custody and cash-system boundaries explicitly.
- Identify finality rules, participant responsibilities, operating windows, default procedures and reconciliation obligations.
- Avoid treating a token ledger as a substitute for every market-infrastructure role.
- Determine whether an infrastructure is in an authorization regime or experimental pilot before relying on its functions.

## Sources and caveats

The EU DLT Pilot Regime [SRC-003] establishes a specific pilot framework for DLT market infrastructures. It should not be read as a general financial-services exemption. The workbench does not define a market-infrastructure rulebook or operator.
