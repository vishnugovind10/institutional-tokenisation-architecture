import { describe, expect, it } from 'vitest';
import { defaultUseCaseInputs, evaluateUseCase } from './use-case-decision';
import { createDecisionRecord, decisionRecordMarkdown } from './decision-record';

describe('portable decision record', () => {
  it('captures version, rationale, system-of-record owners, dependencies and review history', () => {
    const inputs = { ...defaultUseCaseInputs, baselineEvidence: 'Measured for a 90 day observation period.', baselineEvidenceSource: 'Operations report · Q3', economics: { ...defaultUseCaseInputs.economics, oneTimeImplementationCostEur: 25000, annualOperatingCostEur: 6000 } };
    const decision = evaluateUseCase(inputs);
    const record = createDecisionRecord({ title: 'Collateral pilot assessment', version: 3, inputs, decision,
      reviewHistory: [{ action: 'REVIEWED', at: '2026-11-22T10:00:00Z', actor: 'Risk reviewer', comment: 'Revisit stale-data control.' }] });
    expect(record.version).toBe(3);
    expect(record.verdict).toBe('HOLD');
    expect(record.architecture.systemOfRecord.map(item => item.domain)).toContain('Asset inventory');
    expect(record.dependencies.some(item => item.id === 'custody')).toBe(true);
    expect(record.reviewHistory[0].comment).toContain('stale-data');
  });

  it('exports a committee memo with the executive decision and net economics', () => {
    const inputs = { ...defaultUseCaseInputs, economics: { ...defaultUseCaseInputs.economics, oneTimeImplementationCostEur: 25000, annualOperatingCostEur: 6000 } };
    const record = createDecisionRecord({ title: 'Synthetic assessment', version: 1, inputs, decision: evaluateUseCase(inputs) });
    const markdown = decisionRecordMarkdown(record);
    expect(markdown).toContain('## Executive recommendation');
    expect(markdown).toContain('## Dependencies and evidence quality');
    expect(markdown).toContain('Net first year');
    expect(markdown).toContain('not independently verified');
  });
});
