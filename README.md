# Institutional Tokenisation Architecture

An independently developed reference architecture and browser workbench for institutional tokenised securities, digital money, custody and settlement.

**Scenario:** a synthetic €100 million institutional bond with a €5 million investor trade settled using tokenised bank deposits. All data and transaction evidence in the simulator are synthetic.

**Live workbench:** [institutional-tokenisation-architec.vercel.app](https://institutional-tokenisation-architec.vercel.app)

> This is a reference architecture and deterministic demonstration. It is not a production banking platform, legal opinion, compliance product, regulated settlement venue, institutional deployment or claim of endorsement. No existing portfolio project is technically integrated with this workbench.

## Explore

- **Overview and architecture:** layered map with selectable component boundaries.
- **Securities lifecycle:** origination through servicing and redemption.
- **Digital money:** deposit mirror and omnibus models, CBDC, stablecoins and existing rails.
- **DLT selection:** qualitative profiles for Besu, Fabric, Canton, Ethereum, Quorum, Stellar, Avalanche and Hedera.
- **Custody and operations:** wallet segregation, authorization, resilience and recovery.
- **Decisions:** ten illustrative ADRs.
- **Settlement workbench:** change architecture assumptions and inject five deterministic failure cases.

Detailed diagrams, architecture profiles and non-functional requirements are in [`docs/architecture.md`](docs/architecture.md). Full ADR context, alternatives, trade-offs and limitations are in [`docs/decisions.md`](docs/decisions.md).

## Run locally

Requires Node.js 20 or newer.

```bash
npm ci
npm test
npm run build
npm run dev
```

## Simulator behavior

The workbench models independent asset-register, asset-ledger, core-banking, deposit-ledger, custody, coordinator and reconciliation responsibilities. It reports asset and cash status, custody authorization, technical finality, reconciliation, evidence references and recovery guidance.

| Scenario | Expected decision |
|---|---|
| Normal | Operationally completed in the synthetic model; legal finality remains not assessed |
| Cash-leg failure | Exception and modeled release of asset reservation |
| Signing quorum unavailable | Blocked before settlement |
| Duplicate payment instruction | Duplicate suppressed using an illustrative idempotency key; one payment proceeds |
| Finality uncertainty | Pending; no completion or blind retry |
| Reconciliation mismatch | Exception; closeout prevented |

The atomic/coordinated choice is an architecture input. Selecting “atomic” does not establish that an implementation provides cross-system atomic settlement. Token/network finality, operational completion and legal finality are deliberately separate.

## Architecture boundaries

- The legal register and governing documents define rights. Token balances are operational representations unless legal arrangements expressly establish otherwise.
- Under a **deposit mirror** model, core banking remains authoritative for customer deposits and synchronization is controlled.
- Under an **omnibus** model, the pooled account and token subledger have distinct responsibilities; liability, entitlement, reconciliation and redemption arrangements need definition.
- Payment asset, settlement model, ledger topology and privacy requirements are institution and scheme dependent.
- HSM/MPC choices require threat-model and operating-model analysis. This frontend simulates authorization outcomes only; it performs no cryptographic signing.
- Integration adapters, ISO 20022 mappings, external networks and ledgers are conceptual. No backend, custody connection, payment instruction or network transaction is implemented.

## Portfolio lineage

These independent repositories informed the architecture map. They are linked references, not imported modules or tested integrations.

| Repository | Observed scope used as architectural reference |
|---|---|
| [tokenize-stack](https://github.com/vishnugovind10/tokenize-stack) | README describes restricted assets, custody policies, DvP settlement, servicing, reconciliation and audit trails. |
| [institutional-digital-collateral-stack](https://github.com/vishnugovind10/institutional-digital-collateral-stack) | README describes an executable settlement control plane spanning eligibility, valuation, custody authorization, DvP, liquidity, synchronization and evidence. |
| [institutional-settlement-state-machine](https://github.com/vishnugovind10/institutional-settlement-state-machine) | README frames settlement as coordinated transitions across compliance, availability, authorization, finality, liquidity, reconciliation and evidence. |
| [rwa-interoperability-assurance](https://github.com/vishnugovind10/rwa-interoperability-assurance) | README describes synthetic cross-chain supply, entitlement, authority, eligibility, finality, reconciliation and recovery assurance. |
| [institutional-digital-asset-assurance](https://github.com/vishnugovind10/institutional-digital-asset-assurance) | README describes executable control/evidence evaluation and go-live decision support. |
| [proof-of-control](https://github.com/vishnugovind10/proof-of-control) | README describes custody availability, signer failures, solvency, recovery and reconciliation as separate dimensions. |
| [institutional-digital-finance-architecture](https://github.com/vishnugovind10/institutional-digital-finance-architecture) | Reference lifecycle from authority and decisioning through execution, settlement, financial state, liquidity and assurance. |
| [canton-proofpack](https://github.com/vishnugovind10/canton-proofpack) | Party-scoped ledger evidence and explicit boundaries on what can be independently derived. |
| [liquid-proofpack](https://github.com/vishnugovind10/liquid-proofpack) | Scoped confidential attestations and evidence verification. |
| [temporal-liquidity-risk](https://github.com/vishnugovind10/temporal-liquidity-risk) | Liquidity timing and temporal exposure reference. |

No source code from these projects is copied into this repository.

## Primary references

Sources checked 20 November 2026. Initiative status below is time-sensitive; descriptions distinguish announced/experimental work from production claims.

- BIS, [Project Agorá](https://www.bis.org/project/agora) — ongoing public-private experiment exploring a shared programmable platform for wholesale cross-border payments; accessed 20 Nov 2026.
- Swift, [ledger ready for initial use](https://www.swift.com/about-us/media-centre/press-releases/swifts-blockchain-ledger-ready-use-17-banks-set-pioneer-tokenised-cross-border-payments-trusted-global-infrastructure) — Swift's July 2026 announcement said early adopters were preparing pilots; accessed 20 Nov 2026.
- Bank of England, [Retail Payments Infrastructure Board](https://www.bankofengland.co.uk/payments/the-national-payments-vision/retail-payments-infrastructure-board) — meeting updates reference the Global British Tokenised Deposits initiative; this page does not by itself establish production status; accessed 20 Nov 2026.
- [Hyperledger Besu documentation](https://besu.hyperledger.org/); [Hyperledger Fabric documentation](https://hyperledger-fabric.readthedocs.io/); [Canton documentation](https://docs.digitalasset.com/).
- European Union, [Regulation (EU) 2022/2554 (DORA)](https://eur-lex.europa.eu/eli/reg/2022/2554/oj) — legal text; applicability and implementation obligations require institution-specific legal assessment.
- CPMI, [Tokenisation in the context of money and other assets](https://www.bis.org/cpmi/publ/d225.htm).

## Quality and scope

The simulator is pure TypeScript and deterministic. Unit coverage exercises the normal flow and all five failure scenarios. GitHub Actions runs the unit suite and production build. The app has no runtime backend, external API keys, authentication or persistent data store.

## License

MIT. See [LICENSE](LICENSE).
