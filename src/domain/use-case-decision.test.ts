import { describe, expect, it } from 'vitest';
import { defaultUseCaseInputs, evaluateUseCase, simulateSingleGateChange, type DependencyId, type UseCaseInputs } from './use-case-decision';

const ready: UseCaseInputs = {
  ...defaultUseCaseInputs,
  baselineEvidence: 'Current reconciliation takes 3 business days and requires 18 staff hours per issuance.',
  baselineEvidenceSource: 'Operations baseline · 90 day period', baselineEvidenceQuality: 'user-confirmed',
  tokenisationMechanisms: ['shared-state', 'conditional-settlement'],
  existingSystemGap: 'Current APIs do not provide a consistent shared position state across the transfer agent, custodian and investor records.',
  conventionalAlternative: 'insufficient', alternativeEvidenceQuality: 'user-confirmed',
  economics: { ...defaultUseCaseInputs.economics, baselineCostPerEventEur: 420, proposedCostPerEventEur: 310, baselineHoursPerEvent: 6, proposedHoursPerEvent: 4, baselineExceptionRatePct: 8, proposedExceptionRatePct: 5, oneTimeImplementationCostEur: 10000, annualOperatingCostEur: 2000, sourceNote: 'Baseline from operations; target is a hypothesis.', baselineQuality: 'user-confirmed', proposedQuality: 'assumption' },
  dependencyEvidence: Object.fromEntries(Object.keys(defaultUseCaseInputs.dependencyEvidence).map(id => [id, 'user-confirmed'])) as Record<DependencyId, 'user-confirmed'>,
  readiness: {
    legalRegisterKnown: true,
    transferRulesDefined: true,
    settlementRouteKnown: true,
    accountableOwner: true,
    pilotCounterpartyIdentified: true,
    usableDataAvailable: true,
    collateralEligibilityKnown: true,
    custodyControlKnown: true,
    technologyBoundaryDefined: true,
  },
};
describe('use-case decision logic', () => {
  it('returns NO-GO when no operational problem is identified', () => {
    const result = evaluateUseCase({ ...ready, frictions: [] });
    expect(result.verdict).toBe('NO-GO');
    expect(result.gates.find(g => g.id === 'problem')?.status).toBe('OPEN');
  });
  it('holds when a problem has no baseline evidence', () => {
    expect(evaluateUseCase({ ...ready, baselineEvidence: '' }).verdict).toBe('HOLD');
  });
  it('holds when legal, settlement or operating prerequisites remain open', () => {
    const result = evaluateUseCase({ ...ready, readiness: { ...ready.readiness, transferRulesDefined: false, settlementRouteKnown: false } });
    expect(result.verdict).toBe('HOLD');
    expect(result.gates.filter(g => g.status === 'OPEN').length).toBe(2);
  });
  it('holds when tokenisation has no stated mechanism or simpler alternatives are not assessed', () => {
    expect(evaluateUseCase({ ...ready, tokenisationMechanisms: [] }).verdict).toBe('HOLD');
    expect(evaluateUseCase({ ...ready, existingSystemGap: '' }).verdict).toBe('HOLD');
  });
  it('returns NO-GO when the stated workflow is not recurring and multi-party', () => {
    const result = evaluateUseCase({ ...ready, annualEvents: 0, participants: 1 });
    expect(result.verdict).toBe('NO-GO');
    expect(result.gates.find(g => g.id === 'scale')?.status).toBe('OPEN');
  });
  it('returns a bounded pilot candidate only when every gate is ready', () => {
    const result = evaluateUseCase(ready);
    expect(result.verdict).toBe('PILOT CANDIDATE');
    expect(result.pilotScope.length).toBeGreaterThan(0);
    expect(result.architecture.length).toBeGreaterThan(0);
    expect(result.successMeasures.length).toBeGreaterThan(0);
  });
  it('changes the pilot design for collateral rather than assuming token issuance', () => {
    const result = evaluateUseCase({ ...ready, useCase: 'collateral' });
    expect(result.pilotScope[0]).toContain('margin-call');
    expect(result.architecture.some(line => line.includes('pledge execution'))).toBe(true);
    expect(result.failureScenarios.map(s => s.id)).toEqual(['insufficient-cash','ineligible-collateral','failed-delivery','stale-data','reconciliation-mismatch']);
  });
  it('keeps the recommendation on HOLD until sourced economics and baseline are confirmed', () => {
    const result = evaluateUseCase({ ...ready, baselineEvidenceQuality: 'assumption', economics: { ...ready.economics, baselineQuality: 'assumption' } });
    expect(result.verdict).toBe('HOLD');
    expect(result.gates.find(g => g.id === 'economic')?.status).toBe('OPEN');
    expect(result.assumptions.some(x => x.includes('assumption'))).toBe(true);
  });
  it('returns NO-GO when user-confirmed conventional infrastructure is adequate', () => {
    expect(evaluateUseCase({ ...ready, conventionalAlternative: 'adequate' }).verdict).toBe('NO-GO');
  });
  it('annualises measured differences without claiming they were achieved', () => {
    const result = evaluateUseCase(ready);
    expect(result.economicSummary.annualCostSavingEur).toBe(16_500);
    expect(result.economicSummary.annualHoursSaved).toBe(300);
    expect(result.economicSummary.netFirstYearEur).toBe(4_500);
    expect(result.economicSummary.netRecurringEur).toBe(14_500);
    expect(result.economicSummary.note).toContain('not realised savings');
  });
  it('shows one-gate sensitivity without mutating original inputs', () => {
    const held = { ...ready, readiness: { ...ready.readiness, custodyControlKnown: false } };
    expect(evaluateUseCase(held).verdict).toBe('HOLD');
    expect(simulateSingleGateChange(held, 'custody')).toBe('PILOT CANDIDATE');
    expect(held.readiness.custodyControlKnown).toBe(false);
  });
  it('does not invent economic values when testing an open economic gate', () => {
    const noCosts = { ...ready, economics: { ...ready.economics, oneTimeImplementationCostEur: null, annualOperatingCostEur: null } };
    expect(simulateSingleGateChange(noCosts, 'economic')).toBe('HOLD');
    expect(noCosts.economics.oneTimeImplementationCostEur).toBeNull();
  });
});
