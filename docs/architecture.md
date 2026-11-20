# Enterprise reference architecture

This reference describes a European financial institution's synthetic €100M bond and tokenised-deposit workflow. It separates rights, records and operational controls. The architecture is illustrative: boxes do not imply deployed systems or integrations.

## 1. Ecosystem and actors

```mermaid
flowchart LR
  Issuer[Issuer / bank] --> TA[Transfer agent]
  Issuer --> Reg[Authoritative legal register]
  Issuer --> Core[Core banking & treasury]
  Investor[Institutional investor] --> Cust[Custodian]
  Cust --> Wallet[Segregated investor wallet]
  TA --> KYC[KYC / eligibility service]
  Venue[Trading venue / OMS] --> Coord[Settlement coordinator]
  Reg --> Coord
  KYC --> Coord
  Core --> Cash[Deposit token ledger]
  Wallet --> Asset[Tokenised security ledger]
  Coord --> Asset
  Coord --> Cash
  Asset --> Recon[Reconciliation & evidence]
  Cash --> Recon
  Core --> Recon
  Reg --> Recon
```

## 2. End-to-end target architecture

```mermaid
flowchart LR
  subgraph Business[Business & legal authority]
    Mandate[Mandate and governance] --> Instrument[Bond terms and authority]
    Instrument --> Register[Legal / transfer register]
    Investors[Investor onboarding and eligibility]
  end
  subgraph Control[Institutional control plane]
    Trade[Trade capture] --> Policy[Eligibility, limits and policy]
    Policy --> Coord[Settlement coordinator]
    Coord --> Auth[Custody authorization]
    Coord --> Recover[Exception and recovery workflow]
  end
  subgraph Execution[Execution systems]
    Sec[Tokenised asset ledger]
    Money[Tokenised cash ledger]
    Bank[Core banking / payment rails]
  end
  subgraph Assurance[Financial state and assurance]
    Books[Accounting and reporting]
    Recon[Reconciliation]
    Evidence[Evidence and operational decisions]
  end
  Register --> Trade
  Investors --> Policy
  Coord --> Sec
  Coord --> Money
  Money <--> Bank
  Sec --> Recon
  Money --> Recon
  Bank --> Recon
  Register --> Recon
  Recon --> Evidence
  Recover --> Evidence
  Books --> Recon
```

## 3. Application and component architecture

```mermaid
flowchart TB
  UI[Investor / operator channels] --> API[API gateway and identity]
  API --> Trade[Trade and lifecycle services]
  Trade --> Policy[Eligibility and authority policy]
  Trade --> Orchestrator[Settlement coordinator]
  Orchestrator --> AssetAdapter[Asset-ledger adapter]
  Orchestrator --> CashAdapter[Cash-ledger / payment adapter]
  Orchestrator --> Custody[Custody policy adapter]
  AssetAdapter --> Asset[DLT asset network]
  CashAdapter --> Cash[Deposit ledger / payment network]
  CashAdapter --> Core[Core banking]
  Trade --> TA[Transfer-agent adapter]
  TA --> Register[Legal register]
  Asset --> Events[Event intake and canonical transaction IDs]
  Cash --> Events
  Core --> Events
  Events --> Reconcile[Reconciliation and exception queue]
  Reconcile --> Evidence[Evidence store and reporting]
```

Adapters above are conceptual; this repository implements none of them. ISO 20022 mappings should preserve business identifiers, parties, amounts, status and references rather than treating a message acknowledgement as settlement finality.

## 4. Asset and cash settlement sequence

```mermaid
sequenceDiagram
  participant V as Venue / OMS
  participant C as Coordinator
  participant P as Eligibility & policy
  participant K as Custody policy
  participant A as Asset ledger
  participant M as Money system
  participant R as Reconciliation
  V->>C: Confirmed trade + idempotency key
  C->>P: Check parties, instrument, limits and positions
  P-->>C: Eligible / rejected with evidence
  C->>K: Request maker-checker authorization
  K-->>C: Approved under current authority
  C->>A: Reserve then deliver asset leg
  C->>M: Reserve then pay cash leg
  A-->>C: Observed state and finality evidence
  M-->>C: Payment status and bank reference
  C->>R: Compare register, asset, deposit and bank records
  R-->>C: Matched / exception
  C-->>V: Operational status and evidence references
```

