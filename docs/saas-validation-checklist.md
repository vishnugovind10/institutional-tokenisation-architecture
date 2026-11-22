# SaaS release validation checklist

This checklist is required before enabling the service for a real institutional pilot. Passing frontend CI is not equivalent to passing these checks.

## Identity and session

- [ ] Email confirmation is required and recovery URLs resolve only to approved origins.
- [ ] Sign-up, sign-in, sign-out, invalid password and disabled-user flows behave correctly.
- [ ] Access tokens refresh before expiry; refresh failure returns the user to sign-in.
- [ ] Session state is cleared on sign-out and cannot be reused after revocation.
- [ ] MFA and enterprise identity federation are configured at the identity provider before institutional access.

## Tenant isolation (negative tests)

Create two organisations, A and B, with distinct users. For every request below, use a valid JWT from A and attempt to access B's UUIDs.

- [ ] List memberships: user A sees only their own memberships (or memberships where A is owner/admin).
- [ ] List organisations: user A cannot retrieve organisation B.
- [ ] List, read, update and export assessments: user A cannot read or mutate B's records.
- [ ] Call `save_assessment` with B's organisation ID and with an assessment ID belonging to B: request is rejected.
- [ ] Read audit events for B: request is rejected.
- [ ] Attempt direct INSERT/UPDATE/DELETE on audit events: denied.
- [ ] Attempt assessment write as reviewer and viewer: denied.
- [ ] Attempt invitation as editor/reviewer/viewer: denied.
- [ ] Attempt invitation for organisation B while acting as admin in A: denied.
- [ ] Confirm invited user receives membership only after accepting the correct organisation invite.

## Decision record integrity

- [ ] Confirm each saved assessment contains input snapshot, output snapshot, engine version, record version, actor and timestamps.
- [ ] Update an assessment and verify record version increments exactly once.
- [ ] Verify the database creates one audit event per successful create/update.
- [ ] Verify failed writes do not create audit events.
- [ ] Compare client output with independently recomputed output for the same engine version.
- [ ] Confirm a submitter cannot approve or reject their own assessment, including after editing an assessment before submission.

## Operational readiness

- [ ] Backup and point-in-time recovery configured; perform a restore test.
- [ ] Database region, retention and deletion policy approved.
- [ ] Alerting, rate limits, log retention and incident escalation tested.
- [ ] Edge Function secrets and CORS origin verified.
- [ ] Security review and penetration test completed.
- [ ] Data-processing, confidentiality and customer-contract requirements reviewed.

## Explicit release blocker

Do not process confidential, personal, commercially sensitive or regulated institutional information until all applicable checks above are complete and the remaining limitations in [SECURITY.md](../SECURITY.md) have been accepted by the service owner and customer.
