export const DECISION_ENGINE_VERSION = 'use-case-decision/2.1';
export type UseCase = 'tokenised-bond' | 'fund-units' | 'private-credit' | 'collateral';
export type Friction = 'reconciliation' | 'settlement-delay' | 'fragmented-register' | 'servicing-cost' | 'distribution-friction' | 'manual-eligibility';
export type TokenisationMechanism = 'shared-state' | 'programmable-rights' | 'conditional-settlement' | 'lifecycle-automation' | 'portable-entitlements';
export type EvidenceQuality = 'user-confirmed' | 'assumption' | 'missing';
export type DependencyId = 'authority' | 'rights' | 'eligibility' | 'custody' | 'technology' | 'cash' | 'owner' | 'counterparty' | 'data';
export type Readiness = {
  legalRegisterKnown: boolean;
  transferRulesDefined: boolean;
  settlementRouteKnown: boolean;
  accountableOwner: boolean;
  pilotCounterpartyIdentified: boolean;
  usableDataAvailable: boolean;
  collateralEligibilityKnown: boolean;
  custodyControlKnown: boolean;
  technologyBoundaryDefined: boolean;
};
export type EconomicCase = {
  baselineCostPerEventEur: number | null;
  proposedCostPerEventEur: number | null;
  baselineHoursPerEvent: number | null;
  proposedHoursPerEvent: number | null;
  baselineExceptionRatePct: number | null;
  proposedExceptionRatePct: number | null;
  oneTimeImplementationCostEur: number | null;
  annualOperatingCostEur: number | null;
  sourceNote: string;
  baselineQuality: EvidenceQuality;
  proposedQuality: EvidenceQuality;
};
export type UseCaseInputs = {
  useCase: UseCase;
  annualEvents: number;
  participants: number;
  frictions: Friction[];
  baselineEvidence: string;
  baselineEvidenceSource: string;
  baselineEvidenceQuality: EvidenceQuality;
  tokenisationMechanisms: TokenisationMechanism[];
  existingSystemGap: string;
  alternativeEvidenceQuality: EvidenceQuality;
  conventionalAlternative: 'not-assessed' | 'adequate' | 'insufficient';
  economics: EconomicCase;
  dependencyOwners: Record<DependencyId, string>;
  dependencyEvidence: Record<DependencyId, EvidenceQuality>;
  readiness: Readiness;
};
export type Gate = { id: string; label: string; status: 'READY' | 'OPEN'; consequence: string; owner: string; evidenceQuality: EvidenceQuality };
export type Decision = {
  verdict: 'NO-GO' | 'HOLD' | 'PILOT CANDIDATE';
  rationale: string;
  gates: Gate[];
  pilotScope: string[];
  architecture: string[];
  successMeasures: string[];
  nextActions: string[];
  decisionDrivers: string[];
  economicSummary: { annualCostSavingEur: number | null; annualHoursSaved: number | null; annualExceptionsAvoided: number | null; netFirstYearEur: number | null; netRecurringEur: number | null; note: string };
  failureScenarios: { id: string; name: string; expected: string }[];
  assumptions: string[];
};

