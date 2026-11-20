export type Outcome = 'PASS' | 'WARNING' | 'FAIL' | 'UNASSESSED' | 'NOT APPLICABLE';
export type MoneyType = 'deposit' | 'cbdc' | 'stablecoin' | 'existing-rails';
export type DepositModel = 'mirror' | 'omnibus';
export type CustodyType = 'hsm' | 'mpc' | 'hybrid' | 'third-party';
export type Topology = 'single-ledger' | 'multiple-ledgers' | 'shared-coordination' | 'existing-systems';
export type SettlementModel = 'atomic' | 'coordinated' | 'payment-rails' | 'escrow';

export type ArchitectureConfig = {
  issuerType: 'Bank' | 'Corporate issuer' | 'Fund';
  instrument: 'Bond' | 'Fund units';
  assetClass: 'Debt security' | 'Fund unit';
  currency: 'EUR' | 'USD' | 'GBP';
  issueSizeUnits: number;
  faceValueMinor: number;
  maturityDate: string;
  couponBps: number;
  investorCategories: string[];
  transferRestrictions: boolean;
  jurisdiction: string;
  legalRegister: string;
  issuanceAuthority: string;
  transferAgent: string;
  money: MoneyType;
  depositModel: DepositModel;
  coreBankAuthority: boolean;
  mirrorSynchronization: boolean;
  omnibusBackingDefined: boolean;
  entitlementModel: boolean;
  redemptionOwner: string;
  liquidityOwner: string;
  moneyReconciliation: boolean;
  dlt: string;
  topology: Topology;
  settlement: SettlementModel;
  settlementDomain: 'shared' | 'separate';
  cashMechanism: 'same-ledger' | 'linked-ledger' | 'offchain-rail';
  custody: CustodyType;
  hsmAvailable: boolean;
  mpcAvailableSigners: number;
  mpcThreshold: number;
  custodyPolicy: boolean;
  makerChecker: boolean;
  keyRecovery: boolean;
  canonicalIds: boolean;
  idempotency: boolean;
  timeoutAndRecovery: boolean;
  independentObservers: boolean;
  visibilityBoundary: boolean;
  legalFinalityAssessment: boolean;
  iso20022Mapping: boolean;
};

export const defaultArchitecture: ArchitectureConfig = {
  issuerType: 'Bank', instrument: 'Bond', assetClass: 'Debt security', currency: 'EUR',
  issueSizeUnits: 100_000, faceValueMinor: 100_000, maturityDate: '2031-11-20', couponBps: 350,
  investorCategories: ['Professional investor', 'Eligible counterparty'], transferRestrictions: true,
  jurisdiction: 'European Union', legalRegister: 'Transfer-agent register', issuanceAuthority: 'Issuer governance committee',
  transferAgent: 'Issuer-appointed transfer agent', money: 'deposit', depositModel: 'mirror', coreBankAuthority: true,
  mirrorSynchronization: true, omnibusBackingDefined: true, entitlementModel: true, redemptionOwner: 'Issuer treasury',
  liquidityOwner: 'Issuer treasury', moneyReconciliation: true, dlt: 'Canton', topology: 'multiple-ledgers',
  settlement: 'coordinated', settlementDomain: 'separate', cashMechanism: 'linked-ledger', custody: 'mpc',
  hsmAvailable: true, mpcAvailableSigners: 3, mpcThreshold: 2, custodyPolicy: true, makerChecker: true,
  keyRecovery: true, canonicalIds: true, idempotency: true, timeoutAndRecovery: true,
  independentObservers: true, visibilityBoundary: true, legalFinalityAssessment: false, iso20022Mapping: true,
};

export type Finding = { id: string; domain: string; status: Outcome; description: string; finding: string; impact: string; evidence: string; remediation: string };
export type RealizedSettlement = { requested: SettlementModel; effective: 'atomic' | 'coordinated'; reason: string };
const finding = (id: string, domain: string, status: Outcome, description: string, findingText: string, impact: string, evidence: string, remediation: string): Finding => ({ id, domain, status, description, finding: findingText, impact, evidence, remediation });

export function resolveSettlement(c: ArchitectureConfig): RealizedSettlement {
  const sameAtomicDomain = c.settlementDomain === 'shared' && c.cashMechanism === 'same-ledger' && c.topology === 'single-ledger';
  if (c.settlement === 'atomic' && sameAtomicDomain) return { requested: c.settlement, effective: 'atomic', reason: 'Selected shared settlement domain, single ledger and same-ledger cash mechanism are modeled as one settlement boundary.' };
  if (c.settlement === 'atomic') return { requested: c.settlement, effective: 'coordinated', reason: 'The configured asset and cash systems do not share a supported atomic settlement boundary; intermediate states and recovery remain possible.' };
  return { requested: c.settlement, effective: 'coordinated', reason: 'The selected model coordinates obligations across workflow steps and does not claim cross-system atomicity.' };
}

