import { describe, expect, it } from 'vitest';
import { defaultUseCaseInputs, evaluateUseCase, type UseCaseInputs } from './use-case-decision';

const ready: UseCaseInputs = {
  ...defaultUseCaseInputs,
  baselineEvidence: 'Current reconciliation takes 3 business days and requires 18 staff hours per issuance.',
  tokenisationMechanisms: ['shared-state', 'conditional-settlement'],
  existingSystemGap: 'Current APIs do not provide a consistent shared position state across the transfer agent, custodian and investor records.',
  readiness: {
    legalRegisterKnown: true,
    transferRulesDefined: true,
    settlementRouteKnown: true,
    accountableOwner: true,
    pilotCounterpartyIdentified: true,
    usableDataAvailable: true,
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
  it('holds when the workflow is not a multi-party process', () => {
    const result = evaluateUseCase({ ...ready, annualEvents: 0, participants: 1 });
    expect(result.verdict).toBe('HOLD');
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
  });
});
