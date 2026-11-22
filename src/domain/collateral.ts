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
export type CollateralActionResult = { action: CollateralAction; status: 'APPLIED' | 'BLOCKED'; state: CollateralState; event: CollateralEvent; error: { code: 'ACTION_BLOCKED'; message: string } | null };
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

function record(state: CollateralState, action: string, detail: string, status: CollateralEvent['status'] = 'APPLIED'): CollateralEvent {
  const seq = state.events.length + 1;
  const event = { id: `COL-EVT-${String(seq).padStart(3, '0')}`, action, status, detail, evidenceId: `COL-EVID-${String(seq).padStart(3, '0')}`, at: state.asOfDate };
  state.events.push(event);
  return event;
}
function withinFreshness(observedAt: string, asOfDate: string, maxAgeDays = 1) {
  const observed = Date.parse(`${observedAt}T00:00:00Z`), asOf = Date.parse(`${asOfDate}T00:00:00Z`);
  return Number.isFinite(observed) && Number.isFinite(asOf) && asOf >= observed && asOf - observed <= maxAgeDays * 86_400_000;
}
export function collateralAdjustedValue(asset: CollateralAsset) {
  return Math.floor(asset.marketValueEur * (1 - asset.haircutPct / 100));
}
function blocked(state: CollateralState, action: CollateralAction, message: string): CollateralActionResult {
  const event = record(state, action, message, 'BLOCKED');
  return { action, status: 'BLOCKED', state, event, error: { code: 'ACTION_BLOCKED', message } };
}
function applied(state: CollateralState, action: CollateralAction, detail: string): CollateralActionResult {
  const event = record(state, action, detail, 'APPLIED');
  return { action, status: 'APPLIED', state, event, error: null };
}

export function executeCollateralAction(state: CollateralState, action: CollateralAction, options: { assetId?: string; deliveryConfirmed?: boolean; dischargeConfirmed?: boolean } = {}): CollateralActionResult {
  const s = structuredClone(state);
  const reject = (message: string) => blocked(s, action, message);
  if (action === 'allocate') {
    if (s.stage !== 'OPEN' && s.stage !== 'RELEASED') return reject('Allocation requires an open collateral obligation.');
    const asset = s.assets.find(x => x.id === options.assetId);
    if (!asset) return reject('Select an asset from the available inventory.');
    if (!asset.eligible) return reject('Asset is ineligible under the selected agreement rules.');
    if (asset.encumbered) return reject('Asset is already encumbered and unavailable for allocation.');
    if (!withinFreshness(asset.observedAt, s.asOfDate)) return reject('Asset valuation or inventory data is stale; refresh its source observation.');
    const adjusted = collateralAdjustedValue(asset);
    if (adjusted < s.callAmountEur) return reject(`Haircut-adjusted collateral value €${adjusted.toLocaleString()} is below the call amount €${s.callAmountEur.toLocaleString()}.`);
    s.stage = 'ALLOCATED'; s.selectedAssetId = asset.id; s.allocatedValueEur = adjusted;
    s.records.agreement = 'ALLOCATION PROPOSED'; s.records.legalRegister = 'ALLOCATION PROPOSED'; s.records.inventory = 'RESERVED'; s.records.custody = 'RESERVED';
    return applied(s, action, `${asset.id} reserved at haircut-adjusted value €${adjusted.toLocaleString()} against a €${s.callAmountEur.toLocaleString()} obligation.`);
  }
  if (action === 'deliver') {
    if (s.stage !== 'ALLOCATED') return reject('Delivery requires an allocated and reserved asset.');
    if (s.cashAvailableEur < s.cashDueEur) return reject(`Insufficient settlement cash: €${s.cashAvailableEur.toLocaleString()} available; €${s.cashDueEur.toLocaleString()} due.`);
    if (!options.deliveryConfirmed) return reject('Delivery confirmation was not received; keep the obligation open and do not mark the asset mobilised.');
    s.stage = 'DELIVERED'; s.settledCashEur = s.cashDueEur; s.cashAvailableEur -= s.cashDueEur;
    s.records.agreement = 'DELIVERED'; s.records.legalRegister = 'DELIVERED'; s.records.inventory = 'PLEDGED'; s.records.custody = 'DELIVERED'; s.records.settlement = 'CONFIRMED';
    return applied(s, action, `Source delivery confirmed for ${s.selectedAssetId}; cash leg €${s.settledCashEur.toLocaleString()} settled.`);
  }
  if (action === 'discharge') {
    if (s.stage !== 'DELIVERED') return reject('Obligation discharge requires confirmed delivery.');
    if (!options.dischargeConfirmed) return reject('The obligation remains open until an authorized discharge confirmation is recorded.');
    s.stage = 'DISCHARGED'; s.obligationDischarged = true; s.records.agreement = 'DISCHARGED';
    return applied(s, action, 'Authorized obligation discharge recorded; collateral may now enter the release workflow.');
  }
  if (action === 'release') {
    if (s.stage !== 'DISCHARGED' || !s.obligationDischarged) return reject('Release is blocked until the obligation is discharged by an authorized source.');
    s.stage = 'RELEASED'; s.records.agreement = 'RELEASED'; s.records.legalRegister = 'RELEASED'; s.records.inventory = 'FREE'; s.records.custody = 'AVAILABLE'; s.records.settlement = 'RELEASE CONFIRMED';
    return applied(s, action, `${s.selectedAssetId} released after confirmed obligation discharge.`);
  }
  const expected = { agreement: s.stage === 'RELEASED' ? 'RELEASED' : s.stage === 'DISCHARGED' ? 'DISCHARGED' : s.stage === 'DELIVERED' ? 'DELIVERED' : s.stage === 'ALLOCATED' ? 'ALLOCATION PROPOSED' : 'OPEN', legalRegister: s.stage === 'RELEASED' ? 'RELEASED' : s.stage === 'ALLOCATED' ? 'ALLOCATION PROPOSED' : s.stage === 'DELIVERED' || s.stage === 'DISCHARGED' ? 'DELIVERED' : 'FREE', inventory: s.stage === 'RELEASED' || s.stage === 'OPEN' ? 'FREE' : s.stage === 'ALLOCATED' ? 'RESERVED' : 'PLEDGED', custody: s.stage === 'RELEASED' || s.stage === 'OPEN' ? 'AVAILABLE' : s.stage === 'ALLOCATED' ? 'RESERVED' : 'DELIVERED' };
  const differences = Object.entries(expected).filter(([key, value]) => s.records[key as keyof typeof expected] !== value).map(([key, value]) => `${key}: observed ${s.records[key as keyof typeof expected]}, expected ${value}`);
  if (differences.length) return reject(`Reconciliation break: ${differences.join('; ')}. Preserve source records and route to the record owner.`);
  return applied(s, action, 'Agreement, legal register, inventory and custody states reconcile at the current workflow stage.');
}