For coordinated systems, steps can produce an intermediate state; a failed cash leg does not prove atomic rollback. Only claim atomic DvP if one legally and technically defined mechanism covers both obligations.

## 5. Tokenised securities lifecycle

```mermaid
stateDiagram-v2
  [*] --> Designed
  Designed --> Authorized: terms, authority, governing law
  Authorized --> Registered: register and agent appointed
  Registered --> Issued: supply and token controls reconciled
  Issued --> Distributed: subscription and investor eligibility
  Distributed --> Held: custody and wallet allocation
  Held --> Traded: matched secondary trade
  Traded --> Settled: asset and cash obligations completed
  Settled --> Serviced: coupon / corporate action
  Serviced --> Held
  Settled --> Redeemed: maturity and redemption paid
  Redeemed --> Closed: token cancelled; register updated
```

Legal ownership, beneficial entitlement, token representation and operational ledger state are separate concepts. Issuance, transfer, servicing and redemption must be reconciled to the applicable legal instrument and register rules.

## 6. Institutional custody architecture

```mermaid
flowchart TB
  Initiator[Trade / operations initiator] --> Screening[Policy, limits, allowlist]
  Screening --> Maker[Maker approval]
  Maker --> Checker[Independent checker]
  Checker --> Quorum{2-of-3 available?}
  Quorum -->|yes| Sign[HSM or MPC signing boundary]
  Quorum -->|no| Block[Block and open incident]
  Sign --> Network[Authorized network submission]
  Network --> Monitor[Independent status observation]
  Monitor --> Reconcile[Position reconciliation]
  Compromise[Suspected compromise] --> Pause[Emergency pause / revoke authority]
  Pause --> Recover[Recovery, key rotation and fresh approvals]
  Recover --> Reconcile
```

Separate treasury, operational and client wallets; set authority by role and transaction limit. Recovery, signer independence, backups, key rotation and business continuity require tested procedures. This diagram specifies no production cryptographic scheme.

## 7. Multi-ledger interoperability

```mermaid
flowchart LR
  subgraph L1[Institution A boundary]
    A1[Asset ledger A]
    C1[Custody A]
  end
  subgraph L2[Institution B boundary]
    A2[Asset ledger B]
    C2[Custody B]
  end
  subgraph Coordination[Shared coordination / messaging]
    Msg[Authenticated instruction and status]
    Idem[Canonical IDs and replay control]
    Obs[Independent observations]
  end
  A1 <--> Msg
  Msg <--> A2
  C1 --> Msg
  C2 --> Msg
  Msg --> Idem
  A1 --> Obs
  A2 --> Obs
  Obs --> Breaks[Reconciliation and breaks]
```

Interoperability can mean common APIs, messaging, shared coordination, atomic synchronisation or a bridge. Those mechanisms have different trust and finality properties. Do not infer cross-ledger atomicity from message delivery.

## 8. Deployment and trust boundaries

```mermaid
flowchart TB
  subgraph Bank[Bank-controlled zone]
    IAM[Identity and privileged access]
    Core[Core banking / payment systems]
    API[Integration gateway]
    Orchestrator[Settlement services]
    HSM[HSM / custody policy boundary]
    Audit[Monitoring and evidence]
  end
  subgraph Partners[Contracted participant zones]
    TA[Transfer agent]
    Custodian[External custodian]
    Venue[Trading venue]
  end
  subgraph Network[DLT / scheme boundary]
    Node[Institution node or participant endpoint]
    Peers[Other participants / synchronizers]
  end
  IAM --> API
  Core <--> API
  API --> Orchestrator
  Orchestrator --> HSM
  Orchestrator <--> Venue
  Orchestrator <--> TA
  Orchestrator <--> Custodian
  HSM --> Node
  Node <--> Peers
  Orchestrator --> Audit
  Node --> Audit
```

Classify data, minimize outbound fields, authenticate all boundaries and record external dependencies. Deployment regions, availability objectives, recovery time and recovery point objectives are institution-specific and intentionally not fabricated here.

