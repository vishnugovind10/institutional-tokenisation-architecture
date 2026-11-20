# Digital money

## Architecture question

What claim does the settlement asset represent, who owes it, what ledger records it, and how can it be funded, transferred and redeemed?

## Design implications

- Deposit mirror: keep core banking authoritative, synchronize controlled token balances, and check availability in both records.
- Omnibus: separate pooled assets from token entitlement liabilities and reconcile coverage; define account ownership and insolvency treatment.
- CBDC/reserves: access and settlement depend on the central-bank scheme and participant eligibility.
- Stablecoin: assess issuer obligations, reserve, redemption and custody risk; do not equate it to a bank deposit.
- Existing payment rails: coordinate asset and cash legs while exposing timing gaps and recovery duties.

## Sources and caveats

CPMI's tokenisation report [SRC-007] provides policy analysis. Project Agorá [SRC-004] is an experiment exploring a shared programmable platform; it is not an available production settlement service. MiCA [SRC-002] applies to specified crypto-assets and providers; classification of a particular tokenized instrument is fact-specific. This workbench does not determine the applicable liability or regulatory regime.