const owners: Record<DependencyId, string> = {
  authority: 'Legal', rights: 'Asset servicing', eligibility: 'Collateral operations', custody: 'Custody', technology: 'Technology',
  cash: 'Settlement operations', owner: 'Workflow operations', counterparty: 'Pilot sponsor', data: 'Data owner',
};
const qualities = (value: EvidenceQuality | undefined, fallback: EvidenceQuality = 'missing'): EvidenceQuality => value === 'user-confirmed' || value === 'assumption' || value === 'missing' ? value : fallback;
export const defaultUseCaseInputs: UseCaseInputs = {
  useCase: 'collateral', annualEvents: 150, participants: 5,
  frictions: ['reconciliation', 'settlement-delay', 'manual-eligibility'],
  baselineEvidence: 'SAMPLE ONLY: example collateral allocation takes 6.5 hours per event with manual eligibility checks and 9% exception rate.',
  baselineEvidenceSource: 'Synthetic product demo; replace with a sourced operational baseline.', baselineEvidenceQuality: 'assumption',
  tokenisationMechanisms: ['shared-state', 'conditional-settlement'],
  existingSystemGap: 'SAMPLE ONLY: current database and API workflow is assumed to require manual cross-party position reconciliation.',
  alternativeEvidenceQuality: 'assumption', conventionalAlternative: 'not-assessed',
  economics: { baselineCostPerEventEur: 420, proposedCostPerEventEur: 310, baselineHoursPerEvent: 6.5, proposedHoursPerEvent: 3.8, baselineExceptionRatePct: 9, proposedExceptionRatePct: 4, oneTimeImplementationCostEur: null, annualOperatingCostEur: null, sourceNote: 'Synthetic illustrative values only; replace with measured baseline and a costed target.', baselineQuality: 'assumption', proposedQuality: 'assumption' },
  dependencyOwners: { ...owners },
  dependencyEvidence: { authority: 'assumption', rights: 'assumption', eligibility: 'assumption', custody: 'missing', technology: 'missing', cash: 'assumption', owner: 'assumption', counterparty: 'missing', data: 'assumption' },
  readiness: { legalRegisterKnown: true, transferRulesDefined: false, settlementRouteKnown: true, accountableOwner: true, pilotCounterpartyIdentified: false, usableDataAvailable: true, collateralEligibilityKnown: false, custodyControlKnown: false, technologyBoundaryDefined: false },
};
export function mergeUseCaseInputs(value: Partial<UseCaseInputs> | null | undefined): UseCaseInputs {
  const saved = value || {};
  return { ...defaultUseCaseInputs, ...saved,
    economics: { ...defaultUseCaseInputs.economics, ...(saved.economics || {}) },
    dependencyOwners: { ...defaultUseCaseInputs.dependencyOwners, ...(saved.dependencyOwners || {}) },
    dependencyEvidence: { ...defaultUseCaseInputs.dependencyEvidence, ...(saved.dependencyEvidence || {}) },
    readiness: { ...defaultUseCaseInputs.readiness, ...(saved.readiness || {}) },
    frictions: Array.isArray(saved.frictions) ? saved.frictions : defaultUseCaseInputs.frictions,
    tokenisationMechanisms: Array.isArray(saved.tokenisationMechanisms) ? saved.tokenisationMechanisms : defaultUseCaseInputs.tokenisationMechanisms,
  };
}

