# Contributing

Contributions should improve the architecture workbench, deterministic domain behavior, research traceability or developer experience.

## Development

```bash
npm ci
npm test
npm run build
npm run dev
```

## Expectations

- Keep business rules in `src/domain`, not React components.
- Use integer minor units for money and safe integer validation.
- Add tests for state transitions, failure paths, schema imports and export contents.
- Preserve distinctions between legal register, token state, bank deposit, token cash, custody authorization, operational completion and legal finality.
- Cite primary sources for external claims and record limitations.
- Do not add live credentials or imply an external integration unless one is implemented and tested against a valid sandbox.
- Synthetic fixtures only; do not submit personal, customer or production data.

## Pull requests

Describe user-visible behavior, domain semantics, verification commands and any new limitations. Include before/after screenshots for material user-interface changes where practical.
