import { describe, expect, it } from 'vitest';
import { collateralScenarioCatalog, createCollateralState, executeCollateralAction, runCollateralScenario } from './collateral';

describe('collateral allocation lifecycle', () => {
  it('allocates at haircut-adjusted value and completes delivery, discharge, release and reconciliation', () => {
    const allocated = executeCollateralAction(createCollateralState(), 'allocate', { assetId: 'BOND-001' });
    expect(allocated.stage).toBe('ALLOCATED');
    expect(allocated.allocatedValueEur).toBe(760_000);
    const delivered = executeCollateralAction(allocated, 'deliver', { deliveryConfirmed: true });
    expect(delivered.stage).toBe('DELIVERED');
    expect(delivered.cashAvailableEur).toBe(5_000);
    const discharged = executeCollateralAction(delivered, 'discharge', { dischargeConfirmed: true });
    const released = executeCollateralAction(discharged, 'release');
    expect(released.stage).toBe('RELEASED');
    expect(executeCollateralAction(released, 'reconcile').records.inventory).toBe('FREE');
  });
  it('rejects release before an authorized obligation discharge', () => {
    const delivered = executeCollateralAction(executeCollateralAction(createCollateralState(), 'allocate', { assetId: 'BOND-001' }), 'deliver', { deliveryConfirmed: true });
    expect(() => executeCollateralAction(delivered, 'release')).toThrow('obligation is discharged');
    expect(delivered.stage).toBe('DELIVERED');
  });
  it('blocks ineligible and already encumbered assets', () => {
    const state = createCollateralState();
    expect(() => executeCollateralAction(state, 'allocate', { assetId: 'BOND-002' })).toThrow('ineligible');
    expect(() => executeCollateralAction(state, 'allocate', { assetId: 'BOND-003' })).toThrow('encumbered');
  });
  it('blocks a stale valuation and insufficient cash without changing prior state', () => {
    const state = createCollateralState();
    state.assets[0].observedAt = '2026-11-15';
    expect(() => executeCollateralAction(state, 'allocate', { assetId: 'BOND-001' })).toThrow('stale');
    const allocated = executeCollateralAction(createCollateralState(), 'allocate', { assetId: 'BOND-001' });
    allocated.cashAvailableEur = 0;
    expect(() => executeCollateralAction(allocated, 'deliver', { deliveryConfirmed: true })).toThrow('Insufficient settlement cash');
    expect(allocated.stage).toBe('ALLOCATED');
  });
  it('detects a mismatch across the independently modeled records', () => {
    const result = runCollateralScenario('reconciliation-mismatch');
    expect(result.status).toBe('PASS');
    expect(result.outcome).toContain('custody: observed AVAILABLE');
    expect(result.state.stage).toBe('DELIVERED');
  });
  it('provides the five specified failure scenarios', () => {
    expect(collateralScenarioCatalog.map(s => s.id)).toEqual(['insufficient-cash','ineligible-collateral','failed-delivery','stale-data','reconciliation-mismatch']);
    expect(collateralScenarioCatalog.every(s => runCollateralScenario(s.id).status === 'PASS')).toBe(true);
  });
});
