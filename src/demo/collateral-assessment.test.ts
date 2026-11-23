import { describe, expect, it } from 'vitest';
import { createCollateralDemo } from './collateral-assessment';

describe('reproducible collateral committee demonstration', () => {
  it('creates a stable HOLD memo with economics, system ownership, remediation and lifecycle evidence', () => {
    const first = createCollateralDemo();
    const second = createCollateralDemo();
    expect(first.json).toEqual(second.json);
    expect(first.json.record.verdict).toBe('HOLD');
    expect(first.json.record.decision.economicSummary.materialDeteriorations).toHaveLength(1);
    expect(first.json.lifecycle.events.map(event => event.status)).toEqual(['BLOCKED', 'APPLIED', 'APPLIED', 'APPLIED', 'APPLIED', 'APPLIED']);
    expect(first.json.lifecycle.stage).toBe('RELEASED');
    expect(first.json.scenarios.every(item => item.status === 'PASS')).toBe(true);
    expect(first.markdown).toContain('## Committee resolution');
    expect(first.markdown).toContain('## Proposed architecture and system of record');
    expect(first.markdown).toContain('## Dependencies and evidence quality');
    expect(first.markdown).toContain('COL-EVT-001');
    expect(first.markdown).toContain('## Committee actions before reconsideration');
  });
});