export const mechanismOptions: [TokenisationMechanism, string][] = [
  ['shared-state', 'Multiple parties need a shared, consistently updated position or ownership state'],
  ['programmable-rights', 'Transfer eligibility, consent or restrictions must travel with the asset representation'],
  ['conditional-settlement', 'Asset and cash actions need coordinated, conditional execution across participants'],
  ['lifecycle-automation', 'Servicing or entitlement rules need to execute consistently across participating systems'],
  ['portable-entitlements', 'Participants need portable, verifiable representations of claims or entitlements'],
];
const frictionLabels: Record<Friction, string> = {
  reconciliation: 'Manual or delayed reconciliation', 'settlement-delay': 'Slow or uncertain settlement',
  'fragmented-register': 'Fragmented ownership or position records', 'servicing-cost': 'High servicing and administration effort',
  'distribution-friction': 'Restricted distribution or investor onboarding friction', 'manual-eligibility': 'Manual eligibility and transfer checks',
};
export const frictionOptions = Object.entries(frictionLabels) as [Friction, string][];
const dependencyLabels: Record<DependencyId, string> = {
  authority: 'Authoritative legal register identified', rights: 'Transfer, consent and eligibility rules defined', eligibility: 'Collateral eligibility and haircut rules defined',
  custody: 'Custody control and asset availability confirmed', technology: 'Data and integration boundaries defined', cash: 'Cash settlement route and recovery identified',
  owner: 'Accountable workflow and exception owner assigned', counterparty: 'Pilot counterparty identified', data: 'Representative workflow data available',
};
const dependencyConsequences: Record<DependencyId, string> = {
  authority: 'Name the authoritative legal register and the party empowered to change legal ownership.',
  rights: 'Document eligibility, transfer restrictions, consent, substitution and release rules.',
  eligibility: 'Identify the agreement, asset criteria, valuation source, haircut schedule, concentration rules and override authority.',
  custody: 'Confirm control location, segregation, encumbrance status, authorization and release authority.',
  technology: 'Map source data, interfaces, timestamps, identity, shared-state and reconciliation responsibilities.',
  cash: 'Specify the cash instrument, settlement operator, cut-offs, funding source and failed-settlement recovery path.',
  owner: 'Assign a named function that owns allocation exceptions, reconciliation and operational closeout.',
  counterparty: 'Identify a named participant willing to run a bounded shadow or controlled pilot.',
  data: 'Secure permissioned representative data and a repeatable source for like-for-like baseline comparison.',
};
function safeNonNegative(value: number | null): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;
}
function economicSummary(input: UseCaseInputs): Decision['economicSummary'] {
  const e = input.economics;
  const baseCost = safeNonNegative(e.baselineCostPerEventEur), proposedCost = safeNonNegative(e.proposedCostPerEventEur);
  const baseHours = safeNonNegative(e.baselineHoursPerEvent), proposedHours = safeNonNegative(e.proposedHoursPerEvent);
  const baseExceptions = safeNonNegative(e.baselineExceptionRatePct), proposedExceptions = safeNonNegative(e.proposedExceptionRatePct);
  const events = Math.max(0, Math.floor(input.annualEvents));
  const cost = baseCost !== null && proposedCost !== null ? (baseCost - proposedCost) * events : null;
  const hours = baseHours !== null && proposedHours !== null ? (baseHours - proposedHours) * events : null;
  const exceptions = baseExceptions !== null && proposedExceptions !== null ? (baseExceptions - proposedExceptions) / 100 * events : null;
  const implementation = safeNonNegative(e.oneTimeImplementationCostEur), runCost = safeNonNegative(e.annualOperatingCostEur);
  const netFirstYear = cost !== null && implementation !== null && runCost !== null ? cost - implementation - runCost : null;
  const netRecurring = cost !== null && runCost !== null ? cost - runCost : null;
  const hasAny = cost !== null || hours !== null || exceptions !== null;
  return { annualCostSavingEur: cost, annualHoursSaved: hours, annualExceptionsAvoided: exceptions, netFirstYearEur: netFirstYear, netRecurringEur: netRecurring, note: hasAny ? `Illustrative annualised operating difference over ${events} events; proposed values are ${qualities(e.proposedQuality)} and are not realised savings. Net returns include implementation and run costs only when both are entered.` : 'Add baseline and proposed values for at least one comparable measure.' };
}

