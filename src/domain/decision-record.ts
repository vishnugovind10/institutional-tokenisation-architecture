import { DECISION_ENGINE_VERSION, type Decision, type UseCaseInputs } from './use-case-decision';
export type DecisionRecord = {
  schemaVersion: '2.0'; engineVersion: string; version: number; generatedAt: string; title: string;
  workflow: string; verdict: Decision['verdict']; rationale: string; inputs: UseCaseInputs; decision: Decision;
  architecture: { proposedModel: string[]; systemOfRecord: { domain: string; authoritativeRecord: string; owner: string }[] };
  dependencies: Decision['gates']; evidenceRegister: { item: string; quality: string; source: string; owner: string }[];
  remediation: { action: string; owner: string; status: 'OPEN' }[];
  reviewHistory: { action: string; at: string; actor: string; comment: string }[];
};
export function createDecisionRecord(args: { title: string; version: number; inputs: UseCaseInputs; decision: Decision; reviewHistory?: DecisionRecord['reviewHistory']; at?: string }): DecisionRecord {
  const { inputs, decision } = args;
  const systemOfRecord = inputs.useCase === 'collateral' ? [
    { domain: 'Legal rights', authoritativeRecord: 'Collateral agreement and legal collateral register', owner: inputs.dependencyOwners.authority },
    { domain: 'Eligibility and valuation', authoritativeRecord: 'Collateral eligibility rules, valuation source and haircut schedule', owner: inputs.dependencyOwners.eligibility },
    { domain: 'Asset inventory', authoritativeRecord: 'Custodian inventory and encumbrance record', owner: inputs.dependencyOwners.custody },
    { domain: 'Settlement', authoritativeRecord: 'Settlement operator status and cash account record', owner: inputs.dependencyOwners.cash },
    { domain: 'Operational state', authoritativeRecord: 'Allocation coordinator and independent reconciliation evidence', owner: inputs.dependencyOwners.owner },
  ] : [
    { domain: 'Legal rights', authoritativeRecord: 'Instrument legal register and transfer rules', owner: inputs.dependencyOwners.authority },
    { domain: 'Financial asset', authoritativeRecord: 'Issuer, transfer agent or fund register (confirm per use case)', owner: inputs.dependencyOwners.rights },
    { domain: 'Cash and settlement', authoritativeRecord: 'Named settlement operator and cash account record', owner: inputs.dependencyOwners.cash },
    { domain: 'Operational state', authoritativeRecord: 'Workflow coordinator and reconciliation evidence', owner: inputs.dependencyOwners.owner },
  ];
  const evidenceRegister = [
    { item: 'Operational baseline', quality: inputs.baselineEvidenceQuality, source: inputs.baselineEvidenceSource || 'Not supplied', owner: inputs.dependencyOwners.data },
    { item: 'Conventional alternative comparison', quality: inputs.alternativeEvidenceQuality, source: inputs.existingSystemGap || 'Not supplied', owner: inputs.dependencyOwners.technology },
    { item: 'Economic baseline', quality: inputs.economics.baselineQuality, source: inputs.economics.sourceNote || 'Not supplied', owner: inputs.dependencyOwners.owner },
    { item: 'Proposed outcome', quality: inputs.economics.proposedQuality, source: inputs.economics.sourceNote || 'Not supplied', owner: inputs.dependencyOwners.owner },
    ...decision.gates.filter(g => !['problem','evidence','scale','mechanism','alternative','economic'].includes(g.id)).map(g => ({ item: g.label, quality: g.evidenceQuality, source: g.status === 'READY' ? 'User-marked ready; not independently verified' : 'Missing or unresolved', owner: g.owner })),
  ];
  return {
    schemaVersion: '2.0', engineVersion: DECISION_ENGINE_VERSION, version: Math.max(1, Math.floor(args.version)), generatedAt: args.at || new Date().toISOString(),
    title: args.title.trim() || 'Collateral allocation and settlement assessment', workflow: inputs.useCase, verdict: decision.verdict, rationale: decision.rationale,
    inputs: structuredClone(inputs), decision: structuredClone(decision),
    architecture: { proposedModel: decision.architecture, systemOfRecord }, dependencies: decision.gates,
    evidenceRegister, remediation: decision.gates.some(gate => gate.status === 'OPEN')
      ? decision.gates.filter(gate => gate.status === 'OPEN').map(gate => ({ action: `${gate.label}: ${gate.consequence}`, owner: gate.owner, status: 'OPEN' as const }))
      : decision.nextActions.map(action => ({ action, owner: inputs.dependencyOwners.owner || 'Unassigned', status: 'OPEN' as const })), reviewHistory: args.reviewHistory || [],
  };
}
const safe = (value: unknown) => String(value ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
export function decisionRecordMarkdown(record: DecisionRecord): string {
  const table = (headers: string[], rows: string[][]) => `| ${headers.join(' | ')} |\n| ${headers.map(() => '---').join(' | ')} |\n${rows.map(row => `| ${row.map(safe).join(' | ')} |`).join('\n')}`;
  const economics = record.decision.economicSummary;
  return [
    `# Decision record — ${record.title}`, '', `**Recommendation:** ${record.verdict} · **Version:** ${record.version} · **Engine:** ${record.engineVersion}`, '', `Generated: ${record.generatedAt}. Synthetic decision aid; user-supplied evidence and assumptions are not independently verified.`, '',
    '## Executive recommendation', '', record.rationale, '', ...record.decision.decisionDrivers.map(line => `- ${line}`), '',
    '## Business problem and baseline', '', `Workflow: ${record.workflow}. ${record.inputs.annualEvents} events/year across ${record.inputs.participants} parties.`, '', record.inputs.baselineEvidence || 'Baseline not supplied.', '', `Source: ${record.inputs.baselineEvidenceSource || 'Not supplied'} · Quality: ${record.inputs.baselineEvidenceQuality}.`, '',
    '## Conventional alternative', '', `Assessment: ${record.inputs.conventionalAlternative} · Evidence: ${record.inputs.alternativeEvidenceQuality}.`, '', record.inputs.existingSystemGap || 'No comparison supplied.', '',
    '## Economic case', '', table(['Measure','Current baseline','Proposed target','Annualised difference','Evidence'], [
      ['Cost per event (€)', String(record.inputs.economics.baselineCostPerEventEur ?? 'Missing'), String(record.inputs.economics.proposedCostPerEventEur ?? 'Missing'), economics.annualCostSavingEur === null ? 'Not quantified' : `€${economics.annualCostSavingEur.toFixed(2)} / year`, record.inputs.economics.proposedQuality],
      ['Hours per event', String(record.inputs.economics.baselineHoursPerEvent ?? 'Missing'), String(record.inputs.economics.proposedHoursPerEvent ?? 'Missing'), economics.annualHoursSaved === null ? 'Not quantified' : `${economics.annualHoursSaved.toFixed(2)} hours / year`, record.inputs.economics.proposedQuality],
      ['Exception rate (%)', String(record.inputs.economics.baselineExceptionRatePct ?? 'Missing'), String(record.inputs.economics.proposedExceptionRatePct ?? 'Missing'), economics.annualExceptionsAvoided === null ? 'Not quantified' : `${economics.annualExceptionsAvoided.toFixed(2)} / year`, record.inputs.economics.proposedQuality],
    ]), '', `One-time implementation cost: €${record.inputs.economics.oneTimeImplementationCostEur ?? 'Not supplied'} · Annual operating cost: €${record.inputs.economics.annualOperatingCostEur ?? 'Not supplied'} · Net first year: ${economics.netFirstYearEur === null ? 'Not quantified' : `€${economics.netFirstYearEur.toFixed(2)}`} · Net recurring: ${economics.netRecurringEur === null ? 'Not quantified' : `€${economics.netRecurringEur.toFixed(2)}`}.`, '', economics.note, '',
    '## Proposed architecture and system of record', '', ...record.architecture.proposedModel.map(x => `- ${x}`), '', table(['Domain','Authoritative record','Owner'], record.architecture.systemOfRecord.map(x => [x.domain,x.authoritativeRecord,x.owner])), '',
    '## Dependencies and evidence quality', '', table(['Dependency','Status','Evidence quality','Owner','What remains'], record.dependencies.map(g => [g.label,g.status,g.evidenceQuality,g.owner,g.status === 'OPEN' ? g.consequence : '']),), '',
    '## Failure scenarios', '', ...record.decision.failureScenarios.map(s => `- **${s.name}:** ${s.expected}`), '',
    '## Remediation and next decisions', '', ...record.remediation.map(r => `- [ ] ${r.action} · Owner: ${r.owner}`), '',
    '## Review history', '', record.reviewHistory.length ? table(['Action','Date','Reviewer','Rationale'],record.reviewHistory.map(r => [r.action,r.at,r.actor,r.comment])) : 'No independent review actions recorded for this version.', '',
    '## Record assumptions and limitations', '', ...record.decision.assumptions.map(x => `- ${x}`), '', 'The tool does not verify external data, legal rights, custody control, counterparty commitment, regulatory compliance or economic outcomes. A PILOT CANDIDATE is not production approval.', '',
  ].join('\n');
}
