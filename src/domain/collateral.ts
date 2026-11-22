export type CollateralStage = 'OPEN' | 'ALLOCATED' | 'DELIVERED' | 'DISCHARGED' | 'RELEASED';
export type CollateralAsset = { id: string; name: string; marketValueEur: number; haircutPct: number; eligible: boolean; encumbered: boolean; observedAt: string };
export type CollateralEvent = { id: string; action: string; status: 'APPLIED' | 'BLOCKED' | 'EXCEPTION'; detail: string; evidenceId: string; at: string };
export type CollateralState = {
  asOfDate: string;
  stage: CollateralStage;
  callAmountEur: number;
  cashDueEur: number;
  cashAvailableEur: number;
  assets: CollateralAsset[];
  selectedAssetId: string | null;
  allocatedValueEur: number;
  settledCashEur: number;
  obligationDischarged: boolean;
  records: { agreement: string; legalRegister: string; inventory: string; custody: string; settlement: string };
  events: CollateralEvent[];
};
export type CollateralAction = 'allocate' | 'deliver' | 'discharge' | 'release' | 'reconcile';
export type CollateralScenarioId = 'insufficient-cash' | 'ineligible-collateral' | 'failed-delivery' | 'stale-data' | 'reconciliation-mismatch';
export type CollateralScenarioResult = { id: CollateralScenarioId; name: string; status: 'PASS' | 'FAIL'; outcome: string; remediation: string; state: CollateralState };

export const collateralScenarioCatalog: { id: CollateralScenarioId; name: string; purpose: string }[] = [
  { id: 'insufficient-cash', name: 'Insufficient settlement cash', purpose: 'Cash shortfall blocks settlement without changing the allocated asset.' },
  { id: 'ineligible-collateral', name: 'Ineligible collateral', purpose: 'Agreement eligibility and haircut rules reject the asset before allocation.' },
  { id: 'failed-delivery', name: 'Failed delivery', purpose: 'No custody or settlement confirmation means the obligation remains open.' },
  { id: 'stale-data', name: 'Stale valuation data', purpose: 'A stale price or inventory observation blocks allocation.' },
  { id: 'reconciliation-mismatch', name: 'Reconciliation mismatch', purpose: 'Conflicting custody, register and settlement states remain visible as a break.' },
];

export function createCollateralState(): CollateralState {
  const date = '2026-11-22';
  return {
    asOfDate: date, stage: 'OPEN', callAmountEur: 500_000, cashDueEur: 7_500, cashAvailableEur: 12_500,
    assets: [
      { id: 'BOND-001', name: 'Sample government bond', marketValueEur: 800_000, haircutPct: 5, eligible: true, encumbered: false, observedAt: date },
      { id: 'BOND-002', name: 'Sample corporate note', marketValueEur: 350_000, haircutPct: 15, eligible: false, encumbered: false, observedAt: date },
      { id: 'BOND-003', name: 'Sample encumbered bond', marketValueEur: 600_000, haircutPct: 8, eligible: true, encumbered: true, observedAt: date },
    ],
    selectedAssetId: null, allocatedValueEur: 0, settledCashEur: 0, obligationDischarged: false,
    records: { agreement: 'OPEN', legalRegister: 'FREE', inventory: 'FREE', custody: 'AVAILABLE', settlement: 'NOT STARTED' }, events: [],
  };
}

function record(state: CollateralState, action: string, detail: string, status: CollateralEvent['status'] = 'APPLIED') {
  const seq = state.events.length + 1;
  state.events.push({ id: `COL-EVT-${String(seq).padStart(3, '0')}`, action, status, detail, evidenceId: `COL-EVID-${String(seq).padStart(3, '0')}`, at: state.asOfDate });
}
function withinFreshness(observedAt: string, asOfDate: string, maxAgeDays = 1) {
  const observed = Date.parse(`${observedAt}T00:00:00Z`), asOf = Date.parse(`${asOfDate}T00:00:00Z`);
  return Number.isFinite(observed) && Number.isFinite(asOf) && asOf >= observed && asOf - observed <= maxAgeDays * 86_400_000;
}
export function collateralAdjustedValue(asset: CollateralAsset) {
  return Math.floor(asset.marketValueEur * (1 - asset.haircutPct / 100));
}
function reject(s: CollateralState, action: string, message: string): never {
  record(s, action, message, 'BLOCKED');
  throw new Error(message);
}

