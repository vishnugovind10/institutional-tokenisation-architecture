# Institutional custody

## Architecture question

How do asset segregation, delegated authority, signing controls, availability and recovery remain governed across routine operations and incidents?

## Design implications

- Define client, treasury and operational wallet hierarchy and accountabilities.
- Separate maker and checker roles; enforce policy, limits and allowlists before signing.
- Model HSM service availability separately from MPC signer threshold and quorum.
- Document key rotation, revocation, emergency pause, recovery and business continuity.
- Reconcile custody records to token and legal-register records.

## Sources and caveats

The project source register currently contains no HSM/MPC standard or vendor control framework. Therefore this report describes design questions, not product claims. DORA [SRC-001] is an EU digital operational resilience legal source; its application to a particular entity and service requires legal and supervisory analysis. The simulator performs no cryptographic signing.