export function runCollateralScenario(id: CollateralScenarioId): CollateralScenarioResult {
  const state = createCollateralState();
  const attempt = (base: CollateralState, action: CollateralAction, options: Parameters<typeof executeCollateralAction>[2] = {}) => executeCollateralAction(base, action, options);
  switch (id) {
    case 'insufficient-cash': {
      state.cashAvailableEur = 0; const allocated = attempt(state, 'allocate', { assetId: 'BOND-001' }).state;
      const delivery = attempt(allocated, 'deliver', { deliveryConfirmed: true }); const message = delivery.error?.message || '';
      return { id, name: 'Insufficient settlement cash', status: delivery.status === 'BLOCKED' && message.includes('Insufficient settlement cash') && delivery.state.stage === 'ALLOCATED' ? 'PASS' : 'FAIL', outcome: message || 'Cash control did not block settlement.', remediation: 'Settlement Operations: restore and independently confirm the cash source before resubmitting.', state: delivery.state };
    }
    case 'ineligible-collateral': {
      const result = attempt(state, 'allocate', { assetId: 'BOND-002' }); const message = result.error?.message || '';
      return { id, name: 'Ineligible collateral', status: result.status === 'BLOCKED' && message.includes('ineligible') ? 'PASS' : 'FAIL', outcome: message || 'Eligibility control did not block allocation.', remediation: 'Collateral Operations: select an asset that meets agreement criteria and retain the rejection reason.', state: result.state };
    }
    case 'failed-delivery': {
      const allocated = attempt(state, 'allocate', { assetId: 'BOND-001' }).state;
      const delivery = attempt(allocated, 'deliver', { deliveryConfirmed: false }); const message = delivery.error?.message || '';
      return { id, name: 'Failed delivery', status: delivery.status === 'BLOCKED' && message.includes('confirmation was not received') && delivery.state.stage === 'ALLOCATED' ? 'PASS' : 'FAIL', outcome: message || 'Failed delivery was incorrectly marked complete.', remediation: 'Custody Operations: query authoritative delivery status and retry only after state is known.', state: delivery.state };
    }
    case 'stale-data': {
      state.assets[0].observedAt = '2026-11-15'; const result = attempt(state, 'allocate', { assetId: 'BOND-001' }); const message = result.error?.message || '';
      return { id, name: 'Stale valuation data', status: result.status === 'BLOCKED' && message.includes('stale') ? 'PASS' : 'FAIL', outcome: message || 'Stale input was not blocked.', remediation: 'Data Owner: fetch a fresh authorized valuation and inventory observation with source timestamp.', state: result.state };
    }
    case 'reconciliation-mismatch': {
      state.stage = 'DELIVERED'; state.selectedAssetId = 'BOND-001'; state.allocatedValueEur = collateralAdjustedValue(state.assets[0]);
      state.records = { agreement: 'DELIVERED', legalRegister: 'DELIVERED', inventory: 'PLEDGED', custody: 'AVAILABLE', settlement: 'CONFIRMED' };
      const result = attempt(state, 'reconcile'); const message = result.error?.message || '';
      return { id, name: 'Reconciliation mismatch', status: result.status === 'BLOCKED' && message.includes('Reconciliation break') ? 'PASS' : 'FAIL', outcome: message || 'Mismatched source records were not detected.', remediation: 'Operations: preserve all source observations and resolve with the agreement, inventory, custody and settlement owners.', state: result.state };
    }
  }
}
