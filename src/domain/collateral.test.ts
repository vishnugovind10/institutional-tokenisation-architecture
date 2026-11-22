import { describe, expect, it } from 'vitest';
import { collateralScenarioCatalog, createCollateralState, executeCollateralAction, runCollateralScenario } from './collateral';

describe('collateral allocation lifecycle', () => {
  it('allocates at haircut-adjusted value and completes delivery, discharge, release and reconciliation', () => {
    const allocatedResult = executeCollateralAction(createCollateralState(), 'allocate', { assetId: 'BOND-001' });
    expect(allocatedResult.status).toBe('APPLIED');
    const allocated = allocatedResult.state;
    expect(allocated.stage).toBe('ALLOCATED');
    expect(allocated.allocatedValueEur).toBe(760_000);
    const delivered = executeCollateralAction(allocated, 'deliver', { deliveryConfirmed: true }).state;
    expect(delivered.stage).toBe('DELIVERED');
    expect(delivered.cashAvailableEur).toBe(5_000);
    const discharged = executeCollateralAction(delivered, 'discharge', { dischargeConfirmed: true }).state;
    const released = executeCollateralAction(discharged, 'release').state;
    expect(released.stage).toBe('RELEASED');
    expect(executeCollateralAction(released, 'reconcile').state.records.inventory).toBe('FREE');
  });
  it('rejects release before an authorized obligation discharge', () => {
    const delivered = executeCollateralAction(executeCollateralAction(createCollateralState(), 'allocate', { assetId: 'BOND-001' }).state, 'deliver', { deliveryConfirmed: true }).state;
    const rejected = executeCollateralAction(delivered, 'release');
    expect(rejected.status).toBe('BLOCKED');
    expect(rejected.error?.message).toContain('obligation is discharged');
    expect(rejected.event.status).toBe('BLOCKED');
    expect(rejected.state.events[rejected.state.events.length - 1]?.id).toBe('COL-EVT-003');
    expect(delivered.stage).toBe('DELIVERED');
    expect(delivered.events).toHaveLength(2);
  });
  it('blocks ineligible and already encumbered assets', () => {
    const state = createCollateralState();
    const ineligible = executeCollateralAction(state, 'allocate', { assetId: 'BOND-002' });
    expect(ineligible.status).toBe('BLOCKED');
    expect(ineligible.event.detail).toContain('ineligible');
    const encumbered = executeCollateralAction(state, 'allocate', { assetId: 'BOND-003' });
    expect(encumbered.error?.message).toContain('encumbered');
    expect(state.events).toHaveLength(0);
  });
  it('blocks a stale valuation and insufficient cash without changing prior state', () => {
    const state = createCollateralState();
    state.assets[0].observedAt = '2026-11-15';
    const stale = executeCollateralAction(state, 'allocate', { assetId: 'BOND-001' });
    expect(stale.error?.message).toContain('stale');
    expect(stale.state.events[stale.state.events.length - 1]?.status).toBe('BLOCKED');
    const allocated = executeCollateralAction(createCollateralState(), 'allocate', { assetId: 'BOND-001' }).state;
    allocated.cashAvailableEur = 0;
    const noCash = executeCollateralAction(allocated, 'deliver', { deliveryConfirmed: true });
    expect(noCash.error?.message).toContain('Insufficient settlement cash');
    expect(noCash.state.events[noCash.state.events.length - 1]?.status).toBe('BLOCKED');
    expect(allocated.stage).toBe('ALLOCATED');
  });
  it('detects a mismatch across the independently modeled records', () => {
    const result = runCollateralScenario('reconciliation-mismatch');
    expect(result.status).toBe('PASS');
    expect(result.outcome).toContain('custody: observed AVAILABLE');
    expect(result.state.stage).toBe('DELIVERED');
    expect(result.state.events[result.state.events.length - 1]?.status).toBe('BLOCKED');
  });
  it('provides the five specified failure scenarios', () => {
    expect(collateralScenarioCatalog.map(s => s.id)).toEqual(['insufficient-cash','ineligible-collateral','failed-delivery','stale-data','reconciliation-mismatch']);
    expect(collateralScenarioCatalog.every(s => runCollateralScenario(s.id).status === 'PASS')).toBe(true);
    const ineligible = runCollateralScenario('ineligible-collateral').state.events;
    const failedDelivery = runCollateralScenario('failed-delivery').state.events;
    expect(ineligible[ineligible.length - 1]?.status).toBe('BLOCKED');
    expect(failedDelivery[failedDelivery.length - 1]?.status).toBe('BLOCKED');
  });
});
