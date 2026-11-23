import { createCollateralState, executeCollateralAction, runCollateralScenario } from '../domain/collateral';
import { createDecisionRecord, decisionRecordMarkdown } from '../domain/decision-record';
import { defaultUseCaseInputs, evaluateUseCase, simulateSingleGate, type UseCaseInputs } from '../domain/use-case-decision';

export const COLLATERAL_DEMO_ID = 'COLLATERAL-DEMO-001';
export const collateralAssessmentInputs: UseCaseInputs = {
  ...defaultUseCaseInputs,
  useCase: 'collateral',
  annualEvents: 120,
  participants: 4,
  frictions: ['reconciliation', 'settlement-delay', 'manual-eligibility'],
  baselineEvidence: 'SYNTHETIC: the illustrative workflow takes 6.5 hours per allocation, costs €420 per event and records a 9% exception rate.',
  baselineEvidenceSource: 'Synthetic demonstration dataset COLLATERAL-DEMO-001; illustrative 90-day observation window.',
  baselineEvidenceQuality: 'assumption',
  existingSystemGap: 'SYNTHETIC: assume the incumbent API process needs manual eligibility checks and independent position reconciliation across four parties.',
  conventionalAlternative: 'insufficient',
  alternativeEvidenceQuality: 'assumption',
  economics: {
    ...defaultUseCaseInputs.economics,
    baselineCostPerEventEur: 420,
    proposedCostPerEventEur: 310,
    baselineHoursPerEvent: 6.5,
    proposedHoursPerEvent: 7,
    baselineExceptionRatePct: 9,
    proposedExceptionRatePct: 10,
    oneTimeImplementationCostEur: 8_000,
    annualOperatingCostEur: 3_000,
    primaryObjective: 'cost',
    costDeteriorationTolerancePct: 10,
    timeDeteriorationTolerancePct: 10,
    exceptionDeteriorationTolerancePct: 10,
    acceptMaterialDeterioration: false,
    sourceNote: 'SYNTHETIC: every baseline and proposed value is illustrative; none is measured or independently verified.',
    baselineQuality: 'assumption',
    proposedQuality: 'assumption',
  },
  dependencyOwners: {
    ...defaultUseCaseInputs.dependencyOwners,
    authority: 'Legal and collateral documentation', rights: 'Collateral Operations', eligibility: 'Collateral Risk',
    custody: 'Custody Operations', technology: 'Architecture', cash: 'Settlement Operations', owner: 'Collateral Operations',
    counterparty: 'Pilot Sponsor', data: 'Operations Analytics',
  },
  dependencyEvidence: Object.fromEntries(Object.keys(defaultUseCaseInputs.dependencyEvidence).map(id => [id, 'assumption'])) as UseCaseInputs['dependencyEvidence'],
  readiness: {
    legalRegisterKnown: true, transferRulesDefined: false, settlementRouteKnown: true, accountableOwner: true,
    pilotCounterpartyIdentified: false, usableDataAvailable: false, collateralEligibilityKnown: false,
    custodyControlKnown: false, technologyBoundaryDefined: false,
  },
};

