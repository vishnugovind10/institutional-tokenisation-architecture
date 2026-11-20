# Tokenised securities

## Architecture question

How do legal instrument terms, register authority, beneficial entitlement, token position and servicing obligations remain aligned across issuance, transfer and redemption?

## Design implications

- Define the governing instrument, authoritative register, issuer authority, transfer agent and transfer restrictions before minting.
- Bound token supply to authorized issuance and reconcile mint/burn operations to register events.
- Record investor eligibility at onboarding and re-check it when restrictions apply to transfers.
- Treat token balances as operational representations until legal documentation defines their legal effect.
- Model coupons and redemption against instrument terms and named payment/liquidity responsibilities.

## Sources and caveats

This repository's source register includes the EU DLT Pilot Regime [SRC-003], which establishes a specific pilot framework for authorized market infrastructures, not a general tokenization authorization. Applicable securities law, register status and investor rights depend on jurisdiction and instrument terms. The workbench does not determine legal ownership.
