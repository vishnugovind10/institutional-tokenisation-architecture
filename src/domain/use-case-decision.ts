export type UseCase = 'tokenised-bond' | 'fund-units' | 'private-credit' | 'collateral';
export type Friction = 'reconciliation' | 'settlement-delay' | 'fragmented-register' | 'servicing-cost' | 'distribution-friction' | 'manual-eligibility';
export type Readiness = {
  legalRegisterKnown: boolean;
  transferRulesDefined: boolean;
  settlementRouteKnown: boolean;
  accountableOwner: boolean;
  pilotCounterpartyIdentified: boolean;
  usableDataAvailable: boolean;
};
export type UseCaseInputs = {
  useCase: UseCase;
  annualEvents: number;
  participants: number;
  frictions: Friction[];
  baselineEvidence: string;
  readiness: Readiness;
};
export type Gate = { id: string; label: string; status: 'READY' | 'OPEN'; consequence: string };
export type Decision = {
  verdict: 'NO-GO' | 'HOLD' | 'PILOT CANDIDATE';
  rationale: string;
  gates: Gate[];
  pilotScope: string[];
  architecture: string[];
  successMeasures: string[];
  nextActions: string[];
};
export const defaultUseCaseInputs: UseCaseInputs = {
  useCase: 'tokenised-bond',
  annualEvents: 24,
  participants: 8,
  frictions: ['reconciliation', 'settlement-delay', 'servicing-cost'],
  baselineEvidence: '',
  readiness: {
    legalRegisterKnown: true,
    transferRulesDefined: false,
    settlementRouteKnown: true,
    accountableOwner: true,
    pilotCounterpartyIdentified: false,
    usableDataAvailable: true,
  },
};
const frictionLabels: Record<Friction, string> = {
  reconciliation: 'Manual or delayed reconciliation',
  'settlement-delay': 'Slow or uncertain settlement',
  'fragmented-register': 'Fragmented ownership or position records',
  'servicing-cost': 'High servicing and administration effort',
  'distribution-friction': 'Restricted distribution or investor onboarding friction',
  'manual-eligibility': 'Manual eligibility and transfer checks',
};
export function evaluateUseCase(input: UseCaseInputs): Decision {
  const gates: Gate[] = [
    { id: 'problem', label: 'Operational problem identified', status: input.frictions.length > 0 ? 'READY' : 'OPEN', consequence: 'A token is not a business case. Identify a recurring or material workflow failure before selecting technology.' },
    { id: 'evidence', label: 'Baseline evidence captured', status: input.baselineEvidence.trim().length >= 12 ? 'READY' : 'OPEN', consequence: 'Capture current processing time, exception rate, reconciliation effort, cost or settlement failure evidence.' },
    { id: 'authority', label: 'Authoritative legal register identified', status: input.readiness.legalRegisterKnown ? 'READY' : 'OPEN', consequence: 'Name the authoritative record of legal ownership and the party empowered to update it.' },
    { id: 'rights', label: 'Transfer and eligibility rules defined', status: input.readiness.transferRulesDefined ? 'READY' : 'OPEN', consequence: 'Document transfer restrictions, investor eligibility, consent requirements and the legally effective transfer event.' },
    { id: 'cash', label: 'Cash settlement route identified', status: input.readiness.settlementRouteKnown ? 'READY' : 'OPEN', consequence: 'Specify the cash instrument, payment operator, operating hours, cut-offs and failure/recovery path. Do not assume tokenised cash.' },
    { id: 'owner', label: 'Accountable operating owner assigned', status: input.readiness.accountableOwner ? 'READY' : 'OPEN', consequence: 'Assign an owner for the workflow, exceptions, reconciliation and ongoing operations.' },
    { id: 'counterparty', label: 'Pilot counterparty identified', status: input.readiness.pilotCounterpartyIdentified ? 'READY' : 'OPEN', consequence: 'Identify at least one real issuer, investor, custodian, transfer agent or settlement participant willing to test the workflow.' },
    { id: 'data', label: 'Usable workflow data available', status: input.readiness.usableDataAvailable ? 'READY' : 'OPEN', consequence: 'Secure representative, permissioned data for a baseline and shadow run; synthetic data alone cannot validate the business case.' },
  ];
  gates.splice(2, 0, { id: 'scale', label: 'Multi-party workflow is in scope', status: input.annualEvents >= 1 && input.participants >= 2 ? 'READY' : 'OPEN', consequence: 'Confirm at least one real workflow event per year and two or more participating parties; otherwise a conventional process may be simpler.' });
  const open = gates.filter(g => g.status === 'OPEN');
  const problem = gates[0];
  const evidence = gates[1];
  let verdict: Decision['verdict'];
  let rationale: string;
  if (problem.status === 'OPEN') {
    verdict = 'NO-GO';
    rationale = 'No operational problem has been selected. Do not introduce tokenisation until a material workflow problem and a measurable outcome are identified.';
  } else if (evidence.status === 'OPEN') {
    verdict = 'HOLD';
    rationale = 'A plausible workflow problem is selected, but there is no baseline evidence to establish whether a new architecture would improve it.';
  } else if (open.length > 0) {
    verdict = 'HOLD';
    rationale = `The use case has a stated problem and baseline, but ${open.length} decision gate(s) remain open. Resolve these before committing to a pilot or choosing a ledger.`;
  } else {
    verdict = 'PILOT CANDIDATE';
    rationale = 'The workflow has a stated problem, baseline evidence, accountable participants and minimum legal, settlement and data prerequisites. This supports a bounded pilot proposal, not production approval.';
  }
  const blueprints: Record<UseCase, { scope: string[]; architecture: string[]; measures: string[] }> = {
    'tokenised-bond': {
      scope: ['One instrument and one issuance event', 'Investor eligibility and allocation', 'Authoritative register update and position reconciliation', 'One servicing event such as coupon calculation; exclude open secondary trading initially'],
      architecture: ['Keep the legally authoritative register explicit; treat the DLT record as a representation unless legal analysis establishes otherwise.', 'Use existing cash rails for the first pilot unless counterparties can access an agreed tokenised-money instrument.', 'Model asset and cash legs as coordinated unless both demonstrably share an atomic settlement boundary.'],
      measures: ['Time from allocation instruction to reconciled investor positions', 'Manual reconciliation hours and exception rate', 'Settlement completion time and unresolved breaks', 'Cost per issuance / servicing event'],
    },
    'fund-units': {
      scope: ['One fund share class and transfer-agent workflow', 'Investor onboarding and eligibility', 'Subscription and redemption processing', 'Position reconciliation between transfer agent and token representation'],
      architecture: ['Keep the transfer agent and official unit register as the source of legal truth unless the governing framework says otherwise.', 'Model dealing cut-offs, NAV availability, gates and redemption liquidity explicitly.', 'Separate investor eligibility from technical wallet eligibility.'],
      measures: ['Subscription / redemption processing time', 'Transfer-agent reconciliation effort and breaks', 'Investor onboarding completion time', 'Failed or delayed dealing instructions'],
    },
    'private-credit': {
      scope: ['One loan or participation structure', 'Investor allocation and transfer-consent workflow', 'Servicing cashflow and position reporting', 'Exception handling for amendments and repayments'],
      architecture: ['Keep loan administration and contractual obligations authoritative; represent participation rights without implying that token transfer changes borrower obligations.', 'Model consent, eligibility, confidentiality and servicing-agent roles.', 'Use a controlled cashflow ledger and reconcile distributions to the loan servicer.'],
      measures: ['Time to onboard and allocate investors', 'Time to reconcile loan positions and distributions', 'Servicing cost per reporting period', 'Transfer-consent turnaround and exception rate'],
    },
    collateral: {
      scope: ['One collateral agreement and one margin-call type', 'Eligibility and haircut adjudication', 'Inventory availability and concentration checks', 'Shadow allocation only; no live pledge or movement of assets'],
      architecture: ['Keep legal entitlement, custody control and settlement availability as separate checks.', 'Treat pre-pledge allocation as a decision workflow distinct from pledge execution.', 'Do not equate 24/7 ledger availability with legal transferability or cash settlement.'],
      measures: ['Time to produce a defensible allocation', 'Rejected-asset reasons and manual overrides', 'Shortfall detection time', 'Allocation reproducibility and audit completeness'],
    },
  };
  const blueprint = blueprints[input.useCase];
  const nextActions = verdict === 'NO-GO'
    ? ['Interview the process owner and identify the actual operational failure.', 'Quantify the current cost, delay, exception rate or liquidity impact.', 'Re-run this assessment only when a measurable problem is evidenced.']
    : open.length
      ? open.map(g => g.consequence)
      : ['Agree a narrow shadow-pilot boundary and named participants.', 'Capture a representative baseline before introducing the tokenised workflow.', 'Run the same cases through the current process and proposed design; compare measured outcomes.', 'Obtain legal, compliance, custody and operational sign-off before any live asset movement.'];
  rationale += ` Workflow baseline: ${Math.max(0, Math.floor(input.annualEvents))} events/year across ${Math.max(0, Math.floor(input.participants))} parties.`;
  return {
    verdict,
    rationale,
    gates,
    pilotScope: blueprint.scope,
    architecture: blueprint.architecture,
    successMeasures: blueprint.measures,
    nextActions,
  };
}
export const frictionOptions = Object.entries(frictionLabels) as [Friction, string][];