export function executeCollateralAction(state: CollateralState, action: CollateralAction, options: { assetId?: string; deliveryConfirmed?: boolean; dischargeConfirmed?: boolean } = {}): CollateralState {
  const s = structuredClone(state);
  if (action === 'allocate') {
    if (s.stage !== 'OPEN' && s.stage !== 'RELEASED') reject(s, action, 'Allocation requires an open collateral obligation.');
    const asset = s.assets.find(x => x.id === options.assetId);
    if (!asset) reject(s, action, 'Select an asset from the available inventory.');
    if (!asset.eligible) reject(s, action, 'Asset is ineligible under the selected agreement rules.');
    if (asset.encumbered) reject(s, action, 'Asset is already encumbered and unavailable for allocation.');
    if (!withinFreshness(asset.observedAt, s.asOfDate)) reject(s, action, 'Asset valuation or inventory data is stale; refresh its source observation.');
    const adjusted = collateralAdjustedValue(asset);
    if (adjusted < s.callAmountEur) reject(s, action, `Haircut-adjusted collateral value €${adjusted.toLocaleString()} is below the call amount €${s.callAmountEur.toLocaleString()}.`);
    s.stage = 'ALLOCATED'; s.selectedAssetId = asset.id; s.allocatedValueEur = adjusted;
    s.records.agreement = 'ALLOCATION PROPOSED'; s.records.legalRegister = 'ALLOCATION PROPOSED'; s.records.inventory = 'RESERVED'; s.records.custody = 'RESERVED';
    record(s, action, `${asset.id} reserved at haircut-adjusted value €${adjusted.toLocaleString()} against a €${s.callAmountEur.toLocaleString()} obligation.`);
    return s;
  }
  if (action === 'deliver') {
    if (s.stage !== 'ALLOCATED') reject(s, action, 'Delivery requires an allocated and reserved asset.');
    if (s.cashAvailableEur < s.cashDueEur) reject(s, action, `Insufficient settlement cash: €${s.cashAvailableEur.toLocaleString()} available; €${s.cashDueEur.toLocaleString()} due.`);
    if (!options.deliveryConfirmed) reject(s, action, 'Delivery confirmation was not received; keep the obligation open and do not mark the asset mobilised.');
    s.stage = 'DELIVERED'; s.settledCashEur = s.cashDueEur; s.cashAvailableEur -= s.cashDueEur;
    s.records.agreement = 'DELIVERED'; s.records.legalRegister = 'DELIVERED'; s.records.inventory = 'PLEDGED'; s.records.custody = 'DELIVERED'; s.records.settlement = 'CONFIRMED';
    record(s, action, `Source delivery confirmed for ${s.selectedAssetId}; cash leg €${s.settledCashEur.toLocaleString()} settled.`);
    return s;
  }
  if (action === 'discharge') {
    if (s.stage !== 'DELIVERED') reject(s, action, 'Obligation discharge requires confirmed delivery.');
    if (!options.dischargeConfirmed) reject(s, action, 'The obligation remains open until an authorized discharge confirmation is recorded.');
    s.stage = 'DISCHARGED'; s.obligationDischarged = true; s.records.agreement = 'DISCHARGED';
    record(s, action, 'Authorized obligation discharge recorded; collateral may now enter the release workflow.');
    return s;
  }
  if (action === 'release') {
    if (s.stage !== 'DISCHARGED' || !s.obligationDischarged) reject(s, action, 'Release is blocked until the obligation is discharged by an authorized source.');
    s.stage = 'RELEASED'; s.records.agreement = 'RELEASED'; s.records.legalRegister = 'RELEASED'; s.records.inventory = 'FREE'; s.records.custody = 'AVAILABLE'; s.records.settlement = 'RELEASE CONFIRMED';
    record(s, action, `${s.selectedAssetId} released after confirmed obligation discharge.`);
    return s;
  }
  const expected = { agreement: s.stage === 'RELEASED' ? 'RELEASED' : s.stage === 'DISCHARGED' ? 'DISCHARGED' : s.stage === 'DELIVERED' ? 'DELIVERED' : s.stage === 'ALLOCATED' ? 'ALLOCATION PROPOSED' : 'OPEN', legalRegister: s.stage === 'RELEASED' ? 'RELEASED' : s.stage === 'ALLOCATED' ? 'ALLOCATION PROPOSED' : s.stage === 'DELIVERED' || s.stage === 'DISCHARGED' ? 'DELIVERED' : 'FREE', inventory: s.stage === 'RELEASED' || s.stage === 'OPEN' ? 'FREE' : s.stage === 'ALLOCATED' ? 'RESERVED' : 'PLEDGED', custody: s.stage === 'RELEASED' || s.stage === 'OPEN' ? 'AVAILABLE' : s.stage === 'ALLOCATED' ? 'RESERVED' : 'DELIVERED' };
  const differences = Object.entries(expected).filter(([key, value]) => s.records[key as keyof typeof expected] !== value).map(([key, value]) => `${key}: observed ${s.records[key as keyof typeof expected]}, expected ${value}`);
  if (differences.length) reject(s, action, `Reconciliation break: ${differences.join('; ')}. Preserve source records and route to the record owner.`);
  record(s, action, 'Agreement, legal register, inventory and custody states reconcile at the current workflow stage.');
  return s;
}