export function validateArchitecture(c: ArchitectureConfig): Finding[] {
  const out: Finding[] = [];
  const authority = Boolean(c.legalRegister.trim() && c.issuanceAuthority.trim() && c.transferAgent.trim());
  out.push(finding('AST-001','Asset authority',authority?'PASS':'FAIL','Legal register, issuance authority and transfer-agent responsibility are identified.',authority?'Authoritative records and issuance responsibility are named.':'One or more asset authority roles are missing.',authority?'Authority gaps are reduced.':'Issuance rights and ownership updates may be ambiguous.',`register=${c.legalRegister||'unset'}; authority=${c.issuanceAuthority||'unset'}; transferAgent=${c.transferAgent||'unset'}`, 'Name the authoritative legal register, accountable issuer authority and transfer-agent role.'));
  const supply = Number.isSafeInteger(c.issueSizeUnits) && c.issueSizeUnits > 0 && Number.isSafeInteger(c.faceValueMinor) && c.faceValueMinor > 0;
  out.push(finding('AST-002','Asset controls',supply?'PASS':'FAIL','Authorized instrument supply and unit denomination are valid positive integers.',supply?'Issue size and denomination can be represented without fractional minor units.':'Issue size or denomination is invalid.',supply?'Supply can be bounded.':'The engine cannot enforce a reliable supply or financial amount limit.',`issueSizeUnits=${c.issueSizeUnits}; faceValueMinor=${c.faceValueMinor}`, 'Use positive integer issue units and a positive minor-unit denomination.'));
  out.push(finding('AST-003','Investor controls',c.investorCategories.length&&c.transferRestrictions?'PASS':c.investorCategories.length?'WARNING':'FAIL','Investor categories and transfer restrictions are configured.',c.investorCategories.length?`${c.investorCategories.length} investor categories; transfer restrictions ${c.transferRestrictions?'enabled':'disabled'}.`:'No investor category is defined.',c.investorCategories.length?'Eligibility can be modeled for the listed categories.':'Unspecified eligibility may permit an ineligible allocation.',`categories=${c.investorCategories.join(',')||'none'}; restricted=${c.transferRestrictions}`, 'Define eligible investor categories and apply transfer controls required by the instrument.'));
  if (c.money === 'deposit' && c.depositModel === 'mirror') {
    const ok=c.coreBankAuthority&&c.mirrorSynchronization&&c.moneyReconciliation;
    out.push(finding('MON-001','Digital money',ok?'PASS':'FAIL','Deposit mirror retains core-banking authority, controlled synchronization and reconciliation.',ok?'Core banking is authoritative and mirror synchronization and reconciliation are configured.':'One or more mirror controls are absent.',ok?'Underlying deposit and token positions have explicit synchronization controls.':'Token balances may diverge from the underlying bank deposit without detection or authority.',`coreBankAuthority=${c.coreBankAuthority}; synchronization=${c.mirrorSynchronization}; reconciliation=${c.moneyReconciliation}`, 'Keep core banking authoritative, define controlled synchronization and reconcile both deposit representations.'));
  } else if (c.money === 'deposit' && c.depositModel === 'omnibus') {
    const ok=c.omnibusBackingDefined&&c.entitlementModel&&c.moneyReconciliation;
    out.push(finding('MON-002','Digital money',ok?'PASS':'FAIL','Omnibus backing, investor entitlement and reconciliation are defined.',ok?'Pool backing, entitlement positions and reconciliation are represented.':'Backing, entitlement or reconciliation is undefined.',ok?'Pooled account and token subledger responsibilities can be evaluated separately.':'Token liabilities may not be substantiated against pool assets and investor claims.',`backing=${c.omnibusBackingDefined}; entitlement=${c.entitlementModel}; reconciliation=${c.moneyReconciliation}`, 'Define the pooled backing account, entitlement subledger, liability treatment and reconciliation controls.'));
  } else {
    out.push(finding('MON-003','Digital money','UNASSESSED','Deposit-specific accounting model applies only to tokenised commercial bank deposits.','Selected cash instrument is not configured as tokenised commercial bank deposits.','Issuer liability, reserve or payment-scheme controls require a specific model.','money='+c.money, 'Assess the selected CBDC, stablecoin or existing-rail scheme and its authority, liquidity, redemption and reconciliation rules.'));
  }
  const liquidity=Boolean(c.liquidityOwner.trim()&&c.redemptionOwner.trim());
  out.push(finding('MON-004','Liquidity & redemption',liquidity?'PASS':'FAIL','Liquidity and redemption responsibilities are assigned.',liquidity?'Liquidity and redemption have named owners.':'One or both responsibilities have no owner.',liquidity?'Funding and exit responsibilities are assigned.':'Settlement can fail or redemption rights may lack an accountable operator.',`liquidityOwner=${c.liquidityOwner||'unset'}; redemptionOwner=${c.redemptionOwner||'unset'}`, 'Assign liquidity and redemption responsibilities and define their funding and escalation procedures.'));
  const custodyOk=c.custody==='mpc'?c.mpcThreshold>=1&&c.mpcAvailableSigners>=c.mpcThreshold:c.custody==='hsm'?c.hsmAvailable&&c.custodyPolicy:c.custody==='hybrid'?c.hsmAvailable&&c.mpcAvailableSigners>=c.mpcThreshold&&c.custodyPolicy:Boolean(c.custodyPolicy);
  const custodyEvidence=c.custody==='mpc'?`signers=${c.mpcAvailableSigners}/${c.mpcThreshold}`:c.custody==='hsm'?`serviceAvailable=${c.hsmAvailable}; policy=${c.custodyPolicy}`:`type=${c.custody}; policy=${c.custodyPolicy}`;
  out.push(finding('CUS-001','Custody',custodyOk?'PASS':'FAIL','Selected custody signing service and authorization policy are available.',custodyOk?`Configured ${c.custody} path satisfies modeled availability and policy controls.`:`Configured ${c.custody} path is unavailable or lacks required policy controls.`,custodyOk?'A modeled authorization path exists.':'Unauthorized or unavailable signing must block asset movement.',custodyEvidence, 'Restore the selected signing service, configure policy, and require fresh authorized approval before retry.'));
  out.push(finding('CUS-002','Custody',c.makerChecker?'PASS':'WARNING','Maker-checker segregation of duties is represented.',c.makerChecker?'Independent maker and checker control is configured.':'Independent approval is not modeled.',c.makerChecker?'A second-person authorization control is represented.':'Concentration of authority raises unauthorized transaction risk.',`makerChecker=${c.makerChecker}`, 'Require and evidence independent maker-checker approval for value movement.'));
  out.push(finding('CUS-003','Custody',c.keyRecovery?'PASS':'WARNING','Key recovery and service continuity are defined.',c.keyRecovery?'Key recovery is represented.':'No recovery procedure is configured.',c.keyRecovery?'Recovery has a modeled owner path.':'Key or service loss may prevent authorized operations.',`keyRecovery=${c.keyRecovery}`, 'Define tested recovery, rotation, emergency pause and continuity ownership.'));
  const settlement=resolveSettlement(c);
  out.push(finding('SET-001','Settlement',c.settlement==='atomic'&&settlement.effective==='coordinated'?'FAIL':'PASS','Asset and cash obligations use a settlement model consistent with system boundaries.',settlement.reason,settlement.effective==='atomic'?'Both obligations are within the modeled atomic boundary.':'Independent steps can create intermediate exposure and require recovery.',`requested=${c.settlement}; effective=${settlement.effective}; domain=${c.settlementDomain}; cash=${c.cashMechanism}; topology=${c.topology}`, 'Select a supported shared mechanism or explicitly model coordinated settlement with reservations, timeouts and recovery.'));
  out.push(finding('SET-002','Settlement',c.idempotency?'PASS':'FAIL','Duplicate instructions are prevented through idempotency.',c.idempotency?'Canonical instruction replay protection is configured.':'No duplicate instruction protection is configured.',c.idempotency?'Duplicate requests can be safely recognized.':'Replays may cause duplicate transfers or payments.',`idempotency=${c.idempotency}`, 'Assign stable idempotency keys and persist processed instruction outcomes.'));
  out.push(finding('SET-003','Settlement',c.timeoutAndRecovery?'PASS':'FAIL','Timeouts and unresolved intermediate states have a recovery path.',c.timeoutAndRecovery?'Timeout, pause and recovery controls are represented.':'No timeout/recovery handling is configured.',c.timeoutAndRecovery?'Uncertain outcomes can be held for investigation.':'A failed or delayed leg may be retried unsafely or remain unresolved.',`timeoutAndRecovery=${c.timeoutAndRecovery}`, 'Define timeout windows, pause behavior, observation, escalation and authorized release/retry steps.'));
  out.push(finding('SET-004','Finality',c.legalFinalityAssessment?'WARNING':'UNASSESSED','Technical, operational and legal finality are assessed separately.',c.legalFinalityAssessment?'A legal finality assessment is marked as undertaken; evidence remains external to this tool.':'Legal finality has not been assessed in this workspace.',c.legalFinalityAssessment?'Documented assessment still requires authoritative rule and legal review.':'Do not infer legal settlement from technical ledger confirmation.',`legalFinalityAssessment=${c.legalFinalityAssessment}`, 'Obtain jurisdiction-specific legal and scheme-rule analysis; retain separate technical and operational states.'));
  out.push(finding('INT-001','Interoperability',c.canonicalIds?'PASS':'FAIL','Participating systems share canonical transaction identifiers.',c.canonicalIds?'Canonical identifiers are configured.':'Canonical transaction identity is not represented.',c.canonicalIds?'Events can be correlated across systems.':'Duplicate detection and reconciliation across ledgers are weakened.',`canonicalIds=${c.canonicalIds}`, 'Define stable transaction and instruction identifiers across systems and messages.'));
  out.push(finding('INT-002','Interoperability',c.independentObservers?'PASS':'WARNING','Independent observations and participant visibility boundaries are defined.',c.independentObservers&&c.visibilityBoundary?'Observation and visibility controls are represented.':'Observer or visibility control is incomplete.',c.independentObservers?'Status can be corroborated across the configured boundary.':'A single source may be incomplete or information may be overexposed.',`observers=${c.independentObservers}; visibilityBoundary=${c.visibilityBoundary}`, 'Define independent status sources and role-scoped data visibility.'));
  out.push(finding('INT-003','Integration',c.iso20022Mapping?'WARNING':'UNASSESSED','Integration message semantics are mapped where applicable.',c.iso20022Mapping?'An ISO 20022 conceptual mapping is selected; no interface is implemented.':'ISO 20022 relevance has not been assessed.',c.iso20022Mapping?'Message adapters still require schema, status and version validation.':'System-to-system business references may not reconcile.',`iso20022Mapping=${c.iso20022Mapping}`, 'Map applicable business concepts, source references, statuses, duplicates and versioning to actual interface contracts.'));
  return out;
}