export function evaluateUseCase(input: UseCaseInputs): Decision {
  const annualEvents = Number.isFinite(input.annualEvents) ? Math.max(0, Math.floor(input.annualEvents)) : 0;
  const participants = Number.isFinite(input.participants) ? Math.max(0, Math.floor(input.participants)) : 0;
  const evidenceQuality = qualities(input.baselineEvidenceQuality);
  const altQuality = qualities(input.alternativeEvidenceQuality);
  const e = input.economics || defaultUseCaseInputs.economics;
  const economics = { ...defaultUseCaseInputs.economics, ...e };
  const dependencyEvidence = { ...defaultUseCaseInputs.dependencyEvidence, ...(input.dependencyEvidence || {}) };
  const dependencyOwners = { ...owners, ...(input.dependencyOwners || {}) };
  const readiness = { ...defaultUseCaseInputs.readiness, ...(input.readiness || {}) };
  const compare = economicSummary({ ...input, annualEvents, economics });
  const economicPairs = [
    [economics.baselineCostPerEventEur, economics.proposedCostPerEventEur],
    [economics.baselineHoursPerEvent, economics.proposedHoursPerEvent],
    [economics.baselineExceptionRatePct, economics.proposedExceptionRatePct],
  ].filter(([base, proposed]) => safeNonNegative(base) !== null && safeNonNegative(proposed) !== null);
  const modeledImprovement = economicPairs.some(([base, proposed]) => Number(proposed) < Number(base));
  const hasEconomicComparison = economicPairs.length > 0;
  const sourceReady = input.baselineEvidenceSource.trim().length >= 3;
  const alternativesReady = input.existingSystemGap.trim().length >= 12 && altQuality === 'user-confirmed' && input.conventionalAlternative !== 'not-assessed';
  const economicReady = hasEconomicComparison && modeledImprovement && evidenceQuality === 'user-confirmed' && economics.baselineQuality === 'user-confirmed' && economics.sourceNote.trim().length >= 12 && safeNonNegative(economics.oneTimeImplementationCostEur) !== null && safeNonNegative(economics.annualOperatingCostEur) !== null;
  const gate = (id: DependencyId, ready: boolean, quality = dependencyEvidence[id]): Gate => ({
    id, label: dependencyLabels[id], status: ready && dependencyOwners[id].trim() ? 'READY' : 'OPEN',
    consequence: ready && dependencyOwners[id].trim() ? `Owner: ${dependencyOwners[id]}.` : !dependencyOwners[id].trim() ? `Assign an accountable owner. ${dependencyConsequences[id]}` : dependencyConsequences[id],
    owner: dependencyOwners[id].trim() || 'Unassigned', evidenceQuality: qualities(quality),
  });
  const gates: Gate[] = [
    { id: 'problem', label: 'Operational problem evidenced', status: input.frictions.length ? 'READY' : 'OPEN', consequence: 'Select a recurring, material workflow friction and define its observable effect.', owner: dependencyOwners.owner, evidenceQuality: evidenceQuality },
    { id: 'evidence', label: 'Baseline evidence has a traceable source', status: input.baselineEvidence.trim().length >= 12 && sourceReady && evidenceQuality === 'user-confirmed' ? 'READY' : 'OPEN', consequence: 'Capture a measurable baseline, source and observation period. A user-marked verified source is not independently checked by this application.', owner: dependencyOwners.data, evidenceQuality },
    { id: 'scale', label: 'Multi-party workflow is in scope', status: annualEvents >= 1 && participants >= 2 ? 'READY' : 'OPEN', consequence: 'Confirm recurring workflow volume and at least two participating parties.', owner: dependencyOwners.owner, evidenceQuality: qualities(dependencyEvidence.owner) },
    { id: 'mechanism', label: 'Tokenisation-specific mechanism identified', status: input.tokenisationMechanisms.length ? 'READY' : 'OPEN', consequence: 'Name the shared-state, programmable-rights, conditional-settlement, lifecycle or entitlement mechanism needed.', owner: dependencyOwners.technology, evidenceQuality: qualities(dependencyEvidence.technology) },
    { id: 'alternative', label: 'Conventional alternative directly compared', status: alternativesReady ? 'READY' : 'OPEN', consequence: input.conventionalAlternative === 'adequate' ? 'The current database/API or conventional process appears adequate; document a material differentiator before proposing tokenisation.' : 'Compare the incumbent workflow and conventional database/API option against the specific requirement; identify evidence for the stated gap.', owner: dependencyOwners.technology, evidenceQuality: altQuality },
    { id: 'economic', label: 'At least one measurable improvement is supported', status: economicReady ? 'READY' : 'OPEN', consequence: 'Enter a sourced baseline, proposed cost or time target, one-time implementation cost and annual operating cost. A lower target is a hypothesis until measured in a like-for-like pilot.', owner: dependencyOwners.owner, evidenceQuality: qualities(economics.baselineQuality) },
    gate('authority', readiness.legalRegisterKnown), gate('rights', readiness.transferRulesDefined),
    ...(input.useCase === 'collateral' ? [gate('eligibility', readiness.collateralEligibilityKnown), gate('custody', readiness.custodyControlKnown), gate('technology', readiness.technologyBoundaryDefined)] : []),
    gate('cash', readiness.settlementRouteKnown), gate('owner', readiness.accountableOwner),
    gate('counterparty', readiness.pilotCounterpartyIdentified), gate('data', readiness.usableDataAvailable),
  ];
  const open = gates.filter(g => g.status === 'OPEN');
  const noEconomicBenefit = hasEconomicComparison && !modeledImprovement && evidenceQuality === 'user-confirmed' && economics.baselineQuality === 'user-confirmed';
  const conventionalAdequate = input.conventionalAlternative === 'adequate' && altQuality === 'user-confirmed';
  const noGoReason = !input.frictions.length ? 'No operational friction has been identified; there is no evidenced problem for tokenisation to solve.'
    : annualEvents < 1 || participants < 2 ? 'The workflow is not recurring and multi-party at the stated scale; conventional infrastructure should remain the default.'
      : conventionalAdequate ? 'The assessed conventional alternative appears adequate and no defensible tokenisation-specific advantage has been established.'
        : noEconomicBenefit ? 'The sourced baseline and comparable proposed case show no improvement in the measured cost, time or exception outcomes.' : '';
  const verdict: Decision['verdict'] = noGoReason ? 'NO-GO' : open.length ? 'HOLD' : 'PILOT CANDIDATE';
  const reasonByGate = open.map(g => `${g.label}: ${g.consequence}`);
  const rationale = verdict === 'NO-GO' ? noGoReason
    : verdict === 'PILOT CANDIDATE' ? 'The sourced baseline, compared alternative, modeled outcome and named dependency owners support a bounded pilot proposal. The proposed outcome remains to be measured; this is not production approval.'
      : `${open.length} decision gate(s) remain open. Resolve the named evidence, economic, legal, custody, cash, data and operating dependencies before recommending a pilot.`;
  const blueprints: Record<UseCase, { scope: string[]; architecture: string[]; measures: string[] }> = {
    'tokenised-bond': { scope: ['One instrument and one issuance event', 'Investor eligibility and allocation', 'Authoritative register update and position reconciliation', 'One servicing event; exclude open secondary trading initially'], architecture: ['Keep the legally authoritative register explicit; treat ledger records as representations until legal analysis establishes otherwise.', 'Use existing cash rails unless counterparties can access agreed tokenised money.', 'Model asset and cash legs as coordinated unless both share a demonstrated atomic settlement boundary.'], measures: ['Time from allocation to reconciled positions', 'Manual reconciliation hours and exception rate', 'Settlement completion time and unresolved breaks', 'Cost per issuance or servicing event'] },
    'fund-units': { scope: ['One fund share class and transfer-agent workflow', 'Investor onboarding and eligibility', 'Subscription and redemption processing', 'Position reconciliation between transfer agent and token representation'], architecture: ['Keep the transfer agent and official unit register authoritative unless governing law says otherwise.', 'Model dealing cut-offs, NAV, gates and redemption liquidity.', 'Separate investor eligibility from technical wallet eligibility.'], measures: ['Subscription/redemption processing time', 'Transfer-agent reconciliation effort and breaks', 'Investor onboarding completion time', 'Failed or delayed dealing instructions'] },
    'private-credit': { scope: ['One loan or participation structure', 'Investor allocation and transfer-consent workflow', 'Servicing cashflow and position reporting', 'Exception handling for amendments and repayments'], architecture: ['Keep loan administration and contractual obligations authoritative; token transfer does not imply borrower obligation changes.', 'Model consent, eligibility, confidentiality and servicing-agent roles.', 'Reconcile distributions to the loan servicer.'], measures: ['Time to onboard and allocate investors', 'Time to reconcile loan positions and distributions', 'Servicing cost per reporting period', 'Transfer-consent turnaround and exception rate'] },
    collateral: { scope: ['One collateral agreement and one margin-call type', 'Check asset eligibility, valuation source, haircuts, concentration and encumbrance before allocation', 'Allocate in shadow mode; obtain custody acknowledgement before treating an asset as mobilised', 'Release only after obligation status and authority are confirmed; reconcile inventory, register and settlement records'], architecture: ['Legal agreement and authoritative collateral register define rights, substitution and release conditions.', 'Collateral operations own eligibility, valuation, haircut and concentration adjudication; custody confirms control and availability.', 'A pre-pledge allocation proposal is distinct from pledge execution and release; settlement records retain separate accepted, delivered and released states.', 'Model settlement cash, fees and shortfall funding separately; do not treat tokenised collateral as cash.', 'Token representation is optional. Use it only if its measured shared-state or conditional-settlement benefit exceeds conventional workflow cost and control impact.'], measures: ['Time from margin call to confirmed allocation and delivery', 'Eligible collateral utilisation and substitution turnaround', 'Manual touchpoints, exceptions and reconciliation breaks', 'Settlement failures, stale-data blocks and recovery time'] },
  };
  const mechanisms = mechanismOptions.filter(([key]) => input.tokenisationMechanisms.includes(key)).map(([, label]) => label);
  const nextActions = verdict === 'NO-GO' ? ['Retain the incumbent process; quantify any future material workflow change before reopening the decision.'] : open.length ? reasonByGate : ['Approve a bounded shadow pilot with named business, legal, collateral, custody, settlement and technology owners.', 'Capture a verified incumbent baseline and source references before configuration.', 'Run incumbent and proposed cases with the same data; record cost, time, exceptions and control impact.', 'Review pilot evidence independently before any live asset movement.'];
  const failureScenarios = input.useCase === 'collateral' ? [
    { id: 'insufficient-cash', name: 'Insufficient settlement cash', expected: 'Block cash settlement, preserve both obligations and identify the funding owner.' },
    { id: 'ineligible-collateral', name: 'Ineligible collateral', expected: 'Reject allocation against the governing eligibility and haircut rules; retain a reason code.' },
    { id: 'failed-delivery', name: 'Failed delivery', expected: 'Keep the margin obligation open; do not mark collateral mobilised without source confirmation.' },
    { id: 'stale-data', name: 'Stale valuation or inventory data', expected: 'Block allocation until an authoritative fresh observation is received.' },
    { id: 'reconciliation-mismatch', name: 'Reconciliation mismatch', expected: 'Open a break across agreement, inventory, custody and settlement records; never silently repair.' },
  ] : [
    { id: 'insufficient-cash', name: 'Insufficient settlement cash', expected: 'Block movement and preserve both obligations.' },
    { id: 'failed-delivery', name: 'Failed delivery', expected: 'Keep the transaction pending until authoritative confirmation.' },
    { id: 'reconciliation-mismatch', name: 'Reconciliation mismatch', expected: 'Open a break for accountable operations review.' },
  ];
  const assumptions = [
    ...(evidenceQuality !== 'user-confirmed' ? ['Baseline narrative is marked as an assumption or missing; it has not been verified.'] : ['Baseline source is user-marked verified and has not been independently checked.']),
    ...(qualities(economics.proposedQuality) !== 'user-confirmed' ? ['Proposed cost/time/exception values are assumptions, not measured outcomes.'] : []),
    ...(altQuality !== 'user-confirmed' ? ['Conventional alternative assessment is not user-confirmed.'] : []),
    ...gates.filter(g => g.status === 'READY' && g.evidenceQuality !== 'user-confirmed').map(g => `${g.label} is marked ready by the user but its evidence is ${g.evidenceQuality}.`),
  ];
  const decisionDrivers = verdict === 'NO-GO' ? [noGoReason] : verdict === 'HOLD' ? reasonByGate : ['A traceable baseline and direct conventional alternative comparison are present.', 'At least one comparable cost, time or exception measure improves in the proposed case.', 'Minimum legal, collateral, custody, cash and technology dependencies have named owners.'];
  return { verdict, rationale: `${rationale}${mechanisms.length ? ` Selected mechanisms: ${mechanisms.join('; ')}.` : ''}`, gates, pilotScope: blueprints[input.useCase].scope, architecture: blueprints[input.useCase].architecture, successMeasures: blueprints[input.useCase].measures, nextActions, decisionDrivers, economicSummary: compare, failureScenarios, assumptions };
}