## Digital money and settlement models

| Model | Liability / account | Ledger relationship | Key operational questions |
|---|---|---|---|
| Deposit mirror | Customer bank deposit | Core banking remains authoritative; token balance mirrors a controlled position | How are holds, transfers, redemption, reversals and ledger divergence synchronized? |
| Omnibus deposit | Bank deposit in pooled account | Tokenised subledger assigns positions against pooled funds | Who owns the account claim; how are beneficial entitlements, insolvency treatment and breaks handled? |
| Wholesale CBDC / reserves | Central bank money, subject to scheme | Access-controlled central-bank-money representation | Which institutions may hold it, during what hours, under which scheme and legal rules? |
| Regulated stablecoin | Issuer liability backed under its framework | Token ledger and issuer reserve/redemption records | Reserve quality, redemption access, issuer and settlement exposure? |
| Existing payment rails | Existing account and payment claims | Cash leg remains on established payment infrastructure | How are timing gaps, irrevocability, liquidity and failed-leg recovery handled? |

No model universally provides legal finality or suits all institutions. Payment-versus-payment and delivery-versus-payment need an explicit rulebook and settlement mechanism that cover the linked obligations.

## DLT qualitative selection matrix

| Profile | Privacy / visibility | Permissioning & identity | Governance / operations | Contract and interoperability considerations |
|---|---|---|---|---|
| Besu | Ethereum-style shared state; privacy depends on architecture | Configurable private-network and node permissioning | Consortium configuration, node operations and upgrades | EVM contracts; integration with Ethereum tooling; no assumed legal finality |
| Fabric | Permissioned channels and private data collections | Membership Service Providers and organizational identities | Endorsement, channel and peer governance create operational choices | Chaincode model; cross-channel visibility is constrained by design |
| Canton | Contract visibility is scoped to participants | Party and participant model with synchronizer governance | Participant operations and synchronization dependencies | Daml smart contracts and cross-domain coordination; validate topology and governance |
| Ethereum | Public chain state is broadly observable | Public participation with protocol-level account identity | Public validator ecosystem and external fee / congestion dependencies | EVM smart contracts and broad ecosystem; privacy cannot be assumed |
| Quorum | Deployment-dependent privacy controls | Permissioned network patterns | Assess currently supported distribution, maintenance and operations | Ethereum-compatible lineage; verify implementation-specific capabilities |
| Stellar | Public ledger visibility | Public network with issuer and account controls | Protocol and validator ecosystem dependencies | Asset and payment primitives; assess privacy and asset-control needs |
| Avalanche | Varies by network / deployment choice | Network-specific validator and participant configuration | Assess selected network governance and cross-network dependency | EVM options and subnet / inter-network considerations; verify selected profile |
| Hedera | Public network state visibility varies by service | Public network, account controls and service governance | Governing Council and network service dependencies | Token and consensus services; assess governance and participant fit |

This is a qualitative prompt for architecture evaluation, not a performance ranking, vendor certification or due-diligence substitute. Consult the [official Besu](https://besu.hyperledger.org/), [Fabric](https://hyperledger-fabric.readthedocs.io/), [Canton](https://docs.digitalasset.com/), [Ethereum](https://ethereum.org/developers/docs/), [Quorum](https://consensys.io/quorum), [Stellar](https://developers.stellar.org/), [Avalanche](https://docs.avax.network/), and [Hedera](https://docs.hedera.com/) sources for the selected version and deployment model.

## Non-functional requirements to define before implementation

- Security: threat model, identity assurance, signing authority, key recovery, audit access and software supply chain.
- Resilience: availability objectives, dependency failure modes, recovery time / point objectives and tested incident exercises.
- Performance: workload-specific volume, latency and burst targets established with stakeholders; no benchmark is asserted here.
- Privacy: data classification, visibility policy, lawful disclosure, evidence scoping and retention.
- Interoperability: canonical transaction identifiers, message schemas, duplicate handling, status semantics and reconciliation windows.
- Governance: participant admission, change approval, scheme rules, incident authority and service-provider oversight.
- Compliance: institution-specific legal and regulatory assessment; this architecture does not determine compliance.