export function createCollateralDemo() {
  const decision = evaluateUseCase(collateralAssessmentInputs);
  const custodySensitivity = simulateSingleGate(collateralAssessmentInputs, 'custody');
  const record = createDecisionRecord({
    title: 'Tokenised collateral allocation and settlement — committee assessment',
    version: 1,
    inputs: collateralAssessmentInputs,
    decision,
    at: '2026-11-23T12:00:00.000Z',
  });

  let lifecycle = createCollateralState();
  const attempts: { action: string; status: string; eventId: string; detail: string }[] = [];
  const attempt = (action: Parameters<typeof executeCollateralAction>[1], options: Parameters<typeof executeCollateralAction>[2] = {}) => {
    const result = executeCollateralAction(lifecycle, action, options);
    lifecycle = result.state;
    attempts.push({ action, status: result.status, eventId: result.event.id, detail: result.event.detail });
    return result;
  };
  attempt('allocate', { assetId: 'BOND-002' });
  attempt('allocate', { assetId: 'BOND-001' });
  attempt('deliver', { deliveryConfirmed: true });
  attempt('discharge', { dischargeConfirmed: true });
  attempt('release');
  attempt('reconcile');

  const scenarios = (['insufficient-cash', 'ineligible-collateral', 'failed-delivery', 'stale-data', 'reconciliation-mismatch'] as const).map(runCollateralScenario);
  const json = { demoId: COLLATERAL_DEMO_ID, record, lifecycle, attempts, scenarios };
  const markdown = [
    decisionRecordMarkdown(record),
    '## Committee resolution', '',
    '**Decision: HOLD.** Continue discovery and a bounded shadow-mode design only. Do not authorize production execution or claim realized savings. The selected cost objective improves in the illustrative model, while the proposed exception rate worsens by 11.1%, beyond its 10% tolerance; that deterioration has not been accepted. Baseline and target values are synthetic assumptions, so the economic gate remains open.', '',
    '### Economic trade-offs', '',
    `- Modeled annual cost reduction: €${decision.economicSummary.annualCostSavingEur?.toFixed(2)} across ${collateralAssessmentInputs.annualEvents} events.`,
    `- Modeled annual time change: ${decision.economicSummary.annualHoursSaved?.toFixed(2)} hours (negative means more time required).`,
    `- Modeled annual exception change: ${decision.economicSummary.annualExceptionsAvoided?.toFixed(2)} (negative means more exceptions).`,
    `- Modeled net first year: €${decision.economicSummary.netFirstYearEur?.toFixed(2)}; net recurring: €${decision.economicSummary.netRecurringEur?.toFixed(2)}.`,
    '- Primary objective: cost. Tolerances: cost 10%, time 10%, exception rate 10%. Material deterioration acceptance: no.',
    '- These are counterfactual model outputs, not observed results or evidence upgrades.', '',
    '## Sensitivity check', '',
    custodySensitivity.label, '',
    `If the custody-control gate were satisfied as a what-if, the result would be ${custodySensitivity.verdict}; remaining open gates: ${custodySensitivity.remainingOpenGates.join(', ')}.`, '',
    '## Lifecycle demonstration', '',
    'Synthetic state only. A rejected allocation for ineligible BOND-002 is recorded before the valid BOND-001 lifecycle completes.', '',
    '| Event | Action | Status | Detail |', '| --- | --- | --- | --- |',
    ...lifecycle.events.map(event => `| ${event.id} | ${event.action} | ${event.status} | ${event.detail.replace(/\|/g, '\\|')} |`), '',
    `Final modeled stage: **${lifecycle.stage}**. Settlement cash remaining: **€${lifecycle.cashAvailableEur.toLocaleString()}**.`, '',
    '## Failure scenario results', '',
    '| Scenario | Control result | Attempt history | Remediation owner |', '| --- | --- | --- | --- |',
    ...scenarios.map(item => `| ${item.name} | ${item.status} — ${item.outcome.replace(/\|/g, '\\|')} | ${item.state.events.map(event => `${event.action} ${event.status}`).join('; ')} | ${item.remediation.split(':')[0]} |`), '',
    '## Committee actions before reconsideration', '',
    '1. Legal and collateral documentation: confirm authoritative register, enforceable rights, transfer and release rules.',
    '2. Collateral Risk and Operations: approve eligible asset criteria, valuation source, haircut and concentration rules.',
    '3. Custody Operations: evidence asset control, availability, segregation and delivery/release confirmations.',
    '4. Settlement Operations: document the cash route, funding, cut-offs, failure recovery and finality evidence.',
    '5. Architecture: assign systems of record, interface boundaries, identity, freshness and reconciliation responsibilities.',
    '6. Operations Analytics: replace synthetic values with sourced, like-for-like baseline and pilot measurement plan.',
    '7. Pilot Sponsor: obtain counterparty commitment and define bounded shadow-mode scope, exit criteria and accountable incident owners.', '',
    '## Reproduction', '',
    `Demo fixture: ${COLLATERAL_DEMO_ID} · assessment version 1 · engine ${record.engineVersion} · fixed generation time ${record.generatedAt}.`,
    'Run `npm run sample:collateral` from the repository root to regenerate this memo and the portable JSON package. The simulator uses fixed synthetic state and deterministic rules.', '',
  ].join('\n');
  return { json, markdown };
}
