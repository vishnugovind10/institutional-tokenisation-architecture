import { describe, expect, it } from 'vitest';
import { defaultUseCaseInputs, evaluateUseCase, simulateSingleGate, simulateSingleGateChange, SENSITIVITY_HYPOTHESIS_LABEL, type DependencyId, type UseCaseInputs } from './use-case-decision';

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
    expect(result.economicSummary.note).toContain('not measured outcomes');
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
  it('requires the selected primary objective to improve, even when another metric improves', () => {
    const result = evaluateUseCase({ ...ready, economics: { ...ready.economics, primaryObjective: 'time', proposedHoursPerEvent: 7.8 } });
    expect(result.economicSummary.improvements.some(item => item.includes('Cost / event'))).toBe(true);
    expect(result.economicSummary.deteriorations.some(item => item.includes('Hours / event'))).toBe(true);
    expect(result.gates.find(g => g.id === 'economic')?.status).toBe('OPEN');
    expect(result.verdict).toBe('HOLD');
  });
  it('keeps material deteriorations open until explicitly accepted and reports them after acceptance', () => {
    const tradeoff = { ...ready.economics, proposedCostPerEventEur: 378, proposedHoursPerEvent: 7.8, proposedExceptionRatePct: 16 };
    const held = evaluateUseCase({ ...ready, economics: tradeoff });
    expect(held.economicSummary.primaryObjectiveImproved).toBe(true);
    expect(held.economicSummary.materialDeteriorations).toHaveLength(2);
    expect(held.economicSummary.tradeoffAccepted).toBe(false);
    expect(held.gates.find(g => g.id === 'economic')?.status).toBe('OPEN');
    const accepted = evaluateUseCase({ ...ready, economics: { ...tradeoff, acceptMaterialDeterioration: true } });
    expect(accepted.verdict).toBe('PILOT CANDIDATE');
    expect(accepted.rationale).toContain('Accepted material trade-offs');
    expect(accepted.decisionDrivers.some(item => item.includes('explicitly accepted'))).toBe(true);
  });
  it('applies configurable deterioration tolerance thresholds', () => {
    const result = evaluateUseCase({ ...ready, economics: { ...ready.economics, proposedCostPerEventEur: 400, proposedHoursPerEvent: 6.3, proposedExceptionRatePct: 8.5, timeDeteriorationTolerancePct: 10, exceptionDeteriorationTolerancePct: 10 } });
    expect(result.economicSummary.deteriorations).toHaveLength(2);
    expect(result.economicSummary.materialDeteriorations).toHaveLength(0);
    expect(result.gates.find(g => g.id === 'economic')?.status).toBe('READY');
  });
  it('treats a rise from a zero baseline as a material deterioration and zero-to-zero as unchanged', () => {
    const rising = evaluateUseCase({ ...ready, economics: { ...ready.economics, baselineCostPerEventEur: 0, proposedCostPerEventEur: 5 } });
    expect(rising.economicSummary.deteriorations.some(item => item.includes('increased from zero'))).toBe(true);
    expect(rising.economicSummary.materialDeteriorations.some(item => item.includes('Cost / event'))).toBe(true);
    expect(rising.gates.find(g => g.id === 'economic')?.status).toBe('OPEN');
    const flat = evaluateUseCase({ ...ready, economics: { ...ready.economics, baselineCostPerEventEur: 0, proposedCostPerEventEur: 0 } });
    expect(flat.economicSummary.primaryObjectiveImproved).toBe(false);
    expect(flat.economicSummary.materialDeteriorations.some(item => item.includes('Cost / event'))).toBe(false);
  });
  it('excludes negative and non-finite economic values from comparison and the economic gate', () => {
    const invalid = evaluateUseCase({ ...ready, economics: { ...ready.economics, baselineCostPerEventEur: -1, proposedCostPerEventEur: 2, baselineHoursPerEvent: Number.NaN, proposedHoursPerEvent: 2, oneTimeImplementationCostEur: Number.POSITIVE_INFINITY } });
    expect(invalid.economicSummary.annualCostSavingEur).toBeNull();
    expect(invalid.economicSummary.annualHoursSaved).toBeNull();
    expect(invalid.gates.find(g => g.id === 'economic')?.status).toBe('OPEN');
    const invalidRate = evaluateUseCase({ ...ready, economics: { ...ready.economics, baselineExceptionRatePct: 120 } });
    expect(invalidRate.economicSummary.annualExceptionsAvoided).toBeNull();
  });
  it('does not emit infinite annualized figures when finite inputs overflow arithmetic', () => {
    const overflow = evaluateUseCase({ ...ready, annualEvents: 1e308, economics: { ...ready.economics, baselineCostPerEventEur: 1e308, proposedCostPerEventEur: 0 } });
    expect(overflow.economicSummary.annualCostSavingEur).toBeNull();
    expect(overflow.economicSummary.netRecurringEur).toBeNull();
  });
  it('falls back to the default objective for malformed persisted values', () => {
    const malformed = evaluateUseCase({ ...ready, economics: { ...ready.economics, primaryObjective: 'unrecognized' as UseCaseInputs['economics']['primaryObjective'] } });
    expect(malformed.economicSummary.primaryObjective).toBe('cost');
    expect(malformed.economicSummary.primaryObjectiveImproved).toBe(true);
  });
  it('bounds negative, non-finite and extreme deterioration tolerances', () => {
    const bounded = evaluateUseCase({ ...ready, economics: { ...ready.economics, proposedHoursPerEvent: 6.3, timeDeteriorationTolerancePct: -25, proposedExceptionRatePct: 8.5, exceptionDeteriorationTolerancePct: Number.POSITIVE_INFINITY } });
    expect(bounded.economicSummary.materialDeteriorations.some(item => item.includes('Hours / event'))).toBe(true);
    expect(bounded.economicSummary.materialDeteriorations.some(item => item.includes('Exception rate'))).toBe(false);
    const overCap = evaluateUseCase({ ...ready, economics: { ...ready.economics, proposedHoursPerEvent: 7.8, timeDeteriorationTolerancePct: 1e99 } });
    expect(overCap.economicSummary.materialDeteriorations.some(item => item.includes('Hours / event'))).toBe(false);
  });
  it('keeps the primary objective requirement when secondary metrics improve and tolerances are extreme', () => {
    const result = evaluateUseCase({ ...ready, economics: { ...ready.economics, primaryObjective: 'time', proposedHoursPerEvent: 7.8, proposedCostPerEventEur: 0, proposedExceptionRatePct: 0, timeDeteriorationTolerancePct: 1e99, costDeteriorationTolerancePct: 1e99, exceptionDeteriorationTolerancePct: 1e99 } });
    expect(result.economicSummary.improvements).toHaveLength(2);
    expect(result.economicSummary.primaryObjectiveImproved).toBe(false);
    expect(result.gates.find(g => g.id === 'economic')?.status).toBe('OPEN');
  });
  it('labels one-gate sensitivity as hypothetical and does not mutate assessed evidence', () => {
    const held = { ...ready, baselineEvidenceQuality: 'assumption' as const, readiness: { ...ready.readiness, custodyControlKnown: false } };
    const result = simulateSingleGate(held, 'custody');
    expect(result.hypothetical).toBe(true);
    expect(result.label).toBe(SENSITIVITY_HYPOTHESIS_LABEL);
    expect(result.label).toContain('No evidence has been independently verified or upgraded.');
    expect(held.baselineEvidenceQuality).toBe('assumption');
  });
});