export function simulateSingleGateChange(input: UseCaseInputs, gateId: string): Decision['verdict'] {
  return simulateSingleGate(input, gateId).verdict;
}

export function simulateSingleGate(input: UseCaseInputs, gateId: string): { verdict: Decision['verdict']; remainingOpenGates: string[] } {
  const copy: UseCaseInputs = structuredClone(input);
  switch (gateId) {
    case 'problem': copy.frictions = ['reconciliation']; break;
    case 'evidence':
      if (copy.baselineEvidence.trim().length >= 12 && copy.baselineEvidenceSource.trim().length >= 3) copy.baselineEvidenceQuality = 'user-confirmed';
      break;
    case 'scale': copy.annualEvents = Math.max(1, copy.annualEvents); copy.participants = Math.max(2, copy.participants); break;
    case 'mechanism': copy.tokenisationMechanisms = copy.tokenisationMechanisms.length ? copy.tokenisationMechanisms : ['shared-state']; break;
    case 'alternative':
      if (copy.existingSystemGap.trim().length >= 12) {
        copy.alternativeEvidenceQuality = 'user-confirmed';
        if (copy.conventionalAlternative === 'not-assessed') copy.conventionalAlternative = 'insufficient';
      }
      break;
    case 'economic':
      // A what-if can promote existing sourced values, but never invent measurements.
      if (copy.economics.sourceNote.trim().length >= 12 && economicValuesExist(copy.economics)) copy.economics.baselineQuality = 'user-confirmed';
      if (copy.baselineEvidence.trim().length >= 12 && copy.baselineEvidenceSource.trim().length >= 3) copy.baselineEvidenceQuality = 'user-confirmed';
      break;
    case 'authority': copy.readiness.legalRegisterKnown = true; break;
    case 'rights': copy.readiness.transferRulesDefined = true; break;
    case 'eligibility': copy.readiness.collateralEligibilityKnown = true; break;
    case 'custody': copy.readiness.custodyControlKnown = true; break;
    case 'technology': copy.readiness.technologyBoundaryDefined = true; break;
    case 'cash': copy.readiness.settlementRouteKnown = true; break;
    case 'owner': copy.readiness.accountableOwner = true; break;
    case 'counterparty': copy.readiness.pilotCounterpartyIdentified = true; break;
    case 'data': copy.readiness.usableDataAvailable = true; break;
    default: {
      const unchanged = evaluateUseCase(input);
      return { verdict: unchanged.verdict, remainingOpenGates: unchanged.gates.filter(g => g.status === 'OPEN').map(g => g.label) };
    }
  }
  const result = evaluateUseCase(copy);
  return { verdict: result.verdict, remainingOpenGates: result.gates.filter(g => g.status === 'OPEN').map(g => g.label) };
}

function economicValuesExist(e: EconomicCase): boolean {
  return [e.baselineCostPerEventEur, e.proposedCostPerEventEur, e.baselineHoursPerEvent, e.proposedHoursPerEvent,
    e.baselineExceptionRatePct, e.proposedExceptionRatePct].some(value => safeNonNegative(value) !== null);
}