export function runCollateralScenario(id: CollateralScenarioId): CollateralScenarioResult {
  const state = createCollateralState();
  const blocked = (action: CollateralAction, options: Parameters<typeof executeCollateralAction>[2] = {}) => {
    try { return { state: executeCollateralAction(state, action, options), error: '' }; }
    catch (e) { return { state, error: e instanceof Error ? e.message : String(e) }; }
  };
  let error = '';
  switch (id) {
    case 'insufficient-cash': {
      state.cashAvailableEur = 0; const allocated = executeCollateralAction(state, 'allocate', { assetId: 'BOND-001' });
      try { executeCollateralAction(allocated, 'deliver', { deliveryConfirmed: true }); } catch (e) { error = e instanceof Error ? e.message : String(e); }
      return { id, name: 'Insufficient settlement cash', status: error.includes('Insufficient settlement cash') && allocated.stage === 'ALLOCATED' ? 'PASS' : 'FAIL', outcome: error || 'Cash control did not block settlement.', remediation: 'Settlement Operations: restore and independently confirm the cash source before resubmitting.', state: allocated };
    }
    case 'ineligible-collateral': {
      const result = blocked('allocate', { assetId: 'BOND-002' }); error = result.error;
      return { id, name: 'Ineligible collateral', status: error.includes('ineligible') ? 'PASS' : 'FAIL', outcome: error || 'Eligibility control did not block allocation.', remediation: 'Collateral Operations: select an asset that meets agreement criteria and retain the rejection reason.', state: result.state };
    }
    case 'failed-delivery': {
      const allocated = executeCollateralAction(state, 'allocate', { assetId: 'BOND-001' });
      try { executeCollateralAction(allocated, 'deliver', { deliveryConfirmed: false }); } catch (e) { error = e instanceof Error ? e.message : String(e); }
      return { id, name: 'Failed delivery', status: error.includes('confirmation was not received') && allocated.stage === 'ALLOCATED' ? 'PASS' : 'FAIL', outcome: error || 'Failed delivery was incorrectly marked complete.', remediation: 'Custody Operations: query authoritative delivery status and retry only after state is known.', state: allocated };
    }
    case 'stale-data': {
      state.assets[0].observedAt = '2026-11-15'; const result = blocked('allocate', { assetId: 'BOND-001' }); error = result.error;
      return { id, name: 'Stale valuation data', status: error.includes('stale') ? 'PASS' : 'FAIL', outcome: error || 'Stale input was not blocked.', remediation: 'Data Owner: fetch a fresh authorized valuation and inventory observation with source timestamp.', state: result.state };
    }
    case 'reconciliation-mismatch': {
      state.stage = 'DELIVERED'; state.selectedAssetId = 'BOND-001'; state.allocatedValueEur = collateralAdjustedValue(state.assets[0]);
      state.records = { agreement: 'DELIVERED', legalRegister: 'DELIVERED', inventory: 'PLEDGED', custody: 'AVAILABLE', settlement: 'CONFIRMED' };
      const result = blocked('reconcile'); error = result.error;
      return { id, name: 'Reconciliation mismatch', status: error.includes('Reconciliation break') ? 'PASS' : 'FAIL', outcome: error || 'Mismatched source records were not detected.', remediation: 'Operations: preserve all source observations and resolve with the agreement, inventory, custody and settlement owners.', state: result.state };
    }
  }
}