export function assessmentSummary(findings: Finding[]) { return { pass:findings.filter(f=>f.status==='PASS').length, warning:findings.filter(f=>f.status==='WARNING').length, fail:findings.filter(f=>f.status==='FAIL').length, unassessed:findings.filter(f=>f.status==='UNASSESSED').length, notApplicable:findings.filter(f=>f.status==='NOT APPLICABLE').length }; }

export type Workspace = { schemaVersion: 1; id: string; name: string; createdAt: string; updatedAt: string; config: ArchitectureConfig };
export const newWorkspace = (name='Bond issuance architecture'): Workspace => ({ schemaVersion:1, id:crypto.randomUUID(), name, createdAt:new Date().toISOString(), updatedAt:new Date().toISOString(), config:structuredClone(defaultArchitecture) });
export function assertArchitectureConfig(c:ArchitectureConfig){
  if(!Number.isSafeInteger(c.issueSizeUnits)||c.issueSizeUnits<1||!Number.isSafeInteger(c.faceValueMinor)||c.faceValueMinor<1)throw new Error('Issue size and face value must be positive safe integers.');
  if(!Number.isSafeInteger(c.couponBps)||c.couponBps<0||c.couponBps>100_000)throw new Error('Coupon basis points must be an integer from 0 to 100000.');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(c.maturityDate)||Number.isNaN(Date.parse(c.maturityDate)))throw new Error('Maturity date must use a valid YYYY-MM-DD date.');
  if(!['deposit','cbdc','stablecoin','existing-rails'].includes(c.money)||!['mirror','omnibus'].includes(c.depositModel)||!['hsm','mpc','hybrid','third-party'].includes(c.custody)||!['atomic','coordinated','payment-rails','escrow'].includes(c.settlement))throw new Error('Workspace contains an unsupported architecture option.');
  if(!Number.isSafeInteger(c.mpcThreshold)||c.mpcThreshold<1||!Number.isSafeInteger(c.mpcAvailableSigners)||c.mpcAvailableSigners<0)throw new Error('MPC participants and threshold must be non-negative integers with a positive threshold.');
}
export function parseWorkspace(value: unknown): Workspace {
  if (!value || typeof value !== 'object') throw new Error('File is not an architecture workspace.');
  const input=value as Partial<Workspace>;
  if(input.schemaVersion!==1||typeof input.name!=='string'||!input.config||typeof input.config!=='object') throw new Error('Unsupported or incomplete workspace schema. Expected schemaVersion 1 with a configuration.');
  const config={...defaultArchitecture,...input.config} as ArchitectureConfig;
  assertArchitectureConfig(config);
  return { schemaVersion:1, id:typeof input.id==='string'?input.id:crypto.randomUUID(), name:input.name, createdAt:input.createdAt||new Date().toISOString(), updatedAt:new Date().toISOString(), config };
}
