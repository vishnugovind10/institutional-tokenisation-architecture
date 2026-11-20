# About this project

**Institutional Tokenisation Architecture Workbench** is an independently developed architecture and engineering workbench for tokenised securities, digital money, custody, settlement and interconnected financial market infrastructure.

Tokenisation is not only an issuance or blockchain problem. Institutions must coordinate legal rights, financial state, cash liabilities, investor eligibility, custody authority, liquidity, settlement finality, existing systems, reconciliation and governance.

## Implemented capabilities

- Versioned architecture configuration with browser-local storage and JSON import/export.
- Deterministic control findings with PASS, WARNING, FAIL, UNASSESSED and NOT APPLICABLE outcomes.
- Distinct legal-register, token-asset, bank-cash, token-cash, omnibus backing and entitlement records.
- Lifecycle commands for issuance authorization, minting, eligibility, funding, subscription, DvP, coupons, redemption and reconciliation.
- Fourteen reproducible synthetic scenario definitions.
- Comparison of two saved configurations and configuration-derived JSON, Markdown and CSV outputs.
- Searchable primary-source register with claims, dates when known, caveats and source classification.

## Runtime and author

The browser application uses React, TypeScript and Vite. Pure domain functions drive validation, lifecycle transitions, scenario outcomes and generated outputs. No login, backend, external service credentials or network transactions are required.

Author: Vishnu Govind, Founder, Universal Ventures. The author line does not imply a client engagement, endorsement or deployment.

- [GitHub profile](https://github.com/vishnugovind10)
- [LinkedIn](https://www.linkedin.com/in/vishnu-govind)
- [Universal Ventures thesis](https://universal-ventures.vercel.app/thesis)

## Project boundaries

The workbench is a reference implementation using synthetic scenarios. It does not implement banking, trading, DLT, custody or payment adapters; HSM or MPC cryptography; regulatory compliance assessment; legal ownership records; or production deployment. See [LIMITATIONS.md](LIMITATIONS.md).
